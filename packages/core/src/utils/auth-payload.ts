import type { FlatUserResult, UserInfoVO, UserResult } from "../api/common/user";

export type StoredUserResult = Partial<UserResult> &
  Partial<FlatUserResult> & {
    userInfo?: Partial<UserInfoVO>;
  };

const normalizeString = (value: unknown): string => {
  if (value == null) {
    return "";
  }
  return String(value).trim();
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeString(item))
    .filter((item) => item.length > 0);
};

const mergeUserInfoSource = (data?: StoredUserResult | null) => {
  return {
    ...(data || {}),
    ...(data?.userInfo || {}),
  };
};

/**
 * 统一兼容后端返回的嵌套 userInfo 与历史平铺缓存结构
 */
export function normalizeUserInfoResult(
  data?: StoredUserResult | null,
  fallback?: StoredUserResult | null,
): UserInfoVO {
  const fallbackSource = mergeUserInfoSource(fallback);
  const source = {
    ...fallbackSource,
    ...mergeUserInfoSource(data),
  };

  return {
    sysUserId: source?.sysUserId ?? "",
    sysUserUsername: normalizeString(source?.sysUserUsername),
    sysUserNickname: normalizeString(source?.sysUserNickname),
    sysUserPhone: normalizeString(source?.sysUserPhone),
    sysUserEmail: normalizeString(source?.sysUserEmail),
    avatar: normalizeString(source?.avatar || source?.sysUserAvatar),
    tenantId: normalizeString(source?.tenantId),
    sysUserAvatar: normalizeString(source?.sysUserAvatar || source?.avatar),
    roles: normalizeStringArray(source?.roles),
    perms: normalizeStringArray(source?.perms),
  };
}

/**
 * 统一构造登录态缓存，避免 cookie/localStorage 结构不一致
 */
export function buildStoredUserResult(
  data?: StoredUserResult | null,
  options?: {
    accessToken?: string;
    refreshToken?: string;
    expires?: number;
    isRemembered?: boolean;
    fallback?: StoredUserResult | null;
  },
): StoredUserResult {
  const fallback = options?.fallback || null;
  const userInfo = normalizeUserInfoResult(data, fallback);

  return {
    accessToken:
      normalizeString(options?.accessToken) ||
      normalizeString(data?.accessToken) ||
      normalizeString(fallback?.accessToken),
    refreshToken:
      normalizeString(options?.refreshToken) ||
      normalizeString(data?.refreshToken) ||
      normalizeString(fallback?.refreshToken),
    expires:
      typeof options?.expires === "number"
        ? options.expires
        : (Number(data?.expires ?? fallback?.expires ?? 0) || 0),
    isRemembered:
      options?.isRemembered ??
      data?.isRemembered ??
      fallback?.isRemembered ??
      true,
    userInfo,
    avatar: userInfo.avatar,
    sysUserId: userInfo.sysUserId,
    tenantId: userInfo.tenantId,
    sysUserUsername: userInfo.sysUserUsername,
    sysUserNickname: userInfo.sysUserNickname,
    sysUserPhone: userInfo.sysUserPhone,
    sysUserEmail: userInfo.sysUserEmail,
    sysUserAvatar: userInfo.sysUserAvatar,
    roles: userInfo.roles,
    perms: userInfo.perms,
  };
}
