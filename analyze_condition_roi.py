import pandas as pd

CSV_PATH = "backtest_result.csv"

df = pd.read_csv(CSV_PATH)


def calc_roi(sub):
    races = len(sub)
    investment = sub["投資額"].sum()
    payout = sub["配当"].sum()
    hit_count = len(sub[sub["的中"] == True])

    roi = payout / investment * 100 if investment > 0 else 0
    hit_rate = hit_count / races * 100 if races > 0 else 0
    avg_tickets = sub["買い目数"].mean() if races > 0 else 0

    return {
        "レース数": races,
        "的中数": hit_count,
        "的中率": round(hit_rate, 2),
        "平均買い目数": round(avg_tickets, 2),
        "投資額": int(investment),
        "払戻額": int(payout),
        "回収率": round(roi, 2),
    }


def print_result(title, rows):
    print("")
    print(f"===== {title} =====")

    if not rows:
        print("データなし")
        return

    result = pd.DataFrame(rows)
    result = result.sort_values("回収率", ascending=False)

    print(result.to_string(index=False))

    filename = f"{title}.csv".replace(" ", "_")
    result.to_csv(filename, index=False, encoding="utf-8-sig")

    print(f"CSV出力: {filename}")


print("")
print("========== 補正条件別 回収率分析 ==========")


# -------------------
# 展示バフ数
# -------------------

rows = []

for value in sorted(df["展示バフ数"].unique()):
    sub = df[df["展示バフ数"] == value]
    result = calc_roi(sub)
    result["条件"] = f"展示バフ数={value}"
    rows.append(result)

print_result("展示バフ数別", rows)


# -------------------
# 展示デバフ数
# -------------------

rows = []

for value in sorted(df["展示デバフ数"].unique()):
    sub = df[df["展示デバフ数"] == value]
    result = calc_roi(sub)
    result["条件"] = f"展示デバフ数={value}"
    rows.append(result)

print_result("展示デバフ数別", rows)


# -------------------
# 展示バフ有無
# -------------------

rows = []

for label, condition in [
    ("展示バフなし", df["展示バフ数"] == 0),
    ("展示バフあり", df["展示バフ数"] >= 1),
    ("展示バフ2個以上", df["展示バフ数"] >= 2),
]:
    sub = df[condition]
    result = calc_roi(sub)
    result["条件"] = label
    rows.append(result)

print_result("展示バフ有無", rows)


# -------------------
# 展示デバフ有無
# -------------------

rows = []

for label, condition in [
    ("展示デバフなし", df["展示デバフ数"] == 0),
    ("展示デバフあり", df["展示デバフ数"] >= 1),
    ("展示デバフ2個以上", df["展示デバフ数"] >= 2),
]:
    sub = df[condition]
    result = calc_roi(sub)
    result["条件"] = label
    rows.append(result)

print_result("展示デバフ有無", rows)


# -------------------
# 1ST補正
# -------------------

rows = []

for label, condition in [
    ("1ST大幅プラス", df["1ST補正"] >= 15),
    ("1STプラス", df["1ST補正"] > 0),
    ("1STゼロ", df["1ST補正"] == 0),
    ("1STマイナス", df["1ST補正"] < 0),
    ("1ST大幅マイナス", df["1ST補正"] <= -15),
]:
    sub = df[condition]
    result = calc_roi(sub)
    result["条件"] = label
    rows.append(result)

print_result("1ST補正別", rows)


# -------------------
# まくり補正
# -------------------

rows = []

for label, condition in [
    ("まくり補正マイナス", df["まくり補正"] < 0),
    ("まくり補正ゼロ", df["まくり補正"] == 0),
    ("まくり補正プラス", df["まくり補正"] > 0),
    ("まくり補正10以上", df["まくり補正"] >= 10),
    ("まくり補正20以上", df["まくり補正"] >= 20),
    ("まくり補正30以上", df["まくり補正"] >= 30),
]:
    sub = df[condition]
    result = calc_roi(sub)
    result["条件"] = label
    rows.append(result)

print_result("まくり補正別", rows)


# -------------------
# 頭艇 × 展示バフ
# -------------------

rows = []

for lane in sorted(df["頭1位"].unique()):
    for label, condition in [
        ("展示バフなし", df["展示バフ数"] == 0),
        ("展示バフあり", df["展示バフ数"] >= 1),
    ]:
        sub = df[(df["頭1位"] == lane) & condition]

        if len(sub) == 0:
            continue

        result = calc_roi(sub)
        result["条件"] = f"{lane}号艇×{label}"
        rows.append(result)

print_result("頭艇×展示バフ", rows)


# -------------------
# 頭艇 × 展示デバフ
# -------------------

rows = []

for lane in sorted(df["頭1位"].unique()):
    for label, condition in [
        ("展示デバフなし", df["展示デバフ数"] == 0),
        ("展示デバフあり", df["展示デバフ数"] >= 1),
    ]:
        sub = df[(df["頭1位"] == lane) & condition]

        if len(sub) == 0:
            continue

        result = calc_roi(sub)
        result["条件"] = f"{lane}号艇×{label}"
        rows.append(result)

print_result("頭艇×展示デバフ", rows)


# -------------------
# 頭艇 × まくり補正
# -------------------

rows = []

for lane in sorted(df["頭1位"].unique()):
    for label, condition in [
        ("まくり補正10未満", df["まくり補正"] < 10),
        ("まくり補正10以上", df["まくり補正"] >= 10),
        ("まくり補正20以上", df["まくり補正"] >= 20),
    ]:
        sub = df[(df["頭1位"] == lane) & condition]

        if len(sub) == 0:
            continue

        result = calc_roi(sub)
        result["条件"] = f"{lane}号艇×{label}"
        rows.append(result)

print_result("頭艇×まくり補正", rows)


# -------------------
# 判定 × 補正
# -------------------

rows = []

for judgment in sorted(df["判定"].unique()):
    for label, condition in [
        ("展示バフあり", df["展示バフ数"] >= 1),
        ("展示デバフあり", df["展示デバフ数"] >= 1),
        ("まくり補正10以上", df["まくり補正"] >= 10),
        ("1STマイナス", df["1ST補正"] < 0),
    ]:
        sub = df[(df["判定"] == judgment) & condition]

        if len(sub) == 0:
            continue

        result = calc_roi(sub)
        result["条件"] = f"{judgment}×{label}"
        rows.append(result)

print_result("判定×補正", rows)


print("")
print("分析完了")