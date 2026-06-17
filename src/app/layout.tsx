import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlowNote — Smart Daily Notes',
  description: 'Daily notes, checklists with carry-forward, sub-notes, and reminders. Fully offline productivity tool.',
  keywords: ['notes', 'productivity', 'checklist', 'daily planner', 'offline'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlowNote',
  },
  openGraph: {
    title: 'FlowNote',
    description: 'Smart daily notes with carry-forward checklists.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
