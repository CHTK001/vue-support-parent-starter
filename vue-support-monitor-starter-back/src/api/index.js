/**
 * @description 自动import导入所有 api 模块
 */

const modules = import.meta.globEager('./model/**/*.js')
const rs = {}; 
for (const icon in modules) {
	const iconName = icon.split("model/")[1].split(".js")[0];
	rs[iconName] = modules[icon].default;
}
export default rs
