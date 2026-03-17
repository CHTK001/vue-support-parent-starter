<template>
  <Teleport to="body">
    <div
      v-if="enabled"
      ref="el"
      class="heatmap-panel"
      :style="style"
      aria-hidden="true"
    >
      <div ref="handle" class="heatmap-panel__drag">
        <IconifyIconOnline icon="ri:drag-move-line" />
        <span>热点工具</span>
      </div>
      <div class="heatmap-panel__actions">
        <button
          class="heatmap-btn"
          :class="{ active: heatmapVisible }"
          :title="heatmapVisible ? '隐藏热力图' : '展示热力图'"
          @click="heatmapVisible = !heatmapVisible"
          @mousedown.stop
        >
          <IconifyIconOnline icon="ri:fire-line" />
        </button>
        <button class="heatmap-btn" title="清除数据" @click="clearHeatmap" @mousedown.stop>
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </button>
      </div>
    </div>
    <canvas
      v-if="enabled && heatmapVisible"
      ref="canvasRef"
      class="heatmap-canvas"
      aria-hidden="true"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { useDraggable, useWindowSize } from "@vueuse/core";

const { $storage } = useGlobal<GlobalPropertiesApi>();

const isDevEnv =
  import.meta.env.DEV ||
  import.meta.env.MODE === "development" ||
  import.meta.env.MODE === "test";

const devHeatmap = computed<boolean>(() => !!$storage?.configure?.devHeatmap);
const enabled = computed<boolean>(() => isDevEnv && devHeatmap.value);
const heatmapVisible = ref(false);

const el = ref<HTMLElement | null>(null);
const handle = ref<HTMLElement | null>(null);
const { width: windowWidth } = useWindowSize();

/** useDraggable：Teleport 到 body 后 position:fixed 定位基准正确，style 直接绑定 */
const { style } = useDraggable(el, {
  handle,
  initialValue: () => ({ x: (windowWidth.value - 180) / 2, y: 16 }),
  preventDefault: true,
  stopPropagation: true,
});

interface ClickPoint { x: number; y: number; count: number; }

const clickPoints = ref<ClickPoint[]>([]);
const MERGE_RADIUS = 20;
const RADIUS = 60;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const maxCount = computed(() => Math.max(...clickPoints.value.map((p) => p.count), 1));

function renderHeatmap() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of clickPoints.value) {
    const intensity = p.count / maxCount.value;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIUS);
    grad.addColorStop(0, `rgba(255,0,0,${intensity * 0.8})`);
    grad.addColorStop(0.4, `rgba(255,165,0,${intensity * 0.5})`);
    grad.addColorStop(0.7, `rgba(0,255,0,${intensity * 0.3})`);
    grad.addColorStop(1, "rgba(0,0,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

function clearHeatmap() {
  clickPoints.value = [];
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

let clickHandler: ((e: MouseEvent) => void) | null = null;

function attachClickListener() {
  if (clickHandler) return;
  clickHandler = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".heatmap-panel")) return;
    const existing = clickPoints.value.find(
      (p) => Math.hypot(p.x - e.clientX, p.y - e.clientY) < MERGE_RADIUS,
    );
    existing
      ? existing.count++
      : clickPoints.value.push({ x: e.clientX, y: e.clientY, count: 1 });
    renderHeatmap();
  };
  window.addEventListener("click", clickHandler, { capture: true });
}

function detachClickListener() {
  if (clickHandler) {
    window.removeEventListener("click", clickHandler, { capture: true });
    clickHandler = null;
  }
}

watch(heatmapVisible, (active) => {
  active ? attachClickListener() : detachClickListener();
  if (!active) clearHeatmap();
});

watch(enabled, (active) => {
  if (!active) {
    heatmapVisible.value = false;
    detachClickListener();
  }
});

onBeforeUnmount(() => detachClickListener());
</script>

<style scoped lang="scss">
.heatmap-panel {
  position: fixed;
  z-index: 9997;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #e5e7eb;
  font-size: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  user-select: none;
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}

.heatmap-panel__drag {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: move;
  padding-right: 6px;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  touch-action: none;

  /* 避免内部文字选中干扰拖拽，但 handle 本身需要接收 mousedown */
  span, iconify-icon, svg {
    pointer-events: none;
  }
}

.heatmap-panel__actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
}

.heatmap-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: #e5e7eb;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.1); }

  &.active {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }
}

.heatmap-canvas {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  width: 100vw;
  height: 100vh;
}
</style>
