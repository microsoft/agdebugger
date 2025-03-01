const TEXT_MESSAGE = { source: "user", content: "", type: "TextMessage" };

export const DEFAULT_MESSAGES: {
  [key: string]: unknown;
} = {
  GroupChatStart: {
    messages: [TEXT_MESSAGE],
    type: "GroupChatStart",
  },
  GroupChatAgentResponse: {
    agent_response: {
      chat_message: TEXT_MESSAGE,
    },
    type: "GroupChatAgentResponse",
  },
  GroupChatMessage: {
    message: TEXT_MESSAGE,
    type: "GroupChatMessage",
  },
  GroupChatTermination: {
    message: { type: "StopMessage", content: "", source: "user" },
    type: "GroupChatTermination",
  },
};
