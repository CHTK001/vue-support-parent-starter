import { $ as mergeModels, $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wn as toRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { i as useI18n, r as translateConfigText } from "./src-BVnZQO9c.js";
import { Lt as right_default, Ot as postcard_default, an as user_default, ft as lock_default, pn as warning_filled_default, v as circle_check_default } from "./dist-DogtK295.js";
import { Gn as setUserPerms, Kn as setUserRoles, Ot as msgWarning, Qt as getCaptcha, R as refreshDefaultSetting, fn as thirdLoginCode, n as takeThirdCallbackParams, pn as thirdLoginExchange, rn as getThirdPartyProviders, wt as msgError } from "./src-CEonioA3.js";
import { S as LOGIN_URL, c as getConfig, x as HOME_URL } from "./src-DzQcKxHP.js";
import { t as authStore } from "./auth-C8MLoNwd.js";
import { c as initAuthRouter, i as tabsStore, l as resetRouter, o as keepAliveStore, u as userStore } from "./src-CUe0zRl2.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
//#region ../../packages/theme/src/themes/koi/views/login/components/ReOtpInput.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "otp-input-cells" };
var _hoisted_2$3 = [
	"onUpdate:modelValue",
	"disabled",
	"onInput",
	"onKeydown",
	"onFocus"
];
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReOtpInput.vue
var ReOtpInput_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReOtpInput",
	props: /*@__PURE__*/ mergeModels({
		length: { default: 6 },
		disabled: {
			type: Boolean,
			default: false
		}
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels(["update:modelValue", "complete"], ["update:modelValue"]),
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const model = useModel(__props, "modelValue");
		/** 各格输入值 */
		const cells = ref([]);
		const cellRefs = ref([]);
		const focusedIndex = ref(-1);
		watch(() => props.length, () => {
			initCells();
		});
		watch(model, (val) => {
			const str = (val ?? "").replace(/\D/g, "").slice(0, props.length);
			cells.value = Array.from({ length: props.length }, (_, i) => str[i] ?? "");
		}, { immediate: true });
		onMounted(() => {
			initCells();
		});
		/** 初始化空格子 */
		function initCells() {
			cells.value = Array.from({ length: props.length }, () => "");
		}
		/** 合并各格值为完整字符串 */
		function mergeValue() {
			return cells.value.join("");
		}
		/** 输入处理：只允许数字，并自动跳到下一格 */
		function handleInput(index, event) {
			const raw = event.target.value.replace(/\D/g, "").slice(-1);
			cells.value[index] = raw;
			const value = mergeValue();
			model.value = value;
			if (raw && index < props.length - 1) {
				cellRefs.value[index + 1]?.focus();
				cellRefs.value[index + 1]?.select();
			}
			if (value.length === props.length) emit("complete", value);
		}
		/** 键盘处理：退格清空并回退到上一格；方向键左右移动 */
		function handleKeydown(index, event) {
			if (event.key === "Backspace") {
				if (cells.value[index]) {
					cells.value[index] = "";
					model.value = mergeValue();
				} else if (index > 0) {
					cellRefs.value[index - 1]?.focus();
					cellRefs.value[index - 1]?.select();
				}
			} else if (event.key === "ArrowLeft" && index > 0) {
				event.preventDefault();
				cellRefs.value[index - 1]?.focus();
			} else if (event.key === "ArrowRight" && index < props.length - 1) {
				event.preventDefault();
				cellRefs.value[index + 1]?.focus();
			} else if (!/^\d$/.test(event.key) && event.key.length === 1) event.preventDefault();
		}
		/** 粘贴支持：一次性填充所有格子 */
		function handlePaste(event) {
			const text = (event.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, props.length);
			if (!text) return;
			event.preventDefault();
			cells.value = Array.from({ length: props.length }, (_, i) => text[i] ?? "");
			model.value = mergeValue();
			const target = Math.min(text.length, props.length) - 1;
			cellRefs.value[target]?.focus();
			if (text.length === props.length) emit("complete", text);
		}
		__expose({ 
		/** 聚焦到首个空位 */
focus: () => {
			const firstEmpty = cells.value.findIndex((c) => !c);
			cellRefs.value[firstEmpty === -1 ? 0 : firstEmpty]?.focus();
		} });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["otp-input", { "otp-input--disabled": __props.disabled }]) }, [createBaseVNode("div", _hoisted_1$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.length, (_, index) => {
				return withDirectives((openBlock(), createElementBlock("input", {
					key: index,
					ref_for: true,
					ref_key: "cellRefs",
					ref: cellRefs,
					"onUpdate:modelValue": ($event) => cells.value[index] = $event,
					class: normalizeClass(["otp-cell", {
						"otp-cell--filled": !!cells.value[index],
						"otp-cell--focused": focusedIndex.value === index
					}]),
					type: "text",
					inputmode: "numeric",
					autocomplete: "one-time-code",
					maxlength: 1,
					disabled: __props.disabled,
					onInput: ($event) => handleInput(index, $event),
					onKeydown: ($event) => handleKeydown(index, $event),
					onPaste: handlePaste,
					onFocus: ($event) => focusedIndex.value = index,
					onBlur: _cache[0] || (_cache[0] = ($event) => focusedIndex.value = -1)
				}, null, 42, _hoisted_2$3)), [[vModelText, cells.value[index]]]);
			}), 128))])], 2);
		};
	}
}), [["__scopeId", "data-v-e4532815"]]);
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReOtpDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "otp-dialog-content" };
var _hoisted_2$2 = { class: "otp-dialog-icon" };
var _hoisted_3$2 = { class: "otp-dialog-desc" };
var _hoisted_4$1 = { class: "otp-dialog-cells-wrap" };
var _hoisted_5$1 = { class: "otp-dialog-footer" };
var _hoisted_6$1 = { class: "otp-cancel-text" };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReOtpDialog.vue
var ReOtpDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReOtpDialog",
	emits: ["confirm"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const { t } = useI18n();
		const visible = ref(false);
		const otpCode = ref("");
		const otpInputRef = ref();
		const title = t("menu.login.otpTitle");
		const emit = __emit;
		async function open() {
			otpCode.value = "";
			visible.value = true;
			await nextTick();
			otpInputRef.value?.focus();
		}
		function onComplete(_value) {
			if (otpCode.value.length === 6) onConfirm();
		}
		function onConfirm() {
			if (otpCode.value.length !== 6) return;
			emit("confirm", otpCode.value);
			visible.value = false;
		}
		__expose({ open });
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			return openBlock(), createBlock(unref(component), {
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => visible.value = $event),
				title: unref(title),
				width: "360px",
				"close-on-click-modal": false,
				"close-on-press-escape": true,
				"show-close": true,
				class: "otp-dialog"
			}, {
				default: withCtx(() => [createBaseVNode("div", _hoisted_1$2, [
					createBaseVNode("div", _hoisted_2$2, [createVNode(_component_el_icon, { size: 28 }, {
						default: withCtx(() => [createVNode(unref(lock_default))]),
						_: 1
					})]),
					createBaseVNode("div", _hoisted_3$2, toDisplayString(_ctx.$t("menu.login.totpTip")), 1),
					createBaseVNode("div", _hoisted_4$1, [createVNode(ReOtpInput_default, {
						ref_key: "otpInputRef",
						ref: otpInputRef,
						modelValue: otpCode.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => otpCode.value = $event),
						onComplete
					}, null, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_5$1, [createVNode(_component_el_button, {
						text: "",
						onClick: _cache[1] || (_cache[1] = ($event) => visible.value = false)
					}, {
						default: withCtx(() => [createBaseVNode("span", _hoisted_6$1, toDisplayString(_ctx.$t("menu.login.otpCancel")), 1)]),
						_: 1
					}), createVNode(_component_el_button, {
						type: "primary",
						disabled: otpCode.value.length !== 6,
						onClick: onConfirm
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(_ctx.$t("menu.login.otpConfirm")), 1)]),
						_: 1
					}, 8, ["disabled"])])
				])]),
				_: 1
			}, 8, ["modelValue", "title"]);
		};
	}
}), [["__scopeId", "data-v-ebb5d260"]]);
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReSliderVerify.vue
var ReSliderVerify_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReSliderVerify",
	props: {
		disabled: {
			type: Boolean,
			default: false
		},
		tolerance: { default: 4 }
	},
	emits: ["success", "reset"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const trackRef = ref();
		const thumbX = ref(0);
		const percent = ref(0);
		const success = ref(false);
		const isDragging = ref(false);
		let rafId = null;
		let pendingX = 0;
		let trackWidth = 0;
		let thumbWidth = 40;
		let activePointerId = null;
		/** 拖拽位置更新，RAF节流保证跟手流畅 */
		function scheduleUpdate(x) {
			pendingX = x;
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				const maxX = trackWidth - thumbWidth;
				const next = Math.max(0, Math.min(pendingX, maxX));
				thumbX.value = next;
				percent.value = maxX > 0 ? next / maxX * 100 : 0;
			});
		}
		/** 指针按下 */
		function handlePointerDown(e) {
			if (props.disabled || success.value) return;
			activePointerId = e.pointerId;
			isDragging.value = true;
			trackWidth = trackRef.value.getBoundingClientRect().width;
			thumbWidth = trackRef.value.querySelector(".slider-verify-thumb")?.clientWidth ?? 40;
			const startX = e.clientX;
			const baseX = thumbX.value;
			const onMove = (ev) => {
				if (ev.pointerId !== activePointerId) return;
				const delta = ev.clientX - startX;
				scheduleUpdate(baseX + delta);
			};
			const onUp = (ev) => {
				if (ev.pointerId !== activePointerId) return;
				isDragging.value = false;
				activePointerId = null;
				window.removeEventListener("pointermove", onMove);
				window.removeEventListener("pointerup", onUp);
				window.removeEventListener("pointercancel", onUp);
				if (rafId !== null) {
					cancelAnimationFrame(rafId);
					rafId = null;
				}
				const maxX = trackWidth - thumbWidth;
				if (thumbX.value >= maxX - props.tolerance) {
					thumbX.value = maxX;
					percent.value = 100;
					success.value = true;
					emit("success");
				} else {
					thumbX.value = 0;
					percent.value = 0;
				}
			};
			window.addEventListener("pointermove", onMove, { passive: true });
			window.addEventListener("pointerup", onUp, { passive: true });
			window.addEventListener("pointercancel", onUp, { passive: true });
		}
		/** 外部重置 */
		function reset() {
			success.value = false;
			isDragging.value = false;
			thumbX.value = 0;
			percent.value = 0;
			if (rafId !== null) cancelAnimationFrame(rafId);
			emit("reset");
		}
		onBeforeUnmount(() => {
			if (rafId !== null) cancelAnimationFrame(rafId);
		});
		__expose({ reset });
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["slider-verify", {
				"slider-verify--success": success.value,
				"slider-verify--disabled": __props.disabled,
				"slider-verify--dragging": isDragging.value
			}]) }, [createBaseVNode("div", { class: normalizeClass(["slider-verify-text", { "slider-verify-text--success": success.value }]) }, [success.value ? (openBlock(), createBlock(_component_el_icon, {
				key: 0,
				size: 14
			}, {
				default: withCtx(() => [createVNode(unref(circle_check_default))]),
				_: 1
			})) : (openBlock(), createBlock(_component_el_icon, {
				key: 1,
				size: 14
			}, {
				default: withCtx(() => [createVNode(unref(right_default))]),
				_: 1
			})), createBaseVNode("span", null, toDisplayString(success.value ? _ctx.$t("menu.login.sliderSuccess") : _ctx.$t("menu.login.sliderTip")), 1)], 2), createBaseVNode("div", {
				ref_key: "trackRef",
				ref: trackRef,
				class: "slider-verify-track",
				onPointerdown: withModifiers(handlePointerDown, ["prevent"])
			}, [createBaseVNode("div", {
				class: "slider-verify-bg",
				style: normalizeStyle({ transform: `translate3d(-${100 - percent.value}%,0,0)` })
			}, null, 4), createBaseVNode("div", {
				class: normalizeClass(["slider-verify-thumb", { "slider-verify-thumb--success": success.value }]),
				style: normalizeStyle({ transform: `translate3d(${thumbX.value}px,0,0)` })
			}, [success.value ? (openBlock(), createBlock(_component_el_icon, {
				key: 0,
				size: 14
			}, {
				default: withCtx(() => [createVNode(unref(circle_check_default))]),
				_: 1
			})) : (openBlock(), createBlock(_component_el_icon, {
				key: 1,
				size: 14
			}, {
				default: withCtx(() => [createVNode(unref(right_default))]),
				_: 1
			}))], 6)], 544)], 2);
		};
	}
}), [["__scopeId", "data-v-bfcf28e5"]]);
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReThirdLogin.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = {
	key: 0,
	class: "third-login"
};
var _hoisted_2$1 = { class: "third-login__list" };
var _hoisted_3$1 = { class: "third-login__abbr" };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReThirdLogin.vue
var ReThirdLogin_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReThirdLogin",
	setup(__props) {
		const LABELS = {
			gitee: "Gitee",
			github: "GitHub",
			google: "Google",
			oidc: "OIDC",
			wechat: "微信",
			wechat_mp: "微信公众号",
			wechat_enterprise: "企业微信",
			qq: "QQ",
			alipay: "支付宝",
			dingtalk: "钉钉",
			weibo: "微博",
			baidu: "百度",
			microsoft: "微软",
			taobao: "淘宝",
			douyin: "抖音",
			feishu: "飞书"
		};
		const providers = ref([]);
		const loadingProvider = ref("");
		function providerLabel(p) {
			return LABELS[p] ?? p;
		}
		function providerAbbr(p) {
			return (LABELS[p] ?? p).slice(0, 2);
		}
		async function loadProviders() {
			try {
				const res = await getThirdPartyProviders();
				const data = res?.data ?? res;
				providers.value = Array.isArray(data) ? data : [];
			} catch {
				providers.value = [];
			}
		}
		/** 取授权 URL 后整页跳转（与后端 state 缓存链路对齐） */
		async function handleLogin(loginType) {
			loadingProvider.value = loginType;
			try {
				const callback = `${window.location.origin}${window.location.pathname}`;
				const res = await thirdLoginCode({
					loginType,
					thirdType: "1",
					loginCode: "",
					callback
				});
				const url = res?.data ?? res;
				if (typeof url === "string" && url) window.location.href = url;
				else msgError("第三方登录未配置或未启用，请联系管理员");
			} catch (e) {
				msgError(e?.message || "第三方登录失败");
			} finally {
				loadingProvider.value = "";
			}
		}
		onMounted(() => {
			loadProviders();
		});
		return (_ctx, _cache) => {
			const _component_el_button = resolveComponent("el-button");
			return providers.value.length ? (openBlock(), createElementBlock("div", _hoisted_1$1, [_cache[0] || (_cache[0] = createBaseVNode("div", { class: "third-login__divider" }, [
				createBaseVNode("span", { class: "third-login__line" }),
				createBaseVNode("span", { class: "third-login__text" }, "第三方登录"),
				createBaseVNode("span", { class: "third-login__line" })
			], -1)), createBaseVNode("div", _hoisted_2$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(providers.value, (p) => {
				return openBlock(), createBlock(_component_el_button, {
					key: p,
					circle: "",
					title: providerLabel(p),
					loading: loadingProvider.value === p,
					class: "third-login__btn",
					onClick: ($event) => handleLogin(p)
				}, {
					default: withCtx(() => [createBaseVNode("span", _hoisted_3$1, toDisplayString(providerAbbr(p)), 1)]),
					_: 2
				}, 1032, [
					"title",
					"loading",
					"onClick"
				]);
			}), 128))])])) : createCommentVNode("", true);
		};
	}
}), [["__scopeId", "data-v-64dad303"]]);
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReLoginForm.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "login-system-error"
};
var _hoisted_2 = { class: "system-error-icon" };
var _hoisted_3 = { class: "system-error-title" };
var _hoisted_4 = { class: "system-error-desc" };
var _hoisted_5 = {
	key: 1,
	class: "login-mobile-brand md:hidden"
};
var _hoisted_6 = { class: "login-logo-wrap login-logo-wrap--mobile" };
var _hoisted_7 = ["src", "alt"];
var _hoisted_8 = { class: "font-600 text-xl" };
var _hoisted_9 = {
	key: 2,
	class: "form-header text-center m-b-32px"
};
var _hoisted_10 = { class: "text-24px font-700 m-b-8px text-[--el-text-color-primary]" };
var _hoisted_11 = { class: "text-14px text-[--el-text-color-regular]" };
var _hoisted_12 = { class: "login-verify-wrap flex flex-col sm:flex-row items-start sm:items-center gap-12px w-full" };
var _hoisted_13 = { key: 1 };
var _hoisted_14 = {
	key: 1,
	class: "login-verify-placeholder w-100px h-40px flex flex-items-center flex-justify-center bg-[--el-fill-color-light] text-[--el-color-primary]"
};
var _hoisted_15 = {
	key: 2,
	class: "flex flex-justify-center m-t-12px"
};
var _hoisted_16 = { class: "text-13px text-[--el-text-color-secondary] hover:text-[--el-color-primary] select-none transition-colors" };
var OTP_REQUIRED_MESSAGE = "请输入动态验证码";
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/components/ReLoginForm.vue
var ReLoginForm_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReLoginForm",
	props: {
		showMobileBrand: { type: Boolean },
		showHeader: {
			type: Boolean,
			default: true
		},
		formClass: {}
	},
	setup(__props) {
		const { t } = useI18n();
		const loginConfig = toRef(getConfig(), "login");
		computed(() => {
			const custom = loginConfig.value.logoUrl;
			if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) return resolveAssetUrl(custom);
			return logo_default;
		});
		const userStore$1 = userStore();
		const authStore$1 = authStore();
		const tabsStore$1 = tabsStore();
		const keepAliveStore$1 = keepAliveStore();
		const router = useRouter();
		const loginFormRef = ref();
		const sliderRef = ref();
		const otpDialogRef = ref();
		const sliderPassed = ref(false);
		const loading = ref(false);
		const loginForm = reactive({
			loginName: "",
			password: "",
			securityCode: "",
			codeKey: "",
			captchaPicture: "",
			otpCode: ""
		});
		const loginRules = reactive({
			loginName: [{
				required: true,
				message: t("menu.login.rules.loginName.required"),
				trigger: "blur"
			}, {
				validator: (_rule, value, callback) => {
					if (!/^[a-zA-Z0-9_-]+$/.test(value)) callback(new Error(t("menu.login.rules.loginName.validator")));
					else callback();
				},
				trigger: "blur"
			}],
			password: [{
				required: true,
				message: t("menu.login.rules.password.required"),
				trigger: "blur"
			}, {
				min: 6,
				max: 20,
				message: t("menu.login.rules.password.validator1"),
				trigger: "blur"
			}]
		});
		/** 获取验证码 */
		const handleCaptcha = async () => {
			userStore$1.setToken({});
			try {
				const data = (await getCaptcha())?.data;
				loginForm.codeKey = data?.verifyCodeKey ?? data?.codeKey ?? "";
				loginForm.captchaPicture = data?.verifyCodeBase64 ?? data?.captchaPicture ?? "";
			} catch (error) {
				console.log(error);
				msgError(t("msg.yzmFail"));
			}
		};
		const systemUnavailable = ref(false);
		const retrying = ref(false);
		/** 加载验证码（开启图形验证码时） */
		const loadSettingAndInit = async () => {
			try {
				systemUnavailable.value = false;
				if (loginConfig.value.captcha) await handleCaptcha();
			} catch {
				systemUnavailable.value = true;
			}
		};
		/** 系统不可用时手动重试 */
		const retryLoadSetting = async () => {
			retrying.value = true;
			try {
				await loadSettingAndInit();
			} finally {
				retrying.value = false;
			}
		};
		/** 剥离 URL 上的三方回跳参数（停留登录页时防刷新重放凭证 / 重复错误提示） */
		const stripThirdCallbackQuery = async () => {
			const current = router.currentRoute.value;
			const rest = { ...current.query };
			delete rest.redirectParam;
			delete rest.thirdMsg;
			if (Object.keys(rest).length === Object.keys(current.query).length) return;
			await router.replace({
				path: current.path,
				query: rest,
				hash: current.hash
			});
		};
		/**
		* 三方登录回跳换票：兑换一次性凭证 → 写入登录态 → 初始化路由 → 跳目标页
		*
		* <p>状态写入与账号密码登录（userStore.loginByUsername）保持同一套语义：
		* setToken → roles/perms → refreshDefaultSetting → initAuthRouter → 目标页。</p>
		*
		* @param redirectParam 回调签发的一次性加密凭证
		* @param redirect      登录成功后的跳转目标（可空）
		*/
		const consumeThirdLogin = async (redirectParam, redirect) => {
			try {
				loading.value = true;
				const res = await thirdLoginExchange({ redirectParam });
				const result = res?.data;
				if (!result?.accessToken) {
					msgError(res?.msg || "三方登录失败，请重试");
					await stripThirdCallbackQuery();
					return;
				}
				authStore$1.$reset();
				resetRouter();
				userStore$1.setToken(result);
				if (result.roles?.length) setUserRoles(result.roles);
				if (result.perms?.length) setUserPerms(result.perms);
				refreshDefaultSetting();
				const username = typeof result.username === "string" && result.username || result.userInfo?.sysUserUsername || "";
				if (username) {
					tabsStore$1.$reset();
					userStore$1.setLoginName(username);
				}
				keepAliveStore$1.$reset();
				await nextTick();
				await initAuthRouter(router);
				await router.replace(redirect || "/home");
			} catch (error) {
				msgError(error?.message || "三方登录失败，请重试");
				await stripThirdCallbackQuery();
			} finally {
				loading.value = false;
			}
		};
		onMounted(async () => {
			await loadSettingAndInit();
			const third = takeThirdCallbackParams();
			if (third.redirectParam) {
				await consumeThirdLogin(third.redirectParam, third.redirect);
				return;
			}
			if (third.thirdMsg) {
				msgError(third.thirdMsg);
				await stripThirdCallbackQuery();
			}
			if (userStore$1?.token) {
				const redirect = router.currentRoute.value.query.redirect;
				if (redirect) router.replace(redirect);
				else router.replace(HOME_URL);
			}
		});
		/** 登录 */
		const handleKoiLogin = () => {
			if (!loginFormRef.value) return;
			if (loginConfig.value.slider && !sliderPassed.value) {
				msgWarning(t("menu.login.sliderRequired"));
				return;
			}
			loginFormRef.value.validate(async (valid) => {
				if (!valid) {
					msgError(t("msg.validFail"));
					return;
				}
				await submitLogin("");
			});
		};
		/** OTP 弹窗确认后提交登录 */
		const handleOtpConfirm = async (code) => {
			await submitLogin(code);
		};
		/** 执行登录请求 */
		const submitLogin = async (otpCode) => {
			const loginName = loginForm.loginName;
			const password = loginForm.password;
			const securityCode = loginForm.securityCode;
			const codeKey = loginForm.codeKey;
			try {
				loading.value = true;
				authStore$1.$reset();
				resetRouter();
				await userStore$1.loginByUsername({
					username: loginName,
					password: String(password),
					codeKey,
					securityCode,
					...otpCode ? { otpCode } : {}
				});
				if (userStore$1?.token) try {
					await initAuthRouter(router);
				} catch (e) {
					msgError(`登录后初始化路由失败：${e?.message || e}`);
					return;
				}
				else {
					msgWarning(t("msg.logIn"));
					router.replace(LOGIN_URL);
					return;
				}
				if (userStore$1.loginName) {
					if (userStore$1.loginName !== loginName) {
						tabsStore$1.$reset();
						userStore$1.setLoginName(loginName);
					}
				} else {
					tabsStore$1.$reset();
					userStore$1.setLoginName(loginName);
				}
				keepAliveStore$1.$reset();
				await nextTick();
				await router.replace(HOME_URL);
			} catch (error) {
				sliderPassed.value = false;
				sliderRef.value?.reset();
				const errorMsg = error?.message || error?.msg || t("msg.logInFail");
				if (String(errorMsg).includes(OTP_REQUIRED_MESSAGE)) {
					otpDialogRef.value?.open();
					return;
				}
				msgError(errorMsg);
			} finally {
				loading.value = false;
			}
		};
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_image = resolveComponent("el-image");
			const _component_Loading = resolveComponent("Loading");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			const _component_el_form = resolveComponent("el-form");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["koi-login-form", __props.formClass]) }, [
				systemUnavailable.value ? (openBlock(), createElementBlock("div", _hoisted_1, [
					createBaseVNode("div", _hoisted_2, [createVNode(_component_el_icon, { size: 48 }, {
						default: withCtx(() => [createVNode(unref(warning_filled_default))]),
						_: 1
					})]),
					createBaseVNode("h3", _hoisted_3, toDisplayString(_ctx.$t("menu.login.systemUnavailable")), 1),
					createBaseVNode("p", _hoisted_4, toDisplayString(_ctx.$t("menu.login.systemUnavailableDesc")), 1),
					createVNode(_component_el_button, {
						type: "primary",
						size: "large",
						loading: retrying.value,
						onClick: retryLoadSetting
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(_ctx.$t("menu.login.retry")), 1)]),
						_: 1
					}, 8, ["loading"])
				])) : __props.showMobileBrand ? (openBlock(), createElementBlock("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [createBaseVNode("img", {
					class: "login-logo",
					src: unref(logo_default),
					alt: loginConfig.value.brandName
				}, null, 8, _hoisted_7)]), createBaseVNode("div", _hoisted_8, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1)])) : createCommentVNode("", true),
				!systemUnavailable.value && __props.showHeader ? (openBlock(), createElementBlock("div", _hoisted_9, [createBaseVNode("h3", _hoisted_10, toDisplayString(_ctx.$t("menu.login.account")), 1), createBaseVNode("p", _hoisted_11, toDisplayString(_ctx.$t("menu.login.form.loginName")) + " / " + toDisplayString(_ctx.$t("menu.login.form.password")), 1)])) : createCommentVNode("", true),
				!systemUnavailable.value ? (openBlock(), createBlock(_component_el_form, {
					key: 3,
					ref_key: "loginFormRef",
					ref: loginFormRef,
					model: loginForm,
					rules: loginRules,
					class: "login-form"
				}, {
					default: withCtx(() => [
						createVNode(_component_el_form_item, { prop: "loginName" }, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: loginForm.loginName,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => loginForm.loginName = $event),
								type: "text",
								placeholder: _ctx.$t("menu.login.form.loginName"),
								size: "large",
								class: "login-input",
								onKeydown: withKeys(handleKoiLogin, ["enter"])
							}, {
								prefix: withCtx(() => [createVNode(_component_el_icon, { size: 16 }, {
									default: withCtx(() => [createVNode(unref(user_default))]),
									_: 1
								})]),
								_: 1
							}, 8, ["modelValue", "placeholder"])]),
							_: 1
						}),
						createVNode(_component_el_form_item, { prop: "password" }, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: loginForm.password,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => loginForm.password = $event),
								type: "password",
								placeholder: _ctx.$t("menu.login.form.password"),
								"show-password": "",
								size: "large",
								class: "login-input",
								onKeydown: withKeys(handleKoiLogin, ["enter"])
							}, {
								prefix: withCtx(() => [createVNode(_component_el_icon, { size: 16 }, {
									default: withCtx(() => [createVNode(unref(lock_default))]),
									_: 1
								})]),
								_: 1
							}, 8, ["modelValue", "placeholder"])]),
							_: 1
						}),
						loginConfig.value.captcha ? (openBlock(), createBlock(_component_el_form_item, {
							key: 0,
							prop: "securityCode"
						}, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_12, [createVNode(_component_el_input, {
								modelValue: loginForm.securityCode,
								"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => loginForm.securityCode = $event),
								type: "text",
								placeholder: _ctx.$t("menu.login.form.securityCode"),
								size: "large",
								class: "login-input w-full sm:flex-1",
								onKeydown: withKeys(handleKoiLogin, ["enter"])
							}, {
								prefix: withCtx(() => [createVNode(_component_el_icon, { size: 16 }, {
									default: withCtx(() => [createVNode(unref(postcard_default))]),
									_: 1
								})]),
								_: 1
							}, 8, ["modelValue", "placeholder"]), createVNode(_component_el_tooltip, {
								effect: "light",
								placement: "top",
								"show-after": 300
							}, {
								content: withCtx(() => [loginForm.captchaPicture ? (openBlock(), createBlock(_component_el_image, {
									key: 0,
									class: "login-verify-tip-img block",
									src: loginForm.captchaPicture,
									fit: "contain"
								}, null, 8, ["src"])) : (openBlock(), createElementBlock("span", _hoisted_13, toDisplayString(_ctx.$t("menu.login.picture")), 1))]),
								default: withCtx(() => [createBaseVNode("div", {
									class: "login-verify-img w-100px h-40px flex-shrink-0 rounded-8px overflow-hidden cursor-pointer border-1px border-solid border-[--el-border-color-lighter]",
									onClick: handleCaptcha
								}, [loginForm.captchaPicture ? (openBlock(), createBlock(_component_el_image, {
									key: 0,
									class: "w-100px h-40px block",
									src: loginForm.captchaPicture,
									fit: "cover"
								}, null, 8, ["src"])) : (openBlock(), createElementBlock("div", _hoisted_14, [createVNode(_component_el_icon, { class: "animate-spin" }, {
									default: withCtx(() => [createVNode(_component_Loading)]),
									_: 1
								})]))])]),
								_: 1
							})])]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(ReOtpDialog_default, {
							ref_key: "otpDialogRef",
							ref: otpDialogRef,
							onConfirm: handleOtpConfirm
						}, null, 512),
						loginConfig.value.slider ? (openBlock(), createBlock(_component_el_form_item, { key: 1 }, {
							default: withCtx(() => [createVNode(ReSliderVerify_default, {
								ref_key: "sliderRef",
								ref: sliderRef,
								disabled: loading.value,
								onSuccess: _cache[3] || (_cache[3] = ($event) => sliderPassed.value = true)
							}, null, 8, ["disabled"])]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(_component_el_form_item, { class: "m-b-0" }, {
							default: withCtx(() => [createVNode(_component_el_button, {
								type: "primary",
								class: "login-btn w-100% tracking-4px",
								size: "large",
								loading: loading.value,
								onClick: handleKoiLogin
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(loading.value ? _ctx.$t("menu.login.loading") : _ctx.$t("menu.login.in")), 1)]),
								_: 1
							}, 8, ["loading"])]),
							_: 1
						}),
						loginConfig.value.captcha ? (openBlock(), createElementBlock("div", _hoisted_15, [createVNode(_component_el_button, {
							text: "",
							onClick: handleCaptcha
						}, {
							default: withCtx(() => [createBaseVNode("span", _hoisted_16, toDisplayString(_ctx.$t("menu.login.picture")), 1)]),
							_: 1
						})])) : createCommentVNode("", true),
						createVNode(ReThirdLogin_default)
					]),
					_: 1
				}, 8, ["model", "rules"])) : createCommentVNode("", true)
			], 2);
		};
	}
}), [["__scopeId", "data-v-88b5e0ad"]]);
//#endregion
export { ReLoginForm_default as t };
