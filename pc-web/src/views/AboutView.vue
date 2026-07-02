<template>
  <div class="about-page">
    <section class="about-sheet">
      <div class="about-main">
        <div class="about-kicker">关于</div>
        <h1><span>{{ versionInfo.displayName }}</span></h1>
        <p>自用的局域网电路信息管理工具，用于维护客户资料、电路台账、组网拓扑、端口连接和本地数据备份。</p>
      </div>

      <div class="version-area">
        <div class="version-copy">
          <span>当前版本</span>
          <strong>v{{ appVersion }}</strong>
        </div>
        <el-button type="primary" plain :loading="checkingUpdate" @click="checkUpdate">检查更新</el-button>
      </div>

      <div class="about-footer">by：斯坦尼斯王夫斯基</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import versionInfo from '../../../version.json';

interface VersionInfo {
  displayName: string;
  version: string;
  releasedAt?: string;
  changes: string[];
}

interface LatestVersionPayload {
  latest: VersionInfo;
  hasUpdate: boolean;
  updateUrl?: string;
}

const appVersion = versionInfo.version;
const checkingUpdate = ref(false);

async function checkUpdate() {
  checkingUpdate.value = true;
  try {
    const res = await fetch(`/api/version/latest?t=${Date.now()}`);
    if (!res.ok) {
      throw new Error('版本信息获取失败');
    }
    const payload = await res.json();
    const result = payload.data as LatestVersionPayload;
    const latest = result.latest;

    if (!latest?.version) {
      throw new Error('版本信息格式不正确');
    }

    if (!result.hasUpdate) {
      ElMessage.success('当前已是最新版本');
      return;
    }

    await ElMessageBox.confirm(formatUpdateMessage(latest), `发现新版本 v${latest.version}`, {
      confirmButtonText: '立即更新',
      cancelButtonText: '取消',
      type: 'info'
    });
    window.open(result.updateUrl || versionInfo.repository, '_blank');
  } catch (error) {
    if (error === 'cancel' || error === 'close') return;
    ElMessage.error((error as Error).message || '检查更新失败');
  } finally {
    checkingUpdate.value = false;
  }
}

function formatUpdateMessage(latest: VersionInfo) {
  const changes = latest.changes?.length
    ? latest.changes.map((item, index) => `${index + 1}. ${item}`).join('\n')
    : '暂无更新说明';
  return `版本号：v${latest.version}\n\n下一版本更新内容：\n${changes}`;
}
</script>

<style scoped>
.about-page {
  display: flex;
  min-height: calc(100vh - 48px);
  justify-content: center;
  padding: 32px;
}

.about-sheet {
  width: min(100%, 720px);
  border: 1px solid rgba(226, 232, 240, 0.86);
  border-radius: 8px;
  background: var(--cm-surface);
  box-shadow: 0 10px 26px rgba(25, 43, 78, 0.045);
}

.about-main {
  padding: 24px 34px 16px;
  text-align: center;
}

.about-main h1 {
  position: relative;
  display: inline-block;
  margin: 6px 0 0;
  font-size: 25px;
  font-weight: 900;
  line-height: 1.25;
}

.about-main h1 span {
  position: relative;
  z-index: 1;
  background: linear-gradient(90deg, #162033 0%, #2563eb 48%, #0f766e 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.about-main h1::before {
  content: '';
  position: absolute;
  right: -10px;
  bottom: 1px;
  left: -10px;
  height: 11px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.18), rgba(37, 99, 235, 0.13), rgba(15, 118, 110, 0.13));
}

.about-main h1::after {
  content: '';
  position: absolute;
  right: 26%;
  bottom: -9px;
  left: 26%;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f59e0b, #2563eb, #0f766e);
}

.about-kicker {
  color: var(--cm-muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.about-main p {
  max-width: 560px;
  margin: 12px auto 0;
  color: #536174;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
}

.version-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  margin: 0 34px;
  border-top: 1px solid rgba(226, 232, 240, 0.72);
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  padding: 13px 0;
}

.version-copy {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.version-copy span {
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 800;
}

.version-copy strong {
  color: var(--cm-text);
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
}

.about-footer {
  padding: 9px 30px 11px;
  color: #a0aabc;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
</style>
