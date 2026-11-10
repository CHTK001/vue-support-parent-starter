import { a as resolveFileViewerColorScheme, y as disposeFileViewerRendered } from "./dist-B6GcL3C6.js";
import { n as resolveFileViewerLocale, t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { n as createEmailImageResource, t as createEmailHtmlDocument } from "./emailHtml-DgjLeXKX.js";
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
var addressText = (items) => {
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
		const buffer = await attachment.load();
		const url = createEmailImageResource(buffer, attachment.mimeType, objectUrls);
		cidUrls.set(normalizeContentId(attachment.contentId), url);
	})).then(() => attachments);
};
var parseEml = async (buffer, filename, objectUrls, cidUrls) => {
	var _a, _b;
	const email = await (await import("./postal-mime-DhKs1ijc.js")).default.parse(buffer, {
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
	const email = await (await import("./postal-mime-DhKs1ijc.js")).default.parse(encoded, {
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
	if (type === "msg") return import("./msg-AME_0JGc.js").then(({ parseMsg }) => parseMsg(buffer, filename, objectUrls, cidUrls, signal));
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
		appendMeta(meta, t("email.meta.from"), addressText(parsed.from));
		if ((_a = parsed.sender) === null || _a === void 0 ? void 0 : _a.length) appendMeta(meta, msgLabels.sender, addressText(parsed.sender));
		appendMeta(meta, t("email.meta.to"), addressText(parsed.to));
		if (parsed.cc.length) appendMeta(meta, t("email.meta.cc"), addressText(parsed.cc));
		if ((_b = parsed.bcc) === null || _b === void 0 ? void 0 : _b.length) appendMeta(meta, msgLabels.bcc, addressText(parsed.bcc));
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
export { renderEmail as default };
