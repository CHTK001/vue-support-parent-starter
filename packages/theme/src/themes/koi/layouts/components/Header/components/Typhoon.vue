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
          <image
            v-for="(tile, idx) in tiles"
            :key="idx"
            :x="tile.x"
            :y="tile.y"
            :width="tile.w"
            :height="tile.h"
            :href="tile.url"
            class="typhoon-map__tile"
          />
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
            <text x="22" y="28" font-size="11" font-weight="bold" fill="#333">N</text>
            <path d="M32 38 L32 16 L38 24 Z" fill="#333" />
          </g>
          <text x="${SVG_W - 8}" y="${SVG_H - 4}" text-anchor="end" font-size="9" fill="#999">
            数据：浙江海洋预警发布中心  |  地图：{{ mapProvider }}
          </text>
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
/** 天地图 Token（留空则自动降级 OpenStreetMap） */
const TIANDITU_TOKEN = "b98c6f2553536b0e5e26d03ffdb0f4da";

interface TyphoonItem {
  id: string;
  name?: string;
  strong?: string;
}

interface TrackPoint {
  time: string;
  lng: number;
  lat: number;
  strong?: string;
  speed?: number;
  pressure?: number | string;
}

const activeList = ref<TyphoonItem[]>([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailInfo = ref<TyphoonItem & { path?: TrackPoint[]; forecast?: { points: TrackPoint[] }[] }>({ id: "" });
let worker: Worker | null = null;

async function fetchActiveList() {
  try {
    const res = await fetch(`${API_BASE}/TyhoonActivity`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      activeList.value = data.map((t: any) => ({
        id: t.tfid ?? t.id ?? "",
        name: t.name ?? t.typhoonName ?? "",
        strong: t.strong ?? t.level ?? "",
      })).filter((t: TyphoonItem) => t.id);
    }
  } catch { /* ignore */ }
}

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
            speed: p.speed,
            pressure: p.pressure,
          }))
        : [];
      const forecast = Array.isArray(data.points) && data.points.length > 0
        ? (() => {
            const sources = Array.isArray(data.points[data.points.length - 1].forecast)
              ? data.points[data.points.length - 1].forecast
              : [];
            const src = sources.find((f: any) => String(f.tm ?? "").includes("中国")) ?? sources[0];
            return src && Array.isArray(src.forecastpoints)
              ? [{ points: src.forecastpoints.map((fp: any) => ({
                  time: fp.time ?? "",
                  lng: Number(fp.lng ?? 0),
                  lat: Number(fp.lat ?? 0),
                  strong: fp.strong ?? "",
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
        path,
        forecast,
      };
    }
  } catch { /* ignore */ }
  detailLoading.value = false;
}

/** === 地图瓦片投影（Web Mercator） === */
const SVG_W = 760;
const SVG_H = 420;
const PAD = 50;

/** 经纬度 → 连续瓦片坐标 */
function latLngToTile(lng: number, lat: number, zoom: number): { x: number; y: number } {
  const x = (lng + 180) / 360 * Math.pow(2, zoom);
  const latRad = lat * Math.PI / 180;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom);
  return { x, y };
}

/** 自动缩放：根据跨度选合适级别 */
const zoom = computed(() => {
  const b = bounds.value;
  const span = b.maxLng - b.minLng;
  if (span > 40) return 4;
  if (span > 20) return 5;
  if (span > 10) return 6;
  if (span > 5) return 7;
  return 8;
});

/** 合并路径 */
const mergedPath = computed<TrackPoint[]>(() => {
  const path = detailInfo.value.path ?? [];
  const firstPts = detailInfo.value.forecast?.[0]?.points ?? [];
  const pts = [...path];
  firstPts.forEach((sp) => {
    const last = pts[pts.length - 1];
    if (!last || sp.time !== last.time) pts.push(sp);
  });
  return pts;
});

/** 经纬度范围 */
const bounds = computed(() => {
  const lngs: number[] = [], lats: number[] = [];
  mergedPath.value.forEach((p) => { lngs.push(p.lng); lats.push(p.lat); });
  if (!lngs.length) return { minLng: 100, maxLng: 130, minLat: 20, maxLat: 35 };
  const m = 3;
  return {
    minLng: Math.min(...lngs) - m,
    maxLng: Math.max(...lngs) + m,
    minLat: Math.min(...lats) - m,
    maxLat: Math.max(...lats) + m,
  };
});

/** 瓦片范围 */
const tileRange = computed(() => {
  const z = zoom.value;
  const b = bounds.value;
  const tl = latLngToTile(b.minLng, b.maxLat, z);
  const br = latLngToTile(b.maxLng, b.minLat, z);
  return {
    minTileX: Math.floor(tl.x),
    maxTileX: Math.ceil(br.x),
    minTileY: Math.floor(tl.y),
    maxTileY: Math.ceil(br.y),
  };
});

/** 每片瓦片在 SVG 中的尺寸 */
const tileSvg = computed(() => {
  const tr = tileRange.value;
  const nx = tr.maxTileX - tr.minTileX + 1;
  const ny = tr.maxTileY - tr.minTileY + 1;
  return { w: (SVG_W - PAD * 2) / nx, h: (SVG_H - PAD * 2) / ny };
});

/** 瓦片列表 */
const tiles = computed(() => {
  const tr = tileRange.value;
  const sz = tileSvg.value;
  const z = zoom.value;
  const useTT = !!TIANDITU_TOKEN;
  const result: Array<{ x: number; y: number; w: number; h: number; url: string }> = [];
  for (let y = tr.minTileY; y <= tr.maxTileY; y++) {
    for (let x = tr.minTileX; x <= tr.maxTileX; x++) {
      const url = useTT
        ? `https://t${x % 8}.tianditu.gov.cn/img_w/wmts?tk=${TIANDITU_TOKEN}&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}`
        : `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      result.push({
        x: PAD + (x - tr.minTileX) * sz.w,
        y: PAD + (y - tr.minTileY) * sz.h,
        w: sz.w,
        h: sz.h,
        url,
      });
    }
  }
  return result;
});

const mapProvider = computed(() => (TIANDITU_TOKEN ? "天地图" : "OpenStreetMap"));

/** 经纬度 → SVG 坐标 */
function projectPoint(p: TrackPoint): { x: number; y: number } {
  const tile = latLngToTile(p.lng, p.lat, zoom.value);
  const tr = tileRange.value;
  const sz = tileSvg.value;
  return { x: PAD + (tile.x - tr.minTileX) * sz.w, y: PAD + (tile.y - tr.minTileY) * sz.h };
}

/** 路径折线 */
const pathLine = computed(() => {
  const pts = mergedPath.value;
  if (pts.length < 2) return "";
  return pts.map((p) => { const { x, y } = projectPoint(p); return `${x},${y}`; }).join(" ");
});

/** 路径圆点 */
const pathDots = computed(() => mergedPath.value.map((p) => {
  const { x, y } = projectPoint(p);
  return { x, y, strong: p.strong, time: p.time, pressure: p.pressure, speed: p.speed };
}));

function startWorker() {
  if (worker) return;
  worker = new Worker(new URL("./typhoon.worker.ts", import.meta.url));
  worker.onmessage = () => fetchActiveList();
  worker.postMessage({ type: "start", interval: 3600000 });
}
function stopWorker() {
  if (worker) { worker.terminate(); worker = null; }
}
onMounted(() => { fetchActiveList(); startWorker(); });
onBeforeUnmount(() => stopWorker());
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

  &__tile {
    opacity: 0.92;
    image-rendering: auto;
  }

  &__line {
    fill: none;
    stroke: url(#typhoonPathGrad);
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
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