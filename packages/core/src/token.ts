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
import type { TokenConfig } from "@repo/config";

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
   * 手动立即刷新 token（需配置 refreshUrl）
   *
   * 支持三种升级形式（x-oauth-upgrade-type）：
   * - REFRESH   ：换取新 token，写回 accessToken / refreshToken
   * - VERSION   ：刷新用户信息，返回的 userInfo / userResume 写回 storage
   * - TIMESTAMP ：续期，返回的用户信息同样写回
   *
   * @param upgradeType 升级类型，默认 REFRESH
   */
  async refresh(upgradeType: TokenUpgradeType = "REFRESH"): Promise<boolean> {
    const { refreshUrl } = this.config;
    if (!refreshUrl) return false;
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-oauth-upgrade-type": upgradeType,
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        data?: RefreshResult;
        accessToken?: string;
        refreshToken?: string;
        userInfo?: Record<string, unknown>;
        userResume?: Record<string, unknown>;
      };
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

  /** 开启定时刷新（未开启 autoRefresh 或未配置 refreshUrl 时不启动） */
  start(): void {
    this.stop();
    if (!this.config.autoRefresh || !this.config.refreshUrl) return;
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
