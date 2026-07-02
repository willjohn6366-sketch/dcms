import { request } from '@/utils/request';
import type { Customer } from '@/types/customer';

export function fetchCustomers() {
  return request<Customer[]>({ url: '/customers' });
}

export function fetchCustomerDetail(id: number) {
  return request<Customer>({ url: `/customers/${id}` });
}

export function createCustomer(data: Partial<Customer>) {
  return request<Customer>({ url: '/customers', method: 'POST', data });
}

export function updateCustomer(id: number, data: Partial<Customer>) {
  return request<Customer>({ url: `/customers/${id}`, method: 'PUT', data });
}

export function checkCustomer(id: number) {
  return request<Customer>({ url: `/customers/${id}/check`, method: 'POST' });
}

export function deleteCustomer(id: number) {
  return request<void>({ url: `/customers/${id}`, method: 'DELETE' });
}
