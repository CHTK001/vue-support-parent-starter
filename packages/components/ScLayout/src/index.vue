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
            <button
              v-for="tab in localRailTabs"
              :key="String(tab.name)"
              type="button"
              class="sc-layout__rail-tab"
              :class="{
                'is-active': String(currentRailValue) === String(tab.name),
              }"
              @click="setActiveTab(tab.name)"
            >
              <el-tooltip :content="tab.title || tab.label || String(tab.name)" placement="left">
                <ElIcon v-if="tab.icon" class="sc-layout__rail-icon">
                  <component :is="tab.icon" />
                </ElIcon>
                <span v-else class="sc-layout__rail-text">
                  {{ tab.label || tab.name }}
                </span>
                <span
                  v-if="tab.closable"
                  class="sc-layout__rail-close"
                  @click.stop="handleRailTabRemove(tab.name)"
                >
                  ×
                </span>
              </el-tooltip>
            </button>
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
          rightCollapsible &&
          showRightCollapseButton &&
          !localRightCollapsed
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
        <
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots, watch } from "vue";
import { ElIcon } from "element-plus";

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

const containerRef = ref<HTMLElement>();
const localLeftWidth = ref(props.leftWidth);
const localLeftCollapsed = ref(props.leftCollapsed);
const localRightCollapsed = ref(props.rightCollapsed);
const localRailTabs = ref<ScLayoutRailTab[]>([...props.railTabs]);
const localRailValue = ref<string | number>(props.modelValue);
const isResizerHovered = ref(false);
const isResizing = ref(false);
const slots = useSlots();

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
    ensureValidActiveTab();
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
});

watch(localRightCollapsed, (value) => {
  emit("update:rightCollapsed", value);
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
  const hasCurrent = localRailTabs.value.some(
    (item) => String(item.name) === String(localRailValue.value),
  );
  if (hasCurrent) return;
  const next = localRailTabs.value[0];
  localRailValue.value = next?.name ?? "";
  emit("update:modelValue", localRailValue.value);
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
  transform: translate(-50%, -50%) scale(0.92);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease;
}

.sc-layout__collapse.is-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
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
  border-radius: 12px;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 1px 0 0 rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
  transition:
    opacity 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
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
  overflow: hidden;
  padding: 0;
  box-sizing: border-box;
}

.sc-layout__rail-footer {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  box-shadow: inset 0 1px 0 rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-sizing: border-box;
}

.sc-layout__rail-tabs {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
}

.sc-layout__rail-tab {
  position: relative;
  display: inline-flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #5f7686;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.sc-layout__rail-tabs.is-round .sc-layout__rail-tab {
  border-radius: 999px;
}

.sc-layout__rail-tab:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
}

.sc-layout__rail-tab.is-active {
  background: rgba(15, 23, 42, 0.1);
  color: #0f172a;
}

.sc-layout__rail-icon,
.sc-layout__rail-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  top: -3px;
  right: -3px;
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #fef2f2;
  color: #b42318;
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.92);
}

.sc-layout__rail-tabs.close-mode-hover .sc-layout__rail-close {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.92);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.sc-layout__rail-tabs.close-mode-hover
  .sc-layout__rail-tab:hover
  .sc-layout__rail-close,
.sc-layout__rail-tabs.close-mode-hover
  .sc-layout__rail-tab.is-active
  .sc-layout__rail-close {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
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
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
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
  transform: translate(50%, -50%) scale(0.92);
}

.sc-layout__rail-expand-hotspot:hover .sc-layout__rail-expand {
  opacity: 1;
  transform: translate(50%, -50%) scale(1);
}
</style>
