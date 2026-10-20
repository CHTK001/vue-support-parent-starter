import { Gn as setUserPerms, Kn as setUserRoles, nn as getMenu, tn as getMe } from "./src-CEonioA3.js";
import { n as defineStore } from "./pinia-Dz8LpwBD.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { h as log, q as setUserInfo } from "./src-DDwlSqPX.js";
//#region ../../packages/utils/src/modules/tree.ts
/** 使用递归过滤出需要渲染在左侧菜单动态数据的列表（剔除 isVisible == 0 隐藏菜单与 remind 脱离菜单控制的行） */
function getShowStaticAndDynamicMenuList(menuList) {
	return JSON.parse(JSON.stringify(menuList)).filter((item) => {
		const remind = item.remind !== void 0 ? item.remind : item.meta?.remind;
		if (remind === true || remind === 1 || remind === "1") return false;
		const v = item.isVisible !== void 0 ? item.isVisible : item.meta?.isVisible;
		if (v == null) return true;
		return v == 1 || v === true;
	});
}
/**
* 单根炸开：当顶级只有一个一级「分组菜单」（含 children）时，把它的子菜单提升为顶级。
* 首页/工作台等非分组节点始终保留，不参与分组计数。
*
* 判定「非分组节点」：path 为 "/" 或 name 为 "layout"（首页 layout 节点）。
* @returns 新数组；不满足条件时原样返回（深拷贝后）。
*/
function applyFlattenSingleRoot(menuList) {
	const list = JSON.parse(JSON.stringify(menuList || []));
	const isHomeNode = (it) => it.path === "/" || it.name === "layout";
	const groups = list.filter((it) => !isHomeNode(it) && Array.isArray(it.children) && it.children.length > 0);
	if (groups.length !== 1) return list;
	const root = groups[0];
	return list.flatMap((it) => it === root ? it.children : [it]);
}
/** 使用递归找出所有面包屑存储到 pinia 中 */
var getAllBreadcrumbList = (menuList, parent = [], result = {}) => {
	for (const item of menuList) {
		result[item.path] = [...parent, item];
		if (item.children) getAllBreadcrumbList(item.children, result[item.path], result);
	}
	return result;
};
/** 根据 activeMenu 找到所有层级面包屑和里面的 children */
var findRouteChildrenByActiveMenu = (routes, activeMenu) => {
	const dfs = (node, path) => {
		const currentNode = { ...node };
		const currentPath = [...path, currentNode];
		if (node.path === activeMenu) return currentPath;
		if (node.children && node.children.length > 0) for (const child of node.children) {
			const result = dfs(child, currentPath);
			if (result) return result;
		}
		return null;
	};
	for (const route of routes) {
		const result = dfs(route, []);
		if (result) return result;
	}
	return null;
};
//#endregion
//#region ../../packages/pinia/src/menuResolver.ts
var MENU_RESOLVER_KEY = "__repo_pinia_menu_resolver";
function getRegistry() {
	return globalThis;
}
/** 注册菜单解析器（主题框架顶层调用） */
function registerMenuResolver(resolver) {
	getRegistry()[MENU_RESOLVER_KEY] = resolver;
}
/** 获取菜单解析器；未注册时抛错 */
function getMenuResolver() {
	const resolver = getRegistry()[MENU_RESOLVER_KEY];
	if (!resolver) throw new Error("[auth] 菜单解析器未注册，请调用 registerMenuResolver()");
	return resolver;
}
/** 是否已注册 */
function hasMenuResolver() {
	return !!getRegistry()[MENU_RESOLVER_KEY];
}
//#endregion
//#region ../../packages/pinia/src/staticMenu.ts
var staticMenu = [];
/** 注册静态菜单（应用入口调用） */
function registerStaticMenu(menus) {
	staticMenu = menus;
}
/** 获取静态菜单 */
function getStaticMenu() {
	return staticMenu;
}
/** 静态菜单别名（兼容 staticRouter 命名） */
var staticRouter = staticMenu;
//#endregion
//#region ../../packages/pinia/src/modules/auth.ts
/**
* auth store（@repo/pinia）—— 权限 / 菜单 / 用户信息
*
* 通用权限菜单状态：
*  - 菜单：项目静态菜单 + 远程动态菜单（core api），组件解析走注册的菜单解析器
*  - 用户信息：core getMe 接口
*  - 权限码同步到 core permission（v-admin / v-role / v-perm 指令）
*/
var authStore = defineStore("auth", {
	state: () => {
		return {
			menuList: [],
			recursiveMenuList: [],
			breadcrumbList: [],
			roleList: [],
			buttonList: [],
			loginUser: {
				userId: "",
				loginName: "",
				sex: "",
				avatar: "",
				avatarFrame: 0,
				avatarFrameShow: 0,
				birthday: "",
				phone: "",
				email: "",
				idCard: "",
				nickname: ""
			}
		};
	},
	actions: {
		/** 拉取菜单并写入 store；返回值表示远程菜单是否拉取失败（区别于「确实没有菜单」） */
		async listRouters(opts) {
			const { generateRoutes, generateFlattenRoutes } = getMenuResolver();
			const staticRouter = getStaticMenu();
			const mode = getConfig().route.mode;
			const useRemoteMenu = !opts?.skipRemote && (mode === "remote" || mode === "all");
			let remoteMenu = [];
			let remoteFailed = false;
			if (useRemoteMenu) try {
				const data = (await getMenu())?.data;
				if (Array.isArray(data)) remoteMenu = data;
				else remoteFailed = true;
			} catch (e) {
				remoteFailed = true;
				log.warn(`[auth] 远程菜单获取失败，使用静态菜单`, e);
			}
			this.menuList = generateFlattenRoutes(remoteMenu);
			const visibleStaticMenus = getShowStaticAndDynamicMenuList(staticRouter);
			const baseMenus = remoteMenu.length ? visibleStaticMenus.filter((item) => item?.meta?.isRemoteFallback !== true) : visibleStaticMenus;
			let mergedMenu = baseMenus.concat(generateRoutes(getShowStaticAndDynamicMenuList(remoteMenu), 0, { visibleOnly: true }));
			if (getConfig().menu.flattenSingleRoot) mergedMenu = applyFlattenSingleRoot(mergedMenu);
			this.recursiveMenuList = mergedMenu;
			this.breadcrumbList = baseMenus.concat(generateRoutes(remoteMenu, 0));
			return remoteFailed;
		},
		/** loading=false 时静默刷新（不触发顶部进度条） */
		async getLoginUserInfo(loading = true) {
			try {
				const data = (await getMe(loading))?.data;
				if (data) {
					this.roleList = data.roles ?? data.roleInfos?.map((r) => r.roleCode) ?? [];
					this.buttonList = data.perms ?? [];
					this.loginUser = {
						userId: data.sysUserId ?? data.userId ?? "",
						loginName: data.sysUserUsername ?? data.username ?? data.loginName ?? "",
						sex: data.sex ?? "",
						avatar: data.avatar ?? data.sysUserAvatar ?? "",
						avatarFrame: data.sysUserAvatarFrame ?? data.avatarFrame ?? 0,
						avatarFrameShow: data.sysUserAvatarFrameShow ?? data.avatarFrameShow ?? 0,
						birthday: data.sysUserBirthday ?? data.birthday ?? "",
						phone: data.sysUserPhone ?? data.phone ?? "",
						email: data.sysUserEmail ?? data.email ?? "",
						idCard: data.sysUserCard ?? data.idCard ?? "",
						nickname: data.sysUserNickname ?? data.nickname ?? ""
					};
					setUserRoles(this.roleList);
					setUserPerms(this.buttonList);
					setUserInfo(data);
				}
			} catch (e) {
				log.warn(`[auth] 用户信息获取失败，跳过`, e);
			}
		}
	},
	getters: {
		getButtonList: (state) => state.buttonList,
		getMenuList: (state) => state.menuList,
		showMenuList: (state) => state.recursiveMenuList,
		getBreadcrumbList: (state) => getAllBreadcrumbList(state.breadcrumbList)
	}
});
//#endregion
export { getMenuResolver as a, applyFlattenSingleRoot as c, getShowStaticAndDynamicMenuList as d, staticRouter as i, findRouteChildrenByActiveMenu as l, getStaticMenu as n, hasMenuResolver as o, registerStaticMenu as r, registerMenuResolver as s, authStore as t, getAllBreadcrumbList as u };
