import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormValues } from '@/app/(protected)/applications/new/_components/schema';

const institutionTypeLabels: Record<string, string> = {
  'COMMERCIAL_BANK': 'Commercial Bank',
  'MICROFINANCE': 'Microfinance',
  'DIGITAL_BANK': 'Digital Bank',
};

export function InstitutionFields() {
  const { register, setValue, control, formState: { errors } } = useFormContext<FormValues>();
  const institutionType = useWatch({ control, name: 'institutionType' });

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="institutionName" className="text-foreground/90">Institution Name <span className="text-destructive">*</span></Label>
        <Input
          id="institutionName"
          placeholder="e.g. Kigali Commercial Bank"
          {...register('institutionName')}
          className={errors.institutionName ? 'border-destructive bg-destructive/5' : ''}
        />
        {errors.institutionName && (
          <p className="text-sm text-destructive font-medium">{errors.institutionName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="institutionType" className="text-foreground/90">Institution Type <span className="text-destructive">*</span></Label>
        <Select
          onValueChange={(value) => setValue('institutionType', value ?? '')}
          value={institutionType ?? undefined}
        >
          <SelectTrigger className={errors.institutionType ? 'border-destructive bg-destructive/5' : ''}>
            <SelectValue placeholder="Select institution type">
              {institutionType ? institutionTypeLabels[institutionType] : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent sideOffset={4}>
            <SelectItem value="COMMERCIAL_BANK">Commercial Bank</SelectItem>
            <SelectItem value="MICROFINANCE">Microfinance</SelectItem>
            <SelectItem value="DIGITAL_BANK">Digital Bank</SelectItem>
          </SelectContent>
        </Select>
        {errors.institutionType && (
          <p className="text-sm text-destructive font-medium">{errors.institutionType.message}</p>
        )}
      </div>
    </>
  );
}
