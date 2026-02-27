<script setup lang="ts">
interface Props {
  /** 加载文案 */
  loadingText?: string;
}

withDefaults(defineProps<Props>(), {
  loadingText: "正在翻页加载中..."
});

// 生成足够多的页面，实现无缝连续翻页效果
// 页面数量足够多，让循环周期足够长，用户感知不到循环
const pageCount = 20;
const pages = Array.from({ length: pageCount }, (_, i) => i);
</script>

<template>
  <div class="cool-loading book-loading">
    <div class="book-wrapper">
      <div class="book-card">
        <div class="desk-shadow" />
        <div class="desk" />
        <div class="book-shell">
          <div class="book-cover book-cover-left" />
          <div class="book-spine" />
          <div class="book-cover book-cover-right" />
          <div class="book">
            <div class="page page-stack-left" />
            <div class="page page-stack-right" />
            <div
              v-for="(page, index) in pages"
              :key="page"
              class="page page-flip"
              :class="`page-flip-${index}`"
              :style="{ animationDelay: `${index * 0.5}s` }"
            />
          </div>
          <div class="bookmark" />
        </div>
      </div>
      <div class="meta">
        <div class="title">
          {{ loadingText }}
        </div>
        <div class="sub">正在翻页加载，请稍候…</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle at 30% 20%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(229, 231, 235, 0.8) 30%,
    rgba(203, 213, 225, 0.6) 60%,
    rgba(156, 163, 175, 0.4) 100%
  );
  color: #020617;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.book-loading::before {
  content: "";
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.book-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.book-card {
  position: relative;
  width: 280px;
  height: 160px;
  border-radius: 24px;
  background: 
    radial-gradient(circle at top left, rgba(148, 163, 184, 0.25), transparent 60%),
    radial-gradient(circle at bottom right, rgba(209, 213, 219, 0.6), #f9fafb),
    linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.98) 100%);
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.25),
    0 8px 16px rgba(15, 23, 42, 0.15),
    0 0 0 1px rgba(148, 163, 184, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  overflow: hidden;
  transform: rotateX(16deg) rotateZ(-5deg);
  transform-origin: center bottom;
  transition: transform 0.3s ease;
}

.book-card:hover {
  transform: rotateX(14deg) rotateZ(-4deg) scale(1.02);
}

.desk {
  position: absolute;
  inset: auto 18px 12px;
  height: 26px;
  border-radius: 14px;
  background: linear-gradient(90deg, #78350f, #b45309, #92400e);
  box-shadow:
    0 -2px 0 rgba(0, 0, 0, 0.15),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25);
  opacity: 0.98;
}

.desk-shadow {
  position: absolute;
  inset: 46px 34px auto;
  height: 20px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.24), transparent 70%);
  filter: blur(1px);
}

.book-shell {
  position: absolute;
  inset: 18px 40px 32px;
  display: grid;
  grid-template-columns: auto 8px auto 1fr;
  align-items: stretch;
  column-gap: 4px;
  perspective: 1000px;
}

.book-cover {
  border-radius: 8px;
  background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.7),
    inset 0 0 0 1px rgba(191, 219, 254, 0.35);
}

.book-cover-left {
  transform: translateX(-2px);
}

.book-cover-right {
  transform: translateX(2px);
}

.book-spine {
  width: 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, #e5e7eb 0%, #cbd5f5 48%, #e5e7eb 100%);
  box-shadow:
    inset 2px 0 0 rgba(148, 163, 184, 0.5),
    inset -2px 0 0 rgba(156, 163, 175, 0.8);
}

.book {
  position: relative;
  border-radius: 12px;
  background: 
    linear-gradient(135deg, #f9fafb 0%, #e5e7eb 40%, #f3f4f6 100%),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(148, 163, 184, 0.05) 2px,
      rgba(148, 163, 184, 0.05) 4px
    );
  overflow: hidden;
  transform-style: preserve-3d;
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.1),
    0 0 0 1px rgba(148, 163, 184, 0.6),
    inset 0 0 0 1px rgba(243, 244, 246, 0.95),
    inset 0 1px 2px rgba(255, 255, 255, 0.8);
}

.page {
  position: absolute;
  inset: 10px 10px;
  width: 50%;
  background:
    repeating-linear-gradient(
      to bottom,
      #e5e7eb,
      #e5e7eb 1px,
      #f9fafb 1px,
      #f9fafb 5px
    ),
    linear-gradient(
      to right,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 20%
    );
}

.page::before {
  content: "";
  position: absolute;
  inset: 12px 8px;
  background-image: 
    /* 文字行 */
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 3px,
      rgba(107, 114, 128, 0.15) 3px,
      rgba(107, 114, 128, 0.15) 4px,
      transparent 4px,
      transparent 7px
    ),
    /* 段落间距 */
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 18px,
      rgba(107, 114, 128, 0.12) 18px,
      rgba(107, 114, 128, 0.12) 19px,
      transparent 19px,
      transparent 22px
    ),
    /* 左侧缩进 */
    linear-gradient(
      to right,
      transparent 0%,
      transparent 4px,
      rgba(107, 114, 128, 0.1) 4px,
      rgba(107, 114, 128, 0.1) 85%,
      transparent 85%
    );
  pointer-events: none;
}

.page-stack-left {
  left: 0;
  border-radius: 8px 0 0 8px;
  box-shadow:
    inset -1px 0 0 rgba(148, 163, 184, 0.6),
    2px 0 0 rgba(248, 250, 252, 0.9);
  z-index: 1;
}

.page-stack-right {
  right: 0;
  border-radius: 0 8px 8px 0;
  box-shadow:
    inset 1px 0 0 rgba(148, 163, 184, 0.6),
    -2px 0 0 rgba(248, 250, 252, 0.9);
}

.page-flip {
  right: 0;
  transform-origin: left center;
  border-radius: 0 8px 8px 0;
  background:
    repeating-linear-gradient(
      to bottom,
      #ffffff,
      #ffffff 1px,
      #e5e7eb 1px,
      #e5e7eb 5px
    ),
    linear-gradient(
      to right,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(255, 255, 255, 0.85) 30%,
      rgba(240, 240, 240, 0.7) 50%,
      rgba(255, 255, 255, 0.85) 70%,
      rgba(255, 255, 255, 0.95) 100%
    );
  box-shadow:
    -4px 0 12px rgba(15, 23, 42, 0.3),
    -2px 0 6px rgba(15, 23, 42, 0.15),
    inset 0 0 0 1px rgba(148, 163, 184, 0.7);
  animation: flip-seamless 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
  /* 使用动态 z-index，让翻页顺序自然 */
  z-index: calc(20 - var(--page-index, 0));
}

.page-flip::before {
  content: "";
  position: absolute;
  inset: 12px 8px;
  background-image: 
    /* 文字行 - 不同页面有不同的行间距变化 */
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent calc(3px + var(--line-offset, 0px)),
      rgba(107, 114, 128, 0.18) calc(3px + var(--line-offset, 0px)),
      rgba(107, 114, 128, 0.18) calc(4px + var(--line-offset, 0px)),
      transparent calc(4px + var(--line-offset, 0px)),
      transparent calc(7px + var(--line-offset, 0px))
    ),
    /* 段落间距 */
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent calc(18px + var(--para-offset, 0px)),
      rgba(107, 114, 128, 0.14) calc(18px + var(--para-offset, 0px)),
      rgba(107, 114, 128, 0.14) calc(19px + var(--para-offset, 0px)),
      transparent calc(19px + var(--para-offset, 0px)),
      transparent calc(22px + var(--para-offset, 0px))
    ),
    /* 左侧缩进和文字区域 */
    linear-gradient(
      to right,
      transparent 0%,
      transparent 4px,
      rgba(107, 114, 128, 0.12) 4px,
      rgba(107, 114, 128, 0.12) 82%,
      transparent 82%
    );
  pointer-events: none;
  /* 翻页时保持文字内容 */
  transform-style: preserve-3d;
}

/* 为不同页面设置不同的文字行偏移，让每页看起来内容不同 */
.page-flip-0 { --page-index: 0; --line-offset: 0px; --para-offset: 0px; }
.page-flip-1 { --page-index: 1; --line-offset: 0.5px; --para-offset: 1px; }
.page-flip-2 { --page-index: 2; --line-offset: 1px; --para-offset: 0px; }
.page-flip-3 { --page-index: 3; --line-offset: 0px; --para-offset: 2px; }
.page-flip-4 { --page-index: 4; --line-offset: 0.5px; --para-offset: 1px; }
.page-flip-5 { --page-index: 5; --line-offset: 1px; --para-offset: 0px; }
.page-flip-6 { --page-index: 6; --line-offset: 0px; --para-offset: 1px; }
.page-flip-7 { --page-index: 7; --line-offset: 0.5px; --para-offset: 2px; }
.page-flip-8 { --page-index: 8; --line-offset: 1px; --para-offset: 0px; }
.page-flip-9 { --page-index: 9; --line-offset: 0px; --para-offset: 1px; }
.page-flip-10 { --page-index: 10; --line-offset: 0.5px; --para-offset: 0px; }
.page-flip-11 { --page-index: 11; --line-offset: 1px; --para-offset: 2px; }
.page-flip-12 { --page-index: 12; --line-offset: 0px; --para-offset: 1px; }
.page-flip-13 { --page-index: 13; --line-offset: 0.5px; --para-offset: 0px; }
.page-flip-14 { --page-index: 14; --line-offset: 1px; --para-offset: 1px; }
.page-flip-15 { --page-index: 15; --line-offset: 0px; --para-offset: 2px; }
.page-flip-16 { --page-index: 16; --line-offset: 0.5px; --para-offset: 1px; }
.page-flip-17 { --page-index: 17; --line-offset: 1px; --para-offset: 0px; }
.page-flip-18 { --page-index: 18; --line-offset: 0px; --para-offset: 1px; }
.page-flip-19 { --page-index: 19; --line-offset: 0.5px; --para-offset: 2px; }

.bookmark {
  position: absolute;
  right: 20px;
  top: -3px;
  width: 10px;
  height: 36px;
  background: linear-gradient(
    180deg,
    #f97316 0%,
    #ea580c 50%,
    #dc2626 100%
  );
  border-radius: 0 0 999px 999px;
  box-shadow: 
    0 2px 4px rgba(124, 45, 18, 0.4),
    0 0 0 1px rgba(124, 45, 18, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  z-index: 20;
}

.meta {
  text-align: center;
}

.title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #111827;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  animation: text-pulse 2s ease-in-out infinite;
}

.sub {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  opacity: 0.85;
  animation: text-pulse 2s ease-in-out infinite 0.3s;
}

@keyframes text-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes flip-seamless {
  0% {
    /* 起始：页面在右侧，准备翻页 */
    transform: rotateY(0deg) translateX(0) scaleY(1);
    opacity: 1;
  }
  8% {
    transform: rotateY(-25deg) translateX(-1px) scaleY(1);
    opacity: 1;
  }
  20% {
    transform: rotateY(-70deg) translateX(-2px) scaleY(0.99);
    opacity: 1;
  }
  35% {
    transform: rotateY(-130deg) translateX(-3px) scaleY(0.97);
    opacity: 1;
  }
  48% {
    /* 翻到接近180度 */
    transform: rotateY(-175deg) translateX(-4px) scaleY(0.95);
    opacity: 0.95;
  }
  50% {
    /* 翻页完成，完全翻到左侧 */
    transform: rotateY(-180deg) translateX(-4px) scaleY(0.95);
    opacity: 0.9;
  }
  55% {
    /* 在左侧堆叠，逐渐变暗 */
    transform: rotateY(-180deg) translateX(-3px) scaleY(0.96);
    opacity: 0.7;
  }
  60% {
    transform: rotateY(-180deg) translateX(-2px) scaleY(0.97);
    opacity: 0.5;
  }
  70% {
    transform: rotateY(-180deg) translateX(-1px) scaleY(0.98);
    opacity: 0.3;
  }
  80% {
    /* 完全堆叠在左侧，保持很淡的可见度 */
    transform: rotateY(-180deg) translateX(0) scaleY(1);
    opacity: 0.15;
  }
  90% {
    /* 逐渐消失，准备下一轮 */
    transform: rotateY(-180deg) translateX(0) scaleY(1);
    opacity: 0.05;
  }
  92% {
    /* 瞬间重置到右侧起始位置，但保持完全不可见 */
    transform: rotateY(0deg) translateX(0) scaleY(1);
    opacity: 0;
  }
  100% {
    /* 保持不可见，等待下一轮开始 */
    transform: rotateY(0deg) translateX(0) scaleY(1);
    opacity: 0;
  }
}
</style>
