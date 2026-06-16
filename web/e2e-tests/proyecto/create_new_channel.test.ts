import assert from "node:assert/strict";

import type { Page } from "puppeteer";

import * as common from "../lib/common.ts";

async function create_new_channel(page: Page): Promise<void> {
    await page.click("#add_new_subscription .create_stream_button");
    await page.waitForSelector("form#stream_creation_form", { visible: true });
    await common.fill_form(page, "form#stream_creation_form", {
        stream_name: "TEC",
        stream_description: "Channel created for CHN-001 test",
    });
    await page.click("form#stream_creation_form button#stream_creation_go_to_subscribers");
    await page.waitForSelector("#create_stream_subscribers", { visible: true });
    await page.click("form#stream_creation_form .finalize_create_stream");
    await page.waitForSelector("#subscription_overlay", { hidden: true });
    await page.waitForSelector(
        `xpath///*[${common.has_class_x("message-header-navbar-title")} and text()="TEC"]`,
        { visible: true }
    );
    const stream_in_sidebar = await page.$(`.stream-row[data-stream-name="TEC"]`);
    assert.ok(stream_in_sidebar !== null, "Stream TEC must be visible in the left panel");
}

async function test_chn_001(page: Page): Promise<void> {
    await common.log_in(page);
    await common.open_streams_modal(page);
    await create_new_channel(page);
}

await common.run_test(test_chn_001);
