<script setup lang="ts">
/**
 * 监控管理平台外壳 —— 对齐 prototype.html（§3.1 布局）
 * 左：分组侧栏(工作台/监控/资产/运维/系统 五区) · 右：56px 顶栏(面包屑/全局搜索/通知/主题/头像)
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import { fetchAlarmEvents, isUnhandled } from "./monitorApi";

const route = useRoute();
const router = useRouter();

const collapse = ref(false);

const groups = [
  {
    title: "工作台",
    items: [{ path: "/", label: "监控概览", icon: "DataBoard" }],
  },
  {
    title: "监控",
    items: [
      { path: "/alarms", label: "告警中心", icon: "Bell", badge: "alarm" },
      { path: "/redis", label: "Redis 监控", icon: "Coin" },
      { path: "/tshark", label: "抓包分析", icon: "Search" },
    ],
  },
  {
    title: "资产",
    items: [
      { path: "/assets", label: "主机资产", icon: "Monitor" },
      { path: "/terminal", label: "远程控制", icon: "Position" },
    ],
  },
  {
    title: "系统",
    items: [{ path: "/config", label: "监控配置", icon: "Setting" }],
  },
];

/** 打平所有项用于激活判断 */
const allNavPaths = computed(() => groups.flatMap(g => g.items.map(i => i.path)));
const activePath = computed(() => {
  const seg = route.path.split("/")[1];
  const p = seg ? `/${seg}` : "/";
  // 详情页 /host/:id → 归入 /assets 高亮
  if (p === "/host") return "/assets";
  return allNavPaths.value.includes(p) ? p : "/";
});

const crumb = computed(() => {
  const seg = route.path.split("/")[1];
  if (seg === "host") return "主机资产 / 监控详情";
  const top = route.meta.title as string | undefined;
  return `监控管理 / ${top ?? (seg ? seg : "监控概览")}`;
});

/** 告警未处理徽标（30s 轮询） */
const unhandled = ref(0);
let badgeTimer: number | undefined;
async function refreshBadge(): Promise<void> {
  try {
    const list = await fetchAlarmEvents();
    unhandled.value = list.filter(isUnhandled).length;
  } catch { /* 静默 */ }
}
onMounted(() => {
  refreshBadge();
  badgeTimer = window.setInterval(refreshBadge, 30000);
});
onBeforeUnmount(() => window.clearInterval(badgeTimer));

function go(path: string): void {
  if (route.path !== path) router.push(path);
}

const sidebarW = computed(() => (collapse.value ? "64px" : "224px"));
</script>

<template>
  <div class="app" :class="{ collapsed: collapse }">
    <!-- 侧栏 -->
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">K</div>
        <div class="name">监控管理平台</div>
      </div>
      <nav class="nav">
        <template v-for="g in groups" :key="g.title">
          <div class="group-title">{{ g.title }}</div>
          <button
            v-for="i in g.items"
            :key="i.path"
            :class="['item', { active: activePath === i.path }]"
            @click="go(i.path)"
          >
            <span class="ic"><ReIcon :name="i.icon" :size="17" /></span>
            <span class="label">{{ i.label }}</span>
            <span v-if="i.badge === 'alarm' && unhandled > 0" class="badge">{{ unhandled > 99 ? "99+" : unhandled }}</span>
          </button>
        </template>
      </nav>
      <div class="sidebar-foot">
        <ReButton v-if="!collapse" icon="Fold" :show-text="true" text size="small" @click="collapse = true">折叠</ReButton>
      </div>
    </aside>

    <!-- 顶栏 -->
    <header class="topbar">
      <ReButton v-if="collapse" icon="Expand" :show-text="false" :icon-size="30" @click="collapse = false" />
      <button v-else class="icon-btn" @click="collapse = true" title="折叠侧栏"><ReIcon name="Fold" :size="15" /></button>
      <div class="crumb">{{ crumb }}</div>
      <div class="spacer" />
      <div class="gsearch">
        <el-icon :size="14"><Search /></el-icon>
        <input placeholder="搜索资产、规则、文档…" />
        <span class="kbd">⌘K</span>
      </div>
      <button class="icon-btn" title="通知"><el-icon :size="15"><Bell /></el-icon><span v-if="unhandled>0" class="note-dot" /></button>
      <div class="avatar" title="管理员">CH</div>
    </header>

    <!-- 主区 -->
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 56px 1fr;
  grid-template-areas: "sidebar topbar" "sidebar main";
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-page);
  color: var(--text-primary);
  transition: grid-template-columns 0.2s;
}
.sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  width: 224px;
  height: 100vh;
  background: var(--bg-container);
  border-right: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: width 0.2s ease;
}
.collapsed .sidebar { width: 64px; }
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--brand-500) 0%, #8f83fd 100%);
}
.collapsed .brand .name,
.collapsed .nav .label,
.collapsed .nav .badge,
.collapsed .nav .group-title { display: none; }
.nav {
  flex: 1;
  padding: 6px 8px;
  overflow-y: auto;
}
.group-title {
  padding: 12px 12px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
}
.item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  margin: 2px 0;
  font-size: 13.5px;
  color: var(--text-secondary);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  position: relative;
  transition: background 0.12s, color 0.12s;
  &:hover { background: var(--bg-hover, #f1f2f8); color: var(--text-primary); }
  &.active {
    background: var(--brand-50);
    color: var(--brand-600);
    font-weight: 600;
    &::before {
      content: "";
      position: absolute;
      left: -8px;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 0 2px 2px 0;
      background: var(--brand-500);
    }
  }
}
.collapsed .item { justify-content: center; padding: 10px 0; }
.ic { display: inline-flex; }
.label { flex: 1; }
.badge {
  min-width: 18px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  background: var(--status-alarm, #f04a5d);
  border-radius: 999px;
}
.sidebar-foot {
  padding: 8px 10px;
  border-top: 1px solid var(--border-subtle);
}

.topbar {
  grid-area: topbar;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  background: var(--bg-container);
  border-bottom: 1px solid var(--border-subtle);
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  &:hover { background: var(--bg-hover, #f1f2f8); color: var(--text-primary); }
}
.note-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--status-alarm, #f04a5d);
}
.crumb {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.spacer { flex: 1; }
.gsearch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  width: 320px;
  color: var(--text-tertiary);
  font-size: 13px;
  background: var(--bg-page);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 13px;
    &::placeholder { color: var(--text-tertiary); }
  }
}
.kbd {
  padding: 1px 5px;
  font-size: 11px;
  color: var(--text-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
}
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--brand-500) 0%, #8f83fd 100%);
}

.main {
  grid-area: main;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
</style>
