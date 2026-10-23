<template>
  <!--
    底部系统入口。

    形态由 app.yaml `menuConfig.footer` 决定：
      - 0 个可用条目 → 整块不渲染
      - 1 个 → 直接就是按钮（与历史行为一致）
      - 多个 → 主按钮弹出菜单，点条目再按各自模式执行

    compact=true 时是纯图标（Columns/Double/Optimum 的图标栏按钮坞）。
  -->
  <div v-if="visibleEntries.length" class="nav-setting-entry" :class="{ 'is-compact': compact }">
    <!-- 单个条目：直接按钮 -->
    <template v-if="single">
      <el-tooltip v-if="iconOnly" :content="single.label" placement="right" :show-after="200">
        <button
          type="button"
          class="nav-setting-btn is-icon-only"
          :class="{ 'is-active': isActive(single) }"
          :aria-label="single.label"
          @click="activate(single)"
        >
          <ReIcon class="nav-setting-icon" :name="iconOf(single)" :size="18" />
        </button>
      </el-tooltip>
      <button
        v-else
        type="button"
        class="nav-setting-btn"
        :class="{ 'is-active': isActive(single) }"
        :aria-label="single.label"
        @click="activate(single)"
      >
        <ReIcon class="nav-setting-icon" :name="iconOf(single)" :size="18" />
        <span class="nav-setting-label">{{ single.label }}</span>
      </button>
    </template>

    <!-- 多个条目：主按钮 + 弹出菜单 -->
    <el-popover
      v-else
      placement="right-end"
      :width="208"
      trigger="click"
      :show-arrow="false"
      :offset="8"
      popper-class="nav-setting-popover"
    >
      <template #reference>
        <!-- 这里不再套 el-tooltip：popover 的 reference 与 tooltip 的触发元素会互相抢，
             多条目场景下弹层本身就是可发现的入口，不需要额外的悬浮提示 -->
        <button
          type="button"
          class="nav-setting-btn"
          :class="{ 'is-icon-only': iconOnly }"
          :aria-label="footer.label"
          aria-haspopup="menu"
        >
          <ReIcon class="nav-setting-icon" :name="footer.icon || 'Setting'" :size="18" />
          <span v-if="!iconOnly" class="nav-setting-label">{{ footer.label }}</span>
        </button>
      </template>

      <div class="nav-setting-menu" role="menu">
        <button
          v-for="entry in visibleEntries"
          :key="entry.key"
          type="button"
          role="menuitem"
          class="nav-setting-menu__item"
          :class="{ 'is-active': isActive(entry) }"
          @click="activate(entry)"
        >
          <ReIcon class="nav-setting-menu__icon" :name="iconOf(entry)" :size="16" />
          <span class="nav-setting-menu__label">{{ entry.label }}</span>
        </button>
      </div>
    </el-popover>

    <!-- 弹框：内容 = description + children 列表 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogEntry?.label ?? ''"
      width="420px"
      append-to-body
      class="nav-setting-dialog"
    >
      <p v-if="dialogEntry?.description" class="nav-setting-dialog__desc">
        {{ dialogEntry.description }}
      </p>
      <div v-if="dialogChildren.length" class="nav-setting-dialog__list" role="menu">
        <button
          v-for="entry in dialogChildren"
          :key="entry.key"
          type="button"
          role="menuitem"
          class="nav-setting-menu__item"
          @click="activate(entry)"
        >
          <ReIcon class="nav-setting-menu__icon" :name="iconOf(entry)" :size="16" />
          <span class="nav-setting-menu__label">{{ entry.label }}</span>
        </button>
      </div>
      <p v-else-if="!dialogEntry?.description" class="nav-setting-dialog__empty">
        该入口没有可展示的内容
      </p>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 侧边栏底部入口 —— 供所有纵向布局复用。
 *
 * <p>三个能力（app.yaml `menuConfig.footer`）：</p>
 * <ol>
 *   <li><b>开关</b>：{@code footer.enable} 控制整块显隐；条目还会按「目标路由是否注册」
 *       「是否管理员」再过滤，全部不可用时不渲染（留一个必然 404 的死链比隐藏更糟）。</li>
 *   <li><b>多条目</b>：{@code footer.entries} 支持任意个；每个条目两种模式
 *       —— {@code route} 跳路由、{@code dialog} 打开弹框。</li>
 *   <li><b>自适应形态</b>：1 个条目直接渲染成按钮（历史行为不变）；
 *       多个条目主按钮弹出菜单。</li>
 * </ol>
 *
 * <p>受 {@code menuConfig.groupNav} 影响外观：开启且非折叠 → 图标 + 文字；
 * 否则回退纯图标 + tooltip。</p>
 *
 * <p>历史上 v-admin 挂在按钮上把入口整体限制给管理员；现在改为按条目
 * {@code admin: true} 过滤，这样非管理员也能配置自己的底部入口。</p>
 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { resolveGroupNav, resolveMenuFooter } from "@repo/config";
import useGlobalStore from "@repo/pinia/modules/global";
import useAuthStore from "@repo/pinia/modules/auth";
import { getStaticMenu } from "@repo/pinia";
import { getMenuLanguage } from "@repo/languages";
import { isAdmin } from "@repo/core";
import ReIcon from "@repo/ui/components/ReIcon/theme/default/ReIcon.vue";
import type { MenuFooterEntry } from "@repo/config";

const props = withDefaults(
  defineProps<{
    /** 兼容旧调用：config 里没有条目时用它兜底成单条目 */
    label?: string;
    /** 兼容旧调用：同上，目标路由 */
    path?: string;
    /** 纯图标模式：用于 Columns/Double/Optimum 的图标栏底部按钮坞 */
    compact?: boolean;
  }>(),
  {
    label: "",
    path: "",
    compact: false,
  },
);

const route = useRoute();
const router = useRouter();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const { locale } = useI18n();

/** 分组导航增强开关（menuConfig.groupNav，缺省 true） */
const groupNav = computed(() => resolveGroupNav());
/** 底部入口配置 */
const footer = computed(() => resolveMenuFooter());

/** 路由/权限信息在 setup 阶段读取即可（布局在登录后才挂载） */
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

/** 是否只显示图标：图标坞模式、折叠态、或关闭增强开关 */
const iconOnly = computed(() => props.compact || !groupNav.value || globalStore.isCollapse);

/**
 * 目标路径是否已注册。
 *
 * <p>不能用 {@code router.hasRoute(path)}：Vue Router 的 hasRoute 收的是**路由 name**，
 * 而这里手里只有 path。菜单派生的路由往往 name 恰好等于 path 才"看起来能work"，
 * 静态路由（如本仓 pages/collect 的 /collect/variable）通常没有 name，
 * 那样判断会恒为 false，入口永远不显示。</p>
 *
 * @param path 目标路径
 * @returns 是否匹配到已注册的路由记录
 */
function hasPath(path: string | undefined): boolean {
  if (!path) return false;
  try {
    const resolved = router.resolve(path);
    const last = resolved.matched[resolved.matched.length - 1];
    if (!last) return false;
    // 兜底路由 /:pathMatch(.*)* → /404 会匹配任意路径，必须排除：
    // 否则「路由是否存在」恒为 true，未注册的入口照样显示、点下去落 404。
    // 口径与 packages/core/src/router/guard.ts 的 isFallbackOnly 保持一致。
    if (String(last.path ?? "").includes("pathMatch")) return false;
    if (resolved.path === "/404" && path !== "/404") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 条目是否可用。
 *
 * <p>route 模式要求目标路由已注册——各应用按需装配路由树（如 eduai 只挂
 * eduaiRoutes，不含 pages/system 的 /system/config），未注册时点下去必然 404。</p>
 */
function available(entry: MenuFooterEntry): boolean {
  if (!mounted.value) return false;
  if (entry.admin && !isAdmin()) return false;
  const mode = entry.mode ?? "route";
  if (mode === "route") {
    return hasPath(entry.path);
  }
  // dialog 不依赖路由，但至少要有点内容可展示
  return true;
}

/** 是否为底部入口菜单（兼容 sys_menu_position 与 meta.position 两种形态） */
function isFooterMenu(node: Record<string, unknown>): boolean {
  const raw = node.sysMenuPosition ?? (node.meta as Record<string, unknown> | undefined)?.position;
  return String(raw ?? "").trim().toLowerCase() === "footer";
}

/**
 * 菜单节点 → 底部入口条目。
 *
 * <p>模式由结构决定（不额外占字段）：<b>有子菜单 → 弹框列出子项；无子菜单 → 直接跳路由</b>。
 * 这与菜单管理里「侧边栏底部」的说明一致，也省掉一个 mode 字段。</p>
 */
function toFooterEntry(node: Record<string, unknown>): MenuFooterEntry {
  const meta = (node.meta ?? {}) as Record<string, unknown>;
  const rawChildren = Array.isArray(node.children) ? (node.children as Record<string, unknown>[]) : [];
  // 子项里排除明确隐藏的（isVisible=0 / hidden=1）
  const visibleChildren = rawChildren.filter((child) => {
    const cm = (child.meta ?? {}) as Record<string, unknown>;
    if (String(cm.isVisible ?? "1") === "0") return false;
    return child.sysMenuHidden !== 1;
  });
  const children = visibleChildren.map(toFooterEntry);
  const path = String(node.path ?? meta.path ?? "").trim() || undefined;
  return {
    key: String(node.sysMenuId ?? node.menuId ?? path ?? node.name ?? ""),
    // 标题可能是 i18n key（menu.xxx），走统一翻译；其余原样返回
    label: getMenuLanguage(String(node.sysMenuTitle ?? node.menuName ?? meta.title ?? node.name ?? "菜单")),
    icon: (node.sysMenuIcon ?? node.icon ?? meta.icon) as string | undefined,
    mode: children.length ? "dialog" : "route",
    path,
    children: children.length ? children : undefined,
  };
}

/** 递归收集树/扁平列表里的底部入口菜单（与 ReTopMenus 同一套取数源） */
function collectFooterMenus(list: unknown, out: Record<string, unknown>[]): void {
  if (!Array.isArray(list)) return;
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const node = item as Record<string, unknown>;
    if (isFooterMenu(node)) out.push(node);
    collectFooterMenus(node.children, out);
  }
}

/**
 * 来自「菜单管理」的底部入口。
 *
 * <p>footer 菜单和 top 菜单一样是 remind=1 的脱离节点，会被侧边栏菜单树剪掉，
 * 因此要从三个源收：远程原始菜单（getMenuList）、过滤后的树（showMenuList）、
 * 以及静态路由（静态模式应用没有远程菜单）。任一处命中即可。</p>
 */
const menuFooterEntries = computed<MenuFooterEntry[]>(() => {
  // 触碰 locale：菜单标题可能是 i18n key，切语言后要重算
  locale.value;
  const nodes: Record<string, unknown>[] = [];
  collectFooterMenus(authStore.getMenuList, nodes);
  collectFooterMenus(authStore.showMenuList, nodes);
  collectFooterMenus(getStaticMenu(), nodes);
  const seen = new Set<string>();
  const entries: MenuFooterEntry[] = [];
  for (const node of nodes) {
    const entry = toFooterEntry(node);
    if (!entry.key || seen.has(entry.key)) continue;
    seen.add(entry.key);
    entries.push(entry);
  }
  return entries;
});

/** 过滤后的可见条目：菜单管理优先，未配置则回退 app.yaml（含旧 props 兜底） */
const visibleEntries = computed<MenuFooterEntry[]>(() => {
  if (!footer.value.enable) return [];
  if (menuFooterEntries.value.length > 0) {
    return menuFooterEntries.value.filter(available);
  }
  const configured = footer.value.entries ?? [];
  const list: MenuFooterEntry[] =
    configured.length > 0
      ? configured
      : props.path
        ? [{ key: "legacy", label: props.label || "设置", path: props.path, mode: "route" }]
        : [];
  return list.filter(available);
});

const single = computed(() => (visibleEntries.value.length === 1 ? visibleEntries.value[0] : null));

/** 图标名兜底 */
function iconOf(entry: MenuFooterEntry): string {
  return entry.icon?.trim() || footer.value.icon?.trim() || "Setting";
}

/** 当前路由是否命中该条目 */
function isActive(entry: MenuFooterEntry): boolean {
  return (entry.mode ?? "route") === "route" && !!entry.path && route.path === entry.path;
}

// ---------------- 弹框 ----------------
const dialogVisible = ref(false);
const dialogEntry = ref<MenuFooterEntry | null>(null);

/** 弹框里列出的子项（再按可用性过滤一次） */
const dialogChildren = computed<MenuFooterEntry[]>(() =>
  (dialogEntry.value?.children ?? []).filter(available),
);

function openDialog(entry: MenuFooterEntry): void {
  dialogEntry.value = entry;
  dialogVisible.value = true;
}

/**
 * 执行一个条目：route 跳路由，dialog 开弹框。
 *
 * @param entry 条目
 */
function activate(entry: MenuFooterEntry): void {
  const mode = entry.mode ?? "route";
  if (mode === "dialog") {
    openDialog(entry);
    return;
  }
  if (!entry.path) return;
  // 兜底：即便条目被外部条件渲染出来，目标路由不存在也绝不 push（push 会落 404）
  if (!hasPath(entry.path)) return;
  // 弹框里的子项点击后要先关掉弹框再跳转，否则弹框会浮在新页面上
  if (dialogVisible.value) dialogVisible.value = false;
  if (route.path !== entry.path) void router.push(entry.path);
}
</script>

<style lang="scss" scoped>
/** 底部容器：上方一条分隔线，把入口与菜单列表分开 */
.nav-setting-entry {
  flex-shrink: 0;
  padding: 8px $aside-menu-padding-right 10px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

/** 图标栏按钮坞模式：与相邻的切换/头像按钮同规格，不画分隔线 */
.nav-setting-entry.is-compact {
  padding: 0;
  border-top: none;
}

.nav-setting-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: $aside-menu-height;
  padding: 0 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: $aside-menu-font-weight;
  color: var(--el-menu-text-color, var(--el-text-color-regular));
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: $aside-menu-border-left;
  transition:
    background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}

.nav-setting-icon {
  flex-shrink: 0;
}

/** 纯图标：居中，不留文字位 */
.nav-setting-btn.is-icon-only {
  justify-content: center;
  height: 40px;
  padding: 0;
  border-radius: var(--el-border-radius-base, 6px);
}

.nav-setting-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-setting-btn:hover {
  color: var(--el-menu-hover-text-color, var(--el-color-primary));
  background: var(--el-menu-hover-bg-color, var(--el-fill-color-light));
}

.nav-setting-btn.is-active {
  color: var(--el-menu-active-text-color, var(--el-color-primary));
  background: var(--el-menu-active-bg-color, var(--el-color-primary-light-9));
}

/* ---------------- 弹出菜单 / 弹框里的条目 ---------------- */

.nav-setting-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
}

.nav-setting-menu__item {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 7px 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-setting-menu__item:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.nav-setting-menu__item.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.nav-setting-menu__icon {
  flex-shrink: 0;
}

.nav-setting-menu__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-setting-dialog__desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.nav-setting-dialog__list {
  padding: 0;
}

.nav-setting-dialog__empty {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 动效降级 */
@media (prefers-reduced-motion: reduce) {
  .nav-setting-btn,
  .nav-setting-menu__item {
    transition: none;
  }
}
</style>
