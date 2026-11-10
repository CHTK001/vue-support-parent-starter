import { i as normalizeFileViewerUiDensity, y as disposeFileViewerRendered } from "./dist-B6GcL3C6.js";
import { c as inspectEvidenceRecord, i as isProbablyJws, l as inspectSignatureContainer, n as isProbablyOpenPgp, o as normalizeSignatureContainerLimits, r as inspectJws } from "./formatDetection-kdRUGOvz.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/structured/containerClient.js
var nextContainerRequestId = 0;
var SignatureContainerWorkerClient = class {
	constructor(workerFactory) {
		this.workerFactory = workerFactory;
		this.pending = /* @__PURE__ */ new Map();
	}
	ensureWorker() {
		if (this.worker) return this.worker;
		if (typeof Worker === "undefined") throw new Error("ASiC inspection requires Web Worker support.");
		const worker = this.workerFactory ? this.workerFactory() : new Worker(new URL("../../../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/container.worker.js", import.meta.url), {
			type: "module",
			name: "file-viewer-signature-container"
		});
		worker.addEventListener("message", (event) => {
			const pending = this.pending.get(event.data.id);
			if (!pending) return;
			clearTimeout(pending.timer);
			this.pending.delete(event.data.id);
			if (event.data.ok) pending.resolve(event.data.result);
			else pending.reject(Object.assign(new Error(event.data.error.message), { code: event.data.error.code }));
		});
		worker.addEventListener("error", (event) => this.failWorker(new Error(event.message || "ASiC Worker failed.")));
		worker.addEventListener("messageerror", () => this.failWorker(/* @__PURE__ */ new Error("ASiC Worker returned an unreadable response.")));
		this.worker = worker;
		return worker;
	}
	failWorker(error) {
		var _a;
		(_a = this.worker) === null || _a === void 0 || _a.terminate();
		this.worker = void 0;
		for (const pending of this.pending.values()) {
			clearTimeout(pending.timer);
			pending.reject(error);
		}
		this.pending.clear();
	}
	inspectAsic(input, requestedLimits) {
		if (this.pending.size >= 2) return Promise.reject(/* @__PURE__ */ new Error("ASiC Worker request limit exceeded."));
		const limits = normalizeSignatureContainerLimits(requestedLimits);
		if (input.byteLength === 0 || input.byteLength > limits.maxContainerBytes) return Promise.reject(/* @__PURE__ */ new Error(`ASiC input exceeds the ${limits.maxContainerBytes}-byte boundary.`));
		const worker = this.ensureWorker();
		const id = `signature-container-${++nextContainerRequestId}`;
		const transferable = input.slice(0);
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.failWorker(new DOMException("ASiC inspection timed out.", "TimeoutError"));
			}, limits.maxWorkerMs);
			this.pending.set(id, {
				resolve,
				reject,
				timer
			});
			worker.postMessage({
				id,
				type: "inspect-asic",
				input: transferable,
				limits
			}, [transferable]);
		});
	}
	dispose() {
		this.failWorker(new DOMException("ASiC Worker was terminated.", "AbortError"));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/signature.js
var DEFAULT_MAX_CONTAINER_SIZE = 67108864;
var DEFAULT_MAX_NESTED_PREVIEW_SIZE = 33554432;
var signatureStyle = `
.signature-shell{box-sizing:border-box;width:100%;height:100%;min-width:0;min-height:0;overflow:auto;background:#edf2f7;color:#172033;font-family:Aptos,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}
.signature-shell *{box-sizing:border-box}
.signature-header{position:sticky;top:0;z-index:3;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid rgba(23,32,51,.09);background:rgba(255,255,255,.94);backdrop-filter:blur(12px)}
.signature-title{min-width:0}.signature-title small{display:block;color:#24765a;font-size:11px;font-weight:900;letter-spacing:.08em}.signature-title h2{margin:3px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:19px}.signature-title p{margin:5px 0 0;color:#64748b;font-size:12px}.signature-phase{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:#e7f8ef;color:#166534;font-size:11px;font-weight:900}
.signature-content{display:grid;grid-template-columns:minmax(260px,340px) minmax(0,1fr);gap:14px;padding:14px}
.signature-sidebar,.signature-main{min-width:0;display:flex;flex-direction:column;gap:12px}
.signature-card{min-width:0;padding:14px;border:1px solid rgba(23,32,51,.08);border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(23,32,51,.05)}
.signature-card h3{margin:0 0 10px;font-size:14px}.signature-card h4{margin:13px 0 7px;font-size:12px}.signature-card p{margin:6px 0;color:#526174;font-size:12px;line-height:1.55}.signature-card code{font-family:'SFMono-Regular',Consolas,monospace;font-size:11px;overflow-wrap:anywhere}
.signature-grid{display:grid;grid-template-columns:minmax(110px,auto) minmax(0,1fr);gap:7px 10px;margin:0}.signature-grid dt{color:#708095;font-size:11px;font-weight:800}.signature-grid dd{min-width:0;margin:0;overflow-wrap:anywhere;font-size:12px}
.signature-warning{padding:10px 11px;border-radius:10px;background:#fff7e8;color:#854d0e;font-size:11px;line-height:1.5}.signature-warning+.signature-warning{margin-top:7px}
.signature-status-list{display:flex;flex-wrap:wrap;gap:6px}.signature-status{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#eef2f7;color:#475569;font-size:10px;font-weight:900}.signature-status[data-state='valid']{background:#dcfce7;color:#166534}.signature-status[data-state='invalid']{background:#fee2e2;color:#991b1b}.signature-status[data-state='pending']{background:#fef3c7;color:#92400e}
.signature-item{padding:11px;border:1px solid rgba(23,32,51,.08);border-radius:11px;background:#f8fafc}.signature-item+.signature-item{margin-top:9px}.signature-item-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.signature-item-head strong{font-size:12px}.signature-item-head span{color:#64748b;font-size:10px}
.signature-original{display:flex;flex-direction:column;gap:9px}.signature-file{width:100%;font-size:12px}.signature-file::file-selector-button{margin-right:9px;padding:7px 10px;border:0;border-radius:8px;background:#1f7a58;color:#fff;font:inherit;font-weight:800;cursor:pointer}.signature-original-state{min-height:18px;color:#64748b;font-size:11px}
.signature-preview{min-height:360px;overflow:hidden;padding:0}.signature-preview-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-bottom:1px solid rgba(23,32,51,.08)}.signature-preview-head strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.signature-preview-target{min-height:340px;height:min(65vh,720px);overflow:auto;background:#f8fafc}.signature-preview-empty{height:100%;min-height:340px;display:flex;align-items:center;justify-content:center;padding:28px;color:#64748b;text-align:center;font-size:12px;line-height:1.6}
.signature-openpgp-note{padding:10px 11px;border-radius:10px;background:#eef6ff;color:#1e3a5f;font-size:11px;line-height:1.5}.signature-key-input{display:flex;flex-direction:column;gap:8px}
.signature-error{padding:14px;border:1px solid #fecaca;border-radius:12px;background:#fff1f2;color:#991b1b;font-size:12px;line-height:1.55}
.signature-loading{display:flex;align-items:center;gap:10px;padding:15px;color:#526174;font-size:12px}.signature-spinner{width:20px;height:20px;border:2px solid rgba(31,122,88,.18);border-top-color:#1f7a58;border-radius:999px;animation:signature-spin .8s linear infinite}
.signature-shell[data-viewer-density='compact'] .signature-header{padding:9px 11px}.signature-shell[data-viewer-density='compact'] .signature-content{gap:8px;padding:8px}.signature-shell[data-viewer-density='compact'] .signature-card{padding:10px;border-radius:10px}
[data-viewer-theme='dark'] .signature-shell{background:#111827;color:#e5edf7}[data-viewer-theme='dark'] .signature-header,[data-viewer-theme='dark'] .signature-card{background:#182233;border-color:rgba(255,255,255,.08)}[data-viewer-theme='dark'] .signature-item,[data-viewer-theme='dark'] .signature-preview-target{background:#101827;border-color:rgba(255,255,255,.08)}[data-viewer-theme='dark'] .signature-title p,[data-viewer-theme='dark'] .signature-card p,[data-viewer-theme='dark'] .signature-grid dt,[data-viewer-theme='dark'] .signature-item-head span,[data-viewer-theme='dark'] .signature-original-state,[data-viewer-theme='dark'] .signature-preview-empty{color:#9eabc0}
@media(max-width:860px){.signature-content{grid-template-columns:1fr}.signature-header{position:relative}.signature-preview-target{height:520px}}
@keyframes signature-spin{to{transform:rotate(360deg)}}
`;
var createElement = (documentRef, tag, className, text) => {
	const element = documentRef.createElement(tag);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var formatBytes = (value) => {
	if (value < 1024) return `${value} B`;
	if (value < 1048576) return `${(value / 1024).toFixed(1)} KiB`;
	return `${(value / 1048576).toFixed(1)} MiB`;
};
var valueOrDash = (value) => value === void 0 || value === null || value === "" ? "—" : String(value);
var appendDefinitionList = (documentRef, parent, rows) => {
	const list = createElement(documentRef, "dl", "signature-grid");
	rows.forEach(([label, value]) => {
		list.append(createElement(documentRef, "dt", void 0, label), createElement(documentRef, "dd", void 0, valueOrDash(value)));
	});
	parent.append(list);
};
var statusBadge = (documentRef, label, value, pendingLabel) => {
	const state = value === true ? "valid" : value === false ? "invalid" : "pending";
	const element = createElement(documentRef, "span", "signature-status", value === true ? `${label}: valid` : value === false ? `${label}: invalid` : `${label}: ${pendingLabel}`);
	element.dataset.state = state;
	return element;
};
var renderSigner = (documentRef, signer) => {
	const item = createElement(documentRef, "article", "signature-item");
	const head = createElement(documentRef, "div", "signature-item-head");
	head.append(createElement(documentRef, "strong", void 0, `Signer ${signer.index + 1}`), createElement(documentRef, "span", void 0, signer.certificateIndex === void 0 ? "certificate not matched" : `certificate ${signer.certificateIndex + 1}`));
	const statuses = createElement(documentRef, "div", "signature-status-list");
	statuses.append(statusBadge(documentRef, "Signature", signer.cryptographicSignatureValid, "not verified"), statusBadge(documentRef, "Content digest", signer.digestMatches, "original required"));
	item.append(head, statuses);
	appendDefinitionList(documentRef, item, [
		["Signer identifier", signer.sid],
		["Digest algorithm", signer.digestAlgorithm],
		["Signature algorithm", signer.signatureAlgorithm],
		["Signing time", signer.signingTime],
		["Signed content type", signer.contentTypeOid],
		["Signed message digest", signer.messageDigest],
		["CAdES signingCertificateV2", signer.signingCertificateV2 ? "Present" : "Not detected"],
		["Signature timestamp tokens", signer.signatureTimestampTokens],
		["Verification note", signer.verificationError]
	]);
	return item;
};
var renderCertificate = (documentRef, certificate) => {
	const item = createElement(documentRef, "article", "signature-item");
	const head = createElement(documentRef, "div", "signature-item-head");
	head.append(createElement(documentRef, "strong", void 0, `Certificate ${certificate.index + 1}`), createElement(documentRef, "span", void 0, `X.509 v${certificate.version || "?"}`));
	item.append(head);
	appendDefinitionList(documentRef, item, [
		["Subject", certificate.subject],
		["Issuer", certificate.issuer],
		["Serial number", certificate.serialNumber],
		["Valid from", certificate.notBefore],
		["Valid until", certificate.notAfter],
		["Public key", certificate.publicKeyAlgorithm],
		["Public key curve", certificate.publicKeyCurveOid],
		["Certificate signature", certificate.signatureAlgorithm],
		["Subject key identifier", certificate.subjectKeyIdentifier],
		["SHA-256 fingerprint", certificate.fingerprintSha256]
	]);
	return item;
};
var renderTimestamp = (documentRef, timestamp) => {
	const card = createElement(documentRef, "section", "signature-card");
	card.append(createElement(documentRef, "h3", void 0, "RFC 3161 timestamp"));
	const statuses = createElement(documentRef, "div", "signature-status-list");
	statuses.append(statusBadge(documentRef, "Message imprint", timestamp.messageImprintMatchesOriginal, "original required"));
	card.append(statuses);
	appendDefinitionList(documentRef, card, [
		["Version", timestamp.version],
		["Policy OID", timestamp.policyOid],
		["Serial number", timestamp.serialNumber],
		["Generation time", timestamp.generationTime],
		["Message imprint algorithm", timestamp.messageImprintAlgorithm],
		["Message imprint", timestamp.messageImprint],
		["Nonce", timestamp.nonce],
		["TSA certificate requested", timestamp.certReq === void 0 ? void 0 : timestamp.certReq ? "Yes" : "No"],
		["Ordering", timestamp.ordering],
		["Accuracy", timestamp.accuracy ? [
			timestamp.accuracy.seconds === void 0 ? "" : `${timestamp.accuracy.seconds}s`,
			timestamp.accuracy.millis === void 0 ? "" : `${timestamp.accuracy.millis}ms`,
			timestamp.accuracy.micros === void 0 ? "" : `${timestamp.accuracy.micros}µs`
		].filter(Boolean).join(" ") : void 0],
		["Timestamp authority", timestamp.tsa]
	]);
	return card;
};
var getFilenameExtension = (filename) => {
	const basename = filename.split(/[\\/]/).pop() || filename;
	const dot = basename.lastIndexOf(".");
	return dot > 0 && dot < basename.length - 1 ? basename.slice(dot + 1).toLowerCase() : "";
};
var stripContainerExtension = (filename) => filename.replace(/\.(?:p7m|p7s|p7b|p7c|pkcs7|cms|cmsc|tst|tsq|tsr|tsd)$/i, "");
var sniffNestedExtension = (bytes) => {
	const head = bytes.subarray(0, Math.min(bytes.byteLength, 512));
	const ascii = String.fromCharCode(...head);
	if (ascii.startsWith("%PDF-")) return "pdf";
	if (head[0] === 137 && ascii.slice(1, 4) === "PNG") return "png";
	if (head[0] === 255 && head[1] === 216) return "jpg";
	if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return "gif";
	if (ascii.startsWith("PK")) return "zip";
	const text = new TextDecoder("utf-8", { fatal: false }).decode(head).trimStart();
	if (text.startsWith("<?xml") || text.startsWith("<")) return "xml";
	if (text.startsWith("{") || text.startsWith("[")) return "json";
	return head.length === 0 || Array.from(head).filter((value) => value === 9 || value === 10 || value === 13 || value >= 32 && value < 127).length / head.length > .92 ? "txt" : "bin";
};
var resolveNestedIdentity = (inspection, sourceFilename, originalFilename, preferOriginal = false) => {
	if (preferOriginal && originalFilename) return {
		filename: originalFilename,
		extension: getFilenameExtension(originalFilename) || "bin"
	};
	const stripped = stripContainerExtension(sourceFilename);
	const extension = getFilenameExtension(stripped) || (inspection.embeddedContent ? sniffNestedExtension(inspection.embeddedContent) : "bin");
	return {
		filename: getFilenameExtension(stripped) ? stripped : `signed-content.${extension}`,
		extension
	};
};
var readBoundedBlob = async (blob, limit, label) => {
	if (blob.size > limit) throw new Error(`${label} exceeds the ${formatBytes(limit)} limit.`);
	const result = await blob.arrayBuffer();
	if (result.byteLength > limit) throw new Error(`${label} exceeds the ${formatBytes(limit)} limit.`);
	return result;
};
var readConfiguredOriginal = async (options, limit) => {
	if (!(options === null || options === void 0 ? void 0 : options.originalContent)) return;
	if (options.originalContent instanceof ArrayBuffer) {
		if (options.originalContent.byteLength > limit) throw new Error(`Original content exceeds the ${formatBytes(limit)} limit.`);
		return options.originalContent;
	}
	return readBoundedBlob(options.originalContent, limit, "Original content");
};
var readConfiguredOpenPgpKeys = async (options, limit) => {
	const keys = (options === null || options === void 0 ? void 0 : options.openPgpPublicKeys) || [];
	if (keys.length > 64) throw new Error("At most 64 OpenPGP verification keys may be supplied.");
	const result = await Promise.all(keys.map((key) => {
		if (key instanceof ArrayBuffer) {
			if (key.byteLength > limit) throw new Error(`OpenPGP verification key exceeds the ${formatBytes(limit)} limit.`);
			return key;
		}
		return readBoundedBlob(key, limit, "OpenPGP verification key");
	}));
	if (result.reduce((sum, value) => sum + value.byteLength, 0) > limit) throw new Error(`OpenPGP verification keys exceed the aggregate ${formatBytes(limit)} limit.`);
	return result;
};
var renderOpenPgpKey = (documentRef, key) => {
	const item = createElement(documentRef, "article", "signature-item");
	const head = createElement(documentRef, "div", "signature-item-head");
	head.append(createElement(documentRef, "strong", void 0, `${key.kind === "private" ? "Private-key block" : "Public key"}`), createElement(documentRef, "span", void 0, key.keyId || "key id unavailable"));
	item.append(head);
	appendDefinitionList(documentRef, item, [
		["Fingerprint", key.fingerprint],
		["Version", key.version],
		["Algorithm", key.algorithm],
		["Created", key.createdAt],
		["User IDs", key.userIds.join("; ")],
		["Subkeys", key.subkeys.length]
	]);
	if (key.kind === "private") item.append(createElement(documentRef, "div", "signature-warning", "Only public metadata is exposed. Secret MPIs, private scalars and passphrases never cross the WASM boundary."));
	return item;
};
var renderOpenPgpSignature = (documentRef, signature, index) => {
	const item = createElement(documentRef, "article", "signature-item");
	const head = createElement(documentRef, "div", "signature-item-head");
	head.append(createElement(documentRef, "strong", void 0, `Signature ${index + 1}`), createElement(documentRef, "span", void 0, signature.signatureType || "OpenPGP"));
	const statuses = createElement(documentRef, "div", "signature-status-list");
	statuses.append(statusBadge(documentRef, "Cryptographic signature", signature.cryptographicValid, "public key or original required"));
	item.append(head, statuses);
	appendDefinitionList(documentRef, item, [
		["Hash algorithm", signature.hashAlgorithm],
		["Public-key algorithm", signature.publicKeyAlgorithm],
		["Created", signature.createdAt],
		["Expires", signature.expiresAt],
		["Issuer key IDs", signature.issuerKeyIds.join(", ")],
		["Issuer fingerprints", signature.issuerFingerprints.join(", ")],
		["Verification key fingerprint", signature.verificationKeyFingerprint],
		["Verification key ID", signature.verificationKeyId],
		["Verification note", signature.verificationError]
	]);
	return item;
};
async function renderSignature(buffer, target, type, context) {
	var _a, _b, _c;
	const documentRef = target.ownerDocument;
	const options = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.signature;
	const filename = (context === null || context === void 0 ? void 0 : context.filename) || `signature.${type || "p7m"}`;
	const requestedMaxContainer = typeof (options === null || options === void 0 ? void 0 : options.maxContainerSize) === "number" && Number.isSafeInteger(options.maxContainerSize) && options.maxContainerSize > 0 ? options.maxContainerSize : DEFAULT_MAX_CONTAINER_SIZE;
	const containerLimits = normalizeSignatureContainerLimits({
		...options === null || options === void 0 ? void 0 : options.containerLimits,
		maxContainerBytes: requestedMaxContainer
	});
	const maxContainerSize = containerLimits.maxContainerBytes;
	const requestedNestedPreviewSize = typeof (options === null || options === void 0 ? void 0 : options.maxNestedPreviewSize) === "number" && Number.isSafeInteger(options.maxNestedPreviewSize) && options.maxNestedPreviewSize > 0 ? options.maxNestedPreviewSize : DEFAULT_MAX_NESTED_PREVIEW_SIZE;
	const maxNestedPreviewSize = Math.min(requestedNestedPreviewSize, containerLimits.maxEntryBytes);
	if (buffer.byteLength > maxContainerSize) throw new Error(`The cryptographic container (${formatBytes(buffer.byteLength)}) exceeds the ${formatBytes(maxContainerSize)} parsing limit.`);
	const style = createElement(documentRef, "style");
	style.textContent = signatureStyle;
	const root = createElement(documentRef, "section", "signature-shell");
	root.dataset.viewerDensity = normalizeFileViewerUiDensity((_c = (_b = context === null || context === void 0 ? void 0 : context.options) === null || _b === void 0 ? void 0 : _b.ui) === null || _c === void 0 ? void 0 : _c.density);
	target.replaceChildren(style, root);
	let originalContent = await readConfiguredOriginal(options, maxNestedPreviewSize);
	let originalFilename = options === null || options === void 0 ? void 0 : options.originalFilename;
	let openPgpPublicKeys = await readConfiguredOpenPgpKeys(options, Math.min(maxNestedPreviewSize, 8388608));
	let jwsVerificationKeys = [...(options === null || options === void 0 ? void 0 : options.jwsVerificationKeys) || []];
	let openPgpClient;
	let containerClient;
	let nestedRendered;
	let disposed = false;
	let renderSequence = 0;
	const clearNested = async () => {
		await disposeFileViewerRendered(nestedRendered);
		nestedRendered = void 0;
	};
	const renderInspection = async () => {
		var _a, _b;
		const sequence = ++renderSequence;
		await clearNested();
		root.replaceChildren(createElement(documentRef, "div", "signature-loading"));
		root.firstElementChild.append(createElement(documentRef, "span", "signature-spinner"), createElement(documentRef, "span", void 0, "Inspecting signature and timestamp structures locally…"));
		try {
			const sourceBytes = new Uint8Array(buffer);
			const extension = getFilenameExtension(filename) || (type || "").toLowerCase();
			if ([
				"asics",
				"scs",
				"asice",
				"sce"
			].includes(extension)) {
				containerClient || (containerClient = new SignatureContainerWorkerClient((options === null || options === void 0 ? void 0 : options.workerFactory) ? () => options.workerFactory("container") : void 0));
				const inspection = await containerClient.inspectAsic(buffer, containerLimits);
				if (disposed || sequence !== renderSequence) return;
				const signatureResults = [];
				for (const member of inspection.signatures) {
					let result = "Parsed metadata only";
					let document;
					try {
						if (member.kind === "cades" && member.data) {
							const candidates = member.referencedDocuments.length ? inspection.documents.filter((candidate) => member.referencedDocuments.includes(candidate.name)) : inspection.documents.length === 1 ? inspection.documents : [];
							let cms = await inspectSignatureContainer(member.data, { sourceFilename: member.name });
							if (cms.detached && candidates.length) for (const candidate of candidates.slice(0, 16)) {
								if (!candidate.data) continue;
								const checked = await inspectSignatureContainer(member.data, {
									sourceFilename: member.name,
									originalContent: candidate.data
								});
								if (checked.signers.some((signer) => signer.digestMatches === true && signer.cryptographicSignatureValid === true)) {
									cms = checked;
									document = candidate.name;
									break;
								}
								cms = checked;
							}
							const checked = cms.signers.filter((signer) => signer.cryptographicSignatureValid !== void 0);
							result = checked.length ? checked.every((signer) => signer.cryptographicSignatureValid === true) ? "Cryptographic signature valid" : "Cryptographic signature invalid" : cms.detached ? "Original document mapping required" : "Signature not checked";
						} else if (member.kind === "timestamp" && member.data) {
							const timestamp = await inspectSignatureContainer(member.data, { sourceFilename: member.name });
							result = timestamp.timestamp ? "Timestamp structure parsed" : timestamp.detectedFormat;
						} else if (member.kind === "evidence-record" && member.data) result = `${(await inspectEvidenceRecord(member.data)).archiveTimestamps.length} archive timestamp(s) parsed`;
						else if (member.kind === "jws" && member.data) {
							const jws = await inspectJws(member.data, {
								verificationKeys: jwsVerificationKeys,
								limits: containerLimits
							});
							result = jws.signatures.some((item) => item.cryptographicValid === false) ? "JWS signature invalid" : jws.signatures.length && jws.signatures.every((item) => item.cryptographicValid === true) ? "JWS signatures valid" : "JWS parsed; verification key or payload required";
						} else if (member.kind === "xades-or-xml") result = member.referencedDocuments.length ? `XML signature metadata references ${member.referencedDocuments.length} document(s)` : "XML signature metadata parsed; canonicalization not verified";
					} catch (error) {
						result = `Inspection failed: ${error instanceof Error ? error.message : String(error)}`;
					}
					signatureResults.push({
						name: member.name,
						result,
						document
					});
				}
				root.replaceChildren();
				const header = createElement(documentRef, "header", "signature-header");
				const title = createElement(documentRef, "div", "signature-title");
				title.append(createElement(documentRef, "small", void 0, "ASSOCIATED SIGNATURE CONTAINER"), createElement(documentRef, "h2", void 0, filename), createElement(documentRef, "p", void 0, `${inspection.kind} · ${inspection.mediaType}`));
				header.append(title, createElement(documentRef, "span", "signature-phase", "OPT-IN · BOUNDED ZIP WORKER"));
				const content = createElement(documentRef, "div", "signature-content");
				const sidebar = createElement(documentRef, "aside", "signature-sidebar");
				const main = createElement(documentRef, "main", "signature-main");
				const summary = createElement(documentRef, "section", "signature-card");
				summary.append(createElement(documentRef, "h3", void 0, "ASiC package"));
				appendDefinitionList(documentRef, summary, [
					["Type", inspection.kind],
					["Source size", formatBytes(inspection.sourceSize)],
					["Entries", inspection.entryCount],
					["Inflated total", formatBytes(inspection.totalUncompressedBytes)],
					["Documents", inspection.documents.length],
					["Signature/evidence members", inspection.signatures.length]
				]);
				sidebar.append(summary);
				const boundaries = createElement(documentRef, "section", "signature-card");
				boundaries.append(createElement(documentRef, "h3", void 0, "Security and validation boundaries"));
				inspection.warnings.forEach((warning) => boundaries.append(createElement(documentRef, "div", "signature-warning", warning)));
				sidebar.append(boundaries);
				if (signatureResults.length) {
					const signatureCard = createElement(documentRef, "section", "signature-card");
					signatureCard.append(createElement(documentRef, "h3", void 0, "Signatures and evidence"));
					signatureResults.forEach((item) => {
						const row = createElement(documentRef, "article", "signature-item");
						row.append(createElement(documentRef, "strong", void 0, item.name));
						appendDefinitionList(documentRef, row, [["Result", item.result], ["Matched document", item.document]]);
						signatureCard.append(row);
					});
					main.append(signatureCard);
				}
				const previewCard = createElement(documentRef, "section", "signature-card signature-preview");
				const previewHead = createElement(documentRef, "div", "signature-preview-head");
				const previewTitle = createElement(documentRef, "strong", void 0, "Contained document preview");
				const previewStatus = createElement(documentRef, "span", "signature-status");
				const previewTarget = createElement(documentRef, "div", "signature-preview-target");
				previewHead.append(previewTitle, previewStatus);
				previewCard.append(previewHead, previewTarget);
				const chooser = createElement(documentRef, "section", "signature-card");
				chooser.append(createElement(documentRef, "h3", void 0, "Contained documents"));
				const chooserList = createElement(documentRef, "div", "signature-status-list");
				chooser.append(chooserList);
				sidebar.append(chooser);
				main.append(previewCard);
				content.append(sidebar, main);
				root.append(header, content);
				const openDocument = async (member) => {
					const selection = ++renderSequence;
					await clearNested();
					if (disposed || selection !== renderSequence) return;
					previewTarget.replaceChildren();
					previewTitle.textContent = `Contained document · ${member.name}`;
					previewStatus.textContent = formatBytes(member.uncompressedSize);
					if (!member.data || member.data.byteLength > maxNestedPreviewSize) {
						previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", "This contained document exceeds the configured nested-preview boundary."));
						return;
					}
					const nestedExtension = getFilenameExtension(member.name) || sniffNestedExtension(member.data);
					if (!(context === null || context === void 0 ? void 0 : context.renderNestedBuffer) || nestedExtension === "bin") {
						previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", "No compatible nested renderer is installed for this contained document."));
						return;
					}
					nestedRendered = await context.renderNestedBuffer(member.data.buffer.slice(member.data.byteOffset, member.data.byteOffset + member.data.byteLength), nestedExtension, previewTarget, {
						...context,
						filename: member.name,
						url: void 0,
						streamUrl: void 0
					});
				};
				inspection.documents.forEach((member, index) => {
					const button = createElement(documentRef, "button", "signature-status", member.name);
					button.type = "button";
					button.addEventListener("click", () => {
						openDocument(member);
					});
					chooserList.append(button);
					if (index === 0) openDocument(member);
				});
				if (!inspection.documents.length) previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", "No contained document was found."));
				return;
			}
			if (extension === "ers") {
				const inspection = await inspectEvidenceRecord(buffer, { originalContent });
				if (disposed || sequence !== renderSequence) return;
				root.replaceChildren();
				const header = createElement(documentRef, "header", "signature-header");
				const title = createElement(documentRef, "div", "signature-title");
				title.append(createElement(documentRef, "small", void 0, "ARCHIVAL EVIDENCE"), createElement(documentRef, "h2", void 0, filename), createElement(documentRef, "p", void 0, inspection.detectedFormat));
				header.append(title, createElement(documentRef, "span", "signature-phase", "RFC 4998 · STRUCTURAL + BOUNDED"));
				const content = createElement(documentRef, "div", "signature-content");
				const sidebar = createElement(documentRef, "aside", "signature-sidebar");
				const main = createElement(documentRef, "main", "signature-main");
				const summary = createElement(documentRef, "section", "signature-card");
				summary.append(createElement(documentRef, "h3", void 0, "Evidence record"));
				appendDefinitionList(documentRef, summary, [
					["Version", inspection.version],
					["Digest algorithms", inspection.digestAlgorithms.join(", ")],
					["Archive timestamp chains", inspection.archiveTimestampChains],
					["Archive timestamps", inspection.archiveTimestamps.length],
					["Original supplied", inspection.originalContentSupplied ? "Yes" : "No"],
					["First evidence digest", inspection.originalEvidenceMatches === void 0 ? "Not checked" : inspection.originalEvidenceMatches ? "Matches" : "Does not match"],
					["Full archival validation", "Not performed"]
				]);
				sidebar.append(summary);
				const boundaries = createElement(documentRef, "section", "signature-card");
				boundaries.append(createElement(documentRef, "h3", void 0, "Validation boundaries"));
				inspection.warnings.forEach((warning) => boundaries.append(createElement(documentRef, "div", "signature-warning", warning)));
				sidebar.append(boundaries);
				const originalCard = createElement(documentRef, "section", "signature-card");
				originalCard.append(createElement(documentRef, "h3", void 0, "Protected original content"));
				const input = createElement(documentRef, "input", "signature-file");
				input.type = "file";
				input.setAttribute("aria-label", "Choose EvidenceRecord protected content");
				input.addEventListener("change", () => {
					var _a;
					const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
					if (!file) return;
					readBoundedBlob(file, maxNestedPreviewSize, "EvidenceRecord protected content").then((next) => {
						originalContent = next;
						originalFilename = file.name;
						return renderInspection();
					});
				});
				originalCard.append(input);
				sidebar.append(originalCard);
				const timestamps = createElement(documentRef, "section", "signature-card");
				timestamps.append(createElement(documentRef, "h3", void 0, "Archive timestamps"));
				inspection.archiveTimestamps.forEach((timestamp) => {
					var _a;
					const item = createElement(documentRef, "article", "signature-item");
					item.append(createElement(documentRef, "strong", void 0, `Chain ${timestamp.chainIndex + 1} · timestamp ${timestamp.index + 1}`));
					appendDefinitionList(documentRef, item, [
						["Digest algorithm", timestamp.digestAlgorithm],
						["Reduced hash-tree nodes", timestamp.reducedHashTreeNodes],
						["Generation time", (_a = timestamp.timestamp) === null || _a === void 0 ? void 0 : _a.generationTime],
						["Timestamp signatures", timestamp.timestampSignerCount],
						["Timestamp signature check", timestamp.timestampSignaturesValid === void 0 ? "Not checked" : timestamp.timestampSignaturesValid ? "Valid" : "Invalid"],
						["Evidence digest vs original", timestamp.evidenceDigestMatchesOriginal === void 0 ? "Not checked" : timestamp.evidenceDigestMatchesOriginal ? "Matches" : "Does not match"]
					]);
					timestamps.append(item);
				});
				main.append(timestamps);
				content.append(sidebar, main);
				root.append(header, content);
				return;
			}
			if (isProbablyJws(sourceBytes, filename)) {
				const inspection = await inspectJws(buffer, {
					detachedPayload: originalContent,
					verificationKeys: jwsVerificationKeys,
					limits: containerLimits
				});
				if (disposed || sequence !== renderSequence) return;
				root.replaceChildren();
				const header = createElement(documentRef, "header", "signature-header");
				const title = createElement(documentRef, "div", "signature-title");
				title.append(createElement(documentRef, "small", void 0, "JSON WEB SIGNATURE"), createElement(documentRef, "h2", void 0, filename), createElement(documentRef, "p", void 0, `${inspection.serialization} · ${inspection.signatures.length} signature(s)`));
				header.append(title, createElement(documentRef, "span", "signature-phase", "RFC 7515 · PUBLIC-KEY VERIFY"));
				const content = createElement(documentRef, "div", "signature-content");
				const sidebar = createElement(documentRef, "aside", "signature-sidebar");
				const main = createElement(documentRef, "main", "signature-main");
				const summary = createElement(documentRef, "section", "signature-card");
				summary.append(createElement(documentRef, "h3", void 0, "JWS summary"));
				appendDefinitionList(documentRef, summary, [
					["Serialization", inspection.serialization],
					["Detached payload", inspection.detached ? "Yes" : "No"],
					["Base64url payload", inspection.payloadEncoded ? "Yes" : "No"],
					["Payload size", inspection.payload ? formatBytes(inspection.payload.byteLength) : "Not supplied"],
					["Signatures", inspection.signatures.length],
					["Verification keys", jwsVerificationKeys.length]
				]);
				sidebar.append(summary);
				const boundaries = createElement(documentRef, "section", "signature-card");
				boundaries.append(createElement(documentRef, "h3", void 0, "Security and trust boundary"));
				inspection.warnings.forEach((warning) => boundaries.append(createElement(documentRef, "div", "signature-warning", warning)));
				sidebar.append(boundaries);
				if (inspection.detached) {
					const originalCard = createElement(documentRef, "section", "signature-card");
					originalCard.append(createElement(documentRef, "h3", void 0, "Detached payload"));
					const input = createElement(documentRef, "input", "signature-file");
					input.type = "file";
					input.addEventListener("change", () => {
						var _a;
						const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
						if (!file) return;
						readBoundedBlob(file, maxNestedPreviewSize, "JWS detached payload").then((next) => {
							originalContent = next;
							originalFilename = file.name;
							return renderInspection();
						});
					});
					originalCard.append(input);
					sidebar.append(originalCard);
				}
				const keyCard = createElement(documentRef, "section", "signature-card");
				keyCard.append(createElement(documentRef, "h3", void 0, "Public JWK verification keys"));
				const keyInput = createElement(documentRef, "input", "signature-file");
				keyInput.type = "file";
				keyInput.multiple = true;
				keyInput.accept = ".jwk,.json,application/json";
				keyInput.addEventListener("change", () => {
					const files = Array.from(keyInput.files || []).slice(0, 64);
					Promise.all(files.map((file) => readBoundedBlob(file, 1048576, "JWK file"))).then((values) => {
						const keys = [];
						for (const value of values) {
							const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(value));
							const candidates = "keys" in parsed && Array.isArray(parsed.keys) ? parsed.keys : [parsed];
							for (const key of candidates) {
								if (!key || typeof key !== "object" || "d" in key || "k" in key) throw new Error("Only public asymmetric JWKs are accepted.");
								keys.push({
									key,
									kid: key.kid
								});
							}
						}
						jwsVerificationKeys = keys.slice(0, 64);
						return renderInspection();
					});
				});
				keyCard.append(keyInput);
				sidebar.append(keyCard);
				const signatures = createElement(documentRef, "section", "signature-card");
				signatures.append(createElement(documentRef, "h3", void 0, "Signatures"));
				inspection.signatures.forEach((signature) => {
					const item = createElement(documentRef, "article", "signature-item");
					item.append(createElement(documentRef, "strong", void 0, `Signature ${signature.index + 1}`));
					const status = createElement(documentRef, "div", "signature-status-list");
					status.append(statusBadge(documentRef, "Cryptographic signature", signature.cryptographicValid, inspection.detached && !inspection.payload ? "payload required" : "public key required"));
					item.append(status);
					appendDefinitionList(documentRef, item, [
						["Algorithm", signature.algorithm],
						["Key ID", signature.keyId],
						["Signature bytes", signature.signatureBytes],
						["JAdES-related properties", signature.jadesProperties.join(", ")],
						["Verification note", signature.verificationError],
						["Protected header", JSON.stringify(signature.protectedHeader)],
						["Unprotected header", JSON.stringify(signature.unprotectedHeader)]
					]);
					signatures.append(item);
				});
				main.append(signatures);
				const previewCard = createElement(documentRef, "section", "signature-card signature-preview");
				const previewTarget = createElement(documentRef, "div", "signature-preview-target");
				const sniffedPayloadExtension = inspection.payload ? sniffNestedExtension(inspection.payload) : "bin";
				const payloadExtension = originalFilename ? getFilenameExtension(originalFilename) || sniffedPayloadExtension : sniffedPayloadExtension;
				const payloadName = originalFilename || `jws-payload.${payloadExtension}`;
				const previewHead = createElement(documentRef, "div", "signature-preview-head");
				previewHead.append(createElement(documentRef, "strong", void 0, `Payload preview · ${payloadName}`), createElement(documentRef, "span", "signature-status", inspection.payload ? formatBytes(inspection.payload.byteLength) : "payload unavailable"));
				previewCard.append(previewHead, previewTarget);
				main.append(previewCard);
				content.append(sidebar, main);
				root.append(header, content);
				if (inspection.payload && inspection.payload.byteLength <= maxNestedPreviewSize && (context === null || context === void 0 ? void 0 : context.renderNestedBuffer) && payloadExtension !== "bin") nestedRendered = await context.renderNestedBuffer(inspection.payload.buffer.slice(inspection.payload.byteOffset, inspection.payload.byteOffset + inspection.payload.byteLength), payloadExtension, previewTarget, {
					...context,
					filename: payloadName,
					url: void 0,
					streamUrl: void 0
				});
				else previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", inspection.payload ? "No compatible nested renderer is installed for this payload." : "Supply the detached payload to preview and verify it."));
				return;
			}
			if (isProbablyOpenPgp(sourceBytes, filename, type)) {
				const { OpenPgpWorkerClient } = await import("./client-BFTVarPZ.js");
				openPgpClient || (openPgpClient = new OpenPgpWorkerClient((options === null || options === void 0 ? void 0 : options.workerFactory) ? () => options.workerFactory("openpgp") : void 0));
				const inspection = await openPgpClient.inspect(buffer, options === null || options === void 0 ? void 0 : options.openPgpLimits, openPgpPublicKeys);
				let verification;
				if (inspection.classification === "detached-signature" && originalContent && openPgpPublicKeys.length) verification = await openPgpClient.verifyDetached(originalContent, buffer, openPgpPublicKeys, options === null || options === void 0 ? void 0 : options.openPgpLimits);
				if (disposed || sequence !== renderSequence) return;
				root.replaceChildren();
				const header = createElement(documentRef, "header", "signature-header");
				const title = createElement(documentRef, "div", "signature-title");
				title.append(createElement(documentRef, "small", void 0, "OPENPGP · rPGP / WASM"), createElement(documentRef, "h2", void 0, filename), createElement(documentRef, "p", void 0, inspection.classification));
				header.append(title, createElement(documentRef, "span", "signature-phase", "OPTIONAL · LAZY WORKER / WASM"));
				const content = createElement(documentRef, "div", "signature-content");
				const sidebar = createElement(documentRef, "aside", "signature-sidebar");
				const main = createElement(documentRef, "main", "signature-main");
				const summary = createElement(documentRef, "section", "signature-card");
				summary.append(createElement(documentRef, "h3", void 0, "OpenPGP summary"));
				appendDefinitionList(documentRef, summary, [
					["Classification", inspection.classification],
					["ASCII armored", inspection.armored ? "Yes" : "No"],
					["Armor type", inspection.armorType],
					["Encrypted", inspection.encrypted ? "Yes" : "No"],
					["Integrity protected", inspection.integrityProtected === void 0 ? void 0 : inspection.integrityProtected ? "Yes" : "No"],
					["Symmetric algorithm", inspection.symmetricAlgorithm],
					["AEAD mode", inspection.aeadMode],
					["Recipients", inspection.recipients.join(", ")],
					["Compressed", inspection.compressed ? "Yes" : "No"],
					["Packet count", inspection.packetCount],
					["Packet types", inspection.packetTypes.join(", ")],
					["Keys", inspection.keys.length],
					["Signatures", inspection.signatures.length]
				]);
				summary.append(createElement(documentRef, "div", "signature-openpgp-note", "OpenPGP parsing runs browser-local inside a dedicated Worker backed by rPGP WebAssembly. OpenPGP.js and GnuPG are not used."));
				sidebar.append(summary);
				const warnings = createElement(documentRef, "section", "signature-card");
				warnings.append(createElement(documentRef, "h3", void 0, "Security boundaries"));
				[
					...inspection.warnings,
					"Parsing does not imply signature verification, key trust, identity trust, or legal validity.",
					"Private-key decryption, signing, key generation and message decryption are intentionally excluded from this inspection boundary."
				].forEach((warning) => warnings.append(createElement(documentRef, "div", "signature-warning", warning)));
				sidebar.append(warnings);
				if (inspection.classification === "detached-signature") {
					const verifyCard = createElement(documentRef, "section", "signature-card");
					verifyCard.append(createElement(documentRef, "h3", void 0, "Detached signature verification"));
					const statusList = createElement(documentRef, "div", "signature-status-list");
					statusList.append(statusBadge(documentRef, "Cryptographic signature", verification === null || verification === void 0 ? void 0 : verification.valid, originalContent ? openPgpPublicKeys.length ? "not verified" : "public key required" : "original required"));
					verifyCard.append(statusList);
					appendDefinitionList(documentRef, verifyCard, [
						["Result", verification === null || verification === void 0 ? void 0 : verification.status],
						["Key fingerprint", verification === null || verification === void 0 ? void 0 : verification.keyFingerprint],
						["Key ID", verification === null || verification === void 0 ? void 0 : verification.keyId],
						["Verification note", verification === null || verification === void 0 ? void 0 : verification.error]
					]);
					const originalBox = createElement(documentRef, "div", "signature-original");
					const originalInput = createElement(documentRef, "input", "signature-file");
					originalInput.type = "file";
					originalInput.setAttribute("aria-label", "Choose original OpenPGP signed content");
					const originalInputState = createElement(documentRef, "div", "signature-original-state", originalContent ? `${originalFilename || "Host-provided original"} · ${formatBytes(originalContent.byteLength)}` : "Original content is required.");
					originalInput.addEventListener("change", () => {
						var _a;
						const file = (_a = originalInput.files) === null || _a === void 0 ? void 0 : _a[0];
						if (!file) return;
						readBoundedBlob(file, maxNestedPreviewSize, "OpenPGP original content").then((next) => {
							originalContent = next;
							originalFilename = file.name;
							return renderInspection();
						}).catch((error) => {
							originalInputState.textContent = error instanceof Error ? error.message : String(error);
						});
					});
					originalBox.append(originalInput, originalInputState);
					const keyBox = createElement(documentRef, "div", "signature-key-input");
					const keyInput = createElement(documentRef, "input", "signature-file");
					keyInput.type = "file";
					keyInput.multiple = true;
					keyInput.setAttribute("aria-label", "Choose OpenPGP public verification keys");
					const keyInputState = createElement(documentRef, "div", "signature-original-state", openPgpPublicKeys.length ? `${openPgpPublicKeys.length} verification key file(s) supplied.` : "Supply one or more public keys; no keyring lookup is performed.");
					keyInput.addEventListener("change", () => {
						const files = Array.from(keyInput.files || []).slice(0, 64);
						Promise.all(files.map((file) => readBoundedBlob(file, 8388608, "OpenPGP public key"))).then((keys) => {
							if (keys.reduce((sum, value) => sum + value.byteLength, 0) > 33554432) throw new Error("OpenPGP public keys exceed the 32 MiB aggregate boundary.");
							openPgpPublicKeys = keys;
							return renderInspection();
						}).catch((error) => {
							keyInputState.textContent = error instanceof Error ? error.message : String(error);
						});
					});
					keyBox.append(keyInput, keyInputState);
					verifyCard.append(originalBox, keyBox);
					sidebar.append(verifyCard);
				}
				if (inspection.keys.length) {
					const keysCard = createElement(documentRef, "section", "signature-card");
					keysCard.append(createElement(documentRef, "h3", void 0, "Key metadata"));
					inspection.keys.forEach((key) => keysCard.append(renderOpenPgpKey(documentRef, key)));
					main.append(keysCard);
				}
				if (inspection.signatures.length) {
					const signaturesCard = createElement(documentRef, "section", "signature-card");
					signaturesCard.append(createElement(documentRef, "h3", void 0, "Signature metadata"));
					inspection.signatures.forEach((signature, index) => signaturesCard.append(renderOpenPgpSignature(documentRef, signature, index)));
					main.append(signaturesCard);
				}
				const previewCard = createElement(documentRef, "section", "signature-card signature-preview");
				const previewHead = createElement(documentRef, "div", "signature-preview-head");
				const previewTarget = createElement(documentRef, "div", "signature-preview-target");
				const literal = inspection.literalData;
				const literalBytes = literal === null || literal === void 0 ? void 0 : literal.data;
				const literalFilename = (literal === null || literal === void 0 ? void 0 : literal.filename) || "openpgp-literal-data.bin";
				const literalExtension = getFilenameExtension(literalFilename) || (literalBytes ? sniffNestedExtension(literalBytes) : "bin");
				previewHead.append(createElement(documentRef, "strong", void 0, `Literal-data preview · ${literalFilename}`), createElement(documentRef, "span", "signature-status", literalBytes ? formatBytes(literalBytes.byteLength) : "not extracted"));
				previewCard.append(previewHead, previewTarget);
				main.append(previewCard);
				if (!literalBytes) previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", inspection.encrypted ? "Encrypted OpenPGP data is inspection-only; automatic decryption is not exposed." : inspection.compressed ? "Compressed OpenPGP data did not expose literal content within the configured nesting and output limits." : "No safely extractable literal data is available."));
				else if (literalBytes.byteLength > maxNestedPreviewSize) previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", "Extracted literal data exceeds the nested-preview limit."));
				else if (!(context === null || context === void 0 ? void 0 : context.renderNestedBuffer) || literalExtension === "bin") previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", "Literal data was extracted, but no compatible nested renderer is available."));
				else nestedRendered = await context.renderNestedBuffer(literalBytes.buffer.slice(literalBytes.byteOffset, literalBytes.byteOffset + literalBytes.byteLength), literalExtension, previewTarget, {
					...context,
					filename: literalFilename,
					url: void 0,
					streamUrl: void 0
				});
				content.append(sidebar, main);
				root.append(header, content);
				return;
			}
			const inspection = await inspectSignatureContainer(buffer, {
				sourceFilename: filename,
				extensionHint: type,
				originalContent
			});
			if (disposed || sequence !== renderSequence) return;
			root.replaceChildren();
			const header = createElement(documentRef, "header", "signature-header");
			const title = createElement(documentRef, "div", "signature-title");
			title.append(createElement(documentRef, "small", void 0, "CRYPTOGRAPHIC CONTAINER"), createElement(documentRef, "h2", void 0, filename), createElement(documentRef, "p", void 0, inspection.detectedFormat));
			header.append(title, createElement(documentRef, "span", "signature-phase", "CMS · RFC 3161 · RFC 5544 · BOUNDED"));
			const content = createElement(documentRef, "div", "signature-content");
			const sidebar = createElement(documentRef, "aside", "signature-sidebar");
			const main = createElement(documentRef, "main", "signature-main");
			const summary = createElement(documentRef, "section", "signature-card");
			summary.append(createElement(documentRef, "h3", void 0, "Container summary"));
			appendDefinitionList(documentRef, summary, [
				["Detected format", inspection.detectedFormat],
				["Size", formatBytes(inspection.sourceSize)],
				["CMS content type", inspection.contentType],
				["Signed content type", inspection.signedContentType],
				["Digest algorithms", inspection.digestAlgorithms.join(", ")],
				["Encapsulated content", inspection.embeddedContent ? formatBytes(inspection.embeddedContent.byteLength) : "No"],
				["Detached", inspection.detached ? "Yes" : "No"],
				["Signers", inspection.signers.length],
				["Certificates", inspection.certificates.length],
				["CRLs", inspection.crlCount]
			]);
			sidebar.append(summary);
			const boundaries = createElement(documentRef, "section", "signature-card");
			boundaries.append(createElement(documentRef, "h3", void 0, "Validation boundaries"));
			inspection.warnings.forEach((warning) => boundaries.append(createElement(documentRef, "div", "signature-warning", warning)));
			sidebar.append(boundaries);
			if (inspection.timestampResponse) {
				const response = createElement(documentRef, "section", "signature-card");
				response.append(createElement(documentRef, "h3", void 0, "Timestamp response"));
				appendDefinitionList(documentRef, response, [
					["Status", inspection.timestampResponse.statusLabel],
					["Status code", inspection.timestampResponse.status],
					["Status text", inspection.timestampResponse.statusText.join("; ")],
					["Failure info", inspection.timestampResponse.failureInfo]
				]);
				sidebar.append(response);
			}
			if (inspection.timestampedData) {
				const tsd = createElement(documentRef, "section", "signature-card");
				tsd.append(createElement(documentRef, "h3", void 0, "RFC 5544 TimeStampedData"));
				appendDefinitionList(documentRef, tsd, [
					["Data URI", inspection.timestampedData.dataUri],
					["Filename", inspection.timestampedData.filename],
					["Media type", inspection.timestampedData.mediaType],
					["Metadata hash protected", inspection.timestampedData.hashProtected === void 0 ? void 0 : inspection.timestampedData.hashProtected ? "Yes" : "No"],
					["Temporal evidence entries", inspection.timestampedData.temporalEvidenceEntries]
				]);
				sidebar.append(tsd);
			}
			if (inspection.requiresOriginalContent || ((_a = inspection.timestamp) === null || _a === void 0 ? void 0 : _a.messageImprint) || inspection.kind === "timestamped-data") {
				const originalCard = createElement(documentRef, "section", "signature-card");
				originalCard.append(createElement(documentRef, "h3", void 0, "Original content"));
				const originalBox = createElement(documentRef, "div", "signature-original");
				const input = createElement(documentRef, "input", "signature-file");
				input.type = "file";
				input.setAttribute("aria-label", "Choose original content");
				const originalState = createElement(documentRef, "div", "signature-original-state", originalContent ? `${originalFilename || "Host-provided content"} · ${formatBytes(originalContent.byteLength)}` : "Choose the original file to compare its digest locally.");
				input.addEventListener("change", () => {
					var _a;
					const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
					if (!file) return;
					readBoundedBlob(file, maxNestedPreviewSize, "Original content").then((nextBuffer) => {
						originalContent = nextBuffer;
						originalFilename = file.name;
						return renderInspection();
					}).catch((error) => {
						originalState.textContent = error instanceof Error ? error.message : String(error);
					});
				});
				originalBox.append(input, originalState);
				originalCard.append(originalBox);
				sidebar.append(originalCard);
			}
			if (inspection.signers.length) {
				const signers = createElement(documentRef, "section", "signature-card");
				signers.append(createElement(documentRef, "h3", void 0, "Signers"));
				inspection.signers.forEach((signer) => signers.append(renderSigner(documentRef, signer)));
				main.append(signers);
			}
			if (inspection.timestamp) main.append(renderTimestamp(documentRef, inspection.timestamp));
			if (inspection.certificates.length) {
				const certificates = createElement(documentRef, "section", "signature-card");
				certificates.append(createElement(documentRef, "h3", void 0, "Included certificates"));
				inspection.certificates.forEach((certificate) => certificates.append(renderCertificate(documentRef, certificate)));
				main.append(certificates);
			}
			const previewCard = createElement(documentRef, "section", "signature-card signature-preview");
			const previewHead = createElement(documentRef, "div", "signature-preview-head");
			const previewTarget = createElement(documentRef, "div", "signature-preview-target");
			const timestampContainer = inspection.kind === "timestamp-request" || inspection.kind === "timestamp-response" || inspection.kind === "timestamp-token" || inspection.kind === "timestamped-data";
			const previewUsesOriginal = Boolean(originalContent && (inspection.detached || timestampContainer));
			const previewSource = previewUsesOriginal ? originalContent : inspection.embeddedContent;
			const previewBytes = previewSource ? previewSource instanceof Uint8Array ? previewSource : new Uint8Array(previewSource) : void 0;
			const identity = inspection.kind === "timestamped-data" && ((_b = inspection.timestampedData) === null || _b === void 0 ? void 0 : _b.filename) && !previewUsesOriginal ? {
				filename: inspection.timestampedData.filename,
				extension: getFilenameExtension(inspection.timestampedData.filename) || sniffNestedExtension(previewBytes || /* @__PURE__ */ new Uint8Array())
			} : resolveNestedIdentity(inspection, filename, originalFilename, previewUsesOriginal);
			previewHead.append(createElement(documentRef, "strong", void 0, `Document preview · ${identity.filename}`), createElement(documentRef, "span", "signature-status", previewBytes ? formatBytes(previewBytes.byteLength) : "content unavailable"));
			previewCard.append(previewHead, previewTarget);
			main.append(previewCard);
			content.append(sidebar, main);
			root.append(header, content);
			if (!previewBytes) previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", inspection.requiresOriginalContent ? "Supply the original content to compare its digest or timestamp message imprint and open it through the nested renderer." : "The container does not include previewable document content."));
			else if (previewBytes.byteLength > maxNestedPreviewSize) previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", `Nested preview is disabled because ${formatBytes(previewBytes.byteLength)} exceeds the ${formatBytes(maxNestedPreviewSize)} limit.`));
			else if (!(context === null || context === void 0 ? void 0 : context.renderNestedBuffer) || identity.extension === "bin") previewTarget.append(createElement(documentRef, "div", "signature-preview-empty", "The content was extracted, but no compatible nested renderer is available for this file type."));
			else nestedRendered = await context.renderNestedBuffer(previewBytes.buffer.slice(previewBytes.byteOffset, previewBytes.byteOffset + previewBytes.byteLength), identity.extension, previewTarget, {
				...context,
				filename: identity.filename,
				url: void 0,
				streamUrl: void 0
			});
		} catch (error) {
			if (disposed || sequence !== renderSequence) return;
			root.replaceChildren(createElement(documentRef, "div", "signature-error", error instanceof Error ? error.message : String(error)));
		}
	};
	await renderInspection();
	return {
		$el: root,
		async unmount() {
			disposed = true;
			renderSequence += 1;
			openPgpClient === null || openPgpClient === void 0 || openPgpClient.dispose();
			openPgpClient = void 0;
			containerClient === null || containerClient === void 0 || containerClient.dispose();
			containerClient = void 0;
			await clearNested();
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderSignature as default };
