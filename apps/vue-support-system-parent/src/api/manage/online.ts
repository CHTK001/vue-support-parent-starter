import { http } from "@repo/utils";

/**
 * 在线用户信息
 */
export interface OnlineUser {
  userId: string;
  username: string;
  nickname: string;
  loginIp: string;
  loginAddress: string;
  browser: string;
  os: string;
  loginType: string;
  token: string;
  loginTime: string;
}

/**
 * 获取在线用户列表
 * @param params 查询参数
 */
export const fetchOnlineUsers = (params?: { username?: string; ip?: string }) => {
  return http.request<{ data: OnlineUser[] }>("get", "/v2/online/list", { params });
};

/**
 * 获取在线用户数量
 */
export const fetchOnlineCount = () => {
  return http.request<{ data: number }>("get", "/v2/online/count");
};

/**
 * 获取用户在线状态
 * @param userId 用户ID
 */
export const fetchOnlineStatus = (userId: string) => {
  return http.request<{ data: { online: boolean; lastActiveTime?: number } }>("get", `/v2/online/status/${userId}`);
};

/**
 * 强制下线用户
 * @param userId 用户ID
 */
export const fetchKickUser = (userId: string) => {
  return http.request<{ data: boolean }>("delete", `/v2/online/kick/${userId}`);
};

/**
 * 批量强制下线用户
 * @param userIds 用户ID列表
 */
export const fetchKickUsers = (userIds: string[]) => {
  return http.request<{ data: number }>("delete", "/v2/online/kick/batch", { data: userIds });
};
