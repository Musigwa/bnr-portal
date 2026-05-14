'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useTableQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const queryParams: Record<string, unknown> = {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 5,
      searchQuery: params.searchQuery || '',
      searchFields: params.searchFields || 'institutionName,refNumber',
    };

    // Auto-uppercase all other string parameters (filters)
    const protectedFields = ['searchQuery', 'searchFields', 'page', 'limit'];
    Object.keys(params).forEach(key => {
      if (!protectedFields.includes(key)) {
        queryParams[key] = params[key]?.toUpperCase();
      }
    });

    return queryParams;
  }, [searchParams]);

  const setQuery = useCallback(
    (newParams: Record<string, string | number | boolean | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      
      const defaults: Record<string, string> = {
        page: '1',
        limit: '5',
        searchQuery: '',
        searchFields: 'institutionName,refNumber'
      };

      Object.entries(newParams).forEach(([key, value]) => {
        let stringValue = value !== undefined && value !== null ? String(value) : '';
        
        // Auto-lowercase all strings EXCEPT protected fields
        const protectedFields = ['searchQuery', 'searchFields', 'page', 'limit'];
        if (!protectedFields.includes(key) && typeof value === 'string') {
          stringValue = stringValue.toLowerCase();
        }
        
        if (!stringValue || stringValue === defaults[key] || stringValue === 'all') {
          current.delete(key);
        } else {
          current.set(key, stringValue);
        }
      });

      // Reset to page 1 if any filter changed (except page itself)
      const isPageChangeOnly = Object.keys(newParams).length === 1 && 'page' in newParams;
      if (!isPageChangeOnly && newParams.page === undefined) {
        current.delete('page');
      }

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return { query, setQuery };
}
