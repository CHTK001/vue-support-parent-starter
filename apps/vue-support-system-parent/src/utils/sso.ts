import type { UserResult } from "@repo/core";
import { removeToken, setToken } from "@repo/core";
import { subBefore, getQueryMap } from "@pureadmin/utils";

const STATIC_AUTH_KEYS = new Set([
  "username",
  "sysUserUsername",
  "nickname",
  "sysUserNickname",
  "roles",
  "perms",
  "accessToken",
  "refreshToken",
  "expires",
  "tenantId",
  "avatar",
  "sysUserAvatar",
  "email",
  "sysUserEmail",
  "phone",
  "sysUserPhone",
  "sysUserId",
]);

const DEFAULT_EXPIRE_SECONDS = 12 * 60 * 60;

const decodeParam = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, "%20"));
  } catch (_error) {
    return value;
  }
};

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => decodeParam(String(item).trim()))
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const normalized = decodeParam(value.trim());
  if (!normalized) {
    return [];
  }

  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    try {
      return JSON.parse(normalized)
        .map((item) => String(item).trim())
        .filter(Boolean);
    } catch (_error) {
      // ignore invalid json and fallback to comma split
    }
  }

  return normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const stringifyParam = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((item) => decodeParam(String(item))).join(",");
  }
  if (typeof value === "string") {
    return decodeParam(value);
  }
  return String(value ?? "");
};

const buildStaticLoginPayload = (
  params: Record<string, unknown>,
): UserResult | null => {
  const username = stringifyParam(params.username || params.sysUserUsername);
  const accessToken = stringifyParam(params.accessToken);
  const roles = parseList(params.roles);

  if (!username || !accessToken || roles.length === 0) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresValue = Number(params.expires);
  const expires =
    Number.isFinite(expiresValue) && expiresValue > nowSeconds
      ? expiresValue
      : nowSeconds + DEFAULT_EXPIRE_SECONDS;

  const nickname =
    stringifyParam(params.nickname || params.sysUserNickname) || username;
  const avatar = stringifyParam(params.avatar || params.sysUserAvatar);
  const tenantId = stringifyParam(params.tenantId);
  const email = stringifyParam(params.email || params.sysUserEmail);
  const phone = stringifyParam(params.phone || params.sysUserPhone);
  const sysUserId = stringifyParam(params.sysUserId) || username;
  const perms = parseList(params.perms);

  return {
    accessToken,
    refreshToken:
      stringifyParam(params.refreshToken) || `static-refresh-${username}`,
    expires,
    isRemembered: true,
    userInfo: {
      sysUserId,
      sysUserUsername: username,
      sysUserNickname: nickname,
      sysUserPhone: phone,
      sysUserEmail: email,
      avatar,
      tenantId,
      sysUserAvatar: avatar,
      roles,
      perms,
    },
  };
};

const cleanupStaticAuthParams = (params: Record<string, unknown>) => {
  const nextParams: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (STATIC_AUTH_KEYS.has(key)) {
      return;
    }
    nextParams[key] = value;
  });
  return nextParams;
};

const getStaticAuthParams = (): Record<string, unknown> => {
  const searchParams = new URLSearchParams(location.search);
  if (Array.from(searchParams.keys()).length > 0) {
    return Object.fromEntries(searchParams.entries());
  }

  const hashQueryIndex = location.hash.indexOf("?");
  if (hashQueryIndex >= 0) {
    const hashParams = new URLSearchParams(location.hash.slice(hashQueryIndex + 1));
    return Object.fromEntries(hashParams.entries());
  }

  return getQueryMap(location.href) as Record<string, unknown>;
};

/**
 * 简版前端单点登录，根据实际业务自行编写，平台启动后本地可以跳后面这个链接进行测试 http://localhost:8848/#/permission/page/index?username=sso&roles=admin&accessToken=eyJhbGciOiJIUzUxMiJ9.admin
 * 划重点：
 * 判断是否为单点登录，不为则直接返回不再进行任何逻辑处理，下面是单点登录后的逻辑处理
 * 1.清空本地旧信息；
 * 2.获取url中的重要参数信息，然后通过 setToken 保存在本地；
 * 3.删除不需要显示在 url 的参数
 * 4.使用 window.location.replace 跳转正确页面
 */
(function () {
  // 获取 url 中的参数
  const params = getStaticAuthParams();
  const loginPayload = buildStaticLoginPayload(params);
  if (!loginPayload) {
    return;
  }

  // 清空本地旧信息
  removeToken();

  // 保存新信息到本地
  setToken(loginPayload, { isRemembered: true });

  const nextParams = cleanupStaticAuthParams(params);
  const nextQuery = new URLSearchParams();
  Object.entries(nextParams).forEach(([key, value]) => {
    const normalizedValue = stringifyParam(value);
    if (!normalizedValue) {
      return;
    }
    nextQuery.set(key, normalizedValue);
  });

  const cleanHash = subBefore(location.hash, "?") || "#/home";
  const queryString = nextQuery.toString();
  const newUrl = `${location.origin}${location.pathname}${cleanHash}${queryString ? `?${queryString}` : ""}`;

  // 替换历史记录项
  window.location.replace(newUrl);
})();
