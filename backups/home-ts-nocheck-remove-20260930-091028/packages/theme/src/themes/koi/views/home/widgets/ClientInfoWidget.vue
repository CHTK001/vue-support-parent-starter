<template>
  <div class="ciw">
    <div v-if="!widget.hideTitle" class="ciw__header">
      <div class="ciw__title">
        <el-icon class="ciw__title-icon"><Monitor /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <span class="ciw__status" :class="perf.networkStatus ? 'ciw__status--on' : 'ciw__status--off'">
        {{ onlineText }}
      </span>
    </div>

    <div class="ciw__body">
      <div class="ciw__metrics">
        <div class="ciw__metric">
          <div class="ciw__metric-icon"><el-icon><Cpu /></el-icon></div>
          <div class="ciw__metric-label">CPU</div>
          <div class="ciw__metric-value" :style="{ color: loadColor(perf.cpu) }">{{ perf.cpu }}%</div>
        </div>
        <div class="ciw__metric">
          <div class="ciw__metric-icon"><el-icon><VideoPlay /></el-icon></div>
          <div class="ciw__metric-label">FPS</div>
          <div class="ciw__metric-value" :style="{ color: healthColor(perf.fps) }">{{ perf.fps }}</div>
        </div>
        <div class="ciw__metric">
          <div class="ciw__metric-icon"><el-icon><Odometer /></el-icon></div>
          <div class="ciw__metric-label">内存</div>
          <div class="ciw__metric-value" :style="{ color: loadColor(memPercent) }">{{ perf.memUsed }}M</div>
        </div>
        <div class="ciw__metric">
          <div class="ciw__metric-icon"><el-icon :style="{ color: batteryColor }"><Histogram /></el-icon></div>
          <div class="ciw__metric-label">电池</div>
          <div class="ciw__metric-value" :style="{ color: batteryColor }">
            {{ batteryPercent }}%
            <el-icon v-if="perf.batteryCharging" class="ciw__charge"><Lightning /></el-icon>
          </div>
        </div>
      </div>

      <div class="ciw__ip">
        <div class="ciw__ip-label"><el-icon><Position /></el-icon> 公网 IP</div>
        <div class="ciw__ip-value" v-loading="ipLoading">
          <span v-if="publicIp" class="ciw__ip-text">{{ publicIp }}</span>
          <span v-else-if="ipError" class="ciw__ip-offline">获取失败</span>
          <span v-else class="ciw__ip-offline">获取中…</span>
          <button type="button" class="ciw__ip-refresh" :disabled="ipLoading" @click="fetchPublicIp">
            <el-icon><Refresh /></el-icon>
          </button>
        </div>
      </div>

      <div class="ciw__rows">
        <div class="ciw__row"><span class="ciw__row-k">浏览器</span><span class="ciw__row-v">{{ browser }}</span></div>
        <div class="ciw__row"><span class="ciw__row-k">系统</span><span class="ciw__row-v">{{ os }}</span></div>
        <div class="ciw__row"><span class="ciw__row-k">分辨率</span><span class="ciw__row-v">{{ resolution }}</span></div>
        <div class="ciw__row"><span class="ciw__row-k">设备内存</span><span class="ciw__row-v">{{ deviceMemoryText }}</span></div>
        <div class="ciw__row"><span class="ciw__row-k">语言</span><span class="ciw__row-v">{{ language }}</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ClientInfoWidget">
// @ts-nocheck

// @ts-nocheck
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Cpu, Histogram, Lightning, Monitor, Odometer, Position, Refresh, VideoPlay } from "@element-plus/icons-vue";
import { usePerfMonitor } from "../../../layouts/components/ThemeConfig/components/usePerfMonitor";
import type { WidgetItem } from "../types";

const props = defineProps<{ widget: WidgetItem }>();

const PUBLIC_IP_API = "https://api.ipify.org?format=json";
const { data: perf, startAll, stopAll } = usePerfMonitor();

const publicIp = ref("");
const ipLoading = ref(false);
const ipError = ref(false);

const fpsPercent = computed(() => {
  if (!perf.fps) return 0;
  return Math.min(100, Math.round((perf.fps / 60) * 100));
});
const memPercent = computed(() => {
  if (!perf.memTotal) return 0;
  return Math.min(100, Math.round((perf.memUsed / perf.memTotal) * 100));
});
const batteryPercent = computed(() => {
  if (perf.batteryLevel == null) return 0;
  return Math.round(perf.batteryLevel * 100);
});
const onlineText = computed(() => perf.networkStatus ? "在线" : "离线");

const batteryColor = computed(() => {
  if (perf.batteryCharging) return "var(--el-color-success)";
  if (batteryPercent.value <= 20) return "var(--el-color-danger)";
  if (batteryPercent.value <= 50) return "var(--el-color-warning)";
  return "var(--el-color-success)";
});

function loadColor(v: number): string {
  if (v >= 80) return "var(--el-color-danger)";
  if (v >= 55) return "var(--el-color-warning)";
  return "var(--el-color-success)";
}

function healthColor(v: number): string {
  if (v >= 55) return "var(--el-color-success)";
  if (v >= 30) return "var(--el-color-warning)";
  return "var(--el-color-danger)";
}

async function fetchPublicIp(): Promise<void> {
  ipLoading.value = true;
  ipError.value = false;
  try {
    const res = await fetch(PUBLIC_IP_API, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = (await res.json()) as { ip: string };
    publicIp.value = json.ip;
  } catch { ipError.value = true; publicIp.value = ""; }
  finally { ipLoading.value = false; }
}

const browser = computed(() => parseUserAgent().browser);
const os = computed(() => parseUserAgent().os);
const resolution = computed(() => window.screen.width + " x " + window.screen.height + " (" + window.screen.colorDepth + "bit)");
const deviceMemoryText = computed(() => { const m = (navigator as any).deviceMemory; return m ? m + " GB" : "未知"; });
const language = computed(() => navigator.language || "未知");

function parseUserAgent(): { browser: string; os: string } {
  const ua = navigator.userAgent;
  let browser = "未知浏览器", os = "未知系统";
  if (/Edg\//.test(ua)) browser = "Edge " + (ua.match(/Edg\/([\d.]+)/)?.[1] ?? "");
  else if (/Chrome\//.test(ua)) browser = "Chrome " + (ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "");
  else if (/Firefox\//.test(ua)) browser = "Firefox " + (ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "");
  else if (/Safari\//.test(ua)) browser = "Safari " + (ua.match(/Version\/([\d.]+)/)?.[1] ?? "");
  if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
  else if (/Mac OS X/.test(ua)) os = "macOS " + (ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, ".") ?? "");
  else if (/Linux/.test(ua)) os = "Linux";
  else if (/Android/.test(ua)) os = "Android " + (ua.match(/Android ([\d.]+)/)?.[1] ?? "");
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  return { browser, os };
}

onMounted(() => { startAll(); void fetchPublicIp(); });
onBeforeUnmount(() => { stopAll(); });
</script>

<style lang="scss" scoped>
.ciw {
  display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 12px; overflow: hidden;
}
.ciw__header {
  display: flex; align-items: center; justify-content: space-between; padding: 14px 16px;
}
.ciw__title {
  font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); display: inline-flex; align-items: center; gap: 8px;
}
.ciw__title-icon { color: var(--el-color-primary); }
.ciw__status {
  font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 500;
}
.ciw__status--on { background: color-mix(in srgb, var(--el-color-success) 12%, transparent); color: var(--el-color-success); }
.ciw__status--off { background: var(--el-fill-color-light); color: var(--el-text-color-disabled); }
.ciw__body { flex: 1; min-height: 0; overflow: auto; padding: 0 14px 14px; display: flex; flex-direction: column; gap: 12px; }
.ciw__metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.ciw__metric { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 4px; background: var(--el-fill-color-light); border-radius: 10px; }
.ciw__metric-icon { font-size: 16px; color: var(--el-text-color-secondary); }
.ciw__metric-label { font-size: 10px; color: var(--el-text-color-secondary); font-weight: 500; }
.ciw__metric-value { font-size: 14px; font-weight: 700; display: inline-flex; align-items: center; gap: 2px; }
.ciw__charge { font-size: 10px; color: var(--el-color-success); }
.ciw__ip { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--el-fill-color-light); border-radius: 10px; }
.ciw__ip-label { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--el-text-color-secondary); }
.ciw__ip-value { display: flex; align-items: center; justify-content: space-between; min-height: 28px; }
.ciw__ip-text { font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.ciw__ip-offline { font-size: 12px; color: var(--el-text-color-disabled); }
.ciw__ip-refresh { display: flex; padding: 4px; border: none; border-radius: 6px; background: transparent; color: var(--el-color-primary); cursor: pointer; }
.ciw__rows { display: flex; flex-direction: column; gap: 1px; background: var(--el-fill-color-light); border-radius: 10px; overflow: hidden; }
.ciw__row { display: flex; align-items: baseline; gap: 8px; padding: 8px 14px; font-size: 12px; background: var(--el-bg-color); }
.ciw__row:first-child { border-radius: 10px 10px 0 0; }
.ciw__row:last-child { border-radius: 0 0 10px 10px; }
.ciw__row-k { width: 64px; flex-shrink: 0; color: var(--el-text-color-secondary); }
.ciw__row-v { color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>