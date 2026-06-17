'use client';
// src/components/Sidebar.tsx — Left navigation sidebar
import { useState, useEffect } from 'react';
import { getAllDatesWithNotes } from '@/db/noteRepository';
import styles from './Sidebar.module.css';

interface Props {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  activePage: string;
  onPageChange: (page: string) => void;
  onClose?: () => void;
}

export default function Sidebar({ selectedDate, onDateSelect, activePage, onPageChange, onClose }: Props) {
  const [recentDates, setRecentDates] = useState<string[]>([]);

  useEffect(() => {
    getAllDatesWithNotes().then(dates => setRecentDates(dates.slice(0, 7)));
  }, [selectedDate]);

  const today = new Date().toISOString().split('T')[0];

  function formatShort(dateStr: string): string {
    if (dateStr === today) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>📋</span>
        <div style={{ flex: 1 }}>
          <span className={styles.logoText}>FlowNote</span>
          <span className={styles.logoSub}>Web</span>
        </div>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">✕</button>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navItem} ${activePage === 'workspace' ? styles.active : ''}`}
          onClick={() => { onPageChange('workspace'); onDateSelect(today); }}
        >
          <span>📝</span> Today
        </button>
        <button
          className={`${styles.navItem} ${activePage === 'calendar' ? styles.active : ''}`}
          onClick={() => onPageChange('calendar')}
        >
          <span>📅</span> Calendar
        </button>
        <button
          className={`${styles.navItem} ${activePage === 'settings' ? styles.active : ''}`}
          onClick={() => onPageChange('settings')}
        >
          <span>⚙️</span> Settings
        </button>
      </nav>

      {/* Recent dates */}
      {recentDates.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Recent Days</p>
          {recentDates.map(date => (
            <button
              key={date}
              className={`${styles.dateItem} ${date === selectedDate ? styles.dateActive : ''}`}
              onClick={() => { onDateSelect(date); onPageChange('workspace'); }}
            >
              <span className={styles.dateName}>{formatShort(date)}</span>
              <span className={styles.dateNum}>{date}</span>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>🔒 All data stored locally</p>
        <p className={styles.footerVersion}>v1.0.0</p>
      </div>
    </aside>
  );
}
