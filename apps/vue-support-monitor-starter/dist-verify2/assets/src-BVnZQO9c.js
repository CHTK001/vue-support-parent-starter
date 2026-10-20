import { r as __exportAll } from "./rolldown-runtime-CEgmsyvS.js";
import { $ as mergeModels, $n as normalizeClass, $t as ReactiveEffect, A as defineEmits, At as ssrUtils, B as h, Bt as version, C as createRenderer, Cn as toRaw, Ct as resolveDirective, D as createVNode, Dn as triggerRef, Dt as setDevtoolsHook, E as createTextVNode, En as toValue, Et as setBlockTracking, F as defineSlots, Ft as useModel, G as hydrateOnMediaQuery, Gt as watchSyncEffect, H as hasInjectionContext, Ht as watch, I as devtools$1, It as useSSRContext, J as inject, Jt as withDefaults, K as hydrateOnVisible, Kt as withAsyncContext, L as getCurrentInstance$1, Lt as useSlots, M as defineModel, Mn as capitalize$1, Mt as transformVNodeArgs, N as defineOptions, Nt as useAttrs, O as defineAsyncComponent, On as unref, Ot as setTransitionHooks, P as defineProps, Pt as useId, Q as mergeDefaults, Qt as EffectScope, R as getTransitionRawChildren, Rt as useTemplateRef, S as createPropsRestProxy, Sn as stop, St as resolveComponent, T as createStaticVNode, Tn as toRefs, Tt as resolveTransitionHooks, U as hydrateOnIdle, Ut as watchEffect, V as handleError, Vt as warn$1, W as hydrateOnInteraction, Wt as watchPostEffect, X as isRuntimeOnly, Xt as withMemo, Y as isMemoSame, Yt as withDirectives, Z as isVNode$1, Zt as withScopeId, _ as createBaseVNode, _n as readonly, _t as pushScopeId, a as ErrorTypeStrings, an as getCurrentScope, at as onBeforeUpdate, b as createElementBlock, bn as shallowReadonly, bt as renderList, c as Static, cn as isReactive, ct as onMounted, d as Text, dn as isShallow, dt as onServerPrefetch, en as TrackOpTypes, et as mergeProps, f as assertNumber, fn as markRaw, ft as onUnmounted, g as computed, gn as reactive, gt as provide, h as cloneVNode, hn as proxyRefs, ht as popScopeId, i as ErrorCodes, in as effectScope, ir as toHandlerKey, it as onBeforeUnmount, j as defineExpose, jn as camelize, jt as toHandlers, k as defineComponent, kt as ssrContextKey, l as Suspense, ln as isReadonly, lt as onRenderTracked, m as callWithErrorHandling, mn as onWatcherCleanup, mt as openBlock, n as BaseTransitionPropsValidators, nn as customRef, nr as normalizeStyle, nt as onActivated, o as Fragment, on as getCurrentWatcher, ot as onDeactivated, p as callWithAsyncErrorHandling, pn as onScopeDispose, pt as onUpdated, q as initCustomFormatter, qt as withCtx, r as Comment, rn as effect, rr as toDisplayString$1, rt as onBeforeMount, s as KeepAlive, sn as isProxy, st as onErrorCaptured, t as BaseTransition, tn as TriggerOpTypes, tr as normalizeProps, tt as nextTick, u as Teleport, un as isRef, ut as onRenderTriggered, v as createBlock, vn as ref, vt as queuePostFlushCb, w as createSlots, wn as toRef, wt as resolveDynamicComponent, x as createHydrationRenderer, xn as shallowRef, xt as renderSlot, y as createCommentVNode, yn as shallowReactive, yt as registerRuntimeCompiler, z as guardReactiveProps, zt as useTransitionState } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, _ as vModelCheckbox, a as createSSRApp, b as vModelSelect, c as hydrate, d as patchProp, f as render, g as useShadowRoot, h as useHost, i as createApp, l as initDirectivesForSSR, m as useCssVars, n as TransitionGroup, o as defineCustomElement, p as useCssModule, r as VueElement, s as defineSSRCustomElement, t as Transition, u as nodeOps, v as vModelDynamic, w as withModifiers, x as vModelText, y as vModelRadio } from "./runtime-dom.esm-bundler-RRl39S3n.js";
//#region ../../node_modules/.pnpm/vue@3.5.40_typescript@5.9.3/node_modules/vue/dist/vue.runtime.esm-bundler.js
var vue_runtime_esm_bundler_exports = /* @__PURE__ */ __exportAll({
	BaseTransition: () => BaseTransition,
	BaseTransitionPropsValidators: () => BaseTransitionPropsValidators,
	Comment: () => Comment,
	DeprecationTypes: () => null,
	EffectScope: () => EffectScope,
	ErrorCodes: () => ErrorCodes,
	ErrorTypeStrings: () => ErrorTypeStrings,
	Fragment: () => Fragment,
	KeepAlive: () => KeepAlive,
	ReactiveEffect: () => ReactiveEffect,
	Static: () => Static,
	Suspense: () => Suspense,
	Teleport: () => Teleport,
	Text: () => Text,
	TrackOpTypes: () => TrackOpTypes,
	Transition: () => Transition,
	TransitionGroup: () => TransitionGroup,
	TriggerOpTypes: () => TriggerOpTypes,
	VueElement: () => VueElement,
	assertNumber: () => assertNumber,
	callWithAsyncErrorHandling: () => callWithAsyncErrorHandling,
	callWithErrorHandling: () => callWithErrorHandling,
	camelize: () => camelize,
	capitalize: () => capitalize$1,
	cloneVNode: () => cloneVNode,
	compatUtils: () => null,
	compile: () => compile$1,
	computed: () => computed,
	createApp: () => createApp,
	createBlock: () => createBlock,
	createCommentVNode: () => createCommentVNode,
	createElementBlock: () => createElementBlock,
	createElementVNode: () => createBaseVNode,
	createHydrationRenderer: () => createHydrationRenderer,
	createPropsRestProxy: () => createPropsRestProxy,
	createRenderer: () => createRenderer,
	createSSRApp: () => createSSRApp,
	createSlots: () => createSlots,
	createStaticVNode: () => createStaticVNode,
	createTextVNode: () => createTextVNode,
	createVNode: () => createVNode,
	customRef: () => customRef,
	defineAsyncComponent: () => defineAsyncComponent,
	defineComponent: () => defineComponent,
	defineCustomElement: () => defineCustomElement,
	defineEmits: () => defineEmits,
	defineExpose: () => defineExpose,
	defineModel: () => defineModel,
	defineOptions: () => defineOptions,
	defineProps: () => defineProps,
	defineSSRCustomElement: () => defineSSRCustomElement,
	defineSlots: () => defineSlots,
	devtools: () => devtools$1,
	effect: () => effect,
	effectScope: () => effectScope,
	getCurrentInstance: () => getCurrentInstance$1,
	getCurrentScope: () => getCurrentScope,
	getCurrentWatcher: () => getCurrentWatcher,
	getTransitionRawChildren: () => getTransitionRawChildren,
	guardReactiveProps: () => guardReactiveProps,
	h: () => h,
	handleError: () => handleError,
	hasInjectionContext: () => hasInjectionContext,
	hydrate: () => hydrate,
	hydrateOnIdle: () => hydrateOnIdle,
	hydrateOnInteraction: () => hydrateOnInteraction,
	hydrateOnMediaQuery: () => hydrateOnMediaQuery,
	hydrateOnVisible: () => hydrateOnVisible,
	initCustomFormatter: () => initCustomFormatter,
	initDirectivesForSSR: () => initDirectivesForSSR,
	inject: () => inject,
	isMemoSame: () => isMemoSame,
	isProxy: () => isProxy,
	isReactive: () => isReactive,
	isReadonly: () => isReadonly,
	isRef: () => isRef,
	isRuntimeOnly: () => isRuntimeOnly,
	isShallow: () => isShallow,
	isVNode: () => isVNode$1,
	markRaw: () => markRaw,
	mergeDefaults: () => mergeDefaults,
	mergeModels: () => mergeModels,
	mergeProps: () => mergeProps,
	nextTick: () => nextTick,
	nodeOps: () => nodeOps,
	normalizeClass: () => normalizeClass,
	normalizeProps: () => normalizeProps,
	normalizeStyle: () => normalizeStyle,
	onActivated: () => onActivated,
	onBeforeMount: () => onBeforeMount,
	onBeforeUnmount: () => onBeforeUnmount,
	onBeforeUpdate: () => onBeforeUpdate,
	onDeactivated: () => onDeactivated,
	onErrorCaptured: () => onErrorCaptured,
	onMounted: () => onMounted,
	onRenderTracked: () => onRenderTracked,
	onRenderTriggered: () => onRenderTriggered,
	onScopeDispose: () => onScopeDispose,
	onServerPrefetch: () => onServerPrefetch,
	onUnmounted: () => onUnmounted,
	onUpdated: () => onUpdated,
	onWatcherCleanup: () => onWatcherCleanup,
	openBlock: () => openBlock,
	patchProp: () => patchProp,
	popScopeId: () => popScopeId,
	provide: () => provide,
	proxyRefs: () => proxyRefs,
	pushScopeId: () => pushScopeId,
	queuePostFlushCb: () => queuePostFlushCb,
	reactive: () => reactive,
	readonly: () => readonly,
	ref: () => ref,
	registerRuntimeCompiler: () => registerRuntimeCompiler,
	render: () => render,
	renderList: () => renderList,
	renderSlot: () => renderSlot,
	resolveComponent: () => resolveComponent,
	resolveDirective: () => resolveDirective,
	resolveDynamicComponent: () => resolveDynamicComponent,
	resolveFilter: () => null,
	resolveTransitionHooks: () => resolveTransitionHooks,
	setBlockTracking: () => setBlockTracking,
	setDevtoolsHook: () => setDevtoolsHook,
	setTransitionHooks: () => setTransitionHooks,
	shallowReactive: () => shallowReactive,
	shallowReadonly: () => shallowReadonly,
	shallowRef: () => shallowRef,
	ssrContextKey: () => ssrContextKey,
	ssrUtils: () => ssrUtils,
	stop: () => stop,
	toDisplayString: () => toDisplayString$1,
	toHandlerKey: () => toHandlerKey,
	toHandlers: () => toHandlers,
	toRaw: () => toRaw,
	toRef: () => toRef,
	toRefs: () => toRefs,
	toValue: () => toValue,
	transformVNodeArgs: () => transformVNodeArgs,
	triggerRef: () => triggerRef,
	unref: () => unref,
	useAttrs: () => useAttrs,
	useCssModule: () => useCssModule,
	useCssVars: () => useCssVars,
	useHost: () => useHost,
	useId: () => useId,
	useModel: () => useModel,
	useSSRContext: () => useSSRContext,
	useShadowRoot: () => useShadowRoot,
	useSlots: () => useSlots,
	useTemplateRef: () => useTemplateRef,
	useTransitionState: () => useTransitionState,
	vModelCheckbox: () => vModelCheckbox,
	vModelDynamic: () => vModelDynamic,
	vModelRadio: () => vModelRadio,
	vModelSelect: () => vModelSelect,
	vModelText: () => vModelText,
	vShow: () => vShow,
	version: () => version,
	warn: () => warn$1,
	watch: () => watch,
	watchEffect: () => watchEffect,
	watchPostEffect: () => watchPostEffect,
	watchSyncEffect: () => watchSyncEffect,
	withAsyncContext: () => withAsyncContext,
	withCtx: () => withCtx,
	withDefaults: () => withDefaults,
	withDirectives: () => withDirectives,
	withKeys: () => withKeys,
	withMemo: () => withMemo,
	withModifiers: () => withModifiers,
	withScopeId: () => withScopeId
});
/**
* vue v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
var compile$1 = () => {};
//#endregion
//#region ../../node_modules/.pnpm/@intlify+shared@11.4.8/node_modules/@intlify/shared/dist/shared.mjs
/*!
* shared v11.4.8
* (c) 2026 kazuya kawaguchi
* Released under the MIT License.
*/
/**
* Original Utilities
* written by kazuya kawaguchi
*/
var inBrowser = typeof window !== "undefined";
var makeSymbol = (name, shareable = false) => !shareable ? Symbol(name) : Symbol.for(name);
var generateFormatCacheKey = (locale, key, source) => friendlyJSONstringify({
	l: locale,
	k: key,
	s: source
});
var friendlyJSONstringify = (json) => JSON.stringify(json).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029").replace(/\u0027/g, "\\u0027");
var isNumber = (val) => typeof val === "number" && isFinite(val);
var isDate = (val) => toTypeString(val) === "[object Date]";
var isRegExp = (val) => toTypeString(val) === "[object RegExp]";
var isEmptyObject = (val) => isPlainObject(val) && Object.keys(val).length === 0;
var assign = Object.assign;
var _create = Object.create;
var create = (obj = null) => _create(obj);
var _globalThis;
var getGlobalThis = () => {
	return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : create());
};
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
	return hasOwnProperty.call(obj, key);
}
/**
* Useful Utilities By Evan you
* Modified by kazuya kawaguchi
* MIT License
* https://github.com/vuejs/vue-next/blob/master/packages/shared/src/index.ts
* https://github.com/vuejs/vue-next/blob/master/packages/shared/src/codeframe.ts
*/
var isArray = Array.isArray;
var isFunction = (val) => typeof val === "function";
var isString = (val) => typeof val === "string";
var isBoolean = (val) => typeof val === "boolean";
var isObject = (val) => val !== null && typeof val === "object";
var isPromise = (val) => {
	return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};
var objectToString = Object.prototype.toString;
var toTypeString = (value) => objectToString.call(value);
var isPlainObject = (val) => toTypeString(val) === "[object Object]";
var toDisplayString = (val) => {
	return val == null ? "" : isArray(val) || isPlainObject(val) && val.toString === objectToString ? JSON.stringify(val, null, 2) : String(val);
};
function join(items, separator = "") {
	return items.reduce((str, item, index) => index === 0 ? str + item : str + separator + item, "");
}
function warn(msg, err) {
	if (typeof console !== "undefined") {
		console.warn(`[intlify] ` + msg);
		/* istanbul ignore if */
		if (err) console.warn(err.stack);
	}
}
function escapeHtml(rawText) {
	return rawText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/\//g, "&#x2F;").replace(/=/g, "&#x3D;");
}
function escapeAttributeValue(value) {
	return value.replace(/&(?![a-z0-9#]{2,6};)/gi, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var javascriptSchemePattern = /^javascript:/i;
var urlAttributePattern = /^(?:href|src|action|formaction)$/i;
var numericCharacterReferencePattern = /&#(?:x([0-9a-f]+)|(\d+));?/gi;
var namedWhitespaceCharacterReferencePattern = /&(?:Tab|NewLine);/g;
var colonCharacterReferencePattern = /&colon;?/gi;
var controlOrWhitespacePattern = /[\u0000-\u0020\u007f-\u009f]/g;
var eventHandlerPattern = /(?:^|[\s"'<>/])on\w+\s*=\s*["']?[^"'>]+["']?/i;
var eventHandlerAttributePattern = /(^|[\s"'<>/])on(\w+\s*=)/gi;
var unquotedUrlAttributePattern = /(^|[\s"'<>/])((?:href|src|action|formaction)\s*=\s*)([^\s"'=<>`]+)/gi;
function decodeNumericCharacterReference(match, hex, decimal) {
	const digits = hex || decimal;
	if (!digits) return match;
	const codePoint = Number.parseInt(digits, hex ? 16 : 10);
	return codePoint <= 127 ? String.fromCharCode(codePoint) : match;
}
function hasJavascriptScheme(value) {
	const normalized = value.replace(numericCharacterReferencePattern, decodeNumericCharacterReference).replace(namedWhitespaceCharacterReferencePattern, "").replace(colonCharacterReferencePattern, ":").replace(controlOrWhitespacePattern, "");
	return javascriptSchemePattern.test(normalized);
}
function sanitizeStyleValue(value) {
	const urlPattern = /url\s*\(/gi;
	let sanitized = "";
	let cursor = 0;
	let match;
	while ((match = urlPattern.exec(value)) !== null) {
		const urlStart = match.index;
		const openParenIndex = urlPattern.lastIndex - 1;
		let index = openParenIndex + 1;
		let depth = 1;
		let quote = null;
		for (; index < value.length; index++) {
			const char = value[index];
			if (quote) {
				if (char === quote) quote = null;
				continue;
			}
			if (char === "\"" || char === "'") quote = char;
			else if (char === "(") depth++;
			else if (char === ")") {
				depth--;
				if (depth === 0) break;
			}
		}
		if (depth !== 0) break;
		const rawUrlValue = value.slice(openParenIndex + 1, index).trim();
		const unquotedUrlValue = rawUrlValue.startsWith("\"") && rawUrlValue.endsWith("\"") || rawUrlValue.startsWith("'") && rawUrlValue.endsWith("'") ? rawUrlValue.slice(1, -1).trim() : rawUrlValue;
		sanitized += value.slice(cursor, urlStart);
		sanitized += hasJavascriptScheme(unquotedUrlValue) ? "url(about:blank)" : value.slice(urlStart, index + 1);
		cursor = index + 1;
	}
	return sanitized + value.slice(cursor);
}
function sanitizeAttributeValue(attrName, value) {
	if (urlAttributePattern.test(attrName) && hasJavascriptScheme(value)) return "about:blank";
	return escapeAttributeValue(attrName.toLowerCase() === "style" ? sanitizeStyleValue(value) : value);
}
function sanitizeTranslatedHtml(html) {
	html = html.replace(/([\w:-]+)\s*=\s*"([^"]*)"/g, (_, attrName, attrValue) => `${attrName}="${sanitizeAttributeValue(attrName, attrValue)}"`);
	html = html.replace(/([\w:-]+)\s*=\s*'([^']*)'/g, (_, attrName, attrValue) => `${attrName}='${sanitizeAttributeValue(attrName, attrValue)}'`);
	if (eventHandlerPattern.test(html)) html = html.replace(eventHandlerAttributePattern, "$1&#111;n$2");
	html = html.replace(unquotedUrlAttributePattern, (match, boundary, prefix, attrValue) => hasJavascriptScheme(attrValue) ? `${boundary}${prefix}about:blank` : match);
	return html;
}
var isNotObjectOrIsArray = (val) => !isObject(val) || isArray(val);
function deepCopy(src, des) {
	if (isNotObjectOrIsArray(src) || isNotObjectOrIsArray(des)) throw new Error("Invalid value");
	const stack = [{
		src,
		des
	}];
	while (stack.length) {
		const { src, des } = stack.pop();
		Object.keys(src).forEach((key) => {
			if (key === "__proto__") return;
			if (isObject(src[key]) && !isObject(des[key])) des[key] = Array.isArray(src[key]) ? [] : create();
			if (isNotObjectOrIsArray(des[key]) || isNotObjectOrIsArray(src[key])) des[key] = src[key];
			else stack.push({
				src: src[key],
				des: des[key]
			});
		});
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@intlify+message-compiler@11.4.8/node_modules/@intlify/message-compiler/dist/message-compiler.mjs
/*!
* message-compiler v11.4.8
* (c) 2026 kazuya kawaguchi
* Released under the MIT License.
*/
function createPosition(line, column, offset) {
	return {
		line,
		column,
		offset
	};
}
function createLocation(start, end, source) {
	const loc = {
		start,
		end
	};
	if (source != null) loc.source = source;
	return loc;
}
var CompileErrorCodes = {
	EXPECTED_TOKEN: 1,
	INVALID_TOKEN_IN_PLACEHOLDER: 2,
	UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER: 3,
	UNKNOWN_ESCAPE_SEQUENCE: 4,
	INVALID_UNICODE_ESCAPE_SEQUENCE: 5,
	UNBALANCED_CLOSING_BRACE: 6,
	UNTERMINATED_CLOSING_BRACE: 7,
	EMPTY_PLACEHOLDER: 8,
	NOT_ALLOW_NEST_PLACEHOLDER: 9,
	INVALID_LINKED_FORMAT: 10,
	MUST_HAVE_MESSAGES_IN_PLURAL: 11,
	UNEXPECTED_EMPTY_LINKED_MODIFIER: 12,
	UNEXPECTED_EMPTY_LINKED_KEY: 13,
	UNEXPECTED_LEXICAL_ANALYSIS: 14,
	UNHANDLED_CODEGEN_NODE_TYPE: 15,
	UNHANDLED_MINIFIER_NODE_TYPE: 16
};
CompileErrorCodes.EXPECTED_TOKEN, CompileErrorCodes.INVALID_TOKEN_IN_PLACEHOLDER, CompileErrorCodes.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER, CompileErrorCodes.UNKNOWN_ESCAPE_SEQUENCE, CompileErrorCodes.INVALID_UNICODE_ESCAPE_SEQUENCE, CompileErrorCodes.UNBALANCED_CLOSING_BRACE, CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, CompileErrorCodes.EMPTY_PLACEHOLDER, CompileErrorCodes.NOT_ALLOW_NEST_PLACEHOLDER, CompileErrorCodes.INVALID_LINKED_FORMAT, CompileErrorCodes.MUST_HAVE_MESSAGES_IN_PLURAL, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_MODIFIER, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_KEY, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, CompileErrorCodes.UNHANDLED_CODEGEN_NODE_TYPE, CompileErrorCodes.UNHANDLED_MINIFIER_NODE_TYPE;
function createCompileError(code, loc, options = {}) {
	const { domain, messages, args } = options;
	const error = new SyntaxError(String(code));
	error.code = code;
	if (loc) error.location = loc;
	error.domain = domain;
	return error;
}
/** @internal */
function defaultOnError(error) {
	throw error;
}
var CHAR_SP = " ";
var CHAR_CR = "\r";
var CHAR_LF = "\n";
var CHAR_LS = String.fromCharCode(8232);
var CHAR_PS = String.fromCharCode(8233);
function createScanner(str) {
	const _buf = str;
	let _index = 0;
	let _line = 1;
	let _column = 1;
	let _peekOffset = 0;
	const isCRLF = (index) => _buf[index] === CHAR_CR && _buf[index + 1] === CHAR_LF;
	const isLF = (index) => _buf[index] === CHAR_LF;
	const isPS = (index) => _buf[index] === CHAR_PS;
	const isLS = (index) => _buf[index] === CHAR_LS;
	const isLineEnd = (index) => isCRLF(index) || isLF(index) || isPS(index) || isLS(index);
	const index = () => _index;
	const line = () => _line;
	const column = () => _column;
	const peekOffset = () => _peekOffset;
	const charAt = (offset) => isCRLF(offset) || isPS(offset) || isLS(offset) ? CHAR_LF : _buf[offset];
	const currentChar = () => charAt(_index);
	const currentPeek = () => charAt(_index + _peekOffset);
	function next() {
		_peekOffset = 0;
		if (isLineEnd(_index)) {
			_line++;
			_column = 0;
		}
		if (isCRLF(_index)) _index++;
		_index++;
		_column++;
		return _buf[_index];
	}
	function peek() {
		if (isCRLF(_index + _peekOffset)) _peekOffset++;
		_peekOffset++;
		return _buf[_index + _peekOffset];
	}
	function reset() {
		_index = 0;
		_line = 1;
		_column = 1;
		_peekOffset = 0;
	}
	function resetPeek(offset = 0) {
		_peekOffset = offset;
	}
	function skipToPeek() {
		const target = _index + _peekOffset;
		while (target !== _index) next();
		_peekOffset = 0;
	}
	return {
		index,
		line,
		column,
		peekOffset,
		charAt,
		currentChar,
		currentPeek,
		next,
		peek,
		reset,
		resetPeek,
		skipToPeek
	};
}
var EOF = void 0;
var DOT = ".";
var LITERAL_DELIMITER = "'";
var ERROR_DOMAIN$3 = "tokenizer";
function createTokenizer(source, options = {}) {
	const location = options.location !== false;
	const _scnr = createScanner(source);
	const currentOffset = () => _scnr.index();
	const currentPosition = () => createPosition(_scnr.line(), _scnr.column(), _scnr.index());
	const _initLoc = currentPosition();
	const _initOffset = currentOffset();
	const _context = {
		currentType: 13,
		offset: _initOffset,
		startLoc: _initLoc,
		endLoc: _initLoc,
		lastType: 13,
		lastOffset: _initOffset,
		lastStartLoc: _initLoc,
		lastEndLoc: _initLoc,
		braceNest: 0,
		inLinked: false,
		text: ""
	};
	const context = () => _context;
	const { onError } = options;
	function emitError(code, pos, offset, ...args) {
		const ctx = context();
		pos.column += offset;
		pos.offset += offset;
		if (onError) {
			const err = createCompileError(code, location ? createLocation(ctx.startLoc, pos) : null, {
				domain: ERROR_DOMAIN$3,
				args
			});
			onError(err);
		}
	}
	function getToken(context, type, value) {
		context.endLoc = currentPosition();
		context.currentType = type;
		const token = { type };
		if (location) token.loc = createLocation(context.startLoc, context.endLoc);
		if (value != null) token.value = value;
		return token;
	}
	const getEndToken = (context) => getToken(context, 13);
	function eat(scnr, ch) {
		if (scnr.currentChar() === ch) {
			scnr.next();
			return ch;
		} else {
			emitError(CompileErrorCodes.EXPECTED_TOKEN, currentPosition(), 0, ch);
			return "";
		}
	}
	function peekSpaces(scnr) {
		let buf = "";
		while (scnr.currentPeek() === CHAR_SP || scnr.currentPeek() === CHAR_LF) {
			buf += scnr.currentPeek();
			scnr.peek();
		}
		return buf;
	}
	function skipSpaces(scnr) {
		const buf = peekSpaces(scnr);
		scnr.skipToPeek();
		return buf;
	}
	function isIdentifierStart(ch) {
		if (ch === EOF) return false;
		const cc = ch.charCodeAt(0);
		return cc >= 97 && cc <= 122 || cc >= 65 && cc <= 90 || cc === 95;
	}
	function isNumberStart(ch) {
		if (ch === EOF) return false;
		const cc = ch.charCodeAt(0);
		return cc >= 48 && cc <= 57;
	}
	function isNamedIdentifierStart(scnr, context) {
		const { currentType } = context;
		if (currentType !== 2) return false;
		peekSpaces(scnr);
		const ret = isIdentifierStart(scnr.currentPeek());
		scnr.resetPeek();
		return ret;
	}
	function isListIdentifierStart(scnr, context) {
		const { currentType } = context;
		if (currentType !== 2) return false;
		peekSpaces(scnr);
		const ret = isNumberStart(scnr.currentPeek() === "-" ? scnr.peek() : scnr.currentPeek());
		scnr.resetPeek();
		return ret;
	}
	function isLiteralStart(scnr, context) {
		const { currentType } = context;
		if (currentType !== 2) return false;
		peekSpaces(scnr);
		const ret = scnr.currentPeek() === LITERAL_DELIMITER;
		scnr.resetPeek();
		return ret;
	}
	function isLinkedDotStart(scnr, context) {
		const { currentType } = context;
		if (currentType !== 7) return false;
		peekSpaces(scnr);
		const ret = scnr.currentPeek() === ".";
		scnr.resetPeek();
		return ret;
	}
	function isLinkedModifierStart(scnr, context) {
		const { currentType } = context;
		if (currentType !== 8) return false;
		peekSpaces(scnr);
		const ret = isIdentifierStart(scnr.currentPeek());
		scnr.resetPeek();
		return ret;
	}
	function isLinkedDelimiterStart(scnr, context) {
		const { currentType } = context;
		if (!(currentType === 7 || currentType === 11)) return false;
		peekSpaces(scnr);
		const ret = scnr.currentPeek() === ":";
		scnr.resetPeek();
		return ret;
	}
	function isLinkedReferStart(scnr, context) {
		const { currentType } = context;
		if (currentType !== 9) return false;
		const fn = () => {
			const ch = scnr.currentPeek();
			if (ch === "{") return isIdentifierStart(scnr.peek());
			else if (ch === "@" || ch === "|" || ch === ":" || ch === "." || ch === CHAR_SP || !ch) return false;
			else if (ch === CHAR_LF) {
				scnr.peek();
				return fn();
			} else return isTextStart(scnr, false);
		};
		const ret = fn();
		scnr.resetPeek();
		return ret;
	}
	function isPluralStart(scnr) {
		peekSpaces(scnr);
		const ret = scnr.currentPeek() === "|";
		scnr.resetPeek();
		return ret;
	}
	function isTextStart(scnr, reset = true) {
		const fn = (hasSpace = false, prev = "") => {
			const ch = scnr.currentPeek();
			if (ch === "{") return hasSpace;
			else if (ch === "@" || !ch) return hasSpace;
			else if (ch === "|") return !(prev === CHAR_SP || prev === CHAR_LF);
			else if (ch === CHAR_SP) {
				scnr.peek();
				return fn(true, CHAR_SP);
			} else if (ch === CHAR_LF) {
				scnr.peek();
				return fn(true, CHAR_LF);
			} else return true;
		};
		const ret = fn();
		reset && scnr.resetPeek();
		return ret;
	}
	function takeChar(scnr, fn) {
		const ch = scnr.currentChar();
		if (ch === EOF) return;
		if (fn(ch)) {
			scnr.next();
			return ch;
		}
		return null;
	}
	function isIdentifier(ch) {
		const cc = ch.charCodeAt(0);
		return cc >= 97 && cc <= 122 || cc >= 65 && cc <= 90 || cc >= 48 && cc <= 57 || cc === 95 || cc === 36;
	}
	function takeIdentifierChar(scnr) {
		return takeChar(scnr, isIdentifier);
	}
	function isNamedIdentifier(ch) {
		const cc = ch.charCodeAt(0);
		return cc >= 97 && cc <= 122 || cc >= 65 && cc <= 90 || cc >= 48 && cc <= 57 || cc === 95 || cc === 36 || cc === 45;
	}
	function takeNamedIdentifierChar(scnr) {
		return takeChar(scnr, isNamedIdentifier);
	}
	function isDigit(ch) {
		const cc = ch.charCodeAt(0);
		return cc >= 48 && cc <= 57;
	}
	function takeDigit(scnr) {
		return takeChar(scnr, isDigit);
	}
	function isHexDigit(ch) {
		const cc = ch.charCodeAt(0);
		return cc >= 48 && cc <= 57 || cc >= 65 && cc <= 70 || cc >= 97 && cc <= 102;
	}
	function takeHexDigit(scnr) {
		return takeChar(scnr, isHexDigit);
	}
	function getDigits(scnr) {
		let ch = "";
		let num = "";
		while (ch = takeDigit(scnr)) num += ch;
		return num;
	}
	function readText(scnr) {
		let buf = "";
		while (true) {
			const ch = scnr.currentChar();
			if (ch === "\\") {
				const nextCh = scnr.peek();
				if (nextCh === "{" || nextCh === "}" || nextCh === "@" || nextCh === "|" || nextCh === "\\") {
					buf += ch + nextCh;
					scnr.next();
					scnr.next();
				} else {
					scnr.resetPeek();
					buf += ch;
					scnr.next();
				}
			} else if (ch === "{" || ch === "}" || ch === "@" || ch === "|" || !ch) break;
			else if (ch === CHAR_SP || ch === CHAR_LF) if (isTextStart(scnr)) {
				buf += ch;
				scnr.next();
			} else if (isPluralStart(scnr)) break;
			else {
				buf += ch;
				scnr.next();
			}
			else {
				buf += ch;
				scnr.next();
			}
		}
		return buf;
	}
	function readNamedIdentifier(scnr) {
		skipSpaces(scnr);
		let ch = "";
		let name = "";
		while (ch = takeNamedIdentifierChar(scnr)) name += ch;
		const currentChar = scnr.currentChar();
		if (currentChar && currentChar !== "}" && currentChar !== EOF && currentChar !== CHAR_SP && currentChar !== CHAR_LF && currentChar !== "　") {
			const invalidPart = readInvalidIdentifier(scnr);
			emitError(CompileErrorCodes.INVALID_TOKEN_IN_PLACEHOLDER, currentPosition(), 0, name + invalidPart);
			return name + invalidPart;
		}
		if (scnr.currentChar() === EOF) emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
		return name;
	}
	function readListIdentifier(scnr) {
		skipSpaces(scnr);
		let value = "";
		if (scnr.currentChar() === "-") {
			scnr.next();
			value += `-${getDigits(scnr)}`;
		} else value += getDigits(scnr);
		if (scnr.currentChar() === EOF) emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
		return value;
	}
	function isLiteral(ch) {
		return ch !== LITERAL_DELIMITER && ch !== CHAR_LF;
	}
	function readLiteral(scnr) {
		skipSpaces(scnr);
		eat(scnr, `\'`);
		let ch = "";
		let literal = "";
		while (ch = takeChar(scnr, isLiteral)) if (ch === "\\") literal += readEscapeSequence(scnr);
		else literal += ch;
		const current = scnr.currentChar();
		if (current === CHAR_LF || current === EOF) {
			emitError(CompileErrorCodes.UNTERMINATED_SINGLE_QUOTE_IN_PLACEHOLDER, currentPosition(), 0);
			if (current === CHAR_LF) {
				scnr.next();
				eat(scnr, `\'`);
			}
			return literal;
		}
		eat(scnr, `\'`);
		return literal;
	}
	function readEscapeSequence(scnr) {
		const ch = scnr.currentChar();
		switch (ch) {
			case "\\":
			case `\'`:
				scnr.next();
				return `\\${ch}`;
			case "u": return readUnicodeEscapeSequence(scnr, ch, 4);
			case "U": return readUnicodeEscapeSequence(scnr, ch, 6);
			default:
				emitError(CompileErrorCodes.UNKNOWN_ESCAPE_SEQUENCE, currentPosition(), 0, ch);
				return "";
		}
	}
	function readUnicodeEscapeSequence(scnr, unicode, digits) {
		eat(scnr, unicode);
		let sequence = "";
		for (let i = 0; i < digits; i++) {
			const ch = takeHexDigit(scnr);
			if (!ch) {
				emitError(CompileErrorCodes.INVALID_UNICODE_ESCAPE_SEQUENCE, currentPosition(), 0, `\\${unicode}${sequence}${scnr.currentChar()}`);
				break;
			}
			sequence += ch;
		}
		return `\\${unicode}${sequence}`;
	}
	function isInvalidIdentifier(ch) {
		return ch !== "{" && ch !== "}" && ch !== CHAR_SP && ch !== CHAR_LF;
	}
	function readInvalidIdentifier(scnr) {
		skipSpaces(scnr);
		let ch = "";
		let identifiers = "";
		while (ch = takeChar(scnr, isInvalidIdentifier)) identifiers += ch;
		return identifiers;
	}
	function readLinkedModifier(scnr) {
		let ch = "";
		let name = "";
		while (ch = takeIdentifierChar(scnr)) name += ch;
		return name;
	}
	function readLinkedRefer(scnr) {
		const fn = (buf) => {
			const ch = scnr.currentChar();
			if (ch === "{" || ch === "@" || ch === "|" || ch === "(" || ch === ")" || !ch) return buf;
			else if (ch === CHAR_SP) return buf;
			else if (ch === CHAR_LF || ch === DOT) {
				buf += ch;
				scnr.next();
				return fn(buf);
			} else {
				buf += ch;
				scnr.next();
				return fn(buf);
			}
		};
		return fn("");
	}
	function readPlural(scnr) {
		skipSpaces(scnr);
		const plural = eat(scnr, "|");
		skipSpaces(scnr);
		return plural;
	}
	function readTokenInPlaceholder(scnr, context) {
		let token = null;
		switch (scnr.currentChar()) {
			case "{":
				if (context.braceNest >= 1) emitError(CompileErrorCodes.NOT_ALLOW_NEST_PLACEHOLDER, currentPosition(), 0);
				scnr.next();
				token = getToken(context, 2, "{");
				skipSpaces(scnr);
				context.braceNest++;
				return token;
			case "}":
				if (context.braceNest > 0 && context.currentType === 2) emitError(CompileErrorCodes.EMPTY_PLACEHOLDER, currentPosition(), 0);
				scnr.next();
				token = getToken(context, 3, "}");
				context.braceNest--;
				context.braceNest > 0 && skipSpaces(scnr);
				if (context.inLinked && context.braceNest === 0) context.inLinked = false;
				return token;
			case "@":
				if (context.braceNest > 0) emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
				token = readTokenInLinked(scnr, context) || getEndToken(context);
				context.braceNest = 0;
				return token;
			default: {
				let validNamedIdentifier = true;
				let validListIdentifier = true;
				let validLiteral = true;
				if (isPluralStart(scnr)) {
					if (context.braceNest > 0) emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
					token = getToken(context, 1, readPlural(scnr));
					context.braceNest = 0;
					context.inLinked = false;
					return token;
				}
				if (context.braceNest > 0 && (context.currentType === 4 || context.currentType === 5 || context.currentType === 6)) {
					emitError(CompileErrorCodes.UNTERMINATED_CLOSING_BRACE, currentPosition(), 0);
					context.braceNest = 0;
					return readToken(scnr, context);
				}
				if (validNamedIdentifier = isNamedIdentifierStart(scnr, context)) {
					token = getToken(context, 4, readNamedIdentifier(scnr));
					skipSpaces(scnr);
					return token;
				}
				if (validListIdentifier = isListIdentifierStart(scnr, context)) {
					token = getToken(context, 5, readListIdentifier(scnr));
					skipSpaces(scnr);
					return token;
				}
				if (validLiteral = isLiteralStart(scnr, context)) {
					token = getToken(context, 6, readLiteral(scnr));
					skipSpaces(scnr);
					return token;
				}
				if (!validNamedIdentifier && !validListIdentifier && !validLiteral) {
					token = getToken(context, 12, readInvalidIdentifier(scnr));
					emitError(CompileErrorCodes.INVALID_TOKEN_IN_PLACEHOLDER, currentPosition(), 0, token.value);
					skipSpaces(scnr);
					return token;
				}
				break;
			}
		}
		return token;
	}
	function readTokenInLinked(scnr, context) {
		const { currentType } = context;
		let token = null;
		const ch = scnr.currentChar();
		if ((currentType === 7 || currentType === 8 || currentType === 11 || currentType === 9) && (ch === CHAR_LF || ch === CHAR_SP)) emitError(CompileErrorCodes.INVALID_LINKED_FORMAT, currentPosition(), 0);
		switch (ch) {
			case "@":
				scnr.next();
				token = getToken(context, 7, "@");
				context.inLinked = true;
				return token;
			case ".":
				skipSpaces(scnr);
				scnr.next();
				return getToken(context, 8, ".");
			case ":":
				skipSpaces(scnr);
				scnr.next();
				return getToken(context, 9, ":");
			default:
				if (isPluralStart(scnr)) {
					token = getToken(context, 1, readPlural(scnr));
					context.braceNest = 0;
					context.inLinked = false;
					return token;
				}
				if (isLinkedDotStart(scnr, context) || isLinkedDelimiterStart(scnr, context)) {
					skipSpaces(scnr);
					return readTokenInLinked(scnr, context);
				}
				if (isLinkedModifierStart(scnr, context)) {
					skipSpaces(scnr);
					return getToken(context, 11, readLinkedModifier(scnr));
				}
				if (isLinkedReferStart(scnr, context)) {
					skipSpaces(scnr);
					if (ch === "{") return readTokenInPlaceholder(scnr, context) || token;
					else return getToken(context, 10, readLinkedRefer(scnr));
				}
				if (currentType === 7) emitError(CompileErrorCodes.INVALID_LINKED_FORMAT, currentPosition(), 0);
				context.braceNest = 0;
				context.inLinked = false;
				return readToken(scnr, context);
		}
	}
	function readToken(scnr, context) {
		let token = { type: 13 };
		if (context.braceNest > 0) return readTokenInPlaceholder(scnr, context) || getEndToken(context);
		if (context.inLinked) return readTokenInLinked(scnr, context) || getEndToken(context);
		switch (scnr.currentChar()) {
			case "{": return readTokenInPlaceholder(scnr, context) || getEndToken(context);
			case "}":
				emitError(CompileErrorCodes.UNBALANCED_CLOSING_BRACE, currentPosition(), 0);
				scnr.next();
				return getToken(context, 3, "}");
			case "@": return readTokenInLinked(scnr, context) || getEndToken(context);
			default:
				if (isPluralStart(scnr)) {
					token = getToken(context, 1, readPlural(scnr));
					context.braceNest = 0;
					context.inLinked = false;
					return token;
				}
				if (isTextStart(scnr)) return getToken(context, 0, readText(scnr));
		}
		return token;
	}
	function nextToken() {
		const { currentType, offset, startLoc, endLoc } = _context;
		_context.lastType = currentType;
		_context.lastOffset = offset;
		_context.lastStartLoc = startLoc;
		_context.lastEndLoc = endLoc;
		_context.offset = currentOffset();
		_context.startLoc = currentPosition();
		if (_scnr.currentChar() === EOF) return getToken(_context, 13);
		return readToken(_scnr, _context);
	}
	return {
		nextToken,
		currentOffset,
		currentPosition,
		context
	};
}
var ERROR_DOMAIN$2 = "parser";
var KNOWN_ESCAPES = /(?:\\\\|\\'|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;
var TEXT_ESCAPES = /\\([\\@{}|])/g;
function fromTextEscapeSequence(_match, char) {
	return char;
}
function fromEscapeSequence(match, codePoint4, codePoint6) {
	switch (match) {
		case `\\\\`: return `\\`;
		case `\\\'`: return `\'`;
		default: {
			const codePoint = parseInt(codePoint4 || codePoint6, 16);
			if (codePoint <= 55295 || codePoint >= 57344) return String.fromCodePoint(codePoint);
			return "�";
		}
	}
}
function createParser(options = {}) {
	const location = options.location !== false;
	const { onError } = options;
	function emitError(tokenzer, code, start, offset, ...args) {
		const end = tokenzer.currentPosition();
		end.offset += offset;
		end.column += offset;
		if (onError) {
			const err = createCompileError(code, location ? createLocation(start, end) : null, {
				domain: ERROR_DOMAIN$2,
				args
			});
			onError(err);
		}
	}
	function startNode(type, offset, loc) {
		const node = { type };
		if (location) {
			node.start = offset;
			node.end = offset;
			node.loc = {
				start: loc,
				end: loc
			};
		}
		return node;
	}
	function endNode(node, offset, pos, type) {
		if (location) {
			node.end = offset;
			if (node.loc) node.loc.end = pos;
		}
	}
	function parseText(tokenizer, value) {
		const context = tokenizer.context();
		const node = startNode(3, context.offset, context.startLoc);
		node.value = value.replace(TEXT_ESCAPES, fromTextEscapeSequence);
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return node;
	}
	function parseList(tokenizer, index) {
		const { lastOffset: offset, lastStartLoc: loc } = tokenizer.context();
		const node = startNode(5, offset, loc);
		node.index = parseInt(index, 10);
		tokenizer.nextToken();
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return node;
	}
	function parseNamed(tokenizer, key) {
		const { lastOffset: offset, lastStartLoc: loc } = tokenizer.context();
		const node = startNode(4, offset, loc);
		node.key = key;
		tokenizer.nextToken();
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return node;
	}
	function parseLiteral(tokenizer, value) {
		const { lastOffset: offset, lastStartLoc: loc } = tokenizer.context();
		const node = startNode(9, offset, loc);
		node.value = value.replace(KNOWN_ESCAPES, fromEscapeSequence);
		tokenizer.nextToken();
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return node;
	}
	function parseLinkedModifier(tokenizer) {
		const token = tokenizer.nextToken();
		const context = tokenizer.context();
		const { lastOffset: offset, lastStartLoc: loc } = context;
		const node = startNode(8, offset, loc);
		if (token.type !== 11) {
			emitError(tokenizer, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_MODIFIER, context.lastStartLoc, 0);
			node.value = "";
			endNode(node, offset, loc);
			return {
				nextConsumeToken: token,
				node
			};
		}
		if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
		node.value = token.value || "";
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return { node };
	}
	function parseLinkedKey(tokenizer, value) {
		const context = tokenizer.context();
		const node = startNode(7, context.offset, context.startLoc);
		node.value = value;
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return node;
	}
	function parseLinked(tokenizer) {
		const context = tokenizer.context();
		const linkedNode = startNode(6, context.offset, context.startLoc);
		let token = tokenizer.nextToken();
		if (token.type === 8) {
			const parsed = parseLinkedModifier(tokenizer);
			linkedNode.modifier = parsed.node;
			token = parsed.nextConsumeToken || tokenizer.nextToken();
		}
		if (token.type !== 9) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
		token = tokenizer.nextToken();
		if (token.type === 2) token = tokenizer.nextToken();
		switch (token.type) {
			case 10:
				if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
				linkedNode.key = parseLinkedKey(tokenizer, token.value || "");
				break;
			case 4:
				if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
				linkedNode.key = parseNamed(tokenizer, token.value || "");
				break;
			case 5:
				if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
				linkedNode.key = parseList(tokenizer, token.value || "");
				break;
			case 6:
				if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
				linkedNode.key = parseLiteral(tokenizer, token.value || "");
				break;
			default: {
				emitError(tokenizer, CompileErrorCodes.UNEXPECTED_EMPTY_LINKED_KEY, context.lastStartLoc, 0);
				const nextContext = tokenizer.context();
				const emptyLinkedKeyNode = startNode(7, nextContext.offset, nextContext.startLoc);
				emptyLinkedKeyNode.value = "";
				endNode(emptyLinkedKeyNode, nextContext.offset, nextContext.startLoc);
				linkedNode.key = emptyLinkedKeyNode;
				endNode(linkedNode, nextContext.offset, nextContext.startLoc);
				return {
					nextConsumeToken: token,
					node: linkedNode
				};
			}
		}
		endNode(linkedNode, tokenizer.currentOffset(), tokenizer.currentPosition());
		return { node: linkedNode };
	}
	function parseMessage(tokenizer) {
		const context = tokenizer.context();
		const node = startNode(2, context.currentType === 1 ? tokenizer.currentOffset() : context.offset, context.currentType === 1 ? context.endLoc : context.startLoc);
		node.items = [];
		let nextToken = null;
		do {
			const token = nextToken || tokenizer.nextToken();
			nextToken = null;
			switch (token.type) {
				case 0:
					if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
					node.items.push(parseText(tokenizer, token.value || ""));
					break;
				case 5:
					if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
					node.items.push(parseList(tokenizer, token.value || ""));
					break;
				case 4:
					if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
					node.items.push(parseNamed(tokenizer, token.value || ""));
					break;
				case 6:
					if (token.value == null) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, getTokenCaption(token));
					node.items.push(parseLiteral(tokenizer, token.value || ""));
					break;
				case 7: {
					const parsed = parseLinked(tokenizer);
					node.items.push(parsed.node);
					nextToken = parsed.nextConsumeToken || null;
					break;
				}
			}
		} while (context.currentType !== 13 && context.currentType !== 1);
		endNode(node, context.currentType === 1 ? context.lastOffset : tokenizer.currentOffset(), context.currentType === 1 ? context.lastEndLoc : tokenizer.currentPosition());
		return node;
	}
	function parsePlural(tokenizer, offset, loc, msgNode) {
		const context = tokenizer.context();
		let hasEmptyMessage = msgNode.items.length === 0;
		const node = startNode(1, offset, loc);
		node.cases = [];
		node.cases.push(msgNode);
		do {
			const msg = parseMessage(tokenizer);
			if (!hasEmptyMessage) hasEmptyMessage = msg.items.length === 0;
			node.cases.push(msg);
		} while (context.currentType !== 13);
		if (hasEmptyMessage) emitError(tokenizer, CompileErrorCodes.MUST_HAVE_MESSAGES_IN_PLURAL, loc, 0);
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return node;
	}
	function parseResource(tokenizer) {
		const context = tokenizer.context();
		const { offset, startLoc } = context;
		const msgNode = parseMessage(tokenizer);
		if (context.currentType === 13) return msgNode;
		else return parsePlural(tokenizer, offset, startLoc, msgNode);
	}
	function parse(source) {
		const tokenizer = createTokenizer(source, assign({}, options));
		const context = tokenizer.context();
		const node = startNode(0, context.offset, context.startLoc);
		if (location && node.loc) node.loc.source = source;
		node.body = parseResource(tokenizer);
		if (options.onCacheKey) node.cacheKey = options.onCacheKey(source);
		if (context.currentType !== 13) emitError(tokenizer, CompileErrorCodes.UNEXPECTED_LEXICAL_ANALYSIS, context.lastStartLoc, 0, source[context.offset] || "");
		endNode(node, tokenizer.currentOffset(), tokenizer.currentPosition());
		return node;
	}
	return { parse };
}
function getTokenCaption(token) {
	if (token.type === 13) return "EOF";
	const name = (token.value || "").replace(/\r?\n/gu, "\\n");
	return name.length > 10 ? name.slice(0, 9) + "…" : name;
}
function createTransformer(ast, options = {}) {
	const _context = {
		ast,
		helpers: /* @__PURE__ */ new Set()
	};
	const context = () => _context;
	const helper = (name) => {
		_context.helpers.add(name);
		return name;
	};
	return {
		context,
		helper
	};
}
function traverseNodes(nodes, transformer) {
	for (let i = 0; i < nodes.length; i++) traverseNode(nodes[i], transformer);
}
function traverseNode(node, transformer) {
	switch (node.type) {
		case 1:
			traverseNodes(node.cases, transformer);
			transformer.helper("plural");
			break;
		case 2:
			traverseNodes(node.items, transformer);
			break;
		case 6:
			traverseNode(node.key, transformer);
			transformer.helper("linked");
			transformer.helper("type");
			break;
		case 5:
			transformer.helper("interpolate");
			transformer.helper("list");
			break;
		case 4:
			transformer.helper("interpolate");
			transformer.helper("named");
	}
}
function transform(ast, options = {}) {
	const transformer = createTransformer(ast);
	transformer.helper("normalize");
	ast.body && traverseNode(ast.body, transformer);
	const context = transformer.context();
	ast.helpers = Array.from(context.helpers);
}
function optimize(ast) {
	const body = ast.body;
	if (body.type === 2) optimizeMessageNode(body);
	else body.cases.forEach((c) => optimizeMessageNode(c));
	return ast;
}
function optimizeMessageNode(message) {
	if (message.items.length === 1) {
		const item = message.items[0];
		if (item.type === 3 || item.type === 9) {
			message.static = item.value;
			delete item.value;
		}
	} else {
		const values = [];
		for (let i = 0; i < message.items.length; i++) {
			const item = message.items[i];
			if (!(item.type === 3 || item.type === 9)) break;
			if (item.value == null) break;
			values.push(item.value);
		}
		if (values.length === message.items.length) {
			message.static = join(values);
			for (let i = 0; i < message.items.length; i++) {
				const item = message.items[i];
				if (item.type === 3 || item.type === 9) delete item.value;
			}
		}
	}
}
function minify(node) {
	node.t = node.type;
	switch (node.type) {
		case 0: {
			const resource = node;
			minify(resource.body);
			resource.b = resource.body;
			delete resource.body;
			break;
		}
		case 1: {
			const plural = node;
			const cases = plural.cases;
			for (let i = 0; i < cases.length; i++) minify(cases[i]);
			plural.c = cases;
			delete plural.cases;
			break;
		}
		case 2: {
			const message = node;
			const items = message.items;
			for (let i = 0; i < items.length; i++) minify(items[i]);
			message.i = items;
			delete message.items;
			if (message.static) {
				message.s = message.static;
				delete message.static;
			}
			break;
		}
		case 3:
		case 9:
		case 8:
		case 7: {
			const valueNode = node;
			if (valueNode.value) {
				valueNode.v = valueNode.value;
				delete valueNode.value;
			}
			break;
		}
		case 6: {
			const linked = node;
			minify(linked.key);
			linked.k = linked.key;
			delete linked.key;
			if (linked.modifier) {
				minify(linked.modifier);
				linked.m = linked.modifier;
				delete linked.modifier;
			}
			break;
		}
		case 5: {
			const list = node;
			list.i = list.index;
			delete list.index;
			break;
		}
		case 4: {
			const named = node;
			named.k = named.key;
			delete named.key;
			break;
		}
	}
	delete node.type;
}
function createCodeGenerator(ast, options) {
	const { filename, breakLineCode, needIndent: _needIndent } = options;
	const location = options.location !== false;
	const _context = {
		filename,
		code: "",
		column: 1,
		line: 1,
		offset: 0,
		map: void 0,
		breakLineCode,
		needIndent: _needIndent,
		indentLevel: 0
	};
	if (location && ast.loc) _context.source = ast.loc.source;
	const context = () => _context;
	function push(code, node) {
		_context.code += code;
	}
	function _newline(n, withBreakLine = true) {
		const _breakLineCode = withBreakLine ? breakLineCode : "";
		push(_needIndent ? _breakLineCode + `  `.repeat(n) : _breakLineCode);
	}
	function indent(withNewLine = true) {
		const level = ++_context.indentLevel;
		withNewLine && _newline(level);
	}
	function deindent(withNewLine = true) {
		const level = --_context.indentLevel;
		withNewLine && _newline(level);
	}
	function newline() {
		_newline(_context.indentLevel);
	}
	const helper = (key) => `_${key}`;
	const needIndent = () => _context.needIndent;
	return {
		context,
		push,
		indent,
		deindent,
		newline,
		helper,
		needIndent
	};
}
function generateLinkedNode(generator, node) {
	const { helper } = generator;
	generator.push(`${helper("linked")}(`);
	generateNode(generator, node.key);
	if (node.modifier) {
		generator.push(`, `);
		generateNode(generator, node.modifier);
		generator.push(`, _type`);
	} else generator.push(`, undefined, _type`);
	generator.push(`)`);
}
function generateMessageNode(generator, node) {
	const { helper, needIndent } = generator;
	generator.push(`${helper("normalize")}([`);
	generator.indent(needIndent());
	const length = node.items.length;
	for (let i = 0; i < length; i++) {
		generateNode(generator, node.items[i]);
		if (i === length - 1) break;
		generator.push(", ");
	}
	generator.deindent(needIndent());
	generator.push("])");
}
function generatePluralNode(generator, node) {
	const { helper, needIndent } = generator;
	if (node.cases.length > 1) {
		generator.push(`${helper("plural")}([`);
		generator.indent(needIndent());
		const length = node.cases.length;
		for (let i = 0; i < length; i++) {
			generateNode(generator, node.cases[i]);
			if (i === length - 1) break;
			generator.push(", ");
		}
		generator.deindent(needIndent());
		generator.push(`])`);
	}
}
function generateResource(generator, node) {
	if (node.body) generateNode(generator, node.body);
	else generator.push("null");
}
function generateNode(generator, node) {
	const { helper } = generator;
	switch (node.type) {
		case 0:
			generateResource(generator, node);
			break;
		case 1:
			generatePluralNode(generator, node);
			break;
		case 2:
			generateMessageNode(generator, node);
			break;
		case 6:
			generateLinkedNode(generator, node);
			break;
		case 8:
			generator.push(JSON.stringify(node.value), node);
			break;
		case 7:
			generator.push(JSON.stringify(node.value), node);
			break;
		case 5:
			generator.push(`${helper("interpolate")}(${helper("list")}(${node.index}))`, node);
			break;
		case 4:
			generator.push(`${helper("interpolate")}(${helper("named")}(${JSON.stringify(node.key)}))`, node);
			break;
		case 9:
			generator.push(JSON.stringify(node.value), node);
			break;
		case 3: generator.push(JSON.stringify(node.value), node);
	}
}
var generate = (ast, options = {}) => {
	const mode = isString(options.mode) ? options.mode : "normal";
	const filename = isString(options.filename) ? options.filename : "message.intl";
	options.sourceMap;
	const breakLineCode = options.breakLineCode != null ? options.breakLineCode : mode === "arrow" ? ";" : "\n";
	const needIndent = options.needIndent ? options.needIndent : mode !== "arrow";
	const helpers = ast.helpers || [];
	const generator = createCodeGenerator(ast, {
		filename,
		breakLineCode,
		needIndent
	});
	generator.push(mode === "normal" ? `function __msg__ (ctx) {` : `(ctx) => {`);
	generator.indent(needIndent);
	if (helpers.length > 0) {
		generator.push(`const { ${join(helpers.map((s) => `${s}: _${s}`), ", ")} } = ctx`);
		generator.newline();
	}
	generator.push(`return `);
	generateNode(generator, ast);
	generator.deindent(needIndent);
	generator.push(`}`);
	delete ast.helpers;
	const { code, map } = generator.context();
	return {
		ast,
		code,
		map: map ? map.toJSON() : void 0
	};
};
function baseCompile$1(source, options = {}) {
	const assignedOptions = assign({}, options);
	const jit = !!assignedOptions.jit;
	const enalbeMinify = !!assignedOptions.minify;
	const enambeOptimize = assignedOptions.optimize == null ? true : assignedOptions.optimize;
	const ast = createParser(assignedOptions).parse(source);
	if (!jit) {
		transform(ast, assignedOptions);
		return generate(ast, assignedOptions);
	} else {
		enambeOptimize && optimize(ast);
		enalbeMinify && minify(ast);
		return {
			ast,
			code: ""
		};
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@intlify+core-base@11.4.8/node_modules/@intlify/core-base/dist/core-base.mjs
/*!
* core-base v11.4.8
* (c) 2026 kazuya kawaguchi
* Released under the MIT License.
*/
/**
* This is only called in esm-bundler builds.
* istanbul-ignore-next
*/
function initFeatureFlags$1() {
	if (typeof __INTLIFY_PROD_DEVTOOLS__ !== "boolean") getGlobalThis().__INTLIFY_PROD_DEVTOOLS__ = false;
	if (typeof __INTLIFY_DROP_MESSAGE_COMPILER__ !== "boolean") getGlobalThis().__INTLIFY_DROP_MESSAGE_COMPILER__ = false;
}
function isMessageAST(val) {
	return isObject(val) && resolveType(val) === 0 && (hasOwn(val, "b") || hasOwn(val, "body"));
}
var PROPS_BODY = ["b", "body"];
function resolveBody(node) {
	return resolveProps(node, PROPS_BODY);
}
var PROPS_CASES = ["c", "cases"];
function resolveCases(node) {
	return resolveProps(node, PROPS_CASES, []);
}
var PROPS_STATIC = ["s", "static"];
function resolveStatic(node) {
	return resolveProps(node, PROPS_STATIC);
}
var PROPS_ITEMS = ["i", "items"];
function resolveItems(node) {
	return resolveProps(node, PROPS_ITEMS, []);
}
var PROPS_TYPE = ["t", "type"];
function resolveType(node) {
	return resolveProps(node, PROPS_TYPE);
}
var PROPS_VALUE = ["v", "value"];
function resolveValue$1(node, type) {
	const resolved = resolveProps(node, PROPS_VALUE);
	if (resolved != null) return resolved;
	else throw createUnhandleNodeError(type);
}
var PROPS_MODIFIER = ["m", "modifier"];
function resolveLinkedModifier(node) {
	return resolveProps(node, PROPS_MODIFIER);
}
var PROPS_KEY = ["k", "key"];
function resolveLinkedKey(node) {
	const resolved = resolveProps(node, PROPS_KEY);
	if (resolved) return resolved;
	else throw createUnhandleNodeError(6);
}
function resolveProps(node, props, defaultValue) {
	for (let i = 0; i < props.length; i++) {
		const prop = props[i];
		if (hasOwn(node, prop) && node[prop] != null) return node[prop];
	}
	return defaultValue;
}
var AST_NODE_PROPS_KEYS = [
	...PROPS_BODY,
	...PROPS_CASES,
	...PROPS_STATIC,
	...PROPS_ITEMS,
	...PROPS_KEY,
	...PROPS_MODIFIER,
	...PROPS_VALUE,
	...PROPS_TYPE
];
function createUnhandleNodeError(type) {
	return /* @__PURE__ */ new Error(`unhandled node type: ${type}`);
}
function format(ast) {
	const msg = (ctx) => formatParts(ctx, ast);
	return msg;
}
function formatParts(ctx, ast) {
	const body = resolveBody(ast);
	if (body == null) throw createUnhandleNodeError(0);
	if (resolveType(body) === 1) {
		const cases = resolveCases(body);
		return ctx.plural(cases.reduce((messages, c) => [...messages, formatMessageParts(ctx, c)], []));
	} else return formatMessageParts(ctx, body);
}
function formatMessageParts(ctx, node) {
	const static_ = resolveStatic(node);
	if (static_ != null) return ctx.type === "text" ? static_ : ctx.normalize([static_]);
	else {
		const messages = resolveItems(node).reduce((acm, c) => [...acm, formatMessagePart(ctx, c)], []);
		return ctx.normalize(messages);
	}
}
function formatMessagePart(ctx, node) {
	const type = resolveType(node);
	switch (type) {
		case 3: return resolveValue$1(node, type);
		case 9: return resolveValue$1(node, type);
		case 4: {
			const named = node;
			if (hasOwn(named, "k") && named.k) return ctx.interpolate(ctx.named(named.k));
			if (hasOwn(named, "key") && named.key) return ctx.interpolate(ctx.named(named.key));
			throw createUnhandleNodeError(type);
		}
		case 5: {
			const list = node;
			if (hasOwn(list, "i") && isNumber(list.i)) return ctx.interpolate(ctx.list(list.i));
			if (hasOwn(list, "index") && isNumber(list.index)) return ctx.interpolate(ctx.list(list.index));
			throw createUnhandleNodeError(type);
		}
		case 6: {
			const linked = node;
			const modifier = resolveLinkedModifier(linked);
			const key = resolveLinkedKey(linked);
			return ctx.linked(formatMessagePart(ctx, key), modifier ? formatMessagePart(ctx, modifier) : void 0, ctx.type);
		}
		case 7: return resolveValue$1(node, type);
		case 8: return resolveValue$1(node, type);
		default: throw new Error(`unhandled node on format message part: ${type}`);
	}
}
var defaultOnCacheKey = (message) => message;
var compileCache = create();
function baseCompile(message, options = {}) {
	let detectError = false;
	const onError = options.onError || defaultOnError;
	options.onError = (err) => {
		detectError = true;
		onError(err);
	};
	return {
		...baseCompile$1(message, options),
		detectError
	};
}
/* #__NO_SIDE_EFFECTS__ */
function compile(message, context) {
	if (!__INTLIFY_DROP_MESSAGE_COMPILER__ && isString(message)) {
		isBoolean(context.warnHtmlMessage) && context.warnHtmlMessage;
		const cacheKey = (context.onCacheKey || defaultOnCacheKey)(message);
		const cached = compileCache[cacheKey];
		if (cached) return cached;
		const { ast, detectError } = baseCompile(message, {
			...context,
			location: false,
			jit: true
		});
		const msg = format(ast);
		return !detectError ? compileCache[cacheKey] = msg : msg;
	} else {
		const cacheKey = message.cacheKey;
		if (cacheKey) {
			const cached = compileCache[cacheKey];
			if (cached) return cached;
			return compileCache[cacheKey] = format(message);
		} else return format(message);
	}
}
var devtools = null;
function setDevToolsHook(hook) {
	devtools = hook;
}
function initI18nDevTools(i18n, version, meta) {
	devtools && devtools.emit("i18n:init", {
		timestamp: Date.now(),
		i18n,
		version,
		meta
	});
}
var translateDevTools = /* #__PURE__*/ createDevToolsHook("function:translate");
function createDevToolsHook(hook) {
	return (payloads) => devtools && devtools.emit(hook, payloads);
}
var CoreErrorCodes = {
	INVALID_ARGUMENT: 17,
	INVALID_DATE_ARGUMENT: 18,
	INVALID_ISO_DATE_ARGUMENT: 19,
	NOT_SUPPORT_NON_STRING_MESSAGE: 20,
	NOT_SUPPORT_LOCALE_PROMISE_VALUE: 21,
	NOT_SUPPORT_LOCALE_ASYNC_FUNCTION: 22,
	NOT_SUPPORT_LOCALE_TYPE: 23
};
function createCoreError(code) {
	return createCompileError(code, null, void 0);
}
CoreErrorCodes.INVALID_ARGUMENT, CoreErrorCodes.INVALID_DATE_ARGUMENT, CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT, CoreErrorCodes.NOT_SUPPORT_NON_STRING_MESSAGE, CoreErrorCodes.NOT_SUPPORT_LOCALE_PROMISE_VALUE, CoreErrorCodes.NOT_SUPPORT_LOCALE_ASYNC_FUNCTION, CoreErrorCodes.NOT_SUPPORT_LOCALE_TYPE;
/** @internal */
function getLocale(context, options) {
	return options.locale != null ? resolveLocale(options.locale) : resolveLocale(context.locale);
}
var _resolveLocale;
/** @internal */
function resolveLocale(locale) {
	if (isString(locale)) return locale;
	else if (isFunction(locale)) if (locale.resolvedOnce && _resolveLocale != null) return _resolveLocale;
	else if (locale.constructor.name === "Function") {
		const resolve = locale();
		if (isPromise(resolve)) throw createCoreError(CoreErrorCodes.NOT_SUPPORT_LOCALE_PROMISE_VALUE);
		return _resolveLocale = resolve;
	} else throw createCoreError(CoreErrorCodes.NOT_SUPPORT_LOCALE_ASYNC_FUNCTION);
	else throw createCoreError(CoreErrorCodes.NOT_SUPPORT_LOCALE_TYPE);
}
/**
* Fallback with simple implemenation
*
* @remarks
* A fallback locale function implemented with a simple fallback algorithm.
*
* Basically, it returns the value as specified in the `fallbackLocale` props, and is processed with the fallback inside intlify.
*
* @param ctx - A {@link CoreContext | context}
* @param fallback - A {@link FallbackLocale | fallback locale}
* @param start - A starting {@link Locale | locale}
*
* @returns Fallback locales
*
* @VueI18nGeneral
*/
function fallbackWithSimple(ctx, fallback, start) {
	return [.../* @__PURE__ */ new Set([start, ...isArray(fallback) ? fallback : isObject(fallback) ? Object.keys(fallback) : isString(fallback) ? [fallback] : [start]])];
}
/**
* Fallback with locale chain
*
* @remarks
* A fallback locale function implemented with a fallback chain algorithm. It's used in VueI18n as default.
*
* @param ctx - A {@link CoreContext | context}
* @param fallback - A {@link FallbackLocale | fallback locale}
* @param start - A starting {@link Locale | locale}
*
* @returns Fallback locales
*
* @VueI18nSee [Fallbacking](../guide/essentials/fallback)
*
* @VueI18nGeneral
*/
function fallbackWithLocaleChain(ctx, fallback, start) {
	const startLocale = isString(start) ? start : DEFAULT_LOCALE;
	const context = ctx;
	if (!context.__localeChainCache) context.__localeChainCache = /* @__PURE__ */ new Map();
	let chain = context.__localeChainCache.get(startLocale);
	if (!chain) {
		chain = [];
		let block = [start];
		while (isArray(block)) block = appendBlockToChain(chain, block, fallback);
		const defaults = isArray(fallback) || !isPlainObject(fallback) ? fallback : fallback["default"] ? fallback["default"] : null;
		block = isString(defaults) ? [defaults] : defaults;
		if (isArray(block)) appendBlockToChain(chain, block, false);
		context.__localeChainCache.set(startLocale, chain);
	}
	return chain;
}
function appendBlockToChain(chain, block, blocks) {
	let follow = true;
	for (let i = 0; i < block.length && isBoolean(follow); i++) {
		const locale = block[i];
		if (isString(locale)) follow = appendLocaleToChain(chain, block[i], blocks);
	}
	return follow;
}
function appendLocaleToChain(chain, locale, blocks) {
	let follow;
	const tokens = locale.split("-");
	do {
		follow = appendItemToChain(chain, tokens.join("-"), blocks);
		tokens.splice(-1, 1);
	} while (tokens.length && follow === true);
	return follow;
}
function appendItemToChain(chain, target, blocks) {
	let follow = false;
	if (!chain.includes(target)) {
		follow = true;
		if (target) {
			follow = target[target.length - 1] !== "!";
			const locale = target.replace(/!/g, "");
			chain.push(locale);
			if ((isArray(blocks) || isPlainObject(blocks)) && blocks[locale]) follow = blocks[locale];
		}
	}
	return follow;
}
var pathStateMachine = [];
pathStateMachine[0] = {
	["w"]: [0],
	["i"]: [3, 0],
	["["]: [4],
	["o"]: [7]
};
pathStateMachine[1] = {
	["w"]: [1],
	["."]: [2],
	["["]: [4],
	["o"]: [7]
};
pathStateMachine[2] = {
	["w"]: [2],
	["i"]: [3, 0],
	["0"]: [3, 0]
};
pathStateMachine[3] = {
	["i"]: [3, 0],
	["0"]: [3, 0],
	["w"]: [1, 1],
	["."]: [2, 1],
	["["]: [4, 1],
	["o"]: [7, 1]
};
pathStateMachine[4] = {
	["'"]: [5, 0],
	["\""]: [6, 0],
	["["]: [4, 2],
	["]"]: [1, 3],
	["o"]: 8,
	["l"]: [4, 0]
};
pathStateMachine[5] = {
	["'"]: [4, 0],
	["o"]: 8,
	["l"]: [5, 0]
};
pathStateMachine[6] = {
	["\""]: [4, 0],
	["o"]: 8,
	["l"]: [6, 0]
};
/**
* Check if an expression is a literal value.
*/
var literalValueRE = /^\s?(?:true|false|-?[\d.]+|'[^']*'|"[^"]*")\s?$/;
function isLiteral(exp) {
	return literalValueRE.test(exp);
}
/**
* Strip quotes from a string
*/
function stripQuotes(str) {
	const a = str.charCodeAt(0);
	return a === str.charCodeAt(str.length - 1) && (a === 34 || a === 39) ? str.slice(1, -1) : str;
}
/**
* Determine the type of a character in a keypath.
*/
function getPathCharType(ch) {
	if (ch === void 0 || ch === null) return "o";
	switch (ch.charCodeAt(0)) {
		case 91:
		case 93:
		case 46:
		case 34:
		case 39: return ch;
		case 95:
		case 36:
		case 45: return "i";
		case 9:
		case 10:
		case 13:
		case 160:
		case 65279:
		case 8232:
		case 8233: return "w";
	}
	return "i";
}
/**
* Format a subPath, return its plain form if it is
* a literal string or number. Otherwise prepend the
* dynamic indicator (*).
*/
function formatSubPath(path) {
	const trimmed = path.trim();
	if (path.charAt(0) === "0" && isNaN(parseInt(path))) return false;
	return isLiteral(trimmed) ? stripQuotes(trimmed) : "*" + trimmed;
}
/**
* Parse a string path into an array of segments
*/
function parse(path) {
	const keys = [];
	let index = -1;
	let mode = 0;
	let subPathDepth = 0;
	let c;
	let key;
	let newChar;
	let type;
	let transition;
	let action;
	let typeMap;
	const actions = [];
	actions[0] = () => {
		if (key === void 0) key = newChar;
		else key += newChar;
	};
	actions[1] = () => {
		if (key !== void 0) {
			keys.push(key);
			key = void 0;
		}
	};
	actions[2] = () => {
		actions[0]();
		subPathDepth++;
	};
	actions[3] = () => {
		if (subPathDepth > 0) {
			subPathDepth--;
			mode = 4;
			actions[0]();
		} else {
			subPathDepth = 0;
			if (key === void 0) return false;
			key = formatSubPath(key);
			if (key === false) return false;
			else actions[1]();
		}
	};
	function maybeUnescapeQuote() {
		const nextChar = path[index + 1];
		if (mode === 5 && nextChar === "'" || mode === 6 && nextChar === "\"") {
			index++;
			newChar = "\\" + nextChar;
			actions[0]();
			return true;
		}
	}
	while (mode !== null) {
		index++;
		c = path[index];
		if (c === "\\" && maybeUnescapeQuote()) continue;
		type = getPathCharType(c);
		typeMap = pathStateMachine[mode];
		transition = typeMap[type] || typeMap["l"] || 8;
		if (transition === 8) return;
		mode = transition[0];
		if (transition[1] !== void 0) {
			action = actions[transition[1]];
			if (action) {
				newChar = c;
				if (action() === false) return;
			}
		}
		if (mode === 7) return keys;
	}
}
var cache = /* @__PURE__ */ new Map();
/**
* key-value message resolver
*
* @remarks
* Resolves messages with the key-value structure. Note that messages with a hierarchical structure such as objects cannot be resolved
*
* @param obj - A target object to be resolved with path
* @param path - A {@link Path | path} to resolve the value of message
*
* @returns A resolved {@link PathValue | path value}
*
* @VueI18nGeneral
*/
function resolveWithKeyValue(obj, path) {
	return isObject(obj) ? obj[path] : null;
}
/**
* message resolver
*
* @remarks
* Resolves messages. messages with a hierarchical structure such as objects can be resolved. This resolver is used in VueI18n as default.
*
* @param obj - A target object to be resolved with path
* @param path - A {@link Path | path} to resolve the value of message
*
* @returns A resolved {@link PathValue | path value}
*
* @VueI18nGeneral
*/
function resolveValue(obj, path) {
	if (!isObject(obj)) return null;
	let hit = cache.get(path);
	if (!hit) {
		hit = parse(path);
		if (hit) cache.set(path, hit);
	}
	if (!hit) return null;
	const len = hit.length;
	let last = obj;
	let i = 0;
	while (i < len) {
		const key = hit[i];
		/**
		* NOTE:
		* if `key` is intlify message format AST node key and `last` is intlify message format AST, skip it.
		* because the AST node is not a key-value structure.
		*/
		if (AST_NODE_PROPS_KEYS.includes(key) && isMessageAST(last)) return null;
		if (!isObject(last)) return null;
		if (!hasOwn(last, key)) return null;
		const val = last[key];
		if (val === void 0) return null;
		if (isFunction(last)) return null;
		last = val;
		i++;
	}
	return last;
}
var CoreWarnCodes = {
	NOT_FOUND_KEY: 1,
	FALLBACK_TO_TRANSLATE: 2,
	CANNOT_FORMAT_NUMBER: 3,
	FALLBACK_TO_NUMBER_FORMAT: 4,
	CANNOT_FORMAT_DATE: 5,
	FALLBACK_TO_DATE_FORMAT: 6,
	EXPERIMENTAL_CUSTOM_MESSAGE_COMPILER: 7,
	INVALID_NUMBER_ARGUMENT: 8,
	INVALID_DATE_ARGUMENT: 9
};
CoreWarnCodes.NOT_FOUND_KEY, CoreWarnCodes.FALLBACK_TO_TRANSLATE, CoreWarnCodes.CANNOT_FORMAT_NUMBER, CoreWarnCodes.FALLBACK_TO_NUMBER_FORMAT, CoreWarnCodes.CANNOT_FORMAT_DATE, CoreWarnCodes.FALLBACK_TO_DATE_FORMAT, CoreWarnCodes.EXPERIMENTAL_CUSTOM_MESSAGE_COMPILER, CoreWarnCodes.INVALID_NUMBER_ARGUMENT, CoreWarnCodes.INVALID_DATE_ARGUMENT;
/**
* Intlify core-base version
* @internal
*/
var VERSION$1 = "11.4.8";
var DEFAULT_LOCALE = "en-US";
var capitalize = (str) => `${str.charAt(0).toLocaleUpperCase()}${str.substr(1)}`;
function getDefaultLinkedModifiers() {
	return {
		upper: (val, type) => {
			return type === "text" && isString(val) ? val.toUpperCase() : type === "vnode" && isObject(val) && "__v_isVNode" in val ? val.children.toUpperCase() : val;
		},
		lower: (val, type) => {
			return type === "text" && isString(val) ? val.toLowerCase() : type === "vnode" && isObject(val) && "__v_isVNode" in val ? val.children.toLowerCase() : val;
		},
		capitalize: (val, type) => {
			return type === "text" && isString(val) ? capitalize(val) : type === "vnode" && isObject(val) && "__v_isVNode" in val ? capitalize(val.children) : val;
		}
	};
}
var _compiler;
function registerMessageCompiler(compiler) {
	_compiler = compiler;
}
var _resolver;
/**
* Register the message resolver
*
* @param resolver - A {@link MessageResolver} function
*
* @VueI18nGeneral
*/
function registerMessageResolver(resolver) {
	_resolver = resolver;
}
var _fallbacker;
/**
* Register the locale fallbacker
*
* @param fallbacker - A {@link LocaleFallbacker} function
*
* @VueI18nGeneral
*/
function registerLocaleFallbacker(fallbacker) {
	_fallbacker = fallbacker;
}
var _additionalMeta = null;
var getAdditionalMeta = /* @__NO_SIDE_EFFECTS__ */ () => _additionalMeta;
var _fallbackContext = null;
var setFallbackContext = (context) => {
	_fallbackContext = context;
};
var getFallbackContext = () => _fallbackContext;
var _cid = 0;
function createCoreContext(options = {}) {
	const onWarn = isFunction(options.onWarn) ? options.onWarn : warn;
	const version = isString(options.version) ? options.version : VERSION$1;
	const locale = isString(options.locale) || isFunction(options.locale) ? options.locale : DEFAULT_LOCALE;
	const _locale = isFunction(locale) ? DEFAULT_LOCALE : locale;
	const fallbackLocale = isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || isString(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : _locale;
	const messages = isPlainObject(options.messages) ? options.messages : createResources(_locale);
	const datetimeFormats = isPlainObject(options.datetimeFormats) ? options.datetimeFormats : createResources(_locale);
	const numberFormats = isPlainObject(options.numberFormats) ? options.numberFormats : createResources(_locale);
	const modifiers = assign(create(), options.modifiers, getDefaultLinkedModifiers());
	const pluralRules = options.pluralRules || create();
	const missing = isFunction(options.missing) ? options.missing : null;
	const missingWarn = isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
	const fallbackWarn = isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
	const fallbackFormat = !!options.fallbackFormat;
	const unresolving = !!options.unresolving;
	const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
	const processor = isPlainObject(options.processor) ? options.processor : null;
	const warnHtmlMessage = isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
	const escapeParameter = !!options.escapeParameter;
	const messageCompiler = isFunction(options.messageCompiler) ? options.messageCompiler : _compiler;
	const messageResolver = isFunction(options.messageResolver) ? options.messageResolver : _resolver || resolveWithKeyValue;
	const localeFallbacker = isFunction(options.localeFallbacker) ? options.localeFallbacker : _fallbacker || fallbackWithSimple;
	const fallbackContext = isObject(options.fallbackContext) ? options.fallbackContext : void 0;
	const internalOptions = options;
	const __datetimeFormatters = isObject(internalOptions.__datetimeFormatters) ? internalOptions.__datetimeFormatters : /* @__PURE__ */ new Map();
	const __numberFormatters = isObject(internalOptions.__numberFormatters) ? internalOptions.__numberFormatters : /* @__PURE__ */ new Map();
	const __meta = isObject(internalOptions.__meta) ? internalOptions.__meta : {};
	_cid++;
	const context = {
		version,
		cid: _cid,
		locale,
		fallbackLocale,
		messages,
		modifiers,
		pluralRules,
		missing,
		missingWarn,
		fallbackWarn,
		fallbackFormat,
		unresolving,
		postTranslation,
		processor,
		warnHtmlMessage,
		escapeParameter,
		messageCompiler,
		messageResolver,
		localeFallbacker,
		fallbackContext,
		onWarn,
		__meta
	};
	context.datetimeFormats = datetimeFormats;
	context.numberFormats = numberFormats;
	context.__datetimeFormatters = __datetimeFormatters;
	context.__numberFormatters = __numberFormatters;
	if (__INTLIFY_PROD_DEVTOOLS__) initI18nDevTools(context, version, __meta);
	return context;
}
var createResources = (locale) => ({ [locale]: create() });
/** @internal */
function handleMissing(context, key, locale, missingWarn, type) {
	const { missing, onWarn } = context;
	if (missing !== null) {
		const ret = missing(context, locale, key, type);
		return isString(ret) ? ret : key;
	} else return key;
}
/** @internal */
function updateFallbackLocale(ctx, locale, fallback) {
	const context = ctx;
	context.__localeChainCache = /* @__PURE__ */ new Map();
	ctx.localeFallbacker(ctx, fallback, locale);
}
/** @internal */
function isAlmostSameLocale(locale, compareLocale) {
	if (locale === compareLocale) return false;
	return locale.split("-")[0] === compareLocale.split("-")[0];
}
/** @internal */
function isImplicitFallback(targetLocale, locales) {
	const index = locales.indexOf(targetLocale);
	if (index === -1) return false;
	for (let i = index + 1; i < locales.length; i++) if (isAlmostSameLocale(targetLocale, locales[i])) return true;
	return false;
}
function resolveFormatLocale(context, key, locale, formats, missingWarn, fallbackWarn, type) {
	const { fallbackLocale, localeFallbacker, onWarn } = context;
	const locales = localeFallbacker(context, fallbackLocale, locale);
	for (let i = 0; i < locales.length; i++) {
		const targetLocale = locales[i];
		const format = (formats[targetLocale] || {})[key];
		if (isPlainObject(format) && isString(targetLocale)) return targetLocale;
		handleMissing(context, key, targetLocale, missingWarn, type);
	}
	return null;
}
function getFormatterCacheKey(locale, key, overrides) {
	let id = `${locale}__${key}`;
	if (isPlainObject(overrides) && !isEmptyObject(overrides)) id = `${id}__${JSON.stringify(overrides)}`;
	return id;
}
function clearFormatCache(formatters, locale, format) {
	for (const key in format) {
		const prefix = `${locale}__${key}`;
		for (const id of formatters.keys()) if (id === prefix || id.startsWith(`${prefix}__`)) formatters.delete(id);
	}
}
function parseFormatArgs(args, options, initialOverrides, optionsKeys) {
	const [, arg2, arg3, arg4] = args;
	let overrides = initialOverrides;
	if (isString(arg2)) options.key = arg2;
	else if (isPlainObject(arg2)) Object.keys(arg2).forEach((key) => {
		if (optionsKeys.includes(key)) overrides[key] = arg2[key];
		else options[key] = arg2[key];
	});
	if (isString(arg3)) options.locale = arg3;
	else if (isPlainObject(arg3)) overrides = arg3;
	if (isPlainObject(arg4)) overrides = arg4;
	return overrides;
}
var intlDefined = typeof Intl !== "undefined";
intlDefined && Intl.DateTimeFormat, intlDefined && Intl.NumberFormat;
function datetime(context, ...args) {
	const { datetimeFormats, unresolving, onWarn } = context;
	const { __datetimeFormatters } = context;
	if (!isString(args[0]) && !isDate(args[0]) && !isNumber(args[0])) return "";
	const [key, value, options, overrides] = parseDateTimeArgs(...args);
	const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
	const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
	const part = !!options.part;
	const locale = getLocale(context, options);
	if (!isString(key) || key === "") {
		const formatter = new Intl.DateTimeFormat(locale.replace(/!/g, ""), overrides);
		return !part ? formatter.format(value) : formatter.formatToParts(value);
	}
	const targetLocale = resolveFormatLocale(context, key, locale, datetimeFormats, missingWarn, fallbackWarn, "datetime format");
	if (!isString(targetLocale)) return unresolving ? -1 : key;
	const format = datetimeFormats[targetLocale][key];
	const id = getFormatterCacheKey(targetLocale, key, overrides);
	let formatter = __datetimeFormatters.get(id);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(targetLocale, assign({}, format, overrides));
		__datetimeFormatters.set(id, formatter);
	}
	return !part ? formatter.format(value) : formatter.formatToParts(value);
}
/** @internal */
var DATETIME_FORMAT_OPTIONS_KEYS = [
	"localeMatcher",
	"weekday",
	"era",
	"year",
	"month",
	"day",
	"hour",
	"minute",
	"second",
	"timeZoneName",
	"formatMatcher",
	"hour12",
	"timeZone",
	"dateStyle",
	"timeStyle",
	"calendar",
	"dayPeriod",
	"numberingSystem",
	"hourCycle",
	"fractionalSecondDigits"
];
/** @internal */
function parseDateTimeArgs(...args) {
	const [arg1] = args;
	const options = create();
	const initialOverrides = create();
	let value;
	if (isString(arg1)) {
		const matches = arg1.match(/(\d{4}-\d{2}-\d{2})(T|\s)?(.*)/);
		if (!matches) throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
		const dateTime = matches[3] ? matches[3].trim().startsWith("T") ? `${matches[1].trim()}${matches[3].trim()}` : `${matches[1].trim()}T${matches[3].trim()}` : matches[1].trim();
		value = new Date(dateTime);
		try {
			value.toISOString();
		} catch {
			throw createCoreError(CoreErrorCodes.INVALID_ISO_DATE_ARGUMENT);
		}
	} else if (isDate(arg1)) {
		if (isNaN(arg1.getTime())) throw createCoreError(CoreErrorCodes.INVALID_DATE_ARGUMENT);
		value = arg1;
	} else if (isNumber(arg1)) value = arg1;
	else throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
	const overrides = parseFormatArgs(args, options, initialOverrides, DATETIME_FORMAT_OPTIONS_KEYS);
	return [
		options.key || "",
		value,
		options,
		overrides
	];
}
/** @internal */
function clearDateTimeFormat(ctx, locale, format) {
	clearFormatCache(ctx.__datetimeFormatters, locale, format);
}
function number(context, ...args) {
	const { numberFormats, unresolving, onWarn } = context;
	const { __numberFormatters } = context;
	if (!isNumber(args[0])) return "";
	const [key, value, options, overrides] = parseNumberArgs(...args);
	const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
	const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
	const part = !!options.part;
	const locale = getLocale(context, options);
	if (!isString(key) || key === "") {
		const formatter = new Intl.NumberFormat(locale.replace(/!/g, ""), overrides);
		return !part ? formatter.format(value) : formatter.formatToParts(value);
	}
	const targetLocale = resolveFormatLocale(context, key, locale, numberFormats, missingWarn, fallbackWarn, "number format");
	if (!isString(targetLocale)) return unresolving ? -1 : key;
	const format = numberFormats[targetLocale][key];
	const id = getFormatterCacheKey(targetLocale, key, overrides);
	let formatter = __numberFormatters.get(id);
	if (!formatter) {
		formatter = new Intl.NumberFormat(targetLocale, assign({}, format, overrides));
		__numberFormatters.set(id, formatter);
	}
	return !part ? formatter.format(value) : formatter.formatToParts(value);
}
/** @internal */
var NUMBER_FORMAT_OPTIONS_KEYS = [
	"localeMatcher",
	"style",
	"currency",
	"currencyDisplay",
	"currencySign",
	"useGrouping",
	"minimumIntegerDigits",
	"minimumFractionDigits",
	"maximumFractionDigits",
	"minimumSignificantDigits",
	"maximumSignificantDigits",
	"compactDisplay",
	"notation",
	"signDisplay",
	"unit",
	"unitDisplay",
	"roundingMode",
	"roundingPriority",
	"roundingIncrement",
	"trailingZeroDisplay"
];
/** @internal */
function parseNumberArgs(...args) {
	const [arg1] = args;
	const options = create();
	const initialOverrides = create();
	if (!isNumber(arg1)) throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
	const value = arg1;
	const overrides = parseFormatArgs(args, options, initialOverrides, NUMBER_FORMAT_OPTIONS_KEYS);
	return [
		options.key || "",
		value,
		options,
		overrides
	];
}
/** @internal */
function clearNumberFormat(ctx, locale, format) {
	clearFormatCache(ctx.__numberFormatters, locale, format);
}
var DEFAULT_MODIFIER = (str) => str;
var DEFAULT_MESSAGE = (ctx) => "";
var DEFAULT_MESSAGE_DATA_TYPE = "text";
var DEFAULT_NORMALIZE = (values) => values.length === 0 ? "" : join(values);
var DEFAULT_INTERPOLATE = toDisplayString;
function pluralDefault(choice, choicesLength) {
	choice = Math.abs(choice);
	if (choicesLength === 2) return choice === 1 ? 0 : 1;
	return Math.min(choice, 2);
}
function getPluralIndex(options) {
	const index = isNumber(options.pluralIndex) ? options.pluralIndex : -1;
	return isNumber(options.named?.count) ? options.named.count : isNumber(options.named?.n) ? options.named.n : index;
}
function createMessageContext(options = {}) {
	const locale = options.locale;
	const pluralIndex = getPluralIndex(options);
	const pluralRule = isString(locale) && isFunction(options.pluralRules?.[locale]) ? options.pluralRules[locale] : pluralDefault;
	const orgPluralRule = pluralRule === pluralDefault ? void 0 : pluralDefault;
	const plural = (messages) => messages[pluralRule(pluralIndex, messages.length, orgPluralRule)];
	const _list = options.list || [];
	const list = (index) => _list[index];
	const _named = options.named || create();
	if (isNumber(options.pluralIndex)) {
		_named.count ||= options.pluralIndex;
		_named.n ||= options.pluralIndex;
	}
	const named = (key) => _named[key];
	function message(key, useLinked) {
		const msg = isFunction(options.messages) ? options.messages(key, !!useLinked) : isObject(options.messages) ? options.messages[key] : false;
		return !msg ? options.parent ? options.parent.message(key) : DEFAULT_MESSAGE : msg;
	}
	const _modifier = (name) => options.modifiers ? options.modifiers[name] : DEFAULT_MODIFIER;
	const normalize = isFunction(options.processor?.normalize) ? options.processor.normalize : DEFAULT_NORMALIZE;
	const interpolate = isFunction(options.processor?.interpolate) ? options.processor.interpolate : DEFAULT_INTERPOLATE;
	const type = isString(options.processor?.type) ? options.processor.type : DEFAULT_MESSAGE_DATA_TYPE;
	const linked = (key, ...args) => {
		const [arg1, arg2] = args;
		let type = "text";
		let modifier = "";
		if (args.length === 1) {
			if (isObject(arg1)) {
				modifier = arg1.modifier || modifier;
				type = arg1.type || type;
			} else if (isString(arg1)) modifier = arg1 || modifier;
		} else if (args.length === 2) {
			if (isString(arg1)) modifier = arg1 || modifier;
			if (isString(arg2)) type = arg2 || type;
		}
		const ret = message(key, true)(ctx);
		const resolved = ret === "" || ret === void 0 ? key : ret;
		const msg = type === "vnode" && isArray(resolved) && modifier ? resolved[0] : resolved;
		return modifier ? _modifier(modifier)(msg, type) : msg;
	};
	const ctx = {
		["list"]: list,
		["named"]: named,
		["plural"]: plural,
		["linked"]: linked,
		["message"]: message,
		["type"]: type,
		["interpolate"]: interpolate,
		["normalize"]: normalize,
		["values"]: assign(create(), _list, _named)
	};
	return ctx;
}
var NOOP_MESSAGE_FUNCTION = () => "";
var isMessageFunction = (val) => isFunction(val);
function translate(context, ...args) {
	const { fallbackFormat, postTranslation, unresolving, messageCompiler, fallbackLocale, messages } = context;
	const [key, options] = parseTranslateArgs(...args);
	const missingWarn = isBoolean(options.missingWarn) ? options.missingWarn : context.missingWarn;
	const fallbackWarn = isBoolean(options.fallbackWarn) ? options.fallbackWarn : context.fallbackWarn;
	const escapeParameter = isBoolean(options.escapeParameter) ? options.escapeParameter : context.escapeParameter;
	const resolvedMessage = !!options.resolvedMessage;
	const defaultMsgOrKey = isString(options.default) || isBoolean(options.default) ? !isBoolean(options.default) ? options.default : !messageCompiler ? () => key : key : fallbackFormat ? !messageCompiler ? () => key : key : null;
	const enableDefaultMsg = fallbackFormat || defaultMsgOrKey != null && (isString(defaultMsgOrKey) || isFunction(defaultMsgOrKey));
	const locale = getLocale(context, options);
	escapeParameter && escapeParams(options);
	let [formatScope, targetLocale, message] = !resolvedMessage ? resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) : [
		key,
		locale,
		messages[locale] || create()
	];
	let format = formatScope;
	let cacheBaseKey = key;
	if (!resolvedMessage && !(isString(format) || isMessageAST(format) || isMessageFunction(format))) {
		if (enableDefaultMsg) {
			format = defaultMsgOrKey;
			cacheBaseKey = format;
		}
	}
	if (!resolvedMessage && (!(isString(format) || isMessageAST(format) || isMessageFunction(format)) || !isString(targetLocale))) return unresolving ? -1 : key;
	let occurred = false;
	const onError = () => {
		occurred = true;
	};
	const msg = !isMessageFunction(format) ? compileMessageFormat(context, key, targetLocale, format, cacheBaseKey, onError) : format;
	if (occurred) return format;
	const messaged = evaluateMessage(context, msg, createMessageContext(getMessageContextOptions(context, targetLocale, message, options)));
	let ret = postTranslation ? postTranslation(messaged, key) : messaged;
	if (escapeParameter && isString(ret)) ret = sanitizeTranslatedHtml(ret);
	if (__INTLIFY_PROD_DEVTOOLS__) {
		const payloads = {
			timestamp: Date.now(),
			key: isString(key) ? key : isMessageFunction(format) ? format.key : "",
			locale: targetLocale || (isMessageFunction(format) ? format.locale : ""),
			format: isString(format) ? format : isMessageFunction(format) ? format.source : "",
			message: ret
		};
		payloads.meta = assign({}, context.__meta, /* @__PURE__ */ getAdditionalMeta() || {});
		translateDevTools(payloads);
	}
	return ret;
}
function escapeParams(options) {
	if (isArray(options.list)) options.list = options.list.map((item) => isString(item) ? escapeHtml(item) : item);
	else if (isObject(options.named)) Object.keys(options.named).forEach((key) => {
		if (isString(options.named[key])) options.named[key] = escapeHtml(options.named[key]);
	});
}
function resolveMessageFormat(context, key, locale, fallbackLocale, fallbackWarn, missingWarn) {
	const { messages, onWarn, messageResolver: resolveValue, localeFallbacker } = context;
	const locales = localeFallbacker(context, fallbackLocale, locale);
	let message = create();
	let targetLocale;
	let format = null;
	const type = "translate";
	for (let i = 0; i < locales.length; i++) {
		targetLocale = locales[i];
		message = messages[targetLocale] || create();
		if ((format = resolveValue(message, key)) === null) format = message[key];
		if (isString(format) || isMessageAST(format) || isMessageFunction(format)) break;
		if (!isImplicitFallback(targetLocale, locales)) {
			const missingRet = handleMissing(context, key, targetLocale, missingWarn, type);
			if (missingRet !== key) format = missingRet;
		}
	}
	return [
		format,
		targetLocale,
		message
	];
}
function compileMessageFormat(context, key, targetLocale, format, cacheBaseKey, onError) {
	const { messageCompiler, warnHtmlMessage } = context;
	if (isMessageFunction(format)) {
		const msg = format;
		msg.locale = msg.locale || targetLocale;
		msg.key = msg.key || key;
		return msg;
	}
	if (messageCompiler == null) {
		const msg = (() => format);
		msg.locale = targetLocale;
		msg.key = key;
		return msg;
	}
	const msg = messageCompiler(format, getCompileContext(context, targetLocale, cacheBaseKey, format, warnHtmlMessage, onError));
	msg.locale = targetLocale;
	msg.key = key;
	msg.source = format;
	return msg;
}
function evaluateMessage(context, msg, msgCtx) {
	return msg(msgCtx);
}
/** @internal */
function parseTranslateArgs(...args) {
	const [arg1, arg2, arg3] = args;
	const options = create();
	if (!isString(arg1) && !isNumber(arg1) && !isMessageFunction(arg1) && !isMessageAST(arg1)) throw createCoreError(CoreErrorCodes.INVALID_ARGUMENT);
	const key = isNumber(arg1) ? String(arg1) : isMessageFunction(arg1) ? arg1 : arg1;
	if (isNumber(arg2)) options.plural = arg2;
	else if (isString(arg2)) options.default = arg2;
	else if (isPlainObject(arg2) && !isEmptyObject(arg2)) options.named = arg2;
	else if (isArray(arg2)) options.list = arg2;
	if (isNumber(arg3)) options.plural = arg3;
	else if (isString(arg3)) options.default = arg3;
	else if (isPlainObject(arg3)) assign(options, arg3);
	return [key, options];
}
function getCompileContext(context, locale, key, source, warnHtmlMessage, onError) {
	return {
		locale,
		key,
		warnHtmlMessage,
		onError: (err) => {
			onError && onError(err);
			throw err;
		},
		onCacheKey: (source) => generateFormatCacheKey(locale, key, source)
	};
}
function getMessageContextOptions(context, locale, message, options) {
	const { modifiers, pluralRules, messageResolver: resolveValue, fallbackLocale, fallbackWarn, missingWarn, fallbackContext } = context;
	const resolveMessage = (key, useLinked) => {
		let val = resolveValue(message, key);
		if (val == null && (fallbackContext || useLinked)) {
			const [format, , message] = resolveMessageFormat(fallbackContext || context, key, locale, fallbackLocale, fallbackWarn, missingWarn);
			val = format ?? resolveValue(message, key);
		}
		if (isString(val) || isMessageAST(val)) {
			let occurred = false;
			const onError = () => {
				occurred = true;
			};
			const msg = compileMessageFormat(context, key, locale, val, key, onError);
			return !occurred ? msg : NOOP_MESSAGE_FUNCTION;
		} else if (isMessageFunction(val)) return val;
		else return NOOP_MESSAGE_FUNCTION;
	};
	const ctxOptions = {
		locale,
		modifiers,
		pluralRules,
		messages: resolveMessage
	};
	if (context.processor) ctxOptions.processor = context.processor;
	if (options.list) ctxOptions.list = options.list;
	if (options.named) ctxOptions.named = options.named;
	if (isNumber(options.plural)) ctxOptions.pluralIndex = options.plural;
	return ctxOptions;
}
initFeatureFlags$1();
//#endregion
//#region ../../node_modules/.pnpm/vue-i18n@11.4.8_vue@3.5.40_typescript@5.9.3_/node_modules/vue-i18n/dist/vue-i18n.mjs
/*!
* vue-i18n v11.4.8
* (c) 2026 kazuya kawaguchi
* Released under the MIT License.
*/
/**
* Vue I18n Version
*
* @remarks
* Semver format. Same format as the package.json `version` field.
*
* @VueI18nGeneral
*/
var VERSION = "11.4.8";
/**
* This is only called in esm-bundler builds.
* istanbul-ignore-next
*/
function initFeatureFlags() {
	if (typeof __VUE_I18N_FULL_INSTALL__ !== "boolean") getGlobalThis().__VUE_I18N_FULL_INSTALL__ = true;
	if (typeof __VUE_I18N_LEGACY_API__ !== "boolean") getGlobalThis().__VUE_I18N_LEGACY_API__ = true;
	if (typeof __INTLIFY_DROP_MESSAGE_COMPILER__ !== "boolean") getGlobalThis().__INTLIFY_DROP_MESSAGE_COMPILER__ = false;
	if (typeof __INTLIFY_PROD_DEVTOOLS__ !== "boolean") getGlobalThis().__INTLIFY_PROD_DEVTOOLS__ = false;
}
var I18nErrorCodes = {
	UNEXPECTED_RETURN_TYPE: 24,
	INVALID_ARGUMENT: 25,
	MUST_BE_CALL_SETUP_TOP: 26,
	NOT_INSTALLED: 27,
	REQUIRED_VALUE: 28,
	INVALID_VALUE: 29,
	CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN: 30,
	NOT_INSTALLED_WITH_PROVIDE: 31,
	UNEXPECTED_ERROR: 32,
	NOT_COMPATIBLE_LEGACY_VUE_I18N: 33,
	NOT_AVAILABLE_COMPOSITION_IN_LEGACY: 34
};
function createI18nError(code, ...args) {
	return createCompileError(code, null, void 0);
}
I18nErrorCodes.UNEXPECTED_RETURN_TYPE, I18nErrorCodes.INVALID_ARGUMENT, I18nErrorCodes.MUST_BE_CALL_SETUP_TOP, I18nErrorCodes.NOT_INSTALLED, I18nErrorCodes.UNEXPECTED_ERROR, I18nErrorCodes.REQUIRED_VALUE, I18nErrorCodes.INVALID_VALUE, I18nErrorCodes.CANNOT_SETUP_VUE_DEVTOOLS_PLUGIN, I18nErrorCodes.NOT_INSTALLED_WITH_PROVIDE, I18nErrorCodes.NOT_COMPATIBLE_LEGACY_VUE_I18N, I18nErrorCodes.NOT_AVAILABLE_COMPOSITION_IN_LEGACY;
var TranslateVNodeSymbol = /* #__PURE__*/ makeSymbol("__translateVNode");
var DatetimePartsSymbol = /* #__PURE__*/ makeSymbol("__datetimeParts");
var NumberPartsSymbol = /* #__PURE__*/ makeSymbol("__numberParts");
var SetPluralRulesSymbol = makeSymbol("__setPluralRules");
makeSymbol("__intlifyMeta");
var InejctWithOptionSymbol = /* #__PURE__*/ makeSymbol("__injectWithOption");
var DisposeSymbol = /* #__PURE__*/ makeSymbol("__dispose");
var I18nWarnCodes = {
	FALLBACK_TO_ROOT: 10,
	NOT_FOUND_PARENT_SCOPE: 11,
	IGNORE_OBJ_FLATTEN: 12,
	/**
	* @deprecated will be removed at vue-i18n v12
	*/
	DEPRECATE_LEGACY_MODE: 13,
	/**
	* @deprecated will be removed at vue-i18n v12
	*/
	DEPRECATE_TRANSLATE_CUSTOME_DIRECTIVE: 14,
	DUPLICATE_USE_I18N_CALLING: 15
};
I18nWarnCodes.FALLBACK_TO_ROOT, I18nWarnCodes.NOT_FOUND_PARENT_SCOPE, I18nWarnCodes.IGNORE_OBJ_FLATTEN, I18nWarnCodes.DEPRECATE_LEGACY_MODE, I18nWarnCodes.DEPRECATE_TRANSLATE_CUSTOME_DIRECTIVE, I18nWarnCodes.DUPLICATE_USE_I18N_CALLING;
/**
* Transform flat json in obj to normal json in obj
*/
function handleFlatJson(obj) {
	if (!isObject(obj)) return obj;
	if (isMessageAST(obj)) return obj;
	for (const key in obj) {
		if (!hasOwn(obj, key)) continue;
		if (!key.includes(".")) {
			if (isObject(obj[key])) handleFlatJson(obj[key]);
		} else {
			const subKeys = key.split(".");
			const lastIndex = subKeys.length - 1;
			let currentObj = obj;
			let hasStringValue = false;
			for (let i = 0; i < lastIndex; i++) {
				if (subKeys[i] === "__proto__") throw new Error(`unsafe key: ${subKeys[i]}`);
				if (!(subKeys[i] in currentObj)) currentObj[subKeys[i]] = create();
				if (!isObject(currentObj[subKeys[i]])) {
					hasStringValue = true;
					break;
				}
				currentObj = currentObj[subKeys[i]];
			}
			if (!hasStringValue) {
				if (!isMessageAST(currentObj)) {
					currentObj[subKeys[lastIndex]] = obj[key];
					delete obj[key];
				} else if (!AST_NODE_PROPS_KEYS.includes(subKeys[lastIndex])) delete obj[key];
			}
			if (!isMessageAST(currentObj)) {
				const target = currentObj[subKeys[lastIndex]];
				if (isObject(target)) handleFlatJson(target);
			}
		}
	}
	return obj;
}
function getLocaleMessages(locale, options) {
	const { messages, __i18n, messageResolver, flatJson } = options;
	const ret = isPlainObject(messages) ? messages : isArray(__i18n) ? create() : { [locale]: create() };
	if (isArray(__i18n)) __i18n.forEach((custom) => {
		if ("locale" in custom && "resource" in custom) {
			const { locale, resource } = custom;
			if (locale) {
				ret[locale] = ret[locale] || create();
				deepCopy(resource, ret[locale]);
			} else deepCopy(resource, ret);
		} else isString(custom) && deepCopy(JSON.parse(custom), ret);
	});
	if (messageResolver == null && flatJson) {
		for (const key in ret) if (hasOwn(ret, key)) handleFlatJson(ret[key]);
	}
	return ret;
}
function getComponentOptions(instance) {
	return instance.type;
}
function adjustI18nResources(gl, options, componentOptions) {
	let messages = isObject(options.messages) ? options.messages : create();
	if ("__i18nGlobal" in componentOptions) messages = getLocaleMessages(gl.locale.value, {
		messages,
		__i18n: componentOptions.__i18nGlobal
	});
	const locales = Object.keys(messages);
	if (locales.length) locales.forEach((locale) => {
		gl.mergeLocaleMessage(locale, messages[locale]);
	});
	if (isObject(options.datetimeFormats)) {
		const locales = Object.keys(options.datetimeFormats);
		if (locales.length) locales.forEach((locale) => {
			gl.mergeDateTimeFormat(locale, options.datetimeFormats[locale]);
		});
	}
	if (isObject(options.numberFormats)) {
		const locales = Object.keys(options.numberFormats);
		if (locales.length) locales.forEach((locale) => {
			gl.mergeNumberFormat(locale, options.numberFormats[locale]);
		});
	}
}
function createTextNode(key) {
	return createVNode(Text, null, key, 0);
}
function getCurrentInstance() {
	const key = "currentInstance";
	if (key in vue_runtime_esm_bundler_exports) return vue_runtime_esm_bundler_exports[key];
	else return getCurrentInstance$1();
}
var NOOP_RETURN_ARRAY = () => [];
var NOOP_RETURN_FALSE = () => false;
var composerID = 0;
function defineCoreMissingHandler(missing) {
	return ((ctx, locale, key, type) => {
		return missing(locale, key, getCurrentInstance() || void 0, type);
	});
}
/**
* Create composer interface factory
*
* @internal
*/
function createComposer(options = {}) {
	const { __root, __injectWithOption } = options;
	const _isGlobal = __root === void 0;
	const flatJson = options.flatJson;
	const _ref = inBrowser ? ref : shallowRef;
	let _inheritLocale = isBoolean(options.inheritLocale) ? options.inheritLocale : true;
	const _locale = _ref(__root && _inheritLocale ? __root.locale.value : isString(options.locale) ? options.locale : DEFAULT_LOCALE);
	const _fallbackLocale = _ref(__root && _inheritLocale ? __root.fallbackLocale.value : isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : _locale.value);
	const _messages = _ref(getLocaleMessages(_locale.value, options));
	const _datetimeFormats = _ref(isPlainObject(options.datetimeFormats) ? options.datetimeFormats : { [_locale.value]: {} });
	const _numberFormats = _ref(isPlainObject(options.numberFormats) ? options.numberFormats : { [_locale.value]: {} });
	let _missingWarn = __root ? __root.missingWarn : isBoolean(options.missingWarn) || isRegExp(options.missingWarn) ? options.missingWarn : true;
	let _fallbackWarn = __root ? __root.fallbackWarn : isBoolean(options.fallbackWarn) || isRegExp(options.fallbackWarn) ? options.fallbackWarn : true;
	let _fallbackRoot = __root ? __root.fallbackRoot : isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
	let _fallbackFormat = !!options.fallbackFormat;
	let _missing = isFunction(options.missing) ? options.missing : null;
	let _runtimeMissing = isFunction(options.missing) ? defineCoreMissingHandler(options.missing) : null;
	let _postTranslation = isFunction(options.postTranslation) ? options.postTranslation : null;
	let _warnHtmlMessage = __root ? __root.warnHtmlMessage : isBoolean(options.warnHtmlMessage) ? options.warnHtmlMessage : true;
	let _escapeParameter = !!options.escapeParameter;
	const _modifiers = __root ? __root.modifiers : isPlainObject(options.modifiers) ? options.modifiers : {};
	let _pluralRules = options.pluralRules || __root && __root.pluralRules;
	let _context;
	const getCoreContext = () => {
		_isGlobal && setFallbackContext(null);
		const ctxOptions = {
			version: VERSION,
			locale: _locale.value,
			fallbackLocale: _fallbackLocale.value,
			messages: _messages.value,
			modifiers: _modifiers,
			pluralRules: _pluralRules,
			missing: _runtimeMissing === null ? void 0 : _runtimeMissing,
			missingWarn: _missingWarn,
			fallbackWarn: _fallbackWarn,
			fallbackFormat: _fallbackFormat,
			unresolving: true,
			postTranslation: _postTranslation === null ? void 0 : _postTranslation,
			warnHtmlMessage: _warnHtmlMessage,
			escapeParameter: _escapeParameter,
			messageResolver: options.messageResolver,
			messageCompiler: options.messageCompiler,
			__meta: { framework: "vue" }
		};
		ctxOptions.datetimeFormats = _datetimeFormats.value;
		ctxOptions.numberFormats = _numberFormats.value;
		ctxOptions.__datetimeFormatters = isPlainObject(_context) ? _context.__datetimeFormatters : void 0;
		ctxOptions.__numberFormatters = isPlainObject(_context) ? _context.__numberFormatters : void 0;
		const ctx = createCoreContext(ctxOptions);
		_isGlobal && setFallbackContext(ctx);
		return ctx;
	};
	_context = getCoreContext();
	updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
	function trackReactivityValues() {
		return [
			_locale.value,
			_fallbackLocale.value,
			_messages.value,
			_datetimeFormats.value,
			_numberFormats.value
		];
	}
	const locale = computed({
		get: () => _locale.value,
		set: (val) => {
			_context.locale = val;
			_locale.value = val;
		}
	});
	const fallbackLocale = computed({
		get: () => _fallbackLocale.value,
		set: (val) => {
			_context.fallbackLocale = val;
			_fallbackLocale.value = val;
			updateFallbackLocale(_context, _locale.value, val);
		}
	});
	const messages = computed(() => _messages.value);
	const datetimeFormats = /* #__PURE__*/ computed(() => _datetimeFormats.value);
	const numberFormats = /* #__PURE__*/ computed(() => _numberFormats.value);
	function getPostTranslationHandler() {
		return isFunction(_postTranslation) ? _postTranslation : null;
	}
	function setPostTranslationHandler(handler) {
		_postTranslation = handler;
		_context.postTranslation = handler;
	}
	function getMissingHandler() {
		return _missing;
	}
	function setMissingHandler(handler) {
		if (handler !== null) _runtimeMissing = defineCoreMissingHandler(handler);
		_missing = handler;
		_context.missing = _runtimeMissing;
	}
	const wrapWithDeps = (fn, argumentParser, warnType, fallbackSuccess, fallbackFail, successCondition) => {
		trackReactivityValues();
		let ret;
		try {
			if (__INTLIFY_PROD_DEVTOOLS__);
			if (!_isGlobal) _context.fallbackContext = __root ? getFallbackContext() : void 0;
			ret = fn(_context);
		} finally {
			if (__INTLIFY_PROD_DEVTOOLS__);
			if (!_isGlobal) _context.fallbackContext = void 0;
		}
		if (warnType !== "translate exists" && isNumber(ret) && ret === -1 || warnType === "translate exists" && !ret) {
			const [key, arg2] = argumentParser();
			return __root && _fallbackRoot ? fallbackSuccess(__root) : fallbackFail(key);
		} else if (successCondition(ret)) return ret;
		else
 /* istanbul ignore next */
		throw createI18nError(I18nErrorCodes.UNEXPECTED_RETURN_TYPE);
	};
	function t(...args) {
		return wrapWithDeps((context) => Reflect.apply(translate, null, [context, ...args]), () => parseTranslateArgs(...args), "translate", (root) => Reflect.apply(root.t, root, [...args]), (key) => key, (val) => isString(val));
	}
	function rt(...args) {
		const [arg1, arg2, arg3] = args;
		if (arg3 && !isObject(arg3)) throw createI18nError(I18nErrorCodes.INVALID_ARGUMENT);
		return t(...[
			arg1,
			arg2,
			assign({ resolvedMessage: true }, arg3 || {})
		]);
	}
	function d(...args) {
		return wrapWithDeps((context) => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), "datetime format", (root) => Reflect.apply(root.d, root, [...args]), () => "", (val) => isString(val) || isArray(val));
	}
	function n(...args) {
		return wrapWithDeps((context) => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), "number format", (root) => Reflect.apply(root.n, root, [...args]), () => "", (val) => isString(val) || isArray(val));
	}
	function normalize(values) {
		return values.map((val) => isString(val) || isNumber(val) || isBoolean(val) ? createTextNode(String(val)) : val);
	}
	const interpolate = (val) => val;
	const processor = {
		normalize,
		interpolate,
		type: "vnode"
	};
	function translateVNode(...args) {
		return wrapWithDeps((context) => {
			let ret;
			const _context = context;
			try {
				_context.processor = processor;
				ret = Reflect.apply(translate, null, [_context, ...args]);
			} finally {
				_context.processor = null;
			}
			return ret;
		}, () => parseTranslateArgs(...args), "translate", (root) => root[TranslateVNodeSymbol](...args), (key) => [createTextNode(key)], (val) => isArray(val));
	}
	function numberParts(...args) {
		return wrapWithDeps((context) => Reflect.apply(number, null, [context, ...args]), () => parseNumberArgs(...args), "number format", (root) => root[NumberPartsSymbol](...args), NOOP_RETURN_ARRAY, (val) => isString(val) || isArray(val));
	}
	function datetimeParts(...args) {
		return wrapWithDeps((context) => Reflect.apply(datetime, null, [context, ...args]), () => parseDateTimeArgs(...args), "datetime format", (root) => root[DatetimePartsSymbol](...args), NOOP_RETURN_ARRAY, (val) => isString(val) || isArray(val));
	}
	function setPluralRules(rules) {
		_pluralRules = rules;
		_context.pluralRules = _pluralRules;
	}
	function te(key, locale) {
		return wrapWithDeps(() => {
			if (!key) return false;
			const targetLocale = isString(locale) ? locale : _locale.value;
			const locales = isString(locale) ? [targetLocale] : fallbackWithLocaleChain(_context, _fallbackLocale.value, targetLocale);
			for (let i = 0; i < locales.length; i++) {
				const message = getLocaleMessage(locales[i]);
				let resolved = _context.messageResolver(message, key);
				if (resolved === null) resolved = message[key];
				if (isMessageAST(resolved) || isMessageFunction(resolved) || isString(resolved)) return true;
			}
			return false;
		}, () => [key], "translate exists", (root) => {
			return Reflect.apply(root.te, root, [key, locale]);
		}, NOOP_RETURN_FALSE, (val) => isBoolean(val));
	}
	function resolveMessages(key) {
		let messages = null;
		const locales = fallbackWithLocaleChain(_context, _fallbackLocale.value, _locale.value);
		for (let i = 0; i < locales.length; i++) {
			const targetLocaleMessages = _messages.value[locales[i]] || {};
			const messageValue = _context.messageResolver(targetLocaleMessages, key);
			if (messageValue != null) {
				messages = messageValue;
				break;
			}
		}
		return messages;
	}
	function tm(key) {
		const messages = resolveMessages(key);
		return messages != null ? messages : __root ? __root.tm(key) || {} : {};
	}
	function getLocaleMessage(locale) {
		return _messages.value[locale] || {};
	}
	function setLocaleMessage(locale, message) {
		if (flatJson) {
			const _message = { [locale]: message };
			for (const key in _message) if (hasOwn(_message, key)) handleFlatJson(_message[key]);
			message = _message[locale];
		}
		_messages.value[locale] = message;
		_context.messages = _messages.value;
	}
	function mergeLocaleMessage(locale, message) {
		_messages.value[locale] = _messages.value[locale] || {};
		const _message = { [locale]: message };
		if (flatJson) {
			for (const key in _message) if (hasOwn(_message, key)) handleFlatJson(_message[key]);
		}
		message = _message[locale];
		deepCopy(message, _messages.value[locale]);
		_context.messages = _messages.value;
	}
	function getDateTimeFormat(locale) {
		return _datetimeFormats.value[locale] || {};
	}
	function setDateTimeFormat(locale, format) {
		_datetimeFormats.value[locale] = format;
		_context.datetimeFormats = _datetimeFormats.value;
		clearDateTimeFormat(_context, locale, format);
	}
	function mergeDateTimeFormat(locale, format) {
		_datetimeFormats.value[locale] = assign(_datetimeFormats.value[locale] || {}, format);
		_context.datetimeFormats = _datetimeFormats.value;
		clearDateTimeFormat(_context, locale, format);
	}
	function getNumberFormat(locale) {
		return _numberFormats.value[locale] || {};
	}
	function setNumberFormat(locale, format) {
		_numberFormats.value[locale] = format;
		_context.numberFormats = _numberFormats.value;
		clearNumberFormat(_context, locale, format);
	}
	function mergeNumberFormat(locale, format) {
		_numberFormats.value[locale] = assign(_numberFormats.value[locale] || {}, format);
		_context.numberFormats = _numberFormats.value;
		clearNumberFormat(_context, locale, format);
	}
	composerID++;
	if (__root && inBrowser) {
		watch(__root.locale, (val) => {
			if (_inheritLocale) {
				_locale.value = val;
				_context.locale = val;
				updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
			}
		});
		watch(__root.fallbackLocale, (val) => {
			if (_inheritLocale) {
				_fallbackLocale.value = val;
				_context.fallbackLocale = val;
				updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
			}
		});
	}
	const composer = {
		id: composerID,
		locale,
		fallbackLocale,
		get inheritLocale() {
			return _inheritLocale;
		},
		set inheritLocale(val) {
			_inheritLocale = val;
			if (val && __root) {
				_locale.value = __root.locale.value;
				_fallbackLocale.value = __root.fallbackLocale.value;
				updateFallbackLocale(_context, _locale.value, _fallbackLocale.value);
			}
		},
		get availableLocales() {
			return Object.keys(_messages.value).sort();
		},
		messages,
		get modifiers() {
			return _modifiers;
		},
		get pluralRules() {
			return _pluralRules || {};
		},
		get isGlobal() {
			return _isGlobal;
		},
		get missingWarn() {
			return _missingWarn;
		},
		set missingWarn(val) {
			_missingWarn = val;
			_context.missingWarn = _missingWarn;
		},
		get fallbackWarn() {
			return _fallbackWarn;
		},
		set fallbackWarn(val) {
			_fallbackWarn = val;
			_context.fallbackWarn = _fallbackWarn;
		},
		get fallbackRoot() {
			return _fallbackRoot;
		},
		set fallbackRoot(val) {
			_fallbackRoot = val;
		},
		get fallbackFormat() {
			return _fallbackFormat;
		},
		set fallbackFormat(val) {
			_fallbackFormat = val;
			_context.fallbackFormat = _fallbackFormat;
		},
		get warnHtmlMessage() {
			return _warnHtmlMessage;
		},
		set warnHtmlMessage(val) {
			_warnHtmlMessage = val;
			_context.warnHtmlMessage = val;
		},
		get escapeParameter() {
			return _escapeParameter;
		},
		set escapeParameter(val) {
			_escapeParameter = val;
			_context.escapeParameter = val;
		},
		t,
		getLocaleMessage,
		setLocaleMessage,
		mergeLocaleMessage,
		getPostTranslationHandler,
		setPostTranslationHandler,
		getMissingHandler,
		setMissingHandler,
		[SetPluralRulesSymbol]: setPluralRules
	};
	composer.datetimeFormats = datetimeFormats;
	composer.numberFormats = numberFormats;
	composer.rt = rt;
	composer.te = te;
	composer.tm = tm;
	composer.d = d;
	composer.n = n;
	composer.getDateTimeFormat = getDateTimeFormat;
	composer.setDateTimeFormat = setDateTimeFormat;
	composer.mergeDateTimeFormat = mergeDateTimeFormat;
	composer.getNumberFormat = getNumberFormat;
	composer.setNumberFormat = setNumberFormat;
	composer.mergeNumberFormat = mergeNumberFormat;
	composer[InejctWithOptionSymbol] = __injectWithOption;
	composer[TranslateVNodeSymbol] = translateVNode;
	composer[DatetimePartsSymbol] = datetimeParts;
	composer[NumberPartsSymbol] = numberParts;
	return composer;
}
/**
* Convert to I18n Composer Options from VueI18n Options
*
* @internal
*/
function convertComposerOptions(options) {
	const locale = isString(options.locale) ? options.locale : DEFAULT_LOCALE;
	const fallbackLocale = isString(options.fallbackLocale) || isArray(options.fallbackLocale) || isPlainObject(options.fallbackLocale) || options.fallbackLocale === false ? options.fallbackLocale : locale;
	const missing = isFunction(options.missing) ? options.missing : void 0;
	const missingWarn = isBoolean(options.silentTranslationWarn) || isRegExp(options.silentTranslationWarn) ? !options.silentTranslationWarn : true;
	const fallbackWarn = isBoolean(options.silentFallbackWarn) || isRegExp(options.silentFallbackWarn) ? !options.silentFallbackWarn : true;
	const fallbackRoot = isBoolean(options.fallbackRoot) ? options.fallbackRoot : true;
	const fallbackFormat = !!options.formatFallbackMessages;
	const modifiers = isPlainObject(options.modifiers) ? options.modifiers : {};
	const pluralizationRules = options.pluralizationRules;
	const postTranslation = isFunction(options.postTranslation) ? options.postTranslation : void 0;
	const warnHtmlMessage = isString(options.warnHtmlInMessage) ? options.warnHtmlInMessage !== "off" : true;
	const escapeParameter = !!options.escapeParameterHtml;
	const inheritLocale = isBoolean(options.sync) ? options.sync : true;
	let messages = options.messages;
	if (isPlainObject(options.sharedMessages)) {
		const sharedMessages = options.sharedMessages;
		messages = Object.keys(sharedMessages).reduce((messages, locale) => {
			assign(messages[locale] || (messages[locale] = {}), sharedMessages[locale]);
			return messages;
		}, messages || {});
	}
	const { __i18n, __root, __injectWithOption } = options;
	const datetimeFormats = options.datetimeFormats;
	const numberFormats = options.numberFormats;
	const flatJson = options.flatJson;
	return {
		locale,
		fallbackLocale,
		messages,
		flatJson,
		datetimeFormats,
		numberFormats,
		missing,
		missingWarn,
		fallbackWarn,
		fallbackRoot,
		fallbackFormat,
		modifiers,
		pluralRules: pluralizationRules,
		postTranslation,
		warnHtmlMessage,
		escapeParameter,
		messageResolver: options.messageResolver,
		inheritLocale,
		__i18n,
		__root,
		__injectWithOption
	};
}
/**
* create VueI18n interface factory
*
* @internal
*
* @deprecated will be removed at vue-i18n v12
*/
function createVueI18n(options = {}) {
	const composer = createComposer(convertComposerOptions(options));
	const { __extender } = options;
	const vueI18n = {
		id: composer.id,
		get locale() {
			return composer.locale.value;
		},
		set locale(val) {
			composer.locale.value = val;
		},
		get fallbackLocale() {
			return composer.fallbackLocale.value;
		},
		set fallbackLocale(val) {
			composer.fallbackLocale.value = val;
		},
		get messages() {
			return composer.messages.value;
		},
		get datetimeFormats() {
			return composer.datetimeFormats.value;
		},
		get numberFormats() {
			return composer.numberFormats.value;
		},
		get availableLocales() {
			return composer.availableLocales;
		},
		get missing() {
			return composer.getMissingHandler();
		},
		set missing(handler) {
			composer.setMissingHandler(handler);
		},
		get silentTranslationWarn() {
			return isBoolean(composer.missingWarn) ? !composer.missingWarn : composer.missingWarn;
		},
		set silentTranslationWarn(val) {
			composer.missingWarn = isBoolean(val) ? !val : val;
		},
		get silentFallbackWarn() {
			return isBoolean(composer.fallbackWarn) ? !composer.fallbackWarn : composer.fallbackWarn;
		},
		set silentFallbackWarn(val) {
			composer.fallbackWarn = isBoolean(val) ? !val : val;
		},
		get modifiers() {
			return composer.modifiers;
		},
		get formatFallbackMessages() {
			return composer.fallbackFormat;
		},
		set formatFallbackMessages(val) {
			composer.fallbackFormat = val;
		},
		get postTranslation() {
			return composer.getPostTranslationHandler();
		},
		set postTranslation(handler) {
			composer.setPostTranslationHandler(handler);
		},
		get sync() {
			return composer.inheritLocale;
		},
		set sync(val) {
			composer.inheritLocale = val;
		},
		get warnHtmlInMessage() {
			return composer.warnHtmlMessage ? "warn" : "off";
		},
		set warnHtmlInMessage(val) {
			composer.warnHtmlMessage = val !== "off";
		},
		get escapeParameterHtml() {
			return composer.escapeParameter;
		},
		set escapeParameterHtml(val) {
			composer.escapeParameter = val;
		},
		get pluralizationRules() {
			return composer.pluralRules || {};
		},
		__composer: composer,
		t(...args) {
			return Reflect.apply(composer.t, composer, [...args]);
		},
		rt(...args) {
			return Reflect.apply(composer.rt, composer, [...args]);
		},
		te(key, locale) {
			return composer.te(key, locale);
		},
		tm(key) {
			return composer.tm(key);
		},
		getLocaleMessage(locale) {
			return composer.getLocaleMessage(locale);
		},
		setLocaleMessage(locale, message) {
			composer.setLocaleMessage(locale, message);
		},
		mergeLocaleMessage(locale, message) {
			composer.mergeLocaleMessage(locale, message);
		},
		d(...args) {
			return Reflect.apply(composer.d, composer, [...args]);
		},
		getDateTimeFormat(locale) {
			return composer.getDateTimeFormat(locale);
		},
		setDateTimeFormat(locale, format) {
			composer.setDateTimeFormat(locale, format);
		},
		mergeDateTimeFormat(locale, format) {
			composer.mergeDateTimeFormat(locale, format);
		},
		n(...args) {
			return Reflect.apply(composer.n, composer, [...args]);
		},
		getNumberFormat(locale) {
			return composer.getNumberFormat(locale);
		},
		setNumberFormat(locale, format) {
			composer.setNumberFormat(locale, format);
		},
		mergeNumberFormat(locale, format) {
			composer.mergeNumberFormat(locale, format);
		}
	};
	vueI18n.__extender = __extender;
	return vueI18n;
}
/**
* Supports compatibility for legacy vue-i18n APIs
* This mixin is used when we use vue-i18n@v9.x or later
*/
function defineMixin(vuei18n, composer, i18n) {
	return {
		beforeCreate() {
			const instance = getCurrentInstance();
			/* istanbul ignore if */
			if (!instance) throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
			const options = this.$options;
			if (options.i18n) {
				const optionsI18n = options.i18n;
				if (options.__i18n) optionsI18n.__i18n = options.__i18n;
				optionsI18n.__root = composer;
				if (this === this.$root) this.$i18n = mergeToGlobal(vuei18n, optionsI18n);
				else {
					optionsI18n.__injectWithOption = true;
					optionsI18n.__extender = i18n.__vueI18nExtend;
					this.$i18n = createVueI18n(optionsI18n);
					const _vueI18n = this.$i18n;
					if (_vueI18n.__extender) _vueI18n.__disposer = _vueI18n.__extender(this.$i18n);
				}
			} else if (options.__i18n) if (this === this.$root) this.$i18n = mergeToGlobal(vuei18n, options);
			else {
				this.$i18n = createVueI18n({
					__i18n: options.__i18n,
					__injectWithOption: true,
					__extender: i18n.__vueI18nExtend,
					__root: composer
				});
				const _vueI18n = this.$i18n;
				if (_vueI18n.__extender) _vueI18n.__disposer = _vueI18n.__extender(this.$i18n);
			}
			else this.$i18n = vuei18n;
			if (options.__i18nGlobal) adjustI18nResources(composer, options, options);
			this.$t = (...args) => this.$i18n.t(...args);
			this.$rt = (...args) => this.$i18n.rt(...args);
			this.$te = (key, locale) => this.$i18n.te(key, locale);
			this.$d = (...args) => this.$i18n.d(...args);
			this.$n = (...args) => this.$i18n.n(...args);
			this.$tm = (key) => this.$i18n.tm(key);
			i18n.__setInstance(instance, this.$i18n);
		},
		mounted() {},
		unmounted() {
			const instance = getCurrentInstance();
			/* istanbul ignore if */
			if (!instance) throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
			const _vueI18n = this.$i18n;
			if (!_vueI18n) return;
			delete this.$t;
			delete this.$rt;
			delete this.$te;
			delete this.$d;
			delete this.$n;
			delete this.$tm;
			if (_vueI18n?.__disposer) {
				_vueI18n.__disposer();
				delete _vueI18n.__disposer;
				delete _vueI18n.__extender;
			}
			i18n.__deleteInstance(instance);
			delete this.$i18n;
		}
	};
}
function mergeToGlobal(g, options) {
	g.locale = options.locale || g.locale;
	g.fallbackLocale = options.fallbackLocale || g.fallbackLocale;
	g.missing = options.missing || g.missing;
	g.silentTranslationWarn = options.silentTranslationWarn || g.silentFallbackWarn;
	g.silentFallbackWarn = options.silentFallbackWarn || g.silentFallbackWarn;
	g.formatFallbackMessages = options.formatFallbackMessages || g.formatFallbackMessages;
	g.postTranslation = options.postTranslation || g.postTranslation;
	g.warnHtmlInMessage = options.warnHtmlInMessage || g.warnHtmlInMessage;
	g.escapeParameterHtml = options.escapeParameterHtml || g.escapeParameterHtml;
	g.sync = options.sync || g.sync;
	g.__composer[SetPluralRulesSymbol](options.pluralizationRules || g.pluralizationRules);
	const messages = getLocaleMessages(g.locale, {
		messages: options.messages,
		__i18n: options.__i18n
	});
	Object.keys(messages).forEach((locale) => g.mergeLocaleMessage(locale, messages[locale]));
	if (options.datetimeFormats) Object.keys(options.datetimeFormats).forEach((locale) => g.mergeDateTimeFormat(locale, options.datetimeFormats[locale]));
	if (options.numberFormats) Object.keys(options.numberFormats).forEach((locale) => g.mergeNumberFormat(locale, options.numberFormats[locale]));
	return g;
}
var baseFormatProps = {
	tag: { type: [String, Object] },
	locale: { type: String },
	scope: {
		type: String,
		validator: (val) => val === "parent" || val === "global",
		default: "parent"
	},
	i18n: { type: Object }
};
function getInterpolateArg({ slots }, keys) {
	if (keys.length === 1 && keys[0] === "default") return (slots.default ? slots.default() : []).reduce((slot, current) => {
		return [...slot, ...current.type === Fragment ? current.children : [current]];
	}, []);
	else return keys.reduce((arg, key) => {
		const slot = slots[key];
		if (slot) arg[key] = slot();
		return arg;
	}, create());
}
function getFragmentableTag() {
	return Fragment;
}
/**
* export the public type for h/tsx inference
* also to avoid inline import() in generated d.ts files
*/
/**
* Translation Component
*
* @remarks
* See the following items for property about details
*
* @VueI18nSee [TranslationProps](component#translationprops)
* @VueI18nSee [BaseFormatProps](component#baseformatprops)
* @VueI18nSee [Component Interpolation](../guide/advanced/component)
*
* @example
* ```html
* <div id="app">
*   <!-- ... -->
*   <i18n keypath="term" tag="label" for="tos">
*     <a :href="url" target="_blank">{{ $t('tos') }}</a>
*   </i18n>
*   <!-- ... -->
* </div>
* ```
* ```js
* import { createApp } from 'vue'
* import { createI18n } from 'vue-i18n'
*
* const messages = {
*   en: {
*     tos: 'Term of Service',
*     term: 'I accept xxx {0}.'
*   },
*   ja: {
*     tos: '利用規約',
*     term: '私は xxx の{0}に同意します。'
*   }
* }
*
* const i18n = createI18n({
*   locale: 'en',
*   messages
* })
*
* const app = createApp({
*   data: {
*     url: '/term'
*   }
* }).use(i18n).mount('#app')
* ```
*
* @VueI18nComponent
*/
var Translation = /* @__PURE__ */ defineComponent({
	name: "i18n-t",
	props: assign({
		keypath: {
			type: String,
			required: true
		},
		plural: {
			type: [Number, String],
			validator: (val) => isNumber(val) || !isNaN(val)
		}
	}, baseFormatProps),
	setup(props, context) {
		const { slots, attrs } = context;
		const i18n = props.i18n || useI18n({
			useScope: props.scope,
			__useComponent: true
		});
		return () => {
			const renderChildren = () => {
				const keys = Object.keys(slots).filter((key) => key[0] !== "_");
				const options = create();
				if (props.locale) options.locale = props.locale;
				if (props.plural !== void 0) options.plural = isString(props.plural) ? +props.plural : props.plural;
				const arg = getInterpolateArg(context, keys);
				return i18n[TranslateVNodeSymbol](props.keypath, arg, options);
			};
			const assignedAttrs = assign(create(), attrs);
			const tag = isString(props.tag) || isObject(props.tag) ? props.tag : getFragmentableTag();
			return isObject(tag) ? h(tag, assignedAttrs, { default: renderChildren }) : h(tag, assignedAttrs, renderChildren());
		};
	}
});
function isVNode(target) {
	return isArray(target) && !isString(target[0]);
}
function renderFormatter(props, context, slotKeys, partFormatter) {
	const { slots, attrs } = context;
	return () => {
		const renderChildren = () => {
			const options = { part: true };
			let overrides = create();
			if (props.locale) options.locale = props.locale;
			if (isString(props.format)) options.key = props.format;
			else if (isObject(props.format)) {
				if (isString(props.format.key)) options.key = props.format.key;
				overrides = Object.keys(props.format).reduce((options, prop) => {
					return slotKeys.includes(prop) ? assign(create(), options, { [prop]: props.format[prop] }) : options;
				}, create());
			}
			const parts = partFormatter(...[
				props.value,
				options,
				overrides
			]);
			let children = [options.key];
			if (isArray(parts)) children = parts.map((part, index) => {
				const slot = slots[part.type];
				const node = slot ? slot({
					[part.type]: part.value,
					index,
					parts
				}) : [part.value];
				if (isVNode(node)) node[0].key = `${part.type}-${index}`;
				return node;
			});
			else if (isString(parts)) children = [parts];
			return children;
		};
		const assignedAttrs = assign(create(), attrs);
		const tag = isString(props.tag) || isObject(props.tag) ? props.tag : getFragmentableTag();
		return isObject(tag) ? h(tag, assignedAttrs, { default: renderChildren }) : h(tag, assignedAttrs, renderChildren());
	};
}
/**
* export the public type for h/tsx inference
* also to avoid inline import() in generated d.ts files
*/
/**
* Number Format Component
*
* @remarks
* See the following items for property about details
*
* @VueI18nSee [FormattableProps](component#formattableprops)
* @VueI18nSee [BaseFormatProps](component#baseformatprops)
* @VueI18nSee [Custom Formatting](../guide/essentials/number#custom-formatting)
*
* @VueI18nDanger
* Not supported IE, due to no support `Intl.NumberFormat#formatToParts` in [IE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/formatToParts)
*
* If you want to use it, you need to use [polyfill](https://github.com/formatjs/formatjs/tree/main/packages/intl-numberformat)
*
* @VueI18nComponent
*/
var NumberFormat = /* @__PURE__ */ defineComponent({
	name: "i18n-n",
	props: assign({
		value: {
			type: Number,
			required: true
		},
		format: { type: [String, Object] }
	}, baseFormatProps),
	setup(props, context) {
		const i18n = props.i18n || useI18n({
			useScope: props.scope,
			__useComponent: true
		});
		return renderFormatter(props, context, NUMBER_FORMAT_OPTIONS_KEYS, (...args) => i18n[NumberPartsSymbol](...args));
	}
});
function getComposer$1(i18n, instance) {
	const i18nInternal = i18n;
	if (i18n.mode === "composition") return i18nInternal.__getInstance(instance) || i18n.global;
	else {
		const vueI18n = i18nInternal.__getInstance(instance);
		return vueI18n != null ? vueI18n.__composer : i18n.global.__composer;
	}
}
/**
* @deprecated will be removed at vue-i18n v12
*/
function vTDirective(i18n) {
	const _process = (binding) => {
		const { instance, value } = binding;
		/* istanbul ignore if */
		if (!instance || !instance.$) throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
		const composer = getComposer$1(i18n, instance.$);
		const parsedValue = parseValue(value);
		return [Reflect.apply(composer.t, composer, [...makeParams(parsedValue)]), composer];
	};
	const register = (el, binding) => {
		const [textContent, composer] = _process(binding);
		if (inBrowser) el.__i18nWatcher = watch(composer.locale, () => {
			binding.instance && binding.instance.$forceUpdate();
		});
		el.__composer = composer;
		el.textContent = textContent;
	};
	const unregister = (el) => {
		if (inBrowser && el.__i18nWatcher) {
			el.__i18nWatcher();
			el.__i18nWatcher = void 0;
			delete el.__i18nWatcher;
		}
		if (el.__composer) {
			el.__composer = void 0;
			delete el.__composer;
		}
	};
	const update = (el, { value }) => {
		if (el.__composer) {
			const composer = el.__composer;
			const parsedValue = parseValue(value);
			el.textContent = Reflect.apply(composer.t, composer, [...makeParams(parsedValue)]);
		}
	};
	const getSSRProps = (binding) => {
		const [textContent] = _process(binding);
		return { textContent };
	};
	return {
		created: register,
		unmounted: unregister,
		beforeUpdate: update,
		getSSRProps
	};
}
function parseValue(value) {
	if (isString(value)) return { path: value };
	else if (isPlainObject(value)) {
		if (!("path" in value)) throw createI18nError(I18nErrorCodes.REQUIRED_VALUE, "path");
		return value;
	} else throw createI18nError(I18nErrorCodes.INVALID_VALUE);
}
function makeParams(value) {
	const { path, locale, args, choice, plural } = value;
	const options = {};
	const named = args || {};
	if (isString(locale)) options.locale = locale;
	if (isNumber(choice)) options.plural = choice;
	if (isNumber(plural)) options.plural = plural;
	return [
		path,
		named,
		options
	];
}
function apply(app, i18n, ...options) {
	const pluginOptions = isPlainObject(options[0]) ? options[0] : {};
	if (isBoolean(pluginOptions.globalInstall) ? pluginOptions.globalInstall : true) {
		[Translation.name, "I18nT"].forEach((name) => app.component(name, Translation));
		[NumberFormat.name, "I18nN"].forEach((name) => app.component(name, NumberFormat));
		[DatetimeFormat.name, "I18nD"].forEach((name) => app.component(name, DatetimeFormat));
	}
	app.directive("t", vTDirective(i18n));
}
/**
* Injection key for {@link useI18n}
*
* @remarks
* The global injection key for I18n instances with `useI18n`. this injection key is used in Web Components.
* Specify the i18n instance created by {@link createI18n} together with `provide` function.
*
* @VueI18nGeneral
*/
var I18nInjectionKey = /* #__PURE__*/ makeSymbol("global-vue-i18n");
function createI18n(options = {}) {
	const __legacyMode = __VUE_I18N_LEGACY_API__ && isBoolean(options.legacy) ? options.legacy : __VUE_I18N_LEGACY_API__;
	const __globalInjection = isBoolean(options.globalInjection) ? options.globalInjection : true;
	const __instances = /* @__PURE__ */ new Map();
	const [globalScope, __global] = createGlobal(options, __legacyMode);
	const symbol = /* #__PURE__*/ makeSymbol("");
	function __getInstance(component) {
		return __instances.get(component) || null;
	}
	function __setInstance(component, instance) {
		__instances.set(component, instance);
	}
	function __deleteInstance(component) {
		__instances.delete(component);
	}
	const i18n = {
		get mode() {
			return __VUE_I18N_LEGACY_API__ && __legacyMode ? "legacy" : "composition";
		},
		async install(app, ...options) {
			app.__VUE_I18N_SYMBOL__ = symbol;
			app.provide(app.__VUE_I18N_SYMBOL__, i18n);
			if (isPlainObject(options[0])) {
				const opts = options[0];
				i18n.__composerExtend = opts.__composerExtend;
				i18n.__vueI18nExtend = opts.__vueI18nExtend;
			}
			let globalReleaseHandler = null;
			if (!__legacyMode && __globalInjection) globalReleaseHandler = injectGlobalFields(app, i18n.global);
			if (__VUE_I18N_FULL_INSTALL__) apply(app, i18n, ...options);
			if (__VUE_I18N_LEGACY_API__ && __legacyMode) app.mixin(defineMixin(__global, __global.__composer, i18n));
			const unmountApp = app.unmount;
			app.unmount = () => {
				globalReleaseHandler && globalReleaseHandler();
				i18n.dispose();
				unmountApp();
			};
		},
		get global() {
			return __global;
		},
		dispose() {
			globalScope.stop();
		},
		__instances,
		__getInstance,
		__setInstance,
		__deleteInstance
	};
	return i18n;
}
function useI18n(options = {}) {
	const instance = getCurrentInstance();
	if (instance == null) throw createI18nError(I18nErrorCodes.MUST_BE_CALL_SETUP_TOP);
	if (!instance.isCE && instance.appContext.app != null && !instance.appContext.app.__VUE_I18N_SYMBOL__) throw createI18nError(I18nErrorCodes.NOT_INSTALLED);
	const i18n = getI18nInstance(instance);
	const gl = getGlobalComposer(i18n);
	const componentOptions = getComponentOptions(instance);
	const scope = getScope(options, componentOptions);
	if (scope === "global") {
		adjustI18nResources(gl, options, componentOptions);
		return gl;
	}
	if (scope === "parent") {
		let composer = getComposer(i18n, instance, options.__useComponent);
		if (composer == null) composer = gl;
		return composer;
	}
	if (scope === "isolated") {
		if (i18n.mode !== "composition") throw createI18nError(I18nErrorCodes.NOT_AVAILABLE_COMPOSITION_IN_LEGACY);
		const i18nInternalIso = i18n;
		const composerOptions = assign({}, options);
		composerOptions.__root = getComposer(i18n, instance) || gl;
		const composer = createComposer(composerOptions);
		if (i18nInternalIso.__composerExtend) composer[DisposeSymbol] = i18nInternalIso.__composerExtend(composer);
		if (getCurrentScope()) onScopeDispose(() => {
			const dispose = composer[DisposeSymbol];
			if (dispose) {
				dispose();
				delete composer[DisposeSymbol];
			}
		});
		return composer;
	}
	const i18nInternal = i18n;
	let composer = i18nInternal.__getInstance(instance);
	if (composer == null) {
		const composerOptions = assign({}, options);
		if ("__i18n" in componentOptions) composerOptions.__i18n = componentOptions.__i18n;
		if (gl) composerOptions.__root = gl;
		composer = createComposer(composerOptions);
		if (i18nInternal.__composerExtend) composer[DisposeSymbol] = i18nInternal.__composerExtend(composer);
		setupLifeCycle(i18nInternal, instance, composer);
		i18nInternal.__setInstance(instance, composer);
	}
	return composer;
}
function createGlobal(options, legacyMode) {
	const scope = effectScope();
	const obj = __VUE_I18N_LEGACY_API__ && legacyMode ? scope.run(() => createVueI18n(options)) : scope.run(() => createComposer(options));
	if (obj == null) throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
	return [scope, obj];
}
function getI18nInstance(instance) {
	const i18n = inject(!instance.isCE ? instance.appContext.app.__VUE_I18N_SYMBOL__ : I18nInjectionKey);
	/* istanbul ignore if */
	if (!i18n) throw createI18nError(!instance.isCE ? I18nErrorCodes.UNEXPECTED_ERROR : I18nErrorCodes.NOT_INSTALLED_WITH_PROVIDE);
	return i18n;
}
function getScope(options, componentOptions) {
	return isEmptyObject(options) ? "__i18n" in componentOptions ? "local" : "global" : !options.useScope ? "local" : options.useScope;
}
function getGlobalComposer(i18n) {
	return i18n.mode === "composition" ? i18n.global : i18n.global.__composer;
}
function getComposer(i18n, target, useComponent = false) {
	let composer = null;
	const root = target.root;
	let current = getParentComponentInstance(target, useComponent);
	while (current != null) {
		const i18nInternal = i18n;
		if (i18n.mode === "composition") composer = i18nInternal.__getInstance(current);
		else if (__VUE_I18N_LEGACY_API__) {
			const vueI18n = i18nInternal.__getInstance(current);
			if (vueI18n != null) {
				composer = vueI18n.__composer;
				if (useComponent && composer && !composer[InejctWithOptionSymbol]) composer = null;
			}
		}
		if (composer != null) break;
		if (root === current) break;
		current = current.parent;
	}
	return composer;
}
function getParentComponentInstance(target, useComponent = false) {
	if (target == null) return null;
	return !useComponent ? target.parent : target.vnode.ctx || target.parent;
}
function setupLifeCycle(i18n, target, composer) {
	onMounted(() => {}, target);
	onUnmounted(() => {
		const _composer = composer;
		i18n.__deleteInstance(target);
		const dispose = _composer[DisposeSymbol];
		if (dispose) {
			dispose();
			delete _composer[DisposeSymbol];
		}
	}, target);
}
var globalExportProps = [
	"locale",
	"fallbackLocale",
	"availableLocales"
];
var globalExportMethods = [
	"t",
	"rt",
	"d",
	"n",
	"tm",
	"te"
];
function injectGlobalFields(app, composer) {
	const i18n = Object.create(null);
	globalExportProps.forEach((prop) => {
		const desc = Object.getOwnPropertyDescriptor(composer, prop);
		if (!desc) throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
		const wrap = isRef(desc.value) ? {
			get() {
				return desc.value.value;
			},
			set(val) {
				desc.value.value = val;
			}
		} : { get() {
			return desc.get && desc.get();
		} };
		Object.defineProperty(i18n, prop, wrap);
	});
	app.config.globalProperties.$i18n = i18n;
	globalExportMethods.forEach((method) => {
		const desc = Object.getOwnPropertyDescriptor(composer, method);
		if (!desc || !desc.value) throw createI18nError(I18nErrorCodes.UNEXPECTED_ERROR);
		Object.defineProperty(app.config.globalProperties, `$${method}`, desc);
	});
	const dispose = () => {
		delete app.config.globalProperties.$i18n;
		globalExportMethods.forEach((method) => {
			delete app.config.globalProperties[`$${method}`];
		});
	};
	return dispose;
}
/**
* Datetime Format Component
*
* @remarks
* See the following items for property about details
*
* @VueI18nSee [FormattableProps](component#formattableprops)
* @VueI18nSee [BaseFormatProps](component#baseformatprops)
* @VueI18nSee [Custom Formatting](../guide/essentials/datetime#custom-formatting)
*
* @VueI18nDanger
* Not supported IE, due to no support `Intl.DateTimeFormat#formatToParts` in [IE](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts)
*
* If you want to use it, you need to use [polyfill](https://github.com/formatjs/formatjs/tree/main/packages/intl-datetimeformat)
*
* @VueI18nComponent
*/
var DatetimeFormat = /* @__PURE__ */ defineComponent({
	name: "i18n-d",
	props: assign({
		value: {
			type: [Number, Date],
			required: true
		},
		format: { type: [String, Object] }
	}, baseFormatProps),
	setup(props, context) {
		const i18n = props.i18n || useI18n({
			useScope: props.scope,
			__useComponent: true
		});
		return renderFormatter(props, context, DATETIME_FORMAT_OPTIONS_KEYS, (...args) => i18n[DatetimePartsSymbol](...args));
	}
});
initFeatureFlags();
registerMessageCompiler(compile);
registerMessageResolver(resolveValue);
registerLocaleFallbacker(fallbackWithLocaleChain);
if (__INTLIFY_PROD_DEVTOOLS__) {
	const target = getGlobalThis();
	target.__INTLIFY__ = true;
	setDevToolsHook(target.__INTLIFY_DEVTOOLS_GLOBAL_HOOK__);
}
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
				securityCode: "请输入验证码"
			},
			rules: {
				loginName: {
					required: "用户名不能为空",
					validator: "账号只能包含数字、字母、下划线和中划线"
				},
				password: {
					required: "密码不能为空",
					validator1: "长度在 6 到 20 个字符",
					validator2: "密码必须包含数字和字母"
				},
				securityCode: { required: "验证码不能为空" },
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
			interfaceConfig: "界面配置",
			toolbarSwitch: "工具栏开关",
			messageNotify: "消息通知",
			homeConfig: "首页配置",
			watermarkConfig: "水印配置",
			weatherConfig: "天气配置",
			capabilityConfig: "业务开关"
		},
		security: {
			watermark: {
				enable: {
					title: "全局水印",
					sub: "防录屏",
					tip: "在页面上叠加全局水印（security.watermark.enable）",
					description: "在整个应用上叠加文字水印，可配置文案/颜色/透明度/角度"
				},
				text: {
					label: "水印文案",
					placeholder: "留空则不显示文案"
				},
				color: { label: "水印颜色" },
				alpha: { label: "透明度" },
				rotate: { label: "旋转角度" }
			},
			antiDebug: {
				title: "反调试",
				sub: "安全",
				tip: "检测到调试模式时按配置清空页面或跳转（security.baiduJs.enable）",
				description: "检测到开发者工具/自动化时按 action 处理；调试期间建议关闭"
			},
			dynamicFont: {
				title: "动态字体加密",
				sub: "防 OCR",
				tip: "ReText 使用动态字体渲染文本，防止 OCR 抓取（security.dynamicFont.enable）",
				description: "ReText 未显式指定时回退该全局开关"
			},
			ocrObfuscation: {
				title: "OCR 混淆",
				sub: "防抓取",
				tip: "ReText 以 canvas 渲染文本，阻止页面文本被抓取（security.ocrObfuscation.enable）",
				description: "ReText 未显式指定时回退该全局开关"
			}
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
		watermark: {
			enable: {
				title: "启用全局水印",
				sub: "安全水印",
				tip: "页面叠加用户标识水印（防截图泄露）",
				description: "页面叠加用户标识水印（防截图泄露）"
			},
			placeholder: "水印文案"
		},
		weather: { enable: {
			title: "显示天气",
			sub: "工具栏",
			tip: "顶部工具栏右侧显示天气信息",
			description: "显示当前天气和一周预报"
		} },
		capability: {
			weather: {
				title: "天气接口",
				sub: "后台能力",
				tip: "后台提供 /v2/weather/overview 时走后台取数（other.capabilities.weather）",
				description: "开启后先探测后台天气总览接口，未命中回落三方数据源；后台没有该接口时建议在 app.yaml 关闭，避免每次启动都出现探测 404"
			},
			location: {
				title: "定位接口",
				sub: "后台能力",
				tip: "后台提供 /v2/location/resolve 时由服务端按来源 IP 定位（other.capabilities.location）",
				description: "开启后先探测后台定位解析接口，未命中回落浏览器定位 / IP 定位 / app.yaml 配置坐标"
			},
			typhoon: {
				title: "台风接口",
				sub: "后台能力",
				tip: "后台提供 /v2/typhoon/active 时走后台取数（other.capabilities.typhoon）",
				description: "开启后先探测后台活跃台风接口，未命中回落三方台风网；后台没有该接口时建议在 app.yaml 关闭，避免每次启动都出现探测 404"
			},
			ipLookup: {
				title: "IP 归属地",
				sub: "后台能力",
				tip: "后台提供 /v2/ip/lookup 时由服务端把 IP 解析为物理地址（other.capabilities.ipLookup）",
				description: "开启后 IP 缺少归属地时请求后台解析；后台没有该接口时建议在 app.yaml 关闭，避免无谓的 404 请求"
			},
			holiday: {
				title: "节假日接口",
				sub: "后台能力",
				tip: "后台提供 /v2/holiday/get 时以管理员维护的放假安排为准（other.capabilities.holiday）",
				description: "开启后主页日历优先采用后台下发的放假与补班安排，未下发的日期仍用日历内置数据与《全国年节及纪念日放假办法》推算；后台没有该接口时建议在 app.yaml 关闭，避免每次启动都出现探测 404"
			}
		},
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
		unpinMenu: "取消固定"
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
				securityCode: "Please enter the verification code"
			},
			rules: {
				loginName: {
					required: "The user name cannot be empty",
					validator: "The account can only contain letters, numbers, underscores and hyphens"
				},
				password: {
					required: "The password cannot be empty",
					validator1: "6 to 20 characters in length",
					validator2: "The password must contain both numbers and letters"
				},
				securityCode: { required: "The verification code cannot be empty" },
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
			interfaceConfig: "Interface Config",
			toolbarSwitch: "Toolbar Switches",
			messageNotify: "Message Notify",
			homeConfig: "Home Config",
			watermarkConfig: "Watermark Config",
			weatherConfig: "Weather Config",
			capabilityConfig: "Capability Switches"
		},
		security: {
			watermark: {
				enable: {
					title: "Global Watermark",
					sub: "Screen Capture",
					tip: "Overlay a global watermark (security.watermark.enable)",
					description: "Overlay a text watermark across the app; text/color/opacity/angle configurable"
				},
				text: {
					label: "Watermark Text",
					placeholder: "Empty = no text"
				},
				color: { label: "Watermark Color" },
				alpha: { label: "Opacity" },
				rotate: { label: "Rotation" }
			},
			antiDebug: {
				title: "Anti Debug",
				sub: "Security",
				tip: "Clear the page or redirect when a debug context is detected (security.baiduJs.enable)",
				description: "Handles devtools / automation per configured action; keep it off while debugging"
			},
			dynamicFont: {
				title: "Dynamic Font",
				sub: "Anti OCR",
				tip: "ReText renders text with a dynamic font to block OCR scraping (security.dynamicFont.enable)",
				description: "Used by ReText when no explicit prop is given"
			},
			ocrObfuscation: {
				title: "OCR Obfuscation",
				sub: "Anti Scraping",
				tip: "ReText renders text into canvas so page text cannot be scraped (security.ocrObfuscation.enable)",
				description: "Used by ReText when no explicit prop is given"
			}
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
		watermark: {
			enable: {
				title: "Enable Global Watermark",
				sub: "Security Watermark",
				tip: "Overlay user-identified watermark (anti-screenshot)",
				description: "Overlay user-identified watermark (anti-screenshot)"
			},
			placeholder: "Watermark text"
		},
		weather: { enable: {
			title: "Show Weather",
			sub: "Toolbar",
			tip: "Show weather info at top-right of toolbar",
			description: "Show current weather and weekly forecast"
		} },
		capability: {
			weather: {
				title: "Weather API",
				sub: "Backend Capability",
				tip: "Use /v2/weather/overview when the backend provides it (other.capabilities.weather)",
				description: "Probe the backend weather overview first and fall back to third-party sources; set false in app.yaml when the backend has no such API, otherwise every startup logs a probe 404"
			},
			location: {
				title: "Location API",
				sub: "Backend Capability",
				tip: "Let the backend resolve the location by source IP via /v2/location/resolve (other.capabilities.location)",
				description: "Probe the backend location API first, then fall back to browser geolocation / IP lookup / coordinates from app.yaml"
			},
			typhoon: {
				title: "Typhoon API",
				sub: "Backend Capability",
				tip: "Use /v2/typhoon/active when the backend provides it (other.capabilities.typhoon)",
				description: "Probe the backend typhoon API first and fall back to the third-party typhoon service; set false in app.yaml when the backend has no such API, otherwise every startup logs a probe 404"
			},
			ipLookup: {
				title: "IP Location",
				sub: "Backend Capability",
				tip: "Let the backend resolve an IP into a physical address via /v2/ip/lookup (other.capabilities.ipLookup)",
				description: "Request the backend to resolve missing IP addresses; set false in app.yaml when the backend has no such API to avoid pointless 404 requests"
			},
			holiday: {
				title: "Holiday API",
				sub: "Backend Capability",
				tip: "Trust the admin-maintained schedule from /v2/holiday/get when the backend provides it (other.capabilities.holiday)",
				description: "When enabled the home calendar prefers the holiday and makeup-workday dates delivered by the backend; dates the backend does not cover still fall back to the built-in table and the statutory-holiday act. Set false in app.yaml when the backend has no such API, otherwise every startup logs a probe 404"
			}
		},
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
		unpinMenu: "Unpin"
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
export { useI18n as i, i18n as n, translateConfigText as r, getMenuLanguage as t };
