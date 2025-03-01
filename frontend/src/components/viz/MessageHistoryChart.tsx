import Tippy from "@tippyjs/react";
import { scaleLinear, scaleBand } from "d3";

import { useHoveredMessage } from "../../context/HoveredMessageContext";
import type {
  MessageHistoryMap,
  MessageHistory,
  Message,
  colorOption,
  ResetMap,
} from "../../shared-types";
import MessageTooltip from "./MessageTooltip";
import ScoreTooltip from "./ScoreTooltip";
import { getMessageField } from "./viz-utils";

interface MessageHistoryChartProps {
  messageHistoryData: MessageHistoryMap;
  colorField: colorOption;
  currentSession?: number;
  getColor: (value: string | undefined | null) => string;
  sessionResetTimestamps: ResetMap;
}

// COLORS
const HIGHLIGHT_COLOR = "#f59e0b"; // amber-500
const PRIMARY_COLOR = "#0e7490"; // primary-700

const MessageHistoryChart: React.FC<MessageHistoryChartProps> = ({
  messageHistoryData,
  colorField,
  currentSession,
  getColor,
  sessionResetTimestamps,
}) => {
  const padding = 10;
  const rectWidth = 20;
  const rectHeight = 10;
  const xSpace = 15;
  const ySpace = 6;
  const axisSpace = 25;

  const longestArrayLength = Math.max(
    ...Object.values(messageHistoryData).map((h) => h.messages.length),
  );

  const scoreSpace = 25;

  const maxYExtent = (longestArrayLength - 1) * (rectHeight + ySpace);
  const maxXExtent =
    Object.keys(messageHistoryData).length * (rectWidth + xSpace);
  const chartHeight =
    padding + axisSpace + maxYExtent + rectHeight + ySpace + scoreSpace;
  const chartWidth = padding + maxXExtent;

  const xScale = scaleBand()
    .domain(Object.keys(messageHistoryData))
    .range([padding, maxXExtent]);

  const yScale = scaleLinear()
    .domain([0, longestArrayLength - 1])
    .range([
      padding + axisSpace + scoreSpace,
      padding + axisSpace + scoreSpace + maxYExtent,
    ]);

  const isNewMessage = (
    timestamp: number,
    current_session_reset_from: number | undefined,
  ): boolean => {
    if (current_session_reset_from === undefined) {
      return true;
    }
    return timestamp >= current_session_reset_from;
  };

  const getMessageColor = (
    message: Message,
    colorField: colorOption,
  ): string => {
    if (colorField === "none") {
      return PRIMARY_COLOR;
    }

    const fieldValue = getMessageField(message, colorField);
    return getColor(fieldValue);
  };

  const getFill = (
    message: Message,
    colorField: colorOption,
    shouldHighlight: boolean,
  ): string => {
    if (shouldHighlight) {
      if (colorField === "none") return HIGHLIGHT_COLOR;
      else return "#000000";
    }

    return getMessageColor(message, colorField);
  };

  const resetMessages = Object.keys(messageHistoryData).reduce(
    (acc: ResetMap, sessionKey: string) => {
      const session = messageHistoryData[Number(sessionKey)];

      const lookingFor: number | undefined =
        sessionResetTimestamps[Number(sessionKey)];

      if (lookingFor === undefined) {
        return acc;
      }
      const firstMessageIndex = session.messages.findIndex(
        (message: Message) => message.timestamp === lookingFor,
      );
      if (firstMessageIndex !== -1) {
        acc[Number(sessionKey)] = firstMessageIndex;
      }
      return acc;
    },
    {},
  );

  const { hoveredMessageId, setHoveredMessageId } = useHoveredMessage();

  // interaction handles
  const handleMessageHover = (message: Message) => {
    setHoveredMessageId(message.timestamp);
  };

  const handleMessageUnhover = () => {
    setHoveredMessageId(undefined);
  };

  const handleRectClick = (timestamp: number) => {
    const target = document.getElementById(`message-timestamp-${timestamp}`);
    if (target) {
      const offset = 120; // Adjust this value as needed
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = target.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <svg
      // className="border-2 border-gray-400"
      height={chartHeight}
      width={chartWidth}
    >
      <g>
        {/* axis */}
        {Object.entries(messageHistoryData).map(
          (
            [session_id, messageHistory]: [string, MessageHistory],
            sessionIdx,
          ) => (
            <g key={`${sessionIdx}-x-axis-group`}>
              <Tippy
                key={`${sessionIdx}-score-tooltip`}
                content={
                  <ScoreTooltip
                    scoreResult={messageHistory.current_session_score}
                  />
                }
                animation={false}
                trigger="mouseenter focus"
                placement="left"
              >
                <text
                  key={`session-${sessionIdx}-tag`}
                  x={xScale(session_id)}
                  y={padding}
                  alignmentBaseline="hanging"
                  textAnchor="start"
                >
                  {messageHistory.current_session_score == undefined
                    ? "❔"
                    : messageHistory.current_session_score.passed
                      ? "✅"
                      : "❌"}
                </text>
              </Tippy>
              <text
                key={`${sessionIdx}-x-axis`}
                // @ts-expect-error scale typing
                x={xScale(session_id) + rectWidth / 2}
                y={padding + axisSpace}
                alignmentBaseline="hanging"
                textAnchor="middle"
                className={
                  Number(session_id) === currentSession ? "font-semibold" : ""
                }
              >
                {session_id}
              </text>
            </g>
          ),
        )}
      </g>

      <g>
        {/* Reset dashes */}
        {Object.entries(resetMessages).map(
          ([session_id, messageIndex]: [string, number]) => (
            <line
              key={`${session_id}-${messageIndex}-reset-line`}
              y1={yScale(messageIndex) + rectHeight / 2}
              y2={yScale(messageIndex) + rectHeight / 2}
              // @ts-expect-error scale typing
              x1={xScale(session_id) - xSpace + 3}
              x2={xScale(session_id)}
              className="stroke-black stroke-[4px]"
            />
          ),
        )}
      </g>

      <g>
        {/* Message lines -- have to be before rects so rects above lines */}
        {Object.entries(messageHistoryData).map(
          (
            [session_id, messageHistory]: [string, MessageHistory],
            sessionIdx,
          ) =>
            messageHistory.messages.map((message: Message, messageIdx) => {
              if (messageIdx > 0) {
                return (
                  <line
                    key={`${sessionIdx}-${messageIdx}-line`}
                    y1={yScale(messageIdx)}
                    y2={yScale(messageIdx - 1) + rectHeight}
                    // @ts-expect-error scale typing
                    x1={xScale(session_id) + rectWidth / 2}
                    // @ts-expect-error scale typing
                    x2={xScale(session_id) + rectWidth / 2}
                    className={`stroke-2 ${
                      isNewMessage(
                        message.timestamp,
                        messageHistory.current_session_reset_from,
                      )
                        ? "stroke-gray-300"
                        : "stroke-gray-100"
                    }`}
                  />
                );
              }
            }),
        )}
      </g>

      {/* Message rectangles  */}
      {Object.entries(messageHistoryData).map(
        (
          [session_id, messageHistory]: [string, MessageHistory],
          sessionIdx,
        ) => (
          <g key={`session-${sessionIdx}`}>
            {messageHistory.messages.map((message: Message, messageIdx) => {
              return (
                <Tippy
                  key={`${sessionIdx}-${messageIdx}-tooltip`}
                  content={<MessageTooltip message={message} />}
                  animation={false}
                  trigger="mouseenter focus"
                  placement="right"
                  hideOnClick={true}
                >
                  <rect
                    onClick={() => handleRectClick(message.timestamp)}
                    onPointerEnter={() => handleMessageHover(message)}
                    onPointerLeave={handleMessageUnhover}
                    key={`${sessionIdx}-${messageIdx}-rect`}
                    y={yScale(messageIdx)}
                    x={xScale(session_id)}
                    width={rectWidth}
                    height={rectHeight}
                    rx={2}
                    ry={2}
                    className={`stroke-[3px] hover:stroke-[4px] ${
                      isNewMessage(
                        message.timestamp,
                        messageHistory.current_session_reset_from,
                      )
                        ? ""
                        : "opacity-10"
                    }`}
                    style={{
                      fill: getFill(
                        message,
                        colorField,
                        message.timestamp === hoveredMessageId,
                      ),

                      stroke: getFill(
                        message,
                        colorField,
                        message.timestamp === hoveredMessageId,
                      ),
                    }}
                  />
                </Tippy>
              );
            })}
          </g>
        ),
      )}
    </svg>
  );
};

export default MessageHistoryChart;
