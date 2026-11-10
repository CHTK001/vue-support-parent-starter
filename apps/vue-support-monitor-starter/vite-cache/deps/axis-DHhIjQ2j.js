import { c as bisector, i as copy, o as tickStep, r as continuous } from "./linear-YP6PDw8s.js";
import { t as initRange } from "./init-CgYecCqF.js";
import { A as timeSunday, B as durationMinute, E as utcYear, F as timeDay, G as timeInterval, H as durationSecond, I as unixDay, P as utcSunday, R as durationDay, T as timeYear, U as durationWeek, V as durationMonth, W as durationYear, x as timeFormat, z as durationHour } from "./src-Bz438YRs.js";
//#region ../../node_modules/.pnpm/d3-scale@4.0.2/node_modules/d3-scale/src/nice.js
function nice(domain, interval) {
	domain = domain.slice();
	var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], t;
	if (x1 < x0) {
		t = i0, i0 = i1, i1 = t;
		t = x0, x0 = x1, x1 = t;
	}
	domain[i0] = interval.floor(x0);
	domain[i1] = interval.ceil(x1);
	return domain;
}
//#endregion
//#region ../../node_modules/.pnpm/d3-time@3.1.0/node_modules/d3-time/src/millisecond.js
var millisecond = timeInterval(() => {}, (date, step) => {
	date.setTime(+date + step);
}, (start, end) => {
	return end - start;
});
millisecond.every = (k) => {
	k = Math.floor(k);
	if (!isFinite(k) || !(k > 0)) return null;
	if (!(k > 1)) return millisecond;
	return timeInterval((date) => {
		date.setTime(Math.floor(date / k) * k);
	}, (date, step) => {
		date.setTime(+date + step * k);
	}, (start, end) => {
		return (end - start) / k;
	});
};
millisecond.range;
//#endregion
//#region ../../node_modules/.pnpm/d3-time@3.1.0/node_modules/d3-time/src/second.js
var second = timeInterval((date) => {
	date.setTime(date - date.getMilliseconds());
}, (date, step) => {
	date.setTime(+date + step * durationSecond);
}, (start, end) => {
	return (end - start) / durationSecond;
}, (date) => {
	return date.getUTCSeconds();
});
second.range;
//#endregion
//#region ../../node_modules/.pnpm/d3-time@3.1.0/node_modules/d3-time/src/minute.js
var timeMinute = timeInterval((date) => {
	date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
}, (date, step) => {
	date.setTime(+date + step * durationMinute);
}, (start, end) => {
	return (end - start) / durationMinute;
}, (date) => {
	return date.getMinutes();
});
timeMinute.range;
var utcMinute = timeInterval((date) => {
	date.setUTCSeconds(0, 0);
}, (date, step) => {
	date.setTime(+date + step * durationMinute);
}, (start, end) => {
	return (end - start) / durationMinute;
}, (date) => {
	return date.getUTCMinutes();
});
utcMinute.range;
//#endregion
//#region ../../node_modules/.pnpm/d3-time@3.1.0/node_modules/d3-time/src/hour.js
var timeHour = timeInterval((date) => {
	date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
}, (date, step) => {
	date.setTime(+date + step * durationHour);
}, (start, end) => {
	return (end - start) / durationHour;
}, (date) => {
	return date.getHours();
});
timeHour.range;
var utcHour = timeInterval((date) => {
	date.setUTCMinutes(0, 0, 0);
}, (date, step) => {
	date.setTime(+date + step * durationHour);
}, (start, end) => {
	return (end - start) / durationHour;
}, (date) => {
	return date.getUTCHours();
});
utcHour.range;
//#endregion
//#region ../../node_modules/.pnpm/d3-time@3.1.0/node_modules/d3-time/src/month.js
var timeMonth = timeInterval((date) => {
	date.setDate(1);
	date.setHours(0, 0, 0, 0);
}, (date, step) => {
	date.setMonth(date.getMonth() + step);
}, (start, end) => {
	return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, (date) => {
	return date.getMonth();
});
timeMonth.range;
var utcMonth = timeInterval((date) => {
	date.setUTCDate(1);
	date.setUTCHours(0, 0, 0, 0);
}, (date, step) => {
	date.setUTCMonth(date.getUTCMonth() + step);
}, (start, end) => {
	return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, (date) => {
	return date.getUTCMonth();
});
utcMonth.range;
//#endregion
//#region ../../node_modules/.pnpm/d3-time@3.1.0/node_modules/d3-time/src/ticks.js
function ticker(year, month, week, day, hour, minute) {
	const tickIntervals = [
		[
			second,
			1,
			durationSecond
		],
		[
			second,
			5,
			5 * durationSecond
		],
		[
			second,
			15,
			15 * durationSecond
		],
		[
			second,
			30,
			30 * durationSecond
		],
		[
			minute,
			1,
			durationMinute
		],
		[
			minute,
			5,
			5 * durationMinute
		],
		[
			minute,
			15,
			15 * durationMinute
		],
		[
			minute,
			30,
			30 * durationMinute
		],
		[
			hour,
			1,
			durationHour
		],
		[
			hour,
			3,
			3 * durationHour
		],
		[
			hour,
			6,
			6 * durationHour
		],
		[
			hour,
			12,
			12 * durationHour
		],
		[
			day,
			1,
			durationDay
		],
		[
			day,
			2,
			2 * durationDay
		],
		[
			week,
			1,
			durationWeek
		],
		[
			month,
			1,
			durationMonth
		],
		[
			month,
			3,
			3 * durationMonth
		],
		[
			year,
			1,
			durationYear
		]
	];
	function ticks(start, stop, count) {
		const reverse = stop < start;
		if (reverse) [start, stop] = [stop, start];
		const interval = count && typeof count.range === "function" ? count : tickInterval(start, stop, count);
		const ticks = interval ? interval.range(start, +stop + 1) : [];
		return reverse ? ticks.reverse() : ticks;
	}
	function tickInterval(start, stop, count) {
		const target = Math.abs(stop - start) / count;
		const i = bisector(([, , step]) => step).right(tickIntervals, target);
		if (i === tickIntervals.length) return year.every(tickStep(start / durationYear, stop / durationYear, count));
		if (i === 0) return millisecond.every(Math.max(tickStep(start, stop, count), 1));
		const [t, step] = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
		return t.every(step);
	}
	return [ticks, tickInterval];
}
var [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcSunday, unixDay, utcHour, utcMinute);
var [timeTicks, timeTickInterval] = ticker(timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute);
//#endregion
//#region ../../node_modules/.pnpm/d3-scale@4.0.2/node_modules/d3-scale/src/time.js
function date(t) {
	return new Date(t);
}
function number$1(t) {
	return t instanceof Date ? +t : +/* @__PURE__ */ new Date(+t);
}
function calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format) {
	var scale = continuous(), invert = scale.invert, domain = scale.domain;
	var formatMillisecond = format(".%L"), formatSecond = format(":%S"), formatMinute = format("%I:%M"), formatHour = format("%I %p"), formatDay = format("%a %d"), formatWeek = format("%b %d"), formatMonth = format("%B"), formatYear = format("%Y");
	function tickFormat(date) {
		return (second(date) < date ? formatMillisecond : minute(date) < date ? formatSecond : hour(date) < date ? formatMinute : day(date) < date ? formatHour : month(date) < date ? week(date) < date ? formatDay : formatWeek : year(date) < date ? formatMonth : formatYear)(date);
	}
	scale.invert = function(y) {
		return new Date(invert(y));
	};
	scale.domain = function(_) {
		return arguments.length ? domain(Array.from(_, number$1)) : domain().map(date);
	};
	scale.ticks = function(interval) {
		var d = domain();
		return ticks(d[0], d[d.length - 1], interval == null ? 10 : interval);
	};
	scale.tickFormat = function(count, specifier) {
		return specifier == null ? tickFormat : format(specifier);
	};
	scale.nice = function(interval) {
		var d = domain();
		if (!interval || typeof interval.range !== "function") interval = tickInterval(d[0], d[d.length - 1], interval == null ? 10 : interval);
		return interval ? domain(nice(d, interval)) : scale;
	};
	scale.copy = function() {
		return copy(scale, calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format));
	};
	return scale;
}
function time() {
	return initRange.apply(calendar(timeTicks, timeTickInterval, timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute, second, timeFormat).domain([new Date(2e3, 0, 1), new Date(2e3, 0, 2)]), arguments);
}
//#endregion
//#region ../../node_modules/.pnpm/d3-axis@3.0.0/node_modules/d3-axis/src/identity.js
function identity_default(x) {
	return x;
}
//#endregion
//#region ../../node_modules/.pnpm/d3-axis@3.0.0/node_modules/d3-axis/src/axis.js
var top = 1;
var right = 2;
var bottom = 3;
var left = 4;
var epsilon = 1e-6;
function translateX(x) {
	return "translate(" + x + ",0)";
}
function translateY(y) {
	return "translate(0," + y + ")";
}
function number(scale) {
	return (d) => +scale(d);
}
function center(scale, offset) {
	offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
	if (scale.round()) offset = Math.round(offset);
	return (d) => +scale(d) + offset;
}
function entering() {
	return !this.__axis;
}
function axis(orient, scale) {
	var tickArguments = [], tickValues = null, tickFormat = null, tickSizeInner = 6, tickSizeOuter = 6, tickPadding = 3, offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : .5, k = orient === top || orient === left ? -1 : 1, x = orient === left || orient === right ? "x" : "y", transform = orient === top || orient === bottom ? translateX : translateY;
	function axis(context) {
		var values = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain() : tickValues, format = tickFormat == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity_default : tickFormat, spacing = Math.max(tickSizeInner, 0) + tickPadding, range = scale.range(), range0 = +range[0] + offset, range1 = +range[range.length - 1] + offset, position = (scale.bandwidth ? center : number)(scale.copy(), offset), selection = context.selection ? context.selection() : context, path = selection.selectAll(".domain").data([null]), tick = selection.selectAll(".tick").data(values, scale).order(), tickExit = tick.exit(), tickEnter = tick.enter().append("g").attr("class", "tick"), line = tick.select("line"), text = tick.select("text");
		path = path.merge(path.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "currentColor"));
		tick = tick.merge(tickEnter);
		line = line.merge(tickEnter.append("line").attr("stroke", "currentColor").attr(x + "2", k * tickSizeInner));
		text = text.merge(tickEnter.append("text").attr("fill", "currentColor").attr(x, k * spacing).attr("dy", orient === top ? "0em" : orient === bottom ? "0.71em" : "0.32em"));
		if (context !== selection) {
			path = path.transition(context);
			tick = tick.transition(context);
			line = line.transition(context);
			text = text.transition(context);
			tickExit = tickExit.transition(context).attr("opacity", epsilon).attr("transform", function(d) {
				return isFinite(d = position(d)) ? transform(d + offset) : this.getAttribute("transform");
			});
			tickEnter.attr("opacity", epsilon).attr("transform", function(d) {
				var p = this.parentNode.__axis;
				return transform((p && isFinite(p = p(d)) ? p : position(d)) + offset);
			});
		}
		tickExit.remove();
		path.attr("d", orient === left || orient === right ? tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * tickSizeOuter : "M" + offset + "," + range0 + "V" + range1 : tickSizeOuter ? "M" + range0 + "," + k * tickSizeOuter + "V" + offset + "H" + range1 + "V" + k * tickSizeOuter : "M" + range0 + "," + offset + "H" + range1);
		tick.attr("opacity", 1).attr("transform", function(d) {
			return transform(position(d) + offset);
		});
		line.attr(x + "2", k * tickSizeInner);
		text.attr(x, k * spacing).text(format);
		selection.filter(entering).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", orient === right ? "start" : orient === left ? "end" : "middle");
		selection.each(function() {
			this.__axis = position;
		});
	}
	axis.scale = function(_) {
		return arguments.length ? (scale = _, axis) : scale;
	};
	axis.ticks = function() {
		return tickArguments = Array.from(arguments), axis;
	};
	axis.tickArguments = function(_) {
		return arguments.length ? (tickArguments = _ == null ? [] : Array.from(_), axis) : tickArguments.slice();
	};
	axis.tickValues = function(_) {
		return arguments.length ? (tickValues = _ == null ? null : Array.from(_), axis) : tickValues && tickValues.slice();
	};
	axis.tickFormat = function(_) {
		return arguments.length ? (tickFormat = _, axis) : tickFormat;
	};
	axis.tickSize = function(_) {
		return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
	};
	axis.tickSizeInner = function(_) {
		return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
	};
	axis.tickSizeOuter = function(_) {
		return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
	};
	axis.tickPadding = function(_) {
		return arguments.length ? (tickPadding = +_, axis) : tickPadding;
	};
	axis.offset = function(_) {
		return arguments.length ? (offset = +_, axis) : offset;
	};
	return axis;
}
function axisTop(scale) {
	return axis(top, scale);
}
function axisRight(scale) {
	return axis(right, scale);
}
function axisBottom(scale) {
	return axis(bottom, scale);
}
function axisLeft(scale) {
	return axis(left, scale);
}
//#endregion
export { nice as _, calendar as a, utcTicks as c, timeHour as d, utcHour as f, millisecond as g, second as h, axisTop as i, timeMonth as l, utcMinute as m, axisLeft as n, time as o, timeMinute as p, axisRight as r, utcTickInterval as s, axisBottom as t, utcMonth as u };
