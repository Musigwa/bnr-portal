import { Search, FilterX, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTableToolbarProps } from './types';
import { useEffect, useState } from 'react';

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchKey,
  filters = [],
  activeFilters,
  onFilterChange,
  onClear,
}: DataTableToolbarProps) {
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sync internal state with external prop (e.g. on clear or back button)
  if (searchQuery !== prevSearchQuery) {
    setInputValue(searchQuery);
    setPrevSearchQuery(searchQuery);
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        onSearchChange(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, onSearchChange, searchQuery]);

  const hasActiveFilters = searchQuery || Object.values(activeFilters).some(v => v && v !== 'all');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {filters.map((filter) => {
          const selectedValue = activeFilters[filter.key] || 'all';
          const selectedOption = filter.options.find(opt => opt.value === selectedValue);
          const displayLabel = selectedOption 
            ? selectedOption.label 
            : `All ${filter.label}${filter.label.toLowerCase().endsWith('s') ? 'es' : 's'}`;

          return (
            <Select
              key={filter.key}
              value={selectedValue}
              onValueChange={(val) => onFilterChange(filter.key, val ?? 'all')}
            >
              <SelectTrigger className="h-10 w-full sm:w-44 bg-card border-border text-foreground">
                <SelectValue>{displayLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All {filter.label}{filter.label.toLowerCase().endsWith('s') ? 'es' : 's'}
                </SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {hasActiveFilters && (
          <Button 
            variant="text" 
            size="sm" 
            onClick={onClear}
            className="text-primary hover:text-primary/80 font-normal ml-2 cursor-pointer"
          >
            <FilterX className="mr-1.5 h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
      </div>

      {searchKey && (
        <form 
          className="relative w-full sm:w-72" 
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9 pr-9 h-10 bg-card border-border"
            autoComplete="off"
            spellCheck={false}
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => setInputValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
