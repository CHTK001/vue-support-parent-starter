import { $ as mergeModels, $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ft as onUnmounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { wt as msgError } from "./src-CEonioA3.js";
import { t as ElPopover } from "./popover-BedfGaMS.js";
import "./src-DDwlSqPX.js";
import { t as CronExpression } from "./CronExpression-B7SGssoE.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
//#region ../../packages/ui/src/components/ReCron/weekNames.ts
/**
* 周字段的中文名，供 ReCron 与其日历面板共用，避免两处各写一份导致口径漂移。
*
* 数值语义与后端 CronExpression 一致：0=周日 … 6=周六。
*/
var WEEK_NAMES = [
	"周日",
	"周一",
	"周二",
	"周三",
	"周四",
	"周五",
	"周六"
];
//#endregion
//#region ../../packages/ui/src/components/ReCron/ReCronCalendarPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "re-cron-cal" };
var _hoisted_2$1 = { class: "re-cron-cal__cadences" };
var _hoisted_3$1 = ["aria-pressed", "onClick"];
var _hoisted_4$1 = ["aria-pressed"];
var _hoisted_5$1 = { class: "re-cron-cal__body" };
var _hoisted_6$1 = { class: "re-cron-cal__calendar" };
var _hoisted_7$1 = { class: "re-cron-cal__cal-head" };
var _hoisted_8$1 = { class: "re-cron-cal__cal-title" };
var _hoisted_9$1 = {
	class: "re-cron-cal__week",
	role: "row"
};
var _hoisted_10$1 = {
	class: "re-cron-cal__grid",
	role: "grid"
};
var _hoisted_11$1 = [
	"disabled",
	"aria-pressed",
	"aria-label",
	"onClick"
];
var _hoisted_12$1 = { class: "re-cron-cal__day-num" };
var _hoisted_13$1 = {
	key: 0,
	class: "re-cron-cal__day-dot",
	"aria-hidden": "true"
};
var _hoisted_14$1 = { class: "re-cron-cal__side" };
var _hoisted_15$1 = {
	class: "re-cron-cal__clock",
	"aria-hidden": "true"
};
var _hoisted_16$1 = { class: "re-cron-cal__time" };
var _hoisted_17$1 = { class: "re-cron-cal__hint" };
//#endregion
//#region ../../packages/ui/src/components/ReCron/ReCronCalendarPanel.vue
var ReCronCalendarPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReCronCalendarPanel",
	props: { expression: {} },
	emits: ["apply"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 周期档位：与参考 UI 的四个胶囊一一对应 */
		const CADENCES = [
			{
				key: "daily",
				label: "每天",
				days: []
			},
			{
				key: "weekday",
				label: "工作日",
				days: [
					1,
					2,
					3,
					4,
					5
				]
			},
			{
				key: "weekend",
				label: "周末",
				days: [0, 6]
			}
		];
		const cadence = ref("daily");
		const hour = ref(9);
		const minute = ref(0);
		const second = ref(0);
		/** 自定义模式下被选中的日期（本月内，存 1-31） */
		const pickedDays = ref([]);
		/** 当前展示的月份，存该月 1 号的 Date */
		const cursor = ref(new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1));
		/** 月历 6 行 × 7 列，WEEK_NAMES 顺序即 cron 的 0=周日 */
		const WEEK_LABELS = [
			"日",
			"一",
			"二",
			"三",
			"四",
			"五",
			"六"
		];
		const cells = computed(() => {
			const y = cursor.value.getFullYear();
			const m = cursor.value.getMonth();
			const offset = new Date(y, m, 1).getDay();
			const days = new Date(y, m + 1, 0).getDate();
			const out = [];
			for (let i = 0; i < 42; i++) {
				const day = i - offset + 1;
				const inMonth = day >= 1 && day <= days;
				const d = new Date(y, m, day);
				out.push({
					inMonth,
					date: inMonth ? day : day < 1 ? new Date(y, m - 1, 0).getDate() + day : day - days,
					weekday: d.getDay(),
					key: `${y}-${m}-${i}`
				});
			}
			return out;
		});
		const monthLabel = computed(() => `${cursor.value.getFullYear()} 年 ${cursor.value.getMonth() + 1} 月`);
		/** 该日期是否被选中：自定义看 pickedDays，其余档位按 cadence 的星期集合 */
		function isPicked(cell) {
			if (!cell.inMonth) return false;
			return cadence.value === "custom" ? pickedDays.value.includes(cell.date) : (CADENCES.find((c) => c.key === cadence.value)?.days ?? []).includes(cell.weekday);
		}
		function isToday(cell) {
			const now = /* @__PURE__ */ new Date();
			return cell.inMonth && cell.date === now.getDate() && cursor.value.getMonth() === now.getMonth() && cursor.value.getFullYear() === now.getFullYear();
		}
		function shiftMonth(delta) {
			cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1);
		}
		function toggleDay(cell) {
			if (!cell.inMonth) return;
			cadence.value = "custom";
			pickedDays.value = pickedDays.value.includes(cell.date) ? pickedDays.value.filter((d) => d !== cell.date) : [...pickedDays.value, cell.date].sort((a, b) => a - b);
		}
		/**
		* 当前档位拼出的 6 字段 cron。
		*
		* 日与周不能同时受限（服务端语义是「一侧为空则整体放开」），所以：
		*  - 按星期跑的档位：日位写 `?`、周位写星期集合；
		*  - 每天：日周都写 `*`；
		*  - 自定义选日期：日位写逗号分隔的日期、周位写 `?`。
		*/
		/**
		* 星期集合 → cron 的周字段写法。
		*
		* <p>连续区间写成 {@code 1-5}（可读性），离散写成 {@code 0,6}。
		* 服务端与 {@link CronExpression} 两种都解析。</p>
		*/
		function weekTokenOf(days) {
			if (!days.length) return "*";
			if (days.length === 2 && days[1] - days[0] === 1) return `${days[0]}-${days[1]}`;
			return [...days].sort((a, b) => a - b).join(",");
		}
		/**
		* 当前档位的「日 / 月 / 周」三段。
		*
		* <p>日与周不能同时受限（服务端语义是「一侧为空则整体放开」），所以：
		* 按星期跑 → 日位 {@code ?}；按日期跑 → **日期落日位**、周位 {@code ?}；
		* 每天 → 两侧都是 {@code *}。</p>
		*
		* <p>「日期落哪一段」必须写死且与 {@link initFromExpression} 对称：把 {@code 1,15,28}
		* 塞进周位会变成「每周 1/15/28 号」，语义全错且引擎不报错。</p>
		*/
		function dayMonthWeekOf(key) {
			if (key === "daily") return [
				"*",
				"*",
				"*"
			];
			if (key === "custom") return pickedDays.value.length ? [
				pickedDays.value.join(","),
				"*",
				"?"
			] : [
				"",
				"*",
				"?"
			];
			const days = CADENCES.find((c) => c.key === key)?.days ?? [];
			return days.length ? [
				"?",
				"*",
				weekTokenOf(days)
			] : [
				"?",
				"*",
				""
			];
		}
		const expression = computed(() => {
			const head = `${second.value} ${minute.value} ${hour.value}`;
			const [day, month, week] = dayMonthWeekOf(cadence.value);
			if (!day && week === "?") return "";
			if (!week && !day) return "";
			return `${head} ${day || "?"} ${month} ${week || "?"}`;
		});
		const timeLabel = computed(() => `${String(hour.value).padStart(2, "0")}:${String(minute.value).padStart(2, "0")}`);
		/** 档位下的一句人话，替代字段模式那串 token */
		const cadenceLabel = computed(() => {
			if (cadence.value === "custom") {
				if (!pickedDays.value.length) return "未选择日期";
				return `每月 ${pickedDays.value.join("、")} 日 ${timeLabel.value}`;
			}
			if (cadence.value === "daily") return `每天 ${timeLabel.value}`;
			return `${CADENCES.find((c) => c.key === cadence.value)?.label ?? ""} ${timeLabel.value}`;
		});
		/**
		* 周字段归一化，让 `1-5` / `1,2,3,4,5` / `?` / `*` 落到可比较的同一形式。
		*
		* <p>不归一的后果：面板自己拼出的是 `1-5`，用户从别处粘进来的是 `1,2,3,4,5`，
		* 两者语义相同但字符串不等，反向初始化就会把「工作日」误判成自定义。</p>
		*/
		function normalizeWeek(token) {
			const t = String(token ?? "").trim();
			if (t === "*" || t === "?") return [];
			const out = [];
			for (const part of t.split(",")) {
				const seg = part.trim();
				if (!seg) continue;
				const range = /^(\d+)-(\d+)$/.exec(seg);
				if (range) for (let n = Number(range[1]); n <= Number(range[2]); n++) out.push(n);
				else if (/^\d+$/.test(seg)) out.push(Number(seg));
				else return null;
			}
			return [...new Set(out)].sort((a, b) => a - b);
		}
		function sameDays(a, b) {
			return a.length === b.length && a.every((v, i) => v === b[i]);
		}
		/**
		* 从现有表达式反向初始化。
		*
		* <p>先按「日位是日期还是占位」分流，再让 {@link expression} 自己回算一次做校验 ——
		* 反向识别与正向拼串共用 {@link dayMonthWeekOf}，这样两边不会各写一套判据而漂移。</p>
		*/
		function initFromExpression(text) {
			const parts = String(text ?? "").trim().split(/\s+/).filter(Boolean);
			if (parts.length !== 6) return;
			const [s, mi, h, day, , week] = parts;
			if (/^\d+$/.test(s)) second.value = Number(s);
			if (/^\d+$/.test(mi)) minute.value = Number(mi);
			if (/^\d+$/.test(h)) hour.value = Number(h);
			if (/^\d/.test(day)) {
				const days = day.split(",").map((v) => Number(v.trim())).filter((v) => Number.isInteger(v) && v >= 1 && v <= 31);
				if (days.length) {
					cadence.value = "custom";
					pickedDays.value = days.sort((a, b) => a - b);
					return;
				}
			}
			const weeks = normalizeWeek(week);
			if (weeks) {
				const hit = CADENCES.find((c) => sameDays(weeks, [...c.days].sort((a, b) => a - b)));
				if (hit) {
					cadence.value = hit.key;
					pickedDays.value = [];
					return;
				}
			}
			cadence.value = "custom";
		}
		watch(() => props.expression ?? "", (v) => initFromExpression(v), { immediate: true });
		function pickCadence(key) {
			cadence.value = key;
			if (key === "custom" && !pickedDays.value.length) pickedDays.value = [(/* @__PURE__ */ new Date()).getDate()];
		}
		/**
		* 把当前表达式抛给 ReCron。
		*
		* <p>由弹层**底栏**的按钮调用，不在本面板模板里 —— 见 {@link ReCron.vue}：
		* 它原来挤在「执行时间」行右侧，既不是配置项又不是收口动作，
		* 位置含糊；挪到与「清空/取消/保存」同一排后语义就清楚了。</p>
		*/
		function emitApply() {
			if (expression.value) emit("apply", expression.value);
		}
		__expose({
			expression,
			emitApply
		});
		return (_ctx, _cache) => {
			const _component_ArrowLeft = resolveComponent("ArrowLeft");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_ArrowRight = resolveComponent("ArrowRight");
			return openBlock(), createElementBlock("div", _hoisted_1$1, [createBaseVNode("div", _hoisted_2$1, [(openBlock(), createElementBlock(Fragment, null, renderList(CADENCES, (c) => {
				return createBaseVNode("button", {
					key: c.key,
					type: "button",
					class: normalizeClass(["re-cron-cal__cadence", { "is-active": cadence.value === c.key }]),
					"aria-pressed": cadence.value === c.key,
					onClick: ($event) => pickCadence(c.key)
				}, toDisplayString(c.label), 11, _hoisted_3$1);
			}), 64)), createBaseVNode("button", {
				type: "button",
				class: normalizeClass(["re-cron-cal__cadence", { "is-active": cadence.value === "custom" }]),
				"aria-pressed": cadence.value === "custom",
				onClick: _cache[0] || (_cache[0] = ($event) => pickCadence("custom"))
			}, " 自定义 ", 10, _hoisted_4$1)]), createBaseVNode("div", _hoisted_5$1, [createBaseVNode("div", _hoisted_6$1, [
				createBaseVNode("header", _hoisted_7$1, [
					createBaseVNode("button", {
						type: "button",
						class: "re-cron-cal__nav",
						"aria-label": "上个月",
						onClick: _cache[1] || (_cache[1] = ($event) => shiftMonth(-1))
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(_component_ArrowLeft)]),
						_: 1
					})]),
					createBaseVNode("span", _hoisted_8$1, toDisplayString(monthLabel.value), 1),
					createBaseVNode("button", {
						type: "button",
						class: "re-cron-cal__nav",
						"aria-label": "下个月",
						onClick: _cache[2] || (_cache[2] = ($event) => shiftMonth(1))
					}, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(_component_ArrowRight)]),
						_: 1
					})])
				]),
				createBaseVNode("div", _hoisted_9$1, [(openBlock(), createElementBlock(Fragment, null, renderList(WEEK_LABELS, (w) => {
					return createBaseVNode("span", {
						key: w,
						class: "re-cron-cal__week-cell"
					}, toDisplayString(w), 1);
				}), 64))]),
				createBaseVNode("div", _hoisted_10$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(cells.value, (cell) => {
					return openBlock(), createElementBlock("button", {
						key: cell.key,
						type: "button",
						class: normalizeClass(["re-cron-cal__day", {
							"is-out": !cell.inMonth,
							"is-picked": isPicked(cell),
							"is-today": isToday(cell)
						}]),
						disabled: !cell.inMonth,
						"aria-pressed": isPicked(cell),
						"aria-label": `${cell.date} 日 周${unref(WEEK_NAMES)[cell.weekday]}`,
						onClick: ($event) => toggleDay(cell)
					}, [createBaseVNode("span", _hoisted_12$1, toDisplayString(cell.date), 1), isPicked(cell) ? (openBlock(), createElementBlock("span", _hoisted_13$1)) : createCommentVNode("", true)], 10, _hoisted_11$1);
				}), 128))])
			]), createBaseVNode("div", _hoisted_14$1, [
				_cache[7] || (_cache[7] = createBaseVNode("div", { class: "re-cron-cal__side-title" }, "执行时间", -1)),
				createBaseVNode("div", _hoisted_15$1, [
					createBaseVNode("span", {
						class: "re-cron-cal__hand re-cron-cal__hand--hour",
						style: normalizeStyle({ transform: `rotate(${hour.value % 12 * 30 + minute.value * .5}deg)` })
					}, null, 4),
					createBaseVNode("span", {
						class: "re-cron-cal__hand re-cron-cal__hand--min",
						style: normalizeStyle({ transform: `rotate(${minute.value * 6}deg)` })
					}, null, 4),
					_cache[5] || (_cache[5] = createBaseVNode("span", { class: "re-cron-cal__clock-dot" }, null, -1))
				]),
				createBaseVNode("div", _hoisted_16$1, [
					createVNode(unref(ReInputNumber_default), {
						modelValue: hour.value,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => hour.value = $event),
						min: 0,
						max: 23,
						controls: false,
						"aria-label": "小时"
					}, null, 8, ["modelValue"]),
					_cache[6] || (_cache[6] = createBaseVNode("span", { class: "re-cron-cal__time-colon" }, ":", -1)),
					createVNode(unref(ReInputNumber_default), {
						modelValue: minute.value,
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => minute.value = $event),
						min: 0,
						max: 59,
						controls: false,
						"aria-label": "分钟"
					}, null, 8, ["modelValue"])
				]),
				createBaseVNode("p", _hoisted_17$1, "按 " + toDisplayString(cadenceLabel.value) + " 执行", 1)
			])])]);
		};
	}
}), [["__scopeId", "data-v-b1236bd9"]]);
//#endregion
//#region ../../packages/ui/src/components/ReCron/ReCron.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-cron__text"
};
var _hoisted_2 = ["title"];
var _hoisted_3 = ["title"];
var _hoisted_4 = { class: "re-cron__bar" };
var _hoisted_5 = ["aria-label", "onClick"];
var _hoisted_6 = ["disabled"];
var _hoisted_7 = { class: "re-cron__panel" };
var _hoisted_8 = { class: "re-cron__panel-head" };
var _hoisted_9 = { class: "re-cron__panel-titles" };
var _hoisted_10 = { class: "re-cron__panel-title" };
var _hoisted_11 = { class: "re-cron__panel-sub" };
var _hoisted_12 = {
	key: 0,
	class: "re-cron__valid"
};
var _hoisted_13 = ["aria-pressed"];
var _hoisted_14 = { class: "re-cron__editor" };
var _hoisted_15 = { class: "re-cron__pill-row" };
var _hoisted_16 = ["aria-pressed", "onClick"];
var _hoisted_17 = { class: "re-cron__controls" };
var _hoisted_18 = {
	key: 0,
	class: "re-cron__hint"
};
var _hoisted_19 = {
	key: 7,
	class: "re-cron__hint"
};
var _hoisted_20 = {
	key: 0,
	class: "re-cron__hint re-cron__note"
};
var _hoisted_21 = { class: "re-cron__preset-bar" };
var _hoisted_22 = { class: "re-cron__pill-row" };
var _hoisted_23 = ["aria-pressed", "onClick"];
var _hoisted_24 = {
	key: 1,
	class: "re-cron__cal-preview"
};
var _hoisted_25 = { class: "re-cron__times" };
var _hoisted_26 = { class: "re-cron__times-text" };
var _hoisted_27 = {
	key: 2,
	class: "re-cron__raw"
};
var _hoisted_28 = { class: "re-cron__hint" };
var _hoisted_29 = { class: "re-cron__footer" };
var _hoisted_30 = { class: "re-cron__footer-actions" };
var _hoisted_31 = { class: "re-cron__status-warn" };
//#endregion
//#region ../../packages/ui/src/components/ReCron/ReCron.vue
var ReCron_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReCron",
	inheritAttrs: true,
	__name: "ReCron",
	props: /*@__PURE__*/ mergeModels({
		placeholder: { default: "0 0/30 * * * ?" },
		disabled: {
			type: Boolean,
			default: false
		},
		width: { default: void 0 },
		previewCount: { default: 5 },
		defaultCron: { default: "" },
		mode: { default: "edit" }
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels(["change"], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReCron —— Cron 表达式选择组件（可视化 + 表达式 + 触发时间预览）
		*
		* 三方同步：面板状态 ⇄ 表达式字符串 ⇄ v-model，任一侧改动都会即时刷新另外两侧与预览。
		* 面板无法表达表达式时自动退回「表达式模式」并给出提示，绝不静默改写用户的输入。
		*
		* 两种显示模式（mode）：
		* - edit（默认）：输入框 + 可视化面板 + 状态行，表单里编辑用；
		* - text：只渲染「表达式 + 人话」两行的只读预览，供表格等展示场景复用
		*   同一套解析与人话口径（表格里写死一份描述文案必然与校验引擎漂移）。
		*
		* 方言与后端严格一致（com.chua.common.support.task.scheduler.CronExpression）：
		*   固定 6 字段「秒 分 时 日 月 周」，5 字段会被服务端直接拒绝；
		*   周字段用 0-6（0=周日，7 亦按周日解析），`?` 解析等价于 `*`；
		*   预览时间由 @repo/utils 的同源镜像 CronExpression 计算，与服务端逐字对齐。
		*/
		const model = useModel(__props, "modelValue");
		const props = __props;
		const emit = __emit;
		const SECOND = {
			key: "sec",
			label: "秒",
			min: 0,
			max: 59
		};
		const MINUTE = {
			key: "min",
			label: "分",
			min: 0,
			max: 59
		};
		const HOUR = {
			key: "hour",
			label: "时",
			min: 0,
			max: 23
		};
		const DAY = {
			key: "day",
			label: "日",
			min: 1,
			max: 31
		};
		const MONTH = {
			key: "month",
			label: "月",
			min: 1,
			max: 12
		};
		const WEEK = {
			key: "week",
			label: "周",
			min: 0,
			max: 6
		};
		/** 周字段数值语义与服务端一致（0=周日…6=周六）；与日历面板共用同一份 */
		const MONTH_NAME_TO_NUM = {
			JAN: 1,
			FEB: 2,
			MAR: 3,
			APR: 4,
			MAY: 5,
			JUN: 6,
			JUL: 7,
			AUG: 8,
			SEP: 9,
			OCT: 10,
			NOV: 11,
			DEC: 12
		};
		const WEEKDAY_NAME_TO_NUM = {
			SUN: 0,
			MON: 1,
			TUE: 2,
			WED: 3,
			THU: 4,
			FRI: 5,
			SAT: 6
		};
		/**
		* 把 token 里的英文名称换成数字。
		*
		* <p>只在月/周两个字段生效（引擎也只在这两处 resolve 名称）。
		* 名称一律是三个字母且互不为前缀，所以逐个替换不会相互污染。</p>
		*
		* @param key 字段 key
		* @param token 原始 token
		* @returns 归一化后的 token 与"是否真的用到过名称"
		*/
		function normalizeTokenNames(key, token) {
			const table = key === "month" ? MONTH_NAME_TO_NUM : key === "week" ? WEEKDAY_NAME_TO_NUM : null;
			if (!table) return {
				text: token,
				used: false
			};
			let text = token.toUpperCase();
			let used = false;
			for (const [name, num] of Object.entries(table)) if (text.includes(name)) {
				text = text.split(name).join(String(num));
				used = true;
			}
			return {
				text,
				used
			};
		}
		/**
		* 面板表达不了的字段：key → 原始 token。
		*
		* <p>为什么必须单独记：{@link parseToken} 一进来就 {@code Object.assign(f, blank(), …)}
		* 把该字段重置成"每一个值"，失败后并不会还原。于是 {@link tokenOf} 读到的是
		* {@code all}，{@code MON-FRI} 被显示成 {@code *}（"每天"）—— 看起来完全合法，
		* 比直接显示 NaN 更危险。这里改为回显原样 token，让面板说真话。</p>
		*/
		const rawTokens = reactive({});
		/**
		* 面板**解析成功**（不一定接管）的字段。
		*
		* <p>与 rawTokens 的区别是这里要回答"面板看不看得懂这个字段"：
		* 看不懂就不能描述它，看得懂但写回去会变意思（名称、周写 7）则照样能描述。</p>
		*/
		const panelParsed = reactive({});
		/** 表达式里用过英文名称（面板按数字解析显示，但不改写用户的表达式） */
		const nameNormalized = ref(false);
		const state = reactive({
			sec: blank(),
			min: blank(),
			hour: blank(),
			day: blank(),
			month: blank(),
			week: blank()
		});
		/** 表达式与面板对不上时置为 true：只信表达式，不再回写面板 */
		const rawMode = ref(false);
		const rawExpression = ref("");
		const tab = ref("sec");
		const open = ref(false);
		/** 根元素：宿主弹层隐藏时 popover 已 teleport 到 body，只能靠宿主可见性兜底收起 */
		const rootRef = ref(null);
		let hostVisibleTimer = null;
		function stopHostVisibleWatcher() {
			if (hostVisibleTimer) {
				clearInterval(hostVisibleTimer);
				hostVisibleTimer = null;
			}
		}
		/** 编辑弹层关闭（display:none / v-if 卸载）后把 ReCron popover 一起收掉 */
		function startHostVisibleWatcher() {
			stopHostVisibleWatcher();
			hostVisibleTimer = setInterval(() => {
				const el = rootRef.value;
				if (!el || !el.isConnected || el.getClientRects().length === 0) {
					open.value = false;
					stopHostVisibleWatcher();
				}
			}, 200);
		}
		watch(open, (visible) => {
			if (visible) startHostVisibleWatcher();
			else stopHostVisibleWatcher();
		});
		onUnmounted(stopHostVisibleWatcher);
		function blank() {
			return {
				mode: "all",
				start: 0,
				end: 0,
				step: 1,
				points: [],
				nth: 1
			};
		}
		/**
		* 常用预设：恒显，右栏列表按 UI 稿取这 5 条。
		*
		* <p>表达式统一写成 Quartz 的 `?` 占位（日/周二选一写 `?`）：服务端登记的任务
		* （如 `0 0/30 * * * ?`）与用户从后端拷来的表达式都是这个写法，预设和它们
		* 逐字节一致，选中态才亮得起来 —— 用 `*` 占位会与真实数据差一个字符，
		* 明明配的是同一件事，列表上却一个都不高亮。</p>
		*/
		const PRESETS_QUICK = [
			{
				label: "每 5 分钟",
				cron: "0 0/5 * * * ?"
			},
			{
				label: "每 30 分钟",
				cron: "0 0/30 * * * ?"
			},
			{
				label: "每小时",
				cron: "0 0 * * * ?"
			},
			{
				label: "每天 00:00",
				cron: "0 0 0 * * ?"
			},
			{
				label: "周一 09:00",
				cron: "0 0 9 ? * MON"
			}
		];
		/** 罕见档预设：由「更多预设」展开（按周排期 / 更长周期 / 分钟级更细粒度） */
		const PRESETS_MORE = [
			{
				label: "每分钟",
				cron: "0 * * * * ?"
			},
			{
				label: "每 15 分钟",
				cron: "0 0/15 * * * ?"
			},
			{
				label: "每天 09:30",
				cron: "0 30 9 * * ?"
			},
			{
				label: "工作日 09:00",
				cron: "0 0 9 ? * MON-FRI"
			},
			{
				label: "每月 1 日",
				cron: "0 0 9 1 * ?"
			},
			{
				label: "每年 1 月 1 日",
				cron: "0 0 0 1 1 ?"
			}
		];
		/** 「更多预设」是否展开 */
		const presetsExpanded = ref(false);
		/**
		* 当前该展示的预设列表。
		*
		* <p>折叠时命中罕见档也要把命中的那个补出来 —— 否则用户明明存了"每月 1 日"，
		* 面板上一个都没高亮，看着像没生效。</p>
		*/
		const visiblePresets = computed(() => {
			if (presetsExpanded.value) return [...PRESETS_QUICK, ...PRESETS_MORE];
			const hit = PRESETS_MORE.find((p) => p.cron === trimmed.value);
			return hit ? [...PRESETS_QUICK, hit] : PRESETS_QUICK;
		});
		/** 匹配方式文案：胶囊分段项与摘要文案共用一套叫法 */
		const MODE_LABELS = {
			all: "每一个值",
			step: "从起点按间隔",
			range: "区间",
			points: "指定值",
			last: "最后一天",
			lastNth: "最后一个周几",
			nearest: "最近工作日",
			nth: "第 N 个周几"
		};
		/**
		* 单个匹配方式的展示文案。
		*
		* <p>`last`（`L`）在日与周两个字段上的引擎语义并不相同，必须分开叫：
		* 日字段是"当月最后一天"；周字段走的是 {@code isLastWeekDay}，判定为
		* "月末当天 **或** 与月末同星期的那些天" —— 实测 `0 0 9 * * L` 的下次触发是
		* 2026-10-10（周六），而 10-31 也是周六。把它也叫"最后一天"会误导用户。</p>
		*
		* @param key 字段 key
		* @param mode 匹配方式
		* @returns 展示文案
		*/
		function modeLabel(key, mode) {
			if (mode === "last" && key === "week") return "与月末同星期";
			return MODE_LABELS[mode];
		}
		/**
		* 选项标签带上单位。
		*
		* <p>此前时间字段只给裸数字，指定值选中后会显示成一个孤零零的 `0`
		* （截图复核发现），看不出是"0 秒"还是别的。周字段本来就有"0 周日"的形式，
		* 这里把其余字段补齐为 `值 + 字段名`。标签只影响展示，value 仍是数字。</p>
		*
		* @param spec 字段规格
		* @returns 选项列表
		*/
		function optionsOf(spec) {
			const out = [];
			for (let v = spec.min; v <= spec.max; v++) out.push({
				value: v,
				label: spec.key === "week" ? `${v} ${WEEK_NAMES[v]}` : `${v} ${LABEL_OF[spec.key] ?? ""}`.trim()
			});
			return out;
		}
		const SPEC = {
			sec: {
				min: 0,
				max: 59,
				modes: [
					"all",
					"step",
					"range",
					"points"
				]
			},
			min: {
				min: 0,
				max: 59,
				modes: [
					"all",
					"step",
					"range",
					"points"
				]
			},
			hour: {
				min: 0,
				max: 23,
				modes: [
					"all",
					"step",
					"range",
					"points"
				]
			},
			day: {
				min: 1,
				max: 31,
				modes: [
					"all",
					"step",
					"range",
					"points",
					"last",
					"nearest"
				]
			},
			month: {
				min: 1,
				max: 12,
				modes: [
					"all",
					"step",
					"range",
					"points"
				]
			},
			week: {
				min: 0,
				max: 6,
				modes: [
					"all",
					"step",
					"range",
					"points",
					"nth",
					"lastNth",
					"last"
				]
			}
		};
		/**
		* 字段顺序，与表达式 6 段的先后一致。
		*
		* <p>必须声明在 {@link syncFromModel} 之前：包着它的 `watch(model, …, { immediate: true })`
		* 会在 setup 期就执行，声明晚了会撞上 const 的暂时性死区
		* （实测直接 `ReferenceError: Cannot access 'FIELD_KEYS' before initialization`，
		* 整页白屏、tsc 却查不出来）。</p>
		*/
		const FIELD_KEYS = [
			"sec",
			"min",
			"hour",
			"day",
			"month",
			"week"
		];
		/**
		* 六个字段（秒/分/时/日/月/周），顺序即表达式字段顺序。
		* 面板用「字段盒子 + 当前字段的匹配方式」呈现，不再用 ReTab 页签。
		*/
		const FIELDS = [
			SECOND,
			MINUTE,
			HOUR,
			DAY,
			MONTH,
			WEEK
		];
		const WEEK_OPTIONS = WEEK_NAMES.map((n, i) => ({
			label: n,
			value: i
		}));
		/** 面板状态 → 单字段 token */
		/**
		* 由面板状态算出该字段的 token（不看 rawTokens 回显）。
		*
		* @param key 字段 key
		* @returns 面板当前会写出的 token
		*/
		function tokenFromState(key) {
			const f = state[key];
			switch (f.mode) {
				case "step": return `${f.start}/${f.step || 1}`;
				case "range": return f.step > 1 ? `${f.start}-${f.end}/${f.step}` : `${f.start}-${f.end}`;
				case "points": return f.points.length ? [...f.points].sort((a, b) => a - b).join(",") : "*";
				case "last": return "L";
				case "lastNth": return `${f.start}L`;
				case "nearest": return `${f.start}W`;
				case "nth": return `${f.start}#${f.nth}`;
				default: return "*";
			}
		}
		/**
		* 该字段在界面与表达式里实际使用的 token。
		*
		* <p>面板能一一对应地表达时就是面板的值；表达不了、或者表达出来会与用户输入
		* 不一致（英文名称、周字段写 7 等）时，回显用户原本写的 token —— 面板不得擅自
		* 把用户的表达式"看成"另一种意思。</p>
		*
		* @param key 字段 key
		* @returns 该字段的展示 / 拼装用 token
		*/
		function tokenOf(key) {
			return rawTokens[key] ?? tokenFromState(key);
		}
		/**
		* 面板解析出的字段是否自洽。
		*
		* <p>倒序区间（如 `1-0`）必须在这里拦住：引擎对 `rangeMin > rangeMax` 的循环一次
		* 都不执行，位图留空，随后又被"未指定的一侧放宽为任意值"的规则接管 ——
		* 结果是 `1-0` 被静默当成"每天"，而面板还显示"区间 1-0"并报"合法"。</p>
		*
		* @param key 字段 key
		* @returns true 表示面板状态可以直接采用
		*/
		function fieldIsSane(key) {
			const f = state[key];
			const spec = SPEC[key];
			const within = (v) => Number.isInteger(v) && v >= spec.min && v <= spec.max;
			switch (f.mode) {
				case "range": return within(f.start) && within(f.end) && f.end >= f.start && f.step >= 1;
				case "step": return within(f.start) && f.step >= 1;
				case "points": return f.points.length > 0 && f.points.every(within);
				case "nearest": return f.start >= 1 && f.start <= 31;
				case "lastNth": return f.start >= 0 && f.start <= 6;
				case "nth": return f.start >= 0 && f.start <= 6 && f.nth >= 1 && f.nth <= 5;
				default: return true;
			}
		}
		/** 六字段拼装；日/周一律用 `*` 兜底，避免服务端「一侧为空则整体放开」的语义把另一侧条件吞掉 */
		const expression = computed(() => [
			tokenOf("sec"),
			tokenOf("min"),
			tokenOf("hour"),
			tokenOf("day"),
			tokenOf("month"),
			tokenOf("week")
		].join(" "));
		/** 解析单个 token 到面板状态；返回 false 表示面板表达不了，退回表达式模式 */
		function parseToken(key, token) {
			const f = state[key];
			const spec = SPEC[key];
			Object.assign(f, blank(), { start: spec.min });
			if (token === "*" || token === "?") {
				f.mode = "all";
				return true;
			}
			if ((token === "L" || token === "LW") && key === "day") {
				f.mode = "last";
				return true;
			}
			if (key === "week" && token === "L") {
				f.mode = "last";
				return true;
			}
			if (key === "week" && /^[0-7]L$/.test(token)) {
				f.mode = "lastNth";
				f.start = Number.parseInt(token, 10);
				return true;
			}
			if (token.endsWith("W") && key === "day" && /^\d+W$/.test(token)) {
				f.mode = "nearest";
				f.start = Number.parseInt(token, 10);
				return true;
			}
			if (token.includes("#") && key === "week") {
				const [d, n] = token.split("#");
				if (!/^\d+$/.test(d) || !/^[1-5]$/.test(n)) return false;
				f.mode = "nth";
				f.start = Number.parseInt(d, 10);
				f.nth = Number.parseInt(n, 10);
				return true;
			}
			if (token.includes("/")) {
				const [head, tail] = token.split("/");
				if (!/^\d+$/.test(tail)) return false;
				f.step = Number.parseInt(tail, 10);
				if (head === "*") {
					f.mode = "step";
					f.start = spec.min;
					return true;
				}
				if (head.includes("-")) {
					const [a, b] = head.split("-");
					if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return false;
					f.mode = "range";
					f.start = Number.parseInt(a, 10);
					f.end = Number.parseInt(b, 10);
					return true;
				}
				if (/^\d+$/.test(head)) {
					f.mode = "step";
					f.start = Number.parseInt(head, 10);
					return true;
				}
				return false;
			}
			if (token.includes("-")) {
				const [a, b] = token.split("-");
				if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return false;
				f.mode = "range";
				f.start = Number.parseInt(a, 10);
				f.end = Number.parseInt(b, 10);
				return true;
			}
			const parts = token.split(",");
			if (!parts.every((p) => /^\d+$/.test(p))) return false;
			f.mode = "points";
			f.points = parts.map((p) => Number.parseInt(p, 10));
			return true;
		}
		/** 表达式 → 面板状态 */
		function syncFromModel(value) {
			const tokens = (value || "").trim().split(/\s+/);
			if (!value.trim() || tokens.length !== 6) {
				rawMode.value = !!value.trim();
				rawExpression.value = value.trim();
				return;
			}
			const keys = [...FIELD_KEYS];
			for (const k of keys) {
				delete rawTokens[k];
				delete panelParsed[k];
			}
			nameNormalized.value = false;
			if (!value.trim() || tokens.length !== 6) {
				rawMode.value = !!value.trim();
				rawExpression.value = value.trim();
				return;
			}
			let sawName = false;
			const claimed = keys.map((k, i) => {
				const raw = tokens[i];
				if (parseToken(k, raw)) {
					panelParsed[k] = true;
					if (fieldIsSane(k) && tokenFromState(k) === raw) return true;
				}
				const { text, used } = normalizeTokenNames(k, raw);
				if (used && parseToken(k, text)) {
					panelParsed[k] = true;
					if (fieldIsSane(k)) {
						sawName = true;
						rawTokens[k] = raw;
						return true;
					}
				}
				rawTokens[k] = raw;
				return false;
			});
			rawMode.value = claimed.some((c) => !c);
			nameNormalized.value = sawName;
			rawExpression.value = value.trim();
		}
		/**
		* 「本次 expression 变化是由输入推导出来的，不要回写成model」的闸门。
		*
		* <p>症状：输入框里每敲一个字符就闪一下。成因是两条写路径在同一次按键里互相打：</p>
		* <ol>
		*   <li>用户敲 `0` → {@code model = "0"}；</li>
		*   <li>{@code watch(model)} → {@link syncFromModel} 拿 "0" 去解析，缺失字段按默认补齐，
		*       于是六字段 {@link expression} 变成 `"0 * * * * ?"`；</li>
		*   <li>紧接着 {@code watch(expression)} 触发，此时 {@code rawMode} 还是 false
		*       （"0" 面板表达得了），判定为「面板改动」，把 `"0 * * * * ?"` 写回 {@code model}。</li>
		* </ol>
		* <p>输入框的文本在光标下被改写 → 看着就是闪动/跳字。面板改动与用户输入因此必须可区分：
		* 本闸门在 {@code syncFromModel} 期间置位，只压住由输入派生的那次回写，
		* 用户点面板改字段产生的 {@code expression} 变化照常回写。</p>
		*
		* <p>清零放在 nextTick：{@code watch(expression)} 若本轮没被触发（敲入的字符没改变任何
		* token），靠 nextTick 兜底复位，闸门不会粘住 true 而吃掉下一次面板编辑。</p>
		*/
		let syncingFromModel = false;
		watch(model, (v) => {
			syncingFromModel = true;
			if (!rawMode.value && v === expression.value) rawExpression.value = v;
			else syncFromModel(v || "");
			nextTick(() => {
				syncingFromModel = false;
			});
		}, { immediate: true });
		/** 面板改动 → 表达式（表达式模式下不反向覆盖用户输入） */
		watch(expression, (v) => {
			if (rawMode.value || nameNormalized.value || props.disabled) return;
			if (syncingFromModel) return;
			if (v !== model.value) model.value = v;
		});
		const trimmed = computed(() => (model.value || "").trim());
		/**
		* 把引擎抛出的报错翻译成人话。
		*
		* <p>引擎（`@repo/utils` 的 CronExpression）只有两条错误文案，此前是原样透给用户：
		* 触发器状态行、弹层底栏、弹层摘要 note 三处都直接显示
		* `Cron expression must have 6 fields (...)` 与 Java 风格的
		* `For input string: "1#2"` —— 后者对中文用户等于天书。</p>
		*
		* <p>两条都能给出更准的说法：字段数那条直接报当前段数；`For input string` 那条
		* 带着出错的原文，而组件自己知道它落在第几段，可以点名到字段。</p>
		*
		* @param raw 引擎原始报错
		* @param tokens 表达式切分出的各段
		* @returns 中文报错；无法识别的原文原样返回（不隐藏信息）
		*/
		function humanizeEngineError(raw, tokens) {
			if (/must have (\d+) fields/.exec(raw)) return `需要 6 段（秒 分 时 日 月 周），当前 ${tokens.length} 段`;
			const bad = /^For input string: "(.*)"$/.exec(raw);
			if (bad) {
				const text = bad[1];
				const at = tokens.findIndex((t) => t.includes(text));
				return `${at >= 0 && FIELD_KEYS[at] ? `第 ${at + 1} 段（${LABEL_OF[FIELD_KEYS[at]]}）` : "其中一段"}「${text}」不是数字，该段只接受数字`;
			}
			return raw;
		}
		/**
		* 指出"数值合法但越界"的字段。
		*
		* <p>引擎对越界值是**照常置位、永不匹配**（见 CronExpression.parseField 的注释），
		* 于是它不报错、只表现为"算不出触发时间"。此前用户看到的只有
		* 「无法算出下一次触发时间」，完全不知道是哪个字段写错了。</p>
		*
		* <p>取值范围用 {@link SPEC} 而不是另写一份；周字段额外放行 7 ——
		* 引擎的 `parseDaysOfWeek` 会把 7 视作周日（`.replace(/7/g, "0")`），
		* 按面板的 0~6 去判会把合法的 `7` 误报成越界。</p>
		*
		* @param tokens 表达式切分出的各段
		* @returns 越界说明；没有越界时返回空串
		*/
		function outOfRangeHint(tokens) {
			const bad = [];
			FIELD_KEYS.forEach((key, i) => {
				const token = tokens[i];
				if (token === void 0) return;
				const max = key === "week" ? 7 : SPEC[key].max;
				for (const part of token.match(/\d+/g) || []) {
					const n = Number(part);
					if (n < SPEC[key].min || n > max) {
						bad.push(`${LABEL_OF[key]}=${n}（应为 ${SPEC[key].min}~${max}）`);
						break;
					}
				}
			});
			return bad.length ? `${bad.join("、")} 超出可取范围` : "";
		}
		/** 校验 + 预览：用与服务端同源的解析引擎，避免"看着合法、后端拒" */
		const analysis = computed(() => {
			const expr = trimmed.value;
			if (!expr) return {
				valid: false,
				error: "",
				times: [],
				empty: true
			};
			try {
				const times = new CronExpression(expr).getFireTimes(Math.min(20, Math.max(1, props.previewCount)), /* @__PURE__ */ new Date());
				if (!times.length) return {
					valid: false,
					error: "无法算出下一次触发时间",
					times,
					empty: false
				};
				return {
					valid: true,
					error: "",
					times,
					empty: false
				};
			} catch (e) {
				return {
					valid: false,
					error: e instanceof Error ? e.message : String(e),
					times: [],
					empty: false
				};
			}
		});
		const errorText = computed(() => {
			if (analysis.value.empty) return props.defaultCron ? `留空则按后端默认 ${props.defaultCron} 登记` : "留空表示不设置调度";
			if (!analysis.value.valid) {
				const tokens = trimmed.value.split(/\s+/);
				const base = humanizeEngineError(analysis.value.error || "表达式非法", tokens);
				const range = outOfRangeHint(tokens);
				return range ? `${base}：${range}` : base;
			}
			return "";
		});
		/**
		* 面板与表达式的同步状态说明（弹层用）。
		*
		* <p>此前弹层摘要条在"面板表达不了"时回落到「未设置调度周期」—— 把"看不懂"
		* 错报成"没设置"，而表达式其实合法且已有下次触发时间。</p>
		*/
		/** 字段 key → 中文单字，用于"哪些字段面板读不懂"的提示 */
		const LABEL_OF = {
			sec: "秒",
			min: "分",
			hour: "时",
			day: "日",
			month: "月",
			week: "周"
		};
		/**
		* 面板**真的读不懂**的字段（语法层面解析不了）。
		*
		* <p>与 {@link spellingDiff} 必须分开：`?`（日/周里表示"不指定"）与英文名称都是
		* 面板读得懂的写法，只是无法原样复现，写回去会变成 `*` / 数字。把它们说成
		* "面板无法表达"是误报 —— 实测截图里 `0 30 9 ? * MON-FRI` 被报成
		* "面板无法表达 日=?"，而 `?` 恰恰是最常见的写法，还会给出一个毫无意义的
		* "按表达式重建面板"按钮。</p>
		*/
		const notUnderstood = computed(() => analysis.value.empty ? [] : FIELDS.filter((f) => !panelParsed[f.key]).map((f) => f.label));
		/** 面板读得懂、但写回去会改变写法（`?`、英文名称、周写 7、倒序区间）的字段 */
		const spellingDiff = computed(() => FIELDS.filter((f) => panelParsed[f.key] === true && rawTokens[f.key] !== void 0).map((f) => f.label));
		/** "指定值"点了但一个都没选的字段（这些字段当前会写成 `*`） */
		const emptyPointsLabels = computed(() => FIELDS.filter((f) => state[f.key].mode === "points" && !state[f.key].points.length).map((f) => f.label));
		const panelNote = computed(() => {
			if (analysis.value.empty) return props.defaultCron ? `留空则按后端默认 ${props.defaultCron} 登记` : "留空表示不设置调度";
			if (!analysis.value.valid) return analysis.value.error || "表达式非法";
			const unsynced = Object.keys(rawTokens);
			if (emptyPointsLabels.value.length && !rawMode.value && !nameNormalized.value) return `${emptyPointsLabels.value.join("、")}的"指定值"尚未选择任何值，当前等同不限`;
			if (notUnderstood.value.length) return `面板读不懂 ${unsynced.filter((k) => !panelParsed[k]).map((k) => `${LABEL_OF[k]}=${rawTokens[k]}`).join("、")}，已按原文保留`;
			if (spellingDiff.value.length) return `面板不会改写你的写法：${unsynced.map((k) => `${LABEL_OF[k]}=${rawTokens[k]}`).join("、")}（按数字理解，保存时保持原文）`;
			return "与服务端同一套解析引擎算出，保存后的触发时间与此一致";
		});
		/**
		* 底栏提示：只放一句短的。
		*
		* <p>此前底栏直接复用 {@link panelNote}，于是同一条"面板读不懂"的说明在摘要条、
		* 字段编辑区、底栏**同时出现三次** —— 信息量没增加，可读性明显变差。
		* 详细原因留在摘要条（紧挨表达式），底栏只表明状态。</p>
		*/
		const footerHint = computed(() => {
			if (analysis.value.empty) return errorText.value;
			if (!analysis.value.valid) return errorText.value;
			if (syncWarning.value) return "表达式已按原文保留（原因见上方）";
			return "与服务端解析一致，保存后的触发时间与此相符";
		});
		computed(() => {
			if (analysis.value.empty) return "未设置调度周期";
			if (!analysis.value.valid) return "表达式无法解析";
			return humanSummary.value || summary.value || "已设置调度周期";
		});
		computed(() => {
			if (analysis.value.empty) return props.defaultCron ? `留空则按后端默认 ${props.defaultCron} 登记` : "留空表示不设置调度";
			if (!analysis.value.valid) return analysis.value.error || errorText.value || "表达式非法";
			return `${summary.value ? `${summary.value} · ` : ""}Quartz 6 段（秒 分 时 日 月 周）`;
		});
		/**
		* 只在"面板与表达式存在落差"时才展示的提示。
		*
		* <p>三种落差都要提示：面板读不懂（rawMode）、用了英文名称（面板理解但不改写）、
		* 以及"指定值"空选（合法但会被当成不限）。此前只在弹层里给，触发器状态行
		* 完全不提，用户在外面看不到任何异常。</p>
		*/
		const syncWarning = computed(() => {
			if (analysis.value.empty) return "";
			if (!analysis.value.valid) return "";
			if (notUnderstood.value.length || nameNormalized.value || emptyPointsLabels.value.length || spellingDiff.value.length) return panelNote.value;
			return "";
		});
		/**
		* 状态行的紧凑版落差提示。
		*
		* <p>触发器的状态行只占一行，塞进完整说明会把"什么时候跑"挤没；
		* 所以这里只给"哪几个字段面板没接管"，详细原因留给弹层。</p>
		*/
		const syncBadge = computed(() => {
			if (analysis.value.empty) return "";
			if (notUnderstood.value.length) return `面板未接管 ${notUnderstood.value.join("、")}`;
			if (spellingDiff.value.length) return `原样保留 ${spellingDiff.value.join("、")}`;
			if (emptyPointsLabels.value.length) return `${emptyPointsLabels.value.join("、")}未选值，等同不限`;
			return "";
		});
		const WEEK_LABEL = [
			"日",
			"一",
			"二",
			"三",
			"四",
			"五",
			"六"
		];
		function pad(n) {
			return n < 10 ? `0${n}` : String(n);
		}
		function fmt(d) {
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} 周${WEEK_LABEL[d.getDay()]}`;
		}
		/** 触发时刻的时刻部分：`15:30:00`（UI 稿左栏只显示时刻，日期交给 dayLabel） */
		function timeLabel(d) {
			return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
		}
		/**
		* 触发时刻的日期前缀：今天 / 明天 / 后天 / 周X。
		*
		* <p>「今天 15:30:00」比「2026-10-10 15:30:00 周六」短一半，而预览列表要的就是
		* 「最快那次在多久以后」——日期越远越该显式，所以三天以内走相对说法，
		* 再远退到星期（同一周内仍然好认），跨周才回到日期。</p>
		*/
		function dayLabel(d) {
			const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
			const now = /* @__PURE__ */ new Date();
			const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
			const diff = Math.round((a - b) / 864e5);
			if (diff === 0) return "今天";
			if (diff === 1) return "明天";
			if (diff === 2) return "后天";
			if (diff === -1) return "昨天";
			if (diff > 2 && diff < 7) return `周${WEEK_LABEL[d.getDay()]}`;
			return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
		}
		/** 字段的机械描述（"秒 0，分 30…"），面板表达不了的字段按原样回显 */
		const summary = computed(() => {
			if (!trimmed.value || !analysis.value.valid) return "";
			const parts = [];
			const describe = (key, unit) => {
				const raw = rawTokens[key];
				if (raw !== void 0) {
					if (raw === "?") return;
					parts.push(`${unit} ${raw}`);
					return;
				}
				const f = state[key];
				if (f.mode === "all") return;
				if (key === "sec" && f.mode === "points" && f.points.length === 1 && f.points[0] === 0) return;
				if (f.mode === "step") parts.push(`每 ${f.step} ${unit}（自 ${f.start} 起）`);
				else if (f.mode === "range") parts.push(`${unit} ${f.start}-${f.end}${f.step > 1 ? ` 步长 ${f.step}` : ""}`);
				else if (f.mode === "points") parts.push(f.points.length ? `${unit} ${f.points.join("、")}` : `${unit} 任意（未选择具体值）`);
				else if (f.mode === "last") parts.push(key === "week" ? "与月末同星期的那些天" : "当月最后一天");
				else if (f.mode === "lastNth") parts.push(`当月最后一个${WEEK_NAMES[f.start]}`);
				else if (f.mode === "nearest") parts.push(`当月 ${f.start} 日最近工作日`);
				else if (f.mode === "nth") parts.push(`第 ${f.nth} 个${WEEK_NAMES[f.start]}`);
			};
			describe("sec", "秒");
			describe("min", "分");
			describe("hour", "时");
			describe("day", "日");
			describe("month", "月");
			describe("week", "周");
			return parts.length ? parts.join("，") : "每秒";
		});
		/** 时间部分的人话：`09:30` / `09:30:15` / `每 15 分钟` / `每小时` / `每秒` */
		function humanTime() {
			const s = state.sec;
			const m = state.min;
			const h = state.hour;
			for (const k of [
				"sec",
				"min",
				"hour"
			]) if (!panelParsed[k]) return "";
			const isAll = (f) => f.mode === "all";
			const single = (f) => f.mode === "points" && f.points.length === 1;
			const secImplicit = isAll(s) || single(s) && s.points[0] === 0;
			const minuteStep = (f) => f.mode === "step" ? f.step : f.mode === "range" && f.step > 1 ? f.step : 0;
			if (isAll(s) && isAll(m) && isAll(h)) return "每秒";
			if (secImplicit && minuteStep(m) && isAll(h)) return m.start === 0 ? `每 ${m.step} 分钟` : `每小时的第 ${m.start} 分钟起，每 ${m.step} 分钟`;
			if (secImplicit && minuteStep(m) && single(h)) return `${pad(h.points[0])}:${pad(m.start)} 起每 ${m.step} 分钟`;
			if (isAll(s) && isAll(m) && h.mode === "step") return h.start === 0 ? `每 ${h.step} 小时` : `每天 ${pad(h.start)} 点起，每 ${h.step} 小时`;
			if (isAll(s) && single(m) && isAll(h)) return `每小时的第 ${m.points[0]} 分钟`;
			if (isAll(s) && single(m) && single(h)) return `${pad(h.points[0])}:${pad(m.points[0])}`;
			if (single(s) && single(m) && single(h)) {
				const hhmm = `${pad(h.points[0])}:${pad(m.points[0])}`;
				return s.points[0] === 0 ? hhmm : `${hhmm}:${pad(s.points[0])}`;
			}
			return "";
		}
		/** 周字段数值 → 中文，`7` 与服务端一致地归到周日 */
		function weekName(v) {
			return WEEK_NAMES[(v % 7 + 7) % 7];
		}
		/** 周取值集合的人话：工作日 / 每X / 每X、Y */
		function weekSetPhrase(values) {
			const set = new Set(values.map((v) => (v % 7 + 7) % 7));
			if (isWorkdaySet(set)) return "每个工作日";
			const sorted = [...set].sort((a, b) => a - b);
			if (sorted.length === 1) return `每${weekName(sorted[0])}`;
			return `每${sorted.map((v) => weekName(v).slice(1)).join("、")}`;
		}
		/** 日期部分的人话：`每天` / `每个工作日` / `每周一` / `每月 1 日` / `每年 1 月 1 日` */
		function humanDate() {
			const d = state.day;
			const mo = state.month;
			const w = state.week;
			if (!panelParsed.day || !panelParsed.month || !panelParsed.week) return "";
			const reversed = (key, render) => {
				const f = state[key];
				if (!panelParsed[key] || f.mode !== "range" || f.end >= f.start) return "";
				return `${render(f)}（倒序区间，引擎视为"不限"）`;
			};
			const bad = reversed("month", (f) => `每年 ${f.start}-${f.end} 月`) || reversed("day", (f) => `每月 ${f.start}-${f.end} 日`) || reversed("week", (f) => `周 ${f.start}-${f.end}`);
			if (bad) return bad;
			const mon = mo.mode === "all" || mo.mode === "points" && !mo.points.length ? "" : `每年 ${mo.mode === "points" && mo.points.length ? mo.points.join("、") : tokenFromState("month")} 月`;
			const dayAll = d.mode === "all" || d.mode === "points" && !d.points.length;
			if (w.mode === "all" && dayAll) return mon ? `${mon}每天` : "每天";
			if (w.mode === "all") {
				const dayPart = d.mode === "last" ? "当月最后一天" : d.mode === "nearest" ? `每月 ${d.start} 日最近的工作日` : d.mode === "points" ? `每月 ${d.points.join("、")} 日` : d.mode === "range" ? d.start === d.end ? `每月 ${d.start} 日` : `每月 ${d.start}-${d.end} 日` : `每月 ${tokenFromState("day")} 日`;
				return mon ? `${mon} ${dayPart.replace(/^每月 /, "")}` : dayPart;
			}
			if (w.mode === "points" && w.points.length) return `${mon}${weekSetPhrase(w.points)}`;
			if (w.mode === "range") return `${mon}${weekSetPhrase(rangeToArray(w.start, w.end))}`;
			if (w.mode === "nth") return `${mon}每月的第 ${w.nth} 个${weekName(w.start)}`;
			if (w.mode === "lastNth") return `${mon}当月最后一个${weekName(w.start)}`;
			if (w.mode === "last") return `${mon}当月中与月末同星期的那些天`;
			return `${mon}周 ${tokenFromState("week")}`;
		}
		function rangeToArray(a, b) {
			const out = [];
			for (let v = Math.min(a, b); v <= Math.max(a, b); v++) out.push(v);
			return out;
		}
		/** 恰好是周一到周五才算"工作日"（含周六、或只有其中几天都不算） */
		function isWorkdaySet(set) {
			return set.size === 5 && [
				1,
				2,
				3,
				4,
				5
			].every((d) => set.has(d));
		}
		/**
		* 人人可读的一句话：设计的中心诉求就是"每个工作日 09:30 执行"这一行。
		*
		* <p>此前只有机械的字段罗列（"秒 0，分 30，时 9，周 1、2、3、4、5"），
		* 而面板表达不了的表达式连罗列都没有 —— 状态行只剩"合法·下次 …"。</p>
		*/
		const humanSummary = computed(() => {
			if (!trimmed.value || !analysis.value.valid) return "";
			const date = humanDate();
			const time = humanTime();
			const isFrequency = /^(每 \d+ 分钟|每 \d+ 小时|每秒)$/.test(time);
			const head = date === "每天" && isFrequency ? "" : date;
			let text;
			if (!head && !time) text = summary.value;
			else if (!time) text = `${head} 执行`;
			else if (!head) text = time === "每秒" ? "每秒执行" : `${time} 执行`;
			else text = `${head} ${time} 执行`;
			const unsynced = Object.keys(rawTokens).filter((k) => !panelParsed[k]);
			if (unsynced.length) {
				const literal = unsynced.map((k) => `${LABEL_OF[k]} ${rawTokens[k]}`).join("，");
				text = `${text}（${literal}）`;
			}
			return text;
		});
		/**
		* 文本模式（预览）的人话：与状态行同一份口径，只是表格一行放得下，
		* 去掉「执行」后缀更紧凑（"每 5 分钟"而不是"每 5 分钟 执行"）。
		*
		* <p>非法时不静默藏错：换成人话版的错误说明，让登记时就写错的表达式在表格里一眼可见
		* （数据来自后端，能非法说明登记环节就没拦住）。</p>
		*/
		const textModeHuman = computed(() => {
			if (analysis.value.empty) return "";
			if (!analysis.value.valid) return errorText.value;
			return humanSummary.value.replace(/ 执行$/, "");
		});
		/**
		* 用户动了面板控件：放弃"表达式直填"与"名称归一化"的只读态，让改动能写回 model。
		*
		* <p>不这样做的话，{@code MON-FRI} 这类表达式在面板上改任何东西都不会生效 ——
		* 改动被"不回写"的保护挡住，界面却看不到任何反馈。</p>
		*/
		function panelTouch() {
			rawMode.value = false;
			nameNormalized.value = false;
		}
		/** 取整并夹到字段范围内 */
		function clampInt(v, min, max) {
			if (!Number.isFinite(v)) return min;
			return Math.min(max, Math.max(min, Math.round(v)));
		}
		/**
		* 把区间的两个端点理顺到合法范围。
		*
		* <p>倒序区间必须在这里就地纠正：引擎对 `start > end` 的循环一次都不执行，
		* 位图留空后又被"未指定的一侧放宽为任意值"接管，`1-0` 于是被<b>静默当成每天</b>，
		* 而面板还显示"区间 1-0、合法"。让用户直接看到纠正后的值，比事后报错更好懂。</p>
		*
		* @param key 字段 key
		*/
		function fixRange(key) {
			const f = state[key];
			if (f.mode !== "range") return;
			const spec = SPEC[key];
			f.start = clampInt(f.start, spec.min, spec.max);
			f.end = clampInt(f.end, spec.min, spec.max);
			if (f.end < f.start) f.end = f.start;
		}
		/**
		* 用户通过面板接管某字段：清掉它的"原文回显"与"读不懂"标记，让面板的值生效。
		*
		* <p>必须清 rawTokens：否则该字段的原文回显会在 {@link tokenOf} 里压过面板状态。
		* 实测的坏例子：默认表达式 `0 0 12 * * ?` 的周字段回显为 `?`，用户在面板把它改成
		* "最后一个周几"后，表达式仍然是 `?` —— 面板改动完全不生效，且界面没有任何提示。</p>
		*
		* @param key 字段 key
		*/
		function claimField(key) {
			delete rawTokens[key];
			panelParsed[key] = true;
		}
		/**
		* 面板控件被改动：退出只读态，并即时纠正区间。
		*
		* @param key 字段 key
		*/
		function onFieldInput(key) {
			claimField(key);
			panelTouch();
			fixRange(key);
		}
		/**
		* 切换某字段的匹配方式。
		*
		* @param key 字段 key
		* @param mode 目标匹配方式
		*/
		function setFieldMode(key, mode) {
			const f = state[key];
			const spec = SPEC[key];
			claimField(key);
			panelTouch();
			f.mode = mode;
			if (mode === "range") {
				f.start = clampInt(f.start, spec.min, spec.max);
				f.end = clampInt(f.end, spec.min, spec.max);
				if (f.end < f.start) f.end = f.start;
			}
			if (mode === "step" && (!Number.isFinite(f.step) || f.step < 1)) f.step = 1;
		}
		function applyPreset(cron) {
			rawMode.value = false;
			syncFromModel(cron);
			model.value = cron;
		}
		function applyDefaultCron() {
			if (props.defaultCron) applyPreset(props.defaultCron);
		}
		/** 弹层模式：字段（原有六段编辑）/ 日历（参考 UI 的月历调度器） */
		const panelMode = ref("field");
		/** 日历面板实例：底栏「应用到表达式」要问它当前攒出的表达式 */
		const calPanelRef = ref(null);
		/** 底栏「应用到表达式」：转调面板的 emitApply，表达式由面板自己攒、自己抛 */
		function applyCalendarFromPanel() {
			calPanelRef.value?.emitApply();
		}
		/**
		* 日历模式写入表达式：复用 applyPreset 那条写入路径。
		*
		* 日历面板自己只负责「攒出一个 6 段字符串」，解析/校验/预览仍由本组件的
		* syncFromModel + analysis 统一负责 —— 两种入口共用一条管线，不会出现
		* 「日历能接受、字段模式读不懂」的不一致。
		*/
		function applyCalendar(expr) {
			if (!expr) return;
			if (!isSixField(expr)) {
				msgError("日历模式生成的表达式不是 6 段，已忽略");
				return;
			}
			applyPreset(expr);
		}
		/**
		* 表达式段数是否正好 6。
		*
		* <p>写入前必须拦一道：6 段方言由 {@link CronExpression} 强制，7 段会被服务端
		* 直接拒绝。而 {@link applyPreset} 不做校验 —— 它对预设值是可信的，对外部传入
		* 就必须先验。日历面板算的是纯字符串（秒/分/时拼好 + 日周占位），一旦它哪一步
		* 少拼或多拼一段，错误会直接落进 model，父组件要到提交时才报，且用户看不出是哪来的。</p>
		*/
		function isSixField(expr) {
			return String(expr).trim().split(/\s+/).filter(Boolean).length === 6;
		}
		function clearAll() {
			rawMode.value = false;
			model.value = "";
			syncFromModel("");
		}
		/**
		* 把"面板读不懂"的字段重置成"不限制"（`*`），让面板能接管。
		*
		* <p>此前这个按钮是**死的**：点了没有任何可观测变化（实测 `0 0 9 1#2 * *`
		* 点击前后表达式、状态行、摘要、stale 字段、字段 aria 全部逐字节一致，连点两次无变化）。
		* 原因是它只做了 `rawMode = false; syncFromModel(rawExpression)` —— 而
		* {@link syncFromModel} 结尾会把 `rawMode` 重算回 `true`
		* （`claimed.some((c) => !c)`），于是面板立刻又回到只读。</p>
		*
		* <p>现在的语义是"把读不懂的那几段换成 `*`"，这是唯一能让面板接手的做法：
		* 面板本来就表达不出 `1#2` 这种写法，继续读原文只会一直卡在只读态。
		* 改动会写回 model，但弹层的「取消」能把整段还原回打开前的表达式。</p>
		*/
		function useExpressionText() {
			const tokens = (rawExpression.value || "").trim().split(/\s+/);
			if (tokens.length !== FIELD_KEYS.length) {
				rawMode.value = false;
				syncFromModel(rawExpression.value);
				return;
			}
			FIELD_KEYS.forEach((key, i) => {
				if (!panelParsed[key]) tokens[i] = "*";
			});
			const next = tokens.join(" ");
			model.value = next;
			syncFromModel(next);
		}
		/**
		* 弹层的定位修饰符。
		*
		* 浮层只展开当前那一个字段，高 ~200px，默认策略就够用：下方放不下时
		* flip 翻到上方，贴边时 preventOverflow 沿轴向拉回。
		*
		* 这里刻意不关任何修饰符：早先那两个 disabled 是为"比视口一半还高的整屏面板"
		* 准备的（flip 判定上下都放不下后哪儿都不去、弹层直接溢出屏幕），那时改用
		* CSS 硬接管定位到视口顶部居中。面板缩成一段之后归属关系更重要 ——
		* 浮层必须跟着触发条走，硬接管会让它飘到屏幕顶上、与点的那段胶囊对不上。
		*/
		const POPPER_OPTIONS = { modifiers: [{
			name: "flip",
			enabled: true,
			options: { padding: 8 }
		}, {
			name: "preventOverflow",
			enabled: true,
			options: { padding: 8 }
		}] };
		/**
		* 打开面板时记下表达式快照。
		*
		* <p>面板是实时把改动写回 model 的（state → expression → model），
		* 而弹层上给了「取消/保存」，所以取消必须能把整段还原回打开前的状态。
		* 同一个快照也兜住右上角 ×（cancelPanel 走同一条还原路径）——
		* 凡是没有明确按「保存」的关闭，都得还原。</p>
		*/
		const snapshot = ref("");
		function openPanel() {
			snapshot.value = model.value || "";
			if (model.value && model.value !== expression.value) syncFromModel(model.value);
			open.value = true;
		}
		/**
		* 点触发器上的某一段胶囊：切到字段模式并聚焦到该字段。
		*
		* <p>胶囊与浮层里的编辑器说的是同一件事（"六个字段里的哪一个"），两处状态
		* 必须共用 {@code tab} —— 分开存就会出现"胶囊高亮秒、编辑器却在改分"。
		* 顺手把面板切回字段模式：从日历模式点胶囊过来的人要的就是改那个字段，
		* 停在月历上等于没反应。</p>
		*/
		function focusField(key) {
			tab.value = key;
			panelMode.value = "field";
			openPanel();
		}
		/** 当前正在编辑的字段规格（浮层只展开这一段，所以模板里处处用它而不是 spec） */
		const activeSpec = computed(() => FIELDS.find((f) => f.key === tab.value) ?? FIELDS[0]);
		/**
		* 浮层标题行副标题：一句话说明当前字段的取值口径。
		*
		* <p>只说这一段的语义（合法范围 + 当前匹配方式），不复述整条 cron 的人话 ——
		* 整句"每 30 分钟执行"贴在"分字段"标题下面会答非所问，而它已经在触发器
		* 下方那行状态里说过了。</p>
		*/
		const fieldHint = computed(() => {
			const spec = activeSpec.value;
			const mode = state[spec.key].mode;
			const how = mode === "step" || mode === "range" || mode === "points" ? modeLabel(spec.key, mode) : "不限制";
			return `${spec.min}~${spec.max} · ${how}`;
		});
		/**
		* 清空表达式（触发区那颗 ×）。
		*
		* <p>只改 model，不碰面板内部状态 —— 触发区上的操作不该顺手改弹层里
		* 尚未保存的选择。弹层下次打开时 {@link syncFromModel} 会按空值重置面板。</p>
		*/
		function clearExpression() {
			model.value = "";
		}
		/**
		* 还原到打开弹层时的表达式与面板状态，本次改动不保留。
		*
		* <p>不负责关弹层 —— 关闭动作由 {@link cancelPanel} 补上。</p>
		*/
		function revertPanel() {
			const back = snapshot.value;
			rawMode.value = false;
			syncFromModel(back);
			model.value = back;
		}
		/** 取消：还原到打开时的表达式与面板状态，本次改动不保留 */
		function cancelPanel() {
			revertPanel();
			open.value = false;
		}
		/** 保存：改动已实时写入 model，关闭即可 */
		function savePanel() {
			open.value = false;
		}
		watch(analysis, (a) => emit("change", trimmed.value, a.valid), { immediate: true });
		return (_ctx, _cache) => {
			const _component_Close = resolveComponent("Close");
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", {
				ref_key: "rootRef",
				ref: rootRef,
				class: normalizeClass(["re-cron", {
					"is-disabled": __props.disabled,
					"is-text": __props.mode === "text"
				}]),
				style: normalizeStyle(__props.width ? { width: typeof __props.width === "number" ? `${__props.width}px` : __props.width } : void 0)
			}, [
				__props.mode === "text" ? (openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("code", {
					class: "re-cron__text-expr",
					title: trimmed.value || void 0
				}, toDisplayString(trimmed.value || "—"), 9, _hoisted_2), !analysis.value.empty ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: normalizeClass(["re-cron__text-human", { "is-error": !analysis.value.valid }]),
					title: textModeHuman.value || void 0
				}, toDisplayString(textModeHuman.value), 11, _hoisted_3)) : createCommentVNode("", true)])) : createCommentVNode("", true),
				__props.mode === "edit" ? (openBlock(), createBlock(unref(ElPopover), {
					key: 1,
					visible: open.value,
					placement: "bottom-start",
					trigger: [],
					width: 360,
					"popper-class": "re-cron__popper",
					"popper-options": POPPER_OPTIONS,
					onAfterLeave: _cache[22] || (_cache[22] = ($event) => open.value = false)
				}, {
					reference: withCtx(() => [createBaseVNode("div", {
						class: "re-cron__line",
						onClick: openPanel
					}, [createBaseVNode("div", _hoisted_4, [
						_cache[25] || (_cache[25] = createBaseVNode("svg", {
							class: "re-cron__bar-icon",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							"stroke-width": "2",
							"stroke-linecap": "round",
							"aria-hidden": "true"
						}, [createBaseVNode("circle", {
							cx: "12",
							cy: "12",
							r: "9"
						}), createBaseVNode("path", { d: "M12 7.5V12l3 2" })], -1)),
						(openBlock(), createElementBlock(Fragment, null, renderList(FIELD_KEYS, (key) => {
							return createBaseVNode("button", {
								key,
								type: "button",
								class: normalizeClass(["re-cron__seg", { "is-active": tab.value === key }]),
								"aria-label": `${LABEL_OF[key]}字段，当前 ${tokenOf(key)}`,
								onClick: withModifiers(($event) => focusField(key), ["stop"])
							}, toDisplayString(tokenOf(key)), 11, _hoisted_5);
						}), 64)),
						trimmed.value && !__props.disabled ? (openBlock(), createElementBlock("button", {
							key: 0,
							type: "button",
							class: "re-cron__clear",
							"aria-label": "清空表达式",
							onClick: withModifiers(clearExpression, ["stop"])
						}, [..._cache[23] || (_cache[23] = [createBaseVNode("svg", {
							class: "re-cron__clear-icon",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							"stroke-width": "2",
							"stroke-linecap": "round",
							"aria-hidden": "true"
						}, [createBaseVNode("path", { d: "M6 6 18 18M18 6 6 18" })], -1)])])) : createCommentVNode("", true),
						createBaseVNode("button", {
							type: "button",
							class: "re-cron__gear",
							"aria-label": "打开调度周期可视化设置",
							title: "可视化生成",
							disabled: __props.disabled,
							tabindex: "-1",
							onClick: withModifiers(openPanel, ["stop"])
						}, [..._cache[24] || (_cache[24] = [createBaseVNode("svg", {
							class: "re-cron__gear-icon",
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							"stroke-width": "2",
							"stroke-linecap": "round",
							"aria-hidden": "true"
						}, [
							createBaseVNode("path", { d: "M4 7h16M4 12h16M4 17h16" }),
							createBaseVNode("circle", {
								cx: "9",
								cy: "7",
								r: "2.4",
								fill: "var(--el-bg-color, #ffffff)"
							}),
							createBaseVNode("circle", {
								cx: "15",
								cy: "12",
								r: "2.4",
								fill: "var(--el-bg-color, #ffffff)"
							}),
							createBaseVNode("circle", {
								cx: "7",
								cy: "17",
								r: "2.4",
								fill: "var(--el-bg-color, #ffffff)"
							})
						], -1)])], 8, _hoisted_6)
					])])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_7, [
						createBaseVNode("header", _hoisted_8, [
							_cache[27] || (_cache[27] = createBaseVNode("span", {
								class: "re-cron__panel-shield",
								"aria-hidden": "true"
							}, [createBaseVNode("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2",
								"stroke-linecap": "round",
								"stroke-linejoin": "round"
							}, [createBaseVNode("path", { d: "M12 3.2 19 6v5.2c0 4.4-2.9 8.2-7 9.6-4.1-1.4-7-5.2-7-9.6V6z" }), createBaseVNode("path", { d: "M9 12l2.1 2.1L15.2 10" })])], -1)),
							createBaseVNode("div", _hoisted_9, [createBaseVNode("div", _hoisted_10, toDisplayString(activeSpec.value.label), 1), createBaseVNode("div", _hoisted_11, toDisplayString(fieldHint.value), 1)]),
							analysis.value.valid && !analysis.value.empty ? (openBlock(), createElementBlock("span", _hoisted_12, [..._cache[26] || (_cache[26] = [createBaseVNode("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2.4",
								"stroke-linecap": "round",
								"stroke-linejoin": "round",
								"aria-hidden": "true"
							}, [createBaseVNode("path", { d: "M4.5 12.5l5 5 10-11" })], -1), createTextVNode(" 有效 ", -1)])])) : createCommentVNode("", true),
							createBaseVNode("button", {
								type: "button",
								class: normalizeClass(["re-cron__mode", { "is-active": panelMode.value === "calendar" }]),
								"aria-pressed": panelMode.value === "calendar",
								onClick: _cache[0] || (_cache[0] = ($event) => panelMode.value = panelMode.value === "calendar" ? "field" : "calendar")
							}, toDisplayString(panelMode.value === "calendar" ? "按字段" : "按日历"), 11, _hoisted_13),
							createBaseVNode("button", {
								type: "button",
								class: "re-cron__panel-close",
								"aria-label": "关闭",
								onClick: cancelPanel
							}, [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(_component_Close)]),
								_: 1
							})])
						]),
						panelMode.value === "calendar" ? (openBlock(), createBlock(ReCronCalendarPanel_default, {
							key: 0,
							ref_key: "calPanelRef",
							ref: calPanelRef,
							expression: model.value,
							onApply: applyCalendar
						}, null, 8, ["expression"])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
							createBaseVNode("div", _hoisted_14, [createBaseVNode("div", _hoisted_15, [(openBlock(true), createElementBlock(Fragment, null, renderList(SPEC[activeSpec.value.key].modes, (mode) => {
								return openBlock(), createElementBlock("button", {
									key: mode,
									type: "button",
									class: normalizeClass(["re-cron__pill", { "is-active": state[activeSpec.value.key].mode === mode }]),
									"aria-pressed": state[activeSpec.value.key].mode === mode,
									onClick: ($event) => setFieldMode(activeSpec.value.key, mode)
								}, toDisplayString(modeLabel(activeSpec.value.key, mode)), 11, _hoisted_16);
							}), 128))]), createBaseVNode("div", _hoisted_17, [state[activeSpec.value.key].mode === "step" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
								_cache[28] || (_cache[28] = createBaseVNode("span", null, "从", -1)),
								createVNode(unref(ReInputNumber_default), {
									modelValue: state[activeSpec.value.key].start,
									"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => state[activeSpec.value.key].start = $event),
									min: activeSpec.value.min,
									max: activeSpec.value.max,
									"controls-position": "right",
									onChange: _cache[2] || (_cache[2] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, [
									"modelValue",
									"min",
									"max"
								]),
								createBaseVNode("span", null, toDisplayString(activeSpec.value.label) + "起，每隔", 1),
								createVNode(unref(ReInputNumber_default), {
									modelValue: state[activeSpec.value.key].step,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => state[activeSpec.value.key].step = $event),
									min: 1,
									max: activeSpec.value.max,
									"controls-position": "right",
									onChange: _cache[4] || (_cache[4] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, ["modelValue", "max"]),
								createBaseVNode("span", null, toDisplayString(activeSpec.value.label), 1)
							], 64)) : state[activeSpec.value.key].mode === "range" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
								createVNode(unref(ReInputNumber_default), {
									modelValue: state[activeSpec.value.key].start,
									"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => state[activeSpec.value.key].start = $event),
									min: activeSpec.value.min,
									max: activeSpec.value.max,
									"controls-position": "right",
									onChange: _cache[6] || (_cache[6] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, [
									"modelValue",
									"min",
									"max"
								]),
								_cache[29] || (_cache[29] = createBaseVNode("span", { class: "re-cron__dash" }, "—", -1)),
								createVNode(unref(ReInputNumber_default), {
									modelValue: state[activeSpec.value.key].end,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => state[activeSpec.value.key].end = $event),
									min: activeSpec.value.min,
									max: activeSpec.value.max,
									"controls-position": "right",
									onChange: _cache[8] || (_cache[8] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, [
									"modelValue",
									"min",
									"max"
								]),
								createBaseVNode("span", null, toDisplayString(activeSpec.value.label) + "，步长", 1),
								createVNode(unref(ReInputNumber_default), {
									modelValue: state[activeSpec.value.key].step,
									"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => state[activeSpec.value.key].step = $event),
									min: 1,
									max: activeSpec.value.max,
									"controls-position": "right",
									onChange: _cache[10] || (_cache[10] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, ["modelValue", "max"])
							], 64)) : state[activeSpec.value.key].mode === "points" ? (openBlock(), createBlock(unref(ReSelect_default), {
								key: 2,
								modelValue: state[activeSpec.value.key].points,
								"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => state[activeSpec.value.key].points = $event),
								multiple: "",
								"collapse-tags": "",
								"collapse-tags-tooltip": "",
								filterable: "",
								class: "re-cron__points",
								style: { "width": "100%" },
								data: optionsOf(activeSpec.value),
								placeholder: `选择${activeSpec.value.label}（${activeSpec.value.min}~${activeSpec.value.max}），可多选，也支持直接输入数字后回车`,
								onChange: _cache[12] || (_cache[12] = ($event) => onFieldInput(activeSpec.value.key))
							}, null, 8, [
								"modelValue",
								"data",
								"placeholder"
							])) : state[activeSpec.value.key].mode === "nearest" ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [
								_cache[30] || (_cache[30] = createBaseVNode("span", null, "当月", -1)),
								createVNode(unref(ReInputNumber_default), {
									modelValue: state[activeSpec.value.key].start,
									"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => state[activeSpec.value.key].start = $event),
									min: 1,
									max: 31,
									"controls-position": "right",
									onChange: _cache[14] || (_cache[14] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, ["modelValue"]),
								_cache[31] || (_cache[31] = createBaseVNode("span", null, "日，就近顺延到工作日", -1))
							], 64)) : state[activeSpec.value.key].mode === "nth" ? (openBlock(), createElementBlock(Fragment, { key: 4 }, [
								_cache[32] || (_cache[32] = createBaseVNode("span", null, "第", -1)),
								createVNode(unref(ReInputNumber_default), {
									modelValue: state[activeSpec.value.key].nth,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => state[activeSpec.value.key].nth = $event),
									min: 1,
									max: 5,
									"controls-position": "right",
									onChange: _cache[16] || (_cache[16] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, ["modelValue"]),
								_cache[33] || (_cache[33] = createBaseVNode("span", null, "个", -1)),
								createVNode(unref(ReSelect_default), {
									modelValue: state[activeSpec.value.key].start,
									"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => state[activeSpec.value.key].start = $event),
									class: "re-cron__nth",
									style: { "width": "96px" },
									data: unref(WEEK_OPTIONS),
									onChange: _cache[18] || (_cache[18] = ($event) => onFieldInput(activeSpec.value.key))
								}, null, 8, ["modelValue", "data"])
							], 64)) : state[activeSpec.value.key].mode === "lastNth" ? (openBlock(), createElementBlock(Fragment, { key: 5 }, [_cache[34] || (_cache[34] = createBaseVNode("span", null, "当月最后一个", -1)), createVNode(unref(ReSelect_default), {
								modelValue: state[activeSpec.value.key].start,
								"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => state[activeSpec.value.key].start = $event),
								class: "re-cron__nth",
								style: { "width": "96px" },
								data: unref(WEEK_OPTIONS),
								onChange: _cache[20] || (_cache[20] = ($event) => onFieldInput(activeSpec.value.key))
							}, null, 8, ["modelValue", "data"])], 64)) : state[activeSpec.value.key].mode === "last" ? (openBlock(), createElementBlock(Fragment, { key: 6 }, [createBaseVNode("span", null, toDisplayString(activeSpec.value.key === "week" ? "当月中与月末同星期的那些天" : "当月最后一天"), 1), rawTokens[activeSpec.value.key] && rawTokens[activeSpec.value.key] !== "L" ? (openBlock(), createElementBlock("span", _hoisted_18, [
								_cache[35] || (_cache[35] = createTextVNode(" 写作 ", -1)),
								createBaseVNode("code", null, toDisplayString(rawTokens[activeSpec.value.key]), 1),
								_cache[36] || (_cache[36] = createTextVNode("，与 ", -1)),
								_cache[37] || (_cache[37] = createBaseVNode("code", null, "L", -1)),
								_cache[38] || (_cache[38] = createTextVNode(" 同义 ", -1))
							])) : createCommentVNode("", true)], 64)) : (openBlock(), createElementBlock("span", _hoisted_19, [..._cache[39] || (_cache[39] = [
								createTextVNode("该字段不做限制（", -1),
								createBaseVNode("code", null, "*", -1),
								createTextVNode("）", -1)
							])]))])]),
							activeSpec.value.key === "week" || activeSpec.value.key === "day" ? (openBlock(), createElementBlock("div", _hoisted_20, [..._cache[40] || (_cache[40] = [
								createTextVNode(" 日与周同时受限时任一条件都会失效，本组件一律用 ", -1),
								createBaseVNode("code", null, "*", -1),
								createTextVNode(" 占位另一侧，保证与后端算出的触发时间一致。 ", -1)
							])])) : createCommentVNode("", true),
							createBaseVNode("div", _hoisted_21, [_cache[41] || (_cache[41] = createBaseVNode("span", { class: "re-cron__preset-title" }, "常用", -1)), createBaseVNode("div", _hoisted_22, [
								(openBlock(true), createElementBlock(Fragment, null, renderList(visiblePresets.value, (preset) => {
									return openBlock(), createElementBlock("button", {
										key: preset.cron,
										type: "button",
										class: normalizeClass(["re-cron__pill", { "is-active": trimmed.value === preset.cron }]),
										"aria-pressed": trimmed.value === preset.cron,
										onClick: ($event) => applyPreset(preset.cron)
									}, toDisplayString(preset.label), 11, _hoisted_23);
								}), 128)),
								PRESETS_MORE.length ? (openBlock(), createElementBlock("button", {
									key: 0,
									type: "button",
									class: "re-cron__pill re-cron__pill--more",
									onClick: _cache[21] || (_cache[21] = ($event) => presetsExpanded.value = !presetsExpanded.value)
								}, toDisplayString(presetsExpanded.value ? "收起" : "更多"), 1)) : createCommentVNode("", true),
								__props.defaultCron ? (openBlock(), createElementBlock("button", {
									key: 1,
									type: "button",
									class: "re-cron__pill re-cron__pill--more",
									onClick: applyDefaultCron
								}, " 用默认 ")) : createCommentVNode("", true)
							])]),
							analysis.value.times.length ? (openBlock(), createElementBlock("div", _hoisted_24, [_cache[42] || (_cache[42] = createBaseVNode("span", { class: "re-cron__section-title" }, "下次触发", -1)), createBaseVNode("ul", _hoisted_25, [(openBlock(true), createElementBlock(Fragment, null, renderList(analysis.value.times.slice(0, 3), (t, i) => {
								return openBlock(), createElementBlock("li", { key: i }, [createBaseVNode("span", _hoisted_26, toDisplayString(dayLabel(t)) + " " + toDisplayString(timeLabel(t)), 1)]);
							}), 128))])])) : createCommentVNode("", true),
							notUnderstood.value.length ? (openBlock(), createElementBlock("div", _hoisted_27, [createBaseVNode("span", _hoisted_28, [(openBlock(true), createElementBlock(Fragment, null, renderList(notUnderstood.value, (label, i) => {
								return openBlock(), createElementBlock(Fragment, { key: label }, [i > 0 ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("、")], 64)) : createCommentVNode("", true), createTextVNode(toDisplayString(label) + "字段的写法面板表达不了 ", 1)], 64);
							}), 128))]), createVNode(unref(ReButton_default), {
								type: "primary",
								plain: "",
								onClick: useExpressionText
							}, {
								default: withCtx(() => [..._cache[43] || (_cache[43] = [createTextVNode("按 * 重建", -1)])]),
								_: 1
							})])) : createCommentVNode("", true)
						], 64)),
						createBaseVNode("div", _hoisted_29, [createBaseVNode("span", { class: normalizeClass(["re-cron__footer-hint", {
							"is-error": !analysis.value.valid && !analysis.value.empty,
							"is-info": analysis.value.empty || analysis.value.valid && !syncWarning.value
						}]) }, toDisplayString(footerHint.value), 3), createBaseVNode("div", _hoisted_30, [
							createVNode(unref(ReButton_default), { onClick: clearAll }, {
								default: withCtx(() => [..._cache[44] || (_cache[44] = [createTextVNode("清空", -1)])]),
								_: 1
							}),
							panelMode.value === "calendar" ? (openBlock(), createBlock(unref(ReButton_default), {
								key: 0,
								type: "primary",
								plain: "",
								onClick: applyCalendarFromPanel
							}, {
								default: withCtx(() => [..._cache[45] || (_cache[45] = [createTextVNode(" 应用到表达式 ", -1)])]),
								_: 1
							})) : createCommentVNode("", true),
							createVNode(unref(ReButton_default), {
								type: "primary",
								onClick: savePanel
							}, {
								default: withCtx(() => [..._cache[46] || (_cache[46] = [createTextVNode("完成", -1)])]),
								_: 1
							})
						])])
					])]),
					_: 1
				}, 8, ["visible"])) : createCommentVNode("", true),
				__props.mode === "edit" ? (openBlock(), createElementBlock("div", {
					key: 2,
					class: normalizeClass(["re-cron__status", analysis.value.valid ? "is-ok" : "is-warn"]),
					role: "status",
					"aria-live": "polite",
					"aria-atomic": true
				}, [analysis.value.valid ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
					_cache[49] || (_cache[49] = createBaseVNode("span", null, "合法", -1)),
					_cache[50] || (_cache[50] = createBaseVNode("span", {
						class: "re-cron__dot",
						"aria-hidden": "true"
					}, "·", -1)),
					createBaseVNode("span", null, "下次 " + toDisplayString(fmt(analysis.value.times[0])), 1),
					humanSummary.value || summary.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [_cache[47] || (_cache[47] = createBaseVNode("span", {
						class: "re-cron__dot",
						"aria-hidden": "true"
					}, "·", -1)), createBaseVNode("span", null, toDisplayString(humanSummary.value || summary.value), 1)], 64)) : createCommentVNode("", true),
					syncBadge.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [_cache[48] || (_cache[48] = createBaseVNode("span", {
						class: "re-cron__dot",
						"aria-hidden": "true"
					}, "·", -1)), createBaseVNode("span", _hoisted_31, toDisplayString(syncBadge.value), 1)], 64)) : createCommentVNode("", true)
				], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(errorText.value), 1)], 64))], 2)) : createCommentVNode("", true)
			], 6);
		};
	}
}), [["__scopeId", "data-v-4e7af6d6"]]);
//#endregion
//#region ../../packages/ui/src/components/ReCron/index.ts
var plugin = { install(app) {
	app.component("ReCron", ReCron_default$1);
} };
var ReCron_default = ReCron_default$1;
//#endregion
export { plugin as n, ReCron_default as t };
