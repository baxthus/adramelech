'use client';

import DashboardInset from '@/components/dashboard/inset';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProfile, getProfiles } from './actions';
import { usePage } from '@/hooks/use-page';
import { toast } from 'sonner';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { Eye, MoreVertical, RefreshCw, Trash } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { mapToDropdownMenuItems, type DropdownItem } from '@/utils/dropdown';
import { copyToClipboard } from '@/utils/clipboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Loading } from '@/components/loading';
import { SearchField } from '@/components/search-field';
import Alert from '@/components/alert';
import { DataTable } from '@/components/dashboard/data-table';
import { Nothing } from '@/components/nothing';
import { useSearch } from '@/hooks/use-search';
import type { Profile } from 'database/generated/prisma/client';
import { toUnixTimestamps } from '@root/utils/date';

export default function ProfilesPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const [search] = useSearch();
  const [page] = usePage();

  const queryClient = useQueryClient();
  const {
    data: profiles,
    isLoading,
    isRefetching,
    isSuccess,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: !!isSignedIn,
    queryKey: ['profiles', search, page],
    queryFn: () => getProfiles(search, page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onMutate: () => {
      const toastId = toast.loading('Deleting profile...');
      return { toastId };
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile deleted', {
        id: context.toastId,
      });
    },
    onError: (err, _, context) => {
      toast.error('Failed to delete phrase', {
        id: context?.toastId,
        description: err.message,
      });
    },
  });

  type Response = Omit<Profile, 'bio'>;

  const columns: Array<ColumnDef<Response>> = [
    {
      accessorKey: 'id',
      header: '#',
    },
    {
      accessorKey: 'discordId',
      header: 'Discord ID',
    },
    {
      accessorKey: 'nickname',
      header: 'Nickname',
      cell: ({ row }) => row.original.nickname || <Nothing />,
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
        <div className="ml-2 space-x-2 text-right">
          <Button variant="secondary" size="icon-sm" asChild>
            <Link href={`/profiles/${row.original.id}`}>
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

  const getRowActions = (row: Row<Response>): Array<DropdownItem> => [
    {
      label: 'Copy ID',
      onClick: () => copyToClipboard(row.original.id, 'ID'),
    },
    {
      label: 'Copy Discord ID',
      onClick: () => copyToClipboard(row.original.discordId, 'Discord ID'),
    },
    {
      label: 'Copy Nickname',
      onClick: () => copyToClipboard(row.original.nickname || '', 'Nickname'),
    },
    {
      label: 'Copy Created Timestamp',
      onClick: () =>
        copyToClipboard(
          toUnixTimestamps(row.original.createdAt.getTime()).toString(),
          'Created Timestamp',
        ),
    },
    {
      label: 'Copy Updated Timestamp',
      onClick: () =>
        copyToClipboard(
          toUnixTimestamps(row.original.updatedAt.getTime()).toString(),
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
          title: 'Profiles',
          href: '/profiles',
        },
      ]}
    >
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between gap-x-2">
          <SearchField name="profiles" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw />
          </Button>
        </div>
        {isLoading && <Loading description="Loading profiles..." />}
        {isError && (
          <Alert
            title="Failed to load profiles"
            description={error.message}
            variant="destructive"
          />
        )}
        {isSuccess && (
          <DataTable
            data={profiles.data || []}
            columns={columns}
            onRefresh={refetch}
            enablePagination={true}
            pageCount={profiles.pageCount}
          />
        )}
      </div>
    </DashboardInset>
  );
}
