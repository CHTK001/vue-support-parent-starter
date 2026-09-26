<template>
  <div class="voxel-page">
    <!-- 3D 世界：底色 / 地面网格 / 背景墙 / 粒子 / 旋转体素结构 / 光环 -->
    <div class="voxel-world" aria-hidden="true">
      <div class="voxel-bg"></div>
      <div class="voxel-grid-wall"></div>
      <div class="voxel-grid-floor"></div>
      <div class="voxel-particles">
        <span v-for="i in 30" :key="'s' + i" class="voxel-particle" :style="particle(i)"></span>
      </div>

      <!-- 左右两座体素结构，缓慢反向旋转，形成景深并夹住中轴内容 -->
      <div class="voxel-stage">
        <div
          v-for="side in ['left', 'right']"
          :key="side"
          class="voxel-structure"
          :class="`voxel-structure--${side}`"
          :style="structureStyle(side)"
        >
          <div v-for="b in sceneBlocks" :key="b.k" class="voxel-cube" :class="'cube--' + b.c" :style="blockStyle(b.x, b.y, b.z)"></div>
          <div v-for="beam in sceneBeams" :key="beam.k" class="voxel-beam" :class="'beam--' + beam.c" :style="beamStyle(beam)"></div>
        </div>
      </div>

      <div class="voxel-ring voxel-ring--a"></div>
      <div class="voxel-ring voxel-ring--b"></div>
      <div class="voxel-ring voxel-ring--c"></div>
    </div>

    <!-- 中轴内容：品牌与表单合并进同一块控制台卡片，避免两块脱节 -->
    <div class="voxel-content">
      <section class="voxel-panel">
        <!-- 品牌头：旋转立方体标识 + 平台名 + 副标题 -->
        <header class="vp-head">
          <div class="voxel-cube-logo">
            <div class="face f-top"></div>
            <div class="face f-bottom"></div>
            <div class="face f-left"></div>
            <div class="face f-right"></div>
            <div class="face f-front"></div>
            <div class="face f-back"></div>
          </div>
          <div class="vp-head-text">
            <h1 class="vp-title">{{ translateConfigText(loginConfig.title) }}</h1>
            <p class="vp-desc">{{ translateConfigText(loginConfig.description) }}</p>
          </div>
        </header>

        <!-- 状态条：频谱 + 在线指示，替代原来重复的「账号密码登录」标题 -->
        <div class="vp-status">
          <div class="vp-bars">
            <span v-for="i in 6" :key="'bar' + i" class="p-bar" :style="{ height: 10 + ((i * 7) % 22) + 'px' }"></span>
          </div>
          <span class="vp-status-label">{{ t("menu.login.account") }}</span>
          <div class="vp-online">
            <span class="dot"></span>
            <span>ONLINE</span>
          </div>
        </div>

        <div class="vp-body">
          <ReLoginForm :show-mobile-brand="false" :show-header="false" form-class="voxel-form"></ReLoginForm>
        </div>

        <div class="vp-base">
          <div class="base-line"></div>
          <div class="base-markers">
            <span v-for="i in 12" :key="'mk' + i" class="marker" :class="{ active: i <= markerCount }"></span>
          </div>
        </div>
      </section>

      <footer v-if="loginConfig.beiAnHao" class="voxel-legal">
        <el-icon :size="12"><InfoFilled /></el-icon>
        <span>{{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}</span>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 现代立体（voxel）
 *
 * 设计要点：
 *  1. 品牌与表单合并为同一块控制台卡片。原实现把品牌浮在顶部、表单另起一块，
 *     视觉上被割裂且浪费了下半屏；合并后中轴只有一列，构图完整。
 *  2. 标题只保留一处 —— 状态条用 menu.login.account 作为「分区标签」，
 *     ReLoginForm 传 show-header=false，避免与卡片标题叠成双标题。
 *  3. 两座体素结构分居左右、反向缓慢旋转，兼作前景框与景深，
 *     立方体不再被表单面板遮住。
 *  4. OTP 弹窗被 teleport 到 body，scoped 样式无法命中，
 *     故末尾保留一段全局样式，并用 body:has(.voxel-page) 严格限定只在本体生效。
 */
import { onBeforeUnmount, onMounted, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { InfoFilled } from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { translateConfigText } from "@repo/languages";
import ReLoginForm from "../components/ReLoginForm.vue";

const loginConfig = toRef(getConfig(), "login");
const { t } = useI18n();

/** 结构旋转角（左右反向） */
const sceneRotation = ref(0);
const markerCount = ref(6);
let raf = 0;

/** 体素结构定义：坐标单位 20px */
const sceneBlocks: Array<{ k: string; x: number; y: number; z: number; c: string }> = [
  { k: "b0", x: 0, y: 0, z: 0, c: "a" }, { k: "b1", x: 1, y: 0, z: 0, c: "a" }, { k: "b2", x: 2, y: 0, z: 0, c: "a" }, { k: "b3", x: 3, y: 0, z: 0, c: "a" },
  { k: "b4", x: 0, y: 0, z: 1, c: "a" }, { k: "b5", x: 1, y: 0, z: 1, c: "a" }, { k: "b6", x: 2, y: 0, z: 1, c: "a" }, { k: "b7", x: 3, y: 0, z: 1, c: "a" },
  { k: "b8", x: 0, y: 0, z: 2, c: "a" }, { k: "b9", x: 1, y: 0, z: 2, c: "a" }, { k: "b10", x: 2, y: 0, z: 2, c: "a" }, { k: "b11", x: 3, y: 0, z: 2, c: "a" },
  { k: "b12", x: 0, y: 1, z: 0, c: "b" }, { k: "b13", x: 0, y: 2, z: 0, c: "b" }, { k: "b14", x: 0, y: 3, z: 0, c: "b" },
  { k: "b15", x: 0, y: 1, z: 2, c: "b" }, { k: "b16", x: 0, y: 2, z: 2, c: "b" }, { k: "b17", x: 0, y: 3, z: 2, c: "b" },
  { k: "b18", x: 3, y: 1, z: 0, c: "b" }, { k: "b19", x: 3, y: 2, z: 0, c: "b" }, { k: "b20", x: 3, y: 3, z: 0, c: "b" },
  { k: "b21", x: 3, y: 1, z: 2, c: "b" }, { k: "b22", x: 3, y: 2, z: 2, c: "b" }, { k: "b23", x: 3, y: 3, z: 2, c: "b" },
  { k: "b24", x: 1, y: 1, z: 1, c: "c" }, { k: "b25", x: 2, y: 1, z: 1, c: "c" },
  { k: "b26", x: 1, y: 2, z: 1, c: "c" }, { k: "b27", x: 2, y: 2, z: 1, c: "c" },
  { k: "b28", x: 1, y: 3, z: 1, c: "c" }, { k: "b29", x: 2, y: 3, z: 1, c: "c" },
  { k: "b30", x: 1, y: 4, z: 1, c: "c" }, { k: "b31", x: 2, y: 4, z: 1, c: "c" },
  { k: "b32", x: 1, y: 5, z: 1, c: "d" }, { k: "b33", x: 2, y: 5, z: 1, c: "d" },
  { k: "b34", x: 1, y: 5, z: 0, c: "d" }, { k: "b35", x: 2, y: 5, z: 0, c: "d" },
  { k: "b36", x: 1, y: 5, z: 2, c: "d" }, { k: "b37", x: 2, y: 5, z: 2, c: "d" },
  { k: "b38", x: -1, y: 2, z: -1, c: "e" }, { k: "b39", x: 4, y: 3, z: 1, c: "e" },
  { k: "b40", x: 1, y: 6, z: -1, c: "e" }, { k: "b41", x: 2, y: 6, z: 3, c: "e" },
];

/** 光柱：给结构加纵向光感 */
const sceneBeams: Array<{ k: string; x1: number; y1: number; z1: number; y2: number; z2: number; c: string }> = [
  { k: "bm1", x1: 1.5, y1: 0, z1: 1.5, y2: 5, z2: 1.5, c: "a" },
  { k: "bm2", x1: 0.5, y1: 0, z1: 1.5, y2: 0, z2: 1.5, c: "a" },
];

const GRID = 20;

/** 单个立方体定位 */
const blockStyle = (x: number, y: number, z: number) => ({
  left: `${x * GRID}px`,
  top: `${y * GRID}px`,
  transform: `translateZ(${z * GRID}px)`,
  animationDelay: `${((x + y + z) * 0.1).toFixed(2)}s`,
});

/** 光柱定位 */
const beamStyle = (b: (typeof sceneBeams)[number]) => ({
  left: `${b.x1 * GRID}px`,
  top: `${b.y1 * GRID}px`,
  height: `${(b.y2 - b.y1) * GRID}px`,
  transform: `translateZ(${(b.z1 + (b.z2 - b.z1) / 2) * GRID}px)`,
});

/** 左右两座结构的朝向：左侧反向旋转，形成向中轴汇聚的观感 */
const structureStyle = (side: string) => ({
  transform: `rotateX(-24deg) rotateY(${side === "left" ? -sceneRotation.value : sceneRotation.value}deg)`,
});

/** 漂浮粒子 */
const particle = (i: number) => ({
  left: `${(i * 7) % 100}%`,
  top: `${(i * 13) % 100}%`,
  width: `${2 + (i % 3)}px`,
  height: `${2 + (i % 3)}px`,
  background:
    i % 3 === 0 ? "var(--el-color-primary-light-5)" : i % 3 === 1 ? "var(--el-color-primary)" : "var(--el-color-primary-light-3)",
  animationDelay: `${-i * 0.7}s`,
  animationDuration: `${6 + (i % 5) * 2}s`,
});

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    markerCount.value = 8;
    return;
  }
  const start = performance.now();
  const animate = (ts: number) => {
    sceneRotation.value = ((ts - start) / 1000 * 14) % 360;
    raf = requestAnimationFrame(animate);
  };
  raf = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  if (raf) {
    cancelAnimationFrame(raf);
  }
});
</script>

<style lang="scss" scoped>
/* ============ 页面骨架 ============ */
.voxel-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #050510;
  color: #e2e8f0;
  font-family:
    "SF Mono", "Fira Code", "Consolas", "PingFang SC", "Microsoft YaHei", monospace;
}

/* ============ 3D 世界 ============ */
.voxel-world {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.voxel-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1100px 700px at 50% 8%, #0d1b4a 0%, transparent 62%),
    radial-gradient(900px 620px at 12% 92%, #0a1030 0%, transparent 60%),
    radial-gradient(900px 620px at 88% 88%, #0a1030 0%, transparent 60%),
    linear-gradient(180deg, #050510 0%, #070a20 55%, #04040c 100%);
}

/* 背景墙网格 */
.voxel-grid-wall {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--el-color-primary-rgb), 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 72%);
}

/* 地面网格：透视 + 缓慢滚动，制造纵深 */
.voxel-grid-floor {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 45%;
  background-image:
    linear-gradient(rgba(var(--el-color-primary-rgb), 0.14) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.14) 1px, transparent 1px);
  background-size: 50px 50px;
  transform: perspective(600px) rotateX(60deg);
  transform-origin: bottom center;
  mask-image: linear-gradient(180deg, transparent 0%, #000 42%, #000 100%);
  animation: voxel-grid-scroll 9s linear infinite;
}

/* 漂浮粒子 */
.voxel-particles {
  position: absolute;
  inset: 0;
}

.voxel-particle {
  position: absolute;
  display: block;
  border-radius: 50%;
  opacity: 0.55;
  animation-name: voxel-float-up;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* 左右体素结构 */
.voxel-stage {
  position: absolute;
  inset: 0;
  perspective: 1400px;
}

.voxel-structure {
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  transition: transform 0.12s linear;

  &--left {
    left: 6%;
    margin-top: -80px;
    transform: scale(1.05);
  }

  &--right {
    right: 6%;
    margin-top: -80px;
    transform: scale(1.05);
  }
}

/* 立方体：三面 + 发光描边 */
.voxel-cube {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--face-color);
  border: 1px solid var(--face-edge);
  box-shadow: 0 0 10px var(--face-glow);
  transform-style: preserve-3d;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    background: var(--top-color);
    transform: translateZ(10px);
  }

  /* 左右侧面：造出立体体积 */
  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    background: linear-gradient(90deg, var(--face-edge), transparent 60%);
    transform: rotateY(90deg) translateZ(10px);
    transform-origin: left center;
    opacity: 0.5;
  }

  &.cube--a {
    --face-color: rgba(var(--el-color-primary-rgb), 0.32);
    --face-edge: rgba(var(--el-color-primary-rgb), 0.75);
    --face-glow: rgba(var(--el-color-primary-rgb), 0.4);
    --top-color: rgba(var(--el-color-primary-rgb), 0.5);
  }

  &.cube--b {
    --face-color: rgba(var(--el-color-primary-rgb), 0.2);
    --face-edge: rgba(var(--el-color-primary-rgb), 0.55);
    --face-glow: rgba(var(--el-color-primary-rgb), 0.28);
    --top-color: rgba(var(--el-color-primary-rgb), 0.34);
  }

  &.cube--c {
    --face-color: rgba(var(--el-color-primary-rgb), 0.42);
    --face-edge: rgba(var(--el-color-primary-rgb), 0.95);
    --face-glow: rgba(var(--el-color-primary-rgb), 0.55);
    --top-color: rgba(var(--el-color-primary-rgb), 0.62);
  }

  &.cube--d {
    --face-color: rgba(56, 189, 248, 0.26);
    --face-edge: rgba(56, 189, 248, 0.7);
    --face-glow: rgba(56, 189, 248, 0.35);
    --top-color: rgba(56, 189, 248, 0.4);
  }

  &.cube--e {
    --face-color: rgba(167, 139, 250, 0.22);
    --face-edge: rgba(167, 139, 250, 0.6);
    --face-glow: rgba(167, 139, 250, 0.3);
    --top-color: rgba(167, 139, 250, 0.34);
  }
}

/* 光柱 */
.voxel-beam {
  position: absolute;
  width: 6px;
  background: linear-gradient(180deg, rgba(var(--el-color-primary-rgb), 0.05), rgba(var(--el-color-primary-rgb), 0.42));
  border-radius: 3px;
  box-shadow: 0 0 14px rgba(var(--el-color-primary-rgb), 0.4);
  transform-style: preserve-3d;
  animation: voxel-beam-flicker 3.4s ease-in-out infinite;
}

/* 光环 */
.voxel-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.14);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(72deg);
}

.voxel-ring--a {
  width: 640px;
  height: 640px;
  animation: voxel-ring-spin 34s linear infinite;
}

.voxel-ring--b {
  width: 900px;
  height: 900px;
  border-style: dashed;
  opacity: 0.6;
  animation: voxel-ring-spin 52s linear infinite reverse;
}

.voxel-ring--c {
  width: 1180px;
  height: 1180px;
  opacity: 0.35;
  animation: voxel-ring-spin 76s linear infinite;
}

/* ============ 中轴内容 ============ */
.voxel-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 460px;
  padding: 32px 20px;
  animation: voxel-appear 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ============ 控制台面板 ============ */
.voxel-panel {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(10, 14, 32, 0.94));
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.28);
  border-radius: 18px;
  box-shadow:
    0 0 0 1px rgba(var(--el-color-primary-rgb), 0.08),
    0 30px 70px rgba(0, 0, 0, 0.65),
    0 0 44px rgba(var(--el-color-primary-rgb), 0.16);
  backdrop-filter: blur(14px) saturate(140%);

  /* 四角标记，强化「控制台」质感 */
  &::before,
  &::after {
    position: absolute;
    width: 14px;
    height: 14px;
    content: "";
    border-color: var(--el-color-primary);
    opacity: 0.75;
  }

  &::before {
    top: 8px;
    left: 8px;
    border-top: 2px solid;
    border-left: 2px solid;
  }

  &::after {
    right: 8px;
    bottom: 8px;
    border-right: 2px solid;
    border-bottom: 2px solid;
  }
}

/* 品牌头 */
.vp-head {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 24px 24px 18px;
}

.vp-head-text {
  min-width: 0;
}

.vp-title {
  margin: 0 0 5px;
  overflow: hidden;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.5px;
  color: #f1f5f9;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vp-desc {
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 旋转立方体标识 */
.voxel-cube-logo {
  position: relative;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  transform-style: preserve-3d;
  animation: voxel-logo-rotate 9s linear infinite;

  .face {
    position: absolute;
    top: 0;
    left: 0;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.85);
    background: rgba(var(--el-color-primary-rgb), 0.14);
    box-shadow: inset 0 0 14px rgba(var(--el-color-primary-rgb), 0.22);
  }

  .f-front {
    transform: translateZ(21px);
  }

  .f-back {
    transform: rotateY(180deg) translateZ(21px);
  }

  .f-left {
    transform: rotateY(-90deg) translateZ(21px);
  }

  .f-right {
    transform: rotateY(90deg) translateZ(21px);
  }

  .f-top {
    transform: rotateX(90deg) translateZ(21px);
    background: rgba(var(--el-color-primary-rgb), 0.3);
  }

  .f-bottom {
    transform: rotateX(-90deg) translateZ(21px);
  }
}

/* 状态条 */
.vp-status {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 24px;
  background: rgba(var(--el-color-primary-rgb), 0.07);
  border-top: 1px solid rgba(var(--el-color-primary-rgb), 0.16);
  border-bottom: 1px solid rgba(var(--el-color-primary-rgb), 0.16);
}

.vp-bars {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 24px;
}

.p-bar {
  width: 3px;
  background: var(--el-color-primary);
  border-radius: 2px;
  opacity: 0.85;
  animation: voxel-bar-wave 1.3s ease-in-out infinite;
}

.vp-status-label {
  flex: 1;
  overflow: hidden;
  font-size: 11px;
  letter-spacing: 2px;
  color: #94a3b8;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vp-online {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 10px;
  letter-spacing: 1.5px;
  color: #34d399;

  .dot {
    width: 6px;
    height: 6px;
    background: #34d399;
    border-radius: 50%;
    box-shadow: 0 0 8px #34d399;
    animation: voxel-dot-pulse 1.8s ease-in-out infinite;
  }
}

/* 表单区 */
.vp-body {
  padding: 24px;
}

/* 底座 */
.vp-base {
  padding: 0 24px 20px;
}

.base-line {
  height: 1px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, transparent, rgba(var(--el-color-primary-rgb), 0.45), transparent);
}

.base-markers {
  display: flex;
  gap: 6px;
  justify-content: space-between;
}

.marker {
  width: 14px;
  height: 3px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 2px;
  transition: background-color 0.4s ease;

  &.active {
    background: var(--el-color-primary);
    box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.7);
  }
}

/* 备案信息 */
.voxel-legal {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 20px;
  font-size: 11px;
  color: #475569;
}

/* ============ 表单内部视觉增强 ============ */
.voxel-form {
  :deep(.login-input) {
    .el-input__wrapper {
      background: rgba(2, 6, 23, 0.6);
      border-radius: 10px;
      box-shadow: 0 0 0 1px rgba(var(--el-color-primary-rgb), 0.2) inset;
      transition: box-shadow 0.25s ease;

      &:hover {
        box-shadow: 0 0 0 1px rgba(var(--el-color-primary-rgb), 0.45) inset;
      }

      &.is-focus {
        box-shadow:
          0 0 0 1px var(--el-color-primary) inset,
          0 0 18px rgba(var(--el-color-primary-rgb), 0.3);
      }
    }

    .el-input__inner {
      color: #e2e8f0;
    }
  }

  :deep(.login-btn) {
    height: 44px;
    font-size: 15px;
    letter-spacing: 6px;
    border-radius: 10px;
    box-shadow: 0 10px 26px rgba(var(--el-color-primary-rgb), 0.45);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 32px rgba(var(--el-color-primary-rgb), 0.6);
    }
  }
}

/* ============ 动画 ============ */
@keyframes voxel-float-up {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 0.6;
  }
  85% {
    opacity: 0.35;
  }
  100% {
    transform: translateY(-100vh);
    opacity: 0;
  }
}

@keyframes voxel-grid-scroll {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 0 50px;
  }
}

@keyframes voxel-ring-spin {
  from {
    transform: translate(-50%, -50%) rotateX(72deg) rotateZ(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotateX(72deg) rotateZ(360deg);
  }
}

@keyframes voxel-beam-flicker {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes voxel-logo-rotate {
  from {
    transform: rotateX(-24deg) rotateY(0deg);
  }
  to {
    transform: rotateX(-24deg) rotateY(360deg);
  }
}

@keyframes voxel-bar-wave {
  0%,
  100% {
    transform: scaleY(0.45);
  }
  50% {
    transform: scaleY(1);
  }
}

@keyframes voxel-dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@keyframes voxel-appear {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ============ 窄屏：体素结构让位给内容 ============ */
@media (max-width: 1180px) {
  .voxel-structure {
    opacity: 0.32;
  }
}

@media (max-width: 860px) {
  .voxel-stage {
    display: none;
  }

  .voxel-ring--c {
    display: none;
  }
}

@media (max-width: 640px) {
  .voxel-content {
    padding: 24px 16px;
  }

  .vp-head {
    padding: 20px 18px 14px;
  }

  .vp-body {
    padding: 18px;
  }

  .vp-title {
    font-size: 18px;
  }
}

/* ============ 无障碍：尊重减少动效偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .voxel-cube,
  .voxel-particle,
  .voxel-ring,
  .voxel-beam,
  .voxel-cube-logo,
  .p-bar,
  .vp-online .dot,
  .voxel-grid-floor {
    animation: none;
  }
}
</style>

<!--
  OTP 动态口令弹窗由 ReOtpDialog teleport 到 body，scoped 样式无法命中，
  因此这里需要一段全局样式；已用 body:has(.voxel-page) 严格限定只在本体存在时生效。
-->
<style lang="scss">
body:has(.voxel-page) .otp-dialog {
  --otp-bg: rgba(10, 16, 34, 0.96);
  --otp-border: rgba(var(--el-color-primary-rgb), 0.3);
  --otp-card-bg: rgba(2, 6, 23, 0.7);
  --otp-card-border: rgba(var(--el-color-primary-rgb), 0.18);

  background: var(--otp-bg);
  border: 1px solid var(--otp-border);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
}

body:has(.voxel-page) .otp-cell {
  background: var(--otp-card-bg);
  border-color: var(--otp-card-border);
  color: #e2e8f0;
}

body:has(.voxel-page) .otp-cell--focused {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 12px rgba(var(--el-color-primary-rgb), 0.5);
}
</style>
