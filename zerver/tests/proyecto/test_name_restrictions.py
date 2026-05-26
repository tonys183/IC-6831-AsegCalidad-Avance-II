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

    def test_is_reserved_subdomain_generic_plural(self) -> None:
        ADMINS_SUBDOMAIN = "admins"

        self.assertTrue(is_reserved_subdomain(ADMINS_SUBDOMAIN))

    def test_is_reserved_subdomain_self_hosting(self) -> None:
        SELF_HOSTING = "manage"

        with self.settings(SELF_HOSTING_MANAGEMENT_SUBDOMAIN=SELF_HOSTING):
            self.assertTrue(is_reserved_subdomain(SELF_HOSTING))

    def test_is_reserved_subdomain_zulip_reserved(self) -> None:
        INSTALLATION_SUBDOMAIN = "installation"

        self.assertTrue(is_reserved_subdomain(INSTALLATION_SUBDOMAIN))

    def test_is_reserved_subdomain_zulip_reserved_plural(self) -> None:
        INSTALLATIONS_SUBDOMAIN = "installations"

        self.assertTrue(is_reserved_subdomain(INSTALLATIONS_SUBDOMAIN))

    def test_is_reserved_subdomain_corporate(self) -> None:
        MYZULIP_SUBDOMAIN = "myzulip"
        KANDRACORP_SUBDOMAIN = "kandracorp"

        with self.settings(CORPORATE_ENABLED=True):
            self.assertTrue(is_reserved_subdomain(MYZULIP_SUBDOMAIN))
            self.assertTrue(is_reserved_subdomain(KANDRACORP_SUBDOMAIN))

    def test_is_reserved_subdomain_valid(self) -> None:
        MYCOMPANY_SUBDOMAIN = "mycompany"
        
        with self.settings(CORPORATE_ENABLED=True):
            self.assertFalse(is_reserved_subdomain(MYCOMPANY_SUBDOMAIN))

    def test_is_disposable_domain_override(self) -> None:
        DISPOSABLE_DOMAIN = "airsi.de"

        self.assertFalse(is_disposable_domain(DISPOSABLE_DOMAIN))

    def test_is_disposable_domain_blocked(self) -> None:
        BLOCKED_DOMAIN = "mailinator.com"
        
        self.assertTrue(is_disposable_domain(BLOCKED_DOMAIN))
