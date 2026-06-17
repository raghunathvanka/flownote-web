// src/db/checklistRepository.ts
import { getDB } from './schema';
import type { ChecklistItem, CreateChecklistItem } from '@/types/checklistItem';

export async function getItemsByNoteId(noteId: number): Promise<ChecklistItem[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex('checklistItems', 'byNoteId', noteId);
  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getItemById(id: number): Promise<ChecklistItem | undefined> {
  const db = await getDB();
  return db.get('checklistItems', id);
}

export async function addItem(item: CreateChecklistItem): Promise<number> {
  const db = await getDB();
  return db.add('checklistItems', item as ChecklistItem) as Promise<number>;
}

export async function updateItem(item: ChecklistItem): Promise<void> {
  const db = await getDB();
  await db.put('checklistItems', { ...item, updatedAt: new Date().toISOString() });
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('checklistItems', id);
}

export async function markCompleted(id: number, completed: boolean): Promise<void> {
  const db = await getDB();
  const item = await db.get('checklistItems', id);
  if (!item) return;
  await db.put('checklistItems', { ...item, completed, updatedAt: new Date().toISOString() });
}

export async function markCarriedForward(id: number): Promise<void> {
  const db = await getDB();
  const item = await db.get('checklistItems', id);
  if (!item) return;
  await db.put('checklistItems', { ...item, carriedForward: true, updatedAt: new Date().toISOString() });
}

export async function setChildNote(itemId: number, childNoteId: number | undefined): Promise<void> {
  const db = await getDB();
  const item = await db.get('checklistItems', itemId);
  if (!item) return;
  await db.put('checklistItems', { ...item, childNoteId, updatedAt: new Date().toISOString() });
}

export async function getAllIncompleteBeforeDate(targetDate: string): Promise<ChecklistItem[]> {
  const db = await getDB();
  // Get all incomplete, non-carried items
  const all = await db.getAll('checklistItems');
  const candidates: ChecklistItem[] = [];
  for (const item of all) {
    if (item.completed || item.carriedForward || !item.text.trim()) continue;
    // Check the note's date
    const note = await db.get('notes', item.noteId);
    if (note && note.date < targetDate) {
      candidates.push(item);
    }
  }
  return candidates;
}
