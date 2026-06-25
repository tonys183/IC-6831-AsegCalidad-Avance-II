import assert from "node:assert/strict";

import type { Page } from "puppeteer";

import * as common from "../lib/common.ts";


const REALM_URL = "http://zulip.zulipdev.com:9981";

const RUN_ONLY = "";

const test_data = {
    INVALID_EMAIL_NO_AT: "guanabana.com",
    VALID_STATUS: "Ocupado",
    VALID_USERNAME: "Santiago15",
    PROFILE_USER: "King Hamlet",
    VALID_INVITE_EMAILS: "Raul21@gmail.com\nSebas4421@gmail.com\nAngie12@hotmail.com",
    VALID_TIMEZONE: "America/Costa_Rica (UTC-6)",
    ANIMATION_DELAY_MS: 500,
};

const selectors = {
    INPUT_EMAIL: 'input[name="username"]',
    FORM_LOGIN: "form#login_form",
    BTN_PERSONAL_MENU: "#personal-menu",
    PERSONAL_MENU_DROPDOWN: "#personal-menu-dropdown",
    MENU_ITEM_INVISIBLE_ON: "a.invisible_mode_turn_on",
    MENU_ITEM_INVISIBLE_OFF: "a.invisible_mode_turn_off",
    MENU_ITEM_SELF_DM: "a.narrow-self-direct-message",
    LABEL_DARK_THEME: 'label[for="select-dark-theme"]',
    LABEL_LIGHT_THEME: 'label[for="select-light-theme"]',
    BTN_FONT_SIZE_INCREASE: '#personal-menu-dropdown div[data-property="web_font_size_px"] .increase-button',
    BTN_FONT_SIZE_DECREASE: '#personal-menu-dropdown div[data-property="web_font_size_px"] .decrease-button',
    BTN_LINE_HEIGHT_INCREASE: '#personal-menu-dropdown div[data-property="web_line_height_percent"] .increase-button',
    LOGOUT_BTN: ".personal-menu-actions a.logout_button",
    INPUT_STATUS_MESSAGE: "#set-user-status-modal input.user-status",
    BTN_SAVE_STATUS: "#set-user-status-modal .dialog_submit_button",
    INPUT_FULL_NAME: "#full_name",
    INPUT_RECOVERY_EMAIL: "#id_email",
    BTN_SEND_RECOVERY: '[type="submit"]',
    BTN_GEAR_MENU: "#settings-dropdown",
    BTN_SUBMIT_INVITE: ".modal__button.dialog_submit_button",
    LOGIN_PAGE: 'input[name="username"]',
    USER_PROFILE_MODAL: ".modal__container[role='dialog']",
    BTN_COPY_PROFILE_LINK: "button.copy-link-to-user-profile",
};

const strings = {
    UPDATE_STATUS_TEXT: "a.update_status_text",
    COMPOSE_OR_MESSAGE: "#compose-textarea, .message_row, .empty-list-message",
    VIEW_FULL_USER_PROFILE: "a.view_full_user_profile",
    POPOVER_MENU_LABEL: ".popover-menu-label",
    INVITEE_EMAILS_CONTAINER: "#invitee_emails_container",
    INVITE_EMAIL_INPUT: 'div.input[contenteditable="true"]',
    INVITE_LINK_TAB: 'div.ind-tab[data-tab-key="invite-link-tab"]',
    FOOTER_SUBMIT_BTN: "footer .dialog_submit_button",
    COPY_GENERATED_INVITE_LINK: "#copy_generated_invite_link",
    USERLIST_TOGGLE_BTN: "#userlist-toggle-button",
    RIGHT_SIDEBAR: "#right-sidebar",
    TIMEZONE_WIDGET: "#user_timezone_widget",
    TIMEZONE_DROPDOWN_CONTAINER: ".user_timezone-dropdown-list-container",
    TIMEZONE_SEARCH_INPUT: ".dropdown-list-search-input",
    TIMEZONE_VALID_OPTION: 'li.list-item[data-unique-id="America/Costa_Rica"]',
    TIMEZONE_INVALID_OPTION: 'li.list-item[data-unique-id="Nigeria"]',
    TIMEZONE_WIDGET_VALUE: "#user_timezone_widget .dropdown_widget_value",
    INVITE_USERS_MENU_TEXT: "Invite users",
    TIMEZONE_VALID_ID: "America/Costa_Rica",
    SAVED_SUCCESS: ".saved-success, .inline-block.success",
    WAIT_SELECTOR_BODY: "body",
    KEY_ESCAPE: "Escape" as const,
    KEY_ENTER: "Enter" as const,
    ERR_INVITE_INPUT_NOT_FOUND: "Invite email input not found inside container",
    ERR_COPY_LINK_NOT_FOUND: "Copy invite link button not found",
    ERR_MENU_ITEM_NOT_FOUND: (text: string) => `Menu item not found: ${text}`,
    ERR_AVATAR_NOT_FOUND: (name: string) => `No se encontró el avatar de ${name}`,
    ERR_COPY_BTN_NOT_FOUND: "El botón de copiar link al perfil debe existir",
};


async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensure_logged_in(page: Page): Promise<void> {
    await page.goto(`${REALM_URL}/login/`, {waitUntil: "domcontentloaded"});
    const login_input = await page.$(selectors.INPUT_EMAIL);
    if (!login_input) {
        return;
    }
    await common.fill_form(page, selectors.FORM_LOGIN, {
        username: common.test_credentials.default_user.username,
        password: common.test_credentials.default_user.password,
    });
    await Promise.all([
        page.waitForNavigation({waitUntil: "domcontentloaded"}),
        page.$eval(selectors.FORM_LOGIN, (f) => (f as HTMLFormElement).submit()),
    ]);
    await page.waitForSelector(selectors.BTN_PERSONAL_MENU, {visible: true, timeout: 15_000});
}

async function open_personal_menu(page: Page): Promise<void> {
    await page.waitForSelector(selectors.BTN_PERSONAL_MENU, {visible: true});
    await page.click(selectors.BTN_PERSONAL_MENU);
    await page.waitForSelector(selectors.PERSONAL_MENU_DROPDOWN, {visible: true});
}

async function clickPopoverMenuItem(page: Page, text: string): Promise<void> {
    await page.waitForSelector(strings.POPOVER_MENU_LABEL, { visible: true });

    const items = await page.$$(strings.POPOVER_MENU_LABEL);

    for (const item of items) {
        const itemText = await page.evaluate(el => el.textContent?.trim(), item);

        if (itemText === text) {
            await item.click();
            return;
        }
    }

    throw new Error(strings.ERR_MENU_ITEM_NOT_FOUND(text));
}

async function typeInviteEmails(page: Page, value: string): Promise<void> {
    const container = await page.waitForSelector(
        strings.INVITEE_EMAILS_CONTAINER,
        { visible: true, timeout: 8000 }
    );

    const input = await container.$(strings.INVITE_EMAIL_INPUT);

    if (!input) {
        throw new Error(strings.ERR_INVITE_INPUT_NOT_FOUND);
    }

    await input.click();

    await page.keyboard.type(value);
}

async function test_invalid_email_format(page: Page): Promise<void> {
    await page.goto(`${REALM_URL}/login/`, {waitUntil: "domcontentloaded"});
    await page.waitForSelector(selectors.INPUT_EMAIL, {visible: true, timeout: 10_000});
    await common.fill_form(page, selectors.FORM_LOGIN, {
        username: test_data.INVALID_EMAIL_NO_AT,
        password: "test",
    });
    await Promise.all([
        page.waitForNavigation({waitUntil: "domcontentloaded", timeout: 10_000}),
        page.$eval(selectors.FORM_LOGIN, (form) => { (form as HTMLFormElement).submit(); }),
    ]);
    await page.waitForSelector(selectors.INPUT_EMAIL, {visible: true, timeout: 10_000});
}

async function test_password_recovery(page: Page): Promise<void> {
    await page.goto(`${REALM_URL}/accounts/password/reset/`, {waitUntil: "domcontentloaded"});
    await page.waitForSelector(selectors.INPUT_RECOVERY_EMAIL, {visible: true, timeout: 10_000});
    await page.type(selectors.INPUT_RECOVERY_EMAIL, common.test_credentials.default_user.username);
    await Promise.all([
        page.waitForNavigation({waitUntil: "domcontentloaded", timeout: 10_000}),
        page.click(selectors.BTN_SEND_RECOVERY),
    ]);
    await page.waitForFunction(
        () => window.location.pathname.includes("/done/") || window.location.pathname.includes("/reset/"),
        {timeout: 10_000},
    );
}

async function test_logout(page: Page): Promise<void> {
    await page.waitForSelector(selectors.BTN_PERSONAL_MENU, {visible: true});
    await page.click(selectors.BTN_PERSONAL_MENU);
    await page.waitForSelector(selectors.LOGOUT_BTN, {visible: true});
    await Promise.all([page.waitForNavigation(), page.click(selectors.LOGOUT_BTN)]);
    await page.waitForSelector(selectors.LOGIN_PAGE, {timeout: 10_000});
}

async function test_set_status(page: Page): Promise<void> {
    await open_personal_menu(page);
    await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>("a.update_status_text")!.click();
    });
    await common.wait_for_micromodal_to_open(page);
    await page.waitForSelector(selectors.INPUT_STATUS_MESSAGE, {visible: true, timeout: 8_000});
    await common.clear_and_type(page, selectors.INPUT_STATUS_MESSAGE, test_data.VALID_STATUS);
    await page.click(selectors.BTN_SAVE_STATUS);
    await common.wait_for_micromodal_to_close(page);
}

async function test_invisible_mode(page: Page): Promise<void> {
    await open_personal_menu(page);
    await page.waitForSelector(selectors.MENU_ITEM_INVISIBLE_ON, {visible: true, timeout: 5_000});
    await page.click(selectors.MENU_ITEM_INVISIBLE_ON);
    await sleep(test_data.ANIMATION_DELAY_MS);

    await open_personal_menu(page);
    await page.waitForSelector(selectors.MENU_ITEM_INVISIBLE_OFF, {visible: true, timeout: 5_000});
    await page.click(selectors.MENU_ITEM_INVISIBLE_OFF);
    await sleep(test_data.ANIMATION_DELAY_MS);
}

async function test_self_dm(page: Page): Promise<void> {
    await open_personal_menu(page);
    await page.waitForSelector(selectors.MENU_ITEM_SELF_DM, {visible: true});
    await page.click(selectors.MENU_ITEM_SELF_DM);
    await page.waitForSelector(strings.COMPOSE_OR_MESSAGE, {timeout: 8000});
}

async function test_themes(page: Page): Promise<void> {
    await open_personal_menu(page);
    await page.waitForSelector(selectors.LABEL_DARK_THEME, {visible: true});
    await page.click(selectors.LABEL_DARK_THEME);
    await page.waitForSelector(selectors.BTN_PERSONAL_MENU, {visible: true, timeout: 10_000});
    await page.waitForFunction(
        () => document.documentElement.classList.contains("dark-theme"),
        {timeout: 8000},
    );

    await page.waitForSelector(selectors.LABEL_LIGHT_THEME, {visible: true});
    await page.click(selectors.LABEL_LIGHT_THEME);
    await page.waitForSelector(selectors.BTN_PERSONAL_MENU, {visible: true, timeout: 10_000});
    await page.waitForFunction(
        () => !document.documentElement.classList.contains("dark-theme"),
        {timeout: 8000},
    );
}

async function test_font_size(page: Page): Promise<void> {
    await open_personal_menu(page);
    await page.waitForSelector(selectors.BTN_FONT_SIZE_INCREASE, {visible: true, timeout: 8_000});
    await page.click(selectors.BTN_FONT_SIZE_INCREASE);
    await sleep(test_data.ANIMATION_DELAY_MS);
    await page.waitForSelector(selectors.BTN_FONT_SIZE_DECREASE, {visible: true});
    await page.click(selectors.BTN_FONT_SIZE_DECREASE);
    await sleep(test_data.ANIMATION_DELAY_MS);
}

async function test_line_height(page: Page): Promise<void> {
    await open_personal_menu(page);
    await page.waitForSelector(selectors.BTN_LINE_HEIGHT_INCREASE, {visible: true, timeout: 8_000});
    await page.click(selectors.BTN_LINE_HEIGHT_INCREASE);
    await sleep(test_data.ANIMATION_DELAY_MS);
}

async function test_change_username(page: Page): Promise<void> {
    await page.goto(`${REALM_URL}/#settings/profile`, {waitUntil: "domcontentloaded"});
    await page.waitForSelector(selectors.INPUT_FULL_NAME, {visible: true, timeout: 10_000});
    await common.clear_and_type(page, selectors.INPUT_FULL_NAME, test_data.VALID_USERNAME);
    await page.keyboard.press(strings.KEY_ENTER);
    await page.waitForFunction(
        () => document.querySelector(".saved-success, .inline-block.success") !== null
            || document.body.innerText.includes("Saved"),
        {timeout: 8_000},
    );
}

async function test_copy_profile_link(page: Page): Promise<void> {
    const avatar = await page.waitForSelector(
        `li[data-name="${test_data.PROFILE_USER}"] .user-profile-picture-container`,
        {visible: true, timeout: 8_000},
    );
    assert.ok(avatar !== null, strings.ERR_AVATAR_NOT_FOUND(test_data.PROFILE_USER));
    await avatar.click();
    await sleep(test_data.ANIMATION_DELAY_MS);

    const view_profile_btn = await page.waitForSelector(
        strings.VIEW_FULL_USER_PROFILE,
        {visible: true, timeout: 8_000},
    );
    await view_profile_btn!.click();

    await page.waitForSelector(selectors.USER_PROFILE_MODAL, {visible: true, timeout: 8_000});

    const copy_btn = await page.waitForSelector(
        selectors.BTN_COPY_PROFILE_LINK,
        {visible: true, timeout: 8_000},
    );
    assert.ok(copy_btn !== null, strings.ERR_COPY_BTN_NOT_FOUND);
    await copy_btn.click();
    await sleep(test_data.ANIMATION_DELAY_MS);

    await page.keyboard.press(strings.KEY_ESCAPE);
    await page.waitForSelector(selectors.USER_PROFILE_MODAL, {hidden: true, timeout: 5_000});
}

async function test_invite_by_email_valid(page: Page): Promise<void> {
    await page.waitForSelector(selectors.BTN_GEAR_MENU, { visible: true });
    await page.click(selectors.BTN_GEAR_MENU);

    await clickPopoverMenuItem(page, strings.INVITE_USERS_MENU_TEXT);

    await typeInviteEmails(page, test_data.VALID_INVITE_EMAILS);

    await page.click(selectors.BTN_SUBMIT_INVITE);

    await sleep(2000);
    await page.keyboard.press(strings.KEY_ESCAPE);
}

async function switchInviteTabToLink(page: Page): Promise<void> {
    await page.waitForSelector(strings.INVITE_LINK_TAB, {
        visible: true,
        timeout: 8000,
    });

    await page.click(strings.INVITE_LINK_TAB);
}

async function test_copy_invite_link(page: Page): Promise<void> {
    await page.waitForSelector(selectors.BTN_GEAR_MENU, { visible: true });
    await page.click(selectors.BTN_GEAR_MENU);

    await clickPopoverMenuItem(page, strings.INVITE_USERS_MENU_TEXT);
    await switchInviteTabToLink(page);

    await page.waitForSelector(
        strings.FOOTER_SUBMIT_BTN,
        { visible: true, timeout: 8000 }
    );

    await page.click(strings.FOOTER_SUBMIT_BTN);

    await page.waitForSelector(
        strings.COPY_GENERATED_INVITE_LINK,
        { visible: true, timeout: 8000 }
    );

    const copyBtn = await page.$(strings.COPY_GENERATED_INVITE_LINK);

    if (!copyBtn) {
        throw new Error(strings.ERR_COPY_LINK_NOT_FOUND);
    }

    await copyBtn.click();

    await page.keyboard.press(strings.KEY_ESCAPE);
}

async function test_hide_userlist(page: Page): Promise<void> {
    await page.waitForSelector(strings.USERLIST_TOGGLE_BTN, { visible: true });

    await page.click(strings.USERLIST_TOGGLE_BTN);
    await page.waitForFunction(() => {
        const sidebar = document.querySelector("#right-sidebar");
        if (!sidebar) return true;
        return sidebar.clientWidth === 0;
    }, {timeout: 5_000});
}

async function test_change_timezone(page: Page): Promise<void> {
    await page.goto(`${REALM_URL}/#settings/profile`, {waitUntil: "domcontentloaded"});
    await page.waitForSelector(strings.TIMEZONE_WIDGET, {visible: true, timeout: 10_000});

    await page.click(strings.TIMEZONE_WIDGET);
    await page.waitForSelector(strings.TIMEZONE_DROPDOWN_CONTAINER, {visible: true, timeout: 5_000});

    await page.type(strings.TIMEZONE_SEARCH_INPUT, strings.TIMEZONE_VALID_ID);
    await sleep(test_data.ANIMATION_DELAY_MS);

    const option = await page.waitForSelector(
        strings.TIMEZONE_VALID_OPTION,
        {visible: true, timeout: 5_000},
    );
    await option!.click();

    await page.waitForFunction(() => {
        const btn = document.querySelector("#user_timezone_widget .dropdown_widget_value");
        return btn?.textContent?.includes("America/Costa_Rica");
    }, {timeout: 8_000});

    await page.keyboard.press(strings.KEY_ESCAPE);
}

type AccountTestCase = {
    name: string;
    test_function: (page: Page) => Promise<void>;
    skip_login?: boolean;
};

type AccountTestResult = {
    name: string;
    passed: boolean;
    error?: unknown;
};

function format_error(error: unknown): string {
    if (error instanceof Error) {
        return error.stack ?? error.message;
    }
    return String(error);
}

async function run_test_case(
    original_page: Page,
    home_url: string,
    test_case: AccountTestCase,
): Promise<void> {
    const browser = original_page.browser();

    let incognito_context: Awaited<ReturnType<typeof browser.createBrowserContext>> | null = null;
    let test_page: Page;

    if (test_case.skip_login) {
        incognito_context = await browser.createBrowserContext();
        test_page = await incognito_context.newPage();
    } else {
        test_page = await browser.newPage();
    }

    try {
        if (!test_case.skip_login) {
            await test_page.goto(home_url, {waitUntil: "domcontentloaded"});
            await ensure_logged_in(test_page);
        }

        await test_page.waitForSelector(strings.WAIT_SELECTOR_BODY, {visible: true, timeout: 10000});
        await test_case.test_function(test_page);
    } catch (error) {
        console.error(`Test ${test_case.name} failed: ${format_error(error)}`);
        throw error;
    } finally {
        if (!test_page.isClosed()) {
            await test_page.close();
        }
        if (incognito_context) {
            await incognito_context.close();
        }
    }
}

async function account_tests(page: Page): Promise<void> {
    await common.log_in(page);
    const home_url = page.url();

    const test_cases: AccountTestCase[] = [
        {name: "ACC-006-invalid-email", test_function: test_invalid_email_format, skip_login: true},
        {name: "ACC-007-password-recovery", test_function: test_password_recovery, skip_login: true},
        {name: "ACC-011-logout", test_function: test_logout},
        {name: "ACC-012-set-status", test_function: test_set_status},
        {name: "ACC-013-invisible", test_function: test_invisible_mode},
        {name: "ACC-014-self-dm", test_function: test_self_dm},
        {name: "ACC-015-themes", test_function: test_themes},
        {name: "ACC-016-font-size", test_function: test_font_size},
        {name: "ACC-017-line-height", test_function: test_line_height},
        {name: "ACC-018-change-username", test_function: test_change_username},
        {name: "ACC-020-profile-link", test_function: test_copy_profile_link},
        {name: "ACC-021-invite-by-email", test_function: test_invite_by_email_valid},
        {name: "ACC-022-invite-by-link", test_function: test_copy_invite_link},
        {name: "ACC-023-hide-userlist", test_function: test_hide_userlist},
        {name: "ACC-025-timezone", test_function: test_change_timezone},
    ];

    const results: AccountTestResult[] = [];

    for (const test_case of test_cases) {
        if (RUN_ONLY && !test_case.name.startsWith(RUN_ONLY)) {
            console.log(`Skipping ${test_case.name} (RUN_ONLY=${RUN_ONLY})`);
            continue;
        }

        try {
            await run_test_case(page, home_url, test_case);
            results.push({name: test_case.name, passed: true});
            console.log(`Test ${test_case.name} passed`);
        } catch (error) {
            results.push({name: test_case.name, passed: false, error});
            console.error(`Continuing after failure in ${test_case.name}`);
        }
    }

    const passed = results.filter((r) => r.passed);
    const failed = results.filter((r) => !r.passed);

    console.log("\n=== Test Summary ===");
    console.log(`Passed (${passed.length}): ${passed.map((r) => r.name).join(", ") || "none"}`);
    console.log(`Failed (${failed.length}): ${failed.map((r) => r.name).join(", ") || "none"}`);

    for (const f of failed) {
        console.error(`\n${f.name}: ${format_error(f.error)}`);
    }

    await ensure_logged_in(page);

    assert.strictEqual(
        failed.length,
        0,
        `Failed tests (${failed.length}): ${failed.map((r) => r.name).join(", ")}`,
    );
}

await common.run_test(account_tests);