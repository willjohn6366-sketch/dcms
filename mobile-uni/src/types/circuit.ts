import type { Customer } from './customer';

export interface TopologyPort {
  id: number;
  device_id: number;
  port_name: string;
  port_type: string | null;
  port_speed: string | null;
}

export interface TopologyDevice {
  id: number;
  topology_id: number;
  device_name: string;
  device_type: string | null;
  device_model: string | null;
  location: string | null;
  position_x: number | null;
  position_y: number | null;
  Ports?: TopologyPort[];
}

export interface TopologyConnection {
  id: number;
  topology_id: number;
  source_port_id: number | null;
  target_port_id: number | null;
  connection_type: string | null;
  fiber_info: string | null;
}

export interface CircuitTopology {
  id: number;
  topology_name: string;
  description?: string | null;
  layout_data?: string | null;
  Devices?: TopologyDevice[];
  Connections?: TopologyConnection[];
}

export interface CircuitConnectionDetail {
  id: number;
  topology_id: number | null;
  source_port_id: number | null;
  target_port_id: number | null;
  connection_type: string | null;
  fiber_info: string | null;
  SourcePort?: TopologyPort | null;
  TargetPort?: TopologyPort | null;
}

export interface Circuit {
  id: number;
  customer_id: number | null;
  topology_id: number | null;
  connection_id: number | null;
  circuit_name: string;
  circuit_number: string | null;
  circuit_type: 'IPRAN' | 'STN' | '互联网专线' | '裸纤' | 'SDH' | 'MSTP' | 'OTN' | '语音中继' | 'FTTH' | '其他' | null;
  bandwidth: string | null;
  open_date: string | null;
  local_ip: string | null;
  remote_ip: string | null;
  Customer?: Customer;
  Topology?: CircuitTopology | null;
  Connection?: CircuitConnectionDetail | null;
}
