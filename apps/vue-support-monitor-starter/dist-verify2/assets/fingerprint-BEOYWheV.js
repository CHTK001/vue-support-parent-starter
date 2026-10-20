//#region ../../packages/utils/src/modules/fingerprint.ts
/**
* 浏览器指纹 —— 用户首次访问页面生成，写入 localStorage 持久化
*
* 后端通过请求头校验指纹：
*   - x-req-fingerprint   API 防重放签名（NonceUtils）
*   - x-oauth-fingerprint OAuth 指纹验证（AuthFilter @VerifyFingerprint）
*
* 生成策略：取 UA / 语言 / 平台 / 屏幕 / 时间偏移 组合做 SHA-256，
* 与后端 fingerprintFromUserAgent 的算法语义一致（稳定 + 高熵）。
*/
/** 指纹存储 key（不带前缀，跨应用共享） */
var FINGERPRINT_STORAGE_KEY = "sys-fingerprint";
/** 从异步熵源收集信息后计算 SHA-256 */
async function generateBrowserFingerprint() {
	return await sha256Hex((await collectFingerprintParts()).join("|"));
}
/** 收集用于生成指纹的信息片段 */
async function collectFingerprintParts() {
	const parts = [];
	const nav = typeof navigator !== "undefined" ? navigator : void 0;
	const win = typeof window !== "undefined" ? window : void 0;
	parts.push(nav?.userAgent ?? "");
	parts.push(nav?.language ?? "");
	parts.push(nav?.languages ? nav.languages.join(",") : "");
	parts.push(nav?.platform ?? "");
	parts.push(String(nav?.hardwareConcurrency ?? 0));
	parts.push(String(win?.screen?.width ?? 0));
	parts.push(String(win?.screen?.height ?? 0));
	parts.push(String(win?.screen?.colorDepth ?? 0));
	parts.push(String((/* @__PURE__ */ new Date()).getTimezoneOffset()));
	parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
	try {
		const canvas = document.createElement("canvas");
		canvas.width = 320;
		canvas.height = 120;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.textBaseline = "top";
			ctx.font = "16px Arial";
			ctx.fillStyle = "#406eeb";
			ctx.fillRect(0, 0, 160, 60);
			ctx.fillStyle = "#f60";
			ctx.fillText("KOI-FINGERPRINT-9c2d", 4, 12);
			parts.push(canvas.toDataURL());
		}
	} catch {
		parts.push("no-canvas");
	}
	return parts;
}
/** SHA-256 摘要，输出 64 位十六进制（截取前 32 位与后端一致） */
async function sha256Hex(text) {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
/**
* 确保指纹存在：无则生成并写入 storage，有则直接返回
* @param storage 写入目标（localStorage 实例）
*/
async function ensureFingerprint(storage = window.localStorage) {
	const existing = storage.getItem(FINGERPRINT_STORAGE_KEY);
	if (existing) return existing;
	const fingerprint = await generateBrowserFingerprint();
	try {
		storage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
	} catch {}
	return fingerprint;
}
//#endregion
export { ensureFingerprint as n, generateBrowserFingerprint as r, FINGERPRINT_STORAGE_KEY as t };
