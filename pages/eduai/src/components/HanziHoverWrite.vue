<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { computePopStyle, type HoverPopStyle } from "../utils/hoverPop";
import { HANZI_STROKE_BUILTIN, type HanziStrokeData } from "../data/hanziStrokes";

/**
 * HanziHoverWrite —— 汉字行悬停书写动画浮层。
 *
 * <p>Teleport 到 body 后用 fixed 定位，跟随当前行「字」单元格，
 * 避免被表格容器的 overflow 裁剪。进入后按内置笔顺自动逐笔播放。</p>
 *
 * <p>inline 模式：不走 Teleport / 固定定位，原地渲染同一套逐笔动画
 * （识字「学习卡」答完即演示复用）。控制条通用：播放 / 步进 / 重播 / 慢速档。</p>
 */
defineOptions({ name: "HanziHoverWrite" });

const emit = defineEmits<{
  (e: "controls-enter"): void;
  (e: "controls-leave"): void;
}>();

const props = withDefaults(
  defineProps<{
    visible: boolean;
    /** hover 模式的定位锚点；inline 模式不需要锚点 */
    anchor?: HTMLElement | null;
    character: string;
    /** inline 模式：不走 Teleport / 固定定位，原地渲染（宽度自适应容器） */
    inline?: boolean;
    /** 预留外部笔画数据源；返回 null 时使用内置演示，内置也没有则显示占位 */
    loadStrokeData?: (char: string) => Promise<HanziStrokeData | null>;
  }>(),
  {
    anchor: null,
    character: "",
    inline: false,
    loadStrokeData: undefined,
  },
);

const POP_WIDTH = 336;
const POP_HEIGHT = 254;
/** 逐笔播放速度档：正常 / 慢速（毫秒每笔） */
const STROKE_INTERVAL_NORMAL_MS = 600;
const STROKE_INTERVAL_SLOW_MS = 1000;
/** 速度档偏好键：跨会话记住习惯的播放速度 */
const SPEED_PREF_KEY = "eduai:hanzi-stroke-slow";

function readSpeedPref(): boolean {
  try {
    return window.localStorage.getItem(SPEED_PREF_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSpeedPref(value: boolean): void {
  try {
    if (value) {
      window.localStorage.setItem(SPEED_PREF_KEY, "1");
    } else {
      window.localStorage.removeItem(SPEED_PREF_KEY);
    }
  } catch {
    /* 记不住偏好不影响使用 */
  }
}

const rootEl = ref<HTMLDivElement | null>(null);
const data = ref<HanziStrokeData | null>(null);
const error = ref("");
const currentStroke = ref(0);
const playing = ref(false);
/** 速度档：正常 600ms/笔，慢速约 1s/笔（偏好本地留存，进入即恢复） */
const slow = ref(readSpeedPref());
let playTimer: ReturnType<typeof setInterval> | null = null;

const style = ref<HoverPopStyle>({
  top: "-9999px",
  left: "-9999px",
  width: `${POP_WIDTH}px`,
});

/** hover 模式需 visible + 锚点；inline 模式只要有字即可原地渲染 */
const shouldRender = computed(() => {
  if (!props.character) return false;
  return props.inline || (props.visible && !!props.anchor);
});

function charOf(): string {
  return (props.character || "").trim().charAt(0);
}

function reposition(): void {
  if (!props.visible || !props.anchor || !rootEl.value) return;
  const height = rootEl.value.offsetHeight || POP_HEIGHT;
  style.value = computePopStyle(props.anchor, POP_WIDTH, height);
}

function stop(): void {
  playing.value = false;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function reducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function play(): void {
  if (!data.value || playing.value) return;
  if (currentStroke.value >= data.value.strokes.length) currentStroke.value = 0;
  if (reducedMotion()) {
    currentStroke.value = data.value.strokes.length;
    return;
  }
  playing.value = true;
  playTimer = setInterval(
    () => {
      if (!data.value) {
        stop();
        return;
      }
      if (currentStroke.value >= data.value.strokes.length) {
        stop();
        return;
      }
      currentStroke.value += 1;
    },
    slow.value ? STROKE_INTERVAL_SLOW_MS : STROKE_INTERVAL_NORMAL_MS,
  );
}

/** 暂停 / 从当前笔继续（已播完再点则从头播） */
function togglePlay(): void {
  if (playing.value) {
    stop();
    return;
  }
  play();
}

/** 退回上一笔（暂停态查看） */
function stepBack(): void {
  stop();
  currentStroke.value = Math.max(0, currentStroke.value - 1);
}

/** 单步走下一笔（暂停态查看） */
function stepFwd(): void {
  if (!data.value || currentStroke.value >= data.value.strokes.length) {
    return;
  }
  stop();
  currentStroke.value += 1;
}

/** 从第 1 笔重播 */
function replay(): void {
  stop();
  currentStroke.value = 0;
  play();
}

/** 切换速度档；播放中切换则按新速度从当前笔继续，并记住偏好 */
function toggleSpeed(): void {
  slow.value = !slow.value;
  writeSpeedPref(slow.value);
  if (playing.value) {
    stop();
    play();
  }
}

const playStateText = computed(() => {
  if (!data.value) {
    return "";
  }
  if (playing.value) {
    return "自动播放";
  }
  return currentStroke.value >= data.value.strokes.length ? "已播完" : "已暂停";
});

async function load(): Promise<void> {
  const ch = charOf();
  if (!ch) return;
  stop();
  data.value = null;
  error.value = "";
  currentStroke.value = 0;
  try {
    const external = props.loadStrokeData ? await props.loadStrokeData(ch) : null;
    if (ch !== charOf()) return;
    data.value = external ?? HANZI_STROKE_BUILTIN[ch] ?? null;
    if (data.value) {
      play();
    } else {
      error.value = `尚未内置“${ch}”的笔画数据，可在数据源接入真实笔顺`;
    }
  } catch (e) {
    if (ch === charOf()) {
      error.value = `读取笔画数据失败：${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

watch(
  () => [props.visible, props.character],
  () => {
    if (props.character && (props.inline || props.visible)) {
      void load();
      void nextTick(reposition);
    } else {
      stop();
    }
  },
  { immediate: true },
);

watch(
  () => props.anchor,
  () => {
    if (props.visible) void nextTick(reposition);
  },
);

/* 内容高度变化（占位 → 笔画 SVG）后重新定位，避免贴底行用旧高度误判翻转 */
watch(
  [() => data.value, () => error.value],
  () => {
    if (props.visible) void nextTick(reposition);
  },
);

onMounted(() => {
  window.addEventListener("scroll", reposition, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", reposition, true);
  stop();
});
</script>

<template>
  <Teleport to="body" :disabled="inline">
    <div
      v-if="shouldRender"
      ref="rootEl"
      class="hhw"
      :class="{ 'hhw--inline': inline, 'hhw--slow': slow }"
      :style="inline ? undefined : style"
    >
      <div v-if="data" class="hhw__content">
        <div class="hhw__head">
          <span class="hhw__char k">{{ data.char }}</span>
          <span class="hhw__meta">{{ data.strokes.length }} 画 · {{ playStateText }}</span>
        </div>

        <!-- 卷轴笔顺：顶杆压边，纸面收窄成手卷 -->
        <div class="hhw__scroll">
          <span class="hhw__rod hhw__rod--top" aria-hidden="true" />
          <svg class="hhw__svg" viewBox="0 0 100 100" role="img" :aria-label="`${data.char}逐笔书写动画`">
            <template v-for="(stroke, idx) in data.strokes" :key="idx">
              <path
                :d="stroke.path"
                class="hhw-stroke hhw-stroke--ghost"
              />
              <path
                v-if="idx < currentStroke"
                :d="stroke.path"
                class="hhw-stroke hhw-stroke--done"
              />
            </template>
            <path
              v-if="currentStroke > 0 && currentStroke <= data.strokes.length"
              :key="currentStroke"
              :d="data.strokes[currentStroke - 1].path"
              pathLength="1"
              class="hhw-stroke hhw-stroke--writing"
            />
          </svg>
        </div>

        <!-- 控制条：浮层本体不接鼠标（保持穿透），只有这里可点 -->
        <div class="hhw__ctrl" @mouseenter="emit('controls-enter')" @mouseleave="emit('controls-leave')">
          <button type="button" class="hhw__btn" @click="togglePlay">{{ playing ? "▶ 播放" : "⏸ 暂停" }}</button>
          <button type="button" class="hhw__btn" :disabled="currentStroke <= 0" @click="stepBack">‹ 上一笔</button>
          <button type="button" class="hhw__btn" :disabled="currentStroke >= data.strokes.length" @click="stepFwd">下一笔 ›</button>
          <button type="button" class="hhw__btn" @click="replay">↻ 重播</button>
          <button type="button" class="hhw__btn hhw__btn--speed" :aria-pressed="slow" @click="toggleSpeed">{{ slow ? "⏩ 正常速" : "🐢 慢速" }}</button>
        </div>

        <div class="hhw__foot">
          <span v-if="currentStroke > 0 && currentStroke <= data.strokes.length">
            {{ data.strokes[currentStroke - 1].label }}
          </span>
          <span v-else>准备书写</span>
          <span class="hhw__count">
            {{ currentStroke === 0 ? 0 : Math.min(currentStroke, data.strokes.length) }} / {{ data.strokes.length }} 笔
          </span>
        </div>
      </div>

      <div v-else-if="error" class="hhw__empty">{{ error }}</div>
      <div v-else class="hhw__empty">加载笔顺…</div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 卷轴笔顺浮层（05 卷轴方案）：
   白卡 + 主色细边；纸面用 color-mix 把主色轻染进白底（浅色≈宣纸，深色自动收敛）；
   顶杆（卷筒）压纸面顶边；字用楷体。定位 / 播放逻辑不动。 */
.k {
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "SimSun", serif;
}

.hhw {
  position: fixed;
  z-index: 2100;
  pointer-events: none;
  box-sizing: border-box;
  padding: 12px 14px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-left: 4px solid var(--el-color-primary);
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: var(--el-box-shadow-light);
  color: var(--el-text-color-primary);
}
/* inline 模式：不定位、不悬浮，宽度随容器，恢复普通鼠标事件 */
.hhw--inline {
  position: static;
  width: 100%;
  pointer-events: auto;
  box-shadow: none;
}
.hhw__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hhw__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.hhw__char {
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  color: var(--el-text-color-primary);
}
.hhw__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
/* 手卷容器：顶杆 + 纸面 */
.hhw__scroll {
  position: relative;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 96%, var(--el-color-primary-light-5));
  overflow: hidden;
}
.hhw__rod {
  position: absolute;
  left: 12px;
  right: 12px;
  height: 4px;
  border-radius: 0 0 var(--el-radius-sm, 6px) var(--el-radius-sm, 6px);
  background: linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 72%, #000) 0%, color-mix(in srgb, var(--el-color-primary) 45%, #000) 45%, color-mix(in srgb, var(--el-color-primary) 30%, #000) 100%);
  box-shadow: 0 2px 5px color-mix(in srgb, var(--el-color-black) 18%, transparent);
  z-index: 1;
}
.hhw__rod--top {
  top: 0;
}
.hhw__svg {
  position: relative;
  width: 100%;
  height: 152px;
  display: block;
  background: transparent;
  z-index: 0;
}
.hhw-stroke {
  fill: none;
  stroke: var(--el-text-color-regular);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: opacity 0.2s, stroke 0.2s;
}
.hhw-stroke--ghost {
  opacity: 0.12;
}
.hhw-stroke--done {
  stroke: var(--el-color-info);
  opacity: 0.85;
}
.hhw-stroke--writing {
  stroke: var(--el-color-primary);
  stroke-width: 6;
  opacity: 1;
  /* pathLength=1 归一化后按笔描边：dashoffset 1→0；:key 随笔画变化重放动画 */
  stroke-dasharray: 1;
  animation: hhw-draw 0.48s ease-out both;
}
@keyframes hhw-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}
/* 慢速档：笔画描边动画同步放慢 */
.hhw--slow .hhw-stroke--writing {
  animation-duration: 0.9s;
}
/* 控制条：仅此处接收鼠标事件，浮层其余部分保持穿透 */
.hhw__ctrl {
  pointer-events: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.hhw__btn {
  padding: 3px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.hhw__btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.hhw__btn--speed[aria-pressed="true"] {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.hhw__btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.hhw__btn:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}
.hhw__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.hhw__count {
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}
.hhw__empty {
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .hhw__btn {
    transition: none;
  }
  .hhw-stroke--writing {
    animation: none;
  }
}
</style>