import { t as isAndroid } from "./browser-DVA6k_z5.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/constants/aria.mjs
var EVENT_CODE = {
	tab: "Tab",
	enter: "Enter",
	space: "Space",
	left: "ArrowLeft",
	up: "ArrowUp",
	right: "ArrowRight",
	down: "ArrowDown",
	esc: "Escape",
	delete: "Delete",
	backspace: "Backspace",
	numpadEnter: "NumpadEnter",
	pageUp: "PageUp",
	pageDown: "PageDown",
	home: "Home",
	end: "End"
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/dom/event.mjs
var composeEventHandlers = (theirsHandler, oursHandler, { checkForDefaultPrevented = true } = {}) => {
	const handleEvent = (event) => {
		const shouldPrevent = theirsHandler?.(event);
		if (checkForDefaultPrevented === false || !shouldPrevent) return oursHandler?.(event);
	};
	return handleEvent;
};
var whenMouse = (handler) => {
	return (e) => e.pointerType === "mouse" ? handler(e) : void 0;
};
var getEventCode = (event) => {
	if (event.code && event.code !== "Unidentified") return event.code;
	const key = getEventKey(event);
	if (key) {
		if (Object.values(EVENT_CODE).includes(key)) return key;
		switch (key) {
			case " ": return EVENT_CODE.space;
			default: return "";
		}
	}
	return "";
};
var getEventKey = (event) => {
	let key = event.key && event.key !== "Unidentified" ? event.key : "";
	if (!key && event.type === "keyup" && isAndroid()) {
		const target = event.target;
		key = target.value.charAt(target.selectionStart - 1);
	}
	return key;
};
//#endregion
export { EVENT_CODE as a, whenMouse as i, getEventCode as n, getEventKey as r, composeEventHandlers as t };
