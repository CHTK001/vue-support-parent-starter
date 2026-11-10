import { d as log } from "./src-DKvlxpeG.js";
import { n as loadThemedComponent, r as resolveThemeId, t as defineThemeComponent } from "./theme-DY5ftAcm.js";
//#region ../../packages/ui/src/presets.ts
/**
* @repo/ui —— Re* 组件预设（preset）
*
* <p><strong>为什么需要 preset：</strong>宿主 app 过去要在 {@code main.ts} 里手写
* 三十来行 {@code "ReButton", "ReTable", ...} 组件名清单。清单属于「这个 app 用到哪些
* 组件」的知识，却写在最外层壳里 —— 换 app 抄一遍、加组件再抄一遍、删组件忘删就白打包。
* preset 把这份清单收回到组件库内部按用途命名，宿主只声明「我要哪一套」。</p>
*
* <p><strong>为什么不默认全量安装：</strong>组件库的第一设计目标是「按需加载，防止全部组件
* 打入产物」（见 {@code ./index.ts} 文件头）。全量安装会让产物里塞进几十个用不到的组件，
* 与该目标直接冲突。所以 preset 是<b>显式选择</b>，不是隐式兜底。</p>
*
* <p><strong>树摇仍然有效：</strong>preset 的组件名是<b>静态字符串数组</b>，
* {@link resolveUiPreset} 展开后交给 {@link installUi} 的 {@code componentLoaders}
* 逐个动态 import —— 未被 preset 引用的组件不会进入产物。</p>
*/
/**
* 通用后台预设：绝大多数管理端 app 的公共组件。
*
* <p>涵盖表格 / 表单 / 弹窗 / 标签 / 卡片 / 加载态等「任何 CRUD 页面都会用到」的基础件。</p>
*
* <p><b>ReKit 一次带一串</b>：{@code ReOption / ReFormItem / ReRow / ReCol /
* ReRadioGroup / ReRadio / ReRadioButton / ReTreeSelect / ReTableColumn /
* ReDropdown(+Menu/Item) / ReDescriptions(+Item) / ReAlert / ReDivider / ReLink /
* ReAvatar} 这些「透传 / 美化」型小组件都收敛在 {@code ReKit} 这一个包里注册，
* 因此清单里只列 {@code ReKit} 一项即可覆盖它们全部。</p>
*/
var CORE_PRESET = [
	"ReButton",
	"ReTag",
	"ReBadge",
	"ReInput",
	"ReInputNumber",
	"ReSelect",
	"ReDatePicker",
	"ReDialog",
	"ReProgressDialog",
	"ReTable",
	"RePagination",
	"ReForm",
	"ReEmpty",
	"ReSkeleton",
	"ReCard",
	"ReStatusIndicator",
	"ReStatCard",
	"ReSectionHead",
	"ReSwitch",
	"ReFilter",
	"ReText",
	"ReCountup",
	"ReCountdown",
	"ReTrend",
	"ReRemoteSelect",
	"ReLoading",
	"ReLoader",
	"ReScrollbar",
	"ReTagFilter",
	"ReTree",
	"ReEmptyState",
	"ReTab",
	"ReKit",
	"ReProcessTask",
	"ReCommand",
	"ReErrorBar",
	"ReIconSelect",
	"ReRelationGraph",
	"ReProgress",
	"ReThree",
	"ReContextMenu",
	"ReSplitLayout"
];
/**
* 监控台预设：{@link CORE_PRESET} + 监控台特有的过程任务浮层与关系图。
*
* <p>当前与 {@link CORE_PRESET} 内容一致（监控台用到的组件恰好就是这批）。
* 独立成名的意义：日后监控台若新增 / 移除组件，改这里即可，
* 不必让其它 app 跟着动 —— preset 之间可以自由叠加。</p>
*/
var MONITOR_PRESET = CORE_PRESET;
/** 预设别名表：宿主用短名声明，组件库内部维护实际清单 */
var PRESETS = {
	core: CORE_PRESET,
	monitor: MONITOR_PRESET
};
/**
* 解析预设名 → 组件名清单。
*
* <p>未知预设名抛错而非静默忽略：静默忽略会表现为「组件没注册，页面渲染成未知元素」，
* 且控制台没有明显报错（与 {@code install.ts} 里 {@code ReGraph3D} 那次静默失败同源）。
* 抛错能在启动时立刻暴露拼写错误。</p>
*
* @param name 预设名（如 {@code "monitor"}）
* @returns 该预设声明的组件名清单
* @throws 预设名不存在时抛出
*/
function resolveUiPreset(name) {
	const preset = PRESETS[name];
	if (!preset) throw new Error(`[ui] 未知的组件预设 "${name}"。可用预设：${Object.keys(PRESETS).join(" / ")}`);
	return preset;
}
/**
* 预热组件内部懒加载布局 —— 消除首次打开弹窗 / 下拉时的卡顿。
*
* <p>ReSelect / ReSwitch / ReDrawer 的「主题化布局」是动态 import 的，
* 不预热的话首次打开会先白屏再渲染。</p>
*
* <p>这些布局与业务无关，属于组件自身的实现细节，因此由组件库自己声明，
* 而不是让每个 app 在 {@code main.ts} 里各写一遍 {@code void import(...)}。</p>
*
* <p>ReDialog 的预热按当前 themeId 选择实现（koi 主题走 {@code theme/koi/ReDialog.vue}，
* 其它主题走组件根实现）—— 组件库不与具体主题焊死。</p>
*/
function preloadUiLayouts() {
	import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReSelect/layouts/Square.vue");
	import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReSelect/layouts/Modern.vue");
	import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReSwitch/layouts/SquareReSwitch.vue");
	import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReSwitch/layouts/CardReSwitch.vue");
	import("./ReDrawer-CKlhpApI.js");
	if (resolveThemeId() === "koi") import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReDialog/theme/koi/ReDialog.vue");
	else import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReDialog/ReDialog.vue");
}
//#endregion
//#region ../../packages/ui/src/install.ts
/** 已注册组件缓存，避免重复注册 */
var registered = /* @__PURE__ */ new Set();
/** 组件注册表：懒加载映射，import 时才会加载对应子模块 */
var componentLoaders = {
	ReText: () => import("./ReText-DwWcch3s.js"),
	ReButton: () => import("./ReButton-BMj9TiU8.js"),
	ReInput: () => import("./@repo_ui_re-input.js"),
	ReInputNumber: () => import("./ReInputNumber-r7mL9GE-.js"),
	ReSelect: () => import("./@repo_ui_re-select.js"),
	ReDatePicker: () => import("./ReDatePicker-Dv3-dfo3.js"),
	ReForm: () => import("./ReForm-Djk_VLHa.js"),
	ReTree: () => import("./ReTree-C60SARgB.js"),
	ReTimeline: () => import("./ReTimeline-DOu5hzrI.js"),
	ReAlbum: () => import("./ReAlbum-CXcz8mNE.js"),
	ReCard: () => import("./ReCard-DAEUtV1C.js"),
	ReDialog: () => import("./ReDialog-D8aTpgqq.js"),
	ReFloatWindow: () => import("./ReFloatWindow-D0zYjdah.js"),
	ReProgressDialog: () => import("./ReProgressDialog-DZsI_lkg.js"),
	ReTable: () => import("./ReTable-BIiSUTp3.js"),
	ReTag: () => import("./@repo_ui_re-tag.js"),
	ReBadge: () => import("./ReBadge-B5sVgaPh.js"),
	ReIcon: () => import("./@repo_ui_re-icon.js"),
	ReIp: () => import("./ReIp-CVniLQtj.js"),
	ReIpText: () => import("./ReIpText-7_CfbXAJ.js"),
	ReTime: () => import("./ReTime-DXj9O_aY.js"),
	ReIconSelect: () => import("./ReIconSelect-FP412A_O.js"),
	ReScrollNav: () => import("./ReScrollNav-DZSSAxnz.js"),
	ReSearch: () => import("./ReSearch-CstZhH7p.js"),
	ReRichText: () => import("./ReRichText-BCF8qY1y.js"),
	ReTagFilter: () => import("./ReTagFilter-BdCkSHRW.js"),
	ReLoading: () => import("./ReLoading-Bnb5OUzT.js"),
	ReLoader: () => import("./ReLoader-DlTrnGZY.js"),
	ReDrawer: () => import("./ReDrawer-CKlhpApI.js"),
	ReSeamlessScroll: () => import("./ReSeamlessScroll-DnUBG031.js"),
	ReStatusIndicator: () => import("./ReStatusIndicator-Bo3yc2K8.js"),
	ReStatCard: () => import("./ReStatCard-C0E8GoBH.js"),
	ReStatsCard: () => import("./ReStatsCard-D-nVw638.js"),
	ReSectionHead: () => import("./ReSectionHead-DpbCJdaW.js"),
	ReTrend: () => import("./ReTrend-BrSsT65d.js"),
	ReRelationGraph: () => import("./ReRelationGraph-B_TtfdDy.js"),
	ReFlowGraph: () => import("./ReFlowGraph-Bfng15Jq.js"),
	ReChart: () => import("./ReChart-DrO5gu_G.js"),
	ReEcharts: () => import("./ReEcharts-asWoglDk.js"),
	ReCropper: () => import("./ReCropper-Csj7rEge.js"),
	ReCode: () => import("./ReCode-BVx0wGIM.js"),
	ReScrollbar: () => import("./@repo_ui_re-scrollbar.js"),
	ReLazy: () => import("./ReLazy-BGUCUkY1.js"),
	ReAsync: () => import("./ReAsync-JhWk31oT.js"),
	ReCountup: () => import("./ReCountup-D8VnrfUH.js"),
	ReCountdown: () => import("./ReCountdown-5V3UjieH.js"),
	ReImageCompare: () => import("./ReImageCompare-AayIsU-5.js"),
	ReImage: () => import("./ReImage-NosRzyMd.js"),
	ReImageGroup: () => import("./ReImageGroup-CQX6M5m3.js"),
	ReTypeIt: () => import("./ReTypeIt-xk0oBcsf.js"),
	ReChat: () => import("./ReChat-CVK3SVrX.js"),
	ReAvatarCrop: () => import("./ReAvatarCrop-JoNz0H_y.js"),
	ReUpload: () => import("./ReUpload-BzPtu1hi.js"),
	ReUploadChunk: () => import("./ReUploadChunk-Da57Rtz9.js"),
	ReStat: () => import("./ReStat-DBsbUlgZ.js"),
	ReCarousel: () => import("./ReCarousel-N_erHTwd.js"),
	ReBreadcrumb: () => import("./ReBreadcrumb-BNHzK0vq.js"),
	ReFilePicker: () => import("./ReFilePicker-CFYxz-cb.js"),
	ReRagManager: () => import("./ReRagManager-Dmnin7Kf.js"),
	ReRagChat: () => import("./ReRagChat-Dvu32P0x.js"),
	ReImageGen: () => import("./ReImageGen-DOjblrlw.js"),
	ReVideoGen: () => import("./ReVideoGen-H-yD6abR.js"),
	ReColorize: () => import("./ReColorize-Bv5bpCtW.js"),
	ReStationMessage: () => import("./ReStationMessage-CvERznQ1.js"),
	ReTab: () => import("./ReTab-DNbYLGz2.js"),
	ReTabs: () => import("./ReTabs-w1-cCR1f.js"),
	ReSwitch: () => import("./ReSwitch-BxQJ8PJJ.js"),
	ReCron: () => import("./ReCron-BJg3DCLE.js"),
	ReEmpty: () => import("./ReEmpty-D4yIMfJ2.js"),
	ReEmptyState: () => import("./ReEmptyState-CUcQLKuq.js"),
	ReErrorBar: () => import("./ReErrorBar-CPFFHPEQ.js"),
	ReSkeleton: () => import("./ReSkeleton-bdfBzOn5.js"),
	RePagination: () => import("./RePagination-CNBOVGRp.js"),
	ReRibbon: () => import("./ReRibbon-ChoQ1d3M.js"),
	ReFilter: () => import("./ReFilter-DfiwAJVR.js"),
	ReProgress: () => import("./ReProgress-B6DPbKzr.js"),
	ReProcessTask: () => import("./ReProcessTask-DO0Nayac.js"),
	ReRemoteSelect: () => import("./ReRemoteSelect-DqcJJ3QR.js"),
	ReAvatar3D: () => import("./ReAvatar3D-6Islf-q3.js"),
	ReClineCharacter: () => import("./ReClineCharacter-Dt6DmdFS.js"),
	ReThree: () => import("./ReThree-BC1t4Ys3.js"),
	ReMap3D: () => import("./ReMap3D-B8s5CyR7.js"),
	ReCanvasUi: () => import("./ReCanvasUi-DHiuq2QQ.js"),
	ReKit: () => import("./@repo_ui_re-kit.js"),
	ReStateIcon: () => import("./ReStateIcon-CUd07C31.js"),
	ReCommand: () => import("./ReCommand-CL0SzEDN.js"),
	ReContextMenu: () => import("./ReContextMenu-CFpTFtiu.js"),
	ReSplitLayout: () => import("./ReSplitLayout-CoO1Yukj.js")
};
/**
* 按需安装组件
* 未在 components / preset 中声明的组件不会被 import，保证打包时被 tree-shaking 掉。
*/
async function installUi(app, options = {}) {
	const { components = [], plugins = [], preset } = options;
	const presetComponents = preset ? [...resolveUiPreset(preset)] : [];
	for (const name of [...presetComponents, ...components]) {
		if (registered.has(name)) continue;
		const loader = componentLoaders[name];
		if (!loader) {
			log.warn(`[ui] 未找到组件 ${name}`);
			continue;
		}
		if (app.component(name)) {
			registered.add(name);
			continue;
		}
		try {
			const plugin = (await loader()).install;
			if (plugin && typeof plugin.install === "function") await plugin.install(app);
			else app.use(plugin);
			registered.add(name);
		} catch (e) {
			log.warn(`[ui] 组件 ${name} 加载失败`, e);
		}
	}
	for (const plugin of plugins) app.use(plugin);
}
//#endregion
export { CORE_PRESET, MONITOR_PRESET, defineThemeComponent, installUi, loadThemedComponent, preloadUiLayouts, resolveThemeId, resolveUiPreset };
