/**
 * 强制登录兜底弹窗服务（@repo/theme/koi）
 *
 * 在登录认证形态为 dialog 时，401/403 不跳转到登录页，而是在当前应用内弹出一个
 * 包含了 ReLoginForm 的 ReDialog（koi 主题），登录成功后自行关闭弹窗并把控制权
 * 交回核心，由核心刷新页面或重新发起刚才失败的请求。
 *
 * 核心 @repo/core 不许直接依赖 @repo/ui（自身没有该依赖），而是通过 window 上
 * 的全局句柄调用：
 *   window.__reForcedLogin.show({ onLogin, onClose })
 *
 * 注册时机：installKoi（app 上已将 ReDialog 注册为全局组件之后）。
 */
import type { App, VNode } from "vue";
import { createVNode, render } from "vue";
import ReForcedLoginHost from "./forcedLogin/ReForcedLogin.vue";

/** 调用方传给弹窗的回调（登录成功 / 关闭解锁） */
export interface ForcedLoginCallbacks {
  /** 登录成功（ReLoginForm 已完成登录，弹窗已关闭）：核心收回控制权并刷新 */
  onLogin?: () => void;
  /** 弹窗关闭（未登录） */
  onClose?: () => void;
}

/** 强制登录兜底弹窗服务 */
export interface ForcedLoginService {
  /** 打开强制登录弹窗（并行 401/403 只弹一个） */
  show(callbacks?: ForcedLoginCallbacks): void;
}

/** 窗口级登录锁（一条窗口内同时只有一个强制登录弹窗在展示） */
let lockOpen = false;

/** 当前展示的强制登录弹窗宿主（关闭时用来销毁挂载点） */
let host: { vnode: VNode; container: HTMLElement } | null = null;

/** 重置宿主状态（弹窗关闭时调用） */
function resetHost(): void {
  lockOpen = false;
  host = null;
  // 核心侧用这个标记判断弹窗是否还开着；不清掉的话，下一轮 401/403 的
  // 弹窗分支就会被它挡在外面——弹窗没关、锁不释放、核心永远进不去。
  if (typeof window !== "undefined") window.__reForcedLoginOpen = false;
}

/** 窗口存在标志（避免 SSR / 非浏览器运行时重复创建代入宿） */
const fallbackService: ForcedLoginService = {
  show: () => {
    /* 窗口不存在：无法弹窗，交由核心回退到 confirm/redirect 逻辑 */
  },
};

/**
 * 把强制登录弹窗服务注册到 window 上（key 与 `win.__reIcon` 同风格）
 *
 * @param app 主题的安装器传入的应用实例（提供 appContext 供弹窗共享 pinia/i18n/router）
 * @returns 当前窗口的强制登录服务（已经存在则不变）
 */
export function installForcedLogin(app: App): ForcedLoginService {
  const win = typeof window !== "undefined" ? window : undefined;
  if (!win) {
    // 无 window 环境：核心侧取不到句柄会回退到 confirm/redirect 逻辑
    return fallbackService;
  }
  if (win.__reForcedLogin) return win.__reForcedLogin;

  const ctx = (app as { _context?: unknown })._context;

  const service: ForcedLoginService = {
    show(callbacks = {}) {
      // 层：并行请求同时 401/403 时只弹一个强制登录弹窗
      if (lockOpen) return;
      lockOpen = true;
      win.__reForcedLoginOpen = true;

      // 先把上一次的宿主关掉（理论不会发生：锁住了）
      if (host) {
        try {
          render(null, host.container);
        } catch {
          /* ignore */
        }
        host = null;
      }

      const container = document.createElement("div");
      container.setAttribute("data-forced-login-host", "");
      document.body.appendChild(container);

      const vnode = createVNode(
        ReForcedLoginHost,
        {
          onLogin: () => {
            callbacks.onLogin?.();
            resetHost();
          },
          onClose: () => {
            callbacks.onClose?.();
            resetHost();
          },
        },
      );
      // 共享主 app 的 context（pinia/i18n/router/全局组件）
      vnode.appContext = (ctx as never);
      render(vnode, container);
      host = { vnode, container };
    },
  };

  win.__reForcedLogin = service;
  return service;
}

/** 松开强制登录弹窗的锁（核心登录成功 / 弹窗关闭后调用） */
export function unlockForcedLogin(): void {
  lockOpen = false;
  if (typeof window !== "undefined") window.__reForcedLoginOpen = false;
}
