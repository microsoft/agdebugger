"""Similar to agbench tabulate utils for checking task completion of current session"""

from typing import Callable, List

from .types import ContentMessage, ScoreResult, TimeStampedMessage
from .utils import parse_message_content


def human_eval_scorer(messages: List[ContentMessage]) -> ScoreResult:
    for m in messages:
        if "ALL TESTS PASSED !#!#" in m.content:
            return ScoreResult(
                passed=True, first_timestamp=m.timestamp, expected=None, actual=None
            )
    return ScoreResult(passed=False, first_timestamp=None, expected=None, actual=None)


def run_score_func(
    messages: List[TimeStampedMessage],
    score_function: Callable[[List[ContentMessage]], ScoreResult] | None = None,
) -> ScoreResult | None:
    """
    Tags each message with profile tags.

    Returns: array of same legnth
    """
    if score_function is None:
        return None

    content_messages = []

    for message in messages:
        parsed_message = parse_message_content(message.message)
        content_messages.append(
            ContentMessage(timestamp=message.timestamp, content=parsed_message.content)
        )

    return score_function(content_messages)


SCORE_FUNCS = {"human_eval": human_eval_scorer}
