import type { Circuit } from './circuit';
import type { Topology } from './topology';

export interface Customer {
  id: number;
  name: string;
  contact_person: string | null;
  contact_phone: string | null;
  account_manager: string | null;
  manager_phone: string | null;
  latest_check_date: string | null;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
  Topologies?: Topology[];
  Circuits?: Circuit[];
}

export interface CustomerPayload {
  name: string;
  contact_person?: string;
  contact_phone?: string;
  account_manager?: string;
  manager_phone?: string;
}
