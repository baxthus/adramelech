'use client';
import { UserProfile } from '@clerk/nextjs';
import { IconChevronLeft, IconDots } from '@tabler/icons-react';

export default function ProfilePage() {
  return (
    <UserProfile path="/profile" routing="path">
      <UserProfile.Link
        label="Back to Dashboard"
        labelIcon={<IconChevronLeft size={16} stroke={4} />}
        url="/dashboard"
      />
    </UserProfile>
  );
}
