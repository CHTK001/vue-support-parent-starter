import { getConfig } from "@repo/config";
import type { Directive } from "vue";
import { useUserStoreHook } from "../../store/modules/UserStore";

/**
 * 用户权限指令
 * @directive 单个权限验证（v-auth="'xxx'"）
 * @directive 多个权限验证，满足一个则显示（v-auths="['xxx','xxx']"）
 * @directive 多个权限验证，全部满足则显示（v-auths-all="['xxx','xxx']"）
 */
export const auths: Directive = {
  mounted(el, binding) {
    const roles = useUserStoreHook().roles || [];
    // admin 和 superadmin 角色不受权限限制
    if (roles.includes("admin") || roles.includes("superadmin")) {
      return;
    }
    const permissions = useUserStoreHook().perms || [];
    let flag = false;
    permissions.map((val) => {
      binding.value.map((v) => {
        if (val === v) flag = true;
      });
    });
    if (!flag) el?.parentNode?.removeChild(el);
  },
};
