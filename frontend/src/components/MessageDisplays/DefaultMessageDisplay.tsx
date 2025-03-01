import GrowTextarea from "../common/GrowTextarea";
import type { MessageDisplayProps } from "./MessageDisplayProps";

const DefaultMessageDisplay: React.FC<MessageDisplayProps> = ({
  messageDict,
  allowEdit = false,
  setMessage,
}) => {
  function getValue(message): string {
    return JSON.stringify(message, null, 2);
  }

  function handleEdit(newValue: string) {
    const newMessage = JSON.parse(newValue);
    setMessage(newMessage);
  }

  return (
    <div>
      {allowEdit ? (
        <GrowTextarea
          onChange={(e) => {
            handleEdit(e.target.value);
          }}
          value={getValue(messageDict)}
          className="border-white bg-white font-mono hover:bg-gray-50 focus:bg-gray-50"
        />
      ) : (
        <div>
          <pre className="font-mono text-sm text-wrap break-all">
            {getValue(messageDict)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DefaultMessageDisplay;
