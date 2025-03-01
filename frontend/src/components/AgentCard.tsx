import { Button, Modal } from "flowbite-react";
import { useEffect, useState } from "react";

import { api } from "../api";
import type { AgentName } from "../shared-types";

interface AgentCardProps {
  agent: AgentName;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [agentState, setAgentState] = useState<object>();

  useEffect(() => {
    fetchAgentState();
  }, []);

  function openModal() {
    fetchAgentState();
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  async function fetchAgentState() {
    try {
      await api
        .get(`/state/${agent}/get`)
        .then((response) => {
          if (response.data?.status === "error") {
            setErrorMessage(JSON.stringify(response.data.message));
          } else {
            setErrorMessage("");
            const agentInfo = response.data;

            setAgentState(agentInfo["state"]);
          }
        })
        .catch((error) => console.error("Error fetching agents:", error));
    } catch (e) {
      setErrorMessage(String(e));
    }
  }

  return (
    <>
      <Button
        className="min-w-[140px] shadow-md border-primary-800 text-primary-800 bg-gray-50"
        color="light"
        onClick={openModal}
        size="sm"
      >
        <h3 className="">{agent}</h3>
      </Button>

      <Modal show={modalIsOpen} dismissible size="3xl" onClose={closeModal}>
        <Modal.Header>{agent}</Modal.Header>

        <Modal.Body>
          {agentState && (
            <div>
              <div className="text-lg mt-2">Agent State (read-only)</div>
              <pre className="text-sm text-wrap break-all pl-2">
                {JSON.stringify(agentState, null, 2)}
              </pre>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {errorMessage && (
            <span className="text-red-500">Error: {errorMessage}</span>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AgentCard;
