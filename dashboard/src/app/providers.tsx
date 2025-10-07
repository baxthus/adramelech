'use client';
import { ThemedClerkProvider } from '@/components/providers/ThemedClerkProvider';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
      <ThemedClerkProvider>
        <HeroUIProvider>
          <ToastProvider
            toastProps={{
              timeout: 3000,
            }}
          />
          {children}
        </HeroUIProvider>
      </ThemedClerkProvider>
    </ThemeProvider>
  );
}
