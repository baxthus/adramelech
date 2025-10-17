'use client';
import Loading from '@/components/Loading';
import SearchField from '@/components/SearchField';
import { useAuth } from '@clerk/nextjs';
import {
  addToast,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { getPhrases, deletePhrase } from './actions';

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

  const deleteMutation = useMutation({
    mutationFn: deletePhrase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phrases'] });
      addToast({ title: 'Phrase deleted', color: 'success' });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to delete phrase',
        description: error?.message,
        color: 'danger',
      });
    },
  });

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) redirect('/sign-in');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-4xl font-bold">Phrases</p>
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
        <Table isVirtualized>
          <TableHeader>
            <TableColumn>ID</TableColumn>
            <TableColumn>CONTENT</TableColumn>
            <TableColumn>SOURCE</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No phrases found">
            {phrases?.map((phrase) => (
              <TableRow key={phrase.id}>
                <TableCell>{phrase.id}</TableCell>
                <TableCell>{phrase.content}</TableCell>
                <TableCell>{phrase.source}</TableCell>
                <TableCell>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    isIconOnly
                    onPress={() => deleteMutation.mutate(phrase.id)}
                  >
                    <IconTrash size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            )) || []}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
