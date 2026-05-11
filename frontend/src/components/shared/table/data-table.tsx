"use client";

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { FilterX } from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from './table-pagination';
import { DataTableProps } from './types';
import { TableHeaderCell } from './table-headercell';

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No results found.',
  className,
  // Toolbar props
  activeFilters,
  onFilterChange,
  onClear,
  maxHeight,
  // Pagination props
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const isTailwindClass = maxHeight && (maxHeight.startsWith('max-h-') || maxHeight === 'flex-1');
  const heightLimitClass = isTailwindClass ? maxHeight : (maxHeight ? "" : "max-h-[var(--table-max-height,715px)]");

  const hasActiveFilters = activeFilters !== undefined &&
    Object.values(activeFilters).some(v => v && v !== '' && v !== 'all');

  return (
    <div 
      className={cn(
        'flex flex-col min-h-0', 
        heightLimitClass, 
        className
      )}
      style={maxHeight && !isTailwindClass ? { maxHeight } : undefined}
    >
      {/* Clear Filters action */}
      {hasActiveFilters && onClear && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <FilterX className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <Table containerClassName="custom-scrollbar flex-1 overflow-auto min-h-0">
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-xs border-b border-border shadow-xs">
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
              {columns.map((col) => {
                const isFilterable = !!col.filterType;
                const filterValue = col.filterKey ? activeFilters?.[col.filterKey] || '' : '';
                const isActive = isFilterable && filterValue !== '' && filterValue !== 'all';
                const isEditing = editingKey === col.key;

                return (
                  <TableHead 
                    key={col.key} 
                    className={cn('py-3.5 text-muted-foreground font-semibold whitespace-nowrap align-middle', col.className)}
                  >
                    <TableHeaderCell
                      col={col}
                      isEditing={isEditing}
                      isActive={isActive}
                      filterValue={filterValue}
                      onFilterChange={onFilterChange}
                      setEditingKey={setEditingKey}
                    />
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && data.length > 0 && 'opacity-50 transition-opacity pointer-events-none')}>
            {isLoading && data.length === 0 ? (
              [...Array(pageSize)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="py-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    'transition-colors group',
                    onRowClick && 'cursor-pointer hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn('py-4 border-border', col.className)}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Integration */}
        {!isLoading && totalResults > 0 && (
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
        </div>

      </div>
    </div>
  );
}
