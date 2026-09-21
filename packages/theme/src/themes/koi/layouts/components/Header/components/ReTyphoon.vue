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
        <ReIcon name="mingcute:typhoon-line" :size="20" class="typhoon-icon" />
        <el-badge v-if="activeList.length" :value="activeList.length" :max="99" class="typhoon-badge" />
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
      <div class="typhoon-detail">
        <!-- 左上角：活跃台风切换列表（脱离 flex，独立锚定） -->
        <div v-if="activeList.length > 1" class="typhoon-detail__sidebar">
          <ul class="typhoon-detail__sidebar-list">
            <li
              v-for="t in activeList"
              :key="t.id"
              class="typhoon-detail__sidebar-item"
              :class="{ 'is-active': selectedId === t.id }"
              :title="`${t.name || t.id}${t.strong ? ' · ' + t.strong : ''}`"
              @click="selectTyphoon(t.id)"
            >
              <span class="typhoon-detail__sidebar-dot"></span>
              <span class="typhoon-detail__sidebar-name">{{ t.name || t.id }}</span>
            </li>
          </ul>
        </div>

        <!-- 地图（v-loading 只作用于地图，不影响 sidebar） -->
        <div v-loading="detailLoading" class="typhoon-detail__map">
          <!-- 顶部工具条：显示/隐藏路径点 -->
          <div class="typhoon-toolbar">
            <el-switch
              v-model="showTrackPoints"
              size="small"
              active-text="显示点位"
              inactive-text="仅路线"
              inline-prompt
              style="--el-switch-border-color: var(--el-border-color)"
              @change="onViewOptionChange"
            />
          </div>
          <ReMap
            v-if="mergedPath.length >= 2"
            ref="reMapRef"
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
          <!-- 风圈级别图例：替代随风圈公转的文字标签，避免遮挡 -->
          <ul class="typhoon-legend" aria-label="风圈级别图例">
            <li class="typhoon-legend__item">
              <span class="typhoon-legend__dot" style="background:#fb923c"></span>
              <span>10级风圈</span>
            </li>
            <li class="typhoon-legend__item">
              <span class="typhoon-legend__dot" style="background:#38bdf8"></span>
              <span>7级风圈</span>
            </li>
            <li class="typhoon-legend__item">
              <span class="typhoon-legend__line" style="color:#38bdf8"></span>
              <span>历史路径</span>
            </li>
            <li class="typhoon-legend__item">
              <span class="typhoon-legend__line typhoon-legend__line--dashed" style="color:#fb923c"></span>
              <span>预报路径</span>
            </li>
          </ul>
        </div>
        <div v-if="!mergedPath.length && !detailLoading" class="typhoon-detail__empty">暂无路径数据</div>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
import { ref, computed, defineAsyncComponent, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
import { createScheduler, type Scheduler } from "@repo/work";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default));
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default));
import ReMap from "@repo/re-map";
import { MapType, MapTile, ShapeType, genAsymRing4, scaleRing } from "@repo/re-map";
import { log } from "@repo/utils";
import {
  getActiveTyphoonList,
  getTyphoonDetail,
  type TrackPoint,
  type TyphoonDetail,
  type TyphoonItem,
} from "@repo/core";

const activeList = ref<TyphoonItem[]>([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailInfo = ref<TyphoonDetail>({ id: "", path: [], forecast: [] });
const selectedId = ref<string>("");
const reMapRef = ref<any>(null);
const mapReady = ref(false);
/** 是否显示路径点位（历史点/预测点 marker）；关闭后只保留路径线，台风当前位置点不受影响 */
const showTrackPoints = ref(true);
let worker: Worker | null = null;
/** 统一后台调度器（优先级：Service Worker → Web Worker → setInterval） */
let scheduler: Scheduler | null = null;

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

/** 契约时间（yyyy-MM-ddTHH:mm）→ 气泡展示串 */
function showTime(value?: string) {
  return value ? value.replace("T", " ") : "-";
}

async function fetchActiveList() {
  activeList.value = await getActiveTyphoonList();
}

/**
 * 拉取单个台风的路径与预报，写入 detailInfo
 *
 * 后台优先、三方兜底的链路选择与风圈字段归一化都在 @repo/core 完成。
 */
async function fetchTyphoonDetail(id: string) {
  detailLoading.value = true;
  try {
    detailInfo.value = await getTyphoonDetail(id);
  } catch (e) {
    log.warn("ReTyphoon", `台风 ${id} 详情获取失败`, e);
    detailInfo.value = { id, path: [], forecast: [] };
  } finally {
    detailLoading.value = false;
  }
}

/**
 * 切换详情弹窗中的台风（弹窗左上角列表点击）
 * 仅切换 selectedId 与 detailInfo，不弹/关弹窗
 */
async function selectTyphoon(id: string) {
  if (!id || id === selectedId.value) return;
  selectedId.value = id;
  await fetchTyphoonDetail(id);
}

/**
 * 打开 ReDialog 详情
 * 默认显示 activeList 第一项；弹窗左上角列表可切换其他台风
 */
async function openDetail(id?: string) {
  const target = id ?? activeList.value[0]?.id;
  if (!target) return;
  detailVisible.value = true;
  await fetchTyphoonDetail(target);
  selectedId.value = target;
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

/**
 * 视图选项变更（显示点位开关）：触发台风路径重绘。
 * 关闭弹窗期间不响应（避免空指针）；仅当地图已就绪且有路径数据时生效。
 */
function onViewOptionChange() {
  if (!mapReady.value || !detailVisible.value) return;
  if (!mergedPath.value.length) return;
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
        color: "#38bdf8",
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
        color: "#fb923c",
        weight: 3,
        opacity: 0.9,
        dashArray: "10 6",
      },
    });
  } else if (histCoords.length >= 2) {
    rm.addShape({
      id: "typhoon-path",
      type: ShapeType.POLYLINE,
      coordinates: histCoords,
      style: {
        color: "#38bdf8",
        weight: 4,
        opacity: 1,
      },
    });
  }

  // 历史/预测点位 marker：开关关闭时隐藏（台风当前位置 marker 由下方单独绘制，始终保留）
  if (showTrackPoints.value) {
    const r = 5;
    historyPath.value.forEach((p) => {
      rm.addMarker({
        position: [p.lat, p.lng] as [number, number],
        title: p.strong || "历史点",
        popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
          <b>历史位置</b><br>
          时间：${showTime(p.time)}<br>
          强度：${p.strong || "-"}<br>
          风速：${p.speed != null ? p.speed + " km/h" : "-"}<br>
          气压：${p.pressure != null ? p.pressure + " hPa" : "-"}
        </div>`,
        data: { strong: p.strong },
        style: { color: "#38bdf8", fillColor: "#38bdf8" },
        icon: (window as any).L?.divIcon?.({
          className: "typhoon-track-marker",
          html: `<div class="typhoon-track-marker__dot" style="width:${r}px;height:${r}px;background:#38bdf8"></div>`,
          iconSize: [r, r],
          iconAnchor: [r / 2, r / 2],
        }),
      });
    });
    forecastPath.value.forEach((p) => {
      rm.addMarker({
        position: [p.lat, p.lng] as [number, number],
        title: p.strong || "预测点",
        popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
          <b>预测位置</b><br>
          时间：${showTime(p.time)}<br>
          强度：${p.strong || "-"}<br>
          风速：${p.speed != null ? p.speed + " km/h" : "-"}<br>
          气压：${p.pressure != null ? p.pressure + " hPa" : "-"}
        </div>`,
        data: { strong: p.strong },
        style: { color: "#fb923c", fillColor: "#fb923c" },
        icon: (window as any).L?.divIcon?.({
          className: "typhoon-track-marker",
          html: `<div class="typhoon-track-marker__dot" style="width:${r}px;height:${r}px;background:#fb923c"></div>`,
          iconSize: [r, r],
          iconAnchor: [r / 2, r / 2],
        }),
      });
    });
  }

  // 当前位置特殊标记（历史路径最后一个点），默认自动弹出信息 tip
  const current = historyPath.value[historyPath.value.length - 1];
  if (current) {
    const currentId = rm.addMarker({
      position: [current.lat, current.lng] as [number, number],
      title: "当前位置",
      popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
        <b>台风当前位置</b><br>
        时间：${showTime(current.time)}<br>
        强度：${current.strong || "-"}<br>
        风速：${current.speed != null ? current.speed + " km/h" : "-"}<br>
        气压：${current.pressure != null ? current.pressure + " hPa" : "-"}
      </div>`,
      data: { strong: current.strong },
      style: { color: "#38bdf8", fillColor: "#38bdf8" },
      icon: (window as any).L?.divIcon?.({
        className: "typhoon-current-icon",
        html: `<div class="typhoon-current">
          <svg class="typhoon-current__svg" viewBox="0 0 44 44" width="44" height="44">
            <circle cx="22" cy="22" r="18" fill="#e0f2fe" opacity="0.6"/>
            <circle cx="22" cy="22" r="14" fill="#bae6fd" opacity="0.5"/>
            <circle cx="22" cy="22" r="10" fill="#7dd3fc" opacity="0.4"/>
            <circle cx="22" cy="22" r="6" fill="#ffffff" stroke="#38bdf8" stroke-width="1.5"/>
            <circle cx="22" cy="22" r="2.5" fill="#0ea5e9"/>
          </svg>
          <span class="typhoon-current__label">${current.strong || ""}</span>
        </div>`,
        iconSize: [48, 56],
        iconAnchor: [24, 28],
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

/**
 * 已知中心、初始方位角(度)、距离(km)、旋转偏移(度)，算当前经纬度。
 * 用于在风圈内固定方位放置文字标签。
 */
function offsetLatLng(
  center: [number, number],
  bearingDeg: number,
  distKm: number,
  rotDeg = 0,
): [number, number] {
  const [lat, lng] = center;
  const ang = ((bearingDeg + rotDeg) * Math.PI) / 180;
  // 1° 纬度 ≈ 111km；经度按 cos(lat) 修正
  const dLat = (distKm * Math.sin(ang)) / 111;
  const dLng = (distKm * Math.cos(ang)) / (111 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  return [lat + dLat, lng + dLng];
}

/**
 * 绘制当前位置的不对称风圈（7 级 / 10 级）
 * 使用 genAsymRing4 基于四方位（东北/东南/西南/西北）生成多边形，与浙水利原始报文一致；
 * 无半径数据时跳过。随后启动旋转+脉动动画。
 *
 * 同时在每个风圈内固定位置放一个级别文字（"10级"/"7级"），文字位置不随圈旋转，
 * 这样既能直接看出哪个圈对应哪个级别，又不会像早期版本那样绕台风中心公转产生视觉噪声。
 */
function drawWindRings(rm: any, p: TrackPoint) {
  const rings: { radii?: [number, number, number, number]; label: string; level: string; color: string; fillOpacity: number; innerRings: { scale: number; color: string; opacity: number }[] }[] = [
    {
      radii: p.r10,
      label: "10级风圈",
      level: "10级",
      color: "#fb923c",
      fillOpacity: 0.12,
      innerRings: [
        { scale: 0.85, color: "#fdba74", opacity: 0.09 },
        { scale: 0.7, color: "#fed7aa", opacity: 0.06 },
        { scale: 0.55, color: "#ffedd5", opacity: 0.035 },
        { scale: 0.4, color: "#fff7ed", opacity: 0.018 },
      ],
    },
    {
      radii: p.r7,
      label: "7级风圈",
      level: "7级",
      color: "#38bdf8",
      fillOpacity: 0.1,
      innerRings: [
        { scale: 0.85, color: "#7dd3fc", opacity: 0.075 },
        { scale: 0.7, color: "#bae6fd", opacity: 0.045 },
        { scale: 0.55, color: "#e0f2fe", opacity: 0.025 },
        { scale: 0.4, color: "#f0f9ff", opacity: 0.012 },
      ],
    },
  ];
  const center: [number, number] = [p.lat, p.lng];
  rings.forEach((ring) => {
    if (!ring.radii || ring.radii.every((r) => !r)) return;
    const coords = genAsymRing4(center, ring.radii, 64);
    const id = `typhoon-ring-${ring.label}`;
    // 主风圈：柔和描边 + 通透填充
    rm.addShape({
      id,
      type: ShapeType.POLYGON,
      coordinates: coords,
      style: {
        color: ring.color,
        weight: 1.5,
        opacity: 0.6,
        fillColor: ring.color,
        fillOpacity: ring.fillOpacity,
      },
    });

    // 内侧多层渐变环：模拟柔和径向渐变淡出
    ring.innerRings.forEach((inner, idx) => {
      const innerCoords = scaleRing(coords, center, inner.scale);
      const innerId = `${id}-inner-${idx}`;
      rm.addShape({
        id: innerId,
        type: ShapeType.POLYGON,
        coordinates: innerCoords,
        style: {
          color: "transparent",
          weight: 0,
          opacity: 0,
          fillColor: inner.color,
          fillOpacity: inner.opacity,
        },
      });
    });

    // 在风圈内固定方位放级别文字标签
    const maxR = Math.max(...ring.radii.map((r) => Number(r) || 0));
    if (maxR > 0) {
      rm.addMarker({
        position: offsetLatLng(center, 0, maxR * 0.55) as [number, number],
        icon: (window as any).L?.divIcon?.({
          className: "typhoon-ring-label-icon",
          html: `<div class="typhoon-ring-label" style="--ring-color:${ring.color}">${ring.level}</div>`,
          iconSize: [44, 18],
          iconAnchor: [22, 9],
        }),
        data: { ringLabel: ring.label },
      });
    }
  });
}

function startWorker() {
  if (scheduler) return;
  scheduler = createScheduler({
    name: "typhoon",
    interval: 3600000,
    onTick: fetchActiveList,
  });
  scheduler.start();
}
function stopWorker() {
  if (scheduler) { scheduler.destroy(); scheduler = null; }
}
onMounted(() => { fetchActiveList(); startWorker(); });
onBeforeUnmount(() => { stopWorker(); });
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
    color: #38bdf8;
    filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.5));
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
  gap: 6px;
  padding: 12px 14px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-7);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    span:last-child {
      color: var(--el-color-primary);
      font-weight: 500;
    }
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
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
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
    position: relative;
    flex: 1;
    min-height: 0;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;

    :deep(.sc-map) {
      height: 100% !important;
      min-height: 0;
    }
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

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

  // 左上角悬浮列表（锚定到 .typhoon-detail，不受 flex/map 重排影响）
  &__sidebar {
    position: absolute;
    top: 14px;
    left: 14px;
    z-index: 600;
    width: auto;
    max-width: 260px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }

  &__sidebar-list {
    display: flex;
    flex-direction: row;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 4px;
  }

  &__sidebar-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 12px;
    color: var(--el-text-color-primary);

    &:hover {
      background: var(--el-fill-color-light);
    }

    &.is-active {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 600;
      box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);
    }
  }

  &__sidebar-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-info);
    flex-shrink: 0;

    .is-active & {
      background: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }

  &__sidebar-name {
    line-height: 1.2;
  }
}
</style>

<style lang="scss">
.koi-typhoon-popover {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  border-radius: 16px !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18) !important;
  backdrop-filter: blur(10px);
}

.typhoon-current-icon {
  background: none !important;
  border: none !important;
}
// 路径点 marker（历史点/预测点）：透明背景 divIcon，内部小圆点带白色描边，
// 既不阻挡地图交互，又能让圆点在线条上更显眼
.typhoon-track-marker {
  background: none !important;
  border: none !important;
  pointer-events: auto;
}
.typhoon-track-marker__dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.4);
  }
}
.typhoon-current {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 44px;
  height: 56px;

  &__svg {
    display: block;
    width: 44px;
    height: 44px;
    filter: drop-shadow(0 2px 6px rgba(56, 189, 248, 0.3));
  }

  &__label {
    margin-top: 2px;
    padding: 1px 7px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.95);
    color: #0ea5e9;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
}

// 风圈级别文字标签（"10级" / "7级"）：放在风圈内固定方位，不绕台风中心公转
.typhoon-ring-label-icon {
  background: none !important;
  border: none !important;
  pointer-events: none; // 不阻挡地图交互
}
.typhoon-ring-label {
  --ring-color: #38bdf8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 18px;
  padding: 0 7px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ring-color);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  box-shadow: 0 0 0 1px var(--ring-color), 0 2px 5px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(2px);
}

// 视图工具条（顶部居中）：仅一个开关，控制路径点位显隐
.typhoon-toolbar {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  color: var(--el-text-color-primary);
  backdrop-filter: blur(10px);
}
// 开关形状改为方形（Element Plus 默认是胶囊形）
.typhoon-toolbar :deep(.el-switch__core) {
  border-radius: 4px;
}
.typhoon-toolbar :deep(.el-switch__core .el-switch__action) {
  border-radius: 3px;
}
// 风圈级别 / 路径 图例（替代随风圈公转的标签，固定在地图右下角）
.typhoon-legend {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 12px 14px;
  list-style: none;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  color: var(--el-text-color-primary);
  pointer-events: none; // 不阻挡地图交互
  backdrop-filter: blur(10px);
}
.typhoon-legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.typhoon-legend__dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  opacity: 0.75;
}
.typhoon-legend__line {
  display: inline-block;
  width: 18px;
  height: 3px;
  border-radius: 1.5px;
  background: currentColor;
  opacity: 0.9;
}
.typhoon-legend__line--dashed {
  background: repeating-linear-gradient(
    90deg,
    currentColor 0px,
    currentColor 6px,
    transparent 6px,
    transparent 10px
  );
}
</style>
