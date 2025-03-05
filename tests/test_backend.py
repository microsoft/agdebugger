import asyncio
import logging

import pytest
from autogen_agentchat.conditions import MaxMessageTermination
from autogen_agentchat.messages import TextMessage
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.teams._group_chat._events import (
    GroupChatStart,
)
from autogen_core import EVENT_LOGGER_NAME
from autogen_ext.models.openai import OpenAIChatCompletionClient

from agdebugger.backend import BackendRuntimeManager

from .setup.local_agent import LocalAgent


def get_agent_team():
    model_client = OpenAIChatCompletionClient(model="gpt-4o")
    agent1 = LocalAgent("LOCAL_AGENT_1", model_client=model_client)
    agent2 = LocalAgent("LOCAL_AGENT_2", model_client=model_client)
    termination = MaxMessageTermination(10)
    team = RoundRobinGroupChat([agent1, agent2], termination_condition=termination)

    return team


async def create_backend() -> BackendRuntimeManager:
    groupchat = get_agent_team()
    logger = logging.getLogger(EVENT_LOGGER_NAME)
    logger.setLevel(logging.DEBUG)

    backend = BackendRuntimeManager(groupchat, logger)
    await backend.async_initialize()

    return backend


@pytest.mark.asyncio
async def test_edit_message_queue():
    """Add a message to the queue and edit it"""
    backend = await create_backend()
    start_message = GroupChatStart(
        messages=[
            TextMessage(
                source="user",
                content="0",  # local agent expects number
            )
        ]
    )
    recipient = backend.groupchat._group_chat_manager_topic_type

    await backend.send_message(start_message, recipient)
    await asyncio.sleep(0)  # yield to make sure that the send processes

    assert backend.unprocessed_messages_count == 1
    assert backend.message_queue_list[0].message == start_message

    edited_message = GroupChatStart(
        messages=[
            TextMessage(
                source="user",
                content="3000",
            )
        ]
    )
    await backend.edit_message_queue(edited_message, 0)

    assert backend.unprocessed_messages_count == 1
    assert backend.message_queue_list[0].message == edited_message


@pytest.mark.asyncio
async def test_edit_and_revert_message():
    """Run a task then revert back to start"""

    backend = await create_backend()
    start_message = GroupChatStart(
        messages=[
            TextMessage(
                source="user",
                content="0",  # local agent expects number
            )
        ]
    )
    recipient = backend.groupchat._group_chat_manager_topic_type

    await backend.send_message(start_message, recipient)
    backend.start_processing()
    await asyncio.sleep(0)  # yield to process
    await backend.stop_processing()

    assert backend.unprocessed_messages_count == 0
    assert len(backend.intervention_handler.history) > 0
    assert backend.intervention_handler.history[0].message.message == start_message

    # state checkpoint for every message
    assert len(backend.intervention_handler.history) == len(backend.agent_checkpoints)

    edited_message = GroupChatStart(
        messages=[
            TextMessage(
                source="user",
                content="3000",
            )
        ]
    )
    await backend.edit_and_revert_message(edited_message, 0)
    await asyncio.sleep(0)  # yield to process

    assert backend.unprocessed_messages_count == 1
    assert len(backend.intervention_handler.history) == 0
