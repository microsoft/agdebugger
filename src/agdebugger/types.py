from dataclasses import dataclass
from typing import Any, Dict, List, Mapping, Optional

from autogen_core import AgentId, TopicId
from pydantic import BaseModel


@dataclass
class AGEPublishMessage:
    message: Any
    sender: AgentId | None
    topic_id: TopicId
    message_id: str


@dataclass
class AGESendMessage:
    message: Any
    sender: AgentId | None
    recipient: AgentId
    message_id: str


@dataclass
class AGEResponseMessage:
    message: Any
    sender: AgentId | None
    recipient: AgentId | None


@dataclass
class TimeStampedMessage:
    message: AGEPublishMessage | AGESendMessage | AGEResponseMessage
    timestamp: int


@dataclass
class ErrorSpan:
    error: str
    start_index: int
    end_index: int
    quote: str
    explanation: str


@dataclass
class ErrorSummary:
    summary: str
    tags: List[ErrorSpan]


@dataclass
class ScoreResult:
    passed: bool
    first_timestamp: int | None
    expected: Optional[str | None]
    actual: Optional[str | None]


@dataclass
class MessageHistorySession:
    messages: List[Dict[str, Any]]
    current_session_reset_from: int | None
    next_session_starts_at: int | None
    current_session_score: ScoreResult | None


@dataclass
class ContentMessage:
    timestamp: int
    content: str


@dataclass
class ThoughtMessage:
    content: str
    senderName: str


############### API Message Types ###############


class EditPrompt(BaseModel):
    content: str


class PublishMessage(BaseModel):
    type: str
    topic: str
    body: Optional[Dict] = None


class SendMessage(BaseModel):
    recipient: str
    type: str
    body: Optional[Dict] = None


class EditQueueMessage(BaseModel):
    idx: int
    body: Dict | None = None


class EditHistoryMessage(BaseModel):
    timestamp: int
    body: Optional[Dict] = None


class AgentInfo(BaseModel):
    config: Mapping[str, Any] | None = None
    state: Mapping[str, Any] | str | None = None
