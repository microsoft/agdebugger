import type { ScoreResult } from "../../shared-types";

interface MessageTooltipProps {
  scoreResult?: ScoreResult;
}

const renderScoreTooltipContent = (scoreResult?: ScoreResult) => {
  if (scoreResult == undefined) {
    return "No score for this session. Try running score function";
  }

  const header = scoreResult.passed ? "Session passing!" : "Session failing!";

  return (
    <div>
      <div>{header}</div>
      <div>Expected: {scoreResult.expected}</div>
      <div>Actual: {scoreResult.actual}</div>
    </div>
  );
};
const ScoreTooltip: React.FC<MessageTooltipProps> = ({ scoreResult }) => {
  return (
    <div className="bg-white p-2 shadow-md rounded-lg flex flex-col text-sm">
      {renderScoreTooltipContent(scoreResult)}
    </div>
  );
};

export default ScoreTooltip;
