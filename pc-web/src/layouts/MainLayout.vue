<template>
  <el-container class="shell">
    <el-aside width="232px" class="aside">
      <div class="brand">
        <div class="brand__copy">
          <div class="brand__title">电路台账</div>
          <div class="brand__sub">资料管理工作台</div>
        </div>
      </div>

      <el-menu :default-active="activePath" class="menu" router>
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          <span>客户管理</span>
        </el-menu-item>
        <el-menu-item index="/topologies">
          <el-icon><Connection /></el-icon>
          <span>组网拓扑</span>
        </el-menu-item>
        <el-menu-item index="/circuits">
          <el-icon><Document /></el-icon>
          <span>电路管理</span>
        </el-menu-item>
        <el-menu-item index="/data">
          <el-icon><FolderOpened /></el-icon>
          <span>数据维护</span>
        </el-menu-item>
        <el-menu-item index="/about">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-main class="main">
        <div class="main__inner">
          <RouterView />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Connection, DataBoard, Document, FolderOpened, InfoFilled, User } from '@element-plus/icons-vue';

const route = useRoute();
const activePath = computed(() => {
  if (route.path.startsWith('/topologies/')) return '/topologies';
  if (route.path.startsWith('/circuits/')) return '/circuits';
  if (route.path.startsWith('/customers/')) return '/customers';
  if (route.path.startsWith('/data')) return '/data';
  if (route.path.startsWith('/about')) return '/about';
  return route.path;
});
</script>

<style scoped>
.shell {
  height: 100%;
  background: var(--cm-shell);
}

.aside {
  border-right: 1px solid rgba(22, 32, 51, 0.08);
  background: rgba(255, 255, 255, 0.94);
}

.brand {
  display: flex;
  align-items: center;
  padding: 24px 22px 18px;
}

.brand__copy {
  min-width: 0;
}

.brand__title {
  color: var(--cm-text);
  font-size: 18px;
  font-weight: 800;
  line-height: 1.25;
}

.brand__sub {
  margin-top: 3px;
  color: var(--cm-muted);
  font-size: 12px;
  line-height: 1.2;
}

.menu {
  border-right: none;
  background: transparent;
  padding: 4px 12px;
}

.menu :deep(.el-menu-item) {
  height: 44px;
  margin: 4px 0;
  border-radius: 8px;
  color: var(--cm-muted);
  font-weight: 700;
}

.menu :deep(.el-icon) {
  width: 18px;
  margin-right: 10px;
  font-size: 18px;
}

.menu :deep(.el-menu-item:hover) {
  background: var(--cm-surface-soft);
  color: var(--cm-text);
}

.menu :deep(.el-menu-item.is-active) {
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
}

.main {
  min-width: 0;
  overflow: auto;
  padding: 24px;
  background: var(--cm-bg);
}

.main__inner {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
