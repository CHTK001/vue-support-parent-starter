<template>
  <div class="rc-shell">
    <header class="rc-header">
      <div class="rc-brand">
        <div class="rc-logo">
          <ReIcon name="Monitor" :size="20" />
        </div>
        <div class="rc-title">远控管理台</div>
      </div>
      <div class="rc-menu">
        <ReButton link :type="activeMenu === '/remote' ? 'primary' : 'default'" @click="router.push('/remote')">远控</ReButton>
        <ReButton link :type="activeMenu === '/agents' ? 'primary' : 'default'" @click="router.push('/agents')">被控端</ReButton>
        <ReButton link :type="activeMenu === '/access' ? 'primary' : 'default'" @click="router.push('/access')">接入码</ReButton>
        <ReButton link :type="activeMenu === '/settings' ? 'primary' : 'default'" @click="router.push('/settings')">设置</ReButton>
      </div>
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
import ReIcon from "@repo/ui/re-icon";
import ReButton from "@repo/ui/re-button";

const route = useRoute();
const router = useRouter();

/** 当前激活菜单（按路由路径） */
const activeMenu = computed(() => route.path);
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
