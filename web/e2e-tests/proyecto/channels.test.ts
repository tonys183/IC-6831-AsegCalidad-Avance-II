import assert from "node:assert/strict";

import type { Page } from "puppeteer";

import * as common from "../lib/common.ts";

const test_data = {
    PUBLIC_CHANNEL_NAME: "TEC",
    PUBLIC_CHANNEL_DESC: "Channel created for CHN-001 test",
    PRIVATE_CHANNEL_NAME: "TEC Notas",
    PRIVATE_CHANNEL_DESC: "Channel created for CHN-002 test",
    EDITED_CHANNEL_NAME: "TEC General",
    EDITED_CHANNEL_DESC: "Canal para asuntos generales sobre el TEC.",
    NEW_SUBSCRIBER_NAME: "Cordelia, Lear's daughter",
    NEW_PERMISSION_ROLE: "Administrators",
    NEW_TOPIC_NAME: "Proyecto",
    NEW_TOPIC_MESSAGE: "¿Cuándo era la fecha del Proyecto I?",
    NEW_MESSAGE_CONTENT: "Para el 8 de mayo",
    SEARCH_TEXT: "Proyecto",
    EMPTY_STRING: "",
    EVENT_INPUT: "input",
    KEY_ENTER: "Enter" as const,
    KEY_ESCAPE: "Escape" as const,
    NEW_CHANNEL_COLOR: "#94c849",
    NEW_FOLDER_NAME: "TEC",
    ANIMATION_DELAY_MS: 500,
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
    BTN_SAVE_MESSAGING_PERMISSIONS: "#channel-messaging-permissions .save-button",
    BTN_CONFIRM_DIALOG: "#confirm_stream_privacy_change .dialog_submit_button",
    BTN_POPOVER_UNSUBSCRIBE: ".popover_sub_unsub_button",
    BTN_POPOVER_MUTE_CHANNEL: ".toggle_stream_muted",
    BTN_POPOVER_PIN_CHANNEL: ".pin_to_top",
    BTN_ADD_SUBSCRIBER: ".add_subscribers_container .add-subscriber-button",
    BTN_ARCHIVE_CHANNEL: ".stream-title-buttons .deactivate",
    BTN_UNARCHIVE_CHANNEL: ".stream-title-buttons .reactivate",
    BTN_CONFIRM_ARCHIVE: "#archive-stream-modal .dialog_submit_button",
    BTN_CONFIRM_UNARCHIVE: "#unarchive-stream-modal .dialog_submit_button",
    BTN_COMPOSE_SEND: "#compose-send-button",
    BTN_SEARCH_CLOSE: ".search_close_button",
    BTN_POPOVER_CHANNEL_SETTINGS: ".open_stream_settings",
    BTN_POPOVER_CHANGE_COLOR: ".popover-menu .choose_stream_color",
    BTN_CONFIRM_COLOR: ".color_picker_confirm_button",
    BTN_CREATE_FOLDER: ".create-channel-folder-button",
    BTN_MODAL_CREATE_FOLDER: "#create_channel_folder .dialog_submit_button",
    BTN_SAVE_GENERAL_SETTINGS: "[data-stream-section=\"general\"] .save-button",

    INPUT_CHANGE_STREAM_NAME: "input#change_stream_name",
    INPUT_CHANGE_STREAM_DESC: "textarea#change_stream_description",
    INPUT_ADD_SUBSCRIBER: ".add_subscribers_container .person_picker .input",
    INPUT_MESSAGING_PERMISSIONS: ".can_send_message_group_container .input",
    INPUT_COMPOSE_TOPIC: "#stream_message_recipient_topic",
    INPUT_COMPOSE_MESSAGE: "#compose-textarea",
    INPUT_LEFT_SIDEBAR_SEARCH: ".left-sidebar-search-input",
    INPUT_RIGHT_SIDEBAR_SEARCH: ".user-list-filter",
    INPUT_SEARCH_QUERY: "#search_query",
    INPUT_FOLDER_NAME: "#new_channel_folder_name",

    CONTAINER_DROPDOWN_LIST: ".dropdown-list-container",
    CONTAINER_CREATE_SUBSCRIBERS: "#create_stream_subscribers",
    CONTAINER_COLOR_PICKER: ".color-picker-popover",

    MODAL_CREATE_FOLDER: "#create_channel_folder",
    MODAL_CHANGE_STREAM_INFO: "#change_stream_info_modal",

    WIDGET_STREAM_SETTINGS_FILTER: "#stream_settings_filter_widget",
    WIDGET_PRIVACY_DROPDOWN: "#new_channel_privacy_widget",
    WIDGET_CHANNEL_PRIVACY: "#channel_privacy_widget",

    TAB_ALL_CHANNELS: `xpath///*[contains(@class, "ind-tab") and normalize-space(text())="All"]`,
    TAB_GENERAL: '#stream_settings .tab-container [data-tab-key="general"]',
    TAB_PERMISSIONS: '#stream_settings .tab-container [data-tab-key="permissions"]',
    TAB_SUBSCRIBERS: '#stream_settings .tab-container [data-tab-key="subscribers"]',

    XPATH_OPTION_PRIVATE: `xpath///*[contains(@class, "dropdown-list-container")]//*[contains(@class, "list-item")]//*[normalize-space(text())="Private"]`,
    XPATH_OPTION_PUBLIC: `xpath///*[contains(@class, "dropdown-list-container")]//*[contains(@class, "list-item")]//*[normalize-space(text())="Public"]`,
    XPATH_OPTION_ARCHIVED: `xpath///*[contains(@class, "dropdown-list-container")]//*[contains(@class, "list-item")]//*[normalize-space(text())="Archived channels"]`,

    FORM_STREAM_CREATION: "form#stream_creation_form",
    OVERLAY_SUBSCRIPTION: "#subscription_overlay",
    ERROR_STREAM_NAME: "#stream_name_error",
    SIDEBAR_MENU_ICON: ".stream-sidebar-menu-icon",
    POPOVER_CHANNEL_SETTINGS: ".open_stream_settings",
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

    const stream_in_sidebar = await page.$(get_xpath_left_sidebar_channel(test_data.PUBLIC_CHANNEL_NAME));
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
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    const private_option = await page.waitForSelector(selectors.XPATH_OPTION_PRIVATE, { visible: true });
    assert.ok(private_option !== null);
    await private_option.click();

    await page.click(selectors.BTN_CONTINUE_TO_SUBSCRIBERS);
    await page.waitForSelector(selectors.CONTAINER_CREATE_SUBSCRIBERS, { visible: true });
    await page.click(selectors.BTN_FINALIZE_CREATION);

    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
    await page.waitForSelector(get_xpath_channel_title(test_data.PRIVATE_CHANNEL_NAME), { visible: true });

    const stream_in_sidebar = await page.$(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME));
    assert.ok(stream_in_sidebar !== null, msg_stream_visible_in_sidebar(test_data.PRIVATE_CHANNEL_NAME));

    const lock_icon = await page.$(get_xpath_left_sidebar_lock_icon(test_data.PRIVATE_CHANNEL_NAME));
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
    await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PUBLIC_CHANNEL_NAME), { visible: true });
    await page.hover(get_xpath_left_sidebar_channel(test_data.PUBLIC_CHANNEL_NAME));
    await page.click(get_xpath_left_sidebar_ellipsis(test_data.PUBLIC_CHANNEL_NAME));
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

    await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    const stream_in_sidebar = await page.$(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME));
    assert.ok(stream_in_sidebar !== null, msg_stream_visible_in_sidebar(test_data.EDITED_CHANNEL_NAME));
}

async function edit_public_channel_description(page: Page): Promise<void> {
    await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    await page.hover(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME));
    await page.click(get_xpath_left_sidebar_ellipsis(test_data.EDITED_CHANNEL_NAME));
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
    await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    await page.hover(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME));
    await page.click(get_xpath_left_sidebar_ellipsis(test_data.PRIVATE_CHANNEL_NAME));
    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.TAB_PERMISSIONS, { visible: true });
    await page.click(selectors.TAB_PERMISSIONS);

    await page.waitForSelector(selectors.WIDGET_CHANNEL_PRIVACY, { visible: true });
    await page.click(selectors.WIDGET_CHANNEL_PRIVACY);

    await page.waitForSelector(selectors.CONTAINER_DROPDOWN_LIST, { visible: true });
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

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
    await page.waitForSelector(get_xpath_left_sidebar_lock_icon(test_data.PRIVATE_CHANNEL_NAME), { hidden: true });
}

async function unsubscribe_public_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.EDITED_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.BTN_POPOVER_UNSUBSCRIBE, { visible: true });
    await page.click(selectors.BTN_POPOVER_UNSUBSCRIBE);

    await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { hidden: true });
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

    const sidebar_channel = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(sidebar_channel !== null, msg_stream_visible_in_sidebar(test_data.EDITED_CHANNEL_NAME));
}

async function add_user_private_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.PRIVATE_CHANNEL_NAME);
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
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.PRIVATE_CHANNEL_NAME);
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

async function edit_channel_posting_permissions(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.PRIVATE_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.TAB_PERMISSIONS, { visible: true });
    await page.click(selectors.TAB_PERMISSIONS);

    await page.waitForSelector(selectors.INPUT_MESSAGING_PERMISSIONS, { visible: true });
    await page.click(selectors.INPUT_MESSAGING_PERMISSIONS);
    await page.type(selectors.INPUT_MESSAGING_PERMISSIONS, test_data.NEW_PERMISSION_ROLE);

    const typeahead_item = await page.waitForSelector(get_xpath_typeahead_item(test_data.NEW_PERMISSION_ROLE), { visible: true });
    await typeahead_item!.click();

    await page.waitForSelector(selectors.BTN_SAVE_MESSAGING_PERMISSIONS, { visible: true });
    await page.click(selectors.BTN_SAVE_MESSAGING_PERMISSIONS);

    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
}

async function create_new_topic(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const new_topic_btn = get_xpath_left_sidebar_new_topic_btn(test_data.EDITED_CHANNEL_NAME);
    await page.waitForSelector(new_topic_btn, { visible: true });
    await page.click(new_topic_btn);

    await page.waitForSelector(selectors.INPUT_COMPOSE_TOPIC, { visible: true });
    await page.type(selectors.INPUT_COMPOSE_TOPIC, test_data.NEW_TOPIC_NAME);

    await page.waitForSelector(selectors.INPUT_COMPOSE_MESSAGE, { visible: true });
    await page.type(selectors.INPUT_COMPOSE_MESSAGE, test_data.NEW_TOPIC_MESSAGE);

    await page.waitForSelector(selectors.BTN_COMPOSE_SEND, { visible: true });
    await page.click(selectors.BTN_COMPOSE_SEND);
}

async function send_message_to_topic(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.click();

    const topic_link = get_xpath_left_sidebar_topic(test_data.EDITED_CHANNEL_NAME, test_data.NEW_TOPIC_NAME);
    const topic_item = await page.waitForSelector(topic_link, { visible: true });
    await topic_item!.click();

    await page.waitForSelector(selectors.INPUT_COMPOSE_MESSAGE, { visible: true });
    await page.click(selectors.INPUT_COMPOSE_MESSAGE);
    await page.type(selectors.INPUT_COMPOSE_MESSAGE, test_data.NEW_MESSAGE_CONTENT);

    await page.waitForSelector(selectors.BTN_COMPOSE_SEND, { visible: true });
    await page.click(selectors.BTN_COMPOSE_SEND);
}

async function mute_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.EDITED_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.BTN_POPOVER_MUTE_CHANNEL, { visible: true });
    await page.click(selectors.BTN_POPOVER_MUTE_CHANNEL);

    await page.waitForSelector(get_xpath_left_sidebar_muted_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
}

async function unmute_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.EDITED_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.BTN_POPOVER_MUTE_CHANNEL, { visible: true });
    await page.click(selectors.BTN_POPOVER_MUTE_CHANNEL);

    await page.waitForSelector(get_xpath_left_sidebar_unmuted_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
}

async function archive_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.PRIVATE_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.BTN_ARCHIVE_CHANNEL, { visible: true });
    await page.click(selectors.BTN_ARCHIVE_CHANNEL);

    await common.wait_for_micromodal_to_open(page);
    await page.waitForSelector(selectors.BTN_CONFIRM_ARCHIVE, { visible: true });
    await page.click(selectors.BTN_CONFIRM_ARCHIVE);
    await common.wait_for_micromodal_to_close(page);

    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
}

async function unarchive_channel(page: Page): Promise<void> {
    await common.open_streams_modal(page);

    await page.waitForSelector(selectors.TAB_ALL_CHANNELS, { visible: true });
    await page.click(selectors.TAB_ALL_CHANNELS);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    await page.waitForSelector(selectors.WIDGET_STREAM_SETTINGS_FILTER, { visible: true });
    await page.click(selectors.WIDGET_STREAM_SETTINGS_FILTER);

    await page.waitForSelector(selectors.CONTAINER_DROPDOWN_LIST, { visible: true });
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    const archived_option = await page.waitForSelector(selectors.XPATH_OPTION_ARCHIVED, { visible: true });
    await archived_option!.click();

    const stream_row = await page.waitForSelector(get_xpath_stream_row(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    await stream_row!.click();

    await page.waitForSelector(selectors.BTN_UNARCHIVE_CHANNEL, { visible: true });
    await page.click(selectors.BTN_UNARCHIVE_CHANNEL);

    await common.wait_for_micromodal_to_open(page);
    await page.waitForSelector(selectors.BTN_CONFIRM_UNARCHIVE, { visible: true });
    await page.click(selectors.BTN_CONFIRM_UNARCHIVE);
    await common.wait_for_micromodal_to_close(page);

    await page.click(selectors.BTN_EXIT_OVERLAY);
    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
}

async function pin_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.PRIVATE_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.BTN_POPOVER_PIN_CHANNEL, { visible: true });
    await page.click(selectors.BTN_POPOVER_PIN_CHANNEL);

    await page.waitForSelector(get_xpath_left_sidebar_pinned_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
}

async function unpin_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_pinned_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const sidebar_ellipsis = get_xpath_left_sidebar_ellipsis(test_data.PRIVATE_CHANNEL_NAME);
    await page.waitForSelector(sidebar_ellipsis, { visible: true });
    await page.click(sidebar_ellipsis);

    await page.waitForSelector(selectors.BTN_POPOVER_PIN_CHANNEL, { visible: true });
    await page.click(selectors.BTN_POPOVER_PIN_CHANNEL);

    await page.waitForSelector(get_xpath_left_sidebar_unpinned_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
}

async function search_channel(page: Page): Promise<void> {
    await page.waitForSelector(selectors.INPUT_LEFT_SIDEBAR_SEARCH, { visible: true });
    await page.click(selectors.INPUT_LEFT_SIDEBAR_SEARCH);

    await page.type(selectors.INPUT_LEFT_SIDEBAR_SEARCH, test_data.PRIVATE_CHANNEL_NAME);

    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.PRIVATE_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);

    await page.evaluate((selector, empty_val, event_name) => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input) {
            input.value = empty_val;
            input.dispatchEvent(new Event(event_name, { bubbles: true }));
        }
    }, selectors.INPUT_LEFT_SIDEBAR_SEARCH, test_data.EMPTY_STRING, test_data.EVENT_INPUT);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));
}

async function view_channel_history(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.click();

    await page.waitForSelector(get_xpath_channel_title(test_data.EDITED_CHANNEL_NAME), { visible: true });

    const message = await page.waitForSelector(get_xpath_message_content(test_data.NEW_MESSAGE_CONTENT), { visible: true });
    assert.ok(message !== null);
}

async function search_message_in_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.click();

    await page.waitForSelector(get_xpath_channel_title(test_data.EDITED_CHANNEL_NAME), { visible: true });

    await page.waitForSelector(selectors.INPUT_SEARCH_QUERY, { visible: true });
    await page.click(selectors.INPUT_SEARCH_QUERY);

    await page.type(selectors.INPUT_SEARCH_QUERY, test_data.SEARCH_TEXT);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    const suggestion = await page.waitForSelector(get_xpath_search_suggestion(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(suggestion !== null);
    await suggestion.click();

    const search_result = await page.waitForSelector(get_xpath_message_row(test_data.SEARCH_TEXT), { visible: true });
    assert.ok(search_result !== null);

    const exit_search = await page.$(selectors.BTN_SEARCH_CLOSE);
    if (exit_search) {
        await exit_search.click();
        await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));
    }
}

async function filter_users_in_channel(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.click();

    await page.waitForSelector(get_xpath_channel_title(test_data.EDITED_CHANNEL_NAME), { visible: true });

    await page.waitForSelector(selectors.INPUT_RIGHT_SIDEBAR_SEARCH, { visible: true });
    await page.click(selectors.INPUT_RIGHT_SIDEBAR_SEARCH);

    await page.type(selectors.INPUT_RIGHT_SIDEBAR_SEARCH, test_data.NEW_SUBSCRIBER_NAME);

    const user_row = await page.waitForSelector(get_xpath_right_sidebar_user(test_data.NEW_SUBSCRIBER_NAME), { visible: true });
    assert.ok(user_row !== null);

    await page.evaluate((selector, empty_val, event_name) => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input) {
            input.value = empty_val;
            input.dispatchEvent(new Event(event_name, { bubbles: true }));
        }
    }, selectors.INPUT_RIGHT_SIDEBAR_SEARCH, test_data.EMPTY_STRING, test_data.EVENT_INPUT);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));
}

async function change_channel_color(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const menu_icon = await page.waitForSelector(get_xpath_left_sidebar_ellipsis(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(menu_icon !== null);
    await menu_icon.click();

    await page.waitForSelector(selectors.BTN_POPOVER_CHANGE_COLOR, { visible: true });
    await page.click(selectors.BTN_POPOVER_CHANGE_COLOR);
    await page.waitForSelector(selectors.CONTAINER_COLOR_PICKER, { visible: true });

    const swatch = await page.waitForSelector(get_xpath_color_swatch(test_data.NEW_CHANNEL_COLOR), { visible: true });
    assert.ok(swatch !== null);
    await swatch.click();
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    await page.click(selectors.BTN_CONFIRM_COLOR);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    const picker_gone = await page.$(selectors.CONTAINER_COLOR_PICKER);
    assert.ok(picker_gone === null);
}

async function create_channel_folder(page: Page): Promise<void> {
    const channel_row = await page.waitForSelector(get_xpath_left_sidebar_channel(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(channel_row !== null);
    await channel_row.hover();

    const menu_icon = await page.waitForSelector(get_xpath_left_sidebar_ellipsis(test_data.EDITED_CHANNEL_NAME), { visible: true });
    assert.ok(menu_icon !== null);
    await menu_icon.click();

    await page.waitForSelector(selectors.BTN_POPOVER_CHANNEL_SETTINGS, { visible: true });
    await page.click(selectors.BTN_POPOVER_CHANNEL_SETTINGS);

    await page.waitForSelector(selectors.TAB_GENERAL, { visible: true });
    await page.click(selectors.TAB_GENERAL);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    await page.waitForSelector(selectors.BTN_CREATE_FOLDER, { visible: true });
    await page.click(selectors.BTN_CREATE_FOLDER);

    await page.waitForSelector(selectors.INPUT_FOLDER_NAME, { visible: true });
    await page.type(selectors.INPUT_FOLDER_NAME, test_data.NEW_FOLDER_NAME);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    await page.click(selectors.BTN_MODAL_CREATE_FOLDER);
    await page.waitForSelector(selectors.MODAL_CREATE_FOLDER, { hidden: true });
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    await page.waitForSelector(selectors.BTN_SAVE_GENERAL_SETTINGS, { visible: true });
    await page.click(selectors.BTN_SAVE_GENERAL_SETTINGS);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    await page.keyboard.press(test_data.KEY_ESCAPE);
    await new Promise(delay => setTimeout(delay, test_data.ANIMATION_DELAY_MS));

    const folder = await page.waitForSelector(get_xpath_left_sidebar_folder(test_data.NEW_FOLDER_NAME), { visible: true });
    assert.ok(folder !== null);
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

    // test CHN-011
    await edit_channel_posting_permissions(page);

    // test CHN-012
    await create_new_topic(page);

    // test CHN-013
    await send_message_to_topic(page);

    // test CHN-014
    await mute_channel(page);

    // test CHN-015
    await unmute_channel(page);

    // test CHN-016
    await archive_channel(page);

    // test CHN-017
    await unarchive_channel(page);

    // test CHN-018
    await pin_channel(page);

    // test CHN-019
    await unpin_channel(page);

    // test CHN-020
    await search_channel(page);

    // test CHN-021
    await view_channel_history(page);

    // test CHN-022
    await search_message_in_channel(page);

    // test CHN-023
    await filter_users_in_channel(page);

    // test CHN-024
    await change_channel_color(page);

    // test CHN-025
    await create_channel_folder(page);
}

function get_xpath_channel_title(channel_name: string): string {
    return `xpath///*[${common.has_class_x("message-header-navbar-title")} and text()="${channel_name}"]`;
}

function get_xpath_left_sidebar_channel(channel_name: string): string {
    return `xpath///*[@id="left_sidebar_scroll_container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]`;
}

function get_xpath_left_sidebar_pinned_channel(channel_name: string): string {
    return `xpath///*[@id="stream-list-pinned-streams-container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]`;
}

function get_xpath_left_sidebar_unpinned_channel(channel_name: string): string {
    return `xpath///*[@id="stream-list-normal-streams-container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]`;
}

function get_xpath_left_sidebar_muted_channel(channel_name: string): string {
    return get_xpath_left_sidebar_channel(channel_name) + `[contains(@class, "out_of_home_view")]`;
}

function get_xpath_message_content(message_text: string): string {
    return `xpath///*[contains(@class, "message_content")]//*[contains(text(), "${message_text}")]`;
}

function get_xpath_message_row(message_text: string): string {
    return `xpath///*[contains(@class, "message_row")]//*[contains(text(), "${message_text}")]`;
}

function get_xpath_right_sidebar_user(user_name: string): string {
    return `xpath///*[contains(@class, "user_sidebar_entry")]//*[contains(text(), "${user_name}")]`;
}

function get_xpath_search_suggestion(channel_name: string): string {
    return `xpath///*[contains(@class, "typeahead")]//*[contains(text(), "${channel_name}")]`;
}

function get_xpath_color_swatch(hex_color: string): string {
    return `xpath///*[contains(@class, "color-swatch-label") and @data-swatch-color="${hex_color}"]`;
}

function get_xpath_left_sidebar_folder(folder_name: string): string {
    return `xpath///*[contains(@class, "left-sidebar-title") and normalize-space(text())="${folder_name}"]`;
}

function get_xpath_left_sidebar_unmuted_channel(channel_name: string): string {
    return get_xpath_left_sidebar_channel(channel_name) + `[not(contains(@class, "out_of_home_view"))]`;
}

function get_xpath_stream_row(channel_name: string): string {
    return `xpath///*[contains(@class, "stream-row") and @data-stream-name="${channel_name}"]`;
}

function get_xpath_left_sidebar_new_topic_btn(channel_name: string): string {
    return `xpath///*[@id="left_sidebar_scroll_container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]` +
        `//div[contains(@class, "channel-new-topic-button")]`;
}

function get_xpath_left_sidebar_topic(channel_name: string, topic_name: string): string {
    return `xpath///*[@id="left_sidebar_scroll_container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]` +
        `//ul[contains(@class, "topic-list")]` +
        `//li[contains(@class, "topic-list-item") and @data-topic-name="${topic_name}"]//a`;
}

function get_xpath_left_sidebar_ellipsis(channel_name: string): string {
    return `xpath///*[@id="left_sidebar_scroll_container"]` +
        `//li[.//span[contains(@class, "stream-name") and text()="${channel_name}"]]` +
        `//span[contains(@class, "stream-sidebar-menu-icon")]`;
}

function get_xpath_left_sidebar_lock_icon(channel_name: string): string {
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
    return `xpath///*[contains(@class, "stream-row") and @data-stream-name="${channel_name}"]` +
        `//div[contains(@class, "sub_unsub_button") and not(contains(@class, "checked"))]`;
}

function get_xpath_subscribed_checkmark(channel_name: string): string {
    return `xpath///*[contains(@class, "stream-row") and @data-stream-name="${channel_name}"]` +
        `//div[contains(@class, "sub_unsub_button") and contains(@class, "checked")]`;
}

function get_xpath_typeahead_item(name: string): string {
    return `xpath///*[contains(@class, "typeahead") and not(contains(@style, "display: none"))]` +
        `//li[contains(normalize-space(), "${name}")]//a`;
}

function get_xpath_subscriber_row(subscriber_name: string): string {
    return `xpath///*[@id="stream_members_list"]` +
        `//tbody[contains(@class, "subscriber_table")]` +
        `//tr[.//text()[contains(., "${subscriber_name}")]]`;
}

function get_xpath_remove_subscriber_btn(subscriber_name: string): string {
    return get_xpath_subscriber_row(subscriber_name) +
        `//button[contains(@class, "remove-subscriber-button")]`;
}

await common.run_test(channels_tests);
