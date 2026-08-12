interface MessageIdentifiers {
  chatId: number;
  messageId: number;
}

const kv = await Deno.openKv();

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

export async function saveMessageIdentifiers(
  id: string,
  chatId: number,
  messageId: number,
): Promise<void> {
  const identifiers: MessageIdentifiers = { chatId, messageId };
  await kv.set(["messageIdentifiers", id], identifiers);
}

export async function loadMessageIdentifiers(
  id: string,
): Promise<MessageIdentifiers | null> {
  const result = await kv.get<MessageIdentifiers>(["messageIdentifiers", id]);
  return result.value;
}

export async function saveText(id: string, text: string): Promise<void> {
  await kv.set(["texts", id], text);
}

export async function loadText(id: string): Promise<string | null> {
  const result = await kv.get<string>(["texts", id]);
  return result.value;
}
