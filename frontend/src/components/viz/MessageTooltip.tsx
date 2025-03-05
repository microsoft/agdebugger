import type { Message } from "../../shared-types";

interface MessageTooltipProps {
  message: Message;
}

function getRecipient(message: Message): string {
  // @ts-expect-error might have type
  if (message.message?.type == undefined) return "";

  const recep = message.recipient ?? "Group";

  return " → " + recep;
}

const MessageTooltip: React.FC<MessageTooltipProps> = ({ message }) => {
  return (
    <div className="bg-white p-2 shadow-md rounded-lg flex flex-col text-sm">
      <div className="text-gray-400 font-semibold">
        Timestamp {message.timestamp}
      </div>
      <div>
        {message.sender ?? "User"}
        {getRecipient(message)}
      </div>
      {/* @ts-expect-error might have type */}
      <div>{message?.message?.type}</div>
    </div>
  );
};

export default MessageTooltip;
