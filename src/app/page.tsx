'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Workspace from '@/components/Workspace';
import CalendarView from '@/components/CalendarView';
import SettingsPanel from '@/components/SettingsPanel';
import { runCarryForward } from '@/services/carryForwardService';
import styles from './page.module.css';

type Page = 'workspace' | 'calendar' | 'settings';

export default function Home() {
  const [page, setPage] = useState<Page>('workspace');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [ready, setReady] = useState(false);
  const [carryCount, setCarryCount] = useState(0);

  useEffect(() => {
    // Initialize DB and run carry-forward on first load
    runCarryForward()
      .then((count) => {
        setCarryCount(count);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setPage('workspace');
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
      <Sidebar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        activePage={page}
        onPageChange={(p) => setPage(p as Page)}
      />

      <main className={styles.main}>
        {/* Carry-forward notification */}
        {carryCount > 0 && (
          <div className={styles.carryBanner}>
            ↩ {carryCount} incomplete task{carryCount > 1 ? 's' : ''} carried forward from previous days
            <button className={styles.dismissBtn} onClick={() => setCarryCount(0)}>✕</button>
          </div>
        )}

        {page === 'workspace' && <Workspace date={selectedDate} />}
        {page === 'calendar' && (
          <CalendarView selectedDate={selectedDate} onDateSelect={handleDateSelect} />
        )}
        {page === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}
