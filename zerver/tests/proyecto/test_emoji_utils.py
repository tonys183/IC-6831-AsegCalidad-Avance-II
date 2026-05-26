from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.emoji_utils import (
    unqualify_emoji, 
    emoji_to_hex_codepoint, 
    hex_codepoint_to_emoji
)

# test made by: Anthony Segura Paniagua
class EmojiUtilsTest(ZulipTestCase):
    def test_unqualify_emoji(self) -> None:
        FORZED_EMOJI = "🥑\ufe0f"
        ONLY_EMOJI = "🥑"

        self.assertEqual(unqualify_emoji(FORZED_EMOJI), ONLY_EMOJI)

    def test_emoji_to_hex_codepoint(self) -> None:
        EMOJI = "🥑"
        HEX_CODEPOINT = "1f951"

        self.assertEqual(emoji_to_hex_codepoint(EMOJI), HEX_CODEPOINT)

    def test_hex_codepoint_to_emoji(self) -> None:
        HEX_CODEPOINT = "1f951"
        ONLY_EMOJI = "🥑"

        self.assertEqual(hex_codepoint_to_emoji(HEX_CODEPOINT), ONLY_EMOJI)
