from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.mime_types import bare_content_type

# test made by: Anthony Segura Paniagua
class MimeTypesTest(ZulipTestCase):
    def test_bare_content_type(self) -> None:
        CONTENT_TYPE = "text/plain; charset=utf-8"
        BARE_CONTENT_TYPE = "text/plain"

        self.assertEqual(bare_content_type(CONTENT_TYPE), BARE_CONTENT_TYPE)
