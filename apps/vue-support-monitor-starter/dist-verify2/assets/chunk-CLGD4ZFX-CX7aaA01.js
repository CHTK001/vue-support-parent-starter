import { n as select_default } from "./pointer-CUzP0kn2.js";
import { n as __name } from "./chunk-Y2CYZVJY-Cs0fowS7.js";
import "./src-D5h6GpYO.js";
import { x as getConfig2 } from "./chunk-DU6HZSFF-BqXTkcmT.js";
//#region ../../node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/chunk-CLGD4ZFX.mjs
var selectSvgElement = /* @__PURE__ */ __name((id) => {
	const { securityLevel } = getConfig2();
	let root = select_default("body");
	if (securityLevel === "sandbox") {
		const doc = select_default(`#i${id}`).node()?.contentDocument ?? document;
		root = select_default(doc.body);
	}
	return root.select(`#${id}`);
}, "selectSvgElement");
//#endregion
export { selectSvgElement as t };
