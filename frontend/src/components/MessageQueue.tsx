import { ReactNode, memo } from "react";

import { api } from "../api";
import type { Message, GenericMessage } from "../shared-types";
import MessageCard from "./MessageCard";

interface MessageQueueProps {
  messages: Message[];
  runControls: ReactNode;
  numOutstandingTasks?: number;
}

const MessageQueue: React.FC<MessageQueueProps> = memo(
  ({ messages, runControls, numOutstandingTasks }) => {
    const editQueue = (idx: number, newMessage: GenericMessage | undefined) => {
      // edit queue requires non-null content
      api
        .post("/editQueue", {
          idx,
          body: newMessage,
        })
        .then((response) => {
          console.log("Edited success:", response.data);
        })
        .catch((error) => console.error("Error editing message:", error));
    };

    const messagesWithIndex = messages.map((message, index) => ({
      message,
      originalIndex: index,
    }));

    return (
      <div className="py-2">
        <div className="mb-2 flex gap-2 items-center">
          <div className="flex flex-col">
            <h3 className="text-lg">Message Queue</h3>
            <div className="">
              <span className="font-semibold">{numOutstandingTasks}</span>
              {` task${numOutstandingTasks === 1 ? "" : "s"} running`}
            </div>
          </div>
          <div className="grow" />

          {runControls}
        </div>

        <div className="space-y-1 max-h-[700px] overflow-y-auto pb-4 border-b-2 border-b-gray-200">
          {messagesWithIndex
            .slice()
            .reverse()
            .map(({ message, originalIndex }) => (
              <MessageCard
                key={message.id}
                editId={originalIndex}
                timestamp={message.timestamp}
                message={message}
                writeEditAndRevertMessage={editQueue}
                writeMessageTag="Save edit"
                allowRevert={false}
                shouldBold={originalIndex === 0}
              />
            ))}
        </div>
      </div>
    );
  },
);

export default MessageQueue;
