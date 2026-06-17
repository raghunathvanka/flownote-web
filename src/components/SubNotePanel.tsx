'use client';
// src/components/SubNotePanel.tsx — Right-side panel for viewing/creating a linked sub-note
import { useState, useEffect } from 'react';
import type { ChecklistItem } from '@/types/checklistItem';
import type { Note } from '@/types/note';
import { getNoteById, createNote } from '@/db/noteRepository';
import { updateNote } from '@/db/noteRepository';
import styles from './SubNotePanel.module.css';

interface Props {
  item: ChecklistItem;
  parentNote: Note;
  onClose: () => void;
  onLinked: (childNoteId: number) => void;
}

export default function SubNotePanel({ item, parentNote, onClose, onLinked }: Props) {
  const [subNote, setSubNote] = useState<Note | null | undefined>(undefined); // undefined=loading

  useEffect(() => {
    if (item.childNoteId) {
      getNoteById(item.childNoteId).then(n => setSubNote(n ?? null));
    } else {
      setSubNote(null);
    }
  }, [item.childNoteId]);

  const handleCreate = async (type: Note['type']) => {
    const now = new Date().toISOString();
    const id = await createNote({
      date: parentNote.date,
      type,
      title: `Sub: ${item.text || 'Linked Note'}`,
      content: '',
      color: '#D8F3DC',
      minimized: false,
      reminderFired: false,
      createdAt: now,
      completionDate: parentNote.date,
    });
    onLinked(id);
    const note = await getNoteById(id);
    setSubNote(note ?? null);
  };

  const handleUpdateSubNote = async (note: Note) => {
    await updateNote(note);
    setSubNote(note);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.label}>Sub-Note</span>
          <span className={styles.parent} title={item.text}>↑ {item.text}</span>
        </div>
        <button className="icon-btn" onClick={onClose} title="Close">✕</button>
      </div>

      <div className={styles.body}>
        {subNote === undefined && (
          <p className={styles.loading}>Loading…</p>
        )}

        {subNote === null && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🔗</p>
            <p className={styles.emptyTitle}>No Sub-Note Linked</p>
            <p className={styles.emptyText}>Create a note linked to this item:</p>
            <div className={styles.createBtns}>
              {(['text', 'checklist', 'reminder'] as const).map(type => (
                <button key={type} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => handleCreate(type)}>
                  {type === 'text' ? '📝 Text Note' : type === 'checklist' ? '☑️ Checklist' : '🔔 Reminder'}
                </button>
              ))}
            </div>
          </div>
        )}

        {subNote && (
          <div className={styles.subNoteContent} style={{ background: subNote.color }}>
            <div className={styles.subNoteHeader}>
              <input
                style={{ background: 'transparent', border: 'none', fontWeight: 700, fontSize: 16, color: '#1A1A2E', fontFamily: 'inherit', outline: 'none', width: '100%' }}
                value={subNote.title}
                onChange={(e) => setSubNote({ ...subNote, title: e.target.value })}
                onBlur={() => handleUpdateSubNote(subNote)}
                placeholder="Sub-note title…"
              />
              <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
                {subNote.type}
              </span>
            </div>
            <textarea
              style={{ width: '100%', minHeight: 180, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '8px 10px', fontSize: 14, color: '#1A1A2E', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
              value={subNote.content}
              onChange={(e) => setSubNote({ ...subNote, content: e.target.value })}
              onBlur={() => handleUpdateSubNote(subNote)}
              placeholder="Notes, details, context…"
            />
          </div>
        )}
      </div>
    </div>
  );
}
