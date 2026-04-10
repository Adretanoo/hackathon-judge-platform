import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes with ease.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
