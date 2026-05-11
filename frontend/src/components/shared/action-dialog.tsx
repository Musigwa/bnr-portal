'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (note: string) => Promise<void>;
  variant?: 'default' | 'destructive' | 'success';
  requireNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
}

export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
  requireNote = false,
  noteLabel = 'Notes',
  notePlaceholder = 'Enter your notes here...',
}: ActionDialogProps) {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(note);
      setNote('');
      onOpenChange(false);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireNote && (
          <div className="grid gap-3 py-4">
            <Label
              htmlFor="note"
              className="text-foreground text-sm font-bold tracking-tight uppercase"
            >
              {noteLabel} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="note"
              placeholder={notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border-input bg-muted/50 focus:bg-background focus-visible:ring-ring/10 min-h-[140px] resize-none border p-4 text-sm shadow-sm transition-all focus-visible:ring-4"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground font-semibold"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || (requireNote && !note.trim())}
            className={`px-6 font-bold shadow-md ${
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700'
                : variant === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
            }`}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
