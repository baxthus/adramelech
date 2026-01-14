'use client';

import { usePage } from '@/hooks/use-page';
import { useSearch } from '@/hooks/use-search';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw, Trash } from 'lucide-react';
import { Loading } from '@/components/loading';
import { redirect } from 'next/navigation';
import DashboardInset from '@/components/dashboard/inset';
import { SearchField } from '@/components/search-field';
import Alert from '@/components/alert';
import { DataTable } from '@/components/dashboard/data-table';
import { mapToDropdownMenuItems, type DropdownItem } from '@/utils/dropdown';
import { copyToClipboard } from '@/utils/clipboard';
import { deleteSocial, getSocials } from '@/actions/socials';

export default function SocialsPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const [search] = useSearch();
  const [page] = usePage();

  const queryClient = useQueryClient();
  const {
    data: socials,
    isLoading,
    isRefetching,
    isSuccess,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: !!isSignedIn,
    queryKey: ['socials', search, page],
    queryFn: () => getSocials(search, page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSocial(id),
    onMutate: () => {
      const toastId = toast.loading('Deleting social...');
      return { toastId };
    },
    onSuccess: async (_, __, context) => {
      await queryClient.invalidateQueries({ queryKey: ['socials'] });
      toast.success('Social deleted', {
        id: context.toastId,
      });
    },
    onError: (err, _, context) => {
      toast.error(`Failed to delete phrase`, {
        id: context?.toastId,
        description: err.message,
      });
    },
  });

  type Response = Awaited<ReturnType<typeof getSocials>>['data'][number];

  const columns: Array<ColumnDef<Response>> = [
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
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="px-0"
          render={<Link href={row.original.url} target="_blank" />}
        >
          {row.original.url}
        </Button>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="ml-2 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <span className="sr-only">Open menu</span>
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
      label: 'Copy Name',
      onClick: () => copyToClipboard(row.original.name, 'Name'),
    },
    {
      label: 'Copy URL',
      onClick: () => copyToClipboard(row.original.url, 'URL'),
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
          title: 'Socials',
          href: '/socials',
        },
      ]}
    >
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between gap-x-2">
          <SearchField name="socials" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw />
          </Button>
        </div>
        {isLoading && <Loading description="Loading socials..." />}
        {isError && (
          <Alert
            title="Failed to load socials"
            description={error.message}
            variant="destructive"
          />
        )}
        {isSuccess && (
          <DataTable
            data={socials.data || []}
            columns={columns}
            onRefresh={refetch}
            enablePagination={true}
            pageCount={socials.pageCount}
          />
        )}
      </div>
    </DashboardInset>
  );
}
