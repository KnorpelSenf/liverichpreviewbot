const editor = document.querySelector("#editor");
const statusLabel = document.querySelector("#status");
const miniApp = globalThis.Telegram.WebApp;
const searchParams = new URL(globalThis.location.href).searchParams;
const id = searchParams.get("id");
const format = searchParams.get("format");
const maxTextLength = editor.maxLength;
let saveTimer;
let saveQueue = Promise.resolve();
let editRevision = 0;

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

function classifyContent(content) {
  if (content.length === 0) {
    return "empty";
  }

  if (format === "blocks") {
    try {
      const blocks = JSON.parse(content);
      if (!Array.isArray(blocks)) return "invalid json";
      if (blocks.length === 0) return "empty";
    } catch {
      return "invalid json";
    }
  }

  if (
    content.length <= maxTextLength &&
    (format === "html" || format === "markdown" || format === "blocks")
  ) {
    return "valid";
  }

  return "invalid";
}

function updateValidity(content) {
  const contentState = classifyContent(content);
  const isValid = contentState === "valid";
  if (isValid) {
    editor.removeAttribute("aria-invalid");
  } else {
    editor.setAttribute("aria-invalid", "true");
  }
  return isValid;
}

function setStatus(status) {
  statusLabel.textContent = status;
}

async function saveContent(content, revision) {
  if (classifyContent(content) !== "valid") return;

  if (revision === editRevision) setStatus("saving");

  try {
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

    if (revision === editRevision) setStatus("idle");
  } catch (error) {
    if (revision === editRevision) setStatus("network error");
    throw error;
  }
}

editor.addEventListener("input", () => {
  clearTimeout(saveTimer);
  editRevision += 1;

  const content = editor.value;
  const revision = editRevision;
  const contentState = classifyContent(content);
  const isValid = updateValidity(content);

  if (!isValid) {
    if (contentState === "empty" || contentState === "invalid json") {
      setStatus(contentState);
    }
    return;
  }

  setStatus("waiting");

  saveTimer = setTimeout(() => {
    saveQueue = saveQueue
      .catch(() => {})
      .then(() => saveContent(content, revision))
      .catch((error) => console.error(error));
  }, 1000);
});

loadContent()
  .then(() => {
    const contentState = classifyContent(editor.value);
    if (updateValidity(editor.value)) {
      setStatus("idle");
    } else if (contentState === "empty" || contentState === "invalid json") {
      setStatus(contentState);
    } else {
      setStatus("network error");
    }
  })
  .catch((error) => {
    editor.placeholder = error.message;
    updateValidity(editor.value);
    setStatus("network error");
  })
  .finally(() => {
    editor.disabled = false;
  });
