# Live Rich Preview Bot

A Telegram bot for creating and live-editing rich messages. It supports HTML,
Markdown, and blocks JSON, with drafts stored in Deno KV and edited through a
Telegram Mini App.

Use it here: [@liverichpreviewbot](https://telegram.me/liverichpreviewbot)

## Run locally

Install [Deno](https://deno.com/), create a Telegram bot, and set its token and
the public HTTPS endpoint used by the webhook and Mini App:

```sh
export BOT_TOKEN="your-bot-token"
export BOT_ENDPOINT="https://your-public-endpoint.example"
deno task dev
deno task setwh "$BOT_ENDPOINT"
```

In Telegram, use `/html`, `/markdown` (or `/md`), or `/blocks` to create an
editable message. Select **edit** below the message to open the live editor.

Run formatting, linting, and type checks with:

```sh
deno task ok
```
