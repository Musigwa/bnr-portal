import { useState, useMemo } from 'react';
import { FilterDef } from './types';

export function useDataTable<T extends { id: string | number }>(
  data: T[],
  options: {
    searchKey?: keyof T;
    filters?: FilterDef[];
    initialPageSize?: number;
  } = {}
) {
  const { searchKey, filters = [], initialPageSize = 10 } = options;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchQuery && searchKey) {
        const value = String(item[searchKey]).toLowerCase();
        if (!value.includes(searchQuery.toLowerCase())) return false;
      }
      for (const filter of filters) {
        const selectedValue = activeFilters[filter.key];
        if (selectedValue && selectedValue !== 'all') {
          if (String((item as Record<string, unknown>)[filter.key]) !== selectedValue) return false;
        }
      }
      return true;
    });
  }, [data, searchQuery, searchKey, filters, activeFilters]);

  const totalFiltered = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
    },
    paginatedData,
    totalFiltered,
    totalPages,
    clearFilters: () => {
      setSearchQuery('');
      setActiveFilters({});
      setCurrentPage(1);
    },
    handleFilterChange: (key: string, value: string) => {
      setActiveFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    }
  };
}
