import { useSearchParams } from 'next/navigation';

export function usePage() {
  const searchParams = useSearchParams();
  return parseInt(searchParams.get('page') || '1', 10) || 1;
}
