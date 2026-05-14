import { Search, FilterX } from 'lucide-react';
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
              <SelectTrigger className="h-10 w-full sm:w-44 bg-white border-slate-200 text-slate-700">
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
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="h-10 text-muted-foreground hover:text-foreground"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {searchKey && (
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200"
          />
        </div>
      )}
    </div>
  );
}
