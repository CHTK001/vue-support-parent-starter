<template>
  <el-popover
    placement="bottom-end"
    :width="280"
    trigger="hover"
    :offset="10"
    popper-class="koi-typhoon-popover"
    :show-arrow="false"
  >
    <template #reference>
      <div v-if="activeList.length" class="typhoon-trigger" :title="`${activeList.length} 个活跃台风`">
        <svg class="typhoon-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path class="typhoon-icon__swirl" d="M12 12c0-2.5 1.8-4.5 4-4.5 2.2 0 4 2 4 4.5 0 2.5-1.8 4.5-4 4.5-3.2 0-5.5-2.5-5.5-5.5 0-3 2.5-5.5 5.5-5.5 3.7 0 6.5 3 6.5 6.5" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>
        </svg>
        <el-badge v-if="activeList.length > 1" :value="activeList.length" :max="99" class="typhoon-badge" />
      </div>
    </template>

    <div class="typhoon-panel">
      <div v-if="activeList.length" class="typhoon-list">
        <div
          v-for="t in activeList"
          :key="t.id"
          class="typhoon-item"
          @click="openDetail(t.id)"
        >
          <div class="typhoon-item__name">{{ t.name || t.id }}</div>
          <div class="typhoon-item__info">
            <span v-if="t.strong">强度：{{ t.strong }}</span>
            <span>查看详情 →</span>
          </div>
        </div>
      </div>
      <div v-else class="typhoon-empty">
        <span>当前无活跃台风</span>
      </div>
    </div>
  </el-popover>

  <ReDialog v-model="detailVisible" title="台风路径图" :width="820" :footer-hidden="true" :fullscreen="false" destroy-on-close>
    <template #content>
      <div v-loading="detailLoading" class="typhoon-detail">
        <div class="typhoon-detail__header">
          <span class="typhoon-detail__name">{{ detailInfo.name || detailInfo.id }}</span>
          <span class="typhoon-detail__info">{{ detailInfo.strong }}</span>
        </div>
        <div v-if="mergedPath.length >= 2" class="typhoon-detail__map">
        <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="typhoon-map">
          <defs>
            <linearGradient id="typhoonPathGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#4fc3f7" />
              <stop offset="100%" stop-color="#ff7043" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" :width="SVG_W" :height="SVG_H" class="typhoon-map__bg" rx="10" />
          <g v-html="gridLines.lines" />
          <g v-html="gridLines.labels" />
          <polyline :points="pathLine" class="typhoon-map__line" />
          <circle
            v-for="(d, i) in pathDots"
            :key="i"
            :cx="d.x"
            :cy="d.y"
            r="4"
            class="typhoon-map__dot"
            :class="{ 'is-history': i < (detailInfo.path?.length ?? 0) }"
          >
            <title>{{ d.time }} {{ d.strong }} 风速{{ d.speed }} 气压{{ d.pressure }}</title>
          </circle>
          <g class="typhoon-map__compass">
            <text x="${SVG_W - 70}" y="30" font-size="10" fill="#999">N</text>
            <path d="M${SVG_W - 60} 38 L${SVG_W - 60} 24 L${SVG_W - 56} 28 Z" fill="#666" />
          </g>
        </svg>
      </div>
        <div v-else-if="!detailLoading" class="typhoon-detail__empty">暂无路径数据</div>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, onBeforeUnmount } from "vue";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default()));

const API_BASE = "https://typhoon.slt.zj.gov.cn/Api";

interface TyphoonItem {
  id: string;
  name?: string;
  strong?: string;
  imageUrl?: string;
}

interface TrackPoint {
  time: string;
  lng: number;
  lat: number;
  strong?: string;
  power?: number;
  speed?: number;
  pressure?: number | string;
}

const activeList = ref<TyphoonItem[]>([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailInfo = ref<TyphoonItem & { path?: TrackPoint[]; forecast?: { tm: string; points: TrackPoint[] }[] }>({ id: "" });
let worker: Worker | null = null;

/** 获取活跃台风列表（接口为 UTF-8） */
async function fetchActiveList() {
  try {
    const res = await fetch(`${API_BASE}/TyhoonActivity`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      activeList.value = data.map((t: any) => ({
        id: t.tfid ?? t.id ?? t.typhoonId ?? t.code ?? "",
        name: t.name ?? t.typhoonName ?? "",
        strong: t.strong ?? t.level ?? "",
      })).filter((t: TyphoonItem) => t.id);
    }
  } catch { /* ignore */ }
}

/** 打开台风详情 */
async function openDetail(id: string) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const res = await fetch(`${API_BASE}/TyphoonInfo/${id}`);
    if (res.ok) {
      const data = await res.json();
      const path = Array.isArray(data.points)
        ? data.points.map((p: any) => ({
            time: p.time ?? "",
            lng: Number(p.lng ?? p.longitude ?? 0),
            lat: Number(p.lat ?? p.latitude ?? 0),
            strong: p.strong ?? "",
            power: p.power,
            speed: p.speed,
            pressure: p.pressure,
          }))
        : [];
      const forecast = Array.isArray(data.points) && data.points.length > 0
        ? (() => {
            const lastPoint = data.points[data.points.length - 1];
            const sources = Array.isArray(lastPoint.forecast) ? lastPoint.forecast : [];
            const cnSource = sources.find((f: any) => String(f.tm ?? "").includes("中国")) ?? sources[0];
            return cnSource && Array.isArray(cnSource.forecastpoints)
              ? [{ tm: cnSource.tm, points: cnSource.forecastpoints.map((fp: any) => ({
                  time: fp.time ?? "",
                  lng: Number(fp.lng ?? 0),
                  lat: Number(fp.lat ?? 0),
                  strong: fp.strong ?? "",
                  power: fp.power,
                  speed: fp.speed,
                  pressure: fp.pressure,
                })) }]
              : [];
          })()
        : [];
      detailInfo.value = {
        id: data.tfid ?? data.id ?? id,
        name: data.name ?? data.typhoonName ?? "",
        strong: data.points?.[0]?.strong ?? "",
        imageUrl: data.imageUrl ?? data.forecastImage ?? "",
        path,
        forecast,
      };
    }
  } catch { /* ignore */ }
  detailLoading.value = false;
}

/** 投影：将经纬度映射到 SVG 坐标系（横向为经度，纵向为纬度，纬度越大越靠上） */
const SVG_W = 760;
const SVG_H = 420;
const PAD = 50;

function projectPoint(p: TrackPoint): { x: number; y: number } {
  const lngs: number[] = [p.lng], lats: number[] = [p.lat];
  const all = [...(detailInfo.value.path ?? []), ...(detailInfo.value.forecast ?? []).flatMap((f) => f.points)];
  all.forEach((q) => { lngs.push(q.lng); lats.push(q.lat); });
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const spanLng = maxLng - minLng || 1;
  const spanLat = maxLat - minLat || 1;
  const x = PAD + ((p.lng - minLng) / spanLng) * (SVG_W - PAD * 2);
  const y = SVG_H - PAD - ((p.lat - minLat) / spanLat) * (SVG_H - PAD * 2);
  return { x, y };
}

/** 合成一条路径点（历史轨迹 + 第一个预报源的预测点） */
const mergedPath = computed<TrackPoint[]>(() => {
  const path = detailInfo.value.path ?? [];
  const firstForecastPoints = detailInfo.value.forecast?.[0]?.points ?? [];
  const points = [...path];
  if (firstForecastPoints.length) {
    firstForecastPoints.forEach((sp) => {
      const last = points[points.length - 1];
      if (!last || sp.time !== last.time) points.push(sp);
    });
  }
  return points;
});

/** 经纬度范围 */
const bounds = computed(() => {
  const lngs: number[] = [], lats: number[] = [];
  mergedPath.value.forEach((p) => { lngs.push(p.lng); lats.push(p.lat); });
  if (!lngs.length) return { minLng: 100, maxLng: 130, minLat: 20, maxLat: 35 };
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const margin = 5;
  return {
    minLng: Math.floor(minLng - margin),
    maxLng: Math.ceil(maxLng + margin),
    minLat: Math.floor(minLat - margin),
    maxLat: Math.ceil(maxLat + margin),
  };
});

/** 网格线（经纬度刻度线） */
const gridLines = computed(() => {
  const b = bounds.value;
  const lines: string[] = [];
  const linesStyle: string[] = [];
  // 经度线（垂直）
  const lngStep = Math.max(2, Math.floor((b.maxLng - b.minLng) / 6));
  for (let lng = b.minLng + lngStep; lng < b.maxLng; lng += lngStep) {
    const { x } = projectPoint({ time: "", lng, lat: (b.minLat + b.maxLat) / 2 } as TrackPoint);
    lines.push(`<line x1="${x}" y1="${PAD}" x2="${x}" y2="${SVG_H - PAD}" stroke="#e0e0e0" stroke-width="0.5" />`);
    linesStyle.push(`<text x="${x}" y="${SVG_H - PAD + 14}" text-anchor="middle" font-size="9" fill="#999">${lng}°</text>`);
  }
  // 纬度线（水平）
  const latStep = Math.max(1, Math.floor((b.maxLat - b.minLat) / 4));
  for (let lat = b.minLat + latStep; lat < b.maxLat; lat += latStep) {
    const { y } = projectPoint({ time: "", lng: (b.minLng + b.maxLng) / 2, lat } as TrackPoint);
    lines.push(`<line x1="${PAD}" y1="${y}" x2="${SVG_W - PAD}" y2="${y}" stroke="#e0e0e0" stroke-width="0.5" />`);
    linesStyle.push(`<text x="${PAD - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="#999">${lat}°</text>`);
  }
  return { lines: lines.join(""), labels: linesStyle.join("") };
});

/** 前进路径折线 */
const pathLine = computed(() => {
  const pts = mergedPath.value;
  if (pts.length < 2) return "";
  return pts.map((p) => {
    const { x, y } = projectPoint(p);
    return `${x},${y}`;
  }).join(" ");
});

/** 路径点（圆点） */
const pathDots = computed(() => mergedPath.value.map((p) => {
  const { x, y } = projectPoint(p);
  return { x, y, strong: p.strong, time: p.time, pressure: p.pressure, speed: p.speed };
}));

/** 启动 Worker 定时轮询 */
function startWorker() {
  if (worker) return;
  worker = new Worker(new URL("./typhoon.worker.ts", import.meta.url));
  worker.onmessage = () => {
    fetchActiveList();
  };
  worker.postMessage({ type: "start", interval: 3600000 });
}

function stopWorker() {
  if (worker) { worker.terminate(); worker = null; }
}

onMounted(() => {
  fetchActiveList();
  startWorker();
});

onBeforeUnmount(() => {
  stopWorker();
});
</script>

<style lang="scss" scoped>
.typhoon-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s ease, transform 0.3s ease;

  .typhoon-icon {
    color: #4fc3f7;
    filter: drop-shadow(0 0 4px rgba(79, 195, 247, 0.6));

    &__swirl {
      transform-origin: center;
      animation: typhoon-whirl 3s linear infinite;
    }
  }

  :deep(.typhoon-badge) {
    position: absolute;
    top: -2px;
    right: -2px;
  }

  :deep(.typhoon-badge .el-badge__content) {
    background: var(--el-color-danger);
    border: 2px solid var(--el-bg-color);
    transform: scale(0.9);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
}

@keyframes typhoon-whirl {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.typhoon-panel {
  padding: 12px;
  min-width: 0;
}

.typhoon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.typhoon-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.typhoon-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.typhoon-detail {
  min-height: 200px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__name {
    font-size: 18px;
    font-weight: 700;
  }

  &__info {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__map {
    width: 100%;
    border-radius: 10px;
    overflow: hidden;
  }

  &__empty {
    text-align: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);
  }
}

.typhoon-map {
  width: 100%;
  height: auto;

  &__bg {
    fill: var(--el-fill-color-lighter);
  }

  &__line {
    fill: none;
    stroke: url(#typhoonPathGrad);
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  &__dot {
    fill: #4fc3f7;
    stroke: #fff;
    stroke-width: 1.5;
    cursor: pointer;

    &.is-history {
      fill: #ff7043;
    }
  }
}
</style>

<style lang="scss">
.koi-typhoon-popover {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 14px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18) !important;
}
</style>