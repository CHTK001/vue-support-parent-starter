<template>
  <div class="rc-shell">
    <header class="rc-header">
      <div class="rc-brand">
        <div class="rc-logo">
          <el-icon :size="20"><Monitor /></el-icon>
        </div>
        <div class="rc-title">远控管理台</div>
      </div>
      <el-menu
        mode="horizontal"
        :default-active="activeMenu"
        class="rc-menu"
        @select="onSelect"
      >
        <el-menu-item index="/remote">远控</el-menu-item>
        <el-menu-item index="/agents">被控端</el-menu-item>
        <el-menu-item index="/access">接入码</el-menu-item>
      </el-menu>
    </header>

    <main class="rc-main">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="r.fullPath" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Monitor } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

/** 当前激活菜单（按路由路径） */
const activeMenu = computed(() => route.path);

const onSelect = (index: string) => {
  router.push(index);
};
</script>

<style lang="scss" scoped>
.rc-shell {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, #f4f7fb 0%, #eaf1f9 100%);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

.rc-header {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 60px;
  padding: 0 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f7faff 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.06);
  flex-shrink: 0;
  z-index: 10;
}

.rc-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
}

.rc-logo {
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

.rc-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.rc-menu {
  flex: 1;
  border-bottom: none;
  background: transparent;
}

.rc-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
