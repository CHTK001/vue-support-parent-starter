const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-DriUhRvK.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-preset-all-CExGzNo-.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/file-viewer-ofd-9eNsNwQp.js","assets/file-viewer-hangul-B_bH1JEd.js","assets/file-viewer-iwork-BYSdYvWo.js","assets/file-viewer-pdf-Dpq3JwgO.js","assets/file-viewer-presentation-D4LXtXdY.js","assets/file-viewer-archive-lbBLMppA.js","assets/file-viewer-cad-CizNsiaz.js","assets/file-viewer-chm-BzdqMjVx.js","assets/file-viewer-data-BtndtGG7.js","assets/file-viewer-ebook-si5y3pmt.js","assets/file-viewer-eda-BZshD_7d.js","assets/file-viewer-email-BJJzTopi.js","assets/file-viewer-geo-Dgjkgd8E.js","assets/file-viewer-image-DGEoB-JL.js","assets/file-viewer-media-C-kGWM_A.js","assets/objectSpread2-BfUs1NtZ.js","assets/fit-BpY0hdxy.js","assets/export-CuBEQtsZ.js","assets/messages-BeZPIWdo.js","assets/file-viewer3-DkmmdxGz.css","assets/dist-Zx6QQvO1.js","assets/adobeBrushResourceParser-BSK9wB_O.js","assets/dist-Dkr0Qb6c.js","assets/base64-js-DFqkKNNm.js","assets/limits-Dq6NAslB.js","assets/adobePresetParser-CxOz2xgB.js","assets/indesignContainer-BLAPnmU1.js","assets/indesignExchangeParser-8DIqa2E-.js","assets/photoshopPreflight-BCgzeqIc.js","assets/file-viewer-spreadsheet-T3xybzT9.js","assets/postscriptLimits-DBMw6rBn.js"])))=>i.map(i=>d[i]);
import { Ht as watch, _ as createBaseVNode, b as createElementBlock, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { O as resolveObjectUrl } from "./filestorageApi-CcKqXwQ9.js";
//#region ../../pages/filesystem/src/components/fv/FvDesignPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	class: "fv-design",
	"aria-label": "设计稿预览"
};
var _hoisted_2 = {
	key: 0,
	class: "fv-design__mask"
};
var _hoisted_3 = {
	key: 1,
	class: "fv-design__mask"
};
var _hoisted_4 = { class: "fv-design__mask-text" };
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvDesignPanel.vue
var FvDesignPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvDesignPanel",
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
		* 设计稿 file-viewer 面板（psb/indd 等）。
		*
		* <p>此前无旧面板、此前走服务端 iframe：psb/indd 等设计稿格式没有对应的前端
		* 预览面板，统一由后端拼 HTML 预览页。本面板改走客户端直渲染：取字节后包成
		* {@code File} 交给 {@code @file-viewer/vue3} + {@code designRenderer}
		*（覆盖 psb/indd 等；psd 走 renderer-data，不归它）。</p>
		*
		* <p>骨架与 {@code FvDicomPanel} 一致（自包含 file-viewer 接线，未收敛到
		* FvPanelBase）：preset 显式携带 {@code designRenderer}，rendererMode:'replace'，
		* 主题 light，工具条右下。</p>
		*/
		const props = __props;
		const emit = __emit;
		/** 加载中（取数 + 依赖懒加载） */
		const loading = ref(true);
		/** 失败文案（空串表示无错） */
		const failReason = ref("");
		/** 交给 file-viewer 的 File 对象 */
		const fileRef = shallowRef(null);
		/** file-viewer 组件（懒加载，不进主包） */
		const viewerComp = shallowRef(null);
		/** design 渲染器插件（rendererMode:'replace' 时唯一 registry 来源） */
		let designPlugin = null;
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
		/**
		* 懒加载 file-viewer 全套依赖（vue3 组件 + 样式 + designRenderer）。
		*
		* @returns 全部就绪返回 true；任一 import 失败返回 false（调用方改走兜底）
		*/
		async function ensureFileViewerLoaded() {
			if (viewerReady) return true;
			try {
				const [vueMod, cssMod, rendererMod] = await Promise.all([
					__vitePreload(() => import("./dist-DriUhRvK.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26])),
					__vitePreload(() => Promise.resolve({}), __vite__mapDeps([27])),
					__vitePreload(() => import("./dist-Zx6QQvO1.js"), __vite__mapDeps([28,3,4,16,29,30,31,32,33,34,35,36,37,6,7,38]))
				]);
				viewerComp.value = vueMod.FileViewer ?? vueMod.default ?? null;
				designPlugin = rendererMod.designRenderer ?? rendererMod.default ?? null;
				viewerReady = !!viewerComp.value && !!designPlugin;
				return viewerReady;
			} catch (e) {
				console.warn("[FvDesignPanel] file-viewer 依赖加载失败", e);
				return false;
			}
		}
		/**
		* design 渲染器的资产 URL（worker / wasm），全部指向前端同源。
		*
		* <p><b>为什么必须显式写死</b>：{@code @file-viewer/preset-all} 的
		* {@code createFullAssetOptions} 只给 archive/chm/cad/data/docx/drawing/
		* model/pdf/presentation/spreadsheet/typst 装配 workerUrl，**没有 design 段**。
		* design 的 worker 由 {@code @file-viewer/core} 的
		* {@code resolveFileViewerDesignContainerWorkerUrl(options, document)} 解析，
		* 而 core 的 assetBaseUrl 处于 automatic 模式（vue3-full 的
		* {@code setDefaultFullAssetBaseUrl("/")} 只设 full 层，没设 core 层）。
		* automatic 会按页面里的 script src 反推 base：预览弹窗里文件字节来自
		* 存储域（{@code http://<storage>:18080/ot/...}），推断结果就变成存储域，
		* 于是 worker 请求打到 {@code http://<storage>:18080/ot/vendor/design/*.worker.js}
		* ——跨域，浏览器直接拒绝（实测报 "Photoshop Worker failed to load"）。</p>
		*
		* <p>这些文件由 {@code @file-viewer/vite-plugin} 的 copyAssets 落到
		* {@code public/vendor/design/}，前端同源即可加载，与文件字节的域无关。</p>
		*/
		const viewerOptions = computed(() => ({
			preset: {
				id: "design",
				label: "设计稿",
				renderers: [designPlugin]
			},
			rendererMode: "replace",
			theme: "light",
			toolbar: { position: "bottom-right" },
			design: {
				workerUrl: "/vendor/design/photoshop.worker.js",
				illustratorWorkerUrl: "/vendor/design/illustrator-pgf.worker.js",
				containerWorkerUrl: "/vendor/design/adobe-container.worker.js",
				adobeResourceWorkerUrl: "/vendor/design/adobe-resource.worker.js",
				idmlWorkerUrl: "/vendor/design/idml.worker.js",
				postscriptWorkerUrl: "/vendor/design/postscript.worker.js",
				idmlWasmUrl: "/vendor/design/paged_introspect_wasm_bg.wasm",
				postscriptWasmUrl: "/vendor/design/stet_wasm_bg.wasm"
			}
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
				const ready = await ensureFileViewerLoaded();
				if (disposed) return;
				if (!ready) throw new Error("设计稿渲染依赖加载失败");
				fileRef.value = new File([buf], effectiveName.value);
			} catch (e) {
				if (disposed) return;
				const msg = e instanceof Error && e.message ? e.message : "设计稿加载失败";
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
			const msg = `该设计稿暂不支持在线预览（${effectiveName.value}），请下载后用本地软件打开`;
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
			return openBlock(), createElementBlock("section", _hoisted_1, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_2, [..._cache[0] || (_cache[0] = [createBaseVNode("span", { class: "fv-design__mask-text" }, "加载中…", -1)])])) : failReason.value ? (openBlock(), createElementBlock("div", _hoisted_3, [createBaseVNode("span", _hoisted_4, toDisplayString(failReason.value), 1)])) : viewerComp.value && fileRef.value ? (openBlock(), createBlock(resolveDynamicComponent(viewerComp.value), {
				key: 2,
				file: fileRef.value,
				options: viewerOptions.value,
				class: "fv-design__body",
				"data-testid": "file-viewer",
				onLoadComplete: onRendered,
				onError: onRenderError
			}, null, 40, ["file", "options"])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-80587d07"]]);
//#endregion
export { FvDesignPanel_default as default };
