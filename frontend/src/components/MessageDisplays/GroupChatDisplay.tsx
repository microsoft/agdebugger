import { AngleDown } from "flowbite-react-icons/outline";
import { useState } from "react";

import GrowTextarea from "../common/GrowTextarea";
import type { MessageDisplayProps } from "./MessageDisplayProps";

const GroupChatAgentDisplay: React.FC<MessageDisplayProps> = ({
  messageDict,
  allowEdit = false,
  setMessage,
  type,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  function getValue(message) {
    if (type === "GroupChatAgentResponse") {
      return message?.agent_response?.chat_message?.content || "";
    }
    if (type === "GroupChatMessage" || type === "GroupChatTermination") {
      return message?.message?.content || "";
    }
    if (type === "GroupChatStart") {
      return message?.messages?.[0]?.content || "";
    }
  }

  function setValue(s: string) {
    setMessage((prev) => {
      const updatedMessage = structuredClone(prev);

      if (type === "GroupChatAgentResponse") {
        updatedMessage.agent_response.chat_message.content = s;
      } else if (
        type === "GroupChatMessage" ||
        type === "GroupChatTermination"
      ) {
        updatedMessage.message.content = s;
      } else if (type === "GroupChatStart") {
        updatedMessage.messages[0].content = s;
      }

      return updatedMessage;
    });
  }

  return (
    <div>
      {allowEdit ? (
        <div>
          <GrowTextarea
            onChange={(e) => setValue(e.target.value)}
            value={getValue(messageDict)}
            className="border-white bg-white font-mono hover:bg-gray-50 focus:bg-gray-50"
          />
          <div className="flex justify-end">
            <button
              className="hover:bg-gray-100 rounded p-1 flex items-center text-sm text-gray-400 my-1"
              onClick={(e) => {
                e.preventDefault();
                setShowDetails(!showDetails);
              }}
            >
              <AngleDown
                size={15}
                className={` ${showDetails ? "" : "-rotate-90"}`}
              />
              <p>Details</p>
            </button>
          </div>
          {showDetails && (
            <div>
              <pre className="font-mono text-sm text-wrap break-all">
                {JSON.stringify(messageDict, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div>
          <pre className="font-mono text-sm text-wrap break-all">
            {JSON.stringify(messageDict, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GroupChatAgentDisplay;
