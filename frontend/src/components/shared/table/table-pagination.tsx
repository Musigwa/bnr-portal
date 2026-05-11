'use client';

import { useState, useEffect } from 'react';
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
  const [prevCurrentPage, setPrevCurrentPage] = useState(currentPage);
  const [inputValue, setInputValue] = useState(String(currentPage));

  if (currentPage !== prevCurrentPage) {
    setPrevCurrentPage(currentPage);
    setInputValue(String(currentPage));
  }

  useEffect(() => {
    const p = parseInt(inputValue);
    if (isNaN(p)) return;

    const clampedPage = Math.min(totalPages, Math.max(1, p));

    if (clampedPage !== currentPage) {
      const handler = setTimeout(() => {
        onPageChange(clampedPage);
      }, 500);
      return () => clearTimeout(handler);
    } else if (p !== currentPage) {
      const handler = setTimeout(() => {
        setInputValue(String(currentPage));
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [inputValue, currentPage, totalPages, onPageChange]);

  return (
    <div className="bg-muted/10 border-border flex shrink-0 flex-col items-center justify-between gap-4 border-t px-6 py-4 lg:flex-row">
      <div className="text-muted-foreground text-sm">
        Showing{' '}
        <span className="text-foreground font-medium">
          {(currentPage - 1) * pageSize + 1}
        </span>{' '}
        to{' '}
        <span className="text-foreground font-medium">
          {Math.min(currentPage * pageSize, totalResults)}
        </span>{' '}
        of <span className="text-foreground font-medium">{totalResults}</span>{' '}
        results
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        {/* Rows Per Page */}
        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger
              size="sm"
              className="bg-card border-border focus:ring-primary/20 !h-8 w-[70px] !py-0 text-xs shadow-none focus:ring-1"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem
                  key={option}
                  value={String(option)}
                  className="text-xs"
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Go to page */}
        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
          <span className="hidden sm:inline">Go to page:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={() => {
              const p = parseInt(inputValue);
              if (!isNaN(p)) {
                const clamped = Math.min(totalPages, Math.max(1, p));
                onPageChange(clamped);
                setInputValue(String(clamped));
              } else {
                setInputValue(String(currentPage));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const p = parseInt(inputValue);
                if (!isNaN(p)) {
                  const clamped = Math.min(totalPages, Math.max(1, p));
                  onPageChange(clamped);
                  setInputValue(String(clamped));
                }
              }
            }}
            className="bg-card border-border focus-visible:ring-primary/20 !h-8 w-14 !py-0 text-center shadow-none focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="border-border bg-card !h-8 !py-0 shadow-none"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <div className="px-2 text-sm font-medium whitespace-nowrap">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="border-border bg-card !h-8 !py-0 shadow-none"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
