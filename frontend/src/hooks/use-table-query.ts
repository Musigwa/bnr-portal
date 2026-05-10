'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useTableQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 10,
      searchQuery: params.searchQuery || '',
      searchFields: params.searchFields || 'institutionName,refNumber',
      status: params.status || undefined,
      institutionType: params.institutionType || undefined,
    };
  }, [searchParams]);

  const setQuery = useCallback(
    (newParams: Record<string, any>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          current.delete(key);
        } else {
          current.set(key, String(value));
        }
      });

      // Reset to page 1 if any filter changed (except page itself)
      const isPageChangeOnly = Object.keys(newParams).length === 1 && 'page' in newParams;
      if (!isPageChangeOnly && newParams.page === undefined) {
        current.set('page', '1');
      }

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`);
    },
    [router, pathname, searchParams]
  );

  return { query, setQuery };
}
