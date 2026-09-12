<script setup lang="ts">
/**
 * 监控管理平台外壳 —— 对齐 prototype.html（§3.1 布局）
 * 左：分组侧栏(工作台/监控/资产/运维/系统 五区) · 右：56px 顶栏(面包屑/全局搜索/通知/主题/头像)
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import { useSocketService } from "@repo/core";
import { fetchAlarmEvents, fetchSystemRedisInfo, isUnhandled } from "./monitorApi";

const route = useRoute();
const router = useRouter();

/** 侧栏 logo 从 app.yaml loginConfig.logoUrl 读取，为空时显示首字母 */
const logoSrc = computed(() => {
  const url = getConfig()?.login?.logoUrl;
  return url ? resolveAssetUrl(url) : "";
});

const collapse = ref(false);
const searchKw = ref("");

/** 当前系统是否连接 Redis（无 Redis 时隐藏 Redis 监控菜单） */
const redisAvailable = ref(false);
let redisCheckDone = false;
async function checkRedis(): Promise<void> {
  if (redisCheckDone) return;
  redisCheckDone = true;
  try {
    const info = await fetchSystemRedisInfo();
    redisAvailable.value = !!(info && Object.keys(info).length > 0);
  } catch {
    redisAvailable.value = false;
  }
}

/** 打平所有项用于激活判断 */
const groups = computed(() => {
  const base = [
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
      title: "发布",
      items: [
        { path: "/project", label: "项目管理", icon: "Box" },
      ],
    },
    {
      title: "系统",
      items: [
        { path: "/config", label: "监控配置", icon: "Setting" },
        { path: "/proxy", label: "代理管理", icon: "Connection" },
        { path: "/system-config", label: "系统配置", icon: "Tools" },
        { path: "/groups", label: "分组管理", icon: "FolderOpened" },
        { path: "/account", label: "账号管理", icon: "Key" },
      ],
    },
  ];
  if (!redisAvailable.value) {
    const monitorGroup = base.find(g => g.title === "监控");
    if (monitorGroup) monitorGroup.items = monitorGroup.items.filter(i => i.path !== "/redis");
  }
  return base;
});
const allNavPaths = computed(() => groups.value.flatMap(g => g.items.map(i => i.path)));
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

/** 告警未处理徽标 —— socket 实时推送（新告警+1，处理/恢复-1），初次/网络恢复时 REST 补偿 */
const unhandled = ref(0);
const socket = useSocketService();

/** socket 到达时增加未处理计数 */
const unsubAlarm = socket?.subscribe("monitor", "alarm", (msg: any) => {
  try {
    const data = (msg.data ?? msg) as any;
    const status = String(data?.status ?? data?.msMonitorAlarmEventStatus ?? "").toUpperCase();
    if (status === "NEW") unhandled.value++;
    else if (status === "PROCESSED" || status === "FALSE_ALARM") {
      unhandled.value = Math.max(0, unhandled.value - 1);
    }
  } catch { /* 静默 */ }
});

/** 初始加载 + 每次页面恢复时刷新真实计数（补偿 socket 断线期间丢失的事件） */
async function refreshBadge(): Promise<void> {
  try {
    const list = await fetchAlarmEvents();
    unhandled.value = list.filter(isUnhandled).length;
  } catch { /* 静默 */ }
}
onMounted(() => { refreshBadge(); checkRedis(); });
onBeforeUnmount(() => { unsubAlarm?.(); });

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
        <img v-if="logoSrc" :src="logoSrc" alt="logo" class="logo" />
        <div v-else class="logo">K</div>
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
      <ReButton v-else icon="Fold" layout="square" size="small" title="折叠侧栏" @click="collapse = true" />
      <div class="crumb">{{ crumb }}</div>
      <div class="spacer" />
      <div class="gsearch">
        <ReIcon name="Search" :size="14" />
        <ReInput v-model="searchKw" placeholder="搜索资产、规则、文档…" size="small" class="gsearch-input" />
        <span class="kbd">⌘K</span>
      </div>
      <div class="bell-wrap">
        <ReButton icon="Bell" layout="square" size="small" title="通知" @click="go('/alarms')" />
        <span v-if="unhandled>0" class="note-dot" />
      </div>
      <div class="avatar" title="管理员">CH</div>
    </header>

    <!-- 主区 -->
    <main class="main">
       <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
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
  color: var(--text-inverse);
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  background: var(--brand-gradient);
  box-shadow: var(--shadow-brand);
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
  transition: background 0.15s var(--ease-out, ease), color 0.15s;
  &:hover { background: var(--bg-hover); color: var(--text-primary); }
  &.active {
    background: linear-gradient(90deg, var(--brand-100) 0%, var(--brand-50) 70%, transparent 100%);
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
      box-shadow: var(--badge-glow);
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
  color: var(--text-inverse);
  text-align: center;
  background: var(--pulse-alarm);
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
  &:hover { background: var(--bg-hover); color: var(--text-primary); }
}
.note-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pulse-alarm);
  animation: notePulse 1.6s ease-in-out infinite;
}
@keyframes notePulse {
  0%, 100% { box-shadow: var(--alarm-glow-in); }
  50% { box-shadow: var(--alarm-glow-out); }
}
.bell-wrap { position: relative; display: inline-flex; }
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
  padding: 4px 12px;
  width: 320px;
  color: var(--text-tertiary);
  font-size: 13px;
  background: var(--bg-page);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  :deep(.el-input__wrapper) {
    padding: 0 6px;
    background: var(--bg-page);
    border-radius: 6px;
    border: 1px solid transparent;
    box-shadow: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    .el-input__inner {
      background: transparent;
      border: none;
      box-shadow: none;
      &:hover { background: var(--bg-page); }
    }
  }
  &:hover { border-color: var(--border-default); }
  &:focus-within {
    background: var(--bg-container);
    border-color: var(--brand-500);
    box-shadow: var(--focus-ring);
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
  color: var(--text-inverse);
  font-size: 12px;
  font-weight: 600;
  background: var(--brand-gradient);
}

.main {
  grid-area: main;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 32px;
}
.main > :deep(*) {
  width: 100%;
}
@keyframes pageFade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
/* 路由切换过渡（<transition name="page-fade">） */
.page-fade-enter-active { animation: pageFade 0.22s var(--ease-out, ease); }
.page-fade-leave-active { transition: opacity 0.12s ease; }
.page-fade-leave-to { opacity: 0; }
</style>
