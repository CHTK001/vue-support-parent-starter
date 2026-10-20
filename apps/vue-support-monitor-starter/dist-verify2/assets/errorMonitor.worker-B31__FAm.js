(function() {
	//#region ../../packages/core/src/monitor/errorMonitor.worker.ts
	/** 默认去重窗口（毫秒，60s 内同错误记一次） */
	const DEFAULT_DEDUP_WINDOW = 6e4;
	/** 默认批量节流间隔（毫秒） */
	const DEFAULT_REPORT_INTERVAL = 5e3;
	/** 默认单批上限 */
	const DEFAULT_BATCH_SIZE = 20;
	/** 默认采样率（1=全量） */
	const DEFAULT_SAMPLE_RATE = 1;
	/** 默认缓冲上限（超出丢弃最旧） */
	const DEFAULT_MAX_BUFFER = 200;
	/** 当前生效配置（未 start 时用默认值兜底） */
	let options = {
		batchSize: DEFAULT_BATCH_SIZE,
		reportInterval: DEFAULT_REPORT_INTERVAL,
		dedupWindow: DEFAULT_DEDUP_WINDOW,
		sampleRate: DEFAULT_SAMPLE_RATE,
		maxBuffer: DEFAULT_MAX_BUFFER
	};
	/** 缓冲队列（首批在前，超出 maxBuffer 丢弃最旧） */
	let buffer = [];
	/** 去重索引：指纹 → { 记录下标, 首次时间 } */
	const dedupIndex = /* @__PURE__ */ new Map();
	/** 节流定时器 */
	let flushTimer = null;
	/** 重置配置与缓冲（start 重新下发时调用） */
	function resetState() {
		buffer = [];
		dedupIndex.clear();
		if (flushTimer) {
			clearTimeout(flushTimer);
			flushTimer = null;
		}
	}
	/** 采样：返回是否保留该条 */
	function sample() {
		return options.sampleRate >= 1 || Math.random() < options.sampleRate;
	}
	/** 计算节流等待：距该条最早记录的时间差（保证窗口内至少停留 dedupWindow/2） */
	function nextFlushDelay() {
		const first = buffer.length > 0 ? buffer[0].firstAt : Date.now();
		const elapsed = Date.now() - first;
		const minWait = Math.min(options.reportInterval, options.dedupWindow / 2);
		return Math.max(0, minWait - elapsed);
	}
	/** 排定节流定时器（幂等） */
	function scheduleFlush(delay = options.reportInterval) {
		if (flushTimer) return;
		flushTimer = setTimeout(() => {
			flushTimer = null;
			flushBatch();
		}, delay);
	}
	/** 批量回传主线程并清空缓冲 */
	function flushBatch() {
		if (buffer.length === 0) return;
		const records = buffer;
		buffer = [];
		dedupIndex.clear();
		const response = {
			type: "batch",
			records
		};
		self.postMessage(response);
	}
	/** 接收一条异常记录：去重 → 采样 → 缓冲 → 触发批量 */
	function pushRecord(record) {
		if (!sample()) return;
		const now = Date.now();
		const dup = dedupIndex.get(record.key);
		if (dup) {
			const existing = buffer[dup.index];
			if (existing && now - dup.firstAt <= options.dedupWindow) {
				existing.count += 1;
				existing.firstAt = dup.firstAt;
				return;
			}
			dedupIndex.delete(record.key);
		}
		if (buffer.length >= options.maxBuffer) {
			const dropped = buffer.shift();
			if (dropped) dedupIndex.delete(dropped.key);
		}
		const fresh = {
			...record,
			firstAt: now,
			count: 1
		};
		buffer.push(fresh);
		dedupIndex.set(record.key, {
			index: buffer.length - 1,
			firstAt: now
		});
		if (buffer.length >= options.batchSize) {
			if (flushTimer) {
				clearTimeout(flushTimer);
				flushTimer = null;
			}
			flushBatch();
		} else scheduleFlush(nextFlushDelay());
	}
	self.onmessage = (event) => {
		const msg = event.data ?? {};
		if (msg.type === "start") {
			resetState();
			options = {
				batchSize: msg.config.batchSize ?? DEFAULT_BATCH_SIZE,
				reportInterval: msg.config.reportInterval ?? DEFAULT_REPORT_INTERVAL,
				dedupWindow: msg.config.dedupWindow ?? DEFAULT_DEDUP_WINDOW,
				sampleRate: msg.config.sampleRate ?? DEFAULT_SAMPLE_RATE,
				maxBuffer: msg.config.maxBuffer ?? DEFAULT_MAX_BUFFER
			};
		} else if (msg.type === "report" && msg.record) pushRecord(msg.record);
		else if (msg.type === "flush") {
			if (flushTimer) {
				clearTimeout(flushTimer);
				flushTimer = null;
			}
			flushBatch();
		}
	};
	//#endregion
})();
