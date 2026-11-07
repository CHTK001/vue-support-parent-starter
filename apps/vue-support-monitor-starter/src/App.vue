<script setup lang="ts">
/**
 * 监控管理平台外壳 —— 对齐 prototype.html（§3.1 布局）
 * 左：分组侧栏(工作台/监控/资产/运维/系统 五区) · 右：56px 顶栏(面包屑/全局搜索/通知/主题/头像)
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import { getUserInfo, clearAuthCache } from "@repo/utils";
import { fetchAlarmEvents, isUnhandled } from "@pages/monitor/src/api/monitorApi";

const route = useRoute();
const router = useRouter();

/**
 * 当前登录用户信息（从 token storage 读取，未登录时为 null）
 * @author CH
 * @since 4.0.0
 */
interface LoginUser {
  userId?: string | number;
  userName?: string;
  nickName?: string;
  avatar?: string;
  email?: string;
  [key: string]: unknown;
}
const currentUser = ref<LoginUser | null>(null);
/** 从本地缓存加载当前登录用户信息，加载失败时置为 null */
function loadCurrentUser(): void {
  try {
    currentUser.value = getUserInfo<LoginUser>();
  } catch {
    currentUser.value = null;
  }
}
/** 头像显示：有头像用头像，否则用用户名首字母，未登录显示 "?" */
const userInitial = computed(() => {
  const u = currentUser.value;
  if (!u) return "?";
  const name = u.nickName || u.userName || String(u.userId || "");
  return name ? name.charAt(0).toUpperCase() : "?";
});
const userDisplayName = computed(() => {
  const u = currentUser.value;
  if (!u) return "未登录";
  return u.nickName || u.userName || String(u.userId || "未知用户");
});

/** 侧栏 logo 从 app.yaml loginConfig.logoUrl 读取，为空时显示首字母 */
const logoSrc = computed(() => {
  const url = getConfig()?.login?.logoUrl;
  return url ? resolveAssetUrl(url) : "";
});

const collapse = ref(false);
const searchKw = ref("");
const userMenuVisible = ref(false);

/** 退出登录：清除 token + 用户信息，跳转到登录页 */
function logout(): void {
  userMenuVisible.value = false;
  clearAuthCache();
  currentUser.value = null;
  const loginPath = getConfig()?.route?.loginPath || "/login";
  router.push(loginPath).catch(() => router.push("/"));
}
/** 跳转个人中心（koi 体系默认路径，不存在则跳转到首页） */
function goProfile(): void {
  userMenuVisible.value = false;
  const personagePath = getConfig()?.route?.personagePath || "/personage";
  router.push(personagePath).catch(() => router.push("/"));
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
        { path: "/tshark", label: "抓包分析", icon: "Search" },
      ],
    },
    {
      title: "资产",
      items: [
        { path: "/assets", label: "主机资产", icon: "Monitor" },
        { path: "/host-accounts", label: "主机账号", icon: "User" },
        { path: "/files", label: "文件资产", icon: "Document" },
        { path: "/datasource", label: "数据源管理", icon: "Coin" },
        { path: "/db-manager", label: "数据库管理", icon: "Coin" },
        { path: "/terminal", label: "远程控制", icon: "Position" },
        { path: "/desktop", label: "虚拟桌面", icon: "FullScreen" },
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
      ],
    },
  ];
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

/**
 * 告警未处理徽标。
 *
 * <p>本部署<strong>不订阅 socket</strong>，徽标只靠 REST 轮询/恢复时刷新。</p>
 *
 * <p>原因不是「socket 不好用」，而是这台后端没启用 socket 服务，订阅必然失败。
 * 失败还不只是刷 console：dev server 把 {@code /socket.io} 代理成 ws，
 * 每次握手被 403 拒就抛一次 {@code ws proxy socket error: write ECONNABORTED}，
 * 异常会持续累积，直到把 vite 进程带崩——实测本机验收因此连挂两次。</p>
 *
 * <p>所以宁可不订阅：功能上 {@link refreshBadge} 已经覆盖了计数正确性
 * （页面加载、路由恢复时拉真实值），只少了「毫秒级实时」。</p>
 *
 * <p>要恢复实时推送，正确做法是给后端开 socket 服务，而不是在前端硬扛失败重连。</p>
 */
const unhandled = ref(0);

/** 初始加载 + 每次页面恢复时刷新真实计数 */
async function refreshBadge(): Promise<void> {
  try {
    const list = await fetchAlarmEvents();
    unhandled.value = list.filter(isUnhandled).length;
  } catch { /* 静默 */ }
}
onMounted(() => { refreshBadge(); loadCurrentUser(); });

/**
 * 路由跳转（当前路径与目标相同时不重复跳转）
 * @param path 目标路径
 */
function go(path: string): void {
  if (route.path !== path) router.push(path);
}

const sidebarW = computed(() => (collapse.value ? "64px" : "224px"));

/** standalone 路由（如独立全屏终端）不渲染应用外壳，只给裸 router-view */
const bare = computed(() => route.meta.standalone === true);
</script>

<template>
  <router-view v-if="bare" />
  <div v-else class="app" :class="{ collapsed: collapse }">
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
        <ReButton v-if="!collapse" icon="Fold" :show-text="true" text  @click="collapse = true">折叠</ReButton>
      </div>
    </aside>

    <!-- 顶栏 -->
    <header class="topbar">
      <ReButton v-if="collapse" icon="Expand" :show-text="false" :icon-size="30" @click="collapse = false" />
      <ReButton v-else icon="Fold" layout="square"  title="折叠侧栏" @click="collapse = true" />
      <div class="crumb">{{ crumb }}</div>
      <div class="spacer" />
      <div class="gsearch">
        <ReIcon name="Search" :size="14" />
        <ReInput v-model="searchKw" placeholder="搜索资产、规则、文档…"  class="gsearch-input" />
        <span class="kbd">⌘K</span>
      </div>
      <div class="bell-wrap">
        <ReButton icon="Bell" layout="square"  title="通知" @click="go('/alarms')" />
        <span v-if="unhandled>0" class="note-dot" />
      </div>
      <div class="avatar-wrap">
        <div class="avatar" :title="userDisplayName" @click="userMenuVisible = !userMenuVisible">
          <img v-if="currentUser?.avatar" :src="currentUser.avatar" alt="avatar" class="avatar-img" />
          <template v-else>{{ userInitial }}</template>
        </div>
        <div v-if="userMenuVisible" class="user-dropdown" @click.stop>
          <div class="user-info">
            <div class="user-name">{{ userDisplayName }}</div>
            <div v-if="currentUser?.email" class="user-email">{{ currentUser.email }}</div>
          </div>
          <div class="user-menu-item" @click="goProfile">个人中心</div>
          <div class="user-menu-item danger" @click="logout">退出登录</div>
        </div>
      </div>
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
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover {
    transform: scale(1.08);
    box-shadow: 0 0 0 2px var(--brand-400), 0 4px 12px rgba(109, 93, 252, 0.3);
  }
}
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-wrap {
  position: relative;
  display: inline-flex;
}
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(7, 11, 26, 0.5);
  overflow: hidden;
  z-index: 1000;
  animation: dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
.user-info {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  background: linear-gradient(135deg, rgba(109, 93, 252, 0.08), transparent);
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.user-email {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.user-menu-item {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, padding-left 0.12s ease;
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    padding-left: 20px;
  }
  &.danger {
    color: var(--color-error, #f87171);
    &:hover {
      background: rgba(248, 113, 113, 0.1);
      color: #fca5a5;
    }
  }
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
