interface TextRecord {
  text: string;
  chatId: number;
  messageId: number;
}

const kv = await Deno.openKv();

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

export async function saveText(
  id: string,
  text: string,
  chatId: number,
  messageId: number,
): Promise<void> {
  const record: TextRecord = { text, chatId, messageId };
  await kv.set(["texts", id], record);
}

export async function loadText(id: string): Promise<string | null> {
  const result = await kv.get<TextRecord>(["texts", id]);
  return result.value?.text ?? null;
}
