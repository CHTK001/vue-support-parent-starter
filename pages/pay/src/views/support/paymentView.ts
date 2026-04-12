export function formatCurrency(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return `¥${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  return String(value).replace("T", " ");
}

export function normalizeTableResult<T>(records?: T[], total?: number) {
  return {
    data: records ?? [],
    total: Number(total ?? records?.length ?? 0),
  };
}

export function readUserRoles(storageKey = "user-info") {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [] as string[];
    }
    const parsed = JSON.parse(raw);
    const roles = Array.isArray(parsed?.roles)
      ? parsed.roles
      : Array.isArray(parsed?.userInfo?.roles)
        ? parsed.userInfo.roles
        : [];
    return roles.map((item: unknown) => String(item));
  } catch {
    return [] as string[];
  }
}

export function isAdminRole(role?: string) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "ADMIN" || normalized === "SUPER_ADMIN" || normalized === "SUPERADMIN";
}

export function hasAdminRole(roles: string[]) {
  return roles.some((role) => isAdminRole(role));
}
