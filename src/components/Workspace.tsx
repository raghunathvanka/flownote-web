'use client';
// src/components/Workspace.tsx — Main workspace showing all notes for a date
import { useState, useEffect, useCallback } from 'react';
import type { Note } from '@/types/note';
import type { ChecklistItem } from '@/types/checklistItem';
import NoteCard from './NoteCard';
import ChecklistRow from './ChecklistRow';
import SubNotePanel from './SubNotePanel';
import styles from './Workspace.module.css';
import {
  getNotesByDate, createNote, updateNote, deleteNote,
} from '@/db/noteRepository';
import {
  getItemsByNoteId, addItem, updateItem, deleteItem,
  markCompleted, setChildNote,
} from '@/db/checklistRepository';

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

interface Props { date: string }

export default function Workspace({ date }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<number, ChecklistItem[]>>({});
  const [addingType, setAddingType] = useState<null | Note['type']>(null);
  const [subNoteState, setSubNoteState] = useState<{ item: ChecklistItem; parentNote: Note } | null>(null);

  const loadNotes = useCallback(async () => {
    const loaded = await getNotesByDate(date);
    setNotes(loaded);
    const map: Record<number, ChecklistItem[]> = {};
    for (const n of loaded) {
      if (n.type === 'checklist') {
        map[n.id] = await getItemsByNoteId(n.id);
      }
    }
    setItemsMap(map);
  }, [date]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // ── Note operations ──────────────────────────────────────────
  const handleAddNote = async (type: Note['type']) => {
    const now = new Date().toISOString();
    const id = await createNote({
      date, type, title: '', content: '',
      color: type === 'checklist' ? '#D4E5F7' : type === 'reminder' ? '#FFD6E0' : '#FEFAE0',
      minimized: false, reminderFired: false, createdAt: now, completionDate: date,
    });
    await loadNotes();
    setAddingType(null);
  };

  const handleUpdateNote = async (note: Note) => {
    await updateNote(note);
    setNotes(prev => prev.map(n => n.id === note.id ? note : n));
  };

  const handleDeleteNote = async (id: number) => {
    await deleteNote(id);
    await loadNotes();
  };

  const handleColorChange = async (id: number, color: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    await updateNote({ ...note, color });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
  };

  // ── Checklist operations ──────────────────────────────────────
  const loadItems = async (noteId: number) => {
    const items = await getItemsByNoteId(noteId);
    setItemsMap(prev => ({ ...prev, [noteId]: items }));
  };

  const handleAddItem = async (noteId: number, text: string) => {
    if (!text.trim()) return;
    const items = itemsMap[noteId] ?? [];
    const now = new Date().toISOString();
    await addItem({
      noteId, text: text.trim(), completed: false, carriedForward: false,
      sortOrder: items.length, dueDate: date, createdAt: now, updatedAt: now,
    });
    await loadItems(noteId);
  };

  const handleToggle = async (noteId: number, itemId: number, checked: boolean) => {
    await markCompleted(itemId, checked);
    await loadItems(noteId);
  };

  const handleTextChange = async (noteId: number, itemId: number, text: string) => {
    const item = (itemsMap[noteId] ?? []).find(i => i.id === itemId);
    if (!item) return;
    await updateItem({ ...item, text });
    await loadItems(noteId);
  };

  const handleDeleteItem = async (noteId: number, itemId: number) => {
    await deleteItem(itemId);
    await loadItems(noteId);
  };

  const handleSetDueDate = async (noteId: number, item: ChecklistItem, dueDate: string) => {
    await updateItem({ ...item, dueDate });
    await loadItems(noteId);
  };

  const handleOpenSubNote = (item: ChecklistItem, parentNote: Note) => {
    setSubNoteState({ item, parentNote });
  };

  const handleSubNoteLinked = async (itemId: number, noteId: number, childNoteId: number) => {
    await setChildNote(itemId, childNoteId);
    await loadItems(noteId);
    // Update the item in state so sub-note panel shows new link
    const updated = await getItemsByNoteId(noteId);
    setItemsMap(prev => ({ ...prev, [noteId]: updated }));
    const newItem = updated.find(i => i.id === itemId);
    if (newItem && subNoteState) {
      setSubNoteState({ ...subNoteState, item: newItem });
    }
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.dateLabel}>{formatDateLabel(date)}</h1>
          {!isToday && <p className={styles.dateSub}>{date}</p>}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.noteCount}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          <div className={styles.addMenu}>
            <button className="btn btn-primary" onClick={() => setAddingType(addingType ? null : 'text')}>
              + Add Note
            </button>
            {addingType !== null && (
              <div className={styles.typeDropdown}>
                {(['text', 'checklist', 'reminder'] as const).map(type => (
                  <button key={type} className={styles.typeOption} onClick={() => handleAddNote(type)}>
                    {type === 'text' ? '📝' : type === 'checklist' ? '☑️' : '🔔'}
                    {' '}{type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes grid */}
      <div className={styles.grid}>
        {notes.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <p className={styles.emptyTitle}>{isToday ? 'Start Your Day' : 'No Notes'}</p>
            <p className={styles.emptyText}>
              {isToday ? 'Click "Add Note" to create your first note for today.' : 'No notes were created on this date.'}
            </p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className={styles.noteWrapper}>
              <NoteCard
                note={note}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
                onColorChange={handleColorChange}
              >
                {/* Text note body */}
                {note.type === 'text' && (
                  <TextBody note={note} onUpdate={handleUpdateNote} />
                )}

                {/* Checklist note body */}
                {note.type === 'checklist' && (
                  <ChecklistBody
                    note={note}
                    items={itemsMap[note.id] ?? []}
                    onAddItem={(text) => handleAddItem(note.id, text)}
                    onToggle={(id, c) => handleToggle(note.id, id, c)}
                    onTextChange={(id, t) => handleTextChange(note.id, id, t)}
                    onDeleteItem={(id) => handleDeleteItem(note.id, id)}
                    onSetDueDate={(item, d) => handleSetDueDate(note.id, item, d)}
                    onOpenSubNote={(item) => handleOpenSubNote(item, note)}
                  />
                )}

                {/* Reminder note body */}
                {note.type === 'reminder' && (
                  <ReminderBody note={note} onUpdate={handleUpdateNote} />
                )}
              </NoteCard>
            </div>
          ))
        )}
      </div>

      {/* Sub-note side panel */}
      {subNoteState && (
        <SubNotePanel
          item={subNoteState.item}
          parentNote={subNoteState.parentNote}
          onClose={() => setSubNoteState(null)}
          onLinked={(childNoteId) =>
            handleSubNoteLinked(subNoteState.item.id, subNoteState.parentNote.id, childNoteId)
          }
        />
      )}

      {/* Close add menu on outside click */}
      {addingType !== null && (
        <div className={styles.backdrop} onClick={() => setAddingType(null)} />
      )}
    </div>
  );
}

// ── Text Note Body ───────────────────────────────────────────────
function TextBody({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const [content, setContent] = useState(note.content);
  return (
    <textarea
      style={{ minHeight: 100, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '8px 10px', fontSize: 14, color: '#1A1A2E', fontFamily: 'inherit', width: '100%', resize: 'vertical', outline: 'none' }}
      value={content}
      onChange={(e) => setContent(e.target.value)}
      onBlur={() => { if (content !== note.content) onUpdate({ ...note, content }); }}
      placeholder="Type your notes here…"
    />
  );
}

// ── Checklist Note Body ──────────────────────────────────────────
interface ChecklistBodyProps {
  note: Note;
  items: ChecklistItem[];
  onAddItem: (text: string) => void;
  onToggle: (id: number, checked: boolean) => void;
  onTextChange: (id: number, text: string) => void;
  onDeleteItem: (id: number) => void;
  onSetDueDate: (item: ChecklistItem, date: string) => void;
  onOpenSubNote: (item: ChecklistItem) => void;
}

function ChecklistBody({ note, items, onAddItem, onToggle, onTextChange, onDeleteItem, onSetDueDate, onOpenSubNote }: ChecklistBodyProps) {
  const [newText, setNewText] = useState('');
  const [dueDateItem, setDueDateItem] = useState<ChecklistItem | null>(null);
  const completed = items.filter(i => i.completed).length;

  return (
    <div>
      {/* Progress */}
      {items.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-fill" style={{ width: `${(completed / items.length) * 100}%` }} />
          </div>
          <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>{completed}/{items.length}</span>
        </div>
      )}
      {note.completionDate && (
        <p style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>📅 Due: {note.completionDate}</p>
      )}

      {/* Items */}
      <div>
        {items.map(item => (
          <ChecklistRow
            key={item.id}
            item={item}
            onToggle={(id, c) => onToggle(id, c)}
            onTextChange={(id, t) => onTextChange(id, t)}
            onDelete={(id) => onDeleteItem(id)}
            onSetDueDate={(item) => setDueDateItem(item)}
            onOpenSubNote={onOpenSubNote}
          />
        ))}
      </div>

      {/* Due date picker modal */}
      {dueDateItem && (
        <div className="modal-overlay" onClick={() => setDueDateItem(null)}>
          <div className="modal" style={{ padding: 24, maxWidth: 320 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>Set Due Date</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{dueDateItem.text}</p>
            <input type="date" defaultValue={dueDateItem.dueDate ?? new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'dark', marginBottom: 12 }}
              onChange={(e) => {
                onSetDueDate(dueDateItem, e.target.value);
                setDueDateItem(null);
              }}
            />
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setDueDateItem(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add item */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <input
          style={{ fontSize: 13, flex: 1, padding: '6px 10px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, fontFamily: 'inherit', outline: 'none', color: '#1A1A2E' }}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add item…"
          onKeyDown={(e) => { if (e.key === 'Enter' && newText.trim()) { onAddItem(newText); setNewText(''); } }}
        />
        <button
          style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 18, lineHeight: 1 }}
          onClick={() => { if (newText.trim()) { onAddItem(newText); setNewText(''); } }}
        >+</button>
      </div>
    </div>
  );
}

// ── Reminder Note Body ───────────────────────────────────────────
function ReminderBody({ note, onUpdate }: { note: Note; onUpdate: (n: Note) => void }) {
  const isPast = note.reminderDate && note.reminderTime
    ? new Date(`${note.reminderDate}T${note.reminderTime}`) < new Date()
    : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {note.reminderDate && note.reminderTime ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isPast ? 'rgba(244,67,54,0.08)' : 'rgba(74,144,217,0.1)', borderRadius: 8, border: `1px solid ${isPast ? 'rgba(244,67,54,0.2)' : 'rgba(74,144,217,0.2)'}` }}>
          <span style={{ fontSize: 20 }}>{note.reminderFired ? '✅' : isPast ? '⏰' : '🔔'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{note.reminderDate}</p>
            <p style={{ fontSize: 13, color: '#444' }}>{note.reminderTime}</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: note.reminderFired ? 'var(--green)' : isPast ? 'var(--red)' : 'var(--accent)' }}>
            {note.reminderFired ? 'Fired' : isPast ? 'Past' : 'Pending'}
          </span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>No reminder set</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" style={{ flex: 1, fontSize: 13, colorScheme: 'light' }}
          defaultValue={note.reminderDate ?? ''}
          onChange={(e) => onUpdate({ ...note, reminderDate: e.target.value, reminderFired: false })}
        />
        <input type="time" style={{ flex: 1, fontSize: 13, colorScheme: 'light' }}
          defaultValue={note.reminderTime ?? ''}
          onChange={(e) => onUpdate({ ...note, reminderTime: e.target.value, reminderFired: false })}
        />
      </div>
    </div>
  );
}
