'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Application, ApplicationStatus } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplicationsPage() {
  const router = useRouter();
  const { data: applications, isLoading, error, refetch } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => apiClient.get('/applications'),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const searchPosition: string = 'left'; // 'left' | 'right' | 'center'

  const filteredApplications = applications?.filter(app => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.refNumber.toLowerCase().includes(query) || 
        app.institutionName.toLowerCase().includes(query) ||
        app.institutionType.toLowerCase().replace('_', ' ').includes(query)
      );
    }
    return true;
  });

  const totalFiltered = filteredApplications?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  
  const paginatedApplications = filteredApplications?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getActionLabel = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.DRAFT:
        return 'Continue';
      case ApplicationStatus.PENDING_INFO:
        return 'Add Documents';
      default:
        return 'View';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-20 w-full mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
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
            Failed to load applications. Please try again.
            <Button variant="outline" size="sm" className="ml-4" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">
            Manage your bank licensing applications.
          </p>
        </div>
        <Link href="/applications/new" className={buttonVariants({ variant: 'default' })}>
          <Plus className="mr-2 h-4 w-4" /> New Application
        </Link>
      </div>
      
      {/* Search and Table Controls */}
      <div className={`flex w-full ${searchPosition === 'right' ? 'justify-end' : searchPosition === 'center' ? 'justify-center' : 'justify-start'}`}>
        <div className="flex w-full sm:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search your applications..." 
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

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
                  <TableHead className="bg-white">Date</TableHead>
                  <TableHead className="text-right pr-6 bg-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!paginatedApplications || paginatedApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {searchQuery ? 'No applications found matching your search.' : <>No applications found. Click <span className="font-medium text-foreground">New Application</span> to get started.</>}
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
                        {app.createdAt ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(app.createdAt)) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="pointer-events-none"
                        >
                          {getActionLabel(app.status)}
                        </Button>
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
