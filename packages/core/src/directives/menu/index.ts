import { router } from "../../router";
import type { Directive } from "vue";

/**
 * 用户权限指令
 * @directive 多个权限验证，全部满足则显示（v-menu="['xxx','xxx']"）
 */
export const menu: Directive = {
  mounted(el, binding) {
    var flag = false;
    const data = binding.value || [];
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      if (router.hasRoute(element)) {
        flag = true;
        continue;
      }
      flag = false;
      break;
    }
    if (!flag) el.parentNode.removeChild(el);
  },
};
