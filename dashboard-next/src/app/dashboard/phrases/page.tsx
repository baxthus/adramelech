'use client';
import DashboardInset from '@/components/dashboard/inset';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getPhrases } from './actions';
import { SearchField } from '@/components/search-field';

export default function PhrasesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: phrases,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['phrases', searchTerm],
    queryFn: () => getPhrases(searchTerm),
  });

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
        <SearchField name="phrases" onSearch={setSearchTerm} />
        <p>{searchTerm}</p>
        <p>{JSON.stringify(phrases)}</p>
      </div>
    </DashboardInset>
  );
}
