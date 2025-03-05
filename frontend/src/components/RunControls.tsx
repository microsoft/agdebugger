import { Button, Spinner } from "flowbite-react";
import { ForwardStep, TrashBin } from "flowbite-react-icons/outline";
import { CaretRight, Stop } from "flowbite-react-icons/solid";

import { useAllowActions } from "../context/AllowActionsContext";

interface RunProps {
  messagesAreHere: boolean;
  onProcessNext: () => void;
  onDropNext: () => void;
  setLoop: (val: "start" | "stop") => void;
  loopRunning: boolean;
}

const RunControls: React.FC<RunProps> = ({
  messagesAreHere,
  onProcessNext,
  onDropNext,
  setLoop,
  loopRunning,
}) => {
  const { allowActions } = useAllowActions();

  return (
    <div className="flex items-center justify-end gap-1">
      {!allowActions && <Spinner />}

      {loopRunning ? (
        <Button
          onClick={() => setLoop("stop")}
          title="Halt running"
          size="xs"
          color={"failure"}
        >
          <Stop />
        </Button>
      ) : (
        <Button
          onClick={() => setLoop("start")}
          title="Start running"
          size="xs"
          color={"success"}
          disabled={!allowActions}
        >
          <CaretRight />
        </Button>
      )}

      <Button
        onClick={onProcessNext}
        title="Process next"
        size="xs"
        color={"green"}
        disabled={!messagesAreHere || !allowActions}
      >
        <ForwardStep />
      </Button>

      <Button
        onClick={onDropNext}
        title="Drop next"
        size="xs"
        color={"red"}
        disabled={!messagesAreHere || !allowActions}
      >
        <TrashBin />
      </Button>
    </div>
  );
};

export default RunControls;
