'use client';

import * as React from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface Preset {
  label: string;
  getValue: () => DateRange;
}

const presets: Preset[] = [
  {
    label: 'All Time',
    getValue: () => ({ startDate: null, endDate: null }),
  },
  {
    label: 'Today',
    getValue: () => {
      const now = new Date();
      return { startDate: new Date(now), endDate: new Date(now) };
    },
  },
  {
    label: 'Last 7 Days',
    getValue: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { startDate: start, endDate: now };
    },
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { startDate: start, endDate: now };
    },
  },
  {
    label: 'This Month',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: now };
    },
  },
  {
    label: 'This Year',
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start, endDate: now };
    },
  },
];

export function formatDate(date: Date | null): string {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDate(d: Date | null): Date | null {
  if (!d) return null;
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

interface DateRangeCalendarProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
}

export function DateRangeCalendar({
  value,
  onChange,
  className,
}: DateRangeCalendarProps) {
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  // Current calendar month view state
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    return value.endDate || value.startDate || new Date();
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const nextDate = new Date(currentDate);
    if (direction === 'prev') {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleDayClick = (day: Date) => {
    if (normalizeDate(day)! > today) return;
    if (!value.startDate || (value.startDate && value.endDate)) {
      onChange({ startDate: day, endDate: null });
    } else {
      const nStart = normalizeDate(value.startDate)!;
      const nDay = normalizeDate(day)!;

      if (nDay < nStart) {
        onChange({ startDate: day, endDate: null });
      } else {
        onChange({ startDate: value.startDate, endDate: day });
      }
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    const range = preset.getValue();
    onChange(range);
    if (range.endDate) {
      setCurrentDate(range.endDate);
    } else {
      setCurrentDate(new Date());
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const isCurrentMonthOrFuture = React.useMemo(() => {
    const now = new Date();
    return (
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth())
    );
  }, [year, month]);

  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();

    const startGrid = new Date(firstDay);
    startGrid.setDate(startGrid.getDate() - startOffset);

    const days: Date[] = [];
    const pointer = new Date(startGrid);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(pointer));
      pointer.setDate(pointer.getDate() + 1);
    }
    return days;
  }, [year, month]);

  const nStart = normalizeDate(value.startDate);
  const nEnd = normalizeDate(value.endDate);
  const nHover = normalizeDate(hoverDate);
  const today = normalizeDate(new Date())!;

  const getDayClass = (day: Date) => {
    const nDay = normalizeDate(day)!;
    const isCurrentMonth = day.getMonth() === month;
    const isToday = nDay.getTime() === today.getTime();
    const isFuture = nDay > today;

    const isStart = nStart && nDay.getTime() === nStart.getTime();
    const isEnd = nEnd && nDay.getTime() === nEnd.getTime();

    let inRange = false;
    let isRangeMiddle = false;

    if (nStart) {
      if (nEnd) {
        inRange = nDay >= nStart && nDay <= nEnd;
        isRangeMiddle = inRange && !isStart && !isEnd;
      } else if (nHover && nHover >= nStart) {
        inRange = nDay >= nStart && nDay <= nHover;
        isRangeMiddle =
          inRange && !isStart && nDay.getTime() !== nHover.getTime();
      }
    }

    return cn(
      'h-7 w-full flex items-center justify-center text-[11px] font-normal transition-all duration-75 relative outline-none select-none cursor-pointer rounded-md border border-transparent',
      (!isCurrentMonth || isFuture) &&
        'text-muted-foreground/30 pointer-events-none',
      isCurrentMonth &&
        !isFuture &&
        !isStart &&
        !isEnd &&
        !inRange &&
        'text-foreground hover:bg-muted hover:border-border',
      isToday &&
        !isStart &&
        !isEnd &&
        'border-primary/55 font-semibold text-primary',
      inRange && 'bg-primary/10',
      isRangeMiddle && 'text-primary dark:text-foreground hover:bg-primary/20',
      isStart &&
        'bg-primary text-primary-foreground rounded-l-md font-semibold select-none',
      isEnd &&
        'bg-primary text-primary-foreground rounded-r-md font-semibold select-none',
      isStart && !nEnd && !nHover && 'rounded-md',
    );
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div
      className={cn(
        'border-border bg-popover text-popover-foreground flex h-auto flex-col overflow-hidden rounded-lg border select-none sm:flex-row',
        className,
      )}
    >
      {/* Quick presets sidebar */}
      <div className="border-border bg-muted/10 flex w-full shrink-0 justify-start gap-1 overflow-x-auto border-b p-2 sm:w-[110px] sm:flex-col sm:overflow-x-visible sm:border-r sm:border-b-0">
        {presets.map((preset) => {
          const isActive =
            (!value.startDate &&
              !value.endDate &&
              preset.label === 'All Time') ||
            (value.startDate &&
              value.endDate &&
              formatDate(value.startDate) ===
                formatDate(preset.getValue().startDate) &&
              formatDate(value.endDate) ===
                formatDate(preset.getValue().endDate));

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                'shrink-0 cursor-pointer rounded-md px-2 py-1.5 text-left text-[11px] font-normal transition-colors sm:shrink',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Calendar main panel */}
      <div className="flex w-[260px] shrink-0 flex-col p-3.5">
        {/* Header with navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="border-border hover:bg-muted text-muted-foreground hover:text-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-foreground text-xs font-semibold tracking-tight select-none">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            disabled={isCurrentMonthOrFuture}
            className={cn(
              'border-border hover:bg-muted text-muted-foreground hover:text-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border transition-colors',
              isCurrentMonthOrFuture && 'pointer-events-none opacity-40',
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Weekdays indicator header */}
        <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-[10px] font-semibold select-none">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() =>
                value.startDate && !value.endDate && setHoverDate(day)
              }
              onMouseLeave={() => setHoverDate(null)}
              className={getDayClass(day)}
            >
              {day.getDate()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function DateRangePicker({
  value,
  onChange,
  className,
  align = 'end',
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange>(value);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setTempRange(value);
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    setOpen(false);
  };

  const handleReset = () => {
    const emptyRange = { startDate: null, endDate: null };
    setTempRange(emptyRange);
    onChange(emptyRange);
    setOpen(false);
  };

  const handleClearTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: null, endDate: null });
  };

  const hasSelectedRange = value.startDate || value.endDate;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <div
            className={cn(
              'group border-border bg-card hover:bg-accent text-foreground relative flex h-10 w-full shrink-0 cursor-pointer items-center gap-1 rounded-lg border px-3 py-2 pr-8 text-sm transition-colors select-none sm:w-auto',
              className,
            )}
          />
        }
      >
        <Calendar className="text-muted-foreground mr-1 h-4 w-4 shrink-0" />
        <div className="flex items-center gap-1.5 text-xs font-normal sm:text-sm">
          <span
            className={
              value.startDate ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            {value.startDate ? formatDate(value.startDate) : 'Start date'}
          </span>
          <span className="text-muted-foreground font-light">~</span>
          <span
            className={
              value.endDate ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            {value.endDate ? formatDate(value.endDate) : 'End date'}
          </span>
        </div>

        {hasSelectedRange ? (
          <button
            onClick={handleClearTrigger}
            className="hover:text-foreground text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <Calendar className="text-muted-foreground/30 pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 transition-opacity group-hover:opacity-0" />
        )}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="border-border bg-popover text-popover-foreground ring-foreground/10 w-auto overflow-hidden rounded-xl border p-4 shadow-lg ring-1"
      >
        <div className="space-y-4">
          <DateRangeCalendar value={tempRange} onChange={setTempRange} />

          <div className="border-border flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground max-w-[120px] truncate text-[10px] font-medium select-none">
              {tempRange.startDate
                ? formatDate(tempRange.startDate)
                : 'No selection'}
              {tempRange.endDate ? ` ~ ${formatDate(tempRange.endDate)}` : ''}
            </span>
            <div className="flex shrink-0 gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                onClick={handleReset}
                className="h-7 text-[10px]"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setOpen(false)}
                className="h-7 text-[10px]"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="xs"
                onClick={handleApply}
                className="h-7 px-2.5 text-[10px] font-medium"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
