import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatsProps {
  counts: {
    total: number;
    pending: number;
    awaitingDecision: number;
    decidedThisMonth: number;
  };
}

export function DashboardStats({ counts }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border shadow-sm hover:shadow-md transition-all duration-200 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
            Total Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{counts.total}</div>
        </CardContent>
      </Card>
      
      <Card className="border-border shadow-sm hover:shadow-md transition-all duration-200 group border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{counts.pending}</div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm hover:shadow-md transition-all duration-200 group border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{counts.awaitingDecision}</div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm hover:shadow-md transition-all duration-200 group border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Decided This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{counts.decidedThisMonth}</div>
        </CardContent>
      </Card>
    </div>
  );
}
