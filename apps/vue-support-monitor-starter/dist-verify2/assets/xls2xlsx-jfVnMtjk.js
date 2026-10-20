//#region ../../pages/filesystem/src/wasm/xls2xlsx/xls2xlsx.js
/**
* 把 BIFF(.xls) 转成 xlsx 字节。
*
* # Errors
*
* 返回可读的中文错误文案：体积超限、无法识别容器、工作表读取失败、
* 或转换器自身出错。调用方（前端面板）直接把它展示给用户即可。
* @param {Uint8Array} bytes
* @returns {Uint8Array}
*/
function xls_to_xlsx(bytes) {
	const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
	const len0 = WASM_VECTOR_LEN;
	const ret = wasm.xls_to_xlsx(ptr0, len0);
	if (ret[3]) throw takeFromExternrefTable0(ret[2]);
	var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
	wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
	return v2;
}
function __wbg_get_imports() {
	return {
		__proto__: null,
		"./xls2xlsx_bg.js": {
			__proto__: null,
			__wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
				throw new Error(getStringFromWasm0(arg0, arg1));
			},
			__wbg_now_aa4ccb83129e9e55: function() {
				return Date.now();
			},
			__wbindgen_generic_0000000000000001: function(arg0, arg1) {
				return getStringFromWasm0(arg0, arg1);
			},
			__wbindgen_init_externref_table: function() {
				const table = wasm.__wbindgen_externrefs;
				const offset = table.grow(4);
				table.set(0, void 0);
				table.set(offset + 0, void 0);
				table.set(offset + 1, null);
				table.set(offset + 2, true);
				table.set(offset + 3, false);
			}
		}
	};
}
function getArrayU8FromWasm0(ptr, len) {
	ptr = ptr >>> 0;
	return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
function getStringFromWasm0(ptr, len) {
	return decodeText(ptr >>> 0, len);
}
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
	if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
	return cachedUint8ArrayMemory0;
}
function passArray8ToWasm0(arg, malloc) {
	const ptr = malloc(arg.length * 1, 1) >>> 0;
	getUint8ArrayMemory0().set(arg, ptr / 1);
	WASM_VECTOR_LEN = arg.length;
	return ptr;
}
function takeFromExternrefTable0(idx) {
	const value = wasm.__wbindgen_externrefs.get(idx);
	wasm.__externref_table_dealloc(idx);
	return value;
}
var cachedTextDecoder = new TextDecoder("utf-8", {
	ignoreBOM: true,
	fatal: true
});
cachedTextDecoder.decode();
var MAX_SAFARI_DECODE_BYTES = 2146435072;
var numBytesDecoded = 0;
function decodeText(ptr, len) {
	numBytesDecoded += len;
	if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
		cachedTextDecoder = new TextDecoder("utf-8", {
			ignoreBOM: true,
			fatal: true
		});
		cachedTextDecoder.decode();
		numBytesDecoded = len;
	}
	return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
var WASM_VECTOR_LEN = 0;
var wasm;
function __wbg_finalize_init(instance, module) {
	wasm = instance.exports;
	cachedUint8ArrayMemory0 = null;
	wasm.__wbindgen_start();
	return wasm;
}
async function __wbg_load(module, imports) {
	if (typeof Response === "function" && module instanceof Response) {
		if (!module.ok) throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
		if (typeof WebAssembly.instantiateStreaming === "function") try {
			return await WebAssembly.instantiateStreaming(module, imports);
		} catch (e) {
			if (expectedResponseType(module.type) && module.headers.get("Content-Type") !== "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
			else throw e;
		}
		const bytes = await module.arrayBuffer();
		return await WebAssembly.instantiate(bytes, imports);
	} else {
		const instance = await WebAssembly.instantiate(module, imports);
		if (instance instanceof WebAssembly.Instance) return {
			instance,
			module
		};
		else return instance;
	}
	function expectedResponseType(type) {
		switch (type) {
			case "basic":
			case "cors":
			case "default": return true;
		}
		return false;
	}
}
async function __wbg_init(module_or_path) {
	if (wasm !== void 0) return wasm;
	if (module_or_path !== void 0) if (Object.getPrototypeOf(module_or_path) === Object.prototype) ({module_or_path} = module_or_path);
	else console.warn("using deprecated parameters for the initialization function; pass a single object instead");
	if (module_or_path === void 0) module_or_path = new URL("/assets/xls2xlsx_bg-DJwruSZv.wasm", "" + import.meta.url);
	const imports = __wbg_get_imports();
	if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) module_or_path = fetch(module_or_path);
	const { instance, module } = await __wbg_load(await module_or_path, imports);
	return __wbg_finalize_init(instance, module);
}
//#endregion
//#region ../../pages/filesystem/src/wasm/xls2xlsx/xls2xlsx_bg.wasm?url
var xls2xlsx_bg_default = "/assets/xls2xlsx_bg-DJwruSZv.wasm";
//#endregion
//#region ../../pages/filesystem/src/utils/xls2xlsx.ts
/**
* XLS → XLSX 转换器（浏览器内 WASM）加载层
*
* <p>`.xls` 是 BIFF（二进制复合文档）。<b>渲染</b>已由
* {@code @file-viewer} 原生承担（其 BIFF 解析器直接吃 `.xls` 字节，不再需要
* 转换），但<b>选区统计的解析层</b>（excelParsed + {@code xlsxSelectStats}）
* 只认 OOXML —— 所以 `.xls` 出统计前先经这里转成合法 `.xlsx` 字节：
* <b>渲染走原生、统计走转换的双轨</b>，数值口径与 `.xlsx` 完全一致
* （B3:D3 → 求和 53 / 计数 3 已验收），UI 与交互也仍是同一套
* （sheet 页签、冻结窗格、选区、主题跟随）。</p>
*
* <p>实现是 Rust/WASM（{@code crates/xls2xlsx}）：calamine 读 BIFF8，
* rust_xlsxwriter 写 xlsx，两个都是纯 Rust、无 C 依赖。</p>
*
* <p><b>保真度边界（务必如实告知用户）</b>：calamine 只读值与类型，读不出单元格
* 样式（字体/填充/边框/对齐）与 BIFF 公式。所以产出的是「只有值」的 xlsx ——
* 数据一致、UI 一致，<b>像素级样式不保</b>。这是选 calamine 的必然结果而非实现缺陷。</p>
*
* <p>WASM 资产由 {@code wasm-bindgen} 预生成并随包提交（见 crate 的 README 注释），
* 用 {@code ?url} 打成同源静态资源，避免公网 CDN。</p>
*
* @author Buffy
* @since 2026/10/07
*/
/**
* 在线预览体积上限（字节）。
*
* <p>20MB。两个原因：</p>
* <ul>
*   <li>wasm 内存线性增长，而 rust_xlsxwriter 的 {@code constant_memory} /
*       {@code low_memory} 模式依赖 tempfile，浏览器里用不了，只能 standard
*       模式整份常驻；</li>
*   <li>calamine 读 {@code Xls} 无法惰性加载（打开时一次载入全部 sheet，
*       只有 xlsx/xlsb 才有 lazy loading），大文件会一次性吃满内存。</li>
* </ul>
*
* <p>另有实测参考：calamine 读 60MB xls 原生 9.1s、wasm 33.5s（issue #268）。
* 预览场景卡在 20MB 内没有这个问题。</p>
*/
var MAX_BYTES = 20971520;
/** 字节数可读化 */
function formatSize(bytes) {
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
/** WASM 初始化 promise（并发复用，只装一次） */
var ready = null;
/**
* 确保 WASM 已就绪（幂等、可并发）。
*
* <p>wasm-bindgen 生成的 {@code init} 内部有「已初始化就短路」的保护，但并发
* 调用时每个都会各自发一次实例化请求。这里自己缓存 promise，避免同时打开两个
* 预览弹层时重复下载/实例化。</p>
*/
function ensureReady() {
	if (!ready) {
		ready = __wbg_init({ module_or_path: xls2xlsx_bg_default }).then(() => void 0);
		ready.catch(() => {
			ready = null;
		});
	}
	return ready;
}
/**
* 把 BIFF(.xls) 字节转成 xlsx 字节。
*
* @param bytes 原始 xls 字节
* @returns 合法 xlsx 字节；失败时抛出带可读中文文案的 Error
*/
async function convertXlsToXlsx(bytes) {
	if (bytes.byteLength > MAX_BYTES) throw new Error(`文件过大（${formatSize(bytes.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用 Excel 打开`);
	await ensureReady();
	await new Promise((r) => setTimeout(r, 0));
	const out = xls_to_xlsx(bytes);
	if (!(out instanceof Uint8Array)) throw new Error(typeof out === "string" ? out : "XLS 转换失败");
	return out.slice().buffer;
}
//#endregion
export { convertXlsToXlsx };
