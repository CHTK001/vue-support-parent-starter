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
*/

import type { Directive, DirectiveBinding } from "vue";
import { getConfig } from "@repo/config";

// 全局水印容器ID
const GLOBAL_WATERMARK_ID = "global-watermark-container";

// 默认水印配置
const defaultConfig = {
  text: "ADMIN",
  font: "20px 宋体",
  textColor: "rgba(180, 180, 180, 0.3)",
  zIndex: 9999,
  isGlobal: false, // 默认局部水印
  enable: true, // 全局开关
  rotate: -20 // 水印旋转角度
};

/** 从全局配置读取水印配置（security.Watermark* 或 app.yaml watermark） */
function readGlobalWatermarkConfig(): Partial<typeof defaultConfig> {
  const cfg = (getConfig() as Record<string, any>)?.security ?? {};
  const wm = cfg.watermark ?? {};
  const result: Partial<typeof defaultConfig> = {};
  // 水印开关
  result.enable = wm.enable !== false;
  result.isGlobal = wm.enable === true;
  if (typeof wm.text === "string" && wm.text) result.text = wm.text;
  if (wm.color) result.textColor = wm.color;
  if (typeof wm.alpha === "number") {
    result.textColor = rgbaFromHex(wm.color ?? "#409EFF", wm.alpha);
  }
  if (typeof wm.rotate === "number") {
    result.rotate = wm.rotate;
  }
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

// 生成水印画布
const generateWatermarkCanvas = (
  str: string,
  font: string,
  textColor: string,
  rotate: number = -20
): string => {
  const can: HTMLCanvasElement = document.createElement("canvas");
  can.width = 205;
  can.height = 140;
  can.style.display = "none";
  
  const cans = can.getContext("2d") as CanvasRenderingContext2D;
  cans.rotate((rotate * Math.PI) / 180);
  cans.font = font;
  cans.fillStyle = textColor;
  cans.textAlign = "left";
  cans.fillText(str, can.width / 10, can.height / 2);
  
  return can.toDataURL("image/png");
};

/** 防删除监听：检测水印容器被移除/样式被篡改后自动恢复（不影响业务渲染） */
let restoreObserver: MutationObserver | null = null;

/** 容器创建时的样式快照，被篡改后按此还原 */
let protectedStyleCssText = "";

/** 完整性巡检定时器：兜底 MutationObserver 盲区（CSSOM insertRule、未内联声明的隐藏属性） */
let integrityTimer: ReturnType<typeof setInterval> | null = null;

/** 巡检周期（毫秒）：低频即可，攻击窗口有限且无可感知开销 */
const INTEGRITY_CHECK_INTERVAL = 800;

/** 校验计算样式是否被外部样式压制（样式表注入 / CSSOM insertRule 等），偏离即回写快照或重建 */
function verifyWatermarkIntegrity(): void {
  if (!isWatermarkEnabled()) {
    return;
  }
  const el = document.getElementById(GLOBAL_WATERMARK_ID);
  if (!el || !el.isConnected) {
    // 节点丢失且观察器未捕获（如整棵树被替换）→ 重建
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
      // 样式篡改防御：display:none / opacity:0 / 清空背景等改动立即按快照还原
      if (mutation.type === "attributes") {
        const el = mutation.target as HTMLElement;
        if (
          el.id === GLOBAL_WATERMARK_ID &&
          isWatermarkEnabled() &&
          protectedStyleCssText &&
          el.style.cssText !== protectedStyleCssText
        ) {
          el.style.cssText = protectedStyleCssText;
        }
        continue;
      }
      const removed = Array.from(mutation.removedNodes).some(
        (node) => (node as HTMLElement).id === GLOBAL_WATERMARK_ID
      );
      if (removed && isWatermarkEnabled()) {
        // 被外部删除后自动重建（内部会移除旧容器并重新挂接观察器）
        applyGlobalWatermark();
        return;
      }
    }
  });
  restoreObserver.observe(document.body, { childList: true, subtree: true });
  // 观察容器自身 style 属性（容器每次重建后重新挂接）
  if (container) {
    protectedStyleCssText = container.style.cssText;
    restoreObserver.observe(container, { attributes: true, attributeFilter: ["style"] });
  }
  // 启动低频完整性巡检（兜底 CSSOM 注入等观察器盲区）
  if (integrityTimer === null && typeof setInterval !== "undefined") {
    integrityTimer = setInterval(() => verifyWatermarkIntegrity(), INTEGRITY_CHECK_INTERVAL);
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
  const config = { ...defaultConfig, ...global, isGlobal: true };
  createGlobalWatermark(config);
}

// 创建全局水印
const createGlobalWatermark = (config: any) => {
  // 移除旧水印（可能被攻击者移到任意父级，remove() 从当前位置安全摘除）
  document.getElementById(GLOBAL_WATERMARK_ID)?.remove();
  
  // 创建新水印容器
  const container = document.createElement("div");
  container.id = GLOBAL_WATERMARK_ID;
  
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
    "background-image": `url(${generateWatermarkCanvas(
      config.text,
      config.font,
      config.textColor,
      config.rotate
    )})`,
    "background-repeat": "repeat",
    "background-size": "auto",
    "background-position": "0 0"
  };
  for (const [key, value] of Object.entries(styles)) {
    container.style.setProperty(key, value, "important");
  }

  document.body.appendChild(container);
  // 挂接防删除监听（重建后重新观察，并快照受保护样式）
  watchGlobalWatermark(container);
};

// 创建局部水印
const createLocalWatermark = (el: HTMLElement, config: any) => {
  // 清理旧水印样式
  el.style.backgroundImage = "";
  
  // 应用新水印
  el.style.backgroundImage = `url(${generateWatermarkCanvas(
    config.text,
    config.font,
    config.textColor
  )})`;
  el.style.backgroundRepeat = "repeat";
  el.style.zIndex = config.zIndex;
};

// 水印指令
const waterMarker: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const global = readGlobalWatermarkConfig();
    const config = {
      ...defaultConfig,
      ...global,
      ...(binding.value || {})
    };
    
    // 全局水印开关关闭时不渲染
    if (config.isGlobal && config.enable === false) {
      return;
    }
    
    if (config.isGlobal) {
      createGlobalWatermark(config);
    } else {
      unwatchGlobalWatermark();
      createLocalWatermark(el, config);
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const global = readGlobalWatermarkConfig();
    const config = {
      ...defaultConfig,
      ...global,
      ...(binding.value || {})
    };
    
    if (config.isGlobal && config.enable === false) {
      return;
    }
    
    if (config.isGlobal) {
      createGlobalWatermark(config);
    } else {
      unwatchGlobalWatermark();
      createLocalWatermark(el, config);
    }
  },
  unmounted(el: HTMLElement) {
    // 仅清理局部水印
    el.style.backgroundImage = "";
    el.style.backgroundRepeat = "";
    el.style.zIndex = "";
    // 指令卸载时若不再有全局水印，断开防删除监听
    const global = readGlobalWatermarkConfig();
    if (global.isGlobal || global.enable === false) {
      unwatchGlobalWatermark();
    }
  }
};

export default waterMarker;
