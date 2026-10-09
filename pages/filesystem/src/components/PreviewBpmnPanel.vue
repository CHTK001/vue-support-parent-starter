<script setup lang="ts">
/**
 * BPMN 流程图预览面板组件
 *
 * <p><b>纯前端渲染</b>：票据直链取回 XML 字节，浏览器内用 bpmn-js 的
 * NavigatedViewer 渲染 BPMN 2.0 流程图，不经后端转换。视图器自带鼠标
 * 平移（拖拽空白处）与缩放（滚轮），工具条再补放大 / 缩小 / 适应画布 /
 * 重置四个按钮，纯查看场景不需要 Modeler 的编辑栈。</p>
 *
 * <p><b>为什么面板不进 iframe</b>：与 Geo / CAD 面板同理 —— iframe 通道渲染
 * 的是独立 HTML 页面，读不到主应用的 koi 主题变量，暗色模式与品牌色全丢。</p>
 *
 * <p><b>模块加载口径</b>：本面板由父级 defineAsyncComponent 异步加载，
 * bpmn-js 本体再用动态 import 切进独立 chunk，两份静态 CSS
 * （diagram-js.css / bpmn.css）随本 chunk 走，均不进主包。
 * 注意：安装版本 bpmn-js@18 的包根出口只 re-export Viewer，
 * NavigatedViewer 必须走 {@code bpmn-js/lib/NavigatedViewer} 深路径
 * default import，任务书里的 {@code import \{ NavigatedViewer \} from "bpmn-js"}
 * 形态在该版本不存在。</p>
 *
 * <p><b>统计口径</b>：以渲染后的 elementRegistry 为准（与画面严格一致），
 * 按语义元素的 {@code $type} 归类 —— 节点 = Task 系 / SubProcess /
 * CallActivity，网关 = *Gateway，事件 = *Event；标签形状与画布根元素
 * 不计数。</p>
 *
 * @author CH
 * @since 2026/10/08
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download, FullScreen, Refresh, ScaleToOriginal, ZoomIn, ZoomOut } from "@element-plus/icons-vue";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import { resolveObjectUrl } from "../api/filestorageApi";

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

/** 超过该长度（字符，约等于字节）拒绝解析：拖几十 MB 进弹层只会卡死页面 */
const MAX_XML_CHARS = 20 * 1024 * 1024;

/** 每次缩放的倍率（放大乘、缩小除） */
const ZOOM_STEP = 1.25;

/** ===== bpmn-js 最小类型面（只用到的几个方法，避免 any 逃逸） ===== */

/** 画布服务：缩放与滚动 */
interface BpmnCanvas {
  /** 取当前缩放级别；传数值或 "fit-viewport" 为设置 */
  zoom(newScale?: number | "fit-viewport"): number;
  /** 取 / 设滚动位置（设为 0,0 即回到原点） */
  scroll(delta?: { x?: number; y?: number }): { x: number; y: number };
  /** 容器尺寸变化后通知画布重算视口 */
  resized(): void;
}

/** 语义元素（bpmn-js 在 diagram 元素上挂的 businessObject） */
interface BpmnSemantics {
  /** BPMN 类型全名，如 "bpmn:UserTask" */
  $type?: string;
}

/** 画布注册表里的图元 */
interface BpmnElement {
  /** 挂接的语义元素（根元素与连线也有） */
  businessObject?: BpmnSemantics;
}

/** NavigatedViewer 实例（本面板实际用到的面） */
interface BpmnViewer {
  /** 解析并渲染 BPMN 2.0 XML；18.x 是纯 Promise 形态，失败抛 ImportXMLError */
  importXML(xml: string): Promise<{ warnings: string[] }>;
  /** 销毁实例，解绑容器与事件 */
  destroy(): void;
  /** 按服务名取内部模块（canvas / elementRegistry） */
  get<T>(name: string): T;
}

/** NavigatedViewer 构造器形态 */
type NavigatedViewerCtor = new (options: { container: HTMLElement }) => BpmnViewer;

/** 根容器元素不计数（bpmn:Process / bpmn:Collaboration 等） */
const ROOT_TYPES = new Set(["bpmn:Process", "bpmn:Collaboration", "bpmn:SubProcess"]);

/** 节点：Task 系 + 各类子流程 / 调用活动 */
const NODE_RE = /^bpmn:(\w*Task|SubProcess|CallActivity|Transaction)$/;
/** 网关：独占 / 并行 / 包容 / 事件等 */
const GATEWAY_RE = /^bpmn:\w*Gateway$/;
/** 事件：开始 / 结束 / 中间 / 边界等 */
const EVENT_RE = /^bpmn:\w*Event$/;

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

/** 统计：图元总数（不含根与标签） */
const totalElements = ref(0);
/** 统计：流程节点数（Task 系 / 子流程 / 调用活动） */
const nodeCount = ref(0);
/** 统计：网关数 */
const gatewayCount = ref(0);
/** 统计：事件数 */
const eventCount = ref(0);
/** 统计：连线数（SequenceFlow / MessageFlow / DataAssociation） */
const flowCount = ref(0);

/** 统计：导入警告数（bpmn-js 能渲染但有告警时提示） */
const warningCount = ref(0);
/** 当前缩放百分比（工具条显示） */
const zoomPercent = ref(100);

/** 画布容器引用 */
const canvasHost = ref<HTMLDivElement>();
/** NavigatedViewer 实例（未就绪为 null） */
let viewer: BpmnViewer | null = null;
/** 动态 import 的模块 Promise（并发加载只发一次） */
let modulePromise: Promise<{ default: NavigatedViewerCtor }> | null = null;
/** 容器尺寸观察器：弹层动画/拉伸后通知画布重算视口 */
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

/** 把 importXML 的原始报错转成中文可读文案 */
function friendlyXmlError(raw: string): string {
  if (/no diagram/i.test(raw)) {
    return "不是有效的 BPMN 文件（XML 里没有图形信息 DI，无法渲染图形）";
  }
  if (/failed to parse|unparsable|syntax/i.test(raw)) {
    return `不是有效的 BPMN 文件（XML 解析失败：${raw}）`;
  }
  return `不是有效的 BPMN 文件（${raw}）`;
}

/** 加载 bpmn-js 模块（单飞）并创建视图器实例 */
async function ensureViewer(): Promise<void> {
  if (viewer) {
    return;
  }
  const host = canvasHost.value;
  if (!host) {
    throw new Error("画布容器未就绪");
  }
  modulePromise ??= import("bpmn-js/lib/NavigatedViewer") as Promise<{
    default: NavigatedViewerCtor;
  }>;
  const mod = await modulePromise;
  viewer = new mod.default({ container: host });
  resizeObs = new ResizeObserver(() => {
    viewer?.get<BpmnCanvas>("canvas").resized();
  });
  resizeObs.observe(host);
}

/**
 * 从渲染结果里统计语义元素分布。
 *
 * <p>标签形状（挂在 labelTarget 上）与画布根元素不计数；bpmn:SubProcess
 * 作为容器出现时会同时注册为根（折叠态），靠 ROOT_TYPES 去重。</p>
 */
function collectStats(): void {
  if (!viewer) {
    return;
  }
  const registry = viewer.get<{ getAll(): BpmnElement[] }>("elementRegistry");
  let total = 0;
  let nodes = 0;
  let gateways = 0;
  let events = 0;
  let flows = 0;
  for (const el of registry.getAll()) {
    const t = el.businessObject?.$type;
    if (!t || ROOT_TYPES.has(t)) {
      continue;
    }
    // 标签形状复用被标注元素的 businessObject，不重复计数
    if ((el as { labelTarget?: unknown }).labelTarget) {
      continue;
    }
    total += 1;
    if (NODE_RE.test(t)) {
      nodes += 1;
    } else if (GATEWAY_RE.test(t)) {
      gateways += 1;
    } else if (EVENT_RE.test(t)) {
      events += 1;
    } else if (t.endsWith("Flow") || t.endsWith("Association")) {
      flows += 1;
    }
  }
  totalElements.value = total;
  nodeCount.value = nodes;
  gatewayCount.value = gateways;
  eventCount.value = events;
  flowCount.value = flows;
}

/** 刷新工具条上的缩放百分比 */
function syncZoom(): void {
  const canvas = viewer?.get<BpmnCanvas>("canvas");
  zoomPercent.value = canvas ? Math.round(canvas.zoom() * 100) : 100;
}

/**
 * 加载并渲染：签票据 → fetch 字节 → TextDecoder 解码 → importXML。
 *
 * <p>包内条目必须带 {@code preview=true&inner=}：条目提取只挂在预览分支上，
 * 只传 inner 会拿到整个压缩包的字节。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  totalElements.value = 0;
  nodeCount.value = 0;
  gatewayCount.value = 0;
  eventCount.value = 0;
  flowCount.value = 0;
  warningCount.value = 0;
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
    const xml = new TextDecoder("utf-8").decode(await res.arrayBuffer());
    if (xml.length > MAX_XML_CHARS) {
      throw new Error("文件超过 20 MB，请下载后用专业 BPMN 工具查看");
    }
    if (!xml.includes("<")) {
      throw new Error("不是有效的 BPMN 文件（内容不是 XML 文本）");
    }
    await ensureViewer();
    const v = viewer;
    if (!v) {
      throw new Error("渲染引擎初始化失败");
    }
    try {
      const { warnings } = await v.importXML(xml);
      warningCount.value = warnings.length;
    } catch (e) {
      // importXML 失败时错误对象上同时挂着 warnings，只取 message 展示
      throw new Error(friendlyXmlError((e as Error)?.message || "导入失败"));
    }
    // 弹层动画期间容器尺寸可能为 0，先适应一次再补一次
    void nextTick(() => {
      if (!viewer) {
        return;
      }
      viewer.get<BpmnCanvas>("canvas").zoom("fit-viewport");
      syncZoom();
      collectStats();
    });
    setTimeout(() => {
      if (viewer) {
        viewer.get<BpmnCanvas>("canvas").zoom("fit-viewport");
        syncZoom();
      }
    }, 350);
  } catch (e) {
    errorText.value = (e as Error)?.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

/** 工具条：放大（围绕当前视口中心） */
function zoomIn(): void {
  const canvas = viewer?.get<BpmnCanvas>("canvas");
  if (!canvas) {
    return;
  }
  canvas.zoom(Math.min(canvas.zoom() * ZOOM_STEP, 8));
  syncZoom();
}

/** 工具条：缩小 */
function zoomOut(): void {
  const canvas = viewer?.get<BpmnCanvas>("canvas");
  if (!canvas) {
    return;
  }
  canvas.zoom(Math.max(canvas.zoom() / ZOOM_STEP, 0.1));
  syncZoom();
}

/** 工具条：适应画布 */
function zoomFit(): void {
  const canvas = viewer?.get<BpmnCanvas>("canvas");
  if (!canvas) {
    return;
  }
  canvas.zoom("fit-viewport");
  syncZoom();
}

/** 工具条：重置（100% + 回到原点） */
function zoomReset(): void {
  const canvas = viewer?.get<BpmnCanvas>("canvas");
  if (!canvas) {
    return;
  }
  canvas.zoom(1);
  canvas.scroll({ x: 0, y: 0 });
  syncZoom();
}

onMounted(() => {
  void load();
});

watch(() => [props.bucket, props.objectKey, props.inner], () => void load());

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  resizeObs = null;
  // destroy() 会一并解绑容器与事件，避免弹层反复开关泄漏监听
  viewer?.destroy();
  viewer = null;
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
  return `BPMN .${ext.toUpperCase()}`;
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
  if (warningCount.value > 0) {
    return `已渲染 · ${warningCount.value} 条导入警告`;
  }
  return "已渲染";
});
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担 -->
  <section class="bpmn" aria-label="BPMN 流程图预览">
    <!-- ===== 统计条 ===== -->
    <div class="bpmn__stats">
      <div class="bpmn__stat">
        <span class="bpmn__stat-label">类型</span>
        <b class="bpmn__stat-value bpmn__stat-value--accent">{{ typeText }}</b>
      </div>
      <div class="bpmn__stat">
        <span class="bpmn__stat-label">大小</span>
        <b class="bpmn__stat-value">{{ sizeText }}</b>
      </div>
      <div class="bpmn__stat">
        <span class="bpmn__stat-label">元素</span>
        <b class="bpmn__stat-value">{{ totalElements }} 个</b>
      </div>
      <div class="bpmn__stat">
        <span class="bpmn__stat-label">节点</span>
        <b class="bpmn__stat-value">{{ nodeCount }}</b>
      </div>
      <div class="bpmn__stat">
        <span class="bpmn__stat-label">网关</span>
        <b class="bpmn__stat-value">{{ gatewayCount }}</b>
      </div>
      <div class="bpmn__stat">
        <span class="bpmn__stat-label">事件</span>
        <b class="bpmn__stat-value">{{ eventCount }}</b>
      </div>
      <div class="bpmn__stat">
        <span class="bpmn__stat-label">连线</span>
        <b class="bpmn__stat-value">{{ flowCount }}</b>
      </div>
    </div>

    <!-- ===== 工具条 ===== -->
    <div class="bpmn__toolbar">
      <el-button-group>
        <el-button :icon="ZoomOut" :disabled="!!errorText" title="缩小" aria-label="缩小" @click="zoomOut" />
        <span class="bpmn__zoom-readout" title="当前缩放">{{ zoomPercent }}%</span>
        <el-button :icon="ZoomIn" :disabled="!!errorText" title="放大" aria-label="放大" @click="zoomIn" />
      </el-button-group>
      <el-button-group>
        <el-button
          :icon="FullScreen"
          :disabled="!!errorText"
          title="适应画布"
          aria-label="适应画布"
          @click="zoomFit"
        />
        <el-button
          :icon="ScaleToOriginal"
          :disabled="!!errorText"
          title="重置（100% 并回到原点）"
          aria-label="重置"
          @click="zoomReset"
        />
      </el-button-group>
      <span class="bpmn__hint">拖拽平移 · 滚轮缩放</span>
      <div class="bpmn__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="reload" />
      <el-button :icon="Download" title="下载文件" @click="downloadSelf">
        {{ inner ? "打开" : "下载" }}
      </el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <!-- 画布容器必须始终挂在 DOM 上（v-if 重建会丢 viewer 实例并重复绑监听），
         加载/错误/空态全部作为绝对覆盖层叠在它上面 -->
    <div class="bpmn__stage-wrap">
      <div ref="canvasHost" class="bpmn__stage" />
      <div v-if="errorText" class="bpmn__overlay">
        <el-empty :description="errorText">
          <el-button type="primary" :icon="Refresh" @click="reload">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </el-empty>
      </div>
      <div v-else-if="loading" class="bpmn__overlay bpmn__overlay--soft">
        <el-skeleton :rows="4" animated />
        <p class="bpmn__loading-text">正在解析 BPMN 流程图…</p>
      </div>
      <div v-else-if="totalElements === 0" class="bpmn__overlay bpmn__overlay--soft">
        <el-empty description="该文件不含任何可渲染的流程元素" />
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="bpmn__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span :class="{ 'is-error': !!errorText }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   BPMN 预览面板（koi / Element Plus 变量体系）

   结构与 Geo / CAD / 音视频面板一致：统计条 + 工具条 + 主体 + 状态栏。
   bpmn-js 的 SVG 画布是深层子节点，主题色穿透用 :deep 覆盖其自带样式，
   暗色模式全部走变量，不写死颜色。
   ======================================================== */
.bpmn {
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
.bpmn__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.bpmn__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
  min-width: 0;
}

.bpmn__stat:first-child {
  padding-left: 0;
}

.bpmn__stat + .bpmn__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.bpmn__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.bpmn__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bpmn__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.bpmn__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

/* 缩放百分比读数嵌在按钮组中间，视觉上与 +/- 成为一体 */
.bpmn__zoom-readout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  background: var(--el-fill-color-blank);
  border-top: 1px solid var(--el-border-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  user-select: none;
}

.bpmn__hint {
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bpmn__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.bpmn__stage-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.bpmn__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* bpmn-js 的容器默认白底、隐光标，交给主题变量并保留导航光标 */
.bpmn__stage :deep(.bjs-container) {
  background: var(--el-bg-color-page);
  font-family: inherit;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

/* SVG 画布边框与其默认阴影去掉，让网格底色直接透出来 */
.bpmn__stage :deep(.djs-container) {
  background-color: var(--el-bg-color-page);
  background-image:
    linear-gradient(to right, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px),
    linear-gradient(to bottom, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* 图元描边/文字随主题色走：--el-border-color-dark 在暗色下是浅灰 */
.bpmn__stage :deep(.djs-element .djs-visual) {
  filter: none;
}

.bpmn__stage :deep(.djs-element .djs-outline) {
  stroke: var(--el-color-primary);
}

.bpmn__stage :deep(.bjs-powered-by) {
  display: none;
}

/* 加载 / 错误覆盖层：盖住整块画布区，不挤压布局 */
.bpmn__overlay {
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

.bpmn__overlay--soft {
  align-items: stretch;
  justify-content: flex-start;
  background: var(--el-bg-color-page);
}

.bpmn__loading-text {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* ---- 底部状态栏 ---- */
.bpmn__footer {
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

.bpmn__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bpmn__footer .is-error {
  color: var(--el-color-danger);
}
</style>
