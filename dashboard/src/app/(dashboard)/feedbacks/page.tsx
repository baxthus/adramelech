'use client';

import { usePage } from '@/hooks/use-page';
import { useSearch } from '@/hooks/use-search';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteFeedback, getFeedbacks } from './actions';
import { toast } from 'sonner';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { formatDate } from '@/utils/date';
import { Loading } from '@/components/loading';
import { redirect } from 'next/navigation';
import DashboardInset from '@/components/dashboard/inset';
import { SearchField } from '@/components/search-field';
import { Button } from '@/components/ui/button';
import { Eye, MoreVertical, RefreshCw, Trash } from 'lucide-react';
import Alert from '@/components/alert';
import { DataTable } from '@/components/dashboard/data-table';
import { capitalize } from '@/utils/text';
import { mapToDropdownMenuItems, type DropdownItem } from '@/utils/dropdown';
import { copyToClipboard } from '@/utils/clipboard';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Feedback } from 'database/generated/prisma/client';

export default function FeedbacksPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const [search] = useSearch();
  const [page] = usePage();

  const queryClient = useQueryClient();
  const {
    data: feedbacks,
    isLoading,
    isRefetching,
    isSuccess,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: !!isSignedIn,
    queryKey: ['feedbacks', search, page],
    queryFn: () => getFeedbacks(search, page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onMutate: () => {
      const toastId = toast.loading('Deleting feedback...');
      return { toastId };
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast.success('Feedback deleted', {
        id: context.toastId,
      });
    },
    onError: (err, _, context) => {
      toast.error('Failed to delete feedback', {
        id: context?.toastId,
        description: err.message,
      });
    },
  });

  const columns: ColumnDef<Feedback>[] = [
    {
      accessorKey: 'id',
      header: '#',
    },
    {
      accessorKey: 'profileId',
      header: 'Profile ID',
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => capitalize(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="ml-2 space-x-2 text-right">
          <Button variant="secondary" size="icon-sm" asChild>
            <Link href={`/feedbacks/${row.original.id}`}>
              <Eye />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <span className="sr-only">Open Menu</span>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {mapToDropdownMenuItems(getRowActions(row))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const getRowActions = (row: Row<Feedback>): Array<DropdownItem> => [
    {
      label: 'Copy ID',
      onClick: () => copyToClipboard(row.original.id, 'ID'),
    },
    {
      label: 'Copy Profile ID',
      onClick: () => copyToClipboard(row.original.profileId, 'Profile ID'),
    },
    {
      label: 'Copy Title',
      onClick: () => copyToClipboard(row.original.title, 'Title'),
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
  if (!isSignedIn) return redirect('/sign-in');

  return (
    <DashboardInset
      breadcrumbs={[
        {
          title: 'Feedbacks',
          href: '/feedbacks',
        },
      ]}
    >
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between gap-x-2">
          <SearchField name="feedbacks" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw />
          </Button>
        </div>
        {isLoading && <Loading description="Loading feedbacks..." />}
        {isError && (
          <Alert
            title="Failed to load feedbacks"
            description={error.message}
            variant="destructive"
          />
        )}
        {isSuccess && (
          <DataTable
            data={feedbacks.data || []}
            columns={columns}
            onRefresh={refetch}
            enablePagination={true}
            pageCount={feedbacks.pageCount}
          />
        )}
      </div>
    </DashboardInset>
  );
}
