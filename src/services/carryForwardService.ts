// src/services/carryForwardService.ts
// Direct port of carry_forward_service.py — same logic, same behavior
import { getSetting, setSetting } from '@/db/settingsRepository';
import { getAllIncompleteBeforeDate, addItem, markCarriedForward } from '@/db/checklistRepository';
import { createNote, cloneNote } from '@/db/noteRepository';
import type { CreateChecklistItem } from '@/types/checklistItem';

const SETTING_KEY = 'last_carry_forward_date';

export async function runCarryForward(): Promise<number> {
  const enabled = await getSetting('carry_forward_enabled', 'true');
  if (enabled === 'false') return 0;

  const today = new Date().toISOString().split('T')[0];
  const lastRun = await getSetting(SETTING_KEY);
  if (lastRun === today) return 0;

  const carried = await carryAllBeforeDate(today);
  await setSetting(SETTING_KEY, today);
  return carried;
}

async function carryAllBeforeDate(targetDate: string): Promise<number> {
  const incomplete = await getAllIncompleteBeforeDate(targetDate);
  if (incomplete.length === 0) return 0;

  // Create a single "Carried Forward" checklist note for today
  const noteId = await createNote({
    date: targetDate,
    type: 'checklist',
    title: '[>] Carried Forward',
    content: '',
    color: '#D4E5F7',
    minimized: false,
    reminderFired: false,
    createdAt: new Date().toISOString(),
    completionDate: targetDate,
  });

  const oldToNewId: Record<number, number> = {};

  for (let order = 0; order < incomplete.length; order++) {
    const item = incomplete[order];

    // Clone linked sub-note if exists
    let newChildNoteId: number | undefined;
    if (item.childNoteId) {
      newChildNoteId = await cloneNote(item.childNoteId, targetDate);
    }

    const now = new Date().toISOString();
    const newItem: CreateChecklistItem = {
      noteId,
      text: item.text,
      completed: false,
      carriedForward: false,
      sortOrder: order,
      parentId: undefined,
      childNoteId: newChildNoteId,
      dueDate: targetDate,
      createdAt: now,
      updatedAt: now,
    };

    const newId = await addItem(newItem);
    oldToNewId[item.id] = newId;
    await markCarriedForward(item.id);
  }

  // Restore parent-child links
  const db = await import('@/db/schema').then((m) => m.getDB());
  for (const item of incomplete) {
    if (item.parentId && oldToNewId[item.parentId] && oldToNewId[item.id]) {
      const newItem = await db.get('checklistItems', oldToNewId[item.id]);
      if (newItem) {
        await db.put('checklistItems', { ...newItem, parentId: oldToNewId[item.parentId] });
      }
    }
  }

  return incomplete.length;
}
