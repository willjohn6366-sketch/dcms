import { request } from '@/utils/request';
import type { Topology } from '@/types/topology';

export interface LayoutPosition {
  id: number;
  x: number;
  y: number;
}

export function fetchTopologies(customerId?: number) {
  return request<Topology[]>({
    url: customerId ? `/topologies?customer_id=${customerId}` : '/topologies'
  });
}

export function fetchTopologyDetail(id: number) {
  return request<Topology>({ url: `/topologies/${id}` });
}

export function createTopology(data: { customer_id: number; topology_name: string; description?: string }) {
  return request<Topology>({ url: '/topologies', method: 'POST', data });
}

export function updateTopology(id: number, data: Partial<Topology>) {
  return request<Topology>({ url: `/topologies/${id}`, method: 'PUT', data });
}

export function deleteTopology(id: number) {
  return request<void>({ url: `/topologies/${id}`, method: 'DELETE' });
}

export function fetchAutoLayout(id: number) {
  return request<LayoutPosition[]>({ url: `/topologies/${id}/auto-layout` });
}

export function updateLayout(id: number, devices: LayoutPosition[]) {
  return request<void>({ url: `/topologies/${id}/layout`, method: 'PUT', data: { devices } });
}
