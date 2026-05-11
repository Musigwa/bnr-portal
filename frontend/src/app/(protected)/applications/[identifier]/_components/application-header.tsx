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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{app.institutionName}</h1>
        <StatusBadge status={app.status} />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm font-medium">
        <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-muted-foreground/70" /> {app.refNumber}</span>
        <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-muted-foreground/70" /> {app.institutionType.replace('_', ' ')}</span>
        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-muted-foreground/70" /> {new Date(app.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
