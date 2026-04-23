import { createHash } from 'crypto';

export function hashQuery(text: string): string {
  return createHash('sha256')
    .update(text.toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex');
}
