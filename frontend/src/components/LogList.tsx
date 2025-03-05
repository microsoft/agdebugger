import { AngleRight, AngleDown } from "flowbite-react-icons/outline";
import { useState } from "react";

import type { LogMessage } from "../shared-types";
import LogDisplay from "./LogDisplay";

interface LogListProps {
  logs: LogMessage[];
}

const LogList: React.FC<LogListProps> = ({ logs }) => {
  const [show, setShow] = useState<boolean>(false);

  return (
    <div className="bg-white p-4 shadow-md rounded-lg overflow-auto max-h-[500px]">
      <button
        className="flex gap-2 items-center"
        onClick={() => {
          setShow(!show);
        }}
      >
        {show ? <AngleDown size={15} /> : <AngleRight size={15} />}

        <h3 className="text-lg">Logs</h3>
      </button>

      {show && logs.map((log, index) => <LogDisplay key={index} log={log} />)}
    </div>
  );
};

export default LogList;
