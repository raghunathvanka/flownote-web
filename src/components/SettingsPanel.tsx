'use client';
// src/components/SettingsPanel.tsx
import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '@/db/settingsRepository';
import styles from './SettingsPanel.module.css';

export default function SettingsPanel() {
  const [carryForward, setCarryForward] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [cleared, setCleared] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      getSetting('carry_forward_enabled', 'true'),
      getSetting('theme', 'dark'),
    ]).then(([cf, th]) => {
      setCarryForward(cf === 'true');
      setTheme(th);
      setLoaded(true);
    });
  }, []);

  const toggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    await setSetting(key, value ? 'true' : 'false');
  };

  const handleThemeChange = async (t: string) => {
    setTheme(t);
    await setSetting('theme', t);
  };

  const handleClearData = async () => {
    if (!confirm('⚠️ This will permanently delete ALL notes and checklists. Are you sure?')) return;
    const { getDB } = await import('@/db/schema');
    const db = await getDB();
    const tx = db.transaction(['notes', 'checklistItems'], 'readwrite');
    await tx.objectStore('notes').clear();
    await tx.objectStore('checklistItems').clear();
    await tx.done;
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const handleResetCarryForward = async () => {
    await setSetting('last_carry_forward_date', '');
    alert('Carry-forward will run again on next page load.');
  };

  if (!loaded) return <div className={styles.loading}>Loading settings…</div>;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize your FlowNote experience</p>
      </div>

      <div className={styles.sections}>

        {/* Appearance */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎨 Appearance</h2>
          <div className={styles.card}>
            <div className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Theme</span>
                <span className={styles.rowDesc}>Choose your preferred color scheme</span>
              </div>
              <div className={styles.themeOptions}>
                {['dark', 'light', 'glass'].map(t => (
                  <button
                    key={t}
                    className={`${styles.themeBtn} ${theme === t ? styles.themeBtnActive : ''}`}
                    onClick={() => handleThemeChange(t)}
                  >
                    {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '🔮'} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tasks */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>✅ Tasks & Carry-Forward</h2>
          <div className={styles.card}>
            <div className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Carry Forward Incomplete Tasks</span>
                <span className={styles.rowDesc}>Automatically move unfinished checklist items to the next day on first launch</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" checked={carryForward}
                  onChange={(e) => toggle('carry_forward_enabled', e.target.checked, setCarryForward)} />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Reset Carry-Forward</span>
                <span className={styles.rowDesc}>Force carry-forward to run again on next reload</span>
              </div>
              <button className="btn btn-ghost" onClick={handleResetCarryForward}>Reset</button>
            </div>
          </div>
        </section>

        {/* Due Date Colors */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎯 Due Date Status Colors</h2>
          <div className={styles.card}>
            <div className={styles.colorGuide}>
              <div className={styles.colorRow}>
                <span className="badge badge-green">On Track</span>
                <span className={styles.colorDesc}>Due date is more than 1 day away</span>
              </div>
              <div className={styles.colorRow}>
                <span className="badge badge-orange">Due Soon</span>
                <span className={styles.colorDesc}>Due today or tomorrow</span>
              </div>
              <div className={styles.colorRow}>
                <span className="badge badge-red">Overdue</span>
                <span className={styles.colorDesc}>Past the due date</span>
              </div>
            </div>
          </div>
        </section>

        {/* Data */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>💾 Data Management</h2>
          <div className={styles.card}>
            <div className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Storage</span>
                <span className={styles.rowDesc}>All data is stored in your browser's IndexedDB — fully offline, never leaves your device</span>
              </div>
              <span className={styles.badge}>🔒 Local</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Clear All Data</span>
                <span className={styles.rowDesc}>Permanently delete all notes and checklist items</span>
              </div>
              <button className="btn btn-danger" onClick={handleClearData}>
                {cleared ? '✓ Cleared' : '🗑 Clear All'}
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>ℹ️ About FlowNote Web</h2>
          <div className={styles.card}>
            <div className={styles.about}>
              <p className={styles.aboutVersion}>FlowNote Web <strong>v1.0.0</strong></p>
              <p className={styles.aboutDesc}>
                A powerful productivity tool with daily workspaces, checklists, carry-forward engine,
                linked sub-notes, and due date tracking — all running offline in your browser.
              </p>
              <div className={styles.features}>
                {[
                  '📋 Checklist notes with carry-forward',
                  '🎯 Per-item due dates (Green/Orange/Red)',
                  '🔗 Sub-notes linked to checklist items',
                  '📅 Calendar workspace per day',
                  '📝 Text & Reminder notes',
                  '🔒 Fully offline — IndexedDB storage',
                ].map((f, i) => (
                  <span key={i} className={styles.feature}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
