import type { Connection, Topology } from './topology';
import type { Customer } from './customer';

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
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  Customer?: Customer;
  Topology?: Topology;
  Connection?: Connection;
}

export interface CircuitPayload {
  customer_id?: number | null;
  topology_id?: number | null;
  connection_id?: number | null;
  circuit_name: string;
  circuit_number?: string | null;
  circuit_type?: 'IPRAN' | 'STN' | '互联网专线' | '裸纤' | 'SDH' | 'MSTP' | 'OTN' | '语音中继' | 'FTTH' | '其他' | null;
  bandwidth?: string | null;
  open_date?: string | null;
  local_ip?: string | null;
  remote_ip?: string | null;
}
