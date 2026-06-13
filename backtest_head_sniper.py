import pandas as pd
from collections import defaultdict

CSV_PATH = "public/toda_light_with_payout.csv"

BET_YEN = 100
RANGE_MODE = "recent20"
RACE_TYPE = "all"
PROGRESS_EVERY = 100

TEST_START_DATE = 20250101

# "hit" = 的中重視
# "roi" = 回収重視
MODE = "hit"
SKIP_TICKET_COUNTS = []

SKIP_HEAD_LANES = [2,6]

# 的中率を上げたいなら18点も買う
SKIP_TICKET_COUNTS = []

# 共通で見送る条件
SKIP_JUDGMENT_HEAD_COMMON = [
    ("買い", 3),
]

# 回収重視だけ見送る条件
SKIP_JUDGMENT_HEAD_ROI = [
    ("注意", 5),
]


def to_number(value):
    if pd.isna(value):
        return None

    text = str(value).replace(",", "").strip()

    if text == "":
        return None

    try:
        return float(text)
    except ValueError:
        return None


def avg(values):
    valid = [v for v in values if v is not None and not pd.isna(v)]

    if not valid:
        return None

    return sum(valid) / len(valid)


def get_reliability(runs):
    if runs >= 30:
        return "S"
    if runs >= 20:
        return "A"
    if runs >= 10:
        return "B"
    if runs >= 5:
        return "C"
    return "D"


def get_reliability_multiplier(runs):
    if runs >= 30:
        return 1.0
    if runs >= 20:
        return 0.95
    if runs >= 10:
        return 0.85
    if runs >= 5:
        return 0.70
    return 0.50


def get_base_start_point(avg_st):
    if avg_st is None:
        return 0
    if avg_st <= 0.13:
        return 8
    if avg_st <= 0.14:
        return 5
    if avg_st <= 0.15:
        return 2
    if avg_st <= 0.16:
        return -2
    if avg_st <= 0.17:
        return -5
    return -8


def get_lane1_absolute_st_point(avg_st):
    if avg_st is None:
        return 0
    if avg_st <= 0.13:
        return 12
    if avg_st <= 0.14:
        return 8
    if avg_st <= 0.15:
        return 3
    if avg_st <= 0.16:
        return -5
    if avg_st <= 0.17:
        return -9
    if avg_st <= 0.18:
        return -11
    return -18


def get_lane1_relative_average_point(diff):
    if diff is None:
        return 0
    if diff <= -0.05:
        return 12
    if diff <= -0.03:
        return 10
    if diff <= -0.01:
        return 5
    if diff <= 0.01:
        return 0
    if diff <= 0.03:
        return -5
    if diff <= 0.05:
        return -12
    return -28


def get_lane1_relative_fastest_point(diff):
    if diff is None:
        return 0
    if diff <= -0.03:
        return 12
    if diff <= 0:
        return 6
    if diff <= 0.03:
        return -4
    if diff <= 0.05:
        return -10
    return -20


def get_makuri_point(lane, makuri_rate):
    if makuri_rate is None:
        return 0

    if lane == 1:
        return 0

    if lane == 2:
        if makuri_rate < 5:
            return -5
        if makuri_rate < 10:
            return 0
        if makuri_rate < 15:
            return 3
        if makuri_rate < 20:
            return 6
        return 10

    if lane in [3, 4]:
        if makuri_rate < 5:
            return -15
        if makuri_rate < 10:
            return -5
        if makuri_rate < 15:
            return 5
        if makuri_rate < 20:
            return 12
        return 20

    if makuri_rate < 5:
        return -5
    if makuri_rate < 10:
        return 0
    if makuri_rate < 15:
        return 5
    if makuri_rate < 20:
        return 10
    return 15


def get_exhibition_buff_point(lane, st_diff):
    if lane == 2:
        if st_diff >= 0.03:
            return -10
        if st_diff >= 0.01:
            return -5
        if st_diff > -0.01:
            return 0
        if st_diff > -0.03:
            return 5
        if st_diff > -0.05:
            return 12
        return 18

    if lane == 3:
        if st_diff >= 0.03:
            return -5
        if st_diff >= 0.01:
            return 0
        if st_diff > -0.03:
            return 3
        return 8

    if lane == 4:
        if st_diff >= 0.03:
            return -12
        if st_diff >= 0.01:
            return -5
        if st_diff > -0.01:
            return 0
        if st_diff > -0.03:
            return 3
        if st_diff > -0.05:
            return 15
        return 25

    if lane == 5:
        return 10 if st_diff <= -0.03 else 5

    if lane == 6:
        return 8 if st_diff <= -0.03 else 4

    return 0


def get_exhibition_debuff_point(lane, st_diff):
    if lane == 1:
        if st_diff <= -0.05:
            return 0
        if st_diff <= -0.03:
            return -3
        if st_diff <= -0.01:
            return -5
        if st_diff <= 0.01:
            return -10
        if st_diff <= 0.03:
            return -15
        if st_diff <= 0.05:
            return -25
        return -40

    if lane == 3:
        if st_diff <= -0.03:
            return -5
        if st_diff <= 0.01:
            return -10
        if st_diff <= 0.03:
            return -15
        return -22

    if lane in [2, 4]:
        if st_diff <= -0.03:
            return -3
        if st_diff <= 0.01:
            return -7
        if st_diff <= 0.03:
            return -10
        return -15

    if lane == 5:
        if st_diff <= 0.01:
            return -5
        return -10

    return 0


def make_actual_combo(race_rows):
    top3 = [row for row in race_rows if row["着順"] in ["1", "2", "3"]]

    if len(top3) < 3:
        return None

    top3.sort(key=lambda r: int(r["着順"]))
    return "-".join(str(row["枠番"]) for row in top3)


def get_payout(race_rows):
    for row in race_rows:
        payout = to_number(row.get("3連単配当"))

        if payout is not None and payout > 0:
            return int(payout)

    return 0


def make_racer_score(history_by_racer, racer_no, lane, exhibition_time):
    racer_no_text = str(racer_no).strip()
    history = history_by_racer.get(racer_no_text, [])

    if RANGE_MODE == "recent20":
        history = history[-20:]

    lane_history = [
        row for row in history
        if str(row["枠番"]) == str(lane)
    ]

    target = lane_history if len(lane_history) >= 5 else history
    runs = len(target)

    if runs == 0:
        return {
            "lane": lane,
            "racerNo": racer_no_text,
            "exhibitionTime": exhibition_time,
            "runs": 0,
            "firstRate": 0,
            "top3Rate": 0,
            "avgST": None,
            "makuriRate": 0,
            "makuriPoint": 0,
            "reliability": "D",
            "score": 0,
        }

    first_count = sum(1 for row in target if str(row["着順"]) == "1")
    top3_count = sum(1 for row in target if str(row["着順"]) in ["1", "2", "3"])

    first_rate = first_count / runs * 100
    top3_rate = top3_count / runs * 100
    avg_st = avg([to_number(row["本番ST"]) for row in target])

    makuri_wins = sum(
        1
        for row in target
        if str(row["着順"]) == "1" and "まくり" in str(row["決まり手"])
    )

    makuri_rate = makuri_wins / runs * 100
    makuri_point = get_makuri_point(lane, makuri_rate)

    raw_score = (
        first_rate * 1.15
        + top3_rate * 0.25
        + get_base_start_point(avg_st)
        + makuri_point
    )

    score = raw_score * get_reliability_multiplier(runs)

    return {
        "lane": lane,
        "racerNo": racer_no_text,
        "exhibitionTime": exhibition_time,
        "runs": runs,
        "firstRate": first_rate,
        "top3Rate": top3_rate,
        "avgST": avg_st,
        "makuriRate": makuri_rate,
        "makuriPoint": makuri_point,
        "reliability": get_reliability(runs),
        "score": score,
    }


def apply_lane1_st_correction(scores):
    lane1 = next((s for s in scores if s["lane"] == 1), None)
    others = [s for s in scores if s["lane"] != 1 and s["avgST"] is not None]

    if lane1 is None or lane1["avgST"] is None or not others:
        return 0

    others_avg = avg([s["avgST"] for s in others])
    fastest_other = min(s["avgST"] for s in others)

    absolute_point = get_lane1_absolute_st_point(lane1["avgST"])
    relative_average_point = get_lane1_relative_average_point(
        lane1["avgST"] - others_avg
    )
    relative_fastest_point = get_lane1_relative_fastest_point(
        lane1["avgST"] - fastest_other
    )

    total_point = absolute_point + relative_average_point + relative_fastest_point
    lane1["score"] += total_point

    return total_point


def apply_exhibition_correction(scores):
    buff_count = 0
    debuff_count = 0
    buff_point_total = 0
    debuff_point_total = 0

    for score in scores:
        current_ex = to_number(score["exhibitionTime"])

        if current_ex is None:
            continue

        left = next((s for s in scores if s["lane"] == score["lane"] - 1), None)
        right = next((s for s in scores if s["lane"] == score["lane"] + 1), None)

        if left:
            left_ex = to_number(left["exhibitionTime"])

            if left_ex is not None and current_ex <= left_ex - 0.1:
                st_diff = 0

                if score["avgST"] is not None and left["avgST"] is not None:
                    st_diff = score["avgST"] - left["avgST"]

                point = get_exhibition_buff_point(score["lane"], st_diff)
                score["score"] += point

                buff_count += 1
                buff_point_total += point

        if right:
            right_ex = to_number(right["exhibitionTime"])

            if right_ex is not None and current_ex >= right_ex + 0.1:
                st_diff = 0

                if score["avgST"] is not None and right["avgST"] is not None:
                    st_diff = score["avgST"] - right["avgST"]

                point = get_exhibition_debuff_point(score["lane"], st_diff)
                score["score"] += point

                debuff_count += 1
                debuff_point_total += point

    return {
        "展示バフ数": buff_count,
        "展示デバフ数": debuff_count,
        "展示バフ点": buff_point_total,
        "展示デバフ点": debuff_point_total,
    }


def get_judgment(ranking):
    if len(ranking) < 2:
        return "見"

    top = ranking[0]
    second = ranking[1]
    diff = top["score"] - second["score"]

    if top["reliability"] == "D":
        return "見"

    if diff >= 15 and top["reliability"] in ["S", "A", "B"]:
        return "買い"

    if diff >= 8:
        return "注意"

    return "見"


def generate_tickets(ranking, judgment):
    valid = [r for r in ranking if r["racerNo"]]

    if len(valid) < 4:
        return []

    top3_ranking = sorted(valid, key=lambda x: x["top3Rate"], reverse=True)

    # 的中重視：買いでも「頭2頭 × 軸2頭」
    if judgment == "買い" and MODE == "hit":
        heads = valid[:2]
        axes = [top3_ranking[0], top3_ranking[1]]

        worst = sorted(valid, key=lambda x: x["top3Rate"])[0]
        thirds = [r for r in valid if r["lane"] != worst["lane"]]

        tickets = []

        for head in heads:
            for axis in axes:
                if head["lane"] == axis["lane"]:
                    continue

                third_candidates = [
                    third for third in thirds
                    if third["lane"] != head["lane"]
                    and third["lane"] != axis["lane"]
                ]

                for third in third_candidates:
                    tickets.append(f'{head["lane"]}-{axis["lane"]}-{third["lane"]}')
                    tickets.append(f'{head["lane"]}-{third["lane"]}-{axis["lane"]}')

        return list(dict.fromkeys(tickets))

    # 回収重視：買いは従来通り「頭1頭 × 軸1頭」
    if judgment == "買い":
        head = valid[0]
        axis = top3_ranking[0]

        if axis["lane"] == head["lane"]:
            axis = top3_ranking[1]

        worst_candidates = [
            r for r in valid
            if r["lane"] != head["lane"] and r["lane"] != axis["lane"]
        ]

        worst = sorted(worst_candidates, key=lambda x: x["top3Rate"])[0]

        third_candidates = [
            r for r in valid
            if r["lane"] != head["lane"]
            and r["lane"] != axis["lane"]
            and r["lane"] != worst["lane"]
        ]

        tickets = []

        for third in third_candidates:
            tickets.append(f'{head["lane"]}-{axis["lane"]}-{third["lane"]}')
            tickets.append(f'{head["lane"]}-{third["lane"]}-{axis["lane"]}')

        return list(dict.fromkeys(tickets))

    # 注意：的中重視は軸1位2位、回収重視は軸1位3位
    if judgment == "注意":
        heads = valid[:2]

        if MODE == "hit":
            axes = [top3_ranking[0], top3_ranking[1]]
        else:
            axes = [top3_ranking[0], top3_ranking[2]]

        worst = sorted(valid, key=lambda x: x["top3Rate"])[0]
        thirds = [r for r in valid if r["lane"] != worst["lane"]]

        tickets = []

        for head in heads:
            for axis in axes:
                if head["lane"] == axis["lane"]:
                    continue

                third_candidates = [
                    third for third in thirds
                    if third["lane"] != head["lane"]
                    and third["lane"] != axis["lane"]
                ]

                for third in third_candidates:
                    tickets.append(f'{head["lane"]}-{axis["lane"]}-{third["lane"]}')
                    tickets.append(f'{head["lane"]}-{third["lane"]}-{axis["lane"]}')

        return list(dict.fromkeys(tickets))

    return []


def build_date_race_groups(df):
    grouped_by_date = defaultdict(lambda: defaultdict(list))

    for row in df.to_dict("records"):
        date = str(row["日付"])
        race_no = str(row["レース"])
        grouped_by_date[date][race_no].append(row)

    return grouped_by_date


def get_skip_judgment_head_list():
    skip_list = SKIP_JUDGMENT_HEAD_COMMON[:]

    if MODE == "roi":
        skip_list += SKIP_JUDGMENT_HEAD_ROI

    return skip_list


def should_skip_common(head_lane, judgment, tickets):
    if head_lane in SKIP_HEAD_LANES:
        return "頭2・6見送り"

    if (judgment, head_lane) in get_skip_judgment_head_list():
        return "判定×頭艇見送り"

    if len(tickets) in SKIP_TICKET_COUNTS:
        return "18点見送り"

    return None


def should_skip_by_mode(judgment, lane1_st_bonus, makuri_bonus_total):
    if MODE == "hit":
        return None

    if MODE == "roi":
        if judgment == "買い" and makuri_bonus_total < 10:
            return "回収重視_買いまくり不足"

        if judgment == "注意" and lane1_st_bonus >= 0:
            return "回収重視_注意1ST条件不足"

        return None

    return None


def backtest():
    print("CSV読込開始")

    df = pd.read_csv(CSV_PATH, dtype=str).fillna("")

    if RACE_TYPE == "general":
        df = df[df["開催グレード"] == "一般"]

    if RACE_TYPE == "other":
        df = df[df["開催グレード"] != "一般"]

    print(f"CSV読込完了: {len(df):,}行")

    grouped_by_date = build_date_race_groups(df)
    dates = sorted(grouped_by_date.keys(), key=lambda x: int(x))
    total_race_count = sum(len(grouped_by_date[date]) for date in dates)

    print(f"対象レース数: {total_race_count:,}R")
    print(f"検証開始日: {TEST_START_DATE}")
    print(f"モード: {MODE}")
    print(f"見送り頭艇: {SKIP_HEAD_LANES}")
    print(f"見送り買い目点数: {SKIP_TICKET_COUNTS}")
    print(f"見送り判定×頭艇: {get_skip_judgment_head_list()}")
    print("バックテスト開始")

    history_by_racer = defaultdict(list)

    total_races = 0
    buy_races = 0
    hit_count = 0
    investment = 0
    payout_total = 0
    total_tickets = 0
    man_hit_count = 0

    buy_count = 0
    caution_count = 0
    skip_counts = defaultdict(int)

    records = []
    processed_races = 0

    for date in dates:
        date_int = int(date)
        race_map = grouped_by_date[date]

        for race_no in sorted(race_map.keys(), key=lambda x: int(x)):
            race_rows = race_map[race_no]
            processed_races += 1

            if processed_races % PROGRESS_EVERY == 0:
                current_recovery = payout_total / investment * 100 if investment > 0 else 0
                progress = processed_races / total_race_count * 100

                print(
                    f"{processed_races:,}/{total_race_count:,}R "
                    f"({progress:.1f}%) "
                    f"購入{buy_races:,}R "
                    f"的中{hit_count:,}R "
                    f"回収率{current_recovery:.1f}%"
                )

            if len(race_rows) < 6:
                continue

            actual_combo = make_actual_combo(race_rows)
            payout = get_payout(race_rows)

            if actual_combo is None or payout <= 0:
                continue

            racers = []

            for lane in range(1, 7):
                lane_rows = [
                    row for row in race_rows
                    if str(row["枠番"]) == str(lane)
                ]

                if not lane_rows:
                    racers = []
                    break

                row = lane_rows[0]

                racers.append({
                    "lane": lane,
                    "racerNo": row["選手番号"],
                    "exhibitionTime": row["展示タイム"],
                })

            if len(racers) < 6:
                continue

            scores = [
                make_racer_score(
                    history_by_racer,
                    racer["racerNo"],
                    racer["lane"],
                    racer["exhibitionTime"],
                )
                for racer in racers
            ]

            lane1_st_bonus = apply_lane1_st_correction(scores)
            exhibition_info = apply_exhibition_correction(scores)
            makuri_bonus_total = sum(s["makuriPoint"] for s in scores)

            ranking = sorted(
                [{**s, "score": max(0, s["score"])} for s in scores],
                key=lambda x: x["score"],
                reverse=True,
            )

            judgment = get_judgment(ranking)
            head_lane = ranking[0]["lane"]

            if date_int < TEST_START_DATE:
                continue

            total_races += 1

            if judgment == "見":
                skip_counts["見"] += 1
                continue

            tickets = generate_tickets(ranking, judgment)

            if not tickets:
                skip_counts["買い目なし"] += 1
                continue

            skip_reason = should_skip_common(head_lane, judgment, tickets)

            if skip_reason:
                skip_counts[skip_reason] += 1
                continue

            skip_reason = should_skip_by_mode(
                judgment,
                lane1_st_bonus,
                makuri_bonus_total,
            )

            if skip_reason:
                skip_counts[skip_reason] += 1
                continue

            if judgment == "買い":
                buy_count += 1

            if judgment == "注意":
                caution_count += 1

            buy_races += 1
            total_tickets += len(tickets)
            investment += len(tickets) * BET_YEN

            hit = actual_combo in tickets

            if hit:
                hit_count += 1
                payout_total += payout

                if payout >= 10000:
                    man_hit_count += 1

            records.append({
                "日付": date,
                "レース": race_no,
                "判定": judgment,
                "モード": MODE,
                "買い目数": len(tickets),
                "投資額": len(tickets) * BET_YEN,
                "実際": actual_combo,
                "的中": hit,
                "配当": payout if hit else 0,
                "頭1位": ranking[0]["lane"],
                "頭1位スコア": round(ranking[0]["score"], 1),
                "頭2位": ranking[1]["lane"],
                "頭2位スコア": round(ranking[1]["score"], 1),
                "展示バフ数": exhibition_info["展示バフ数"],
                "展示デバフ数": exhibition_info["展示デバフ数"],
                "展示バフ点": exhibition_info["展示バフ点"],
                "展示デバフ点": exhibition_info["展示デバフ点"],
                "1ST補正": lane1_st_bonus,
                "まくり補正": makuri_bonus_total,
                "買い目": " ".join(tickets),
            })

        for race_rows in race_map.values():
            for row in race_rows:
                racer_no = str(row["選手番号"]).strip()
                history_by_racer[racer_no].append(row)

    recovery_rate = payout_total / investment * 100 if investment > 0 else 0
    hit_rate = hit_count / buy_races * 100 if buy_races > 0 else 0
    avg_tickets = total_tickets / buy_races if buy_races > 0 else 0

    result_df = pd.DataFrame(records)
    result_df.to_csv("backtest_result.csv", index=False, encoding="utf-8-sig")

    print("")
    print("========== ヘッドスナイパー 期間分割バックテスト ==========")
    print(f"モード                 : {MODE}")
    print(f"検証開始日             : {TEST_START_DATE}")
    print(f"対象レース数           : {total_races:,}")
    print(f"購入レース数           : {buy_races:,}")
    print(f"買い判定               : {buy_count:,}")
    print(f"注意判定               : {caution_count:,}")

    for key, value in skip_counts.items():
        print(f"{key:<22}: {value:,}")

    print(f"見送り合計             : {total_races - buy_races:,}")
    print(f"的中数                 : {hit_count:,}")
    print(f"的中率                 : {hit_rate:.2f}%")
    print(f"平均買い目点数         : {avg_tickets:.2f}")
    print(f"投資額                 : {investment:,}円")
    print(f"払戻額                 : {payout_total:,}円")
    print(f"回収率                 : {recovery_rate:.2f}%")
    print(f"万舟的中数             : {man_hit_count:,}")
    print("結果CSV                : backtest_result.csv")


if __name__ == "__main__":
    backtest()