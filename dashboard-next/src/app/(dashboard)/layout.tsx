import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PageTransition } from '@/components/dashboard/page-transition';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <PageTransition>{children}</PageTransition>
    </SidebarProvider>
  );
}
