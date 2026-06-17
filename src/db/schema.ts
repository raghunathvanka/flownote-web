// src/db/schema.ts
// IndexedDB schema using 'idb' library — equivalent to the SQLite schema
import { openDB, IDBPDatabase } from 'idb';
import type { Note } from '@/types/note';
import type { ChecklistItem } from '@/types/checklistItem';

export interface FlowNoteDB {
  notes: {
    key: number;
    value: Note;
    indexes: { byDate: string };
  };
  checklistItems: {
    key: number;
    value: ChecklistItem;
    indexes: { byNoteId: number; byCompleted: number };
  };
  settings: {
    key: string;
    value: { key: string; value: string };
  };
}

let _db: IDBPDatabase<FlowNoteDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<FlowNoteDB>> {
  if (_db) return _db;

  _db = await openDB<FlowNoteDB>('flownote', 2, {
    upgrade(db, oldVersion) {
      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', {
          keyPath: 'id',
          autoIncrement: true,
        });
        noteStore.createIndex('byDate', 'date');
      }

      // Checklist items store
      if (!db.objectStoreNames.contains('checklistItems')) {
        const itemStore = db.createObjectStore('checklistItems', {
          keyPath: 'id',
          autoIncrement: true,
        });
        itemStore.createIndex('byNoteId', 'noteId');
        itemStore.createIndex('byCompleted', 'completed');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return _db;
}
