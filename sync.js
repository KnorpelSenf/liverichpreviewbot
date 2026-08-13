const editor = document.querySelector("#editor");
const miniApp = globalThis.Telegram.WebApp;
const searchParams = new URL(globalThis.location.href).searchParams;
const id = searchParams.get("id");
const format = searchParams.get("format");
const maxTextLength = editor.maxLength;
let saveTimer;
let saveQueue = Promise.resolve();

miniApp.expand();
miniApp.ready();

async function loadContent() {
  if (!id) {
    throw new Error("The Mini App URL is missing its document ID.");
  }

  if (format !== "html" && format !== "markdown" && format !== "blocks") {
    throw new Error("The Mini App URL has an invalid format.");
  }

  const response = await fetch("/api/" + format, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error("Could not load the content (" + response.status + ").");
  }

  const data = await response.json();
  editor.value = data[format];
}

function isValidContent(content) {
  if (content.length === 0 || content.length > maxTextLength) {
    return false;
  }

  if (format === "blocks") {
    try {
      const blocks = JSON.parse(content);
      return Array.isArray(blocks) && blocks.length > 0;
    } catch {
      return false;
    }
  }

  return format === "html" || format === "markdown";
}

function updateValidity(content) {
  const isValid = isValidContent(content);
  if (isValid) {
    editor.removeAttribute("aria-invalid");
  } else {
    editor.setAttribute("aria-invalid", "true");
  }
  return isValid;
}

async function saveContent(content) {
  if (!updateValidity(content)) return;

  const response = await fetch("/api/" + format, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, [format]: content }),
  });

  if (!response.ok) {
    throw new Error("Could not save the content (" + response.status + ").");
  }
}

editor.addEventListener("input", () => {
  clearTimeout(saveTimer);
  const content = editor.value;
  if (!updateValidity(content)) return;

  saveTimer = setTimeout(() => {
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
    updateValidity(editor.value);
    editor.disabled = false;
  });
