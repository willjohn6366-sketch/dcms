import { defineStore } from 'pinia';
import { checkCustomer, createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from '@/api/customer';
import type { Customer, CustomerPayload } from '@/types/customer';

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [] as Customer[],
    loading: false
  }),
  actions: {
    async loadCustomers() {
      this.loading = true;
      try {
        const res = await fetchCustomers();
        this.customers = res.data;
      } finally {
        this.loading = false;
      }
    },
    async addCustomer(payload: CustomerPayload) {
      await createCustomer(payload);
      await this.loadCustomers();
    },
    async editCustomer(id: number, payload: CustomerPayload) {
      await updateCustomer(id, payload);
      await this.loadCustomers();
    },
    async removeCustomer(id: number) {
      await deleteCustomer(id);
      await this.loadCustomers();
    },
    async verifyCustomer(id: number) {
      await checkCustomer(id);
      await this.loadCustomers();
    }
  }
});
