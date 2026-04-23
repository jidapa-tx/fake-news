const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

interface Window {
  count: number;
  windowStart: number;
}

const store = new Map<string, Window>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
