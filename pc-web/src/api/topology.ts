import http from './http';
import type { ApiSuccess, PageParams, PageResult } from '@/types/common';
import type { Connection, Device, Port, Topology, TopologyPayload } from '@/types/topology';

export function fetchTopologiesByCustomer(customerId: number) {
  return http.get<unknown, ApiSuccess<Topology[]>>('/topologies', {
    params: { customer_id: customerId }
  });
}

export function fetchTopologiesPage(params: PageParams & { customer_id?: number }) {
  return http.get<unknown, ApiSuccess<PageResult<Topology>>>('/topologies', { params });
}

export function fetchTopologyDetail(id: number) {
  return http.get<unknown, ApiSuccess<Topology>>(`/topologies/${id}`);
}

export function createTopology(payload: TopologyPayload) {
  return http.post<unknown, ApiSuccess<Topology>>('/topologies', payload);
}

export function updateTopology(id: number, payload: Partial<TopologyPayload>) {
  return http.put<unknown, ApiSuccess<Topology>>(`/topologies/${id}`, payload);
}

export function deleteTopology(id: number) {
  return http.delete<unknown, ApiSuccess<null>>(`/topologies/${id}`);
}

export function fetchAutoLayout(id: number) {
  return http.get<unknown, ApiSuccess<Array<{ id: number; x: number; y: number }>>>(`/topologies/${id}/auto-layout`);
}

export function updateLayout(id: number, devices: Array<{ id: number; x: number; y: number }>) {
  return http.put<unknown, ApiSuccess<null>>(`/topologies/${id}/layout`, { devices });
}

export function createDevice(payload: Partial<Device>) {
  return http.post<unknown, ApiSuccess<Device>>('/devices', payload);
}

export function updateDevice(id: number, payload: Partial<Device>) {
  return http.put<unknown, ApiSuccess<Device>>(`/devices/${id}`, payload);
}

export function deleteDevice(id: number) {
  return http.delete<unknown, ApiSuccess<null>>(`/devices/${id}`);
}

export function fetchDevicePorts(deviceId: number) {
  return http.get<unknown, ApiSuccess<Port[]>>(`/devices/${deviceId}/ports`);
}

export function createPort(payload: Partial<Port>) {
  return http.post<unknown, ApiSuccess<Port>>('/ports', payload);
}

export function updatePort(id: number, payload: Partial<Port>) {
  return http.put<unknown, ApiSuccess<Port>>(`/ports/${id}`, payload);
}

export function deletePort(id: number) {
  return http.delete<unknown, ApiSuccess<null>>(`/ports/${id}`);
}

export function createConnection(payload: Partial<Connection>) {
  return http.post<unknown, ApiSuccess<Connection>>('/connections', payload);
}

export function updateConnection(id: number, payload: Partial<Connection>) {
  return http.put<unknown, ApiSuccess<Connection>>(`/connections/${id}`, payload);
}

export function deleteConnection(id: number) {
  return http.delete<unknown, ApiSuccess<null>>(`/connections/${id}`);
}
