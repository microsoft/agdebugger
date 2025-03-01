import logging
from typing import List

from pydantic import BaseModel

# PORT-TODO -- maybe drop these messages?
# these are here https://github.com/microsoft/autogen/blob/225eb9d0b205576dba1cfc97856d05ccce5ab71c/python/packages/autogen-magentic-one/src/autogen_magentic_one/messages.py#L43 but not sure now to import?
# from team_one.messages import OrchestrationEvent, WebSurferEvent
# from .intervention import AgDebuggerInterventionHandler
# from .types import ThoughtMessage


class LogMessage(BaseModel):
    message: str
    level: str
    name: str
    time: float


class ListHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.log_messages: List[LogMessage] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.log_messages.append(
            LogMessage(
                message=str(record.msg),
                level=record.levelname,
                name=record.name,
                time=record.created,
            )
        )

    def get_log_messages(self) -> List[LogMessage]:
        return self.log_messages


# class LogToHistoryHandler(logging.Handler):
#     def __init__(self, i_handler: AgDebuggerInterventionHandler) -> None:
#         super().__init__()
#         self.i_handler = i_handler

#     def emit(self, record: logging.LogRecord) -> None:
#         try:
#             if isinstance(record.msg, OrchestrationEvent):
#                 if record.msg.type == "thought":
#                     thought = ThoughtMessage(
#                         content=record.msg.message, senderName=record.msg.source
#                     )
#                     self.i_handler.handle_history_add(thought)
#             if isinstance(record.msg, WebSurferEvent):
#                 header = f"[At URL: {record.msg.url}]\n"
#                 _message = header + record.msg.message
#                 _sender = record.msg.source + " (thought)"

#                 thought = ThoughtMessage(content=_message, senderName=_sender)
#                 self.i_handler.handle_history_add(thought)

#         except Exception:
#             self.handleError(record)
