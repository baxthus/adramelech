'use client';
import DashboardInset from '@/components/dashboard/inset';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deletePhrase, getPhrases } from './actions';
import { SearchField } from '@/components/search-field';
import { Button } from '@/components/ui/button';
import { MoreVertical, RefreshCw, Trash } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import type { ColumnDef, Row } from '@tanstack/react-table';
import type { Phrase } from 'database/schemas/schema';
import { UUIDRender } from '@/components/uuid-render';
import { formatDate } from '@/utils/date';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mapToDropdownMenuItems, type DropdownItem } from '@/utils/dropdown';
import { copyToClipboard } from '@/utils/clipboard';
import { toast } from 'sonner';
import { Loading } from '@/components/loading';
import Alert from '@/components/alert';

export default function PhrasesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { isSignedIn, isLoaded } = useAuth();

  const queryClient = useQueryClient();
  const {
    data: phrases,
    isLoading,
    isRefetching,
    isSuccess,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: isSignedIn,
    queryKey: ['phrases', searchTerm],
    queryFn: () => getPhrases(searchTerm),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePhrase(id),
    onMutate: () => {
      const toastId = toast.loading('Deleting phrase...');
      return { toastId };
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['phrases'] });
      toast.success('Phrase deleted', {
        id: context.toastId,
      });
    },
    onError: (error, _, context) => {
      toast.error(`Failed to delete phrase`, {
        id: context?.toastId,
        description: error.message,
      });
    },
  });

  const columns: Array<ColumnDef<Phrase>> = [
    {
      accessorKey: 'id',
      header: '#',
      cell: ({ row }) => <UUIDRender value={row.original.id} />,
    },
    {
      accessorKey: 'content',
      header: 'Content',
      cell: ({ row }) => (
        <span className="whitespace-pre">{row.original.content}</span>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <span className="whitespace-pre">
          {row.original.source.replace(/;\s/g, '\n')}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <span className="sr-only">Open Menu</span>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {mapToDropdownMenuItems(getRowActions(row))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const getRowActions = (row: Row<Phrase>): Array<DropdownItem> => [
    {
      label: 'Copy ID',
      onClick: () => copyToClipboard(row.original.id, 'ID'),
    },
    {
      label: 'Copy Content',
      onClick: () => copyToClipboard(row.original.content, 'Content'),
    },
    {
      label: 'Copy Source',
      onClick: () => copyToClipboard(row.original.source, 'Source'),
    },
    {
      label: 'Copy Unix Timestamp',
      onClick: () =>
        copyToClipboard(
          row.original.createdAt.getTime().toString(),
          'Unix Timestamp',
        ),
    },
    { type: 'separator' },
    {
      label: 'Delete',
      variant: 'destructive',
      icon: <Trash />,
      onClick: () => deleteMutation.mutate(row.original.id),
    },
  ];

  if (!isLoaded) return <Loading description="Checking authentication..." />;
  if (!isSignedIn) redirect('/sign-in');

  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Phrases',
          href: '/dashboard/phrases',
        },
      ]}
    >
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between gap-x-2">
          <SearchField name="phrases" onSearch={setSearchTerm} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw />
          </Button>
        </div>
        {isLoading && <Loading description="Fetching phrases..." />}
        {isSuccess && (
          <DataTable
            data={phrases || []}
            columns={columns}
            onRefresh={refetch}
          />
        )}
        {isError && (
          <Alert
            title="Failed to load phrases"
            description={error.message}
            variant="destructive"
          />
        )}
      </div>
    </DashboardInset>
  );
}
