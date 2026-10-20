import { O as defineAsyncComponent } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
/**
* 解析当前 themeId（不存在时回退默认主题）
*/
function resolveThemeId() {
	return getConfig().other.themeId || "default";
}
/** 已解析主题组件缓存（map 对象 → themeId → 组件），避免重复 await 动态 import */
var themedComponentCache = /* @__PURE__ */ new WeakMap();
/**
* 按主题加载组件实例（带缓存：同一 map + themeId 只解析一次）
* @param map 主题实现映射
*/
async function loadThemedComponent(map) {
	const themeId = resolveThemeId();
	const loader = map[themeId] ?? map["default"];
	if (!loader) throw new Error(`[ui] 组件缺少主题实现：${themeId}`);
	let byTheme = themedComponentCache.get(map);
	if (!byTheme) {
		byTheme = /* @__PURE__ */ new Map();
		themedComponentCache.set(map, byTheme);
	}
	let pending = byTheme.get(themeId);
	if (!pending) {
		pending = loader().then((mod) => mod.default);
		byTheme.set(themeId, pending);
	}
	return pending;
}
function defineThemeComponent(name, map) {
	const component = defineAsyncComponent(() => loadThemedComponent(map));
	const install = async (app) => {
		app.component(name, await loadThemedComponent(map));
	};
	return {
		install,
		component
	};
}
//#endregion
export { defineThemeComponent as t };
