//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/vue/refs.mjs
var composeRefs = (...refs) => {
	return (el) => {
		refs.forEach((ref) => {
			ref.value = el;
		});
	};
};
//#endregion
export { composeRefs as t };
