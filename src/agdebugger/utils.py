import importlib
import inspect
import os
import sys
from dataclasses import dataclass
from typing import Any, Callable, Dict

from autogen_agentchat.teams import BaseGroupChat
from autogen_core import Agent, AgentId
from autogen_core._single_threaded_agent_runtime import (
    PublishMessageEnvelope,
    ResponseMessageEnvelope,
    SendMessageEnvelope,
)

from .serialization import serialize
from .types import AGEPublishMessage, AGEResponseMessage, AGESendMessage, ThoughtMessage


def agent_to_json(agent_id: AgentId, agent: Agent) -> Dict[str, Any]:
    return {
        "id": {
            "key": agent_id.key,
            "type": agent_id.type,
        },
        "type": type(agent).__name__,
        # "subscriptions": agent.metadata["subscriptions"],
    }


def inner_message_to_json(msg: Any) -> Dict[str, Any]:
    if msg is None:
        return {"type": "None"}

    return serialize(msg)


def message_to_json(
    msg: (
        PublishMessageEnvelope
        | SendMessageEnvelope
        | ResponseMessageEnvelope
        | AGEPublishMessage
        | AGESendMessage
        | AGEResponseMessage
        | ThoughtMessage
    ),
    timestamp: int | None = None,
) -> Dict[str, Any]:
    # if not is_dataclass(msg):
    #     raise ValueError(f"Expected a dataclass, got {type(msg)}")

    match msg:
        case PublishMessageEnvelope(message=message, sender=sender) | AGEPublishMessage(
            message=message, sender=sender
        ):
            return {
                "message": inner_message_to_json(message),
                "sender": str(sender) if sender is not None else None,
                "recipient": None,
                "type": "PublishMessageEnvelope",
                "timestamp": timestamp,
                "id": id(message),  # TODO: look into messsage.id
            }

        case SendMessageEnvelope(
            message=message, sender=sender, recipient=recipient
        ) | AGESendMessage(message=message, sender=sender, recipient=recipient):
            return {
                "message": inner_message_to_json(message),
                "sender": sender.type if sender is not None else None,
                "recipient": str(recipient),
                "type": "SendMessageEnvelope",
                "timestamp": timestamp,
                "id": id(message),  # TODO: look into messsage.id
            }
        case ResponseMessageEnvelope(
            message=message, sender=sender, recipient=recipient
        ) | AGEResponseMessage(message=message, sender=sender, recipient=recipient):
            return {
                "message": inner_message_to_json(message),
                "sender": str(sender),
                "recipient": str(recipient) if recipient is not None else None,
                "type": "ResponseMessageEnvelope",
                "timestamp": timestamp,
                "id": id(message),
            }

        case ThoughtMessage(content=content, senderName=senderName):
            return {
                "message": content,
                "sender": senderName,
                "recipient": None,
                "type": "ThoughtMessage",
                "timestamp": timestamp,
                "id": id(msg),
            }


@dataclass
class ParsedMessage:
    source_name: str
    recipient_name: str | None
    content: str


def parse_message_content(
    message: AGEPublishMessage | AGESendMessage | AGEResponseMessage,
) -> ParsedMessage:
    if message.sender is None:
        source_name = "User"
    else:
        source_name = str(message.sender)

    if (
        isinstance(message, (AGESendMessage, AGEResponseMessage))
        and message.recipient is not None
    ):
        recipient_name = str(message.recipient)
    else:
        recipient_name = None

    innerMessage = message.message
    if hasattr(innerMessage, "content"):
        content = str(innerMessage.content)
    else:
        content = str(innerMessage)

    return ParsedMessage(
        source_name=source_name, recipient_name=recipient_name, content=content
    )


def load_func_from_path(path_str: str) -> Callable:
    # Include path to current running dir
    sys.path.append(os.getcwd())

    # split :
    app = path_str.split(":")
    module = importlib.import_module(app[0], package=None)

    # Get app, if it is a var just get it, if it is a func run the func
    if len(app) < 2:
        raise ValueError("load must have :")

    app_attr = getattr(module, app[1])
    if not callable(app_attr):
        raise ValueError("App must be a callable function")

    return app_attr


async def load_app(app_expr: str) -> BaseGroupChat:
    app_attr = load_func_from_path(app_expr)

    if inspect.iscoroutinefunction(app_attr):
        result = await app_attr()
        return result
    else:
        return app_attr()
