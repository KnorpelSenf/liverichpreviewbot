import { Hono } from "@hono/hono";
import { Bot, InlineKeyboard, webhookAdapters } from "grammy";
import { renderMiniApp } from "./mini_app.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") ?? "");
await bot.init();
const url = Deno.env.get("BOT_ENDPOINT") ??
  (await bot.api.getWebhookInfo()).url;

bot.on("message", async (ctx) => {
  const msg = await ctx.sendMessage("reply", {
    reply_markup: new InlineKeyboard().webApp("edit", url),
  });
  console.log("sent to", msg.chat.id, msg.message_id);
});

const app = new Hono();

app.get("/", (ctx) => ctx.html(renderMiniApp(bot.me.first_name)));

app.post("/", webhookAdapters.hono(bot));

Deno.serve(app.fetch);
