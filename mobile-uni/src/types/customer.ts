import type { Circuit } from './circuit';

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
  Circuits?: Circuit[];
}
