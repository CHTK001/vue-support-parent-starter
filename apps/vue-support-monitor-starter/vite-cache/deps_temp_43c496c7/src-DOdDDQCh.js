import { i as defineStore, r as createPinia } from "./pinia-BWfHBnKe.js";
import { c as CACHE_PREFIX, l as DEFAULT_THEME, n as getConfig, r as getCurrentUserId } from "./src-BMpqrrtG.js";
import { D as msgWarning, I as getMe, L as getMenu, X as setUserPerms, Z as setUserRoles, f as initDynamicRoutes } from "./src-Dc9rf7oI.js";
import { B as browserLocalStorage, E as clearAllAuthData, F as setAccessToken, H as createStorage, L as setRefreshToken, R as setUserInfo, d as log, j as getFrameworkStorage } from "./src-RZAlNKAF.js";
import { t as createPersistedState } from "./dist-CMJ6_myj.js";
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
//#endregion
//#region ../../packages/core/src/router/inject.ts
var routerInstance = null;
/** 注入 router（createApp / 应用入口调用） */
function setRouter(router) {
	routerInstance = router;
}
/** 获取 router；未注入时抛错 */
function getRouter() {
	if (!routerInstance) throw new Error("[core] router 未注入，请先调用 setRouter()");
	return routerInstance;
}
//#endregion
//#region ../../packages/core/src/router/menuSeed.ts
/**
* 菜单灌入时机策略（core）
*
* <p>背景 —— 修「左侧菜单有时加载不出来」：</p>
* <p>侧边栏数据源 {@code authStore.recursiveMenuList} 只有 {@code authStore.listRouters()}
* 一处会写，而它在框架里只有三个触发点：</p>
* <ol>
*   <li>{@code createVueApp} 的启动灌入 —— 仅 {@code app.openAuth=false} 时执行；</li>
*   <li>路由守卫的 {@code loadRemoteRoutes → initAuthRouter} —— 仅
*       {@code route.mode} 为 remote/all 时执行；</li>
*   <li>主题里的手动动作（顶栏刷新按钮 / 用户菜单「清缓存」）。</li>
* </ol>
*
* <p>于是「{@code openAuth=true} + {@code route.mode=static/module}」这类应用
* （框架默认配置正是这个组合）在前两条上都落空：</p>
* <ul>
*   <li>带令牌整页刷新：① 因 openAuth=true 跳过、② 因非 remote/all 跳过 → 没人灌菜单；</li>
*   <li>SPA 内登录：登录流程只调 {@code initAuthRouter}，static 分支同样不灌 → 没人灌菜单。</li>
* </ul>
*
* <p>表现即「左侧菜单有时加载不出来」：只有用户手动点过顶栏刷新 / 清过缓存
* 菜单才会出现，能不能出来纯看操作顺序。</p>
*
* <p>本模块给出<b>唯一</b>判定，供启动灌入（{@code turbo/app/createVueApp}）与
* 登录后灌入（{@code @repo/pinia authRouter}）共用，避免两处各写一遍
* {@code mode === "remote" || mode === "all"} 而随时间漂移。</p>
*
* @since 4.0.0
*/
/**
* 菜单是否由路由守卫负责拉取（remote / all 模式走 loadRemoteRoutes → initAuthRouter）。
*
* <p>与 {@code core/router/guard.ts} 的 {@code isRemote} 判定保持一致：
* 这两种模式下守卫会在导航时按需拉远程菜单并处理「拉取失败强制重登」，
* 应用侧再插手灌一次只会重复拉取，还可能绕开失败降级逻辑。</p>
*
* @param mode config.route.mode（缺省时按框架默认 static 处理）
* @returns true 表示守卫负责，应用侧不该在启动/登录时插手
*/
function isGuardOwnedMenuMode(mode) {
	return mode === "remote" || mode === "all";
}
//#endregion
//#region ../../packages/pinia/src/modules/global.ts
/**
* global store（@repo/pinia）—— 全局布局 / 主题 / 交互状态
*
* 迁移自 koi/stores/modules/global.ts，通用化供任何主题复用。
*
* 持久化 key 由 @repo/config.getStorageKey("global") 统一加前缀，
* 避免不同 app 在同域名下串数据。
*/
/** 一次性迁移标记：历史默认布局为 group，系统默认导航应为垂直(vertical) */
var LAYOUT_DEFAULT_MIGRATION_KEY = "layout-default-vertical-v1";
/**
* 一次性迁移标记：标签栏恢复显示。
*
* 标签栏显隐原先没有默认值收敛，历史版本里 `isTabsShown=false` 一旦落盘就永久生效，
* 用户看到的是「顶部标签栏默认不显示、也不常显」，且设置面板外没有任何提示。
* 这里只在首次遇到该标记时把值纠正为 true，之后用户手动关闭照常持久化。
*/
var TABS_SHOWN_MIGRATION_KEY = "tabs-shown-default-on-v1";
var globalStore = defineStore("global", {
	persist: {
		key: "global",
		afterHydrate: (ctx) => {
			try {
				const storage = getFrameworkStorage();
				if (!storage.get(LAYOUT_DEFAULT_MIGRATION_KEY)) {
					ctx.store.layout = "vertical";
					storage.set(LAYOUT_DEFAULT_MIGRATION_KEY, true);
				}
				if (!storage.get(TABS_SHOWN_MIGRATION_KEY)) {
					ctx.store.isTabsShown = true;
					storage.set(TABS_SHOWN_MIGRATION_KEY, true);
				}
			} catch {}
		}
	},
	state: () => {
		return {
			isFullScreen: false,
			isCollapse: false,
			isColumnFirstCollapse: false,
			menuWidth: 220,
			isDark: false,
			/** 主题模式：light=明亮 / dark=黑暗 / auto=跟随系统 */
			themeMode: "light",
			dimension: "default",
			maximize: false,
			language: "zh",
			themeColor: DEFAULT_THEME,
			layout: "vertical",
			tabsStyle: "google",
			transition: "none",
			/** 登录页样式，取值见 themes/koi/views/login/loginStyles.ts 的 loginStyleOptions */
			loginStyle: "default",
			uniqueOpened: true,
			isGrey: false,
			isWeak: false,
			asideInverted: false,
			headerInverted: false,
			isHeaderShown: true,
			isTabsShown: true
		};
	},
	actions: {
		setGlobalState(...args) {
			this.$patch({ [args[0]]: args[1] });
		},
		setCollapse(value) {
			this.isCollapse = value;
			return this.isCollapse;
		},
		setColumnFirstCollapse(value) {
			this.isColumnFirstCollapse = value;
			return this.isColumnFirstCollapse;
		},
		setMenuWidth(value) {
			this.menuWidth = value;
			return this.menuWidth;
		},
		setDimension(value) {
			this.dimension = value;
		}
	},
	getters: {}
});
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
//#endregion
//#region ../../packages/pinia/src/modules/user.ts
/**
* user store（@repo/pinia）—— 用户令牌 / 登录信息 / 登录登出
*
* 登录逻辑统一走 core 的 api 封装（登录/登出/刷新 token/用户信息），
* 令牌持久化用 core 的 storage + token 配置。任何主题/应用复用同一套。
*/
var userStore = defineStore("user", {
	persist: { key: CACHE_PREFIX + "user" },
	state: () => {
		return {
			token: "",
			accessToken: "",
			refreshToken: "",
			expires: 0,
			username: "",
			nickname: "",
			avatar: "",
			roles: [],
			perms: [],
			userInfo: {}
		};
	},
	actions: {
		/** 设置登录态（登录/刷新成功后调用） */
		setToken(data) {
			const { accessToken, refreshToken, expires, username, nickname, avatar, roles, perms, userInfo } = data;
			this.accessToken = accessToken || "";
			this.refreshToken = refreshToken || "";
			this.expires = expires || 0;
			this.token = accessToken || "";
			this.username = username || "";
			this.nickname = nickname || "";
			this.avatar = avatar || "";
			this.roles = roles || [];
			this.perms = perms || [];
			this.userInfo = userInfo || {};
			if (accessToken) setAccessToken(accessToken);
			if (refreshToken) setRefreshToken(refreshToken);
			if (userInfo && Object.keys(userInfo).length > 0) setUserInfo(userInfo);
		},
		/** 登录（走 core api） */
		async loginByUsername(data) {
			const { login, setUserRoles, setUserPerms, refreshDefaultSetting } = await import("./src-BoUozT5Q.js");
			const res = await login(data);
			const result = res?.data;
			if (!result) throw new Error(res?.msg || "账号或密码错误");
			this.setToken(result);
			if (result.roles?.length) setUserRoles(result.roles);
			if (result.perms?.length) setUserPerms(result.perms);
			refreshDefaultSetting();
			return result;
		},
		/** 刷新 token */
		async refreshToken() {
			const { refreshToken, setUserRoles, setUserPerms } = await import("./src-BoUozT5Q.js");
			const result = (await refreshToken({ refreshToken: this.refreshToken }))?.data;
			if (result) {
				this.setToken(result);
				if (result.roles?.length) setUserRoles(result.roles);
				if (result.perms?.length) setUserPerms(result.perms);
			}
			return result;
		},
		/** 登出 */
		async logOut() {
			const { logout, invalidateSessionScope, resetActiveBaseUrl } = await import("./src-BoUozT5Q.js");
			invalidateSessionScope();
			try {
				await logout({});
			} catch {}
			resetActiveBaseUrl();
			this.$reset();
			clearAllAuthData();
		},
		setLoginName(loginName) {
			this.username = loginName;
		},
		/** 获取 accessToken（供 axios 拦截器） */
		getAccessToken() {
			return this.accessToken || this.token;
		}
	},
	getters: {}
});
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
//#region ../../packages/pinia/src/authRouter.ts
/** 权限异常：清空 token 与权限缓存，回登录页 */
var forceRelogin = async (router, message) => {
	console.log("[AUTH] forceRelogin called", message ?? "(no message)");
	const userStore$1 = userStore();
	const authStore$1 = authStore();
	userStore$1.$reset();
	authStore$1.$reset();
	clearAllAuthData();
	if (message) msgWarning(message);
	const loginPath = getConfig().route.loginPath || "/login";
	if (router.currentRoute.value.path !== loginPath) await router.replace(loginPath);
};
/** 初始化动态路由：拉取菜单 + 注册到 layout（复用 core 通用逻辑） */
var initAuthRouter = async (router) => {
	console.log("[AUTH] initAuthRouter start for", router.currentRoute.value.path);
	const authStore$2 = authStore();
	const mode = getConfig().route.mode;
	const useRemoteMenu = isGuardOwnedMenuMode(mode);
	const context = {
		getMenuList: () => authStore$2.menuList,
		loadMenus: useRemoteMenu ? async () => {
			const [menu] = await Promise.allSettled([authStore$2.listRouters(), authStore$2.getLoginUserInfo()]);
			if (menu.status === "rejected" || menu.value === true) throw new Error("远程菜单拉取失败");
		} : void 0,
		onForceRelogin: (message) => forceRelogin(router, message),
		notify: (message) => {
			if (useRemoteMenu) msgWarning(message);
		}
	};
	if (!useRemoteMenu) {
		await authStore$2.listRouters();
		authStore$2.getLoginUserInfo().catch(() => {});
	}
	return initDynamicRoutes(router, context);
};
/** 重置路由（登出 / 切号时移除动态注册的路由） */
var resetRouter = () => {
	const menuList = authStore().getMenuList;
	if (!menuList.length) return;
	menuList.forEach((route) => {
		const { name } = route;
		if (name && getRouter().hasRoute(name)) getRouter().removeRoute(name);
	});
};
//#endregion
//#region ../../packages/pinia/src/modules/keepAlive.ts
/**
* keepAlive store（@repo/pinia）—— 页面缓存名称列表
*
* 迁移自 koi/stores/modules/keepAlive.ts，通用化供任何主题复用。
*/
var keepAliveStore = defineStore("keepAlive", {
	persist: { key: CACHE_PREFIX + "keepAlive" },
	state: () => {
		return { keepAliveName: [] };
	},
	actions: {
		async addKeepAliveName(name) {
			if (name && !this.keepAliveName.includes(name)) this.keepAliveName.push(name);
		},
		async removeKeepAliveName(name) {
			this.keepAliveName = this.keepAliveName.filter((item) => item !== name);
		},
		async setKeepAliveName(keepAliveName = []) {
			this.keepAliveName = keepAliveName;
		}
	},
	getters: {}
});
//#endregion
//#region ../../packages/env/src/index.ts
/** 获取 vite 环境变量对象（非 vite 环境返回空对象） */
var getMetaEnv = () => {
	return import.meta.env ?? {};
};
/** 读取环境变量，未配置时返回默认值 */
var getEnv = (key, fallback = "") => {
	return getMetaEnv()[key] ?? fallback;
};
/** 当前路由模式（hash / history），由 VITE_ROUTER_MODE 决定，默认 hash */
var getRouterMode = () => getEnv("VITE_ROUTER_MODE") === "history" ? "history" : "hash";
/** 获取不同路由模式所对应的 url + params */
var getUrlWithParams = () => {
	return {
		hash: location.hash.substring(1),
		history: location.pathname + location.search
	}[getRouterMode()];
};
//#endregion
//#region ../../packages/pinia/src/modules/tabs.ts
/**
* tabs store（@repo/pinia）—— 标签页状态
*
* 迁移自 koi/stores/modules/tabs.ts，通用化供任何主题复用。
*/
var tabsStore = defineStore("tabs", {
	persist: { key: "tabs" },
	state: () => {
		return { tabList: [] };
	},
	actions: {
		async addTab(tab) {
			const keepAliveStore$1 = keepAliveStore();
			const keepAliveName = tab.keepAliveName ?? tab.name;
			if (tab.isKeepAlive && keepAliveName && !keepAliveStore$1.keepAliveName.includes(keepAliveName)) keepAliveStore$1.addKeepAliveName(keepAliveName);
			if (this.tabList.some((item) => item.path === tab.path)) return;
			this.tabList.push(tab);
		},
		async removeTab(tabPath, isCurrent = true, selectedPath) {
			if (tabPath == "/home") {
				msgWarning("禁止关闭");
				return;
			}
			const keepAliveStore$2 = keepAliveStore();
			const tabItem = this.tabList.find((item) => item.path === tabPath);
			if (tabItem?.isKeepAlive) keepAliveStore$2.removeKeepAliveName(tabItem.keepAliveName ?? tabItem.name);
			const oldTabList = [...this.tabList];
			this.tabList = this.tabList.filter((item) => item.path !== tabPath);
			if (isCurrent) oldTabList.forEach((item, index) => {
				if (item.path !== tabPath) return;
				const nextTab = oldTabList[index + 1] || oldTabList[index - 1];
				if (!nextTab) return;
				getRouter().push(nextTab.path || "/home");
			});
			else {
				const matchingPathObject = this.tabList.find((item) => item.path == selectedPath);
				if (matchingPathObject) {
					getRouter().push(matchingPathObject?.path || "/home");
					return;
				}
			}
		},
		async setTab(tabList) {
			this.tabList = tabList;
		},
		async setTabTitle(title) {
			this.tabList.forEach((item) => {
				if (item.path == getUrlWithParams()) item.title = title;
			});
		},
		async closeSideTabs(path, type) {
			const keepAliveStore$3 = keepAliveStore();
			const currentIndex = this.tabList.findIndex((item) => item.path === path);
			if (currentIndex !== -1) {
				const range = type === "left" ? [0, currentIndex] : [currentIndex + 1, this.tabList.length];
				this.tabList = this.tabList.filter((item, index) => {
					return index < range[0] || index >= range[1] || item.isAffix === "1";
				});
				const fixedTabs = this.tabList.filter((item) => item.isAffix === "1");
				if (type === "left") {
					const nextTab = this.tabList[fixedTabs.length];
					getRouter().push(nextTab?.path);
				}
				if (type === "right") {
					const nextTab = this.tabList[currentIndex] || this.tabList[currentIndex + 1] || this.tabList[currentIndex - 1];
					getRouter().push(nextTab?.path);
				}
			}
			const keepAliveList = this.tabList.filter((item) => item.isKeepAlive);
			keepAliveStore$3.setKeepAliveName(keepAliveList.map((item) => item.keepAliveName ?? item.name));
		},
		async closeManyTabs(tabValue) {
			const keepAliveStore$4 = keepAliveStore();
			this.tabList = this.tabList.filter((item) => {
				return item.path === tabValue || item.isAffix === "1";
			});
			const keepAliveList = this.tabList.filter((item) => item.isKeepAlive);
			keepAliveStore$4.setKeepAliveName(keepAliveList.map((item) => item.keepAliveName ?? item.name));
		},
		async replaceIsAffix(tabPath, isAffix) {
			this.tabList.forEach((item) => {
				if (item.path == tabPath && isAffix !== void 0) item.isAffix = isAffix;
			});
		}
	},
	getters: { getTabs(state) {
		return state.tabList;
	} }
});
//#endregion
//#region ../../packages/pinia/src/modules/message.ts
/**
* message store（@repo/pinia）—— 站内消息全局状态
*
* 统一管理当前用户站内消息（列表 / 未读数 / 已读游标），
* 通过 core 的 stationMessageAdapter（HTTP 接口）拉取与标记已读，
* 不依赖 Socket；实时推送由 Socket 订阅回调写入 store。
*
* 用法：
*   import { useMessageStore } from "@repo/pinia";
*   const store = useMessageStore();
*   await store.loadHistory();      // 拉取分页历史
*   await store.refreshUnread();    // 刷新未读数
*   await store.markAllRead();      // 全部已读
*   store.push({ subject, content }); // 实时推送回调写入
*/
/** 消息列表最大保留条数 */
var MAX_MESSAGES = 50;
defineStore("message", {
	persist: { key: CACHE_PREFIX + "message" },
	state: () => {
		return {
			/** 站内消息列表（时间倒序，最新在前） */
			messages: [],
			/** 未读数 */
			unread: 0,
			/** 服务端已读游标（lastReadId） */
			lastReadId: void 0,
			/** 是否加载中 */
			loading: false,
			/** 已初始化（拉取过历史） */
			initialized: false
		};
	},
	getters: { 
	/** 最新一条消息 */
latest(state) {
		return state.messages[0] ?? null;
	} },
	actions: {
		/** 拉取历史消息（注入 adapter 后可用） */
		async loadHistory(page = 1, pageSize = 20) {
			const { getStationMessageAdapter } = await import("./src-BoUozT5Q.js");
			const adapter = getStationMessageAdapter();
			if (!adapter?.loadHistory) return;
			this.loading = true;
			try {
				const result = await adapter.loadHistory({
					cursor: this.lastReadId,
					page,
					pageSize
				});
				if (result.lastReadId !== void 0) this.lastReadId = result.lastReadId;
				if (result.list?.length) {
					const fetched = result.list;
					const fetchedIds = new Set(fetched.map((m) => m.id));
					const minFetchedId = fetched.reduce((mn, m) => typeof m.id === "number" && m.id < mn ? m.id : mn, Number.POSITIVE_INFINITY);
					const merged = [];
					for (const fresh of fetched) merged.push(fresh);
					for (const old of this.messages) {
						if (fetchedIds.has(old.id)) continue;
						if (page === 1 && Number.isFinite(minFetchedId) && typeof old.id === "number" && old.id >= minFetchedId) continue;
						merged.push(old);
					}
					this.messages = merged.slice(0, MAX_MESSAGES);
				}
				this.initialized = true;
			} finally {
				this.loading = false;
			}
		},
		/** 刷新未读数（注入 adapter 后可用） */
		async refreshUnread() {
			const { getStationMessageAdapter } = await import("./src-BoUozT5Q.js");
			const adapter = getStationMessageAdapter();
			if (!adapter?.getUnreadCount) return this.unread;
			try {
				this.unread = await adapter.getUnreadCount();
			} catch {}
			return this.unread;
		},
		/** 标记已读（注入 adapter 后可用；lastId 为空表示全部已读） */
		async markAllRead(lastId) {
			const { getStationMessageAdapter } = await import("./src-BoUozT5Q.js");
			const adapter = getStationMessageAdapter();
			if (!adapter?.markRead) return;
			try {
				await adapter.markRead(lastId ?? this.latest?.id ?? this.lastReadId);
				const cursor = lastId ?? this.latest?.id ?? this.lastReadId;
				this.messages = this.messages.map((m) => {
					return cursor === void 0 || cursor === null || m.id !== void 0 && m.id <= cursor ? {
						...m,
						readStatus: 1,
						isRead: true
					} : m;
				});
				this.unread = cursor === void 0 || cursor === null ? 0 : this.messages.filter((m) => m.readStatus !== 1).length;
			} catch {}
			return this.unread;
		},
		/** 实时推送回调写入一条新消息（最新在前，未读 +1） */
		push(message) {
			this.messages.unshift(message);
			if (this.messages.length > MAX_MESSAGES) this.messages.length = MAX_MESSAGES;
			this.unread += 1;
		},
		/** 重置状态 */
		$reset() {
			this.messages = [];
			this.unread = 0;
			this.lastReadId = void 0;
			this.loading = false;
			this.initialized = false;
		}
	}
});
//#endregion
//#region ../../packages/pinia/src/index.ts
/**
* 通用 pinia 实例（@repo/pinia）
*
* 创建 pinia 并启用持久化插件，支持 AES 加密存储。
* 复用 @repo/utils 的 StorageWrapper（加密 + 命名空间 + 用户隔离），
* 作为 pinia persist 的全局 storage，调用方无需感知加密。
*
* encode / encodeFn / decodeFn 由 StorageWrapper 内部实时从 getConfig() 读取，
* 所以该模块被顶层 import 时（cfg 还是默认值）也无所谓：loadConfig 完成后
* 后续所有 set/get 都自动走 yaml 里配置的最新 encode 规则。
*/
/**
* 真正的加密存储实例，首次读写时才构造。
*
* 不能在模块顶层直接调用 createStorage：@repo/utils/storage.ts 静态依赖 @repo/config，
* 而 config 与 pinia 会被打进同一个 chunk，形成 utils ↔ config-pinia 的静态循环。
* 生产构建下 pinia 的模块体可能先于 utils 里 `class StorageWrapper` 的求值执行，
* 此时模块顶层的 createStorage(...) 里 `new StorageWrapper(...)` 会拿到未初始化的类并抛
*   TypeError: StorageWrapper is not a constructor
* 开发环境不打包、模块按需逐个求值，顺序恰好正常，所以只在构建产物里复现，
* 表现为「请求全部 200、没有任何显式报错、页面就是不挂载」。
*/
var realStorage;
/**
* 取（并缓存）真正的加密存储实例。
*
* 推迟到首次读写时构造，那时所有模块都已求值完毕，不再依赖求值顺序。
*
* @returns StorageWrapper 实例
*/
function getPiniaStorage() {
	if (!realStorage) realStorage = createStorage(browserLocalStorage, {
		prefix: getConfig().storage?.prefix || getConfig().app?.systemCode || "system",
		userScopeKeys: getConfig().storage?.userScopeKeys,
		resolveUserId: getCurrentUserId
	});
	return realStorage;
}
/**
* 交给 pinia 持久化插件的存储壳：只做转发，模块顶层不触碰 StorageWrapper。
*/
var piniaStorage = {
	/**
	* 读取并解密
	*
	* @param key 键名
	* @returns 明文；不存在时返回 null
	*/
	getItem(key) {
		return getPiniaStorage().getItem(key);
	},
	/**
	* 加密并写入
	*
	* @param key 键名
	* @param value 明文
	* @returns 无返回值
	*/
	setItem(key, value) {
		getPiniaStorage().setItem(key, value);
	},
	/**
	* 删除
	*
	* @param key 键名
	* @returns 无返回值
	*/
	removeItem(key) {
		getPiniaStorage().removeItem(key);
	}
};
var pinia = createPinia();
pinia.use(createPersistedState({ storage: piniaStorage }));
//#endregion
export { setRouter as _, forceRelogin as a, getShowStaticAndDynamicMenuList as b, authStore as c, registerStaticMenu as d, getMenuResolver as f, getRouter as g, isGuardOwnedMenuMode as h, keepAliveStore as i, userStore as l, globalStore as m, tabsStore as n, initAuthRouter as o, registerMenuResolver as p, getEnv as r, resetRouter as s, pinia as t, getStaticMenu as u, applyFlattenSingleRoot as v, getAllBreadcrumbList as y };
