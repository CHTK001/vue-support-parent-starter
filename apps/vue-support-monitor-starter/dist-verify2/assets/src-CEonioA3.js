const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/src-CPcp-WOr.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/403-DCvzis-J.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/dist-DogtK295.js","assets/src-DzQcKxHP.js","assets/vue-router-D43uXGPs.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/403-d796rojF.js","assets/403-C2wsWTR8.css","assets/404-B5awkjJ4.js","assets/404-CwYujs4G.js","assets/404-C93N3u_Y.css","assets/500-CCrg6e4A.js","assets/500-CPUXSUXa.js","assets/500-BhNew4pU.css","assets/src-D3ABR126.js","assets/src-BRe7nJGb.js","assets/message-BQI5cdKE.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/dist-DI3cGDuP.js","assets/use-size-BpzpcbJM.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/dist-Clzx2YUA.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/aria-DKP9Ei-1.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_arrayPush-DAsStFRE.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/icon-C0dIJHSD.js","assets/icon-CKvLDnIU.js","assets/typescript-CMUKtCBO.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-z-index-Q40Vppe1.js","assets/pinia-Dz8LpwBD.js","assets/lib-DSELavqH.js","assets/src-DDwlSqPX.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/src-CS0EhWC8.js","assets/auth-C8MLoNwd.js","assets/src-CUe0zRl2.js"])))=>i.map(i=>d[i]);
import { o as __toESM, r as __exportAll, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { $n as normalizeClass, Bn as isFunction, D as createVNode, Ht as watch, J as inject, Jn as isString, On as unref, Yt as withDirectives, Z as isVNode, _ as createBaseVNode, an as getCurrentScope, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, pn as onScopeDispose, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, f as render, t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as i18n, t as getMenuLanguage } from "./src-BVnZQO9c.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { c as definePropType, h as isUndefined, i as debugWarn, s as buildProps, u as isElement } from "./use-namespace-BksmY6RT.js";
import { a as isClient, b as useTimeoutFn } from "./dist-DI3cGDuP.js";
import { u as useEventListener } from "./dist-Clzx2YUA.js";
import { r as withInstallFunction } from "./install-CE5IEjzX.js";
import { w as close_default } from "./dist-DogtK295.js";
import { a as iconPropType, r as TypeComponentsMap } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElMessage } from "./message-BQI5cdKE.js";
import { n as useGlobalComponentSettings } from "./use-global-config-CwtC64sR.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { _ as upgrade, a as REMOTE_INJECTABLE_TOP_KEYS, c as getConfig, f as isCapabilityEnabled, g as setConfig, h as restoreUserConfig, i as REMOTE_INJECTABLE_PATH_PREFIXES, m as resolveMenuDefaultIcon, n as hasRemoteSettingFetched, o as safeSetDotted, r as loadConfig, s as CONFIG_VERSION_CHANGE_EVENT, t as getRemoteSettingList, u as getStorageKey, v as normalizeTopKey } from "./src-DzQcKxHP.js";
import { B as getLayoutCache, C as setDefaultHttpInstance, G as setMenuCache, H as getUserInfo, L as getAccessToken, M as clearAllAuthData, Q as axios, R as getFrameworkStorage, V as getMenuCache, W as setLayoutCache, X as fetchEventSource, b as createHttp, et as browserLocalStorage, f as encodeRequestBody, h as log, nt as createStorage } from "./src-DDwlSqPX.js";
import { n as createWebHashHistory, r as createWebHistory, t as createRouter } from "./vue-router-D43uXGPs.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/notification/src/notification.mjs
var notificationTypes = [
	"primary",
	"success",
	"info",
	"warning",
	"error"
];
/**
* @deprecated Removed after 3.0.0, Use `NotificationProps` instead.
*/
var notificationProps = buildProps({
	/**
	* @description custom class name for Notification
	*/
	customClass: {
		type: String,
		default: ""
	},
	/**
	* @description whether `message` is treated as HTML string
	*/
	dangerouslyUseHTMLString: Boolean,
	/**
	* @description duration before close. It will not automatically close if set 0
	*/
	duration: {
		type: Number,
		default: 4500
	},
	/**
	* @description custom icon component. It will be overridden by `type`
	*/
	icon: { type: iconPropType },
	/**
	* @description notification dom id
	*/
	id: {
		type: String,
		default: ""
	},
	/**
	* @description description text
	*/
	message: {
		type: definePropType([
			String,
			Object,
			Function
		]),
		default: ""
	},
	/**
	* @description offset from the top edge of the screen. Every Notification instance of the same moment should have the same offset
	*/
	offset: {
		type: Number,
		default: 0
	},
	/**
	* @description callback function when notification clicked
	*/
	onClick: {
		type: definePropType(Function),
		default: () => void 0
	},
	/**
	* @description callback function when closed
	*/
	onClose: {
		type: definePropType(Function),
		required: true
	},
	/**
	* @description custom position
	*/
	position: {
		type: String,
		values: [
			"top-right",
			"top-left",
			"bottom-right",
			"bottom-left"
		],
		default: "top-right"
	},
	/**
	* @description whether to show a close button
	*/
	showClose: {
		type: Boolean,
		default: true
	},
	/**
	* @description title
	*/
	title: {
		type: String,
		default: ""
	},
	/**
	* @description notification type
	*/
	type: {
		type: String,
		values: [...notificationTypes, ""],
		default: ""
	},
	/**
	* @description initial zIndex
	*/
	zIndex: Number,
	/**
	* @description custom close icon, default is Close
	*/
	closeIcon: {
		type: iconPropType,
		default: close_default
	}
});
var notificationEmits = { destroy: () => true };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/notification/src/notification.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["id"];
var _hoisted_2 = ["textContent"];
var _hoisted_3 = { key: 0 };
var _hoisted_4 = ["innerHTML"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/notification/src/notification2.mjs
var notification_default = /* @__PURE__ */ defineComponent({
	name: "ElNotification",
	__name: "notification",
	props: notificationProps,
	emits: notificationEmits,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const { ns, zIndex } = useGlobalComponentSettings("notification");
		const { nextZIndex, currentZIndex } = zIndex;
		const visible = ref(false);
		let timer = void 0;
		const typeClass = computed(() => {
			const type = props.type;
			return type && TypeComponentsMap[props.type] ? ns.m(type) : "";
		});
		const iconComponent = computed(() => {
			if (!props.type) return props.icon;
			return TypeComponentsMap[props.type] || props.icon;
		});
		const horizontalClass = computed(() => props.position.endsWith("right") ? "right" : "left");
		const verticalProperty = computed(() => props.position.startsWith("top") ? "top" : "bottom");
		const positionStyle = computed(() => {
			return {
				[verticalProperty.value]: `${props.offset}px`,
				zIndex: props.zIndex ?? currentZIndex.value
			};
		});
		function startTimer() {
			if (props.duration > 0) ({stop: timer} = useTimeoutFn(() => {
				if (visible.value) close();
			}, props.duration));
		}
		function clearTimer() {
			timer?.();
		}
		function close() {
			visible.value = false;
		}
		function onKeydown(event) {
			switch (getEventCode(event)) {
				case EVENT_CODE.delete:
				case EVENT_CODE.backspace:
					clearTimer();
					break;
				case EVENT_CODE.esc:
					if (visible.value) close();
					break;
				default: startTimer();
			}
		}
		onMounted(() => {
			startTimer();
			nextZIndex();
			visible.value = true;
		});
		useEventListener(document, "keydown", onKeydown);
		__expose({
			visible,
			/** @description close notification */
			close
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Transition, {
				name: unref(ns).b("fade"),
				onBeforeLeave: __props.onClose,
				onAfterLeave: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("destroy")),
				persisted: ""
			}, {
				default: withCtx(() => [withDirectives(createBaseVNode("div", {
					id: __props.id,
					class: normalizeClass([
						unref(ns).b(),
						__props.customClass,
						horizontalClass.value
					]),
					style: normalizeStyle(positionStyle.value),
					role: "alert",
					onMouseenter: clearTimer,
					onMouseleave: startTimer,
					onClick: _cache[0] || (_cache[0] = (...args) => __props.onClick && __props.onClick(...args))
				}, [iconComponent.value ? (openBlock(), createBlock(unref(ElIcon), {
					key: 0,
					class: normalizeClass([unref(ns).e("icon"), typeClass.value])
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(iconComponent.value)))]),
					_: 1
				}, 8, ["class"])) : createCommentVNode("v-if", true), createBaseVNode("div", { class: normalizeClass(unref(ns).e("group")) }, [
					createBaseVNode("h2", {
						class: normalizeClass(unref(ns).e("title")),
						textContent: toDisplayString(__props.title)
					}, null, 10, _hoisted_2),
					withDirectives(createBaseVNode("div", {
						class: normalizeClass(unref(ns).e("content")),
						style: normalizeStyle(!!__props.title ? void 0 : { margin: 0 })
					}, [renderSlot(_ctx.$slots, "default", {}, () => [!__props.dangerouslyUseHTMLString ? (openBlock(), createElementBlock("p", _hoisted_3, toDisplayString(__props.message), 1)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createCommentVNode(" Caution here, message could've been compromised, never use user's input as message "), createBaseVNode("p", { innerHTML: __props.message }, null, 8, _hoisted_4)], 2112))])], 6), [[vShow, __props.message]]),
					__props.showClose ? (openBlock(), createBlock(unref(ElIcon), {
						key: 0,
						class: normalizeClass(unref(ns).e("closeBtn")),
						onClick: withModifiers(close, ["stop"])
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.closeIcon)))]),
						_: 1
					}, 8, ["class"])) : createCommentVNode("v-if", true)
				], 2)], 46, _hoisted_1), [[vShow, visible.value]])]),
				_: 3
			}, 8, ["name", "onBeforeLeave"]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/notification/src/notify.mjs
var notifications = {
	"top-left": [],
	"top-right": [],
	"bottom-left": [],
	"bottom-right": []
};
var GAP_SIZE = 16;
var seed = 1;
var notify = function(options = {}, context) {
	if (!isClient) return { close: () => void 0 };
	if (isString(options) || isVNode(options)) options = { message: options };
	const position = options.position || "top-right";
	let verticalOffset = options.offset || 0;
	notifications[position].forEach(({ vm }) => {
		verticalOffset += (vm.el?.offsetHeight || 0) + GAP_SIZE;
	});
	verticalOffset += GAP_SIZE;
	const id = `notification_${seed++}`;
	const userOnClose = options.onClose;
	const props = {
		...options,
		offset: verticalOffset,
		id,
		onClose: () => {
			close(id, position, userOnClose);
		}
	};
	let appendTo = document.body;
	if (isElement(options.appendTo)) appendTo = options.appendTo;
	else if (isString(options.appendTo)) appendTo = document.querySelector(options.appendTo);
	if (!isElement(appendTo)) {
		debugWarn("ElNotification", "the appendTo option is not an HTMLElement. Falling back to document.body.");
		appendTo = document.body;
	}
	const container = document.createElement("div");
	const vm = createVNode(notification_default, props, isFunction(props.message) ? props.message : isVNode(props.message) ? () => props.message : null);
	vm.appContext = isUndefined(context) ? notify._context : context;
	vm.props.onDestroy = () => {
		render(null, container);
	};
	render(vm, container);
	notifications[position].push({ vm });
	appendTo.appendChild(container.firstElementChild);
	return { close: () => {
		vm.component.exposed.visible.value = false;
	} };
};
notificationTypes.forEach((type) => {
	notify[type] = (options = {}, appContext) => {
		if (isString(options) || isVNode(options)) options = { message: options };
		return notify({
			...options,
			type
		}, appContext);
	};
});
/**
* This function gets called when user click `x` button or press `esc` or the time reached its limitation.
* Emitted by transition@before-leave event so that we can fetch the current notification.offsetHeight, if this was called
* by @after-leave the DOM element will be removed from the page thus we can no longer fetch the offsetHeight.
* @param {String} id notification id to be closed
* @param {Position} position the positioning strategy
* @param {Function} userOnClose the callback called when close passed by user
*/
function close(id, position, userOnClose) {
	const orientedNotifications = notifications[position];
	const idx = orientedNotifications.findIndex(({ vm }) => vm.component?.props.id === id);
	if (idx === -1) return;
	const { vm } = orientedNotifications[idx];
	if (!vm) return;
	userOnClose?.(vm);
	const removedHeight = vm.el.offsetHeight;
	const verticalPos = position.split("-")[0];
	orientedNotifications.splice(idx, 1);
	const len = orientedNotifications.length;
	if (len < 1) return;
	for (let i = idx; i < len; i++) {
		const { el, component } = orientedNotifications[i].vm;
		const pos = Number.parseInt(el.style[verticalPos], 10) - removedHeight - GAP_SIZE;
		component.props.offset = pos;
	}
}
function closeAll() {
	for (const orientedNotifications of Object.values(notifications)) orientedNotifications.forEach(({ vm }) => {
		vm.component.exposed.visible.value = false;
	});
}
function updateOffsets(position = "top-right") {
	let verticalOffset = notifications[position][0]?.vm.component?.props?.offset || 0;
	for (const { vm } of notifications[position]) {
		vm.component.props.offset = verticalOffset;
		verticalOffset += (vm.el?.offsetHeight || 0) + GAP_SIZE;
	}
}
notify.closeAll = closeAll;
notify.updateOffsets = updateOffsets;
notify._context = null;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/notification/index.mjs
var ElNotification = withInstallFunction(notify, "$notify");
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
//#region ../../packages/core/src/crypto/SystemException.ts
/**
* 系统异常 —— createApp 链路上不可恢复的错误
*
* 依据失败策略：
* - wasm 加密模块加载失败 → 抛 SystemException（链路中断）
* - app.yaml 加载失败 → 使用默认配置（不抛）
* - 主题等其它系统配置加载失败 → 抛 SystemException
*/
var SystemException = class extends Error {
	cause;
	constructor(message, cause) {
		super(message);
		this.cause = cause;
		this.name = "SystemException";
	}
};
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
	return ({
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": false,
		"VITE_APP_ENV_CONFIGS": "",
		"VITE_APP_NAME": "vue-support-monitor-starter",
		"VITE_WEB_TITLE": "监控管理平台"
	}.BASE_URL ?? "/").replace(/\/+$/, "");
}
var DEFAULT_CRYPTO_URL = `${resolveBaseUrl()}/wasm/crypto-wasm.js`;
/**
* 通过 fetch + Blob URL 加载并初始化 wasm-bindgen 产物。
* 产物导出结构：default（__wbg_init）为异步初始化入口，initSync 为同步初始化入口。
* @param url 产物 JS 的 URL（部署到子路径时相对当前 origin 请求）
*/
async function loadCryptoFromUrl(url) {
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
	const code = await res.text();
	const wasmUrl = url.replace(/\.js$/, "_bg.wasm");
	const blobUrl = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
	let mod;
	try {
		mod = await __vitePreload(() => import(
			/* @vite-ignore */
			blobUrl
), []);
	} finally {
		URL.revokeObjectURL(blobUrl);
	}
	const init = mod.default;
	if (typeof init === "function") await init({ module_or_path: wasmUrl });
	else if (typeof mod.initSync === "function") {
		const wasmRes = await fetch(wasmUrl, { cache: "no-store" });
		mod.initSync(await wasmRes.arrayBuffer());
	} else throw new Error("加载到的模块缺少 init 入口");
	return mod;
}
/**
* 加载并初始化加密模块
* @throws SystemException 加载或初始化失败时
*/
async function loadCrypto(options = {}) {
	if (options.loader) try {
		return await options.loader();
	} catch (e) {
		throw new SystemException("自定义加密模块加载失败", e);
	}
	const url = options.url ?? DEFAULT_CRYPTO_URL;
	try {
		const mod = await loadCryptoFromUrl(url);
		const missing = [
			"aesEncrypt",
			"aesDecrypt",
			"aesVariantEncrypt",
			"aesVariantDecrypt",
			"sm2GenerateKeyPair",
			"sm2Encrypt",
			"sm2Decrypt",
			"sm3",
			"md5",
			"sm4Encrypt",
			"sm4Decrypt",
			"generateNonce",
			"signRequest",
			"encryptBody",
			"decodeBody"
		].filter((m) => typeof mod[m] !== "function");
		if (missing.length > 0) throw new Error(`加载到的模块不是合法的加密模块（缺少方法: ${missing.join(", ")}）`);
		return mod;
	} catch (e) {
		throw new SystemException(`加载 wasm 加密模块失败: ${url}`, e);
	}
}
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
/** 存储中的用户信息 key */
var USER_INFO_KEY = "userInfo";
var RANK = {
	user: 1,
	admin: 2,
	superadmin: 3
};
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
/** 从用户信息同步角色与权限码（roles 优先，其次 role 单角色；perms 优先，其次 perm 单权限） */
function syncUserPerm(user) {
	setUserRoles(user?.roles?.length ? user.roles : user?.role ? [user.role] : []);
	setUserPerms(user?.perms?.length ? user.perms : user?.perm ? [user.perm] : []);
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
/** 当前用户是否为超级管理员 */
function isSuperadmin() {
	return hasRole(getSuperadminRole());
}
/** 当前用户最高权限等级 */
function getUserPermission() {
	if (isSuperadmin()) return "superadmin";
	if (isAdmin()) return "admin";
	return "user";
}
/**
* 检查是否允许访问指定权限等级的内容。
*
* 用法 1（运行时基于登录用户）：
*   canAccess("admin")                                              // 当前登录用户是否能看 admin 内容
* 用法 2（显式传入当前用户权限，用于过滤目录/UI）：
*   canAccess("admin", "user")                                      // user 用户不能看 admin 内容
*
* 角色字面量从 app.yaml permissionConfig 读取，调用方不写死。
*/
function canAccess(required, userPermission) {
	return RANK[userPermission ?? getUserPermission()] >= RANK[required];
}
//#endregion
//#region ../../packages/core/src/api/stationMessage.ts
/**
* 站内消息 HTTP 适配器（@repo/core）
*
* 将后端「当前用户站内消息」接口封装为 useStationMessage / useMessageStore
* 所需的 StationMessageAdapter（loadHistory / getUnreadCount / markRead）。
* 接口地址从 getConfig().message 读取（listUrl / unreadUrl / readUrl），
* 不依赖 Socket；前端拉取历史与未读、标记已读全部走 HTTP。
*
* 用法：
*   // 全局注册（createApp 时调用一次）
*   initStationMessageAdapter();
*   // 任意处取用
*   const adapter = getStationMessageAdapter();
*   await adapter?.loadHistory({ page: 1, pageSize: 20 });
*/
/** 站内消息请求短超时（毫秒）：这些请求只服务铃铛/浮窗，不应拖慢页面 */
var STATION_MESSAGE_TIMEOUT = 8e3;
/** 站内消息适配器实例 */
var stationMessageAdapter = null;
/**
* 构建站内消息 HTTP 适配器
*
* 后端返回统一 { code, data } 包装；分页接口 data 为 { data: [], total }。
*/
function initStationMessageAdapter() {
	if (stationMessageAdapter) return stationMessageAdapter;
	const cfg = getConfig().message;
	const http = getApiHttp();
	stationMessageAdapter = {
		/** 分页拉取历史消息；返回列表 + 服务端未读总数（短超时，避免拖慢页面） */
		async loadHistory(params) {
			try {
				const page = (await http.get(cfg.listUrl).timeout(STATION_MESSAGE_TIMEOUT).query({
					page: params?.page ?? 1,
					pageSize: params?.pageSize ?? 20,
					...params?.cursor !== void 0 ? { cursor: params.cursor } : {}
				}).then((r) => r.data))?.data;
				return {
					list: (page?.data ?? []).map(toStationMessage),
					total: page?.total
				};
			} catch {
				return { list: [] };
			}
		},
		/** 未读数（短超时，避免拖慢页面） */
		async getUnreadCount() {
			try {
				const res = await http.get(cfg.unreadUrl).timeout(STATION_MESSAGE_TIMEOUT).then((r) => r.data);
				return typeof res?.data === "number" ? res.data : 0;
			} catch {
				return 0;
			}
		},
		/** 标记已读（lastId 为空表示全部已读；短超时，避免拖慢页面） */
		async markRead(lastId) {
			try {
				await http.put(cfg.readUrl).timeout(STATION_MESSAGE_TIMEOUT).query(lastId !== void 0 ? { lastId } : {}).then((r) => r.data);
			} catch {}
		}
	};
	return stationMessageAdapter;
}
/** 获取全局站内消息适配器（未初始化返回 null） */
function getStationMessageAdapter() {
	return stationMessageAdapter;
}
/** 后端站内消息项 → 前端 StationMessage 结构 */
function toStationMessage(item) {
	return {
		id: item.id,
		subject: item.subject,
		content: item.content,
		sendTime: item.sendTime,
		readStatus: item.readStatus,
		isRead: item.readStatus === 1,
		...item
	};
}
//#endregion
//#region ../../packages/core/src/api/capability.ts
/**
* 业务能力注册表（@repo/core）
*
* 顶栏天气 / 定位 / 台风 / IP 归属地这类"后台可选增强"能力的统一登记处：
* 一个能力 = 一个 key + 后台接口路径 + 抽屉文案前缀。新增能力只需在此登记一条，
* 探测（backendProbe）、入口显隐（koi 顶栏）、设置抽屉开关、app.yaml 配置都自动生效，
* 不必再改任何调用点。
*
* 开关语义（app.yaml `other.capabilities.<key>`）：
*   - 未配置 / true：启用。先 HEAD 探测后台接口，命中走后台，未命中回落三方；
*   - false：停用。不发探测、不请求后台（后台没有该接口时避免每轮 404 噪音），
*     且对应前端入口一并隐藏。
*
* 部署侧（app.yaml）写 false 的能力，主题配置抽屉里不再显示该项；
* 用户自己在抽屉里关掉的项仍显示，可再次打开。
*/
/** 后台天气总览接口 */
var WEATHER_OVERVIEW_PATH = "/v2/weather/overview";
/** 后台定位解析接口（按客户端 IP / 坐标反查城市） */
var LOCATION_RESOLVE_PATH = "/v2/location/resolve";
/** 后台活跃台风列表接口 */
var TYPHOON_ACTIVE_PATH = "/v2/typhoon/active";
/** 后台单台风详情接口 */
var TYPHOON_DETAIL_PATH = "/v2/typhoon/detail";
/** 后台 IP 归属地（IP 转物理地址）查询接口 */
var IP_LOOKUP_PATH = "/v2/ip/lookup";
/**
* 后台节假日列表接口。
*
* <p>取日历的年度放假安排与补班日。路径取自
* {@code SysHolidayController}（{@code @RequestMapping("/v2/holiday")}
* + {@code @GetMapping("/get")}）。</p>
*/
var HOLIDAY_LIST_PATH = "/v2/holiday/get";
/** 已登记的业务能力（顺序即抽屉展示顺序） */
var BACKEND_CAPABILITIES = [
	{
		key: "weather",
		path: WEATHER_OVERVIEW_PATH,
		probe: true,
		i18n: "weather"
	},
	{
		key: "location",
		path: LOCATION_RESOLVE_PATH,
		probe: true,
		i18n: "location"
	},
	{
		key: "typhoon",
		path: TYPHOON_ACTIVE_PATH,
		probe: true,
		i18n: "typhoon"
	},
	{
		key: "ipLookup",
		path: IP_LOOKUP_PATH,
		probe: false,
		i18n: "ipLookup"
	},
	{
		key: "holiday",
		path: HOLIDAY_LIST_PATH,
		probe: true,
		i18n: "holiday"
	}
];
/** 按接口路径反查所属能力（未登记返回 null，表示该路径不受能力开关约束） */
function capabilityOfPath(path) {
	return BACKEND_CAPABILITIES.find((item) => item.path === path) ?? null;
}
/**
* 判断某个接口路径所属能力当前是否启用。
*
* 未登记能力的路径恒为启用（保持既有行为），登记过的按 app.yaml 开关判定。
*
* @param path 后台接口路径
* @returns 是否允许对该路径发起后台请求
*/
function isCapabilityPathEnabled(path) {
	const capability = capabilityOfPath(path);
	return capability ? isCapabilityEnabled(capability.key) : true;
}
//#endregion
//#region ../../packages/core/src/api/backendProbe.ts
/**
* 后台能力探测 —— 用 HEAD 判断某个后台接口是否已经实现
*
* 顶栏天气/台风这类"平台可选增强"的能力，前端不假设后台一定提供：
* 先 HEAD 探测，命中则走后台接口（数据与鉴权都由本系统掌控），
* 未命中则回落到三方数据源，并把三方响应归一化成后台的同一套结构。
*
* 判定口径：
*  - 能力开关关闭（app.yaml other.capabilities）→ 直接判定未实现，连请求都不发
*  - 2xx / 3xx                    → 已实现（Spring MVC 的 @GetMapping 自动接受 HEAD）
*  - 400 / 405 / 415 / 422        → 已实现（路径有映射，只是不接受本次 HEAD 的参数/方法）
*  - 401 / 403                    → 视为未实现（接口未开放匿名访问，走后台同样取不到数据）
*  - 404 / 5xx / 网络异常          → 未实现，走三方兜底
*
* 探测结果按路径缓存（默认 10 分钟），同一路径的并发探测共享一次请求。
* 后台补齐接口后最迟一个缓存周期自动切换，前端无需改动。
* 能力开关不缓存：每次调用都实时判定，改配置后立即生效。
*/
/** 探测超时（ms）：探测在关键渲染路径上，必须短 */
var PROBE_TIMEOUT = 3e3;
/** 结果缓存有效期（ms） */
var PROBE_TTL = 6e5;
/** 路径已映射、只是不接受本次 HEAD 的状态码：同样判定为"后台已实现" */
var MAPPED_STATUS = /* @__PURE__ */ new Set([
	400,
	405,
	415,
	422
]);
var probeCache = /* @__PURE__ */ new Map();
var probeInflight = /* @__PURE__ */ new Map();
/** 相对路径拼上 http.baseUrl，得到与 http() 一致的目标地址 */
function resolveProbeUrl(path) {
	if (/^https?:\/\//i.test(path)) return path;
	return `${(getConfig().http.baseUrl ?? "").replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
/**
* 探测后台是否提供指定接口。
*
* @param path 接口路径（相对 http.baseUrl）
* @param ttl 结果缓存有效期（ms），默认 10 分钟
*/
function probeBackend(path, ttl = PROBE_TTL) {
	const capability = capabilityOfPath(path);
	if (capability && !isCapabilityEnabled(capability.key)) return Promise.resolve(false);
	const hit = probeCache.get(path);
	if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.available);
	const pending = probeInflight.get(path);
	if (pending) return pending;
	const run = (async () => {
		try {
			const res = await fetch(resolveProbeUrl(path), {
				method: "HEAD",
				cache: "no-store",
				signal: AbortSignal.timeout(PROBE_TIMEOUT)
			});
			const available = res.status >= 200 && res.status < 400 || MAPPED_STATUS.has(res.status);
			probeCache.set(path, {
				available,
				at: Date.now()
			});
			return available;
		} catch {
			probeCache.set(path, {
				available: false,
				at: Date.now()
			});
			return false;
		}
	})();
	probeInflight.set(path, run);
	run.finally(() => {
		if (probeInflight.get(path) === run) probeInflight.delete(path);
	});
	return run;
}
//#endregion
//#region ../../packages/core/src/api/weather.ts
/**
* 天气 / 定位 API 封装（@repo/core）
*
* 数据来源两条链路，产出同一套结构（本系统的契约，UI 只认这套字段）：
*   ① 后台接口：启动期 HEAD 探测 /v2/weather/overview，命中则走后台
*      —— 三方调用、缓存、字段口径都由后台统一收口；
*   ② 后台未实现时：浏览器直连三方（Open-Meteo 及其地理编码服务），
*      在本文件里归一化成同一套 WeatherOverview，由 source 标明来源。
*
* 三方请求不走项目 http 拦截器（跨域公开接口，无需签名/加密），用原生 fetch + 超时。
* dev 期若应用配了 /weather-api、/geo-api 等代理前缀，会优先用代理（免跨域、可走内网），
* 代理不存在时自动退回直连。
*/
/** 三方兜底默认预报天数 */
var DEFAULT_DAYS = 7;
/** 三方兜底默认逐小时点数 */
var DEFAULT_HOURS = 24;
/** 三方请求超时（ms） */
var THIRD_PARTY_TIMEOUT = 8e3;
/** Open-Meteo 预报接口（代理前缀优先，其次直连） */
var OPEN_METEO_CANDIDATES = ["/weather-api", "https://api.open-meteo.com"];
/** Open-Meteo 地理编码接口 */
var GEOCODING_CANDIDATES = ["https://geocoding-api.open-meteo.com"];
/** BigDataCloud 反向地理编码（浏览器定位 → 城市名） */
var REVERSE_GEO_CANDIDATES = ["/geo-api", "https://api.bigdatacloud.net"];
/** freeipapi IP 定位 */
var FREE_IP_CANDIDATES = ["/freeip-api", "https://freeipapi.com"];
/** ip-api IP 定位（免费版仅 HTTP，HTTPS 页面下会被混合内容拦截） */
var IP_API_CANDIDATES = ["/ip-api", "http://ip-api.com"];
/** 数值兜底：非有限值取 fallback */
function num(value, fallback = 0) {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}
/** 数组兜底：非数组返回空数组 */
function arr$1(value) {
	return Array.isArray(value) ? value : [];
}
/**
* 依次尝试多个基地址，返回第一个成功响应的 JSON。
*
* 先试 vite 代理前缀（配了就走，免跨域），404/网络错误再试直连域名。
*/
async function fetchJson$1(candidates, path) {
	let lastError = null;
	for (const base of candidates) try {
		const res = await fetch(`${base}${path}`, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(THIRD_PARTY_TIMEOUT)
		});
		if (!res.ok) {
			lastError = /* @__PURE__ */ new Error(`http ${res.status}`);
			continue;
		}
		return await res.json();
	} catch (error) {
		lastError = error;
	}
	throw lastError ?? /* @__PURE__ */ new Error("[weather] 三方数据源全部不可用");
}
/** Open-Meteo 响应 → WeatherOverview（缺字段按 0 兜底，保证 UI 拿到的字段齐全） */
function toOverview(raw, fallbackLocation, lat, lon) {
	const current = raw?.current ?? {};
	const hourly = raw?.hourly ?? {};
	const daily = raw?.daily ?? {};
	const hourlyList = arr$1(hourly.time).map((time, i) => ({
		time: String(time),
		weatherCode: num(hourly.weather_code?.[i]),
		temperature: num(hourly.temperature_2m?.[i]),
		feelsLike: num(hourly.apparent_temperature?.[i]),
		humidity: num(hourly.relative_humidity_2m?.[i]),
		windSpeed: num(hourly.wind_speed_10m?.[i]),
		windDirection: num(hourly.wind_direction_10m?.[i]),
		precipitation: num(hourly.precipitation?.[i]),
		precipitationProbability: num(hourly.precipitation_probability?.[i])
	}));
	const dailyList = arr$1(daily.time).map((date, i) => ({
		date: String(date),
		weatherCode: num(daily.weather_code?.[i]),
		tempMax: num(daily.temperature_2m_max?.[i]),
		tempMin: num(daily.temperature_2m_min?.[i]),
		feelsMax: num(daily.apparent_temperature_max?.[i] ?? daily.temperature_2m_max?.[i]),
		feelsMin: num(daily.apparent_temperature_min?.[i] ?? daily.temperature_2m_min?.[i]),
		precipitation: num(daily.precipitation_sum?.[i]),
		precipitationProbability: num(daily.precipitation_probability_max?.[i]),
		windSpeed: num(daily.wind_speed_10m_max?.[i]),
		windDirection: num(daily.wind_direction_10m_dominant?.[i]),
		uvIndex: num(daily.uv_index_max?.[i]),
		sunrise: String(daily.sunrise?.[i] ?? "").slice(11, 16),
		sunset: String(daily.sunset?.[i] ?? "").slice(11, 16)
	}));
	return {
		location: String(raw?.resolvedCity ?? raw?.city ?? fallbackLocation ?? "本地"),
		latitude: num(raw?.latitude, lat),
		longitude: num(raw?.longitude, lon),
		weatherCode: num(current.weather_code),
		temperature: num(current.temperature_2m),
		feelsLike: num(current.apparent_temperature),
		humidity: num(current.relative_humidity_2m),
		windSpeed: num(current.wind_speed_10m),
		windDirection: num(current.wind_direction_10m),
		pressure: num(current.pressure_msl),
		observedAt: String(current.time ?? (/* @__PURE__ */ new Date()).toISOString()),
		hourly: hourlyList,
		daily: dailyList,
		source: "open-meteo-direct"
	};
}
/** 逐小时参数串（Open-Meteo） */
var HOURLY_FIELDS = "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability";
/** 逐日参数串（Open-Meteo） */
var DAILY_FIELDS = "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset";
/**
* 三方兜底：按坐标（或城市解析出的坐标）向 Open-Meteo 取实况 + 逐小时 + 逐日。
*
* 逐小时窗口按"当前时刻起算"截取 hours 个点：Open-Meteo 从当日 00:00 开始返回，
* 直接取前 N 个会把过去的时段当作预报展示。
*/
async function fetchOverviewFromThirdParty(query) {
	let lat = num(query.latitude);
	let lon = num(query.longitude);
	let city = query.city?.trim() ?? "";
	if (!lat && !lon && city) {
		const first = arr$1((await fetchJson$1(GEOCODING_CANDIDATES, `/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`))?.results)[0];
		if (!first) throw new Error(`[weather] 无法解析城市：${city}`);
		lat = num(first.latitude);
		lon = num(first.longitude);
		city = String(first.name ?? city);
	}
	const days = query.days ?? DEFAULT_DAYS;
	const hours = query.hours ?? DEFAULT_HOURS;
	const raw = await fetchJson$1(OPEN_METEO_CANDIDATES, `/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl&hourly=${HOURLY_FIELDS}&daily=${DAILY_FIELDS}&forecast_days=${days}&timezone=auto`);
	const overview = toOverview(raw, city || "本地", lat, lon);
	const offsetSeconds = num(raw?.utc_offset_seconds);
	const nowLocalHour = new Date(Date.now() + offsetSeconds * 1e3).toISOString().slice(0, 13);
	const future = overview.hourly.filter((h) => h.time.slice(0, 13) >= nowLocalHour);
	overview.hourly = (future.length ? future : overview.hourly).slice(0, hours);
	return overview;
}
/**
* 获取天气总览。
*
* 后台已实现（HEAD 探测命中）→ GET /v2/weather/overview；
* 否则直连三方并归一化。两条链路都失败时抛出最后一个错误，由调用方决定空态展示。
*/
async function getWeatherOverview(query = {}) {
	if (await probeBackend("/v2/weather/overview")) try {
		const res = await http().get(WEATHER_OVERVIEW_PATH).query(query).then((r) => r.data);
		if (res?.data) return normalizeBackendOverview(res.data);
		log.warn("weather", "后台返回空数据，回落三方");
	} catch (error) {
		log.warn("weather", "后台天气接口失败，回落三方", error);
	}
	return fetchOverviewFromThirdParty(query);
}
/** 后台返回的结构补齐缺省字段（数组/数值），保证 UI 消费端无需逐字段判空 */
function normalizeBackendOverview(data) {
	return {
		...data,
		location: String(data.location ?? "本地"),
		hourly: arr$1(data.hourly),
		daily: arr$1(data.daily),
		source: data.source || "backend"
	};
}
/** 读取浏览器定位（失败/超时返回 null） */
function locateInBrowser() {
	return new Promise((resolve) => {
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			resolve(null);
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => resolve({
			latitude: pos.coords.latitude,
			longitude: pos.coords.longitude
		}), () => resolve(null), {
			enableHighAccuracy: false,
			timeout: 5e3,
			maximumAge: 6e5
		});
	});
}
/** 按坐标反查城市名（BigDataCloud），失败时返回占位名 */
async function reverseGeocode(lat, lon) {
	try {
		const g = await fetchJson$1(REVERSE_GEO_CANDIDATES, `/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
		return String(g?.city || g?.locality || g?.principalSubdivision || "本地");
	} catch {
		return "本地";
	}
}
/**
* IP 定位兜底：按一组候选基地址请求，字段名由调用方传入
* （freeipapi 用 latitude/longitude/cityName，ip-api 用 lat/lon/city）。
* 拿到非法坐标或请求失败时返回 null，由调用方继续下一个兜底源。
*/
async function locateByIp(candidates, path, latField, lonField, cityField) {
	try {
		const d = await fetchJson$1(candidates, path);
		const latitude = num(d?.[latField]);
		const longitude = num(d?.[lonField]);
		if (!latitude || !longitude) return null;
		return {
			latitude,
			longitude,
			city: String(d?.[cityField] ?? "本地"),
			source: "ip"
		};
	} catch {
		return null;
	}
}
/**
* 解析展示用定位。
*
* 链路：后台（按客户端 IP 服务端解析）→ 浏览器定位 → IP 定位 → app.yaml 配置的经纬度。
* 前三步都是"能拿到就用"，最后一步缺配置则抛错，由调用方展示空态。
*/
async function resolveGeoLocation() {
	const weather = getConfig().other.weather;
	if (await probeBackend("/v2/location/resolve")) try {
		const data = (await http().get(LOCATION_RESOLVE_PATH).then((r) => r.data))?.data;
		if (data && (data.latitude || data.longitude)) return {
			latitude: num(data.latitude),
			longitude: num(data.longitude),
			city: String(data.city || "本地"),
			source: data.source || "backend"
		};
	} catch (error) {
		log.warn("weather", "后台定位接口失败，回落前端定位", error);
	}
	const browser = await locateInBrowser();
	if (browser) return {
		latitude: browser.latitude,
		longitude: browser.longitude,
		city: await reverseGeocode(browser.latitude, browser.longitude),
		source: "browser"
	};
	const freeIp = await locateByIp(FREE_IP_CANDIDATES, "/api/json/", "latitude", "longitude", "cityName");
	if (freeIp) return freeIp;
	const ipApi = await locateByIp(IP_API_CANDIDATES, "/json/?lang=zh-CN&fields=lat,lon,city", "lat", "lon", "city");
	if (ipApi) return ipApi;
	const lat = num(weather.latitude);
	const lon = num(weather.longitude);
	if (!lat || !lon) throw new Error("[weather] 后台未提供定位接口且未配置 weather 经纬度");
	return {
		latitude: lat,
		longitude: lon,
		city: weather.city || "本地",
		source: "config"
	};
}
//#endregion
//#region ../../packages/core/src/api/typhoon.ts
/**
* 台风 API 封装（@repo/core）
*
* 与天气同构：本系统自有契约（TyphoonItem / TrackPoint / TyphoonDetail），
* UI 只认这套字段，不再关心数据来源。
*
*   ① 后台接口：HEAD 探测 /v2/typhoon/active、/v2/typhoon/detail，命中则走后台
*      —— 三方调用、缓存、字段口径由后台收口；
*   ② 后台未实现时：浏览器直连浙江省水利厅台风网（typhoon.slt.zj.gov.cn/Api），
*      在本文件里归一化成同一套契约，由 source 标明来源。
*
* 三方是外部政府接口，不走项目 http 拦截器（无需签名/加密），用原生 fetch + 超时。
* dev 期若应用配了 /typhoon-api 代理前缀会优先走代理（免跨域），否则直连。
*/
/** 三方请求超时（ms） */
var TYPHOON_TIMEOUT = 1e4;
/** 浙水利台风接口（代理前缀优先，其次直连） */
var TYPHOON_CANDIDATES = ["/typhoon-api", "https://typhoon.slt.zj.gov.cn/Api"];
/** 安全转数字，非有限值返回 undefined */
function numOr(value) {
	const n = Number(value);
	return Number.isFinite(n) ? n : void 0;
}
/** 数组兜底：非数组返回空数组 */
function arr(value) {
	return Array.isArray(value) ? value : [];
}
/**
* 依次尝试多个基地址，返回第一个成功响应的 JSON。
* 先试 vite 代理前缀（配了就走，免跨域），失败再试直连域名。
*/
async function fetchJson(candidates, path) {
	let lastError = null;
	for (const base of candidates) try {
		const res = await fetch(`${base}${path}`, {
			method: "GET",
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(TYPHOON_TIMEOUT)
		});
		if (!res.ok) {
			lastError = /* @__PURE__ */ new Error(`http ${res.status}`);
			continue;
		}
		return await res.json();
	} catch (error) {
		lastError = error;
	}
	throw lastError ?? /* @__PURE__ */ new Error("[typhoon] 三方数据源全部不可用");
}
/**
* 从台风点数据中提取某级风圈的四方位半径数组 [NE, SE, SW, NW]。
*
* 兼容多种字段形态（后台若已归一化成数组也会走同一分支）：
*  - `radius7: "250|150|250|150"`（管道分隔 4 段 = 东北|东南|西南|西北）
*  - `radius7: [NE,SE,SW,NW]`（数组）
*  - `radius7: 80`（单一数值，四方向同半径）
*  - `r7NE / r7SE / r7SW / r7NW`（四方向分开字段）
*
* @param p     原始点对象
* @param level 风圈等级："7" 或 "10"
* @returns 四方位半径数组；全部缺失返回 undefined
*/
function pickRadii(p, level) {
	const raw = p?.[`radius${level}`] ?? p?.[`r${level}`];
	if (Array.isArray(raw)) {
		if (!raw.length) return void 0;
		const [ne = 0, se = 0, sw = 0, nw = 0] = raw.map((v) => Number(v) || 0);
		if (!(ne || se || sw || nw)) return void 0;
		return [
			ne,
			se,
			sw,
			nw
		];
	}
	if (typeof raw === "string" && raw.includes("|")) {
		const parts = raw.split("|").map((v) => Number(v.trim()));
		const ne = parts[0] ?? 0;
		const se = parts[1] ?? 0;
		const sw = parts[2] ?? 0;
		const nw = parts[3] ?? 0;
		if (!(ne || se || sw || nw)) return void 0;
		return [
			ne,
			se,
			sw,
			nw
		];
	}
	if (typeof raw === "number" || typeof raw === "string" && raw.trim() !== "") {
		const v = Number(raw);
		if (!Number.isFinite(v) || v <= 0) return void 0;
		return [
			v,
			v,
			v,
			v
		];
	}
	const ne = Number(p?.[`r${level}NE`] ?? p?.[`radius${level}NE`] ?? 0);
	const se = Number(p?.[`r${level}SE`] ?? p?.[`radius${level}SE`] ?? 0);
	const sw = Number(p?.[`r${level}SW`] ?? p?.[`radius${level}SW`] ?? 0);
	const nw = Number(p?.[`r${level}NW`] ?? p?.[`radius${level}NW`] ?? 0);
	if (!(ne || se || sw || nw)) return void 0;
	return [
		ne,
		se,
		sw,
		nw
	];
}
/** 三方时间报文（纯日期 / 空格或 T 分隔 / 可选秒 / 可选 Z 或 ±hh:mm 偏移） */
var RAW_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2})?)?(Z|[+-]\d{2}:?\d{2})?$/;
/** 偏移文本 → 分钟数（`+08:00` → 480，`Z` → 0） */
function offsetMinutes(offset) {
	if (offset === "Z") return 0;
	const digits = offset.replace(/\D/g, "");
	const sign = offset.startsWith("-") ? -1 : 1;
	const hours = Number(digits.slice(0, 2));
	const minutes = Number(digits.slice(2, 4) || "0");
	return sign * (hours * 60 + minutes);
}
/**
* 三方时间报文 → 本系统口径 `yyyy-MM-ddTHH:mm`（与后台 `/v2/typhoon/**` 一致）。
*
* 同一数据源内部并不统一：活跃列表回带偏移的 UTC 串
* （`2026-09-21T00:00:00.000+00:00`），路径点回本地无偏移串
* （`2026-09-21 08:00:00`）。带偏移的折算到本地时区，不带的视为本地时间；
* 形态不认识时原样返回，不丢数据。
*/
function canonTime(value) {
	const text = String(value ?? "").trim();
	const matched = RAW_TIME.exec(text);
	if (!matched) return text;
	const [, y = "", mo = "", d = "", hh = "00", mm = "00", offset = ""] = matched;
	if (!offset) return `${y}-${mo}-${d}T${hh}:${mm}`;
	const local = /* @__PURE__ */ new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm) - offsetMinutes(offset) * 6e4);
	const pad = (n) => String(n).padStart(2, "0");
	return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
}
/** 原始路径点 → 契约 TrackPoint */
function toTrackPoint(p) {
	return {
		time: canonTime(p.time),
		lng: Number(p.lng ?? p.longitude ?? 0),
		lat: Number(p.lat ?? p.latitude ?? 0),
		strong: p.strong ?? "",
		speed: numOr(p.speed),
		pressure: numOr(p.pressure),
		r7: pickRadii(p, "7"),
		r10: pickRadii(p, "10"),
		r12: pickRadii(p, "12")
	};
}
/**
* 三方详情 → 契约 TyphoonDetail。
*
* 预报通道：历史路径末点的 forecast 数组里优先取机构名含"中国"的通道，否则取第一条。
*/
function toTyphoonDetail(raw, fallbackId) {
	const points = arr(raw.points);
	const path = points.map(toTrackPoint);
	let forecast = [];
	const last = points[points.length - 1];
	const sources = arr(last?.forecast);
	if (sources.length) {
		const src = sources.find((f) => String(f?.tm ?? "").includes("中国")) ?? sources[0];
		const pts = arr(src?.forecastpoints);
		if (pts.length) forecast = [{
			name: String(src.tm ?? ""),
			points: pts.map((fp) => ({
				time: canonTime(fp.time),
				lng: Number(fp.lng ?? 0),
				lat: Number(fp.lat ?? 0),
				strong: fp.strong ?? "",
				speed: numOr(fp.speed),
				pressure: numOr(fp.pressure)
			}))
		}];
	}
	return {
		id: String(raw.tfid ?? raw.id ?? fallbackId),
		name: raw.name ?? raw.typhoonName ?? "",
		strong: points[0]?.strong ?? "",
		warnlevel: String(raw.warnlevel ?? "").trim() || void 0,
		path,
		forecast,
		source: "zhejiang-slt-direct"
	};
}
/**
* 获取当前活跃台风列表。
*
* 后台已实现（HEAD 探测命中）→ GET /v2/typhoon/active；否则直连三方归一化。
* 与历史行为一致：任何链路都失败时返回空数组，顶栏据此不显示台风入口。
*/
async function getActiveTyphoonList() {
	if (await probeBackend("/v2/typhoon/active")) try {
		const data = (await http().get(TYPHOON_ACTIVE_PATH).then((r) => r.data))?.data;
		if (Array.isArray(data)) return data.filter((t) => Boolean(t?.id)).map((t) => ({
			...t,
			source: t.source || "backend"
		}));
		log.warn("typhoon", "后台台风列表结构异常，回落三方");
	} catch (error) {
		log.warn("typhoon", "后台台风列表接口失败，回落三方", error);
	}
	try {
		return arr(await fetchJson(TYPHOON_CANDIDATES, "/TyhoonActivity")).map((item) => {
			const t = item;
			return {
				id: String(t.tfid ?? t.id ?? ""),
				name: t.name ?? t.typhoonName ?? "",
				enname: t.enname || void 0,
				strong: t.strong ?? t.level ?? "",
				lat: numOr(t.lat ?? t.latitude ?? t.latNorth),
				lng: numOr(t.lng ?? t.longitude ?? t.lon),
				time: canonTime(t.time ?? t.uptime ?? t.updateTime ?? t.datetime ?? ""),
				timeformate: t.timeformate || void 0,
				speed: numOr(t.speed),
				pressure: numOr(t.pressure),
				power: numOr(t.power),
				warnlevel: typeof t.warnlevel === "string" && t.warnlevel ? t.warnlevel : void 0,
				movedirection: t.movedirection || void 0,
				movespeed: numOr(t.movespeed),
				impact: t.impact || void 0,
				source: "zhejiang-slt-direct"
			};
		}).filter((t) => Boolean(t.id));
	} catch (error) {
		log.warn("typhoon", "三方台风列表不可用", error);
		return [];
	}
}
/**
* 获取单个台风详情（历史路径 + 预报路径）。
*
* 后台能力以 /v2/typhoon/active 的探测结果为准（两者同属一个后台控制器；
* 缺 id 的 HEAD 判定不稳定，不复用独立探测）；命中则 GET /v2/typhoon/detail?id=，
* 否则直连三方归一化。两条链路都失败时抛错，由调用方决定空态展示。
*/
async function getTyphoonDetail(id) {
	if (!id) throw new Error("[typhoon] 缺少台风编号");
	if (await probeBackend("/v2/typhoon/active")) try {
		const data = (await http().get(TYPHOON_DETAIL_PATH).query({ id }).then((r) => r.data))?.data;
		if (data && (arr(data.path).length || arr(data.forecast).length)) return {
			...data,
			path: arr(data.path),
			forecast: arr(data.forecast),
			source: data.source || "backend"
		};
		log.warn("typhoon", `后台未返回台风 ${id} 的路径，回落三方`);
	} catch (error) {
		log.warn("typhoon", "后台台风详情接口失败，回落三方", error);
	}
	return toTyphoonDetail(await fetchJson(TYPHOON_CANDIDATES, `/TyphoonInfo/${encodeURIComponent(id)}`), id);
}
//#endregion
//#region ../../packages/core/src/api/holiday.ts
/**
* 节假日后台接口封装（@repo/core）
*
* 后台提供两个接口：
*   - `GET /v2/holiday/get?year=` 取某年节假日（按<b>日期逐行</b>返回）
*   - `GET /v2/holiday/sync`     从三方同步到本地库（管理员权限，后台目前尚未实现）
*
* 本模块只负责取数与归一，<b>不缓存、不持有状态</b> —— 归一后的结果交给调用方
* （home 日历的 remoteHolidays 覆盖层）保存。这样主题层不必反向依赖 core 的实现细节，
* core 也不必知道日历怎么用这批数据。
*
* 后台未部署该接口时 {@link fetchHolidays} 返回 {@code null} 而不是抛错：
* 日历本来就有内置表，取不到时退回内置即可，不该让整页报错。
*/
/**
* 日期归一：截到日并补零。
*
* <p>Jackson 对 {@code LocalDate} 默认输出 {@code "2026-10-01"}，但开启
* {@code WRITE_DATES_AS_TIMESTAMPS} 时会变成数组或数字。这里只接受前 10 位的日期串，
* 其余形态一律视为无法解析并丢弃 —— 猜日期会写错格子，比不显示更糟。</p>
*/
function toDateKey(raw) {
	if (typeof raw !== "string") return null;
	const s = raw.trim().slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
/**
* 布尔宽松解析：后端是 {@code Boolean}，但旧数据或不同驱动可能是 {@code 1/0} / {@code "true"}。
*/
function toBool(raw) {
	if (typeof raw === "boolean") return raw;
	if (typeof raw === "number") return raw !== 0;
	if (typeof raw === "string") {
		const s = raw.trim().toLowerCase();
		return s !== "" && s !== "0" && s !== "false";
	}
	return false;
}
/**
* 归一后台返回的原始行。
*
* @param rows 原始数组
* @returns 合法记录（日期非法或名称为空的行被丢弃）
*/
function normalizeHolidays(rows) {
	const out = [];
	for (const row of rows) {
		if (!row || typeof row !== "object") continue;
		const r = row;
		const key = toDateKey(r.sysHolidayDate ?? r.date);
		const name = String(r.sysHolidayName ?? r.name ?? "").trim();
		if (!key || !name) continue;
		out.push({
			key,
			name,
			isHoliday: toBool(r.sysHolidayIsHoliday ?? r.isHoliday)
		});
	}
	return out;
}
/**
* 取某年的节假日。
*
* <p>先 HEAD 探测接口是否存在，未命中直接返回 {@code null}（不发请求），
* 避免后台没这个接口时每轮稳定换来一次 404 噪音。</p>
*
* @param year 公历年
* @returns 归一后的记录；接口不存在、请求失败或返回空时返回 {@code null}
*/
async function fetchHolidays(year) {
	if (!await probeBackend("/v2/holiday/get")) return null;
	try {
		const rows = (await http().get(HOLIDAY_LIST_PATH).query({ year }).timeout(5e3).retry(false).then((r) => r.data))?.data;
		if (!Array.isArray(rows)) {
			log.warn("holiday", `${year} 年后台返回非数组，按空数据处理`);
			return [];
		}
		return normalizeHolidays(rows);
	} catch (error) {
		log.warn("holiday", `获取 ${year} 年节假日失败，回落内置数据`, error);
		return null;
	}
}
//#endregion
//#region ../../packages/core/src/api/index.ts
/** http 单例（由 createApp 注入） */
var httpInstance = null;
/** 注入 http 实例（createApp 构建后调用） */
function setApiHttp(http) {
	httpInstance = http;
}
/** 获取 http 实例；未注入时抛错 */
function getApiHttp() {
	if (!httpInstance) throw new Error("[api] http 未注入，请先调用 setApiHttp()");
	return httpInstance;
}
/**
* http() —— getApiHttp() 的简写别名，业务侧可写 http().get(url)。
* 主入口为 getApiHttp()，http() 仅为书写便利，两者行为完全一致。
*/
function http() {
	return getApiHttp();
}
/**
* 创建业务模块自己的 Http 客户端（如 device / spider 等独立后端）。
*
* 复用框架注入的 axios 实例（保留加密/签名/401/重试拦截器），
* 仅替换 baseUrl；url 按 normalizeUrl 规则在 http.ts 统一拼接。
*
* baseUrl 来自配置：app.yaml 的 httpConfig.moduleBaseUrl[moduleName]，
* 未配置时回退 httpConfig.baseUrl。调用前需 getApiHttp() 已注入（createApp 之后）。
*/
function createModuleHttp(moduleName) {
	const { moduleBaseUrl, baseUrl } = getConfig().http;
	const resolved = moduleBaseUrl?.[moduleName] ?? baseUrl;
	return createHttp({
		baseUrl: resolved,
		instance: getApiHttp().getInstance()
	});
}
/** 登录（.codec(true)：按后端 codec 协议加密密码；未配置 requestCodec 时自动退化为明文，不影响其它应用） */
function login(data) {
	return getApiHttp().post(getConfig().url.login).data(data).codec(true).then((r) => r.data);
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
/** 获取验证码 */
function getCaptcha() {
	return getApiHttp().get(getConfig().url.captcha).then((r) => r.data);
}
/** 获取默认配置（登录页/首页拉取后端配置合并到 getConfig） */
function getDefaultSetting() {
	return getApiHttp().get(getConfig().url.setting).timeout(3e3).retry(false).then((r) => r.data);
}
/** 已开启的三方登录来源（登录页与绑定面板共用同一配置源，未登录可调） */
function getThirdPartyProviders() {
	return getApiHttp().get("/v2/setting/sso/providers").timeout(3e3).retry(false).then((r) => r.data);
}
/** 三方登录取授权 URL（body: { loginType, thirdType, loginCode, callback }） */
function thirdLoginCode(data) {
	return getApiHttp().post("/v2/user/third/login/code").data(data).then((r) => r.data);
}
/** 三方绑定取授权 URL（body 同上，需登录） */
function thirdBindCode(data) {
	return getApiHttp().post("/v2/user/third/bind/code").data(data).then((r) => r.data);
}
/** 当前用户三方绑定情况（需登录，返回小写 loginType 列表） */
function thirdBindInfo() {
	return getApiHttp().post("/v2/user/third/bind/info").then((r) => r.data);
}
/** 三方解绑（body: { loginType }，需登录） */
function thirdUnbind(data) {
	return getApiHttp().post("/v2/user/third/unbind").data(data).then((r) => r.data);
}
/** 三方登录换票（body: { redirectParam }）：用回调回跳携带的一次性加密凭证换取登录态，免 @TokenForIgnore */
function thirdLoginExchange(data) {
	return getApiHttp().post("/v2/user/third/login/exchange").data(data).then((r) => r.data);
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
/**
* 把 UserLayoutData 归一化为本地缓存形状（{ widgets, grid }）。
*
* 后端接口返回的是 UserLayoutData（layout 为 JSON 字符串），
* 而 useHomeLayout 读取缓存时使用 normalize() 期望 { widgets, grid } 结构，
* 若直接把 UserLayoutData 原样写入缓存，刷新后布局会被解析为空 → 组件丢失。
*
* 供 @repo/core 内部（getLayout / saveLayout 写回缓存）与
* @repo/theme 的 useHomeLayout（fromUserLayout 解析）共用，避免重复的 JSON.parse。
*/
function toLayoutCacheShape(data) {
	if (!data) return null;
	if (typeof data.layout === "string" && data.layout.trim()) try {
		const parsed = JSON.parse(data.layout);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
	} catch {}
	return null;
}
/**
* 获取当前用户布局（cache-aside：先读 storage 缓存，没有再请求并写回）
*/
async function getLayout() {
	const cached = getLayoutCache();
	if (cached) return { data: cached };
	const res = await getApiHttp().get(getConfig().url.layout).then((r) => r.data);
	if (res?.data) {
		const shape = toLayoutCacheShape(res.data);
		if (shape) setLayoutCache(shape);
	}
	return res;
}
/** 保存当前用户布局（成功后同步写回缓存） */
function saveLayout(data) {
	return getApiHttp().put(getConfig().url.layout).data(data).then((r) => {
		if (r?.data) {
			const shape = toLayoutCacheShape(r.data);
			if (shape) setLayoutCache(shape);
		}
		return r;
	});
}
//#endregion
//#region ../../packages/core/src/single-flight.ts
/**
* 创建一个单飞包装器。
*
* @typeParam K key 类型
* @typeParam R 任务结果类型
* @param task 真正的执行逻辑。**任何 key 上都最多只有一个在途实例**；
*              同 key 的并发调用共享该实例，因此实现必须保证并发安全、
*              且结果对所有共享者等价。
* @returns 包装后的调用函数
*/
function createSingleFlight(task) {
	const inflight = /* @__PURE__ */ new Map();
	return (key) => {
		const existing = inflight.get(key);
		if (existing) return existing.promise;
		const promise = task(key);
		inflight.set(key, { promise });
		const release = () => {
			if (inflight.get(key)?.promise === promise) inflight.delete(key);
		};
		promise.then(release, release);
		return promise;
	};
}
//#endregion
//#region ../../packages/core/src/session-scope.ts
/**
* 会话作用域（session scope）—— 登出时作废在途请求的机制。
*
* <p><b>要解决的问题。</b>登出只是「清掉本地令牌」，<b>不会停掉已经发出去的网络请求</b>。
* 于是在登出前后这一小段窗口里有一批「带着旧令牌」的在途请求，它们陆续返回后：
* </p>
* <ul>
*   <li><b>令牌被复活</b>：定时刷新 / 手动刷新的响应此刻才到，
*       {@link TokenManager} 照常把新的 accessToken、refreshToken 写回 storage。
*       用户点了「退出登录」，页面却仍然是登录态 —— 下次打开还是他。
*       而且 refreshToken 也回来了，等于<b>永远登出不掉</b>。</li>
*   <li><b>旧响应污染新会话</b>：菜单、用户信息、列表数据的响应把登出前的内容写回 store；
*       用户 B 登录后看到的是用户 A 的菜单。</li>
*   <li><b>误弹登录确认框</b>：这批请求带着已作废的令牌陆续 401，
*       全局响应拦截器会弹「登录已失效」确认框，甚至调 {@code clearAllAuthData()}
*       把用户刚刚登录好的新会话又清掉。</li>
* </ul>
*
* <p><b>机制。</b>两条互补的防线，都极小：</p>
* <ol>
*   <li><b>AbortSignal</b>：一个模块级的 {@link AbortController}，请求拦截器把它挂到每个
*       请求的 {@code config.signal} 上。登出时 {@code abort()} 一次，
*       所有在途请求立刻失败，不必等服务端。</li>
*   <li><b>epoch（世代号）</b>：单调递增的整数。请求发出时记下当时的 epoch，
*       响应回来时若 epoch 已变，说明「这个响应属于上一个会话」，
*       于是丢弃（既不写数据，也不弹框、不清会话）。
*       signal 只解决「请求还在飞」，epoch 还解决「<b>响应已经到本地了、正在处理中</b>」，
*       以及 abort 拦不住的其它异步路径（定时刷新、SSE 重连等）。</li>
* </ol>
*
* <p><b>依赖说明。</b>本模块零依赖（不用 axios / vue），可在 Node 下直接验收。</p>
*
* @since 4.0.0.42
*/
/** 挂在请求配置上的自定义字段名（记下发出时的会话世代） */
var SESSION_EPOCH_FIELD = "__hcSessionEpoch";
/** 挂在被作废请求错误上的标记，便于响应拦截器识别「这是登出导致的取消」 */
var SESSION_ABORTED_FIELD = "__hcSessionAborted";
/** 当前作用域的 AbortController；每次 {@link invalidateSessionScope} 换一个新的 */
var controller = new AbortController();
/** 当前会话世代号；每次 {@link invalidateSessionScope} 自增 */
var epoch = 0;
/**
* 当前的会话世代号。
*
* <p>在<b>发起</b>任何「响应会影响本地状态」的异步操作前记下它，
* 在<b>处理响应</b>时与它比对。</p>
*
* @returns 当前世代号
*/
function sessionEpoch() {
	return epoch;
}
/**
* 当前作用域的取消信号。
*
* <p>每个请求都挂它，登出时一并 abort。</p>
*
* @returns 当前的 AbortSignal（已被作废则 {@code aborted} 为 true）
*/
function sessionSignal() {
	return controller?.signal;
}
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
/**
* 判断某个世代号是否已过期（即响应属于更早的会话）。
*
* @param stamped 发起操作时记下的世代号；缺失（undefined / NaN）视为「不检查」
* @returns 已过期返回 true
*/
function isStaleEpoch(stamped) {
	if (typeof stamped !== "number" || !Number.isFinite(stamped)) return false;
	return stamped !== epoch;
}
/**
* 给一个错误打上「因会话作废而被取消」的标记。
*
* @param error axios / fetch 抛出的错误对象
* @returns 同一个错误对象（便于链式调用）
*/
function markSessionAborted(error) {
	if (error && typeof error === "object") error[SESSION_ABORTED_FIELD] = true;
	return error;
}
/**
* 判断错误是否由会话作废导致（用于跳过 toast / 登录框 / 清理等全局副作用）。
*
* @param error 错误对象
* @returns 是会话作废返回 true
*/
function isSessionAborted(error) {
	if (!error || typeof error !== "object") return false;
	return error[SESSION_ABORTED_FIELD] === true;
}
//#endregion
//#region ../../packages/core/src/token.ts
/** 令牌管理器 */
var TokenManager = class {
	storage;
	config;
	timer = null;
	constructor(storage, config) {
		this.storage = storage;
		this.config = config;
	}
	/** accessToken 存储 key（带命名空间，由 storage 自动处理） */
	get accessKey() {
		return this.config.accessTokenKey || "accessToken";
	}
	/** refreshToken 存储 key */
	get refreshKey() {
		return this.config.refreshTokenKey || "refreshToken";
	}
	/** userInfo 存储 key */
	get userInfoKey() {
		return this.config.userInfoKey || "userInfo";
	}
	/** 获取 accessToken */
	getAccessToken() {
		return this.storage.get(this.accessKey) ?? "";
	}
	/** 获取 refreshToken */
	getRefreshToken() {
		return this.storage.get(this.refreshKey) ?? "";
	}
	/** 获取用户信息 */
	getUserInfo() {
		return this.storage.get(this.userInfoKey);
	}
	/** 写入令牌对 */
	setTokens(accessToken, refreshToken) {
		this.storage.set(this.accessKey, accessToken);
		if (refreshToken !== void 0) this.storage.set(this.refreshKey, refreshToken);
	}
	/** 写入用户信息（登录 / 刷新用户信息 / /me 后调用） */
	setUserInfo(userInfo) {
		this.storage.set(this.userInfoKey, userInfo);
	}
	/** 清除令牌与用户信息 */
	clearTokens() {
		this.storage.remove(this.accessKey);
		this.storage.remove(this.refreshKey);
		this.storage.remove(this.userInfoKey);
	}
	/**
	* 手动立即刷新 token（需配置 refresh 开启且 url.refreshToken 非空）
	*
	* 支持三种升级形式（x-oauth-upgrade-type）：
	* - REFRESH   ：换取新 token，写回 accessToken / refreshToken
	* - VERSION   ：刷新用户信息，返回的 userInfo / userResume 写回 storage
	* - TIMESTAMP ：续期，返回的用户信息同样写回
	*
	* @param upgradeType 升级类型，默认 REFRESH
	*/
	async refresh(upgradeType = "REFRESH") {
		return this.refreshFlight(upgradeType);
	}
	/**
	* single-flight 包装：同类型已有刷新在途时直接复用其结果，不重复打后端。
	*
	* <p>刻意做成独立的私有字段（而非写在 {@link refresh} 内联），是为了让
	* 「去重」这一层与「刷新」这一层各自可读；去重语义本身见
	* {@link ../../core/single-flight 单飞工具}。</p>
	*/
	refreshFlight = createSingleFlight((type) => this.doRefresh(type));
	/** 真正发起刷新请求（由 {@link refresh} 做 single-flight 包装后调用） */
	async doRefresh(upgradeType) {
		const { refresh } = this.config;
		const refreshUrl = getConfig().url.refreshToken;
		if (!refresh || !refreshUrl) return false;
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) return false;
		const stampedEpoch = sessionEpoch();
		try {
			const { data } = await http().post(refreshUrl).headers({ "x-oauth-upgrade-type": upgradeType }).data({ refreshToken });
			if (isStaleEpoch(stampedEpoch)) return false;
			const result = data.data ?? data;
			const accessToken = result.accessToken;
			const newRefreshToken = result.refreshToken;
			if (accessToken) this.setTokens(accessToken, newRefreshToken);
			const userInfo = result.userInfo ?? result.userResume;
			if (userInfo && Object.keys(userInfo).length > 0) this.setUserInfo(userInfo);
			return Boolean(accessToken || userInfo);
		} catch {
			return false;
		}
	}
	/** 开启定时刷新（未开启 refresh/autoRefresh 或未配置 url.refreshToken 时不启动） */
	start() {
		if (!this.config.refresh || !this.config.autoRefresh || !getConfig().url.refreshToken) return;
		const interval = Math.max(this.config.refreshInterval, 6e4);
		this.timer = setInterval(() => {
			this.refresh();
		}, interval);
	}
	/** 停止定时刷新 */
	stop() {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
};
/** 创建令牌管理器（自动读取 config.token 配置） */
function createTokenManager(storage, config) {
	return new TokenManager(storage, config);
}
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
/** 是否存在已注入的 router */
function hasRouter() {
	return routerInstance !== null;
}
/* NProgress, (c) 2013, 2014 Rico Sta. Cruz - http://ricostacruz.com/nprogress
* @license MIT */
//#endregion
//#region ../../node_modules/.pnpm/nprogress@0.2.0/node_modules/nprogress/nprogress.css
var import_nprogress = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof define === "function" && define.amd) define(factory);
		else if (typeof exports === "object") module.exports = factory();
		else root.NProgress = factory();
	})(exports, function() {
		var NProgress = {};
		NProgress.version = "0.2.0";
		var Settings = NProgress.settings = {
			minimum: .08,
			easing: "ease",
			positionUsing: "",
			speed: 200,
			trickle: true,
			trickleRate: .02,
			trickleSpeed: 800,
			showSpinner: true,
			barSelector: "[role=\"bar\"]",
			spinnerSelector: "[role=\"spinner\"]",
			parent: "body",
			template: "<div class=\"bar\" role=\"bar\"><div class=\"peg\"></div></div><div class=\"spinner\" role=\"spinner\"><div class=\"spinner-icon\"></div></div>"
		};
		/**
		* Updates configuration.
		*
		*     NProgress.configure({
		*       minimum: 0.1
		*     });
		*/
		NProgress.configure = function(options) {
			var key, value;
			for (key in options) {
				value = options[key];
				if (value !== void 0 && options.hasOwnProperty(key)) Settings[key] = value;
			}
			return this;
		};
		/**
		* Last number.
		*/
		NProgress.status = null;
		/**
		* Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
		*
		*     NProgress.set(0.4);
		*     NProgress.set(1.0);
		*/
		NProgress.set = function(n) {
			var started = NProgress.isStarted();
			n = clamp(n, Settings.minimum, 1);
			NProgress.status = n === 1 ? null : n;
			var progress = NProgress.render(!started), bar = progress.querySelector(Settings.barSelector), speed = Settings.speed, ease = Settings.easing;
			progress.offsetWidth;
			queue(function(next) {
				if (Settings.positionUsing === "") Settings.positionUsing = NProgress.getPositioningCSS();
				css(bar, barPositionCSS(n, speed, ease));
				if (n === 1) {
					css(progress, {
						transition: "none",
						opacity: 1
					});
					progress.offsetWidth;
					setTimeout(function() {
						css(progress, {
							transition: "all " + speed + "ms linear",
							opacity: 0
						});
						setTimeout(function() {
							NProgress.remove();
							next();
						}, speed);
					}, speed);
				} else setTimeout(next, speed);
			});
			return this;
		};
		NProgress.isStarted = function() {
			return typeof NProgress.status === "number";
		};
		/**
		* Shows the progress bar.
		* This is the same as setting the status to 0%, except that it doesn't go backwards.
		*
		*     NProgress.start();
		*
		*/
		NProgress.start = function() {
			if (!NProgress.status) NProgress.set(0);
			var work = function() {
				setTimeout(function() {
					if (!NProgress.status) return;
					NProgress.trickle();
					work();
				}, Settings.trickleSpeed);
			};
			if (Settings.trickle) work();
			return this;
		};
		/**
		* Hides the progress bar.
		* This is the *sort of* the same as setting the status to 100%, with the
		* difference being `done()` makes some placebo effect of some realistic motion.
		*
		*     NProgress.done();
		*
		* If `true` is passed, it will show the progress bar even if its hidden.
		*
		*     NProgress.done(true);
		*/
		NProgress.done = function(force) {
			if (!force && !NProgress.status) return this;
			return NProgress.inc(.3 + .5 * Math.random()).set(1);
		};
		/**
		* Increments by a random amount.
		*/
		NProgress.inc = function(amount) {
			var n = NProgress.status;
			if (!n) return NProgress.start();
			else {
				if (typeof amount !== "number") amount = (1 - n) * clamp(Math.random() * n, .1, .95);
				n = clamp(n + amount, 0, .994);
				return NProgress.set(n);
			}
		};
		NProgress.trickle = function() {
			return NProgress.inc(Math.random() * Settings.trickleRate);
		};
		/**
		* Waits for all supplied jQuery promises and
		* increases the progress as the promises resolve.
		*
		* @param $promise jQUery Promise
		*/
		(function() {
			var initial = 0, current = 0;
			NProgress.promise = function($promise) {
				if (!$promise || $promise.state() === "resolved") return this;
				if (current === 0) NProgress.start();
				initial++;
				current++;
				$promise.always(function() {
					current--;
					if (current === 0) {
						initial = 0;
						NProgress.done();
					} else NProgress.set((initial - current) / initial);
				});
				return this;
			};
		})();
		/**
		* (Internal) renders the progress bar markup based on the `template`
		* setting.
		*/
		NProgress.render = function(fromStart) {
			if (NProgress.isRendered()) return document.getElementById("nprogress");
			addClass(document.documentElement, "nprogress-busy");
			var progress = document.createElement("div");
			progress.id = "nprogress";
			progress.innerHTML = Settings.template;
			var bar = progress.querySelector(Settings.barSelector), perc = fromStart ? "-100" : toBarPerc(NProgress.status || 0), parent = document.querySelector(Settings.parent), spinner;
			css(bar, {
				transition: "all 0 linear",
				transform: "translate3d(" + perc + "%,0,0)"
			});
			if (!Settings.showSpinner) {
				spinner = progress.querySelector(Settings.spinnerSelector);
				spinner && removeElement(spinner);
			}
			if (parent != document.body) addClass(parent, "nprogress-custom-parent");
			parent.appendChild(progress);
			return progress;
		};
		/**
		* Removes the element. Opposite of render().
		*/
		NProgress.remove = function() {
			removeClass(document.documentElement, "nprogress-busy");
			removeClass(document.querySelector(Settings.parent), "nprogress-custom-parent");
			var progress = document.getElementById("nprogress");
			progress && removeElement(progress);
		};
		/**
		* Checks if the progress bar is rendered.
		*/
		NProgress.isRendered = function() {
			return !!document.getElementById("nprogress");
		};
		/**
		* Determine which positioning CSS rule to use.
		*/
		NProgress.getPositioningCSS = function() {
			var bodyStyle = document.body.style;
			var vendorPrefix = "WebkitTransform" in bodyStyle ? "Webkit" : "MozTransform" in bodyStyle ? "Moz" : "msTransform" in bodyStyle ? "ms" : "OTransform" in bodyStyle ? "O" : "";
			if (vendorPrefix + "Perspective" in bodyStyle) return "translate3d";
			else if (vendorPrefix + "Transform" in bodyStyle) return "translate";
			else return "margin";
		};
		/**
		* Helpers
		*/
		function clamp(n, min, max) {
			if (n < min) return min;
			if (n > max) return max;
			return n;
		}
		/**
		* (Internal) converts a percentage (`0..1`) to a bar translateX
		* percentage (`-100%..0%`).
		*/
		function toBarPerc(n) {
			return (-1 + n) * 100;
		}
		/**
		* (Internal) returns the correct CSS for changing the bar's
		* position given an n percentage, and speed and ease from Settings
		*/
		function barPositionCSS(n, speed, ease) {
			var barCSS;
			if (Settings.positionUsing === "translate3d") barCSS = { transform: "translate3d(" + toBarPerc(n) + "%,0,0)" };
			else if (Settings.positionUsing === "translate") barCSS = { transform: "translate(" + toBarPerc(n) + "%,0)" };
			else barCSS = { "margin-left": toBarPerc(n) + "%" };
			barCSS.transition = "all " + speed + "ms " + ease;
			return barCSS;
		}
		/**
		* (Internal) Queues a function to be executed.
		*/
		var queue = (function() {
			var pending = [];
			function next() {
				var fn = pending.shift();
				if (fn) fn(next);
			}
			return function(fn) {
				pending.push(fn);
				if (pending.length == 1) next();
			};
		})();
		/**
		* (Internal) Applies css properties to an element, similar to the jQuery 
		* css method.
		*
		* While this helper does assist with vendor prefixed property names, it 
		* does not perform any manipulation of values prior to setting styles.
		*/
		var css = (function() {
			var cssPrefixes = [
				"Webkit",
				"O",
				"Moz",
				"ms"
			], cssProps = {};
			function camelCase(string) {
				return string.replace(/^-ms-/, "ms-").replace(/-([\da-z])/gi, function(match, letter) {
					return letter.toUpperCase();
				});
			}
			function getVendorProp(name) {
				var style = document.body.style;
				if (name in style) return name;
				var i = cssPrefixes.length, capName = name.charAt(0).toUpperCase() + name.slice(1), vendorName;
				while (i--) {
					vendorName = cssPrefixes[i] + capName;
					if (vendorName in style) return vendorName;
				}
				return name;
			}
			function getStyleProp(name) {
				name = camelCase(name);
				return cssProps[name] || (cssProps[name] = getVendorProp(name));
			}
			function applyCss(element, prop, value) {
				prop = getStyleProp(prop);
				element.style[prop] = value;
			}
			return function(element, properties) {
				var args = arguments, prop, value;
				if (args.length == 2) for (prop in properties) {
					value = properties[prop];
					if (value !== void 0 && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
				}
				else applyCss(element, args[1], args[2]);
			};
		})();
		/**
		* (Internal) Determines if an element or space separated list of class names contains a class name.
		*/
		function hasClass(element, name) {
			return (typeof element == "string" ? element : classList(element)).indexOf(" " + name + " ") >= 0;
		}
		/**
		* (Internal) Adds a class to an element.
		*/
		function addClass(element, name) {
			var oldList = classList(element), newList = oldList + name;
			if (hasClass(oldList, name)) return;
			element.className = newList.substring(1);
		}
		/**
		* (Internal) Removes a class from an element.
		*/
		function removeClass(element, name) {
			var oldList = classList(element), newList;
			if (!hasClass(element, name)) return;
			newList = oldList.replace(" " + name + " ", " ");
			element.className = newList.substring(1, newList.length - 1);
		}
		/**
		* (Internal) Gets a space separated list of the class names on the element. 
		* The list is wrapped with a single space on each end to facilitate finding 
		* matches within the list.
		*/
		function classList(element) {
			return (" " + (element.className || "") + " ").replace(/\s+/gi, " ");
		}
		/**
		* (Internal) Removes an element from the DOM.
		*/
		function removeElement(element) {
			element && element.parentNode && element.parentNode.removeChild(element);
		}
		return NProgress;
	});
})))(), 1);
//#endregion
//#region ../../packages/core/src/progress.ts
/**
* 全局进度条（nprogress 封装）
*
* 由 core 统一管理，供路由守卫与 HTTP 请求动画开关使用：
*  - 路由守卫：beforeEach start / afterEach done
*  - HTTP：config.http.showLoading 为 true 时 start，响应/错误时 done
*
* 注意：
*  1. nprogress 的 css 是全局注入的，避免在多个包重复引入，
*     统一在此文件 import 一次即可。
*  2. nprogress 是全局单例，并发请求下直接 start/done 会互相干扰
*     （先完成的请求会把进度条提前隐藏）。因此提供引用计数包装
*     startLoading / doneLoading：计数归零才真正隐藏进度条。
*     并发场景请一律使用计数版本，避免进度条悬挂或提前消失。
*/
import_nprogress.default.configure({
	easing: "ease",
	speed: 500,
	showSpinner: true,
	trickleSpeed: 200,
	minimum: .3
});
/** 进行中的加载计数（并发请求共享，归零才隐藏进度条） */
var loadingCount = 0;
/** 开始一次加载：计数 +1，首个请求才真正 start */
function startLoading() {
	loadingCount++;
	if (loadingCount === 1) import_nprogress.default.start();
}
/** 结束一次加载：计数 -1，归零才真正 done（防并发提前隐藏 / 防多调误隐藏） */
function doneLoading() {
	if (loadingCount <= 0) return;
	loadingCount--;
	if (loadingCount === 0) import_nprogress.default.done();
}
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
/** 设置/清除全局守卫 */
function setSuppressNextMsg(v) {
	_suppressNextMsg = v;
}
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
/** 对象风格 message（ElMessage + ElMessageBox + ElNotification） */
var message = {
	...messageEl,
	confirm: messageBox.confirm,
	prompt: messageBox.prompt,
	alert: messageBox.alert,
	notify: notification,
	notifySuccess: notification.success,
	notifyError: notification.error,
	notifyWarning: notification.warning,
	notifyInfo: notification.info
};
//#endregion
//#region ../../packages/core/src/httpCrypto.ts
/**
* HTTP 请求加密 / 签名拦截器
*
* 所有加密/签名/解密算法已迁移至 wasm（CryptoModule）：
*  - generateNonce()     → wasm 生成 anti-replay nonce
*  - signRequest()       → wasm 拼接 nonce+fingerprint+timestamp+paramsMd5+secret
*  - encryptBody()       → wasm 生成 AES key + 加密 + base64 编码 key
*  - decodeBody()        → wasm 剔除噪声 + AES 解密 + JSON 识别
*  TS 侧仅保留编排逻辑（读响应头、写 axios config、loading 控制、重试）。
*/
/** 后端配置版本响应头：配置变更时后端返回新版本号，前端据此触发热重载 */
var CONFIG_VERSION_HEADER = "x-response-version";
/** 加密标记头：值为 "1" 表示请求体已加密 */
var ENCRYPT_HEADER = "x-ec";
/** 随机 AES key 头（base64） */
var KEY_HEADER = "x-ck";
/** 冗余等级头：值为 1/2/3，等级越高密文前后噪声越多 */
var NOISE_LEVEL_HEADER = "x-ot";
/** codec 协议请求体加密标记头（后端 ApiRequestDecodeBodyAdvice 只校验非空即触发解密） */
var CODEC_KEY_HEADER = "access-control-origin-key";
/** x-sign 相关头名（与后端 NonceUtils 保持一致） */
var SIGN_NONCE_HEADER = "x-nonce";
var SIGN_TIMESTAMP_HEADER = "x-timestamp";
var SIGN_FINGERPRINT_HEADER = "x-req-fingerprint";
var SIGN_HEADER = "x-sign";
/** 幂等方法白名单：默认仅这些方法自动失败重试（避免非幂等写操作被重复执行） */
var IDEMPOTENT_METHODS = /* @__PURE__ */ new Set([
	"GET",
	"HEAD",
	"OPTIONS",
	"PUT",
	"DELETE"
]);
/**
* 需要重新登录的业务码：令牌失效、账号被禁用/锁定/过期、密码过期
* 不含 A0403S0001（仅本次操作无权限，会话仍然有效）
*/
var RELOGIN_CODES = /* @__PURE__ */ new Set([
	"A0403S0000",
	"A0403S0002",
	"A0403S0003",
	"A0403S0004",
	"A0403S0005"
]);
/** base64 转 Uint8Array（仅响应解密读取响应头 key 时使用） */
function base64ToBytes(b64) {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
/**
* 生成随机十六进制串。
*
* <p>这里刻意不直接用 {@code crypto.randomUUID()}：它只在**安全上下文**可用
* （HTTPS，或 localhost）。用「局域网 IP + 明文 HTTP」打开应用时（例如
* {@code http://192.168.50.101:8848}）它是 {@code undefined}，会让
* {@link generateFingerprint} 抛「crypto.randomUUID is not a function」，
* 整条请求链路（含设备指纹签名）在发出前就中断，页面表现为所有接口静默失败。</p>
*
* <p>{@code crypto.getRandomValues} 挂在 {@code Crypto} 而非
* {@code SubtleCrypto} 上，**不受安全上下文限制**，作为主路径；
* 再兜一层 {@code Math.random} 应付连 {@code crypto} 都不存在的环境。</p>
*
* @param byteLength 随机字节数，返回的十六进制串长度为 byteLength * 2
* @return 小写十六进制随机串
*/
function randomHex(byteLength) {
	const bytes = new Uint8Array(byteLength);
	const c = globalThis.crypto;
	if (c && typeof c.getRandomValues === "function") c.getRandomValues(bytes);
	else for (let i = 0; i < byteLength; i += 1) bytes[i] = Math.floor(Math.random() * 256);
	let out = "";
	for (let i = 0; i < bytes.length; i += 1) out += bytes[i].toString(16).padStart(2, "0");
	return out;
}
/** 生成设备指纹（首次生成后持久化，避免每次变化导致后端缓存膨胀；按 app 命名空间隔离） */
var cachedFingerprint = null;
function generateFingerprint() {
	if (cachedFingerprint) return cachedFingerprint;
	const key = getStorageKey("x-req-fingerprint");
	let fp = localStorage.getItem(key);
	if (!fp) {
		fp = randomHex(16);
		localStorage.setItem(key, fp);
	}
	cachedFingerprint = fp;
	return fp;
}
/** 判断响应是否为失败状态（不满足成功码 / success=false / ok=false） */
function isApiError(data) {
	if (!data || typeof data !== "object") return false;
	const d = data;
	if (d.success === false || d.ok === false) return true;
	const successCode = getConfig().http?.toast?.successCode ?? "00000";
	const SUCCESS_CODES = /* @__PURE__ */ new Set([
		"00000",
		"200",
		"0",
		"success",
		"ok",
		"true",
		"1"
	]);
	if (d.code && !SUCCESS_CODES.has(String(d.code).toLowerCase()) && String(d.code) !== String(successCode)) return true;
	return false;
}
/** 判断失败响应是否应静默处理（不弹提示但仍 reject） */
function isSilentError(data) {
	return (getConfig().http?.toast?.skipCodeList ?? []).includes(data.code ?? "");
}
/**
* 构造统一失败 Error。
*
* <p>失败响应里仍可能带业务数据，例如服务管理建节点/热更新返回
* success=false 但 data 是已落库的 ERROR 节点。拦截器丢掉 data 会让
* 所有失败分支只能拿到「保存失败」文案，无法刷新列表、也无法让用户
* 继续点详情/编辑/删除去排查。</p>
*/
function createApiFailureError(data, fallbackMsg) {
	const rawMsg = data.msg || data.message;
	const err = new Error(rawMsg || fallbackMsg);
	err.code = data.code;
	err.msg = rawMsg;
	err.success = data.success;
	err.ok = data.ok;
	err.data = data.data;
	return err;
}
/** 相同错误文案的合并窗口（毫秒） */
var RECENT_ERROR_MS = 1500;
var recentErrorToast = /* @__PURE__ */ new Map();
/**
* 认领一次错误提示：同一文案在窗口期内只允许第一次通过
*
* 一次页面刷新往往并发多个请求，同一后端故障会返回完全相同的 msg，
* 不去重就会叠出 N 条一样的红条。调用方拿到 false 时应完全静默（连带跳过抑制标记）。
*/
function claimErrorToast(msg) {
	const now = Date.now();
	for (const [key, at] of recentErrorToast) if (now - at > RECENT_ERROR_MS) recentErrorToast.delete(key);
	if (recentErrorToast.has(msg)) return false;
	recentErrorToast.set(msg, now);
	return true;
}
/** 统一响应校验：失败时弹提示 + reject，成功时透传 */
function checkApiResponse(response, noToast) {
	const data = response.data;
	if (isApiError(data)) {
		const toastEnable = getConfig().http?.toast?.enable ?? true;
		const rawMsg = data.msg || data.message;
		if (toastEnable && !noToast && !isSilentError(data)) {
			const msg = rawMsg || i18n.global.t("msg.requestFailed");
			if (claimErrorToast(msg)) msgError(msg);
		}
		const err = createApiFailureError(data, i18n.global.t("msg.requestFailed"));
		return Promise.reject(err);
	}
	try {
		if (data && typeof data === "object" && "data" in data && data.data && typeof data.data === "object" && "code" in data.data) {
			const inner = data.data;
			if (inner.code === 0 || inner.code === "0" || inner.code === 200 || inner.code === "200") data.data = inner.data;
		}
	} catch {}
	return response;
}
/** 收集 query + body 参数（与后端 NonceUtils.collectParams 语义一致） */
function collectParams(config) {
	const result = {};
	const collect = (obj) => {
		if (obj == null || typeof obj !== "object") return;
		if (obj instanceof URLSearchParams) {
			obj.forEach((value, key) => {
				if (!/^file$/i.test(key)) result[key] = value;
			});
			return;
		}
		if (obj instanceof FormData) {
			obj.forEach((value, key) => {
				if (!/^file$/i.test(key) && typeof value === "string") result[key] = value;
			});
			return;
		}
		for (const [key, value] of Object.entries(obj)) {
			if (value == null || /^file$/i.test(key)) continue;
			result[key] = String(value);
		}
	};
	collect(config.params);
	collect(config.data);
	return result;
}
/** 自然排序（字典序，与后端 TreeMap/TreeSet 一致） */
function sortParams(params) {
	return Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
}
/**
* 注册 HTTP 加密/签名拦截器
* 拦截器返回标准 AxiosInstance，用户始终操作 axios 请求对象。
*/
function setupHttpCryptoInterceptor(options) {
	const instance = axios.create();
	const crypto = options.crypto;
	instance.interceptors.request.use(async (config) => {
		const hc = config.hc;
		const encrypt = hc?.encrypt ?? options.encrypt;
		const showLoading = hc?.showLoading ?? options.showLoading;
		const internal = config;
		if (!internal.signal) internal.signal = sessionSignal();
		if (internal["__hcSessionEpoch"] === void 0) internal[SESSION_EPOCH_FIELD] = sessionEpoch();
		if (showLoading) startLoading();
		if (!config.headers.has("Authorization") && !config.headers.has("x-oauth-token")) {
			const token = getAccessToken();
			if (token) config.headers.set("Authorization", `Bearer ${token}`);
		}
		const fingerprint = generateFingerprint();
		if (!config.headers.has("x-req-fingerprint")) config.headers.set(SIGN_FINGERPRINT_HEADER, fingerprint);
		const isRetry = (config.__retryCount ?? 0) > 0;
		if (!isRetry && options.sign && options.signSecret && config.method !== "get") {
			const nonce = crypto.generateNonce();
			const timestamp = String(Date.now());
			const sorted = sortParams(collectParams(config));
			const sign = crypto.signRequest(sorted, nonce, fingerprint, timestamp, options.signSecret);
			config.headers.set(SIGN_NONCE_HEADER, nonce);
			config.headers.set(SIGN_TIMESTAMP_HEADER, timestamp);
			config.headers.set(SIGN_HEADER, sign);
		}
		const rc = options.requestCodec;
		if (!isRetry && rc?.enable === true && !!rc.key && hc?.codec === true && isEncryptable(config.data)) {
			const bodyText = typeof config.data === "string" ? config.data : JSON.stringify(config.data);
			config.data = encodeRequestBody(bodyText, {
				type: rc.type,
				key: rc.key
			});
			config.transformRequest = [(data) => data];
			config.headers.set(CODEC_KEY_HEADER, "1");
			if (!config.headers.has("Content-Type")) config.headers.set("Content-Type", "application/json");
		} else if (!isRetry && encrypt && isEncryptable(config.data)) {
			const bodyText = typeof config.data === "string" ? config.data : JSON.stringify(config.data);
			const { cipher, keyB64 } = crypto.encryptBody(bodyText);
			config.data = cipher;
			config.headers.set(ENCRYPT_HEADER, "1");
			config.headers.set(KEY_HEADER, keyB64);
			config.headers.set("Content-Type", "application/octet-stream");
		}
		return config;
	});
	/** 该请求是否显示 loading */
	const shouldLoading = (config) => {
		return (config?.hc)?.showLoading ?? options.showLoading;
	};
	instance.interceptors.response.use(async (response) => {
		if (shouldLoading(response.config)) doneLoading();
		const resVersion = response.headers[CONFIG_VERSION_HEADER];
		if (resVersion) upgrade(String(resVersion));
		const encryptHeader = response.headers[ENCRYPT_HEADER];
		const keyHeader = response.headers[KEY_HEADER];
		if (encryptHeader === "1" && keyHeader && response.data) {
			const rawData = typeof response.data === "string" ? base64ToBytes(response.data) : response.data;
			const noiseLevel = Number(response.headers["x-ot"] ?? 0);
			const { plainText, isJson } = crypto.decodeBody(rawData, keyHeader, noiseLevel);
			response.data = isJson ? JSON.parse(plainText) : plainText;
		}
		return checkApiResponse(response, (response.config?.hc)?.noToast ?? false);
	}, (error) => {
		if (shouldLoading(error.config)) doneLoading();
		const errorConfig = error?.config ?? void 0;
		if (isSessionAborted(error) || isStaleEpoch(errorConfig?.["__hcSessionEpoch"])) return Promise.reject(markSessionAborted(error));
		const retryConfig = error?.config;
		const status = error?.response?.status;
		const canceled = error?.code === "ERR_CANCELED" || error?.name === "CanceledError";
		const method = (retryConfig?.method ?? "get").toUpperCase();
		const signed = Boolean(options.sign && options.signSecret) && method !== "GET";
		const idempotent = IDEMPOTENT_METHODS.has(method);
		const hc = retryConfig?.hc ?? {};
		const hcRetry = hc.retry;
		const explicitRetry = hcRetry === true;
		const explicitNoRetry = hcRetry === false;
		const retryCount = options.retryCount ?? 0;
		const attempt = retryConfig?.__retryCount ?? 0;
		const noToast = hc.noToast ?? false;
		const toastEnable = getConfig().http?.toast?.enable ?? true;
		const willRetry = retryConfig && !canceled && !signed && !explicitNoRetry && (idempotent || explicitRetry) && retryCount > 0 && attempt < retryCount && (status === void 0 || status >= 500);
		if (!willRetry && !canceled && !noToast && toastEnable) {
			const msg = (() => {
				if (status === 502) return i18n.global.t("msg.http.serverBusy");
				if (status === 503) return i18n.global.t("msg.http.serverUnavailable");
				if (status === 504) return i18n.global.t("msg.http.serverTimeout");
				if (status >= 500) return i18n.global.t("msg.http.serverError");
				if (error?.code === "ERR_NETWORK" || /network/i.test(error?.message ?? "")) return i18n.global.t("msg.http.networkError");
				return "";
			})();
			if (msg) {
				if (claimErrorToast(msg)) {
					setSuppressNextMsg(true);
					msgError(msg);
				}
				if (error) {
					error.__toasted = true;
					error.message = void 0;
				}
			}
		}
		const bizCode = (error?.response?.data)?.code;
		const sessionExpired = status === 401 || Boolean(bizCode && RELOGIN_CODES.has(bizCode));
		if ((status === 401 || status === 403) && sessionExpired) {
			const loginUrl = getConfig().route?.loginPath || "/login";
			const action = getConfig().http?.authFailAction || "confirm";
			const loginHref = "/" + loginUrl.replace(/^\//, "");
			clearAllAuthData();
			const gotoLogin = () => {
				if (hasRouter()) {
					const router = getRouter();
					if (router.currentRoute.value.path !== loginUrl) router.replace(loginUrl).catch(() => {});
					return;
				}
				window.location.replace(loginHref);
			};
			const currentPath = window.location.pathname;
			const __loginFullPath = "/".replace(/\/$/, "") + "/" + loginUrl.replace(/^\//, "");
			const isOnLoginPage = currentPath === __loginFullPath || currentPath === __loginFullPath + "/";
			if (action === "redirect") gotoLogin();
			else if (!isOnLoginPage && !getAccessToken()) gotoLogin();
			else if (!isOnLoginPage) {
				if (!window.__authDialogOpen) {
					window.__authDialogOpen = true;
					ElMessageBox.confirm(status === 401 ? "登录已过期，请重新登录" : "当前操作没有权限，请重新登录", "提示", {
						confirmButtonText: "重新登录",
						showCancelButton: false,
						closeOnClickModal: false,
						type: "warning"
					}).then(() => {
						gotoLogin();
					}).finally(() => {
						window.__authDialogOpen = false;
					});
				}
			}
			return Promise.reject(error);
		}
		if (willRetry) {
			retryConfig.__retryCount = attempt + 1;
			const delay = (options.retryDelay ?? 1e3) * Math.pow(2, attempt);
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					instance.request(retryConfig).then(resolve, reject);
				}, delay);
			});
		}
		return Promise.reject(error);
	});
	return instance;
}
/** 判断请求体是否属于需要加密的 text/* 内容 */
function isEncryptable(data) {
	if (data == null) return false;
	if (typeof data === "string") return true;
	if (data instanceof FormData) return false;
	if (data instanceof URLSearchParams) return true;
	if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) return false;
	if (typeof data === "object") return true;
	return false;
}
//#endregion
//#region ../../packages/core/src/storage.ts
var storageInstance = null;
/** 注入 storage 实例（createApp 构建后调用） */
function setAppStorage(storage) {
	storageInstance = storage;
}
/** 获取 storage 实例；未注入时抛错 */
function getAppStorage() {
	if (!storageInstance) throw new Error("[core] storage 未注入，请先调用 setAppStorage()");
	return storageInstance;
}
//#endregion
//#region ../../packages/core/src/router/access.ts
/**
* 路由访问决策 —— 框架无关的鉴权纯函数
*
* 从 guard.ts 剥离出的核心判定逻辑：输入当前路由目标 + 鉴权上下文，
* 输出「放行 / 跳登录 / 跳首页 / 跳403」的决策。Vue（vue-router guard）
* 与 React（react-router loader / 守卫）共用同一份，保证两套框架的
* 鉴权与跳转逻辑完全一致。
*
* 不 import 任何框架类型（vue-router / react-router），只依赖 @repo/config 的
* 纯配置与 @repo/core 的 permission 内存权限。
*/
/** 无需登录即可访问的路由白名单（默认，可由 config.route.whiteList 覆盖） */
var ROUTER_WHITE_LIST = [
	"/login",
	"/403",
	"/404",
	"/500"
];
/**
* 计算对目标路由的访问决策。
*
* 判定顺序（与 guard.ts 保持一致）：
*   1. 未开启鉴权 → 放行
*   2. 登录页：已登录 → 跳首页；未登录 → 放行
*   3. 无 token → 跳登录页
*   4. meta.roles / meta.perms 校验 → 未通过跳 403
*   5. 其余放行
*
* @param target 目标路由（框架无关描述）
* @param context 鉴权上下文
* @param resolveTitle 标题解析（可选；默认取 meta.title，menu. 前缀走 i18n）
*/
function checkRouteAccess(target, context) {
	const config = getConfig();
	const route = config.route;
	const baseTitle = resolveTitleText(target.title);
	const title = baseTitle === "home" ? "" : baseTitle;
	if (!config.app.openAuth) return {
		type: "allow",
		title
	};
	const loginPath = route.loginPath || "/login";
	if (target.path === loginPath) {
		if (context.getAccessToken()) return {
			type: "redirect-home",
			title
		};
		return {
			type: "allow",
			title
		};
	}
	if (!context.getAccessToken()) return {
		type: "redirect-login",
		title
	};
	if (target.roles?.length && !hasRole(target.roles)) return {
		type: "redirect-forbidden",
		title
	};
	if (target.perms?.length && !hasPerm(target.perms)) return {
		type: "redirect-forbidden",
		title
	};
	return {
		type: "allow",
		title
	};
}
/** 标题解析：menu. 前缀走 i18n 翻译 */
function resolveTitleText(title) {
	if (!title) return "";
	return getMenuLanguage(title);
}
/** 计算并应用 document.title（Vue/React 共用） */
function applyDocumentTitle(title, appTitle) {
	if (typeof document === "undefined") return;
	const finalTitle = title && title !== appTitle ? `${title} - ${appTitle}` : appTitle;
	document.title = finalTitle;
}
//#endregion
//#region ../../packages/core/src/router/guard.ts
/**
* 判断路径是否命中白名单（无需登录即可访问）。
*
* <p>支持两种写法，以覆盖默认清单与常见的通配需求：</p>
* <ul>
*   <li>精确路径：{@code /login}</li>
*   <li>前缀通配：{@code /edu/**}（匹配 {@code /edu} 与其全部子路径）</li>
* </ul>
*
* <p>为何需要这个函数：守卫此前把 {@code whiteList} 取出来后从未消费，
* 白名单机制等于失效（见 {@code beforeEach} 内的说明）。</p>
*
* @param whiteList 白名单规则
* @param path      目标路径（{@code to.path}，不含 query）
* @returns 命中返回 true
*/
function isWhitelisted(whiteList, path) {
	return whiteList.some((pattern) => {
		if (!pattern) return false;
		if (pattern === path) return true;
		if (pattern.endsWith("/**")) {
			const prefix = pattern.slice(0, -3);
			return path === prefix || path.startsWith(prefix + "/");
		}
		return false;
	});
}
/** 安装路由守卫 */
function setupRouterGuard(router, options) {
	const { getAccessToken, loadRemoteRoutes, hooks } = options;
	options.layoutName;
	/**
	* 已回放过一次的深链路径（每个 Router 实例一份）。
	*
	* <p>冷启动深链在远程模式下会被 NotFound 兜底重定向到 /404，需回放到原路径；
	* 但**真** 404（路径在菜单注册后依旧不存在）若也无限回放会形成重定向环。
	* 每条路径只回放一次：第二次仍落 /404 时按白名单正常放行、渲染 404 页。</p>
	*/
	const replayedPaths = /* @__PURE__ */ new Set();
	router.beforeEach(async (to, from) => {
		const config = getConfig();
		const route = config.route;
		const whiteList = route.whiteList?.length ? route.whiteList : ROUTER_WHITE_LIST;
		hooks?.onBeforeEach?.(to, from);
		const customTitle = hooks?.resolveTitle?.(to);
		const rawTitle = getMenuLanguage(to.meta?.title || "") || config.app.title;
		const title = customTitle ?? (rawTitle === "home" ? "" : rawTitle);
		document.title = title && title !== config.app.title ? `${title} - ${config.app.title}` : config.app.title;
		if (!config.app.openAuth) return true;
		const custom = hooks?.beforeEach?.(to, from);
		if (custom !== void 0) return custom;
		if (to.path === route.loginPath) {
			try {
				getAppStorage().clearUserStorage();
			} catch {}
			if (getAccessToken()) return {
				path: route.homePath,
				replace: true
			};
			return true;
		}
		const rfPath = to.redirectedFrom?.path;
		const unresolvedDeepLink = to.path === "/404" && !!rfPath && rfPath !== "/404" && (route.mode === "remote" || route.mode === "all") && !!loadRemoteRoutes && !!getAccessToken() && !replayedPaths.has(rfPath);
		if (isWhitelisted(whiteList, to.path) && !unresolvedDeepLink) return true;
		if (!getAccessToken()) return {
			path: route.loginPath,
			replace: true
		};
		const isRemote = route.mode === "remote" || route.mode === "all";
		const originalPath = to.redirectedFrom?.path || to.path;
		if (isRemote && loadRemoteRoutes && originalPath !== route.loginPath) {
			await loadRemoteRoutes(router);
			if (!getAccessToken()) return {
				path: route.loginPath,
				replace: true
			};
			if (to.path === "/404" && to.redirectedFrom && to.redirectedFrom.path !== "/404" || to.matched.length > 0 && to.matched[to.matched.length - 1]?.path?.includes("pathMatch")) {
				const back = to.redirectedFrom;
				if (back) {
					replayedPaths.add(back.path);
					return {
						path: back.path,
						query: back.query,
						hash: back.hash,
						replace: true
					};
				}
				return {
					path: originalPath,
					replace: true
				};
			}
		}
		const decision = checkRouteAccess({
			path: to.path,
			title: to.meta?.title || "",
			roles: to.meta?.roles,
			perms: to.meta?.perms
		}, { getAccessToken });
		if (decision.type === "redirect-login") return {
			path: route.loginPath,
			replace: true
		};
		if (decision.type === "redirect-home") return {
			path: route.homePath,
			replace: true
		};
		if (decision.type === "redirect-forbidden") return {
			path: route.forbiddenPath,
			replace: true
		};
		return true;
	});
	router.afterEach((to, from) => {
		hooks?.onAfterEach?.(to, from);
	});
	router.onError((error) => {
		hooks?.onError?.(error);
	});
}
//#endregion
//#region ../../packages/core/src/router/themeBridge.ts
/**
* 主题路由桥接（core）—— 按 themeId 收敛 home/login/error 基础路由
*
* core 不静态依赖 @repo/theme（避免循环依赖），通过运行时 import() 懒加载：
*  - getConfig().other.themeId 决定主题
*  - 业务已提供 layoutRoutes → 使用业务的，不追加
*  - 业务未提供 → 调 @repo/theme 的 getThemeRoutes(themeId) 取主题组件，按固定格式生成
*
* error 路由优先级：
*  - 主题提供了 error 组件 → 使用主题的
*  - 未提供 → 回退到 @repo/pages 的默认错误页
*/
/** 路由是否已包含 login / layout / home 关键路由 */
function hasBaseRoutes(routes) {
	const names = new Set(routes.map((r) => r.name));
	return names.has("login") || names.has("layout") || names.has("homePage") || names.has("home");
}
/**
* 错误页 fallback 组件（懒加载 @repo/pages 默认实现）
* 通过运行时 import 避免 core 静态依赖 @repo/pages
*/
async function defaultErrorComponent(name) {
	try {
		const mod = await __vitePreload(() => import("./src-CPcp-WOr.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]));
		if (name === "403") return mod.error403 ?? mod.error404;
		if (name === "500") return mod.error500 ?? mod.error404;
		return mod.error404 ?? mod.error403;
	} catch {
		return (() => Promise.resolve({}));
	}
}
/**
* 按固定格式生成基础路由（login + layout 包 home + redirect + error 三件套 + 404 兜底）
* @param components 主题页面组件
*/
function buildBaseRoutes(components) {
	const route = getConfig().route;
	const loginPath = route.loginPath || "/login";
	const homePath = route.homePath || "/home";
	const personagePath = route.personagePath || "/personage";
	return [
		{
			path: loginPath,
			name: "login",
			component: components.login,
			meta: { title: "login" }
		},
		{
			path: "/",
			name: "layout",
			component: components.layout,
			redirect: homePath,
			children: [{
				path: homePath,
				name: "home",
				component: components.home,
				meta: {
					title: "home",
					affix: true
				}
			}, ...components.mine ? [{
				path: personagePath,
				name: "personage",
				component: components.mine,
				meta: {
					title: "menu.system.personage.name",
					icon: "koi-profile-circle",
					showLink: false,
					keepAlive: true
				}
			}] : []]
		},
		{
			path: route.forbiddenPath || "/403",
			name: "403",
			component: components.error?.forbidden,
			meta: {
				title: "403",
				showLink: false
			}
		},
		{
			path: "/404",
			name: "404",
			component: components.error?.notFound,
			meta: {
				title: "404",
				showLink: false
			}
		},
		{
			path: "/500",
			name: "500",
			component: components.error?.serverError,
			meta: {
				title: "500",
				showLink: false
			}
		},
		{
			path: "/:pathMatch(.*)*",
			redirect: "/404"
		}
	];
}
/** 异步确保错误页组件：主题未提供时懒加载 @repo/pages 回退 */
async function ensureErrorComponents(components) {
	if (components.error?.forbidden && components.error?.notFound && components.error?.serverError) return components;
	return {
		...components,
		error: {
			forbidden: components.error?.forbidden ?? await defaultErrorComponent("403"),
			notFound: components.error?.notFound ?? await defaultErrorComponent("404"),
			serverError: components.error?.serverError ?? await defaultErrorComponent("500")
		}
	};
}
/** 按 themeId 从 @repo/theme 解析主题基础路由组件（运行时懒加载） */
async function resolveThemeBaseRoutes(themeId) {
	try {
		const components = (await __vitePreload(() => import("./src-D3ABR126.js"), __vite__mapDeps([17,18,4,1,2,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,5,42,43,44,45,46,47,48,6,49,50,51]))).getThemeRoutes?.(themeId);
		if (!components) return void 0;
		return ensureErrorComponents(components);
	} catch (error) {
		log.warn(`[router] 主题路由解析失败`, error);
		return;
	}
}
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
/**
* 注册菜单 → 视图映射（懒加载）。
*
* @param modules key 为 `views/{component}.vue`（与后端菜单 component 字段对应），
* value 为 `() => import(...)` 懒加载 loader。
* @example
* registerMenuViewModules({
*   "views/system/user/index.vue": () => import("./views/UserManage.vue"),
* });
*/
function registerMenuViewModules(modules) {
	Object.entries(modules).forEach(([key, loader]) => {
		if (loader) extraViewModules.set(key, loader);
	});
}
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
	const _position = (i) => (i.sysMenuPosition ?? i.position ?? i.meta?.position) === "top" ? "top" : "standard";
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
//#endregion
//#region ../../packages/core/src/router/index.ts
/**
* 路由创建器 —— 三模式（静态 / 模块 / 远程）统一装配
*
* 路由来源由 config.route.mode 决定：
*   - static：业务路由全部由代码提供（routes 参数），无远程加载
*   - module：按 config.route.modulePaths 装配本地页面模块路由（路由表由业务侧传入）
*   - remote：布局/基础路由静态注册，业务路由由 loadRemoteRoutes 动态注册到 layout 下
*
* 用法：
*   const router = createAppRouter({
*     layoutRoutes: [...登录页/布局/错误页],
*     routes: [...业务路由],
*     getAccessToken: () => token.getAccessToken(),
*     loadRemoteRoutes: async (router) => { ...addRoute 到 layout },
*     hooks: { onBeforeEach: () => startLoading(), onAfterEach: () => doneLoading() },
*   });
*
* 注意：进度条请用 @repo/core 的引用计数版本 startLoading/doneLoading（见 progress.ts），
* 勿直接用 nprogress.start/done，避免并发请求下进度条提前隐藏或悬挂。
*/
/** 全局默认路由（404 兜底） */
var defaultFallback = [{
	path: "/:pathMatch(.*)*",
	name: "NotFound",
	redirect: "/404"
}];
/** 创建应用路由实例 */
function createAppRouter(options = {}) {
	const { layoutRoutes = [], routes = [], fallback = defaultFallback, mode = "history", resolveBaseRoutes } = options;
	const config = getConfig();
	const routeConfig = config.route;
	const businessRoutes = routeConfig.mode === "remote" && !routeConfig.mergeLocalMenu ? [] : routes;
	const initialLayoutRoutes = layoutRoutes;
	const router = createRouter({
		history: mode === "hash" ? createWebHashHistory("/") : createWebHistory("/"),
		routes: [
			...initialLayoutRoutes,
			...businessRoutes,
			...fallback
		],
		scrollBehavior: () => ({
			left: 0,
			top: 0
		})
	});
	if (mode === "hash" && typeof window !== "undefined") {
		const basePath = new URL("/", window.location.origin).pathname.replace(/\/$/, "");
		const currentPath = window.location.pathname.replace(/\/$/, "");
		if (currentPath !== basePath && window.location.hash) window.history.replaceState(null, "", `${basePath || "/"}${window.location.search || ""}${window.location.hash}`);
		else if (currentPath !== basePath && !window.location.hash) window.history.replaceState(null, "", `${basePath || "/"}${window.location.search || ""}${window.location.hash || "#/"}`);
	}
	let baseRoutesReady = void 0;
	router.__baseRoutesReady = void 0;
	setupRouterGuard(router, {
		getAccessToken: options.getAccessToken ?? (() => ""),
		layoutName: options.layoutName,
		loadRemoteRoutes: options.loadRemoteRoutes,
		hooks: options.hooks
	});
	if (options.setup) options.setup(router);
	if (!hasBaseRoutes(initialLayoutRoutes) && (resolveBaseRoutes || config.other.themeId)) {
		baseRoutesReady = (resolveBaseRoutes ?? (() => resolveThemeBaseRoutes(config.other.themeId)))().then((components) => {
			if (components) buildBaseRoutes(components).forEach((route) => {
				if (!router.hasRoute(String(route.name))) router.addRoute(route);
			});
		}).catch((error) => {
			log.warn(`[router] 基础路由注册失败`, error);
		});
		router.__baseRoutesReady = baseRoutesReady;
	}
	return router;
}
/**
* 等待基础路由注册完成。
* 业务应用在调用 router.use / 初始导航前 await 此方法，避免
* 基础路由未注册时被 404 兜底命中而陷入重定向循环。
*
* 若此前注册未成功（如主题框架尚未加载导致组件缺失），会在此
* 重新解析并注册（幂等，已注册的路由会被跳过）。
*/
async function waitForBaseRoutes(router) {
	const r = router;
	if (r.__baseRoutesReady) await r.__baseRoutesReady;
	if (!hasBaseRoutes(router.getRoutes().map((x) => x))) {
		const config = getConfig();
		const resolver = () => resolveThemeBaseRoutes(config.other.themeId);
		try {
			const components = await resolver();
			if (components) buildBaseRoutes(components).forEach((route) => {
				if (!router.hasRoute(String(route.name))) router.addRoute(route);
			});
		} catch (error) {
			log.warn(`[router] 基础路由补注册失败`, error);
		}
	}
}
//#endregion
//#region ../../packages/work/src/timer/index.ts
/** Worker 实例 */
var worker = null;
/** 订阅者集合（模块级单例，全局共享） */
var subscribers = /* @__PURE__ */ new Set();
/** 获取或创建 Worker 实例 */
function getWorker() {
	if (worker) return worker;
	if (typeof Worker === "undefined" || typeof self === "undefined") return null;
	worker = new Worker(new URL(
		/* @vite-ignore */
		"/assets/timer.worker-DbjoAk4o.js",
		"" + import.meta.url
	), { type: "module" });
	worker.onmessage = (event) => {
		const tick = event.data;
		if (!tick || typeof tick !== "object" || !Array.isArray(tick.zones)) return;
		subscribers.forEach((handler) => {
			try {
				handler(tick);
			} catch {}
		});
	};
	worker.onerror = (err) => {
		log.warn(`[timer worker] error:`, err.message ?? "unknown");
	};
	return worker;
}
/**
* 创建定时器 Worker 客户端（模块级单例）
*/
function createTimerWorker() {
	/** 通知 Worker 更新时区配置（未启动则自动启动） */
	function post(message) {
		const w = getWorker();
		if (!w) return;
		w.postMessage({
			type: message.type,
			zones: Array.from(message.zones ?? [])
		});
	}
	/**
	* 启动定时推送（可重复调用以更新时区）
	* @param zones - UTC 偏移小时列表（-12 ~ +12，最多 3 个）
	*/
	function start(zones) {
		post({
			type: "start",
			zones
		});
	}
	/** 更新时区配置（不停止推送） */
	function update(zones) {
		post({
			type: "update",
			zones
		});
	}
	/** 订阅每次推送 */
	function subscribe(handler) {
		subscribers.add(handler);
		return () => subscribers.delete(handler);
	}
	/** 停止推送（不销毁模块） */
	function stop() {
		post({ type: "stop" });
	}
	/** 销毁 Worker 并清空模块（页面卸载时调用） */
	function destroy() {
		if (worker) {
			worker.terminate();
			worker = null;
		}
		subscribers.clear();
	}
	return {
		start,
		update,
		subscribe,
		stop,
		destroy
	};
}
/** 全局定时器 Worker 客户端（createApp 启动时注册） */
var globalTimer = null;
/**
* 注册全局定时器（系统启动调用一次）
*
* @param zones 初始时区（UTC 偏移小时，-12 ~ +12，最多 3 个）
* @returns 当前时区配置
*/
function initGlobalTimer(zones = []) {
	if (!globalTimer) globalTimer = createTimerWorker();
	globalTimer.start(zones);
}
/**
* 获取全局定时器（createApp 启动后可用）
* 全局未注册时降级创建（幂等），保证后续组件都能直接订阅。
*/
function getGlobalTimer() {
	if (!globalTimer) globalTimer = createTimerWorker();
	return globalTimer;
}
/**
* 销毁全局定时器（应用卸载时调用）
* 注意：销毁后 createTimerWorker 模块级订阅者会被清空，再次使用需重新订阅。
*/
function destroyGlobalTimer() {
	if (globalTimer) {
		globalTimer.destroy();
		globalTimer = null;
	}
}
//#endregion
//#region ../../packages/work/src/scheduler/serviceWorkerScheduler.ts
/**
* Service Worker 策略 —— 浏览器后台任务（最优先）。
*
* 优势：即使页面后台化 / 关闭，SW 仍可独立运行 setInterval 并向受控页面广播，
* 适合长期周期刷新（天气 / 台风 / 定位）。
*
* 兼容性：仅 HTTPS（或 localhost）+ 现代浏览器支持。不支持时返回 null，
* 由调度器降级到 Web Worker / setInterval。
*/
function createServiceWorkerScheduler(options) {
	const isSecure = typeof window !== "undefined" && window.isSecureContext;
	if (!(typeof navigator !== "undefined" && "serviceWorker" in navigator && isSecure)) return null;
	let started = false;
	let registration = null;
	let bound = false;
	/** 发送指令到当前 controller（未激活则等待 ready） */
	function post(msg) {
		const sw = navigator.serviceWorker.controller;
		if (sw) {
			sw.postMessage({
				...msg,
				name: options.name
			});
			return;
		}
		navigator.serviceWorker.ready.then((reg) => {
			reg.active?.postMessage({
				...msg,
				name: options.name
			});
		});
	}
	function bindMessages() {
		if (bound) return;
		bound = true;
		navigator.serviceWorker.addEventListener("message", (event) => {
			const data = event.data;
			if (data?.type === "tick" && data.name === options.name) options.onTick();
		});
	}
	async function ensureRegistered() {
		if (registration) return true;
		try {
			const swUrl = new URL("data:video/mp2t;base64,LyoqCiAqIOiwg+W6puWZqCBTZXJ2aWNlIFdvcmtlciDigJTigJQg5rWP6KeI5Zmo5ZCO5Y+w5ZGo5pyf5Lu75YqhCiAqCiAqIOazqOWGjOWQjueUseS4u+e6v+eoi+mAmui/hyBwb3N0TWVzc2FnZSDkuIvlj5Hku7vliqHvvIxXb3JrZXIg5Zyo5ZCO5Y+w54us56uL6L+Q6KGMIHNldEludGVydmFs77yMCiAqIOWIsOeCuemAmui/hyBjbGllbnRzIOWQkeaJgOacieWPl+aOp+mhtemdouW5v+aSrSB0aWNr44CCCiAqCiAqIOa2iOaBr+WNj+iuru+8mgogKiAgIOS4u+e6v+eoiyDihpIgU1fvvJp7IHR5cGU6ICJzdGFydCIsIG5hbWUsIGludGVydmFsIH0gfCB7IHR5cGU6ICJzdG9wIiwgbmFtZSB9CiAqICAgU1cg4oaSIOmhtemdou+8mnsgdHlwZTogInRpY2siLCBuYW1lIH0KICoKICog5rOo5oSP77ya5q2k5paH5Lu26ZyA6YCa6L+HIG5ldyBVUkwoIi4vc2NoZWR1bGVyLnN3LnRzIiwgaW1wb3J0Lm1ldGEudXJsKSDms6jlhozvvIwKICog55SxIFZpdGUg57yW6K+R5Li654us56uLIGNodW5r77yM5rWP6KeI5Zmo6YCa6L+HIEhUVFBTIOWKoOi9veOAggogKi8KdHlwZSBUYXNrTWFwID0gTWFwPHN0cmluZywgUmV0dXJuVHlwZTx0eXBlb2Ygc2V0SW50ZXJ2YWw+PjsKY29uc3QgdGFza3M6IFRhc2tNYXAgPSBuZXcgTWFwKCk7CgpmdW5jdGlvbiBub3RpZnlUaWNrKG5hbWU6IHN0cmluZyk6IHZvaWQgewogIHZvaWQgY2xpZW50cy5tYXRjaEFsbCh7IHR5cGU6ICJ3aW5kb3ciLCBpbmNsdWRlVW5jb250cm9sbGVkOiB0cnVlIH0pLnRoZW4oKGxpc3QpID0+IHsKICAgIGxpc3QuZm9yRWFjaCgoY2xpZW50KSA9PiBjbGllbnQucG9zdE1lc3NhZ2UoeyB0eXBlOiAidGljayIsIG5hbWUgfSkpOwogIH0pOwp9CgpmdW5jdGlvbiBzdGFydFRhc2sobmFtZTogc3RyaW5nLCBpbnRlcnZhbDogbnVtYmVyKTogdm9pZCB7CiAgc3RvcFRhc2sobmFtZSk7CiAgY29uc3Qgc2FmZSA9IE1hdGgubWF4KDEwMDAsIE51bWJlcihpbnRlcnZhbCkgfHwgMzYwMDAwMCk7CiAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiBub3RpZnlUaWNrKG5hbWUpLCBzYWZlKTsKICB0YXNrcy5zZXQobmFtZSwgdGltZXIpOwp9CgpmdW5jdGlvbiBzdG9wVGFzayhuYW1lOiBzdHJpbmcpOiB2b2lkIHsKICBjb25zdCB0aW1lciA9IHRhc2tzLmdldChuYW1lKTsKICBpZiAodGltZXIpIHsKICAgIGNsZWFySW50ZXJ2YWwodGltZXIpOwogICAgdGFza3MuZGVsZXRlKG5hbWUpOwogIH0KfQoKY29uc3Qgc3cgPSBzZWxmIGFzIHVua25vd24gYXMgU2VydmljZVdvcmtlckdsb2JhbFNjb3BlOwoKc3cuYWRkRXZlbnRMaXN0ZW5lcigiaW5zdGFsbCIsICgpID0+IHsKICB2b2lkIHN3LnNraXBXYWl0aW5nKCk7Cn0pOwoKc3cuYWRkRXZlbnRMaXN0ZW5lcigiYWN0aXZhdGUiLCAoZXZlbnQ6IEV4dGVuZGFibGVNZXNzYWdlRXZlbnQpID0+IHsKICBldmVudC53YWl0VW50aWwoY2xpZW50cy5jbGFpbSgpKTsKfSk7Cgpzdy5hZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwgKGV2ZW50OiBFeHRlbmRhYmxlTWVzc2FnZUV2ZW50KSA9PiB7CiAgY29uc3QgbXNnID0gZXZlbnQuZGF0YTsKICBpZiAoIW1zZyB8fCB0eXBlb2YgbXNnICE9PSAib2JqZWN0IikgcmV0dXJuOwogIGlmIChtc2cudHlwZSA9PT0gInN0YXJ0IiAmJiBtc2cubmFtZSkgewogICAgc3RhcnRUYXNrKG1zZy5uYW1lLCBtc2cuaW50ZXJ2YWwpOwogIH0gZWxzZSBpZiAobXNnLnR5cGUgPT09ICJzdG9wIiAmJiBtc2cubmFtZSkgewogICAgc3RvcFRhc2sobXNnLm5hbWUpOwogIH0KfSk7CgpleHBvcnQge307", "" + import.meta.url).href;
			registration = await navigator.serviceWorker.register(swUrl, { type: "module" });
			registration.active ?? registration.installing ?? registration.waiting;
			return true;
		} catch {
			return false;
		}
	}
	async function start() {
		if (started) return;
		bindMessages();
		if (!await ensureRegistered()) return;
		started = true;
		post({
			type: "start",
			interval: options.interval
		});
		if (options.immediate) options.onTick();
	}
	function stop() {
		if (!started) return;
		started = false;
		post({ type: "stop" });
	}
	function destroy() {
		stop();
	}
	return {
		start,
		stop,
		destroy,
		strategy: "service-worker"
	};
}
//#endregion
//#region ../../packages/work/src/scheduler/webWorkerScheduler.ts
/**
* Web Worker 策略 —— 独立线程 setInterval，不受主线程节流影响。
* 浏览器兼容性：IE10+ / 所有现代浏览器。
*/
function createWebWorkerScheduler(options) {
	let worker = null;
	let started = false;
	function getWorker() {
		if (worker) return worker;
		if (typeof Worker === "undefined" || typeof self === "undefined") return null;
		try {
			worker = new Worker(new URL(
				/* @vite-ignore */
				"/assets/scheduler.worker-DV0mbFM6.js",
				"" + import.meta.url
			), { type: "module" });
			worker.onmessage = (e) => {
				if (e.data?.type === "tick") options.onTick();
			};
			worker.onerror = () => {
				log.warn(`[scheduler][${options.name}] web worker error, stopping`);
				stop();
			};
		} catch {
			return null;
		}
		return worker;
	}
	function start() {
		if (started) return;
		const w = getWorker();
		if (!w) return;
		started = true;
		w.postMessage({
			type: "start",
			interval: options.interval
		});
		if (options.immediate) options.onTick();
	}
	function stop() {
		if (!started) return;
		started = false;
		if (worker) worker.postMessage({ type: "stop" });
	}
	function destroy() {
		stop();
		if (worker) {
			worker.terminate();
			worker = null;
		}
	}
	return {
		start,
		stop,
		destroy,
		strategy: "web-worker"
	};
}
//#endregion
//#region ../../packages/work/src/scheduler/intervalScheduler.ts
/**
* setInterval 降级策略 —— 主线程定时器，后台标签页可能被浏览器节流。
* 作为 Service Worker / Web Worker 均不可用时的最终降级。
*/
function createIntervalScheduler(options) {
	let timer = null;
	let started = false;
	function start() {
		if (started) return;
		started = true;
		if (options.immediate) options.onTick();
		timer = setInterval(() => {
			options.onTick();
		}, Math.max(1e3, options.interval));
	}
	function stop() {
		if (!started) return;
		started = false;
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}
	}
	function destroy() {
		stop();
	}
	return {
		start,
		stop,
		destroy,
		strategy: "interval"
	};
}
//#endregion
//#region ../../packages/work/src/scheduler/index.ts
/**
* 创建统一调度器（自动选择策略降级）
*
* @example
* ```ts
* const scheduler = createScheduler({
*   name: "weather",
*   interval: 3600000,
*   onTick: () => fetchWeather(),
*   immediate: true,
* });
* scheduler.start();
* console.log("strategy:", scheduler.strategy); // "service-worker" | "web-worker" | "interval"
* // ...
* scheduler.destroy();
* ```
*/
function createScheduler(options) {
	const sw = createServiceWorkerScheduler(options);
	if (sw) return wrapStart(sw);
	if (typeof Worker !== "undefined" && typeof self !== "undefined") return wrapStart(createWebWorkerScheduler(options));
	return wrapStart(createIntervalScheduler(options));
}
/** 包装 start 为幂等可 Promise 化（SW 注册是异步的，start 可能需 await） */
function wrapStart(scheduler) {
	const originalStart = scheduler.start.bind(scheduler);
	scheduler.start = () => {
		const result = originalStart();
		if (result instanceof Promise) result.catch((err) => log.warn(`[scheduler] start failed:`, err));
	};
	return scheduler;
}
var { addListener, launch, removeListener, stop } = (/* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(t, n) {
		"object" == typeof exports && "object" == typeof module ? module.exports = n() : "function" == typeof define && define.amd ? define([], n) : "object" == typeof exports ? exports.devtoolsDetector = n() : t.devtoolsDetector = n();
	})("undefined" != typeof self ? self : exports, function() {
		return function(t) {
			var n = {};
			function e(r) {
				if (n[r]) return n[r].exports;
				var o = n[r] = {
					i: r,
					l: !1,
					exports: {}
				};
				return t[r].call(o.exports, o, o.exports, e), o.l = !0, o.exports;
			}
			return e.m = t, e.c = n, e.d = function(t, n, r) {
				e.o(t, n) || Object.defineProperty(t, n, {
					configurable: !1,
					enumerable: !0,
					get: r
				});
			}, e.n = function(t) {
				var n = t && t.__esModule ? function() {
					return t.default;
				} : function() {
					return t;
				};
				return e.d(n, "a", n), n;
			}, e.o = function(t, n) {
				return Object.prototype.hasOwnProperty.call(t, n);
			}, e.p = "", e(e.s = 4);
		}([
			function(t, n, e) {
				"use strict";
				e.d(n, "i", function() {
					return l;
				}), e.d(n, "d", function() {
					return f;
				}), e.d(n, "e", function() {
					return h;
				}), e.d(n, "c", function() {
					return d;
				}), e.d(n, "h", function() {
					return p;
				}), e.d(n, "f", function() {
					return b;
				}), e.d(n, "b", function() {
					return v;
				}), e.d(n, "g", function() {
					return y;
				}), e.d(n, "a", function() {
					return w;
				});
				var r, o, i, u, c, a = e(3), s = Object(a.b)(), l = (null === (r = null === s || void 0 === s ? void 0 : s.navigator) || void 0 === r ? void 0 : r.userAgent) || "unknown", f = "InstallTrigger" in ((null === s || void 0 === s ? void 0 : s.window) || {}) || /firefox/i.test(l), h = /trident/i.test(l) || /msie/i.test(l), d = /edge/i.test(l) || /EdgiOS/i.test(l), p = /webkit/i.test(l), b = /IqiyiApp/.test(l), v = void 0 !== (null === (o = null === s || void 0 === s ? void 0 : s.window) || void 0 === o ? void 0 : o.chrome) || /chrome/i.test(l) || /CriOS/i.test(l), y = "[object SafariRemoteNotification]" === ((null === (u = null === (i = null === s || void 0 === s ? void 0 : s.window) || void 0 === i ? void 0 : i.safari) || void 0 === u ? void 0 : u.pushNotification) || !1).toString() || /safari/i.test(l) && !v, w = "function" == typeof (null === (c = s.document) || void 0 === c ? void 0 : c.createElement);
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "b", function() {
					return i;
				}), e.d(n, "c", function() {
					return u;
				}), e.d(n, "a", function() {
					return c;
				});
				var r = e(0);
				function o(t) {
					if (r.a && console) {
						if (!r.e && !r.c) return console[t];
						if ("log" === t || "clear" === t) return function() {
							for (var n = [], e = 0; e < arguments.length; e++) n[e] = arguments[e];
							console[t].apply(console, n);
						};
					}
					return function() {
						for (var t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
					};
				}
				var i = o("log"), u = o("table"), c = o("clear");
			},
			function(t, n, e) {
				"use strict";
				n.a = function(t) {
					void 0 === t && (t = {});
					for (var n = t.includes, e = void 0 === n ? [] : n, r = t.excludes, o = void 0 === r ? [] : r, i = !1, u = !1, c = 0, a = e; c < a.length; c++) {
						var s = a[c];
						if (!0 === s) {
							i = !0;
							break;
						}
					}
					for (var l = 0, f = o; l < f.length; l++) {
						var s = f[l];
						if (!0 === s) {
							u = !0;
							break;
						}
					}
					return i && !u;
				};
			},
			function(t, n, e) {
				"use strict";
				(function(t) {
					n.b = c, n.a = function() {
						for (var t, n = [], e = 0; e < arguments.length; e++) n[e] = arguments[e];
						var r = c();
						if (null === r || void 0 === r ? void 0 : r.document) return (t = r.document).createElement.apply(t, n);
						return {};
					}, n.c = function() {
						if (r) return r;
						if (!a) return;
						var t = new Blob([o.a.workerScript]);
						try {
							var n = URL.createObjectURL(t);
							r = new o.a(new Worker(n)), URL.revokeObjectURL(n);
						} catch (t) {
							try {
								r = new o.a(new Worker("data:text/javascript;base64,".concat(btoa(o.a.workerScript))));
							} catch (t) {
								a = !1;
							}
						}
						return r;
					}, e.d(n, "d", function() {
						return s;
					});
					var r, o = e(10), i = this && this.__awaiter || function(t, n, e, r) {
						return new (e || (e = Promise))(function(o, i) {
							function u(t) {
								try {
									a(r.next(t));
								} catch (t) {
									i(t);
								}
							}
							function c(t) {
								try {
									a(r.throw(t));
								} catch (t) {
									i(t);
								}
							}
							function a(t) {
								t.done ? o(t.value) : function(t) {
									return t instanceof e ? t : new e(function(n) {
										n(t);
									});
								}(t.value).then(u, c);
							}
							a((r = r.apply(t, n || [])).next());
						});
					}, u = this && this.__generator || function(t, n) {
						var e, r, o, i, u = {
							label: 0,
							sent: function() {
								if (1 & o[0]) throw o[1];
								return o[1];
							},
							trys: [],
							ops: []
						};
						return i = {
							next: c(0),
							throw: c(1),
							return: c(2)
						}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
							return this;
						}), i;
						function c(c) {
							return function(a) {
								return function(c) {
									if (e) throw new TypeError("Generator is already executing.");
									for (; i && (i = 0, c[0] && (u = 0)), u;) try {
										if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
										switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
											case 0:
											case 1:
												o = c;
												break;
											case 4: return u.label++, {
												value: c[1],
												done: !1
											};
											case 5:
												u.label++, r = c[1], c = [0];
												continue;
											case 7:
												c = u.ops.pop(), u.trys.pop();
												continue;
											default:
												if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
													u = 0;
													continue;
												}
												if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
													u.label = c[1];
													break;
												}
												if (6 === c[0] && u.label < o[1]) {
													u.label = o[1], o = c;
													break;
												}
												if (o && u.label < o[2]) {
													u.label = o[2], u.ops.push(c);
													break;
												}
												o[2] && u.ops.pop(), u.trys.pop();
												continue;
										}
										c = n.call(t, u);
									} catch (t) {
										c = [6, t], r = 0;
									} finally {
										e = o = 0;
									}
									if (5 & c[0]) throw c[1];
									return {
										value: c[0] ? c[1] : void 0,
										done: !0
									};
								}([c, a]);
							};
						}
					};
					function c() {
						return "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0 !== t ? t : this;
					}
					var a = !0;
					var s = function() {
						return i(this, void 0, void 0, function() {
							var t;
							return u(this, function(n) {
								switch (n.label) {
									case 0:
										if (t = !1, !navigator.brave) return [3, 4];
										if (!navigator.brave.isBrave) return [3, 4];
										n.label = 1;
									case 1: return n.trys.push([
										1,
										3,
										,
										4
									]), [4, Promise.race([navigator.brave.isBrave(), new Promise(function(t) {
										return setTimeout(function() {
											return t(!1);
										}, 1e3);
									})])];
									case 2: return t = n.sent(), [3, 4];
									case 3: return n.sent(), [3, 4];
									case 4: return s = function() {
										return i(this, void 0, void 0, function() {
											return u(this, function(n) {
												return [2, t];
											});
										});
									}, [2, t];
								}
							});
						});
					};
				}).call(n, e(9));
			},
			function(t, n, e) {
				"use strict";
				Object.defineProperty(n, "__esModule", { value: !0 }), n.addListener = function(t) {
					h.addListener(t);
				}, n.removeListener = function(t) {
					h.removeListener(t);
				}, n.isLaunch = function() {
					return h.isLaunch();
				}, n.launch = function() {
					h.launch();
				}, n.stop = function() {
					h.stop();
				}, n.setDetectDelay = function(t) {
					h.setDetectDelay(t);
				};
				var r = e(8), o = e(12);
				e.d(n, "DevtoolsDetector", function() {
					return r.a;
				}), e.d(n, "checkers", function() {
					return o;
				});
				var i = e(23);
				e.d(n, "crashBrowserCurrentTab", function() {
					return i.b;
				}), e.d(n, "crashBrowser", function() {
					return i.a;
				});
				var u = e(2);
				e.d(n, "match", function() {
					return u.a;
				});
				var c = e(3);
				e.d(n, "getGlobalThis", function() {
					return c.b;
				}), e.d(n, "createElement", function() {
					return c.a;
				}), e.d(n, "getWorkerConsole", function() {
					return c.c;
				}), e.d(n, "isBrave", function() {
					return c.d;
				});
				var a = e(24);
				e.d(n, "versionMap", function() {
					return a.a;
				});
				var s = e(0);
				e.d(n, "userAgent", function() {
					return s.i;
				}), e.d(n, "isFirefox", function() {
					return s.d;
				}), e.d(n, "isIE", function() {
					return s.e;
				}), e.d(n, "isEdge", function() {
					return s.c;
				}), e.d(n, "isWebkit", function() {
					return s.h;
				}), e.d(n, "isIqiyiApp", function() {
					return s.f;
				}), e.d(n, "isChrome", function() {
					return s.b;
				}), e.d(n, "isSafari", function() {
					return s.g;
				}), e.d(n, "inBrowser", function() {
					return s.a;
				});
				var l = e(1);
				e.d(n, "log", function() {
					return l.b;
				}), e.d(n, "table", function() {
					return l.c;
				}), e.d(n, "clear", function() {
					return l.a;
				});
				var f = e(5);
				e.d(n, "isMac", function() {
					return f.d;
				}), e.d(n, "isIpad", function() {
					return f.b;
				}), e.d(n, "isIphone", function() {
					return f.c;
				}), e.d(n, "isAndroid", function() {
					return f.a;
				}), e.d(n, "isWindows", function() {
					return f.e;
				});
				var h = new r.a({ checkers: [
					o.erudaChecker,
					o.elementIdChecker,
					o.devtoolsFormatterChecker,
					o.performanceChecker,
					o.debuggerChecker
				] });
				n.default = h;
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "d", function() {
					return o;
				}), e.d(n, "b", function() {
					return i;
				}), e.d(n, "c", function() {
					return u;
				}), e.d(n, "a", function() {
					return c;
				}), e.d(n, "e", function() {
					return a;
				});
				var r = e(0), o = /macintosh/i.test(r.i), i = /ipad/i.test(r.i) || o && navigator.maxTouchPoints > 1, u = /iphone/i.test(r.i), c = /android/i.test(r.i), a = /windows/i.test(r.i);
			},
			function(t, n, e) {
				"use strict";
				n.a = function() {
					if ("undefined" != typeof performance) return performance.now();
					return Date.now();
				};
			},
			function(t, n, e) {
				"use strict";
				n.a = function() {
					null === r && (r = function() {
						for (var t = function() {
							for (var t = {}, n = 0; n < 500; n++) t["".concat(n)] = "".concat(n);
							return t;
						}(), n = [], e = 0; e < 50; e++) n.push(t);
						return n;
					}());
					return r;
				};
				var r = null;
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return u;
				});
				var r = e(0), o = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, i = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, u = function() {
					function t(t) {
						var n = t.checkers;
						this._listeners = [], this._isOpen = !1, this._detectLoopStopped = !0, this._detectLoopDelay = 500, this._checkers = n.slice();
					}
					return Object.defineProperty(t.prototype, "isOpen", {
						get: function() {
							return this._isOpen;
						},
						enumerable: !1,
						configurable: !0
					}), t.prototype.launch = function() {
						r.a && (this._detectLoopDelay <= 0 && this.setDetectDelay(500), this._detectLoopStopped && (this._detectLoopStopped = !1, this._detectLoop()));
					}, t.prototype.stop = function() {
						this._detectLoopStopped || (this._detectLoopStopped = !0, this._isOpen = !1, clearTimeout(this._timer));
					}, t.prototype.isLaunch = function() {
						return !this._detectLoopStopped;
					}, t.prototype.setDetectDelay = function(t) {
						this._detectLoopDelay = t;
					}, t.prototype.addListener = function(t) {
						this._listeners.push(t);
					}, t.prototype.removeListener = function(t) {
						this._listeners = this._listeners.filter(function(n) {
							return n !== t;
						});
					}, t.prototype._broadcast = function(t) {
						for (var n = 0, e = this._listeners; n < e.length; n++) {
							var r = e[n];
							try {
								r(t.isOpen, t);
							} catch (t) {}
						}
					}, t.prototype._detectLoop = function() {
						return o(this, void 0, void 0, function() {
							var t, n, e, r, o, u = this;
							return i(this, function(i) {
								switch (i.label) {
									case 0: t = !1, n = "", e = 0, r = this._checkers, i.label = 1;
									case 1: return e < r.length ? [4, (o = r[e]).isEnable()] : [3, 6];
									case 2: return i.sent() ? (n = o.name, [4, o.isOpen()]) : [3, 4];
									case 3: t = i.sent(), i.label = 4;
									case 4:
										if (t) return [3, 6];
										i.label = 5;
									case 5: return e++, [3, 1];
									case 6: return t !== this._isOpen && (this._isOpen = t, this._broadcast({
										isOpen: t,
										checkerName: n
									})), this._detectLoopDelay > 0 && !this._detectLoopStopped ? this._timer = setTimeout(function() {
										return u._detectLoop();
									}, this._detectLoopDelay) : this.stop(), [2];
								}
							});
						});
					}, t;
				}();
			},
			function(t, n) {
				var e = function() {
					return this;
				}();
				try {
					e = e || Function("return this")() || (0, eval)("this");
				} catch (t) {
					"object" == typeof window && (e = window);
				}
				t.exports = e;
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return c;
				});
				var r = e(11), o = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, i = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, u = this && this.__spreadArray || function(t, n, e) {
					if (e || 2 === arguments.length) for (var r, o = 0, i = n.length; o < i; o++) !r && o in n || (r || (r = Array.prototype.slice.call(n, 0, o)), r[o] = n[o]);
					return t.concat(r || Array.prototype.slice.call(n));
				}, c = function() {
					function t(t) {
						var n = this;
						this.callbacks = /* @__PURE__ */ new Map(), this.worker = t, this.worker.onmessage = function(t) {
							var e = t.data, r = e.id, o = n.callbacks.get(e.id);
							o && (o({ time: e.time }), n.callbacks.delete(r));
						}, this.log = function() {
							for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
							return n.send.apply(n, u(["log"], t, !1));
						}, this.table = function() {
							for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
							return n.send.apply(n, u(["table"], t, !1));
						}, this.clear = function() {
							for (var t = [], e = 0; e < arguments.length; e++) t[e] = arguments[e];
							return n.send.apply(n, u(["clear"], t, !1));
						};
					}
					return t.prototype.send = function(t) {
						for (var n = [], e = 1; e < arguments.length; e++) n[e - 1] = arguments[e];
						return o(this, void 0, void 0, function() {
							var e, o = this;
							return i(this, function(i) {
								return e = Object(r.a)(), [2, new Promise(function(r, i) {
									o.callbacks.set(e, r), o.worker.postMessage({
										id: e,
										type: t,
										payload: n
									}), setTimeout(function() {
										i(/* @__PURE__ */ new Error("timeout")), o.callbacks.delete(e);
									}, 2e3);
								})];
							});
						});
					}, t.workerScript = "\nonmessage = function(event) {\n  var action = event.data;\n  var startTime = performance.now()\n\n  console[action.type](...action.payload);\n  postMessage({\n    id: action.id,\n    time: performance.now() - startTime\n  })\n}\n", t;
				}();
			},
			function(t, n, e) {
				"use strict";
				n.a = function() {
					r > Number.MAX_SAFE_INTEGER && (r = 0);
					return r++;
				};
				var r = 0;
			},
			function(t, n, e) {
				"use strict";
				Object.defineProperty(n, "__esModule", { value: !0 });
				var r = e(13);
				e.d(n, "depRegToStringChecker", function() {
					return r.a;
				});
				var o = e(14);
				e.d(n, "elementIdChecker", function() {
					return o.a;
				});
				var i = e(15);
				e.d(n, "functionToStringChecker", function() {
					return i.a;
				});
				var u = e(16);
				e.d(n, "regToStringChecker", function() {
					return u.a;
				});
				var c = e(17);
				e.d(n, "debuggerChecker", function() {
					return c.a;
				});
				var a = e(18);
				e.d(n, "dateToStringChecker", function() {
					return a.a;
				});
				var s = e(19);
				e.d(n, "performanceChecker", function() {
					return s.a;
				});
				var l = e(20);
				e.d(n, "erudaChecker", function() {
					return l.a;
				});
				var f = e(21);
				e.d(n, "devtoolsFormatterChecker", function() {
					return f.a;
				});
				var h = e(22);
				e.d(n, "workerPerformanceChecker", function() {
					return h.a;
				});
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return l;
				});
				var r = e(0), o = e(1), i = e(2), u = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, c = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, a = / /, s = !1;
				a.toString = function() {
					return s = !0, l.name;
				};
				var l = {
					name: "dep-reg-to-string",
					isOpen: function() {
						return u(this, void 0, void 0, function() {
							return c(this, function(t) {
								return s = !1, Object(o.c)({ dep: a }), Object(o.a)(), [2, s];
							});
						});
					},
					isEnable: function() {
						return u(this, void 0, void 0, function() {
							return c(this, function(t) {
								return [2, Object(i.a)({
									includes: [!0],
									excludes: [r.d, r.e]
								})];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return f;
				});
				var r = e(0), o = e(1), i = e(2), u = e(3), c = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, a = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, s = Object(u.a)("div"), l = !1;
				Object.defineProperty(s, "id", {
					get: function() {
						return l = !0, f.name;
					},
					configurable: !0
				});
				var f = {
					name: "element-id",
					isOpen: function() {
						return c(this, void 0, void 0, function() {
							return a(this, function(t) {
								return l = !1, Object(o.b)(s), Object(o.a)(), [2, l];
							});
						});
					},
					isEnable: function() {
						return c(this, void 0, void 0, function() {
							return a(this, function(t) {
								return [2, Object(i.a)({ includes: [r.g] })];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return f;
				});
				var r = e(0), o = e(1), i = e(5), u = e(2), c = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, a = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				};
				function s() {}
				var l = 0;
				s.toString = function() {
					return l++, "";
				};
				var f = {
					name: "function-to-string",
					isOpen: function() {
						return c(this, void 0, void 0, function() {
							return a(this, function(t) {
								return l = 0, Object(o.b)(s), Object(o.a)(), [2, 2 === l];
							});
						});
					},
					isEnable: function() {
						return c(this, void 0, void 0, function() {
							var t;
							return a(this, function(n) {
								return t = i.b || i.c, [2, Object(u.a)({
									includes: [!0],
									excludes: [
										r.f,
										r.d,
										t && r.b,
										t && r.c
									]
								})];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return l;
				});
				var r = e(1), o = e(0), i = e(2), u = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, c = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, a = / /, s = !1;
				a.toString = function() {
					return s = !0, l.name;
				};
				var l = {
					name: "reg-to-string",
					isOpen: function() {
						return u(this, void 0, void 0, function() {
							return c(this, function(t) {
								return s = !1, Object(r.b)(a), Object(r.a)(), [2, s];
							});
						});
					},
					isEnable: function() {
						return u(this, void 0, void 0, function() {
							return c(this, function(t) {
								return [2, Object(i.a)({
									includes: [!0],
									excludes: [o.h]
								})];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return u;
				});
				var r = e(6), o = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, i = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, u = {
					name: "debugger-checker",
					isOpen: function() {
						return o(this, void 0, void 0, function() {
							var t;
							return i(this, function(n) {
								t = Object(r.a)();
								try {
									(function() {}).constructor("debugger")();
								} catch (t) {}
								return [2, Object(r.a)() - t > 100];
							});
						});
					},
					isEnable: function() {
						return o(this, void 0, void 0, function() {
							return i(this, function(t) {
								return [2, !0];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return f;
				});
				var r = e(0), o = e(1), i = e(2), u = e(4), c = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, a = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, s = /* @__PURE__ */ new Date(), l = 0;
				s.toString = function() {
					return l++, "";
				};
				var f = {
					name: "date-to-string",
					isOpen: function() {
						return c(this, void 0, void 0, function() {
							return a(this, function(t) {
								return l = 0, Object(o.b)(s), Object(o.a)(), [2, 2 === l];
							});
						});
					},
					isEnable: function() {
						return c(this, void 0, void 0, function() {
							return a(this, function(t) {
								return [2, Object(i.a)({
									includes: [r.b],
									excludes: [(u.isIpad || u.isIphone) && r.b]
								})];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return h;
				});
				var r = e(1), o = e(0), i = e(7), u = e(2), c = e(3), a = e(6), s = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, l = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, f = 0, h = {
					name: "performance",
					isOpen: function() {
						return s(this, void 0, void 0, function() {
							var t, n;
							return l(this, function(e) {
								switch (e.label) {
									case 0: return t = function() {
										var t = Object(i.a)(), n = Object(a.a)();
										return Object(r.c)(t), Object(a.a)() - n;
									}(), n = Math.max(d(), d()), f = Math.max(f, n), Object(r.a)(), 0 === t ? [2, !1] : 0 !== f ? [3, 2] : [4, Object(c.d)()];
									case 1: return e.sent() ? [2, !0] : [2, !1];
									case 2: return [2, t > 10 * f];
								}
							});
						});
					},
					isEnable: function() {
						return s(this, void 0, void 0, function() {
							return l(this, function(t) {
								return [2, Object(u.a)({
									includes: [
										o.b,
										o.g,
										o.d
									],
									excludes: []
								})];
							});
						});
					}
				};
				function d() {
					var t = Object(i.a)(), n = Object(a.a)();
					return Object(r.b)(t), Object(a.a)() - n;
				}
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return i;
				});
				var r = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, o = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, i = {
					name: "eruda",
					isOpen: function() {
						var t;
						return r(this, void 0, void 0, function() {
							return o(this, function(n) {
								return "undefined" != typeof eruda ? [2, !0 === (null === (t = null === eruda || void 0 === eruda ? void 0 : eruda._devTools) || void 0 === t ? void 0 : t._isShow)] : [2, !1];
							});
						});
					},
					isEnable: function() {
						return r(this, void 0, void 0, function() {
							return o(this, function(t) {
								return [2, !0];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return a;
				});
				var r = e(1), o = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, i = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, u = !1, c = { header: function() {
					return u = !0, null;
				} }, a = {
					name: "DevtoolsFormatters",
					isOpen: function() {
						return o(this, void 0, void 0, function() {
							return i(this, function(t) {
								return window.devtoolsFormatters ? -1 === window.devtoolsFormatters.indexOf(c) && window.devtoolsFormatters.push(c) : window.devtoolsFormatters = [c], u = !1, Object(r.b)({}), Object(r.a)(), [2, u];
							});
						});
					},
					isEnable: function() {
						return o(this, void 0, void 0, function() {
							return i(this, function(t) {
								return [2, !0];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return l;
				});
				var r = e(0), o = e(2), i = e(3), u = e(7), c = this && this.__awaiter || function(t, n, e, r) {
					return new (e || (e = Promise))(function(o, i) {
						function u(t) {
							try {
								a(r.next(t));
							} catch (t) {
								i(t);
							}
						}
						function c(t) {
							try {
								a(r.throw(t));
							} catch (t) {
								i(t);
							}
						}
						function a(t) {
							t.done ? o(t.value) : function(t) {
								return t instanceof e ? t : new e(function(n) {
									n(t);
								});
							}(t.value).then(u, c);
						}
						a((r = r.apply(t, n || [])).next());
					});
				}, a = this && this.__generator || function(t, n) {
					var e, r, o, i, u = {
						label: 0,
						sent: function() {
							if (1 & o[0]) throw o[1];
							return o[1];
						},
						trys: [],
						ops: []
					};
					return i = {
						next: c(0),
						throw: c(1),
						return: c(2)
					}, "function" == typeof Symbol && (i[Symbol.iterator] = function() {
						return this;
					}), i;
					function c(c) {
						return function(a) {
							return function(c) {
								if (e) throw new TypeError("Generator is already executing.");
								for (; i && (i = 0, c[0] && (u = 0)), u;) try {
									if (e = 1, r && (o = 2 & c[0] ? r.return : c[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, c[1])).done) return o;
									switch (r = 0, o && (c = [2 & c[0], o.value]), c[0]) {
										case 0:
										case 1:
											o = c;
											break;
										case 4: return u.label++, {
											value: c[1],
											done: !1
										};
										case 5:
											u.label++, r = c[1], c = [0];
											continue;
										case 7:
											c = u.ops.pop(), u.trys.pop();
											continue;
										default:
											if (!(o = (o = u.trys).length > 0 && o[o.length - 1]) && (6 === c[0] || 2 === c[0])) {
												u = 0;
												continue;
											}
											if (3 === c[0] && (!o || c[1] > o[0] && c[1] < o[3])) {
												u.label = c[1];
												break;
											}
											if (6 === c[0] && u.label < o[1]) {
												u.label = o[1], o = c;
												break;
											}
											if (o && u.label < o[2]) {
												u.label = o[2], u.ops.push(c);
												break;
											}
											o[2] && u.ops.pop(), u.trys.pop();
											continue;
									}
									c = n.call(t, u);
								} catch (t) {
									c = [6, t], r = 0;
								} finally {
									e = o = 0;
								}
								if (5 & c[0]) throw c[1];
								return {
									value: c[0] ? c[1] : void 0,
									done: !0
								};
							}([c, a]);
						};
					}
				}, s = 0, l = {
					name: "worker-performance",
					isOpen: function() {
						return c(this, void 0, void 0, function() {
							var t, n, e;
							return a(this, function(r) {
								switch (r.label) {
									case 0: return null == (t = Object(i.c)()) ? [2, !1] : [4, function(t) {
										return c(this, void 0, void 0, function() {
											var n;
											return a(this, function(e) {
												switch (e.label) {
													case 0: return n = Object(u.a)(), [4, t.table(n)];
													case 1: return [2, e.sent().time];
												}
											});
										});
									}(t)];
									case 1: return n = r.sent(), [4, function(t) {
										return c(this, void 0, void 0, function() {
											var n;
											return a(this, function(e) {
												switch (e.label) {
													case 0: return n = Object(u.a)(), [4, t.log(n)];
													case 1: return [2, e.sent().time];
												}
											});
										});
									}(t)];
									case 2: return e = r.sent(), s = Math.max(s, e), [4, t.clear()];
									case 3: return r.sent(), 0 === n ? [2, !1] : 0 !== s ? [3, 5] : [4, Object(i.d)()];
									case 4: return r.sent() ? [2, !0] : [2, !1];
									case 5: return [2, n > 10 * s];
								}
							});
						});
					},
					isEnable: function() {
						return c(this, void 0, void 0, function() {
							return a(this, function(t) {
								return [2, Object(o.a)({
									includes: [r.b],
									excludes: []
								})];
							});
						});
					}
				};
			},
			function(t, n, e) {
				"use strict";
				n.b = function() {
					if (r.a) for (var t = 0; t < Number.MAX_VALUE; t++) window["".concat(t)] = new Array(Math.pow(2, 32) - 1).fill(0);
				}, n.a = function() {
					if (r.a) for (var t = [];;) t.push(0), location.reload();
				};
				var r = e(0);
			},
			function(t, n, e) {
				"use strict";
				e.d(n, "a", function() {
					return r;
				});
				for (var r = {}, o = 0, i = (e(0).i || "").match(/\w+\/(\d|\.)+(\s|$)/gi) || []; o < i.length; o++) {
					var u = i[o].split("/"), c = u[0];
					r[c] = u[1];
				}
			}
		]);
	});
})))(), 1)).default;
/** 默认配置 */
var DEFAULT_OPTIONS = {
	enable: false,
	url: "",
	action: "clear",
	jumpUrl: ""
};
var stopFns = [];
var installed = false;
var externalScript = null;
/** 记录本次会话已执行过的跳转目标，避免 SPA 路由改写 hash 后反复刷新 */
var PUNISH_FLAG = "__repo_antidebug_punished__";
/** 从全局配置读取反调试运行期选项 */
function readOptions() {
	const baiduJs = getConfig()?.security?.baiduJs;
	return {
		enable: baiduJs?.enable ?? DEFAULT_OPTIONS.enable,
		url: baiduJs?.url ?? DEFAULT_OPTIONS.url,
		action: baiduJs?.action ?? DEFAULT_OPTIONS.action,
		jumpUrl: baiduJs?.jumpUrl ?? DEFAULT_OPTIONS.jumpUrl
	};
}
/**
* redirect 惩罚要保留的登录凭据（按 key 末段匹配，兼容前缀 / 用户级变体）。
*
* <p><b>为什么保留</b>：{@code openAuth=true} 生产口径下 jumpUrl 通常是站内受保护
* 路由；若把令牌一并清掉，落地瞬间路由守卫就会把它改写成登录页，
* 管理员配置的 jumpUrl 永远到不了——该动作在生产环境形同失效
* （e2e security-config 05 实测：落在 {@code #/login} 而非 {@code #/home}）。</p>
*
* <p>彻底销毁会话是 {@code action=clear} 的职责（清空一切 + about:blank）；
* {@code action=redirect} 的语义是「把人支开，应用仍可用」，
* 因此只清缓存、保留 {@code accessToken / refreshToken / userInfo}。</p>
*/
var AUTH_KEEP_BASE_KEYS = [
	"accessToken",
	"refreshToken",
	"userInfo"
];
/** key 的末段（去掉前缀 / 用户级段）：{@code system:1:accessToken} → {@code accessToken} */
function baseKeyOf(key) {
	return key.includes(":") ? key.slice(key.lastIndexOf(":") + 1) : key;
}
/** 快照某 storage 里的登录凭据条目（清缓存前调用，取原始编码值原样回写） */
function collectAuthEntries(store) {
	const out = [];
	try {
		for (let i = 0; i < store.length; i++) {
			const key = store.key(i);
			if (!key || !AUTH_KEEP_BASE_KEYS.includes(baseKeyOf(key))) continue;
			const value = store.getItem(key);
			if (value != null) out.push([key, value]);
		}
	} catch {}
	return out;
}
/** 回写登录凭据（清缓存后调用） */
function restoreAuthEntries(store, entries) {
	try {
		for (const [key, value] of entries) store.setItem(key, value);
	} catch {}
}
/** 清空本地缓存（localStorage / sessionStorage / cookie） */
function clearLocalStorage() {
	try {
		window.localStorage.clear();
	} catch {}
	try {
		window.sessionStorage.clear();
	} catch {}
	try {
		document.cookie.split(";").forEach((cookie) => {
			const name = cookie.split("=")[0].trim();
			if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
		});
	} catch {}
}
/** 读取已跳转目标标记（必须在清缓存之前调用） */
function readPunishFlag() {
	try {
		return window.sessionStorage.getItem(PUNISH_FLAG);
	} catch {
		return null;
	}
}
/** 写入已跳转目标标记（清缓存之后调用） */
function writePunishFlag(target) {
	try {
		window.sessionStorage.setItem(PUNISH_FLAG, target);
	} catch {}
}
/** 触发调试惩罚动作：先清缓存，再按策略跳转 */
function punish() {
	const { action, jumpUrl } = readOptions();
	const target = jumpUrl || "/";
	if (action === "redirect" && readPunishFlag() === target) return;
	const keepLocal = action === "redirect" ? collectAuthEntries(window.localStorage) : [];
	const keepSession = action === "redirect" ? collectAuthEntries(window.sessionStorage) : [];
	clearLocalStorage();
	if (action === "redirect") {
		restoreAuthEntries(window.localStorage, keepLocal);
		restoreAuthEntries(window.sessionStorage, keepSession);
		writePunishFlag(target);
		if (new URL(target, location.origin).href !== location.href) location.href = target;
	} else location.replace("about:blank");
}
/** 动态加载外部反爬脚本（baiduJs.url）；返回卸载函数 */
function loadExternalScript(url) {
	if (!url || typeof document === "undefined") return () => void 0;
	const script = document.createElement("script");
	script.src = url;
	script.async = true;
	script.setAttribute("data-repo-antidebug", "1");
	script.onerror = () => {
		script.remove();
		if (externalScript === script) externalScript = null;
	};
	document.head?.appendChild(script);
	externalScript = script;
	return () => {
		script.remove();
		if (externalScript === script) externalScript = null;
	};
}
/** 判断是否为调试快捷键 */
function isBlockedDebugShortcut(event) {
	const k = event.key;
	return k === "F12" || event.ctrlKey && event.shiftKey && [
		"I",
		"J",
		"C"
	].includes(k) || event.ctrlKey && k.toLowerCase() === "u";
}
/** 安装全部反调试监听器 */
function installListeners() {
	const listeners = [];
	const register = (target, type, fn) => {
		target.addEventListener(type, fn);
		listeners.push([
			target,
			type,
			fn
		]);
	};
	register(document, "contextmenu", (e) => {
		e.preventDefault();
		return false;
	});
	register(document, "keydown", (e) => {
		if (isBlockedDebugShortcut(e)) {
			e.preventDefault();
			punish();
			return false;
		}
		return true;
	});
	const handleDevTools = (isOpen) => {
		if (isOpen) punish();
	};
	addListener(handleDevTools);
	launch();
	const cleanup = () => {
		listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn));
		removeListener(handleDevTools);
		stop();
	};
	return cleanup;
}
/**
* 安装反调试。幂等：重复调用会先卸载再重装。
* 返回卸载函数。
*/
function installAntiDebug() {
	stopFns.forEach((fn) => fn());
	stopFns = [];
	const options = readOptions();
	if (!options.enable) {
		installed = false;
		return () => {};
	}
	const cleanups = [installListeners()];
	if (options.url) cleanups.push(loadExternalScript(options.url));
	stopFns = cleanups;
	installed = true;
	return () => uninstallAntiDebug();
}
/** 卸载反调试 */
function uninstallAntiDebug() {
	stopFns.forEach((fn) => fn());
	stopFns = [];
	if (externalScript) {
		externalScript.remove();
		externalScript = null;
	}
	installed = false;
}
/** 刷新运行期选项（配置热更新后调用） */
function refreshAntiDebug() {
	const enabled = readOptions().enable;
	if (enabled && !installed) installAntiDebug();
	else if (!enabled && installed) uninstallAntiDebug();
}
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
/**
* 登录页是否允许发起远程配置请求。
*
* <p>{@code /v2/setting/default} 受鉴权保护，**未登录时必然失败**：后端以
* HTTP 200 返回错误信封 {@code {"code":"A0403S0000","success":false,
* "msg":"用户信息不存在/请重新登录!"}}。此时拉取既拿不到任何配置，又只能靠
* 回落代码内置默认值（{@code shared.ts} 的 {@code login.captcha: true}），
* 覆盖掉 app.yaml 里显式声明的 {@code login.captcha: false}，
* 还会让登录页凭空多出一个必填的验证码字段、把用户挡在门外。</p>
*
* <p>因此未登录直接不发这个请求，沿用本地 app.yaml；登录成功后由
* {@link refreshDefaultSetting} 再拉一次并广播热重载。</p>
*/
function isLoggedIn() {
	return !!getAccessToken();
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
		if (!loginKey) return;
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
	if (Object.keys(patch).length > 0) setConfig(patch);
}
var bootstrapping = false;
var defaultSettingPromise = null;
function loadDefaultSetting() {
	if (!shouldFetchRemoteSetting() || !isLoggedIn()) return Promise.resolve(false);
	if (defaultSettingPromise) return defaultSettingPromise;
	bootstrapping = true;
	defaultSettingPromise = doLoadDefaultSetting().finally(() => {
		bootstrapping = false;
	});
	return defaultSettingPromise;
}
async function doLoadDefaultSetting() {
	try {
		const cached = getRemoteSettingList();
		if (hasRemoteSettingFetched()) {
			if (Array.isArray(cached) && cached.length) mergeDefaultSetting(cached);
			return true;
		}
		const { data } = await getDefaultSetting();
		if (Array.isArray(data)) mergeDefaultSetting(data);
		return true;
	} catch (error) {
		log.warn(`[setting] 远程登录页配置拉取失败，已降级使用本地配置`, error);
		return false;
	}
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
var hotReloadBound = false;
function onConfigHotReload(cb) {
	hotReloadCallbacks.add(cb);
	return () => hotReloadCallbacks.delete(cb);
}
function bindConfigHotReload() {
	if (hotReloadBound || typeof window === "undefined") return;
	hotReloadBound = true;
	window.addEventListener(CONFIG_VERSION_CHANGE_EVENT, (event) => {
		if (!event?.detail?.version || bootstrapping) return;
		window.setTimeout(() => {
			(async () => {
				try {
					defaultSettingPromise = null;
					if (shouldFetchRemoteSetting()) await refreshDefaultSetting();
					else notifyHotReload();
				} catch (error) {
					log.warn(`[setting] 配置热重载失败`, error);
					notifyHotReload();
				}
			})();
		}, 500);
	});
}
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
//#region ../../packages/core/src/socket/socketTemplate.ts
/** Socket 模板注入键（全局） */
var SocketTemplateKey = Symbol("SocketTemplate");
//#endregion
//#region ../../packages/core/src/socket/socketUtils.ts
/** socket 鉴权 token 获取函数（createApp 装配时注入） */
var socketTokenProvider = () => "";
/** 注入 socket 鉴权 token 获取函数 */
function setSocketTokenProvider(provider) {
	socketTokenProvider = provider;
}
/** 读取当前 socket 鉴权 token */
function getSocketToken() {
	return socketTokenProvider();
}
/** 加密消息解密器（默认空：不额外处理，直接返回 wrapper） */
var socketDecryptor = null;
function tryParseJson(value) {
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}
function isRecord(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
var SOCKET_FIELD_ALIASES = {
	dataId: [
		"dataId",
		"dataID",
		"data_id"
	],
	requestId: [
		"requestId",
		"requestID",
		"request_id",
		"reqId"
	]
};
function readSocketComparableValue(source, field) {
	if (!isRecord(source)) return;
	for (const key of SOCKET_FIELD_ALIASES[field]) {
		const directValue = source[key];
		if (typeof directValue === "string" || typeof directValue === "number") return directValue;
	}
	const nestedData = source.data;
	if (isRecord(nestedData)) for (const key of SOCKET_FIELD_ALIASES[field]) {
		const nestedValue = nestedData[key];
		if (typeof nestedValue === "string" || typeof nestedValue === "number") return nestedValue;
	}
}
function enrichParsedSocketPayload(payload, wrapper) {
	if (!isRecord(payload)) return payload;
	const nextPayload = { ...payload };
	const dataId = readSocketComparableValue(nextPayload, "dataId") ?? wrapper.dataId;
	const requestId = readSocketComparableValue(nextPayload, "requestId") ?? wrapper.requestId;
	if (dataId !== void 0 && nextPayload.dataId === void 0) nextPayload.dataId = dataId;
	if (requestId !== void 0 && nextPayload.requestId === void 0) nextPayload.requestId = requestId;
	if (wrapper.uuid !== void 0 && nextPayload.uuid === void 0) nextPayload.uuid = wrapper.uuid;
	if (wrapper.timestamp !== void 0 && nextPayload.timestamp === void 0) nextPayload.timestamp = wrapper.timestamp;
	return nextPayload;
}
function decodeEncryptedSocketMessage(wrapper) {
	if (socketDecryptor) try {
		return socketDecryptor(wrapper);
	} catch (error) {
		log.warn(`[SocketUtils] 解密 Socket 消息失败:`, error);
		return wrapper;
	}
	return wrapper;
}
/** 判断 Socket 消息是否可比较（dataId/requestId 过滤用） */
function matchesSocketListenOptions(parsedData, options, rawData) {
	if (!options) return true;
	if (options.dataId !== void 0) {
		const dataId = readSocketComparableValue(parsedData, "dataId") ?? readSocketComparableValue(rawData, "dataId");
		if (String(dataId) !== String(options.dataId)) return false;
	}
	if (options.requestId !== void 0) {
		const requestId = readSocketComparableValue(parsedData, "requestId") ?? readSocketComparableValue(rawData, "requestId");
		if (String(requestId) !== String(options.requestId)) return false;
	}
	return true;
}
/**
* 解析 Socket 消息数据
* 处理后端推送的加密/非加密数据格式，返回解析后的数据对象
*
* @param rawData 原始数据
* @returns 解析后的数据对象
*/
function parseSocketMessage(rawData) {
	try {
		if (rawData === null || rawData === void 0 || rawData === "") return rawData;
		const wrapper = typeof rawData === "string" ? (() => {
			try {
				return JSON.parse(rawData);
			} catch {
				return rawData;
			}
		})() : rawData;
		if (typeof wrapper === "string") return wrapper;
		if (wrapper && typeof wrapper.encrypted === "boolean") if (wrapper.encrypted) return enrichParsedSocketPayload(decodeEncryptedSocketMessage(wrapper), wrapper);
		else {
			if (typeof wrapper.data === "string") return enrichParsedSocketPayload(tryParseJson(wrapper.data), wrapper);
			return enrichParsedSocketPayload(wrapper.data, wrapper);
		}
		return wrapper;
	} catch (error) {
		log.error(`[SocketUtils] 解析Socket消息失败:`, error);
		return rawData;
	}
}
/** 不可路由的主机（后端可能下发 0.0.0.0，需替换为当前页面主机） */
var SOCKET_WILDCARD_HOSTS = /* @__PURE__ */ new Set([
	"0.0.0.0",
	"::",
	"[::]"
]);
function getSocketRuntimeHostname(explicitHostname) {
	if (explicitHostname?.trim()) return explicitHostname.trim();
	if (typeof window === "undefined") return null;
	return window.location.hostname || null;
}
/**
* 将不可路由的 Socket 地址主机替换为当前页面主机，避免服务端下发 0.0.0.0
*
* @param rawUrl 原始地址
* @param runtimeHostname 运行时主机名（缺省取当前页面）
* @returns 规范化后的地址
*/
function normalizeSocketUrl(rawUrl, runtimeHostname) {
	const urlText = rawUrl?.trim();
	if (!urlText) return rawUrl;
	const baseOrigin = typeof window !== "undefined" ? window.location.origin : void 0;
	try {
		const url = baseOrigin ? new URL(urlText, baseOrigin) : new URL(urlText);
		if (!SOCKET_WILDCARD_HOSTS.has(url.hostname)) return url.toString();
		const resolvedHostname = getSocketRuntimeHostname(runtimeHostname);
		if (!resolvedHostname) return url.toString();
		url.hostname = resolvedHostname;
		return url.toString();
	} catch {
		return urlText;
	}
}
/**
* 构建带认证的 URL
*
* @param baseUrl 基础 URL
* @param token 访问令牌
* @param query 额外查询参数
* @returns 完整 URL
*/
function buildAuthUrl(baseUrl, token, query) {
	const url = new URL(baseUrl);
	if (token) url.searchParams.set("x-oauth-token", token);
	if (query) Object.entries(query).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});
	return url.toString();
}
/**
* 将 HTTP URL 转换为 WebSocket URL
*
* @param httpUrl HTTP URL
* @returns WebSocket URL
*/
function toWebSocketUrl(httpUrl) {
	return normalizeSocketUrl(httpUrl).replace(/^http/, "ws");
}
//#endregion
//#region ../../packages/core/src/socket/socketTopics.ts
/**
* Socket 主题命名规范
* 命名格式: 项目:模块:功能，例如 system:config:update
*
* 配置热重载联动：服务端推送 system:config:update / system:config:version 时，
* 前端调用 upgrade(version) 触发配置重新拉取。
*/
/** 系统模块主题 (system) */
var SystemTopics = {
	MESSAGE: {
		PUSH: "system:message:push",
		NOTIFICATION: "system:message:notification",
		READ: "system:message:read",
		DELETE: "system:message:delete"
	},
	USER: {
		ONLINE: "system:user:online",
		OFFLINE: "system:user:offline",
		STATUS: "system:user:status",
		KICK: "system:user:kick"
	},
	CONFIG: {
		UPDATE: "system:config:update",
		VERSION: "system:config:version"
	},
	AUTH: {
		TOKEN_EXPIRED: "system:auth:token_expired",
		PERMISSION_CHANGE: "system:auth:permission_change"
	}
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/commons.js
var PACKET_TYPES = Object.create(null);
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
var PACKET_TYPES_REVERSE = Object.create(null);
Object.keys(PACKET_TYPES).forEach((key) => {
	PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
var ERROR_PACKET = {
	type: "error",
	data: "parser error"
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/encodePacket.browser.js
var withNativeBlob$1 = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
var withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
var isView$1 = (obj) => {
	return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
};
var encodePacket = ({ type, data }, supportsBinary, callback) => {
	if (withNativeBlob$1 && data instanceof Blob) if (supportsBinary) return callback(data);
	else return encodeBlobAsBase64(data, callback);
	else if (withNativeArrayBuffer$2 && (data instanceof ArrayBuffer || isView$1(data))) if (supportsBinary) return callback(data);
	else return encodeBlobAsBase64(new Blob([data]), callback);
	return callback(PACKET_TYPES[type] + (data || ""));
};
var encodeBlobAsBase64 = (data, callback) => {
	const fileReader = new FileReader();
	fileReader.onload = function() {
		const content = fileReader.result.split(",")[1];
		callback("b" + (content || ""));
	};
	return fileReader.readAsDataURL(data);
};
function toArray(data) {
	if (data instanceof Uint8Array) return data;
	else if (data instanceof ArrayBuffer) return new Uint8Array(data);
	else return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
var TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
	if (withNativeBlob$1 && packet.data instanceof Blob) return packet.data.arrayBuffer().then(toArray).then(callback);
	else if (withNativeArrayBuffer$2 && (packet.data instanceof ArrayBuffer || isView$1(packet.data))) return callback(toArray(packet.data));
	encodePacket(packet, false, (encoded) => {
		if (!TEXT_ENCODER) TEXT_ENCODER = new TextEncoder();
		callback(TEXT_ENCODER.encode(encoded));
	});
}
//#endregion
//#region ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup$1 = typeof Uint8Array === "undefined" ? [] : /* @__PURE__ */ new Uint8Array(256);
for (let i = 0; i < 64; i++) lookup$1[chars.charCodeAt(i)] = i;
var decode$1 = (base64) => {
	let bufferLength = base64.length * .75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
	if (base64[base64.length - 1] === "=") {
		bufferLength--;
		if (base64[base64.length - 2] === "=") bufferLength--;
	}
	const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
	for (i = 0; i < len; i += 4) {
		encoded1 = lookup$1[base64.charCodeAt(i)];
		encoded2 = lookup$1[base64.charCodeAt(i + 1)];
		encoded3 = lookup$1[base64.charCodeAt(i + 2)];
		encoded4 = lookup$1[base64.charCodeAt(i + 3)];
		bytes[p++] = encoded1 << 2 | encoded2 >> 4;
		bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
		bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	}
	return arraybuffer;
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/decodePacket.browser.js
var withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
var decodePacket = (encodedPacket, binaryType) => {
	if (typeof encodedPacket !== "string") return {
		type: "message",
		data: mapBinary(encodedPacket, binaryType)
	};
	const type = encodedPacket.charAt(0);
	if (type === "b") return {
		type: "message",
		data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
	};
	if (!PACKET_TYPES_REVERSE[type]) return ERROR_PACKET;
	return encodedPacket.length > 1 ? {
		type: PACKET_TYPES_REVERSE[type],
		data: encodedPacket.substring(1)
	} : { type: PACKET_TYPES_REVERSE[type] };
};
var decodeBase64Packet = (data, binaryType) => {
	if (withNativeArrayBuffer$1) return mapBinary(decode$1(data), binaryType);
	else return {
		base64: true,
		data
	};
};
var mapBinary = (data, binaryType) => {
	switch (binaryType) {
		case "blob": if (data instanceof Blob) return data;
		else return new Blob([data]);
		default: if (data instanceof ArrayBuffer) return data;
		else return data.buffer;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-parser@5.2.3/node_modules/engine.io-parser/build/esm/index.js
var SEPARATOR = String.fromCharCode(30);
var encodePayload = (packets, callback) => {
	const length = packets.length;
	const encodedPackets = new Array(length);
	let count = 0;
	packets.forEach((packet, i) => {
		encodePacket(packet, false, (encodedPacket) => {
			encodedPackets[i] = encodedPacket;
			if (++count === length) callback(encodedPackets.join(SEPARATOR));
		});
	});
};
var decodePayload = (encodedPayload, binaryType) => {
	const encodedPackets = encodedPayload.split(SEPARATOR);
	const packets = [];
	for (let i = 0; i < encodedPackets.length; i++) {
		const decodedPacket = decodePacket(encodedPackets[i], binaryType);
		packets.push(decodedPacket);
		if (decodedPacket.type === "error") break;
	}
	return packets;
};
function createPacketEncoderStream() {
	return new TransformStream({ transform(packet, controller) {
		encodePacketToBinary(packet, (encodedPacket) => {
			const payloadLength = encodedPacket.length;
			let header;
			if (payloadLength < 126) {
				header = /* @__PURE__ */ new Uint8Array(1);
				new DataView(header.buffer).setUint8(0, payloadLength);
			} else if (payloadLength < 65536) {
				header = /* @__PURE__ */ new Uint8Array(3);
				const view = new DataView(header.buffer);
				view.setUint8(0, 126);
				view.setUint16(1, payloadLength);
			} else {
				header = /* @__PURE__ */ new Uint8Array(9);
				const view = new DataView(header.buffer);
				view.setUint8(0, 127);
				view.setBigUint64(1, BigInt(payloadLength));
			}
			if (packet.data && typeof packet.data !== "string") header[0] |= 128;
			controller.enqueue(header);
			controller.enqueue(encodedPacket);
		});
	} });
}
var TEXT_DECODER;
function totalLength(chunks) {
	return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
	if (chunks[0].length === size) return chunks.shift();
	const buffer = new Uint8Array(size);
	let j = 0;
	for (let i = 0; i < size; i++) {
		buffer[i] = chunks[0][j++];
		if (j === chunks[0].length) {
			chunks.shift();
			j = 0;
		}
	}
	if (chunks.length && j < chunks[0].length) chunks[0] = chunks[0].slice(j);
	return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
	if (!TEXT_DECODER) TEXT_DECODER = new TextDecoder();
	const chunks = [];
	let state = 0;
	let expectedLength = -1;
	let isBinary = false;
	return new TransformStream({ transform(chunk, controller) {
		chunks.push(chunk);
		while (true) {
			if (state === 0) {
				if (totalLength(chunks) < 1) break;
				const header = concatChunks(chunks, 1);
				isBinary = (header[0] & 128) === 128;
				expectedLength = header[0] & 127;
				if (expectedLength < 126) state = 3;
				else if (expectedLength === 126) state = 1;
				else state = 2;
			} else if (state === 1) {
				if (totalLength(chunks) < 2) break;
				const headerArray = concatChunks(chunks, 2);
				expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
				state = 3;
			} else if (state === 2) {
				if (totalLength(chunks) < 8) break;
				const headerArray = concatChunks(chunks, 8);
				const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
				const n = view.getUint32(0);
				if (n > Math.pow(2, 21) - 1) {
					controller.enqueue(ERROR_PACKET);
					break;
				}
				expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
				state = 3;
			} else {
				if (totalLength(chunks) < expectedLength) break;
				const data = concatChunks(chunks, expectedLength);
				controller.enqueue(decodePacket(isBinary ? data : TEXT_DECODER.decode(data), binaryType));
				state = 0;
			}
			if (expectedLength === 0 || expectedLength > maxPayload) {
				controller.enqueue(ERROR_PACKET);
				break;
			}
		}
	} });
}
//#endregion
//#region ../../node_modules/.pnpm/@socket.io+component-emitter@3.1.2/node_modules/@socket.io/component-emitter/lib/esm/index.js
/**
* Initialize a new `Emitter`.
*
* @api public
*/
function Emitter(obj) {
	if (obj) return mixin(obj);
}
/**
* Mixin the emitter properties.
*
* @param {Object} obj
* @return {Object}
* @api private
*/
function mixin(obj) {
	for (var key in Emitter.prototype) obj[key] = Emitter.prototype[key];
	return obj;
}
/**
* Listen on the given `event` with `fn`.
*
* @param {String} event
* @param {Function} fn
* @return {Emitter}
* @api public
*/
Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
	this._callbacks = this._callbacks || {};
	(this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
	return this;
};
/**
* Adds an `event` listener that will be invoked a single
* time then automatically removed.
*
* @param {String} event
* @param {Function} fn
* @return {Emitter}
* @api public
*/
Emitter.prototype.once = function(event, fn) {
	function on() {
		this.off(event, on);
		fn.apply(this, arguments);
	}
	on.fn = fn;
	this.on(event, on);
	return this;
};
/**
* Remove the given callback for `event` or all
* registered callbacks.
*
* @param {String} event
* @param {Function} fn
* @return {Emitter}
* @api public
*/
Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
	this._callbacks = this._callbacks || {};
	if (0 == arguments.length) {
		this._callbacks = {};
		return this;
	}
	var callbacks = this._callbacks["$" + event];
	if (!callbacks) return this;
	if (1 == arguments.length) {
		delete this._callbacks["$" + event];
		return this;
	}
	var cb;
	for (var i = 0; i < callbacks.length; i++) {
		cb = callbacks[i];
		if (cb === fn || cb.fn === fn) {
			callbacks.splice(i, 1);
			break;
		}
	}
	if (callbacks.length === 0) delete this._callbacks["$" + event];
	return this;
};
/**
* Emit `event` with the given args.
*
* @param {String} event
* @param {Mixed} ...
* @return {Emitter}
*/
Emitter.prototype.emit = function(event) {
	this._callbacks = this._callbacks || {};
	var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
	for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
	if (callbacks) {
		callbacks = callbacks.slice(0);
		for (var i = 0, len = callbacks.length; i < len; ++i) callbacks[i].apply(this, args);
	}
	return this;
};
Emitter.prototype.emitReserved = Emitter.prototype.emit;
/**
* Return array of callbacks for `event`.
*
* @param {String} event
* @return {Array}
* @api public
*/
Emitter.prototype.listeners = function(event) {
	this._callbacks = this._callbacks || {};
	return this._callbacks["$" + event] || [];
};
/**
* Check if this emitter has `event` handlers.
*
* @param {String} event
* @return {Boolean}
* @api public
*/
Emitter.prototype.hasListeners = function(event) {
	return !!this.listeners(event).length;
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/globals.js
var nextTick = (() => {
	if (typeof Promise === "function" && typeof Promise.resolve === "function") return (cb) => Promise.resolve().then(cb);
	else return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
})();
var globalThisShim = (() => {
	if (typeof self !== "undefined") return self;
	else if (typeof window !== "undefined") return window;
	else return Function("return this")();
})();
var defaultBinaryType = "arraybuffer";
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/util.js
function pick(obj, ...attr) {
	return attr.reduce((acc, k) => {
		if (obj.hasOwnProperty(k)) acc[k] = obj[k];
		return acc;
	}, {});
}
var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
function installTimerFunctions(obj, opts) {
	if (opts.useNativeTimers) {
		obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
		obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
	} else {
		obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
		obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
	}
}
var BASE64_OVERHEAD = 1.33;
function byteLength(obj) {
	if (typeof obj === "string") return utf8Length(obj);
	return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
	let c = 0, length = 0;
	for (let i = 0, l = str.length; i < l; i++) {
		c = str.charCodeAt(i);
		if (c < 128) length += 1;
		else if (c < 2048) length += 2;
		else if (c < 55296 || c >= 57344) length += 3;
		else {
			i++;
			length += 4;
		}
	}
	return length;
}
/**
* Generates a random 8-characters string.
*/
function randomString() {
	return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/contrib/parseqs.js
/**
* Compiles a querystring
* Returns string representation of the object
*
* @param {Object}
* @api private
*/
function encode(obj) {
	let str = "";
	for (let i in obj) if (obj.hasOwnProperty(i)) {
		if (str.length) str += "&";
		str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
	}
	return str;
}
/**
* Parses a simple querystring into an object
*
* @param {String} qs
* @api private
*/
function decode(qs) {
	let qry = {};
	let pairs = qs.split("&");
	for (let i = 0, l = pairs.length; i < l; i++) {
		let pair = pairs[i].split("=");
		qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	}
	return qry;
}
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/transport.js
var TransportError = class extends Error {
	constructor(reason, description, context) {
		super(reason);
		this.description = description;
		this.context = context;
		this.type = "TransportError";
	}
};
var Transport = class extends Emitter {
	/**
	* Transport abstract constructor.
	*
	* @param {Object} opts - options
	* @protected
	*/
	constructor(opts) {
		super();
		this.writable = false;
		installTimerFunctions(this, opts);
		this.opts = opts;
		this.query = opts.query;
		this.socket = opts.socket;
		this.supportsBinary = !opts.forceBase64;
	}
	/**
	* Emits an error.
	*
	* @param {String} reason
	* @param description
	* @param context - the error context
	* @return {Transport} for chaining
	* @protected
	*/
	onError(reason, description, context) {
		super.emitReserved("error", new TransportError(reason, description, context));
		return this;
	}
	/**
	* Opens the transport.
	*/
	open() {
		this.readyState = "opening";
		this.doOpen();
		return this;
	}
	/**
	* Closes the transport.
	*/
	close() {
		if (this.readyState === "opening" || this.readyState === "open") {
			this.doClose();
			this.onClose();
		}
		return this;
	}
	/**
	* Sends multiple packets.
	*
	* @param {Array} packets
	*/
	send(packets) {
		if (this.readyState === "open") this.write(packets);
	}
	/**
	* Called upon open
	*
	* @protected
	*/
	onOpen() {
		this.readyState = "open";
		this.writable = true;
		super.emitReserved("open");
	}
	/**
	* Called with data.
	*
	* @param {String} data
	* @protected
	*/
	onData(data) {
		const packet = decodePacket(data, this.socket.binaryType);
		this.onPacket(packet);
	}
	/**
	* Called with a decoded packet.
	*
	* @protected
	*/
	onPacket(packet) {
		super.emitReserved("packet", packet);
	}
	/**
	* Called upon close.
	*
	* @protected
	*/
	onClose(details) {
		this.readyState = "closed";
		super.emitReserved("close", details);
	}
	/**
	* Pauses the transport, in order not to lose packets during an upgrade.
	*
	* @param onPause
	*/
	pause(onPause) {}
	createUri(schema, query = {}) {
		return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
	}
	_hostname() {
		const hostname = this.opts.hostname;
		return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
	}
	_port() {
		if (this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80)) return ":" + this.opts.port;
		else return "";
	}
	_query(query) {
		const encodedQuery = encode(query);
		return encodedQuery.length ? "?" + encodedQuery : "";
	}
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/transports/polling.js
var Polling = class extends Transport {
	constructor() {
		super(...arguments);
		this._polling = false;
	}
	get name() {
		return "polling";
	}
	/**
	* Opens the socket (triggers polling). We write a PING message to determine
	* when the transport is open.
	*
	* @protected
	*/
	doOpen() {
		this._poll();
	}
	/**
	* Pauses polling.
	*
	* @param {Function} onPause - callback upon buffers are flushed and transport is paused
	* @package
	*/
	pause(onPause) {
		this.readyState = "pausing";
		const pause = () => {
			this.readyState = "paused";
			onPause();
		};
		if (this._polling || !this.writable) {
			let total = 0;
			if (this._polling) {
				total++;
				this.once("pollComplete", function() {
					--total || pause();
				});
			}
			if (!this.writable) {
				total++;
				this.once("drain", function() {
					--total || pause();
				});
			}
		} else pause();
	}
	/**
	* Starts polling cycle.
	*
	* @private
	*/
	_poll() {
		this._polling = true;
		this.doPoll();
		this.emitReserved("poll");
	}
	/**
	* Overloads onData to detect payloads.
	*
	* @protected
	*/
	onData(data) {
		const callback = (packet) => {
			if ("opening" === this.readyState && packet.type === "open") this.onOpen();
			if ("close" === packet.type) {
				this.onClose({ description: "transport closed by the server" });
				return false;
			}
			this.onPacket(packet);
		};
		decodePayload(data, this.socket.binaryType).forEach(callback);
		if ("closed" !== this.readyState) {
			this._polling = false;
			this.emitReserved("pollComplete");
			if ("open" === this.readyState) this._poll();
		}
	}
	/**
	* For polling, send a close packet.
	*
	* @protected
	*/
	doClose() {
		const close = () => {
			this.write([{ type: "close" }]);
		};
		if ("open" === this.readyState) close();
		else this.once("open", close);
	}
	/**
	* Writes a packets payload.
	*
	* @param {Array} packets - data packets
	* @protected
	*/
	write(packets) {
		this.writable = false;
		encodePayload(packets, (data) => {
			this.doWrite(data, () => {
				this.writable = true;
				this.emitReserved("drain");
			});
		});
	}
	/**
	* Generates uri for connection.
	*
	* @private
	*/
	uri() {
		const schema = this.opts.secure ? "https" : "http";
		const query = this.query || {};
		if (false !== this.opts.timestampRequests) query[this.opts.timestampParam] = randomString();
		if (!this.supportsBinary && !query.sid) query.b64 = 1;
		return this.createUri(schema, query);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/contrib/has-cors.js
var value = false;
try {
	value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
} catch (err) {}
var hasCORS = value;
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/transports/polling-xhr.js
function empty() {}
var BaseXHR = class extends Polling {
	/**
	* XHR Polling constructor.
	*
	* @param {Object} opts
	* @package
	*/
	constructor(opts) {
		super(opts);
		if (typeof location !== "undefined") {
			const isSSL = "https:" === location.protocol;
			let port = location.port;
			if (!port) port = isSSL ? "443" : "80";
			this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
		}
	}
	/**
	* Sends data.
	*
	* @param {String} data - data to send.
	* @param {Function} fn - called upon flush.
	* @private
	*/
	doWrite(data, fn) {
		const req = this.request({
			method: "POST",
			data
		});
		req.on("success", fn);
		req.on("error", (xhrStatus, context) => {
			this.onError("xhr post error", xhrStatus, context);
		});
	}
	/**
	* Starts a poll cycle.
	*
	* @private
	*/
	doPoll() {
		const req = this.request();
		req.on("data", this.onData.bind(this));
		req.on("error", (xhrStatus, context) => {
			this.onError("xhr poll error", xhrStatus, context);
		});
		this.pollXhr = req;
	}
};
var Request = class Request extends Emitter {
	/**
	* Request constructor
	*
	* @param {Object} options
	* @package
	*/
	constructor(createRequest, uri, opts) {
		super();
		this.createRequest = createRequest;
		installTimerFunctions(this, opts);
		this._opts = opts;
		this._method = opts.method || "GET";
		this._uri = uri;
		this._data = void 0 !== opts.data ? opts.data : null;
		this._create();
	}
	/**
	* Creates the XHR object and sends the request.
	*
	* @private
	*/
	_create() {
		var _a;
		const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
		opts.xdomain = !!this._opts.xd;
		const xhr = this._xhr = this.createRequest(opts);
		try {
			xhr.open(this._method, this._uri, true);
			try {
				if (this._opts.extraHeaders) {
					xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
					for (let i in this._opts.extraHeaders) if (this._opts.extraHeaders.hasOwnProperty(i)) xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
				}
			} catch (e) {}
			if ("POST" === this._method) try {
				xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
			} catch (e) {}
			try {
				xhr.setRequestHeader("Accept", "*/*");
			} catch (e) {}
			(_a = this._opts.cookieJar) === null || _a === void 0 || _a.addCookies(xhr);
			if ("withCredentials" in xhr) xhr.withCredentials = this._opts.withCredentials;
			if (this._opts.requestTimeout) xhr.timeout = this._opts.requestTimeout;
			xhr.onreadystatechange = () => {
				var _a;
				if (xhr.readyState === 3) (_a = this._opts.cookieJar) === null || _a === void 0 || _a.parseCookies(xhr.getResponseHeader("set-cookie"));
				if (4 !== xhr.readyState) return;
				if (200 === xhr.status || 1223 === xhr.status) this._onLoad();
				else this.setTimeoutFn(() => {
					this._onError(typeof xhr.status === "number" ? xhr.status : 0);
				}, 0);
			};
			xhr.send(this._data);
		} catch (e) {
			this.setTimeoutFn(() => {
				this._onError(e);
			}, 0);
			return;
		}
		if (typeof document !== "undefined") {
			this._index = Request.requestsCount++;
			Request.requests[this._index] = this;
		}
	}
	/**
	* Called upon error.
	*
	* @private
	*/
	_onError(err) {
		this.emitReserved("error", err, this._xhr);
		this._cleanup(true);
	}
	/**
	* Cleans up house.
	*
	* @private
	*/
	_cleanup(fromError) {
		if ("undefined" === typeof this._xhr || null === this._xhr) return;
		this._xhr.onreadystatechange = empty;
		if (fromError) try {
			this._xhr.abort();
		} catch (e) {}
		if (typeof document !== "undefined") delete Request.requests[this._index];
		this._xhr = null;
	}
	/**
	* Called upon load.
	*
	* @private
	*/
	_onLoad() {
		const data = this._xhr.responseText;
		if (data !== null) {
			this.emitReserved("data", data);
			this.emitReserved("success");
			this._cleanup();
		}
	}
	/**
	* Aborts the request.
	*
	* @package
	*/
	abort() {
		this._cleanup();
	}
};
Request.requestsCount = 0;
Request.requests = {};
/**
* Aborts pending requests when unloading the window. This is needed to prevent
* memory leaks (e.g. when using IE) and to ensure that no spurious error is
* emitted.
*/
if (typeof document !== "undefined") {
	if (typeof attachEvent === "function") attachEvent("onunload", unloadHandler);
	else if (typeof addEventListener === "function") {
		const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
		addEventListener(terminationEvent, unloadHandler, false);
	}
}
function unloadHandler() {
	for (let i in Request.requests) if (Request.requests.hasOwnProperty(i)) Request.requests[i].abort();
}
var hasXHR2 = (function() {
	const xhr = newRequest({ xdomain: false });
	return xhr && xhr.responseType !== null;
})();
/**
* HTTP long-polling based on the built-in `XMLHttpRequest` object.
*
* Usage: browser
*
* @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
*/
var XHR = class extends BaseXHR {
	constructor(opts) {
		super(opts);
		const forceBase64 = opts && opts.forceBase64;
		this.supportsBinary = hasXHR2 && !forceBase64;
	}
	request(opts = {}) {
		Object.assign(opts, { xd: this.xd }, this.opts);
		return new Request(newRequest, this.uri(), opts);
	}
};
function newRequest(opts) {
	const xdomain = opts.xdomain;
	try {
		if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) return new XMLHttpRequest();
	} catch (e) {}
	if (!xdomain) try {
		return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
	} catch (e) {}
}
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/transports/websocket.js
var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
var BaseWS = class extends Transport {
	get name() {
		return "websocket";
	}
	doOpen() {
		const uri = this.uri();
		const protocols = this.opts.protocols;
		const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
		if (this.opts.extraHeaders) opts.headers = this.opts.extraHeaders;
		try {
			this.ws = this.createSocket(uri, protocols, opts);
		} catch (err) {
			return this.emitReserved("error", err);
		}
		this.ws.binaryType = this.socket.binaryType;
		this.addEventListeners();
	}
	/**
	* Adds event listeners to the socket
	*
	* @private
	*/
	addEventListeners() {
		this.ws.onopen = () => {
			if (this.opts.autoUnref) this.ws._socket.unref();
			this.onOpen();
		};
		this.ws.onclose = (closeEvent) => this.onClose({
			description: "websocket connection closed",
			context: closeEvent
		});
		this.ws.onmessage = (ev) => this.onData(ev.data);
		this.ws.onerror = (e) => this.onError("websocket error", e);
	}
	write(packets) {
		this.writable = false;
		for (let i = 0; i < packets.length; i++) {
			const packet = packets[i];
			const lastPacket = i === packets.length - 1;
			encodePacket(packet, this.supportsBinary, (data) => {
				try {
					this.doWrite(packet, data);
				} catch (e) {}
				if (lastPacket) nextTick(() => {
					this.writable = true;
					this.emitReserved("drain");
				}, this.setTimeoutFn);
			});
		}
	}
	doClose() {
		if (typeof this.ws !== "undefined") {
			this.ws.onerror = () => {};
			this.ws.close();
			this.ws = null;
		}
	}
	/**
	* Generates uri for connection.
	*
	* @private
	*/
	uri() {
		const schema = this.opts.secure ? "wss" : "ws";
		const query = this.query || {};
		if (this.opts.timestampRequests) query[this.opts.timestampParam] = randomString();
		if (!this.supportsBinary) query.b64 = 1;
		return this.createUri(schema, query);
	}
};
var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
/**
* WebSocket transport based on the built-in `WebSocket` object.
*
* Usage: browser, Node.js (since v21), Deno, Bun
*
* @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
* @see https://caniuse.com/mdn-api_websocket
* @see https://nodejs.org/api/globals.html#websocket
*/
var WS = class extends BaseWS {
	createSocket(uri, protocols, opts) {
		return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
	}
	doWrite(_packet, data) {
		this.ws.send(data);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/transports/webtransport.js
/**
* WebTransport transport based on the built-in `WebTransport` object.
*
* Usage: browser, Node.js (with the `@fails-components/webtransport` package)
*
* @see https://developer.mozilla.org/en-US/docs/Web/API/WebTransport
* @see https://caniuse.com/webtransport
*/
var WT = class extends Transport {
	get name() {
		return "webtransport";
	}
	doOpen() {
		try {
			this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
		} catch (err) {
			return this.emitReserved("error", err);
		}
		this._transport.closed.then(() => {
			this.onClose();
		}).catch((err) => {
			this.onError("webtransport error", err);
		});
		this._transport.ready.then(() => {
			this._transport.createBidirectionalStream().then((stream) => {
				const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
				const reader = stream.readable.pipeThrough(decoderStream).getReader();
				const encoderStream = createPacketEncoderStream();
				encoderStream.readable.pipeTo(stream.writable);
				this._writer = encoderStream.writable.getWriter();
				const read = () => {
					reader.read().then(({ done, value }) => {
						if (done) return;
						this.onPacket(value);
						read();
					}).catch((err) => {});
				};
				read();
				const packet = { type: "open" };
				if (this.query.sid) packet.data = `{"sid":"${this.query.sid}"}`;
				this._writer.write(packet).then(() => this.onOpen());
			});
		});
	}
	write(packets) {
		this.writable = false;
		for (let i = 0; i < packets.length; i++) {
			const packet = packets[i];
			const lastPacket = i === packets.length - 1;
			this._writer.write(packet).then(() => {
				if (lastPacket) nextTick(() => {
					this.writable = true;
					this.emitReserved("drain");
				}, this.setTimeoutFn);
			});
		}
	}
	doClose() {
		var _a;
		(_a = this._transport) === null || _a === void 0 || _a.close();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/transports/index.js
var transports = {
	websocket: WS,
	webtransport: WT,
	polling: XHR
};
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/contrib/parseuri.js
/**
* Parses a URI
*
* Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
*
* See:
* - https://developer.mozilla.org/en-US/docs/Web/API/URL
* - https://caniuse.com/url
* - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
*
* History of the parse() method:
* - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
* - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
* - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
*
* @author Steven Levithan <stevenlevithan.com> (MIT license)
* @api private
*/
var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
var parts = [
	"source",
	"protocol",
	"authority",
	"userInfo",
	"user",
	"password",
	"host",
	"port",
	"relative",
	"path",
	"directory",
	"file",
	"query",
	"anchor"
];
function parse(str) {
	if (str.length > 8e3) throw "URI too long";
	const src = str, b = str.indexOf("["), e = str.indexOf("]");
	if (b != -1 && e != -1) str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
	let m = re.exec(str || ""), uri = {}, i = 14;
	while (i--) uri[parts[i]] = m[i] || "";
	if (b != -1 && e != -1) {
		uri.source = src;
		uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
		uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
		uri.ipv6uri = true;
	}
	uri.pathNames = pathNames(uri, uri["path"]);
	uri.queryKey = queryKey(uri, uri["query"]);
	return uri;
}
function pathNames(obj, path) {
	const names = path.replace(/\/{2,9}/g, "/").split("/");
	if (path.slice(0, 1) == "/" || path.length === 0) names.splice(0, 1);
	if (path.slice(-1) == "/") names.splice(names.length - 1, 1);
	return names;
}
function queryKey(uri, query) {
	const data = {};
	query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
		if ($1) data[$1] = $2;
	});
	return data;
}
//#endregion
//#region ../../node_modules/.pnpm/engine.io-client@6.6.6/node_modules/engine.io-client/build/esm/socket.js
var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
var OFFLINE_EVENT_LISTENERS = [];
if (withEventListeners) addEventListener("offline", () => {
	OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
}, false);
/**
* This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
* with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
*
* This class comes without upgrade mechanism, which means that it will keep the first low-level transport that
* successfully establishes the connection.
*
* In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
*
* @example
* import { SocketWithoutUpgrade, WebSocket } from "engine.io-client";
*
* const socket = new SocketWithoutUpgrade({
*   transports: [WebSocket]
* });
*
* socket.on("open", () => {
*   socket.send("hello");
* });
*
* @see SocketWithUpgrade
* @see Socket
*/
var SocketWithoutUpgrade = class SocketWithoutUpgrade extends Emitter {
	/**
	* Socket constructor.
	*
	* @param {String|Object} uri - uri or options
	* @param {Object} opts - options
	*/
	constructor(uri, opts) {
		super();
		this.binaryType = defaultBinaryType;
		this.writeBuffer = [];
		this._prevBufferLen = 0;
		this._pingInterval = -1;
		this._pingTimeout = -1;
		this._maxPayload = -1;
		/**
		* The expiration timestamp of the {@link _pingTimeoutTimer} object is tracked, in case the timer is throttled and the
		* callback is not fired on time. This can happen for example when a laptop is suspended or when a phone is locked.
		*/
		this._pingTimeoutTime = Infinity;
		if (uri && "object" === typeof uri) {
			opts = uri;
			uri = null;
		}
		if (uri) {
			const parsedUri = parse(uri);
			opts.hostname = parsedUri.host;
			opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
			opts.port = parsedUri.port;
			if (parsedUri.query) opts.query = parsedUri.query;
		} else if (opts.host) opts.hostname = parse(opts.host).host;
		installTimerFunctions(this, opts);
		this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
		if (opts.hostname && !opts.port) opts.port = this.secure ? "443" : "80";
		this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
		this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
		this.transports = [];
		this._transportsByName = {};
		opts.transports.forEach((t) => {
			const transportName = t.prototype.name;
			this.transports.push(transportName);
			this._transportsByName[transportName] = t;
		});
		this.opts = Object.assign({
			path: "/engine.io",
			agent: false,
			withCredentials: false,
			upgrade: true,
			timestampParam: "t",
			rememberUpgrade: false,
			addTrailingSlash: true,
			rejectUnauthorized: true,
			perMessageDeflate: { threshold: 1024 },
			transportOptions: {},
			closeOnBeforeunload: false
		}, opts);
		this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
		if (typeof this.opts.query === "string") this.opts.query = decode(this.opts.query);
		if (withEventListeners) {
			if (this.opts.closeOnBeforeunload) {
				this._beforeunloadEventListener = () => {
					if (this.transport) {
						this.transport.removeAllListeners();
						this.transport.close();
					}
				};
				addEventListener("beforeunload", this._beforeunloadEventListener, false);
			}
			if (this.hostname !== "localhost") {
				this._offlineEventListener = () => {
					this._onClose("transport close", { description: "network connection lost" });
				};
				OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
			}
		}
		if (this.opts.withCredentials) this._cookieJar = void 0;
		this._open();
	}
	/**
	* Creates transport of the given type.
	*
	* @param {String} name - transport name
	* @return {Transport}
	* @private
	*/
	createTransport(name) {
		const query = Object.assign({}, this.opts.query);
		query.EIO = 4;
		query.transport = name;
		if (this.id) query.sid = this.id;
		const opts = Object.assign({}, this.opts, {
			query,
			socket: this,
			hostname: this.hostname,
			secure: this.secure,
			port: this.port
		}, this.opts.transportOptions[name]);
		return new this._transportsByName[name](opts);
	}
	/**
	* Initializes transport to use and starts probe.
	*
	* @private
	*/
	_open() {
		if (this.transports.length === 0) {
			this.setTimeoutFn(() => {
				this.emitReserved("error", "No transports available");
			}, 0);
			return;
		}
		const transportName = this.opts.rememberUpgrade && SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
		this.readyState = "opening";
		const transport = this.createTransport(transportName);
		transport.open();
		this.setTransport(transport);
	}
	/**
	* Sets the current transport. Disables the existing one (if any).
	*
	* @private
	*/
	setTransport(transport) {
		if (this.transport) this.transport.removeAllListeners();
		this.transport = transport;
		transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
	}
	/**
	* Called when connection is deemed open.
	*
	* @private
	*/
	onOpen() {
		this.readyState = "open";
		SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
		this.emitReserved("open");
		this.flush();
	}
	/**
	* Handles a packet.
	*
	* @private
	*/
	_onPacket(packet) {
		if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
			this.emitReserved("packet", packet);
			this.emitReserved("heartbeat");
			switch (packet.type) {
				case "open":
					this.onHandshake(JSON.parse(packet.data));
					break;
				case "ping":
					this._sendPacket("pong");
					this.emitReserved("ping");
					this.emitReserved("pong");
					this._resetPingTimeout();
					break;
				case "error":
					const err = /* @__PURE__ */ new Error("server error");
					err.code = packet.data;
					this._onError(err);
					break;
				case "message":
					this.emitReserved("data", packet.data);
					this.emitReserved("message", packet.data);
			}
		}
	}
	/**
	* Called upon handshake completion.
	*
	* @param {Object} data - handshake obj
	* @private
	*/
	onHandshake(data) {
		this.emitReserved("handshake", data);
		this.id = data.sid;
		this.transport.query.sid = data.sid;
		this._pingInterval = data.pingInterval;
		this._pingTimeout = data.pingTimeout;
		this._maxPayload = data.maxPayload;
		this.onOpen();
		if ("closed" === this.readyState) return;
		this._resetPingTimeout();
	}
	/**
	* Sets and resets ping timeout timer based on server pings.
	*
	* @private
	*/
	_resetPingTimeout() {
		this.clearTimeoutFn(this._pingTimeoutTimer);
		const delay = this._pingInterval + this._pingTimeout;
		this._pingTimeoutTime = Date.now() + delay;
		this._pingTimeoutTimer = this.setTimeoutFn(() => {
			this._onClose("ping timeout");
		}, delay);
		if (this.opts.autoUnref) this._pingTimeoutTimer.unref();
	}
	/**
	* Called on `drain` event
	*
	* @private
	*/
	_onDrain() {
		this.writeBuffer.splice(0, this._prevBufferLen);
		this._prevBufferLen = 0;
		if (0 === this.writeBuffer.length) this.emitReserved("drain");
		else this.flush();
	}
	/**
	* Flush write buffers.
	*
	* @private
	*/
	flush() {
		if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
			const packets = this._getWritablePackets();
			this.transport.send(packets);
			this._prevBufferLen = packets.length;
			this.emitReserved("flush");
		}
	}
	/**
	* Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
	* long-polling)
	*
	* @private
	*/
	_getWritablePackets() {
		if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1)) return this.writeBuffer;
		let payloadSize = 1;
		for (let i = 0; i < this.writeBuffer.length; i++) {
			const data = this.writeBuffer[i].data;
			if (data) payloadSize += byteLength(data);
			if (i > 0 && payloadSize > this._maxPayload) return this.writeBuffer.slice(0, i);
			payloadSize += 2;
		}
		return this.writeBuffer;
	}
	/**
	* Checks whether the heartbeat timer has expired but the socket has not yet been notified.
	*
	* Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
	* `write()` method then the message would not be buffered by the Socket.IO client.
	*
	* @return {boolean}
	* @private
	*/
	_hasPingExpired() {
		if (!this._pingTimeoutTime) return true;
		const hasExpired = Date.now() > this._pingTimeoutTime;
		if (hasExpired) {
			this._pingTimeoutTime = 0;
			nextTick(() => {
				this._onClose("ping timeout");
			}, this.setTimeoutFn);
		}
		return hasExpired;
	}
	/**
	* Sends a message.
	*
	* @param {String} msg - message.
	* @param {Object} options.
	* @param {Function} fn - callback function.
	* @return {Socket} for chaining.
	*/
	write(msg, options, fn) {
		this._sendPacket("message", msg, options, fn);
		return this;
	}
	/**
	* Sends a message. Alias of {@link Socket#write}.
	*
	* @param {String} msg - message.
	* @param {Object} options.
	* @param {Function} fn - callback function.
	* @return {Socket} for chaining.
	*/
	send(msg, options, fn) {
		this._sendPacket("message", msg, options, fn);
		return this;
	}
	/**
	* Sends a packet.
	*
	* @param {String} type - packet type.
	* @param {String} data.
	* @param {Object} options.
	* @param {Function} fn - callback function.
	* @private
	*/
	_sendPacket(type, data, options, fn) {
		if ("function" === typeof data) {
			fn = data;
			data = void 0;
		}
		if ("function" === typeof options) {
			fn = options;
			options = null;
		}
		if ("closing" === this.readyState || "closed" === this.readyState) return;
		options = options || {};
		options.compress = false !== options.compress;
		const packet = {
			type,
			data,
			options
		};
		this.emitReserved("packetCreate", packet);
		this.writeBuffer.push(packet);
		if (fn) this.once("flush", fn);
		this.flush();
	}
	/**
	* Closes the connection.
	*/
	close() {
		const close = () => {
			this._onClose("forced close");
			this.transport.close();
		};
		const cleanupAndClose = () => {
			this.off("upgrade", cleanupAndClose);
			this.off("upgradeError", cleanupAndClose);
			close();
		};
		const waitForUpgrade = () => {
			this.once("upgrade", cleanupAndClose);
			this.once("upgradeError", cleanupAndClose);
		};
		if ("opening" === this.readyState || "open" === this.readyState) {
			this.readyState = "closing";
			if (this.writeBuffer.length) this.once("drain", () => {
				if (this.upgrading) waitForUpgrade();
				else close();
			});
			else if (this.upgrading) waitForUpgrade();
			else close();
		}
		return this;
	}
	/**
	* Called upon transport error
	*
	* @private
	*/
	_onError(err) {
		SocketWithoutUpgrade.priorWebsocketSuccess = false;
		if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
			this.transports.shift();
			return this._open();
		}
		this.emitReserved("error", err);
		this._onClose("transport error", err);
	}
	/**
	* Called upon transport close.
	*
	* @private
	*/
	_onClose(reason, description) {
		if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
			this.clearTimeoutFn(this._pingTimeoutTimer);
			this.transport.removeAllListeners("close");
			this.transport.close();
			this.transport.removeAllListeners();
			if (withEventListeners) {
				if (this._beforeunloadEventListener) removeEventListener("beforeunload", this._beforeunloadEventListener, false);
				if (this._offlineEventListener) {
					const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
					if (i !== -1) OFFLINE_EVENT_LISTENERS.splice(i, 1);
				}
			}
			this.readyState = "closed";
			this.id = null;
			this.emitReserved("close", reason, description);
			this.writeBuffer = [];
			this._prevBufferLen = 0;
		}
	}
};
SocketWithoutUpgrade.protocol = 4;
/**
* This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
* with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
*
* This class comes with an upgrade mechanism, which means that once the connection is established with the first
* low-level transport, it will try to upgrade to a better transport.
*
* In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
*
* @example
* import { SocketWithUpgrade, WebSocket } from "engine.io-client";
*
* const socket = new SocketWithUpgrade({
*   transports: [WebSocket]
* });
*
* socket.on("open", () => {
*   socket.send("hello");
* });
*
* @see SocketWithoutUpgrade
* @see Socket
*/
var SocketWithUpgrade = class extends SocketWithoutUpgrade {
	constructor() {
		super(...arguments);
		this._upgrades = [];
	}
	onOpen() {
		super.onOpen();
		if ("open" === this.readyState && this.opts.upgrade) for (let i = 0; i < this._upgrades.length; i++) this._probe(this._upgrades[i]);
	}
	/**
	* Probes a transport.
	*
	* @param {String} name - transport name
	* @private
	*/
	_probe(name) {
		let transport = this.createTransport(name);
		let failed = false;
		SocketWithoutUpgrade.priorWebsocketSuccess = false;
		const onTransportOpen = () => {
			if (failed) return;
			transport.send([{
				type: "ping",
				data: "probe"
			}]);
			transport.once("packet", (msg) => {
				if (failed) return;
				if ("pong" === msg.type && "probe" === msg.data) {
					this.upgrading = true;
					this.emitReserved("upgrading", transport);
					if (!transport) return;
					SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
					this.transport.pause(() => {
						if (failed) return;
						if ("closed" === this.readyState) return;
						cleanup();
						this.setTransport(transport);
						transport.send([{ type: "upgrade" }]);
						this.emitReserved("upgrade", transport);
						transport = null;
						this.upgrading = false;
						this.flush();
					});
				} else {
					const err = /* @__PURE__ */ new Error("probe error");
					err.transport = transport.name;
					this.emitReserved("upgradeError", err);
				}
			});
		};
		function freezeTransport() {
			if (failed) return;
			failed = true;
			cleanup();
			transport.close();
			transport = null;
		}
		const onerror = (err) => {
			const error = /* @__PURE__ */ new Error("probe error: " + err);
			error.transport = transport.name;
			freezeTransport();
			this.emitReserved("upgradeError", error);
		};
		function onTransportClose() {
			onerror("transport closed");
		}
		function onclose() {
			onerror("socket closed");
		}
		function onupgrade(to) {
			if (transport && to.name !== transport.name) freezeTransport();
		}
		const cleanup = () => {
			transport.removeListener("open", onTransportOpen);
			transport.removeListener("error", onerror);
			transport.removeListener("close", onTransportClose);
			this.off("close", onclose);
			this.off("upgrading", onupgrade);
		};
		transport.once("open", onTransportOpen);
		transport.once("error", onerror);
		transport.once("close", onTransportClose);
		this.once("close", onclose);
		this.once("upgrading", onupgrade);
		if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") this.setTimeoutFn(() => {
			if (!failed) transport.open();
		}, 200);
		else transport.open();
	}
	onHandshake(data) {
		this._upgrades = this._filterUpgrades(data.upgrades);
		super.onHandshake(data);
	}
	/**
	* Filters upgrades, returning only those matching client transports.
	*
	* @param {Array} upgrades - server upgrades
	* @private
	*/
	_filterUpgrades(upgrades) {
		const filteredUpgrades = [];
		for (let i = 0; i < upgrades.length; i++) if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
		return filteredUpgrades;
	}
};
/**
* This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
* with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
*
* This class comes with an upgrade mechanism, which means that once the connection is established with the first
* low-level transport, it will try to upgrade to a better transport.
*
* @example
* import { Socket } from "engine.io-client";
*
* const socket = new Socket();
*
* socket.on("open", () => {
*   socket.send("hello");
* });
*
* @see SocketWithoutUpgrade
* @see SocketWithUpgrade
*/
var Socket$1 = class extends SocketWithUpgrade {
	constructor(uri, opts = {}) {
		const isOptionsOnly = typeof uri === "object";
		const o = isOptionsOnly ? { ...uri } : { ...opts };
		if (!o.transports || o.transports && typeof o.transports[0] === "string") o.transports = (o.transports || [
			"polling",
			"websocket",
			"webtransport"
		]).map((transportName) => transports[transportName]).filter((t) => !!t);
		super(isOptionsOnly ? o : uri, o);
	}
};
Socket$1.protocol;
//#endregion
//#region ../../node_modules/.pnpm/socket.io-client@4.8.3/node_modules/socket.io-client/build/esm/url.js
/**
* URL parser.
*
* @param uri - url
* @param path - the request path of the connection
* @param loc - An object meant to mimic window.location.
*        Defaults to window.location.
* @public
*/
function url(uri, path = "", loc) {
	let obj = uri;
	loc = loc || typeof location !== "undefined" && location;
	if (null == uri) uri = loc.protocol + "//" + loc.host;
	if (typeof uri === "string") {
		if ("/" === uri.charAt(0)) if ("/" === uri.charAt(1)) uri = loc.protocol + uri;
		else uri = loc.host + uri;
		if (!/^(https?|wss?):\/\//.test(uri)) if ("undefined" !== typeof loc) uri = loc.protocol + "//" + uri;
		else uri = "https://" + uri;
		obj = parse(uri);
	}
	if (!obj.port) {
		if (/^(http|ws)$/.test(obj.protocol)) obj.port = "80";
		else if (/^(http|ws)s$/.test(obj.protocol)) obj.port = "443";
	}
	obj.path = obj.path || "/";
	const host = obj.host.indexOf(":") !== -1 ? "[" + obj.host + "]" : obj.host;
	obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
	obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
	return obj;
}
//#endregion
//#region ../../node_modules/.pnpm/socket.io-parser@4.2.7/node_modules/socket.io-parser/build/esm/is-binary.js
var withNativeArrayBuffer = typeof ArrayBuffer === "function";
var isView = (obj) => {
	return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
};
var toString = Object.prototype.toString;
var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
/**
* Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
*
* @private
*/
function isBinary(obj) {
	return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
}
function hasBinary(obj, toJSON) {
	if (!obj || typeof obj !== "object") return false;
	if (Array.isArray(obj)) {
		for (let i = 0, l = obj.length; i < l; i++) if (hasBinary(obj[i])) return true;
		return false;
	}
	if (isBinary(obj)) return true;
	if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) return hasBinary(obj.toJSON(), true);
	for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) return true;
	return false;
}
//#endregion
//#region ../../node_modules/.pnpm/socket.io-parser@4.2.7/node_modules/socket.io-parser/build/esm/binary.js
/**
* Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
*
* @param {Object} packet - socket.io event packet
* @return {Object} with deconstructed packet and list of buffers
* @public
*/
function deconstructPacket(packet) {
	const buffers = [];
	const packetData = packet.data;
	const pack = packet;
	pack.data = _deconstructPacket(packetData, buffers);
	pack.attachments = buffers.length;
	return {
		packet: pack,
		buffers
	};
}
function _deconstructPacket(data, buffers, toJSON) {
	if (!data) return data;
	if (isBinary(data)) {
		const placeholder = {
			_placeholder: true,
			num: buffers.length
		};
		buffers.push(data);
		return placeholder;
	} else if (Array.isArray(data)) {
		const newData = new Array(data.length);
		for (let i = 0; i < data.length; i++) newData[i] = _deconstructPacket(data[i], buffers);
		return newData;
	} else if (typeof data === "object" && !(data instanceof Date)) {
		if (data.toJSON && typeof data.toJSON === "function" && !toJSON) return _deconstructPacket(data.toJSON(), buffers, true);
		const newData = {};
		for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) newData[key] = _deconstructPacket(data[key], buffers);
		return newData;
	}
	return data;
}
/**
* Reconstructs a binary packet from its placeholder packet and buffers
*
* @param {Object} packet - event packet with placeholders
* @param {Array} buffers - binary buffers to put in placeholder positions
* @return {Object} reconstructed packet
* @public
*/
function reconstructPacket(packet, buffers) {
	packet.data = _reconstructPacket(packet.data, buffers);
	delete packet.attachments;
	return packet;
}
function _reconstructPacket(data, buffers) {
	if (!data) return data;
	if (data && data._placeholder === true) if (typeof data.num === "number" && data.num >= 0 && data.num < buffers.length) return buffers[data.num];
	else throw new Error("illegal attachments");
	else if (Array.isArray(data)) for (let i = 0; i < data.length; i++) data[i] = _reconstructPacket(data[i], buffers);
	else if (typeof data === "object") {
		for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) data[key] = _reconstructPacket(data[key], buffers);
	}
	return data;
}
//#endregion
//#region ../../node_modules/.pnpm/socket.io-parser@4.2.7/node_modules/socket.io-parser/build/esm/index.js
var esm_exports = /* @__PURE__ */ __exportAll({
	Decoder: () => Decoder,
	Encoder: () => Encoder,
	PacketType: () => PacketType,
	isPacketValid: () => isPacketValid,
	protocol: () => 5
});
/**
* These strings must not be used as event names, as they have a special meaning.
*/
var RESERVED_EVENTS$1 = [
	"connect",
	"connect_error",
	"disconnect",
	"disconnecting",
	"newListener",
	"removeListener"
];
var PacketType;
(function(PacketType) {
	PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
	PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
	PacketType[PacketType["EVENT"] = 2] = "EVENT";
	PacketType[PacketType["ACK"] = 3] = "ACK";
	PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
	PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
	PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType || (PacketType = {}));
/**
* A socket.io Encoder instance
*/
var Encoder = class {
	/**
	* Encoder constructor
	*
	* @param {function} replacer - custom replacer to pass down to JSON.parse
	*/
	constructor(replacer) {
		this.replacer = replacer;
	}
	/**
	* Encode a packet as a single string if non-binary, or as a
	* buffer sequence, depending on packet type.
	*
	* @param {Object} obj - packet object
	*/
	encode(obj) {
		if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
			if (hasBinary(obj)) return this.encodeAsBinary({
				type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
				nsp: obj.nsp,
				data: obj.data,
				id: obj.id
			});
		}
		return [this.encodeAsString(obj)];
	}
	/**
	* Encode packet as string.
	*/
	encodeAsString(obj) {
		let str = "" + obj.type;
		if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) str += obj.attachments + "-";
		if (obj.nsp && "/" !== obj.nsp) str += obj.nsp + ",";
		if (null != obj.id) str += obj.id;
		if (null != obj.data) str += JSON.stringify(obj.data, this.replacer);
		return str;
	}
	/**
	* Encode packet as 'buffer sequence' by removing blobs, and
	* deconstructing packet into object with placeholders and
	* a list of buffers.
	*/
	encodeAsBinary(obj) {
		const deconstruction = deconstructPacket(obj);
		const pack = this.encodeAsString(deconstruction.packet);
		const buffers = deconstruction.buffers;
		buffers.unshift(pack);
		return buffers;
	}
};
/**
* A socket.io Decoder instance
*
* @return {Object} decoder
*/
var Decoder = class Decoder extends Emitter {
	/**
	* Decoder constructor
	*/
	constructor(opts) {
		super();
		this.opts = Object.assign({
			reviver: void 0,
			maxAttachments: 10
		}, typeof opts === "function" ? { reviver: opts } : opts);
	}
	/**
	* Decodes an encoded packet string into packet JSON.
	*
	* @param {String} obj - encoded packet
	*/
	add(obj) {
		let packet;
		if (typeof obj === "string") {
			if (this.reconstructor) throw new Error("got plaintext data when reconstructing a packet");
			packet = this.decodeString(obj);
			const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
			if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
				packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
				this.reconstructor = new BinaryReconstructor(packet);
			} else super.emitReserved("decoded", packet);
		} else if (isBinary(obj) || obj.base64) if (!this.reconstructor) throw new Error("got binary data when not reconstructing a packet");
		else {
			packet = this.reconstructor.takeBinaryData(obj);
			if (packet) {
				this.reconstructor = null;
				super.emitReserved("decoded", packet);
			}
		}
		else throw new Error("Unknown type: " + obj);
	}
	/**
	* Decode a packet String (JSON data)
	*
	* @param {String} str
	* @return {Object} packet
	*/
	decodeString(str) {
		let i = 0;
		const p = { type: Number(str.charAt(0)) };
		if (PacketType[p.type] === void 0) throw new Error("unknown packet type " + p.type);
		if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
			const start = i + 1;
			while (str.charAt(++i) !== "-" && i != str.length);
			const buf = str.substring(start, i);
			if (buf != Number(buf) || str.charAt(i) !== "-") throw new Error("Illegal attachments");
			const n = Number(buf);
			if (!isInteger(n) || n < 1) throw new Error("Illegal attachments");
			else if (n > this.opts.maxAttachments) throw new Error("too many attachments");
			p.attachments = n;
		}
		if ("/" === str.charAt(i + 1)) {
			const start = i + 1;
			while (++i) {
				if ("," === str.charAt(i)) break;
				if (i === str.length) break;
			}
			p.nsp = str.substring(start, i);
		} else p.nsp = "/";
		const next = str.charAt(i + 1);
		if ("" !== next && Number(next) == next) {
			const start = i + 1;
			while (++i) {
				const c = str.charAt(i);
				if (null == c || Number(c) != c) {
					--i;
					break;
				}
				if (i === str.length) break;
			}
			p.id = Number(str.substring(start, i + 1));
		}
		if (str.charAt(++i)) {
			const payload = this.tryParse(str.substr(i));
			if (Decoder.isPayloadValid(p.type, payload)) p.data = payload;
			else throw new Error("invalid payload");
		}
		return p;
	}
	tryParse(str) {
		try {
			return JSON.parse(str, this.opts.reviver);
		} catch (e) {
			return false;
		}
	}
	static isPayloadValid(type, payload) {
		switch (type) {
			case PacketType.CONNECT: return isObject(payload);
			case PacketType.DISCONNECT: return payload === void 0;
			case PacketType.CONNECT_ERROR: return typeof payload === "string" || isObject(payload);
			case PacketType.EVENT:
			case PacketType.BINARY_EVENT: return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS$1.indexOf(payload[0]) === -1);
			case PacketType.ACK:
			case PacketType.BINARY_ACK: return Array.isArray(payload);
		}
	}
	/**
	* Deallocates a parser's resources
	*/
	destroy() {
		if (this.reconstructor) {
			this.reconstructor.finishedReconstruction();
			this.reconstructor = null;
		}
	}
};
/**
* A manager of a binary event's 'buffer sequence'. Should
* be constructed whenever a packet of type BINARY_EVENT is
* decoded.
*
* @param {Object} packet
* @return {BinaryReconstructor} initialized reconstructor
*/
var BinaryReconstructor = class {
	constructor(packet) {
		this.packet = packet;
		this.buffers = [];
		this.reconPack = packet;
	}
	/**
	* Method to be called when binary data received from connection
	* after a BINARY_EVENT packet.
	*
	* @param {Buffer | ArrayBuffer} binData - the raw binary data received
	* @return {null | Object} returns null if more binary data is expected or
	*   a reconstructed packet object if all buffers have been received.
	*/
	takeBinaryData(binData) {
		this.buffers.push(binData);
		if (this.buffers.length === this.reconPack.attachments) {
			const packet = reconstructPacket(this.reconPack, this.buffers);
			this.finishedReconstruction();
			return packet;
		}
		return null;
	}
	/**
	* Cleans up binary packet reconstruction variables.
	*/
	finishedReconstruction() {
		this.reconPack = null;
		this.buffers = [];
	}
};
function isNamespaceValid(nsp) {
	return typeof nsp === "string";
}
var isInteger = Number.isInteger || function(value) {
	return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};
function isAckIdValid(id) {
	return id === void 0 || isInteger(id);
}
function isObject(value) {
	return Object.prototype.toString.call(value) === "[object Object]";
}
function isDataValid(type, payload) {
	switch (type) {
		case PacketType.CONNECT: return payload === void 0 || isObject(payload);
		case PacketType.DISCONNECT: return payload === void 0;
		case PacketType.EVENT: return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS$1.indexOf(payload[0]) === -1);
		case PacketType.ACK: return Array.isArray(payload);
		case PacketType.CONNECT_ERROR: return typeof payload === "string" || isObject(payload);
		default: return false;
	}
}
function isPacketValid(packet) {
	return isNamespaceValid(packet.nsp) && isAckIdValid(packet.id) && isDataValid(packet.type, packet.data);
}
//#endregion
//#region ../../node_modules/.pnpm/socket.io-client@4.8.3/node_modules/socket.io-client/build/esm/on.js
function on(obj, ev, fn) {
	obj.on(ev, fn);
	return function subDestroy() {
		obj.off(ev, fn);
	};
}
//#endregion
//#region ../../node_modules/.pnpm/socket.io-client@4.8.3/node_modules/socket.io-client/build/esm/socket.js
/**
* Internal events.
* These events can't be emitted by the user.
*/
var RESERVED_EVENTS = Object.freeze({
	connect: 1,
	connect_error: 1,
	disconnect: 1,
	disconnecting: 1,
	newListener: 1,
	removeListener: 1
});
/**
* A Socket is the fundamental class for interacting with the server.
*
* A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
*
* @example
* const socket = io();
*
* socket.on("connect", () => {
*   console.log("connected");
* });
*
* // send an event to the server
* socket.emit("foo", "bar");
*
* socket.on("foobar", () => {
*   // an event was received from the server
* });
*
* // upon disconnection
* socket.on("disconnect", (reason) => {
*   console.log(`disconnected due to ${reason}`);
* });
*/
var Socket = class extends Emitter {
	/**
	* `Socket` constructor.
	*/
	constructor(io, nsp, opts) {
		super();
		/**
		* Whether the socket is currently connected to the server.
		*
		* @example
		* const socket = io();
		*
		* socket.on("connect", () => {
		*   console.log(socket.connected); // true
		* });
		*
		* socket.on("disconnect", () => {
		*   console.log(socket.connected); // false
		* });
		*/
		this.connected = false;
		/**
		* Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
		* be transmitted by the server.
		*/
		this.recovered = false;
		/**
		* Buffer for packets received before the CONNECT packet
		*/
		this.receiveBuffer = [];
		/**
		* Buffer for packets that will be sent once the socket is connected
		*/
		this.sendBuffer = [];
		/**
		* The queue of packets to be sent with retry in case of failure.
		*
		* Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
		* @private
		*/
		this._queue = [];
		/**
		* A sequence to generate the ID of the {@link QueuedPacket}.
		* @private
		*/
		this._queueSeq = 0;
		this.ids = 0;
		/**
		* A map containing acknowledgement handlers.
		*
		* The `withError` attribute is used to differentiate handlers that accept an error as first argument:
		*
		* - `socket.emit("test", (err, value) => { ... })` with `ackTimeout` option
		* - `socket.timeout(5000).emit("test", (err, value) => { ... })`
		* - `const value = await socket.emitWithAck("test")`
		*
		* From those that don't:
		*
		* - `socket.emit("test", (value) => { ... });`
		*
		* In the first case, the handlers will be called with an error when:
		*
		* - the timeout is reached
		* - the socket gets disconnected
		*
		* In the second case, the handlers will be simply discarded upon disconnection, since the client will never receive
		* an acknowledgement from the server.
		*
		* @private
		*/
		this.acks = {};
		this.flags = {};
		this.io = io;
		this.nsp = nsp;
		if (opts && opts.auth) this.auth = opts.auth;
		this._opts = Object.assign({}, opts);
		if (this.io._autoConnect) this.open();
	}
	/**
	* Whether the socket is currently disconnected
	*
	* @example
	* const socket = io();
	*
	* socket.on("connect", () => {
	*   console.log(socket.disconnected); // false
	* });
	*
	* socket.on("disconnect", () => {
	*   console.log(socket.disconnected); // true
	* });
	*/
	get disconnected() {
		return !this.connected;
	}
	/**
	* Subscribe to open, close and packet events
	*
	* @private
	*/
	subEvents() {
		if (this.subs) return;
		const io = this.io;
		this.subs = [
			on(io, "open", this.onopen.bind(this)),
			on(io, "packet", this.onpacket.bind(this)),
			on(io, "error", this.onerror.bind(this)),
			on(io, "close", this.onclose.bind(this))
		];
	}
	/**
	* Whether the Socket will try to reconnect when its Manager connects or reconnects.
	*
	* @example
	* const socket = io();
	*
	* console.log(socket.active); // true
	*
	* socket.on("disconnect", (reason) => {
	*   if (reason === "io server disconnect") {
	*     // the disconnection was initiated by the server, you need to manually reconnect
	*     console.log(socket.active); // false
	*   }
	*   // else the socket will automatically try to reconnect
	*   console.log(socket.active); // true
	* });
	*/
	get active() {
		return !!this.subs;
	}
	/**
	* "Opens" the socket.
	*
	* @example
	* const socket = io({
	*   autoConnect: false
	* });
	*
	* socket.connect();
	*/
	connect() {
		if (this.connected) return this;
		this.subEvents();
		if (!this.io["_reconnecting"]) this.io.open();
		if ("open" === this.io._readyState) this.onopen();
		return this;
	}
	/**
	* Alias for {@link connect()}.
	*/
	open() {
		return this.connect();
	}
	/**
	* Sends a `message` event.
	*
	* This method mimics the WebSocket.send() method.
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
	*
	* @example
	* socket.send("hello");
	*
	* // this is equivalent to
	* socket.emit("message", "hello");
	*
	* @return self
	*/
	send(...args) {
		args.unshift("message");
		this.emit.apply(this, args);
		return this;
	}
	/**
	* Override `emit`.
	* If the event is in `events`, it's emitted normally.
	*
	* @example
	* socket.emit("hello", "world");
	*
	* // all serializable datastructures are supported (no need to call JSON.stringify)
	* socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
	*
	* // with an acknowledgement from the server
	* socket.emit("hello", "world", (val) => {
	*   // ...
	* });
	*
	* @return self
	*/
	emit(ev, ...args) {
		var _a, _b, _c;
		if (RESERVED_EVENTS.hasOwnProperty(ev)) throw new Error("\"" + ev.toString() + "\" is a reserved event name");
		args.unshift(ev);
		if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
			this._addToQueue(args);
			return this;
		}
		const packet = {
			type: PacketType.EVENT,
			data: args
		};
		packet.options = {};
		packet.options.compress = this.flags.compress !== false;
		if ("function" === typeof args[args.length - 1]) {
			const id = this.ids++;
			const ack = args.pop();
			this._registerAckCallback(id, ack);
			packet.id = id;
		}
		const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
		const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
		if (this.flags.volatile && !isTransportWritable) {} else if (isConnected) {
			this.notifyOutgoingListeners(packet);
			this.packet(packet);
		} else this.sendBuffer.push(packet);
		this.flags = {};
		return this;
	}
	/**
	* @private
	*/
	_registerAckCallback(id, ack) {
		var _a;
		const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
		if (timeout === void 0) {
			this.acks[id] = ack;
			return;
		}
		const timer = this.io.setTimeoutFn(() => {
			delete this.acks[id];
			for (let i = 0; i < this.sendBuffer.length; i++) if (this.sendBuffer[i].id === id) this.sendBuffer.splice(i, 1);
			ack.call(this, /* @__PURE__ */ new Error("operation has timed out"));
		}, timeout);
		const fn = (...args) => {
			this.io.clearTimeoutFn(timer);
			ack.apply(this, args);
		};
		fn.withError = true;
		this.acks[id] = fn;
	}
	/**
	* Emits an event and waits for an acknowledgement
	*
	* @example
	* // without timeout
	* const response = await socket.emitWithAck("hello", "world");
	*
	* // with a specific timeout
	* try {
	*   const response = await socket.timeout(1000).emitWithAck("hello", "world");
	* } catch (err) {
	*   // the server did not acknowledge the event in the given delay
	* }
	*
	* @return a Promise that will be fulfilled when the server acknowledges the event
	*/
	emitWithAck(ev, ...args) {
		return new Promise((resolve, reject) => {
			const fn = (arg1, arg2) => {
				return arg1 ? reject(arg1) : resolve(arg2);
			};
			fn.withError = true;
			args.push(fn);
			this.emit(ev, ...args);
		});
	}
	/**
	* Add the packet to the queue.
	* @param args
	* @private
	*/
	_addToQueue(args) {
		let ack;
		if (typeof args[args.length - 1] === "function") ack = args.pop();
		const packet = {
			id: this._queueSeq++,
			tryCount: 0,
			pending: false,
			args,
			flags: Object.assign({ fromQueue: true }, this.flags)
		};
		args.push((err, ...responseArgs) => {
			if (packet !== this._queue[0]) {}
			if (err !== null) {
				if (packet.tryCount > this._opts.retries) {
					this._queue.shift();
					if (ack) ack(err);
				}
			} else {
				this._queue.shift();
				if (ack) ack(null, ...responseArgs);
			}
			packet.pending = false;
			return this._drainQueue();
		});
		this._queue.push(packet);
		this._drainQueue();
	}
	/**
	* Send the first packet of the queue, and wait for an acknowledgement from the server.
	* @param force - whether to resend a packet that has not been acknowledged yet
	*
	* @private
	*/
	_drainQueue(force = false) {
		if (!this.connected || this._queue.length === 0) return;
		const packet = this._queue[0];
		if (packet.pending && !force) return;
		packet.pending = true;
		packet.tryCount++;
		this.flags = packet.flags;
		this.emit.apply(this, packet.args);
	}
	/**
	* Sends a packet.
	*
	* @param packet
	* @private
	*/
	packet(packet) {
		packet.nsp = this.nsp;
		this.io._packet(packet);
	}
	/**
	* Called upon engine `open`.
	*
	* @private
	*/
	onopen() {
		if (typeof this.auth == "function") this.auth((data) => {
			this._sendConnectPacket(data);
		});
		else this._sendConnectPacket(this.auth);
	}
	/**
	* Sends a CONNECT packet to initiate the Socket.IO session.
	*
	* @param data
	* @private
	*/
	_sendConnectPacket(data) {
		this.packet({
			type: PacketType.CONNECT,
			data: this._pid ? Object.assign({
				pid: this._pid,
				offset: this._lastOffset
			}, data) : data
		});
	}
	/**
	* Called upon engine or manager `error`.
	*
	* @param err
	* @private
	*/
	onerror(err) {
		if (!this.connected) this.emitReserved("connect_error", err);
	}
	/**
	* Called upon engine `close`.
	*
	* @param reason
	* @param description
	* @private
	*/
	onclose(reason, description) {
		this.connected = false;
		delete this.id;
		this.emitReserved("disconnect", reason, description);
		this._clearAcks();
	}
	/**
	* Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
	* the server.
	*
	* @private
	*/
	_clearAcks() {
		Object.keys(this.acks).forEach((id) => {
			if (!this.sendBuffer.some((packet) => String(packet.id) === id)) {
				const ack = this.acks[id];
				delete this.acks[id];
				if (ack.withError) ack.call(this, /* @__PURE__ */ new Error("socket has been disconnected"));
			}
		});
	}
	/**
	* Called with socket packet.
	*
	* @param packet
	* @private
	*/
	onpacket(packet) {
		if (!(packet.nsp === this.nsp)) return;
		switch (packet.type) {
			case PacketType.CONNECT:
				if (packet.data && packet.data.sid) this.onconnect(packet.data.sid, packet.data.pid);
				else this.emitReserved("connect_error", /* @__PURE__ */ new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
				break;
			case PacketType.EVENT:
			case PacketType.BINARY_EVENT:
				this.onevent(packet);
				break;
			case PacketType.ACK:
			case PacketType.BINARY_ACK:
				this.onack(packet);
				break;
			case PacketType.DISCONNECT:
				this.ondisconnect();
				break;
			case PacketType.CONNECT_ERROR:
				this.destroy();
				const err = new Error(packet.data.message);
				err.data = packet.data.data;
				this.emitReserved("connect_error", err);
		}
	}
	/**
	* Called upon a server event.
	*
	* @param packet
	* @private
	*/
	onevent(packet) {
		const args = packet.data || [];
		if (null != packet.id) args.push(this.ack(packet.id));
		if (this.connected) this.emitEvent(args);
		else this.receiveBuffer.push(Object.freeze(args));
	}
	emitEvent(args) {
		if (this._anyListeners && this._anyListeners.length) {
			const listeners = this._anyListeners.slice();
			for (const listener of listeners) listener.apply(this, args);
		}
		super.emit.apply(this, args);
		if (this._pid && args.length && typeof args[args.length - 1] === "string") this._lastOffset = args[args.length - 1];
	}
	/**
	* Produces an ack callback to emit with an event.
	*
	* @private
	*/
	ack(id) {
		const self = this;
		let sent = false;
		return function(...args) {
			if (sent) return;
			sent = true;
			self.packet({
				type: PacketType.ACK,
				id,
				data: args
			});
		};
	}
	/**
	* Called upon a server acknowledgement.
	*
	* @param packet
	* @private
	*/
	onack(packet) {
		const ack = this.acks[packet.id];
		if (typeof ack !== "function") return;
		delete this.acks[packet.id];
		if (ack.withError) packet.data.unshift(null);
		ack.apply(this, packet.data);
	}
	/**
	* Called upon server connect.
	*
	* @private
	*/
	onconnect(id, pid) {
		this.id = id;
		this.recovered = pid && this._pid === pid;
		this._pid = pid;
		this.connected = true;
		this.emitBuffered();
		this._drainQueue(true);
		this.emitReserved("connect");
	}
	/**
	* Emit buffered events (received and emitted).
	*
	* @private
	*/
	emitBuffered() {
		this.receiveBuffer.forEach((args) => this.emitEvent(args));
		this.receiveBuffer = [];
		this.sendBuffer.forEach((packet) => {
			this.notifyOutgoingListeners(packet);
			this.packet(packet);
		});
		this.sendBuffer = [];
	}
	/**
	* Called upon server disconnect.
	*
	* @private
	*/
	ondisconnect() {
		this.destroy();
		this.onclose("io server disconnect");
	}
	/**
	* Called upon forced client/server side disconnections,
	* this method ensures the manager stops tracking us and
	* that reconnections don't get triggered for this.
	*
	* @private
	*/
	destroy() {
		if (this.subs) {
			this.subs.forEach((subDestroy) => subDestroy());
			this.subs = void 0;
		}
		this.io["_destroy"](this);
	}
	/**
	* Disconnects the socket manually. In that case, the socket will not try to reconnect.
	*
	* If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
	*
	* @example
	* const socket = io();
	*
	* socket.on("disconnect", (reason) => {
	*   // console.log(reason); prints "io client disconnect"
	* });
	*
	* socket.disconnect();
	*
	* @return self
	*/
	disconnect() {
		if (this.connected) this.packet({ type: PacketType.DISCONNECT });
		this.destroy();
		if (this.connected) this.onclose("io client disconnect");
		return this;
	}
	/**
	* Alias for {@link disconnect()}.
	*
	* @return self
	*/
	close() {
		return this.disconnect();
	}
	/**
	* Sets the compress flag.
	*
	* @example
	* socket.compress(false).emit("hello");
	*
	* @param compress - if `true`, compresses the sending data
	* @return self
	*/
	compress(compress) {
		this.flags.compress = compress;
		return this;
	}
	/**
	* Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
	* ready to send messages.
	*
	* @example
	* socket.volatile.emit("hello"); // the server may or may not receive it
	*
	* @returns self
	*/
	get volatile() {
		this.flags.volatile = true;
		return this;
	}
	/**
	* Sets a modifier for a subsequent event emission that the callback will be called with an error when the
	* given number of milliseconds have elapsed without an acknowledgement from the server:
	*
	* @example
	* socket.timeout(5000).emit("my-event", (err) => {
	*   if (err) {
	*     // the server did not acknowledge the event in the given delay
	*   }
	* });
	*
	* @returns self
	*/
	timeout(timeout) {
		this.flags.timeout = timeout;
		return this;
	}
	/**
	* Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
	* callback.
	*
	* @example
	* socket.onAny((event, ...args) => {
	*   console.log(`got ${event}`);
	* });
	*
	* @param listener
	*/
	onAny(listener) {
		this._anyListeners = this._anyListeners || [];
		this._anyListeners.push(listener);
		return this;
	}
	/**
	* Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
	* callback. The listener is added to the beginning of the listeners array.
	*
	* @example
	* socket.prependAny((event, ...args) => {
	*   console.log(`got event ${event}`);
	* });
	*
	* @param listener
	*/
	prependAny(listener) {
		this._anyListeners = this._anyListeners || [];
		this._anyListeners.unshift(listener);
		return this;
	}
	/**
	* Removes the listener that will be fired when any event is emitted.
	*
	* @example
	* const catchAllListener = (event, ...args) => {
	*   console.log(`got event ${event}`);
	* }
	*
	* socket.onAny(catchAllListener);
	*
	* // remove a specific listener
	* socket.offAny(catchAllListener);
	*
	* // or remove all listeners
	* socket.offAny();
	*
	* @param listener
	*/
	offAny(listener) {
		if (!this._anyListeners) return this;
		if (listener) {
			const listeners = this._anyListeners;
			for (let i = 0; i < listeners.length; i++) if (listener === listeners[i]) {
				listeners.splice(i, 1);
				return this;
			}
		} else this._anyListeners = [];
		return this;
	}
	/**
	* Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
	* e.g. to remove listeners.
	*/
	listenersAny() {
		return this._anyListeners || [];
	}
	/**
	* Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
	* callback.
	*
	* Note: acknowledgements sent to the server are not included.
	*
	* @example
	* socket.onAnyOutgoing((event, ...args) => {
	*   console.log(`sent event ${event}`);
	* });
	*
	* @param listener
	*/
	onAnyOutgoing(listener) {
		this._anyOutgoingListeners = this._anyOutgoingListeners || [];
		this._anyOutgoingListeners.push(listener);
		return this;
	}
	/**
	* Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
	* callback. The listener is added to the beginning of the listeners array.
	*
	* Note: acknowledgements sent to the server are not included.
	*
	* @example
	* socket.prependAnyOutgoing((event, ...args) => {
	*   console.log(`sent event ${event}`);
	* });
	*
	* @param listener
	*/
	prependAnyOutgoing(listener) {
		this._anyOutgoingListeners = this._anyOutgoingListeners || [];
		this._anyOutgoingListeners.unshift(listener);
		return this;
	}
	/**
	* Removes the listener that will be fired when any event is emitted.
	*
	* @example
	* const catchAllListener = (event, ...args) => {
	*   console.log(`sent event ${event}`);
	* }
	*
	* socket.onAnyOutgoing(catchAllListener);
	*
	* // remove a specific listener
	* socket.offAnyOutgoing(catchAllListener);
	*
	* // or remove all listeners
	* socket.offAnyOutgoing();
	*
	* @param [listener] - the catch-all listener (optional)
	*/
	offAnyOutgoing(listener) {
		if (!this._anyOutgoingListeners) return this;
		if (listener) {
			const listeners = this._anyOutgoingListeners;
			for (let i = 0; i < listeners.length; i++) if (listener === listeners[i]) {
				listeners.splice(i, 1);
				return this;
			}
		} else this._anyOutgoingListeners = [];
		return this;
	}
	/**
	* Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
	* e.g. to remove listeners.
	*/
	listenersAnyOutgoing() {
		return this._anyOutgoingListeners || [];
	}
	/**
	* Notify the listeners for each packet sent
	*
	* @param packet
	*
	* @private
	*/
	notifyOutgoingListeners(packet) {
		if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
			const listeners = this._anyOutgoingListeners.slice();
			for (const listener of listeners) listener.apply(this, packet.data);
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/socket.io-client@4.8.3/node_modules/socket.io-client/build/esm/contrib/backo2.js
/**
* Initialize backoff timer with `opts`.
*
* - `min` initial timeout in milliseconds [100]
* - `max` max timeout [10000]
* - `jitter` [0]
* - `factor` [2]
*
* @param {Object} opts
* @api public
*/
function Backoff(opts) {
	opts = opts || {};
	this.ms = opts.min || 100;
	this.max = opts.max || 1e4;
	this.factor = opts.factor || 2;
	this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
	this.attempts = 0;
}
/**
* Return the backoff duration.
*
* @return {Number}
* @api public
*/
Backoff.prototype.duration = function() {
	var ms = this.ms * Math.pow(this.factor, this.attempts++);
	if (this.jitter) {
		var rand = Math.random();
		var deviation = Math.floor(rand * this.jitter * ms);
		ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
	}
	return Math.min(ms, this.max) | 0;
};
/**
* Reset the number of attempts.
*
* @api public
*/
Backoff.prototype.reset = function() {
	this.attempts = 0;
};
/**
* Set the minimum duration
*
* @api public
*/
Backoff.prototype.setMin = function(min) {
	this.ms = min;
};
/**
* Set the maximum duration
*
* @api public
*/
Backoff.prototype.setMax = function(max) {
	this.max = max;
};
/**
* Set the jitter
*
* @api public
*/
Backoff.prototype.setJitter = function(jitter) {
	this.jitter = jitter;
};
//#endregion
//#region ../../node_modules/.pnpm/socket.io-client@4.8.3/node_modules/socket.io-client/build/esm/manager.js
var Manager = class extends Emitter {
	constructor(uri, opts) {
		var _a;
		super();
		this.nsps = {};
		this.subs = [];
		if (uri && "object" === typeof uri) {
			opts = uri;
			uri = void 0;
		}
		opts = opts || {};
		opts.path = opts.path || "/socket.io";
		this.opts = opts;
		installTimerFunctions(this, opts);
		this.reconnection(opts.reconnection !== false);
		this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
		this.reconnectionDelay(opts.reconnectionDelay || 1e3);
		this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
		this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : .5);
		this.backoff = new Backoff({
			min: this.reconnectionDelay(),
			max: this.reconnectionDelayMax(),
			jitter: this.randomizationFactor()
		});
		this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
		this._readyState = "closed";
		this.uri = uri;
		const _parser = opts.parser || esm_exports;
		this.encoder = new _parser.Encoder();
		this.decoder = new _parser.Decoder();
		this._autoConnect = opts.autoConnect !== false;
		if (this._autoConnect) this.open();
	}
	reconnection(v) {
		if (!arguments.length) return this._reconnection;
		this._reconnection = !!v;
		if (!v) this.skipReconnect = true;
		return this;
	}
	reconnectionAttempts(v) {
		if (v === void 0) return this._reconnectionAttempts;
		this._reconnectionAttempts = v;
		return this;
	}
	reconnectionDelay(v) {
		var _a;
		if (v === void 0) return this._reconnectionDelay;
		this._reconnectionDelay = v;
		(_a = this.backoff) === null || _a === void 0 || _a.setMin(v);
		return this;
	}
	randomizationFactor(v) {
		var _a;
		if (v === void 0) return this._randomizationFactor;
		this._randomizationFactor = v;
		(_a = this.backoff) === null || _a === void 0 || _a.setJitter(v);
		return this;
	}
	reconnectionDelayMax(v) {
		var _a;
		if (v === void 0) return this._reconnectionDelayMax;
		this._reconnectionDelayMax = v;
		(_a = this.backoff) === null || _a === void 0 || _a.setMax(v);
		return this;
	}
	timeout(v) {
		if (!arguments.length) return this._timeout;
		this._timeout = v;
		return this;
	}
	/**
	* Starts trying to reconnect if reconnection is enabled and we have not
	* started reconnecting yet
	*
	* @private
	*/
	maybeReconnectOnOpen() {
		if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) this.reconnect();
	}
	/**
	* Sets the current transport `socket`.
	*
	* @param {Function} fn - optional, callback
	* @return self
	* @public
	*/
	open(fn) {
		if (~this._readyState.indexOf("open")) return this;
		this.engine = new Socket$1(this.uri, this.opts);
		const socket = this.engine;
		const self = this;
		this._readyState = "opening";
		this.skipReconnect = false;
		const openSubDestroy = on(socket, "open", function() {
			self.onopen();
			fn && fn();
		});
		const onError = (err) => {
			this.cleanup();
			this._readyState = "closed";
			this.emitReserved("error", err);
			if (fn) fn(err);
			else this.maybeReconnectOnOpen();
		};
		const errorSub = on(socket, "error", onError);
		if (false !== this._timeout) {
			const timeout = this._timeout;
			const timer = this.setTimeoutFn(() => {
				openSubDestroy();
				onError(/* @__PURE__ */ new Error("timeout"));
				socket.close();
			}, timeout);
			if (this.opts.autoUnref) timer.unref();
			this.subs.push(() => {
				this.clearTimeoutFn(timer);
			});
		}
		this.subs.push(openSubDestroy);
		this.subs.push(errorSub);
		return this;
	}
	/**
	* Alias for open()
	*
	* @return self
	* @public
	*/
	connect(fn) {
		return this.open(fn);
	}
	/**
	* Called upon transport open.
	*
	* @private
	*/
	onopen() {
		this.cleanup();
		this._readyState = "open";
		this.emitReserved("open");
		const socket = this.engine;
		this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
	}
	/**
	* Called upon a ping.
	*
	* @private
	*/
	onping() {
		this.emitReserved("ping");
	}
	/**
	* Called with data.
	*
	* @private
	*/
	ondata(data) {
		try {
			this.decoder.add(data);
		} catch (e) {
			this.onclose("parse error", e);
		}
	}
	/**
	* Called when parser fully decodes a packet.
	*
	* @private
	*/
	ondecoded(packet) {
		nextTick(() => {
			this.emitReserved("packet", packet);
		}, this.setTimeoutFn);
	}
	/**
	* Called upon socket error.
	*
	* @private
	*/
	onerror(err) {
		this.emitReserved("error", err);
	}
	/**
	* Creates a new socket for the given `nsp`.
	*
	* @return {Socket}
	* @public
	*/
	socket(nsp, opts) {
		let socket = this.nsps[nsp];
		if (!socket) {
			socket = new Socket(this, nsp, opts);
			this.nsps[nsp] = socket;
		} else if (this._autoConnect && !socket.active) socket.connect();
		return socket;
	}
	/**
	* Called upon a socket close.
	*
	* @param socket
	* @private
	*/
	_destroy(socket) {
		const nsps = Object.keys(this.nsps);
		for (const nsp of nsps) if (this.nsps[nsp].active) return;
		this._close();
	}
	/**
	* Writes a packet.
	*
	* @param packet
	* @private
	*/
	_packet(packet) {
		const encodedPackets = this.encoder.encode(packet);
		for (let i = 0; i < encodedPackets.length; i++) this.engine.write(encodedPackets[i], packet.options);
	}
	/**
	* Clean up transport subscriptions and packet buffer.
	*
	* @private
	*/
	cleanup() {
		this.subs.forEach((subDestroy) => subDestroy());
		this.subs.length = 0;
		this.decoder.destroy();
	}
	/**
	* Close the current socket.
	*
	* @private
	*/
	_close() {
		this.skipReconnect = true;
		this._reconnecting = false;
		this.onclose("forced close");
	}
	/**
	* Alias for close()
	*
	* @private
	*/
	disconnect() {
		return this._close();
	}
	/**
	* Called when:
	*
	* - the low-level engine is closed
	* - the parser encountered a badly formatted packet
	* - all sockets are disconnected
	*
	* @private
	*/
	onclose(reason, description) {
		var _a;
		this.cleanup();
		(_a = this.engine) === null || _a === void 0 || _a.close();
		this.backoff.reset();
		this._readyState = "closed";
		this.emitReserved("close", reason, description);
		if (this._reconnection && !this.skipReconnect) this.reconnect();
	}
	/**
	* Attempt a reconnection.
	*
	* @private
	*/
	reconnect() {
		if (this._reconnecting || this.skipReconnect) return this;
		const self = this;
		if (this.backoff.attempts >= this._reconnectionAttempts) {
			this.backoff.reset();
			this.emitReserved("reconnect_failed");
			this._reconnecting = false;
		} else {
			const delay = this.backoff.duration();
			this._reconnecting = true;
			const timer = this.setTimeoutFn(() => {
				if (self.skipReconnect) return;
				this.emitReserved("reconnect_attempt", self.backoff.attempts);
				if (self.skipReconnect) return;
				self.open((err) => {
					if (err) {
						self._reconnecting = false;
						self.reconnect();
						this.emitReserved("reconnect_error", err);
					} else self.onreconnect();
				});
			}, delay);
			if (this.opts.autoUnref) timer.unref();
			this.subs.push(() => {
				this.clearTimeoutFn(timer);
			});
		}
	}
	/**
	* Called upon successful reconnect.
	*
	* @private
	*/
	onreconnect() {
		const attempt = this.backoff.attempts;
		this._reconnecting = false;
		this.backoff.reset();
		this.emitReserved("reconnect", attempt);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/socket.io-client@4.8.3/node_modules/socket.io-client/build/esm/index.js
/**
* Managers cache.
*/
var cache = {};
function lookup(uri, opts) {
	if (typeof uri === "object") {
		opts = uri;
		uri = void 0;
	}
	opts = opts || {};
	const parsed = url(uri, opts.path || "/socket.io");
	const source = parsed.source;
	const id = parsed.id;
	const path = parsed.path;
	const sameNamespace = cache[id] && path in cache[id]["nsps"];
	const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
	let io;
	if (newConnection) io = new Manager(source, opts);
	else {
		if (!cache[id]) cache[id] = new Manager(source, opts);
		io = cache[id];
	}
	if (parsed.query && !opts.query) opts.query = parsed.queryKey;
	return io.socket(parsed.path, opts);
}
Object.assign(lookup, {
	Manager,
	Socket,
	io: lookup,
	connect: lookup
});
//#endregion
//#region ../../packages/core/src/socket/urlSelector.ts
/**
* 创建地址选择器
*
* @param options 配置
* @returns 选择器实例
*/
function createUrlSelector(options) {
	const urls = (options.urls ?? []).filter(Boolean);
	const blacklistTtlMs = options.blacklistTtlMs ?? 6e4;
	/** 黑名单：url -> 到期时间 */
	const blacklist = /* @__PURE__ */ new Map();
	/** round-robin 游标 */
	let cursor = 0;
	const isBlacklisted = (url) => {
		const entry = blacklist.get(url);
		if (!entry) return false;
		if (Date.now() >= entry.expireAt) {
			blacklist.delete(url);
			return false;
		}
		return true;
	};
	const next = () => {
		if (urls.length === 0) return null;
		if (urls.every((u) => isBlacklisted(u))) blacklist.clear();
		for (let i = 0; i < urls.length; i++) {
			const index = (cursor + i) % urls.length;
			const candidate = urls[index];
			if (!isBlacklisted(candidate)) {
				cursor = (index + 1) % urls.length;
				return candidate;
			}
		}
		const fallback = urls[cursor % urls.length];
		cursor = (cursor + 1) % urls.length;
		return fallback;
	};
	const markSuccess = (url) => {
		blacklist.delete(url);
	};
	const markFailure = (url) => {
		blacklist.set(url, { expireAt: Date.now() + blacklistTtlMs });
	};
	const reset = () => {
		blacklist.clear();
	};
	const availableCount = () => {
		return urls.filter((u) => !isBlacklisted(u)).length;
	};
	return {
		next,
		markSuccess,
		markFailure,
		reset,
		availableCount
	};
}
//#endregion
//#region ../../packages/core/src/socket/socketio.ts
/**
* Socket.IO 协议实现
* 基于 socket.io-client，支持自动连接/重连与统一消息解析
*
* 用法：
*   const io = createSocketIOService({ urls: [...], context: "/socket.io" });
*   io.on("message", (data) => ...);
*/
/**
* 清除服务端握手响应（Set-Cookie）种下的陈旧会话 cookie。
*
* netty-socketio 的 AuthorizeHandler 在 randomSession=false（默认）时会直接取
* 请求里的 io cookie 值作为新会话 id。浏览器把上一次握手的 io=<sid> 存在源上，
* 之后任何新建的 socket.io 客户端握手都会带着它「复用」该会话。旧实例被
* disconnect 后，netty 侧会话与通道仍是僵尸态（releasePollingChannel 只解绑
* channel、不删 ClientHead，pingTimeout 到期前会话一直可查），新实例复用僵尸
* 会话后 CONNECT_ACK 永远投递不到，表现为 connect 事件永不触发、全部订阅静默
* ——监控页数值冻结的根因。每次新建连接前清掉该 cookie，强制服务端签发全新会话。
*/
function clearSocketSessionCookie() {
	if (typeof document === "undefined") return;
	const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
	for (const path of [
		"/socket.io",
		"/socket.io/",
		"/"
	]) document.cookie = `io=; path=${path}; ${expired}`;
}
/**
* 创建 Socket.IO 服务
*
* @param config 配置
* @returns SocketTemplate 实例
*/
function createSocketIOService(config) {
	const isConnected = ref(false);
	let socketInstance = null;
	const eventListeners = /* @__PURE__ */ new Map();
	const autoConnect = config.autoConnect ?? true;
	/** 多地址负载均衡 / 失败降级选择器 */
	const selector = createUrlSelector({
		urls: config.urls,
		blacklistTtlMs: config.blacklistTtlMs
	});
	const transports = config.transports && config.transports.length > 0 ? config.transports : ["polling", "websocket"];
	/** 看门狗定时器：长时间未连接时强制重建，避免库自身重连卡死导致永久失联 */
	let watchdog = null;
	/** 连续未连接起始时间戳，0 表示当前已连 */
	let downSince = 0;
	const connect = () => {
		if (socketInstance?.connected) return;
		if (socketInstance) {
			socketInstance.connect();
			return;
		}
		const token = getSocketToken();
		const url = selector.next();
		if (!url) {
			log.warn("[Socket.IO] 无可用的连接地址");
			return;
		}
		clearSocketSessionCookie();
		socketInstance = lookup(url, {
			path: config.context || "/socket.io",
			transports,
			autoConnect,
			reconnection: config.reconnection ?? true,
			reconnectionAttempts: config.reconnectionAttempts ?? Infinity,
			reconnectionDelay: config.reconnectionDelay ?? 1e3,
			reconnectionDelayMax: 5e3,
			timeout: 8e3,
			extraHeaders: { "x-oauth-token": token || "" },
			query: { ...config.query }
		});
		socketInstance.on("connect", () => {
			isConnected.value = true;
			downSince = 0;
			selector.markSuccess(url);
		});
		socketInstance.on("disconnect", () => {
			isConnected.value = false;
			if (!downSince) downSince = Date.now();
		});
		socketInstance.io.on("reconnect_failed", () => {
			forceRebuild("reconnect_failed");
		});
		socketInstance.on("connect_error", (error) => {
			log.error(`[Socket.IO] 连接错误 ${url}:`, error);
			selector.markFailure(url);
			if (selector.availableCount() > 0) {
				if (socketInstance) {
					socketInstance.removeAllListeners();
					socketInstance.disconnect();
					socketInstance = null;
					isConnected.value = false;
				}
				connect();
			}
		});
		socketInstance.on("message", (raw) => {
			try {
				const parsed = parseSocketMessage(raw);
				const msg = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
				if (!msg?.module || !msg?.event) return;
				const key = `${msg.module}_${msg.event}`;
				subscribeHandlers.get(key)?.forEach((h) => {
					try {
						h(msg);
					} catch {}
				});
			} catch {}
		});
		if (!autoConnect) socketInstance.connect();
		startWatchdog();
	};
	/**
	* 彻底拆除当前连接并整体重建（看门狗 / 重连失败兜底）。
	*
	* @param reason 触发原因，用于日志
	*/
	function forceRebuild(reason) {
		log.warn(`[Socket.IO] 强制重建连接（${reason}）`);
		try {
			socketInstance?.removeAllListeners();
			socketInstance?.disconnect();
		} catch {}
		socketInstance = null;
		isConnected.value = false;
		downSince = Date.now();
		connect();
	}
	/**
	* 启动连接看门狗：未连接超过 20s 则强制重建，从未建连时主动发起。
	*/
	function startWatchdog() {
		if (watchdog) return;
		watchdog = setInterval(() => {
			if (isConnected.value) {
				downSince = 0;
				return;
			}
			if (!socketInstance) {
				if (!downSince) downSince = Date.now();
				connect();
			}
			if (!downSince) downSince = Date.now();
			if (Date.now() - downSince > 2e4) forceRebuild("watchdog-timeout");
		}, 5e3);
	}
	/** 停止看门狗（主动关闭时） */
	function stopWatchdog() {
		if (watchdog) {
			clearInterval(watchdog);
			watchdog = null;
		}
	}
	const disconnect = () => {
		stopWatchdog();
		if (socketInstance) {
			socketInstance.disconnect();
			socketInstance = null;
			isConnected.value = false;
			downSince = 0;
		}
		clearSocketSessionCookie();
	};
	const on = (event, callback, options) => {
		if (!socketInstance) connect();
		if (!socketInstance) return;
		const wrappedCallback = (rawData) => {
			const data = parseSocketMessage(rawData);
			if (!matchesSocketListenOptions(data, options, rawData)) return;
			callback(data);
		};
		socketInstance.on(event, wrappedCallback);
		if (!eventListeners.has(event)) eventListeners.set(event, /* @__PURE__ */ new Set());
		eventListeners.get(event).add(wrappedCallback);
	};
	const off = (event) => {
		if (socketInstance) socketInstance.off(event);
		eventListeners.delete(event);
	};
	const emit = (event, data) => {
		if (!socketInstance) connect();
		if (socketInstance?.connected) {
			socketInstance.emit(event, data);
			return;
		}
		log.warn("[Socket.IO] 未连接，无法发送消息");
	};
	const close = () => {
		stopWatchdog();
		disconnect();
		eventListeners.clear();
	};
	const subscribeHandlers = /* @__PURE__ */ new Map();
	const subscribe = (module, event, handler) => {
		if (!socketInstance) connect();
		const key = `${module}_${event}`;
		if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, /* @__PURE__ */ new Set());
		subscribeHandlers.get(key).add(handler);
		return () => subscribeHandlers.get(key)?.delete(handler);
	};
	if (autoConnect) connect();
	return {
		protocol: "socketio",
		get socket() {
			return socketInstance;
		},
		get isConnected() {
			return isConnected.value;
		},
		get connected() {
			return isConnected;
		},
		connect,
		disconnect,
		on,
		off,
		emit,
		close,
		subscribe
	};
}
//#endregion
//#region ../../packages/core/src/socket/websocket.ts
/**
* WebSocket 协议实现
* 原生 WebSocket 协议封装，含心跳保活与自动重连
*
* 用法：
*   const ws = createWebSocketService({ urls: [...], path: "/ws" });
*   ws.on("message", (data) => ...);
*/
/**
* 创建 WebSocket 服务
*
* @param config 配置
* @returns SocketTemplate 实例
*/
function createWebSocketService(config) {
	const isConnected = ref(false);
	let wsInstance = null;
	let heartbeatTimer = null;
	let reconnectAttempts = 0;
	const eventListeners = /* @__PURE__ */ new Map();
	/** 多地址负载均衡 / 失败降级选择器 */
	const selector = createUrlSelector({
		urls: config.urls,
		blacklistTtlMs: config.blacklistTtlMs
	});
	const triggerEvent = (event, data) => {
		const listeners = eventListeners.get(event);
		if (listeners) listeners.forEach((callback) => {
			try {
				callback(data);
			} catch (error) {
				log.error(`[WebSocket] 事件处理错误 [${event}]:`, error);
			}
		});
	};
	const startHeartbeat = () => {
		if (config.heartbeatInterval && config.heartbeatInterval > 0) heartbeatTimer = setInterval(() => {
			if (wsInstance?.readyState === WebSocket.OPEN) wsInstance.send(JSON.stringify({
				event: "ping",
				timestamp: Date.now()
			}));
		}, config.heartbeatInterval);
	};
	const stopHeartbeat = () => {
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
		}
	};
	const connect = () => {
		if (wsInstance?.readyState === WebSocket.OPEN) return;
		try {
			const token = getSocketToken();
			const baseUrlRaw = selector.next();
			if (!baseUrlRaw) {
				log.warn(`[WebSocket] 无可用的连接地址`);
				return;
			}
			let baseUrl = toWebSocketUrl(baseUrlRaw);
			if (config.path) baseUrl = baseUrl.replace(/\/$/, "") + config.path;
			const url = new URL(baseUrl);
			if (token) url.searchParams.set("x-oauth-token", token);
			if (config.query) Object.entries(config.query).forEach(([key, value]) => {
				url.searchParams.set(key, value);
			});
			wsInstance = config.protocols ? new WebSocket(url.toString(), config.protocols) : new WebSocket(url.toString());
			wsInstance.onopen = () => {
				isConnected.value = true;
				reconnectAttempts = 0;
				selector.markSuccess(baseUrlRaw);
				startHeartbeat();
				triggerEvent("connect", { connected: true });
			};
			wsInstance.onclose = (event) => {
				isConnected.value = false;
				stopHeartbeat();
				triggerEvent("disconnect", {
					connected: false,
					code: event.code,
					reason: event.reason
				});
				if (wsInstance?.readyState !== WebSocket.CLOSED || event.code !== 1e3) selector.markFailure(baseUrlRaw);
				const maxAttempts = config.reconnectionAttempts ?? 3;
				if (config.reconnection !== false && reconnectAttempts < maxAttempts) {
					reconnectAttempts++;
					const delay = config.reconnectionDelay || 1e3;
					setTimeout(() => {
						if (!isConnected.value) connect();
					}, delay * reconnectAttempts);
				}
			};
			wsInstance.onerror = (error) => {
				log.error(`[WebSocket] 连接错误 ${baseUrlRaw}:`, error);
				triggerEvent("error", error);
			};
			wsInstance.onmessage = (event) => {
				try {
					if (typeof event.data !== "string") {
						triggerEvent("message", event.data);
						return;
					}
					let message;
					try {
						message = JSON.parse(event.data);
					} catch {
						triggerEvent("message", event.data);
						return;
					}
					if (message.event === "pong") return;
					const eventName = message.event || "message";
					const data = parseSocketMessage(message.data !== void 0 ? message.data : message);
					triggerEvent(eventName, data);
				} catch (error) {
					log.error(`[WebSocket] 消息解析错误:`, error);
				}
			};
		} catch (error) {
			log.error(`[WebSocket] 创建连接失败:`, error);
		}
	};
	const disconnect = () => {
		stopHeartbeat();
		if (wsInstance) {
			wsInstance.close();
			wsInstance = null;
			isConnected.value = false;
		}
	};
	const on = (event, callback, options) => {
		const wrappedCallback = (data) => {
			if (!matchesSocketListenOptions(data, options)) return;
			callback(data);
		};
		if (!eventListeners.has(event)) eventListeners.set(event, /* @__PURE__ */ new Set());
		eventListeners.get(event).add(wrappedCallback);
	};
	const off = (event) => {
		eventListeners.delete(event);
	};
	const emit = (event, data) => {
		if (wsInstance?.readyState === WebSocket.OPEN) wsInstance.send(JSON.stringify({
			event,
			data,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}));
		else log.warn(`[WebSocket] 未连接，无法发送消息`);
	};
	const close = () => {
		disconnect();
		eventListeners.clear();
	};
	const subscribeHandlers = /* @__PURE__ */ new Map();
	const subscribe = (module, event, handler) => {
		const key = `${module}_${event}`;
		if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, /* @__PURE__ */ new Set());
		subscribeHandlers.get(key).add(handler);
		return () => subscribeHandlers.get(key)?.delete(handler);
	};
	on("message", (raw) => {
		try {
			const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
			if (!msg?.module || !msg?.event) return;
			const key = `${msg.module}_${msg.event}`;
			subscribeHandlers.get(key)?.forEach((h) => {
				try {
					h(msg);
				} catch {}
			});
		} catch {}
	});
	return {
		protocol: "websocket",
		get socket() {
			return wsInstance;
		},
		get isConnected() {
			return isConnected.value;
		},
		get connected() {
			return isConnected;
		},
		connect,
		disconnect,
		on,
		off,
		emit,
		close,
		subscribe
	};
}
//#endregion
//#region ../../packages/core/src/socket/sse.ts
/**
* SSE (Server-Sent Events) 协议实现
* 基于 @microsoft/fetch-event-source，提供统一的 SocketTemplate 接口
*
* 注意：SSE 为单向通信（服务端→客户端），emit 仅打印警告。
*
* 用法：
*   const sse = createSseService({ urls: [...], path: "/sse/connect" });
*   sse.on("message", (data) => ...);
*/
/**
* 创建 SSE 服务
*
* @param config SSE 配置
* @returns SocketTemplate 实例
*/
function createSseService(config) {
	let abortController = null;
	const isConnected = ref(false);
	const listeners = /* @__PURE__ */ new Map();
	let reconnectAttempts = 0;
	const maxReconnectAttempts = config.reconnectionAttempts ?? 5;
	/** 多地址负载均衡 / 失败降级选择器 */
	const selector = createUrlSelector({
		urls: config.urls,
		blacklistTtlMs: config.blacklistTtlMs
	});
	const buildUrl = () => {
		const token = getSocketToken();
		const baseUrlRaw = selector.next();
		if (!baseUrlRaw) return {
			url: "",
			baseUrlRaw: ""
		};
		let baseUrl = baseUrlRaw;
		if (config.path) baseUrl = baseUrl.replace(/\/$/, "") + config.path;
		const queryParams = { ...config.query };
		if (config.clientId) queryParams.clientId = config.clientId;
		return {
			url: buildAuthUrl(baseUrl, token, queryParams),
			baseUrlRaw
		};
	};
	const connect = () => {
		if (abortController) {
			log.warn("[SSE] 已连接，请先断开连接");
			return;
		}
		abortController = new AbortController();
		const { url, baseUrlRaw } = buildUrl();
		if (!url) {
			log.warn("[SSE] 无可用的连接地址");
			abortController = null;
			return;
		}
		const token = getSocketToken();
		fetchEventSource(url, {
			method: "GET",
			headers: {
				Accept: "text/event-stream",
				Authorization: token ? `Bearer ${token}` : "",
				...config.query || {}
			},
			signal: abortController.signal,
			openWhenHidden: true,
			async onopen(response) {
				if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
					isConnected.value = true;
					reconnectAttempts = 0;
					selector.markSuccess(baseUrlRaw);
					triggerListeners("connect", { connected: true });
				} else {
					selector.markFailure(baseUrlRaw);
					throw new Error(`[SSE] 连接失败: ${response.status} ${response.statusText}`);
				}
			},
			onmessage(event) {
				const eventName = event.event || "message";
				const data = parseSocketMessage(event.data);
				if (eventName === "connected") {}
				triggerListeners(eventName, data);
			},
			onerror(error) {
				log.error(`[SSE] 连接错误`, error);
				isConnected.value = false;
				triggerListeners("error", error);
				if (config.reconnection !== false && reconnectAttempts < maxReconnectAttempts) {
					reconnectAttempts++;
					config.reconnectionDelay;
					throw error;
				} else if (reconnectAttempts >= maxReconnectAttempts) {
					abortController?.abort();
					abortController = null;
				}
			},
			onclose() {
				isConnected.value = false;
				triggerListeners("close", { closed: true });
			}
		}).catch((error) => {
			if (error.name !== "AbortError") log.error(`[SSE] fetchEventSource 错误:`, error);
		});
	};
	const disconnect = () => {
		if (abortController) {
			abortController.abort();
			abortController = null;
			isConnected.value = false;
			reconnectAttempts = maxReconnectAttempts;
		}
	};
	const triggerListeners = (event, data) => {
		const eventListeners = listeners.get(event);
		if (eventListeners) eventListeners.forEach((callback) => {
			try {
				callback(data);
			} catch (e) {
				log.error(`[SSE] 事件处理错误: ${event}`, e);
			}
		});
	};
	const on = (event, callback, options) => {
		if (!listeners.has(event)) listeners.set(event, /* @__PURE__ */ new Set());
		const wrappedCallback = (data) => {
			if (!matchesSocketListenOptions(data, options)) return;
			callback(data);
		};
		listeners.get(event)?.add(wrappedCallback);
	};
	const off = (event) => {
		listeners.delete(event);
	};
	const emit = (_event, _data) => {
		log.warn("[SSE] SSE 是单向通信协议，不支持客户端发送消息。如需双向通信，请使用 WebSocket 或 Socket.IO。");
	};
	const close = () => {
		disconnect();
		listeners.clear();
	};
	const subscribeHandlers = /* @__PURE__ */ new Map();
	const subscribe = (module, event, handler) => {
		const key = `${module}_${event}`;
		if (!subscribeHandlers.has(key)) subscribeHandlers.set(key, /* @__PURE__ */ new Set());
		subscribeHandlers.get(key).add(handler);
		return () => subscribeHandlers.get(key)?.delete(handler);
	};
	on("message", (raw) => {
		try {
			const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
			if (!msg?.module || !msg?.event) return;
			const key = `${msg.module}_${msg.event}`;
			subscribeHandlers.get(key)?.forEach((h) => {
				try {
					h(msg);
				} catch {}
			});
		} catch {}
	});
	return {
		protocol: "sse",
		get socket() {
			return abortController;
		},
		get isConnected() {
			return isConnected.value;
		},
		get connected() {
			return isConnected;
		},
		connect,
		disconnect,
		on,
		off,
		emit,
		close,
		subscribe
	};
}
//#endregion
//#region ../../packages/core/src/socket/socketService.ts
/**
* 统一 Socket 服务入口
*
* 支持多种协议：Socket.IO / WebSocket / SSE，对外提供统一的 API 接口。
* 支持全局实例（默认从 getConfig().socket 读取配置自动创建）与命名实例（可自建）。
*
* 用法：
*   // 全局实例（createApp 已装配，直接用）
*   const service = getGlobalSocketService();
*   service.on("system:config:update", (data) => ...);
*
*   // 命名实例（自建，不依赖全局）
*   const mine = createNamedSocketService("server", { protocol: "websocket", urls: [...] });
*
*   // 创建器（裸创建，不入全局管理）
*   const any = createSocketService({ protocol: "sse", urls: [...] });
*/
/** 全局 Socket 服务实例 */
var globalSocketService = null;
/** 把配置字符串（逗号分隔）拆成数组 */
var splitUrls = (value) => {
	if (typeof value !== "string") return [];
	return value.split(",").map((item) => item.trim()).filter(Boolean);
};
/** 解析 origin（相对地址基于当前页面源） */
var resolveOrigin = (value) => {
	if (typeof value !== "string" || !value.trim()) return null;
	try {
		if (typeof window !== "undefined" && window.location?.origin) return new URL(value, window.location.origin).origin;
		return new URL(value).origin;
	} catch {
		return null;
	}
};
var getWindowGlobalSocketService = () => {
	if (typeof window === "undefined") return null;
	return window.__GLOBAL_SOCKET_SERVICE__ ?? null;
};
var syncWindowGlobalSocketService = (service) => {
	if (typeof window === "undefined") return;
	if (service) {
		window.__GLOBAL_SOCKET_SERVICE__ = service;
		return;
	}
	delete window.__GLOBAL_SOCKET_SERVICE__;
};
/**
* 获取全局 Socket 配置（优先 config.socket，回退到后端 BaseUrl/当前源）
* 后端 Setting 映射的 SocketOpen/SocketUrl/SocketProtocol/SocketPath 会写入 config.socket。
*/
function getGlobalSocketConfig() {
	const appConfig = getConfig() || {};
	const socket = appConfig.socket || {};
	const explicitUrls = splitUrls(socket.urls);
	const protocol = typeof socket.protocol === "string" && socket.protocol.trim() ? socket.protocol.trim().toLowerCase() : "socketio";
	const context = socket.context || "/socket.io";
	if (explicitUrls.length > 0) return {
		protocol,
		urls: explicitUrls,
		context
	};
	const baseUrl = resolveOrigin(appConfig.http?.baseUrl) || (typeof window !== "undefined" ? window.location.origin : null);
	return {
		protocol,
		urls: baseUrl ? [baseUrl] : [],
		context
	};
}
/**
* 创建 Socket 服务（创建器）
* 根据协议类型自动选择实现；不注册到全局/命名管理，由调用方自行持有。
*
* @param config 配置
* @returns SocketTemplate 实例
*/
function createSocketService(config) {
	const protocol = config.protocol || "sse";
	switch (protocol) {
		case "socketio": return createSocketIOService({
			urls: config.urls || [],
			transports: config.transports,
			context: config.context,
			query: config.query,
			autoConnect: config.autoConnect,
			reconnection: config.reconnection,
			reconnectionAttempts: config.reconnectionAttempts,
			reconnectionDelay: config.reconnectionDelay,
			blacklistTtlMs: config.blacklistTtlMs
		});
		case "websocket": return createWebSocketService({
			urls: config.urls || [],
			path: config.path || config.context,
			query: config.query,
			reconnection: config.reconnection,
			reconnectionAttempts: config.reconnectionAttempts,
			reconnectionDelay: config.reconnectionDelay,
			heartbeatInterval: config.heartbeatInterval,
			blacklistTtlMs: config.blacklistTtlMs
		});
		case "sse": return createSseService({
			urls: config.urls || [],
			path: config.path,
			query: config.query,
			clientId: config.clientId,
			reconnection: config.reconnection,
			reconnectionDelay: config.reconnectionDelay,
			reconnectionAttempts: config.reconnectionAttempts,
			blacklistTtlMs: config.blacklistTtlMs
		});
		default:
			log.warn(`[SocketService] 未知协议类型: ${protocol}，使用默认 Socket.IO`);
			return createSocketIOService({
				urls: config.urls || [],
				context: config.context,
				query: config.query,
				blacklistTtlMs: config.blacklistTtlMs
			});
	}
}
/**
* 初始化全局 Socket 服务
* 根据配置自动选择协议；会先关闭旧的全局连接。
*
* @param config 配置
* @returns SocketTemplate 实例
*/
function initGlobalSocketService(config) {
	if (globalSocketService) globalSocketService.close();
	globalSocketService = createSocketService(config);
	syncWindowGlobalSocketService(globalSocketService);
	return globalSocketService;
}
/**
* 将全局 Socket 服务提供到 Vue 应用上下文
*
* @param app Vue 应用实例
* @param service SocketTemplate 实例
* @returns SocketTemplate 实例
*/
function provideGlobalSocketService(app, service) {
	globalSocketService = service;
	syncWindowGlobalSocketService(service);
	app.provide(SocketTemplateKey, service);
	return service;
}
/**
* 获取全局 Socket 服务（优先注入的 provider，其次 window 上的旧实例）
*/
function getGlobalSocketService() {
	if (globalSocketService) return globalSocketService;
	const windowService = getWindowGlobalSocketService();
	if (windowService) {
		globalSocketService = windowService;
		return windowService;
	}
	return null;
}
/**
* 使用全局 Socket 服务（Vue 组合式 API）
* 优先从 inject 获取，回退到全局实例。
* 在 setup / 组件上下文之外调用时（无 currentScope）跳过 inject 直接读全局实例，
* 避免 [Vue warn]: inject() can only be used inside setup() 警告。
*/
function useSocketService() {
	if (getCurrentScope()) {
		const injected = inject(SocketTemplateKey, null);
		if (injected) return injected;
	}
	return getGlobalSocketService();
}
/** 关闭全局 Socket 服务 */
function closeGlobalSocketService() {
	const service = getGlobalSocketService();
	if (service) service.close();
	globalSocketService = null;
	syncWindowGlobalSocketService(null);
}
//#endregion
//#region ../../packages/core/src/monitor/index.ts
/**
* 全局异常监控（core）—— 主线程封装
*
* 启动时注册 window error / unhandledrejection / 资源加载失败监听，
* 将异常规范化后交给 Worker（errorMonitor.worker.ts）做去重、采样、批量缓冲，
* Worker 回传批量记录后，主线程按 monitor.reportUrl 上报服务端（POST JSON）。
*
* reportUrl 为空时不上报服务端，仅通过 onBatch 订阅对外暴露（本地统计 / 控制台）。
* 卸载函数同时终止 Worker 并移除所有监听，保证页面销毁无残留。
*
* 用法（createApp 已接入，无需手动调用）：
*   const dispose = installErrorMonitor();
*   // 页面卸载时
*   dispose();
*/
/** 监控实例（模块级单例，重复 install 幂等） */
var monitorInstance = null;
/**
* 安装全局异常监控（读取 getConfig().monitor）。
* @returns 卸载函数；monitor.enable=false 时返回空操作
*/
function installErrorMonitor() {
	const cfg = getConfig().monitor;
	if (!cfg?.enable) return () => {};
	if (monitorInstance) return monitorInstance.dispose;
	monitorInstance = createErrorMonitor(cfg);
	return monitorInstance.dispose;
}
/** 构建监控实例（内部实现，单例由 installErrorMonitor 保证） */
function createErrorMonitor(cfg) {
	let worker = null;
	const subscribers = /* @__PURE__ */ new Set();
	const buffer = [];
	try {
		if (typeof Worker !== "undefined") {
			worker = new Worker(new URL(
				/* @vite-ignore */
				"/assets/errorMonitor.worker-B31__FAm.js",
				"" + import.meta.url
			), { type: "module" });
			worker.onmessage = (event) => {
				const msg = event.data;
				if (msg?.type === "batch" && Array.isArray(msg.records)) emitBatch(msg.records);
			};
			worker.onerror = () => {
				worker = null;
			};
			worker.postMessage({
				type: "start",
				config: cfg
			});
		}
	} catch {
		worker = null;
	}
	/** 主线程直接缓冲并触发批量上报（Worker 不可用时的降级路径） */
	function pushToWorker(record) {
		if (worker) {
			worker.postMessage({
				type: "report",
				record
			});
			return;
		}
		buffer.push(record);
		if (buffer.length > cfg.maxBuffer) buffer.shift();
		if (buffer.length >= cfg.batchSize) emitBatch(buffer.splice(0, buffer.length));
	}
	/** 批量记录交给订阅者并按 reportUrl 上报 */
	function emitBatch(records) {
		subscribers.forEach((handler) => {
			try {
				handler(records);
			} catch {}
		});
		reportToServer(records);
	}
	/** 上报服务端（reportUrl 为空时跳过） */
	async function reportToServer(records) {
		const url = cfg.reportUrl;
		if (!url || records.length === 0) return;
		try {
			await getApiHttp().post(url).data({
				records,
				time: Date.now()
			}).timeout(1e4).then((r) => r.data);
		} catch {}
	}
	/** 规范化异常事件 → ErrorRecord */
	function buildRecord(input) {
		return {
			key: [
				input.source,
				input.message,
				input.filename ?? "",
				input.resourceUrl ?? "",
				input.lineno ?? 0,
				input.colno ?? 0
			].join("|"),
			source: input.source,
			message: input.message,
			stack: input.stack,
			filename: input.filename,
			lineno: input.lineno,
			colno: input.colno,
			resourceUrl: input.resourceUrl,
			tagName: input.tagName,
			firstAt: Date.now(),
			count: 1
		};
	}
	/** 捕获 JS 运行时错误（window error 事件） */
	function handleError(event) {
		if (!cfg.captureJsError) return;
		pushToWorker(buildRecord({
			source: "js",
			message: event.message || "Uncaught Error",
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			stack: event.error?.stack
		}));
	}
	/** 捕获未处理的 Promise 拒绝 */
	function handleRejection(event) {
		if (!cfg.captureRejection) return;
		const reason = event.reason;
		pushToWorker(buildRecord({
			source: "rejection",
			message: reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled Promise Rejection",
			stack: reason instanceof Error ? reason.stack : void 0
		}));
	}
	/** 捕获资源加载失败（window error 捕获阶段，target 为元素） */
	function handleResourceError(event) {
		if (!cfg.captureResource) return;
		const target = event.target;
		if (!target) return;
		const tagName = target.tagName ?? "";
		if (![
			"IMG",
			"SCRIPT",
			"LINK",
			"VIDEO",
			"AUDIO",
			"SOURCE",
			"IFRAME"
		].includes(tagName)) return;
		const el = target;
		const resourceUrl = (el.currentSrc || el.src || el.href || "").slice(0, 500);
		pushToWorker(buildRecord({
			source: "resource",
			message: `资源加载失败: <${tagName.toLowerCase()}>`,
			tagName,
			resourceUrl
		}));
	}
	window.addEventListener("error", handleError);
	window.addEventListener("unhandledrejection", handleRejection);
	window.addEventListener("error", handleResourceError, true);
	const onVisibility = () => {
		if (document.visibilityState === "hidden") {
			if (worker) worker.postMessage({ type: "flush" });
			else if (buffer.length) emitBatch(buffer.splice(0, buffer.length));
		}
	};
	document.addEventListener("visibilitychange", onVisibility);
	/** 主动捕获（外部调用，如 Vue errorHandler） */
	function capture(error, source = "manual") {
		pushToWorker(buildRecord({
			source,
			message: error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown Error",
			stack: error instanceof Error ? error.stack : void 0
		}));
	}
	/** 订阅批量记录 */
	function subscribe(handler) {
		subscribers.add(handler);
		return () => subscribers.delete(handler);
	}
	/** 立即冲刷 */
	function flush() {
		if (worker) worker.postMessage({ type: "flush" });
		else if (buffer.length) emitBatch(buffer.splice(0, buffer.length));
	}
	/** 卸载：终止 Worker + 移除监听 */
	function dispose() {
		window.removeEventListener("error", handleError);
		window.removeEventListener("unhandledrejection", handleRejection);
		window.removeEventListener("error", handleResourceError, true);
		document.removeEventListener("visibilitychange", onVisibility);
		if (worker) {
			worker.terminate();
			worker = null;
		}
		subscribers.clear();
		buffer.length = 0;
		monitorInstance = null;
	}
	return {
		dispose,
		capture,
		subscribe,
		flush
	};
}
//#endregion
//#region ../../packages/core/src/createApp.ts
/**
* createApp —— 链式装配应用基础上下文
*
* 每一层都是独立异步阶段，按依赖顺序嵌套组合，任一层失败有独立降级策略：
*   ① loadCrypto        → wasm 加密模块（失败：抛 SystemException，链路中断）
*   ② loadAppConfig     → app.yaml 加载并合并（失败：默认值，链路继续）
*   ③ buildStorage      → 带命名空间/加密的 storage（复用 ① 的 crypto）
*   ④ buildToken        → 令牌管理器（复用 ② 的 token 配置）
*   ⑤ buildHttp         → 加密/签名拦截器 http（复用 ① crypto + ② http 配置）
*   ⑥ buildRouter       → 路由 + 权限守卫（复用 ② app.openAuth + ④ token）
*   ⑦ syncPermissions   → 从 storage 同步用户角色/权限（复用 ③）
*
* 职责边界：
*   - 本函数只做「纯逻辑装配」，不涉及 Vue 实例 / 主题应用
*   - 主题选择与令牌应用由 @repo/app 的主题安装器（resolveThemeInstaller）负责
*   - Vue 层（实例创建 / 插件注册 / 挂载）由 @repo/app 的 createApp 负责
*
* 用法：
*   const app = await createApp({ appName: "demo" });
*   app.crypto.sm3(...);  app.config.app.title;  app.storage.set(...);
*/
/**
* 链式装配应用基础上下文
* @throws SystemException 第①步失败时
*/
async function createApp(options = {}) {
	const baseUrl = options.baseUrl ?? "";
	const appName = options.appName ?? "default";
	log.info("createApp", "① loadCrypto...");
	const crypto = await loadCrypto({
		url: options.cryptoUrl,
		loader: options.cryptoLoader
	});
	log.info("createApp", "② loadConfig...");
	const config = await loadConfig({
		appName,
		baseUrl,
		configUrl: options.configUrl,
		defaults: options.defaults
	});
	await restoreUserConfig();
	log.info("createApp", "③ buildStorage...");
	const storage = buildStorage(crypto, config);
	setAppStorage(storage);
	log.info("createApp", "④ createTokenManager...");
	const token = createTokenManager(storage, config.token);
	token.start();
	log.info("createApp", "⑤ buildHttp...");
	const http = buildHttp(crypto, config);
	setApiHttp(http);
	setDefaultHttpInstance(http.getInstance());
	log.info("createApp", "⑥ createAppRouter...");
	const remoteLoader = options.loadRemoteRoutes ?? await getRemoteRouteLoader();
	const router = createAppRouter({
		routes: options.routes,
		mode: options.routerMode ?? "history",
		getAccessToken: () => token.getAccessToken(),
		loadRemoteRoutes: remoteLoader,
		setup: options.setupRouter
	});
	setRouter(router);
	log.info("createApp", "⑦ syncUserPerm...");
	syncUserPerm(storage.get(USER_INFO_KEY));
	log.info("createApp", "⑧ installAntiDebug...");
	const disposeSecurity = installAntiDebug();
	const disposeMonitor = installErrorMonitor();
	log.info("createApp", "⑨ bindConfigHotReload...");
	bindConfigHotReload();
	if (config.config?.enable !== false && config.url?.setting) {
		log.info("createApp", "⑩ loadDefaultSetting...");
		await loadDefaultSetting();
	}
	setSocketTokenProvider(() => token.getAccessToken());
	/** 当前生效的 socket 连接配置签名：仅配置真正变化时才重建连接 */
	const socketConfigSignature = () => {
		try {
			const resolved = getGlobalSocketConfig();
			const s = getConfig().socket || {};
			return JSON.stringify({
				enable: s.enable,
				protocol: resolved.protocol,
				urls: resolved.urls,
				context: resolved.context,
				path: s.path,
				transports: s.transports
			});
		} catch {
			return "";
		}
	};
	let lastSocketSignature = socketConfigSignature();
	const disposeSocket = initGlobalSocket(() => config.socket.enable);
	const disposeHotReload = onConfigHotReload(() => {
		refreshAntiDebug();
		applyGlobalWatermark();
		const signature = socketConfigSignature();
		if (signature === lastSocketSignature) return;
		lastSocketSignature = signature;
		initGlobalSocket(() => config.socket.enable);
	});
	initGlobalTimer(config.other?.timer?.zones ?? []);
	warmHeaderCapabilityProbes(config);
	return {
		appName,
		crypto,
		config,
		storage,
		token,
		http,
		router,
		disposeSecurity: () => {
			disposeSecurity();
			disposeMonitor();
			disposeHotReload();
			disposeSocket();
			destroyGlobalTimer();
		},
		disposeSocket
	};
}
/** 反调试热更新：配置变更（setConfig）后调用，按需安装/卸载 */
function refreshSecurity() {
	refreshAntiDebug();
}
/**
* 预热顶栏天气/台风的后台能力探测（HEAD）。
*
* 探测结果由 probeBackend 按路径缓存 10 分钟，组件挂载时直接命中；
* 这里只提前发起，失败不影响启动（探测内部已吞掉异常并回落三方）。
*/
function warmHeaderCapabilityProbes(config) {
	const other = config.other;
	if (other?.toolbar?.weather && other?.weather?.enable !== false) {
		probeBackend(WEATHER_OVERVIEW_PATH);
		probeBackend(LOCATION_RESOLVE_PATH);
	}
	if (other?.toolbar?.typhoon) probeBackend(TYPHOON_ACTIVE_PATH);
}
/**
* 初始化全局 Socket 连接（读取 config.socket）。
*
* enable=false 时关闭已有连接并返回空操作；enable=true 时按配置协议
* 创建连接，并订阅配置热重载主题（system:config:update/version），
* 收到版本号后调用 upgrade() 触发配置重新拉取。
*
* @param shouldEnable 是否启用（每次调用重新评估，默认读 config.socket.enable）
* @returns 卸载函数
*/
function initGlobalSocket(shouldEnable) {
	if (!(shouldEnable?.() ?? getConfig().socket.enable)) {
		closeGlobalSocketService();
		return () => closeGlobalSocketService();
	}
	const globalConfig = getGlobalSocketConfig();
	if (!globalConfig.urls.length) {
		log.warn("[createApp] socket.enable=true 但未解析到可用地址，跳过连接");
		return () => closeGlobalSocketService();
	}
	const service = initGlobalSocketService({
		protocol: globalConfig.protocol,
		urls: globalConfig.urls,
		context: globalConfig.context,
		path: getConfig().socket.path,
		query: getConfig().socket.query,
		autoConnect: getConfig().socket.autoConnect,
		reconnection: getConfig().socket.reconnection,
		reconnectionAttempts: getConfig().socket.reconnectionAttempts,
		reconnectionDelay: getConfig().socket.reconnectionDelay,
		heartbeatInterval: getConfig().socket.heartbeatInterval,
		transports: getConfig().socket.transports
	});
	const applyVersion = (data) => {
		const record = data ?? {};
		const nested = record.data ?? {};
		const version = typeof record.version === "string" ? record.version : typeof nested.version === "string" ? nested.version : void 0;
		if (version) upgrade(version);
	};
	service.on(SystemTopics.CONFIG.UPDATE, applyVersion);
	service.on(SystemTopics.CONFIG.VERSION, applyVersion);
	return () => closeGlobalSocketService();
}
/**
* 解析当前登录 userId（未登录 / 解析失败 → "anonymous"）
*
* 直接读 localStorage 原始 key "userInfo"（与 @repo/config.getStorageKey 内部实现一致），
* 不反向依赖 @repo/utils 避免循环。
*/
function resolveUserId() {
	if (typeof window === "undefined") return "anonymous";
	try {
		const data = getUserInfo();
		if (!data) return "anonymous";
		const id = data?.userId;
		if (id === void 0 || id === null || id === "") return "anonymous";
		return String(id);
	} catch {
		return "anonymous";
	}
}
/** ④ storage：命名空间前缀；加解密由 StorageWrapper 内部实时从 config.storage 读取（见 @repo/utils storage.ts） */
function buildStorage(_crypto, config) {
	return createStorage(browserLocalStorage, {
		prefix: config.storage.prefix || config.app.systemCode || "system",
		noPrefixKeys: config.storage.noPrefixKeys,
		userScopeKeys: config.storage.userScopeKeys,
		resolveUserId
	});
}
/** ⑥ HTTP 客户端：加密/签名拦截器，用户始终操作标准 axios 请求对象 */
function buildHttp(crypto, config) {
	const httpInstance = setupHttpCryptoInterceptor({
		crypto,
		encrypt: config.http.encrypt,
		sign: config.http.sign,
		signSecret: config.http.signSecret,
		showLoading: config.http.showLoading,
		retryCount: config.http.retryCount,
		retryDelay: config.http.retryDelay,
		requestCodec: config.http.requestCodec
	});
	return createHttp({ instance: httpInstance });
}
/**
* 默认远程路由加载器：动态导入 @repo/pinia 的 initAuthRouter
* 使用运行时 import 避免 @repo/core 静态依赖 @repo/pinia 导致的循环导入。
*/
async function getRemoteRouteLoader() {
	try {
		return (await __vitePreload(() => import("./src-CS0EhWC8.js"), __vite__mapDeps([52,53,47,4,48,6,1,2,49,50,51,54]))).initAuthRouter;
	} catch {
		return;
	}
}
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
var snapshot = capture();
/**
* 取出三方回跳参数快照（一次性：首次调用后内部标记为已消费）
*
* <p>调用方消费后应自行用 router.replace 剥离 URL 上的残留参数，
* 避免用户刷新页面时重复提示或重放凭证。</p>
*
* @returns 三方回跳参数，无参数时各字段为空串
*/
function takeThirdCallbackParams() {
	const value = snapshot ?? emptyParams();
	snapshot = null;
	return value;
}
//#endregion
//#region ../../packages/core/src/hooks/useDataSource.ts
/**
* useDataSource —— 动态数据源（@repo/core）
*
* 支持三种来源：
*  - 静态值 / 数组：原样返回
*  - url 字符串：用 getApiHttp 拉取（走加密/签名/重试拦截器，支持相对路径），兼容 { data } / { data: { records } } / 数组 等常见结构
*  - 函数：调用函数（可返回 Promise），得到数据
*
* 用法：
*   const { loading, data, reload } = useDataSource<IOption[]>(() => props.data);
*/
/** 从任意响应结构中提取数据数组 */
function extract(payload) {
	if (Array.isArray(payload)) return payload;
	if (payload == null) return payload;
	if (typeof payload !== "object") return payload;
	const obj = payload;
	if (typeof obj.data === "object" && obj.data !== null) {
		const inner = obj.data;
		if (Array.isArray(inner.records)) return inner.records;
		for (const key of [
			"rows",
			"list",
			"items",
			"content"
		]) if (Array.isArray(inner[key])) return inner[key];
		return obj.data;
	}
	if (Array.isArray(obj.records)) return obj.records;
	for (const key of [
		"rows",
		"list",
		"items",
		"content"
	]) if (Array.isArray(obj[key])) return obj[key];
	return payload;
}
/** 通过 url 拉取数据（统一走 getApiHttp：加密/签名/重试拦截器 + baseURL 解析） */
async function fetchByUrl(url) {
	return extract((await getApiHttp().get(url)).data);
}
/**
* 通用动态数据加载
* @param source 数据源（静态 / url / 函数），可传入 Ref
*/
function useDataSource(source) {
	const loading = ref(false);
	const data = ref(null);
	const error = ref(void 0);
	/**
	* 请求序号：只有**最新一次** resolve 的结果允许落地。
	*
	* <p>不加守卫时的竞态：快速翻页会并发多个请求，先发的可能后到，
	* 它的结果落地就把新页数据覆盖成旧页（用户看到「点第 3 页却显示第 1 页的行」）。
	* 同一个守卫也要管住 {@code loading} —— 否则过期请求的 finally 会把
	* 新请求正在转的 loading 提前关掉。</p>
	*/
	let seq = 0;
	const resolve = async (src) => {
		const mine = ++seq;
		loading.value = true;
		error.value = void 0;
		try {
			let next;
			if (typeof src === "function") next = await src();
			else if (typeof src === "string") next = await fetchByUrl(src);
			else next = src;
			if (mine !== seq) return;
			data.value = next;
		} catch (e) {
			if (mine !== seq) return;
			error.value = e instanceof Error ? e : new Error(String(e));
			data.value = null;
		} finally {
			if (mine === seq) loading.value = false;
		}
	};
	const reload = async () => {
		const src = source.value ?? source;
		await resolve(src);
	};
	watch(() => typeof source === "function" ? source : source.value, async (val) => {
		await resolve(val);
	}, { immediate: true });
	if (getCurrentScope()) onScopeDispose(() => {
		seq++;
	});
	return {
		loading,
		data,
		error,
		reload
	};
}
//#endregion
export { hasBaseRoutes as $, throttle$2 as $n, getDefaultSetting as $t, setSocketTokenProvider as A, TYPHOON_DETAIL_PATH as An, noticeError as At, refreshAntiDebug as B, getUserPermission as Bn, createTokenManager as Bt, createUrlSelector as C, resolveGeoLocation as Cn, msgBoxPrompt as Ct, matchesSocketListenOptions as D, IP_LOOKUP_PATH as Dn, msgSuccess as Dt, getSocketToken as E, HOLIDAY_LIST_PATH as En, msgPrimary as Et, loadDefaultSetting as F, initStationMessageAdapter as Fn, startLoading as Ft, waitForBaseRoutes as G, setUserPerms as Gn, isStaleEpoch as Gt, createScheduler as H, hasRole as Hn, SESSION_EPOCH_FIELD as Ht, mergeDefaultSetting as I, USER_INFO_KEY as In, getRouter as It, initDynamicRoutes as J, DEFAULT_CRYPTO_URL as Jn, sessionSignal as Jt, createMenuRouteResolver as K, setUserRoles as Kn, markSessionAborted as Kt, onConfigHotReload as L, canAccess as Ln, hasRouter as Lt, SocketTemplateKey as M, capabilityOfPath as Mn, noticeSuccess as Mt, applyGlobalWatermark as N, isCapabilityPathEnabled as Nn, noticeWarning as Nt, normalizeSocketUrl as O, LOCATION_RESOLVE_PATH as On, msgWarning as Ot, bindConfigHotReload as P, getStationMessageAdapter as Pn, doneLoading as Pt, ensureErrorComponents as Q, debounce$2 as Qn, getCaptcha as Qt, refreshDefaultSetting as R, getAdminRoles as Rn, setRouter as Rt, createSocketIOService as S, getWeatherOverview as Sn, msgBoxAlert as St, buildAuthUrl as T, BACKEND_CAPABILITIES as Tn, msgInfo as Tt, getGlobalTimer as U, isAdmin as Un, invalidateSessionScope as Ut, uninstallAntiDebug as V, hasPerm as Vn, SESSION_ABORTED_FIELD as Vt, createAppRouter as W, isSuperadmin as Wn, isSessionAborted as Wt, registerDynamicRoutes as X, loadCryptoFromUrl as Xn, createModuleHttp as Xt, isDynamicRoutesMissing as Y, loadCrypto as Yn, createSingleFlight as Yt, buildBaseRoutes as Z, SystemException as Zn, getApiHttp as Zt, initGlobalSocketService as _, normalizeHolidays as _n, createApiFailureError as _t, vAdmin as a, login as an, checkRouteAccess as at, createSseService as b, getTyphoonDetail as bn, msg as bt, vRole as c, saveLayout as cn, CODEC_KEY_HEADER as ct, refreshSecurity as d, thirdBindInfo as dn, NOISE_LEVEL_HEADER as dt, getLayout as en, ElNotification as er, resolveThemeBaseRoutes as et, installErrorMonitor as f, thirdLoginCode as fn, SIGN_FINGERPRINT_HEADER as ft, getGlobalSocketService as g, fetchHolidays as gn, base64ToBytes as gt, getGlobalSocketConfig as h, toLayoutCacheShape as hn, SIGN_TIMESTAMP_HEADER as ht, setupPermissionDirectives as i, http as in, applyDocumentTitle as it, toWebSocketUrl as j, WEATHER_OVERVIEW_PATH as jn, noticeInfo as jt, parseSocketMessage as k, TYPHOON_ACTIVE_PATH as kn, notice as kt, vSuperadmin as l, setApiHttp as ln, ENCRYPT_HEADER as lt, createSocketService as m, thirdUnbind as mn, SIGN_NONCE_HEADER as mt, takeThirdCallbackParams as n, getMenu as nn, setupRouterGuard as nt, vMenu as o, logout as on, getAppStorage as ot, closeGlobalSocketService as p, thirdLoginExchange as pn, SIGN_HEADER as pt, registerMenuViewModules as q, syncUserPerm as qn, sessionEpoch as qt, setupCommonDirectives as r, getThirdPartyProviders as rn, ROUTER_WHITE_LIST as rt, vPerm as s, refreshToken as sn, setAppStorage as st, useDataSource as t, getMe as tn, isWhitelisted as tt, createApp as u, thirdBindCode as un, KEY_HEADER as ut, provideGlobalSocketService as v, canonTime as vn, setupHttpCryptoInterceptor as vt, SystemTopics as w, probeBackend as wn, msgError as wt, createWebSocketService as x, pickRadii as xn, msgBox as xt, useSocketService as y, getActiveTyphoonList as yn, message as yt, installAntiDebug as z, getSuperadminRole as zn, TokenManager as zt };
