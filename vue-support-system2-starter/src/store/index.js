/**
 * @description 自动import导入所有 vuex 模块
 */

import { createStore } from 'vuex';

const modules = import.meta.glob('./modules/**/*.js')
const rs = {}; 
for (const icon in modules) {
	const iconName = icon.split("modules/")[1].split(".js")[0];
	rs[iconName] = modules[icon];
}
export default createStore({
	rs
});
