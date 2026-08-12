import { Hono } from "@hono/hono";
import { html } from "@hono/hono/html";
import { Bot, InlineKeyboard, webhookAdapters } from "grammy";

const bot = new Bot(Deno.env.get("BOT_TOKEN") ?? "");
await bot.init();
const url = Deno.env.get("BOT_ENDPOINT") ??
  (await bot.api.getWebhookInfo()).url;

bot.on("message", async (ctx) => {
  await ctx.sendMessage("reply", {
    reply_markup: new InlineKeyboard().webApp("edit", url),
  });
});

const app = new Hono();

app.get("/", (ctx) =>
  ctx.html(html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
            ${bot.me.first_name}
          </body>
    </html>
  `));

app.post("/", webhookAdapters.hono(bot));

Deno.serve(app.fetch);
