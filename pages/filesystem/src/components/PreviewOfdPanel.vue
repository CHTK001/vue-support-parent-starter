<script setup lang="ts">
/**
 * OFD 版式文档预览面板组件
 *
 * <p><b>纯前端渲染</b>：票据直链取回 OFD 字节，浏览器内用 ofd.js 解析并渲染，
 * 不经后端转 PDF、不依赖外网。OFD（GB/T 33190）是国产版式文档标准，
 * 常见于电子发票、公文与电子档案，Windows 上双击通常打不开，
 * 服务端也没有对应的转换提供者，因此完全在前端消化。</p>
 *
 * <p><b>为什么面板不进 iframe</b>：与 Geo / CAD / BPMN 面板同理 —— iframe 通道
 * 渲染的是独立 HTML 页面，读不到主应用的 koi 主题变量，暗色模式与品牌色全丢；
 * 且后端没有 OFD 提供者，落下去只会命中「不支持预览」提示页。</p>
 *
 * <p><b>取数口径</b>：与 {@link PreviewGeoPanel} 完全一致 ——
 * {@code resolveObjectUrl} 签短时票据后 {@code fetch} 字节；压缩包内条目必须带
 * {@code ?preview=true&inner=}，条目提取只挂在预览分支上，只传 inner 会拿到
 * 整个压缩包的字节。</p>
 *
 * <p><b>ofd.js 的接入结论（@1.5.0）</b>：产物是 webpack UMD（{@code module.exports}
 * 形态），具名导出靠 {@code Object.defineProperty(exports, name, {get})} 挂载，
 * 打包器无法可靠静态识别，故<b>按 default 对象取用</b>并在运行时逐函数校验。
 * 解析与解包全部在该包内联的 WASM（{@code data:application/wasm;base64}）里完成，
 * <b>不需要全局 JSZip</b>，也不需要外部 .wasm 文件；{@code parser_helper_x.js} /
 * {@code axios} 已随 pnpm 装好。类型面见 {@code src/types/ofd.d.ts}。</p>
 *
 * <p><b>渲染策略</b>：页数 ≤ {@link MAX_ALL_PAGES} 时用 {@code renderOfd} 一次性
 * 渲染全部页、滚动连续阅读（滚动位置反推当前页号）；页数更多时改用
 * {@code renderOfdByIndex} 单页渲染 + 上一页/下一页，避免几十上百个 canvas
 * 同时驻留把内存打满。缩放提供「适宽」（渲染宽度取容器宽）与「100%」
 * （按页面物理宽度的 96 DPI 换算值）两档。</p>
 *
 * <p><b>已知限制</b>：未提供授权 secret/digest 时，ofd.js 会给每页叠加
 * {@code demotest} 水印（库的未授权行为，面板不做规避）；卸载时不调用导出的
 * {@code free()}（其实现不清空内部单例，会导致下一次解析二次 free），
 * 最多滞留一份文档的内存，下一次解析时由库内部释放。</p>
 *
 * @author CH
 * @since 2026/10/08
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ArrowLeft, ArrowRight, Download, Refresh } from "@element-plus/icons-vue";
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

/** 页数超过该值时改走单页渲染（几十个 canvas 同时驻留会把内存打满） */
const MAX_ALL_PAGES = 20;

/** 解析字节数上限：主线程 WASM 解析，超大文件只会把页面卡死 */
const MAX_BYTES = 100 * 1024 * 1024;

/** 解析超时（毫秒）：库是回调式 API，异常形态下回调可能永不到达 */
const PARSE_TIMEOUT_MS = 60_000;

/** 容器宽度取不到时的兜底渲染宽度（A4 @ 96 DPI ≈ 794px） */
const DEFAULT_WIDTH = 794;

/** 适宽模式下页面两侧留白合计（像素） */
const FIT_PADDING = 32;

/** 适宽模式重排的防抖时长（毫秒） */
const REFIT_DEBOUNCE_MS = 150;

/** 渲染文档下标：OFD 多文档容器少见，面板固定渲染首文档 */
const DOC_INDEX = 0;

/** 缩放档位 */
type ZoomMode = "fit" | "actual";

/**
 * ofd.js 的最小 API 面。
 *
 * <p>UMD 产物无类型声明，且具名导出经 {@code Object.defineProperty} 动态挂载，
 * 因此这里只声明本面板用到的一小块，运行时取 default 对象后逐项校验。</p>
 */
interface OfdApi {
  /** 解析 OFD 字节（回调式） */
  parseOfdDocument(options: {
    /** OFD 字节 */
    ofd: ArrayBuffer;
    /** 成功回调 */
    success?: () => void;
    /** 失败回调 */
    fail?: (message: unknown) => void;
  }): void;
  /** 一次性渲染全部页，返回每页一个 div */
  renderOfd(documentIndex: number, width: number): HTMLDivElement[];
  /** 渲染单页，返回一个 div */
  renderOfdByIndex(documentIndex: number, pageIndex: number, width: number): HTMLDivElement;
  /** 取页数 */
  getOFDPageCount(documentIndex: number): number;
  /** 取页面尺寸（用 renderWidth 反推 100% 档位的渲染宽度） */
  pageSize(documentIndex: number, pageIndex: number, dpi?: number): { renderWidth?: number };
}

/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 加载中（取数 + 首次解析 + 首次渲染） */
const loading = ref(true);
/** 重新渲染中（缩放 / 翻页触发的重排，不遮住整块区域，只显示角标） */
const rendering = ref(false);
/** 错误文案（空串表示无错） */
const errorText = ref("");

/** 总页数 */
const pageCount = ref(0);
/** 当前页（1 基） */
const currentPage = ref(1);
/** 缩放档位：适宽 / 100% */
const zoomMode = ref<ZoomMode>("fit");

/** 名称上的页面物理宽度（96 DPI 换算值，用于 100% 档位与缩放读数） */
const nativeWidth = ref(0);
/** 上次实际渲染宽度（像素） */
const lastRenderWidth = ref(0);

/** 滚动视口引用（页面栈的滚动容器） */
const viewportEl = ref<HTMLDivElement>();
/** 页面栈引用（ofd.js 生成的页 div 挂在这里） */
const pagesEl = ref<HTMLDivElement>();

/** ofd.js 模块（动态 import 单飞缓存） */
let ofdModulePromise: Promise<OfdApi> | null = null;
/** 取到的 ofd.js API */
let ofdApi: OfdApi | null = null;
/** 是否已成功解析出文档（决定能否渲染 / 翻页 / 缩放） */
let parsed = false;
/** 组件是否已卸载（拦截在途异步回调） */
let disposed = false;
/** 渲染序号：并发渲染时只有最后一次生效 */
let renderSeq = 0;
/** 容器尺寸观察器 */
let resizeObs: ResizeObserver | null = null;
/** 适宽重排防抖定时器 */
let refitTimer = 0;

/** 页数是否超过阈值（超过则单页渲染 + 翻页） */
const singlePageMode = computed(() => pageCount.value > MAX_ALL_PAGES);

/** 缩放读数（%）：渲染宽度 / 页面物理宽度 */
const zoomPercent = computed(() => {
  const native = nativeWidth.value;
  if (!parsed || !native || native <= 0) {
    return 100;
  }
  return Math.round((lastRenderWidth.value / native) * 100);
});

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

/** 异常 → 中文可读文案（本面板抛出的 message 已是完整文案，原样用） */
function friendlyError(e: unknown): string {
  if (e instanceof Error && e.message) {
    return e.message;
  }
  return typeof e === "string" && e ? e : "加载失败";
}

/** 解析失败回调的原始信息 → 统一文案 */
function friendlyParseError(message: unknown): string {
  const raw = message instanceof Error ? message.message : typeof message === "string" ? message : "";
  const brief = raw.trim().slice(0, 120);
  return brief ? `不是有效的 OFD 文档（${brief}）` : "不是有效的 OFD 文档";
}

/**
 * 轻量容器头校验：OFD 是 ZIP 容器（GB/T 33190），少数实现直接给 XML。
 *
 * <p>不是这两种开头就不必再喂给 WASM 解析器 —— 早失败比等解析超时好。</p>
 *
 * @param buffer 文件字节
 */
function assertOfdContainer(buffer: ArrayBuffer): void {
  const head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  const isZip = head[0] === 0x50 && head[1] === 0x4b; // "PK"
  const isXml = head[0] === 0x3c; // "<"
  if (!isZip && !isXml) {
    throw new Error("不是有效的 OFD 文档（缺少 ZIP 容器头，可能是普通文件改了扩展名）");
  }
}

/**
 * 动态加载 ofd.js 并校验导出形态。
 *
 * <p>UMD 的具名导出对打包器不可见，优先取 default 对象；为兼容具名导出被正确
 * 识别的情况，default 缺失时退回模块命名空间本身。缺任一必需函数即视为接入失败。</p>
 *
 * @returns 校验通过的 API
 */
function loadOfdApi(): Promise<OfdApi> {
  ofdModulePromise ??= import("ofd.js").then((mod: unknown): OfdApi => {
    const candidate = ((mod as { default?: unknown }).default ?? mod) as Partial<OfdApi>;
    if (
      typeof candidate.parseOfdDocument !== "function"
      || typeof candidate.renderOfd !== "function"
      || typeof candidate.renderOfdByIndex !== "function"
      || typeof candidate.getOFDPageCount !== "function"
      || typeof candidate.pageSize !== "function"
    ) {
      throw new Error("OFD 渲染库导出形态不符合预期（ofd.js 版本或打包形态已变化）");
    }
    return candidate as OfdApi;
  });
  return ofdModulePromise;
}

/**
 * 解析 OFD 字节（把回调式 API 包成 Promise，并加超时兜底）。
 *
 * @param api    ofd.js API
 * @param buffer 文件字节
 */
function parseOfd(api: OfdApi, buffer: ArrayBuffer): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error("解析超时（文件过大或不是有效的 OFD 文档）"));
    }, PARSE_TIMEOUT_MS);
    const finish = (fn: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      fn();
    };
    try {
      api.parseOfdDocument({
        ofd: buffer,
        success: () => finish(resolve),
        fail: (message) => finish(() => reject(new Error(friendlyParseError(message)))),
      });
    } catch (e) {
      finish(() => reject(new Error(friendlyError(e))));
    }
  });
}

/** 清空页面栈（ofd.js 生成的页 div 全部是手工挂上去的，需手工移除） */
function clearPages(): void {
  const host = pagesEl.value;
  if (!host) {
    return;
  }
  while (host.firstChild) {
    host.removeChild(host.firstChild);
  }
}

/** 重置解析态（重新加载前调用；在途渲染一并作废） */
function resetDocument(): void {
  renderSeq += 1;
  parsed = false;
  pageCount.value = 0;
  currentPage.value = 1;
  nativeWidth.value = 0;
  lastRenderWidth.value = 0;
  rendering.value = false;
  clearPages();
}

/**
 * 计算本次渲染宽度，并顺带回填页面物理宽度。
 *
 * <p>适宽：容器宽减两侧留白，容器还没量出宽（弹层动画中）时退到默认值，
 * 尺寸观察器稳定后会重排；100%：按页面物理宽度的 96 DPI 换算值。</p>
 *
 * @returns 目标渲染宽度（像素）
 */
function computeRenderWidth(): number {
  const viewport = viewportEl.value;
  const avail = viewport ? viewport.clientWidth - FIT_PADDING : 0;
  const pageIndex = singlePageMode.value ? Math.max(0, currentPage.value - 1) : 0;
  const sized = ofdApi?.pageSize(DOC_INDEX, pageIndex, 96);
  const native = Number(sized?.renderWidth ?? 0);
  nativeWidth.value = native > 0 ? Math.round(native) : DEFAULT_WIDTH;
  if (zoomMode.value === "actual") {
    return nativeWidth.value;
  }
  if (avail > 0) {
    return Math.max(320, avail);
  }
  return nativeWidth.value > 0 ? nativeWidth.value : DEFAULT_WIDTH;
}

/**
 * 按当前档位把文档画进页面栈。
 *
 * <p>整卷模式用 {@link OfdApi.renderOfd} 一次渲染所有页；单页模式用
 * {@link OfdApi.renderOfdByIndex} 只画当前页。两者都会重建 DOM，故先清空。
 * 渲染是可重入的（缩放 / 翻页 / 容器变宽都会触发），用渲染序号保证只有最后一次生效。</p>
 */
async function renderPages(): Promise<void> {
  const host = pagesEl.value;
  const api = ofdApi;
  if (!host || !api || !parsed || disposed) {
    return;
  }
  const seq = ++renderSeq;
  rendering.value = true;
  try {
    await nextTick();
    if (disposed || seq !== renderSeq) {
      return;
    }
    const width = computeRenderWidth();
    lastRenderWidth.value = width;
    clearPages();
    if (singlePageMode.value) {
      const page = api.renderOfdByIndex(DOC_INDEX, currentPage.value - 1, width);
      if (page) {
        host.appendChild(page);
      }
    } else {
      const divs = api.renderOfd(DOC_INDEX, width);
      divs.forEach((div, index) => {
        div.dataset.page = String(index + 1);
        host.appendChild(div);
      });
      scrollToPage(currentPage.value, "auto");
    }
  } catch (e) {
    errorText.value = `渲染失败（${friendlyError(e)}）`;
  } finally {
    if (seq === renderSeq) {
      rendering.value = false;
    }
  }
}

/**
 * 滚动到指定页（整卷模式）。
 *
 * @param page     目标页（1 基）
 * @param behavior 滚动行为
 */
function scrollToPage(page: number, behavior: ScrollBehavior = "smooth"): void {
  const viewport = viewportEl.value;
  const host = pagesEl.value;
  if (!viewport || !host) {
    return;
  }
  const target = host.children[page - 1] as HTMLElement | undefined;
  if (target) {
    viewport.scrollTo({ top: Math.max(0, target.offsetTop - 8), behavior });
  }
}

/** 整卷模式：滚动位置反推当前页号（只更新读数，不触发重渲染） */
function onViewportScroll(): void {
  if (singlePageMode.value || !parsed) {
    return;
  }
  const viewport = viewportEl.value;
  const host = pagesEl.value;
  if (!viewport || !host) {
    return;
  }
  const probe = viewport.scrollTop + 100;
  const children = host.children;
  let page = 1;
  for (let i = 0; i < children.length; i++) {
    if ((children[i] as HTMLElement).offsetTop <= probe) {
      page = i + 1;
    } else {
      break;
    }
  }
  currentPage.value = page;
}

/** 翻页 / 跳页：单页模式重渲染，整卷模式滚动定位 */
function goToPage(page: number): void {
  const clamped = Math.min(Math.max(1, page), Math.max(1, pageCount.value));
  currentPage.value = clamped;
  if (singlePageMode.value) {
    void renderPages();
  } else {
    scrollToPage(clamped);
  }
}

/** 工具条：上一页 */
function prevPage(): void {
  goToPage(currentPage.value - 1);
}

/** 工具条：下一页 */
function nextPage(): void {
  goToPage(currentPage.value + 1);
}

/** 工具条：切换缩放档位 */
function setZoom(mode: ZoomMode): void {
  if (zoomMode.value === mode) {
    return;
  }
  zoomMode.value = mode;
  if (parsed) {
    void renderPages();
  }
}

/**
 * 加载并渲染：签票据 → fetch 字节 → 校验 → 动态加载 ofd.js → 解析 → 渲染。
 *
 * <p>包内条目必须带 {@code preview=true&inner=}：条目提取只挂在预览分支上，
 * 只传 inner 会拿到整个压缩包的字节。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  errorText.value = "";
  resetDocument();
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
    const buffer = await res.arrayBuffer();
    if (disposed) {
      return;
    }
    if (buffer.byteLength === 0) {
      throw new Error("文件内容为空");
    }
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error("文件超过 100 MB，请下载后用专业 OFD 阅读器查看");
    }
    assertOfdContainer(buffer);
    const api = ofdApi ?? (ofdApi = await loadOfdApi());
    if (disposed) {
      return;
    }
    await parseOfd(api, buffer);
    if (disposed) {
      return;
    }
    const count = api.getOFDPageCount(DOC_INDEX);
    if (!Number.isFinite(count) || count <= 0) {
      throw new Error("不是有效的 OFD 文档（解析完成但不含页面）");
    }
    pageCount.value = count;
    currentPage.value = 1;
    parsed = true;
    await nextTick();
    await renderPages();
  } catch (e) {
    if (!disposed) {
      errorText.value = friendlyError(e);
    }
  } finally {
    loading.value = false;
  }
}

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

onMounted(() => {
  const viewport = viewportEl.value;
  if (viewport) {
    resizeObs = new ResizeObserver(() => {
      if (disposed || zoomMode.value !== "fit" || !parsed) {
        return;
      }
      const avail = viewport.clientWidth - FIT_PADDING;
      const target = avail > 0 ? Math.max(320, avail) : DEFAULT_WIDTH;
      // 只在宽度真的变了才重排：观察器回调也会被内容高度变化触发
      if (Math.abs(target - lastRenderWidth.value) > 2) {
        window.clearTimeout(refitTimer);
        refitTimer = window.setTimeout(() => void renderPages(), REFIT_DEBOUNCE_MS);
      }
    });
    resizeObs.observe(viewport);
  }
  void load();
});

watch(() => [props.bucket, props.objectKey, props.inner], () => void load());

onBeforeUnmount(() => {
  disposed = true;
  // 让在途的解析 / 渲染回调作废
  renderSeq += 1;
  window.clearTimeout(refitTimer);
  refitTimer = 0;
  resizeObs?.disconnect();
  resizeObs = null;
  // ofd.js 生成的页 div（含 canvas）必须手工摘掉，否则会随组件一起被 Vue 之外
  // 的引用留住；文档本体交由下一次 parseOfdDocument 内部释放（见文件头「已知限制」）
  clearPages();
});

/** 统计条「类型」文案 */
const typeText = computed(() => {
  const ext = effectiveName.value.split(".").pop() ?? "";
  return `OFD .${ext.toUpperCase()}`;
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
  if (loading.value) {
    return "解析中";
  }
  return `已渲染 · ${pageCount.value} 页${singlePageMode.value ? "（单页模式）" : ""}`;
});
</script>

<template>
  <!-- 无自带 header：文件名与关闭按钮由外层 el-dialog 承担 -->
  <section class="ofd" aria-label="OFD 版式文档预览">
    <!-- ===== 统计条 ===== -->
    <div class="ofd__stats">
      <div class="ofd__stat">
        <span class="ofd__stat-label">类型</span>
        <b class="ofd__stat-value ofd__stat-value--accent">{{ typeText }}</b>
      </div>
      <div class="ofd__stat">
        <span class="ofd__stat-label">大小</span>
        <b class="ofd__stat-value">{{ sizeText }}</b>
      </div>
      <div class="ofd__stat">
        <span class="ofd__stat-label">页数</span>
        <b class="ofd__stat-value">{{ pageCount || "-" }}</b>
      </div>
      <div class="ofd__stat">
        <span class="ofd__stat-label">渲染宽度</span>
        <b class="ofd__stat-value">{{ lastRenderWidth ? `${lastRenderWidth} px` : "-" }}</b>
      </div>
      <div class="ofd__stat">
        <span class="ofd__stat-label">缩放</span>
        <b class="ofd__stat-value">{{ zoomPercent }}%</b>
      </div>
    </div>

    <!-- ===== 工具条 ===== -->
    <div class="ofd__toolbar">
      <el-button-group>
        <el-button
          :type="zoomMode === 'fit' ? 'primary' : undefined"
          :disabled="!parsed"
          title="渲染宽度取容器宽"
          @click="setZoom('fit')"
        >
          适宽
        </el-button>
        <el-button
          :type="zoomMode === 'actual' ? 'primary' : undefined"
          :disabled="!parsed"
          title="按页面物理宽度（96 DPI）渲染"
          @click="setZoom('actual')"
        >
          100%
        </el-button>
      </el-button-group>
      <el-button-group>
        <el-button
          :icon="ArrowLeft"
          :disabled="!parsed || currentPage <= 1"
          title="上一页"
          aria-label="上一页"
          @click="prevPage"
        />
        <span class="ofd__page-readout" title="当前页 / 总页数">
          {{ pageCount ? `${currentPage} / ${pageCount}` : "- / -" }}
        </span>
        <el-button
          :icon="ArrowRight"
          :disabled="!parsed || currentPage >= pageCount"
          title="下一页"
          aria-label="下一页"
          @click="nextPage"
        />
      </el-button-group>
      <span class="ofd__hint">
        {{ singlePageMode ? "页数较多 · 单页渲染" : "连续滚动阅读" }}
      </span>
      <div class="ofd__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="重新加载" aria-label="刷新" @click="reload" />
      <el-button :icon="Download" title="下载文件" @click="downloadSelf">
        {{ inner ? "打开" : "下载" }}
      </el-button>
    </div>

    <!-- ===== 主体 ===== -->
    <div class="ofd__stage-wrap">
      <div ref="viewportEl" class="ofd__viewport" @scroll.passive="onViewportScroll">
        <div ref="pagesEl" class="ofd__pages" />
      </div>
      <div v-if="errorText" class="ofd__overlay">
        <el-empty :description="errorText">
          <el-button type="primary" :icon="Refresh" @click="reload">重试</el-button>
          <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
        </el-empty>
      </div>
      <div v-else-if="loading" class="ofd__overlay ofd__overlay--soft">
        <el-skeleton :rows="4" animated />
        <p class="ofd__loading-text">正在解析 OFD 文档…</p>
      </div>
      <!-- 缩放 / 翻页重排角标：不遮内容，避免整块区域闪一下 -->
      <div v-else-if="rendering" class="ofd__render-badge">正在渲染…</div>
    </div>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="ofd__footer">
      <span :title="inner ? `${fileName} › ${effectiveName}` : effectiveName">
        {{ inner ? `${fileName} › ${effectiveName}` : effectiveName }}
      </span>
      <span :class="{ 'is-error': !!errorText }">{{ statusText }}</span>
    </footer>
  </section>
</template>

<style scoped>
/* ========================================================
   OFD 预览面板（koi / Element Plus 变量体系）

   结构与 Geo / CAD / BPMN / 音视频面板一致：统计条 + 工具条 + 主体 + 状态栏。
   ofd.js 生成的是内联白底页 div（版式文档以纸面为基准，保持白底才正确），
   容器底色与阴影走主题变量，暗色模式不写死颜色。
   ======================================================== */
.ofd {
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
.ofd__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}

.ofd__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
  min-width: 0;
}

.ofd__stat:first-child {
  padding-left: 0;
}

.ofd__stat + .ofd__stat {
  border-left: 1px solid var(--el-border-color-lighter);
}

.ofd__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ofd__stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ofd__stat-value--accent {
  color: var(--el-color-primary);
}

/* ---- 工具条 ---- */
.ofd__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

/* 页码读数嵌在上一页 / 下一页中间，视觉上与按钮成为一体 */
.ofd__page-readout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  background: var(--el-fill-color-blank);
  border-top: 1px solid var(--el-border-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  user-select: none;
}

.ofd__hint {
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ofd__spacer {
  flex: 1;
  min-width: 0;
}

/* ---- 主体 ---- */
.ofd__stage-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.ofd__viewport {
  position: absolute;
  inset: 0;
  overflow: auto;
  background-color: var(--el-bg-color-page);
  /* 与 CAD / Geo 面板同一套网格底惯例，页面之外不至于空得发慌 */
  background-image:
    linear-gradient(to right, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px),
    linear-gradient(to bottom, var(--el-border-color-extra-light, var(--el-border-color-lighter)) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* 页面栈：ofd.js 返回的页 div 直接挂在这里，纵向居中排布 */
.ofd__pages {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 16px;
}

/* 页 div 是深层子节点（内联白底 + 固定宽高），只补一层主题阴影 */
.ofd__pages > :deep(div) {
  box-shadow: var(--el-box-shadow-light);
}

/* 加载 / 错误覆盖层：盖住整块阅读区，不挤压布局 */
.ofd__overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: var(--el-bg-color);
}

.ofd__overlay--soft {
  align-items: stretch;
  justify-content: flex-start;
  background: var(--el-bg-color-page);
}

.ofd__loading-text {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* 重排角标：右下角小提示，不拦截鼠标 */
.ofd__render-badge {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 9;
  padding: 4px 10px;
  border-radius: var(--el-radius-base, 4px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  pointer-events: none;
}

/* ---- 底部状态栏 ---- */
.ofd__footer {
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

.ofd__footer span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ofd__footer .is-error {
  color: var(--el-color-danger);
}
</style>
