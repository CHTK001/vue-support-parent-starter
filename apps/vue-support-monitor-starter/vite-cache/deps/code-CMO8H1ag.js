import "./dist-B6GcL3C6.js";
import { n as decodeFileViewerTextBuffer } from "./textEncoding-M25CFHsg.js";
import { _ as unregisterFileViewerZoomProvider, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter } from "./fit-BmeG0j2O.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { a as shouldVirtualizeTextBuffer, o as codeStyle, r as renderLargeText } from "./largeText-ANT1HBYc.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/prettyPrint.js
var DEFAULT_PRETTY_PRINT_MAX_BYTES = 524288;
var htmlEmbeddedLanguagePattern = /<(?:script|style)(?:\s|>)/i;
var htmlScriptPattern = /<script(?:\s|>)/i;
var htmlStylePattern = /<style(?:\s|>)/i;
var withHtmlEmbeddedPlugins = (source) => {
	if (!htmlEmbeddedLanguagePattern.test(source)) return ["html"];
	const plugins = ["html"];
	if (htmlScriptPattern.test(source)) plugins.push("babel", "estree", "typescript");
	if (htmlStylePattern.test(source)) plugins.push("postcss");
	return plugins;
};
var prettierLanguages = {
	cjs: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	css: {
		parser: "css",
		plugins: ["postcss"]
	},
	graphql: {
		parser: "graphql",
		plugins: ["graphql"]
	},
	gql: {
		parser: "graphql",
		plugins: ["graphql"]
	},
	html: {
		parser: "html",
		plugins: ["html"],
		resolvePlugins: withHtmlEmbeddedPlugins
	},
	htm: {
		parser: "html",
		plugins: ["html"],
		resolvePlugins: withHtmlEmbeddedPlugins
	},
	ipynb: {
		parser: "json",
		plugins: ["babel", "estree"]
	},
	js: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	json: {
		parser: "json",
		plugins: ["babel", "estree"]
	},
	json5: {
		parser: "json5",
		plugins: ["babel", "estree"]
	},
	jsonc: {
		parser: "jsonc",
		plugins: ["babel", "estree"]
	},
	jsx: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	markdown: {
		parser: "markdown",
		plugins: ["markdown"]
	},
	md: {
		parser: "markdown",
		plugins: ["markdown"]
	},
	mjs: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	react: {
		parser: "babel",
		plugins: ["babel", "estree"]
	},
	ts: {
		parser: "typescript",
		plugins: ["typescript", "estree"]
	},
	tsx: {
		parser: "typescript",
		plugins: ["typescript", "estree"]
	},
	vue: {
		parser: "vue",
		plugins: [
			"html",
			"babel",
			"estree",
			"typescript",
			"postcss"
		]
	},
	xml: {
		parser: "xml",
		plugins: ["xml"],
		options: {
			xmlWhitespaceSensitivity: "preserve",
			xmlQuoteAttributes: "preserve",
			xmlSortAttributesByKey: false
		}
	},
	yaml: {
		parser: "yaml",
		plugins: ["yaml"]
	},
	yml: {
		parser: "yaml",
		plugins: ["yaml"]
	}
};
var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
var hasWhitespaceSensitiveXml = (source) => {
	if (/\bxml:space\s*=\s*(["'])preserve\1/i.test(source)) return true;
	const Parser = globalThis.DOMParser;
	if (typeof Parser !== "function") return true;
	try {
		const documentRef = new Parser().parseFromString(source, "application/xml");
		if (documentRef.querySelector("parsererror")) return false;
		const containsMixedContent = (element) => {
			var _a, _b, _c;
			if (((_a = element.getAttributeNS(XML_NAMESPACE, "space")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "preserve" || ((_b = element.getAttribute("xml:space")) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "preserve") return true;
			let hasElementChild = false;
			let hasDirectText = false;
			for (const child of Array.from(element.childNodes)) if (child.nodeType === 1) {
				hasElementChild = true;
				if (containsMixedContent(child)) return true;
			} else if ((child.nodeType === 3 || child.nodeType === 4) && ((_c = child.textContent) === null || _c === void 0 ? void 0 : _c.trim())) hasDirectText = true;
			return hasElementChild && hasDirectText;
		};
		return documentRef.documentElement ? containsMixedContent(documentRef.documentElement) : false;
	} catch {
		return false;
	}
};
var pluginLoaders = {
	babel: () => import("./babel-7m1OmRSH.js").then((module) => module.default),
	estree: () => import("./estree-DdNuV8TI.js").then((module) => module.default),
	typescript: () => import("./typescript-CMe8J1yj.js").then((module) => module.default),
	postcss: () => import("./postcss-B5dDJOz2.js").then((module) => module.default),
	html: () => import("./html-NMawjeQ6.js").then((module) => module.default),
	markdown: () => import("./markdown-DW6n_dx4.js").then((module) => module.default),
	yaml: () => import("./yaml-BEEMG2dX.js").then((module) => module.default),
	graphql: () => import("./graphql-BSwq3BVU.js").then((module) => module.default),
	xml: () => import("./plugin-DgCPbLgw.js").then((module) => module.default)
};
var loadPrettierRuntime = async (definition, source) => {
	var _a, _b;
	const prettierPromise = import("./standalone-DQnok__B.js");
	const pluginNames = (_b = (_a = definition.resolvePlugins) === null || _a === void 0 ? void 0 : _a.call(definition, source)) !== null && _b !== void 0 ? _b : definition.plugins;
	const [prettier, ...plugins] = await Promise.all([prettierPromise, ...pluginNames.map((pluginName) => pluginLoaders[pluginName]())]);
	return {
		format: prettier.format,
		plugins
	};
};
var utf8ByteLength = (source) => new TextEncoder().encode(source).byteLength;
var resolveFileViewerPrettyPrintMaxBytes = (options) => {
	var _a;
	const configured = (_a = options === null || options === void 0 ? void 0 : options.prettyPrintMaxBytes) !== null && _a !== void 0 ? _a : options === null || options === void 0 ? void 0 : options.virtualizeAboveBytes;
	if (!Number.isFinite(configured)) return DEFAULT_PRETTY_PRINT_MAX_BYTES;
	return Math.max(0, Math.trunc(Number(configured)));
};
var supportsFileViewerPrettyPrint = (extension) => {
	return Boolean(prettierLanguages[extension.trim().toLowerCase()]);
};
/**
* Formats a decoded display representation without mutating the source buffer.
*
* Parser support and byte limits are resolved before the Prettier runtime or
* any parser plugin is imported. Failures intentionally return the original
* source so malformed or unsupported uploads remain previewable.
*/
var formatFileViewerTextForDisplay = async (source, extension, options, signal, runtimeLoader = loadPrettierRuntime) => {
	const maxBytes = resolveFileViewerPrettyPrintMaxBytes(options);
	const sourceByteLength = utf8ByteLength(source);
	if ((options === null || options === void 0 ? void 0 : options.prettyPrint) !== true) return {
		text: source,
		formatted: false,
		reason: "disabled",
		sourceByteLength,
		maxBytes
	};
	const definition = prettierLanguages[extension.trim().toLowerCase()];
	if (!definition) return {
		text: source,
		formatted: false,
		reason: "unsupported",
		sourceByteLength,
		maxBytes
	};
	if (sourceByteLength > maxBytes) return {
		text: source,
		formatted: false,
		reason: "too-large",
		parser: definition.parser,
		sourceByteLength,
		maxBytes
	};
	if (signal === null || signal === void 0 ? void 0 : signal.aborted) return {
		text: source,
		formatted: false,
		reason: "aborted",
		parser: definition.parser,
		sourceByteLength,
		maxBytes
	};
	if (definition.parser === "xml" && hasWhitespaceSensitiveXml(source)) return {
		text: source,
		formatted: false,
		reason: "whitespace-sensitive",
		parser: definition.parser,
		sourceByteLength,
		maxBytes
	};
	try {
		const runtime = await runtimeLoader(definition, source);
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return {
			text: source,
			formatted: false,
			reason: "aborted",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
		const formatted = await runtime.format(source, {
			parser: definition.parser,
			plugins: runtime.plugins,
			tabWidth: 2,
			useTabs: false,
			printWidth: 80,
			endOfLine: "lf",
			...definition.options
		});
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return {
			text: source,
			formatted: false,
			reason: "aborted",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
		return {
			text: formatted.replace(/\n$/, ""),
			formatted: true,
			reason: "formatted",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
	} catch {
		return {
			text: source,
			formatted: false,
			reason: "failed",
			parser: definition.parser,
			sourceByteLength,
			maxBytes
		};
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-text@3.1.2/node_modules/@file-viewer/renderer-text/dist/code.js
var languageMap = {
	bash: "bash",
	c: "cpp",
	cc: "cpp",
	cjs: "javascript",
	cpp: "cpp",
	cs: "csharp",
	css: "css",
	diff: "diff",
	patch: "diff",
	bundle: "plaintext",
	bdl: "plaintext",
	gv: "plaintext",
	go: "go",
	graphql: "graphql",
	gql: "graphql",
	h: "cpp",
	hcl: "plaintext",
	hpp: "cpp",
	html: "xml",
	htm: "xml",
	http: "http",
	ini: "ini",
	ipynb: "json",
	java: "java",
	js: "javascript",
	json: "json",
	json5: "json",
	jsonc: "json",
	jsx: "javascript",
	kt: "kotlin",
	log: "plaintext",
	md: "markdown",
	markdown: "markdown",
	mjs: "javascript",
	php: "php",
	proto: "protobuf",
	py: "python",
	rb: "ruby",
	react: "javascript",
	rs: "rust",
	sh: "bash",
	sql: "sql",
	swift: "swift",
	tex: "latex",
	toml: "ini",
	ts: "typescript",
	tsx: "typescript",
	txt: "plaintext",
	vue: "xml",
	xml: "xml",
	yaml: "yaml",
	yml: "yaml"
};
var languageLoaders = {
	bash: () => import("./bash-ek8NzA6o.js"),
	cpp: () => import("./cpp-C0Fm168c.js"),
	csharp: () => import("./csharp-Dh6NE0fJ.js"),
	css: () => import("./css-6G0gJfYH.js"),
	diff: () => import("./diff-B_FOk4aO.js"),
	go: () => import("./go-5ZsQbGwN.js"),
	graphql: () => import("./graphql-BBQjT3lA.js"),
	http: () => import("./http-DUajez4s.js"),
	ini: () => import("./ini-CClNMtWg.js"),
	java: () => import("./java-B5BN2Nlk.js"),
	javascript: () => import("./javascript-C5bckpYW.js"),
	json: () => import("./json-QkX-bpR1.js"),
	kotlin: () => import("./kotlin-BALtdBHM.js"),
	latex: () => import("./latex-DXGJOZGf.js"),
	markdown: () => import("./markdown-DetLIoVv.js"),
	php: () => import("./php-Bt_vzcTF.js"),
	protobuf: () => import("./protobuf-BNsboRN8.js"),
	python: () => import("./python-B8SaiB52.js"),
	ruby: () => import("./ruby-BgW5vBSO.js"),
	rust: () => import("./rust-2ksLdyQs.js"),
	sql: () => import("./sql-BND2vroa.js"),
	swift: () => import("./swift-B9Kr7a1U.js"),
	typescript: () => import("./typescript-DJHzmdOV.js"),
	xml: () => import("./xml-V0L-6TN8.js"),
	yaml: () => import("./yaml-CR_QcmZG.js")
};
var highlighterPromise = null;
var registeredLanguages = /* @__PURE__ */ new Set();
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = codeStyle;
	return style;
};
var resolveLanguage = (type) => {
	return languageMap[type.trim().toLowerCase()] || "plaintext";
};
var escapeHtml = (value) => {
	return value.replace(/[&<>"']/g, (char) => {
		return {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		}[char];
	});
};
var loadHighlighter = async () => {
	if (!highlighterPromise) highlighterPromise = import("./core-Dk1zawR-.js").then((module) => module.default);
	return highlighterPromise;
};
var registerLanguageOnce = async (hljs, name) => {
	if (registeredLanguages.has(name)) return true;
	const loader = languageLoaders[name];
	if (!loader) return false;
	const { default: language } = await loader();
	hljs.registerLanguage(name, language);
	registeredLanguages.add(name);
	return true;
};
var clampZoom = (value) => {
	return Math.min(2.6, Math.max(.6, Number(value.toFixed(2))));
};
var lineCountOf = (value) => {
	return value.split(/\r\n|\r|\n/).length;
};
var createLineNumberText = (lineCount) => {
	return Array.from({ length: lineCount }, (_, index) => String(index + 1)).join("\n");
};
var createWrappedSourceLine = (documentRef, lineNumber) => {
	const row = createElement(documentRef, "span", "code-source-line");
	row.dataset.line = String(lineNumber);
	const number = createElement(documentRef, "span", "code-source-line-number", String(lineNumber));
	number.setAttribute("aria-hidden", "true");
	const content = createElement(documentRef, "span", "code-source-line-content");
	row.append(number, content);
	return {
		row,
		content
	};
};
/**
* Splits trusted highlight.js markup into logical source-line wrappers while
* recreating active token spans after every newline. This keeps multiline
* comments and strings highlighted without coupling visual wrapping to source
* line numbers.
*/
var mountWrappedHighlightedLines = (code, highlightedHtml, expectedLineCount) => {
	const documentRef = code.ownerDocument;
	const staging = createElement(documentRef, "span");
	staging.innerHTML = highlightedHtml;
	const lines = [createWrappedSourceLine(documentRef, 1)];
	let lineIndex = 0;
	const activeElements = [];
	let activeClones = [];
	const currentContent = () => lines[lineIndex].content;
	const currentParent = () => {
		var _a;
		return (_a = activeClones[activeClones.length - 1]) !== null && _a !== void 0 ? _a : currentContent();
	};
	const continueOnNextLine = () => {
		lineIndex += 1;
		lines.push(createWrappedSourceLine(documentRef, lineIndex + 1));
		let parent = currentContent();
		activeClones = activeElements.map((element) => {
			const clone = element.cloneNode(false);
			parent.append(clone);
			parent = clone;
			return clone;
		});
	};
	const visit = (node) => {
		var _a;
		if (node.nodeType === 3) {
			const parts = ((_a = node.textContent) !== null && _a !== void 0 ? _a : "").split(/\r\n|\r|\n/);
			parts.forEach((part, index) => {
				if (part) currentParent().append(documentRef.createTextNode(part));
				if (index < parts.length - 1) continueOnNextLine();
			});
			return;
		}
		if (node.nodeType !== 1) return;
		const element = node;
		const clone = element.cloneNode(false);
		currentParent().append(clone);
		activeElements.push(element);
		activeClones.push(clone);
		Array.from(element.childNodes).forEach(visit);
		activeElements.pop();
		activeClones.pop();
	};
	Array.from(staging.childNodes).forEach(visit);
	while (lines.length < expectedLineCount) lines.push(createWrappedSourceLine(documentRef, lines.length + 1));
	code.replaceChildren(...lines.map((line) => line.row));
};
var mountCodeMarkup = (pre, code, highlightedHtml, lineCount, showLineNumbers, wrapLongLines) => {
	code.replaceChildren();
	if (showLineNumbers && wrapLongLines) {
		pre.className = "code-area code-area--wrapped-line-numbers";
		pre.replaceChildren(code);
		mountWrappedHighlightedLines(code, highlightedHtml, lineCount);
		return;
	}
	pre.className = showLineNumbers ? "code-area code-area--line-numbers" : "code-area";
	if (showLineNumbers) {
		const gutter = createElement(pre.ownerDocument, "span", "code-line-numbers", createLineNumberText(lineCount));
		gutter.setAttribute("aria-hidden", "true");
		pre.replaceChildren(gutter, code);
	} else pre.replaceChildren(code);
	code.innerHTML = highlightedHtml;
};
var canPossiblyFitDecodedPrettyPrintLimit = (buffer, maxBytes) => {
	return buffer.byteLength <= maxBytes * 2 + 4;
};
/**
* Framework-neutral text/code renderer.
*
* highlight.js core, Prettier standalone, and parser definitions are loaded
* lazily by format. HTML and XML are always mounted as escaped source text and
* never executed as real DOM.
*/
async function renderText(buffer, target, type, context) {
	var _a, _b;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const extension = type || "txt";
	const normalizedExtension = extension.trim().toLowerCase();
	const textOptions = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.text;
	let sourceText;
	let prettyPrintResult;
	if ((textOptions === null || textOptions === void 0 ? void 0 : textOptions.prettyPrint) === true && supportsFileViewerPrettyPrint(normalizedExtension) && canPossiblyFitDecodedPrettyPrintLimit(buffer, resolveFileViewerPrettyPrintMaxBytes(textOptions))) {
		sourceText = decodeFileViewerTextBuffer(buffer, textOptions.encoding).text;
		prettyPrintResult = await formatFileViewerTextForDisplay(sourceText, normalizedExtension, textOptions, context === null || context === void 0 ? void 0 : context.signal);
	}
	if (!(prettyPrintResult === null || prettyPrintResult === void 0 ? void 0 : prettyPrintResult.formatted) && normalizedExtension !== "bundle" && normalizedExtension !== "bdl" && shouldVirtualizeTextBuffer(buffer, context)) return renderLargeText(buffer, target, extension, context);
	if (normalizedExtension === "patch") {
		const { default: renderPatch } = await import("./patch-BIc2oKCq.js");
		return renderPatch(buffer, target, extension, context);
	}
	if (normalizedExtension === "bundle" || normalizedExtension === "bdl") {
		const { default: renderGitBundle } = await import("./gitBundle-7R0K-hCv.js");
		return renderGitBundle(buffer, target, extension, context);
	}
	const originalText = sourceText !== null && sourceText !== void 0 ? sourceText : decodeFileViewerTextBuffer(buffer, textOptions === null || textOptions === void 0 ? void 0 : textOptions.encoding).text;
	const formattedText = (prettyPrintResult === null || prettyPrintResult === void 0 ? void 0 : prettyPrintResult.formatted) ? prettyPrintResult.text : null;
	const language = resolveLanguage(extension);
	const showToolbar = (textOptions === null || textOptions === void 0 ? void 0 : textOptions.toolbar) !== false;
	const showLineNumbers = (textOptions === null || textOptions === void 0 ? void 0 : textOptions.lineNumbers) === true;
	const wrapLongLines = (textOptions === null || textOptions === void 0 ? void 0 : textOptions.wrapLongLines) === true;
	const documentRef = target.ownerDocument;
	let disposed = false;
	let zoom = 1;
	let showingFormatted = formattedText !== null;
	let renderGeneration = 0;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const root = createElement(documentRef, "div", wrapLongLines ? "code-viewer code-viewer--wrap-lines" : "code-viewer");
	root.dataset.viewerZoomProvider = "code";
	root.dataset.textToolbar = String(showToolbar);
	root.dataset.lineNumbers = String(showLineNumbers);
	root.dataset.wrapLongLines = String(wrapLongLines);
	root.dataset.prettyPrint = (_b = prettyPrintResult === null || prettyPrintResult === void 0 ? void 0 : prettyPrintResult.reason) !== null && _b !== void 0 ? _b : "disabled";
	const toolbar = createElement(documentRef, "div", "code-toolbar");
	const extensionLabel = createElement(documentRef, "span", "", extension.toUpperCase());
	const toolbarMeta = createElement(documentRef, "div", "code-toolbar-meta");
	const representationStatus = createElement(documentRef, "span", "code-format-status");
	const representationToggle = createElement(documentRef, "button", "code-format-toggle");
	representationToggle.type = "button";
	const lineSummary = createElement(documentRef, "strong");
	toolbarMeta.append(representationStatus, representationToggle, lineSummary);
	toolbar.append(extensionLabel, toolbarMeta);
	const pre = createElement(documentRef, "pre", "code-area");
	const code = createElement(documentRef, "code", `hljs language-${language}`);
	pre.append(code);
	if (showToolbar) root.append(toolbar);
	root.append(pre);
	root.style.setProperty("--code-font-size", `${13 * zoom}px`);
	target.replaceChildren(createStyle(documentRef), root);
	const currentText = () => showingFormatted && formattedText !== null ? formattedText : originalText;
	const syncRepresentationControls = (lineCount) => {
		const formatted = showingFormatted && formattedText !== null;
		root.dataset.textRepresentation = formatted ? "formatted" : "source";
		lineSummary.textContent = `${lineCount} lines`;
		representationStatus.hidden = !formatted;
		representationStatus.textContent = formatted ? t("text.code.formattedPreview") : "";
		representationToggle.hidden = formattedText === null;
		representationToggle.textContent = formatted ? t("text.code.showOriginal") : t("text.code.showFormatted");
		representationToggle.setAttribute("aria-pressed", String(formatted));
	};
	const renderCurrentRepresentation = async () => {
		const generation = renderGeneration + 1;
		renderGeneration = generation;
		const text = currentText();
		const lineCount = lineCountOf(text);
		syncRepresentationControls(lineCount);
		if (language === "plaintext") {
			mountCodeMarkup(pre, code, escapeHtml(text), lineCount, showLineNumbers, wrapLongLines);
			return;
		}
		code.textContent = t("text.code.loadingHighlight");
		try {
			const hljs = await loadHighlighter();
			const hasLanguage = await registerLanguageOnce(hljs, language);
			if (disposed || generation !== renderGeneration) return;
			const highlighted = hasLanguage ? hljs.highlight(text, {
				language,
				ignoreIllegals: true
			}).value : escapeHtml(text);
			mountCodeMarkup(pre, code, highlighted, lineCount, showLineNumbers, wrapLongLines);
		} catch {
			if (!disposed && generation === renderGeneration) mountCodeMarkup(pre, code, escapeHtml(text), lineCount, showLineNumbers, wrapLongLines);
		}
	};
	const toggleRepresentation = () => {
		if (formattedText === null) return;
		showingFormatted = !showingFormatted;
		renderCurrentRepresentation();
	};
	representationToggle.addEventListener("click", toggleRepresentation);
	await renderCurrentRepresentation();
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 2.6,
		canZoomOut: zoom > .6,
		canReset: zoom !== 1,
		minScale: .6,
		maxScale: 2.6
	});
	const setZoom = (scale) => {
		zoom = clampZoom(scale);
		root.style.setProperty("--code-font-size", `${13 * zoom}px`);
		zoomEmitter.emit();
		return getZoomState();
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	return {
		$el: target,
		unmount() {
			disposed = true;
			renderGeneration += 1;
			representationToggle.removeEventListener("click", toggleRepresentation);
			unregisterFileViewerZoomProvider(root);
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderText as t };
