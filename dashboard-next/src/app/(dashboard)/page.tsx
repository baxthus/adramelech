'use client';
import DashboardInset from '@/components/dashboard/inset';

export default function DashboardPage() {
  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Home',
          href: '/',
        },
      ]}
    >
      <div>Welcome to the dashboard</div>
    </DashboardInset>
  );
}
