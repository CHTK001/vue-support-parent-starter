<template>
  <div class="miw">
    <div v-if="!widget.hideTitle" class="miw__header">
      <div class="miw__title">
        <el-icon class="miw__title-icon"><Monitor /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
    </div>

    <div class="miw__body">
      <!-- 2×2 大卡：CPU / 内存 / 电池 / 本机电量与存储 -->
      <div class="miw__metrics">
        <div class="miw__metric">
          <div class="miw__metric-icon"><el-icon><Cpu /></el-icon></div>
          <div class="miw__metric-label">CPU</div>
          <div class="miw__metric-value" :style="{ color: loadColor(perf.cpu) }">{{ perf.cpu }}%</div>
          <div class="miw__metric-bar"><div class="miw__metric-bar-fill" :style="{ width: cpuPercent + '%' }" /></div>
        </div>
        <div class="miw__metric">
          <div class="miw__metric-icon"><el-icon><Odometer /></el-icon></div>
          <div class="miw__metric-label">内存</div>
          <div class="miw__metric-value">{{ memUsed }}M / {{ memTotal }}M</div>
          <div class="miw__metric-bar"><div class="miw__metric-bar-fill" :style="{ width: memPercent + '%' }" /></div>
        </div>
        <div class="miw__metric">
          <div class="miw__metric-icon"><el-icon :style="{ color: batteryColor }"><Histogram /></el-icon></div>
          <div class="miw__metric-label">电池</div>
          <div class="miw__metric-value" :style="{ color: batteryColor }">{{ batteryPercent }}%</div>
          <el-icon v-if="perf.batteryCharging" class="miw__charge"><Lightning /></el-icon>
        </div>
        <div class="miw__metric">
          <div class="miw__metric-icon"><el-icon><DataBoard /></el-icon></div>
          <div class="miw__metric-label">存储</div>
          <div class="miw__metric-value">{{ storageText }}</div>
        </div>
      </div>

      <div class="miw__status">
        <div class="miw__status-item">
          <span class="miw__status-k">网络</span>
          <span class="miw__status-v" :class="onlineClass">{{ onlineText }}</span>
        </div>
        <div class="miw__status-item">
          <span class="miw__status-k">分辨率</span>
          <span class="miw__status-v">{{ resolution }}</span>
        </div>
        <div class="miw__status-item">
          <span class="miw__status-k">设备内存</span>
          <span class="miw__status-v">{{ deviceMemoryText }}</span>
        </div>
        <div class="miw__status-item">
          <span class="miw__status-k">DOM 节点</span>
          <span class="miw__status-v">{{ perf.domNodes ?? "—" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="MachineInfoWidget">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Cpu, DataBoard, Histogram, Lightning, Monitor, Odometer } from "@element-plus/icons-vue";
import { usePerfMonitor } from "../../../layouts/components/ThemeConfig/components/usePerfMonitor";
import type { WidgetItem } from "../types";

const props = defineProps<{ widget: WidgetItem }>();

const { data: perf, startAll, stopAll } = usePerfMonitor();

/** 页面挂载期间一直在跑的 fps/网络/电池采样，取消时关 */
onMounted(() => {
  startAll();
  void estimateStorage();
});
onBeforeUnmount(() => {
  stopAll();
});

// ==================== 派生指标 ====================

const cpuPercent = computed(() => {
  const cpu = perf.cpu ?? 0;
  return Math.min(100, Math.max(0, cpu));
});

const memPercent = computed(() => {
  if (!perf.memTotal) return 0;
  return Math.min(100, Math.round((perf.memUsed / perf.memTotal) * 100));
});

const memUsed = computed(() => Math.round(perf.memUsed ?? 0));
const memTotal = computed(() => Math.round(perf.memTotal ?? 0));

const batteryPercent = computed(() => {
  if (perf.batteryLevel == null) return 0;
  return Math.round(perf.batteryLevel * 100);
});

const batteryColor = computed(() => {
  if (perf.batteryCharging) return "var(--el-color-success)";
  if (batteryPercent.value <= 20) return "var(--el-color-danger)";
  if (batteryPercent.value <= 50) return "var(--el-color-warning)";
  return "var(--el-color-success)";
});

const onlineText = computed(() => (perf.networkStatus ? "在线" : "离线"));
const onlineClass = computed(() => (perf.networkStatus ? "miw__status--on" : "miw__status--off"));

const resolution = computed(() => `${window.screen.width} x ${window.screen.height} (${window.screen.colorDepth}bit)`);

const deviceMemoryText = computed(() => {
  const m = (navigator as any)?.deviceMemory;
  return m ? `${m} GB` : "未知";
});

/** CPU 用量配色：同 ClientInfoWidget 的读法，保证看板颜色一致 */
function loadColor(v: number | undefined): string {
  if (v == null) return "var(--el-text-color-disabled)";
  if (v >= 80) return "var(--el-color-danger)";
  if (v >= 55) return "var(--el-color-warning)";
  return "var(--el-color-success)";
}

// ==================== 设备存储 ====================

/**
 * 本机存储（约等于“磁盘”用量）。
 *
 * <p>{@code navigator.storage.estimate()} 不承诺返回总配额（Chrome 的安卓/部分桌面会
 * 给 undefined），所以只展示已经用了多少（usage 字节），不够整数 KB 时不强行补位。</p>
 *
 * <p>不抛错：这个 API 可能不存在，也可能要求权限。</p>
 */
const storageUsed = ref<number | null>(null);

function estimateStorage(): void {
  const n = navigator as any;
  if (!n.storage || !n.storage.estimate) {
    storageUsed.value = null;
    return;
  }
  n.storage
    .estimate()
    .then((e: any) => {
      storageUsed.value = e?.usage ?? null;
    })
    .catch(() => {
      storageUsed.value = null;
    });
}

/** MB → 人类可读的字节数，默认不补位 */
function formatStorageText(): string {
  const bytes = storageUsed.value;
  if (bytes == null) return "—";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
}

const storageText = computed(() => formatStorageText());
</script>

<style lang="scss" scoped>
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.miw {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--koi-widget-bg, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}

.miw__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px 8px;
}

.miw__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.miw__title-icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.miw__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px;
  overflow: auto;
}

/* 指标块：2×2 网格，内存条用进度条展示趋势 */
.miw__metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.miw__metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
}

.miw__metric-icon {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.miw__metric-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.miw__metric-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.miw__charge {
  font-size: 12px;
  font-weight: 400;
}

.miw__metric-bar {
  width: 100%;
  height: 6px;
  background: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
  overflow: hidden;
}

.miw__metric-bar-fill {
  height: 100%;
  background: var(--el-color-primary);
  border-radius: inherit;
  transition: width var(--el-transition-duration, 0.2s);
}

.miw__status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.miw__status-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
}

.miw__status-k {
  width: 64px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.miw__status-v {
  min-width: 0;
  color: var(--el-text-color-primary);
}

.miw__status--on {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
}

.miw__status--off {
  color: var(--el-text-color-disabled);
  background: var(--el-fill-color-light);
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
}
</style>
