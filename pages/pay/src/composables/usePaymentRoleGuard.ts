export function usePaymentRoleGuard(storageKey = "user-info") {
  function readUserRoles(): string[] {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const roles = Array.isArray(parsed?.roles)
        ? parsed.roles
        : Array.isArray(parsed?.userInfo?.roles)
          ? parsed.userInfo.roles
          : [];
      return roles.map((item: unknown) => String(item));
    } catch {
      return [];
    }
  }

  function isAdminRole(role?: string): boolean {
    const normalized = String(role ?? "").trim().toUpperCase();
    return normalized === "ADMIN" || normalized === "SUPER_ADMIN" || normalized === "SUPERADMIN";
  }

  function hasAdminRole(roles: string[]): boolean {
    return roles.some((role) => isAdminRole(role));
  }

  const roles = readUserRoles();
  const isAdmin = hasAdminRole(roles);

  return { isAdmin, roles, readUserRoles, isAdminRole, hasAdminRole };
}
