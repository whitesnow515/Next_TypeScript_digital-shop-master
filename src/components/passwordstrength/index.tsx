import React, { useEffect, useState } from "react";

import zxcvbn from "zxcvbn";

// components
import Item from "./Item";

export interface PasswordFeedback {
  warning?: string;
  suggestions?: string[];
}

interface PasswordStrengthBarState {
  score: number;
}

export interface PasswordStrengthBarProps {
  className?: string;
  style?: React.CSSProperties;
  scoreWordClassName?: string;
  scoreWordStyle?: React.CSSProperties;
  password: string;
  userInputs?: string[];
  barColors?: string[];
  scoreWords?: React.ReactNode[];
  minLength?: number;
  shortScoreWord?: React.ReactNode;
  onChangeScore?: (
    score: PasswordStrengthBarState["score"],
    feedback: PasswordFeedback
  ) => void;
}

const rootStyle: React.CSSProperties = {
  position: "relative",
};

const wrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  margin: "8px 0 0",
};

const spaceStyle: React.CSSProperties = {
  width: 4,
};

const descStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#898792",
  fontSize: 14,
  textAlign: "right",
};

const PasswordStrengthBar = ({
  className,
  style,
  scoreWordClassName,
  scoreWordStyle,
  password,
  userInputs = [],
  barColors = ["#ddd", "#ef4836", "#f6b44d", "#2b90ef", "#25c281"],
  scoreWords = ["weak", "weak", "okay", "good", "strong"],
  minLength = 4,
  shortScoreWord = "too short",
  onChangeScore,
}: PasswordStrengthBarProps): JSX.Element => {
  const [score, setScore] = useState(0);
  const calculateScore = (): number => {
    let result = null;
    let newScore = 0;
    let feedback: PasswordFeedback = {};
    if (password.length >= minLength) {
      result = zxcvbn(password, userInputs);
      ({ score: newScore, feedback } = result);
    }
    if (onChangeScore) {
      onChangeScore(newScore, feedback);
    }
    return newScore;
  };

  useEffect(() => {
    setScore(calculateScore());
  }, [password]);

  const newShortScoreWord =
    password.length >= minLength ? scoreWords[score] : shortScoreWord;

  return (
    <div className={className} style={{ ...rootStyle, ...style }}>
      <div style={wrapStyle}>
        {[1, 2, 3].map((el: number) => (
          <React.Fragment key={`password-strength-bar-item-${el}`}>
            {el > 1 && <div style={spaceStyle} />}
            <Item score={score} itemNum={el} barColors={barColors} />
          </React.Fragment>
        ))}
      </div>
      <p
        className={scoreWordClassName}
        style={{ ...descStyle, ...scoreWordStyle }}
      >
        {newShortScoreWord}
      </p>
    </div>
  );
};

export default PasswordStrengthBar;
