import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTablePaginationProps } from './types';

export function DataTablePagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  pageSizeOptions = [5, 10, 15, 20, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/30 border-t border-slate-100">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * pageSize, totalResults)}</span> of <span className="font-medium text-slate-900">{totalResults}</span> results
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        {/* Rows Per Page */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger size="sm" className="!h-8 w-[70px] !py-0 bg-white border-slate-200 text-xs focus:ring-1 focus:ring-primary/20 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Go to page */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Go to page:</span>
          <Input 
            type="number" 
            min={1} 
            max={totalPages}
            defaultValue={currentPage}
            key={currentPage}
            onBlur={(e) => {
              const p = parseInt(e.target.value);
              if (!isNaN(p)) onPageChange(Math.min(totalPages, Math.max(1, p)));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const p = parseInt(e.currentTarget.value);
                if (!isNaN(p)) onPageChange(Math.min(totalPages, Math.max(1, p)));
              }
            }}
            className="w-14 !h-8 !py-0 text-center bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="!h-8 !py-0 border-slate-200 bg-white shadow-none"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <div className="text-sm font-medium px-2 whitespace-nowrap">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="!h-8 !py-0 border-slate-200 bg-white shadow-none"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
