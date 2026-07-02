<template>
  <div class="page-stack" v-loading="loading">
    <section class="detail-hero page-card">
      <div>
        <div class="detail-hero__label">客户详情</div>
        <h1 class="detail-hero__title">{{ customer?.name || '客户资料' }}</h1>
        <div class="detail-hero__meta">最近核查：{{ customer?.latest_check_date || '未核查' }}</div>
      </div>
      <div class="toolbar-actions">
        <el-button :loading="checking" @click="verifyCustomer">核查</el-button>
        <el-button @click="goBack">返回</el-button>
      </div>
    </section>

    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="section-title">联系信息</div>
      </template>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-item__label">联系人</span>
          <span class="info-item__value">{{ customer?.contact_person || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">联系电话</span>
          <span class="info-item__value">{{ customer?.contact_phone || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">客户经理</span>
          <span class="info-item__value">{{ customer?.account_manager || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">经理电话</span>
          <span class="info-item__value">{{ customer?.manager_phone || '-' }}</span>
        </div>
      </div>
    </el-card>

    <el-row :gutter="18">
      <el-col :span="12">
        <el-card class="page-card" shadow="never">
          <template #header>
            <div class="toolbar-row">
              <div>
                <div class="section-title">组网拓扑</div>
                <div class="section-meta">{{ customer?.Topologies?.length || 0 }} 个拓扑</div>
              </div>
            </div>
          </template>

          <el-table :data="customer?.Topologies || []">
            <el-table-column prop="topology_name" label="拓扑名称" min-width="180" />
            <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="goTopology(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="page-card" shadow="never">
          <template #header>
            <div>
              <div class="section-title">电路概览</div>
              <div class="section-meta">{{ customer?.Circuits?.length || 0 }} 条电路</div>
            </div>
          </template>

          <el-table :data="customer?.Circuits || []">
            <el-table-column prop="circuit_name" label="电路名称" min-width="160" />
            <el-table-column prop="circuit_number" label="电路编号" min-width="150" />
            <el-table-column prop="bandwidth" label="带宽" width="100" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="goCircuit(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { checkCustomer, fetchCustomerById } from '@/api/customer';
import type { Customer } from '@/types/customer';

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);

const loading = ref(false);
const checking = ref(false);
const customer = ref<Customer | null>(null);

function goBack() {
  router.push('/customers');
}

function goTopology(topologyId: number) {
  router.push(`/topologies/${topologyId}`);
}

function goCircuit(circuitId: number) {
  router.push(`/circuits/${circuitId}`);
}

async function verifyCustomer() {
  checking.value = true;
  try {
    const res = await checkCustomer(id);
    if (customer.value) {
      customer.value = {
        ...customer.value,
        latest_check_date: res.data.latest_check_date,
        updated_at: res.data.updated_at
      };
    }
    ElMessage.success('已同步核查时间');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    checking.value = false;
  }
}

async function loadDetail() {
  loading.value = true;
  try {
    const res = await fetchCustomerById(id);
    customer.value = res.data;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
});
</script>

<style scoped>
.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
}

.detail-hero__label {
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 800;
}

.detail-hero__title {
  margin: 6px 0 0;
  color: var(--cm-text);
  font-size: 28px;
  font-weight: 800;
  line-height: 1.25;
}

.detail-hero__meta {
  margin-top: 8px;
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 700;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.info-item {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-surface-soft);
}

.info-item__label {
  display: block;
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 700;
}

.info-item__value {
  display: block;
  overflow: hidden;
  margin-top: 8px;
  color: var(--cm-text);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
