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
          <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            TIN Number
          </p>
          <p className="text-foreground text-lg font-bold">{app.tinNumber}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Proposed Capital
          </p>
          <p className="text-foreground text-lg font-bold">
            {new Intl.NumberFormat('en-RW', {
              style: 'currency',
              currency: 'RWF',
            }).format(app.proposedCapital)}
          </p>
        </div>
        <div className="border-border/50 mt-2 space-y-2 border-t pt-4 md:col-span-2">
          <p className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
            Applicant Notes
          </p>
          <p className="text-foreground/80 leading-relaxed">
            {app.applicantNotes || 'No notes provided.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
