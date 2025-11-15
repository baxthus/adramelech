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

interface Props {
  name: string;
  className?: string;
  onSearch: (value: string) => void;
}

export function SearchField({ name, className, onSearch }: Props) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => onSearch(searchInput);

  const handleClear = () => {
    setSearchInput('');
    onSearch('');
  };

  return (
    <ButtonGroup className={cn('w-md max-w-full', className)}>
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
