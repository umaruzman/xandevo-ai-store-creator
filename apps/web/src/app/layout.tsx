import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Xandevo — AI Store Builder',
  description: 'Describe a store in natural language; Xandevo generates, previews, and saves it.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
