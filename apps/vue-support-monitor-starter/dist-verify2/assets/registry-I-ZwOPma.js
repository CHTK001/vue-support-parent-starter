import { g as computed, xn as shallowRef } from "./runtime-core.esm-bundler-DDQHILLo.js";
//#region ../../packages/theme/src/themes/koi/views/home/registry.ts
/**
* Widget 注册表 —— **全仓唯一事实来源**
*
* <p>此前 widget 的信息散在两处：{@code widgets.ts} 的 {@code WIDGET_CATALOG}（元数据）与
* {@code useWidgetLoader.ts} 的 {@code LOADER_MAP}（组件）。两处各写一份必然漂移 ——
* 实际已经漂移过一次：旧 home 组件下线后 {@code isWidgetType} 仍放行 6 个历史类型，
* 放行 → 找不到组件 → 渲染成「加载失败 + 重试」，且重试必然再失败。
* 现在合并为**一条注册项同时携带元数据与组件**，漂移在构造上不再可能。</p>
*
* <p>并且注册表是<b>运行时可扩展</b>的：各 {@code pages/xx} 模块可在
* {@code main.ts} 里通过 {@code createContextApp().widgets(...)} 贡献自己的 widget，
* 无需改动本文件。内置 widget 在本模块被 import 时即完成自注册。</p>
*
* <p><b>为什么 {@code WidgetType} 是开放的 string 而不是封闭联合：</b>
* TypeScript 的模块增强（declaration merging）只对 interface / namespace 生效，
* <b>对联合类型无效</b>，所以 {@code pages/xx} 无法用 {@code .d.ts} 扩展
* {@code type WidgetType = "calendar" | ...}。要让模块贡献自定义 type，唯一办法是
* 开放为 string 并在运行时校验注册表 —— 这正是本文件承担的角色。</p>
*/
/** 注册表：type → 注册项（保留插入顺序，决定面板视觉顺序） */
var registry = /* @__PURE__ */ new Map();
/** 版本号：每次注册变更 +1，供 computed 建立响应式依赖 */
var version = shallowRef(0);
/**
* 注册一批 widget。
*
* <p>由 {@link defineWidgetContribution} 包装后交给 app 的 {@code .widgets()} 调用；
* 内置 widget 在 {@code widgets.ts} 模块求值时自注册。幂等：同 type 重复注册以
* <b>最后一次</b>为准（便于测试与临时覆盖），开发环境会打印覆盖警告。</p>
*
* @param list 待注册的 widget 列表
*/
function registerWidgets(list) {
	for (const reg of list) {
		if (typeof reg?.type !== "string" || reg.type.trim() === "") {
			console.error("[widget-registry] 忽略缺少 type 的注册项：", reg);
			continue;
		}
		registry.get(reg.type);
		registry.set(reg.type, reg);
	}
	version.value += 1;
}
/** 按 type 取注册项；未注册返回 undefined（调用方据此渲染占位卡片） */
function getWidgetRegistration(type) {
	return registry.get(type);
}
/** 该 type 在当前应用是否已注册 */
function isWidgetRegistered(type) {
	return registry.has(type);
}
/** 全部注册项（含组件与图标，顺序即面板顺序） */
function getWidgetRegistrations() {
	version.value;
	return [...registry.values()];
}
/** 目录元数据（剥离组件与图标，仅供面板 / 权限过滤 / 位置计算使用） */
function getWidgetCatalog() {
	version.value;
	return [...registry.values()].map(({ component: _c, iconComponent: _i, source: _s, ...meta }) => meta);
}
/**
* 响应式目录：注册变化时自动失效。
*
* <p>面板、权限过滤、{@code maxCount} 过滤都应基于它，而不是模块求值期就固定下来的
* 静态数组 —— 各 {@code pages} 模块是在 {@code main.ts → mount()} 期间注册的，
* 晚于本模块求值，早期冻结的数组看不到它们。</p>
*/
var widgetCatalog = computed(() => getWidgetCatalog());
//#endregion
export { widgetCatalog as a, registerWidgets as i, getWidgetRegistrations as n, isWidgetRegistered as r, getWidgetRegistration as t };
