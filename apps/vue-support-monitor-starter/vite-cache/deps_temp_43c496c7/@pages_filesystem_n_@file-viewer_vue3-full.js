import { Kn as ref, U as computed, nt as defineComponent, pt as h, sn as useAttrs } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { c as mergeFullAssetOptions, f as setDefaultFullAssetBaseUrl, s as getDefaultFullAssetBaseUrl, t as allRenderers, u as resetDefaultFullAssetBaseUrl } from "./dist-Bqi5eMkE2.js";
import { i as jl, t as Gr } from "./dist-CA6Xpqch.js";
//#region ../../node_modules/.pnpm/@file-viewer+vue3-full@3.1.2_bpmn-js@18.31.0_esbuild@0.28.1_geotiff@2.1.3_pdf-lib@1.17.1_thre_jklckmluzassdz7kfhqt67f7e4/node_modules/@file-viewer/vue3-full/dist/index.js
var fileViewerFullPreset = allRenderers;
function withFullViewerOptions(options = {}, assetBaseUrl = getDefaultFullAssetBaseUrl()) {
	var _a;
	const { preset = allRenderers, rendererMode = "replace", ...rest } = options;
	return {
		...mergeFullAssetOptions(rest, assetBaseUrl),
		preset,
		rendererMode,
		autoRenderers: (_a = rest.autoRenderers) !== null && _a !== void 0 ? _a : true
	};
}
function withFullMountOptions(options = {}, assetBaseUrl = getDefaultFullAssetBaseUrl()) {
	return {
		...options,
		options: withFullViewerOptions(options.options, assetBaseUrl)
	};
}
function createFullExpose(getViewer) {
	return new Proxy({}, { get(_target, property) {
		return (...args) => {
			const viewer = getViewer();
			if (!viewer) throw new Error("FileViewer is not mounted.");
			const value = viewer[property];
			return typeof value === "function" ? value.apply(viewer, args) : value;
		};
	} });
}
var FileViewer = defineComponent({
	name: "FileViewerFull",
	inheritAttrs: false,
	props: {
		url: String,
		file: null,
		options: Object
	},
	slots: Object,
	setup(props, { expose, slots }) {
		const attrs = useAttrs();
		const viewer = ref(null);
		const fullOptions = computed(() => withFullViewerOptions(props.options));
		expose(createFullExpose(() => viewer.value));
		return () => h(Gr, {
			...attrs,
			url: props.url,
			file: props.file,
			options: fullOptions.value,
			ref: viewer
		}, slots);
	}
});
var createFlyfishFileViewer = (container, options = {}) => {
	return jl(container, {
		...options,
		options: withFullViewerOptions(options.options)
	});
};
var mountFlyfishFileViewer = createFlyfishFileViewer;
var Installer = class {
	constructor() {
		this.installed = false;
	}
	install(app, options = {}) {
		if (this.installed) return;
		app.component(options.componentName || "file-viewer", FileViewer);
		this.installed = true;
	}
};
var dist_default = new Installer();
//#endregion
export { FileViewer, createFlyfishFileViewer, dist_default as default, fileViewerFullPreset, getDefaultFullAssetBaseUrl, mountFlyfishFileViewer, resetDefaultFullAssetBaseUrl, setDefaultFullAssetBaseUrl, withFullMountOptions, withFullViewerOptions };
