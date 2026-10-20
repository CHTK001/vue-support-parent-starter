import { gn as reactive } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { g as getGlobalSocketService } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
//#region src/utils/processTasks.ts
/**
* 全局过程任务管理（project 模块）
*
* 业务侧触发项目操作/软件安装拿到 taskId 后调用 {@link trackTask} 注册跟踪：
* - 订阅 socket（module=project, event=task）实时更新步骤/进度/日志/结果
* - 立即拉一次任务快照（GET /ms/server/release/task/{taskId}）实现断点续传
*
* 任务以浮层 ReProcessTask 展示（可拖拽、最小化到四角）。
*
* @author CH
* @since 4.0.0.42
*/
/**
* 单任务保留日志上限
*/
var MAX_LOGS = 800;
/**
* 任务列表（全局单例）
*
* 注意：本模块同时被「主入口静态导入（ProcessHost）」与「路由异步 chunk
* （ProjectsView）」引用，dev / 构建的不同模块图可能把本模块实例化两次。
* 因此把状态数组挂到 globalThis 上做去重，确保任何实例拿到的都是同一个数组，
* 避免 trackTask 写入与 ProcessHost 渲染指向不同对象。
*/
var g = globalThis;
var tasks = g.__PROCESS_TASKS__ ?? (g.__PROCESS_TASKS__ = reactive([]));
/**
* socket 是否已经绑定（同样挂 globalThis 去重，防止多实例重复 subscribe）
*/
function isSocketBound() {
	return !!g.__PROCESS_SOCKET_BOUND__;
}
function markSocketBound() {
	g.__PROCESS_SOCKET_BOUND__ = true;
}
/**
* 绑定 socket 任务事件（全局仅一次）
*/
function bindSocket() {
	if (isSocketBound()) return;
	const socket = getGlobalSocketService();
	if (!socket) return;
	markSocketBound();
	socket.subscribe("project", "task", (msg) => {
		const data = msg?.data ?? msg;
		const task = tasks.find((t) => t.taskId === data?.taskId);
		if (task) {
			applyMessage(task, data);
			if (task.finished) clearCatchUp(task);
			else scheduleCatchUp(task);
		}
	});
	(socket?.socket)?.on?.("connect", () => {
		tasks.forEach((t) => {
			if (!t.finished) {
				fetchSnapshot(t);
				scheduleCatchUp(t);
			}
		});
	});
}
/**
* 取消某任务的一次性兜底定时器
*/
function clearCatchUp(task) {
	const handle = catchUpTimers.get(task.taskId);
	if (handle !== void 0) {
		clearTimeout(handle);
		catchUpTimers.delete(task.taskId);
	}
}
/**
* 安排一次性兜底快照拉取（由 socket 帧 / 连接事件触发，非定时轮询）
*/
function scheduleCatchUp(task) {
	clearCatchUp(task);
	const handle = setTimeout(() => {
		catchUpTimers.delete(task.taskId);
		if (!task.finished) fetchSnapshot(task);
	}, CATCH_UP_DELAY_MS);
	catchUpTimers.set(task.taskId, handle);
}
/** 一次性兜底等待（毫秒）：略大于远端单步常见间隔 */
var CATCH_UP_DELAY_MS = 1500;
/** 任务一次性兜底定时器句柄 */
var catchUpTimers = /* @__PURE__ */ new Map();
/**
* 应用一帧 socket 消息
*/
function applyMessage(task, data) {
	if (typeof data.phase === "string") task.phase = data.phase;
	if (data.currentStep) task.currentStep = data.currentStep;
	if (typeof data.progress === "number") task.progress = data.progress;
	if (data.phase === "LOG" && typeof data.line === "string") appendLog(task, data.line);
	if (data.phase === "COMPLETE") {
		task.finished = true;
		task.success = true;
		task.progress = 100;
		task.currentStep = "完成";
		task.message = data.message || "操作成功";
	}
	if (data.phase === "ERROR") {
		task.finished = true;
		task.success = false;
		task.message = data.message || "执行失败";
	}
}
/**
* 追加日志（限制上限）
*/
function appendLog(task, line) {
	task.logs.push(line);
	if (task.logs.length > MAX_LOGS) task.logs.splice(0, task.logs.length - MAX_LOGS);
}
/**
* 拉取任务快照（断点续传）
*/
async function fetchSnapshot(task) {
	try {
		const res = await http().get(`/ms/server/release/task/${encodeURIComponent(task.taskId)}`);
		const snap = unwrapResult(res);
		if (!snap) return;
		if (typeof snap.phase === "string") task.phase = snap.phase;
		if (snap.currentStep) task.currentStep = snap.currentStep;
		if (typeof snap.progress === "number") task.progress = snap.progress;
		if (Array.isArray(snap.logs)) task.logs.splice(0, task.logs.length, ...snap.logs.slice(-800));
		task.finished = !!snap.finished;
		task.success = !!snap.success;
		if (snap.message) task.message = snap.message;
		if (task.finished) clearCatchUp(task);
	} catch {}
}
/**
* 注册并跟踪一个任务
*
* @param taskId 任务ID
* @param title   任务标题
* @param operation 操作类型
* @returns 任务状态对象
*/
function trackTask(taskId, title, operation) {
	bindSocket();
	let task = tasks.find((t) => t.taskId === taskId);
	if (!task) {
		task = reactive({
			taskId,
			title,
			operation,
			phase: "START",
			currentStep: "准备中",
			progress: 0,
			logs: [],
			finished: false,
			success: false,
			message: "",
			minimized: false,
			x: null,
			y: null,
			startedAt: Date.now()
		});
		tasks.push(task);
	}
	fetchSnapshot(task);
	scheduleCatchUp(task);
	return task;
}
/**
* 移除任务
*/
function removeTask(taskId) {
	clearCatchUp({ taskId });
	const index = tasks.findIndex((t) => t.taskId === taskId);
	if (index >= 0) tasks.splice(index, 1);
}
/**
* 获取全部任务
*/
function getProcessTasks() {
	return tasks;
}
//#endregion
export { removeTask as n, trackTask as r, getProcessTasks as t };
