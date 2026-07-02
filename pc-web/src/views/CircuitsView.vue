<template>
  <div class="table-shell circuits-page">
    <div class="table-shell__toolbar">
      <div class="table-shell__filters">
        <el-input
          v-model="keyword"
          class="circuit-search"
          placeholder="搜索单位名称 / 电路编号 / IP 地址"
          clearable
          @clear="onSearch"
          @keyup.enter="onSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="onSearch">查询</el-button>
        <span class="toolbar-count">共 {{ total }} 条电路</span>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>
        新增电路
      </el-button>
    </div>

    <el-table class="circuit-table" :data="circuits" v-loading="loading" height="calc(100vh - 250px)">
      <el-table-column type="index" label="序号" width="70" align="center" :index="getRowIndex" />
      <el-table-column label="单位名称" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="customer-name">{{ row.Customer?.name || `#${row.customer_id}` }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="circuit_name" label="电路名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="circuit_number" label="电路编号" min-width="170" show-overflow-tooltip />
      <el-table-column label="类型" width="110" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.circuit_type" effect="plain">{{ row.circuit_type }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="bandwidth" label="带宽" width="90" />
      <el-table-column label="开通日期" width="120">
        <template #default="{ row }">{{ row.open_date || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该电路？" @confirm="onDelete(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-shell__footer">
      <span class="table-shell__total">共 {{ total }} 条</span>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="sizes, prev, pager, next, jumper"
        background
        @size-change="onPageSizeChange"
        @current-change="loadCircuits"
      />
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑电路' : '新增电路'" width="620px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="电路名称" prop="circuit_name"><el-input v-model="form.circuit_name" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电路编号" prop="circuit_number"><el-input v-model="form.circuit_number" /></el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="客户" prop="customer_id">
            <el-select v-model="form.customer_id" clearable filterable style="width: 100%" @change="onFormCustomerChange">
              <el-option v-for="item in customers" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电路类型" prop="circuit_type">
            <el-select v-model="form.circuit_type" clearable style="width: 100%">
              <el-option label="IPRAN" value="IPRAN" />
              <el-option label="STN" value="STN" />
              <el-option label="互联网专线" value="互联网专线" />
              <el-option label="裸纤" value="裸纤" />
              <el-option label="SDH" value="SDH" />
              <el-option label="MSTP" value="MSTP" />
              <el-option label="OTN" value="OTN" />
              <el-option label="语音中继" value="语音中继" />
              <el-option label="FTTH" value="FTTH" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="拓扑" prop="topology_id">
            <el-select v-model="form.topology_id" clearable style="width: 100%" @change="onFormTopologyChange">
              <el-option v-for="item in topologyOptions" :key="item.id" :label="item.topology_name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="绑定连接" prop="connection_id">
            <el-select v-model="form.connection_id" clearable style="width: 100%" filterable>
              <el-option v-for="item in connectionOptions" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="带宽">
            <div class="bandwidth-field">
              <el-input-number v-model="form.bandwidth" :min="0" :precision="0" :controls="false" style="width: 100%" />
              <span class="bandwidth-unit">M</span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开通日期"><el-date-picker v-model="form.open_date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="本端IP"><el-input v-model="form.local_ip" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="对端IP"><el-input v-model="form.remote_ip" /></el-form-item></el-col>
      </el-row>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { fetchCustomers } from '@/api/customer';
import { createCircuit, deleteCircuit, searchCircuitsPage, updateCircuit } from '@/api/circuit';
import { fetchTopologiesByCustomer, fetchTopologyDetail } from '@/api/topology';
import type { Circuit } from '@/types/circuit';
import type { Customer } from '@/types/customer';
import type { Connection, Topology } from '@/types/topology';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const router = useRouter();

const keyword = ref('');

const customers = ref<Customer[]>([]);
const circuits = ref<Circuit[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const topologyOptions = ref<Topology[]>([]);
const connectionOptions = ref<Array<{ id: number; label: string }>>([]);

const form = reactive({
  customer_id: undefined as number | undefined,
  topology_id: undefined as number | undefined,
  connection_id: undefined as number | undefined,
  circuit_name: '',
  circuit_number: '',
  circuit_type: undefined as Circuit['circuit_type'] | undefined,
  bandwidth: undefined as number | undefined,
  open_date: '',
  local_ip: '',
  remote_ip: '',
  remark: ''
});

const rules = reactive<FormRules<typeof form>>({
  circuit_name: [{ required: true, message: '请输入电路名称', trigger: 'blur' }]
});

async function loadCustomers() {
  const res = await fetchCustomers();
  customers.value = res.data;
}

async function loadCircuits() {
  loading.value = true;
  try {
    const res = await searchCircuitsPage({
      page: page.value,
      pageSize: pageSize.value,
      q: keyword.value.trim() || undefined
    });
    circuits.value = res.data.list;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  loadCircuits();
}

function onPageSizeChange() {
  page.value = 1;
  loadCircuits();
}

function getRowIndex(index: number) {
  return (page.value - 1) * pageSize.value + index + 1;
}

async function loadTopologyOptions(customerId?: number) {
  topologyOptions.value = [];
  connectionOptions.value = [];
  if (!customerId) return;
  const res = await fetchTopologiesByCustomer(customerId);
  topologyOptions.value = res.data;
}

async function loadConnectionOptions(topologyId?: number) {
  connectionOptions.value = [];
  if (!topologyId) return;

  const detail = await fetchTopologyDetail(topologyId);
  const topology = detail.data;

  const ports = (topology.Devices || []).flatMap((dev) =>
    (dev.Ports || []).map((port) => ({
      ...port,
      label: `${dev.location || '未填机房'} · ${dev.device_name}:${port.port_name}`
    }))
  );

  const portMap = new Map<number, string>(ports.map((p) => [p.id, p.label]));
  connectionOptions.value = (topology.Connections || []).map((conn: Connection) => ({
    id: conn.id,
    label: `${portMap.get(conn.source_port_id) || conn.source_port_id} -> ${portMap.get(conn.target_port_id) || conn.target_port_id}`
  }));
}

function resetForm() {
  form.customer_id = undefined;
  form.topology_id = undefined;
  form.connection_id = undefined;
  form.circuit_name = '';
  form.circuit_number = '';
  form.circuit_type = undefined;
  form.bandwidth = undefined;
  form.open_date = '';
  form.local_ip = '';
  form.remote_ip = '';
  form.remark = '';
}

function openCreate() {
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
}

function openDetail(id: number) {
  router.push(`/circuits/${id}`);
}

async function openEdit(row: Circuit) {
  editingId.value = row.id;
  form.customer_id = row.customer_id || undefined;
  form.topology_id = row.topology_id || undefined;
  form.connection_id = row.connection_id || undefined;
  form.circuit_name = row.circuit_name;
  form.circuit_number = row.circuit_number || '';
  form.circuit_type = row.circuit_type || undefined;
  form.bandwidth = extractBandwidthValue(row.bandwidth);
  form.open_date = row.open_date || '';
  form.local_ip = row.local_ip || '';
  form.remote_ip = row.remote_ip || '';
  form.remark = row.remark || '';

  await loadTopologyOptions(form.customer_id);
  await loadConnectionOptions(form.topology_id);
  dialogVisible.value = true;
}

async function onFormCustomerChange() {
  form.topology_id = undefined;
  form.connection_id = undefined;
  await loadTopologyOptions(form.customer_id);
}

async function onFormTopologyChange() {
  form.connection_id = undefined;
  await loadConnectionOptions(form.topology_id);
}

async function onSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const payload = {
      customer_id: form.customer_id || null,
      topology_id: form.topology_id || null,
      connection_id: form.connection_id || null,
      circuit_name: form.circuit_name,
      circuit_number: form.circuit_number || null,
      circuit_type: form.circuit_type || null,
      bandwidth: formatBandwidth(form.bandwidth),
      open_date: form.open_date || null,
      local_ip: form.local_ip || null,
      remote_ip: form.remote_ip || null,
      remark: form.remark || null
    };

    if (editingId.value) {
      await updateCircuit(editingId.value, payload);
      ElMessage.success('电路更新成功');
    } else {
      await createCircuit(payload);
      ElMessage.success('电路创建成功');
      page.value = 1;
    }

    dialogVisible.value = false;
    await loadCircuits();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    submitting.value = false;
  }
}

function extractBandwidthValue(value: string | null) {
  if (!value) return undefined;
  const numeric = String(value).replace(/[^\d]/g, '');
  return numeric ? Number(numeric) : undefined;
}

function formatBandwidth(value: number | undefined) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  return `${value}M`;
}

async function onDelete(id: number) {
  try {
    await deleteCircuit(id);
    ElMessage.success('删除成功');
    if (circuits.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }
    await loadCircuits();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(async () => {
  try {
    await loadCustomers();
    await loadCircuits();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
});
</script>

<style scoped>
.bandwidth-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.bandwidth-unit {
  min-width: 18px;
  color: #5f6f82;
  font-weight: 600;
}

.circuits-page {
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.circuit-search {
  width: 360px;
}

.toolbar-count {
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 800;
}

.customer-name {
  color: var(--cm-text);
  font-weight: 800;
}

.circuit-table :deep(.el-table__row) {
  height: 54px;
}
</style>
