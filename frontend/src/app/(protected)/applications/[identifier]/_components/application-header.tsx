import { StatusBadge } from '@/components/shared/status-badge';
import { Application } from '@/types';
import { Building2, Calendar, FileText } from 'lucide-react';

interface ApplicationHeaderProps {
  app: Application;
}

export function ApplicationHeader({ app }: ApplicationHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
          {app.institutionName}
        </h1>
        <StatusBadge status={app.status} />
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <FileText className="text-muted-foreground/70 h-4 w-4" />{' '}
          {app.refNumber}
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="text-muted-foreground/70 h-4 w-4" />{' '}
          {app.institutionType.replace('_', ' ')}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="text-muted-foreground/70 h-4 w-4" />{' '}
          {new Date(app.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
