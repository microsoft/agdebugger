import type { LogMessage } from "../shared-types";

interface LogDisplayProps {
  log: LogMessage;
}

function getLogColor(level: string): string {
  if (level === "INFO") {
    return "text-stone-500";
  }
  if (level === "DEBUG") {
    return "text-indigo-500";
  }
  if (level === "ERROR") {
    return "text-red-500";
  }

  return "text-black";
}

const LogDisplay: React.FC<LogDisplayProps> = ({ log }) => {
  const toggled = true;

  return (
    <div
      className={`flex gap-1 w-full hover:bg-gray-100 text-left text-sm break-all ${toggled ? "" : ""}`}
    >
      <div className={`font-mono ${toggled ? "text-wrap" : "truncate"}`}>
        <span className={`font-semibold ${getLogColor(log.level)}`}>
          {log.level}:{" "}
        </span>
        {String(log.message).substring(0, 200)}
        {String(log.message).length > 200 ? "..." : ""}
      </div>
    </div>
  );
};

export default LogDisplay;
