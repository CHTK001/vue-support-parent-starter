<template>
  <component :is="tag" ref="root" class="re-typeit">
    <span v-if="!html">
      <span>{{ displayed }}</span>
      <span v-if="cursor && status !== 'done'" class="re-typeit__cursor" :style="cursorStyle">
        {{ cursorChar }}
      </span>
    </span>
    <template v-else>
      <span v-html="displayedHtml" />
      <span v-if="cursor && status !== 'done'" class="re-typeit__cursor" :style="cursorStyle" v-html="cursorChar" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ReTypeIt —— 打字机效果组件
 *
 * 自实现，无依赖。支持逐字/逐词打印、循环、删除、回调
 *   <ReTypeIt :strings="['Hello', 'World']" :loop="true" />
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

interface Props {
  /** 字符串列表（按顺序播放） */
  strings?: string[];
  /** 单一字符串 */
  text?: string;
  /** 打字速度（ms） */
  speed?: number;
  /** 删除速度（ms） */
  deleteSpeed?: number;
  /** 暂停时间（ms） */
  pause?: number;
  /** 是否循环 */
  loop?: boolean;
  /** HTML 模式 */
  html?: boolean;
  /** 自定义根标签 */
  tag?: string;
  /** 光标字符 */
  cursorChar?: string;
  /** 是否显示光标 */
  cursor?: boolean;
  /** 是否自动开始 */
  autoplay?: boolean;
  /** 启动延迟（ms） */
  startDelay?: number;
  /** 起始字符串索引 */
  startIndex?: number;
  /** 是否打字前先删除 */
  preDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  strings: () => [],
  speed: 80,
  deleteSpeed: 50,
  pause: 1500,
  loop: false,
  html: false,
  tag: "span",
  cursorChar: "|",
  cursor: true,
  autoplay: true,
  startDelay: 0,
  startIndex: 0,
  preDelete: false,
});

const emit = defineEmits<{
  (e: "start"): void;
  (e: "typed", char: string, index: number): void;
  (e: "completed"): void;
  (e: "loop"): void;
}>();

const root = ref<HTMLElement | null>(null);
const displayed = ref("");
const displayedHtml = ref("");
const status = ref<"idle" | "typing" | "pausing" | "deleting" | "done">("idle");

let timer: number | null = null;
let started = false;
let currentStringIndex = 0;
let currentCharIndex = 0;

const queue = computed<string[]>(() => {
  return props.text ? [props.text] : props.strings;
});

const cursorStyle = computed(() => ({
  animation: "re-typeit-blink 1s step-start infinite",
}));

const clearTimer = () => {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
};

const schedule = (cb: () => void, delay: number) => {
  clearTimer();
  timer = window.setTimeout(cb, delay);
};

const updateDisplay = (str: string) => {
  if (props.html) {
    displayedHtml.value = str;
  } else {
    displayed.value = str;
  }
};

const typeNextChar = () => {
  const current = queue.value[currentStringIndex];
  if (!current) {
    finishOrLoop();
    return;
  }

  if (currentCharIndex < current.length) {
    const ch = current[currentCharIndex];
    const next = (props.html ? displayedHtml.value : displayed.value) + ch;
    updateDisplay(next);
    currentCharIndex++;
    emit("typed", ch, currentCharIndex);
    schedule(typeNextChar, props.speed);
  } else {
    if (status.value === "idle") emit("start");
    status.value = "pausing";
    schedule(() => {
      if (props.preDelete) {
        startDelete();
      } else {
        nextString();
      }
    }, props.pause);
  }
};

const startDelete = () => {
  status.value = "deleting";
  const deleteStep = () => {
    const current = props.html ? displayedHtml.value : displayed.value;
    if (current.length > 0) {
      updateDisplay(current.slice(0, -1));
      schedule(deleteStep, props.deleteSpeed);
    } else {
      nextString();
    }
  };
  schedule(deleteStep, props.deleteSpeed);
};

const nextString = () => {
  currentStringIndex++;
  if (currentStringIndex >= queue.value.length) {
    if (props.loop) {
      currentStringIndex = 0;
      currentCharIndex = 0;
      emit("loop");
      schedule(typeNextChar, props.speed);
    } else {
      status.value = "done";
      emit("completed");
    }
  } else {
    currentCharIndex = 0;
    schedule(typeNextChar, props.speed);
  }
};

const finishOrLoop = () => {
  if (props.loop) {
    currentStringIndex = 0;
    currentCharIndex = 0;
    emit("loop");
    schedule(typeNextChar, props.speed);
  } else {
    status.value = "done";
    emit("completed");
  }
};

const start = () => {
  if (started) return;
  started = true;
  currentStringIndex = props.startIndex;
  currentCharIndex = 0;
  status.value = "typing";
  updateDisplay("");
  schedule(typeNextChar, props.startDelay);
};

const stop = () => {
  clearTimer();
  started = false;
  status.value = "done";
};

watch(
  () => [props.text, props.strings],
  () => {
    stop();
    if (props.autoplay) start();
  },
  { deep: true },
);

onMounted(() => {
  if (props.autoplay) start();
});

onBeforeUnmount(() => {
  clearTimer();
});

defineExpose({ start, stop });
</script>

<style scoped>
.re-typeit {
  display: inline-block;
  white-space: pre-wrap;
}

.re-typeit__cursor {
  display: inline-block;
  margin-left: 2px;
  font-weight: 400;
  color: var(--el-color-primary);
}

@keyframes re-typeit-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
