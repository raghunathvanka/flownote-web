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
      {/* Desktop Header (hidden on mobile via CSS) */}
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
              {isToday ? 'Tap the + button below to create your first note for today.' : 'No notes were created on this date.'}
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
                {note.type === 'text' && (
                  <TextBody note={note} onUpdate={handleUpdateNote} />
                )}
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

      {/* ── Mobile FAB: Floating + button ── */}
      <div className={styles.fab}>
        {addingType !== null && (
          <div className={styles.fabMenu}>
            {(['checklist', 'text', 'reminder'] as const).map(type => (
              <button key={type} className={styles.fabOption} onClick={() => handleAddNote(type)}>
                <span className={styles.fabOptionIcon}>
                  {type === 'text' ? '📝' : type === 'checklist' ? '☑️' : '🔔'}
                </span>
                <span className={styles.fabOptionLabel}>
                  {type === 'text' ? 'Text Note' : type === 'checklist' ? 'Checklist' : 'Reminder'}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          className={styles.fabBtn}
          onClick={() => setAddingType(addingType ? null : 'text')}
          aria-label="Add note"
        >
          <span className={`${styles.fabIcon} ${addingType ? styles.fabIconClose : ''}`}>+</span>
        </button>
      </div>

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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            onUpdate({ ...note, images: [...(note.images || []), base64] });
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(note.images || [])];
    newImages.splice(index, 1);
    onUpdate({ ...note, images: newImages });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        style={{
          minHeight: 100,
          background: 'rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 14,
          color: '#1A1A2E',
          fontFamily: 'inherit',
          width: '100%',
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.6,
        }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={() => { if (content !== note.content) onUpdate({ ...note, content }); }}
        onPaste={handlePaste}
        placeholder="Type your notes here... You can also paste images."
      />
      {note.images && note.images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {note.images.map((img, i) => (
            <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
              <img src={img} alt="Attachment" style={{ height: 100, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover' }} />
              <button 
                onClick={() => removeImage(i)}
                style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
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
          <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', fontWeight: 600 }}>{completed}/{items.length}</span>
        </div>
      )}
      {note.completionDate && (
        <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginBottom: 6 }}>📅 Due: {note.completionDate}</p>
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
          style={{ fontSize: 13, flex: 1, padding: '8px 10px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, fontFamily: 'inherit', outline: 'none', color: '#1A1A2E', minHeight: 40 }}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add item…"
          onKeyDown={(e) => { if (e.key === 'Enter' && newText.trim()) { onAddItem(newText); setNewText(''); } }}
        />
        <button
          style={{ padding: '8px 14px', minWidth: 44, minHeight: 44, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 20, lineHeight: 1 }}
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
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.75)' }}>{note.reminderDate}</p>
            <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>{note.reminderTime}</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: note.reminderFired ? 'var(--green)' : isPast ? 'var(--red)' : 'var(--accent)' }}>
            {note.reminderFired ? 'Fired' : isPast ? 'Past' : 'Pending'}
          </span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', fontStyle: 'italic', textAlign: 'center' }}>No reminder set</p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="date" style={{ flex: 1, minWidth: 130, fontSize: 13, colorScheme: 'light', minHeight: 44 }}
          defaultValue={note.reminderDate ?? ''}
          onChange={(e) => onUpdate({ ...note, reminderDate: e.target.value, reminderFired: false })}
        />
        <input type="time" style={{ flex: 1, minWidth: 110, fontSize: 13, colorScheme: 'light', minHeight: 44 }}
          defaultValue={note.reminderTime ?? ''}
          onChange={(e) => onUpdate({ ...note, reminderTime: e.target.value, reminderFired: false })}
        />
      </div>
    </div>
  );
}
