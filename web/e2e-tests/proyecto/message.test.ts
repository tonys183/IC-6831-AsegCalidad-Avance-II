import assert from "node:assert/strict";
import type {Page} from "puppeteer";
import * as common from "../lib/common.ts";

const test_data = {
    RECIPIENT_NAME: "Desdemona",
    SIMPLE_MESSAGE: "Mensaje de prueba.",
    SPECIAL_CHARS_MESSAGE: "Probando con: !ªº¨ˆáéíóú?¿¡≥≤ ; : ñç*+$#&~'\"",
    BOLD_MESSAGE: "Mensaje de prueba en negrita.",
    ITALIC_MESSAGE: "Mensaje de prueba en itálica.",
    ORDERED_LIST_MESSAGE: "1. Prueba 1\n2. Prueba 2\n3. Prueba 3",
    BULLET_LIST_MESSAGE: "* Prueba 1\n* Prueba 2\n* Prueba 3",
    LONG_MESSAGE: `Mensaje largo de prueba. ${"Zulip permite enviar mensajes extensos para validar el comportamiento del cuadro de redacción y del historial de conversación. ".repeat(12)}`,
    VALID_LINK_MESSAGE: "Visitar https://zulip.com",
    INVALID_LINK_MESSAGE: "Visitar htp:/zulip..com",
    QUOTE_MESSAGE: "```quote\nEste es un texto citado.\n```",
    CODE_BLOCK_MESSAGE: "```python\nprint(\"Hola mundo\")\n```",
    INCOMPLETE_CODE_BLOCK_MESSAGE: "```python\nprint(Hola mundo)\n`",
    VALID_MATH_MESSAGE: "```math\n\\sqrt{25}=5\n```",
    INVALID_MATH_MESSAGE: "```math\n{\\sqrt{25}=5 }\n`",
    EMOJI_MESSAGE: "Mensaje con emoji :smiley:",
};

const selectors = {
    INPUT_DIRECT_MESSAGE_RECIPIENT: "#private_message_recipient",
    COMPOSE_TEXTAREA: "#compose-textarea",
    BTN_SEND_MESSAGE: "#compose-send-button",

    MESSAGE_CONTENT: ".message_content.rendered_markdown",

    BOLD_TEXT: "strong",
    ITALIC_TEXT: "em",
    ORDERED_LIST_ITEM: "ol li",
    BULLET_LIST_ITEM: "ul li",
    LINK: "a[href]",
    QUOTE: "blockquote",

    CODE_BLOCK: "pre code, .codehilite code, .codehilite",
    ERROR_TOKEN: "pre code .err, .codehilite .err",

    MATH: ".katex",
    MATH_OR_ERROR: ".katex, .katex-error, .tex-error",
    MATH_ERROR: ".katex-error, .tex-error",
};

const messages = {
    MESSAGE_NOT_VISIBLE: (content: string) => `The message must be visible in the last rendered message: ${content}`,
    MESSAGE_SHOULD_NOT_SEND: "The empty or blank message should not be sent.",
    EXPECTED_FORMAT: (format: string) => `The last message must be rendered with ${format} format.`,
    EXPECTED_PLAIN_TEXT: (content: string) => `The last message must be rendered as plain text and not as a link: ${content}`,
};

type MessageTestCase = {
    name: string;
    test_function: (page: Page) => Promise<void>;
};

type MessageTestResult = {
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

function normalize_text(text: string): string {
    return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function assert_body_equals(actual: string, expected: string): void {
    assert.strictEqual(
        normalize_text(actual),
        normalize_text(expected),
        messages.MESSAGE_NOT_VISIBLE(expected),
    );
}

async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function clear_text_box(page: Page): Promise<void> {
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
}

async function open_direct_message(page: Page): Promise<void> {
    await page.waitForSelector("body", {visible: true});

    await page.keyboard.press("Escape");
    await sleep(300);

    await page.evaluate(() => {
        const active_element = document.activeElement as HTMLElement | null;
        active_element?.blur();
    });

    await page.keyboard.press("x");

    await page.waitForSelector(selectors.INPUT_DIRECT_MESSAGE_RECIPIENT, {
        visible: true,
        timeout: 10000,
    });

    await page.click(selectors.INPUT_DIRECT_MESSAGE_RECIPIENT);
    await clear_text_box(page);

    await page.type(selectors.INPUT_DIRECT_MESSAGE_RECIPIENT, test_data.RECIPIENT_NAME);
    await page.keyboard.press("Enter");

    await page.waitForSelector(selectors.COMPOSE_TEXTAREA, {
        visible: true,
        timeout: 10000,
    });

    await page.click(selectors.COMPOSE_TEXTAREA);
}

async function run_message_test(page: Page, test_function: (page: Page) => Promise<void>): Promise<void> {
    await open_direct_message(page);
    await test_function(page);
}

async function count_messages(page: Page): Promise<number> {
    return await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
    }, selectors.MESSAGE_CONTENT);
}

async function type_compose_message(page: Page, content: string): Promise<void> {
    await page.waitForSelector(selectors.COMPOSE_TEXTAREA, {
        visible: true,
        timeout: 10000,
    });

    await page.click(selectors.COMPOSE_TEXTAREA);
    await clear_text_box(page);

    if (content.length === 0) {
        return;
    }

    await page.evaluate(
        (selector, value) => {
            const element = document.querySelector(selector) as HTMLTextAreaElement | null;

            if (element !== null) {
                element.value = value;
                element.dispatchEvent(new Event("input", {bubbles: true}));
                element.dispatchEvent(new Event("change", {bubbles: true}));
            }
        },
        selectors.COMPOSE_TEXTAREA,
        content,
    );

    await page.type(selectors.COMPOSE_TEXTAREA, " ");
    await page.keyboard.press("Backspace");
}

async function wait_until_message_is_sent(page: Page, previous_count: number, expected_text: string): Promise<void> {
    await page.waitForFunction(
        (selector, old_count, expected) => {
            const messages_list = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

            if (messages_list.length <= old_count) {
                return false;
            }

            const last_message = messages_list.at(-1);

            if (last_message === undefined) {
                return false;
            }

            const text = last_message.innerText ?? last_message.textContent ?? "";
            return text.includes(expected);
        },
        {timeout: 15000},
        selectors.MESSAGE_CONTENT,
        previous_count,
        expected_text,
    );
}

async function send_compose_message(page: Page, content: string, expected_text_after_send: string): Promise<void> {
    const message_count_before = await count_messages(page);

    await type_compose_message(page, content);
    await page.click(selectors.BTN_SEND_MESSAGE);

    await wait_until_message_is_sent(page, message_count_before, expected_text_after_send);
}

async function send_invalid_message(page: Page, content: string): Promise<boolean> {
    const message_count_before = await count_messages(page);

    await type_compose_message(page, content);
    await page.click(selectors.BTN_SEND_MESSAGE);

    await sleep(700);

    const message_count_after = await count_messages(page);
    return message_count_after === message_count_before;
}

async function get_body_content(page: Page): Promise<string> {
    await page.waitForSelector(selectors.MESSAGE_CONTENT, {
        visible: true,
        timeout: 10000,
    });

    return await page.evaluate((selector) => {
        const messages_list = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
        const last_message = messages_list.at(-1);

        if (last_message === undefined) {
            return "";
        }

        return last_message.innerText?.trim() ?? last_message.textContent?.trim() ?? "";
    }, selectors.MESSAGE_CONTENT);
}

async function has_element(page: Page, inner_selector: string): Promise<boolean> {
    await page.waitForSelector(selectors.MESSAGE_CONTENT, {
        visible: true,
        timeout: 10000,
    });

    return await page.evaluate(
        (message_selector, selector) => {
            const messages_list = Array.from(document.querySelectorAll(message_selector));
            const last_message = messages_list.at(-1);

            if (last_message === undefined) {
                return false;
            }

            return last_message.querySelector(selector) !== null;
        },
        selectors.MESSAGE_CONTENT,
        inner_selector,
    );
}

async function wait_until_last_message_has_element(page: Page, inner_selector: string): Promise<void> {
    await page.waitForFunction(
        (message_selector, selector) => {
            const messages_list = Array.from(document.querySelectorAll(message_selector));
            const last_message = messages_list.at(-1);

            if (last_message === undefined) {
                return false;
            }

            return last_message.querySelector(selector) !== null;
        },
        {timeout: 10000},
        selectors.MESSAGE_CONTENT,
        inner_selector,
    );
}

async function contains_text(
    page: Page,
    inner_selector: string,
    expected_text: string,
): Promise<boolean> {
    await page.waitForSelector(selectors.MESSAGE_CONTENT, {
        visible: true,
        timeout: 10000,
    });

    return await page.evaluate(
        (message_selector, selector, text) => {
            const messages_list = Array.from(document.querySelectorAll(message_selector));
            const last_message = messages_list.at(-1);

            if (last_message === undefined) {
                return false;
            }

            return Array.from(last_message.querySelectorAll(selector)).some((element) =>
                element.textContent?.includes(text),
            );
        },
        selectors.MESSAGE_CONTENT,
        inner_selector,
        expected_text,
    );
}

async function contains_all_text(
    page: Page,
    inner_selector: string,
    expected_texts: string[],
): Promise<boolean> {
    await page.waitForSelector(selectors.MESSAGE_CONTENT, {
        visible: true,
        timeout: 10000,
    });

    return await page.evaluate(
        (message_selector, selector, texts) => {
            const messages_list = Array.from(document.querySelectorAll(message_selector));
            const last_message = messages_list.at(-1);

            if (last_message === undefined) {
                return false;
            }

            const elements_text = Array.from(last_message.querySelectorAll(selector))
                .map((element) => element.textContent ?? "")
                .join(" ");

            return texts.every((text) => elements_text.includes(text));
        },
        selectors.MESSAGE_CONTENT,
        inner_selector,
        expected_texts,
    );
}

async function test_msg_001_send_simple_text_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.SIMPLE_MESSAGE, test_data.SIMPLE_MESSAGE);

    const body_content = await get_body_content(page);
    assert_body_equals(body_content, test_data.SIMPLE_MESSAGE);
}

async function test_msg_002_send_special_characters_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.SPECIAL_CHARS_MESSAGE, test_data.SPECIAL_CHARS_MESSAGE);

    const body_content = await get_body_content(page);
    assert_body_equals(body_content, test_data.SPECIAL_CHARS_MESSAGE);
}

async function test_msg_003_send_bold_message(page: Page): Promise<void> {
    await send_compose_message(page, `**${test_data.BOLD_MESSAGE}**`, test_data.BOLD_MESSAGE);

    const bold_exists = await contains_text(
        page,
        selectors.BOLD_TEXT,
        test_data.BOLD_MESSAGE,
    );

    assert.ok(bold_exists, messages.EXPECTED_FORMAT("bold"));
}

async function test_msg_004_send_italic_message(page: Page): Promise<void> {
    await send_compose_message(page, `*${test_data.ITALIC_MESSAGE}*`, test_data.ITALIC_MESSAGE);

    const italic_exists = await contains_text(
        page,
        selectors.ITALIC_TEXT,
        test_data.ITALIC_MESSAGE,
    );

    assert.ok(italic_exists, messages.EXPECTED_FORMAT("italic"));
}

async function test_msg_005_reject_empty_message(page: Page): Promise<void> {
    const rejected = await send_invalid_message(page, "");

    assert.ok(rejected, messages.MESSAGE_SHOULD_NOT_SEND);
}

async function test_msg_006_reject_blank_message(page: Page): Promise<void> {
    const rejected = await send_invalid_message(page, "\n\t    \n");

    assert.ok(rejected, messages.MESSAGE_SHOULD_NOT_SEND);
}

async function test_msg_008_send_ordered_list_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.ORDERED_LIST_MESSAGE, "Prueba 1");

    const ordered_list_exists = await contains_all_text(
        page,
        selectors.ORDERED_LIST_ITEM,
        ["Prueba 1", "Prueba 2", "Prueba 3"],
    );

    assert.ok(ordered_list_exists, messages.EXPECTED_FORMAT("ordered list"));
}

async function test_msg_009_send_bullet_list_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.BULLET_LIST_MESSAGE, "Prueba 1");

    const bullet_list_exists = await contains_all_text(
        page,
        selectors.BULLET_LIST_ITEM,
        ["Prueba 1", "Prueba 2", "Prueba 3"],
    );

    assert.ok(bullet_list_exists, messages.EXPECTED_FORMAT("bullet list"));
}

async function test_msg_010_send_long_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.LONG_MESSAGE, "Mensaje largo de prueba.");

    const body_content = await get_body_content(page);

    assert.ok(
        normalize_text(body_content).includes("Mensaje largo de prueba."),
        messages.MESSAGE_NOT_VISIBLE(test_data.LONG_MESSAGE),
    );
}

async function test_msg_011_send_valid_link_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.VALID_LINK_MESSAGE, "https://zulip.com");

    const link_exists = await contains_text(
        page,
        selectors.LINK,
        "https://zulip.com",
    );

    assert.ok(link_exists, messages.EXPECTED_FORMAT("valid link"));
}

async function test_msg_012_send_invalid_link_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.INVALID_LINK_MESSAGE, test_data.INVALID_LINK_MESSAGE);

    const invalid_link_exists = await contains_text(
        page,
        selectors.LINK,
        "htp:/zulip..com",
    );

    assert.ok(!invalid_link_exists, messages.EXPECTED_PLAIN_TEXT(test_data.INVALID_LINK_MESSAGE));
}

async function test_msg_013_send_quote_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.QUOTE_MESSAGE, "Este es un texto citado.");

    const quote_exists = await contains_text(
        page,
        selectors.QUOTE,
        "Este es un texto citado.",
    );

    assert.ok(quote_exists, messages.EXPECTED_FORMAT("quote"));
}

async function test_msg_014_send_code_block_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.CODE_BLOCK_MESSAGE, "print");

    const code_block_exists = await contains_text(
        page,
        selectors.CODE_BLOCK,
        "print",
    );

    
    assert.ok(
        code_block_exists,
        messages.EXPECTED_FORMAT("python code block"),
    );
}

async function test_msg_015_send_incomplete_code_block_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.INCOMPLETE_CODE_BLOCK_MESSAGE, "print");

    const code_block_exists = await contains_text(
        page,
        selectors.CODE_BLOCK,
        "print",
    );

    await wait_until_last_message_has_element(page, selectors.ERROR_TOKEN);

    assert.ok(
        code_block_exists,
        messages.EXPECTED_FORMAT("incomplete python code block with error token"),
    );
}


async function test_msg_016_send_valid_math_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.VALID_MATH_MESSAGE, "25");

    const math_exists = await contains_text(
        page,
        selectors.MATH,
        "25",
    );

    assert.ok(math_exists, messages.EXPECTED_FORMAT("valid math"));
}

async function test_msg_017_send_invalid_math_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.INVALID_MATH_MESSAGE, "25");

    const math_or_error_exists = await contains_text(
        page,
        selectors.MATH_OR_ERROR,
        "25",
    );

    assert.ok(
        math_or_error_exists,
        messages.EXPECTED_FORMAT("incomplete math rendered as math or math error"),
    );

    await wait_until_last_message_has_element(page, selectors.MATH_ERROR);

    const math_error_exists = await has_element(page, selectors.MATH_ERROR);

    assert.ok(
        math_error_exists,
        messages.EXPECTED_FORMAT("incomplete math with error token"),
    );
}

async function test_msg_018_send_emoji_message(page: Page): Promise<void> {
    await send_compose_message(page, test_data.EMOJI_MESSAGE, "Mensaje con emoji");

    const emoji_exists = await has_element(
        page,
        "span.emoji[role='img'][aria-label='smiley'], span.emoji[role='img'][title='smiley']",
    );

    assert.ok(emoji_exists, messages.EXPECTED_FORMAT("emoji"));
}

async function run_test_case(
    original_page: Page,
    home_url: string,
    test_name: string,
    test_function: (page: Page) => Promise<void>,
): Promise<void> {
    const browser = original_page.browser();
    const test_page = await browser.newPage();

    try {
        await test_page.goto(home_url, {
            waitUntil: "domcontentloaded",
        });

        await test_page.waitForSelector("body", {
            visible: true,
            timeout: 10000,
        });

        await run_message_test(test_page, test_function);
    } catch (error) {
        console.error(`Test ${test_name} has failed with error: ${format_error(error)}`);
        throw error;
    } finally {
        if (!test_page.isClosed()) {
            await test_page.close();
        }
    }
}

async function message_tests(page: Page): Promise<void> {
    await common.log_in(page);

    const home_url = page.url();

    const test_cases: MessageTestCase[] = [
        {name: "MSG-001", test_function: test_msg_001_send_simple_text_message},
        {name: "MSG-002", test_function: test_msg_002_send_special_characters_message},
        {name: "MSG-003", test_function: test_msg_003_send_bold_message},
        {name: "MSG-004", test_function: test_msg_004_send_italic_message},
        {name: "MSG-005", test_function: test_msg_005_reject_empty_message},
        {name: "MSG-006", test_function: test_msg_006_reject_blank_message},
        {name: "MSG-008", test_function: test_msg_008_send_ordered_list_message},
        {name: "MSG-009", test_function: test_msg_009_send_bullet_list_message},
        {name: "MSG-010", test_function: test_msg_010_send_long_message},
        {name: "MSG-011", test_function: test_msg_011_send_valid_link_message},
        {name: "MSG-012", test_function: test_msg_012_send_invalid_link_message},
        {name: "MSG-013", test_function: test_msg_013_send_quote_message},
        {name: "MSG-014", test_function: test_msg_014_send_code_block_message},
        {name: "MSG-015", test_function: test_msg_015_send_incomplete_code_block_message},
        {name: "MSG-016", test_function: test_msg_016_send_valid_math_message},
        {name: "MSG-017", test_function: test_msg_017_send_invalid_math_message},
        {name: "MSG-018", test_function: test_msg_018_send_emoji_message},
    ];

    const results: MessageTestResult[] = [];

    for (const test_case of test_cases) {
        try {
            await run_test_case(
                page,
                home_url,
                test_case.name,
                test_case.test_function,
            );

            results.push({name: test_case.name, passed: true});
            console.log(`Test ${test_case.name} has passed`);
        } catch (error) {
            results.push({name: test_case.name, passed: false, error});
            console.error(`Continuing after failure in test ${test_case.name}`);
        }
    }

    const passed_results = results.filter((result) => result.passed);
    const failed_results = results.filter((result) => !result.passed);

    console.log("\nTest Summary");
    console.log(`Passed (${passed_results.length}): ${passed_results.map((result) => result.name).join(", ") || "none"}`);
    console.log(`Failed (${failed_results.length}): ${failed_results.map((result) => result.name).join(", ") || "none"}`);

    for (const failed_result of failed_results) {
        console.error(`\n${failed_result.name}: ${format_error(failed_result.error)}`);
    }

    assert.strictEqual(
        failed_results.length,
        0,
        `Failed: (${failed_results.length}): ${failed_results.map((result) => result.name).join(", ")}`,
    );
}


await common.run_test(message_tests);