import { http } from "./http";
import type { UserEntity, LoginResultEntity } from "../entity/user";
import type { ApiResponse } from "../entity/user";

/** 手机号登录 */
export const loginByPhone = (
  phone: string,
  code: string,
): Promise<ApiResponse<LoginResultEntity>> =>
  http.post("/api/mall/auth/login/phone", { phone, code });

/** 微信小程序登录 */
export const loginByWechat = (
  code: string,
): Promise<ApiResponse<LoginResultEntity>> =>
  http.post("/api/mall/auth/login/wechat", { code });

/** 获取当前用户信息 */
export const getUserInfo = (): Promise<ApiResponse<UserEntity>> =>
  http.get("/api/mall/user/me");

/** 更新用户信息 */
export const updateUserInfo = (
  data: Partial<Pick<UserEntity, "nickname" | "avatar" | "gender" | "birthday">>,
): Promise<ApiResponse<UserEntity>> =>
  http.put("/api/mall/user/me", data as Record<string, unknown>);

/** 登出 */
export const logout = (): Promise<ApiResponse<null>> =>
  http.post("/api/mall/auth/logout");

/** 获取短信验证码 */
export const sendSmsCode = (phone: string): Promise<ApiResponse<null>> =>
  http.post("/api/mall/auth/sms", { phone });
