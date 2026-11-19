import { http } from "./http";

/** 登录响应（与 PC 端 LoginResponse 契约一致） */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: {
    id: string;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    isActive?: boolean;
  };
}

/** 账号密码登录（POST /v2/auth/login），与 PC 端同一接口、同一账号体系 */
export function login(username: string, password: string): Promise<LoginResponse> {
  return http.postNoAuth<LoginResponse>("/auth/login", { username, password });
}
