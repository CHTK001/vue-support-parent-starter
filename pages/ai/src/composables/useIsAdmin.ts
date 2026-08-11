import { computed, type ComputedRef } from 'vue';
import { isAdmin as coreIsAdmin } from '@repo/core';

/**
 * 当前用户是否为管理员（含超级管理员）。
 *
 * <p>复用 {@link @repo/core} 权限工具，避免各面板重复实现角色读取与判定。
 * 开发环境下默认返回 true（未登录时保证管理面板可操作）。</p>
 *
 * @returns 是否管理员
 */
export function useIsAdmin(): ComputedRef<boolean> {
  return computed(() => {
    if (import.meta.env.DEV) return true;
    return coreIsAdmin();
  });
}