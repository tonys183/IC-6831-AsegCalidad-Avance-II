from zerver.lib.test_classes import ZulipTestCase

from zerver.lib.string_validation import (
    is_character_printable,
    check_string_is_printable,
    check_stream_name,
    check_stream_topic,
)
from zerver.lib.exceptions import JsonableError
from zerver.models import Stream


# test made by: Saúl Pacheco Cubillo
class StringValidationTests(ZulipTestCase):

    def test_printable_character_test(self) -> None:
        test_char = "x"
        decision = is_character_printable(test_char)
        self.assertTrue(decision)

    def test_nonprintable_character_test(self) -> None:
        nonchar = chr(0xFDD0)
        decision = is_character_printable(nonchar)
        self.assertFalse(is_character_printable(nonchar))

    def test_whitespace_name_test(self) -> None:
        test_name = "   "
        self.assertRaises(JsonableError, check_stream_name, test_name)

    def test_long_name_test(self) -> None:
        test_name = "x" * (Stream.MAX_NAME_LENGTH + 1)
        self.assertRaises(JsonableError, check_stream_name, test_name)

    def test_nonchar_name_test(self) -> None:
        nonchar = chr(0xFDD0)
        test_name = "x" + nonchar
        self.assertRaises(JsonableError, check_stream_name, test_name)

    def test_nonchar_topic_test(self) -> None:
        nonchar = chr(0xFDD0)
        test_topic = "topic" + nonchar
        self.assertRaises(JsonableError, check_stream_topic, test_topic)

    def test_valid_string_test(self) -> None:
        test_string = "xyz"
        result = check_string_is_printable(test_string)
        self.assertIsNone(result)

    def test_empty_string_test(self) -> None:
        test_string = ""
        result = check_string_is_printable(test_string)
        self.assertIsNone(result)

    def test_multiple_invalid_chars_test(self) -> None:
        nonchar = chr(0xFDD0)
        test_string = "x" + nonchar + "y" + nonchar
        result = check_string_is_printable(test_string)
        self.assertEqual(result, 2)

    def test_valid_stream_name_test(self) -> None:
        test_name = "stream name"
        result = check_stream_name(test_name)
        self.assertIsNone(result)

    def test_valid_stream_topic_test(self) -> None:
        test_topic = "topic"
        result = check_stream_topic(test_topic)
        self.assertIsNone(result)
