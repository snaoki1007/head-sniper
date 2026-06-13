import { useRef } from "react";

const laneNames = ["白", "黒", "赤", "青", "黄", "緑"];

function formatExhibitionTime(value) {
  const numbersOnly = value.replace(/[^0-9]/g, "");

  if (numbersOnly.length === 0) return "";

  // 670 → 6.70
  if (numbersOnly.length === 3) {
    return `${numbersOnly[0]}.${numbersOnly.slice(1)}`;
  }

  // 6670 → 6.70
  if (numbersOnly.length >= 4) {
    return `${numbersOnly[0]}.${numbersOnly.slice(2, 4)}`;
  }

  return numbersOnly;
}

function RacerInput({ racers, setRacers, onPredict }) {
  const inputRefs = useRef([]);

  const moveToNextInput = (currentInputIndex) => {
    const nextInput = inputRefs.current[currentInputIndex + 1];

    if (nextInput) {
      nextInput.focus();
      return;
    }

    if (onPredict) {
      onPredict();
    }
  };

  const handleChange = (index, field, value, inputIndex) => {
    let cleanValue = value;

    if (field === "racerNo") {
      cleanValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    }

    if (field === "exhibitionTime") {
      cleanValue = formatExhibitionTime(value);
    }

    const newRacers = [...racers];
    newRacers[index] = {
      ...newRacers[index],
      [field]: cleanValue,
    };

    setRacers(newRacers);

    if (field === "racerNo" && cleanValue.length === 4) {
      setTimeout(() => moveToNextInput(inputIndex), 50);
    }

    if (field === "exhibitionTime" && cleanValue.length === 4) {
      setTimeout(() => moveToNextInput(inputIndex), 50);
    }
  };

  const handleKeyDown = (e, inputIndex) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    moveToNextInput(inputIndex);
  };

  return (
    <section className="input-card">
      <h2>出走表入力</h2>

      <div className="racer-grid">
        {racers.map((racer, index) => {
          const racerInputIndex = index * 2;
          const exhibitionInputIndex = index * 2 + 1;

          return (
            <div className={`racer-row lane-${index + 1}`} key={index}>
              <div className="lane-badge">
                <span>{index + 1}号艇</span>
                <small>{laneNames[index]}</small>
              </div>

              <input
                ref={(el) => (inputRefs.current[racerInputIndex] = el)}
                className="racer-input"
                type="tel"
                value={racer.racerNo}
                onChange={(e) =>
                  handleChange(
                    index,
                    "racerNo",
                    e.target.value,
                    racerInputIndex
                  )
                }
                onKeyDown={(e) => handleKeyDown(e, racerInputIndex)}
                placeholder="選手番号"
                inputMode="numeric"
                enterKeyHint="next"
              />

              <input
                ref={(el) => (inputRefs.current[exhibitionInputIndex] = el)}
                className="racer-input"
                type="tel"
                value={racer.exhibitionTime}
                onChange={(e) =>
                  handleChange(
                    index,
                    "exhibitionTime",
                    e.target.value,
                    exhibitionInputIndex
                  )
                }
                onKeyDown={(e) => handleKeyDown(e, exhibitionInputIndex)}
                placeholder="展示 670"
                inputMode="numeric"
                enterKeyHint={index === 5 ? "go" : "next"}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RacerInput;