<script setup lang="ts">
/**
 * 画板空间（P2P 白板）
 *
 * <p>本地笔触通过 {@code store.signal} 下发给对端，信封为
 * {@code {event: "canvas", data: {color lineWidth tool points time}}}；对端回传
 * 的数据由 {@code store.appendCanvasStroke} 收进
 * {@code store.canvasStrokes}，本机 {@code canvas} 描出全部线条（含本地与同
 * 端画入的线）。当前是实线画板壳，不依赖网页画板 SDK。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoomStore } from "../stores/room";
import type { CanvasFrame } from "../types/room";

const store = useRoomStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const drawing = ref(false);
const localStrokes = ref<CanvasFrame[]>([]);

/** 对端画入的线（来自 store） */
const peerStrokes = computed(() => store.canvasStrokes);

/** 画笔工具 */
const tool = ref<"pen" | "eraser">("pen");

/** 画笔颜色 */
const color = ref("#409eff");

/** 笔宽 */
const lineWidth = ref(2);

/** 当前画笔颜色 */
const penColor = computed(() => (tool.value === "eraser" ? "#ffffff" : color.value));

/** 当前画笔宽度 */
const penWidth = computed(() => (tool.value === "eraser" ? lineWidth.value * 2 : lineWidth.value));

/** 坐标（画布元素内） */
function canvasPoint(event: PointerEvent): { x: number; y: number } {
  const el = canvasRef.value;
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/** 把一条线描到画布上 */
function strokeOn(ctx: CanvasRenderingContext2D, s: CanvasFrame): void {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (s.points.length < 1) return;
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) {
    ctx.lineTo(s.points[i].x, s.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

/** 重绘全部可描出的线 */
function paintAll(): void {
  const el = canvasRef.value;
  if (!el) return;
  const ctx = el.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, el.width, el.height);
  localStrokes.value.forEach((s) => strokeOn(ctx, s));
  peerStrokes.value.forEach((s) => strokeOn(ctx, s));
}

/** 落笔延线完毕，把整条线发给对端并立即描出 */
function paintStroke(stroke: CanvasFrame): void {
  const el = canvasRef.value;
  if (el) {
    localStrokes.value[localStrokes.value.length - 1] = stroke;
    paintAll();
  }
  if (!store.connected || !store.roomId) return;
  store.signal(JSON.stringify({ event: "canvas", data: JSON.stringify(stroke) }));
}

/** 落笔 */
function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return;
  const { x, y } = canvasPoint(event);
  drawing.value = true;
  localStrokes.value.push({
    color: penColor.value,
    lineWidth: penWidth.value,
    tool: tool.value,
    points: [{ x, y }],
    time: Date.now(),
  });
}

/** 延线 */
function onPointerMove(event: PointerEvent): void {
  if (!drawing.value) return;
  const { x, y } = canvasPoint(event);
  const last = localStrokes.value[localStrokes.value.length - 1];
  if (!last) return;
  paintStroke({ ...last, points: [...last.points, { x, y }], time: Date.now() });
}

/** 收笔 */
function onPointerUp(): void {
  drawing.value = false;
}

/** 清空本地画笔 */
function clearLocal(): void {
  localStrokes.value = [];
  paintAll();
}

/** 把画布撑到面板尺寸（onMounted 里调度） */
let resize: () => void = () => {};

onMounted(() => {
  const el = canvasRef.value;
  if (!el) return;
  resize = (): void => {
    el.width = el.clientWidth;
    el.height = el.clientHeight;
    paintAll();
  };
  resize();
  window.addEventListener("resize", resize);
});

/** 房间换号时清本地笔触（进房/退房后重绘） */
watch(
  () => store.roomId,
  () => {
    localStrokes.value = [];
    paintAll();
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-head">
        <ReIcon name="Brush" :size="14" />
        <b>画板</b>
        <span class="rm-spacer" />
        <button
          type="button"
          class="rm-btn rm-btn--sm"
          :class="{ on: tool === 'pen' }"
          @click="tool = 'pen'"
        >
          画笔
        </button>
        <button
          type="button"
          class="rm-btn rm-btn--sm"
          :class="{ on: tool === 'eraser' }"
          @click="tool = 'eraser'"
        >
          橡皮
        </button>
        <label class="rm-btn rm-btn--sm">
          颜色
          <input type="color" v-model="color" class="rm-canvas__input" />
        </label>
        <label class="rm-btn rm-btn--sm">
          宽度
          <input type="range" v-model="lineWidth" class="rm-canvas__input" min="1" max="8" />
        </label>
        <button type="button" class="rm-btn rm-btn--danger rm-btn--sm" @click="clearLocal">
          清空
        </button>
      </div>

      <div class="rm-pane-body rm-pane-body--flush">
        <div v-if="!store.connected" class="rm-empty">
          <b>未连接</b>
          <span>加入房间后，画笔才发给对端</span>
        </div>
        <canvas
          v-else
          ref="canvasRef"
          class="rm-canvas"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @pointerleave="onPointerUp"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
}
.rm-canvas__input {
  display: block;
  width: 22px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
}
.rm-canvas__input[type="range"] {
  width: 40px;
  height: 10px;
  vertical-align: middle;
}
</style>
