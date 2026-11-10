import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { Wn as reactive } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { c as CACHE_PREFIX, l as DEFAULT_THEME, n as getConfig } from "./src-CyyrhO16.js";
import { t as require_crypto_js } from "./crypto-js-eTsoW70T.js";
import { r as AxiosHeaders, v as axios } from "./axios-Du-YOERk.js";
import { i as useMutation, l as useQuery } from "./modern-BIYRPO3U.js";
import { n as fetchEventSource } from "./esm-EP8bUdgk.js";
import { et as useBreakpoints } from "./dist-DyM762ZC.js";
import "./import-wrapper-C8uGk5uA.js";
import { t as mitt_default } from "./mitt-B-jfnI9H.js";
//#region ../../packages/utils/src/modules/aes.ts
var import_crypto_js = /* @__PURE__ */ __toESM(require_crypto_js(), 1);
/** AES/ECB/Pkcs7 加密 */
function encrypt(data, key) {
	const secret = import_crypto_js.default.enc.Utf8.parse(key);
	const plain = import_crypto_js.default.enc.Utf8.parse(data);
	return import_crypto_js.default.AES.encrypt(plain, secret, {
		mode: import_crypto_js.default.mode.ECB,
		padding: import_crypto_js.default.pad.Pkcs7
	}).toString();
}
/** AES/ECB/Pkcs7 解密 */
function decrypt(data, key) {
	const secret = import_crypto_js.default.enc.Utf8.parse(key);
	const decrypted = import_crypto_js.default.AES.decrypt(data, secret, {
		mode: import_crypto_js.default.mode.ECB,
		padding: import_crypto_js.default.pad.Pkcs7
	});
	return import_crypto_js.default.enc.Utf8.stringify(decrypted).toString();
}
//#endregion
//#region ../../packages/utils/src/storage.ts
/** 过期标记 */
var EXPIRES_KEY_SUFFIX = "__expires__";
var StorageWrapper = class {
	store;
	options;
	prefix;
	noPrefixKeys;
	userScopeKeys;
	/** userId getter（运行时调用，避免循环依赖） */
	resolveUserId;
	/** 显式传入的 encode 覆盖（优先级最高）；未传时实时从 config.storage.encode 读 */
	encodeOverride;
	/** 显式注入的加解密函数（用于 wasm 等外部算法） */
	encodeFnOverride;
	decodeFnOverride;
	constructor(store, options = {}) {
		this.store = store;
		this.options = options;
		this.prefix = options.prefix ?? "";
		this.noPrefixKeys = options.noPrefixKeys ?? [];
		this.userScopeKeys = options.userScopeKeys ?? [];
		this.resolveUserId = options.resolveUserId;
		this.encodeOverride = options.encode;
		this.encodeFnOverride = options.encodeFn;
		this.decodeFnOverride = options.decodeFn;
	}
	/**
	* 实时读取加解密开关。
	* 优先级：显式 encodeOverride > config.storage.encode（每次实时读，响应 yaml/远程/热更新）
	* 这样 piniaStorage / tokenStorage / buildStorage 等实例无需重建，
	* yaml 里改了 encode 后下次 set/get 自动走新规则。
	*/
	get encode() {
		if (this.encodeOverride !== void 0) return this.encodeOverride;
		return getConfig()?.storage?.encode ?? false;
	}
	/**
	* 实时读取加密函数。
	* 显式注入优先；否则按当前 encode + config.storage.key 内部用 AES。
	* decode 同理（对称封装）。
	*/
	get encodeFn() {
		if (this.encodeFnOverride) return this.encodeFnOverride;
		if (this.encode) {
			const key = getConfig()?.storage?.key;
			if (key) return (plain) => encrypt(plain, key);
		}
	}
	get decodeFn() {
		if (this.decodeFnOverride) return this.decodeFnOverride;
		if (this.encode) {
			const key = getConfig()?.storage?.key;
			if (key) return (encrypted) => decrypt(encrypted, key);
		}
	}
	/** 写入前编码（JSON 序列化 + 可选加密）；加密失败降级明文，防止写入异常导致系统崩溃 */
	encodeValue(value) {
		const json = JSON.stringify(value);
		if (this.encode && this.encodeFn) try {
			return this.encodeFn(json);
		} catch {
			return json;
		}
		return json;
	}
	/**
	* 读取后解码（可选解密 + JSON 反序列化）
	* 解密失败自动降级：先按明文 JSON 尝试，仍失败返回原文串，防止系统崩溃。
	*/
	decodeValue(raw) {
		if (this.encode && this.decodeFn) try {
			return JSON.parse(this.decodeFn(raw));
		} catch {
			try {
				return JSON.parse(raw);
			} catch {
				return raw;
			}
		}
		return JSON.parse(raw);
	}
	/**
	* 带前缀的完整 key
	*   - noPrefixKeys 列表内的 key：不加前缀（跨应用共享）
	*   - userScopeKeys 列表内的 key：自动注入当前 userId（按账号隔离）
	*   - 其余：${prefix}:${key}
	*/
	buildKey(key) {
		if (this.noPrefixKeys.includes(key)) return key;
		if (this.userScopeKeys.includes(key) && this.resolveUserId) {
			const uid = this.resolveUserId();
			return this.prefix ? `${this.prefix}:${uid}:${key}` : `${uid}:${key}`;
		}
		return this.prefix ? `${this.prefix}:${key}` : key;
	}
	/** 是否为不添加前缀的 key */
	isNoPrefixKey(key) {
		return this.noPrefixKeys.includes(key);
	}
	/**
	* 写入（自动 JSON 序列化，可选加密，可选 TTL）
	* @returns 写入是否成功（异常时返回 false，如隐私模式）
	*/
	set(key, value, expires) {
		try {
			const fullKey = this.buildKey(key);
			this.store.setItem(fullKey, this.encodeValue(value));
			const ttl = expires ?? this.options.expires;
			if (ttl) this.store.setItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`, String(Date.now() + ttl));
			else this.store.removeItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`);
			return true;
		} catch {
			return false;
		}
	}
	/**
	* 读取（自动解密与 JSON 反序列化，已过期返回 null 并清除）
	* @param defaultValue 不存在、已过期或解析失败时返回的默认值
	*/
	get(key, defaultValue = null) {
		const fullKey = this.buildKey(key);
		try {
			const raw = this.store.getItem(fullKey);
			if (raw === null || raw === void 0) return defaultValue;
			const expiresAt = Number(this.store.getItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`));
			if (expiresAt && Date.now() > expiresAt) {
				this.remove(key);
				return defaultValue;
			}
			return this.decodeValue(raw);
		} catch {
			return defaultValue;
		}
	}
	/** 删除 */
	remove(key) {
		const fullKey = this.buildKey(key);
		this.store.removeItem(fullKey);
		this.store.removeItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`);
	}
	/** 是否存在（未过期才算存在） */
	has(key) {
		const fullKey = this.buildKey(key);
		const raw = this.store.getItem(fullKey);
		if (raw === null || raw === void 0) return false;
		const expiresAt = Number(this.store.getItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`));
		return !(expiresAt && Date.now() > expiresAt);
	}
	/** 清空当前命名空间下的所有 key */
	clear() {
		const prefix = this.prefix ? `${this.prefix}:` : "";
		const keysToRemove = [];
		for (let i = 0; i < this.store.length; i++) {
			const storeKey = this.store.key(i);
			if (!storeKey) continue;
			if (storeKey.startsWith(prefix) || this.isNoPrefixKey(storeKey)) keysToRemove.push(storeKey);
		}
		keysToRemove.forEach((k) => this.store.removeItem(k));
	}
	/**
	* 清空用户级存储（登录跳转时调用）
	* 保留 noPrefixKeys（如 sys-fingerprint），删除所有带前缀的用户/应用级 key
	*/
	clearUserStorage() {
		const prefix = this.prefix ? `${this.prefix}:` : "";
		for (let i = 0; i < this.store.length; i++) {
			const storeKey = this.store.key(i);
			if (!storeKey) continue;
			if (storeKey.startsWith(prefix)) {
				this.store.removeItem(storeKey);
				const expiresKey = storeKey + EXPIRES_KEY_SUFFIX;
				this.store.removeItem(expiresKey);
			}
		}
	}
	/** 当前命名空间下的业务 key 列表（不含内部过期元数据 key） */
	keys() {
		const prefix = this.prefix ? `${this.prefix}:` : "";
		const result = [];
		for (let i = 0; i < this.store.length; i++) {
			const storeKey = this.store.key(i);
			if (storeKey && !storeKey.endsWith(EXPIRES_KEY_SUFFIX) && (storeKey.startsWith(prefix) || this.isNoPrefixKey(storeKey))) result.push(storeKey.slice(prefix.length));
		}
		return result;
	}
	/** StorageLike 兼容接口：加密读取（返回 JSON 字符串） */
	getItem(key) {
		const val = this.get(key);
		return val === null ? null : JSON.stringify(val);
	}
	/** StorageLike 兼容接口：加密写入（接收 JSON 字符串） */
	setItem(key, value) {
		try {
			this.set(key, JSON.parse(value));
		} catch {
			this.set(key, value);
		}
	}
	/** StorageLike 兼容接口：删除 */
	removeItem(key) {
		this.remove(key);
	}
	/** StorageLike 兼容接口：按索引获取 key */
	key(index) {
		return this.keys()[index] ?? null;
	}
	/** StorageLike 兼容接口：长度 */
	get length() {
		return this.keys().length;
	}
};
/** SSR/Node 环境下使用的空实现，避免模块加载时访问 window 崩溃 */
var emptyStorage = {
	length: 0,
	getItem: () => null,
	setItem: () => void 0,
	removeItem: () => void 0,
	key: () => null
};
/** 浏览器 localStorage（SSR/Node 下为安全的空实现） */
var browserLocalStorage = typeof window !== "undefined" ? window.localStorage : emptyStorage;
/** 浏览器 sessionStorage（SSR/Node 下为安全的空实现） */
var browserSessionStorage = typeof window !== "undefined" ? window.sessionStorage : emptyStorage;
new StorageWrapper(browserLocalStorage);
new StorageWrapper(browserSessionStorage);
/** 创建带命名空间 / 过期时间的独立实例 */
function createStorage(store, options) {
	return new StorageWrapper(store, options);
}
//#endregion
//#region ../../packages/utils/src/modules/token.ts
/**
* token 统一读写（@repo/utils）
*
* accessToken / refreshToken / userInfo 都由框架写入框架 storage（StorageWrapper），
* 本模块复用框架 storage 读写，供 SSE、HTTP、TokenManager 等使用，不依赖 core。
*
* 同时提供用户级缓存读写（菜单 / 布局），采用 cache-aside 策略：
* 调用方先读缓存（getMenuCache / getLayoutCache），有就直接返回，
* 没有再请求接口并写回（setMenuCache / setLayoutCache）。登出 / 强制重登时
* 调用 clearAuthCache() 静默清除，避免跨账号串数据。
*/
/** 用户信息存储 key（与 core/permission 的 USER_INFO_KEY 保持一致） */
var USER_INFO_KEY = "userInfo";
/** 用户远程菜单缓存 key */
var MENU_CACHE_KEY = "menu";
/** 用户布局缓存 key */
var LAYOUT_CACHE_KEY = "layout";
/** 当前生效的 token storage（懒初始化，key 规则与写入方一致） */
var tokenStorage = null;
/**
* 解析当前登录 userId（未登录 / 解析失败 → "anonymous"）
*
* 与 config.getStorageKey 内部的 getCurrentUserId 实现一致，避免循环。
*/
function resolveUserId() {
	if (typeof window === "undefined") return "anonymous";
	try {
		const data = getUserInfo();
		if (!data) return "anonymous";
		const id = data?.userId ?? data?.sysUserId;
		if (id === void 0 || id === null || id === "") return "anonymous";
		return String(id);
	} catch {
		return "anonymous";
	}
}
/**
* 构建与写入方一致的框架 storage 实例
*
* 使用 config.storage 的前缀与 noPrefixKeys 规则。
* 加解密由 StorageWrapper 内部实时从 getConfig() 读取（见 storage.ts），
* 无需在 setConfig 后重建实例。
*/
function getTokenStorage() {
	if (tokenStorage) return tokenStorage;
	const cfg = getConfig();
	tokenStorage = createStorage(browserLocalStorage, {
		prefix: cfg.storage?.prefix || cfg.app?.systemCode || "system",
		noPrefixKeys: cfg.storage?.noPrefixKeys,
		userScopeKeys: cfg.storage?.userScopeKeys,
		resolveUserId
	});
	return tokenStorage;
}
/**
* 通用框架 storage（与 token / userInfo / 菜单写入方完全一致）
*
* 所有前端缓存读写都应使用本实例，禁止直接调用 localStorage：
* 前缀 / noPrefixKeys / userScopeKeys / 加解密均实时从 getConfig() 获取，
* 避免直接用 localStorage 造成加密、前缀、按账号隔离规则不统一。
*/
function getFrameworkStorage() {
	return getTokenStorage();
}
/** accessToken 存储 key */
function accessKey() {
	return getConfig().token?.accessTokenKey || "accessToken";
}
/** refreshToken 存储 key */
function refreshKey() {
	return getConfig().token?.refreshTokenKey || "refreshToken";
}
/**
* 代入令牌的 sessionStorage key。
*
* 刻意不走框架 storage（localStorage）：代入令牌是按标签页临时借用的身份，
* 而框架 storage 是全标签共享的，写进去会覆盖管理员自己标签页里的登录态 ——
* 管理员点一下「代入该学生」，自己的后台就在下一次请求时变成学生身份了。
* sessionStorage 天然按标签页隔离，正好承载这种「只在本页生效」的凭据。
*/
var IMPERSONATE_TOKEN_KEY = "__impersonateAccessToken__";
/**
* 读取代入令牌。
*
* @returns 本标签页的代入令牌；没有则返回空串
*/
function getImpersonateToken() {
	try {
		if (typeof window === "undefined") return "";
		return window.sessionStorage.getItem(IMPERSONATE_TOKEN_KEY) ?? "";
	} catch {
		return "";
	}
}
/** 清除本标签页的代入令牌（退出代入 / 完整登出时调用） */
function clearImpersonateToken() {
	try {
		if (typeof window === "undefined") return;
		window.sessionStorage.removeItem(IMPERSONATE_TOKEN_KEY);
	} catch {}
}
/**
* 获取当前 accessToken
*
* 从框架 storage 读取（key = tokenConfig.accessTokenKey，默认 "accessToken"）。
* 代入令牌优先：它只在本标签页存在，取到就说明本页正以被代入的身份工作。
*/
function getAccessToken() {
	try {
		if (typeof window === "undefined") return "";
		const impersonate = getImpersonateToken();
		if (impersonate) return impersonate;
		const token = getTokenStorage().get(accessKey()) ?? "";
		if (token) return token;
		return "";
	} catch {
		return "";
	}
}
/** 写入 accessToken（框架 storage） */
function setAccessToken(token) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(accessKey(), token);
	} catch {}
}
/** 写入 refreshToken（框架 storage） */
function setRefreshToken(token) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(refreshKey(), token);
	} catch {}
}
/**
* 获取用户信息（框架 storage，key = "userInfo"）
*/
function getUserInfo() {
	try {
		if (typeof window === "undefined") return null;
		return getTokenStorage().get(USER_INFO_KEY);
	} catch {
		return null;
	}
}
/** 写入用户信息（框架 storage，key = "userInfo"） */
function setUserInfo(userInfo) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(USER_INFO_KEY, userInfo);
	} catch {}
}
/** 读取用户远程菜单缓存（按 userId 隔离，由 createStorage 内部 buildKey 自动注入） */
function getMenuCache() {
	try {
		if (typeof window === "undefined") return null;
		return getTokenStorage().get(MENU_CACHE_KEY);
	} catch {
		return null;
	}
}
/** 写入用户远程菜单缓存（拉取成功后调用） */
function setMenuCache(menu) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(MENU_CACHE_KEY, menu);
	} catch {}
}
/** 静默清除用户级缓存（登出 / 强制重登 / 切换账号时调用） */
function clearAuthCache() {
	try {
		if (typeof window === "undefined") return;
		const storage = getTokenStorage();
		storage.remove(MENU_CACHE_KEY);
		storage.remove(LAYOUT_CACHE_KEY);
	} catch {}
}
/** 清除令牌（accessToken / refreshToken / userInfo 全部移除） */
function clearAuthToken() {
	try {
		if (typeof window === "undefined") return;
		clearImpersonateToken();
		const storage = getTokenStorage();
		storage.remove(accessKey());
		storage.remove(refreshKey());
		storage.remove(USER_INFO_KEY);
		storage.remove(CACHE_PREFIX + "user");
	} catch {}
}
/** 完整登出清理：令牌 + 菜单缓存 + 布局缓存 */
function clearAllAuthData() {
	clearAuthToken();
	clearAuthCache();
}
//#endregion
//#region ../../packages/utils/src/sse/client.ts
/**
* 创建 SSE 客户端
*
* 基于 @microsoft/fetch-event-source，封装为客户端。
* 支持自动重连、自动解析 JSON data。
*   const client = createSseClient('/api/chat/stream', { onMessage: (e) => console.log(e.data) })
*   client.close()
*/
/**
* 为相对路径补齐统一 API 前缀（与 http.ts 的 baseUrl 策略一致），
* 绝对地址（http(s):// 或 //）原样返回。
*/
function resolveSseUrl(url) {
	const u = (url ?? "").trim();
	if (!u || /^([a-z][a-z0-9+.-]*:)?\/\//i.test(u)) return u;
	const base = getConfig().http.baseUrl ?? "";
	if (!base) return u;
	return `${base.replace(/\/+$/, "")}/${u.replace(/^\/+/, "")}`;
}
/** 默认 JSON 解析 */
var defaultParse = (raw) => {
	if (raw === "" || raw === "[DONE]") return raw;
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
};
/** 将鉴权 token 拼入 URL query（与 socket 的 x-oauth-token 约定一致） */
function injectAuthQuery(url, token) {
	if (!token) return url;
	try {
		const parsed = new URL(url, typeof window !== "undefined" ? window.location.href : void 0);
		parsed.searchParams.set("x-oauth-token", token);
		return parsed.toString();
	} catch {
		return url;
	}
}
function createSseClient(url, options = {}) {
	const { method = "POST", headers = {}, body, credentials = "include", auth = true, reconnect = true, maxReconnectAttempts = 5, reconnectInterval = 2e3, parseData = defaultParse, onMessage, onOpen, onError, onClose } = options;
	const controller = new AbortController();
	let attempts = 0;
	let closed = false;
	/** 组装请求头：auth 开启时自动注入 Authorization: Bearer <token> */
	const buildHeaders = () => {
		const result = {
			"Content-Type": "application/json",
			Accept: "text/event-stream",
			...headers
		};
		if (auth) {
			const token = typeof auth === "string" ? auth : getAccessToken();
			if (token) result.Authorization = `Bearer ${token}`;
		}
		return result;
	};
	const start = () => {
		if (closed) return;
		const authToken = auth ? typeof auth === "string" ? auth : getAccessToken() : "";
		const requestUrl = injectAuthQuery(resolveSseUrl(url), authToken);
		fetchEventSource(requestUrl, {
			method,
			headers: buildHeaders(),
			credentials,
			body: body !== void 0 ? JSON.stringify(body) : void 0,
			signal: controller.signal,
			openWhenHidden: true,
			onopen: async (response) => {
				if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
					attempts = 0;
					onOpen?.();
					return;
				}
				if (response.status === 401 || response.status === 403) {
					onError?.(/* @__PURE__ */ new Error(`SSE 鉴权失败: ${response.status}`));
					closed = true;
					controller.abort();
					return;
				}
				throw new Error(`SSE 连接失败: ${response.status}`);
			},
			onmessage: (msg) => {
				if (msg.data === void 0 || msg.data === null || msg.data === "") return;
				const data = parseData(msg.data);
				onMessage?.({
					event: msg.event || "message",
					data,
					id: msg.id,
					retry: msg.retry
				});
			},
			onerror: (err) => {
				onError?.(err);
				attempts++;
				if (attempts > maxReconnectAttempts || !reconnect) throw err;
				return new Promise((resolve) => {
					setTimeout(resolve, reconnectInterval);
				});
			},
			onclose: () => {
				onClose?.();
			}
		}).catch((err) => {
			onError?.(err);
		});
	};
	start();
	return { close: () => {
		closed = true;
		controller.abort();
	} };
}
//#endregion
//#region ../../packages/utils/src/sse/openai.ts
/**
* OpenAI 协议 SSE 客户端
*
* 适配 OpenAI /v1/chat/completions 的流式响应格式。
* 兼容后端 AI 服务的 OpenAI 协议实现。
*   const client = createOpenAiSseClient('/v1/chat/completions', { onChunk: (chunk) => {...} })
*/
/**
* OpenAI SSE 解析：data: {...} 与结束标记 [DONE]
*/
var openAiParseData = (raw) => {
	if (!raw || raw === "[DONE]") return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
};
function createOpenAiSseClient(url, options = {}) {
	let fullContent = "";
	let started = false;
	return createSseClient(url, {
		...options,
		parseData: openAiParseData,
		onOpen: () => {
			started = true;
			options.onStart?.();
			options.onOpen?.();
		},
		onMessage: (event) => {
			const chunk = event.data;
			if (!chunk) {
				options.onEnd?.(fullContent);
				return;
			}
			const choice = chunk.choices?.[0];
			const content = choice?.delta?.content;
			if (content) fullContent += content;
			if (started) options.onChunk?.(chunk, JSON.stringify(chunk));
			if (choice?.finish_reason === "stop") options.onEnd?.(fullContent);
		}
	});
}
//#endregion
//#region ../../packages/utils/src/sse/spring-ai.ts
/**
* 针对后端 Spring AI 服务的 SSE 客户端
*
* 适配 Spring AI 的 MediaType.APPLICATION_NDJSON_VALUE / TEXT_EVENT_STREAM_VALUE
* 支持 ChatClient 流式响应。
*   const client = createSpringAiSseClient('/api/chat', { onChunk: (chunk) => {...} })
*/
function createSpringAiSseClient(url, options = {}) {
	let fullContent = "";
	let started = false;
	return createSseClient(url, {
		...options,
		onOpen: () => {
			started = true;
			options.onStart?.();
			options.onOpen?.();
		},
		onMessage: (event) => {
			const chunk = event.data;
			if (chunk?.done) {
				options.onEnd?.(fullContent);
				return;
			}
			if (chunk?.error) {
				options.onError?.(new Error(chunk.error));
				return;
			}
			if (chunk?.content) fullContent += chunk.content;
			if (started) options.onChunk?.(chunk, JSON.stringify(chunk));
		}
	});
}
//#endregion
//#region ../../packages/utils/src/http.ts
var defaultOptions = {
	useAppConfig: true,
	timeout: void 0
};
/**
* 第一方客户端标识 —— 字段一：承载请求头名
*
* <p>服务端「消息头拦截」默认会拦掉爬虫与自动化客户端的 User-Agent，特征清单里
* 也含 curl / axios / okhttp 这类通用 HTTP 客户端 —— 用 UA 根本分不出「脚本」与
* 「爬虫」。自家前端如果不做标识，会被自己刚上线的规则挡在门外。</p>
*
* <p>选 X-Trace-Id 是因为它本来就该出现在每个请求里（本系统的 MDC 链路追踪
* 就在读它），标记藏在取值末尾不显眼。</p>
*/
var FIRST_PARTY_HEADER_A = "X-Trace-Id";
/**
* 第一方客户端标识 —— 字段二：承载请求头名
*
* <p>X-Requested-With 是 AJAX 的事实标准头（jQuery / axios 都发这个），
* 一个不带它的请求本身就可疑，所以标记放在这里同样不显眼。</p>
*
* <p>服务端要求<b>两个字段同时</b>满足才豁免，只满足一个不算。</p>
*/
var FIRST_PARTY_HEADER_B = "X-Requested-With";
/**
* 第一方标记（两个字段的取值都要以它结尾）
*
* <p>刻意是个短小、无语义、看起来像随机后缀的串，而不是 "chua-console"
* 这种一眼看出用途的明文。</p>
*/
var FIRST_PARTY_MARKER = "-7f3a";
/**
* 造一个「看起来正常」的 X-Requested-With 取值
*
* @returns 形如 `XMLHttpRequest-7f3a` 的取值
*/
function firstPartyRequestedWith() {
	return `XMLHttpRequest${FIRST_PARTY_MARKER}`;
}
/**
* 造一个「看起来正常」的 X-Trace-Id 取值
*
* <p>32 位十六进制 + 标记，形态与真实链路追踪 id 一致，不引人注意。</p>
*
* @returns 形如 `3f2a9c1b8e7d4056a2c1b9f3e8d70561-7f3a` 的取值
*/
function firstPartyTraceId() {
	let hex = "";
	for (let i = 0; i < 32; i++) hex += Math.floor(Math.random() * 16).toString(16);
	return `${hex}${FIRST_PARTY_MARKER}`;
}
/**
* 第一方标识请求头
*
* <p><b>不是安全凭证</b>：两个头的取值都能伪造，凑齐即可整体绕过。
* 双字段只是把「要绕过就得同时注意到两处」的成本抬高一点。
* 不接受任何后门的部署，服务端把 first-party-enabled 关掉即可。</p>
*
* <p><b>刻意不写进 User-Agent</b>：浏览器不允许 JS 设置 User-Agent
* （Fetch 规范把它列为 forbidden header name，axios/XHR 写入会被静默丢弃），
* 写了也发不出去。</p>
*
* @returns 带两个标识字段的请求头
*/
function firstPartyHeaders() {
	return {
		[FIRST_PARTY_HEADER_A]: firstPartyTraceId(),
		[FIRST_PARTY_HEADER_B]: firstPartyRequestedWith()
	};
}
/**
* 模块级默认 axios 实例（拦截器所在）。
*
* 业务侧统一 `import { http } from "@repo/utils"` 使用本模块的 http()，
* 但无参 http() 创建新 Http 时默认挂到全局 axios 上，会丢失 createApp
* 注入的加密/签名/401/loading 拦截器。createApp 构建 HTTP 客户端后会调用
* {@link setDefaultHttpInstance} 把带拦截器的实例回写到这里，
* 使业务侧 http() 复用同一请求管线。
*/
var defaultInstance = axios;
/**
* 标准化 URL：拼接 baseUrl 与相对路径，并统一处理斜杠。
*
* 规则：
* - url 已为绝对地址（http(s):// 或 //）时原样返回（不拼接 baseUrl）；
* - baseUrl 为空时原样返回 url（调用方传入的就是完整地址）；
* - 其余情况拼接 baseUrl + url，自动去除多余的斜杠。
*/
function normalizeUrl(baseUrl, url) {
	const u = (url ?? "").trim();
	if (!u) return u;
	if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(u)) return u;
	const b = (baseUrl ?? "").trim().replace(/\/+$/, "");
	if (!b) return u;
	return `${b}/${u.replace(/^\/+/, "")}`;
}
var RequestBuilder = class {
	config;
	instance;
	constructor(baseURL, method, url, defaults, instance) {
		this.instance = instance;
		this.config = {
			method,
			url: normalizeUrl(baseURL, url),
			timeout: defaults.timeout,
			headers: new AxiosHeaders(defaults.headers)
		};
	}
	query(params) {
		this.config.params = {
			...this.config.params,
			...params
		};
		return this;
	}
	headers(headers) {
		Object.assign(this.config.headers, headers);
		return this;
	}
	data(body) {
		this.config.data = body;
		return this;
	}
	responseType(type) {
		this.config.responseType = type;
		return this;
	}
	timeout(ms) {
		this.config.timeout = ms;
		return this;
	}
	loading(show) {
		this.config.hc = {
			...this.config.hc,
			showLoading: show
		};
		return this;
	}
	encrypt(on) {
		this.config.hc = {
			...this.config.hc,
			encrypt: on
		};
		return this;
	}
	codec(on) {
		this.config.hc = {
			...this.config.hc,
			codec: on
		};
		return this;
	}
	retry(on) {
		this.config.hc = {
			...this.config.hc,
			retry: on
		};
		return this;
	}
	noToast(on) {
		this.config.hc = {
			...this.config.hc,
			noToast: on
		};
		return this;
	}
	uploadProgress(handler) {
		this.config.onUploadProgress = handler;
		return this;
	}
	/**
	* 把当前链式请求转换为 SSE 客户端。
	*
	* 复用已设置的 method / url / headers / data / params，
	* 额外选项（onMessage、reconnect、auth、parseData 等）通过 sseOptions 覆盖。
	*
	* 注意：调用 sse() 后本构建器不再用于发起普通 HTTP 请求；
	*       若需要同时保留普通链式 + SSE 入口，请使用 `http.createSse()`。
	*
	* 典型用法：
	* ```ts
	* http.post('/api/chat').data({ prompt }).sse({
	*   onMessage: (e) => console.log(e.data),
	* });
	* ```
	*
	* @param sseOptions 额外的 SSE 客户端选项（method/headers/body 字段会被本构建器的值覆盖）
	* @returns SSE 客户端实例，调用 close() 终止连接
	*/
	sse(sseOptions = {}) {
		const finalUrl = (() => {
			const u = this.config.url ?? "";
			if (!this.config.params) return u;
			try {
				const parsed = new URL(u, typeof window !== "undefined" ? window.location.href : void 0);
				for (const [k, v] of Object.entries(this.config.params)) {
					if (v === void 0 || v === null) continue;
					parsed.searchParams.set(k, String(v));
				}
				return parsed.toString();
			} catch {
				return u;
			}
		})();
		const headers = {};
		const rawHeaders = this.config.headers;
		if (rawHeaders) {
			if (typeof rawHeaders.toJSON === "function") {
				for (const [k, v] of Object.entries(rawHeaders.toJSON())) if (typeof v === "string") headers[k] = v;
			} else for (const [k, v] of Object.entries(rawHeaders)) if (typeof v === "string") headers[k] = v;
		}
		return createSseClient(finalUrl, {
			...sseOptions,
			method: this.config.method === "GET" ? "GET" : "POST",
			headers,
			body: this.config.data
		});
	}
	execute() {
		return this.instance.request(this.config);
	}
	/**
	* 终态：交给 vue-query 的 useQuery 托管（缓存 / 去重 / 后台刷新）。
	*
	* <p><b>调用点必须在组件 setup() 内</b>：useQuery 把订阅挂到当前组件作用域，
	* 卸载时自动取消订阅；在事件回调 / 普通函数里调用会丢掉响应式绑定。</p>
	*
	* <p>请求依旧走本实例的 axios 管线（加密 / 签名 / 第一方头 / 401 / retry 全在
	* httpCrypto 的拦截器里），vue-query 只接管「何时发、缓存多久、要不要重取」。
	* `queryFn` 拿到 vue-query 给的 AbortSignal 后透传给 axios，组件卸载/切 key
	* 时能真正中断在途请求，而不是放任它回来再改一个已销毁组件的状态。</p>
	*
	* <p>结果经 {@link unwrapResult} 剥掉 `{code,data,msg}` 信封，`data` 即业务数据。</p>
	*
	* @param queryKey 缓存标识与失效依据，如 `['user', id]`
	* @param options vue-query 选项（staleTime / enabled / placeholderData ...）；
	*                queryKey 与 queryFn 由本方法接管，不从 options 读取
	* @returns 响应式查询结果（data / isPending / isError / refetch ...）
	*/
	useQuery(queryKey, options = {}) {
		return useQuery({
			...options,
			queryKey,
			queryFn: ({ signal }) => {
				if (signal) this.config.signal = signal;
				return this.execute().then((res) => unwrapResult(res));
			}
		});
	}
	/**
	* 终态：交给 vue-query 的 useMutation 托管（写操作 + 缓存失效联动）。
	*
	* <p>与 useQuery 相反，这里<b>不会立即发请求</b>：等调用返回对象的
	* `mutate(variables)` 才发；`variables` 会覆盖链式 `.data()` 设过的请求体，
	* 不传（undefined）则沿用链上已设的值。</p>
	*
	* @param options vue-query mutation 选项（onSuccess / onMutate / retry ...）；
	*                mutationFn 由本方法接管
	* @returns mutation 结果（mutate / mutateAsync / isPending / error ...）
	*/
	useMutation(options = {}) {
		return useMutation({
			...options,
			mutationFn: (variables) => {
				if (variables !== void 0) this.config.data = variables;
				return this.execute().then((res) => unwrapResult(res));
			}
		});
	}
	then(onfulfilled, onrejected) {
		return this.execute().then(onfulfilled, onrejected);
	}
	catch(onrejected) {
		return this.execute().catch(onrejected);
	}
	finally(onfinally) {
		return this.execute().finally(onfinally);
	}
};
var Http = class {
	baseURL;
	options;
	instance;
	constructor(options = {}) {
		this.options = {
			...defaultOptions,
			...options
		};
		this.instance = options.instance ?? defaultInstance;
		this.baseURL = this.resolveBaseURL();
	}
	/** 判断 API 响应是否成功（根据 code 或 success 字段） */
	static isSuccessful(data, successCode = "00000") {
		if (!data || typeof data !== "object") return false;
		const d = data;
		if (d.success === false || d.ok === false) return false;
		if (d.code && d.code !== successCode) return false;
		return true;
	}
	/** HTTP 2xx 且 API 响应成功的快捷判断 */
	static is200Successful(data, successCode = "00000") {
		return this.isSuccessful(data, successCode);
	}
	/** 解析最终 baseURL：手动 baseUrl > config.http.baseUrl */
	resolveBaseURL() {
		if (this.options.baseUrl !== void 0) return this.options.baseUrl;
		if (this.options.useAppConfig) return getConfig().http.baseUrl;
		return "";
	}
	setBaseURL(url) {
		this.baseURL = url;
	}
	/** 暴露底层 axios 实例（拦截器所在），供模块复用同一请求管线（如 device/spider 自定义 baseUrl） */
	getInstance() {
		return this.instance;
	}
	buildDefaults() {
		let timeout = this.options.timeout;
		const headers = {
			...firstPartyHeaders(),
			...this.options.headers
		};
		let apiVersion;
		if (this.options.useAppConfig) {
			const cfg = getConfig();
			if (timeout === void 0) timeout = cfg.http?.timeout;
			apiVersion = cfg.http?.apiVersion;
		}
		return {
			timeout,
			headers,
			apiVersion
		};
	}
	request(method, url) {
		const defaults = this.buildDefaults();
		const builder = new RequestBuilder(/^https?:\/\//i.test(url) ? "" : this.baseURL, method, url, defaults, this.instance);
		if (defaults.apiVersion) builder.query({ version: defaults.apiVersion });
		return builder;
	}
	get(url) {
		return this.request("GET", url);
	}
	post(url) {
		return this.request("POST", url);
	}
	put(url) {
		return this.request("PUT", url);
	}
	delete(url) {
		return this.request("DELETE", url);
	}
	patch(url) {
		return this.request("PATCH", url);
	}
	head(url) {
		return this.request("HEAD", url);
	}
	/**
	* 创建通用 SSE 客户端（基于 @microsoft/fetch-event-source）。
	*
	* 复用本 Http 实例的 baseURL 解析策略与全局 headers/auth 行为，
	* 内部委托给 `./sse/client.ts` 的 createSseClient。
	*
	* 典型用法：
	* ```ts
	* const client = http.createSse('/api/chat', {
	*   method: 'POST',
	*   body: { prompt: 'hi' },
	*   onMessage: (e) => console.log(e.data),
	* });
	* // 终止
	* client.close();
	* ```
	*
	* @param url 相对路径（走 baseURL）或完整 URL
	* @param options SSE 客户端选项，method/headers/body 在此显式传入
	* @returns SSE 客户端实例
	*/
	createSse(url, options = {}) {
		const { method = "POST", headers = {}, body, ...rest } = options;
		return createSseClient(this.resolveRequestUrl(url), {
			...rest,
			method,
			headers: this.buildSseHeaders(headers),
			body
		});
	}
	/**
	* 创建 OpenAI 协议 SSE 客户端（/v1/chat/completions 流式响应）。
	*
	* 自动处理 [DONE] 结束标记、finish_reason='stop'、content 增量累积。
	* 复用本 Http 实例的 baseURL 与全局 headers。
	*
	* 典型用法：
	* ```ts
	* const client = http.createOpenAiSse('/v1/chat/completions', {
	*   body: { model: 'gpt-4', stream: true, messages: [...] },
	*   onChunk: (chunk) => process.stdout.write(chunk.choices[0]?.delta?.content ?? ''),
	*   onEnd: (full) => console.log('\n[done]', full.length, 'chars'),
	* });
	* ```
	*/
	createOpenAiSse(url, options = {}) {
		const { method = "POST", headers = {}, body, ...rest } = options;
		return createOpenAiSseClient(this.resolveRequestUrl(url), {
			...rest,
			method,
			headers: this.buildSseHeaders(headers),
			body
		});
	}
	/**
	* 创建 Spring AI 协议 SSE 客户端（适配后端 AI 服务的流式响应）。
	*
	* 自动处理 chunk.done / chunk.error 收尾、content 增量累积。
	* 复用本 Http 实例的 baseURL 与全局 headers。
	*/
	createSpringAiSse(url, options = {}) {
		const { method = "POST", headers = {}, body, ...rest } = options;
		return createSpringAiSseClient(this.resolveRequestUrl(url), {
			...rest,
			method,
			headers: this.buildSseHeaders(headers),
			body
		});
	}
	/**
	* SSE 请求头：同样带上第一方标识。
	*
	* <p>SSE 不走 {@link buildDefaults}（它自己拼 headers），所以第一方标识必须
	* 在这里补一次，否则只有 REST 请求带标识、流式请求不带 —— 那种「列表页正常、
	* 实时推送 403」的分裂现象极难排查。</p>
	*
	* @param extra 调用方本次显式传入的请求头（优先级高于默认值）
	* @returns 合并后的请求头
	*/
	buildSseHeaders(extra) {
		return {
			...firstPartyHeaders(),
			...this.options.headers,
			...extra
		};
	}
	/**
	* 解析请求 URL：完整地址（http(s)://）原样返回，否则拼接 baseURL。
	* 与 normalizeUrl 行为一致；提取为实例方法供 createSse 等复用。
	*/
	resolveRequestUrl(url) {
		return normalizeUrl(this.baseURL, url);
	}
};
/** 创建请求实例，默认从 @repo/config 读取 baseUrl 与 request 配置 */
function createHttp(options) {
	return new Http(options);
}
/**
* 解包标准后端返回结构 { code, data, msg }，直接取业务数据。
*
* 兼容两种 axios 包装层级：
* - 拦截器已剥离一层：res 即 { code, data, msg }；
* - 未剥离：res 为 AxiosResponse，业务结构位于 res.data。
*
* 成功码判定复用 {@link Http.isSuccessful}（'00000' 或 success/ok 标记），
* 失败时抛出携带后端 msg 的 Error，供页面统一 ElMessage 提示。
*
* @param res 请求返回值（AxiosResponse 或裸响应体）
* @param successCode 成功码，默认 '00000'
* @returns 业务数据
*/
function unwrapResult(res, successCode = "00000") {
	const body = res?.data ?? res;
	if (Http.isSuccessful(body, successCode)) return body.data ?? body;
	const msg = body?.msg;
	const httpStatus = res?.status;
	const bizCode = body?.code;
	const err = new Error(msg || "请求失败");
	if (httpStatus !== void 0) err.status = httpStatus;
	if (bizCode !== void 0) err.code = bizCode;
	const savedData = body.data;
	if (savedData !== void 0) err.data = savedData;
	throw err;
}
//#endregion
//#region ../../packages/utils/src/log.ts
var LEVEL_STYLES = {
	trace: "color:#94a3b8;font-weight:400",
	debug: "color:#6366f1;font-weight:600",
	info: "color:#22c55e;font-weight:600",
	warn: "color:#f59e0b;font-weight:600;background:#fffbeb",
	error: "color:#ef4444;font-weight:700;background:#fef2f2"
};
var LEVEL_LABELS = {
	trace: "TRACE",
	debug: "DEBUG",
	info: "INFO",
	warn: "WARN",
	error: "ERROR"
};
var LEVEL_RANK = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4
};
var listeners = [];
var configuredLevel = "info";
function readLevelFromStorage() {
	try {
		const cfg = localStorage.getItem("app-config");
		if (cfg) {
			const lvl = JSON.parse(cfg)?.other?.logLevel;
			if (lvl && lvl in LEVEL_RANK) configuredLevel = lvl;
		}
	} catch {}
}
readLevelFromStorage();
function shouldLog(level) {
	return LEVEL_RANK[level] >= LEVEL_RANK[configuredLevel];
}
function emit(entry) {
	for (const fn of listeners) try {
		fn(entry);
	} catch {}
}
function writeLog(level, module, message, data) {
	if (!shouldLog(level)) return;
	emit({
		level,
		module,
		message,
		data,
		timestamp: Date.now()
	});
}
/**
* 解析调用参数：兼容 (module, message) 与 (message, data?) 两种形态
*
* @returns { module, message, data }
*/
function parseArgs(a, b, c) {
	if (typeof a !== "string") return {
		module: "log",
		message: String(a ?? "")
	};
	if (typeof b === "string") return {
		module: a,
		message: b,
		data: c
	};
	return {
		module: "log",
		message: a,
		data: b
	};
}
/** 默认 console 监听器：带颜色、时间戳输出 */
function consoleListener(entry) {
	const { level, module, message, data, timestamp } = entry;
	const style = LEVEL_STYLES[level];
	const label = LEVEL_LABELS[level];
	const ts = new Date(timestamp).toLocaleTimeString("zh-CN", { hour12: false });
	if (data !== void 0) console.log(`%c[${ts}][${label}][${module}] ${message}`, style, data);
	else console.log(`%c[${ts}][${label}][${module}] ${message}`, style);
}
listeners.push(consoleListener);
var log = {
	trace(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("trace", module, message, data);
	},
	debug(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("debug", module, message, data);
	},
	info(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("info", module, message, data);
	},
	warn(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("warn", module, message, data);
	},
	error(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("error", module, message, data);
	},
	/** 订阅日志事件 */
	on(fn) {
		listeners.push(fn);
	},
	/** 取消订阅 */
	off(fn) {
		const i = listeners.indexOf(fn);
		if (i >= 0) listeners.splice(i, 1);
	},
	/** 移除默认 console 监听器，完全接管输出 */
	removeConsole() {
		const i = listeners.indexOf(consoleListener);
		if (i >= 0) listeners.splice(i, 1);
	},
	/** 动态更新日志级别 */
	setLevel(level) {
		configuredLevel = level;
	}
};
//#endregion
//#region ../../packages/utils/src/persist.ts
/**
* 浏览器端持久化的两个通用原语：localStorage 的带命名空间读写 + 批量合并写。
*
* <p>用在高频、可丢的场景（拖拽几何、窗口状态）：调用方在交互过程中随意调用，写盘由这里合并，
* 不会因为一次拖拽产生上百次 `setItem`。</p>
*/
/** 默认命名空间（用 `:` 结尾，键形如 `koi:xxx`） */
var DEFAULT_NS = "koi:";
/** 按命名空间读写 localStorage；隐私模式下不可用会静默降级为内存 */
function createPersist(prefix = DEFAULT_NS) {
	const ns = prefix.endsWith(":") ? prefix : `${prefix}:`;
	const memory = /* @__PURE__ */ new Map();
	function getRaw(key) {
		try {
			return localStorage.getItem(ns + key);
		} catch {
			return memory.get(key) ?? null;
		}
	}
	function setRaw(key, value) {
		try {
			localStorage.setItem(ns + key, value);
		} catch {
			memory.set(key, value);
		}
	}
	/** 读取并反序列化；解析失败按“没有”处理 */
	function get(key, fallback) {
		const raw = getRaw(key);
		if (raw === null) return fallback;
		try {
			return JSON.parse(raw);
		} catch {
			return fallback;
		}
	}
	/** 立即写入 */
	function set(key, value) {
		try {
			setRaw(key, JSON.stringify(value));
		} catch {}
	}
	function remove(key) {
		try {
			localStorage.removeItem(ns + key);
		} catch {
			memory.delete(key);
		}
		memory.delete(key);
	}
	return {
		get,
		set,
		getRaw,
		setRaw,
		remove,
		namespace: ns
	};
}
createPersist();
//#endregion
//#region ../../packages/utils/src/modules/random.ts
var hexList = [];
for (let i = 0; i <= 15; i++) hexList[i] = i.toString(16);
//#endregion
//#region ../../packages/utils/src/modules/codec.ts
/**
* 请求体编解码（对齐后端 ApiRequestDecodeRegister / Codec / AesCodec 协议）
*
* 后端 `plugin.api.decode` 开启后，`ApiRequestDecodeBodyAdvice` 对携带
* `access-control-origin-key` 头的请求体做解密：
*  - codecType 含 "aes" → `AesCodec`：aesKey = SHA-256(key)（32 字节，AES-256），
*    iv = SHA-256(key) 前 16 字节，AES/CBC/PKCS5Padding 解密，线上载荷为 hex 字符串；
*  - 其余（sm4/des）→ `Codec` 仅做 hex 编解码（无真实加密）。
*
* 载荷形态（后端 `extractEncryptedPayload`）：不以 `{` / `[` 开头的原始 body 文本
* 即视为密文，故前端直接发送 hex 字符串即可，无需 `{"data": "..."}` 包装。
*
* 为何不用 wasm 的 aesEncrypt：wasm 侧 AES 仅支持 16 字节密钥（AES-128，
* 24/32 字节密钥会 panic），与后端 AES-256 口径不符；CryptoJS 已在
* `@repo/utils`（storage 加密同款依赖），显式 key/IV + PKCS7 输出与
* Java AES/CBC/PKCS5Padding 逐字节一致（已用 Node 标准实现交叉验证）。
*/
//#endregion
//#region ../../packages/utils/src/modules/themeColor.ts
/**
* 主题色计算工具（迁移自 koi/utils/themeColor.ts）
*
* 与 Element Plus 官方一致：mix(primary, white|black, level * 0.1)。
*/
/** 主题色所有被写入的变量名（只在这里清理，不可扩散到其他类库） */
var PRIMARY_VAR_RE = /--el-color-primary(-dark-2|-rgb|-light-[1-9])?:[^;]*;?/g;
/**
* 剔除已写入的主题色变量，避免跨次调用在 cssText 里重复堆积
* 同一次调用内，重复组由后续组覆盖（CSS 层叠）
*/
function stripPrimaryVars(str) {
	return str.replace(PRIMARY_VAR_RE, "").trim();
}
/** 核心推进：只写一次，消除 12 次 setProperty 的视图抖动 */
function writePrimaryVars(target, color, isDark, varPrefix) {
	const safeColor = normalizeThemeColor(color);
	const rgb = hexToRgb(safeColor);
	const rgbVar = rgb ? `${rgb[0]},${rgb[1]},${rgb[2]}` : "";
	const dark2 = isDark ? getLightColor(safeColor, 2) : getDarkColor(safeColor, 2);
	const lights = Array.from({ length: 9 }, (_, i) => {
		const level = isDark ? getDarkColor(safeColor, i + 1) : getLightColor(safeColor, i + 1);
		return `--el-color-${varPrefix}light-${i + 1}: ${level}`;
	}).join("; ");
	const strip = stripPrimaryVars(target.style.cssText);
	target.style.cssText = `${strip};\
    --el-color-primary: ${safeColor};\
    --el-color-primary-rgb: ${rgbVar};\
    --el-color-primary-dark-2: ${dark2};\
    ${lights};`;
}
/** 写入 Element Plus 主题色及 9 级色阶 */
function applyPrimaryColorVars(target, color, isDark) {
	writePrimaryVars(target, color, isDark, "primary-");
}
/** hex 转 rgb 数组 */
function hexToRgb(hex) {
	const normalized = hex.replace("#", "");
	if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) return null;
	return [
		parseInt(normalized.slice(0, 2), 16),
		parseInt(normalized.slice(2, 4), 16),
		parseInt(normalized.slice(4, 6), 16)
	];
}
/** 展开 #RGB 为 #RRGGBB */
function expandShortHex(hex) {
	if (/^#([0-9A-Fa-f]{3})$/.test(hex)) {
		const s = hex.slice(1);
		return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
	}
	return hex;
}
/** 校验并规范化主题色，非法值回退 fallback */
function normalizeThemeColor(color, fallback = DEFAULT_THEME) {
	const expanded = expandShortHex((color || "").trim());
	return /^#([0-9A-Fa-f]{6})$/.test(expanded) ? expanded : fallback;
}
/** 两色线性混合，weight 为 color2 权重（0~1） */
function mixColor(color1, color2, weight) {
	const w = Math.max(0, Math.min(1, weight));
	const c1 = hexToRgb(color1);
	const c2 = hexToRgb(color2);
	if (!c1 || !c2) return color1;
	return `#${[
		Math.round(c1[0] * (1 - w) + c2[0] * w),
		Math.round(c1[1] * (1 - w) + c2[1] * w),
		Math.round(c1[2] * (1 - w) + c2[2] * w)
	].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
/** 亮色模式色阶：向白色靠拢 */
function getLightColor(color, level) {
	return mixColor(color, "#ffffff", level * .1);
}
/** 暗色模式色阶：向黑色靠拢 */
function getDarkColor(color, level) {
	return mixColor(color, "#000000", level * .1);
}
//#endregion
//#region ../../packages/utils/src/modules/screen.ts
/**
* 响应式屏幕判断（@repo/utils）
*
* 基于 @vueuse/core 的 useBreakpoints，提供移动端 / pad / 桌面 / 屏幕判断。
*/
/** 断点定义 */
var breakpointsEnum = {
	xl: 1600,
	lg: 1199,
	md: 991,
	sm: 767,
	xs: 575
};
var useScreenStore = () => {
	const breakpoints = reactive(useBreakpoints(breakpointsEnum));
	return {
		breakpoints,
		isMobile: breakpoints.smaller("sm"),
		isPad: breakpoints.between("sm", "md"),
		isDesktop: breakpoints.greater("md"),
		isScreen: breakpoints.smaller("lg")
	};
};
mitt_default();
//#endregion
export { getAccessToken as A, browserLocalStorage as B, LAYOUT_CACHE_KEY as C, clearAuthCache as D, clearAllAuthData as E, setAccessToken as F, encrypt as G, createStorage as H, setMenuCache as I, setRefreshToken as L, getImpersonateToken as M, getMenuCache as N, clearAuthToken as O, getUserInfo as P, setUserInfo as R, defaultParse as S, USER_INFO_KEY as T, emptyStorage as U, browserSessionStorage as V, decrypt as W, normalizeUrl as _, getDarkColor as a, createOpenAiSseClient as b, mixColor as c, log as d, FIRST_PARTY_HEADER_A as f, createHttp as g, Http as h, expandShortHex as i, getFrameworkStorage as j, clearImpersonateToken as k, normalizeThemeColor as l, FIRST_PARTY_MARKER as m, useScreenStore as n, getLightColor as o, FIRST_PARTY_HEADER_B as p, applyPrimaryColorVars as r, hexToRgb as s, breakpointsEnum as t, createPersist as u, unwrapResult as v, MENU_CACHE_KEY as w, createSseClient as x, createSpringAiSseClient as y, StorageWrapper as z };
