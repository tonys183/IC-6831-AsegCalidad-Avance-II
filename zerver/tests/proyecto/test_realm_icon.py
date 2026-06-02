from unittest import mock

from zerver.lib.realm_icon import get_realm_icon_url
from zerver.lib.test_classes import ZulipTestCase
from zerver.models.realms import get_realm


# test made by: Saúl Pacheco Cubillo
class RealmIconUrlTests(ZulipTestCase):

    def test_get_uploaded_icon(self) -> None:
        realm = get_realm("zulip")
        realm.icon_source = "U"
        realm.icon_version = 1
        with mock.patch("zerver.lib.realm_icon.get_uploaded_realm_icon_url") as mock_upload:
            mock_upload.return_value = "https://example.com/icon.png"
            result = get_realm_icon_url(realm)
        self.assertEqual(result, "https://example.com/icon.png")

    def test_gravatar_icon(self) -> None:
        realm = get_realm("zulip")
        realm.icon_source = "G"
        with self.settings(ENABLE_GRAVATAR=True):
            result = get_realm_icon_url(realm)
        self.assertIn("secure.gravatar.com", result)

    def test_default_avatar_uri(self) -> None:
        realm = get_realm("zulip")
        realm.icon_source = "G"
        with self.settings(ENABLE_GRAVATAR=False, DEFAULT_AVATAR_URI="https://example.com/default.png"):
            result = get_realm_icon_url(realm)
        self.assertEqual(result, "https://example.com/default.png")

    def test_staticfiles_icon(self) -> None:
        realm = get_realm("zulip")
        realm.icon_source = "G"
        with self.settings(ENABLE_GRAVATAR=False, DEFAULT_AVATAR_URI=None):
            result = get_realm_icon_url(realm)
        self.assertIn("default-avatar.png", result)