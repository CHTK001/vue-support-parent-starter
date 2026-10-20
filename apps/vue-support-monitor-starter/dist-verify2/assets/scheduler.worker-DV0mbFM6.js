(function() {
	//#region ../../packages/work/src/scheduler/scheduler.worker.ts
	/**
	* 调度器 Worker —— 独立线程周期任务
	*
	* 同时兼容 Web Worker 与 Service Worker 两种上下文：
	*  - Web Worker：主线程 postMessage 下发 start/stop，到点 postMessage 回传 tick。
	*  - Service Worker：除 postMessage 外，还通过 clients 向所有受控页面广播 tick，
	*    使后台刷新对页面可见。
	*
	* 消息协议：
	*   主线程 → Worker：{ type: "start", interval } | { type: "stop" }
	*   Worker → 主线程：{ type: "tick" }
	*/
	const ctx = self;
	let timer = null;
	/** 向受控客户端广播（Service Worker 用；Web Worker 下无 clients，直接 postMessage） */
	function notifyTick() {
		if (typeof self.clients !== "undefined") {
			self.clients.matchAll({
				type: "window",
				includeUncontrolled: true
			}).then((clientList) => {
				clientList.forEach((client) => client.postMessage({ type: "tick" }));
			});
			return;
		}
		ctx.postMessage({ type: "tick" });
	}
	function start(interval) {
		if (timer) clearInterval(timer);
		const safe = Math.max(1e3, Number(interval) || 36e5);
		timer = setInterval(notifyTick, safe);
	}
	function stop() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}
	/** 处理来自主线程的消息（Web Worker 与 Service Worker 共用协议） */
	function handleMessage(raw) {
		const msg = raw;
		if (!msg || typeof msg !== "object") return;
		if (msg.type === "start") start(msg.interval ?? 0);
		else if (msg.type === "stop") stop();
	}
	const swScope = self;
	if (typeof swScope.clients !== "undefined") {
		swScope.addEventListener("message", (event) => {
			handleMessage(event.data);
		});
		swScope.postMessage({ type: "ready" });
	} else {
		self.addEventListener("message", (event) => {
			handleMessage(event instanceof MessageEvent ? event.data : void 0);
		});
		self.postMessage({ type: "ready" });
	}
	//#endregion
})();
