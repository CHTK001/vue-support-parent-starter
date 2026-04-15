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

const UNIFIED_HOME_KEY = "__lay_xx_unified_home__";
const SHORTCUT_STORAGE_KEY = "lay-xx-shortcut-keys";
const ACTIVE_STORAGE_KEY = "lay-xx-active-key";

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStoreHook();
const shortcutKeys = ref<string[]>([]);
const activeRailKey = ref<string>(UNIFIED_HOME_KEY);
const pickerVisible = ref(false);

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
      const children = Array.isArray(item.children) ? item.children : [];
      const visibleChildren = children.filter(
        (child: any) =>
          child &&
          child.meta?.showLink !== false &&
          !child.meta?.routeComponentMissing,
      );
      const hasVisibleChildren = visibleChildren.length > 0;
      const path = resolveMenuRoutePath(item, parentPath);
      const canDisplay =
        item.meta?.showLink !== false &&
        !item.meta?.routeComponentMissing &&
        !!path &&
        path !== "/login" &&
        !path.startsWith("/error");

      if (hasVisibleChildren) {
        visit(visibleChildren, path || composeMenuPath(item.path, parentPath));
        return;
      }

      if (!canDisplay) {
        return;
      }

      result.push({
        key: path,
        path,
        routeName: item.name ? String(item.name) : undefined,
        title: resolveTitle(item.meta, path),
        icon: String(item.meta?.icon || item.meta?.iconOnline || "ep:menu"),
      });
    });
  };

  visit(menus);

  return [...new Map(result.map((item) => [item.key, item])).values()];
};

const leafMenus = computed(() =>
  collectLeafMenus(permissionStore.wholeMenus || []),
);

const leafMenuMap = computed(
  () => new Map(leafMenus.value.map((item) => [item.key, item])),
);

const configuredHome = computed(() => {
  return (
    leafMenuMap.value.get("/") ||
    leafMenuMap.value.get("/home") ||
    null
  );
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
    !hasConfiguredHome.value && String(activeRailKey.value) === UNIFIED_HOME_KEY,
);

const safeNavigate = (target: Pick<LeafMenuItem, "path" | "title"> | string) => {
  const menu =
    typeof target === "string"
      ? ({ path: target, title: target } as Pick<LeafMenuItem, "path" | "title">)
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

const removeRailTab = (name: string | number) => {
  const key = String(name);
  if (key === fixedHomeEntry.value.key) return;
  shortcutKeys.value = shortcutKeys.value.filter((item) => item !== key);
};
</script>

<template>
  <section class="lay-xx-layout">
    <ScLayout
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
        <button
          type="button"
          class="lay-xx-action"
          :title="hasConfiguredHome ? '设置右侧菜单' : '添加统一主页入口'"
          @click="openPicker"
        >
          <component
            :is="
              useRenderIcon(
                hasConfiguredHome ? 'ri:settings-4-line' : 'ri:add-line',
              )
            "
          />
        </button>
      </template>
    </ScLayout>

    <el-dialog
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
    </el-dialog>
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
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
}

.lay-xx-unified-home__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.lay-xx-unified-home__header small {
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.12em;
}

.lay-xx-unified-home__header h3 {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 20px;
}

.lay-xx-shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  align-content: start;
  overflow: auto;
}

.lay-xx-shortcut-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  padding: 0 12px;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.lay-xx-shortcut-item:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--el-color-primary-rgb), 0.48);
}

.lay-xx-empty {
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: 13px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.36);
}

.lay-xx-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 12px;
  background: rgba(var(--el-color-primary-rgb), 0.12);
  color: var(--el-color-primary);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease;
}

.lay-xx-action:hover {
  transform: translateY(-1px);
  background: rgba(var(--el-color-primary-rgb), 0.18);
}

.lay-xx-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
  max-height: 420px;
  overflow: auto;
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
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.lay-xx-picker-item:hover {
  border-color: rgba(var(--el-color-primary-rgb), 0.48);
  transform: translateY(-1px);
}

:global(html.dark) .lay-xx-unified-home {
  border-color: rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 20px 38px rgba(2, 8, 23, 0.45);
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
</style>
