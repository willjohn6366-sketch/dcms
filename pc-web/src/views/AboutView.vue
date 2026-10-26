<template>
  <div class="about-page">
    <div class="about-content">
      <section class="about-details" aria-label="关于电路台账管理平台">
        <div class="about-intro">
          <div class="app-logo"><el-icon><Collection /></el-icon></div>
          <div class="about-copy">
            <h1>{{ versionInfo.displayName }}</h1>
            <p>自用的局域网电路信息管理工具，用于维护客户资料、电路台账、<br />组网拓扑、端口连接和本地数据备份。</p>
          </div>
        </div>

        <dl class="about-information">
          <div class="information-row information-row--version">
            <dt><el-icon><CopyDocument /></el-icon><span>当前版本</span></dt>
            <dd><strong class="version-number">v{{ appVersion }}</strong></dd>
            <el-button class="update-button" type="primary" plain :loading="checkingUpdate" @click="checkUpdate">
              <el-icon v-if="!checkingUpdate"><Refresh /></el-icon>检查更新
            </el-button>
          </div>
          <div class="information-row">
            <dt><el-icon><User /></el-icon><span>开发者</span></dt>
            <dd>斯坦尼斯王夫斯基</dd>
          </div>
          <div class="information-row">
            <dt><el-icon><Message /></el-icon><span>联系方式</span></dt>
            <dd>-</dd>
          </div>
          <div class="information-row">
            <dt><el-icon><Clock /></el-icon><span>更新时间</span></dt>
            <dd>{{ versionInfo.releasedAt || '-' }}</dd>
          </div>
        </dl>
      </section>
      <img class="about-illustration" src="../assets/about-platform.svg" alt="蓝色台账图标与分层数据平台插画" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import { Collection, CopyDocument, User, Message, Clock, Refresh } from '@element-plus/icons-vue';
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
}

interface UpdatePayload {
  branch: string;
  output: string;
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
    const updateRes = await fetch('/api/version/update', { method: 'POST' });
    const updatePayload = await updateRes.json();
    if (!updateRes.ok || !updatePayload.success) {
      throw new Error(updatePayload?.error?.message || '更新失败');
    }

    const updateResult = updatePayload.data as UpdatePayload;
    await ElMessageBox.alert(formatUpdateResult(updateResult), '更新完成', {
      confirmButtonText: '知道了',
      type: 'success'
    });
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

function formatUpdateResult(result: UpdatePayload) {
  return `已拉取 ${result.branch} 分支最新代码。\n\n${result.output || 'Already up to date.'}\n\n如果页面或服务仍是旧版本，请重启服务后刷新页面。`;
}
</script>

<style scoped>
.about-page {
  position: relative;
  display: grid;
  min-height: 100vh;
  align-items: center;
  overflow: hidden;
  isolation: isolate;
  background: radial-gradient(ellipse at 85% 27%, #eaf1ff 0, #f4f7fd 44%, #f9fbfe 100%);
}

.about-page::before,
.about-page::after {
  position: absolute;
  z-index: -1;
  width: 720px;
  height: 1050px;
  border: 105px solid #dbe7ff;
  border-radius: 48%;
  content: '';
  pointer-events: none;
  transform: rotate(39deg);
}

.about-page::before {
  top: -680px;
  right: -380px;
  opacity: .32;
}

.about-page::after {
  top: -435px;
  right: -670px;
  opacity: .2;
}

.about-content {
  display: grid;
  width: min(1100px, 76%);
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  margin: 0 auto;
  padding: 65px 0;
  transform: translateY(20px);
}

.about-details {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.about-intro {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  align-items: start;
  gap: 30px;
}

.app-logo {
  display: grid;
  width: 82px;
  height: 82px;
  place-items: center;
  border: 1px solid #6da6ff;
  border-radius: 17px;
  background: linear-gradient(145deg, #168aff, #2457f5);
  box-shadow: inset 0 1px 2px #ffffff55, 0 6px 18px #2174ff0a;
  color: #fff;
  font-size: 47px;
}

.about-copy h1 {
  margin: 12px 0 24px;
  color: #0d1830;
  font-size: clamp(27px, 2.1vw, 36px);
  font-weight: 750;
  line-height: 1.4;
  letter-spacing: .3px;
}

.about-copy p {
  max-width: 550px;
  margin: 0;
  color: #697b98;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.85;
}

.about-information {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 36px 0 0;
}

.information-row {
  display: grid;
  min-height: 53px;
  grid-template-columns: 170px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0;
}

.information-row--version {
  grid-template-columns: 170px 138px auto;
  min-height: 65px;
  margin-bottom: 13px;
}

.information-row dt {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #7b8ba3;
  font-size: 16px;
  font-weight: 600;
}

.information-row dt .el-icon {
  font-size: 22px;
}

.information-row dd {
  margin: 0;
  color: #1b2941;
  font-size: 16px;
  font-weight: 550;
  line-height: 1.6;
}

.version-number {
  color: #111c34;
  font-size: 21px;
  font-weight: 750;
}

.update-button {
  justify-self: start;
  display: flex;
  height: 44px;
  gap: 9px;
  margin-right: 12px;
  padding: 0 17px;
  border: 1px solid #c9dfff;
  border-radius: 10px;
  background: #eaf3ff;
  color: #287eff;
  font-size: 16px;
  font-weight: 650;
}

.update-button .el-icon {
  font-size: 20px;
}

.about-illustration {
  width: 120%;
  max-width: 620px;
  height: auto;
  margin: 120px 0 0 -18px;
  pointer-events: none;
}

@media (max-width: 1400px) {
  .about-content {
    width: 88%;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  }

  .about-intro {
    grid-template-columns: 70px minmax(0, 1fr);
    gap: 22px;
  }

  .app-logo {
    width: 70px;
    height: 70px;
    font-size: 40px;
  }

  .information-row,
  .information-row--version {
    grid-template-columns: 145px minmax(0, 1fr) auto;
  }

  .update-button {
    margin-right: 0;
    padding: 0 12px;
    font-size: 14px;
  }
}

@media (max-width: 1000px) {
  .about-content {
    width: min(650px, 86%);
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 60px 0;
    transform: none;
  }

  .about-copy h1 {
    font-size: 27px;
  }

  .about-illustration {
    width: 300px;
    margin: 0 auto;
  }
}
</style>
