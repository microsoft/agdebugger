import React from "react";

import DefaultMessageDisplay from "./DefaultMessageDisplay";
import EmptyMessageDisplay from "./EmptyMessageDisplay";
import GroupChatDisplay from "./GroupChatDisplay";
import type { MessageDisplayProps } from "./MessageDisplayProps";

const MESSAGE_DISPLAYS: { [key: string]: React.FC<MessageDisplayProps> } = {
  default: DefaultMessageDisplay,
  None: EmptyMessageDisplay,
  RequestReplyMessage: EmptyMessageDisplay,
  ResetMessage: EmptyMessageDisplay,
  GroupChatRequestPublish: EmptyMessageDisplay,
  GroupChatReset: EmptyMessageDisplay,
  GroupChatStart: GroupChatDisplay,
  GroupChatMessage: GroupChatDisplay,
  GroupChatAgentResponse: GroupChatDisplay,
  GroupChatTermination: GroupChatDisplay,
};

const DisplayMessage: React.FC<MessageDisplayProps> = (props) => {
  const ComponentToRender =
    props.type != undefined ? MESSAGE_DISPLAYS[props.type] : undefined;

  if (!ComponentToRender) {
    return React.createElement(MESSAGE_DISPLAYS["default"], props);
  }

  return React.createElement(ComponentToRender, props);
};

export default DisplayMessage;
