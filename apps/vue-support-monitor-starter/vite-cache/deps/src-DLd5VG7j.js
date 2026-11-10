import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { d as ElNotification, g as ElMessage, h as ElMessageBox } from "./es-BernUpY0.js";
import { n as getConfig, o as resolveMenuDefaultIcon, s as normalizeTopKey, t as applyConfig } from "./src-CT6rpQSM.js";
import { I as setMenuCache, N as getMenuCache, d as log, g as createHttp, j as getFrameworkStorage } from "./src-Kgq87wnz.js";
import { t as require_devtools_detector } from "./devtools-detector-6UaTeVBz.js";
import { t as require_nprogress } from "./nprogress-Bfek7Vp0.js";
import "./esm-CL-q1_UI.js";
import { l as createI18n } from "./vue-i18n-DssVPWxP.js";
import "D:/ch/project/vue-support-parent-starter/node_modules/.pnpm/nprogress@0.2.0/node_modules/nprogress/nprogress.css";
//#region ../../packages/config/src/safe-path.ts
/**
* 远程/外部配置写入的安全路径工具。
*
* <p><b>修复一个原型链污染（Prototype Pollution）缺陷。</b></p>
*
* <p>原实现在两处用「按点号拆键 → 逐层下钻 → 赋值」把后端配置写进对象：</p>
* <pre>{@code
* const keys = pathKey.split(".");
* let cur = partial;
* for (let i = 0; i < keys.length - 1; i++) {
*   const key = keys[i];
*   if (typeof cur[key] !== "object" || cur[key] === null) cur[key] = {};
*   cur = cur[key];              // ← 问题在这里
* }
* cur[keys[keys.length - 1]] = value;
* }</pre>
*
* <p>下钻时读的是 <b>继承链</b>上的属性，而不是自有属性。对 {@code __proto__}
* 而言，{@code cur["__proto__"]} 恒为 {@code Object.prototype}
* （typeof 为 {@code "object"}，非 null），于是判空通过、{@code cur} 被赋成
* {@code Object.prototype}，最后一行就写到了 <b>全局原型</b> 上：</p>
* <pre>{@code
* // sysSettingCode = "__proto__.isAdmin"
* → Object.prototype.isAdmin = true
* }</pre>
*
* <p>后果不是「某个对象的属性被改了」，而是<b>任意页面里所有对象都凭空多出该属性</b>：
* 权限判断里 {@code if (obj.isAdmin)} 恒真、{@code JSON.stringify} 输出多出字段、
* 部分库的「判断对象是否为空」逻辑被污染而失效。而配置项的 {@code sysSettingCode}
* 来自数据库里的设置行，任何能写入设置表的人（管理员、被 SQL 注入利用的接口、
* 导入的第三方配置包）都能触发它。</p>
*
* <p>本模块提供两条独立的防线：</p>
* <ol>
*   <li><b>禁止段名</b>：{@code __proto__} / {@code prototype} / {@code constructor}
*       一律拒绝，不做任何「兼容处理」；</li>
*   <li><b>只认自有属性</b>：下钻时用 {@code hasOwnProperty} 判断，
*       绝不把继承来的对象当成容器；命中的容器必须是<b>纯对象</b>
*       （数组、Date 等一律拒绝，避免把值塞进奇怪的结构里）。</li>
* </ol>
*/
/**
* 永远不允许出现在配置路径里的段名。
*
* <p>{@code __proto__} 直接导致全局污染；{@code prototype} 与 {@code constructor}
* 则是构造链上的等价入口（例如 {@code constructor.prototype.x}），一并堵死。</p>
*/
var FORBIDDEN_PATH_SEGMENTS = /* @__PURE__ */ new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
/**
* 远程配置<b>允许写入</b>的顶层键。
*
* <p>远程设置接口的定位是「管理员可调的品牌 / 展示 / 功能开关」，
* 而不是「任意配置项」。原实现对顶层键完全不设限，于是远程配置可以改写：</p>
* <ul>
*   <li>{@code http.baseURL} —— 把全部 API 请求指向攻击者主机，
*       用户在自家页面上输入的口令会直接发到对方手里；</li>
*   <li>{@code token.*Key} —— 改写令牌存储位置，与登录态劫持配合；</li>
*   <li>{@code crypto.*} / {@code security.*} —— 远程关掉签名或校验开关。</li>
* </ul>
*
* <p>白名单里的每一项都对应「改了只会影响观感/布局」的安全域；
* {@code token}、{@code http}、{@code crypto}、{@code security}、{@code storage}、
* {@code url}、{@code config} 均<b>不在</b>其中——需要改这些请改本地
* {@code app.yaml} 或环境变量，那才是管理员真正该动的地方。</p>
*/
var REMOTE_INJECTABLE_TOP_KEYS = /* @__PURE__ */ new Set([
	"app",
	"env",
	"i18n",
	"layout",
	"login",
	"menu",
	"message",
	"monitor",
	"other",
	"permission",
	"route",
	"socket",
	"system",
	"upload"
]);
/**
* 远程配置<b>允许写入的完整路径前缀</b>（顶层键之外的细粒度放行）。
*
* <p>{@code security} 整体不可远程注入（见上），但平台有两棵子树是设计为
* 「管理员在后台配置、前端按下发值注入」的产品功能，会被 {@code /v2/setting/default}
* 正常下发；若连它们一起拒，后台选的值在前端永远不生效。</p>
*
* <ul>
*   <li>{@code security.baiduJs} —— 反爬脚本下发（enable/action/jumpUrl/url）；
*     2.0 曾复现的 e2e security-config 04/05/06 正是该缺陷（后台配了反爬策略，
*     前端不发请求，永远不生效）。</li>
*   <li>{@code security.watermark} —— 水印（enable/color/alpha/rotate）；
*     {@code packages/core/src/directives/waterMarker.ts} 按
*     {@code getConfig().security.watermark} 取值（它的类型注释写着
*     「后端 Watermark* 设置变更后由热重载联动」），而 `Watermark*` 是旧式
*     设置名，不在 {@code login} 子树上，只能由 loader 落盘到
*     `security.watermark`。</li>
*   <li>{@code security.dynamicFont} —— 动态字体加密（enable）；后台开关
*     {@code sysSettingCode=security.dynamicFont.enable} 下发后，
*     {@code packages/ui/src/components/ReText/ReText.vue} 在未显式传
*     {@code obfuscate} 时回退读它，决定是否把文本渲染成「PUA 乱码 + 字符位图」
*     以对抗 OCR / 爬虫。与水印同属「管理员在后台开关的展示/安全策略」。</li>
* </ul>
*
* <p>只放行这三棵子树：{@code security.crt} / {@code security.csrf} /
* {@code security.password} / {@code security.ocrObfuscation} 等其余键照旧被白名单拦下。</p>
*/
var REMOTE_INJECTABLE_PATH_PREFIXES = /* @__PURE__ */ new Set([
	"security.baiduJs",
	"security.watermark",
	"security.dynamicFont"
]);
/** 判断是否为「纯对象」（排除 null、数组、以及 Date/Map/Set 等内建类型） */
function isPlainContainer(value) {
	if (typeof value !== "object" || value === null) return false;
	if (Array.isArray(value)) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
/**
* 路径是否含禁止段名
*
* @param segments 路径段
* @return 含禁止段名返回 true
*/
function hasForbiddenSegment(segments) {
	return segments.some((seg) => FORBIDDEN_PATH_SEGMENTS.has(seg));
}
/**
* 按点号路径安全地写入值。
*
* <p>与原实现的关键差异：</p>
* <ul>
*   <li>先整条路径校验（禁止段名 + 顶层白名单），<b>不合格一个字节都不写</b>；</li>
*   <li>下钻只认自有属性，且要求是纯对象，绝不进入继承链；</li>
*   <li>中间层不存在时创建<b>自有</b>的普通对象。</li>
* </ul>
*
* @param target 目标对象（原地修改）
* @param dottedPath 点号路径，如 {@code login.brandName}
* @param value 值
* @param options 选项
* @return 写入成功返回 true；被拒绝返回 false（target 未发生任何变化）
*/
function safeSetDotted(target, dottedPath, value, options = {}) {
	const reject = (reason) => {
		options.onReject?.(dottedPath, reason);
		return false;
	};
	if (typeof dottedPath !== "string") return reject("路径不是字符串");
	const trimmed = dottedPath.trim();
	if (!trimmed) return reject("路径为空");
	const rawSegments = trimmed.split(".");
	if (rawSegments.some((seg) => seg === "")) return reject("路径含空段");
	if (hasForbiddenSegment(rawSegments)) return reject("路径含原型链相关段名（__proto__ / prototype / constructor）");
	let segments = rawSegments;
	const allowlist = options.topKeyAllowlist;
	if (allowlist) {
		const normalize = options.normalizeTopKey;
		const topRaw = segments[0];
		const top = normalize ? normalize(topRaw) : topRaw;
		if (top !== topRaw) segments = [top, ...segments.slice(1)];
		const normalizedPath = segments.join(".");
		const inPrefixAllow = options.pathPrefixAllowlist != null && [...options.pathPrefixAllowlist].some((p) => normalizedPath === p || normalizedPath.startsWith(`${p}.`));
		if (!allowlist.has(top) && !inPrefixAllow) return reject(`顶层键 "${top}" 不在远程可注入白名单内`);
	}
	const leaf = segments[segments.length - 1];
	let cur = target;
	for (let i = 0; i < segments.length - 1; i++) {
		const key = segments[i];
		const existing = Object.prototype.hasOwnProperty.call(cur, key) ? cur[key] : void 0;
		if (existing === void 0) {
			const created = {};
			cur[key] = created;
			cur = created;
			continue;
		}
		if (!isPlainContainer(existing)) return reject(`路径段 "${key}" 处的值不是可下钻的普通对象`);
		cur = existing;
	}
	if (FORBIDDEN_PATH_SEGMENTS.has(leaf)) return reject("叶节点为原型链相关段名");
	cur[leaf] = value;
	return true;
}
//#endregion
//#region ../../packages/utils/src/modules/debounce.ts
/**
* 防抖 / 节流工具函数（@repo/utils）
*/
/**
* 防抖：在最后一次触发的 wait 毫秒后调用 fn；如果在 wait 内再次触发，重新计时。
* 支持 cancel 取消防抖。
*/
function debounce$2(fn, wait = 300) {
	let timer = null;
	const debounced = ((...args) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			fn(...args);
		}, wait);
	});
	debounced.cancel = () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	};
	return debounced;
}
/**
* 节流：在 wait 毫秒内最多调用一次 fn（leading + trailing）。
*/
function throttle$2(fn, wait = 300) {
	let last = 0;
	let timer = null;
	const throttled = ((...args) => {
		const now = Date.now();
		const remaining = wait - (now - last);
		if (remaining <= 0) {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			last = now;
			fn(...args);
		} else if (!timer) timer = setTimeout(() => {
			last = Date.now();
			timer = null;
			fn(...args);
		}, remaining);
	});
	throttled.cancel = () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		last = 0;
	};
	return throttled;
}
//#endregion
//#region ../../packages/core/src/crypto/loadCrypto.ts
/** 默认 wasm 入口路径 */
/**
* ⚠️ 必须带应用 base 前缀：共享 public 目录（根 public）由 createVite 的
* `publicDir: SHARED_PUBLIC_DIR` 挂在 **base 之下**，所以产物实际地址是 `<base>wasm/...`。
* 例如 vue-support-system-starter 的 base 被硬编码为 "/system/"（见 createVite.ts），
* 正确路径是 /system/wasm/crypto-wasm.js，写死 "/wasm/..." 会 404 →
* 抛「加载 wasm 加密模块失败」→ 整页空白。
* base 为 "/" 时结果与原先完全一致（/wasm/crypto-wasm.js）。
*/
function resolveBaseUrl() {
	return (import.meta.env?.BASE_URL ?? "/").replace(/\/+$/, "");
}
`${resolveBaseUrl()}`;
//#endregion
//#region ../../packages/core/src/permission.ts
/**
* 权限工具 —— 维护当前用户角色与权限码，供 v-admin / v-superadmin / v-role / v-perm 指令判断
*
* 数据来源：登录后通过 setUserRoles / setUserPerms / syncUserPerm 写入，
* createApp 创建 storage 后会自动从存储中的 userInfo 同步。
*
* 角色字面量（admin / superadmin 或自定义）从 app.yaml permissionConfig 读取，
* 业务方不要在业务代码里硬编码 "admin" / "superadmin" 字面量，
* 通过 getAdminRoles / getSuperadminRole / isAdmin / isSuperadmin 间接读取。
*/
var userRoles = [];
var userPerms = [];
/** 角色在 localStorage 的持久化 key（与 v-role 指令 / 面板 isAdmin 读取一致） */
var ROLES_STORAGE_KEY = "user-roles";
/** 设置当前用户角色 */
function setUserRoles(roles) {
	userRoles = roles;
	try {
		getFrameworkStorage().set(ROLES_STORAGE_KEY, roles);
	} catch {}
}
/** 设置当前用户权限码 */
function setUserPerms(perms) {
	userPerms = perms;
}
/** 是否拥有角色（required 为字符串或字符串数组，命中其一即通过；角色比较忽略大小写） */
function hasRole(required) {
	return (Array.isArray(required) ? required : [required]).some((r) => userRoles.some((role) => role.toLowerCase() === r.toLowerCase()));
}
/** 是否拥有权限码（required 为字符串或字符串数组，命中其一即通过） */
function hasPerm(required) {
	return (Array.isArray(required) ? required : [required]).some((p) => userPerms.includes(p));
}
/** 读取 yml 中配置的管理员角色列表（默认 ["ADMIN"]） */
function getAdminRoles() {
	const v = getConfig()?.permission?.admin;
	return Array.isArray(v) ? v : ["ADMIN"];
}
/** 读取 yml 中配置的超级管理员角色名（默认 "SUPER_ADMIN"） */
function getSuperadminRole() {
	return getConfig()?.permission?.superadmin ?? "SUPER_ADMIN";
}
/** 当前用户是否为管理员（含 superadmin） */
function isAdmin() {
	return hasRole([getSuperadminRole(), ...getAdminRoles()]);
}
//#endregion
//#region ../../packages/core/src/loginEntry.ts
/**
* 登录类型 → 后端地址（core）
*
* <p>登录页允许配置多个登录入口（app.yaml {@code loginConfig.types}），
* 每个入口可以指向不同的后端（平台站点 / 租户独立站点）。选中某一项后：</p>
*
* <ol>
*   <li>登录请求本身发往该入口的地址（{@link getActiveBaseUrl}）；</li>
*   <li>登录成功后写入 {@code http.baseUrl}，此后所有业务请求都走同一个后端 ——
*       否则令牌是在 A 站签发的，业务请求却打到 B 站，必然 401。</li>
* </ol>
*
* <p>地址为空串或 {@code null} 表示「沿用 app.yaml 的 httpConfig.baseUrl」，
* 此时什么都不写，不能把同源代理配置覆盖成空串。</p>
*/
/** 当前选中的登录入口后端地址（空串 = 未选 / 沿用本地 httpConfig.baseUrl） */
var activeBaseUrl = "";
/**
* 规整地址：去首尾空白与末尾斜杠。
*
* <p>末尾斜杠必须去掉：http 客户端拼接时是 {@code baseUrl + "/" + path}，
* 不过滤会拼出 {@code //v2/login}，部分网关会当成不同路径返回 404。</p>
*/
function normalizeBaseUrl(url) {
	return String(url ?? "").trim().replace(/\/+$/, "");
}
/** 清空登录入口地址（登出 / 登出失败回登录页时调用，避免下一个人继承上一个入口） */
function resetActiveBaseUrl() {
	activeBaseUrl = "";
}
/** 读取当前生效的请求地址：登录入口优先，未设置时用全局配置 */
function resolveRequestBaseUrl() {
	return activeBaseUrl || normalizeBaseUrl(getConfig()?.http?.baseUrl);
}
//#endregion
//#region ../../packages/core/src/api/stationMessage.ts
/** 站内消息适配器实例 */
var stationMessageAdapter = null;
/** 获取全局站内消息适配器（未初始化返回 null） */
function getStationMessageAdapter() {
	return stationMessageAdapter;
}
//#endregion
//#region ../../packages/core/src/api/apmAlerts.ts
/** 后端 APM 前缀（与页面层 APM_PREFIX 保持一致） */
var APM_PREFIX = "/api/apm";
`${APM_PREFIX}`;
//#endregion
//#region ../../packages/core/src/api/index.ts
/** http 单例（由 createApp 注入） */
var httpInstance = null;
/** 获取 http 实例；未注入时抛错 */
function getApiHttp() {
	if (!httpInstance) throw new Error("[api] http 未注入，请先调用 setApiHttp()");
	return httpInstance;
}
/**
* 登录（.codec(true)：按后端 codec 协议加密密码；未配置 requestCodec 时自动退化为明文，不影响其它应用）
*
* <p>登录页可能配了多个入口（平台 / 租户独立站点，app.yaml {@code loginConfig.types}）。
* 选中入口后，登录请求必须发往该入口的地址 —— 否则验证码与令牌会签在另一个站点上，
* 后续业务请求带着这个令牌打到别处只会 401。</p>
*/
function login(data) {
	return loginHttp().post(getConfig().url.login).data(data).codec(true).then((r) => r.data);
}
/**
* 登录用的 Http 实例：选中了非默认入口时，复用默认实例的 axios 管线（保留加密/签名拦截器），
* 只替换 baseUrl。
*
* <p>与 {@link createModuleHttp} 同一做法，区别是地址来自登录入口而不是模块配置。</p>
*/
function loginHttp() {
	const entry = entryBaseUrl();
	if (!entry) return getApiHttp();
	return createHttp({
		baseUrl: entry,
		instance: getApiHttp().getInstance()
	});
}
/** 登录入口地址：与全局 httpConfig.baseUrl 相同时返回 undefined（沿用默认管线）。
*
* <p>返回 undefined 而不是空串：Http 的 baseUrl 语义里 undefined = 读全局配置， * 空串 = 不发任何前缀（绝对同源根），两者对带子路径部署的应用差别很大。</p>
*/
function entryBaseUrl() {
	const entry = resolveRequestBaseUrl();
	const global = String(getConfig().http.baseUrl ?? "").trim().replace(/\/+$/, "");
	return !entry || entry === global ? void 0 : entry;
}
/** 登出 */
function logout(data) {
	return getApiHttp().delete(getConfig().url.logout).data(data ?? {}).then((r) => r.data);
}
/** 当前用户信息（loading=false 时不触发顶部进度条，供头像框等静默刷新使用） */
function getMe(loading = true) {
	return getApiHttp().get(getConfig().url.me).loading(loading).then((r) => r.data);
}
/** 刷新 token */
function refreshToken(data) {
	return getApiHttp().post(getConfig().url.refreshToken).data(data ?? {}).then((r) => r.data);
}
/** 获取默认配置（登录页/首页拉取后端配置合并到 getConfig） */
function getDefaultSetting() {
	return getApiHttp().get(getConfig().url.setting).timeout(3e3).retry(false).then((r) => r.data);
}
/**
* 获取远程菜单（并发去重 + 网络优先 + 缓存兜底）
*
* 策略：
*   1. 每次应用初始化都请求 `/v2/user/menu`，避免菜单结构或角色授权调整后长期命中旧缓存；
*   2. 同一批并发调用复用进行中的请求，避免登录/导航重复拉取；
*   3. 请求成功且返回非空数组时写回用户级缓存；请求失败时回退最近一次成功缓存；
*   4. 确认无菜单的 `[]` 不写缓存，角色后续被授权菜单时下次启动即可生效。
* 登出 / 强制重登时由 clearAuthCache() 静默清除缓存，避免跨账号串数据。
*/
var menuRequestPromise = null;
function getMenu(params) {
	if (menuRequestPromise) return menuRequestPromise;
	menuRequestPromise = (async () => {
		try {
			const req = getApiHttp().get(getConfig().url.menu);
			if (params) req.query(params);
			const res = await req.then((r) => r.data);
			if (res?.success !== false && Array.isArray(res?.data) && res.data.length > 0) setMenuCache(res.data);
			return res;
		} catch (error) {
			const cached = getMenuCache();
			if (cached) {
				log.warn("[api] 远程菜单请求失败，已回退本地缓存", error);
				return { data: cached };
			}
			throw error;
		} finally {
			menuRequestPromise = null;
		}
	})();
	return menuRequestPromise;
}
//#endregion
//#region ../../packages/core/src/session-scope.ts
/** 当前作用域的 AbortController；每次 {@link invalidateSessionScope} 换一个新的 */
var controller = new AbortController();
/** 当前会话世代号；每次 {@link invalidateSessionScope} 自增 */
var epoch = 0;
/**
* 作废当前会话：中断全部在途请求并世代号自增。
*
* <p><b>调用时机很关键。</b>必须在「登出请求发出<b>之前</b>」调用，
* 这样：</p>
* <ul>
*   <li>登出前发出的请求（刷新、菜单、列表…）被 abort 掉；</li>
*   <li>登出请求本身在新的作用域里发起，不受牵连，能正常打到服务端。</li>
* </ul>
*
* @returns 作废后的世代号
*/
function invalidateSessionScope() {
	const previous = controller;
	controller = new AbortController();
	epoch += 1;
	try {
		previous?.abort();
	} catch {}
	return epoch;
}
(/* @__PURE__ */ __toESM(require_nprogress(), 1)).default.configure({
	easing: "ease",
	speed: 500,
	showSpinner: true,
	trickleSpeed: 200,
	minimum: .3
});
//#endregion
//#region ../../packages/core/src/msg.ts
/**
* 消息提示（core）
*
* 提供两套 API：
*  1) 对象风格（推荐）：import { message } from "@repo/core"; message.success("...")
*  2) 函数风格（兼容）：import { msgSuccess, msgError } from "@repo/core"; msgSuccess("...")
*
* 依赖 element-plus 的 ElMessage / ElNotification / ElMessageBox。
* 构建期由 unplugin-element-plus 转换为按需子路径导入。
*/
/** 通用提示类型通知，默认 info */
function notice(message, title = "提示", duration = 2e3, type = "info", parseHtml = false) {
	ElNotification.closeAll();
	ElNotification({
		message,
		title,
		type,
		duration,
		showClose: true,
		dangerouslyUseHTMLString: parseHtml
	});
}
/** 成功通知 */
function noticeSuccess(message, title = "提示", duration = 2e3) {
	notice(message, title, duration, "success");
}
/** 错误通知 */
function noticeError(message, title = "提示", duration = 2e3) {
	notice(message, title, duration, "error");
}
/** 警告通知 */
function noticeWarning(message, title = "提示", duration = 2e3) {
	notice(message, title, duration, "warning");
}
/** 信息通知 */
function noticeInfo(message, title = "提示", duration = 2e3) {
	notice(message, title, duration, "info");
}
/** 全局守卫：拦截器显示 5xx/network toast 后，抑制紧随的下一次 msg 调用，避免重复弹窗 */
var _suppressNextMsg = false;
/** 提示信息，默认 info */
function msg(message, plain = true, duration = 2e3, type = "info", parseHtml = false) {
	if (_suppressNextMsg) {
		_suppressNextMsg = false;
		return;
	}
	ElMessage.closeAll();
	ElMessage({
		message,
		plain,
		duration,
		type,
		showClose: true,
		dangerouslyUseHTMLString: parseHtml
	});
}
/** 主色提示 */
function msgPrimary(message, plain = true, duration = 2e3) {
	msg(message, plain, duration, "primary");
}
/** 成功提示 */
function msgSuccess(message, plain = true, duration = 2e3) {
	msg(message, plain, duration, "success");
}
/** 错误提示 */
function msgError(message, plain = true, duration = 2e3) {
	msg(message, plain, duration, "error");
}
/** 警告提示 */
function msgWarning(message, plain = true, duration = 2e3) {
	msg(message, plain, duration, "warning");
}
/** 信息提示 */
function msgInfo(message, plain = true, duration = 2e3) {
	msg(message, plain, duration, "info");
}
/** 确认框，默认 warning */
function msgBox(message = "您确定进行关闭么？", title = "温馨提示：", confirmButtonText = "确定", cancelButtonText = "取消", type = "warning") {
	return new Promise((resolve, reject) => {
		ElMessageBox.confirm(message, title, {
			confirmButtonText,
			cancelButtonText,
			type,
			draggable: true,
			dangerouslyUseHTMLString: true
		}).then(() => resolve(true)).catch(() => reject(false));
	});
}
/** Prompt 类型的消息框 */
function msgBoxPrompt(message = "请输入需要修改的数据？", title = "温馨提示：", confirmButtonText = "确定", cancelButtonText = "取消", type = "info", options) {
	return new Promise((resolve, reject) => {
		ElMessageBox.prompt(message, title, {
			confirmButtonText,
			cancelButtonText,
			type,
			draggable: true,
			...options ?? {}
		}).then((res) => resolve(res)).catch(() => reject(false));
	});
}
/** Alert 类型的消息框 */
function msgBoxAlert(message = "请输入需要修改的数据？", title = "温馨提示：", confirmButtonText = "确定", type = "info") {
	return new Promise((resolve, reject) => {
		ElMessageBox.alert(message, title, {
			confirmButtonText,
			type,
			draggable: true
		}).then(() => resolve(true)).catch(() => reject(false));
	});
}
/** ElMessage 对象风格 */
var messageEl = {
	primary: (m, opts) => msg(m, opts?.plain ?? true, opts?.duration ?? 2e3, "primary", opts?.parseHtml ?? false),
	success: (m, opts) => msg(m, opts?.plain ?? true, opts?.duration ?? 2e3, "success", opts?.parseHtml ?? false),
	error: (m, opts) => msg(m, opts?.plain ?? true, opts?.duration ?? 2e3, "error", opts?.parseHtml ?? false),
	warning: (m, opts) => msg(m, opts?.plain ?? true, opts?.duration ?? 2e3, "warning", opts?.parseHtml ?? false),
	info: (m, opts) => msg(m, opts?.plain ?? true, opts?.duration ?? 2e3, "info", opts?.parseHtml ?? false),
	/** 关闭所有 */
	closeAll: () => ElMessage.closeAll()
};
/** ElNotification 对象风格 */
var notification = {
	primary: (m, opts) => notice(m, opts?.title ?? "提示", opts?.duration ?? 2e3, "primary", opts?.parseHtml ?? false),
	success: (m, opts) => notice(m, opts?.title ?? "提示", opts?.duration ?? 2e3, "success", opts?.parseHtml ?? false),
	error: (m, opts) => notice(m, opts?.title ?? "提示", opts?.duration ?? 2e3, "error", opts?.parseHtml ?? false),
	warning: (m, opts) => notice(m, opts?.title ?? "提示", opts?.duration ?? 2e3, "warning", opts?.parseHtml ?? false),
	info: (m, opts) => notice(m, opts?.title ?? "提示", opts?.duration ?? 2e3, "info", opts?.parseHtml ?? false),
	/** 关闭所有 */
	closeAll: () => ElNotification.closeAll()
};
/** ElMessageBox 对象风格 */
var messageBox = {
	confirm: msgBox,
	prompt: msgBoxPrompt,
	alert: msgBoxAlert,
	close: () => ElMessageBox.close()
};
({ ...messageEl }), messageBox.confirm, messageBox.prompt, messageBox.alert, notification.success, notification.error, notification.warning, notification.info;
//#endregion
//#region ../../packages/languages/src/modules/zh.ts
var zh_default = {
	project: { title: "ADMIN" },
	menu: {
		login: {
			auth: "登录",
			title: "系统管理平台",
			welcome: "欢迎登录",
			platform: "管理平台",
			description: "或许我们只是差点运气",
			account: "账号密码登录",
			in: "登录",
			loading: "登录中",
			beiAnHao: "网站备案号",
			picture: "看不清，换一张",
			systemUnavailable: "系统暂时不可用",
			systemUnavailableDesc: "系统配置加载失败，请稍后重试",
			retry: "重新加载",
			otpTip: "请输入验证器 App 生成的 6 位动态口令",
			totpTip: "请输入验证器 App 生成的 6 位动态码",
			otpTitle: "动态口令验证",
			otpConfirm: "确认",
			otpCancel: "取消",
			sliderTip: "向右滑动完成验证",
			sliderTipPuzzle: "将滑块拖到对应的拼图格",
			sliderSuccess: "验证通过",
			sliderRequired: "请先完成滑块验证",
			style: "登录页风格",
			styleDesc: "切换不同布局与视觉样式",
			styleOptions: {
				defaultLabel: "简单双栏",
				defaultDesc: "品牌展示 + 登录表单",
				cardLabel: "居中卡片",
				cardDesc: "悬浮分栏卡片布局",
				bubbleLabel: "气泡简约",
				bubbleDesc: "气泡背景轻量卡片",
				glassLabel: "玻璃拟态",
				glassDesc: "毛玻璃质感卡片",
				slideLabel: "流光卡片",
				slideDesc: "渐变流光悬浮卡片",
				splitLabel: "分屏沉浸",
				splitDesc: "大屏分栏沉浸布局",
				splitReverseLabel: "左右分屏沉浸式登录页",
				splitReverseDesc: "左表单 · 右品牌沉浸区",
				voxelLabel: "现代立体",
				voxelDesc: "3D 立体粒子风格",
				monoLabel: "等宽终端",
				monoDesc: "极客等宽终端风格",
				simpleLabel: "轻终端",
				simpleDesc: "简洁终端风格"
			},
			featureTags: {
				manage: "高效管理",
				design: "现代设计",
				security: "安全可靠"
			},
			form: {
				loginName: "请输入用户名",
				password: "请输入密码",
				securityCode: "请输入验证码",
				tenantCode: "租户编码（平台用户留空）"
			},
			rules: {
				loginName: {
					required: "用户名不能为空",
					validator: "账号只能包含数字、字母、下划线和中划线"
				},
				password: {
					required: "密码不能为空",
					validator2: "密码必须包含数字和字母"
				},
				securityCode: { required: "验证码不能为空" },
				tenantCode: { validator: "租户编码只能包含数字、字母、下划线和中划线，2-32 位" },
				otpCode: { required: "请输入 6 位动态口令" }
			}
		},
		home: {
			auth: "主控台",
			work: { name: "工作台" },
			analysis: { name: "分析页" },
			console: { name: "控制台" }
		},
		system: {
			auth: "系统管理",
			user: {
				name: "用户管理",
				search: {
					label: {
						loginName: "登录账号",
						userName: "用户名称",
						phone: "手机号",
						deptId: "部门",
						loginTime: "登录时间"
					},
					placeholder: {
						loginName: "请输入登录账号",
						userName: "请输入用户名称",
						phone: "请输入手机号",
						deptId: "请选择部门"
					}
				},
				table: {
					loginName: "登录账号",
					deptName: "部门名称",
					avatar: "头像",
					userName: "用户名称",
					email: "邮箱",
					phone: "手机号",
					userType: "用户类型",
					sex: "用户性别",
					userStatus: "用户状态",
					loginTime: "登录时间"
				},
				form: {
					label: {
						loginName: "登录账号",
						password: "登录密码",
						userName: "用户名称",
						deptId: "部门名称",
						postId: "分配岗位",
						roleId: "分配角色",
						userType: "用户类型",
						userStatus: "用户状态",
						sex: "用户性别",
						avatar: "用户头像",
						phone: "手机号",
						email: "邮箱",
						remark: "用户备注"
					},
					placeholder: {
						loginName: "请输入登录账号",
						password: "请输入登录密码",
						userName: "请输入用户名称",
						deptId: "请选择部门",
						postId: "请选择岗位",
						roleId: "请选择角色",
						userType: "请选择用户类型",
						userStatus: "请选择用户状态",
						sex: "请选择用户性别",
						avatar: {
							description: "请上传头像",
							tip: "图片最大为 3M"
						},
						phone: "请输入手机号码",
						email: "请输入邮箱",
						remark: "请输入用户备注"
					}
				},
				rules: {
					loginName: { required: "请输入登录名称" },
					password: {
						required: "请输入用户密码",
						validator: "至少6位且包含字母和数字"
					},
					userName: { required: "请输入用户名字" },
					deptId: { required: "请选择用户部门" },
					userType: { required: "请输入用户类型" },
					sex: { required: "请选择用户性别" },
					userStatus: { required: "请选择用户状态" },
					phone: { required: "请输入手机号码" }
				},
				transfer: {
					role: "角色列表",
					post: "岗位列表"
				}
			},
			role: { name: "角色管理" },
			menu: { name: "菜单管理" },
			dictType: { name: "字典管理" },
			dictData: { name: "字典详情" },
			dept: { name: "部门管理" },
			post: { name: "岗位管理" },
			loginLogs: { name: "登录日志" },
			operateLogs: { name: "操作日志" },
			notice: { name: "通知公告" },
			personage: { name: "个人中心" }
		},
		hotsport: {
			auth: "热点监控",
			dashboard: { name: "监控概览" },
			traces: { name: "追踪列表" },
			dependencies: { name: "依赖拓扑" },
			leaks: { name: "资源泄漏" }
		},
		monitor: {
			auth: "监控管理",
			scheduled: { name: "定时任务" },
			online: { name: "在线用户" },
			service: { name: "监控大盘" },
			redis: { name: "Redis监控" },
			cache: { name: "数据缓存" },
			blocklist: { name: "阻止名单" }
		},
		tools: {
			auth: "系统工具",
			generate: { name: "代码生成" },
			config: { name: "配置管理" },
			file: { name: "文件管理" },
			picture: { name: "图库管理" },
			testDept: { name: "测试部门" },
			testParams: { name: "测试参数" }
		},
		link: {
			auth: "外部链接",
			back: { name: "前后端" },
			front: { name: "纯前端" },
			blog: { name: "博客版本" },
			element: { name: "ElementPlus" }
		},
		blog: {
			auth: "博客管理",
			category: { name: "文章类别" },
			tag: { name: "标签管理" },
			article: { name: "文章管理" },
			friend: { name: "友链管理" },
			circle: { name: "朋友圈" },
			danMu: { name: "弹幕管理" },
			notice: { name: "通知公告" },
			library: { name: "知识库管理" },
			libraryCatalog: { name: "知识库目录" },
			libraryPreview: { name: "知识库预览" },
			comment: { name: "评论管理" }
		},
		coding: {
			404: { name: "404 页面" },
			403: { name: "403 页面" },
			500: { name: "500 页面" }
		}
	},
	button: {
		search: "搜索",
		reset: "重置",
		add: "添加",
		update: "修改",
		delete: "删除",
		export: "导出",
		import: "导入",
		preview: "预览",
		password: "重置密码",
		expand: "展开/折叠",
		role: "分配角色",
		post: "分配岗位",
		menu: "分配菜单",
		dept: "分配部门",
		refreshCache: "刷新缓存",
		view: "查看",
		detail: "详情",
		save: "保存",
		force: "强退",
		logout: "注销",
		execute: "执行",
		executeOnce: "执行一次",
		file: "文件上传",
		image: "图片上传",
		upload: "上传",
		download: "下载",
		confirm: "确定",
		cancel: "取消",
		refresh: "刷新",
		hideSearch: "隐藏搜索",
		displaySearch: "显示搜索",
		close: "关闭",
		genCode: "生成代码",
		sync: "同步",
		switch: "切换",
		publish: "发布",
		catalog: "目录",
		minimize: "收起窗口",
		restoreMinimized: "恢复表单窗口"
	},
	home: { welcome: "欢迎使用" },
	tabs: {
		refresh: "重新刷新",
		maximize: "全屏切换",
		exitMaximize: "退出全屏",
		closeCurrent: "关闭当前",
		listLabel: "已打开页面标签",
		closeLeft: "关闭左侧",
		closeRight: "关闭右侧",
		closeOther: "关闭其它",
		closeAll: "关闭所有",
		affix: "固定标签",
		unaffix: "取消固定"
	},
	themeConfig: {
		title: "主题配置",
		tabs: {
			appearance: "外观",
			interface: "界面",
			extension: "扩展",
			advanced: "高级"
		},
		sections: {
			userConfig: "用户配置",
			themeMode: "主题模式",
			themeColor: "主题颜色",
			colorStatus: "颜色状态",
			layoutStyle: "布局样式",
			loginStyle: "登录页样式",
			loaderStyle: "加载动画",
			interfaceConfig: "界面配置",
			toolbarSwitch: "工具栏开关",
			messageNotify: "消息通知",
			homeConfig: "首页配置",
			weatherConfig: "天气配置"
		},
		io: {
			export: "导出配置",
			import: "导入配置",
			exportSuccess: "配置已导出",
			importSuccess: "配置已导入",
			importError: "导入失败：文件格式不正确"
		},
		customColor: {
			title: "自定义颜色",
			desc: "色盘或输入 HEX 色值"
		},
		loaderStyle: {
			hint: "首屏加载与页面内的加载遮罩共用同一款动画，选择后本页立即生效，刷新后首屏也是同一款。",
			lockedHint: "动画已由部署配置（app.yaml 的 other.loaderConfig）锁定，此处不可修改。",
			size: "首屏尺寸",
			sizeNarrow: "窄屏",
			sizeWide: "宽屏",
			speed: "动画速度",
			adaptColor: "跟随主题主色",
			adaptColorSub: "动画颜色随主题色变化",
			adaptColorTip: "关闭时使用部署配置里的固定主色；开启后换主题色不用再改加载动画"
		},
		themeModeTabs: {
			light: "明亮",
			dark: "黑暗",
			auto: "自动"
		},
		msgStatus: {
			success: "成功",
			warning: "警告",
			danger: "危险",
			info: "信息",
			successToast: "成功提示：操作已完成",
			warningToast: "警告提示：请确认操作",
			dangerToast: "危险提示：操作失败",
			infoToast: "信息提示：这是一条消息"
		},
		layout: {
			vertical: "纵向",
			columns: "分栏",
			double: "双栏",
			classic: "经典",
			optimum: "混合",
			horizontal: "横向",
			group: "分组"
		},
		interface: {
			routeAnimation: {
				label: "路由动画",
				placeholder: "请选择路由动画",
				none: "无动画",
				default: "默认",
				fade: "淡入淡出",
				slide: "滑动",
				zoomFade: "渐变",
				fadeBottom: "底部滑出",
				fadeScale: "缩放消退"
			},
			menuWidth: "菜单宽度",
			tabsStyle: {
				label: "标签页风格",
				placeholder: "请选择标签页风格",
				card: "标签风格",
				google: "谷歌风格",
				plain: "简约风格"
			},
			dimension: {
				label: "组件尺寸",
				placeholder: "请选择组件尺寸"
			}
		},
		switchBlocks: {
			accordion: {
				title: "菜单手风琴",
				sub: "手风琴模式",
				tip: "菜单展开[启用-单个/关闭-多个]",
				description: "开启后菜单手风琴折叠（同时仅展开一个）"
			},
			asideInverted: {
				title: "侧边栏反转色",
				sub: "反转主题",
				tip: "侧边栏使用反色背景",
				description: "侧边栏应用反转背景色"
			},
			headerInverted: {
				title: "头部反转色",
				sub: "反转主题",
				tip: "顶部导航使用反色背景",
				description: "顶部 Header 应用反转背景色"
			},
			headerShown: {
				title: "显示头部",
				sub: "顶部导航",
				tip: "控制顶部 Header 栏显示/隐藏",
				description: "隐藏后顶部导航栏将不显示"
			},
			tabsShown: {
				title: "显示标签页",
				sub: "多标签",
				tip: "控制多标签页栏显示/隐藏",
				description: "隐藏后多标签页栏将不显示"
			},
			grey: {
				title: "灰色模式",
				sub: "色弱辅助",
				tip: "全局灰色滤镜（悼念/护眼模式）",
				description: "全局灰色滤镜（悼念/护眼模式）"
			},
			weak: {
				title: "色弱模式",
				sub: "色弱辅助",
				tip: "色弱友好滤镜（提升对比度）",
				description: "色弱友好滤镜（提升对比度）"
			},
			collapse: {
				title: "折叠菜单",
				sub: "侧边栏折叠",
				tip: "侧边栏收起为图标条",
				description: "侧边栏收起为图标条"
			},
			collapseToButton: {
				title: "折叠为按钮",
				sub: "仅垂直布局",
				tip: "折叠时不显示图标菜单，整个菜单收缩为一个展开按钮（仅垂直布局生效）",
				description: "折叠时不显示图标菜单，整个菜单收缩为一个展开按钮（仅垂直布局生效）"
			},
			collapseButton: {
				title: "折叠时显示展开按钮",
				sub: "垂直布局",
				tip: "侧边栏折叠后仍显示「展开菜单」按钮（与迷你侧边栏并存）",
				description: "折叠后侧边栏显示「展开菜单」按钮，方便重新展开"
			},
			collapseBar: {
				title: "折叠时保留迷你侧边栏",
				sub: "垂直布局",
				tip: "侧边栏折叠后保留迷你图标菜单条",
				description: "折叠后侧边栏保留为迷你图标菜单条"
			}
		},
		message: {
			position: {
				label: "展示位置",
				toolbar: "顶栏铃铛",
				rightBottom: "右下角浮窗",
				hidden: "全部隐藏"
			},
			push: {
				title: "实时推送",
				sub: "Socket",
				tip: "依赖 Socket 实时推送；关闭后仅 HTTP 拉取",
				description: "依赖 Socket 实时推送；关闭后仅 HTTP 拉取"
			}
		},
		home: { customLayout: {
			title: "自定义布局按钮",
			sub: "首页",
			tip: "首页顶部右侧的自定义布局切换按钮",
			description: "首页顶栏右侧自定义布局按钮"
		} },
		weather: { enable: {
			title: "显示天气",
			sub: "工具栏",
			tip: "顶部工具栏右侧显示天气信息",
			description: "显示当前天气和一周预报"
		} },
		toolbar: {
			searchMenu: {
				label: "搜索菜单",
				sub: "顶栏搜索",
				tip: "顶部搜索框快捷搜索菜单",
				description: "顶栏快捷搜索菜单项"
			},
			refresh: {
				label: "路由缓存刷新",
				sub: "缓存清理",
				tip: "点击清空 keepAlive 缓存",
				description: "点击清空 keepAlive 缓存"
			},
			dark: {
				label: "明亮/暗黑切换",
				sub: "主题切换",
				tip: "切换明亮/暗黑主题",
				description: "明亮/暗黑主题切换"
			},
			language: {
				label: "语言翻译",
				sub: "国际化",
				tip: "切换中英文等国际化文案",
				description: "中英文等国际化切换"
			},
			fullScreen: {
				label: "全屏切换",
				sub: "全屏",
				tip: "切换浏览器全屏",
				description: "切换浏览器全屏"
			},
			themeSetting: {
				label: "主题配置入口",
				sub: "面板入口",
				tip: "打开主题配置面板",
				description: "打开主题配置面板"
			},
			user: {
				label: "用户信息下拉",
				sub: "用户菜单",
				tip: "顶栏用户下拉菜单",
				description: "顶栏用户下拉菜单"
			},
			breadcrumb: {
				label: "面包屑导航",
				sub: "面包屑",
				tip: "顶部面包屑导航",
				description: "顶部面包屑导航"
			},
			breadcrumbDropdown: {
				label: "面包屑子级下拉",
				sub: "下拉菜单",
				tip: "面包屑超过显示省略号时可下拉",
				description: "面包屑超过显示省略号时可下拉"
			},
			breadcrumbIcon: {
				label: "面包屑图标",
				sub: "图标前缀",
				tip: "面包屑项前显示图标",
				description: "面包屑项前显示图标"
			},
			tabIcon: {
				label: "标签页图标",
				sub: "标签图标",
				tip: "多标签页标签前显示图标",
				description: "多标签页标签前显示图标"
			},
			logo: {
				label: "Logo 显示",
				sub: "品牌",
				tip: "侧边栏顶部 Logo 显示",
				description: "侧边栏顶部 Logo 显示"
			},
			message: {
				label: "站内消息铃铛",
				sub: "消息",
				tip: "顶栏消息铃铛与未读小红点",
				description: "顶栏消息铃铛与未读小红点"
			},
			quickNote: {
				label: "快捷便条",
				sub: "便签",
				tip: "顶栏创建悬浮便条",
				description: "顶栏显示便条入口，点击创建悬浮便条"
			},
			quickNoteConfirm: {
				label: "便条关闭确认",
				sub: "二次确认",
				tip: "关闭便条前弹出确认框",
				description: "关闭便条时二次确认，避免误删内容"
			},
			weather: {
				label: "顶栏天气",
				sub: "天气",
				tip: "顶栏右侧天气显示，点击展开周预报",
				description: "顶栏右侧显示天气组件"
			},
			bigscreen: {
				label: "大屏入口",
				sub: "大屏",
				tip: "顶栏显示大屏图标，点击在新窗口打开大屏路由",
				description: "顶栏显示大屏入口图标，开启后注入独立大屏路由"
			},
			typhoon: {
				label: "台风监测",
				sub: "台风",
				tip: "顶栏右侧显示活跃台风图标，点击查看详情",
				description: "顶栏右侧显示台风监测组件"
			},
			exchangeRate: {
				label: "顶栏汇率",
				sub: "汇率",
				tip: "顶栏右侧汇率显示，点击展开面板",
				description: "顶栏右侧显示汇率组件"
			}
		}
	},
	aiChat: {
		title: "AI 对话",
		enable: "启用 AI 助手",
		enableTip: "开启后页面右下角显示悬浮 AI 入口",
		modePlaceholder: "运行模式",
		modelPlaceholder: "选择本地推理模型",
		vendorPlaceholder: "选择服务厂商",
		modeOptions: {
			webllm: "浏览器本地推理 (WebLLM)",
			vendor: "厂商 API (在线)"
		},
		vendorOptions: {
			openai: "OpenAI (GPT 系列)",
			deepseek: "DeepSeek (深度求索)",
			custom: "自定义 (兼容 OpenAI 格式)"
		},
		webllmModelRecommend: "(推荐·轻量)",
		modelLight: "超轻",
		modelMedium: "中量",
		status: {
			loading: "正在加载模型...",
			generating: "正在生成回复...",
			idle: "模型就绪，可正常对话"
		},
		actions: {
			loading: "加载中",
			loadModel: "加载模型",
			unload: "卸载"
		},
		apiUrl: "API URL",
		apiUrlPlaceholder: "https://api.openai.com/v1/chat/completions",
		apiKey: "API Key",
		apiKeyPlaceholder: "sk-...",
		modelId: "模型 ID",
		modelIdPlaceholder: "选择或输入模型 ID",
		modelIdInputPlaceholder: "手动输入模型 ID",
		syncTooltip: "获取模型列表",
		advanced: {
			title: "高级参数",
			maxTokens: "最大 Token",
			maxTokensSub: "限制",
			temperature: "温度",
			temperatureSub: "随机性"
		},
		context: {
			title: "上下文管理",
			limit: "上下文上限",
			limitSub: "条数",
			summaryThreshold: "自动总结阈值",
			summaryThresholdSub: "百分比",
			summaryEnabled: "第 N 轮压缩",
			summaryEnabledSub: "启用后，超阈值的历史将被压缩为摘要",
			retainRounds: "保留最近轮数",
			retainRoundsSub: "摘要之外保留的原始对话轮数"
		},
		character: {
			title: "助手形象",
			placeholder: "选择形象",
			model3d: "3D 模型",
			model2d: "2D 图标",
			glbPlaceholder: "GLB 模型地址"
		},
		toast: {
			loaded: "模型加载完成，可以开始对话",
			loadFailed: "模型加载失败",
			unloaded: "模型已卸载，显存已释放"
		}
	},
	accessibility: {
		title: "无障碍",
		screenReader: {
			title: "读屏优化模式",
			sub: "焦点高亮",
			tip: "为视障用户优化焦点高亮和可读性"
		},
		highContrast: {
			title: "高对比度模式",
			sub: "对比度增强",
			tip: "提高文字与背景对比度，独立于深色模式"
		},
		voiceRead: {
			title: "语音朗读",
			sub: "TTS",
			tip: "焦点移入元素时自动朗读内容",
			unsupportedTip: "当前浏览器不支持语音朗读"
		}
	},
	performance: {
		title: "性能监控",
		fps: {
			title: "FPS",
			sub: "帧率",
			tip: "衡量页面流畅度，60FPS 为最佳"
		},
		memory: {
			title: "内存",
			sub: "JS Heap",
			tip: "当前页面使用的 JS 堆内存（仅 Chrome/Edge 有效）"
		},
		cpu: {
			title: "CPU",
			sub: "主线程负载",
			tip: "基于主线程帧间隔估算的负载值"
		},
		battery: {
			title: "电池",
			sub: "电量状态"
		},
		bluetooth: {
			title: "蓝牙",
			sub: "可用性"
		},
		screen: {
			title: "屏幕",
			sub: "分辨率"
		},
		position: {
			label: "显示位置",
			topLeft: "左上角",
			topCenter: "顶部居中",
			topRight: "右上角",
			leftCenter: "左侧居中",
			rightCenter: "右侧居中",
			bottomLeft: "左下角",
			bottomCenter: "底部居中",
			bottomRight: "右下角"
		},
		content: {
			label: "内容展示",
			detailed: "详细",
			simple: "简洁",
			minimal: "极简"
		},
		layout: {
			label: "布局模式",
			merged: "合并",
			split: "分离"
		},
		direction: {
			label: "布局方向",
			auto: "自动",
			vertical: "垂直",
			horizontal: "水平"
		}
	},
	devTools: {
		title: "开发工具",
		liteTools: {
			title: "轻量调试",
			sub: "总开关",
			tip: "显示标尺、网格和悬停信息等调试辅助"
		},
		ruler: {
			title: "标尺",
			sub: "像素刻度",
			tip: "在页面顶部和左侧显示像素标尺"
		},
		grid: {
			title: "网格",
			sub: "布局辅助",
			tip: "显示 8px 布局网格辅助对齐"
		},
		hoverInspector: {
			title: "悬停检查",
			sub: "元素信息",
			tip: "鼠标悬停显示元素标签、类名和尺寸"
		}
	},
	heatmap: {
		title: "热点工具",
		cover: {
			title: "热力图覆盖层",
			sub: "点击热力图",
			tip: "记录用户点击热点，以热力图形式覆盖展示（仅开发/测试环境）"
		},
		clear: "清空热点数据",
		hint: "已记录 {count} 个热点",
		cleared: "热力图数据已清空"
	},
	systemDebug: {
		title: "系统调试",
		eruda: {
			title: "Eruda 控制台",
			sub: "移动端调试器",
			tip: "集成 eruda，提供 Console / Elements / Network / Resources 等调试面板",
			description: "动态加载 CDN 脚本，关闭后自动销毁"
		}
	},
	emptyState: {
		title: "空状态样式",
		desc: "列表 / 表格无数据时展示的样式，仅管理员可改",
		enable: {
			title: "统一空状态样式",
			sub: "全局生效",
			tip: "关闭后所有未显式指定 layout 的 ReEmpty 回落 el-empty"
		},
		layout: {
			title: "样式类型",
			el: "经典",
			modern: "现代",
			plot: "动画图"
		},
		figure: { title: "图形类型" },
		figures: {
			plot: "曲线台",
			phosphor: "磷光点阵",
			slow: "传送带",
			terrain: "柱阵",
			riffle: "卡片翻页",
			stack: "调用栈",
			branches: "提交图",
			drawer: "抽屉",
			vault: "保险库",
			turntable: "转台",
			sieve: "筛网",
			query: "问号"
		},
		tip: "仅对没有显式传 layout 的 ReEmpty 生效，改动即时预览并保存"
	},
	header: {
		searchMenu: "搜索菜单",
		componentSize: "组件大小",
		refreshCache: "刷新缓存",
		lightMode: "明亮模式",
		darkMode: "暗黑模式",
		autoMode: "跟随系统",
		language: "语言翻译",
		fullScreen: "全屏",
		exitFullScreen: "退出全屏",
		bigscreen: "大屏",
		collapseToolbar: "收起工具栏",
		expandToolbar: "展开工具栏",
		timer: {
			tip: "多时区计时器",
			title: "多时区时间",
			localLabel: "本地时间",
			empty: "主题配置-高级 中可添加时区",
			weekday: [
				"日",
				"一",
				"二",
				"三",
				"四",
				"五",
				"六"
			],
			configTitle: "计时器配置",
			enableTitle: "启用顶部计时器",
			enableSub: "Worker 驱动",
			enableTip: "Header 右上角展示时间，多时区悬停查看（repo/work Worker 驱动）",
			enableDesc: "Header 顶部多时区时间显示，多时区悬停查看",
			zoneTitle: "展示时区",
			zonePlaceholder: "选择时区",
			zoneAdd: "添加时区",
			zoneTip: "最多 3 个时区，UTC-12 ~ UTC+12；清空后仅显示本地时间",
			groupAmericas: "美洲 / 太平洋",
			groupEurope: "欧洲 / 非洲",
			groupAsia: "亚洲 / 大洋洲"
		},
		weather: { tip: "查看天气" },
		exchangeRate: {
			empty: "暂无汇率数据",
			calcTitle: "汇率换算",
			amount: "金额",
			swap: "互换币种",
			noTrend: "暂无走势数据",
			high: "最高",
			low: "最低",
			updated: "更新于 {time}",
			sourceBackend: "来源 后台",
			sourceFrankfurter: "来源 frankfurter",
			back: "返回",
			pickFrom: "选择源币种",
			pickTo: "选择目标币种",
			search: "搜索币种：名称 / 代码 / 别名",
			searchPair: "搜索币对：如 美元、rmb、乌克兰",
			searchEmpty: "没有匹配的币种",
			otherCurrencies: "其他币种",
			convertTo: "换算 {name}",
			pin: "固定到顶栏",
			unpin: "取消固定",
			pinned: "顶栏显示中"
		},
		settings: "设置",
		personalCenter: "个人中心",
		changePassword: "修改密码",
		logout: "退出登录",
		dimensionList: {
			default: "默认",
			large: "大型",
			small: "小型"
		},
		languageList: {
			chinese: "简体中文",
			english: "英文"
		},
		menuSearch: "菜单搜索：支持菜单名称、路径",
		searchMenuHint: "输入菜单名称或路径，快速定位页面",
		searchMenuSelect: "选择",
		searchMenuEnter: "确认",
		searchMenuEsc: "关闭",
		pinMenu: "固定子菜单",
		unpinMenu: "取消固定",
		envBadge: {
			prod: "生产",
			test: "测试",
			dev: "开发",
			mode: "运行模式",
			backend: "后端地址",
			sameOrigin: "同源"
		},
		alerts: {
			none: "暂无未处置告警",
			open: "有 {n} 条未处置告警",
			empty: "当前没有待处理的告警"
		},
		noteEntry: {
			title: "便签",
			label: "快捷便条",
			placeholder: "记录点什么…",
			confirmDelete: "确认删除该便条？",
			created: "已保存",
			deleted: "已删除",
			count: "条便签",
			minimize: "最小化",
			maximize: "最大化",
			fullscreen: "全屏",
			restore: "还原",
			close: "关闭"
		},
		commandPalette: {
			tip: "命令面板（Ctrl/⌘ + K）",
			placeholder: "搜索菜单，或输入动作名称…",
			title: "命令面板",
			hint: "跳转页面、执行动作，Ctrl/⌘ + K 随时唤起",
			recent: "最近访问",
			actions: "动作",
			menus: "菜单",
			actionHint: {
				refresh: "清缓存并重新加载",
				theme: "切换主题模式",
				fullscreen: "切换全屏",
				settings: "打开主题设置抽屉"
			}
		}
	},
	msg: {
		success: "操作成功",
		fail: "操作失败，请刷新重试",
		selectData: "请选择数据",
		validFail: "验证失败，请检查表单内容",
		null: "暂无数据",
		closeTips: "您确认进行关闭么？",
		closed: "已关闭",
		cancelled: "已取消",
		remind: "温馨提示：",
		confirmWant: "您确认要",
		confirmDelete: "您确认要删除么？",
		confirmLogin: "账号身份已过期，请重新登录",
		selectDate: "请选择日期",
		selectDateTime: "请选择日期时间",
		selectNumber: "请输入数字",
		beginTime: "开始日期",
		endTime: "结束日期",
		to: "至",
		keyword: "关键字搜索",
		configFail: "配置失败",
		logIn: "请重新登录",
		logInFail: "登录失败，请检查账号或密码",
		yzmFail: "验证码获取失败",
		requestFailed: "请求失败",
		http: {
			serverBusy: "服务器繁忙，请稍后重试",
			serverUnavailable: "服务暂时不可用，请稍后重试",
			serverTimeout: "服务器响应超时，请稍后重试",
			serverError: "服务器内部错误，请稍后重试",
			networkError: "网络连接异常，请检查网络"
		}
	},
	table: {
		number: "序号",
		operate: "操作"
	},
	tree: {
		topLevel: "最顶级数据",
		selectParent: "请选择上级数据"
	},
	dict: {
		sys_switch_status: {
			open: "启用",
			stop: "停用"
		},
		sys_user_sex: {
			man: "男",
			woman: "女",
			unknown: "未知"
		},
		sys_yes_no: {
			yes: "是",
			no: "否"
		}
	},
	hotsport: {
		refresh: "刷新",
		graph: "关系图",
		list: "列表",
		dashboard: {
			title: "实时调用拓扑",
			trend: "近期调用趋势",
			transmissionCount: "调用次数",
			traceCount: "追踪链路",
			dependencyCount: "依赖节点",
			leakCount: "泄漏告警",
			fetchStatsError: "获取统计数据失败"
		},
		traces: {
			title: "实时追踪 (Spans)",
			className: "类名",
			method: "方法",
			durationMs: "耗时(ms)",
			status: "状态",
			startTime: "开始时间",
			empty: "暂无数据",
			fetchError: "获取追踪数据失败"
		},
		dependencies: {
			title: "服务依赖关系",
			source: "源服务",
			target: "目标服务",
			callCount: "调用次数",
			errorCount: "错误数",
			avgDurationMs: "平均耗时(ms)",
			lastCallAt: "最后调用",
			fetchError: "获取依赖数据失败"
		},
		leaks: {
			title: "资源泄漏检测",
			resourceType: "资源类型",
			resourceName: "资源名称",
			stack: "堆栈",
			view: "查看",
			noStack: "无堆栈",
			fetchError: "获取泄漏数据失败"
		}
	},
	policy: {
		common: {
			action: "操作",
			remark: "备注",
			status: "状态",
			active: "生效",
			createTime: "创建时间",
			hits: "命中次数",
			burst: "突发参数",
			matchTarget: "匹配目标",
			enabled: "已启用",
			enable: "启用",
			disabled: "禁用",
			whitelist: "白名单",
			blacklist: "黑名单",
			listType: "名单类型",
			all: "全部",
			current: "当前",
			save: "保存",
			cancel: "取消",
			close: "关闭",
			deleteConfirm: "删除确认",
			saveFailed: "保存失败",
			deleteFailed: "删除失败",
			toggleFailed: "切换失败",
			reloadFailed: "重载失败",
			account: "账号",
			deleted: "已删除",
			stopped: "已停用",
			remove: "删除",
			hitDetailOf: "命中明细 {name}",
			editOf: "编辑 {name}",
			deleteOf: "删除 {name}",
			activeOf: "生效 {name}",
			enableOf: "启用 {name}",
			hitOf: "命中 {name}",
			notConfigured: "未配置"
		},
		hero: {
			title: "策略控制台",
			subtitle: "从配置发布、流量保护到访问名单，统一管理应用运行时策略",
			chainOk: "运行链路正常",
			refresh: "刷新",
			enterConfig: "进入配置 →"
		},
		nav: {
			aria: "策略控制台导航",
			workspace: "策略工作区",
			overview: {
				label: "策略总览",
				caption: "运行链路与容量"
			},
			hotreload: {
				label: "热更新配置",
				caption: "运行时参数"
			},
			ratelimit: {
				label: "限流策略",
				caption: "QPS 与规则"
			},
			blackwhite: {
				label: "访问名单",
				caption: "IP 与账号"
			},
			gray: {
				label: "灰度配置",
				caption: "流量切分"
			},
			header: {
				label: "消息头拦截",
				caption: "UA 与爬虫"
			},
			route: {
				label: "接口管控",
				caption: "停用与转发"
			},
			rate: {
				interface: "接口维度",
				ip: "IP 维度",
				account: "账号维度"
			},
			bw: {
				ip: "IP 名单",
				account: "账号名单"
			}
		},
		overview: {
			chain: "运行链路",
			chainDesc: "策略按“配置 → 限流 → 名单”顺序生效，黑名单始终优先于白名单豁免。",
			refreshStats: "刷新统计",
			hotReload: "热更新发布",
			hotReloadCount: "{count} 项运行配置",
			rateLimit: "流量限流",
			rateCount: "{enabled}/{total} 条已启用",
			rateCountGlobalOff: "{enabled}/{total} 条已启用 · 全局上限已关闭（规则仍生效）",
			blackwhite: "访问名单",
			blackwhiteCount: "{count} 条黑白名单",
			passBlock: "请求放行 / 拦截",
			passBlockDesc: "白名单绕过限流",
			rateRule: "限流执行口径",
			rateRuleDesc: "规则命中后使用 QPS 令牌桶；突发参数当前仅保存配置，不参与令牌桶容量计算。",
			manageRules: "管理规则",
			hotReloadBoundary: "热更新发布边界",
			hotReloadBoundaryDesc: "保存后定向清理设置缓存并发布变更事件，只有显式声明的运行时消费者才会执行。",
			manageConfig: "管理配置",
			listPriority: "名单优先级",
			listPriorityDesc: "IP 或账号命中黑名单立即拒绝，白名单不能覆盖黑名单。白名单是「放行豁免」不是准入名单：该 IP 跳过限流，未列入任何名单的 IP 仍默认放行。",
			manageList: "管理名单",
			cards: {
				hotreload: {
					label: "热更新配置",
					unit: "项"
				},
				ratelimit: {
					label: "限流规则",
					unit: "条"
				},
				blackwhite: {
					label: "访问名单",
					unit: "条"
				},
				overview: {
					label: "运行链路",
					unit: "级"
				}
			}
		},
		hotreload: {
			title: "热更新配置",
			desc: "维护 {hotReload} 分组的运行时设置，带 ID 保存为更新，无 ID 保存为新增。",
			reloadNow: "立即热重载",
			add: "新增配置",
			contract: "发布契约",
			contractDesc: "支持 string / number / boolean / json；事务提交后清理 hot_reload 缓存并通过 AOP 读取最新值。",
			lastReload: "最近重载 {time} · 启用 {count} 项",
			empty: "暂无热更新配置",
			col: {
				name: "配置名称",
				code: "配置编码",
				value: "配置值",
				type: "类型"
			},
			typeString: "字符串",
			typeNumber: "数字",
			typeBoolean: "布尔",
			formValueType: "值类型",
			phName: "请输入配置名称",
			phValue: "请输入配置值",
			errValue: "请填写配置名称和编码",
			errCode: "配置编码仅支持字母、数字、点、横线与下划线，且必须以字母开头",
			errNotNumber: "配置值必须是有效数字",
			errNotBoolean: "配置值必须是 true 或 false",
			errNotJson: "配置值必须是有效 JSON",
			errDuplicate: "配置未保存，请检查配置编码是否重复",
			saved: "热更新配置已更新",
			created: "热更新配置已创建",
			reloaded: "热重载完成，已加载 {count} 项启用配置",
			reloadFailed: "热重载失败",
			loadFailed: "热更新配置加载失败",
			dialogEdit: "编辑热更新配置",
			dialogAdd: "新增热更新配置",
			deleteTitle: "删除热更新配置",
			deleteBody: "确认删除「{name}」？删除后运行时将不再读取该配置。",
			deleted: "热更新配置已删除",
			errNotDeleted: "配置未删除，记录可能已不存在"
		},
		rate: {
			desc: "按接口、IP、账号维护精确规则；全局参数通过右上角入口单独配置。",
			add: "新增规则",
			empty: "暂无{name}",
			globalAria: "全局限流配置，当前{state}",
			global: "全局限流",
			globalOffNotice: "全局限流已关闭：不再设系统级 QPS 总上限，但下面已启用的规则仍按各自 QPS 生效。需要给全系统加一道总上限时再开启。",
			on: "已开启",
			off: "已关闭",
			hitTitle: "限流规则 {target}",
			dimLabel: "限流维度",
			dimInterface: "接口",
			dimAccount: "账号",
			keepEnabled: "规则将写入运行时缓存",
			keepDisabled: "规则保持停用",
			ruleQps: "规则 QPS",
			ruleBurst: "规则突发参数",
			enableRule: "启用规则",
			enableRuleAria: "启用限流规则",
			meta: {
				interface: {
					title: "接口规则",
					description: "按 context-path 去除后的请求路径匹配，例如 /v2/user/page",
					target: "请输入接口路径，如 /v2/user/page"
				},
				ip: {
					title: "IP 规则",
					description: "对精确 IP 单独设置访问频率",
					target: "请输入精确 IP，如 192.168.1.10"
				},
				account: {
					title: "账号规则",
					description: "对精确登录账号单独设置访问频率",
					target: "请输入登录账号"
				}
			},
			col: { runStatus: "运行状态" },
			globalDialog: {
				title: "全局限流配置",
				enable: "启用全局限流",
				enableDesc: "关闭时不再设系统级 QPS 总上限（各规则仍按自己的 QPS 生效）；开启后全系统共用一道总上限",
				enableAria: "启用全局限流",
				qps: "全局 QPS",
				burst: "突发参数",
				burstAria: "全局突发参数",
				domain: "配置域",
				domainDesc: "规则限流运行时以 QPS 为核心，突发参数当前仅保存配置，不参与令牌桶容量计算。",
				apply: "应用参数"
			},
			errQps: "QPS 必须是大于 0 的整数",
			errBurst: "突发参数必须是非负整数",
			loadGlobalFailed: "全局配置加载失败",
			loadRulesFailed: "限流规则加载失败",
			globalApplied: "全局配置已应用",
			globalApplyFailed: "全局配置应用失败",
			errTargetTooLong: "规则目标不能超过 500 个字符",
			errNotCreated: "规则未创建",
			errNotUpdated: "规则未更新，记录可能已被删除",
			saved: "限流规则已更新",
			created: "限流规则已创建",
			errStatusNotUpdated: "规则状态未更新",
			ruleEnabled: "规则已启用",
			ruleStopped: "规则已停用",
			statusFailed: "状态更新失败",
			deleteTitle: "删除限流规则",
			deleteBody: "确认删除规则「{target}」？",
			errNotDeleted: "限流规则未删除，记录可能已被删除",
			deleted: "限流规则已删除",
			dialogEdit: "编辑限流规则",
			dialogAdd: "新增限流规则"
		},
		bw: {
			desc: "管理 IP 网段与登录账号；黑名单优先，白名单用于绕过限流。",
			addRule: "新增{kind}规则",
			emptyIp: "暂无 IP 规则",
			emptyAccount: "暂无账号规则",
			hitTitleIp: "IP 名单 {ip}",
			hitTitleAccount: "账号名单 {account}",
			phIp: "如 192.168.1.0/24",
			phAccount: "请输入账号",
			dialogIpEdit: "编辑 IP 规则",
			dialogIpAdd: "新增 IP 规则",
			dialogAccEdit: "编辑账号规则",
			dialogAccAdd: "新增账号规则",
			errIpBlank: "请输入 IP 地址或 CIDR",
			errIpInvalid: "请输入有效 IPv4 或 IPv4 CIDR，例如 192.168.1.0/24",
			errIpNotUpdated: "IP 规则未更新，记录可能已被删除",
			ipSaved: "IP 规则已更新",
			ipCreated: "IP 规则已创建",
			deleteIpTitle: "删除 IP 规则",
			deleteIpBody: "确认删除 IP 规则「{ip}」？",
			errIpNotDeleted: "IP 规则未删除，记录可能已被删除",
			ipDeleted: "IP 规则已删除",
			errAccTooLong: "账号不能超过 100 个字符",
			errPickType: "请选择名单类型",
			errPickStatus: "请选择状态",
			errAccNotUpdated: "账号规则未更新，记录可能已被删除",
			accSaved: "账号规则已更新",
			accCreated: "账号规则已创建",
			deleteAccTitle: "删除账号规则",
			deleteAccBody: "确认删除账号规则「{account}」？",
			errAccNotDeleted: "账号规则未删除，记录可能已被删除",
			accDeleted: "账号规则已删除"
		},
		header: {
			desc: "按请求消息头（主要是 {ua}）拦爬虫与自动化客户端。保存、启停、删除{immediate}，不需要重启。",
			reload: "重载规则",
			add: "新增规则",
			ruleTitle: "默认按「包含」匹配，且排在鉴权之前",
			ruleDesc: "UA 里识别爬虫/自动化靠的是特征片段（{bot}、{headless}、{python}），所以默认是「含有这个词就拦」。过滤器排在鉴权{before}：这些客户端大多没有有效凭证，放在鉴权后拦等于白跑一遍 token 校验。规则解析或匹配出异常时一律{pass}，不会因为策略本身的 bug 打挂整站。",
			empty: "暂无消息头拦截规则",
			hitTitle: "消息头 {name}",
			termImmediate: "即时生效",
			termImmediateAll: "立即对全节点生效",
			termBefore: "之前",
			termPass: "放行",
			defaultMessage: "自动化客户端访问已被拒绝",
			phPatterns: "每行一条，例如：\nGooglebot\npython-requests\nHeadlessChrome",
			presetFill: "一键填入预置特征（{count} 条）",
			col: {
				headerName: "消息头",
				matchType: "匹配方式",
				patterns: "特征",
				blockStatus: "拒绝码",
				active: "生效"
			},
			match: {
				CONTAINS: {
					label: "包含",
					hint: "推荐。UA 里的判别特征是片段，含有就拦"
				},
				EQUALS: {
					label: "完全相等",
					hint: "整个 UA 串完全相同才拦"
				},
				PREFIX: {
					label: "前缀",
					hint: "以指定串开头才拦"
				},
				REGEX: {
					label: "正则",
					hint: "最强也最容易写错。写错只跳过该条模式，不影响其余"
				}
			},
			form: {
				name: "消息头",
				nameDesc: "常见的就是 {ua}。改消息头名会让已建的规则失效重建，所以编辑时不允许改。",
				matchType: "匹配方式",
				patterns: "特征",
				blockStatus: "拒绝码",
				blockDefault: "403 Forbidden（默认）",
				message: "提示文案",
				messagePh: "返回给调用方的 msg",
				active: "生效",
				desc: "保存后{immediate}，无需重启。特征写错只会跳过那一条，其余特征照常拦截。",
				dialogEdit: "编辑消息头拦截规则",
				dialogAdd: "新增消息头拦截规则"
			},
			errPresets: "预设尚未加载，稍后再试",
			presetFilled: "已填入 {count} 条预置特征，请删掉不需要的",
			errNameBlank: "请填写消息头名",
			errPatternsEmpty: "请至少填写一条特征",
			saved: "规则已更新，即时生效",
			created: "规则已创建，即时生效",
			enabledNow: "已启用，即时生效",
			stoppedNow: "已停用，即时失效",
			deletedNow: "已删除，即时失效",
			deleteBody: "确认删除「{name}」的拦截规则？",
			reloaded: "已重载 {count} 条规则"
		},
		gray: {
			desc: "按业务键维护灰度规则：权重决定放量比例，命中策略以 JSON 描述用户/角色/IP 等条件。",
			add: "新增灰度",
			landing: "配置落点",
			landingDesc: "一行为一条配置，存于统一策略表 {table}；顺序按 sort 升序、创建时间降序。",
			empty: "暂无灰度配置",
			enableOf: "启用灰度 {key}",
			col: {
				bizKey: "灰度键",
				weight: "权重%",
				hitStrategy: "命中策略(JSON)"
			},
			form: {
				bizKey: "灰度键",
				bizKeyPh: "如 order.submit.v2",
				weight: "权重(%)",
				sort: "排序",
				hitStrategy: "命中策略",
				hitStrategyPh: "JSON 形式，如 {'{\"users\":[\"sa\"],\"ips\":[\"10.0.0.0/8\"],\"rule\":\"1==1\"}'}",
				dialogEdit: "编辑灰度配置",
				dialogAdd: "新增灰度配置"
			},
			loadFailed: "灰度配置加载失败",
			errKeyBlank: "请填写灰度键",
			errNotJson: "命中策略必须是合法 JSON",
			saved: "灰度配置已更新",
			created: "灰度配置已创建",
			deleteBody: "确认删除灰度配置「{key}」？"
		},
		route: {
			desc: "在线停用接口，或把一个接口的流量转发到另一个已注册接口。规则改动立即对全节点生效。",
			reloadIndex: "重载路由索引",
			add: "新增规则",
			forwardTitle: "转发目标只能来自应用内已注册路由",
			forwardDesc: "目标不是手填的地址，而是由服务端从 Spring 已注册的 {requestMapping} 反查得到，因此无法把本服务变成跳板去访问外部地址。目标解析不到时按「停用」处理，不会放行。规则{byPath}生效，同一路径的多个方法（如 {getPost}）会一起被停用或转发。",
			pathDesc: "路径请写应用内路径（不含 {ctx} 这类 context-path）。转发目标只能从下拉里选，服务端会用 Spring 已注册的路由反查真实路径，{cannot}指向外部地址。",
			indexCount: "当前索引 {indexed} 条已注册路由项，按路径合并后本表共 {total} 条。",
			phFilter: "按路径 / 方法 / 处理方法 / 备注过滤",
			filterAria: "接口管控关键词过滤",
			query: "查询",
			empty: "暂无接口管控规则",
			hitTitle: "接口管控 {path}",
			customPathHint: "自定义路径（不在已注册路由中）",
			actionDisableLabel: "停用（直接拒绝）",
			actionForwardLabel: "转发（换到另一个接口）",
			stateBlocked: "已拦截",
			stateForwarded: "已转发",
			stateInactive: "未生效（接口放行）",
			stateRuleOn: "规则生效中",
			stateRuleOff: "规则已停用",
			stateNoteUnconfigured: "未配置管控规则，该接口不受管控，正常放行。",
			stateNoteInactive: "规则已配置但处于停用状态，不参与执行，该接口正常放行。",
			stateNoteBlocked: "规则生效中，命中后直接返回 {code}。",
			stateNoteForwarded: "规则生效中，命中后转发到 {target}。",
			stateLegendTitle: "状态含义",
			stateLegend: "状态含义：未配置＝没有规则，接口不受管控；未生效＝规则存在但已停用，接口正常放行；已拦截＝规则生效中，命中后按响应码拒绝；已转发＝规则生效中，命中后转到目标接口。",
			deleteRule: "删除规则",
			deleteRuleTip: "删除该路由的管控规则",
			ruleDeleted: "规则已删除",
			toastBlocked: "接口已拦截",
			toastForwardOn: "转发已生效",
			toastAllowed: "接口已放行",
			customStatusHint: "自定义响应码，未在候选列表中。",
			termCannot: "无法",
			termByPath: "按路径",
			actionLabelEdit: "编辑",
			actionLabelConfig: "配置",
			col: {
				method: "方法",
				handler: "处理方法",
				action: "动作",
				target: "转发目标",
				status: "生效"
			},
			form: {
				path: "接口路径",
				pathPh: "应用内路径，不含 context-path，如 /v2/user/me",
				action: "动作",
				statusCode: "响应码",
				statusCodePh: "选择停用时返回的响应码",
				statusCodeAria: "停用响应码",
				message: "提示文案",
				messagePh: "返回给调用方的 msg",
				target: "转发目标",
				targetPh: "从已注册路由中选择",
				dialogEdit: "编辑接口管控规则",
				dialogAdd: "新增接口管控规则"
			},
			defaultMessage: "接口已停用，请稍后再试",
			loadFailed: "接口管控加载失败",
			routesLoadFailed: "已注册路由加载失败",
			synced: "已同步到表：路由 {routes} 条，规则 {policies} 条",
			errPathBlank: "请填写接口路径",
			errPathSlash: "接口路径必须以 / 开头",
			errTargetBlank: "请选择转发目标",
			errPathUnknown: "该路径不在已注册路由中，规则会保存但不会对任何请求生效",
			saved: "规则已更新",
			created: "规则已创建",
			errNotConfigured: "该路由尚未配置策略，请先点「配置」",
			errNothingToDelete: "该路由没有配置过策略，无需删除",
			deleteBody: "确认删除「{path}」的停用/转发规则？"
		},
		status: {
			"503": "服务不可用。最常用的「临时停用」语义，客户端通常会重试或降级。",
			"502": "网关错误。适合表达「这个接口被摘掉了，上游拿不到」。",
			"500": "服务端错误。语义偏「内部异常」，停用接口用 500 容易和真实故障混淆。",
			"429": "限流。适合「不是停用，而是要压流量」的场景。",
			"403": "无权限。适合「接口还在，但当前调用方不许用」。",
			"404": "不存在。适合对外隐藏某接口，不暴露它存在过。",
			"401": "未认证。慎用：会与真实鉴权失败的排查混淆。"
		},
		hit: {
			title: "命中明细 · {name}",
			total: "累计命中",
			ipCount: "来源 IP 数",
			last: "最近命中",
			empty: "这条策略还没有生效过。命中次数只统计规则{effective}的请求：黑名单被拦、限流被拒、接口被停用或转发才算；放行的请求不计入。",
			topIps: "来源 IP Top 10",
			trend: "命中趋势（分钟）",
			trendEmpty: "暂无分钟级趋势数据（趋势只保留最近 1 小时，且进程重启即清零）。",
			detailTitle: "客户端 IP 明细（谁在打）",
			colIp: "客户端 IP",
			colCount: "访问次数",
			termEffective: "真的起作用",
			loadFailed: "命中明细加载失败"
		}
	}
};
//#endregion
//#region ../../packages/languages/src/modules/en.ts
var en_default = {
	project: { title: "ADMIN" },
	menu: {
		login: {
			auth: "Login",
			title: "ADMIN Platform",
			welcome: "Welcome to login",
			platform: "Management platform",
			description: "Maybe we just got lucky",
			account: "Account password login",
			in: "Log in",
			loading: "Be logging in",
			beiAnHao: "Website record number",
			picture: "I can't see it. Change it",
			systemUnavailable: "System temporarily unavailable",
			systemUnavailableDesc: "Failed to load system configuration, please try again later",
			retry: "Retry",
			otpTip: "Enter the 6-digit code from your authenticator app",
			totpTip: "Enter the 6-digit code from your authenticator app",
			otpTitle: "OTP Verification",
			otpConfirm: "Confirm",
			otpCancel: "Cancel",
			sliderTip: "Slide right to verify",
			sliderTipPuzzle: "Drag the slider to the matching slot",
			sliderSuccess: "Verified",
			sliderRequired: "Please complete the slider verification first",
			style: "Login Style",
			styleDesc: "Switch between different layouts and visual styles",
			styleOptions: {
				defaultLabel: "Simple Dual-pane",
				defaultDesc: "Brand showcase + login form",
				cardLabel: "Centered Card",
				cardDesc: "Floating split-card layout",
				bubbleLabel: "Bubble Minimal",
				bubbleDesc: "Bubble background lightweight card",
				glassLabel: "Glassmorphism",
				glassDesc: "Frosted glass card",
				slideLabel: "Gradient Flow",
				slideDesc: "Gradient glow floating card",
				splitLabel: "Split Immersive",
				splitDesc: "Large-screen split immersive layout",
				splitReverseLabel: "Mirrored Split Immersive",
				splitReverseDesc: "Form left · brand immersive right",
				minecraftDesc: "Pixel block style",
				voxelLabel: "Modern 3D",
				voxelDesc: "3D dimensional particle style",
				monoLabel: "Monochrome Terminal",
				monoDesc: "Geek monospace terminal style",
				simpleLabel: "Light Terminal",
				simpleDesc: "Clean terminal style"
			},
			featureTags: {
				manage: "Efficient Management",
				design: "Modern Design",
				security: "Secure & Reliable"
			},
			form: {
				loginName: "Please enter your username",
				password: "Please enter password",
				securityCode: "Please enter the verification code",
				tenantCode: "Tenant code (leave empty for the platform)"
			},
			rules: {
				loginName: {
					required: "The user name cannot be empty",
					validator: "The account can only contain letters, numbers, underscores and hyphens"
				},
				password: {
					required: "The password cannot be empty",
					validator2: "The password must contain both numbers and letters"
				},
				securityCode: { required: "The verification code cannot be empty" },
				tenantCode: { validator: "The tenant code is 2-32 characters: letters, numbers, underscores or hyphens" },
				otpCode: { required: "Please enter the 6-digit one-time code" }
			}
		},
		home: {
			auth: "Master Station",
			work: { name: "Workbench page" },
			analysis: { name: "Analysis page" },
			console: { name: "Console Page" }
		},
		system: {
			auth: "System Manage",
			user: {
				name: "User Manage",
				search: {
					label: {
						loginName: "Login name",
						userName: "User name",
						phone: "Phone number",
						deptId: "Department",
						loginTime: "Login time"
					},
					placeholder: {
						loginName: "Please enter your login account",
						userName: "Please enter the user name",
						phone: "Please enter your phone number",
						deptId: "Please select a department"
					}
				},
				table: {
					loginName: "Login name",
					deptName: "Department",
					avatar: "Avatar",
					userName: "User name",
					email: "Email",
					phone: "Phone number",
					userType: "User type",
					sex: "Gender",
					userStatus: "User status",
					loginTime: "Login time"
				},
				form: {
					label: {
						loginName: "Login name",
						password: "Password",
						userName: "User name",
						deptId: "Department",
						postId: "Job allocation",
						roleId: "Assign roles",
						userType: "User type",
						userStatus: "User status",
						sex: "Gender",
						avatar: "Avatar",
						phone: "Phone number",
						email: "Email",
						remark: "Remark"
					},
					placeholder: {
						loginName: "Please enter your login account",
						password: "Please enter your password",
						userName: "Please enter the user name",
						deptId: "Please select a department",
						postId: "Please select the position",
						roleId: "Please select a role",
						userType: "Please select the user type",
						userStatus: "Please select the user status",
						sex: "Please select the user's gender",
						avatar: {
							description: "Upload an avatar",
							tip: "The maximum size of the picture is 3M"
						},
						phone: "Please enter your phone number",
						email: "Please enter your email address",
						remark: "Please enter the user's remarks"
					}
				},
				rules: {
					loginName: { required: "Please enter your login account" },
					password: {
						required: "Please enter your user password",
						validator: "At least 6 digits and containing letters and numbers"
					},
					userName: { required: "Please enter the user name" },
					deptId: { required: "Please select the department" },
					userType: { required: "Please enter the user type" },
					sex: { required: "Please select the user's gender" },
					userStatus: { required: "Please select the user status" },
					phone: { required: "Please enter your phone number" }
				},
				transfer: {
					role: "List of roles",
					post: "Job list"
				}
			},
			role: { name: "Role Manage" },
			menu: { name: "Menu Manage" },
			dictType: { name: "DictType Manage" },
			dictData: { name: "DictData Manage" },
			dept: { name: "Dept Manage" },
			post: { name: "Post Manage" },
			loginLogs: { name: "Login Logs" },
			operateLogs: { name: "Operate Logs" },
			notice: { name: "Notice Manage" },
			personage: { name: "Personage Center" }
		},
		hotsport: {
			auth: "Hotsport Monitor",
			dashboard: { name: "Dashboard" },
			traces: { name: "Traces" },
			dependencies: { name: "Dependencies" },
			leaks: { name: "Leaks" }
		},
		monitor: {
			auth: "System Monitor",
			scheduled: { name: "Scheduled Task" },
			online: { name: "Online User" },
			service: { name: "Service Monitor" },
			redis: { name: "Redis Monitor" },
			cache: { name: "Data Cache" },
			blocklist: { name: "Blocklist Manage" }
		},
		tools: {
			auth: "System Tool",
			generate: { name: "Code Generate" },
			config: { name: "Config Management" },
			file: { name: "Files Manage" },
			picture: { name: "Pictures Manage" },
			testDept: { name: "TestDept Manage" },
			testParams: { name: "TestDept Params" }
		},
		link: {
			auth: "External Link",
			back: { name: "Back Version" },
			front: { name: "Front Version" },
			blog: { name: "Blog Version" },
			element: { name: "ElementPlus" }
		},
		blog: {
			auth: "Blog Manage",
			category: { name: "Article Category" },
			tag: { name: "Tags Manage" },
			article: { name: "Article Manage" },
			friend: { name: "Friend Link" },
			circle: { name: "Circle Manage" },
			danMu: { name: "DanMu Manage" },
			notice: { name: "Notice Manage" },
			library: { name: "Knowledge Base" },
			libraryCatalog: { name: "Knowledge Catalog" },
			libraryPreview: { name: "Knowledge Preview" },
			comment: { name: "Comment Manage" }
		},
		coding: {
			404: { name: "404 Page" },
			403: { name: "403 Page" },
			500: { name: "500 Page" }
		}
	},
	button: {
		search: "Search",
		reset: "Reset",
		add: "Add",
		update: "Update",
		delete: "Delete",
		export: "Export",
		import: "Import",
		preview: "Preview",
		password: "Reset Password",
		expand: "Expand/Fold",
		role: "Assign Roles",
		post: "Assign Jobs",
		menu: "Assign Menu",
		dept: "Assign Dept",
		refreshCache: "Refresh Cache",
		view: "View",
		detail: "Detail",
		save: "Save",
		force: "Force Offline",
		logout: "Logout",
		execute: "Execute",
		executeOnce: "Execute Once",
		file: "File Upload",
		image: "Image Upload",
		upload: "Upload",
		download: "Download",
		confirm: "Confirm",
		cancel: "Cancel",
		refresh: "Refresh",
		hideSearch: "Hide Search",
		displaySearch: "Display Search",
		close: "Close",
		genCode: "Generate Code",
		previewCode: "Preview Code",
		sync: "Sync",
		switch: "Switch",
		publish: "Publish",
		catalog: "Catalog",
		minimize: "Minimize",
		restoreMinimized: "Restore form window"
	},
	home: { welcome: "Welcome" },
	tabs: {
		refresh: "Refresh",
		maximize: "Maximize",
		exitMaximize: "Exit Maximize",
		closeCurrent: "Close Current",
		listLabel: "Open page tabs",
		closeLeft: "Close Left",
		closeRight: "Close Right",
		closeOther: "Close Other",
		closeAll: "Close All",
		affix: "Affix Tab",
		unaffix: "Unfix Tab"
	},
	themeConfig: {
		title: "Theme Config",
		tabs: {
			appearance: "Appearance",
			interface: "Interface",
			extension: "Extension",
			advanced: "Advanced"
		},
		sections: {
			userConfig: "User Config",
			themeMode: "Theme Mode",
			themeColor: "Theme Color",
			colorStatus: "Color Status",
			layoutStyle: "Layout Style",
			loginStyle: "Login Style",
			loaderStyle: "Loading Animation",
			interfaceConfig: "Interface Config",
			toolbarSwitch: "Toolbar Switches",
			messageNotify: "Message Notify",
			homeConfig: "Home Config",
			weatherConfig: "Weather Config"
		},
		io: {
			export: "Export Config",
			import: "Import Config",
			exportSuccess: "Config exported",
			importSuccess: "Config imported",
			importError: "Import failed: invalid file format"
		},
		customColor: {
			title: "Custom Color",
			desc: "Pick from palette or enter HEX value"
		},
		loaderStyle: {
			hint: "The boot loader and in-app loading overlays share one animation. Your choice applies here at once and to the boot screen after a refresh.",
			lockedHint: "The animation is locked by the deployment config (other.loaderConfig in app.yaml) and cannot be changed here.",
			size: "Boot size",
			sizeNarrow: "Narrow",
			sizeWide: "Wide",
			speed: "Animation speed",
			adaptColor: "Follow theme color",
			adaptColorSub: "The animation follows the theme primary color",
			adaptColorTip: "Off uses the fixed color from the deployment config; on keeps the loader in sync when the theme changes"
		},
		themeModeTabs: {
			light: "Light",
			dark: "Dark",
			auto: "Auto"
		},
		msgStatus: {
			success: "Success",
			warning: "Warning",
			danger: "Danger",
			info: "Info",
			successToast: "Success: Operation completed",
			warningToast: "Warning: Please confirm the operation",
			dangerToast: "Danger: Operation failed",
			infoToast: "Info: This is a message"
		},
		layout: {
			vertical: "Vertical",
			columns: "Columns",
			double: "Double",
			classic: "Classic",
			optimum: "Optimum",
			horizontal: "Horizontal",
			group: "Grouped"
		},
		interface: {
			routeAnimation: {
				label: "Route Animation",
				placeholder: "Select route animation",
				none: "None",
				default: "Default",
				fade: "Fade",
				slide: "Slide",
				zoomFade: "Zoom Fade",
				fadeBottom: "Fade Bottom",
				fadeScale: "Fade Scale"
			},
			menuWidth: "Menu Width",
			tabsStyle: {
				label: "Tab Style",
				placeholder: "Select tab style",
				card: "Card",
				google: "Google",
				plain: "Plain"
			},
			dimension: {
				label: "Component Size",
				placeholder: "Select component size"
			}
		},
		switchBlocks: {
			accordion: {
				title: "Menu Accordion",
				sub: "Accordion Mode",
				tip: "Menu expand [on-single/off-multiple]",
				description: "Menus fold like accordion (only one expanded)"
			},
			asideInverted: {
				title: "Aside Inverted",
				sub: "Inverted",
				tip: "Aside uses inverted background",
				description: "Aside applies inverted background"
			},
			headerInverted: {
				title: "Header Inverted",
				sub: "Inverted",
				tip: "Header uses inverted background",
				description: "Header applies inverted background"
			},
			headerShown: {
				title: "Show Header",
				sub: "Top Nav",
				tip: "Toggle Header visibility",
				description: "Header will hide when off"
			},
			tabsShown: {
				title: "Show Tabs",
				sub: "Multi Tabs",
				tip: "Toggle multi-tab bar visibility",
				description: "Tab bar hides when off"
			},
			grey: {
				title: "Grey Mode",
				sub: "Color Assist",
				tip: "Global grey filter (memorial/eye-care)",
				description: "Global grey filter (memorial/eye-care)"
			},
			weak: {
				title: "Color Weak Mode",
				sub: "Color Assist",
				tip: "Color-blind friendly filter (higher contrast)",
				description: "Color-blind friendly filter (higher contrast)"
			},
			collapse: {
				title: "Collapse Menu",
				sub: "Aside Collapse",
				tip: "Collapse aside to icon bar",
				description: "Collapse aside to icon bar"
			},
			collapseToButton: {
				title: "Collapse to Button",
				sub: "Vertical layout only",
				tip: "When collapsed, hide the icon menu and shrink the entire menu into one expand button (vertical layout only)",
				description: "When collapsed, hide the icon menu and shrink the entire menu into one expand button (vertical layout only)"
			},
			collapseButton: {
				title: "Show Menu Button",
				sub: "Vertical layout only",
				tip: "Show an expand button when the menu is collapsed (in addition to the icon bar)",
				description: "An expand button appears when the menu is collapsed"
			},
			collapseBar: {
				title: "Keep Mini Bar",
				sub: "Vertical layout only",
				tip: "Keep a mini icon menu bar when collapsed",
				description: "The menu bar shrinks to a mini icon bar when collapsed"
			}
		},
		message: {
			position: {
				label: "Position",
				toolbar: "Toolbar Bell",
				rightBottom: "Floating Bottom-Right",
				hidden: "Hide All"
			},
			push: {
				title: "Real-time Push",
				sub: "Socket",
				tip: "Depends on Socket push; falls back to HTTP polling",
				description: "Depends on Socket push; falls back to HTTP polling"
			}
		},
		home: { customLayout: {
			title: "Custom Layout Button",
			sub: "Home",
			tip: "Custom layout switch button at top-right of home",
			description: "Custom layout button at home top bar right"
		} },
		weather: { enable: {
			title: "Show Weather",
			sub: "Toolbar",
			tip: "Show weather info at top-right of toolbar",
			description: "Show current weather and weekly forecast"
		} },
		toolbar: {
			searchMenu: {
				label: "Search Menu",
				sub: "Top Search",
				tip: "Top search box quick menu search",
				description: "Top-right quick search menu item"
			},
			refresh: {
				label: "Route Cache Refresh",
				sub: "Cache Clear",
				tip: "Click to clear keepAlive cache",
				description: "Click to clear keepAlive cache"
			},
			dark: {
				label: "Light/Dark Toggle",
				sub: "Theme Toggle",
				tip: "Toggle light/dark theme",
				description: "Light/dark theme toggle"
			},
			language: {
				label: "Language",
				sub: "i18n",
				tip: "Switch i18n texts like Chinese/English",
				description: "Switch Chinese/English localization"
			},
			fullScreen: {
				label: "Fullscreen Toggle",
				sub: "Fullscreen",
				tip: "Toggle browser fullscreen",
				description: "Toggle browser fullscreen"
			},
			themeSetting: {
				label: "Theme Config Entry",
				sub: "Panel Entry",
				tip: "Open theme config panel",
				description: "Open theme config panel"
			},
			user: {
				label: "User Dropdown",
				sub: "User Menu",
				tip: "Top user dropdown menu",
				description: "Top user dropdown menu"
			},
			breadcrumb: {
				label: "Breadcrumb Nav",
				sub: "Breadcrumb",
				tip: "Top breadcrumb navigation",
				description: "Top breadcrumb navigation"
			},
			breadcrumbDropdown: {
				label: "Breadcrumb Sub-dropdown",
				sub: "Dropdown",
				tip: "Dropdown when breadcrumb overflows",
				description: "Dropdown when breadcrumb overflows"
			},
			breadcrumbIcon: {
				label: "Breadcrumb Icon",
				sub: "Icon Prefix",
				tip: "Show icon before each breadcrumb",
				description: "Show icon before each breadcrumb"
			},
			tabIcon: {
				label: "Tab Icon",
				sub: "Tab Icon",
				tip: "Show icon before each tab",
				description: "Show icon before each tab"
			},
			logo: {
				label: "Logo Display",
				sub: "Brand",
				tip: "Show logo at top of sidebar",
				description: "Show logo at top of sidebar"
			},
			message: {
				label: "Message Bell",
				sub: "Messages",
				tip: "Toolbar message bell with unread dot",
				description: "Toolbar message bell with unread dot"
			},
			quickNote: {
				label: "Quick Note",
				sub: "Notes",
				tip: "Create a floating sticky note from the toolbar",
				description: "Toolbar note entry that creates floating sticky notes"
			},
			quickNoteConfirm: {
				label: "Note close confirmation",
				sub: "Confirm",
				tip: "Ask before closing a note",
				description: "Confirm before closing a note to avoid losing content"
			},
			weather: {
				label: "Toolbar Weather",
				sub: "Weather",
				tip: "Weather at top-right, click for weekly forecast",
				description: "Show weather component at top-right"
			},
			bigscreen: {
				label: "Bigscreen Entry",
				sub: "Bigscreen",
				tip: "Show bigscreen icon at top, click to open route in new window",
				description: "Show bigscreen entry icon and inject dedicated bigscreen route"
			},
			typhoon: {
				label: "Typhoon Monitor",
				sub: "Typhoon",
				tip: "Show active typhoon icons at top-right",
				description: "Show typhoon monitor at top-right"
			},
			exchangeRate: {
				label: "Toolbar Exchange Rate",
				sub: "Exchange Rate",
				tip: "Show exchange rate at top-right, click to view panel",
				description: "Show exchange rate component at top-right"
			}
		}
	},
	aiChat: {
		title: "AI Chat",
		enable: "Enable AI Assistant",
		enableTip: "Shows a floating AI entry at bottom-right when on",
		modePlaceholder: "Run Mode",
		modelPlaceholder: "Select local inference model",
		vendorPlaceholder: "Select vendor",
		modeOptions: {
			webllm: "In-browser Inference (WebLLM)",
			vendor: "Vendor API (Online)"
		},
		vendorOptions: {
			openai: "OpenAI (GPT series)",
			deepseek: "DeepSeek",
			custom: "Custom (OpenAI-compatible)"
		},
		webllmModelRecommend: "(Recommended · Lightweight)",
		modelLight: "Ultra-light",
		modelMedium: "Medium",
		status: {
			loading: "Loading model...",
			generating: "Generating reply...",
			idle: "Model ready, ready to chat"
		},
		actions: {
			loading: "Loading",
			loadModel: "Load Model",
			unload: "Unload"
		},
		apiUrl: "API URL",
		apiUrlPlaceholder: "https://api.openai.com/v1/chat/completions",
		apiKey: "API Key",
		apiKeyPlaceholder: "sk-...",
		modelId: "Model ID",
		modelIdPlaceholder: "Select or enter model ID",
		modelIdInputPlaceholder: "Manually enter model ID",
		syncTooltip: "Fetch model list",
		advanced: {
			title: "Advanced Parameters",
			maxTokens: "Max Tokens",
			maxTokensSub: "Limit",
			temperature: "Temperature",
			temperatureSub: "Randomness"
		},
		context: {
			title: "Context Management",
			limit: "Context Limit",
			limitSub: "Messages",
			summaryThreshold: "Auto-summary Threshold",
			summaryThresholdSub: "Percentage",
			summaryEnabled: "Round-N Compression",
			summaryEnabledSub: "Compress history into summary once over threshold",
			retainRounds: "Retain Rounds",
			retainRoundsSub: "Recent rounds kept verbatim after summary"
		},
		character: {
			title: "Assistant Avatar",
			placeholder: "Select avatar",
			model3d: "3D Model",
			model2d: "2D Icon",
			glbPlaceholder: "GLB model URL"
		},
		toast: {
			loaded: "Model loaded, ready to chat",
			loadFailed: "Failed to load model",
			unloaded: "Model unloaded, memory released"
		}
	},
	accessibility: {
		title: "Accessibility",
		screenReader: {
			title: "Screen Reader Mode",
			sub: "Focus Highlight",
			tip: "Optimize focus highlight and readability for visually impaired users"
		},
		highContrast: {
			title: "High Contrast Mode",
			sub: "Contrast Boost",
			tip: "Increase text/background contrast, independent of dark mode"
		},
		voiceRead: {
			title: "Voice Read",
			sub: "TTS",
			tip: "Auto-read focused element content",
			unsupportedTip: "Speech synthesis not supported in this browser"
		}
	},
	performance: {
		title: "Performance Monitor",
		fps: {
			title: "FPS",
			sub: "Frame Rate",
			tip: "Measures page smoothness; 60FPS is best"
		},
		memory: {
			title: "Memory",
			sub: "JS Heap",
			tip: "JS heap used by current page (Chrome/Edge only)"
		},
		cpu: {
			title: "CPU",
			sub: "Main Thread Load",
			tip: "Load estimated from main-thread frame interval"
		},
		battery: {
			title: "Battery",
			sub: "Level Status"
		},
		bluetooth: {
			title: "Bluetooth",
			sub: "Availability"
		},
		screen: {
			title: "Screen",
			sub: "Resolution"
		},
		position: {
			label: "Position",
			topLeft: "Top Left",
			topCenter: "Top Center",
			topRight: "Top Right",
			leftCenter: "Left Center",
			rightCenter: "Right Center",
			bottomLeft: "Bottom Left",
			bottomCenter: "Bottom Center",
			bottomRight: "Bottom Right"
		},
		content: {
			label: "Content",
			detailed: "Detailed",
			simple: "Simple",
			minimal: "Minimal"
		},
		layout: {
			label: "Layout Mode",
			merged: "Merged",
			split: "Split"
		},
		direction: {
			label: "Layout Direction",
			auto: "Auto",
			vertical: "Vertical",
			horizontal: "Horizontal"
		}
	},
	devTools: {
		title: "Dev Tools",
		liteTools: {
			title: "Light Debugging",
			sub: "Master Switch",
			tip: "Show ruler, grid and hover info debugging aids"
		},
		ruler: {
			title: "Ruler",
			sub: "Pixel Scale",
			tip: "Show pixel rulers at top and left of page"
		},
		grid: {
			title: "Grid",
			sub: "Layout Aid",
			tip: "Show 8px layout grid to aid alignment"
		},
		hoverInspector: {
			title: "Hover Inspector",
			sub: "Element Info",
			tip: "Show element tag, class and size on hover"
		}
	},
	heatmap: {
		title: "Heatmap Tools",
		cover: {
			title: "Heatmap Overlay",
			sub: "Click Heatmap",
			tip: "Record click hotspots and overlay as heatmap (dev/test only)"
		},
		clear: "Clear Hotspots",
		hint: "{count} hotspots recorded",
		cleared: "Heatmap data cleared"
	},
	systemDebug: {
		title: "System Debug",
		eruda: {
			title: "Eruda Console",
			sub: "Mobile Debugger",
			tip: "Integrates eruda providing Console / Elements / Network / Resources panels",
			description: "Loads CDN script dynamically; destroyed when off"
		}
	},
	emptyState: {
		title: "Empty State Style",
		desc: "Style shown when lists / tables have no data. Admins only.",
		enable: {
			title: "Unified Empty State",
			sub: "Global",
			tip: "When off, every ReEmpty without an explicit layout falls back to el-empty"
		},
		layout: {
			title: "Style",
			el: "Classic",
			modern: "Modern",
			plot: "Animated"
		},
		figure: { title: "Figure" },
		figures: {
			plot: "Plot",
			phosphor: "Phosphor",
			slow: "Conveyor",
			terrain: "Terrain",
			riffle: "Cards",
			stack: "Call Stack",
			branches: "Commit Graph",
			drawer: "Drawer",
			vault: "Vault",
			turntable: "Turntable",
			sieve: "Sieve",
			query: "Question"
		},
		tip: "Applies only to ReEmpty without an explicit layout; changes preview and save instantly"
	},
	header: {
		searchMenu: "Search menu",
		componentSize: "Component size",
		refreshCache: "Refresh cache",
		lightMode: "Light mode",
		darkMode: "Dark mode",
		autoMode: "Follow system",
		language: "Language translation",
		fullScreen: "Full Screen",
		exitFullScreen: "Exit Full Screen",
		bigscreen: "Bigscreen",
		collapseToolbar: "Collapse toolbar",
		expandToolbar: "Expand toolbar",
		timer: {
			tip: "Multi-timezone timer",
			title: "Multi-timezone Time",
			localLabel: "Local Time",
			empty: "Add timezones in Theme Config > Advanced",
			weekday: [
				"Sun",
				"Mon",
				"Tue",
				"Wed",
				"Thu",
				"Fri",
				"Sat"
			],
			configTitle: "Timer Config",
			enableTitle: "Enable Top Timer",
			enableSub: "Worker Driven",
			enableTip: "Display time in Header top-right, hover for multi-timezone view (repo/work Worker)",
			enableDesc: "Multi-timezone clock in Header, hover to view all timezones",
			zoneTitle: "Display Timezones",
			zonePlaceholder: "Select timezone",
			zoneAdd: "Add Timezone",
			zoneTip: "Max 3 timezones, UTC-12 ~ UTC+12; clear to show local time only",
			groupAmericas: "Americas / Pacific",
			groupEurope: "Europe / Africa",
			groupAsia: "Asia / Oceania"
		},
		weather: { tip: "View weather" },
		exchangeRate: {
			empty: "No exchange rate data",
			calcTitle: "Currency converter",
			amount: "Amount",
			swap: "Swap currencies",
			noTrend: "No trend data",
			high: "High",
			low: "Low",
			updated: "Updated {time}",
			sourceBackend: "Source: backend",
			sourceFrankfurter: "Source: frankfurter",
			back: "Back",
			pickFrom: "From currency",
			pickTo: "To currency",
			search: "Search currency: name / code / alias",
			searchPair: "Search pair: USD, rmb, Ukraine",
			searchEmpty: "No matching currency",
			otherCurrencies: "Other currencies",
			convertTo: "Convert to {name}",
			pin: "Pin to header",
			unpin: "Unpin",
			pinned: "Shown in header"
		},
		personalCenter: "Personal Center",
		settings: "Settings",
		logout: "Log out",
		dimensionList: {
			default: "default",
			large: "large",
			small: "small"
		},
		languageList: {
			chinese: "Chinese",
			english: "English"
		},
		menuSearch: "Menu search: Support menu name, path",
		searchMenuHint: "Type a menu name or path to navigate quickly",
		searchMenuSelect: "Navigate",
		searchMenuEnter: "Open",
		searchMenuEsc: "Close",
		pinMenu: "Pin submenu",
		unpinMenu: "Unpin",
		envBadge: {
			prod: "PROD",
			test: "TEST",
			dev: "DEV",
			mode: "Runtime mode",
			backend: "Backend",
			sameOrigin: "same origin"
		},
		alerts: {
			none: "No open alerts",
			open: "{n} open alert(s)",
			empty: "Nothing needs attention right now"
		},
		noteEntry: {
			title: "Quick Note",
			label: "Quick Note",
			placeholder: "Type something...",
			confirmDelete: "Confirm to delete this note?",
			created: "Saved",
			deleted: "Deleted",
			count: "note(s)",
			minimize: "Minimize",
			maximize: "Maximize",
			fullscreen: "Fullscreen",
			restore: "Restore",
			close: "Close"
		},
		commandPalette: {
			tip: "Command palette (Ctrl/⌘ + K)",
			placeholder: "Search menus or type an action…",
			title: "Command palette",
			hint: "Jump to a page or run an action. Ctrl/⌘ + K anytime",
			recent: "Recent",
			actions: "Actions",
			menus: "Menus",
			actionHint: {
				refresh: "Clear cache and reload",
				theme: "Switch theme mode",
				fullscreen: "Toggle fullscreen",
				settings: "Open theme settings drawer"
			}
		}
	},
	msg: {
		success: "Operation successful",
		fail: "Operation failed. Please refresh and try again",
		selectData: "Please select the data",
		validFail: "Validation failed. Please check the form contents",
		null: "No data for now",
		closeTips: "Are you sure you want to close it?",
		closed: "Closed",
		cancelled: "Cancelled",
		remind: "Friendly reminder:",
		confirmWant: "Do you confirm that you want",
		confirmDelete: "Are you sure you want to delete it?",
		confirmLogin: "The account identity has expired, please log in again",
		selectDate: "Please select a date",
		selectDateTime: "Please select a date and time",
		selectNumber: "Please enter the number",
		beginTime: "Begin Time",
		endTime: "End Time",
		to: "to",
		keyword: "Keyword search",
		configFail: "Configuration failed",
		logIn: "Please log in again",
		logInFail: "Login failed, please check your account or password",
		yzmFail: "Captcha acquisition failed",
		requestFailed: "Request failed",
		http: {
			serverBusy: "Server is busy, please try again later",
			serverUnavailable: "Service temporarily unavailable, please try again later",
			serverTimeout: "Server response timeout, please try again later",
			serverError: "Internal server error, please try again later",
			networkError: "Network connection error, please check your network"
		}
	},
	table: {
		number: "#",
		operate: "Operation"
	},
	tree: {
		topLevel: "Top level data",
		selectParent: "Please select parent data"
	},
	dict: {
		sys_switch_status: {
			open: "open",
			stop: "stop"
		},
		sys_user_sex: {
			man: "man",
			woman: "woman",
			unknown: "unknown"
		},
		sys_yes_no: {
			yes: "yes",
			no: "no"
		}
	},
	hotsport: {
		refresh: "Refresh",
		graph: "Graph",
		list: "List",
		dashboard: {
			title: "Live Call Topology",
			trend: "Recent Call Trend",
			transmissionCount: "Calls",
			traceCount: "Traces",
			dependencyCount: "Dependencies",
			leakCount: "Leaks",
			fetchStatsError: "Failed to fetch stats"
		},
		traces: {
			title: "Live Traces (Spans)",
			className: "Class",
			method: "Method",
			durationMs: "Duration (ms)",
			status: "Status",
			startTime: "Start Time",
			empty: "No data",
			fetchError: "Failed to fetch traces"
		},
		dependencies: {
			title: "Service Dependencies",
			source: "Source",
			target: "Target",
			callCount: "Calls",
			errorCount: "Errors",
			avgDurationMs: "Avg (ms)",
			lastCallAt: "Last Call",
			fetchError: "Failed to fetch dependencies"
		},
		leaks: {
			title: "Resource Leak Detection",
			resourceType: "Resource Type",
			resourceName: "Resource Name",
			stack: "Stack",
			view: "View",
			noStack: "No stack",
			fetchError: "Failed to fetch leaks"
		}
	},
	policy: {
		common: {
			action: "Action",
			remark: "Remark",
			status: "Status",
			active: "Active",
			createTime: "Created At",
			hits: "Hits",
			burst: "Burst",
			matchTarget: "Match Target",
			enabled: "Enabled",
			enable: "Enable",
			disabled: "Disabled",
			whitelist: "Allowlist",
			blacklist: "Blocklist",
			listType: "List Type",
			all: "All",
			current: "Current",
			save: "Save",
			cancel: "Cancel",
			close: "Close",
			deleteConfirm: "Confirm Delete",
			saveFailed: "Save failed",
			deleteFailed: "Delete failed",
			toggleFailed: "Toggle failed",
			reloadFailed: "Reload failed",
			account: "Account",
			deleted: "Deleted",
			stopped: "Disabled",
			remove: "Delete",
			hitDetailOf: "Hit detail {name}",
			editOf: "Edit {name}",
			deleteOf: "Delete {name}",
			activeOf: "Activate {name}",
			enableOf: "Enable {name}",
			hitOf: "Hit {name}",
			notConfigured: "Not configured"
		},
		hero: {
			title: "Policy Console",
			subtitle: "Manage runtime policy in one place: config publishing, traffic protection and access lists",
			chainOk: "Pipeline healthy",
			refresh: "Refresh",
			enterConfig: "Enter config →"
		},
		nav: {
			aria: "Policy console navigation",
			workspace: "Policy workspace",
			overview: {
				label: "Overview",
				caption: "Pipeline & capacity"
			},
			hotreload: {
				label: "Hot Reload",
				caption: "Runtime settings"
			},
			ratelimit: {
				label: "Rate Limit",
				caption: "QPS & rules"
			},
			blackwhite: {
				label: "Access List",
				caption: "IP & account"
			},
			gray: {
				label: "Gray Release",
				caption: "Traffic split"
			},
			header: {
				label: "Header Block",
				caption: "UA & crawlers"
			},
			route: {
				label: "API Control",
				caption: "Disable & forward"
			},
			rate: {
				interface: "By endpoint",
				ip: "By IP",
				account: "By account"
			},
			bw: {
				ip: "IP list",
				account: "Account list"
			}
		},
		overview: {
			chain: "Pipeline",
			chainDesc: "Policy takes effect in the order config → rate limit → list, and a blocklist always wins over an allowlist exemption.",
			refreshStats: "Refresh stats",
			hotReload: "Hot reload publish",
			hotReloadCount: "{count} runtime settings",
			rateLimit: "Traffic rate limit",
			rateCount: "{enabled}/{total} rules enabled",
			rateCountGlobalOff: "{enabled}/{total} rules enabled · global ceiling off (rules still apply)",
			blackwhite: "Access list",
			blackwhiteCount: "{count} list entries",
			passBlock: "Pass / block",
			passBlockDesc: "Allowlist bypasses rate limiting",
			rateRule: "Rate limit semantics",
			rateRuleDesc: "A matched rule consumes a QPS token bucket; the burst parameter is currently stored only and does not size the bucket.",
			manageRules: "Manage rules",
			hotReloadBoundary: "Hot reload boundary",
			hotReloadBoundaryDesc: "Saving selectively evicts the settings cache and publishes a change event, so only runtime consumers that explicitly opt in react.",
			manageConfig: "Manage settings",
			listPriority: "List priority",
			listPriorityDesc: "An IP or account on a blocklist is rejected immediately and an allowlist cannot override it. An allowlist is a pass-through exemption, not an admission list: that IP skips rate limiting, and any IP on no list at all is still allowed by default.",
			manageList: "Manage list",
			cards: {
				hotreload: {
					label: "Hot reload settings",
					unit: "items"
				},
				ratelimit: {
					label: "Rate limit rules",
					unit: "rules"
				},
				blackwhite: {
					label: "Access list",
					unit: "entries"
				},
				overview: {
					label: "Pipeline",
					unit: "stages"
				}
			}
		},
		hotreload: {
			title: "Hot Reload Settings",
			desc: "Maintain runtime settings in the {hotReload} group. Saving with an ID updates, without an ID creates.",
			reloadNow: "Hot reload now",
			add: "Add setting",
			contract: "Publish contract",
			contractDesc: "Supports string / number / boolean / json; after the transaction commits the hot_reload cache is evicted and the latest value is read through AOP.",
			lastReload: "Last reload {time} · {count} enabled",
			empty: "No hot reload settings",
			col: {
				name: "Setting Name",
				code: "Setting Code",
				value: "Value",
				type: "Type"
			},
			typeString: "String",
			typeNumber: "Number",
			typeBoolean: "Boolean",
			formValueType: "Value Type",
			phName: "Enter setting name",
			phValue: "Enter setting value",
			errValue: "Setting name and code are required",
			errCode: "Setting code accepts only letters, digits, dots, hyphens and underscores, and must start with a letter",
			errNotNumber: "Setting value must be a valid number",
			errNotBoolean: "Setting value must be true or false",
			errNotJson: "Setting value must be valid JSON",
			errDuplicate: "Not saved, please check whether the setting code is duplicated",
			saved: "Hot reload setting updated",
			created: "Hot reload setting created",
			reloaded: "Hot reload done, {count} settings enabled",
			reloadFailed: "Hot reload failed",
			loadFailed: "Failed to load hot reload settings",
			dialogEdit: "Edit Hot Reload Setting",
			dialogAdd: "Add Hot Reload Setting",
			deleteTitle: "Delete hot reload setting",
			deleteBody: "Delete \"{name}\"? The runtime will stop reading this setting.",
			deleted: "Hot reload setting deleted",
			errNotDeleted: "Setting not deleted; it may no longer exist"
		},
		rate: {
			desc: "Maintain exact rules by endpoint, IP and account; global parameters are configured separately from the entry on the right.",
			add: "Add rule",
			empty: "No {name}",
			globalAria: "Global rate limit config, currently {state}",
			global: "Global rate limit",
			globalOffNotice: "Global rate limiting is off: no system-wide QPS ceiling is applied, but the enabled rules below still enforce their own QPS. Turn it on only if you need a ceiling for the whole system.",
			on: "On",
			off: "Off",
			hitTitle: "Rate limit rule {target}",
			dimLabel: "Dimension",
			dimInterface: "Endpoint",
			dimAccount: "Account",
			keepEnabled: "The rule will be written to the runtime cache",
			keepDisabled: "The rule stays disabled",
			ruleQps: "Rule QPS",
			ruleBurst: "Rule burst",
			enableRule: "Enable rule",
			enableRuleAria: "Enable rate limit rule",
			meta: {
				interface: {
					title: "Endpoint rules",
					description: "Matches the request path after the context-path is stripped, e.g. /v2/user/page",
					target: "Enter the endpoint path, e.g. /v2/user/page"
				},
				ip: {
					title: "IP rules",
					description: "Set an access frequency for one exact IP",
					target: "Enter the exact IP, e.g. 192.168.1.10"
				},
				account: {
					title: "Account rules",
					description: "Set an access frequency for one exact login account",
					target: "Enter the login account"
				}
			},
			col: { runStatus: "Run Status" },
			globalDialog: {
				title: "Global Rate Limit",
				enable: "Enable global rate limit",
				enableDesc: "When off no system-wide QPS ceiling applies (rules still enforce their own QPS); when on all traffic shares one ceiling",
				enableAria: "Enable global rate limit",
				qps: "Global QPS",
				burst: "Burst",
				burstAria: "Global burst",
				domain: "Scope",
				domainDesc: "At runtime rate limiting centres on QPS; the burst parameter is currently stored only and does not size the token bucket.",
				apply: "Apply"
			},
			errQps: "QPS must be an integer greater than 0",
			errBurst: "Burst must be a non-negative integer",
			loadGlobalFailed: "Failed to load global config",
			loadRulesFailed: "Failed to load rate limit rules",
			globalApplied: "Global config applied",
			globalApplyFailed: "Failed to apply global config",
			errTargetTooLong: "Rule target must not exceed 500 characters",
			errNotCreated: "Rule not created",
			errNotUpdated: "Rule not updated, the record may have been deleted",
			saved: "Rate limit rule updated",
			created: "Rate limit rule created",
			errStatusNotUpdated: "Rule status not updated",
			ruleEnabled: "Rule enabled",
			ruleStopped: "Rule disabled",
			statusFailed: "Failed to update status",
			deleteTitle: "Delete Rate Limit Rule",
			deleteBody: "Delete rule {target}?",
			errNotDeleted: "Rule not deleted, the record may have been deleted",
			deleted: "Rate limit rule deleted",
			dialogEdit: "Edit Rate Limit Rule",
			dialogAdd: "Add Rate Limit Rule"
		},
		bw: {
			desc: "Manage IP ranges and login accounts; blocklist wins, allowlist bypasses rate limiting.",
			addRule: "Add {kind} rule",
			emptyIp: "No IP rules",
			emptyAccount: "No account rules",
			hitTitleIp: "IP list {ip}",
			hitTitleAccount: "Account list {account}",
			phIp: "e.g. 192.168.1.0/24",
			phAccount: "Enter account",
			dialogIpEdit: "Edit IP Rule",
			dialogIpAdd: "Add IP Rule",
			dialogAccEdit: "Edit Account Rule",
			dialogAccAdd: "Add Account Rule",
			errIpBlank: "Enter an IP address or CIDR",
			errIpInvalid: "Enter a valid IPv4 address or IPv4 CIDR, e.g. 192.168.1.0/24",
			errIpNotUpdated: "IP rule not updated, the record may have been deleted",
			ipSaved: "IP rule updated",
			ipCreated: "IP rule created",
			deleteIpTitle: "Delete IP Rule",
			deleteIpBody: "Delete IP rule {ip}?",
			errIpNotDeleted: "IP rule not deleted, the record may have been deleted",
			ipDeleted: "IP rule deleted",
			errAccTooLong: "Account must not exceed 100 characters",
			errPickType: "Pick a list type",
			errPickStatus: "Pick a status",
			errAccNotUpdated: "Account rule not updated, the record may have been deleted",
			accSaved: "Account rule updated",
			accCreated: "Account rule created",
			deleteAccTitle: "Delete Account Rule",
			deleteAccBody: "Delete account rule {account}?",
			errAccNotDeleted: "Account rule not deleted, the record may have been deleted",
			accDeleted: "Account rule deleted"
		},
		header: {
			desc: "Block crawlers and automated clients by request header (mainly {ua}). Save, toggle and delete {immediate}, no restart needed.",
			reload: "Reload rules",
			add: "Add rule",
			ruleTitle: "Matches by contains, and runs before authentication",
			ruleDesc: "Crawlers are recognised in the UA by characteristic fragments ({bot}, {headless}, {python}), so the default is to block when the word appears. The filter runs {before} authentication: these clients rarely carry valid credentials, so blocking after authentication would just waste a token check. Any error while parsing or matching a rule lets the request {pass}, so a bug in the policy itself never takes the site down.",
			empty: "No header block rules",
			hitTitle: "Header {name}",
			termImmediate: "takes effect immediately",
			termImmediateAll: "takes effect on every node immediately",
			termBefore: "before",
			termPass: "pass",
			defaultMessage: "Automated client access rejected",
			phPatterns: "One per line, e.g.:\nGooglebot\npython-requests\nHeadlessChrome",
			presetFill: "Fill in {count} preset patterns",
			col: {
				headerName: "Header",
				matchType: "Match Type",
				patterns: "Patterns",
				blockStatus: "Block Status",
				active: "Active"
			},
			match: {
				CONTAINS: {
					label: "Contains",
					hint: "Recommended. Discriminating UA features are fragments, block when present"
				},
				EQUALS: {
					label: "Equals",
					hint: "Block only when the whole UA string is identical"
				},
				PREFIX: {
					label: "Prefix",
					hint: "Block only when it starts with the given string"
				},
				REGEX: {
					label: "Regex",
					hint: "Most powerful and easiest to get wrong. A mistake only skips that pattern, the rest still work"
				}
			},
			form: {
				name: "Header",
				nameDesc: "Usually {ua}. Renaming a header invalidates and rebuilds existing rules, so editing does not allow it.",
				matchType: "Match Type",
				patterns: "Patterns",
				blockStatus: "Block Status",
				blockDefault: "403 Forbidden (default)",
				message: "Message",
				messagePh: "msg returned to the caller",
				active: "Active",
				desc: "Takes effect on every node {immediate}, no restart needed. A wrong pattern only skips that one entry; the rest still block.",
				dialogEdit: "Edit Header Block Rule",
				dialogAdd: "Add Header Block Rule"
			},
			errPresets: "Presets are not loaded yet, try again later",
			presetFilled: "Filled in {count} preset patterns, remove the ones you do not need",
			errNameBlank: "Enter the header name",
			errPatternsEmpty: "Enter at least one pattern",
			saved: "Rule updated, in effect immediately",
			created: "Rule created, in effect immediately",
			enabledNow: "Enabled, in effect immediately",
			stoppedNow: "Disabled, no longer in effect",
			deletedNow: "Deleted, no longer in effect",
			deleteBody: "Delete the block rule for {name}?",
			reloaded: "Reloaded {count} rules"
		},
		gray: {
			desc: "Maintain gray release rules by business key: weight decides the ramp share, hit strategy describes user/role/IP conditions in JSON.",
			add: "Add gray rule",
			landing: "Where it lives",
			landingDesc: "One row is one config, stored in the unified policy table with {table}; ordered by sort ascending then created time descending.",
			empty: "No gray release configs",
			enableOf: "Enable gray release {key}",
			col: {
				bizKey: "Business Key",
				weight: "Weight %",
				hitStrategy: "Hit Strategy (JSON)"
			},
			form: {
				bizKey: "Business Key",
				bizKeyPh: "e.g. order.submit.v2",
				weight: "Weight (%)",
				sort: "Sort",
				hitStrategy: "Hit Strategy",
				hitStrategyPh: "JSON, e.g. {'{\"users\":[\"sa\"],\"ips\":[\"10.0.0.0/8\"],\"rule\":\"1==1\"}'}",
				dialogEdit: "Edit Gray Release Config",
				dialogAdd: "Add Gray Release Config"
			},
			loadFailed: "Failed to load gray release configs",
			errKeyBlank: "Enter the business key",
			errNotJson: "Hit strategy must be valid JSON",
			saved: "Gray release config updated",
			created: "Gray release config created",
			deleteBody: "Delete gray release config {key}?"
		},
		route: {
			desc: "Disable an endpoint online, or forward one endpoint's traffic to another registered endpoint. Rule changes take effect on every node immediately.",
			reloadIndex: "Reload route index",
			add: "Add rule",
			forwardTitle: "Forward targets come only from routes registered in this app",
			forwardDesc: "A target is not a hand typed address: the server looks it up from Spring's registered {requestMapping}, so this service cannot be turned into a jump host to reach outside addresses. When a target cannot be resolved it is treated as disabled, never passed. Rules apply {byPath}, so several methods on the same path (e.g. {getPost}) are disabled or forwarded together.",
			pathDesc: "Write the in-app path (without a context-path like {ctx}). Forward targets can only be picked from the dropdown; the server resolves the real path from Spring's registered routes, and it {cannot} point at an external address.",
			indexCount: "The index currently holds {indexed} registered route entries, merged by path into {total} rows here.",
			phFilter: "Filter by path / method / handler / remark",
			filterAria: "API control keyword filter",
			query: "Query",
			empty: "No API control rules",
			hitTitle: "API control {path}",
			customPathHint: "Custom path (not in the registered routes)",
			actionDisableLabel: "Disable (reject directly)",
			actionForwardLabel: "Forward (to another endpoint)",
			stateBlocked: "Blocked",
			stateForwarded: "Forwarded",
			stateInactive: "Inactive (endpoint allowed)",
			stateRuleOn: "Rule active",
			stateRuleOff: "Rule inactive",
			stateNoteUnconfigured: "No policy rule is configured for this endpoint, so it is not governed and passes through.",
			stateNoteInactive: "A rule exists but is switched off, so it does not run and the endpoint passes through.",
			stateNoteBlocked: "The rule is active; matching requests are rejected with {code}.",
			stateNoteForwarded: "The rule is active; matching requests are forwarded to {target}.",
			stateLegendTitle: "What the states mean",
			stateLegend: "States: Unconfigured = no rule, endpoint not governed. Inactive = a rule exists but is off, endpoint passes through. Blocked = rule active, matches rejected with the response code. Forwarded = rule active, matches go to the target endpoint.",
			deleteRule: "Delete rule",
			deleteRuleTip: "Delete the policy rule of this endpoint",
			ruleDeleted: "Rule deleted",
			toastBlocked: "Endpoint blocked",
			toastForwardOn: "Forwarding active",
			toastAllowed: "Endpoint allowed",
			customStatusHint: "Custom status code, not in the candidate list.",
			termCannot: "cannot",
			termByPath: "by path",
			actionLabelEdit: "Edit",
			actionLabelConfig: "Configure",
			col: {
				method: "Method",
				handler: "Handler",
				action: "Action",
				target: "Forward Target",
				status: "Active"
			},
			form: {
				path: "Endpoint Path",
				pathPh: "In-app path, without context-path, e.g. /v2/user/me",
				action: "Action",
				statusCode: "Status Code",
				statusCodePh: "Status code returned when disabled",
				statusCodeAria: "Disable status code",
				message: "Message",
				messagePh: "msg returned to the caller",
				target: "Forward Target",
				targetPh: "Pick from the registered routes",
				dialogEdit: "Edit API Control Rule",
				dialogAdd: "Add API Control Rule"
			},
			defaultMessage: "This endpoint is disabled, please try again later",
			loadFailed: "Failed to load API control",
			routesLoadFailed: "Failed to load registered routes",
			synced: "Synced to tables: {routes} routes, {policies} rules",
			errPathBlank: "Enter the endpoint path",
			errPathSlash: "The endpoint path must start with /",
			errTargetBlank: "Pick a forward target",
			errPathUnknown: "This path is not in the registered routes, so the rule will be saved but will not affect any request",
			saved: "Rule updated",
			created: "Rule created",
			errNotConfigured: "This route has no policy yet, click Configure first",
			errNothingToDelete: "This route has never had a policy, nothing to delete",
			deleteBody: "Delete the disable/forward rule for {path}?"
		},
		status: {
			"503": "Service unavailable. The usual 'temporarily disabled' semantics; clients will typically retry or degrade.",
			"502": "Bad gateway. Fits 'this endpoint was taken out, upstream cannot reach it'.",
			"500": "Internal server error. Reads as 'internal exception'; using 500 to disable an endpoint is easily confused with a real outage.",
			"429": "Too many requests. Fits 'not disabled, but I want to squeeze the traffic'.",
			"403": "Forbidden. Fits 'the endpoint is there, but this caller may not use it'.",
			"404": "Not found. Fits hiding an endpoint from the outside without revealing it ever existed.",
			"401": "Unauthorized. Use with care: it gets mixed up with real authentication failures when debugging."
		},
		hit: {
			title: "Hit Detail · {name}",
			total: "Total hits",
			ipCount: "Source IPs",
			last: "Last hit",
			empty: "This policy has never taken effect. Only requests where the rule really {effective} are counted: blocked by a blocklist, rate limited, or an endpoint disabled or forwarded. Passed requests are not counted.",
			topIps: "Top 10 Source IPs",
			trend: "Hit trend (per minute)",
			trendEmpty: "No per-minute trend data (the trend keeps only the last hour and is cleared on restart).",
			detailTitle: "Client IP detail (who is calling)",
			colIp: "Client IP",
			colCount: "Count",
			termEffective: "really did something",
			loadFailed: "Failed to load hit detail"
		}
	}
};
//#endregion
//#region ../../packages/languages/src/index.ts
/**
* @repo/languages —— 国际化
*
* 提供统一 i18n 实例（zh / en 内置），供所有主题 / 应用复用。
* getMenuLanguage 用于把 "menu.xxx" key 翻译为菜单标题。
*/
/** 安全获取浏览器语言 */
var getSafeBrowserLang = () => {
	try {
		if (typeof window === "undefined" || typeof navigator === "undefined") return "en";
		const browserLang = navigator.language || navigator.browserLanguage;
		if (!browserLang) return "en";
		const lang = browserLang.toLowerCase().split("-")[0];
		return ["zh", "cn"].includes(lang) ? "zh" : "en";
	} catch {
		return "en";
	}
};
var i18n = createI18n({
	allowComposition: true,
	legacy: false,
	locale: getSafeBrowserLang(),
	messages: {
		zh: zh_default,
		en: en_default
	}
});
/** i18n 语言切换菜单标题：title 以 "menu." 开头时走翻译，否则原样返回 */
var getMenuLanguage = (title) => {
	if (!title) return "";
	return title.startsWith("menu.") ? i18n.global.t(title) : title;
};
/**
* 登录页配置文案翻译：value 以 "menu." 开头视为 i18n key 走翻译，否则原样返回。
*
* app.yaml loginConfig 的 title/welcome/description/featureTags.text 既支持
* 直接写字面量（如 "欢迎登录"），也支持 i18n key（如 "menu.login.welcome"），
* 便于切换语言时自动翻译。
*/
var translateConfigText = (value) => {
	if (!value) return "";
	return value.startsWith("menu.") ? i18n.global.t(value) : value;
};
//#endregion
//#region ../../packages/core/src/router/dynamic.ts
/**
* 将扁平菜单注册到 layout 子路由
* @param router 路由实例
* @param menuList 扁平菜单
* @param layoutName 挂载的父路由名（默认 layout）
* @returns 新增路由数
*/
function registerDynamicRoutes(router, menuList, layoutName = "layout") {
	const allowedPrefixes = getConfig().route.allowPrefixes ?? [];
	const filteredMenuList = allowedPrefixes.length > 0 ? menuList.filter((item) => {
		const path = String(item?.path ?? "").trim();
		return allowedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
	}) : menuList;
	let addedCount = 0;
	filteredMenuList.forEach((item) => {
		if (!item?.name) {
			log.warn(`[route] 菜单缺少 name，已跳过`, item);
			return;
		}
		if (router.hasRoute(item.name)) {
			log.warn(`[route] 菜单 name 与已有路由重名，已跳过注册（点击会 404）: name=${String(item.name)} path=${String(item.path ?? "")}`);
			return;
		}
		if (item.meta?.standalone || item.meta?.remind) router.addRoute(item);
		else router.addRoute(layoutName, item);
		addedCount += 1;
	});
	return addedCount;
}
/** 菜单已在 store，但路由表里没有对应 name（如登出/resetRouter 后未重新注册） */
function isDynamicRoutesMissing(router, menuList) {
	if (!menuList?.length) return true;
	return menuList.some((menu) => menu?.name && !router.hasRoute(menu.name));
}
/** 动态路由初始化 Promise 缓存（防并发） */
var initPromise = null;
/** 初始化动态路由（拉取菜单 + 注册到 layout），router 与数据源由调用方注入 */
async function initDynamicRoutes(router, context) {
	if (initPromise) return initPromise;
	initPromise = doInitDynamicRoutes(router, context).then((isEmpty) => {
		if (isEmpty) initPromise = null;
	}).catch(() => {
		initPromise = null;
	});
	return initPromise;
}
/** @returns 菜单为空（未注册任何动态路由）时为 true，供上层决定是否重开初始化 */
async function doInitDynamicRoutes(router, context) {
	const { getMenuList, loadMenus, notify } = context;
	const warn = notify ?? ((m) => log.warn(`logger`, m));
	const err = notify ?? ((m) => log.error(`logger`, m));
	try {
		let menuList = getMenuList();
		if (!menuList?.length && loadMenus) {
			await loadMenus();
			menuList = getMenuList();
		}
		if (!menuList?.length) {
			warn("当前账号未分配任何菜单");
			return true;
		}
		if (registerDynamicRoutes(router, menuList) === 0 && isDynamicRoutesMissing(router, menuList)) {
			const conflictOrInvalid = menuList.filter((menu) => menu?.name && !router.hasRoute(menu.name));
			err("动态路由注册失败，已保留登录态；以下路由未注册，请检查 name 冲突或组件路径：");
			conflictOrInvalid.forEach((menu) => err(`  - ${String(menu?.name)} -> ${menu?.component == null ? "(无组件)" : String(menu.component)}`));
		}
	} catch (error) {
		log.error("[route] 动态路由初始化失败，已保留当前登录态（若为会话失效，http 拦截器会另行跳转登录页）", error);
		return true;
	}
	return false;
}
//#endregion
//#region ../../packages/core/src/router/menu.ts
/**
* 菜单 → 路由转换（core）
*
* 把后端菜单数据（含 component 字段）解析成 vue-router 路由。
* 组件解析（viewModules glob + layout 组件 + 404 组件）由调用方注入，core 不依赖具体主题页面。
*
* 用法：
*   const resolver = createMenuRouteResolver({
*     viewModules: import.meta.glob("..\/views\/**\/*.vue"),
*     layoutComponent: Layout,
*     notFoundComponent: () => import(".../404.vue"),
*   });
*   resolver.generateRoutes(menuData, 0);       // 递归生成树
*   resolver.generateFlattenRoutes(menuData);    // 扁平一级路由
*/
/** 动态 import 失败时回退兜底组件 */
function wrapPageLoader(loader, moduleKey, notFound) {
	return () => loader().catch((error) => {
		log.warn(`[route] 页面加载失败，已使用兜底页: ${moduleKey}`, error);
		return notFound;
	});
}
/** 已注册的扩展视图模块（key 形如 `views/system/user/index.vue`） */
var extraViewModules = /* @__PURE__ */ new Map();
/** 创建菜单 → 路由解析器 */
function createMenuRouteResolver(options) {
	const { viewModules, layoutComponent, notFoundComponent, menuTypeValue = "1" } = options;
	const HOME_URL = getConfig().route.homePath || "/home";
	const _menuId = (i) => i.menuId ?? i.sysMenuId;
	const _parentId = (i) => i.parentId ?? i.sysMenuPid;
	const _menuName = (i) => i.menuName ?? i.meta?.title ?? i.name;
	const _menuIcon = (i) => i.icon || i.meta?.icon || resolveMenuDefaultIcon();
	const _menuType = (i) => i.menuType ?? i.sysMenuType;
	const _isVisible = (i) => {
		if (i.isVisible !== void 0) return i.isVisible;
		if (i.meta?.isVisible !== void 0) return i.meta.isVisible;
		return i.meta?.showLink ?? true;
	};
	const _remind = (i) => {
		const v = i.remind ?? i.meta?.remind;
		return v === true || v === 1 || v === "1";
	};
	const _menuVisible = (i) => {
		if (_remind(i)) return false;
		const v = _isVisible(i);
		if (v == null) return true;
		return v == 1 || v === true;
	};
	const _showParent = (i) => {
		const v = i.sysMenuShowParent ?? i.showParent ?? i.meta?.showParent;
		return v === 0 || v === "0" ? 1 : 0;
	};
	const _position = (i) => {
		const raw = String(i.sysMenuPosition ?? i.position ?? i.meta?.position ?? "").trim().toLowerCase();
		return raw === "top" || raw === "footer" ? raw : "standard";
	};
	const _hasPage = (i) => {
		const c = i?.component;
		if (typeof c !== "string") return c != null;
		const v = c.trim();
		return v !== "" && v !== "Layout" && v !== "ParentView" && v !== "layout" && v !== "parentView";
	};
	const _isTag = (i) => {
		const v = i.isTag ?? i.sysMenuIsTag ?? i.meta?.isTag;
		return v === 1 || v === "1" || v === true ? 1 : 0;
	};
	const _tagType = (i) => i.tagType ?? i.sysMenuTagType ?? i.meta?.tagType;
	const _tagName = (i) => i.tagName ?? i.sysMenuTagName ?? i.meta?.tagName;
	/**
	* 节点是否具备被渲染的最小条件：必须有可用的 path 与 名称。
	*
	* <p>为什么需要它：下面建路由时有一行
	* `path: item.path.startsWith("/") ? item.path : "/" + item.path`，
	* 一旦后端下发的某个节点 path 为 undefined，这里就会抛 TypeError，
	* <b>整个 generateRoutes 中断</b>——不只是坏节点不显示，
	* 而是同一次返回里的所有正常菜单（实测 26 条进、0 条出）。</p>
	*
	* <p>真实触发路径（2026-10-01）：POST /v2/menu/save 当时没有任何必填校验，
	* 一次空体请求就 INSERT 出标题/路径/组件/名称全为 NULL 的菜单行。
	* admin 是唯一走「全部菜单」分支的角色（SysMenuServiceImpl 里
	* `isSuperAdmin(roles) || isBuiltinAdmin(username)`），
	* 因此只有 admin 会拿到这些脏节点 —— 表现为**最高权限账号侧栏一个菜单都不显示**，
	* 而普通用户因为接口返回空、回落到静态路由反而正常。</p>
	*
	* <p>这里只做「跳过坏节点」：一条脏数据不该让整个系统不可用。
	* 根因（save 缺必填校验）已在服务端补上，此处是前端侧的兜底。</p>
	*/
	const _isRenderableNode = (i) => {
		if (!i || typeof i !== "object") return false;
		const path = i.path ?? i.sysMenuPath;
		if (typeof path !== "string" || path.trim() === "") return false;
		const name = _menuName(i);
		if (name === void 0 || name === null || String(name).trim() === "") return false;
		return true;
	};
	function flattenMenu(items) {
		const result = [];
		const seen = /* @__PURE__ */ new Set();
		for (const item of items) {
			if (item) {
				const id = String(_menuId(item));
				if (!seen.has(id)) {
					seen.add(id);
					result.push(item);
				}
			}
			if (Array.isArray(item?.children)) {
				const sub = flattenMenu(item.children);
				for (const child of sub) {
					const id = String(_menuId(child));
					if (!seen.has(id)) {
						seen.add(id);
						result.push(child);
					}
				}
			}
		}
		return result;
	}
	function resolveRouteComponent(componentTemplate) {
		if (!componentTemplate) return layoutComponent;
		const normalizedComponent = componentTemplate.startsWith("/") ? componentTemplate.slice(1) : componentTemplate;
		const moduleKey = `views/${normalizedComponent}.vue`;
		const loader = viewModules[moduleKey] ?? extraViewModules.get(moduleKey);
		if (loader) return wrapPageLoader(loader, moduleKey, notFoundComponent);
		const parts = normalizedComponent.split("/");
		if (parts.length >= 2) {
			const suffix = parts.slice(-2).join("/");
			for (const [key, mod] of extraViewModules) if (key.endsWith(suffix + ".vue")) {
				log.warn(`[route] 组件路径回退匹配: ${moduleKey} -> ${key}`);
				return wrapPageLoader(mod, key, notFoundComponent);
			}
			for (const key of Object.keys(viewModules)) if (key.endsWith(suffix + ".vue")) {
				log.warn(`[route] 组件路径回退匹配: ${moduleKey} -> ${key}`);
				return wrapPageLoader(viewModules[key], key, notFoundComponent);
			}
		}
		log.warn(`[route] 页面不存在，已使用兜底页: ${moduleKey}`);
		return notFoundComponent;
	}
	/** 递归生成树形路由 */
	function generateRoutes(data, parentId, opts) {
		const flat = flattenMenu(data);
		const visibleOnly = opts?.visibleOnly === true;
		const routeList = [];
		for (const item of flat) if (item && String(_parentId(item)) === String(parentId)) {
			if (visibleOnly && !_menuVisible(item)) continue;
			if (!_isRenderableNode(item)) {
				log.warn(`[route] 菜单节点缺少 path 或名称，已跳过: ${JSON.stringify(_menuId(item))}`);
				continue;
			}
			const isDirectory = _menuType(item) == menuTypeValue;
			const componentTemplate = item?.component;
			const route = {
				path: item.path.startsWith("/") ? item.path : `/${item.path}`,
				name: `${item.name}`,
				component: resolveRouteComponent(componentTemplate),
				meta: {
					menuId: String(_menuId(item)),
					title: String(_menuName(item)),
					icon: _menuIcon(item),
					isVisible: _isVisible(item),
					remind: _remind(item),
					isKeepAlive: item.isKeepAlive ?? item.meta?.keepAlive,
					linkUrl: item.linkUrl,
					isTag: _isTag(item),
					tagType: _tagType(item),
					tagName: _tagName(item),
					isAffix: item.isAffix,
					activeMenu: item.activeMenu,
					position: _position(item),
					showParent: _showParent(item),
					isDirectory
				}
			};
			if (_menuType(item) == menuTypeValue) route.redirect = `${item?.redirect || item.meta?.redirect}` || HOME_URL;
			const children = generateRoutes(flat, _menuId(item), opts);
			if (visibleOnly && children.length === 0 && !_hasPage(item)) continue;
			if (children.length > 0) route.children = children;
			if (visibleOnly && isDirectory && children.length === 1 && _showParent(item) !== 1) {
				routeList.push(children[0]);
				continue;
			}
			routeList.push(route);
		}
		return routeList;
	}
	/** 生成扁平一级路由 */
	function generateFlattenRoutes(data) {
		const flat = flattenMenu(data);
		const routes = [];
		for (const item of flat) {
			if (!_isRenderableNode(item)) {
				log.warn(`[route] 菜单节点缺少 path 或名称，已跳过(扁平): ${JSON.stringify(_menuId(item))}`);
				continue;
			}
			const componentTemplate = item?.component;
			const route = {
				path: item.path.startsWith("/") ? item.path : `/${item.path}`,
				name: `${item.name}`,
				component: resolveRouteComponent(componentTemplate),
				meta: {
					parentId: String(_parentId(item)),
					menuId: String(_menuId(item)),
					title: _menuName(item),
					icon: _menuIcon(item),
					isVisible: _isVisible(item),
					remind: _remind(item),
					isKeepAlive: item.isKeepAlive ?? item.meta?.keepAlive,
					linkUrl: item.linkUrl,
					isTag: _isTag(item),
					tagType: _tagType(item),
					tagName: _tagName(item),
					isAffix: item.isAffix,
					activeMenu: item.activeMenu,
					position: _position(item),
					showParent: _showParent(item),
					isDirectory: _menuType(item) == menuTypeValue
				}
			};
			if (_menuType(item) == menuTypeValue) route.redirect = `${item?.redirect || item.meta?.redirect}` || HOME_URL;
			routes.push(route);
		}
		return routes;
	}
	return {
		generateRoutes,
		generateFlattenRoutes
	};
}
var { addListener, launch, removeListener, stop } = (/* @__PURE__ */ __toESM(require_devtools_detector(), 1)).default;
//#endregion
//#region ../../packages/core/src/setting.ts
/**
* 登录页默认配置加载（core）
*
* 登录页挂载时调用一次，从后端拉取 /v2/setting/default 并合并进 getConfig 的 login 子配置。
* 后端 /v2/setting/default 只返回 default/sso/default-1 分组，全部是登录页相关字段：
*   - CheckCodeOpen    图形验证码开关
*   - SlidingBlockOpen 滑块验证开关
*   - CheckTotpOpen    OTP 动态口令开关
*   - OpenSmsLogin     短信登录开关（前端未实现，透传）
*   - SystemName / BrandName / Welcome / Description / LogoUrl / ImageUrl / AvatarUrl / BeiAnHao / FeatureTags
*
* 热重载：bindConfigHotReload() 监听 CONFIG_VERSION_CHANGE_EVENT（由
* http 响应头 x-response-version 触发），版本变化后重新拉取设置，
* 并执行已注册的 onConfigHotReload 回调。
*/
function shouldFetchRemoteSetting() {
	return getConfig()?.config?.enable !== false && !!getConfig()?.url?.setting;
}
var SETTING_TO_LOGIN_MAP = {
	CheckCodeOpen: "captcha",
	CheckTotpOpen: "otp",
	SlidingBlockOpen: "slider",
	OpenSmsLogin: "smsLogin",
	SystemName: "title",
	BrandName: "brandName",
	Welcome: "welcome",
	Description: "description",
	LogoUrl: "logoUrl",
	ImageUrl: "imageUrl",
	AvatarUrl: "avatarUrl",
	BeiAnHao: "beiAnHao",
	FeatureTags: "featureTags"
};
/**
* 不在 {@code login} 子树上的旧式设置名到 AppConfig 点号路径的映射。
*
* <p>水印的旧名是 {@code Watermark*}（WatermarkOpen/WatermarkColor/WatermarkAlpha/
* WatermarkRotate），前端读的是 {@code getConfig().security.watermark}（见
* {@code directives/waterMarker.ts} 的读数路径），它不在 {@code login} 子树上，
* 只能落到 {@code security.watermark} 里。而 {@code SETTING_TO_LOGIN_MAP} 只负责
* {@code login.*}。</p>
*
* <p>它只在白名单允许时才能落盘（{@code security_watermark} 加入
* {@code @repo/config} 的 {@code REMOTE_INJECTABLE_PATH_PREFIXES}），
* 与 {@code loadConfig} 里 {@code flattenSettingToConfig} 的 {@code LEGACY_NAME_TO_PATH}
* 互补/对齐 —— 两端同一份数据落到相同路径，水印配置才真正连通。</p>
*/
var SETTING_NAME_TO_CONFIG_PATH = {
	WatermarkOpen: "security.watermark.enable",
	WatermarkColor: "security.watermark.color",
	WatermarkAlpha: "security.watermark.alpha",
	WatermarkRotate: "security.watermark.rotate"
};
function mergeDefaultSetting(items) {
	if (!Array.isArray(items)) return;
	const patch = {};
	items.forEach((item) => {
		if (!item?.sysSettingName || item.sysSettingValue == null) return;
		const raw = String(item.sysSettingValue);
		const boolVal = raw === "true" ? true : raw === "false" ? false : void 0;
		const numeric = Number(raw);
		const val = boolVal ?? (String(raw).trim() !== "" && !Number.isNaN(numeric) ? numeric : raw);
		const code = String(item.sysSettingCode ?? "");
		if (code.includes(".")) {
			safeSetDotted(patch, code, val, {
				topKeyAllowlist: REMOTE_INJECTABLE_TOP_KEYS,
				pathPrefixAllowlist: REMOTE_INJECTABLE_PATH_PREFIXES,
				normalizeTopKey,
				onReject: (path, reason) => {
					log.warn(`[setting] 已拒绝远程配置项 "${path}"：${reason}`);
				}
			});
			return;
		}
		const loginKey = SETTING_TO_LOGIN_MAP[item.sysSettingName];
		const configPath = SETTING_NAME_TO_CONFIG_PATH[item.sysSettingName];
		if (!loginKey && !configPath) return;
		if (configPath) {
			safeSetDotted(patch, configPath, val, {
				topKeyAllowlist: REMOTE_INJECTABLE_TOP_KEYS,
				pathPrefixAllowlist: REMOTE_INJECTABLE_PATH_PREFIXES,
				normalizeTopKey,
				onReject: (path, reason) => {
					log.warn(`[setting] 已拒绝远程配置项 "${path}"：${reason}`);
				}
			});
			return;
		}
		patch.login = patch.login ?? {};
		let loginVal = boolVal ?? raw;
		if (loginKey === "featureTags") try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) loginVal = parsed;
		} catch {
			loginVal = raw;
		}
		patch.login[loginKey] = loginVal;
	});
	if (Object.keys(patch).length > 0) applyConfig(patch);
}
/**
* 强制重新拉取后端 /v2/setting/default 并合并到 getConfig。
*
* 与 loadDefaultSetting 的区别：本函数**总是发起真实请求**（不复用 loader 的启动缓存），
* 因此后端配置变更后能拿到新值；loadDefaultSetting 会复用启动期缓存，
* 只适合首屏 bootstrap，不能用于热重载。
*
* 未登录时 /v2/setting/default 受鉴权保护，启动阶段拉取可能失败，
* 因此登录成功后用本函数再拉一次并广播热重载。
*/
async function refreshDefaultSetting() {
	if (!shouldFetchRemoteSetting()) return false;
	const ok = await fetchAndMergeDefaultSetting();
	notifyHotReload();
	return ok;
}
/** 真实请求 + 合并（失败静默，返回是否成功） */
async function fetchAndMergeDefaultSetting() {
	try {
		const { data } = await getDefaultSetting();
		if (!Array.isArray(data)) return false;
		mergeDefaultSetting(data);
		return true;
	} catch (error) {
		log.warn(`[setting] 远程配置刷新失败，继续使用当前配置`, error);
		return false;
	}
}
/** 广播热重载（各注册方重新应用依赖配置的能力，如 socket / 水印 / 反调试） */
function notifyHotReload() {
	hotReloadCallbacks.forEach((cb) => {
		try {
			cb();
		} catch (error) {
			log.warn(`[setting] 配置热重载回调失败`, error);
		}
	});
}
var hotReloadCallbacks = /* @__PURE__ */ new Set();
//#endregion
//#region ../../packages/core/src/directives/waterMarker.ts
var GLOBAL_WATERMARK_ID = "global-watermark-container";
var defaultConfig = {
	text: "ADMIN",
	font: "20px 宋体",
	textColor: "rgba(180, 180, 180, 0.3)",
	zIndex: 9999,
	isGlobal: false,
	enable: true,
	rotate: -20
};
/** 从全局配置读取水印配置（security.Watermark* 或 app.yaml watermark） */
function readGlobalWatermarkConfig() {
	const wm = (getConfig()?.security ?? {}).watermark ?? {};
	const result = {};
	result.enable = wm.enable !== false;
	result.isGlobal = wm.enable === true;
	if (typeof wm.text === "string" && wm.text) result.text = wm.text;
	if (wm.color) result.textColor = wm.color;
	if (typeof wm.alpha === "number") result.textColor = rgbaFromHex(wm.color ?? "#409EFF", wm.alpha);
	if (typeof wm.rotate === "number") result.rotate = wm.rotate;
	return result;
}
/** hex 颜色 + alpha → rgba 字符串 */
function rgbaFromHex(hex, alpha) {
	const m = hex.replace("#", "");
	if (m.length !== 6) return `rgba(180, 180, 180, ${alpha})`;
	return `rgba(${parseInt(m.slice(0, 2), 16)}, ${parseInt(m.slice(2, 4), 16)}, ${parseInt(m.slice(4, 6), 16)}, ${alpha})`;
}
var generateWatermarkCanvas = (str, font, textColor, rotate = -20) => {
	const can = document.createElement("canvas");
	can.width = 205;
	can.height = 140;
	can.style.display = "none";
	const cans = can.getContext("2d");
	cans.rotate(rotate * Math.PI / 180);
	cans.font = font;
	cans.fillStyle = textColor;
	cans.textAlign = "left";
	cans.fillText(str, can.width / 10, can.height / 2);
	return can.toDataURL("image/png");
};
/** 防删除监听：检测水印容器被移除后自动重建（只观察 childList，不影响业务渲染） */
var restoreObserver = null;
/** 当前水印是否启用（用于恢复时二次判断） */
function isWatermarkEnabled() {
	return readGlobalWatermarkConfig().enable !== false;
}
/** 挂接防删除监听：水印节点被移除/替换时自动重建 */
function watchGlobalWatermark() {
	if (typeof document === "undefined" || !document.body) return;
	if (restoreObserver) {
		restoreObserver.disconnect();
		restoreObserver = null;
	}
	restoreObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) if (Array.from(mutation.removedNodes).some((node) => node.id === GLOBAL_WATERMARK_ID) && isWatermarkEnabled()) {
			applyGlobalWatermark();
			return;
		}
	});
	restoreObserver.observe(document.body, {
		childList: true,
		subtree: true
	});
}
/** 断开防删除监听（水印关闭 / 应用销毁时调用） */
function unwatchGlobalWatermark() {
	if (restoreObserver) {
		restoreObserver.disconnect();
		restoreObserver = null;
	}
}
/**
* 重新应用全局水印（配置热重载后调用）。
* 读取当前 security.watermark，开关关闭时不渲染。
*/
function applyGlobalWatermark() {
	const global = readGlobalWatermarkConfig();
	if (global.enable === false) {
		unwatchGlobalWatermark();
		const oldWatermark = document.getElementById(GLOBAL_WATERMARK_ID);
		if (oldWatermark) document.body.removeChild(oldWatermark);
		return;
	}
	createGlobalWatermark({
		...defaultConfig,
		...global,
		isGlobal: true
	});
}
var createGlobalWatermark = (config) => {
	const oldWatermark = document.getElementById(GLOBAL_WATERMARK_ID);
	if (oldWatermark) document.body.removeChild(oldWatermark);
	const container = document.createElement("div");
	container.id = GLOBAL_WATERMARK_ID;
	Object.assign(container.style, {
		position: "fixed",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		pointerEvents: "none",
		zIndex: config.zIndex,
		backgroundImage: `url(${generateWatermarkCanvas(config.text, config.font, config.textColor, config.rotate)})`,
		backgroundRepeat: "repeat",
		opacity: "1"
	});
	document.body.appendChild(container);
	watchGlobalWatermark();
};
var createLocalWatermark = (el, config) => {
	el.style.backgroundImage = "";
	el.style.backgroundImage = `url(${generateWatermarkCanvas(config.text, config.font, config.textColor)})`;
	el.style.backgroundRepeat = "repeat";
	el.style.zIndex = config.zIndex;
};
var waterMarker = {
	mounted(el, binding) {
		const global = readGlobalWatermarkConfig();
		const config = {
			...defaultConfig,
			...global,
			...binding.value || {}
		};
		if (config.isGlobal && config.enable === false) return;
		if (config.isGlobal) createGlobalWatermark(config);
		else {
			unwatchGlobalWatermark();
			createLocalWatermark(el, config);
		}
	},
	updated(el, binding) {
		const global = readGlobalWatermarkConfig();
		const config = {
			...defaultConfig,
			...global,
			...binding.value || {}
		};
		if (config.isGlobal && config.enable === false) return;
		if (config.isGlobal) createGlobalWatermark(config);
		else {
			unwatchGlobalWatermark();
			createLocalWatermark(el, config);
		}
	},
	unmounted(el) {
		el.style.backgroundImage = "";
		el.style.backgroundRepeat = "";
		el.style.zIndex = "";
		const global = readGlobalWatermarkConfig();
		if (global.isGlobal || global.enable === false) unwatchGlobalWatermark();
	}
};
//#endregion
//#region ../../packages/core/src/directives/auth.ts
function toggle(el, binding) {
	const { value } = binding;
	if (!Array.isArray(value) || value.length === 0) {
		log.warn(`v-auth 需要非空数组，例如 v-auth="['system:user:add']"`);
		return;
	}
	if (!hasPerm(value)) el.parentNode?.removeChild(el);
}
var auth = {
	mounted: toggle,
	updated: toggle
};
//#endregion
//#region ../../packages/core/src/directives/draggable.ts
var draggable = { mounted: function(el) {
	el.style.cursor = "move";
	el.style.position = "absolute";
	el.onmousedown = function(e) {
		let disX = e.pageX - el.offsetLeft;
		let disY = e.pageY - el.offsetTop;
		document.onmousemove = function(e) {
			let x = e.pageX - disX;
			let y = e.pageY - disY;
			let maxX = el.parentNode.offsetWidth - el.offsetWidth;
			let maxY = el.parentNode.offsetHeight - el.offsetHeight;
			if (x < 0) x = 0;
			else if (x > maxX) x = maxX;
			if (y < 0) y = 0;
			else if (y > maxY) y = maxY;
			el.style.left = x + "px";
			el.style.top = y + "px";
		};
		document.onmouseup = function() {
			document.onmousemove = document.onmouseup = null;
		};
	};
} };
//#endregion
//#region ../../packages/core/src/directives/debounce.ts
var debounce$1 = { mounted(el, binding) {
	if (typeof binding.value !== "function") throw "callback must be a function";
	let timer = null;
	const delay = parseInt(binding.arg) || 500;
	const handler = binding.value;
	el.addEventListener("click", () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			handler();
		}, delay);
	}, { passive: false });
} };
//#endregion
//#region ../../packages/core/src/directives/debounceInput.ts
var debounce = { mounted(el, binding) {
	if (typeof binding.value !== "function") throw "callback must be a function";
	let timer = null;
	const delay = parseInt(binding.arg) || 500;
	const handler = binding.value;
	el.addEventListener("input", () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			handler();
		}, delay);
	}, { passive: false });
} };
//#endregion
//#region ../../packages/core/src/directives/throttle.ts
var throttle$1 = { mounted(el, binding) {
	const delay = parseInt(binding.arg) || 500;
	const handler = binding.value;
	let lastExecTime = 0;
	el.addEventListener("click", () => {
		const now = Date.now();
		if (now - lastExecTime > delay) {
			handler();
			lastExecTime = now;
		}
	}, { passive: false });
} };
//#endregion
//#region ../../packages/core/src/directives/throttleInput.ts
var throttle = { mounted(el, binding) {
	const delay = parseInt(binding.arg) || 500;
	const handler = binding.value;
	let lastExecTime = 0;
	el.addEventListener("input", () => {
		const now = Date.now();
		if (now - lastExecTime > delay) {
			handler();
			lastExecTime = now;
		}
	}, { passive: false });
} };
//#endregion
//#region ../../packages/core/src/directives/adaptive.ts
var DEFAULT_HEIGHT = 80;
/**
* 自适应高度指令
* 用法：
* <div v-adaptive></div>
* <div v-adaptive="{ height: 60 }"></div>
*/
var vAdaptiveHeight = {
	mounted(el, binding) {
		const config = binding.value || {};
		const bottomHeight = typeof config.height === "number" ? config.height : DEFAULT_HEIGHT;
		const updateHeight = () => {
			const top = el.getBoundingClientRect().top;
			const pageHeight = window.innerHeight;
			el.style.height = `${pageHeight - top - bottomHeight}px`;
			el.style.overflowY = "auto";
		};
		let resizeTimer;
		const onResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(() => {
				requestAnimationFrame(updateHeight);
			}, 100);
		};
		el._resizeListener = onResize;
		updateHeight();
		window.addEventListener("resize", onResize);
	},
	updated(el, binding) {
		const config = binding.value || {};
		const bottomHeight = typeof config.height === "number" ? config.height : DEFAULT_HEIGHT;
		const top = el.getBoundingClientRect().top;
		const pageHeight = window.innerHeight;
		el.style.height = `${pageHeight - top - bottomHeight}px`;
	},
	unmounted(el) {
		if (el._resizeListener) {
			window.removeEventListener("resize", el._resizeListener);
			delete el._resizeListener;
		}
	}
};
//#endregion
//#region ../../packages/core/src/directives/copy.ts
/**
* 使用传统方法复制文本（降级方案）
*/
var fallbackCopyText = (text) => {
	try {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.style.position = "fixed";
		textarea.style.left = "-999999px";
		textarea.style.top = "-999999px";
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		const successful = document.execCommand("copy");
		document.body.removeChild(textarea);
		return successful;
	} catch (error) {
		log.error(`降级复制方法失败:`, error);
		return false;
	}
};
/**
* 复制文本到剪贴板
*/
var copyToClipboard = async (text) => {
	if (!text && text !== "0") {
		log.warn(`复制内容为空`);
		return false;
	}
	const textToCopy = text.toString();
	if (navigator.clipboard && window.isSecureContext) try {
		await navigator.clipboard.writeText(textToCopy);
		return true;
	} catch (error) {
		log.warn(`Clipboard API 失败，尝试降级方案:`, error);
		return fallbackCopyText(textToCopy);
	}
	else return fallbackCopyText(textToCopy);
};
var copy = {
	mounted(el, binding) {
		el.copyData = binding.value;
		el.handleClickEl = async function() {
			try {
				const text = el.copyData?.toString() || "";
				if (!text && text !== "0") {
					ElMessage.warning("复制内容为空");
					return;
				}
				if (await copyToClipboard(text)) ElMessage.success("复制成功");
				else ElMessage.error("复制失败，请手动复制");
			} catch (error) {
				log.error(`复制操作失败: `, error);
				ElMessage.error("复制失败，请手动复制");
			}
		};
		el.addEventListener("click", el.handleClickEl);
	},
	updated(el, binding) {
		el.copyData = binding.value;
	},
	beforeUnmount(el) {
		if (el.handleClickEl) el.removeEventListener("click", el.handleClickEl);
	}
};
//#endregion
//#region ../../packages/core/src/directives/permission.ts
/** 切换元素可见性（隐藏而非移除，以便角色异步更新后恢复） */
function setVisible(el, visible) {
	if (visible) el.style.display = "";
	else el.style.display = "none";
}
/** 菜单权限判断：meta.roles / meta.perms 任一命中即通过；都未声明则放行 */
function checkMenu(item) {
	if (!item?.meta) return true;
	const { roles, perms } = item.meta;
	if (roles && roles.length > 0 && !hasRole(roles)) return false;
	if (perms && perms.length > 0 && !hasPerm(perms)) return false;
	return true;
}
/** v-admin：当前用户是管理员（含超级管理员）才显示 */
var vAdmin = {
	mounted(el) {
		setVisible(el, isAdmin());
	},
	updated(el) {
		setVisible(el, isAdmin());
	}
};
/** v-superadmin：当前用户是超级管理员才显示 */
var vSuperadmin = {
	mounted(el) {
		const { superadmin } = getConfig().permission;
		setVisible(el, hasRole(superadmin));
	},
	updated(el) {
		const { superadmin } = getConfig().permission;
		setVisible(el, hasRole(superadmin));
	}
};
/** v-role：当前用户命中指定角色列表才显示 */
var vRole = {
	mounted(el, binding) {
		const required = binding.value;
		setVisible(el, !!required && hasRole(required));
	},
	updated(el, binding) {
		const required = binding.value;
		setVisible(el, !!required && hasRole(required));
	}
};
/** v-perm：当前用户拥有任一指定权限码才显示 */
var vPerm = {
	mounted(el, binding) {
		const required = binding.value;
		setVisible(el, !!required && hasPerm(required));
	},
	updated(el, binding) {
		const required = binding.value;
		setVisible(el, !!required && hasPerm(required));
	}
};
/** v-menu：按菜单 meta.roles / meta.perms 判断是否显示 */
var vMenu = {
	mounted(el, binding) {
		setVisible(el, checkMenu(binding.value));
	},
	updated(el, binding) {
		setVisible(el, checkMenu(binding.value));
	}
};
/** 批量注册权限指令 */
function setupPermissionDirectives(app) {
	app.directive("admin", vAdmin);
	app.directive("superadmin", vSuperadmin);
	app.directive("role", vRole);
	app.directive("perm", vPerm);
	app.directive("menu", vMenu);
}
//#endregion
//#region ../../packages/core/src/directives/vDebounce.ts
/** 解析 binding.value 为 [handler, wait] */
function parseArgs(binding) {
	const v = binding.value;
	if (typeof v === "function") return [v, Number(binding.arg) || 300];
	if (Array.isArray(v) && typeof v[0] === "function") return [v[0], Number(v[1]) || 300];
	return null;
}
function attach(el, binding, factory, storeKey) {
	const args = parseArgs(binding);
	if (!args) return;
	const [handler, wait] = args;
	const old = el[storeKey];
	if (old && typeof old.cancel === "function") old.cancel();
	el[storeKey] = factory(handler, wait);
	el.addEventListener("click", el[storeKey]);
}
function detach(el, storeKey) {
	const handler = el[storeKey];
	if (handler) {
		el.removeEventListener("click", handler);
		if (typeof handler.cancel === "function") handler.cancel();
		delete el[storeKey];
	}
}
var vDebounce = {
	mounted(el, binding) {
		attach(el, binding, debounce$2, "__debounce_handler__");
	},
	updated(el, binding) {
		if (binding.value === binding.oldValue) return;
		detach(el, "__debounce_handler__");
		attach(el, binding, debounce$2, "__debounce_handler__");
	},
	unmounted(el) {
		detach(el, "__debounce_handler__");
	}
};
var vThrottle = {
	mounted(el, binding) {
		attach(el, binding, throttle$2, "__throttle_handler__");
	},
	updated(el, binding) {
		if (binding.value === binding.oldValue) return;
		detach(el, "__throttle_handler__");
		attach(el, binding, throttle$2, "__throttle_handler__");
	},
	unmounted(el) {
		detach(el, "__throttle_handler__");
	}
};
//#endregion
//#region ../../packages/core/src/directives/checkUrl.ts
var memoryCache = /* @__PURE__ */ new Map();
var DEFAULT_TTL = 3e5;
var DEFAULT_TIMEOUT = 5e3;
var SESSION_PREFIX = "url-check:";
/** 从 URL 提取 origin（域名级），相对路径返回 null */
function extractOrigin(url) {
	try {
		if (/^[a-z0-9+.-]*:\/\//i.test(url)) return new URL(url).origin;
		if (url.startsWith("/")) return window.location.origin;
		return window.location.origin;
	} catch {
		return null;
	}
}
function parseValue(value) {
	if (typeof value === "string") return {
		url: value,
		timeout: DEFAULT_TIMEOUT,
		ttl: DEFAULT_TTL
	};
	return {
		url: value?.url ?? "",
		timeout: value?.timeout ?? DEFAULT_TIMEOUT,
		ttl: value?.ttl ?? DEFAULT_TTL
	};
}
function writeSession(origin, cache) {
	try {
		sessionStorage.setItem(SESSION_PREFIX + origin, JSON.stringify(cache));
	} catch {}
}
function readSession(origin) {
	try {
		const raw = sessionStorage.getItem(SESSION_PREFIX + origin);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function readCache(origin, ttl) {
	const now = Date.now();
	const mem = memoryCache.get(origin);
	if (mem && now - mem.checkedAt < ttl) return mem;
	const session = readSession(origin);
	if (session && now - session.checkedAt < ttl) {
		memoryCache.set(origin, session);
		return session;
	}
	return null;
}
async function checkOrigin(origin, timeout) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);
	try {
		await fetch(origin, {
			method: "HEAD",
			mode: "cors",
			signal: controller.signal
		});
		return true;
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}
function applyClass(el, ok) {
	el.classList.remove("url-checking", "url-ok", "url-fail");
	if (ok === null) el.classList.add("url-checking");
	else if (ok) el.classList.add("url-ok");
	else el.classList.add("url-fail");
}
async function doCheck(el, origin, timeout) {
	if (!origin) {
		applyClass(el, false);
		return;
	}
	const cached = readCache(origin, DEFAULT_TTL);
	if (cached) {
		applyClass(el, cached.ok);
		return;
	}
	applyClass(el, null);
	const ok = await checkOrigin(origin, timeout);
	const cache = {
		ok,
		checkedAt: Date.now()
	};
	memoryCache.set(origin, cache);
	writeSession(origin, cache);
	applyClass(el, ok);
}
//#endregion
//#region ../../packages/core/src/directives/index.ts
var commonDirectives = {
	auth,
	waterMarker,
	draggable,
	debounce: debounce$1,
	debounceInput: debounce,
	throttle: throttle$1,
	throttleInput: throttle,
	adaptive: vAdaptiveHeight,
	copy,
	vDebounce,
	vThrottle,
	checkUrl: {
		mounted(el, binding) {
			const parsed = parseValue(binding.value);
			const origin = extractOrigin(parsed.url);
			if (!origin) {
				applyClass(el, false);
				return;
			}
			el.__checkUrl = { origin };
			doCheck(el, origin, parsed.timeout);
		},
		updated(el, binding) {
			const parsed = parseValue(binding.value);
			const origin = extractOrigin(parsed.url);
			if (!origin) return;
			if (el.__checkUrl?.origin !== origin) {
				el.__checkUrl = { origin };
				doCheck(el, origin, parsed.timeout);
			}
		},
		beforeUnmount(el) {
			el.__checkUrl = void 0;
		}
	}
};
/** 注册全部通用指令 + 权限指令 */
function setupCommonDirectives(app) {
	Object.keys(commonDirectives).forEach((key) => {
		app.directive(key, commonDirectives[key]);
	});
	setupPermissionDirectives(app);
}
//#endregion
//#region ../../packages/core/src/thirdCallback.ts
function emptyParams() {
	return {
		redirectParam: "",
		thirdMsg: "",
		redirect: ""
	};
}
function capture() {
	if (typeof window === "undefined") return emptyParams();
	const captured = emptyParams();
	try {
		const merged = new URLSearchParams(window.location.search);
		const hash = window.location.hash;
		const idx = hash.indexOf("?");
		if (idx >= 0) new URLSearchParams(hash.slice(idx + 1)).forEach((value, key) => {
			if (!merged.has(key)) merged.set(key, value);
		});
		captured.redirectParam = merged.get("redirectParam") || "";
		captured.thirdMsg = merged.get("thirdMsg") || "";
		captured.redirect = merged.get("redirect") || "";
	} catch {}
	return captured;
}
capture();
//#endregion
export { throttle$2 as $, noticeInfo as A, refreshToken as B, msgError as C, msgWarning as D, msgSuccess as E, getDefaultSetting as F, getAdminRoles as G, getStationMessageAdapter as H, getMe as I, hasRole as J, getSuperadminRole as K, getMenu as L, noticeWarning as M, invalidateSessionScope as N, notice as O, getApiHttp as P, debounce$2 as Q, login as R, msgBoxPrompt as S, msgPrimary as T, resetActiveBaseUrl as U, APM_PREFIX as V, resolveRequestBaseUrl as W, setUserPerms as X, isAdmin as Y, setUserRoles as Z, translateConfigText as _, vPerm as a, msgBox as b, applyGlobalWatermark as c, createMenuRouteResolver as d, initDynamicRoutes as f, i18n as g, getMenuLanguage as h, vMenu as i, noticeSuccess as j, noticeError as k, mergeDefaultSetting as l, registerDynamicRoutes as m, setupPermissionDirectives as n, vRole as o, isDynamicRoutesMissing as p, hasPerm as q, vAdmin as r, vSuperadmin as s, setupCommonDirectives as t, refreshDefaultSetting as u, messageBox as v, msgInfo as w, msgBoxAlert as x, msg as y, logout as z };
