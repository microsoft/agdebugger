import asyncio
import logging
from typing import Any, Dict, List

from autogen_agentchat.teams import BaseGroupChat
from autogen_core import AgentId, DefaultTopicId, SingleThreadedAgentRuntime, TopicId
from autogen_core._queue import Queue
from autogen_core._single_threaded_agent_runtime import (
    PublishMessageEnvelope,
    ResponseMessageEnvelope,
    RunContext,
    SendMessageEnvelope,
)

from .intervention import AgDebuggerInterventionHandler
from .log import ListHandler  # , LogToHistoryHandler
from .serialization import get_message_type_descriptions
from .types import (
    AgentInfo,
    AGEPublishMessage,
    AGESendMessage,
    MessageHistorySession,
    ScoreResult,
)
from .utils import message_to_json


async def wait_for_future(fut):  # type: ignore
    await fut


class BackendRuntimeManager:
    def __init__(
        self,
        groupchat: BaseGroupChat,
        logger: logging.Logger,
        message_history=None,
        state_cache=None,
    ):
        self._groupchat = groupchat
        self.message_info = get_message_type_descriptions()
        self.prior_histories: Dict[int, MessageHistorySession] = {}
        self.session_counter = 0
        self.current_session_reset_from: int | None = None
        self.agent_checkpoints = {} if state_cache is None else state_cache
        self.run_context: RunContext | None = None
        self.intervention_handler = AgDebuggerInterventionHandler(self.checkpoint_agents, message_history)
        self.all_topics: List[str] = []
        self.log_handler = ListHandler()
        logger.addHandler(self.log_handler)
        self.ready = False

        print("Initial Backend loaded.")

    async def async_initialize(self) -> None:
        if not self.groupchat._initialized:
            await self.groupchat._init(self.runtime)

        # manually add all topics from the chat
        self.all_topics = [
            self.groupchat._group_topic_type,
            self.groupchat._output_topic_type,
            self.groupchat._group_chat_manager_topic_type,
            *self.groupchat._participant_topic_types,
        ]

        # add intervention handler since runtime already initialized
        if self.runtime._intervention_handlers is None:
            self.runtime._intervention_handlers = []
        self.runtime._intervention_handlers.append(self.intervention_handler)

        # load the last checkpoint - N.B. might be earlier than last message so we get the max key
        if len(self.intervention_handler.history) > 0:
            last_checkpoint_time = max(self.agent_checkpoints.keys())
            print("resetting to checkpoint: ", last_checkpoint_time)
            checkpoint = self.agent_checkpoints.get(last_checkpoint_time)
            if checkpoint is not None:
                await self.runtime.load_state(checkpoint)

        self.ready = True
        print("Finished backend async load")

    @property
    def groupchat(self) -> BaseGroupChat:
        return self._groupchat

    @property
    def runtime(self) -> SingleThreadedAgentRuntime:
        return self.groupchat._runtime

    @property
    def agent_key(self) -> str:
        return self.groupchat._team_id

    @property
    def current_score(self) -> ScoreResult | None:
        return self.intervention_handler._current_score

    @property
    def agent_names(self) -> List[str]:
        return list(self.runtime._known_agent_names)

    @property
    def message_queue_list(self) -> List[PublishMessageEnvelope | SendMessageEnvelope | ResponseMessageEnvelope]:
        # read and serialize without having to reconstruct a new Queue each time
        return list(self.runtime._message_queue._queue)  # type: ignore

    @property
    def unprocessed_messages_count(self):
        return self.runtime.unprocessed_messages_count

    @property
    def is_processing(self) -> bool:
        return self.runtime._run_context is not None

    def start_processing(self) -> None:
        self.runtime.start()

    async def process_next(self):
        await self.runtime.process_next()

    async def stop_processing(self) -> None:
        await self.runtime.stop_when_idle()
        # OR maybe below to stop immediatley
        # await self.runtime.stop()

    async def checkpoint_agents(self, timestamp: int) -> None:
        checkpoint = await self.runtime.save_state()
        self.agent_checkpoints[timestamp] = checkpoint

    def get_current_history(self):
        return [message_to_json(m.message, m.timestamp) for m in self.intervention_handler.history]

    def save_history_session_from_reset(self, new_reset_from: int) -> None:
        self.prior_histories[self.session_counter] = MessageHistorySession(
            messages=self.get_current_history(),
            current_session_reset_from=self.current_session_reset_from,
            next_session_starts_at=None,
            current_session_score=self.current_score,
        )

        self.session_counter += 1
        self.current_session_reset_from = new_reset_from

    def read_current_session_history(self):
        saved_sessions = self.prior_histories.copy()

        # save current messages
        saved_sessions[self.session_counter] = MessageHistorySession(
            messages=self.get_current_history(),
            current_session_reset_from=self.current_session_reset_from,
            next_session_starts_at=None,
            current_session_score=self.current_score,
        )
        return saved_sessions

    async def get_agent_config(self, agent_name) -> AgentInfo:
        agent_id = await self.runtime.get(agent_name, key=self.agent_key)

        if agent_id in self.runtime._instantiated_agents:
            agent_state = await self.runtime.agent_save_state(agent_id)
        else:
            agent_state = "Agent not instantiated yet!"

        return AgentInfo(config={}, state=agent_state)

    def publish_message(self, new_message: Any, topic: str | TopicId):
        """
        PUBLISH new message to the runtime.
        """
        if isinstance(topic, str):
            topic = DefaultTopicId(topic)

        asyncio.create_task(wait_for_future(self.runtime.publish_message(new_message, topic)))

    async def send_message(self, new_message: Any, recipient: str | AgentId, sender=None):
        """
        SEND new message to the runtime.
        """
        agent_id = await self.runtime.get(recipient, key=self.agent_key)
        return asyncio.create_task(wait_for_future(self.runtime.send_message(new_message, agent_id, sender=sender)))

    async def edit_message_queue(self, new_message: Any, edit_idx: int):
        """
        Edit existing message in the runtime queue.
        """
        if edit_idx >= self.runtime._message_queue.qsize():
            raise IndexError(f"Index out of range in queue {edit_idx}")

        # #1 simple way -- directly edit queue array
        # backend.runtime._message_queue._queue[editMessage.idx].message = newMessage

        # #2 more robust -- make new queue
        current_queue = []
        while not self.runtime._message_queue.empty():
            current_queue.append(self.runtime._message_queue.get_nowait())

        current_queue[edit_idx].message = new_message

        newQueue = Queue()
        for item in current_queue:
            await newQueue.put(item)
        self.runtime._message_queue = newQueue

    async def edit_and_revert_message(self, new_message: Any | None, cutoff_timestamp: int):
        # immediately stop and clear queue
        if self.is_processing:
            await self.stop_processing()

        current_message = self.intervention_handler.get_message_at_timestamp(cutoff_timestamp)
        if current_message is None:
            raise ValueError(f"Unable to find message in history with timestamp {cutoff_timestamp}")

        self.save_history_session_from_reset(cutoff_timestamp)
        self.intervention_handler.purge_history_after_cutoff(cutoff_timestamp)

        # edit actual message and add to queue
        if new_message is None:
            new_message = current_message.message.message

        # publish or send as new message
        if isinstance(current_message.message, AGEPublishMessage):
            self.publish_message(new_message, current_message.message.topic_id)
        elif isinstance(current_message.message, AGESendMessage):
            await self.send_message(
                new_message, current_message.message.recipient, sender=current_message.message.sender
            )
        else:
            raise ValueError(
                f"Failed to re-send message after history reset. Unsure how to handle message of type: {current_message.message}"
            )

        # NOTE: reset can be slow if heavy state so performing after message is sent.
        checkpoint = self.agent_checkpoints.get(cutoff_timestamp, None)
        if checkpoint is not None:
            await self.runtime.load_state(checkpoint)
        else:
            print("[WARN] Was unable to find agent state checkpoint for time ", cutoff_timestamp)
