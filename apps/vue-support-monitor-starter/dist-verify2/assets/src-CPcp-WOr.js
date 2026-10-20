const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/403-Dm5UCp6z.js","assets/403-DCvzis-J.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/dist-DogtK295.js","assets/rolldown-runtime-CEgmsyvS.js","assets/src-DzQcKxHP.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/vue-router-D43uXGPs.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/403-d796rojF.js","assets/403-C2wsWTR8.css","assets/404-CLoxopJ1.js","assets/404-B5awkjJ4.js","assets/404-CwYujs4G.js","assets/404-C93N3u_Y.css","assets/500-DhyAI4KW.js","assets/500-CCrg6e4A.js","assets/500-CPUXSUXa.js","assets/500-BhNew4pU.css"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _403_default } from "./403-DCvzis-J.js";
import { t as _404_default } from "./404-B5awkjJ4.js";
import { t as _500_default } from "./500-CCrg6e4A.js";
//#region ../../packages/pages/src/index.ts
/** 错误页路由（403 / 404 / 500 + 兜底） */
var errorRoutes = [
	{
		path: "/403",
		name: "403",
		component: () => __vitePreload(() => import("./403-Dm5UCp6z.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10])),
		meta: {
			title: "403",
			icon: "QuestionFilled",
			showLink: false
		}
	},
	{
		path: "/404",
		name: "404",
		component: () => __vitePreload(() => import("./404-CLoxopJ1.js"), __vite__mapDeps([11,12,2,3,4,5,6,7,8,13,14])),
		meta: {
			title: "404",
			icon: "CircleCloseFilled",
			showLink: false
		}
	},
	{
		path: "/500",
		name: "500",
		component: () => __vitePreload(() => import("./500-DhyAI4KW.js"), __vite__mapDeps([15,16,2,3,4,5,6,7,8,17,18])),
		meta: {
			title: "500",
			icon: "WarningFilled",
			showLink: false
		}
	},
	{
		path: "/:pathMatch(.*)*",
		component: () => __vitePreload(() => import("./404-CLoxopJ1.js"), __vite__mapDeps([11,12,2,3,4,5,6,7,8,13,14]))
	}
];
//#endregion
export { _403_default as error403, _404_default as error404, _500_default as error500, errorRoutes };
