import type { Metadata } from 'next';
import { Boldonse, Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['sans-serif'],
});

const boldonse = Boldonse({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-boldonse',
  display: 'swap',
  fallback: ['sans-serif'],
});

export const metadata: Metadata = {
  title: 'Adramelech Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${boldonse.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
