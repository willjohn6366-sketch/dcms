import http from './http';
import type { ApiSuccess, PageParams, PageResult } from '@/types/common';
import type { Customer, CustomerPayload } from '@/types/customer';

export function fetchCustomers() {
  return http.get<unknown, ApiSuccess<Customer[]>>('/customers');
}

export function fetchCustomersPage(params: PageParams) {
  return http.get<unknown, ApiSuccess<PageResult<Customer>>>('/customers', { params });
}

export function createCustomer(payload: CustomerPayload) {
  return http.post<unknown, ApiSuccess<Customer>>('/customers', payload);
}

export function fetchCustomerById(id: number) {
  return http.get<unknown, ApiSuccess<Customer>>(`/customers/${id}`);
}

export function updateCustomer(id: number, payload: CustomerPayload) {
  return http.put<unknown, ApiSuccess<Customer>>(`/customers/${id}`, payload);
}

export function checkCustomer(id: number) {
  return http.post<unknown, ApiSuccess<Customer>>(`/customers/${id}/check`);
}

export function deleteCustomer(id: number) {
  return http.delete<unknown, ApiSuccess<null>>(`/customers/${id}`);
}
