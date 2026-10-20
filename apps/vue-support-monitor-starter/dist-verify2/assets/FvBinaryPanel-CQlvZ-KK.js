const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-DriUhRvK.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-preset-all-CExGzNo-.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/file-viewer-ofd-9eNsNwQp.js","assets/file-viewer-hangul-B_bH1JEd.js","assets/file-viewer-iwork-BYSdYvWo.js","assets/file-viewer-pdf-Dpq3JwgO.js","assets/file-viewer-presentation-D4LXtXdY.js","assets/file-viewer-archive-lbBLMppA.js","assets/file-viewer-cad-CizNsiaz.js","assets/file-viewer-chm-BzdqMjVx.js","assets/file-viewer-data-BtndtGG7.js","assets/file-viewer-ebook-si5y3pmt.js","assets/file-viewer-eda-BZshD_7d.js","assets/file-viewer-email-BJJzTopi.js","assets/file-viewer-geo-Dgjkgd8E.js","assets/file-viewer-image-DGEoB-JL.js","assets/file-viewer-media-C-kGWM_A.js","assets/objectSpread2-BfUs1NtZ.js","assets/fit-BpY0hdxy.js","assets/export-CuBEQtsZ.js","assets/messages-BeZPIWdo.js","assets/file-viewer3-DkmmdxGz.css","assets/dist-KfnuBCsq.js","assets/types-DfBjmPYG.js"])))=>i.map(i=>d[i]);
import { Ht as watch, _ as createBaseVNode, b as createElementBlock, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as resolveObjectUrl } from "./filestorageApi-CcKqXwQ9.js";
//#region ../../pages/filesystem/src/components/fv/FvBinaryPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	class: "fv-binary",
	"aria-label": "二进制文件检视"
};
var _hoisted_2 = {
	key: 0,
	class: "fv-binary__mask"
};
var _hoisted_3 = {
	key: 1,
	class: "fv-binary__mask"
};
var _hoisted_4 = { class: "fv-binary__mask-text" };
var MAX_BYTES = 67108864;
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvBinaryPanel.vue
var FvBinaryPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvBinaryPanel",
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
		"fallback",
		"error"
	],
	setup(__props, { emit: __emit }) {
		/**
		* 二进制检视 file-viewer 面板（bin/elf/exe/dll 等）。
		*
		* <p>此前无旧面板、此前走服务端 iframe：可执行/二进制文件没有对应的前端
		* 预览面板，只能下载或看服务端「不支持预览」提示页。本面板改走客户端检视：
		* 取字节后包成 {@code File} 交给 {@code @file-viewer/vue3} +
		* {@code binaryRenderer}（结构解析 + 十六进制检视）。</p>
		*
		* <p>骨架与 {@code FvDicomPanel} 一致（自包含 file-viewer 接线，未收敛到
		* FvPanelBase）：preset 显式携带 {@code binaryRenderer}，rendererMode:'replace'，
		* 主题 light，工具条右下。</p>
		*/
		const props = __props;
		const emit = __emit;
		/** 在线检视体积上限：超大二进制只会把解码与渲染拖死，直接引导下载 */
		const loading = ref(true);
		/** 失败文案（空串表示无错） */
		const failReason = ref("");
		/** 交给 file-viewer 的 File 对象 */
		const fileRef = shallowRef(null);
		/** file-viewer 组件（懒加载，不进主包） */
		const viewerComp = shallowRef(null);
		/** binary 渲染器插件（rendererMode:'replace' 时唯一 registry 来源） */
		let binaryPlugin = null;
		/** file-viewer 依赖是否已加载成功（幂等门闩；失败不置位，下次可重试） */
		let viewerReady = false;
		/** 组件是否已卸载（拦截在途异步回调） */
		let disposed = false;
		/** 生效文件名：包内条目取路径末段（fileName 此时是压缩包自己的名字） */
		const effectiveName = computed(() => {
			const p = props.inner;
			if (!p) return props.fileName;
			const slash = p.lastIndexOf("/");
			return slash >= 0 ? p.slice(slash + 1) : p;
		});
		/** binary 渲染器原生支持的扩展名；其余格式用 .bin 规避其他 renderer 按扩展名抢路由 */
		const BINARY_RENDERER_EXTS = /* @__PURE__ */ new Set([
			"bin",
			"hex",
			"elf",
			"exe",
			"dll",
			"class",
			"macho"
		]);
		const viewerFileName = computed(() => {
			const ext = effectiveName.value.split(".").pop()?.toLowerCase() || "";
			return BINARY_RENDERER_EXTS.has(ext) ? effectiveName.value : "file.bin";
		});
		/**
		* 懒加载 file-viewer 全套依赖（vue3 组件 + 样式 + binaryRenderer）。
		*
		* @returns 全部就绪返回 true；任一 import 失败返回 false（调用方改走兜底）
		*/
		async function ensureFileViewerLoaded() {
			if (viewerReady) return true;
			try {
				const [vueMod, cssMod, rendererMod] = await Promise.all([
					__vitePreload(() => import("./dist-DriUhRvK.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26])),
					__vitePreload(() => Promise.resolve({}), __vite__mapDeps([27])),
					__vitePreload(() => import("./dist-KfnuBCsq.js"), __vite__mapDeps([28,3,4,29]))
				]);
				viewerComp.value = vueMod.FileViewer ?? vueMod.default ?? null;
				binaryPlugin = rendererMod.binaryRenderer ?? rendererMod.default ?? null;
				viewerReady = !!viewerComp.value && !!binaryPlugin;
				return viewerReady;
			} catch (e) {
				console.warn("[FvBinaryPanel] file-viewer 依赖加载失败", e);
				return false;
			}
		}
		/** 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置） */
		const viewerOptions = computed(() => ({
			preset: {
				id: "binary",
				label: "二进制检视",
				renderers: [binaryPlugin]
			},
			rendererMode: "replace",
			theme: "light",
			toolbar: { position: "bottom-right" }
		}));
		/**
		* 拉字节 → 懒加载依赖 → 构造 File 交给 file-viewer。
		*
		* <p>取字节口径与 {@code FvDicomPanel} 一致：直传 {@code src} 优先，否则
		* {@code resolveObjectUrl} 签短时票据后 fetch（包内条目必须带
		* {@code preview=true&inner=}）。任一环节失败 emit error + fallback。</p>
		*/
		async function load() {
			loading.value = true;
			failReason.value = "";
			fileRef.value = null;
			try {
				let buf;
				if (props.src) {
					const res = await fetch(props.src);
					if (!res.ok) throw new Error(`读取文件失败（HTTP ${res.status}）`);
					buf = await res.arrayBuffer();
				} else {
					const params = {};
					if (props.inner) {
						params.preview = "true";
						params.inner = props.inner;
					}
					const url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
					if (!url) throw new Error("获取文件地址失败");
					const res = await fetch(url);
					if (!res.ok) throw new Error(`读取文件失败（HTTP ${res.status}）`);
					buf = await res.arrayBuffer();
				}
				if (disposed) return;
				if (buf.byteLength === 0) throw new Error("文件内容为空");
				if (buf.byteLength > MAX_BYTES) throw new Error("文件过大（超过 64 MB），请下载后用本地工具查看");
				const ready = await ensureFileViewerLoaded();
				if (disposed) return;
				if (!ready) throw new Error("二进制检视依赖加载失败");
				fileRef.value = new File([buf], viewerFileName.value);
			} catch (e) {
				if (disposed) return;
				const msg = e instanceof Error && e.message ? e.message : "二进制文件加载失败";
				failReason.value = msg;
				emit("error", msg);
				emit("fallback");
			} finally {
				if (!disposed) loading.value = false;
			}
		}
		/** file-viewer 渲染完成 */
		function onRendered() {
			emit("rendered");
		}
		/** file-viewer 解析失败：面板内提示 + 通知父组件兜底 */
		function onRenderError() {
			const msg = `该二进制文件暂不支持在线检视（${effectiveName.value}），请下载后用本地工具打开`;
			failReason.value = msg;
			emit("error", msg);
			emit("fallback");
		}
		watch(() => [
			props.bucket,
			props.objectKey,
			props.inner,
			props.src,
			props.fileName
		], () => void load(), { immediate: true });
		onBeforeUnmount(() => {
			disposed = true;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("section", _hoisted_1, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_2, [..._cache[0] || (_cache[0] = [createBaseVNode("span", { class: "fv-binary__mask-text" }, "加载中…", -1)])])) : failReason.value ? (openBlock(), createElementBlock("div", _hoisted_3, [createBaseVNode("span", _hoisted_4, toDisplayString(failReason.value), 1)])) : viewerComp.value && fileRef.value ? (openBlock(), createBlock(resolveDynamicComponent(viewerComp.value), {
				key: 2,
				file: fileRef.value,
				options: viewerOptions.value,
				class: "fv-binary__body",
				"data-testid": "file-viewer",
				onLoadComplete: onRendered,
				onError: onRenderError
			}, null, 40, ["file", "options"])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-d3c668de"]]);
//#endregion
export { FvBinaryPanel_default as default };
