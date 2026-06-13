import pandas as pd

CSV_PATH = "backtest_result.csv"

df = pd.read_csv(CSV_PATH)

print("")
print("========== 頭候補別 期待値分析 ==========")

summary_rows = []

for lane in range(1, 7):
    sub = df[df["頭1位"] == lane]

    if len(sub) == 0:
        continue

    races = len(sub)
    investment = sub["投資額"].sum()
    payout = sub["配当"].sum()
    recovery = payout / investment * 100 if investment > 0 else 0

    hit_df = sub[sub["的中"] == True]
    hit_count = len(hit_df)
    hit_rate = hit_count / races * 100 if races > 0 else 0

    avg_payout_when_hit = hit_df["配当"].mean() if hit_count > 0 else 0

    man_hit_count = len(hit_df[hit_df["配当"] >= 10000])
    man_hit_rate = man_hit_count / hit_count * 100 if hit_count > 0 else 0

    avg_score = sub["頭1位スコア"].mean()
    avg_tickets = sub["買い目数"].mean()

    row = {
        "頭艇": f"{lane}号艇",
        "レース数": races,
        "的中数": hit_count,
        "的中率": round(hit_rate, 2),
        "平均的中配当": round(avg_payout_when_hit, 0),
        "万舟的中数": man_hit_count,
        "万舟率_的中内": round(man_hit_rate, 2),
        "平均買い目数": round(avg_tickets, 2),
        "投資額": int(investment),
        "払戻額": int(payout),
        "回収率": round(recovery, 2),
        "平均頭スコア": round(avg_score, 2),
    }

    summary_rows.append(row)

    print("")
    print(f"--- {lane}号艇 頭 ---")
    print(f"レース数       : {races:,}")
    print(f"的中数         : {hit_count:,}")
    print(f"的中率         : {hit_rate:.2f}%")
    print(f"平均的中配当   : {avg_payout_when_hit:,.0f}円")
    print(f"万舟的中数     : {man_hit_count:,}")
    print(f"万舟率         : {man_hit_rate:.2f}%")
    print(f"平均買い目数   : {avg_tickets:.2f}")
    print(f"投資額         : {investment:,}円")
    print(f"払戻額         : {payout:,}円")
    print(f"回収率         : {recovery:.2f}%")
    print(f"平均頭スコア   : {avg_score:.2f}")

summary_df = pd.DataFrame(summary_rows)
summary_df.to_csv("head_roi_summary.csv", index=False, encoding="utf-8-sig")

print("")
print("CSV出力: head_roi_summary.csv")


print("")
print("========== 判定 × 頭艇 ==========")

cross_rows = []

for judgment in ["買い", "注意"]:
    for lane in range(1, 7):
        sub = df[(df["判定"] == judgment) & (df["頭1位"] == lane)]

        if len(sub) == 0:
            continue

        races = len(sub)
        investment = sub["投資額"].sum()
        payout = sub["配当"].sum()
        recovery = payout / investment * 100 if investment > 0 else 0

        hit_count = len(sub[sub["的中"] == True])
        hit_rate = hit_count / races * 100 if races > 0 else 0

        avg_score = sub["頭1位スコア"].mean()
        avg_tickets = sub["買い目数"].mean()

        cross_rows.append({
            "判定": judgment,
            "頭艇": f"{lane}号艇",
            "レース数": races,
            "的中数": hit_count,
            "的中率": round(hit_rate, 2),
            "平均買い目数": round(avg_tickets, 2),
            "投資額": int(investment),
            "払戻額": int(payout),
            "回収率": round(recovery, 2),
            "平均頭スコア": round(avg_score, 2),
        })

        print(
            f"{judgment} × {lane}号艇 "
            f"レース数:{races:,} "
            f"的中率:{hit_rate:.2f}% "
            f"回収率:{recovery:.2f}%"
        )

cross_df = pd.DataFrame(cross_rows)
cross_df.to_csv("head_roi_by_judgment.csv", index=False, encoding="utf-8-sig")

print("")
print("CSV出力: head_roi_by_judgment.csv")


print("")
print("========== スコア帯 × 頭艇 ==========")

score_bins = [
    ("90以上", 90, 999),
    ("80-90", 80, 90),
    ("70-80", 70, 80),
    ("60-70", 60, 70),
    ("60未満", 0, 60),
]

score_rows = []

for label, low, high in score_bins:
    for lane in range(1, 7):
        sub = df[
            (df["頭1位"] == lane)
            & (df["頭1位スコア"] >= low)
            & (df["頭1位スコア"] < high)
        ]

        if len(sub) == 0:
            continue

        races = len(sub)
        investment = sub["投資額"].sum()
        payout = sub["配当"].sum()
        recovery = payout / investment * 100 if investment > 0 else 0

        hit_count = len(sub[sub["的中"] == True])
        hit_rate = hit_count / races * 100 if races > 0 else 0

        score_rows.append({
            "スコア帯": label,
            "頭艇": f"{lane}号艇",
            "レース数": races,
            "的中数": hit_count,
            "的中率": round(hit_rate, 2),
            "投資額": int(investment),
            "払戻額": int(payout),
            "回収率": round(recovery, 2),
        })

score_df = pd.DataFrame(score_rows)
score_df.to_csv("head_roi_by_score.csv", index=False, encoding="utf-8-sig")

print("CSV出力: head_roi_by_score.csv")