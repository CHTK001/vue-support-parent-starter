import { Ht as watch, _ as createBaseVNode, b as createElementBlock, it as onBeforeUnmount, k as defineComponent, mt as openBlock, rr as toDisplayString, tt as nextTick, vn as ref, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { T as objectUrl, r as authHeaders } from "./filestorageApi-CcKqXwQ9.js";
//#region ../../pages/filesystem/src/components/fv/FvJxlPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	class: "fv-jxl",
	"aria-label": "JPEG XL 图片预览"
};
var _hoisted_2 = {
	key: 0,
	class: "fv-jxl__mask"
};
var _hoisted_3 = {
	key: 1,
	class: "fv-jxl__mask"
};
var _hoisted_4 = {
	key: 2,
	class: "fv-jxl__stage"
};
var _hoisted_5 = { class: "fv-jxl__canvas-wrap" };
var _hoisted_6 = {
	key: 0,
	class: "fv-jxl__meta"
};
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvJxlPanel.vue
var FvJxlPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvJxlPanel",
	props: {
		bucket: {},
		objectKey: {},
		fileName: {},
		src: {},
		inner: {},
		size: {}
	},
	emits: [
		"rendered",
		"error",
		"fallback"
	],
	setup(__props, { emit: __emit }) {
		/**
		* JPEG XL（.jxl）真实浏览器预览面板。
		*
		* <p>Edge/Chromium 内置解码器目前不覆盖 JXL，file-viewer 的 imageRenderer
		* 只能把字节交给 <img>，结果为空。这里用 @cornerstonejs/codec-libjxl 的
		* WASM libjxl 解码器在浏览器内解出像素，再画到 canvas；这是真实解码，
		* 不依赖服务端转换，也没有 mock。</p>
		*/
		const props = __props;
		const emit = __emit;
		props.size;
		const loading = ref(true);
		const errorMsg = ref("");
		const canvasRef = ref(null);
		const meta = shallowRef(null);
		const decoderFactory = shallowRef(null);
		let disposed = false;
		let loadToken = 0;
		function numOf(v, fallback) {
			const n = typeof v === "number" ? v : Number(v);
			return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
		}
		async function ensureDecoderFactory() {
			if (decoderFactory.value) return;
			const factory = (await __vitePreload(() => import("./jpegxlwasm_decode-C2RvdF9U.js"), [])).default ?? null;
			if (!factory) throw new Error("JXL decoder module missing");
			decoderFactory.value = factory;
		}
		function locateWasm(file) {
			return file.endsWith(".wasm") ? new URL("/assets/jpegxlwasm_decode-D5WHnpK-.wasm", "" + import.meta.url).href : file;
		}
		async function fetchBytes() {
			if (props.src) {
				const res = await fetch(props.src, { headers: authHeaders() });
				if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
				return res.arrayBuffer();
			}
			const base = objectUrl(props.bucket, props.objectKey);
			const url = props.inner ? `${base}${base.includes("?") ? "&" : "?"}preview=true&inner=${encodeURIComponent(props.inner)}` : base;
			const res = await fetch(url, { headers: authHeaders() });
			if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
			return res.arrayBuffer();
		}
		function drawPixels(info, source, width, height) {
			const channels = numOf(info.componentCount, numOf(info.components, 3));
			const bits = numOf(info.bitsPerSample, numOf(info.bits, 8));
			const pixelCount = width * height;
			const view = source;
			const useBytes = channels === 3 || channels === 4 || channels === 2 || channels === 1;
			const rgba = new Uint8ClampedArray(pixelCount * 4);
			for (let i = 0; i < pixelCount; i++) {
				const srcIndex = i * channels;
				const dstIndex = i * 4;
				const read = (idx) => {
					const raw = source.BYTES_PER_ELEMENT > 1 ? view[idx] : view[idx];
					if (source.BYTES_PER_ELEMENT > 1 && bits !== 8) return Math.min(255, raw >> bits - 8 & 255);
					return Math.min(255, raw & 255);
				};
				if (!useBytes || source.length < srcIndex + channels) {
					rgba[dstIndex] = 255;
					rgba[dstIndex + 1] = 255;
					rgba[dstIndex + 2] = 255;
					rgba[dstIndex + 3] = 255;
					continue;
				}
				if (channels === 1) {
					rgba[dstIndex] = read(srcIndex);
					rgba[dstIndex + 1] = read(srcIndex);
					rgba[dstIndex + 2] = read(srcIndex);
					rgba[dstIndex + 3] = 255;
				} else if (channels === 2) {
					rgba[dstIndex] = read(srcIndex);
					rgba[dstIndex + 1] = read(srcIndex);
					rgba[dstIndex + 2] = read(srcIndex);
					rgba[dstIndex + 3] = read(srcIndex + 1);
				} else if (channels === 3) {
					rgba[dstIndex] = read(srcIndex);
					rgba[dstIndex + 1] = read(srcIndex + 1);
					rgba[dstIndex + 2] = read(srcIndex + 2);
					rgba[dstIndex + 3] = 255;
				} else {
					rgba[dstIndex] = read(srcIndex);
					rgba[dstIndex + 1] = read(srcIndex + 1);
					rgba[dstIndex + 2] = read(srcIndex + 2);
					rgba[dstIndex + 3] = read(srcIndex + 3);
				}
			}
			const canvas = canvasRef.value;
			if (!canvas) throw new Error("JXL canvas unavailable");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("JXL canvas context unavailable");
			ctx.clearRect(0, 0, width, height);
			ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
			meta.value = {
				width,
				height,
				channels,
				bits
			};
		}
		async function load() {
			const token = ++loadToken;
			disposed = false;
			loading.value = true;
			errorMsg.value = "";
			meta.value = null;
			console.warn("[JXL_LOAD]", props.fileName, props.objectKey, props.src, props.inner);
			try {
				const [buf] = await Promise.all([fetchBytes(), ensureDecoderFactory()]);
				if (disposed || token !== loadToken) return;
				if (!buf.byteLength) throw new Error("JXL 文件内容为空");
				const factory = decoderFactory.value;
				if (!factory) throw new Error("JXL decoder unavailable");
				const JpegXLDecoder = (await factory({ locateFile: locateWasm })).JpegXLDecoder;
				if (!JpegXLDecoder) throw new Error("JXL decoder init failed");
				const decoder = new JpegXLDecoder();
				const input = decoder.getEncodedBuffer?.(buf.byteLength);
				if (!input) throw new Error("JXL decoder buffer unavailable");
				input.set(new Uint8Array(buf));
				decoder.decode?.();
				const info = decoder.getFrameInfo?.() ?? {};
				const width = numOf(info.width, numOf(info.Width, numOf(info.iw, 0)));
				const height = numOf(info.height, numOf(info.Height, numOf(info.ih, 0)));
				if (!width || !height) throw new Error("JXL 解码元数据缺失");
				const pixels = decoder.getDecodedBuffer?.();
				if (!pixels) throw new Error("JXL 解码像素缺失");
				for (let i = 0; i < 30 && !canvasRef.value; i++) await nextTick();
				drawPixels(info, pixels, width, height);
				decoder.releaseBuffers?.();
				emit("rendered");
			} catch (e) {
				if (disposed || token !== loadToken) return;
				const msg = e instanceof Error && e.message ? e.message : "JXL 解码失败";
				console.error("[FvJxlPanel]", msg, e);
				errorMsg.value = msg;
				emit("error", msg);
				emit("fallback");
			} finally {
				if (!disposed && token === loadToken) loading.value = false;
			}
		}
		watch(() => [
			props.bucket,
			props.objectKey,
			props.fileName,
			props.src,
			props.inner
		], () => void load(), { immediate: true });
		onBeforeUnmount(() => {
			disposed = true;
			loadToken++;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("section", _hoisted_1, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_2, "JXL 解码中…")) : errorMsg.value ? (openBlock(), createElementBlock("div", _hoisted_3, toDisplayString(errorMsg.value), 1)) : (openBlock(), createElementBlock("div", _hoisted_4, [createBaseVNode("div", _hoisted_5, [createBaseVNode("canvas", {
				ref_key: "canvasRef",
				ref: canvasRef,
				class: "fv-jxl__canvas",
				"data-testid": "jxl-canvas"
			}, null, 512)]), meta.value ? (openBlock(), createElementBlock("div", _hoisted_6, toDisplayString(meta.value.width) + " × " + toDisplayString(meta.value.height) + " · " + toDisplayString(meta.value.channels) + " 通道 · " + toDisplayString(meta.value.bits) + " bit ", 1)) : createCommentVNode("", true)]))]);
		};
	}
}), [["__scopeId", "data-v-668861ed"]]);
//#endregion
export { FvJxlPanel_default as default };
