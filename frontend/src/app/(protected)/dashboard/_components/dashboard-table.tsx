import { DataTable } from '@/components/shared/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Application, Role } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDashboardColumns } from './table-columns';

interface DashboardTableProps {
  applications: Application[];
  userRole: Role;
  isLoading: boolean;
  onAssign?: (id: string) => void;
  onApprove?: (id: string, notes?: string) => void;
  
  // Pagination & Filtering Props
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function DashboardTable({ 
  applications, 
  userRole, 
  isLoading,
  onAssign,
  onApprove,
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
}: DashboardTableProps) {
  const router = useRouter();
  const [approveDialogApp, setApproveDialogApp] = useState<Application | null>(null);
  const [approveNotes, setApproveNotes] = useState('');

  const navigateToApplication = (refNumber: string) => {
    router.push(`/applications/${refNumber}`);
  };

  const columns = useDashboardColumns({
    userRole,
    onAssign,
    onApprove,
    setApproveDialogApp,
    setApproveNotes,
    router,
  });

  return (
    <>
      <DataTable
        data={applications}
        columns={columns}
        onRowClick={(app) => navigateToApplication(app.refNumber)}
        isLoading={isLoading}
        
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
        
        // Pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalResults}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <Dialog open={!!approveDialogApp} onOpenChange={(open) => !open && setApproveDialogApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              You are about to approve application <span className="font-semibold text-foreground">{approveDialogApp?.refNumber}</span>. You can optionally add notes below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Add approval notes (optional)..."
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogApp(null)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                if (approveDialogApp && onApprove) {
                  onApprove(approveDialogApp.id, approveNotes);
                  setApproveDialogApp(null);
                }
              }}
            >
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

