import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableProps } from './types';
import { DataTableToolbar } from './table-toolbar';
import { DataTablePagination } from './table-pagination';

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No results found.',
  className,
  // Toolbar props
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  searchKey,
  filters = [],
  activeFilters,
  onFilterChange,
  onClear,
  // Pagination props
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  return (
    <div className={cn('space-y-0', className)}>
      {/* Toolbar integration */}
      {searchQuery !== undefined && activeFilters !== undefined && (
        <DataTableToolbar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange!}
          searchPlaceholder={searchPlaceholder}
          searchKey={searchKey}
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange!}
          onClear={onClear!}
          totalResults={totalResults}
        />
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                {columns.map((col) => (
                  <TableHead 
                    key={col.key} 
                    className={cn('py-4 text-muted-foreground font-semibold whitespace-nowrap', col.className)}
                  >
                    {col.label}
                  </TableHead>
                ))}
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
        </div>

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
  );
}
