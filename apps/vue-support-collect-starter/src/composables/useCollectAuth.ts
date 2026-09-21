/**
 * 采集控制台登录态。
 *
 * 采集模块用自己的 Servlet 会话（JSESSIONID）鉴权，与平台 token 体系无关：
 * - 免鉴权入口只有 /collect-console/auth/**，其余 /v2/collect/** 未登录一律 HTTP 401；
 * - 合并进来的调度作业接口 /job-console/api/** 受同一套会话保护，登录一次两侧通用；
 * - 登录失败是 HTTP 200 + 业务码，成败只能看返回体，不能看状态码；
 * - 会话过期由接口层回调触发 needLogin，页面不各自处理跳转。
 *
 * 用模块级单例而非 pinia：状态只服务于本应用的鉴权门，无需持久化与跨应用共享。
 */
import { reactive, computed } from "vue";
import { onUnauthorized } from "../api/http";
import { authLogin, authLogout, authStatus } from "../api/collectApi";
import type { CollectAuthStatus } from "../types/collect";

interface CollectAuthState {
  /** 首次状态查询已完成 */
  ready: boolean;
  /** 后端是否开启鉴权（plugin.collect.console.auth-enabled） */
  authEnabled: boolean;
  /** 当前会话是否可用；鉴权关闭时后端恒返回 true */
  authenticated: boolean;
  username: string | null;
  /** 需要登录：AuthGate 据此弹全屏登录卡 */
  needLogin: boolean;
  /** 登录成功次数，页面 watch 它重新拉数据 */
  epoch: number;
}

export const state = reactive<CollectAuthState>({
  ready: false,
  authEnabled: true,
  authenticated: false,
  username: null,
  needLogin: false,
  epoch: 0,
});

function apply(status: CollectAuthStatus): void {
  state.authEnabled = status.authEnabled === true;
  state.authenticated = status.authenticated === true;
  state.username = status.username ?? null;
  state.needLogin = state.authEnabled && !state.authenticated;
  state.ready = true;
}

let bootstrapPromise: Promise<void> | null = null;

/**
 * 拉取一次登录态（幂等：并发调用共享同一结果）。
 *
 * 状态查询失败不阻断页面——后端可能是未启用鉴权的旧版本，
 * 此时后续接口调用会各自报错，至少界面可用。
 */
export function bootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = authStatus()
      .then(apply)
      .catch(() => {
        state.ready = true;
      });
  }
  return bootstrapPromise;
}

/** 重新拉取登录态（登录/登出后调用） */
export function refresh(): Promise<void> {
  bootstrapPromise = null;
  return bootstrap();
}

/** 控制台登录；成功后自增 epoch 供各页面重载 */
export async function login(username: string, password: string): Promise<void> {
  const status = await authLogin(username, password);
  apply(status);
  if (!state.authenticated) {
    state.needLogin = true;
    throw new Error("登录未生效，请检查账号密码");
  }
  state.epoch += 1;
}

/** 退出登录并重新唤起登录卡 */
export async function logout(): Promise<void> {
  await authLogout();
  state.authenticated = false;
  state.username = null;
  state.needLogin = state.authEnabled;
  bootstrapPromise = Promise.resolve();
}

/** 任意接口返回 401 时唤起登录，不刷新页面 */
onUnauthorized(() => {
  state.authenticated = false;
  state.needLogin = true;
});

/** 鉴权状态只读视图 */
export function useCollectAuth() {
  return {
    state,
    authenticated: computed(() => state.authenticated),
    needLogin: computed(() => state.needLogin),
    username: computed(() => state.username ?? "未登录"),
    bootstrap,
    refresh,
    login,
    logout,
  };
}
