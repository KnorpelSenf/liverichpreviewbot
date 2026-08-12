import { html } from "@hono/hono/html";

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

          body {
            margin: 0;
            padding: 12px;
            background: var(--tg-theme-bg-color, Canvas);
            color: var(--tg-theme-text-color, CanvasText);
          }

          textarea {
            box-sizing: border-box;
            width: 100%;
            height: 12rem;
            padding: 8px;
            resize: vertical;
            border: 1px solid var(--tg-theme-hint-color, GrayText);
            border-radius: 6px;
            background: var(--tg-theme-secondary-bg-color, Field);
            color: var(--tg-theme-text-color, FieldText);
            font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco,
              Consolas, "Liberation Mono", "Courier New", monospace;
          }
        </style>
      </head>
      <body>
        <textarea
          id="editor"
          aria-label="Text editor"
          spellcheck="false"
          disabled
        ></textarea>
        <script>
          const editor = document.querySelector("#editor");
          const miniApp = window.Telegram.WebApp;

          miniApp.ready();

          async function loadText() {
            const id = new URL(window.location.href).searchParams.get("id");

            if (!id) {
              throw new Error("The Mini App URL is missing its document ID.");
            }

            const response = await fetch("/api/text", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id }),
            });

            if (!response.ok) {
              throw new Error(
                "Could not load the text (" + response.status + ").",
              );
            }

            const data = await response.json();
            editor.value = data.text;
          }

          loadText()
            .catch((error) => {
              editor.placeholder = error.message;
            })
            .finally(() => {
              editor.disabled = false;
            });
        </script>
      </body>
    </html>
  `;
}
