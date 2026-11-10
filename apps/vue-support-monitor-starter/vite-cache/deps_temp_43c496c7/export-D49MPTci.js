//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/output/export.js
/** Lightweight export helpers that remain on the normal viewer path. */
var triggerFileViewerBlobDownload = (blob, name) => {
	const objectUrl = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = objectUrl;
	link.download = name;
	link.rel = "noopener";
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4e3);
};
var triggerFileViewerUrlDownload = (url, name) => {
	const link = document.createElement("a");
	link.href = url;
	link.download = name;
	link.rel = "noopener";
	link.target = "_blank";
	document.body.appendChild(link);
	link.click();
	link.remove();
};
var replaceFileViewerCanvasWithImages = (source, clone) => {
	const sourceCanvases = Array.from(source.querySelectorAll("canvas"));
	Array.from(clone.querySelectorAll("canvas")).forEach((canvas, index) => {
		const sourceCanvas = sourceCanvases[index];
		if (!sourceCanvas) return;
		try {
			const image = source.ownerDocument.createElement("img");
			image.src = sourceCanvas.toDataURL("image/png");
			image.alt = "rendered canvas";
			image.style.maxWidth = "100%";
			image.style.display = "block";
			image.style.margin = "0 auto";
			canvas.replaceWith(image);
		} catch {}
	});
};
var waitForFileViewerNextPaint = (targetWindow) => {
	return new Promise((resolve) => {
		const currentWindow = targetWindow || globalThis.window;
		if (!currentWindow || typeof currentWindow.requestAnimationFrame !== "function") {
			((currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.setTimeout) ? currentWindow.setTimeout.bind(currentWindow) : globalThis.setTimeout.bind(globalThis))(() => resolve(), 0);
			return;
		}
		const requestAnimationFrame = currentWindow.requestAnimationFrame.bind(currentWindow);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve());
		});
	});
};
var waitForFileViewerImages = async (root) => {
	if (!root || typeof root.querySelectorAll !== "function") return;
	const images = Array.from(root.querySelectorAll("img"));
	await Promise.all(images.map(async (image) => {
		if (image.complete) return;
		if ("decode" in image) try {
			await image.decode();
			return;
		} catch {}
		await new Promise((resolve) => {
			image.addEventListener("load", () => resolve(), { once: true });
			image.addEventListener("error", () => resolve(), { once: true });
		});
	}));
};
var bytesToDataUrl = (bytes, mimeType) => {
	const type = mimeType || "application/octet-stream";
	const nodeBuffer = globalThis.Buffer;
	if (nodeBuffer) return `data:${type};base64,${nodeBuffer.from(bytes).toString("base64")}`;
	let binary = "";
	const view = new Uint8Array(bytes);
	for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]);
	return `data:${type};base64,${btoa(binary)}`;
};
var blobToDataUrl = async (blob) => {
	if (typeof FileReader === "function") try {
		return await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result || ""));
			reader.onerror = () => reject(reader.error || /* @__PURE__ */ new Error("Failed to read blob"));
			reader.readAsDataURL(blob);
		});
	} catch {}
	return bytesToDataUrl(await blob.arrayBuffer(), blob.type || "application/octet-stream");
};
var collectBlobUrls = (html) => {
	const matches = html.match(/blob:[^\s"'<>)\\]+/g) || [];
	return Array.from(new Set(matches));
};
/** Rewrite ephemeral blob URLs into portable data URLs for export and print. */
var inlineFileViewerBlobUrlsInHtml = async (html) => {
	if (!html.includes("blob:") || typeof fetch !== "function") return html;
	const urls = collectBlobUrls(html);
	if (!urls.length) return html;
	const replacements = await Promise.all(urls.map(async (url) => {
		try {
			const response = await fetch(url);
			if (!response.ok) return null;
			const dataUrl = await blobToDataUrl(await response.blob());
			return dataUrl ? [url, dataUrl] : null;
		} catch {
			return null;
		}
	}));
	let next = html;
	for (const pair of replacements) {
		if (!pair) continue;
		const [from, to] = pair;
		next = next.split(from).join(to);
	}
	return next;
};
var waitForFileViewerPrintWindowReady = async (printWindow) => {
	const { document: printDocument } = printWindow;
	if (printDocument.readyState !== "complete") await new Promise((resolve) => {
		printWindow.addEventListener("load", () => resolve(), { once: true });
		printWindow.setTimeout(() => resolve(), 1200);
	});
	await Promise.all(Array.from(printDocument.images).map(async (image) => {
		if (image.complete) return;
		if ("decode" in image) try {
			await image.decode();
			return;
		} catch {}
		await new Promise((resolve) => {
			image.addEventListener("load", () => resolve(), { once: true });
			image.addEventListener("error", () => resolve(), { once: true });
			printWindow.setTimeout(() => resolve(), 1500);
		});
	}));
	await new Promise((resolve) => {
		let settled = false;
		let timeoutId;
		const finish = () => {
			if (settled) return;
			settled = true;
			if (timeoutId !== void 0) printWindow.clearTimeout(timeoutId);
			resolve();
		};
		timeoutId = printWindow.setTimeout(finish, 250);
		try {
			printWindow.requestAnimationFrame(() => {
				printWindow.requestAnimationFrame(finish);
			});
		} catch {
			finish();
		}
	});
};
var resolveFileViewerPrintStyle = async (adapter, options) => {
	if (options.mode !== "print" || !(adapter === null || adapter === void 0 ? void 0 : adapter.printStyle)) return "";
	if (typeof adapter.printStyle === "function") return await adapter.printStyle(options);
	return adapter.printStyle;
};
var prepareFileViewerRenderedContentForSnapshot = async (source, adapter) => {
	var _a;
	await ((_a = adapter === null || adapter === void 0 ? void 0 : adapter.beforeSnapshot) === null || _a === void 0 ? void 0 : _a.call(adapter));
	await waitForFileViewerNextPaint(source.ownerDocument.defaultView || void 0);
	await waitForFileViewerImages(source);
};
//#endregion
export { triggerFileViewerBlobDownload as a, waitForFileViewerNextPaint as c, resolveFileViewerPrintStyle as i, waitForFileViewerPrintWindowReady as l, prepareFileViewerRenderedContentForSnapshot as n, triggerFileViewerUrlDownload as o, replaceFileViewerCanvasWithImages as r, waitForFileViewerImages as s, inlineFileViewerBlobUrlsInHtml as t };
