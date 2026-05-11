import { AuditLog, ApplicationStatus } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  FileEdit,
  ShieldCheck,
  User,
} from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-muted/20 border-border rounded-xl border border-dashed py-8 text-center">
        <p className="text-muted-foreground text-sm font-medium">
          No audit logs available for this application.
        </p>
      </div>
    );
  }

  const getIcon = (statusAfter: ApplicationStatus | null) => {
    switch (statusAfter) {
      case ApplicationStatus.SUBMITTED:
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case ApplicationStatus.UNDER_REVIEW:
        return <Clock className="h-5 w-5 text-amber-500" />;
      case ApplicationStatus.REVIEWED:
        return <FileEdit className="h-5 w-5 text-indigo-500" />;
      case ApplicationStatus.APPROVED:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case ApplicationStatus.REJECTED:
        return <Circle className="h-5 w-5 text-red-500" fill="currentColor" />;
      default:
        return <User className="text-muted-foreground/50 h-5 w-5" />;
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="border-border relative ml-3 space-y-8 border-l py-2 pb-8">
      {logs.map((log) => (
        <div key={log.id} className="relative pl-6">
          {/* Timeline Dot/Icon */}
          <div className="bg-card absolute top-1 -left-[10px] z-10 rounded-full p-0.5">
            {getIcon(log.statusAfter)}
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground text-sm font-bold tracking-tight">
                {formatAction(log.action)}
              </span>
              <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
                {new Intl.DateTimeFormat('en-US', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(log.createdAt))}
              </span>
            </div>

            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="font-medium">
                By{' '}
                <span className="text-foreground/90 font-bold">
                  {log.actor?.fullName || 'System'}
                </span>
              </span>
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-bold">
                {log.actor?.role || 'SYSTEM'}
              </span>
            </div>

            {log.statusAfter && log.statusBefore !== log.statusAfter && (
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-muted-foreground/60 text-[10px] font-bold tracking-tight uppercase">
                  Status:
                </span>
                <StatusBadge status={log.statusAfter} />
              </div>
            )}

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {Object.entries(log.metadata).map(([key, value]) => {
                  let label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim();

                  if (label.toLowerCase() === 'notes') {
                    const rolePrefix = log.actor?.role || 'Applicant';
                    label = `${rolePrefix} Notes`;
                  }

                  return (
                    <div
                      key={key}
                      className="bg-muted/30 border-border/50 rounded-lg border p-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                    >
                      <p className="text-muted-foreground/60 mb-1 text-[10px] font-bold tracking-tight uppercase">
                        {label}
                      </p>
                      <p className="text-foreground/80 text-[11px] leading-relaxed font-medium">
                        {String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* End of history marker */}
      <div className="relative pt-2 pl-6">
        <div className="bg-card absolute top-3 -left-[10px] z-10 rounded-full p-0.5">
          <ShieldCheck className="text-muted-foreground/40 h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <p className="text-muted-foreground/60 text-[14px] font-bold tracking-widest uppercase">
            End of Timeline
          </p>
          <p className="text-muted-foreground/40 text-[12px] font-medium italic">
            All activity recorded up to now
          </p>
        </div>
      </div>
    </div>
  );
}
