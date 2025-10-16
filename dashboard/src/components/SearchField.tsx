import debounce from '@/utils/debounce';
import { Input } from '@heroui/react';
import { IconSearch } from '@tabler/icons-react';
import { useMemo } from 'react';

export default function SearchField({
  name,
  onSearch,
  delay = 500,
  className,
}: {
  name: string;
  onSearch: (value: string) => void;
  delay?: number;
  className?: string;
}) {
  const debouncedOnSearch = useMemo(
    () => debounce(onSearch, delay),
    [onSearch, delay],
  );

  return (
    <Input
      placeholder={`Search ${name}...`}
      className={className}
      isClearable
      startContent={<IconSearch stroke={1.5} size={20} />}
      onValueChange={debouncedOnSearch}
      onClear={() => onSearch('')}
    />
  );
}
