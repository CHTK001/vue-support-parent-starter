/**
 * 权限工具 —— 维护当前用户角色与权限码，供 v-admin / v-superadmin / v-role / v-perm 指令判断
 *
 * 数据来源：登录后通过 setUserRoles / setUserPerms / syncUserPerm 写入，
 * createApp 创建 storage 后会自动从存储中的 userInfo 同步。
 */

/** 存储中的用户信息 key */
export const USER_INFO_KEY = "userInfo";

/** 用户信息结构（存储中的 userInfo） */
export interface UserInfo {
  /** 用户角色列表 */
  roles?: string[];
  /** 单个角色（兼容后端只返回单角色） */
  role?: string;
  /** 用户权限码列表 */
  perms?: string[];
  /** 单个权限码（兼容后端只返回单权限） */
  perm?: string;
}

let userRoles: string[] = [];
let userPerms: string[] = [];

/** 设置当前用户角色 */
export function setUserRoles(roles: string[]): void {
  userRoles = roles;
}

/** 获取当前用户角色列表 */
export function getUserRoles(): string[] {
  return userRoles;
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

/** 是否拥有角色（required 为字符串或字符串数组，命中其一即通过） */
export function hasRole(required: string | string[]): boolean {
  const requiredArr = Array.isArray(required) ? required : [required];
  return requiredArr.some((r) => userRoles.includes(r));
}

/** 是否拥有权限码（required 为字符串或字符串数组，命中其一即通过） */
export function hasPerm(required: string | string[]): boolean {
  const requiredArr = Array.isArray(required) ? required : [required];
  return requiredArr.some((p) => userPerms.includes(p));
}
