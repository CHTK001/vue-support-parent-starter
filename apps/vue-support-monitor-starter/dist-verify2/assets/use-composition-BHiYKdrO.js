import { Bn as isFunction, Ht as watch, L as getCurrentInstance, On as unref, tt as nextTick, vn as ref, xn as shallowRef } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { u as useEventListener } from "./dist-Clzx2YUA.js";
import { i as isFocusable } from "./aria-DKP9Ei-1.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-focus-controller/index.mjs
function useFocusController(target, { disabled, beforeFocus, afterFocus, beforeBlur, afterBlur } = {}) {
	const { emit } = getCurrentInstance();
	const wrapperRef = shallowRef();
	const isFocused = ref(false);
	const handleFocus = (event) => {
		const cancelFocus = isFunction(beforeFocus) ? beforeFocus(event) : false;
		if (unref(disabled) || isFocused.value || cancelFocus) return;
		isFocused.value = true;
		emit("focus", event);
		afterFocus?.();
	};
	const handleBlur = (event) => {
		const cancelBlur = isFunction(beforeBlur) ? beforeBlur(event) : false;
		if (unref(disabled) || event.relatedTarget && wrapperRef.value?.contains(event.relatedTarget) || cancelBlur) return;
		isFocused.value = false;
		emit("blur", event);
		afterBlur?.();
	};
	const handleClick = (event) => {
		if (unref(disabled) || isFocusable(event.target) || wrapperRef.value?.contains(document.activeElement) && wrapperRef.value !== document.activeElement) return;
		target.value?.focus();
	};
	watch([wrapperRef, () => unref(disabled)], ([el, disabled]) => {
		if (!el) return;
		if (disabled) el.removeAttribute("tabindex");
		else el.setAttribute("tabindex", "-1");
	});
	useEventListener(wrapperRef, "focus", handleFocus, true);
	useEventListener(wrapperRef, "blur", handleBlur, true);
	useEventListener(wrapperRef, "click", handleClick, true);
	return {
		isFocused,
		/** Avoid using wrapperRef and handleFocus/handleBlur together */
		wrapperRef,
		handleFocus,
		handleBlur
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-composition/index.mjs
function useComposition({ afterComposition, emit }) {
	const isComposing = ref(false);
	const handleCompositionStart = (event) => {
		emit?.("compositionstart", event);
		isComposing.value = true;
	};
	const handleCompositionUpdate = (event) => {
		emit?.("compositionupdate", event);
		isComposing.value = true;
	};
	const handleCompositionEnd = (event) => {
		emit?.("compositionend", event);
		if (isComposing.value) {
			isComposing.value = false;
			nextTick(() => afterComposition(event));
		}
	};
	const handleComposition = (event) => {
		event.type === "compositionend" ? handleCompositionEnd(event) : handleCompositionUpdate(event);
	};
	return {
		isComposing,
		handleComposition,
		handleCompositionStart,
		handleCompositionUpdate,
		handleCompositionEnd
	};
}
//#endregion
export { useFocusController as n, useComposition as t };
