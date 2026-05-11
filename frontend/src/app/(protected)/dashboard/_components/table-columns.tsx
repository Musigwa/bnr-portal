import { StatusBadge } from '@/components/shared/status-badge';
import { ColumnDef } from '@/components/shared/table';
import { Button } from '@/components/ui/button';
import { Application, ApplicationStatus, Role } from '@/types';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { formatEnumLabel } from '@/lib/utils';

interface UseDashboardColumnsProps {
  userRole: Role;
  onAssign?: (id: string) => void;
  onApprove?: (id: string, notes?: string) => void;
  setApproveDialogApp: (app: Application | null) => void;
  setApproveNotes: (notes: string) => void;
  router: AppRouterInstance;
}

export function useDashboardColumns({
  userRole,
  onAssign,
  onApprove,
  setApproveDialogApp,
  setApproveNotes,
  router,
}: UseDashboardColumnsProps): ColumnDef<Application>[] {
  return [
    { 
      key: 'refNumber', 
      label: 'Ref#', 
      className: 'font-semibold pl-6',
      render: (app) => app.refNumber,
      filterType: 'input',
      filterKey: 'refNumber'
    },
    { 
      key: 'institutionName', 
      label: 'Institution',
      filterType: 'input',
      filterKey: 'institutionName'
    },
    { 
      key: 'institutionType',
      label: 'Type',
      render: (app) => (
        <span className="text-muted-foreground">
          {formatEnumLabel(app.institutionType)}
        </span>
      ),
      filterType: 'select',
      filterKey: 'institutionType',
      filterOptions: [
        { label: 'Commercial Bank', value: 'COMMERCIAL_BANK' },
        { label: 'Microfinance', value: 'MICROFINANCE' },
        { label: 'Digital Bank', value: 'DIGITAL_BANK' }
      ]
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (app) => <StatusBadge status={app.status} />,
      filterType: 'select',
      filterKey: 'status',
      filterOptions: Object.values(ApplicationStatus).filter(s => s !== ApplicationStatus.DRAFT).map(s => ({
        label: formatEnumLabel(s),
        value: s
      }))
    },
    { 
      key: 'date', 
      label: 'Submitted',
      className: 'text-muted-foreground',
      render: (app) => {
        const date = app.submittedAt || app.createdAt;
        return date ? new Intl.DateTimeFormat('en-US', { 
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
      label: 'Action',
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
              className="!h-8 !py-0 text-green-600 dark:text-green-400 hover:bg-green-600/10 border-green-600/20 shadow-none"
              onClick={() => {
                setApproveDialogApp(app);
                setApproveNotes('');
              }}
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
}
