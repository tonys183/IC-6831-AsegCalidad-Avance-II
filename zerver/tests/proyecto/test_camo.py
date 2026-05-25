from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.camo import (
    generate_camo_url, 
    get_camo_url, is_camo_url_valid
)

# test made by: Anthony Segura Paniagua
class CamoTest(ZulipTestCase):
    def test_generate_camo_url(self) -> None:
        URL = "http://test.cr/img.png"

        encoded_url = generate_camo_url(URL)

        self.assertIn("/", encoded_url)

    def test_get_camo_url_disabled(self) -> None:
        EMPTY_CAMO_URI = ""

        with self.settings(CAMO_URI=EMPTY_CAMO_URI):
            self.assertEqual(get_camo_url("http://test.cr"), "http://test.cr")

    def test_get_camo_url_enabled(self) -> None:
        CAMO_URI = "https://camo.test.com/"
        
        with self.settings(CAMO_URI=CAMO_URI):
            encoded_url = get_camo_url("http://test.cr")

            self.assertTrue(encoded_url.startswith(CAMO_URI))

    def test_is_camo_url_valid(self) -> None:
        URL = "http://test.cr/img.png"

        encoded_url = generate_camo_url(URL)
        digest = encoded_url.split("/")[0]

        self.assertTrue(is_camo_url_valid(digest, URL))
