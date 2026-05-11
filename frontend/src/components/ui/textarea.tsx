import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'border-input bg-input-background placeholder:text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:border-ring focus:ring-ring/20 flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-base shadow-sm transition-colors outline-none focus:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
