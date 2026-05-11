import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Application } from '@/types';

interface ApplicationDetailsCardProps {
  app: Application;
}

export function ApplicationDetailsCard({ app }: ApplicationDetailsCardProps) {
  return (
    <Card className="border-border overflow-hidden shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-xl">Application details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Registration Number</p>
          <p className="text-foreground font-bold text-lg">{app.registrationNumber}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Proposed Capital</p>
          <p className="text-foreground font-bold text-lg">
            {new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(app.proposedCapital)}
          </p>
        </div>
        <div className="md:col-span-2 space-y-2 pt-4 border-t border-border/50 mt-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Applicant Notes</p>
          <p className="text-foreground/80 leading-relaxed">{app.applicantNotes || 'No notes provided.'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
