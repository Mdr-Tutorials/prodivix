import { isValidElement, type ReactNode } from 'react';

export const renderUnknownCellValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (isValidElement(value)) return value;
  try {
    return String(value);
  } catch {
    return '[unrenderable value]';
  }
};
