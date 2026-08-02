/*
  需求：给整个页面添加背景水印。

  思路：
    1、使用 canvas 特性生成 base64 格式的图片文件，设置其字体大小，颜色等。
    2、将其设置为背景图片，从而实现页面或组件水印效果
  
  使用：设置水印文案，颜色，字体大小即可
  <!-- 全局水印 - 整个页面（不传 config 时自动读取全局 Watermark 配置） -->
  <div v-waterMarker="{
    text: 'KOI-ADMIN', 
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
  text: "KOI-ADMIN",
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

/** 防删除监听：检测水印容器被移除后自动重建（只观察 childList，不影响业务渲染） */
let restoreObserver: MutationObserver | null = null;

/** 当前水印是否启用（用于恢复时二次判断） */
function isWatermarkEnabled(): boolean {
  return readGlobalWatermarkConfig().enable !== false;
}

/** 挂接防删除监听：水印节点被移除/替换时自动重建 */
function watchGlobalWatermark(): void {
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
}

/** 断开防删除监听（水印关闭 / 应用销毁时调用） */
function unwatchGlobalWatermark(): void {
  if (restoreObserver) {
    restoreObserver.disconnect();
    restoreObserver = null;
  }
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
    if (oldWatermark) {
      document.body.removeChild(oldWatermark);
    }
    return;
  }
  const config = { ...defaultConfig, ...global, isGlobal: true };
  createGlobalWatermark(config);
}

// 创建全局水印
const createGlobalWatermark = (config: any) => {
  // 移除旧水印
  const oldWatermark = document.getElementById(GLOBAL_WATERMARK_ID);
  if (oldWatermark) document.body.removeChild(oldWatermark);
  
  // 创建新水印容器
  const container = document.createElement("div");
  container.id = GLOBAL_WATERMARK_ID;
  
  // 设置全局水印样式
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: config.zIndex,
    backgroundImage: `url(${generateWatermarkCanvas(
      config.text,
      config.font,
      config.textColor,
      config.rotate
    )})`,
    backgroundRepeat: "repeat",
    opacity: "1"
  });
  
  document.body.appendChild(container);
  // 挂接防删除监听（重建后重新观察）
  watchGlobalWatermark();
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
