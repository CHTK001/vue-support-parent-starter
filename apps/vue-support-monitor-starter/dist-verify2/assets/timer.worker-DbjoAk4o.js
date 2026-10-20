(function() {
	//#region ../../packages/work/src/timer/timer.worker.ts
	/** 最大时区数量（需求约束：最多三个） */
	const MAX_ZONES = 3;
	/** 每秒推送一次 */
	const TICK_INTERVAL_MS = 1e3;
	/** 中文星期 */
	const WEEKDAY_CN = [
		"日",
		"一",
		"二",
		"三",
		"四",
		"五",
		"六"
	];
	/** 当前生效的时区偏移列表 */
	let zones = [];
	/** 定时器句柄 */
	let timer = null;
	/** 数字补零 */
	function pad(n) {
		return String(n).padStart(2, "0");
	}
	/** 计算单个时区当前时间（基于 Date.now + 偏移换算，时区无关） */
	function buildZone(offset) {
		const utcMs = Date.now() + offset * 36e5;
		const d = new Date(utcMs);
		return {
			offset,
			label: `UTC${offset > 0 ? "+" : ""}${offset}`,
			time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
			date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
			weekday: `星期${WEEKDAY_CN[d.getUTCDay()]}`
		};
	}
	/** 广播当前各时区时间 */
	function broadcast() {
		const tick = {
			timestamp: Date.now(),
			zones: zones.map(buildZone)
		};
		self.postMessage(tick);
	}
	/** 启动/重启定时推送（start / update 共用） */
	function startTicking(nextZones) {
		const seen = /* @__PURE__ */ new Set();
		zones = nextZones.filter((z) => Number.isInteger(z) && z >= -12 && z <= 12 && !seen.has(z) && seen.add(z)).slice(0, MAX_ZONES);
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		broadcast();
		timer = setInterval(broadcast, TICK_INTERVAL_MS);
	}
	/** 停止推送并清空时区 */
	function stopTicking() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		zones = [];
	}
	self.onmessage = (event) => {
		const { type, zones: nextZones } = event.data ?? {};
		if (type === "start" || type === "update") startTicking(Array.isArray(nextZones) ? nextZones : []);
		else if (type === "stop") stopTicking();
	};
	//#endregion
})();
