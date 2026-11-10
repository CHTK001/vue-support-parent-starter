import { Wn as reactive, gn as watch } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import "./js-yaml-BtbpJore.js";
//#region ../../packages/config/src/constants.ts
/**
* 通用常量（从 koi/config 迁移）
*
* 这些是框架/主题共用的默认路径与前缀，不属于 app.yaml schema，
* 以常量形式导出，供各包复用；应用可在 app.yaml 中按需覆盖。
*/
/** 首页地址（默认） */
var HOME_URL = "/home";
/** 登录页地址（默认） */
var LOGIN_URL = "/login";
/** pinia 仓库存储前缀 */
var CACHE_PREFIX = "koi-";
/** 本地 svg 图标前缀（koi- 开头才会生效） */
var SVG_PREFIX = "koi-";
/**
* 默认主题色
*
* <p>取 #2563C9 而非 Element 默认的 #409EFF：后者在白底上只有 2.78 : 1，
* 低于 WCAG AA 对 14px 普通文本要求的 4.5 : 1。#2563C9 为 5.67 : 1，
* 在菜单选中底 #EAF4FF 上为 5.09 : 1，白字在按钮填充上同为 5.67 : 1。</p>
*
* <p>这是「配置缺失时」的兜底值，与 packages/theme/src/tokens.ts 的
* colorPrimary 保持一致 —— 两处若不一致，主题色会在换肤时跳变回不达标的值。</p>
*/
var DEFAULT_THEME = "#2563C9";
/** 路由白名单地址 */
var ROUTER_WHITE_LIST = ["/500"];
/**
* 菜单缺省图标（菜单未配置 icon 时兜底显示，避免图标位空白）。
*
* 可在 app.yaml 的 menuConfig.defaultIcon 覆盖；解析入口见 @repo/config 的
* resolveMenuDefaultIcon()（配置优先，未配置回退本常量）。
* 默认值取自 @repo/assets/src/icons（koi 主题本地 svg sprite，<use> 引用 #icon-koi-*）。
*/
var DEFAULT_MENU_ICON = "koi-text-menu";
//#endregion
//#region ../../packages/config/src/shared.ts
/** AppConfig 顶层字段名（用于 yaml 键去 Config 后缀的映射白名单） */
var APP_CONFIG_TOP_KEYS = /* @__PURE__ */ new Set([
	"config",
	"app",
	"permission",
	"token",
	"i18n",
	"layout",
	"menu",
	"upload",
	"url",
	"env",
	"system",
	"http",
	"storage",
	"security",
	"crypto",
	"login",
	"route",
	"socket",
	"message",
	"apm",
	"monitor",
	"other"
]);
function lowerFirst(key) {
	return key ? key.charAt(0).toLowerCase() + key.slice(1) : key;
}
/**
* 归一化 app.yaml 顶层键：
*  1. 首字母转小写（AppConfig / appConfig → appConfig）
*  2. 去掉 Config 后缀（appConfig → app，与 AppConfig 接口字段对齐）
*  仅对顶层键生效，嵌套对象键保持原样。
*/
function normalizeTopKey(key) {
	const lowered = lowerFirst(key);
	const withoutSuffix = lowered.replace(/Config$/i, "");
	if (APP_CONFIG_TOP_KEYS.has(withoutSuffix.toLowerCase())) return withoutSuffix;
	return lowered;
}
/**
* 取应用 base（vite `import.meta.env.BASE_URL`，末位不带斜杠）。
*
* 共享静态目录是根 public（createVite 的 `SHARED_PUBLIC_DIR`），**挂在 base 之下**，
* 所以默认配置里指向静态资源的路径（/wasm/...、/assets/...）必须拼上 base：
* base="/system/" 的应用（vue-support-system-starter）用绝对路径会 404。
*
* 本模块是 Vue / React 共享的纯数据模块，非 vite 环境下 import.meta.env 不存在，
* 此时回退 "/"（与原先写死绝对路径的行为一致）。
* 注意：只用于**静态资源**路径，后端接口路径（/v2/...）不要走这里。
*/
function assetBase() {
	return (import.meta.env?.BASE_URL ?? "/").replace(/\/+$/, "");
}
/** 拼接静态资源默认路径（带 base） */
function asset(path) {
	return `${assetBase()}${path.startsWith("/") ? "" : "/"}${path}`;
}
/** 默认配置（没有 app.yaml 时全部走默认） */
var defaultAppConfig = {
	config: { enable: true },
	app: {
		title: "应用",
		version: "0.7.0",
		systemCode: "system",
		openAuth: true
	},
	permission: {
		superadmin: "SUPER_ADMIN",
		admin: ["ADMIN", "SUPER_ADMIN"]
	},
	token: {
		refresh: false,
		autoRefresh: false,
		accessTokenKey: "accessToken",
		refreshTokenKey: "refreshToken",
		userInfoKey: "userInfo",
		refreshInterval: 3e5,
		advanceRefresh: 6e4
	},
	i18n: {
		defaultLocale: "zh-CN",
		locales: ["zh-CN", "en-US"]
	},
	layout: { source: "local" },
	menu: {
		collapseSingleChild: true,
		flattenSingleRoot: false,
		defaultIcon: DEFAULT_MENU_ICON,
		collapse: {
			showButton: false,
			showBar: "yes"
		},
		collapseToButton: false,
		groupNav: true,
		footer: {
			enable: true,
			label: "设置",
			icon: "Setting",
			entries: [{
				key: "systemConfig",
				label: "设置",
				icon: "Setting",
				mode: "route",
				path: "/system/config",
				admin: true
			}]
		}
	},
	upload: {
		enable: true,
		maxSize: 10485760,
		accept: [
			".jpg",
			".jpeg",
			".png",
			".gif",
			".pdf",
			".zip"
		]
	},
	url: {
		login: "/v2/user/login",
		logout: "/v2/user/logout",
		me: "/v2/user/me",
		refreshToken: "/v2/user/refresh-token",
		captcha: "/v1/captcha",
		setting: "/v2/setting/default",
		menu: "/v2/user/menu",
		layout: "/v2/user/layout",
		upload: "/v2/file/upload",
		smsSend: "/v2/sms/send",
		smsLogin: "/v2/sms/login",
		emailSend: "/v2/email/send",
		emailLogin: "/v2/email/login",
		jobApi: "/v2/scheduler"
	},
	env: { env: "dev" },
	system: {
		showMessage: true,
		showConfig: true,
		showLog: true,
		showMonitor: true
	},
	http: {
		baseUrl: "",
		moduleBaseUrl: {},
		apiVersion: "",
		enable: true,
		encrypt: false,
		timeout: 1e4,
		retryCount: 0,
		retryDelay: 1e3,
		showLoading: false,
		sign: false,
		signSecret: "",
		authFailAction: "confirm",
		toast: {
			enable: true,
			successCode: "00000",
			field: "both",
			skipCodeList: []
		},
		requestCodec: {
			enable: false,
			key: "",
			type: "aes"
		}
	},
	storage: {
		encode: true,
		key: "2XNN4K8LC0ELVWN4",
		prefix: "",
		noPrefixKeys: [],
		userScopeKeys: [
			"tabs",
			"layout",
			"user-config",
			"user-config.v2",
			"global",
			"double-second-fixed",
			"weather-location",
			"weather-cache",
			"map-toolbar-collapsed",
			"ai-character-messages",
			"ai-character-pos",
			"re-progress-history",
			"re-progress-settings"
		]
	},
	security: {
		baiduJs: {
			enable: false,
			url: "",
			action: "clear",
			jumpUrl: ""
		},
		dynamicFont: { enable: false },
		ocrObfuscation: { enable: false },
		watermark: { enable: false }
	},
	crypto: {
		wasmUrl: asset("/wasm/crypto-wasm.js"),
		algorithm: "aes"
	},
	login: {
		types: [{
			type: "web",
			title: "普通登录",
			description: "使用平台账号登录",
			icon: "User",
			baseUrl: ""
		}],
		captcha: true,
		otp: false,
		slider: false,
		sliderType: "simple",
		sliderPuzzle: {
			slots: 4,
			tolerance: 20
		},
		brandName: "应用",
		accessMode: "redirect",
		logoUrl: "",
		avatarUrl: "",
		welcome: "欢迎登录",
		title: "应用",
		description: "",
		imageUrl: asset("/assets/images/login/science.png"),
		featureTags: [
			{
				icon: "DataAnalysis",
				text: "高效管理"
			},
			{
				icon: "Brush",
				text: "现代设计"
			},
			{
				icon: "Lock",
				text: "安全可靠"
			}
		],
		beiAnHao: ""
	},
	route: {
		mode: "static",
		remoteUrl: "",
		mergeLocalMenu: false,
		modulePaths: [],
		allowPrefixes: [],
		whiteList: [
			"/login",
			"/403",
			"/404",
			"/500",
			"/prometheus/embed/**",
			"/nginx/embed/**",
			"/edu/student-login"
		],
		loginPath: "/login",
		homePath: "/home",
		personagePath: "/personage",
		notFoundPath: "/404",
		forbiddenPath: "/403",
		serverErrorPath: "/500"
	},
	socket: {
		enable: false,
		protocol: "sse",
		urls: "",
		context: "/socket.io",
		path: "/sse",
		query: {},
		autoConnect: true,
		reconnection: true,
		reconnectionAttempts: 3,
		reconnectionDelay: 1e3,
		heartbeatInterval: 0,
		transports: []
	},
	message: {
		position: "toolbar",
		maxUnread: 99,
		socket: true,
		listUrl: "/v2/message/sys-message/page",
		unreadUrl: "/v2/message/sys-message/unread-count",
		readUrl: "/v2/message/sys-message/read"
	},
	apm: {
		enable: true,
		engine: "",
		baseUrl: "/api/apm/v1",
		statusTtl: 15e3
	},
	monitor: {
		enable: false,
		reportUrl: "/v2/log/report",
		batchSize: 20,
		reportInterval: 5e3,
		dedupWindow: 6e4,
		sampleRate: 1,
		maxBuffer: 200,
		captureJsError: true,
		captureRejection: true,
		captureResource: true
	},
	other: {
		themeId: "koi",
		logLevel: "info",
		themeConfigCloseConfirm: false,
		statusColors: {
			success: "#67C23A",
			warning: "#E6A23C",
			danger: "#F56C6C",
			info: "#909399"
		},
		capabilities: {
			weather: true,
			location: true,
			typhoon: true,
			exchangeRate: true,
			ipLookup: true,
			holiday: true
		},
		toolbar: {
			searchMenu: true,
			refresh: true,
			dark: true,
			language: true,
			fullScreen: true,
			themeSetting: true,
			user: true,
			userMenu: {
				personalCenter: true,
				lock: true,
				settings: false
			},
			breadcrumb: true,
			breadcrumbDropdown: true,
			breadcrumbIcon: true,
			tabIcon: true,
			logo: true,
			message: true,
			quickNote: true,
			quickNoteConfirm: true,
			announcement: true,
			weather: true,
			exchangeRate: true,
			typhoon: true,
			collapse: true,
			items: []
		},
		timer: {
			enable: false,
			zones: []
		},
		weather: {
			enable: true,
			latitude: 0,
			longitude: 0,
			city: ""
		},
		exchangeRate: { symbols: [
			"USD/EUR",
			"USD/GBP",
			"USD/JPY",
			"USD/CNY",
			"USD/HKD",
			"USD/SGD"
		] },
		bigscreen: {
			enable: false,
			url: "/bigscreen",
			windowFeatures: "width=1920,height=1080"
		},
		accessibility: {
			enable: true,
			screenReaderMode: false,
			highContrastMode: false,
			voiceReadEnabled: false
		},
		devTools: {
			enable: true,
			devLiteTools: false,
			devRuler: false,
			devGrid: false,
			devHoverInspector: false,
			debugEruda: false
		},
		heatmap: {
			enable: true,
			devHeatmap: false
		},
		performance: {
			enable: true,
			fpsMonitorEnabled: false,
			memoryMonitorEnabled: false,
			cpuMonitorEnabled: false,
			bandwidthMonitorEnabled: false,
			batteryMonitorEnabled: false,
			bluetoothMonitorEnabled: false,
			screenMonitorEnabled: false,
			performanceMonitorPosition: "top-left",
			performanceMonitorMode: "detailed",
			performanceMonitorLayout: "split",
			performanceMonitorDirection: "auto"
		},
		aiChat: {
			enable: true,
			aiChatEnabled: false,
			aiChatMode: "webllm",
			aiChatModel: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
			webllmModels: [
				{
					label: "Qwen2.5-1.5B-Instruct（推荐·轻量）",
					value: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
					image: asset("/assets/models/qwen-color.svg")
				},
				{
					label: "Qwen2.5-3B-Instruct（中等）",
					value: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
					image: asset("/assets/models/qwen-color.svg")
				},
				{
					label: "Llama-3.2-1B-Instruct（轻量）",
					value: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
					image: asset("/assets/models/meta-color.svg")
				},
				{
					label: "Llama-3.2-3B-Instruct（中等）",
					value: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
					image: asset("/assets/models/meta-color.svg")
				},
				{
					label: "Phi-3.5-mini-instruct（中等）",
					value: "Phi-3.5-mini-instruct-q4f16_1-MLC",
					image: asset("/assets/models/microsoft-color.svg")
				},
				{
					label: "gemma-2-2b-it（中等）",
					value: "gemma-2-2b-it-q4f16_1-MLC",
					image: asset("/assets/models/gemini-color.svg")
				}
			],
			aiChatVendor: "openai",
			aiChatApiKey: "",
			aiChatApiUrl: "",
			aiChatMaxTokens: 512,
			aiChatTemperature: .7,
			aiChatContextLimit: 100,
			aiChatSummaryThreshold: 80,
			aiChatSummaryEnabled: true,
			aiChatSummaryRetainRounds: 6,
			aiChatCharacter: "3d",
			aiChatModelUrl: asset("/assets/models/ai-character.glb"),
			aiChatCharacterSize: 72
		},
		home: { customLayoutButton: true },
		avatarFrame: { enable: false },
		loaderConfig: {
			enable: false,
			animation: "dots",
			size: {
				narrow: 96,
				wide: 96
			},
			color: "#406eeb",
			speed: 1,
			adaptColor: false
		},
		emptyState: {
			enable: true,
			layout: "el",
			hairline: "plot"
		}
	}
};
/** 深合并：嵌套对象逐层合并，避免部分配置覆盖整块默认值 */
function deepMerge(target, source) {
	const result = { ...target };
	for (const key of Object.keys(source)) {
		const sv = source[key];
		const tv = result[key];
		if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) result[key] = deepMerge(tv, sv);
		else result[key] = sv;
	}
	return result;
}
/**
* 统一 localStorage key 命名空间工具（纯函数）
*
* 与 config.ts 中的 getStorageKey 行为一致，但**不读取响应式状态**，
* 配置由调用方以 scope 参数传入，userId 解析通过 resolveUserId 注入，
* 因此 React 侧可直接复用本函数。
*
* 用法：
*   localStorage.setItem(getStorageKey("user-config", cfg), JSON.stringify(cfg));
*   localStorage.getItem(getStorageKey("global", cfg));
*
* 规则：
*   - 始终以 ${prefix}: 开头，避免不同 app 串数据
*   - 在 storage.noPrefixKeys 列表里的 key 不加前缀（跨应用共享）
*   - 在 storage.userScopeKeys 列表里的 key 自动拼接 userId，按账号隔离
*   - 传 opts.noPrefix = true 强制不加前缀
*
* 拼接结果示例（prefix="system", userId="u123", name="tabs"）：
*   - 命中 userScopeKeys → "system:u123:tabs"
*   - 未命中                → "system:tabs"
*   - 在 noPrefixKeys 列表里 → "tabs"
*/
function getStorageKey$1(name, scope, opts = {}) {
	const cfg = scope;
	if (opts.noPrefix) return name;
	const prefix = (cfg?.storage?.prefix || cfg?.app?.systemCode || "app").trim();
	const exempt = cfg?.storage?.noPrefixKeys;
	if (Array.isArray(exempt) && exempt.includes(name)) return name;
	if (!prefix) return name;
	const userScope = cfg?.storage?.userScopeKeys;
	if (Array.isArray(userScope) && userScope.includes(name)) return `${prefix}:${opts.resolveUserId ? opts.resolveUserId() : "anonymous"}:${name}`;
	return `${prefix}:${name}`;
}
//#endregion
//#region ../../packages/config/src/config.ts
/**
* 统一应用配置
*
* 默认值来源：spring-support-account-starter/web/app.yaml（模板配置文件，
* 账号管理应用与各 starter 的 app.yaml 均从此模板复制，修改模板即可统一更新默认值）。
*
* createApp 会把 apps/{appName}/app.yaml 解析后写入这里。
* app.yaml 缺失或加载失败时，使用默认配置（defaultAppConfig）。
*
* 配置以 reactive 对象形式持有，调用方可通过：
*   - getConfig()         → 读取完整配置（响应式）
*   - useAppConfig()      → 组合式 API（reactive + watch 友好）
*   - setConfig(partial)  → 合并写入（系统级键受只读保护，被拦截的键会 warn 并拒绝）
*   - applyConfig(partial)→ 合并写入（框架启动期 / 授权路径使用，不受只读保护）
*   - onConfigChange(cb)  → 订阅变更
* 解决「setConfig 后已有 ref(getConfig().xxx) 监听不到」的隐性 bug。
*/
/** 默认配置（没有 app.yaml 时全部走默认，定义见 ./shared） */
var currentConfig = reactive({ ...defaultAppConfig });
/** 订阅者集合：任意 setConfig 后统一通知 */
var subscribers = /* @__PURE__ */ new Set();
/**
* 获取统一配置（响应式对象；解构/赋值时可能丢失响应式，复杂场景请用 useAppConfig）
*/
function getConfig() {
	return currentConfig;
}
/**
* 解析菜单缺省图标：app.yaml 的 menuConfig.defaultIcon 优先，未配置时回退框架内置默认常量。
*
* 供「菜单数据归一化」（core 远程菜单 / @repo/app 静态路由树）与「菜单渲染层」（koi 布局）共用，
* 保证菜单项未配置 icon 时仍有兜底图标，不出现空白图标位。
*/
function resolveMenuDefaultIcon() {
	const configured = currentConfig.menu?.defaultIcon;
	return typeof configured === "string" && configured.trim() ? configured.trim() : DEFAULT_MENU_ICON;
}
/**
* 从 localStorage 中读取当前登录用户 id（用于 userScopeKeys 自动注入）
*
* 不反向依赖 @repo/utils / @repo/core，避免循环引用。
* 直接读 localStorage 原始 key "userInfo"（应用启动后由 pinia user store 写入），
* 解析失败或未登录时返回 "anonymous"。
*
* 注意：此处直接读 localStorage 的原始 "userInfo" key，不走 getStorageKey，
* 因为 getStorageKey 内部又会调 getCurrentUserId，形成循环。
*/
function getCurrentUserId() {
	if (typeof window === "undefined") return "anonymous";
	try {
		const prefix = currentConfig.storage?.prefix || currentConfig.app?.systemCode || "system";
		const key = currentConfig.storage?.noPrefixKeys?.includes("userInfo") ? "userInfo" : `${prefix}:userInfo`;
		const raw = window.localStorage.getItem(key);
		if (!raw) return "anonymous";
		const data = JSON.parse(raw);
		const id = data?.userId ?? data?.sysUserId;
		if (id === void 0 || id === null || id === "") return "anonymous";
		return String(id);
	} catch {
		return "anonymous";
	}
}
/**
* 统一 localStorage key 命名空间工具
*
* 用法：
*   localStorage.setItem(getStorageKey("user-config"), JSON.stringify(cfg));
*   localStorage.getItem(getStorageKey("global"));
*
* 规则：
*   - 始终以 ${prefix}: 开头，避免不同 app 串数据
*   - 在 storage.noPrefixKeys 列表里的 key 不加前缀（跨应用共享）
*   - 在 storage.userScopeKeys 列表里的 key 自动拼接当前 userId，按账号隔离
*   - 传 opts.noPrefix = true 强制不加前缀
*
* 拼接结果示例（prefix="system", userId="u123", name="tabs"）：
*   - 命中 userScopeKeys → "system:u123:tabs"
*   - 未命中                → "system:tabs"
*   - 在 noPrefixKeys 列表里 → "tabs"
*/
function getStorageKey(name, opts = {}) {
	return getStorageKey$1(name, currentConfig, {
		...opts,
		resolveUserId: getCurrentUserId
	});
}
/**
* 内部配置写入通道（不受 setConfig 只读保护约束）。
*
* 角色：让框架的授权路径承诺「在系统初始化阶段落盘的部署侧值」不被只读保护拦截，
* 与 `setConfig` 的保护互补。任何写死在 app.yaml / 远程设置 / 用户快照里的值，
* 都应通过此通道达成；公开给用户的写入方法仍是受保护的 `setConfig`。
*
* 授权调用方：
*   - loadConfig（app.yaml / 远程 / 环境变量合并后的最终配置）
*   - mergeDefaultSetting（远程设置推齐，经 safe-path 白名单）
*   - restoreUserConfig（用户可调切片恢复）
*   - resetConfig / resetConfigSilent
*   - applyTitle（turbo/app 内部标题覆盖）
*
* @internal
*/
function applyConfig(partial) {
	applyMerge(currentConfig, deepMerge(currentConfig, partial));
	subscribers.forEach((cb) => {
		try {
			cb(currentConfig);
		} catch (error) {
			console.warn(`[config] subscriber error`, error);
		}
	});
	return currentConfig;
}
/**
* 浅响应式补充：默认导出整个 reactive 对象后，
* 当远端 setConfig 传入新顶层字段时，对象整体仍是响应式，但若 partial 中出现
* 当前没有的 key，需要补建。Vue 3 reactive 对已知 key 是响应的，
* 未声明的 key 赋值后会变为响应式，无需额外操作。
*/
function applyMerge(target, source) {
	const t = target;
	const s = source;
	for (const key of Object.keys(s)) t[key] = s[key];
}
/** 用户可调配置在 storage 的 key 后缀（统一前缀由 getStorageKey 加） */
var USER_CONFIG_KEY = "user-config.v2";
var userConfigStorageInstance = null;
/**
* 返回用户配置专用的加密 StorageWrapper。
*
* 动态 import @repo/utils 避免模块加载期循环依赖：
* @repo/utils/storage.ts 在模块顶会 import getConfig 并创建 localStore 单例（调用 getConfig），
* 若 config.ts 顶部静态 import @repo/utils，会在 currentConfig 初始化前触发 TDZ 崩溃。
* 此函数仅在运行时（saveUserConfig / restoreUserConfig 被调用时）执行，故安全。
*/
async function getUserConfigStorage() {
	if (userConfigStorageInstance) return userConfigStorageInstance;
	const { createStorage, browserLocalStorage } = await import("./src-DOQ8Ekze.js");
	const storage = createStorage(browserLocalStorage, {
		prefix: currentConfig.storage?.prefix || currentConfig.app?.systemCode || "app",
		noPrefixKeys: currentConfig.storage?.noPrefixKeys,
		userScopeKeys: currentConfig.storage?.userScopeKeys,
		resolveUserId: getCurrentUserId,
		encode: currentConfig.storage?.encode
	});
	userConfigStorageInstance = storage;
	return storage;
}
/**
* 部署侧（app.yaml / 远程配置）决定的用户可调切片基线。
* 在 restoreUserConfig 合并本地快照之前捕获，持久化时只写偏离基线的叶子。
* 不这么做的话，首次访问就会把整份 other 快照下来，此后 app.yaml 里改掉的开关
* （如 other.toolbar.announcement）永远被旧快照压住，关不掉。
*/
var userConfigBaseline;
function isPlainObject(v) {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}
/** 递归剔除与基线取值相同的叶子；整块相同返回 undefined */
function diffFromBaseline(base, cur) {
	if (isPlainObject(base) && isPlainObject(cur)) {
		const out = {};
		for (const [k, v] of Object.entries(cur)) {
			const kept = diffFromBaseline(base[k], v);
			if (kept !== void 0) out[k] = kept;
		}
		return Object.keys(out).length ? out : void 0;
	}
	return JSON.stringify(base) === JSON.stringify(cur) ? void 0 : cur;
}
/** 取用户可调切片的纯数据副本（脱离 reactive 引用） */
function sliceSnapshot() {
	return {
		other: JSON.parse(JSON.stringify(currentConfig.other ?? null)),
		message: JSON.parse(JSON.stringify(currentConfig.message ?? null)),
		menu: JSON.parse(JSON.stringify(currentConfig.menu ?? null)),
		login: JSON.parse(JSON.stringify(currentConfig.login ?? null))
	};
}
/** 加载动画的缺省值（与 defaultAppConfig.other.loaderConfig 一致） */
var LOADER_DEFAULTS = {
	locked: false,
	animation: "dots",
	size: {
		narrow: 96,
		wide: 96
	},
	color: "#406eeb",
	speed: 1,
	adaptColor: false
};
/** 首屏尺寸的上下限（px） */
var LOADER_SIZE_MIN = 8;
var LOADER_SIZE_MAX = 512;
/** 速度倍率的上下限 */
var LOADER_SPEED_MIN = .5;
var LOADER_SPEED_MAX = 3;
/** 归一化单个尺寸值：非法值用兜底，越界 clamp */
function normalizeLoaderSize(value, fallback) {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num) || num <= 0) return fallback;
	return Math.min(LOADER_SIZE_MAX, Math.max(LOADER_SIZE_MIN, Math.round(num)));
}
/**
* 归一化尺寸配置。
*
* <p>兼容两种写法：{@code size: 96}（宽窄屏同值，历史写法）与
* {@code size: { narrow: 72, wide: 96 }}（按断点分档）。</p>
*/
function normalizeLoaderSizeConfig(value) {
	if (value && typeof value === "object") {
		const obj = value;
		const narrow = normalizeLoaderSize(obj.narrow, LOADER_DEFAULTS.size.narrow);
		return {
			narrow,
			wide: normalizeLoaderSize(obj.wide, narrow)
		};
	}
	const size = normalizeLoaderSize(value, LOADER_DEFAULTS.size.narrow);
	return {
		narrow: size,
		wide: size
	};
}
/** 归一化速度倍率：非法值给 1，越界 clamp */
function normalizeLoaderSpeed(value) {
	const num = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(num) || num <= 0) return LOADER_DEFAULTS.speed;
	return Math.min(LOADER_SPEED_MAX, Math.max(LOADER_SPEED_MIN, Math.round(num * 100) / 100));
}
/**
* 颜色是否是可安全写进 CSS 变量的取值。
*
* <p>只放行 {@code #rgb/#rrggbb/#rrggbbaa} 与 {@code rgb()/rgba()/hsl()/hsla()}：
* 这个值最终会拼进 {@code style} 或 CSS 文本，放任任意字符串等于允许注入
* （例如 {@code red;background:url(...)}），没必要留这个口子。</p>
*/
function isSafeCssColor(value) {
	return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) || /^(?:rgb|hsl)a?\(\s*[\d.%\s,/+-]+\)$/i.test(value);
}
/**
* 解析加载动画的部署侧策略。
*
* <p>返回的是「最终生效值」，三处（首屏、ReLoader、主题配置预览）都读它，
* 避免各自判 {@code enable} 与兜底导致一处锁定、一处没锁。</p>
*
* @returns 归一化后的策略；未接管时 {@code locked === false}
*/
function resolveLoaderDeployPolicy() {
	const raw = currentConfig.other?.loaderConfig;
	if (!raw || raw.enable !== true) return {
		...LOADER_DEFAULTS,
		size: { ...LOADER_DEFAULTS.size }
	};
	const animation = typeof raw.animation === "string" && raw.animation.trim() ? raw.animation.trim() : LOADER_DEFAULTS.animation;
	const size = normalizeLoaderSizeConfig(raw.size);
	const rawColor = typeof raw.color === "string" ? raw.color.trim() : "";
	return {
		locked: true,
		animation,
		size,
		color: rawColor && isSafeCssColor(rawColor) ? rawColor : LOADER_DEFAULTS.color,
		speed: normalizeLoaderSpeed(raw.speed),
		adaptColor: raw.adaptColor === true
	};
}
/**
* 保存用户可调配置到 storage。
* 只持久化设置面板能改的切片：other（工具栏/计时器/状态色）、message、menu、login，
* 不保存接口地址 / 路由等系统级配置（仍由 app.yaml / 后端决定）。
*/
async function saveUserConfig() {
	if (typeof window === "undefined") return;
	try {
		const current = sliceSnapshot();
		const snapshot = {};
		for (const key of Object.keys(current)) {
			const value = current[key];
			if (value == null) continue;
			const base = userConfigBaseline?.[key];
			const kept = userConfigBaseline ? diffFromBaseline(base, value) : value;
			if (kept !== void 0) snapshot[key] = kept;
		}
		if (!Object.keys(snapshot).length && userConfigBaseline) {
			(await getUserConfigStorage()).remove(USER_CONFIG_KEY);
			return;
		}
		(await getUserConfigStorage()).set(USER_CONFIG_KEY, snapshot);
	} catch {}
}
if (typeof window !== "undefined") {
	let saveTimer;
	watch(() => [
		currentConfig.other,
		currentConfig.message,
		currentConfig.menu,
		currentConfig.login
	], () => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(saveUserConfig, 300);
	}, { deep: true });
}
//#endregion
export { resolveLoaderDeployPolicy as a, CACHE_PREFIX as c, LOGIN_URL as d, ROUTER_WHITE_LIST as f, getStorageKey as i, DEFAULT_THEME as l, getConfig as n, resolveMenuDefaultIcon as o, SVG_PREFIX as p, getCurrentUserId as r, normalizeTopKey as s, applyConfig as t, HOME_URL as u };
