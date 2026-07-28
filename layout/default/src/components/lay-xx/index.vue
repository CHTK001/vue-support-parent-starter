<script setup lang="ts">
import { transformI18n } from "@repo/config";
import { usePermissionStoreHook } from "@repo/core";
import ScLayout from "@repo/components/ScLayout";
import { useRenderIcon } from "@repo/components/ReIcon";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

type LeafMenuItem = {
  key: string;
  icon: string;
  path: string;
  routeName?: string;
  title: string;
};

type RailEntry = LeafMenuItem & {
  closable: boolean;
};

type RailMenuBlock =
  | {
      key: string;
      kind: "heading";
      level: number;
      title: string;
    }
  | {
      key: string;
      kind: "icons";
      items: LeafMenuItem[];
      level: number;
    };

const UNIFIED_HOME_KEY = "__lay_xx_unified_home__";
const SHORTCUT_STORAGE_KEY = "lay-xx-shortcut-keys";
const ACTIVE_STORAGE_KEY = "lay-xx-active-key";

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStoreHook();
const shortcutKeys = ref<string[]>([]);
const activeRailKey = ref<string>(UNIFIED_HOME_KEY);
const pickerVisible = ref(false);
const railMenuVisible = ref(false);

const parseStorageList = (value: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
};

if (typeof window !== "undefined") {
  shortcutKeys.value = parseStorageList(
    window.localStorage.getItem(SHORTCUT_STORAGE_KEY),
  );
  const savedActiveKey = window.localStorage.getItem(ACTIVE_STORAGE_KEY);
  if (savedActiveKey) {
    activeRailKey.value = savedActiveKey;
  }
}

const normalizePath = (path?: string) => String(path || "").trim();
const NOT_FOUND_ROUTE_PATH = "/:pathMatch(.*)";

const isExternalPath = (path: string) =>
  /^https?:\/\//i.test(String(path || "").trim());

const composeMenuPath = (currentPath?: string, parentPath?: string) => {
  const rawPath = normalizePath(currentPath);
  if (!rawPath) return "";
  if (rawPath.startsWith("/") || isExternalPath(rawPath)) {
    return rawPath;
  }

  const basePath = normalizePath(parentPath);
  if (!basePath || basePath === "/") {
    return `/${rawPath.replace(/^\/+/, "")}`;
  }

  return `${basePath.replace(/\/+$/, "")}/${rawPath.replace(/^\/+/, "")}`;
};

const resolveMenuRoutePath = (item: any, parentPath = "") => {
  const meta = item?.meta || {};
  const preferredPath = [
    meta.fullPath,
    meta.activePath,
    meta.menuPath,
    meta.realPath,
    meta.routePath,
    item?.redirect,
  ]
    .map((path) => normalizePath(path))
    .find((path) => !!path && !isExternalPath(path));

  if (preferredPath) {
    return preferredPath.startsWith("/")
      ? preferredPath
      : composeMenuPath(preferredPath, parentPath);
  }

  return composeMenuPath(item?.path, parentPath);
};

const resolveTitle = (meta: Record<string, any> | undefined, path: string) => {
  const title = transformI18n(meta?.i18nKey || meta?.title) || path;
  return String(title || path).trim();
};

const getVisibleChildren = (item: any) => {
  const children = Array.isArray(item?.children) ? item.children : [];
  return children.filter(
    (child: any) =>
      child &&
      child.meta?.showLink !== false &&
      !child.meta?.routeComponentMissing,
  );
};

const resolveLeafMenuItem = (
  item: any,
  parentPath = "",
): LeafMenuItem | undefined => {
  const path = resolveMenuRoutePath(item, parentPath);
  const canDisplay =
    item?.meta?.showLink !== false &&
    !item?.meta?.routeComponentMissing &&
    !!path &&
    path !== "/login" &&
    !path.startsWith("/error");

  if (!canDisplay) {
    return undefined;
  }

  return {
    key: path,
    path,
    routeName: item?.name ? String(item.name) : undefined,
    title: resolveTitle(item?.meta, path),
    icon: String(item?.meta?.icon || item?.meta?.iconOnline || "ep:menu"),
  };
};

const isNotFoundResolved = (resolved: ReturnType<typeof router.resolve>) => {
  return (
    !resolved.matched.length ||
    resolved.matched.every(
      (record) => normalizePath(record.path) === NOT_FOUND_ROUTE_PATH,
    )
  );
};

const resolveNavigablePath = (menu: Pick<LeafMenuItem, "path" | "title">) => {
  const rawPath = normalizePath(menu.path);
  if (!rawPath || isExternalPath(rawPath)) return rawPath;

  const directResolved = router.resolve(rawPath);
  if (!isNotFoundResolved(directResolved)) {
    return rawPath;
  }

  const tailPath = rawPath.replace(/^\/+/, "");
  if (!tailPath) return rawPath;

  const routes = router
    .getRoutes()
    .filter((record) => normalizePath(record.path) !== NOT_FOUND_ROUTE_PATH);
  const tailMatchedRoutes = routes.filter((record) => {
    const routePath = normalizePath(record.path);
    return (
      !!routePath &&
      (routePath.endsWith(`/${tailPath}`) || routePath.endsWith(rawPath))
    );
  });

  if (!tailMatchedRoutes.length) {
    return rawPath;
  }

  const menuTitle = normalizePath(menu.title);
  if (menuTitle) {
    const titleMatched = tailMatchedRoutes.find((record) => {
      const routeTitle = resolveTitle(
        (record.meta as Record<string, any>) || {},
        normalizePath(record.path),
      );
      return routeTitle === menuTitle;
    });
    if (titleMatched) {
      return normalizePath(titleMatched.path);
    }
  }

  return normalizePath(tailMatchedRoutes[0].path) || rawPath;
};

const collectLeafMenus = (menus: any[]): LeafMenuItem[] => {
  const result: LeafMenuItem[] = [];

  const visit = (items: any[], parentPath = "") => {
    (items || []).forEach((item) => {
      if (!item) return;
      const visibleChildren = getVisibleChildren(item);
      const hasVisibleChildren = visibleChildren.length > 0;

      if (hasVisibleChildren) {
        const path = resolveMenuRoutePath(item, parentPath);
        visit(visibleChildren, path || composeMenuPath(item.path, parentPath));
        return;
      }

      const menuItem = resolveLeafMenuItem(item, parentPath);
      if (!menuItem) {
        return;
      }

      result.push(menuItem);
    });
  };

  visit(menus);

  return [...new Map(result.map((item) => [item.key, item])).values()];
};

const collectRailMenuBlocks = (
  menus: any[],
  parentPath = "",
  level = 0,
): RailMenuBlock[] => {
  const blocks: RailMenuBlock[] = [];

  (menus || []).forEach((item, index) => {
    if (!item) return;

    const visibleChildren = getVisibleChildren(item);
    const path = resolveMenuRoutePath(item, parentPath);
    const title = resolveTitle(
      item?.meta,
      path || normalizePath(item?.path) || `menu-${level}-${index}`,
    );

    if (!visibleChildren.length) {
      const leafItem = resolveLeafMenuItem(item, parentPath);
      if (!leafItem) return;

      blocks.push({
        key: `icons:${level}:${leafItem.key}`,
        kind: "icons",
        items: [leafItem],
        level,
      });
      return;
    }

    const leafItems: LeafMenuItem[] = [];
    const nestedParents: Array<{ item: any; parentPath: string }> = [];
    const nextParentPath = path || composeMenuPath(item?.path, parentPath);

    visibleChildren.forEach((child) => {
      const childVisibleChildren = getVisibleChildren(child);
      if (childVisibleChildren.length) {
        nestedParents.push({ item: child, parentPath: nextParentPath });
        return;
      }

      const leafItem = resolveLeafMenuItem(child, nextParentPath);
      if (leafItem) {
        leafItems.push(leafItem);
      }
    });

    if (title) {
      blocks.push({
        key: `heading:${level}:${path || title}:${index}`,
        kind: "heading",
        level,
        title,
      });
    }

    if (leafItems.length) {
      blocks.push({
        key: `icons:${level}:${path || title}:${index}`,
        kind: "icons",
        items: leafItems,
        level,
      });
    }

    nestedParents.forEach(({ item: child, parentPath: childParentPath }) => {
      blocks.push(
        ...collectRailMenuBlocks([child], childParentPath, level + 1),
      );
    });
  });

  return blocks;
};

const leafMenus = computed(() =>
  collectLeafMenus(permissionStore.wholeMenus || []),
);

const railMenuBlocks = computed(() =>
  collectRailMenuBlocks(permissionStore.wholeMenus || []),
);

const leafMenuMap = computed(
  () => new Map(leafMenus.value.map((item) => [item.key, item])),
);

const configuredHome = computed(() => {
  return leafMenuMap.value.get("/") || leafMenuMap.value.get("/home") || null;
});

const hasConfiguredHome = computed(() => !!configuredHome.value);

const fixedHomeEntry = computed<RailEntry>(() => {
  if (configuredHome.value) {
    return {
      ...configuredHome.value,
      closable: false,
    };
  }

  return {
    key: UNIFIED_HOME_KEY,
    path: "",
    title: "统一主页",
    icon: "ep:home-filled",
    closable: false,
  };
});

const normalizedShortcutKeys = computed(() => {
  const keySet = new Set<string>();
  const keys: string[] = [];

  shortcutKeys.value.forEach((key) => {
    const menu = leafMenuMap.value.get(key);
    if (!menu) return;
    if (key === fixedHomeEntry.value.key) return;
    if (keySet.has(key)) return;
    keySet.add(key);
    keys.push(key);
  });

  return keys;
});

const shortcutEntries = computed<RailEntry[]>(() =>
  normalizedShortcutKeys.value
    .map((key) => leafMenuMap.value.get(key))
    .filter((item): item is LeafMenuItem => !!item)
    .map((item) => ({
      ...item,
      closable: true,
    })),
);

const railEntries = computed<RailEntry[]>(() => [
  fixedHomeEntry.value,
  ...shortcutEntries.value,
]);

const railEntryMap = computed(
  () => new Map(railEntries.value.map((item) => [item.key, item])),
);

const railTabs = computed(() =>
  railEntries.value.map((item) => ({
    closable: item.closable,
    icon: useRenderIcon(item.icon || "ep:menu"),
    name: item.key,
    title: item.title,
  })),
);

const showUnifiedHome = computed(
  () =>
    !hasConfiguredHome.value &&
    String(activeRailKey.value) === UNIFIED_HOME_KEY,
);

const safeNavigate = (
  target: Pick<LeafMenuItem, "path" | "title"> | string,
) => {
  const menu =
    typeof target === "string"
      ? ({ path: target, title: target } as Pick<
          LeafMenuItem,
          "path" | "title"
        >)
      : target;
  const path = resolveNavigablePath(menu);
  if (!path || route.path === path) return;
  router.push(path).catch(() => undefined);
};

watch(
  normalizedShortcutKeys,
  (keys) => {
    if (shortcutKeys.value.join("|") !== keys.join("|")) {
      shortcutKeys.value = [...keys];
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(keys));
    }
  },
  { immediate: true },
);

watch(
  () => route.path,
  (path) => {
    const currentPath = normalizePath(path);
    if (!currentPath) return;
    if (railEntryMap.value.has(currentPath)) {
      activeRailKey.value = currentPath;
      return;
    }
    if (!hasConfiguredHome.value) {
      activeRailKey.value = UNIFIED_HOME_KEY;
    }
  },
  { immediate: true },
);

watch(
  () => activeRailKey.value,
  (key) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_STORAGE_KEY, String(key));
    }
    const target = railEntryMap.value.get(String(key));
    if (!target) {
      activeRailKey.value = fixedHomeEntry.value.key;
      return;
    }
    if (!target.path || target.key === UNIFIED_HOME_KEY) {
      return;
    }
    safeNavigate({
      path: target.path,
      title: target.title,
    });
  },
);

watch(
  railEntries,
  (entries) => {
    if (!entries.length) return;
    const activeKey = String(activeRailKey.value);
    if (activeKey && shortcutKeys.value.includes(activeKey)) {
      return;
    }
    const hasActive = entries.some(
      (item) => String(item.key) === String(activeRailKey.value),
    );
    if (!hasActive) {
      activeRailKey.value = entries[0].key;
    }
  },
  { immediate: true },
);

const openPicker = () => {
  pickerVisible.value = true;
};

const selectLeafShortcut = (item: LeafMenuItem) => {
  if (!shortcutKeys.value.includes(item.key)) {
    shortcutKeys.value = [...shortcutKeys.value, item.key];
  }
  Promise.resolve().then(() => {
    activeRailKey.value = item.key;
  });
  pickerVisible.value = false;
};

const selectRailMenuItem = (item: LeafMenuItem) => {
  if (
    !shortcutKeys.value.includes(item.key) &&
    item.key !== fixedHomeEntry.value.key
  ) {
    shortcutKeys.value = [...shortcutKeys.value, item.key];
  }
  Promise.resolve().then(() => {
    activeRailKey.value = item.key;
  });
  railMenuVisible.value = false;
};

const removeRailTab = (name: string | number) => {
  const key = String(name);
  if (key === fixedHomeEntry.value.key) return;
  shortcutKeys.value = shortcutKeys.value.filter((item) => item !== key);
};
</script>

<template>
  <section class="lay-xx-layout">
    <ScLayout
      id="lay-xx-workspace"
      v-model="activeRailKey"
      :left-enabled="false"
      :rail-tabs="railTabs"
      :show-right-collapse-button="true"
      @tab-remove="removeRailTab($event.name)"
    >
      <template #default>
        <div class="lay-xx-main">
          <slot />

          <section v-if="showUnifiedHome" class="lay-xx-unified-home">
            <header class="lay-xx-unified-home__header">
              <div>
                <small>UNIFIED HOME</small>
                <h3>统一主页</h3>
              </div>
              <button type="button" class="lay-xx-action" @click="openPicker">
                +
              </button>
            </header>

            <div v-if="shortcutEntries.length" class="lay-xx-shortcut-grid">
              <button
                v-for="entry in shortcutEntries"
                :key="entry.key"
                type="button"
                class="lay-xx-shortcut-item"
                @click="safeNavigate({ path: entry.path, title: entry.title })"
              >
                <component :is="useRenderIcon(entry.icon || 'ep:menu')" />
                <span>{{ entry.title }}</span>
              </button>
            </div>
            <div v-else class="lay-xx-empty">
              还没有快捷入口，点击右上角 + 添加叶子节点。
            </div>
          </section>
        </div>
      </template>

      <template #rail-footer>
        <el-popover
          v-model:visible="railMenuVisible"
          trigger="click"
          placement="left-end"
          :width="320"
          popper-class="lay-xx-rail-menu-popper"
        >
          <template #reference>
            <button
              type="button"
              class="lay-xx-action"
              title="工作间菜单"
              @click.stop
            >
              <span class="lay-xx-action__icon">
                <component :is="useRenderIcon('ri:apps-2-line')" />
              </span>
            </button>
          </template>

          <div class="lay-xx-rail-menu">
            <div class="lay-xx-rail-menu__title">工作间菜单</div>
            <div class="lay-xx-rail-menu__content">
              <template v-for="block in railMenuBlocks" :key="block.key">
                <div
                  v-if="block.kind === 'heading'"
                  class="lay-xx-rail-menu__heading"
                  :style="{ paddingLeft: `${block.level * 12}px` }"
                >
                  <span>{{ block.title }}</span>
                </div>
                <div
                  v-else
                  class="lay-xx-rail-menu__icons"
                  :style="{ paddingLeft: `${block.level * 12}px` }"
                >
                  <el-tooltip
                    v-for="item in block.items"
                    :key="item.key"
                    :content="item.title"
                    placement="top"
                  >
                    <button
                      type="button"
                      class="lay-xx-rail-menu__icon-item"
                      :class="{
                        'is-active': String(activeRailKey) === String(item.key),
                      }"
                      :title="item.title"
                      @click.stop="selectRailMenuItem(item)"
                    >
                      <component :is="useRenderIcon(item.icon || 'ep:menu')" />
                    </button>
                  </el-tooltip>
                </div>
              </template>
            </div>
          </div>
        </el-popover>
      </template>
    </ScLayout>

    <ScDialog
      v-model="pickerVisible"
      width="760px"
      title="选择叶子节点入口"
      append-to-body
      destroy-on-close
      class="lay-xx-picker"
    >
      <div class="lay-xx-picker-grid">
        <el-tooltip
          v-for="item in leafMenus"
          :key="item.key"
          :content="item.title"
          placement="top"
        >
          <button
            type="button"
            class="lay-xx-picker-item"
            @click="selectLeafShortcut(item)"
          >
            <component :is="useRenderIcon(item.icon || 'ep:menu')" />
            <span>{{ item.title }}</span>
          </button>
        </el-tooltip>
      </div>
    </ScDialog>
  </section>
</template>

<style scoped lang="scss">
.lay-xx-layout {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.lay-xx-main {
  position: relative;
  height: 100%;
  min-height: 0;
}

.lay-xx-unified-home {
  position: absolute;
  inset: 18px;
  z-index: 2;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 98%, transparent);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
  contain: layout paint;
}

.lay-xx-unified-home__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.lay-xx-unified-home__header small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.lay-xx-unified-home__header h3 {
  margin: 6px 0 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
}

.lay-xx-shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  align-content: start;
  overflow: auto;
  contain: layout paint;
}

.lay-xx-shortcut-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  padding: 0 12px;
  transition: border-color 0.18s ease;
}

.lay-xx-shortcut-item:hover {
  border-color: rgba(var(--el-color-primary-rgb), 0.48);
}

.lay-xx-empty {
  display: grid;
  place-items: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  border-radius: 12px;
  border: 1px dashed var(--el-border-color-lighter);
}

.lay-xx-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 12px;
  background: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.lay-xx-action:hover {
  background: rgba(var(--el-color-primary-rgb), 0.15);
}

.lay-xx-action__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;

  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.lay-xx-rail-menu {
  display: grid;
  gap: 12px;
}

.lay-xx-rail-menu__title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.lay-xx-rail-menu__content {
  display: grid;
  gap: 10px;
  max-height: 360px;
  overflow: auto;
  padding-right: 4px;
}

.lay-xx-rail-menu__heading {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 20px;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.lay-xx-rail-menu__heading::after {
  flex: 1;
  height: 1px;
  margin-left: 10px;
  background: var(--el-border-color-light);
  content: "";
}

.lay-xx-rail-menu__icons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lay-xx-rail-menu__icon-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.lay-xx-rail-menu__icon-item:hover,
.lay-xx-rail-menu__icon-item.is-active {
  border-color: rgba(var(--el-color-primary-rgb), 0.45);
  background: rgba(var(--el-color-primary-rgb), 0.08);
  color: var(--el-color-primary);
}

.lay-xx-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
  max-height: 420px;
  overflow: auto;
  contain: layout paint;
}

.lay-xx-picker-item {
  width: 100%;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.18s ease;
}

.lay-xx-picker-item:hover {
  border-color: rgba(var(--el-color-primary-rgb), 0.48);
}

:global(html.dark) .lay-xx-unified-home {
  border-color: rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.96);
  box-shadow: 0 12px 24px rgba(2, 8, 23, 0.28);
}

:global(html.dark) .lay-xx-unified-home__header h3,
:global(html.dark) .lay-xx-shortcut-item,
:global(html.dark) .lay-xx-picker-item {
  color: #e2e8f0;
}

:global(html.dark) .lay-xx-shortcut-item,
:global(html.dark) .lay-xx-picker-item {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.78);
}

:global(html.dark) .lay-xx-empty {
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.38);
}

:global(html.dark) .lay-xx-rail-menu__title,
:global(html.dark) .lay-xx-rail-menu__heading {
  color: #cbd5e1;
}

:global(html.dark) .lay-xx-rail-menu__heading::after {
  background: rgba(148, 163, 184, 0.24);
}

:global(html.dark) .lay-xx-rail-menu__icon-item {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.78);
  color: #e2e8f0;
}

:global(html.dark) .lay-xx-rail-menu__icon-item:hover,
:global(html.dark) .lay-xx-rail-menu__icon-item.is-active {
  background: rgba(var(--el-color-primary-rgb), 0.18);
  color: var(--el-color-primary-light-3);
}

</style>
