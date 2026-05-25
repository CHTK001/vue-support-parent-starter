<template>
  <section
    ref="containerRef"
    class="sc-layout"
    :class="{
      'is-left-enabled': leftEnabled,
      'is-left-collapsed': leftEnabled && localLeftCollapsed,
      'is-layout-split': isSplitLayout,
      'is-bottom-enabled': bottomEnabled,
      'is-bottom-collapsed': bottomEnabled && localBottomCollapsed,
      'is-rail-enabled': railEnabled,
      'is-rail-collapsed': railEnabled && localRightCollapsed,
      'is-resizing': isResizing,
      'is-bottom-resizing': isBottomResizing,
    }"
    :style="layoutStyle"
  >
    <aside v-if="leftEnabled" class="sc-layout__left el-card">
      <slot
        name="left"
        :collapsed="localLeftCollapsed"
        :toggle-collapse="toggleLeftCollapse"
      />
    </aside>

    <div
      v-if="leftEnabled"
      class="sc-layout__resizer"
      :class="{ 'is-hovered': isResizerHovered }"
      @mouseenter="isResizerHovered = true"
      @mouseleave="isResizerHovered = false"
      @mousedown="startResize"
    >
      <el-button
        type="button"
        circle
        size="small"
        class="sc-layout__collapse"
        :class="{ 'is-visible': showCollapseButton }"
        :title="localLeftCollapsed ? '展开左侧面板' : '折叠左侧面板'"
        @click.stop="toggleLeftCollapse()"
      >
        <span class="el-icon">
          {{ localLeftCollapsed ? "→" : "←" }}
        </span>
      </el-button>
    </div>

    <main
      ref="mainRef"
      class="sc-layout__main"
      :class="{
        'is-split': isSplitLayout,
        'is-bottom-collapsed': localBottomCollapsed,
      }"
    >
      <template v-if="isSplitLayout">
        <section class="sc-layout__main-top">
          <slot name="top">
            <slot />
          </slot>
        </section>

        <div
          v-if="bottomEnabled && !localBottomCollapsed"
          class="sc-layout__main-resizer"
          :class="{ 'is-hovered': isBottomResizerHovered }"
          @mouseenter="isBottomResizerHovered = true"
          @mouseleave="isBottomResizerHovered = false"
          @mousedown="startBottomResize"
        >
          <el-button
            v-if="bottomCollapsible"
            type="button"
            circle
            size="small"
            class="sc-layout__main-collapse"
            :class="{ 'is-visible': showBottomCollapseButton }"
            title="折叠下方面板"
            @click.stop="toggleBottomCollapse(true)"
          >
            ↓
          </el-button>
        </div>

        <section
          v-if="bottomEnabled && !localBottomCollapsed"
          class="sc-layout__main-bottom"
        >
          <slot
            name="bottom"
            :collapsed="localBottomCollapsed"
            :toggle-collapse="toggleBottomCollapse"
          />
        </section>
      </template>
      <template v-else>
        <component
          :is="resolvedRouterDynamicComponent"
          v-if="
            shouldUseRouterDynamicComponent && resolvedRouterDynamicComponent
          "
        />
        <slot v-else />
      </template>
    </main>

    <div
      v-if="
        isSplitLayout &&
        bottomEnabled &&
        bottomCollapsible &&
        localBottomCollapsed
      "
      class="sc-layout__main-expand-hotspot"
    >
      <el-button
        type="button"
        circle
        size="small"
        class="sc-layout__main-expand"
        title="展开下方面板"
        @click.stop="toggleBottomCollapse(false)"
      >
        ↑
      </el-button>
    </div>

    <aside v-if="railEnabled" class="sc-layout__rail">
      <div class="sc-layout__rail-body">
        <slot
          name="rail"
          :active-tab="currentRailValue"
          :add-tab="addTab"
          :remove-tab="removeTab"
          :set-active-tab="setActiveTab"
          :tabs="displayRailTabs"
        >
          <nav
            class="sc-layout__rail-tabs"
            :class="{
              'is-round': railRound,
              [`close-mode-${railCloseButtonMode}`]: true,
            }"
          >
            <ElTooltip
              v-for="tab in displayRailTabs"
              :key="String(tab.name)"
              :content="tab.title || tab.label || String(tab.name)"
              placement="right"
              :show-after="300"
            >
              <button
                type="button"
                class="sc-layout__rail-tab"
                :class="{
                  'is-active': String(currentRailValue) === String(tab.name),
                  'is-icon-large': resolveTabIconMode(tab) === 'large',
                }"
                @click="setActiveTab(tab.name)"
              >
                <div class="sc-layout__rail-icon-wrap">
                  <span v-if="tab.icon" class="sc-layout__rail-icon">
                    <component :is="tab.icon" />
                  </span>
                  <span v-else class="sc-layout__rail-text">
                    {{ tab.label || tab.name }}
                  </span>
                </div>
                <span
                  v-if="tab.closable"
                  class="sc-layout__rail-close"
                  @click.stop="handleRailTabRemove(tab.name)"
                >
                  ×
                </span>
              </button>
            </ElTooltip>
          </nav>
        </slot>
      </div>
      <div v-if="hasRailFooterSlot" class="sc-layout__rail-footer">
        <slot
          name="rail-footer"
          :active-tab="currentRailValue"
          :add-tab="addTab"
          :remove-tab="removeTab"
          :set-active-tab="setActiveTab"
          :tabs="displayRailTabs"
        />
      </div>
      <div
        v-else-if="showDefaultRouterFooter"
        class="sc-layout__rail-footer sc-layout__rail-footer--router"
      >
        <button
          v-for="group in routerRailGroups"
          :key="String(group.name)"
          type="button"
          class="sc-layout__rail-tab sc-layout__rail-tab--footer"
          :class="{
            'is-active': String(activeRouterGroupName) === String(group.name),
            'is-icon-large': resolveTabIconMode(group) === 'large',
          }"
          :title="group.title || group.label || String(group.name)"
          @click="selectRouterGroup(group.name)"
        >
          <div class="sc-layout__rail-icon-wrap">
            <span v-if="group.icon" class="sc-layout__rail-icon">
              <component :is="group.icon" />
            </span>
            <span v-else class="sc-layout__rail-text">
              {{ group.label || group.name }}
            </span>
          </div>
        </button>
      </div>
      <el-button
        v-if="
          rightCollapsible && showRightCollapseButton && !localRightCollapsed
        "
        type="button"
        circle
        size="small"
        class="sc-layout__rail-collapse"
        title="折叠右侧面板"
        @click.stop="toggleRightCollapse(true)"
      >
        →
      </el-button>
    </aside>

    <div
      v-if="
        railEnabled &&
        rightCollapsible &&
        showRightCollapseButton &&
        localRightCollapsed
      "
      class="sc-layout__rail-expand-hotspot"
    >
      <el-button
        type="button"
        circle
        size="small"
        class="sc-layout__rail-expand"
        title="展开右侧面板"
        @click.stop="toggleRightCollapse(false)"
      >
        ←
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { localStorageProxy } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  ref,
  useSlots,
  watch,
} from "vue";
import { ElTooltip } from "element-plus";
import { useRoute, useRouter } from "vue-router";

export interface ScLayoutRailTab {
  closable?: boolean;
  icon?: any;
  iconMode?: "small" | "large";
  label?: string;
  name: string | number;
  title?: string;
}

export interface ScLayoutRouterMeta {
  activePath?: string;
  fullPath?: string;
  icon?: any;
  iconMode?: "small" | "large";
  menuPath?: string;
  realPath?: string;
  routePath?: string;
  showLink?: boolean;
  title?: string;
  [key: string]: any;
}

export interface ScLayoutRouterRecord {
  children?: ScLayoutRouterRecord[];
  component?: any;
  meta?: ScLayoutRouterMeta;
  name?: string | number | symbol;
  path?: string;
  redirect?: string;
}

const props = withDefaults(
  defineProps<{
    layout?: "left-main-right" | "left-main-split-right" | "default" | "router";
    persist?: boolean;
    persistKey?: string;
    leftCollapsed?: boolean;
    leftCollapsedWidth?: number;
    leftEnabled?: boolean;
    leftMaxWidth?: number;
    leftMinWidth?: number;
    leftResizable?: boolean;
    leftWidth?: number;
    mainMinWidth?: number;
    modelValue?: string | number;
    rightCollapsed?: boolean;
    rightCollapsible?: boolean;
    railCloseButtonMode?: "always" | "hover";
    railEnabled?: boolean;
    railRound?: boolean;
    railTabs?: ScLayoutRailTab[];
    railWidth?: number;
    showRightCollapseButton?: boolean;
    defaultPage?: string | number;
    router?: ScLayoutRouterRecord[];
    routerNavigationMode?: "route" | "component";
    railIconMode?: "small" | "large";
    bottomEnabled?: boolean;
    bottomHeight?: number;
    bottomMinHeight?: number;
    bottomMaxHeight?: number;
    topMinHeight?: number;
    bottomCollapsed?: boolean;
    bottomCollapsible?: boolean;
  }>(),
  {
    layout: "left-main-right",
    persist: true,
    persistKey: "",
    leftCollapsed: false,
    leftCollapsedWidth: 72,
    leftEnabled: false,
    leftMaxWidth: 460,
    leftMinWidth: 220,
    leftResizable: true,
    leftWidth: 280,
    mainMinWidth: 360,
    modelValue: "",
    rightCollapsed: false,
    rightCollapsible: true,
    railCloseButtonMode: "hover",
    railEnabled: true,
    railRound: false,
    railTabs: () => [],
    railWidth: 48,
    showRightCollapseButton: true,
    defaultPage: undefined,
    router: () => [],
    routerNavigationMode: "route",
    railIconMode: "small",
    bottomEnabled: false,
    bottomHeight: 260,
    bottomMinHeight: 160,
    bottomMaxHeight: 520,
    topMinHeight: 220,
    bottomCollapsed: false,
    bottomCollapsible: true,
  },
);

const emit = defineEmits<{
  (
    event: "left-resize",
    payload: {
      width: number;
    },
  ): void;
  (
    event: "left-resize-end",
    payload: {
      width: number;
    },
  ): void;
  (
    event: "left-resize-start",
    payload: {
      width: number;
    },
  ): void;
  (
    event: "bottom-resize",
    payload: {
      height: number;
    },
  ): void;
  (
    event: "bottom-resize-end",
    payload: {
      height: number;
    },
  ): void;
  (
    event: "bottom-resize-start",
    payload: {
      height: number;
    },
  ): void;
  (
    event: "tab-add",
    payload: {
      tab: ScLayoutRailTab;
    },
  ): void;
  (
    event: "tab-remove",
    payload: {
      name: string | number;
      tab?: ScLayoutRailTab;
    },
  ): void;
  (event: "update:leftCollapsed", value: boolean): void;
  (event: "update:modelValue", value: string | number): void;
  (event: "update:bottomCollapsed", value: boolean): void;
  (event: "update:rightCollapsed", value: boolean): void;
  (event: "update:railTabs", tabs: ScLayoutRailTab[]): void;
}>();
const route = useRoute();
const vueRouter = useRouter();
const containerRef = ref<HTMLElement>();
const mainRef = ref<HTMLElement>();
const localLeftWidth = ref(props.leftWidth);
const localLeftCollapsed = ref(props.leftCollapsed);
const localRightCollapsed = ref(props.rightCollapsed);
const localBottomHeight = ref(props.bottomHeight);
const localBottomCollapsed = ref(props.bottomCollapsed);
const localRailTabs = ref<ScLayoutRailTab[]>([...props.railTabs]);
const localRailValue = ref<string | number>(
  props.defaultPage !== undefined ? props.defaultPage : props.modelValue,
);
const isResizerHovered = ref(false);
const isResizing = ref(false);
const isBottomResizerHovered = ref(false);
const isBottomResizing = ref(false);
const isRestoringPersistedState = ref(false);
const slots = useSlots();

const layoutMode = computed(() => {
  if (props.layout === "left-main-split-right") {
    return "left-main-split-right" as const;
  }
  return "left-main-right" as const;
});
const isSplitLayout = computed(
  () => layoutMode.value === "left-main-split-right",
);
const useRouterTabs = computed(() => (props.router?.length || 0) > 0);
const useRouterNavigation = computed(
  () => useRouterTabs.value && props.routerNavigationMode === "route",
);

type RouterLayoutTab = ScLayoutRailTab & {
  component?: any;
  groupName?: string | number;
  matchPaths: string[];
  routePath: string;
};

type RouterLayoutGroup = ScLayoutRailTab & {
  tabs: RouterLayoutTab[];
};

const routeComponentCache = new WeakMap<Function, any>();

const resolveRouteComponent = (candidate: any) => {
  if (!candidate) {
    return undefined;
  }
  if (typeof candidate !== "function") {
    return candidate;
  }
  const cached = routeComponentCache.get(candidate);
  if (cached) {
    return cached;
  }
  const asyncComponent = defineAsyncComponent(candidate);
  routeComponentCache.set(candidate, asyncComponent);
  return asyncComponent;
};

const normalizeRoutePath = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("#")) return raw;
  return raw.replace(/\/+$/, "") || "/";
};

const isExternalRoutePath = (value: string) => {
  return /^(https?:)?\/\//i.test(String(value || "").trim());
};

const composeRoutePath = (currentPath: unknown, parentPath = "/") => {
  const rawPath = normalizeRoutePath(currentPath);
  if (!rawPath) return "";
  if (rawPath.startsWith("/") || isExternalRoutePath(rawPath)) {
    return rawPath;
  }

  const normalizedParent = normalizeRoutePath(parentPath);
  if (!normalizedParent || normalizedParent === "/") {
    return normalizeRoutePath(`/${rawPath.replace(/^\/+/, "")}`);
  }

  return normalizeRoutePath(
    `${normalizedParent.replace(/\/+$/, "")}/${rawPath.replace(/^\/+/, "")}`,
  );
};

const resolveRouterNodePath = (
  routeItem: ScLayoutRouterRecord,
  parentPath = "/",
) => {
  const meta = routeItem?.meta || {};
  const preferredPath = [
    meta.fullPath,
    meta.activePath,
    meta.menuPath,
    meta.realPath,
    meta.routePath,
    routeItem?.redirect,
    routeItem?.path,
  ]
    .map((value) => normalizeRoutePath(value))
    .find((value) => !!value && !isExternalRoutePath(value));

  if (!preferredPath) return "";
  return composeRoutePath(preferredPath, parentPath);
};

const resolveRouterNodeTitle = (
  routeItem: ScLayoutRouterRecord,
  path: string,
) => {
  const meta = routeItem?.meta || {};
  const candidate =
    meta.title ??
    (typeof routeItem?.name === "string" || typeof routeItem?.name === "number"
      ? routeItem.name
      : undefined) ??
    path;
  return String(candidate || path).trim();
};

const resolveRouterNodeIcon = (icon: any) => {
  if (!icon) return undefined;
  if (typeof icon === "string") {
    return useRenderIcon(icon);
  }
  return icon;
};

const collectRouterLayoutData = (routes: ScLayoutRouterRecord[] = []) => {
  const tabs = new Map<string, RouterLayoutTab>();
  const aliases = new Map<string, string>();
  const groups = new Map<string, RouterLayoutGroup>();

  const visit = (
    items: ScLayoutRouterRecord[],
    parentPath = "/",
    currentGroup?: RouterLayoutGroup,
  ) => {
    (items || []).forEach((routeItem) => {
      if (!routeItem) return;

      const meta = routeItem.meta || {};
      const currentPath = resolveRouterNodePath(routeItem, parentPath);
      const activePath = composeRoutePath(meta.activePath, parentPath);
      const children = Array.isArray(routeItem.children)
        ? routeItem.children
        : [];
      const visibleChildren = children.filter(
        (child) =>
          child &&
          child.meta?.showLink !== false &&
          child.meta?.routeComponentMissing !== true,
      );

      if (
        meta.showLink === false &&
        currentPath &&
        activePath &&
        !isExternalRoutePath(activePath)
      ) {
        aliases.set(currentPath, activePath);
      }

      let nextGroup = currentGroup;
      if (!currentGroup && visibleChildren.length) {
        nextGroup = {
          icon: resolveRouterNodeIcon(meta.icon),
          iconMode: meta.iconMode,
          label: resolveRouterNodeTitle(
            routeItem,
            currentPath || String(routeItem.name || ""),
          ),
          name: String(routeItem.name || currentPath || routeItem.path || ""),
          tabs: [],
          title: resolveRouterNodeTitle(
            routeItem,
            currentPath || String(routeItem.name || ""),
          ),
        };
        groups.set(String(nextGroup.name), nextGroup);
      }

      if (children.length) {
        const nextParentPath =
          currentPath || composeRoutePath(routeItem.path, parentPath);
        visit(children, nextParentPath || parentPath, nextGroup);
      }

      if (visibleChildren.length) {
        return;
      }

      if (meta.showLink === false || meta.routeComponentMissing === true) {
        return;
      }

      if (
        !currentPath ||
        currentPath === "/login" ||
        currentPath.startsWith("/error")
      ) {
        return;
      }

      const title = resolveRouterNodeTitle(routeItem, currentPath);
      const icon = resolveRouterNodeIcon(meta.icon);
      const matchPaths = [
        currentPath,
        composeRoutePath(routeItem.path, parentPath),
        activePath,
      ]
        .map((value) => normalizeRoutePath(value))
        .filter((value) => !!value && !isExternalRoutePath(value));

      const normalizedGroupName = nextGroup?.name ?? currentGroup?.name;
      const tabRecord = {
        component: resolveRouteComponent(routeItem.component),
        groupName:
          normalizedGroupName !== undefined
            ? String(normalizedGroupName)
            : undefined,
        icon,
        iconMode: meta.iconMode,
        label: title,
        matchPaths: [...new Set(matchPaths)],
        name: currentPath,
        routePath: currentPath,
        title,
      } satisfies RouterLayoutTab;

      tabs.set(currentPath, tabRecord);
      if (nextGroup) {
        nextGroup.tabs.push(tabRecord);
      } else if (currentGroup) {
        currentGroup.tabs.push(tabRecord);
      }
    });
  };

  visit(routes);

  return {
    aliases: Object.fromEntries(aliases.entries()),
    groups: [...groups.values()].filter((group) => group.tabs.length),
    tabs: [...tabs.values()],
  };
};

const routerLayoutData = computed(() =>
  useRouterTabs.value
    ? collectRouterLayoutData(props.router || [])
    : {
        aliases: {} as Record<string, string>,
        groups: [] as RouterLayoutGroup[],
        tabs: [] as RouterLayoutTab[],
      },
);

const routerRailGroups = computed(() => routerLayoutData.value.groups);
const routerRailTabs = computed(() => routerLayoutData.value.tabs);
const routerPathAliases = computed(() => routerLayoutData.value.aliases);
const routerRailTabMap = computed(
  () =>
    new Map(
      routerRailTabs.value.map((tab) => [String(tab.name), tab] as const),
    ),
);

const activeRouterGroupName = computed(() => {
  const tab = routerRailTabMap.value.get(String(localRailValue.value));
  return tab?.groupName || String(routerRailGroups.value[0]?.name || "");
});

const displayRailTabs = computed<ScLayoutRailTab[]>(() => {
  if (!useRouterTabs.value) {
    return localRailTabs.value;
  }
  const activeGroupTabs = routerRailGroups.value.find(
    (group) => String(group.name) === String(activeRouterGroupName.value),
  )?.tabs;
  if (activeGroupTabs?.length) {
    return activeGroupTabs;
  }
  return routerRailTabs.value.length
    ? routerRailTabs.value
    : localRailTabs.value;
});

const resolveAliasedRoutePath = (path: string) => {
  let current = normalizeRoutePath(path);
  const visited = new Set<string>();

  while (current && routerPathAliases.value[current] && !visited.has(current)) {
    visited.add(current);
    current = normalizeRoutePath(routerPathAliases.value[current]);
  }

  return current;
};

const findRouterTabByPath = (path: string) => {
  const normalizedPath = resolveAliasedRoutePath(path);
  if (!normalizedPath) return undefined;

  const exact = routerRailTabs.value.find(
    (item) => String(item.name) === normalizedPath,
  );
  if (exact) return exact;

  return routerRailTabs.value.find((item) =>
    item.matchPaths.some(
      (candidate) =>
        normalizedPath === candidate ||
        (candidate !== "/" && normalizedPath.startsWith(`${candidate}/`)),
    ),
  );
};

const syncRouterActiveFromRoute = () => {
  if (!useRouterNavigation.value) return;
  const matchedTab = findRouterTabByPath(String(route?.path || ""));
  const fallbackTab = displayRailTabs.value[0];
  const nextValue = matchedTab?.name ?? fallbackTab?.name ?? "";
  if (String(localRailValue.value) === String(nextValue)) return;
  localRailValue.value = nextValue;
  emit("update:modelValue", nextValue);
};

const navigateToRouterTab = (name: string | number) => {
  if (!useRouterNavigation.value) return;
  const targetTab = routerRailTabMap.value.get(String(name));
  const targetPath = normalizeRoutePath(targetTab?.routePath);
  if (!targetPath || isExternalRoutePath(targetPath)) return;
  if (normalizeRoutePath(route?.path) === targetPath) return;
  vueRouter?.push?.(targetPath).catch(() => undefined);
};

const selectRouterGroup = (name: string | number) => {
  const targetGroup = routerRailGroups.value.find(
    (group) => String(group.name) === String(name),
  );
  const targetTab = targetGroup?.tabs?.[0];
  if (!targetTab) {
    return;
  }
  if (String(localRailValue.value) !== String(targetTab.name)) {
    localRailValue.value = targetTab.name;
    emit("update:modelValue", targetTab.name);
  }
  navigateToRouterTab(targetTab.name);
};

const isEmptyPersistId = (value: unknown) => {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    value === 0 ||
    value === "0"
  );
};

const resolveRoutePersistId = () => {
  if (typeof route?.path === "string" && route?.path) {
    return route.path;
  }
  if (typeof window !== "undefined" && window.location.pathname) {
    return window.location.pathname;
  }
  return "shared";
};

const persistId = computed(() => {
  if (!isEmptyPersistId(props.persistKey)) {
    return String(props.persistKey).trim();
  }
  return resolveRoutePersistId();
});

const storageKey = computed(() => {
  return `sc_layout_${encodeURIComponent(persistId.value || "shared")}`;
});

watch(
  () => props.leftWidth,
  (value) => {
    localLeftWidth.value = value;
  },
);

watch(
  () => props.leftCollapsed,
  (value) => {
    localLeftCollapsed.value = value;
  },
);

watch(
  () => props.rightCollapsed,
  (value) => {
    localRightCollapsed.value = value;
  },
);

watch(
  () => props.bottomHeight,
  (value) => {
    localBottomHeight.value = value;
  },
);

watch(
  () => props.bottomCollapsed,
  (value) => {
    localBottomCollapsed.value = value;
  },
);

watch(
  () => props.railTabs,
  (value) => {
    localRailTabs.value = [...value];
    nextTick(() => ensureValidActiveTab());
  },
  { deep: true },
);

watch(
  () => props.modelValue,
  (value) => {
    if (value === localRailValue.value) return;
    localRailValue.value = value;
    ensureValidActiveTab();
    navigateToRouterTab(localRailValue.value);
  },
);

watch(localLeftCollapsed, (value) => {
  emit("update:leftCollapsed", value);
  savePersistedState();
});

watch(localRightCollapsed, (value) => {
  emit("update:rightCollapsed", value);
  savePersistedState();
});

watch(localBottomCollapsed, (value) => {
  emit("update:bottomCollapsed", value);
  savePersistedState();
});

watch(localLeftWidth, () => {
  savePersistedState();
});

watch(localBottomHeight, () => {
  savePersistedState();
});

watch(localRailValue, () => {
  savePersistedState();
});

watch(
  () => String(route?.path || ""),
  () => {
    syncRouterActiveFromRoute();
  },
);

watch(
  [useRouterTabs, routerRailTabs, useRouterNavigation],
  () => {
    nextTick(() => {
      ensureValidActiveTab();
      if (useRouterNavigation.value) {
        syncRouterActiveFromRoute();
      }
    });
  },
  { immediate: true },
);

const currentRailValue = computed({
  get() {
    return localRailValue.value;
  },
  set(value) {
    localRailValue.value = value;
    emit("update:modelValue", value);
  },
});

const shouldUseRouterDynamicComponent = computed(
  () =>
    useRouterTabs.value &&
    props.routerNavigationMode === "component" &&
    props.layout === "router",
);

const resolvedRouterDynamicComponent = computed(() => {
  if (!shouldUseRouterDynamicComponent.value) {
    return undefined;
  }
  const currentTab = routerRailTabMap.value.get(String(currentRailValue.value));
  return currentTab?.component;
});

const resolveTabIconMode = (tab?: ScLayoutRailTab) => {
  return tab?.iconMode || props.railIconMode || "small";
};

const showCollapseButton = computed(
  () => leftEnabled.value && (isResizerHovered.value || isResizing.value),
);
const showBottomCollapseButton = computed(
  () =>
    bottomEnabled.value &&
    !localBottomCollapsed.value &&
    (isBottomResizerHovered.value || isBottomResizing.value),
);

const leftEnabled = computed(() => props.leftEnabled);
const bottomCollapsible = computed(() => props.bottomCollapsible);
const bottomEnabled = computed(
  () => isSplitLayout.value && props.bottomEnabled,
);
const rightCollapsible = computed(
  () => props.railEnabled && props.rightCollapsible,
);
const showRightCollapseButton = computed(() => props.showRightCollapseButton);
const hasRailFooterSlot = computed(() => Boolean(slots["rail-footer"]));
const showDefaultRouterFooter = computed(
  () =>
    useRouterTabs.value &&
    !hasRailFooterSlot.value &&
    routerRailGroups.value.length > 1,
);

const safeLeftMaxWidth = computed(() => {
  const declaredMax = Math.max(props.leftMinWidth, props.leftMaxWidth);
  if (!containerRef.value) {
    return declaredMax;
  }
  const containerWidth = containerRef.value.getBoundingClientRect().width;
  const railSpace = props.railEnabled ? props.railWidth : 0;
  const resizerSpace = props.leftEnabled ? 12 : 0;
  const maxByContainer =
    containerWidth - railSpace - resizerSpace - props.mainMinWidth;
  return Math.max(props.leftMinWidth, Math.min(declaredMax, maxByContainer));
});

const safeBottomMaxHeight = computed(() => {
  const declaredMax = Math.max(props.bottomMinHeight, props.bottomMaxHeight);
  if (!mainRef.value) {
    return declaredMax;
  }
  const mainHeight = mainRef.value.getBoundingClientRect().height;
  const maxByContainer = mainHeight - props.topMinHeight - 12;
  return Math.max(props.bottomMinHeight, Math.min(declaredMax, maxByContainer));
});

const leftWidthResolved = computed(() => {
  if (!props.leftEnabled) return 0;
  if (localLeftCollapsed.value) return props.leftCollapsedWidth;
  return clampLeftWidth(localLeftWidth.value);
});

const bottomHeightResolved = computed(() => {
  if (!bottomEnabled.value) return 0;
  if (localBottomCollapsed.value) return 0;
  return clampBottomHeight(localBottomHeight.value);
});

const layoutStyle = computed(() => {
  return {
    "--sc-layout-left-track": props.leftEnabled
      ? `${leftWidthResolved.value}px`
      : "0px",
    "--sc-layout-main-min-width": `${props.mainMinWidth}px`,
    "--sc-layout-rail-track": props.railEnabled
      ? `${localRightCollapsed.value ? 0 : props.railWidth}px`
      : "0px",
    "--sc-layout-resizer-track": props.leftEnabled ? "12px" : "0px",
    "--sc-layout-top-min-height": `${props.topMinHeight}px`,
    "--sc-layout-bottom-track": bottomEnabled.value
      ? `${bottomHeightResolved.value}px`
      : "0px",
    "--sc-layout-bottom-resizer-track":
      bottomEnabled.value && !localBottomCollapsed.value ? "12px" : "0px",
  };
});

const clampLeftWidth = (width: number) => {
  return Math.max(props.leftMinWidth, Math.min(safeLeftMaxWidth.value, width));
};

const clampBottomHeight = (height: number) => {
  return Math.max(
    props.bottomMinHeight,
    Math.min(safeBottomMaxHeight.value, height),
  );
};

const syncRailTabs = (tabs: ScLayoutRailTab[]) => {
  localRailTabs.value = [...tabs];
  emit("update:railTabs", [...tabs]);
};

const ensureValidActiveTab = () => {
  const availableTabs = displayRailTabs.value;
  if (!useRouterNavigation.value) {
    const fixedTabs = ["workspace", "metadata"];
    if (fixedTabs.includes(String(localRailValue.value))) return;
  }

  const hasCurrent = availableTabs.some(
    (item) => String(item.name) === String(localRailValue.value),
  );
  if (hasCurrent) return;
  const next = availableTabs[0];
  localRailValue.value = next?.name ?? "";
  emit("update:modelValue", localRailValue.value);
};

const loadPersistedState = () => {
  if (!props.persist) return;
  isRestoringPersistedState.value = true;

  try {
    const savedState = localStorageProxy().getItem(storageKey.value) as any;
    if (!savedState || typeof savedState !== "object") {
      return;
    }

    if (
      typeof savedState.leftWidth === "number" &&
      Number.isFinite(savedState.leftWidth)
    ) {
      localLeftWidth.value = clampLeftWidth(savedState.leftWidth);
    }

    if (typeof savedState.leftCollapsed === "boolean") {
      localLeftCollapsed.value = savedState.leftCollapsed;
    }

    if (typeof savedState.rightCollapsed === "boolean") {
      localRightCollapsed.value = savedState.rightCollapsed;
    }

    if (
      typeof savedState.bottomHeight === "number" &&
      Number.isFinite(savedState.bottomHeight)
    ) {
      localBottomHeight.value = clampBottomHeight(savedState.bottomHeight);
    }

    if (typeof savedState.bottomCollapsed === "boolean") {
      localBottomCollapsed.value = savedState.bottomCollapsed;
    }

    if (
      !useRouterNavigation.value &&
      savedState.activeTab !== undefined &&
      savedState.activeTab !== null &&
      savedState.activeTab !== ""
    ) {
      localRailValue.value = savedState.activeTab;
      emit("update:modelValue", savedState.activeTab);
    }

    nextTick(() => ensureValidActiveTab());
  } finally {
    nextTick(() => {
      isRestoringPersistedState.value = false;
    });
  }
};

const savePersistedState = () => {
  if (!props.persist || isRestoringPersistedState.value) {
    return;
  }

  localStorageProxy().setItem(storageKey.value, {
    leftWidth: localLeftWidth.value,
    leftCollapsed: localLeftCollapsed.value,
    rightCollapsed: localRightCollapsed.value,
    bottomHeight: localBottomHeight.value,
    bottomCollapsed: localBottomCollapsed.value,
    activeTab: localRailValue.value,
    timestamp: Date.now(),
  });
};

const toggleLeftCollapse = (force?: boolean) => {
  const next = typeof force === "boolean" ? force : !localLeftCollapsed.value;
  localLeftCollapsed.value = next;
  if (!next) {
    localLeftWidth.value = clampLeftWidth(localLeftWidth.value);
  }
};

const toggleRightCollapse = (force?: boolean) => {
  if (!rightCollapsible.value) return;
  const next = typeof force === "boolean" ? force : !localRightCollapsed.value;
  localRightCollapsed.value = next;
};

const toggleBottomCollapse = (force?: boolean) => {
  if (!bottomEnabled.value || !bottomCollapsible.value) return;
  const next = typeof force === "boolean" ? force : !localBottomCollapsed.value;
  localBottomCollapsed.value = next;
  if (!next) {
    localBottomHeight.value = clampBottomHeight(localBottomHeight.value);
  }
};

const setLeftWidth = (width: number) => {
  if (!props.leftEnabled) return;
  localLeftWidth.value = clampLeftWidth(width);
};

const setBottomHeight = (height: number) => {
  if (!bottomEnabled.value) return;
  localBottomHeight.value = clampBottomHeight(height);
};

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", stopResize);
  emit("left-resize-end", { width: leftWidthResolved.value });
};

const stopBottomResize = () => {
  if (!isBottomResizing.value) return;
  isBottomResizing.value = false;
  document.removeEventListener("mousemove", handleBottomResizeMove);
  document.removeEventListener("mouseup", stopBottomResize);
  emit("bottom-resize-end", { height: bottomHeightResolved.value });
};

const handleResizeMove = (event: MouseEvent) => {
  if (!isResizing.value || !containerRef.value || localLeftCollapsed.value) {
    return;
  }
  const rect = containerRef.value.getBoundingClientRect();
  const next = clampLeftWidth(event.clientX - rect.left);
  localLeftWidth.value = next;
  emit("left-resize", { width: next });
};

const handleBottomResizeMove = (event: MouseEvent) => {
  if (
    !isBottomResizing.value ||
    !mainRef.value ||
    !bottomEnabled.value ||
    localBottomCollapsed.value
  ) {
    return;
  }
  const rect = mainRef.value.getBoundingClientRect();
  const next = clampBottomHeight(rect.bottom - event.clientY);
  localBottomHeight.value = next;
  emit("bottom-resize", { height: next });
};

const startResize = (event: MouseEvent) => {
  if (!props.leftEnabled || !props.leftResizable || localLeftCollapsed.value) {
    return;
  }
  event.preventDefault();
  isResizing.value = true;
  emit("left-resize-start", { width: leftWidthResolved.value });
  document.addEventListener("mousemove", handleResizeMove);
  document.addEventListener("mouseup", stopResize);
};

const startBottomResize = (event: MouseEvent) => {
  if (!bottomEnabled.value || localBottomCollapsed.value) {
    return;
  }
  event.preventDefault();
  isBottomResizing.value = true;
  emit("bottom-resize-start", { height: bottomHeightResolved.value });
  document.addEventListener("mousemove", handleBottomResizeMove);
  document.addEventListener("mouseup", stopBottomResize);
};

const setActiveTab = (name: string | number) => {
  localRailValue.value = name;
  emit("update:modelValue", name);
  navigateToRouterTab(name);
};

const addTab = (
  tab: ScLayoutRailTab,
  options: {
    activate?: boolean;
    index?: number;
  } = {},
) => {
  if (useRouterNavigation.value) return;
  const nextTabs = [...localRailTabs.value];
  const existedIndex = nextTabs.findIndex(
    (item) => String(item.name) === String(tab.name),
  );

  if (existedIndex >= 0) {
    nextTabs.splice(existedIndex, 1, tab);
  } else if (
    typeof options.index === "number" &&
    options.index >= 0 &&
    options.index <= nextTabs.length
  ) {
    nextTabs.splice(options.index, 0, tab);
  } else {
    nextTabs.push(tab);
  }

  syncRailTabs(nextTabs);
  if (options.activate !== false) {
    setActiveTab(tab.name);
  }
  emit("tab-add", { tab });
};

const removeTab = (name: string | number) => {
  if (useRouterNavigation.value) return;
  const key = String(name);
  const index = localRailTabs.value.findIndex(
    (item) => String(item.name) === key,
  );
  if (index < 0) return;

  const tab = localRailTabs.value[index];
  const nextTabs = [...localRailTabs.value];
  nextTabs.splice(index, 1);
  syncRailTabs(nextTabs);

  if (String(localRailValue.value) === key) {
    const nextActive = nextTabs[index] || nextTabs[index - 1];
    setActiveTab(nextActive ? nextActive.name : "");
  }

  emit("tab-remove", { name, tab });
};

const clearTabs = () => {
  if (useRouterNavigation.value) return;
  syncRailTabs([]);
  setActiveTab("");
};

const getTabs = () => {
  return [...displayRailTabs.value];
};

const handleRailTabRemove = (name: string | number) => {
  if (useRouterNavigation.value) return;
  removeTab(name);
};

watch(
  storageKey,
  () => {
    loadPersistedState();
  },
  { immediate: true },
);

watch(
  () => props.persist,
  (enabled) => {
    if (enabled) {
      loadPersistedState();
    }
  },
);

defineExpose({
  addTab,
  clearTabs,
  collapseBottom: () => toggleBottomCollapse(true),
  collapseLeft: () => toggleLeftCollapse(true),
  collapseRight: () => toggleRightCollapse(true),
  expandBottom: () => toggleBottomCollapse(false),
  expandLeft: () => toggleLeftCollapse(false),
  expandRight: () => toggleRightCollapse(false),
  getTabs,
  removeTab,
  setBottomHeight,
  setLeftWidth,
  setActiveTab,
  toggleBottomCollapse,
  toggleLeftCollapse,
  toggleRightCollapse,
});

ensureValidActiveTab();

onBeforeUnmount(() => {
  stopResize();
  stopBottomResize();
});
</script>

<style scoped lang="scss">
/* ─── ScLayout — 极简现代主题 ─── */
:root {
  --el-border-radius-base: 8px;
  --el-border-color-light: rgba(148, 163, 184, 0.15);
  --el-bg-color-page: #f5f7fa;
  --el-box-shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.sc-layout {
  /* ── 轻量干净主题 ── */
  --sc-layout-rail-bg: #f4f5f9;
  --sc-layout-rail-bg-strong: #edeff4;
  --sc-layout-rail-border: rgba(100, 116, 139, 0.18);
  --sc-layout-rail-shadow: none;
  --sc-layout-rail-tab-color: #64748b;
  --sc-layout-rail-tab-color-hover: #0f172a;
  --sc-layout-rail-tab-bg-hover: rgba(99, 102, 241, 0.08);
  --sc-layout-rail-tab-active-bg: rgba(99, 102, 241, 0.12);
  --sc-layout-rail-tab-active-color: #4f46e5;
  --sc-layout-rail-tab-active-shadow: none;
  --sc-layout-rail-close-bg: rgba(239, 68, 68, 0.10);
  --sc-layout-rail-close-color: #ef4444;
  --sc-layout-main-bg: #ffffff;
  --sc-layout-main-border: rgba(100, 116, 139, 0.14);
  --sc-layout-main-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 0 1px rgba(15, 23, 42, 0.04);

  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns:
    var(--sc-layout-left-track, 0px)
    var(--sc-layout-resizer-track, 0px)
    minmax(var(--sc-layout-main-min-width, 360px), 1fr)
    var(--sc-layout-rail-track, 48px);
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #f1f5f9;
}

/* ─── Layout panels ─── */
.sc-layout__left,
.sc-layout__main,
.sc-layout__rail {
  min-width: 0;
  min-height: 0;
  height: 100%;
}
.sc-layout__left,
.sc-layout__main { overflow: hidden; }
.sc-layout__rail { overflow: visible; }

/* ─── Left panel ─── */
.sc-layout__left {
  grid-column: 1;
  border: none;
  border-radius: 0;
  background: #f8f9fc;
}

/* ─── Resizer ─── */
.sc-layout__resizer {
  grid-column: 2;
  position: relative;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.25s ease;
  &:hover { background: rgba(148, 163, 184, 0.08); }
}
.sc-layout__resizer::before {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 50%;
  width: 1px;
  background: rgba(148, 163, 184, 0.15);
  content: "";
  transform: translateX(-50%);
  transition: background 0.25s ease;
}
.sc-layout__resizer::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 28px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  content: "";
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease, background 0.3s ease, height 0.3s ease;
}
.sc-layout__resizer.is-hovered::after,
.sc-layout.is-resizing .sc-layout__resizer::after {
  opacity: 1;
  height: 36px;
  background: #6366f1;
}

/* ─── Collapse button ─── */
.sc-layout__collapse {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.85);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &.is-visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
.sc-layout__collapse :deep(.el-button),
.sc-layout__main-collapse :deep(.el-button),
.sc-layout__rail-collapse :deep(.el-button),
.sc-layout__rail-expand :deep(.el-button),
.sc-layout__main-expand :deep(.el-button) {
  transition: all 0.2s ease;
  &:hover { transform: scale(1.1); }
  &:active { transform: scale(0.95); }
}

/* ─── Main area ─── */
.sc-layout__main {
  grid-column: 3;
  position: relative;
  z-index: 1;
  overflow: auto;
  background: var(--sc-layout-main-bg);
  border-radius: 10px;
  margin: 6px;
  border: 1px solid var(--sc-layout-main-border);
  box-shadow: var(--sc-layout-main-shadow);
  transition: box-shadow 0.3s ease, border-radius 0.2s ease;
}
.sc-layout__main.is-split {
  display: grid;
  grid-template-rows:
    minmax(var(--sc-layout-top-min-height, 220px), 1fr)
    var(--sc-layout-bottom-resizer-track, 0px)
    var(--sc-layout-bottom-track, 0px);
  overflow: hidden;
}
.sc-layout__main-top,
.sc-layout__main-bottom {
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 16px;
}
.sc-layout__main-top { grid-row: 1; }

/* ─── Bottom resizer ─── */
.sc-layout__main-resizer {
  grid-row: 2;
  position: relative;
  cursor: row-resize;
  background: transparent;
  transition: background-color 0.25s ease;
  &:hover { background: rgba(148, 163, 184, 0.08); }
}
.sc-layout__main-resizer::before {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 50%;
  height: 1px;
  background: rgba(148, 163, 184, 0.15);
  content: "";
  transform: translateY(-50%);
  transition: background 0.25s ease;
}
.sc-layout__main-resizer::after {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28px;
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  content: "";
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease, background 0.3s ease, width 0.3s ease;
}
.sc-layout__main-resizer.is-hovered::after,
.sc-layout.is-bottom-resizing .sc-layout__main-resizer::after {
  opacity: 1;
  width: 40px;
  background: #6366f1;
}
.sc-layout__main-collapse {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.85);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &.is-visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
.sc-layout__main-bottom {
  grid-row: 3;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}
.sc-layout__main-expand-hotspot {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 64px;
  height: 32px;
  z-index: 40;
  transform: translateX(-50%);
  cursor: pointer;
}
.sc-layout__main-expand {
  position: absolute;
  left: 50%;
  bottom: 8px;
  opacity: 0;
  transform: translateX(-50%) scale(0.85);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sc-layout__main-expand-hotspot:hover .sc-layout__main-expand {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

/* ─── Rail (right sidebar) ─── */
.sc-layout__rail {
  grid-column: 4;
  position: relative;
  z-index: 8;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  border-left: 1px solid var(--sc-layout-rail-border);
  background: var(--sc-layout-rail-bg);
  box-sizing: border-box;
  contain: layout paint;
}
.sc-layout.is-rail-collapsed .sc-layout__rail {
  opacity: 0;
  pointer-events: none;
}
.sc-layout__rail-body {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: visible;
  padding: 0;
  box-sizing: border-box;
  contain: layout paint;
}
.sc-layout__rail-footer {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  background: #f0f2f9;
  box-sizing: border-box;
  contain: paint;
}
.sc-layout__rail-footer--router {
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
}

/* ─── Rail tabs ─── */
.sc-layout__rail-tabs {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sc-layout__rail-tabs::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* ─── Rail tab button ─── */
.sc-layout__rail-tab {
  position: relative;
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--sc-layout-rail-tab-color);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;

  &:hover {
    background: var(--sc-layout-rail-tab-bg-hover);
    color: var(--sc-layout-rail-tab-color-hover);
  }
  &:active { transform: scale(0.92); transition-duration: 0.06s; }

  &.is-active {
    background: var(--sc-layout-rail-tab-active-bg);
    color: var(--sc-layout-rail-tab-active-color);
  }
}
.sc-layout__rail-tabs.is-round .sc-layout__rail-tab {
  border-radius: 999px;
}
.sc-layout__rail-tab.is-icon-large {
  width: 44px;
  height: 44px;
}

/* ─── Rail icon ─── */
.sc-layout__rail-icon,
.sc-layout__rail-text,
.sc-layout__rail-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 16px;
}
.sc-layout__rail-icon-wrap {
  border-radius: 6px;
}
.sc-layout__rail-tab.is-icon-large .sc-layout__rail-icon-wrap {
  width: 28px;
  height: 28px;
  font-size: 20px;
}
.sc-layout__rail-text {
  max-width: 36px;
  overflow: hidden;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ─── Rail close button ─── */
.sc-layout__rail-close {
  position: absolute;
  top: 1px;
  right: 1px;
  display: inline-flex;
  width: 14px;
  height: 14px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--sc-layout-rail-close-bg);
  color: var(--sc-layout-rail-close-color);
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease;
  &:hover {
    transform: scale(1.25);
    background: rgba(239, 68, 68, 0.18);
  }
}
.sc-layout__rail-tabs.close-mode-hover .sc-layout__rail-close {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
  transition: all 0.18s ease;
}
.sc-layout__rail-tabs.close-mode-hover
  .sc-layout__rail-tab:hover
  .sc-layout__rail-close {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

/* ─── Rail collapse / expand ─── */
.sc-layout__rail-collapse,
.sc-layout__rail-expand {
  position: absolute;
  top: 50%;
  z-index: 60;
  will-change: opacity, transform;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sc-layout__rail-collapse {
  left: 12px;
  transform: translate(-50%, -50%) scale(0.9);
  opacity: 0;
  &:hover { transform: translate(-50%, -50%) scale(1.05); }
}
.sc-layout.is-rail-collapsed .sc-layout__rail-collapse {
  opacity: 0;
  pointer-events: none;
}
.sc-layout__rail-expand-hotspot {
  position: absolute;
  right: 0;
  top: 50%;
  width: 36px;
  height: 64px;
  z-index: 50;
  transform: translateY(-50%);
  cursor: pointer;
}
.sc-layout__rail-expand {
  right: 10px;
  opacity: 0;
  transform: translateY(-50%) scale(0.85);
}
.sc-layout__rail-expand-hotspot:hover .sc-layout__rail-expand {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

/* ───────── Dark Mode ───────── */
:global(html.dark) .sc-layout,
:global(html[data-theme="dark"]) .sc-layout {
  color-scheme: dark;
  --sc-layout-rail-bg: #161822;
  --sc-layout-rail-bg-strong: #12141e;
  --sc-layout-rail-border: rgba(148, 163, 184, 0.1);
  --sc-layout-rail-shadow: none;
  --sc-layout-rail-tab-color: #94a3b8;
  --sc-layout-rail-tab-color-hover: #f1f5f9;
  --sc-layout-rail-tab-bg-hover: rgba(99, 102, 241, 0.1);
  --sc-layout-rail-tab-active-bg: rgba(99, 102, 241, 0.16);
  --sc-layout-rail-tab-active-color: #a5b4fc;
  --sc-layout-rail-tab-active-shadow: none;
  --sc-layout-main-bg: #0f1119;
  --sc-layout-main-border: rgba(148, 163, 184, 0.08);
  --sc-layout-main-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1);

  background: #0b0d14;

  .sc-layout__main {
    box-shadow: var(--sc-layout-main-shadow);
    border-color: var(--sc-layout-main-border);
  }
  .sc-layout__left {
    background: #161822;
  }
  .sc-layout__rail-footer {
    background: #12141e;
    border-top-color: rgba(148, 163, 184, 0.1);
  }
}

/* ───────── Responsive ───────── */
@media (max-width: 768px) {
  .sc-layout {
    grid-template-columns:
      var(--sc-layout-left-track, 0px)
      var(--sc-layout-resizer-track, 0px)
      1fr
      var(--sc-layout-rail-track, 0px);
  }
  .sc-layout__main { margin: 4px; }
  .sc-layout__main-top,
  .sc-layout__main-bottom { padding: 12px; }
}
</style>
