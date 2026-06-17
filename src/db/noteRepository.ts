// src/db/noteRepository.ts
import { getDB } from './schema';
import type { Note, CreateNote } from '@/types/note';

export async function getNotesByDate(date: string): Promise<Note[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('notes', 'byDate', date);
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getNoteById(id: number): Promise<Note | undefined> {
  const db = await getDB();
  return db.get('notes', id);
}

export async function createNote(note: CreateNote): Promise<number> {
  const db = await getDB();
  return db.add('notes', note as Note) as Promise<number>;
}

export async function updateNote(note: Note): Promise<void> {
  const db = await getDB();
  await db.put('notes', note);
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDB();
  // Also delete all checklist items for this note
  const items = await db.getAllFromIndex('checklistItems', 'byNoteId', id);
  const tx = db.transaction(['notes', 'checklistItems'], 'readwrite');
  await Promise.all([
    tx.objectStore('notes').delete(id),
    ...items.map((item) => tx.objectStore('checklistItems').delete(item.id)),
  ]);
  await tx.done;
}

export async function getAllDatesWithNotes(): Promise<string[]> {
  const db = await getDB();
  const all = await db.getAll('notes');
  const dates = [...new Set(all.map((n) => n.date))];
  return dates.sort((a, b) => b.localeCompare(a));
}

export async function cloneNote(noteId: number, targetDate: string): Promise<number | undefined> {
  const original = await getNoteById(noteId);
  if (!original) return undefined;
  const cloned: CreateNote = {
    ...original,
    date: targetDate,
    completionDate: targetDate,
    createdAt: new Date().toISOString(),
    minimized: false,
    reminderFired: false,
    reminderDate: undefined,
    reminderTime: undefined,
  };
  return createNote(cloned);
}
