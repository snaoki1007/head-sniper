import pandas as pd

CSV_PATH = "backtest_result.csv"

df = pd.read_csv(CSV_PATH)

print("")
print("========== 総合 ==========")

investment = df["投資額"].sum()
payout = df["配当"].sum()

print(f"投資額 : {investment:,}円")
print(f"払戻額 : {payout:,}円")
print(f"回収率 : {payout / investment * 100:.2f}%")

print("")
print("========== 判定別 ==========")

for judgment in ["買い", "注意"]:
    sub = df[df["判定"] == judgment]

    if len(sub) == 0:
        continue

    invest = sub["投資額"].sum()
    pay = sub["配当"].sum()

    recovery = pay / invest * 100 if invest > 0 else 0

    print(
        f"{judgment} "
        f"レース数:{len(sub):,} "
        f"回収率:{recovery:.2f}%"
    )

print("")
print("========== 頭1位スコア帯 ==========")

score_ranges = [
    (90, 999),
    (80, 90),
    (70, 80),
    (60, 70),
    (0, 60),
]

for low, high in score_ranges:

    sub = df[
        (df["頭1位スコア"] >= low)
        & (df["頭1位スコア"] < high)
    ]

    if len(sub) == 0:
        continue

    invest = sub["投資額"].sum()
    pay = sub["配当"].sum()

    recovery = pay / invest * 100 if invest > 0 else 0

    print(
        f"{low}-{high} "
        f"レース数:{len(sub):,} "
        f"回収率:{recovery:.2f}%"
    )

print("")
print("========== 買い目点数別 ==========")

for ticket_count in sorted(df["買い目数"].unique()):

    sub = df[df["買い目数"] == ticket_count]

    invest = sub["投資額"].sum()
    pay = sub["配当"].sum()

    recovery = pay / invest * 100 if invest > 0 else 0

    print(
        f"{ticket_count}点 "
        f"レース数:{len(sub):,} "
        f"回収率:{recovery:.2f}%"
    )

print("")
print("========== 頭艇番別 ==========")

for lane in range(1, 7):

    sub = df[df["頭1位"] == lane]

    if len(sub) == 0:
        continue

    invest = sub["投資額"].sum()
    pay = sub["配当"].sum()

    recovery = pay / invest * 100 if invest > 0 else 0

    print(
        f"{lane}号艇 "
        f"レース数:{len(sub):,} "
        f"回収率:{recovery:.2f}%"
    )