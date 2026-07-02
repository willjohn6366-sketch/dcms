import type { Customer } from './customer';

export interface Port {
  id: number;
  device_id: number;
  port_name: string;
  port_type: 'optical' | 'electrical' | 'other';
  port_speed: string | null;
}

export interface Device {
  id: number;
  topology_id: number;
  device_name: string;
  device_type: 'router' | 'switch' | 'odf' | 'optical_device' | 'other';
  device_model: string | null;
  location: string | null;
  position_x: number;
  position_y: number;
  Ports?: Port[];
}

export interface Connection {
  id: number;
  topology_id: number;
  source_port_id: number;
  target_port_id: number;
  connection_type: 'fiber' | 'cable' | 'other';
  fiber_info: string | null;
  Circuits?: Array<{
    id: number;
    circuit_name: string;
    circuit_number: string;
  }>;
}

export interface Topology {
  id: number;
  customer_id: number;
  topology_name: string;
  description: string | null;
  Customer?: Pick<Customer, 'id' | 'name'>;
  Devices?: Device[];
  Connections?: Connection[];
}

export interface TopologyPayload {
  customer_id: number;
  topology_name: string;
  description?: string;
}
