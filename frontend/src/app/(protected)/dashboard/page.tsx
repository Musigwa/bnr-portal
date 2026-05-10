'use client';

import { StatusBadge } from '@/components/shared/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth.provider';
import { Application, ApplicationStatus, Role } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const searchPosition: string = 'left'; // 'left' | 'right' | 'center'

  useEffect(() => {
    if (!authLoading && user && user.role === Role.APPLICANT) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const { data: applications, isLoading, error, refetch } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => apiClient.get('/applications'),
    enabled: !!user && user.role !== Role.APPLICANT,
  });

  const isThisMonth = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const counts = {
    total: applications?.length || 0,
    pendingReview: applications?.filter(a => a.status === ApplicationStatus.SUBMITTED).length || 0,
    awaitingDecision: applications?.filter(a => a.status === ApplicationStatus.REVIEWED).length || 0,
    decidedThisMonth: applications?.filter(a => 
      (a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.REJECTED) && 
      isThisMonth(a.updatedAt)
    ).length || 0,
  };

  const filteredApplications = applications?.filter(app => {
    // 1. Status Filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'DECIDED') {
        if (app.status !== ApplicationStatus.APPROVED && app.status !== ApplicationStatus.REJECTED) return false;
      } else {
        if (app.status !== statusFilter) return false;
      }
    }
    
    // 2. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        app.refNumber.toLowerCase().includes(query) || 
        app.institutionName.toLowerCase().includes(query) ||
        app.institutionType.toLowerCase().replace('_', ' ').includes(query);
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  const totalFiltered = filteredApplications?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  
  const paginatedApplications = filteredApplications?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to reach server. Please try again.
            <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canAssign = (app: Application) => {
    return user?.role === Role.REVIEWER && app.status === ApplicationStatus.SUBMITTED && !app.reviewerId;
  };

  const canDecide = (app: Application) => {
    return user?.role === Role.APPROVER && app.status === ApplicationStatus.REVIEWED && app.reviewerId !== user.id;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of bank licensing applications.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.pendingReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.awaitingDecision}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decided This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.decidedThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }} className="w-full sm:w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="SUBMITTED">Submitted</TabsTrigger>
            <TabsTrigger value="UNDER_REVIEW">Under Review</TabsTrigger>
            <TabsTrigger value="REVIEWED">Reviewed</TabsTrigger>
            <TabsTrigger value="DECIDED">Decided</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Search and Table Controls */}
        <div className={`flex w-full mb-6 ${searchPosition === 'right' ? 'justify-end' : searchPosition === 'center' ? 'justify-center' : searchPosition === 'left' ? 'justify-start' : ''}`}>
          <div className="flex w-full sm:w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search applications by ref or name..." 
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative max-h-[60vh] overflow-y-auto border-b">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
                <TableRow>
                  <TableHead className="pl-6 bg-white">Ref#</TableHead>
                  <TableHead className="bg-white">Institution</TableHead>
                  <TableHead className="bg-white">Type</TableHead>
                  <TableHead className="bg-white">Status</TableHead>
                  <TableHead className="bg-white">Submitted</TableHead>
                  <TableHead className="bg-white">Assigned Reviewer</TableHead>
                  <TableHead className="text-right pr-6 bg-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!paginatedApplications || paginatedApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No applications found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApplications.map((app) => (
                    <TableRow 
                      key={app.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => router.push(`/applications/${app.refNumber}`)}
                    >
                      <TableCell className="font-medium pl-6">{app.refNumber}</TableCell>
                      <TableCell>{app.institutionName}</TableCell>
                      <TableCell className="capitalize">{app.institutionType.toLowerCase().replace('_', ' ')}</TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {app.submittedAt ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(app.submittedAt)) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {app.reviewer?.fullName || <span className="text-muted-foreground italic">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-2" onClick={(e) => e.stopPropagation()}>
                        {canAssign(app) && (
                          <Button variant="outline" size="sm">
                            Assign to me
                          </Button>
                        )}
                        {canDecide(app) && (
                          <Button variant="outline" size="sm">
                            Decide
                          </Button>
                        )}
                        {(user?.role === Role.ADMIN || (user?.role === Role.REVIEWER && app.reviewerId === user.id) || app.status === ApplicationStatus.SUBMITTED) && (
                          <Button variant="ghost" size="sm" className="pointer-events-none">
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalFiltered > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-slate-50/50">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing <span className="font-medium text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * pageSize, totalFiltered)}</span> of <span className="font-medium text-slate-900">{totalFiltered}</span> results
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-6">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Go to page:</span>
                  <Input 
                    type="number" 
                    min={1} 
                    max={totalPages}
                    defaultValue={currentPage}
                    key={currentPage}
                    onBlur={(e) => {
                      const p = parseInt(e.target.value);
                      if (!isNaN(p)) setCurrentPage(Math.min(totalPages, Math.max(1, p)));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const p = parseInt(e.currentTarget.value);
                        if (!isNaN(p)) setCurrentPage(Math.min(totalPages, Math.max(1, p)));
                      }
                    }}
                    className="w-16 h-8 text-center p-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
