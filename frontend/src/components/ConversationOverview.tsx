import { scaleOrdinal } from "d3";
import { useEffect, useState } from "react";

import type {
  colorOption,
  Message,
  MessageHistoryMap,
  ResetMap,
} from "../shared-types";
import MessageHistoryChart from "./viz/MessageHistoryChart";
import { COLOR_RANGE, getMessageField } from "./viz/viz-utils";

interface ConversationOverviewProps {
  messageHistoryData: MessageHistoryMap;
  currentSession: number;
}

const ConversationOverview: React.FC<ConversationOverviewProps> = ({
  messageHistoryData,
  currentSession,
}) => {
  const [colorEncode, setColorEncode] = useState<colorOption>("type");
  const colorEncodeOptions: colorOption[] = [
    "none",
    "type",
    "sender",
    "recipient",
  ];
  const [filterValue, setFilterValue] = useState<string>();
  const [displayHistory, setDisplayHistory] = useState<
    MessageHistoryMap | undefined
  >(messageHistoryData);

  const uniqueValues =
    colorEncode === "none" || messageHistoryData == undefined
      ? []
      : Array.from(
          new Set(
            Object.values(messageHistoryData).flatMap((h) =>
              h.messages.map((message: Message) =>
                getMessageField(message, colorEncode),
              ),
            ),
          ),
        ).sort();

  const sessionResetTimestamps = Object.keys(messageHistoryData).reduce(
    (acc: ResetMap, sessionKey: string) => {
      const session = messageHistoryData[Number(sessionKey)];
      const firstMessage = session.messages.find(
        (message: Message) =>
          session.current_session_reset_from != undefined &&
          message.timestamp > session.current_session_reset_from,
      );
      // const firstMessage = firstMessageIndex !== -1 ? session.messages[firstMessageIndex] : undefined;
      if (firstMessage != undefined) {
        acc[Number(sessionKey)] = firstMessage.timestamp;
      }
      return acc;
    },
    {},
  );

  const updateFilterValue = (value: string) => {
    if (filterValue === value) {
      setFilterValue(undefined);
    } else {
      setFilterValue(value);
    }
  };

  const shouldDisplay = (
    message: Message,
    currentFilterValue: string | undefined,
    _colorField: colorOption,
  ): boolean => {
    if (currentFilterValue === undefined || _colorField === "none") {
      return true;
    }

    return currentFilterValue === getMessageField(message, _colorField);
  };

  useEffect(() => {
    if (messageHistoryData != undefined) {
      const filteredHistory: MessageHistoryMap = {};

      for (const [key, session] of Object.entries(messageHistoryData)) {
        const filteredMessages = session.messages.filter((message: Message) =>
          shouldDisplay(message, filterValue, colorEncode),
        );
        filteredHistory[Number(key)] = {
          ...session,
          messages: filteredMessages,
        };
      }

      setDisplayHistory(filteredHistory);
    }
  }, [messageHistoryData, filterValue, colorEncode]);

  const _colorScale = scaleOrdinal<string>()
    .domain(uniqueValues)
    .range(COLOR_RANGE);

  const getColor = (str: string | undefined | null): string => {
    if (!str) {
      return "#9ca3af"; // Default gray 400 if undefined or empty
    }

    return _colorScale(str);
  };

  if (displayHistory != undefined)
    return (
      // <div className="py-2 px-4 border-b-2 border-gray-300">
      <div className="sticky top-0 z-10 h-screen overflow-y-auto shrink-0 border-l-2 border-gray-200 py-2 px-4">
        <div className="flex gap-4 items-end">
          <h3 className="text-lg font-semibold">Overview</h3>
          <div className="">
            Session <span className="font-semibold">{currentSession}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          Color:
          <select
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setColorEncode(e.target.value as colorOption);
              setFilterValue(undefined);
            }}
            // sizing={"sm"}
            value={colorEncode}
            // color="light"
            title="Color encoding"
            className="text-sm border-none bg-gray-100 rounded p-1 w-24"
          >
            {colorEncodeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="inline-block align-top">
            <MessageHistoryChart
              messageHistoryData={displayHistory}
              colorField={colorEncode}
              currentSession={currentSession}
              getColor={getColor}
              sessionResetTimestamps={sessionResetTimestamps}
            />
          </div>
          {/* legend */}
          <div className="inline-block align-top mt-14 ml-2 sticky top-5 z-10">
            {uniqueValues.map((value) => (
              <button
                key={value}
                className="flex items-center gap-2"
                onClick={() => updateFilterValue(value)}
              >
                <div
                  className="h-4 w-4 rounded-sm"
                  style={{
                    backgroundColor: getColor(value),
                  }}
                />
                {value == undefined || value == null ? (
                  <span
                    className={`text-sm italic ${value === filterValue ? "font-bold" : ""}`}
                  >
                    Null
                  </span>
                ) : (
                  <span
                    className={`text-sm ${value === filterValue ? "font-bold" : ""}`}
                  >
                    {value}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
};

export default ConversationOverview;
