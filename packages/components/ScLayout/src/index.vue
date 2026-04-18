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
    <aside v-if="leftEnabled" class="sc-layout__left">
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
      <button
        type="button"
        class="sc-layout__collapse"
        :class="{ 'is-visible': showCollapseButton }"
        :title="localLeftCollapsed ? '展开左侧面板' : '折叠左侧面板'"
        @click.stop="toggleLeftCollapse()"
      >
        {{ localLeftCollapsed ? ">" : "<" }}
      </button>
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
          <button
            v-if="bottomCollapsible"
            type="button"
            class="sc-layout__main-collapse"
            :class="{ 'is-visible': showBottomCollapseButton }"
            title="折叠下方面板"
            @click.stop="toggleBottomCollapse(true)"
          >
            v
          </button>
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
          v-if="shouldUseRouterDynamicComponent && resolvedRouterDynamicComponent"
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
      <button
        type="button"
        class="sc-layout__main-expand"
        title="展开下方面板"
        @click.stop="toggleBottomCollapse(false)"
      >
        ^
      </button>
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
      <button
        v-if="
          rightCollapsible && showRightCollapseButton && !localRightCollapsed
        "
        type="button"
        class="sc-layout__rail-collapse"
        title="折叠右侧面板"
        @click.stop="toggleRightCollapse(true)"
      >
        >
      </button>
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
      <button
        type="button"
        class="sc-layout__rail-expand"
        title="展开右侧面板"
        @click.stop="toggleRightCollapse(false)"
      >
        &lt;
      </button>
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
    /** 布局模式：默认左中右，或左中(上下)右 */
    layout?: "left-main-right" | "left-main-split-right" | "default" | "router";
    /** 是否启用持久化（默认 true） */
    persist?: boolean;
    /** 持久化 key，默认使用地址栏 pathname */
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
    /** 默认加载的页面（rail tab name），不传则使用 railTabs 第一个 */
    defaultPage?: string | number;
    /** 传入标准路由结构时自动转换为 rail 导航 */
    router?: ScLayoutRouterRecord[];
    /** 路由数据驱动模式：route=默认路由接管；component=动态组件接管 */
    routerNavigationMode?: "route" | "component";
    /** 右侧菜单图标尺寸：small=现有小图标；large=大图标 */
    railIconMode?: "small" | "large";
    /** split 模式下，下方面板是否启用 */
    bottomEnabled?: boolean;
    /** split 模式下，下方面板高度 */
    bottomHeight?: number;
    /** split 模式下，下方面板最小高度 */
    bottomMinHeight?: number;
    /** split 模式下，下方面板最大高度 */
    bottomMaxHeight?: number;
    /** split 模式下，上方面板最小高度 */
    topMinHeight?: number;
    /** split 模式下，下方面板折叠状态 */
    bottomCollapsed?: boolean;
    /** split 模式下，下方面板是否可折叠 */
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
  matchPaths: string[];
  routePath: string;
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

  const visit = (items: ScLayoutRouterRecord[], parentPath = "/") => {
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

      if (children.length) {
        const nextParentPath =
          currentPath || composeRoutePath(routeItem.path, parentPath);
        visit(children, nextParentPath || parentPath);
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

      tabs.set(currentPath, {
        component: resolveRouteComponent(routeItem.component),
        icon,
        iconMode: meta.iconMode,
        label: title,
        matchPaths: [...new Set(matchPaths)],
        name: currentPath,
        routePath: currentPath,
        title,
      });
    });
  };

  visit(routes);

  return {
    aliases: Object.fromEntries(aliases.entries()),
    tabs: [...tabs.values()],
  };
};

const routerLayoutData = computed(() =>
  useRouterTabs.value
    ? collectRouterLayoutData(props.router || [])
    : {
        aliases: {} as Record<string, string>,
        tabs: [] as RouterLayoutTab[],
      },
);

const routerRailTabs = computed(() => routerLayoutData.value.tabs);
const routerPathAliases = computed(() => routerLayoutData.value.aliases);
const routerRailTabMap = computed(
  () =>
    new Map(
      routerRailTabs.value.map((tab) => [String(tab.name), tab] as const),
    ),
);

const displayRailTabs = computed<ScLayoutRailTab[]>(() => {
  if (!useRouterTabs.value) {
    return localRailTabs.value;
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
    // 用 nextTick 延迟，确保 props.modelValue 已经同步更新后再校验
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
    // 固定 tab（workspace/metadata）始终有效，不需要重置
    const fixedTabs = ["workspace", "metadata"];
    if (fixedTabs.includes(String(localRailValue.value))) return;
  }

  const hasCurrent = availableTabs.some(
    (item) => String(item.name) === String(localRailValue.value),
  );
  if (hasCurrent) return;
  // 当前 active tab 已被移除，回退到第一个 tab
  const next = availableTabs[0];
  localRailValue.value = next?.name ?? "";
  emit("update:modelValue", localRailValue.value);
};

const loadPersistedState = () => {
  if (!props.persist) return;
  isRestoringPersistedState.value = true;

  try {
    const savedState = localStorageProxy().getItem(storageKey.value);
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
.sc-layout {
  --sc-layout-rail-bg: rgba(255, 255, 255, 0.9);
  --sc-layout-rail-bg-strong: rgba(255, 255, 255, 0.96);
  --sc-layout-rail-border: rgba(15, 23, 42, 0.1);
  --sc-layout-rail-shadow: 0 10px 28px -22px rgba(15, 23, 42, 0.22);
  --sc-layout-rail-tab-color: #5f7686;
  --sc-layout-rail-tab-color-hover: #334155;
  --sc-layout-rail-tab-bg-hover: rgba(var(--el-color-primary-rgb), 0.1);
  --sc-layout-rail-tab-active-bg: rgba(var(--el-color-primary-rgb), 0.16);
  --sc-layout-rail-tab-active-color: var(--el-color-primary);
  --sc-layout-rail-tab-active-shadow:
    0 0 0 1px rgba(var(--el-color-primary-rgb), 0.2),
    0 14px 24px -18px rgba(var(--el-color-primary-rgb), 0.5);
  --sc-layout-rail-close-bg: rgba(244, 63, 94, 0.1);
  --sc-layout-rail-close-color: #be123c;

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
}

.sc-layout__left,
.sc-layout__main,
.sc-layout__rail {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.sc-layout__left,
.sc-layout__main {
  overflow: hidden;
}

.sc-layout__rail {
  overflow: visible;
}

.sc-layout__left {
  grid-column: 1;
}

.sc-layout__resizer {
  grid-column: 2;
  position: relative;
  height: 100%;
  cursor: col-resize;
}

.sc-layout__resizer::before {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 50%;
  width: 1px;
  background: rgba(15, 23, 42, 0.12);
  content: "";
  transform: translateX(-50%);
}

.sc-layout__resizer::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 28px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  content: "";
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
}

.sc-layout__resizer.is-hovered::after,
.sc-layout.is-resizing .sc-layout__resizer::after {
  opacity: 1;
}

.sc-layout__collapse {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transform: translate(-50%, -50%);
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease;
}

.sc-layout__collapse.is-visible {
  opacity: 1;
}

.sc-layout__collapse:hover {
  border-color: rgba(15, 23, 42, 0.22);
}

.sc-layout__main {
  grid-column: 3;
  position: relative;
  z-index: 1;
  overflow: auto;
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
}

.sc-layout__main-top {
  grid-row: 1;
}

.sc-layout__main-resizer {
  grid-row: 2;
  position: relative;
  cursor: row-resize;
}

.sc-layout__main-resizer::before {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 50%;
  height: 1px;
  background: rgba(15, 23, 42, 0.12);
  content: "";
  transform: translateY(-50%);
}

.sc-layout__main-resizer::after {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 28px;
  height: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  content: "";
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
}

.sc-layout__main-resizer.is-hovered::after,
.sc-layout.is-bottom-resizing .sc-layout__main-resizer::after {
  opacity: 1;
}

.sc-layout__main-collapse {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: 20px;
  height: 20px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transform: translate(-50%, -50%);
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease;
}

.sc-layout__main-collapse.is-visible {
  opacity: 1;
}

.sc-layout__main-collapse:hover {
  border-color: rgba(15, 23, 42, 0.22);
}

.sc-layout__main-bottom {
  grid-row: 3;
}

.sc-layout__main-expand-hotspot {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 64px;
  height: 32px;
  z-index: 40;
  transform: translateX(-50%);
}

.sc-layout__main-expand {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #475569;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transform: translateX(-50%);
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease;
}

.sc-layout__main-expand-hotspot:hover .sc-layout__main-expand {
  opacity: 1;
}

.sc-layout__main-expand:hover {
  border-color: rgba(15, 23, 42, 0.24);
}

.sc-layout__rail {
  grid-column: 4;
  position: relative;
  z-index: 8;
  display: flex;
  border-radius: 14px;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  border-left: 1px solid var(--sc-layout-rail-border);
  background: linear-gradient(
    180deg,
    var(--sc-layout-rail-bg-strong),
    var(--sc-layout-rail-bg)
  );
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.65),
    var(--sc-layout-rail-shadow);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
  contain: layout paint;
  will-change: opacity;
  transition: opacity 0.2s ease;
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
  box-shadow: inset 0 1px 0 var(--sc-layout-rail-border);
  background: var(--sc-layout-rail-bg-strong);
  box-sizing: border-box;
  contain: paint;
}

.sc-layout__rail-tabs {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sc-layout__rail-tabs::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.sc-layout__rail-tab {
  position: relative;
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 13px;
  background: transparent;
  color: var(--sc-layout-rail-tab-color);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.sc-layout__rail-tab::before {
  position: absolute;
  left: 2px;
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background: rgba(var(--el-color-primary-rgb), 0.75);
  content: "";
  opacity: 0;
  transform: scaleY(0.5);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.sc-layout__rail-tabs.is-round .sc-layout__rail-tab {
  border-radius: 999px;
}

.sc-layout__rail-tab:hover {
  background: var(--sc-layout-rail-tab-bg-hover);
  color: var(--sc-layout-rail-tab-color-hover);
  transform: translateX(-1px);
}

.sc-layout__rail-tab.is-icon-large {
  width: 48px;
  height: 48px;
}

.sc-layout__rail-tab.is-active {
  background: var(--sc-layout-rail-tab-active-bg);
  color: var(--sc-layout-rail-tab-active-color);
  box-shadow: var(--sc-layout-rail-tab-active-shadow);
}

.sc-layout__rail-tab.is-active::before {
  opacity: 1;
  transform: scaleY(1);
}

.sc-layout__rail-icon,
.sc-layout__rail-text,
.sc-layout__rail-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 17px;
}

.sc-layout__rail-icon-wrap {
  border-radius: 10px;
  transition: background-color 0.2s ease;
}

.sc-layout__rail-tab:hover .sc-layout__rail-icon-wrap {
  background: rgba(255, 255, 255, 0.42);
}

.sc-layout__rail-tab.is-active .sc-layout__rail-icon-wrap {
  background: rgba(255, 255, 255, 0.65);
}

.sc-layout__rail-tab.is-icon-large .sc-layout__rail-icon-wrap {
  width: 30px;
  height: 30px;
  font-size: 22px;
}

.sc-layout__rail-text {
  max-width: 36px;
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sc-layout__rail-close {
  position: absolute;
  top: 3px;
  right: 3px;
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
}

.sc-layout__rail-tabs.close-mode-hover .sc-layout__rail-close {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.sc-layout__rail-tabs.close-mode-hover
  .sc-layout__rail-tab:hover
  .sc-layout__rail-close {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

.sc-layout__rail-tabs.close-mode-hover
  .sc-layout__rail-tab:focus-visible
  .sc-layout__rail-close {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}

:global(html.dark) .sc-layout,
:global(html[data-theme="dark"]) .sc-layout {
  --sc-layout-rail-bg: rgba(15, 23, 42, 0.86);
  --sc-layout-rail-bg-strong: rgba(15, 23, 42, 0.94);
  --sc-layout-rail-border: rgba(148, 163, 184, 0.22);
  --sc-layout-rail-shadow: 0 14px 32px -24px rgba(2, 6, 23, 0.62);
  --sc-layout-rail-tab-color: #a3b8cf;
  --sc-layout-rail-tab-color-hover: #dbeafe;
  --sc-layout-rail-tab-bg-hover: rgba(var(--el-color-primary-rgb), 0.2);
  --sc-layout-rail-tab-active-bg: rgba(var(--el-color-primary-rgb), 0.3);
  --sc-layout-rail-tab-active-color: var(--el-color-primary-light-3);
  --sc-layout-rail-tab-active-shadow:
    0 0 0 1px rgba(var(--el-color-primary-rgb), 0.32),
    0 16px 28px -20px rgba(var(--el-color-primary-rgb), 0.56);
  --sc-layout-rail-close-bg: rgba(251, 113, 133, 0.24);
  --sc-layout-rail-close-color: #ffe4ea;
}

:global(html.dark) .sc-layout__main-collapse,
:global(html[data-theme="dark"]) .sc-layout__main-collapse,
:global(html.dark) .sc-layout__main-expand,
:global(html[data-theme="dark"]) .sc-layout__main-expand {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.96);
  color: #cbd5e1;
}

.sc-layout__rail-collapse,
.sc-layout__rail-expand {
  position: absolute;
  top: 50%;
  z-index: 60;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #475569;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  will-change: opacity;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease;
}

.sc-layout__rail-collapse {
  left: 12px;
  transform: translate(-50%, -50%);
}

.sc-layout__rail-collapse:hover,
.sc-layout__rail-expand:hover {
  border-color: rgba(15, 23, 42, 0.24);
}

.sc-layout__rail-expand-hotspot {
  position: absolute;
  right: 0;
  top: 50%;
  width: 32px;
  height: 64px;
  z-index: 50;
  transform: translateY(-50%);
}

.sc-layout__rail-expand {
  right: 10px;
  opacity: 0;
  transform: translateY(-50%);
}

.sc-layout__rail-expand-hotspot:hover .sc-layout__rail-expand {
  opacity: 1;
}
</style>
