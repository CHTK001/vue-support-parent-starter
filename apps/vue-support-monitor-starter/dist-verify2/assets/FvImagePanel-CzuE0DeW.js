const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-BPmSncmG.js","assets/file-viewer-image-DGEoB-JL.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-3d-ijA7B-Qe.js"])))=>i.map(i=>d[i]);
import { $ as mergeModels, Ft as useModel, Ht as watch, b as createElementBlock, it as onBeforeUnmount, k as defineComponent, mt as openBlock, v as createBlock, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { T as objectUrl, r as authHeaders } from "./filestorageApi-CcKqXwQ9.js";
import { n as extensionOf } from "./officeRenderer-C4L0wdKE.js";
import { t as FvPanelBase_default } from "./FvPanelBase-Bz3AlHGK.js";
//#region ../../pages/filesystem/src/components/fv/FvImagePanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "fv-image-panel" };
var _hoisted_2 = {
	key: 0,
	class: "fv-image-panel__mask"
};
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvImagePanel.vue
var FvImagePanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvImagePanel",
	props: /*@__PURE__*/ mergeModels({
		bucket: {},
		objectKey: {},
		fileName: {},
		src: {},
		inner: {},
		size: {}
	}, {
		"loading": {
			type: Boolean,
			default: false
		},
		"loadingModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels([
		"fallback",
		"error",
		"rendered"
	], ["update:loading"]),
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		props.size;
		/** 数据加载中（v-model:loading 兼容） */
		const loading = useModel(__props, "loading");
		/** 交给 file-viewer 的 File（取字节→校正扩展名→构造） */
		const fileRef = shallowRef(null);
		/** imageRenderer（动态 import，与 text 侧拆包，图片页不拉文本渲染器） */
		const renderers = shallowRef([]);
		/** 是否已卸载，避免异步回调在卸载后写状态 */
		let disposed = false;
		/** 防竞态令牌：props 变化触发重拉，只采信最后一次 */
		let loadToken = 0;
		/**
		* 拉取文件字节（照抄 TiffPreviewPanel.vue 的 fetchBytes）。
		* 有 props.src 直接用；否则顶层直取 objectUrl，包内走 inner-raw 通道。
		*/
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
		/**
		* 按扩展名校正交给 file-viewer 的文件名。
		* file-viewer 按文件名扩展名选渲染器；包内条目（inner）的文件名才是真实格式，
		* 此时以外层 fileName 的目录无关、扩展名以 inner 为准。
		*/
		function resolveViewerFileName() {
			if (props.inner) {
				const innerBase = props.inner.split("/").pop() || props.inner;
				const innerExt = extensionOf(innerBase);
				if (innerExt) {
					const outerExt = extensionOf(props.fileName);
					if (outerExt && outerExt.toLowerCase() !== innerExt.toLowerCase()) {
						const dot = props.fileName.lastIndexOf(".");
						return `${dot > 0 ? props.fileName.slice(0, dot) : props.fileName}.${innerExt}`;
					}
					if (!outerExt) return `${props.fileName}.${innerExt}`;
				}
			}
			return props.fileName;
		}
		/** 按扩展名给 File 猜一个 MIME（猜不到走空串，file-viewer 按扩展名选渲染器不受影响） */
		function mimeOf(name) {
			switch (extensionOf(name).toLowerCase()) {
				case "jpg":
				case "jpeg": return "image/jpeg";
				case "png": return "image/png";
				case "gif": return "image/gif";
				case "webp": return "image/webp";
				case "bmp": return "image/bmp";
				case "svg": return "image/svg+xml";
				case "tif":
				case "tiff": return "image/tiff";
				case "heic": return "image/heic";
				case "heif": return "image/heif";
				case "avif": return "image/avif";
				case "ico": return "image/x-icon";
				default: return "";
			}
		}
		/** 主流程：取字节→造 File→懒加载 imageRenderer */
		async function load() {
			const token = ++loadToken;
			disposed = false;
			loading.value = true;
			fileRef.value = null;
			try {
				const mod = await __vitePreload(() => import("./dist-BPmSncmG.js"), __vite__mapDeps([0,1,2,3]));
				if (disposed || token !== loadToken) return;
				renderers.value = [mod.imageRenderer];
				const buf = await fetchBytes();
				if (disposed || token !== loadToken) return;
				const u8 = new Uint8Array(buf);
				const name = resolveViewerFileName();
				fileRef.value = new File([u8], name, { type: mimeOf(name) });
			} catch (e) {
				if (disposed || token !== loadToken) return;
				const msg = e?.message ?? "图片加载失败";
				console.warn("[FvImagePanel] 图片加载失败", e);
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
			fileRef.value = null;
		});
		/** FvPanelBase 渲染完成 → 转发 */
		function onRendered() {
			emit("rendered");
		}
		/** FvPanelBase 渲染失败 → fallback（模板分支回 iframe）+ error 明细 */
		function onBaseError(err) {
			const msg = err?.message ?? "图片渲染失败";
			console.warn("[FvImagePanel] file-viewer 渲染失败", err);
			emit("error", msg);
			emit("fallback");
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [loading.value && !fileRef.value ? (openBlock(), createElementBlock("div", _hoisted_2, "加载中…")) : fileRef.value && renderers.value.length ? (openBlock(), createBlock(FvPanelBase_default, {
				key: 1,
				loading: loading.value,
				"onUpdate:loading": _cache[0] || (_cache[0] = ($event) => loading.value = $event),
				file: fileRef.value,
				renderers: renderers.value,
				"preset-id": "image",
				onRendered,
				onError: onBaseError
			}, null, 8, [
				"loading",
				"file",
				"renderers"
			])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-f6198a40"]]);
//#endregion
export { FvImagePanel_default as default };
