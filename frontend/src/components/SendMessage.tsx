import { Select, Button } from "flowbite-react";
import { PaperPlane } from "flowbite-react-icons/outline";
import React, { useEffect, useState } from "react";
import { memo } from "react";

import { api } from "../api";
import { useAllowActions } from "../context/AllowActionsContext";
import type { AgentName, MessageTypeDescription } from "../shared-types";
import { DEFAULT_MESSAGES } from "../utils/default-messages";
import DisplayMessage from "./MessageDisplays/DisplayMessage";

interface SendMessageProps {
  agents: AgentName[];
  onSend: () => void;
  topics: string[];
}

type SendOption = "dm" | "publish";

function makeDefaultMessage(metadata: MessageTypeDescription) {
  if (metadata.name in DEFAULT_MESSAGES) {
    return DEFAULT_MESSAGES[metadata.name];
  } else {
    const message = {};
    metadata.fields?.forEach((field) => {
      message[field.name] = "";
    });
    message["type"] = metadata.name;
    return message;
  }
}

const SendMessage: React.FC<SendMessageProps> = memo((props) => {
  const [sendType, setSendType] = useState<SendOption>("dm");
  const [newMessage, setNewMessage] = useState<unknown>({});
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [messageInfoDict, setMessageInfoDict] = useState<{
    [key: string]: MessageTypeDescription;
  }>({});
  const [selectedMessageType, setSelectedMessageType] = useState<string>(
    Object.keys(messageInfoDict)[0],
  );

  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(
    props.agents.length > 0 ? props.agents[0] : undefined,
  );
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(
    props.topics.length > 0 ? props.topics[0] : undefined,
  );

  // Ensure selectedAgent is only set once
  useEffect(() => {
    if (!selectedAgent && props.agents.length > 0) {
      setSelectedAgent(props.agents[0]);
    }
  }, [props.agents, selectedAgent]);

  // Ensure selectedTopic is only set once
  useEffect(() => {
    if (!selectedTopic && props.topics.length > 0) {
      setSelectedTopic(props.topics[0]);
    }
  }, [props.topics, selectedTopic]);

  useEffect(() => {
    api
      .get<{ [key: string]: MessageTypeDescription }>("/message_types")
      .then((response) => {
        const infoDict = response.data;
        const selectedM = Object.keys(infoDict)[0];
        setMessageInfoDict(infoDict);
        setSelectedMessageType(selectedM);
        setNewMessage(makeDefaultMessage(infoDict[selectedM]));
      })
      .catch((error) => console.error("Error fetching message types:", error));
  }, []);

  const handleMessageTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMessageType = e.target.value;

    setNewMessage(makeDefaultMessage(messageInfoDict[newMessageType]));

    setSelectedMessageType(newMessageType);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedAgent === null) {
      setErrorMessage("Please select an agent or Publish");
      return;
    }
    if (selectedMessageType === null) {
      setErrorMessage("Please select a message type");
      return;
    }
    if (newMessage == undefined || newMessage == "") {
      setErrorMessage("Please enter a message");
      return;
    }

    if (sendType === "publish") {
      api
        .post("/publish", {
          body: newMessage,
          type: selectedMessageType,
          topic: selectedTopic,
        })
        .then(() => {
          setErrorMessage("");
          props.onSend();
          setNewMessage(
            makeDefaultMessage(messageInfoDict[selectedMessageType]),
          );
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          setErrorMessage(error.message);
        });
    } else {
      api
        .post("/send", {
          recipient: selectedAgent,
          body: newMessage,
          type: selectedMessageType,
        })
        .then(() => {
          setErrorMessage("");
          props.onSend();
          setNewMessage(
            makeDefaultMessage(messageInfoDict[selectedMessageType]),
          );
        })
        .catch((error) => console.error("Error sending message:", error));
    }
  };

  const { allowActions } = useAllowActions();

  return (
    <div>
      <div className="bg-white p-4 shadow-md rounded-lg">
        <h3 className="text-lg mb-2">New Message</h3>

        <form onSubmit={handleSubmit} spellCheck={false}>
          <div className="flex my-1 gap-2 items-center">
            <Select
              id="sendTypeSelect"
              onChange={(e) => setSendType(e.target.value as SendOption)}
              className="w-30"
              value={sendType}
            >
              <option key={`publish`} value={`publish`}>
                Publish
              </option>

              <option key={`dm`} value={`dm`}>
                Direct Message
              </option>
            </Select>
            {sendType === "dm" ? (
              <>
                to
                <Select
                  id="agentSelect"
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-48"
                  value={selectedAgent || ""}
                >
                  {props.agents.map((agent) => (
                    <option key={`${agent}`} value={`${agent}`}>
                      {`${agent}`}
                    </option>
                  ))}
                </Select>
              </>
            ) : (
              <>
                to topic
                <Select
                  id="topicSelect"
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-40"
                  value={selectedTopic}
                >
                  {props.topics.map((t) => (
                    <option key={`${t}`} value={`${t}`}>
                      {`${t}`}
                    </option>
                  ))}
                </Select>
              </>
            )}

            <Button
              type="submit"
              disabled={!selectedAgent || !selectedMessageType || !allowActions}
              title="Send Message"
              size="xs"
            >
              <PaperPlane className="rotate-90" />
            </Button>
          </div>

          <hr className="my-2" />

          <Select
            id="messageTypeSelect"
            onChange={handleMessageTypeChange}
            className="w-48 mb-2"
            value={selectedMessageType || ""}
          >
            {Object.keys(messageInfoDict).map((m) => (
              <option className="py-16" key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>

          <DisplayMessage
            type={selectedMessageType}
            allowEdit={true}
            setMessage={setNewMessage}
            messageDict={newMessage}
          />

          {errorMessage !== "" && (
            <span>
              <span className="font-semibold text-red-500">Error: </span>
              {errorMessage}
            </span>
          )}
        </form>
      </div>
    </div>
  );
});

export default SendMessage;
