function parsePayout(value) {
  return Number(String(value || "").replaceAll(",", "").trim()) || 0;
}

function isManPayout(row, payout) {
  return (
    row["万舟"] === "True" ||
    row["万舟"] === "TRUE" ||
    row["万舟"] === "true" ||
    payout >= 10000
  );
}

function makeRaceKey(row) {
  return `${row["日付"]}_${row["レース"]}`;
}

function buildRaceResults(data) {
  const raceMap = {};

  data.forEach((row) => {
    const key = makeRaceKey(row);

    if (!raceMap[key]) {
      raceMap[key] = [];
    }

    raceMap[key].push(row);
  });

  return Object.values(raceMap)
    .map((rows) => {
      const top3 = rows
        .filter((row) => ["1", "2", "3"].includes(String(row["着順"])))
        .sort((a, b) => Number(a["着順"]) - Number(b["着順"]));

      if (top3.length < 3) return null;

      const combo = top3.map((row) => row["枠番"]).join("-");
      const firstLane = top3[0]["枠番"];

      const payoutRow = top3[0];
      const payout = parsePayout(payoutRow["3連単配当"]);
      const isMan = isManPayout(payoutRow, payout);

      return {
        combo,
        firstLane,
        payout,
        isMan,
      };
    })
    .filter(Boolean);
}

function summarizeCombos(races) {
  const map = {};
  const totalRaceCount = races.length;

  races.forEach((race) => {
    if (!map[race.combo]) {
      map[race.combo] = {
        combo: race.combo,
        count: 0,
        payoutTotal: 0,
        manCount: 0,
      };
    }

    map[race.combo].count += 1;
    map[race.combo].payoutTotal += race.payout;

    if (race.isMan) {
      map[race.combo].manCount += 1;
    }
  });

  return Object.values(map)
    .map((item) => ({
      ...item,
      hitRate: totalRaceCount > 0 ? (item.count / totalRaceCount) * 100 : 0,
      avgPayout: item.count > 0 ? item.payoutTotal / item.count : 0,
      manRate: item.count > 0 ? (item.manCount / item.count) * 100 : 0,
      expectedReturn:
        totalRaceCount > 0 ? item.payoutTotal / totalRaceCount : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getRankingStats(data, raceType = "all") {
  let rows = data;

  if (raceType === "general") {
    rows = rows.filter((row) => row["開催グレード"] === "一般");
  }

  if (raceType === "other") {
    rows = rows.filter((row) => row["開催グレード"] !== "一般");
  }

  const races = buildRaceResults(rows);

  const overallRankings = summarizeCombos(races);

  const headRankings = {};

  for (let lane = 1; lane <= 6; lane += 1) {
    const laneText = String(lane);
    const laneRaces = races.filter((race) => String(race.firstLane) === laneText);

    headRankings[laneText] = {
      totalRaceCount: laneRaces.length,
      rankings: summarizeCombos(laneRaces),
    };
  }

  return {
    totalRaceCount: races.length,
    rankings: overallRankings,
    headRankings,
  };
}