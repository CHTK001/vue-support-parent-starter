<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";

const { $storage } = useGlobal<GlobalPropertiesApi>();

const isDevEnv = import.meta.env.DEV || import.meta.env.MODE === "development";

const devLiteTools = computed<boolean>(
  () => !!$storage?.configure?.devLiteTools,
);
const devRuler = computed<boolean>(() => !!$storage?.configure?.devRuler);
const devGrid = computed<boolean>(() => !!$storage?.configure?.devGrid);
const devHoverInspector = computed<boolean>(
  () => !!$storage?.configure?.devHoverInspector,
);

const enabled = computed<boolean>(
  () => isDevEnv && devLiteTools.value,
);

const hoverVisible = ref(false);
// tooltip 位置（边界检测后的最终坐标）
const tooltipX = ref(0);
const tooltipY = ref(0);
// tooltip 对齐方向（用于 transform 调整）
const tooltipAlignX = ref<"center" | "left" | "right">("center");
const tooltipAlignY = ref<"top" | "bottom">("top");
// DOM 高亮框位置和尺寸
const highlightRect = ref({ left: 0, top: 0, width: 0, height: 0 });
const hoverTag = ref("");
const hoverClass = ref("");
const hoverSize = ref("");

// tooltip 估算尺寸（用于边界检测）
const TOOLTIP_W = 220;
const TOOLTIP_H = 48;

let hoverHandler: ((e: MouseEvent) => void) | null = null;

/** 计算 tooltip 位置，防止溢出屏幕 */
function calcTooltipPos(rect: DOMRect): void {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 默认：居中显示在元素上方
  let x = rect.left + rect.width / 2;
  let y = rect.top - 8;
  let alignX: "center" | "left" | "right" = "center";
  let alignY: "top" | "bottom" = "top";

  // 上方空间不足时改为显示在下方
  if (rect.top - TOOLTIP_H - 8 < 0) {
    y = rect.bottom + 8;
    alignY = "bottom";
  }

  // 右侧溢出：改为左对齐
  if (x + TOOLTIP_W / 2 > vw) {
    x = Math.min(rect.right, vw - 8);
    alignX = "right";
  }
  // 左侧溢出：改为右对齐
  else if (x - TOOLTIP_W / 2 < 0) {
    x = Math.max(rect.left, 8);
    alignX = "left";
  }

  tooltipX.value = x;
  tooltipY.value = y;
  tooltipAlignX.value = alignX;
  tooltipAlignY.value = alignY;
}

function attachHoverListener(): void {
  if (hoverHandler || !enabled.value || !devHoverInspector.value) {
    return;
  }
  hoverHandler = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || !(target instanceof HTMLElement)) {
      hoverVisible.value = false;
      return;
    }
    const rect = target.getBoundingClientRect();
    // 更新高亮框
    highlightRect.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    hoverTag.value = target.tagName.toLowerCase();
    hoverClass.value = target.className.toString();
    hoverSize.value = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    calcTooltipPos(rect);
    hoverVisible.value = true;
  };
  window.addEventListener("mousemove", hoverHandler, { capture: true });
}

function detachHoverListener(): void {
  if (hoverHandler) {
    window.removeEventListener("mousemove", hoverHandler, { capture: true });
    hoverHandler = null;
  }
  hoverVisible.value = false;
}

watch(
  () => (enabled.value && devHoverInspector.value) as boolean,
  (active) => {
    if (active) {
      attachHoverListener();
    } else {
      detachHoverListener();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (enabled.value && devHoverInspector.value) {
    attachHoverListener();
  }
});

onBeforeUnmount(() => {
  detachHoverListener();
});
</script>

<template>
  <div v-if="enabled" class="lite-dev-overlay" aria-hidden="true">
    <!-- 顶部/侧边标尺 -->
    <div v-if="devRuler" class="lite-dev-ruler lite-dev-ruler-top" />
    <div v-if="devRuler" class="lite-dev-ruler lite-dev-ruler-left" />

    <!-- 网格覆盖层 -->
    <div v-if="devGrid" class="lite-dev-grid" />

    <!-- 悬停元素信息 + DOM 高亮框 -->
    <template v-if="devHoverInspector && hoverVisible">
      <!-- 高亮框：跟随被悬停元素的 bounding rect -->
      <div
        class="lite-dev-highlight"
        :style="{
          left: `${highlightRect.left}px`,
          top: `${highlightRect.top}px`,
          width: `${highlightRect.width}px`,
          height: `${highlightRect.height}px`,
        }"
      />
      <!-- tooltip：带边界检测的位置 -->
      <div
        class="lite-dev-hover-info"
        :class="[`align-x-${tooltipAlignX}`, `align-y-${tooltipAlignY}`]"
        :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
      >
        <div class="lite-dev-hover-tag">
          {{ hoverTag }}
          <span v-if="hoverClass" class="lite-dev-hover-class">
            .{{ hoverClass }}
          </span>
        </div>
        <div class="lite-dev-hover-size">
          {{ hoverSize }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.lite-dev-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.lite-dev-ruler {
  position: absolute;
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px
    ),
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px
    );
  background-size: 10px 1px, 1px 10px;
  background-color: rgba(15, 23, 42, 0.75);
  color: rgba(248, 250, 252, 0.8);
  font-size: 10px;
}

.lite-dev-ruler-top {
  top: 0;
  left: 0;
  right: 0;
  height: 18px;
}

.lite-dev-ruler-left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 18px;
}

.lite-dev-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      to right,
      rgba(56, 189, 248, 0.18) 1px,
      transparent 1px
    ),
    linear-gradient(
      to bottom,
      rgba(56, 189, 248, 0.18) 1px,
      transparent 1px
    );
  background-size: 40px 40px;
  mix-blend-mode: screen;
  opacity: 0.75;
}

.lite-dev-hover-info {
  position: fixed;
  transform: translate(-50%, -100%);
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.94);
  color: #e5e7eb;
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.6),
    0 0 0 1px rgba(148, 163, 184, 0.4);

  // 水平对齐变体
  &.align-x-left {
    transform: translate(0, -100%);
  }
  &.align-x-right {
    transform: translate(-100%, -100%);
  }

  // 垂直对齐变体（显示在元素下方时）
  &.align-y-bottom {
    transform: translate(-50%, 0);
    &.align-x-left { transform: translate(0, 0); }
    &.align-x-right { transform: translate(-100%, 0); }
  }
}

// DOM 高亮框
.lite-dev-highlight {
  position: fixed;
  outline: 2px solid rgba(99, 179, 237, 0.9);
  outline-offset: 1px;
  background: rgba(99, 179, 237, 0.08);
  border-radius: 2px;
  pointer-events: none;
}

.lite-dev-hover-tag {
  font-weight: 600;
}

.lite-dev-hover-class {
  margin-left: 4px;
  color: #a5b4fc;
}

.lite-dev-hover-size {
  margin-top: 2px;
  color: #94a3b8;
}
</style>


