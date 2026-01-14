'use client';

import { usePage } from '@/hooks/use-page';
import { useSearch } from '@/hooks/use-search';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { mapToDropdownMenuItems, type DropdownItem } from '@/utils/dropdown';
import { copyToClipboard } from '@/utils/clipboard';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toUnixTimestamp } from '@repo/utils/date';
import { Badge } from '@/components/ui/badge';
import { FeedbackStatusClasses } from './utils';
import { deleteFeedback, getFeedbacks } from '@/actions/feedbacks';

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
    onSuccess: async (_, __, context) => {
      await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
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

  type Response = Awaited<ReturnType<typeof getFeedbacks>>['data'][number];

  const columns: ColumnDef<Response>[] = [
    {
      accessorKey: 'id',
      header: '#',
    },
    {
      accessorKey: 'profileId',
      header: 'Profile ID',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="px-0"
          render={<Link href={`/profiles?search=${row.original.profileId}`} />}
        >
          {row.original.profileId}
        </Button>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={FeedbackStatusClasses[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ row }) => formatDate(row.original.updatedAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="multiple-table-actions-container ml-2">
          <Button
            variant="secondary"
            size="icon-sm"
            render={<Link href={`/feedbacks/${row.original.id}`} />}
          >
            <Eye />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <span className="sr-only">Open Menu</span>
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-fit">
              {mapToDropdownMenuItems(getRowActions(row))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const getRowActions = (row: Row<Response>): Array<DropdownItem> => [
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
      label: 'Copy Created Timestamp',
      onClick: () =>
        copyToClipboard(
          toUnixTimestamp(row.original.createdAt).toString(),
          'Created Timestamp',
        ),
    },
    {
      label: 'Copy Updated Timestamp',
      onClick: () =>
        copyToClipboard(
          toUnixTimestamp(row.original.updatedAt).toString(),
          'Updated Timestamp',
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
