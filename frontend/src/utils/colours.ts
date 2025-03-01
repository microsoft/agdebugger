const COLOURS_MANUAL = [
  "#59AA1E", // green
  "#1E59AA", // blue
  "#AA1E59", // red
  "#fb923c", // orange
  "#a78bfa", // violet
];

const getColour = (str: string, colorArray: string[]): string => {
  if (str) {
    const hashCode = [...str].reduce((acc, char) => {
      acc = (acc << 5) - acc + char.charCodeAt(0);
      return acc & acc;
    }, 0);

    const index = Math.abs(hashCode) % colorArray.length;
    return colorArray[index];
  }

  return "#9ca3af"; // Default gray 400 if undefined or empty
};

export const stringToColour = (input: unknown): string => {
  if (input === undefined || input === null) {
    return "#9ca3af"; // Default gray 400 if undefined
  }

  const strInput = String(input);
  const lower = strInput.toLowerCase();

  if (lower === "send") {
    return "#59AA1E";
  }
  if (lower === "response") {
    return "#1E59AA";
  }
  if (lower === "publish") {
    return "#AA1E59";
  }

  return getColour(strInput, COLOURS_MANUAL);
};

export const messageTypeFormat = (
  messageName: string | undefined | null,
): string | undefined | null => {
  // map certain message types to a more readable names

  if (messageName === "PublishMessageEnvelope") {
    return "Publish";
  }

  if (messageName === "SendMessageEnvelope") {
    return "Send";
  }

  if (messageName === "ResponseMessageEnvelope") {
    return "Response";
  }

  return messageName;
};
