<template>
  <div class="data-page">
    <section class="backup-panel">
      <div class="panel-head">
        <div>
          <div class="section-title">备份记录</div>
          <div class="section-meta">共 {{ backups.length }} 个备份</div>
        </div>
        <el-button type="primary" :loading="backingUp" @click="createSnapshot">立即备份</el-button>
      </div>

      <el-table class="backup-table" :data="pagedBackups" v-loading="loadingBackups" height="calc(100vh - 316px)">
        <el-table-column type="index" label="序号" width="70" align="center" :index="getBackupRowIndex" />
        <el-table-column label="时间点" min-width="180">
          <template #default="{ row }">
            <span class="backup-time">{{ formatDateTime(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="filename" label="文件名" min-width="260" show-overflow-tooltip />
        <el-table-column label="数据量" min-width="230">
          <template #default="{ row }">{{ formatSummary(row.summary) }}</template>
        </el-table-column>
        <el-table-column label="大小" width="110">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :loading="restoring === row.filename" @click="confirmRestore(row.filename)">还原</el-button>
            <el-button link type="primary" :loading="downloading === row.filename" @click="downloadBackup(row.filename)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loadingBackups && backups.length === 0" description="暂无备份" />

      <div class="backup-footer">
        <span class="table-shell__total">共 {{ backups.length }} 条</span>
        <el-pagination
          v-model:current-page="backupPage"
          v-model:page-size="backupPageSize"
          :total="backups.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @size-change="onBackupPageSizeChange"
        />
      </div>
    </section>

    <aside class="side-panel">
      <section class="side-card">
        <div class="side-card__title">导入恢复</div>
        <input ref="fileInputRef" class="file-input" type="file" accept="application/json,.json" @change="onFileChange" />
        <el-button :loading="importing" @click="chooseFile">选择文件</el-button>
        <div v-if="selectedFileName" class="selected-file">{{ selectedFileName }}</div>
        <el-button type="primary" plain :disabled="!selectedPayload" :loading="importing" @click="confirmImport">
          覆盖导入
        </el-button>
      </section>

      <section class="side-card side-card--danger">
        <div class="side-card__title">数据清理</div>
        <el-button type="danger" plain :loading="clearing" @click="confirmClear">清空数据库</el-button>
      </section>

      <section v-if="lastSummary" class="side-card">
        <div class="side-card__title">最近结果</div>
        <div class="summary-list">
          <div v-for="item in summaryItems" :key="item.key" class="summary-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  clearData,
  createBackup,
  getBackup,
  importData,
  listBackups,
  restoreBackup
} from '@/api/data';
import type { BackupFile, DataBackup, DataSummary } from '@/api/data';

const loadingBackups = ref(false);
const backingUp = ref(false);
const importing = ref(false);
const clearing = ref(false);
const restoring = ref('');
const downloading = ref('');
const backups = ref<BackupFile[]>([]);
const backupPage = ref(1);
const backupPageSize = ref(10);
const fileInputRef = ref<HTMLInputElement>();
const selectedFileName = ref('');
const selectedPayload = ref<DataBackup | Record<string, unknown> | null>(null);
const lastSummary = ref<DataSummary | null>(null);

const summaryItems = computed(() => {
  const summary = lastSummary.value;
  if (!summary) return [];
  return [
    { key: 'customers', label: '客户', value: summary.customers },
    { key: 'topologies', label: '拓扑', value: summary.topologies },
    { key: 'devices', label: '设备', value: summary.devices },
    { key: 'ports', label: '端口', value: summary.ports },
    { key: 'connections', label: '连接', value: summary.connections },
    { key: 'circuits', label: '电路', value: summary.circuits }
  ];
});

const pagedBackups = computed(() => {
  const start = (backupPage.value - 1) * backupPageSize.value;
  return backups.value.slice(start, start + backupPageSize.value);
});

async function loadBackups() {
  loadingBackups.value = true;
  try {
    const res = await listBackups();
    backups.value = res.data;
    if ((backupPage.value - 1) * backupPageSize.value >= backups.value.length && backupPage.value > 1) {
      backupPage.value = Math.max(1, Math.ceil(backups.value.length / backupPageSize.value));
    }
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loadingBackups.value = false;
  }
}

async function createSnapshot() {
  backingUp.value = true;
  try {
    await createBackup();
    backupPage.value = 1;
    await loadBackups();
    ElMessage.success('备份已创建');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    backingUp.value = false;
  }
}

async function confirmRestore(filename: string) {
  await ElMessageBox.confirm(
    '还原会先清空当前全部数据，再恢复该备份时间点的数据。确认继续？',
    '还原备份确认',
    {
      type: 'warning',
      confirmButtonText: '还原',
      cancelButtonText: '取消'
    }
  );

  restoring.value = filename;
  try {
    const res = await restoreBackup(filename);
    lastSummary.value = res.data;
    ElMessage.success('备份已还原');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    restoring.value = '';
  }
}

async function downloadBackup(filename: string) {
  downloading.value = filename;
  try {
    const res = await getBackup(filename);
    saveJson(filename, res.data);
    ElMessage.success('备份已下载');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    downloading.value = '';
  }
}

function chooseFile() {
  fileInputRef.value?.click();
}

function onBackupPageSizeChange() {
  backupPage.value = 1;
}

function getBackupRowIndex(index: number) {
  return (backupPage.value - 1) * backupPageSize.value + index + 1;
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  try {
    selectedFileName.value = file.name;
    selectedPayload.value = JSON.parse(await file.text());
  } catch {
    selectedFileName.value = '';
    selectedPayload.value = null;
    ElMessage.error('导入文件不是有效 JSON');
  }
}

async function confirmImport() {
  if (!selectedPayload.value) return;

  await ElMessageBox.confirm(
    '导入会先清空当前全部数据，再恢复文件内容。确认继续？',
    '覆盖导入确认',
    {
      type: 'warning',
      confirmButtonText: '覆盖导入',
      cancelButtonText: '取消'
    }
  );

  importing.value = true;
  try {
    const res = await importData(selectedPayload.value);
    lastSummary.value = res.data;
    await loadBackups();
    ElMessage.success('数据已覆盖导入');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    importing.value = false;
  }
}

async function confirmClear() {
  await ElMessageBox.confirm(
    '清空后数据库中的业务数据会全部删除，备份文件会保留。确认继续？',
    '清空数据库确认',
    {
      type: 'error',
      confirmButtonText: '清空数据库',
      cancelButtonText: '取消'
    }
  );

  clearing.value = true;
  try {
    const res = await clearData();
    lastSummary.value = res.data;
    ElMessage.success('数据库已清空，备份文件已保留');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    clearing.value = false;
  }
}

function saveJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatSummary(summary: DataSummary | null) {
  if (!summary) return '-';
  return `客户 ${summary.customers} / 拓扑 ${summary.topologies} / 电路 ${summary.circuits}`;
}

onMounted(() => {
  loadBackups();
});
</script>

<style scoped>
.data-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
}

.backup-panel,
.side-card {
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.78);
  border-radius: 8px;
  background: var(--cm-surface);
  box-shadow: 0 12px 30px rgba(25, 43, 78, 0.055);
}

.panel-head {
  display: flex;
  min-height: 66px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.68);
  padding: 14px 18px;
}

.backup-time {
  color: var(--cm-text);
  font-weight: 800;
}

.backup-footer {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.68);
  padding: 12px 18px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.side-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.side-card__title {
  color: var(--cm-text);
  font-size: 15px;
  font-weight: 800;
}

.side-card .el-button {
  width: 100%;
}

.side-card--danger {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.05), #fff 58%);
}

.file-input {
  display: none;
}

.selected-file {
  overflow: hidden;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--cm-surface-soft);
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-row {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  border-radius: 8px;
  background: var(--cm-surface-soft);
  padding: 0 12px;
}

.summary-row span {
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 800;
}

.summary-row strong {
  color: var(--cm-text);
  font-size: 16px;
  font-weight: 800;
}
</style>
