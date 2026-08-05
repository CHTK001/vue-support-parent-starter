<script setup lang="ts">
/**
 * 开发工具设置组件（仅开发/测试环境）
 *
 * 标尺 / 网格 / 悬停检查。
 * 设置项实时写入 appConfig.other.devTools，由 config.ts 的 watch 自动持久化。
 */
import { computed, watch } from "vue";
import { getConfig } from "@repo/config";
import type { DevToolsConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";
import { Tools } from "@element-plus/icons-vue";

const appConfig = getConfig();
const devTools = computed(() => appConfig.other.devTools as DevToolsConfig);

/** 环境判断 */
const isDevOrTest = computed(() => {
  const env = appConfig.env?.env ?? "dev";
  return env === "dev" || env === "test";
});

// ==================== 标尺 / 网格 / 悬停检查：动态注入/移除覆盖层 ====================

/** 标尺覆盖层元素引用 */
let rulerEl: HTMLDivElement | null = null;
/** 网格覆盖层元素引用 */
let gridEl: HTMLDivElement | null = null;

function ensureRuler() {
  if (rulerEl) return rulerEl;
  rulerEl = document.createElement("div");
  rulerEl.className = "devtools-ruler-overlay";
  rulerEl.style.cssText = `
    position: fixed; inset: 0; z-index: 99998; pointer-events: none;
    background-image:
      linear-gradient(90deg, transparent calc(100% - 1px), rgba(64,158,255,.25) 100%),
      linear-gradient(0deg, transparent calc(100% - 1px), rgba(64,158,255,.25) 100%);
    background-size: 50px 50px;
  `;
  document.body.appendChild(rulerEl);
  return rulerEl;
}

function removeRuler() {
  if (rulerEl) {
    rulerEl.remove();
    rulerEl = null;
  }
}

function ensureGrid() {
  if (gridEl) return gridEl;
  gridEl = document.createElement("div");
  gridEl.className = "devtools-grid-overlay";
  gridEl.style.cssText = `
    position: fixed; inset: 0; z-index: 99997; pointer-events: none;
    background-image:
      linear-gradient(rgba(103,194,58,.12) 1px, transparent 1px),
      linear-gradient(90deg, rgba(103,194,58,.12) 1px, transparent 1px);
    background-size: 8px 8px;
  `;
  document.body.appendChild(gridEl);
  return gridEl;
}

function removeGrid() {
  if (gridEl) {
    gridEl.remove();
    gridEl = null;
  }
}

watch(() => devTools.value.devRuler, (val) => (val ? ensureRuler() : removeRuler()), { immediate: true });
watch(() => devTools.value.devGrid, (val) => (val ? ensureGrid() : removeGrid()), { immediate: true });

// ==================== 悬停检查器 ====================
let hoverHandler: ((e: MouseEvent) => void) | null = null;
let hoverTooltip: HTMLDivElement | null = null;

function ensureHoverTooltip() {
  if (hoverTooltip) return hoverTooltip;
  hoverTooltip = document.createElement("div");
  hoverTooltip.className = "devtools-hover-tooltip";
  hoverTooltip.style.cssText = `
    position: fixed; z-index: 99999; pointer-events: none;
    padding: 6px 10px; border-radius: 6px; font-size: 12px;
    background: rgba(30,30,30,.92); color: #fff; max-width: 320px;
    box-shadow: 0 4px 12px rgba(0,0,0,.3); display: none;
    font-family: monospace; line-height: 1.5;
  `;
  document.body.appendChild(hoverTooltip);
  return hoverTooltip;
}

function attachHoverInspector() {
  if (hoverHandler) return;
  hoverHandler = (e: MouseEvent) => {
    const el = e.target as HTMLElement;
    if (!el || el === document.body) return;
    const tooltip = ensureHoverTooltip();
    const tag = el.tagName.toLowerCase();
    const cls = el.className?.toString().slice(0, 80) || "";
    const rect = el.getBoundingClientRect();
    tooltip.innerHTML = `
      <div>&lt;${tag}${cls ? ` class="${cls}"` : ""}&gt;</div>
      <div>${Math.round(rect.width)} × ${Math.round(rect.height)} px</div>
      <div>top: ${Math.round(rect.top)} left: ${Math.round(rect.left)}</div>
    `;
    tooltip.style.display = "block";
    tooltip.style.left = `${e.clientX + 16}px`;
    tooltip.style.top = `${e.clientY + 16}px`;
  };
  document.addEventListener("mousemove", hoverHandler);
}

function detachHoverInspector() {
  if (hoverHandler) {
    document.removeEventListener("mousemove", hoverHandler);
    hoverHandler = null;
  }
  if (hoverTooltip) {
    hoverTooltip.remove();
    hoverTooltip = null;
  }
}

watch(() => devTools.value.devHoverInspector, (val) => (val ? attachHoverInspector() : detachHoverInspector()), { immediate: true });
</script>

<template>
  <div v-if="isDevOrTest && devTools.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><Tools /></el-icon>
      <span class="section-title">开发工具</span>
      <span class="section-badge">DEV</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card"
        title="轻量调试"
        sub="总开关"
        tip="显示标尺、网格和悬停信息等调试辅助"
        v-model="devTools.devLiteTools"
      />

      <ReSwitch layout="card"
        title="标尺"
        sub="像素刻度"
        tip="在页面顶部和左侧显示像素标尺"
        v-model="devTools.devRuler"
      />

      <ReSwitch layout="card"
        title="网格"
        sub="布局辅助"
        tip="显示 8px 布局网格辅助对齐"
        v-model="devTools.devGrid"
      />

      <ReSwitch layout="card"
        title="悬停检查"
        sub="元素信息"
        tip="鼠标悬停显示元素标签、类名和尺寸"
        v-model="devTools.devHoverInspector"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-badge {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
}
</style>
