'use client';
import { useState } from 'react';
import { ButtonGroup } from './ui/button-group';
import { Button } from './ui/button';
import { Search, X } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './ui/input-group';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/use-search';

interface Props {
  name: string;
  className?: string;
}

export function SearchField({ name, className }: Props) {
  const [search, setSearch] = useSearch();
  const [searchInput, setSearchInput] = useState(search);

  const handleSearch = () => setSearch(searchInput);

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
  };

  return (
    <ButtonGroup className={cn('w-full sm:w-md', className)}>
      <InputGroup>
        <InputGroupInput
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder={`Search ${name}...`}
          onKeyUp={e => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <InputGroupAddon align="inline-end">
          {searchInput.length > 0 && (
            <InputGroupButton
              onClick={handleClear}
              size="icon-xs"
              className="rounded-full"
            >
              <X />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
      <Button variant="outline" size="icon" onClick={handleSearch}>
        <Search />
      </Button>
    </ButtonGroup>
  );
}
