<template>
  <div class="client-info-widget">
    <div class="client-info-widget__header">
      <div class="client-info-widget__title">
        <el-icon><Monitor /></el-icon>
        <span>客户端信息</span>
      </div>
      <el-tag size="small" type="info" effect="plain">{{ onlineText }}</el-tag>
    </div>

    <div class="client-info-widget__body">
      <!-- 实时指标 -->
      <div class="client-info-widget__metrics">
        <div class="client-info-widget__metric">
          <div class="client-info-widget__metric-label">
            <el-icon><Cpu /></el-icon>
            <span>CPU 负载</span>
          </div>
          <el-progress
            type="dashboard"
            :percentage="perf.cpu"
            :width="64"
            :stroke-width="6"
            :color="perfColor(perf.cpu)"
          >
            <template #default>
              <span class="client-info-widget__metric-value" :style="{ color: perfColor(perf.cpu) }">
                {{ perf.cpu }}%
              </span>
            </template>
          </el-progress>
        </div>

        <div class="client-info-widget__metric">
          <div class="client-info-widget__metric-label">
            <el-icon><VideoPlay /></el-icon>
            <span>实时 FPS</span>
          </div>
          <el-progress
            type="dashboard"
            :percentage="fpsPercent"
            :width="64"
            :stroke-width="6"
            :color="perfColor(perf.fps)"
          >
            <template #default>
              <span class="client-info-widget__metric-value" :style="{ color: perfColor(perf.fps) }">
                {{ perf.fps }}
              </span>
            </template>
          </el-progress>
        </div>

        <div class="client-info-widget__metric">
          <div class="client-info-widget__metric-label">
            <el-icon><Odometer /></el-icon>
            <span>内存占用</span>
          </div>
          <el-progress
            type="dashboard"
            :percentage="memPercent"
            :width="64"
            :stroke-width="6"
            :color="perfColor(memPercent)"
          >
            <template #default>
              <span class="client-info-widget__metric-value" :style="{ color: perfColor(memPercent) }">
                {{ perf.memUsed }}M
              </span>
            </template>
          </el-progress>
        </div>
      </div>

      <!-- 公网 IP -->
      <div class="client-info-widget__ip">
        <div class="client-info-widget__ip-label">
          <el-icon><Position /></el-icon>
          <span>公网 IP</span>
        </div>
        <div class="client-info-widget__ip-value" v-loading="ipLoading">
          <span v-if="publicIp" class="client-info-widget__ip-text">{{ publicIp }}</span>
          <span v-else-if="ipError" class="client-info-widget__ip-offline">获取失败</span>
          <span v-else class="client-info-widget__ip-offline">获取中…</span>
          <el-button link type="primary" size="small" :disabled="ipLoading" @click="fetchPublicIp">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 浏览器与系统信息 -->
      <div class="client-info-widget__details">
        <div class="client-info-widget__row">
          <span class="client-info-widget__row-key">浏览器</span>
          <span class="client-info-widget__row-value">{{ browser }}</span>
        </div>
        <div class="client-info-widget__row">
          <span class="client-info-widget__row-key">系统</span>
          <span class="client-info-widget__row-value">{{ os }}</span>
        </div>
        <div class="client-info-widget__row">
          <span class="client-info-widget__row-key">分辨率</span>
          <span class="client-info-widget__row-value">{{ resolution }}</span>
        </div>
        <div class="client-info-widget__row">
          <span class="client-info-widget__row-key">设备内存</span>
          <span class="client-info-widget__row-value">{{ deviceMemoryText }}</span>
        </div>
        <div class="client-info-widget__row">
          <span class="client-info-widget__row-key">语言</span>
          <span class="client-info-widget__row-value">{{ language }}</span>
        </div>
        <div class="client-info-widget__row">
          <span class="client-info-widget__row-key">UA</span>
          <span class="client-info-widget__row-value client-info-widget__row-ua" :title="userAgent">
            {{ userAgent }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ClientInfoWidget">
/**
 * 客户端信息 widget
 *
 * 展示当前浏览端的实时性能指标与基础环境信息：
 *   - 实时指标：CPU 负载、实时 FPS、内存占用（dashborad 环形进度）
 *   - 公网 IP：通过 ipify 公共接口获取（失败可手动刷新）
 *   - 环境信息：浏览器 / 系统 / 分辨率 / 设备内存 / 语言 / UA
 *
 * 性能指标复用全局单例的 usePerfMonitor（同一 perf.worker + 同一套 rAF 循环），
 * 由引用计数保证全局只有一个 worker，本 widget 仅作为消费方订阅共享数据。
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  Cpu,
  Monitor,
  Odometer,
  Position,
  Refresh,
  VideoPlay,
} from "@element-plus/icons-vue";
import { usePerfMonitor } from "../../../layouts/components/ThemeConfig/components/usePerfMonitor";
import type { WidgetItem } from "../types";

/** 公网 IP 查询接口（ipify，无需鉴权，返回 JSON） */
const PUBLIC_IP_API = "https://api.ipify.org?format=json";

defineProps<{ widget: WidgetItem }>();

/** 订阅全局单例的性能数据（与布局 PerfMonitor 共享同一响应式对象） */
const { data: perf, startAll, stopAll } = usePerfMonitor();

/** 公网 IP 状态 */
const publicIp = ref("");
const ipLoading = ref(false);
const ipError = ref(false);

/** FPS 环形进度换算（上限 60） */
const fpsPercent = computed(() => Math.min(100, Math.round((perf.fps / 60) * 100)));

/** 内存占用百分比（无 total 时按 50% 兜底展示） */
const memPercent = computed(() => {
  if (!perf.memTotal) return 50;
  return Math.min(100, Math.round((perf.memUsed / perf.memTotal) * 100));
});

/** 网络在线状态 */
const onlineText = computed(() => (perf.networkStatus ? "在线" : "离线"));

/** 指标颜色分区：健康 / 一般 / 告警 */
function perfColor(value: number): string {
  if (value >= 80) return "var(--el-color-danger)";
  if (value >= 55) return "var(--el-color-warning)";
  return "var(--el-color-success)";
}

/** 获取公网 IP */
async function fetchPublicIp(): Promise<void> {
  ipLoading.value = true;
  ipError.value = false;
  try {
    const res = await fetch(PUBLIC_IP_API, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { ip: string };
    publicIp.value = data.ip;
  } catch {
    ipError.value = true;
    publicIp.value = "";
  } finally {
    ipLoading.value = false;
  }
}

/** 浏览器名称与版本 */
const browser = computed(() => parseUserAgent().browser);

/** 操作系统信息 */
const os = computed(() => parseUserAgent().os);

/** 屏幕分辨率 */
const resolution = computed(() => `${window.screen.width} × ${window.screen.height} (${window.screen.colorDepth}bit)`);

/** 设备内存 */
const deviceMemoryText = computed(() => {
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  return mem ? `${mem} GB` : "未知";
});

/** 语言 */
const language = computed(() => navigator.language || "未知");

/** 原始 UA */
const userAgent = computed(() => navigator.userAgent);

/** 解析 UA 得到浏览器与操作系统 */
function parseUserAgent(): { browser: string; os: string } {
  const ua = navigator.userAgent;
  let browser = "未知浏览器";
  let os = "未知系统";

  if (/Edg\//.test(ua)) browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ""}`;
  else if (/OPR\/|Opera/.test(ua)) browser = `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] ?? ""}`;
  else if (/Chrome\//.test(ua)) browser = `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ""}`;
  else if (/Firefox\//.test(ua)) browser = `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ""}`;
  else if (/Safari\//.test(ua)) browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ""}`;

  if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6\.1/i.test(ua)) os = "Windows 7";
  else if (/Mac OS X/.test(ua)) os = `macOS ${ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, ".") ?? ""}`;
  else if (/Linux/.test(ua)) os = "Linux";
  else if (/Android/.test(ua)) os = `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ""}`;
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";

  return { browser, os };
}

onMounted(() => {
  startAll();
  void fetchPublicIp();
});

onBeforeUnmount(() => {
  stopAll();
});
</script>

<style lang="scss" scoped>
.client-info-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.client-info-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.client-info-widget__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.client-info-widget__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 实时指标 */
.client-info-widget__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.client-info-widget__metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.client-info-widget__metric-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.client-info-widget__metric-value {
  font-size: 13px;
  font-weight: 600;
}

/* 公网 IP */
.client-info-widget__ip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.client-info-widget__ip-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.client-info-widget__ip-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}

.client-info-widget__ip-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.client-info-widget__ip-offline {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 环境信息 */
.client-info-widget__details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.client-info-widget__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.client-info-widget__row-key {
  flex-shrink: 0;
  width: 56px;
  color: var(--el-text-color-secondary);
}

.client-info-widget__row-value {
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-info-widget__row-ua {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>