from typing import Any
from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.exceptions import (
    CannotDeactivateLastUserError,
    DirectMessagePermissionError,
    ErrorCode,
    RateLimitedError,
    UnauthorizedError,
)


# test made by: Gael Ruiz
class ExceptionsTest(ZulipTestCase):
    HTTP_STATUS_BAD_REQUEST = 400
    HTTP_STATUS_UNAUTHORIZED = 401
    HTTP_STATUS_RATE_LIMITED = 429

    DEFAULT_UNAUTHORIZED_MESSAGE = "Not logged in: API authentication or user session required"
    SESSION_AUTHENTICATION_REQUIRED_MESSAGE = "Session authentication is required"
    INVALID_WWW_AUTHENTICATE_MESSAGE = "Invalid www_authenticate value!"

    DEFAULT_WWW_AUTHENTICATE_HEADER = {
        "WWW-Authenticate": 'Basic realm="zulip"',
    }
    SESSION_WWW_AUTHENTICATE_HEADER = {
        "WWW-Authenticate": 'Session realm="zulip"',
    }

    RETRY_AFTER_SECONDS = 10.5
    RETRY_AFTER_KEY = "retry-after"
    RETRY_AFTER_HEADER = "Retry-After"

    CANNOT_DEACTIVATE_ONLY_ORGANIZATION_OWNER_MESSAGE = "Cannot deactivate the only organization owner."
    CANNOT_DEACTIVATE_ONLY_USER_MESSAGE = "Cannot deactivate the only user."
    ORGANIZATION_OWNER_ENTITY = "organization owner"
    USER_ENTITY = "user"

    DIRECT_MESSAGES_DISABLED_MESSAGE = "Direct messages are disabled in this organization."
    MISSING_AUTHORIZED_USERS_MESSAGE = "This conversation does not include any users who can authorize it."

    def errorTemplate(
        self, *, msg: str | None = None, data: dict[str, Any], http_status_code: int, extra_headers: dict[str, Any] | None = None) -> dict[str, Any]:
        result = {
            "data": data,
            "http_status_code": http_status_code,
        }

        if msg is not None:
            result["msg"] = msg

        if extra_headers is not None:
            result["extra_headers"] = extra_headers

        return result

    def test_UnauthorizedError_default_message(self) -> None:
        error = UnauthorizedError()

        self.assertEqual(
            self.errorTemplate(
                msg=error.msg,
                data=error.data,
                http_status_code=error.http_status_code,
                extra_headers=error.extra_headers,
            ),
            self.errorTemplate(
                msg=self.DEFAULT_UNAUTHORIZED_MESSAGE,
                data={
                    "code": ErrorCode.UNAUTHORIZED.name,
                },
                http_status_code=self.HTTP_STATUS_UNAUTHORIZED,
                extra_headers=self.DEFAULT_WWW_AUTHENTICATE_HEADER,
            ),
        )

    def test_UnauthorizedError_custom_message_and_session_auth_header(self) -> None:
        error = UnauthorizedError(
            msg=self.SESSION_AUTHENTICATION_REQUIRED_MESSAGE,
            www_authenticate="session",
        )

        self.assertEqual(
            self.errorTemplate(
                msg=error.msg,
                data=error.data,
                http_status_code=error.http_status_code,
                extra_headers=error.extra_headers,
            ),
            self.errorTemplate(
                msg=self.SESSION_AUTHENTICATION_REQUIRED_MESSAGE,
                data={
                    "code": ErrorCode.UNAUTHORIZED.name,
                },
                http_status_code=self.HTTP_STATUS_UNAUTHORIZED,
                extra_headers=self.SESSION_WWW_AUTHENTICATE_HEADER,
            ),
        )

    def test_UnauthorizedError_invalid_authentication(self) -> None:
        with self.assertRaisesRegex(
            AssertionError,
            self.INVALID_WWW_AUTHENTICATE_MESSAGE,
        ):
            UnauthorizedError(www_authenticate="invalid")

    def test_RateLimitedError_provides_secs(self) -> None:
        error = RateLimitedError(secs_to_freedom=self.RETRY_AFTER_SECONDS)

        self.assertEqual(
            self.errorTemplate(
                data=error.data,
                http_status_code=error.http_status_code,
                extra_headers=error.extra_headers,
            ),
            self.errorTemplate(
                data={
                    self.RETRY_AFTER_KEY: self.RETRY_AFTER_SECONDS,
                    "code": ErrorCode.RATE_LIMIT_HIT.name,
                },
                http_status_code=self.HTTP_STATUS_RATE_LIMITED,
                extra_headers={
                    self.RETRY_AFTER_HEADER: self.RETRY_AFTER_SECONDS,
                },
            ),
        )

    def test_RateLimitedError_no_secs_provided(self) -> None:
        error = RateLimitedError()

        self.assertEqual(
            self.errorTemplate(
                data=error.data,
                http_status_code=error.http_status_code,
                extra_headers=error.extra_headers,
            ),
            self.errorTemplate(
                data={
                    self.RETRY_AFTER_KEY: None,
                    "code": ErrorCode.RATE_LIMIT_HIT.name,
                },
                http_status_code=self.HTTP_STATUS_RATE_LIMITED,
                extra_headers={},
            ),
        )

    def test_CannotDeactivateLastUserError_is_last_owner_true(self) -> None:
        error = CannotDeactivateLastUserError(is_last_owner=True)

        self.assertEqual(
            self.errorTemplate(
                msg=error.msg,
                data=error.data,
                http_status_code=error.http_status_code,
            ),
            self.errorTemplate(
                msg=self.CANNOT_DEACTIVATE_ONLY_ORGANIZATION_OWNER_MESSAGE,
                data={
                    "code": ErrorCode.CANNOT_DEACTIVATE_LAST_USER.name,
                    "is_last_owner": True,
                    "entity": self.ORGANIZATION_OWNER_ENTITY,
                },
                http_status_code=self.HTTP_STATUS_BAD_REQUEST,
            ),
        )

    def test_CannotDeactivateLastUserError_is_last_owner_false(self) -> None:
        error = CannotDeactivateLastUserError(is_last_owner=False)

        self.assertEqual(
            self.errorTemplate(
                msg=error.msg,
                data=error.data,
                http_status_code=error.http_status_code,
            ),
            self.errorTemplate(
                msg=self.CANNOT_DEACTIVATE_ONLY_USER_MESSAGE,
                data={
                    "code": ErrorCode.CANNOT_DEACTIVATE_LAST_USER.name,
                    "is_last_owner": False,
                    "entity": self.USER_ENTITY,
                },
                http_status_code=self.HTTP_STATUS_BAD_REQUEST,
            ),
        )

    def test_DirectMessagePermissionError_is_nobody_group_True(self) -> None:
        error = DirectMessagePermissionError(is_nobody_group=True)

        self.assertEqual(
            self.errorTemplate(
                msg=error.msg,
                data=error.data,
                http_status_code=error.http_status_code,
            ),
            self.errorTemplate(
                msg=self.DIRECT_MESSAGES_DISABLED_MESSAGE,
                data={
                    "code": ErrorCode.BAD_REQUEST.name,
                },
                http_status_code=self.HTTP_STATUS_BAD_REQUEST,
            ),
        )

    def test_DirectMessagePermissionError_is_nobody_group_False(self) -> None:
        error = DirectMessagePermissionError(is_nobody_group=False)

        self.assertEqual(
            self.errorTemplate(
                msg=error.msg,
                data=error.data,
                http_status_code=error.http_status_code,
            ),
            self.errorTemplate(
                msg=self.MISSING_AUTHORIZED_USERS_MESSAGE,
                data={
                    "code": ErrorCode.BAD_REQUEST.name,
                },
                http_status_code=self.HTTP_STATUS_BAD_REQUEST,
            ),
        )