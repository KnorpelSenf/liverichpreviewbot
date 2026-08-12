import { Hono } from "@hono/hono";
import { Bot, InlineKeyboard, webhookAdapters } from "grammy";
import {
  isUuid,
  loadMessageIdentifiers,
  loadText,
  saveMessageIdentifiers,
  saveText,
} from "./kv.ts";
import { renderMiniApp } from "./mini_app.ts";

export const DEFAULT_TEXT = `<h1>New HTML message</h1>

<p>Edit me!</p>`;

const bot = new Bot(Deno.env.get("BOT_TOKEN") ?? "");
await bot.init();
const url = Deno.env.get("BOT_ENDPOINT") ??
  (await bot.api.getWebhookInfo()).url;

bot.on("message:text", async (ctx) => {
  const html = DEFAULT_TEXT;
  const id = crypto.randomUUID();
  const miniAppUrl = new URL(url);
  miniAppUrl.searchParams.set("id", id);

  const msg = await ctx.sendRichMessage({ html }, {
    reply_markup: new InlineKeyboard().webApp("edit", miniAppUrl.toString()),
  });

  await Promise.all([
    saveMessageIdentifiers(id, msg.chat.id, msg.message_id),
    saveText(id, html),
  ]);
});

const app = new Hono();

app.get("/", (ctx) => ctx.html(renderMiniApp()));

app.post("/api/text", async (ctx) => {
  let body: unknown;

  try {
    body = await ctx.req.json();
  } catch {
    return ctx.json({ error: "Expected a JSON request body." }, 400);
  }

  if (
    typeof body !== "object" || body === null || !("id" in body) ||
    typeof body.id !== "string" || !isUuid(body.id)
  ) {
    return ctx.json({ error: "Expected a valid UUID." }, 400);
  }

  const text = await loadText(body.id);
  if (text === null) {
    return ctx.json({ error: "Text not found." }, 404);
  }

  ctx.header("Cache-Control", "no-store");
  return ctx.json({ text });
});

app.put("/api/text", async (ctx) => {
  let body: unknown;

  try {
    body = await ctx.req.json();
  } catch {
    return ctx.json({ error: "Expected a JSON request body." }, 400);
  }

  if (
    typeof body !== "object" || body === null || !("id" in body) ||
    typeof body.id !== "string" || !isUuid(body.id) || !("text" in body) ||
    typeof body.text !== "string"
  ) {
    return ctx.json({ error: "Expected a valid UUID and text." }, 400);
  }

  const identifiers = await loadMessageIdentifiers(body.id);
  if (identifiers === null) {
    return ctx.json({ error: "Message not found." }, 404);
  }

  await saveText(body.id, body.text);
  try {
    await bot.api.editMessageText(
      identifiers.chatId,
      identifiers.messageId,
      { html: body.text },
    );
  } catch (err) {
    console.error(err);
  }

  return ctx.body(null, 204);
});

app.post("/", webhookAdapters.hono(bot));

Deno.serve(app.fetch);
