import { n as Loading, t as vLoading } from "./directive-BSbh65vI.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/loading/index.mjs
var ElLoading = {
	install(app) {
		Loading._context = app._context;
		vLoading._context = app._context;
		app.directive("loading", vLoading);
		app.config.globalProperties.$loading = Loading;
	},
	directive: vLoading,
	service: Loading
};
//#endregion
export { ElLoading as t };
