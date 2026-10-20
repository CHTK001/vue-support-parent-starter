import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, tt as nextTick, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Ft as refresh_right_default, Nt as refresh_default, U as download_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as resolveObjectUrl } from "./filestorageApi-CcKqXwQ9.js";
//#region ../../pages/filesystem/src/utils/tga.ts
/**
* TGA（Truevision Targa）图像解码器 —— 纯 TypeScript，零依赖。
*
* <p>浏览器至今不原生解码 TGA（{@code <img>} 只认 PNG/JPEG/WebP/GIF/SVG 等），
* TGA 落到原生图片通道只会得到一张「图片加载失败」。这里在浏览器里直接解像素，
* 输出 {@link ImageData}，由面板画到 canvas 上，不经后端、不新增依赖。</p>
*
* <p><b>覆盖 TGA 2.0 的常见子集</b>（覆盖绝大多数实际文件）：</p>
* <ul>
*   <li>图像类型：1（调色板）、2（未压缩真彩）、3（未压缩灰度）、
*       9（RLE 调色板）、10（RLE 真彩）、11（RLE 灰度）；</li>
*   <li>像素位深：16 / 24 / 32（真彩），8（调色板 / 灰度）；</li>
*   <li>调色板表项位深：15 / 16 / 24 / 32；</li>
*   <li>来源标志：bit5 顶/底来源（底来源竖直翻转）、bit4 右/左来源（水平翻转）；</li>
*   <li>16 位真彩按 5551（X1R5G5B5）展开为 RGBA。</li>
* </ul>
*
* <p>头 18 字节与像素数据均为小端（TGA 规范固定小端，与机器字节序无关）。</p>
*
* @author CH
* @since 2026/10/08
*/
/** TGA 文件头固定长度（字节） */
var HEADER_SIZE = 18;
/** 本解码器支持的图像类型：1/2/3 未压缩，9/10/11 为对应类型的 RLE */
var SUPPORTED_TYPES = /* @__PURE__ */ new Set([
	1,
	2,
	3,
	9,
	10,
	11
]);
/**
* 抛出统一前缀的解码错误。
*
* <p>文案口径与其它预览面板一致：{@code 不是有效的 TGA 图像（具体原因）}。</p>
*
* @param detail 具体原因
*/
function invalid(detail) {
	throw new Error(`不是有效的 TGA 图像（${detail}）`);
}
/**
* 5 位分量扩到 8 位（高位复制到低位，保证 0x1F → 255）。
*
* @param v 5 位分量（0~31）
* @returns 8 位分量（0~255）
*/
function expand5(v) {
	return v << 3 | v >> 2;
}
/**
* 解码一段 TGA 字节。
*
* <p>同步执行：TGA 通常不大，配合面板的像素上限即可；解出的
* {@link ImageData} 由面板负责在 canvas 上绘制与旋转。</p>
*
* @param buffer TGA 文件字节（ArrayBuffer 或已就位的视图）
* @returns 解码结果（RGBA 像素 + 元信息）
* @throws Error 头/像素数据非法时抛出中文错误（前缀「不是有效的 TGA 图像」）
*/
function decodeTga(buffer) {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	if (bytes.length < HEADER_SIZE) invalid("文件头不完整");
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const idLength = bytes[0];
	const colormapType = bytes[1];
	const imageType = bytes[2];
	const colormapOrigin = view.getUint16(3, true);
	const colormapLength = view.getUint16(5, true);
	const colormapDepth = bytes[7];
	const width = view.getUint16(12, true);
	const height = view.getUint16(14, true);
	const pixelDepth = bytes[16];
	const descriptor = bytes[17];
	if (!SUPPORTED_TYPES.has(imageType)) invalid(`不支持的图像类型 ${imageType}`);
	if (width === 0 || height === 0) invalid("图像宽或高为 0");
	const compressed = imageType >= 9;
	const baseType = compressed ? imageType - 8 : imageType;
	if (baseType === 2 && pixelDepth !== 16 && pixelDepth !== 24 && pixelDepth !== 32) invalid(`真彩图不支持 ${pixelDepth} 位色深`);
	if (baseType === 1 && pixelDepth !== 8) invalid(`调色板图不支持 ${pixelDepth} 位色深`);
	if (baseType === 3 && pixelDepth !== 8) invalid(`灰度图不支持 ${pixelDepth} 位色深`);
	const hasColormap = baseType === 1;
	if (hasColormap && colormapType !== 1) invalid("使用调色板但文件未标注调色板数据");
	if (hasColormap && colormapLength === 0) invalid("调色板长度为 0");
	const alphaBits = descriptor & 15;
	const bytesPerPixel = Math.ceil(pixelDepth / 8);
	const colormapEntrySize = hasColormap || colormapType === 1 ? Math.ceil(colormapDepth / 8) : 0;
	const colormapStart = HEADER_SIZE + idLength;
	const pixelStart = colormapStart + (colormapType === 1 ? colormapLength * colormapEntrySize : 0);
	if (pixelStart > bytes.length) invalid("文件头声明的数据长度超出文件大小");
	let palette = null;
	if (hasColormap) {
		palette = new Uint8ClampedArray((colormapOrigin + colormapLength) * 4);
		if (colormapStart + colormapLength * colormapEntrySize > bytes.length) invalid("调色板数据不完整");
		for (let i = 0; i < colormapLength; i++) {
			const p = colormapStart + i * colormapEntrySize;
			const o = (colormapOrigin + i) * 4;
			if (colormapDepth === 24 || colormapDepth === 32) {
				palette[o] = bytes[p + 2];
				palette[o + 1] = bytes[p + 1];
				palette[o + 2] = bytes[p];
				palette[o + 3] = colormapDepth === 32 && alphaBits > 0 ? bytes[p + 3] : 255;
			} else if (colormapDepth === 15 || colormapDepth === 16) {
				const v = bytes[p] | bytes[p + 1] << 8;
				palette[o] = expand5(v >> 10 & 31);
				palette[o + 1] = expand5(v >> 5 & 31);
				palette[o + 2] = expand5(v & 31);
				palette[o + 3] = colormapDepth === 16 && alphaBits > 0 && (v & 32768) === 0 ? 0 : 255;
			} else invalid(`不支持的调色板位深 ${colormapDepth}`);
		}
	}
	const totalPixels = width * height;
	const raw = new Uint8Array(totalPixels * bytesPerPixel);
	if (!compressed) {
		if (pixelStart + raw.length > bytes.length) invalid("像素数据不完整");
		raw.set(bytes.subarray(pixelStart, pixelStart + raw.length));
	} else {
		let src = pixelStart;
		let dst = 0;
		while (dst < raw.length) {
			if (src >= bytes.length) invalid("像素数据不完整（RLE 流提前结束）");
			const packet = bytes[src++];
			const count = (packet & 127) + 1;
			if ((packet & 128) !== 0) {
				if (src + bytesPerPixel > bytes.length) invalid("像素数据不完整（RLE 游程越界）");
				for (let i = 0; i < count && dst < raw.length; i++) {
					for (let b = 0; b < bytesPerPixel; b++) raw[dst + b] = bytes[src + b];
					dst += bytesPerPixel;
				}
				src += bytesPerPixel;
			} else {
				const need = count * bytesPerPixel;
				if (src + need > bytes.length) invalid("像素数据不完整（RLE 原始块越界）");
				const copy = Math.min(need, raw.length - dst);
				raw.set(bytes.subarray(src, src + copy), dst);
				dst += need;
				src += need;
			}
		}
	}
	const out = new Uint8ClampedArray(totalPixels * 4);
	const topOrigin = (descriptor & 32) !== 0;
	const rightOrigin = (descriptor & 16) !== 0;
	const paletteEntries = palette ? palette.length / 4 : 0;
	for (let y = 0; y < height; y++) {
		const rowBase = (topOrigin ? y : height - 1 - y) * width * bytesPerPixel;
		const outRow = y * width;
		for (let x = 0; x < width; x++) {
			const p = rowBase + (rightOrigin ? width - 1 - x : x) * bytesPerPixel;
			const o = (outRow + x) * 4;
			if (baseType === 1) {
				const idx = raw[p];
				if (idx >= paletteEntries) {
					out[o + 3] = 255;
					continue;
				}
				const po = idx * 4;
				out[o] = palette[po];
				out[o + 1] = palette[po + 1];
				out[o + 2] = palette[po + 2];
				out[o + 3] = palette[po + 3];
			} else if (baseType === 3) {
				const g = raw[p];
				out[o] = g;
				out[o + 1] = g;
				out[o + 2] = g;
				out[o + 3] = 255;
			} else if (pixelDepth === 24) {
				out[o] = raw[p + 2];
				out[o + 1] = raw[p + 1];
				out[o + 2] = raw[p];
				out[o + 3] = 255;
			} else if (pixelDepth === 32) {
				out[o] = raw[p + 2];
				out[o + 1] = raw[p + 1];
				out[o + 2] = raw[p];
				out[o + 3] = alphaBits > 0 ? raw[p + 3] : 255;
			} else {
				const v = raw[p] | raw[p + 1] << 8;
				out[o] = expand5(v >> 10 & 31);
				out[o + 1] = expand5(v >> 5 & 31);
				out[o + 2] = expand5(v & 31);
				out[o + 3] = alphaBits > 0 && (v & 32768) === 0 ? 0 : 255;
			}
		}
	}
	const info = {
		width,
		height,
		imageType,
		compressed,
		pixelDepth,
		colorModel: baseType === 1 ? "colormap" : baseType === 2 ? "truecolor" : "grayscale",
		hasColormap,
		colormapDepth: hasColormap ? colormapDepth : 0,
		topOrigin
	};
	return {
		imageData: new ImageData(out, width, height),
		info
	};
}
//#endregion
//#region ../../pages/filesystem/src/components/PreviewTgaPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	class: "tga",
	"aria-label": "TGA 图像预览"
};
var _hoisted_2 = { class: "tga__stats" };
var _hoisted_3 = { class: "tga__stat" };
var _hoisted_4 = { class: "tga__stat-value" };
var _hoisted_5 = { class: "tga__stat" };
var _hoisted_6 = { class: "tga__stat-value" };
var _hoisted_7 = { class: "tga__stat" };
var _hoisted_8 = { class: "tga__stat-value" };
var _hoisted_9 = { class: "tga__stat" };
var _hoisted_10 = { class: "tga__stat-value" };
var _hoisted_11 = { class: "tga__stat" };
var _hoisted_12 = { class: "tga__stat-value tga__stat-value--accent" };
var _hoisted_13 = { class: "tga__toolbar" };
var _hoisted_14 = { class: "tga__body" };
var _hoisted_15 = { class: "tga__viewport" };
var _hoisted_16 = {
	key: 0,
	class: "tga__overlay"
};
var _hoisted_17 = { class: "tga__overlay-text" };
var _hoisted_18 = {
	key: 1,
	class: "tga__overlay tga__overlay--error"
};
var _hoisted_19 = { class: "tga__error-text" };
var _hoisted_20 = { class: "tga__error-actions" };
var _hoisted_21 = { class: "tga__footer" };
var _hoisted_22 = ["title"];
var MAX_BYTES = 268435456;
/** 单图像素数上限：坏文件常声明巨大尺寸，解开就是几百 MB 内存 */
var MAX_PIXELS = 6e7;
//#endregion
//#region ../../pages/filesystem/src/components/PreviewTgaPanel.vue
var PreviewTgaPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "PreviewTgaPanel",
	props: {
		bucket: {},
		objectKey: {},
		fileName: {},
		inner: {},
		size: {}
	},
	setup(__props) {
		/**
		* TGA（Truevision Targa）图像预览面板（前端直渲，内置纯 TS 解码器）。
		*
		* <p><b>为什么不用 iframe</b>：浏览器不原生解码 TGA，若交给 iframe 服务端通道，
		* 要么依赖后端额外的转换能力，要么直接返回原字节让浏览器显示成乱码。这里用
		* {@link decodeTga} 在浏览器里解像素、画到 canvas，零新增依赖、离线可用，
		* 也不必改动任何后端。</p>
		*
		* <p><b>取值通道</b>：与 {@link PreviewGeoPanel} 一致 —— 顶层对象由
		* {@code resolveObjectUrl} 签一张短时票据直连；压缩包内条目带
		* {@code ?preview=true&inner=路径} 走条目提取通道（只传 inner 会拿到整个压缩包）。</p>
		*
		* <p><b>方向与旋转</b>：TGA 历史上默认底来源（bottom-left），解码时按来源标志
		* 统一纠正为正立；面板再提供顺时针 90° 旋转，方便查看竖拍/倒置的截图。</p>
		*
		* @author CH
		* @since 2026/10/08
		*/
		const props = __props;
		/** 在线预览体积上限：TGA 一般不大，超过此值多半是专业产物，引导下载 */
		const loading = ref(true);
		/** 加载阶段文案 */
		const phase = ref("读取文件…");
		/** 错误信息（空串表示无错） */
		const errorMsg = ref("");
		/** 已取回的字节数 */
		const byteSize = ref(0);
		/** 图像尺寸 */
		const imgSize = ref({
			w: 0,
			h: 0
		});
		/** 解码元信息 */
		const info = ref(null);
		/** 是否按容器缩放显示（关掉则 1:1，可滚动查看像素） */
		const fit = ref(true);
		/** 顺时针旋转的 90° 次数（0~3） */
		const rotation = ref(0);
		/** 画布 */
		const canvasRef = ref();
		/** 解码出的像素（原图，旋转时反复重绘，不销毁） */
		let decodedImage = null;
		/** 离屏画布（承载原图，供带变换的 drawImage 取用） */
		let offscreen = null;
		/** 是否已卸载，避免异步回调在卸载后写状态 */
		let disposed = false;
		/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
		const effectiveName = computed(() => {
			const p = props.inner;
			if (!p) return props.fileName;
			const slash = p.lastIndexOf("/");
			return slash >= 0 ? p.slice(slash + 1) : p;
		});
		/** 字节数可读化 */
		function formatSize(bytes) {
			if (!bytes || bytes < 0) return "-";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			if (bytes < 1073741824) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
			return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
		}
		/**
		* 拉取文件字节。
		*
		* <p>顶层对象签票据直连；包内条目带 {@code preview=true&inner=} 走条目提取通道。</p>
		*
		* @returns 文件字节
		*/
		async function fetchBytes() {
			const params = {};
			if (props.inner) {
				params.preview = "true";
				params.inner = props.inner;
			}
			const url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
			if (!url) throw new Error("获取文件地址失败");
			const res = await fetch(url);
			if (!res.ok) throw new Error(`读取文件失败（HTTP ${res.status}）`);
			return res.arrayBuffer();
		}
		/**
		* 按当前旋转角把解码结果重绘到画布。
		*
		* <p>putImageData 不吃 canvas 变换，所以先把原图铺到离屏画布，再用带
		* translate/rotate 的 drawImage 画到可见画布：90° 的整数倍为精确重排，
		* 不会插值糊边。</p>
		*/
		function redraw() {
			const img = decodedImage;
			const canvas = canvasRef.value;
			if (!img || !canvas) return;
			if (!offscreen) offscreen = document.createElement("canvas");
			offscreen.width = img.width;
			offscreen.height = img.height;
			const octx = offscreen.getContext("2d");
			if (!octx) {
				errorMsg.value = "无法创建画布上下文";
				return;
			}
			octx.putImageData(img, 0, 0);
			const rot = (rotation.value % 4 + 4) % 4;
			const swap = rot % 2 === 1;
			canvas.width = swap ? img.height : img.width;
			canvas.height = swap ? img.width : img.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.save();
			switch (rot) {
				case 1:
					ctx.translate(canvas.width, 0);
					ctx.rotate(Math.PI / 2);
					break;
				case 2:
					ctx.translate(canvas.width, canvas.height);
					ctx.rotate(Math.PI);
					break;
				case 3:
					ctx.translate(0, canvas.height);
					ctx.rotate(-Math.PI / 2);
			}
			ctx.drawImage(offscreen, 0, 0);
			ctx.restore();
		}
		/** 顺时针旋转 90°（canvas 变换，不重新解码） */
		function rotateCW() {
			rotation.value = (rotation.value + 1) % 4;
			redraw();
		}
		/** 主流程：签票据 → 取字节 → 预检尺寸 → 解码 → 绘制 */
		async function load() {
			disposed = false;
			loading.value = true;
			errorMsg.value = "";
			phase.value = "读取文件…";
			byteSize.value = 0;
			imgSize.value = {
				w: 0,
				h: 0
			};
			info.value = null;
			decodedImage = null;
			rotation.value = 0;
			await nextTick();
			try {
				const buf = await fetchBytes();
				if (disposed) return;
				byteSize.value = buf.byteLength;
				if (buf.byteLength > MAX_BYTES) throw new Error(`文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用专业软件打开`);
				if (buf.byteLength >= 18) {
					const head = new DataView(buf);
					const w = head.getUint16(12, true);
					const h = head.getUint16(14, true);
					if (w > 0 && h > 0 && w * h > MAX_PIXELS) throw new Error(`图像尺寸 ${w}×${h} 过大（${(w * h / 1e6).toFixed(0)} 兆像素），超过在线预览上限 ${(MAX_PIXELS / 1e6).toFixed(0)} 兆像素，请下载后用专业软件打开`);
				}
				phase.value = "解码 TGA…";
				await new Promise((r) => setTimeout(r, 30));
				if (disposed) return;
				const result = decodeTga(buf);
				if (disposed) return;
				decodedImage = result.imageData;
				info.value = result.info;
				imgSize.value = {
					w: result.info.width,
					h: result.info.height
				};
				redraw();
			} catch (e) {
				if (disposed) return;
				errorMsg.value = e?.message ?? "TGA 解码失败";
			} finally {
				if (!disposed) loading.value = false;
			}
		}
		/** 下载本体（包内条目下载压缩包本体，与其它前端直渲面板一致的口径） */
		async function downloadSelf() {
			const url = await resolveObjectUrl(props.bucket, props.objectKey, { params: { download: "true" } });
			window.open(url, "_blank");
		}
		/** 统计条「类型」：未压缩 / RLE */
		const typeText = computed(() => {
			const i = info.value;
			if (!i) return "—";
			return i.compressed ? "RLE 压缩" : "未压缩";
		});
		/** 统计条「色彩」：调色板 / 真彩 / 灰度 */
		const colorText = computed(() => {
			const i = info.value;
			if (!i) return "—";
			if (i.colorModel === "colormap") return `调色板（表 ${i.colormapDepth} 位）`;
			return i.colorModel === "truecolor" ? "真彩色" : "灰度";
		});
		/** 统计条「位深」 */
		const depthText = computed(() => info.value ? `${info.value.pixelDepth} 位` : "—");
		/**
		* 统计条「大小」：优先用实际取回的字节数。
		*
		* <p>与 GeoJSON 面板按 {@code size} 参数显示的口径不同 —— 这里的字节是实际取回的
		* 入口字节，包内条目也拿得到真实条目体积，故不因 inner 而显示 -。</p>
		*/
		const sizeText = computed(() => formatSize(byteSize.value || props.size));
		/** 页脚右侧状态文案 */
		const statusText = computed(() => {
			if (errorMsg.value) return "无法渲染";
			const i = info.value;
			return i ? `${i.width}×${i.height}` : "";
		});
		onMounted(() => void load());
		watch(() => [
			props.bucket,
			props.objectKey,
			props.inner
		], () => void load());
		onBeforeUnmount(() => {
			disposed = true;
			decodedImage = null;
			offscreen = null;
		});
		return (_ctx, _cache) => {
			const _component_el_button = resolveComponent("el-button");
			return openBlock(), createElementBlock("section", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [
					createBaseVNode("div", _hoisted_3, [_cache[1] || (_cache[1] = createBaseVNode("span", { class: "tga__stat-label" }, "尺寸", -1)), createBaseVNode("b", _hoisted_4, toDisplayString(imgSize.value.w ? `${imgSize.value.w}×${imgSize.value.h}` : "—"), 1)]),
					createBaseVNode("div", _hoisted_5, [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "tga__stat-label" }, "类型", -1)), createBaseVNode("b", _hoisted_6, toDisplayString(typeText.value), 1)]),
					createBaseVNode("div", _hoisted_7, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "tga__stat-label" }, "位深", -1)), createBaseVNode("b", _hoisted_8, toDisplayString(depthText.value), 1)]),
					createBaseVNode("div", _hoisted_9, [_cache[4] || (_cache[4] = createBaseVNode("span", { class: "tga__stat-label" }, "色彩", -1)), createBaseVNode("b", _hoisted_10, toDisplayString(colorText.value), 1)]),
					createBaseVNode("div", _hoisted_11, [_cache[5] || (_cache[5] = createBaseVNode("span", { class: "tga__stat-label" }, "大小", -1)), createBaseVNode("b", _hoisted_12, toDisplayString(sizeText.value), 1)])
				]),
				createBaseVNode("div", _hoisted_13, [
					_cache[8] || (_cache[8] = createBaseVNode("span", { class: "tga__hint" }, "TGA · 内置解码器", -1)),
					_cache[9] || (_cache[9] = createBaseVNode("div", { class: "tga__spacer" }, null, -1)),
					createVNode(_component_el_button, {
						size: "small",
						onClick: _cache[0] || (_cache[0] = ($event) => fit.value = !fit.value)
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(fit.value ? "1:1" : "适应"), 1)]),
						_: 1
					}),
					createVNode(_component_el_button, {
						icon: unref(refresh_right_default),
						size: "small",
						disabled: !info.value,
						title: "顺时针旋转 90°",
						"aria-label": "顺时针旋转 90°",
						onClick: rotateCW
					}, {
						default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("旋转", -1)])]),
						_: 1
					}, 8, ["icon", "disabled"]),
					createVNode(_component_el_button, {
						icon: unref(refresh_default),
						loading: loading.value,
						title: "重新加载",
						"aria-label": "刷新",
						onClick: load
					}, null, 8, ["icon", "loading"]),
					createVNode(_component_el_button, {
						icon: unref(download_default),
						title: "下载原文件",
						onClick: downloadSelf
					}, {
						default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("下载", -1)])]),
						_: 1
					}, 8, ["icon"])
				]),
				createBaseVNode("div", _hoisted_14, [createBaseVNode("div", _hoisted_15, [createBaseVNode("canvas", {
					ref_key: "canvasRef",
					ref: canvasRef,
					class: normalizeClass(["tga__canvas", {
						"is-fit": fit.value,
						"is-loading": loading.value || !!errorMsg.value
					}])
				}, null, 2)]), loading.value ? (openBlock(), createElementBlock("div", _hoisted_16, [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "tga__spinner" }, null, -1)), createBaseVNode("div", _hoisted_17, toDisplayString(phase.value), 1)])) : errorMsg.value ? (openBlock(), createElementBlock("div", _hoisted_18, [
					_cache[13] || (_cache[13] = createBaseVNode("div", { class: "tga__error-icon" }, "TGA", -1)),
					_cache[14] || (_cache[14] = createBaseVNode("h4", { class: "tga__error-title" }, "无法预览该 TGA 文件", -1)),
					createBaseVNode("p", _hoisted_19, toDisplayString(errorMsg.value), 1),
					createBaseVNode("div", _hoisted_20, [createVNode(_component_el_button, {
						type: "primary",
						icon: unref(refresh_default),
						onClick: load
					}, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("重试", -1)])]),
						_: 1
					}, 8, ["icon"]), createVNode(_component_el_button, {
						icon: unref(download_default),
						onClick: downloadSelf
					}, {
						default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("下载文件", -1)])]),
						_: 1
					}, 8, ["icon"])])
				])) : createCommentVNode("", true)]),
				createBaseVNode("footer", _hoisted_21, [createBaseVNode("span", { title: __props.inner ? `${__props.fileName} › ${effectiveName.value}` : effectiveName.value }, toDisplayString(__props.inner ? `${__props.fileName} › ${effectiveName.value}` : effectiveName.value), 9, _hoisted_22), createBaseVNode("span", { class: normalizeClass({ "is-error": !!errorMsg.value }) }, toDisplayString(statusText.value), 3)])
			]);
		};
	}
}), [["__scopeId", "data-v-324294a5"]]);
//#endregion
export { PreviewTgaPanel_default as default };
