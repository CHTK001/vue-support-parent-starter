<template>
  <div class="search-menu-trigger">
    <!-- 命令面板入口：icons-animated 动画放大镜（hover/focus 播放）。
         去掉 koi-pulse-i——它是 hover 期间无限脉动，会与图标自带动画持续抢帧。 -->
    <div
      class="hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center"
      @click="isShowSearch = true"
    >
      <el-tooltip :content="$t('header.commandPalette.tip')">
        <ReIcon name="anim:tabler:search" size="18" />
      </el-tooltip>
    </div>

    <ReDialog
      v-model="isShowSearch"
      class="search-menu-dialog"
      width="560"
      :show-close="false"
      top="10vh"
      append-to-body
      destroy-on-close
    >
      <div class="search-menu">
        <div class="search-menu__search">
          <el-input
            ref="menuInputRef"
            v-model="keyword"
            :placeholder="$t('header.commandPalette.placeholder')"
            size="large"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="search-menu__content">
          <div v-if="!keyword.trim() && !resultList.length" class="search-menu__placeholder">
            <div class="search-menu__placeholder-icon">
              <ReIcon name="koi-search" size="28" />
            </div>
            <p class="search-menu__placeholder-title">{{ $t("header.commandPalette.title") }}</p>
            <p class="search-menu__placeholder-desc">{{ $t("header.commandPalette.hint") }}</p>
          </div>

          <el-scrollbar v-else-if="resultList.length" max-height="380">
            <div ref="menuListRef" class="search-menu__list">
              <template v-for="item in resultList" :key="item.id">
                <div v-if="item.groupLabel" class="search-menu__group">{{ item.groupLabel }}</div>
                <div
                  :class="['search-menu__item', { 'is-active': item.id === activeId }]"
                  @mouseenter="activeId = item.id"
                  @click="invoke(item)"
                >
                  <div class="search-menu__item-icon">
                    <ReIcon v-if="item.icon" :name="item.icon" size="16" />
                    <el-icon v-else :size="16"><Menu /></el-icon>
                  </div>
                  <div class="search-menu__item-meta">
                    <span class="search-menu__item-title">{{ item.title }}</span>
                    <span class="search-menu__item-path">{{ item.hint }}</span>
                  </div>
                  <span v-if="item.id === activeId" class="search-menu__item-enter">↵</span>
                </div>
              </template>
            </div>
          </el-scrollbar>

          <el-empty v-else :image-size="72" :description="$t('msg.null')" />
        </div>

        <div class="search-menu__footer">
          <span class="search-menu__shortcut">
            <kbd>↑</kbd><kbd>↓</kbd>
            {{ $t("header.searchMenuSelect") }}
          </span>
          <span class="search-menu__shortcut">
            <kbd>↵</kbd>
            {{ $t("header.searchMenuEnter") }}
          </span>
          <span class="search-menu__shortcut">
            <kbd>ESC</kbd>
            {{ $t("header.searchMenuEsc") }}
          </span>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 命令面板（原「搜索菜单」升级版）
 *
 * <p>三合一：**菜单跳转 + 动作执行 + 最近访问**，一个输入框搞定。
 * 之所以不新开一个顶栏组件，是因为搜索入口已经存在——再挂一个图标只会让
 * 顶栏变挤，而两者的交互形态本来就是一回事（输入 → 选中 → 执行）。</p>
 *
 * <p>结果统一成 {@link PaletteItem}：`kind=menu|recent` 走路由跳转，
 * `kind=action` 直接执行。空输入时给出「最近访问 + 动作」的默认面板，
 * 输入后对三类一起过滤。</p>
 *
 * <p>快捷键 Cmd/Ctrl+K 全局唤起（再按一次关闭）。</p>
 */
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from "vue";
import { Menu, Search } from "@element-plus/icons-vue";
import type { InputInstance } from "element-plus";
import useAuthStore from "@repo/pinia/modules/auth";
import useTabsStore from "@repo/pinia/modules/tabs";
import useGlobalStore from "@repo/pinia/modules/global";
import { useRouter } from "vue-router";
import { useDebounceFn, useFullscreen } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { getMenuLanguage } from "@repo/languages";
import { useTheme } from "@repo/theme";
import { mittBus } from "@repo/utils";
import ReDialog from "@repo/ui/re-dialog";
import {
  clearSessionStorage,
  clearAuthCacheKeepToken,
} from "@repo/utils";

const router = useRouter();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const globalStore = useGlobalStore();
const { locale, t } = useI18n();
const { changeThemeMode } = useTheme();
const { toggle: toggleFullscreen } = useFullscreen();

/** 一条面板结果 */
interface PaletteItem {
  /** 唯一键：菜单/最近用 path，动作用 action:key */
  id: string;
  kind: "menu" | "recent" | "action";
  title: string;
  /** 次要说明（路径 / 动作说明） */
  hint: string;
  icon?: string;
  /** 新窗口打开（菜单 linkUrl） */
  linkUrl?: string;
  /** 导航目标 */
  path?: string;
  /** 动作执行体（kind=action） */
  run?: () => void;
  /** 分组标题（渲染时插在该项之前，仅在有值的那一项上） */
  groupLabel?: string;
}

/**
 * 与侧边栏一致：只收录可见菜单；有可见子节点则继续递归，仅叶子（可点击项）进入搜索。
 * 数据源用 recursiveMenuList，包含 staticRouter 与后端动态路由，解决仅 menuList（仅后端扁平）搜不到静态菜单的问题。
 */
function flattenVisibleLeafMenus(routes: any[] | undefined, bucket: any[] = []): any[] {
  if (!Array.isArray(routes)) return bucket;
  for (const item of routes) {
    if (String(item?.meta?.isVisible) !== "1") continue;
    const visibleChildren = (item.children || []).filter((c: any) => String(c?.meta?.isVisible) === "1");
    if (visibleChildren.length > 0) {
      flattenVisibleLeafMenus(visibleChildren, bucket);
    } else {
      bucket.push(item);
    }
  }
  return bucket;
}

const menuList = computed(() => flattenVisibleLeafMenus(authStore.recursiveMenuList));

const localizedMenuList = computed(() => {
  locale.value;
  return menuList.value.map((item: any) => ({
    ...item,
    localizedTitle: getMenuLanguage(item.meta?.title ?? ""),
    originalTitle: item.meta?.title ?? "",
  }));
});

/** 刷新路由：清空菜单/布局/用户信息缓存（保留 token）后重新拉取并 reload */
async function runRefresh(): Promise<void> {
  clearSessionStorage();
  clearAuthCacheKeepToken();
  globalStore.$reset();
  try {
    await Promise.allSettled([authStore.listRouters(), authStore.getLoginUserInfo()]);
  } catch {
    /* 拉取失败不阻塞刷新 */
  }
  window.location.reload();
}

/** 动作集：全部走已有公共 API，不新增跨组件耦合 */
const ACTIONS = computed<PaletteItem[]>(() => [
  {
    id: "action:refresh",
    kind: "action",
    title: t("header.refreshCache"),
    hint: t("header.commandPalette.actionHint.refresh"),
    icon: "anim:tabler:refresh",
    run: () => void runRefresh(),
  },
  {
    id: "action:theme-light",
    kind: "action",
    title: t("header.lightMode"),
    hint: t("header.commandPalette.actionHint.theme"),
    icon: "anim:tabler:sun",
    run: () => void changeThemeMode("light"),
  },
  {
    id: "action:theme-dark",
    kind: "action",
    title: t("header.darkMode"),
    hint: t("header.commandPalette.actionHint.theme"),
    icon: "anim:tabler:moon",
    run: () => void changeThemeMode("dark"),
  },
  {
    id: "action:theme-auto",
    kind: "action",
    title: t("header.autoMode"),
    hint: t("header.commandPalette.actionHint.theme"),
    icon: "anim:tabler:sun-moon",
    run: () => void changeThemeMode("auto"),
  },
  {
    id: "action:fullscreen",
    kind: "action",
    title: t("header.fullScreen"),
    hint: t("header.commandPalette.actionHint.fullscreen"),
    icon: "anim:tabler:arrows-maximize",
    run: () => void toggleFullscreen(),
  },
  {
    id: "action:settings",
    kind: "action",
    title: t("header.settings"),
    hint: t("header.commandPalette.actionHint.settings"),
    icon: "anim:tabler:settings",
    run: () => mittBus.emit("handleThemeConfig"),
  },
]);

/** 最近访问：已打开的标签，取最后 5 个（排除当前页） */
const recentItems = computed<PaletteItem[]>(() => {
  // 触碰 locale：标签里存的是 i18n key（menu.xxx），切语言后这里要重算
  locale.value;
  const current = router.currentRoute.value.path;
  const list = (tabsStore.tabList ?? []).filter((tab: any) => tab?.path && tab.path !== current);
  return list
    .slice(-5)
    .reverse()
    .map((tab: any) => ({
      id: `recent:${tab.path}`,
      kind: "recent" as const,
      // 标签 title 可能是 i18n key（menu.home.work.name）也可能是普通标题，
      // getMenuLanguage 只对 menu. 前缀走翻译，其余原样返回
      title: getMenuLanguage(String(tab.title ?? "")) || String(tab.path),
      hint: String(tab.path),
      icon: "anim:tabler:clock",
      path: String(tab.path),
    }));
});

const activeId = ref("");
const menuInputRef = ref<InputInstance | null>(null);
const menuListRef = ref<HTMLElement | null>(null);
const isShowSearch = ref(false);
const keyword = ref("");
const resultList = ref<PaletteItem[]>([]);

/** 结果组装：菜单 → 动作 → 最近；空输入时只给「动作 + 最近」 */
function buildResults(): void {
  const kw = keyword.value.trim().toLowerCase();
  const withGroup = (items: PaletteItem[], label: string): PaletteItem[] =>
    items.map((item, i) => (i === 0 ? { ...item, groupLabel: label } : item));

  const menuAll: PaletteItem[] = localizedMenuList.value.map((item: any) => ({
    id: `menu:${item.path}`,
    kind: "menu",
    title: item.localizedTitle,
    hint: item.path,
    icon: item.meta?.icon,
    linkUrl: item.meta?.linkUrl,
    path: item.path,
  }));

  if (!kw) {
    resultList.value = [
      ...withGroup(recentItems.value, t("header.commandPalette.recent")),
      ...withGroup(ACTIONS.value, t("header.commandPalette.actions")),
    ];
    activeId.value = resultList.value[0]?.id ?? "";
    return;
  }

  const match = (text: string) => text.toLowerCase().includes(kw);
  const menus = menuAll.filter(
    (m) => match(m.title) || match(m.hint) || match(m.id),
  );
  const actions = ACTIONS.value.filter((a) => match(a.title) || match(a.hint));
  const recents = recentItems.value.filter((r) => match(r.title) || match(r.hint));

  resultList.value = [
    ...withGroup(menus, t("header.commandPalette.menus")),
    ...withGroup(actions, t("header.commandPalette.actions")),
    ...withGroup(recents, t("header.commandPalette.recent")),
  ];
  activeId.value = resultList.value[0]?.id ?? "";
}

const debouncedBuild = useDebounceFn(buildResults, 150);

watch(keyword, debouncedBuild);

watch(locale, () => {
  if (isShowSearch.value) buildResults();
});

watch(isShowSearch, (val) => {
  if (val) {
    buildResults();
    document.addEventListener("keydown", keyboardOperation);
    nextTick(() => {
      setTimeout(() => menuInputRef.value?.focus(), 50);
    });
  } else {
    document.removeEventListener("keydown", keyboardOperation);
    keyword.value = "";
    resultList.value = [];
    activeId.value = "";
  }
});

const scrollActiveIntoView = () => {
  nextTick(() => {
    menuListRef.value?.querySelector(".search-menu__item.is-active")?.scrollIntoView({ block: "nearest" });
  });
};

const moveActive = (direction: number) => {
  const length = resultList.value.length;
  if (length === 0) return;
  const index = resultList.value.findIndex((item) => item.id === activeId.value);
  const newIndex = (index + direction + length) % length;
  activeId.value = resultList.value[newIndex].id;
  scrollActiveIntoView();
};

const keyboardOperation = (event: KeyboardEvent) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveActive(-1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    moveActive(1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    invokeActive();
  } else if (event.key === "Escape") {
    event.preventDefault();
    isShowSearch.value = false;
  }
};

/** 执行一条结果：动作直接跑，菜单/最近走路由（或新窗口） */
function invoke(item: PaletteItem): void {
  if (item.kind === "action") {
    isShowSearch.value = false;
    // 关面板后再执行：刷新/全屏这类动作会改布局，先让 dialog 退出更稳
    setTimeout(() => item.run?.(), 120);
    return;
  }
  activeId.value = item.id;
  setTimeout(() => {
    if (item.linkUrl) window.open(item.linkUrl, "_blank");
    else if (item.path) void router.push(item.path);
    isShowSearch.value = false;
  }, 120);
}

const invokeActive = () => {
  const item = resultList.value.find((i) => i.id === activeId.value);
  if (item) invoke(item);
};

/** 全局快捷键 Cmd/Ctrl+K：开/关面板 */
function onGlobalKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    isShowSearch.value = !isShowSearch.value;
  }
}

onMounted(() => document.addEventListener("keydown", onGlobalKeydown));
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onGlobalKeydown);
  document.removeEventListener("keydown", keyboardOperation);
});
</script>

<style lang="scss" scoped>
.search-menu-trigger {
  position: relative;
  display: flex;
  align-items: center;
}

.search-menu {
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

.search-menu__search {
  padding: 16px 16px 12px;

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  }
}

.search-menu__content {
  flex: 1;
  min-height: 280px;
  padding: 0 12px;
}

.search-menu__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 280px;
  padding: 0 24px;
  text-align: center;
}

.search-menu__placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 14px;
}

.search-menu__placeholder-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.search-menu__placeholder-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 分组标题：动作 / 菜单 / 最近访问 */
.search-menu__group {
  padding: 10px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: var(--el-text-color-placeholder);
}

.search-menu__list {
  padding: 4px 4px 8px;
}

.search-menu__item {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 52px;
  padding: 0 10px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover,
  &.is-active {
    background-color: var(--el-color-primary-light-9);
  }

  &.is-active {
    box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);

    .search-menu__item-title {
      color: var(--el-color-primary);
      font-weight: 500;
    }

    .search-menu__item-icon {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-8);
    }
  }
}

.search-menu__item-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.search-menu__item-meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  line-height: 1.3;
}

.search-menu__item-title {
  overflow: hidden;
  font-size: 14px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-menu__item-path {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-menu__item-enter {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.search-menu__footer {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
}

.search-menu__shortcut {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    font-family: inherit;
    font-size: 11px;
    line-height: 1;
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    box-shadow: 0 1px 0 var(--el-border-color-lighter);
  }
}
</style>

<style lang="scss">
.search-menu-dialog {
  .el-dialog {
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 12%);
  }

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0;
  }
}
</style>
