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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { existObject, objectUrl, putObject } from "../api/filestorageApi";
import { extensionOf } from "../utils/officeRenderer";
import { displayToImage } from "../utils/imageCoords";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（支持子目录） */
  objectKey: string;
  /** 文件名（决定导出格式） */
  fileName: string;
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

/** 缓存击穿序号：保存后自增，强制重新拉图 */
const reloadSeq = ref(0);

/** 原图地址（带缓存击穿参数，保存后能立刻看到新图） */
const src = computed(() => {
  const base = objectUrl(props.bucket, props.objectKey);
  return `${base}${base.includes("?") ? "&" : "?"}_r=${reloadSeq.value}`;
});

/** 拉原图字节（供裁剪导出与「还原」用） */
async function loadOriginal(): Promise<void> {
  try {
    const res = await fetch(src.value);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    originalBlob = await res.blob();
  } catch (e) {
    originalBlob = null;
  }
}

function onImgLoad(e: Event): void {
  const img = e.target as HTMLImageElement;
  natural.value = { w: img.naturalWidth, h: img.naturalHeight };
  loading.value = false;
  errorMsg.value = "";
  void loadOriginal();
}

function onImgError(): void {
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
    ElMessage.error(`图片处理失败：${(e as Error)?.message ?? "未知错误"}`);
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
 */
async function openSaveDialog(): Promise<void> {
  if (rendering.value || saving.value) {
    return;
  }
  rendering.value = true;
  try {
    const blob = await renderEdited();
    if (!blob) {
      ElMessage.error("导出失败，未保存");
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
    ElMessage.success(overwrite ? "已覆盖原文件" : `已另存为「${saveNewName.value.trim()}」`);
    emit("saved");
    if (overwrite) {
      // 覆盖时才需要把面板里的图换成服务端的新图
      reloadSeq.value += 1;
      await loadOriginal();
    }
  } catch (e) {
    ElMessage.error(`保存失败：${(e as Error)?.message ?? "未知错误"}`);
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
    if (menuVisible.value) {
      closeMenu();
    } else if (cropMode.value) {
      cropMode.value = false;
      cropClear();
    } else {
      emit("saved"); // 借用事件触发父组件关闭
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
  if (viewportRef.value) {
    viewportRo = new ResizeObserver(() => {
      const el = viewportRef.value;
      if (el) {
        viewportSize.value = { w: el.clientWidth, h: el.clientHeight };
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
  originalBlob = null;
});

watch(
  () => [props.bucket, props.objectKey],
  () => {
    loading.value = true;
    errorMsg.value = "";
    resetAll();
    reloadSeq.value += 1;
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
        <!-- 加载遮罩 -->
        <div v-if="loading" class="pimg__mask">加载中…</div>
        <div v-else-if="errorMsg" class="pimg__mask pimg__mask--err">{{ errorMsg }}</div>
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
    <el-dialog
      v-model="saveDlgVisible"
      title="保存图片"
      width="440px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!saving"
      class="pimg-save-dlg"
      @closed="pendingBlob = null"
    >
      <el-radio-group v-model="saveMode" :disabled="saving" class="pimg__save-mode">
        <el-radio value="overwrite">覆盖原文件</el-radio>
        <el-radio value="new">另存为新文件</el-radio>
      </el-radio-group>
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
    </el-dialog>

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

.pimg__mask--err {
  color: var(--el-color-danger, #f56c6c);
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
