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
      // Error is handled by the caller or notification system
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="pt-2 text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requireNote && (
          <div className="grid gap-3 py-4">
            <Label htmlFor="note" className="text-sm font-bold text-foreground uppercase tracking-tight">
              {noteLabel} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="note"
              placeholder={notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[140px] border border-input bg-muted/50 focus:bg-background focus-visible:ring-4 focus-visible:ring-ring/10 transition-all resize-none p-4 text-sm shadow-sm"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="font-semibold text-muted-foreground hover:text-foreground"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || (requireNote && !note.trim())}
            className={`font-bold px-6 shadow-md ${
              variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 
              variant === 'success' ? 'bg-green-600 hover:bg-green-700' : ''
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
