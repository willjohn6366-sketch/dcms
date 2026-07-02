import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue')
        },
        {
          path: '/customers',
          name: 'customers',
          component: () => import('@/views/CustomersView.vue')
        },
        {
          path: '/customers/:id',
          name: 'customer-detail',
          component: () => import('@/views/CustomerDetailView.vue')
        },
        {
          path: '/topologies',
          name: 'topologies',
          component: () => import('@/views/TopologiesView.vue')
        },
        {
          path: '/topologies/:id',
          name: 'topology-detail',
          component: () => import('@/views/TopologyDetailView.vue')
        },
        {
          path: '/circuits',
          name: 'circuits',
          component: () => import('@/views/CircuitsView.vue')
        },
        {
          path: '/circuits/:id',
          name: 'circuit-detail',
          component: () => import('@/views/CircuitDetailView.vue')
        },
        {
          path: '/data',
          name: 'data-maintenance',
          component: () => import('@/views/DataMaintenanceView.vue')
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/AboutView.vue')
        }
      ]
    }
  ]
});

export default router;
