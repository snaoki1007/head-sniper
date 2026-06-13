import { useState } from "react";
import { getRankingStats } from "../logic/getRankingStats";

function Ranking({ data }) {
  const [raceType, setRaceType] = useState("all");
  const [headLane, setHeadLane] = useState("all");

  const { totalRaceCount, rankings, headRankings } = getRankingStats(
    data,
    raceType
  );

  const displayRankings =
    headLane === "all"
      ? rankings
      : headRankings[headLane]?.rankings || [];

  const displayTotalRaceCount =
    headLane === "all"
      ? totalRaceCount
      : headRankings[headLane]?.totalRaceCount || 0;

  const top30 = displayRankings.slice(0, 30);

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="logo-mark">📊</div>
        <div>
          <h1>出目ランキング</h1>
          <p>戸田3連単・着順から出目生成</p>
        </div>
      </header>

      <main className="main-area">
        <div className="status-card">
          <span>集計レース数</span>
          <strong>{displayTotalRaceCount.toLocaleString()}R</strong>
        </div>

        <section className="option-card">
          <h2>集計条件</h2>

          <div className="segmented">
            <button
              className={raceType === "all" ? "active" : ""}
              onClick={() => setRaceType("all")}
            >
              全レース
            </button>

            <button
              className={raceType === "general" ? "active" : ""}
              onClick={() => setRaceType("general")}
            >
              一般
            </button>

            <button
              className={raceType === "other" ? "active" : ""}
              onClick={() => setRaceType("other")}
            >
              その他
            </button>
          </div>

          <div className="head-filter-grid">
            <button
              className={headLane === "all" ? "active" : ""}
              onClick={() => setHeadLane("all")}
            >
              全頭
            </button>

            {[1, 2, 3, 4, 5, 6].map((lane) => (
              <button
                key={lane}
                className={`lane-filter lane-${lane} ${
                  headLane === String(lane) ? "active" : ""
                }`}
                onClick={() => setHeadLane(String(lane))}
              >
                {lane}頭
              </button>
            ))}
          </div>
        </section>

        <section className="result-card">
          <h2>
            {headLane === "all"
              ? "出目TOP30"
              : `${headLane}頭 出目TOP30`}
          </h2>

          <div className="ranking-list">
            {top30.map((item, index) => (
              <div className="ranking-item" key={item.combo}>
                <div
                  className={`ranking-rank ${
                    index === 0
                      ? "gold"
                      : index === 1
                      ? "silver"
                      : index === 2
                      ? "bronze"
                      : ""
                  }`}
                >
                  {index + 1}
                </div>

                <div className="ranking-main">
                  <div className="combo-display">
                    {item.combo.split("-").map((lane, i) => (
                      <span
                        key={i}
                        className={`boat-circle lane-circle-${lane}`}
                      >
                        {lane}
                      </span>
                    ))}
                  </div>

                  <span>{item.count}回</span>
                </div>

                <div className="ranking-stats">
                  <div>
                    <small>出現率</small>
                    <b>{item.hitRate.toFixed(2)}%</b>
                  </div>

                  <div>
                    <small>平均配当</small>
                    <b>
                      {Math.round(item.avgPayout).toLocaleString()}円
                    </b>
                  </div>

                  <div>
                    <small>万舟率</small>
                    <b>{item.manRate.toFixed(1)}%</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Ranking;