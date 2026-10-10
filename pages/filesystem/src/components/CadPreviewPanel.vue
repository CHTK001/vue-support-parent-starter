<script setup lang="ts">
/**
 * CAD 图纸预览面板组件
 *
 * 形态与 {@link ArchivePreviewPanel} 一致：统计条 + 工具条 + 画布区 + 状态栏，
 * 全部走 koi / Element Plus 变量，在主应用文档内渲染（因此能跟随暗色模式）。
 *
 * <p><b>DXF 与 DWG 的能力差异，组件不掩饰</b>：</p>
 * <ul>
 *   <li>DXF：真实图形。SVG 由服务端解析生成，描边用 {@code currentColor}，
 *       所以暗色模式只需改容器 {@code color}，SVG 无需重新渲染。</li>
 *   <li>DWG：<b>没有图形</b>。DWG 是 Autodesk 私有二进制格式，图元几何无法在
 *       Java 内解析（需 LibreDWG / ODA / Aspose 等外部转换器）。这里展示
 *       版本、单位等头部信息，并明确提示「另存为 DXF 可获得完整预览」，
 *       而不是显示一张「请用 AutoCAD 打开」的空白卡。</li>
 * </ul>
 *
 * @author Buffy
 * @since 2026/09/29
 */
import { message } from "@repo/core";
import { computed, onMounted, ref, watch } from "vue";

import {
  Aim,
  Document,
  Download,
  Folder,
  Histogram,
  Refresh,
} from "@element-plus/icons-vue";
import { getCadInfo, resolveObjectUrl } from "../api/filestorageApi";
import type { CadInfoResponse } from "../api/filestorageApi";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 图纸对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 图纸文件名（不含目录） */
  fileName: string;
  /**
   * 压缩包内条目路径（{@code ?format=cad&inner=}）。
   *
   * <p>为空表示解析对象本身。包内的 DXF / DWG 走这个参数而不是 iframe 通道：
   * iframe 那条会被三维模型提供者抢走，同一张图在顶层与包内会呈现成两套界面。</p>
   */
  inner?: string;
}>();

/** 图纸信息 */
const info = ref<CadInfoResponse | null>(null);
/** 加载中 */
const loading = ref(true);
/** 错误信息（空串表示无错） */
const errorMessage = ref("");
/** 缩放比例（%），100 为适配 */
const zoom = ref(100);
/** 画布容器引用（用于滚轮缩放与拖拽平移） */
const canvasRef = ref<HTMLDivElement>();
/** 图形平移偏移（像素） */
const pan = ref({ x: 0, y: 0 });
/** 是否正在拖拽平移 */
const dragging = ref(false);

/** 缩放上下限（%）：25 太看不清，400 超大图纸看不清细节 */
const ZOOM_MIN = 25;
const ZOOM_MAX = 400;
/** 单步缩放比例 */
const ZOOM_STEP = 25;

/** 是否有图形可渲染 */
const hasDrawing = computed(() => info.value?.renderable === true && !!info.value?.svg);

/** 统计条：图层数（DXF） */
const layerCount = computed(() => info.value?.layerCount ?? 0);
/** 统计条：图元数（DXF） */
const entityCount = computed(() => info.value?.entityCount ?? 0);
/** 统计条：版本（DWG 优先，DXF 用 $ACADVER） */
const versionText = computed(() => {
  const i = info.value;
  if (!i) return "-";
  if (!i.renderable) return i.versionLabel || "未知";
  return i.acadVersion || "未知";
});
/** 统计条：单位 */
const unitsText = computed(() => {
  const i = info.value;
  if (!i) return "-";
  return i.renderable ? i.units || "未指定" : "—";
});
/** 统计条：图形尺寸 */
const sizeText = computed(() => {
  const i = info.value;
  if (!i) return "-";
  if (!i.renderable) return formatSize(i.size);
  const w = i.width ?? 0;
  const h = i.height ?? 0;
  return `${round(w)} × ${round(h)}`;
});
/** 被跳过的实体类型（需如实告知用户哪些内容没画出来） */
const unsupported = computed(() => info.value?.unsupported ?? []);

/** 图层统计（按数量降序，便于先看图层最多的） */
const layerRows = computed(() => {
  const layers = info.value?.layers ?? {};
  return Object.entries(layers)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

/** 画布内容样式：缩放 + 平移 */
const canvasStyle = computed(() => ({
  transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value / 100})`,
}));

/** 字节数的可读化展示 */
function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 图纸单位数格式化：整数不带小数点 */
function round(v: number): string {
  if (!Number.isFinite(v)) return "-";
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/** 加载图纸信息 */
async function load(): Promise<void> {
  loading.value = true;
  errorMessage.value = "";
  try {
    // inner 为空表示解析对象本身；非空表示解析压缩包内的该条目
    info.value = await getCadInfo(props.bucket, props.objectKey, props.inner || undefined);
    resetView();
  } catch (e) {
    info.value = null;
    errorMessage.value = (e as Error)?.message ?? "CAD 图纸查询失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
// inner 也要进依赖：同一个压缩包里先后点开两个 dxf，面板复用同一实例，必须重新取
watch(() => [props.bucket, props.objectKey, props.inner], load);

/** 复位视图：100% + 居中 */
function resetView(): void {
  zoom.value = 100;
  pan.value = { x: 0, y: 0 };
}

/**
 * 滚轮缩放。
 *
 * <p>仅在按住 Ctrl 时触发，避免与「滚轮上下滚动图纸」冲突——图纸往往很高，
 * 纵向滚动是高频操作，不能被缩放抢走。</p>
 *
 * @param e 滚轮事件
 */
function onWheel(e: WheelEvent): void {
  if (!e.ctrlKey) return;
  e.preventDefault();
  zoom.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom.value + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
}

/** 拖拽平移起点 */
let dragStart: { x: number; y: number; px: number; py: number } | null = null;

/** 开始拖拽平移 */
function onPointerDown(e: PointerEvent): void {
  // 中键或按住空格/Alt 时平移，避免与后续可能加上的框选冲突
  if (e.button !== 0) return;
  dragStart = { x: e.clientX, y: e.clientY, px: pan.value.x, py: pan.value.y };
  dragging.value = true;
  canvasRef.value?.setPointerCapture(e.pointerId);
}

/** 拖拽平移中 */
function onPointerMove(e: PointerEvent): void {
  if (!dragStart) return;
  const scale = zoom.value / 100;
  pan.value = {
    x: dragStart.px + (e.clientX - dragStart.x) / scale,
    y: dragStart.py + (e.clientY - dragStart.y) / scale,
  };
}

/** 结束拖拽平移 */
function onPointerUp(e: PointerEvent): void {
  if (dragStart) {
    // 拖过之后不要再触发 click 选中逻辑
    (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
  }
  dragStart = null;
  dragging.value = false;
}

/** 下载图纸本体 */
async function downloadSelf(): Promise<void> {
  // window.open 无法带请求头，只能靠 URL 直达 —— 用短时一次性票据而不是访问令牌，
  // 免得令牌落进浏览器历史与网关访问日志。
  const url = await resolveObjectUrl(props.bucket, props.objectKey, {
    params: { download: "true" },
  });
  window.open(url, "_blank");
}

/**
 * 复制「另存为 DXF」提示。
 *
 * <p>DWG 无法渲染是格式限制而非缺陷，把可执行的出路直接给用户，
 * 比只说一句「不支持」有用。</p>
 */
function copyHint(): void {
  const text = "DWG 为 Autodesk 私有二进制格式，浏览器无法解析其图元几何。"
    + "请在 CAD 软件中将图纸「另存为 DXF」（开放文本格式）后重新上传，即可完整预览。";
  void navigator.clipboard?.writeText(text)
    .then(() => message.success("提示已复制"))
    .catch(() => message.warning("复制失败，请手动记录"));
}

/**
 * 面板内展示的图纸名。
 *
 * <p>包内条目优先用后端回的 {@code name}（那是包内路径，能看清图纸在压缩包里的位置）；
 * 顶层文件用 props 传入的文件名。供页脚与统计条使用——标题栏已交由外层
 * {@code el-dialog} 承载，这里不再重复渲染。</p>
 */
const displayName = computed(() => info.value?.name || props.fileName);
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担，
       面板再画一条 header 就是两层标题栏。 -->
  <section class="cad" aria-label="CAD 图纸预览">
    <!-- ===== 统计条 ===== -->
    <div class="cad__stats">
      <div class="cad__stat">
        <el-icon class="cad__stat-icon"><Document /></el-icon>
        <span class="cad__stat-label">图元</span>
        <b class="cad__stat-value">{{ hasDrawing ? `${entityCount} 个` : "—" }}</b>
      </div>
      <div class="cad__stat">
        <el-icon class="cad__stat-icon"><Folder /></el-icon>
        <span class="cad__stat-label">图层</span>
        <b class="cad__stat-value">{{ hasDrawing ? `${layerCount} 个` : "—" }}</b>
      </div>
      <div class="cad__stat">
        <el-icon class="cad__stat-icon"><Histogram /></el-icon>
        <span class="cad__stat-label">单位</span>
        <b class="cad__stat-value">{{ unitsText }}</b>
      </div>
      <div class="cad__stat">
        <el-icon class="cad__stat-icon"><Aim /></el-icon>
        <span class="cad__stat-label">{{ hasDrawing ? "尺寸" : "版本" }}</span>
        <b class="cad__stat-value cad__stat-value--accent">{{ hasDrawing ? sizeText : versionText }}</b>
      </div>
    </div>

    <!-- ===== 操作条：只留下载/刷新。缩放靠 Ctrl+滚轮与拖拽平移即可，
         独立的缩放/复位/全屏按钮属于冗余工具条，已按产品要求移除。 ===== -->
    <div class="cad__toolbar">
      <span class="cad__zoom-btn">{{ zoom }}%</span>
      <div class="cad__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="load" />
      <el-button :icon="Download" title="下载图纸" @click="downloadSelf">下载</el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div v-if="loading && !info" class="cad__placeholder">
      <el-skeleton :rows="6" animated />
    </div>
    <el-empty v-else-if="errorMessage" class="cad__placeholder" :description="errorMessage">
      <el-button type="primary" :icon="Refresh" @click="load">重试</el-button>
      <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
    </el-empty>
    <div v-else class="cad__body">
      <!-- 有图形：画布 + 图层侧栏 -->
      <template v-if="hasDrawing">
        <aside class="cad__layers" aria-label="图层列表">
          <div class="cad__layers-title">图层（{{ layerCount }}）</div>
          <ul class="cad__layer-list">
            <li v-for="row in layerRows" :key="row.name" class="cad__layer-row">
              <span class="cad__layer-name" :title="row.name">{{ row.name }}</span>
              <span class="cad__layer-count">{{ row.count }}</span>
            </li>
          </ul>
          <div v-if="unsupported.length" class="cad__unsupported">
            <div class="cad__unsupported-title">未渲染的图元类型</div>
            <p class="cad__unsupported-text">
              {{ unsupported.join("、") }}
            </p>
            <p class="cad__unsupported-hint">
              这些图元需要块定义、样条或标注上下文，纯解析无法还原
            </p>
          </div>
        </aside>

        <div
          ref="canvasRef"
          class="cad__canvas"
          :class="{ 'is-dragging': dragging }"
          @wheel="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div class="cad__canvas-inner" :style="canvasStyle">
            <!-- SVG 描边用 currentColor，故只需让容器 color 跟随主题，暗色模式自动适配 -->
            <div class="cad__svg" v-html="info?.svg" />
          </div>
          <div class="cad__canvas-hint">按住左键拖动平移 · Ctrl+滚轮缩放</div>
        </div>
      </template>

      <!-- DWG：区分「真 DWG 但几何需外部转换器」与「根本不是 DWG（文件损坏）」 -->
      <div v-else class="cad__nodwg">
        <div class="cad__nodwg-icon">
          <el-icon :size="30"><Document /></el-icon>
        </div>
        <!--
          这两种情况必须分开说，否则会误导：
          · 真 DWG（版本码已识别）→ 是**格式能力**问题：DWG 图元需外部转换器
          · 根本不是 DWG（版本码读不出来）→ 是**文件问题**：损坏或不是 DWG，要重新上传
          实测桶里那个 .dwg 与那个坏 .docx 前 6 字节完全相同（同源损坏），
          以前显示「未识别的 DWG 版本 + DWG 是私有格式」，会让人以为换个格式就好。
        -->
        <template v-if="info?.notDwg">
          <h4 class="cad__nodwg-title">文件已加密、损坏，或不是 DWG</h4>
          <p class="cad__nodwg-text">
            该文件的内容不是有效的 DWG（开始字节既不是
            <code>AC10xx</code> 版本码，也不是其他已知的 DWG 版本标识）。
          </p>
          <p class="cad__nodwg-text">
            常见原因有两种：
            <b>① 文件被图纸防泄密软件透明加密</b>——这类软件（如 360 防泄密等）
            在磁盘上存放的是密文，只有装了客户端并获授权的终端才能解密，
            服务端与浏览器读到的是密文，任何解析器都无法打开；
            <b>② 文件在传输或保存过程中损坏</b>。
          </p>
          <p class="cad__nodwg-text">
            如果是加密文件，<b>重新上传也没用</b>（上传的仍是密文）。
            请提供未加密的副本，或在本机用 CAD 软件另存为
            <code>DXF</code>（纯文本格式，可正常预览）。
          </p>
        </template>
        <template v-else>
          <h4 class="cad__nodwg-title">{{ info?.versionLabel || "DWG 图纸" }}</h4>
          <p class="cad__nodwg-text">
            DWG 是 Autodesk 私有二进制格式，其图元几何存放在未公开的内部表中，
            浏览器无法直接解析。因此这里只能展示图纸的版本信息。
          </p>
        </template>
        <dl class="cad__kv">
          <div class="cad__kv-row">
            <dt>版本代码</dt>
            <dd>{{ info?.versionCode || "未识别" }}</dd>
          </div>
          <div class="cad__kv-row">
            <dt>AutoCAD 发行号</dt>
            <dd>{{ info?.acadRelease || "—" }}</dd>
          </div>
          <div class="cad__kv-row">
            <dt>维护版本</dt>
            <dd>{{ (info?.maintenanceVersion ?? -1) < 0 ? "—" : info?.maintenanceVersion }}</dd>
          </div>
          <div class="cad__kv-row">
            <dt>文件大小</dt>
            <dd>{{ formatSize(info?.size ?? 0) }}</dd>
          </div>
        </dl>
        <div class="cad__nodwg-tip">
          <strong>获得完整预览：</strong>在 CAD 软件中把本图<b>另存为 DXF</b> 后重新上传。
          DXF 是开放文本格式，本系统可完整渲染其线段、圆弧、多段线与标注。
        </div>
        <div class="cad__nodwg-actions">
          <el-button :icon="Document" @click="copyHint">复制说明</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载原文件</el-button>
        </div>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="cad__footer">
      <span v-if="hasDrawing">
        {{ entityCount }} 个图元 · {{ layerCount }} 个图层 · {{ unitsText }}
      </span>
      <span v-else>{{ versionText }} · {{ formatSize(info?.size ?? 0) }}</span>
      <span>{{ hasDrawing ? "矢量预览（SVG）" : "仅头部信息" }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   CAD 图纸预览面板（koi / Element Plus 变量体系）

   与 ArchivePreviewPanel 保持同一套结构与观感：
   颜色走 --el-* 令牌、面板不投影靠边框承载边界、
   圆角取令牌档位（控件 6 / 面板 8）。
   ======================================================== */
.cad {
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

/* ---- 头部样式已随 header 一并移除：标题与关闭按钮由外层 el-dialog 承担 ---- */

/* ---- 统计条 ---- */
.cad__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.cad__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}

.cad__stat:first-child {
  padding-left: 0;
}

.cad__stat + .cad__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.cad__stat-icon {
  color: var(--el-text-color-placeholder);
}

.cad__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.cad__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.cad__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.cad__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-wrap: wrap;
}

.cad__spacer {
  flex: 1;
  min-width: 0;
}

.cad__zoom-btn {
  min-width: 72px;
  font-variant-numeric: tabular-nums;
}

/* ---- 主体 ---- */
.cad__body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 图层侧栏 */
.cad__layers {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 8px;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}

.cad__layers-title {
  padding: 2px 6px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.cad__layer-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cad__layer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 6px;
  border-radius: var(--el-radius-sm, 6px);
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.cad__layer-row:hover {
  background: var(--el-fill-color-light);
}

.cad__layer-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cad__layer-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.cad__unsupported {
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
}

.cad__unsupported-title {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.cad__unsupported-text {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.cad__unsupported-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}

/* 画布 */
.cad__canvas {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  /* 制图背景：细网格，帮助判断比例尺（工程制图惯例） */
  background-color: var(--el-bg-color);
  background-image:
    linear-gradient(to right, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px),
    linear-gradient(to bottom, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px);
  background-size: 24px 24px;
  cursor: grab;
  touch-action: none;
}

.cad__canvas.is-dragging {
  cursor: grabbing;
}

/* 内层缩放容器。

   关键点：宽度必须由**画布**决定，不能由内容（SVG）决定。SVG 由服务端按固定
   像素宽生成（如 1600），若让内层盒子自适应内容，它会撑到 1600px 宽，
   此时 `max-width:100%` 的参照系也是 1600px，裁切依旧发生。
   故显式 `width:100%` 让盒子先贴合画布，再由 SVG 自身等比缩放填入。 */
.cad__canvas-inner {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  /* 描边色交给容器的 color，SVG 内的 currentColor 由此继承 */
  color: var(--el-text-color-primary);
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}

.cad__canvas.is-dragging .cad__canvas-inner {
  transition: none;
}

.cad__svg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.cad__svg :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.cad__canvas-hint {
  position: absolute;
  right: 12px;
  bottom: 10px;
  padding: 3px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  pointer-events: none;
  opacity: 0.85;
}

/* DWG 无图形态 */
.cad__nodwg {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  overflow-y: auto;
  text-align: center;
}

.cad__nodwg-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
}

.cad__nodwg-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.cad__nodwg-text {
  max-width: 460px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.cad__kv {
  width: 100%;
  max-width: 420px;
  margin: 6px 0 0;
  padding: 4px 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  text-align: left;
}

.cad__kv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  font-size: 13px;
}

.cad__kv-row + .cad__kv-row {
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}

.cad__kv dt {
  width: 130px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.cad__kv dd {
  margin: 0;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.cad__nodwg-tip {
  max-width: 460px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  text-align: left;
}

.cad__nodwg-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.cad__placeholder {
  flex: 1;
  padding: 20px;
}

/* ---- 底部状态栏 ---- */
.cad__footer {
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

/* ---- 滚动条 ---- */
.cad__layers::-webkit-scrollbar,
.cad__nodwg::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.cad__layers::-webkit-scrollbar-thumb,
.cad__nodwg::-webkit-scrollbar-thumb {
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-border-color-dark);
}

.cad__layers::-webkit-scrollbar-thumb:hover,
.cad__nodwg::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-placeholder);
}

/* ---- 无障碍：尊重「减少动态效果」偏好 ---- */
@media (prefers-reduced-motion: reduce) {
  .cad__layer-row,
  .cad__canvas-inner {
    transition: none;
  }
}
</style>
