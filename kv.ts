interface MessageIdentifiers {
  chatId: number;
  messageId: number;
}

export type Format = "html" | "markdown" | "blocks";

const kv = await Deno.openKv();

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
  const identifiers: MessageIdentifiers = { chatId, messageId };
  await kv.set([format, "messageIdentifiers", id], identifiers);
}

export async function loadMessageIdentifiers(
  format: Format,
  id: string,
): Promise<MessageIdentifiers | null> {
  const result = await kv.get<MessageIdentifiers>([
    format,
    "messageIdentifiers",
    id,
  ]);
  return result.value;
}

export async function saveDraft(
  format: Format,
  id: string,
  content: string,
): Promise<void> {
  await kv.set([format, "draft", id], content);
}

export async function loadDraft(
  format: Format,
  id: string,
): Promise<string | null> {
  const result = await kv.get<string>([format, "draft", id]);
  return result.value;
}
