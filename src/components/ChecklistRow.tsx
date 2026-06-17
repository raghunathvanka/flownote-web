'use client';
// src/components/ChecklistRow.tsx
import { useState } from 'react';
import type { ChecklistItem } from '@/types/checklistItem';
import { getDueDateStatus } from '@/types/checklistItem';
import styles from './ChecklistRow.module.css';

interface Props {
  item: ChecklistItem;
  onToggle: (id: number, checked: boolean) => void;
  onTextChange: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onSetDueDate: (item: ChecklistItem) => void;
  onOpenSubNote: (item: ChecklistItem) => void;
}

export default function ChecklistRow({ item, onToggle, onTextChange, onDelete, onSetDueDate, onOpenSubNote }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const status = getDueDateStatus(item);

  const borderMap: Record<string, string> = {
    green: 'var(--green)',
    orange: 'var(--orange)',
    red: 'var(--red)',
    none: 'transparent',
  };
  const bgMap: Record<string, string> = {
    green: 'var(--green-bg)',
    orange: 'var(--orange-bg)',
    red: 'var(--red-bg)',
    none: 'transparent',
  };

  return (
    <div
      className={styles.row}
      style={{
        borderLeftColor: borderMap[status],
        backgroundColor: item.completed ? 'transparent' : bgMap[status],
      }}
    >
      {/* Checkbox */}
      <button
        className={`checkbox ${item.completed ? 'checked' : ''}`}
        onClick={() => onToggle(item.id, !item.completed)}
        title="Toggle complete"
      >
        {item.completed && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5L8.5 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>

      {/* Content */}
      <div className={styles.content}>
        {editing ? (
          <input
            className={styles.textInput}
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onBlur={() => { setEditing(false); if (text !== item.text) onTextChange(item.id, text); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onTextChange(item.id, text); } }}
          />
        ) : (
          <span
            className={`${styles.text} ${item.completed ? styles.completed : ''}`}
            onClick={() => setEditing(true)}
          >
            {item.text || <em className={styles.placeholder}>Click to edit…</em>}
          </span>
        )}

        <div className={styles.meta}>
          {item.dueDate && <span className={styles.dueDate}>📅 {item.dueDate}</span>}
          {status !== 'none' && !item.completed && (
            <span className={`badge badge-${status}`}>
              {status === 'green' ? 'On Track' : status === 'orange' ? 'Due Soon' : 'Overdue'}
            </span>
          )}
          {item.carriedForward && <span className="badge badge-blue">↩ Carried</span>}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className="icon-btn"
          title="Set due date"
          onClick={() => onSetDueDate(item)}
        >📅</button>
        <button
          className={`icon-btn ${item.childNoteId ? styles.linkedBtn : ''}`}
          title={item.childNoteId ? 'Open linked sub-note' : 'Link a sub-note'}
          onClick={() => onOpenSubNote(item)}
        >
          {item.childNoteId ? '🔗' : '➕'}
        </button>
        <button className="icon-btn" title="Delete item" onClick={() => onDelete(item.id)}>🗑</button>
      </div>
    </div>
  );
}
