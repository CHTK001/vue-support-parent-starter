<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";

/** 单笔演示数据：path 均为 100x100 坐标系，第一组坐标即起点 */
interface HanziStrokeMeta {
  label: string;
  path: string;
}

interface HanziStrokeData {
  char: string;
  strokes: HanziStrokeMeta[];
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    character: string;
    /** 预留外部笔画数据源；返回 null 时使用内置演示，内置也没有则显示占位 */
    loadStrokeData?: (char: string) => Promise<HanziStrokeData | null>;
  }>(),
  {
    character: "",
    loadStrokeData: undefined,
  },
);

const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const BUILTIN: Record<string, HanziStrokeData> = {
  永: {
    char: "永",
    strokes: [
      { label: "点", path: "M52 18 C56 16 61 18 62 21 C63 25 58 29 52 32 C48 34 44 34 43 32" },
      { label: "横折钩", path: "M34 43 L78 43 L78 58 L68 72 L46 67" },
      { label: "横撇", path: "M35 40 L50 64 L50 80 L46 84 L42 80" },
      { label: "竖钩", path: "M50 40 L50 88 L47 91" },
      { label: "提", path: "M28 62 L43 52" },
      { label: "撇", path: "M61 49 L74 64 L69 70" },
      { label: "短撇", path: "M64 73 L79 66" },
      { label: "捺", path: "M57 72 L78 87 L80 89" },
    ],
  },
  汉: {
    char: "汉",
    strokes: [
      { label: "点", path: "M39 18 C44 15 52 17 53 23 C54 28 49 31 42 33" },
      { label: "点", path: "M59 22 L66 28" },
      { label: "提", path: "M54 38 L69 43" },
      { label: "横撇", path: "M46 37 L45 56 L62 60" },
      { label: "捺", path: "M54 64 L75 88 L78 91" },
      { label: "竖提", path: "M62 40 L62 78 L58 82" },
      { label: "撇", path: "M67 41 L80 57" },
      { label: "点", path: "M70 66 L75 76" },
    ],
  },
  字: {
    char: "字",
    strokes: [
      { label: "点", path: "M47 15 C52 13 58 16 58 21 C58 25 53 28 47 30" },
      { label: "点", path: "M62 18 L69 24" },
      { label: "横钩", path: "M36 25 L75 25 L75 35 L65 40" },
      { label: "横撇", path: "M37 39 L52 58 L58 63" },
      { label: "横撇", path: "M60 43 L72 59 L78 63" },
      { label: "竖钩", path: "M42 62 L42 89 L38 92" },
      { label: "横", path: "M26 65 L64 65" },
      { label: "横", path: "M27 80 L64 80" },
    ],
  },
  中: {
    char: "中",
    strokes: [
      { label: "竖", path: "M49 14 L49 88 L45 91" },
      { label: "横折", path: "M31 24 L70 24 L70 70 L31 70" },
      { label: "横", path: "M31 50 L70 50" },
      { label: "横", path: "M25 83 L75 83" },
    ],
  },
  国: {
    char: "国",
    strokes: [
      { label: "竖", path: "M37 12 L37 88 L34 91" },
      { label: "横折", path: "M37 20 L72 20 L72 84 L37 84" },
      { label: "横", path: "M43 34 L67 34 L67 70 L43 70" },
      { label: "横", path: "M47 43 L63 43 L63 61 L47 61" },
      { label: "横", path: "M33 93 L78 93" },
    ],
  },
};

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const data = ref<HanziStrokeData | null>(null);
const error = ref("");
const loading = ref(false);
const activeTab = ref<"split" | "animate">("split");
const currentStroke = ref(0);
const playing = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function charOf(): string {
  return (props.character || "").trim().charAt(0);
}

async function load(): Promise<void> {
  const ch = charOf();
  if (!ch) return;
  loading.value = true;
  error.value = "";
  data.value = null;
  currentStroke.value = 0;
  stop();
  try {
    const external = props.loadStrokeData ? await props.loadStrokeData(ch) : null;
    const builtin = BUILTIN[ch] ?? null;
    data.value = external ?? builtin;
    if (!data.value) {
      error.value = `尚未内置“${ch}”的笔画数据，可接入 strokeDataProvider / loadStrokeData 提供真实笔顺`;
    }
  } catch (e) {
    error.value = `读取笔画数据失败：${e instanceof Error ? e.message : String(e)}`;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) void load();
  },
  { immediate: true },
);

function startPoint(path: string): { x: number; y: number } {
  const m = path.match(/[MmLl]\s*([-\d.]+)[,\s]+([-\d.]+)/);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 10, y: 10 };
}

function play(): void {
  if (!data.value || playing.value) return;
  if (currentStroke.value >= data.value.strokes.length) currentStroke.value = 0;
  playing.value = true;
  timer = setInterval(() => {
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

function stop(): void {
  playing.value = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function togglePlay(): void {
  if (playing.value) stop();
  else play();
}

function reset(): void {
  stop();
  currentStroke.value = 0;
}

onBeforeUnmount(stop);
</script>

<template>
  <ReDialog
    :model-value="visible"
    title="汉字笔顺 · 按顺序笔画"
    width="560px"
    top="8vh"
    footer-hidden
    @update:model-value="visible = $event"
  >
    <div v-loading="loading" class="hs">
      <template v-if="data">
        <div class="hs__head">
          <span class="hs__char">{{ data.char }}</span>
          <span class="hs__meta">{{ data.strokes.length }} 画 · 按书写顺序</span>
        </div>

        <div class="hs__tabs">
          <button
            type="button"
            class="hs__tab"
            :class="{ 'is-active': activeTab === 'split' }"
            @click="activeTab = 'split'"
          >
            按顺序分解
          </button>
          <button
            type="button"
            class="hs__tab"
            :class="{ 'is-active': activeTab === 'animate' }"
            @click="activeTab = 'animate'"
          >
            逐笔动画
          </button>
        </div>

        <template v-if="activeTab === 'split'">
          <svg class="hs__svg" viewBox="0 0 100 100" role="img" aria-label="按笔画顺序分解">
            <template v-for="(stroke, idx) in data.strokes" :key="idx">
              <path
                :d="stroke.path"
                class="hs-stroke"
                :class="{ 'is-muted': idx !== currentStroke }"
              />
              <text class="hs__num" :x="Math.min(96, Math.max(1, startPoint(stroke.path).x + 1))" :y="Math.max(9, startPoint(stroke.path).y - 2)">
                {{ idx + 1 }}
              </text>
              <circle class="hs__dot" :cx="startPoint(stroke.path).x" :cy="startPoint(stroke.path).y" r="1.8" />
            </template>
          </svg>
          <div class="hs__steps">
            <button
              v-for="(stroke, idx) in data.strokes"
              :key="idx"
              type="button"
              class="hs__step"
              :class="{ 'is-active': idx === currentStroke }"
              @click="currentStroke = idx"
            >
              {{ idx + 1 }}. {{ stroke.label }}
            </button>
          </div>
        </template>

        <template v-else>
          <svg class="hs__svg" viewBox="0 0 100 100" role="img" aria-label="逐笔书写动画">
            <template v-for="(stroke, idx) in data.strokes" :key="idx">
              <path
                :d="stroke.path"
                class="hs-stroke hs-stroke--ghost"
              />
              <path
                v-if="idx < currentStroke"
                :d="stroke.path"
                class="hs-stroke hs-stroke--done"
              />
            </template>
            <path
              v-if="currentStroke > 0"
              :d="data.strokes[currentStroke - 1].path"
              class="hs-stroke hs-stroke--writing"
            />
          </svg>
          <div class="hs__controls">
            <ReButton :icon="playing ? 'VideoPause' : 'VideoPlay'" @click="togglePlay">
              {{ playing ? "暂停" : "播放" }}
            </ReButton>
            <ReButton icon="RefreshLeft" @click="reset">重播</ReButton>
          </div>
          <div class="hs__meta">第 {{ currentStroke }} / {{ data.strokes.length }} 笔</div>
        </template>
      </template>

      <div v-else-if="error" class="hs__empty">{{ error }}</div>
    </div>
  </ReDialog>
</template>

<style scoped>
.hs {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hs__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.hs__char {
  font-size: 44px;
  line-height: 1;
  color: var(--el-text-color-primary);
}
.hs__meta {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.hs__tabs {
  display: flex;
  gap: 8px;
}
.hs__tab {
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  border-radius: var(--el-radius-sm, 6px);
  padding: 5px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.hs__tab.is-active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.hs__svg {
  width: 100%;
  height: 300px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
}
.hs-stroke {
  fill: none;
  stroke: #aab3c0;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: opacity 0.2s, stroke 0.2s;
}
.hs-stroke.is-muted {
  opacity: 0.28;
}
.hs-stroke--ghost {
  opacity: 0.12;
}
.hs-stroke--done {
  stroke: var(--el-color-info);
  opacity: 0.85;
}
.hs-stroke--writing {
  stroke: var(--el-color-primary);
  stroke-width: 6;
  opacity: 1;
}
.hs__num {
  fill: var(--el-color-primary);
  font-size: 8px;
  font-weight: 700;
  pointer-events: none;
}
.hs__dot {
  fill: #f53f3f;
}
.hs__steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hs__step {
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  border-radius: var(--el-radius-sm, 6px);
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}
.hs__step.is-active {
  color: #fff;
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.hs__controls {
  display: flex;
  gap: 8px;
}
.hs__empty {
  color: var(--el-text-color-secondary);
  padding: 24px 0;
}
</style>