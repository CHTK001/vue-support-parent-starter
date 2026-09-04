<script setup lang="ts">
/**
 * 监控管理平台外壳 —— design.md §2 侧栏（收敛为 4 项）+ §3.1 布局
 * 左侧导航轨（68px）：概览 / 告警(未处理徽标) / 资产 / 远控
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchAlarmEvents, isUnhandled } from "./monitorApi";

const route = useRoute();
const router = useRouter();

const navs = [
  { path: "/", label: "概览", icon: "DataBoard" },
  { path: "/alarms", label: "告警", icon: "Bell" },
  { path: "/assets", label: "资产", icon: "Monitor" },
  { path: "/terminal", label: "远控", icon: "Position" },
];

const activePath = computed(() => {
  const seg = route.path.split("/")[1];
  return seg ? `/${seg}` : "/";
});

/** 告警未处理数徽标（30s 轮询） */
const unhandled = ref(0);
let badgeTimer: number | undefined;
async function refreshBadge(): Promise<void> {
  try {
    const list = await fetchAlarmEvents();
    unhandled.value = list.filter(isUnhandled).length;
  } catch { /* 静默，徽标不阻塞主流程 */ }
}
onMounted(() => {
  refreshBadge();
  badgeTimer = window.setInterval(refreshBadge, 30000);
});
onBeforeUnmount(() => window.clearInterval(badgeTimer));

function go(path: string): void {
  if (route.path !== path) router.push(path);
}
</script>

<template>
  <div class="shell">
    <aside class="nav-rail">
      <div class="brand" title="监控管理平台">
        <el-icon :size="22"><Monitor /></el-icon>
      </div>
      <nav class="nav-list">
        <button
          v-for="n in navs"
          :key="n.path"
          :class="['nav-item', { active: activePath === n.path }]"
          @click="go(n.path)"
        >
          <span class="nav-icon-wrap">
            <ReIcon :name="n.icon" :size="19" />
            <span v-if="n.path === '/alarms' && unhandled > 0" class="nav-badge">{{ unhandled > 99 ? '99+' : unhandled }}</span>
          </span>
          <span class="nav-label">{{ n.label }}</span>
        </button>
      </nav>
      <div class="nav-footer">
        <span class="footer-dot pdot pdot-online" />
      </div>
    </aside>
    <main class="page">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
.shell {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
  color: var(--text-primary);
}
.nav-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 68px;
  flex-shrink: 0;
  background: var(--bg-container);
  border-right: 1px solid var(--border-subtle);
}
.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 14px 0 10px;
  color: #fff;
  background: linear-gradient(135deg, var(--brand-500) 0%, #6f42c1 100%);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
}
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 0 8px;
}
.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 0 7px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    color: var(--brand-500);
    background: var(--brand-50);
  }
  &.active {
    color: var(--brand-600);
    background: var(--brand-100);
    &::before {
      content: "";
      position: absolute;
      left: -8px;
      top: 20%;
      width: 3px;
      height: 60%;
      border-radius: 0 2px 2px 0;
      background: var(--brand-500);
    }
  }
}
.nav-icon-wrap {
  position: relative;
  display: inline-flex;
}
.nav-badge {
  position: absolute;
  top: -5px;
  right: -10px;
  min-width: 15px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  color: #fff;
  text-align: center;
  background: var(--pulse-alarm);
  border-radius: 8px;
}
.nav-label {
  font-size: 11px;
  line-height: 1;
}
.nav-footer {
  margin-top: auto;
  padding: 14px 0;
}
.page {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
</style>
