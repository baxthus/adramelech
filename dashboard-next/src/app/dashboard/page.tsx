'use client';
import DashboardInset from '@/components/dashboard/inset';
import { SignOutButton, useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Home',
          href: '/dashboard',
        },
      ]}
    >
      <div>Welcome to the dashboard, {user?.firstName || 'User'}!</div>
      <SignOutButton />
    </DashboardInset>
  );
}
