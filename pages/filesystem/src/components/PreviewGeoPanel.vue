<script setup lang="ts">
/**
 * GeoJSON 地理数据预览面板组件
 *
 * <p><b>纯前端渲染</b>：票据直链取回 JSON 字节，浏览器内用 Leaflet 画矢量要素，
 * 不经后端转换、不依赖外网瓦片 —— 默认只有矢量层 + 网格底（内网可用），
 * 底图（OpenStreetMap）是工具条上的显式开关，用户点了才发外部请求，
 * 避免离线环境里一堆瓦片 4xx/超时的控制台噪音。</p>
 *
 * <p><b>为什么面板不进 iframe</b>：与 CAD / 压缩包面板同理 —— iframe 通道渲染的
 * 是独立 HTML 页面，读不到主应用的 koi 主题变量，暗色模式与品牌色全丢。</p>
 *
 * <p><b>类型口径</b>：只认标准 GeoJSON（RFC 7946 的 FeatureCollection / Feature /
 * 裸 Geometry / GeometryCollection）。TopoJSON 结构不同，{@link kindOf} 不会把它
 * 判成本类型，宁可落 unknown 兜底，也不解析成一张错图。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, MapLocation, Refresh } from "@element-plus/icons-vue";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resolveObjectUrl } from "../api/filestorageApi";
import { kindOf } from "../utils/fileKind";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，展示与判型请用生效名） */
  fileName: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入；为 0 时统计条显示 - */
  size?: number;
}>();

/** GeoJSON 允许的顶层结构 */
const GEOJSON_TYPES = new Set([
  "FeatureCollection",
  "Feature",
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

/** 超过该长度（字符，约等于字节）拒绝解析：拖几十 MB 进弹层只会卡死页面 */
const MAX_PARSE_CHARS = 20 * 1024 * 1024;

/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 加载中 */
const loading = ref(true);
/** 错误文案（空串表示无错） */
const errorText = ref("");
/** 解析出的 GeoJSON 数据（null 表示未就绪） */
const geoData = ref<GeoJSON.GeoJsonObject | null>(null);

/** 统计：可渲染几何数 */
const geomCount = ref(0);
/** 统计：几何类型分布（如 Polygon 3 / Point 12） */
const typeSummary = ref("");
/** 统计：边界范围（四至） */
const bboxText = ref("");

/** 是否加载在线底图（默认关：内网离线可用，开了才有外部瓦片请求） */
const showBase = ref(false);

/** 地图容器引用 */
const mapEl = ref<HTMLDivElement>();
/** Leaflet 实例 */
let map: L.Map | null = null;
/** 矢量层实例（重载时先移除） */
let vectorLayer: L.GeoJSON | null = null;
/** 底图瓦片层实例 */
let baseLayer: L.TileLayer | null = null;
/** 容器尺寸观察器：弹层动画/拉伸后让 Leaflet 重新量尺寸，否则瓦片错位 */
let resizeObs: ResizeObserver | null = null;

/** 字节数可读化 */
function formatSize(bytes?: number): string {
  if (!bytes || bytes < 0) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** HTML 转义（属性值来自文件内容，原样拼进弹层就是 XSS） */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 递归统计几何类型与数量。
 *
 * <p>FeatureCollection / Feature / GeometryCollection 逐层展开，最终数出来的
 * 就是 Leaflet 实际画出来的图元数 —— 统计口径与画面严格一致。</p>
 *
 * @param node GeoJSON 节点
 * @param acc  累加器
 */
function collectTypes(node: unknown, acc: Record<string, number>): void {
  if (!node || typeof node !== "object") {
    return;
  }
  const obj = node as Record<string, unknown>;
  if (obj.type === "FeatureCollection") {
    const features = obj.features;
    if (Array.isArray(features)) {
      for (const f of features) {
        const feat = f as Record<string, unknown>;
        collectTypes(feat?.geometry, acc);
      }
    }
    return;
  }
  if (obj.type === "Feature") {
    collectTypes(obj.geometry, acc);
    return;
  }
  if (obj.type === "GeometryCollection") {
    const members = obj.geometries;
    if (Array.isArray(members)) {
      for (const g of members) {
        collectTypes(g, acc);
      }
    }
    return;
  }
  if (typeof obj.type === "string") {
    acc[obj.type] = (acc[obj.type] ?? 0) + 1;
  }
}

/**
 * 要素属性 → 弹层 HTML。
 *
 * @param feature GeoJSON Feature（裸几何没有 properties）
 * @returns 可直接 bindPopup 的 HTML
 */
function popupHtml(feature: GeoJSON.Feature): string {
  const props_ = feature.properties;
  if (!props_ || typeof props_ !== "object" || Object.keys(props_).length === 0) {
    return '<div class="geo-pop geo-pop--empty">（无属性）</div>';
  }
  const rows = Object.entries(props_)
    .map(
      ([k, v]) =>
        `<tr><td class="geo-pop__k">${escapeHtml(k)}</td><td class="geo-pop__v">${
          escapeHtml(typeof v === "object" && v !== null ? JSON.stringify(v) : String(v))
        }</td></tr>`,
    )
    .join("");
  return `<div class="geo-pop"><table>${rows}</table></div>`;
}

/** 矢量层默认样式（取 Element Plus 主色，与全站一致） */
function featureStyle(): L.PathOptions {
  return {
    color: "#409eff",
    weight: 2,
    opacity: 0.9,
    fillColor: "#409eff",
    fillOpacity: 0.18,
  };
}

/**
 * 加载并解析：签票据 → fetch 字节 → 校验 → 渲染。
 *
 * <p>包内条目必须带 {@code preview=true&inner=}：条目提取只挂在预览分支上，
 * 只传 inner 会拿到整个压缩包的字节。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  geoData.value = null;
  geomCount.value = 0;
  typeSummary.value = "";
  bboxText.value = "";
  try {
    const params: Record<string, string> = {};
    if (props.inner) {
      params.preview = "true";
      params.inner = props.inner;
    }
    const url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
    if (!url) {
      throw new Error("获取文件地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`加载失败（HTTP ${res.status}）`);
    }
    const text = await res.text();
    if (text.length > MAX_PARSE_CHARS) {
      throw new Error("文件超过 20 MB，请下载后用专业 GIS 工具查看");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("内容不是合法的 JSON / GeoJSON");
    }
    const type = (parsed as { type?: string } | null)?.type;
    if (!type || !GEOJSON_TYPES.has(type)) {
      throw new Error(`不是有效的 GeoJSON（type=${type ?? "缺失"}）`);
    }
    geoData.value = parsed as GeoJSON.GeoJsonObject;
    render();
  } catch (e) {
    errorText.value = (e as Error)?.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

/**
 * 把解析结果画到地图上并回填统计。
 *
 * <p>弹层刚打开时容器尺寸可能还是 0（过渡动画中），先 invalidateSize 再算
 * fitBounds，否则会拟合出一个错误的缩放级别；350ms 后动画结束再补一次，
 * 兜住「动画期间量的还是旧尺寸」这种情况。</p>
 */
function render(): void {
  const data = geoData.value;
  const m = map;
  if (!m || !data) {
    return;
  }
  void nextTick(() => {
    m.invalidateSize({ animate: false });
    if (vectorLayer) {
      vectorLayer.remove();
      vectorLayer = null;
    }
    const acc: Record<string, number> = {};
    collectTypes(data, acc);
    geomCount.value = Object.values(acc).reduce((s, n) => s + n, 0);
    typeSummary.value = Object.entries(acc)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(" · ");
    vectorLayer = L.geoJSON(data, {
      style: featureStyle,
      pointToLayer: (_feat, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          color: "#409eff",
          weight: 2,
          fillColor: "#409eff",
          fillOpacity: 0.65,
        }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(popupHtml(feature), { maxWidth: 320 });
      },
    }).addTo(m);
    const bounds = vectorLayer.getBounds();
    if (bounds.isValid()) {
      m.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      bboxText.value = `${sw.lng.toFixed(4)}, ${sw.lat.toFixed(4)} → ${ne.lng.toFixed(4)}, ${ne.lat.toFixed(4)}`;
    } else {
      bboxText.value = "-";
    }
    setTimeout(() => {
      map?.invalidateSize({ animate: false });
    }, 350);
  });
}

/** 初始化地图容器（只做一次；数据加载完由 render 上图） */
function initMap(): void {
  if (!mapEl.value || map) {
    return;
  }
  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: false,
    minZoom: 1,
    worldCopyJump: true,
  }).setView([20, 0], 2);
  // 底图开关需要归属声明（OSM 版权），但默认无瓦片时不显示任何角标
  L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
  resizeObs = new ResizeObserver(() => {
    map?.invalidateSize({ animate: false });
  });
  resizeObs.observe(mapEl.value);
}

/** 底图开关：显式开启才去请求外部瓦片 */
watch(showBase, (on) => {
  if (!map) {
    return;
  }
  if (on && !baseLayer) {
    baseLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
  } else if (!on && baseLayer) {
    baseLayer.remove();
    baseLayer = null;
  }
});

onMounted(() => {
  initMap();
  void load();
});

watch(() => [props.bucket, props.objectKey, props.inner], () => void load());

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  resizeObs = null;
  // remove() 会一并解绑容器与事件，避免弹层反复开关泄漏监听
  map?.remove();
  map = null;
  vectorLayer = null;
  baseLayer = null;
});

/** 手动刷新 */
function reload(): void {
  void load();
}

/**
 * 下载本体。
 *
 * <p>顶层对象带 {@code download=true} 走附件下载；包内条目在新标签打开条目
 * 字节（{@code preview+inner}）—— 网关包内通道固定内联响应，不认 download 参数。</p>
 */
async function downloadSelf(): Promise<void> {
  const params: Record<string, string> = {};
  if (props.inner) {
    params.preview = "true";
    params.inner = props.inner;
  } else {
    params.download = "true";
  }
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params }).catch(() => "");
  if (url) {
    window.open(url, "_blank");
  }
}

/** 统计条「类型」文案 */
const typeText = computed(() => {
  const ext = effectiveName.value.split(".").pop() ?? "";
  return `GeoJSON .${ext.toUpperCase()}`;
});

/**
 * 统计条「大小」：包内条目显示 -。
 *
 * <p>同 {@link PreviewMediaPanel} 的口径：open-entry 只回传路径，能拿到的
 * {@link props.size} 是压缩包体积而非条目体积，宁可显示 - 也不标错数字。</p>
 */
const sizeText = computed(() => (props.inner ? "-" : formatSize(props.size)));

/** 页脚右侧状态文案 */
const statusText = computed(() => {
  if (errorText.value) {
    return "无法渲染";
  }
  return showBase.value ? "矢量层 + 在线底图" : "矢量层（离线底图）";
});
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担 -->
  <section class="geo" aria-label="GeoJSON 地理数据预览">
    <!-- ===== 统计条 ===== -->
    <div class="geo__stats">
      <div class="geo__stat">
        <span class="geo__stat-label">类型</span>
        <b class="geo__stat-value geo__stat-value--accent">{{ typeText }}</b>
      </div>
      <div class="geo__stat">
        <span class="geo__stat-label">大小</span>
        <b class="geo__stat-value">{{ sizeText }}</b>
      </div>
      <div class="geo__stat">
        <span class="geo__stat-label">要素</span>
        <b class="geo__stat-value">{{ geomCount }} 个</b>
      </div>
      <div class="geo__stat geo__stat--wide">
        <span class="geo__stat-label">几何</span>
        <b class="geo__stat-value" :title="typeSummary">{{ typeSummary || "-" }}</b>
      </div>
    </div>

    <!-- ===== 工具条 ===== -->
    <div class="geo__toolbar">
      <el-switch
        v-model="showBase"
        :disabled="!!errorText"
        :active-icon="MapLocation"
        inline-prompt
        title="叠加 OpenStreetMap 在线底图（需外网）"
      >
        <template #active-text>底图</template>
        <template #inactive-text>底图</template>
      </el-switch>
      <span class="geo__bbox" :title="bboxText">边界 {{ bboxText || "-" }}</span>
      <div class="geo__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="reload" />
      <el-button :icon="Download" title="下载文件" @click="downloadSelf">
        {{ inner ? "打开" : "下载" }}
      </el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <!-- 地图容器必须始终挂在 DOM 上（v-if 重建会丢 Leaflet 实例并重复绑监听），
         加载/错误/空态全部作为绝对覆盖层叠在它上面 -->
    <div class="geo__map-wrap">
      <div ref="mapEl" class="geo__map" />
      <div v-if="errorText" class="geo__overlay">
        <el-empty :description="errorText">
          <el-button type="primary" :icon="Refresh" @click="reload">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </el-empty>
      </div>
      <div v-else-if="loading" class="geo__overlay geo__overlay--soft">
        <el-skeleton :rows="4" animated />
        <p class="geo__loading-text">正在解析地理数据…</p>
      </div>
      <div v-else-if="geomCount === 0" class="geo__overlay geo__overlay--soft">
        <el-empty description="该文件不含任何要素" />
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="geo__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span :class="{ 'is-error': !!errorText }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   GeoJSON 预览面板（koi / Element Plus 变量体系）

   结构与 CAD / 音视频面板一致：统计条 + 工具条 + 主体 + 状态栏。
   Leaflet 容器是深层子节点，主题色穿透用 :deep 覆盖其自带背景。
   ======================================================== */
.geo {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ---- 统计条 ---- */
.geo__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.geo__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
  min-width: 0;
}

.geo__stat:first-child {
  padding-left: 0;
}

.geo__stat + .geo__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.geo__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.geo__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.geo__stat--wide .geo__stat-value {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.geo__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.geo__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.geo__bbox {
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.geo__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.geo__map-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.geo__map {
  position: absolute;
  inset: 0;
  /* 无瓦片底时的画布：细网格帮助判断要素相对尺度（与 CAD 面板同一套惯例） */
  background-color: var(--el-bg-color-page);
  background-image:
    linear-gradient(to right, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px),
    linear-gradient(to bottom, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Leaflet 自带的浅灰容器底与暗色模式打架，统一交给主题变量 */
.geo__map :deep(.leaflet-container) {
  background: transparent;
  font-family: inherit;
  font-size: 13px;
}

/* 弹层（要素属性表） */
.geo__map :deep(.geo-pop table) {
  border-collapse: collapse;
  width: 100%;
}

.geo__map :deep(.geo-pop td) {
  padding: 4px 8px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  font-size: 12px;
  vertical-align: top;
  word-break: break-all;
}

.geo__map :deep(.geo-pop__k) {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.geo__map :deep(.geo-pop__v) {
  color: var(--el-text-color-primary);
}

.geo__map :deep(.geo-pop--empty) {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 加载 / 错误覆盖层：盖住整块地图区，不挤压布局 */
.geo__overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: var(--el-bg-color);
}

.geo__overlay--soft {
  align-items: stretch;
  justify-content: flex-start;
  background: var(--el-bg-color-page);
}

.geo__loading-text {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* ---- 底部状态栏 ---- */
.geo__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.geo__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.geo__footer .is-error {
  color: var(--el-color-danger);
}
</style>
