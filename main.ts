import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import {
  Bot,
  type CommandContext,
  type Context,
  InlineKeyboard,
  type SendData,
  webhookAdapters,
} from "grammy";
import {
  type Format,
  isUuid,
  loadDraft,
  loadMessageIdentifiers,
  saveDraft,
  saveMessageIdentifiers,
} from "./kv.ts";
import { MAX_TEXT_LENGTH } from "./limits.ts";
import { renderMiniApp } from "./mini_app.ts";

const EDIT_BUTTON = "edit";
export const DEFAULT_HTML = `<h1>New HTML message</h1>

<p>Edit me!</p>`;

export const DEFAULT_MARKDOWN = `# New Markdown message

Edit me!`;

export const DEFAULT_BLOCKS = JSON.stringify(
  [
    {
      type: "heading",
      text: "New Blocks message",
      size: 1,
    },
    {
      type: "paragraph",
      text: "Edit me!",
    },
  ],
  null,
  2,
);

const token = Deno.env.get("BOT_TOKEN");
const bot = new Bot(token ?? "");
await bot.init();
const url = Deno.env.get("BOT_ENDPOINT") ??
  (await bot.api.getWebhookInfo()).url;

const HELP_TEXT = "Create a message with /html, /markdown, or /blocks.";
const ABOUT_TEXT: SendData = {
  text: `By @KnorpelSenf

Proudly powered by grammy.dev

Source code: https://github.com/KnorpelSenf/liverichpreviewbot`,
  link_preview_options: { is_disabled: true },
};

bot.command(["start", "help"], (ctx) => ctx.sendMessage(HELP_TEXT));
bot.command("html", (ctx) => sendEditor(ctx, "html", DEFAULT_HTML));
bot.command(
  ["markdown", "md"],
  (ctx) => sendEditor(ctx, "markdown", DEFAULT_MARKDOWN),
);
bot.command("blocks", (ctx) => sendEditor(ctx, "blocks", DEFAULT_BLOCKS));
bot.command("about", (ctx) => ctx.send(ABOUT_TEXT));
bot.on(":file", async (ctx) => {
  const m = ctx.msg;
  const fileId =
    (m.photo !== undefined ? m.photo[m.photo.length - 1] : m.animation ??
      m.audio ??
      m.document ??
      m.video ??
      m.video_note ??
      m.voice ??
      m.sticker)?.file_id;
  await ctx.sendMessage(`This file has file_id ${fileId} for me.`, {
    entities: [{ type: "code", offset: 22, length: fileId.length }],
  });
});
bot.on("message", (ctx) => ctx.sendMessage("Send /help for instructions."));

async function sendEditor(
  ctx: CommandContext<Context>,
  format: Format,
  content: string,
): Promise<void> {
  const id = crypto.randomUUID();

  const richMessage = createRichMessage(format, content);
  if (typeof richMessage === "string") throw new Error("cannot happen");
  // create message in database before letting anyone edit it
  const msg = await ctx.sendRichMessage(richMessage);

  await saveMessageIdentifiers(format, id, msg.chat.id, msg.message_id);
  await ctx.api.editMessageReplyMarkup(
    msg.chat.id,
    msg.message_id,
    createEditorKeyboard(format, id),
  );
}

function createEditorKeyboard(format: Format, id: string): InlineKeyboard {
  const miniAppUrl = new URL(url);
  miniAppUrl.searchParams.set("id", id);
  miniAppUrl.searchParams.set("format", format);
  return new InlineKeyboard().webApp(EDIT_BUTTON, miniAppUrl.toString());
}

const app = new Hono();
app.use(logger());

app.get("/", (ctx) => ctx.html(renderMiniApp()));

registerFormatApi("html", DEFAULT_HTML);
registerFormatApi("markdown", DEFAULT_MARKDOWN);
registerFormatApi("blocks", DEFAULT_BLOCKS);

function registerFormatApi(format: Format, defaultContent: string): void {
  const endpoint = `/api/${format}`;
  const displayName = format === "html"
    ? "HTML"
    : format === "markdown"
    ? "Markdown"
    : "blocks JSON";

  app.post(endpoint, async (ctx) => {
    const body = await readJsonObject(ctx.req.raw);
    if (body === null) {
      return ctx.json({ error: "Expected a JSON request body." }, 400);
    }
    if (typeof body.id !== "string" || !isUuid(body.id)) {
      return ctx.json({ error: "Expected a valid UUID." }, 400);
    }

    const [identifiers, draft] = await Promise.all([
      loadMessageIdentifiers(format, body.id),
      loadDraft(format, body.id),
    ]);
    if (identifiers === null) {
      return ctx.json({ error: "Message not found." }, 404);
    }

    ctx.header("Cache-Control", "no-store");
    return ctx.json({ [format]: draft ?? defaultContent });
  });

  app.put(endpoint, async (ctx) => {
    const body = await readJsonObject(ctx.req.raw);
    if (body === null) {
      return ctx.json({ error: "Expected a JSON request body." }, 400);
    }

    const content = body[format];
    if (
      typeof body.id !== "string" || !isUuid(body.id) ||
      typeof content !== "string"
    ) {
      return ctx.json(
        { error: `Expected a valid UUID and ${displayName}.` },
        400,
      );
    }
    if (content.length > MAX_TEXT_LENGTH) {
      return ctx.json(
        {
          error: `${displayName} cannot exceed ${MAX_TEXT_LENGTH} characters.`,
        },
        413,
      );
    }

    const identifiers = await loadMessageIdentifiers(format, body.id);
    if (identifiers === null) {
      return ctx.json({ error: "Message not found." }, 404);
    }

    const richMessage = createRichMessage(format, content);
    await saveDraft(format, body.id, content);
    try {
      await bot.api.editMessageText(
        identifiers.chatId,
        identifiers.messageId,
        richMessage,
        { reply_markup: createEditorKeyboard(format, body.id) },
      );
    } catch (err) {
      console.error(err);
    }

    return ctx.body(null, 204);
  });
}

function createRichMessage(format: Format, content: string) {
  if (format === "html") return { html: content };
  if (format === "markdown") return { markdown: content };

  const blocks = JSON.parse(content);
  if (!Array.isArray(blocks)) {
    return "Blocks must be a JSON array";
  }
  return { blocks };
}

async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

app.post(
  "/",
  webhookAdapters.hono(bot, { secretToken: token?.replaceAll(":", "_") }),
);

Deno.serve(app.fetch);
