'use client';
// src/components/NoteCard.tsx — Universal note card wrapper
import { useState, ReactNode } from 'react';
import type { Note } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';
import styles from './NoteCard.module.css';

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

const TYPE_ICONS: Record<string, string> = { text: '📝', checklist: '☑️', reminder: '🔔' };
const TYPE_LABELS: Record<string, string> = { text: 'Note', checklist: 'Checklist', reminder: 'Reminder' };

interface Props {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: number) => void;
  onColorChange: (id: number, color: string) => void;
  children?: ReactNode;
}

export default function NoteCard({ note, onUpdate, onDelete, onColorChange, children }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(note.title);
  const [showColors, setShowColors] = useState(false);
  const [minimized, setMinimized] = useState(note.minimized);

  const light = isLightColor(note.color);
  const textColor = light ? '#1A1A2E' : '#EAEEFF';
  const subColor = light ? 'rgba(20,20,40,0.55)' : 'rgba(200,210,255,0.55)';
  const borderColor = light ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.1)';

  const submitTitle = () => {
    setEditingTitle(false);
    if (titleText !== note.title) onUpdate({ ...note, title: titleText });
  };

  return (
    <div
      className={`${styles.card} animate-fade`}
      style={{ background: note.color, borderColor }}
    >
      {/* Header */}
      <div className={styles.header} style={{ borderBottomColor: borderColor }}>
        <span style={{ color: subColor, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
          {TYPE_ICONS[note.type]} {TYPE_LABELS[note.type]}
        </span>
        <div className={styles.headerActions}>
          <button className={styles.hBtn} style={{ color: subColor }} onClick={() => setShowColors(!showColors)} title="Change color">🎨</button>
          <button className={styles.hBtn} style={{ color: subColor }} onClick={() => setMinimized(!minimized)} title={minimized ? 'Expand' : 'Minimize'}>
            {minimized ? '▼' : '▲'}
          </button>
          <button className={styles.hBtn} style={{ color: subColor }} onClick={() => {
            if (confirm('Delete this note?')) onDelete(note.id);
          }} title="Delete">✕</button>
        </div>
      </div>

      {/* Color picker */}
      {showColors && (
        <div className={styles.colorPicker} style={{ borderBottomColor: borderColor }}>
          {Object.entries(NOTE_COLORS).map(([name, color]) => (
            <button
              key={name}
              className={styles.colorDot}
              style={{ background: color, outline: note.color === color ? '2px solid var(--accent)' : 'none' }}
              onClick={() => { onColorChange(note.id, color); setShowColors(false); }}
              title={name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      {editingTitle ? (
        <input
          className={styles.titleInput}
          style={{ color: textColor }}
          value={titleText}
          autoFocus
          onChange={(e) => setTitleText(e.target.value)}
          onBlur={submitTitle}
          onKeyDown={(e) => e.key === 'Enter' && submitTitle()}
          placeholder="Note title…"
        />
      ) : (
        <div
          className={styles.title}
          style={{ color: textColor }}
          onClick={() => setEditingTitle(true)}
        >
          {note.title || <span style={{ color: subColor, fontStyle: 'italic', fontWeight: 400 }}>Click to set title…</span>}
        </div>
      )}

      {/* Body */}
      {!minimized && <div className={styles.body}>{children}</div>}
    </div>
  );
}
