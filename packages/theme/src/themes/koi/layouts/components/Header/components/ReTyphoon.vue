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
      <!-- 引用节点必须恒为真实元素：这里用 v-if 会在「无活跃台风」时只渲染注释节点，
           触发 Element Plus [ElOnlyChild] no valid child node found 生产期告警（实测：
           侧栏→面包屑→ReSearchMenu→Refresh→ReUser→ReWeather→本组件的 beforeMount 链在
           本 div 处以注释结束，紧随其后即告警）。改用 v-show 隐藏即可，行为不变。 -->
      <div v-show="activeList.length" class="typhoon-trigger" :title="`${activeList.length} 个活跃台风`">
        <!-- 动画气旋图标（hover/focus 播放），替代原 mingcute:typhoon-line（那需要 Iconify 在线渲染器） -->
        <ReIcon name="anim:tabler:propeller" :size="20" class="typhoon-icon" />
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
                <div class="td-panel__ops">
                  <!-- 重播：把路径从起点再演一次到「当前时间位置」 -->
                  <el-tooltip content="重播路径动画" placement="top" :show-after="150">
                    <button
                      type="button"
                      class="td-panel__btn"
                      :class="{ 'is-playing': trackPlaying }"
                      :aria-label="trackPlaying ? '路径回放中' : '重播路径动画'"
                      @click="replayTrackAnimation"
                    >
                      <ReIcon name="ep:video-play" :size="14" />
                    </button>
                  </el-tooltip>
                  <!-- 风圈等级开关：逐级显示/隐藏 7、10、12 级风圈 -->
                  <div class="td-ring-ops" role="group" aria-label="风圈等级">
                    <span v-for="item in RING_LEVELS" :key="item.key" class="td-ring-switch">
                      <em>{{ item.label }}</em>
                      <el-switch
                        v-model="ringVisible[item.key]"
                        size="small"
                        :aria-label="`${item.label}风圈`"
                        style="--el-switch-border-color: var(--el-border-color)"
                        @change="onViewOptionChange" />
                    </span>
                  </div>
                  <el-switch
                    v-model="showTrackPoints"

                    active-text="显示点位"
                    inactive-text="仅路线"
                    inline-prompt
                    style="--el-switch-border-color: var(--el-border-color)"
                    @change="onViewOptionChange" />
                </div>
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
                  @map-initialized="onMapInitialized" />

                <ul class="td-legend" aria-label="路径与风圈图例">
                  <li class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--current"></span><span>当前位置</span>
                  </li>
                  <li class="td-legend__item">
                    <span class="td-legend__line td-legend__line--history"></span><span>历史轨迹</span>
                  </li>
                  <!-- 每家预报机构一条：接口本来就给多条，图例跟着地图一起多起来 -->
                  <li v-for="item in forecastLegend" :key="item.key" class="td-legend__item">
                    <span class="td-legend__line" :style="item.lineStyle"></span><span>预报·{{ item.name }}</span>
                  </li>
                  <li v-if="ringVisible['12']" class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--ring12"></span><span>十二级风圈</span>
                  </li>
                  <li v-if="ringVisible['10']" class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--ring10"></span><span>十级风圈</span>
                  </li>
                  <li v-if="ringVisible['7']" class="td-legend__item">
                    <span class="td-legend__dot td-legend__dot--ring7"></span><span>七级风圈</span>
                  </li>
                </ul>

                <!-- 回放进度提示：路径正从起点走向当前时间位置 -->
                <transition name="el-fade-in-linear">
                  <span v-if="trackPlaying" class="td-map__replay">路径回放中 · 从起点到当前位置</span>
                </transition>

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
                      height="228px" />
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
import { ref, reactive, computed, defineAsyncComponent, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
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
  type TyphoonForecastTrack,
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
/** 风圈等级开关：控制 7/10/12 级风圈是否上图（联动图例、回放跟随圈与自动缩放） */
const ringVisible = reactive({ "7": true, "10": true, "12": true });
/** 风圈等级开关项（模板渲染用） */
const RING_LEVELS = [
  { key: "7" as const, label: "7级" },
  { key: "10" as const, label: "10级" },
  { key: "12" as const, label: "12级" },
];
/** 轨迹点列表浮层：默认收起，点地图右上角小图标展开 */
const trackListVisible = ref(false);
/** 路径回放中（起点 → 当前时间位置）：驱动「重播」按钮态与地图上的进度提示 */
const trackPlaying = ref(false);
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
  const firstPts = primaryForecast.value;
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

/**
 * 全部预报路线。
 *
 * 数据源按机构各给一条（实测同一次报文里就有 中国 / 中国台湾 / 日本 / 美国 四条），
 * @repo/core 已按「中国 → 中国台湾 → 其余」排好序，这里原样透传给地图。
 */
const forecastTracks = computed<TyphoonForecastTrack[]>(() => detailInfo.value.forecast ?? []);

/**
 * 主预报通道（forecast[0]，固定中国台）。
 * mergedPath 用它把未来段接在历史末点上，其余机构只画线、不参与接续。
 */
const primaryForecast = computed<TrackPoint[]>(() => forecastTracks.value[0]?.points ?? []);

/* ==================== 预报路线配色 ==================== */

/**
 * 各预报机构的配色定义：css 供图例直接用（var() 跟随主题自动变），
 * fallback 供地图矢量图层用（那边要拿到解析后的实值颜色）。
 * 首条固定 warning 琥珀，和历史蓝、当前位置红拉开。
 */
const AGENCY_COLOR_DEFS: { css: string; fallback: string }[] = [
  { css: "var(--el-color-warning)", fallback: "#f59e0b" },
  { css: "var(--el-color-success)", fallback: "#67c23a" },
  { css: "#6366f1", fallback: "#6366f1" },
  { css: "#ec4899", fallback: "#ec4899" },
  { css: "var(--el-color-info)", fallback: "#909399" },
];

/** 机构超出调色板时循环取色，保证任何条数都分得开颜色 */
function agencyColorDef(index: number) {
  return AGENCY_COLOR_DEFS[index % AGENCY_COLOR_DEFS.length];
}

/** 图例用的 CSS 颜色（可直接写进 style） */
function agencyCssColor(index: number): string {
  return agencyColorDef(index).css;
}

/** 地图矢量图层用的实值颜色（遇到 var() 需要解析成当前主题色） */
function agencyMapColor(index: number): string {
  const def = agencyColorDef(index);
  const matched = /^var\((--[\w-]+)\)$/.exec(def.css);
  return matched ? tokenColor(matched[1], def.fallback) : def.css;
}

/** 预报路线的虚线样式：每家一段不同的 dash，灰度打印/色弱也能分清 */
const AGENCY_DASH = ["8 6", "3 6", "12 5 3 5", "1 6", "10 4"];

/** 图例条目：与地图上的多条预报线一一对应 */
const forecastLegend = computed(() =>
  forecastTracks.value.map((track, index) => ({
    key: `${track.name || "未命名"}-${index}`,
    name: track.name || "未命名机构",
    lineStyle: {
      background: `repeating-linear-gradient(90deg, ${agencyCssColor(index)} 0 6px, transparent 6px 10px)`,
    },
  })),
);

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
    // 首次上图：先从起点演到「当前时间位置」，演完再补全静态图层
    drawTyphoonPath(true);
  });
}

/**
 * 视图选项变更（显示点位开关）：立即重绘、不重播动画，
 * 否则每拨一次开关都要干等一整轮回放。
 * 关闭弹窗期间不响应（避免空指针）；仅当地图已就绪且有路径数据时生效。  */
function onViewOptionChange() {
  if (!mapReady.value || !detailVisible.value) return;
  if (!mergedPath.value.length) return;
  nextTick(() => {
    drawTyphoonPath(false);
  });
}

/** 重播路径动画：从起点再走到当前时间位置 */
function replayTrackAnimation() {
  if (!mapReady.value || !detailVisible.value) return;
  if (historyPath.value.length < 2) return;
  drawTyphoonPath(true);
}

watch(mergedPath, () => {
  if (mapReady.value) {
    nextTick(() => {
      // 切换台风 / 后台刷新数据 → 重新演一遍
      drawTyphoonPath(true);
    });
  }
});

watch(detailVisible, (visible) => {
  if (!visible && mapReady.value && reMapRef.value) {
    // 先停回放：否则 rAF 会在图层被清掉后继续 updateShape，刷「图形不存在」告警
    stopTrackAnimation();
    reMapRef.value.clearShapes?.();
    reMapRef.value.clearMarkers?.();
  }
});

/* ==================== 中心气旋标记（形态参考浙水利台风网） ==================== */

/** 气旋标记尺寸：要装下 34px 图标 + 向外扩散的脉冲环，故给 46 */
const CYCLONE_SIZE: [number, number] = [46, 46];

/** mingcute:typhoon-line 的两段路径（双臂气旋 + 中心眼），内联进 divIcon，不依赖 Iconify 在线渲染器 */
const TYPHOON_SWIRL_PATH =
  "M19 12a9 9 0 0 1-14.69 6.974Q4.653 19 5 19c1.332 0 2.595-.29 3.732-.808A7 7 0 0 1 5 12a9 9 0 0 1 14.69-6.974a9 9 0 0 0-4.422.782A7 7 0 0 1 19 12Z";
const TYPHOON_EYE_PATH = "M14 12a2 2 0 1 1-4 0a2 2 0 0 1 4 0Z";

/** 强度/机构名等三方文案进 HTML 前转义（这些值来自外部政府接口） */
function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '"') return "&quot;";
    return "&#39;";
  });
}

/** 中心气旋 divIcon：持续旋转的气旋 + 两圈错峰雷达脉冲 + 底部级别标签 */
function cycloneHtml(label: string): string {
  return `<div class="typhoon-cyclone">
      <span class="typhoon-cyclone__pulse"></span>
      <span class="typhoon-cyclone__pulse typhoon-cyclone__pulse--late"></span>
      <svg class="typhoon-cyclone__spin" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="${TYPHOON_SWIRL_PATH}"></path>
        <path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="${TYPHOON_EYE_PATH}"></path>
      </svg>
      ${label ? `<span class="typhoon-cyclone__label">${escapeHtml(label)}</span>` : ""}
    </div>`;
}

/* ==================== 路径回放：起点 → 当前时间位置 ==================== */

/** 回放总时长：按点数给余量，夹在 4~9 秒 */
const TRACK_ANIM_MIN_MS = 4000;
const TRACK_ANIM_MAX_MS = 9000;
/** 折线/风圈的更新节流（ms）：updateShape 走 setLatLngs，20Hz 已足够顺滑 */
const TRACK_ANIM_STEP_MS = 50;
/** 回放期间生长线的 id —— 与静态场景同名，收尾 clearShapes 时一并回收 */
const ANIM_LINE_ID = "typhoon-history";

/** 系统开了「减弱动态效果」就不播动画，直接给静态图 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 历史路径 → 归一化时间轴（每点 0~1，单调不减且末项为 1）。
 * 时间解析得出来就按真实时间推进（台风跑得快的那段线条推进也快）；
 * 解析不出来（缺时间/时间非单调）退化为按点序均分，保证动画永远能播。
 */
function buildStops(points: TrackPoint[]): number[] {
  const times = points.map((p) => Date.parse(String(p.time ?? "").replace(" ", "T")));
  const usable =
    times.length > 1
    && times.every((t) => Number.isFinite(t))
    && times[times.length - 1] > times[0];
  if (!usable) {
    const last = points.length - 1 || 1;
    return points.map((_, index) => index / last);
  }
  const start = times[0];
  const span = times[times.length - 1] - start || 1;
  return times.map((t) => (t - start) / span);
}

/** 进度 → 折线前缀坐标 + 该进度下的中心点（按时间轴插值，不是按点序均分） */
function sampleTrack(points: TrackPoint[], stops: number[], progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  let index = 0;
  while (index < stops.length - 2 && stops[index + 1] < p) index += 1;
  const from = stops[index];
  const to = stops[index + 1] ?? from;
  const ratio = to > from ? (p - from) / (to - from) : 1;
  const t = Math.min(1, Math.max(0, ratio));
  const a = points[index];
  const b = points[index + 1] ?? a;
  const head = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
  const coords = points.slice(0, index + 1).map((pt) => [pt.lat, pt.lng] as [number, number]);
  coords.push([head.lat, head.lng]);
  return { coords, head };
}

/** 一次回放的运行时状态 */
interface TrackAnimState {
  stops: number[];
  durationMs: number;
  startedAt: number;
  lastSteppedAt: number;
  /** 气旋标记 id；ReMap 分配失败时为空串，届时跳过位移更新 */
  markerId: string;
  /** 跟随台风中心的外层风圈（内层渐变与文字标签等收尾时再补） */
  rings: {
    id: string;
    radii: [number, number, number, number];
    color: string;
    fillOpacity: number;
  }[];
}

let trackAnimRaf = 0;
let trackAnimState: TrackAnimState | null = null;

/** 停止回放（只取消任务；图层由调用方 clearShapes / clearMarkers 回收） */
function stopTrackAnimation() {
  if (trackAnimRaf) cancelAnimationFrame(trackAnimRaf);
  trackAnimRaf = 0;
  trackAnimState = null;
  if (trackPlaying.value) trackPlaying.value = false;
}

/** 回放开场：先把视野拉到能看完整条历史路径，否则动画跑到一半就出屏了 */
function focusWholeTrack(rm: any, points: TrackPoint[]) {
  if (!points.length) return;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const span = Math.max(
    Math.max(...lngs) - Math.min(...lngs),
    Math.max(...lats) - Math.min(...lats),
  );
  const zoom = span > 40 ? 4 : span > 20 ? 5 : span > 10 ? 6 : span > 5 ? 7 : 8;
  rm.setCenter(center[0], center[1]);
  rm.setZoom(zoom);
}

/**
 * 启动「起点 → 当前时间位置」回放。
 * @returns false = 无从动画（数据不足 / 用户关闭动效），调用方应直接出静态场景
 */
function startTrackAnimation(rm: any): boolean {
  const points = historyPath.value;
  if (points.length < 2 || prefersReducedMotion()) return false;

  const stops = buildStops(points);
  const durationMs = Math.min(
    TRACK_ANIM_MAX_MS,
    Math.max(TRACK_ANIM_MIN_MS, points.length * 260),
  );
  const historyColor = tokenColor("--el-color-primary", "#3b82f6");
  const start = points[0];
  const startCoords: [number, number] = [start.lat, start.lng];

  // 动画期只起三样：生长中的历史线 / 跟随的气旋标记 / 跟随的外层风圈
  rm.addShape({
    id: ANIM_LINE_ID,
    type: ShapeType.POLYLINE,
    coordinates: [startCoords, startCoords],
    style: { color: historyColor, weight: 3, opacity: 1 },
  });

  const markerId = rm.addMarker({
    position: startCoords,
    title: "台风当前位置",
    icon: {
      className: "typhoon-current-icon",
      html: cycloneHtml(""),
      iconSize: CYCLONE_SIZE,
      iconAnchor: [CYCLONE_SIZE[0] / 2, CYCLONE_SIZE[1] / 2],
    },
  });

  const rings = enabledRingDefs(start)
    .filter((ring) => (ring.radii ?? []).some((v) => Number(v) > 0))
    .map((ring) => ({
      id: `typhoon-anim-${ring.id}`,
      radii: ring.radii as [number, number, number, number],
      color: ring.color,
      fillOpacity: ring.fillOpacity,
      coordinates: genAsymRing4(startCoords, ring.radii as [number, number, number, number], 48),
    }));
  for (const ring of rings) {
    rm.addShape({
      id: ring.id,
      type: ShapeType.POLYGON,
      coordinates: ring.coordinates,
      style: {
        color: ring.color,
        weight: 1.5,
        opacity: 0.6,
        dashArray: "6 5",
        fillColor: ring.color,
        fillOpacity: ring.fillOpacity,
      },
    });
  }

  trackAnimState = {
    stops,
    durationMs,
    startedAt: performance.now(),
    lastSteppedAt: 0,
    markerId,
    rings: rings.map(({ id, radii, color, fillOpacity }) => ({ id, radii, color, fillOpacity })),
  };
  trackPlaying.value = true;
  focusWholeTrack(rm, points);
  trackAnimRaf = requestAnimationFrame(tickTrackAnimation);
  return true;
}

function tickTrackAnimation(now: number) {
  const rm = reMapRef.value;
  const state = trackAnimState;
  // 弹窗关掉 / 地图卸载 / 已被新一轮绘制接管：直接收摊，别往死掉的图层上写
  if (!rm || !state || !detailVisible.value) {
    stopTrackAnimation();
    return;
  }

  const points = historyPath.value;
  if (points.length < 2) {
    stopTrackAnimation();
    return;
  }

  const progress = Math.min(1, (now - state.startedAt) / state.durationMs);
  const sample = sampleTrack(points, state.stops, progress);

  if (state.markerId) {
    rm.updateMarker?.(state.markerId, { position: [sample.head.lat, sample.head.lng] });
  }

  if (now - state.lastSteppedAt >= TRACK_ANIM_STEP_MS || progress >= 1) {
    state.lastSteppedAt = now;
    rm.updateShape?.(ANIM_LINE_ID, { coordinates: sample.coords });
    for (const ring of state.rings) {
      rm.updateShape?.(ring.id, {
        coordinates: genAsymRing4([sample.head.lat, sample.head.lng], ring.radii, 48),
      });
    }
  }

  if (progress >= 1) {
    // 演完：清掉动画图层，补全静态场景（完整历史线、多条预报、点位、风圈渐变、定位）
    stopTrackAnimation();
    rm.clearShapes?.();
    rm.clearMarkers?.();
    renderStaticScene(rm, mergedPath.value);
    return;
  }
  trackAnimRaf = requestAnimationFrame(tickTrackAnimation);
}

/**
 * 绘制台风路径图。
 *
 * @param animate true = 先把历史路径从起点演到「当前时间位置」，演完再补全静态图层
 *                （首次上图、切换台风、点「重播」时为 true；只是改点位开关则为 false）
 */
function drawTyphoonPath(animate = false) {
  if (!reMapRef.value) return;

  const rm = reMapRef.value;
  const allPoints = mergedPath.value;
  if (!allPoints.length) return;

  // 不论走动画还是直出，先把上一轮的图层与回放任务收干净，避免图层叠加/僵尸 rAF
  stopTrackAnimation();
  rm.clearShapes?.();
  rm.clearMarkers?.();

  if (animate && startTrackAnimation(rm)) return;

  renderStaticScene(rm, allPoints);
}

/** 静态场景：完整历史线 + 多条预报线 + 点位 + 气旋标记 + 风圈 + 自动定位 */
function renderStaticScene(rm: any, allPoints: TrackPoint[]) {
  // 地图矢量配色统一走 koi 令牌（与图例/主题联动，暗色自动适配）
  const historyColor = tokenColor("--el-color-primary", "#3b82f6");
  const currentColor = tokenColor("--el-color-danger", "#ef4444");
  const tracks = forecastTracks.value;

  const histCoords = historyPath.value
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

  // 多条预报路线：每家机构一条虚线。forecast[0] 是中国台，画粗一点当主线。
  tracks.forEach((track, index) => {
    const coords = track.points.map((p) => [p.lat, p.lng] as [number, number]);
    if (coords.length < 2) return;
    rm.addShape({
      id: `typhoon-forecast-${index}`,
      type: ShapeType.POLYLINE,
      coordinates: coords,
      style: {
        color: agencyMapColor(index),
        weight: index === 0 ? 3 : 2.5,
        opacity: index === 0 ? 0.95 : 0.8,
        dashArray: AGENCY_DASH[index % AGENCY_DASH.length],
      },
      data: { agency: track.name || "" },
    });
  });

  // 历史/预测点位 marker：开关关闭时隐藏（台风当前位置 marker 由下方单独绘制，始终保留）
  if (showTrackPoints.value) {
    const r = 4.5;
    historyPath.value.forEach((p) => {
      rm.addMarker({
        position: [p.lat, p.lng] as [number, number],
        title: p.strong || "历史点",
        popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
          <b>历史位置</b><br>
          时间：${escapeHtml(showTime(p.time))}<br>
          强度：${escapeHtml(p.strong || "-")}<br>
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
    // 预测点位只画主通道（中国台）：四家机构的点全画会糊成一片，其余机构用线区分即可
    const primaryName = tracks[0]?.name || "预报机构";
    const primaryColor = agencyMapColor(0);
    primaryForecast.value.forEach((p) => {
      rm.addMarker({
        position: [p.lat, p.lng] as [number, number],
        title: p.strong || "预测点",
        popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
          <b>预测位置 · ${escapeHtml(primaryName)}</b><br>
          时间：${escapeHtml(showTime(p.time))}<br>
          强度：${escapeHtml(p.strong || "-")}<br>
          风速：${p.speed != null ? p.speed + " km/h" : "-"}<br>
          气压：${p.pressure != null ? p.pressure + " hPa" : "-"}
        </div>`,
        data: { strong: p.strong, agency: primaryName },
        style: { color: primaryColor, fillColor: primaryColor },
        icon: {
          className: "typhoon-track-marker",
          html: `<div class="typhoon-track-marker__dot" style="width:${r}px;height:${r}px;background:${primaryColor}"></div>`,
          iconSize: [r, r],
          iconAnchor: [r / 2, r / 2],
        },
      });
    });
  }

  // 当前位置标记（历史路径末点）：旋转气旋 + 双层雷达脉冲 + 级别标签（形态参考浙水利台风网）
  // 不自动弹窗，避免遮挡风圈
  const current = historyPath.value[historyPath.value.length - 1];
  if (current) {
    rm.addMarker({
      position: [current.lat, current.lng] as [number, number],
      title: "当前位置",
      popupContent: `<div style="min-width:140px;font-size:12px;line-height:1.8">
        <b>台风当前位置</b><br>
        时间：${escapeHtml(showTime(current.time))}<br>
        强度：${escapeHtml(current.strong || "-")}<br>
        风速：${current.speed != null ? current.speed + " km/h" : "-"}<br>
        气压：${current.pressure != null ? current.pressure + " hPa" : "-"}
      </div>`,
      data: { strong: current.strong },
      style: { color: currentColor, fillColor: currentColor },
      icon: {
        className: "typhoon-current-icon",
        html: cycloneHtml(current.strong || ""),
        iconSize: CYCLONE_SIZE,
        iconAnchor: [CYCLONE_SIZE[0] / 2, CYCLONE_SIZE[1] / 2],
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
      0,
      ...enabledRingDefs(current).flatMap((ring) => ring.radii ?? []).map(Number),
    );
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
/** 一个风圈的绘制定义；静态场景与路径回放共用同一套配色和层级 */
interface TyphoonRingDef {
  /** 风圈等级（与等级开关的 key 对齐） */
  key: "7" | "10" | "12";
  /** 图层 id 片段：静态场景用 `typhoon-${id}`，路径回放用 `typhoon-anim-${id}` */
  id: string;
  radii?: [number, number, number, number];
  label: string;
  level: string;
  color: string;
  fillOpacity: number;
  labelBearing: number;
  innerRings: { scale: number; opacity: number }[];
}

/**
 * 当前位置的风圈定义（12 / 10 / 7 级）。
 * 配色走 koi 令牌：十二级=danger-dark-2，十级=danger，七级=warning（与图例一致）。
 */
function resolveRingDefs(p: TrackPoint): TyphoonRingDef[] {
  const ring12Color = tokenColor("--el-color-danger-dark-2", "#b91c1c");
  const ring10Color = tokenColor("--el-color-danger", "#ef4444");
  const ring7Color = tokenColor("--el-color-warning", "#f59e0b");
  return [
    {
      key: "12",
      id: "ring-12级风圈",
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
      key: "10",
      id: "ring-10级风圈",
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
      key: "7",
      id: "ring-7级风圈",
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
}

/** 当前开启的风圈定义（等级开关关闭的等级不参与绘制、图例与自动缩放） */
function enabledRingDefs(p: TrackPoint): TyphoonRingDef[] {
  return resolveRingDefs(p).filter((ring) => ringVisible[ring.key]);
}

function drawWindRings(rm: any, p: TrackPoint) {
  const rings = enabledRingDefs(p);
  const center: [number, number] = [p.lat, p.lng];
  rings.forEach((ring) => {
    if (!ring.radii || ring.radii.every((r) => !r)) return;
    const coords = genAsymRing4(center, ring.radii, 64);
    const id = `typhoon-${ring.id}`;
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
onBeforeUnmount(() => { stopWorker(); stopTrackAnimation(); });
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

.td-panel__ops {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

/* 风圈等级开关组：等级文字 + 小开关，窄屏自动换行 */
.td-ring-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.td-ring-switch {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-secondary);

  em {
    font-style: normal;
    font-variant-numeric: tabular-nums;
  }
}

/* 重播路径动画按钮（与右侧「显示点位」开关同排） */
.td-panel__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 24px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  transition:
    color var(--el-transition-duration, 0.2s),
    background-color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);

  &:hover,
  &.is-playing {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }
}

/* 回放进度提示：贴地图底部居中，只在回放期间出现 */
.td-map__replay {
  position: absolute;
  bottom: 12px;
  left: 50%;
  z-index: 620;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--el-color-primary);
  pointer-events: none;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-radius-full, 9999px);
  box-shadow: var(--el-box-shadow-light);
  transform: translateX(-50%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
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

  /* 预报线没有修饰类：每家机构颜色不同，虚线由 forecastLegend 的行内样式给出 */
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

/* 当前位置：旋转气旋 + 双层雷达脉冲 + 级别标签（形态参考浙水利台风网）
   46px 命中区，气旋主体 34px，脉冲环向外扩到约 62px

   配色：最内侧的旋转气旋用**白色**，外层脉冲环用危险红。
   原因：风圈是红/橙/黄三层的低透明填充，台风中心正好压在风圈正中 ——
   若气旋也是红色，会和七级/十级风圈的描边糊成一片，中心点反而看不清。
   白色气旋 + 红色脉冲环形成「白芯 + 红环」的层次，浅色海图上靠投影保证可辨。 */
.typhoon-cyclone {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  color: var(--el-color-white);
  filter:
    drop-shadow(0 1px 2px color-mix(in srgb, var(--el-color-black) 55%, transparent))
    drop-shadow(0 0 2px color-mix(in srgb, var(--el-color-black) 35%, transparent));
}

/* 气旋主体：持续同向旋转，模拟台风环流（与路径回放共用同一段 HTML） */
.typhoon-cyclone__spin {
  position: relative;
  z-index: 2;
  animation: typhoon-cyclone-spin 4.5s linear infinite;

  /* 台风主体固定白色：不跟随 marker 的危险色，避免与风圈描边糊在一起 */
  path {
    paint-order: stroke fill;
    stroke: var(--el-color-white);
  }
}

/* 雷达脉冲：两圈错开 1.2s，读起来是连续外扩而不是一起鼓一下 */
.typhoon-cyclone__pulse {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 2px solid color-mix(in srgb, var(--el-color-danger) 55%, transparent);
  border-radius: 50%;
  animation: typhoon-cyclone-pulse 2.4s cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
}

.typhoon-cyclone__pulse--late {
  animation-delay: 1.2s;
}

.typhoon-cyclone__label {
  position: absolute;
  top: 44px;
  left: 50%;
  z-index: 3;
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

@keyframes typhoon-cyclone-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes typhoon-cyclone-pulse {
  0% {
    opacity: 0.7;
    transform: scale(0.42);
  }

  70% {
    opacity: 0.12;
  }

  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@media (prefers-reduced-motion: reduce) {
  .typhoon-cyclone__spin,
  .typhoon-cyclone__pulse {
    animation: none;
  }

  .typhoon-cyclone__pulse {
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
