interface MessageIdentifiers {
  chatId: number;
  messageId: number;
}

export type Format = "html" | "markdown" | "blocks";

const kv = await Deno.openKv();
const KV_PREFIX = "liverichpreviewbot";
const KV_LOG_CONTEXT = {
  app: Deno.env.get("DENO_DEPLOY_APP_SLUG") ?? "local",
  revision: Deno.env.get("DENO_DEPLOY_REVISION_ID") ?? "local",
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
  logKv("set message identifiers: start", { format, id, key });
  const result = await kv.set(key, identifiers);
  logKv("set message identifiers: complete", {
    format,
    id,
    key,
    versionstamp: result.versionstamp,
  });
}

export async function loadMessageIdentifiers(
  format: Format,
  id: string,
): Promise<MessageIdentifiers | null> {
  const key = [KV_PREFIX, format, "messageIdentifiers", id];
  logKv("get message identifiers: start", { format, id, key });
  const result = await kv.get<MessageIdentifiers>(key);
  logKv("get message identifiers: complete", {
    format,
    id,
    key,
    hit: result.value !== null,
    versionstamp: result.versionstamp,
  });
  return result.value;
}

export async function saveDraft(
  format: Format,
  id: string,
  content: string,
): Promise<void> {
  const key = [KV_PREFIX, format, "draft", id];
  logKv("set draft: start", { format, id, key, contentLength: content.length });
  const result = await kv.set(key, content);
  logKv("set draft: complete", {
    format,
    id,
    key,
    contentLength: content.length,
    versionstamp: result.versionstamp,
  });
}

export async function loadDraft(
  format: Format,
  id: string,
): Promise<string | null> {
  const key = [KV_PREFIX, format, "draft", id];
  logKv("get draft: start", { format, id, key });
  const result = await kv.get<string>(key);
  logKv("get draft: complete", {
    format,
    id,
    key,
    hit: result.value !== null,
    contentLength: result.value?.length ?? null,
    versionstamp: result.versionstamp,
  });
  return result.value;
}

function logKv(operation: string, details: Record<string, unknown>): void {
  console.info(`[kv] ${operation}`, { ...KV_LOG_CONTEXT, ...details });
}
