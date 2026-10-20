const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-DriUhRvK.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-preset-all-CExGzNo-.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/file-viewer-ofd-9eNsNwQp.js","assets/file-viewer-hangul-B_bH1JEd.js","assets/file-viewer-iwork-BYSdYvWo.js","assets/file-viewer-pdf-Dpq3JwgO.js","assets/file-viewer-presentation-D4LXtXdY.js","assets/file-viewer-archive-lbBLMppA.js","assets/file-viewer-cad-CizNsiaz.js","assets/file-viewer-chm-BzdqMjVx.js","assets/file-viewer-data-BtndtGG7.js","assets/file-viewer-ebook-si5y3pmt.js","assets/file-viewer-eda-BZshD_7d.js","assets/file-viewer-email-BJJzTopi.js","assets/file-viewer-geo-Dgjkgd8E.js","assets/file-viewer-image-DGEoB-JL.js","assets/file-viewer-media-C-kGWM_A.js","assets/objectSpread2-BfUs1NtZ.js","assets/fit-BpY0hdxy.js","assets/export-CuBEQtsZ.js","assets/messages-BeZPIWdo.js","assets/file-viewer3-DkmmdxGz.css","assets/dist-tdpScEE_.js","assets/dist-CXqrV6TH.js","assets/dist-DOlzqSH9.js"])))=>i.map(i=>d[i]);
import { $ as mergeModels, Ft as useModel, Ht as watch, b as createElementBlock, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, v as createBlock, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { T as objectUrl, r as authHeaders } from "./filestorageApi-CcKqXwQ9.js";
import { n as extensionOf } from "./officeRenderer-C4L0wdKE.js";
//#region ../../pages/filesystem/src/components/fv/FvDocPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "fv-doc-panel" };
var _hoisted_2 = {
	key: 0,
	class: "fv-doc-panel__mask"
};
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvDocPanel.vue
var FvDocPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvDocPanel",
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
		/** 文档分支：xmind=脑图、epub/fb2/umd=电子书、eml/msg/mbox=邮件 */
		const loading = useModel(__props, "loading");
		/** 交给 file-viewer 的 File（取字节→校正扩展名→构造） */
		const fileRef = shallowRef(null);
		/** 按扩展名选中的单个渲染器（动态 import，分支间拆包） */
		const renderers = shallowRef([]);
		/** file-viewer 组件（懒加载，用 shallowRef：组件对象无需深响应） */
		const viewerComp = shallowRef(null);
		/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
		let fileViewerReady = false;
		/** 是否已卸载，避免异步回调在卸载后写状态 */
		let disposed = false;
		/** 防竞态令牌：props 变化触发重拉，只采信最后一次 */
		let loadToken = 0;
		/**
		* 懒加载 file-viewer 全套依赖（照抄 PreviewOfficePanel.vue 第 106-166 行模式）。
		*
		* @returns 全部就绪返回 true；任一 import 失败返回 false（调用方改走兜底）
		*/
		async function ensureFileViewerLoaded() {
			if (fileViewerReady) return true;
			try {
				const [vueMod, cssMod] = await Promise.all([__vitePreload(() => import("./dist-DriUhRvK.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26])), __vitePreload(() => Promise.resolve({}), __vite__mapDeps([27]))]);
				viewerComp.value = vueMod.FileViewer ?? vueMod.default ?? null;
				fileViewerReady = !!viewerComp.value;
				return fileViewerReady;
			} catch (e) {
				console.warn("[FvDocPanel] file-viewer 依赖加载失败", e);
				return false;
			}
		}
		/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
		const viewerOptions = computed(() => ({
			preset: {
				id: "doc",
				label: "doc",
				renderers: renderers.value
			},
			rendererMode: "replace",
			theme: "light",
			toolbar: { position: "bottom-right" }
		}));
		/**
		* 按扩展名校正交给 file-viewer 的文件名。
		* file-viewer 按文件名扩展名选渲染器；包内条目（inner）的文件名才是真实格式，
		* 此时以外层 fileName 为名、扩展名以 inner 为准。
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
		/**
		* 按生效文件名扩展名判定文档分支。
		*
		* @param name 生效文件名
		* @returns 文档分支；未知扩展名返回 null（调用方 fallback）
		*/
		function kindOf(name) {
			switch (extensionOf(name).toLowerCase()) {
				case "xmind": return "mindmap";
				case "epub":
				case "fb2":
				case "umd": return "ebook";
				case "eml":
				case "msg":
				case "mbox": return "email";
				default: return null;
			}
		}
		/**
		* 按分支动态 import 对应渲染器（分支间拆包，文档页不拉无关渲染器）。
		*
		* @param kind 文档分支
		* @returns 单个渲染器对象
		*/
		async function loadRenderer(kind) {
			if (kind === "mindmap") return (await __vitePreload(() => import("./dist-tdpScEE_.js"), __vite__mapDeps([28,6,4,3,7]))).mindmapRenderer;
			if (kind === "ebook") return (await __vitePreload(() => import("./dist-CXqrV6TH.js"), __vite__mapDeps([29,17,4,3]))).ebookRenderer;
			return (await __vitePreload(() => import("./dist-DOlzqSH9.js"), __vite__mapDeps([30,19,4,3]))).emailRenderer;
		}
		/**
		* 拉取文件字节（照抄 PreviewGeoPanel.vue / PreviewDrawioPanel.vue 的取字节段）。
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
		/** 文档类 MIME（猜不到走空串，file-viewer 按扩展名选渲染器不受影响） */
		function mimeOf(name, kind) {
			switch (kind) {
				case "ebook": return extensionOf(name).toLowerCase() === "fb2" ? "text/xml" : "application/epub+zip";
				case "email": return extensionOf(name).toLowerCase() === "mbox" ? "application/mbox" : "message/rfc822";
				default: return "";
			}
		}
		/** 主流程：判分支→取字节→造 File→懒加载对应渲染器 + file-viewer */
		async function load() {
			const token = ++loadToken;
			disposed = false;
			loading.value = true;
			fileRef.value = null;
			try {
				const name = resolveViewerFileName();
				const kind = kindOf(name);
				if (!kind) throw new Error(`该格式暂不支持在线预览（${props.fileName}），请下载后用本地软件打开`);
				const [renderer, ready] = await Promise.all([loadRenderer(kind), ensureFileViewerLoaded()]);
				if (disposed || token !== loadToken) return;
				if (!ready) throw new Error("file-viewer 依赖加载失败");
				renderers.value = [renderer];
				const buf = await fetchBytes();
				if (disposed || token !== loadToken) return;
				fileRef.value = new File([new Uint8Array(buf)], name, { type: mimeOf(name, kind) });
			} catch (e) {
				if (disposed || token !== loadToken) return;
				const msg = e?.message ?? "文档加载失败";
				console.warn("[FvDocPanel] 文档加载失败", e);
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
		/** file-viewer 渲染完成 */
		function onRendered() {
			emit("rendered");
		}
		/** file-viewer 渲染失败 → fallback + error 明细 */
		function onRenderError(err) {
			const msg = err?.message ?? "文档渲染失败";
			console.warn("[FvDocPanel] file-viewer 渲染失败", err);
			emit("error", msg);
			emit("fallback");
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [loading.value && !fileRef.value ? (openBlock(), createElementBlock("div", _hoisted_2, "加载中…")) : viewerComp.value && fileRef.value && renderers.value.length ? (openBlock(), createBlock(resolveDynamicComponent(viewerComp.value), {
				key: 1,
				file: fileRef.value,
				options: viewerOptions.value,
				class: "fv-doc-panel__body",
				"data-testid": "file-viewer",
				onLoadComplete: onRendered,
				onError: onRenderError
			}, null, 40, ["file", "options"])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-0c3fac26"]]);
//#endregion
export { FvDocPanel_default as default };
