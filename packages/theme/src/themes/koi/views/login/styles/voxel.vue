<template>
  <div class="voxel-page">
    <div class="voxel-world">
      <div class="voxel-bg"></div>
      <div class="voxel-grid-floor"></div>
      <div class="voxel-grid-wall"></div>
      <div class="voxel-particles">
        <span v-for="i in 30" :key="'s'+i" class="voxel-particle" :style="particle(i)"></span>
      </div>
      <div class="voxel-viewport">
        <div class="voxel-scene">
          <div class="voxel-structure" :style="{ transform: 'rotateX(-25deg) rotateY(' + sceneRotation + 'deg)' }">
            <div v-for="b in sceneBlocks" :key="b.k" class="voxel-cube" :class="'cube--' + b.c" :style="blockStyle(b.x, b.y, b.z)"></div>
            <div v-for="beam in sceneBeams" :key="beam.k" class="voxel-beam" :class="'beam--' + beam.c" :style="beamStyle(beam)"></div>
          </div>
        </div>
      </div>
      <div class="voxel-ring voxel-ring--a"></div>
      <div class="voxel-ring voxel-ring--b"></div>
      <div class="voxel-ring voxel-ring--c"></div>
    </div>
    <div class="voxel-brand">
      <div class="voxel-cube-logo">
        <div class="face f-top"></div>
        <div class="face f-bottom"></div>
        <div class="face f-left"></div>
        <div class="face f-right"></div>
        <div class="face f-front"></div>
        <div class="face f-back"></div>
      </div>
      <div class="voxel-brand-lines">
        <span class="line l-1"></span>
        <span class="line l-2"></span>
        <span class="line l-3"></span>
      </div>
      <div class="voxel-brand-text">
        <span class="t1">{{ translateConfigText(loginConfig.title) }}</span>
        <span class="t2">{{ translateConfigText(loginConfig.description) }}</span>
      </div>
    </div>
    <div class="voxel-panel">
      <div class="voxel-panel-inner">
        <div class="voxel-panel-bar">
          <div class="panel-bars">
            <span v-for="i in 6" :key="'bar'+i" class="p-bar" :style="{ height: (12 + (i*7)%24) + 'px' }"></span>
          </div>
          <span class="panel-title">{{ t('menu.login.account') }}</span>
          <div class="panel-status">
            <span class="dot"></span>
            <span>ONLINE</span>
          </div>
        </div>
        <div class="voxel-panel-body">
          <KoiLoginForm :show-mobile-brand="false" form-class="voxel-form"></KoiLoginForm>
        </div>
        <div class="voxel-panel-base">
          <div class="base-line"></div>
          <div class="base-markers">
            <span v-for="i in 12" :key="'mk'+i" class="marker" :class="{ active: i <= markerCount }"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, toRef } from "vue";
import { useI18n } from "vue-i18n";
import { getConfig } from "@repo/config";
import { translateConfigText } from "@repo/languages";
import KoiLoginForm from "../components/KoiLoginForm.vue";

const loginConfig = toRef(getConfig(), "login");
const { t } = useI18n();
const sceneRotation = ref(0);
const markerCount = ref(Math.floor(Math.random() * 12));
let raf: number = 0;

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

const sceneBeams: Array<{ k: string; x1: number; y1: number; z1: number; y2: number; z2: number; c: string }> = [
  { k: "bm1", x1: 1.5, y1: 0, z1: 1.5, y2: 5, z2: 1.5, c: "a" },
  { k: "bm2", x1: 0.5, y1: 0, z1: 1.5, y2: 0, z2: 1.5, c: "a" },
];

const blockStyle = (x: number, y: number, z: number) => {
  const s = 20;
  return {
    left: (x * s) + "px",
    top: (y * s) + "px",
    position: "absolute",
    transform: "translateZ(" + (z * s) + "px)",
    animationDelay: ((x + y + z) * 0.1) + "s",
  };
};

const beamStyle = (b: any) => {
  return {
    left: (b.x1 * 20) + "px",
    top: (b.y1 * 20) + "px",
    height: ((b.y2 - b.y1) * 20) + "px",
    position: "absolute",
    transform: "translateZ(" + ((b.z1 + (b.z2 - b.z1) / 2) * 20) + "px)",
    animationDelay: "0.5s",
  };
};

const particle = (i: number) => ({
  left: ((i * 7) % 100) + "%",
  top: ((i * 13) % 100) + "%",
  animationDelay: (-i * 0.7) + "s",
  animationDuration: (6 + (i % 5) * 2) + "s",
  width: (2 + (i % 3)) + "px",
  height: (2 + (i % 3)) + "px",
  background: i % 3 === 0 ? "#06B6D4" : i % 3 === 1 ? "#8B5CF6" : "#0EA5E9",
});

onMounted(() => {
  const start = performance.now();
  const animate = (ts: number) => {
    sceneRotation.value = ((ts - start) / 1000 * 15) % 360;
    raf = requestAnimationFrame(animate);
  };
  raf = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf);
});
</script>

<style lang="scss" scoped>
.voxel-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  user-select: none;
  background: #050510;
}
.voxel-world {
  position: absolute;
  inset: 0;
  overflow: hidden;
  perspective: 1400px;
  perspective-origin: 50% 40%;
}
.voxel-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 600px 400px at 30% 70%, rgba(6,182,212,0.08) 0%, transparent 60%),
    radial-gradient(ellipse 500px 350px at 70% 30%, rgba(139,92,246,0.08) 0%, transparent 60%),
    radial-gradient(ellipse 800px 500px at 50% 100%, rgba(14,165,233,0.06) 0%, transparent 60%),
    linear-gradient(180deg, #050510 0%, #080820 40%, #050510 100%);
}
.voxel-grid-floor {
  position: absolute;
  bottom: 0; left: 0; right: 0; height: 45%;
  background:
    repeating-linear-gradient(90deg, transparent 0, transparent 49px, rgba(6,182,212,0.06) 49px, rgba(6,182,212,0.06) 50px),
    repeating-linear-gradient(0deg, transparent 0, transparent 49px, rgba(139,92,246,0.04) 49px, rgba(139,92,246,0.04) 50px);
  transform: perspective(600px) rotateX(60deg);
  transform-origin: bottom center;
  mask-image: linear-gradient(180deg, transparent 0%, #000 40%, #000 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 40%, #000 100%);
}
.voxel-grid-wall {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 49px, rgba(99,102,241,0.03) 49px, rgba(99,102,241,0.03) 50px);
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 20%, transparent 100%);
}
.voxel-particles { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.voxel-particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.5;
  animation: voxel-float-up linear infinite;
  box-shadow: 0 0 6px currentColor;
}
@keyframes voxel-float-up {
  0% { transform: translateY(100vh); opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.3; }
  100% { transform: translateY(-20vh) translateX(30px); opacity: 0; }
}
.voxel-viewport {
  position: absolute;
  top: 15%; right: 5%;
  width: 300px; height: 300px;
  perspective: 900px;
  z-index: 2; pointer-events: none;
}
.voxel-scene {
  position: relative;
  width: 100%; height: 100%;
  transform-style: preserve-3d;
}
.voxel-structure {
  position: absolute;
  top: 50%; left: 50%;
  transform-style: preserve-3d;
  width: 0; height: 0;
  transition: transform 0.05s linear;
}
.voxel-cube {
  position: absolute;
  width: 20px; height: 20px;
  transform-style: preserve-3d;
  opacity: 0;
  animation: voxel-appear 0.6s ease-out forwards, voxel-pulse 3s ease-in-out infinite;
}
.voxel-cube::before,
.voxel-cube::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--face-color, #06B6D4);
  border: 1px solid var(--face-edge, rgba(0,217,255,0.4));
  box-shadow: var(--face-glow, 0 0 4px rgba(6,182,212,0.3));
}
.voxel-cube::before { transform: translateZ(10px); }
.voxel-cube::after {
  transform: rotateX(90deg) translateZ(10px);
  background: var(--top-color, #0EA5E9);
}
.voxel-cube.cube--a {
  --face-color: rgba(6,182,212,0.15);
  --face-edge: rgba(6,182,212,0.3);
  --face-glow: 0 0 4px rgba(6,182,212,0.2);
  --top-color: rgba(14,165,233,0.2);
}
.voxel-cube.cube--b {
  --face-color: rgba(139,92,246,0.12);
  --face-edge: rgba(139,92,246,0.3);
  --face-glow: 0 0 4px rgba(139,92,246,0.2);
  --top-color: rgba(167,139,250,0.2);
}
.voxel-cube.cube--c {
  --face-color: rgba(99,102,241,0.18);
  --face-edge: rgba(129,140,248,0.4);
  --face-glow: 0 0 6px rgba(99,102,241,0.4);
  --top-color: rgba(129,140,248,0.3);
  animation-delay: 0.1s, 0s;
}
.voxel-cube.cube--d {
  --face-color: rgba(236,72,153,0.2);
  --face-edge: rgba(236,72,153,0.4);
  --face-glow: 0 0 8px rgba(236,72,153,0.5);
  --top-color: rgba(244,114,182,0.3);
  animation-delay: 0.2s, 0s;
}
.voxel-cube.cube--e {
  --face-color: rgba(6,182,212,0.1);
  --face-edge: rgba(6,182,212,0.3);
  --face-glow: 0 0 6px rgba(6,182,212,0.4);
  --top-color: rgba(14,165,233,0.15);
  animation-delay: 0.3s, 0s;
}
@keyframes voxel-appear { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes voxel-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
.voxel-beam {
  position: absolute;
  width: 1px;
  background: linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.6) 50%, transparent 100%);
  box-shadow: 0 0 4px rgba(6,182,212,0.4);
  opacity: 0;
  animation: voxel-appear 0.8s ease-out 0.5s forwards, voxel-beam-flicker 2s ease-in-out infinite 1.3s;
}
.voxel-beam.beam--a {
  background: linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.5) 50%, transparent 100%);
  box-shadow: 0 0 4px rgba(99,102,241,0.3);
}
@keyframes voxel-beam-flicker { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.voxel-ring {
  position: absolute;
  border: 1px solid rgba(6,182,212,0.08);
  border-radius: 50%;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}
.voxel-ring--a { width: 500px; height: 500px; animation: voxel-ring-spin 30s linear infinite; border-color: rgba(6,182,212,0.06); }
.voxel-ring--b { width: 700px; height: 700px; animation: voxel-ring-spin 50s linear infinite reverse; border-color: rgba(139,92,246,0.05); border-style: dashed; }
.voxel-ring--c { width: 900px; height: 900px; animation: voxel-ring-spin 70s linear infinite; border-color: rgba(99,102,241,0.04); }
@keyframes voxel-ring-spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
.voxel-brand {
  position: absolute;
  top: 32px; left: 0; right: 0;
  display: flex; flex-direction: column; align-items: center;
  z-index: 10; pointer-events: none;
}
.voxel-cube-logo {
  width: 36px; height: 36px;
  position: relative;
  transform-style: preserve-3d;
  animation: voxel-logo-rotate 10s linear infinite;
  margin-bottom: 10px;
}
.voxel-cube-logo .face {
  position: absolute;
  width: 36px; height: 36px;
  border: 1px solid rgba(139,92,246,0.5);
  background: rgba(99,102,241,0.08);
  box-shadow: 0 0 8px rgba(99,102,241,0.2), inset 0 0 4px rgba(139,92,246,0.1);
}
.f-front { transform: translateZ(18px); }
.f-back { transform: rotateY(180deg) translateZ(18px); background: rgba(6,182,212,0.06); border-color: rgba(6,182,212,0.4); }
.f-left { transform: rotateY(-90deg) translateZ(18px); background: rgba(6,182,212,0.08); border-color: rgba(6,182,212,0.4); }
.f-right { transform: rotateY(90deg) translateZ(18px); background: rgba(6,182,212,0.08); border-color: rgba(6,182,212,0.4); }
.f-top { transform: rotateX(90deg) translateZ(18px); background: rgba(99,102,241,0.15); border-color: rgba(129,140,248,0.5); }
.f-bottom { transform: rotateX(-90deg) translateZ(18px); background: rgba(99,102,241,0.04); border-color: rgba(99,102,241,0.3); }
@keyframes voxel-logo-rotate { 0% { transform: rotateX(-20deg) rotateY(0deg); } 100% { transform: rotateX(-20deg) rotateY(360deg); } }
.voxel-brand-lines { display: flex; gap: 3px; margin-bottom: 6px; }
.voxel-brand-lines .line { width: 20px; height: 2px; background: rgba(139,92,246,0.3); }
.voxel-brand-lines .l-1 { width: 30px; background: rgba(6,182,212,0.5); }
.voxel-brand-lines .l-2 { width: 20px; background: rgba(139,92,246,0.4); }
.voxel-brand-lines .l-3 { width: 10px; background: rgba(99,102,241,0.3); }
.voxel-brand-text { text-align: center; }
.voxel-brand-text .t1 {
  display: block;
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  font-size: 17px; font-weight: 600;
  color: #E2E8F0; letter-spacing: 4px;
  text-shadow: 0 0 12px rgba(99,102,241,0.4);
}
.voxel-brand-text .t2 {
  display: block; margin-top: 4px;
  font-family: "SF Mono", "Fira Code", "Consolas", monospace;
  font-size: 9px; color: #64748B; letter-spacing: 3px;
}
.voxel-panel {
  position: absolute;
  top: 150px; left: 50%;
  transform: translateX(-50%);
  width: 380px; max-width: 90vw;
  z-index: 10;
}
.voxel-panel-inner {
  background: rgba(10, 10, 30, 0.88);
  border: 1px solid rgba(99,102,241,0.25);
  border-radius: 8px; overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 0 30px rgba(99,102,241,0.1), 0 0 60px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
  position: relative;
}
.voxel-panel-inner::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.4) 50%, transparent 100%);
}
.voxel-panel-inner::after {
  content: "";
  position: absolute;
  bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.3) 50%, transparent 100%);
}
.voxel-panel-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: rgba(15,15,35,0.6);
  border-bottom: 1px solid rgba(99,102,241,0.15);
}
.panel-bars { display: flex; align-items: flex-end; gap: 2px; }
.p-bar {
  width: 3px;
  background: rgba(6,182,212,0.5);
  border-radius: 1px;
  animation: voxel-bar-wave 1.5s ease-in-out infinite;
}
.p-bar:nth-child(2) { animation-delay: 0.1s; background: rgba(99,102,241,0.5); }
.p-bar:nth-child(3) { animation-delay: 0.2s; background: rgba(139,92,246,0.5); }
.p-bar:nth-child(4) { animation-delay: 0.3s; background: rgba(6,182,212,0.4); }
.p-bar:nth-child(5) { animation-delay: 0.4s; background: rgba(99,102,241,0.4); }
.p-bar:nth-child(6) { animation-delay: 0.5s; background: rgba(139,92,246,0.4); }
@keyframes voxel-bar-wave { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.4); } }
.panel-title {
  margin-left: 8px;
  font-family: "SF Mono","Consolas",monospace;
  font-size: 10px; color: #94A3B8; letter-spacing: 2px;
}
.panel-status {
  margin-left: auto;
  display: flex; align-items: center; gap: 5px;
  font-family: "SF Mono","Consolas",monospace;
  font-size: 8px; color: #10B981; letter-spacing: 1px;
}
.panel-status .dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 4px rgba(16,185,129,0.6);
  animation: voxel-dot-pulse 2s ease-in-out infinite;
}
@keyframes voxel-dot-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.voxel-panel-body { padding: 14px 16px 12px; }
.voxel-panel-base {
  padding: 6px 14px 10px;
  border-top: 1px solid rgba(99,102,241,0.1);
  background: rgba(5,5,20,0.4);
}
.base-line {
  height: 1px;
  background: linear-gradient(90deg, rgba(6,182,212,0.3) 0%, rgba(99,102,241,0.3) 50%, rgba(139,92,246,0.3) 100%);
  margin-bottom: 6px;
}
.base-markers { display: flex; justify-content: space-between; gap: 2px; }
.marker {
  width: 100%; height: 2px;
  background: rgba(99,102,241,0.15);
  border-radius: 1px;
}
.marker.active {
  background: rgba(99,102,241,0.5);
  box-shadow: 0 0 4px rgba(99,102,241,0.3);
}
.voxel-form {
  :deep(.koi-login-form) { width: 100%; }
  :deep(.login-form) { width: 100%; max-width: none !important; }
  :deep(.el-form-item) { margin-bottom: 8px; }
  :deep(.form-header) { text-align: center; margin-bottom: 12px; }
  :deep(.form-header h3) { font-family: "SF Mono","Consolas",monospace; font-size: 12px; letter-spacing: 3px; margin-bottom: 4px; color: #E2E8F0; }
  :deep(.form-header p) { font-family: "SF Mono","Consolas",monospace; font-size: 9px; color: #64748B; letter-spacing: 1px; }
  :deep(.login-input) {
    .el-input__wrapper {
      background: rgba(30,27,75,0.4) !important;
      border: 1px solid rgba(99,102,241,0.2) !important;
      box-shadow: none !important;
      border-radius: 4px !important;
      padding: 2px 10px !important;
      transition: all 0.2s ease !important;
    }
    .el-input__wrapper.is-focus {
      border-color: #8B5CF6 !important;
      box-shadow: 0 0 0 2px rgba(139,92,246,0.15), 0 0 12px rgba(139,92,246,0.1) !important;
    }
    .el-input__inner {
      font-family: "SF Mono","Consolas",monospace !important;
      font-size: 12px !important;
      color: #E2E8F0 !important;
    }
    .el-input__inner::placeholder { color: #475569 !important; }
    .el-input__prefix { color: #64748B !important; }
  }
  :deep(.login-btn) {
    .el-button {
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%) !important;
      border: none !important;
      border-radius: 4px !important;
      box-shadow: 0 4px 12px rgba(99,102,241,0.25) !important;
      color: #FFFFFF !important;
      font-family: "SF Mono","Consolas",monospace !important;
      font-size: 11px !important; font-weight: 600 !important;
      letter-spacing: 3px !important;
      transition: all 0.2s ease !important;
      width: 100%;
    }
    .el-button:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 16px rgba(99,102,241,0.4) !important;
    }
    .el-button:active { transform: translateY(0) !important; }
  }
  :deep(.login-input-row) { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  :deep(.login-extras) { margin-bottom: 6px; }
  :deep(.login-tip) { color: #64748B; font-family: "SF Mono","Consolas",monospace; font-size: 9px; }
  :deep(.login-verify-wrap) { gap: 8px !important; align-items: center !important; }
  :deep(.login-verify-img) {
    width: 80px !important; height: 32px !important;
    border-radius: 3px !important;
    border: 1px solid rgba(99,102,241,0.2) !important;
    background: rgba(30,27,75,0.4) !important;
    transition: all 0.2s ease !important;
    overflow: hidden;
  }
  :deep(.login-verify-img:hover) { border-color: #8B5CF6 !important; }
  :deep(.login-verify-placeholder) { background: rgba(30,27,75,0.4) !important; color: #64748B !important; }
  :deep(.otp-input-cells) { gap: 5px; }
  :deep(.otp-cell) {
    height: 36px !important;
    font-family: "SF Mono","Consolas",monospace !important;
    font-size: 14px !important; font-weight: 600 !important;
    background: rgba(30,27,75,0.4) !important;
    color: #E2E8F0 !important;
    border: 1px solid rgba(99,102,241,0.2) !important;
    border-radius: 3px !important;
    box-shadow: none !important;
    outline: none !important;
    text-align: center;
    transition: all 0.2s ease !important;
  }
  :deep(.otp-cell--filled) { border-color: #8B5CF6 !important; background: rgba(99,102,241,0.06) !important; }
  :deep(.otp-cell--focused) { border-color: #8B5CF6 !important; box-shadow: 0 0 0 2px rgba(139,92,246,0.15) !important; }
  :deep(.slider-verify) { height: 32px !important; }
  :deep(.slider-verify-track) {
    background: rgba(30,27,75,0.4) !important;
    border: 1px solid rgba(99,102,241,0.2) !important;
    border-radius: 3px !important;
  }
  :deep(.slider-verify-bg) { background: rgba(99,102,241,0.15) !important; border-radius: 3px; }
  :deep(.slider-verify-thumb) {
    background: linear-gradient(135deg, #6366F1, #8B5CF6) !important;
    border: none !important;
    border-radius: 3px !important;
    box-shadow: 0 2px 6px rgba(99,102,241,0.3) !important;
    top: 1px; height: 30px !important;
  }
  :deep(.slider-verify-thumb--success) { background: #10B981 !important; }
  :deep(.slider-verify-text) { font-family: "SF Mono","Consolas",monospace !important; font-size: 9px !important; color: #64748B !important; letter-spacing: 1px; }
  :deep(.slider-verify-text--success) { color: #10B981 !important; }

  :deep(.otp-dialog) {
    --otp-bg: rgba(15,23,42,0.92);
    --otp-border: rgba(99,102,241,0.25);
    --otp-card-bg: rgba(30,27,75,0.6);
    --otp-card-border: rgba(99,102,241,0.2);

    :deep(.el-dialog) {
      background: var(--otp-bg) !important;
      border: 1px solid var(--otp-border) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.08) !important;
      border-radius: 4px !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      margin-top: 10vh !important;
    }
    :deep(.el-overlay-dialog) {
      background: rgba(0,0,0,0.6);
    }
    :deep(.el-dialog__header) {
      border-bottom: 1px solid rgba(99,102,241,0.15) !important;
      padding: 14px 20px 0 !important;
    }
    :deep(.el-dialog__title) {
      font-family: "SF Mono","Consolas",monospace !important;
      font-size: 15px !important;
      font-weight: 700 !important;
      color: #E2E8F0 !important;
      letter-spacing: 0.5px;
    }
    :deep(.el-dialog__headerbtn) {
      color: #94A3B8 !important;
      top: 12px !important; right: 16px !important;
    }
    :deep(.el-dialog__headerbtn:focus) {
      color: #8B5CF6 !important;
    }
    :deep(.el-dialog__body) {
      padding: 16px 20px 20px !important;
    }
    .otp-dialog-icon {
      background: rgba(99,102,241,0.12) !important;
      border: 1px solid rgba(99,102,241,0.3) !important;
      box-shadow: 0 0 12px rgba(99,102,241,0.15) !important;
      color: #8B5CF6 !important;
    }
    .otp-dialog-desc {
      color: #94A3B8 !important;
      font-size: 12px !important;
    }
    :deep(.otp-cell) {
      height: 38px !important;
      font-family: "SF Mono","Consolas",monospace !important;
      font-size: 16px !important; font-weight: 700 !important;
      background: rgba(30,27,75,0.5) !important;
      color: #E2E8F0 !important;
      border: 1px solid rgba(99,102,241,0.25) !important;
      border-radius: 3px !important;
    }
    :deep(.otp-cell--filled) {
      border-color: #8B5CF6 !important;
      background: rgba(99,102,241,0.08) !important;
      box-shadow: 0 0 8px rgba(139,92,246,0.2) !important;
    }
    :deep(.otp-cell--focused) {
      border-color: #8B5CF6 !important;
      box-shadow: 0 0 0 2px rgba(139,92,246,0.2) !important;
    }
    :deep(.otp-dialog-footer) {
      padding-top: 4px;
    }
    :deep(.otp-cancel-text) {
      color: #94A3B8 !important;
      font-size: 12px !important;
    }
    :deep(.otp-cancel-text:hover) {
      color: #E2E8F0 !important;
    }
    :deep(.el-button--primary) {
      background: #6366F1 !important;
      border: 1px solid #6366F1 !important;
      border-radius: 3px !important;
      font-family: "SF Mono","Consolas",monospace !important;
      font-weight: 600 !important;
      font-size: 12px !important;
      color: #FFFFFF !important;
      letter-spacing: 1px;
      padding: 8px 20px !important;
      height: 32px !important;
      box-shadow: 0 0 12px rgba(99,102,241,0.3) !important;
    }
    :deep(.el-button--primary:disabled) {
      background: rgba(99,102,241,0.25) !important;
      border-color: rgba(99,102,241,0.25) !important;
      color: #64748B !important;
      box-shadow: none !important;
    }
    :deep(.el-button--primary:not(:disabled):hover) {
      background: #8B5CF6 !important;
      border-color: #8B5CF6 !important;
      box-shadow: 0 0 16px rgba(139,92,246,0.4) !important;
    }
  }
}
</style>

<style lang="scss">
body:has(.voxel-page) .otp-dialog {
  .el-dialog {
    background: rgba(15,23,42,0.92) !important;
    border: 1px solid rgba(99,102,241,0.25) !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.08) !important;
    border-radius: 4px !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    margin-top: 10vh !important;
  }
  .el-overlay-dialog {
    background: rgba(0,0,0,0.6);
  }
  .el-dialog__header {
    border-bottom: 1px solid rgba(99,102,241,0.15) !important;
    padding: 14px 20px 0 !important;
  }
  .el-dialog__title {
    font-family: "SF Mono","Consolas",monospace !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    color: #E2E8F0 !important;
    letter-spacing: 0.5px;
  }
  .el-dialog__headerbtn {
    color: #94A3B8 !important;
    top: 12px !important; right: 16px !important;
  }
  .el-dialog__headerbtn:focus {
    color: #8B5CF6 !important;
  }
  .el-dialog__body {
    padding: 16px 20px 20px !important;
  }
  .otp-dialog-icon {
    background: rgba(99,102,241,0.12) !important;
    border: 1px solid rgba(99,102,241,0.3) !important;
    box-shadow: 0 0 12px rgba(99,102,241,0.15) !important;
    color: #8B5CF6 !important;
  }
  .otp-dialog-desc {
    color: #94A3B8 !important;
    font-size: 12px !important;
  }
  .otp-cell {
    height: 38px !important;
    font-family: "SF Mono","Consolas",monospace !important;
    font-size: 16px !important; font-weight: 700 !important;
    background: rgba(30,27,75,0.5) !important;
    color: #E2E8F0 !important;
    border: 1px solid rgba(99,102,241,0.25) !important;
    border-radius: 3px !important;
  }
  .otp-cell--filled {
    border-color: #8B5CF6 !important;
    background: rgba(99,102,241,0.08) !important;
    box-shadow: 0 0 8px rgba(139,92,246,0.2) !important;
  }
  .otp-cell--focused {
    border-color: #8B5CF6 !important;
    box-shadow: 0 0 0 2px rgba(139,92,246,0.2) !important;
  }
  .otp-cancel-text {
    color: #94A3B8 !important;
    font-size: 12px !important;
  }
  .otp-cancel-text:hover {
    color: #E2E8F0 !important;
  }
  .el-button--primary {
    background: #6366F1 !important;
    border: 1px solid #6366F1 !important;
    border-radius: 3px !important;
    font-family: "SF Mono","Consolas",monospace !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    color: #FFFFFF !important;
    letter-spacing: 1px;
    padding: 8px 20px !important;
    height: 32px !important;
    box-shadow: 0 0 12px rgba(99,102,241,0.3) !important;
  }
  .el-button--primary:disabled {
    background: rgba(99,102,241,0.25) !important;
    border-color: rgba(99,102,241,0.25) !important;
    color: #64748B !important;
    box-shadow: none !important;
  }
  .el-button--primary:not(:disabled):hover {
    background: #8B5CF6 !important;
    border-color: #8B5CF6 !important;
    box-shadow: 0 0 16px rgba(139,92,246,0.4) !important;
  }
}
</style>