'use client';

import { DataTable } from '@/components/shared/table';
import { Application, ApplicationStatus, Role } from '@/types';
import { useRouter } from 'next/navigation';
import { useApplicationColumns } from './table-columns';

interface ApplicationTableProps {
  applications: Application[];
  role: Role;
  onAssign?: (id: string) => void;
  onApprove?: (id: string) => void;
  isActionLoading?: boolean;
  isLoading?: boolean;

  // Pagination props
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  // Inline column filter props
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;

  // Layout props
  className?: string;
  maxHeight?: string;
}

export function ApplicationTable({
  applications,
  role,
  onAssign,
  onApprove,
  isActionLoading,
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
  isLoading,
}: ApplicationTableProps) {
  const router = useRouter();

  const getActionLabel = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.DRAFT:
        return 'Continue';
      case ApplicationStatus.PENDING_INFO:
        return 'Update';
      default:
        return 'View';
    }
  };

  const columns = useApplicationColumns({
    role,
    onAssign,
    onApprove,
    isActionLoading,
    router,
    getActionLabel,
  });

  const onRowClick = (app: Application) => {
    router.push(`/applications/${app.refNumber}`);
  };

  return (
    <DataTable
      data={applications}
      columns={columns}
      onRowClick={onRowClick}
      isLoading={isLoading}
      // Inline column filter props
      activeFilters={activeFilters}
      onFilterChange={onFilterChange}
      onClear={onClearFilters}
      // Pagination props
      currentPage={currentPage}
      totalPages={totalPages}
      totalResults={totalResults}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
