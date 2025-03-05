import type { Message } from "../../shared-types";

export const getMessageField = (
  message: Message,
  field: "type" | "sender" | "recipient",
): string | null => {
  if (field === "type") {
    // @ts-expect-error might have type
    const type = message.message.type;
    if (type === undefined) {
      return "Thought";
    }
    return type;
  }
  return message[field];
};

// colors
// schemeTableau10 without orange
export const COLOR_RANGE = [
  "#4e79a7",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc949",
  "#af7aa1",
  "#ff9da7",
  "#9c755f",
];
