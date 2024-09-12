/**
 * @description 自动import导入所有 vuex 模块
 */

import { createStore } from 'vuex';
import Vuex from 'vuex'

const modules = import.meta.globEager('./modules/**/*.js')
const rs = {}; 
for (const icon in modules) {
	const iconName = icon.split("modules/")[1].split(".js")[0];
	rs[iconName] = modules[icon].default;
}
const test  = new Vuex.Store({
    modules: rs
})
export default test