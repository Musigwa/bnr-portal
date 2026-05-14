import { AuditLog, ApplicationStatus } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { CheckCircle2, Circle, Clock, FileEdit, User } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm text-slate-500 font-medium">No audit logs available for this application.</p>
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
        return <User className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 py-2">
      {logs.map((log) => (
        <div key={log.id} className="relative pl-7">
          {/* Timeline Dot/Icon */}
          <div className="absolute -left-[11px] top-1 bg-white p-0.5 rounded-full z-10">
            {getIcon(log.statusAfter)}
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                {formatAction(log.action)}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">
                {new Intl.DateTimeFormat('en-GB', { 
                  day: 'numeric', month: 'short', year: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                }).format(new Date(log.createdAt))}
              </span>
            </div>
            
            <span className="text-xs text-slate-500">
              By <span className="font-bold text-slate-800">{log.actor?.fullName || 'System'}</span> 
              <span className="ml-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">{log.actor?.role || 'SYSTEM'}</span>
            </span>
            
            {log.statusAfter && log.statusBefore !== log.statusAfter && (
              <div className="flex items-center space-x-2 mt-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status changed to:</span>
                <StatusBadge status={log.statusAfter} />
              </div>
            )}

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="mt-3 space-y-2">
                {Object.entries(log.metadata).map(([key, value]) => {
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .replace('Notes', ' Notes')
                    .replace('Reason', ' Reason');
                  
                  return (
                    <div key={key} className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{label}</p>
                      <p className="text-[11px] font-medium text-slate-700 leading-relaxed break-words">
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
    </div>
  );
}
