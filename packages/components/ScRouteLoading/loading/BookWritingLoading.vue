<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

interface Props {
  /** 主标题文案 */
  loadingText?: string;
  /** 可选：自定义随机句子 */
  sentences?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  loadingText: "正在书写配置...",
  sentences: () => []
});

const displayText = ref("");
const currentIndex = ref(0);
let typingTimer: number | undefined;

const sentenceList = computed(() => {
  const custom = (props.sentences || []).map((it) => it.trim()).filter((it) => it.length > 0);
  if (custom.length > 0) {
    return custom;
  }
  return [
    "正在写入模块配置说明...",
    "正在整理接口文档草稿...",
    "正在记录本次操作日志...",
    "正在生成加载步骤笔记...",
    "正在同步最新系统参数..."
  ];
});

const penTransform = computed(() => {
  const offset = displayText.value.length * 6;
  return `translateX(${offset}px) rotate(-18deg)`;
});

function pickNextIndex(): number {
  const list = sentenceList.value;
  if (list.length <= 1) {
    return 0;
  }
  const current = currentIndex.value;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * list.length);
  }
  return next;
}

function typeLoop(): void {
  const list = sentenceList.value;
  if (list.length === 0) {
    typingTimer = window.setTimeout(typeLoop, 600);
    return;
  }
  const sentence = list[currentIndex.value];
  const nextLength = displayText.value.length + 1;
  if (nextLength <= sentence.length) {
    displayText.value = sentence.slice(0, nextLength);
    typingTimer = window.setTimeout(typeLoop, 90);
    return;
  }
  typingTimer = window.setTimeout(() => {
    currentIndex.value = pickNextIndex();
    displayText.value = "";
    typeLoop();
  }, 900);
}

onMounted(() => {
  typeLoop();
});

onBeforeUnmount(() => {
  if (typingTimer !== undefined) {
    window.clearTimeout(typingTimer);
  }
});
</script>

<template>
  <div class="cool-loading pen-book-loading">
    <div class="pen-book-wrapper">
      <div class="pen-book-card">
        <div class="pen-book-desk-shadow" />
        <div class="pen-book-desk" />
        <div class="pen-book-book">
          <div class="pen-book-page pen-book-page-left" />
          <div class="pen-book-page pen-book-page-right">
            <div class="pen-book-lines">
              <div class="pen-book-line pen-book-line-faded" />
              <div class="pen-book-line pen-book-line-active">
                <div class="pen-book-text">
                  <span class="pen-book-text-content">
                    {{ displayText }}
                  </span>
                </div>
                <div
                  class="pen-book-pen"
                  :style="{ transform: penTransform }"
                >
                  <div class="pen-body" />
                  <div class="pen-tip" />
                </div>
              </div>
              <div class="pen-book-line pen-book-line-faded" />
              <div class="pen-book-line pen-book-line-faded" />
            </div>
          </div>
          <div class="pen-book-ring pen-book-ring-top" />
          <div class="pen-book-ring pen-book-ring-bottom" />
        </div>
      </div>
      <div class="pen-book-meta">
        <div class="pen-book-title">
          {{ loadingText }}
        </div>
        <div class="pen-book-sub">正在书写加载日志，请稍候…</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pen-book-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #e5e7eb 0%, #cbd5e1 50%, #9ca3af 100%);
  color: #020617;
  padding: 16px;
}

.pen-book-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pen-book-card {
  position: relative;
  width: 260px;
  height: 140px;
  border-radius: 20px;
  background: radial-gradient(circle at top left, rgba(148, 163, 184, 0.25), transparent 60%),
    radial-gradient(circle at bottom right, rgba(209, 213, 219, 0.7), #f9fafb);
  box-shadow:
    0 20px 38px rgba(15, 23, 42, 0.22),
    0 0 0 1px rgba(148, 163, 184, 0.7);
  overflow: hidden;
  transform: rotateX(16deg) rotateZ(-5deg);
  transform-origin: center bottom;
}

.pen-book-desk {
  position: absolute;
  inset: auto 20px 12px;
  height: 26px;
  border-radius: 16px;
  background: linear-gradient(90deg, #78350f, #b45309, #92400e);
  box-shadow:
    0 -2px 0 rgba(0, 0, 0, 0.14),
    inset 0 0 0 1px rgba(0, 0, 0, 0.22);
}

.pen-book-desk-shadow {
  position: absolute;
  inset: 46px 40px auto;
  height: 20px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.28), transparent 70%);
  filter: blur(1px);
}

.pen-book-book {
  position: absolute;
  inset: 20px 32px 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 6px;
  align-items: stretch;
}

.pen-book-page {
  position: relative;
  border-radius: 10px;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 40%, #f3f4f6 100%);
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.6),
    inset 0 0 0 1px rgba(243, 244, 246, 0.9);
  overflow: hidden;
}

.pen-book-page-left::before {
  content: "";
  position: absolute;
  inset: 10px 12px;
  border-radius: 8px;
  border: 1px dashed rgba(156, 163, 175, 0.6);
}

.pen-book-page-right {
  padding: 10px 12px;
}

.pen-book-lines {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.pen-book-line {
  position: relative;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(209, 213, 219, 0.5), rgba(209, 213, 219, 0.12));
  overflow: hidden;
}

.pen-book-line-faded {
  opacity: 0.4;
}

.pen-book-line-active {
  opacity: 0.9;
  background: linear-gradient(90deg, rgba(209, 213, 219, 0.7), rgba(209, 213, 219, 0.2));
}

.pen-book-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 11px;
  color: #111827;
  white-space: nowrap;
}

.pen-book-text-content {
  letter-spacing: 0.04em;
}

.pen-book-pen {
  position: absolute;
  left: 12px;
  top: -4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  pointer-events: none;
  transform-origin: center center;
  transition: transform 0.1s ease-out;
}

.pen-body {
  width: 20px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0f172a, #1d4ed8);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.9),
    0 2px 2px rgba(15, 23, 42, 0.4);
}

.pen-tip {
  width: 6px;
  height: 6px;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(135deg, #f97316, #ea580c);
  box-shadow: 0 0 0 1px rgba(124, 45, 18, 0.9);
}

.pen-book-ring {
  position: absolute;
  left: 50%;
  width: 18px;
  height: 10px;
  margin-left: -9px;
  border-radius: 999px;
  background: linear-gradient(180deg, #d1d5db, #9ca3af);
  box-shadow:
    0 0 0 1px rgba(107, 114, 128, 0.9),
    inset 0 0 0 1px rgba(243, 244, 246, 0.8);
}

.pen-book-ring-top {
  top: 18px;
}

.pen-book-ring-bottom {
  bottom: 46px;
}

.pen-book-meta {
  text-align: center;
}

.pen-book-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #111827;
}

.pen-book-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}
</style>


