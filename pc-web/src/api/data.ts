import http from './http';
import type { ApiSuccess } from '@/types/common';

export interface DataBackup {
  version: number;
  exported_at: string;
  source: string;
  data: {
    customers: unknown[];
    topologies: unknown[];
    devices: unknown[];
    ports: unknown[];
    connections: unknown[];
    circuits: unknown[];
  };
}

export interface DataSummary {
  customers: number;
  topologies: number;
  devices: number;
  ports: number;
  connections: number;
  circuits: number;
}

export interface BackupFile {
  filename: string;
  created_at: string;
  size: number;
  summary: DataSummary | null;
}

export function exportData() {
  return http.get<unknown, ApiSuccess<DataBackup>>('/data/export');
}

export function listBackups() {
  return http.get<unknown, ApiSuccess<BackupFile[]>>('/data/backups');
}

export function createBackup() {
  return http.post<unknown, ApiSuccess<BackupFile>>('/data/backups');
}

export function getBackup(filename: string) {
  return http.get<unknown, ApiSuccess<DataBackup>>(`/data/backups/${encodeURIComponent(filename)}`);
}

export function restoreBackup(filename: string) {
  return http.post<unknown, ApiSuccess<DataSummary>>(`/data/backups/${encodeURIComponent(filename)}/restore`);
}

export function importData(payload: DataBackup | Record<string, unknown>) {
  return http.post<unknown, ApiSuccess<DataSummary>>('/data/import', payload);
}

export function clearData() {
  return http.delete<unknown, ApiSuccess<DataSummary>>('/data/clear');
}
