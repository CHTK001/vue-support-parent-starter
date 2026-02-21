<script setup lang="ts">
interface Props {
  /** 加载文案 */
  loadingText?: string;
}

withDefaults(defineProps<Props>(), {
  loadingText: "正在翻页加载中..."
});
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
            <div class="page page-flip page-flip-front" />
            <div class="page page-flip page-flip-middle" />
            <div class="page page-flip page-flip-back" />
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
  background: radial-gradient(circle at top, #e5e7eb 0%, #cbd5e1 40%, #9ca3af 100%);
  color: #020617;
  padding: 16px;
}

.book-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.book-card {
  position: relative;
  width: 260px;
  height: 140px;
  border-radius: 20px;
  background: radial-gradient(circle at top left, rgba(148, 163, 184, 0.22), transparent),
    radial-gradient(circle at bottom right, rgba(209, 213, 219, 0.5), #f9fafb);
  box-shadow:
    0 22px 44px rgba(15, 23, 42, 0.2),
    0 0 0 1px rgba(148, 163, 184, 0.7);
  overflow: hidden;
  transform: rotateX(18deg) rotateZ(-6deg);
  transform-origin: center bottom;
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
  border-radius: 10px;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 40%, #f3f4f6 100%);
  overflow: hidden;
  transform-style: preserve-3d;
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.55),
    inset 0 0 0 1px rgba(243, 244, 246, 0.9);
}

.page {
  position: absolute;
  inset: 8px 8px;
  width: 50%;
  background:
    repeating-linear-gradient(
      to bottom,
      #e5e7eb,
      #e5e7eb 1px,
      #f9fafb 1px,
      #f9fafb 5px
    );
}

.page-stack-left {
  left: 0;
  border-radius: 8px 0 0 8px;
  box-shadow:
    inset -1px 0 0 rgba(148, 163, 184, 0.6),
    2px 0 0 rgba(248, 250, 252, 0.9);
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
    );
  box-shadow:
    -4px 0 10px rgba(15, 23, 42, 0.25),
    inset 0 0 0 1px rgba(148, 163, 184, 0.7);
  animation: flip 1.8s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
}

.page-flip-front {
  z-index: 3;
}

.page-flip-middle {
  z-index: 2;
  opacity: 0.8;
  animation-delay: 0.25s;
}

.page-flip-back {
  z-index: 1;
  opacity: 0.6;
  animation-delay: 0.5s;
}

.bookmark {
  position: absolute;
  right: 18px;
  top: -2px;
  width: 8px;
  height: 30px;
  background: linear-gradient(180deg, #f97316, #ea580c);
  border-radius: 0 0 999px 999px;
  box-shadow: 0 0 0 1px rgba(124, 45, 18, 0.9);
}

.meta {
  text-align: center;
}

.title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #111827;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

@keyframes flip {
  0% {
    transform: rotateY(0deg) translateX(0);
    opacity: 1;
  }
  35% {
    transform: rotateY(-120deg) translateX(-3px);
    opacity: 1;
  }
  48% {
    transform: rotateY(-180deg) translateX(-6px);
    opacity: 0.2;
  }
  50% {
    transform: rotateY(-180deg) translateX(-6px);
    opacity: 0;
  }
  51% {
    /* 在不可见时瞬间重置到下一页的起始位置，避免视觉“跳一下” */
    transform: rotateY(0deg) translateX(0);
    opacity: 0;
  }
  65% {
    transform: rotateY(-12deg) translateX(-1px);
    opacity: 1;
  }
  100% {
    transform: rotateY(0deg) translateX(0);
    opacity: 1;
  }
}
</style>


