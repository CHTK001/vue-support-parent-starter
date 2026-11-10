import { et as createVNode, p as render } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { jt as dist_exports } from "./dist-Cml_NEAM.js";
import { _ as registerThemeContext, l as registerThemeRoutes, m as AppUiContextKey, p as registerThemeInstaller, t as useTheme } from "./src-VuENbyAX.js";
import { t as element_plus_default } from "./es-BernUpY0.js";
import { g as storeToRefs } from "./pinia-BWfHBnKe.js";
import { c as CACHE_PREFIX, d as LOGIN_URL, f as ROUTER_WHITE_LIST, n as getConfig, p as SVG_PREFIX, u as HOME_URL } from "./src-BMpqrrtG.js";
import { A as noticeInfo, C as msgError, D as msgWarning, E as msgSuccess, M as noticeWarning, O as notice, P as getApiHttp, S as msgBoxPrompt, T as msgPrimary, _ as translateConfigText, b as msgBox, d as createMenuRouteResolver, g as i18n, h as getMenuLanguage, j as noticeSuccess, k as noticeError, t as setupCommonDirectives, w as msgInfo, x as msgBoxAlert, y as msg } from "./src-Dc9rf7oI.js";
import { n as useScreenStore } from "./src-RZAlNKAF.js";
import { _ as setRouter, a as forceRelogin, c as authStore, d as registerStaticMenu, g as getRouter, i as keepAliveStore, l as userStore, m as globalStore, n as tabsStore, o as initAuthRouter, p as registerMenuResolver, r as getEnv, s as resetRouter, t as pinia, u as getStaticMenu } from "./src-DOdDDQCh.js";
import { n as themed } from "./ReIcon-JYodhTNZ.js";
import { t as zh_cn_default } from "./zh-cn-5Oog9lo1.js";
import { n as themed$1 } from "./ReScrollNav-DLr4tkfD.js";
import { n as themed$2 } from "./ReDrawer-B1F83HMj.js";
import { n as themed$3 } from "./ReDialog-CB8z3gbZ.js";
import "D:/ch/project/vue-support-parent-starter/node_modules/.pnpm/element-plus@2.14.7_vue@3.5.45_typescript@5.9.3_/node_modules/element-plus/dist/index.css";
import "D:/ch/project/vue-support-parent-starter/node_modules/.pnpm/element-plus@2.14.7_vue@3.5.45_typescript@5.9.3_/node_modules/element-plus/theme-chalk/dark/css-vars.css";
import "D:/ch/project/vue-support-parent-starter/node_modules/.pnpm/animate.css@4.1.1/node_modules/animate.css/animate.css";
import "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/styles/index.scss";
import { defaultLogoUrl, resolveAssetUrl } from "@repo/assets";
import ReForcedLoginHost from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/forcedLogin/ReForcedLogin.vue";
import KoiLayout, { default as KoiLayout$1 } from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/layouts/index.vue";
import LoginView, { default as loginView } from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/views/login/index.vue";
import HomeView from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/views/home/index.vue";
import MineView from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/views/mine/index.vue";
import Koi403Page from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/views/error/403.vue";
import Koi404Page from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/views/error/404.vue";
import Koi500Page from "D:/ch/project/vue-support-parent-starter/packages/theme/src/themes/koi/views/error/500.vue";
//#region ../../packages/theme/src/themes/koi/layouts/useLayoutTitle.ts
/**
* 页面标题解析（koi 主题）
*
* 首页等基础路由的 meta 只有占位 title（如 "home"）且无图标，
* 统一从菜单树补齐标题并通过 getMenuLanguage 翻译，保证
* 浏览器标签页标题与侧边栏/Tab 一致。
*/
/** 在递归菜单树中按路径精确查找菜单 meta */
function findMetaExact(menus, targetPath) {
	if (!Array.isArray(menus) || !targetPath) return null;
	for (const menu of menus) {
		if (String(menu?.path) === String(targetPath)) return menu.meta || null;
		if (menu?.children) {
			const child = findMetaExact(menu.children, targetPath);
			if (child) return child;
		}
	}
	return null;
}
/** 在递归菜单树中按前缀查找菜单 meta（最长前缀优先，参数路由兜底） */
function findMetaByPrefix(menus, targetPath) {
	if (!Array.isArray(menus) || !targetPath) return null;
	let bestMatch = null;
	let bestLen = 0;
	const walk = (items) => {
		for (const menu of items) {
			const menuPath = String(menu?.path || "");
			if (menuPath && menuPath !== "/" && targetPath.startsWith(menuPath + "/")) {
				if (menuPath.length > bestLen) {
					bestLen = menuPath.length;
					bestMatch = menu.meta || null;
				}
			}
			if (menu?.children) walk(menu.children);
		}
	};
	walk(menus);
	return bestMatch;
}
/**
* 在递归菜单树中按路径查找菜单 meta
* 支持精确匹配 → 前缀匹配（参数路由如 /system/user/123 匹配 /system/user）
*/
function findMenuMetaByPath(menus, targetPath) {
	const exact = findMetaExact(menus, targetPath);
	if (exact) return exact;
	return findMetaByPrefix(menus, targetPath);
}
/**
* 解析页面标题：优先路由 meta.title（首页占位 "home" 视为无效），
* 否则回退菜单树标题，再经 getMenuLanguage 翻译。
* @param routePath 路由路径（路由记录 path，参数路由为原始模式串）
* @param metaTitle 路由 meta.title
*/
function resolvePageTitle(routePath, metaTitle, activeMenu) {
	const cfg = getConfig();
	if (routePath === cfg.route.loginPath) return translateConfigText(cfg.login.title) || cfg.login.brandName || "login";
	const authStore$1 = authStore();
	const menuMeta = activeMenu ? findMenuMetaByPath(authStore$1.recursiveMenuList, activeMenu) : null;
	const fallbackMeta = !menuMeta ? findMenuMetaByPath(authStore$1.recursiveMenuList, routePath) : null;
	const title = metaTitle && metaTitle !== "home" ? metaTitle : (menuMeta || fallbackMeta)?.title ?? "";
	const finalTitle = getMenuLanguage(title ?? "");
	return finalTitle === "home" || !finalTitle ? "" : finalTitle;
}
/** 同步浏览器标签页图标（favicon）：跟随 app.yaml loginConfig.logoUrl，未配置则回退打包 logo */
function setDocumentFavicon() {
	try {
		const logoUrl = getConfig().login.logoUrl;
		const resolved = logoUrl ? resolveAssetUrl(logoUrl) : defaultLogoUrl;
		let icon = document.querySelector("link[rel=\"icon\"]");
		if (!icon) {
			icon = document.createElement("link");
			icon.rel = "icon";
			document.head.appendChild(icon);
		}
		icon.href = resolved;
	} catch {}
}
/** 设置浏览器标题：`页面标题 - 应用标题`，应用标题缺省用 config.app.title */
function setDocumentTitle(routePath, metaTitle, activeMenu) {
	const appTitle = getConfig().app.title;
	const title = resolvePageTitle(routePath, metaTitle, activeMenu);
	document.title = title && title !== appTitle ? `${title} - ${appTitle}` : appTitle;
}
//#endregion
//#region ../../packages/theme/src/themes/koi/forcedLogin.ts
/** 窗口级登录锁（一条窗口内同时只有一个强制登录弹窗在展示） */
var lockOpen = false;
/** 当前展示的强制登录弹窗宿主（关闭时用来销毁挂载点） */
var host = null;
/** 重置宿主状态（弹窗关闭时调用） */
function resetHost() {
	lockOpen = false;
	host = null;
	if (typeof window !== "undefined") window.__reForcedLoginOpen = false;
}
/** 窗口存在标志（避免 SSR / 非浏览器运行时重复创建代入宿） */
var fallbackService = { show: () => {} };
/**
* 把强制登录弹窗服务注册到 window 上（key 与 `win.__reIcon` 同风格）
*
* @param app 主题的安装器传入的应用实例（提供 appContext 供弹窗共享 pinia/i18n/router）
* @returns 当前窗口的强制登录服务（已经存在则不变）
*/
function installForcedLogin(app) {
	const win = typeof window !== "undefined" ? window : void 0;
	if (!win) return fallbackService;
	if (win.__reForcedLogin) return win.__reForcedLogin;
	const ctx = app._context;
	const service = { show(callbacks = {}) {
		if (lockOpen) return;
		lockOpen = true;
		win.__reForcedLoginOpen = true;
		if (host) {
			try {
				render(null, host.container);
			} catch {}
			host = null;
		}
		const container = document.createElement("div");
		container.setAttribute("data-forced-login-host", "");
		document.body.appendChild(container);
		const vnode = createVNode(ReForcedLoginHost, {
			onLogin: () => {
				callbacks.onLogin?.();
				resetHost();
			},
			onClose: () => {
				callbacks.onClose?.();
				resetHost();
			}
		});
		vnode.appContext = ctx;
		render(vnode, container);
		host = {
			vnode,
			container
		};
	} };
	win.__reForcedLogin = service;
	return service;
}
//#endregion
//#region ../../packages/theme/src/themes/koi/install.ts
async function installKoi(app, options = {}) {
	const { router, elementPlus = true, elementIcons = true } = options;
	if (elementPlus) app.use(element_plus_default, { locale: zh_cn_default });
	if (elementIcons) for (const [key, component] of Object.entries(dist_exports)) app.component(key, component);
	await installUiComponents(app);
	installForcedLogin(app);
	setupCommonDirectives(app);
	if (router) {
		setRouter(router);
		router.beforeEach((to) => {
			setDocumentTitle(to.path, to.meta?.title, to.meta?.activeMenu);
			setDocumentFavicon();
		});
	}
	provideAppUiContextWithStore(app);
	return app;
}
/** 异步注册 ReXxx 主题化组件（避免阻塞 installKoi 同步流程） */
async function installUiComponents(app) {
	await Promise.allSettled([
		themed.install(app),
		themed$1.install(app),
		themed$2.install(app),
		themed$3.install(app)
	]);
}
/**
* 把 koi globalStore 的语言 / 尺寸（响应式 ref）注入公共 App。
* 注意：必须在 app.use(pinia) 之后调用（@repo/app createApp 已注册 pinia）。
*/
function provideAppUiContextWithStore(app) {
	const globalStore$1 = globalStore();
	const { language, dimension } = storeToRefs(globalStore$1);
	app.provide(AppUiContextKey, {
		language,
		dimension
	});
}
//#endregion
//#region ../../packages/theme/src/themes/koi/settings.ts
/** 安全读取 vite 环境变量（非 vite 环境或未配置时返回默认值） */
var env = (key, fallback = "") => {
	return import.meta.env?.[key] ?? fallback;
};
var settings_default = {
	/**
	* 网页标题
	*/
	logoTitle: env("VITE_WEB_TITLE", "ADMIN"),
	/**
	* 网页英文标题
	*/
	logoEnTitle: env("VITE_WEB_EN_TITLE", "ADMIN"),
	/**
	* 网页标题大小
	*/
	loginTitleSize: 18,
	/**
	* 登录页面标题
	*/
	loginTitle: env("VITE_LOGIN_TITLE", "ADMIN"),
	/**
	* 登录页面英文标题
	*/
	loginEnTitle: env("VITE_LOGIN_EN_TITLE", "ADMIN"),
	/**
	* Logo大小
	*/
	logoSize: "34px",
	/**
	* Logo地址
	*/
	/**
	* 是否显示Logo和网页标题[true-显示，false-隐藏]
	*/
	logoShow: true,
	/**
	* 管理平台标题动画
	*/
	logoTitleAnimate: "",
	/**
	* 左侧菜单动画
	*/
	menuAnimate: "animate__animated animate__fadeInLeft",
	/**
	* 左侧折叠宽度
	*/
	asideMenuCollapseWidth: "56px",
	/**
	* 左侧悬浮折叠宽度
	*/
	asideMenuHoverCollapse: "60px",
	/**
	* 左侧折叠宽度[双栏布局]
	*/
	columnMenuCollapseWidth: "56px",
	/**
	* 左侧悬浮折叠宽度[双栏布局]
	*/
	columnMenuHoverCollapse: "56px",
	/**
	* 左侧菜单展开宽度[Group 布局：分组轨]
	*/
	groupMenuWidth: "224px"
};
//#endregion
//#region ../../packages/theme/src/themes/koi/framework.ts
registerThemeContext({ useGlobalStore: globalStore });
registerThemeInstaller("koi", async (app, context) => {
	if (!getStaticMenu().length) registerStaticMenu([{
		path: "/",
		name: "layout",
		redirect: "/home",
		meta: {
			title: "menu.home.auth",
			icon: "koi-home",
			isVisible: "1"
		},
		children: [{
			path: "/home",
			name: "homePage",
			meta: {
				title: "menu.home.work.name",
				icon: "koi-work",
				isVisible: "1"
			}
		}]
	}]);
	const { router } = context ?? {};
	await installKoi(app, { router });
});
registerThemeRoutes("koi", {
	layout: KoiLayout$1,
	login: LoginView,
	home: HomeView,
	mine: MineView,
	error: {
		forbidden: Koi403Page,
		notFound: Koi404Page,
		serverError: Koi500Page
	}
});
registerMenuResolver(createMenuRouteResolver({
	viewModules: import.meta.glob("../views/**/*.vue"),
	layoutComponent: KoiLayout$1,
	notFoundComponent: () => import("D:/ch/project/vue-support-parent-starter/packages/pages/src/error/404.vue")
}));
//#endregion
export { CACHE_PREFIX, HOME_URL, KoiLayout, LOGIN_URL, ROUTER_WHITE_LIST, SVG_PREFIX, installKoi as default, installKoi, forceRelogin, getEnv, getStaticMenu, initAuthRouter as initDynamicRouter, getApiHttp as koi, i18n as koiI18n, pinia as koiPinia, getRouter as koiRouter, settings_default as koiSettings, loginView, msg, msgBox, msgBoxAlert, msgBoxPrompt, msgError, msgInfo, msgPrimary, msgSuccess, msgWarning, notice, noticeError, noticeInfo, noticeSuccess, noticeWarning, resetRouter, setupCommonDirectives, authStore as useAuthStore, globalStore as useGlobalStore, keepAliveStore as useKeepAliveStore, useScreenStore, tabsStore as useTabsStore, useTheme, userStore as useUserStore };
