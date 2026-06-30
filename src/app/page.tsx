'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Workspace from '@/components/Workspace';
import CalendarView from '@/components/CalendarView';
import SettingsPanel from '@/components/SettingsPanel';
import { runCarryForward } from '@/services/carryForwardService';
import styles from './page.module.css';

type Page = 'workspace' | 'calendar' | 'settings';

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  if (dateStr === tomorrow) return 'Tomorrow';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PAGE_ICONS: Record<Page, string> = {
  workspace: '📝',
  calendar: '📅',
  settings: '⚙️',
};
const PAGE_LABELS: Record<Page, string> = {
  workspace: 'Today',
  calendar: 'Calendar',
  settings: 'Settings',
};

export default function Home() {
  const [page, setPage] = useState<Page>('workspace');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [ready, setReady] = useState(false);
  const [carryCount, setCarryCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    runCarryForward()
      .then((count) => { setCarryCount(count); setReady(true); })
      .catch(() => setReady(true));
  }, []);

  const handlePageChange = (p: string) => {
    setPage(p as Page);
    setSidebarOpen(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setPage('workspace');
    setSidebarOpen(false);
  };

  if (!ready) {
    return (
      <div className={styles.splash}>
        <div className={styles.splashContent}>
          <span className={styles.splashIcon}>📋</span>
          <h1 className={styles.splashTitle}>FlowNote</h1>
          <p className={styles.splashSub}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>

      {/* ── Sidebar overlay backdrop (mobile) ── */}
      {sidebarOpen && (
        <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar: desktop = fixed column | mobile = hidden overlay ── */}
      <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <Sidebar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          activePage={page}
          onPageChange={handlePageChange}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Main column: top-bar → content → bottom-nav ── */}
      <main className={styles.main}>

        {/* Mobile top bar */}
        <div className={styles.mobileTopBar}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
          <span className={styles.mobileTitle}>
            {PAGE_ICONS[page]} {page === 'workspace' ? formatDateLabel(selectedDate) : PAGE_LABELS[page]}
          </span>
          <div style={{ width: 40 }} />
        </div>

        {/* Carry-forward banner */}
        {carryCount > 0 && (
          <div className={styles.carryBanner}>
            ↩ {carryCount} task{carryCount > 1 ? 's' : ''} carried forward
            <button className={styles.dismissBtn} onClick={() => setCarryCount(0)}>✕</button>
          </div>
        )}

        {/* Page content — flex:1, scrollable */}
        <div className={styles.pageContent}>
          {page === 'workspace' && <Workspace date={selectedDate} />}
          {page === 'calendar' && (
            <CalendarView selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          )}
          {page === 'settings' && <SettingsPanel />}
        </div>

        {/* ── Mobile bottom tab bar (inside main so it sits BELOW content) ── */}
        <nav className={styles.bottomNav}>
          {(['workspace', 'calendar', 'settings'] as Page[]).map((p) => (
            <button
              key={p}
              className={`${styles.bottomTab} ${page === p ? styles.bottomTabActive : ''}`}
              onClick={() => handlePageChange(p)}
            >
              <span className={styles.bottomTabIcon}>{PAGE_ICONS[p]}</span>
              <span className={styles.bottomTabLabel}>{PAGE_LABELS[p]}</span>
            </button>
          ))}
        </nav>

      </main>
    </div>
  );
}
