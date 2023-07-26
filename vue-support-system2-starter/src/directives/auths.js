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
		debugger
		if(permissionAll()){
			return
		}
		let permissions = tool.data.get(config.PERMISSIONS);
		let flag = false;
		permissions.map((val) => {
			binding.value.map((v) => {
				if (val === v) flag = true;
			});
		});
		if (!flag) el.parentNode.removeChild(el);
	}
}
