import type {
  FlatUserResult,
  RoleInfoVO,
  UserInfoVO,
  UserResult,
} from "../api/common/user";

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

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return false;
};

const normalizeNumberArray = (value: unknown): Array<number | string> => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === "number") {
        return item;
      }
      const normalized = normalizeString(item);
      if (!normalized) {
        return null;
      }
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? normalized : parsed;
    })
    .filter((item): item is number | string => item !== null);
};

const normalizeRoleInfos = (value: unknown): RoleInfoVO[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const items = value
    .map((item): RoleInfoVO | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const current = item as Record<string, unknown>;
      const roleCode = normalizeString(current.roleCode);
      if (!roleCode) {
        return null;
      }

      return {
        roleCode,
        roleName: normalizeString(current.roleName),
        readable:
          current.readable == null ? undefined : Boolean(current.readable),
        writeable:
          current.writeable == null ? undefined : Boolean(current.writeable),
        executable:
          current.executable == null ? undefined : Boolean(current.executable),
      };
    })
    .filter(Boolean);

  return items as RoleInfoVO[];
};

const mergeUserInfoSource = (data?: StoredUserResult | null) => {
  const current = data as
    | (StoredUserResult & {
        ext?: Record<string, unknown>;
      })
    | null
    | undefined;
  const currentUserInfo = current?.userInfo as
    | (Partial<UserInfoVO> & { ext?: Record<string, unknown> })
    | undefined;

  return {
    ...(current || {}),
    ...(current?.ext || {}),
    ...(currentUserInfo || {}),
    ...(currentUserInfo?.ext || {}),
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
  const mergedSource = mergeUserInfoSource(data) as Record<string, unknown>;
  const source = {
    ...fallbackSource,
    ...mergedSource,
  };
  const roleInfoSource =
    mergedSource.roleInfos ||
    mergedSource.rolesByRole ||
    (fallbackSource as Record<string, unknown>)?.roleInfos ||
    (fallbackSource as Record<string, unknown>)?.rolesByRole;

  return {
    sysUserId: source?.sysUserId ?? "",
    sysUserUsername: normalizeString(source?.sysUserUsername),
    sysUserNickname: normalizeString(source?.sysUserNickname),
    sysUserPhone: normalizeString(source?.sysUserPhone),
    sysUserEmail: normalizeString(source?.sysUserEmail),
    avatar: normalizeString(source?.avatar || source?.sysUserAvatar),
    tenantId: normalizeString(source?.tenantId),
    sysDeptId: source?.sysDeptId ?? "",
    managedDeptIds: normalizeNumberArray(source?.managedDeptIds),
    sysUserAvatar: normalizeString(source?.sysUserAvatar || source?.avatar),
    roleInfos: normalizeRoleInfos(roleInfoSource),
    roles: normalizeStringArray(source?.roles),
    perms: normalizeStringArray(source?.perms),
    agreementVersion: normalizeString(source?.agreementVersion),
    agreementUpdatedAt: normalizeString(source?.agreementUpdatedAt),
    agreementAcceptedVersion: normalizeString(source?.agreementAcceptedVersion),
    agreementAcceptedAt: normalizeString(source?.agreementAcceptedAt),
    agreementNeedConfirm: normalizeBoolean(source?.agreementNeedConfirm),
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
        : Number(data?.expires ?? fallback?.expires ?? 0) || 0,
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
    sysDeptId: userInfo.sysDeptId,
    managedDeptIds: userInfo.managedDeptIds,
    sysUserAvatar: userInfo.sysUserAvatar,
    roleInfos: userInfo.roleInfos,
    roles: userInfo.roles,
    perms: userInfo.perms,
    agreementVersion: userInfo.agreementVersion,
    agreementUpdatedAt: userInfo.agreementUpdatedAt,
    agreementAcceptedVersion: userInfo.agreementAcceptedVersion,
    agreementAcceptedAt: userInfo.agreementAcceptedAt,
    agreementNeedConfirm: userInfo.agreementNeedConfirm,
  };
}
