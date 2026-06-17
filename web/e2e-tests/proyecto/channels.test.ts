import assert from "node:assert/strict";

import type { KeyInput, Page } from "puppeteer";

import * as common from "../lib/common.ts";

const test_data = {
    PUBLIC_CHANNEL_NAME: "TEC",
    PUBLIC_CHANNEL_DESC: "Channel created for CHN-001 test",
    PRIVATE_CHANNEL_NAME: "TEC Notas",
    PRIVATE_CHANNEL_DESC: "Channel created for CHN-002 test",
    EDITED_CHANNEL_NAME: "TEC General",
    EDITED_CHANNEL_DESC: "Canal para asuntos generales sobre el TEC.",
    NEW_SUBSCRIBER_NAME: "Cordelia, Lear's daughter",
    ANIMATION_DELAY_MS: 500,
    KEY_ENTER: 'Enter',
};

const selectors = {
    BTN_ADD_NEW_CHANNEL: "#add_new_subscription .create_stream_button",
    BTN_SUBMIT_CHANGE_INFO: "#change_stream_info_modal .dialog_submit_button",
    BTN_EXIT_OVERLAY: "#subscription_overlay .exit",
    BTN_CONTINUE_TO_SUBSCRIBERS: "form#stream_creation_form button#stream_creation_go_to_subscribers",
    BTN_CANCEL_CREATION: "form#stream_creation_form button.create_stream_cancel",
    BTN_OPEN_STREAM_INFO_MODAL: "#open_stream_info_modal",
    BTN_FINALIZE_CREATION: "form#stream_creation_form .finalize_create_stream",
    BTN_SAVE_PERMISSIONS: "#channel-subscription-permissions .save-button",
    BTN_CONFIRM_DIALOG: "#confirm_stream_privacy_change .dialog_submit_button",
    BTN_POPOVER_UNSUBSCRIBE: ".popover_sub_unsub_button",
    BTN_ADD_SUBSCRIBER: ".add_subscribers_container .add-subscriber-button",

    INPUT_CHANGE_STREAM_NAME: "input#change_stream_name",
    INPUT_CHANGE_STREAM_DESC: "textarea#change_stream_description",
    INPUT_ADD_SUBSCRIBER: ".add_subscribers_container .person_picker .input",

    CONTAINER_DROPDOWN_LIST: ".dropdown-list-container",
    CONTAINER_CREATE_SUBSCRIBERS: "#create_stream_subscribers",

    XPATH_OPTION_PRIVATE: `xpath///*[contains(@class, "dropdown-list-container")]//*[contains(@class, "list-item")]//*[normalize-space(text())="Private"]`,
    XPATH_OPTION_PUBLIC: `xpath///*[contains(@class, "dropdown-list-container")]//*[contains(@class, "list-item")]//*[normalize-space(text())="Public"]`,

    FORM_STREAM_CREATION: "form#stream_creation_form",
    MODAL_CHANGE_STREAM_INFO: "#change_stream_info_modal",
    OVERLAY_SUBSCRIPTION: "#subscription_overlay",
    TAB_PERMISSIONS: '#stream_settings .tab-container [data-tab-key="permissions"]',
    TAB_SUBSCRIBERS: '#stream_settings .tab-container [data-tab-key="subscribers"]',
    WIDGET_PRIVACY_DROPDOWN: "#new_channel_privacy_widget",
    ERROR_STREAM_NAME: "#stream_name_error",
    SIDEBAR_MENU_ICON: ".stream-sidebar-menu-icon",
    POPOVER_CHANNEL_SETTINGS: ".open_stream_settings",
    WIDGET_CHANNEL_PRIVACY: "#channel_privacy_widget",
    TYPEAHEAD_ITEM: ".typeahead",
};

const messages = {
    DUPLICATE_CHANNEL_ERROR: "A channel with this name already exists.",
    STREAM_IS_PUBLIC: (channel_name: string) => `Stream ${channel_name} must NOT have a private lock icon`,
    INVALID_CHANNEL_NAME: "Channel name must be present in the error message",
    STREAM_SUBSCRIBED_ICON: (name: string) => `Icon for ${name} must be a checkmark`
};

async function create_new_public_channel(page: Page): Promise<void> {
    await page.click(selectors.BTN_ADD_NEW_CHANNEL);
    await page.waitForSelector(selectors.FORM_STREAM_CREATION, { visible: true });
    await common.fill_form(page, selectors.FORM_STREAM_CREATION, {
        stream_name: test_data.PUBLIC_CHANNEL_NAME,
        stream_description: test_data.PUBLIC_CHANNEL_DESC,
    });

    await page.click(selectors.BTN_CONTINUE_TO_SUBSCRIBERS);
    await page.waitForSelector(selectors.CONTAINER_CREATE_SUBSCRIBERS, { visible: true });
    await page.click(selectors.BTN_FINALIZE_CREATION);

    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
    await page.waitForSelector(get_xpath_channel_title(test_data.PUBLIC_CHANNEL_NAME), { visible: true });

    const stream_in_sidebar = await page.$(get_left_sidebar_channel_xpath(test_data.PUBLIC_CHANNEL_NAME));
    assert.ok(stream_in_sidebar !== null, msg_stream_visible_in_sidebar(test_data.PUBLIC_CHANNEL_NAME));
}

async function create_new_private_channel(page: Page): Promise<void> {
    await page.click(selectors.BTN_ADD_NEW_CHANNEL);
    await page.waitForSelector(selectors.FORM_STREAM_CREATION, { visible: true });
    await common.fill_form(page, selectors.FORM_STREAM_CREATION, {
        stream_name: test_data.PRIVATE_CHANNEL_NAME,
        stream_description: test_data.PRIVATE_CHANNEL_DESC,
    });

    await page.click(selectors.WIDGET_PRIVACY_DROPDOWN);
    await page.waitForSelector(selectors.CONTAINER_DROPDOWN_LIST, { visible: true });
    await new Promise(r => setTimeout(r, test_data.ANIMATION_DELAY_MS));

    const private_option = await page.waitForSelector(selectors.XPATH_OPTION_PRIVATE, { visible: true });
    assert.ok(private_option !== null);
    await private_option.click();

    await page.click(selectors.BTN_CONTINUE_TO_SUBSCRIBERS);
    await page.waitForSelector(selectors.CONTAINER_CREATE_SUBSCRIBERS, { visible: true });
    await page.click(selectors.BTN_FINALIZE_CREATION);

    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
    await page.waitForSelector(get_xpath_channel_title(test_data.PRIVATE_CHANNEL_NAME), { visible: true });

    const stream_in_sidebar = await page.$(get_left_sidebar_channel_xpath(test_data.PRIVATE_CHANNEL_NAME));
    assert.ok(stream_in_sidebar !== null, msg_stream_visible_in_sidebar(test_data.PRIVATE_CHANNEL_NAME));

    const lock_icon = await page.$(get_left_sidebar_lock_icon_xpath(test_data.PRIVATE_CHANNEL_NAME));
    assert.ok(lock_icon !== null, msg_stream_has_private_lock(test_data.PRIVATE_CHANNEL_NAME));
}

async function try_create_duplicate_channel(page: Page): Promise<void> {
    await page.click(selectors.BTN_ADD_NEW_CHANNEL);
    await page.waitForSelector(selectors.FORM_STREAM_CREATION, { visible: true });

    await common.fill_form(page, selectors.FORM_STREAM_CREATION, {
        stream_name: test_data.PRIVATE_CHANNEL_NAME,
        stream_description: test_data.PRIVATE_CHANNEL_DESC,
    });

    await page.click(selectors.WIDGET_PRIVACY_DROPDOWN);
    await page.waitForSelector(selectors.CONTAINER_DROPDOWN_LIST, { visible: true });
    const private_option = await page.waitForSelector(selectors.XPATH_OPTION_PRIVATE, { visible: true });

    assert.ok(private_option !== null);
    await private_option.click();

    await page.click(selectors.BTN_CONTINUE_TO_SUBSCRIBERS);
    await page.waitForSelector(selectors.ERROR_STREAM_NAME, { visible: true });
    const error_text = await common.get_text_from_selector(page, selectors.ERROR_STREAM_NAME);
    assert.strictEqual(error_text, messages.DUPLICATE_CHANNEL_ERROR);

    await page.click(selectors.BTN_CANCEL_CREATION);
    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
}

async function edit_public_channel_name(page: Page): Promise<void> {
    await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.PUBLIC_CHANNEL_NAME), { visible: true });
    await page.hover(get_left_sidebar_channel_xpath(test_data.PUBLIC_CHANNEL_NAME));
    await page.click(get_left_sidebar_ellipsis_xpath(test_data.PUBLIC_CHANNEL_NAME));
    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.BTN_OPEN_STREAM_INFO_MODAL, { visible: true });
    await page.click(selectors.BTN_OPEN_STREAM_INFO_MODAL);

    await page.waitForSelector(selectors.MODAL_CHANGE_STREAM_INFO, { visible: true });
    await common.clear_and_type(page, selectors.INPUT_CHANGE_STREAM_NAME, test_data.EDITED_CHANNEL_NAME);
    await page.click(selectors.BTN_SUBMIT_CHANGE_INFO);
    await page.waitForSelector(selectors.MODAL_CHANGE_STREAM_INFO, { hidden: true });

    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });

    await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.EDITED_CHANNEL_NAME), { visible: true });
    const stream_in_sidebar = await page.$(get_left_sidebar_channel_xpath(test_data.EDITED_CHANNEL_NAME));
    assert.ok(stream_in_sidebar !== null, msg_stream_visible_in_sidebar(test_data.EDITED_CHANNEL_NAME));
}

async function edit_public_channel_description(page: Page): Promise<void> {
    await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.EDITED_CHANNEL_NAME), { visible: true });
    await page.hover(get_left_sidebar_channel_xpath(test_data.EDITED_CHANNEL_NAME));
    await page.click(get_left_sidebar_ellipsis_xpath(test_data.EDITED_CHANNEL_NAME));
    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.BTN_OPEN_STREAM_INFO_MODAL, { visible: true });
    await page.click(selectors.BTN_OPEN_STREAM_INFO_MODAL);

    await page.waitForSelector(selectors.MODAL_CHANGE_STREAM_INFO, { visible: true });
    await common.clear_and_type(page, selectors.INPUT_CHANGE_STREAM_DESC, test_data.EDITED_CHANNEL_DESC);
    await page.click(selectors.BTN_SUBMIT_CHANGE_INFO);
    await page.waitForSelector(selectors.MODAL_CHANGE_STREAM_INFO, { hidden: true });

    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
}

async function edit_private_channel_privacy(page: Page): Promise<void> {
    await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    await page.hover(get_left_sidebar_channel_xpath(test_data.PRIVATE_CHANNEL_NAME));
    await page.click(get_left_sidebar_ellipsis_xpath(test_data.PRIVATE_CHANNEL_NAME));
    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.TAB_PERMISSIONS, { visible: true });
    await page.click(selectors.TAB_PERMISSIONS);

    await page.waitForSelector(selectors.WIDGET_CHANNEL_PRIVACY, { visible: true });
    await page.click(selectors.WIDGET_CHANNEL_PRIVACY);

    await page.waitForSelector(selectors.CONTAINER_DROPDOWN_LIST, { visible: true });
    await new Promise(r => setTimeout(r, test_data.ANIMATION_DELAY_MS));

    const public_option = await page.waitForSelector(selectors.XPATH_OPTION_PUBLIC, { visible: true });
    assert.ok(public_option !== null);
    await public_option.click();
    await page.click(selectors.BTN_SAVE_PERMISSIONS);

    await common.wait_for_micromodal_to_open(page);
    await page.waitForSelector(selectors.BTN_CONFIRM_DIALOG, { visible: true });
    await page.click(selectors.BTN_CONFIRM_DIALOG);

    await common.wait_for_micromodal_to_close(page);
    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
    await page.waitForSelector(get_left_sidebar_lock_icon_xpath(test_data.PRIVATE_CHANNEL_NAME), { hidden: true });
}

async function unsubscribe_public_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_left_sidebar_ellipsis_xpath(test_data.EDITED_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.BTN_POPOVER_UNSUBSCRIBE, { visible: true });
    await page.click(selectors.BTN_POPOVER_UNSUBSCRIBE);

    await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.EDITED_CHANNEL_NAME), { hidden: true });
}

async function subscribe_public_channel(page: Page): Promise<void> {
    await common.open_streams_modal(page);

    const subscribe_btn = await page.waitForSelector(get_xpath_subscribe_btn(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(subscribe_btn !== null);
    await subscribe_btn.click();

    const checked_icon = await page.waitForSelector(get_xpath_subscribed_checkmark(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(checked_icon !== null, messages.STREAM_SUBSCRIBED_ICON(test_data.EDITED_CHANNEL_NAME));

    await page.evaluate((selector) => {
        const exit_btn = document.querySelector(selector) as HTMLElement;
        if (exit_btn) exit_btn.click();
    }, selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });

    const sidebar_channel = await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(sidebar_channel !== null, msg_stream_visible_in_sidebar(test_data.EDITED_CHANNEL_NAME));
}

async function add_user_private_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_left_sidebar_ellipsis_xpath(test_data.PRIVATE_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.TAB_SUBSCRIBERS, { visible: true });
    await page.click(selectors.TAB_SUBSCRIBERS);

    await page.waitForSelector(selectors.INPUT_ADD_SUBSCRIBER, { visible: true });
    await page.click(selectors.INPUT_ADD_SUBSCRIBER);
    await page.type(selectors.INPUT_ADD_SUBSCRIBER, test_data.NEW_SUBSCRIBER_NAME);

    const typeahead_item = await page.waitForSelector(get_xpath_typeahead_item(test_data.NEW_SUBSCRIBER_NAME), { visible: true });
    await typeahead_item!.click();

    await page.click(selectors.BTN_ADD_SUBSCRIBER);
    await page.waitForSelector(get_xpath_subscriber_row(test_data.NEW_SUBSCRIBER_NAME), { visible: true });
    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
}

async function remove_user_private_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_left_sidebar_channel_xpath(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_left_sidebar_ellipsis_xpath(test_data.PRIVATE_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.TAB_SUBSCRIBERS, { visible: true });
    await page.click(selectors.TAB_SUBSCRIBERS);

    const subscriber_row = await page.waitForSelector(get_xpath_subscriber_row(test_data.NEW_SUBSCRIBER_NAME), { visible: true });
    assert.ok(subscriber_row !== null);
    await subscriber_row.hover();

    const remove_btn = await page.waitForSelector(get_xpath_remove_subscriber_btn(test_data.NEW_SUBSCRIBER_NAME), { visible: true });
    assert.ok(remove_btn !== null);
    await remove_btn.click();
    await page.waitForSelector(get_xpath_subscriber_row(test_data.NEW_SUBSCRIBER_NAME), { hidden: true });

    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
}

async function channels_tests(page: Page): Promise<void> {
    // test CHN-001
    await common.log_in(page);
    await common.open_streams_modal(page);
    await create_new_public_channel(page);

    // test CHN-002
    await common.open_streams_modal(page);
    await create_new_private_channel(page);

    // test CHN-003
    await common.open_streams_modal(page);
    await try_create_duplicate_channel(page);

    // test CHN-004
    await edit_public_channel_name(page);

    // test CHN-005
    await edit_public_channel_description(page);

    // test CHN-006
    await edit_private_channel_privacy(page);

    // test CHN-008
    await unsubscribe_public_channel(page);

    // test CHN-007
    await subscribe_public_channel(page);

    // test CHN-009
    await add_user_private_channel(page);

    // test CHN-010
    await remove_user_private_channel(page);
}

function get_xpath_channel_title(channel_name: string): string {
    return `xpath///*[${common.has_class_x("message-header-navbar-title")} and text()="${channel_name}"]`;
}

function get_left_sidebar_channel_xpath(channel_name: string): string {
    return `xpath///*[@id="left_sidebar_scroll_container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]`;
}

function get_left_sidebar_ellipsis_xpath(channel_name: string): string {
    return `xpath///*[@id="left_sidebar_scroll_container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]` +
        `//span[contains(@class, "stream-sidebar-menu-icon")]`;
}

function get_left_sidebar_lock_icon_xpath(channel_name: string): string {
    return `xpath///*[@id="left_sidebar_scroll_container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]` +
        `//i[contains(@class, "zulip-icon-lock")]`;
}

function msg_stream_visible_in_sidebar(channel_name: string): string {
    return `Stream ${channel_name} must be visible in the left panel`;
}

function msg_stream_has_private_lock(channel_name: string): string {
    return `Stream ${channel_name} must have a private lock icon`;
}

function get_xpath_subscribe_btn(channel_name: string): string {
    return `xpath///*[contains(@class, "stream-row") and @data-stream-name="${channel_name}"]//div[contains(@class, "sub_unsub_button") and not(contains(@class, "checked"))]`;
}

function get_xpath_subscribed_checkmark(channel_name: string): string {
    return `xpath///*[contains(@class, "stream-row") and @data-stream-name="${channel_name}"]//div[contains(@class, "sub_unsub_button") and contains(@class, "checked")]`;
}

function get_xpath_typeahead_item(name: string): string {
    return `xpath///*[contains(@class, "typeahead") and not(contains(@style, "display: none"))]//li[contains(normalize-space(), "${name}")]//a`;
}

function get_xpath_subscriber_row(subscriber_name: string): string {
    return `xpath///*[@id="stream_members_list"]//tbody[contains(@class, "subscriber_table")]//tr[.//text()[contains(., "${subscriber_name}")]]`;
}

function get_xpath_remove_subscriber_btn(subscriber_name: string): string {
    return get_xpath_subscriber_row(subscriber_name) + `//button[contains(@class, "remove-subscriber-button")]`;
}

await common.run_test(channels_tests);
