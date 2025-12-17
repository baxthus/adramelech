'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { use } from 'react';
import { getFeedback } from './actions';
import { Loading } from '@/components/loading';
import { redirect } from 'next/navigation';
import Alert from '@/components/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { FeedbackStatusClasses } from '../utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusUpdate } from './stauts-update';

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isSignedIn, isLoaded } = useAuth();

  const queryClient = useQueryClient();
  const {
    data: feedback,
    isLoading,
    isError,
    error,
  } = useQuery({
    enabled: !!isSignedIn,
    queryKey: ['feedback', id],
    queryFn: () => getFeedback(id),
  });

  if (!isLoaded) return <Loading description="Checking authentication..." />;
  if (!isSignedIn) redirect('/dashboard/sign-in');

  if (isLoading) return <Loading description="Loading feedback..." />;
  if (isError)
    return (
      <Alert
        title="Failed to load feedback"
        description={error.message}
        variant="destructive"
      />
    );

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Feedback Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">
                Title
              </h3>
              <p className="text-base">{feedback!.title}</p>
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">
                Status
              </h3>
              <Badge
                className={cn(
                  FeedbackStatusClasses[feedback!.status],
                  'mt-1.5',
                )}
              >
                {feedback!.status}
              </Badge>
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">
                Content
              </h3>
              <p className="text-base whitespace-pre-wrap">
                {feedback!.content}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Created At
                </h3>
                <p className="text-base">{formatDate(feedback!.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Updated At
                </h3>
                <p className="text-base">{formatDate(feedback!.updatedAt)}</p>
              </div>
            </div>
            <div>
              <h3 className="text-muted-foreground text-sm font-medium">
                Actions
              </h3>
              <div className="mt-2 flex w-fit flex-col gap-y-2">
                <Button
                  size="sm"
                  render={
                    <Link href={`/profiles?search=${feedback!.profileId}`} />
                  }
                >
                  View author
                </Button>
                <StatusUpdate
                  queryClient={queryClient}
                  id={feedback!.id}
                  status={feedback!.status}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
