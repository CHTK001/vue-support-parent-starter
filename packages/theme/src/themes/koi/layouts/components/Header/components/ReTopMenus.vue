<script setup lang="ts">
/**
 * 顶部菜单入口
 *
 * 读取权限菜单中「菜单位置=top」的菜单，渲染为顶栏**纯图标按钮**。
 * 顶部菜单默认脱离菜单控制(remind=1)，不进入侧边栏，只在此处以新页面方式打开：
 *   - 外链/iframe 菜单：直接打开菜单地址
 *   - 普通页面菜单：按路由解析后新标签页打开
 *
 * 图标口径与左侧菜单完全一致（ReAsideSubMenu）：
 *   {@code meta.icon || resolveMenuDefaultIcon()}，未配 icon 时走框架默认图标，
 *   不给业务侧留「图标位空白」的机会。标题只作 tooltip / aria-label，不再占横向空间。
 */
import { computed } from "vue";
import { useRouter } from "vue-router";
import { resolveMenuDefaultIcon } from "@repo/config";
import ReIcon from "@repo/ui/components/ReIcon/theme/default/ReIcon.vue";
import useAuthStore from "@repo/pinia/modules/auth";
import { getStaticMenu } from "@repo/pinia";

interface TopMenu {
  key: string;
  title: string;
  icon?: string;
  path?: string;
  frameSrc?: string;
  remind?: boolean;
}

const authStore = useAuthStore();
const router = useRouter();

/** 缺省菜单图标：与左侧菜单同一个兜底，菜单没配 icon 时不出现空白图标位 */
const menuDefaultIcon = resolveMenuDefaultIcon();

/** 是否为顶部菜单（兼容原样字段与 meta 两种形态） */
function isTopMenu(menu: Record<string, unknown>): boolean {
  const raw = menu.sysMenuPosition ?? (menu.meta as Record<string, unknown> | undefined)?.position;
  return raw === "top";
}

/** 归一化菜单项 */
function toTopMenu(menu: Record<string, unknown>): TopMenu {
  const meta = (menu.meta ?? {}) as Record<string, unknown>;
  return {
    key: String(menu.path ?? menu.name ?? Math.random()),
    title: String(menu.sysMenuTitle ?? menu.menuName ?? meta.title ?? menu.name ?? "菜单"),
    // 图标三种来源都兼容：后端 sysMenuIcon / 短字段 icon / 静态路由 meta.icon
    icon: (menu.sysMenuIcon ?? menu.icon ?? meta.icon) as string | undefined,
    path: (menu.path ?? meta.path) as string | undefined,
    frameSrc: (menu.sysMenuFrameSrc ?? meta.frameSrc ?? menu.frameSrc) as string | undefined,
    remind: Boolean(menu.remind ?? meta.remind),
  };
}

/** 本项实际使用的图标名（业务配了就用，没配走默认） */
function iconOf(menu: TopMenu): string {
  return menu.icon || menuDefaultIcon;
}

/** 递归收集树/扁平列表中的顶部菜单 */
function collectTopMenus(list: unknown, out: TopMenu[]): void {
  if (!Array.isArray(list)) {
    return;
  }
  for (const item of list) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const node = item as Record<string, unknown>;
    if (isTopMenu(node)) {
      out.push(toTopMenu(node));
    }
    collectTopMenus(node.children, out);
  }
}

const topMenus = computed<TopMenu[]>(() => {
  const out: TopMenu[] = [];
  collectTopMenus(authStore.getMenuList, out);
  collectTopMenus(authStore.showMenuList, out);
  // 静态菜单源：route.mode=static 的应用（如 eduai）没有远程菜单，
  // getMenuList 是空的，showMenuList 又按 isVisible 过滤过 —— 只有一个
  // meta.position="top" 的路由是拿不到的。getStaticMenu() 是应用注册的原始
  // 路由树（未过滤），补上这一源，静态模式下声明的顶部菜单才真正可用。
  collectTopMenus(getStaticMenu(), out);
  // 去重（扁平列表与树可能同时命中）
  const seen = new Set<string>();
  return out.filter((m) => {
    if (seen.has(m.key)) {
      return false;
    }
    seen.add(m.key);
    return true;
  });
});

/**
 * 打开菜单：外链/iframe 直开地址，普通页面按路由解析后新页打开
 *
 * @param menu 顶部菜单
 */
function openMenu(menu: TopMenu): void {
  const frameSrc = menu.frameSrc?.trim();
  if (frameSrc) {
    window.open(frameSrc, "_blank", "noopener");
    return;
  }
  if (!menu.path) {
    return;
  }
  const href = menu.path.startsWith("http") ? menu.path : router.resolve(menu.path).href;
  window.open(href, "_blank", "noopener");
}
</script>

<template>
  <div v-if="topMenus.length" class="header-top-menus">
    <button
      v-for="menu in topMenus"
      :key="menu.key"
      type="button"
      class="header-top-menu"
      :title="menu.title"
      :aria-label="menu.title"
      @click="openMenu(menu)"
    >
      <ReIcon :name="iconOf(menu)" :size="18" aria-hidden="true" />
      <span v-if="menu.remind" class="header-top-menu__dot" aria-hidden="true"></span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.header-top-menus {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-right: 4px;
}

.header-top-menu {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 与顶栏其它图标键同尺寸，视觉上属于同一排 */
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 16px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
  transition:
    color 0.2s ease,
    background 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.header-top-menu__dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  background: var(--el-color-danger);
  border-radius: 50%;
}
</style>
