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
import { IconEye, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { deleteProfile, getProfiles } from './actions';
import { formatDate } from '@/utils/date';
import Link from 'next/link';

export default function ProfilesPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const {
    data: profiles,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    enabled: !!isSignedIn,
    queryKey: ['profiles', searchTerm],
    queryFn: () => getProfiles(searchTerm),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      addToast({ title: 'Profile deleted', color: 'success' });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to delete profile',
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
        <p className="text-4xl font-bold">Profiles</p>
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
      <SearchField
        name="profiles"
        onSearch={setSearchTerm}
        className="max-w-md"
      />
      {isError && (
        <Alert
          color="danger"
          title="Failed to load profiles"
          description={error?.message}
          endContent={
            <Button color="danger" variant="flat" onPress={() => refetch()}>
              Retry
            </Button>
          }
          className="max-w-md"
        />
      )}
      <Table
        isVirtualized
        isHeaderSticky
        isStriped
        className="overflow-x-auto"
        aria-label="Profiles Table"
      >
        <TableHeader>
          <TableColumn>DISCORD ID</TableColumn>
          <TableColumn>NICKNAME</TableColumn>
          <TableColumn>BIO</TableColumn>
          <TableColumn>CREATED AT</TableColumn>
          <TableColumn align="center">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="No profiles found"
          isLoading={isLoading}
          loadingContent={<Loading />}
        >
          {profiles?.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>{profile.discordId}</TableCell>
              <TableCell>{profile.nickname ?? 'N/A'}</TableCell>
              <TableCell>{profile.bio ?? 'N/A'}</TableCell>
              <TableCell>{formatDate(profile.createdAt)}</TableCell>
              <TableCell>
                <div className="flex justify-center gap-x-2">
                  <Button
                    as={Link}
                    color="primary"
                    variant="flat"
                    size="sm"
                    isIconOnly
                    href={`/dashboard/profiles/${profile.id}`}
                  >
                    <IconEye size={18} />
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    isIconOnly
                    onPress={() => deleteMutation.mutate(profile.id)}
                  >
                    <IconTrash size={18} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )) || []}
        </TableBody>
      </Table>
    </div>
  );
}
