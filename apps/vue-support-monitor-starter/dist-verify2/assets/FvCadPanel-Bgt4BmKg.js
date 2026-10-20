const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-DriUhRvK.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-preset-all-CExGzNo-.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/file-viewer-ofd-9eNsNwQp.js","assets/file-viewer-hangul-B_bH1JEd.js","assets/file-viewer-iwork-BYSdYvWo.js","assets/file-viewer-pdf-Dpq3JwgO.js","assets/file-viewer-presentation-D4LXtXdY.js","assets/file-viewer-archive-lbBLMppA.js","assets/file-viewer-cad-CizNsiaz.js","assets/file-viewer-chm-BzdqMjVx.js","assets/file-viewer-data-BtndtGG7.js","assets/file-viewer-ebook-si5y3pmt.js","assets/file-viewer-eda-BZshD_7d.js","assets/file-viewer-email-BJJzTopi.js","assets/file-viewer-geo-Dgjkgd8E.js","assets/file-viewer-image-DGEoB-JL.js","assets/file-viewer-media-C-kGWM_A.js","assets/objectSpread2-BfUs1NtZ.js","assets/fit-BpY0hdxy.js","assets/export-CuBEQtsZ.js","assets/messages-BeZPIWdo.js","assets/dist-DMN6_96E.js","assets/file-viewer3-DkmmdxGz.css"])))=>i.map(i=>d[i]);
import { Ht as watch, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as resolveObjectUrl } from "./filestorageApi-CcKqXwQ9.js";
//#region ../../pages/filesystem/src/components/fv/FvCadPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "fv-cad-panel" };
var _hoisted_2 = {
	key: 0,
	class: "fv-cad-panel__mask"
};
var _hoisted_3 = {
	key: 1,
	class: "fv-cad-panel__mask"
};
var _hoisted_4 = { class: "fv-cad-panel__mask-text" };
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvCadPanel.vue
var FvCadPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvCadPanel",
	props: {
		bucket: {},
		objectKey: {},
		fileName: {},
		inner: {},
		size: {},
		src: {}
	},
	emits: [
		"fallback",
		"error",
		"rendered"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/**
		* 生效文件名：包内条目取路径末段（抄 PreviewMediaPanel.vue effectiveName 思路，
		* 旧 CadPreviewPanel 用后端回的 name 展示包内路径，这里取字节只需末段判型）。
		*/
		const effectiveName = computed(() => {
			const p = props.inner;
			if (!p) return props.fileName;
			const slash = p.lastIndexOf("/");
			return slash >= 0 ? p.slice(slash + 1) : p;
		});
		/**
		* 交给 file-viewer 的文件名：dwg/dxf 必须带正确扩展名（渲染器按扩展名选型）。
		* 包内条目末段若丢了扩展名（如解压路径异常），按顶层 fileName 的扩展名补回。
		*/
		const viewerFileName = computed(() => {
			const eff = effectiveName.value;
			if (/\.(dwg|dxf)$/i.test(eff)) return eff;
			const dot = props.fileName.lastIndexOf(".");
			const ext = dot >= 0 ? props.fileName.slice(dot) : ".dxf";
			return `${eff.includes(".") ? eff.slice(0, eff.lastIndexOf(".")) : eff}${ext}`;
		});
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
		/** cad 渲染器 preset（rendererMode:'replace' 时唯一 registry 来源） */
		let cadPreset = null;
		/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
		let fileViewerReady = false;
		/** 懒加载 file-viewer 全套依赖（并行拉取组件 + cad 渲染器 + 样式） */
		async function ensureFileViewerLoaded() {
			if (fileViewerReady) return true;
			try {
				const [vueMod, rendererMod, cssMod] = await Promise.all([
					__vitePreload(() => import("./dist-DriUhRvK.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26])),
					__vitePreload(() => import("./dist-DMN6_96E.js"), __vite__mapDeps([27,14,3,4])),
					__vitePreload(() => Promise.resolve({}), __vite__mapDeps([28]))
				]);
				const renderer = rendererMod.cadRenderer;
				cadPreset = {
					id: "file-viewer-preset-cad",
					label: "Flyfish File Viewer cad renderer preset",
					renderers: [renderer]
				};
				viewerComp.value = vueMod.FileViewer ?? vueMod.default ?? null;
				fileViewerReady = !!viewerComp.value && !!cadPreset && !!renderer;
				return fileViewerReady;
			} catch (e) {
				console.warn("[FvCadPanel] file-viewer 依赖加载失败", e);
				return false;
			}
		}
		/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
		const viewerOptions = computed(() => ({
			preset: cadPreset,
			rendererMode: "replace",
			theme: "light",
			toolbar: { position: "bottom-right" }
		}));
		/**
		* 取图纸字节并准备渲染。
		*
		* 取字节逻辑对照旧 CadPreviewPanel.vue load()（getCadInfo(bucket, objectKey, inner)）：
		* 旧面板传 inner 解析包内条目、不传解析对象本身——这里同样：有 inner 时票据带
		* preview=true&inner=（抄 PreviewMediaPanel.vue load() 的包内分支，后端包内提取只挂
		* 在预览分支上），无 inner 时直接签顶层对象票据。再 fetch 成字节包成 File。
		*/
		async function load() {
			if (!props.src && (!props.bucket || !props.objectKey)) return;
			loading.value = true;
			failReason.value = "";
			fileRef.value = null;
			try {
				let url = props.src ?? "";
				if (!url) {
					const params = {};
					if (props.inner) {
						params.preview = "true";
						params.inner = props.inner;
					}
					url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
					if (!url) throw new Error("获取图纸地址失败");
				}
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const ab = await res.arrayBuffer();
				if (!ab.byteLength) throw new Error("预览通道返回空响应体");
				if (!await ensureFileViewerLoaded()) throw new Error("file-viewer 依赖加载失败");
				fileRef.value = new File([ab], viewerFileName.value);
			} catch (e) {
				const msg = e?.message ?? "CAD 图纸加载失败";
				console.warn("[FvCadPanel] CAD 图纸加载失败", e);
				failReason.value = `CAD 图纸加载失败（${effectiveName.value}）：${msg}`;
				emit("fallback");
				emit("error", failReason.value);
			} finally {
				loading.value = false;
			}
		}
		watch(() => [
			props.bucket,
			props.objectKey,
			props.inner,
			props.src,
			props.fileName
		], () => void load(), { immediate: true });
		/** file-viewer 渲染完成 */
		function onRendered() {
			emit("rendered");
		}
		/** file-viewer 解析失败（多为 DWG 私有格式几何无法解析/损坏文件）：退回旧面板兜底 */
		function onRenderError() {
			console.warn("[FvCadPanel] file-viewer 渲染失败", viewerFileName.value);
			failReason.value = `CAD 图纸解析失败（${effectiveName.value}），请下载后用 CAD 软件打开`;
			emit("fallback");
			emit("error", failReason.value);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_2, [..._cache[0] || (_cache[0] = [createBaseVNode("span", { class: "fv-cad-panel__mask-text" }, "加载中…", -1)])])) : failReason.value ? (openBlock(), createElementBlock("div", _hoisted_3, [createBaseVNode("span", _hoisted_4, toDisplayString(failReason.value), 1)])) : viewerComp.value && fileRef.value ? (openBlock(), createBlock(resolveDynamicComponent(viewerComp.value), {
				key: 2,
				file: fileRef.value,
				options: viewerOptions.value,
				class: "fv-cad-panel__body",
				"data-testid": "file-viewer",
				onLoadComplete: onRendered,
				onError: onRenderError
			}, null, 40, ["file", "options"])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-c452f85b"]]);
//#endregion
export { FvCadPanel_default as default };
