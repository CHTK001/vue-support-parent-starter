/**
 * 用户权限组合式工具
 *
 * 角色名从 app.yaml `permissionConfig.{superadmin,admin}` 读取（默认 "superadmin" / "admin"），
 * 业务方调用 `isAdmin()` / `isSuperadmin()` 即可判断当前用户权限，
 * 不需要在业务代码里硬编码角色名。
 *
 * 当前用户的角色列表由 @repo/core 的 setUserRoles / syncUserPerm 维护。
 * 这里仅复用 core 的 hasRole 工具读取。
 */
import { getConfig } from "@repo/config";
import { hasRole } from "@repo/core";

/** 解析 yml permissionConfig 中配置的角色名（缺省 fallback 兼容旧配置） */
export function getAdminRole(): string {
  return getConfig()?.permission?.admin ?? "admin";
}

export function getSuperadminRole(): string {
  return getConfig()?.permission?.superadmin ?? "superadmin";
}

/** 当前用户是否为管理员（含 superadmin） */
export function isAdmin(): boolean {
  return hasRole([getSuperadminRole(), getAdminRole()]);
}

/** 当前用户是否为超级管理员 */
export function isSuperadmin(): boolean {
  return hasRole(getSuperadminRole());
}

/**
 * 权限等级枚举
 *
 * user       - 普通用户
 * admin      - 管理员（含 superadmin）
 * superadmin - 超级管理员
 */
export type UserPermission = "user" | "admin" | "superadmin";

/** 获取当前用户最高权限等级 */
export function getUserPermission(): UserPermission {
  if (isSuperadmin()) return "superadmin";
  if (isAdmin()) return "admin";
  return "user";
}

/**
 * 检查是否允许访问指定权限等级的内容。
 *
 * user 内容：所有人可见
 * admin 内容：管理员 / 超管可见
 * superadmin 内容：仅超管可见
 */
export function canAccess(required: UserPermission): boolean {
  if (required === "user") return true;
  if (required === "admin") return isAdmin();
  return isSuperadmin();
}