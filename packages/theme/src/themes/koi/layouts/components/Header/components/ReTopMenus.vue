<script setup lang="ts">
/**
 * 顶部菜单入口
 *
 * 读取权限菜单中「菜单位置=顶部(top)」的菜单，渲染为顶栏按钮。
 * 顶部菜单默认脱离菜单控制(remind=1)，不进入侧边栏，只在此处以新页面方式打开：
 *   - 外链/iframe 菜单：直接打开菜单地址
 *   - 普通页面菜单：按路由解析后新标签页打开
 */
import { computed } from "vue";
import { useRouter } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";

interface TopMenu {
  key: string;
  title: string;
  path?: string;
  frameSrc?: string;
  remind?: boolean;
}

const authStore = useAuthStore();
const router = useRouter();

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
    path: (menu.path ?? meta.path) as string | undefined,
    frameSrc: (menu.sysMenuFrameSrc ?? meta.frameSrc ?? menu.frameSrc) as string | undefined,
    remind: Boolean(menu.remind ?? meta.remind),
  };
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
      @click="openMenu(menu)"
    >
      <span class="header-top-menu__label">{{ menu.title }}</span>
      <span v-if="menu.remind" class="header-top-menu__dot" aria-hidden="true"></span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.header-top-menus {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
}

.header-top-menu {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 7px;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
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
