import { Bot, webhookAdapters } from "grammy";

const bot = new Bot(Deno.env.get("BOT_TOKEN") ?? "");

bot.on("message", (ctx) => ctx.send("reply"));

Deno.serve(webhookAdapters.stdHttp(bot));
