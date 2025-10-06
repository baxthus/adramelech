'use client';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
      <HeroUIProvider>
        <ToastProvider
          toastProps={{
            timeout: 3000,
          }}
        />
        {children}
      </HeroUIProvider>
    </ThemeProvider>
  );
}
