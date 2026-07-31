/**
 * 令牌工具 —— 管理 accessToken / refreshToken 存储与定时刷新
 *
 * 用法：
 *   const token = createTokenManager(storage, config.token);
 *   token.start();      // 开启定时刷新
 *   token.stop();       // 停止定时刷新
 *   token.refresh();    // 手动立即刷新
 *   token.getAccessToken() / token.getRefreshToken()
 */
import type { StorageWrapper } from "@repo/utils";
import type { TokenConfig } from "@repo/config";

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

  /** 获取 accessToken */
  getAccessToken(): string {
    return this.storage.get<string>(this.accessKey) ?? "";
  }

  /** 获取 refreshToken */
  getRefreshToken(): string {
    return this.storage.get<string>(this.refreshKey) ?? "";
  }

  /** 写入令牌对 */
  setTokens(accessToken: string, refreshToken?: string): void {
    this.storage.set(this.accessKey, accessToken);
    if (refreshToken !== undefined) {
      this.storage.set(this.refreshKey, refreshToken);
    }
  }

  /** 清除令牌 */
  clearTokens(): void {
    this.storage.remove(this.accessKey);
    this.storage.remove(this.refreshKey);
  }

  /** 手动立即刷新 token（需配置 refreshUrl） */
  async refresh(): Promise<boolean> {
    const { refreshUrl } = this.config;
    if (!refreshUrl) return false;
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(refreshUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken) return false;
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
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
