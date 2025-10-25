'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { getProfile } from './actions';
import Loading from '@/components/Loading';
import { redirect } from 'next/navigation';
import { Alert, Button } from '@heroui/react';
import CodeBlock from '@/components/CodeBlock';

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isSignedIn, isLoaded } = useAuth();

  const { id } = use(params);

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: !!isSignedIn,
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
  });

  if (!isLoaded || isLoading) return <Loading />;
  if (!isSignedIn) redirect('/sign-in');

  if (isError)
    return (
      <Alert
        color="danger"
        title="Failed to load profile"
        description={error?.message}
        endContent={
          <Button color="danger" variant="flat" onPress={() => refetch()}>
            Retry
          </Button>
        }
      />
    );

  if (!profile) return 'Oh no!';

  const jsonProfile = JSON.stringify(profile, null, 2);

  return (
    <div className="space-y-4">
      <p className="text-3xl font-bold">Profile Viewer</p>
      {/* temporary (i hope) */}
      <CodeBlock code={jsonProfile} />
    </div>
  );
}
