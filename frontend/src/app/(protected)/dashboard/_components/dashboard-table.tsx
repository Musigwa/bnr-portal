import { Application, ApplicationStatus, Role } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataTable, ColumnDef, FilterDef, useDataTable } from '@/components/shared/table';

interface DashboardTableProps {
  applications: Application[];
  userRole: Role;
  isLoading: boolean;
  onAssign?: (id: string) => void;
  onApprove?: (id: string) => void;
}

export function DashboardTable({ 
  applications, 
  userRole, 
  isLoading,
  onAssign,
  onApprove 
}: DashboardTableProps) {
  const router = useRouter();

    const navigateToApplication = (refNumber: string) => {
    router.push(`/applications/${refNumber}`);
  };

  const columns: ColumnDef<Application>[] = [
    { 
      key: 'refNumber', 
      label: 'Ref#', 
      className: 'font-semibold pl-6',
      render: (app) => app.refNumber 
    },
    { key: 'institutionName', label: 'Institution' },
    { 
      key: 'institutionType', 
      label: 'Type',
      render: (app) => (
        <span className="capitalize text-slate-600">
          {app.institutionType.toLowerCase().replace('_', ' ')}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (app) => <StatusBadge status={app.status} />
    },
    { 
      key: 'date', 
      label: 'Submitted',
      className: 'text-slate-500',
      render: (app) => {
        const date = app.submittedAt || app.createdAt;
        return date ? new Intl.DateTimeFormat('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }).format(new Date(date)) : 'N/A';
      }
    },
    {
      key: 'reviewer',
      label: 'Reviewer',
      render: (app) => app.reviewer?.fullName || (
        <span className="text-muted-foreground italic text-xs">Unassigned</span>
      )
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right pr-6',
      render: (app) => (
        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          {onAssign && app.status === ApplicationStatus.SUBMITTED && !app.reviewerId && userRole === Role.REVIEWER && (
            <Button 
              variant="outline" 
              size="sm"
              className="!h-8 !py-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary shadow-none"
              onClick={() => onAssign(app.id)}
            >
              <UserPlus className="mr-1.5 h-3 w-3" />
              Assign
            </Button>
          )}
          {onApprove && app.status === ApplicationStatus.REVIEWED && userRole === Role.APPROVER && (
            <Button 
              variant="outline" 
              size="sm"
              className="!h-8 !py-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 shadow-none"
              onClick={() => onApprove(app.id)}
            >
              <CheckCircle2 className="mr-1.5 h-3 w-3" />
              Approve
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            className="!h-8 !py-0"
            onClick={() => router.push(`/applications/${app.refNumber}`)}
          >
            View
          </Button>
        </div>
      )
    }
  ];

  const filters: FilterDef[] = [
    {
      key: 'institutionType',
      label: 'Type',
      options: [
        { label: 'Commercial Bank', value: 'COMMERCIAL_BANK' },
        { label: 'Microfinance', value: 'MICROFINANCE' },
        { label: 'Digital Bank', value: 'DIGITAL_BANK' },
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: Object.values(ApplicationStatus).filter(s => s !== ApplicationStatus.DRAFT).map(s => ({
        label: s.replace('_', ' ').toLowerCase(),
        value: s
      }))
    }
  ];

  const {
    searchQuery,
    setSearchQuery,
    activeFilters,
    paginatedData,
    totalFiltered,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    handleFilterChange,
    clearFilters
  } = useDataTable(applications, {
    searchKey: 'institutionName',
    filters,
    initialPageSize: 10
  });

  return (
    <DataTable
      data={paginatedData}
      columns={columns}
      onRowClick={(app) => navigateToApplication(app.refNumber)}
      isLoading={isLoading}
      
      // Toolbar props
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchKey="institutionName"
      searchPlaceholder="Search applications by name..."
      filters={filters}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onClear={clearFilters}
      
      // Pagination props
      currentPage={currentPage}
      totalPages={totalPages}
      totalResults={totalFiltered}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
    />
  );
}
