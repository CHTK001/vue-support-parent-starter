import { gn as watch, xt as inject } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { g as ElMessage } from "./es-BernUpY0.js";
import { g as storeToRefs } from "./pinia-BWfHBnKe.js";
import { l as DEFAULT_THEME } from "./src-BMpqrrtG.js";
import { r as applyPrimaryColorVars } from "./src-RZAlNKAF.js";
//#region ../../packages/theme/src/tokens.ts
/**
* 亮色模式默认令牌
*
* <p>主色三档取 #2563C9 / #1D57A8 / #174A90，是无障碍换色的结果，不是随手选的。
* 原值 #409EFF / #79BBFF / #337ECC（Element 默认）在白底上只有 2.78 / 2.03 /
* 4.20 : 1，全部低于 WCAG AA 对 14px 普通文本要求的 4.5 : 1 —— 实测全站因此有
* 406 个 color-contrast 违规节点（主色按钮、主色文字、菜单选中态都算在内）。</p>
*
* <p>三档都满足：白字在填充上 >= 4.5 : 1、主色作文字在白底 >= 4.5 : 1、
* 在菜单选中底 #EAF4FF 上 >= 4.5 : 1（分别为 5.67 / 7.04 / 8.68）。</p>
*
* <p>注意 hover 比 base <b>更深</b>（常规做法是更浅）。因为按钮文字是白字，
* 底色越浅白字越看不清；可访问性优先于「hover 变浅」的视觉惯例。
* 若要恢复「hover 变浅」的观感，只能把 hover 态文字改成深色。</p>
*
* <p><b>本文件不是 --el-color-primary 的强制点。</b>实测（2026-10-02）注入链是
* {@code DEFAULT_THEME}（packages/config/src/constants.ts）→ themeColor.ts 的
* applyPrimaryColorVars() 写入 &lt;html&gt; 行内变量；本文件的 colorPrimary
* 是设计令牌层的同源声明，两处必须同值，否则换肤时会跳变。
* Element 自带 CSS 的 :root 默认值 #409EFF 会被行内变量盖掉，不需要改它。</p>
*
* <p>文本灰阶的 AA 加固不在本文件，而在
* {@code packages/theme/src/themes/koi/styles/element.scss} —— 因为真正被大量
* 引用的是 Element 的 --el-text-color-secondary / --el-text-color-placeholder，
* 本文件的 colorTextSecondary(#606266) 本就达标（5.29 : 1）。</p>
*/
var lightTokens = {
	mode: "light",
	colorPrimary: "#2563C9",
	colorPrimaryHover: "#1D57A8",
	colorPrimaryActive: "#174A90",
	colorBg: "#f5f7fa",
	colorBgContainer: "#ffffff",
	colorText: "#303133",
	colorTextSecondary: "#606266",
	colorBorder: "#dcdfe6",
	colorSuccess: "#67c23a",
	colorWarning: "#e6a23c",
	colorError: "#f56c6c",
	colorInfo: "#909399",
	borderRadius: "4px",
	fontSize: "14px"
};
/** 暗色模式默认令牌（主色与亮色模式一致，避免两套值各自漂移） */
var darkTokens = {
	mode: "dark",
	colorPrimary: "#2563C9",
	colorPrimaryHover: "#1D57A8",
	colorPrimaryActive: "#174A90",
	colorBg: "#141414",
	colorBgContainer: "#1d1e1f",
	colorText: "#e5eaf3",
	colorTextSecondary: "#a3a6ad",
	colorBorder: "#4c4d4f",
	colorSuccess: "#67c23a",
	colorWarning: "#e6a23c",
	colorError: "#f56c6c",
	colorInfo: "#909399",
	borderRadius: "4px",
	fontSize: "14px"
};
/** 预设令牌集合，便于扩展更多主题 */
var presetTokens = {
	light: lightTokens,
	dark: darkTokens
};
//#endregion
//#region ../../packages/theme/src/applyTheme.ts
/** CSS 变量前缀 */
var CSS_VAR_PREFIX = "--theme-";
/** 主题模式属性名（挂在 <html> 上） */
var THEME_MODE_ATTR = "data-theme";
var kebabCase = (key) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
/**
* 将令牌应用到根元素上。
* @param tokens 设计令牌
* @param root   目标根元素，默认 document.documentElement
*/
function applyTheme(tokens, root = document.documentElement) {
	Object.entries(tokens).forEach(([key, value]) => {
		root.style.setProperty(`${CSS_VAR_PREFIX}${kebabCase(key)}`, value);
	});
	root.setAttribute(THEME_MODE_ATTR, tokens.mode);
}
/**
* 读取当前主题模式。
*/
function getThemeMode(root = document.documentElement) {
	return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
//#endregion
//#region ../../packages/theme/src/appContext.ts
/**
* UI 上下文 provide/inject 键
*
* koi 框架 install 时 provide 当前的 language / dimension 等，
* 子组件 inject 此键即可拿到（避免每个组件都读 store）。
*/
var ctx = {};
/** 注册主题上下文（主题框架启动时调用） */
function registerThemeContext(next) {
	ctx = {
		...ctx,
		...next
	};
}
/** 读取主题上下文（未注册返回空对象，不抛错以避免冷启动顺序问题） */
function getThemeContext() {
	return ctx;
}
/** 清空上下文（仅测试使用） */
function __resetThemeContext() {
	ctx = {};
}
var AppUiContextKey = Symbol("AppUiContext");
/**
* 读取 UI 上下文（composable）。
* 未 provide 时返回 undefined，调用方需自行 fallback 到 i18n / 默认值。
*/
function useAppUiContext() {
	return inject(AppUiContextKey, void 0);
}
//#endregion
//#region ../../packages/theme/src/themeInstallers.ts
/** themeId → 安装器 */
var installers = /* @__PURE__ */ new Map();
/** 注册主题安装器（主题框架模块顶层调用） */
function registerThemeInstaller(themeId, installer) {
	installers.set(themeId, installer);
}
/** 按 themeId 获取安装器；未注册返回 undefined */
function getThemeInstaller(themeId) {
	return installers.get(themeId);
}
//#endregion
//#region ../../packages/theme/src/announcementApi.ts
/** 已注入的实现；未注入时为 null */
var provider = null;
/**
* 注入公告接口实现（应用启动时调用一次）
*
* @param api 公告接口实现
* @return 无返回值
*/
function registerAnnouncementApi(api) {
	provider = api;
}
/**
* 获取已注入的公告接口实现
*
* @return 实现；未注入时返回 null
*/
function getAnnouncementApi() {
	return provider;
}
//#endregion
//#region ../../packages/theme/src/themeRoutes.ts
/** themeId → 基础路由组件 */
var baseComponents = /* @__PURE__ */ new Map();
/** 注册主题基础路由组件（主题框架模块顶层调用） */
function registerThemeRoutes(themeId, components) {
	baseComponents.set(themeId, components);
}
/** 按 themeId 获取基础路由组件；未注册返回 undefined */
function getThemeRoutes(themeId) {
	return baseComponents.get(themeId);
}
/**
* 获取主题错误页组件，未注册主题或主题未提供 error 时返回 undefined。
* 调用方需回退到 @repo/pages 的默认实现。
*/
function getThemeError(themeId, key) {
	return baseComponents.get(themeId)?.error?.[key];
}
var koiTheme = {
	id: "koi",
	name: "Koi 主题",
	light: {
		mode: "light",
		colorPrimary: "#6d5dfc",
		colorPrimaryHover: "#8f83fd",
		colorPrimaryActive: "#5a4bd9",
		colorBg: "#f6f7fb",
		colorBgContainer: "#ffffff",
		colorText: "#1f2430",
		colorTextSecondary: "#5c6270",
		colorBorder: "#e3e6ef",
		colorSuccess: "#2fbf71",
		colorWarning: "#f5a524",
		colorError: "#f04a5d",
		colorInfo: "#9aa3b2",
		borderRadius: "8px",
		fontSize: "14px"
	},
	dark: {
		mode: "dark",
		colorPrimary: "#7d6dff",
		colorPrimaryHover: "#9b8fff",
		colorPrimaryActive: "#6656e6",
		colorBg: "#14151f",
		colorBgContainer: "#1d1f2d",
		colorText: "#eef0f8",
		colorTextSecondary: "#a4aabc",
		colorBorder: "#33364a",
		colorSuccess: "#2fbf71",
		colorWarning: "#f5a524",
		colorError: "#f04a5d",
		colorInfo: "#7c8494",
		borderRadius: "8px",
		fontSize: "14px"
	}
};
//#endregion
//#region ../../packages/theme/src/themes/index.ts
/** 内置主题列表 */
var themes = [koiTheme];
/** 按 id 查找主题，找不到返回第一个（koi） */
function getTheme(id) {
	return themes.find((t) => t.id === id) ?? themes[0];
}
//#endregion
//#region ../../packages/theme/src/loadTheme.ts
/** themeId → 框架模块动态加载器（保持懒加载，避免打包进 @repo/theme 主包） */
var FRAMEWORK_LOADERS = { koi: () => import("./framework-BXdc0nTy.js") };
/**
* 确保指定主题的框架已加载并完成安装器注册。
* 未配置 loader 的主题视为无需框架安装器。
*/
async function loadThemeFramework(themeId) {
	const loader = FRAMEWORK_LOADERS[themeId];
	if (loader) await loader();
}
/** 加载框架并返回安装器；未注册返回 undefined */
async function resolveThemeInstaller(themeId) {
	await loadThemeFramework(themeId);
	return getThemeInstaller(themeId);
}
//#endregion
//#region ../../packages/theme/src/useTheme.ts
/**
* 主题运行时同步
*
* ┌─────────────────────────────────────────────────────────────┐
* │  设计原则：能 CSS 就不 JS                                      │
* ├─────────────────────────────────────────────────────────────┤
* │  布局主题（header / aside / menu / optimum）                  │
* │    → theme-vars.scss，切换 html class 即可，浏览器即时重算       │
* │    → 替代原 config/theme.ts + 循环 setProperty（慢、易卡顿）    │
* ├─────────────────────────────────────────────────────────────┤
* │  用户主题色 themeColor（#2992FF 等）                           │
* │    → themeColor.ts，仅写入 primary + light-1~9 + dark-2       │
* │    → EP 组件内部按 hex 解析，无法用 color-mix / rgba 替代       │
* └─────────────────────────────────────────────────────────────┘
*
* html class 与 store 映射（applyTheme）：
*   dark              ← isDark
*   header-inverted   ← headerInverted && !isDark（暗色下反转无意义，由 dark 覆盖）
*   aside-inverted    ← asideInverted && !isDark
*   layout-horizontal ← layout === "horizontal"（影响顶栏菜单是否跟随头部反转）
*   grey-mode / weak-mode ← isGrey / isWeak
*
* 菜单反转规则（与改造前 setMenuTheme 一致，现由 CSS 选择器表达）：
*   侧边栏反转：html.aside-inverted:not(.dark)
*   横向+头部/侧栏反转：html.layout-horizontal + header-inverted（侧栏反转时 theme 同步加 header-inverted）
*/
/** 保证全局只注册一次 watch，避免多处 useTheme() 重复监听 */
var themeWatcherInitialized = false;
/** 系统主题 media query */
function systemDarkQuery() {
	if (typeof window === "undefined" || !window.matchMedia) return;
	return window.matchMedia("(prefers-color-scheme: dark)");
}
/** 根据 themeMode 计算实际暗色状态 */
function resolveDarkByMode(themeMode, isDark) {
	if (themeMode === "dark") return true;
	if (themeMode === "light") return false;
	return systemDarkQuery()?.matches ?? isDark;
}
var useTheme = () => {
	const useGlobalStore = getThemeContext().useGlobalStore;
	if (!useGlobalStore) throw new Error("[theme] useGlobalStore 未注册：请在主题框架（如 koi/framework）顶层调用 registerThemeContext({ useGlobalStore })");
	const globalStore = useGlobalStore();
	const refs = storeToRefs(globalStore);
	const layout = refs.layout;
	const isDark = refs.isDark;
	const themeMode = refs.themeMode;
	const themeColor = refs.themeColor;
	const isGrey = refs.isGrey;
	const isWeak = refs.isWeak;
	const asideInverted = refs.asideInverted;
	const headerInverted = refs.headerInverted;
	const setGlobalState = (key, value) => {
		globalStore.setGlobalState?.(key, value);
	};
	/** 灰度 / 色弱：filter 作用于 body，用 class 控制即可 */
	const applyGreyOrWeak = () => {
		const html = document.documentElement;
		html.classList.toggle("grey-mode", isGrey.value);
		html.classList.toggle("weak-mode", isWeak.value);
	};
	/**
	* 核心同步：只改 class + 主题色阶
	* class 变更后 theme-vars.scss 中的变量自动切换，无需 JS 逐个 setProperty
	*/
	const applyTheme = () => {
		const html = document.documentElement;
		const effectiveDark = resolveDarkByMode(themeMode.value, isDark.value);
		if (isDark.value !== effectiveDark) setGlobalState("isDark", effectiveDark);
		html.classList.toggle("dark", effectiveDark);
		html.style.colorScheme = effectiveDark ? "dark" : "light";
		html.setAttribute("data-vxe-ui-theme", effectiveDark ? "dark" : "light");
		const effectiveHeaderInverted = headerInverted.value || layout.value === "horizontal" && asideInverted.value;
		html.classList.toggle("header-inverted", effectiveHeaderInverted && !effectiveDark);
		html.classList.toggle("aside-inverted", asideInverted.value && !effectiveDark);
		html.classList.toggle("layout-horizontal", layout.value === "horizontal");
		applyPrimaryColorVars(html, themeColor.value || "#2563C9", effectiveDark);
	};
	/** 灰度与色弱互斥，开启一项时关闭另一项 */
	const changeGreyOrWeak = (type, value) => {
		const html = document.documentElement;
		html.classList.toggle("grey-mode", type === "grey" && value);
		html.classList.toggle("weak-mode", type === "weak" && value);
		setGlobalState(type === "grey" ? "isWeak" : "isGrey", false);
	};
	if (!themeWatcherInitialized) {
		themeWatcherInitialized = true;
		watch([
			layout,
			isDark,
			themeMode,
			themeColor,
			asideInverted,
			headerInverted
		], applyTheme, { immediate: true });
		watch([isGrey, isWeak], applyGreyOrWeak, { immediate: true });
		const mql = systemDarkQuery();
		if (mql) {
			const handler = () => {
				if (themeMode.value === "auto") applyTheme();
			};
			mql.addEventListener("change", handler);
		}
	}
	/** ReReDark.vue 切换暗色时调用，实际走 applyTheme */
	const switchDark = () => {
		applyTheme();
	};
	/** 主题配置面板选色：更新 store 并重算色阶（布局 class 不变） */
	const changeThemeColor = (val) => {
		if (!val) {
			val = DEFAULT_THEME;
			ElMessage({
				type: "success",
				message: "主题颜色已重置为默认主题"
			});
		}
		setGlobalState("themeColor", val);
		applyPrimaryColorVars(document.documentElement, val, resolveDarkByMode(themeMode.value, isDark.value));
	};
	/** 设置主题模式（light / dark / auto） */
	const changeThemeMode = (mode) => {
		setGlobalState("themeMode", mode);
		if (mode === "dark") setGlobalState("isDark", true);
		else if (mode === "light") setGlobalState("isDark", false);
		else setGlobalState("isDark", systemDarkQuery()?.matches ?? false);
		applyTheme();
	};
	/** App.vue 挂载时调用，与 watch immediate 效果重叠，保留以兼容显式初始化 */
	const initThemeConfig = () => {
		applyTheme();
		applyGreyOrWeak();
	};
	return {
		initThemeConfig,
		switchDark,
		changeThemeColor,
		changeThemeMode,
		changeGreyOrWeak,
		applyTheme
	};
};
//#endregion
export { darkTokens as C, getThemeMode as S, presetTokens as T, registerThemeContext as _, themes as a, THEME_MODE_ATTR as b, getThemeRoutes as c, registerAnnouncementApi as d, getThemeInstaller as f, getThemeContext as g, __resetThemeContext as h, getTheme as i, registerThemeRoutes as l, AppUiContextKey as m, loadThemeFramework as n, koiTheme as o, registerThemeInstaller as p, resolveThemeInstaller as r, getThemeError as s, useTheme as t, getAnnouncementApi as u, useAppUiContext as v, lightTokens as w, applyTheme as x, CSS_VAR_PREFIX as y };
