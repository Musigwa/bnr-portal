import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormContext } from 'react-hook-form';
import { FormValues } from '../schema';

export function FinancialFields() {
  const { register, formState: { errors } } = useFormContext<FormValues>();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="registrationNumber" className="text-foreground/90">Registration Number <span className="text-destructive">*</span></Label>
        <Input
          id="registrationNumber"
          placeholder="e.g. RDB-2026-001"
          {...register('registrationNumber')}
          className={errors.registrationNumber ? 'border-destructive bg-destructive/5' : ''}
        />
        {errors.registrationNumber && (
          <p className="text-sm text-destructive font-medium">{errors.registrationNumber.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="proposedCapital" className="text-foreground/90">Proposed Capital (RWF) <span className="text-destructive">*</span></Label>
        <Input
          id="proposedCapital"
          type="number"
          placeholder="e.g. 5000000"
          {...register('proposedCapital', { valueAsNumber: true })}
          className={errors.proposedCapital ? 'border-destructive bg-destructive/5' : ''}
        />
        {errors.proposedCapital && (
          <p className="text-sm text-destructive font-medium">{errors.proposedCapital.message}</p>
        )}
      </div>
    </>
  );
}
