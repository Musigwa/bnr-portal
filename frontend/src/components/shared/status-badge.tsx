import { Badge } from '@/components/ui/badge';
import { ApplicationStatus } from '@/types';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  [ApplicationStatus.DRAFT]: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  [ApplicationStatus.SUBMITTED]: { label: 'Submitted', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  [ApplicationStatus.UNDER_REVIEW]: { label: 'Under Review', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  [ApplicationStatus.PENDING_INFO]: { label: 'Pending Info', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  [ApplicationStatus.REVIEWED]: { label: 'Reviewed', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  [ApplicationStatus.APPROVED]: { label: 'Approved', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  [ApplicationStatus.REJECTED]: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <Badge variant="outline" className={`${config.className} border-transparent`}>
      {config.label}
    </Badge>
  );
}
