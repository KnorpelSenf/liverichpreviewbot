import { html } from "@hono/hono/html";
import { MAX_TEXT_LENGTH } from "./limits.ts";

export function renderMiniApp() {
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://telegram.org/js/telegram-web-app.js?63"></script>
        <style>
          :root {
            color-scheme: light dark;
          }

          html,
          body {
            height: 100%;
          }

          body {
            box-sizing: border-box;
            margin: 0;
            padding: 12px;
            height: var(--tg-viewport-height, 100dvh);
            background: var(--tg-theme-bg-color, Canvas);
            color: var(--tg-theme-text-color, CanvasText);
          }

          textarea {
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            padding: 8px;
            resize: none;
            border: 1px solid var(--tg-theme-hint-color, GrayText);
            border-radius: 6px;
            background: var(--tg-theme-secondary-bg-color, Field);
            color: var(--tg-theme-text-color, FieldText);
            font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco,
              Consolas, "Liberation Mono", "Courier New", monospace;
          }

          textarea[aria-invalid="true"] {
            border: 2px solid red;
          }
        </style>
      </head>
      <body>
        <textarea
          id="editor"
          aria-label="Content editor"
          maxlength="${MAX_TEXT_LENGTH}"
          spellcheck="false"
          disabled
        ></textarea>
        <script src="/mini_app.js"></script>
      </body>
    </html>
  `;
}
