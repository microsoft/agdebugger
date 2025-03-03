"""
LocalAgent is a simple local agent that does not use LLMs for testing AGDebugger locally.
It expects messages to be a number and returns the number + 1.
"""

import logging
from typing import (
    Any,
    AsyncGenerator,
    List,
    Mapping,
    Sequence,
)

from autogen_agentchat import EVENT_LOGGER_NAME
from autogen_agentchat.agents import BaseChatAgent
from autogen_agentchat.base import Response
from autogen_agentchat.messages import (
    AgentEvent,
    ChatMessage,
    TextMessage,
)
from autogen_agentchat.state import BaseState
from autogen_core import CancellationToken, Component, ComponentModel
from autogen_core.memory import Memory
from autogen_core.models import (
    AssistantMessage,
    ChatCompletionClient,
    FunctionExecutionResultMessage,
    SystemMessage,
    UserMessage,
)
from pydantic import BaseModel, Field
from typing_extensions import Self

event_logger = logging.getLogger(EVENT_LOGGER_NAME)


class LocalAgentConfig(BaseModel):
    name: str
    model_client: ComponentModel
    description: str
    system_message: str | None = None


class LocalAgentState(BaseState):
    counter: int
    type: str = Field(default="LocalAgentState")


class LocalAgent(BaseChatAgent, Component[LocalAgentConfig]):
    component_config_schema = LocalAgentConfig
    component_provider_override = "autogen_agentchat.agents.LocalAgent"

    def __init__(
        self,
        name: str,
        model_client: ChatCompletionClient,
        *,
        description: str = "An agent that provides assistance with ability to use tools.",
        system_message: (str | None) = "You are a cool local agent",
        memory: Sequence[Memory] | None = None,
    ):
        super().__init__(name=name, description=description)
        self._model_client = model_client
        self._memory = None
        if memory is not None:
            if isinstance(memory, list):
                self._memory = memory
            else:
                raise TypeError(f"Expected Memory, List[Memory], or None, got {type(memory)}")

        self._system_messages: List[
            SystemMessage | UserMessage | AssistantMessage | FunctionExecutionResultMessage
        ] = []
        if system_message is None:
            self._system_messages = []
        else:
            self._system_messages = [SystemMessage(content=system_message)]

        self._is_running = False
        self.counter: int = 0

    @property
    def produced_message_types(self) -> Sequence[type[ChatMessage]]:
        """The types of messages that the assistant agent produces."""
        message_types: List[type[ChatMessage]] = [TextMessage]
        return tuple(message_types)

    async def on_messages(self, messages: Sequence[ChatMessage], cancellation_token: CancellationToken) -> Response:
        async for message in self.on_messages_stream(messages, cancellation_token):
            if isinstance(message, Response):
                return message
        raise AssertionError("The stream should have returned the final result.")

    async def on_messages_stream(
        self, messages: Sequence[ChatMessage], cancellation_token: CancellationToken
    ) -> AsyncGenerator[AgentEvent | ChatMessage | Response, None]:
        print(f"\n[{self.name}] -- received messages: ", messages)

        last_message = messages[0]

        if isinstance(last_message, TextMessage):
            last_num = int(last_message.content)
            model_result: str = f"{last_num + 1}"
        else:
            print("[WARN] Local agent got a message that is not a number")
            model_result = "-10000"

        self.counter += 1

        # usage = RequestUsage(0, 0)

        yield Response(
            chat_message=TextMessage(content=model_result, source=self.name),
            inner_messages=[],
        )

        return

    async def on_reset(self, cancellation_token: CancellationToken) -> None:
        """Reset the assistant agent to its initialization state."""
        self.counter = 0

    async def save_state(self) -> Mapping[str, Any]:
        return LocalAgentState(counter=self.counter).model_dump()

    async def load_state(self, state: Mapping[str, Any]) -> None:
        """Load the state of the assistant agent"""
        assistant_agent_state = LocalAgentState.model_validate(state)
        # Load the model context state.
        self.counter = assistant_agent_state.counter

    def _to_config(self) -> LocalAgentConfig:
        """Convert the assistant agent to a declarative config."""

        return LocalAgentConfig(
            name=self.name,
            model_client=self._model_client.dump_component(),
            description=self.description,
            system_message=self._system_messages[0].content
            if self._system_messages and isinstance(self._system_messages[0].content, str)
            else None,
        )

    @classmethod
    def _from_config(cls, config: LocalAgentConfig) -> Self:
        """Create an assistant agent from a declarative config."""
        return cls(
            name=config.name,
            model_client=ChatCompletionClient.load_component(config.model_client),
            description=config.description,
            system_message=config.system_message,
        )
