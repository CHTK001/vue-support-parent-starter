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
import { objectUrl, putObject } from "../api/filestorageApi";
import { extensionOf } from "../utils/officeRenderer";

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
/** 保存中 */
const saving = ref(false);
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

/** 是否可保存（有实际编辑且原图已加载） */
const dirty = computed(
  () => scale.value !== 1 || rotation.value !== 0 || (cropRect.value.w > 0 && cropRect.value.h > 0),
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
 * <p>缩放不能写成固定的像素宽高：那样只把外层 stage 撑大，{@code <img>} 仍是原图尺寸，
 * 视觉上等于没缩放（实测状态显示 182% 而显示宽度纹丝不动）。</p>
 *
 * <p>这里让 {@code <img>} 用百分比填满已缩放的 stage（写在样式表里，不进内联
 * style，避免 {@code imageRendering} 这类 CSS 枚举在内联对象上被 TS 判成
 * {@code string} 而报类型错），浏览器按 stage 尺寸重新采样：缩小是正常重采样
 * （画质最好），放大走最近邻（{@code is-px} 类）保持像素边缘清晰。旋转用
 * {@code transform}，只影响显示、不影响 stage 占位（占位已由
 * {@link displaySize} 按旋转后宽高算好）。</p>
 */
const imgStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg)`,
}));

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

/** 拖拽起点（视口坐标） */
let dragStart: { x: number; y: number } | null = null;
/** 视口坐标 → 原图像素坐标 */
function toImageCoords(clientX: number, clientY: number): { x: number; y: number } {
  const stage = stageRef.value;
  if (!stage) {
    return { x: 0, y: 0 };
  }
  const rect = stage.getBoundingClientRect();
  const d = displaySize.value;
  // 旋转 90/270 时，显示坐标系相对原图转置，取模还原
  let x = (clientX - rect.left) / scale.value;
  let y = (clientY - rect.top) / scale.value;
  if (rotation.value === 90) {
    const t = x;
    x = d.h - y;
    y = t;
  } else if (rotation.value === 180) {
    x = d.w - x;
    y = d.h - y;
  } else if (rotation.value === 270) {
    const t = x;
    x = y;
    y = d.w - t;
  }
  return {
    x: Math.max(0, Math.min(natural.value.w, x)),
    y: Math.max(0, Math.min(natural.value.h, y)),
  };
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
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, swap ? sh : sw, swap ? sw : sh);
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
async function save(): Promise<void> {
  const blob = await renderEdited();
  if (!blob) {
    ElMessage.error("导出失败，未保存");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `将用编辑后的图片覆盖原文件「${props.fileName}」，此操作不可撤销。`,
      "确认保存",
      { confirmButtonText: "覆盖保存", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }
  saving.value = true;
  try {
    await putObject(props.bucket, props.objectKey, blob);
    ElMessage.success("已保存到存储桶");
    emit("saved");
    // 重新拉取，拿到服务端的新图
    reloadSeq.value += 1;
    await loadOriginal();
  } catch (e) {
    ElMessage.error(`保存失败：${(e as Error)?.message ?? "未知错误"}`);
  } finally {
    saving.value = false;
  }
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
    if (dirty.value) {
      e.preventDefault();
      void save();
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
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("click", onDocClick);
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
  <div class="pimg">
    <!-- 视口：滚轮缩放 + 拖拽平移 + 裁剪选框 -->
    <div
      ref="viewportRef"
      class="pimg__vp"
      :class="{ 'is-crop': cropMode, 'is-loading': loading }"
      @wheel="onWheel"
      @contextmenu="onContextMenu"
      @mousedown="onCropDown"
      @mousemove="onCropMove"
      @mouseup="onCropUp"
      @mouseleave="onCropUp"
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

    <!-- 悬浮状态条：只在有编辑或裁剪态时出现，不是常驻工具栏 -->
    <div class="pimg__hud" :class="{ 'is-hidden': !dirty && !cropMode }">
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
        :disabled="!dirty || saving"
        title="保存 (S)"
        @click.stop="save"
      >{{ saving ? "保存中…" : "保存" }}</button>
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
        :disabled="!dirty"
        @click="closeMenu(); save()"
      >保存并覆盖 <kbd>S</kbd></button>
    </div>

  </div>
</template>

<style scoped>
.pimg {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
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

.pimg__vp.is-loading {
  align-items: center;
}

/* 舞台：缩放后的占位盒子，滚动条按它的尺寸算 */
.pimg__stage {
  position: relative;
  flex: none;
  transition: width 0.12s ease, height 0.12s ease;
}

.pimg__img {
  display: block;
  /* 填满已缩放的 stage：缩放靠外层尺寸变化 + 这里 100% 填满实现，
     若给 img 写死像素宽高，则只把 stage 撑大而图不变（等于没缩放）。 */
  width: 100%;
  height: 100%;
  max-width: none;
  user-select: none;
  -webkit-user-drag: none;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.12));
}

/* 放大时用最近邻保持像素锐利；缩小交给正常插值（pixelated 反而锯齿难看） */
.pimg__img.is-px {
  image-rendering: pixelated;
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

.pimg__hud.is-hidden {
  opacity: 0;
  pointer-events: none;
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
