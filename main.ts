import { Hono } from "@hono/hono";
import { Bot, InlineKeyboard, webhookAdapters } from "grammy";
import { isUuid, loadText, saveText } from "./kv.ts";
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

  await saveText(id, msg.chat.id, msg.message_id, html);
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

app.post("/", webhookAdapters.hono(bot));

Deno.serve(app.fetch);
