/**
 * v-auth
 * 按钮权限指令
 */
import type { Directive, DirectiveBinding } from "vue";
import { hasAnyPerm } from "@repo/theme/koi/utils/permission.ts";

function toggle(el: HTMLElement, binding: DirectiveBinding) {
  const { value } = binding;
  if (!Array.isArray(value) || value.length === 0) {
    console.warn(`v-auth 需要非空数组，例如 v-auth="['system:user:add']"`);
    return;
  }
  const allowed = hasAnyPerm(value);
  // 若需彻底移除 DOM
  if (!allowed) el.parentNode?.removeChild(el);
}

const auth: Directive = {
  mounted: toggle,
  updated: toggle  // buttonList 异步加载后会重新计算
};

export default auth;
