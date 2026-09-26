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
 * 权限不通过时隐藏元素（display:none），角色异步更新后由 updated 钩子恢复显示。
 */
import type { App, Directive } from "vue";
import { getConfig } from "@repo/config";
import { hasRole, hasPerm, isAdmin } from "../permission";

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

/** 切换元素可见性（隐藏而非移除，以便角色异步更新后恢复） */
function setVisible(el: HTMLElement, visible: boolean): void {
  if (visible) {
    el.style.display = "";
  } else {
    el.style.display = "none";
  }
}

/** 菜单权限判断：meta.roles / meta.perms 任一命中即通过；都未声明则放行 */
function checkMenu(item: MenuAuthItem | undefined): boolean {
  if (!item?.meta) return true;
  const { roles, perms } = item.meta;
  if (roles && roles.length > 0 && !hasRole(roles)) return false;
  if (perms && perms.length > 0 && !hasPerm(perms)) return false;
  return true;
}

/** v-admin：当前用户是管理员（含超级管理员）才显示 */
export const vAdmin: Directive<HTMLElement> = {
  mounted(el) {
    setVisible(el, isAdmin());
  },
  updated(el) {
    setVisible(el, isAdmin());
  },
};

/** v-superadmin：当前用户是超级管理员才显示 */
export const vSuperadmin: Directive<HTMLElement> = {
  mounted(el) {
    const { superadmin } = getConfig().permission;
    setVisible(el, hasRole(superadmin));
  },
  updated(el) {
    const { superadmin } = getConfig().permission;
    setVisible(el, hasRole(superadmin));
  },
};

/** v-role：当前用户命中指定角色列表才显示 */
export const vRole: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const required = binding.value;
    setVisible(el, !!required && hasRole(required));
  },
  updated(el, binding) {
    const required = binding.value;
    setVisible(el, !!required && hasRole(required));
  },
};

/** v-perm：当前用户拥有任一指定权限码才显示 */
export const vPerm: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const required = binding.value;
    setVisible(el, !!required && hasPerm(required));
  },
  updated(el, binding) {
    const required = binding.value;
    setVisible(el, !!required && hasPerm(required));
  },
};

/** v-menu：按菜单 meta.roles / meta.perms 判断是否显示 */
export const vMenu: Directive<HTMLElement, MenuAuthItem | undefined> = {
  mounted(el, binding) {
    setVisible(el, checkMenu(binding.value));
  },
  updated(el, binding) {
    setVisible(el, checkMenu(binding.value));
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
