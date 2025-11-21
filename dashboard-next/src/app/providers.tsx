import QueryProvider from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider
        appearance={{
          theme: shadcn,
        }}
      >
        <NuqsAdapter>
          <QueryProvider>
            {children}
            <Toaster richColors />
          </QueryProvider>
        </NuqsAdapter>
      </ClerkProvider>
    </ThemeProvider>
  );
}
