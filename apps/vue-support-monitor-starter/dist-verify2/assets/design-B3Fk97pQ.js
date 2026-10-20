const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/photoshop-BLF6U6Sk.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/limits-Dq6NAslB.js","assets/illustrator-BVJL9-Bm.js","assets/designResources-Chh7ovk6.js","assets/adobeContainerWorkerClient-D73BaSah.js","assets/adobeBrushResources-DqYubR-G.js","assets/adobePresets-Dj9PlRo0.js","assets/idml-hVRiR_EY.js","assets/indesignExchange-BUg5TCgo.js","assets/indesignExchangeParser-8DIqa2E-.js","assets/fla-DW2nm2Wa.js","assets/xd-DcNjaNTJ.js","assets/indesign-CpiWN-3r.js","assets/indesignContainer-BLAPnmU1.js","assets/postscript-mP0m5AvQ.js","assets/postscriptLimits-DBMw6rBn.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import "./illustrator-BVJL9-Bm.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/design.js
async function renderDesignAsset(buffer, target, type = "psd", context) {
	const normalizedType = type.toLowerCase();
	if (normalizedType === "psd" || normalizedType === "psb" || normalizedType === "pdd" || normalizedType === "psdt") {
		const { default: renderPhotoshop } = await __vitePreload(async () => {
			const { default: renderPhotoshop } = await import("./photoshop-BLF6U6Sk.js");
			return { default: renderPhotoshop };
		}, __vite__mapDeps([0,1,2,3]));
		return renderPhotoshop(buffer, target, normalizedType, context);
	}
	if (normalizedType === "ai" || normalizedType === "ait") {
		const { default: renderIllustrator } = await __vitePreload(async () => {
			const { default: renderIllustrator } = await import("./illustrator-BVJL9-Bm.js");
			return { default: renderIllustrator };
		}, __vite__mapDeps([4,1,2]));
		return renderIllustrator(buffer, target, normalizedType, context);
	}
	if (normalizedType === "ase" || normalizedType === "aco") {
		const { default: renderAdobeDesignResource } = await __vitePreload(async () => {
			const { default: renderAdobeDesignResource } = await import("./designResources-Chh7ovk6.js");
			return { default: renderAdobeDesignResource };
		}, __vite__mapDeps([5,3,6,1,2]));
		return renderAdobeDesignResource(buffer, target, normalizedType, context);
	}
	if (normalizedType === "abr" || normalizedType === "csh") {
		const { default: renderAdobeBrushResource } = await __vitePreload(async () => {
			const { default: renderAdobeBrushResource } = await import("./adobeBrushResources-DqYubR-G.js");
			return { default: renderAdobeBrushResource };
		}, __vite__mapDeps([7,1,2,3]));
		return renderAdobeBrushResource(buffer, target, normalizedType, context);
	}
	if (normalizedType === "pat" || normalizedType === "grd" || normalizedType === "asl") {
		const { default: renderAdobePreset } = await __vitePreload(async () => {
			const { default: renderAdobePreset } = await import("./adobePresets-Dj9PlRo0.js");
			return { default: renderAdobePreset };
		}, __vite__mapDeps([8,1,2,3]));
		return renderAdobePreset(buffer, target, normalizedType, context);
	}
	if (normalizedType === "idml") {
		const { default: renderIdml } = await __vitePreload(async () => {
			const { default: renderIdml } = await import("./idml-hVRiR_EY.js");
			return { default: renderIdml };
		}, __vite__mapDeps([9,1,2]));
		return renderIdml(buffer, target, context);
	}
	if (normalizedType === "icml" || normalizedType === "idms" || normalizedType === "inx") {
		const { default: renderInDesignExchange } = await __vitePreload(async () => {
			const { default: renderInDesignExchange } = await import("./indesignExchange-BUg5TCgo.js");
			return { default: renderInDesignExchange };
		}, __vite__mapDeps([10,6,1,2,11]));
		return renderInDesignExchange(buffer, target, normalizedType, context);
	}
	if (normalizedType === "fla" || normalizedType === "xfl") {
		const { default: renderAdobeAnimate } = await __vitePreload(async () => {
			const { default: renderAdobeAnimate } = await import("./fla-DW2nm2Wa.js");
			return { default: renderAdobeAnimate };
		}, __vite__mapDeps([12,6,1,2]));
		return renderAdobeAnimate(buffer, target, normalizedType, context);
	}
	if (normalizedType === "xd") {
		const { default: renderAdobeXd } = await __vitePreload(async () => {
			const { default: renderAdobeXd } = await import("./xd-DcNjaNTJ.js");
			return { default: renderAdobeXd };
		}, __vite__mapDeps([13,6,1,2]));
		return renderAdobeXd(buffer, target, normalizedType, context);
	}
	if (normalizedType === "indd" || normalizedType === "indt") {
		const { default: renderAdobeInDesign } = await __vitePreload(async () => {
			const { default: renderAdobeInDesign } = await import("./indesign-CpiWN-3r.js");
			return { default: renderAdobeInDesign };
		}, __vite__mapDeps([14,6,1,2,15]));
		return renderAdobeInDesign(buffer, target, normalizedType, context);
	}
	if (normalizedType === "eps" || normalizedType === "ps") {
		const { default: renderPostscript } = await __vitePreload(async () => {
			const { default: renderPostscript } = await import("./postscript-mP0m5AvQ.js");
			return { default: renderPostscript };
		}, __vite__mapDeps([16,1,2,17]));
		return renderPostscript(buffer, target, normalizedType, context);
	}
	throw new Error(`Unsupported Adobe design container .${normalizedType}.`);
}
//#endregion
export { renderDesignAsset as default };
