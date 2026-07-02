import type { TopologyDevice, TopologyConnection, TopologyPort } from '@/types/circuit';

export type { TopologyDevice, TopologyConnection, TopologyPort };

export interface Topology {
  id: number;
  customer_id: number;
  topology_name: string;
  description?: string | null;
  layout_data?: string | null;
  Devices?: TopologyDevice[];
  Connections?: TopologyConnection[];
  created_at?: string;
  updated_at?: string;
}
