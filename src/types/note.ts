// src/types/note.ts
export type NoteType = 'text' | 'checklist' | 'reminder';

export const NOTE_COLORS: Record<string, string> = {
  yellow: '#FEFAE0',
  blue: '#D4E5F7',
  green: '#D8F3DC',
  pink: '#FFD6E0',
  gray: '#E8E8E8',
  purple: '#E8D5F5',
  orange: '#FFE5CC',
};

export interface Note {
  id: number;
  date: string;        // 'YYYY-MM-DD'
  type: NoteType;
  title: string;
  content: string;
  color: string;
  minimized: boolean;
  reminderDate?: string;
  reminderTime?: string;
  reminderFired: boolean;
  createdAt: string;
  completionDate?: string;
  images?: string[];
}

export type CreateNote = Omit<Note, 'id'>;
