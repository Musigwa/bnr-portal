import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export function ApiEnumProperty(
  options: ApiPropertyOptions & { enum: object },
) {
  return applyDecorators(
    ApiProperty({
      ...options,
      required: false,
    } as unknown as ApiPropertyOptions),
    IsOptional(),
    IsEnum(options.enum),
    Transform(({ value }: { value: string }) => value?.toUpperCase()),
  );
}
