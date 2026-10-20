const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/src-DvnKlGxV.js","assets/src-CEonioA3.js","assets/rolldown-runtime-CEgmsyvS.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/src-BVnZQO9c.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/dist-DI3cGDuP.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/dist-Clzx2YUA.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/dist-DogtK295.js","assets/icon-C0dIJHSD.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/aria-DKP9Ei-1.js","assets/message-BQI5cdKE.js","assets/use-size-BpzpcbJM.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_arrayPush-DAsStFRE.js","assets/typescript-CMUKtCBO.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-z-index-Q40Vppe1.js","assets/message-box-CXDJvJwn.js","assets/input-Bbhiel27.js","assets/event-CeZgVnv0.js","assets/raf-Ck-OXP6t.js","assets/use-form-common-props-DzQ9ZY64.js","assets/constants-ntbKDiND.js","assets/use-composition-BHiYKdrO.js","assets/use-aria-VmjVV7Ut.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/_baseFlatten-D6objHuc.js","assets/hasIn-COufhDdn.js","assets/use-form-item-D-dEMqBj.js","assets/use-id-C2v-tXFq.js","assets/use-draggable-P7Ccy1As.js","assets/clamp--xaQdoQg.js","assets/toNumber-PE_CR5nS.js","assets/overlay-D6Leq3yd.js","assets/scroll-CaaKdoVq.js","assets/focus-trap-B31xXeBw.js","assets/button-CLXz94Uh.js","assets/use-deprecated-qam6HGto.js","assets/validator-PIu3bjQD.js","assets/src-DzQcKxHP.js","assets/src-DDwlSqPX.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/vue-router-D43uXGPs.js","assets/src-C3nkWua1.css","assets/ReText-CEXV0N8J.js","assets/text-Dt3_J0ai.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReText-D0uOzYur.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { It as getRouter, J as initDynamicRoutes, Ot as msgWarning, y as useSocketService } from "./src-CEonioA3.js";
import { n as defineStore, t as createPinia } from "./pinia-Dz8LpwBD.js";
import { b as DEFAULT_THEME, c as getConfig, l as getCurrentUserId, y as CACHE_PREFIX } from "./src-DzQcKxHP.js";
import { K as setRefreshToken, M as clearAllAuthData, R as getFrameworkStorage, U as setAccessToken, et as browserLocalStorage, nt as createStorage, q as setUserInfo } from "./src-DDwlSqPX.js";
import { t as authStore } from "./auth-C8MLoNwd.js";
//#region ../../node_modules/.pnpm/pinia-plugin-persistedstate@3.2.3_pinia@2.3.1_typescript@5.9.3_vue@3.5.40_typescript@5.9.3__/node_modules/pinia-plugin-persistedstate/dist/index.js
function isObject(v) {
	return typeof v === "object" && v !== null;
}
function normalizeOptions(options, factoryOptions) {
	options = isObject(options) ? options : /* @__PURE__ */ Object.create(null);
	return new Proxy(options, { get(target, key, receiver) {
		if (key === "key") return Reflect.get(target, key, receiver);
		return Reflect.get(target, key, receiver) || Reflect.get(factoryOptions, key, receiver);
	} });
}
function get(state, path) {
	return path.reduce((obj, p) => {
		return obj == null ? void 0 : obj[p];
	}, state);
}
function set(state, path, val) {
	return path.slice(0, -1).reduce((obj, p) => {
		if (/^(__proto__)$/.test(p)) return {};
		else return obj[p] = obj[p] || {};
	}, state)[path[path.length - 1]] = val, state;
}
function pick(baseState, paths) {
	return paths.reduce((substate, path) => {
		const pathArray = path.split(".");
		return set(substate, pathArray, get(baseState, pathArray));
	}, {});
}
function parsePersistence(factoryOptions, store) {
	return (o) => {
		var _a;
		try {
			const { storage = localStorage, beforeRestore = void 0, afterRestore = void 0, serializer = {
				serialize: JSON.stringify,
				deserialize: JSON.parse
			}, key = store.$id, paths = null, debug = false } = o;
			return {
				storage,
				beforeRestore,
				afterRestore,
				serializer,
				key: ((_a = factoryOptions.key) != null ? _a : (k) => k)(typeof key == "string" ? key : key(store.$id)),
				paths,
				debug
			};
		} catch (e) {
			if (o.debug) console.error("[pinia-plugin-persistedstate]", e);
			return null;
		}
	};
}
function hydrateStore(store, { storage, serializer, key, debug }) {
	try {
		const fromStorage = storage == null ? void 0 : storage.getItem(key);
		if (fromStorage) store.$patch(serializer == null ? void 0 : serializer.deserialize(fromStorage));
	} catch (e) {
		if (debug) console.error("[pinia-plugin-persistedstate]", e);
	}
}
function persistState(state, { storage, serializer, key, paths, debug }) {
	try {
		const toStore = Array.isArray(paths) ? pick(state, paths) : state;
		storage.setItem(key, serializer.serialize(toStore));
	} catch (e) {
		if (debug) console.error("[pinia-plugin-persistedstate]", e);
	}
}
function createPersistedState(factoryOptions = {}) {
	return (context) => {
		const { auto = false } = factoryOptions;
		const { options: { persist = auto }, store, pinia } = context;
		if (!persist) return;
		if (!(store.$id in pinia.state.value)) {
			const original_store = pinia._s.get(store.$id.replace("__hot:", ""));
			if (original_store) Promise.resolve().then(() => original_store.$persist());
			return;
		}
		const persistences = (Array.isArray(persist) ? persist.map((p) => normalizeOptions(p, factoryOptions)) : [normalizeOptions(persist, factoryOptions)]).map(parsePersistence(factoryOptions, store)).filter(Boolean);
		store.$persist = () => {
			persistences.forEach((persistence) => {
				persistState(store.$state, persistence);
			});
		};
		store.$hydrate = ({ runHooks = true } = {}) => {
			persistences.forEach((persistence) => {
				const { beforeRestore, afterRestore } = persistence;
				if (runHooks) beforeRestore?.(context);
				hydrateStore(store, persistence);
				if (runHooks) afterRestore?.(context);
			});
		};
		persistences.forEach((persistence) => {
			const { beforeRestore, afterRestore } = persistence;
			beforeRestore?.(context);
			hydrateStore(store, persistence);
			afterRestore?.(context);
			store.$subscribe((_mutation, state) => {
				persistState(state, persistence);
			}, { detached: true });
		});
	};
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
var globalStore = defineStore("global", {
	persist: {
		key: "global",
		afterRestore: (ctx) => {
			try {
				const storage = getFrameworkStorage();
				if (!storage.get(LAYOUT_DEFAULT_MIGRATION_KEY)) {
					ctx.store.layout = "vertical";
					storage.set(LAYOUT_DEFAULT_MIGRATION_KEY, true);
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
//#region ../../packages/pinia/src/init.ts
/**
* pinia 从 @repo/config 初始化
*
* 应用启动（createApp 加载 app.yaml 后）调用 initPiniaFromConfig()，
* 把 config 中的值写入各 store，保证主题 / 语言等初始状态来自统一配置，
* 而不是每个 theme 自己写死一套。
*/
/** 把 "zh-CN" 之类语言码归一化为 "zh" / "en" */
function normalizeLocale(locale) {
	const lang = locale.toLowerCase().split("-")[0];
	return ["zh", "cn"].includes(lang) ? "zh" : "en";
}
/** 从 @repo/config 初始化全部 store */
function initPiniaFromConfig() {
	const config = getConfig();
	const globalStore$1 = globalStore();
	const locale = config.i18n?.defaultLocale;
	if (locale) globalStore$1.setGlobalState("language", normalizeLocale(locale));
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
/**
* 应用启动（含整页刷新）时是否需要补灌菜单 + 用户信息。
*
* <ul>
*   <li>{@code openAuth=false}：没有登录流程，守卫直接放行，启动即灌（历史行为，保持不变）。</li>
*   <li>remote/all：守卫负责，这里灌会重复拉取 → 不灌。</li>
*   <li>static/module + 有令牌：整页刷新直接进目标路由，登录流程与守卫都不会跑 →
*       必须灌，否则侧边栏空壳（本函数要修的缺陷）。</li>
*   <li>static/module + 无令牌：接下来守卫会把用户弹去登录页 → 不灌，
*       登录成功后由 {@code @repo/pinia initAuthRouter} 的静态分支灌入。</li>
* </ul>
*
* @param input 见 {@link MenuSeedStartupInput}
* @returns true 表示启动时应执行一次菜单 + 用户信息灌入
*/
function shouldSeedMenuAtStartup(input) {
	if (!input.openAuth) return true;
	if (isGuardOwnedMenuMode(input.routeMode)) return false;
	return input.hasToken;
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
			const { login, setUserRoles, setUserPerms, refreshDefaultSetting } = await __vitePreload(async () => {
				const { login, setUserRoles, setUserPerms, refreshDefaultSetting } = await import("./src-DvnKlGxV.js");
				return {
					login,
					setUserRoles,
					setUserPerms,
					refreshDefaultSetting
				};
			}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]));
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
			const { refreshToken, setUserRoles, setUserPerms } = await __vitePreload(async () => {
				const { refreshToken, setUserRoles, setUserPerms } = await import("./src-DvnKlGxV.js");
				return {
					refreshToken,
					setUserRoles,
					setUserPerms
				};
			}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]));
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
			const { logout, invalidateSessionScope } = await __vitePreload(async () => {
				const { logout, invalidateSessionScope } = await import("./src-DvnKlGxV.js");
				return {
					logout,
					invalidateSessionScope
				};
			}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]));
			invalidateSessionScope();
			try {
				await logout({});
			} catch {}
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
//#region ../../packages/pinia/src/authRouter.ts
/** 权限异常：清空 token 与权限缓存，回登录页 */
var forceRelogin = async (router, message) => {
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
			if (tab.isKeepAlive == "1" && tab.name && !keepAliveStore$1.keepAliveName.includes(tab.name)) keepAliveStore$1.addKeepAliveName(tab.name);
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
			if (tabItem?.isKeepAlive) keepAliveStore$2.removeKeepAliveName(tabItem.name);
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
			keepAliveStore$3.setKeepAliveName(keepAliveList.map((item) => item.name));
		},
		async closeManyTabs(tabValue) {
			const keepAliveStore$4 = keepAliveStore();
			this.tabList = this.tabList.filter((item) => {
				return item.path === tabValue || item.isAffix === "1";
			});
			const keepAliveList = this.tabList.filter((item) => item.isKeepAlive);
			keepAliveStore$4.setKeepAliveName(keepAliveList.map((item) => item.name));
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
var messageStore = defineStore("message", {
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
			const { getStationMessageAdapter } = await __vitePreload(async () => {
				const { getStationMessageAdapter } = await import("./src-DvnKlGxV.js");
				return { getStationMessageAdapter };
			}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]));
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
			const { getStationMessageAdapter } = await __vitePreload(async () => {
				const { getStationMessageAdapter } = await import("./src-DvnKlGxV.js");
				return { getStationMessageAdapter };
			}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]));
			const adapter = getStationMessageAdapter();
			if (!adapter?.getUnreadCount) return this.unread;
			try {
				this.unread = await adapter.getUnreadCount();
			} catch {}
			return this.unread;
		},
		/** 标记已读（注入 adapter 后可用；lastId 为空表示全部已读） */
		async markAllRead(lastId) {
			const { getStationMessageAdapter } = await __vitePreload(async () => {
				const { getStationMessageAdapter } = await import("./src-DvnKlGxV.js");
				return { getStationMessageAdapter };
			}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67]));
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
//#region ../../packages/pinia/src/messageSocket.ts
/**
* 站内消息 Socket 绑定（@repo/pinia）
*
* 订阅全局 Socket 服务的 message/push 事件，将实时推送写入 useMessageStore。
* 放在 pinia 包内实现（pinia 依赖 core），避免 core → pinia 循环依赖。
*
* 用法（应用初始化时调用一次，见 createApp）：
*   void bindStationMessageSocket();
*/
/**
* 绑定 Socket 站内消息推送 → message store
*
* 无全局 Socket 服务时返回 null，不影响 HTTP 拉取。
* @returns 解绑函数或 null
*/
function bindStationMessageSocket() {
	const service = useSocketService();
	if (!service) return null;
	return service.subscribe("message", "push", (msg) => {
		const data = msg.data;
		const payload = data && typeof data === "object" ? data : msg;
		messageStore().push(payload);
	});
}
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
export { getEnv as a, initAuthRouter as c, isGuardOwnedMenuMode as d, shouldSeedMenuAtStartup as f, tabsStore as i, resetRouter as l, globalStore as m, bindStationMessageSocket as n, keepAliveStore as o, initPiniaFromConfig as p, messageStore as r, forceRelogin as s, pinia as t, userStore as u };
