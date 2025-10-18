'use client';
import { ThemedClerkProvider } from '@/components/providers/ThemedClerkProvider';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000 * 60, // 5 minutes
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) return createQueryClient();
  if (!browserQueryClient) browserQueryClient = createQueryClient();
  return browserQueryClient;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const router = useRouter();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
        <ThemedClerkProvider>
          <HeroUIProvider navigate={router.push}>
            <ToastProvider
              toastProps={{
                timeout: 3000,
              }}
            />
            {children}
          </HeroUIProvider>
        </ThemedClerkProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
