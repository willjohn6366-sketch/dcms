import { request } from '@/utils/request';
import type { TopologyDevice, TopologyPort } from '@/types/circuit';

export function addDevice(data: {
  topology_id: number;
  device_name: string;
  device_type?: string;
  device_model?: string;
  location?: string;
}) {
  return request<TopologyDevice>({ url: '/devices', method: 'POST', data });
}

export function updateDevice(id: number, data: Partial<TopologyDevice>) {
  return request<TopologyDevice>({ url: `/devices/${id}`, method: 'PUT', data });
}

export function deleteDevice(id: number) {
  return request<void>({ url: `/devices/${id}`, method: 'DELETE' });
}

export function fetchDevicePorts(deviceId: number) {
  return request<TopologyPort[]>({ url: `/devices/${deviceId}/ports` });
}
