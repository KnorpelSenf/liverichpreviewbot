import { html } from "@hono/hono/html";

export function renderMiniApp(botName: string) {
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://telegram.org/js/telegram-web-app.js?63"></script>
      </head>
      <body>
        ${botName}
      </body>
    </html>
  `;
}
