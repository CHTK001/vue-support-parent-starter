<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import type {
  OverlayStackClosePayload,
  OverlayStackPosition,
  OverlayStackItem,
  ResolvedOverlayStackItem,
} from "./types";

defineOptions({
  name: "ScOverlayStack",
});

const POSITIONS: OverlayStackPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "left-center",
  "right-center",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const props = withDefaults(
  defineProps<{
    items: OverlayStackItem[];
    defaultPosition?: OverlayStackPosition;
    maxVisible?: number;
    width?: number | string;
    stacked?: boolean;
    stackExpanded?: boolean;
    expandOnHover?: boolean;
    detailsCollapsible?: boolean;
    detailsCollapsed?: boolean;
    closeable?: boolean;
    autoClose?: boolean;
    autoCloseDelay?: number;
    messageLimit?: number;
    teleportTo?: string;
    zIndex?: number;
  }>(),
  {
    defaultPosition: "bottom-right",
    maxVisible: 5,
    width: 360,
    stacked: true,
    stackExpanded: false,
    expandOnHover: true,
    detailsCollapsible: true,
    detailsCollapsed: true,
    closeable: true,
    autoClose: false,
    autoCloseDelay: 5000,
    messageLimit: 6,
    teleportTo: "body",
    zIndex: 4980,
  },
);

const emit = defineEmits<{
  open: [item: ResolvedOverlayStackItem];
  close: [payload: OverlayStackClosePayload];
  minimize: [item: ResolvedOverlayStackItem];
  toggleDetails: [payload: { item: ResolvedOverlayStackItem; collapsed: boolean }];
}>();

const hoveredPosition = ref<OverlayStackPosition | null>(null);
const detailState = reactive<Record<string, boolean>>({});
const closeTimers = new Map<string, ReturnType<typeof setTimeout>>();
const closingIds = new Set<string>();

const stackWidth = computed(() =>
  typeof props.width === "number" ? `${props.width}px` : props.width,
);

const normalizedItems = computed<ResolvedOverlayStackItem[]>(() =>
  props.items.map((item) => ({
    ...item,
    tone: item.tone ?? "default",
    position: item.position ?? props.defaultPosition,
    latestMessage:
      item.latestMessage ??
      item.messages?.[item.messages.length - 1]?.content ??
      "",
    messages: (item.messages ?? []).slice(-props.messageLimit),
    progress:
      typeof item.progress === "number" && Number.isFinite(item.progress)
        ? Math.max(0, Math.min(100, Math.round(item.progress)))
        : null,
    showPercent: item.showPercent ?? true,
    minimizeable: item.minimizeable ?? false,
    closeable: item.closeable ?? props.closeable,
    autoClose: item.autoClose ?? props.autoClose,
    autoCloseDelay: item.autoCloseDelay ?? props.autoCloseDelay,
  })),
);

const itemsByPosition = computed(() =>
  POSITIONS.reduce<Record<OverlayStackPosition, ResolvedOverlayStackItem[]>>(
    (acc, position) => {
      acc[position] = normalizedItems.value.filter(
        (item) => item.position === position,
      );
      return acc;
    },
    {
      "top-left": [],
      "top-center": [],
      "top-right": [],
      "left-center": [],
      "right-center": [],
      "bottom-left": [],
      "bottom-center": [],
      "bottom-right": [],
    },
  ),
);

const hasItems = computed(() => normalizedItems.value.length > 0);

const clearTimer = (itemId: string) => {
  const timer = closeTimers.get(itemId);
  if (!timer) {
    return;
  }
  clearTimeout(timer);
  closeTimers.delete(itemId);
};

const emitClose = (
  item: ResolvedOverlayStackItem,
  reason: OverlayStackClosePayload["reason"],
) => {
  if (closingIds.has(item.id)) {
    return;
  }
  closingIds.add(item.id);
  clearTimer(item.id);
  emit("close", { item, reason });
};

const syncDetailState = (items: ResolvedOverlayStackItem[]) => {
  const activeIds = new Set(items.map((item) => item.id));
  Object.keys(detailState).forEach((itemId) => {
    if (!activeIds.has(itemId)) {
      delete detailState[itemId];
    }
  });
  items.forEach((item) => {
    if (!(item.id in detailState)) {
      detailState[item.id] = props.detailsCollapsed;
    }
  });
};

const syncClosingState = (items: ResolvedOverlayStackItem[]) => {
  const activeIds = new Set(items.map((item) => item.id));
  [...closingIds].forEach((itemId) => {
    if (!activeIds.has(itemId)) {
      closingIds.delete(itemId);
    }
  });
};

const syncAutoCloseTimers = (items: ResolvedOverlayStackItem[]) => {
  const activeIds = new Set(items.map((item) => item.id));
  [...closeTimers.keys()].forEach((itemId) => {
    if (!activeIds.has(itemId)) {
      clearTimer(itemId);
    }
  });
  items.forEach((item) => {
    if (!item.autoClose || closingIds.has(item.id)) {
      clearTimer(item.id);
      return;
    }
    if (closeTimers.has(item.id)) {
      return;
    }
    closeTimers.set(
      item.id,
      setTimeout(() => emitClose(item, "auto"), item.autoCloseDelay),
    );
  });
};

const enforceVisibleLimit = (items: ResolvedOverlayStackItem[]) => {
  if (props.maxVisible <= 0 || items.length <= props.maxVisible) {
    return;
  }
  [...items]
    .sort(
      (left, right) =>
        (left.createdAt ?? left.timestamp ?? 0) -
        (right.createdAt ?? right.timestamp ?? 0),
    )
    .slice(0, items.length - props.maxVisible)
    .forEach((item) => emitClose(item, "overflow"));
};

watch(
  normalizedItems,
  (items) => {
    syncDetailState(items);
    syncClosingState(items);
    syncAutoCloseTimers(items);
    enforceVisibleLimit(items);
  },
  { immediate: true, deep: true },
);

onBeforeUnmount(() => {
  [...closeTimers.keys()].forEach(clearTimer);
});

const isGroupExpanded = (position: OverlayStackPosition) =>
  !props.stacked ||
  props.stackExpanded ||
  (props.expandOnHover && hoveredPosition.value === position);

const getCardStyle = (
  position: OverlayStackPosition,
  index: number,
  total: number,
) => {
  if (!props.stacked || isGroupExpanded(position)) {
    return { zIndex: String(total - index) };
  }
  return {
    zIndex: String(total - index),
    marginTop: index === 0 ? "0px" : `${-Math.min(92, 74 + index * 4)}px`,
    transform: `translate3d(${index * 10}px, ${index * 2}px, 0) scale(${(1 - index * 0.035).toFixed(3)}) rotate(${index % 2 === 0 ? -0.6 : 0.6}deg)`,
    opacity: String(Math.max(0.5, 1 - index * 0.12)),
  };
};

const formatDateTime = (value?: number) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "--";

const formatLogTime = (value?: number) =>
  value
    ? new Date(value).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--";

const hasDetailContent = (item: ResolvedOverlayStackItem) =>
  !!item.timestamp || !!item.latestMessage || item.messages.length > 0;

const getSummaryText = (item: ResolvedOverlayStackItem) =>
  item.summary ||
  item.latestMessage ||
  item.messages[item.messages.length - 1]?.content ||
  "暂无消息";

const getProgressWidth = (item: ResolvedOverlayStackItem) =>
  `${Math.max(0, Math.min(100, item.progress ?? 0))}%`;

const isDetailsCollapsed = (itemId: string) =>
  props.detailsCollapsible ? detailState[itemId] ?? props.detailsCollapsed : false;

const toggleDetails = (item: ResolvedOverlayStackItem) => {
  if (!props.detailsCollapsible) {
    return;
  }
  const collapsed = !isDetailsCollapsed(item.id);
  detailState[item.id] = collapsed;
  emit("toggleDetails", { item, collapsed });
};
</script>

<template>
  <Teleport :to="teleportTo">
    <div
      v-if="hasItems"
      class="overlay-stack-root"
      :style="{
        '--overlay-stack-width': stackWidth,
        '--overlay-stack-z-index': String(zIndex),
      }"
    >
      <div
        v-for="position in POSITIONS"
        :key="position"
        class="overlay-stack-group"
        :class="[
          `is-${position}`,
          {
            'is-stacked': stacked,
            'is-expanded': isGroupExpanded(position),
          },
        ]"
        @mouseenter="hoveredPosition = position"
        @mouseleave="hoveredPosition = null"
      >
        <TransitionGroup name="overlay-stack-card">
          <article
            v-for="(item, index) in itemsByPosition[position]"
            :key="item.id"
            class="overlay-stack-card"
            :class="[`is-tone-${item.tone}`]"
            :style="getCardStyle(position, index, itemsByPosition[position].length)"
            role="button"
            tabindex="0"
            @click="emit('open', item)"
            @keydown.enter="emit('open', item)"
            @keydown.space.prevent="emit('open', item)"
          >
            <div class="overlay-stack-card-top">
              <span class="overlay-stack-card-title">
                <IconifyIconOnline
                  v-if="item.icon"
                  :icon="item.icon"
                />
                <span class="overlay-stack-card-title-text">
                  {{ item.title }}
                </span>
              </span>
              <div class="overlay-stack-card-actions">
                <button
                  v-if="detailsCollapsible && hasDetailContent(item)"
                  class="overlay-stack-icon-btn"
                  type="button"
                  @click.stop="toggleDetails(item)"
                >
                  <IconifyIconOnline
                    :icon="
                      isDetailsCollapsed(item.id)
                        ? 'ri:arrow-down-s-line'
                        : 'ri:arrow-up-s-line'
                    "
                  />
                </button>
                <button
                  v-if="item.minimizeable"
                  class="overlay-stack-icon-btn"
                  type="button"
                  @click.stop="emit('minimize', item)"
                >
                  <IconifyIconOnline icon="ri:subtract-line" />
                </button>
                <button
                  v-if="item.closeable"
                  class="overlay-stack-icon-btn"
                  type="button"
                  @click.stop="emitClose(item, 'manual')"
                >
                  <IconifyIconOnline icon="ri:close-line" />
                </button>
              </div>
            </div>

            <div v-if="item.description" class="overlay-stack-card-body">
              <p class="overlay-stack-description">
                {{ item.description }}
              </p>
            </div>

            <div
              v-if="item.progress !== null || item.progressLabel || item.progressSecondary"
              class="overlay-stack-progress-block"
            >
              <div class="overlay-stack-progress">
                <div class="overlay-stack-progress-track">
                  <div
                    class="overlay-stack-progress-fill"
                    :class="{ 'is-indeterminate': item.progress === null }"
                    :style="{ width: getProgressWidth(item) }"
                  />
                </div>
                <span v-if="item.showPercent">{{
                  item.progress === null ? "--" : `${item.progress}%`
                }}</span>
              </div>
              <div
                v-if="item.progressLabel || item.progressSecondary"
                class="overlay-stack-progress-meta"
              >
                <span>{{ item.progressLabel || "" }}</span>
                <span>{{ item.progressSecondary || "" }}</span>
              </div>
            </div>

            <div v-if="hasDetailContent(item)" class="overlay-stack-detail">
              <div
                v-if="detailsCollapsible && isDetailsCollapsed(item.id)"
                class="overlay-stack-detail-summary"
              >
                <span class="overlay-stack-detail-date">
                  {{ formatDateTime(item.timestamp) }}
                </span>
                <span class="overlay-stack-detail-preview">
                  {{ getSummaryText(item) }}
                </span>
              </div>

              <div
                v-else
                class="overlay-stack-detail-panel"
              >
                <div class="overlay-stack-detail-date">
                  {{ formatDateTime(item.timestamp) }}
                </div>
                <div
                  v-if="item.messages.length > 0"
                  class="overlay-stack-log-list"
                >
                  <div
                    v-for="message in item.messages"
                    :key="message.id"
                    class="overlay-stack-log-row"
                  >
                    <span
                      class="overlay-stack-log-dot"
                      :class="`is-${message.level || 'info'}`"
                    />
                    <span class="overlay-stack-log-time">
                      {{ formatLogTime(message.timestamp) }}
                    </span>
                    <span class="overlay-stack-log-content">
                      {{ message.content }}
                    </span>
                  </div>
                </div>
                <div
                  v-else-if="item.latestMessage"
                  class="overlay-stack-detail-preview is-standalone"
                >
                  {{ item.latestMessage }}
                </div>
              </div>
            </div>
          </article>
        </TransitionGroup>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
:global(html) {
  --overlay-stack-card-bg: rgba(255, 255, 255, 0.92);
  --overlay-stack-card-border: rgba(122, 142, 170, 0.18);
  --overlay-stack-card-shadow: 0 18px 38px rgba(20, 31, 51, 0.16);
  --overlay-stack-card-title: #101828;
  --overlay-stack-card-text: rgba(42, 58, 79, 0.78);
  --overlay-stack-card-subtle: rgba(42, 58, 79, 0.64);
  --overlay-stack-icon-bg: rgba(255, 255, 255, 0.72);
  --overlay-stack-icon-border: rgba(120, 136, 160, 0.18);
  --overlay-stack-icon-color: rgba(33, 46, 62, 0.72);
  --overlay-stack-divider: rgba(148, 163, 184, 0.16);
  --overlay-stack-progress-track: rgba(148, 163, 184, 0.18);
  --overlay-stack-card-blur: 10px;
}

:global(html.dark) {
  --overlay-stack-card-bg: rgba(15, 23, 42, 0.9);
  --overlay-stack-card-border: rgba(148, 163, 184, 0.18);
  --overlay-stack-card-shadow: 0 24px 48px rgba(2, 8, 23, 0.42);
  --overlay-stack-card-title: #f8fafc;
  --overlay-stack-card-text: #cbd5e1;
  --overlay-stack-card-subtle: #94a3b8;
  --overlay-stack-icon-bg: rgba(15, 23, 42, 0.72);
  --overlay-stack-icon-border: rgba(120, 136, 160, 0.18);
  --overlay-stack-icon-color: #cbd5e1;
  --overlay-stack-divider: rgba(148, 163, 184, 0.2);
  --overlay-stack-progress-track: rgba(71, 85, 105, 0.42);
}

:global(html[data-skin="future-tech"]),
:global(html.theme-future-tech) {
  --overlay-stack-card-bg:
    linear-gradient(165deg, rgba(4, 10, 28, 0.97), rgba(7, 19, 43, 0.94));
  --overlay-stack-card-border: rgba(102, 248, 255, 0.2);
  --overlay-stack-card-shadow: 0 24px 52px rgba(0, 187, 255, 0.14);
  --overlay-stack-card-title: #e6f9ff;
  --overlay-stack-card-text: rgba(168, 240, 255, 0.8);
  --overlay-stack-card-subtle: rgba(148, 214, 232, 0.72);
  --overlay-stack-icon-bg: rgba(7, 21, 43, 0.76);
  --overlay-stack-icon-border: rgba(102, 248, 255, 0.18);
  --overlay-stack-icon-color: #9ae7ff;
  --overlay-stack-divider: rgba(102, 248, 255, 0.16);
  --overlay-stack-progress-track: rgba(18, 47, 84, 0.82);
  --overlay-stack-card-blur: 6px;
}

.overlay-stack-root {
  position: fixed;
  inset: 0;
  z-index: var(--overlay-stack-z-index);
  pointer-events: none;
}

.overlay-stack-group {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(var(--overlay-stack-width), calc(100vw - 28px));
  pointer-events: none;
}

.overlay-stack-group.is-top-left { top: 72px; left: 14px; }
.overlay-stack-group.is-top-center { top: 72px; left: 50%; transform: translateX(-50%); }
.overlay-stack-group.is-top-right { top: 72px; right: 14px; }
.overlay-stack-group.is-left-center { top: 50%; left: 14px; transform: translateY(-50%); }
.overlay-stack-group.is-right-center { top: 50%; right: 14px; transform: translateY(-50%); }
.overlay-stack-group.is-bottom-left { left: 14px; bottom: 18px; }
.overlay-stack-group.is-bottom-center { left: 50%; bottom: 18px; transform: translateX(-50%); }
.overlay-stack-group.is-bottom-right { right: 14px; bottom: 18px; }

.overlay-stack-card {
  position: relative;
  overflow: hidden;
  padding: 15px 15px 14px;
  border: 1px solid var(--overlay-stack-card-border);
  border-radius: 22px;
  background: var(--overlay-stack-card-bg);
  box-shadow: var(--overlay-stack-card-shadow);
  backdrop-filter: blur(var(--overlay-stack-card-blur));
  pointer-events: auto;
  text-align: left;
  contain: layout paint style;
  transition: margin 0.24s ease, opacity 0.24s ease, transform 0.24s ease, box-shadow 0.24s ease;
  --overlay-accent: #64748b;
}

.overlay-stack-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  content: "";
  background: linear-gradient(90deg, color-mix(in srgb, var(--overlay-accent) 72%, white 28%), var(--overlay-accent));
}

.overlay-stack-card:hover { box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18); }
.overlay-stack-card.is-tone-info { --overlay-accent: #0f92ff; }
.overlay-stack-card.is-tone-success { --overlay-accent: #16a34a; }
.overlay-stack-card.is-tone-warning { --overlay-accent: #d97706; }
.overlay-stack-card.is-tone-error { --overlay-accent: #dc2626; }

.overlay-stack-group.is-expanded .overlay-stack-card {
  margin-top: 0 !important;
  opacity: 1 !important;
  transform: translateZ(0) !important;
}

.overlay-stack-card-top,
.overlay-stack-card-actions,
.overlay-stack-progress,
.overlay-stack-progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.overlay-stack-card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--overlay-stack-card-title);
}

.overlay-stack-card-title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overlay-stack-card-actions {
  flex-shrink: 0;
}

.overlay-stack-card-body,
.overlay-stack-progress-block { margin-top: 10px; }

.overlay-stack-description,
.overlay-stack-detail-date,
.overlay-stack-detail-preview,
.overlay-stack-log-row,
.overlay-stack-progress-meta {
  font-size: 12px;
  color: var(--overlay-stack-card-text);
}

.overlay-stack-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--overlay-stack-icon-border);
  border-radius: 10px;
  background: var(--overlay-stack-icon-bg);
  color: var(--overlay-stack-icon-color);
}

.overlay-stack-progress-track {
  position: relative;
  overflow: hidden;
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--overlay-stack-progress-track);
}

.overlay-stack-progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--overlay-accent) 85%, white 15%), var(--overlay-accent));
}

.overlay-stack-progress-fill.is-indeterminate {
  width: 42% !important;
  animation: overlay-stack-indeterminate 1.2s ease-in-out infinite;
}

.overlay-stack-progress span { font-size: 11px; color: var(--overlay-stack-card-subtle); }
.overlay-stack-progress-meta { margin-top: 8px; }
.overlay-stack-detail { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--overlay-stack-divider); }
.overlay-stack-detail-summary,
.overlay-stack-detail-panel { display: flex; flex-direction: column; gap: 8px; }
.overlay-stack-detail-date,
.overlay-stack-log-time { color: var(--overlay-stack-card-subtle); }
.overlay-stack-detail-preview { line-height: 1.6; word-break: break-word; }
.overlay-stack-detail-preview.is-standalone { padding-top: 2px; }
.overlay-stack-log-list { display: flex; flex-direction: column; gap: 8px; }
.overlay-stack-log-row { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: 8px; align-items: start; }
.overlay-stack-log-dot { width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: rgba(100, 116, 139, 0.48); }
.overlay-stack-log-dot.is-info { background: #0f92ff; }
.overlay-stack-log-dot.is-success { background: #16a34a; }
.overlay-stack-log-dot.is-warning { background: #d97706; }
.overlay-stack-log-dot.is-error { background: #dc2626; }
.overlay-stack-log-content { line-height: 1.55; word-break: break-word; }

.overlay-stack-card-enter-active,
.overlay-stack-card-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.overlay-stack-card-enter-from,
.overlay-stack-card-leave-to { opacity: 0; transform: translateY(8px); }

@keyframes overlay-stack-indeterminate {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(260%); }
}

@media (max-width: 768px) {
  .overlay-stack-group { width: calc(100vw - 20px); }
  .overlay-stack-group.is-top-left,
  .overlay-stack-group.is-top-center,
  .overlay-stack-group.is-top-right {
    top: 64px;
    left: 10px;
    right: 10px;
    transform: none;
  }
  .overlay-stack-group.is-bottom-left,
  .overlay-stack-group.is-bottom-center,
  .overlay-stack-group.is-bottom-right,
  .overlay-stack-group.is-left-center,
  .overlay-stack-group.is-right-center {
    right: 10px;
    bottom: 10px;
    left: 10px;
    top: auto;
    transform: none;
  }
}
</style>
