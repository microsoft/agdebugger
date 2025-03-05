import { Close } from "flowbite-react-icons/outline";
import { Reply } from "flowbite-react-icons/solid";
import _ from "lodash";
import React, { useState, useEffect, memo } from "react";

import { useAllowActions } from "../context/AllowActionsContext";
import { useHoveredMessage } from "../context/HoveredMessageContext";
import type { Message, GenericMessage } from "../shared-types";
import { messageTypeFormat } from "../utils/colours";
import DisplayMessage from "./MessageDisplays/DisplayMessage";

interface MessageProps {
  message: Message;
  editId: number;
  timestamp?: number;
  writeEditAndRevertMessage: (
    id: number,
    message: GenericMessage | undefined,
  ) => void;
  writeMessageTag?: string;
  allowRevert?: boolean;
  shouldBold?: boolean;
}

type UnknownDict = { [key: string]: unknown };

interface MessageInfo {
  outerMessageType: "Publish" | "Send" | "Response";
  innerMessageType: string;
  sender: string | undefined;
  recipient: string | undefined;
  innerMessage: UnknownDict;
  canEditContent: boolean;
}

function parseMessage(message: Message): MessageInfo {
  const innerMessage = message.message as GenericMessage;

  const outerKind = messageTypeFormat(message.type) as
    | "Publish"
    | "Send"
    | "Response";
  let sender: string | undefined = undefined;
  let recipient: string | undefined = undefined;

  if (message.type === "PublishMessageEnvelope") {
    sender = message.sender ?? "User";
    recipient = "Group";
  } else if (message.type === "SendMessageEnvelope") {
    sender = message.sender ?? "User";
    recipient = (message.recipient as string) ?? "Unknown";
  } else if (message.type === "ResponseMessageEnvelope") {
    sender = message.sender as string;
    recipient = message.recipient ?? "User";
  } else if (message.type === "ThoughtMessage") {
    sender = message.sender + " 🧠";
  } else {
    console.warn(
      "Invalid Outer Message type: " +
        message.type +
        "\nEntire message: " +
        message,
    );
  }

  // const contentStr: string =
  //   innerMessage.type == undefined
  //     ? String(innerMessage)
  //     : JSON.stringify(innerMessage, null, 2);
  const canEditContent: boolean =
    outerKind === "Send" || outerKind === "Publish";

  return {
    outerMessageType: outerKind,
    // @ts-expect-error ignore bro it has type
    innerMessageType: innerMessage.type,
    sender,
    recipient,
    innerMessage,
    canEditContent,
  };
}

function getMessageTypeDisplay(inner?: string, outer?: string) {
  if (inner != undefined && outer != undefined)
    return `${outer ?? ""} - ${inner ?? ""}`;
  if (inner != undefined) return inner;
  return outer;
}

const MessageCard: React.FC<MessageProps> = memo(
  ({
    message,
    editId,
    timestamp,
    writeEditAndRevertMessage,
    writeMessageTag = "Save edit",
    allowRevert = true,
    shouldBold,
  }) => {
    const [outerMessage, setOuterMessage] = useState<MessageInfo>();
    const [innerMessage, setInnerMessage] = useState<unknown>();
    const [originalInnerMessage, setOriginalInnerMessage] = useState<unknown>();

    // hooks
    const { hoveredMessageId, setHoveredMessageId } = useHoveredMessage();
    const { allowActions } = useAllowActions();

    useEffect(() => {
      const parsed = parseMessage(message);

      setOuterMessage(parsed);
      setOriginalInnerMessage(parsed.innerMessage);
      setInnerMessage(parsed.innerMessage);
    }, [message]);

    useEffect(() => {
      setOuterMessage((prev) => {
        if (prev != undefined) {
          const updatedMessage = structuredClone(prev);
          // @ts-expect-error will be fine
          updatedMessage.innerMessage = innerMessage;
          return updatedMessage;
        }
      });
    }, [innerMessage, setOuterMessage]);

    // edit and reset message
    const saveAndRevertMessage = () => {
      if (outerMessage === undefined) return;

      writeEditAndRevertMessage(editId, outerMessage.innerMessage);
    };

    // reset message no edit
    const revertToMessage = () => {
      writeEditAndRevertMessage(editId, undefined);
    };

    return (
      outerMessage != undefined && (
        <div
          id={`message-timestamp-${timestamp}`}
          className={`bg-white p-4 shadow-md rounded-lg border-2 ${timestamp === hoveredMessageId ? "border-amber-500" : "border-white"} ${shouldBold ? "border-l-4 border-l-primary-700" : ""}`}
          onPointerEnter={() => {
            timestamp != undefined && setHoveredMessageId(timestamp);
          }}
          onPointerLeave={() => setHoveredMessageId(undefined)}
        >
          <div className="flex items-center gap-2">
            <span className="">
              {outerMessage.sender}{" "}
              {outerMessage.recipient != undefined &&
                "→ " + outerMessage.recipient}
            </span>
            <div className="grow" />

            <span className="text-xs text-gray-500">
              {getMessageTypeDisplay(
                outerMessage.innerMessageType,
                outerMessage.outerMessageType,
              )}
            </span>
            <span
              className={`font-semibold ${timestamp === hoveredMessageId ? "text-amber-500" : "font-semibold text-gray-400"}`}
            >
              {timestamp}
            </span>

            {allowRevert &&
              (outerMessage.outerMessageType === "Send" ||
                outerMessage.outerMessageType === "Publish") && (
                <button
                  className="hover:bg-gray-100 text-primary-700 hover:text-primary-800 rounded p-1 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Reset to this message"
                  onClick={revertToMessage}
                  disabled={!allowActions}
                >
                  <Reply size={20} />
                </button>
              )}
          </div>

          <hr className="my-2" />
          <div className="overflow-auto max-h-[500px] p-1">
            <DisplayMessage
              type={outerMessage.innerMessageType}
              allowEdit={outerMessage.canEditContent}
              setMessage={setInnerMessage}
              messageDict={outerMessage.innerMessage}
            />
          </div>
          {outerMessage.canEditContent &&
            !_.isEqual(originalInnerMessage, outerMessage.innerMessage) && (
              <div className="flex items-center gap-2 justify-end mt-2">
                <button
                  className="hover:bg-gray-100 rounded"
                  title="Undo edit"
                  onClick={() => setInnerMessage(originalInnerMessage)}
                >
                  <Close size={20} className="text-gray-500" />
                </button>
                <button
                  className="bg-primary-700 hover:bg-primary-800 text-white py-1 px-2 rounded text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={saveAndRevertMessage}
                  disabled={!allowActions}
                >
                  {writeMessageTag}
                </button>
              </div>
            )}
        </div>
      )
    );
  },
);

export default MessageCard;
