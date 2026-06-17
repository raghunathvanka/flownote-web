// src/db/settingsRepository.ts
import { getDB } from './schema';

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row?.value ?? defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}
