<template>
  <div class="customer-detail" v-loading="loading">
    <header class="detail-header">
      <div class="detail-heading">
        <div class="detail-heading__main">
          <h1>{{ customer?.name || '客户资料' }}</h1>
          <span class="check-status">最近核查：{{ customer?.latest_check_date || '未核查' }}</span>
        </div>
        <div class="detail-actions">
          <el-button type="primary" :loading="checking" :disabled="!customer" @click="verifyCustomer">核查</el-button>
          <el-button @click="goBack">返回</el-button>
        </div>
      </div>
    </header>

    <div class="detail-content">
      <section class="detail-section contact-section">
        <h2>联系信息</h2>
        <dl class="info-grid">
          <div class="info-item"><dt>联系人</dt><dd>{{ customer?.contact_person || '-' }}</dd></div>
          <div class="info-item"><dt>联系电话</dt><dd>{{ customer?.contact_phone || '-' }}</dd></div>
          <div class="info-item"><dt>客户经理</dt><dd>{{ customer?.account_manager || '-' }}</dd></div>
          <div class="info-item"><dt>经理电话</dt><dd>{{ customer?.manager_phone || '-' }}</dd></div>
        </dl>
      </section>

      <section class="detail-section">
        <div class="section-heading"><h2>组网拓扑</h2><p>{{ customer?.Topologies?.length || 0 }} 个拓扑</p></div>
        <div class="detail-table">
          <el-table :data="customer?.Topologies || []" empty-text="暂无组网拓扑">
            <el-table-column prop="topology_name" label="拓扑名称" min-width="260" />
            <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" min-width="80">
              <template #default="{ row }"><el-button link type="primary" @click="goTopology(row.id)">查看</el-button></template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section class="detail-section circuit-section">
        <div class="section-heading"><h2>电路概览</h2><p>{{ customer?.Circuits?.length || 0 }} 条电路</p></div>
        <div class="detail-table detail-table--circuit">
          <el-table :data="customer?.Circuits || []" empty-text="暂无电路数据">
            <el-table-column type="index" label="序号" min-width="70" align="center" />
            <el-table-column prop="circuit_name" label="电路名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="circuit_number" label="电路编号" min-width="210" show-overflow-tooltip />
            <el-table-column prop="bandwidth" label="带宽" min-width="95" />
            <el-table-column label="操作" min-width="100">
              <template #default="{ row }"><el-button link type="primary" @click="goCircuit(row.id)">查看</el-button></template>
            </el-table-column>
          </el-table>
        </div>
      </section>
    </div>
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
.customer-detail {
  position: relative;
  min-height: 100vh;
  padding: 30px 38px 58px;
  background: linear-gradient(135deg, #f4f7fc, #f6f8fc);
  color: #142037;
}

.detail-header {
  margin: 0 0 32px;
  padding: 0 8px;
}

.detail-heading,
.detail-heading__main,
.detail-actions {
  display: flex;
  align-items: center;
}

.detail-heading {
  justify-content: space-between;
  gap: 24px;
}

.detail-heading__main {
  min-width: 0;
  gap: 24px;
  flex-wrap: wrap;
}

.detail-heading h1 {
  margin: 0;
  color: #101b2d;
  font-size: 32px;
  font-weight: 750;
  line-height: 45px;
  overflow-wrap: anywhere;
}

.check-status {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 15px;
  border: 1px solid #dfe7f4;
  border-radius: 18px;
  background: #f3f7fd;
  color: #64748d;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.detail-actions {
  flex-shrink: 0;
  gap: 15px;
}

.detail-actions .el-button {
  width: 88px;
  height: 45px;
  margin: 0;
  border-color: #d8e1ee;
  border-radius: 7px;
  background: #fff;
  color: #24324a;
  font-size: 16px;
  font-weight: 550;
}

.detail-actions .el-button--primary {
  border-color: #1677ff;
  background: linear-gradient(135deg, #0966ff, #237cff);
  color: #fff;
}

.detail-content {
  padding: 29px 32px 32px;
  border: 1px solid #f1f4fa;
  border-radius: 9px;
  background: #fff;
}

.detail-section + .detail-section {
  margin-top: 16px;
  padding-top: 28px;
  border-top: 1px solid #e8edf5;
}

.detail-section h2 {
  position: relative;
  margin: 0;
  padding-left: 20px;
  color: #142033;
  font-size: 20px;
  font-weight: 700;
  line-height: 26px;
}

.detail-section h2::before {
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 0;
  width: 5px;
  border-radius: 3px;
  background: linear-gradient(#328cff, #0969ff);
  content: '';
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 20px 0 0;
}

.info-item {
  display: grid;
  min-width: 0;
  min-height: 52px;
  grid-template-columns: 34% minmax(0, 1fr);
  align-items: center;
  border-bottom: 1px solid #edf1f7;
  padding: 10px 0 10px 3px;
  font-size: 17px;
  line-height: 1.8;
}

.info-item:nth-child(even) {
  grid-template-columns: 34% minmax(0, 1fr);
  padding-left: 44px;
  border-left: 1px solid #edf1f7;
}

.info-item:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.info-item dt {
  color: #6b7d97;
  font-weight: 500;
}

.info-item dd {
  margin: 0;
  color: #162136;
  font-weight: 550;
  overflow-wrap: anywhere;
}

.section-heading {
  margin-bottom: 23px;
}

.section-heading p {
  margin: 6px 0 0 20px;
  color: #7d8da4;
  font-size: 15px;
  line-height: 20px;
}

.detail-table {
  overflow: hidden;
  border: 1px solid #dfe6f1;
  border-radius: 7px;
}

.detail-table :deep(.el-table) {
  --el-table-header-bg-color: #f5f7fc;
  border-radius: 0;
  font-size: 16px;
}

.detail-table :deep(.el-table .el-table__cell) {
  height: 53px;
  padding: 12px 0;
}

.detail-table :deep(.el-table .cell) {
  padding: 0 30px;
  line-height: 28px;
}

.detail-table :deep(.el-table th.el-table__cell) {
  color: #5a6a82;
  font-size: 17px;
  font-weight: 600;
}

.detail-table :deep(.el-table tr:last-child td.el-table__cell) {
  border-bottom: 0 !important;
}

.detail-table :deep(.el-button.is-link) {
  height: auto;
  padding: 0;
  color: #1677ff;
  font-size: 16px;
  font-weight: 500;
}

.detail-table--circuit :deep(.el-table .cell) {
  padding: 0 20px;
}

.detail-table--circuit :deep(.el-table th.el-table__cell:not(:last-child)),
.detail-table--circuit :deep(.el-table td.el-table__cell:not(:last-child)) {
  border-right: 1px solid #e5ebf5 !important;
}

.detail-section.circuit-section {
  margin-top: 32px;
}

@media (max-width: 1200px) {
  .customer-detail {
    padding: 24px 24px 40px;
  }

  .detail-heading__main {
    gap: 10px 16px;
  }

  .detail-heading h1 {
    font-size: 27px;
  }

  .detail-content {
    padding: 26px 24px;
  }

  .info-item:nth-child(even) {
    padding-left: 24px;
    grid-template-columns: 40% minmax(0, 1fr);
  }

  .detail-table :deep(.el-table .cell) {
    padding-right: 16px;
    padding-left: 16px;
  }
}

@media (max-width: 850px) {
  .detail-heading {
    align-items: flex-start;
  }

  .detail-heading h1 {
    font-size: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item:nth-child(even) {
    padding-left: 3px;
    border-left: 0;
  }

  .info-item,
  .info-item:nth-child(even) {
    grid-template-columns: 40% minmax(0, 1fr);
    border-bottom: 1px solid #edf1f7;
  }

  .info-item:last-child {
    border-bottom: 0;
  }

  .detail-table {
    overflow-x: auto;
  }
}
</style>
