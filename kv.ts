interface MessageIdentifiers {
  chatId: number;
  messageId: number;
}

export type Format = "html" | "markdown" | "blocks";

const kv = await Deno.openKv();
const KV_PREFIX = "liverichpreviewbot";
const KV_LOG_CONTEXT = {
  app: Deno.env.get("DENO_DEPLOY_APP_SLUG") ?? "local",
  revision: Deno.env.get("DENO_DEPLOY_BUILD_ID") ?? "local",
  deployment: Deno.env.get("DENO_DEPLOYMENT_ID") ?? "local",
  timeline: Deno.env.get("DENO_TIMELINE") ?? "local",
};

console.info("[kv] opened", KV_LOG_CONTEXT);

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

export async function saveMessageIdentifiers(
  format: Format,
  id: string,
  chatId: number,
  messageId: number,
): Promise<void> {
  const key = [KV_PREFIX, format, "messageIdentifiers", id];
  const identifiers: MessageIdentifiers = { chatId, messageId };
  await kv.set(key, identifiers);
  logKv("set", "message identifiers", format, id);
}

export async function loadMessageIdentifiers(
  format: Format,
  id: string,
): Promise<MessageIdentifiers | null> {
  const key = [KV_PREFIX, format, "messageIdentifiers", id];
  const result = await kv.get<MessageIdentifiers>(key);
  logKv(
    "get",
    "message identifiers",
    format,
    id,
    result.value === null ? "miss" : "hit",
  );
  return result.value;
}

export async function saveDraft(
  format: Format,
  id: string,
  content: string,
): Promise<void> {
  const key = [KV_PREFIX, format, "draft", id];
  await kv.set(key, content);
  logKv("set", "draft", format, id, `${content.length} chars`);
}

export async function loadDraft(
  format: Format,
  id: string,
): Promise<string | null> {
  const key = [KV_PREFIX, format, "draft", id];
  const result = await kv.get<string>(key);
  const outcome = result.value === null
    ? "miss"
    : `hit, ${result.value.length} chars`;
  logKv("get", "draft", format, id, outcome);
  return result.value;
}

function logKv(
  operation: "get" | "set",
  entry: string,
  format: Format,
  id: string,
  outcome?: string,
): void {
  console.info(
    `[kv] ${operation} ${entry} ${format}/${id}${
      outcome === undefined ? "" : `: ${outcome}`
    }`,
  );
}
