import "./illustrator-n4pNrNIy.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/design.js
async function renderDesignAsset(buffer, target, type = "psd", context) {
	const normalizedType = type.toLowerCase();
	if (normalizedType === "psd" || normalizedType === "psb" || normalizedType === "pdd" || normalizedType === "psdt") {
		const { default: renderPhotoshop } = await import("./photoshop-Dny9qvnn.js");
		return renderPhotoshop(buffer, target, normalizedType, context);
	}
	if (normalizedType === "ai" || normalizedType === "ait") {
		const { default: renderIllustrator } = await import("./illustrator-n4pNrNIy.js");
		return renderIllustrator(buffer, target, normalizedType, context);
	}
	if (normalizedType === "ase" || normalizedType === "aco") {
		const { default: renderAdobeDesignResource } = await import("./designResources-gRWMfx0u.js");
		return renderAdobeDesignResource(buffer, target, normalizedType, context);
	}
	if (normalizedType === "abr" || normalizedType === "csh") {
		const { default: renderAdobeBrushResource } = await import("./adobeBrushResources-BpIbqodp.js");
		return renderAdobeBrushResource(buffer, target, normalizedType, context);
	}
	if (normalizedType === "pat" || normalizedType === "grd" || normalizedType === "asl") {
		const { default: renderAdobePreset } = await import("./adobePresets-CXBJkk9I.js");
		return renderAdobePreset(buffer, target, normalizedType, context);
	}
	if (normalizedType === "idml") {
		const { default: renderIdml } = await import("./idml-a-c7w3zi.js");
		return renderIdml(buffer, target, context);
	}
	if (normalizedType === "icml" || normalizedType === "idms" || normalizedType === "inx") {
		const { default: renderInDesignExchange } = await import("./indesignExchange-BJUJd1Id.js");
		return renderInDesignExchange(buffer, target, normalizedType, context);
	}
	if (normalizedType === "fla" || normalizedType === "xfl") {
		const { default: renderAdobeAnimate } = await import("./fla-MpQ7PFZf.js");
		return renderAdobeAnimate(buffer, target, normalizedType, context);
	}
	if (normalizedType === "xd") {
		const { default: renderAdobeXd } = await import("./xd-DM7p0VR2.js");
		return renderAdobeXd(buffer, target, normalizedType, context);
	}
	if (normalizedType === "indd" || normalizedType === "indt") {
		const { default: renderAdobeInDesign } = await import("./indesign-BgxaBusa.js");
		return renderAdobeInDesign(buffer, target, normalizedType, context);
	}
	if (normalizedType === "eps" || normalizedType === "ps") {
		const { default: renderPostscript } = await import("./postscript-Do-IU9xV.js");
		return renderPostscript(buffer, target, normalizedType, context);
	}
	throw new Error(`Unsupported Adobe design container .${normalizedType}.`);
}
//#endregion
export { renderDesignAsset as default };
