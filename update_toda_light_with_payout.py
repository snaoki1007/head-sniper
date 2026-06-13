import os
import re
import time
from datetime import datetime, timedelta

import pandas as pd
import requests
from bs4 import BeautifulSoup

CSV_PATH = "public/toda_light_with_payout.csv"
JCD = "02"
SLEEP_SEC = 0.5

START_DATE = None
END_DATE = datetime.today().strftime("%Y%m%d")

COLUMNS = [
    "日付", "レース", "開催グレード", "着順", "枠番", "選手番号",
    "進入", "進入変化", "本番ST", "本番F", "展示タイム", "決まり手",
    "3連単配当", "3連単人気", "万舟",
]


def ymd_to_date(ymd):
    return datetime.strptime(str(ymd), "%Y%m%d")


def date_to_ymd(date):
    return date.strftime("%Y%m%d")


def clean_text(text):
    return re.sub(r"\s+", " ", str(text)).strip()


def fetch_soup(url):
    res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    res.encoding = res.apparent_encoding
    if res.status_code != 200:
        return None
    return BeautifulSoup(res.text, "html.parser")


def get_url(page, date_ymd, race_no):
    return (
        f"https://www.boatrace.jp/owpc/pc/race/{page}"
        f"?rno={race_no}&jcd={JCD}&hd={date_ymd}"
    )


def get_existing_races():
    """
    既にCSVにある 日付-レース を記録。
    再実行時に重複追記しないため。
    """
    existing = set()

    if not os.path.exists(CSV_PATH):
        return existing

    df = pd.read_csv(CSV_PATH, dtype=str)

    if df.empty:
        return existing

    for _, row in df.iterrows():
        existing.add((str(row["日付"]), str(row["レース"])))

    return existing


def get_last_date():
    if not os.path.exists(CSV_PATH):
        return None

    df = pd.read_csv(CSV_PATH, dtype=str)

    if df.empty:
        return None

    return int(df["日付"].astype(int).max())


def get_exhibition_times(date_ymd, race_no):
    soup = fetch_soup(get_url("beforeinfo", date_ymd, race_no))
    result = {}

    if soup is None:
        return result

    text = soup.get_text("\n")
    lines = [clean_text(line) for line in text.splitlines()]
    lines = [line for line in lines if line]

    for i, line in enumerate(lines):
        if line in ["1", "2", "3", "4", "5", "6"]:
            block = " ".join(lines[i : i + 10])
            match = re.search(r"\b(6\.\d{2})\b", block)
            if match:
                result[line] = match.group(1)

    return result


def parse_payout_and_popularity(soup):
    lines = [clean_text(line) for line in soup.get_text("\n").splitlines()]
    lines = [line for line in lines if line]

    for i, line in enumerate(lines):
        if line != "3連単":
            continue

        block = " ".join(lines[i : i + 8])

        payout_match = re.search(r"¥\s*([\d,]+)", block)
        if not payout_match:
            payout_match = re.search(r"([\d,]+)\s*円", block)

        popularity_match = None

        # ¥10,730 44 みたいな形
        if payout_match:
            after_payout = block[payout_match.end() :]
            popularity_match = re.search(r"\b(\d{1,3})\b", after_payout)

        payout = payout_match.group(1).replace(",", "") if payout_match else ""
        popularity = popularity_match.group(1) if popularity_match else ""

        return payout, popularity

    return "", ""


def parse_result_rows(date_ymd, race_no):
    soup = fetch_soup(get_url("raceresult", date_ymd, race_no))

    if soup is None:
        return []

    page_text = clean_text(soup.get_text(" "))

    if "データがありません" in page_text or "レース結果がありません" in page_text:
        return []

    payout, popularity = parse_payout_and_popularity(soup)
    exhibition_by_lane = get_exhibition_times(date_ymd, race_no)

    man = "FALSE"
    if payout:
        man = "TRUE" if int(payout) >= 10000 else "FALSE"

    text = soup.get_text("\n")
    lines = [clean_text(line) for line in text.splitlines()]
    lines = [line for line in lines if line]

    rows = []

    finish_map = {
        "１": "1",
        "２": "2",
        "３": "3",
        "４": "4",
        "５": "5",
        "６": "6",
    }

    for i, line in enumerate(lines):
        if line not in ["１", "２", "３", "４", "５", "６"]:
            continue

        if i + 3 >= len(lines):
            continue

        finish = finish_map.get(line, line)
        lane = lines[i + 1]

        if lane not in ["1", "2", "3", "4", "5", "6"]:
            continue

        block = " ".join(lines[i : i + 10])

        racer_match = re.search(r"\b(\d{4})\b", block)
        if not racer_match:
            continue

        racer_no = racer_match.group(1)

        rows.append(
            {
                "日付": date_ymd,
                "レース": str(race_no),
                "開催グレード": "一般",
                "着順": finish,
                "枠番": lane,
                "選手番号": racer_no,
                "進入": lane,
                "進入変化": "FALSE",
                "本番ST": "",
                "本番F": "FALSE",
                "展示タイム": exhibition_by_lane.get(lane, ""),
                "決まり手": "",
                "3連単配当": payout,
                "3連単人気": popularity,
                "万舟": man,
            }
        )

        if len(rows) >= 6:
            break

    # 決まり手
    kimarite = ""
    for word in ["まくり差し", "まくり", "差し", "逃げ", "抜き", "恵まれ"]:
        if word in page_text:
            kimarite = word
            break

    for row in rows:
        row["決まり手"] = kimarite

    # スタート情報
    start_index = None
    for i, line in enumerate(lines):
        if line == "スタート情報":
            start_index = i
            break

    if start_index is not None:
        for lane in range(1, 7):
            lane_text = str(lane)

            for j in range(start_index, min(start_index + 80, len(lines))):
                if lines[j] != lane_text:
                    continue

                block = " ".join(lines[j : j + 6])

                f_match = re.search(r"F\.?(\d{2})", block)
                st_match = re.search(r"\.(\d{2})", block)

                for row in rows:
                    if row["枠番"] == lane_text:
                        if f_match:
                            row["本番ST"] = f"0.{f_match.group(1)}"
                            row["本番F"] = "TRUE"
                        elif st_match:
                            row["本番ST"] = f"0.{st_match.group(1)}"
                        break

                break

    return rows


def append_rows_immediately(rows):
    if not rows:
        return

    df_new = pd.DataFrame(rows)

    for col in COLUMNS:
        if col not in df_new.columns:
            df_new[col] = ""

    df_new = df_new[COLUMNS]

    header = not os.path.exists(CSV_PATH) or os.path.getsize(CSV_PATH) == 0

    df_new.to_csv(
        CSV_PATH,
        mode="a",
        index=False,
        header=header,
        encoding="utf-8-sig",
    )


def main():
    existing_races = get_existing_races()
    last_date = get_last_date()

    if START_DATE:
        start_date = ymd_to_date(START_DATE)
    else:
        if last_date is None:
            print("CSVが空です。START_DATEを指定してください。")
            return
        start_date = ymd_to_date(last_date)

    end_date = ymd_to_date(END_DATE)

    print("========== 戸田CSV 差分更新 ==========")
    print(f"CSV: {CSV_PATH}")
    print(f"開始日: {date_to_ymd(start_date)}")
    print(f"終了日: {date_to_ymd(end_date)}")
    print("保存方式: 1レース取得ごとに即保存")

    if start_date > end_date:
        print("追加対象なし。CSVは最新です。")
        return

    current = start_date
    total_rows = 0
    skipped = 0

    while current <= end_date:
        date_ymd = date_to_ymd(current)

        print(f"\n{date_ymd} 取得開始")

        for race_no in range(1, 13):
            key = (date_ymd, str(race_no))

            if key in existing_races:
                print(f"  {race_no}R 既存スキップ")
                skipped += 1
                continue

            try:
                rows = parse_result_rows(date_ymd, race_no)

                if rows:
                    append_rows_immediately(rows)
                    existing_races.add(key)
                    total_rows += len(rows)
                    print(f"  {race_no}R OK {len(rows)}行 → 即保存")
                else:
                    print(f"  {race_no}R なし")

                time.sleep(SLEEP_SEC)

            except KeyboardInterrupt:
                print("\n中断しました。ここまで取得したレースは保存済みです。")
                print(f"追加行数: {total_rows}行")
                print(f"既存スキップ: {skipped}R")
                return

            except Exception as e:
                print(f"  {race_no}R ERROR: {e}")

        current += timedelta(days=1)

    print("\n========== 完了 ==========")
    print(f"追加行数: {total_rows}行")
    print(f"既存スキップ: {skipped}R")
    print(f"保存先: {CSV_PATH}")


if __name__ == "__main__":
    main()