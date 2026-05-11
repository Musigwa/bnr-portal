import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatsProps {
  counts: {
    total: number;
    drafts: number;
    submitted: number;
    underReview: number;
    pendingInfo: number;
    reviewed: number;
    approved: number;
    rejected: number;
  };
}

export function DashboardStats({ counts }: DashboardStatsProps) {
  const attentionTotal = counts.drafts + counts.pendingInfo;
  const activeReviewsTotal = counts.underReview + counts.reviewed;
  const decidedTotal = counts.approved + counts.rejected;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: Requires Attention */}
      <Card className="relative overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between pl-1.5">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gray-400 to-orange-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Requires Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{attentionTotal}</div>
          <div className="flex flex-wrap gap-2 text-xs font-medium mt-2">
            <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{counts.drafts} Drafts</span>
            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">{counts.pendingInfo} Pending Info</span>
          </div>
        </CardContent>
      </Card>
      
      {/* CARD 3: New Submissions */}
      <Card className="relative overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between pl-1.5">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">New Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{counts.submitted}</div>
          <div className="flex gap-2 text-xs font-medium mt-2">
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{counts.submitted} New</span>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: Active Reviews */}
      <Card className="relative overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between pl-1.5">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-indigo-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{activeReviewsTotal}</div>
          <div className="flex flex-wrap gap-2 text-xs font-medium mt-2">
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">{counts.underReview} Reviewing</span>
            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">{counts.reviewed} Reviewed</span>
          </div>
        </CardContent>
      </Card>

      {/* CARD 5: Decided */}
      <Card className="relative overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between pl-1.5">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-500 to-red-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Decided</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{decidedTotal}</div>
          <div className="flex flex-wrap gap-2 text-xs font-medium mt-2">
            <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">{counts.approved} Approved</span>
            <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">{counts.rejected} Rejected</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
