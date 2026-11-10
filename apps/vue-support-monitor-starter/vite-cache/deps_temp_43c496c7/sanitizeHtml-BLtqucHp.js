import "./dist-B6GcL3C6.js";
import { n as sanitizeFileViewerSvgResources } from "./svgResources-k6X774NV.js";
import { t as purify } from "./purify.es-CB-mAamt.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/sanitizeHtml.js
var safeUrl = (value) => {
	var _a, _b;
	const scheme = (_b = (_a = value.trim().replace(/[\u0000-\u0020\u007f-\u009f]/g, "").match(/^([a-z][a-z0-9+.-]*):/i)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.toLowerCase();
	return !scheme || [
		"http",
		"https",
		"mailto",
		"tel"
	].includes(scheme);
};
var sanitizeFileViewerRichHtml = (documentRef, html, options = {}) => {
	const fallback = () => {
		const fragment = documentRef.createDocumentFragment();
		fragment.append(documentRef.createTextNode(html));
		return fragment;
	};
	const windowRef = documentRef.defaultView;
	if (!windowRef) return fallback();
	const purifier = purify(windowRef);
	if (!purifier.isSupported) return fallback();
	const fragment = purifier.sanitize(html, {
		RETURN_DOM_FRAGMENT: true,
		USE_PROFILES: options.allowSvg ? {
			html: true,
			svg: true,
			svgFilters: true
		} : { html: true },
		ADD_ATTR: ["target"],
		FORBID_TAGS: [
			"base",
			"embed",
			"form",
			"iframe",
			"object",
			"script",
			"style",
			"template"
		],
		FORBID_ATTR: [
			"action",
			"formaction",
			"srcdoc",
			"style"
		]
	});
	fragment.querySelectorAll("*").forEach((element) => {
		for (const attribute of Array.from(element.attributes)) if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
	});
	fragment.querySelectorAll("a[href]").forEach((anchor) => {
		if (!safeUrl(anchor.getAttribute("href") || "")) anchor.removeAttribute("href");
		if ((anchor.getAttribute("target") || "").toLowerCase() === "_blank") anchor.rel = "noopener noreferrer";
	});
	if (options.allowSvg) sanitizeFileViewerSvgResources(fragment);
	return fragment;
};
//#endregion
export { sanitizeFileViewerRichHtml as t };
