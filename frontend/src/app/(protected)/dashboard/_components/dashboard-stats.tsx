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
      <Card className="border-border group relative flex flex-col justify-between overflow-hidden pl-1.5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-gray-400 to-orange-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Requires Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-bold">
            {attentionTotal}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5">
              {counts.drafts} Drafts
            </span>
            <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-orange-600 dark:text-orange-400">
              {counts.pendingInfo} Pending Info
            </span>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3: New Submissions */}
      <Card className="border-border group relative flex flex-col justify-between overflow-hidden pl-1.5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            New Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-bold">
            {counts.submitted}
          </div>
          <div className="mt-2 flex gap-2 text-xs font-medium">
            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-600 dark:text-blue-400">
              {counts.submitted} New
            </span>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: Active Reviews */}
      <Card className="border-border group relative flex flex-col justify-between overflow-hidden pl-1.5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-amber-500 to-indigo-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Active Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-bold">
            {activeReviewsTotal}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
              {counts.underReview} Reviewing
            </span>
            <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400">
              {counts.reviewed} Reviewed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* CARD 5: Decided */}
      <Card className="border-border group relative flex flex-col justify-between overflow-hidden pl-1.5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-green-500 to-red-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Decided
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-foreground text-2xl font-bold">
            {decidedTotal}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-600 dark:text-green-400">
              {counts.approved} Approved
            </span>
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-600 dark:text-red-400">
              {counts.rejected} Rejected
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
