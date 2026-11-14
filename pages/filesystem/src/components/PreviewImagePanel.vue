<script setup lang="ts">
/**
 * 图片预览与编辑面板
 *
 * <p>与 {@link PreviewIframePanel} 的关键区别：**图片不再走 iframe**，而是直接用
 * {@code <img>} 渲染，缩放/旋转/裁剪全部作用在真实像素上。</p>
 *
 * <p>此前图片走 iframe，缩放是对 iframe 容器做 {@code transform: scale()}：
 * 位图被浏览器插值重采样，放大后必然模糊，而且容器层面无法取到图像像素，
 * 也就没法裁剪或保存。这里换成 {@code <img>} + Canvas 后：</p>
 * <ul>
 *   <li>缩放：滚轮以**光标位置为锚点**缩放（视觉上该点下的像素不动），范围 10%~1600%</li>
 *   <li>旋转：0/90/180/270 度，改变的是画布尺寸而非 CSS 变换，导出时真正重排像素</li>
 *   <li>裁剪：拖拽选框，导出时按选框从原图取像素</li>
 *   <li>保存：把编辑结果编码成 Blob，经 {@code putObject} 覆盖回原对象</li>
 * </ul>
 *
 * <p>不设顶部工具栏：缩放走滚轮，旋转/裁剪用快捷键与右键菜单，鼠标停在哪就在哪操作。</p>
 *
 * @author Buffy
 * @since 2026/09/29
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, nextTick, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { authHeaders, existObject, putObject, resolveObjectUrl } from "../api/filestorageApi";
import { extensionOf } from "../utils/officeRenderer";
import { displayToImage } from "../utils/imageCoords";
import { peekImageMeta, probeImageMeta, type ImageMeta } from "../utils/imageMeta";
import {
  PREVIEW_DRAFT_EDGE,
  PREVIEW_GHOST_EDGE,
  PREVIEW_JPEG_QUALITY,
  PREVIEW_MID_EDGE,
  buildScaleParams,
  canServeJpeg,
  dropImageBlob,
  imageCacheKey,
  isServerScalable,
  readImageBlob,
  withQuery,
  writeImageBlob,
} from "../utils/imageSource";
import ReDialog from "@repo/ui/re-dialog";
import { ReRadioGroup, ReRadio } from "@repo/ui/re-kit";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（支持子目录） */
  objectKey: string;
  /** 文件名（决定导出格式） */
  fileName: string;
  /**
   * 图片路径参数（系统配置「图片滤镜」下发，如 {@code grayscale=1}）
   *
   * <p>由父组件按后台 SPI 能力计算后传入：非空时预览图也带该参数，
   * 让「选中的滤镜」在预览里同样先经过滤镜，而不是只有缩略图生效。
   * 空串表示原图，不拼任何参数。</p>
   */
  imagePath?: string;
  /**
   * 低清占位图直链（父组件大图标视图里已经拉过的 172px 缩略图）
   *
   * <p>原图动辄 2MB，而 dev 下这些字节要从远端文件服务器经 Vite 代理拉回
   * （实测 ~40KB/s），一张 1024×1024 的 PNG 要几十秒。空等原图时先拿这张
   * 小图放大模糊铺底，观感上「点开就有东西」，而不是一块白板加「加载中…」。</p>
   *
   * <p>不传（比如从分栏/详细视图直接双击打开）时面板自己按需要一张小图。</p>
   */
  thumbUrl?: string;
  /**
   * 版本标记（父组件传对象的 {@code lastModified}）
   *
   * <p>原图字节缓存按「桶 + Key + 版本」分代：文件被覆盖后 mtime 变，
   * 旧缓存自然不命中，用户不会看到上一版图片。不传则视为同一代。</p>
   */
  version?: number | string;
}>();

const emit = defineEmits<{
  /** 保存成功后通知父组件刷新列表 */
  saved: [];
}>();

/* ==================== 状态 ==================== */

/** 图片加载中 */
const loading = ref(true);
/** 加载失败提示 */
const errorMsg = ref("");
/** 低清占位图直链（原图没到之前铺底，避免一块白板） */
const placeholderSrc = ref("");
/** 已接收的原图字节数（流式下载时实时更新） */
const receivedBytes = ref(0);
/** 原图总字节数（服务端给了 Content-Length 才有值） */
const totalBytes = ref(0);
/**
 * 舞台上的图现在是哪一档
 *
 * <ul>
 *   <li>{@code none}：还没有任何一档可用（白板 + 加载中）</li>
 *   <li>{@code draft}：第一档 720px（远端带宽下 ~1s 出图，先让用户看见内容）</li>
 *   <li>{@code mid}：第二档 1600px（贴近预览区像素，缩放/旋转看得清）</li>
 *   <li>{@code original}：原图真实字节（{@code blob:} 直链，编辑导出用这一份）</li>
 * </ul>
 */
const stageLevel = ref<"none" | "draft" | "mid" | "original">("none");
/** 原图字节是否已到手（裁剪/旋转导出必须等它） */
const originalReady = ref(false);
/** 原图字节是否下载失败（失败时保留已显示的缩放版，并明确告知不能导出） */
const originalFailed = ref(false);
/** 探测到的原图元信息（宽高/字节数/是否带 alpha） */
const meta = ref<ImageMeta | null>(null);
/** 缩放比例（1 = 100%） */
const scale = ref(1);
/** 旋转角度（0/90/180/270） */
const rotation = ref<0 | 90 | 180 | 270>(0);
/** 裁剪模式是否开启 */
const cropMode = ref(false);
/** 裁剪选框（相对原图像素坐标，未缩放/未旋转） */
const cropRect = ref({ x: 0, y: 0, w: 0, h: 0 });
/** 保存中（PUT 进行中，驱动按钮 loading 文案） */
const saving = ref(false);
/** 导出渲染中（renderEdited 进行中，用于防重入，与 saving 分开以免误示 loading） */
const rendering = ref(false);
/** 导出结果暂存：保存选项弹框确认后才真正写入 */
let pendingBlob: Blob | null = null;
/** 保存选项弹框是否可见 */
const saveDlgVisible = ref(false);
/** 保存方式：覆盖原文件 / 另存为新文件 */
const saveMode = ref<"overwrite" | "new">("overwrite");
/** 另存为的新文件名 */
const saveNewName = ref("");
/** 目标文件已存在时的提示 */
const saveNameTip = ref("");
/** 拖拽平移中 */
const panning = ref(false);
/** 鼠标是否在面板内（决定底部工具栏是否显示） */
const hudHover = ref(false);
/** 视口可视尺寸（用于判断是否可平移） */
const viewportSize = ref({ w: 0, h: 0 });
/** 监听视口尺寸变化，驱动 pannable */
let viewportRo: ResizeObserver | null = null;
/** 滚动容器 */
const viewportRef = ref<HTMLDivElement>();
/** 画布（承载旋转/缩放后的显示） */
const stageRef = ref<HTMLDivElement>();
/** 原始图片 DOM */
const imgRef = ref<HTMLImageElement>();
/** 编辑基线：原始图的 naturalWidth/Height，裁剪与导出都以此为基准 */
const natural = ref({ w: 0, h: 0 });
/** 保存覆盖前的原始字节，用于「还原」 */
let originalBlob: Blob | null = null;

/**
 * 是否有会影响导出结果的编辑（旋转 / 裁剪）
 *
 * <p>刻意**不含 scale**：缩放只是浏览行为，{@code renderEdited} 根本不用它，
 * 输出永远是原图分辨率。若把 scale 算进来，随手滚一下滚轮「保存」就变可点，
 * 用户能把一个视觉上毫无变化的文件重编码写回——白白改掉 mtime 与字节。</p>
 */
const canSave = computed(
  () => rotation.value !== 0 || (cropRect.value.w > 0 && cropRect.value.h > 0),
);

/** 视图是否偏离初始（含缩放）：只用来决定状态条是否显形、重置是否可用 */
const viewChanged = computed(
  () => scale.value !== 1 || canSave.value,
);

/* ==================== 尺寸换算 ==================== */

/**
 * 旋转后的显示尺寸
 *
 * <p>90/270 度时宽高互换；这里算的是**布局占位**，保证旋转后不出现横向滚动条异常。</p>
 */
const displaySize = computed(() => {
  const { w, h } = natural.value;
  if (!w || !h) {
    return { w: 0, h: 0 };
  }
  const swap = rotation.value === 90 || rotation.value === 270;
  return swap ? { w: h, h: w } : { w, h };
});

/** 画布实际渲染尺寸（显示尺寸 × 缩放） */
const stageStyle = computed(() => {
  const d = displaySize.value;
  return {
    width: `${Math.round(d.w * scale.value)}px`,
    height: `${Math.round(d.h * scale.value)}px`,
  };
});

/**
 * 图片本身的样式
 *
 * <p>缩放靠「img 显式像素尺寸 = 自然尺寸 × scale」实现，<b>不能用 width:100%</b>：
 * 舞台在 90/270 时宽高已互换，100% 会让 img 的盒子也变成互换后的比例，
 * 于是 600×400 的位图被塞进 400×600 的盒子 —— <b>旋转前就被压扁</b>。
 * 实测顺时针 90° 后 img 盒子纵横比 1.50 → 0.67（偏差 55.5%），
 * 叠加 CSS 旋转后整体变形，表现为「旋转不像旋转、像被压扁」。</p>
 *
 * <p>正确做法：img 保持<b>未旋转</b>的尺寸并按 scale 缩放，在已互换的舞台里
 * 居中；旋转后它的外接矩形恰好等于舞台，比例不失真。</p>
 */
const imgStyle = computed(() => {
  const s = scale.value;
  const nw = natural.value.w;
  const nh = natural.value.h;
  const style: Record<string, string> = { transform: `rotate(${rotation.value}deg)` };
  // 未加载完时不给尺寸，避免出现 0×0 的闪断
  if (nw > 0 && nh > 0) {
    style.width = `${Math.max(1, Math.round(nw * s))}px`;
    style.height = `${Math.max(1, Math.round(nh * s))}px`;
  }
  return style;
});

/* ==================== 加载 ==================== */

/**
 * 当前这一档迟迟画不出来时，最多等多久就把下一档换上
 *
 * <p>换档的正确时机是「当前这一档已经画出来了」（见 {@link advanceTier}）：
 * 早换会把还没显示出来的那张白白拉完又丢掉 —— 实测 draft 720px 要 1.4s，
 * 而固定 600ms 就切 mid，draft 的字节全白传、用户也从来没看见过它。</p>
 *
 * <p>但也不能无限等：draft 卡住时得有兜底，让更清晰的一档顶上来。</p>
 */
const TIER_ADVANCE_TIMEOUT_MS = 8000;

/**
 * 原图流延后多久再开跑
 *
 * <p>原图是编辑导出要用的真实像素，必须拉；但它 2MB 起步，一旦和 draft 抢带宽，
 * 「先看到内容」这件事就会被推迟到几十秒之后。所以先让缩小版跑起来再开流。</p>
 */
const ORIGINAL_DELAY_MS = 1200;

/**
 * 已接收字节的可读文本
 *
 * @returns 形如 {@code 780 KB / 2.0 MB}；没有总长时只给已接收量
 */
const receivedText = computed(() => {
  const got = formatBytes(receivedBytes.value);
  if (!totalBytes.value) {
    return got;
  }
  return `${got} / ${formatBytes(totalBytes.value)}`;
});

/** 下载进度百分比；服务端没给 Content-Length 时为 null（此时只显示字节数） */
const progressPercent = computed(() => {
  if (!totalBytes.value || receivedBytes.value <= 0) {
    return null;
  }
  return Math.min(99, Math.round((receivedBytes.value / totalBytes.value) * 100));
});

/**
 * 字节数转可读文本
 *
 * @param bytes 字节数
 * @returns 形如 {@code 12 KB} / {@code 2.0 MB}
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 缓存击穿序号：保存后自增，强制重新拉图 */
const reloadSeq = ref(0);

/**
 * 把图片路径参数拆成查询键值对（{@code grayscale=1} → {@code {grayscale:"1"}}）
 *
 * <p>解析失败的项直接丢弃，避免把半截参数拼进地址变成服务端侧的未知参数。</p>
 */
const imagePathParams = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {};
  for (const pair of (props.imagePath ?? "").split("&")) {
    const p = pair.trim();
    if (!p) continue;
    const eq = p.indexOf("=");
    if (eq <= 0) continue;
    out[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
  }
  return out;
});

/**
 * 舞台图地址
 *
 * <p>可能是「服务端缩放版」的票据直链，也可能是原图字节的 {@code blob:} 直链 ——
 * 两者都只是显示，导出永远以 {@code originalBlob} 为准。</p>
 *
 * <p>票据是异步换来的，解析完成前保持空串 —— 让 {@code <img>} 暂不发起请求，
 * 而不是先用「无令牌的直链」闪一下再被 401 打断。</p>
 */
const src = ref("");

/** 本轮加载的序号 */
let loadSeq = 0;

/** 我们自己创建的 {@code blob:} 直链，离开时要释放 */
let ownedObjectUrl = "";

/** 本轮原图字节的拉取任务：保存时要等它，不能另起一次重复下载 */
let originalTask: Promise<Blob | null> | null = null;

/** 本轮的原图票据直链（{@link loadOriginal} 兜底取字节时用，不能拿缩放版的 src） */
const ticketUrlRef = ref("");

/** 是否已经自动「适应窗口」过一次 */
let autoFitDone = false;

/**
 * 排队中的下一档（更清晰的那一档）
 *
 * <p>不立刻换：先把当前这一档画出来，再换成它。否则「还没显示就先换掉」等于
 * 把上一档的字节白传一遍。</p>
 */
let pendingTier: { url: string; level: "mid" } | null = null;

/** 下一档的兜底定时器（当前这一档迟迟不落地时用） */
let tierTimer: number | null = null;

/**
 * 把排队中的下一档换上（当前这一档已经画出来，或等超时了）
 */
function advanceTier(): void {
  if (tierTimer !== null) {
    window.clearTimeout(tierTimer);
    tierTimer = null;
  }
  const next = pendingTier;
  pendingTier = null;
  if (!next || originalReady.value) {
    return;
  }
  setSrc(next.url, next.level);
}

/**
 * 取消排队中的下一档（原图到手 / 切图 / 卸载时调用）
 */
function cancelPendingTier(): void {
  if (tierTimer !== null) {
    window.clearTimeout(tierTimer);
    tierTimer = null;
  }
  pendingTier = null;
}

/**
 * 原图字节缓存键
 *
 * <p>带 {@code version}（对象 mtime）：文件被覆盖后自然不命中，不会看到上一版。</p>
 */
const cacheKey = computed(() => imageCacheKey(props.bucket, props.objectKey, props.version));

/**
 * 原图还在路上的提示文案
 *
 * <p>中清图已经能看能操作了，所以这条提示是<b>非阻塞</b>的小胶囊，而不是全屏遮罩 ——
 * 遮罩只在「一档都没有」时出现（{@code loading}）。</p>
 */
const hiresHint = computed(() => {
  if (originalReady.value || stageLevel.value === "none") {
    return "";
  }
  if (originalFailed.value) {
    return "原图下载失败，当前只显示预览图";
  }
  if (!receivedBytes.value) {
    return "原图加载中…";
  }
  return progressPercent.value === null
    ? `原图 ${receivedText.value}`
    : `原图 ${progressPercent.value}% · ${formatBytes(receivedBytes.value)}`;
});

/**
 * 换掉 {@code <img>} 的地址，顺手释放上一张由我们创建的 blob 直链
 *
 * @param url   新地址（blob: 或票据直链）
 * @param level 这一档的清晰度
 */
function setSrc(url: string, level: "draft" | "mid" | "original"): void {
  if (ownedObjectUrl && ownedObjectUrl !== url) {
    URL.revokeObjectURL(ownedObjectUrl);
    ownedObjectUrl = "";
  }
  if (url.startsWith("blob:")) {
    ownedObjectUrl = url;
  }
  stageLevel.value = level;
  src.value = url;
}

/**
 * 拼「服务端缩放版」直链
 *
 * <p>必须带 {@code preview=true}：后端 {@code applyFileOperations} 只在预览通道上执行
 * {@code size}/{@code format}/{@code quality}，不带这个参数会被当成「原样返回」，
 * 等于白等一次。</p>
 *
 * @param ticketUrl 已签名的原图直链（已含滤镜等路径参数）
 * @param params    {@link buildScaleParams} 的结果
 * @returns 缩放版直链；没有 size 时返回空串
 */
function scaledPreviewUrl(ticketUrl: string, params: Record<string, string>): string {
  if (!params.size) {
    return "";
  }
  return withQuery(ticketUrl, { preview: "true", ...params });
}

/**
 * 流式拉原图字节（带进度）
 *
 * <p>两个目的：</p>
 * <ol>
 *   <li><b>只下载一次</b>：{@code <img>} 按 {@code blob:} 直链显示，导出用的就是这份字节，
 *       不会出现「显示一遍、导出又 fetch 一遍」。</li>
 *   <li><b>有进度</b>：边读边更新已接收字节数，界面给出百分比。</li>
 * </ol>
 *
 * @param url 已签名的原图直链
 * @param seq 本轮序号（切文件后旧轮次自动作废）
 * @returns 原图字节；失败或已切图返回 null
 */
async function fetchOriginal(url: string, seq: number): Promise<Blob | null> {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}`);
    }
    totalBytes.value = Number(res.headers.get("content-length") ?? 0) || 0;
    receivedBytes.value = 0;
    const reader = res.body.getReader();
    const chunks: BlobPart[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (seq !== loadSeq) {
        void reader.cancel();
        return null;
      }
      chunks.push(value as unknown as BlobPart);
      received += value.length;
      receivedBytes.value = received;
    }
    if (seq !== loadSeq) {
      return null;
    }
    return new Blob(chunks, { type: res.headers.get("content-type") ?? "" });
  } catch {
    return null;
  }
}

/**
 * 拉原图字节，到手后无缝替换舞台图并写入缓存
 *
 * <p>同一轮内单飞：重复调用（保存前等字节、用户手动触发）不会再发一次请求。</p>
 *
 * @param url 已签名的原图直链
 * @param seq 本轮序号
 */
async function pullOriginal(url: string, seq: number): Promise<void> {
  if (originalTask) {
    await originalTask;
    return;
  }
  originalTask = (async (): Promise<Blob | null> => {
    const blob = await fetchOriginal(url, seq);
    if (seq !== loadSeq) {
      return null;
    }
    if (!blob) {
      originalFailed.value = true;
      // 流式读取失败：一档小图都没有时交回浏览器按直链加载，不阻断预览
      if (stageLevel.value === "none") {
        setSrc(url, "original");
      }
      return null;
    }
    originalBlob = blob;
    originalReady.value = true;
    originalFailed.value = false;
    writeImageBlob(cacheKey.value, blob);
    // 原图比任何一档缩小版都清楚，排队中的那一档没必要再拉了
    cancelPendingTier();
    setSrc(URL.createObjectURL(blob), "original");
    return blob;
  })();
  await originalTask;
}

/**
 * 准备低清占位图
 *
 * <p>父组件传了缩略图直链就直接用（那张图早已在内存里，不再发请求）；
 * 没传则按探测到的尺寸自己签一张 172px 小图 —— 它只用来模糊铺底，和网格缩略图同档，
 * 通常连服务端的解码缓存都命中。必须先有原图宽高，否则服务端 {@code size=WxH}
 * 的硬拉伸会把非正方形的图压变形。</p>
 *
 * @param ticketUrl 已签名的原图直链
 */
function loadGhost(ticketUrl: string): void {
  if (props.thumbUrl) {
    placeholderSrc.value = props.thumbUrl;
    return;
  }
  const params = buildScaleParams(props.fileName, meta.value, PREVIEW_GHOST_EDGE, PREVIEW_JPEG_QUALITY);
  const url = scaledPreviewUrl(ticketUrl, params);
  if (url) {
    placeholderSrc.value = url;
  }
}

/**
 * 按需签发票据并刷新舞台图
 *
 * <p>加载阶梯（每一档都是「能看就先用」，不等下一档）：</p>
 * <ol>
 *   <li><b>字节缓存</b>：同一张图刚看过就直接出原图，一个请求都不发；</li>
 *   <li><b>元信息</b>：大图标视图已经探过则同步命中，否则发一次 4KB {@code Range}；</li>
 *   <li><b>draft 720px</b>：服务端现场缩放，远端带宽下约 1s 出图；</li>
 *   <li><b>mid 1600px</b>：贴近预览区像素，缩放/旋转都看得清；</li>
 *   <li><b>原图</b>：后台流式下载，到手后无缝替换，同时进字节缓存供下次秒开。</li>
 * </ol>
 *
 * <p>此前是「签票 → 直接拉原图」，2MB 的 PNG 在 ~40KB/s 下要几十秒，期间只有一块白板。
 * 服务端本来就能现场缩放（{@code ?preview=true&size=WxH&format=jpeg}），
 * 172px 缩略图 PNG 74~83KB、同尺寸 JPEG 只要 6~10KB —— 字节数就是这里唯一的硬指标。</p>
 */
async function refreshSrc(): Promise<void> {
  loadSeq += 1;
  const seq = loadSeq;
  originalTask = null;
  originalFailed.value = false;
  autoFitDone = false;
  cancelPendingTier();

  const cached = readImageBlob(cacheKey.value);
  if (cached) {
    // 刚看过这张图：直接用缓存字节，连票据都不用签
    originalBlob = cached;
    originalReady.value = true;
    const hit = peekImageMeta(props.objectKey);
    if (hit) {
      meta.value = hit;
      natural.value = { w: hit.width, h: hit.height };
    }
    setSrc(URL.createObjectURL(cached), "original");
    loading.value = false;
    void nextTick(maybeAutoFit);
    return;
  }

  const ticketUrl = await resolveObjectUrl(props.bucket, props.objectKey, {
    params: { _r: String(reloadSeq.value), ...imagePathParams.value },
  });
  if (seq !== loadSeq || !ticketUrl) {
    return;
  }
  ticketUrlRef.value = ticketUrl;

  const info = peekImageMeta(props.objectKey)
    ?? await probeImageMeta(ticketUrl, props.objectKey).catch(() => null);
  if (seq !== loadSeq) {
    return;
  }
  if (info) {
    meta.value = info;
    // 逻辑尺寸永远取原图像素：裁剪框、缩放百分比都以它为基准，
    // 不能拿「服务端缩小版」的 naturalWidth 顶上，否则裁剪坐标会整体偏小
    natural.value = { w: info.width, h: info.height };
    void nextTick(maybeAutoFit);
  }

  // 占位图先于一切分支铺上：父组件已经把 172px 缩略图字节留在内存里（blob: 直链），
  // 那是零请求的；早先只在「要拉 draft」时才铺，导致 ≤160KB 的图走「直接拉原图」
  // 分支时白等十几秒才见到第一帧。
  loadGhost(ticketUrl);

  if (!info || !isServerScalable(props.fileName)) {
    // 算不出等比目标（格式不在白名单 / 头解析失败）：只剩「等原图」一条路
    void pullOriginal(ticketUrl, seq);
    return;
  }

  const draftParams = buildScaleParams(props.fileName, info, PREVIEW_DRAFT_EDGE, PREVIEW_JPEG_QUALITY);
  if (!draftParams.size) {
    // 原图本身就不大（≤160KB，或本来就小于 draft 长边）：直接拉原图最省
    void pullOriginal(ticketUrl, seq);
    return;
  }

  setSrc(scaledPreviewUrl(ticketUrl, draftParams), "draft");

  const midParams = canServeJpeg(props.fileName, info)
    ? buildScaleParams(props.fileName, info, PREVIEW_MID_EDGE, PREVIEW_JPEG_QUALITY)
    : {};
  const midUrl = scaledPreviewUrl(ticketUrl, midParams);
  if (midUrl) {
    // 排队而不是定时换：等 draft 真的画出来再换，否则 draft 的字节白传
    pendingTier = { url: midUrl, level: "mid" };
    tierTimer = window.setTimeout(advanceTier, TIER_ADVANCE_TIMEOUT_MS);
  }

  window.setTimeout(() => {
    if (seq === loadSeq) {
      void pullOriginal(ticketUrl, seq);
    }
  }, ORIGINAL_DELAY_MS);
}

/**
 * 拉原图字节（供裁剪导出与「还原」用）
 *
 * <p>只在「流式下载没成功、浏览器按直链自己加载」这条兜底路径上需要 ——
 * 正常路径里 {@link pullOriginal} 已经把字节留在 {@code originalBlob} 了，
 * 再 fetch 一遍等于把那 2MB 又拉一次。地址必须用原图票据，
 * 不能拿 {@code src}（此刻可能是服务端缩放版）。</p>
 */
async function loadOriginal(): Promise<void> {
  const url = ticketUrlRef.value || src.value;
  if (!url) {
    return;
  }
  try {
    // 程序化 fetch 能带请求头，令牌只走头
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    originalBlob = await res.blob();
    originalReady.value = true;
    writeImageBlob(cacheKey.value, originalBlob);
  } catch (e) {
    originalBlob = null;
  }
}

/**
 * 首次拿到图片尺寸后自动「适应窗口」
 *
 * <p>此前打开 4000px 的照片是按 100% 铺的：舞台 4000px 宽、视口只有 1100px，
 * 用户第一眼看到的是一小块放大的像素角。服务端缩小版的存在前提就是
 * 「整张图先看得全」，所以大图必须先 fit 一次。</p>
 */
function maybeAutoFit(): void {
  if (autoFitDone) {
    return;
  }
  const vp = viewportRef.value;
  if (!vp || !vp.clientWidth || !natural.value.w) {
    return;
  }
  autoFitDone = true;
  if (
    natural.value.w > vp.clientWidth - VP_PADDING ||
    natural.value.h > vp.clientHeight - VP_PADDING
  ) {
    zoomFit();
  }
}

/**
 * 舞台图加载完成
 *
 * @param e 图片的 load 事件
 */
function onImgLoad(e: Event): void {
  const img = e.target as HTMLImageElement;
  // 只有原图（或完全没有元信息时的兜底）才以图片自身像素为准
  if (stageLevel.value === "original" || !natural.value.w) {
    natural.value = { w: img.naturalWidth, h: img.naturalHeight };
  }
  loading.value = false;
  errorMsg.value = "";
  maybeAutoFit();
  if (stageLevel.value === "original" && !originalBlob) {
    void loadOriginal();
  }
  // 这一档已经画出来了：轮到下一档（如果有排队）
  advanceTier();
}

/**
 * 舞台图加载失败
 *
 * <p>缩放版失败（后端不支持该参数组合、票据过期）不算失败：原图那一轮还在路上，
 * 等它兜底即可；排队中的下一档也一并顶上。只有原图也失败才提示。</p>
 */
function onImgError(): void {
  if (stageLevel.value !== "original") {
    advanceTier();
    return;
  }
  loading.value = false;
  errorMsg.value = "图片加载失败";
}

/* ==================== 缩放（滚轮，锚定光标） ==================== */

/** 缩放下限 / 上限 */
const MIN_SCALE = 0.1;
const MAX_SCALE = 16;

/**
 * 滚轮缩放，锚点为鼠标所在位置
 *
 * <p>普通「以中心缩放」在图片大到超出视口时，光标下的内容会明显漂移，用户
 * 得反复调整。这里把缩放前后光标位置的视口坐标换算回图片坐标并补偿回去，
 * 使该点下的像素在缩放后仍停在光标处。</p>
 *
 * @param e 滚轮事件
 */
function onWheel(e: WheelEvent): void {
  // Ctrl+滚轮（触控板捏合）也缩放；Shift+滚轮交给浏览器横向滚动
  if (e.shiftKey) {
    return;
  }
  e.preventDefault();
  const vp = viewportRef.value;
  const stage = stageRef.value;
  if (!vp || !stage) {
    return;
  }
  const before = scale.value;
  // deltaY<0 上推放大。步长取指数式，手感更线性
  const factor = Math.exp(-e.deltaY * 0.0015);
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, before * factor));
  if (next === before) {
    return;
  }
  const ratio = next / before;
  // 光标相对舞台左上角的坐标（舞台已应用当前 scale，rect 宽高即 已缩放尺寸）
  const rect = stage.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  scale.value = next;
  // 舞台以「居中 + flex-start」布局，缩放后其左上角会因重新居中而移动。
  // 直接靠 scrollLeft 补偿并不可靠（居中时舞台可能压根没有溢出），改为：
  // 记录缩放前光标在「图片内容坐标」中的位置，等布局稳定后把它重新对齐回光标。
  void nextFrame(() => {
    const nr = stage.getBoundingClientRect();
    // 光标此刻相对新左上角的偏移 = 目标像素点的新位置
    const npx = px * ratio;
    const npy = py * ratio;
    // 需要把视口滚动量调整 (npx - px)，仅当舞台确实溢出视口时才生效
    const overflowX = stage.scrollWidth > vp.clientWidth || nr.width > vp.clientWidth;
    const overflowY = stage.scrollHeight > vp.clientHeight || nr.height > vp.clientHeight;
    if (overflowX) {
      vp.scrollLeft += npx - px;
    }
    if (overflowY) {
      vp.scrollTop += npy - py;
    }
  });
}

/** 等下一帧（此时 Vue 的样式更新与浏览器布局都已落地） */
function nextFrame(fn: () => void): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      fn();
      resolve();
    });
  });
}

/** 重置缩放到 100% */
function zoomReset(): void {
  scale.value = 1;
  const vp = viewportRef.value;
  if (vp) {
    vp.scrollLeft = 0;
    vp.scrollTop = 0;
  }
}

/** 适应窗口：把图片按容器尺寸等比缩放到刚好放得下 */
function zoomFit(): void {
  const vp = viewportRef.value;
  if (!vp || !natural.value.w) {
    return;
  }
  const pad = 32;
  const k = Math.min(
    (vp.clientWidth - pad) / displaySize.value.w,
    (vp.clientHeight - pad) / displaySize.value.h,
  );
  scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(k.toFixed(4))));
  vp.scrollLeft = 0;
  vp.scrollTop = 0;
}

/** 实际 100%（1:1 像素） */
function zoomActual(): void {
  scale.value = 1;
}

/* ==================== 旋转 ==================== */

/** 顺时针旋转 90 度 */
function rotateCw(): void {
  rotation.value = ((rotation.value + 90) % 360) as 0 | 90 | 180 | 270;
  // 旋转后画布宽高互换，滚动位置不再对应，回到左上角更符合直觉
  const vp = viewportRef.value;
  if (vp) {
    vp.scrollLeft = 0;
    vp.scrollTop = 0;
  }
}

/** 逆时针旋转 90 度 */
function rotateCcw(): void {
  rotation.value = ((rotation.value + 270) % 360) as 0 | 90 | 180 | 270;
  const vp = viewportRef.value;
  if (vp) {
    vp.scrollLeft = 0;
    vp.scrollTop = 0;
  }
}

/* ==================== 裁剪 ==================== */

/** 拖拽起点（原图像素坐标） */
let dragStart: { x: number; y: number } | null = null;
/**
 * 视口坐标 → 原图像素坐标
 *
 * <p>换算规则抽到 {@link displayToImage} 纯函数里，旋转 90/270 的转置与
 * 边界夹取都能单测，不必再靠 E2E 间接覆盖。</p>
 */
function toImageCoords(clientX: number, clientY: number): { x: number; y: number } {
  const stage = stageRef.value;
  if (!stage) {
    return { x: 0, y: 0 };
  }
  const rect = stage.getBoundingClientRect();
  return displayToImage(
    clientX - rect.left,
    clientY - rect.top,
    scale.value,
    displaySize.value,
    natural.value,
    rotation.value,
  );
}

function onCropDown(e: MouseEvent): void {
  if (!cropMode.value) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  const p = toImageCoords(e.clientX, e.clientY);
  dragStart = p;
  cropRect.value = { x: p.x, y: p.y, w: 0, h: 0 };
}

function onCropMove(e: MouseEvent): void {
  if (!cropMode.value || !dragStart) {
    return;
  }
  e.preventDefault();
  const p = toImageCoords(e.clientX, e.clientY);
  const x = Math.min(dragStart.x, p.x);
  const y = Math.min(dragStart.y, p.y);
  const w = Math.abs(p.x - dragStart.x);
  const h = Math.abs(p.y - dragStart.y);
  cropRect.value = { x, y, w, h };
}

function onCropUp(): void {
  dragStart = null;
}

/* ==================== 拖拽平移 ==================== */

/** 平移起点：鼠标位置 + 当时的滚动量 */
let panStart: { x: number; y: number; left: number; top: number } | null = null;

/**
 * 按下：非裁剪模式下按住拖动即平移画布
 *
 * <p>图片小于视口时不启动平移（没有可滚动的余量），否则会出现「拖了但画面
 * 不动」的错觉。只响应左键，避免与右键菜单冲突。</p>
 *
 * @param e 鼠标事件
 */
function onPanDown(e: MouseEvent): void {
  if (cropMode.value) {
    onCropDown(e);
    return;
  }
  if (e.button !== 0) {
    return;
  }
  const vp = viewportRef.value;
  if (!vp || !pannable.value) {
    return;
  }
  e.preventDefault();
  panStart = { x: e.clientX, y: e.clientY, left: vp.scrollLeft, top: vp.scrollTop };
  panning.value = true;
}

/**
 * 移动：按鼠标位移反向调整滚动量
 *
 * @param e 鼠标事件
 */
function onPanMove(e: MouseEvent): void {
  if (cropMode.value) {
    onCropMove(e);
    return;
  }
  if (!panStart) {
    return;
  }
  const vp = viewportRef.value;
  if (!vp) {
    return;
  }
  e.preventDefault();
  vp.scrollLeft = panStart.left - (e.clientX - panStart.x);
  vp.scrollTop = panStart.top - (e.clientY - panStart.y);
}

/**
 * 抬起：结束平移/裁剪
 */
function onPanUp(): void {
  if (cropMode.value) {
    onCropUp();
    return;
  }
  panStart = null;
  panning.value = false;
}

/** 选框的显示矩形（相对舞台，已含缩放） */
const cropBoxStyle = computed(() => {
  const c = cropRect.value;
  const d = displaySize.value;
  const swap = rotation.value === 90 || rotation.value === 270;
  // 选框存在原图坐标；显示时按当前旋转映射到舞台坐标
  if (c.w <= 0 || c.h <= 0) {
    return { display: "none" };
  }
  let x = c.x;
  let y = c.y;
  let w = c.w;
  let h = c.h;
  if (swap) {
    x = d.h - (c.y + c.h);
    y = c.x;
    const tw = c.h;
    const th = c.w;
    w = tw;
    h = th;
  } else if (rotation.value === 180) {
    x = d.w - (c.x + c.w);
    y = d.h - (c.y + c.h);
  }
  return {
    left: `${x * scale.value}px`,
    top: `${y * scale.value}px`,
    width: `${w * scale.value}px`,
    height: `${h * scale.value}px`,
  };
});

/** 全选裁剪区 */
function cropAll(): void {
  cropRect.value = { x: 0, y: 0, w: natural.value.w, h: natural.value.h };
  cropMode.value = true;
}

/** 清除裁剪 */
function cropClear(): void {
  cropRect.value = { x: 0, y: 0, w: 0, h: 0 };
}

/* ==================== 导出 ==================== */

/**
 * 把当前编辑结果渲染到离屏 canvas 并导出 Blob
 *
 * <p>顺序：先按裁剪选框从原图取像素 → 再旋转 → 缩放（取倍率上限 1，避免无谓失真）。
 * 全部走 {@code canvas} 的真实像素操作，不是 CSS 变换。</p>
 *
 * @param quality JPEG/WEBP 质量，其余格式忽略
 * @returns 编码后的 Blob；失败返回 null
 */
async function renderEdited(quality = 0.92): Promise<Blob | null> {
  if (!originalBlob || !natural.value.w) {
    return null;
  }
  const src2 = URL.createObjectURL(originalBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("原图解码失败"));
      im.src = src2;
    });
    // 1) 裁剪
    const c = cropRect.value;
    const hasCrop = c.w > 1 && c.h > 1;
    const sx = hasCrop ? c.x : 0;
    const sy = hasCrop ? c.y : 0;
    const sw = hasCrop ? c.w : natural.value.w;
    const sh = hasCrop ? c.h : natural.value.h;

    // 2) 旋转后的目标尺寸
    const swap = rotation.value === 90 || rotation.value === 270;
    const outW = Math.max(1, Math.round(swap ? sh : sw));
    const outH = Math.max(1, Math.round(swap ? sw : sh));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    // JPEG 不支持透明，先铺白底，避免透明区变黑
    if (extensionOf(props.fileName) === "jpg" || extensionOf(props.fileName) === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.save();
    switch (rotation.value) {
      case 90:
        ctx.translate(outW, 0);
        ctx.rotate(Math.PI / 2);
        break;
      case 180:
        ctx.translate(outW, outH);
        ctx.rotate(Math.PI);
        break;
      case 270:
        ctx.translate(0, outH);
        ctx.rotate(-Math.PI / 2);
        break;
      default:
        break;
    }
    // 高质量重采样：裁剪本身已是 1:1，这里用 imageSmoothingQuality 提升边缘质量
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    // 目标尺寸**必须与源尺寸一致**：ctx.rotate 已经把矩形整体转置了，
    // 这里再按 swap 交换一次就是双重转置，会把画布画不满。
    // 实测（600×400 转 90°，画布 400×600）：交换后画布足迹只剩 x∈[-200,400]、
    // y∈[0,400]，左侧 200px 被裁、底部 200px 从未绘制 -> 输出底部约 1/3 透明。
    // 当时「旋转后宽高互换」用例只查 naturalWidth/Height，宽高恰好是对的，
    // 所以完全没暴露内容损坏，是靠像素级断言才抓到的。
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.restore();

    const mime = mimeOf(props.fileName);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        mime,
        mime === "image/jpeg" || mime === "image/webp" ? quality : undefined,
      );
    });
  } catch (e) {
    message.error(`图片处理失败：${(e as Error)?.message ?? "未知错误"}`);
    return null;
  } finally {
    URL.revokeObjectURL(src2);
  }
}

/** 按扩展名选导出 MIME */
function mimeOf(name: string): string {
  switch (extensionOf(name)) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "image/png";
  }
}

/* ==================== 保存 ==================== */

/** 保存并覆盖原对象 */
/** 视口内边距（与 CSS 的 .pimg__vp padding 一致），用于判断是否真的溢出 */
const VP_PADDING = 32;

/**
 * 当前图片是否超出视口（决定是否允许拖拽平移、是否显示抓手光标）
 *
 * <p>不超出时不给抓手，避免用户拖了没反应还以为坏了。</p>
 */
const pannable = computed(() => {
  const d = displaySize.value;
  const s = scale.value;
  return (
    d.w * s > Math.max(0, viewportSize.value.w - VP_PADDING) + 1 ||
    d.h * s > Math.max(0, viewportSize.value.h - VP_PADDING) + 1
  );
});

/**
 * 取对象 Key 的目录前缀
 *
 * @param key 对象 Key
 * @returns 含结尾斜杠的目录前缀；根目录返回空串
 */
function dirOf(key: string): string {
  const idx = key.lastIndexOf("/");
  return idx >= 0 ? key.slice(0, idx + 1) : "";
}

/**
 * 拼同目录下的兄弟 Key
 *
 * @param name 文件名
 * @returns 与原对象同目录的新 Key
 */
function siblingKey(name: string): string {
  return dirOf(props.objectKey) + name;
}

/**
 * 生成「另存为」的默认文件名
 *
 * @returns 形如 `原名-edited.png`；原名无扩展名时直接追加
 */
function suggestNewName(): string {
  const key = props.fileName;
  const dot = key.lastIndexOf(".");
  if (dot <= 0) {
    return `${key}-edited`;
  }
  return `${key.slice(0, dot)}-edited${key.slice(dot)}`;
}

/** 文件名里不允许出现的字符（路径分隔符与 Windows 保留字符） */
const INVALID_NAME_CHARS = /[/\\:*?"<>|\u0000-\u001f]/;

/**
 * 校验「另存为」的文件名
 *
 * <p>扩展名必须与原文件一致：导出字节的格式由原文件名决定
 * （{@code mimeOf(fileName)}），若允许改成别的扩展名，服务端之后按扩展名
 * 回 Content-Type，就会出现「PNG 字节配 image/jpeg 头」这种解码失败的组合。</p>
 *
 * @param name 用户输入
 * @returns 错误文案；合法返回空串
 */
function validateNewName(name: string): string {
  const v = name.trim();
  if (!v) {
    return "请输入文件名";
  }
  if (INVALID_NAME_CHARS.test(v)) {
    return '文件名不能包含 / \\ : * ? " < > | 等字符';
  }
  if (v === "." || v === "..") {
    return "文件名不合法";
  }
  const wantExt = extensionOf(props.fileName).toLowerCase();
  const gotExt = extensionOf(v).toLowerCase();
  if (wantExt && gotExt !== wantExt) {
    return `扩展名需保持 .${wantExt}（导出格式由原文件名决定）`;
  }
  if (v.length > 200) {
    return "文件名过长";
  }
  return "";
}

/**
 * 打开保存选项弹框
 *
 * <p>先把图渲染出来再弹框：渲染失败（解码异常等）时连选项都不必给，
 * 直接报错返回。渲染期间用 {@code rendering} 挡住重复进入。</p>
 *
 * <p>导出必须用<b>原图字节</b>：面板里显示的可能是服务端缩小的 draft/mid 那一档，
 * 拿它导出会把 4000px 的照片存成 1600px。所以原图还没到手时先等它（已在后台下载中，
 * 这里只是 await 同一个任务，不会再发一次请求）。</p>
 */
async function openSaveDialog(): Promise<void> {
  if (rendering.value || saving.value) {
    return;
  }
  rendering.value = true;
  try {
    if (!originalBlob && originalTask) {
      message.info("正在等待原图下载完成…");
      await originalTask;
    }
    if (!originalBlob && originalFailed.value) {
      // 后台那一次流失败了：导出前再直连取一次，成了就继续（不额外提示）
      await loadOriginal();
    }
    if (!originalBlob) {
      message.error("尚未拿到原图字节，无法导出");
      return;
    }
    const blob = await renderEdited();
    if (!blob) {
      message.error("导出失败，未保存");
      return;
    }
    pendingBlob = blob;
    saveMode.value = "overwrite";
    saveNewName.value = suggestNewName();
    saveNameTip.value = "";
    saveDlgVisible.value = true;
  } finally {
    rendering.value = false;
  }
}

/**
 * 校验「另存为」名字并顺手查重
 *
 * @returns 是否通过（不通过时已给出提示）
 */
async function checkNewName(): Promise<boolean> {
  const err = validateNewName(saveNewName.value);
  if (err) {
    saveNameTip.value = err;
    return false;
  }
  const key = siblingKey(saveNewName.value.trim());
  if (key === props.objectKey) {
    saveNameTip.value = "与原文件同名，请换一个名字（或选择「覆盖原文件」）";
    return false;
  }
  try {
    if (await existObject(props.bucket, key)) {
      saveNameTip.value = `「${saveNewName.value.trim()}」已存在，保存将覆盖它`;
    } else {
      saveNameTip.value = "";
    }
  } catch {
    // 查重失败不阻断保存，交给 PUT 自己报错
    saveNameTip.value = "";
  }
  return true;
}

/** 确认保存（覆盖或另存为） */
async function confirmSave(): Promise<void> {
  if (saving.value) {
    return;
  }
  const blob = pendingBlob;
  if (!blob) {
    saveDlgVisible.value = false;
    return;
  }
  const overwrite = saveMode.value === "overwrite";
  let targetKey = props.objectKey;
  if (!overwrite) {
    if (!(await checkNewName())) {
      return;
    }
    targetKey = siblingKey(saveNewName.value.trim());
    if (await existObject(props.bucket, targetKey).catch(() => false)) {
      try {
        await ElMessageBox.confirm(
          `「${saveNewName.value.trim()}」已存在，确认覆盖它？`,
          "确认覆盖",
          { confirmButtonText: "覆盖", cancelButtonText: "取消", type: "warning" },
        );
      } catch {
        return;
      }
    }
  }
  saving.value = true;
  try {
    await putObject(props.bucket, targetKey, blob);
    saveDlgVisible.value = false;
    pendingBlob = null;
    message.success(overwrite ? "已覆盖原文件" : `已另存为「${saveNewName.value.trim()}」`);
    emit("saved");
    if (overwrite) {
      // 覆盖时才需要把面板里的图换成服务端的新图
      reloadSeq.value += 1;
      // 旧字节缓存必须先清：否则 refreshSrc 直接命中缓存，用户看到的还是旧图
      dropImageBlob(props.bucket, props.objectKey);
      originalBlob = null;
      originalReady.value = false;
      // 必须重新签票重下：src 此刻可能还是旧图 Blob 的 blob: 直链
      await refreshSrc();
    }
  } catch (e) {
    message.error(`保存失败：${(e as Error)?.message ?? "未知错误"}`);
  } finally {
    saving.value = false;
  }
}

/** 取消保存选项弹框 */
function cancelSave(): void {
  saveDlgVisible.value = false;
  pendingBlob = null;
}

/** 还原到原图（放弃当前编辑） */
function resetAll(): void {
  scale.value = 1;
  rotation.value = 0;
  cropRect.value = { x: 0, y: 0, w: 0, h: 0 };
  cropMode.value = false;
}

/* ==================== 快捷键与右键菜单 ==================== */

const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);

/** 打开右键菜单 */
function onContextMenu(e: MouseEvent): void {
  e.preventDefault();
  menuX.value = e.clientX;
  menuY.value = e.clientY;
  menuVisible.value = true;
}

function closeMenu(): void {
  menuVisible.value = false;
}

function onDocClick(): void {
  closeMenu();
}

function onKeydown(e: KeyboardEvent): void {
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return;
  }
  if (e.key === "r" || e.key === "R") {
    rotateCw();
  } else if (e.key === "c" || e.key === "C") {
    cropMode.value = !cropMode.value;
    if (!cropMode.value) {
      cropClear();
    }
  } else if (e.key === "0") {
    zoomReset();
  } else if (e.key === "1") {
    zoomActual();
  } else if (e.key === "9") {
    zoomFit();
  } else if (e.key === "Escape") {
    // 只处理面板自身状态（菜单 / 裁剪态）；关闭弹层由父组件
    // onPreviewKeydown 统一负责。此前这里多发的 emit("saved")
    // 会被父组件 @saved 当成「图片已保存」弹出「图片已更新」提示。
    if (menuVisible.value) {
      closeMenu();
    } else if (cropMode.value) {
      cropMode.value = false;
      cropClear();
    }
  } else if (e.key === "s" || e.key === "S") {
    if (canSave.value) {
      e.preventDefault();
      void openSaveDialog();
    }
  } else if (e.key === "+" || e.key === "=") {
    scale.value = Math.min(MAX_SCALE, scale.value * 1.25);
  } else if (e.key === "-" || e.key === "_") {
    scale.value = Math.max(MIN_SCALE, scale.value / 1.25);
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onDocClick);
  // 松开鼠标可能发生在视口之外，必须挂到 window，否则会一直处于平移态
  window.addEventListener("mouseup", onPanUp);
  void refreshSrc();
  if (viewportRef.value) {
    viewportRo = new ResizeObserver(() => {
      const el = viewportRef.value;
      if (el) {
        viewportSize.value = { w: el.clientWidth, h: el.clientHeight };
        // 弹框有 0.2s 展开动画，挂载时视口宽高还是 0；等尺寸真正落地再补一次自动适应
        maybeAutoFit();
      }
    });
    viewportRo.observe(viewportRef.value);
    viewportSize.value = {
      w: viewportRef.value.clientWidth,
      h: viewportRef.value.clientHeight,
    };
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("mouseup", onPanUp);
  viewportRo?.disconnect();
  viewportRo = null;
  // 原来这里写的是 revokeObjectURL(createObjectURL(originalBlob))：
  // 凭空造一个新 URL 再立刻 revoke 它，真正持有的那个 Blob URL 从未释放。
  // 但 originalBlob 本身是 fetch 得到的 Blob，并没有为它创建过 objectURL
  // （只有 renderEdited 里的临时 src2 创建过、且已在 finally 释放），
  // 所以这里不需要、也不应该 revoke 任何东西。
  // 现在流式加载会把 Blob 变成 <img> 的 blob: 直链，那个确实是我们创建的，
  // 必须在这里释放，否则关掉预览后几十 MB 的图片数据还挂在内存里。
  loadSeq += 1;
  originalTask = null;
  cancelPendingTier();
  if (ownedObjectUrl) {
    URL.revokeObjectURL(ownedObjectUrl);
    ownedObjectUrl = "";
  }
  originalBlob = null;
});

watch(
  () => [props.bucket, props.objectKey, props.version],
  () => {
    loading.value = true;
    errorMsg.value = "";
    placeholderSrc.value = "";
    receivedBytes.value = 0;
    totalBytes.value = 0;
    meta.value = null;
    stageLevel.value = "none";
    originalReady.value = false;
    originalFailed.value = false;
    originalTask = null;
    cancelPendingTier();
    autoFitDone = false;
    resetAll();
    reloadSeq.value += 1;
    void refreshSrc();
  },
);
</script>

<template>
  <!-- 悬停即显示底部工具栏：此前只有缩放/编辑后才显形，
       用户打开图片时看不到「旋转 / 反向 / 保存」，等于找不到功能。 -->
  <div class="pimg" @mouseenter="hudHover = true" @mouseleave="hudHover = false">
    <!-- 视口：滚轮缩放 + 拖拽平移 + 裁剪选框 -->
    <div
      ref="viewportRef"
      class="pimg__vp"
      :class="{ 'is-crop': cropMode, 'is-loading': loading, 'is-pannable': pannable && !cropMode, 'is-panning': panning }"
      @wheel="onWheel"
      @contextmenu="onContextMenu"
      @mousedown="onPanDown"
      @mousemove="onPanMove"
      @mouseup="onPanUp"
      @mouseleave="onPanUp"
    >
      <!-- 占位图：原图字节还在路上时，先用低清小图放大模糊铺底。
           远端带宽下 2MB 的原图要几十秒，没有这一层就是一块白板加「加载中…」。 -->
      <img
        v-if="placeholderSrc && loading"
        class="pimg__ghost"
        :src="placeholderSrc"
        alt=""
        :draggable="false"
      />
      <div ref="stageRef" class="pimg__stage" :style="stageStyle">
        <img
          ref="imgRef"
          :src="src"
          class="pimg__img"
          :class="{ 'is-px': scale >= 1 }"
          :style="imgStyle"
          :alt="fileName"
          :draggable="false"
          @load="onImgLoad"
          @error="onImgError"
        />
        <!-- 裁剪选框 -->
        <div class="pimg__crop" :style="cropBoxStyle" />
      </div>
      <!-- 加载遮罩挂在视口上，不挂在舞台上：加载中舞台尺寸还是 0×0，
           挂在里面会被 overflow:hidden 裁没，导致「加载中」根本看不见。
           只在「一档图都没有」时整屏盖住；中清图出来之后只留右下角的小胶囊。 -->
      <div v-if="loading" class="pimg__mask pimg__mask--loading">
        <span class="pimg__mask-main">加载中…</span>
        <span v-if="receivedBytes > 0" class="pimg__mask-sub">
          {{ progressPercent === null ? receivedText : `${progressPercent}% · ${receivedText}` }}
        </span>
      </div>
      <div v-else-if="errorMsg" class="pimg__mask pimg__mask--err">{{ errorMsg }}</div>
      <!-- 原图仍在后台下载：非阻塞提示。此时 draft/mid 已经能看能缩放，
           不需要再用遮罩挡住整张图（挡住反而不能操作）。 -->
      <div v-if="hiresHint" class="pimg__hires" title="正在后台下载原图，用于 1:1 查看与编辑导出">
        {{ hiresHint }}
      </div>
    </div>

    <!-- 悬浮状态条：鼠标移入面板即显示；已编辑/缩放或裁剪态下保持显示 -->
    <!--
      is-hidden 只能改 opacity，**不能关 pointer-events**。
      原来这里同时写了 pointer-events: none，于是「点旋转按钮」这个动作本身
      失效：按钮此刻还是隐藏态，鼠标事件被 .pimg__vp 下的 <img> 吃掉。
      实测 Chromium/Firefox/WebKit 三家一致——按钮 visible+enabled+stable，
      但点击始终报「<img> subtree intercepts pointer events」。
      键盘 R 能用，所以此前只用键盘的用例全绿，把这个洞盖住了。
    -->
    <div class="pimg__hud" :class="{ 'is-hidden': !hudHover && !viewChanged && !cropMode }">
      <span class="pimg__hud-item">{{ Math.round(scale * 100) }}%</span>
      <span v-if="rotation" class="pimg__hud-item">{{ rotation }}°</span>
      <span v-if="cropRect.w > 0" class="pimg__hud-item">
        裁剪 {{ Math.round(cropRect.w) }}×{{ Math.round(cropRect.h) }}
      </span>
      <span class="pimg__hud-sep" />
      <button class="pimg__hud-btn" type="button" title="顺时针旋转 (R)" @click.stop="rotateCw">旋转</button>
      <button class="pimg__hud-btn" type="button" title="逆时针旋转" @click.stop="rotateCcw">反向</button>
      <button
        class="pimg__hud-btn"
        type="button"
        :class="{ 'is-on': cropMode }"
        title="裁剪 (C)"
        @click.stop="cropMode = !cropMode"
      >裁剪</button>
      <button class="pimg__hud-btn" type="button" title="全选 (裁剪)" @click.stop="cropAll">全选</button>
      <button class="pimg__hud-btn" type="button" title="适应窗口 (9)" @click.stop="zoomFit">适应</button>
      <button class="pimg__hud-btn" type="button" title="实际大小 (1)" @click.stop="zoomActual">1:1</button>
      <button class="pimg__hud-btn" type="button" title="重置 (0)" @click.stop="resetAll">重置</button>
      <button
        class="pimg__hud-btn pimg__hud-btn--primary"
        type="button"
        :disabled="!canSave || saving || rendering"
        title="保存 (S)"
        @click.stop="openSaveDialog"
      >{{ saving ? "保存中…" : rendering ? "导出中…" : "保存" }}</button>
    </div>

    <!-- 右键菜单 -->
    <div v-if="menuVisible" class="pimg__menu" :style="{ left: `${menuX}px`, top: `${menuY}px` }" @click.stop>
      <button class="pimg__menu-item" type="button" @click="rotateCcw(); closeMenu()">逆时针旋转</button>
      <button class="pimg__menu-item" type="button" @click="rotateCw(); closeMenu()">顺时针旋转</button>
      <div class="pimg__menu-sep" />
      <button class="pimg__menu-item" type="button" @click="cropMode = !cropMode; closeMenu()">
        {{ cropMode ? "退出裁剪" : "开始裁剪" }} <kbd>C</kbd>
      </button>
      <button class="pimg__menu-item" type="button" @click="cropAll(); closeMenu()">全选裁剪区</button>
      <button class="pimg__menu-item" type="button" @click="cropClear(); closeMenu()">清除裁剪</button>
      <div class="pimg__menu-sep" />
      <button class="pimg__menu-item" type="button" @click="zoomFit(); closeMenu()">适应窗口 <kbd>9</kbd></button>
      <button class="pimg__menu-item" type="button" @click="zoomActual(); closeMenu()">实际大小 <kbd>1</kbd></button>
      <button class="pimg__menu-item" type="button" @click="zoomReset(); closeMenu()">重置 <kbd>0</kbd></button>
      <div class="pimg__menu-sep" />
      <button class="pimg__menu-item" type="button" @click="resetAll(); closeMenu()">放弃所有编辑</button>
      <button
        class="pimg__menu-item pimg__menu-item--primary"
        type="button"
        :disabled="!canSave"
        @click="closeMenu(); openSaveDialog()"
      >保存… <kbd>S</kbd></button>
    </div>

    <!--
      保存选项弹框：覆盖原文件 / 另存为新文件。
      放进面板内部（而非 ElMessageBox）是因为要同时给出「单选 + 文件名输入」，
      MessageBox 只能给二个按钮，塞不下输入框。
    -->
    <ReDialog
      v-model="saveDlgVisible"
      title="保存图片"
      width="440px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!saving"
      class="pimg-save-dlg"
      @closed="pendingBlob = null"
    >
      <ReRadioGroup v-model="saveMode" :disabled="saving" class="pimg__save-mode">
        <ReRadio value="overwrite">覆盖原文件</ReRadio>
        <ReRadio value="new">另存为新文件</ReRadio>
      </ReRadioGroup>
      <div class="pimg__save-origin">{{ props.fileName }}</div>

      <div v-if="saveMode === 'new'" class="pimg__save-new">
        <el-input
          v-model="saveNewName"
          :disabled="saving"
          placeholder="新文件名（含扩展名）"
          maxlength="200"
          @blur="checkNewName"
        />
        <div v-if="saveNameTip" class="pimg__save-tip" :class="{ 'is-warn': !!saveNameTip }">
          {{ saveNameTip }}
        </div>
        <div v-else class="pimg__save-tip">将保存到同一目录，扩展名需与原文件一致</div>
      </div>

      <template #footer>
        <el-button :disabled="saving" @click="cancelSave">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">
          {{ saveMode === "overwrite" ? "覆盖保存" : "另存为" }}
        </el-button>
      </template>
    </ReDialog>

  </div>
</template>

<style scoped>
/*
  面板必须自带确定高度。
  此前写的是 height: 100%，而父链（el-dialog → __body → shell → .fs-preview）
  全都没有确定高度，百分比直接失效回退成 auto —— 于是 .pimg__vp 的
  flex:1 / min-height:0 / overflow:auto 拿不到有界高度，**永远不裁剪**。
  实测把 600×400 的图放大 12 档后：弹框 481px -> 3549px、舞台 5203×3468，
  表现为「滚轮缩放把整个弹出框也撑大了」。
  width 同理：.fs-preview 只对 .arc/.cad 做了 stretch，.pimg 会按内容宽度
  收缩，横向一起长（实测放大后 .pimg 宽 5235px）。
  这里自己把宽高钉死，尺寸问题不再外溢到共用弹框。
*/
.pimg {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: min(72vh, 820px);
}

/* 视口：唯一可滚动的容器，滚轮在这里被拦截做缩放 */
.pimg__vp {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border-radius: var(--el-radius-md, 8px);
}

/*
  占位图：原图没到之前先把缩略图放大铺底。
  blur 后即使只有 172px 也不会看到像素块，视觉上像「正在聚焦」。
  pointer-events:none 是硬要求 —— 它盖在视口上，会吃掉滚轮缩放与拖拽平移。
*/
.pimg__ghost {
  position: absolute;
  top: 16px;
  left: 16px;
  width: calc(100% - 32px);
  height: calc(100% - 32px);
  object-fit: contain;
  filter: blur(14px);
  opacity: 0.9;
  pointer-events: none;
}

.pimg__vp.is-crop {
  cursor: crosshair;
  /* 裁剪是拖拽手势，必须禁掉浏览器的原生拖拽/选中，否则鼠标一动就变成选中文字 */
  user-select: none;
  -webkit-user-drag: none;
}

/*
  可平移时才给抓手。图片小于视口时不给，否则用户拖了没反应会以为坏了。
  grabbing 用 :active 语义由 .is-panning 承担（拖拽可能移出视口，
  :active 会因事件目标变化而闪断）。
*/
.pimg__vp.is-pannable {
  cursor: grab;
}

.pimg__vp.is-panning {
  cursor: grabbing;
  /* 拖拽中禁止选中，避免把图片当成文本拽出蓝色选区 */
  user-select: none;
}

.pimg__vp.is-loading {
  align-items: center;
}

/* 舞台：旋转后的外接矩形，滚动条按它的尺寸算。
   overflow:hidden 有两个作用：
   ① 旋转 90/270 时 <img> 的**布局盒**仍是未旋转尺寸（600×400 落在 400×600 的
      舞台里），不加裁剪会让它溢出舞台、给视口多出可滚动的空白；
   ② 裁剪模式的压暗层是 stage 的 ::after（inset:0），需要按舞台边界裁。
   旋转后 img 的可见外接矩形恰好等于舞台，所以裁不到任何图像内容。 */
.pimg__stage {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: width 0.12s ease, height 0.12s ease;
}

.pimg__img {
  display: block;
  /* 尺寸由 imgStyle 以内联像素给出（自然尺寸 × scale）；这里只做兜底，
     不能用 100%——舞台宽高在 90/270 时互换，100% 会把图压扁。 */
  max-width: none;
  max-height: none;
  user-select: none;
  -webkit-user-drag: none;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
}

/* 放大时用最近邻保持像素锐利；缩小交给正常插值（pixelated 反而锯齿难看） */
.pimg__img.is-px {
  image-rendering: pixelated;
}

/* ==================== 保存选项弹框 ==================== */

.pimg__save-mode {
  display: flex;
  gap: 18px;
}

.pimg__save-origin {
  margin: 8px 0 4px;
  padding: 6px 10px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pimg__save-new {
  margin-top: 12px;
}

.pimg__save-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  line-height: 1.5;
}

/* 已存在/校验失败时用警示色，与普通说明区分开 */
.pimg__save-tip.is-warn {
  color: var(--el-color-warning, #e6a23c);
}

/* 裁剪选框
   刻意**不**用 box-shadow 造四周压暗：9999px 的外扩阴影会生成一个巨大的
   合成层，鼠标事件在选框出现后就被它吃掉，拖不动（实测选框出现后
   mousedown 收不到、cropRect 恒为空）。改用 stage 上的 ::after 伪元素做压暗，
   伪元素同样 pointer-events:none，不参与命中测试。 */
.pimg__crop {
  position: absolute;
  border: 1.5px dashed var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);
  pointer-events: none;
  z-index: 2;
}

/* 选框外的压暗：只在裁剪态显示 */
.pimg__stage::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 1;
}

.pimg__vp.is-crop .pimg__stage::after {
  opacity: 1;
}

.pimg__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-blank, #fff);
  font-size: 14px;
}

/* 加载态：底色透明，让占位图透上来；文字加胶囊底保证在任意照片上都看得清 */
.pimg__mask--loading {
  flex-direction: column;
  gap: 6px;
  background: transparent;
  pointer-events: none;
}

.pimg__mask-main {
  padding: 6px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color, #fff) 84%, transparent);
  backdrop-filter: blur(6px);
  color: var(--el-text-color-primary, #303133);
  font-size: 14px;
  box-shadow: var(--el-box-shadow-lighter, 0 2px 8px rgba(0, 0, 0, 0.08));
}

.pimg__mask-sub {
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  font-variant-numeric: tabular-nums;
}

.pimg__mask--err {
  color: var(--el-color-danger, #f56c6c);
}

/*
 * 原图下载中的小胶囊：贴视口右下角，不与底部居中的工具条打架。
 * pointer-events:none 是硬要求 —— 它是纯提示，盖在图上会吃掉滚轮缩放与拖拽平移。
 */
.pimg__hires {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color, #fff) 86%, transparent);
  backdrop-filter: blur(6px);
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  box-shadow: var(--el-box-shadow-lighter, 0 2px 8px rgba(0, 0, 0, 0.08));
  pointer-events: none;
  z-index: 3;
}

/* 悬浮状态条：靠底居中，无编辑时隐藏 */
.pimg__hud {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color, #fff) 88%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--el-box-shadow, 0 4px 16px rgba(0, 0, 0, 0.16));
  opacity: 1;
  transition: opacity 0.18s ease;
  z-index: 3;
}

/*
  隐藏态只做视觉淡出，保留命中能力：可见性淡出期间按钮仍要能点，
  否则「点旋转让状态条显形」就成了自相矛盾的死结（见模板处注释）。
*/
.pimg__hud.is-hidden {
  opacity: 0;
}

.pimg__hud-item {
  padding: 0 8px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  font-variant-numeric: tabular-nums;
}

.pimg__hud-sep {
  width: 1px;
  height: 16px;
  background: var(--el-border-color, #dcdfe6);
}

.pimg__hud-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.pimg__hud-btn:hover:not(:disabled) {
  background: var(--el-fill-color, #f0f2f5);
  color: var(--el-color-primary, #409eff);
}

.pimg__hud-btn.is-on {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}

.pimg__hud-btn--primary {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}

.pimg__hud-btn--primary:hover:not(:disabled) {
  background: var(--el-color-primary-dark-2, #337ecc);
  color: #fff;
}

.pimg__hud-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 右键菜单 */
.pimg__menu {
  position: fixed;
  z-index: 3000;
  min-width: 176px;
  padding: 4px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: var(--el-box-shadow-light, 0 4px 16px rgba(0, 0, 0, 0.16));
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.pimg__menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
  background: transparent;
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.pimg__menu-item:hover:not(:disabled) {
  background: var(--el-fill-color, #f0f2f5);
  color: var(--el-color-primary, #409eff);
}

.pimg__menu-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pimg__menu-item--primary {
  color: var(--el-color-primary, #409eff);
}

.pimg__menu-item kbd {
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--el-fill-color, #f0f2f5);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
}

.pimg__menu-sep {
  height: 1px;
  margin: 4px 6px;
  background: var(--el-border-color-lighter, #ebeef5);
}

@media (prefers-reduced-motion: reduce) {
  .pimg__stage {
    transition: none;
  }
}
</style>
