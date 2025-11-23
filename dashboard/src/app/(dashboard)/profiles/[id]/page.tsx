'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { redirect, useParams } from 'next/navigation';
import { getProfile } from './actions';
import { Loading } from '@/components/loading';
import Alert from '@/components/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Nothing } from '@/components/nothing';
import Link from 'next/link';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isSignedIn, isLoaded } = useAuth();

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

  if (!isLoaded) return <Loading description="Checking authentication..." />;
  if (!isSignedIn) redirect('/sign-in');

  if (isLoading) return <Loading description="Loading profile..." />;

  if (isError)
    return (
      <Alert
        title="Failed to load profile"
        description={
          <div className="space-y-2">
            <p>{error.message}</p>
            <Button variant="destructive" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        }
        variant="destructive"
      />
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Information about the user profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">ID</p>
            <p className="text-sm break-all">{profile!.id}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Nickname</p>
            <p className="text-sm font-medium">
              {profile!.nickname ?? <Nothing />}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Bio</p>
            <p className="max-h-32 overflow-auto text-sm wrap-break-word whitespace-pre-wrap">
              {profile!.bio ?? <Nothing />}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Socials</CardTitle>
          <CardDescription>Links to social media profiles</CardDescription>
        </CardHeader>
        <CardContent>{JSON.stringify(profile!.socials)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Feedbacks</CardTitle>
          <CardDescription>
            Feedbacks can be viewed on the feedbacks page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <Link href={`/feedbacks?search=${profile!.id}`}>
              View Feedbacks
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
