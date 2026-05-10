'use client';

import { Application, ApplicationStatus, Role } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Eye, UserPlus, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataTable, ColumnDef, FilterDef } from '@/components/shared/table';

interface ApplicationTableProps {
  applications: Application[];
  role: Role;
  onAssign?: (id: string) => void;
  onApprove?: (id: string) => void;
  isActionLoading?: boolean;
  
  // Pagination & Filtering Props
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
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
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onClearFilters
}: ApplicationTableProps) {
  const router = useRouter();
  const isStaff = role !== Role.APPLICANT;

  const getActionLabel = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.DRAFT: return 'Continue';
      case ApplicationStatus.PENDING_INFO: return 'Update';
      default: return 'View';
    }
  };

  const navigateToApplication = (refNumber: string) => {
    router.push(`/applications/${refNumber}`);
  };

  const columns: ColumnDef<Application>[] = [
    { 
      key: 'refNumber', 
      label: 'Ref#', 
      className: 'font-medium pl-6',
      render: (app) => app.refNumber 
    },
    { key: 'institutionName', label: 'Institution' },
    { 
      key: 'institutionType', 
      label: 'Type',
      render: (app) => (
        <span className="capitalize">
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
      label: isStaff ? 'Submitted' : 'Date',
      className: 'text-muted-foreground',
      render: (app) => {
        const date = app.submittedAt || app.createdAt;
        return date ? new Intl.DateTimeFormat('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }).format(new Date(date)) : 'N/A';
      }
    },
    ...(isStaff ? [{
      key: 'reviewer',
      label: 'Reviewer',
      render: (app: Application) => app.reviewer?.fullName || (
        <span className="text-muted-foreground italic text-xs">Unassigned</span>
      )
    }] : []),
    {
      key: 'actions',
      label: '',
      className: 'text-right pr-6',
      render: (app) => (
        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          {isStaff && onAssign && app.status === ApplicationStatus.SUBMITTED && !app.reviewerId && role === Role.REVIEWER && (
            <Button 
              variant="outline" 
              size="sm"
              className="!h-8 !py-0 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary shadow-none"
              onClick={() => onAssign(app.id)}
              disabled={isActionLoading}
            >
              <UserPlus className="mr-1.5 h-3 w-3" />
              Assign
            </Button>
          )}
          {isStaff && onApprove && app.status === ApplicationStatus.REVIEWED && role === Role.APPROVER && (
            <Button 
              variant="outline" 
              size="sm"
              className="!h-8 !py-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 shadow-none"
              onClick={() => onApprove(app.id)}
              disabled={isActionLoading}
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
            <Eye className="mr-1.5 h-4 w-4" /> 
            {isStaff ? 'View' : getActionLabel(app.status)}
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

  return (
    <DataTable
      data={applications}
      columns={columns}
      onRowClick={(app) => navigateToApplication(app.refNumber)}
      
      // Toolbar props
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchKey="institutionName"
      searchPlaceholder="Search applications by name..."
      filters={isStaff ? filters : []}
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
