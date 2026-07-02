import { request } from '@/utils/request';
import type { TopologyConnection } from '@/types/circuit';

export function createConnection(data: {
  topology_id: number;
  source_port_id: number;
  target_port_id: number;
  connection_type?: 'fiber' | 'cable' | 'other';
  fiber_info?: string;
}) {
  return request<TopologyConnection>({ url: '/connections', method: 'POST', data });
}

export function updateConnection(id: number, data: Partial<TopologyConnection>) {
  return request<TopologyConnection>({ url: `/connections/${id}`, method: 'PUT', data });
}

export function deleteConnection(id: number) {
  return request<void>({ url: `/connections/${id}`, method: 'DELETE' });
}
