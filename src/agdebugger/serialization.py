import json
from dataclasses import dataclass
from typing import Dict, List

from autogen_agentchat.messages import (
    AgentEvent,
    ChatMessage,
    HandoffMessage,
    MemoryQueryEvent,
    MultiModalMessage,
    StopMessage,
    TextMessage,
    ToolCallExecutionEvent,
    ToolCallRequestEvent,
    ToolCallSummaryMessage,
    UserInputRequestedEvent,
)
from autogen_agentchat.teams._group_chat._events import (
    GroupChatAgentResponse,
    GroupChatMessage,
    GroupChatRequestPublish,
    GroupChatReset,
    GroupChatStart,
    GroupChatTermination,
)
from autogen_core.models import (
    AssistantMessage,
    FunctionExecutionResult,
    FunctionExecutionResultMessage,
    LLMMessage,
    SystemMessage,
    UserMessage,
)


@dataclass
class FieldInfo:
    name: str
    type: str
    required: bool


@dataclass
class MessageTypeDescription:
    name: str
    fields: List[FieldInfo] | None = None


def get_message_type_descriptions() -> Dict[str, MessageTypeDescription]:
    """
    Gets the message type descriptions for user-sendable messages for agentchat:
    - TextMessage, MultiModalMessage, StopMessage, HandoffMessage
    """

    return {
        # "TextMessage": MessageTypeDescription(
        #     name="TextMessage",
        #     fields=[
        #         FieldInfo(name="source", type="str", required=True),
        #         FieldInfo(name="content", type="str", required=True),
        #         FieldInfo(name="type", type="str", required=True),
        #     ],
        # ),
        # "MultiModalMessage": MessageTypeDescription(
        #     name="MultiModalMessage",
        #     fields=[
        #         FieldInfo(name="source", type="str", required=True),
        #         FieldInfo(name="content", type="List[str]", required=True),
        #         FieldInfo(name="type", type="str", required=True),
        #     ],
        # ),
        # "StopMessage": MessageTypeDescription(
        #     name="StopMessage",
        #     fields=[
        #         FieldInfo(name="source", type="str", required=True),
        #         FieldInfo(name="content", type="str", required=True),
        #         FieldInfo(name="type", type="str", required=True),
        #     ],
        # ),
        # "HandoffMessage": MessageTypeDescription(
        #     name="HandoffMessage",
        #     fields=[
        #         FieldInfo(name="source", type="str", required=True),
        #         FieldInfo(name="content", type="str", required=True),
        #         FieldInfo(name="target", type="str", required=True),
        #         FieldInfo(name="context", type="List[LLMMessage]", required=False),
        #         FieldInfo(name="type", type="str", required=True),
        #     ],
        # ),
        "GroupChatStart": MessageTypeDescription(
            name="GroupChatStart",
            fields=[
                FieldInfo(name="messages", type="List[ChatMessage]", required=False),
            ],
        ),
        "GroupChatAgentResponse": MessageTypeDescription(
            name="GroupChatAgentResponse",
            fields=[
                FieldInfo(name="agent_response", type="Response", required=True),
            ],
        ),
        "GroupChatRequestPublish": MessageTypeDescription(
            name="GroupChatRequestPublish",
            fields=None,
        ),
        "GroupChatMessage": MessageTypeDescription(
            name="GroupChatMessage",
            fields=[
                FieldInfo(name="message", type="ChatMessage", required=True),
            ],
        ),
        "GroupChatTermination": MessageTypeDescription(
            name="GroupChatTermination",
            fields=[
                FieldInfo(name="message", type="StopMessage", required=True),
            ],
        ),
        "GroupChatReset": MessageTypeDescription(
            name="GroupChatReset",
            fields=None,
        ),
    }


# ### Serialization ### -- maybe should be a class?

__message_map = {
    # agentchat messages
    "TextMessage": TextMessage,
    "MultiModalMessage": MultiModalMessage,
    "StopMessage": StopMessage,
    "HandoffMessage": HandoffMessage,
    # agentchat events
    "ToolCallRequestEvent": ToolCallRequestEvent,
    "ToolCallExecutionEvent": ToolCallExecutionEvent,
    "ToolCallSummaryMessage": ToolCallSummaryMessage,
    "UserInputRequestedEvent": UserInputRequestedEvent,
    "MemoryQueryEvent": MemoryQueryEvent,
    # group chat messages
    "GroupChatAgentResponse": GroupChatAgentResponse,
    "GroupChatMessage": GroupChatMessage,
    "GroupChatRequestPublish": GroupChatRequestPublish,
    "GroupChatReset": GroupChatReset,
    "GroupChatStart": GroupChatStart,
    "GroupChatTermination": GroupChatTermination,
    # core messages
    "AssistantMessage": AssistantMessage,
    "FunctionExecutionResult": FunctionExecutionResult,
    "FunctionExecutionResultMessage": FunctionExecutionResultMessage,
    "SystemMessage": SystemMessage,
    "UserMessage": UserMessage,
}


def serialize(message: ChatMessage | AgentEvent | LLMMessage | None) -> dict:
    try:
        if message is None:
            return {"type": "None"}

        serialized_message = message.model_dump()

        # get name in case doesnt exist
        type_name = type(message).__name__
        serialized_message["type"] = type_name
        return serialized_message
    except Exception:
        print("[WARN] Unable to serialize message: ", message)
        return {}


def deserialize(
    message_dict: Dict | str,
) -> ChatMessage | AgentEvent | LLMMessage | None:
    try:
        if isinstance(message_dict, str):
            message_dict = json.loads(message_dict)

        message_type = message_dict["type"]  # type: ignore

        if message_type == "None":
            return None

        new_message_class = __message_map[message_type]
        new_message = new_message_class(**message_dict)
        return new_message
    except Exception as e:
        print(
            f"[WARN] Unable to deserialize message dict into Pydantic class. Error: {str(e)}.\nMessage dict: ",
            message_dict,
        )
        return None
