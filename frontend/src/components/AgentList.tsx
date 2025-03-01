import type { AgentName } from "../shared-types";
import AgentCard from "./AgentCard.tsx";

interface AgentListProps {
  agents: AgentName[];
}

const AgentList: React.FC<AgentListProps> = (props) => {
  return (
    <div>
      <div className="flex gap-4 items-center">
        {props.agents.map((agent) => (
          <AgentCard key={agent} agent={agent} />
        ))}
        <div className="grow"></div>
      </div>
    </div>
  );
};

export default AgentList;
