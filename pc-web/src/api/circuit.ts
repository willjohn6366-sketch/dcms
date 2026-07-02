import http from './http';
import type { ApiSuccess, PageParams, PageResult } from '@/types/common';
import type { Circuit, CircuitPayload } from '@/types/circuit';

export function searchCircuits(params: { q?: string; customer_id?: number | undefined }) {
  return http.get<unknown, ApiSuccess<Circuit[]>>('/circuits/search', { params });
}

export function searchCircuitsPage(params: PageParams & { customer_id?: number }) {
  return http.get<unknown, ApiSuccess<PageResult<Circuit>>>('/circuits/search', { params });
}

export function createCircuit(payload: CircuitPayload) {
  return http.post<unknown, ApiSuccess<Circuit>>('/circuits', payload);
}

export function fetchCircuitDetail(id: number) {
  return http.get<unknown, ApiSuccess<Circuit>>(`/circuits/${id}`);
}

export function updateCircuit(id: number, payload: Partial<CircuitPayload>) {
  return http.put<unknown, ApiSuccess<Circuit>>(`/circuits/${id}`, payload);
}

export function deleteCircuit(id: number) {
  return http.delete<unknown, ApiSuccess<null>>(`/circuits/${id}`);
}
