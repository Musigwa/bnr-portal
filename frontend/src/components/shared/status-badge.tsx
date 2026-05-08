import { Badge } from '@/components/ui/badge';
import { ApplicationStatus } from '@/types';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  [ApplicationStatus.DRAFT]: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  [ApplicationStatus.SUBMITTED]: { label: 'Submitted', className: 'bg-blue-100 text-blue-800' },
  [ApplicationStatus.UNDER_REVIEW]: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-800' },
  [ApplicationStatus.PENDING_INFO]: { label: 'Pending Info', className: 'bg-orange-100 text-orange-800' },
  [ApplicationStatus.REVIEWED]: { label: 'Reviewed', className: 'bg-purple-100 text-purple-800' },
  [ApplicationStatus.APPROVED]: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  [ApplicationStatus.REJECTED]: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <Badge variant="outline" className={`${config.className} border-transparent`}>
      {config.label}
    </Badge>
  );
}
