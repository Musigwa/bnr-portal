'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useApproveApplication, useAssignApplication, useGetApplications } from '@/hooks/api/use-applications';
import { useAuth } from '@/providers/auth.provider';
import { useTableQuery } from '@/hooks/use-table-query';
import { ApplicationStatus, Role } from '@/types';
import { useState } from 'react';
import { DashboardStats } from './_components/dashboard-stats';
import { DashboardTable } from './_components/dashboard-table';
import { useQueryClient } from '@tanstack/react-query';
import { FilterPopover } from '@/components/shared/filter-popover';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { query, setQuery } = useTableQuery();

  // Fetch all applications unpaginated (limit: 1000) filtered by global date range to compute dashboard stats correctly
  const { data: statsResponse, isLoading: statsLoading } = useGetApplications({ 
    limit: 1000,
    startDate: query.startDate,
    endDate: query.endDate,
  });

  // Fetch paginated applications for the dashboard table
  const { data: tableResponse, isLoading: tableLoading, isFetching } = useGetApplications({
    page: query.page,
    limit: query.limit,
    searchQuery: query.searchQuery,
    searchFields: query.searchFields,
    status: query.status,
    institutionType: query.institutionType,
    startDate: query.startDate,
    endDate: query.endDate,
  });

  const { mutateAsync: assignApp } = useAssignApplication();
  const { mutateAsync: approveApp } = useApproveApplication();

  const handleAssign = async (id: string) => {
    try {
      await assignApp(id);
    } catch {
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveApp({ id, notes: 'Quick approved from dashboard' });
    } catch {
    }
  };

  // Keep track of counts and table data across query transitions to prevent one-frame flickers
  const getInitialCounts = () => {
    const data = statsResponse?.data || [];
    return {
      total: statsResponse?.meta?.total || data.length,
      pending: data.filter(a => a.status === ApplicationStatus.SUBMITTED).length,
      awaitingDecision: data.filter(a => a.status === ApplicationStatus.REVIEWED).length,
      decided: data.filter(a => 
        a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.REJECTED
      ).length
    };
  };

  const [cachedCounts, setCachedCounts] = useState(getInitialCounts);
  const [cachedTableData, setCachedTableData] = useState(() => ({
    applications: tableResponse?.data || [],
    meta: tableResponse?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }
  }));

  // Sync cache with latest success data directly during render (standard React pattern for prop-to-state adjustment)
  const [prevStatsResponse, setPrevStatsResponse] = useState(statsResponse);
  const [prevTableResponse, setPrevTableResponse] = useState(tableResponse);

  if (statsResponse !== prevStatsResponse) {
    setPrevStatsResponse(statsResponse);
    if (statsResponse?.data) {
      const data = statsResponse.data;
      setCachedCounts({
        total: statsResponse.meta?.total || data.length,
        pending: data.filter(a => a.status === ApplicationStatus.SUBMITTED).length,
        awaitingDecision: data.filter(a => a.status === ApplicationStatus.REVIEWED).length,
        decided: data.filter(a => 
          a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.REJECTED
        ).length
      });
    }
  }

  if (tableResponse !== prevTableResponse) {
    setPrevTableResponse(tableResponse);
    if (tableResponse?.data) {
      setCachedTableData({
        applications: tableResponse.data,
        meta: tableResponse.meta
      });
    }
  }

  const queryClient = useQueryClient();
  const hasCachedData = queryClient.getQueryCache().findAll({
    queryKey: ['applications', 'list'],
    exact: false
  }).some(q => q.state.status === 'success');

  const isInitialLoading =
    !hasCachedData && (
      authLoading ||
      (statsLoading && !statsResponse) ||
      (tableLoading && !tableResponse)
    );

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 md:h-[calc(100vh-180px)] md:overflow-hidden min-h-0">
      <div className="shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          
          {/* Global Filter Icon Popover */}
          <FilterPopover
            startDate={query.startDate ? String(query.startDate) : undefined}
            endDate={query.endDate ? String(query.endDate) : undefined}
            onApply={(dates) => {
              setQuery({
                startDate: dates.startDate,
                endDate: dates.endDate,
                page: 1,
              });
            }}
            align="end"
          />
        </div>
        <DashboardStats counts={cachedCounts} />
      </div>
      
      <DashboardTable 
        applications={cachedTableData.applications}
        userRole={user?.role || Role.APPLICANT}
        isLoading={isFetching}
        onAssign={handleAssign}
        onApprove={handleApprove}

        // Pagination
        currentPage={cachedTableData.meta.page}
        totalPages={cachedTableData.meta.totalPages}
        totalResults={cachedTableData.meta.total}
        pageSize={cachedTableData.meta.limit}
        onPageChange={(page) => setQuery({ page })}
        onPageSizeChange={(limit) => setQuery({ limit, page: 1 })}

        // Search
        searchQuery={String(query.searchQuery || '')}
        onSearchChange={(searchQuery) => setQuery({ searchQuery, page: 1 })}

        // Filters
        activeFilters={{
          status: String(query.status || 'all'),
          institutionType: String(query.institutionType || 'all'),
        }}
        onFilterChange={(key, value) => {
          setQuery({ [key]: value !== 'all' ? value : undefined, page: 1 });
        }}
        onClearFilters={() => {
          setQuery({ status: undefined, institutionType: undefined, searchQuery: '', page: 1 });
        }}
      />
    </div>
  );
}
