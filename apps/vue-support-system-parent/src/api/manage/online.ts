import { formatToken, getConfig, getToken } from "@repo/config";
import { http, type ReturnResult } from "@repo/utils";

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

const resolveApiUrl = (path: string, params?: Record<string, string>) => {
  const config = getConfig();
  const baseUrl = config.ApiAddress || config.BaseUrl || "";
  const url = new URL(`${baseUrl}${path}`, window.location.origin);

  if (config.apiVersion) {
    url.searchParams.set("version", config.apiVersion);
  }

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

const buildAuthHeaders = (extraHeaders?: Record<string, string>) => {
  const tokenInfo = getToken();
  const accessToken = tokenInfo?.accessToken;

  return {
    Accept: "application/json, text/plain, */*",
    ...(accessToken
      ? {
          Authorization: formatToken(accessToken),
          "x-oauth-token": accessToken,
        }
      : {}),
    ...extraHeaders,
  };
};

const unwrapPayload = <T>(payload: any): ReturnResult<T> => {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  const code = payload?.code ?? 200;
  const success =
    typeof payload?.success === "boolean"
      ? payload.success
      : code === "00000" || code === 200;
  return {
    code,
    msg: payload?.msg ?? payload?.message ?? "",
    message: payload?.msg ?? payload?.message ?? "",
    success,
    data,
    headers: payload?.headers,
  };
};

const requestJson = async <T>(
  method: "GET" | "DELETE",
  path: string,
  options?: {
    params?: Record<string, string | undefined>;
    body?: unknown;
  },
) => {
  const response = await fetch(resolveApiUrl(path, options?.params as any), {
    method,
    headers: buildAuthHeaders(
      options?.body
        ? {
            "Content-Type": "application/json; charset=UTF-8",
          }
        : undefined,
    ),
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json();
  const result = unwrapPayload<T>(payload);
  if (!response.ok || (result.code !== "00000" && result.code !== 200)) {
    throw result;
  }
  return result;
};

/**
 * 获取在线用户列表
 * @param params 查询参数
 */
export const fetchOnlineUsers = (params?: {
  username?: string;
  ip?: string;
}) => {
  return requestJson<OnlineUser[]>("GET", "/v2/online/list", {
    params,
  }).catch(() =>
    http.request<{ data: OnlineUser[] }>("get", "/v2/online/list", {
      params,
    }),
  );
};

/**
 * 获取在线用户数量
 */
export const fetchOnlineCount = () => {
  return requestJson<number>("GET", "/v2/online/count").catch(() =>
    http.request<{ data: number }>("get", "/v2/online/count"),
  );
};

/**
 * 获取用户在线状态
 * @param userId 用户ID
 */
export const fetchOnlineStatus = (userId: string) => {
  return requestJson<{ online: boolean; lastActiveTime?: number }>(
    "GET",
    `/v2/online/status/${userId}`,
  ).catch(() =>
    http.request<{ data: { online: boolean; lastActiveTime?: number } }>(
      "get",
      `/v2/online/status/${userId}`,
    ),
  );
};

/**
 * 强制下线用户
 * @param userId 用户ID
 */
export const fetchKickUser = (userId: string) => {
  return requestJson<boolean>("DELETE", `/v2/online/kick/${userId}`).catch(
    () => http.request<{ data: boolean }>("delete", `/v2/online/kick/${userId}`),
  );
};

/**
 * 批量强制下线用户
 * @param userIds 用户ID列表
 */
export const fetchKickUsers = (userIds: string[]) => {
  return requestJson<number>("DELETE", "/v2/online/kick/batch", {
    body: userIds,
  }).catch(() =>
    http.request<{ data: number }>("delete", "/v2/online/kick/batch", {
      data: userIds,
    }),
  );
};
