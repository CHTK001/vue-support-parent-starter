<template>
  <el-popover
    placement="bottom-end"
    :width="460"
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

    <div class="kt-panel">
      <template v-if="activeList.length">
        <article
          v-for="t in activeList"
          :key="t.id"
          class="kt-card"
          @click="openDetail(t.id)"
        >
          <!-- 台风徽标：危险色渐变圆盘 + 白色风旋，外圈光晕 -->
          <div class="kt-card__logo" aria-hidden="true">
            <ReIcon name="mingcute:typhoon-line" :size="40" class="kt-card__logo-icon" />
          </div>

          <div class="kt-card__body">
            <header class="kt-card__head">
              <div class="kt-card__title">
                <span class="kt-card__name">{{ t.name || t.id }}</span>
                <span class="kt-card__strong">强度：{{ t.strong || "未知" }}</span>
              </div>
              <span class="kt-card__link">查看详情 <span class="kt-card__arrow">→</span></span>
            </header>

            <div class="kt-card__pills">
              <span
                class="kt-pill kt-pill--warn"
                :class="`kt-pill--${warningLevelOf(t)}`"
              >{{ warningTextOf(t) }}</span>
              <span v-if="impactTextOf(t)" class="kt-pill kt-pill--impact">{{ impactTextOf(t) }}</span>
            </div>
          </div>
        </article>
      </template>
      <div v-else class="kt-empty">
        <span>当前无活跃台风</span>
      </div>
    </div>
  </el-popover>

  <ReDialog v-model="detailVisible" title="台风详情" :width="1120" :height="740" headless :footer-hidden="true" :fullscreen="false" destroy-on-close>
    <template #content>
      <div class="td">
        <!-- ① 头部：台风标识 + 强度 + 快捷指标 + 关闭 -->
        <header class="td-head">
          <div class="td-head__brand">
            <span class="td-head__logo" aria-hidden="true">
              <ReIcon name="mingcute:typhoon-line" :size="26" />
            </span>
            <span class="td-head__name">{{ currentTyphoon?.name || selectedId }}</span>
            <ReTag v-if="currentTyphoon?.strong" type="danger" effect="light" round>{{ currentTyphoon.strong }}</ReTag>

            <!-- 多台风切换（仅当活跃台风 > 1 时出现） -->
            <ul v-if="activeList.length > 1" class="td-switch">
              <li
                v-for="t in activeList"
                :key="t.id"
                class="td-switch__item"
                :class="{ 'is-active': selectedId === t.id }"
                :title="`${t.name || t.id}${t.strong ? ' · ' + t.strong : ''}`"
                @click="selectTyphoon(t.id)"
              >
                {{ t.name || t.id }}
              </li>
            </ul>
          </div>

          <div class="td-head__stats">
            <span class="td-stat" title="近中心最大风速">
              <ReIcon name="ep:wind-power" :size="15" class="td-stat__icon" />
              <b>{{ speedValue ?? "-" }}</b><em>m/s</em>
            </span>
            <span class="td-stat" title="中心最低气压">
              <ReIcon name="ep:odometer" :size="15" class="td-stat__icon" />
              <b>{{ pressureValue ?? "-" }}</b><em>hPa</em>
            </span>
            <span class="td-stat" title="移动速度">
              <ReIcon name="ep:position" :size="15" class="td-stat__icon" />
              <b>{{ moveSpeedValue ?? "-" }}</b><em>km/h</em>
            </span>
            <!-- 关闭按钮由 headless ReDialog 右上角悬浮 FAB 提供（与拖拽条同区，避免叠层冲突） -->
          </div>
        </header>

        <!-- ② 主体：左信息面板 + 右路径图/轨迹点 -->
        <div class="td-body">
          <aside class="td-side">
            <section class="td-sec">
              <h4 class="td-sec__title">基本信息</h4>
              <ul class="td-rows">
                <li class="td-row"><span class="td-row__label">台风编号</span><b class="td-row__value">{{ currentTyphoon?.id || "-" }}</b></li>
                <li class="td-row"><span class="td-row__label">英文名</span><b class="td-row__value">{{ currentTyphoon?.enname || "-" }}</b></li>
                <li class="td-row"><span class="td-row__label">报文时间</span><b class="td-row__value">{{ reportTimeText }}</b></li>
                <li class="td-row"><span class="td-row__label">中心位置</span><b class="td-row__value">{{ centerText }}</b></li>
                <li class="td-row"><span class="td-row__label">移动方向</span><b class="td-row__value">{{ currentTyphoon?.movedirection || "-" }}</b></li>
                <li class="td-row"><span class="td-row__label">预警级别</span><b class="td-row__value">{{ detailWarnText }}</b></li>
              </ul>
            </section>

            <section class="td-sec">
              <h4 class="td-sec__title">风圈信息</h4>
              <ul class="td-rows">
                <li class="td-row">
                  <span class="td-row__label">七级风圈</span>
                  <b class="td-row__value" :title="radiusTitle(latestPoint?.r7)">{{ radiusText(latestPoint?.r7) }}</b>
                </li>
                <li class="td-row">
                  <span class="td-row__label">十级风圈</span>
                  <b class="td-row__value" :title="radiusTitle(latestPoint?.r10)">{{ radiusText(latestPoint?.r10) }}</b>
                </li>
                <li class="td-row">
                  <span class="td-row__label">十二级风圈</span>
                  <b class="td-row__value" :title="radiusTitle(latestPoint?.r12)">{{ radiusText(latestPoint?.r12) }}</b>
                </li>
              </ul>
            </section>

            <section class="td-sec">
              <h4 class="td-sec__title">实时数据</h4>
              <ul class="td-rows">
                <li class="td-row"><span class="td-row__label">近中心最大风速</span><b class="td-row__value">{{ speedValue ?? "-" }} m/s</b></li>
                <li class="td-row"><span class="td-row__label">中心最低气压</span><b class="td-row__value">{{ pressureValue ?? "-" }} hPa</b></li>
              </ul>
            </section>
          </aside>

          <div class="td-main">
            <!-- 台风路径图 -->
            <section class="td-panel td-panel--map">
              <header class="td-panel__head">
                <span class="td-panel__title">台风路径图</span>
                <el-switch
                  v-model="showTrackPoints"

                  active-text="显示点位"
                  inactive-text="仅路线"
                  inline-prompt
                  style="--el-switch-border-color: var(--el-border-color)"
                  @change="onViewOptionChange"
                />
              </header>
              <div v-loading="detailLoading" class="td-map">
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

                <ul class="td-legend" aria-label="路径与风圈图例">
                  <li class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--current"></span><span>当前位置</span>
                  </li>
                  <li class="td-legend__item">
                    <span class="td-legend__line td-legend__line--history"></span><span>历史轨迹</span>
                  </li>
                  <li class="td-legend__item">
                    <span class="td-legend__line td-legend__line--forecast"></span><span>预报路径</span>
                  </li>
                  <li class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--ring12"></span><span>十二级风圈</span>
                  </li>
                  <li class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--ring10"></span><span>十级风圈</span>
                  </li>
                  <li class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--ring7"></span><span>七级风圈</span>
                  </li>
                </ul>

                <!-- 轨迹点列表：图右上角小图标折叠，默认收起 -->
                <el-tooltip :content="trackListVisible ? '收起轨迹点列表' : '轨迹点列表'" placement="top" :show-after="150">
                  <button
                    type="button"
                    class="td-map__toggle"
                    :class="{ 'is-active': trackListVisible }"
                    :aria-expanded="trackListVisible"
                    aria-label="轨迹点列表"
                    @click="trackListVisible = !trackListVisible"
                  >
                    <ReIcon name="ep:tickets" :size="15" />
                  </button>
                </el-tooltip>

                <transition name="el-fade-in-linear">
                  <section v-if="trackListVisible" class="td-track">
                    <header class="td-track__head">
                      <span class="td-track__title">轨迹点列表</span>
                      <span class="td-track__count">{{ trackRows.length }} 个点</span>
                      <button type="button" class="td-track__close" aria-label="收起" @click="trackListVisible = false">
                        <ReIcon name="ep:close" :size="13" />
                      </button>
                    </header>
                    <ReTable
                      :data="trackRows"
                      :columns="trackColumns"
                      :pagination="false"

                      stripe
                      border
                      height="228px"
                    />
                  </section>
                </transition>

                <div v-if="!mergedPath.length && !detailLoading" class="td-map__empty">暂无路径数据</div>
              </div>
            </section>
          </div>
        </div>

        <!-- ③ 底部：数据更新时间 + 操作 -->
        <footer class="td-foot">
          <span class="td-foot__time">数据更新时间：{{ updateTimeText }}</span>
          <div class="td-foot__actions">
            <ReButton @click="detailVisible = false">关闭</ReButton>
            <ReButton type="primary" @click="openSourceDetail">查看详情</ReButton>
          </div>
        </footer>
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
const ReTag = defineAsyncComponent(() => import("@repo/ui/re-tag").then((m) => m.default));
const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));
const ReTable = defineAsyncComponent(() => import("@repo/ui/re-table").then((m) => m.default));
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

/** 预警级别中英文 → 中文（浙水利详情用英文档位：white/blue/yellow/orange/red） */
const WARN_LEVEL_TEXT: Record<string, string> = {
  white: "白色",
  blue: "蓝色",
  yellow: "黄色",
  orange: "橙色",
  red: "红色",
};

/** 预警级别（中/英）→ 文案；空值返回空串 */
function warnText(level?: string): string {
  const raw = String(level ?? "").trim();
  if (!raw) return "";
  return `${WARN_LEVEL_TEXT[raw.toLowerCase()] ?? raw}预警`;
}

/** 预警级别 → 颜色档（白 / 蓝 / 黄 / 橙 / 红；数据源未发布预警为 none） */
function warningLevelOf(t: TyphoonItem): "white" | "blue" | "yellow" | "orange" | "red" | "none" {
  const level = String(t.warnlevel ?? "").toLowerCase();
  if (level.includes("红") || level === "red") return "red";
  if (level.includes("橙") || level === "orange") return "orange";
  if (level.includes("黄") || level === "yellow") return "yellow";
  if (level.includes("蓝") || level === "blue") return "blue";
  if (level.includes("白") || level === "white") return "white";
  return "none";
}

/** 预警胶囊文案：优先数据源真实预警级别，未发布预警时回退中心风力 / 编号 */
function warningTextOf(t: TyphoonItem): string {
  if (t.warnlevel) return warnText(t.warnlevel);
  if (t.power != null) return `中心风力 ${t.power} 级`;
  return `台风编号 ${t.id}`;
}

/** 影响胶囊文案：预计影响 → 移动信息 → 中心气压（均无则隐藏） */
function impactTextOf(t: TyphoonItem): string {
  if (t.impact) return `预计影响：${t.impact}`;
  if (t.movedirection || t.movespeed != null) {
    const speed = t.movespeed != null ? ` ${t.movespeed}km/h` : "";
    return `移动：${t.movedirection || "持续"}${speed}`;
  }
  if (t.pressure != null) return `中心气压 ${t.pressure} hPa`;
  return "";
}

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailInfo = ref<TyphoonDetail>({ id: "", path: [], forecast: [] });
const selectedId = ref<string>("");
const reMapRef = ref<any>(null);
const mapReady = ref(false);
/** 是否显示路径点位（历史点/预测点 marker）；关闭后只保留路径线，台风当前位置点不受影响 */
const showTrackPoints = ref(true);
/** 轨迹点列表浮层：默认收起，点地图右上角小图标展开 */
const trackListVisible = ref(false);
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
 * 后台优先、三方兜底的链路选择与风圈字段归一化都由 @repo/core 完成。  */
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

/* ==================== 详情面板展示字段 ==================== */

/** 当前查看的台风（详情头/左侧面板取数，回退活跃列表首项） */
const currentTyphoon = computed<TyphoonItem | undefined>(
  () => activeList.value.find((t) => t.id === selectedId.value) ?? activeList.value[0],
);

/** 最新轨迹点（历史路径末点 = 当前位置，风圈/实时数据以它为准） */
const latestPoint = computed<TrackPoint | undefined>(() => {
  const path = historyPath.value;
  return path.length ? path[path.length - 1] : undefined;
});

/** 近中心最大风速（列表优先，回退最新轨迹点） */
const speedValue = computed(() => currentTyphoon.value?.speed ?? latestPoint.value?.speed);

/** 中心最低气压 */
const pressureValue = computed(() => currentTyphoon.value?.pressure ?? latestPoint.value?.pressure);

/** 移动速度 */
const moveSpeedValue = computed(() => currentTyphoon.value?.movespeed);

/** 报文时间（优先数据源时间文本） */
const reportTimeText = computed(
  () => currentTyphoon.value?.timeformate || showTime(currentTyphoon.value?.time),
);

/** 详情预警级别（详情接口顶层 warnlevel；未发布为 "-"） */
const detailWarnText = computed(() => warnText(detailInfo.value.warnlevel) || "-");

/** 经纬度 → "12.5°N 135.2°E" */
function coordText(v: number | undefined, positive: string, negative: string): string {
  if (v == null || !Number.isFinite(v)) return "-";
  return `${Math.abs(v).toFixed(1)}°${v < 0 ? negative : positive}`;
}

/** 中心位置 */
const centerText = computed(() => {
  const lat = currentTyphoon.value?.lat ?? latestPoint.value?.lat;
  const lng = currentTyphoon.value?.lng ?? latestPoint.value?.lng;
  if (lat == null || lng == null) return "-";
  return `${coordText(lat, "N", "S")} ${coordText(lng, "E", "W")}`;
});

/** 风圈四方位半径 → 展示串（等径直出；不等径按 东北/东南/西南/西北 紧凑名列） */
function radiusText(radii?: [number, number, number, number]): string {
  if (!radii || !radii.length) return "-";
  const nums = radii.map((n) => Number(n) || 0);
  if (nums.every((n) => !n)) return "-";
  return nums.every((n) => n === nums[0]) ? `${nums[0]} km` : `${nums.join(" / ")} km`;
}

/** 风圈四方位完整说明（悬浮 title） */
function radiusTitle(radii?: [number, number, number, number]): string {
  if (!radii || !radii.length) return "";
  const [ne = 0, se = 0, sw = 0, nw = 0] = radii.map((n) => Number(n) || 0);
  return `东北 ${ne} · 东南 ${se} · 西南 ${sw} · 西北 ${nw} km`;
}

/** 数据更新时间（最新轨迹点时间优先） */
const updateTimeText = computed(() => {
  const t = latestPoint.value?.time || currentTyphoon.value?.time;
  return t ? t.replace("T", " ").slice(0, 16) : "-";
});

/** 轨迹点列表（历史路径，最新在前） */
interface TrackRow {
  time: string;
  position: string;
  speed: string;
  pressure: string;
  strong: string;
}

const trackRows = computed<TrackRow[]>(() =>
  [...historyPath.value].reverse().map((p) => ({
    time: showTime(p.time),
    position: `${coordText(p.lat, "N", "S")} ${coordText(p.lng, "E", "W")}`,
    speed: p.speed != null ? `${p.speed} m/s` : "-",
    pressure: p.pressure != null ? `${p.pressure} hPa` : "-",
    strong: p.strong || "-",
  })),
);

const trackColumns = [
  { prop: "time", label: "时间", minWidth: 170 },
  { prop: "position", label: "位置", minWidth: 148 },
  { prop: "speed", label: "风速", width: 92 },
  { prop: "pressure", label: "气压", width: 100 },
  { prop: "strong", label: "级别", minWidth: 112 },
];

/** 读取当前主题令牌色（地图矢量样式与图例保持一致） */
function tokenColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * 「查看详情」：前往数据源官网（浙江省水利厅台风网）。
 * 若后续提供应用内详情路由，改此函数一行即可。  */
function openSourceDetail(): void {
  window.open("https://typhoon.slt.zj.gov.cn/", "_blank", "noopener,noreferrer");
}

function onMapInitialized() {
  mapReady.value = true;
  nextTick(() => {
    drawTyphoonPath();
  });
}

/**
 * 视图选项变更（显示点位开关）：触发台风路径重绘。
 * 关闭弹窗期间不响应（避免空指针）；仅当地图已就绪且有路径数据时生效。  */
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

  // 地图矢量配色统一走 koi 令牌（与图例/主题联动，暗色自动适配）
  const historyColor = tokenColor("--el-color-primary", "#3b82f6");
  const forecastColor = tokenColor("--el-color-warning", "#f59e0b");
  const currentColor = tokenColor("--el-color-danger", "#ef4444");

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
        color: historyColor,
        weight: 3,
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
        color: forecastColor,
        weight: 3,
        opacity: 0.9,
        dashArray: "8 6",
      },
    });
  } else if (histCoords.length >= 2) {
    rm.addShape({
      id: "typhoon-path",
      type: ShapeType.POLYLINE,
      coordinates: histCoords,
      style: {
        color: historyColor,
        weight: 3,
        opacity: 1,
      },
    });
  }

  // 历史/预测点位 marker：开关关闭时隐藏（台风当前位置 marker 由下方单独绘制，始终保留）
  if (showTrackPoints.value) {
    const r = 4.5;
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
        style: { color: historyColor, fillColor: historyColor },
        // ReMap 原生 divIcon 入口（icon.html），不依赖 window.L 全局
        icon: {
          className: "typhoon-track-marker",
          html: `<div class="typhoon-track-marker__dot" style="width:${r}px;height:${r}px;background:${historyColor}"></div>`,
          iconSize: [r, r],
          iconAnchor: [r / 2, r / 2],
        },
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
        style: { color: forecastColor, fillColor: forecastColor },
        icon: {
          className: "typhoon-track-marker",
          html: `<div class="typhoon-track-marker__dot" style="width:${r}px;height:${r}px;background:${forecastColor}"></div>`,
          iconSize: [r, r],
          iconAnchor: [r / 2, r / 2],
        },
      });
    });
  }

  // 当前位置标记（历史路径末点）：小圆点 + 呼吸光晕；不自动弹窗，避免遮挡风圈
  const current = historyPath.value[historyPath.value.length - 1];
  if (current) {
    rm.addMarker({
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
      style: { color: currentColor, fillColor: currentColor },
      icon: {
        className: "typhoon-current-icon",
        html: `<div class="typhoon-current">
          <span class="typhoon-current__pulse"></span>
          <span class="typhoon-current__dot"></span>
          <span class="typhoon-current__label">${current.strong || ""}</span>
        </div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      },
    });
  }

  // 台风当前位置绘制不对称风圈（7 级 / 10 级，若有半径数据）
  if (current) {
    drawWindRings(rm, current);
  }

  // 自动定位：优先聚焦当前位置风圈（让风圈占据主要视野），无风圈数据时退回当前位置常规视野
  if (current) {
    const ringSpan = Math.max(
      ...(current.r7 ?? []).map(Number),
      ...(current.r10 ?? []).map(Number),
    ) || 0;
    try {
      const mapInst = rm.getMapInstance?.() as any;
      if (mapInst) {
        if (ringSpan > 0) {
          const size = mapInst.getSize?.();
          const viewport = Math.min(size?.x || 420, size?.y || 320);
          // 环直径按纬度近似（1° ≈ 111km），目标占视口约 65%，由「度/像素」反推缩放级别
          const diameterDeg = (ringSpan * 2) / 111;
          const degPerPx = diameterDeg / (viewport * 0.65);
          const zoom = Math.min(10, Math.max(4, Math.round(Math.log2(360 / (256 * degPerPx)))));
          mapInst.setView?.([current.lat, current.lng], zoom, { animate: false });
        } else {
          mapInst.setView?.([current.lat, current.lng], 7, { animate: false });
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
 * 已知中心、初始方位角(度）、距离(km)、旋转偏移(度），算当前经纬度。
 * 用于在风圈内固定方位放置文字标签。  */
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
 * 这样既能直接看出哪个圈对应哪个级别，又不会像早期版本那样绕台风中心公转产生视觉噪声。  */
function drawWindRings(rm: any, p: TrackPoint) {
  // 风圈配色走 koi 令牌：十二级=danger-dark-2，十级=danger，七级=warning（与图例一致）
  const ring12Color = tokenColor("--el-color-danger-dark-2", "#b91c1c");
  const ring10Color = tokenColor("--el-color-danger", "#ef4444");
  const ring7Color = tokenColor("--el-color-warning", "#f59e0b");
  const rings: { radii?: [number, number, number, number]; label: string; level: string; color: string; fillOpacity: number; labelBearing: number; innerRings: { scale: number; opacity: number }[] }[] = [
    {
      radii: p.r12,
      label: "12级风圈",
      level: "12级",
      color: ring12Color,
      fillOpacity: 0.14,
      labelBearing: 90,
      innerRings: [
        { scale: 0.85, opacity: 0.1 },
        { scale: 0.7, opacity: 0.07 },
        { scale: 0.55, opacity: 0.04 },
        { scale: 0.4, opacity: 0.02 },
      ],
    },
    {
      radii: p.r10,
      label: "10级风圈",
      level: "10级",
      color: ring10Color,
      fillOpacity: 0.12,
      // 标签方位（北偏东/北偏西各一），让多个风圈标签不重叠
      labelBearing: 70,
      innerRings: [
        { scale: 0.85, opacity: 0.09 },
        { scale: 0.7, opacity: 0.06 },
        { scale: 0.55, opacity: 0.035 },
        { scale: 0.4, opacity: 0.018 },
      ],
    },
    {
      radii: p.r7,
      label: "7级风圈",
      level: "7级",
      color: ring7Color,
      fillOpacity: 0.1,
      labelBearing: 110,
      innerRings: [
        { scale: 0.85, opacity: 0.075 },
        { scale: 0.7, opacity: 0.045 },
        { scale: 0.55, opacity: 0.025 },
        { scale: 0.4, opacity: 0.012 },
      ],
    },
  ];
  const center: [number, number] = [p.lat, p.lng];
  rings.forEach((ring) => {
    if (!ring.radii || ring.radii.every((r) => !r)) return;
    const coords = genAsymRing4(center, ring.radii, 64);
    const id = `typhoon-ring-${ring.label}`;
    // 主风圈：虚线描边 + 通透填充（与路径虚线呼应）
    rm.addShape({
      id,
      type: ShapeType.POLYGON,
      coordinates: coords,
      style: {
        color: ring.color,
        weight: 1.5,
        opacity: 0.6,
        dashArray: "6 5",
        fillColor: ring.color,
        fillOpacity: ring.fillOpacity,
      },
    });

    // 内侧多层同色低透明层：模拟柔和径向渐变淡出
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
          fillColor: ring.color,
          fillOpacity: inner.opacity,
        },
      });
    });

    // 在风圈内固定方位（北偏东 / 北偏西）放级别文字标签，靠近环边更易读
    const maxR = Math.max(...ring.radii.map((r) => Number(r) || 0));
    if (maxR > 0) {
      rm.addMarker({
        position: offsetLatLng(center, ring.labelBearing, maxR * 0.9) as [number, number],
        icon: {
          className: "typhoon-ring-label-icon",
          html: `<div class="typhoon-ring-label" style="--ring-color:${ring.color}">${ring.level}</div>`,
          iconSize: [44, 18],
          iconAnchor: [22, 9],
        },
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
  border-radius: var(--el-radius-sm, 6px);
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .typhoon-icon {
    color: var(--el-color-primary);
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--el-color-primary) 45%, transparent));
  }

  :deep(.typhoon-badge) {
    position: absolute;
    top: -2px;
    right: -2px;
  }

  :deep(.typhoon-badge .el-badge__content) {
    background: var(--el-color-danger);
    border: 2px solid var(--el-header-bg-color, var(--el-bg-color));
    transform: scale(0.9);
  }

  &:hover {
    background: var(--el-header-icon-hover-bg-color, var(--el-fill-color-light));
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.96);
  }
}

/* ==================== 台风面板（koi 令牌；背景透明，仅保留卡片） ==================== */
.kt-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: transparent;
}

.kt-card {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light);
  transition:
    box-shadow var(--el-transition-duration, 0.2s),
    transform var(--el-transition-duration, 0.2s);

  &:hover {
    box-shadow: var(--el-box-shadow);
    transform: translateY(-1px);

    .kt-card__link {
      gap: 8px;
    }
  }

  /* 徽标：危险色渐变圆盘 + 外圈光晕 */
  &__logo {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    color: var(--el-color-white);
    background: radial-gradient(circle at 34% 28%, var(--el-color-warning) 0%, var(--el-color-danger) 68%);
    border: 2px solid color-mix(in srgb, var(--el-color-white) 65%, transparent);
    border-radius: 50%;
    box-shadow:
      0 0 0 6px color-mix(in srgb, var(--el-color-danger) 16%, transparent),
      0 0 22px color-mix(in srgb, var(--el-color-danger) 35%, transparent);
  }

  &__logo-icon {
    animation: kt-spin 12s linear infinite;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  &__head {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__name {
    overflow: hidden;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.15;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__strong {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  &__link {
    display: inline-flex;
    flex-shrink: 0;
    gap: 4px;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
    transition: gap var(--el-transition-duration, 0.2s) ease;
  }

  &__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

@keyframes kt-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kt-card__logo-icon {
    animation: none;
  }
}

/* 胶囊：预警（按级别描边着色）/ 影响（危险色淡底） */
.kt-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  border-radius: var(--el-radius-full, 9999px);

  &--warn {
    --kt-pill-color: var(--el-color-primary);

    color: var(--kt-pill-color);
    background: color-mix(in srgb, var(--kt-pill-color) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--kt-pill-color) 70%, transparent);
  }

  &--blue {
    --kt-pill-color: var(--el-color-primary);
  }

  &--white {
    --kt-pill-color: var(--el-color-info);
  }

  &--yellow {
    --kt-pill-color: var(--el-color-warning);
  }

  &--orange {
    --kt-pill-color: color-mix(in srgb, var(--el-color-warning) 55%, var(--el-color-danger));
  }

  &--red {
    --kt-pill-color: var(--el-color-danger);
  }

  &--impact {
    color: var(--el-text-color-regular);
    background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  }
}

.kt-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ==================== 详情弹窗（彻底重构：td-*，全部 koi 令牌） ==================== */
.td {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* headless ReDialog 顶部预留 44px 透明拖拽条（含右上角悬浮关闭 FAB），内容下移避免遮挡 */
  padding-top: 44px;
  color: var(--el-text-color-primary);
}

/* ── 头部：标识 + 强度 + 多台风切换 + 快捷指标 + 关闭 ── */
.td-head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.td-head__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.td-head__logo {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--el-color-white);
  background: radial-gradient(circle at 34% 28%, var(--el-color-warning) 0%, var(--el-color-danger) 68%);
  border-radius: 50%;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}

.td-head__name {
  overflow: hidden;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-switch {
  display: flex;
  gap: 6px;
  margin: 0 0 0 6px;
  padding: 0;
  list-style: none;
}

.td-switch__item {
  padding: 3px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
  transition:
    background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);

  &:hover {
    color: var(--el-color-primary);
  }

  &.is-active {
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.td-head__stats {
  display: flex;
  flex: none;
  gap: 18px;
  align-items: center;
}

.td-stat {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  b {
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  em {
    font-size: 12px;
    font-style: normal;
  }
}

.td-stat__icon {
  color: var(--el-text-color-placeholder);
}

/* ── 主体：左信息面板 + 右路径图/轨迹点 ── */
.td-body {
  display: flex;
  gap: 12px;
  height: 540px;
  min-height: 0;
}

.td-side {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 280px;
  padding: 6px 14px;
  overflow-y: auto;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color-dark) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-dark);
    border-radius: var(--el-radius-sm, 6px);
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.td-sec {
  padding: 6px 0;
}

.td-sec + .td-sec {
  border-top: 1px solid var(--el-border-color-lighter);
}

.td-sec__title {
  margin: 6px 0 2px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.td-rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.td-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  &:last-child {
    border-bottom: none;
  }
}

.td-row__label {
  flex: none;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.td-row__value {
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.td-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.td-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.td-panel--map {
  flex: 1;
}

.td-panel__head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.td-panel__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.td-map {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-md, 8px);

  :deep(.sc-map) {
    height: 100% !important;
    min-height: 0;
  }

  // 隐藏右下角版权/坐标信息
  :deep(.leaflet-control-attribution),
  :deep(.leaflet-control-coordinate),
  :deep(.coordinate-panel),
  :deep(.leaflet-bottom) {
    display: none;
  }
}

/* 轨迹点列表开关（地图右上角小图标） */
.td-map__toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  box-shadow: var(--el-box-shadow-light);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition:
    background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);

  &:hover,
  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }
}

/* 轨迹点列表浮层（地图右上角展开，默认收起） */
.td-track {
  position: absolute;
  top: 46px;
  right: 10px;
  z-index: 610;
  display: flex;
  flex-direction: column;
  width: min(680px, calc(100% - 20px));
  padding: 10px 12px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  box-shadow: var(--el-box-shadow);
}

.td-track__head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.td-track__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.td-track__count {
  flex: 1;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.td-track__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  transition:
    background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }
}

.td-map__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 地图图例（左下角；koi 令牌 + 半透明表面） */
.td-legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 500;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  max-width: calc(100% - 20px);
  margin: 0;
  padding: 7px 12px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  pointer-events: none;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  box-shadow: var(--el-box-shadow-light);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.td-legend__item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.td-legend__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;

  &--current {
    background: var(--el-color-danger);
  }

  &--ring12 {
    background: var(--el-color-danger-dark-2, var(--el-color-danger));
    opacity: 0.6;
  }

  &--ring10 {
    background: var(--el-color-danger);
    opacity: 0.55;
  }

  &--ring7 {
    background: var(--el-color-warning);
    opacity: 0.55;
  }
}

.td-legend__line {
  width: 18px;
  height: 3px;
  border-radius: 1.5px;

  &--history {
    background: var(--el-color-primary);
  }

  &--forecast {
    background: repeating-linear-gradient(90deg, var(--el-color-warning) 0 6px, transparent 6px 10px);
  }
}

/* ── 底部：数据更新时间 + 操作 ── */
.td-foot {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.td-foot__time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.td-foot__actions {
  display: flex;
  gap: 10px;
}
</style>

<style lang="scss">
/*
 * 外壳完全去边。
去底色：只保留卡片自身作为唯一视觉层，避免"套两层框"框/ * 注意：应用侧存在 `.el-popper.is-light { border/box-shadow: ... !important }` 的通用弹层描边
 * （0,2,0 特异度），单类选择器压不住，这里用双类选择器（0,3,0）覆盖。  */
.el-popper.is-light.koi-typhoon-popover {
  padding: 0 !important;
  overflow: visible;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
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
  border: 1.5px solid var(--el-color-white);
  border-radius: 50%;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-color-black) 18%, transparent);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.6);
  }
}

/* 当前位置：小圆点 + 呼吸光晕（14px 命中区，视觉不喧宾夺主） */
.typhoon-current {
  position: relative;
  display: block;
  width: 14px;
  height: 14px;

  &__dot {
    position: absolute;
    inset: 0;
    background: var(--el-color-danger);
    border: 2px solid var(--el-color-white);
    border-radius: 50%;
    box-shadow: 0 1px 4px color-mix(in srgb, var(--el-color-black) 25%, transparent);
  }

  &__pulse {
    position: absolute;
    inset: -6px;
    pointer-events: none;
    background: color-mix(in srgb, var(--el-color-danger) 32%, transparent);
    border-radius: 50%;
    animation: typhoon-current-pulse 2.6s ease-out infinite;
  }

  &__label {
    position: absolute;
    top: 18px;
    left: 50%;
    padding: 1px 7px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-white) 95%, transparent);
    border-radius: var(--el-radius-full, 9999px);
    box-shadow: 0 1px 4px color-mix(in srgb, var(--el-color-black) 12%, transparent);
    transform: translateX(-50%);
  }
}

@keyframes typhoon-current-pulse {
  0% {
    opacity: 0.85;
    transform: scale(0.55);
  }

  100% {
    opacity: 0;
    transform: scale(2.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .typhoon-current__pulse {
    animation: none;
    opacity: 0.25;
  }
}

// 风圈级别文字标签（"10级" / "7级"）：放在风圈内固定方位，不绕台风中心公转
.typhoon-ring-label-icon {
  background: none !important;
  border: none !important;
  pointer-events: none; // 不阻挡地图交互
}

.typhoon-ring-label {
  --ring-color: var(--el-color-warning);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 18px;
  padding: 0 7px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  color: var(--ring-color);
  background: color-mix(in srgb, var(--el-color-white) 92%, transparent);
  border-radius: var(--el-radius-full, 9999px);
  box-shadow:
    0 0 0 1px var(--ring-color),
    0 2px 5px color-mix(in srgb, var(--el-color-black) 12%, transparent);
  backdrop-filter: blur(2px);
}
</style>
