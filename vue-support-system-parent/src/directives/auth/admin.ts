import { useUserStoreHook } from "@/store/modules/user";
import { getConfig } from "@/config";

/**
 * 用户权限指令
 * @directive 权限验证（v-admin）
 */
export default {
  mounted(el) {
    const admins = getConfig().adminRoles || [];
    const roles = useUserStoreHook().roles || [];
    let flag = false;
    roles.map(val => {
      admins.map(v => {
        if (val === v) flag = true;
      });
    });
    if (!flag) el.parentNode.removeChild(el);
  }
};