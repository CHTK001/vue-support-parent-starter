/**
 * v-role 角色权限指令
 *
 * 用法：
 * <el-button v-role="'admin'">删除</el-button>
 * <el-button v-role="['admin', 'operator']">编辑</el-button>
 *
 * 当当前用户角色不在指令值列表中时，移除该 DOM 元素。
 * 超级管理员 (SUPER_ADMIN) 始终保留。
 *
 * 依赖：用户 store 中需提供 roles: string[]
 */
import type { Directive, DirectiveBinding } from 'vue';

const SUPER_ADMIN = 'SUPER_ADMIN';
const ADMIN = 'ADMIN';

function hasRole(roles: string[], required: string | string[]): boolean {
  if (!roles || roles.length === 0) return false;
  // 超级管理员始终保留
  if (roles.includes(SUPER_ADMIN)) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some(r => roles.includes(r) || r === ADMIN && roles.includes(ADMIN));
}

/** 注入到 window，供指令读取当前用户角色 */
declare global {
  interface Window {
    __userRoles?: string[];
  }
}

function getCurrentRoles(): string[] {
  // 优先级：window 注入 > localStorage > 空
  if (window.__userRoles && window.__userRoles.length) return window.__userRoles;
  try {
    const raw = localStorage.getItem('user-roles');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // 忽略
  }
  return [];
}

function update(el: HTMLElement, binding: DirectiveBinding) {
  const required = binding.value;
  if (!required) return;
  const roles = getCurrentRoles();
  if (!hasRole(roles, required)) {
    el.style.display = 'none';
  } else {
    el.style.display = '';
  }
}

export const roleDirective: Directive = {
  mounted(el, binding) {
    update(el, binding);
  },
  updated(el, binding) {
    update(el, binding);
  },
};

/** 提供给应用层设置当前用户角色 */
export function setUserRoles(roles: string[]) {
  window.__userRoles = roles;
  try {
    localStorage.setItem('user-roles', JSON.stringify(roles));
  } catch (e) {
    // 忽略
  }
}