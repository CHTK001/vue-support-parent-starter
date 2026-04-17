<template>
  <section
    ref="containerRef"
    class="sc-layout"
    :class="{
      'is-left-enabled': leftEnabled,
      'is-left-collapsed': leftEnabled && localLeftCollapsed,
      'is-rail-enabled': railEnabled,
      'is-rail-collapsed': railEnabled && localRightCollapsed,
      'is-resizing': isResizing,
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

    <main class="sc-layout__main">
      <slot />
    </main>

    <aside v-if="railEnabled" class="sc-layout__rail">
      <div class="sc-layout__rail-body">
        <slot
          name="rail"
          :active-tab="currentRailValue"
          :add-tab="addTab"
          :remove-tab="removeTab"
          :set-active-tab="setActiveTab"
          :tabs="localRailTabs"
        >
          <nav
            class="sc-layout__rail-tabs"
            :class="{
              'is-round': railRound,
              [`close-mode-${railCloseButtonMode}`]: true,
            }"
          >
            <ElTooltip
              v-for="tab in localRailTabs"
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
          :tabs="localRailTabs"
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import { ElTooltip } from "element-plus";
import { useRoute } from "vue-router";

export interface ScLayoutRailTab {
  closable?: boolean;
  icon?: any;
  label?: string;
  name: string | number;
  title?: string;
}

const props = withDefaults(
  defineProps<{
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
  }>(),
  {
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
  (event: "update:rightCollapsed", value: boolean): void;
  (event: "update:railTabs", tabs: ScLayoutRailTab[]): void;
}>();

const attrs = useAttrs();
const route = useRoute();
const containerRef = ref<HTMLElement>();
const localLeftWidth = ref(props.leftWidth);
const localLeftCollapsed = ref(props.leftCollapsed);
const localRightCollapsed = ref(props.rightCollapsed);
const localRailTabs = ref<ScLayoutRailTab[]>([...props.railTabs]);
const localRailValue = ref<string | number>(
  props.defaultPage !== undefined ? props.defaultPage : props.modelValue,
);
const isResizerHovered = ref(false);
const isResizing = ref(false);
const isRestoringPersistedState = ref(false);
const slots = useSlots();

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
  if (typeof route?.path === "string" && route.path) {
    return route.path;
  }
  if (typeof window !== "undefined" && window.location.pathname) {
    return window.location.pathname;
  }
  return "shared";
};

const persistId = computed(() => {
  if (!isEmptyPersistId(attrs.id)) {
    return String(attrs.id).trim();
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

watch(localLeftWidth, () => {
  savePersistedState();
});

watch(localRailValue, () => {
  savePersistedState();
});

const currentRailValue = computed({
  get() {
    return localRailValue.value;
  },
  set(value) {
    localRailValue.value = value;
    emit("update:modelValue", value);
  },
});

const showCollapseButton = computed(
  () => leftEnabled.value && (isResizerHovered.value || isResizing.value),
);

const leftEnabled = computed(() => props.leftEnabled);
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

const leftWidthResolved = computed(() => {
  if (!props.leftEnabled) return 0;
  if (localLeftCollapsed.value) return props.leftCollapsedWidth;
  return clampLeftWidth(localLeftWidth.value);
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
  };
});

const clampLeftWidth = (width: number) => {
  return Math.max(props.leftMinWidth, Math.min(safeLeftMaxWidth.value, width));
};

const syncRailTabs = (tabs: ScLayoutRailTab[]) => {
  localRailTabs.value = [...tabs];
  emit("update:railTabs", [...tabs]);
};

const ensureValidActiveTab = () => {
  // 固定 tab（workspace/metadata）始终有效，不需要重置
  const fixedTabs = ["workspace", "metadata"];
  if (fixedTabs.includes(String(localRailValue.value))) return;

  const hasCurrent = localRailTabs.value.some(
    (item) => String(item.name) === String(localRailValue.value),
  );
  if (hasCurrent) return;
  // 当前 active tab 已被移除，回退到第一个 tab
  const next = localRailTabs.value[0];
  localRailValue.value = next?.name ?? "";
  emit("update:modelValue", localRailValue.value);
};

const loadPersistedState = () => {
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
  if (isRestoringPersistedState.value) {
    return;
  }

  localStorageProxy().setItem(storageKey.value, {
    leftWidth: localLeftWidth.value,
    leftCollapsed: localLeftCollapsed.value,
    rightCollapsed: localRightCollapsed.value,
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

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  document.removeEventListener("mousemove", handleResizeMove);
  document.removeEventListener("mouseup", stopResize);
  emit("left-resize-end", { width: leftWidthResolved.value });
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

const setActiveTab = (name: string | number) => {
  localRailValue.value = name;
  emit("update:modelValue", name);
};

const addTab = (
  tab: ScLayoutRailTab,
  options: {
    activate?: boolean;
    index?: number;
  } = {},
) => {
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
  syncRailTabs([]);
  setActiveTab("");
};

const getTabs = () => {
  return [...localRailTabs.value];
};

const handleRailTabRemove = (name: string | number) => {
  removeTab(name);
};

watch(
  storageKey,
  () => {
    loadPersistedState();
  },
  { immediate: true },
);

defineExpose({
  addTab,
  clearTabs,
  collapseLeft: () => toggleLeftCollapse(true),
  collapseRight: () => toggleRightCollapse(true),
  expandLeft: () => toggleLeftCollapse(false),
  expandRight: () => toggleRightCollapse(false),
  getTabs,
  removeTab,
  setActiveTab,
  toggleLeftCollapse,
  toggleRightCollapse,
});

ensureValidActiveTab();

onBeforeUnmount(() => {
  stopResize();
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
  overflow: hidden;
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
  overflow-x: visible;
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
  left: -7px;
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

.sc-layout__rail-text {
  max-width: 36px;
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sc-layout__rail-close {
  position: absolute;
  top: -4px;
  right: -4px;
  display: inline-flex;
  width: 15px;
  height: 15px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--sc-layout-rail-close-bg);
  color: var(--sc-layout-rail-close-color);
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.14);
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

.sc-layout__rail-tabs.close-mode-hover .sc-layout__rail-tab:focus-visible .sc-layout__rail-close {
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
  left: -1px;
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
  width: 16px;
  height: 64px;
  z-index: 50;
  transform: translateY(-50%);
}

.sc-layout__rail-expand {
  right: -1px;
  opacity: 0;
  transform: translate(50%, -50%);
}

.sc-layout__rail-expand-hotspot:hover .sc-layout__rail-expand {
  opacity: 1;
}
</style>
