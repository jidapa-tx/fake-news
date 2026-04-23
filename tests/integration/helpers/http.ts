const BASE_URL = process.env.INTEGRATION_BASE_URL ?? 'http://localhost:3000';

export const TEST_TAG = '__test__';
export const TEST_IP = '10.99.99.42';

function withHeaders(headers?: HeadersInit, ip: string = TEST_IP): HeadersInit {
  return {
    ...(headers ?? {}),
    'x-forwarded-for': ip,
  };
}

export async function getJson(path: string, opts: { ip?: string; headers?: HeadersInit } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: withHeaders(opts.headers, opts.ip),
  });
  const body = await safeJson(res);
  return { status: res.status, body };
}

export async function postJson(path: string, data: unknown, opts: { ip?: string } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: withHeaders({ 'Content-Type': 'application/json' }, opts.ip),
    body: JSON.stringify(data),
  });
  const body = await safeJson(res);
  return { status: res.status, body };
}

export async function postForm(path: string, form: FormData, opts: { ip?: string } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: withHeaders(undefined, opts.ip),
    body: form,
  });
  const body = await safeJson(res);
  return { status: res.status, body };
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function expectErrorShape(body: unknown, code: string): void {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('error' in body) ||
    typeof (body as { error: unknown }).error !== 'object'
  ) {
    throw new Error(`expected error object, got: ${JSON.stringify(body)}`);
  }
  const err = (body as { error: { code: string; message_th: string; message_en: string } }).error;
  if (err.code !== code) throw new Error(`expected code ${code}, got ${err.code}`);
  if (typeof err.message_th !== 'string') throw new Error('message_th missing');
  if (typeof err.message_en !== 'string') throw new Error('message_en missing');
}
