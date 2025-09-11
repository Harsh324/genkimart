export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  // keep 'mock' for now; later set to your real API base URL
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'mock',
};