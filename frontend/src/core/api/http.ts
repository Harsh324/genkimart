import { env } from '../config/env';

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (env.API_BASE_URL === 'mock') {
    throw new Error('http() called while in mock mode');
  }
  const res = await fetch(`${env.API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: init.method && init.method !== 'GET' ? 'no-store' : 'force-cache',
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json() as Promise<T>;
}