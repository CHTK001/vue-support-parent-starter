import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReProcessTask/ReProcessTask.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "ic-spin",
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.4",
	"stroke-linecap": "round"
};
var _hoisted_2 = {
	key: 1,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.6",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
var _hoisted_3 = {
	key: 2,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.6",
	"stroke-linecap": "round"
};
var _hoisted_4 = { class: "re-process__bar-title" };
var _hoisted_5 = { class: "re-process__count" };
var _hoisted_6 = ["title"];
var _hoisted_7 = {
	key: 0,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
};
var _hoisted_8 = {
	key: 1,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round"
};
var _hoisted_9 = ["title", "onClick"];
var _hoisted_10 = { class: "task-tab__label" };
var _hoisted_11 = {
	key: 0,
	class: "rp-stackbar"
};
var _hoisted_12 = { class: "rp-stackbar__count" };
var _hoisted_13 = ["title"];
var _hoisted_14 = { class: "rp-pill__body" };
var _hoisted_15 = { class: "rp-pill__status" };
var _hoisted_16 = {
	key: 0,
	class: "rp-pill__count-badge"
};
var _hoisted_17 = { class: "rp-pill__state" };
var _hoisted_18 = {
	key: 0,
	class: "ic-spin",
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.4",
	"stroke-linecap": "round"
};
var _hoisted_19 = {
	key: 1,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.6",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
var _hoisted_20 = {
	key: 2,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.6",
	"stroke-linecap": "round"
};
var _hoisted_21 = ["title", "onClick"];
var _hoisted_22 = { class: "rp-pill__status" };
var _hoisted_23 = { class: "rp-pill__name" };
var _hoisted_24 = ["onClick"];
var _hoisted_25 = ["onClick"];
var _hoisted_26 = {
	key: 3,
	class: "re-process__content"
};
var _hoisted_27 = { class: "re-process__head" };
var _hoisted_28 = { class: "re-process__step" };
var _hoisted_29 = {
	key: 0,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.4",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
var _hoisted_30 = {
	key: 1,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2.4",
	"stroke-linecap": "round"
};
var MIN_H = 46;
var GAP = 16;
var MAX_PILLS = 5;
//#endregion
//#region ../../packages/ui/src/components/ReProcessTask/ReProcessTask.vue
var ReProcessTask_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReProcessTask",
	__name: "ReProcessTask",
	props: {
		tasks: {},
		autoCollapse: {
			type: Boolean,
			default: true
		}
	},
	emits: ["close"],
	setup(__props, { emit: __emit }) {
		/**
		* ReProcessTask —— 多任务堆叠的过程任务浮层
		*
		* 用于长耗时操作（项目启停/升级/备份/回滚、软件安装）实时展示：
		* 进度条 + 当前步骤 + 终端风格日志（自动滚底）+ 结果状态。
		*
		* 多个任务只渲染「一个」浮层：
		* - 标题栏可左右切换任务（显示 当前/总数），新任务产生时自动切到最新
		* - 标题栏下方任务条按任务显示状态色（运行中呼吸 / 成功 / 失败），点击即切换
		* - 可最小化为小条（显示 进行中/总数），默认停靠右下角
		* - 标题栏可拖拽，自动限制在视口内
		* - 纯展示组件：任务数据通过 tasks 传入，关闭通过事件回调（通用、不绑定业务）
		*
		* @author CH
		* @since 4.0.0.42
		*/
		/**
		* 任务数据（与业务侧 ProcessTask 结构对齐）
		*/
		const props = __props;
		const emit = __emit;
		/**
		* 展开尺寸
		*/
		const rootEl = ref();
		const logEl = ref();
		/** 容器内部状态：当前任务下标 / 最小化 / 拖拽坐标 */
		const activeIndex = ref(0);
		const minimized = ref(false);
		const pos = ref(null);
		/**
		* 操作中文标签
		*/
		const opLabel = {
			start: "启动",
			stop: "停止",
			restart: "重启",
			upgrade: "升级",
			backup: "备份",
			rollback: "回滚",
			install: "安装"
		};
		function opText(t) {
			return opLabel[t.operation] ?? t.operation ?? "操作";
		}
		/**
		* 当前展示任务（带边界保护）
		*/
		const activeTask = computed(() => {
			if (!props.tasks.length) return;
			const i = Math.min(activeIndex.value, props.tasks.length - 1);
			return props.tasks[i];
		});
		const operationText = computed(() => activeTask.value ? opText(activeTask.value) : "操作");
		/**
		* el-progress 状态
		*/
		const progressStatus = computed(() => {
			if (!activeTask.value || !activeTask.value.finished) return "";
			return activeTask.value.success ? "success" : "exception";
		});
		computed(() => props.tasks.filter((t) => !t.finished).length);
		/**
		* 任务数组变化：新任务加入时切到最新；下标越界时回收
		*/
		watch(() => props.tasks.length, (n, old) => {
			if (n === 0) return;
			if (n > (old ?? 0)) activeIndex.value = n - 1;
			else if (activeIndex.value > n - 1) activeIndex.value = n - 1;
		});
		function prevTask() {
			if (props.tasks.length < 2) return;
			activeIndex.value = (activeIndex.value - 1 + props.tasks.length) % props.tasks.length;
		}
		function nextTask() {
			if (props.tasks.length < 2) return;
			activeIndex.value = (activeIndex.value + 1) % props.tasks.length;
		}
		function selectTask(i) {
			activeIndex.value = i;
		}
		/**
		* 浮层定位：拖拽后用绝对坐标，否则默认右下角（单一浮层，不再按序号堆叠）
		*/
		const panelStyle = computed(() => {
			if (pos.value) return {
				left: `${pos.value.x}px`,
				top: `${pos.value.y}px`
			};
			return {
				right: `${GAP}px`,
				bottom: `${GAP}px`
			};
		});
		/**
		* 标题栏拖拽
		*/
		function startDrag(event) {
			const root = rootEl.value;
			if (!root) return;
			event.preventDefault();
			const startX = event.clientX;
			const startY = event.clientY;
			const rect = root.getBoundingClientRect();
			const origX = rect.left;
			const origY = rect.top;
			const move = (ev) => {
				const maxX = window.innerWidth - 120;
				const maxY = window.innerHeight - MIN_H;
				let nx = origX + (ev.clientX - startX);
				let ny = origY + (ev.clientY - startY);
				nx = Math.max(-260, Math.min(maxX, nx));
				ny = Math.max(0, Math.min(maxY, ny));
				pos.value = {
					x: nx,
					y: ny
				};
			};
			const up = () => {
				document.removeEventListener("mousemove", move);
				document.removeEventListener("mouseup", up);
			};
			document.addEventListener("mousemove", move);
			document.addEventListener("mouseup", up);
		}
		/**
		* 日志自动滚底（切换任务或有新行时）
		*/
		watch([() => activeTask.value?.taskId, () => activeTask.value?.logs.length], () => {
			if (logEl.value && activeTask.value) logEl.value.scrollTop = logEl.value.scrollHeight;
		});
		function onClose() {
			if (activeTask.value) emit("close", activeTask.value.taskId);
		}
		function closeTask(taskId) {
			emit("close", taskId);
		}
		function toggleMinimize() {
			minimized.value = !minimized.value;
		}
		/** 从胶囊「立即查看」：切到该任务并展开完整面板 */
		function viewTask(i) {
			activeIndex.value = i;
			minimized.value = false;
		}
		/** 胶囊粗体状态文案：启动中 / 启动完成 / 启动失败 */
		function pillStatusText(t) {
			const op = opText(t);
			if (!t.finished) return `${op}中`;
			return t.success ? `${op}完成` : `${op}失败`;
		}
		/**
		* 最小化堆叠「最多显示胶囊数」：仅渲染最近的 N 个，更早的折叠为提示胶囊
		*/
		const hiddenCount = computed(() => Math.max(0, props.tasks.length - MAX_PILLS));
		/** 实际渲染的胶囊（携带任务在 tasks 中的原始下标，供 viewTask 使用） */
		const visiblePills = computed(() => {
			const n = props.tasks.length;
			const start = Math.max(0, n - MAX_PILLS);
			const out = [];
			for (let i = start; i < n; i++) out.push({
				t: props.tasks[i],
				i
			});
			return out;
		});
		/** 一键清空：对全部任务逐一 emit close（业务侧据此移除） */
		function clearAll() {
			props.tasks.map((t) => t.taskId).forEach((id) => emit("close", id));
		}
		/** 点击「+N 个更早」：展开面板并定位到最早任务（面板内任务条可切换全部） */
		function showOldest() {
			activeIndex.value = 0;
			minimized.value = false;
		}
		/** 堆叠是否处于悬停展开态 */
		const stackHovered = ref(false);
		let leaveTimer = null;
		function onStackEnter() {
			if (leaveTimer) {
				clearTimeout(leaveTimer);
				leaveTimer = null;
			}
			stackHovered.value = true;
		}
		function onStackLeave() {
			if (leaveTimer) clearTimeout(leaveTimer);
			leaveTimer = setTimeout(() => {
				stackHovered.value = false;
				leaveTimer = null;
			}, 200);
		}
		/** 是否处于「折叠为单个胶囊」态 */
		const stackCollapsed = computed(() => minimized.value && props.autoCollapse && props.tasks.length > 1 && !stackHovered.value);
		/** 折叠态只渲染最新胶囊；展开态渲染可见胶囊（受 MAX_PILLS 限制） */
		const renderPills = computed(() => {
			if (stackCollapsed.value) {
				const last = props.tasks.length - 1;
				return [{
					t: props.tasks[last],
					i: last
				}];
			}
			return visiblePills.value;
		});
		return (_ctx, _cache) => {
			const _component_el_progress = resolveComponent("el-progress");
			return activeTask.value ? (openBlock(), createElementBlock("div", {
				key: 0,
				ref_key: "rootEl",
				ref: rootEl,
				class: normalizeClass(["re-process", {
					"re-process--min": minimized.value,
					"re-process--running": activeTask.value && !activeTask.value.finished,
					"re-process--success": activeTask.value && activeTask.value.finished && activeTask.value.success,
					"re-process--error": activeTask.value && activeTask.value.finished && !activeTask.value.success
				}]),
				style: normalizeStyle(panelStyle.value)
			}, [
				!minimized.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "re-process__bar",
					onMousedown: startDrag
				}, [
					createBaseVNode("span", { class: normalizeClass(["re-process__state", {
						"is-spin": activeTask.value && !activeTask.value.finished,
						"is-ok": activeTask.value && activeTask.value.finished && activeTask.value.success,
						"is-err": activeTask.value && activeTask.value.finished && !activeTask.value.success
					}]) }, [!activeTask.value.finished ? (openBlock(), createElementBlock("svg", _hoisted_1, [..._cache[2] || (_cache[2] = [createBaseVNode("path", { d: "M21 12a9 9 0 1 1-6.2-8.55" }, null, -1)])])) : activeTask.value.success ? (openBlock(), createElementBlock("svg", _hoisted_2, [..._cache[3] || (_cache[3] = [createBaseVNode("path", { d: "M20 6L9 17l-5-5" }, null, -1)])])) : (openBlock(), createElementBlock("svg", _hoisted_3, [..._cache[4] || (_cache[4] = [createBaseVNode("path", { d: "M18 6L6 18M6 6l12 12" }, null, -1)])]))], 2),
					createBaseVNode("span", _hoisted_4, toDisplayString(operationText.value) + " · " + toDisplayString(activeTask.value.title), 1),
					createBaseVNode("div", {
						class: "re-process__bar-actions",
						onMousedown: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
					}, [
						__props.tasks.length > 1 ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
							createBaseVNode("button", {
								class: "re-process__switch",
								type: "button",
								title: "上一个任务",
								onClick: prevTask
							}, [..._cache[5] || (_cache[5] = [createBaseVNode("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2.2",
								"stroke-linecap": "round",
								"stroke-linejoin": "round"
							}, [createBaseVNode("path", { d: "M15 18l-6-6 6-6" })], -1)])]),
							createBaseVNode("span", _hoisted_5, toDisplayString(activeIndex.value + 1) + "/" + toDisplayString(__props.tasks.length), 1),
							createBaseVNode("button", {
								class: "re-process__switch",
								type: "button",
								title: "下一个任务",
								onClick: nextTask
							}, [..._cache[6] || (_cache[6] = [createBaseVNode("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2.2",
								"stroke-linecap": "round",
								"stroke-linejoin": "round"
							}, [createBaseVNode("path", { d: "M9 18l6-6-6-6" })], -1)])]),
							_cache[7] || (_cache[7] = createBaseVNode("span", { class: "re-process__switch-gap" }, null, -1))
						], 64)) : createCommentVNode("", true),
						createBaseVNode("button", {
							class: "re-process__btn",
							type: "button",
							title: minimized.value ? "还原" : "最小化",
							onClick: toggleMinimize
						}, [!minimized.value ? (openBlock(), createElementBlock("svg", _hoisted_7, [..._cache[8] || (_cache[8] = [createBaseVNode("path", { d: "M5 12h14" }, null, -1)])])) : (openBlock(), createElementBlock("svg", _hoisted_8, [..._cache[9] || (_cache[9] = [createBaseVNode("path", { d: "M4 14h16" }, null, -1)])]))], 8, _hoisted_6),
						createBaseVNode("button", {
							class: "re-process__btn re-process__btn--close",
							type: "button",
							title: "关闭当前任务",
							onClick: onClose
						}, [..._cache[10] || (_cache[10] = [createBaseVNode("svg", {
							viewBox: "0 0 24 24",
							fill: "none",
							stroke: "currentColor",
							"stroke-width": "2",
							"stroke-linecap": "round"
						}, [createBaseVNode("path", { d: "M18 6L6 18M6 6l12 12" })], -1)])])
					], 32)
				], 32)) : createCommentVNode("", true),
				!minimized.value && __props.tasks.length > 1 ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: "task-tabs",
					onMousedown: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tasks, (t, i) => {
					return openBlock(), createElementBlock("button", {
						key: t.taskId,
						type: "button",
						class: normalizeClass(["task-tab", {
							"is-active": i === activeIndex.value,
							"is-run": !t.finished,
							"is-ok": t.finished && t.success,
							"is-err": t.finished && !t.success
						}]),
						title: opText(t) + " · " + t.title,
						onClick: ($event) => selectTask(i)
					}, [_cache[11] || (_cache[11] = createBaseVNode("span", { class: "task-tab__dot" }, null, -1)), createBaseVNode("span", _hoisted_10, toDisplayString(opText(t)) + " · " + toDisplayString(t.title), 1)], 10, _hoisted_9);
				}), 128))], 32)) : createCommentVNode("", true),
				minimized.value ? (openBlock(), createElementBlock("div", {
					key: 2,
					class: normalizeClass(["re-process__stack", { "re-process__stack--collapsed": stackCollapsed.value }]),
					onMouseenter: onStackEnter,
					onMouseleave: onStackLeave
				}, [
					!stackCollapsed.value && __props.tasks.length > 1 ? (openBlock(), createElementBlock("div", _hoisted_11, [createBaseVNode("span", _hoisted_12, "共 " + toDisplayString(__props.tasks.length) + " 个任务", 1), createBaseVNode("button", {
						class: "rp-stackbar__clear",
						type: "button",
						title: "关闭并清空全部任务",
						onClick: clearAll
					}, [..._cache[12] || (_cache[12] = [createBaseVNode("svg", {
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2",
						"stroke-linecap": "round",
						"stroke-linejoin": "round"
					}, [createBaseVNode("path", { d: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }), createBaseVNode("path", { d: "M10 11v6M14 11v6" })], -1), createTextVNode(" 清空全部 ", -1)])])])) : createCommentVNode("", true),
					!stackCollapsed.value && hiddenCount.value > 0 ? (openBlock(), createElementBlock("button", {
						key: 1,
						class: "rp-pill rp-pill--more",
						type: "button",
						title: "还有 " + hiddenCount.value + " 个更早任务",
						onClick: showOldest
					}, [_cache[14] || (_cache[14] = createBaseVNode("span", { class: "rp-pill__state rp-pill__state--muted" }, [createBaseVNode("svg", {
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2.4",
						"stroke-linecap": "round"
					}, [createBaseVNode("path", { d: "M13 6l-6 6 6 6M20 6l-6 6 6 6" })])], -1)), createBaseVNode("span", _hoisted_14, [createBaseVNode("span", _hoisted_15, "+" + toDisplayString(hiddenCount.value) + " 个更早任务…", 1), _cache[13] || (_cache[13] = createBaseVNode("span", { class: "rp-pill__name" }, "点击展开查看全部", -1))])], 8, _hoisted_13)) : createCommentVNode("", true),
					(openBlock(true), createElementBlock(Fragment, null, renderList(renderPills.value, (entry) => {
						return openBlock(), createElementBlock("div", {
							key: entry.t.taskId,
							class: normalizeClass(["rp-pill", {
								"rp-pill--stacktop": stackCollapsed.value,
								"is-run": !entry.t.finished,
								"is-ok": entry.t.finished && entry.t.success,
								"is-err": entry.t.finished && !entry.t.success
							}])
						}, [
							stackCollapsed.value ? (openBlock(), createElementBlock("span", _hoisted_16, "+" + toDisplayString(__props.tasks.length - 1), 1)) : createCommentVNode("", true),
							createBaseVNode("span", _hoisted_17, [!entry.t.finished ? (openBlock(), createElementBlock("svg", _hoisted_18, [..._cache[15] || (_cache[15] = [createBaseVNode("path", { d: "M21 12a9 9 0 1 1-6.2-8.55" }, null, -1)])])) : entry.t.success ? (openBlock(), createElementBlock("svg", _hoisted_19, [..._cache[16] || (_cache[16] = [createBaseVNode("path", { d: "M20 6L9 17l-5-5" }, null, -1)])])) : (openBlock(), createElementBlock("svg", _hoisted_20, [..._cache[17] || (_cache[17] = [createBaseVNode("path", { d: "M18 6L6 18M6 6l12 12" }, null, -1)])]))]),
							createBaseVNode("span", {
								class: "rp-pill__body",
								title: pillStatusText(entry.t) + " · " + entry.t.title,
								onClick: ($event) => viewTask(entry.i)
							}, [createBaseVNode("span", _hoisted_22, toDisplayString(pillStatusText(entry.t)), 1), createBaseVNode("span", _hoisted_23, toDisplayString(entry.t.title), 1)], 8, _hoisted_21),
							createBaseVNode("button", {
								class: "rp-pill__view",
								type: "button",
								title: "展开完整进度",
								onClick: ($event) => viewTask(entry.i)
							}, "立即查看", 8, _hoisted_24),
							createBaseVNode("button", {
								class: "rp-pill__close",
								type: "button",
								title: "关闭",
								onClick: withModifiers(($event) => closeTask(entry.t.taskId), ["stop"])
							}, [..._cache[18] || (_cache[18] = [createBaseVNode("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "2",
								"stroke-linecap": "round"
							}, [createBaseVNode("path", { d: "M18 6L6 18M6 6l12 12" })], -1)])], 8, _hoisted_25)
						], 2);
					}), 128))
				], 34)) : (openBlock(), createElementBlock("div", _hoisted_26, [
					createBaseVNode("div", _hoisted_27, [createVNode(_component_el_progress, {
						percentage: activeTask.value.progress,
						status: progressStatus.value,
						"stroke-width": 8,
						striped: !activeTask.value.finished,
						"striped-flow": !activeTask.value.finished
					}, null, 8, [
						"percentage",
						"status",
						"striped",
						"striped-flow"
					]), createBaseVNode("div", _hoisted_28, [_cache[19] || (_cache[19] = createBaseVNode("svg", {
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2",
						"stroke-linecap": "round",
						"stroke-linejoin": "round"
					}, [createBaseVNode("circle", {
						cx: "12",
						cy: "12",
						r: "9",
						opacity: "0.4"
					}), createBaseVNode("path", { d: "M12 7v5l3 2" })], -1)), createBaseVNode("span", null, toDisplayString(activeTask.value.currentStep), 1)])]),
					createBaseVNode("div", {
						ref_key: "logEl",
						ref: logEl,
						class: "re-process__terminal"
					}, [(openBlock(true), createElementBlock(Fragment, null, renderList(activeTask.value.logs, (line, i) => {
						return openBlock(), createElementBlock("div", {
							key: i,
							class: "re-process__log-line"
						}, toDisplayString(line || " "), 1);
					}), 128))], 512),
					activeTask.value.finished ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass(["re-process__result", activeTask.value.success ? "is-ok" : "is-err"])
					}, [activeTask.value.success ? (openBlock(), createElementBlock("svg", _hoisted_29, [..._cache[20] || (_cache[20] = [createBaseVNode("path", { d: "M22 11.1V12a10 10 0 1 1-5.9-9.1" }, null, -1), createBaseVNode("path", { d: "M22 4L12 14l-3-3" }, null, -1)])])) : (openBlock(), createElementBlock("svg", _hoisted_30, [..._cache[21] || (_cache[21] = [createBaseVNode("circle", {
						cx: "12",
						cy: "12",
						r: "10"
					}, null, -1), createBaseVNode("path", { d: "M12 8v5M12 16h.01" }, null, -1)])])), createBaseVNode("span", null, [createTextVNode(toDisplayString(activeTask.value.success ? "操作成功" : "操作失败"), 1), activeTask.value.message ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("：" + toDisplayString(activeTask.value.message), 1)], 64)) : createCommentVNode("", true)])], 2)) : createCommentVNode("", true)
				]))
			], 6)) : createCommentVNode("", true);
		};
	}
}), [["__scopeId", "data-v-c1360f49"]]);
//#endregion
export { ReProcessTask_default as t };
