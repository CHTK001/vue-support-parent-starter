/**
 * 权限指令 —— v-admin / v-superadmin / v-role / v-perm / v-menu
 *
 * 用法：
 *   <div v-admin>仅管理员可见</div>
 *   <div v-superadmin>仅超级管理员可见</div>
 *   <div v-role="['admin', 'ops']">指定角色可见</div>
 *   <div v-perm="['system:user:list']">拥有任一权限码可见</div>
 *   <div v-menu="menuItem">菜单权限（读取菜单 meta.roles / meta.perms）</div>
 *
 * 权限不通过时移除元素。
 */
import type { App, Directive } from "vue";
import { getConfig } from "@repo/config";
import { hasRole, hasPerm } from "../permission";

/** 菜单项结构（兼容常见路由菜单：meta 中声明权限） */
export interface MenuAuthMeta {
  /** 可见所需角色 */
  roles?: string[];
  /** 可见所需权限码 */
  perms?: string[];
}

export interface MenuAuthItem {
  /** 菜单 meta */
  meta?: MenuAuthMeta;
}

/** 移除元素 */
function removeEl(el: HTMLElement): void {
  el.parentNode?.removeChild(el);
}

/** 菜单权限判断：meta.roles / meta.perms 任一命中即通过；都未声明则放行 */
function checkMenu(item: MenuAuthItem | undefined): boolean {
  if (!item?.meta) return true;
  const { roles, perms } = item.meta;
  if (roles && roles.length > 0 && !hasRole(roles)) return false;
  if (perms && perms.length > 0 && !hasPerm(perms)) return false;
  return true;
}

/** v-admin：当前用户是管理员才显示 */
export const vAdmin: Directive<HTMLElement> = {
  mounted(el) {
    const { admin } = getConfig().permission;
    if (!hasRole(admin)) {
      removeEl(el);
    }
  },
};

/** v-superadmin：当前用户是超级管理员才显示 */
export const vSuperadmin: Directive<HTMLElement> = {
  mounted(el) {
    const { superadmin } = getConfig().permission;
    if (!hasRole(superadmin)) {
      removeEl(el);
    }
  },
};

/** v-role：当前用户命中指定角色列表才显示 */
export const vRole: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const required = binding.value;
    if (!required || !hasRole(required)) {
      removeEl(el);
    }
  },
};

/** v-perm：当前用户拥有任一指定权限码才显示 */
export const vPerm: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const required = binding.value;
    if (!required || !hasPerm(required)) {
      removeEl(el);
    }
  },
};

/** v-menu：按菜单 meta.roles / meta.perms 判断是否显示 */
export const vMenu: Directive<HTMLElement, MenuAuthItem | undefined> = {
  mounted(el, binding) {
    if (!checkMenu(binding.value)) {
      removeEl(el);
    }
  },
};

/** 批量注册权限指令 */
export function setupPermissionDirectives(app: App): void {
  app.directive("admin", vAdmin);
  app.directive("superadmin", vSuperadmin);
  app.directive("role", vRole);
  app.directive("perm", vPerm);
  app.directive("menu", vMenu);
}
