const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CalendarWidget-CxU0bt3P.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/dist-DogtK295.js","assets/message-box-CXDJvJwn.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/dist-DI3cGDuP.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/input-Bbhiel27.js","assets/event-CeZgVnv0.js","assets/use-size-BpzpcbJM.js","assets/dist-Clzx2YUA.js","assets/raf-Ck-OXP6t.js","assets/use-form-common-props-DzQ9ZY64.js","assets/constants-ntbKDiND.js","assets/use-composition-BHiYKdrO.js","assets/aria-DKP9Ei-1.js","assets/use-aria-VmjVV7Ut.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/hasIn-COufhDdn.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/icon-C0dIJHSD.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/use-form-item-D-dEMqBj.js","assets/use-id-C2v-tXFq.js","assets/typescript-CMUKtCBO.js","assets/use-draggable-P7Ccy1As.js","assets/clamp--xaQdoQg.js","assets/toNumber-PE_CR5nS.js","assets/overlay-D6Leq3yd.js","assets/scroll-CaaKdoVq.js","assets/focus-trap-B31xXeBw.js","assets/button-CLXz94Uh.js","assets/use-deprecated-qam6HGto.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-z-index-Q40Vppe1.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/validator-PIu3bjQD.js","assets/src-CEonioA3.js","assets/src-BVnZQO9c.js","assets/message-BQI5cdKE.js","assets/src-DzQcKxHP.js","assets/src-DDwlSqPX.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/vue-router-D43uXGPs.js","assets/src-C3nkWua1.css","assets/indexeddb-8Dvu0tZo.js","assets/auth-C8MLoNwd.js","assets/pinia-Dz8LpwBD.js","assets/lib-DSELavqH.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/calendar-D4HVZKIc.js","assets/CalendarWidget-DFWb_CM9.css","assets/CustomWidget-CX-9JrYF.js","assets/CustomWidget-DcJJ-TWI.css","assets/NoteWidget-CeWZrzxj.js","assets/NoteWidget-BEJKUQ72.css","assets/ClientInfoWidget-io4vQU9C.js","assets/usePerfMonitor-CdYyu0kX.js","assets/ClientInfoWidget-C2TryIJw.css","assets/SystemConfigWidget-DaYPTFLi.js","assets/SystemConfigWidget-GacFs85G.css","assets/AlarmWidget-DkjCF6BX.js","assets/src-CUe0zRl2.js","assets/ReDialog-DZGeR3lw.js","assets/theme-B9R3AFqb.js","assets/AlarmWidget-CyWgAfrG.css","assets/BookmarkWidget-BdPiw_kl.js","assets/BookmarkWidget-ZUOgvuH5.css","assets/QuickAccessWidget-B_eGOSlo.js","assets/QuickAccessWidget-bNI-eqmD.css","assets/WeatherWidget-CDMnd1WG.js","assets/useWeather-Cgskzzun.js","assets/WeatherWidget-B268So6i.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { Ln as canAccess } from "./src-CEonioA3.js";
import { i as registerWidgets } from "./registry-I-ZwOPma.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets.ts
/**
* 主页仪表板 Widget 类型定义
*
* 每个 widget 维护自身的元数据（id / type / title）和在网格中的位置（x / y / w / h）。
* id 用于关联 widgets 与 grid:layout（grid-layout-plus 的 Layout 与 widget 一一对应）。
*
* WidgetPermission 仅描述 widget 自身要求的权限等级（user / admin / superadmin），
* 实际角色名从 app.yaml permissionConfig.{superadmin,admin} 读取，
* 由 @repo/core 的 canAccess() 统一判断，避免业务代码硬编码角色字面量。
*
* environment 标识 widget 所属环境（正式 / 测试），区块面板会按环境分组。
*/
/** 日历显示密度选项（设置弹窗展示，顺序即视觉顺序） */
var CALENDAR_CELL_MODE_OPTIONS = [
	{
		value: "all",
		label: "全部显示",
		hint: "节日、农历各一行，日程尽量多列，格子按内容变高"
	},
	{
		value: "max4",
		label: "最多 4 行",
		hint: "日期 + 节日 + 2 条日程，格子高度固定"
	},
	{
		value: "max3",
		label: "最多 3 行",
		hint: "日期 + 节日 + 1 条日程，格子高度固定"
	}
];
/**
* 各模式下格子里能用的「除日期行外」的行数。
*
* <p>日期数字那一行恒占 1 行（它还承载休/班角标，不能省），
* 所以这里的值是「总行数 − 1」。</p>
*/
var CALENDAR_MODE_CONTENT_ROWS = {
	all: 8,
	max4: 3,
	max3: 2
};
/** 是否为「格子高度固定」的模式（all 模式随内容增长，不固定） */
function isFixedCellHeight(mode) {
	return mode !== "all";
}
/**
* 固定密度模式下写死的格子高度（px）。
*
* <p>它必须装下该模式**自己承诺的行数**，否则 `overflow:hidden` 会把文字从中间切掉 ——
* 原来写死 60px，而「最多 4 行」的自然高度实测 92.6px，整月有 5/42 格被裁一半。</p>
*
* <p>行高均取自 CalendarWidget.vue 的对应规则，推导：</p>
* <pre>
*   格子 = border-top 2 + padding 8 + 各行(18 / 16.8 / 18) + gap 4 × (行数-1)
* </pre>
*
* <p><b>约束项来自「关掉节日」那一档</b>，不是开节日：关掉后 {@code .cell-sub} 整行不渲染，
* 但省下的额度变成多一条日程 —— 行数没少、行高还全变成整数，反而顶得更高：</p>
* <pre>
*   max3 关节日 = 2 + 8 + 18+4 + 18+4 + 18   = 72    &lt;- 约束项（开节日只有 70.8）
*   max4 关节日 = 2 + 8 + 18+4 + 18+4 + 18+4 + 18 = 94 &lt;- 约束项（开节日只有 92.8）
* </pre>
*
* <p>取 <b>76 / 96</b>：在约束项之上留 4 / 2px，容掉字体度量与亚像素舍入。
* 实测关节日那档是 71.8 / 93.8 —— 若按约束项写成 72，只剩 0.2px，换台机器的
* 字体或 DPR 就会重新裁字（裁切只出现在固定密度模式，很难被发现）。</p>
*
* <p>日期行与日程行靠 {@code .cell-head / .cell-event} 的显式 {@code line-height: 18px} 锁死，
* 否则会跟随继承的行高漂移、这里算出来的高度随之失准 ——
* 改这两处或改 {@code .cell-festival} 的 line-height，都必须同步本表，
* 由 mode-verify.cjs 从 CSS 反解行高做漂移哨兵，另由 calendar-density 门禁在浏览器里复验零裁切。</p>
*
* <p>{@code all} 不固定高度，此项仅为了类型完整，不会被使用。</p>
*/
var CALENDAR_FIXED_CELL_HEIGHT = {
	all: 60,
	max4: 96,
	max3: 76
};
/**
* 算出格子里还能放几条日程。
*
* <p>行数预算是「总行数 − 日期行（恒占 1，承载休/班角标）− 节日行 − 农历行」，
* 剩下的全给日程。关掉节日时那份额度自动让给日程，而不是白白浪费。</p>
*
* @param mode 显示密度
* @param showFestival 是否显示节日与农历
* @returns 可显示的日程条数（不小于 0）
*/
function calendarEventRows(mode, showFestival) {
	const used = showFestival ? 1 : 0;
	const lunar = mode === "all" && showFestival ? 1 : 0;
	return Math.max(0, CALENDAR_MODE_CONTENT_ROWS[mode] - used - lunar);
}
/** box-shadow 级别 → 实际 CSS 值映射（低饱和度柔和阴影） */
var WIDGET_SHADOW_MAP = {
	none: "none",
	soft: "0 1px 3px rgba(0, 0, 0, 0.06)",
	medium: "0 4px 12px rgba(0, 0, 0, 0.12)",
	strong: "0 8px 24px rgba(0, 0, 0, 0.2)"
};
/** box-shadow 级别选项（设置弹窗展示） */
var WIDGET_SHADOW_OPTIONS = [
	{
		value: "none",
		label: "无"
	},
	{
		value: "soft",
		label: "柔和"
	},
	{
		value: "medium",
		label: "中等"
	},
	{
		value: "strong",
		label: "强烈"
	}
];
var WIDGET_SCROLL_OPTIONS = [
	{
		value: "none",
		label: "无",
		icon: "⊘"
	},
	{
		value: "horizontal",
		label: "横向",
		icon: "↔"
	},
	{
		value: "vertical",
		label: "纵向",
		icon: "↕"
	},
	{
		value: "both",
		label: "双向",
		icon: "⇿"
	}
];
registerWidgets([
	{
		type: "calendar",
		title: "日历",
		description: "添加日程，显示农历、节气、节日与法定放假调休",
		icon: "Calendar",
		defaultSize: {
			w: 7,
			h: 5
		},
		category: "personal",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./CalendarWidget-CxU0bt3P.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70]))
	},
	{
		type: "custom",
		title: "自定义页面",
		description: "通过 iframe 嵌入任意 URL",
		icon: "Connection",
		defaultSize: {
			w: 6,
			h: 4
		},
		category: "common",
		environment: "test",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./CustomWidget-CX-9JrYF.js"), __vite__mapDeps([71,1,5,4,68,72]))
	},
	{
		type: "note",
		title: "便签",
		description: "随手记录待办与灵感",
		icon: "Memo",
		defaultSize: {
			w: 4,
			h: 3
		},
		category: "personal",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./NoteWidget-CeWZrzxj.js"), __vite__mapDeps([73,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,74]))
	},
	{
		type: "client-info",
		title: "客户端信息",
		description: "公网 IP、实时 CPU / FPS、浏览器与系统信息",
		icon: "Monitor",
		defaultSize: {
			w: 5,
			h: 4
		},
		category: "common",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./ClientInfoWidget-io4vQU9C.js"), __vite__mapDeps([75,1,5,4,68,76,77]))
	},
	{
		type: "system-config",
		title: "系统配置",
		description: "查看当前系统配置（仅管理员可见）",
		icon: "Setting",
		defaultSize: {
			w: 6,
			h: 5
		},
		category: "admin",
		environment: "prod",
		requiredPermission: "admin",
		maxCount: 1,
		component: () => __vitePreload(() => import("./SystemConfigWidget-DaYPTFLi.js"), __vite__mapDeps([78,1,2,5,4,58,3,68,79]))
	},
	{
		type: "alarm",
		title: "闹钟",
		description: "设置定时提醒，到点推送站内消息",
		icon: "AlarmClock",
		defaultSize: {
			w: 4,
			h: 4
		},
		category: "personal",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./AlarmWidget-DkjCF6BX.js"), __vite__mapDeps([80,1,5,4,55,2,56,3,7,8,9,10,11,12,13,17,29,30,31,32,33,34,35,22,57,16,50,51,52,53,27,38,47,48,49,6,14,15,18,19,20,21,23,24,25,26,28,36,37,39,40,41,42,43,44,45,46,54,58,59,60,61,62,63,64,65,66,67,81,68,82,83,84]))
	},
	{
		type: "bookmark",
		title: "书签",
		description: "收藏常用链接，一键跳转",
		icon: "Collection",
		defaultSize: {
			w: 5,
			h: 4
		},
		category: "personal",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./BookmarkWidget-BdPiw_kl.js"), __vite__mapDeps([85,1,2,5,4,55,56,3,7,8,9,10,11,12,13,17,29,30,31,32,33,34,35,22,57,16,50,51,52,53,27,38,47,48,49,6,14,15,18,19,20,21,23,24,25,26,28,36,37,39,40,41,42,43,44,45,46,54,58,59,60,61,62,63,64,65,66,67,68,82,83,86]))
	},
	{
		type: "quick-access",
		title: "快捷入口",
		description: "系统菜单快捷跳转",
		icon: "Grid",
		defaultSize: {
			w: 5,
			h: 4
		},
		category: "common",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./QuickAccessWidget-B_eGOSlo.js"), __vite__mapDeps([87,1,2,56,4,5,55,3,7,8,9,10,11,12,13,17,29,30,31,32,33,34,35,22,57,16,50,51,52,53,27,38,47,48,49,6,14,15,18,19,20,21,23,24,25,26,28,36,37,39,40,41,42,43,44,45,46,54,58,59,60,61,62,63,64,65,66,67,68,82,83,88]))
	},
	{
		type: "weather",
		title: "天气",
		description: "7 天天气预报，含日间/夜间预报",
		icon: "Sunny",
		defaultSize: {
			w: 8,
			h: 5
		},
		category: "common",
		environment: "prod",
		requiredPermission: "user",
		maxCount: 1,
		component: () => __vitePreload(() => import("./WeatherWidget-CDMnd1WG.js"), __vite__mapDeps([89,1,5,4,68,90,55,2,56,3,7,8,9,10,11,12,13,17,29,30,31,32,33,34,35,22,57,16,50,51,52,53,27,38,47,48,49,6,14,15,18,19,20,21,23,24,25,26,28,36,37,39,40,41,42,43,44,45,46,54,58,59,60,61,62,63,91]))
	}
]);
/**
* 按当前用户权限过滤 widget 目录。
*
* - 当前用户为 user      → 仅看 user widget
* - 当前用户为 admin     → 看 user + admin widget
* - 当前用户为 superadmin → 看全部 widget
*
* 角色字面量（"admin" / "superadmin" / 自定义）由 app.yaml permissionConfig 提供，
* canAccess() 内部统一读取，避免业务代码硬编码。
*
* @param catalog 待过滤的目录（通常传响应式 {@code widgetCatalog.value}，以便模块贡献的 widget 也能被看到）
* @param userPermission 当前用户权限等级
* @returns 该用户可见的目录条目
*/
function filterCatalogByPermission(catalog, userPermission) {
	return catalog.filter((w) => canAccess(w.requiredPermission, userPermission));
}
//#endregion
export { WIDGET_SHADOW_OPTIONS as a, isFixedCellHeight as c, WIDGET_SHADOW_MAP as i, CALENDAR_FIXED_CELL_HEIGHT as n, calendarEventRows as o, WIDGET_SCROLL_OPTIONS as r, filterCatalogByPermission as s, CALENDAR_CELL_MODE_OPTIONS as t };
