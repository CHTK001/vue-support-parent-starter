const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-DriUhRvK.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-preset-all-CExGzNo-.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/file-viewer-ofd-9eNsNwQp.js","assets/file-viewer-hangul-B_bH1JEd.js","assets/file-viewer-iwork-BYSdYvWo.js","assets/file-viewer-pdf-Dpq3JwgO.js","assets/file-viewer-presentation-D4LXtXdY.js","assets/file-viewer-archive-lbBLMppA.js","assets/file-viewer-cad-CizNsiaz.js","assets/file-viewer-chm-BzdqMjVx.js","assets/file-viewer-data-BtndtGG7.js","assets/file-viewer-ebook-si5y3pmt.js","assets/file-viewer-eda-BZshD_7d.js","assets/file-viewer-email-BJJzTopi.js","assets/file-viewer-geo-Dgjkgd8E.js","assets/file-viewer-image-DGEoB-JL.js","assets/file-viewer-media-C-kGWM_A.js","assets/objectSpread2-BfUs1NtZ.js","assets/fit-BpY0hdxy.js","assets/export-CuBEQtsZ.js","assets/messages-BeZPIWdo.js","assets/file-viewer3-DkmmdxGz.css","assets/dist-CvDU5ASa.js"])))=>i.map(i=>d[i]);
import { Ht as watch, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as resolveObjectUrl } from "./filestorageApi-CcKqXwQ9.js";
//#region ../../pages/filesystem/src/components/fv/FvArchivePanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "fv-archive-panel" };
var _hoisted_2 = {
	key: 0,
	class: "fv-archive-panel__mask"
};
var _hoisted_3 = {
	key: 1,
	class: "fv-archive-panel__mask"
};
var _hoisted_4 = { class: "fv-archive-panel__mask-text" };
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvArchivePanel.vue
var FvArchivePanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvArchivePanel",
	props: {
		bucket: {},
		objectKey: {},
		fileName: {},
		src: {},
		inner: {},
		size: {}
	},
	emits: [
		"fallback",
		"error",
		"rendered"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** TODO(inner)：props.inner 暂未使用——file-viewer 的 archive 渲染器接管包内浏览
		*  与嵌套渲染（点包内条目直接在本面板内按扩展名嵌套渲染，渲染能力见
		*  ensureFileViewerLoaded 注入的 office / image / text / media）；
		*  若后续要在包外单独渲染某条目，再按 preview=true&inner= 拼接票据取字节。 */
		/** 加载中 */
		const loading = ref(true);
		/** 失败文案（空串表示无错） */
		const failReason = ref("");
		/** 交给 file-viewer 的 File 对象 */
		const fileRef = shallowRef(null);
		/**
		* file-viewer 组件（懒加载，照抄 PreviewOfficePanel.vue 106-166 行模式）。
		*/
		const viewerComp = shallowRef(null);
		/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
		let fileViewerReady = false;
		/**
		* 懒加载 file-viewer 全套依赖（vue3-full 组件 + 样式）。
		*
		* <p>vue3-full 的 FileViewer 默认用 {@code @file-viewer/preset-all} 全量渲染器，
		* 并给 archive 等渲染器装配全量资产 URL（libarchive worker/wasm）。
		* file-viewer 的 archive 渲染器接管包内浏览，点包内条目会按条目扩展名在
		* preset-all 里找渲染器嵌套渲染（csv / png / txt / mp4 / pdf … 全覆盖）。</p>
		*/
		async function ensureFileViewerLoaded() {
			if (fileViewerReady) return true;
			try {
				const [vueMod, cssMod, coreMod] = await Promise.all([
					__vitePreload(() => import("./dist-DriUhRvK.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26])),
					__vitePreload(() => Promise.resolve({}), __vite__mapDeps([27])),
					__vitePreload(() => import("./dist-CvDU5ASa.js"), __vite__mapDeps([28,3,4]))
				]);
				vueMod.setDefaultFullAssetBaseUrl?.("/");
				coreMod.setDefaultFileViewerAssetBaseUrl?.("/");
				viewerComp.value = vueMod.FileViewer ?? vueMod.default ?? null;
				fileViewerReady = !!viewerComp.value;
				return fileViewerReady;
			} catch (e) {
				console.warn("[FvArchivePanel] file-viewer 依赖加载失败", e);
				return false;
			}
		}
		/**
		* 传给 file-viewer 的 options（主题 + 工具条位置）。
		*
		* <p>preset / rendererMode 不显式传，由 vue3-full 默认装配 preset-all：
		* 顶层 registry 含 archive 渲染器（渲染压缩包本体），包内条目同样按
		* preset-all 里的渲染器嵌套渲染（见 {@link ensureFileViewerLoaded}）。</p>
		*/
		const viewerOptions = computed(() => ({
			theme: "light",
			toolbar: { position: "bottom-right" }
		}));
		/**
		* 取压缩包本体字节并准备渲染。
		*
		* 旧面板 ArchivePreviewPanel.vue 走 ?format=archive 纯 JSON 通道只取条目结构；
		* file-viewer 的 archive 渲染器要吃压缩包原始字节，故这里走对象直链取字节
		* （顶层文件路径；downloadSelf()/resolveObjectUrl(bucket, objectKey) 模式，
		* 不带 preview/inner——带 inner 会只拿到包内某一条目而非压缩包本体）。
		*/
		async function load() {
			if (!props.src && (!props.bucket || !props.objectKey)) return;
			loading.value = true;
			failReason.value = "";
			fileRef.value = null;
			try {
				const url = props.src ?? await resolveObjectUrl(props.bucket, props.objectKey);
				if (!url) throw new Error("获取压缩包地址失败");
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const ab = await res.arrayBuffer();
				if (!ab.byteLength) throw new Error("预览通道返回空响应体");
				if (!await ensureFileViewerLoaded()) throw new Error("file-viewer 依赖加载失败");
				fileRef.value = new File([ab], props.fileName);
			} catch (e) {
				const msg = e?.message ?? "压缩包加载失败";
				console.warn("[FvArchivePanel] 压缩包加载失败", e);
				failReason.value = `压缩包加载失败（${props.fileName}）：${msg}`;
				emit("fallback");
				emit("error", failReason.value);
			} finally {
				loading.value = false;
			}
		}
		watch(() => [
			props.bucket,
			props.objectKey,
			props.src,
			props.fileName
		], () => void load(), { immediate: true });
		/** file-viewer 渲染完成 */
		function onRendered() {
			emit("rendered");
		}
		/** file-viewer 解析失败（多为损坏包/不支持的压缩算法）：退回旧面板兜底 */
		function onRenderError() {
			console.warn("[FvArchivePanel] file-viewer 渲染失败", props.fileName);
			failReason.value = `压缩包解析失败（${props.fileName}），请下载后用本地软件打开`;
			emit("fallback");
			emit("error", failReason.value);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_2, [..._cache[0] || (_cache[0] = [createBaseVNode("span", { class: "fv-archive-panel__mask-text" }, "加载中…", -1)])])) : failReason.value ? (openBlock(), createElementBlock("div", _hoisted_3, [createBaseVNode("span", _hoisted_4, toDisplayString(failReason.value), 1)])) : viewerComp.value && fileRef.value ? (openBlock(), createBlock(resolveDynamicComponent(viewerComp.value), {
				key: 2,
				file: fileRef.value,
				options: viewerOptions.value,
				class: "fv-archive-panel__body",
				"data-testid": "file-viewer",
				onLoadComplete: onRendered,
				onError: onRenderError
			}, null, 40, ["file", "options"])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-57626834"]]);
//#endregion
export { FvArchivePanel_default as default };
