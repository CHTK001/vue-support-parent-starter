/**
 * @repo/app/wechat-miniapp —— 小程序令牌管理
 *
 * <p>只做令牌读写，<b>不做续期</b>：令牌过期由后端返回 401，
 * 框架按 {@code loginPath} 清令牌并回登录页（PC 的 refresh 流程需要
 * OAuth REFRESH 语义与定时器，小程序端用不上，也不该在后台常驻）。</p>
 */
import type { MpStorage, MpTokenConfig, MpTokenManager } from "./types";

/** 小程序的令牌管理器实现 */
class MpTokenManagerImpl implements MpTokenManager {
  constructor(
    private readonly storage: MpStorage,
    private readonly config: MpTokenConfig,
  ) {}

  private get accessKey(): string {
    return this.config.accessTokenKey || "accessToken";
  }

  private get userInfoKey(): string {
    return this.config.userInfoKey || "userInfo";
  }

  getAccessToken(): string {
    return this.storage.get<string>(this.accessKey) ?? "";
  }

  getUserInfo<T = Record<string, unknown>>(): T | null {
    return this.storage.get<T>(this.userInfoKey) ?? null;
  }

  setTokens(accessToken: string): void {
    this.storage.set(this.accessKey, accessToken);
  }

  setUserInfo(userInfo: Record<string, unknown>): void {
    this.storage.set(this.userInfoKey, userInfo);
  }

  clearTokens(): void {
    this.storage.remove(this.accessKey);
    this.storage.remove(this.userInfoKey);
  }
}

/** 创建令牌管理器 */
export function createMpTokenManager(storage: MpStorage, config: MpTokenConfig = {}): MpTokenManager {
  return new MpTokenManagerImpl(storage, config);
}
