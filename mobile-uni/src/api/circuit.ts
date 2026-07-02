import { request } from '@/utils/request';
import type { Circuit } from '@/types/circuit';

export function fetchCircuits(q = '') {
  return request<Circuit[]>({
    url: `/circuits/search${q ? `?q=${encodeURIComponent(q)}` : ''}`
  });
}

export function fetchCircuitDetail(id: number) {
  return request<Circuit>({ url: `/circuits/${id}` });
}

export function createCircuit(data: Partial<Circuit>) {
  return request<Circuit>({ url: '/circuits', method: 'POST', data });
}

export function updateCircuit(id: number, data: Partial<Circuit>) {
  return request<Circuit>({ url: `/circuits/${id}`, method: 'PUT', data });
}

export function deleteCircuit(id: number) {
  return request<void>({ url: `/circuits/${id}`, method: 'DELETE' });
}
