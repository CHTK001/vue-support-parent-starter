/**
 * 会话管理服务
 * 实现会话超时检测和自动登出功能
 * @author CH
 * @version 1.0.0
 * @since 2024-12-05
 */

import { getConfig } from "@repo/config";
import { storageLocal } from "@pureadmin/utils";

/** 会话配置接口 */
interface SessionConfig {
  /** 会话超时时间（秒），0表示不超时 */
  timeout?: number;
  /** 超时前提醒时间（秒） */
  warningTime?: number;
  /** 超时自动登出 */
  autoLogout?: boolean;
  /** 是否启用 */
  enable?: boolean;
}

/** 会话管理器类 */
class SessionManager {
  /** 最后活动时间 */
  private lastActivityTime: number = Date.now();
  /** 定时器ID */
  private timerId: ReturnType<typeof setInterval> | null = null;
  /** 警告定时器ID */
  private warningTimerId: ReturnType<typeof setTimeout> | null = null;
  /** 活动事件处理函数引用（用于正确解绑） */
  private activityHandler: (() => void) | null = null;
  /** 是否已显示警告 */
  private warningShown: boolean = false;
  /** 登出回调 */
  private logoutCallback: (() => void) | null = null;
  /** 警告回调 */
  private warningCallback: ((remainingTime: number) => void) | null = null;
  /** 配置 */
  private config: SessionConfig = {
    enable: false,
    timeout: 0,
    warningTime: 60,
    autoLogout: false,
  };

  /**
   * 初始化会话管理器
   * @param logoutCallback 登出回调函数
   * @param warningCallback 警告回调函数
   */
  init(
    logoutCallback?: () => void,
    warningCallback?: (remainingTime: number) => void
  ): void {
    // 重新初始化前先清理，避免重复绑定事件和定时器泄漏
    this.stop();

    const globalConfig = getConfig();
    const localConfigure = storageLocal().getItem<any>("responsive-configure");
    const localTimeout = Number(localConfigure?.sessionTimeout);
    const localAutoLogout = localConfigure?.autoLogout;

    const localOverride: SessionConfig = {};
    if (Number.isFinite(localTimeout) && localTimeout >= 0) {
      localOverride.timeout = localTimeout;
    }
    if (typeof localAutoLogout === "boolean") {
      localOverride.autoLogout = localAutoLogout;
    }

    this.config = {
      ...this.config,
      ...globalConfig?.Session,
      ...localOverride,
    };

    // 如果未启用或超时时间为0，则不启动
    if (!this.config.enable || !this.config.timeout) {
      return;
    }

    this.logoutCallback = logoutCallback || null;
    this.warningCallback = warningCallback || null;
    this.lastActivityTime = Date.now();
    this.warningShown = false;

    // 监听用户活动事件
    this.bindActivityEvents();

    // 启动检查定时器
    this.startTimer();
  }

  /** 绑定用户活动事件 */
  private bindActivityEvents(): void {
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    if (!this.activityHandler) {
      this.activityHandler = this.handleActivity.bind(this);
    }
    events.forEach((event) => {
      document.addEventListener(event, this.activityHandler!, {
        passive: true,
      });
    });
  }

  /** 解绑用户活动事件 */
  private unbindActivityEvents(): void {
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    if (!this.activityHandler) {
      return;
    }
    events.forEach((event) => {
      document.removeEventListener(event, this.activityHandler!);
    });
    this.activityHandler = null;
  }

  /** 处理用户活动 */
  private handleActivity(): void {
    this.lastActivityTime = Date.now();
    this.warningShown = false;

    // 清除警告定时器
    if (this.warningTimerId) {
      clearTimeout(this.warningTimerId);
      this.warningTimerId = null;
    }
  }

  /** 启动定时器 */
  private startTimer(): void {
    // 每秒检查一次
    this.timerId = setInterval(() => {
      this.checkSession();
    }, 1000);
  }

  /** 检查会话状态 */
  private checkSession(): void {
    const now = Date.now();
    const elapsed = (now - this.lastActivityTime) / 1000;
    const timeout = this.config.timeout || 0;
    const warningTime = this.config.warningTime || 60;

    // 检查是否需要显示警告
    if (
      !this.warningShown &&
      elapsed >= timeout - warningTime &&
      elapsed < timeout
    ) {
      this.warningShown = true;
      const remainingTime = Math.ceil(timeout - elapsed);
      this.warningCallback?.(remainingTime);
    }

    // 检查是否超时
    if (elapsed >= timeout && this.config.autoLogout) {
      this.handleTimeout();
    }
  }

  /** 处理超时 */
  private handleTimeout(): void {
    this.stop();
    this.logoutCallback?.();
  }

  /** 停止会话管理器 */
  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.warningTimerId) {
      clearTimeout(this.warningTimerId);
      this.warningTimerId = null;
    }
    this.unbindActivityEvents();
  }

  /** 重置会话 */
  reset(): void {
    this.lastActivityTime = Date.now();
    this.warningShown = false;
  }

  /** 获取剩余时间（秒） */
  getRemainingTime(): number {
    const timeout = this.config.timeout || 0;
    if (!timeout) return Infinity;
    const elapsed = (Date.now() - this.lastActivityTime) / 1000;
    return Math.max(0, timeout - elapsed);
  }

  /** 是否已启用 */
  isEnabled(): boolean {
    return this.config.enable || false;
  }

  /** 延长会话 */
  extend(seconds: number = 300): void {
    this.lastActivityTime = Date.now() + seconds * 1000;
    this.warningShown = false;
  }
}

/** 会话管理器单例 */
export const sessionManager = new SessionManager();

/**
 * 初始化会话管理
 * @param logoutCallback 登出回调
 * @param warningCallback 警告回调
 */
export function initSession(
  logoutCallback?: () => void,
  warningCallback?: (remainingTime: number) => void
): void {
  sessionManager.init(logoutCallback, warningCallback);
}

/**
 * 停止会话管理
 */
export function stopSession(): void {
  sessionManager.stop();
}

/**
 * 重置会话
 */
export function resetSession(): void {
  sessionManager.reset();
}

/**
 * 获取剩余会话时间
 */
export function getSessionRemainingTime(): number {
  return sessionManager.getRemainingTime();
}

/**
 * 延长会话时间
 * @param seconds 延长秒数
 */
export function extendSession(seconds?: number): void {
  sessionManager.extend(seconds);
}
