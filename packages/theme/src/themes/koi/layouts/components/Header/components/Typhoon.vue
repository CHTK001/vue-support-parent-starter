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

  <ReDialog v-model="detailVisible" title="台风路径图" :width="920" :height="600" headless :footer-hidden="true" :fullscreen="false" destroy-on-close>
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
            :mapType="MapType.GAODE"
            :mapTile="MapTile.NORMAL"
            :map="{}"
            :mapKey="{}"
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
import { MapType, MapTile, ShapeType, genAsymRing, rotateRing, scaleRing } from "@repo/re-map";

const API_BASE = "https://typhoon.slt.zj.gov.cn/Api";

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
  /** 不对称风圈半径（公里），八方位：北/东北/东/东南/南/西南/西/西北
   *  浙水利 API 常见字段：r7==49（数组）或 r7NE/r7SE/r7SW/r7NW 等 */
  r7?: number[];
  r10?: number[];
  [key: string]: any;
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

/**
 * 从浙水利台风点数据中提取某级风圈的八方位半径数组
 *
 * 兼容多种字段形态（实测该 API 为管道分隔四方位字符串）：
 *  - `r7: "250|150|250|150"`（管道分隔 4 段 = 东北|东南|西南|西北）
 *  - `r7: [NE,SE,SW,NW]`（数组）
 *  - `r7: 80`（单一数值，四方向同半径）
 *  - `r7NE / r7SE / r7SW / r7NW`（四方向分开字段）
 *
 * @param p      原始点对象
 * @param level  风圈等级："7" 或 "10"
 * @returns 八方位半径数组 [北,东北,东,东南,南,西南,西,西北]；缺失方向用已有方向兜底，全部缺失返回 undefined
 */
function pickRadii(p: Record<string, any>, level: "7" | "10"): number[] | undefined {
  // 兼容 radius7 / r7 两种字段名（实测浙水利为 radius7/radius10）
  const raw = p?.[`radius${level}`] ?? p?.[`r${level}`];
  // 数组形态：[NE, SE, SW, NW]
  if (Array.isArray(raw)) {
    if (!raw.length) return undefined;
    const [ne, se, sw, nw] = raw.map((v) => Number(v) || 0);
    return [nw, (ne + nw) / 2, ne, (ne + se) / 2, se, (se + sw) / 2, sw, (nw + sw) / 2];
  }
  // 管道分隔字符串："NE|SE|SW|NW"
  if (typeof raw === "string" && raw.includes("|")) {
    const parts = raw.split("|").map((v) => Number(v.trim()));
    const ne = parts[0] ?? 0;
    const se = parts[1] ?? 0;
    const sw = parts[2] ?? 0;
    const nw = parts[3] ?? 0;
    if (!(ne || se || sw || nw)) return undefined;
    return [nw, (ne + nw) / 2, ne, (ne + se) / 2, se, (se + sw) / 2, sw, (nw + sw) / 2];
  }
  // 单一数值或数字字符串
  if (typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "")) {
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) return undefined;
    return [v, v, v, v, v, v, v, v];
  }
  // 四方向分开字段：r7NE/r7SE/r7SW/r7NW
  const ne = Number(p?.[`r${level}NE`] ?? 0);
  const se = Number(p?.[`r${level}SE`] ?? 0);
  const sw = Number(p?.[`r${level}SW`] ?? 0);
  const nw = Number(p?.[`r${level}NW`] ?? 0);
  if (!(ne || se || sw || nw)) return undefined;
  return [nw, (ne + nw) / 2, ne, (ne + se) / 2, se, (se + sw) / 2, sw, (nw + sw) / 2];
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
            r7: pickRadii(p, "7"),
            r10: pickRadii(p, "10"),
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
    stopRingAnimation();
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

  historyPath.value.forEach((p) => {
    rm.addMarker({
      position: [p.lat, p.lng] as [number, number],
      title: p.strong || "历史点",
      popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
        <b>历史位置</b><br>
        时间：${p.time}<br>
        强度：${p.strong || "-"}<br>
        风速：${p.speed != null ? p.speed + " km/h" : "-"}<br>
        气压：${p.pressure != null ? p.pressure + " hPa" : "-"}
      </div>`,
      data: { strong: p.strong },
      style: { color: "#4fc3f7", fillColor: "#4fc3f7" },
    });
  });
  forecastPath.value.forEach((p) => {
    rm.addMarker({
      position: [p.lat, p.lng] as [number, number],
      title: p.strong || "预测点",
      popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
        <b>预测位置</b><br>
        时间：${p.time}<br>
        强度：${p.strong || "-"}<br>
        风速：${p.speed != null ? p.speed + " km/h" : "-"}<br>
        气压：${p.pressure != null ? p.pressure + " hPa" : "-"}
      </div>`,
      data: { strong: p.strong },
      style: { color: "#ff7043", fillColor: "#ff7043" },
    });
  });

  // 当前位置特殊标记（历史路径最后一个点），默认自动弹出信息 tip
  const current = historyPath.value[historyPath.value.length - 1];
  if (current) {
    const currentId = rm.addMarker({
      position: [current.lat, current.lng] as [number, number],
      title: "当前位置",
      popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
        <b>台风当前位置</b><br>
        时间：${current.time}<br>
        强度：${current.strong || "-"}<br>
        风速：${current.speed != null ? current.speed + " km/h" : "-"}<br>
        气压：${current.pressure != null ? current.pressure + " hPa" : "-"}
      </div>`,
      data: { strong: current.strong },
      style: { color: "#ff0000", fillColor: "#ff0000" },
      icon: (window as any).L?.divIcon?.({
        className: "typhoon-current-icon",
        html: `<div class="typhoon-current">${current.strong || ""}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    });
    // 地图渲染就绪后自动打开当前位置的 popup tip
    nextTick(() => {
      try {
        rm.getMarker?.(currentId)?.openPopup?.();
      } catch { /* ignore */ }
    });
  }

  // 台风当前位置绘制不对称风圈（7 级 / 10 级，若有半径数据）
  if (current) {
    drawWindRings(rm, current);
  }

  // 自动定位：以【当前位置】为地图中心，缩放级别适配当前位置附近的视口（含风圈）
  if (current) {
    try {
      const mapInst = rm.getMapInstance?.() as any;
      if (mapInst) {
        // 根据当前位置的风圈半径估算需要覆盖的经纬度跨度，保证风圈完整可见且在中心
        const ringSpan = Math.max(
          ...(current.r7 ?? []).map(Number),
          ...(current.r10 ?? []).map(Number),
        ) || 0;
        // 1°纬度 ≈ 111km；经度需按纬度修正。取 maxRadiusKm * 1.4 作为半跨度（聚焦风圈）
        const maxRadiusKm = ringSpan;
        const degSpanLat = maxRadiusKm ? (maxRadiusKm * 1.4) / 111 : 2;
        const degSpanLng = maxRadiusKm
          ? (maxRadiusKm * 1.4) / (111 * Math.cos((current.lat * Math.PI) / 180))
          : 2;
        const L = (window as any).L;
        if (L?.latLngBounds) {
          const sw = L.latLng(current.lat - degSpanLat, current.lng - degSpanLng);
          const ne = L.latLng(current.lat + degSpanLat, current.lng + degSpanLng);
          mapInst.fitBounds(L.latLngBounds(sw, ne), { padding: [16, 16], maxZoom: 10 });
        } else {
          mapInst.setView([current.lat, current.lng], 7);
        }
        return;
      }
    } catch { /* fallback below */ }
  }
  const lats = allPoints.map((p) => p.lat);
  const lngs = allPoints.map((p) => p.lng);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats));
  const zoomLevel = span > 40 ? 4 : span > 20 ? 5 : span > 10 ? 6 : span > 5 ? 7 : 8;
  rm.setCenter(center[0], center[1]);
  rm.setZoom(zoomLevel);
}

/** 风圈动画句柄（rAF 循环），用于暂停/停止 */
let ringAnimRaf: number | null = null;
/** 风圈动画启动时间戳，用于计算旋转/脉动进度 */
let ringAnimStart = 0;

/**
 * 停止风圈动画
 */
function stopRingAnimation() {
  if (ringAnimRaf !== null) {
    cancelAnimationFrame(ringAnimRaf);
    ringAnimRaf = null;
  }
}

/**
 * 启动风圈旋转 + 脉动动画
 *
 * 用 rAF 驱动：每帧基于 base 环坐标计算旋转角与呼吸缩放，
 * 通过 re-map `updateShape` 实时更新坐标，形成顺时针旋转且半径呼吸的动画。
 */
function startRingAnimation(
  rm: any,
  center: [number, number],
  baseRings: { id: string; coords: [number, number][]; speed: number; breathe: number }[],
) {
  stopRingAnimation();
  ringAnimStart = performance.now();
  const duration = 8000; // 完整旋转一周时长(ms)
  const loop = () => {
    const t = performance.now() - ringAnimStart;
    baseRings.forEach((ring) => {
      // 旋转角：整体一周为 duration，多圈按各自速度
      const deg = (t / duration) * 360 * ring.speed;
      // 呼吸缩放：0.94 ~ 1.06
      const breathe = 1 + Math.sin((t / 1800) * ring.breathe) * 0.05;
      const rotated = rotateRing(ring.coords, center, deg);
      const scaled = scaleRing(rotated, center, breathe);
      rm.updateShape?.(ring.id, { coordinates: scaled });
    });
    ringAnimRaf = requestAnimationFrame(loop);
  };
  ringAnimRaf = requestAnimationFrame(loop);
}

/**
 * 绘制当前位置的不对称风圈（7 级 / 10 级）
 * 使用 turf 生成八方位不规则多边形；无半径数据时跳过。随后启动旋转+脉动动画。
 */
function drawWindRings(rm: any, p: TrackPoint) {
  const rings: { radii?: number[]; label: string; color: string; fillOpacity: number; speed: number; breathe: number }[] = [
    { radii: p.r10, label: "10级风圈", color: "#ff7043", fillOpacity: 0.12, speed: 1, breathe: 1 },
    { radii: p.r7, label: "7级风圈", color: "#4fc3f7", fillOpacity: 0.1, speed: -1, breathe: 1.4 },
  ];
  const center: [number, number] = [p.lat, p.lng];
  const baseRings: { id: string; coords: [number, number][]; speed: number; breathe: number }[] = [];
  rings.forEach((ring) => {
    if (!ring.radii || ring.radii.every((r) => !r)) return;
    const coords = genAsymRing(center, ring.radii as any, 10);
    const id = `typhoon-ring-${ring.label}`;
    rm.addShape({
      id,
      type: ShapeType.POLYGON,
      coordinates: coords,
      style: {
        color: ring.color,
        weight: 1.5,
        opacity: 0.8,
        fillColor: ring.color,
        fillOpacity: ring.fillOpacity,
      },
    });
    baseRings.push({ id, coords, speed: ring.speed, breathe: ring.breathe });
  });
  if (baseRings.length) {
    startRingAnimation(rm, center, baseRings);
  }
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
onBeforeUnmount(() => { stopRingAnimation(); stopWorker(); });
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

    // 隐藏右下角版权/坐标信息
    :deep(.leaflet-control-attribution) {
      display: none;
    }
    :deep(.leaflet-control-coordinate) {
      display: none;
    }
    :deep(.coordinate-panel) {
      display: none;
    }
    :deep(.leaflet-bottom) {
      display: none;
    }
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

.typhoon-current-icon {
  background: none !important;
  border: none !important;
}
.typhoon-current {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ff4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 0 0 4px rgba(255, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.3);
  animation: typhoon-current-pulse 2s ease-in-out infinite;
}
@keyframes typhoon-current-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(255, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(255, 68, 68, 0.15), 0 2px 8px rgba(0,0,0,0.3); }
}
</style>
