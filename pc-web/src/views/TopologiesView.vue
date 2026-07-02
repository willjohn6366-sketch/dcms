<template>
  <div class="table-shell topologies-page">
    <div class="table-shell__toolbar">
      <div class="table-shell__filters">
        <el-input
          v-model="keyword"
          class="topology-search"
          clearable
          placeholder="搜索单位名称"
          @clear="onSearch"
          @keyup.enter="onSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="onSearch">查询</el-button>
        <span class="toolbar-count">共 {{ total }} 个拓扑</span>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>
        新增拓扑
      </el-button>
    </div>

    <el-table class="topology-table" :data="topologies" v-loading="loading" height="calc(100vh - 250px)">
      <el-table-column type="index" label="序号" width="70" align="center" :index="getRowIndex" />
      <el-table-column label="单位名称" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="customer-name">{{ row.Customer?.name || `#${row.customer_id}` }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="topology_name" label="拓扑名称" min-width="220" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="260" show-overflow-tooltip />
      <el-table-column label="设备" width="90" align="center">
        <template #default="{ row }">
          <el-tag effect="plain" type="primary">{{ row.Devices?.length || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="连接" width="90" align="center">
        <template #default="{ row }">
          <el-tag effect="plain" type="success">{{ row.Connections?.length || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该拓扑？" @confirm="onDelete(row.id)">
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
        @current-change="loadTopologies"
      />
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑拓扑' : '新增拓扑'" width="560px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
      <el-form-item label="绑定单位" prop="customer_id">
        <el-select
          v-model="form.customer_id"
          filterable
          remote
          reserve-keyword
          clearable
          :remote-method="searchCustomerOptions"
          :loading="customerSearching"
          placeholder="搜索并选择客户单位"
          style="width: 100%"
        >
          <el-option v-for="item in customerOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="拓扑名称" prop="topology_name">
        <el-input v-model="form.topology_name" placeholder="请输入拓扑名称" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { fetchCustomersPage } from '@/api/customer';
import { createTopology, deleteTopology, fetchTopologiesPage, updateTopology } from '@/api/topology';
import type { Customer } from '@/types/customer';
import type { Topology } from '@/types/topology';

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const customerSearching = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const topologies = ref<Topology[]>([]);
const customerOptions = ref<Array<Pick<Customer, 'id' | 'name'>>>([]);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const form = reactive({
  customer_id: undefined as number | undefined,
  topology_name: '',
  description: ''
});

const rules = reactive<FormRules<typeof form>>({
  customer_id: [{ required: true, message: '请搜索并选择客户单位', trigger: 'change' }],
  topology_name: [{ required: true, message: '请输入拓扑名称', trigger: 'blur' }]
});

async function loadTopologies() {
  loading.value = true;
  try {
    const res = await fetchTopologiesPage({
      page: page.value,
      pageSize: pageSize.value,
      q: keyword.value.trim() || undefined
    });
    topologies.value = res.data.list;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
}

async function searchCustomerOptions(query: string) {
  customerSearching.value = true;
  try {
    const res = await fetchCustomersPage({
      page: 1,
      pageSize: 20,
      q: query.trim() || undefined
    });
    customerOptions.value = res.data.list.map((item) => ({ id: item.id, name: item.name }));
  } finally {
    customerSearching.value = false;
  }
}

function ensureCustomerOption(row: Topology) {
  if (!row.Customer) return;
  if (customerOptions.value.some((item) => item.id === row.Customer?.id)) return;
  customerOptions.value = [{ id: row.Customer.id, name: row.Customer.name }, ...customerOptions.value];
}

function onSearch() {
  page.value = 1;
  loadTopologies();
}

function onPageSizeChange() {
  page.value = 1;
  loadTopologies();
}

function getRowIndex(index: number) {
  return (page.value - 1) * pageSize.value + index + 1;
}

function resetForm() {
  form.customer_id = undefined;
  form.topology_name = '';
  form.description = '';
}

async function openCreate() {
  editingId.value = null;
  resetForm();
  await searchCustomerOptions('');
  dialogVisible.value = true;
}

async function openEdit(row: Topology) {
  editingId.value = row.id;
  form.customer_id = row.customer_id;
  form.topology_name = row.topology_name;
  form.description = row.description || '';
  ensureCustomerOption(row);
  dialogVisible.value = true;
}

function openDetail(id: number) {
  router.push(`/topologies/${id}`);
}

async function onSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid || !form.customer_id) return;

  submitting.value = true;
  try {
    if (editingId.value) {
      await updateTopology(editingId.value, {
        customer_id: form.customer_id,
        topology_name: form.topology_name,
        description: form.description
      });
      ElMessage.success('拓扑更新成功');
    } else {
      await createTopology({
        customer_id: form.customer_id,
        topology_name: form.topology_name,
        description: form.description
      });
      ElMessage.success('拓扑创建成功');
      page.value = 1;
    }
    dialogVisible.value = false;
    await loadTopologies();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    submitting.value = false;
  }
}

async function onDelete(id: number) {
  try {
    await deleteTopology(id);
    ElMessage.success('删除成功');
    if (topologies.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }
    await loadTopologies();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(async () => {
  try {
    await loadTopologies();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
});
</script>

<style scoped>
.topologies-page {
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.topology-search {
  width: 320px;
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

.topology-table :deep(.el-table__row) {
  height: 54px;
}
</style>
