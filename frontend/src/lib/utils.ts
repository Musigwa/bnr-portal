import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Converts SCREAMING_SNAKE_CASE enum values to Title Case. e.g. UNDER_REVIEW → "Under Review"
export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
