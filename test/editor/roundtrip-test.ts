/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { MatrixEvent } from 'matrix-js-sdk/src/matrix';

import { parseEvent } from "../../src/editor/deserialize";
import EditorModel from '../../src/editor/model';
import DocumentOffset from '../../src/editor/offset';
import {htmlSerializeIfNeeded, textSerialize} from '../../src/editor/serialize';
import { createPartCreator } from "./mock";

function htmlMessage(formattedBody: string, msgtype = "m.text") {
    return {
        getContent() {
            return {
                msgtype,
                format: "org.matrix.custom.html",
                formatted_body: formattedBody,
            };
        },
    } as unknown as MatrixEvent;
}

function textMessage(body: string, msgtype = "m.text") {
    return {
        getContent() {
            return {
                msgtype,
                body,
            };
        },
    } as unknown as MatrixEvent;
}

async function roundTripMarkdown(markdown: string): Promise<string> {
    // Create a model of the markdown
    const pc = createPartCreator();
    const oldModel = new EditorModel([], pc, () => {});
    await oldModel.update(
        markdown,
        "insertText",
        new DocumentOffset(markdown.length, false),
    );

    // Render it to HTML or text
    const html = htmlSerializeIfNeeded(oldModel);
    const event = (
        html
            ? htmlMessage(html)
            : textMessage(textSerialize(oldModel))
    );
    console.log(html || textSerialize(oldModel));

    // Parse it into a new model
    let parts = parseEvent(event, pc);
    const newModel = new EditorModel(parts, pc);

    // Render it to markdown
    return textSerialize(newModel);
}


describe('editor/roundtrip', function() {
    describe('markdown messages should round-trip', function() {
        it('if they contain newlines', async function() {
            const markdown = "hello\nworld";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain newlines with trailing and leading whitespace', async function() {
            const markdown = "hello \n world";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain pills', async function() {
            const markdown = "text message for @room";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain pills with interesting characters in mxid', async function() {
            const markdown = "text message for @alice\\\\\\_\\]#>&:hs.example.com";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain styling', async function() {
            const markdown = "**bold** and _emphasised_";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain styling, but * becomes _', async function() {
            expect(await roundTripMarkdown("**bold** and *emphasised*"))
                .toEqual("**bold** and _emphasised_");
        });
        it('if they contain links', async function() {
            const markdown = "click [this](http://example.com/)!";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain quotations', async function() {
            const markdown = "saying\n\n> NO\n\nis valid";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it.skip('if they contain quotations without separating newlines', async function() {
            const markdown = "saying\n> NO\nis valid";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it.skip('if they contain quotations with trailing and leading whitespace', async function() {
            const markdown = "saying \n\n> NO\n\n is valid";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain inline code', async function() {
            const markdown = "there's no place `127.0.0.1` like";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain just a code block', async function() {
            const markdown = "```\nfoo(bar).baz();\n\n3\n```";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it.skip('if they contain just a code block followed by newlines', async function() {
            const markdown = "```\nfoo(bar).baz();\n\n3\n```\n\n";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it.skip('if they contain just code block surrounded by text', async function() {
            const markdown = "```A\nfoo(bar).baz();\n\n3\n```\nB";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        it('if they contain just code block followed by text after a blank line', async function() {
            const markdown = "```A\nfoo(bar).baz();\n\n3\n```\n\nB";
            expect(await roundTripMarkdown(markdown)).toEqual(markdown);
        });
        /*
        it('code block with no trailing text', function() {
            const html = "<pre><code>0xDEADBEEF\n</code></pre>\n";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(5);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "```" });
            expect(parts[1]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[2]).toStrictEqual({ type: "plain", text: "0xDEADBEEF" });
            expect(parts[3]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[4]).toStrictEqual({ type: "plain", text: "```" });
        });
        // failing likely because of https://github.com/vector-im/element-web/issues/10316
        xit('code block with no trailing text and no newlines', function() {
            const html = "<pre><code>0xDEADBEEF</code></pre>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(5);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "```" });
            expect(parts[1]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[2]).toStrictEqual({ type: "plain", text: "0xDEADBEEF" });
            expect(parts[3]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[4]).toStrictEqual({ type: "plain", text: "```" });
        });
        it('unordered lists', function() {
            const html = "<ul><li>Oak</li><li>Spruce</li><li>Birch</li></ul>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(5);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "- Oak" });
            expect(parts[1]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[2]).toStrictEqual({ type: "plain", text: "- Spruce" });
            expect(parts[3]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[4]).toStrictEqual({ type: "plain", text: "- Birch" });
        });
        it('ordered lists', function() {
            const html = "<ol><li>Start</li><li>Continue</li><li>Finish</li></ol>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(5);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "1. Start" });
            expect(parts[1]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[2]).toStrictEqual({ type: "plain", text: "2. Continue" });
            expect(parts[3]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[4]).toStrictEqual({ type: "plain", text: "3. Finish" });
        });
        it('nested unordered lists', () => {
            const html = "<ul><li>Oak<ul><li>Spruce<ul><li>Birch</li></ul></li></ul></li></ul>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(5);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "- Oak" });
            expect(parts[1]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[2]).toStrictEqual({ type: "plain", text: `${FOUR_SPACES}- Spruce` });
            expect(parts[3]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[4]).toStrictEqual({ type: "plain", text: `${FOUR_SPACES.repeat(2)}- Birch` });
        });
        it('nested ordered lists', () => {
            const html = "<ol><li>Oak<ol><li>Spruce<ol><li>Birch</li></ol></li></ol></li></ol>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(5);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "1. Oak" });
            expect(parts[1]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[2]).toStrictEqual({ type: "plain", text: `${FOUR_SPACES}1. Spruce` });
            expect(parts[3]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[4]).toStrictEqual({ type: "plain", text: `${FOUR_SPACES.repeat(2)}1. Birch` });
        });
        it('nested lists', () => {
            const html = "<ol><li>Oak\n<ol><li>Spruce\n<ol><li>Birch</li></ol></li></ol></li></ol>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(5);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "1. Oak\n" });
            expect(parts[1]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[2]).toStrictEqual({ type: "plain", text: `${FOUR_SPACES}1. Spruce\n` });
            expect(parts[3]).toStrictEqual({ type: "newline", text: "\n" });
            expect(parts[4]).toStrictEqual({ type: "plain", text: `${FOUR_SPACES.repeat(2)}1. Birch` });
        });
        it('mx-reply is stripped', function() {
            const html = "<mx-reply>foo</mx-reply>bar";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "bar" });
        });
        it('emote', function() {
            const html = "says <em>DON'T SHOUT</em>!";
            const parts = normalize(parseEvent(htmlMessage(html, "m.emote"), createPartCreator()));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({ type: "plain", text: "/me says _DON'T SHOUT_!" });
        });
        it('preserves nested quotes', () => {
            const html = "<blockquote>foo<blockquote>bar</blockquote></blockquote>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('surrounds lists with newlines', () => {
            const html = "foo<ul><li>bar</li></ul>baz";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('preserves nested formatting', () => {
            const html = "a<sub>b<em>c<strong>d<u>e</u></strong></em></sub>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('escapes backticks in code blocks', () => {
            const html = "<p><code>this → ` is a backtick</code></p>" +
                "<pre><code>and here are 3 of them:\n```</code></pre>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('escapes backticks outside of code blocks', () => {
            const html = "some `backticks`";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('escapes backslashes', () => {
            const html = "C:\\My Documents";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('escapes asterisks', () => {
            const html = "*hello*";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('escapes underscores', () => {
            const html = "__emphasis__";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('escapes square brackets', () => {
            const html = "[not an actual link](https://example.org)";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
        it('escapes angle brackets', () => {
            const html = "> \\<del>no formatting here\\</del>";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator()));
            expect(parts).toMatchSnapshot();
        });
    });
    describe('plaintext messages', function() {
        it('turns html tags back into markdown', function() {
            const html = "<strong>bold</strong> and <em>emphasized</em> text <a href=\"http://example.com/\">this</a>!";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "**bold** and _emphasized_ text [this](http://example.com/)!",
            });
        });
        it('keeps backticks unescaped', () => {
            const html = "this → ` is a backtick and here are 3 of them:\n```";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "this → ` is a backtick and here are 3 of them:\n```",
            });
        });
        it('keeps backticks outside of code blocks', () => {
            const html = "some `backticks`";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "some `backticks`",
            });
        });
        it('keeps backslashes', () => {
            const html = "C:\\My Documents";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "C:\\My Documents",
            });
        });
        it('keeps asterisks', () => {
            const html = "*hello*";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "*hello*",
            });
        });
        it('keeps underscores', () => {
            const html = "__emphasis__";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "__emphasis__",
            });
        });
        it('keeps square brackets', () => {
            const html = "[not an actual link](https://example.org)";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "[not an actual link](https://example.org)",
            });
        });
        it('escapes angle brackets', () => {
            const html = "> &lt;del&gt;no formatting here&lt;/del&gt;";
            const parts = normalize(parseEvent(htmlMessage(html), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "> <del>no formatting here</del>",
            });
        });
        it("it strips plaintext replies", () => {
            const body = "> Sender: foo\n\nMessage";
            const parts = normalize(parseEvent(textMessageReply(body), createPartCreator(), { shouldEscape: false }));
            expect(parts.length).toBe(1);
            expect(parts[0]).toStrictEqual({
                type: "plain",
                text: "Message",
            });
        });
    });*/
    });
});
