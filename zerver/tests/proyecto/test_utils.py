from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.utils import (
    generate_api_key,
    has_api_key_format,
    assert_is_not_none,
    process_list_in_batches,
    optional_bytes_to_mib,
    sha256_hash,
)

# test made by: Anthony Segura Paniagua
class UtilsTest(ZulipTestCase):
    def test_generate_api_key_length(self) -> None:
        SIZE_KEY = 32

        key = generate_api_key()

        self.assertEqual(len(key), SIZE_KEY)

    def test_has_api_key_format_valid(self) -> None:
        SIZE_KEY = 32
        key = "a" * SIZE_KEY
        
        self.assertTrue(has_api_key_format(key))

    def test_has_api_key_format_short(self) -> None:
        SIZE_KEY = 32
        key = "a" * (SIZE_KEY - 1)

        self.assertFalse(has_api_key_format(key))

    def test_has_api_key_format_invalid_chars(self) -> None:
        SIZE_KEY = 32
        key = "a" * (SIZE_KEY - 1) + "-"

        self.assertFalse(has_api_key_format(key))

    def test_assert_is_not_none_valid(self) -> None:
        VALUE = "test"

        self.assertEqual(assert_is_not_none(VALUE), VALUE)

    def test_assert_is_not_none_invalid(self) -> None:
        with self.assertRaises(AssertionError):
            assert_is_not_none(None)

    def test_process_list_in_batches_empty(self) -> None:
        EMPTY_LIST = []
        lst: list[int] = []

        process_list_in_batches(EMPTY_LIST, 10, lst.extend)

        self.assertEqual(lst, EMPTY_LIST)

    def test_process_list_in_batches_small(self) -> None:
        SMALL_LIST = [1]
        lst: list[int] = []

        process_list_in_batches(SMALL_LIST, 10, lst.extend)

        self.assertEqual(lst, SMALL_LIST)

    def test_process_list_in_batches_large(self) -> None:
        LONG_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        BATCHES_LEN = 5
        lst: list[int] = []
        batches: list[list[int]] = []

        def process_batch(items: list[int]) -> None:
            batches.append(items)
            lst.extend(items)
        process_list_in_batches(LONG_LIST, 2, process_batch)

        self.assertEqual(lst, LONG_LIST)
        self.assertEqual(len(batches), BATCHES_LEN)

    def test_optional_bytes_to_mib_none(self) -> None:
        self.assertIsNone(optional_bytes_to_mib(None))

    def test_optional_bytes_to_mib_value(self) -> None:
        ONE_MIB = 1048576

        self.assertEqual(optional_bytes_to_mib(ONE_MIB), 1)

    def test_sha256_hash_empty(self) -> None:
        EMPTY_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        EMPTY = ""

        self.assertEqual(sha256_hash(EMPTY), EMPTY_HASH)

    def test_sha256_hash_value(self) -> None:
        HASH = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
        VALUE = "test"
        
        self.assertEqual(sha256_hash(VALUE), HASH)
