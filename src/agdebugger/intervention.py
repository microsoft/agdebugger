import threading
from typing import Any, Awaitable, Callable, List

from autogen_core import AgentId, DropMessage, InterventionHandler, MessageContext

from .types import (
    AGEPublishMessage,
    AGEResponseMessage,
    AGESendMessage,
    ScoreResult,
    TimeStampedMessage,
)


class Counter:
    def __init__(self) -> None:
        self._count: int = 0
        self.threadLock = threading.Lock()

    def increment(self) -> None:
        self.threadLock.acquire()
        self._count += 1
        self.threadLock.release()

    def get(self) -> int:
        return self._count

    def set(self, value: int) -> None:
        self.threadLock.acquire()
        self._count = value
        self.threadLock.release()

    def decrement(self) -> None:
        self.threadLock.acquire()
        self._count -= 1
        self.threadLock.release()


class AgDebuggerInterventionHandler(InterventionHandler):
    """Handles message dropping and state tracking for ag explore"""

    def __init__(
        self,
        checkpointFunc: Callable[[int], Awaitable[None]],
        history: List[TimeStampedMessage] | None = None,
    ) -> None:
        self.drop = False
        self.history: List[TimeStampedMessage] = [] if history is None else history
        self.timestamp_counter = Counter()
        self.checkpointFunc = checkpointFunc
        self._current_score: ScoreResult | None = None

        if len(self.history) > 0:
            self.timestamp_counter.set(self.history[-1].timestamp + 1)

    def invalidate_cache(self) -> None:
        self._current_score = None

    def handle_history_add(self, message: AGEPublishMessage | AGESendMessage | AGEResponseMessage) -> None:
        curr_timestep = self.timestamp_counter.get()
        self.history.append(TimeStampedMessage(message=message, timestamp=curr_timestep))
        self.timestamp_counter.increment()

    async def on_send(
        self, message: Any, *, message_context: MessageContext, recipient: AgentId
    ) -> Any | type[DropMessage]:
        if self.drop:
            self.drop = False
            return DropMessage

        m = AGESendMessage(
            message=message,
            sender=message_context.sender,
            recipient=recipient,
            message_id=message_context.message_id,
        )
        self.invalidate_cache()
        await self.checkpointFunc(self.timestamp_counter.get())
        self.handle_history_add(m)
        return message

    async def on_publish(self, message: Any, *, message_context: MessageContext) -> Any | type[DropMessage]:
        if self.drop:
            self.drop = False
            return DropMessage

        m = AGEPublishMessage(
            message=message,
            sender=message_context.sender,
            topic_id=message_context.topic_id,  # type: ignore -- topic id guaranteed non-null for publish
            message_id=message_context.message_id,
        )
        self.invalidate_cache()
        await self.checkpointFunc(self.timestamp_counter.get())
        self.handle_history_add(m)
        return message

    async def on_response(self, message: Any, *, sender: AgentId, recipient: AgentId | None) -> Any | type[DropMessage]:
        if self.drop:
            self.drop = False
            return DropMessage

        m = AGEResponseMessage(
            message=message,
            sender=sender,
            recipient=recipient,
        )
        self.invalidate_cache()
        await self.checkpointFunc(self.timestamp_counter.get())
        self.handle_history_add(m)
        return message

    def get_message_at_timestamp(self, timestamp: int) -> TimeStampedMessage | None:
        return next((m for m in self.history if m.timestamp == timestamp), None)

    def purge_history_after_cutoff(self, cutoff: int) -> None:
        """
        Remove messages from history after cutoff timestamp.
        """
        self.history = [m for m in self.history if m.timestamp < cutoff]
        self.invalidate_cache()
