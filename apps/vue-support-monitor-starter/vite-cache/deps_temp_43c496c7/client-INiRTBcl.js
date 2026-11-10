//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/openpgp/client.js
var DEFAULT_SIGNATURE_PARSE_LIMITS = {
	maxInputBytes: 33554432,
	maxOutputBytes: 16777216,
	maxPacketCount: 4096,
	maxNestingDepth: 16,
	maxUserIds: 128,
	maxSubkeys: 128,
	maxSignatures: 256
};
var ABSOLUTE_SIGNATURE_PARSE_LIMITS = {
	maxInputBytes: 67108864,
	maxOutputBytes: 33554432,
	maxPacketCount: 8192,
	maxNestingDepth: 32,
	maxUserIds: 256,
	maxSubkeys: 256,
	maxSignatures: 512
};
var nextRequestId = 0;
var boundedInteger = (value, fallback, ceiling) => typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? Math.min(value, ceiling) : fallback;
var normalizeSignatureParseLimits = (limits) => {
	const result = Object.fromEntries(Object.entries(DEFAULT_SIGNATURE_PARSE_LIMITS).map(([key, fallback]) => [key, boundedInteger(limits === null || limits === void 0 ? void 0 : limits[key], fallback, ABSOLUTE_SIGNATURE_PARSE_LIMITS[key])]));
	result.maxOutputBytes = Math.min(result.maxOutputBytes, result.maxInputBytes);
	return result;
};
var OpenPgpWorkerClient = class {
	constructor(workerFactory) {
		this.workerFactory = workerFactory;
		this.pending = /* @__PURE__ */ new Map();
	}
	ensureWorker() {
		if (this.worker) return this.worker;
		if (typeof Worker === "undefined") throw new Error("OpenPGP inspection requires Web Worker support.");
		const worker = this.workerFactory ? this.workerFactory() : new Worker(new URL("../../../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/signature.worker.js", import.meta.url), {
			type: "module",
			name: "file-viewer-signature-openpgp"
		});
		worker.addEventListener("message", (event) => {
			const pending = this.pending.get(event.data.id);
			if (!pending) return;
			clearTimeout(pending.timer);
			this.pending.delete(event.data.id);
			if (event.data.ok) pending.resolve(event.data.result);
			else pending.reject(Object.assign(new Error(event.data.error.message), { code: event.data.error.code }));
		});
		worker.addEventListener("error", (event) => {
			this.failWorker(new Error(event.message || "Signature Worker failed."));
		});
		worker.addEventListener("messageerror", () => this.failWorker(/* @__PURE__ */ new Error("Signature Worker returned an unreadable response.")));
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
	request(request, transfers) {
		if (this.pending.size >= 2) return Promise.reject(/* @__PURE__ */ new Error("Signature Worker request limit exceeded."));
		const worker = this.ensureWorker();
		const id = `signature-${++nextRequestId}`;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.failWorker(new DOMException("Signature Worker request timed out.", "TimeoutError"));
			}, 2e4);
			this.pending.set(id, {
				resolve: (value) => resolve(value),
				reject,
				timer
			});
			try {
				worker.postMessage({
					...request,
					id
				}, transfers);
			} catch (error) {
				clearTimeout(timer);
				this.pending.delete(id);
				reject(error);
			}
		});
	}
	inspect(input, limits, publicKeys = []) {
		const normalized = normalizeSignatureParseLimits(limits);
		if (input.byteLength === 0 || input.byteLength > normalized.maxInputBytes) return Promise.reject(/* @__PURE__ */ new Error(`OpenPGP input exceeds the ${normalized.maxInputBytes}-byte boundary.`));
		if (publicKeys.length > 64) return Promise.reject(/* @__PURE__ */ new Error("At most 64 OpenPGP verification keys may be supplied."));
		const keyBytes = publicKeys.reduce((sum, key) => sum + key.byteLength, 0);
		if (!Number.isSafeInteger(keyBytes) || keyBytes > normalized.maxInputBytes) return Promise.reject(/* @__PURE__ */ new Error(`OpenPGP public keys exceed the aggregate ${normalized.maxInputBytes}-byte boundary.`));
		const transferable = input.slice(0);
		const keyTransfers = publicKeys.map((key) => key.slice(0));
		return this.request({
			type: "inspect",
			input: transferable,
			publicKeys: keyTransfers,
			limits: normalized
		}, [transferable, ...keyTransfers]);
	}
	classify(input, limits) {
		const normalized = normalizeSignatureParseLimits(limits);
		if (input.byteLength === 0 || input.byteLength > normalized.maxInputBytes) return Promise.reject(/* @__PURE__ */ new Error(`OpenPGP input exceeds the ${normalized.maxInputBytes}-byte boundary.`));
		const transferable = input.slice(0);
		return this.request({
			type: "classify",
			input: transferable,
			limits: normalized
		}, [transferable]);
	}
	verifyDetached(content, signature, publicKeys, limits) {
		const normalized = normalizeSignatureParseLimits(limits);
		if (signature.byteLength === 0 || signature.byteLength > normalized.maxInputBytes || content.byteLength > normalized.maxInputBytes) return Promise.reject(/* @__PURE__ */ new Error(`OpenPGP verification input exceeds the ${normalized.maxInputBytes}-byte boundary.`));
		if (publicKeys.length === 0 || publicKeys.length > 64) return Promise.reject(/* @__PURE__ */ new Error("OpenPGP verification requires between 1 and 64 public-key files."));
		const keyBytes = publicKeys.reduce((sum, key) => sum + key.byteLength, 0);
		if (!Number.isSafeInteger(keyBytes) || keyBytes > normalized.maxInputBytes) return Promise.reject(/* @__PURE__ */ new Error(`OpenPGP public keys exceed the aggregate ${normalized.maxInputBytes}-byte boundary.`));
		const contentTransfer = content.slice(0);
		const signatureTransfer = signature.slice(0);
		const keyTransfers = publicKeys.map((key) => key.slice(0));
		return this.request({
			type: "verify-detached",
			content: contentTransfer,
			signature: signatureTransfer,
			publicKeys: keyTransfers,
			limits: normalized
		}, [
			contentTransfer,
			signatureTransfer,
			...keyTransfers
		]);
	}
	dispose() {
		this.failWorker(new DOMException("Signature Worker was terminated.", "AbortError"));
	}
};
//#endregion
export { OpenPgpWorkerClient as n, normalizeSignatureParseLimits as r, DEFAULT_SIGNATURE_PARSE_LIMITS as t };
