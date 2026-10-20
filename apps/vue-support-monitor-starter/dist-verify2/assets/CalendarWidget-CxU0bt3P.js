const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReDialog-Br5G1CNa.js","assets/ReDialog-DZGeR3lw.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/theme-B9R3AFqb.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/src-DzQcKxHP.js","assets/ReSwitch-Wi1q44O-.js","assets/ReSwitch-B3yMYGw4.js","assets/ReSwitch-BIIwnUAR.js","assets/ReButton-XiNbAVqG.js","assets/ReButton-owxlNwDO.js","assets/ReButton-CH6SFZxo.js","assets/tooltip-DEX5DBfd.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/dist-DI3cGDuP.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/isUndefined-DfHYomSZ.js","assets/dist-Clzx2YUA.js","assets/aria-DKP9Ei-1.js","assets/use-id-C2v-tXFq.js","assets/focus-trap-B31xXeBw.js","assets/use-z-index-Q40Vppe1.js","assets/use-aria-VmjVV7Ut.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/hasIn-COufhDdn.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/constants-ntbKDiND.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/button-CLXz94Uh.js","assets/use-size-BpzpcbJM.js","assets/use-deprecated-qam6HGto.js","assets/use-form-common-props-DzQ9ZY64.js","assets/dist-DogtK295.js","assets/icon-C0dIJHSD.js","assets/use-form-item-D-dEMqBj.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReIcon-mRxVAA3T.js","assets/registry-Dp44ioVs.js","assets/ReIcon-B6YUJqdV.css","assets/ReButton-CVtu1Sci.css","assets/ReInput-CgzHFsgl.js","assets/ReInput-CGHpe202.js","assets/input-Bbhiel27.js","assets/event-CeZgVnv0.js","assets/raf-Ck-OXP6t.js","assets/use-composition-BHiYKdrO.js","assets/typescript-CMUKtCBO.js","assets/ReInput-D5IsrmWe.css","assets/ReDatePicker-wu-sPQEY.js","assets/date-picker-D-vMtORE.js","assets/debounce-DfrQLO3V.js","assets/toNumber-PE_CR5nS.js","assets/now-B_tnrbij.js","assets/omit-nJwLfQRJ.js","assets/_baseClone-CR0xuNh7.js","assets/_arrayEach-OvAge8dJ.js","assets/_baseSlice-CS6dHRAG.js","assets/last-CtlzjKiB.js","assets/scrollbar-DRrkTSQ2.js","assets/numbers-I--Pu7qj.js","assets/dayjs.min-DeZMAZuH.js","assets/click-outside-B3b0egMR.js","assets/repeat-click-BFYhYwtQ.js","assets/advancedFormat-Cu6D3d9S.js","assets/CalendarHolidayDialog-BT-pxooA.js","assets/calendar-D4HVZKIc.js","assets/CalendarHolidayDialog-BUtjMFs4.css"])))=>i.map(i=>d[i]);
import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, O as defineAsyncComponent, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { Et as plus_default, Lt as right_default, Xt as sunny_default, d as calendar_default, kt as present_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { gn as fetchHolidays, yt as message } from "./src-CEonioA3.js";
import "./src-DDwlSqPX.js";
import { n as createCalendarStore } from "./indexeddb-8Dvu0tZo.js";
import { t as authStore } from "./auth-C8MLoNwd.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { c as isFixedCellHeight, n as CALENDAR_FIXED_CELL_HEIGHT, o as calendarEventRows } from "./widgets-BPaSH-hW.js";
import { f as lunarFullText, h as diffDays, i as invalidateDayCache, n as getDayInfo, o as setRemoteHolidays, s as findNextHoliday, t as festivalDisplayText } from "./calendar-D4HVZKIc.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendarStore.ts
/**
* 日历事件类型 + IndexedDB 存储
*
* 每个用户独立数据库：koi-home-calendar-{userId}
* 单个 store：events（keyPath = id）
*/
/** 获取当前用户对应的日历 store */
function getCalendarStore(userId) {
	return createCalendarStore(userId);
}
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendarCategories.ts
var CATEGORY_OPTIONS = [
	{
		value: "work",
		label: "工作",
		color: "#409EFF"
	},
	{
		value: "study",
		label: "学习",
		color: "#67C23A"
	},
	{
		value: "meeting",
		label: "会议",
		color: "#E6A23C"
	},
	{
		value: "personal",
		label: "个人",
		color: "#F56C6C"
	},
	{
		value: "life",
		label: "生活",
		color: "#909399"
	},
	{
		value: "other",
		label: "其他",
		color: "#9B59B6"
	}
];
var COLOR_MAP = CATEGORY_OPTIONS.reduce((acc, o) => {
	acc[o.value] = o.color;
	return acc;
}, {});
function categoryColor(c) {
	if (!c) return COLOR_MAP.other;
	return COLOR_MAP[c] ?? COLOR_MAP.other;
}
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/CalendarWidget.vue?vue&type=script&setup=true&name=CalendarWidget&lang.ts
var _hoisted_1 = { class: "calendar-widget" };
var _hoisted_2 = {
	key: 0,
	class: "calendar-widget__header"
};
var _hoisted_3 = { class: "calendar-widget__title" };
var _hoisted_4 = {
	key: 0,
	class: "calendar-widget__count"
};
var _hoisted_5 = { class: "calendar-widget__actions" };
var _hoisted_6 = [
	"title",
	"aria-label",
	"aria-pressed"
];
var _hoisted_7 = ["title", "aria-label"];
var _hoisted_8 = {
	key: 1,
	class: "calendar-widget__today"
};
var _hoisted_9 = { class: "calendar-widget__today-row" };
var _hoisted_10 = { class: "calendar-widget__today-date" };
var _hoisted_11 = { class: "calendar-widget__today-lunar" };
var _hoisted_12 = { class: "calendar-widget__today-row" };
var _hoisted_13 = {
	key: 0,
	class: "calendar-widget__today-festival"
};
var _hoisted_14 = {
	key: 1,
	class: "calendar-widget__today-lunar"
};
var _hoisted_15 = {
	key: 2,
	class: "calendar-widget__today-holiday"
};
var _hoisted_16 = { class: "calendar-widget__today-progress" };
var _hoisted_17 = {
	class: "calendar-widget__today-pips",
	"aria-hidden": "true"
};
var _hoisted_18 = {
	key: 0,
	class: "calendar-widget__today-provisional"
};
var _hoisted_19 = {
	key: 3,
	class: "calendar-widget__today-work"
};
var _hoisted_20 = {
	key: 4,
	class: "calendar-widget__today-rest"
};
var _hoisted_21 = {
	key: 0,
	class: "calendar-widget__today-next"
};
var _hoisted_22 = {
	key: 2,
	class: "calendar-widget__legend"
};
var _hoisted_23 = {
	key: 0,
	class: "calendar-widget__legend-item"
};
var _hoisted_24 = {
	key: 1,
	class: "calendar-widget__legend-item"
};
var _hoisted_25 = {
	key: 2,
	class: "calendar-widget__legend-item"
};
var _hoisted_26 = {
	key: 3,
	class: "calendar-widget__legend-item"
};
var _hoisted_27 = {
	key: 4,
	class: "calendar-widget__legend-item"
};
var _hoisted_28 = { class: "calendar-widget__cell-head" };
var _hoisted_29 = { class: "calendar-widget__cell-date" };
var _hoisted_30 = {
	key: 0,
	class: "calendar-widget__cell-badge"
};
var _hoisted_31 = {
	key: 0,
	class: "calendar-widget__cell-sub"
};
var _hoisted_32 = ["title"];
var _hoisted_33 = {
	key: 1,
	class: "calendar-widget__cell-sub"
};
var _hoisted_34 = { class: "calendar-widget__cell-festival is-lunar" };
var _hoisted_35 = {
	key: 2,
	class: "calendar-widget__cell-events"
};
var _hoisted_36 = ["title", "onClick"];
var _hoisted_37 = { class: "calendar-widget__cell-text" };
var _hoisted_38 = {
	key: 0,
	class: "calendar-widget__cell-more-inline"
};
var _hoisted_39 = {
	key: 0,
	class: "calendar-widget__cell-more"
};
var _hoisted_40 = {
	key: 0,
	class: "calendar-widget__form-head"
};
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/CalendarWidget.vue
var CalendarWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "CalendarWidget",
	props: { widget: {} },
	emits: ["patch-config"],
	setup(__props, { emit: __emit }) {
		/**
		* 日历 widget（el-calendar + IndexedDB 持久化）
		*
		* 数据：按当前用户 ID 隔离的 IndexedDB 数据库（koi-home-calendar-{userId}）。
		* 每个事件包含：date / title / time / allDay / category / note / id / createdAt。
		*
		* 节日信息（农历 / 节气 / 节日 / 法定放假调休）全部由 ./calendar 聚合层提供，
		* 本组件只负责取数与呈现，不自行做历法换算 —— 换算逻辑集中在一处，
		* 格子与「节日安排」面板才不会显示不一致的内容。
		*/
		const ReDialog = defineAsyncComponent(() => __vitePreload(() => import("./ReDialog-Br5G1CNa.js").then((m) => m.default), __vite__mapDeps([0,1,2,3,4,5,6])));
		const ReSwitch = defineAsyncComponent(() => __vitePreload(() => import("./ReSwitch-Wi1q44O-.js").then((m) => m.default), __vite__mapDeps([7,8,9,5,2,3])));
		const ReButton = defineAsyncComponent(() => __vitePreload(() => import("./ReButton-XiNbAVqG.js").then((m) => m.default), __vite__mapDeps([10,11,12,5,2,3,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58])));
		const ReInput = defineAsyncComponent(() => __vitePreload(() => import("./ReInput-CgzHFsgl.js").then((m) => m.default), __vite__mapDeps([59,60,5,2,3,61,14,62,42,18,19,20,21,17,23,16,63,44,36,64,24,28,29,30,31,32,33,34,35,45,46,37,38,39,40,47,25,65,66])));
		const ReDatePicker = defineAsyncComponent(() => __vitePreload(() => import("./ReDatePicker-wu-sPQEY.js").then((m) => m.default), __vite__mapDeps([67,5,68,3,14,49,40,21,20,15,16,17,62,42,18,19,30,31,32,69,70,71,72,73,53,74,35,75,76,51,52,61,23,63,44,36,64,24,28,29,33,34,45,46,37,38,39,47,25,65,13,22,26,27,50,77,78,41,43,48,79,80,81,82])));
		const CalendarHolidayDialog = defineAsyncComponent(() => __vitePreload(() => import("./CalendarHolidayDialog-BT-pxooA.js").then((m) => m.default), __vite__mapDeps([83,5,2,3,45,54,84,85])));
		const props = __props;
		/**
		* widget 自己改了配置 → 交给页面层落盘。
		*
		* <p>{@code widget} 是 props，不能直接写。头部开关要能持久化，就只能向上抛；
		* 页面层用 {@code patchWidget} 深一层合并，不会连带抹掉设置弹窗里的其它项。</p>
		*/
		const emit = __emit;
		const authStore$1 = authStore();
		const userId = computed(() => String(authStore$1.loginUser?.userId ?? authStore$1.loginUser?.id ?? "anonymous"));
		const calendarDate = ref(/* @__PURE__ */ new Date());
		const events = ref([]);
		const loading = ref(true);
		const errored = ref(false);
		/**
		* 显示配置。
		*
		* <p>存在 widget.calendarConfig 里，随布局一起持久化 —— 与 noteConfig / config 同一套路，
		* 这样「A 用户全部显示、B 用户 3 行」能各自生效，且换设备后保持一致。
		* 缺省即 {@link CalendarCellMode} 的 {@code "all"}（全部显示）。</p>
		*/
		const cellMode = computed(() => props.widget.calendarConfig?.cellMode ?? "all");
		const showFestival = computed(() => props.widget.calendarConfig?.showFestival ?? true);
		const showBadge = computed(() => props.widget.calendarConfig?.showBadge ?? true);
		/** 格子是否固定高度；「全部显示」模式随内容增长，其余固定 */
		const fixedCellHeight = computed(() => isFixedCellHeight(cellMode.value));
		/**
		* 固定密度模式写死的格子高度（px）。
		*
		* <p>挂在 .calendar-widget__body 上做 CSS 自定义属性，而不是直接写死 60px：
		* 高度与模式是一对一的（见 {@link CALENDAR_FIXED_CELL_HEIGHT} 的推导），
		* 由模板算出来比在 CSS 里按类名分叉更不容易漏。</p>
		*/
		const cellHeightStyle = computed(() => fixedCellHeight.value ? { "--koi-cal-cell-h": `${CALENDAR_FIXED_CELL_HEIGHT[cellMode.value]}px` } : void 0);
		/** 「全部显示」模式下才给农历单开一行 */
		const showLunarLine = computed(() => cellMode.value === "all" && showFestival.value);
		/**
		* 图例是否显示。
		*
		* <p>角标与节日色阶的含义没有任何文字说明时只能靠猜（「班」到底是上班还是补班？
		* 红色是节日还是错误？）。图例很占一行，故只在对应内容可见时才出现 ——
		* 节日关掉就不显示节日色阶那一段，而不是留一行空图例。</p>
		*/
		const showLegend = computed(() => showFestival.value || showBadge.value);
		/** 头部 Sunny 按钮：切换节日行（与设置弹窗里的开关是同一份配置） */
		function toggleFestival() {
			emit("patch-config", { calendarConfig: { showFestival: !showFestival.value } });
		}
		/** 节日安排弹窗 */
		const holidayVisible = ref(false);
		/** 已从后台加载的年份，避免每月都重复请求 */
		const remoteLoadedYears = /* @__PURE__ */ new Set();
		/** 后台数据来源状态，供面板显示 */
		const remoteStatus = ref("unknown");
		const remoteCount = ref(0);
		/**
		* 拉取后台节假日并装入覆盖层。
		*
		* <p>失败<b>不报错</b>：日历有内置表 + 推算兜底，取不到就退回本地，
		* 让整页挂掉反而不划算。只有「后台有但今年没录数据」才提示，便于管理员发现漏录。</p>
		*
		* @param force 忽略「该年已加载」缓存，强制重新请求
		* @returns 是否成功拿到后台数据
		*/
		async function loadRemoteHolidays(force = false) {
			const year = now.value.getFullYear();
			if (!force && remoteLoadedYears.has(year)) return remoteStatus.value === "ok" || remoteStatus.value === "empty";
			remoteLoadedYears.add(year);
			const list = await fetchHolidays(year);
			if (list === null) {
				remoteStatus.value = "unavailable";
				return false;
			}
			remoteCount.value = setRemoteHolidays(year, list);
			remoteStatus.value = list.length ? "ok" : "empty";
			invalidateDayCache();
			midnightTick.value += 1;
			return true;
		}
		/** 面板里的手动刷新 */
		async function refreshRemoteHolidays() {
			if (await loadRemoteHolidays(true)) message.success(remoteCount.value ? `已更新，后台共 ${remoteCount.value} 条` : "后台今年暂无数据");
			else message.warning("后台节假日接口不可用，已使用内置数据");
		}
		const store = computed(() => getCalendarStore(userId.value));
		const dialogVisible = ref(false);
		const editing = ref(false);
		const form = ref({
			date: "",
			title: "",
			allDay: true,
			time: "09:00",
			category: "work",
			note: ""
		});
		/**
		* 「现在」。
		*
		* <p>做成响应式而不是模块加载时算一次的常量：后台标签页挂一整夜很常见，
		* 而「今天」的日期、星期、假期第几天全都依赖它。只在跨零点时替换引用，
		* 不需要刷新页面，也不会打断正在填写的日程弹窗。</p>
		*/
		const now = ref(/* @__PURE__ */ new Date());
		const todayKey = computed(() => formatKey(now.value));
		const todayLabel = computed(() => todayKey.value);
		const todayWeekday = computed(() => now.value.getDay());
		function pad(n) {
			return n < 10 ? `0${n}` : String(n);
		}
		function formatKey(d) {
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		}
		/**
		* 跨零点后强制重渲染的信号量。
		*
		* <p>{@link getDayInfo} 的结果是普通对象（含 {@code isToday} 等字段），本身不是响应式的。
		* 跨零点清了缓存之后若没有这个信号，格子里「今天」的高亮会停在昨天，
		* 因为没有任何响应式依赖发生变化。</p>
		*/
		const midnightTick = ref(0);
		/** 取格子的展示数据；顺带读一下 {@link midnightTick} 建立渲染依赖 */
		function infoOf(dayKey) {
			midnightTick.value;
			return getDayInfo(dayKey);
		}
		/** 格子左侧的公历日（去掉前导零，「1」比「01」省一格宽度） */
		function dayNumberOf(dayKey) {
			return String(Number(dayKey.slice(8, 10)));
		}
		/**
		* 格子里那一行优先显示什么。
		*
		* <p>顺序：法定节假日 / 除夕 / 后台下发 → 农历节日 → 公历节日 → 第 N 个星期 X → 节气，
		* 都取优先级最高的一个；一个都没有才退回农历日。春节当天不能显示「情人节」，
		* 平时也不该让「三八妇女节」把农历挤掉，所以法定与农历节日在前、节气最后。</p>
		*
		* <p>取的是<b>短名</b>：格子宽度由表格自动分配，长名会变省略号；
		* 全称在 {@link festivalTitleOf} 的悬浮提示与节日面板里。</p>
		*/
		function festivalTextOf(dayKey) {
			const info = infoOf(dayKey);
			if (!info) return "";
			const f = info.festivals[0];
			if (!f) return info.lunarText;
			return festivalDisplayText(f);
		}
		/** 悬浮提示：把当天所有节日的全称与农历一次说清 */
		function festivalTitleOf(dayKey) {
			const info = infoOf(dayKey);
			if (!info) return "";
			const parts = [lunarFullText(info.lunar)];
			if (info.festivals.length) parts.push(info.festivals.map((f) => f.name).join("、"));
			if (info.badge === "班") parts.push("调休上班");
			return parts.filter(Boolean).join(" · ");
		}
		/**
		* 农历独立行显示什么。
		*
		* <p>当天有节日时显示农历（如「端午」下一行「五月初五」）；
		* 没有节日时节日行已经在显示农历了，这里返回空串避免重复。</p>
		*/
		function lunarLineTextOf(dayKey) {
			const info = infoOf(dayKey);
			if (!info || !info.festivals.length) return "";
			return info.lunarText;
		}
		/** 节日名按级别着色：1 级主色、2 级次要、3 级弱化 */
		function festivalClassOf(dayKey) {
			const info = infoOf(dayKey);
			const f = info?.festivals[0];
			if (!f) return "is-lunar";
			if (info?.badge === "班") return "is-work";
			return `is-lv${f.level}`;
		}
		/** 整格的底色与描边：假期 / 调休 / 今天 / 周末 */
		function cellClassOf(dayKey) {
			const info = infoOf(dayKey);
			return {
				"is-today": !!info?.isToday,
				"is-weekend": !!info?.isWeekend,
				"is-holiday": !!info?.isRest && !info?.isMakeupWork,
				"is-workday": !!info?.isMakeupWork
			};
		}
		/**
		* 格子里最多放几条日程。
		*
		* <p>算法与说明都在 {@link calendarEventRows} 里，这里只做响应式转接，
		* 免得同一套行数预算在两处各写一遍后漂移。</p>
		*/
		const eventRows = computed(() => calendarEventRows(cellMode.value, showFestival.value));
		const todayInfo = computed(() => getDayInfo(todayKey.value));
		const todayText = computed(() => `${now.value.getFullYear()} 年 ${now.value.getMonth() + 1} 月 ${now.value.getDate()} 日 · 星期${"日一二三四五六"[todayWeekday.value]}`);
		const todayLunarText = computed(() => todayInfo.value?.lunarText ?? "");
		/** 干支纪年：第二行的兜底内容，比重复一遍农历日多给一个信息 */
		const todayGanZhi = computed(() => todayInfo.value?.lunar?.ganzhi ?? "");
		const todayFestival = computed(() => todayInfo.value?.festivals[0]?.name ?? "");
		const todayPeriod = computed(() => todayInfo.value?.period ?? null);
		/** 今天在整段假期里的第几天（1 起） */
		const todayPeriodDay = computed(() => {
			const p = todayPeriod.value;
			return p ? diffDays(p.start, todayKey.value) + 1 : 0;
		});
		/** 整段假期共几天 */
		const todayPeriodDays = computed(() => {
			const p = todayPeriod.value;
			return p ? diffDays(p.start, p.end) + 1 : 0;
		});
		/** 下一个法定假期还有几天；正在放假中则不提示 */
		const nextHolidayText = computed(() => {
			if (todayPeriod.value) return "";
			const next = findNextHoliday(todayKey.value, 400);
			if (!next) return "";
			const days = diffDays(todayKey.value, next.start);
			const when = days === 0 ? "今天开始" : `${days} 天后`;
			return `${next.name}：${next.start.slice(5).replace("-", " 月 ")} 日（${when}）`;
		});
		const grouped = computed(() => {
			const m = {};
			events.value.forEach((ev) => {
				if (!m[ev.date]) m[ev.date] = [];
				m[ev.date].push(ev);
			});
			return m;
		});
		const eventCount = computed(() => events.value.length);
		function load() {
			loading.value = true;
			errored.value = false;
			store.value.getAll().then((list) => {
				events.value = list.sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
			}).catch((err) => {
				errored.value = true;
				console.warn("[calendar-widget] load failed", err);
			}).finally(() => {
				loading.value = false;
			});
		}
		function openAdd(date) {
			editing.value = false;
			form.value = {
				date,
				title: "",
				allDay: true,
				time: "09:00",
				category: "work",
				note: ""
			};
			dialogVisible.value = true;
		}
		function openEdit(ev) {
			editing.value = true;
			form.value = {
				id: ev.id,
				date: ev.date,
				title: ev.title,
				allDay: ev.allDay,
				time: ev.time ?? "09:00",
				category: ev.category,
				note: ev.note ?? ""
			};
			dialogVisible.value = true;
		}
		async function save() {
			const title = form.value.title.trim();
			if (!title) {
				message.warning("请输入标题");
				return;
			}
			const now = Date.now();
			const ev = {
				id: form.value.id ?? `ev_${now}_${Math.random().toString(36).slice(2, 6)}`,
				date: form.value.date,
				title,
				allDay: form.value.allDay,
				time: form.value.allDay ? void 0 : form.value.time,
				category: form.value.category,
				note: form.value.note?.trim() || void 0,
				createdAt: editing.value ? events.value.find((e) => e.id === form.value.id)?.createdAt ?? now : now
			};
			try {
				await store.value.put(ev);
				dialogVisible.value = false;
				load();
				message.success("已保存");
			} catch (err) {
				console.error(err);
				message.error("保存失败");
			}
		}
		async function remove() {
			if (!form.value.id) return;
			try {
				await ElMessageBox.confirm("确认删除该日程？", "提示", { type: "warning" });
				await store.value.remove(form.value.id);
				dialogVisible.value = false;
				load();
				message.success("已删除");
			} catch (err) {
				if (err === "cancel") return;
				console.error(err);
				message.error("删除失败");
			}
		}
		/** 跨零点的巡检定时器 */
		let timer;
		/**
		* 每分钟比对一次日期，变了就清「今天」缓存并前移 {@link now}。
		*
		* <p>缓存里存了 {@code isToday}，不清理的话高亮会停在昨天；{@code now} 不更新的话
		* 「今日摘要」里的星期与假期天数也跟着错。</p>
		*/
		function onMidnight() {
			if (formatKey(/* @__PURE__ */ new Date()) === todayKey.value) return;
			invalidateDayCache();
			now.value = /* @__PURE__ */ new Date();
			midnightTick.value += 1;
			remoteLoadedYears.clear();
			loadRemoteHolidays();
		}
		onMounted(() => {
			load();
			loadRemoteHolidays();
			timer = window.setInterval(onMidnight, 6e4);
		});
		onBeforeUnmount(() => {
			if (timer) window.clearInterval(timer);
		});
		watch(userId, () => load());
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_calendar = resolveComponent("el-calendar");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_time_picker = resolveComponent("el-time-picker");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_form = resolveComponent("el-form");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
					createVNode(_component_el_icon, { class: "calendar-widget__title-icon" }, {
						default: withCtx(() => [createVNode(unref(calendar_default))]),
						_: 1
					}),
					createBaseVNode("span", null, toDisplayString(__props.widget.title), 1),
					eventCount.value ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(eventCount.value) + " 项", 1)) : createCommentVNode("", true)
				]), createBaseVNode("div", _hoisted_5, [
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass(["calendar-widget__action", { "is-on": showFestival.value }]),
						title: showFestival.value ? "隐藏节日与农历" : "显示节日与农历",
						"aria-label": showFestival.value ? "隐藏节日与农历" : "显示节日与农历",
						"aria-pressed": showFestival.value,
						onClick: toggleFestival
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(sunny_default))]),
						_: 1
					})], 10, _hoisted_6),
					createBaseVNode("button", {
						type: "button",
						class: "calendar-widget__action",
						title: "节日与放假安排",
						"aria-label": "节日与放假安排",
						onClick: _cache[0] || (_cache[0] = ($event) => holidayVisible.value = true)
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(present_default))]),
						_: 1
					})]),
					createBaseVNode("button", {
						type: "button",
						class: "calendar-widget__add",
						title: `添加于 ${todayLabel.value}`,
						"aria-label": `添加日程于 ${todayLabel.value}`,
						onClick: _cache[1] || (_cache[1] = ($event) => openAdd(todayKey.value))
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(plus_default))]),
						_: 1
					})], 8, _hoisted_7)
				])])) : createCommentVNode("", true),
				showFestival.value ? withDirectives((openBlock(), createElementBlock("div", _hoisted_8, [todayInfo.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
					createBaseVNode("div", _hoisted_9, [createBaseVNode("span", _hoisted_10, toDisplayString(todayText.value), 1), createBaseVNode("span", _hoisted_11, toDisplayString(todayLunarText.value), 1)]),
					createBaseVNode("div", _hoisted_12, [todayFestival.value ? (openBlock(), createElementBlock("span", _hoisted_13, toDisplayString(todayFestival.value), 1)) : (openBlock(), createElementBlock("span", _hoisted_14, toDisplayString(todayGanZhi.value), 1)), todayPeriod.value ? (openBlock(), createElementBlock("span", _hoisted_15, [
						createBaseVNode("span", _hoisted_16, [createTextVNode(toDisplayString(todayPeriod.value.name) + " ", 1), createBaseVNode("em", null, toDisplayString(todayPeriodDay.value) + "/" + toDisplayString(todayPeriodDays.value) + " 天", 1)]),
						createBaseVNode("span", _hoisted_17, [(openBlock(true), createElementBlock(Fragment, null, renderList(todayPeriodDays.value, (n) => {
							return openBlock(), createElementBlock("i", {
								key: n,
								class: normalizeClass(["calendar-widget__today-pip", { "is-done": n <= todayPeriodDay.value }])
							}, null, 2);
						}), 128))]),
						todayInfo.value.provisional ? (openBlock(), createElementBlock("em", _hoisted_18, "待公布")) : createCommentVNode("", true)
					])) : todayInfo.value.badge === "班" ? (openBlock(), createElementBlock("span", _hoisted_19, " 调休上班 ")) : todayInfo.value.isWeekend ? (openBlock(), createElementBlock("span", _hoisted_20, "周末休息")) : createCommentVNode("", true)]),
					nextHolidayText.value ? (openBlock(), createElementBlock("div", _hoisted_21, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(right_default))]),
						_: 1
					}), createBaseVNode("span", null, toDisplayString(nextHolidayText.value), 1)])) : createCommentVNode("", true)
				], 64)) : createCommentVNode("", true)])), [[_directive_loading, loading.value]]) : createCommentVNode("", true),
				showLegend.value ? (openBlock(), createElementBlock("div", _hoisted_22, [
					showBadge.value ? (openBlock(), createElementBlock("span", _hoisted_23, [..._cache[12] || (_cache[12] = [createBaseVNode("i", { class: "calendar-widget__legend-badge is-rest" }, "休", -1), createTextVNode("放假 ", -1)])])) : createCommentVNode("", true),
					showBadge.value ? (openBlock(), createElementBlock("span", _hoisted_24, [..._cache[13] || (_cache[13] = [createBaseVNode("i", { class: "calendar-widget__legend-badge is-work" }, "班", -1), createTextVNode("调休上班 ", -1)])])) : createCommentVNode("", true),
					showFestival.value ? (openBlock(), createElementBlock("span", _hoisted_25, [..._cache[14] || (_cache[14] = [createBaseVNode("i", { class: "calendar-widget__legend-bar is-lv1" }, null, -1), createTextVNode("法定节日 ", -1)])])) : createCommentVNode("", true),
					showFestival.value ? (openBlock(), createElementBlock("span", _hoisted_26, [..._cache[15] || (_cache[15] = [createBaseVNode("i", { class: "calendar-widget__legend-bar is-lv3" }, null, -1), createTextVNode("纪念日 / 节气 ", -1)])])) : createCommentVNode("", true),
					showFestival.value ? (openBlock(), createElementBlock("span", _hoisted_27, [..._cache[16] || (_cache[16] = [createBaseVNode("i", { class: "calendar-widget__legend-bar is-lunar" }, null, -1), createTextVNode("农历 ", -1)])])) : createCommentVNode("", true)
				])) : createCommentVNode("", true),
				withDirectives((openBlock(), createElementBlock("div", {
					class: normalizeClass(["calendar-widget__body", { "is-fixed-height": fixedCellHeight.value }]),
					style: normalizeStyle(cellHeightStyle.value)
				}, [createVNode(_component_el_calendar, {
					modelValue: calendarDate.value,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => calendarDate.value = $event)
				}, {
					"date-cell": withCtx(({ data }) => [createBaseVNode("div", { class: normalizeClass(["calendar-widget__cell", cellClassOf(data.day)]) }, [
						createBaseVNode("div", _hoisted_28, [createBaseVNode("span", _hoisted_29, toDisplayString(dayNumberOf(data.day)), 1), showBadge.value && infoOf(data.day)?.badge ? (openBlock(), createElementBlock("span", _hoisted_30, toDisplayString(infoOf(data.day)?.badge), 1)) : createCommentVNode("", true)]),
						showFestival.value && festivalTextOf(data.day) ? (openBlock(), createElementBlock("div", _hoisted_31, [createBaseVNode("span", {
							class: normalizeClass(["calendar-widget__cell-festival", festivalClassOf(data.day)]),
							title: festivalTitleOf(data.day)
						}, toDisplayString(festivalTextOf(data.day)), 11, _hoisted_32)])) : createCommentVNode("", true),
						showLunarLine.value && lunarLineTextOf(data.day) ? (openBlock(), createElementBlock("div", _hoisted_33, [createBaseVNode("span", _hoisted_34, toDisplayString(lunarLineTextOf(data.day)), 1)])) : createCommentVNode("", true),
						grouped.value[data.day]?.length && eventRows.value > 0 ? (openBlock(), createElementBlock("ul", _hoisted_35, [(openBlock(true), createElementBlock(Fragment, null, renderList(grouped.value[data.day].slice(0, eventRows.value), (ev, idx) => {
							return openBlock(), createElementBlock("li", {
								key: ev.id,
								class: "calendar-widget__cell-event",
								title: ev.title,
								onClick: withModifiers(($event) => openEdit(ev), ["stop"])
							}, [
								createBaseVNode("span", {
									class: "calendar-widget__cell-bullet",
									style: normalizeStyle({ background: unref(categoryColor)(ev.category) })
								}, null, 4),
								createBaseVNode("span", _hoisted_37, toDisplayString(ev.title), 1),
								fixedCellHeight.value && idx === eventRows.value - 1 && grouped.value[data.day].length > eventRows.value ? (openBlock(), createElementBlock("span", _hoisted_38, "+" + toDisplayString(grouped.value[data.day].length - eventRows.value), 1)) : createCommentVNode("", true)
							], 8, _hoisted_36);
						}), 128)), !fixedCellHeight.value && grouped.value[data.day].length > eventRows.value ? (openBlock(), createElementBlock("li", _hoisted_39, " +" + toDisplayString(grouped.value[data.day].length - eventRows.value) + " 更多 ", 1)) : createCommentVNode("", true)])) : createCommentVNode("", true)
					], 2)]),
					_: 1
				}, 8, ["modelValue"])], 6)), [[_directive_loading, loading.value]]),
				createVNode(unref(CalendarHolidayDialog), {
					modelValue: holidayVisible.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => holidayVisible.value = $event),
					"remote-status": remoteStatus.value,
					"remote-count": remoteCount.value,
					onRefresh: refreshRemoteHolidays
				}, null, 8, [
					"modelValue",
					"remote-status",
					"remote-count"
				]),
				createVNode(unref(ReDialog), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => dialogVisible.value = $event),
					title: editing.value ? "编辑日程" : "添加日程",
					width: 420,
					"confirm-text": "保存",
					"cancel-text": "取消",
					"destroy-on-close": "",
					"footer-hidden": false,
					onConfirm: save,
					onCancel: _cache[11] || (_cache[11] = ($event) => dialogVisible.value = false)
				}, {
					content: withCtx(() => [editing.value ? (openBlock(), createElementBlock("div", _hoisted_40, [createVNode(unref(ReButton), {
						type: "danger",
						plain: "",
						onClick: remove
					}, {
						default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode("删除", -1)])]),
						_: 1
					})])) : createCommentVNode("", true), createVNode(_component_el_form, {
						model: form.value,
						"label-width": "80px",
						size: "default"
					}, {
						default: withCtx(() => [
							createVNode(_component_el_form_item, { label: "日期" }, {
								default: withCtx(() => [createVNode(unref(ReDatePicker), {
									modelValue: form.value.date,
									"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.value.date = $event),
									type: "date",
									"value-format": "YYYY-MM-DD",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, {
								label: "标题",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReInput), {
									modelValue: form.value.title,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.title = $event),
									maxlength: "40",
									placeholder: "日程标题"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "全天" }, {
								default: withCtx(() => [createVNode(unref(ReSwitch), {
									layout: "square",
									modelValue: form.value.allDay,
									"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.value.allDay = $event)
								}, {
									default: withCtx(() => [createVNode(_component_el_icon, null, {
										default: withCtx(() => [createVNode(unref(sunny_default))]),
										_: 1
									})]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							}),
							!form.value.allDay ? (openBlock(), createBlock(_component_el_form_item, {
								key: 0,
								label: "时间"
							}, {
								default: withCtx(() => [createVNode(_component_el_time_picker, {
									modelValue: form.value.time,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.value.time = $event),
									placeholder: "开始时间",
									format: "HH:mm",
									"value-format": "HH:mm",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							})) : createCommentVNode("", true),
							createVNode(_component_el_form_item, { label: "分类" }, {
								default: withCtx(() => [createVNode(_component_el_select, {
									modelValue: form.value.category,
									"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.value.category = $event),
									placeholder: "选择分类",
									style: { "width": "100%" }
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(CATEGORY_OPTIONS), (opt) => {
										return openBlock(), createBlock(_component_el_option, {
											key: opt.value,
											label: opt.label,
											value: opt.value
										}, {
											default: withCtx(() => [createBaseVNode("span", {
												class: "calendar-widget__category-dot",
												style: normalizeStyle({ background: opt.color })
											}, null, 4), createBaseVNode("span", null, toDisplayString(opt.label), 1)]),
											_: 2
										}, 1032, ["label", "value"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "备注" }, {
								default: withCtx(() => [createVNode(unref(ReInput), {
									modelValue: form.value.note,
									"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.value.note = $event),
									type: "textarea",
									rows: 2,
									maxlength: "120",
									placeholder: "可选"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["model"])]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-d0607d30"]]);
//#endregion
export { CalendarWidget_default as default };
