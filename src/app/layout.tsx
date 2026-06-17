import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlowNote — Smart Daily Notes',
  description: 'Daily notes, checklists with carry-forward, sub-notes, and reminders. Fully offline productivity tool.',
  keywords: ['notes', 'productivity', 'checklist', 'daily planner', 'offline'],
  openGraph: {
    title: 'FlowNote',
    description: 'Smart daily notes with carry-forward checklists.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
