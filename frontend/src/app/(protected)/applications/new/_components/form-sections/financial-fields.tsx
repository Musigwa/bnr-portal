'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormContext } from 'react-hook-form';
import { FormValues } from '@/app/(protected)/applications/new/_components/schema';

export function FinancialFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="tinNumber" className="text-foreground/90">
          TIN Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tinNumber"
          placeholder="e.g. 123456789"
          {...register('tinNumber')}
          className={
            errors.tinNumber ? 'border-destructive bg-destructive/5' : ''
          }
        />
        {errors.tinNumber && (
          <p className="text-destructive text-sm font-medium">
            {errors.tinNumber.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="proposedCapital" className="text-foreground/90">
          Proposed Capital (RWF) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="proposedCapital"
          type="number"
          placeholder="e.g. 5000000"
          {...register('proposedCapital', { valueAsNumber: true })}
          className={
            errors.proposedCapital ? 'border-destructive bg-destructive/5' : ''
          }
        />
        {errors.proposedCapital && (
          <p className="text-destructive text-sm font-medium">
            {errors.proposedCapital.message}
          </p>
        )}
      </div>
    </>
  );
}
