<script setup lang="ts">
/**
 * 热力图设置组件（仅开发/测试环境）
 *
 * 记录用户点击热点，以热力图形式覆盖展示。
 * 设置项实时写入 appConfig.other.heatmap，由 config.ts 的 watch 自动持久化。
 */
import { message } from "@repo/core";
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { getConfig } from "@repo/config";
import type { HeatmapConfig } from "@repo/config";
import ReSwitch from "@repo/ui/re-switch";

import { Flag } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const appConfig = getConfig();
const heatmap = computed(() => appConfig.other.heatmap as HeatmapConfig);

/** 环境判断 */
const isDevOrTest = computed(() => {
  const env = appConfig.env?.env ?? "dev";
  return env === "dev" || env === "test";
});

// ==================== 热力图核心逻辑 ====================

/** 点击热点数据：{ x, y, timestamp, strength }[] */
interface HeatPoint {
  x: number;
  y: number;
  t: number;
}

const heatPoints: HeatPoint[] = [];
/** 热点数量（响应式，用于模板展示） */
const heatPointCount = ref(0);
let clickHandler: ((e: MouseEvent) => void) | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let rafId: number | null = null;

/** 创建 canvas 覆盖层 */
function ensureCanvas() {
  if (canvasEl) return;
  canvasEl = document.createElement("canvas");
  canvasEl.className = "devtools-heatmap-canvas";
  canvasEl.style.cssText = `
    position: fixed; inset: 0; z-index: 99996; pointer-events: none;
  `;
  document.body.appendChild(canvasEl);
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  startRender();
}

function resizeCanvas() {
  if (!canvasEl) return;
  canvasEl.width = window.innerWidth;
  canvasEl.height = window.innerHeight;
}

/** 开始点击记录 */
function attachClickRecorder() {
  if (clickHandler) return;
  clickHandler = (e: MouseEvent) => {
    heatPoints.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    // 保留最近 500 个热点
    if (heatPoints.length > 500) heatPoints.shift();
    heatPointCount.value = heatPoints.length;
  };
  document.addEventListener("click", clickHandler, { capture: true });
}

/** 停止记录 */
function detachClickRecorder() {
  if (clickHandler) {
    document.removeEventListener("click", clickHandler, { capture: true });
    clickHandler = null;
  }
}

/** 渲染热力图 */
function startRender() {
  const render = () => {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // 按位置聚类绘制径向渐变
    for (const p of heatPoints) {
      const age = Date.now() - p.t;
      const alpha = Math.max(0.1, 1 - age / 600000); // 10 分钟衰减
      const radius = 30;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      gradient.addColorStop(0, `rgba(239,68,68,${alpha * 0.8})`);
      gradient.addColorStop(0.5, `rgba(251,146,60,${alpha * 0.4})`);
      gradient.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    rafId = requestAnimationFrame(render);
  };
  render();
}

/** 移除热力图覆盖层 */
function removeCanvas() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (canvasEl) {
    canvasEl.remove();
    canvasEl = null;
  }
  window.removeEventListener("resize", resizeCanvas);
  detachClickRecorder();
  heatPoints.length = 0;
  heatPointCount.value = 0;
}

/** 清空热点数据 */
const clearHeatmap = () => {
  heatPoints.length = 0;
  heatPointCount.value = 0;
  message.success(t("heatmap.cleared"));
};

/** 监听开关 */
watch(
  () => heatmap.value.devHeatmap,
  (val) => {
    if (val) {
      ensureCanvas();
      attachClickRecorder();
    } else {
      removeCanvas();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => removeCanvas());
</script>

<template>
  <div v-if="isDevOrTest && heatmap.enable" class="config-section">
    <div class="section-header">
      <el-icon :size="18" class="section-icon"><Flag /></el-icon>
      <span class="section-title">{{ t("heatmap.title") }}</span>
      <span class="section-badge">DEV</span>
    </div>

    <div class="section-card">
      <ReSwitch layout="card"
        :title="t('heatmap.cover.title')"
        :sub="t('heatmap.cover.sub')"
        :tip="t('heatmap.cover.tip')"
        v-model="heatmap.devHeatmap"
      />

      <div v-if="heatmap.devHeatmap" class="heatmap-actions">
        <el-button plain @click="clearHeatmap">
          {{ t("heatmap.clear") }}
        </el-button>
        <span class="heatmap-hint">{{ t("heatmap.hint", { count: heatPointCount }) }}</span>
      </div>
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
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 4px;
}

.heatmap-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.heatmap-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.section-card {
  :deep(.re-switch-card) {
    margin-top: 10px;
  }
}
</style>
