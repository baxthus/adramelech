import { cookies } from 'next/headers';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get('sidebar_state')?.value;

  return (
    <SidebarProvider
      defaultOpen={sidebarState ? sidebarState === 'true' : true}
    >
      <DashboardSidebar />
      {children}
    </SidebarProvider>
  );
}
