const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/lib-B8jGCOkb.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/base64-js-DFqkKNNm.js"])))=>i.map(i=>d[i]);
import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { dr as disposeFileViewerRendered, ho as createFileViewerTranslator, ud as __vitePreload, vo as resolveFileViewerLocale, wc as DEFAULT_RENDERER_DEFINITIONS, yn as resolveFileViewerColorScheme } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/emailHtml.js
var normalizeEmailResourceId = (value) => {
	const isUri = /^cid:/i.test(value.trim());
	let result = value.trim().replace(/^cid:/i, "").replace(/^<|>$/g, "");
	if (isUri) try {
		result = decodeURIComponent(result);
	} catch {}
	return result;
};
/** Sandboxed srcdoc cannot read blob:null URLs from a different opaque
* origin (file:// WebViews, data: hosts). Keep ordinary hosts zero-copy and use
* a bounded data URL only for those hosts or browsers without object URLs.
*/
function createEmailImageResource(buffer, mimeType, objectUrls) {
	if (typeof URL.createObjectURL === "function") {
		const url = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
		if (!url.startsWith("blob:null/")) {
			objectUrls.push(url);
			return url;
		}
		URL.revokeObjectURL(url);
	}
	const bytes = new Uint8Array(buffer);
	const parts = [];
	for (let offset = 0; offset < bytes.length; offset += 24576) parts.push(btoa(String.fromCharCode(...bytes.subarray(offset, offset + 24576))));
	return `data:${mimeType};base64,${parts.join("")}`;
}
var ALLOWED_TAGS = new Set("a abbr address article aside b bdi bdo big blockquote br caption center cite code col colgroup dd del details div dl dt em figcaption figure font footer h1 h2 h3 h4 h5 h6 header hr i img ins kbd label li main mark ol p pre q rp rt ruby s samp section small span strike strong style sub summary sup table tbody td tfoot th thead time title tr tt u ul var wbr".split(" "));
var DROP_CONTENT = new Set("script iframe frame frameset object embed applet svg math template noscript audio video source track input link meta base".split(" "));
var ALLOWED_ATTRS = new Set("alt title class id style width height align valign bgcolor color face size border cellpadding cellspacing colspan rowspan dir lang role aria-label scope start type value open name text".split(" "));
var SAFE_IMAGE = /^data:image\/(?:png|jpeg|gif|webp|avif|bmp);base64,[a-z0-9+/=\r\n]+$/i;
function createEmailHtmlDocument(html, resources, darkMode = false, documentRef = document) {
	var _a, _b;
	if (html.length > 33554432) throw new Error("Email HTML exceeds the safety limit.");
	const inertDocument = documentRef.createElement("template").content.ownerDocument;
	if (inertDocument.defaultView) throw new Error("Email parsing requires an inert template document.");
	const parsed = inertDocument.createElement("html");
	parsed.innerHTML = html;
	const rootAttributes = (_a = /^\s*(?:<!doctype[^>]*>\s*)?<html\b((?:[^>"']|"[^"]*"|'[^']*')*)>/i.exec(html.slice(0, 16384))) === null || _a === void 0 ? void 0 : _a[1];
	if (rootAttributes) {
		const probe = inertDocument.createElement("div");
		probe.innerHTML = `<div${rootAttributes}></div>`;
		for (const name of ["lang", "dir"]) {
			const value = (_b = probe.firstElementChild) === null || _b === void 0 ? void 0 : _b.getAttribute(name);
			if (value) parsed.setAttribute(name, value);
		}
	}
	const head = parsed.querySelector("head") || inertDocument.createElement("head");
	const body = parsed.querySelector("body") || inertDocument.createElement("body");
	const ownedUrls = new Set(resources.values());
	const lookup = (value) => {
		const trimmed = value.trim();
		if (ownedUrls.has(trimmed) && /^blob:/.test(trimmed)) return trimmed;
		if (SAFE_IMAGE.test(trimmed)) return trimmed;
		const key = normalizeEmailResourceId(trimmed);
		let exact = resources.get(key);
		if (!exact && !/^cid:/i.test(trimmed)) try {
			exact = resources.get(decodeURIComponent(key));
		} catch {}
		if (exact && (/^blob:/.test(exact) || SAFE_IMAGE.test(exact))) return exact;
		if (/^cid:/i.test(trimmed)) {
			const matches = [...resources].filter(([id]) => id.toLowerCase() === key.toLowerCase());
			if (matches.length === 1 && (/^blob:/.test(matches[0][1]) || SAFE_IMAGE.test(matches[0][1]))) return matches[0][1];
		}
	};
	let expandedResourceCharacters = 0;
	const resource = (value) => {
		const resolved = lookup(value);
		if (resolved) {
			expandedResourceCharacters += resolved.length;
			if (expandedResourceCharacters > 50331648) throw new Error("Email inline resource expansion limit exceeded.");
		}
		return resolved;
	};
	const css = (value) => value.replace(/@import\s+(?:url\([^)]*\)|[^;]*);?/gi, "").replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi, (_match, double, single, bare) => {
		var _a, _b;
		const resolved = resource(String((_b = (_a = double !== null && double !== void 0 ? double : single) !== null && _a !== void 0 ? _a : bare) !== null && _b !== void 0 ? _b : ""));
		return resolved ? `url("${resolved.replace(/["\\\r\n]/g, "")}")` : "none";
	});
	const attributes = (element) => {
		const tag = element.localName.toLowerCase();
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();
			if (tag === "img" && name === "src") {
				const resolved = resource(attribute.value);
				if (resolved) element.setAttribute("src", resolved);
				else element.removeAttribute(attribute.name);
			} else if (name === "background") {
				const resolved = resource(attribute.value);
				if (resolved) element.setAttribute("background", resolved);
				else element.removeAttribute(attribute.name);
			} else if (tag === "a" && name === "href") {
				if (!/^#[a-z0-9_:.\-]+$/i.test(attribute.value)) element.removeAttribute(attribute.name);
			} else if (name === "style") element.setAttribute("style", css(attribute.value));
			else if (!ALLOWED_ATTRS.has(name)) element.removeAttribute(attribute.name);
		}
	};
	let count = 0;
	const clean = (parent) => {
		const pending = [...parent.children];
		while (pending.length) {
			const element = pending.pop();
			if (++count > 1e5) throw new Error("Email HTML node limit exceeded.");
			const tag = element.localName.toLowerCase();
			if (DROP_CONTENT.has(tag)) {
				element.remove();
				continue;
			}
			if (!ALLOWED_TAGS.has(tag)) {
				const children = [...element.children];
				element.replaceWith(...Array.from(element.childNodes));
				pending.push(...children);
				continue;
			}
			attributes(element);
			if (tag === "style") element.textContent = css(element.textContent || "");
			pending.push(...element.children);
		}
	};
	clean(head);
	clean(body);
	attributes(parsed);
	attributes(body);
	if (body.getAttribute("bgcolor") && !body.style.backgroundColor) body.style.backgroundColor = body.getAttribute("bgcolor");
	if (body.getAttribute("text") && !body.style.color) body.style.color = body.getAttribute("text");
	if (body.getAttribute("background") && !body.style.backgroundImage) body.style.backgroundImage = `url("${body.getAttribute("background").replace(/["\\\r\n]/g, "")}")`;
	const escapedLength = (value, attribute = false) => {
		let size = value.length;
		for (let index = 0; index < value.length; index++) {
			const code = value.charCodeAt(index);
			if (code === 38) size += 4;
			else if (code === 60 || code === 62) size += 3;
			else if (attribute && code === 34) size += 5;
		}
		return size;
	};
	const nodes = [parsed];
	let estimated = 0;
	while (nodes.length) {
		const node = nodes.pop();
		if (node.nodeType === 3) estimated += escapedLength(node.nodeValue || "");
		else if (node.nodeType === 1) {
			estimated += 32;
			for (const attr of Array.from(node.attributes)) estimated += attr.name.length + escapedLength(attr.value, true) + 8;
		}
		if (estimated > 67108864) throw new Error("Email HTML serialization limit exceeded.");
		nodes.push(...Array.from(node.childNodes));
	}
	const escape = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	const serializeAttributes = (element) => Array.from(element.attributes).map((attr) => ` ${attr.name}="${escape(attr.value)}"`).join("");
	const background = darkMode ? "#111827" : "#fff";
	const foreground = darkMode ? "#e5e7eb" : "#172033";
	return `<!doctype html><html${serializeAttributes(parsed)}><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; img-src blob: data:; style-src 'unsafe-inline'; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><style>:root{color-scheme:${darkMode ? "dark" : "light"}}body{margin:0;padding:18px;font-family:Aptos,"Segoe UI",sans-serif;line-height:1.6;overflow-wrap:anywhere;background:${background};color:${foreground}}img{max-width:100%;height:auto}table{max-width:100%}</style>${head.innerHTML}</head><body${serializeAttributes(body)}>${body.innerHTML}</body></html>`;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/msgMessages.js
var messages = {
	"en-US": {
		bcc: "Bcc",
		sender: "Sender",
		close: "Close attachment preview",
		"email.msg.rtfUnavailable": "Rich-text rendering is unavailable. The readable plain-text body is shown when available. Install the RTF capability to render RTF-only messages.",
		"email.msg.inlineUnavailable": "An inline image could not be displayed. The original attachment remains available.",
		"email.msg.noBody": "This Outlook item has no readable email body. Its metadata and embedded attachments are shown.",
		"email.msg.protected": "This message is protected or signed. Decryption and signature verification are not performed by this viewer."
	},
	"zh-CN": {
		bcc: "密送",
		sender: "代发人",
		close: "关闭附件预览",
		"email.msg.rtfUnavailable": "富文本正文暂不可渲染，已尽可能显示纯文本正文。仅含 RTF 的邮件需要安装 RTF 预览能力。",
		"email.msg.inlineUnavailable": "部分内嵌图片无法显示，原始附件仍保留。",
		"email.msg.noBody": "此 Outlook 项目不含可读邮件正文，已展示元数据及内嵌附件。",
		"email.msg.protected": "此邮件包含加密或签名内容，本预览器不进行解密或签名验证。"
	},
	"ja-JP": {
		bcc: "Bcc",
		sender: "送信者",
		close: "添付ファイルのプレビューを閉じる",
		"email.msg.rtfUnavailable": "リッチテキストを表示できません。可能な場合はプレーンテキストを表示します。RTF 形式の本文には RTF プレビュー機能が必要です。",
		"email.msg.inlineUnavailable": "一部の埋め込み画像を表示できません。元の添付ファイルは保持されています。",
		"email.msg.noBody": "この Outlook アイテムには表示可能なメール本文がありません。メタデータと添付ファイルを表示します。",
		"email.msg.protected": "このメールには保護または署名が含まれます。復号と署名検証は行いません。"
	},
	"de-DE": {
		bcc: "Bcc",
		sender: "Absender",
		close: "Anhangvorschau schließen",
		"email.msg.rtfUnavailable": "Die Rich-Text-Darstellung ist nicht verfügbar. Wenn möglich, wird Klartext angezeigt. Für RTF-Nachrichten ist die RTF-Vorschaufunktion erforderlich.",
		"email.msg.inlineUnavailable": "Ein eingebettetes Bild konnte nicht angezeigt werden. Der Originalanhang bleibt verfügbar.",
		"email.msg.noBody": "Dieses Outlook-Element enthält keinen lesbaren Nachrichtentext. Metadaten und eingebettete Anhänge werden angezeigt.",
		"email.msg.protected": "Diese Nachricht ist geschützt oder signiert. Entschlüsselung und Signaturprüfung werden nicht durchgeführt."
	}
};
var getMsgLabels = (options) => messages[resolveFileViewerLocale(options)];
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/email.js
var emailStyle = `
.email-viewer{position:relative;height:100%;min-height:0;display:flex;flex-direction:column;background:#f3f6f8;color:#172033;box-sizing:border-box}
.email-viewer *{box-sizing:border-box}
.email-header{max-height:35%;overflow:auto;flex:0 0 auto;padding:18px 22px;border-bottom:1px solid rgba(23,32,51,.08);background:#fff}
.email-header>span{color:#1f7a58;font-size:12px;font-weight:900}
.email-header h2{margin:4px 0 12px;font-size:22px;line-height:1.25}
.email-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px}
.email-meta p{margin:0;color:#526275;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.email-meta strong{margin-right:8px;color:#172033}
.email-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(240px,300px) minmax(0,1fr)}
.email-sidebar{min-height:0;display:flex;flex-direction:column;gap:14px;padding:14px;border-right:1px solid rgba(23,32,51,.08);background:rgba(255,255,255,.7)}
.body-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(52px,1fr));gap:6px;padding:4px;border-radius:12px;background:rgba(23,32,51,.06)}
.body-tabs button,.attachment-item,.attachment-preview-head button{font:inherit;cursor:pointer}
.body-tabs button{height:34px;border:0;border-radius:9px;background:transparent;color:#64748b;font-size:12px;font-weight:800}
.body-tabs button.active{background:#fff;color:#172033}
.body-tabs button:disabled{opacity:.4;cursor:not-allowed}
.attachment-panel{min-height:0;overflow:auto}
.attachment-title{display:flex;justify-content:space-between;color:#172033;font-size:14px;margin-bottom:8px}
.attachment-title span{color:#64748b}
.attachment-empty{margin:8px 0 0;color:#64748b;font-size:12px}
.attachment-item{width:100%;min-height:62px;display:grid;grid-template-columns:42px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:8px;padding:9px;border:1px solid rgba(23,32,51,.08);border-radius:12px;background:#fff;text-align:left}
.attachment-item:hover,.attachment-item.active{border-color:rgba(31,122,88,.28);box-shadow:0 10px 22px rgba(23,32,51,.08)}
.attachment-item span{grid-row:span 2;height:38px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(31,122,88,.12);color:#1f7a58;font-size:11px;font-weight:900}
.attachment-item strong,.attachment-item em{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.attachment-item em{color:#64748b;font-size:12px;font-style:normal}
.message-panel{min-width:0;min-height:0;display:grid;grid-template-rows:minmax(0,1fr)}
.message-panel.has-attachment-preview{grid-template-rows:minmax(160px,46%) minmax(0,1fr)}
.email-rtf{height:100%;overflow:auto}
.email-notices{max-height:25%;overflow:auto;margin:0;padding:10px 22px;background:#fff7e8;color:#714700;font-size:13px;line-height:1.5}
.email-notices p{margin:4px 0}
.attachment-preview-actions{display:flex;gap:8px;align-items:center}
[data-viewer-theme='dark'] .email-notices{background:#332711;color:#f8daa0}
.email-message-content{min-height:0}
.email-html,.email-text{width:100%;height:100%;border:0;background:#fff}
.email-text{margin:0;overflow:auto;padding:20px;white-space:pre-wrap;word-break:break-word;line-height:1.65}
.attachment-preview{min-height:0;display:flex;flex-direction:column;border-top:1px solid rgba(23,32,51,.08)}
.attachment-preview[hidden]{display:none}
.attachment-preview-head{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 14px;background:rgba(255,255,255,.78)}
.attachment-preview-head button{height:32px;padding:0 12px;border:0;border-radius:9px;background:#1f7a58;color:#fff;font-weight:800}
.attachment-target{flex:1;min-height:0;overflow:auto}
.email-attachment-render{width:100%;height:100%;min-height:320px}
.email-state{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:14px;background:rgba(243,246,248,.86);z-index:2}
.email-state span{width:34px;height:34px;border-radius:999px;border:3px solid rgba(31,122,88,.16);border-top-color:#1f7a58;animation:email-spin .9s linear infinite}
.email-error{position:absolute;right:18px;bottom:18px;width:min(460px,calc(100% - 36px));padding:14px;border-radius:14px;background:#fff7e8;color:#8a4b00;box-shadow:0 16px 36px rgba(23,32,51,.14);z-index:3}
.email-error p{margin:6px 0 0}
@keyframes email-spin{to{transform:rotate(360deg)}}
[data-viewer-theme='dark'] .email-viewer{background:#172033;color:#e5eef8}
[data-viewer-theme='dark'] .email-header,[data-viewer-theme='dark'] .email-sidebar,[data-viewer-theme='dark'] .attachment-item,[data-viewer-theme='dark'] .email-text,[data-viewer-theme='dark'] .attachment-preview-head{border-color:rgba(139,148,158,.2);background:#111827;color:#e5eef8}
[data-viewer-theme='dark'] .email-meta p,[data-viewer-theme='dark'] .attachment-item em,[data-viewer-theme='dark'] .attachment-title span,[data-viewer-theme='dark'] .attachment-empty{color:#94a3b8}
[data-viewer-theme='dark'] .email-meta strong,[data-viewer-theme='dark'] .attachment-title,[data-viewer-theme='dark'] .attachment-item strong{color:#f8fafc}
[data-viewer-theme='dark'] .body-tabs{background:rgba(139,148,158,.12)}[data-viewer-theme='dark'] .body-tabs button{color:#94a3b8}[data-viewer-theme='dark'] .body-tabs button.active{background:#1f2937;color:#f8fafc}
[data-viewer-theme='dark'] .email-html{background:#111827;color-scheme:dark}
[data-viewer-theme='dark'] .email-state{background:rgba(13,17,23,.9);color:#cbd5e1}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .email-viewer{background:#172033;color:#e5eef8}[data-viewer-theme='system'] .email-header,[data-viewer-theme='system'] .email-sidebar,[data-viewer-theme='system'] .attachment-item,[data-viewer-theme='system'] .email-text,[data-viewer-theme='system'] .attachment-preview-head{border-color:rgba(139,148,158,.2);background:#111827;color:#e5eef8}[data-viewer-theme='system'] .email-meta p,[data-viewer-theme='system'] .attachment-item em,[data-viewer-theme='system'] .attachment-title span,[data-viewer-theme='system'] .attachment-empty{color:#94a3b8}[data-viewer-theme='system'] .email-meta strong,[data-viewer-theme='system'] .attachment-title,[data-viewer-theme='system'] .attachment-item strong{color:#f8fafc}[data-viewer-theme='system'] .body-tabs{background:rgba(139,148,158,.12)}[data-viewer-theme='system'] .body-tabs button{color:#94a3b8}[data-viewer-theme='system'] .body-tabs button.active{background:#1f2937;color:#f8fafc}[data-viewer-theme='system'] .email-html{background:#111827;color-scheme:dark}[data-viewer-theme='system'] .email-state{background:rgba(13,17,23,.9);color:#cbd5e1}}
@media (prefers-reduced-motion:reduce){.email-state span{animation:none}}
@media (max-width:860px){.email-sidebar{max-height:220px;overflow:auto}.email-meta,.email-body{grid-template-columns:1fr}.email-body{grid-template-rows:auto minmax(0,1fr)}.email-sidebar{border-right:0;border-bottom:1px solid rgba(23,32,51,.08)}}
`;
var formatBytes = (value) => {
	if (!Number.isFinite(value) || value < 0) return "-";
	if (value < 1024) return `${value} B`;
	const mb = value / 1024 / 1024;
	if (mb >= 1) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
	return `${(value / 1024).toFixed(value < 10240 ? 1 : 0)} KB`;
};
var normalizeAddress = (value) => {
	if (!value) return [];
	return (Array.isArray(value) ? value : [value]).flatMap((item) => {
		const candidate = item;
		if (candidate.group) return normalizeAddress(candidate.group);
		return [{
			name: candidate.name || "",
			address: candidate.address || candidate.email || ""
		}];
	});
};
var addressText$1 = (items) => {
	return items.map((item) => item.name && item.address ? `${item.name} <${item.address}>` : item.address || item.name || "").filter(Boolean).join(", ");
};
var toArrayBuffer = async (value) => {
	if (value instanceof ArrayBuffer) return value;
	if (value instanceof Uint8Array) {
		const copy = new Uint8Array(value.byteLength);
		copy.set(value);
		return copy.buffer;
	}
	return toArrayBuffer(new TextEncoder().encode(value));
};
var normalizeContentId = (value) => (value || "").replace(/[<>]/g, "");
var createPostalAttachments = (email, objectUrls, cidUrls) => {
	const attachments = (email.attachments || []).map((attachment, index) => {
		var _a;
		const size = typeof attachment.content === "string" ? attachment.content.length : ((_a = attachment.content) === null || _a === void 0 ? void 0 : _a.byteLength) || 0;
		const name = attachment.filename || `attachment-${index + 1}`;
		return {
			id: `${index}-${name}`,
			name,
			mimeType: attachment.mimeType,
			size,
			contentId: attachment.contentId,
			load: () => toArrayBuffer(attachment.content)
		};
	});
	return Promise.all(attachments.map(async (attachment) => {
		var _a;
		if (!attachment.contentId || !((_a = attachment.mimeType) === null || _a === void 0 ? void 0 : _a.startsWith("image/"))) return;
		const url = createEmailImageResource(await attachment.load(), attachment.mimeType, objectUrls);
		cidUrls.set(normalizeContentId(attachment.contentId), url);
	})).then(() => attachments);
};
var parseEml = async (buffer, filename, objectUrls, cidUrls) => {
	var _a, _b;
	const email = await (await __vitePreload(async () => {
		const { default: __vite_default__ } = await import("./postal-mime-DhKs1ijc.js");
		return { default: __vite_default__ };
	}, [])).default.parse(buffer, {
		attachmentEncoding: "arraybuffer",
		maxNestingDepth: 24,
		maxHeadersSize: 2097152
	});
	const attachments = await createPostalAttachments(email, objectUrls, cidUrls);
	return {
		kind: "eml",
		subject: email.subject || filename,
		from: normalizeAddress(email.from),
		to: normalizeAddress(email.to),
		cc: normalizeAddress(email.cc),
		date: email.date,
		text: email.text,
		html: email.html,
		headers: ((_a = email.headerLines) === null || _a === void 0 ? void 0 : _a.map((item) => item.line).join("\n")) || ((_b = email.headers) === null || _b === void 0 ? void 0 : _b.map((item) => `${item.originalKey}: ${item.value}`).join("\n")),
		attachments
	};
};
var parseMbox = async (buffer, filename, objectUrls, cidUrls, t) => {
	var _a, _b, _c, _d;
	const source = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
	const starts = [...source.matchAll(/^From .*$\n/gm)].map((match) => match.index || 0);
	const firstStart = (_a = starts[0]) !== null && _a !== void 0 ? _a : 0;
	const secondStart = (_b = starts[1]) !== null && _b !== void 0 ? _b : source.length;
	const firstMessage = source.slice(firstStart, secondStart).replace(/^From .*$\n/, "");
	const encoded = new TextEncoder().encode(firstMessage).buffer;
	const email = await (await __vitePreload(async () => {
		const { default: __vite_default__ } = await import("./postal-mime-DhKs1ijc.js");
		return { default: __vite_default__ };
	}, [])).default.parse(encoded, {
		attachmentEncoding: "arraybuffer",
		maxNestingDepth: 24,
		maxHeadersSize: 2097152
	});
	const attachments = await createPostalAttachments(email, objectUrls, cidUrls);
	return {
		kind: "mbox",
		subject: email.subject || t("email.mbox.subject", { filename }),
		from: normalizeAddress(email.from),
		to: normalizeAddress(email.to),
		cc: normalizeAddress(email.cc),
		date: email.date,
		text: `${t("email.mbox.summary", { count: Math.max(1, starts.length) })}\n\n${email.text || ""}`,
		html: email.html,
		headers: ((_c = email.headerLines) === null || _c === void 0 ? void 0 : _c.map((item) => item.line).join("\n")) || ((_d = email.headers) === null || _d === void 0 ? void 0 : _d.map((item) => `${item.originalKey}: ${item.value}`).join("\n")),
		attachments
	};
};
var parseEmail = (buffer, type, filename, objectUrls, cidUrls, t, signal) => {
	if (type === "msg") return __vitePreload(async () => {
		const { parseMsg } = await import("./msg-sZNk7fmH.js");
		return { parseMsg };
	}, []).then(({ parseMsg }) => parseMsg(buffer, filename, objectUrls, cidUrls, signal));
	if (type === "mbox") return parseMbox(buffer, filename, objectUrls, cidUrls, t);
	return parseEml(buffer, filename, objectUrls, cidUrls);
};
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = emailStyle;
	return style;
};
var createElement = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var getAttachmentExtension = (name) => {
	const index = name.lastIndexOf(".");
	return index >= 0 ? name.slice(index + 1).toLowerCase() : "bin";
};
var appendMeta = (meta, label, value) => {
	const row = document.createElement("p");
	const strong = document.createElement("strong");
	strong.textContent = label;
	row.title = value || "-";
	row.append(strong, document.createTextNode(value || "-"));
	meta.append(row);
};
async function renderEmail(buffer, target, type = "eml", context) {
	var _a, _b, _c, _d, _e, _f;
	type = type.toLowerCase().replace(/^\./, "");
	const normalizedType = type === "msg" ? "msg" : type === "mbox" ? "mbox" : "eml";
	const filename = (context === null || context === void 0 ? void 0 : context.filename) || `message.${normalizedType}`;
	const objectUrls = [];
	const cidUrls = /* @__PURE__ */ new Map();
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const msgLabels = getMsgLabels(context === null || context === void 0 ? void 0 : context.options);
	const controller = new AbortController();
	const abortFromParent = () => {
		var _a;
		return controller.abort((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.reason);
	};
	if ((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.aborted) abortFromParent();
	else (_b = context === null || context === void 0 ? void 0 : context.signal) === null || _b === void 0 || _b.addEventListener("abort", abortFromParent, { once: true });
	const signal = controller.signal;
	const systemDark = (_e = (_d = (_c = target.ownerDocument.defaultView) === null || _c === void 0 ? void 0 : _c.matchMedia) === null || _d === void 0 ? void 0 : _d.call(_c, "(prefers-color-scheme: dark)").matches) !== null && _e !== void 0 ? _e : false;
	const darkMode = resolveFileViewerColorScheme((_f = context === null || context === void 0 ? void 0 : context.options) === null || _f === void 0 ? void 0 : _f.theme, systemDark) === "dark";
	const cleanups = [];
	let nestedRendered;
	let bodyRendered;
	let bodyVersion = 0;
	let bodyController;
	let attachmentPreviewVersion = 0;
	let attachmentAbortController;
	let disposed = false;
	let overlay = null;
	let errorElement = null;
	const root = createElement("section", "email-viewer");
	const style = createStyle();
	target.replaceChildren(style, root);
	const listen = (element, event, listener) => {
		element.addEventListener(event, listener);
		cleanups.push(() => element.removeEventListener(event, listener));
	};
	const showLoading = (text) => {
		if (!overlay) {
			overlay = createElement("div", "email-state");
			overlay.append(createElement("span"), createElement("strong", void 0, text));
			root.append(overlay);
			return;
		}
		const label = overlay.querySelector("strong");
		if (label) label.textContent = text;
	};
	const hideLoading = () => {
		overlay === null || overlay === void 0 || overlay.remove();
		overlay = null;
	};
	const showError = (message) => {
		errorElement === null || errorElement === void 0 || errorElement.remove();
		errorElement = createElement("div", "email-error");
		errorElement.append(createElement("strong", void 0, t("email.error.title")));
		errorElement.append(createElement("p", void 0, message));
		root.append(errorElement);
	};
	const clearAttachmentPreview = async () => {
		const previous = nestedRendered;
		nestedRendered = void 0;
		await disposeFileViewerRendered(previous);
	};
	const clearBodyPreview = async () => {
		const previous = bodyRendered;
		bodyRendered = void 0;
		await disposeFileViewerRendered(previous);
	};
	const cleanup = async () => {
		var _a;
		if (disposed) return;
		disposed = true;
		controller.abort();
		bodyVersion += 1;
		attachmentPreviewVersion += 1;
		bodyController === null || bodyController === void 0 || bodyController.abort();
		attachmentAbortController === null || attachmentAbortController === void 0 || attachmentAbortController.abort();
		(_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 || _a.removeEventListener("abort", abortFromParent);
		cleanups.splice(0).forEach((cleanup) => cleanup());
		try {
			await Promise.allSettled([clearAttachmentPreview(), clearBodyPreview()]);
		} finally {
			objectUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
			cidUrls.clear();
			if (root.parentNode === target) target.replaceChildren();
		}
	};
	const downloadAttachment = async (attachment) => {
		signal.throwIfAborted();
		const attachmentBuffer = await attachment.load();
		if (disposed) return;
		signal.throwIfAborted();
		const url = URL.createObjectURL(new Blob([attachmentBuffer], { type: attachment.mimeType || "application/octet-stream" }));
		objectUrls.push(url);
		const link = document.createElement("a");
		link.href = url;
		link.download = attachment.name;
		document.body.append(link);
		link.click();
		link.remove();
	};
	const renderParsedEmail = async (parsed) => {
		var _a, _b;
		let activeBody = parsed.html ? "html" : parsed.rtf && (context === null || context === void 0 ? void 0 : context.renderNestedBuffer) ? "rtf" : parsed.text ? "text" : "headers";
		let activeAttachment = null;
		const tabButtons = [];
		const attachmentButtons = [];
		root.replaceChildren();
		const header = createElement("header", "email-header");
		header.append(createElement("span", void 0, parsed.kind.toUpperCase()));
		header.append(createElement("h2", void 0, parsed.subject || filename));
		const meta = createElement("div", "email-meta");
		appendMeta(meta, t("email.meta.from"), addressText$1(parsed.from));
		if ((_a = parsed.sender) === null || _a === void 0 ? void 0 : _a.length) appendMeta(meta, msgLabels.sender, addressText$1(parsed.sender));
		appendMeta(meta, t("email.meta.to"), addressText$1(parsed.to));
		if (parsed.cc.length) appendMeta(meta, t("email.meta.cc"), addressText$1(parsed.cc));
		if ((_b = parsed.bcc) === null || _b === void 0 ? void 0 : _b.length) appendMeta(meta, msgLabels.bcc, addressText$1(parsed.bcc));
		appendMeta(meta, t("email.meta.date"), parsed.date || "-");
		header.append(meta);
		const body = createElement("div", "email-body");
		const sidebar = createElement("aside", "email-sidebar");
		const tabs = createElement("div", "body-tabs");
		const messagePanel = createElement("main", "message-panel");
		const messageContent = createElement("div", "email-message-content");
		const attachmentPreview = createElement("section", "attachment-preview");
		attachmentPreview.hidden = true;
		const attachmentPreviewHead = createElement("div", "attachment-preview-head");
		const attachmentPreviewTitle = createElement("strong");
		const attachmentDownload = createElement("button", void 0, t("email.attachments.download"));
		attachmentDownload.type = "button";
		const attachmentTarget = createElement("div", "attachment-target");
		const attachmentClose = createElement("button", void 0, "×");
		attachmentClose.type = "button";
		attachmentClose.setAttribute("aria-label", msgLabels.close);
		attachmentClose.title = msgLabels.close;
		const attachmentActions = createElement("div", "attachment-preview-actions");
		attachmentActions.append(attachmentDownload, attachmentClose);
		attachmentPreviewHead.append(attachmentPreviewTitle, attachmentActions);
		attachmentPreview.append(attachmentPreviewHead, attachmentTarget);
		const notices = createElement("div", "email-notices");
		notices.setAttribute("role", "status");
		const noticeKeys = new Set(parsed.warnings || []);
		const renderNotices = () => {
			notices.replaceChildren();
			noticeKeys.forEach((key) => notices.append(createElement("p", void 0, msgLabels[key])));
			notices.hidden = !noticeKeys.size;
		};
		if (parsed.rtf && !parsed.html && !(context === null || context === void 0 ? void 0 : context.renderNestedBuffer)) noticeKeys.add("email.msg.rtfUnavailable");
		renderNotices();
		const renderPlainBody = (mode) => {
			const pre = createElement("pre", "email-text");
			pre.textContent = mode === "text" ? parsed.text || "" : parsed.headers || "";
			messageContent.replaceChildren(pre);
		};
		const renderMessageContent = async () => {
			var _a;
			const version = ++bodyVersion;
			bodyController === null || bodyController === void 0 || bodyController.abort();
			const current = new AbortController();
			bodyController = current;
			const abort = () => current.abort(signal.reason);
			if (signal.aborted) abort();
			else signal.addEventListener("abort", abort, { once: true });
			const stale = () => disposed || version !== bodyVersion || current.signal.aborted;
			try {
				await clearBodyPreview();
				if (stale()) return;
				messageContent.replaceChildren();
				if (activeBody === "html" && parsed.html) {
					const iframe = createElement("iframe", "email-html");
					iframe.title = parsed.subject || filename;
					iframe.setAttribute("sandbox", "");
					iframe.referrerPolicy = "no-referrer";
					iframe.srcdoc = createEmailHtmlDocument(parsed.html, cidUrls, darkMode, target.ownerDocument);
					messageContent.append(iframe);
				} else if (activeBody === "rtf" && parsed.rtf && (context === null || context === void 0 ? void 0 : context.renderNestedBuffer)) {
					const child = createElement("div", "email-rtf");
					messageContent.append(child);
					const rendered = await context.renderNestedBuffer(parsed.rtf, "rtf", child, {
						...context,
						filename: `${filename}.rtf`,
						signal: current.signal,
						options: {
							...context.options,
							docx: {
								...(_a = context.options) === null || _a === void 0 ? void 0 : _a.docx,
								externalResourcePolicy: "block",
								externalLinkPolicy: "block"
							}
						}
					});
					if (stale()) {
						await disposeFileViewerRendered(rendered);
						return;
					}
					bodyRendered = rendered;
				} else renderPlainBody(activeBody === "headers" ? "headers" : "text");
			} catch (error) {
				if (stale()) return;
				if (activeBody === "rtf") {
					noticeKeys.add("email.msg.rtfUnavailable");
					renderNotices();
					renderPlainBody(parsed.text ? "text" : "headers");
				} else throw error;
			} finally {
				signal.removeEventListener("abort", abort);
			}
		};
		const syncTabState = () => {
			tabButtons.forEach(({ mode, button }) => {
				button.classList.toggle("active", mode === activeBody);
				button.setAttribute("aria-pressed", String(mode === activeBody));
			});
		};
		[
			{
				key: "html",
				label: "HTML",
				disabled: !parsed.html
			},
			...parsed.rtf ? [{
				key: "rtf",
				label: "RTF",
				disabled: !(context === null || context === void 0 ? void 0 : context.renderNestedBuffer)
			}] : [],
			{
				key: "text",
				label: t("email.tabs.text"),
				disabled: !parsed.text
			},
			{
				key: "headers",
				label: t("email.tabs.headers"),
				disabled: !parsed.headers
			}
		].forEach((mode) => {
			const button = createElement("button", void 0, mode.label);
			button.type = "button";
			button.disabled = mode.disabled;
			listen(button, "click", () => {
				if (button.disabled) return;
				activeBody = mode.key;
				syncTabState();
				renderMessageContent().catch((error) => {
					if (!disposed && !signal.aborted) showError(error instanceof Error ? error.message : String(error));
				});
			});
			tabButtons.push({
				mode: mode.key,
				button
			});
			tabs.append(button);
		});
		syncTabState();
		const attachmentPanel = createElement("section", "attachment-panel");
		const attachmentTitle = createElement("div", "attachment-title");
		attachmentTitle.append(createElement("strong", void 0, t("email.attachments.title")), createElement("span", void 0, String(parsed.attachments.length)));
		attachmentPanel.append(attachmentTitle);
		if (!parsed.attachments.length) attachmentPanel.append(createElement("p", "attachment-empty", t("email.attachments.empty")));
		const syncAttachmentState = () => {
			attachmentButtons.forEach(({ id, button }) => {
				button.classList.toggle("active", id === (activeAttachment === null || activeAttachment === void 0 ? void 0 : activeAttachment.id));
			});
		};
		const previewAttachment = async (attachment) => {
			var _a;
			const previewVersion = ++attachmentPreviewVersion;
			attachmentAbortController === null || attachmentAbortController === void 0 || attachmentAbortController.abort();
			const previewAbortController = new AbortController();
			attachmentAbortController = previewAbortController;
			const abort = () => previewAbortController.abort(signal.reason);
			if (signal.aborted) abort();
			else signal.addEventListener("abort", abort, { once: true });
			const stale = () => disposed || previewVersion !== attachmentPreviewVersion || previewAbortController.signal.aborted;
			activeAttachment = attachment;
			syncAttachmentState();
			attachmentPreview.hidden = false;
			messagePanel.classList.add("has-attachment-preview");
			errorElement === null || errorElement === void 0 || errorElement.remove();
			errorElement = null;
			attachmentPreviewTitle.textContent = attachment.name;
			showLoading(t("email.attachments.opening", { name: attachment.name }));
			try {
				await clearAttachmentPreview();
				if (stale()) return;
				attachmentTarget.replaceChildren();
				const attachmentBuffer = await attachment.load();
				if (stale()) return;
				const sizeLabel = (_a = attachmentButtons.find((item) => item.id === attachment.id)) === null || _a === void 0 ? void 0 : _a.button.querySelector("em");
				if (sizeLabel) sizeLabel.textContent = formatBytes(attachmentBuffer.byteLength);
				const child = createElement("div", "email-attachment-render");
				attachmentTarget.append(child);
				const extension = getAttachmentExtension(attachment.name);
				if (context === null || context === void 0 ? void 0 : context.renderNestedBuffer) {
					const nextRendered = await context.renderNestedBuffer(attachmentBuffer, extension, child, {
						...context,
						filename: attachment.name,
						options: context.options,
						signal: previewAbortController.signal
					});
					if (stale()) {
						await disposeFileViewerRendered(nextRendered);
						return;
					}
					nestedRendered = nextRendered;
				} else child.append(createElement("div", void 0, t("email.attachments.nestedUnavailable", { name: attachment.name })));
			} catch (nextError) {
				if (stale()) return;
				console.error(nextError);
				showError(nextError instanceof Error ? nextError.message : String(nextError));
			} finally {
				signal.removeEventListener("abort", abort);
				if (attachmentAbortController === previewAbortController) attachmentAbortController = void 0;
				if (!disposed && previewVersion === attachmentPreviewVersion) hideLoading();
			}
		};
		parsed.attachments.forEach((attachment) => {
			const button = createElement("button", "attachment-item");
			button.type = "button";
			const icon = createElement("span", void 0, getAttachmentExtension(attachment.name).toUpperCase() || "FILE");
			const name = createElement("strong", void 0, attachment.name);
			const size = createElement("em", void 0, formatBytes(attachment.size));
			button.append(icon, name, size);
			listen(button, "click", () => {
				previewAttachment(attachment);
			});
			attachmentButtons.push({
				id: attachment.id,
				button
			});
			attachmentPanel.append(button);
		});
		listen(attachmentClose, "click", () => {
			var _a;
			attachmentPreviewVersion += 1;
			attachmentAbortController === null || attachmentAbortController === void 0 || attachmentAbortController.abort();
			attachmentAbortController = void 0;
			const previous = activeAttachment;
			activeAttachment = null;
			syncAttachmentState();
			attachmentPreview.hidden = true;
			messagePanel.classList.remove("has-attachment-preview");
			hideLoading();
			clearAttachmentPreview().catch(() => {});
			attachmentTarget.replaceChildren();
			(_a = attachmentButtons.find((item) => item.id === (previous === null || previous === void 0 ? void 0 : previous.id))) === null || _a === void 0 || _a.button.focus();
		});
		listen(attachmentDownload, "click", () => {
			if (activeAttachment) downloadAttachment(activeAttachment).catch((error) => {
				if (!disposed && !signal.aborted) showError(error instanceof Error ? error.message : String(error));
			});
		});
		sidebar.append(tabs, attachmentPanel);
		messagePanel.append(messageContent, attachmentPreview);
		body.append(sidebar, messagePanel);
		root.append(header, notices, body);
		await renderMessageContent();
	};
	showLoading(t("email.loading.parsing"));
	try {
		signal.throwIfAborted();
		const parsed = await parseEmail(buffer, normalizedType, filename, objectUrls, cidUrls, t, signal);
		signal.throwIfAborted();
		await renderParsedEmail(parsed);
		signal.throwIfAborted();
	} catch (nextError) {
		await cleanup();
		throw nextError;
	} finally {
		hideLoading();
	}
	return {
		$el: root,
		unmount: cleanup
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/index.js
var emailDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "email");
if (!emailDefinition) throw new Error("@file-viewer/renderer-email could not locate the shared email format definition.");
var emailRendererDefinition = emailDefinition;
var renderFileViewerEmail = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderEmail } = await import("./email-CJilbZKP.js");
	return { default: renderEmail };
}, []).then(({ default: renderEmail }) => renderEmail(buffer, target, type, context));
var emailRenderer = {
	id: "file-viewer-renderer-email",
	label: "Flyfish File Viewer email renderer",
	definitions: [emailRendererDefinition],
	handlers: [{
		rendererId: emailRendererDefinition.id,
		handler: renderFileViewerEmail
	}]
};
var END = 4294967294;
var FREE = 4294967295;
var MAX_DIRECTORY_ENTRIES = 32768;
var MAX_STORAGE_DEPTH = 24;
var MAGIC = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
function inspectMsgContainer(buffer) {
	const fail = (reason) => {
		throw new Error(`Invalid Outlook MSG: ${reason}`);
	};
	if (buffer.byteLength < 512 || buffer.byteLength > 134217728) fail("source size limit");
	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);
	if (!MAGIC.every((value, index) => bytes[index] === value)) fail("missing CFB signature");
	const version = view.getUint16(26, true);
	const shift = view.getUint16(30, true);
	if (view.getUint16(28, true) !== 65534 || !(version === 3 && shift === 9 || version === 4 && shift === 12) || view.getUint16(32, true) !== 6) fail("unsupported CFB header");
	const sectorSize = 2 ** shift;
	if (bytes.length % sectorSize || bytes.length < sectorSize * 2) fail("truncated sector");
	const sectorCount = bytes.length / sectorSize - 1;
	const sectorOffset = (sector) => {
		if (!Number.isInteger(sector) || sector < 0 || sector >= sectorCount) fail("sector out of bounds");
		return (sector + 1) * sectorSize;
	};
	const fatCount = view.getUint32(44, true);
	const difatCount = view.getUint32(72, true);
	if (!fatCount || fatCount > sectorCount || difatCount > sectorCount) fail("invalid allocation table count");
	const reserved = /* @__PURE__ */ new Set();
	const fatSectors = [];
	const addFat = (sector) => {
		if (sector === FREE) return;
		sectorOffset(sector);
		if (reserved.has(sector)) fail("duplicate FAT/DIFAT sector");
		reserved.add(sector);
		fatSectors.push(sector);
	};
	for (let index = 0; index < 109; index++) addFat(view.getUint32(76 + index * 4, true));
	let difat = view.getUint32(68, true);
	for (let index = 0; index < difatCount; index++) {
		const start = sectorOffset(difat);
		if (reserved.has(difat)) fail("cyclic DIFAT");
		reserved.add(difat);
		for (let offset = 0; offset < sectorSize - 4; offset += 4) addFat(view.getUint32(start + offset, true));
		difat = view.getUint32(start + sectorSize - 4, true);
	}
	if (difatCount && difat !== END) fail("unterminated DIFAT");
	if (fatSectors.length !== fatCount || fatCount * (sectorSize / 4) < sectorCount) fail("incomplete FAT");
	const fat = new Uint32Array(fatCount * (sectorSize / 4));
	fatSectors.forEach((sector, index) => {
		const start = sectorOffset(sector);
		for (let offset = 0; offset < sectorSize / 4; offset++) fat[index * (sectorSize / 4) + offset] = view.getUint32(start + offset * 4, true);
	});
	const claimed = new Set(reserved);
	const chain = (start, table, limit, owners, maxLength = limit) => {
		const result = [];
		for (let sector = start; sector !== END;) {
			if (sector >= limit || sector >= table.length || owners.has(sector) || result.length >= maxLength) fail("cyclic, shared or out-of-range allocation chain");
			owners.add(sector);
			result.push(sector);
			sector = table[sector];
		}
		return result;
	};
	const directory = chain(view.getUint32(48, true), fat, sectorCount, claimed, Math.ceil(MAX_DIRECTORY_ENTRIES * 128 / sectorSize));
	if (!directory.length) fail("missing directory");
	const dirBytes = new Uint8Array(directory.length * sectorSize);
	directory.forEach((sector, index) => dirBytes.set(bytes.subarray(sectorOffset(sector), sectorOffset(sector) + sectorSize), index * sectorSize));
	const dir = new DataView(dirBytes.buffer);
	const count = dirBytes.length / 128;
	const decoder = new TextDecoder("utf-16le");
	const entries = Array.from({ length: count }, (_, id) => {
		const offset = id * 128;
		const type = dir.getUint8(offset + 66);
		const length = dir.getUint16(offset + 64, true);
		if (type && (![
			1,
			2,
			5
		].includes(type) || length < 2 || length > 64 || length % 2)) fail("invalid directory entry");
		const size = dir.getUint32(offset + 120, true) + (version === 4 ? dir.getUint32(offset + 124, true) : 0) * 2 ** 32;
		if ((type === 2 || type === 5) && size > 134217728) fail("stream size limit");
		return {
			id,
			type,
			size,
			name: type ? decoder.decode(dirBytes.subarray(offset, offset + length - 2)) : "",
			left: dir.getUint32(offset + 68, true),
			right: dir.getUint32(offset + 72, true),
			child: dir.getUint32(offset + 76, true),
			start: dir.getUint32(offset + 116, true)
		};
	});
	const root = entries[0];
	if (root.type !== 5) fail("missing root storage");
	const miniCount = view.getUint32(64, true);
	if (miniCount > sectorCount || view.getUint32(56, true) !== 4096) fail("invalid MiniFAT header");
	const miniFatChain = miniCount ? chain(view.getUint32(60, true), fat, sectorCount, claimed) : [];
	if (miniFatChain.length !== miniCount) fail("incomplete MiniFAT");
	const miniFat = new Uint32Array(miniCount * (sectorSize / 4));
	miniFatChain.forEach((sector, index) => {
		const start = sectorOffset(sector);
		for (let offset = 0; offset < sectorSize / 4; offset++) miniFat[index * (sectorSize / 4) + offset] = view.getUint32(start + offset * 4, true);
	});
	const miniStream = root.size ? chain(root.start, fat, sectorCount, claimed) : [];
	if (miniStream.length * sectorSize < root.size) fail("truncated mini stream");
	const miniClaimed = /* @__PURE__ */ new Set();
	const visited = /* @__PURE__ */ new Set([0]);
	const stack = [{
		id: root.child,
		depth: 1,
		parent: 0
	}];
	let properties;
	while (stack.length) {
		const next = stack.pop();
		if (next.id === FREE) continue;
		if (next.id >= count || visited.has(next.id) || next.depth > MAX_STORAGE_DEPTH) fail("cyclic directory or nested storage limit");
		visited.add(next.id);
		const item = entries[next.id];
		if (item.type !== 1 && item.type !== 2) fail("invalid child entry");
		stack.push({
			...next,
			id: item.left
		}, {
			...next,
			id: item.right
		});
		if (item.type === 1) {
			stack.push({
				id: item.child,
				depth: next.depth + 1,
				parent: item.id
			});
			continue;
		}
		const small = item.size < 4096;
		const sectors = item.size ? chain(item.start, small ? miniFat : fat, small ? Math.ceil(root.size / 64) : sectorCount, small ? miniClaimed : claimed) : [];
		const width = small ? 64 : sectorSize;
		if (sectors.length * width < item.size) fail("truncated property or attachment stream");
		if (small && sectors.some((sector, index) => sector * 64 + Math.min(64, Math.max(0, item.size - index * 64)) > root.size)) fail("property exceeds mini stream");
		if (next.parent === 0 && item.name === "__properties_version1.0") {
			if (item.size < 32 || item.size > 2097152 || (item.size - 32) % 16) fail("invalid message property stream");
			properties = new Uint8Array(item.size);
			sectors.forEach((sector, index) => {
				const offset = small ? sectorOffset(miniStream[Math.floor(sector * 64 / sectorSize)]) + sector * 64 % sectorSize : sectorOffset(sector);
				const length = Math.min(width, item.size - index * width);
				if (length > 0) properties.set(bytes.subarray(offset, offset + length), index * width);
			});
		}
	}
	if (!properties) fail("CFB is not an Outlook message");
	const props = new DataView(properties.buffer);
	for (let offset = 32; offset + 16 <= props.byteLength; offset += 16) if (props.getUint32(offset, true) === 1073545219) return { messageCodepage: props.getUint32(offset + 8, true) };
	return {};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/msgEncoding.js
var msgCodepageLabel = (codepage) => {
	if (codepage && codepage >= 28591 && codepage <= 28606) return `iso-8859-${codepage - 28590}`;
	if (codepage && codepage >= 1250 && codepage <= 1258) return `windows-${codepage}`;
	return {
		866: "ibm866",
		1e4: "macintosh",
		10007: "x-mac-cyrillic",
		38598: "iso-8859-8-i",
		50221: "iso-2022-jp",
		50222: "iso-2022-jp",
		65001: "utf-8",
		1200: "utf-16le",
		1201: "utf-16be",
		20127: "windows-1252",
		932: "shift_jis",
		936: "gbk",
		949: "euc-kr",
		950: "big5",
		54936: "gb18030",
		28591: "windows-1252",
		28592: "iso-8859-2",
		28605: "iso-8859-15",
		20866: "koi8-r",
		21866: "koi8-u",
		874: "windows-874",
		50220: "iso-2022-jp",
		51932: "euc-jp",
		51949: "euc-kr"
	}[codepage || 0];
};
/** PR_HTML is PtypBinary, whereas 1013001F (bodyHtml) is already Unicode. */
function decodeEmailHtmlBytes(value, internetCodepage, messageCodepage) {
	var _a;
	if (typeof value === "string") {
		if (value.length > 33554432) throw new Error("MSG HTML size limit exceeded.");
		return value.replace(/\0+$/, "");
	}
	const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
	if (!(bytes instanceof Uint8Array) || bytes.length > 33554432) throw new Error("Invalid or oversized MSG HTML body.");
	let label;
	if (bytes[0] === 255 && bytes[1] === 254) label = "utf-16le";
	else if (bytes[0] === 254 && bytes[1] === 255) label = "utf-16be";
	else if (bytes[0] === 60 && bytes[1] === 0 && bytes[3] === 0) label = "utf-16le";
	else if (bytes[0] === 0 && bytes[1] === 60 && bytes[2] === 0) label = "utf-16be";
	else if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) label = "utf-8";
	const prefix = new TextDecoder("windows-1252").decode(bytes.subarray(0, 4096));
	const declared = (_a = /<meta\b[^>]*\bcharset\s*=\s*["']?\s*([a-z0-9._-]+)/i.exec(prefix)) === null || _a === void 0 ? void 0 : _a[1];
	const candidates = [
		label,
		msgCodepageLabel(internetCodepage),
		declared,
		msgCodepageLabel(messageCodepage)
	].filter((item) => !!item);
	for (const candidate of candidates) try {
		return new TextDecoder(candidate).decode(bytes).replace(/\0+$/, "");
	} catch {}
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/\0+$/, "");
	} catch {
		return new TextDecoder("windows-1252").decode(bytes).replace(/\0+$/, "");
	}
}
var SEED = "{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswiss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New RomanCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\f0\\fs20\\b\\i\\u\\tab\\tx";
function rtfCrc32(bytes) {
	let crc = 0;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
	}
	return crc >>> 0;
}
function decompressMsgRtf(input) {
	const fail = (reason) => {
		throw new Error(`Invalid Outlook RTF: ${reason}`);
	};
	if (input.byteLength < 16 || input.byteLength > 33554448) fail("compressed size limit");
	const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
	const compressedSize = view.getUint32(0, true);
	const rawSize = view.getUint32(4, true);
	const magic = view.getUint32(8, true);
	if (compressedSize + 4 !== input.length || rawSize > 33554432) fail("size mismatch or expansion limit");
	const payload = input.subarray(16);
	if (magic === 1095517517) {
		if (payload.length !== rawSize) fail("truncated uncompressed body");
		return payload.slice();
	}
	if (magic !== 1967544908) fail("unknown compression type");
	if (rtfCrc32(payload) !== view.getUint32(12, true)) fail("CRC mismatch");
	const dictionary = /* @__PURE__ */ new Uint8Array(4096);
	const initialized = /* @__PURE__ */ new Uint8Array(4096);
	dictionary.set(new TextEncoder().encode(SEED));
	initialized.fill(1, 0, 207);
	const output = new Uint8Array(rawSize);
	let write = 207;
	let position = 0;
	let cursor = 0;
	let terminated = false;
	const put = (value) => {
		if (position >= rawSize) fail("decompressed size mismatch");
		output[position++] = value;
		dictionary[write] = value;
		initialized[write] = 1;
		write = write + 1 & 4095;
	};
	while (cursor < payload.length && !terminated) {
		const flags = payload[cursor++];
		for (let bit = 0; bit < 8 && !terminated; bit++) if (flags & 1 << bit) {
			if (cursor + 2 > payload.length) fail("truncated reference");
			const first = payload[cursor++];
			const second = payload[cursor++];
			let reference = first << 4 | second >>> 4;
			if (reference === write) {
				terminated = true;
				break;
			}
			const length = (second & 15) + 2;
			for (let index = 0; index < length; index++) {
				if (!initialized[reference]) fail("uninitialized dictionary reference");
				put(dictionary[reference]);
				reference = reference + 1 & 4095;
			}
		} else {
			if (cursor >= payload.length) fail("truncated literal");
			put(payload[cursor++]);
		}
	}
	if (!terminated || position !== rawSize) fail("missing terminator or incomplete body");
	return output;
}
var SKIPPED = /* @__PURE__ */ new Set([
	"fonttbl",
	"colortbl",
	"stylesheet",
	"info",
	"pict",
	"object",
	"objdata",
	"header",
	"headerl",
	"headerr",
	"footer",
	"footerl",
	"footerr",
	"filetbl",
	"listtable",
	"listoverridetable",
	"listtext",
	"pntext",
	"fldinst",
	"datastore",
	"themedata",
	"colorschememapping",
	"xmlnstbl",
	"generator"
]);
function extractMsgRtf(bytes, codepage) {
	if (bytes.length > 33554432) throw new Error("Outlook RTF exceeds the body limit.");
	let source = "";
	for (let offset = 0; offset < bytes.length; offset += 8192) source += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
	if (!/^\{\\rtf[1-9]/.test(source)) throw new Error("Invalid Outlook RTF document.");
	let state = {
		skip: false,
		htmlTag: false,
		htmlRtf: false,
		uc: 1,
		encoding: msgCodepageLabel(codepage) || "windows-1252",
		starred: false
	};
	const stack = [];
	const text = [];
	const html = [];
	const pending = [];
	let fallback = 0;
	let fromHtml = false;
	const emit = (value) => {
		if (state.skip) return;
		if (!state.htmlTag) text.push(value);
		if (!state.htmlRtf) html.push(value);
	};
	const flush = () => {
		if (!pending.length) return;
		emit(new TextDecoder(state.encoding).decode(new Uint8Array(pending)));
		pending.length = 0;
	};
	const byte = (value) => {
		if (fallback > 0) {
			fallback--;
			return;
		}
		pending.push(value);
	};
	let rootClosed = false;
	for (let cursor = 0; cursor < source.length;) {
		const char = source[cursor++];
		if (rootClosed) {
			if (!/[\s\0]/.test(char)) throw new Error("Unexpected content after Outlook RTF document.");
			continue;
		}
		if (char === "{") {
			flush();
			if (stack.length >= 128) throw new Error("Outlook RTF nesting limit exceeded.");
			stack.push({ ...state });
			state = {
				...state,
				starred: false
			};
			fallback = 0;
			continue;
		}
		if (char === "}") {
			flush();
			if (!stack.length) throw new Error("Unbalanced Outlook RTF document.");
			state = stack.pop();
			fallback = 0;
			rootClosed = stack.length === 0;
			continue;
		}
		if (char === "\r" || char === "\n") continue;
		if (char !== "\\") {
			byte(char.charCodeAt(0));
			continue;
		}
		const control = source[cursor++];
		if (control === "\\" || control === "{" || control === "}") {
			byte(control.charCodeAt(0));
			continue;
		}
		if (control === "'") {
			const hex = source.slice(cursor, cursor + 2);
			if (!/^[0-9a-f]{2}$/i.test(hex)) throw new Error("Invalid Outlook RTF hex escape.");
			byte(Number.parseInt(hex, 16));
			cursor += 2;
			continue;
		}
		flush();
		if (control === "*") {
			state.starred = true;
			continue;
		}
		if (control === "~" || control === "_" || control === "-") {
			if (fallback) fallback--;
			else emit(control === "~" ? "\xA0" : control === "_" ? "‑" : "­");
			continue;
		}
		if (!control || !/[a-z]/i.test(control)) continue;
		let word = control;
		while (cursor < source.length && /[a-z]/i.test(source[cursor])) word += source[cursor++];
		const start = cursor;
		if (source[cursor] === "-") cursor++;
		while (cursor < source.length && /[0-9]/.test(source[cursor])) cursor++;
		const raw = source.slice(start, cursor);
		const value = raw && raw !== "-" ? Number(raw) : void 0;
		if (source[cursor] === " ") cursor++;
		if (state.starred) {
			if (word !== "htmltag" && word !== "mhtmltag") state.skip = true;
			state.starred = false;
		}
		if (SKIPPED.has(word)) state.skip = true;
		if (word === "htmltag" || word === "mhtmltag") state.htmlTag = true;
		if (word === "htmlrtf") state.htmlRtf = value !== 0;
		if (word === "fromhtml" && value === 1) fromHtml = true;
		if (word === "ansicpg" && value !== void 0) state.encoding = msgCodepageLabel(value) || state.encoding;
		if (word === "uc" && value !== void 0) state.uc = Math.max(0, Math.min(16, value));
		if (word === "u" && value !== void 0) {
			emit(String.fromCharCode(value & 65535));
			fallback = state.uc;
		}
		if (word === "bin") {
			if (value === void 0 || !Number.isSafeInteger(value) || value < 0 || cursor + value > source.length) throw new Error("Invalid Outlook RTF binary block.");
			cursor += value;
		}
		const special = {
			par: "\n",
			line: "\n",
			tab: "	",
			cell: "	",
			row: "\n",
			emdash: "—",
			endash: "–",
			bullet: "•",
			lquote: "‘",
			rquote: "’",
			ldblquote: "“",
			rdblquote: "”"
		}[word];
		if (special) if (fallback) fallback--;
		else emit(special);
	}
	flush();
	if (stack.length || !rootClosed) throw new Error("Truncated Outlook RTF document.");
	return {
		text: text.join("").trim(),
		html: fromHtml ? html.join("").trim() : void 0
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-email@3.1.2/node_modules/@file-viewer/renderer-email/dist/msg.js
var MAX_ATTACHMENTS = 1024;
var MAX_RECIPIENTS = 4096;
var MAX_BODY_CHARS = 33554432;
var MAX_INLINE_BYTES = 33554432;
var MAX_NESTED_MESSAGES = 24;
var MIME = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	avif: "image/avif",
	bmp: "image/bmp",
	tif: "image/tiff",
	tiff: "image/tiff",
	svg: "image/svg+xml",
	pdf: "application/pdf",
	txt: "text/plain",
	csv: "text/csv",
	html: "text/html",
	htm: "text/html",
	rtf: "application/rtf",
	msg: "application/vnd.ms-outlook",
	eml: "message/rfc822",
	zip: "application/zip",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};
var RASTER_MIME = /^image\/(?:png|jpeg|gif|webp|avif|bmp|x-ms-bmp)$/i;
var string = (value, max = MAX_BODY_CHARS) => {
	if (typeof value !== "string") return "";
	if (value.length > max) throw new Error("Outlook MSG text exceeds the safety limit.");
	return value.replace(/\0+$/, "");
};
function safeMsgAttachmentName(value, fallback) {
	const name = string(value, 32768).split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/g, "").replace(/[<>:"|?*]/g, "_").replace(/[. ]+$/, "").trim();
	return !name || name === "." || name === ".." ? fallback : name;
}
var recipient = (item) => ({
	name: string(item.name, 32768),
	address: string(item.smtpAddress || item.email, 32768)
});
var addressText = (items) => items.map((item) => item.name && item.address ? `${item.name} <${item.address}>` : item.address || item.name || "").join(", ");
var copy = (value) => {
	const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
	if (!(bytes instanceof Uint8Array) || bytes.length > 134217728) throw new Error("Invalid or oversized MSG attachment.");
	return new Uint8Array(bytes).buffer;
};
function assertFieldTree(root) {
	var _a, _b;
	const seen = /* @__PURE__ */ new Set();
	const pending = [{
		item: root,
		depth: 0
	}];
	let count = 0;
	while (pending.length) {
		const { item, depth } = pending.pop();
		if (depth > MAX_NESTED_MESSAGES || seen.has(item) || ++count > 32768) throw new Error("Outlook MSG nesting limit exceeded.");
		seen.add(item);
		if ((((_a = item.attachments) === null || _a === void 0 ? void 0 : _a.length) || 0) > MAX_ATTACHMENTS || (((_b = item.recipients) === null || _b === void 0 ? void 0 : _b.length) || 0) > MAX_RECIPIENTS) throw new Error("Outlook MSG recipient/attachment limit exceeded.");
		for (const attachment of item.attachments || []) if (attachment.innerMsgContentFields) pending.push({
			item: attachment.innerMsgContentFields,
			depth: depth + 1
		});
	}
}
/** Exported only from the internal module for deterministic normalization tests. */
async function normalizeMsg(reader, fields, filename, objectUrls, cidUrls, signal) {
	var _a, _b;
	signal === null || signal === void 0 || signal.throwIfAborted();
	if (fields.error || fields.dataType !== "msg") throw new Error(string(fields.error) || "The file does not contain a readable Outlook message.");
	assertFieldTree(fields);
	const warnings = [];
	const actualSender = {
		name: string(fields.senderName, 32768),
		address: string(fields.senderSmtpAddress || fields.senderEmail, 32768)
	};
	const represented = {
		name: string(fields.sentRepresentingName, 32768),
		address: string(fields.sentRepresentingSmtpAddress || fields.sentRepresentingEmail, 32768)
	};
	const hasRepresentation = !!(represented.name || represented.address);
	const from = [hasRepresentation ? represented : actualSender].filter((item) => item.name || item.address);
	const sender = hasRepresentation && (actualSender.address || actualSender.name) && (actualSender.address !== represented.address || actualSender.name !== represented.name) ? [actualSender] : [];
	const to = [];
	const cc = [];
	const bcc = [];
	for (const item of fields.recipients || []) {
		const address = recipient(item);
		if (!address.name && !address.address) continue;
		const kind = String((_a = item.recipType) !== null && _a !== void 0 ? _a : "to").toLowerCase();
		(kind === "cc" || kind === "2" ? cc : kind === "bcc" || kind === "3" ? bcc : to).push(address);
	}
	if (!to.length && fields.displayTo) to.push({ name: string(fields.displayTo, 32768) });
	if (!cc.length && fields.displayCc) cc.push({ name: string(fields.displayCc, 32768) });
	if (!bcc.length && fields.displayBcc) bcc.push({ name: string(fields.displayBcc, 32768) });
	let html = string(fields.bodyHtml);
	if (!html && fields.html) html = decodeEmailHtmlBytes(fields.html, fields.internetCodepage, fields.messageCodepage);
	let text = string(fields.body);
	let rtf;
	if ((_b = fields.compressedRtf) === null || _b === void 0 ? void 0 : _b.length) try {
		const uncompressed = decompressMsgRtf(fields.compressedRtf);
		const extracted = extractMsgRtf(uncompressed, fields.messageCodepage);
		text || (text = extracted.text);
		html || (html = extracted.html || "");
		rtf = copy(uncompressed);
	} catch (error) {
		if (!html && !text) throw error;
		warnings.push("email.msg.rtfUnavailable");
	}
	signal === null || signal === void 0 || signal.throwIfAborted();
	let inlineBytes = 0;
	const attachments = (fields.attachments || []).map((attachment, index) => {
		const fallback = `attachment-${index + 1}`;
		let name = safeMsgAttachmentName(attachment.fileName || attachment.fileNameShort || attachment.name, fallback);
		const extension = string(attachment.extension, 128).replace(/^\./, "");
		if (attachment.innerMsgContent && !/\.msg$/i.test(name)) name += ".msg";
		else if (!name.includes(".") && /^[a-z0-9]{1,16}$/i.test(extension)) name += `.${extension}`;
		const hint = string(attachment.attachMimeTag, 256).split(";")[0].trim().toLowerCase();
		const mimeType = attachment.innerMsgContent ? MIME.msg : /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(hint) ? hint : MIME[name.split(".").pop().toLowerCase()] || "application/octet-stream";
		const size = Number.isSafeInteger(attachment.contentLength) && attachment.contentLength >= 0 ? attachment.contentLength : -1;
		if (size > 134217728) throw new Error("Outlook MSG attachment exceeds the size limit.");
		const contentId = string(attachment.pidContentId, 32768);
		const contentLocation = string(attachment.contentLocation, 32768);
		const result = {
			id: `msg-${index}`,
			name,
			size,
			mimeType,
			contentId,
			contentLocation,
			inline: !!attachment.attachmentHidden || !!contentId,
			async load() {
				signal === null || signal === void 0 || signal.throwIfAborted();
				const extracted = reader.getAttachment(attachment);
				if (!extracted || !(extracted.content instanceof Uint8Array)) throw new Error(`Attachment data is not embedded: ${name}`);
				const buffer = copy(extracted.content);
				result.size = buffer.byteLength;
				signal === null || signal === void 0 || signal.throwIfAborted();
				return buffer;
			}
		};
		return result;
	});
	for (const attachment of attachments) {
		if (!!!(attachment.contentId || attachment.contentLocation || attachment.inline || html.includes(attachment.name)) || !RASTER_MIME.test(attachment.mimeType || "")) continue;
		signal === null || signal === void 0 || signal.throwIfAborted();
		try {
			if (inlineBytes + Math.max(0, attachment.size) > MAX_INLINE_BYTES) throw new Error("Inline image size limit exceeded.");
			const bytes = await attachment.load();
			inlineBytes += bytes.byteLength;
			if (inlineBytes > MAX_INLINE_BYTES) throw new Error("Inline image size limit exceeded.");
			signal === null || signal === void 0 || signal.throwIfAborted();
			const keys = [normalizeEmailResourceId(attachment.contentId || ""), attachment.contentLocation].filter((key) => !!key);
			if (attachments.filter((item) => item.name === attachment.name).length === 1) keys.push(attachment.name);
			const available = keys.map(normalizeEmailResourceId).filter((key) => !cidUrls.has(key));
			if (available.length) {
				const url = createEmailImageResource(bytes, attachment.mimeType, objectUrls);
				available.forEach((key) => cidUrls.set(key, url));
			}
		} catch (error) {
			if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw error;
			if (!warnings.includes("email.msg.inlineUnavailable")) warnings.push("email.msg.inlineUnavailable");
		}
	}
	const subject = string(fields.subject, 32768) || filename;
	const date = string(fields.clientSubmitTime || fields.messageDeliveryTime || fields.creationTime, 4096);
	const rawHeaders = string(fields.headers, 2097152);
	const headerLine = (key, value) => value ? `${key}: ${value.replace(/[\r\n\0]/g, " ")}` : "";
	const headers = rawHeaders || [
		"X-File-Viewer-Source: Outlook MAPI properties (not transport headers)",
		headerLine("Subject", subject),
		headerLine("From", addressText(from)),
		headerLine("Sender", addressText(sender)),
		headerLine("To", addressText(to)),
		headerLine("Cc", addressText(cc)),
		headerLine("Bcc", addressText(bcc)),
		headerLine("Date", date),
		headerLine("Message-ID", string(fields.messageId, 32768)),
		headerLine("Message-Class", string(fields.messageClass, 32768))
	].filter(Boolean).join("\r\n");
	if (!html && !text && !rtf) warnings.push("email.msg.noBody");
	if (/\.smime(?:\.|$)|rpmsg|protected/i.test(string(fields.messageClass, 32768))) warnings.push("email.msg.protected");
	return {
		kind: "msg",
		subject,
		from,
		sender,
		to,
		cc,
		bcc,
		date,
		text,
		html,
		rtf,
		headers,
		attachments,
		warnings
	};
}
/** Capture standard MAPI strings not named by the reader's default map. */
function captureMsgProperty(fields, tag, raw, codepage) {
	const name = {
		66: "sentRepresentingName",
		101: "sentRepresentingEmail",
		3588: "displayTo",
		3587: "displayCc",
		3586: "displayBcc",
		14099: "contentLocation"
	}[tag >>> 16];
	const type = tag & 65535;
	if (!name || !raw || type !== 31 && type !== 30) return;
	if (raw.length > 65536) throw new Error("Outlook MSG metadata exceeds the safety limit.");
	const value = decodeEmailHtmlBytes(raw, type === 31 ? 1200 : codepage || 1252);
	if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return;
	fields[name] = value;
}
async function parseMsg(buffer, filename, objectUrls, cidUrls, signal) {
	signal === null || signal === void 0 || signal.throwIfAborted();
	const { messageCodepage } = inspectMsgContainer(buffer);
	const module = await __vitePreload(() => import("./lib-B8jGCOkb.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1)), __vite__mapDeps([0,1,2,3,4,5]));
	signal === null || signal === void 0 || signal.throwIfAborted();
	const exported = module.default;
	const constructor = typeof exported === "function" ? exported : exported === null || exported === void 0 ? void 0 : exported.default;
	if (typeof constructor !== "function") throw new Error("Outlook MSG parser failed to load.");
	const reader = new constructor(buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer).slice().buffer);
	const label = msgCodepageLabel(messageCodepage);
	reader.parserConfig = {
		...messageCodepage ? { ansiEncoding: {
			949: "cp949",
			936: "cp936",
			932: "cp932",
			950: "cp950"
		}[messageCodepage] || label || `cp${messageCodepage}` } : {},
		propertyObserver: (fields, tag, raw) => captureMsgProperty(fields, tag, raw, messageCodepage)
	};
	const initialUrls = objectUrls.length;
	const initialCids = new Map(cidUrls);
	try {
		return await normalizeMsg(reader, reader.getFileData(), filename, objectUrls, cidUrls, signal);
	} catch (error) {
		objectUrls.splice(initialUrls).forEach((url) => URL.revokeObjectURL(url));
		cidUrls.clear();
		initialCids.forEach((url, cid) => cidUrls.set(cid, url));
		throw error;
	}
}
//#endregion
export { emailRenderer as a, parseEml as c, safeMsgAttachmentName as i, renderEmail as l, normalizeMsg as n, emailRendererDefinition as o, parseMsg as r, renderFileViewerEmail as s, captureMsgProperty as t };
