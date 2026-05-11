"use client";

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

  // Debounce filter — mirrors the 500ms delay from the toolbar search bar
  useEffect(() => {
    if (col.filterType !== 'input') return;
    const timer = setTimeout(() => {
      if (inputValue !== filterValue) {
        onFilterChange?.(col.filterKey!, inputValue);
        if (!inputValue) setEditingKey(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [col.filterKey, col.filterType, filterValue, inputValue, onFilterChange, setEditingKey]);

  useEffect(() => {
    if (isEditing) {
      if (col.filterType === 'input') {
        inputRef.current?.focus();
      }
    }
  }, [isEditing, col.filterType]);

  const handleBlur = () => {
    // Debounce already covers apply-on-blur; just close if empty
    if (!inputValue) {
      setEditingKey(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Apply immediately, bypassing the debounce
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
        <div className="relative flex items-center w-full min-w-36 max-w-56" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            placeholder={`Filter ${col.label}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full text-xs h-8 px-2 pr-6 border border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-xs font-normal"
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
              className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-0.5 rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    } else if (col.filterType === 'select') {
      return (
        <div className="relative flex items-center w-full min-w-36 max-w-56" onClick={(e) => e.stopPropagation()}>
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
              className="h-8 text-xs pr-2 border-border bg-card shadow-xs"
            >
              <span className="flex-1 text-left truncate">
                {inputValue && inputValue !== 'all'
                  ? col.filterOptions?.find((o) => o.value === inputValue)?.label ?? inputValue
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
              className="absolute right-7 z-10 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-0.5 rounded-full hover:bg-muted"
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
        "flex items-center gap-1.5 group/header w-full h-8",
        alignmentClass,
        isFilterable && "cursor-pointer select-none"
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
          className="opacity-0 group-hover/header:opacity-100 transition-opacity hover:text-primary text-muted-foreground cursor-pointer"
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