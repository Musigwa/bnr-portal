import { AuditLog, ApplicationStatus } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { CheckCircle2, Circle, Clock, FileEdit, ShieldCheck, User } from 'lucide-react';

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
    <div className="relative border-l border-slate-200 ml-3 space-y-8 py-2 pb-8">
      {logs.map((log) => (
        <div key={log.id} className="relative pl-6">
          {/* Timeline Dot/Icon */}
          <div className="absolute -left-[10px] top-1 bg-white p-0.5 rounded-full z-10">
            {getIcon(log.statusAfter)}
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                {formatAction(log.action)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {new Intl.DateTimeFormat('en-GB', { 
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                }).format(new Date(log.createdAt))}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium">By <span className="text-slate-700 font-bold">{log.actor?.fullName || 'System'}</span></span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500">{log.actor?.role || 'SYSTEM'}</span>
            </div>
            
            {log.statusAfter && log.statusBefore !== log.statusAfter && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status:</span>
                <StatusBadge status={log.statusAfter} />
              </div>
            )}

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {Object.entries(log.metadata).map(([key, value]) => {
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .replace('Notes', ' Notes')
                    .replace('Reason', ' Reason');
                  
                  return (
                    <div key={key} className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{label}</p>
                      <p className="text-[11px] font-medium text-slate-700 leading-relaxed">
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
      <div className="relative pl-6 pt-2">
        <div className="absolute -left-[10px] top-3 bg-white p-0.5 rounded-full z-10">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex flex-col">
          <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">
            End of Timeline
          </p>
          <p className="text-[12px] font-medium text-slate-400 italic">
            All activity recorded up to now
          </p>
        </div>
      </div>
    </div>
  );
}
