(function() {
	//#region ../../packages/theme/src/themes/koi/views/home/widgets/alarm.worker.ts
	let alarms = [];
	let ticker = 0;
	let lastMinuteKey = "";
	let firedCounts = {};
	let totalFired = {};
	addEventListener("message", (e) => {
		const msg = e.data;
		if (msg.type === "sync") {
			alarms = msg.list ?? [];
			firedCounts = {};
			for (const a of alarms) if (totalFired[a.id] === void 0 && a.firedCount && a.firedCount > 0) totalFired[a.id] = a.firedCount;
		} else if (msg.type === "start") ticker = setInterval(() => {
			const now = /* @__PURE__ */ new Date();
			const h = now.getHours();
			const m = now.getMinutes();
			const dow = now.getDay();
			const isWeekday = dow >= 1 && dow <= 5;
			const sec = now.getSeconds();
			const minuteKey = h + ":" + m;
			if (minuteKey !== lastMinuteKey) {
				lastMinuteKey = minuteKey;
				firedCounts = {};
			}
			for (const a of alarms) {
				if (!a.enabled) continue;
				if (a.hour !== h || a.minute !== m) continue;
				if (a.repeat === "weekday" && !isWeekday) continue;
				if (a.repeat === "once" && a.fired) continue;
				if (sec % 10 !== 0) continue;
				const times = a.repeatCount || 1;
				const count = firedCounts[a.id] ?? 0;
				if (count >= times) continue;
				firedCounts[a.id] = count + 1;
				const total = (totalFired[a.id] ?? 0) + 1;
				totalFired[a.id] = total;
				if (a.repeat === "once") {
					alarms = alarms.filter((x) => x.id !== a.id);
					postMessage({
						type: "delete",
						id: a.id,
						firedCount: total
					});
				} else if (times > 0 && total >= times) {
					const idx = alarms.findIndex((x) => x.id === a.id);
					if (idx >= 0) alarms[idx] = {
						...alarms[idx],
						enabled: false
					};
					postMessage({
						type: "disable",
						id: a.id,
						firedCount: total
					});
				} else postMessage({
					type: "fire",
					id: a.id,
					title: a.title,
					hour: a.hour,
					minute: a.minute,
					firedCount: total
				});
			}
		}, 1e3);
		else if (msg.type === "stop") {
			if (ticker) {
				clearInterval(ticker);
				ticker = 0;
			}
		}
	});
	//#endregion
})();
