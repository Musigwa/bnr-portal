import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application, AuditLog, Role } from '@/types';
import { CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { AuditTimeline } from './audit-timeline';

interface ApplicationSidebarProps {
  app: Application;
  auditLogs: AuditLog[];
  userRole: Role;
}

export function ApplicationSidebar({
  app,
  auditLogs,
  userRole,
}: ApplicationSidebarProps) {
  const isInternal = userRole !== Role.APPLICANT;

  return (
    <div className="space-y-6 md:col-span-3">
      {/* Sidebars for STAFF ONLY */}
      {isInternal && (
        <Card className="border-border overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                <UserPlus className="text-muted-foreground h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Reviewer</p>
                <p className="text-muted-foreground text-sm">
                  {app.reviewer?.fullName || 'Not assigned'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                <CheckCircle2 className="text-muted-foreground h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Approver</p>
                <p className="text-muted-foreground text-sm">
                  {app.approver?.fullName || 'Not decided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 border-b">
          <Clock className="text-muted-foreground h-5 w-5" />
          <CardTitle className="text-xl">Audit History</CardTitle>
        </CardHeader>
        <CardContent className="custom-scrollbar max-h-[558px] overflow-y-auto">
          <AuditTimeline logs={auditLogs || []} />
        </CardContent>
      </Card>
    </div>
  );
}
