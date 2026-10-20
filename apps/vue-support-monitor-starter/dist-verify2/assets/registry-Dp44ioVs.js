const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/bell-BILu6CxG.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/resolve-motion-value-CGV3UIZ1.js","assets/heart-SxSqup1V.js","assets/plus-njFk1mCw.js","assets/trash-CBXaJMzi.js","assets/bell-DWghjHsm.js","assets/heart-BtvZnyLT.js","assets/plus-JLvcvyPG.js","assets/trash-DQCH3Y5b.js","assets/bell-DB0DnOgZ.js","assets/heart-Uvq5Em8o.js","assets/plus-BSDVgsrP.js","assets/trash-i7VtO5h6.js","assets/bell-CjwYc3dl.js","assets/heart-C4Vm53Fh.js","assets/plus-dWdWJyV6.js","assets/trash-AQqv2j-w.js"])))=>i.map(i=>d[i]);
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../packages/ui/src/components/ReIcon/animated/registry.ts
/** 动画图标名的统一前缀：`anim:<lib>:<icon>` */
var ANIMATED_ICON_PREFIX = "anim:";
var ENTRIES = [
	{
		name: "anim:heroicons:bell",
		lib: "heroicons",
		icon: "bell",
		load: () => __vitePreload(() => import("./bell-BILu6CxG.js"), __vite__mapDeps([0,1,2]))
	},
	{
		name: "anim:heroicons:heart",
		lib: "heroicons",
		icon: "heart",
		load: () => __vitePreload(() => import("./heart-SxSqup1V.js"), __vite__mapDeps([3,1,2]))
	},
	{
		name: "anim:heroicons:plus",
		lib: "heroicons",
		icon: "plus",
		load: () => __vitePreload(() => import("./plus-njFk1mCw.js"), __vite__mapDeps([4,1,2]))
	},
	{
		name: "anim:heroicons:trash",
		lib: "heroicons",
		icon: "trash",
		load: () => __vitePreload(() => import("./trash-CBXaJMzi.js"), __vite__mapDeps([5,1,2]))
	},
	{
		name: "anim:hugeicons:bell",
		lib: "hugeicons",
		icon: "bell",
		load: () => __vitePreload(() => import("./bell-DWghjHsm.js"), __vite__mapDeps([6,1,2]))
	},
	{
		name: "anim:hugeicons:heart",
		lib: "hugeicons",
		icon: "heart",
		load: () => __vitePreload(() => import("./heart-BtvZnyLT.js"), __vite__mapDeps([7,1,2]))
	},
	{
		name: "anim:hugeicons:plus",
		lib: "hugeicons",
		icon: "plus",
		load: () => __vitePreload(() => import("./plus-JLvcvyPG.js"), __vite__mapDeps([8,1,2]))
	},
	{
		name: "anim:hugeicons:trash",
		lib: "hugeicons",
		icon: "trash",
		load: () => __vitePreload(() => import("./trash-DQCH3Y5b.js"), __vite__mapDeps([9,1,2]))
	},
	{
		name: "anim:phosphor:bell",
		lib: "phosphor",
		icon: "bell",
		load: () => __vitePreload(() => import("./bell-DB0DnOgZ.js"), __vite__mapDeps([10,1,2]))
	},
	{
		name: "anim:phosphor:heart",
		lib: "phosphor",
		icon: "heart",
		load: () => __vitePreload(() => import("./heart-Uvq5Em8o.js"), __vite__mapDeps([11,1,2]))
	},
	{
		name: "anim:phosphor:plus",
		lib: "phosphor",
		icon: "plus",
		load: () => __vitePreload(() => import("./plus-BSDVgsrP.js"), __vite__mapDeps([12,1,2]))
	},
	{
		name: "anim:phosphor:trash",
		lib: "phosphor",
		icon: "trash",
		load: () => __vitePreload(() => import("./trash-i7VtO5h6.js"), __vite__mapDeps([13,1,2]))
	},
	{
		name: "anim:tabler:bell",
		lib: "tabler",
		icon: "bell",
		load: () => __vitePreload(() => import("./bell-CjwYc3dl.js"), __vite__mapDeps([14,1,2]))
	},
	{
		name: "anim:tabler:heart",
		lib: "tabler",
		icon: "heart",
		load: () => __vitePreload(() => import("./heart-C4Vm53Fh.js"), __vite__mapDeps([15,1,2]))
	},
	{
		name: "anim:tabler:plus",
		lib: "tabler",
		icon: "plus",
		load: () => __vitePreload(() => import("./plus-dWdWJyV6.js"), __vite__mapDeps([16,1,2]))
	},
	{
		name: "anim:tabler:trash",
		lib: "tabler",
		icon: "trash",
		load: () => __vitePreload(() => import("./trash-AQqv2j-w.js"), __vite__mapDeps([17,1,2]))
	}
];
var BY_NAME = new Map(ENTRIES.map((entry) => [entry.name, entry]));
/** 全部动画图标名（`anim:<lib>:<icon>`），顺序固定，供选择器稳定分页 */
var ANIMATED_ICON_NAMES = ENTRIES.map((entry) => entry.name);
/** 是否是本注册表认识的动画图标名 */
function isAnimatedIconName(name) {
	return typeof name === "string" && BY_NAME.has(name);
}
/** 取某个动画图标的懒加载器；未注册时返回 null（调用方回退到普通图标） */
function loadAnimatedIcon(name) {
	return BY_NAME.get(name)?.load ?? null;
}
//#endregion
export { loadAnimatedIcon as i, ANIMATED_ICON_PREFIX as n, isAnimatedIconName as r, ANIMATED_ICON_NAMES as t };
