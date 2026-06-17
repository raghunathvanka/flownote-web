// src/types/checklistItem.ts
export interface ChecklistItem {
  id: number;
  noteId: number;
  text: string;
  completed: boolean;
  carriedForward: boolean;
  sortOrder: number;
  parentId?: number;
  childNoteId?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateChecklistItem = Omit<ChecklistItem, 'id'>;

export type DueDateStatus = 'green' | 'orange' | 'red' | 'none';

export function getDueDateStatus(item: ChecklistItem): DueDateStatus {
  if (item.completed || !item.dueDate) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(item.dueDate + 'T00:00:00');
  const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'red';
  if (diff <= 1) return 'orange';
  return 'green';
}
