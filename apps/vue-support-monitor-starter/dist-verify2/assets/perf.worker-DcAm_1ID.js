(function() {
	//#region ../../packages/theme/src/themes/koi/layouts/components/ThemeConfig/components/perf.worker.ts
	let fpsCount = 0;
	let lastFpsTime = 0;
	let fpsValue = 0;
	addEventListener("message", (e) => {
		const msg = e.data;
		if (msg.type === "tick") {
			fpsCount++;
			const now = performance.now();
			if (now - lastFpsTime >= 1e3) {
				fpsValue = Math.round(fpsCount * 1e3 / (now - lastFpsTime));
				fpsCount = 0;
				lastFpsTime = now;
				postMessage({
					type: "fps",
					value: fpsValue
				});
			}
		} else if (msg.type === "memory") postMessage({
			type: "memory",
			used: msg.used,
			total: msg.total
		});
		else if (msg.type === "cpu") postMessage({
			type: "cpu",
			value: msg.value
		});
		else if (msg.type === "battery") postMessage({
			type: "battery",
			level: msg.level,
			charging: msg.charging
		});
		else if (msg.type === "bluetooth") postMessage({
			type: "bluetooth",
			available: msg.available
		});
		else if (msg.type === "screen") postMessage({
			type: "screen",
			w: msg.w,
			h: msg.h
		});
		else if (msg.type === "heartbeat") postMessage({ type: "ping" });
	});
	//#endregion
})();
