/**
 * 令牌工具 —— 管理 accessToken / refreshToken / userInfo 存储与定时刷新
 *
 * 用法：
 *   const token = createTokenManager(storage, config.token);
 *   token.start();      // 开启定时刷新
 *   token.stop();       // 停止定时刷新
 *   token.refresh();    // 手动立即刷新
 *   token.getAccessToken() / token.getRefreshToken() / token.getUserInfo()
 */
import type { StorageWrapper } from "@repo/utils";
import { getConfig } from "@repo/config";
import type { TokenConfig } from "@repo/config";
import { http } from "./api";
import { createSingleFlight } from "./single-flight";
import { isStaleEpoch, sessionEpoch } from "./session-scope";

/**
 * 刷新令牌升级类型（对应后端 x-oauth-upgrade-type）
 * - REFRESH   ：仅换取新 token（accessToken / refreshToken）
 * - VERSION   ：刷新用户信息（账号信息可能变更，需重新写入 userInfo）
 * - TIMESTAMP ：续期（重置过期时间，返回用户信息）
 */
export type TokenUpgradeType = "REFRESH" | "VERSION" | "TIMESTAMP";

/** 刷新响应结构（兼容后端 LoginResult 字段） */
interface RefreshResult {
  accessToken?: string;
  refreshToken?: string;
  userInfo?: Record<string, unknown>;
  userResume?: Record<string, unknown>;
}

/** 令牌管理器 */
export class TokenManager {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly storage: StorageWrapper,
    private readonly config: TokenConfig,
  ) {}

  /** accessToken 存储 key（带命名空间，由 storage 自动处理） */
  private get accessKey(): string {
    return this.config.accessTokenKey || "accessToken";
  }

  /** refreshToken 存储 key */
  private get refreshKey(): string {
    return this.config.refreshTokenKey || "refreshToken";
  }

  /** userInfo 存储 key */
  private get userInfoKey(): string {
    return this.config.userInfoKey || "userInfo";
  }

  /** 获取 accessToken */
  getAccessToken(): string {
    return this.storage.get<string>(this.accessKey) ?? "";
  }

  /** 获取 refreshToken */
  getRefreshToken(): string {
    return this.storage.get<string>(this.refreshKey) ?? "";
  }

  /** 获取用户信息 */
  getUserInfo<T = Record<string, unknown>>(): T | null {
    return this.storage.get<T>(this.userInfoKey);
  }

  /** 写入令牌对 */
  setTokens(accessToken: string, refreshToken?: string): void {
    this.storage.set(this.accessKey, accessToken);
    if (refreshToken !== undefined) {
      this.storage.set(this.refreshKey, refreshToken);
    }
  }

  /** 写入用户信息（登录 / 刷新用户信息 / /me 后调用） */
  setUserInfo(userInfo: Record<string, unknown>): void {
    this.storage.set(this.userInfoKey, userInfo);
  }

  /** 清除令牌与用户信息 */
  clearTokens(): void {
    this.storage.remove(this.accessKey);
    this.storage.remove(this.refreshKey);
    this.storage.remove(this.userInfoKey);
  }

  /**
   * 手动立即刷新 token（需配置 refresh 开启且 url.refreshToken 非空）
   *
   * 支持三种升级形式（x-oauth-upgrade-type）：
   * - REFRESH   ：换取新 token，写回 accessToken / refreshToken
   * - VERSION   ：刷新用户信息，返回的 userInfo / userResume 写回 storage
   * - TIMESTAMP ：续期，返回的用户信息同样写回
   *
   * @param upgradeType 升级类型，默认 REFRESH
   */
  async refresh(upgradeType: TokenUpgradeType = "REFRESH"): Promise<boolean> {
    return this.refreshFlight(upgradeType);
  }

  /**
   * single-flight 包装：同类型已有刷新在途时直接复用其结果，不重复打后端。
   *
   * <p>刻意做成独立的私有字段（而非写在 {@link refresh} 内联），是为了让
   * 「去重」这一层与「刷新」这一层各自可读；去重语义本身见
   * {@link ../../core/single-flight 单飞工具}。</p>
   */
  private refreshFlight: (type: TokenUpgradeType) => Promise<boolean> = createSingleFlight(
    (type: TokenUpgradeType) => this.doRefresh(type),
  );

  /** 真正发起刷新请求（由 {@link refresh} 做 single-flight 包装后调用） */
  private async doRefresh(upgradeType: TokenUpgradeType): Promise<boolean> {
    const { refresh } = this.config;
    const refreshUrl = getConfig().url.refreshToken;
    if (!refresh || !refreshUrl) return false;
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    // 记下发起时的会话世代：登出若发生在请求飞行途中，响应必须被丢弃
    const stampedEpoch = sessionEpoch();
    try {
      const { data } = await http().post(refreshUrl).headers({
        "x-oauth-upgrade-type": upgradeType,
      }).data({ refreshToken }) as {
        data: {
          data?: RefreshResult;
          accessToken?: string;
          refreshToken?: string;
          userInfo?: Record<string, unknown>;
          userResume?: Record<string, unknown>;
        };
      };
      // <b>登出期间到达的刷新响应：一律丢弃</b>。
      // 不加这一句，用户点「退出登录」后页面仍是登录态（令牌被复活），
      // refreshToken 也一并回来了，等于永远登出不掉 —— 因为
      // clearAllAuthData() 早已在登出流程里跑完，而这里又把令牌写了回去。
      if (isStaleEpoch(stampedEpoch)) {
        return false;
      }
      const result = data.data ?? data;
      const accessToken = result.accessToken;
      const newRefreshToken = result.refreshToken;
      // REFRESH 形式：写回新的令牌对
      if (accessToken) {
        this.setTokens(accessToken, newRefreshToken);
      }
      // VERSION / TIMESTAMP 形式（或响应附带用户信息）：写回 userInfo
      const userInfo = (result.userInfo ?? result.userResume) as
        | Record<string, unknown>
        | undefined;
      if (userInfo && Object.keys(userInfo).length > 0) {
        this.setUserInfo(userInfo);
      }
      return Boolean(accessToken || userInfo);
    } catch {
      return false;
    }
  }

  /** 开启定时刷新（未开启 refresh/autoRefresh 或未配置 url.refreshToken 时不启动） */
  start(): void {
    if (!this.config.refresh || !this.config.autoRefresh || !getConfig().url.refreshToken) return;
    const interval = Math.max(this.config.refreshInterval, 60000);
    this.timer = setInterval(() => {
      void this.refresh();
    }, interval);
  }

  /** 停止定时刷新 */
  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/** 创建令牌管理器（自动读取 config.token 配置） */
export function createTokenManager(
  storage: StorageWrapper,
  config: TokenConfig,
): TokenManager {
  return new TokenManager(storage, config);
}
