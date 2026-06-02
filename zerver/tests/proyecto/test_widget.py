import json
from unittest import mock

from typing_extensions import override

from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.widget import (
    get_extra_data_from_widget_type,
    get_widget_data,
    get_widget_type,
    parse_poll_extra_data,
    parse_todo_extra_data,
)
from zerver.models import SubMessage


# test made by: Saúl Pacheco Cubillo
class WidgetTests(ZulipTestCase):

    def test_no_slash_prefix(self) -> None:
        result = get_widget_data("hello world")
        self.assertEqual(result, (None, None))

    def test_invalid_widget_type(self) -> None:
        result = get_widget_data("/invalid")
        self.assertEqual(result, (None, None))

    def test_widget_type(self) -> None:
        widget_type, extra_data = get_widget_data("/poll What is your favorite sport?\nTenis\nHockey")
        self.assertEqual(widget_type, "poll")

    def test_poll_question_only(self) -> None:
        result = parse_poll_extra_data("What is your favorite color?")
        self.assertEqual(result.question, "What is your favorite color?")

    def test_poll_question_with_options(self) -> None:
        result = parse_poll_extra_data("\nWhat is your favorite color?\nRed\nBlue")
        self.assertEqual(result.options, ["What is your favorite color?", "Red", "Blue"])


