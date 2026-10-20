const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dist-DriUhRvK.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-preset-all-CExGzNo-.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/file-viewer-ofd-9eNsNwQp.js","assets/file-viewer-hangul-B_bH1JEd.js","assets/file-viewer-iwork-BYSdYvWo.js","assets/file-viewer-pdf-Dpq3JwgO.js","assets/file-viewer-presentation-D4LXtXdY.js","assets/file-viewer-archive-lbBLMppA.js","assets/file-viewer-cad-CizNsiaz.js","assets/file-viewer-chm-BzdqMjVx.js","assets/file-viewer-data-BtndtGG7.js","assets/file-viewer-ebook-si5y3pmt.js","assets/file-viewer-eda-BZshD_7d.js","assets/file-viewer-email-BJJzTopi.js","assets/file-viewer-geo-Dgjkgd8E.js","assets/file-viewer-image-DGEoB-JL.js","assets/file-viewer-media-C-kGWM_A.js","assets/objectSpread2-BfUs1NtZ.js","assets/fit-BpY0hdxy.js","assets/export-CuBEQtsZ.js","assets/messages-BeZPIWdo.js","assets/file-viewer3-DkmmdxGz.css","assets/dist-CvDU5ASa.js"])))=>i.map(i=>d[i]);
import { $ as mergeModels, D as createVNode, Ft as useModel, Ht as watch, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, w as createSlots, wt as resolveDynamicComponent, xn as shallowRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as Transition } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../pages/filesystem/src/utils/fileViewersOptional.js
var iworkRenderer = {
	id: "iwork",
	render: () => null
};
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvPanelBase.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "fv-panel-base" };
var _hoisted_2 = {
	key: 0,
	class: "fv-panel-base__cover"
};
var _hoisted_3 = { class: "fv-panel-base__cover-card" };
var _hoisted_4 = { class: "fv-panel-base__cover-badge" };
var _hoisted_5 = {
	key: 1,
	class: "fv-panel-base__mask"
};
//#endregion
//#region ../../pages/filesystem/src/components/fv/FvPanelBase.vue
var FvPanelBase_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FvPanelBase",
	props: /*@__PURE__*/ mergeModels({
		file: {},
		renderers: {},
		presetId: {},
		viewerOptionsExtra: {},
		initialKeyword: {},
		enableJsonBeautify: { type: Boolean }
	}, {
		"loading": {
			type: Boolean,
			default: false
		},
		"loadingModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels([
		"rendered",
		"error",
		"update:loading"
	], ["update:loading"]),
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 数据加载中（v-model:loading 兼容：props.loading + emit('update:loading') 的 defineModel 形态） */
		const loading = useModel(__props, "loading");
		/**
		* 首帧渲染完成前保持宿主遮罩（盖住 file-viewer 内置 loading 动画：
		* 内置动画带扩展名徽章等插件特征，产品要求预览过程不露出）。
		* file 变化即重置，load-complete（onLoadComplete）后揭开。
		*/
		const coverLoading = ref(true);
		/** file-viewer 组件（懒加载，用 shallowRef：组件对象无需深响应） */
		const viewerComp = shallowRef(null);
		/** 加载失败时的门闩：失败不置位，下次文件变化可重试 */
		let fileViewerReady = false;
		/** 卸载标记，避免异步回调在卸载后写状态 */
		let disposed = false;
		/**
		* 懒加载 file-viewer 组件 + 样式（幂等）。
		* 用法与 PreviewOfficePanel.vue 第 106-166 行一致。
		*/
		async function ensureFileViewerLoaded() {
			if (fileViewerReady) return true;
			loading.value = true;
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
				console.warn("[FvPanelBase] file-viewer 依赖加载失败", e);
				emit("error", e);
				return false;
			} finally {
				loading.value = false;
			}
		}
		/**
		* 传给 file-viewer 的 options（preset + replace 模式 + 主题 + 工具条位置 + 宿主扩展）。
		*
		* preset 为数组形态：手装渲染器在前（优先命中），viewerOptionsExtra.preset
		* （如 file-viewer.generated.mjs 的 generated preset，含 iwork/rtf 等可选能力）
		* 在后兜底——压缩包嵌套渲染、包内条目预览同样吃这套 registry。
		*/
		const viewerOptions = computed(() => {
			const { preset: extraPreset, ...restExtra } = props.viewerOptionsExtra ?? {};
			const presetInput = [{
				id: props.presetId,
				label: props.presetId,
				renderers: [...props.renderers, iworkRenderer]
			}];
			if (extraPreset) presetInput.push(extraPreset);
			return {
				preset: presetInput,
				rendererMode: "replace",
				theme: "light",
				toolbar: { position: "bottom-right" },
				...restExtra
			};
		});
		/** 遮罩徽章文案：文件扩展名大写（无扩展名显示 FILE） */
		const extLabel = computed(() => {
			const name = props.file?.name ?? "";
			const dot = name.lastIndexOf(".");
			return (dot > 0 ? name.slice(dot + 1) : "file").toUpperCase().slice(0, 6);
		});
		/** 当前扩展名是否属于 JSON 家族（美化按钮的显示条件） */
		const isJsonFamily = computed(() => {
			const name = props.file?.name ?? "";
			const dot = name.lastIndexOf(".");
			const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
			return [
				"json",
				"jsonc",
				"json5",
				"ipynb"
			].includes(ext);
		});
		/** file-viewer 组件实例（公开 API 门面：searchDocument / zoom / print …） */
		const viewerRef = ref(null);
		/** JSON 美化：解析当前文件 → 两空格缩进重排 → 以新 File 重渲染（原文件不变） */
		async function beautifyJson() {
			const file = props.file;
			if (!file) return;
			try {
				const text = await file.text();
				const parsed = JSON.parse(text);
				const pretty = JSON.stringify(parsed, null, 2) + "\n";
				const dot = file.name.lastIndexOf(".");
				const prettyName = dot > 0 ? `${file.name.slice(0, dot)}.pretty${file.name.slice(dot)}` : `pretty-${file.name}`;
				fileRef.value = new File([pretty], prettyName, { type: "application/json" });
			} catch (e) {
				console.warn("[FvPanelBase] JSON 美化失败（内容可能不是合法 JSON）", e);
			}
		}
		/** 文本类扩展名（复制按钮的显示条件：内容可直接复制的文本文件） */
		const TEXT_COPY_EXTS = /* @__PURE__ */ new Set([
			"txt",
			"md",
			"markdown",
			"json",
			"jsonc",
			"json5",
			"js",
			"mjs",
			"cjs",
			"css",
			"scss",
			"less",
			"html",
			"htm",
			"xml",
			"xsl",
			"xsd",
			"svg",
			"yaml",
			"yml",
			"log",
			"ini",
			"cfg",
			"conf",
			"toml",
			"env",
			"gitignore",
			"sh",
			"bash",
			"zsh",
			"ps1",
			"bat",
			"cmd",
			"sql",
			"csv",
			"tsv",
			"java",
			"py",
			"pyi",
			"jsx",
			"ts",
			"tsx",
			"vue",
			"svelte",
			"astro",
			"go",
			"rs",
			"php",
			"c",
			"h",
			"cc",
			"cpp",
			"cxx",
			"hpp",
			"cs",
			"rb",
			"swift",
			"kt",
			"kts",
			"scala",
			"lua",
			"r",
			"dart",
			"ex",
			"exs",
			"erl",
			"hs",
			"clj",
			"fs",
			"m",
			"mm",
			"pl",
			"pm",
			"gradle",
			"ipynb"
		]);
		/** 当前文件内容是否可直接复制（文本类文件） */
		const canCopyContent = computed(() => {
			const file = props.file;
			if (!file) return false;
			if (file.type.startsWith("text/")) return true;
			const dot = file.name.lastIndexOf(".");
			const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "";
			return TEXT_COPY_EXTS.has(ext);
		});
		/** 写剪贴板：优先异步 Clipboard API，降级 textarea + execCommand（非安全上下文） */
		async function writeClipboard(text) {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
				return;
			}
			const ta = document.createElement("textarea");
			ta.value = text;
			ta.style.position = "fixed";
			ta.style.opacity = "0";
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
		}
		/** 复制文件内容（文本类文件；二进制文件无内容可复制，按钮不展示） */
		async function copyFileContent() {
			const file = props.file;
			if (!file) return;
			try {
				await writeClipboard(await file.text());
				message.success("已复制文件内容");
			} catch (e) {
				console.warn("[FvPanelBase] 复制文件内容失败", e);
				message.error("复制失败，请检查浏览器剪贴板权限");
			}
		}
		/**
		* 复制按钮悬停态。
		*
		* <p>工具条按钮由 file-viewer 渲染进 shadow DOM（插槽内容被
		* 手工挂进 shadow 树），文档样式表（含本组件 scoped 样式）
		* 触达不到 slotted 元素——此前 {@code .fv-panel-base__copy}
		* 的 scoped 规则从未生效，按钮一直吃浏览器 UA 默认样式
		* （灰底 / 方角 / 2px 边框，与内置 pill 按钮不一致）。
		* 故样式走内联 + JS 悬停态。</p>
		*/
		const copyHover = ref(false);
		/** 复制按钮内联样式：对齐内置「下载」按钮（floating 变体） */
		const copyButtonStyle = computed(() => ({
			height: "32px",
			minWidth: "48px",
			padding: "0 10px",
			border: "0",
			borderRadius: "999px",
			background: copyHover.value ? "var(--file-viewer-button-hover-bg, rgba(33,163,102,.1))" : "transparent",
			color: copyHover.value ? "var(--file-viewer-button-hover-color, #16774c)" : "var(--file-viewer-button-color, #40546a)",
			fontSize: "12px",
			fontWeight: "800",
			lineHeight: "32px",
			fontFamily: "inherit",
			whiteSpace: "nowrap",
			cursor: "pointer",
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			appearance: "none",
			WebkitAppearance: "none",
			boxSizing: "border-box",
			margin: "0",
			outline: "none"
		}));
		/** 首帧渲染完成后按 initialKeyword 自动触发关键词高亮（官方 searchDocument API） */
		function applyInitialKeyword() {
			const q = (props.initialKeyword ?? "").trim();
			if (q && viewerRef.value?.searchDocument) viewerRef.value.searchDocument(q).catch((e) => console.warn("[FvPanelBase] 关键词高亮失败", e));
		}
		/** 当前文件引用（props.file 变化即重渲染） */
		const fileRef = ref(null);
		onMounted(() => {
			ensureFileViewerLoaded();
			fileRef.value = props.file;
		});
		onBeforeUnmount(() => {
			disposed = true;
		});
		watch(() => props.file, (f) => {
			fileRef.value = f;
			coverLoading.value = true;
			if (!fileViewerReady && !disposed) ensureFileViewerLoaded();
		});
		watch(() => props.renderers, () => {
			if (!fileViewerReady && !disposed) ensureFileViewerLoaded();
		});
		/** load-complete → rendered 转发，并揭开宿主遮罩、触发初始关键词高亮 */
		function onLoadComplete() {
			coverLoading.value = false;
			applyInitialKeyword();
			emit("rendered");
		}
		/** error → error 转发（错误态由入口层展示，遮罩同步揭开避免白屏卡死） */
		function onViewerError(err) {
			coverLoading.value = false;
			emit("error", err);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				viewerComp.value && fileRef.value ? (openBlock(), createBlock(resolveDynamicComponent(viewerComp.value), {
					key: 0,
					ref_key: "viewerRef",
					ref: viewerRef,
					file: fileRef.value,
					options: viewerOptions.value,
					class: "fv-panel-base__body",
					"data-testid": "file-viewer",
					onLoadComplete,
					onError: onViewerError
				}, createSlots({ _: 2 }, [__props.enableJsonBeautify && isJsonFamily.value ? {
					name: "toolbar-start",
					fn: withCtx(() => [createBaseVNode("button", {
						type: "button",
						class: "fv-panel-base__beautify",
						title: "JSON 美化（两空格缩进重排）",
						onClick: beautifyJson
					}, " 美化 ")]),
					key: "0"
				} : void 0, canCopyContent.value ? {
					name: "toolbar-end",
					fn: withCtx(() => [createBaseVNode("button", {
						type: "button",
						class: "fv-panel-base__copy",
						title: "复制文件内容",
						style: normalizeStyle(copyButtonStyle.value),
						onClick: copyFileContent,
						onMouseenter: _cache[0] || (_cache[0] = ($event) => copyHover.value = true),
						onMouseleave: _cache[1] || (_cache[1] = ($event) => copyHover.value = false)
					}, " 复制 ", 36)]),
					key: "1"
				} : void 0]), 1064, ["file", "options"])) : createCommentVNode("", true),
				createVNode(Transition, { name: "fv-cover" }, {
					default: withCtx(() => [coverLoading.value ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
						createBaseVNode("span", _hoisted_4, toDisplayString(extLabel.value), 1),
						_cache[2] || (_cache[2] = createBaseVNode("span", { class: "fv-panel-base__cover-dots" }, [
							createBaseVNode("i"),
							createBaseVNode("i"),
							createBaseVNode("i")
						], -1)),
						_cache[3] || (_cache[3] = createBaseVNode("span", { class: "fv-panel-base__cover-text" }, "正在准备预览…", -1))
					]), _cache[4] || (_cache[4] = createBaseVNode("div", { class: "fv-panel-base__cover-bar" }, [createBaseVNode("i")], -1))])) : createCommentVNode("", true)]),
					_: 1
				}),
				loading.value && !viewerComp.value ? (openBlock(), createElementBlock("div", _hoisted_5, "加载中…")) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-23154370"]]);
//#endregion
export { FvPanelBase_default as t };
