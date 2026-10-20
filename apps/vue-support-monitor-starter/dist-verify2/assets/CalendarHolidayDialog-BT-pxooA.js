const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReDialog-Br5G1CNa.js","assets/ReDialog-DZGeR3lw.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/theme-B9R3AFqb.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/src-DzQcKxHP.js","assets/ReEmpty-LmtIku4U.js","assets/ReEmpty-DzxmsI1k.js"])))=>i.map(i=>d[i]);
import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, O as defineAsyncComponent, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { Nt as refresh_default, a as arrow_right_default, at as info_filled_default, i as arrow_left_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { _ as toDateKey, a as getRemoteHolidays, c as getStatutoryPeriods, d as getYearSolarTerms, g as fromDateKey, h as diffDays, l as isStatutoryPublished, m as addDateKeyDays, n as getDayInfo, p as WEEKDAY_NAMES, r as getUpcomingItems, u as SOLAR_TERM_NAMES } from "./calendar-D4HVZKIc.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/CalendarHolidayDialog.vue?vue&type=script&setup=true&name=CalendarHolidayDialog&lang.ts
var _hoisted_1 = { class: "holiday-panel" };
var _hoisted_2 = { class: "holiday-panel__banner-main" };
var _hoisted_3 = { class: "holiday-panel__banner-name" };
var _hoisted_4 = { class: "holiday-panel__banner-tag" };
var _hoisted_5 = { class: "holiday-panel__banner-sub" };
var _hoisted_6 = {
	key: 0,
	class: "holiday-panel__banner-hint"
};
var _hoisted_7 = {
	key: 0,
	class: "holiday-panel__list"
};
var _hoisted_8 = { class: "holiday-panel__item-date" };
var _hoisted_9 = { class: "holiday-panel__item-md" };
var _hoisted_10 = { class: "holiday-panel__item-week" };
var _hoisted_11 = { class: "holiday-panel__item-body" };
var _hoisted_12 = { class: "holiday-panel__item-name" };
var _hoisted_13 = {
	key: 0,
	class: "holiday-panel__item-span"
};
var _hoisted_14 = {
	key: 1,
	class: "holiday-panel__item-prov"
};
var _hoisted_15 = { class: "holiday-panel__item-lunar" };
var _hoisted_16 = { class: "holiday-panel__item-when" };
var _hoisted_17 = {
	key: 0,
	class: "is-today-text"
};
var _hoisted_18 = {
	key: 1,
	class: "is-today-text"
};
var _hoisted_19 = { key: 2 };
var _hoisted_20 = { class: "holiday-panel__year-bar" };
var _hoisted_21 = { class: "holiday-panel__year-right" };
var _hoisted_22 = {
	key: 0,
	class: "holiday-panel__notice"
};
var _hoisted_23 = {
	key: 1,
	class: "holiday-panel__notice"
};
var _hoisted_24 = {
	key: 2,
	class: "holiday-panel__notice"
};
var _hoisted_25 = { class: "holiday-panel__list" };
var _hoisted_26 = { class: "holiday-panel__period-head" };
var _hoisted_27 = { class: "holiday-panel__period-name" };
var _hoisted_28 = { class: "holiday-panel__period-days" };
var _hoisted_29 = { class: "holiday-panel__period-body" };
var _hoisted_30 = { class: "holiday-panel__period-row" };
var _hoisted_31 = { class: "holiday-panel__period-value" };
var _hoisted_32 = {
	key: 0,
	class: "holiday-panel__period-row"
};
var _hoisted_33 = { class: "holiday-panel__period-value is-work" };
var _hoisted_34 = {
	key: 3,
	class: "holiday-panel__remote"
};
var _hoisted_35 = { class: "holiday-panel__list" };
var _hoisted_36 = { class: "holiday-panel__period-head" };
var _hoisted_37 = { class: "holiday-panel__period-name" };
var _hoisted_38 = { class: "holiday-panel__period-body" };
var _hoisted_39 = { class: "holiday-panel__period-row" };
var _hoisted_40 = { class: "holiday-panel__term-grid" };
var _hoisted_41 = { class: "holiday-panel__term-name" };
var _hoisted_42 = { class: "holiday-panel__term-date" };
var _hoisted_43 = { class: "holiday-panel__term-lunar" };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/CalendarHolidayDialog.vue
var CalendarHolidayDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "CalendarHolidayDialog",
	props: {
		remoteStatus: {},
		remoteCount: {}
	},
	emits: ["refresh"],
	setup(__props, { emit: __emit }) {
		/**
		* 节日与放假安排面板
		*
		* 三个页签对应三类信息：
		* <ol>
		*   <li>近期：未来一年内值得记住的节日与假期（只收录 1—2 级，避免刷屏）</li>
		*   <li>全年放假：国务院办公厅公布的放假区间与补班日</li>
		*   <li>二十四节气：按太阳黄经推算的节气日期</li>
		* </ol>
		*
		* 数据全部来自 {@link ./index} 聚合层，本组件不重复实现任何历法换算 ——
		* 与日历格子共用同一套换算，两处才不会显示不一致的内容。
		*/
		const ReDialog = defineAsyncComponent(() => __vitePreload(() => import("./ReDialog-Br5G1CNa.js").then((m) => m.default), __vite__mapDeps([0,1,2,3,4,5,6])));
		const ReEmpty = defineAsyncComponent(() => __vitePreload(() => import("./ReEmpty-LmtIku4U.js").then((m) => m.default), __vite__mapDeps([7,8,5,2,3])));
		/** 后台数据来源状态（由父组件填入） */
		const props = __props;
		const emit = __emit;
		/** 是否打开（父组件用 v-model 绑定） */
		const open = ref(false);
		const visible = computed({
			get: () => open.value,
			set: (v) => {
				open.value = v;
			}
		});
		/** 刷新按钮的 loading */
		const refreshing = ref(false);
		const remoteStatus = computed(() => props.remoteStatus ?? "unknown");
		const remoteCount = computed(() => props.remoteCount ?? 0);
		/** 「数据来源」标签文案与配色 */
		const sourceText = computed(() => {
			switch (remoteStatus.value) {
				case "ok": return `后台 ${remoteCount.value} 条`;
				case "empty": return "后台无数据";
				case "unavailable": return "内置数据";
				default: return yearPublished.value ? "内置数据" : "推算数据";
			}
		});
		const sourceTagType = computed(() => {
			if (remoteStatus.value === "ok") return "success";
			if (remoteStatus.value === "unknown") return "info";
			return "warning";
		});
		const tab = ref("upcoming");
		const todayKey = toDateKey(/* @__PURE__ */ new Date());
		/** 当前是否正在假期中 */
		const current = computed(() => getDayInfo(todayKey).period);
		/** 未来 400 天内的节日与假期 */
		const upcoming = computed(() => getUpcomingItems(todayKey, 400));
		/** 年份翻页偏移（以今年为 0） */
		const yearOffset = ref(0);
		const year = computed(() => (/* @__PURE__ */ new Date()).getFullYear() + yearOffset.value);
		const yearPeriods = computed(() => getStatutoryPeriods(year.value));
		const yearPublished = computed(() => isStatutoryPublished(year.value));
		/**
		* 后台下发的记录按「同名 + 连续 + 同休息属性」归并成区间。
		*
		* <p>后台按<b>日期逐行</b>存储（7 天假期 = 7 行），不归并的话列表里会看到
		* 7 条一模一样的「国庆节」。</p>
		*/
		const remoteGroups = computed(() => {
			const rows = getRemoteHolidays(year.value);
			const groups = [];
			for (const row of rows) {
				const last = groups[groups.length - 1];
				if (last && last.name === row.name && last.isHoliday === row.isHoliday && last.end === addDateKeyDays(row.key, -1)) {
					last.end = row.key;
					last.days += 1;
					continue;
				}
				groups.push({
					name: row.name,
					isHoliday: row.isHoliday,
					start: row.key,
					end: row.key,
					days: 1
				});
			}
			return groups;
		});
		/** 二十四节气（附农历对照与「已过」弱化） */
		const terms = computed(() => getYearSolarTerms(year.value).map((date, i) => {
			const info = date ? getDayInfo(date) : null;
			return {
				name: SOLAR_TERM_NAMES[i],
				date,
				lunar: info?.lunarText ?? "",
				past: date !== "" && date < todayKey
			};
		}));
		/**
		* 假期总天数。
		*
		* @param p 假期区间
		* @returns 含首含尾的天数
		*/
		function periodDays(p) {
			return diffDays(p.start, p.end) + 1;
		}
		/**
		* 假期区间的紧凑中文表示。
		*
		* @param p 假期区间
		* @returns 如「10 月 1 日 — 10 月 7 日」；跨月时补上月份
		*/
		function formatRange(p) {
			const s = p.start;
			const e = p.end;
			const head = mdOf(s);
			if (s.slice(5, 7) === e.slice(5, 7)) return `${head} — ${Number(e.slice(8, 10))} 日`;
			return `${head} — ${mdOf(e)}`;
		}
		/**
		* 日期键转「10 月 10 日」。
		*
		* @param key {@code YYYY-MM-DD}
		* @returns 中文月日
		*/
		function mdOf(key) {
			return `${Number(key.slice(5, 7))} 月 ${Number(key.slice(8, 10))} 日`;
		}
		/**
		* 日期键的中文星期。
		*
		* @param key {@code YYYY-MM-DD}
		* @returns 如「六」
		*/
		function weekdayName(key) {
			return WEEKDAY_NAMES[fromDateKey(key).getDay()];
		}
		/**
		* 该日的农历短文本。
		*
		* @param key {@code YYYY-MM-DD}
		* @returns 如「八月廿三」；农历数据不可用时为空串
		*/
		function lunarOf(key) {
			return getDayInfo(key).lunarText;
		}
		watch(open, (v) => {
			if (v) yearOffset.value = 0;
		});
		/**
		* 触发后台重新下发。
		*
		* <p>loading 状态由父组件的请求时长决定会很难看，这里只包一层最短反馈：
		* 请求未在 400ms 内返回就显示 loading，避免快接口闪一下按钮。</p>
		*/
		async function onRefresh() {
			refreshing.value = true;
			emit("refresh");
			window.setTimeout(() => {
				refreshing.value = false;
			}, 400);
		}
		return (_ctx, _cache) => {
			const _component_el_tab_pane = resolveComponent("el-tab-pane");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_button_group = resolveComponent("el-button-group");
			const _component_el_tag = resolveComponent("el-tag");
			const _component_el_tabs = resolveComponent("el-tabs");
			return openBlock(), createBlock(unref(ReDialog), {
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => visible.value = $event),
				title: "节日与放假安排",
				width: "580",
				top: "8vh",
				"destroy-on-close": ""
			}, {
				content: withCtx(() => [createBaseVNode("div", _hoisted_1, [current.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(["holiday-panel__banner", { "is-provisional": current.value.provisional }])
				}, [
					createBaseVNode("div", _hoisted_2, [createBaseVNode("span", _hoisted_3, toDisplayString(current.value.name), 1), createBaseVNode("span", _hoisted_4, toDisplayString(current.value.provisional ? "按放假办法推算" : "官方公布"), 1)]),
					createBaseVNode("div", _hoisted_5, toDisplayString(formatRange(current.value)) + " · 共 " + toDisplayString(periodDays(current.value)) + " 天 ", 1),
					current.value.provisional ? (openBlock(), createElementBlock("div", _hoisted_6, " 调休安排通常于当年 11 月由国务院办公厅公布，届时会自动显示补班日。 ")) : createCommentVNode("", true)
				], 2)) : createCommentVNode("", true), createVNode(_component_el_tabs, {
					modelValue: tab.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => tab.value = $event),
					class: "holiday-panel__tabs"
				}, {
					default: withCtx(() => [
						createVNode(_component_el_tab_pane, {
							label: `近期（${upcoming.value.length}）`,
							name: "upcoming"
						}, {
							default: withCtx(() => [upcoming.value.length ? (openBlock(), createElementBlock("ul", _hoisted_7, [(openBlock(true), createElementBlock(Fragment, null, renderList(upcoming.value, (it) => {
								return openBlock(), createElementBlock("li", {
									key: it.key + it.name,
									class: normalizeClass(["holiday-panel__item", {
										"is-work": it.kind === "makeup",
										"is-plain": !it.isRest && it.kind !== "makeup",
										"is-today": it.ongoing || it.days === 0
									}])
								}, [
									createBaseVNode("div", _hoisted_8, [createBaseVNode("span", _hoisted_9, toDisplayString(mdOf(it.key)), 1), createBaseVNode("span", _hoisted_10, "周" + toDisplayString(weekdayName(it.key)), 1)]),
									createBaseVNode("div", _hoisted_11, [createBaseVNode("span", _hoisted_12, [
										createTextVNode(toDisplayString(it.name) + " ", 1),
										it.spanDays > 1 ? (openBlock(), createElementBlock("em", _hoisted_13, "连休 " + toDisplayString(it.spanDays) + " 天", 1)) : createCommentVNode("", true),
										it.provisional ? (openBlock(), createElementBlock("em", _hoisted_14, "待公布")) : createCommentVNode("", true)
									]), createBaseVNode("span", _hoisted_15, toDisplayString(lunarOf(it.key)), 1)]),
									createBaseVNode("div", _hoisted_16, [it.ongoing ? (openBlock(), createElementBlock("span", _hoisted_17, "进行中")) : it.days === 0 ? (openBlock(), createElementBlock("span", _hoisted_18, "今天")) : (openBlock(), createElementBlock("span", _hoisted_19, toDisplayString(it.days) + " 天后", 1))])
								], 2);
							}), 128))])) : (openBlock(), createBlock(unref(ReEmpty), {
								key: 1,
								description: "未来一年没有可展示的节日"
							}))]),
							_: 1
						}, 8, ["label"]),
						createVNode(_component_el_tab_pane, {
							label: `${year.value} 年放假`,
							name: "year"
						}, {
							default: withCtx(() => [
								createBaseVNode("div", _hoisted_20, [createVNode(_component_el_button_group, null, {
									default: withCtx(() => [
										createVNode(_component_el_button, {
											size: "small",
											disabled: yearOffset.value <= -3,
											onClick: _cache[0] || (_cache[0] = ($event) => yearOffset.value -= 1)
										}, {
											default: withCtx(() => [createVNode(_component_el_icon, null, {
												default: withCtx(() => [createVNode(unref(arrow_left_default))]),
												_: 1
											})]),
											_: 1
										}, 8, ["disabled"]),
										createVNode(_component_el_button, {
											size: "small",
											onClick: _cache[1] || (_cache[1] = ($event) => yearOffset.value = 0)
										}, {
											default: withCtx(() => [createTextVNode(toDisplayString(year.value) + " 年", 1)]),
											_: 1
										}),
										createVNode(_component_el_button, {
											size: "small",
											disabled: yearOffset.value >= 3,
											onClick: _cache[2] || (_cache[2] = ($event) => yearOffset.value += 1)
										}, {
											default: withCtx(() => [createVNode(_component_el_icon, null, {
												default: withCtx(() => [createVNode(unref(arrow_right_default))]),
												_: 1
											})]),
											_: 1
										}, 8, ["disabled"])
									]),
									_: 1
								}), createBaseVNode("div", _hoisted_21, [createVNode(_component_el_tag, {
									size: "small",
									type: sourceTagType.value
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(sourceText.value), 1)]),
									_: 1
								}, 8, ["type"]), createVNode(_component_el_button, {
									size: "small",
									loading: refreshing.value,
									onClick: onRefresh
								}, {
									default: withCtx(() => [createVNode(_component_el_icon, null, {
										default: withCtx(() => [createVNode(unref(refresh_default))]),
										_: 1
									})]),
									_: 1
								}, 8, ["loading"])])]),
								remoteStatus.value === "unavailable" ? (openBlock(), createElementBlock("div", _hoisted_22, [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(info_filled_default))]),
									_: 1
								}), _cache[5] || (_cache[5] = createBaseVNode("span", null, "后台节假日接口不可用，以下为日历内置数据（含按《放假办法》推算的部分）。", -1))])) : remoteStatus.value === "empty" ? (openBlock(), createElementBlock("div", _hoisted_23, [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(info_filled_default))]),
									_: 1
								}), createBaseVNode("span", null, "后台已连通，但 " + toDisplayString(year.value) + " 年尚无节假日数据，以下为日历内置数据。", 1)])) : !yearPublished.value ? (openBlock(), createElementBlock("div", _hoisted_24, [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(info_filled_default))]),
									_: 1
								}), _cache[6] || (_cache[6] = createBaseVNode("span", null, [
									createTextVNode(" 以下仅按《全国年节及纪念日放假办法》列出法定假日当天，"),
									createBaseVNode("b", null, "不含补班日"),
									createTextVNode(" —— 调休取决于当年双休排布，无据可推，故不臆造。 ")
								], -1))])) : createCommentVNode("", true),
								createBaseVNode("ul", _hoisted_25, [(openBlock(true), createElementBlock(Fragment, null, renderList(yearPeriods.value, (p) => {
									return openBlock(), createElementBlock("li", {
										key: p.name,
										class: "holiday-panel__period"
									}, [createBaseVNode("div", _hoisted_26, [createBaseVNode("span", _hoisted_27, toDisplayString(p.name), 1), createBaseVNode("span", _hoisted_28, toDisplayString(periodDays(p)) + " 天", 1)]), createBaseVNode("div", _hoisted_29, [createBaseVNode("div", _hoisted_30, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "holiday-panel__period-label" }, "放假", -1)), createBaseVNode("span", _hoisted_31, toDisplayString(formatRange(p)), 1)]), p.workdays.length ? (openBlock(), createElementBlock("div", _hoisted_32, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "holiday-panel__period-label is-work" }, "补班", -1)), createBaseVNode("span", _hoisted_33, toDisplayString(p.workdays.map(mdOf).join("、")), 1)])) : createCommentVNode("", true)])]);
								}), 128))]),
								remoteGroups.value.length ? (openBlock(), createElementBlock("div", _hoisted_34, [_cache[9] || (_cache[9] = createBaseVNode("div", { class: "holiday-panel__remote-title" }, "后台自定义安排", -1)), createBaseVNode("ul", _hoisted_35, [(openBlock(true), createElementBlock(Fragment, null, renderList(remoteGroups.value, (g) => {
									return openBlock(), createElementBlock("li", {
										key: g.name + g.start,
										class: "holiday-panel__period"
									}, [createBaseVNode("div", _hoisted_36, [createBaseVNode("span", _hoisted_37, toDisplayString(g.name), 1), createBaseVNode("span", { class: normalizeClass(["holiday-panel__period-days", { "is-work": !g.isHoliday }]) }, toDisplayString(g.isHoliday ? `${g.days} 天假期` : "调休上班"), 3)]), createBaseVNode("div", _hoisted_38, [createBaseVNode("div", _hoisted_39, [createBaseVNode("span", { class: normalizeClass(["holiday-panel__period-label", { "is-work": !g.isHoliday }]) }, toDisplayString(g.isHoliday ? "放假" : "补班"), 3), createBaseVNode("span", { class: normalizeClass(["holiday-panel__period-value", { "is-work": !g.isHoliday }]) }, toDisplayString(g.start) + " ~ " + toDisplayString(g.end), 3)])])]);
								}), 128))])])) : createCommentVNode("", true)
							]),
							_: 1
						}, 8, ["label"]),
						createVNode(_component_el_tab_pane, {
							label: "二十四节气",
							name: "terms"
						}, {
							default: withCtx(() => [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "holiday-panel__term-note" }, " 节气按太阳视黄经每 15° 划分，与农历月份无关，日期以北京时间为准。 ", -1)), createBaseVNode("div", _hoisted_40, [(openBlock(true), createElementBlock(Fragment, null, renderList(terms.value, (t) => {
								return openBlock(), createElementBlock("div", {
									key: t.name,
									class: normalizeClass(["holiday-panel__term", { "is-past": t.past }])
								}, [
									createBaseVNode("span", _hoisted_41, toDisplayString(t.name), 1),
									createBaseVNode("span", _hoisted_42, toDisplayString(t.date.slice(5).replace("-", "/")), 1),
									createBaseVNode("span", _hoisted_43, toDisplayString(t.lunar), 1)
								], 2);
							}), 128))])]),
							_: 1
						})
					]),
					_: 1
				}, 8, ["modelValue"])])]),
				_: 1
			}, 8, ["modelValue"]);
		};
	}
}), [["__scopeId", "data-v-ce88b80f"]]);
//#endregion
export { CalendarHolidayDialog_default as default };
