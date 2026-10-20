//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/numbers.mjs
/**
* Due to browser rendering and calculation precision loss issues,
* boundary checks cannot be based solely on value equality;
* a certain range of fluctuation is permissible.
*/
function isGreaterThan(a, b, epsilon = .03) {
	return a - b > epsilon;
}
//#endregion
export { isGreaterThan as t };
