'use client';
// src/components/CalendarView.tsx — Monthly calendar with note indicators
import { useState, useEffect } from 'react';
import { getAllDatesWithNotes, getNotesByDate } from '@/db/noteRepository';
import type { Note } from '@/types/note';
import styles from './CalendarView.module.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface Props {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function CalendarView({ selectedDate, onDateSelect }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [view, setView] = useState(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [datesWithNotes, setDatesWithNotes] = useState<Set<string>>(new Set());
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [previewNotes, setPreviewNotes] = useState<Note[]>([]);

  useEffect(() => {
    getAllDatesWithNotes().then(d => setDatesWithNotes(new Set(d)));
  }, [selectedDate]);

  useEffect(() => {
    if (previewDate) getNotesByDate(previewDate).then(setPreviewNotes);
    else setPreviewNotes([]);
  }, [previewDate]);

  const { year, month } = view;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  const goToday = () => setView({ year: new Date().getFullYear(), month: new Date().getMonth() });

  const handleDayClick = (dateStr: string) => {
    if (previewDate === dateStr) {
      onDateSelect(dateStr); // second click → navigate
    } else {
      setPreviewDate(dateStr);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Calendar</h1>
      </div>

      <div className={styles.body}>
        {/* Calendar */}
        <div className={styles.calendarPanel}>
          {/* Month nav */}
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={prevMonth}>‹</button>
            <button className={styles.monthTitle} onClick={goToday}>
              {MONTHS[month]} {year}
            </button>
            <button className={styles.navBtn} onClick={nextMonth}>›</button>
          </div>

          {/* Day headers */}
          <div className={styles.dayHeaders}>
            {DAYS.map(d => <span key={d} className={styles.dayHeader}>{d}</span>)}
          </div>

          {/* Grid */}
          <div className={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const dateStr = toDateStr(day);
              const isToday_ = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const isPreviewed = dateStr === previewDate;
              const hasNotes = datesWithNotes.has(dateStr);
              return (
                <button
                  key={dateStr}
                  className={`${styles.dayCell}
                    ${isToday_ ? styles.today : ''}
                    ${isSelected ? styles.selected : ''}
                    ${isPreviewed && !isSelected ? styles.previewed : ''}
                  `}
                  onClick={() => handleDayClick(dateStr)}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {hasNotes && <span className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} />}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={styles.dot} style={{background:'var(--accent)'}} /> Has notes</span>
            <span className={styles.legendItem}><span className={styles.todayDot} /> Today</span>
          </div>
        </div>

        {/* Preview panel */}
        <div className={styles.previewPanel}>
          {!previewDate ? (
            <div className={styles.previewEmpty}>
              <span style={{fontSize:40}}>📅</span>
              <p>Click a day to preview its notes</p>
            </div>
          ) : (
            <>
              <div className={styles.previewHeader}>
                <div>
                  <p className={styles.previewDateLabel}>
                    {previewDate === today ? 'Today' : previewDate}
                  </p>
                  <p className={styles.previewCount}>{previewNotes.length} note{previewNotes.length !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={() => onDateSelect(previewDate)}>
                  Open Workspace →
                </button>
              </div>

              {previewNotes.length === 0 ? (
                <div className={styles.previewEmpty} style={{paddingTop: 40}}>
                  <p style={{color:'var(--text-muted)', fontSize:13}}>No notes on this day</p>
                </div>
              ) : (
                <div className={styles.previewList}>
                  {previewNotes.map(note => (
                    <button
                      key={note.id}
                      className={styles.previewNote}
                      onClick={() => onDateSelect(previewDate)}
                    >
                      <span className={styles.noteColorBar} style={{ background: note.color }} />
                      <div className={styles.noteInfo}>
                        <span className={styles.noteTitle}>{note.title || 'Untitled'}</span>
                        <span className={styles.noteType}>{note.type}</span>
                      </div>
                      <span style={{color:'var(--text-muted)'}}>›</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
