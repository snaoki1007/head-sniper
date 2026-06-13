import { useState } from "react";
import RacerInput from "../components/RacerInput";
import { getRacerStats } from "../logic/getRacerStats";
import { calculatePrediction } from "../logic/calculatePrediction";

function getRankIcon(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
}

function formatLanes(items = []) {
  return items.map((item) => item.lane).join("-");
}

function formatRate(value) {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(1)}%`;
}

function Predict({ data }) {
  const [racers, setRacers] = useState([
    { racerNo: "", exhibitionTime: "" },
    { racerNo: "", exhibitionTime: "" },
    { racerNo: "", exhibitionTime: "" },
    { racerNo: "", exhibitionTime: "" },
    { racerNo: "", exhibitionTime: "" },
    { racerNo: "", exhibitionTime: "" },
  ]);

  const [rangeMode, setRangeMode] = useState(
    localStorage.getItem("headSniperRangeMode") || "recent20"
  );
  const [raceType, setRaceType] = useState(
    localStorage.getItem("headSniperRaceType") || "all"
  );
  const [predictionMode, setPredictionMode] = useState(
    localStorage.getItem("headSniperPredictionMode") || "hit"
  );

  const [results, setResults] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const updateRangeMode = (value) => {
    setRangeMode(value);
    localStorage.setItem("headSniperRangeMode", value);
  };

  const updateRaceType = (value) => {
    setRaceType(value);
    localStorage.setItem("headSniperRaceType", value);
  };

  const updatePredictionMode = (value) => {
    setPredictionMode(value);
    localStorage.setItem("headSniperPredictionMode", value);
  };

  const filterDataByRaceType = (rows) => {
    if (raceType === "all") return rows;
    if (raceType === "general") {
      return rows.filter((row) => row["開催グレード"] === "一般");
    }
    if (raceType === "other") {
      return rows.filter((row) => row["開催グレード"] !== "一般");
    }
    return rows;
  };

  const handlePredict = () => {
    const filteredData = filterDataByRaceType(data);

    const newResults = racers.map((racer, index) => {
      const stats = getRacerStats(filteredData, racer.racerNo, rangeMode);

      return {
        lane: index + 1,
        exhibitionTime: racer.exhibitionTime,
        ...stats,
      };
    });

    const newPrediction = calculatePrediction(
      filteredData,
      racers,
      rangeMode,
      predictionMode
    );

    setResults(newResults);
    setPrediction(newPrediction);
  };

  const topHead = prediction?.ranking?.[0];
  const secondHead = prediction?.ranking?.[1];

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="logo-mark">🎯</div>
        <div>
          <h1>HEAD SNIPER</h1>
          <p>戸田専用・頭狙撃AI</p>
        </div>
      </header>

      <main className="main-area">
        <div className="status-card">
          <span>CSV LOADED</span>
          <strong>{data.length.toLocaleString()} rows</strong>
        </div>

        <RacerInput
          racers={racers}
          setRacers={setRacers}
          onPredict={handlePredict}
        />

        <section className="option-card">
          <h2>分析条件</h2>

          <div className="segmented">
            <button
              className={rangeMode === "recent20" ? "active" : ""}
              onClick={() => updateRangeMode("recent20")}
            >
              直近20走
            </button>
            <button
              className={rangeMode === "all" ? "active" : ""}
              onClick={() => updateRangeMode("all")}
            >
              全走
            </button>
          </div>

          <div className="segmented">
            <button
              className={raceType === "all" ? "active" : ""}
              onClick={() => updateRaceType("all")}
            >
              全レース
            </button>
            <button
              className={raceType === "general" ? "active" : ""}
              onClick={() => updateRaceType("general")}
            >
              一般
            </button>
            <button
              className={raceType === "other" ? "active" : ""}
              onClick={() => updateRaceType("other")}
            >
              その他
            </button>
          </div>

          <div className="segmented">
            <button
              className={predictionMode === "hit" ? "active" : ""}
              onClick={() => updatePredictionMode("hit")}
            >
              的中重視
            </button>
            <button
              className={predictionMode === "roi" ? "active" : ""}
              onClick={() => updatePredictionMode("roi")}
            >
              回収重視
            </button>
          </div>
        </section>

        <button className="predict-button" onClick={handlePredict}>
          予想する
        </button>

        {prediction?.modeStats && (
          <section className="result-card mode-card">
            <div className="section-title-row">
              <h2>{prediction.modeStats.label}</h2>
              <span>{prediction.modeStats.period}</span>
            </div>

            <div className="mode-summary">
              <div>
                <small>的中率</small>
                <b>{prediction.modeStats.hitRate}%</b>
              </div>
              <div>
                <small>回収率</small>
                <b>{prediction.modeStats.recoveryRate}%</b>
              </div>
              <div>
                <small>購入R</small>
                <b>{prediction.modeStats.races}</b>
              </div>
            </div>
          </section>
        )}

        {prediction && (
          <section className={`judgment-card ${prediction.judgment.className}`}>
            <div>
              <span>判定</span>
              <strong>{prediction.judgment.label}</strong>
              <p>{prediction.judgment.reason}</p>
            </div>

            <div>
              <span>万舟警戒</span>
              <strong>{prediction.manRate.toFixed(1)}%</strong>
              <p>荒れ期待の目安</p>
            </div>
          </section>
        )}

        {prediction && topHead && (
          <section className="result-card reason-card">
            <div className="section-title-row">
              <h2>なぜこの頭？</h2>
              <span>HEAD REASON</span>
            </div>

            <div className="reason-main">
              <div>
                <small>本命頭</small>
                <strong className={`boat-color-${topHead.lane}`}>
                  {topHead.lane}号艇
                </strong>
              </div>

              <div>
                <small>頭スコア</small>
                <b>{topHead.score.toFixed(1)}点</b>
              </div>

              <div>
                <small>2位との差</small>
                <b>
                  {secondHead
                    ? `${(topHead.score - secondHead.score).toFixed(1)}点`
                    : "-"}
                </b>
              </div>
            </div>

            <div className="reason-stats">
              <div>
                <small>頭率</small>
                <b>{formatRate(topHead.firstRate)}</b>
              </div>
              <div>
                <small>3連対率</small>
                <b>{formatRate(topHead.top3Rate)}</b>
              </div>
              <div>
                <small>平均ST</small>
                <b>{topHead.avgST === null ? "-" : topHead.avgST.toFixed(3)}</b>
              </div>
              <div>
                <small>まくり率</small>
                <b>{formatRate(topHead.makuriRate)}</b>
              </div>
            </div>

            {topHead.points?.length > 0 && (
              <div className="reason-points">
                {topHead.points.map((point) => (
                  <span key={point}>{point}</span>
                ))}
              </div>
            )}
          </section>
        )}

        {prediction && (
          <section className="result-card">
            <div className="section-title-row">
              <h2>頭ランキング</h2>
              <span>HEAD SCORE TOP3</span>
            </div>

            <div className="head-ranking-list">
              {prediction.ranking.slice(0, 3).map((item, index) => (
                <div
                  className={`head-ranking-card lane-${item.lane}`}
                  key={item.lane}
                >
                  <div className={`head-rank-no rank-${index + 1}`}>
                    {getRankIcon(index)}
                  </div>

                  <div className="head-rank-main">
                    <strong className={`boat-color-${item.lane}`}>
                      {item.lane}号艇
                    </strong>
                    <span>選手番号 {item.racerNo || "-"}</span>
                  </div>

                  <div className="head-score">
                    {item.score.toFixed(1)}
                    <small>点</small>
                  </div>

                  <div className="head-detail">
                    <div className="primary-stat">
                      <small>頭率</small>
                      <b>{item.firstRate.toFixed(1)}%</b>
                    </div>
                    <div className="primary-stat">
                      <small>3連対率</small>
                      <b>{item.top3Rate.toFixed(1)}%</b>
                    </div>
                    <div>
                      <small>平均ST</small>
                      <b>
                        {item.avgST === null ? "-" : item.avgST.toFixed(3)}
                      </b>
                    </div>
                    <div>
                      <small>まくり率</small>
                      <b>{item.makuriRate.toFixed(1)}%</b>
                    </div>
                    <div>
                      <small>信頼度</small>
                      <b>{item.reliability}</b>
                    </div>
                    <div>
                      <small>対象走数</small>
                      <b>{item.runs}</b>
                    </div>
                    <div>
                      <small>補正倍率</small>
                      <b>{item.reliabilityMultiplier.toFixed(2)}</b>
                    </div>
                  </div>

                  {item.points.length > 0 && (
                    <div className="point-list">
                      {item.points.map((point) => (
                        <span key={point}>{point}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {prediction && prediction.tickets.length > 0 && (
          <section className="result-card">
            <div className="section-title-row">
              <h2>おすすめ買い目</h2>
              <span>{prediction.tickets.length}点</span>
            </div>

            {prediction.ticketReason && (
              <div className="ticket-reason">
                <div>
                  <small>頭</small>
                  <b>{formatLanes(prediction.ticketReason.heads)}</b>
                </div>
                <div>
                  <small>軸</small>
                  <b>{formatLanes(prediction.ticketReason.axes)}</b>
                </div>
                <div>
                  <small>切り</small>
                  <b>{prediction.ticketReason.cut?.lane || "-"}</b>
                </div>
              </div>
            )}

            {prediction.ticketGroups?.length > 0 && (
              <div className="ticket-group-list">
                {prediction.ticketGroups.map((group) => (
                  <div className="ticket-group" key={group.label}>
                    {group.label}
                  </div>
                ))}
              </div>
            )}

            <div className="ticket-list">
              {prediction.tickets.map((ticket) => (
                <span key={ticket}>{ticket}</span>
              ))}
            </div>
          </section>
        )}

        {results.length > 0 && (
          <section className="result-card">
            <div className="section-title-row">
              <h2>艇別データ</h2>
              <span>RACER DATA</span>
            </div>

            <div className="result-grid">
              {results.map((result) => (
                <div
                  className={`result-lane-card lane-${result.lane}`}
                  key={result.lane}
                >
                  <div className="result-lane-head">
                    <strong className={`boat-color-${result.lane}`}>
                      {result.lane}号艇
                    </strong>
                    <span>{result.racerNo || "-"}</span>
                  </div>

                  <div className="mini-stats">
                    <div>
                      <small>対象走数</small>
                      <b>{result.totalRuns}</b>
                    </div>
                    <div>
                      <small>1着</small>
                      <b>{result.firstCount}</b>
                    </div>
                    <div>
                      <small>3連対率</small>
                      <b>{result.top3Rate.toFixed(1)}%</b>
                    </div>
                    <div>
                      <small>展示</small>
                      <b>{result.exhibitionTime || "-"}</b>
                    </div>
                    <div>
                      <small>平均ST</small>
                      <b>
                        {result.avgStart === null
                          ? "-"
                          : result.avgStart.toFixed(3)}
                      </b>
                    </div>
                    <div>
                      <small>平均展示</small>
                      <b>
                        {result.avgExhibition === null
                          ? "-"
                          : result.avgExhibition.toFixed(2)}
                      </b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Predict;