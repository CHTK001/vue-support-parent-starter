const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dagre-GXQ25YYZ-CVefpUQB.js","assets/graphlib-mRnWl-Q6.js","assets/_baseGet-DmmfCxUg.js","assets/isObject-CBh4bHyD.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/_Uint8Array-Cf2dnQh6.js","assets/union-CKG0-ouI.js","assets/_baseIteratee-0zvAcVIj.js","assets/get-cR0zxN0m.js","assets/_baseIsEqual-4zTScXwg.js","assets/hasIn-COufhDdn.js","assets/isArrayLikeObject-CeWRLNuC.js","assets/_arrayEach-OvAge8dJ.js","assets/isEmpty-DZzpJqft.js","assets/_baseEach-CPGfeQSN.js","assets/isUndefined-DfHYomSZ.js","assets/dagre-ynccOtrb.js","assets/toInteger-DwissHgA.js","assets/toNumber-PE_CR5nS.js","assets/_baseClone-CR0xuNh7.js","assets/_baseSet-CMSvwkCM.js","assets/isPlainObject-CmtvaEIG.js","assets/merge-DIljS_69.js","assets/_flatRest-CP5Zoeqo.js","assets/sortBy-BKBwN3Oc.js","assets/cloneDeep-BJ4zGpri.js","assets/now-B_tnrbij.js","assets/last-CtlzjKiB.js","assets/map-BLFeDwW3.js","assets/pick-BwGnaelS.js","assets/chunk-75Z2AOVW-tyQLi-d5.js","assets/pointer-CUzP0kn2.js","assets/step-DeDTPBUO.js","assets/math-CcXhgIHE.js","assets/chunk-Y2CYZVJY-Cs0fowS7.js","assets/src-D5h6GpYO.js","assets/rolldown-runtime-CEgmsyvS.js","assets/dayjs.min-DeZMAZuH.js","assets/src-Df4bFYz8.js","assets/value-H8gKMGY5.js","assets/timer-d7k6Rryl.js","assets/chunk-DU6HZSFF-BqXTkcmT.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/dist-C0hIIK8s.js","assets/chunk-PWAF6VOD-DlaxcI0_.js","assets/chunk-GMAD6QVW-NrdKpsdr.js","assets/chunk-P2QGCYS3-CGIfvHGB.js","assets/chunk-4HAMMTFA-8UXdNhWm.js","assets/rough.esm-WPr-dXTc.js","assets/chunk-GVQU2GXP-B0jUHEmz.js","assets/chunk-OSK3NFVY-wfHBCTgC.js","assets/line-BSBxwLdy.js","assets/path-D481hj-_.js","assets/array-75Ih5Qg4.js","assets/chunk-L3NEJ4N5-Bbe9fDCw.js","assets/chunk-2E4U76K2-CnEhYQ5R.js","assets/swimlanes-42K2YHIH-DNT1FqDd.js","assets/cose-bilkent-JH36ORCC-CgnfOZoE.js","assets/cytoscape.esm-CuNsGW0b.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { d as interpolateToCurve } from "./chunk-75Z2AOVW-tyQLi-d5.js";
import { n as __name } from "./chunk-Y2CYZVJY-Cs0fowS7.js";
import { t as log } from "./src-D5h6GpYO.js";
import { b as getConfig, s as common_default } from "./chunk-DU6HZSFF-BqXTkcmT.js";
import { a as labelHelper } from "./chunk-4HAMMTFA-8UXdNhWm.js";
import { r as insertNode } from "./chunk-GVQU2GXP-B0jUHEmz.js";
import { a as insertEdgeLabel, c as positionEdgeLabel, i as insertEdge, s as markers_default } from "./chunk-OSK3NFVY-wfHBCTgC.js";
import { n as insertCluster } from "./chunk-L3NEJ4N5-Bbe9fDCw.js";
//#region ../../node_modules/.pnpm/mermaid@11.17.2/node_modules/mermaid/dist/chunks/mermaid.core/chunk-TLUHSLCS.mjs
var internalHelpers = {
	common: common_default,
	getConfig,
	insertCluster,
	insertEdge,
	insertEdgeLabel,
	insertMarkers: markers_default,
	insertNode,
	interpolateToCurve,
	labelHelper,
	log,
	positionEdgeLabel
};
var layoutAlgorithms = {};
var registerLayoutLoaders = /* @__PURE__ */ __name((loaders) => {
	for (const loader of loaders) layoutAlgorithms[loader.name] = loader;
}, "registerLayoutLoaders");
(/* @__PURE__ */ __name(() => {
	registerLayoutLoaders([
		{
			name: "dagre",
			loader: /* @__PURE__ */ __name(async () => await __vitePreload(() => import("./dagre-GXQ25YYZ-CVefpUQB.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56])), "loader")
		},
		{
			name: "swimlane",
			loader: /* @__PURE__ */ __name(async () => await __vitePreload(() => import("./swimlanes-42K2YHIH-DNT1FqDd.js"), __vite__mapDeps([57,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])), "loader")
		},
		...[{
			name: "cose-bilkent",
			loader: /* @__PURE__ */ __name(async () => await __vitePreload(() => import("./cose-bilkent-JH36ORCC-CgnfOZoE.js"), __vite__mapDeps([58,37,32,35,36,38,39,40,41,59])), "loader")
		}]
	]);
}, "registerDefaultLayoutLoaders"))();
var render = /* @__PURE__ */ __name(async (data4Layout, svg) => {
	if (!(data4Layout.layoutAlgorithm in layoutAlgorithms)) throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
	if (data4Layout.diagramId) for (const node of data4Layout.nodes) {
		const originalDomId = node.domId || node.id;
		node.domId = `${data4Layout.diagramId}-${originalDomId}`;
	}
	const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
	const layoutRenderer = await layoutDefinition.loader();
	const { theme, themeVariables } = data4Layout.config;
	const { useGradient, gradientStart, gradientStop } = themeVariables;
	const svgId = svg.attr("id");
	svg.append("defs").append("filter").attr("id", `${svgId}-drop-shadow`).attr("height", "130%").attr("width", "130%").append("feDropShadow").attr("dx", "4").attr("dy", "4").attr("stdDeviation", 0).attr("flood-opacity", "0.06").attr("flood-color", `${theme?.includes("dark") ? "#FFFFFF" : "#000000"}`);
	svg.append("defs").append("filter").attr("id", `${svgId}-drop-shadow-small`).attr("height", "150%").attr("width", "150%").append("feDropShadow").attr("dx", "2").attr("dy", "2").attr("stdDeviation", 0).attr("flood-opacity", "0.06").attr("flood-color", `${theme?.includes("dark") ? "#FFFFFF" : "#000000"}`);
	if (useGradient) {
		const gradient = svg.append("linearGradient").attr("id", svg.attr("id") + "-gradient").attr("gradientUnits", "objectBoundingBox").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
		gradient.append("svg:stop").attr("offset", "0%").attr("stop-color", gradientStart).attr("stop-opacity", 1);
		gradient.append("svg:stop").attr("offset", "100%").attr("stop-color", gradientStop).attr("stop-opacity", 1);
	}
	return layoutRenderer.render(data4Layout, svg, internalHelpers, { algorithm: layoutDefinition.algorithm });
}, "render");
var getRegisteredLayoutAlgorithm = /* @__PURE__ */ __name((algorithm = "", { fallback = "dagre" } = {}) => {
	if (algorithm in layoutAlgorithms) return algorithm;
	if (fallback in layoutAlgorithms) {
		log.warn(`Layout algorithm ${algorithm} is not registered. Using ${fallback} as fallback.`);
		return fallback;
	}
	throw new Error(`Both layout algorithms ${algorithm} and ${fallback} are not registered.`);
}, "getRegisteredLayoutAlgorithm");
//#endregion
export { registerLayoutLoaders as n, render as r, getRegisteredLayoutAlgorithm as t };
