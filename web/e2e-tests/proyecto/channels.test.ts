import assert from "node:assert/strict";

import type { Page } from "puppeteer";

import * as common from "../lib/common.ts";

const test_data = {
    PUBLIC_CHANNEL_NAME: "TEC",
    PUBLIC_CHANNEL_DESC: "Channel created for CHN-001 test",
    PRIVATE_CHANNEL_NAME: "TEC Notas",
    PRIVATE_CHANNEL_DESC: "Channel created for CHN-002 test"
};

const selectors = {
    BTN_ADD_NEW_CHANNEL: "#add_new_subscription .create_stream_button",
    FORM_STREAM_CREATION: "form#stream_creation_form",
    BTN_CONTINUE_TO_SUBSCRIBERS: "form#stream_creation_form button#stream_creation_go_to_subscribers",
    CONTAINER_CREATE_SUBSCRIBERS: "#create_stream_subscribers",
    BTN_FINALIZE_CREATION: "form#stream_creation_form .finalize_create_stream",
    OVERLAY_SUBSCRIPTION: "#subscription_overlay",
    WIDGET_PRIVACY_DROPDOWN: "#new_channel_privacy_widget",
    CONTAINER_DROPDOWN_LIST: ".dropdown-list-container",
    XPATH_OPTION_PRIVATE: `xpath///*[contains(@class, "dropdown-list-container")]//*[contains(@class, "list-item")]//*[contains(text(), "Private")]`,

    GET_XPATH_CHANNEL_TITLE: (channel_name: string) => `xpath///*[${common.has_class_x("message-header-navbar-title")} and text()="${channel_name}"]`,
    GET_CSS_SIDEBAR_CHANNEL: (channel_name: string) => `.stream-row[data-stream-name="${channel_name}"]`,
    GET_CSS_SIDEBAR_LOCK_ICON: (channel_name: string) => `.stream-row[data-stream-name="${channel_name}"] .zulip-icon-lock`
};

const messages = {
    STREAM_VISIBLE_IN_SIDEBAR: (channel_name: string) => `Stream ${channel_name} must be visible in the left panel`,
    STREAM_HAS_PRIVATE_LOCK: (channel_name: string) => `Stream ${channel_name} must have a private lock icon`
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
    await page.waitForSelector(selectors.GET_XPATH_CHANNEL_TITLE(test_data.PUBLIC_CHANNEL_NAME), { visible: true });

    const stream_in_sidebar = await page.$(selectors.GET_CSS_SIDEBAR_CHANNEL(test_data.PUBLIC_CHANNEL_NAME));
    assert.ok(stream_in_sidebar !== null, messages.STREAM_VISIBLE_IN_SIDEBAR(test_data.PUBLIC_CHANNEL_NAME));
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
    const private_option = await page.waitForSelector(selectors.XPATH_OPTION_PRIVATE, { visible: true });

    assert.ok(private_option !== null);
    await private_option.click();

    await page.click(selectors.BTN_CONTINUE_TO_SUBSCRIBERS);
    await page.waitForSelector(selectors.CONTAINER_CREATE_SUBSCRIBERS, { visible: true });
    await page.click(selectors.BTN_FINALIZE_CREATION);

    await page.waitForSelector(selectors.OVERLAY_SUBSCRIPTION, { hidden: true });
    await page.waitForSelector(selectors.GET_XPATH_CHANNEL_TITLE(test_data.PRIVATE_CHANNEL_NAME), { visible: true });

    const stream_in_sidebar = await page.$(selectors.GET_CSS_SIDEBAR_CHANNEL(test_data.PRIVATE_CHANNEL_NAME));
    assert.ok(stream_in_sidebar !== null, messages.STREAM_VISIBLE_IN_SIDEBAR(test_data.PRIVATE_CHANNEL_NAME));

    const lock_icon = await page.$(selectors.GET_CSS_SIDEBAR_LOCK_ICON(test_data.PRIVATE_CHANNEL_NAME));
    assert.ok(lock_icon !== null, messages.STREAM_HAS_PRIVATE_LOCK(test_data.PRIVATE_CHANNEL_NAME));
}

async function channels_tests(page: Page): Promise<void> {
    // test CHN-001
    await common.log_in(page);
    await common.open_streams_modal(page);
    await create_new_public_channel(page);

    // test CHN-002
    await common.open_streams_modal(page);
    await create_new_private_channel(page);
}

await common.run_test(channels_tests);
