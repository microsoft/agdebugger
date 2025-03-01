from autogen_agentchat.base import Response
from autogen_agentchat.messages import StopMessage, TextMessage
from autogen_agentchat.teams._group_chat._events import (
    GroupChatAgentResponse,
    GroupChatMessage,
    GroupChatRequestPublish,
    GroupChatReset,
    GroupChatStart,
    GroupChatTermination,
)

from agdebugger.serialization import deserialize, serialize


def serialize_and_deserialize(message):
    serialized = serialize(message)
    deserialized = deserialize(serialized)
    return deserialized


def test_serialize_and_deserialize_none():
    message = None
    deserialized = serialize_and_deserialize(message)
    assert message == deserialized


def test_serialize_and_deserialize_group_chat_reset():
    message = GroupChatReset()
    deserialized = serialize_and_deserialize(message)
    assert message == deserialized


def test_serialize_and_deserialize_group_chat_request_publish():
    message = GroupChatRequestPublish()
    deserialized = serialize_and_deserialize(message)
    assert message == deserialized


def test_serialize_and_deserialize_group_chat_start():
    message = GroupChatStart(
        messages=[
            TextMessage(
                source="user",
                content="content",
            )
        ]
    )
    deserialized = serialize_and_deserialize(message)
    assert message == deserialized


def test_serialize_and_deserialize_group_chat_message():
    message = GroupChatMessage(
        message=TextMessage(
            source="user",
            content="content",
        )
    )
    deserialized = serialize_and_deserialize(message)
    assert message == deserialized


def test_serialize_and_deserialize_group_chat_agent_response():
    message = GroupChatAgentResponse(
        agent_response=Response(
            chat_message=TextMessage(
                source="user",
                content="content",
            ),
            inner_messages=None,
        )
    )
    deserialized = serialize_and_deserialize(message)
    assert message == deserialized


def test_serialize_and_deserialize_group_chat_termination():
    message = GroupChatTermination(
        message=StopMessage(
            source="user",
            models_usage=None,
            content="content",
            type="StopMessage",
        )
    )
    deserialized = serialize_and_deserialize(message)
    assert message == deserialized
