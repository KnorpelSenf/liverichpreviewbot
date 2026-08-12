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
        <script>
          const editor = document.querySelector("#editor");
          const miniApp = window.Telegram.WebApp;
          const searchParams = new URL(window.location.href).searchParams;
          const id = searchParams.get("id");
          const format = searchParams.get("format");
          const maxTextLength = ${MAX_TEXT_LENGTH};
          let saveTimer;
          let saveQueue = Promise.resolve();

          miniApp.expand();
          miniApp.ready();

          async function loadContent() {
            if (!id) {
              throw new Error("The Mini App URL is missing its document ID.");
            }

            if (
              format !== "html" && format !== "markdown" &&
              format !== "blocks"
            ) {
              throw new Error("The Mini App URL has an invalid format.");
            }

            const response = await fetch("/api/" + format, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id }),
            });

            if (!response.ok) {
              throw new Error(
                "Could not load the content (" + response.status + ").",
              );
            }

            const data = await response.json();
            editor.value = data[format];
          }

          async function saveContent(content) {
            if (content.length > maxTextLength) {
              editor.setAttribute("aria-invalid", "true");
              return;
            }

            editor.removeAttribute("aria-invalid");
            if (format === "blocks") {
              try {
                const blocks = JSON.parse(content);
                if (!Array.isArray(blocks)) {
                  throw new TypeError("Blocks must be a JSON array.");
                }
              } catch {
                editor.setAttribute("aria-invalid", "true");
                return;
              }
            }

            const response = await fetch("/api/" + format, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id, [format]: content }),
            });

            if (!response.ok) {
              throw new Error(
                "Could not save the content (" + response.status + ").",
              );
            }
          }

          editor.addEventListener("input", () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
              const content = editor.value;
              saveQueue = saveQueue
                .catch(() => {})
                .then(() => saveContent(content))
                .catch((error) => console.error(error));
            }, 1000);
          });

          loadContent()
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
