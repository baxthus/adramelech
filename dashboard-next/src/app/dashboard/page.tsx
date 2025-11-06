'use client';
import { SignOutButton, useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div>
      <h1>nyan</h1>
      {user && <p>Welcome, {user.emailAddresses[0]?.emailAddress}!</p>}
      <SignOutButton />
    </div>
  );
}
