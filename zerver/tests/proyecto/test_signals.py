from types import SimpleNamespace
from unittest import mock

from zerver.lib.test_classes import ZulipTestCase
import zerver.signals as signals

# test made by: Gael Ruiz
class SignalsTest(ZulipTestCase):
    PARSE_USER_AGENT_PATH = "zerver.signals.parse_user_agent"
    PARSE_OS_PATH = "zerver.signals.parse_os"
    SET_VIDEO_CALL_PROVIDER_TOKEN_PATH = (
        "zerver.actions.video_calls.do_set_video_call_provider_token"
    )

    ANY_USER_AGENT = "Any/1.0"

    ZULIP_USER_AGENT = "ZulipMobile/1.0"

    IE_USER_AGENT = (
        "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; "
        "Trident/6.0)"
    )
    CHROME_USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
    MAC_OS_X_USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/17.0 Safari/605.1.15"
    )
    WINDOWS_USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    OTHER_BROWSER_FAMILY = "Other"

    OTHER_OS_FAMILY = "Other"

    EXPECTED_ZULIP_BROWSER = "Zulip"
    EXPECTED_IE_BROWSER = "Internet Explorer"
    EXPECTED_CHROME_BROWSER = "Chrome"

    EXPECTED_MAC_OS = "macOS"
    EXPECTED_WINDOWS_OS = "Windows"

    ZOOM_PROVIDER = "zoom"
    WEBEX_PROVIDER = "webex"
    TOKEN_VALUE = "token-value"
    CLEARED_TOKEN_VALUE = None

    def userWithTokens(self, tokens: dict[str, str] | None = None) -> SimpleNamespace:
        if tokens is None:
            tokens = {}

        return SimpleNamespace(third_party_api_state=tokens)

    def test_get_device_browser_Zulip(self) -> None:
        lowercase_user_agent = self.ZULIP_USER_AGENT.lower()

        result = signals.get_device_browser(lowercase_user_agent)

        self.assertEqual(result, self.EXPECTED_ZULIP_BROWSER)

    def test_get_device_browser_Internet_Explorer(self) -> None:

        user_agent = self.IE_USER_AGENT

        result = signals.get_device_browser(user_agent)

        self.assertEqual(result, self.EXPECTED_IE_BROWSER)

    def test_get_device_browser_Chrome(self) -> None:
        self.assertEqual(signals.get_device_browser(self.CHROME_USER_AGENT), self.EXPECTED_CHROME_BROWSER)

    def test_get_device_browser_unknown(self) -> None:
        with mock.patch(self.PARSE_USER_AGENT_PATH, return_value=SimpleNamespace(family=self.OTHER_BROWSER_FAMILY)):
            self.assertIsNone(signals.get_device_browser(self.ANY_USER_AGENT))

    def test_signals_get_device_os_MacOs(self) -> None:
        user_agent = self.MAC_OS_X_USER_AGENT

        result = signals.get_device_os(user_agent)

        self.assertEqual(result, self.EXPECTED_MAC_OS)

    def test_signals_get_device_os_Other(self) -> None:
        user_agent = self.WINDOWS_USER_AGENT

        result = signals.get_device_os(user_agent)

        self.assertEqual(result, self.EXPECTED_WINDOWS_OS)

    def test_signals_get_device_os_None(self) -> None:
        with mock.patch(self.PARSE_OS_PATH, return_value=SimpleNamespace(family=self.OTHER_OS_FAMILY)):
            self.assertIsNone(signals.get_device_os(self.ANY_USER_AGENT))

    def test_signals_clear_call_tokens_no_user(self) -> None:
        with mock.patch(self.SET_VIDEO_CALL_PROVIDER_TOKEN_PATH) as mocked_set_token:
            signals.clear_call_tokens_on_logout(sender=None, user=None)

        mocked_set_token.assert_not_called()

    def test_clear_call_tokens_on_logout_no_sender(self) -> None:
        user = self.userWithTokens()

        with mock.patch(self.SET_VIDEO_CALL_PROVIDER_TOKEN_PATH) as mocked_set_token:
            signals.clear_call_tokens_on_logout(sender=None, user=user)

        mocked_set_token.assert_not_called()

    def test_signals_clear_call_tokens_zoom(self) -> None:
        user = self.userWithTokens(
            {
                self.ZOOM_PROVIDER: self.TOKEN_VALUE,
            },
        )

        with mock.patch(self.SET_VIDEO_CALL_PROVIDER_TOKEN_PATH) as mocked_set_token:
            signals.clear_call_tokens_on_logout(sender=None, user=user)

        mocked_set_token.assert_called_once_with(
            user,
            self.ZOOM_PROVIDER,
            self.CLEARED_TOKEN_VALUE,
        )

    def test_clear_call_tokens_on_logout_webex(self) -> None:
        user = self.userWithTokens(
            {
                self.WEBEX_PROVIDER: self.TOKEN_VALUE,
            },
        )

        with mock.patch(self.SET_VIDEO_CALL_PROVIDER_TOKEN_PATH) as mocked_set_token:
            signals.clear_call_tokens_on_logout(sender=None, user=user)

        mocked_set_token.assert_called_once_with(
            user,
            self.WEBEX_PROVIDER,
            self.CLEARED_TOKEN_VALUE,
        )

    def test_clear_call_tokens_on_logout_zoom_and_webex(self) -> None:
        user = self.userWithTokens(
            {
                self.ZOOM_PROVIDER: self.TOKEN_VALUE,
                self.WEBEX_PROVIDER: self.TOKEN_VALUE,
            },
        )

        with mock.patch(self.SET_VIDEO_CALL_PROVIDER_TOKEN_PATH) as mocked_set_token:
            signals.clear_call_tokens_on_logout(sender=None, user=user)

        mocked_set_token.assert_any_call(
            user,
            self.ZOOM_PROVIDER,
            self.CLEARED_TOKEN_VALUE,
        )

        mocked_set_token.assert_any_call(
            user,
            self.WEBEX_PROVIDER,
            self.CLEARED_TOKEN_VALUE,
        )

        self.assertEqual(mocked_set_token.call_count, 2)