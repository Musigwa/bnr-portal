import { AuditLog, ApplicationStatus } from '@/types';
import { StatusBadge } from './status-badge';
import { CheckCircle2, Circle, Clock, FileEdit, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No audit logs available.</p>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative pl-6">
              <div className="absolute -left-[11px] top-1 bg-white p-0.5 rounded-full">
                {getIcon(log.statusAfter)}
              </div>
              
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    {formatAction(log.action)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    }).format(new Date(log.createdAt))}
                  </span>
                </div>
                
                <span className="text-sm text-slate-600">
                  By <span className="font-medium text-slate-900">{log.actor?.fullName || 'System'}</span> ({log.actor?.role || 'SYSTEM'})
                </span>
                
                {log.statusAfter && log.statusBefore !== log.statusAfter && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">Status changed to:</span>
                    <StatusBadge status={log.statusAfter} />
                  </div>
                )}

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 text-xs bg-slate-50 p-2 rounded border text-slate-600 break-words">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
