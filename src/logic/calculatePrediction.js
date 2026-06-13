function toNumber(value) {
  const text = String(value ?? "").trim();
  if (text === "") return null;

  const num = Number(text.replaceAll(",", ""));
  return Number.isNaN(num) ? null : num;
}

function avg(values) {
  const valid = values.filter((v) => v !== null && !Number.isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

function getStart(row) {
  return toNumber(row["本番ST"]);
}

function getExhibition(value) {
  return toNumber(value);
}

function isMakuri(row) {
  return String(row["決まり手"] || "").includes("まくり");
}

function getReliability(runs) {
  if (runs >= 30) return "S";
  if (runs >= 20) return "A";
  if (runs >= 10) return "B";
  if (runs >= 5) return "C";
  return "D";
}

function getReliabilityMultiplier(runs) {
  if (runs >= 30) return 1.0;
  if (runs >= 20) return 0.95;
  if (runs >= 10) return 0.85;
  if (runs >= 5) return 0.7;
  return 0.5;
}

function getBaseStartPoint(avgST) {
  if (avgST === null) return 0;
  if (avgST <= 0.13) return 8;
  if (avgST <= 0.14) return 5;
  if (avgST <= 0.15) return 2;
  if (avgST <= 0.16) return -2;
  if (avgST <= 0.17) return -5;
  return -8;
}

function getLane1AbsoluteStPoint(avgST) {
  if (avgST === null) return 0;
  if (avgST <= 0.13) return 12;
  if (avgST <= 0.14) return 8;
  if (avgST <= 0.15) return 3;
  if (avgST <= 0.16) return -5;
  if (avgST <= 0.17) return -9;
  if (avgST <= 0.18) return -11;
  return -18;
}

function getLane1RelativeAveragePoint(diff) {
  if (diff === null) return 0;
  if (diff <= -0.05) return 12;
  if (diff <= -0.03) return 10;
  if (diff <= -0.01) return 5;
  if (diff <= 0.01) return 0;
  if (diff <= 0.03) return -5;
  if (diff <= 0.05) return -12;
  return -28;
}

function getLane1RelativeFastestPoint(diff) {
  if (diff === null) return 0;
  if (diff <= -0.03) return 12;
  if (diff <= 0) return 6;
  if (diff <= 0.03) return -4;
  if (diff <= 0.05) return -10;
  return -20;
}

function getMakuriPoint(lane, makuriRate) {
  if (makuriRate === null) return 0;
  if (lane === 1) return 0;

  if (lane === 2) {
    if (makuriRate < 5) return -5;
    if (makuriRate < 10) return 0;
    if (makuriRate < 15) return 3;
    if (makuriRate < 20) return 6;
    return 10;
  }

  if (lane === 3 || lane === 4) {
    if (makuriRate < 5) return -15;
    if (makuriRate < 10) return -5;
    if (makuriRate < 15) return 5;
    if (makuriRate < 20) return 12;
    return 20;
  }

  if (makuriRate < 5) return -5;
  if (makuriRate < 10) return 0;
  if (makuriRate < 15) return 5;
  if (makuriRate < 20) return 10;
  return 15;
}

function getExhibitionBuffPoint(lane, stDiff) {
  if (lane === 2) {
    if (stDiff >= 0.03) return -10;
    if (stDiff >= 0.01) return -5;
    if (stDiff > -0.01) return 0;
    if (stDiff > -0.03) return 5;
    if (stDiff > -0.05) return 12;
    return 18;
  }

  if (lane === 3) {
    if (stDiff >= 0.03) return -5;
    if (stDiff >= 0.01) return 0;
    if (stDiff > -0.03) return 3;
    return 8;
  }

  if (lane === 4) {
    if (stDiff >= 0.03) return -12;
    if (stDiff >= 0.01) return -5;
    if (stDiff > -0.01) return 0;
    if (stDiff > -0.03) return 3;
    if (stDiff > -0.05) return 15;
    return 25;
  }

  if (lane === 5) return stDiff <= -0.03 ? 10 : 5;
  if (lane === 6) return stDiff <= -0.03 ? 8 : 4;

  return 0;
}

function getExhibitionDebuffPoint(lane, stDiff) {
  if (lane === 1) {
    if (stDiff <= -0.05) return 0;
    if (stDiff <= -0.03) return -3;
    if (stDiff <= -0.01) return -5;
    if (stDiff <= 0.01) return -10;
    if (stDiff <= 0.03) return -15;
    if (stDiff <= 0.05) return -25;
    return -40;
  }

  if (lane === 3) {
    if (stDiff <= -0.03) return -5;
    if (stDiff <= 0.01) return -10;
    if (stDiff <= 0.03) return -15;
    return -22;
  }

  if (lane === 2 || lane === 4) {
    if (stDiff <= -0.03) return -3;
    if (stDiff <= 0.01) return -7;
    if (stDiff <= 0.03) return -10;
    return -15;
  }

  if (lane === 5) {
    if (stDiff <= 0.01) return -5;
    return -10;
  }

  return 0;
}

function getRacerHistory(data, racerNo, rangeMode) {
  const racerNoText = String(racerNo || "").trim();

  const rows = data
    .filter((row) => String(row["選手番号"]).trim() === racerNoText)
    .sort((a, b) => Number(b["日付"]) - Number(a["日付"]));

  return rangeMode === "recent20" ? rows.slice(0, 20) : rows;
}

function makeRacerScore(data, racer, lane, rangeMode) {
  const history = getRacerHistory(data, racer.racerNo, rangeMode);
  const laneHistory = history.filter(
    (row) => String(row["枠番"]) === String(lane)
  );

  const target = laneHistory.length >= 5 ? laneHistory : history;
  const runs = target.length;

  const firstCount = target.filter(
    (row) => String(row["着順"]) === "1"
  ).length;

  const top3Count = target.filter((row) =>
    ["1", "2", "3"].includes(String(row["着順"]))
  ).length;

  const firstRate = runs > 0 ? (firstCount / runs) * 100 : 0;
  const top3Rate = runs > 0 ? (top3Count / runs) * 100 : 0;
  const avgST = avg(target.map(getStart));

  const makuriWins = target.filter(
    (row) => String(row["着順"]) === "1" && isMakuri(row)
  ).length;

  const makuriRate = runs > 0 ? (makuriWins / runs) * 100 : 0;
  const makuriPoint = getMakuriPoint(lane, makuriRate);

  const rawScore =
    firstRate * 1.15 +
    top3Rate * 0.25 +
    getBaseStartPoint(avgST) +
    makuriPoint;

  const reliabilityMultiplier = getReliabilityMultiplier(runs);
  const baseScore = rawScore * reliabilityMultiplier;

  const points = [];

  if (makuriPoint !== 0) {
    points.push(`まくり補正 ${makuriPoint >= 0 ? "+" : ""}${makuriPoint}`);
  }

  return {
    lane,
    racerNo: String(racer.racerNo || "").trim(),
    exhibitionTime: racer.exhibitionTime,
    runs,
    firstCount,
    top3Count,
    firstRate,
    top3Rate,
    avgST,
    makuriRate,
    makuriPoint,
    reliability: getReliability(runs),
    reliabilityMultiplier,
    score: baseScore,
    points,
  };
}

function applyLane1StCorrection(scores) {
  const lane1 = scores.find((s) => s.lane === 1);
  const others = scores.filter((s) => s.lane !== 1 && s.avgST !== null);

  if (!lane1 || lane1.avgST === null || others.length === 0) return 0;

  const othersAvg = avg(others.map((s) => s.avgST));
  const fastestOther = Math.min(...others.map((s) => s.avgST));

  const absolutePoint = getLane1AbsoluteStPoint(lane1.avgST);
  const relativeAveragePoint = getLane1RelativeAveragePoint(
    othersAvg === null ? null : lane1.avgST - othersAvg
  );
  const relativeFastestPoint = getLane1RelativeFastestPoint(
    lane1.avgST - fastestOther
  );

  const totalPoint = absolutePoint + relativeAveragePoint + relativeFastestPoint;

  lane1.score += totalPoint;

  lane1.points.push(
    `1号艇絶対ST ${absolutePoint >= 0 ? "+" : ""}${absolutePoint}`
  );
  lane1.points.push(
    `1号艇vs全体ST ${
      relativeAveragePoint >= 0 ? "+" : ""
    }${relativeAveragePoint}`
  );
  lane1.points.push(
    `1号艇vs外最速ST ${
      relativeFastestPoint >= 0 ? "+" : ""
    }${relativeFastestPoint}`
  );

  return totalPoint;
}

function applyExhibitionCorrection(scores) {
  let buffCount = 0;
  let debuffCount = 0;
  let buffPoint = 0;
  let debuffPoint = 0;

  scores.forEach((score) => {
    const currentEx = getExhibition(score.exhibitionTime);

    if (currentEx === null) return;

    const left = scores.find((s) => s.lane === score.lane - 1);
    const right = scores.find((s) => s.lane === score.lane + 1);

    if (left) {
      const leftEx = getExhibition(left.exhibitionTime);

      if (leftEx !== null && currentEx <= leftEx - 0.1) {
        const stDiff =
          score.avgST !== null && left.avgST !== null
            ? score.avgST - left.avgST
            : 0;

        const point = getExhibitionBuffPoint(score.lane, stDiff);

        score.score += point;
        buffCount += 1;
        buffPoint += point;

        score.points.push(
          `左より展示0.10速い ${point >= 0 ? "+" : ""}${point}`
        );
      }
    }

    if (right) {
      const rightEx = getExhibition(right.exhibitionTime);

      if (rightEx !== null && currentEx >= rightEx + 0.1) {
        const stDiff =
          score.avgST !== null && right.avgST !== null
            ? score.avgST - right.avgST
            : 0;

        const point = getExhibitionDebuffPoint(score.lane, stDiff);

        score.score += point;
        debuffCount += 1;
        debuffPoint += point;

        score.points.push(`右より展示0.10遅い ${point}`);
      }
    }
  });

  return {
    buffCount,
    debuffCount,
    buffPoint,
    debuffPoint,
  };
}

function getJudgment(ranking) {
  if (ranking.length < 2) {
    return {
      label: "見",
      reason: "入力不足",
      className: "watch",
    };
  }

  const top = ranking[0];
  const second = ranking[1];
  const diff = top.score - second.score;

  if (top.reliability === "D") {
    return {
      label: "見",
      reason: "1位候補の対象走数が少ない",
      className: "watch",
    };
  }

  if (diff >= 15 && ["S", "A", "B"].includes(top.reliability)) {
    return {
      label: "買い",
      reason: `1位と2位の差 ${diff.toFixed(1)}点`,
      className: "buy",
    };
  }

  if (diff >= 8) {
    return {
      label: "注意",
      reason: `1位と2位の差 ${diff.toFixed(1)}点`,
      className: "caution",
    };
  }

  return {
    label: "見",
    reason: `頭候補が接戦 ${diff.toFixed(1)}点差`,
    className: "watch",
  };
}

function makeWatchJudgment(reason) {
  return {
    label: "見",
    reason,
    className: "watch",
  };
}

function getRaceManRate(ranking) {
  const lane1 = ranking.find((s) => s.lane === 1);
  const top = ranking[0];

  let rate = 10;

  if (lane1 && top && top.lane !== 1) rate += 8;
  if (lane1 && lane1.score < 45) rate += 8;
  if (top && [3, 4, 5, 6].includes(top.lane)) rate += 6;

  return Math.min(rate, 35);
}

function formatTicketGroup(head, axis, thirdCandidates) {
  const thirdText = thirdCandidates.map((r) => r.lane).join("");

  return {
    label: `${head.lane}-${axis.lane}=${thirdText}`,
    head,
    axis,
    thirdCandidates,
  };
}

function generateBuyHitTickets(valid, top3Ranking) {
  const heads = valid.slice(0, 2);
  const axes = [top3Ranking[0], top3Ranking[1]].filter(Boolean);
  const worst = [...valid].sort((a, b) => a.top3Rate - b.top3Rate)[0];
  const thirds = valid.filter((r) => r.lane !== worst.lane);

  const tickets = [];
  const groups = [];

  heads.forEach((head) => {
    axes.forEach((axis) => {
      if (head.lane === axis.lane) return;

      const thirdCandidates = thirds.filter(
        (third) => third.lane !== head.lane && third.lane !== axis.lane
      );

      groups.push(formatTicketGroup(head, axis, thirdCandidates));

      thirdCandidates.forEach((third) => {
        tickets.push(`${head.lane}-${axis.lane}-${third.lane}`);
        tickets.push(`${head.lane}-${third.lane}-${axis.lane}`);
      });
    });
  });

  return {
    tickets: [...new Set(tickets)],
    groups,
    reason: {
      type: "買い",
      heads,
      axes,
      cut: worst,
    },
  };
}

function generateBuyRoiTickets(valid, top3Ranking) {
  const head = valid[0];

  let axis = top3Ranking[0];

  if (axis.lane === head.lane) {
    axis = top3Ranking[1];
  }

  const worst = [...valid]
    .filter((r) => r.lane !== head.lane && r.lane !== axis.lane)
    .sort((a, b) => a.top3Rate - b.top3Rate)[0];

  const thirdCandidates = valid.filter(
    (r) =>
      r.lane !== head.lane &&
      r.lane !== axis.lane &&
      r.lane !== worst.lane
  );

  const tickets = [];

  thirdCandidates.forEach((third) => {
    tickets.push(`${head.lane}-${axis.lane}-${third.lane}`);
    tickets.push(`${head.lane}-${third.lane}-${axis.lane}`);
  });

  return {
    tickets: [...new Set(tickets)],
    groups: [formatTicketGroup(head, axis, thirdCandidates)],
    reason: {
      type: "買い",
      heads: [head],
      axes: [axis],
      cut: worst,
    },
  };
}

function generateCautionTickets(valid, top3Ranking, mode) {
  const heads = valid.slice(0, 2);
  const axisCandidates =
    mode === "hit"
      ? [top3Ranking[0], top3Ranking[1]].filter(Boolean)
      : [top3Ranking[0], top3Ranking[2]].filter(Boolean);

  const worst = [...valid].sort((a, b) => a.top3Rate - b.top3Rate)[0];
  const thirds = valid.filter((r) => r.lane !== worst.lane);

  const tickets = [];
  const groups = [];

  heads.forEach((head) => {
    axisCandidates.forEach((axis) => {
      if (head.lane === axis.lane) return;

      const thirdCandidates = thirds.filter(
        (third) => third.lane !== head.lane && third.lane !== axis.lane
      );

      groups.push(formatTicketGroup(head, axis, thirdCandidates));

      thirdCandidates.forEach((third) => {
        tickets.push(`${head.lane}-${axis.lane}-${third.lane}`);
        tickets.push(`${head.lane}-${third.lane}-${axis.lane}`);
      });
    });
  });

  return {
    tickets: [...new Set(tickets)],
    groups,
    reason: {
      type: "注意",
      heads,
      axes: axisCandidates,
      cut: worst,
    },
  };
}

function generateTickets(ranking, judgment, mode) {
  const valid = ranking.filter((r) => r.racerNo);

  if (valid.length < 4) {
    return {
      tickets: [],
      groups: [],
      reason: null,
    };
  }

  const top3Ranking = [...valid].sort((a, b) => b.top3Rate - a.top3Rate);

  if (judgment.label === "買い") {
    if (mode === "hit") {
      return generateBuyHitTickets(valid, top3Ranking);
    }

    return generateBuyRoiTickets(valid, top3Ranking);
  }

  if (judgment.label === "注意") {
    return generateCautionTickets(valid, top3Ranking, mode);
  }

  return {
    tickets: [],
    groups: [],
    reason: null,
  };
}

function shouldSkipByMode({
  mode,
  judgment,
  ranking,
  ticketCount,
  lane1StBonus,
  makuriBonusTotal,
}) {
  const headLane = ranking[0]?.lane;

  if (headLane === 2 || headLane === 6) {
    return "頭2・6は検証上マイナス";
  }

  if (judgment.label === "買い" && headLane === 3) {
    return "買い×3号艇は検証上マイナス";
  }

  if (mode === "roi") {
    if (judgment.label === "注意" && headLane === 5) {
      return "回収重視では注意×5号艇を見送り";
    }

    if (ticketCount === 18) {
      return "回収重視では18点買いを見送り";
    }

    if (judgment.label === "買い" && makuriBonusTotal < 10) {
      return "回収重視ではまくり補正10未満を見送り";
    }

    if (judgment.label === "注意" && lane1StBonus >= 0) {
      return "回収重視では1ST補正マイナスのみ購入";
    }
  }

  return null;
}

export function calculatePrediction(data, racers, rangeMode, predictionMode = "hit") {
  const mode = predictionMode === "roi" ? "roi" : "hit";

  const scores = racers.map((racer, index) =>
    makeRacerScore(data, racer, index + 1, rangeMode)
  );

  const lane1StBonus = applyLane1StCorrection(scores);
  const exhibitionInfo = applyExhibitionCorrection(scores);
  const makuriBonusTotal = scores.reduce(
    (sum, score) => sum + score.makuriPoint,
    0
  );

  const ranking = scores
    .map((s) => ({
      ...s,
      score: Math.max(0, s.score),
    }))
    .sort((a, b) => b.score - a.score);

  let judgment = getJudgment(ranking);
  const manRate = getRaceManRate(ranking);

  let ticketResult = generateTickets(ranking, judgment, mode);

  const skipReason = shouldSkipByMode({
    mode,
    judgment,
    ranking,
    ticketCount: ticketResult.tickets.length,
    lane1StBonus,
    makuriBonusTotal,
  });

  if (judgment.label !== "見" && skipReason) {
    judgment = makeWatchJudgment(skipReason);
    ticketResult = {
      tickets: [],
      groups: [],
      reason: null,
    };
  }

  return {
    ranking,
    judgment,
    manRate,
    tickets: ticketResult.tickets,
    ticketGroups: ticketResult.groups,
    ticketReason: ticketResult.reason,
    predictionMode: mode,
    modeStats:
      mode === "hit"
        ? {
            label: "的中重視",
            period: "2025年以降検証",
            hitRate: 28.62,
            recoveryRate: 75.34,
            races: 1394,
          }
        : {
            label: "回収重視",
            period: "2025年以降検証",
            hitRate: 21.58,
            recoveryRate: 102.74,
            races: 366,
          },
    correctionInfo: {
      lane1StBonus,
      makuriBonusTotal,
      exhibitionBuffCount: exhibitionInfo.buffCount,
      exhibitionDebuffCount: exhibitionInfo.debuffCount,
      exhibitionBuffPoint: exhibitionInfo.buffPoint,
      exhibitionDebuffPoint: exhibitionInfo.debuffPoint,
    },
  };
}