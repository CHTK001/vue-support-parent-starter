<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { computePopStyle, type HoverPopStyle } from "../utils/hoverPop";
import { HANZI_STROKE_BUILTIN, type HanziStrokeData } from "../data/hanziStrokes";

/**
 * HanziHoverWrite —— 汉字行悬停书写动画浮层。
 *
 * <p>Teleport 到 body 后用 fixed 定位，跟随当前行「字」单元格，
 * 避免被表格容器的 overflow 裁剪。进入后按内置笔顺自动逐笔播放。</p>
 */
defineOptions({ name: "HanziHoverWrite" });

const props = withDefaults(
  defineProps<{
    visible: boolean;
    anchor: HTMLElement | null;
    character: string;
    /** 预留外部笔画数据源；返回 null 时使用内置演示，内置也没有则显示占位 */
    loadStrokeData?: (char: string) => Promise<HanziStrokeData | null>;
  }>(),
  {
    anchor: null,
    character: "",
    loadStrokeData: undefined,
  },
);

const POP_WIDTH = 336;
const POP_HEIGHT = 254;

const rootEl = ref<HTMLDivElement | null>(null);
const data = ref<HanziStrokeData | null>(null);
const error = ref("");
const currentStroke = ref(0);
const playing = ref(false);
let playTimer: ReturnType<typeof setInterval> | null = null;

const style = ref<HoverPopStyle>({
  top: "-9999px",
  left: "-9999px",
  width: `${POP_WIDTH}px`,
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
  playTimer = setInterval(() => {
    if (!data.value) {
      stop();
      return;
    }
    if (currentStroke.value >= data.value.strokes.length) {
      stop();
      return;
    }
    currentStroke.value += 1;
  }, 600);
}

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
    if (props.visible && props.character) {
      void load();
      void nextTick(reposition);
    } else {
      stop();
    }
  },
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
  <Teleport to="body">
    <div
      v-if="visible && anchor && character"
      ref="rootEl"
      class="hhw"
      :style="style"
    >
      <div v-if="data" class="hhw__content">
        <div class="hhw__head">
          <span class="hhw__char">{{ data.char }}</span>
          <span class="hhw__meta">{{ data.strokes.length }} 画 · 自动播放</span>
        </div>

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
            :d="data.strokes[currentStroke - 1].path"
            class="hhw-stroke hhw-stroke--writing"
          />
        </svg>

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
.hhw {
  position: fixed;
  z-index: 2100;
  pointer-events: none;
  box-sizing: border-box;
  padding: 12px 14px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: var(--el-box-shadow-light);
  color: var(--el-text-color-primary);
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
.hhw__svg {
  width: 100%;
  height: 152px;
  display: block;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
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
</style>