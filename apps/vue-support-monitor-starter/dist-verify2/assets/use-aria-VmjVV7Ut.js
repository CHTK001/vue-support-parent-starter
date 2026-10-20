import { s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as pick } from "./pick-BwGnaelS.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-aria/index.mjs
/**
* @deprecated Removed after 3.0.0, Use `AriaProps` instead.
*/
var ariaProps = buildProps({
	/**
	* @description native `aria-label` attribute
	*/
	ariaLabel: String,
	/**
	* @description native `aria-orientation` attribute
	*/
	ariaOrientation: {
		type: String,
		values: [
			"horizontal",
			"vertical",
			"undefined"
		]
	},
	/**
	* @description native `aria-controls` attribute
	*/
	ariaControls: String
});
var useAriaProps = (arias) => {
	return pick(ariaProps, arias);
};
//#endregion
export { useAriaProps as t };
