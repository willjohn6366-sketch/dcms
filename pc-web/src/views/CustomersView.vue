<template>
  <div class="table-shell customers-page">
    <div class="table-shell__toolbar">
      <div class="table-shell__filters">
        <el-input
          v-model="keyword"
          class="customer-search"
          clearable
          placeholder="搜索单位 / 联系人 / 客户经理"
          @clear="onSearch"
          @keyup.enter="onSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="onSearch">查询</el-button>
        <span class="toolbar-count">共 {{ total }} 个客户</span>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>
        新增客户
      </el-button>
    </div>

    <el-table class="customer-table" :data="customers" v-loading="loading" height="calc(100vh - 250px)">
      <el-table-column type="index" label="序号" width="70" align="center" :index="getRowIndex" />
      <el-table-column label="单位名称" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="customer-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="联系人" width="130">
        <template #default="{ row }">{{ row.contact_person || '-' }}</template>
      </el-table-column>
      <el-table-column label="联系电话" width="160">
        <template #default="{ row }">{{ row.contact_phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="客户经理" width="130">
        <template #default="{ row }">{{ row.account_manager || '-' }}</template>
      </el-table-column>
      <el-table-column label="经理电话" width="160">
        <template #default="{ row }">{{ row.manager_phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="电路" width="92" align="center">
        <template #default="{ row }">
          <el-tag effect="plain" type="primary">{{ row.Circuits?.length || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近核查" width="140">
        <template #default="{ row }">
          <el-tag v-if="row.latest_check_date" effect="plain" type="success">{{ row.latest_check_date }}</el-tag>
          <el-tag v-else effect="plain" type="info">未核查</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="success" @click="onCheck(row.id)">核查</el-button>
          <el-popconfirm title="确认删除该客户？" @confirm="onDelete(row.id)">
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
        @current-change="loadCustomers"
      />
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑客户' : '新增客户'" width="520px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="单位名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入单位名称" />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input v-model="form.contact_person" />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="form.contact_phone" />
      </el-form-item>
      <el-form-item label="客户经理">
        <el-input v-model="form.account_manager" />
      </el-form-item>
      <el-form-item label="经理电话">
        <el-input v-model="form.manager_phone" />
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
import {
  checkCustomer,
  createCustomer,
  deleteCustomer,
  fetchCustomersPage,
  updateCustomer
} from '@/api/customer';
import type { Customer } from '@/types/customer';

const router = useRouter();
const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const loading = ref(false);
const submitting = ref(false);
const editingId = ref<number | null>(null);
const keyword = ref('');
const customers = ref<Customer[]>([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const form = reactive({
  name: '',
  contact_person: '',
  contact_phone: '',
  account_manager: '',
  manager_phone: ''
});

const rules = reactive<FormRules<typeof form>>({
  name: [{ required: true, message: '请输入单位名称', trigger: 'blur' }]
});

async function loadCustomers() {
  loading.value = true;
  try {
    const res = await fetchCustomersPage({
      page: page.value,
      pageSize: pageSize.value,
      q: keyword.value.trim() || undefined
    });
    customers.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  page.value = 1;
  loadCustomers();
}

function onPageSizeChange() {
  page.value = 1;
  loadCustomers();
}

function getRowIndex(index: number) {
  return (page.value - 1) * pageSize.value + index + 1;
}

function resetForm() {
  form.name = '';
  form.contact_person = '';
  form.contact_phone = '';
  form.account_manager = '';
  form.manager_phone = '';
}

function openCreate() {
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: Customer) {
  editingId.value = row.id;
  form.name = row.name || '';
  form.contact_person = row.contact_person || '';
  form.contact_phone = row.contact_phone || '';
  form.account_manager = row.account_manager || '';
  form.manager_phone = row.manager_phone || '';
  dialogVisible.value = true;
}

function openDetail(id: number) {
  router.push(`/customers/${id}`);
}

async function onSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const payload = {
      name: form.name,
      contact_person: form.contact_person,
      contact_phone: form.contact_phone,
      account_manager: form.account_manager,
      manager_phone: form.manager_phone
    };

    if (editingId.value) {
      await updateCustomer(editingId.value, payload);
      ElMessage.success('客户更新成功');
    } else {
      await createCustomer(payload);
      ElMessage.success('客户创建成功');
      page.value = 1;
    }

    dialogVisible.value = false;
    await loadCustomers();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    submitting.value = false;
  }
}

async function onDelete(id: number) {
  try {
    await deleteCustomer(id);
    ElMessage.success('删除成功');
    if (customers.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }
    await loadCustomers();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function onCheck(id: number) {
  try {
    await checkCustomer(id);
    ElMessage.success('最近核查已更新为今天');
    await loadCustomers();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(() => {
  loadCustomers();
});
</script>

<style scoped>
.customers-page {
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.customer-search {
  width: 340px;
}

.toolbar-count {
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 800;
}

.customer-name {
  display: block;
  overflow: hidden;
  color: var(--cm-text);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-table :deep(.el-table__row) {
  height: 54px;
}
</style>
