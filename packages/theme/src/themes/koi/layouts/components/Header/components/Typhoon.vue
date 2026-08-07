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

  <ReDialog v-model="detailVisible" title="台风路径图" :width="920" :height="600" :footer-hidden="true" :fullscreen="false" destroy-on-close>
    <template #content>
      <div v-loading="detailLoading" class="typhoon-detail">
        <div class="typhoon-detail__header">
          <span class="typhoon-detail__name">{{ detailInfo.name || detailInfo.id }}</span>
          <span class="typhoon-detail__info">{{ detailInfo.strong }}</span>
        </div>
        <div v-if="mergedPath.length >= 2" class="typhoon-detail__map">
          <ReMap
            ref="reMapRef"
            :height="500"
            :center="mapCenter"
            :zoom="6"
            :mapType="MapType.TIANDITU"
            :mapTile="MapTile.SATELLITE"
            :map="{}"
            :mapKey="{ key: TIANDITU_TOKEN }"
            :showToolbar="false"
            :coordinateOptions="{ showProjected: false }"
            @map-initialized="onMapInitialized"
          />
        </div>
        <div v-else-if="!detailLoading" class="typhoon-detail__empty">暂无路径数据</div>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, nextTick, onMounted, onBeforeUnmount, watch } from "vue";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default()));
import ReMap from "@repo/re-map";
import { MapType, MapTile, ShapeType } from "@repo/re-map";

const API_BASE = "https://typhoon.slt.zj.gov.cn/Api";
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
const reMapRef = ref<any>(null);
const mapReady = ref(false);
let worker: Worker | null = null;

const mapCenter = computed((): [number, number] => {
  const pts = mergedPath.value;
  if (!pts.length) return [28, 120];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
});

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

const historyPath = computed<TrackPoint[]>(() => {
  return detailInfo.value.path ?? [];
});

const forecastPath = computed<TrackPoint[]>(() => {
  return detailInfo.value.forecast?.[0]?.points ?? [];
});

function onMapInitialized() {
  mapReady.value = true;
  nextTick(() => {
    drawTyphoonPath();
  });
}

watch(mergedPath, () => {
  if (mapReady.value) {
    nextTick(() => {
      drawTyphoonPath();
    });
  }
});

watch(detailVisible, (visible) => {
  if (!visible && mapReady.value && reMapRef.value) {
    reMapRef.value.clearShapes?.();
    reMapRef.value.clearMarkers?.();
  }
});

function drawTyphoonPath() {
  if (!reMapRef.value) return;

  const rm = reMapRef.value;
  const allPoints = mergedPath.value;
  if (!allPoints.length) return;

  rm.clearShapes?.();
  rm.clearMarkers?.();

  const histCoords = historyPath.value
    .map((p) => [p.lat, p.lng] as [number, number]);
  const fcCoords = forecastPath.value
    .map((p) => [p.lat, p.lng] as [number, number]);

  if (histCoords.length >= 2) {
    rm.addShape({
      id: "typhoon-history",
      type: ShapeType.POLYLINE,
      coordinates: histCoords,
      style: {
        color: "#4fc3f7",
        weight: 4,
        opacity: 1,
      },
    });
  }

  if (fcCoords.length >= 2) {
    rm.addShape({
      id: "typhoon-forecast",
      type: ShapeType.POLYLINE,
      coordinates: fcCoords,
      style: {
        color: "#ff7043",
        weight: 3,
        opacity: 0.85,
        dashArray: "8 6",
      },
    });
  } else if (histCoords.length >= 2) {
    rm.addShape({
      id: "typhoon-path",
      type: ShapeType.POLYLINE,
      coordinates: histCoords,
      style: {
        color: "#4fc3f7",
        weight: 4,
        opacity: 1,
      },
    });
  }

  allPoints.forEach((p, i) => {
    const isHistory = i < historyPath.value.length;
    const markerStyle = isHistory
      ? { color: "#4fc3f7", fillColor: "#4fc3f7" }
      : { color: "#ff7043", fillColor: "#ff7043" };
    rm.addMarker({
      position: [p.lat, p.lng] as [number, number],
      title: p.strong || (isHistory ? "历史点" : "预测点"),
      popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
        <b>${isHistory ? "历史位置" : "预测位置"}</b><br>
        时间：${p.time}<br>
        强度：${p.strong || "-"}<br>
        风速：${p.speed != null ? p.speed + " km/h" : "-"}<br>
        气压：${p.pressure != null ? p.pressure + " hPa" : "-"}
      </div>`,
      data: { strong: p.strong },
      style: markerStyle,
    });
  });

  const allCoords = allPoints.map((p) => [p.lat, p.lng] as [number, number]);
  const last = allCoords[allCoords.length - 1];
  const pad = 3;
  const lats = allCoords.map((c) => c[0]);
  const lngs = allCoords.map((c) => c[1]);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats));
  const zoomLevel = span > 40 ? 4 : span > 20 ? 5 : span > 10 ? 6 : span > 5 ? 7 : 8;
  rm.setCenter(center[0], center[1]);
  rm.setZoom(zoomLevel);
}

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
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &__empty {
    text-align: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);
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
