import { memo } from "react";

import { api } from "../api";
import { useAllowActions } from "../context/AllowActionsContext";
import type { Message, GenericMessage } from "../shared-types";
import MessageCard from "./MessageCard";

interface MessageListProps {
  messageHistory: Message[];
}

const MessageList: React.FC<MessageListProps> = memo(({ messageHistory }) => {
  const { setAllowActions } = useAllowActions();

  const editHistory = (
    messageId: number,
    newMessage: GenericMessage | undefined,
  ) => {
    // write new message to database

    setAllowActions(false);

    api
      .post("/editAndRevertHistoryMessage", {
        timestamp: messageId,
        body: newMessage,
      })
      .then((response) => {
        console.log("Edited success:", response.data);
        setAllowActions(true);
      })
      .catch((error) => {
        console.error("Error editing message:", error);
        setAllowActions(true);
      });
  };

  return (
    <div className="py-2">
      <div className="mb-2 flex gap-2 items-center">
        <h3 className="text-lg">Message History</h3>
      </div>

      <div className="space-y-1">
        {messageHistory.map((message) => (
          <MessageCard
            key={`message.id-${message.timestamp}`}
            editId={message.timestamp}
            timestamp={message.timestamp}
            message={message}
            writeEditAndRevertMessage={editHistory}
            writeMessageTag="Save & revert"
          />
        ))}
      </div>
    </div>
  );
});

export default MessageList;
