"use client";

import * as React from 'react';
import { Filter, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateRangeCalendar, formatDate } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

interface FilterPopoverProps {
  startDate: string | undefined;
  endDate: string | undefined;
  onApply: (dates: { startDate: string | undefined; endDate: string | undefined }) => void;
  align?: 'start' | 'center' | 'end';
}

export function FilterPopover({
  startDate,
  endDate,
  onApply,
  align = 'end',
}: FilterPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  
  // Temporary state inside the filter popup
  const [tempStart, setTempStart] = React.useState<Date | null>(null);
  const [tempEnd, setTempEnd] = React.useState<Date | null>(null);

  // Sync temp values when the popover opens
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setTempStart(startDate ? new Date(startDate) : null);
      setTempEnd(endDate ? new Date(endDate) : null);
      setCalendarOpen(false); // keep calendar collapsed initially
    }
  };

  const handleApply = () => {
    onApply({
      startDate: tempStart ? formatDate(tempStart) : undefined,
      endDate: tempEnd ? formatDate(tempEnd) : undefined,
    });
    setOpen(false);
  };

  const handleReset = () => {
    setTempStart(null);
    setTempEnd(null);
    onApply({
      startDate: undefined,
      endDate: undefined,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleCalendarChange = (range: { startDate: Date | null; endDate: Date | null }) => {
    setTempStart(range.startDate);
    setTempEnd(range.endDate);
  };

  const activeCount = (startDate || endDate) ? 1 : 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative h-10 w-10 bg-card border-border hover:bg-accent text-foreground cursor-pointer shrink-0"
          />
        }
      >
        <Filter className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground animate-in zoom-in duration-200">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align={align} className="w-auto p-4 border border-border bg-popover text-popover-foreground rounded-xl shadow-lg ring-1 ring-foreground/10 max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-border">
            <h4 className="font-semibold text-sm">Filters</h4>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCancel}
              className="hover:bg-accent text-muted-foreground hover:text-foreground rounded-md"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Range Input & Collapsible Calendar */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Date Range</Label>
            
            {/* Input Trigger Button */}
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCalendarOpen(!calendarOpen);
                }
              }}
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 border border-border bg-card hover:bg-accent rounded-lg text-xs h-9 cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                calendarOpen && "border-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={tempStart ? "text-foreground" : "text-muted-foreground"}>
                  {tempStart ? formatDate(tempStart) : "Start date"}
                </span>
                <span className="text-muted-foreground font-light">~</span>
                <span className={tempEnd ? "text-foreground" : "text-muted-foreground"}>
                  {tempEnd ? formatDate(tempEnd) : "End date"}
                </span>
              </div>
              {tempStart || tempEnd ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempStart(null);
                    setTempEnd(null);
                  }}
                  className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : calendarOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>

            {/* Collapsible Calendar Grid */}
            {calendarOpen && (
              <div className="pt-1 animate-in slide-in-from-top-1 fade-in duration-200">
                <DateRangeCalendar
                  value={{ startDate: tempStart, endDate: tempEnd }}
                  onChange={handleCalendarChange}
                  className="!border-border border rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Bottom Filter Actions */}
          <div className="flex items-center justify-between gap-2 border-t pt-3 border-border">
            <Button
              variant="ghost"
              size="xs"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Reset All
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={handleCancel}
                className="h-8 text-xs border-border bg-card hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="xs"
                onClick={handleApply}
                className="h-8 text-xs font-semibold"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
