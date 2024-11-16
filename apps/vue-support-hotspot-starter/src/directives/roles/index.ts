import { useUserStoreHook } from "@/store/modules/user";
import { getConfig } from "@repo/config";
import type { Directive } from "vue";

/**
 * 用户权限指令
 * @directive 单个权限验证（v-auth="'xxx'"）
 * @directive 多个权限验证，满足一个则显示（v-auths="['xxx','xxx']"）
 * @directive 多个权限验证，全部满足则显示（v-auths-all="['xxx','xxx']"）
 */
export const roles: Directive = {
  mounted(el, binding) {
    const roles = useUserStoreHook().roles || [];
    const adminRoles = getConfig().adminRoles || [];
    if (adminRoles.filter(it => roles.includes(it)).length > 0) {
      return;
    }
    let flag = false;
    roles.map(val => {
      binding.value.map(v => {
        if (val === v) flag = true;
      });
    });
    if (!flag) el.parentNode.removeChild(el);
  }
};
