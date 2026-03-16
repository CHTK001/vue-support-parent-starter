/**
 * 用户行为热力图追踪器
 * 采集点击、滚动、鼠标移动事件，支持本地存储和批量上报
 * @author CH
 * @version 1.0.0
 * @since 2026-03-16
 */

import type { HeatmapConfig } from "@repo/config";

/** 热力图事件类型 */
export type HeatmapEventType = "click" | "mousemove" | "scroll";

/** 单条热力图事件 */
export interface HeatmapEntry {
  /** 事件类型 */
  type: HeatmapEventType;
  /** 视口内 X 坐标（px） */
  x: number;
  /** 视口内 Y 坐标（px） */
  y: number;
  /** 页面路径 */
  path: string;
  /** 时间戳（ms） */
  ts: number;
}

/** 本地存储 key */
const STORAGE_KEY = "__heatmap_entries__";

/** 默认配置 */
const DEFAULTS: Required<HeatmapConfig> = {
  enable: false,
  sampleRate: 1,
  reportUrl: "",
  maxLocalEntries: 1000,
  flushInterval: 5000,
  trackClick: true,
  trackMouseMove: false,
  trackScroll: true,
};

/** 内存缓冲区 */
let buffer: HeatmapEntry[] = [];

/** 上报定时器 */
let flushTimer: ReturnType<typeof setInterval> | null = null;

/** 已注册的事件监听器（用于销毁） */
const listeners: Array<{ type: string; fn: EventListener }> = [];

/** 当前配置 */
let cfg: Required<HeatmapConfig> = { ...DEFAULTS };

/**
 * 采样判断
 */
function shouldSample(): boolean {
  return Math.random() < cfg.sampleRate;
}

/**
 * 追加事件到缓冲区，超出上限时丢弃最旧的
 */
function push(entry: HeatmapEntry): void {
  buffer.push(entry);
  if (buffer.length > cfg.maxLocalEntries) {
    buffer.splice(0, buffer.length - cfg.maxLocalEntries);
  }
}

/**
 * 将缓冲区持久化到 localStorage
 */
function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    // 存储空间不足时静默忽略
  }
}

/**
 * 从 localStorage 恢复历史数据
 */
function restore(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) buffer = JSON.parse(raw) as HeatmapEntry[];
  } catch {
    buffer = [];
  }
}

/**
 * 上报并清空缓冲区
 */
async function flush(): Promise<void> {
  if (!buffer.length) return;
  persist();
  if (!cfg.reportUrl) return;

  const payload = [...buffer];
  try {
    await fetch(cfg.reportUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    // 上报成功后清空
    buffer = [];
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 上报失败保留本地数据，下次重试
  }
}

/**
 * 注册事件监听
 */
function addListener(type: string, fn: EventListener, options?: AddEventListenerOptions): void {
  window.addEventListener(type, fn, options);
  listeners.push({ type, fn });
}

/**
 * 初始化热力图追踪器
 * @param config 热力图配置（来自 PlatformConfigs.Heatmap）
 */
export function initHeatmap(config: HeatmapConfig = {}): void {
  cfg = { ...DEFAULTS, ...config };
  if (!cfg.enable) return;

  restore();

  // 点击追踪
  if (cfg.trackClick) {
    addListener("click", (e) => {
      if (!shouldSample()) return;
      const me = e as MouseEvent;
      push({ type: "click", x: me.clientX, y: me.clientY, path: location.pathname, ts: Date.now() });
    });
  }

  // 鼠标移动追踪（节流 100ms）
  if (cfg.trackMouseMove) {
    let lastMove = 0;
    addListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastMove < 100) return;
      lastMove = now;
      if (!shouldSample()) return;
      const me = e as MouseEvent;
      push({ type: "mousemove", x: me.clientX, y: me.clientY, path: location.pathname, ts: now });
    });
  }

  // 滚动追踪（节流 200ms）
  if (cfg.trackScroll) {
    let lastScroll = 0;
    addListener("scroll", () => {
      const now = Date.now();
      if (now - lastScroll < 200) return;
      lastScroll = now;
      if (!shouldSample()) return;
      push({ type: "scroll", x: window.scrollX, y: window.scrollY, path: location.pathname, ts: now });
    }, { passive: true });
  }

  // 定时上报
  flushTimer = setInterval(flush, cfg.flushInterval);

  // 页面卸载前上报
  addListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

/**
 * 销毁热力图追踪器，移除所有监听器
 */
export function destroyHeatmap(): void {
  listeners.forEach(({ type, fn }) => window.removeEventListener(type, fn));
  listeners.length = 0;
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  persist();
}

/**
 * 获取当前缓冲区中的所有事件（只读副本）
 */
export function getHeatmapEntries(): HeatmapEntry[] {
  return [...buffer];
}

/**
 * 手动触发上报
 */
export function flushHeatmap(): Promise<void> {
  return flush();
}
