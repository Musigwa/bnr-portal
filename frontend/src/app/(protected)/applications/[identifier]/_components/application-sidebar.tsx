import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application, AuditLog, Role } from '@/types';
import { CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { AuditTimeline } from './audit-timeline';

interface ApplicationSidebarProps {
  app: Application;
  auditLogs: AuditLog[];
  userRole: Role;
}

export function ApplicationSidebar({ app, auditLogs, userRole }: ApplicationSidebarProps) {
  const isInternal = userRole !== Role.APPLICANT;

  return (
    <div className="md:col-span-3 space-y-6">
      {/* Sidebars for STAFF ONLY */}
      {isInternal && (
        <Card className="border-border overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-xl">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Reviewer</p>
                <p className="text-sm text-muted-foreground">{app.reviewer?.fullName || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Approver</p>
                <p className="text-sm text-muted-foreground">{app.approver?.fullName || 'Not decided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b flex flex-row items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-xl">Audit History</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[558px] overflow-y-auto custom-scrollbar scroll-shadows">
          <AuditTimeline logs={auditLogs || []} />
        </CardContent>
      </Card>
    </div>
  );
}
