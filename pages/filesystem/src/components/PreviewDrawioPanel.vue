<script setup lang="ts">
/**
 * drawio 绘图预览面板组件
 *
 * <p><b>纯前端渲染</b>：票据直链取回 .drawio 字节，浏览器内用自托管的
 * draw.io viewer({@code viewer-static.min.js}) 渲染，不经后端转换、不依赖外网。</p>
 *
 * <p><b>为什么面板不进 iframe</b>：与 Geo / CAD / BPMN 面板同理 —— iframe 通道
 * 渲染的是独立 HTML 页面，读不到主应用的 koi 主题变量，暗色模式与品牌色全丢。</p>
 *
 * <p><b>离线口径</b>：viewer 脚本经 {@code ?url} 打进产物、由本组件动态注入
 * 一个 {@code <script>} 加载（全局 {@code window.GraphViewer}），运行期不请求
 * 任何 CDN。注意 viewer 头部的 {@code STYLE_PATH / SHAPES_PATH / STENCIL_PATH}
 * 默认仍指向 viewer.diagrams.net，只有图形引用了外部图片或未内置的形状库时
 * 才会去取——纯图形 / 通用形状的流程图离线可用。</p>
 *
 * <p><b>两种内容形态</b>：明文 {@code <mxfile> / <mxGraphModel>} XML，以及
 * drawio 压缩形态（页面内容为 base64 + raw deflate）。压缩内容用浏览器原生
 * {@code DecompressionStream} 解压（先 {@code atob} → {@code Uint8Array} →
 * inflate → {@code TextDecoder}），先试 {@code deflate-raw}（drawio 实际用的
 * {@code pako.deflateRaw}），再退 {@code deflate}（zlib 头，少数 {@code unchecked}
 * 导出）。解不开的按明文处理，两条路径都失败才报错。</p>
 *
 * @author CH
 * @since 2026/10/08
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FullScreen,
  Refresh,
  ScaleToOriginal,
} from "@element-plus/icons-vue";
import { resolveObjectUrl } from "../api/filestorageApi";
import viewerUrl from "../assets/vendor/drawio-viewer.min.js?url";

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
const MAX_XML_CHARS = 30 * 1024 * 1024;

/** ===== draw.io viewer 最小类型面（只用到的几个成员，避免 any 逃逸） ===== */

/** GraphViewer 实例（本面板实际用到的面） */
interface DrawioViewer {
  /** 内部 mxGraph（用于销毁与重置） */
  graph?: { destroy?: () => void; zoomActual?: () => void } | null;
  /** 切换到第 page 页（仅 {@code <mxfile>} 有多页时才有） */
  selectPage?: (page: number) => void;
  /** 各页 {@code <diagram>} 节点（仅 {@code <mxfile>} 有） */
  diagrams?: Element[];
  /** 当前页索引（0 起） */
  currentPage?: number;
  /** 适应边框重排（auto-fit 且非 responsive 分支时由 viewer 自行绑定） */
  fitGraph?: (scale?: number) => void;
}

/** 全局注入的 draw.io viewer 面 */
interface DrawioGlobal {
  /** 构造器：容器 + XML 根元素 + 配置 */
  GraphViewer?: new (
    container: HTMLElement,
    xmlNode: Element,
    config?: Record<string, unknown>,
  ) => DrawioViewer;
}

/** {@code DecompressionStream} 最小构造签名（不依赖 TS lib 版本是否声明） */
type DecompressionStreamCtor = new (
  format: "deflate" | "deflate-raw" | "gzip",
) => TransformStream<Uint8Array, Uint8Array>;

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

/** 页面清单（每页名称；单页文件只有一项） */
const pages = ref<string[]>([]);
/** 当前页索引（0 起） */
const currentPage = ref(0);

/** 是否「适应边框」（true）还是「原始尺寸 100%」（false） */
const fitMode = ref(true);

/** 画布容器引用（GraphViewer 的宿主节点） */
const canvasHost = ref<HTMLDivElement>();
/** GraphViewer 实例（未就绪为 null） */
let viewer: DrawioViewer | null = null;
/** 解析后的 XML 根元素（{@code <mxfile>} 或 {@code <mxGraphModel>}），重建视图器复用 */
let rootNode: Element | null = null;
/** 容器尺寸观察器：弹层动画结束后容器才有尺寸，此时补一次挂载 */
let resizeObs: ResizeObserver | null = null;
/** 正在挂载标记，避免并发重复创建 */
let mounting = false;

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

/** 取 {@code DecompressionStream} 构造器；浏览器不支持时返回 undefined */
function decompressionCtor(): DecompressionStreamCtor | undefined {
  return (globalThis as unknown as { DecompressionStream?: DecompressionStreamCtor })
    .DecompressionStream;
}

/** base64（可缺省 padding、可含空白）→ 字节 */
function base64ToBytes(content: string): Uint8Array {
  let s = content.replace(/\s+/g, "");
  const rem = s.length % 4;
  if (rem === 2) {
    s += "==";
  } else if (rem === 3) {
    s += "=";
  } else if (rem === 1) {
    throw new Error("base64 长度非法");
  }
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

/** 用 DecompressionStream 解压字节（deflate-raw / deflate），失败抛错 */
async function inflateBytes(
  bytes: Uint8Array,
  format: "deflate" | "deflate-raw",
): Promise<Uint8Array> {
  const Ctor = decompressionCtor();
  if (!Ctor) {
    throw new Error("当前浏览器不支持 DecompressionStream");
  }
  const stream = new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(new Ctor(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * 解压 drawio 压缩内容。
 *
 * <p>drawio 的压缩口径（{@code Graph.compress}）是
 * {@code btoa(deflateRaw(encodeURIComponent(xml)))}，因此逆过程为
 * {@code decodeURIComponent(inflateRaw(atob(text)))}。先试 raw，再试带
 * zlib 头的 deflate；两条都失败才算损坏。</p>
 *
 * @param content 压缩页面/文件的文本内容（base64）
 * @returns 解压后的 XML 文本
 */
async function decompressDrawio(content: string): Promise<string> {
  if (!decompressionCtor()) {
    throw new Error("当前浏览器不支持 DecompressionStream，无法解压 drawio 压缩文件，请升级浏览器");
  }
  const cleaned = content.replace(/\s+/g, "");
  if (!cleaned || !/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    throw new Error("drawio 压缩内容不是合法的 base64");
  }
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(cleaned);
  } catch {
    throw new Error("drawio 压缩内容 base64 解码失败");
  }
  let text: string | null = null;
  for (const format of ["deflate-raw", "deflate"] as const) {
    try {
      text = new TextDecoder("utf-8").decode(await inflateBytes(bytes, format));
      break;
    } catch {
      text = null;
    }
  }
  if (text === null) {
    throw new Error("drawio 压缩内容解压失败（数据损坏或格式不受支持）");
  }
  try {
    // 压缩前做过 encodeURIComponent，解压后要还原；少数文件没做则保留原文
    text = decodeURIComponent(text);
  } catch {
    /* 保留原文 */
  }
  return text.trim();
}

/**
 * 确保 {@code <diagram>} 下挂着一个 {@code <mxGraphModel>} 子元素。
 *
 * <p>明文文件的 diagram 直接就是子元素，无需处理；压缩文件的 diagram 文本是
 * base64，此处解压后作为子元素插入，并清掉原文本 —— viewer 的
 * {@code Editor.parseDiagramNode} 看到有文本就会当压缩串去 atob，必须清干净。</p>
 *
 * @param diagram {@code <diagram>} 元素
 * @param index   页序号（0 起，用于报错文案）
 */
async function ensureModelChild(diagram: Element, index: number): Promise<void> {
  const hasModel = Array.from(diagram.children).some((c) => c.nodeName === "mxGraphModel");
  if (hasModel) {
    return;
  }
  const text = (diagram.textContent ?? "").trim();
  if (!text) {
    throw new Error(`第 ${index + 1} 页没有内容`);
  }
  const modelText = text.startsWith("<") ? text : await decompressDrawio(text);
  const modelDoc = new DOMParser().parseFromString(modelText, "text/xml");
  if (modelDoc.querySelector("parsererror")) {
    throw new Error(`第 ${index + 1} 页内容解析失败（不是有效的 XML）`);
  }
  const model = modelDoc.documentElement;
  if (!model || model.nodeName !== "mxGraphModel") {
    throw new Error(`第 ${index + 1} 页不是 mxGraphModel（${model?.nodeName ?? "空"}）`);
  }
  const imported = diagram.ownerDocument.importNode(model, true);
  diagram.textContent = "";
  diagram.appendChild(imported);
}

/**
 * 解析 drawio 文本为 XML 根元素与页面清单。
 *
 * <p>支持整文件压缩（文本不是以 {@code <} 开头时的 base64）与逐页压缩
 * （{@code <mxfile>} 下每个 {@code <diagram>}）。返回的根元素已把每页
 * 规整为带 {@code <mxGraphModel>} 子元素的形态。</p>
 *
 * @param raw          文件文本
 * @param fallbackName 单页文件（裸 {@code <mxGraphModel>}）时的页面名
 */
async function parseDrawio(
  raw: string,
  fallbackName: string,
): Promise<{ root: Element; pageNames: string[] }> {
  let text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) {
    throw new Error("文件内容为空");
  }
  if (!text.startsWith("<")) {
    // 不以 < 开头先按压缩形态解；base64 解不开就当明文处理，
    // 交给下面的 XML 解析器给出最终判决
    try {
      const decoded = await decompressDrawio(text);
      if (decoded.startsWith("<")) {
        text = decoded;
      }
    } catch {
      /* 按明文继续走 XML 解析 */
    }
  }
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("XML 解析失败：文件不是有效的 drawio 文档");
  }
  const root = doc.documentElement;
  if (!root) {
    throw new Error("XML 解析失败：文档为空");
  }
  if (root.nodeName === "mxfile") {
    const diagrams = Array.from(root.getElementsByTagName("diagram"));
    if (diagrams.length === 0) {
      throw new Error("mxfile 中没有任何页面");
    }
    const pageNames: string[] = [];
    for (let i = 0; i < diagrams.length; i += 1) {
      await ensureModelChild(diagrams[i], i);
      pageNames.push(diagrams[i].getAttribute("name") || `第 ${i + 1} 页`);
    }
    return { root, pageNames };
  }
  if (root.nodeName === "mxGraphModel") {
    return { root, pageNames: [fallbackName] };
  }
  throw new Error(`不是 drawio 文档（根节点 ${root.nodeName}）`);
}

/** 加载并注入自托管 viewer 脚本（全局单飞，重复打开只发一次） */
let scriptPromise: Promise<DrawioGlobal> | null = null;
function ensureViewerScript(): Promise<DrawioGlobal> {
  const w = window as unknown as DrawioGlobal;
  if (w.GraphViewer) {
    return Promise.resolve(w);
  }
  if (!scriptPromise) {
    scriptPromise = new Promise<DrawioGlobal>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = viewerUrl;
      script.async = true;
      script.dataset.drawioViewer = "1";
      script.onload = () => {
        const drawio = window as unknown as DrawioGlobal;
        if (drawio.GraphViewer) {
          resolve(drawio);
        } else {
          scriptPromise = null;
          reject(new Error("drawio 渲染引擎已加载但未注册 GraphViewer"));
        }
      };
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("drawio 渲染引擎加载失败（本地 viewer 资源不可用）"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/** 销毁视图器并清空容器 */
function destroyViewer(): void {
  if (viewer) {
    try {
      viewer.graph?.destroy?.();
    } catch {
      /* 可能已被销毁，忽略 */
    }
    viewer = null;
  }
  const host = canvasHost.value;
  if (host) {
    host.innerHTML = "";
  }
}

/** 按当前 {@link fitMode} / {@link currentPage} 创建 GraphViewer（单飞 + 尺寸就绪门控） */
async function mountViewer(): Promise<void> {
  if (viewer || mounting || errorText.value || !rootNode) {
    return;
  }
  const host = canvasHost.value;
  if (!host) {
    return;
  }
  // 弹层过渡动画期间容器尺寸可能还是 0，交给 ResizeObserver 稍后重试
  if (host.clientWidth < 2 || host.clientHeight < 2) {
    return;
  }
  mounting = true;
  try {
    const drawio = await ensureViewerScript();
    const GV = drawio.GraphViewer;
    if (!GV) {
      throw new Error("drawio 渲染引擎不可用");
    }
    destroyViewer();
    const config: Record<string, unknown> = {
      page: currentPage.value,
      // auto-fit：fitGraph 按容器宽高双向缩放（默认只缩小不放大，allow-zoom-in 关）；
      // 非 auto-fit：zoom=1 原始尺寸，容器内容尺寸由 viewer 管理、外层滚动
      "auto-fit": fitMode.value,
      // 显式关掉 responsive 分支（SVG viewBox 缩放）：走经典 fitGraph 路径，
      // 行为可控且与「容器有确定高」的弹层布局配合得最好
      responsive: false,
      border: 8,
      nav: false,
    };
    if (!fitMode.value) {
      config.zoom = 1;
    }
    viewer = new GV(host, rootNode, config);
    if (!viewer) {
      throw new Error("drawio 渲染引擎初始化失败");
    }
  } catch (e) {
    errorText.value = (e as Error)?.message || "渲染失败";
  } finally {
    mounting = false;
  }
}

/**
 * 加载并解析：签票据 → fetch 字节 → 解压/规整 → 挂载视图器。
 *
 * <p>包内条目必须带 {@code preview=true&inner=}：条目提取只挂在预览分支上，
 * 只传 inner 会拿到整个压缩包的字节。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  pages.value = [];
  currentPage.value = 0;
  rootNode = null;
  destroyViewer();
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
    const raw = new TextDecoder("utf-8").decode(await res.arrayBuffer());
    if (raw.length > MAX_XML_CHARS) {
      throw new Error("文件超过 30 MB，请下载后用桌面版 draw.io 查看");
    }
    const parsed = await parseDrawio(raw, effectiveName.value);
    rootNode = parsed.root;
    pages.value = parsed.pageNames;
  } catch (e) {
    errorText.value = (e as Error)?.message || "加载失败";
  } finally {
    loading.value = false;
  }
  if (!errorText.value) {
    // 弹层动画期间容器尺寸可能为 0，先试一次，动画结束(350ms)再补一次
    void nextTick(() => void mountViewer());
    setTimeout(() => void mountViewer(), 350);
  }
}

/** 切换「适应边框 / 原始尺寸」：重建视图器（配置驱动的分支，无法热切） */
function setFit(fit: boolean): void {
  if (fitMode.value === fit) {
    return;
  }
  fitMode.value = fit;
  destroyViewer();
  void nextTick(() => void mountViewer());
}

/** 切页（多页 mxfile 才有） */
function goPage(index: number): void {
  const total = pages.value.length;
  if (total <= 1) {
    return;
  }
  const target = Math.max(0, Math.min(total - 1, index));
  if (target === currentPage.value) {
    return;
  }
  currentPage.value = target;
  viewer?.selectPage?.(target);
}

/** 页码下拉切换 */
function onPageSelect(value: string | number): void {
  goPage(Number(value));
}

onMounted(() => {
  const host = canvasHost.value;
  if (host) {
    resizeObs = new ResizeObserver(() => {
      // 只在「还没挂载」时补挂；已挂载时 viewer 自己处理响应式重排
      if (!viewer && rootNode && !errorText.value && !loading.value) {
        void mountViewer();
      }
    });
    resizeObs.observe(host);
  }
  void load();
});

watch(() => [props.bucket, props.objectKey, props.inner], () => void load());

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  resizeObs = null;
  destroyViewer();
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
  return `drawio .${ext.toUpperCase()}`;
});

/**
 * 统计条「大小」：包内条目显示 -。
 *
 * <p>同 {@link PreviewMediaPanel} 的口径：open-entry 只回传路径，能拿到的
 * {@link props.size} 是压缩包体积而非条目体积，宁可显示 - 也不标错数字。</p>
 */
const sizeText = computed(() => (props.inner ? "-" : formatSize(props.size)));

/** 多页时才显示分页器 */
const multiPage = computed(() => pages.value.length > 1);

/** 页脚右侧状态文案 */
const statusText = computed(() => {
  if (errorText.value) {
    return "无法渲染";
  }
  const mode = fitMode.value ? "适应边框" : "原始尺寸";
  return multiPage.value ? `已渲染 · ${mode} · ${currentPage.value + 1}/${pages.value.length} 页` : `已渲染 · ${mode}`;
});
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担 -->
  <section class="drawio" aria-label="drawio 绘图预览">
    <!-- ===== 统计条 ===== -->
    <div class="drawio__stats">
      <div class="drawio__stat">
        <span class="drawio__stat-label">类型</span>
        <b class="drawio__stat-value drawio__stat-value--accent">{{ typeText }}</b>
      </div>
      <div class="drawio__stat">
        <span class="drawio__stat-label">大小</span>
        <b class="drawio__stat-value">{{ sizeText }}</b>
      </div>
      <div class="drawio__stat">
        <span class="drawio__stat-label">页面</span>
        <b class="drawio__stat-value">{{ pages.length || "-" }} 页</b>
      </div>
      <div v-if="multiPage" class="drawio__stat">
        <span class="drawio__stat-label">当前</span>
        <b class="drawio__stat-value">{{ currentPage + 1 }} / {{ pages.length }}</b>
      </div>
    </div>

    <!-- ===== 工具条 ===== -->
    <div class="drawio__toolbar">
      <el-button-group>
        <el-button
          :icon="FullScreen"
          :type="fitMode ? 'primary' : 'default'"
          :disabled="!!errorText"
          title="适应边框"
          aria-label="适应边框"
          @click="setFit(true)"
        >
          适应边框
        </el-button>
        <el-button
          :icon="ScaleToOriginal"
          :type="fitMode ? 'default' : 'primary'"
          :disabled="!!errorText"
          title="原始尺寸（100%）"
          aria-label="原始尺寸"
          @click="setFit(false)"
        >
          原始尺寸
        </el-button>
      </el-button-group>

      <template v-if="multiPage">
        <el-button-group>
          <el-button
            :icon="ArrowLeft"
            :disabled="currentPage <= 0"
            title="上一页"
            aria-label="上一页"
            @click="goPage(currentPage - 1)"
          />
          <span class="drawio__page-readout" title="当前页 / 总页数">
            {{ currentPage + 1 }} / {{ pages.length }}
          </span>
          <el-button
            :icon="ArrowRight"
            :disabled="currentPage >= pages.length - 1"
            title="下一页"
            aria-label="下一页"
            @click="goPage(currentPage + 1)"
          />
        </el-button-group>
        <el-select
          class="drawio__page-select"
          :model-value="currentPage"
          size="default"
          :disabled="!!errorText"
          placeholder="选择页面"
          title="跳转到指定页"
          @change="onPageSelect"
        >
          <el-option
            v-for="(name, i) in pages"
            :key="i"
            :label="name"
            :value="i"
          />
        </el-select>
      </template>

      <span class="drawio__hint">{{ fitMode ? "适应边框" : "原始尺寸" }}</span>
      <div class="drawio__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="reload" />
      <el-button :icon="Download" title="下载文件" @click="downloadSelf">
        {{ inner ? "打开" : "下载" }}
      </el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <!-- 画布容器必须始终挂在 DOM 上（v-if 重建会丢 viewer 实例并重复绑监听），
         加载/错误覆盖层全部绝对定位叠在它上面 -->
    <div class="drawio__stage-wrap">
      <div ref="canvasHost" class="drawio__stage" style="width: 100%; height: 100%" />
      <div v-if="errorText" class="drawio__overlay">
        <el-empty :description="errorText">
          <el-button type="primary" :icon="Refresh" @click="reload">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </el-empty>
      </div>
      <div v-else-if="loading" class="drawio__overlay drawio__overlay--soft">
        <el-skeleton :rows="4" animated />
        <p class="drawio__loading-text">正在解析 drawio 绘图…</p>
      </div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="drawio__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span :class="{ 'is-error': !!errorText }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   drawio 预览面板（koi / Element Plus 变量体系）

   结构与 Geo / CAD / BPMN 面板一致：统计条 + 工具条 + 主体 + 状态栏。
   viewer 生成的 SVG 是深层子节点，主题色穿透用 :deep 覆盖其自带样式，
   暗色模式全部走变量，不写死颜色。
   ======================================================== */
.drawio {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 72vh;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}

/* ---- 统计条 ---- */
.drawio__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.drawio__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
  min-width: 0;
}

.drawio__stat:first-child {
  padding-left: 0;
}

.drawio__stat + .drawio__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.drawio__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.drawio__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawio__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.drawio__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

/* 页码读数嵌在分页按钮组中间，视觉上与前后翻页成为一体 */
.drawio__page-readout {
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

/* 页码下拉：宽度固定，长页面名靠省略号收口 */
.drawio__page-select {
  width: 180px;
}

.drawio__hint {
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawio__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
/* 外层负责滚动：原始尺寸下 viewer 可能把内容撑得比容器大 */
.drawio__stage-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.drawio__stage {
  /* 网格底色帮助判断图形相对尺度（与 CAD / Geo 面板同一套惯例）；
     GraphViewer 会把图形页背景设成透明，网格得以透出 */
  background-color: var(--el-bg-color-page);
  background-image:
    linear-gradient(to right, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px),
    linear-gradient(to bottom, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* viewer 自带工具栏/弹窗在暗色下的描边，让其跟随主题 */
.drawio__stage :deep(.geDarkMode) {
  color-scheme: dark;
}

/* 加载 / 错误覆盖层：盖住整块画布区，不挤压布局 */
.drawio__overlay {
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

.drawio__overlay--soft {
  align-items: stretch;
  justify-content: flex-start;
  background: var(--el-bg-color-page);
}

.drawio__loading-text {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* ---- 底部状态栏 ---- */
.drawio__footer {
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

.drawio__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawio__footer .is-error {
  color: var(--el-color-danger);
}
</style>
