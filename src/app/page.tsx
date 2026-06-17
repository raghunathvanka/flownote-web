'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Workspace from '@/components/Workspace';
import CalendarView from '@/components/CalendarView';
import SettingsPanel from '@/components/SettingsPanel';
import { runCarryForward } from '@/services/carryForwardService';
import styles from './page.module.css';

type Page = 'workspace' | 'calendar' | 'settings';

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

  // Close sidebar when page changes on mobile
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

      {/* Sidebar overlay backdrop (mobile only) */}
      {sidebarOpen && (
        <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <Sidebar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          activePage={page}
          onPageChange={handlePageChange}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className={styles.main}>
        {/* Mobile top bar */}
        <div className={styles.mobileTopBar}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
          <div className={styles.mobileTitle}>
            <span>{PAGE_ICONS[page]}</span>
            <span>{PAGE_LABELS[page]}</span>
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* Carry-forward notification */}
        {carryCount > 0 && (
          <div className={styles.carryBanner}>
            ↩ {carryCount} task{carryCount > 1 ? 's' : ''} carried forward
            <button className={styles.dismissBtn} onClick={() => setCarryCount(0)}>✕</button>
          </div>
        )}

        {/* Page content */}
        <div className={styles.pageContent}>
          {page === 'workspace' && <Workspace date={selectedDate} />}
          {page === 'calendar' && (
            <CalendarView selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          )}
          {page === 'settings' && <SettingsPanel />}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
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
    </div>
  );
}
