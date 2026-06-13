export function getRacerStats(data, racerNo, rangeMode = "recent20") {
  const racerNoText = String(racerNo).trim();

  if (!racerNoText) {
    return {
      racerNo: "",
      totalRuns: 0,
      firstCount: 0,
      secondCount: 0,
      thirdCount: 0,
      top3Rate: 0,
      avgStart: null,
      avgExhibition: null,
      recent20: [],
    };
  }

  const allRaces = data
    .filter((row) => String(row["選手番号"]).trim() === racerNoText)
    .sort((a, b) => Number(b["日付"]) - Number(a["日付"]));

  const targetRaces =
    rangeMode === "recent20" ? allRaces.slice(0, 20) : allRaces;

  const firstCount = targetRaces.filter((row) => row["着順"] === "1").length;
  const secondCount = targetRaces.filter((row) => row["着順"] === "2").length;
  const thirdCount = targetRaces.filter((row) => row["着順"] === "3").length;

  const top3Count = firstCount + secondCount + thirdCount;
  const top3Rate =
    targetRaces.length > 0 ? (top3Count / targetRaces.length) * 100 : 0;

  const startValues = targetRaces
    .map((row) => Number(row["本番ST"]))
    .filter((value) => !Number.isNaN(value));

  const exhibitionValues = targetRaces
    .map((row) => Number(row["展示タイム"]))
    .filter((value) => !Number.isNaN(value));

  const avgStart =
    startValues.length > 0
      ? startValues.reduce((sum, value) => sum + value, 0) / startValues.length
      : null;

  const avgExhibition =
    exhibitionValues.length > 0
      ? exhibitionValues.reduce((sum, value) => sum + value, 0) /
        exhibitionValues.length
      : null;

  return {
    racerNo: racerNoText,
    totalRuns: targetRaces.length,
    firstCount,
    secondCount,
    thirdCount,
    top3Rate,
    avgStart,
    avgExhibition,
    recent20: allRaces.slice(0, 20),
  };
}