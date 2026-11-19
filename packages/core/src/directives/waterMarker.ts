/*
  需求：给整个页面添加背景水印。

  思路：
    1、使用 canvas 特性生成 base64 格式的图片文件，设置其字体大小，颜色等。
    2、将其设置为背景图片，从而实现页面或组件水印效果

  使用：设置水印文案，颜色，字体大小即可
  <!-- 全局水印 - 整个页面（不传 config 时自动读取全局 Watermark 配置） -->
  <div v-waterMarker="{
    text: 'ADMIN',
    font: '20px 宋体',
    textColor: 'rgba(100, 100, 100, 0.15)',
    isGlobal: true,
    zIndex: 9999
  }">
  <!-- 局部水印 - 仅应用于此div -->
  <div v-waterMarker="{
    text: '局部水印',
    font: '16px Arial',
    textColor: 'rgba(200, 50, 50, 0.2)',
    isGlobal: false
  }">

  全局配置（security.watermark）支持字段：
    enable / text(string|string[] 多行) / color / darkColor(暗色主题色) / alpha /
    rotate / fontSize / fontFamily / gapX / gapY / zIndex / trace /
    image(图片水印地址，配置后优先于文字) / imageDark(暗色主题图片) / imageWidth(显示宽度，等比缩放)
  trace 为 true（默认）时，全局水印自动拼入当前登录用户（需宿主注册
  registerWatermarkTraceProvider）与生成时间，便于截图溯源。
  篡改检测：防删除/防样式篡改触发时派发 window 事件 WATERMARK_TAMPER_EVENT
  （detail: { type: 'remove'|'style'|'integrity', time }），宿主可上报审计。
  装配入口：宿主 onMounted 调用 setupWatermark()（幂等：立即应用 + web 字体就绪
  重绘）；配置热重载重绘由 createApp 的 onConfigHotReload 通道统一负责
  （setting.ts → applyGlobalWatermark），此处不重复订阅。篡改告警累计次数经
  getWatermarkTamperCount() 读取，并镜像到 window.__watermarkTamperCount 供验收断言。
  预览：buildWatermarkTile(配置片) 按同一套瓦片算法生成 data URL（不拼溯源行），
  供设置页实时预览复用，避免两处绘制实现漂移。
*/

import type { Directive, DirectiveBinding } from "vue";
import { getConfig, type WatermarkConfig } from "@repo/config";

// 全局水印容器ID
const GLOBAL_WATERMARK_ID = "global-watermark-container";

/** 水印溯源信息（由宿主应用注册提供，如当前登录用户） */
export interface WatermarkTrace {
  /** 用户名/昵称 */
  user?: string;
  /** 用户 ID */
  uid?: string;
  /** IP（宿主能取到时提供） */
  ip?: string;
}

type WatermarkTraceProvider = () => WatermarkTrace | null;

let traceProvider: WatermarkTraceProvider | null = null;

/** 注册水印溯源信息提供者（宿主应用装配时调用一次；传 null 注销） */
export function registerWatermarkTraceProvider(fn: WatermarkTraceProvider | null): void {
  traceProvider = fn;
}

/** 篡改事件名：window.dispatchEvent(CustomEvent)，detail = { type, time } */
export const WATERMARK_TAMPER_EVENT = "watermark:tamper";

/** 图片水印异步就绪事件：ensureImage 加载完图片后派发，设置页预览等监听后刷新瓦片 */
export const WATERMARK_IMAGE_READY_EVENT = "watermark:image-ready";

// 默认水印配置
const defaultConfig = {
  text: "ADMIN",
  font: "20px 宋体",
  textColor: "rgba(180, 180, 180, 0.3)",
  zIndex: 9999,
  isGlobal: false, // 默认局部水印
  enable: true, // 全局开关
  rotate: -20, // 水印旋转角度
  gapX: 60, // 瓦片横向间距（px）
  gapY: 50, // 瓦片纵向间距（px）
  trace: true, // 全局水印拼入溯源信息（用户/时间）
  imageWidth: 120 // 图片水印显示宽度（px），高度等比缩放
};

/** 运行时水印配置（defaultConfig + 全局配置 + 指令绑定值合并） */
interface WatermarkRuntimeConfig {
  text: string | string[];
  font: string;
  fontSize?: number;
  fontFamily?: string;
  darkColor?: string;
  textColor: string;
  zIndex: number;
  isGlobal: boolean;
  enable: boolean;
  rotate: number;
  gapX: number;
  gapY: number;
  trace: boolean;
  /** 原始透明度（图片水印用 globalAlpha；文字水印已烘焙进 textColor） */
  alpha?: number;
  /** 图片水印地址（配置后优先于文字） */
  image?: string;
  /** 暗色主题图片水印地址（缺省沿用 image） */
  imageDark?: string;
  /** 图片水印显示宽度（px），高度等比缩放 */
  imageWidth?: number;
}

/** 从全局配置读取水印配置（security.Watermark* 或 app.yaml watermark） */
function readGlobalWatermarkConfig(): Partial<WatermarkRuntimeConfig> {
  const cfg = (getConfig() as Record<string, any>)?.security ?? {};
  const wm = cfg.watermark ?? {};
  const result: Partial<WatermarkRuntimeConfig> = {};
  // 水印开关（仅显式开启才生效，缺省关闭）
  result.enable = wm.enable === true;
  result.isGlobal = wm.enable === true;
  // 文案：支持多行数组
  if (Array.isArray(wm.text) ? wm.text.length > 0 : typeof wm.text === "string" && wm.text) {
    result.text = wm.text;
  }
  // 颜色 + 透明度（兼容 hex / rgba 颜色）
  const alpha = typeof wm.alpha === "number" ? wm.alpha : undefined;
  const color = withAlpha(wm.color, alpha);
  if (color) result.textColor = color;
  else if (typeof wm.alpha === "number") result.textColor = rgbaFromHex("#409EFF", wm.alpha);
  // 暗色主题配色（html.dark 时生效）
  const darkColor = withAlpha(wm.darkColor, alpha);
  if (darkColor) result.darkColor = darkColor;
  if (typeof wm.rotate === "number") result.rotate = wm.rotate;
  if (typeof wm.fontSize === "number" && wm.fontSize > 0) result.fontSize = wm.fontSize;
  if (typeof wm.fontFamily === "string" && wm.fontFamily) result.fontFamily = wm.fontFamily;
  if (typeof wm.gapX === "number" && wm.gapX >= 0) result.gapX = wm.gapX;
  if (typeof wm.gapY === "number" && wm.gapY >= 0) result.gapY = wm.gapY;
  if (typeof wm.zIndex === "number") result.zIndex = wm.zIndex;
  if (typeof wm.trace === "boolean") result.trace = wm.trace;
  // 原始透明度（图片水印用 globalAlpha；文字水印在 withAlpha 中烘焙进颜色）
  if (typeof wm.alpha === "number") result.alpha = wm.alpha;
  // 图片水印（配置后优先于文字；暗色可单独指定 imageDark）
  if (typeof wm.image === "string" && wm.image) result.image = wm.image;
  if (typeof wm.imageDark === "string" && wm.imageDark) result.imageDark = wm.imageDark;
  if (typeof wm.imageWidth === "number" && wm.imageWidth > 0) result.imageWidth = wm.imageWidth;
  return result;
}

/** hex 颜色 + alpha → rgba 字符串 */
function rgbaFromHex(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return `rgba(180, 180, 180, ${alpha})`;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 颜色统一套用透明度：hex 转 rgba；已是 rgba() 则替换 alpha；其它原样返回 */
function withAlpha(color: string | undefined, alpha: number | undefined): string | undefined {
  if (!color) return undefined;
  if (typeof alpha !== "number") return color;
  if (color.startsWith("#")) return rgbaFromHex(color, alpha);
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((s) => parseFloat(s));
    const [r, g, b] = parts;
    if ([r, g, b].every((n) => Number.isFinite(n))) return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/** 解析绘制字体：显式配置了 fontSize/fontFamily 时组合，否则回退 font 字符串 */
function resolveFont(config: Partial<WatermarkRuntimeConfig>): string {
  if (typeof config.fontSize === "number" || config.fontFamily) {
    const size = typeof config.fontSize === "number" ? config.fontSize : 20;
    return `${size}px ${config.fontFamily || "宋体"}`;
  }
  return config.font || defaultConfig.font;
}

/** 从字体字符串解析字号（px），解析失败回退 20 */
function parseFontSize(font: string): number {
  const m = font.match(/(\d+(?:\.\d+)?)px/);
  return m ? parseFloat(m[1]) : 20;
}

/** 瓦片缓存：同参数（文案/字体/颜色/角度/间距/dpr）不重复绘制 canvas。
 * 主题切换、配置热重载、字体就绪、篡改重建都会触发重绘，缓存后重复路径零绘制开销；
 * 溯源时间行精确到分钟并参与缓存键，跨分钟自然产生新瓦片。 */
const tileCache = new Map<string, { data: string; w: number; h: number }>();

/** 缓存上限：水印瓦片按配置维度生成，数量有限；超限整体清空即可 */
const TILE_CACHE_MAX = 80;

function storeTileCache(key: string, tile: { data: string; w: number; h: number }): void {
  if (tileCache.size >= TILE_CACHE_MAX) tileCache.clear();
  tileCache.set(key, tile);
}

/**
 * 生成水印瓦片：按文本内容测量尺寸（长文案不截断），按 devicePixelRatio 放大
 * 保证高分屏清晰，旋转后按外接矩形铺排使 repeat 拼接无缝。
 */
const generateWatermarkCanvas = (
  lines: string[],
  font: string,
  textColor: string,
  rotate: number = -20,
  gapX: number = 60,
  gapY: number = 50
): { data: string; w: number; h: number } => {
  // 缓存键：dpr + 字体 + 颜色 + 角度 + 间距 + 全部文案行（含分钟级时间行）
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const cacheKey = `txt|${dpr}|${font}|${textColor}|${rotate}|${gapX}|${gapY}|${lines.join("\u0001")}`;
  const cached = tileCache.get(cacheKey);
  if (cached) return cached;
  const measure = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
  measure.font = font;
  const fontSize = parseFontSize(font);
  const lineGap = Math.max(4, Math.round(fontSize * 0.35));
  const textWidth = Math.max(10, ...lines.map((l) => measure.measureText(l).width));
  const textHeight = lines.length * fontSize + (lines.length - 1) * lineGap;
  // 旋转后外接矩形 + 四周间距 = 瓦片尺寸
  const rad = (rotate * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const tileW = Math.ceil(textWidth * cos + textHeight * sin) + gapX * 2;
  const tileH = Math.ceil(textWidth * sin + textHeight * cos) + gapY * 2;
  // 按 dpr 放大画布，背景尺寸仍按 CSS 像素声明，高分屏不发虚（dpr 已在缓存键处取过）
  const canvasW = Math.max(1, Math.round(tileW * dpr));
  const canvasH = Math.max(1, Math.round(tileH * dpr));
  const can: HTMLCanvasElement = document.createElement("canvas");
  can.width = canvasW;
  can.height = canvasH;
  can.style.display = "none";
  const cans = can.getContext("2d") as CanvasRenderingContext2D;
  cans.scale(canvasW / tileW, canvasH / tileH);
  cans.translate(tileW / 2, tileH / 2);
  cans.rotate(rad);
  cans.font = font;
  cans.fillStyle = textColor;
  cans.textAlign = "center";
  cans.textBaseline = "middle";
  const startY = -(textHeight - fontSize) / 2;
  lines.forEach((line, i) => {
    cans.fillText(line, 0, startY + i * (fontSize + lineGap));
  });
  const tile = { data: can.toDataURL("image/png"), w: tileW, h: tileH };
  storeTileCache(cacheKey, tile);
  return tile;
};

/**
 * 生成图片水印瓦片：图片按 imageWidth 等比缩放、套用透明度（globalAlpha），
 * 旋转后按外接矩形铺排使 repeat 拼接无缝；同样按 dpr 放大保证高分屏清晰。
 */
function generateImageWatermarkCanvas(
  img: HTMLImageElement,
  imageWidth: number,
  alpha: number | undefined,
  rotate: number,
  gapX: number,
  gapY: number
): { data: string; w: number; h: number } {
  const naturalW = img.naturalWidth > 0 ? img.naturalWidth : 1;
  const naturalH = img.naturalHeight > 0 ? img.naturalHeight : 1;
  const scale = imageWidth > 0 ? imageWidth / naturalW : 1;
  const drawW = Math.max(1, Math.round(naturalW * scale));
  const drawH = Math.max(1, Math.round(naturalH * scale));
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const cacheKey = `img|${img.src}|${drawW}x${drawH}|${alpha ?? 1}|${rotate}|${gapX}|${gapY}|${dpr}`;
  const cached = tileCache.get(cacheKey);
  if (cached) return cached;
  const rad = (rotate * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const tileW = Math.ceil(drawW * cos + drawH * sin) + gapX * 2;
  const tileH = Math.ceil(drawW * sin + drawH * cos) + gapY * 2;
  const canvasW = Math.max(1, Math.round(tileW * dpr));
  const canvasH = Math.max(1, Math.round(tileH * dpr));
  const can: HTMLCanvasElement = document.createElement("canvas");
  can.width = canvasW;
  can.height = canvasH;
  const ctx = can.getContext("2d") as CanvasRenderingContext2D;
  ctx.scale(canvasW / tileW, canvasH / tileH);
  ctx.translate(tileW / 2, tileH / 2);
  ctx.rotate(rad);
  ctx.globalAlpha = typeof alpha === "number" ? Math.min(1, Math.max(0, alpha)) : 1;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  const tile = { data: can.toDataURL("image/png"), w: tileW, h: tileH };
  storeTileCache(cacheKey, tile);
  return tile;
}

/** 图片水印加载缓存：url → 加载完成的 Image；失败单独标记，避免坏图反复请求 */
const watermarkImages = new Map<string, HTMLImageElement>();
const watermarkImagesFailed = new Set<string>();

/**
 * 确保图片水印就绪：已加载返回 Image；未加载启动加载并返回 null，
 * onload 后派发 WATERMARK_IMAGE_READY_EVENT（预览方监听刷新）并回调 onReady
 * （全局/局部水印据此整体重绘）。
 */
function ensureImage(url: string, onReady: () => void): HTMLImageElement | null {
  const cached = watermarkImages.get(url);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;
  if (watermarkImagesFailed.has(url)) return null;
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth > 0) {
      watermarkImages.set(url, img);
    } else {
      watermarkImagesFailed.add(url);
    }
    try {
      window.dispatchEvent(new CustomEvent(WATERMARK_IMAGE_READY_EVENT, { detail: { url } }));
    } catch {
      // 事件派发失败不影响水印
    }
    onReady();
  };
  img.onerror = () => {
    // 加载失败：回退文字水印，标记后不再反复请求
    watermarkImagesFailed.add(url);
  };
  img.src = url;
  return null;
}

/** 组装水印文案行：配置文案（支持多行）+ 溯源信息（当前用户/时间） */
export function buildWatermarkLines(config: Partial<WatermarkRuntimeConfig>): string[] {
  const base = Array.isArray(config.text)
    ? config.text.filter((s): s is string => Boolean(s))
    : [config.text].filter((s): s is string => Boolean(s));
  const lines: string[] = base.length ? [...base] : [defaultConfig.text];
  if (config.trace !== false) {
    // 溯源用户：提供者缺省/抛错时跳过，不阻断时间行
    if (traceProvider) {
      let trace: WatermarkTrace | null = null;
      try {
        trace = traceProvider();
      } catch {
        trace = null;
      }
      if (trace) {
        const parts: string[] = [];
        if (trace.user) parts.push(trace.user);
        if (trace.uid) parts.push(trace.user ? `(${trace.uid})` : `ID:${trace.uid}`);
        if (trace.ip) parts.push(trace.ip);
        const who = parts.join(" ");
        if (who) lines.push(who);
      }
    }
    // 生成时间：只要 trace 开启就拼入（不依赖提供者）
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    lines.push(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }
  return lines;
}

/** 防删除监听：检测水印容器被移除/样式被篡改后自动恢复（不影响业务渲染） */
let restoreObserver: MutationObserver | null = null;

/** 容器创建时的样式快照，被篡改后按此还原 */
let protectedStyleCssText = "";

/** 完整性巡检定时器：兜底 MutationObserver 盲区（CSSOM insertRule、未内联声明的隐藏属性） */
let integrityTimer: ReturnType<typeof setInterval> | null = null;

/** 巡检周期（毫秒）：低频即可，攻击窗口有限且无可感知开销 */
const INTEGRITY_CHECK_INTERVAL = 800;

/** 打印调整中标记：beforeprint 临时改布局期间暂停防篡改还原 */
let printAdjustActive = false;

/** 篡改告警去重：同一攻击风暴 1s 内只派发一次事件 */
let lastTamperAt = 0;

/** 篡改告警累计次数（含被 1s 去重合并的风暴），window.__watermarkTamperCount 与之同步 */
let tamperCount = 0;

/** 读取篡改告警累计次数（供宿主上报与验收脚本断言） */
export function getWatermarkTamperCount(): number {
  return tamperCount;
}

/** 派发篡改事件（宿主可监听 WATERMARK_TAMPER_EVENT 上报审计） */
function notifyTamper(type: "remove" | "style" | "integrity"): void {
  const now = Date.now();
  if (now - lastTamperAt < 1000) return;
  lastTamperAt = now;
  tamperCount++;
  try {
    (window as unknown as Record<string, unknown>).__watermarkTamperCount = tamperCount;
  } catch {
    // 镜像失败不影响防护
  }
  try {
    window.dispatchEvent(new CustomEvent(WATERMARK_TAMPER_EVENT, { detail: { type, time: now } }));
  } catch {
    // 事件派发失败不影响防护
  }
}

/** 校验计算样式是否被外部样式压制（样式表注入 / CSSOM insertRule 等），偏离即回写快照或重建 */
function verifyWatermarkIntegrity(): void {
  if (!isWatermarkEnabled() || printAdjustActive) {
    return;
  }
  const el = document.getElementById(GLOBAL_WATERMARK_ID);
  if (!el || !el.isConnected) {
    // 节点丢失且观察器未捕获（如整棵树被替换）→ 重建
    notifyTamper("integrity");
    applyGlobalWatermark();
    return;
  }
  const cs = getComputedStyle(el);
  // 统一按字符串读，规避个别属性的类型定义差异
  const v = (name: string): string => String((cs as unknown as Record<string, unknown>)[name] ?? "");
  const rect = el.getBoundingClientRect();
  const broken =
    v("display") === "none" ||
    v("visibility") === "hidden" ||
    v("opacity") === "0" ||
    (v("transform") !== "none" && v("transform") !== "") ||
    (v("scale") !== "none" && v("scale") !== "1") ||
    (v("rotate") !== "none" && v("rotate") !== "0deg") ||
    (v("translate") !== "none" && v("translate") !== "0px") ||
    (v("filter") !== "none" && v("filter") !== "") ||
    (v("clipPath") !== "none" && v("clipPath") !== "") ||
    (v("maskImage") !== "none" && v("maskImage") !== "") ||
    !v("backgroundImage").includes("data:image") ||
    v("backgroundSize") === "0px 0px" ||
    rect.width < window.innerWidth - 4 ||
    rect.height < window.innerHeight - 4;
  if (!broken) {
    return;
  }
  notifyTamper("integrity");
  // 按快照还原内联样式；节点已被移出 body 则直接重建
  if (el.parentElement === document.body) {
    el.style.cssText = protectedStyleCssText;
  } else {
    applyGlobalWatermark();
  }
}

/** 当前水印是否启用（用于恢复时二次判断） */
function isWatermarkEnabled(): boolean {
  return readGlobalWatermarkConfig().enable !== false;
}

/** 打印事件监听只绑定一次（容器重建不重复挂） */
let printHandlersBound = false;

/** 打印覆盖：打印时把 fixed 容器临时切为覆盖全文档的 absolute，使每一页都有水印 */
function bindPrintHandlers(): void {
  if (typeof window === "undefined" || printHandlersBound) return;
  printHandlersBound = true;
  window.addEventListener("beforeprint", () => {
    const el = document.getElementById(GLOBAL_WATERMARK_ID);
    if (!el || !isWatermarkEnabled() || !protectedStyleCssText) return;
    printAdjustActive = true;
    const doc = document.documentElement;
    const w = Math.max(doc.scrollWidth, window.innerWidth);
    const h = Math.max(doc.scrollHeight, window.innerHeight);
    el.style.cssText = protectedStyleCssText;
    el.style.setProperty("position", "absolute", "important");
    el.style.setProperty("top", "0", "important");
    el.style.setProperty("left", "0", "important");
    el.style.setProperty("width", `${w}px`, "important");
    el.style.setProperty("height", `${h}px`, "important");
    el.style.setProperty("z-index", "2147483647", "important");
  });
  window.addEventListener("afterprint", () => {
    printAdjustActive = false;
    const el = document.getElementById(GLOBAL_WATERMARK_ID);
    if (el && protectedStyleCssText) {
      el.style.cssText = protectedStyleCssText;
    }
  });
}

/** 挂接防删除监听：水印节点被移除/替换时自动重建；样式被篡改时立即还原 */
function watchGlobalWatermark(container?: HTMLElement): void {
  if (typeof document === "undefined" || !document.body) {
    return;
  }
  // 防重复监听
  if (restoreObserver) {
    restoreObserver.disconnect();
    restoreObserver = null;
  }
  restoreObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const el = mutation.target as HTMLElement;
        // 主题切换（html class 增删，如 dark）→ 重绘全局/局部水印以适配暗色配色
        if (el === document.documentElement) {
          if (isWatermarkEnabled()) applyGlobalWatermark();
          redrawLocalWatermarks();
          continue;
        }
        if (printAdjustActive) continue;
        // 样式篡改防御：display:none / opacity:0 / 清空背景等改动立即按快照还原
        if (
          el.id === GLOBAL_WATERMARK_ID &&
          isWatermarkEnabled() &&
          protectedStyleCssText &&
          el.style.cssText !== protectedStyleCssText
        ) {
          notifyTamper("style");
          el.style.cssText = protectedStyleCssText;
        }
        continue;
      }
      const removed = Array.from(mutation.removedNodes).some(
        (node) => (node as HTMLElement).id === GLOBAL_WATERMARK_ID
      );
      if (removed && isWatermarkEnabled()) {
        // 被外部删除后自动重建（内部会移除旧容器并重新挂接观察器）
        notifyTamper("remove");
        applyGlobalWatermark();
        return;
      }
    }
  });
  restoreObserver.observe(document.body, { childList: true, subtree: true });
  // 观察 html class 变化（暗色/亮色主题切换时重绘）
  restoreObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  // 观察容器自身 style 属性（容器每次重建后重新挂接）
  if (container) {
    protectedStyleCssText = container.style.cssText;
    restoreObserver.observe(container, { attributes: true, attributeFilter: ["style"] });
  }
  // 打印覆盖 + 低频完整性巡检（兜底 CSSOM 注入等观察器盲区）
  bindPrintHandlers();
  if (integrityTimer === null && typeof setInterval !== "undefined") {
    integrityTimer = setInterval(() => {
      // 后台标签页跳过巡检：避免无意义的强制布局，回前台后下一轮即恢复检查
      if (typeof document !== "undefined" && document.hidden) return;
      verifyWatermarkIntegrity();
    }, INTEGRITY_CHECK_INTERVAL);
  }
}

/** 断开防删除监听（水印关闭 / 应用销毁时调用） */
function unwatchGlobalWatermark(): void {
  if (restoreObserver) {
    restoreObserver.disconnect();
    restoreObserver = null;
  }
  if (integrityTimer !== null) {
    clearInterval(integrityTimer);
    integrityTimer = null;
  }
  protectedStyleCssText = "";
  printAdjustActive = false;
}

/**
 * 重新应用全局水印（配置热重载后调用）。
 * 读取当前 security.watermark，开关关闭时不渲染。
 */
export function applyGlobalWatermark(): void {
  const global = readGlobalWatermarkConfig();
  if (global.enable === false) {
    // 关闭时移除水印并断开防删除监听
    unwatchGlobalWatermark();
    const oldWatermark = document.getElementById(GLOBAL_WATERMARK_ID);
    // 用 remove() 而非 body.removeChild()：容器可能已被移到任意父级
    oldWatermark?.remove();
    return;
  }
  const config = { ...defaultConfig, ...global, isGlobal: true } as WatermarkRuntimeConfig;
  createGlobalWatermark(config);
}

/**
 * 装配全局水印（宿主 onMounted 调用一次；重复调用无副作用）：
 * 1. 立即按当前 security.watermark 应用；
 * 2. web 字体异步就绪后重绘一次，避免首绘按回退字体测量导致字宽偏差。
 * 配置变更后的自动重绘走 createApp 的 onConfigHotReload 通道（setting.ts），
 * 本函数不重复订阅配置变更。
 */
let watermarkSetupDone = false;
export function setupWatermark(): void {
  if (watermarkSetupDone || typeof window === "undefined") return;
  watermarkSetupDone = true;
  applyGlobalWatermark();
  const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
  if (fonts?.ready) {
    fonts.ready
      .then(() => {
        applyGlobalWatermark();
      })
      .catch(() => {
        // 字体就绪信号不可用时保持首绘结果
      });
  }
}

/**
 * 按配置片生成水印瓦片（设置页实时预览等场景复用同一套绘制算法）。
 * 与全局水印同规则：颜色统一套 alpha、暗色优先 darkColor、多行文案、
 * 旋转外接矩形铺排；预览固定不拼溯源行。
 */
export function buildWatermarkTile(
  config: Partial<WatermarkConfig> & { dark?: boolean }
): { data: string; w: number; h: number; lines: string[]; imagePending?: boolean } {
  const alpha = typeof config.alpha === "number" ? config.alpha : undefined;
  const runtime: Partial<WatermarkRuntimeConfig> = {};
  const color = withAlpha(config.color, alpha);
  if (color) runtime.textColor = color;
  else if (typeof alpha === "number") runtime.textColor = rgbaFromHex("#409EFF", alpha);
  const darkColor = withAlpha(config.darkColor, alpha);
  if (darkColor) runtime.darkColor = darkColor;
  if (typeof config.rotate === "number") runtime.rotate = config.rotate;
  if (typeof config.fontSize === "number" && config.fontSize > 0) runtime.fontSize = config.fontSize;
  if (typeof config.fontFamily === "string" && config.fontFamily) runtime.fontFamily = config.fontFamily;
  if (typeof config.gapX === "number" && config.gapX >= 0) runtime.gapX = config.gapX;
  if (typeof config.gapY === "number" && config.gapY >= 0) runtime.gapY = config.gapY;
  runtime.text = config.text;
  if (typeof config.alpha === "number") runtime.alpha = config.alpha;
  // 图片水印字段透传（配置后优先于文字；暗色可单独指定 imageDark）
  if (typeof config.image === "string" && config.image) runtime.image = config.image;
  if (typeof config.imageDark === "string" && config.imageDark) runtime.imageDark = config.imageDark;
  if (typeof config.imageWidth === "number" && config.imageWidth > 0) runtime.imageWidth = config.imageWidth;
  const merged = { ...defaultConfig, ...runtime } as WatermarkRuntimeConfig;
  const lines = buildWatermarkLines({ ...merged, trace: false });
  const dark = config.dark === true;
  const imageUrl = (dark && merged.imageDark ? merged.imageDark : merged.image) || "";
  if (imageUrl) {
    // 预览用图片：就绪返回图片瓦片；未就绪先回退文字瓦片并标记 imagePending，
    // ensureImage 的 onload 内已派发 WATERMARK_IMAGE_READY_EVENT，无需重复回调
    const image = ensureImage(imageUrl, () => {});
    if (image) {
      const tile = generateImageWatermarkCanvas(
        image,
        merged.imageWidth ?? 120,
        merged.alpha,
        merged.rotate,
        merged.gapX,
        merged.gapY
      );
      return { ...tile, lines, imagePending: false };
    }
    const fallback = generateWatermarkCanvas(
      lines,
      resolveFont(merged),
      dark && merged.darkColor ? merged.darkColor : merged.textColor,
      merged.rotate,
      merged.gapX,
      merged.gapY
    );
    return { ...fallback, lines, imagePending: true };
  }
  const textColor = dark && merged.darkColor ? merged.darkColor : merged.textColor;
  const { data, w, h } = generateWatermarkCanvas(
    lines,
    resolveFont(merged),
    textColor,
    merged.rotate,
    merged.gapX,
    merged.gapY
  );
  return { data, w, h, lines, imagePending: false };
}

// 创建全局水印
const createGlobalWatermark = (config: WatermarkRuntimeConfig) => {
  // 移除旧水印（可能被攻击者移到任意父级，remove() 从当前位置安全摘除）
  document.getElementById(GLOBAL_WATERMARK_ID)?.remove();

  // 创建新水印容器
  const container = document.createElement("div");
  container.id = GLOBAL_WATERMARK_ID;
  // 纯装饰层：对辅助技术隐藏（背景图读屏本不读取，此处显式声明语义）
  container.setAttribute("role", "presentation");
  container.setAttribute("aria-hidden", "true");

  // 暗色主题优先用 imageDark / darkColor
  const dark = document.documentElement.classList.contains("dark");
  const imageUrl = (dark && config.imageDark ? config.imageDark : config.image) || "";
  // 图片水印优先：未就绪先按文字瓦片渲染，onload 回调整体重绘
  const image = imageUrl ? ensureImage(imageUrl, () => applyGlobalWatermark()) : null;
  let tile: { data: string; w: number; h: number };
  if (image) {
    tile = generateImageWatermarkCanvas(
      image,
      config.imageWidth ?? 120,
      config.alpha,
      config.rotate,
      config.gapX,
      config.gapY
    );
  } else {
    // 文案：配置文案 + 溯源信息；颜色：暗色主题优先用 darkColor
    const lines = buildWatermarkLines(config);
    const textColor = dark && config.darkColor ? config.darkColor : config.textColor;
    tile = generateWatermarkCanvas(
      lines,
      resolveFont(config),
      textColor,
      config.rotate,
      config.gapX,
      config.gapY
    );
  }
  const { data, w, h } = tile;

  // 设置全局水印样式：关键属性带 !important，防止页面注入样式表（含 CSSOM insertRule）压过内联样式
  const styles: Record<string, string> = {
    position: "fixed",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    width: "100%",
    height: "100%",
    margin: "0",
    padding: "0",
    overflow: "hidden",
    display: "block",
    visibility: "visible",
    opacity: "1",
    transform: "none",
    scale: "1",
    rotate: "none",
    translate: "none",
    filter: "none",
    "clip-path": "none",
    mask: "none",
    "-webkit-mask": "none",
    "pointer-events": "none",
    "z-index": String(config.zIndex),
    "background-image": `url(${data})`,
    "background-repeat": "repeat",
    "background-size": `${w}px ${h}px`,
    "background-position": "0 0",
    // 打印时保留背景图（水印随页面内容一起打印）
    "print-color-adjust": "exact",
    "-webkit-print-color-adjust": "exact"
  };
  for (const [key, value] of Object.entries(styles)) {
    container.style.setProperty(key, value, "important");
  }

  document.body.appendChild(container);
  // 挂接防删除监听（重建后重新观察，并快照受保护样式）
  watchGlobalWatermark(container);
};

// 创建局部水印
/** 局部水印登记表：主题切换时按 darkColor 重绘（已断开连接的元素顺手清理） */
const localWatermarks = new Map<HTMLElement, WatermarkRuntimeConfig>();

/** 主题切换后重绘全部仍挂在文档里的局部水印 */
function redrawLocalWatermarks(): void {
  localWatermarks.forEach((config, el) => {
    if (!el.isConnected) {
      localWatermarks.delete(el);
      return;
    }
    createLocalWatermark(el, config);
  });
}

const createLocalWatermark = (el: HTMLElement, config: WatermarkRuntimeConfig) => {
  // 清理旧水印样式
  el.style.backgroundImage = "";
  el.style.backgroundSize = "";

  // 暗色主题优先用 imageDark / darkColor（与全局水印同规则）
  const dark = document.documentElement.classList.contains("dark");
  const imageUrl = (dark && config.imageDark ? config.imageDark : config.image) || "";
  const image = imageUrl ? ensureImage(imageUrl, () => createLocalWatermark(el, config)) : null;
  let tile: { data: string; w: number; h: number };
  if (image) {
    tile = generateImageWatermarkCanvas(
      image,
      config.imageWidth ?? 120,
      config.alpha,
      config.rotate,
      config.gapX,
      config.gapY
    );
  } else {
    // 应用新水印（与全局同款瓦片算法；透传旋转角度与间距）
    const lines: string[] = Array.isArray(config.text)
      ? config.text.filter((s): s is string => Boolean(s))
      : [config.text].filter((s): s is string => Boolean(s));
    const textColor = dark && config.darkColor ? config.darkColor : config.textColor;
    tile = generateWatermarkCanvas(
      lines.length ? lines : [defaultConfig.text],
      resolveFont(config),
      textColor,
      config.rotate,
      config.gapX,
      config.gapY
    );
  }
  el.style.backgroundImage = `url(${tile.data})`;
  el.style.backgroundRepeat = "repeat";
  el.style.backgroundSize = `${tile.w}px ${tile.h}px`;
  el.style.zIndex = String(config.zIndex);
  // 登记供主题切换重绘（Map 去重：同一元素 mounted/updated 只保留最新配置）
  localWatermarks.set(el, config);
};

// 水印指令
const waterMarker: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const global = readGlobalWatermarkConfig();
    const config = {
      ...defaultConfig,
      ...global,
      ...(binding.value || {})
    } as WatermarkRuntimeConfig;

    // 全局水印开关关闭时不渲染
    if (config.isGlobal && config.enable === false) {
      return;
    }

    if (config.isGlobal) {
      createGlobalWatermark(config);
    } else {
      createLocalWatermark(el, config);
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const global = readGlobalWatermarkConfig();
    const config = {
      ...defaultConfig,
      ...global,
      ...(binding.value || {})
    } as WatermarkRuntimeConfig;

    if (config.isGlobal && config.enable === false) {
      return;
    }

    if (config.isGlobal) {
      createGlobalWatermark(config);
    } else {
      createLocalWatermark(el, config);
    }
  },
  unmounted(el: HTMLElement) {
    // 仅清理局部水印样式与登记表
    localWatermarks.delete(el);
    el.style.backgroundImage = "";
    el.style.backgroundRepeat = "";
    el.style.backgroundSize = "";
    el.style.zIndex = "";
    // 仅当全局水印已关闭（无容器可保护）时才拆防；
    // 全局水印开启时任何局部指令卸载都不得拆除全局防护
    if (!isWatermarkEnabled()) {
      unwatchGlobalWatermark();
    }
  }
};

export default waterMarker;
