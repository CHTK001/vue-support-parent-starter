<template>
  <div class="tpl-shell">
    <header class="tpl-header">
      <div class="tpl-brand" @click="goHome">
        <div class="tpl-logo">
          <el-icon :size="20"><MagicStick /></el-icon>
        </div>
        <div class="tpl-title">
          <div class="tpl-name">Vue Support Template</div>
          <div class="tpl-sub">组件模板预览 · 实时调参 · 一键复制</div>
        </div>
      </div>
      <div class="tpl-header-right">
        <el-tag type="info" effect="plain" round>vite + vue3</el-tag>
        <el-tag type="success" effect="plain" round>ReXxx ({{ stats.total }})</el-tag>
        <el-tag type="warning" effect="plain" round>已配置 ({{ stats.configured }})</el-tag>
      </div>
    </header>

    <main class="tpl-main">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="r.fullPath" />
        </transition>
      </router-view>
    </main>

    <footer class="tpl-footer">
      <span>vue-support-template-starter · 仅展示 Re* 组件用法，参数实时同步</span>
      <span class="tpl-footer-tip">点击卡片 → 左侧调整参数 → 右侧查看效果与代码</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { MagicStick } from "@element-plus/icons-vue";
import { registry } from "./data/componentRegistry";
import { templateMap } from "./templates";

const router = useRouter();

/** 总数与已配置 schema 的组件数 */
const stats = computed(() => ({
  total: registry.length,
  configured: registry.filter((item) => templateMap.has(item.name)).length,
}));

const goHome = () => {
  router.push("/home");
};
</script>

<style lang="scss" scoped>
.tpl-shell {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, #f4f7fb 0%, #eaf1f9 100%);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

.tpl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f7faff 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.06);
  flex-shrink: 0;
  z-index: 10;
}

.tpl-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }
}

.tpl-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #fff;
  background: linear-gradient(135deg, #409eff 0%, #6f42c1 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.tpl-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.tpl-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  letter-spacing: 0.2px;
}

.tpl-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tpl-main {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.tpl-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 24px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.tpl-footer-tip {
  color: #409eff;
}

/* 路由过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>