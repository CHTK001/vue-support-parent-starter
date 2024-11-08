import { permissionAll } from '@/utils/permission'
import tool from '@/utils/tool';
import config from '@/config';

/**
 * 用户权限指令
 * @directive 单个权限验证（v-auth="'xxx'"）
 * @directive 多个权限验证，满足一个则显示（v-auths="['xxx','xxx']"）
 * @directive 多个权限验证，全部满足则显示（v-auths-all="['xxx','xxx']"）
 */
export default {
	mounted (el, binding) {
		if(permissionAll()){
			return
		}
		if(tool.data.get(config.USER_INFO).roles.indexOf(config.ADMIN) > -1) {
			return ;
		}
		let permissions = tool.data.get(config.PERMISSIONS);
		if (!permissions.some((v) => v === binding.value)) el.parentNode.removeChild(el);
	}
}
