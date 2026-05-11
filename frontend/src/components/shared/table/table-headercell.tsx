'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Filter, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ColumnDef } from './types';

interface TableHeaderCellProps<T> {
  col: ColumnDef<T>;
  isEditing: boolean;
  isActive: boolean;
  filterValue: string;
  onFilterChange?: (key: string, value: string) => void;
  setEditingKey: (key: string | null) => void;
}

export function TableHeaderCell<T>({
  col,
  isEditing,
  isActive,
  filterValue,
  onFilterChange,
  setEditingKey,
}: TableHeaderCellProps<T>) {
  const isFilterable = !!col.filterType;
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(filterValue);

  const [prevFilterValue, setPrevFilterValue] = useState(filterValue);
  if (prevFilterValue !== filterValue) {
    setPrevFilterValue(filterValue);
    setInputValue(filterValue);
  }

  // debounce to match toolbar
  useEffect(() => {
    if (col.filterType !== 'input') return;
    const timer = setTimeout(() => {
      if (inputValue !== filterValue) {
        onFilterChange?.(col.filterKey!, inputValue);
        if (!inputValue) setEditingKey(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    col.filterKey,
    col.filterType,
    filterValue,
    inputValue,
    onFilterChange,
    setEditingKey,
  ]);

  useEffect(() => {
    if (isEditing) {
      if (col.filterType === 'input') {
        inputRef.current?.focus();
      }
    }
  }, [isEditing, col.filterType]);

  const handleBlur = () => {
    // close if empty
    if (!inputValue) {
      setEditingKey(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // bypass debounce
      onFilterChange?.(col.filterKey!, e.currentTarget.value);
      if (!e.currentTarget.value) setEditingKey(null);
    } else if (e.key === 'Escape') {
      onFilterChange?.(col.filterKey!, '');
      setInputValue('');
      setEditingKey(null);
    }
  };

  if (isFilterable && (isEditing || isActive)) {
    if (col.filterType === 'input') {
      return (
        <div
          className="relative flex w-full max-w-56 min-w-36 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={`Filter ${col.label}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="border-border bg-card text-foreground focus:ring-primary focus:border-primary h-8 w-full rounded-lg border px-2 pr-6 text-xs font-normal shadow-xs focus:ring-1 focus:outline-none"
          />
          {inputValue && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur firing before this click
                setInputValue('');
                onFilterChange?.(col.filterKey!, '');
                setEditingKey(null);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-muted absolute right-2 cursor-pointer rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    } else if (col.filterType === 'select') {
      return (
        <div
          className="relative flex w-full max-w-56 min-w-36 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            value={inputValue || 'all'}
            onValueChange={(val) => {
              const value = val ?? 'all';
              setInputValue(value);
              onFilterChange?.(col.filterKey!, value);
              if (value === 'all') {
                setEditingKey(null);
              }
            }}
            onOpenChange={(open) => {
              if (!open && (!inputValue || inputValue === 'all')) {
                setEditingKey(null);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="border-border bg-card h-8 pr-2 text-xs shadow-xs"
            >
              <span className="flex-1 truncate text-left">
                {inputValue && inputValue !== 'all'
                  ? (col.filterOptions?.find((o) => o.value === inputValue)
                      ?.label ?? inputValue)
                  : `All ${col.label}`}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all">All {col.label}</SelectItem>
              {col.filterOptions?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {inputValue && inputValue !== 'all' && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setInputValue('');
                onFilterChange?.(col.filterKey!, 'all');
                setEditingKey(null);
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-muted absolute right-7 z-10 cursor-pointer rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    }
  }

  const isRightAligned = col.className?.includes('text-right');
  const isCenterAligned = col.className?.includes('text-center');
  const alignmentClass = isRightAligned
    ? 'justify-end'
    : isCenterAligned
      ? 'justify-center'
      : 'justify-start';

  return (
    <div
      className={cn(
        'group/header flex h-8 w-full items-center gap-1.5',
        alignmentClass,
        isFilterable && 'cursor-pointer select-none',
      )}
      onClick={() => {
        if (isFilterable) {
          setEditingKey(col.key);
        }
      }}
    >
      <span className="truncate">{col.label}</span>
      {isFilterable && (
        <button
          type="button"
          className="hover:text-primary text-muted-foreground cursor-pointer opacity-0 transition-opacity group-hover/header:opacity-100"
        >
          {col.filterType === 'input' ? (
            <Search className="h-3.5 w-3.5" />
          ) : (
            <Filter className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
