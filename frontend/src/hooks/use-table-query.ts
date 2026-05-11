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
    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 5,
    };

    // Enum filters (status, institutionType…) → uppercase for backend
    // Free-text filters (refNumber, institutionName…) → preserve casing as typed
    const freeTextFields = ['refNumber', 'institutionName', 'startDate', 'endDate'];
    Object.keys(params).forEach(key => {
      if (key === 'page' || key === 'limit') return; // already set as numbers above
      if (freeTextFields.includes(key)) {
        queryParams[key] = params[key]; // preserve as-is
      } else {
        queryParams[key] = params[key]?.toUpperCase(); // uppercase enum values
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
      };

      Object.entries(newParams).forEach(([key, value]) => {
        let stringValue = value !== undefined && value !== null ? String(value) : '';
        
        // Preserve casing for free-text fields; lowercase enum values for URL cleanliness
        const freeTextFields = ['refNumber', 'institutionName', 'startDate', 'endDate'];
        if (!freeTextFields.includes(key) && key !== 'page' && key !== 'limit' && typeof value === 'string') {
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
