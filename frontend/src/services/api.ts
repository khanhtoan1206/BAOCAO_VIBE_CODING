import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

export interface Health {
  status: 'ok';
  service: string;
  phase: number;
  database: string;
  timestamp: string;
}

export async function getHealth(signal: AbortSignal): Promise<Health> {
  const response = await api.get<{ data: Health }>('/health', { signal });
  if (response.data?.data?.status !== 'ok' || response.data.data.service !== 'kt-shop-api') {
    throw new Error('API trả về dữ liệu không hợp lệ.');
  }
  return response.data.data;
}