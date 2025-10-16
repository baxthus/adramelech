'use client';
import Loading from '@/components/Loading';
import SearchField from '@/components/SearchField';
import { useAuth } from '@clerk/nextjs';
import { Alert, Button } from '@heroui/react';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { getPhrases } from './actions';

export default function PhrasesPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const {
    data: phrases,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: !!isSignedIn,
    queryKey: ['phrases', searchTerm],
    queryFn: () => getPhrases(searchTerm),
  });

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) redirect('/sign-in');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-4xl font-bold">Notes</p>
        <div className="flex items-center gap-x-2">
          <Button color="primary" isIconOnly aria-label="Add Phrase">
            <IconPlus />
          </Button>
          <Button
            variant="flat"
            isIconOnly
            aria-label="Refresh"
            onPress={() => refetch()}
            isDisabled={isLoading || isRefetching}
          >
            <IconRefresh />
          </Button>
        </div>
      </div>
      <SearchField
        name="phrases"
        onSearch={setSearchTerm}
        className="max-w-md"
      />
      {isError && (
        <Alert
          color="danger"
          title="Failed to load phrases"
          description={error?.message}
          endContent={
            <Button color="danger" variant="flat" onPress={() => refetch()}>
              Retry
            </Button>
          }
          className="max-w-md"
        />
      )}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {JSON.stringify(phrases)}
        </div>
      )}
    </div>
  );
}
