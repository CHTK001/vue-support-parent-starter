import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import "./dist-B6GcL3C6.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { n as sanitizeFileViewerSvgResources, t as assertFileViewerMermaidSourceHasNoExternalResources } from "./svgResources-k6X774NV.js";
import { t as purify } from "./purify.es-CB-mAamt.js";
import { t as Panzoom } from "./panzoom.es-rYwl_FCq.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/sanitize.js
var purifierByDocument = /* @__PURE__ */ new WeakMap();
var getPurifier = (documentRef) => {
	const cached = purifierByDocument.get(documentRef);
	if (cached) return cached;
	const windowRef = documentRef.defaultView;
	if (!windowRef) return null;
	const purifier = purify(windowRef);
	if (!purifier.isSupported) return null;
	purifierByDocument.set(documentRef, purifier);
	return purifier;
};
var sanitizeDrawingSvg = (documentRef, svg, invalidMessage = "Unable to parse SVG safely.") => {
	const purifier = getPurifier(documentRef);
	if (!purifier) throw new Error(invalidMessage);
	const fragment = purifier.sanitize(svg, {
		RETURN_DOM_FRAGMENT: true,
		USE_PROFILES: {
			svg: true,
			svgFilters: true
		},
		FORBID_TAGS: [
			"script",
			"iframe",
			"object",
			"embed",
			"form",
			"foreignObject"
		],
		FORBID_ATTR: ["srcdoc"]
	});
	sanitizeFileViewerSvgResources(fragment);
	const root = fragment.querySelector("svg");
	if (!root) throw new Error(invalidMessage);
	return documentRef.importNode(root, true);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/diagram.js
var getOwnerWindow = (documentRef) => {
	return documentRef.defaultView || (typeof window !== "undefined" ? window : void 0);
};
var isDarkTheme = (documentRef, theme) => {
	if (theme === "dark") return true;
	if (theme === "light") return false;
	return Boolean(getOwnerWindow(documentRef)?.matchMedia?.("(prefers-color-scheme: dark)").matches);
};
var createElement = (documentRef, tagName, className) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	return element;
};
var normalizePlantumlServer = (documentRef, value) => {
	const base = value;
	const normalized = base.endsWith("/") ? base : `${base}/`;
	try {
		return new URL(normalized, documentRef.baseURI).href;
	} catch {
		return normalized;
	}
};
var renderMermaidSvg = async (documentRef, text, theme, t) => {
	assertFileViewerMermaidSourceHasNoExternalResources(text);
	const mermaid = (await import("./mermaid.core-CLZ12Z87.js")).default;
	const id = `file-viewer-mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		htmlLabels: false,
		theme: isDarkTheme(documentRef, theme) ? "dark" : "default"
	});
	return sanitizeDrawingSvg(documentRef, (await mermaid.render(id, text)).svg, t("drawing.error.svgParseFailed"));
};
var appendSvgText = (documentRef, parent, text, x, dy, weight = "500") => {
	const line = documentRef.createElementNS("http://www.w3.org/2000/svg", "tspan");
	line.setAttribute("x", String(x));
	line.setAttribute("dy", dy);
	line.setAttribute("font-weight", weight);
	line.textContent = text;
	parent.appendChild(line);
};
var renderPlantumlFallbackSvg = (documentRef, text, message) => {
	const width = 1100;
	const height = 720;
	const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
	svg.setAttribute("width", String(width));
	svg.setAttribute("height", String(height));
	const background = documentRef.createElementNS("http://www.w3.org/2000/svg", "rect");
	background.setAttribute("width", "100%");
	background.setAttribute("height", "100%");
	background.setAttribute("rx", "28");
	background.setAttribute("fill", "#f8fbff");
	svg.appendChild(background);
	const panel = documentRef.createElementNS("http://www.w3.org/2000/svg", "rect");
	panel.setAttribute("x", "42");
	panel.setAttribute("y", "42");
	panel.setAttribute("width", String(1016));
	panel.setAttribute("height", String(636));
	panel.setAttribute("rx", "22");
	panel.setAttribute("fill", "#ffffff");
	panel.setAttribute("stroke", "#cbd5e1");
	svg.appendChild(panel);
	const title = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
	title.setAttribute("x", "74");
	title.setAttribute("y", "92");
	title.setAttribute("fill", "#0f766e");
	title.setAttribute("font-family", "Inter, Arial, sans-serif");
	title.setAttribute("font-size", "24");
	title.setAttribute("font-weight", "800");
	title.textContent = "PlantUML source preview";
	svg.appendChild(title);
	const note = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
	note.setAttribute("x", "74");
	note.setAttribute("y", "128");
	note.setAttribute("fill", "#64748b");
	note.setAttribute("font-family", "Inter, Arial, sans-serif");
	note.setAttribute("font-size", "15");
	note.textContent = message;
	svg.appendChild(note);
	const source = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
	source.setAttribute("x", "74");
	source.setAttribute("y", "172");
	source.setAttribute("fill", "#172033");
	source.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace");
	source.setAttribute("font-size", "16");
	source.setAttribute("xml:space", "preserve");
	const lines = text.replace(/\r\n?/g, "\n").split("\n").slice(0, 26);
	lines.forEach((line, index) => {
		appendSvgText(documentRef, source, line.slice(0, 110), 74, index === 0 ? "0" : "24", /^\s*@/.test(line) ? "800" : "500");
	});
	if (lines.length < text.split("\n").length) appendSvgText(documentRef, source, "... truncated for preview ...", 74, "24", "700");
	svg.appendChild(source);
	return svg;
};
var renderPlantumlSvg = async (documentRef, text, options, t) => {
	if (!options?.plantumlServerUrl) return renderPlantumlFallbackSvg(documentRef, text, "Offline mode is active. Configure options.drawing.plantumlServerUrl for server-rendered PlantUML SVG.");
	const { encode } = await import("./browser-index-Dx12-06F.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
	const url = `${normalizePlantumlServer(documentRef, options.plantumlServerUrl)}${encode(text)}`;
	const ownerWindow = getOwnerWindow(documentRef);
	const controller = new AbortController();
	const timeout = ownerWindow?.setTimeout(() => controller.abort(), Math.max(1e3, options?.plantumlTimeoutMs || 8e3));
	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) throw new Error(t("drawing.error.plantumlRenderFailed", { status: response.status }));
		return sanitizeDrawingSvg(documentRef, await response.text(), t("drawing.error.svgParseFailed"));
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") throw error;
		return renderPlantumlFallbackSvg(documentRef, text, "Configure options.drawing.plantumlServerUrl for full PlantUML SVG rendering.");
	} finally {
		if (timeout !== void 0) ownerWindow?.clearTimeout(timeout);
	}
};
var applySvgDefaults = (svg, kind) => {
	svg.classList.add("drawing-svg", "drawing-diagram-svg");
	svg.setAttribute("role", "img");
	svg.setAttribute("aria-label", `${kind} diagram preview`);
	if (!svg.getAttribute("width") && svg.viewBox.baseVal.width) svg.setAttribute("width", String(Math.ceil(svg.viewBox.baseVal.width)));
	if (!svg.getAttribute("height") && svg.viewBox.baseVal.height) svg.setAttribute("height", String(Math.ceil(svg.viewBox.baseVal.height)));
};
var renderDiagram = async ({ documentRef, text, target, kind, options, theme, viewerOptions }) => {
	const t = createFileViewerTranslator(viewerOptions);
	const shell = createElement(documentRef, "div", "drawing-diagram-shell");
	const panTarget = createElement(documentRef, "div", "drawing-diagram-pan");
	shell.appendChild(panTarget);
	target.replaceChildren(shell);
	const svg = kind === "mermaid" ? await renderMermaidSvg(documentRef, text, theme, t) : await renderPlantumlSvg(documentRef, text, options, t);
	applySvgDefaults(svg, kind);
	panTarget.replaceChildren(svg);
	const panzoom = Panzoom(panTarget, {
		minScale: .4,
		maxScale: 4,
		contain: "outside",
		canvas: true
	});
	const wheelTarget = shell.parentElement || shell;
	const handleWheel = (event) => {
		if (!event.ctrlKey && !event.metaKey) return;
		event.preventDefault();
		panzoom.zoomWithWheel(event);
	};
	wheelTarget.addEventListener("wheel", handleWheel, { passive: false });
	return {
		setZoom(scale) {
			panzoom.zoom(scale, { animate: true });
		},
		reset() {
			panzoom.reset({ animate: true });
		},
		getScale() {
			return panzoom.getScale();
		},
		destroy() {
			wheelTarget.removeEventListener("wheel", handleWheel);
			panzoom.destroy();
		}
	};
};
//#endregion
export { renderDiagram };
