const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/archive-ByGPdGjJ.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-3d-ijA7B-Qe.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { L as getAccessToken, Z as AxiosError, b as createHttp } from "./src-DDwlSqPX.js";
/**
* 创建票据解析器。
*
* <p>单飞（single-flight）：同一对象的并发解析共用同一次签发。文件列表里
* 同一个对象常被多处同时渲染（缩略图 + 行预览），没有单飞会在打开一个目录时
* 对同一个 key 打出多次签发请求。</p>
*
* @param deps 依赖
* @returns 票据解析器
*/
function createObjectTicketResolver(deps) {
	const now = deps.now ?? (() => Date.now());
	const maxCacheEntries = deps.maxCacheEntries ?? 500;
	const cache = /* @__PURE__ */ new Map();
	const inflight = /* @__PURE__ */ new Map();
	/**
	* 写入缓存并维持上限。
	*
	* <p>浏览大目录会为每个对象各签一张票据，无上限时缓存会随浏览过的对象数单调增长。
	* Map 保持插入序，逐出首个键即可得到近似的 FIFO —— 对短 TTL 票据而言，
	* 「逐出最旧」与「逐出最没用」差别不大。</p>
	*/
	function remember(key, ticket) {
		cache.delete(key);
		cache.set(key, ticket);
		while (cache.size > maxCacheEntries) {
			const oldest = cache.keys().next();
			if (oldest.done) break;
			cache.delete(oldest.value);
		}
	}
	/**
	* 按需拼接查询串。
	*
	* @param url  基础 URL
	* @param params 参数
	* @returns 拼接后的 URL
	*/
	function withParams(url, params) {
		const entries = Object.entries(params).filter(([, v]) => v !== void 0 && v !== "");
		if (entries.length === 0) return url;
		const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
		return `${url}${url.includes("?") ? "&" : "?"}${query}`;
	}
	return async function resolveObjectUrl(bucket, key, options = {}) {
		const params = options.params ?? {};
		const ttlSeconds = options.ttlSeconds ?? 300;
		if (!deps.hasToken()) return withParams(deps.directUrl(bucket, key), params);
		const cacheKey = `${bucket}\u0000${key}`;
		const cached = cache.get(cacheKey);
		if (cached && cached.staleAt > now()) return withParams(cached.url, params);
		const finalize = (resolved) => withParams(resolved || deps.directUrl(bucket, key), params);
		const existing = inflight.get(cacheKey);
		if (existing) return finalize(await existing);
		const minting = deps.mint(bucket, key, ttlSeconds).then((ticket) => {
			remember(cacheKey, {
				url: ticket.url,
				staleAt: now() + Math.max(0, ttlSeconds - 30) * 1e3
			});
			return ticket.url;
		}).catch((error) => {
			deps.onWarn?.("签发对象直链票据失败，回退为不带令牌的直链", error);
			return "";
		}).finally(() => {
			if (inflight.get(cacheKey) === minting) inflight.delete(cacheKey);
		});
		inflight.set(cacheKey, minting);
		return finalize(await minting);
	};
}
//#endregion
//#region ../../pages/filesystem/src/api/filestorageApi.ts
/**
* 独立文件存储服务器 API 封装
*
* 对应后端文件存储服务暴露的 REST 接口：
*   1) 路径规则 /{bucket}/{key}，bucket 为注册的存储名（如 local）
*   2) GET  /{bucket}          — 根目录对象列表（JSON）
*   3) GET  /{bucket}/{dir}    — 子目录浏览（目录 Key 自动回退列表 JSON）
*   4) PUT  /{bucket}/{key}    — 上传（body 为原始文件内容）
*   5) GET  /{bucket}/{key}    — 下载/预览（?download=true 强制附件下载）
*   6) HEAD /{bucket}/{key}    — 存在性检查（200 存在 / 404 不存在）
*   7) DELETE /{bucket}/{key}  — 删除（目录递归删除）
*   8) POST /{bucket}?action=mkdir|mkfile|rename|copy|move|unzip — 文件管理动作
*   9) GET  /{bucket}?action=zip&sources= — 打包下载 ZIP
*  10) POST /{bucket}?action=setConfig&token= — 管理员动态修改行为配置（实时生效）
*
* 该服务为独立 HTTP 服务（非网关代理），通过 createHttp 指定 baseUrl，
* 与业务接口共用统一链式请求封装。
*/
/** localStorage 中服务器地址的键名 */
var SERVER_KEY = "filestorage.server";
/** localStorage 中默认存储桶的键名 */
var BUCKET_KEY = "filestorage.bucket";
/** localStorage 中存储配额（GB）的键名 */
var QUOTA_KEY = "filestorage.quotaGb";
/**
* 默认服务器地址（app.yaml otherConfig.filestorage.server 未配置时兜底）。
*
* <p>文件存储服务器 FileStorageServerFilter 独立 HTTP 服务，默认监听 18082。
* 后端 CorsFilter 默认开启 CORS（allowedOrigins=*, allowCredentials=true），
* 前端直接发起跨域请求，无需 Vite 代理。</p>
*/
var DEFAULT_SERVER = "http://127.0.0.1:18082";
/** 默认存储桶名称（app.yaml otherConfig.filestorage.bucket 未配置时兜底） */
var DEFAULT_BUCKET = "local";
/**
* 读取 app.yaml 中 otherConfig.filestorage 配置（未配置或加载失败返回空对象）
*
* @return 文件服务器配置
*/
function appFileStorageConfig() {
	try {
		return getConfig()?.other?.filestorage ?? {};
	} catch {
		return {};
	}
}
/**
* 读取文件服务器地址
*
* <p>优先级：localStorage（页面级覆盖）＞ getConfig（app.yaml / `/v2/setting/default` 下发的
* {@code other.filestorage.server}）＞ 当前地址（window.location.origin）。</p>
*
* @return 文件服务器地址（已去除尾部斜杠）
*/
function getServerBase() {
	const stored = localStorage.getItem(SERVER_KEY);
	if (stored) return stored.replace(/\/+$/, "");
	const configured = appFileStorageConfig().server;
	if (configured) return configured.replace(/\/+$/, "");
	return typeof window !== "undefined" ? window.location.origin : DEFAULT_SERVER;
}
/**
* 读取默认存储桶
*
* @return 存储桶名称
*/
function getDefaultBucket() {
	return localStorage.getItem(BUCKET_KEY) || appFileStorageConfig().bucket || "local";
}
/**
* 读取存储配额（字节）
*
* <p>优先级：localStorage（页面级覆盖）＞ app.yaml otherConfig.filestorage.quotaGb ＞ 默认 5GB。</p>
*
* @return 配额字节数
*/
function getQuotaBytes() {
	const rawLocal = localStorage.getItem(QUOTA_KEY);
	const gb = Number(rawLocal || appFileStorageConfig().quotaGb || 5);
	return (Number.isFinite(gb) && gb > 0 ? gb : 5) * 1024 * 1024 * 1024;
}
/**
* 保存默认存储桶
*
* @param value 存储桶名称
*/
function setDefaultBucket(value) {
	localStorage.setItem(BUCKET_KEY, value);
}
/**
* 文件服务器识别登录令牌的请求头名
*
* <p>与服务端 {@code OAuthServerFilter.DEFAULT_TOKEN_NAME} 必须一致。
* 服务端的解析顺序是 自定义头 -> Authorization Bearer -> 查询参数 -> Cookie，
* 因此程序化请求（axios / XHR）走这个头即可。</p>
*/
var TOKEN_HEADER = "x-oauth-token";
/**
* 构造带令牌的请求头
*
* <p><b>只发一个头</b>：服务端（{@code OAuthServerFilter}）的解析顺序是
* 自定义头 -> Authorization Bearer -> 查询参数 -> Cookie，**任一命中即通过**，
* 因此同时发 {@code x-oauth-token} 与 {@code Authorization: Bearer} 属于
* **把同一份令牌重复传输两遍**：请求头更大、CORS 预检的
* {@code Access-Control-Request-Headers} 列表更长，且两处不一致时排查困难。
* 这里只发文件服务器**文档化的默认入口** {@code x-oauth-token}。</p>
*
* <p>服务端仍然**同时支持**两者（未做改动），换回 {@code Authorization} 只需改这一处。</p>
*
* <p>无法自定义请求头的场景（{@code img src} / iframe / 下载直链）改走
* {@link resolveObjectUrl} 的短时一次性票据；查询参数形式**不再**用于携带访问令牌
* （令牌进 URL 会留在访问日志、浏览器历史里，还会经 Referer 外泄给第三方）。</p>
*
* @returns 请求头；未登录返回 undefined
*/
function tokenHeaders() {
	const token = getAccessToken();
	if (!token) return;
	return { [TOKEN_HEADER]: token };
}
/**
* 供组件内程序化 {@code fetch} 使用的鉴权头。
*
* <p>能自定义请求头的场景（fetch / XHR）一律走这里，令牌只出现在请求头里。
* 令牌进 URL 会留在浏览器历史、网关访问日志并经 Referer 外泄。</p>
*
* @returns 请求头；未登录返回空对象（便于无条件下发）
*/
function authHeaders() {
	return tokenHeaders() ?? {};
}
/**
* 创建指向文件服务器的请求实例
*
* 每次调用按最新配置创建，保证地址修改后即时生效。
* 显式附带应用登录令牌（Authorization: Bearer &lt;accessToken&gt;），
* 供文件服务器私有桶（OAuthServerFilter）鉴权；未登录时保持匿名，公共桶不受影响。
*
* @return Http 实例
*/
function storageHttp() {
	return createHttp({
		baseUrl: getServerBase(),
		useAppConfig: false,
		timeout: 3e4,
		headers: tokenHeaders()
	});
}
/**
* 构建对象访问 URL 路径
*
* @param bucket   存储桶名
* @param key      对象 Key（空表示桶根路径）
* @return 相对路径，如 /local/docs/a.txt
*/
function objectPath(bucket, key = "") {
	const encodedKey = key ? `/${key.split("/").map(encodeURIComponent).join("/")}` : "";
	return `/${encodeURIComponent(bucket)}${encodedKey}`;
}
/**
* 构建对象完整访问 URL（用于 window.open / img / iframe 直链）
*
* <p><b>不再拼接访问令牌。</b>此前登录态下把令牌塞进 {@code ?x-oauth-token=}，
* 而令牌进 URL 会被复制到浏览器历史、网关访问日志、被 Referer 带给第三方，
* 以及用户的截图里。需要直链的场景请改用 {@link resolveObjectUrl}：
* 它先向网关换一张短时一次性票据，再返回不含令牌的票据 URL。</p>
*
* <p>保留本函数是为了让「不持有令牌」的调用方（公共桶、登出态）仍能同步拼出直链，
* 行为与修复前对公共桶完全一致。</p>
*
* @param bucket   存储桶名
* @param key      对象 Key
* @param download 是否强制附件下载
* @return 完整 URL（不含任何凭据）
*/
function objectUrl(bucket, key, download = false) {
	const params = new URLSearchParams();
	if (download) params.set("download", "true");
	const suffix = params.toString();
	return `${getServerBase().replace(/\/+$/, "")}${objectPath(bucket, key)}${suffix ? `?${suffix}` : ""}`;
}
/**
* 解析可直接放进 {@code <img src>} / iframe / {@code window.open} 的对象地址。
*
* <p>登录态下先签发一张短时一次性票据，返回的 URL 里<b>不含访问令牌</b>；
* 未登录或签发失败时退化为 {@link objectUrl} 的无凭据直链。
* 详见 {@link objectTicket.ts}。</p>
*
* @param bucket   存储桶名
* @param key      对象 Key
* @param options  附加参数 / 票据有效期
* @return 可直连的 URL
*/
function resolveObjectUrl(bucket, key, options) {
	return objectTicketResolver(bucket, key, options);
}
/**
* 票据解析器单例。
*
* <p>签发一律用 {@code type=expiry}（限时可多次访问）而不是 {@code once}（阅后即焚）：
* {@code once} 票据被浏览器读一次就销毁，而 {@code <img>} 在缩放、切换标签、
* 重新布局时都会重发请求，{@code once} 会渲染成一片破碎图。
* 相比之下「一次性链接」比这里的语义更接近「短时票据」。</p>
*/
var objectTicketResolver = createObjectTicketResolver({
	hasToken: () => Boolean(getAccessToken()),
	mint: async (bucket, key, ttlSeconds) => {
		const { url } = await createOneTimeLink(bucket, key, ttlSeconds, "expiry");
		return {
			token: "",
			url: `${getServerBase().replace(/\/+$/, "")}${url}`
		};
	},
	directUrl: (bucket, key) => objectUrl(bucket, key),
	onWarn: (message, error) => {
		console.warn(`[filestorage] ${message}`, error);
	}
});
/**
* 将异常转换为可读错误消息
*
* @param e      捕获的异常
* @param action 操作描述
* @return 错误消息
*/
function toErrorMessage(e, action) {
	const err = e;
	const status = err?.response?.status;
	if (status != null) {
		const body = serverErrorBody(err?.response?.data);
		return body ? `${action}失败：${body}` : `${action}失败（HTTP ${status}）`;
	}
	return e?.message ?? `${action}失败`;
}
/**
* 构造携带状态码的存储错误
*
* <p>供各查询通道复用：CAD / 压缩包条目等通道拿到 404 时，
* 上层面板要靠 {@code status} 区分「对象不存在（可自愈提示）」
* 与「网络 / 权限故障」，只报文案会丢掉这个判别依据。</p>
*
* @param action 出错动作（如「列表查询」）
* @param e      原始异常
* @returns 带 status 的错误
*/
function storageError(action, e) {
	const err = new Error(toErrorMessage(e, action));
	const status = e?.response?.status;
	if (typeof status === "number") err.status = status;
	return err;
}
/**
* 报错是否意味着「桶名在服务端不存在」
*
* <p>文件服务器按**注册的存储名**提供路由，桶名写错就是 404/410。
* 这是唯一一类**可以自动回落**的故障：多半是浏览器里残留了历史桶名
* （改过 app.yaml 的 filestorage.bucket 之后旧值不会自己消失，
* 且 {@link FileStorageManage} 只在列表加载**成功**时才写回桶名，
* 于是桶名错 → 列表必失败 → 永远不写回 → 永远错，形成死锁）。</p>
*
* @param e 捕获到的错误
* @returns 是「桶名不存在」返回 true
*/
function isBucketMissingError(e) {
	const status = e?.status;
	return status === 404 || status === 410;
}
/**
* app.yaml 配置的桶名（**不含** localStorage 覆盖）
*
* @return app.yaml 的桶名，未配置时返回代码默认值
*/
function getAppDefaultBucket() {
	return appFileStorageConfig().bucket || "local";
}
/**
* 当前桶名是否来自 localStorage 覆盖
*
* @returns localStorage 里存过桶名返回 true
*/
function hasBucketOverride() {
	return typeof localStorage !== "undefined" && !!localStorage.getItem(BUCKET_KEY);
}
/**
* 清掉 localStorage 里的桶名覆盖，让读取回落到 app.yaml
*/
function clearBucketOverride() {
	if (typeof localStorage !== "undefined") localStorage.removeItem(BUCKET_KEY);
}
/**
* 提取服务端错误正文
*
* <p>兼容两种形态：纯文本（文件服务器的错误基本都是），以及统一响应体
* {@code {code,msg,data}}（经网关包装时）。取不到返回空串。</p>
*
* @param data 响应体
* @return 可读错误文本；无可读内容时返回空串
*/
function serverErrorBody(data) {
	if (typeof data === "string") return data.trim().slice(0, 200);
	if (data && typeof data === "object") {
		const obj = data;
		const raw = obj.msg ?? obj.message ?? obj.error;
		if (typeof raw === "string" && raw.trim()) return raw.trim().slice(0, 200);
	}
	return "";
}
/**
* 查询对象列表（支持子目录）
*
* @param bucket 存储桶名
* @param path   子目录路径（空表示根目录）
* @return 对象元数据列表
*/
async function listObjects(bucket, path = "") {
	try {
		return (await storageHttp().get(objectPath(bucket, path)).query({ format: "json" }).then((r) => r.data)).items ?? [];
	} catch (e) {
		throw storageError("列表查询", e);
	}
}
/**
* 获取存储桶公开配置
*
* @param bucket 存储桶名
* @return 配置对象
*/
async function getBucketConfig(bucket) {
	try {
		return await storageHttp().get(objectPath(bucket)).query({ config: "true" }).then((r) => r.data);
	} catch (e) {
		throw storageError("配置获取", e);
	}
}
/**
* 获取 SPI 真实支持的能力列表（滤镜、URL参数等，供前端动态渲染配置项）
*
* @param bucket 存储桶名
* @return 能力列表
*/
async function getCapabilities(bucket) {
	try {
		return await storageHttp().get(objectPath(bucket)).query({ format: "capabilities" }).then((r) => r.data);
	} catch (e) {
		throw new Error(toErrorMessage(e, "能力列表获取"));
	}
}
/**
* 查询压缩包条目清单（WASM + 后台降级）
*
* 优先使用浏览器 WASM (archive-wasm/libarchive) 扫描压缩包结构，
* 避免一次服务器往返；扫描失败时自动降级到 {@link getArchiveEntries}。
*
* @param bucket   存储桶名
* @param key      压缩包对象 Key
* @param fileName 文件名（用于扩展名判断）
* @return 压缩包结构
*/
async function getArchiveEntriesWithWasm(bucket, key, fileName) {
	const ext = getFileNameExtension(fileName);
	if (![
		"zip",
		"rar",
		"tar",
		"gz",
		"tgz",
		"tar.gz",
		"bz2",
		"tbz2",
		"tar.bz2",
		"xz",
		"txz",
		"tar.xz",
		"7z",
		"zst",
		"tzst",
		"tar.zst",
		"lz4",
		"tar.lz4",
		"lzma",
		"tar.lzma",
		"jar",
		"war",
		"ear",
		"apk",
		"ipa"
	].includes(ext.toLowerCase())) return getArchiveEntries(bucket, key);
	try {
		const res = await storageHttp().get(objectPath(bucket, key)).query({ format: "archive" }).responseType("arraybuffer").then((r) => ({
			data: r.data,
			headers: r.headers
		}));
		if ((res.headers["content-type"] || "").includes("application/json")) {
			const jsonStr = new TextDecoder("utf-8").decode(new Uint8Array(res.data));
			const data = JSON.parse(jsonStr);
			const errText = data?.error;
			if (typeof errText === "string") throw new Error(errText);
			if (!data || typeof data !== "object" || !Array.isArray(data.entries)) throw new Error("服务端未返回压缩包条目结构（?format=archive 未生效），请更新文件服务器后重试");
			return data;
		}
		const entries = (await __vitePreload(() => import("./archive-ByGPdGjJ.js"), __vite__mapDeps([0,1,2]))).extractAll(new Uint8Array(res.data), {
			recursive: false,
			normalize: true,
			ignoreDotDir: true,
			sizeLimit: 128n * 1024n * 1024n
		});
		if (!entries || entries.length === 0) return {
			name: fileName,
			extension: ext.toLowerCase(),
			archiveSize: res.data.byteLength,
			fileCount: 0,
			dirCount: 0,
			totalSize: 0,
			compressRate: 0,
			entries: []
		};
		const archiveEntries = [];
		for (const entry of entries) {
			const path = entry.path ?? "";
			if (!path || path === ".") continue;
			const isDir = entry.type === "DIR";
			const name = path.split("/").pop() || path;
			const size = entry.size ? Number(entry.size) : 0;
			let modified = 0;
			if (entry.mtime && typeof entry.mtime === "bigint" && entry.mtime > 0n) modified = Number(entry.mtime / 1000000n);
			archiveEntries.push({
				path,
				name,
				directory: isDir,
				size: isDir ? 0 : size,
				compressedSize: -1,
				modified
			});
		}
		const allEntries = fillImplicitDirs(archiveEntries);
		const fileEntries = allEntries.filter((e) => !e.directory);
		const dirEntries = allEntries.filter((e) => e.directory);
		const totalSize = fileEntries.reduce((sum, e) => sum + e.size, 0);
		const compressRate = totalSize > 0 ? Math.round(res.data.byteLength * 100 / totalSize) : 0;
		return {
			name: fileName,
			extension: ext.toLowerCase(),
			archiveSize: res.data.byteLength,
			fileCount: fileEntries.length,
			dirCount: dirEntries.length,
			totalSize,
			compressRate,
			entries: allEntries.sort((a, b) => {
				if (a.directory !== b.directory) return a.directory ? -1 : 1;
				return a.name.localeCompare(b.name, "zh-Hans-CN");
			})
		};
	} catch (e) {
		console.warn("[archive] WASM scanning failed, falling back to backend:", e?.message ?? e);
		return getArchiveEntries(bucket, key);
	}
}
/**
* Get file extension from filename.
*/
function getFileNameExtension(fileName) {
	const parts = fileName.toLowerCase().split(".");
	return parts.length > 1 ? parts[parts.length - 1] : "";
}
/**
* Fill implicit directories (directories not explicitly listed in the archive).
*/
function fillImplicitDirs(entries) {
	const byPath = /* @__PURE__ */ new Map();
	for (const entry of entries) byPath.set(entry.path, entry);
	for (const entry of Array.from(byPath.values())) {
		if (entry.directory) continue;
		const parts = entry.path.split("/");
		for (let i = 0; i < parts.length - 1; i++) {
			const dirPath = parts.slice(0, i + 1).join("/");
			if (!byPath.has(dirPath)) {
				const dirName = parts[i];
				byPath.set(dirPath, {
					path: dirPath,
					name: dirName,
					directory: true,
					size: 0,
					compressedSize: -1,
					modified: 0
				});
			}
		}
	}
	return Array.from(byPath.values());
}
/**
* 查询压缩包条目清单
*
* 走 {@code ?format=archive} 纯数据通道，而非 {@code ?preview=true} 的
* 服务端 HTML 渲染：后者渲染在 iframe 独立文档里，读不到主应用的
* Element Plus / koi 主题变量，无法跟随系统主题与暗色模式。
*
* @param bucket 存储桶名
* @param key    压缩包对象 Key
* @return 压缩包结构
*/
async function getArchiveEntries(bucket, key) {
	try {
		const res = await storageHttp().get(objectPath(bucket, key)).query({ format: "archive" }).then((r) => r.data);
		const errText = res?.error;
		if (typeof errText === "string") throw new Error(errText);
		if (!res || typeof res !== "object" || !Array.isArray(res.entries)) throw new Error("服务端未返回压缩包条目结构（?format=archive 未生效），请更新文件服务器后重试");
		return res;
	} catch (e) {
		throw new Error(toErrorMessage(e, "压缩包条目查询"));
	}
}
/** 回收站目录（服务端约定的桶内隐藏目录，列表与目录树都不应出现） */
var RECYCLE_DIR = ".recycle";
/** 递归剔除回收站目录及其子树（目录树用） */
function stripRecycleDir(nodes) {
	return nodes.filter((n) => n.name !== RECYCLE_DIR).map((n) => n.children?.length ? {
		...n,
		children: stripRecycleDir(n.children)
	} : n);
}
/**
* 获取目录树（仅目录，KodExplorer 式左侧文件树）
*
* <p>已剔除回收站目录 {@code .recycle}：它是服务端约定的桶内隐藏目录，
* 正常对象列表同样会过滤掉它；若留在树里，用户选中后把文件传进去，
* 那些文件在列表页就再也看不到、只会出现在回收站里。</p>
*
* @param bucket 存储桶名
* @return 树节点数组
*/
async function getBucketTree(bucket) {
	try {
		return stripRecycleDir(await storageHttp().get(objectPath(bucket)).query({ tree: "true" }).then((r) => r.data) ?? []);
	} catch (e) {
		throw new Error(toErrorMessage(e, "目录树获取"));
	}
}
/** 上传默认超时（毫秒）：10 分钟 */
var UPLOAD_TIMEOUT_MS = 6e5;
/** 上传被中断时的错误标记，供调用方区分「用户暂停」与「真的失败」 */
var UPLOAD_ABORT_FLAG = "__uploadAborted";
/**
* 判断一个异常是否为「用户主动中断」
*
* @param e 捕获的异常
* @return 是中断返回 true
*/
function isUploadAborted(e) {
	return e?.[UPLOAD_ABORT_FLAG] === true;
}
/**
* 上传对象（原始内容直传，支持进度与中断）
*
* <p>刻意不走共享的 {@link Http} 客户端：那个客户端**没有** AbortSignal 支持
* （`packages/utils/src/http.ts` 里搜不到 signal / abort / CancelToken），
* 既给不出真实进度也无法中断，而上传框两样都要；而它是全站共用文件，
* 不应为单个页面的上传框去改动。这里用 {@link XMLHttpRequest} 自行实现，
* 只复用本模块已有的 URL 拼装与鉴权头。</p>
*
* @param bucket  存储桶名
* @param key     对象 Key（支持子目录）
* @param content 文件内容
* @param options 进度 / 中断 / 超时
*/
async function putObject(bucket, key, content, options = {}) {
	const { onProgress, signal, timeoutMs = UPLOAD_TIMEOUT_MS } = options;
	const token = getAccessToken();
	const url = `${getServerBase().replace(/\/+$/, "")}${objectPath(bucket, key)}`;
	await new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		let settled = false;
		const finish = (fn) => {
			if (settled) return;
			settled = true;
			signal?.removeEventListener("abort", onAbort);
			fn();
		};
		function onAbort() {
			settled = true;
			signal?.removeEventListener("abort", onAbort);
			xhr.abort();
			const err = /* @__PURE__ */ new Error("上传已暂停");
			err[UPLOAD_ABORT_FLAG] = true;
			reject(err);
		}
		xhr.open("PUT", url, true);
		xhr.timeout = timeoutMs;
		xhr.setRequestHeader("Content-Type", "application/octet-stream");
		if (token) xhr.setRequestHeader("x-oauth-token", token);
		xhr.upload.onprogress = (ev) => {
			if (!onProgress || !ev.lengthComputable || ev.total <= 0) return;
			onProgress(Math.min(100, Math.round(ev.loaded / ev.total * 100)), ev.loaded, ev.total);
		};
		xhr.onload = () => {
			finish(() => {
				if (xhr.status >= 200 && xhr.status < 300) {
					const total = content instanceof Blob ? content.size : content.byteLength;
					onProgress?.(100, total, total);
					resolve();
				} else reject(/* @__PURE__ */ new Error(`上传失败（HTTP ${xhr.status}）`));
			});
		};
		xhr.onerror = () => finish(() => reject(/* @__PURE__ */ new Error("上传失败（网络错误）")));
		xhr.ontimeout = () => finish(() => reject(/* @__PURE__ */ new Error("上传超时")));
		xhr.onabort = () => finish(() => reject(/* @__PURE__ */ new Error("上传已取消")));
		if (signal?.aborted) {
			onAbort();
			return;
		}
		signal?.addEventListener("abort", onAbort);
		xhr.send(content);
	}).catch((e) => {
		throw isUploadAborted(e) ? e : new Error(e?.message ?? "上传失败");
	});
}
/**
* 删除对象
*
* @param bucket 存储桶名
* @param key    对象 Key
*/
async function deleteObject(bucket, key) {
	try {
		await storageHttp().delete(objectPath(bucket, key));
	} catch (e) {
		throw new Error(toErrorMessage(e, "删除"));
	}
}
/**
* 存在性检查
*
* @param bucket 存储桶名
* @param key    对象 Key
* @return true 表示存在
*/
async function existObject(bucket, key) {
	try {
		return (await storageHttp().head(objectPath(bucket, key))).status === 200;
	} catch (e) {
		if (e instanceof AxiosError && e.response?.status === 404) return false;
		throw new Error(toErrorMessage(e, "存在性检查"));
	}
}
/**
* 创建访问链接
*
* @param bucket  存储桶名
* @param key     对象 Key
* @param type    链接类型：once=一次性（访问即销毁）/ expiry=限时（有效期内多次访问）
* @param expires 过期时间（秒），如 60（1分钟）、600（10分钟）、3600（1小时）、86400（1天）
* @return 链接信息
*/
async function createOneTimeLink(bucket, key, expires, type = "once") {
	try {
		const params = {
			bucket,
			key,
			type
		};
		if (expires != null && expires > 0) params.expires = String(expires);
		const url = "/ot?" + new URLSearchParams(params).toString();
		return await storageHttp().post(url).timeout(1e4).then((r) => r.data);
	} catch (e) {
		throw new Error(toErrorMessage(e, "创建访问链接"));
	}
}
/**
* 文件管理动作统一 POST 封装
*
* @param bucket 存储桶名
* @param action 动作名（mkdir/mkfile/rename/copy/move/unzip）
* @param params 查询参数
* @return 动作结果 JSON
*/
async function postAction(bucket, action, params) {
	try {
		const query = new URLSearchParams({
			action,
			...params
		}).toString();
		return await storageHttp().post(`${objectPath(bucket)}?${query}`).then((r) => r.data);
	} catch (e) {
		throw new Error(toErrorMessage(e, action));
	}
}
/**
* 管理员动态修改存储桶行为配置（setConfig，实时生效）
*
* @param bucket 存储桶名
* @param token  管理员令牌（后端每次启动随机生成，getToken() / /config 页可查）
* @param config 待修改的配置项（部分更新，缺省字段保持原值）
* @return 动作结果
*/
async function setBucketConfig(bucket, token, config) {
	try {
		const query = new URLSearchParams({
			action: "setConfig",
			token
		}).toString();
		const { privateBuckets, ...rest } = config;
		const payload = { ...rest };
		if (Array.isArray(privateBuckets)) payload.privateBuckets = privateBuckets.filter(Boolean).join(",");
		else if (typeof privateBuckets === "string") payload.privateBuckets = privateBuckets;
		return await storageHttp().post(`${objectPath(bucket)}?${query}`).headers({ "Content-Type": "application/json;charset=UTF-8" }).data(JSON.stringify(payload)).then((r) => r.data);
	} catch (e) {
		if (e?.response?.status === 403) throw new Error("配置保存失败：管理员令牌无效。该令牌由文件服务器每次启动随机生成，服务端重启后旧令牌立即失效。请从服务端启动日志「文件服务器管理员令牌」一行复制当前值，重新粘贴到「管理员令牌」后再保存。");
		throw new Error(toErrorMessage(e, "配置保存"));
	}
}
/**
* 新建目录
*
* @param bucket 存储桶名
* @param path   父目录路径（空表示根目录）
* @param name   新目录名
*/
async function createDirectory(bucket, path, name) {
	await postAction(bucket, "mkdir", {
		path,
		name
	});
}
/**
* 新建空文件
*
* @param bucket 存储桶名
* @param path   父目录路径（空表示根目录）
* @param name   新文件名
*/
async function createFile(bucket, path, name) {
	await postAction(bucket, "mkfile", {
		path,
		name
	});
}
/**
* 重命名（同目录改名，目录递归搬运）
*
* @param bucket  存储桶名
* @param path    所在目录路径
* @param name    原名称
* @param newName 新名称
*/
async function renameObject(bucket, path, name, newName) {
	await postAction(bucket, "rename", {
		path,
		name,
		newName
	});
}
/**
* 复制对象到目标目录（同名自动生成" - 副本"）
*
* @param bucket  存储桶名
* @param sources 源对象 Key 列表
* @param target  目标目录（空表示根目录）
* @return 动作结果（含生成的目标键）
*/
async function copyObjects(bucket, sources, target) {
	return postAction(bucket, "copy", {
		sources: sources.join("\n"),
		target
	});
}
/**
* 移动（剪切粘贴）对象到目标目录
*
* @param bucket  存储桶名
* @param sources 源对象 Key 列表
* @param target  目标目录（空表示根目录）
* @return 动作结果（含生成的目标键）
*/
async function moveObjects(bucket, sources, target) {
	return postAction(bucket, "move", {
		sources: sources.join("\n"),
		target
	});
}
/**
* 解压 ZIP 到目标目录
*
* @param bucket 存储桶名
* @param path   压缩包所在目录
* @param name   压缩包名称
* @param target 解压目标目录（空表示压缩包所在目录）
* @return 动作结果（含解压条目数）
*/
async function unzipObject(bucket, path, name, target = "") {
	return postAction(bucket, "unzip", {
		path,
		name,
		target
	});
}
/**
* 计算打包下载默认压缩包名（与后端规则一致：单对象去扩展名加 .zip，多个为 download.zip）
*
* @param sources 源对象 Key 列表
* @return 压缩包文件名
*/
function zipArchiveName(sources) {
	if (sources.length === 1) {
		const single = sources[0].slice(sources[0].lastIndexOf("/") + 1);
		const dot = single.lastIndexOf(".");
		return (dot > 0 ? single.slice(0, dot) : single) + ".zip";
	}
	return "download.zip";
}
/**
* 打包下载：将一个或多个对象打包为 ZIP，返回二进制内容
*
* @param bucket  存储桶名
* @param sources 源对象 Key 列表
* @return ZIP 文件 Blob
*/
async function downloadZip(bucket, sources) {
	try {
		const query = new URLSearchParams({
			action: "zip",
			sources: sources.join("\n")
		}).toString();
		return await storageHttp().get(`${objectPath(bucket)}?${query}`).responseType("blob").then((r) => r.data);
	} catch (e) {
		throw new Error(toErrorMessage(e, "打包下载"));
	}
}
//#endregion
export { setDefaultBucket as A, listObjects as C, renameObject as D, putObject as E, zipArchiveName as M, resolveObjectUrl as O, isUploadAborted as S, objectUrl as T, getDefaultBucket as _, copyObjects as a, hasBucketOverride as b, createOneTimeLink as c, existObject as d, getAppDefaultBucket as f, getCapabilities as g, getBucketTree as h, clearBucketOverride as i, unzipObject as j, setBucketConfig as k, deleteObject as l, getBucketConfig as m, DEFAULT_SERVER as n, createDirectory as o, getArchiveEntriesWithWasm as p, authHeaders as r, createFile as s, DEFAULT_BUCKET as t, downloadZip as u, getQuotaBytes as v, moveObjects as w, isBucketMissingError as x, getServerBase as y };
