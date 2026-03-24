/**
 * 页面行为管理服务
 * 实现滚动位置记忆、自动刷新、离开确认等功能
 * @author CH
 * @version 1.0.0
 * @since 2024-12-05
 */

import { getConfig } from "@repo/config";

/** 页面行为配置接口 */
interface PageBehaviorConfig {
  /** 记住滚动位置 */
  rememberScroll?: boolean;
  /** 自动刷新间隔（秒），0表示不刷新 */
  autoRefreshInterval?: number;
  /** 离开页面确认 */
  confirmOnLeave?: boolean;
  /** 是否启用 */
  enable?: boolean;
}

/** 滚动位置存储 */
const scrollPositions: Map<string, { x: number; y: number }> = new Map();

/** 自动刷新定时器 */
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

/** 离开确认处理函数 */
let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

/** 页面行为管理器类 */
class PageBehaviorManager {
  /** 配置 */
  private config: PageBehaviorConfig = {
    enable: false,
    rememberScroll: false,
    autoRefreshInterval: 0,
    confirmOnLeave: false,
  };

  /** 刷新回调 */
  private refreshCallback: (() => void) | null = null;

  /**
   * 初始化页面行为管理器
   * @param refreshCallback 刷新回调函数
   */
  init(refreshCallback?: () => void): void {
    const globalConfig = getConfig();
    this.config = {
      ...this.config,
      ...globalConfig?.PageBehavior,
    };

    if (!this.config.enable) {
      return;
    }

    this.refreshCallback = refreshCallback || null;

    // 初始化滚动位置记忆
    if (this.config.rememberScroll) {
      this.initScrollMemory();
    }

    // 初始化自动刷新
    if (
      this.config.autoRefreshInterval &&
      this.config.autoRefreshInterval > 0
    ) {
      this.initAutoRefresh();
    }

    // 初始化离开确认
    if (this.config.confirmOnLeave) {
      this.initConfirmOnLeave();
    }
  }

  /** 初始化滚动位置记忆 */
  private initScrollMemory(): void {
    // 监听滚动事件
    window.addEventListener("scroll", this.handleScroll.bind(this), {
      passive: true,
    });

    // 页面显示时恢复滚动位置
    window.addEventListener("pageshow", this.restoreScroll.bind(this));
  }

  /** 处理滚动事件 */
  private handleScroll(): void {
    const path = window.location.pathname + window.location.hash;
    scrollPositions.set(path, {
      x: window.scrollX,
      y: window.scrollY,
    });
  }

  /** 恢复滚动位置 */
  private restoreScroll(): void {
    const path = window.location.pathname + window.location.hash;
    const position = scrollPositions.get(path);
    if (position) {
      setTimeout(() => {
        window.scrollTo(position.x, position.y);
      }, 100);
    }
  }

  /** 保存当前滚动位置 */
  saveScrollPosition(key?: string): void {
    const path = key || window.location.pathname + window.location.hash;
    scrollPositions.set(path, {
      x: window.scrollX,
      y: window.scrollY,
    });
  }

  /** 恢复指定路径的滚动位置 */
  restoreScrollPosition(key?: string): void {
    const path = key || window.location.pathname + window.location.hash;
    const position = scrollPositions.get(path);
    if (position) {
      window.scrollTo(position.x, position.y);
    }
  }

  /** 初始化自动刷新 */
  private initAutoRefresh(): void {
    const interval = (this.config.autoRefreshInterval || 0) * 1000;
    if (interval > 0) {
      autoRefreshTimer = setInterval(() => {
        this.refreshCallback?.();
      }, interval);
    }
  }

  /** 初始化离开确认 */
  private initConfirmOnLeave(): void {
    beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
  }

  /** 停止页面行为管理器 */
  stop(): void {
    // 停止自动刷新
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }

    // 移除离开确认
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }

    // 移除滚动监听
    window.removeEventListener("scroll", this.handleScroll.bind(this));
    window.removeEventListener("pageshow", this.restoreScroll.bind(this));
  }

  /** 清除滚动位置缓存 */
  clearScrollCache(): void {
    scrollPositions.clear();
  }

  /** 设置自动刷新间隔 */
  setAutoRefreshInterval(seconds: number): void {
    // 停止现有定时器
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }

    // 启动新定时器
    if (seconds > 0) {
      autoRefreshTimer = setInterval(() => {
        this.refreshCallback?.();
      }, seconds * 1000);
    }
  }

  /** 启用离开确认 */
  enableConfirmOnLeave(): void {
    if (!beforeUnloadHandler) {
      this.initConfirmOnLeave();
    }
  }

  /** 禁用离开确认 */
  disableConfirmOnLeave(): void {
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
  }

  /** 是否已启用 */
  isEnabled(): boolean {
    return this.config.enable || false;
  }
}

/** 页面行为管理器单例 */
export const pageBehaviorManager = new PageBehaviorManager();

/**
 * 初始化页面行为管理
 * @param refreshCallback 刷新回调
 */
export function initPageBehavior(refreshCallback?: () => void): void {
  pageBehaviorManager.init(refreshCallback);
}

/**
 * 停止页面行为管理
 */
export function stopPageBehavior(): void {
  pageBehaviorManager.stop();
}

/**
 * 保存滚动位置
 * @param key 可选的路径标识
 */
export function saveScrollPosition(key?: string): void {
  pageBehaviorManager.saveScrollPosition(key);
}

/**
 * 恢复滚动位置
 * @param key 可选的路径标识
 */
export function restoreScrollPosition(key?: string): void {
  pageBehaviorManager.restoreScrollPosition(key);
}
