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
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">
            Total Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{counts.total}</div>
        </CardContent>
      </Card>
      
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{counts.pending}</div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Awaiting Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{counts.awaitingDecision}</div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Decided This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{counts.decidedThisMonth}</div>
        </CardContent>
      </Card>
    </div>
  );
}
