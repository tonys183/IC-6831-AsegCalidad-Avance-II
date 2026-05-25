from zerver.lib.test_classes import ZulipTestCase
from zerver.lib.name_restrictions import (
    is_reserved_subdomain, 
    is_disposable_domain
)

# test made by: Anthony Segura Paniagua
class NameRestrictionsTest(ZulipTestCase):
    def test_is_reserved_subdomain_social(self) -> None:
        SOCIAL_SUBDOMAIN = "social"

        with self.settings(SOCIAL_AUTH_SUBDOMAIN=SOCIAL_SUBDOMAIN):
            self.assertTrue(is_reserved_subdomain(SOCIAL_SUBDOMAIN))

    def test_is_reserved_subdomain_generic(self) -> None:
        ADMIN_SUBDOMAIN = "admin"

        self.assertTrue(is_reserved_subdomain(ADMIN_SUBDOMAIN))

    def test_is_disposable_domain_override(self) -> None:
        DISPOSABLE_DOMAIN = "airsi.de"

        self.assertFalse(is_disposable_domain(DISPOSABLE_DOMAIN))

    def test_is_disposable_domain_blocked(self) -> None:
        BLOCKED_DOMAIN = "mailinator.com"
        
        self.assertTrue(is_disposable_domain(BLOCKED_DOMAIN))
