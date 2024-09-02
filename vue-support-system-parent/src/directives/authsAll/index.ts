import { useUserStoreHook } from "@/store/modules/user";
import { getConfig } from "@/config";
import { judementSameArr } from "@/utils/objects";

/**
 * 用户权限指令
 * @directive 单个权限验证（v-auth="'xxx'"）
 * @directive 多个权限验证，满足一个则显示（v-auths="['xxx','xxx']"）
 * @directive 多个权限验证，全部满足则显示（v-auths-all="['xxx','xxx']"）
 */
export default {
  mounted(el, binding) {
    const roles = useUserStoreHook().roles || [];
    const adminRoles = getConfig().adminRoles || [];
    if (adminRoles.filter(it => roles.includes(it)).length > 0) {
      return;
    }
    const permissions = useUserStoreHook().perms || [];
    const flag = judementSameArr(binding.value, permissions);
    if (!flag) el.parentNode.removeChild(el);
  }
};
