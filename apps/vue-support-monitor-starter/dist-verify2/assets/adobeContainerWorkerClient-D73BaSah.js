import { wu as resolveFileViewerDesignContainerWorkerUrl } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/adobeContainerWorkerClient.js
var abortError = () => new DOMException("Adobe container parsing was aborted.", "AbortError");
var asError = (value, fallback) => value instanceof Error ? value : new Error(typeof value === "string" ? value : fallback);
var AdobeContainerWorkerClient = class {
	worker;
	pending = /* @__PURE__ */ new Map();
	nextRequestId = 1;
	closed = false;
	constructor(options) {
		if (typeof Worker === "undefined") throw new Error("FLA/XFL, XD, INDD/INDT, ICML/IDMS/INX, ASE, and ACO preview requires a module Worker.");
		const workerUrl = resolveFileViewerDesignContainerWorkerUrl(options, typeof document === "undefined" ? void 0 : document.baseURI);
		this.worker = new Worker(workerUrl, {
			type: "module",
			name: "file-viewer-adobe-container"
		});
		this.worker.addEventListener("message", this.onMessage);
		this.worker.addEventListener("error", this.onError);
		this.worker.addEventListener("messageerror", this.onMessageError);
	}
	request(payload, buffer, timeoutMs, signal) {
		if (this.closed) return Promise.reject(/* @__PURE__ */ new Error("Adobe container Worker is already terminated."));
		if (signal?.aborted) return Promise.reject(abortError());
		const id = this.nextRequestId++;
		const transferable = buffer.slice(0);
		const request = {
			...payload,
			id,
			buffer: transferable
		};
		return new Promise((resolve, reject) => {
			const onAbort = () => this.terminate(abortError());
			const timer = setTimeout(() => this.terminate(/* @__PURE__ */ new Error(`Adobe container Worker exceeded ${timeoutMs}ms and was terminated.`)), timeoutMs);
			this.pending.set(id, {
				resolve,
				reject,
				timer,
				signal,
				onAbort
			});
			signal?.addEventListener("abort", onAbort, { once: true });
			if (signal?.aborted) {
				onAbort();
				return;
			}
			try {
				this.worker.postMessage(request, [transferable]);
			} catch (error) {
				this.terminate(asError(error, "Adobe container Worker request could not be cloned."));
			}
		});
	}
	terminate(reason = /* @__PURE__ */ new Error("Adobe container Worker was terminated.")) {
		if (this.closed) return;
		this.closed = true;
		this.worker.removeEventListener("message", this.onMessage);
		this.worker.removeEventListener("error", this.onError);
		this.worker.removeEventListener("messageerror", this.onMessageError);
		this.worker.terminate();
		for (const pending of this.pending.values()) {
			this.cleanup(pending);
			pending.reject(reason);
		}
		this.pending.clear();
	}
	onMessage = (event) => {
		const response = event.data;
		if (!response || !Number.isSafeInteger(response.id)) {
			this.terminate(/* @__PURE__ */ new Error("Adobe container Worker returned an invalid response."));
			return;
		}
		const pending = this.pending.get(response.id);
		if (!pending) return;
		this.pending.delete(response.id);
		this.cleanup(pending);
		if (response.ok) pending.resolve(response.result);
		else {
			const error = new Error(response.error.message);
			error.name = response.error.name;
			pending.reject(error);
		}
	};
	onError = (event) => {
		this.terminate(new Error(event.message || "Adobe container Worker failed to load."));
	};
	onMessageError = () => {
		this.terminate(/* @__PURE__ */ new Error("Adobe container Worker returned an undecodable response."));
	};
	cleanup(pending) {
		clearTimeout(pending.timer);
		if (pending.onAbort) pending.signal?.removeEventListener("abort", pending.onAbort);
	}
};
var parseOnce = async (payload, buffer, options, signal) => {
	const client = new AdobeContainerWorkerClient(options);
	try {
		return await client.request(payload, buffer, Math.max(1e3, options?.workerTimeoutMs ?? 6e4), signal);
	} finally {
		client.terminate();
	}
};
var readXdContainerInWorker = (buffer, limits, options, signal) => parseOnce({
	type: "parse",
	format: "xd",
	limits
}, buffer, options, signal);
var readInDesignContainerInWorker = (buffer, format, limits, options, signal) => parseOnce({
	type: "parse",
	format,
	limits
}, buffer, options, signal);
var parseAdobePaletteInWorker = (buffer, format, limits, options, signal) => parseOnce({
	type: "parse",
	format,
	limits
}, buffer, options, signal);
var readFlaContainerInWorker = (buffer, format, limits, options, signal) => parseOnce({
	type: "parse",
	format,
	limits
}, buffer, options, signal);
var parseInDesignExchangeInWorker = (buffer, format, limits, options, signal) => parseOnce({
	type: "parse",
	format,
	limits
}, buffer, options, signal);
//#endregion
export { readXdContainerInWorker as a, readInDesignContainerInWorker as i, parseInDesignExchangeInWorker as n, readFlaContainerInWorker as r, parseAdobePaletteInWorker as t };
