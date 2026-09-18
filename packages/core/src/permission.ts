/**
 * 权限工具 —— 维护当前用户角色与权限码，供 v-admin / v-superadmin / v-role / v-perm 指令判断
 *
 * 数据来源：登录后通过 setUserRoles / setUserPerms / syncUserPerm 写入，
 * createApp 创建 storage 后会自动从存储中的 userInfo 同步。
 *
 * 角色字面量（admin / superadmin 或自定义）从 app.yaml permissionConfig 读取，
 * 业务方不要在业务代码里硬编码 "admin" / "superadmin" 字面量，
 * 通过 getAdminRoles / getSuperadminRole / isAdmin / isSuperadmin 间接读取。
 */
import { getConfig } from "@repo/config";

/** 存储中的用户信息 key */
export const USER_INFO_KEY = "userInfo";

/** 用户信息结构（存储中的 userInfo） */
export interface UserInfo {
  /** 用户 id（用于 userScopeKeys 自动注入，按账号隔离 storage） */
  userId?: string | number;
  /** 用户名（兼容字段） */
  username?: string;
  /** 用户角色列表 */
  roles?: string[];
  /** 单个角色（兼容后端只返回单角色） */
  role?: string;
  /** 用户权限码列表 */
  perms?: string[];
  /** 单个权限码（兼容后端只返回单权限） */
  perm?: string;
}

/** 权限等级（抽象层级，对应 yml 中 admin / superadmin 配置的角色名） */
export type UserPermission = "user" | "admin" | "superadmin";

const RANK: Record<UserPermission, number> = { user: 1, admin: 2, superadmin: 3 };

let userRoles: string[] = [];
let userPerms: string[] = [];

/** 角色在 localStorage 的持久化 key（与 v-role 指令 / 面板 isAdmin 读取一致） */
const ROLES_STORAGE_KEY = "user-roles";

/** 初始化：优先取内存，其次从 localStorage 恢复（跨页面/刷新保持一致） */
function initUserRoles(): string[] {
  if (userRoles.length > 0) {
    return userRoles;
  }
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        userRoles = parsed;
      }
    }
  } catch { /* 忽略解析失败 */ }
  return userRoles;
}

/** 设置当前用户角色 */
export function setUserRoles(roles: string[]): void {
  userRoles = roles;
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch { /* 忽略存储失败 */ }
}

/** 获取当前用户角色列表 */
export function getUserRoles(): string[] {
  return initUserRoles();
}

/** 设置当前用户权限码 */
export function setUserPerms(perms: string[]): void {
  userPerms = perms;
}

/** 获取当前用户权限码列表 */
export function getUserPerms(): string[] {
  return userPerms;
}

/** 从用户信息同步角色与权限码（roles 优先，其次 role 单角色；perms 优先，其次 perm 单权限） */
export function syncUserPerm(user: UserInfo | null | undefined): void {
  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
  setUserRoles(roles);
  const perms = user?.perms?.length ? user.perms : user?.perm ? [user.perm] : [];
  setUserPerms(perms);
}

/** 是否拥有角色（required 为字符串或字符串数组，命中其一即通过；角色比较忽略大小写） */
export function hasRole(required: string | string[]): boolean {
  const requiredArr = Array.isArray(required) ? required : [required];
  return requiredArr.some((r) => userRoles.some((role) => role.toLowerCase() === r.toLowerCase()));
}

/** 是否拥有权限码（required 为字符串或字符串数组，命中其一即通过） */
export function hasPerm(required: string | string[]): boolean {
  const requiredArr = Array.isArray(required) ? required : [required];
  return requiredArr.some((p) => userPerms.includes(p));
}

/* ==================== 角色配置 + 等级工具 ==================== */

/** 读取 yml 中配置的管理员角色列表（默认 ["ADMIN"]） */
export function getAdminRoles(): string[] {
  const v = getConfig()?.permission?.admin;
  return Array.isArray(v) ? v : ["ADMIN"];
}

/** 读取 yml 中配置的超级管理员角色名（默认 "SUPER_ADMIN"） */
export function getSuperadminRole(): string {
  return getConfig()?.permission?.superadmin ?? "SUPER_ADMIN";
}

/** 当前用户是否为管理员（含 superadmin） */
export function isAdmin(): boolean {
  return hasRole([getSuperadminRole(), ...getAdminRoles()]);
}

/** 当前用户是否为超级管理员 */
export function isSuperadmin(): boolean {
  return hasRole(getSuperadminRole());
}

/** 当前用户最高权限等级 */
export function getUserPermission(): UserPermission {
  if (isSuperadmin()) return "superadmin";
  if (isAdmin()) return "admin";
  return "user";
}

/**
 * 检查是否允许访问指定权限等级的内容。
 *
 * 用法 1（运行时基于登录用户）：
 *   canAccess("admin")                                              // 当前登录用户是否能看 admin 内容
 * 用法 2（显式传入当前用户权限，用于过滤目录/UI）：
 *   canAccess("admin", "user")                                      // user 用户不能看 admin 内容
 *
 * 角色字面量从 app.yaml permissionConfig 读取，调用方不写死。
 */
export function canAccess(required: UserPermission, userPermission?: UserPermission): boolean {
  const userLevel = userPermission ?? getUserPermission();
  return RANK[userLevel] >= RANK[required];
}
