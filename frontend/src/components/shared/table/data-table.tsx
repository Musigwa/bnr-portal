'use client';

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
  const isTailwindClass =
    maxHeight && (maxHeight.startsWith('max-h-') || maxHeight === 'flex-1');
  const heightLimitClass = isTailwindClass
    ? maxHeight
    : maxHeight
      ? ''
      : 'max-h-[var(--table-max-height,715px)]';

  const hasActiveFilters =
    activeFilters !== undefined &&
    Object.values(activeFilters).some((v) => v && v !== '' && v !== 'all');

  return (
    <div
      className={cn('flex min-h-0 flex-col', heightLimitClass, className)}
      style={maxHeight && !isTailwindClass ? { maxHeight } : undefined}
    >
      {/* Clear Filters action */}
      {hasActiveFilters && onClear && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-primary flex cursor-pointer items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <FilterX className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <Table containerClassName="custom-scrollbar flex-1 overflow-auto min-h-0">
            <TableHeader className="bg-card/95 border-border sticky top-0 z-10 border-b shadow-xs backdrop-blur-xs">
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                {columns.map((col) => {
                  const isFilterable = !!col.filterType;
                  const filterValue = col.filterKey
                    ? activeFilters?.[col.filterKey] || ''
                    : '';
                  const isActive =
                    isFilterable && filterValue !== '' && filterValue !== 'all';
                  const isEditing = editingKey === col.key;

                  return (
                    <TableHead
                      key={col.key}
                      className={cn(
                        'text-muted-foreground py-3.5 align-middle font-semibold whitespace-nowrap',
                        col.className,
                      )}
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
            <TableBody
              className={cn(
                isLoading &&
                  data.length > 0 &&
                  'pointer-events-none opacity-50 transition-opacity',
              )}
            >
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
                    className="text-muted-foreground h-40 text-center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      'group transition-colors',
                      onRowClick && 'hover:bg-muted/50 cursor-pointer',
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn('border-border py-4', col.className)}
                      >
                        {col.render
                          ? col.render(item)
                          : String(
                              (item as Record<string, unknown>)[col.key] || '',
                            )}
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
