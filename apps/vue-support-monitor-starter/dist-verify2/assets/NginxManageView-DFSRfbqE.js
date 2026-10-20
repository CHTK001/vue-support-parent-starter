import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wn as toRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { r as ElSelect } from "./select-0mzxLp1O.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { yt as message } from "./src-CEonioA3.js";
import { x as http } from "./src-DDwlSqPX.js";
import { i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { f as ReOption, t as ReAlert, u as ReFormItem } from "./ReKit-CFSh6vls.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as ReForm_default } from "./ReForm-BHwHC8j0.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
import { t as ReTab_default } from "./ReTab-y-lcvWJm.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as DsmContextMenu_default } from "./DsmContextMenu-BEoagIWo.js";
import { n as token, r as useEchart, t as URL_TREND_COLORS } from "./useEchart-QklTP6NK.js";
import { A as startNginx, C as fetchNginxUrlTrend, D as restartNginx, E as reloadNginx, M as testNginx, O as restoreNginxBackup, S as fetchNginxTrend, T as regenerateNginxToken, _ as fetchNginxLogFiles, a as deleteNginxBackups, b as fetchNginxSources, c as fetchNginxBackupContent, d as fetchNginxConfig, f as fetchNginxConfigFiles, g as fetchNginxLogChunk, h as fetchNginxDirectives, j as stopNginx, k as saveNginxDashboard, l as fetchNginxBackupDiff, m as fetchNginxDashboard, n as backupNginxConfig, p as fetchNginxConfigTree, r as createNgxConsoleContext, s as fetchNginxAccessTop, t as applyNginxConfig, u as fetchNginxBackups, v as fetchNginxOverview, w as nginxMetricStreamUrl, x as fetchNginxTemplates, y as fetchNginxSites } from "./api-5Dnrf3ch.js";
import { n as HomePreview_default, t as WidgetLibrary_default } from "./WidgetLibrary-E_wqJbS9.js";
import { t as ReSkeleton_default } from "./ReSkeleton-Doy9_0TU.js";
import "./surface-Bdspw2jE.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
import { a as STAT_METRICS, c as emptyNgxLayout, d as serializeNgxLayout, i as NGX_CTX_KEY, l as newNgxCardId, n as NGX_CARD_CATALOG, o as TABLE_DIMENSIONS, r as NGX_CARD_META, s as TREND_METRICS, t as NgxCardRenderer_default, u as parseNgxLayout } from "./NgxCardRenderer-CM5mDifO.js";
//#region ../../pages/datasource/src/components/console/NginxLifecycleBar.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$12 = { class: "ngx-lifecycle" };
var _hoisted_2$12 = ["title"];
var _hoisted_3$12 = {
	key: 0,
	class: "ngx-result"
};
var _hoisted_4$11 = {
	key: 0,
	class: "ngx-result-block"
};
var _hoisted_5$10 = { class: "ngx-result-pre" };
var _hoisted_6$10 = {
	key: 1,
	class: "ngx-result-block"
};
var _hoisted_7$10 = { class: "ngx-result-pre is-err" };
//#endregion
//#region ../../pages/datasource/src/components/console/NginxLifecycleBar.vue
var NginxLifecycleBar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxLifecycleBar",
	props: {
		datasourceId: {},
		running: {}
	},
	emits: ["changed"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 正在执行的操作 */
		const busy = ref("");
		/** 最近一次结果 */
		const result = ref(null);
		const resultVisible = ref(false);
		const isRunning = computed(() => props.running === "RUNNING");
		const canReload = computed(() => isRunning.value);
		const canRestart = computed(() => isRunning.value);
		const canStop = computed(() => isRunning.value);
		const canStart = computed(() => !isRunning.value);
		/** 操作提示：把"这个按钮现在该点哪个"直接写在按钮旁边 */
		const tipText = computed(() => {
			if (!props.datasourceId) return "请先选择数据源";
			if (props.running === "STOPPED") return "当前已停止：只有「启动」可用，拉起后再校验与重载";
			if (props.running === "UNKNOWN") return "未检测到运行中的进程（可能是 SSH 用户无权 pgrep）：可先「启动」";
			return "改了配置先「校验」，通过后「重载」生效；「重启」会中断连接";
		});
		const resultTitle = computed(() => busy.value ? `${labelOf(busy.value)}结果` : "操作结果");
		function labelOf(op) {
			return {
				test: "语法检查",
				reload: "重载",
				restart: "重启",
				start: "启动",
				stop: "停止"
			}[op] || op;
		}
		/**
		* 「停止/启动没能生效」的告警。
		*
		* <p>这类情况点一次按钮看不出来：按钮不报错、弹窗也只是干巴巴一句
		* 「已发送停止信号」，用户只会以为按钮坏了。真正的原因有两个，都得说清楚：</p>
		*
		* <ol>
		*   <li><b>缺少 sudo 权限</b>：nginx 由 systemd 托管时，停止必须走
		*       {@code systemctl stop}，那要改系统级服务状态。数据源的 SSH 用户
		*       （如 {@code kali}）默认没有免密 sudo，于是只能退回发信号，
		*       而单元配了 {@code Restart=always} 会把 nginx 立刻拉回——
		*       表现为「停了但没停住」。</li>
		*   <li><b>托管者自动重启</b>：权限没问题，但单元配了自动重启策略。</li>
		* </ol>
		*
		* <p>只根据后端返回的文案判定，不自己猜——后端已经如实写明了原因，
		* 这里只负责把它翻译成人能照着做的步骤。</p>
		*/
		const blockedHint = computed(() => {
			const r = result.value;
			if (!r) return null;
			const text = `${r.message || ""} ${r.stderr || ""}`;
			if (/sudo|permission denied|access denied|requires interactive|not permitted/i.test(text)) return {
				title: "停止/启动未生效：SSH 用户缺少 systemctl 的免密 sudo 权限",
				detail: "nginx 由 systemd 托管时，启停必须走 systemctl（那是系统级操作），而数据源配置的 SSH 用户没有免密权限，控制台只能退回发信号的方式；若该单元配了 Restart=always，nginx 会被立刻拉回，表现为「停了没停住」。修复：在目标主机上为该用户加一条限定的免密规则，例如 echo 'kali ALL=(root) NOPASSWD: /usr/bin/systemctl start,stop,restart ngx-console' | sudo tee /etc/sudoers.d/ngx-console，并执行 sudo chmod 0440 /etc/sudoers.d/ngx-console。只放行这一个单元的启停即可，不要图省事写 NOPASSWD: ALL。"
			};
			if (/仍未退出|尚未退出|Restart=always|进程管理器|守护/.test(text)) return {
				title: "停止未生效：nginx 被进程管理器自动拉回",
				detail: "控制台已经成功向 nginx 发出停止信号，但托管它的 systemd 单元配了自动重启（Restart=always 之类），几秒后就把 nginx 重新拉起了——所以接口只能如实报告「已发信号但未退出」，而不是谎报成功。两种处理：① 保持崩溃自愈，给控制台的 SSH 用户加该单元的免密 systemctl 权限（见后端日志）；② 完全交给控制台管，把该单元改为 Restart=no。"
			};
			return null;
		});
		/** 各操作的说明，用于二次确认文案 */
		const CONFIRM = {
			restart: {
				title: "确认重启 Nginx？",
				body: "重启会先让旧进程处理完手上的请求再退出，然后重新拉起。期间新连接可能短暂失败。",
				danger: false
			},
			stop: {
				title: "确认停止 Nginx？",
				body: "停止后该主机上的所有站点立即不可访问，且不会自动恢复。确认该主机没有关键流量后再操作。",
				danger: true
			}
		};
		async function confirmThen(op) {
			const c = CONFIRM[op];
			if (!c) return;
			try {
				await ElMessageBox.confirm(c.body, c.title, {
					type: c.danger ? "warning" : "info",
					confirmButtonText: `确认${labelOf(op)}`,
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			await run(op);
		}
		async function run(op) {
			if (!props.datasourceId) {
				message.warning("请先选择数据源");
				return;
			}
			busy.value = op;
			const call = {
				test: testNginx,
				reload: reloadNginx,
				restart: restartNginx,
				start: startNginx,
				stop: stopNginx
			}[op];
			try {
				const r = await call(props.datasourceId);
				result.value = r;
				resultVisible.value = true;
				if (r.success) message.success(r.message);
				else message.error(r.message);
				emit("changed");
			} catch (e) {
				message.error(`${labelOf(op)}失败：${e.message}`);
			} finally {
				busy.value = "";
			}
		}
		__expose({ 
		/** 供父组件在保存配置后触发校验 */
run });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$12, [
				createVNode(unref(ReButton_default), {
					layout: "square",
					icon: "CircleCheck",
					tip: "校验配置",
					"data-testid": "ngx-btn-test",
					loading: busy.value === "test",
					onClick: _cache[0] || (_cache[0] = ($event) => run("test"))
				}, null, 8, ["loading"]),
				canReload.value ? (openBlock(), createBlock(unref(ReButton_default), {
					key: 0,
					layout: "square",
					type: "primary",
					icon: "Refresh",
					tip: "重载（不中断连接）",
					"data-testid": "ngx-btn-reload",
					loading: busy.value === "reload",
					onClick: _cache[1] || (_cache[1] = ($event) => run("reload"))
				}, null, 8, ["loading"])) : createCommentVNode("", true),
				canRestart.value ? (openBlock(), createBlock(unref(ReButton_default), {
					key: 1,
					layout: "square",
					icon: "RefreshRight",
					tip: "重启（会中断连接）",
					"data-testid": "ngx-btn-restart",
					loading: busy.value === "restart",
					onClick: _cache[2] || (_cache[2] = ($event) => confirmThen("restart"))
				}, null, 8, ["loading"])) : createCommentVNode("", true),
				canStart.value ? (openBlock(), createBlock(unref(ReButton_default), {
					key: 2,
					layout: "square",
					type: "primary",
					icon: "VideoPlay",
					tip: "启动",
					"data-testid": "ngx-btn-start",
					loading: busy.value === "start",
					onClick: _cache[3] || (_cache[3] = ($event) => run("start"))
				}, null, 8, ["loading"])) : createCommentVNode("", true),
				canStop.value ? (openBlock(), createBlock(unref(ReButton_default), {
					key: 3,
					layout: "square",
					type: "danger",
					icon: "VideoPause",
					tip: "停止（站点将不可访问）",
					"data-testid": "ngx-btn-stop",
					loading: busy.value === "stop",
					onClick: _cache[4] || (_cache[4] = ($event) => confirmThen("stop"))
				}, null, 8, ["loading"])) : createCommentVNode("", true),
				createBaseVNode("span", {
					class: "ngx-tip",
					title: tipText.value
				}, [createVNode(unref(component$1), {
					name: "InfoFilled",
					size: 12
				}), createTextVNode(" " + toDisplayString(tipText.value), 1)], 8, _hoisted_2$12),
				createVNode(unref(component), {
					modelValue: resultVisible.value,
					"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => resultVisible.value = $event),
					title: resultTitle.value,
					width: "640px",
					height: 420,
					"footer-hidden": false
				}, {
					default: withCtx(() => [result.value ? (openBlock(), createElementBlock("div", _hoisted_3$12, [
						createBaseVNode("div", { class: normalizeClass(["ngx-result-head", result.value.success ? "is-ok" : "is-err"]) }, [createVNode(unref(component$1), {
							name: result.value.success ? "CircleCheck" : "WarningFilled",
							size: 15
						}, null, 8, ["name"]), createBaseVNode("span", null, toDisplayString(result.value.message), 1)], 2),
						result.value.stdout ? (openBlock(), createElementBlock("div", _hoisted_4$11, [_cache[6] || (_cache[6] = createBaseVNode("div", { class: "ngx-result-label" }, "标准输出", -1)), createBaseVNode("pre", _hoisted_5$10, toDisplayString(result.value.stdout), 1)])) : createCommentVNode("", true),
						result.value.stderr ? (openBlock(), createElementBlock("div", _hoisted_6$10, [_cache[7] || (_cache[7] = createBaseVNode("div", { class: "ngx-result-label" }, "错误输出", -1)), createBaseVNode("pre", _hoisted_7$10, toDisplayString(result.value.stderr), 1)])) : createCommentVNode("", true),
						!result.value.success && !result.value.stderr ? (openBlock(), createBlock(unref(ReAlert), {
							key: 2,
							type: "info",
							title: "命令没有返回错误输出。若反复失败，请到「日志」页查看 error 日志确认现场。"
						})) : createCommentVNode("", true)
					])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue", "title"]),
				blockedHint.value ? (openBlock(), createBlock(unref(ReAlert), {
					key: 4,
					class: "ngx-perm-alert",
					type: "warning",
					title: blockedHint.value.title,
					description: blockedHint.value.detail,
					closable: false,
					"show-icon": ""
				}, null, 8, ["title", "description"])) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-8b309a0f"]]);
//#endregion
//#region ../../pages/datasource/src/nginx/useNginxStream.ts
/**
* Nginx 指标 / 运行态实时推送（SSE）订阅。
*
* <p>用共享的 {@code http().sse()} 客户端而不是裸 {@code EventSource}：后者不能带
* 自定义 header，而本项目所有 {@code /ms/**} 请求都靠 token 鉴权（token 同时走
* {@code Authorization} 头与 {@code x-oauth-token} query），裸 EventSource 建连
* 会拿不到数据且只在控制台留一条不显眼的报错。</p>
*
* <p><strong>首屏历史不在这条链路上</strong>：SSE 只做增量推送，首屏仍由
* {@code GET /metric/trend} 一次性拉取。否则建连瞬间就要推 2880 个点/指标，
* 而页面往往在历史到达前就断了。</p>
*
* @author CH
* @since 4.0.0
*/
/**
* 单指标点数上限：30s 采集 × 24h = 2880 点。
*
* <p><strong>必须按指标各自封顶，不能对合并后的总数组封顶</strong>：后端一轮采集
* 写 7 个指标（accepts / active / handled / reading / requests / waiting / writing，
* 已实测），满窗数据是 2880 × 7 = 20160 点。若拿 2880 去卡总数组，
* 每个指标只剩约 411 点（约 3.4 小时），而图表标题和脚注仍写着「24 小时趋势」——
* 用户会以为「下午到现在没数据」，实际是被前端悄悄截掉了。
* 前缀早就在，后缀的窗口就名不副实了。</p>
*/
var MAX_POINTS_PER_METRIC = 2880;
/**
* 点位去重键。
*
* <p>提到模块级：`mergePoints` 是纯函数、不在组件作用域内，
* 放在 `useNginxStream` 内部它就访问不到。</p>
*/
var keyOf = (p) => `${p.name}|${p.time}`;
/**
* 订阅某数据源的实时推送，并在数据源切换时自动重连。
*
* @param datasourceId 响应式数据源 id
* @param options       回调
* @returns 控制句柄
*/
function useNginxStream(datasourceId, options = {}) {
	const state = ref("idle");
	const lastPushAt = ref(null);
	let client = null;
	/** 手动建连与由 watch 触发的重连之间需要去重，否则一次切换会建两条流 */
	let connecting = false;
	/** 已推送过的 (name|time)，防止重连后同一点被追加两次而在曲线上叠出双峰 */
	const seen = /* @__PURE__ */ new Set();
	const close = () => {
		client?.close();
		client = null;
		connecting = false;
		state.value = "idle";
	};
	const connect = () => {
		close();
		const id = datasourceId.value;
		if (!id) return;
		connecting = true;
		state.value = "connecting";
		client = http().get(nginxMetricStreamUrl(id)).sse({
			onOpen: () => {
				state.value = "open";
			},
			onMessage: (ev) => {
				state.value = "open";
				lastPushAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
				if (ev.event === "metric") {
					const points = (safeParse(ev.data)?.points ?? []).filter((p) => {
						if (!p?.name || !p.time) return false;
						const k = keyOf(p);
						if (seen.has(k)) return false;
						seen.add(k);
						return true;
					});
					if (points.length) options.onMetric?.(points);
				} else if (ev.event === "runtime") {
					const runtime = safeParse(ev.data);
					if (runtime) options.onRuntime?.(runtime);
				}
			},
			onError: () => {
				state.value = "error";
			},
			onClose: () => {
				state.value = "idle";
			},
			maxReconnectAttempts: 10,
			reconnectInterval: 3e3
		});
	};
	watch(datasourceId, (id) => {
		seen.clear();
		if (id && !connecting) connect();
	}, { immediate: true });
	onBeforeUnmount(close);
	return {
		state,
		lastPushAt,
		close
	};
}
/**
* 合并新点进已有序列：同名同刻替换，同名新刻追加。
*
* <p>不做降采样：交给 ECharts 自带的 `sampling: 'lttb'` 处理，
* 那是在渲染层按像素宽度抽点，既保形状又不丢尖峰，
* 而前端按固定步长抽会真切掉毛刺。</p>
*
* <p><strong>上限按指标各自生效</strong>，见 {@link MAX_POINTS_PER_METRIC} 的说明。
* 截断时丢最旧的点：实时看板看当下，历史完整度由首屏那次
* {@code GET /metric/trend} 保证，那次是按窗口查的，不受这里影响。</p>
*
* @param prev  已有序列
* @param added 新到的点
* @param cap   **单指标**点数上限
* @returns 合并后的新数组（不改动入参）
*/
function mergePoints(prev, added, cap = MAX_POINTS_PER_METRIC) {
	if (!added.length) return prev;
	const byKey = /* @__PURE__ */ new Map();
	for (const p of prev) byKey.set(keyOf(p), p);
	for (const p of added) byKey.set(keyOf(p), p);
	const all = [...byKey.values()].sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name));
	const perMetric = /* @__PURE__ */ new Map();
	const kept = [];
	for (let i = all.length - 1; i >= 0; i--) {
		const p = all[i];
		const n = perMetric.get(p.name) ?? 0;
		if (n >= cap) continue;
		perMetric.set(p.name, n + 1);
		kept.push(p);
	}
	return kept.reverse();
}
/** 反序列化，失败返回 null 而不是抛——一条脏帧不该把整条流打死 */
function safeParse(raw) {
	if (typeof raw !== "string") return raw ?? null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
//#endregion
//#region ../../pages/datasource/src/components/console/charts/NginxTrendChart.vue
var NginxTrendChart_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxTrendChart",
	props: {
		series: {},
		urlSeries: { default: () => [] },
		urlTitle: { default: "URL 访问趋势" },
		height: { default: 180 }
	},
	setup(__props) {
		/**
		* Nginx 指标趋势折线图（ECharts）。
		*
		* <p><strong>为什么用 `time` 轴而不是 `category` 轴</strong>：采集会缺点（SSH 抖动、
		* 被管主机重启），按序号排的类目轴会把时间轴拉歪——两点挨得近却可能隔了十分钟。
		* 时间轴按真实时刻定位，缺点就真的是缺点。</p>
		*
		* <p><strong>为什么交给 ECharts 降采样</strong>：30s 采集 × 24h = 2880 点/指标，
		* 24h 满窗时单序列近 3000 点。这里用 `sampling: 'lttb'`，它在渲染层按像素宽度抽点，
		* 既保住尖峰形状又不丢趋势；换成前端固定步长抽会真切掉毛刺。</p>
		*
		* <p><strong>断点不连线</strong>：worker 重启后累计计数归零，后端把该点的 `rate` 置 null。
		* `connectNulls: false` 让它断开而不是拉一条假的垂直线——否则「重启」会被读成「流量暴跌」。</p>
		*
		* <p><strong>为什么左右两块而不是同一个坐标系</strong>：左边的 24 小时趋势来自采集器落库，
		* 固定 24 小时窗口；右边的 URL 趋势直接扫 access log 尾部，时间跨度由日志密度决定——
		* 高流量时「最近 5000 行」可能只覆盖几分钟。两者时间尺度能差两个数量级，
		* 共用一个 x 轴的话 URL 曲线会挤在左边缘 1% 的宽度里，完全读不出来。
		* 所以用两个 grid 各自独立的时间轴，画在同一张画布上，tooltip 用 axisPointer 联动。</p>
		*
		* @author CH
		* @since 4.0.0
		*/
		const props = __props;
		/** 有数据的序列；空序列会让 ECharts 画出空坐标系，看着像「图坏了」 */
		const liveSeries = computed(() => props.series.filter((s) => s.data.length > 0));
		/** 只有真的有 URL 数据才启用右半边，否则左侧占满宽度 */
		const hasUrl = computed(() => props.urlSeries.some((s) => s.data.length > 0));
		const el = ref(null);
		const elRef = computed(() => el.value);
		const build = () => {
			const axisColor = token("--text-secondary");
			const splitColor = token("--border-subtle");
			const tipBg = token("--bg-elevated") || token("--bg-container");
			const urlLive = hasUrl.value ? props.urlSeries.filter((s) => s.data.length > 0) : [];
			const GRID_TOP = 30;
			const grids = urlLive.length ? [{
				left: "2%",
				right: "46%",
				top: GRID_TOP,
				bottom: 24,
				containLabel: true
			}, {
				left: "58%",
				right: "2%",
				top: GRID_TOP,
				bottom: 24,
				containLabel: true
			}] : [{
				left: "2%",
				right: "2%",
				top: GRID_TOP,
				bottom: 24,
				containLabel: true
			}];
			const timeAxis = (extra = {}) => ({
				type: "time",
				axisLine: { lineStyle: { color: splitColor } },
				axisTick: { show: false },
				axisLabel: {
					color: axisColor,
					fontSize: 11,
					hideOverlap: true,
					formatter: (v) => new Date(v).toLocaleTimeString("zh-CN", { hour12: false })
				},
				splitLine: { show: false },
				...extra
			});
			const valueAxis = (extra = {}) => ({
				type: "value",
				min: 0,
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: axisColor,
					fontSize: 11
				},
				splitLine: { lineStyle: {
					color: splitColor,
					type: "dashed"
				} },
				...extra
			});
			const areaFill = (c) => ({
				opacity: .14,
				color: {
					type: "linear",
					x: 0,
					y: 0,
					x2: 0,
					y2: 1,
					colorStops: [{
						offset: 0,
						color: c
					}, {
						offset: 1,
						color: "transparent"
					}]
				}
			});
			return {
				title: urlLive.length ? [{
					text: "24 小时采集指标",
					left: "2%",
					top: 2,
					textStyle: {
						color: axisColor,
						fontSize: 11,
						fontWeight: "normal"
					}
				}, {
					text: props.urlTitle,
					left: "58%",
					top: 2,
					textStyle: {
						color: axisColor,
						fontSize: 11,
						fontWeight: "normal"
					}
				}] : void 0,
				grid: grids,
				xAxis: urlLive.length ? [timeAxis(), timeAxis({ gridIndex: 1 })] : [timeAxis()],
				yAxis: urlLive.length ? [valueAxis(), valueAxis({
					gridIndex: 1,
					name: "次",
					nameLocation: "end",
					nameGap: 8,
					nameTextStyle: {
						color: axisColor,
						fontSize: 10,
						align: "right"
					}
				})] : [valueAxis()],
				tooltip: {
					trigger: "axis",
					backgroundColor: tipBg,
					borderColor: splitColor,
					textStyle: {
						color: token("--text-primary"),
						fontSize: 12
					},
					axisPointer: {
						type: "line",
						link: [{ xAxisIndex: "all" }],
						lineStyle: {
							color: axisColor,
							opacity: .4
						}
					},
					formatter: (params) => {
						const arr = params;
						if (!arr?.length) return "";
						const time = new Date(Number(arr[0].axisValue)).toLocaleString("zh-CN", { hour12: false });
						const rows = arr.filter((p) => Array.isArray(p.value) && p.value[1] != null).map((p) => `${p.seriesName}: <b>${Number(p.value[1]).toFixed(2)}</b>`);
						return rows.length ? `${time}<br/>${rows.join("<br/>")}` : "";
					}
				},
				legend: { show: false },
				series: [...liveSeries.value.map((s) => {
					const c = token(s.color);
					return {
						name: s.label,
						type: "line",
						data: s.data,
						xAxisIndex: 0,
						yAxisIndex: 0,
						showSymbol: false,
						symbol: "circle",
						symbolSize: 5,
						sampling: "lttb",
						connectNulls: false,
						smooth: .2,
						lineStyle: {
							width: 2,
							color: c
						},
						itemStyle: { color: c },
						emphasis: { focus: "series" },
						areaStyle: areaFill(c)
					};
				}), ...urlLive.map((s, i) => {
					const c = token(URL_TREND_COLORS[i % URL_TREND_COLORS.length]);
					return {
						name: s.path,
						type: "line",
						data: s.data,
						xAxisIndex: urlLive.length ? 1 : 0,
						yAxisIndex: urlLive.length ? 1 : 0,
						showSymbol: false,
						symbol: "circle",
						symbolSize: 4,
						connectNulls: false,
						smooth: .2,
						lineStyle: {
							width: 1.8,
							color: c
						},
						itemStyle: { color: c },
						emphasis: { focus: "series" },
						areaStyle: {
							opacity: .08,
							color: c
						}
					};
				})]
			};
		};
		const { render } = useEchart(elRef, build);
		watch(() => [
			props.series,
			props.urlSeries,
			props.height
		], render, { deep: true });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "el",
				ref: el,
				class: "ngx-echart",
				style: normalizeStyle({ height: `${__props.height}px` })
			}, null, 4);
		};
	}
}), [["__scopeId", "data-v-180c8fb1"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/charts/NginxStatusBarChart.vue
var NginxStatusBarChart_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxStatusBarChart",
	props: {
		items: {},
		height: { default: 132 }
	},
	setup(__props) {
		/**
		* 访问日志状态码分布（ECharts 横向条形图）。
		*
		* <p><strong>为什么用条形而不是饼图</strong>：这里要读的是「2xx 占九成、5xx 占 0.1%」
		* 这种量级差异。饼图里 0.1% 的扇区肉眼不可见，而横条按比例画长度，
		* 再配合右侧数值标注，小占比也读得出来。</p>
		*
		* <p><strong>按 hits 而不是 pct 画长度</strong>：后端已算好 `pct`（占已解析行数），
		* 直接用即可；x 轴设成 `max: 100` 让「占比」这个语义在轴上直接可见，
		* 不用再让用户心算条长和满格的比例。</p>
		*
		* @author CH
		* @since 4.0.0
		*/
		const props = __props;
		/**
		* 类别 → 令牌名。
		*
		* <p>走状态令牌而不是固定色：亮暗主题下各自有对应色，硬编码会让暗色下这行刺眼。</p>
		*/
		function tokenOf(category) {
			if (category.startsWith("2")) return "--status-success";
			if (category.startsWith("3")) return "--metric-cpu";
			if (category.startsWith("4")) return "--status-warning";
			if (category.startsWith("5")) return "--status-error";
			return "--text-secondary";
		}
		const el = ref(null);
		const elRef = computed(() => el.value);
		const build = () => {
			const axisColor = token("--text-secondary");
			const splitColor = token("--border-subtle");
			const cats = props.items.map((i) => i.category).reverse();
			const values = props.items.map((i) => i.pct).reverse();
			const hits = props.items.map((i) => i.hits).reverse();
			const colors = props.items.map((i) => token(tokenOf(i.category))).reverse();
			return {
				grid: {
					top: 6,
					right: 52,
					bottom: 4,
					left: 4,
					containLabel: true
				},
				tooltip: {
					trigger: "item",
					backgroundColor: token("--bg-elevated") || token("--bg-container"),
					borderColor: splitColor,
					textStyle: {
						color: token("--text-primary"),
						fontSize: 12
					},
					formatter: (p) => {
						const it = p;
						return `${cats[it.dataIndex]}：<b>${values[it.dataIndex]}%</b>（${hits[it.dataIndex]} 次）`;
					}
				},
				xAxis: {
					type: "value",
					max: 100,
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: { show: false },
					splitLine: { show: false }
				},
				yAxis: {
					type: "category",
					data: cats,
					axisLine: { show: false },
					axisTick: { show: false },
					axisLabel: {
						color: axisColor,
						fontSize: 11
					}
				},
				series: [{
					type: "bar",
					data: values.map((v, i) => ({
						value: v,
						itemStyle: { color: colors[i] }
					})),
					barWidth: 10,
					itemStyle: { borderRadius: 3 },
					label: {
						show: true,
						position: "right",
						distance: 6,
						color: axisColor,
						fontSize: 11,
						formatter: (p) => `${p.value}%`
					}
				}]
			};
		};
		const { render } = useEchart(elRef, build);
		watch(() => [props.items, props.height], render, { deep: true });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "el",
				ref: el,
				class: "ngx-echart",
				style: normalizeStyle({ height: `${__props.height}px` })
			}, null, 4);
		};
	}
}), [["__scopeId", "data-v-ba8f760e"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/charts/NginxConnDonut.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$11 = { class: "ngx-donut-wrap" };
var _hoisted_2$11 = { class: "ngx-donut" };
var _hoisted_3$11 = { class: "ngx-donut-center" };
var _hoisted_4$10 = { class: "ngx-donut-label" };
//#endregion
//#region ../../pages/datasource/src/components/console/charts/NginxConnDonut.vue
var NginxConnDonut_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxConnDonut",
	props: {
		reading: { default: 0 },
		writing: { default: 0 },
		waiting: { default: 0 },
		height: { default: 148 }
	},
	setup(__props) {
		/**
		* Nginx 连接状态分布（整卡 ECharts：环 + 图例 + tooltip 全在 canvas 里）。
		*
		* <p><strong>为什么环形而不是分段横条</strong>：三种状态是「一个整体的互斥拆分」，
		* 环形能直接把总量和占比同时画出来——圆心放活跃连接总数，环上放三段比例。
		* 原来的 flex 分段条在三者都接近 0 时会退化成三条看不见的 0.001 细线。</p>
		*
		* <p><strong>图例（本轮改造）</strong>：原右侧「读取/写入/等待」明细是 DOM 列表
		* （与 canvas 各画一半），现改为 ECharts legend —— 名称/数量/占比经 formatter +
		* rich 进 canvas，主题令牌统一取色；selectedMode 关闭，点掉一项会让环的占比失真。
		* 环内标签只留数值（原「名称+数值」两行超出环宽会互相重叠）。</p>
		*
		* <p><strong>全 0 的处理</strong>：总活跃连接为 0 是完全正常的状态（空闲实例），
		* 但空环画出来是一片空白，与「数据没取到」无法区分。所以补一整圈中性色的 100% 环，
		* 圆心写「无活跃连接」，让用户一眼看出是「确实没有连接」而不是图挂了。</p>
		*
		* @author CH
		* @since 4.0.0
		*/
		const props = __props;
		const el = ref(null);
		const elRef = computed(() => el.value);
		/** 三段明细，null 归 0：stub_status 缺字段时报「0」比报「—」更贴近真实（确实没有该状态连接）。
		*  配色统一走 koi 语义令牌（两个宿主应用都装了 koi 主题，令牌必然存在）。 */
		const parts = computed(() => [
			{
				key: "reading",
				label: "读取",
				value: Math.max(props.reading ?? 0, 0),
				token: "--status-warning"
			},
			{
				key: "writing",
				label: "写入",
				value: Math.max(props.writing ?? 0, 0),
				token: "--status-success"
			},
			{
				key: "waiting",
				label: "等待",
				value: Math.max(props.waiting ?? 0, 0),
				token: "--brand-400"
			}
		]);
		/** 活跃连接总数 = 圆心数字 */
		const total = computed(() => parts.value.reduce((sum, p) => sum + p.value, 0));
		/**
		* 某个状态占总量的百分比（一位小数）。
		*
		* <p>总量为 0 时返回 0：此时不是「占比未知的 0%」，而是「确实一条连接都没有」，
		* 与圆心的「无活跃连接」文案同源。</p>
		*
		* @param value 该状态的连接数
		* @returns 百分比文本
		*/
		function pctOf(value) {
			if (total.value <= 0) return "0.0";
			return (value / total.value * 100).toFixed(1);
		}
		const build = () => {
			const subColor = token("--text-secondary");
			const emptyColor = token("--border-subtle");
			const data = total.value > 0 ? parts.value.map((p) => ({
				value: p.value,
				name: p.label,
				itemStyle: { color: token(p.token) }
			})) : [{
				value: 1,
				name: "无活跃连接",
				itemStyle: { color: emptyColor }
			}];
			return {
				legend: {
					orient: "vertical",
					right: 0,
					top: "middle",
					icon: "roundRect",
					itemWidth: 10,
					itemHeight: 10,
					itemGap: 12,
					selectedMode: false,
					textStyle: {
						color: token("--text-secondary"),
						fontSize: 12,
						rich: {
							value: {
								color: token("--text-primary"),
								fontSize: 12,
								fontWeight: 600,
								align: "right",
								width: 40
							},
							pct: {
								color: token("--text-secondary"),
								fontSize: 12,
								align: "right",
								width: 46
							}
						}
					},
					formatter: (name) => {
						const p = parts.value.find((x) => x.label === name);
						if (!p) return name;
						return `${p.label}{value|${p.value.toLocaleString("en-US")}}{pct|${pctOf(p.value)}%}`;
					}
				},
				tooltip: {
					trigger: "item",
					backgroundColor: token("--bg-elevated") || token("--bg-container"),
					borderColor: token("--border-subtle"),
					textStyle: {
						color: token("--text-primary"),
						fontSize: 12
					},
					formatter: (p) => {
						const it = p;
						if (total.value === 0) return "当前无活跃连接";
						return `${it.name}：<b>${it.value}</b>（${it.percent}%）`;
					}
				},
				series: [{
					type: "pie",
					radius: ["64%", "84%"],
					center: ["30%", "46%"],
					avoidLabelOverlap: true,
					label: {
						show: total.value > 0,
						position: "inside",
						color: token("--el-color-white"),
						fontSize: 10,
						formatter: "{c}"
					},
					labelLine: { show: false },
					itemStyle: { borderWidth: 0 },
					emphasis: {
						scale: true,
						scaleSize: 4
					},
					data
				}],
				silent: true,
				animationDuration: 420,
				...total.value > 0 ? {} : { color: [emptyColor, subColor] }
			};
		};
		const { render } = useEchart(elRef, build);
		watch(() => [
			props.reading,
			props.writing,
			props.waiting,
			props.height
		], render);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$11, [createBaseVNode("div", _hoisted_2$11, [createBaseVNode("div", {
				ref_key: "el",
				ref: el,
				class: "ngx-echart",
				style: normalizeStyle({ height: `${__props.height}px` })
			}, null, 4), createBaseVNode("div", _hoisted_3$11, [createBaseVNode("b", { class: normalizeClass(["ngx-donut-value", { "is-zero": total.value === 0 }]) }, toDisplayString(total.value), 3), createBaseVNode("span", _hoisted_4$10, toDisplayString(total.value > 0 ? "活跃连接" : "无活跃连接"), 1)])])]);
		};
	}
}), [["__scopeId", "data-v-9aa77a35"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/charts/Sparkline.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$10 = ["viewBox"];
var _hoisted_2$10 = ["points"];
var _hoisted_3$10 = ["points"];
var WIDTH = 96;
var HEIGHT = 30;
//#endregion
//#region ../../pages/datasource/src/components/console/charts/Sparkline.vue
var Sparkline_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "Sparkline",
	props: {
		values: {},
		token: { default: "--metric-cpu" }
	},
	setup(__props) {
		/**
		* KPI 卡里的迷你趋势线（sparkline）。
		*
		* <p><strong>为什么不用 ECharts</strong>：KPI 卡上的这条线只有几十像素高、没有坐标轴、
		* 不需要 tooltip，ECharts 的 init/resize/dispose 全套在这个尺寸上纯属浪费
		* （同页四张卡就是四个实例）。这里直接输出 SVG path，颜色走 CSS 令牌，
		* 亮暗主题自动跟随，连 MutationObserver 都不用挂。</p>
		*
		* <p><strong>null 是断点而不是 0</strong>：worker 重启后 nginx 计数器归零，
		* 后端把该点置 null。直接连过去会把「换了 worker」画成「流量暴跌」，
		* 所以这里按 null 切成多段折线，段与段之间不连。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		const props = __props;
		/** viewBox 宽高固定，CSS 负责把它拉到卡片实际宽度 */
		function downsample(values, max) {
			if (values.length <= max) return values;
			const step = values.length / max;
			return Array.from({ length: max }, (_, i) => values[Math.floor(i * step)]);
		}
		computed(() => props.values.filter((v) => v != null));
		/**
		* 折线段：按 null 断开后，每段输出一个 `x,y x,y ...` 串。
		*
		* @returns 每段的多边形点串
		*/
		const segments = computed(() => {
			const pts = downsample(props.values, 48);
			if (!pts.length) return [];
			const nums = pts.filter((v) => v != null);
			if (!nums.length) return [];
			const min = Math.min(...nums);
			const span = Math.max(...nums) - min || 1;
			const usable = 24;
			const dx = pts.length > 1 ? WIDTH / (pts.length - 1) : 0;
			const out = [];
			let cur = [];
			pts.forEach((v, i) => {
				if (v == null) {
					if (cur.length) {
						out.push(cur.join(" "));
						cur = [];
					}
					return;
				}
				const x = (i * dx).toFixed(2);
				const y = (27 - (v - min) / span * usable).toFixed(2);
				cur.push(`${x},${y}`);
			});
			if (cur.length) out.push(cur.join(" "));
			return out;
		});
		/**
		* 面积多边形：把每段折线补到基线。
		*
		* <p>只画折线会让线悬在卡片中间、缺少「量」的感觉；补一层 12% 的同色面积后，
		* 走势的起伏一眼可见，又不会盖住卡片文字。</p>
		*/
		const fills = computed(() => {
			const pts = downsample(props.values, 48);
			if (!pts.length || !pts.some((v) => v != null)) return [];
			const nums = pts.filter((v) => v != null);
			if (!nums.length) return [];
			const min = Math.min(...nums);
			const span = Math.max(...nums) - min || 1;
			const usable = 24;
			const dx = pts.length > 1 ? WIDTH / (pts.length - 1) : 0;
			const out = [];
			let cur = [];
			const flush = () => {
				if (cur.length < 2) {
					cur = [];
					return;
				}
				const xs = cur.map((p) => `${p[0]},${p[1]}`);
				out.push(`0,${HEIGHT} ${xs.join(" ")} ${cur[cur.length - 1][0]},${HEIGHT}`);
				cur = [];
			};
			pts.forEach((v, i) => {
				if (v == null) {
					flush();
					return;
				}
				cur.push([i * dx, 27 - (v - min) / span * usable]);
			});
			flush();
			return out;
		});
		return (_ctx, _cache) => {
			return segments.value.length ? (openBlock(), createElementBlock("svg", {
				key: 0,
				class: "ngx-spark",
				style: normalizeStyle({ "--k": `var(${__props.token})` }),
				viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
				preserveAspectRatio: "none",
				role: "presentation"
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(fills.value, (seg, i) => {
				return openBlock(), createElementBlock("polygon", {
					key: `f${i}`,
					class: "ngx-spark-fill",
					points: seg
				}, null, 8, _hoisted_2$10);
			}), 128)), (openBlock(true), createElementBlock(Fragment, null, renderList(segments.value, (seg, i) => {
				return openBlock(), createElementBlock("polyline", {
					key: `l${i}`,
					class: "ngx-spark-line",
					points: seg
				}, null, 8, _hoisted_3$10);
			}), 128))], 12, _hoisted_1$10)) : createCommentVNode("", true);
		};
	}
}), [["__scopeId", "data-v-2886ebc3"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/NginxOverviewPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$9 = { class: "ngx-overview" };
var _hoisted_2$9 = {
	key: 0,
	class: "ngx-skeleton",
	"aria-busy": "true",
	"aria-label": "总览加载中"
};
var _hoisted_3$9 = { class: "ngx-skel-hero" };
var _hoisted_4$9 = { class: "ngx-skel-hero-text" };
var _hoisted_5$9 = { class: "ngx-skel-hero-facts" };
var _hoisted_6$9 = { class: "ngx-skel-kpis" };
var _hoisted_7$9 = { class: "ngx-card ngx-skel-card" };
var _hoisted_8$9 = { class: "ngx-skel-chart" };
var _hoisted_9$9 = { class: "ngx-hero-icon" };
var _hoisted_10$9 = { class: "ngx-hero-title" };
var _hoisted_11$9 = { class: "ngx-hero-name" };
var _hoisted_12$8 = { class: "ngx-hero-sub" };
var _hoisted_13$7 = {
	key: 0,
	class: "ngx-hero-alert"
};
var _hoisted_14$6 = { class: "ngx-hero-facts" };
var _hoisted_15$5 = { class: "ngx-fact" };
var _hoisted_16$5 = { class: "ngx-fact-value mono" };
var _hoisted_17$5 = { class: "ngx-fact" };
var _hoisted_18$3 = { class: "ngx-fact-value mono" };
var _hoisted_19$3 = { class: "ngx-fact" };
var _hoisted_20$3 = { class: "ngx-fact-value mono" };
var _hoisted_21$3 = ["title"];
var _hoisted_22$3 = { class: "ngx-kpis" };
var _hoisted_23$3 = ["title"];
var _hoisted_24$2 = { class: "ngx-kpi-value" };
var _hoisted_25$2 = { class: "ngx-kpi-foot" };
var _hoisted_26$2 = { class: "ngx-kpi-sub" };
var _hoisted_27$2 = ["title"];
var _hoisted_28$2 = { class: "ngx-kpi-value" };
var _hoisted_29$2 = { class: "ngx-kpi-foot" };
var _hoisted_30$2 = { class: "ngx-kpi-sub" };
var _hoisted_31$2 = ["title"];
var _hoisted_32$2 = { class: "ngx-kpi-value" };
var _hoisted_33$2 = { class: "ngx-kpi-foot" };
var _hoisted_34$1 = { class: "ngx-kpi-sub" };
var _hoisted_35$1 = ["title"];
var _hoisted_36 = { class: "ngx-kpi-value" };
var _hoisted_37 = { class: "ngx-kpi-foot" };
var _hoisted_38 = { class: "ngx-kpi-sub" };
var _hoisted_39 = { class: "ngx-card ngx-trend-card" };
var _hoisted_40 = { class: "ngx-card-head" };
var _hoisted_41 = { class: "ngx-card-sub" };
var _hoisted_42 = { class: "ngx-trend-legend" };
var _hoisted_43 = ["onClick"];
var _hoisted_44 = {
	key: 0,
	class: "ngx-trend-empty"
};
var _hoisted_45 = {
	key: 2,
	class: "ngx-trend-body"
};
var _hoisted_46 = { class: "ngx-trend-foot" };
var _hoisted_47 = { class: "ngx-trend-live" };
var _hoisted_48 = { class: "ngx-trend-note" };
var _hoisted_49 = { class: "ngx-card ngx-top-card" };
var _hoisted_50 = { class: "ngx-card-head" };
var _hoisted_51 = { class: "ngx-card-sub" };
var _hoisted_52 = {
	key: 0,
	class: "ngx-trend-empty"
};
var _hoisted_53 = {
	key: 2,
	class: "ngx-trend-empty"
};
var _hoisted_54 = {
	key: 3,
	class: "ngx-top-body"
};
var _hoisted_55 = { class: "ngx-top-cols" };
var _hoisted_56 = { class: "ngx-top-col" };
var _hoisted_57 = { class: "ngx-top-list" };
var _hoisted_58 = ["title"];
var _hoisted_59 = { class: "ngx-top-hits" };
var _hoisted_60 = { class: "ngx-top-pct" };
var _hoisted_61 = { class: "ngx-top-track" };
var _hoisted_62 = {
	key: 0,
	class: "ngx-top-none"
};
var _hoisted_63 = { class: "ngx-top-col" };
var _hoisted_64 = { class: "ngx-top-list" };
var _hoisted_65 = ["title"];
var _hoisted_66 = { class: "ngx-top-hits" };
var _hoisted_67 = { class: "ngx-top-pct" };
var _hoisted_68 = { class: "ngx-top-track" };
var _hoisted_69 = {
	key: 0,
	class: "ngx-top-none"
};
var _hoisted_70 = { class: "ngx-trend-note" };
var _hoisted_71 = { class: "ngx-grid" };
var _hoisted_72 = { class: "ngx-card" };
var _hoisted_73 = { class: "ngx-card-head" };
var _hoisted_74 = ["title"];
var _hoisted_75 = { class: "ngx-meta" };
var _hoisted_76 = {
	key: 1,
	class: "ngx-dim"
};
var _hoisted_77 = { class: "ngx-card" };
var _hoisted_78 = {
	key: 0,
	class: "ngx-chips"
};
var _hoisted_79 = {
	key: 1,
	class: "ngx-dim"
};
var _hoisted_80 = { class: "ngx-path-row" };
var _hoisted_81 = { class: "ngx-mono ngx-break" };
var _hoisted_82 = { class: "ngx-path-row" };
var _hoisted_83 = { class: "ngx-mono ngx-break" };
var _hoisted_84 = { class: "ngx-card" };
var _hoisted_85 = { class: "ngx-card-head" };
var _hoisted_86 = {
	key: 0,
	class: "ngx-issues"
};
var _hoisted_87 = {
	key: 1,
	class: "ngx-issues"
};
var _hoisted_88 = {
	key: 2,
	class: "ngx-ok"
};
var _hoisted_89 = {
	key: 3,
	class: "ngx-ok"
};
var _hoisted_90 = { class: "ngx-card" };
var _hoisted_91 = { class: "ngx-card-title" };
var _hoisted_92 = { class: "ngx-card-sub" };
var _hoisted_93 = {
	key: 0,
	class: "ngx-conf"
};
//#endregion
//#region ../../pages/datasource/src/components/console/NginxOverviewPanel.vue
var NginxOverviewPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxOverviewPanel",
	props: {
		loading: { type: Boolean },
		datasourceId: {},
		overview: {},
		loadError: {},
		endpoint: {}
	},
	emits: ["changed"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		/**
		* 首屏是否已渲染过真实内容。
		*
		* <p>骨架屏只在「首次」加载时出现：拿到第一份数据（含加载失败）之后就置 true，
		* 此后即使父级把 {@code loading} 重新拉高（SSE 推帧触发的后台刷新）也不再退回骨架。
		* 否则每隔几秒整页闪一次，用户会以为页面在反复重载。</p>
		*
		* <p>声明必须排在 {@code defineProps} 之后：下面几个 watch 的 getter 都要读
		* {@code props.xxx}，而 {@code const props} 走的是 TDZ，写在前面会抛
		* “Cannot access 'props' before initialization”，整页白屏而不是局部降级。</p>
		*/
		const loaded = ref(false);
		/** 数据到齐或失败都算「首屏结束」——失败时该显示错误提示，不该永远停在骨架上 */
		const markLoaded = () => {
			loaded.value = true;
		};
		/** 各 KPI 的悬停说明。这些口径不看说明容易被误读，故全部显式写出来 */
		const KPI_HINTS = {
			active: "当前正在处理的连接数。读取 / 写入 / 等待的拆分见下方「连接状态分布」环形图",
			requests: "每秒请求数由采集器按相邻两点差值算出；累计值降为副信息",
			dropped: "累计接受 − 已处理。持续增长说明 accept 队列溢出（backlog 不够 / worker 忙不过来 / fd 或内存压力），是 nginx 最需要提前发现的信号",
			bytes: "本次扫描到的 access log 里 $body_bytes_sent 之和（响应体字节，不等于网络带宽）",
			errorRate: "（4xx + 5xx）÷ 已解析行数。分母只算能解析出格式的行，格式不匹配的行不计入"
		};
		/**
		* 被内核丢弃的连接数 = accepts − handled。
		*
		* <p>null 表示算不出来（stub_status 不可用或两个字段缺一个），界面据此显示「—」。
		* 刻意不用 0：把「不知道」显示成 0 会让人以为连接一个都没丢。</p>
		*/
		const droppedConnections = computed(() => {
			const st = props.overview?.status;
			if (!st || st.accepts == null || st.handled == null) return null;
			return Math.max(0, st.accepts - st.handled);
		});
		/** 独立访客 IP 总数（后端给的真实总数，不是 Top 榜长度——那只含前 N 名） */
		const uniqueIpCount = computed(() => top.value?.uniqueIps ?? 0);
		/**
		* 错误率百分比（一位小数）。
		*
		* <p>分母用 {@code total}（成功解析的行数）而不是 {@code scanned}（扫描行数）：
		* 格式不匹配的行不构成「请求」，算进分母会把错误率人为压低。</p>
		*/
		const errorRatePct = computed(() => {
			if (!topLoaded.value || !top.value || !top.value.total) return null;
			const errs = (top.value.clientErrors ?? 0) + (top.value.serverErrors ?? 0);
			return Math.round(errs / top.value.total * 1e3) / 10;
		});
		watch(() => [props.overview, props.loadError], () => {
			if (props.overview || props.loadError) markLoaded();
		}, { immediate: true });
		watch(() => props.loading, (v, old) => {
			if (!v && old === true) markLoaded();
		});
		watch(() => props.datasourceId, () => {
			loaded.value = false;
		});
		const emit = __emit;
		/** 编译参数默认折叠（内容长，展开会挤占版面） */
		const showArgs = ref(false);
		/**
		* 趋势曲线配色。
		*
		* <p><strong>存的是令牌名而不是 `var(--x)` 串</strong>：ECharts 画在 canvas 上，
		* 认不出 CSS 变量，必须拿到解析后的颜色值。图表组件在渲染时用
		* `getComputedStyle` 读这里的令牌，所以亮暗主题切换后颜色会跟着变。
		* 模板里的图例小圆点仍用 `--k: s.color` 注入 `var()`，两条路径同源。</p>
		*/
		const TREND_SERIES = [{
			name: "active",
			label: "活跃连接",
			color: "--metric-cpu"
		}, {
			name: "requests",
			label: "每秒请求",
			color: "--status-success"
		}];
		/** 折线序列的名字集合 */
		const trend = ref(null);
		const trendLoading = ref(false);
		const trendLoaded = ref(false);
		/** 图例开关：默认全开 */
		const trendOn = ref({
			active: true,
			requests: true
		});
		/**
		* 按指标名归组的曲线点。
		*
		* <p><strong>null 必须留着当断点</strong>：worker 重启后累计计数归零，
		* 后端把该点的 `rate` 置 null。原先这里是 `if (v == null) return acc` 直接丢弃，
		* 于是重启点被前后两点连了起来——曲线看上去毫无异常，实际中间已经换了一个 worker。
		* 现在保留 null，交给 ECharts 的 `connectNulls: false` 断开。</p>
		*/
		const trendSeries = computed(() => (trend.value?.points ?? []).reduce((acc, p) => {
			(acc[p.name] ??= []).push({
				time: Date.parse(p.time),
				value: Number.isNaN(Date.parse(p.time)) ? null : p.rate
			});
			return acc;
		}, {}));
		/**
		* 是否至少有一个有效数据点。
		*
		* <p>必须用 Object.keys 取长度：trendSeries 是「序列名 → 点数组」的映射，
		* 是对象不是数组，对象没有 length 属性。这里原先写的是
		* `v-else-if="!trendSeries.length"`，取到 undefined、取反恒为 true，
		* 于是趋势图永远落进空态分支，曲线一次都没画出来过 —— 而后端一直正常
		* 返回数据（实测 24h 窗口内 175 个点），看起来就像「采集没工作」。</p>
		*
		* <p>这里数的是**非 null 的点**：worker 刚重启时序列里已经有点但全是断点，
		* 照样画不出任何东西，显示「没有数据」比显示一张空图诚实。</p>
		*/
		const hasTrend = computed(() => Object.values(trendSeries.value).some((points) => points.some((p) => p.value != null)));
		/** 交给 ECharts 的序列（已按图例开关过滤） */
		const chartSeries = computed(() => TREND_SERIES.filter((s) => trendOn.value[s.name]).map((s) => ({
			name: s.name,
			label: s.label,
			color: s.color,
			data: (trendSeries.value[s.name] ?? []).filter((p) => !Number.isNaN(p.time)).map((p) => [p.time, p.value])
		})));
		/** 起止时间文案 */
		const trendFromText = computed(() => trend.value ? new Date(trend.value.from).toLocaleTimeString("zh-CN", { hour12: false }) : "");
		const trendToText = computed(() => trend.value ? new Date(trend.value.to).toLocaleTimeString("zh-CN", { hour12: false }) : "");
		/**
		* 当前每秒请求数（取「每秒请求」序列的最后一个点）。
		*
		* <p>比「累计请求」更适合放首屏：累计值一直变大却看不出快慢，速率才反映当下压力。
		* 累计值降为副信息留在卡片小字里，需要时仍能看到。</p>
		*/
		const trendRequestRate = computed(() => {
			const points = trendSeries.value["requests"] ?? [];
			const last = points[points.length - 1];
			return last && last.value != null ? Math.round(last.value * 10) / 10 : null;
		});
		function toggleSeries(name) {
			trendOn.value = {
				...trendOn.value,
				[name]: !trendOn.value[name]
			};
		}
		/**
		* KPI 卡上的迷你趋势序列。
		*
		* <p>直接取 {@link trendSeries} 的点（值已归一成「活跃连接数」与「每秒请求数」），
		* 不另存一份：另存一份就得处理两份数据不同步的问题，而这两张卡的 sparkline
		* 与下方趋势图本来就该是同一条线。</p>
		*/
		const sparkActive = computed(() => (trendSeries.value["active"] ?? []).map((p) => p.value));
		const sparkRequests = computed(() => (trendSeries.value["requests"] ?? []).map((p) => p.value));
		/**
		* 区间内每秒请求峰值。
		*
		* <p>只统计非 null 点：worker 重启处是断点，把 null 当 0 参与 max 不会改变结果，
		* 但把它当「缺数据」更能避免读者以为那段时间真的是 0 req/s。</p>
		*/
		const requestsPeak = computed(() => {
			const nums = sparkRequests.value.filter((v) => v != null);
			return nums.length ? Math.round(Math.max(...nums) * 10) / 10 : null;
		});
		/**
		* Hero 副标题：实例健康 + 配置校验结论。
		*
		* <p>「配置已校验通过」只在真的跑过 {@code nginx -t} 且没有 issue 时才敢说——
		* overview 的 issues 为空即代表后端校验通过；接口失败时走「未能读取实例状态」，
		* 绝不在没取到数据时报「一切正常」。</p>
		*/
		const healthText = computed(() => {
			const o = props.overview;
			if (!o) return props.loadError ? "未能读取实例状态" : "正在读取实例状态…";
			return `${o.running === "RUNNING" ? "实例状态健康" : o.running === "STOPPED" ? "实例已停止" : "实例状态未知"} · ${o.issues?.length ? `配置有 ${o.issues.length} 项待处理` : "配置已校验通过"}`;
		});
		const urlTrend = ref(null);
		/**
		* 桶索引 → 毫秒时间戳的基准。
		*
		* <p>后端把跨度压成「等宽桶数组」再返回，是因为带宽（`bucketSeconds`）+ 点数
		* 比传一串时间戳省得多，也免得两边对时间格式化理解不一致。代价是前端必须
		* 自己把索引还原成时刻，所以这里取 `fromTime` 当基准。</p>
		*/
		const urlTrendBase = computed(() => {
			const t = urlTrend.value;
			if (!t || !t.fromEpoch) return NaN;
			return t.fromEpoch * 1e3;
		});
		/** 右侧 URL 趋势的序列（桶索引已还原成真实时刻） */
		const urlTrendSeries = computed(() => {
			const base = urlTrendBase.value;
			if (Number.isNaN(base)) return [];
			const step = (urlTrend.value?.bucketSeconds ?? 60) * 1e3;
			return (urlTrend.value?.series ?? []).map((s) => ({
				path: s.path,
				data: s.buckets.map((v, i) => [base + i * step, Number(v)])
			}));
		});
		/**
		* 实际覆盖区间的文案。
		*
		* <p>两端都用 epoch 秒格式化，显示成**浏览器本地时区**。这不是偷懒：
		* 浏览器所在时区就是读者理解的「现在几点」，而 epoch 是绝对时刻，
		* 换算后必然与读者的钟表一致。若改用后端的 `fromTime`/`toTime` 文本，
		* 那些串不带时区，浏览器会按自己的时区二次解释，跨时区就整体错位。</p>
		*
		* <p>空串表示「拿不到」——模板据此换成「暂无数据」的说法。
		* 不能退化成 `0:00:00` 这种假时间：那会把「没采到」显示成「覆盖为零秒」，
		* 读者会以为日志是空的。</p>
		*/
		const urlTrendRangeText = computed(() => {
			const t = urlTrend.value;
			if (!t?.fromEpoch || !t.toEpoch) return "";
			const opts = { hour12: false };
			const f = /* @__PURE__ */ new Date(t.fromEpoch * 1e3);
			const to = /* @__PURE__ */ new Date(t.toEpoch * 1e3);
			return `${`${f.toLocaleDateString("zh-CN", opts)} ${f.toLocaleTimeString("zh-CN", opts)}`} → ${`${f.toDateString() !== to.toDateString() ? `${to.toLocaleDateString("zh-CN", opts)} ` : ""}${to.toLocaleTimeString("zh-CN", opts)}`}`;
		});
		/**
		* 读取 URL 访问趋势。
		*
		* <p>失败一律降级成「右半边空着」，不往外抛：这个接口要 SSH 扫日志尾部，
		* 比读库慢得多也更容易受远端状态影响。它挂了不该把左边那块已经画好的
		* 采集曲线一起带走。</p>
		*/
		async function loadUrlTrend() {
			if (!props.datasourceId) {
				urlTrend.value = null;
				return;
			}
			try {
				urlTrend.value = await fetchNginxUrlTrend(props.datasourceId, 5e3, 5);
			} catch {
				urlTrend.value = null;
			}
		}
		async function loadTrend() {
			if (!props.datasourceId) {
				trend.value = null;
				urlTrend.value = null;
				trendLoaded.value = true;
				return;
			}
			trendLoading.value = true;
			try {
				loadUrlTrend();
				trend.value = await fetchNginxTrend(props.datasourceId, 24, 30);
			} catch {
				trend.value = null;
			} finally {
				trendLoading.value = false;
				trendLoaded.value = true;
			}
		}
		/** 最近一次由 SSE 推来的运行态；null 表示还没收到过推送，此时完全用 prop 的值 */
		const runtime = ref(null);
		/**
		* 已经推过的 `running` 值。
		*
		* <p>用普通变量而不是 ref：它只服务于「判断是否翻转」，不需要进渲染。
		* 放 ref 只会让模板多一个无谓的响应式依赖。</p>
		*/
		let lastPushedRunning = null;
		/**
		* 订阅当前数据源的指标 / 运行态推送。
		*
		* <p>用 `toRef(props, ...)` 而不是自己再包一层 computed：`datasourceId` 是 prop，
		* 直接以它为订阅键，父组件换数据源时流会自动断开重连到新 id，
		* 不依赖本组件有没有记得在 watch 里重连。</p>
		*/
		const { state: streamState, lastPushAt } = useNginxStream(toRef(props, "datasourceId"), {
			/**
			* 追加新点。
			*
			* <p>只往 `points` 末尾加，不动 `from` / `to`：这两个是首屏查询窗口的边界，
			* 拿来标注「本次拉取覆盖的范围」。新点落在 `to` 之后是正常的（SSE 比 HTTP 快），
			* 但把 `to` 一起往后推会让「已运行 XX 小时」这类文案跟着漂。</p>
			*/
			onMetric: (points) => {
				const cur = trend.value;
				if (!cur) return;
				trend.value = {
					...cur,
					points: mergePoints(cur.points, points)
				};
			},
			/**
			* 记住最近一次推送的运行态。
			*
			* <p>存到独立 ref 而不是直接改 `props.overview`：它是父组件传进来的 prop，
			* 写 props 在 Vue 里是「静默失败 + 下次刷新回退」的典型来源。这里只记增量，
			* 由下面的 `liveOverview` 在读取时叠加。</p>
			*
			* <p><strong>状态翻转要通知父组件</strong>：生命周期按钮（重载/重启/停止 还是 启动）
			* 判的是父组件那份 `overview.running`，本组件自己叠的实时值它看不见。
			* 不通知的话，nginx 被停掉/崩了，按钮会一直停在「运行中」那一套，
			* 用户只能手动刷新页面才发现实例已经挂了——这正是实时推送要解决的事。</p>
			*
			* <p><strong>只在翻转时通知，不每帧通知</strong>：`reloadOverview` 会遍历配置目录、
			* 跑 `nginx -t`、读日志清单，是重查询。30s 一次会把被管主机打穿，
			* 而状态没变时重载拿到的信息和上一次完全一样。所以首次推送记为基线不触发。</p>
			*/
			onRuntime: (rt) => {
				if (rt.running && rt.running !== lastPushedRunning) {
					if (lastPushedRunning !== null) emit("changed");
					lastPushedRunning = rt.running;
				}
				runtime.value = rt;
			}
		});
		/**
		* 把 SSE 推送的实时运行态叠加到 `props.overview` 上。
		*
		* <p>只覆盖运行态那几个字段，**不整体替换**：`overview` 里还有配置文件数、
		* 监听端口、编译参数等一次性重查询的结果，SSE 不带这些，整体换掉会把它们
		* 全抹成 undefined，卡片集体空掉。</p>
		*
		* <p>`activeConnections` 只在本次成功读到 stub_status 时才更新：一次读失败不该
		* 让刚采到的连接数从图上消失。`masterPid` / `uptimeText` 同样用 `??` 兜住 null，
		* 因为「这轮没读到进程信息」不等于「进程没了」。</p>
		*/
		const liveOverview = computed(() => {
			const cur = props.overview;
			const rt = runtime.value;
			if (!cur || !rt) return cur;
			return {
				...cur,
				running: rt.running ?? cur.running,
				masterPid: rt.masterPid ?? cur.masterPid,
				uptimeText: rt.uptimeText ?? cur.uptimeText,
				status: rt.statusAvailable && cur.status ? {
					...cur.status,
					activeConnections: rt.activeConnections ?? cur.status.activeConnections
				} : cur.status
			};
		});
		/** 推送状态文案：不写「已连接」而写清楚「有没有在收新点」，因为连上≠有数据 */
		const streamHint = computed(() => {
			if (streamState.value === "open") return lastPushAt.value ? `实时 · ${lastPushAt.value}` : "实时已连接";
			if (streamState.value === "connecting") return "正在连接实时推送…";
			if (streamState.value === "error") return "实时推送已断开，正在重连";
			return "未开启实时推送";
		});
		const top = ref(null);
		const topLoading = ref(false);
		const topLoaded = ref(false);
		const topErr = ref("");
		/** 头部说明：把「扫了多少行」讲清楚，避免被误读成全量统计 */
		const topLabel = computed(() => {
			if (!top.value?.total) return "实时扫描日志尾部";
			return `解析 ${top.value.total}/${top.value.scanned} 行`;
		});
		/**
		* 状态码类别配色已移入 `NginxStatusBarChart`。
		*
		* <p>原先这里是模板里 `style="background: var(--…)"` 的取值函数。ECharts 画在
		* canvas 上，不认 CSS 变量，图表组件改为在渲染时用 `getComputedStyle` 读令牌，
		* 模板里已无引用，函数随之删除（留着就是一个永远不被调用的死函数）。</p>
		*/
		async function loadTop() {
			if (!props.datasourceId) {
				top.value = null;
				topLoaded.value = true;
				return;
			}
			topLoading.value = true;
			topErr.value = "";
			try {
				top.value = await fetchNginxAccessTop(props.datasourceId, 2e3, 0, 10);
			} catch (e) {
				top.value = null;
				topErr.value = e?.message || String(e);
			} finally {
				topLoading.value = false;
				topLoaded.value = true;
			}
		}
		watch(() => props.datasourceId, (id) => {
			trendLoaded.value = false;
			topLoaded.value = false;
			if (id) {
				loadTrend();
				loadTop();
			}
		}, { immediate: true });
		/**
		* Hero 主状态文案。
		*
		* <p>与顶栏状态胶囊（NginxManageView#statusText）保持同一套三态判定：加载中 /
		* 未取到数据 / 状态未知。两处各写一份是重复，但它们分属父子组件、props 契约不同，
		* 强行抽公共函数反而要跨组件传 props；这里用注释互相锚定，改一处记得同步另一处。
		* 不区分加载态的后果是：首屏那一两秒 Hero 显示「状态未知」，和「nginx 真停了」一样，
		* 排查时会被直接带偏。</p>
		*/
		const runningText = computed(() => {
			const r = props.overview?.running;
			if (r === "RUNNING") return "运行中";
			if (r === "STOPPED") return "已停止";
			if (props.loadError) return "未取到数据";
			if (props.loading && !props.overview) return "加载中";
			return "状态未知";
		});
		/**
		* Top 条目占已解析行数的百分比（整数）。
		*
		* <p>分母用 {@code total}（成功解析的行数）而不是榜单最大值：最大值作分母时
		* 第一名永远是 100%，后面几条挤成一条线，看不出差距。</p>
		*
		* @param hits 该条目的命中数
		* @returns 百分比整数
		*/
		function pctOfTop(hits) {
			const total = top.value?.total ?? 0;
			return total > 0 ? Math.round(hits / total * 100) : 0;
		}
		const heroClass = computed(() => {
			const r = props.overview?.running;
			if (r === "RUNNING") return "is-running";
			if (r === "STOPPED") return "is-stopped";
			if (props.loadError) return "is-error";
			if (props.loading && !props.overview) return "is-loading";
			return "is-unknown";
		});
		/** 图标随状态走：加载中用转圈样式的问题交给 v-loading，这里只区分「问号 / 播放 / 暂停」 */
		const heroIcon = computed(() => {
			const r = props.overview?.running;
			if (r === "RUNNING") return "VideoPlay";
			if (r === "STOPPED") return "VideoPause";
			return "QuestionFilled";
		});
		/** 千分位；空值显示为破折号 */
		function formatNumber(n) {
			if (n === null || n === void 0) return "—";
			return n.toLocaleString("en-US");
		}
		/** 字节数转可读文本 */
		function formatSize(bytes) {
			if (!bytes) return "";
			const units = [
				"B",
				"KB",
				"MB",
				"GB"
			];
			let v = bytes;
			let i = 0;
			while (v >= 1024 && i < units.length - 1) {
				v /= 1024;
				i++;
			}
			return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
		}
		__expose({
			formatSize,
			formatNumber,
			fetchNginxOverview,
			emit
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$9, [__props.loading && !loaded.value ? (openBlock(), createElementBlock("div", _hoisted_2$9, [
				createBaseVNode("div", _hoisted_3$9, [
					createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 0,
						class: "ngx-skel-hero-icon ngx-skel-round"
					}),
					createBaseVNode("div", _hoisted_4$9, [createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 2
					})]),
					createBaseVNode("div", _hoisted_5$9, [(openBlock(), createElementBlock(Fragment, null, renderList(4, (i) => {
						return createVNode(unref(ReSkeleton_default), {
							key: i,
							loading: "",
							animated: "",
							rows: 2
						});
					}), 64))])
				]),
				createBaseVNode("div", _hoisted_6$9, [(openBlock(), createElementBlock(Fragment, null, renderList(4, (i) => {
					return createVNode(unref(ReSkeleton_default), {
						key: i,
						loading: "",
						animated: "",
						rows: 2
					});
				}), 64))]),
				createBaseVNode("div", _hoisted_7$9, [_cache[1] || (_cache[1] = createBaseVNode("div", { class: "ngx-card-head" }, [createBaseVNode("span", { class: "ngx-card-title ngx-skel-block ngx-skel-w-sm" })], -1)), createBaseVNode("div", _hoisted_8$9, [createVNode(unref(ReSkeleton_default), {
					loading: "",
					animated: "",
					rows: 6
				})])])
			])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
				createBaseVNode("div", { class: normalizeClass(["ngx-hero", heroClass.value]) }, [
					createBaseVNode("div", _hoisted_9$9, [createVNode(unref(component$1), {
						name: heroIcon.value,
						size: 26
					}, null, 8, ["name"])]),
					createBaseVNode("div", _hoisted_10$9, [
						createBaseVNode("div", _hoisted_11$9, toDisplayString(runningText.value), 1),
						createBaseVNode("div", _hoisted_12$8, toDisplayString(healthText.value), 1),
						droppedConnections.value !== null && droppedConnections.value > 0 ? (openBlock(), createElementBlock("div", _hoisted_13$7, [createVNode(unref(component$1), {
							name: "Warning",
							size: 12
						}), createTextVNode(" 已丢弃连接 " + toDisplayString(formatNumber(droppedConnections.value)) + "：accept 队列溢出（backlog 不够 / worker 忙不过来） ", 1)])) : createCommentVNode("", true)
					]),
					createBaseVNode("div", _hoisted_14$6, [
						createBaseVNode("div", _hoisted_15$5, [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "ngx-fact-label" }, "主进程", -1)), createBaseVNode("span", _hoisted_16$5, toDisplayString(liveOverview.value?.masterPid ? `PID ${liveOverview.value.masterPid}` : "—"), 1)]),
						createBaseVNode("div", _hoisted_17$5, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "ngx-fact-label" }, "已运行", -1)), createBaseVNode("span", _hoisted_18$3, toDisplayString(liveOverview.value?.uptimeText || "—"), 1)]),
						createBaseVNode("div", _hoisted_19$3, [_cache[4] || (_cache[4] = createBaseVNode("span", { class: "ngx-fact-label" }, "监听地址", -1)), createBaseVNode("span", _hoisted_20$3, toDisplayString(__props.endpoint || "—"), 1)]),
						createBaseVNode("div", {
							class: "ngx-fact",
							title: KPI_HINTS.dropped
						}, [_cache[5] || (_cache[5] = createBaseVNode("span", { class: "ngx-fact-label" }, "丢弃连接", -1)), createBaseVNode("span", { class: normalizeClass(["ngx-fact-value mono", { "is-bad": droppedConnections.value !== null && droppedConnections.value > 0 }]) }, toDisplayString(droppedConnections.value === null ? "—" : formatNumber(droppedConnections.value)), 3)], 8, _hoisted_21$3)
					])
				], 2),
				createBaseVNode("div", _hoisted_22$3, [
					createBaseVNode("div", {
						class: "ngx-kpi",
						style: { "--k": "var(--metric-cpu, var(--brand-500))" },
						title: KPI_HINTS.active
					}, [
						_cache[6] || (_cache[6] = createBaseVNode("div", { class: "ngx-kpi-label" }, [createBaseVNode("i", { class: "ngx-kpi-dot" }), createTextVNode("活跃连接")], -1)),
						createBaseVNode("div", _hoisted_24$2, toDisplayString(liveOverview.value?.status?.activeConnections ?? "—"), 1),
						createBaseVNode("div", _hoisted_25$2, [createBaseVNode("span", _hoisted_26$2, " 读取 " + toDisplayString(liveOverview.value?.status?.reading ?? "—") + " · 写入 " + toDisplayString(liveOverview.value?.status?.writing ?? "—") + " · 等待 " + toDisplayString(liveOverview.value?.status?.waiting ?? "—"), 1), createVNode(Sparkline_default, {
							class: "ngx-kpi-spark",
							values: sparkActive.value,
							token: "--metric-cpu"
						}, null, 8, ["values"])])
					], 8, _hoisted_23$3),
					createBaseVNode("div", {
						class: "ngx-kpi",
						style: { "--k": "var(--metric-disk, var(--status-warning))" },
						title: KPI_HINTS.requests
					}, [
						_cache[8] || (_cache[8] = createBaseVNode("div", { class: "ngx-kpi-label" }, [createBaseVNode("i", { class: "ngx-kpi-dot" }), createTextVNode("每秒请求")], -1)),
						createBaseVNode("div", _hoisted_28$2, [createTextVNode(toDisplayString(trendRequestRate.value ?? "—"), 1), _cache[7] || (_cache[7] = createBaseVNode("span", { class: "ngx-kpi-unit" }, "req/s", -1))]),
						createBaseVNode("div", _hoisted_29$2, [createBaseVNode("span", _hoisted_30$2, " 区间峰值 " + toDisplayString(requestsPeak.value === null ? "—" : `${requestsPeak.value} req/s`) + " · 累计 " + toDisplayString(formatNumber(liveOverview.value?.status?.requests)), 1), createVNode(Sparkline_default, {
							class: "ngx-kpi-spark",
							values: sparkRequests.value,
							token: "--metric-disk"
						}, null, 8, ["values"])])
					], 8, _hoisted_27$2),
					createBaseVNode("div", {
						class: normalizeClass(["ngx-kpi", {
							"is-warn": top.value?.clientErrors,
							"is-bad": top.value?.serverErrors
						}]),
						style: { "--k": "var(--status-success, var(--status-success))" },
						title: KPI_HINTS.errorRate
					}, [
						_cache[10] || (_cache[10] = createBaseVNode("div", { class: "ngx-kpi-label" }, [createBaseVNode("i", { class: "ngx-kpi-dot" }), createTextVNode("错误率")], -1)),
						createBaseVNode("div", _hoisted_32$2, [errorRatePct.value === null ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("—")], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(errorRatePct.value), 1), _cache[9] || (_cache[9] = createBaseVNode("span", { class: "ngx-kpi-unit" }, "%", -1))], 64))]),
						createBaseVNode("div", _hoisted_33$2, [createBaseVNode("span", _hoisted_34$1, " 4xx " + toDisplayString(topLoaded.value ? top.value?.clientErrors ?? 0 : "—") + " · 5xx " + toDisplayString(topLoaded.value ? top.value?.serverErrors ?? 0 : "—"), 1)])
					], 10, _hoisted_31$2),
					createBaseVNode("div", {
						class: "ngx-kpi",
						style: { "--k": "var(--metric-mem, var(--brand-500))" },
						title: KPI_HINTS.bytes
					}, [
						_cache[11] || (_cache[11] = createBaseVNode("div", { class: "ngx-kpi-label" }, [createBaseVNode("i", { class: "ngx-kpi-dot" }), createTextVNode("出站流量")], -1)),
						createBaseVNode("div", _hoisted_36, [top.value?.bytesSent != null ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(toDisplayString(formatSize(top.value.bytesSent)), 1)], 64)) : topLoaded.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode("无法统计")], 64)) : (openBlock(), createElementBlock(Fragment, { key: 2 }, [createTextVNode("—")], 64))]),
						createBaseVNode("div", _hoisted_37, [createBaseVNode("span", _hoisted_38, [topLoaded.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("独立访客 IP " + toDisplayString(uniqueIpCount.value), 1)], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode("按本次扫描口径")], 64))])])
					], 8, _hoisted_35$1)
				]),
				createBaseVNode("div", _hoisted_39, [createBaseVNode("div", _hoisted_40, [
					_cache[13] || (_cache[13] = createBaseVNode("span", { class: "ngx-card-title" }, "24 小时趋势", -1)),
					createBaseVNode("span", _hoisted_41, "数据来自 stub_status · 每 " + toDisplayString(trend.value?.interval ?? 30) + " 分钟采集", 1),
					createBaseVNode("div", _hoisted_42, [(openBlock(), createElementBlock(Fragment, null, renderList(TREND_SERIES, (s) => {
						return createBaseVNode("button", {
							key: s.name,
							type: "button",
							class: normalizeClass(["ngx-trend-key", { "is-off": !trendOn.value[s.name] }]),
							style: normalizeStyle({ "--k": s.color }),
							onClick: ($event) => toggleSeries(s.name)
						}, [_cache[12] || (_cache[12] = createBaseVNode("i", { class: "ngx-trend-dot" }, null, -1)), createTextVNode(toDisplayString(s.label), 1)], 14, _hoisted_43);
					}), 64))]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新趋势",
						"data-testid": "ngx-btn-refresh-trend",
						loading: trendLoading.value,
						onClick: loadTrend
					}, null, 8, ["loading"])
				]), !trendLoaded.value ? (openBlock(), createElementBlock("div", _hoisted_44, [createVNode(unref(component$1), {
					name: "Loading",
					size: 14
				}), _cache[14] || (_cache[14] = createTextVNode(" 正在读取趋势… ", -1))])) : !hasTrend.value ? (openBlock(), createBlock(unref(ReAlert), {
					key: 1,
					type: "info",
					title: trend.value?.message || "最近 24 小时没有采集到数据"
				}, null, 8, ["title"])) : (openBlock(), createElementBlock("div", _hoisted_45, [
					createVNode(NginxTrendChart_default, {
						series: chartSeries.value,
						"url-series": urlTrendSeries.value,
						"url-title": "URL 访问趋势",
						height: 190
					}, null, 8, ["series", "url-series"]),
					createBaseVNode("div", _hoisted_46, [
						createBaseVNode("span", null, toDisplayString(trendFromText.value), 1),
						createBaseVNode("span", _hoisted_47, [createBaseVNode("i", { class: normalizeClass(["ngx-trend-live-dot", `is-${unref(streamState)}`]) }, null, 2), createTextVNode(" " + toDisplayString(streamHint.value), 1)]),
						createBaseVNode("span", null, toDisplayString(trendToText.value), 1)
					]),
					_cache[17] || (_cache[17] = createBaseVNode("div", { class: "ngx-trend-note" }, " 请求速率为「每秒增量」。worker 重启后 nginx 计数器归零，该点断开不连线， 避免被误读成流量暴跌。 ", -1)),
					createBaseVNode("div", _hoisted_48, [urlTrendRangeText.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
						_cache[15] || (_cache[15] = createTextVNode(" 右侧 URL 访问趋势扫的是 access log 尾部， ", -1)),
						createBaseVNode("strong", null, "实际覆盖 " + toDisplayString(urlTrendRangeText.value), 1),
						_cache[16] || (_cache[16] = createTextVNode("，与左侧 24 小时窗口不是同一尺度。 ", -1))
					], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode("右侧 URL 访问趋势暂无数据（access log 尾部没有可解析的记录）。")], 64))])
				]))]),
				createBaseVNode("div", _hoisted_49, [createBaseVNode("div", _hoisted_50, [
					_cache[18] || (_cache[18] = createBaseVNode("span", { class: "ngx-card-title" }, "访问 Top", -1)),
					createBaseVNode("span", _hoisted_51, toDisplayString(topLabel.value), 1),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新访问 Top",
						"data-testid": "ngx-btn-refresh-top",
						loading: topLoading.value,
						onClick: loadTop
					}, null, 8, ["loading"])
				]), !topLoaded.value ? (openBlock(), createElementBlock("div", _hoisted_52, [createVNode(unref(component$1), {
					name: "Loading",
					size: 14
				}), _cache[19] || (_cache[19] = createTextVNode(" 正在统计访问日志… ", -1))])) : !top.value ? (openBlock(), createBlock(unref(ReAlert), {
					key: 1,
					type: "info",
					title: topErr.value || "暂无访问日志统计"
				}, null, 8, ["title"])) : !top.value.total ? (openBlock(), createElementBlock("div", _hoisted_53, [createVNode(unref(component$1), {
					name: "Document",
					size: 14
				}), createTextVNode(" " + toDisplayString(top.value.message || "access log 里没有可统计的记录"), 1)])) : (openBlock(), createElementBlock("div", _hoisted_54, [
					createVNode(NginxStatusBarChart_default, {
						items: top.value.statuses,
						height: Math.max(88, top.value.statuses.length * 26)
					}, null, 8, ["items", "height"]),
					createBaseVNode("div", _hoisted_55, [createBaseVNode("div", _hoisted_56, [_cache[20] || (_cache[20] = createBaseVNode("div", { class: "ngx-top-col-title" }, "访问路径", -1)), createBaseVNode("ul", _hoisted_57, [(openBlock(true), createElementBlock(Fragment, null, renderList(top.value.paths.slice(0, 6), (p) => {
						return openBlock(), createElementBlock("li", {
							key: p.key,
							class: "ngx-top-item"
						}, [
							createBaseVNode("span", {
								class: "ngx-top-key mono",
								title: p.key
							}, toDisplayString(p.key), 9, _hoisted_58),
							createBaseVNode("span", _hoisted_59, [createTextVNode(toDisplayString(p.hits.toLocaleString("en-US")) + " ", 1), createBaseVNode("i", _hoisted_60, toDisplayString(pctOfTop(p.hits)) + "%", 1)]),
							createBaseVNode("span", _hoisted_61, [createBaseVNode("span", {
								class: "ngx-top-fill",
								style: normalizeStyle({ width: `${pctOfTop(p.hits)}%` })
							}, null, 4)])
						]);
					}), 128)), !top.value.paths.length ? (openBlock(), createElementBlock("li", _hoisted_62, "无")) : createCommentVNode("", true)])]), createBaseVNode("div", _hoisted_63, [_cache[21] || (_cache[21] = createBaseVNode("div", { class: "ngx-top-col-title" }, "来源 IP", -1)), createBaseVNode("ul", _hoisted_64, [(openBlock(true), createElementBlock(Fragment, null, renderList(top.value.ips.slice(0, 6), (p) => {
						return openBlock(), createElementBlock("li", {
							key: p.key,
							class: "ngx-top-item"
						}, [
							createBaseVNode("span", {
								class: "ngx-top-key mono",
								title: p.key
							}, toDisplayString(p.key), 9, _hoisted_65),
							createBaseVNode("span", _hoisted_66, [createTextVNode(toDisplayString(p.hits.toLocaleString("en-US")) + " ", 1), createBaseVNode("i", _hoisted_67, toDisplayString(pctOfTop(p.hits)) + "%", 1)]),
							createBaseVNode("span", _hoisted_68, [createBaseVNode("span", {
								class: "ngx-top-fill is-ip",
								style: normalizeStyle({ width: `${pctOfTop(p.hits)}%` })
							}, null, 4)])
						]);
					}), 128)), !top.value.ips.length ? (openBlock(), createElementBlock("li", _hoisted_69, "无")) : createCommentVNode("", true)])])]),
					createBaseVNode("div", _hoisted_70, toDisplayString(top.value.message), 1)
				]))]),
				createBaseVNode("div", _hoisted_71, [
					createBaseVNode("div", _hoisted_72, [createBaseVNode("div", _hoisted_73, [_cache[22] || (_cache[22] = createBaseVNode("span", { class: "ngx-card-title" }, "连接状态分布", -1)), liveOverview.value?.status?.source ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: "ngx-card-sub mono",
						title: liveOverview.value.status.source
					}, toDisplayString(liveOverview.value.status.source), 9, _hoisted_74)) : createCommentVNode("", true)]), liveOverview.value?.status?.available ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(NginxConnDonut_default, {
						reading: liveOverview.value.status.reading,
						writing: liveOverview.value.status.writing,
						waiting: liveOverview.value.status.waiting,
						height: 150
					}, null, 8, [
						"reading",
						"writing",
						"waiting"
					]), createBaseVNode("div", _hoisted_75, [createBaseVNode("span", null, "接受 " + toDisplayString(formatNumber(liveOverview.value.status.accepts)), 1), createBaseVNode("span", null, "处理 " + toDisplayString(formatNumber(liveOverview.value.status.handled)), 1)])], 64)) : (openBlock(), createElementBlock("div", _hoisted_76, toDisplayString(liveOverview.value?.status?.message || "未取到 stub_status 实时数据，请在配置里加 stub_status;"), 1))]),
					createBaseVNode("div", _hoisted_77, [
						_cache[24] || (_cache[24] = createBaseVNode("div", { class: "ngx-card-head" }, [createBaseVNode("span", { class: "ngx-card-title" }, "站点与端口")], -1)),
						liveOverview.value?.listenPorts?.length ? (openBlock(), createElementBlock("div", _hoisted_78, [(openBlock(true), createElementBlock(Fragment, null, renderList(liveOverview.value.listenPorts, (p) => {
							return openBlock(), createBlock(unref(component$2), {
								key: p,
								type: p === 443 || p === 8443 ? "success" : p === 80 || p === 8080 ? "info" : "warning"
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(p), 1)]),
								_: 2
							}, 1032, ["type"]);
						}), 128))])) : (openBlock(), createElementBlock("div", _hoisted_79, "未从配置里解析到 listen 指令")),
						_cache[25] || (_cache[25] = createBaseVNode("div", { class: "ngx-label" }, "主配置", -1)),
						createBaseVNode("div", _hoisted_80, [
							createVNode(unref(component$1), {
								name: "Document",
								size: 13
							}),
							createBaseVNode("span", _hoisted_81, toDisplayString(liveOverview.value?.configPath || "—"), 1),
							liveOverview.value && !liveOverview.value.issues?.length ? (openBlock(), createBlock(unref(component$2), {
								key: 0,
								type: "success",
								effect: "plain"
							}, {
								default: withCtx(() => [..._cache[23] || (_cache[23] = [createTextVNode("已校验", -1)])]),
								_: 1
							})) : createCommentVNode("", true)
						]),
						_cache[26] || (_cache[26] = createBaseVNode("div", { class: "ngx-label" }, "配置根目录", -1)),
						createBaseVNode("div", _hoisted_82, [createVNode(unref(component$1), {
							name: "Folder",
							size: 13
						}), createBaseVNode("span", _hoisted_83, toDisplayString(liveOverview.value?.configRoot || "—"), 1)])
					]),
					createBaseVNode("div", _hoisted_84, [createBaseVNode("div", _hoisted_85, [_cache[30] || (_cache[30] = createBaseVNode("span", { class: "ngx-card-title" }, "巡检提示", -1)), __props.loadError ? (openBlock(), createBlock(unref(component$2), {
						key: 0,
						type: "danger"
					}, {
						default: withCtx(() => [..._cache[27] || (_cache[27] = [createTextVNode("未取到数据", -1)])]),
						_: 1
					})) : !liveOverview.value ? (openBlock(), createBlock(unref(component$2), {
						key: 1,
						type: "info"
					}, {
						default: withCtx(() => [..._cache[28] || (_cache[28] = [createTextVNode("加载中", -1)])]),
						_: 1
					})) : liveOverview.value.issues?.length ? (openBlock(), createBlock(unref(component$2), {
						key: 2,
						type: "warning"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(liveOverview.value.issues.length) + " 条 ", 1)]),
						_: 1
					})) : (openBlock(), createBlock(unref(component$2), {
						key: 3,
						type: "success"
					}, {
						default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("一切正常", -1)])]),
						_: 1
					}))]), __props.loadError ? (openBlock(), createElementBlock("ul", _hoisted_86, [createBaseVNode("li", null, toDisplayString(__props.loadError), 1)])) : liveOverview.value?.issues?.length ? (openBlock(), createElementBlock("ul", _hoisted_87, [(openBlock(true), createElementBlock(Fragment, null, renderList(liveOverview.value.issues, (issue, i) => {
						return openBlock(), createElementBlock("li", { key: i }, toDisplayString(issue), 1);
					}), 128))])) : !liveOverview.value ? (openBlock(), createElementBlock("div", _hoisted_88, [createVNode(unref(component$1), {
						name: "Loading",
						size: 15,
						class: "ngx-ok-icon"
					}), _cache[31] || (_cache[31] = createBaseVNode("span", null, "正在读取实例状态…", -1))])) : (openBlock(), createElementBlock("div", _hoisted_89, [createVNode(unref(component$1), {
						name: "CircleCheckFilled",
						size: 15,
						class: "ngx-ok-icon"
					}), _cache[32] || (_cache[32] = createBaseVNode("span", null, "未发现问题：进程在跑、配置语法通过、实时状态可读。", -1))]))])
				]),
				createBaseVNode("div", _hoisted_90, [createBaseVNode("div", {
					class: "ngx-card-head is-clickable",
					onClick: _cache[0] || (_cache[0] = ($event) => showArgs.value = !showArgs.value)
				}, [createBaseVNode("span", _hoisted_91, [createVNode(unref(component$1), {
					name: "DocumentCopy",
					size: 14
				}), _cache[33] || (_cache[33] = createTextVNode(" 编译参数 ", -1))]), createBaseVNode("span", _hoisted_92, [_cache[34] || (_cache[34] = createTextVNode(" 决定本机能用哪些模块与指令 ", -1)), createVNode(unref(component$1), {
					name: showArgs.value ? "ArrowUp" : "ArrowDown",
					size: 13
				}, null, 8, ["name"])])]), showArgs.value ? (openBlock(), createElementBlock("pre", _hoisted_93, toDisplayString(liveOverview.value?.version?.configureArguments || "—"), 1)) : createCommentVNode("", true)])
			], 64))]);
		};
	}
}), [["__scopeId", "data-v-558398d0"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/NginxSitePanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$8 = { class: "ngs" };
var _hoisted_2$8 = { class: "ngs-bar" };
var _hoisted_3$8 = { class: "ngs-count" };
var _hoisted_4$8 = { class: "ngs-body" };
var _hoisted_5$8 = {
	key: 0,
	class: "ngs-skel",
	"aria-busy": "true",
	"aria-label": "站点加载中"
};
var _hoisted_6$8 = { class: "ngx-card-head" };
var _hoisted_7$8 = ["title"];
var _hoisted_8$8 = { class: "ngs-tags" };
var _hoisted_9$8 = { class: "ngs-facts" };
var _hoisted_10$8 = {
	key: 0,
	class: "ngs-fact"
};
var _hoisted_11$8 = { class: "mono" };
var _hoisted_12$7 = { class: "mono" };
var _hoisted_13$6 = { class: "ngs-fact" };
var _hoisted_14$5 = { class: "ngs-fact" };
var _hoisted_15$4 = { class: "mono ngx-break" };
var _hoisted_16$4 = {
	key: 0,
	class: "ngs-warns"
};
var _hoisted_17$4 = { class: "ngs-ops" };
//#endregion
//#region ../../pages/datasource/src/components/console/NginxSitePanel.vue
var NginxSitePanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxSitePanel",
	props: { datasourceId: {} },
	emits: ["edit"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const sites = ref([]);
		const loading = ref(false);
		/**
		* 首屏是否已渲染过真实内容。
		*
		* <p>骨架屏只在首次出现：之后刷新不再退回骨架，否则每次重新拉站点清单
		* 都会整页闪一下。</p>
		*/
		const loaded = ref(false);
		const keyword = ref("");
		const scheme = ref("all");
		const onlyWarned = ref(false);
		const warnedCount = computed(() => sites.value.filter((s) => s.warnings.length > 0).length);
		const filtered = computed(() => {
			const k = keyword.value.trim().toLowerCase();
			return sites.value.filter((s) => {
				if (scheme.value === "http" && s.https) return false;
				if (scheme.value === "https" && !s.https) return false;
				if (onlyWarned.value && !s.warnings.length) return false;
				if (!k) return true;
				return [
					s.displayName,
					...s.serverNames,
					s.rootDir || "",
					...s.proxyTargets,
					...s.upstreamRefs,
					s.file
				].join(" ").toLowerCase().includes(k);
			});
		});
		/**
		* 判断一个 proxy_pass 目标是否引用了 upstream。
		*
		* <p>后端已把纯名字目标（不含点号与端口）归入 {@code upstreamRefs}，
		* 这里只做匹配，不在前端重复实现同一套解析规则。</p>
		*
		* @param site   站点
		* @param target proxy_pass 目标
		* @returns 是否为 upstream 引用
		*/
		function isUpstream(site, target) {
			if (!site.upstreamRefs.length) return false;
			const host = target.replace(/^https?:\/\//, "").split(/[/:;]/)[0] || "";
			return site.upstreamRefs.includes(host);
		}
		function onKeyword(val) {
			keyword.value = val === null || val === void 0 ? "" : String(val);
		}
		function onScheme(val) {
			scheme.value = String(val);
		}
		function onOnlyWarned(val) {
			onlyWarned.value = Boolean(val);
		}
		async function load() {
			if (!props.datasourceId) {
				sites.value = [];
				return;
			}
			loading.value = true;
			try {
				sites.value = await fetchNginxSites(props.datasourceId) || [];
			} catch (e) {
				sites.value = [];
				message.error(`读取站点清单失败：${e.message}`);
			} finally {
				loading.value = false;
				loaded.value = true;
			}
		}
		function shortPath(p) {
			return p;
		}
		function copyUrl(s) {
			const schemeName = s.https ? "https" : "http";
			const port = s.listenPorts[0];
			const host = s.serverNames[0] || s.displayName;
			if (!host) {
				message.warning("该站点没有 server_name，无法拼出访问地址");
				return;
			}
			const url = `${schemeName}://${host}${schemeName === "http" && port === 80 || schemeName === "https" && port === 443 || !port ? "" : `:${port}`}`;
			copyToClipboard(url).then((ok) => ok ? message.success(`已复制 ${url}`) : message.warning(`复制失败，请手动复制：${url}`));
		}
		watch(() => props.datasourceId, load, { immediate: true });
		__expose({
			load,
			sites
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$8, [
				createBaseVNode("div", _hoisted_2$8, [
					createVNode(unref(ReInput_default), {
						"model-value": keyword.value,
						style: { "width": "240px" },
						placeholder: "按域名 / 路径 / 后端搜索",
						"onUpdate:modelValue": onKeyword
					}, null, 8, ["model-value"]),
					createVNode(unref(ReSelect_default), {
						"model-value": scheme.value,
						style: { "width": "130px" },
						onChange: onScheme
					}, {
						default: withCtx(() => [
							createVNode(unref(ReOption), {
								value: "all",
								label: "全部协议"
							}),
							createVNode(unref(ReOption), {
								value: "http",
								label: "仅 HTTP"
							}),
							createVNode(unref(ReOption), {
								value: "https",
								label: "仅 HTTPS"
							})
						]),
						_: 1
					}, 8, ["model-value"]),
					createVNode(unref(ReSwitch_default), {
						"model-value": onlyWarned.value,
						"aria-label": "只看有提示的",
						onChange: onOnlyWarned
					}, null, 8, ["model-value"]),
					_cache[0] || (_cache[0] = createBaseVNode("span", { class: "ngs-label" }, "只看有提示的", -1)),
					createBaseVNode("span", _hoisted_3$8, [createTextVNode(" 共 " + toDisplayString(sites.value.length) + " 个站点", 1), filtered.value.length !== sites.value.length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode("，当前显示 " + toDisplayString(filtered.value.length) + " 个", 1)], 64)) : createCommentVNode("", true)]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新",
						"data-testid": "ngs-btn-refresh",
						loading: loading.value,
						onClick: load
					}, null, 8, ["loading"])
				]),
				warnedCount.value ? (openBlock(), createBlock(unref(ReAlert), {
					key: 0,
					type: "warning",
					title: `${warnedCount.value} 个站点存在需要留意的问题，已在卡片上标出`
				}, null, 8, ["title"])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_4$8, [loading.value && !loaded.value ? (openBlock(), createElementBlock("div", _hoisted_5$8, [(openBlock(), createElementBlock(Fragment, null, renderList(3, (i) => {
					return createBaseVNode("div", {
						key: i,
						class: "ngs-skel-card"
					}, [createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 1,
						class: "ngs-skel-head"
					}), createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 4
					})]);
				}), 64))])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [!filtered.value.length ? (openBlock(), createBlock(unref(ReEmpty_default), {
					key: 0,
					description: sites.value.length ? "没有符合筛选条件的站点" : "没有找到任何 server 块。配置可能还没写，或放在了本工具没扫描到的路径下。"
				}, null, 8, ["description"])) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(filtered.value, (s) => {
					return openBlock(), createElementBlock("div", {
						key: `${s.file}#${s.nodePath}`,
						class: normalizeClass(["ngs-card", { "has-warn": s.warnings.length }])
					}, [
						createBaseVNode("div", _hoisted_6$8, [createBaseVNode("div", {
							class: "ngx-card-title",
							title: s.displayName
						}, [createVNode(unref(component$1), {
							name: s.https ? "Lock" : "Link",
							size: 14
						}, null, 8, ["name"]), createTextVNode(" " + toDisplayString(s.displayName), 1)], 8, _hoisted_7$8), createBaseVNode("div", _hoisted_8$8, [
							(openBlock(true), createElementBlock(Fragment, null, renderList(s.listenPorts, (p) => {
								return openBlock(), createBlock(unref(component$2), {
									key: p,
									type: "info"
								}, {
									default: withCtx(() => [createTextVNode(":" + toDisplayString(p), 1)]),
									_: 2
								}, 1024);
							}), 128)),
							s.https ? (openBlock(), createBlock(unref(component$2), {
								key: 0,
								type: "success"
							}, {
								default: withCtx(() => [..._cache[1] || (_cache[1] = [createTextVNode("HTTPS", -1)])]),
								_: 1
							})) : createCommentVNode("", true),
							s.defaultServer ? (openBlock(), createBlock(unref(component$2), {
								key: 1,
								type: "warning"
							}, {
								default: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode("兜底", -1)])]),
								_: 1
							})) : createCommentVNode("", true),
							s.hasCertificate ? (openBlock(), createBlock(unref(component$2), {
								key: 2,
								type: "success"
							}, {
								default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("证书已配", -1)])]),
								_: 1
							})) : createCommentVNode("", true)
						])]),
						createBaseVNode("dl", _hoisted_9$8, [
							s.rootDir ? (openBlock(), createElementBlock("div", _hoisted_10$8, [_cache[4] || (_cache[4] = createBaseVNode("dt", null, "静态目录", -1)), createBaseVNode("dd", _hoisted_11$8, toDisplayString(s.rootDir), 1)])) : createCommentVNode("", true),
							(openBlock(true), createElementBlock(Fragment, null, renderList(s.proxyTargets, (t) => {
								return openBlock(), createElementBlock("div", {
									key: t,
									class: "ngs-fact"
								}, [_cache[6] || (_cache[6] = createBaseVNode("dt", null, "转发到", -1)), createBaseVNode("dd", _hoisted_12$7, [createTextVNode(toDisplayString(t) + " ", 1), isUpstream(s, t) ? (openBlock(), createBlock(unref(component$2), {
									key: 0,
									type: "primary"
								}, {
									default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("upstream", -1)])]),
									_: 1
								})) : createCommentVNode("", true)])]);
							}), 128)),
							createBaseVNode("div", _hoisted_13$6, [_cache[7] || (_cache[7] = createBaseVNode("dt", null, "路径规则", -1)), createBaseVNode("dd", null, toDisplayString(s.locationCount) + " 条 location", 1)]),
							createBaseVNode("div", _hoisted_14$5, [_cache[8] || (_cache[8] = createBaseVNode("dt", null, "所在文件", -1)), createBaseVNode("dd", _hoisted_15$4, toDisplayString(shortPath(s.file)), 1)])
						]),
						s.warnings.length ? (openBlock(), createElementBlock("ul", _hoisted_16$4, [(openBlock(true), createElementBlock(Fragment, null, renderList(s.warnings, (w, i) => {
							return openBlock(), createElementBlock("li", { key: i }, toDisplayString(w), 1);
						}), 128))])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_17$4, [createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Edit",
							tip: "编辑这个站点",
							"data-testid": "ngs-btn-edit",
							onClick: ($event) => emit("edit", s)
						}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "CopyDocument",
							tip: "复制访问地址",
							"data-testid": "ngs-btn-copy",
							onClick: ($event) => copyUrl(s)
						}, null, 8, ["onClick"])])
					], 2);
				}), 128))], 64))])
			]);
		};
	}
}), [["__scopeId", "data-v-e9ae79c0"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/NginxModelForm.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$7 = { class: "ngf-blockname" };
var _hoisted_2$7 = { class: "ngf-lines mono" };
var _hoisted_3$7 = { class: "ngf-children" };
var _hoisted_4$7 = {
	key: 0,
	class: "ngf-empty"
};
var _hoisted_5$7 = { class: "ngf-row" };
var _hoisted_6$7 = ["title"];
var _hoisted_7$7 = { class: "ngf-control" };
var _hoisted_8$7 = { class: "ngf-unit" };
var _hoisted_9$7 = {
	key: 0,
	class: "ngf-help"
};
var _hoisted_10$7 = { class: "ngf-help-desc" };
var _hoisted_11$7 = {
	key: 0,
	class: "ngf-help-eg"
};
var _hoisted_12$6 = {
	key: 1,
	class: "ngf-help is-unknown"
};
//#endregion
//#region ../../pages/datasource/src/components/console/NginxModelForm.vue
var NginxModelForm_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxModelForm",
	props: {
		node: {},
		metas: {},
		depth: { default: 0 },
		showHelp: {
			type: Boolean,
			default: true
		},
		patchedIds: { default: () => /* @__PURE__ */ new Set() },
		focusId: { default: null }
	},
	emits: [
		"patch",
		"remove",
		"add-directive",
		"add-block"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 默认展开；存在定位目标时，只展开目标所在的那条链，其余折叠，避免大文件一打开就糊满屏 */
		const collapsed = ref(!props.focusId || !onFocusPath(props.node.id, props.focusId));
		/**
		* 判断本节点是否位于定位目标的祖先链上。
		*
		* <p>节点 id 是路径式（{@code 0/1/0}），因此「是祖先」等价于「是目标 id 的前缀」。
		* 没有定位目标时返回 true，表示全部展开。</p>
		*
		* @param id      本节点 id
		* @param focusId 定位目标 id
		* @returns 是否应展开
		*/
		function onFocusPath(id, focusId) {
			if (!focusId || !id) return true;
			return focusId === id || focusId.startsWith(`${id}/`);
		}
		/** 子区块与叶子指令分开渲染，区块在上、指令在下，与手写配置的阅读顺序一致 */
		const blocks = computed(() => props.node.children.filter((c) => c.block));
		const directives = computed(() => props.node.children.filter((c) => !c.block));
		const headPlaceholder = computed(() => {
			if (props.node.name === "location") return "路径前缀，如 / 或 /api/，支持 = ^ ~ ~* 前缀";
			if (props.node.name === "upstream") return "上游名，proxy_pass 里用 http://这个名字 引用";
			return "区块参数";
		});
		/** 开关的三态归一：空串代表「注释掉」 */
		function flagValue(v) {
			return v === "on" || v === "off" ? v : "";
		}
		function onHeadArg(val) {
			const text = val === null || val === void 0 ? "" : String(val);
			if (text === (props.node.headArg || "")) return;
			emit("patch", {
				nodeId: props.node.id,
				op: "UPDATE",
				name: props.node.name,
				headArg: text
			});
		}
		/**
		* 指令值变更。
		*
		* <p>刻意收 {@code unknown}：同一个处理函数要接住 ReSelect 的字符串、
		* ReInputNumber 的数字或 undefined、以及自研输入组件的其它形态，统一在函数内归一为文本。</p>
		*
		* @param d   指令节点
		* @param val 新值
		*/
		function onValue(d, val) {
			const text = val === null || val === void 0 ? "" : String(val);
			if (text === d.value) return;
			emit("patch", {
				nodeId: d.id,
				op: "UPDATE",
				name: d.name,
				value: text
			});
		}
		/** 子组件冒上来的补丁原样转发 */
		function onChildPatch(p) {
			emit("patch", p);
		}
		function onChildRemove(d) {
			if (d && d.id) emit("remove", d);
		}
		function onChildAdd(parent, kind) {
			if (kind === "directive") emit("add-directive", parent);
			else emit("add-block", parent);
		}
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_NginxModelForm = resolveComponent("NginxModelForm", true);
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReOption = resolveComponent("ReOption");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			return openBlock(), createElementBlock("div", {
				class: "ngf",
				style: normalizeStyle({ "--ngf-depth": __props.depth })
			}, [__props.node.block ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(["ngf-blockhead", { "is-focused": __props.node.id === __props.focusId }])
			}, [
				createVNode(_component_ReIcon, {
					name: collapsed.value ? "CaretRight" : "CaretBottom",
					size: 13,
					class: "ngf-caret",
					onClick: _cache[0] || (_cache[0] = ($event) => collapsed.value = !collapsed.value)
				}, null, 8, ["name"]),
				createBaseVNode("span", _hoisted_1$7, toDisplayString(__props.node.name), 1),
				__props.node.headArg !== null || __props.node.name === "location" || __props.node.name === "upstream" ? (openBlock(), createBlock(_component_ReInput, {
					key: 0,
					"model-value": __props.node.headArg || "",
					class: "ngf-headarg",
					placeholder: headPlaceholder.value,
					onChange: onHeadArg
				}, null, 8, ["model-value", "placeholder"])) : createCommentVNode("", true),
				createBaseVNode("span", _hoisted_2$7, toDisplayString(__props.node.startLine) + "-" + toDisplayString(__props.node.endLine), 1),
				createVNode(_component_ReButton, {
					layout: "square",
					icon: "Plus",
					tip: "给这个块加一条指令",
					onClick: _cache[1] || (_cache[1] = ($event) => emit("add-directive"))
				}),
				createVNode(_component_ReButton, {
					layout: "square",
					icon: "FolderAdd",
					tip: "给这个块加一层子块",
					onClick: _cache[2] || (_cache[2] = ($event) => emit("add-block"))
				}),
				createVNode(_component_ReButton, {
					layout: "square",
					type: "danger",
					icon: "Delete",
					tip: "删除这个块",
					onClick: _cache[3] || (_cache[3] = ($event) => emit("remove"))
				})
			], 2)) : createCommentVNode("", true), withDirectives(createBaseVNode("div", _hoisted_3$7, [
				!directives.value.length && !blocks.value.length ? (openBlock(), createElementBlock("div", _hoisted_4$7, " 这个块里还没有内容。点右上角「指令」加一条，或「子块」加一层。 ")) : createCommentVNode("", true),
				(openBlock(true), createElementBlock(Fragment, null, renderList(blocks.value, (child, ci) => {
					return openBlock(), createElementBlock("div", {
						key: child.id || `b${ci}`,
						class: "ngf-item is-block"
					}, [createVNode(_component_NginxModelForm, {
						node: child,
						metas: __props.metas,
						depth: __props.depth + 1,
						"show-help": __props.showHelp,
						"patched-ids": __props.patchedIds,
						"focus-id": __props.focusId,
						onPatch: onChildPatch,
						onRemove: onChildRemove,
						onAddDirective: ($event) => onChildAdd(child, "directive"),
						onAddBlock: ($event) => onChildAdd(child, "block")
					}, null, 8, [
						"node",
						"metas",
						"depth",
						"show-help",
						"patched-ids",
						"focus-id",
						"onAddDirective",
						"onAddBlock"
					])]);
				}), 128)),
				(openBlock(true), createElementBlock(Fragment, null, renderList(directives.value, (d, di) => {
					return openBlock(), createElementBlock("div", {
						key: d.id || `d${di}`,
						class: "ngf-item is-directive"
					}, [createBaseVNode("div", _hoisted_5$7, [
						createBaseVNode("div", {
							class: "ngf-name",
							title: d.meta?.desc || "未登记的指令，将按原样保存"
						}, [createTextVNode(toDisplayString(d.name) + " ", 1), d.meta?.required ? (openBlock(), createBlock(_component_ReTag, {
							key: 0,
							type: "danger"
						}, {
							default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode("必填", -1)])]),
							_: 1
						})) : !d.known ? (openBlock(), createBlock(_component_ReTag, {
							key: 1,
							type: "info"
						}, {
							default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("原样保留", -1)])]),
							_: 1
						})) : createCommentVNode("", true)], 8, _hoisted_6$7),
						createBaseVNode("div", _hoisted_7$7, [d.meta?.argType === "flag" ? (openBlock(), createBlock(_component_ReSelect, {
							key: 0,
							"model-value": flagValue(d.value),
							class: "ngf-flag",
							onChange: ($event) => onValue(d, $event)
						}, {
							default: withCtx(() => [
								createVNode(_component_ReOption, {
									value: "on",
									label: "on（启用）"
								}),
								createVNode(_component_ReOption, {
									value: "off",
									label: "off（关闭）"
								}),
								createVNode(_component_ReOption, {
									value: "",
									label: "注释掉"
								})
							]),
							_: 1
						}, 8, ["model-value", "onChange"])) : d.meta?.argType === "enum" && d.meta.enumValues.length ? (openBlock(), createBlock(_component_ReSelect, {
							key: 1,
							"model-value": d.value,
							filterable: "",
							"allow-create": "",
							"default-first-option": "",
							class: "ngf-enum",
							onChange: ($event) => onValue(d, $event)
						}, null, 8, ["model-value", "onChange"])) : d.meta?.argType === "number" ? (openBlock(), createBlock(_component_ReInputNumber, {
							key: 2,
							"model-value": Number(d.value),
							"controls-position": "right",
							class: "ngf-num",
							onChange: ($event) => onValue(d, $event)
						}, null, 8, ["model-value", "onChange"])) : d.meta?.argType === "size" || d.meta?.argType === "duration" ? (openBlock(), createBlock(_component_ReInput, {
							key: 3,
							"model-value": d.value,
							class: "ngf-sized",
							placeholder: d.meta.example,
							onChange: ($event) => onValue(d, $event)
						}, {
							suffix: withCtx(() => [createBaseVNode("span", _hoisted_8$7, toDisplayString(d.meta.argType === "size" ? "如 10m" : "如 60s"), 1)]),
							_: 2
						}, 1032, [
							"model-value",
							"placeholder",
							"onChange"
						])) : d.meta?.argType === "text" ? (openBlock(), createBlock(_component_ReInput, {
							key: 4,
							"model-value": d.value,
							type: "textarea",
							rows: 3,
							class: "ngf-text",
							onChange: ($event) => onValue(d, $event)
						}, null, 8, ["model-value", "onChange"])) : (openBlock(), createBlock(_component_ReInput, {
							key: 5,
							"model-value": d.value,
							class: "ngf-plain",
							placeholder: d.meta?.example || "值",
							onChange: ($event) => onValue(d, $event)
						}, null, 8, [
							"model-value",
							"placeholder",
							"onChange"
						]))]),
						createVNode(_component_ReButton, {
							layout: "square",
							type: "danger",
							icon: "Close",
							tip: `删除指令 ${d.name}`,
							onClick: ($event) => emit("remove", d)
						}, null, 8, ["tip", "onClick"])
					]), __props.showHelp && d.meta ? (openBlock(), createElementBlock("div", _hoisted_9$7, [createBaseVNode("span", _hoisted_10$7, toDisplayString(d.meta.desc), 1), d.meta.example ? (openBlock(), createElementBlock("span", _hoisted_11$7, "示例：" + toDisplayString(d.meta.example), 1)) : createCommentVNode("", true)])) : !d.known ? (openBlock(), createElementBlock("div", _hoisted_12$6, [createBaseVNode("span", null, [
						_cache[6] || (_cache[6] = createTextVNode(" 指令 ", -1)),
						createBaseVNode("code", null, toDisplayString(d.name), 1),
						_cache[7] || (_cache[7] = createTextVNode(" 未登记在元数据表里（可能是第三方模块或版本较新）。可以正常编辑，保存时按原样写入。 ", -1))
					])])) : createCommentVNode("", true)]);
				}), 128))
			], 512), [[vShow, !collapsed.value]])], 4);
		};
	}
}), [["__scopeId", "data-v-8d768c1d"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/NginxConfigPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$6 = { class: "ngc" };
var _hoisted_2$6 = { class: "ngc-body" };
var _hoisted_3$6 = { class: "ngc-side" };
var _hoisted_4$6 = { class: "ngx-card-head ngc-side-head" };
var _hoisted_5$6 = { class: "ngc-side-ops" };
var _hoisted_6$6 = { class: "ngc-side-body" };
var _hoisted_7$6 = [
	"title",
	"onClick",
	"onContextmenu"
];
var _hoisted_8$6 = { class: "ngc-filename" };
var _hoisted_9$6 = { class: "ngc-filedir" };
var _hoisted_10$6 = { class: "ngc-main" };
var _hoisted_11$6 = { class: "ngc-bar" };
var _hoisted_12$5 = ["title"];
var _hoisted_13$5 = {
	class: "ngc-seg",
	role: "group",
	"aria-label": "配置模式"
};
var _hoisted_14$4 = {
	key: 1,
	class: "ngc-warns"
};
var _hoisted_15$3 = { class: "ngc-editor" };
var _hoisted_16$3 = {
	key: 0,
	class: "ngc-skel",
	"aria-busy": "true",
	"aria-label": "配置加载中"
};
var _hoisted_17$3 = { class: "ngc-gutter" };
var _hoisted_18$2 = { class: "ngc-model" };
var _hoisted_19$2 = {
	key: 0,
	class: "ngc-skel",
	"aria-busy": "true",
	"aria-label": "配置加载中"
};
var _hoisted_20$2 = { class: "ngc-foot" };
var _hoisted_21$2 = { class: "ngc-opts" };
var _hoisted_22$2 = { class: "ngc-ops" };
var _hoisted_23$2 = {
	key: 0,
	class: "ngc-result"
};
var _hoisted_24$1 = {
	key: 0,
	class: "ngc-steps"
};
var _hoisted_25$1 = {
	key: 1,
	class: "ngc-block"
};
var _hoisted_26$1 = { class: "ngc-pre is-err" };
var _hoisted_27$1 = {
	key: 2,
	class: "ngc-block"
};
var _hoisted_28$1 = { class: "ngc-block-label" };
var _hoisted_29$1 = { class: "ngc-pre" };
var _hoisted_30$1 = { class: "ngc-directive-option__name" };
var _hoisted_31$1 = {
	key: 0,
	class: "ngc-directive-option__desc"
};
var _hoisted_32$1 = {
	key: 1,
	class: "ngc-directive-option__example"
};
var _hoisted_33$1 = {
	key: 0,
	class: "ngc-addmeta"
};
var _hoisted_34 = { class: "ngc-addmeta-desc" };
var _hoisted_35 = {
	key: 0,
	class: "ngc-addmeta-eg"
};
//#endregion
//#region ../../pages/datasource/src/components/console/NginxConfigPanel.vue
var NginxConfigPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxConfigPanel",
	props: {
		datasourceId: {},
		newbie: { type: Boolean },
		focusNodePath: {}
	},
	emits: ["changed", "focus-consumed"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 可新增的区块类型 */
		const BLOCK_NAMES = [
			"location",
			"upstream",
			"if",
			"limit_except",
			"map",
			"types",
			"server"
		];
		const mode = ref("FILE");
		const showHelp = computed(() => props.newbie);
		const files = ref([]);
		const filesLoading = ref(false);
		const currentPath = ref("");
		/** 配置文件行右键菜单（第九批统一 zk 模板） */
		const fileMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			path: ""
		});
		const fileMenuItems = [{
			key: "open",
			label: "打开文件",
			icon: "View"
		}, {
			key: "copy",
			label: "复制路径",
			icon: "CopyDocument"
		}];
		/** 打开配置文件行右键菜单 */
		function onFileContextMenu(e, path) {
			Object.assign(fileMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				path
			});
		}
		/** 菜单动作分发 */
		function onFileMenuSelect(action) {
			const path = fileMenu.path;
			if (!path) return;
			if (action === "open") openFile(path);
			else if (action === "copy") copyToClipboard(path).then((ok) => ok ? message.success("已复制路径") : message.error("复制失败"));
		}
		const content = ref("");
		const parsed = ref(null);
		const metas = ref({});
		const metaList = ref([]);
		const patches = ref([]);
		const loading = ref(false);
		/**
		* 首屏是否已渲染过真实内容。
		*
		* <p>骨架屏只在首次出现。切换 .conf 文件会再次走 loading，但那已经是
		* 「有内容 → 换内容」，再闪一次骨架反而让人以为文件切失败了。</p>
		*/
		const loaded = ref(false);
		const saving = ref(false);
		const previewing = ref(false);
		const optBackup = ref(true);
		const optValidate = ref(true);
		const optReload = ref(false);
		const result = ref(null);
		const resultVisible = ref(false);
		const addVisible = ref(false);
		const addKind = ref("directive");
		const addName = ref("");
		const addValue = ref("");
		const addHeadArg = ref("");
		const addParent = ref(null);
		const warnings = computed(() => parsed.value?.warnings || []);
		const patchCount = computed(() => patches.value.length);
		const patchedIds = computed(() => new Set(patches.value.map((p) => p.nodeId || "")));
		const hasChange = computed(() => mode.value === "FILE" ? content.value !== (parsed.value?.content ?? "") : patches.value.length > 0);
		const resultTitle = computed(() => result.value?.saved ? "保存结果" : "预览结果");
		const lineCount = computed(() => Math.max(content.value.split("\n").length, 1));
		/** 定位目标变化时重建表单，使折叠状态按新目标重新计算 */
		const formKey = computed(() => `${currentPath.value}#${props.focusNodePath || ""}`);
		const modelHint = computed(() => props.newbie ? "表单模式：左边是配置结构，每条指令都有中文说明。改完点「预览」看结果，确认无误再「保存」。没把握就用文件模式。" : "表单模式：只改动你动过的区块，其余内容逐字节保留。改完先「预览」确认。");
		/** 指令候选：按当前作用域过滤，未登记的指令仍可手工输入 */
		const addCandidates = computed(() => {
			const scope = addParent.value?.scope || "http";
			const inScope = metaList.value.filter((m) => m.scopes.includes(scope));
			return inScope.length ? inScope : metaList.value;
		});
		const addMeta = computed(() => metas.value[addName.value] || null);
		/** 差异行：文件模式前端本地对比，表单模式用后端返回的渲染结果对比 */
		const diffLines = computed(() => {
			if (!result.value?.content) return [];
			const before = (parsed.value?.content ?? "").split("\n");
			const after = result.value.content.split("\n");
			const beforeSet = /* @__PURE__ */ new Map();
			before.forEach((l, i) => beforeSet.set(l, (beforeSet.get(l) || 0) + 1));
			const afterSet = /* @__PURE__ */ new Map();
			after.forEach((l) => afterSet.set(l, (afterSet.get(l) || 0) + 1));
			const out = [];
			before.forEach((l) => {
				if ((afterSet.get(l) || 0) > 0) afterSet.set(l, (afterSet.get(l) || 0) - 1);
				else out.push({
					kind: "del",
					text: `- ${l}`
				});
			});
			after.forEach((l) => {
				if ((beforeSet.get(l) || 0) > 0) beforeSet.set(l, (beforeSet.get(l) || 0) - 1);
				else out.push({
					kind: "add",
					text: `+ ${l}`
				});
			});
			return out.slice(0, 400);
		});
		async function loadFiles() {
			if (!props.datasourceId) return;
			filesLoading.value = true;
			try {
				files.value = await fetchNginxConfigFiles(props.datasourceId) || [];
			} catch (e) {
				message.error(`读取配置文件列表失败：${e.message}`);
			} finally {
				filesLoading.value = false;
			}
		}
		async function openFile(path) {
			if (!props.datasourceId) return;
			currentPath.value = path;
			patches.value = [];
			loading.value = true;
			try {
				const [text, tree] = await Promise.all([fetchNginxConfig(props.datasourceId, path), fetchNginxConfigTree(props.datasourceId, path)]);
				content.value = text || "";
				parsed.value = tree;
				if (props.focusNodePath) mode.value = "MODEL";
				if (tree.warnings?.length) message.warning(`配置有 ${tree.warnings.length} 处需要注意的地方`);
			} catch (e) {
				content.value = "";
				parsed.value = null;
				message.error(`读取配置失败：${e.message}`);
			} finally {
				loading.value = false;
				loaded.value = true;
				if (props.focusNodePath) {
					await nextTick();
					scrollToFocus();
					emit("focus-consumed");
				}
			}
		}
		/** 把定位到的区块滚到可视区中部 */
		function scrollToFocus() {
			const el = document.querySelector(".ngc-model .ngf-blockhead.is-focused");
			if (el instanceof HTMLElement) el.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
		}
		const createVisible = ref(false);
		const creating = ref(false);
		const createName = ref("");
		const createPath = ref("");
		const createContent = ref("");
		/**
		* 新文件默认内容。
		*
		* <p>刻意用 8090 而不是 8080：被管控主机上 8080 通常已被现有 server 占用，
		* 预填 8080 会让 {@code nginx -t} 立刻报
		* {@code conflicting server name} 警告，用户还没改就先把机器弄脏了。</p>
		*/
		const DEFAULT_CREATE_CONTENT = [
			"# 新建配置：改完记得在 nginx -t 通过后再重载",
			"server {",
			"    listen 8090;",
			"    server_name _;",
			"",
			"    location / {",
			"        root html;",
			"        index index.html;",
			"    }",
			"}",
			""
		].join("\n");
		/** 打开新建弹窗：路径预填配置根目录下的 conf.d，减少手工输入 */
		function openCreateFile() {
			if (!props.datasourceId) {
				message.warning("请先选择数据源");
				return;
			}
			createName.value = "";
			createPath.value = "";
			createContent.value = DEFAULT_CREATE_CONTENT;
			createVisible.value = true;
		}
		/** 输入文件名后自动补全成完整路径（用户仍可手动改） */
		function normalizeCreatePath() {
			const n = createName.value.trim();
			if (!n) return;
			const base = currentDir.value || "/etc/nginx/conf.d";
			createPath.value = `${base.replace(/\/+$/, "")}/${n.replace(/\.conf$/, "")}.conf`;
		}
		const currentDir = computed(() => {
			const p = currentPath.value;
			const i = p.lastIndexOf("/");
			return i > 0 ? p.slice(0, i) : "";
		});
		async function doCreateFile() {
			if (!props.datasourceId || !createPath.value) return;
			creating.value = true;
			try {
				const r = await applyNginxConfig({
					datasourceId: props.datasourceId,
					path: createPath.value,
					mode: "FILE",
					content: createContent.value,
					backup: false,
					validate: optValidate.value,
					reload: false
				});
				if (r.saved) {
					message.success(`已创建 ${createPath.value}`);
					createVisible.value = false;
					await loadFiles();
					await openFile(createPath.value);
					emit("changed");
				} else message.warning(r.message);
			} catch (e) {
				message.error(`创建失败：${e.message}`);
			} finally {
				creating.value = false;
			}
		}
		async function loadMetas() {
			if (metaList.value.length) return;
			try {
				const list = await fetchNginxDirectives() || [];
				metaList.value = list;
				const map = {};
				list.forEach((m) => map[m.name] = m);
				metas.value = map;
			} catch {}
		}
		function markDirty() {}
		function onPatch(p) {
			const i = patches.value.findIndex((x) => x.nodeId === p.nodeId && x.op === p.op);
			if (i >= 0) patches.value[i] = p;
			else patches.value.push(p);
			if (p.op === "REMOVE") patches.value = patches.value.filter((x) => x.nodeId !== p.nodeId);
		}
		function onRemove(node) {
			if (!node?.id) return;
			onPatch({
				nodeId: node.id,
				op: "REMOVE"
			});
		}
		function openAdd(kind, parent) {
			addKind.value = kind;
			addParent.value = parent || null;
			addName.value = "";
			addValue.value = "";
			addHeadArg.value = "";
			addVisible.value = true;
			loadMetas();
		}
		function syncAddMeta() {
			const m = metas.value[addName.value];
			if (m?.example) addValue.value = m.example;
		}
		function confirmAdd() {
			const targetId = addParent.value?.id ?? null;
			if (addKind.value === "block") onPatch({
				nodeId: targetId,
				op: "ADD",
				name: addName.value,
				headArg: addHeadArg.value
			});
			else onPatch({
				nodeId: targetId,
				op: "ADD",
				name: addName.value,
				value: addValue.value
			});
			addVisible.value = false;
		}
		async function doPreview() {
			if (!props.datasourceId || !currentPath.value) return;
			previewing.value = true;
			try {
				result.value = await applyNginxConfig({
					datasourceId: props.datasourceId,
					path: currentPath.value,
					mode: mode.value,
					content: mode.value === "FILE" ? content.value : void 0,
					patches: mode.value === "MODEL" ? patches.value : void 0,
					dryRun: true
				});
				resultVisible.value = true;
			} catch (e) {
				message.error(`预览失败：${e.message}`);
			} finally {
				previewing.value = false;
			}
		}
		async function doSave() {
			if (!props.datasourceId || !currentPath.value) return;
			saving.value = true;
			try {
				result.value = await applyNginxConfig({
					datasourceId: props.datasourceId,
					path: currentPath.value,
					mode: mode.value,
					content: mode.value === "FILE" ? content.value : void 0,
					patches: mode.value === "MODEL" ? patches.value : void 0,
					backup: optBackup.value,
					validate: optValidate.value,
					reload: optReload.value
				});
				resultVisible.value = true;
				if (result.value.saved) {
					message.success(result.value.message);
					patches.value = [];
					if (mode.value === "FILE") content.value = result.value.content;
					await openFile(currentPath.value);
					emit("changed");
				} else message.warning(result.value.message);
			} catch (e) {
				message.error(`保存失败：${e.message}`);
			} finally {
				saving.value = false;
			}
		}
		function shortName(p) {
			return p.split("/").pop() || p;
		}
		function shortDir(p) {
			const parts = p.split("/");
			parts.pop();
			return parts.slice(-2).join("/");
		}
		watch(() => props.datasourceId, async (id) => {
			files.value = [];
			parsed.value = null;
			content.value = "";
			patches.value = [];
			if (id) {
				await loadMetas();
				await loadFiles();
			}
		}, { immediate: true });
		__expose({
			loadFiles,
			openFile,
			doPreview,
			doSave,
			hasChange,
			openAdd,
			metas,
			addCandidates,
			openCreateFile
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$6, [
				createBaseVNode("div", _hoisted_2$6, [createBaseVNode("aside", _hoisted_3$6, [createBaseVNode("div", _hoisted_4$6, [_cache[21] || (_cache[21] = createBaseVNode("span", { class: "ngx-card-title" }, "配置文件", -1)), createBaseVNode("div", _hoisted_5$6, [createVNode(unref(ReButton_default), {
					icon: "Refresh",
					text: "",
					loading: filesLoading.value,
					title: "刷新列表",
					onClick: loadFiles
				}, null, 8, ["loading"]), createVNode(unref(ReButton_default), {
					icon: "DocumentAdd",
					text: "",
					title: "新建 .conf 文件",
					onClick: openCreateFile
				})])]), createBaseVNode("div", _hoisted_6$6, [(openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (f) => {
					return openBlock(), createElementBlock("div", {
						key: f.path,
						class: normalizeClass(["ngc-file", { active: f.path === currentPath.value }]),
						title: f.path,
						onClick: ($event) => openFile(f.path),
						onContextmenu: withModifiers(($event) => onFileContextMenu($event, f.path), ["prevent"])
					}, [
						createVNode(unref(component$1), {
							name: "Document",
							size: 13
						}),
						createBaseVNode("span", _hoisted_8$6, toDisplayString(shortName(f.path)), 1),
						createBaseVNode("span", _hoisted_9$6, toDisplayString(shortDir(f.path)), 1)
					], 42, _hoisted_7$6);
				}), 128)), !files.value.length && !filesLoading.value ? (openBlock(), createBlock(unref(ReEmpty_default), {
					key: 0,
					description: "未发现 .conf 文件"
				})) : createCommentVNode("", true)])]), createBaseVNode("section", _hoisted_10$6, [
					createBaseVNode("div", _hoisted_11$6, [createBaseVNode("span", {
						class: "ngc-path mono",
						title: currentPath.value
					}, toDisplayString(currentPath.value || "请选择左侧配置文件"), 9, _hoisted_12$5), createBaseVNode("div", _hoisted_13$5, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": mode.value === "FILE" }),
						onClick: _cache[0] || (_cache[0] = ($event) => mode.value = "FILE")
					}, " 文件模式 ", 2), createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": mode.value === "MODEL" }),
						onClick: _cache[1] || (_cache[1] = ($event) => mode.value = "MODEL")
					}, " 表单模式 ", 2)])]),
					mode.value === "MODEL" ? (openBlock(), createBlock(unref(ReAlert), {
						key: 0,
						type: "info",
						title: modelHint.value,
						class: "ngc-alert"
					}, null, 8, ["title"])) : createCommentVNode("", true),
					warnings.value.length ? (openBlock(), createElementBlock("div", _hoisted_14$4, [(openBlock(true), createElementBlock(Fragment, null, renderList(warnings.value, (w, i) => {
						return openBlock(), createBlock(unref(ReAlert), {
							key: i,
							type: "warning",
							title: w
						}, null, 8, ["title"]);
					}), 128))])) : createCommentVNode("", true),
					withDirectives(createBaseVNode("div", _hoisted_15$3, [loading.value && !loaded.value ? (openBlock(), createElementBlock("div", _hoisted_16$3, [createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 16
					})])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("div", _hoisted_17$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(lineCount.value, (n) => {
						return openBlock(), createElementBlock("div", {
							key: n,
							class: "ngc-lineno"
						}, toDisplayString(n), 1);
					}), 128))]), withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => content.value = $event),
						class: "ngc-textarea",
						spellcheck: "false",
						placeholder: "选择左侧配置文件后在此编辑",
						onInput: markDirty
					}, null, 544), [[vModelText, content.value]])], 64))], 512), [[vShow, mode.value === "FILE"]]),
					withDirectives(createBaseVNode("div", _hoisted_18$2, [loading.value && !loaded.value ? (openBlock(), createElementBlock("div", _hoisted_19$2, [createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 8
					})])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [parsed.value ? (openBlock(), createBlock(NginxModelForm_default, {
						key: formKey.value,
						node: parsed.value.root,
						metas: metas.value,
						"show-help": showHelp.value,
						"patched-ids": patchedIds.value,
						"focus-id": __props.focusNodePath,
						onPatch,
						onRemove,
						onAddDirective: _cache[3] || (_cache[3] = ($event) => openAdd("directive", $event)),
						onAddBlock: _cache[4] || (_cache[4] = ($event) => openAdd("block", $event))
					}, null, 8, [
						"node",
						"metas",
						"show-help",
						"patched-ids",
						"focus-id"
					])) : (openBlock(), createBlock(unref(ReEmpty_default), {
						key: 1,
						description: "请先选择配置文件"
					}))], 64))], 512), [[vShow, mode.value === "MODEL"]]),
					createBaseVNode("div", _hoisted_20$2, [createBaseVNode("div", _hoisted_21$2, [
						createVNode(unref(ReSwitch_default), {
							modelValue: optBackup.value,
							"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => optBackup.value = $event),
							"aria-label": "保存前备份"
						}, null, 8, ["modelValue"]),
						_cache[22] || (_cache[22] = createBaseVNode("span", { class: "ngc-opt-label" }, "保存前备份", -1)),
						createVNode(unref(ReSwitch_default), {
							modelValue: optValidate.value,
							"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => optValidate.value = $event),
							"aria-label": "保存后自动校验"
						}, null, 8, ["modelValue"]),
						_cache[23] || (_cache[23] = createBaseVNode("span", { class: "ngc-opt-label" }, "保存后自动校验", -1)),
						createVNode(unref(ReSwitch_default), {
							modelValue: optReload.value,
							"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => optReload.value = $event),
							"aria-label": "校验通过后自动重载"
						}, null, 8, ["modelValue"]),
						_cache[24] || (_cache[24] = createBaseVNode("span", { class: "ngc-opt-label" }, "校验通过后自动重载", -1))
					]), createBaseVNode("div", _hoisted_22$2, [
						patchCount.value ? (openBlock(), createBlock(unref(component$2), {
							key: 0,
							type: "warning"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(patchCount.value) + " 处改动", 1)]),
							_: 1
						})) : createCommentVNode("", true),
						createVNode(unref(ReButton_default), {
							disabled: !hasChange.value,
							loading: previewing.value,
							onClick: doPreview
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "View",
								size: 13
							})]),
							default: withCtx(() => [_cache[25] || (_cache[25] = createTextVNode(" 预览 ", -1))]),
							_: 1
						}, 8, ["disabled", "loading"]),
						createVNode(unref(ReButton_default), {
							type: "primary",
							disabled: !hasChange.value,
							loading: saving.value,
							onClick: doSave
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Check",
								size: 13
							})]),
							default: withCtx(() => [_cache[26] || (_cache[26] = createTextVNode(" 保存 ", -1))]),
							_: 1
						}, 8, ["disabled", "loading"])
					])])
				])]),
				createVNode(unref(component), {
					modelValue: resultVisible.value,
					"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => resultVisible.value = $event),
					title: resultTitle.value,
					width: "820px",
					height: 560
				}, {
					default: withCtx(() => [result.value ? (openBlock(), createElementBlock("div", _hoisted_23$2, [
						createBaseVNode("div", { class: normalizeClass(["ngc-result-head", result.value.saved ? "is-ok" : "is-info"]) }, [createVNode(unref(component$1), {
							name: result.value.saved ? "CircleCheck" : "View",
							size: 15
						}, null, 8, ["name"]), createBaseVNode("span", null, toDisplayString(result.value.message), 1)], 2),
						result.value.steps.length ? (openBlock(), createElementBlock("ul", _hoisted_24$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(result.value.steps, (s, i) => {
							return openBlock(), createElementBlock("li", { key: i }, toDisplayString(s), 1);
						}), 128))])) : createCommentVNode("", true),
						result.value.validateText && !result.value.validateOk ? (openBlock(), createElementBlock("div", _hoisted_25$1, [_cache[27] || (_cache[27] = createBaseVNode("div", { class: "ngc-block-label" }, "语法检查输出", -1)), createBaseVNode("pre", _hoisted_26$1, toDisplayString(result.value.validateText), 1)])) : createCommentVNode("", true),
						diffLines.value.length ? (openBlock(), createElementBlock("div", _hoisted_27$1, [createBaseVNode("div", _hoisted_28$1, "差异（共 " + toDisplayString(diffLines.value.length) + " 行）", 1), createBaseVNode("pre", _hoisted_29$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(diffLines.value, (l, i) => {
							return openBlock(), createElementBlock("span", {
								key: i,
								class: normalizeClass(["ngc-diff", l.kind])
							}, toDisplayString(l.text) + "\n", 3);
						}), 128))])])) : createCommentVNode("", true)
					])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: addVisible.value,
					"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => addVisible.value = $event),
					title: addKind.value === "block" ? "新增子块" : "新增指令",
					width: "520px",
					height: 400
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[13] || (_cache[13] = ($event) => addVisible.value = false) }, {
						default: withCtx(() => [..._cache[28] || (_cache[28] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						disabled: !addName.value,
						onClick: confirmAdd
					}, {
						default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("确定", -1)])]),
						_: 1
					}, 8, ["disabled"])]),
					default: withCtx(() => [createVNode(unref(ReForm_default), { "label-width": "96px" }, {
						default: withCtx(() => [addKind.value === "block" ? (openBlock(), createBlock(unref(ReFormItem), {
							key: 0,
							label: "区块类型"
						}, {
							default: withCtx(() => [createVNode(unref(ReSelect_default), {
								modelValue: addName.value,
								"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => addName.value = $event),
								filterable: "",
								"allow-create": "",
								placeholder: "如 location / upstream / if"
							}, {
								default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(BLOCK_NAMES, (b) => {
									return createVNode(unref(ReOption), {
										key: b,
										value: b,
										label: b
									}, null, 8, ["value", "label"]);
								}), 64))]),
								_: 1
							}, 8, ["modelValue"])]),
							_: 1
						})) : (openBlock(), createBlock(unref(ReFormItem), {
							key: 1,
							label: "指令名"
						}, {
							default: withCtx(() => [createVNode(unref(ElSelect), {
								modelValue: addName.value,
								"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => addName.value = $event),
								class: "ngc-directive-select",
								filterable: "",
								"allow-create": "",
								"default-first-option": "",
								placeholder: "选择或直接输入指令名",
								"popper-class": "ngc-directive-popper",
								onChange: syncAddMeta
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(addCandidates.value, (m) => {
									return openBlock(), createBlock(unref(ReOption), {
										key: m.name,
										value: m.name,
										label: m.name,
										class: "ngc-directive-option"
									}, {
										default: withCtx(() => [
											createBaseVNode("span", _hoisted_30$1, toDisplayString(m.name), 1),
											m.desc ? (openBlock(), createElementBlock("span", _hoisted_31$1, toDisplayString(m.desc), 1)) : createCommentVNode("", true),
											m.example ? (openBlock(), createElementBlock("span", _hoisted_32$1, "例：" + toDisplayString(m.example), 1)) : createCommentVNode("", true)
										]),
										_: 2
									}, 1032, ["value", "label"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"]), addMeta.value ? (openBlock(), createElementBlock("div", _hoisted_33$1, [createBaseVNode("div", _hoisted_34, toDisplayString(addMeta.value.desc), 1), addMeta.value.example ? (openBlock(), createElementBlock("div", _hoisted_35, "示例：" + toDisplayString(addMeta.value.example), 1)) : createCommentVNode("", true)])) : createCommentVNode("", true)]),
							_: 1
						})), addKind.value === "block" ? (openBlock(), createBlock(unref(ReFormItem), {
							key: 2,
							label: "区块参数"
						}, {
							default: withCtx(() => [createVNode(unref(ReInput_default), {
								modelValue: addHeadArg.value,
								"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => addHeadArg.value = $event),
								placeholder: "如 / 或 后端名"
							}, null, 8, ["modelValue"])]),
							_: 1
						})) : addMeta.value?.argType !== "flag" ? (openBlock(), createBlock(unref(ReFormItem), {
							key: 3,
							label: "参数值"
						}, {
							default: withCtx(() => [createVNode(unref(ReInput_default), {
								modelValue: addValue.value,
								"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => addValue.value = $event),
								placeholder: addMeta.value?.example || "值"
							}, null, 8, ["modelValue", "placeholder"])]),
							_: 1
						})) : createCommentVNode("", true)]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: createVisible.value,
					"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => createVisible.value = $event),
					title: "新建配置文件",
					width: "520px",
					height: 320
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[18] || (_cache[18] = ($event) => createVisible.value = false) }, {
						default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: creating.value,
						disabled: !createPath.value,
						onClick: doCreateFile
					}, {
						default: withCtx(() => [..._cache[31] || (_cache[31] = [createTextVNode(" 创建 ", -1)])]),
						_: 1
					}, 8, ["loading", "disabled"])]),
					default: withCtx(() => [createVNode(unref(ReAlert), {
						type: "info",
						title: "文件会创建在配置根目录下，并在末尾写好 include 提示。创建后可切到表单模式继续编辑。",
						class: "ngc-alert"
					}), createVNode(unref(ReForm_default), { "label-width": "88px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "文件名" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: createName.value,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => createName.value = $event),
									placeholder: "如 console-site",
									onChange: normalizeCreatePath
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "完整路径" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: createPath.value,
									"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => createPath.value = $event),
									placeholder: "如 /etc/nginx/conf.d/console-site.conf"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "初始内容" }, {
								default: withCtx(() => [createVNode(unref(ReInput_default), {
									modelValue: createContent.value,
									"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => createContent.value = $event),
									type: "textarea",
									rows: 6,
									class: "ngc-create-content mono",
									placeholder: "server { listen 8080; server_name _; }"
								}, null, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(DsmContextMenu_default, {
					visible: fileMenu.visible,
					"onUpdate:visible": _cache[20] || (_cache[20] = ($event) => fileMenu.visible = $event),
					x: fileMenu.x,
					y: fileMenu.y,
					items: fileMenuItems,
					onSelect: onFileMenuSelect
				}, null, 8, [
					"visible",
					"x",
					"y"
				])
			]);
		};
	}
}), [["__scopeId", "data-v-e278d983"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/NginxLogPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$5 = { class: "ngl" };
var _hoisted_2$5 = { class: "ngl-bar" };
var _hoisted_3$5 = { class: "ngl-status" };
var _hoisted_4$5 = {
	key: 0,
	class: "ngl-state"
};
var _hoisted_5$5 = {
	key: 1,
	class: "ngl-state is-warn"
};
var _hoisted_6$5 = {
	key: 2,
	class: "ngl-state is-ok"
};
var _hoisted_7$5 = {
	key: 3,
	class: "ngl-state"
};
var _hoisted_8$5 = { class: "ngl-count" };
var _hoisted_9$5 = {
	key: 0,
	class: "ngl-skel",
	"aria-busy": "true",
	"aria-label": "日志加载中"
};
var _hoisted_10$5 = {
	key: 1,
	class: "ngl-empty"
};
var _hoisted_11$5 = {
	key: 1,
	class: "ngl-rotated"
};
/** 连续失败多少次后进入退避 */
var MAX_FAILURES = 3;
//#endregion
//#region ../../pages/datasource/src/components/console/NginxLogPanel.vue
var NginxLogPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxLogPanel",
	props: { datasourceId: {} },
	setup(__props, { expose: __expose }) {
		const props = __props;
		/** 本地最多保留的行数，防止长时间挂着把浏览器内存吃满 */
		const files = ref([]);
		const logFilesError = ref("");
		const currentPath = ref("");
		const lines = ref([]);
		const cursor = ref(null);
		const byteSize = ref(null);
		const rotated = ref(false);
		const keyword = ref("");
		const wrap = ref(true);
		const auto = ref(false);
		/** 是否跟随最新日志；用户手动上滚或主动关闭后，刷新不再拉回底部 */
		const followTail = ref(true);
		const intervalMs = ref(5e3);
		const loading = ref(false);
		/**
		* 首屏是否已渲染过真实内容。
		*
		* <p>日志面板开着自动刷新，每隔几秒就会拉一次；骨架屏只在首次出现，
		* 之后刷新只更新内容区，不该把整个日志区换成骨架。</p>
		*/
		const loaded = ref(false);
		const paused = ref(false);
		const bodyRef = ref(null);
		let timer = null;
		let failures = 0;
		/** 过滤后的展示行 */
		const displayLines = computed(() => {
			const k = keyword.value.trim();
			if (!k) return lines.value;
			return lines.value.filter((l) => l.includes(k));
		});
		const lineCount = computed(() => lines.value.length);
		const displayLoading = computed(() => loading.value && !loaded.value);
		async function loadFiles() {
			if (!props.datasourceId) return;
			try {
				files.value = await fetchNginxLogFiles(props.datasourceId) || [];
				logFilesError.value = "";
				if (!currentPath.value && files.value.length) await onPickFile((files.value.find((f) => f.type === "error") || files.value[0]).path);
			} catch (e) {
				logFilesError.value = `读取日志文件列表失败：${e.message}。可在上方手动输入路径。`;
			}
		}
		async function onKeyword(val) {
			keyword.value = val === null || val === void 0 ? "" : String(val);
		}
		function onToggleFollow(on) {
			followTail.value = on;
			if (on) scrollToBottom();
		}
		function onBodyScroll() {
			const el = bodyRef.value;
			if (!el || el.scrollHeight - el.scrollTop - el.clientHeight < 24) return;
			followTail.value = false;
		}
		async function onPickFile(path) {
			currentPath.value = path;
			lines.value = [];
			cursor.value = null;
			rotated.value = false;
			followTail.value = true;
			await refresh(true);
		}
		function onPickInterval(v) {
			intervalMs.value = Number(v);
			if (auto.value) schedule();
		}
		async function onToggleAuto(on) {
			auto.value = on;
			paused.value = false;
			failures = 0;
			if (on) schedule();
			else stopTimer();
			await nextTick();
			if (followTail.value) scrollToBottom();
		}
		/** 立即刷新一次全量 */
		async function refresh(reset = false) {
			if (!props.datasourceId || !currentPath.value) return;
			if (reset) cursor.value = null;
			loading.value = true;
			try {
				const chunk = await fetchNginxLogChunk(props.datasourceId, currentPath.value, 200, reset ? null : cursor.value);
				const incoming = (chunk.content || "").split("\n");
				if (incoming.length && incoming[incoming.length - 1] === "") incoming.pop();
				if (chunk.rotated) {
					rotated.value = true;
					lines.value = incoming;
					setTimeout(() => rotated.value = false, 8e3);
				} else lines.value = [...lines.value, ...incoming].slice(-5e3);
				cursor.value = chunk.cursor ?? null;
				byteSize.value = chunk.size ?? null;
				failures = 0;
				paused.value = false;
				scrollToBottom();
			} catch (e) {
				failures++;
				if (failures >= MAX_FAILURES) {
					paused.value = true;
					auto.value = false;
					stopTimer();
					message.warning(`日志刷新连续失败 ${failures} 次，已暂停自动刷新：${e.message}`);
				}
			} finally {
				loading.value = false;
				loaded.value = true;
			}
		}
		/** 用 setTimeout 链而不是 setInterval：请求耗时会自动顺延，不会堆积 */
		function schedule() {
			stopTimer();
			if (!auto.value) return;
			timer = setTimeout(async () => {
				await refresh();
				schedule();
			}, intervalMs.value);
		}
		function stopTimer() {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		}
		function clear() {
			lines.value = [];
			cursor.value = null;
		}
		function scrollToBottom() {
			if (!followTail.value) return;
			const el = bodyRef.value;
			if (el) el.scrollTop = el.scrollHeight;
		}
		/** 错误日志按级别上色，访问日志标出异常状态码 */
		function lineClass(line) {
			if (line.includes("[error]") || line.includes("[emerg]") || line.includes("[alert]")) return "is-error";
			if (line.includes("[warn]")) return "is-warn";
			if (line.includes("[crit]")) return "is-crit";
			const m = line.match(/" (\d{3}) /);
			if (m) {
				const code = Number(m[1]);
				if (code >= 500) return "is-5xx";
				if (code >= 400) return "is-4xx";
			}
			return "";
		}
		function shortName(p) {
			return p.split("/").pop() || p;
		}
		function formatSize(bytes) {
			if (!bytes) return "—";
			const units = [
				"B",
				"KB",
				"MB",
				"GB"
			];
			let v = bytes;
			let i = 0;
			while (v >= 1024 && i < units.length - 1) {
				v /= 1024;
				i++;
			}
			return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
		}
		watch(() => props.datasourceId, async (id) => {
			stopTimer();
			auto.value = false;
			followTail.value = true;
			lines.value = [];
			files.value = [];
			currentPath.value = "";
			cursor.value = null;
			if (id) await loadFiles();
		}, { immediate: true });
		onBeforeUnmount(stopTimer);
		__expose({
			refresh,
			clear,
			stopTimer,
			loadFiles
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$5, [
				createBaseVNode("div", _hoisted_2$5, [
					createVNode(unref(ReSelect_default), {
						"model-value": currentPath.value,
						filterable: "",
						style: { "width": "320px" },
						placeholder: "选择日志文件",
						onChange: onPickFile
					}, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (f) => {
							return openBlock(), createBlock(unref(ReOption), {
								key: f.path,
								value: f.path,
								label: `${f.type === "error" ? "[错误]" : f.type === "access" ? "[访问]" : "[其它]"} ${shortName(f.path)}  ${formatSize(f.size)}`
							}, null, 8, ["value", "label"]);
						}), 128))]),
						_: 1
					}, 8, ["model-value"]),
					createVNode(unref(ReInput_default), {
						"model-value": keyword.value,
						style: { "width": "180px" },
						placeholder: "关键字过滤（本地过滤）",
						"onUpdate:modelValue": onKeyword
					}, null, 8, ["model-value"]),
					createVNode(unref(ReSwitch_default), {
						"data-testid": "ngl-switch-follow",
						"model-value": followTail.value,
						"aria-label": "自动滚动",
						onChange: onToggleFollow
					}, null, 8, ["model-value"]),
					_cache[2] || (_cache[2] = createBaseVNode("span", { class: "ngl-label" }, "自动滚动", -1)),
					createVNode(unref(ReSwitch_default), {
						"model-value": auto.value,
						"aria-label": "自动刷新",
						onChange: onToggleAuto
					}, null, 8, ["model-value"]),
					_cache[3] || (_cache[3] = createBaseVNode("span", { class: "ngl-label" }, "自动刷新", -1)),
					createVNode(unref(ReSelect_default), {
						"model-value": String(intervalMs.value),
						style: { "width": "110px" },
						onChange: onPickInterval
					}, {
						default: withCtx(() => [
							createVNode(unref(ReOption), {
								value: "3000",
								label: "3 秒"
							}),
							createVNode(unref(ReOption), {
								value: "5000",
								label: "5 秒"
							}),
							createVNode(unref(ReOption), {
								value: "10000",
								label: "10 秒"
							}),
							createVNode(unref(ReOption), {
								value: "30000",
								label: "30 秒"
							})
						]),
						_: 1
					}, 8, ["model-value"]),
					createVNode(unref(ReSwitch_default), {
						modelValue: wrap.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => wrap.value = $event),
						"aria-label": "自动换行"
					}, null, 8, ["modelValue"]),
					_cache[4] || (_cache[4] = createBaseVNode("span", { class: "ngl-label" }, "自动换行", -1)),
					createBaseVNode("div", _hoisted_3$5, [
						loading.value ? (openBlock(), createElementBlock("span", _hoisted_4$5, "读取中…")) : paused.value ? (openBlock(), createElementBlock("span", _hoisted_5$5, "已暂停（出错退避中）")) : auto.value ? (openBlock(), createElementBlock("span", _hoisted_6$5, "每 " + toDisplayString(Math.round(intervalMs.value / 1e3)) + " 秒刷新", 1)) : (openBlock(), createElementBlock("span", _hoisted_7$5, "已停止")),
						createBaseVNode("span", _hoisted_8$5, toDisplayString(lineCount.value) + " 行 / " + toDisplayString(formatSize(byteSize.value)), 1),
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Refresh",
							tip: "立即刷新",
							"data-testid": "ngl-btn-refresh",
							loading: loading.value,
							onClick: _cache[1] || (_cache[1] = ($event) => refresh(true))
						}, null, 8, ["loading"]),
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Delete",
							tip: "清屏",
							"data-testid": "ngl-btn-clear",
							onClick: clear
						})
					])
				]),
				logFilesError.value ? (openBlock(), createBlock(unref(ReAlert), {
					key: 0,
					type: "warning",
					title: logFilesError.value,
					class: "ngl-alert"
				}, null, 8, ["title"])) : createCommentVNode("", true),
				createBaseVNode("div", {
					class: "ngl-body",
					ref_key: "bodyRef",
					ref: bodyRef,
					onScroll: onBodyScroll
				}, [displayLoading.value ? (openBlock(), createElementBlock("div", _hoisted_9$5, [createVNode(unref(ReSkeleton_default), {
					loading: "",
					animated: "",
					rows: 14
				})])) : !displayLines.value.length ? (openBlock(), createElementBlock("pre", _hoisted_10$5, "暂无日志。确认路径正确、nginx 有写权限，或点「立即刷新」重试。")) : (openBlock(), createElementBlock("pre", {
					key: 2,
					class: normalizeClass(["ngl-log", { nowrap: !wrap.value }])
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(displayLines.value, (line, i) => {
					return openBlock(), createElementBlock("span", {
						key: i,
						class: normalizeClass(["ngl-line", lineClass(line)])
					}, toDisplayString(line) + "\n", 3);
				}), 128))], 2))], 544),
				rotated.value ? (openBlock(), createElementBlock("div", _hoisted_11$5, [createVNode(unref(component$1), {
					name: "Warning",
					size: 13
				}), _cache[5] || (_cache[5] = createTextVNode(" 日志已被轮转或截断，上方内容来自新文件，历史内容已清空 ", -1))])) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-9ea481c5"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/NginxBackupPanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$4 = { class: "ngb" };
var _hoisted_2$4 = { class: "ngb-bar" };
var _hoisted_3$4 = { class: "ngb-count" };
var _hoisted_4$4 = { class: "ngb-list" };
var _hoisted_5$4 = {
	key: 0,
	class: "ngb-skel",
	"aria-busy": "true",
	"aria-label": "备份列表加载中"
};
var _hoisted_6$4 = { class: "ngb-skel-body" };
var _hoisted_7$4 = { class: "ngb-info" };
var _hoisted_8$4 = ["title"];
var _hoisted_9$4 = { class: "ngb-meta" };
var _hoisted_10$4 = { key: 0 };
var _hoisted_11$4 = { class: "ngb-preview-bar" };
var _hoisted_12$4 = { class: "ngb-preview-meta" };
var _hoisted_13$4 = {
	key: 0,
	class: "ngb-preview-body ngx-mono"
};
var _hoisted_14$3 = {
	key: 2,
	class: "ngb-preview-body ngx-mono"
};
var _hoisted_15$2 = { class: "ngb-preview-bar" };
var _hoisted_16$2 = {
	key: 0,
	class: "ngb-preview-meta"
};
var _hoisted_17$2 = { class: "ngb-add" };
var _hoisted_18$1 = { class: "ngb-del" };
var _hoisted_19$1 = {
	key: 1,
	class: "ngb-preview-body ngx-mono"
};
var _hoisted_20$1 = {
	key: 4,
	class: "ngb-preview-body ngb-diff ngx-mono"
};
var _hoisted_21$1 = {
	key: 0,
	class: "ngb-restore"
};
var _hoisted_22$1 = { class: "mono ngx-break" };
var _hoisted_23$1 = { class: "ngb-hint" };
//#endregion
//#region ../../pages/datasource/src/components/console/NginxBackupPanel.vue
var NginxBackupPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxBackupPanel",
	props: { datasourceId: {} },
	emits: ["changed"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const backups = ref([]);
		const files = ref([]);
		const configPath = ref("");
		const loading = ref(false);
		const backing = ref(false);
		const restoring = ref("");
		const restoreVisible = ref(false);
		const pending = ref(null);
		const restoreTarget = ref("");
		/** 已勾选的备份文件名（勾选态按名字记，刷新后由 load() 剔除已消失的项） */
		const selected = ref([]);
		/** 删除请求进行中（单条与批量共用一把锁：删除是逐文件 SSH，不允许并发叠请求） */
		const deleting = ref(false);
		/** 全选开关：勾上整表、取消全清，空列表时恒为未选 */
		const allSelected = computed({
			get: () => backups.value.length > 0 && selected.value.length === backups.value.length,
			set: (v) => {
				selected.value = v ? backups.value.map((b) => b.name) : [];
			}
		});
		/**
		* 勾选 / 取消勾选单个备份。
		*
		* @param name 备份文件名
		* @param val  勾选值（el-checkbox 的 update:model-value，可能是布尔或字符串）
		*/
		function toggleSelect(name, val) {
			selected.value = Boolean(val) ? selected.value.includes(name) ? selected.value : [...selected.value, name] : selected.value.filter((n) => n !== name);
		}
		/**
		* 删除确认 + 执行：单条与批量走同一条路径（names 单元素即单条）。
		*
		* <p>后端是部分成功语义——一批里个别失败不回滚已删项，结果按成功 / 失败
		* 分列返回，这里如实转述给使用者，不把「删了 8 个、失败 2 个」吞成一句成功。</p>
		*
		* @param names 要删除的备份文件名列表
		*/
		async function confirmDelete(names) {
			if (!props.datasourceId || !names.length || deleting.value) return;
			const batch = names.length > 1;
			try {
				await ElMessageBox.confirm(batch ? `将永久删除选中的 ${names.length} 个备份。删除不可恢复，但配置文件本身不受影响。` : `将永久删除备份 ${names[0]}。删除不可恢复，但配置文件本身不受影响。`, "删除备份？", {
					type: "warning",
					confirmButtonText: "删除",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			deleting.value = true;
			try {
				const r = await deleteNginxBackups(props.datasourceId, names);
				if (r.failed.length) message.warning(`已删除 ${r.deleted.length} 个，失败 ${r.failed.length} 个：${r.failed.join("；")}`);
				else message.success(`已删除 ${r.deleted.length} 个备份`);
				selected.value = selected.value.filter((n) => !r.deleted.includes(n));
				await load();
			} catch (e) {
				message.error(`删除失败：${e.message}`);
			} finally {
				deleting.value = false;
			}
		}
		/** 首屏是否已渲染过真实内容：骨架屏只在首次出现，之后刷新不再整页闪 */
		const loaded = ref(false);
		/** 预览弹窗的页签定义。ReTab 用 tabs 数组 + 具名插槽，不是 el-tabs 的 pane 子组件 */
		const PREVIEW_TABS = [{
			name: "content",
			label: "内容预览"
		}, {
			name: "diff",
			label: "与当前配置对比"
		}];
		const previewVisible = ref(false);
		const previewTab = ref("content");
		const previewName = ref("");
		const previewText = ref("");
		const previewLoading = ref(false);
		const previewing = ref("");
		const downloading = ref(false);
		const diffTarget = ref("");
		const diffLoading = ref(false);
		const diffResult = ref(null);
		/**
		* 对比页签的提示文案。
		*
		* <p>「没有可对比的配置文件」要和「还没点对比」区分开：前者说明
		* {@code files} 是空的（数据源没列出任何 .conf），后者是正常待操作状态。
		* 混成一句话会让人以为是按钮坏了。</p>
		*/
		const diffHint = computed(() => files.value.length === 0 ? "该数据源没有取到任何 .conf 配置文件，无法对比。请先在「配置」页签确认连接。" : "点「对比」查看这个备份和当前文件的差异");
		/** 预览头部那行元信息：文件名 / 时间 / 大小 */
		const previewMeta = computed(() => {
			const b = backups.value.find((x) => x.name === previewName.value);
			if (!b) return previewName.value;
			return `${b.mtime || "时间未知"} · ${formatSize(b.size)}`;
		});
		/**
		* 把 diff 行序列转成可着色的行。
		*
		* <p>不用整段文本渲染：那样没法逐行加底色，几十行 diff 混成一片根本看不出改了哪里。
		* 后端已给每行加了 {@code +}/{@code -}/双空格 前缀，这里只剥掉前缀并保留行尾，
		* 不能再 trim——配置里行尾空格是有意义的。</p>
		*/
		const diffRows = computed(() => (diffResult.value?.lines || []).map((raw) => {
			if (raw.startsWith("+")) return {
				cls: "el-diff-add",
				text: raw
			};
			if (raw.startsWith("-")) return {
				cls: "el-diff-del",
				text: raw
			};
			return {
				cls: "el-diff-eq",
				text: raw
			};
		}));
		/**
		* 打开备份内容预览。
		*
		* <p>内容与 diff 分开按需拉：两个都拉会让弹窗打开瞬间等两趟 SSH，
		* 而多数人只关心其中一个。</p>
		*
		* @param b 备份条目
		*/
		async function openPreview(b) {
			previewName.value = b.name;
			previewText.value = "";
			diffResult.value = null;
			previewTab.value = "content";
			diffTarget.value = configPath.value || files.value[0]?.path || "";
			previewVisible.value = true;
			previewing.value = b.name;
			try {
				previewText.value = await fetchNginxBackupContent(props.datasourceId, b.name);
			} catch (e) {
				message.error(`读取备份内容失败：${e.message}`);
			} finally {
				previewLoading.value = false;
				previewing.value = "";
			}
		}
		/**
		* 把备份内容下载到本地。
		*
		* <p>后端只提供文本接口，Blob 转换放在前端：少一个需要做
		* Content-Disposition 文件名转义的二进制接口，中文/下划线文件名在两处都容易出错。</p>
		*/
		function downloadBackup() {
			if (!previewText.value) return;
			downloading.value = true;
			try {
				const blob = new Blob([previewText.value], { type: "text/plain;charset=utf-8" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = previewName.value || "nginx-backup.bak";
				a.click();
				setTimeout(() => {
					URL.revokeObjectURL(url);
				}, 1e4);
			} finally {
				downloading.value = false;
			}
		}
		/** 拉取并展示 diff */
		async function loadDiff() {
			if (!previewName.value || !diffTarget.value) return;
			diffLoading.value = true;
			diffResult.value = null;
			try {
				diffResult.value = await fetchNginxBackupDiff(props.datasourceId, previewName.value, diffTarget.value);
			} catch (e) {
				message.error(`对比失败：${e.message}`);
			} finally {
				diffLoading.value = false;
			}
		}
		async function load() {
			if (!props.datasourceId) return;
			loading.value = true;
			try {
				const [b, f] = await Promise.allSettled([fetchNginxBackups(props.datasourceId), fetchNginxConfigFiles(props.datasourceId)]);
				backups.value = b.status === "fulfilled" ? b.value || [] : [];
				files.value = f.status === "fulfilled" ? f.value || [] : [];
				selected.value = selected.value.filter((n) => backups.value.some((x) => x.name === n));
				if (!configPath.value && files.value.length) configPath.value = files.value[0].path;
				if (b.status === "rejected") message.error(`读取备份列表失败：${b.reason.message}`);
			} finally {
				loading.value = false;
				loaded.value = true;
			}
		}
		async function doBackup() {
			if (!props.datasourceId || !configPath.value) return;
			backing.value = true;
			try {
				const r = await backupNginxConfig(props.datasourceId, configPath.value, "手动备份");
				message.success(`已备份到 ${r.path}`);
				await load();
			} catch (e) {
				message.error(`备份失败：${e.message}`);
			} finally {
				backing.value = false;
			}
		}
		async function doRestore() {
			if (!props.datasourceId || !pending.value || !restoreTarget.value) return;
			const b = pending.value;
			try {
				await ElMessageBox.confirm(`将用备份 ${b.name} 覆盖 ${restoreTarget.value}。回退前会自动再备份一次当前内容，因此这一步可以撤销。`, "确认回退配置？", {
					type: "warning",
					confirmButtonText: "确认回退",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			restoring.value = b.name;
			try {
				const r = await restoreNginxBackup(props.datasourceId, b.name, restoreTarget.value);
				if (r.success) message.success(r.message);
				else message.error(r.message);
				restoreVisible.value = false;
				await load();
				emit("changed");
			} catch (e) {
				message.error(`回退失败：${e.message}`);
			} finally {
				restoring.value = "";
			}
		}
		function openRestore(b) {
			pending.value = b;
			restoreTarget.value = configPath.value || b.path.replace(/\.[^.]+\.bak$/, ".conf");
			restoreVisible.value = true;
		}
		function formatSize(bytes) {
			if (!bytes) return "—";
			const units = [
				"B",
				"KB",
				"MB"
			];
			let v = bytes;
			let i = 0;
			while (v >= 1024 && i < units.length - 1) {
				v /= 1024;
				i++;
			}
			return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
		}
		watch(() => props.datasourceId, load);
		onMounted(load);
		__expose({ load });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$4, [
				createVNode(unref(ReAlert), {
					type: "info",
					class: "ngb-alert"
				}, {
					title: withCtx(() => [..._cache[10] || (_cache[10] = [
						createTextVNode(" 每次保存配置前都会自动备份到 ", -1),
						createBaseVNode("code", null, "/var/log/nginx-console-backup", -1),
						createTextVNode(" 。这里可以查看历史备份并回退。回退本身也会先备份当前内容，所以这一步是可逆的。 ", -1)
					])]),
					_: 1
				}),
				createBaseVNode("div", _hoisted_2$4, [
					createVNode(unref(ReSelect_default), {
						modelValue: configPath.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => configPath.value = $event),
						filterable: "",
						style: { "width": "320px" },
						placeholder: "选择要备份的配置文件"
					}, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (f) => {
							return openBlock(), createBlock(unref(ReOption), {
								key: f.path,
								value: f.path,
								label: f.path
							}, null, 8, ["value", "label"]);
						}), 128))]),
						_: 1
					}, 8, ["modelValue"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "CopyDocument",
						tip: "立即备份",
						"data-testid": "ngb-btn-backup",
						loading: backing.value,
						disabled: !configPath.value,
						onClick: doBackup
					}, null, 8, ["loading", "disabled"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新列表",
						"data-testid": "ngb-btn-refresh",
						loading: loading.value,
						onClick: load
					}, null, 8, ["loading"]),
					backups.value.length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(unref(ElCheckbox), {
						modelValue: allSelected.value,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => allSelected.value = $event),
						"data-testid": "ngb-check-all"
					}, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("全选", -1)])]),
						_: 1
					}, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
						type: "danger",
						loading: deleting.value,
						disabled: !selected.value.length,
						"data-testid": "ngb-btn-delete-selected",
						onClick: _cache[2] || (_cache[2] = ($event) => confirmDelete([...selected.value]))
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Delete",
							size: 13
						})]),
						default: withCtx(() => [createTextVNode(" 删除所选" + toDisplayString(selected.value.length ? `（${selected.value.length}）` : ""), 1)]),
						_: 1
					}, 8, ["loading", "disabled"])], 64)) : createCommentVNode("", true),
					createBaseVNode("span", _hoisted_3$4, "共 " + toDisplayString(backups.value.length) + " 个备份", 1)
				]),
				createBaseVNode("div", _hoisted_4$4, [loading.value && !loaded.value ? (openBlock(), createElementBlock("div", _hoisted_5$4, [(openBlock(), createElementBlock(Fragment, null, renderList(4, (i) => {
					return createBaseVNode("div", {
						key: i,
						class: "ngb-skel-item"
					}, [createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 0,
						class: "ngb-skel-icon"
					}), createBaseVNode("div", _hoisted_6$4, [createVNode(unref(ReSkeleton_default), {
						loading: "",
						animated: "",
						rows: 2
					})])]);
				}), 64))])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [!backups.value.length ? (openBlock(), createBlock(unref(ReEmpty_default), {
					key: 0,
					description: "还没有备份。保存配置时会自动创建。"
				})) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(backups.value, (b) => {
					return openBlock(), createElementBlock("div", {
						key: b.name,
						class: normalizeClass(["ngb-item", { "is-checked": selected.value.includes(b.name) }])
					}, [
						createVNode(unref(ElCheckbox), {
							"model-value": selected.value.includes(b.name),
							"data-testid": "ngb-item-check",
							"onUpdate:modelValue": (v) => toggleSelect(b.name, v)
						}, null, 8, ["model-value", "onUpdate:modelValue"]),
						createVNode(unref(component$1), {
							name: "DocumentCopy",
							size: 14
						}),
						createBaseVNode("div", _hoisted_7$4, [createBaseVNode("div", {
							class: "ngb-name mono",
							title: b.path
						}, toDisplayString(b.name), 9, _hoisted_8$4), createBaseVNode("div", _hoisted_9$4, [createTextVNode(toDisplayString(b.mtime || "—") + " · " + toDisplayString(formatSize(b.size)) + " ", 1), b.reason ? (openBlock(), createElementBlock("span", _hoisted_10$4, " · " + toDisplayString(b.reason), 1)) : createCommentVNode("", true)])]),
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "View",
							tip: "查看",
							"data-testid": "ngb-btn-preview",
							loading: previewing.value === b.name,
							onClick: ($event) => openPreview(b)
						}, null, 8, ["loading", "onClick"]),
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "RefreshLeft",
							tip: "回退到此版本",
							"data-testid": "ngb-btn-restore",
							loading: restoring.value === b.name,
							onClick: ($event) => openRestore(b)
						}, null, 8, ["loading", "onClick"]),
						createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "Delete",
							tip: "删除此备份",
							"data-testid": "ngb-btn-delete",
							loading: deleting.value,
							onClick: ($event) => confirmDelete([b.name])
						}, null, 8, ["loading", "onClick"])
					], 2);
				}), 128))], 64))]),
				createVNode(unref(component), {
					modelValue: previewVisible.value,
					"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => previewVisible.value = $event),
					title: `备份内容 · ${previewName.value || ""}`,
					width: "900px",
					height: 560
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[5] || (_cache[5] = ($event) => previewVisible.value = false) }, {
						default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createVNode(unref(ReTab_default), {
						modelValue: previewTab.value,
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => previewTab.value = $event),
						tabs: PREVIEW_TABS,
						class: "ngb-preview"
					}, {
						content: withCtx(() => [createBaseVNode("div", _hoisted_11$4, [createBaseVNode("span", _hoisted_12$4, toDisplayString(previewMeta.value), 1), createVNode(unref(ReButton_default), {
							size: "small",
							loading: downloading.value,
							onClick: downloadBackup
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Download",
								size: 13
							})]),
							default: withCtx(() => [_cache[12] || (_cache[12] = createTextVNode(" 下载 ", -1))]),
							_: 1
						}, 8, ["loading"])]), previewLoading.value ? (openBlock(), createElementBlock("pre", _hoisted_13$4, toDisplayString(previewText.value || "读取中…"), 1)) : !previewText.value ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 1,
							description: "备份内容为空，或文件已被清理",
							"image-size": 70
						})) : (openBlock(), createElementBlock("pre", _hoisted_14$3, toDisplayString(previewText.value), 1))]),
						diff: withCtx(() => [createBaseVNode("div", _hoisted_15$2, [
							createVNode(unref(ReSelect_default), {
								modelValue: diffTarget.value,
								"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => diffTarget.value = $event),
								filterable: "",
								style: { "width": "340px" },
								placeholder: "选择要对比的当前配置文件"
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (f) => {
									return openBlock(), createBlock(unref(ReOption), {
										key: f.path,
										value: f.path,
										label: f.path
									}, null, 8, ["value", "label"]);
								}), 128))]),
								_: 1
							}, 8, ["modelValue"]),
							createVNode(unref(ReButton_default), {
								size: "small",
								loading: diffLoading.value,
								disabled: !diffTarget.value,
								onClick: loadDiff
							}, {
								icon: withCtx(() => [createVNode(unref(component$1), {
									name: "Refresh",
									size: 13
								})]),
								default: withCtx(() => [_cache[13] || (_cache[13] = createTextVNode(" 对比 ", -1))]),
								_: 1
							}, 8, ["loading", "disabled"]),
							diffResult.value ? (openBlock(), createElementBlock("span", _hoisted_16$2, [
								_cache[14] || (_cache[14] = createTextVNode(" 新增 ", -1)),
								createBaseVNode("b", _hoisted_17$2, toDisplayString(diffResult.value.added), 1),
								_cache[15] || (_cache[15] = createTextVNode(" 行 · 删除 ", -1)),
								createBaseVNode("b", _hoisted_18$1, toDisplayString(diffResult.value.removed), 1),
								_cache[16] || (_cache[16] = createTextVNode(" 行 ", -1))
							])) : createCommentVNode("", true)
						]), !diffTarget.value ? (openBlock(), createBlock(unref(ReAlert), {
							key: 0,
							type: "info",
							title: "先选一个当前的配置文件，才能看出这份备份改了哪些地方"
						})) : diffLoading.value ? (openBlock(), createElementBlock("pre", _hoisted_19$1, "对比中…")) : !diffResult.value ? (openBlock(), createBlock(unref(ReEmpty_default), {
							key: 2,
							description: diffHint.value,
							"image-size": 70
						}, null, 8, ["description"])) : diffResult.value.added === 0 && diffResult.value.removed === 0 ? (openBlock(), createBlock(unref(ReAlert), {
							key: 3,
							type: "success",
							title: "与当前文件完全一致"
						})) : (openBlock(), createElementBlock("pre", _hoisted_20$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(diffRows.value, (l, i) => {
							return openBlock(), createElementBlock("span", {
								key: i,
								class: normalizeClass(l.cls)
							}, toDisplayString(l.text), 3);
						}), 128))]))]),
						_: 1
					}, 8, ["modelValue"])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: restoreVisible.value,
					"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => restoreVisible.value = $event),
					title: "从备份回退配置",
					width: "640px",
					height: 440
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[8] || (_cache[8] = ($event) => restoreVisible.value = false) }, {
						default: withCtx(() => [..._cache[19] || (_cache[19] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "danger",
						loading: restoring.value === pending.value?.name,
						disabled: !restoreTarget.value,
						onClick: doRestore
					}, {
						default: withCtx(() => [..._cache[20] || (_cache[20] = [createTextVNode(" 确认回退 ", -1)])]),
						_: 1
					}, 8, ["loading", "disabled"])]),
					default: withCtx(() => [pending.value ? (openBlock(), createElementBlock("div", _hoisted_21$1, [createVNode(unref(ReAlert), { type: "warning" }, {
						title: withCtx(() => [..._cache[18] || (_cache[18] = [
							createTextVNode(" 备份文件名把路径分隔符换成了下划线，所以原始路径", -1),
							createBaseVNode("strong", null, "无法可靠反推", -1),
							createTextVNode("。 请确认要还原到哪个文件——填错会把配置写到别的站点上去。 ", -1)
						])]),
						_: 1
					}), createVNode(unref(ReForm_default), { "label-width": "110px" }, {
						default: withCtx(() => [
							createVNode(unref(ReFormItem), { label: "备份文件" }, {
								default: withCtx(() => [createBaseVNode("div", _hoisted_22$1, toDisplayString(pending.value.name), 1)]),
								_: 1
							}),
							createVNode(unref(ReFormItem), { label: "备份时间" }, {
								default: withCtx(() => [createBaseVNode("div", null, toDisplayString(pending.value.mtime || "未知") + " · " + toDisplayString(formatSize(pending.value.size)), 1)]),
								_: 1
							}),
							createVNode(unref(ReFormItem), {
								label: "还原到",
								required: ""
							}, {
								default: withCtx(() => [createVNode(unref(ReSelect_default), {
									modelValue: restoreTarget.value,
									"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => restoreTarget.value = $event),
									filterable: "",
									"allow-create": "",
									"default-first-option": "",
									placeholder: "选择或输入目标 .conf 绝对路径"
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (f) => {
										return openBlock(), createBlock(unref(ReOption), {
											key: f.path,
											value: f.path,
											label: f.path
										}, null, 8, ["value", "label"]);
									}), 128))]),
									_: 1
								}, 8, ["modelValue"]), createBaseVNode("div", _hoisted_23$1, " 默认选中 " + toDisplayString(configPath.value || "（未选择）") + "，因为它是当前正在编辑的文件。 ", 1)]),
								_: 1
							})
						]),
						_: 1
					})])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-3e43b540"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/NginxTemplatePanel.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$3 = { class: "ngt" };
var _hoisted_2$3 = { class: "ngt-grid" };
var _hoisted_3$3 = ["onClick"];
var _hoisted_4$3 = { class: "ngx-card-head" };
var _hoisted_5$3 = { class: "ngx-card-title" };
var _hoisted_6$3 = { class: "ngt-summary" };
var _hoisted_7$3 = { class: "ngt-scene" };
var _hoisted_8$3 = {
	key: 0,
	class: "ngw"
};
var _hoisted_9$3 = { class: "ngw-steps" };
var _hoisted_10$3 = { class: "ngw-step-no" };
var _hoisted_11$3 = { class: "ngw-body" };
var _hoisted_12$3 = { class: "ngw-intro" };
var _hoisted_13$3 = { class: "ngw-hint" };
var _hoisted_14$2 = { class: "ngw-body" };
var _hoisted_15$1 = { class: "ngw-conf mono" };
var _hoisted_16$1 = {
	key: 0,
	class: "ngw-tips"
};
var _hoisted_17$1 = { class: "ngw-body" };
//#endregion
//#region ../../pages/datasource/src/components/console/NginxTemplatePanel.vue
var NginxTemplatePanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxTemplatePanel",
	props: { datasourceId: {} },
	emits: ["saved"],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 每个占位符的中文标签与提示，缺省则直接显示占位符名 */
		const FIELD_META = {
			DOMAIN: {
				label: "域名",
				hint: "用户浏览器里输入的地址，例如 www.example.com",
				placeholder: "www.example.com"
			},
			ROOT: {
				label: "网站目录",
				hint: "网页文件在服务器上的绝对路径",
				placeholder: "/var/www/html"
			},
			UPSTREAM: {
				label: "后端地址",
				hint: "要转发到的后端，如 http://127.0.0.1:3000",
				placeholder: "http://127.0.0.1:3000"
			},
			LOCATION: {
				label: "路径前缀",
				hint: "只有这个前缀的请求会被转发；填 / 表示全部",
				placeholder: "/"
			},
			TIMEOUT: {
				label: "超时时间",
				hint: "等待后端响应的最长时间，跑批任务要调大",
				placeholder: "60s"
			},
			API_PREFIX: {
				label: "接口前缀",
				hint: "后端接口的路径前缀，末尾带斜杠",
				placeholder: "/api/"
			},
			API_UPSTREAM: {
				label: "后端地址",
				hint: "后端服务地址",
				placeholder: "http://127.0.0.1:8080"
			},
			CERT_PATH: {
				label: "证书路径",
				hint: "fullchain.pem 的绝对路径",
				placeholder: "/etc/letsencrypt/live/example.com/fullchain.pem"
			},
			KEY_PATH: {
				label: "私钥路径",
				hint: "privkey.pem 的绝对路径",
				placeholder: "/etc/letsencrypt/live/example.com/privkey.pem"
			},
			WEBROOT: {
				label: "验证目录",
				hint: "证书自动续签用的目录，一般是 /var/www/html",
				placeholder: "/var/www/html"
			},
			UPSTREAM_NAME: {
				label: "上游名",
				hint: "给这组后端起的名字，proxy_pass 里会引用它",
				placeholder: "backend"
			},
			BACKEND1: {
				label: "后端 1",
				hint: "第一台后端地址",
				placeholder: "10.0.0.11:8080"
			},
			BACKEND2: {
				label: "后端 2",
				hint: "第二台后端地址",
				placeholder: "10.0.0.12:8080"
			},
			PASSWD_FILE: {
				label: "密码文件",
				hint: "用 htpasswd 工具生成",
				placeholder: "/etc/nginx/.htpasswd"
			},
			MAX_SIZE: {
				label: "最大上传",
				hint: "允许的上传体积，默认只有 1m",
				placeholder: "100m"
			},
			UPLOAD_PATH: {
				label: "上传路径",
				hint: "上传接口的路径",
				placeholder: "/upload/"
			}
		};
		const templates = ref([]);
		const files = ref([]);
		const picked = ref(null);
		const wizardVisible = ref(false);
		const step = ref(0);
		const form = ref({});
		const targetPath = ref("");
		const optBackup = ref(true);
		const optValidate = ref(true);
		const optReload = ref(false);
		const saving = ref(false);
		const fields = computed(() => picked.value?.requiredFields || []);
		const missing = computed(() => fields.value.filter((f) => !form.value[f]?.trim()));
		const rendered = computed(() => {
			let out = picked.value?.content || "";
			for (const [k, v] of Object.entries(form.value)) out = out.split(`{{${k}}}`).join(v);
			return out;
		});
		function fieldLabel(f) {
			return FIELD_META[f]?.label || f;
		}
		function fieldHint(f) {
			return FIELD_META[f]?.hint || "";
		}
		function fieldPlaceholder(f) {
			return FIELD_META[f]?.placeholder || "";
		}
		function onFieldInput() {}
		function pick(t) {
			picked.value = t;
			form.value = {};
			step.value = 0;
			targetPath.value = files.value.find((f) => /conf\.d|\/sites-enabled/.test(f.path))?.path || files.value[0]?.path || "";
			wizardVisible.value = true;
		}
		async function load() {
			if (!props.datasourceId) return;
			try {
				const [t, f] = await Promise.allSettled([fetchNginxTemplates(), fetchNginxConfigFiles(props.datasourceId)]);
				templates.value = t.status === "fulfilled" ? t.value || [] : [];
				files.value = f.status === "fulfilled" ? f.value || [] : [];
			} catch (e) {
				message.error(`读取模板失败：${e.message}`);
			}
		}
		async function doSave() {
			if (!props.datasourceId || !picked.value || !targetPath.value) return;
			saving.value = true;
			try {
				const r = await applyNginxConfig({
					datasourceId: props.datasourceId,
					path: targetPath.value,
					mode: "FILE",
					content: rendered.value,
					backup: optBackup.value,
					validate: optValidate.value,
					reload: optReload.value
				});
				wizardVisible.value = false;
				if (r.saved) {
					message.success(r.message);
					emit("saved", r);
				} else message.error(r.message);
			} catch (e) {
				message.error(`写入失败：${e.message}`);
			} finally {
				saving.value = false;
			}
		}
		watch(() => props.datasourceId, load, { immediate: true });
		__expose({
			load,
			templates
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$3, [
				createVNode(unref(ReAlert), {
					type: "info",
					class: "ngt-alert"
				}, {
					title: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode(" 不确定怎么写？挑一个最接近你需求的模板，填几个空就能生成一份能直接用的配置。 生成后建议先在测试机用「校验配置」确认，再重载。 ", -1)])]),
					_: 1
				}),
				createBaseVNode("div", _hoisted_2$3, [(openBlock(true), createElementBlock(Fragment, null, renderList(templates.value, (t) => {
					return openBlock(), createElementBlock("div", {
						key: t.key,
						class: normalizeClass(["ngt-card", { active: picked.value?.key === t.key }]),
						onClick: ($event) => pick(t)
					}, [
						createBaseVNode("div", _hoisted_4$3, [createBaseVNode("span", _hoisted_5$3, toDisplayString(t.title), 1), createVNode(unref(component$2), { type: t.difficulty === "easy" ? "success" : "warning" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(t.difficulty === "easy" ? "简单" : "进阶"), 1)]),
							_: 2
						}, 1032, ["type"])]),
						createBaseVNode("div", _hoisted_6$3, toDisplayString(t.summary), 1),
						createBaseVNode("div", _hoisted_7$3, "适用：" + toDisplayString(t.scene), 1)
					], 10, _hoisted_3$3);
				}), 128))]),
				createVNode(unref(component), {
					modelValue: wizardVisible.value,
					"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => wizardVisible.value = $event),
					title: picked.value ? `向导：${picked.value.title}` : "向导",
					width: "760px",
					height: 600
				}, {
					footer: withCtx(() => [
						createVNode(unref(ReButton_default), { onClick: _cache[4] || (_cache[4] = ($event) => wizardVisible.value = false) }, {
							default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("取消", -1)])]),
							_: 1
						}),
						step.value > 0 ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 0,
							onClick: _cache[5] || (_cache[5] = ($event) => step.value--)
						}, {
							default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("上一步", -1)])]),
							_: 1
						})) : createCommentVNode("", true),
						step.value === 0 ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 1,
							type: "primary",
							disabled: missing.value.length > 0,
							onClick: _cache[6] || (_cache[6] = ($event) => step.value = 1)
						}, {
							default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode(" 下一步 ", -1)])]),
							_: 1
						}, 8, ["disabled"])) : step.value === 1 ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 2,
							type: "primary",
							onClick: _cache[7] || (_cache[7] = ($event) => step.value = 2)
						}, {
							default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("下一步", -1)])]),
							_: 1
						})) : (openBlock(), createBlock(unref(ReButton_default), {
							key: 3,
							type: "primary",
							loading: saving.value,
							disabled: !targetPath.value,
							onClick: doSave
						}, {
							default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode(" 写入配置 ", -1)])]),
							_: 1
						}, 8, ["loading", "disabled"]))
					]),
					default: withCtx(() => [picked.value ? (openBlock(), createElementBlock("div", _hoisted_8$3, [
						createBaseVNode("div", _hoisted_9$3, [(openBlock(), createElementBlock(Fragment, null, renderList([
							"填写参数",
							"确认配置",
							"保存"
						], (label, i) => {
							return createBaseVNode("div", {
								key: i,
								class: normalizeClass(["ngw-step", {
									active: step.value === i,
									done: step.value > i
								}])
							}, [createBaseVNode("span", _hoisted_10$3, toDisplayString(step.value > i ? "✓" : i + 1), 1), createBaseVNode("span", null, toDisplayString(label), 1)], 2);
						}), 64))]),
						withDirectives(createBaseVNode("div", _hoisted_11$3, [createBaseVNode("div", _hoisted_12$3, toDisplayString(picked.value.summary), 1), createVNode(unref(ReForm_default), { "label-width": "150px" }, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(fields.value, (f) => {
								return openBlock(), createBlock(unref(ReFormItem), {
									key: f,
									label: fieldLabel(f),
									required: true
								}, {
									default: withCtx(() => [createVNode(unref(ReInput_default), {
										modelValue: form.value[f],
										"onUpdate:modelValue": [($event) => form.value[f] = $event, onFieldInput],
										placeholder: fieldPlaceholder(f)
									}, null, 8, [
										"modelValue",
										"onUpdate:modelValue",
										"placeholder"
									]), createBaseVNode("div", _hoisted_13$3, toDisplayString(fieldHint(f)), 1)]),
									_: 2
								}, 1032, ["label"]);
							}), 128))]),
							_: 1
						})], 512), [[vShow, step.value === 0]]),
						withDirectives(createBaseVNode("div", _hoisted_14$2, [
							createVNode(unref(ReAlert), {
								type: missing.value.length ? "error" : "success",
								title: missing.value.length ? `还有必填项没填：${missing.value.join("、")}` : "参数已齐，下面就是将要写入的配置"
							}, null, 8, ["type", "title"]),
							createBaseVNode("pre", _hoisted_15$1, toDisplayString(rendered.value), 1),
							picked.value.tips.length ? (openBlock(), createElementBlock("ul", _hoisted_16$1, [(openBlock(true), createElementBlock(Fragment, null, renderList(picked.value.tips, (t, i) => {
								return openBlock(), createElementBlock("li", { key: i }, toDisplayString(t), 1);
							}), 128))])) : createCommentVNode("", true)
						], 512), [[vShow, step.value === 1]]),
						withDirectives(createBaseVNode("div", _hoisted_17$1, [createVNode(unref(ReForm_default), { "label-width": "150px" }, {
							default: withCtx(() => [
								createVNode(unref(ReFormItem), {
									label: "写入文件",
									required: ""
								}, {
									default: withCtx(() => [createVNode(unref(ReSelect_default), {
										modelValue: targetPath.value,
										"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => targetPath.value = $event),
										filterable: "",
										"allow-create": "",
										placeholder: "选择或输入目标 .conf 路径"
									}, {
										default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(files.value, (f) => {
											return openBlock(), createBlock(unref(ReOption), {
												key: f.path,
												value: f.path,
												label: f.path
											}, null, 8, ["value", "label"]);
										}), 128))]),
										_: 1
									}, 8, ["modelValue"])]),
									_: 1
								}),
								createVNode(unref(ReFormItem), { label: "保存前备份" }, {
									default: withCtx(() => [createVNode(unref(ReSwitch_default), {
										modelValue: optBackup.value,
										"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => optBackup.value = $event),
										"aria-label": "保存前备份"
									}, null, 8, ["modelValue"]), _cache[10] || (_cache[10] = createBaseVNode("span", { class: "ngw-hint" }, "强烈建议开启。配置写错了可以从「备份」页回退。", -1))]),
									_: 1
								}),
								createVNode(unref(ReFormItem), { label: "保存后校验" }, {
									default: withCtx(() => [createVNode(unref(ReSwitch_default), {
										modelValue: optValidate.value,
										"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => optValidate.value = $event),
										"aria-label": "保存后校验"
									}, null, 8, ["modelValue"]), _cache[11] || (_cache[11] = createBaseVNode("span", { class: "ngw-hint" }, "用 nginx -t 检查语法，不通过就不会生效。", -1))]),
									_: 1
								}),
								createVNode(unref(ReFormItem), { label: "校验通过后重载" }, {
									default: withCtx(() => [createVNode(unref(ReSwitch_default), {
										modelValue: optReload.value,
										"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => optReload.value = $event),
										"aria-label": "校验通过后重载"
									}, null, 8, ["modelValue"]), _cache[12] || (_cache[12] = createBaseVNode("span", { class: "ngw-hint" }, "勾上后一步到位；建议先只校验，确认无误再手动重载。", -1))]),
									_: 1
								})
							]),
							_: 1
						}), !targetPath.value ? (openBlock(), createBlock(unref(ReAlert), {
							key: 0,
							type: "warning",
							title: "请选择要写入的配置文件路径"
						})) : createCommentVNode("", true)], 512), [[vShow, step.value === 2]])
					])) : createCommentVNode("", true)]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-f2d334c4"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/nginx/NgxCardSettingsDialog.vue?vue&type=script&setup=true&name=NgxCardSettingsDialog&lang.ts
var _hoisted_1$2 = { class: "ngs" };
var _hoisted_2$2 = { class: "ngs-mode" };
var _hoisted_3$2 = {
	class: "dsm-seg",
	role: "group",
	"aria-label": "配置模式"
};
var _hoisted_4$2 = { class: "ngs-mode-hint" };
var _hoisted_5$2 = { class: "ngs-row" };
var _hoisted_6$2 = { class: "ngs-row" };
var _hoisted_7$2 = { class: "ngs-inline" };
var _hoisted_8$2 = { class: "ngs-row" };
var _hoisted_9$2 = { class: "ngs-row" };
var _hoisted_10$2 = { class: "ngs-inline" };
var _hoisted_11$2 = { class: "ngs-row" };
var _hoisted_12$2 = { class: "ngs-metrics" };
var _hoisted_13$2 = [
	"checked",
	"value",
	"onChange"
];
var _hoisted_14$1 = { class: "ngs-row" };
var _hoisted_15 = { class: "ngs-row" };
var _hoisted_16 = { class: "ngs-inline" };
var _hoisted_17 = { class: "ngs-row" };
var _hoisted_18 = { class: "ngs-row" };
var _hoisted_19 = { class: "ngs-row" };
var _hoisted_20 = { class: "ngs-inline" };
var _hoisted_21 = { class: "ngs-row" };
var _hoisted_22 = { class: "ngs-inline" };
var _hoisted_23 = {
	key: 3,
	class: "ngs-row"
};
var _hoisted_24 = { class: "ngs-row" };
var _hoisted_25 = { class: "ngs-inline" };
var _hoisted_26 = ["value"];
var _hoisted_27 = { class: "ngs-row" };
var _hoisted_28 = { class: "ngs-swatches" };
var _hoisted_29 = ["title", "onClick"];
var _hoisted_30 = { class: "ngs-row" };
var _hoisted_31 = { class: "ngs-inline" };
var _hoisted_32 = { class: "ngs-row" };
var _hoisted_33 = {
	key: 0,
	class: "ngs-error"
};
//#endregion
//#region ../../pages/datasource/src/components/console/nginx/NgxCardSettingsDialog.vue
var NgxCardSettingsDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NgxCardSettingsDialog",
	props: {
		modelValue: { type: Boolean },
		widget: {}
	},
	emits: ["update:modelValue", "save"],
	setup(__props, { emit: __emit }) {
		/**
		* Nginx 看板卡片设置弹窗（表单 / 自定义 JSON 双模式，默认表单）。
		*
		* <p>两种模式编辑的是同一份卡片模型：切到自定义时把当前表单序列化为 JSON，
		* 切回表单时解析 JSON 回填。保存时输出新的 widget 条目（父组件负责替换进布局并触发实时保存）。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const props = __props;
		const emit = __emit;
		const PRESET_COLORS = [
			{
				label: "白",
				value: "#ffffff"
			},
			{
				label: "浅灰",
				value: "#f5f7fa"
			},
			{
				label: "浅蓝",
				value: "#eef4ff"
			},
			{
				label: "浅绿",
				value: "#eefaf1"
			},
			{
				label: "浅黄",
				value: "#fdf6e3"
			},
			{
				label: "浅红",
				value: "#fdeef0"
			},
			{
				label: "深蓝",
				value: "#1e293b"
			},
			{
				label: "深灰",
				value: "#334155"
			}
		];
		const mode = ref("form");
		const customText = ref("");
		const customError = ref("");
		const form = reactive({ title: "" });
		const kind = computed(() => props.widget?.type || "ngx-stat");
		const headLabel = computed(() => props.widget?.title || NGX_CARD_META[kind.value]?.label || "卡片");
		/** 背景色选择器的显示值：表单里存的是任意 CSS 颜色文本，input[type=color] 只认 #rrggbb */
		const colorPick = computed(() => /^#[0-9a-fA-F]{6}$/.test(form.background || "") ? form.background : "#ffffff");
		/** 当前选中的图表指标集合（表单里是 checkbox 集合） */
		const selectedMetrics = computed(() => form.metrics ?? []);
		function toggleMetric(value) {
			const current = form.metrics ? [...form.metrics] : [];
			const idx = current.indexOf(value);
			if (idx >= 0) current.splice(idx, 1);
			else current.push(value);
			form.metrics = current;
		}
		/** 打开弹窗时把 widget 配置灌进表单 */
		watch(() => [props.modelValue, props.widget], () => {
			if (!props.modelValue || !props.widget) return;
			mode.value = "form";
			customError.value = "";
			const ngx = props.widget.ngx ?? {};
			Object.keys(form).forEach((key) => {
				if (!(key in ngx) && key !== "title") form[key] = void 0;
			});
			Object.assign(form, ngx);
			form.title = props.widget.title || "";
			form.refreshSeconds = ngx.refreshSeconds ?? 30;
			if (kind.value === "ngx-stat" && !form.metric) form.metric = "activeConnections";
			if (kind.value === "ngx-chart") {
				form.metrics = ngx.metrics?.length ? ngx.metrics : ["active", "requests"];
				form.chartType = ngx.chartType ?? "line";
				form.hours = ngx.hours ?? 6;
			}
			if (kind.value === "ngx-table") {
				form.dimension = ngx.dimension ?? "paths";
				form.topN = ngx.topN ?? 10;
			}
		}, { immediate: true });
		/** 原生色块选择器：从事件目标读值写入背景色（不能读 colorPick——它是由背景色派生出来的） */
		function onPickColor(e) {
			const value = e.target.value;
			if (/^#[0-9a-fA-F]{6}$/.test(value)) form.background = value;
		}
		/** 切模式：表单 → JSON 序列化；JSON → 解析回填（解析失败留在自定义模式并报错） */
		function switchMode(next) {
			if (next === mode.value) return;
			if (next === "custom") {
				customText.value = JSON.stringify(buildPayload(), null, 2);
				customError.value = "";
				mode.value = "custom";
				return;
			}
			if (!customText.value.trim()) {
				mode.value = "form";
				return;
			}
			try {
				applyCustom(JSON.parse(customText.value));
				customError.value = "";
				mode.value = "form";
			} catch (e) {
				customError.value = `JSON 解析失败：${e?.message ?? e}`;
			}
		}
		/** 组装要保存的 widget 条目 */
		function buildPayload() {
			const { title, ...ngx } = form;
			return {
				title: (title || "").trim(),
				ngx: cleanNgx(ngx)
			};
		}
		/** 去掉空值字段，保持持久化 JSON 干净 */
		function cleanNgx(ngx) {
			const out = {};
			Object.entries(ngx).forEach(([k, v]) => {
				if (v === void 0 || v === null || v === "" || Array.isArray(v) && v.length === 0) return;
				out[k] = v;
			});
			return out;
		}
		/** 自定义 JSON → 表单回填 */
		function applyCustom(parsed) {
			if (!parsed || typeof parsed !== "object") throw new Error("卡片 JSON 必须是对象");
			const ngx = parsed.ngx && typeof parsed.ngx === "object" ? parsed.ngx : {};
			Object.keys(form).forEach((key) => {
				if (key === "title") return;
				if (!(key in ngx)) form[key] = void 0;
			});
			Object.assign(form, ngx);
			form.title = typeof parsed.title === "string" ? parsed.title : "";
		}
		/** 自定义模式的 JSON 校验 */
		function validateCustom() {
			try {
				applyCustom(JSON.parse(customText.value));
				customError.value = "";
				message.success("JSON 合法");
				return true;
			} catch (e) {
				customError.value = `JSON 解析失败：${e?.message ?? e}`;
				return false;
			}
		}
		/** 保存：表单模式直接组装；自定义模式先解析再组装 */
		function save() {
			if (!props.widget) return;
			if (mode.value === "custom") try {
				applyCustom(JSON.parse(customText.value));
			} catch (e) {
				customError.value = `JSON 解析失败：${e?.message ?? e}`;
				message.error("自定义 JSON 不合法，无法保存");
				return;
			}
			const payload = buildPayload();
			const next = {
				...props.widget,
				title: payload.title || headLabel.value,
				ngx: payload.ngx
			};
			emit("save", { widget: next });
			emit("update:modelValue", false);
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(component), {
				"model-value": __props.modelValue,
				title: `卡片设置 · ${headLabel.value}`,
				width: "720px",
				"onUpdate:modelValue": _cache[23] || (_cache[23] = (v) => emit("update:modelValue", v))
			}, {
				footer: withCtx(() => [
					createVNode(unref(ReButton_default), {
						"data-testid": "ngs-btn-cancel",
						onClick: _cache[22] || (_cache[22] = ($event) => emit("update:modelValue", false))
					}, {
						default: withCtx(() => [..._cache[50] || (_cache[50] = [createTextVNode("取消", -1)])]),
						_: 1
					}),
					mode.value === "custom" ? (openBlock(), createBlock(unref(ReButton_default), {
						key: 0,
						"data-testid": "ngs-btn-validate",
						onClick: validateCustom
					}, {
						default: withCtx(() => [..._cache[51] || (_cache[51] = [createTextVNode("校验 JSON", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					createVNode(unref(ReButton_default), {
						type: "primary",
						"data-testid": "ngs-btn-save",
						onClick: save
					}, {
						default: withCtx(() => [..._cache[52] || (_cache[52] = [createTextVNode("保存", -1)])]),
						_: 1
					})
				]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_1$2, [createBaseVNode("div", _hoisted_2$2, [createBaseVNode("div", _hoisted_3$2, [createBaseVNode("button", {
					type: "button",
					class: normalizeClass({ "is-active": mode.value === "form" }),
					"data-testid": "ngs-mode-form",
					onClick: _cache[0] || (_cache[0] = ($event) => switchMode("form"))
				}, "表单", 2), createBaseVNode("button", {
					type: "button",
					class: normalizeClass({ "is-active": mode.value === "custom" }),
					"data-testid": "ngs-mode-custom",
					onClick: _cache[1] || (_cache[1] = ($event) => switchMode("custom"))
				}, "自定义 JSON", 2)]), createBaseVNode("span", _hoisted_4$2, toDisplayString(mode.value === "form" ? "表单配置（默认）" : "直接编辑完整 JSON，适合高级参数"), 1)]), mode.value === "form" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
					createBaseVNode("div", _hoisted_5$2, [_cache[24] || (_cache[24] = createBaseVNode("label", { class: "ngs-label" }, "标题", -1)), createVNode(unref(ReInput_default), {
						modelValue: form.title,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.title = $event),
						"data-testid": "ngs-input-title",
						placeholder: "卡片标题"
					}, null, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_6$2, [_cache[26] || (_cache[26] = createBaseVNode("label", { class: "ngs-label" }, "刷新间隔", -1)), createBaseVNode("div", _hoisted_7$2, [createVNode(unref(ReInput_default), {
						modelValue: form.refreshSeconds,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.refreshSeconds = $event),
						"data-testid": "ngs-input-refresh",
						type: "number",
						placeholder: "秒，0 表示不自动刷新"
					}, null, 8, ["modelValue"]), _cache[25] || (_cache[25] = createBaseVNode("span", { class: "ngs-suffix" }, "秒", -1))])]),
					kind.value === "ngx-stat" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_8$2, [_cache[27] || (_cache[27] = createBaseVNode("label", { class: "ngs-label" }, "指标", -1)), createVNode(unref(ReSelect_default), {
						modelValue: form.metric,
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.metric = $event)
					}, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(STAT_METRICS), (m) => {
							return openBlock(), createBlock(unref(ReOption), {
								key: m.value,
								value: m.value,
								label: m.label
							}, null, 8, ["value", "label"]);
						}), 128))]),
						_: 1
					}, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_9$2, [_cache[28] || (_cache[28] = createBaseVNode("label", { class: "ngs-label" }, "单位 / 小数位", -1)), createBaseVNode("div", _hoisted_10$2, [createVNode(unref(ReInput_default), {
						modelValue: form.unit,
						"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.unit = $event),
						placeholder: "单位（如 conn / req）"
					}, null, 8, ["modelValue"]), createVNode(unref(ReInput_default), {
						modelValue: form.decimals,
						"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.decimals = $event),
						type: "number",
						placeholder: "小数位",
						class: "ngs-num"
					}, null, 8, ["modelValue"])])])], 64)) : createCommentVNode("", true),
					kind.value === "ngx-chart" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", _hoisted_11$2, [_cache[29] || (_cache[29] = createBaseVNode("label", { class: "ngs-label" }, "指标", -1)), createBaseVNode("div", _hoisted_12$2, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(TREND_METRICS), (m) => {
							return openBlock(), createElementBlock("label", {
								key: m.value,
								class: "ngs-metric-item"
							}, [createBaseVNode("input", {
								type: "checkbox",
								checked: selectedMetrics.value.includes(m.value),
								"data-testid": "ngs-check-metric",
								value: m.value,
								onChange: ($event) => toggleMetric(m.value)
							}, null, 40, _hoisted_13$2), createBaseVNode("span", null, toDisplayString(m.label), 1)]);
						}), 128))])]),
						createBaseVNode("div", _hoisted_14$1, [_cache[30] || (_cache[30] = createBaseVNode("label", { class: "ngs-label" }, "图表类型", -1)), createVNode(unref(ReSelect_default), {
							modelValue: form.chartType,
							"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.chartType = $event)
						}, {
							default: withCtx(() => [
								createVNode(unref(ReOption), {
									value: "line",
									label: "折线"
								}),
								createVNode(unref(ReOption), {
									value: "bar",
									label: "柱状"
								}),
								createVNode(unref(ReOption), {
									value: "area",
									label: "面积"
								})
							]),
							_: 1
						}, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_15, [_cache[33] || (_cache[33] = createBaseVNode("label", { class: "ngs-label" }, "回看 / 间隔", -1)), createBaseVNode("div", _hoisted_16, [
							createVNode(unref(ReInput_default), {
								modelValue: form.hours,
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.hours = $event),
								type: "number",
								placeholder: "小时",
								class: "ngs-num"
							}, null, 8, ["modelValue"]),
							_cache[31] || (_cache[31] = createBaseVNode("span", { class: "ngs-suffix" }, "小时", -1)),
							createVNode(unref(ReInput_default), {
								modelValue: form.interval,
								"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.interval = $event),
								type: "number",
								placeholder: "分钟（空=自动）",
								class: "ngs-num"
							}, null, 8, ["modelValue"]),
							_cache[32] || (_cache[32] = createBaseVNode("span", { class: "ngs-suffix" }, "分钟", -1))
						])]),
						createBaseVNode("div", _hoisted_17, [_cache[34] || (_cache[34] = createBaseVNode("label", { class: "ngs-label" }, "ECharts 参数", -1)), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.echarts = $event),
							class: "ngs-textarea ngs-textarea--mono",
							"data-testid": "ngs-textarea-echarts",
							rows: "4",
							spellcheck: "false",
							placeholder: "JSON，深合并到自动生成的 option，如 {\"yAxis\":{\"max\":100}}"
						}, null, 512), [[vModelText, form.echarts]])])
					], 64)) : createCommentVNode("", true),
					kind.value === "ngx-table" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
						createBaseVNode("div", _hoisted_18, [_cache[35] || (_cache[35] = createBaseVNode("label", { class: "ngs-label" }, "维度", -1)), createVNode(unref(ReSelect_default), {
							modelValue: form.dimension,
							"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.dimension = $event)
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(TABLE_DIMENSIONS), (d) => {
								return openBlock(), createBlock(unref(ReOption), {
									key: d.value,
									value: d.value,
									label: d.label
								}, null, 8, ["value", "label"]);
							}), 128))]),
							_: 1
						}, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_19, [_cache[37] || (_cache[37] = createBaseVNode("label", { class: "ngs-label" }, "Top N", -1)), createBaseVNode("div", _hoisted_20, [createVNode(unref(ReInput_default), {
							modelValue: form.topN,
							"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => form.topN = $event),
							type: "number",
							placeholder: "条数",
							class: "ngs-num"
						}, null, 8, ["modelValue"]), _cache[36] || (_cache[36] = createBaseVNode("span", { class: "ngs-suffix" }, "条", -1))])]),
						createBaseVNode("div", _hoisted_21, [_cache[40] || (_cache[40] = createBaseVNode("label", { class: "ngs-label" }, "扫描 / 窗口", -1)), createBaseVNode("div", _hoisted_22, [
							createVNode(unref(ReInput_default), {
								modelValue: form.lines,
								"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.lines = $event),
								type: "number",
								placeholder: "尾部行数（空=默认）",
								class: "ngs-num"
							}, null, 8, ["modelValue"]),
							_cache[38] || (_cache[38] = createBaseVNode("span", { class: "ngs-suffix" }, "行", -1)),
							createVNode(unref(ReInput_default), {
								modelValue: form.minutes,
								"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => form.minutes = $event),
								type: "number",
								placeholder: "分钟（空=不限）",
								class: "ngs-num"
							}, null, 8, ["modelValue"]),
							_cache[39] || (_cache[39] = createBaseVNode("span", { class: "ngs-suffix" }, "分钟", -1))
						])])
					], 64)) : createCommentVNode("", true),
					kind.value === "ngx-script" ? (openBlock(), createElementBlock("div", _hoisted_23, [_cache[41] || (_cache[41] = createBaseVNode("label", { class: "ngs-label" }, "采集脚本", -1)), withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => form.script = $event),
						class: "ngs-textarea ngs-textarea--mono",
						"data-testid": "ngs-textarea-script",
						rows: "8",
						spellcheck: "false",
						placeholder: "JS 函数体，可用 ctx.status / ctx.trend / ctx.accessTop / ctx.urlTrend 取数，return 文本或对象"
					}, null, 512), [[vModelText, form.script]])])) : createCommentVNode("", true),
					_cache[48] || (_cache[48] = createBaseVNode("div", { class: "ngs-divider" }, "外观", -1)),
					createBaseVNode("div", _hoisted_24, [_cache[43] || (_cache[43] = createBaseVNode("label", { class: "ngs-label" }, "背景色", -1)), createBaseVNode("div", _hoisted_25, [
						withDirectives(createBaseVNode("input", {
							"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => form.background = $event),
							class: "ngs-color-text",
							"data-testid": "ngs-input-background",
							placeholder: "空 = 跟随主题（支持任意 CSS 颜色）"
						}, null, 512), [[vModelText, form.background]]),
						createBaseVNode("input", {
							value: colorPick.value,
							type: "color",
							class: "ngs-color",
							"data-testid": "ngs-input-color",
							onInput: onPickColor
						}, null, 40, _hoisted_26),
						createVNode(unref(ReButton_default), {
							"data-testid": "ngs-btn-clear-bg",
							onClick: _cache[17] || (_cache[17] = ($event) => form.background = "")
						}, {
							default: withCtx(() => [..._cache[42] || (_cache[42] = [createTextVNode("清除", -1)])]),
							_: 1
						})
					])]),
					createBaseVNode("div", _hoisted_27, [_cache[44] || (_cache[44] = createBaseVNode("label", { class: "ngs-label" }, "预设", -1)), createBaseVNode("div", _hoisted_28, [(openBlock(), createElementBlock(Fragment, null, renderList(PRESET_COLORS, (c) => {
						return createBaseVNode("button", {
							key: c.value,
							type: "button",
							class: "ngs-swatch",
							style: normalizeStyle({ background: c.value }),
							title: c.label,
							onClick: ($event) => form.background = c.value
						}, null, 12, _hoisted_29);
					}), 64))])]),
					createBaseVNode("div", _hoisted_30, [_cache[46] || (_cache[46] = createBaseVNode("label", { class: "ngs-label" }, "文字色", -1)), createBaseVNode("div", _hoisted_31, [withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => form.textColor = $event),
						class: "ngs-color-text",
						"data-testid": "ngs-input-textcolor",
						placeholder: "空 = 跟随主题"
					}, null, 512), [[vModelText, form.textColor]]), createVNode(unref(ReButton_default), {
						"data-testid": "ngs-btn-clear-textcolor",
						onClick: _cache[19] || (_cache[19] = ($event) => form.textColor = "")
					}, {
						default: withCtx(() => [..._cache[45] || (_cache[45] = [createTextVNode("清除", -1)])]),
						_: 1
					})])]),
					createBaseVNode("div", _hoisted_32, [_cache[47] || (_cache[47] = createBaseVNode("label", { class: "ngs-label" }, "自定义 CSS", -1)), withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => form.css = $event),
						class: "ngs-textarea ngs-textarea--mono",
						"data-testid": "ngs-textarea-css",
						rows: "4",
						spellcheck: "false",
						placeholder: "作用于卡片根元素的 CSS 声明，如 background: linear-gradient(...); border-radius: 12px;"
					}, null, 512), [[vModelText, form.css]])])
				], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
					_cache[49] || (_cache[49] = createBaseVNode("div", { class: "ngs-custom-hint" }, " 完整卡片 JSON（title + ngx 配置）。字段与表单模式一一对应；保存前会做 JSON 校验。 ", -1)),
					withDirectives(createBaseVNode("textarea", {
						"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => customText.value = $event),
						class: "ngs-textarea ngs-textarea--mono ngs-custom-json",
						"data-testid": "ngs-custom-json",
						rows: "18",
						spellcheck: "false"
					}, null, 512), [[vModelText, customText.value]]),
					customError.value ? (openBlock(), createElementBlock("div", _hoisted_33, toDisplayString(customError.value), 1)) : createCommentVNode("", true)
				], 64))])]),
				_: 1
			}, 8, ["model-value", "title"]);
		};
	}
}), [["__scopeId", "data-v-bf02950b"]]);
//#endregion
//#region ../../pages/datasource/src/components/console/nginx/NgxLayoutPanel.vue?vue&type=script&setup=true&name=NgxLayoutPanel&lang.ts
var _hoisted_1$1 = { class: "ngl" };
var _hoisted_2$1 = { class: "ngl-bar" };
var _hoisted_3$1 = { class: "ngl-bar-left" };
var _hoisted_4$1 = { class: "ngl-bar-right" };
var _hoisted_5$1 = { class: "ngl-body" };
var _hoisted_6$1 = { class: "ngl-embed" };
var _hoisted_7$1 = { class: "ngl-embed-block" };
var _hoisted_8$1 = { class: "ngl-embed-row" };
var _hoisted_9$1 = ["value"];
var _hoisted_10$1 = { class: "ngl-embed-block" };
var _hoisted_11$1 = { class: "ngl-embed-row" };
var _hoisted_12$1 = ["value"];
var _hoisted_13$1 = { class: "ngl-embed-foot" };
var _hoisted_14 = { class: "ngl-embed-token" };
//#endregion
//#region ../../pages/datasource/src/components/console/nginx/NgxLayoutPanel.vue
var NgxLayoutPanel_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NgxLayoutPanel",
	props: { datasourceId: {} },
	setup(__props) {
		/**
		* Nginx 自定义布局面板。
		*
		* <p>复用 home 插件的网格编辑器（HomePreview + WidgetLibrary），卡片配置挂 widget.ngx：
		* 指标选择 / 图表参数 / ECharts 参数 / 采集脚本 / 背景色 / 自定义 CSS 均在卡片设置里配置
		* （表单或 JSON 双模式，默认表单）。布局变化实时保存（debounce），并生成免登录嵌入链接
		* 供其他系统 iframe 使用。</p>
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const props = __props;
		provide(NGX_CTX_KEY, createNgxConsoleContext(() => props.datasourceId));
		useRoute();
		const layout = ref(emptyNgxLayout());
		const loading = ref(false);
		const saving = ref(false);
		const dirty = ref(false);
		const embedToken = ref("");
		const dashboardName = ref("");
		const savedAt = ref("");
		const saveError = ref("");
		const settingsVisible = ref(false);
		const editingWidget = ref(null);
		const embedVisible = ref(false);
		const regenerating = ref(false);
		const stateText = computed(() => {
			if (saving.value) return "保存中…";
			if (saveError.value) return `保存失败：${saveError.value}`;
			if (dirty.value) return "编辑中…";
			return savedAt.value ? `已保存 ${savedAt.value}` : "已同步";
		});
		const stateClass = computed(() => ({
			"is-saving": saving.value,
			"is-dirty": dirty.value && !saving.value,
			"is-error": !!saveError.value,
			"is-saved": !dirty.value && !saving.value && !saveError.value
		}));
		/** 嵌入链接：hash 路由下的免登录只读页面 */
		const embedUrl = computed(() => {
			if (!embedToken.value) return "";
			return `${`${window.location.origin}${window.location.pathname}`}#/nginx/embed/${embedToken.value}`;
		});
		const iframeSnippet = computed(() => `<iframe src="${embedUrl.value}" width="100%" height="720" style="border:0" allowfullscreen loading="lazy"></iframe>`);
		/** 载入期间抑制 watcher 触发的保存：避免把「从后端载入布局」误当成「用户编辑」自动落库 */
		let hydrating = false;
		async function reload() {
			loading.value = true;
			saveError.value = "";
			try {
				const dashboard = await fetchNginxDashboard(props.datasourceId);
				embedToken.value = dashboard?.embedToken || "";
				dashboardName.value = dashboard?.name || "";
				hydrating = true;
				layout.value = parseNgxLayout(dashboard?.config);
				nextTick(() => {
					hydrating = false;
				});
				dirty.value = false;
				savedAt.value = dashboard?.updateTime ? formatTime(dashboard.updateTime) : "";
			} catch (e) {
				saveError.value = e?.message || String(e);
				message.error(`看板读取失败：${saveError.value}`);
			} finally {
				loading.value = false;
			}
		}
		async function saveNow() {
			if (saving.value) return;
			saving.value = true;
			saveError.value = "";
			try {
				const dashboard = await saveNginxDashboard({
					datasourceId: props.datasourceId,
					name: dashboardName.value || void 0,
					config: serializeNgxLayout(layout.value)
				});
				embedToken.value = dashboard?.embedToken || embedToken.value;
				dirty.value = false;
				savedAt.value = formatNow();
			} catch (e) {
				saveError.value = e?.message || String(e);
			} finally {
				saving.value = false;
			}
		}
		/** 实时保存：布局变化 800ms 后落库 */
		let saveTimer = null;
		function scheduleSave() {
			dirty.value = true;
			if (saveTimer !== null) window.clearTimeout(saveTimer);
			saveTimer = window.setTimeout(() => {
				saveTimer = null;
				saveNow();
			}, 800);
		}
		watch(layout, () => {
			if (hydrating) return;
			scheduleSave();
		}, { deep: true });
		function formatNow() {
			return (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour12: false });
		}
		function formatTime(value) {
			const d = new Date(value);
			return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString("zh-CN", { hour12: false });
		}
		function onGridUpdate(grid) {
			layout.value = {
				...layout.value,
				grid
			};
		}
		function onRemove(id) {
			layout.value = {
				...layout.value,
				widgets: layout.value.widgets.filter((w) => w.id !== id),
				grid: layout.value.grid.filter((g) => g.i !== id)
			};
		}
		function onAdd(type) {
			const kind = type;
			const meta = NGX_CARD_META[kind];
			if (!meta) return;
			if (layout.value.widgets.filter((w) => w.type === type).length >= 24) {
				message.warning(`${meta.label} 数量已达上限`);
				return;
			}
			const id = newNgxCardId();
			const bottom = layout.value.grid.reduce((max, g) => Math.max(max, g.y + g.h), 0);
			const widget = {
				id,
				type: kind,
				title: meta.label,
				ngx: { ...meta.defaultCard }
			};
			layout.value = {
				...layout.value,
				widgets: [...layout.value.widgets, widget],
				grid: [...layout.value.grid, {
					i: id,
					x: 0,
					y: bottom,
					w: meta.defaultSize.w,
					h: meta.defaultSize.h
				}]
			};
			openSettings(id);
		}
		function openSettings(id) {
			const found = layout.value.widgets.find((w) => w.id === id);
			if (!found) return;
			editingWidget.value = found;
			settingsVisible.value = true;
		}
		function onSettingsSave(payload) {
			layout.value = {
				...layout.value,
				widgets: layout.value.widgets.map((w) => w.id === payload.widget.id ? payload.widget : w)
			};
		}
		function openEmbed() {
			embedVisible.value = true;
			if (!embedToken.value && !saving.value) saveNow().then(() => {
				if (!embedToken.value) message.warning("请先成功保存看板后再获取嵌入链接");
			});
		}
		async function regenerate() {
			try {
				await ElMessageBox.confirm("重新生成后旧链接立即失效，确认继续？", "重新生成令牌", {
					type: "warning",
					confirmButtonText: "重新生成",
					cancelButtonText: "取消"
				});
			} catch {
				return;
			}
			regenerating.value = true;
			try {
				const dashboard = await regenerateNginxToken(props.datasourceId);
				embedToken.value = dashboard?.embedToken || "";
				message.success("令牌已更新");
			} catch (e) {
				message.error(`生成失败：${e?.message ?? e}`);
			} finally {
				regenerating.value = false;
			}
		}
		function selectText(e) {
			e.target.select();
		}
		async function copyText(text, label) {
			if (!text) {
				message.warning("暂无可复制的链接");
				return;
			}
			if (await copyToClipboard(text)) message.success(`${label}已复制`);
			else message.warning("复制失败，请手动选中复制");
		}
		onMounted(() => {
			reload();
		});
		onBeforeUnmount(() => {
			if (saveTimer !== null) window.clearTimeout(saveTimer);
		});
		watch(() => props.datasourceId, () => {
			reload();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$1, [
				createBaseVNode("div", _hoisted_2$1, [createBaseVNode("div", _hoisted_3$1, [_cache[5] || (_cache[5] = createBaseVNode("span", { class: "ngl-title" }, "自定义看板", -1)), createBaseVNode("span", { class: normalizeClass(["ngl-state", stateClass.value]) }, toDisplayString(stateText.value), 3)]), createBaseVNode("div", _hoisted_4$1, [
					createVNode(unref(ReButton_default), {
						loading: loading.value,
						"data-testid": "ngl-btn-reload",
						onClick: reload
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Refresh",
							size: 13
						})]),
						default: withCtx(() => [_cache[6] || (_cache[6] = createTextVNode(" 重新载入 ", -1))]),
						_: 1
					}, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						disabled: !dirty.value || saving.value,
						"data-testid": "ngl-btn-save",
						onClick: saveNow
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Check",
							size: 13
						})]),
						default: withCtx(() => [_cache[7] || (_cache[7] = createTextVNode(" 保存 ", -1))]),
						_: 1
					}, 8, ["disabled"]),
					createVNode(unref(ReButton_default), {
						type: "primary",
						"data-testid": "ngl-btn-embed",
						onClick: openEmbed
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Link",
							size: 13
						})]),
						default: withCtx(() => [_cache[8] || (_cache[8] = createTextVNode(" 嵌入链接 ", -1))]),
						_: 1
					})
				])]),
				createBaseVNode("div", _hoisted_5$1, [createVNode(HomePreview_default, {
					widgets: layout.value.widgets,
					grid: layout.value.grid,
					"onUpdate:grid": onGridUpdate,
					onRemove,
					onEdit: openSettings
				}, {
					default: withCtx(({ widget }) => [createVNode(NgxCardRenderer_default, { widget }, null, 8, ["widget"])]),
					_: 1
				}, 8, ["widgets", "grid"]), createVNode(WidgetLibrary_default, {
					catalog: unref(NGX_CARD_CATALOG),
					onAdd
				}, null, 8, ["catalog"])]),
				createVNode(NgxCardSettingsDialog_default, {
					modelValue: settingsVisible.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => settingsVisible.value = $event),
					widget: editingWidget.value,
					onSave: onSettingsSave
				}, null, 8, ["modelValue", "widget"]),
				createVNode(unref(component), {
					modelValue: embedVisible.value,
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => embedVisible.value = $event),
					title: "嵌入到其他系统",
					width: "680px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), {
						type: "primary",
						"data-testid": "ngl-btn-embed-close",
						onClick: _cache[3] || (_cache[3] = ($event) => embedVisible.value = false)
					}, {
						default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("关闭", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_6$1, [
						_cache[14] || (_cache[14] = createBaseVNode("div", { class: "ngl-embed-hint" }, " 下面链接免登录只读访问本看板，可直接 iframe 嵌入任意系统；令牌泄露可在下方重新生成（旧链接立即失效）。 ", -1)),
						createBaseVNode("div", _hoisted_7$1, [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "ngl-embed-label" }, "嵌入链接", -1)), createBaseVNode("div", _hoisted_8$1, [createBaseVNode("input", {
							class: "ngl-embed-input",
							"data-testid": "ngl-embed-url",
							value: embedUrl.value,
							readonly: "",
							onFocus: selectText
						}, null, 40, _hoisted_9$1), createVNode(unref(ReButton_default), {
							"data-testid": "ngl-btn-copy-url",
							onClick: _cache[1] || (_cache[1] = ($event) => copyText(embedUrl.value, "链接"))
						}, {
							default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("复制", -1)])]),
							_: 1
						})])]),
						createBaseVNode("div", _hoisted_10$1, [_cache[12] || (_cache[12] = createBaseVNode("div", { class: "ngl-embed-label" }, "iframe 片段", -1)), createBaseVNode("div", _hoisted_11$1, [createBaseVNode("input", {
							class: "ngl-embed-input",
							"data-testid": "ngl-embed-snippet",
							value: iframeSnippet.value,
							readonly: "",
							onFocus: selectText
						}, null, 40, _hoisted_12$1), createVNode(unref(ReButton_default), {
							"data-testid": "ngl-btn-copy-snippet",
							onClick: _cache[2] || (_cache[2] = ($event) => copyText(iframeSnippet.value, "iframe 片段"))
						}, {
							default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("复制", -1)])]),
							_: 1
						})])]),
						createBaseVNode("div", _hoisted_13$1, [createBaseVNode("span", _hoisted_14, "令牌：" + toDisplayString(embedToken.value || "保存看板后自动生成"), 1), createVNode(unref(ReButton_default), {
							loading: regenerating.value,
							"data-testid": "ngl-btn-regenerate",
							onClick: regenerate
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "RefreshRight",
								size: 13
							})]),
							default: withCtx(() => [_cache[13] || (_cache[13] = createTextVNode(" 重新生成令牌 ", -1))]),
							_: 1
						}, 8, ["loading"])])
					])]),
					_: 1
				}, 8, ["modelValue"])
			]);
		};
	}
}), [["__scopeId", "data-v-63d895d7"]]);
//#endregion
//#region ../../pages/datasource/src/views/console/NginxManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm tel-page" };
var _hoisted_2 = { class: "dsm-toolbar re-surface" };
var _hoisted_3 = { class: "dsm-toolbar-left" };
var _hoisted_4 = {
	key: 0,
	class: "ngm-meta"
};
var _hoisted_5 = { class: "dsm-toolbar-right" };
var _hoisted_6 = {
	class: "dsm-seg ngm-mode",
	role: "group",
	"aria-label": "使用模式"
};
var _hoisted_7 = { class: "dsm-db-select" };
var _hoisted_8 = { class: "ngm-guide-body" };
var _hoisted_9 = {
	key: 2,
	class: "dsm-body"
};
var _hoisted_10 = { class: "dsm-sidebar ngm-nav" };
var _hoisted_11 = { class: "ngm-nav-list" };
var _hoisted_12 = ["onClick"];
var _hoisted_13 = { class: "ngm-main" };
//#endregion
//#region ../../pages/datasource/src/views/console/NginxManageView.vue
var NginxManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NginxManageView",
	setup(__props) {
		const { datasourceId, source, gap, bind, ready } = useMiddlewareSource();
		/** 使用模式：新人模式会打开中文说明、引导条，并把默认页签落在模板库 */
		const mode = ref("standard");
		const isNewbie = computed(() => mode.value === "newbie");
		/** 左侧菜单条目 */
		const tabs = computed(() => [
			{
				name: "overview",
				label: "总览",
				icon: "HomeFilled"
			},
			{
				name: "site",
				label: "站点",
				icon: "Link"
			},
			{
				name: "config",
				label: "配置",
				icon: "Tools"
			},
			{
				name: "log",
				label: "日志",
				icon: "Document"
			},
			{
				name: "backup",
				label: "备份",
				icon: "Files"
			},
			{
				name: "template",
				label: "模板库",
				icon: "Grid"
			},
			{
				name: "layout",
				label: "自定义布局",
				icon: "DataBoard"
			}
		]);
		const activeTab = ref("overview");
		const sources = ref([]);
		const overview = ref(null);
		const overviewLoading = ref(false);
		/** 总览加载失败原因；非空时面板显示错误而不是「一切正常」 */
		const overviewError = ref("");
		const configPanel = ref(null);
		/** 从站点页签跳转过来时要定位的节点；由 NginxConfigPanel 消费后清空 */
		const focusNodePath = ref(null);
		/**
		* 顶栏状态文案。
		*
		* <p>必须把「还没取到」「取失败了」「取到了但状态字段为空」分成三态。
		* 早先只判 RUNNING / STOPPED，剩下全回落成「状态未知」，于是首屏加载的那一秒
		* 也显示「状态未知」——和「nginx 真的停了」视觉上完全一样，排查时极易误判。
		* 加载中显示「加载中」，取失败显示「未取到数据」，都带各自的语义色。</p>
		*/
		const statusText = computed(() => {
			const r = overview.value?.running;
			if (r === "RUNNING") return "运行中";
			if (r === "STOPPED") return "已停止";
			if (overviewError.value) return "未取到数据";
			if (overviewLoading.value && !overview.value) return "加载中";
			return "状态未知";
		});
		const stateClass = computed(() => {
			const r = overview.value?.running;
			if (r === "RUNNING") return "is-running";
			if (r === "STOPPED") return "is-stopped";
			if (overviewError.value) return "is-error";
			if (overviewLoading.value && !overview.value) return "is-loading";
			return "is-unknown";
		});
		/** 版本 / PID / 运行时长，拼成一行元信息并进顶栏 */
		const metaText = computed(() => {
			const o = overview.value;
			if (!o) return "";
			const parts = [];
			if (o.version?.version) parts.push(o.version.version);
			if (o.masterPid) parts.push(`PID ${o.masterPid}`);
			if (o.uptimeText) parts.push(`已运行 ${o.uptimeText}`);
			return parts.join(" · ");
		});
		/** 实例接入点，形如 host:port，供总览 Hero 的「监听地址」使用 */
		const endpointText = computed(() => {
			const s = source.value;
			if (!s) return "";
			return `${s.host}:${s.port || 22}`;
		});
		/** 跳到配置页签并定位到指定站点 */
		async function onEditSite(site) {
			focusNodePath.value = site.nodePath;
			activeTab.value = "config";
			await nextTick();
			await configPanel.value?.openFile(site.file);
		}
		async function onSwitchSource(id) {
			datasourceId.value = id;
			overview.value = null;
			await bind("nginx");
			if (datasourceId.value) await reloadOverview();
		}
		async function onGapRetry() {
			await bind("nginx");
			if (datasourceId.value) await reloadOverview();
		}
		async function reloadOverview() {
			if (!datasourceId.value) return;
			overviewLoading.value = true;
			overviewError.value = "";
			try {
				overview.value = await fetchNginxOverview(datasourceId.value);
				ready();
			} catch (e) {
				overviewError.value = e?.message || String(e);
				overview.value = null;
				console.error("[nginx] 总览加载失败", datasourceId.value, e);
				message.error(`总览加载失败：${overviewError.value}`);
			} finally {
				overviewLoading.value = false;
			}
		}
		function onLifecycleChanged() {
			reloadOverview();
		}
		function onTemplateSaved() {
			reloadOverview();
			activeTab.value = "config";
		}
		function goTab(name) {
			activeTab.value = name;
		}
		watch(mode, (m) => {
			activeTab.value = m === "newbie" ? "template" : "overview";
		});
		onMounted(async () => {
			try {
				sources.value = await fetchNginxSources() || [];
			} catch {}
			await bind("nginx");
			if (datasourceId.value) await reloadOverview();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
					createVNode(unref(component$1), {
						name: "Connection",
						size: 18,
						class: "dsm-title-icon dsm-nginx-icon"
					}),
					_cache[6] || (_cache[6] = createBaseVNode("span", { class: "dsm-title" }, "Nginx 服务管理", -1)),
					createBaseVNode("span", { class: normalizeClass(["ngm-state", stateClass.value]) }, [_cache[5] || (_cache[5] = createBaseVNode("i", { class: "ngm-state-dot" }, null, -1)), createTextVNode(" " + toDisplayString(statusText.value), 1)], 2),
					metaText.value ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(metaText.value), 1)) : createCommentVNode("", true)
				]), createBaseVNode("div", _hoisted_5, [
					createBaseVNode("div", _hoisted_6, [createBaseVNode("button", {
						type: "button",
						"data-testid": "ngm-mode-standard",
						class: normalizeClass({ "is-active": mode.value === "standard" }),
						onClick: _cache[0] || (_cache[0] = ($event) => mode.value = "standard")
					}, " 标准 ", 2), createBaseVNode("button", {
						type: "button",
						"data-testid": "ngm-mode-newbie",
						class: normalizeClass({ "is-active": mode.value === "newbie" }),
						onClick: _cache[1] || (_cache[1] = ($event) => mode.value = "newbie")
					}, " 新人 ", 2)]),
					createBaseVNode("div", _hoisted_7, [createVNode(unref(ReSelect_default), {
						"model-value": unref(datasourceId),
						placeholder: "选择实例",
						onChange: onSwitchSource
					}, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(sources.value, (d) => {
							return openBlock(), createBlock(unref(ReOption), {
								key: d.id,
								value: d.id,
								label: d.name || `${d.host}:${d.port || 22}`
							}, null, 8, ["value", "label"]);
						}), 128))]),
						_: 1
					}, 8, ["model-value"])]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新",
						"data-testid": "ngm-btn-refresh",
						loading: overviewLoading.value,
						onClick: reloadOverview
					}, null, 8, ["loading"]),
					createVNode(NginxLifecycleBar_default, {
						"datasource-id": unref(datasourceId),
						running: overview.value?.running,
						onChanged: onLifecycleChanged
					}, null, 8, ["datasource-id", "running"])
				])]),
				isNewbie.value ? (openBlock(), createBlock(unref(ReAlert), {
					key: 0,
					type: "success",
					class: "ngm-guide"
				}, {
					title: withCtx(() => [createBaseVNode("div", _hoisted_8, [createBaseVNode("div", null, [
						_cache[7] || (_cache[7] = createBaseVNode("strong", null, "第一次用？", -1)),
						_cache[8] || (_cache[8] = createTextVNode(" 建议按这个顺序： ", -1)),
						createBaseVNode("a", {
							class: "ngm-link",
							onClick: _cache[2] || (_cache[2] = ($event) => goTab("template"))
						}, "① 挑模板生成配置"),
						_cache[9] || (_cache[9] = createTextVNode(" → ", -1)),
						createBaseVNode("a", {
							class: "ngm-link",
							onClick: _cache[3] || (_cache[3] = ($event) => goTab("config"))
						}, "② 在表单模式里微调"),
						_cache[10] || (_cache[10] = createTextVNode(" → ", -1)),
						createBaseVNode("a", {
							class: "ngm-link",
							onClick: _cache[4] || (_cache[4] = ($event) => goTab("overview"))
						}, "③ 看总览确认状态"),
						_cache[11] || (_cache[11] = createTextVNode(" → 点顶部「重载」生效。 ", -1))
					]), _cache[12] || (_cache[12] = createBaseVNode("div", { class: "ngm-guide-sub" }, " 任何一步不确定，都可以先点「校验配置」——它只做语法检查，不会动正在跑的服务。 ", -1))])]),
					_: 1
				})) : createCommentVNode("", true),
				unref(gap) ? (openBlock(), createBlock(MiddlewareGap_default, {
					key: 1,
					text: unref(gap),
					onRetry: onGapRetry
				}, null, 8, ["text"])) : (openBlock(), createElementBlock("div", _hoisted_9, [createBaseVNode("aside", _hoisted_10, [_cache[13] || (_cache[13] = createBaseVNode("div", { class: "dsm-view-bar" }, [createBaseVNode("span", { class: "ngm-nav-title" }, "NGINX 控制台")], -1)), createBaseVNode("div", _hoisted_11, [(openBlock(true), createElementBlock(Fragment, null, renderList(tabs.value, (t) => {
					return openBlock(), createElementBlock("button", {
						key: t.name,
						class: normalizeClass(["ngm-nav-item", { active: activeTab.value === t.name }]),
						type: "button",
						onClick: ($event) => goTab(t.name)
					}, [createVNode(unref(component$1), {
						name: t.icon,
						size: 14,
						class: "ngm-nav-icon"
					}, null, 8, ["name"]), createBaseVNode("span", null, toDisplayString(t.label), 1)], 10, _hoisted_12);
				}), 128))])]), createBaseVNode("section", _hoisted_13, [activeTab.value === "overview" ? (openBlock(), createBlock(NginxOverviewPanel_default, {
					key: 0,
					loading: overviewLoading.value,
					"datasource-id": unref(datasourceId),
					overview: overview.value,
					"load-error": overviewError.value,
					endpoint: endpointText.value,
					onChanged: reloadOverview
				}, null, 8, [
					"loading",
					"datasource-id",
					"overview",
					"load-error",
					"endpoint"
				])) : activeTab.value === "site" ? (openBlock(), createBlock(NginxSitePanel_default, {
					key: 1,
					"datasource-id": unref(datasourceId),
					onEdit: onEditSite
				}, null, 8, ["datasource-id"])) : activeTab.value === "config" ? (openBlock(), createBlock(NginxConfigPanel_default, {
					key: 2,
					ref_key: "configPanel",
					ref: configPanel,
					"datasource-id": unref(datasourceId),
					newbie: isNewbie.value,
					"focus-node-path": focusNodePath.value,
					onChanged: reloadOverview
				}, null, 8, [
					"datasource-id",
					"newbie",
					"focus-node-path"
				])) : activeTab.value === "log" ? (openBlock(), createBlock(NginxLogPanel_default, {
					key: 3,
					"datasource-id": unref(datasourceId)
				}, null, 8, ["datasource-id"])) : activeTab.value === "backup" ? (openBlock(), createBlock(NginxBackupPanel_default, {
					key: 4,
					"datasource-id": unref(datasourceId),
					onChanged: reloadOverview
				}, null, 8, ["datasource-id"])) : activeTab.value === "template" ? (openBlock(), createBlock(NginxTemplatePanel_default, {
					key: 5,
					"datasource-id": unref(datasourceId),
					onSaved: onTemplateSaved
				}, null, 8, ["datasource-id"])) : activeTab.value === "layout" ? (openBlock(), createBlock(NgxLayoutPanel_default, {
					key: 6,
					"datasource-id": unref(datasourceId)
				}, null, 8, ["datasource-id"])) : createCommentVNode("", true)])]))
			]);
		};
	}
}), [["__scopeId", "data-v-ce6e3b29"]]);
//#endregion
export { NginxManageView_default as default };
