<template>
  <div class="lsp" :class="`lsp--${type}`">
    <!-- 双栏：左侧品牌面板 + 右侧表单卡片 -->
    <template v-if="type === 'dual'">
      <span class="lsp-brand-panel"><i class="lsp-glow"></i></span>
      <span class="lsp-card lsp-card--right">
        <i class="lsp-line lsp-line--title"></i>
        <i class="lsp-line"></i>
        <i class="lsp-line lsp-line--short"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 居中卡片：卡片顶部主色头图 + 表单 -->
    <template v-else-if="type === 'card'">
      <span class="lsp-bg-dot lsp-bg-dot--1"></span>
      <span class="lsp-card lsp-card--center lsp-card--hero">
        <i class="lsp-hero"></i>
        <i class="lsp-line lsp-line--title"></i>
        <i class="lsp-line"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 气泡简约：气泡背景 + 居中悬浮卡片 -->
    <template v-else-if="type === 'bubble'">
      <span class="lsp-bubble lsp-bubble--1"></span>
      <span class="lsp-bubble lsp-bubble--2"></span>
      <span class="lsp-bubble lsp-bubble--3"></span>
      <span class="lsp-bubble lsp-bubble--4"></span>
      <span class="lsp-card lsp-card--center">
        <i class="lsp-line lsp-line--title"></i>
        <i class="lsp-line"></i>
        <i class="lsp-line lsp-line--short"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 分屏沉浸：左侧品牌沉浸区 + 右侧表单 -->
    <template v-else-if="type === 'split'">
      <span class="lsp-split-brand"><i class="lsp-glow"></i><i class="lsp-line lsp-line--onbrand"></i></span>
      <span class="lsp-split-form">
        <i class="lsp-line lsp-line--title"></i>
        <i class="lsp-line"></i>
        <i class="lsp-line lsp-line--short"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 左右分屏沉浸式：split 的镜像（左表单 + 右品牌沉浸区） -->
    <template v-else-if="type === 'splitReverse'">
      <span class="lsp-split-form lsp-split-form--left">
        <i class="lsp-line lsp-line--title"></i>
        <i class="lsp-line"></i>
        <i class="lsp-line lsp-line--short"></i>
        <i class="lsp-btn"></i>
      </span>
      <span class="lsp-split-brand lsp-split-brand--right"><i class="lsp-glow"></i><i class="lsp-line lsp-line--onbrand"></i></span>
    </template>

    <!-- 玻璃拟态：多层柔光 + 半透明卡片 -->
    <template v-else-if="type === 'glass'">
      <span class="lsp-glass-bg lsp-glass-bg--1"></span>
      <span class="lsp-glass-bg lsp-glass-bg--2"></span>
      <span class="lsp-card lsp-card--glass">
        <i class="lsp-line lsp-line--title"></i>
        <i class="lsp-line"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 流光卡片：渐变光带扫过悬浮卡片 -->
    <template v-else-if="type === 'slide'">
      <span class="lsp-slide-mesh"></span>
      <span class="lsp-card lsp-card--slide">
        <i class="lsp-line lsp-line--title"></i>
        <i class="lsp-line"></i>
        <i class="lsp-line lsp-line--short"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 等宽终端：纯黑窗口 + 交通灯 -->
    <template v-else-if="type === 'mono'">
      <span class="lsp-mono-shell">
        <i class="lsp-mono-bar">
          <b></b><b></b><b></b>
        </i>
        <i class="lsp-mono-prompt"></i>
        <i class="lsp-line"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 轻终端：浅色窗口 + 网格底 -->
    <template v-else-if="type === 'simple'">
      <span class="lsp-simple-grid"></span>
      <span class="lsp-mono-shell lsp-mono-shell--light">
        <i class="lsp-mono-bar">
          <b></b><b></b><b></b>
        </i>
        <i class="lsp-mono-prompt"></i>
        <i class="lsp-line"></i>
        <i class="lsp-btn"></i>
      </span>
    </template>

    <!-- 现代立体：主色 3D 体素 -->
    <template v-else>
      <span class="lsp-sky"></span>
      <span class="lsp-halo"></span>
      <span class="lsp-cube lsp-cube--back"></span>
      <span class="lsp-cube lsp-cube--main"><i class="lsp-cube-face"></i></span>
      <span class="lsp-cube lsp-cube--front"></span>
      <span class="lsp-platform"></span>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页样式缩略图（设置抽屉 / 登录页样式弹层共用）
 *
 * 纯 CSS 绘制，颜色全部走 koi 令牌（--el-color-primary 系列 / --el-bg-color /
 * --el-border-color-lighter 等），主题色与亮暗模式自动适配，不依赖截图。
 */
defineProps<{
  /**
   * 缩略图类型：
   * dual 双栏 / card 居中卡片 / bubble 气泡 / glass 玻璃 / slide 流光 /
   * split 分屏 / splitReverse 左右分屏 / voxel 立体 / mono 等宽终端 / simple 轻终端
   */
  type: string;
}>();
</script>

<style lang="scss" scoped>
.lsp {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(120% 100% at 85% 0%, var(--el-color-primary-light-8) 0%, transparent 60%),
    linear-gradient(160deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 70%);
}

/* ── 通用小元素 ── */
.lsp-line {
  display: block;
  width: 100%;
  height: 4px;
  background: var(--el-border-color);
  border-radius: 2px;

  &--title {
    width: 62%;
    background: var(--el-color-primary-light-5);
  }

  &--short {
    width: 42%;
  }

  &--onbrand {
    width: 56%;
    background: color-mix(in srgb, var(--el-color-white) 62%, transparent);
  }
}

.lsp-btn {
  display: block;
  width: 46%;
  height: 8px;
  margin-top: 3px;
  background: var(--el-color-primary);
  border-radius: 3px;
}

.lsp-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  box-shadow: var(--el-box-shadow-light);

  &--right {
    position: absolute;
    top: 16%;
    right: 8%;
    bottom: 16%;
    width: 44%;
    justify-content: center;
  }

  &--center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 52%;
    transform: translate(-50%, -50%);
  }

  &--hero {
    overflow: hidden;
    padding-top: 0;
  }
}

.lsp-hero {
  display: block;
  height: 22%;
  min-height: 14px;
  margin: 0 -8px 4px;
  background: linear-gradient(140deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 0 0 var(--el-radius-sm, 6px) var(--el-radius-sm, 6px);
}

/* ── dual ── */
.lsp--dual .lsp-brand-panel {
  position: absolute;
  inset: 0 auto 0 0;
  width: 34%;
  background: linear-gradient(165deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
}

.lsp-glow {
  position: absolute;
  top: 22%;
  left: 28%;
  width: 44%;
  height: 22%;
  background: color-mix(in srgb, var(--el-color-white) 35%, transparent);
  border-radius: 50%;
  filter: blur(6px);
}

/* ── card ── */
.lsp-bg-dot {
  position: absolute;
  background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: 50%;

  &--1 {
    top: 12%;
    right: 14%;
    width: 16px;
    height: 16px;
  }
}

/* ── bubble ── */
.lsp-bubble {
  position: absolute;
  background: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  border-radius: 50%;
  filter: blur(1px);

  &--1 { top: 10%; left: 12%; width: 20px; height: 20px; }
  &--2 { top: 26%; right: 14%; width: 13px; height: 13px; opacity: 0.7; }
  &--3 { bottom: 14%; left: 22%; width: 10px; height: 10px; opacity: 0.55; }
  &--4 { bottom: 10%; right: 20%; width: 16px; height: 16px; opacity: 0.45; }
}

/* ── split / splitReverse ── */
.lsp-split-brand {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 42%;
  background: linear-gradient(165deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);

  /* 镜像：品牌沉浸区在右 */
  &--right {
    right: 0;
    left: auto;

    .lsp-line--onbrand {
      left: auto;
      right: 14%;
    }
  }
}

.lsp-split-brand .lsp-line--onbrand {
  position: absolute;
  left: 14%;
  bottom: 22%;
}

.lsp-split-form {
  position: absolute;
  inset: 0 0 0 42%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  padding: 0 12%;
  background: var(--el-bg-color);

  /* 镜像：表单在左 */
  &--left {
    inset: 0 42% 0 0;
  }
}

/* ── glass（玻璃拟态）── */
.lsp-glass-bg {
  position: absolute;
  border-radius: 50%;
  filter: blur(7px);

  &--1 {
    top: 6%;
    left: 8%;
    width: 46%;
    height: 58%;
    background: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  }

  &--2 {
    right: 6%;
    bottom: 4%;
    width: 52%;
    height: 62%;
    background: color-mix(in srgb, var(--el-color-primary-light-3) 60%, transparent);
  }
}

.lsp-card--glass {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 56%;
  background: color-mix(in srgb, var(--el-bg-color) 62%, transparent);
  border-color: color-mix(in srgb, var(--el-color-white) 45%, transparent);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  transform: translate(-50%, -50%);
  backdrop-filter: blur(3px);
}

/* ── slide（流光卡片）── */
.lsp-slide-mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(90% 80% at 18% 12%, color-mix(in srgb, var(--el-color-primary) 42%, transparent) 0%, transparent 62%),
    radial-gradient(80% 80% at 86% 88%, color-mix(in srgb, var(--el-color-primary-light-3) 46%, transparent) 0%, transparent 60%);
}

.lsp-card--slide {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 54%;
  border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  box-shadow:
    0 4px 14px color-mix(in srgb, var(--el-color-primary) 26%, transparent),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  transform: translate(-50%, -50%);

  /* 斜向流光带 */
  &::after {
    position: absolute;
    top: -30%;
    bottom: -30%;
    left: -60%;
    width: 45%;
    content: "";
    background: linear-gradient(
      100deg,
      transparent 0%,
      color-mix(in srgb, var(--el-color-white) 70%, transparent) 50%,
      transparent 100%
    );
    transform: skewX(-18deg);
  }
}

/* ── mono / simple（终端）── */
.lsp-mono-shell {
  position: absolute;
  inset: 12% 10%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 7px;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: var(--el-radius-md, 8px);

  &--light {
    background: var(--el-bg-color);
    border-color: var(--el-border-color-lighter);
  }

  .lsp-btn {
    margin-top: auto;
  }
}

.lsp-mono-bar {
  display: flex;
  gap: 3px;
  align-items: center;
  height: 8px;
  margin-bottom: 1px;

  b {
    width: 5px;
    height: 5px;
    background: var(--el-color-primary);
    border-radius: 50%;
    opacity: 0.85;
  }
}

.lsp-mono-prompt {
  display: block;
  width: 34%;
  height: 4px;
  background: var(--el-color-primary);
  border-radius: 2px;
}

.lsp-mono-shell .lsp-line {
  background: #2e2e2e;
}

.lsp-mono-shell--light .lsp-line {
  background: var(--el-border-color);
}

.lsp-simple-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--el-color-primary) 12%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 12%, transparent) 1px, transparent 1px);
  background-size: 9px 9px;
}

/* ── voxel（现代立体）── */
.lsp-sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
}

.lsp-halo {
  position: absolute;
  top: 12%;
  left: 50%;
  width: 56%;
  height: 56%;
  background: radial-gradient(circle, color-mix(in srgb, var(--el-color-primary) 26%, transparent) 0%, transparent 70%);
  border-radius: 50%;
  transform: translateX(-50%);
}

.lsp-platform {
  position: absolute;
  bottom: 14%;
  left: 50%;
  width: 62%;
  height: 14px;
  background: linear-gradient(180deg, var(--el-color-primary-light-5) 0%, var(--el-color-primary-light-7) 100%);
  border-radius: 50%;
  transform: translateX(-50%);
}

.lsp-cube {
  position: absolute;
  left: 50%;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  transform: translateX(-50%) rotate(45deg) skew(-8deg, -8deg);

  &--back {
    top: 16%;
    background: linear-gradient(140deg, var(--el-color-primary-light-5) 0%, var(--el-color-primary-light-7) 100%);
    opacity: 0.7;
  }

  &--main {
    top: 26%;
    z-index: 2;
    background: linear-gradient(140deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
    box-shadow: 0 8px 16px color-mix(in srgb, var(--el-color-primary) 32%, transparent);
  }

  &--front {
    top: 40%;
    z-index: 3;
    width: 26px;
    height: 26px;
    background: linear-gradient(140deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2, var(--el-color-primary)) 100%);
  }
}

.lsp-cube-face {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: color-mix(in srgb, var(--el-color-white) 82%, transparent);
  border-radius: 3px;
  transform: translate(-50%, -50%);
}
</style>
