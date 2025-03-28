import { escape } from 'html-escaper';

export const sanitizeInput = (input: string): string => {
  return escape(input.trim())
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' '); 
};