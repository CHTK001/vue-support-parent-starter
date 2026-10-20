const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-Bv_XpxSc.js","assets/file-viewer-preset-all-CExGzNo-.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/file-viewer-ofd-9eNsNwQp.js","assets/file-viewer-hangul-B_bH1JEd.js","assets/file-viewer-iwork-BYSdYvWo.js","assets/file-viewer-pdf-Dpq3JwgO.js","assets/file-viewer-presentation-D4LXtXdY.js","assets/file-viewer-archive-lbBLMppA.js","assets/file-viewer-cad-CizNsiaz.js","assets/file-viewer-chm-BzdqMjVx.js","assets/file-viewer-data-BtndtGG7.js","assets/file-viewer-ebook-si5y3pmt.js","assets/file-viewer-eda-BZshD_7d.js","assets/file-viewer-email-BJJzTopi.js","assets/file-viewer-geo-Dgjkgd8E.js","assets/file-viewer-image-DGEoB-JL.js","assets/file-viewer-media-C-kGWM_A.js"])))=>i.map(i=>d[i]);
import { $ as mergeModels, Ft as useModel, Ht as watch, b as createElementBlock, it as onBeforeUnmount, k as defineComponent, mt as openBlock, v as createBlock, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { T as objectUrl, r as authHeaders } from "./filestorageApi-CcKqXwQ9.js";
import { n as extensionOf } from "./officeRenderer-C4L0wdKE.js";
import { t as FvPanelBase_default } from "./FvPanelBase-Bz3AlHGK.js";
//#region ../../pages/filesystem/src/components/fv/FvTextPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "fv-text-panel" };
var _hoisted_2 = {
	key: 0,
	class: "fv-text-panel__mask"
};
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvTextPanel.vue
var FvTextPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvTextPanel",
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
		/**
		* 文本/代码渲染选项。
		*
		* <p>语法高亮由 renderer-text 内置的 highlight.js 承担（core +
		* 按语言懒加载，扩展名自动选语言，无需额外接线）；这里只开
		* 行号与长行换行，提升代码/日志类文件的可读性。</p>
		*/
		const TEXT_VIEWER_OPTIONS = { text: {
			lineNumbers: true,
			wrapLongLines: true
		} };
		/** 数据加载中（v-model:loading 兼容） */
		const loading = useModel(__props, "loading");
		/** 交给 file-viewer 的 File */
		const fileRef = shallowRef(null);
		/** textRenderer（动态 import，与图片侧拆包） */
		const renderers = shallowRef([]);
		/** 是否已卸载 */
		let disposed = false;
		/** 防竞态令牌 */
		let loadToken = 0;
		/** 拉取文件字节（与 FvImagePanel 同一写法，TiffPreviewPanel 的 fetchBytes 口径） */
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
		* 校正交给 file-viewer 的文件名（包内条目以外层 fileName 为准、扩展名以 inner 为准）。
		* 文本侧 file-viewer 按扩展名在 code/markdown 渲染间自选，故扩展名必须真实。
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
		/** 文本类 MIME（猜不到走 text/plain，渲染选择只看扩展名） */
		function mimeOf(name) {
			switch (extensionOf(name).toLowerCase()) {
				case "md":
				case "markdown": return "text/markdown";
				case "json": return "application/json";
				case "xml":
				case "xsl":
				case "xsd":
				case "svg": return "text/xml";
				case "yaml":
				case "yml": return "text/yaml";
				case "html":
				case "htm": return "text/html";
				case "ipynb": return "application/x-ipynb+json";
				default: return "text/plain";
			}
		}
		/** 主流程：取字节→造 File→懒加载 textRenderer */
		async function load() {
			const token = ++loadToken;
			disposed = false;
			loading.value = true;
			fileRef.value = null;
			try {
				const mod = await __vitePreload(() => import("./dist-Bv_XpxSc.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]));
				if (disposed || token !== loadToken) return;
				renderers.value = [mod.textRenderer];
				const buf = await fetchBytes();
				if (disposed || token !== loadToken) return;
				const u8 = new Uint8Array(buf);
				const name = resolveViewerFileName();
				fileRef.value = new File([u8], name, { type: mimeOf(name) });
			} catch (e) {
				if (disposed || token !== loadToken) return;
				const msg = e?.message ?? "文本加载失败";
				console.warn("[FvTextPanel] 文本加载失败", e);
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
		function onRendered() {
			emit("rendered");
		}
		function onBaseError(err) {
			const msg = err?.message ?? "文本渲染失败";
			console.warn("[FvTextPanel] file-viewer 渲染失败", err);
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
				"viewer-options-extra": TEXT_VIEWER_OPTIONS,
				"preset-id": "text",
				onRendered,
				onError: onBaseError
			}, null, 8, [
				"loading",
				"file",
				"renderers"
			])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-af00e1c3"]]);
//#endregion
export { FvTextPanel_default as default };
