import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { a as resolveFileViewerColorScheme, dn as resolveFileViewerRuntimeAssetBaseUrl, fn as resolveFileViewerSpreadsheetWorkerUrl } from "./dist-B6GcL3C6.js";
import { C as createEmptyFileViewerSearchState, _ as unregisterFileViewerZoomProvider, f as registerFileViewerSearchProvider, h as unregisterFileViewerSearchProvider, i as resolveFileViewerFitScale, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter } from "./fit-BmeG0j2O.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { r as extremaPointIndexes, t as tinycolor } from "./tinycolor-VHUswiq2.js";
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/platform/worker.js
var createFileViewerWorkerController = (factory, options = {}) => {
	const instance = factory();
	const eventHandlers = /* @__PURE__ */ new Map();
	const messageHooks = /* @__PURE__ */ new Set();
	const errorHooks = /* @__PURE__ */ new Set();
	const emit = (type, payload) => {
		instance === null || instance === void 0 || instance.postMessage({
			type,
			payload
		});
	};
	const handleMessage = (event) => {
		const { type, payload } = event.data || {};
		const handlers = eventHandlers.get(type);
		handlers === null || handlers === void 0 || handlers.forEach((handler) => handler(payload));
		messageHooks.forEach((hook) => hook(event));
	};
	const handleError = (event) => {
		if (options.logErrors !== false) console.error(event);
		errorHooks.forEach((hook) => hook(event));
	};
	instance === null || instance === void 0 || instance.addEventListener("message", handleMessage);
	instance === null || instance === void 0 || instance.addEventListener("error", handleError);
	return {
		instance,
		worker: { emit },
		emit,
		onWorkerMessage(hook) {
			messageHooks.add(hook);
			return () => {
				messageHooks.delete(hook);
			};
		},
		onWorkerError(hook) {
			errorHooks.add(hook);
			return () => {
				errorHooks.delete(hook);
			};
		},
		onWorkerEvent(type, hook) {
			let handlers = eventHandlers.get(type);
			if (!handlers) {
				handlers = /* @__PURE__ */ new Set();
				eventHandlers.set(type, handlers);
			}
			handlers.add(hook);
			return () => {
				handlers === null || handlers === void 0 || handlers.delete(hook);
				if ((handlers === null || handlers === void 0 ? void 0 : handlers.size) === 0) eventHandlers.delete(type);
			};
		},
		mapEvents(mappings) {
			if (Array.isArray(mappings)) return mappings.reduce((result, key) => {
				result[key] = (payload) => emit(key, payload);
				return result;
			}, {});
			return Object.keys(mappings).reduce((result, key) => {
				const name = mappings[key];
				result[name] = (payload) => emit(key, payload);
				return result;
			}, {});
		},
		destroy() {
			instance === null || instance === void 0 || instance.removeEventListener("message", handleMessage);
			instance === null || instance === void 0 || instance.removeEventListener("error", handleError);
			instance === null || instance === void 0 || instance.terminate();
			eventHandlers.clear();
			messageHooks.clear();
			errorHooks.clear();
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/chartRenderer.js
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
var DEFAULT_COLORS = [
	"#4472c4",
	"#ed7d31",
	"#70ad47",
	"#ffc000",
	"#5b9bd5",
	"#a5a5a5"
];
var MAX_LINE_POINTS_PER_PIXEL = 2;
var svgElement = (documentRef, name, attributes = {}) => {
	const element = documentRef.createElementNS(SVG_NAMESPACE, name);
	Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, `${value}`));
	return element;
};
var svgText = (documentRef, value, x, y, options = {}) => {
	const text = svgElement(documentRef, "text", {
		x,
		y,
		"text-anchor": options.anchor || "start",
		"font-family": "Aptos, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
		"font-size": options.size || 11,
		"font-weight": options.weight || "400",
		fill: options.fill || "#5f6368"
	});
	if (options.rotate) text.setAttribute("transform", `rotate(${options.rotate} ${x} ${y})`);
	text.textContent = value;
	return text;
};
var seriesColor = (series, index) => {
	return series.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};
var seriesStrokeWidth = (series) => {
	return Math.min(8, Math.max(.5, series.lineWidth || 2.5));
};
var seriesDashArray = (series) => {
	switch (series.lineDash) {
		case "dash":
		case "sysDash": return "8 4";
		case "dashDot":
		case "sysDashDot": return "8 4 2 4";
		case "dot":
		case "sysDot": return "2 3";
		case "lgDash": return "12 5";
		case "lgDashDot": return "12 5 2 5";
		case "lgDashDotDot": return "12 5 2 5 2 5";
		default: return;
	}
};
var showsSeriesLine = (chart, series) => {
	var _a;
	if (series.lineVisible === false) return false;
	return chart.type !== "scatter" || ((_a = chart.scatterStyle) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== "marker";
};
var showsSeriesMarker = (chart, series) => {
	if (series.marker) return series.marker.symbol.toLowerCase() !== "none";
	if (chart.type !== "scatter") return false;
	const scatterStyle = (chart.scatterStyle || "lineMarker").toLowerCase();
	return scatterStyle === "marker" || scatterStyle.endsWith("marker");
};
var categoryLabelIndexes = (count, plotWidth) => {
	const limit = Math.max(2, Math.floor(plotWidth / 28));
	if (count <= limit) return Array.from({ length: count }, (_, index) => index);
	return Array.from(new Set(Array.from({ length: limit }, (_, index) => Math.round(index * (count - 1) / (limit - 1)))));
};
var drawSeriesMarker = (documentRef, svg, series, color, x, y) => {
	var _a, _b;
	const symbol = ((_a = series.marker) === null || _a === void 0 ? void 0 : _a.symbol.toLowerCase()) || "circle";
	const radius = Math.min(10, Math.max(1.5, (((_b = series.marker) === null || _b === void 0 ? void 0 : _b.size) || 5) * 4 / 6));
	const common = {
		class: "excel-chart-marker",
		"data-marker-symbol": symbol
	};
	switch (symbol) {
		case "square":
			svg.appendChild(svgElement(documentRef, "rect", {
				...common,
				x: x - radius,
				y: y - radius,
				width: radius * 2,
				height: radius * 2,
				fill: color
			}));
			break;
		case "diamond":
			svg.appendChild(svgElement(documentRef, "polygon", {
				...common,
				points: `${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`,
				fill: color
			}));
			break;
		case "triangle":
			svg.appendChild(svgElement(documentRef, "polygon", {
				...common,
				points: `${x},${y - radius} ${x + radius},${y + radius} ${x - radius},${y + radius}`,
				fill: color
			}));
			break;
		case "dash":
			svg.appendChild(svgElement(documentRef, "line", {
				...common,
				x1: x - radius,
				y1: y,
				x2: x + radius,
				y2: y,
				stroke: color,
				"stroke-width": 2
			}));
			break;
		case "plus":
			svg.appendChild(svgElement(documentRef, "path", {
				...common,
				d: `M${x - radius},${y} L${x + radius},${y} M${x},${y - radius} L${x},${y + radius}`,
				fill: "none",
				stroke: color,
				"stroke-width": 1.5
			}));
			break;
		case "x":
			svg.appendChild(svgElement(documentRef, "path", {
				...common,
				d: `M${x - radius},${y - radius} L${x + radius},${y + radius} M${x + radius},${y - radius} L${x - radius},${y + radius}`,
				fill: "none",
				stroke: color,
				"stroke-width": 1.5
			}));
			break;
		default: svg.appendChild(svgElement(documentRef, "circle", {
			...common,
			cx: x,
			cy: y,
			r: symbol === "dot" ? Math.max(1, radius / 2) : radius,
			fill: color
		}));
	}
};
var categoryLabels = (chart) => {
	var _a;
	const labels = ((_a = chart.series.find((series) => series.categories.length)) === null || _a === void 0 ? void 0 : _a.categories) || [];
	const valueCount = chart.series.reduce((count, series) => Math.max(count, series.values.length), 0);
	return labels.length ? labels : Array.from({ length: valueCount }, (_, index) => `${index + 1}`);
};
var valueDomain = (chart) => {
	let min = 0;
	let max = 0;
	chart.series.forEach((series) => {
		series.values.forEach((value) => {
			if (!Number.isFinite(value)) return;
			min = Math.min(min, value);
			max = Math.max(max, value);
		});
	});
	if (min === max) return {
		min: 0,
		max: Math.max(1, max),
		span: Math.max(1, max)
	};
	return {
		min,
		max,
		span: max - min
	};
};
var createPlot = (chart) => {
	const hasTitle = !!chart.title;
	const hasLegend = !!chart.legendPosition;
	const rightLegend = chart.legendPosition === "right";
	const top = hasTitle ? 48 : 24;
	const bottom = hasLegend && !rightLegend ? 302 : 326;
	const left = chart.valueAxisTitle ? 76 : 58;
	return {
		left,
		top,
		width: (rightLegend ? 492 : 612) - left,
		height: bottom - top,
		bottom
	};
};
var drawValueGrid = (documentRef, svg, plot, domain) => {
	const tickCount = 5;
	for (let index = 0; index <= tickCount; index += 1) {
		const ratio = index / tickCount;
		const y = plot.bottom - ratio * plot.height;
		const value = domain.min + ratio * domain.span;
		svg.appendChild(svgElement(documentRef, "line", {
			x1: plot.left,
			y1: y,
			x2: plot.left + plot.width,
			y2: y,
			stroke: index === 0 ? "#9ca3af" : "#e5e7eb",
			"stroke-width": 1
		}));
		svg.appendChild(svgText(documentRef, Number.isInteger(value) ? `${value}` : value.toFixed(1), plot.left - 8, y + 4, {
			anchor: "end",
			size: 10
		}));
	}
};
var drawCategoryLabels = (documentRef, svg, chart, plot, pointAxis = false) => {
	const categories = categoryLabels(chart);
	if (!categories.length) return;
	const categorySeries = chart.series.find((series) => series.categories.length);
	const sourcePointCount = Math.max((categorySeries === null || categorySeries === void 0 ? void 0 : categorySeries.sourcePointCount) || categories.length, categories.length);
	const step = plot.width / categories.length;
	categoryLabelIndexes(categories.length, plot.width).forEach((index) => {
		var _a, _b;
		const category = categories[index];
		const maxLength = categories.length > 8 ? 8 : 14;
		const label = category.length > maxLength ? `${category.slice(0, maxLength - 1)}…` : category;
		const sourceIndex = (_b = (_a = categorySeries === null || categorySeries === void 0 ? void 0 : categorySeries.sourcePointIndexes) === null || _a === void 0 ? void 0 : _a[index]) !== null && _b !== void 0 ? _b : index;
		const labelElement = svgText(documentRef, label, pointAxis && categories.length > 1 ? plot.left + sourceIndex / Math.max(sourcePointCount - 1, 1) * plot.width : plot.left + (index + .5) * step, plot.bottom + 17, {
			anchor: "middle",
			size: 10
		});
		labelElement.classList.add("excel-chart-category-label");
		labelElement.dataset.categoryIndex = `${sourceIndex}`;
		svg.appendChild(labelElement);
	});
};
var drawColumnChart = (documentRef, svg, chart, plot) => {
	const domain = valueDomain(chart);
	const categories = categoryLabels(chart);
	const categoryCount = Math.max(categories.length, chart.series.reduce((count, series) => Math.max(count, series.values.length), 0), 1);
	const groupWidth = plot.width / categoryCount;
	const seriesCount = Math.max(chart.series.length, 1);
	const slotWidth = groupWidth * .76 / seriesCount;
	const zeroY = plot.bottom - (0 - domain.min) / domain.span * plot.height;
	drawValueGrid(documentRef, svg, plot, domain);
	chart.series.forEach((series, seriesIndex) => {
		series.values.forEach((value, valueIndex) => {
			const valueY = plot.bottom - (value - domain.min) / domain.span * plot.height;
			const rect = svgElement(documentRef, "rect", {
				x: plot.left + valueIndex * groupWidth + groupWidth * .12 + seriesIndex * slotWidth,
				y: Math.min(zeroY, valueY),
				width: Math.max(1, slotWidth - 2),
				height: Math.max(1, Math.abs(zeroY - valueY)),
				fill: seriesColor(series, seriesIndex),
				rx: 1
			});
			const title = svgElement(documentRef, "title");
			title.textContent = `${series.name}: ${value}`;
			rect.appendChild(title);
			svg.appendChild(rect);
		});
	});
	drawCategoryLabels(documentRef, svg, chart, plot);
};
var drawHorizontalBarChart = (documentRef, svg, chart, plot) => {
	const domain = valueDomain(chart);
	const categories = categoryLabels(chart);
	const categoryCount = Math.max(categories.length, chart.series.reduce((count, series) => Math.max(count, series.values.length), 0), 1);
	const groupHeight = plot.height / categoryCount;
	const seriesCount = Math.max(chart.series.length, 1);
	const slotHeight = groupHeight * .76 / seriesCount;
	const zeroX = plot.left + (0 - domain.min) / domain.span * plot.width;
	for (let index = 0; index <= 5; index += 1) {
		const ratio = index / 5;
		const x = plot.left + ratio * plot.width;
		svg.appendChild(svgElement(documentRef, "line", {
			x1: x,
			y1: plot.top,
			x2: x,
			y2: plot.bottom,
			stroke: "#e5e7eb",
			"stroke-width": 1
		}));
	}
	chart.series.forEach((series, seriesIndex) => {
		series.values.forEach((value, valueIndex) => {
			const valueX = plot.left + (value - domain.min) / domain.span * plot.width;
			const y = plot.top + valueIndex * groupHeight + groupHeight * .12 + seriesIndex * slotHeight;
			svg.appendChild(svgElement(documentRef, "rect", {
				x: Math.min(zeroX, valueX),
				y,
				width: Math.max(1, Math.abs(valueX - zeroX)),
				height: Math.max(1, slotHeight - 2),
				fill: seriesColor(series, seriesIndex),
				rx: 1
			}));
		});
	});
	categories.forEach((category, index) => {
		svg.appendChild(svgText(documentRef, category, plot.left - 8, plot.top + (index + .5) * groupHeight + 4, {
			anchor: "end",
			size: 10
		}));
	});
};
var drawLineChart = (documentRef, svg, chart, plot, fillArea) => {
	const domain = valueDomain(chart);
	const count = Math.max(chart.series.reduce((pointCount, series) => Math.max(pointCount, series.sourcePointCount || series.values.length), 0), 1);
	const step = count > 1 ? plot.width / (count - 1) : plot.width;
	drawValueGrid(documentRef, svg, plot, domain);
	chart.series.forEach((series, seriesIndex) => {
		const points = extremaPointIndexes(series.values, Math.max(64, Math.floor(plot.width * MAX_LINE_POINTS_PER_PIXEL))).map((index) => {
			var _a, _b;
			const value = series.values[index];
			const sourceIndex = (_b = (_a = series.sourcePointIndexes) === null || _a === void 0 ? void 0 : _a[index]) !== null && _b !== void 0 ? _b : index;
			return {
				x: plot.left + (count > 1 ? sourceIndex * step : plot.width / 2),
				y: plot.bottom - (value - domain.min) / domain.span * plot.height
			};
		});
		if (!points.length) return;
		const pathData = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
		if (fillArea && points.length > 1) svg.appendChild(svgElement(documentRef, "path", {
			d: `${pathData} L${points[points.length - 1].x},${plot.bottom} L${points[0].x},${plot.bottom} Z`,
			fill: seriesColor(series, seriesIndex),
			opacity: .2
		}));
		const color = seriesColor(series, seriesIndex);
		const dashArray = seriesDashArray(series);
		if (showsSeriesLine(chart, series)) svg.appendChild(svgElement(documentRef, "path", {
			class: "excel-chart-series-line",
			"data-source-point-count": series.sourcePointCount || series.values.length,
			"data-transferred-point-count": series.values.length,
			"data-rendered-point-count": points.length,
			d: pathData,
			fill: "none",
			stroke: color,
			"stroke-width": seriesStrokeWidth(series),
			...dashArray ? { "stroke-dasharray": dashArray } : {},
			"stroke-linejoin": "round",
			"stroke-linecap": "round"
		}));
		if (showsSeriesMarker(chart, series)) points.forEach((point) => drawSeriesMarker(documentRef, svg, series, color, point.x, point.y));
	});
	drawCategoryLabels(documentRef, svg, chart, plot, true);
};
var polarPoint = (cx, cy, radius, angle) => {
	const radians = (angle - 90) * Math.PI / 180;
	return {
		x: cx + radius * Math.cos(radians),
		y: cy + radius * Math.sin(radians)
	};
};
var pieSlicePath = (cx, cy, outerRadius, innerRadius, startAngle, endAngle) => {
	const outerStart = polarPoint(cx, cy, outerRadius, endAngle);
	const outerEnd = polarPoint(cx, cy, outerRadius, startAngle);
	const largeArc = endAngle - startAngle > 180 ? 1 : 0;
	if (!innerRadius) return `M${cx},${cy} L${outerStart.x},${outerStart.y} A${outerRadius},${outerRadius} 0 ${largeArc},0 ${outerEnd.x},${outerEnd.y} Z`;
	const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
	const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);
	return `M${outerStart.x},${outerStart.y} A${outerRadius},${outerRadius} 0 ${largeArc},0 ${outerEnd.x},${outerEnd.y} L${innerStart.x},${innerStart.y} A${innerRadius},${innerRadius} 0 ${largeArc},1 ${innerEnd.x},${innerEnd.y} Z`;
};
var drawPieChart = (documentRef, svg, chart, doughnut) => {
	const series = chart.series[0];
	const values = (series === null || series === void 0 ? void 0 : series.values) || [];
	const categories = (series === null || series === void 0 ? void 0 : series.categories) || [];
	const total = values.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
	const cx = chart.legendPosition === "right" ? 260 : 320;
	const cy = chart.title ? 180 : 170;
	const radius = 120;
	let angle = 0;
	values.forEach((value, index) => {
		const nextAngle = angle + Math.max(0, value) / total * 360;
		const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
		const path = svgElement(documentRef, "path", {
			d: pieSlicePath(cx, cy, radius, doughnut ? 62 : 0, angle, nextAngle),
			fill: color,
			stroke: "#ffffff",
			"stroke-width": 1.5
		});
		const title = svgElement(documentRef, "title");
		title.textContent = `${categories[index] || index + 1}: ${value}`;
		path.appendChild(title);
		svg.appendChild(path);
		angle = nextAngle;
	});
};
var drawLegend = (documentRef, svg, chart) => {
	if (!chart.legendPosition) return;
	const right = chart.legendPosition === "right";
	chart.series.slice(0, 8).forEach((series, index) => {
		const x = right ? 510 : 76 + index % 4 * 136;
		const y = right ? 72 + index * 28 : 342 - Math.floor(index / 4) * 20;
		const color = seriesColor(series, index);
		if (chart.type === "line" || chart.type === "scatter" || chart.type === "radar") {
			if (showsSeriesLine(chart, series)) {
				const dashArray = seriesDashArray(series);
				svg.appendChild(svgElement(documentRef, "line", {
					x1: x,
					y1: y - 5,
					x2: x + 12,
					y2: y - 5,
					stroke: color,
					"stroke-width": seriesStrokeWidth(series),
					...dashArray ? { "stroke-dasharray": dashArray } : {}
				}));
			}
			if (showsSeriesMarker(chart, series)) drawSeriesMarker(documentRef, svg, series, color, x + 6, y - 5);
		} else svg.appendChild(svgElement(documentRef, "rect", {
			x,
			y: y - 10,
			width: 10,
			height: 10,
			fill: color
		}));
		const label = series.name.length > 16 ? `${series.name.slice(0, 15)}…` : series.name;
		svg.appendChild(svgText(documentRef, label, x + 18, y, { size: 10 }));
	});
};
var renderSpreadsheetChart = (documentRef, chart) => {
	const container = documentRef.createElement("div");
	container.className = "excel-chart";
	container.dataset.chartId = chart.id;
	container.dataset.chartType = chart.type;
	container.dataset.seriesNames = JSON.stringify(chart.series.map((series) => series.name));
	container.dataset.seriesMarkers = JSON.stringify(chart.series.map((series) => {
		var _a;
		return ((_a = series.marker) === null || _a === void 0 ? void 0 : _a.symbol) || null;
	}));
	container.setAttribute("role", "img");
	container.setAttribute("aria-label", chart.title || chart.id || "Spreadsheet chart");
	const svg = svgElement(documentRef, "svg", {
		viewBox: "0 0 640 360",
		preserveAspectRatio: "xMidYMid meet",
		focusable: "false",
		"aria-hidden": "true"
	});
	svg.appendChild(svgElement(documentRef, "rect", {
		x: .5,
		y: .5,
		width: 639,
		height: 359,
		fill: "#ffffff",
		stroke: "#d1d5db"
	}));
	if (chart.title) svg.appendChild(svgText(documentRef, chart.title, 320, 28, {
		anchor: "middle",
		size: 16,
		weight: "600",
		fill: "#1f2937"
	}));
	const plot = createPlot(chart);
	switch (chart.type) {
		case "pie":
			drawPieChart(documentRef, svg, chart, false);
			break;
		case "doughnut":
			drawPieChart(documentRef, svg, chart, true);
			break;
		case "line":
		case "scatter":
		case "radar":
			drawLineChart(documentRef, svg, chart, plot, false);
			break;
		case "area":
			drawLineChart(documentRef, svg, chart, plot, true);
			break;
		default: if (chart.barDirection === "bar") drawHorizontalBarChart(documentRef, svg, chart, plot);
		else drawColumnChart(documentRef, svg, chart, plot);
	}
	if (chart.categoryAxisTitle && chart.type !== "pie" && chart.type !== "doughnut") svg.appendChild(svgText(documentRef, chart.categoryAxisTitle, plot.left + plot.width / 2, 324, {
		anchor: "middle",
		size: 11,
		fill: "#374151"
	}));
	if (chart.valueAxisTitle && chart.type !== "pie" && chart.type !== "doughnut") svg.appendChild(svgText(documentRef, chart.valueAxisTitle, 18, plot.top + plot.height / 2, {
		anchor: "middle",
		size: 11,
		fill: "#374151",
		rotate: -90
	}));
	drawLegend(documentRef, svg, chart);
	container.appendChild(svg);
	return container;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/imageSource.js
var MAX_TIFF_SOURCE_BYTES = 33554432;
var MAX_TIFF_DIMENSION = 16384;
var MAX_TIFF_PIXELS = 24e6;
var getBase64Payload = (source) => {
	const match = /^data:([^;,]*);base64,([\s\S]*)$/i.exec(source);
	if (!match) return;
	return {
		mime: match[1].toLowerCase(),
		payload: match[2]
	};
};
var decodeBase64Head = (payload, atob) => {
	try {
		return atob(payload.slice(0, 12));
	} catch {
		return "";
	}
};
var hasTiffHeader = (binary) => binary.length >= 4 && (binary.charCodeAt(0) === 73 && binary.charCodeAt(1) === 73 && binary.charCodeAt(2) === 42 && binary.charCodeAt(3) === 0 || binary.charCodeAt(0) === 77 && binary.charCodeAt(1) === 77 && binary.charCodeAt(2) === 0 && binary.charCodeAt(3) === 42);
var decodeBase64 = (payload, atob) => {
	if (Math.floor(payload.length * 3 / 4) > MAX_TIFF_SOURCE_BYTES) throw new Error("TIFF source exceeds the embedded-image safety limit.");
	const binary = atob(payload);
	if (binary.length > MAX_TIFF_SOURCE_BYTES) throw new Error("TIFF source exceeds the embedded-image safety limit.");
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
};
var getTiffDimension = (ifd, tag, fallback) => {
	const tagged = ifd[tag];
	const value = Array.isArray(tagged) ? tagged[0] : tagged;
	const resolved = Number(value !== null && value !== void 0 ? value : ifd[fallback]);
	return Number.isFinite(resolved) ? resolved : 0;
};
var assertSafeTiffDimensions = (width, height) => {
	if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width > MAX_TIFF_DIMENSION || height > MAX_TIFF_DIMENSION || width * height > MAX_TIFF_PIXELS) throw new Error("TIFF dimensions exceed the embedded-image safety limit.");
};
var loadUtif = async () => {
	const imported = await import("./UTIF-MmHp7JBK.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
	return imported.default || imported;
};
var createSpreadsheetImageSourceResolver = (documentRef) => {
	const view = documentRef.defaultView;
	const decodeAtob = (view === null || view === void 0 ? void 0 : view.atob.bind(view)) || globalThis.atob.bind(globalThis);
	const urlApi = (view === null || view === void 0 ? void 0 : view.URL) || URL;
	const cache = /* @__PURE__ */ new Map();
	const objectUrls = /* @__PURE__ */ new Set();
	let disposed = false;
	const decodeTiff = async (source, payload) => {
		const bytes = decodeBase64(payload, decodeAtob);
		const input = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
		const utif = await loadUtif();
		const ifd = utif.decode(input)[0];
		if (!ifd) throw new Error("TIFF image does not contain a decodable page.");
		assertSafeTiffDimensions(getTiffDimension(ifd, "t256", "width"), getTiffDimension(ifd, "t257", "height"));
		utif.decodeImage(input, ifd);
		const width = getTiffDimension(ifd, "t256", "width");
		const height = getTiffDimension(ifd, "t257", "height");
		assertSafeTiffDimensions(width, height);
		const rgba = utif.toRGBA8(ifd);
		if (rgba.byteLength !== width * height * 4) throw new Error("TIFF decoder returned an unexpected pixel buffer.");
		const canvas = documentRef.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas 2D is unavailable for TIFF conversion.");
		const imageData = context.createImageData(width, height);
		imageData.data.set(rgba);
		context.putImageData(imageData, 0, 0);
		const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
		if (!blob) throw new Error("Unable to encode the TIFF preview as PNG.");
		const objectUrl = urlApi.createObjectURL(blob);
		if (disposed) {
			urlApi.revokeObjectURL(objectUrl);
			return source;
		}
		objectUrls.add(objectUrl);
		return objectUrl;
	};
	return {
		resolve(image) {
			const parsed = getBase64Payload(image.src);
			if (!parsed) return Promise.resolve(image.src);
			const declaredTiff = /image\/(?:tif|tiff)/i.test(image.contentType || parsed.mime);
			const sniffedTiff = hasTiffHeader(decodeBase64Head(parsed.payload, decodeAtob));
			if (!declaredTiff && !sniffedTiff) return Promise.resolve(image.src);
			let pending = cache.get(image.src);
			if (!pending) {
				pending = decodeTiff(image.src, parsed.payload).catch(() => image.src);
				cache.set(image.src, pending);
			}
			return pending;
		},
		dispose() {
			disposed = true;
			objectUrls.forEach((url) => urlApi.revokeObjectURL(url));
			objectUrls.clear();
			cache.clear();
		}
	};
};
var INDEX_COLUMN_KEY = "__index";
var DEFAULT_SHEET_DEFAULTS = {
	rowHeight: 20,
	colWidth: 64
};
var RowState = {
	Placeholder: 0,
	Loading: 1,
	Loaded: 2
};
var createEmptyVirtualState = () => ({
	active: false,
	totalRows: 0,
	totalCols: 0,
	indexOffset: 0,
	defaults: { ...DEFAULT_SHEET_DEFAULTS },
	dataKeys: [],
	rows: [],
	columns: [],
	cellCache: /* @__PURE__ */ new Map(),
	mergeStartMap: /* @__PURE__ */ new Map(),
	mergeCoveredMap: /* @__PURE__ */ new Map(),
	rowHeightCache: /* @__PURE__ */ new Map(),
	windowRows: /* @__PURE__ */ new Map(),
	windowCells: /* @__PURE__ */ new Map(),
	loadedWindows: /* @__PURE__ */ new Set(),
	loadingWindows: /* @__PURE__ */ new Set()
});
var displayCellKey = (row, col) => {
	return `${row}-${col}`;
};
var getDataKey = (index) => {
	return `c${index}`;
};
var getRowState = (row) => {
	var _a;
	return (_a = row === null || row === void 0 ? void 0 : row["__s"]) !== null && _a !== void 0 ? _a : RowState.Placeholder;
};
var buildRows = (count) => {
	const rows = new Array(count);
	for (let index = 0; index < count; index += 1) rows[index] = {
		["__k"]: `${index}`,
		["__s"]: RowState.Placeholder
	};
	return rows;
};
var getMaxWindowStart = (totalRows) => {
	if (!totalRows) return 0;
	return Math.floor(Math.max(totalRows - 1, 0) / 500) * 500;
};
var clampWindowStart = (startRow = 0, totalRows = 0) => {
	return Math.min(Math.max(startRow, 0), getMaxWindowStart(totalRows));
};
var getWindowStart = (row = 0, totalRows = 0) => {
	return clampWindowStart(Math.floor(Math.max(row, 0) / 500) * 500, totalRows);
};
var collectWindowStarts = ({ startRow, endRow, direction, totalRows, far = false }) => {
	const starts = /* @__PURE__ */ new Set();
	const firstWindow = getWindowStart(startRow, totalRows);
	const lastWindow = getWindowStart(endRow, totalRows);
	for (let current = firstWindow; current <= lastWindow; current += 500) starts.add(current);
	const ahead = far ? 4 : 3;
	const behind = far ? 2 : 1;
	const anchor = direction > 0 ? lastWindow : firstWindow;
	for (let step = 1; step <= ahead; step += 1) starts.add(clampWindowStart(anchor + direction * step * 500, totalRows));
	for (let step = 1; step <= behind; step += 1) starts.add(clampWindowStart(anchor - direction * step * 500, totalRows));
	return Array.from(starts);
};
var markWindowState = (rows, totalRows, windowStart, nextState) => {
	const endRow = Math.min(windowStart + 500, totalRows);
	for (let rowIndex = windowStart; rowIndex < endRow; rowIndex += 1) {
		const row = rows[rowIndex];
		if (!row) continue;
		row["__s"] = nextState;
	}
};
var SPREADSHEET_MIN_ZOOM = .25;
var SPREADSHEET_MAX_ZOOM = 2.5;
var TABLE_FONT_FAMILY = "Aptos, Calibri, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
var TABLE_FONT_SIZE = 11;
var MIN_RENDERABLE_ROW_HEIGHT = 8;
var HIDDEN_ROW_HEIGHT = .1;
var CELL_PADDING = 2;
var CELL_LINE_HEIGHT = 1.2;
var EXCEL_HEADER_BG = "#f3f3f3";
var EXCEL_HEADER_TEXT = "#5f6368";
var EXCEL_GRID = "#d7dbe0";
var EXCEL_DARK_HEADER_BG = "#1f2937";
var EXCEL_DARK_HEADER_TEXT = "#cbd5e1";
var EXCEL_DARK_GRID = "#374151";
var EXCEL_DARK_BODY_BG = "#111827";
var EXCEL_DARK_BODY_TEXT = "#e5e7eb";
var EXCEL_GREEN = "#21a366";
var EXCEL_GREEN_SOFT = "rgba(33, 163, 102, 0.1)";
var DATA_AREA_MIN_COL_INDEX = 1;
var DEFAULT_BORDER_COLOR = "#000000";
var BORDER_STYLE_PRIORITY = {
	double: 8,
	solid: 7,
	dashed: 5,
	dotted: 4
};
var HEADER_FONT = `bold 12px ${TABLE_FONT_FAMILY}`;
var BODY_FONT = `${TABLE_FONT_SIZE}px ${TABLE_FONT_FAMILY}`;
var MAX_OVERFLOW_SCAN_COLS = 32;
var measureCanvas;
var textWidthCache = /* @__PURE__ */ new Map();
var normalizeZoomScale = (scale = 1) => {
	return Number.isFinite(scale) ? Math.min(SPREADSHEET_MAX_ZOOM, Math.max(SPREADSHEET_MIN_ZOOM, scale)) : 1;
};
var scaleNumber = (value, zoomScale) => {
	return Math.max(1, Math.round(value * normalizeZoomScale(zoomScale)));
};
var scaleFont = (font, zoomScale) => {
	if (!font) return font;
	const normalizedScale = normalizeZoomScale(zoomScale);
	return font.replace(/(\d+(?:\.\d+)?)px/g, (_, size) => {
		return `${Number(size) * normalizedScale}px`;
	});
};
var scaleBorder = (border, zoomScale) => {
	if (!border) return;
	return {
		...border,
		width: Math.max(.5, border.width * normalizeZoomScale(zoomScale))
	};
};
var scaleRichText = (runs, zoomScale) => {
	if (!(runs === null || runs === void 0 ? void 0 : runs.length)) return;
	const normalizedScale = normalizeZoomScale(zoomScale);
	return runs.map((run) => ({
		...run,
		...run.fontSize ? { fontSize: run.fontSize * normalizedScale } : {}
	}));
};
var scaleCellStyle = (style, zoomScale) => {
	if (!style) return;
	return {
		...style,
		font: scaleFont(style.font, zoomScale),
		richText: scaleRichText(style.richText, zoomScale),
		borderTop: scaleBorder(style.borderTop, zoomScale),
		borderRight: scaleBorder(style.borderRight, zoomScale),
		borderBottom: scaleBorder(style.borderBottom, zoomScale),
		borderLeft: scaleBorder(style.borderLeft, zoomScale)
	};
};
var getHeaderFont = (zoomScale) => scaleFont(HEADER_FONT, zoomScale) || HEADER_FONT;
var getBodyFont = (zoomScale) => scaleFont(BODY_FONT, zoomScale) || BODY_FONT;
var getIndexCellStyle = (zoomScale, darkMode = false) => ({
	backgroundColor: darkMode ? EXCEL_DARK_HEADER_BG : EXCEL_HEADER_BG,
	color: darkMode ? EXCEL_DARK_HEADER_TEXT : EXCEL_HEADER_TEXT,
	font: getHeaderFont(zoomScale)
});
var getLoadingCellStyle = (zoomScale, darkMode = false) => ({
	backgroundColor: darkMode ? "#18212f" : "#f4f7f9",
	color: darkMode ? "#94a3b8" : "#73808d",
	font: scaleFont(`italic ${TABLE_FONT_SIZE}px ${TABLE_FONT_FAMILY}`, zoomScale)
});
var cloneColumns = (columns) => {
	return columns.map((column) => {
		var _a;
		return {
			...column,
			...((_a = column.children) === null || _a === void 0 ? void 0 : _a.length) ? { children: cloneColumns(column.children) } : {}
		};
	});
};
var CSS_GENERIC_FONT_FAMILIES = /* @__PURE__ */ new Set([
	"caption",
	"cursive",
	"emoji",
	"fangsong",
	"fantasy",
	"icon",
	"math",
	"menu",
	"message-box",
	"monospace",
	"sans-serif",
	"serif",
	"small-caption",
	"status-bar",
	"system-ui",
	"ui-monospace",
	"ui-rounded",
	"ui-sans-serif",
	"ui-serif"
]);
var normalizeFontFamily = (value) => {
	const family = typeof value === "string" ? value.trim() : "";
	if (!family) return TABLE_FONT_FAMILY;
	if (family.includes(",") || CSS_GENERIC_FONT_FAMILIES.has(family.toLowerCase())) return family;
	if (family.startsWith("\"") && family.endsWith("\"") || family.startsWith("'") && family.endsWith("'")) return family;
	return `"${family.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
};
var buildFont = (style) => {
	if (typeof style.font === "string" && style.font.trim()) return style.font;
	if (!(style.fontFamily !== void 0 || style.fontSize !== void 0 || style.fontWeight !== void 0 || style.fontStyle !== void 0)) return;
	const normalizedWeight = (() => {
		const { fontWeight } = style;
		if (typeof fontWeight === "number") return fontWeight >= 600 ? "bold" : "normal";
		if (typeof fontWeight === "string") {
			const trimmed = fontWeight.trim();
			if (/^\d+$/.test(trimmed)) return Number(trimmed) >= 600 ? "bold" : "normal";
			return trimmed;
		}
		return "normal";
	})();
	return [
		style.fontStyle || "normal",
		normalizedWeight,
		`${Number.parseInt(style.fontSize, 10) || TABLE_FONT_SIZE}px`,
		normalizeFontFamily(style.fontFamily)
	].join(" ");
};
var alignFromClassName = (className) => {
	if (!className) return;
	if (className.includes("htLeft")) return "left";
	if (className.includes("htRight")) return "right";
	if (className.includes("htCenter")) return "center";
};
var verticalAlignFromClassName = (className) => {
	if (!className) return;
	if (className.includes("htTop")) return "top";
	if (className.includes("htBottom")) return "bottom";
	if (className.includes("htMiddle")) return "middle";
};
var hasClassName = (className, value) => {
	return !!(className === null || className === void 0 ? void 0 : className.split(/\s+/).includes(value));
};
var getColumnWidth = (widths, index, fallback) => {
	var _a;
	if (typeof widths === "number") return widths;
	return (_a = widths === null || widths === void 0 ? void 0 : widths[index]) !== null && _a !== void 0 ? _a : fallback;
};
var getRenderColumnWidth = (column) => {
	const width = Number(column === null || column === void 0 ? void 0 : column.width);
	return Number.isFinite(width) && width > 0 ? width : 0;
};
var isVisibleDataColumn = (column) => {
	return !!column && !column.hide && getRenderColumnWidth(column) > 0;
};
var getSheetColumnsMeta = (ws) => {
	var _a, _b;
	return ((_b = (_a = ws.structure) === null || _a === void 0 ? void 0 : _a.columns) === null || _b === void 0 ? void 0 : _b.length) ? ws.structure.columns : ws.columns;
};
var getSheetColWidths = (ws) => {
	var _a, _b;
	return (_b = (_a = ws.structure) === null || _a === void 0 ? void 0 : _a.colWidths) !== null && _b !== void 0 ? _b : ws.colWidths;
};
var getRowHeight = (heights, index, fallback) => {
	var _a;
	if (typeof heights === "number") return heights;
	return (_a = heights === null || heights === void 0 ? void 0 : heights[index]) !== null && _a !== void 0 ? _a : fallback;
};
var normalizeRowHeight = (height, fallback) => {
	if (typeof height === "number" && Number.isFinite(height)) {
		if (height <= 0) return HIDDEN_ROW_HEIGHT;
		return Math.max(Math.ceil(height), MIN_RENDERABLE_ROW_HEIGHT);
	}
	return Math.max(Math.ceil(fallback), MIN_RENDERABLE_ROW_HEIGHT);
};
var isPlainTextCell = (value) => {
	if (value === null || value === void 0) return false;
	const text = `${value}`.trim();
	if (!text) return false;
	return !/^\d+([./:-]\d+)*$/.test(text);
};
var detectIndexOffset = (ws) => {
	const meta = ws.meta;
	const rows = ws.data || [];
	if (!meta || rows.length < 2 || (ws.merge || []).length) return 0;
	const firstRow = rows[0] || [];
	const secondRow = rows[1] || [];
	const firstRowValues = firstRow.filter((value) => `${value !== null && value !== void 0 ? value : ""}`.trim() !== "");
	const secondRowValues = secondRow.filter((value) => `${value !== null && value !== void 0 ? value : ""}`.trim() !== "");
	if (firstRowValues.length < Math.min(Math.max(Math.floor(meta.totalCols / 2), 3), 6)) return 0;
	if (!firstRowValues.every(isPlainTextCell) || secondRowValues.length < 2) return 0;
	return 1;
};
var buildColumns = (ws) => {
	var _a;
	const columnsMeta = getSheetColumnsMeta(ws);
	const colWidths = getSheetColWidths(ws);
	const columns = [{
		key: INDEX_COLUMN_KEY,
		title: "",
		type: "index",
		fixed: "left",
		width: 68,
		minWidth: 68,
		maxWidth: 68,
		widthFillDisable: true,
		headerAlign: "center",
		align: "center",
		headerVerticalAlign: "middle",
		verticalAlign: "middle",
		overflowTooltipShow: false,
		overflowTooltipHeaderShow: false
	}];
	const dataKeys = [];
	for (let index = 0; index < (((_a = ws.meta) === null || _a === void 0 ? void 0 : _a.totalCols) || 0); index += 1) {
		const key = getDataKey(index);
		const column = columnsMeta === null || columnsMeta === void 0 ? void 0 : columnsMeta[index];
		const width = getColumnWidth(colWidths, index, ws.defaults.colWidth);
		const hidden = !!(column === null || column === void 0 ? void 0 : column.hidden) || width <= 0;
		const columnVerticalAlign = verticalAlignFromClassName(column === null || column === void 0 ? void 0 : column.className) || "middle";
		dataKeys.push(key);
		columns.push({
			key,
			title: (column === null || column === void 0 ? void 0 : column.title) || `${index + 1}`,
			width: hidden ? 0 : Math.max(Math.ceil(width), 1),
			hide: hidden,
			widthFillDisable: true,
			renderType: "both",
			headerAlign: "center",
			headerVerticalAlign: "middle",
			align: alignFromClassName(column === null || column === void 0 ? void 0 : column.className) || "left",
			verticalAlign: columnVerticalAlign,
			overflowTooltipShow: true,
			overflowTooltipHeaderShow: true
		});
	}
	return {
		columns,
		dataKeys
	};
};
var scaleColumn = (column, zoomScale) => {
	var _a;
	const nextColumn = {
		...column,
		...((_a = column.children) === null || _a === void 0 ? void 0 : _a.length) ? { children: column.children.map((child) => scaleColumn(child, zoomScale)) } : {}
	};
	const width = Number(column.width);
	if (Number.isFinite(width) && width > 0) nextColumn.width = scaleNumber(width, zoomScale);
	const minWidth = Number(column.minWidth);
	if (Number.isFinite(minWidth) && minWidth > 0) nextColumn.minWidth = scaleNumber(minWidth, zoomScale);
	const maxWidth = Number(column.maxWidth);
	if (Number.isFinite(maxWidth) && maxWidth > 0) nextColumn.maxWidth = scaleNumber(maxWidth, zoomScale);
	return nextColumn;
};
var getDisplayColumns = (columns, zoomScale = 1) => {
	const normalizedScale = normalizeZoomScale(zoomScale);
	if (normalizedScale === 1) return cloneColumns(columns);
	return columns.map((column) => scaleColumn(column, normalizedScale));
};
var getSearchColumnLeft = (columns, key) => {
	let left = 0;
	const visit = (list) => {
		var _a;
		for (const column of list) {
			if (column.hide) continue;
			if ((_a = column.children) === null || _a === void 0 ? void 0 : _a.length) {
				const childLeft = visit(column.children);
				if (childLeft !== void 0) return childLeft;
			} else {
				if (`${column.key}` === key) return left;
				left += Number(column.width) || 0;
			}
		}
	};
	return visit(columns);
};
var toBorderWidth = (value) => {
	if (typeof value === "number" && Number.isFinite(value)) return Math.max(value, 0);
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
	}
	return 0;
};
var toBorderStyle = (value) => {
	if (typeof value !== "string") return "solid";
	const style = value.trim();
	switch (style) {
		case "double":
		case "dashed":
		case "dotted":
		case "solid": return style;
		default: return "solid";
	}
};
var getBorderSide = (style, side) => {
	const width = toBorderWidth(style[`border${side}Width`]);
	if (!width) return;
	return {
		width,
		style: toBorderStyle(style[`border${side}Style`]),
		color: style[`border${side}Color`] || DEFAULT_BORDER_COLOR
	};
};
var hasBorder = (style) => {
	if (!style) return false;
	return !!(style.borderTop || style.borderRight || style.borderBottom || style.borderLeft);
};
var hasTextLayout = (style) => {
	if (!style) return false;
	return !!(style.horizontalAlign || style.verticalAlign || style.wrapText || style.shrinkToFit);
};
var shouldRenderTextInOverlay = (style, column) => {
	var _a;
	if ((_a = style === null || style === void 0 ? void 0 : style.richText) === null || _a === void 0 ? void 0 : _a.length) return true;
	if (!hasTextLayout(style)) return false;
	return !!((style === null || style === void 0 ? void 0 : style.wrapText) || (style === null || style === void 0 ? void 0 : style.shrinkToFit) || (style === null || style === void 0 ? void 0 : style.horizontalAlign) && style.horizontalAlign !== ((column === null || column === void 0 ? void 0 : column.align) || "left") || (style === null || style === void 0 ? void 0 : style.verticalAlign) && style.verticalAlign !== ((column === null || column === void 0 ? void 0 : column.verticalAlign) || "middle"));
};
var toFlexJustify = (align) => {
	switch (align) {
		case "center": return "center";
		case "right": return "flex-end";
		default: return "flex-start";
	}
};
var toFlexAlign = (verticalAlign) => {
	switch (verticalAlign) {
		case "top": return "flex-start";
		case "bottom": return "flex-end";
		default: return "center";
	}
};
var toTextLayerLeft = (align, ownWidth, overflowWidth, leftRoom) => {
	switch (align) {
		case "right": return ownWidth - overflowWidth;
		case "center": return -Math.min(leftRoom, Math.max((overflowWidth - ownWidth) / 2, 0));
		default: return 0;
	}
};
var isHiddenVirtualRow = (row) => {
	return typeof row._height === "number" && row._height <= HIDDEN_ROW_HEIGHT;
};
var getDataColumnIndex = (column, fallbackColIndex) => {
	const key = column === null || column === void 0 ? void 0 : column.key;
	if (typeof key === "string" && key.startsWith("c")) {
		const index = Number(key.slice(1));
		if (Number.isInteger(index) && index >= 0) return index;
	}
	return Math.max(fallbackColIndex - 1, 0);
};
var getCellCacheKey = (rowIndex, colIndex, column) => {
	return displayCellKey(rowIndex, getDataColumnIndex(column, colIndex) + 1);
};
var getCellKeyByDataColumn = (rowIndex, dataColIndex) => {
	return displayCellKey(rowIndex, dataColIndex + 1);
};
var getTextValue = (value) => {
	if (value === null || value === void 0) return "";
	return `${value}`;
};
var hasRenderableValue = (value) => {
	return getTextValue(value).trim() !== "";
};
var isNumericLikeValue = (text) => {
	return /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?%?$/.test(text.trim());
};
var measureTextWidth = (text, font, padding, documentRef) => {
	const cacheKey = `${font}\n${padding}\n${text}`;
	const cached = textWidthCache.get(cacheKey);
	if (cached !== void 0) return cached;
	if (!measureCanvas && documentRef) measureCanvas = documentRef.createElement("canvas");
	const context = measureCanvas === null || measureCanvas === void 0 ? void 0 : measureCanvas.getContext("2d");
	if (!context) return text.length * TABLE_FONT_SIZE;
	context.font = font;
	const width = context.measureText(text).width + padding * 2;
	textWidthCache.set(cacheKey, width);
	return width;
};
var isBlankOverflowTarget = (virtualState, row, rowIndex, dataColIndex) => {
	const column = virtualState.columns[dataColIndex + 1];
	if (!isVisibleDataColumn(column)) return false;
	const cellKey = getCellKeyByDataColumn(rowIndex, dataColIndex);
	if (virtualState.mergeStartMap.has(cellKey) || virtualState.mergeCoveredMap.has(cellKey)) return false;
	return !hasRenderableValue(row[getDataKey(dataColIndex)]);
};
var collectOverflowRoom = (virtualState, row, rowIndex, dataColIndex, direction) => {
	let room = 0;
	for (let step = 1; step <= MAX_OVERFLOW_SCAN_COLS; step += 1) {
		const nextColIndex = dataColIndex + step * direction;
		if (nextColIndex < 0 || nextColIndex >= virtualState.totalCols) break;
		if (!isBlankOverflowTarget(virtualState, row, rowIndex, nextColIndex)) break;
		room += getRenderColumnWidth(virtualState.columns[nextColIndex + 1]);
	}
	return room;
};
var getExcelOverflowLayout = (virtualState, row, rowIndex, dataColIndex, column, style, value, zoomScale, documentRef) => {
	const text = getTextValue(value);
	if (!text || (style === null || style === void 0 ? void 0 : style.wrapText) || (style === null || style === void 0 ? void 0 : style.shrinkToFit) || isNumericLikeValue(text)) return;
	const cellKey = getCellKeyByDataColumn(rowIndex, dataColIndex);
	if (virtualState.mergeStartMap.has(cellKey) || virtualState.mergeCoveredMap.has(cellKey)) return;
	const ownWidth = getRenderColumnWidth(column);
	if (!ownWidth) return;
	const font = (style === null || style === void 0 ? void 0 : style.font) || BODY_FONT;
	const measuredWidth = Math.ceil(measureTextWidth(text, font, scaleNumber(CELL_PADDING, zoomScale), documentRef));
	if (measuredWidth <= ownWidth) return;
	const align = (style === null || style === void 0 ? void 0 : style.horizontalAlign) || (column === null || column === void 0 ? void 0 : column.align) || "left";
	const leftRoom = align === "right" || align === "center" ? collectOverflowRoom(virtualState, row, rowIndex, dataColIndex, -1) : 0;
	const rightRoom = align !== "right" ? collectOverflowRoom(virtualState, row, rowIndex, dataColIndex, 1) : 0;
	const maxWidth = ownWidth + leftRoom + rightRoom;
	if (maxWidth <= ownWidth) return;
	const width = Math.min(measuredWidth, maxWidth);
	return {
		left: toTextLayerLeft(align, ownWidth, width, leftRoom),
		width
	};
};
var getDataColumnSpanWidth = (virtualState, startDataColIndex, endDataColIndex) => {
	let width = 0;
	for (let index = startDataColIndex; index < endDataColIndex; index += 1) width += getRenderColumnWidth(virtualState.columns[index + 1]);
	return width;
};
var getLeftOverflowMirror = (virtualState, row, rowIndex, targetDataColIndex, zoomScale, documentRef) => {
	if (!isBlankOverflowTarget(virtualState, row, rowIndex, targetDataColIndex)) return;
	const targetColumn = virtualState.columns[targetDataColIndex + 1];
	const targetWidth = getRenderColumnWidth(targetColumn);
	if (!targetWidth) return;
	for (let step = 1; step <= MAX_OVERFLOW_SCAN_COLS; step += 1) {
		const sourceDataColIndex = targetDataColIndex - step;
		if (sourceDataColIndex < 0) break;
		const sourceColumn = virtualState.columns[sourceDataColIndex + 1];
		if (!isVisibleDataColumn(sourceColumn)) break;
		const sourceValue = row[getDataKey(sourceDataColIndex)];
		if (!hasRenderableValue(sourceValue)) {
			if (!isBlankOverflowTarget(virtualState, row, rowIndex, sourceDataColIndex)) break;
			continue;
		}
		const sourceCellKey = getCellKeyByDataColumn(rowIndex, sourceDataColIndex);
		const rawSourceStyle = virtualState.cellCache.get(sourceCellKey);
		const sourceStyle = {
			...scaleCellStyle(rawSourceStyle, zoomScale) || {},
			horizontalAlign: (rawSourceStyle === null || rawSourceStyle === void 0 ? void 0 : rawSourceStyle.horizontalAlign) || (sourceColumn === null || sourceColumn === void 0 ? void 0 : sourceColumn.align),
			verticalAlign: (rawSourceStyle === null || rawSourceStyle === void 0 ? void 0 : rawSourceStyle.verticalAlign) || (sourceColumn === null || sourceColumn === void 0 ? void 0 : sourceColumn.verticalAlign)
		};
		const sourceLayout = getExcelOverflowLayout(virtualState, row, rowIndex, sourceDataColIndex, sourceColumn, sourceStyle, sourceValue, zoomScale, documentRef);
		if (!sourceLayout) return;
		const targetOffset = getDataColumnSpanWidth(virtualState, sourceDataColIndex, targetDataColIndex);
		const sourceTextLeft = sourceLayout.left;
		const sourceTextRight = sourceLayout.left + sourceLayout.width;
		const targetLeft = targetOffset;
		if (sourceTextLeft < targetOffset + targetWidth && sourceTextRight > targetLeft) return {
			value: sourceValue,
			style: sourceStyle,
			overflowLayout: {
				left: sourceLayout.left - targetOffset,
				width: sourceLayout.width
			}
		};
		return;
	}
};
var getBorderScore = (border) => {
	if (!border) return 0;
	return border.width * 100 + (BORDER_STYLE_PRIORITY[border.style] || 1);
};
var getCollapsedBorderStyle = (virtualState, rowIndex, dataColIndex, style, zoomScale) => {
	const previousRow = scaleCellStyle(virtualState.cellCache.get(displayCellKey(rowIndex - 1, dataColIndex + 1)), zoomScale);
	const nextRow = scaleCellStyle(virtualState.cellCache.get(displayCellKey(rowIndex + 1, dataColIndex + 1)), zoomScale);
	const previousCol = scaleCellStyle(virtualState.cellCache.get(displayCellKey(rowIndex, dataColIndex)), zoomScale);
	const nextCol = scaleCellStyle(virtualState.cellCache.get(displayCellKey(rowIndex, dataColIndex + 2)), zoomScale);
	const borderTop = getBorderScore(style.borderTop) >= getBorderScore(previousRow === null || previousRow === void 0 ? void 0 : previousRow.borderBottom) ? style.borderTop : void 0;
	const borderBottom = getBorderScore(style.borderBottom) > getBorderScore(nextRow === null || nextRow === void 0 ? void 0 : nextRow.borderTop) ? style.borderBottom : void 0;
	const borderLeft = getBorderScore(style.borderLeft) >= getBorderScore(previousCol === null || previousCol === void 0 ? void 0 : previousCol.borderRight) ? style.borderLeft : void 0;
	const borderRight = getBorderScore(style.borderRight) > getBorderScore(nextCol === null || nextCol === void 0 ? void 0 : nextCol.borderLeft) ? style.borderRight : void 0;
	return {
		...style,
		borderTop,
		borderRight,
		borderBottom,
		borderLeft
	};
};
var createBorderLine = (documentRef, side, border) => {
	const line = documentRef.createElement("span");
	const half = border.width / 2;
	Object.assign(line.style, {
		position: "absolute",
		pointerEvents: "none",
		boxSizing: "border-box"
	});
	if (side === "top" || side === "bottom") {
		Object.assign(line.style, {
			left: `${-half}px`,
			width: `calc(100% + ${border.width}px)`,
			height: "0"
		});
		line.style[side] = `${-half}px`;
		line.style.borderTop = `${border.width}px ${border.style} ${border.color}`;
	} else {
		Object.assign(line.style, {
			top: `${-half}px`,
			height: `calc(100% + ${border.width}px)`,
			width: "0"
		});
		line.style[side] = `${-half}px`;
		line.style.borderLeft = `${border.width}px ${border.style} ${border.color}`;
	}
	return line;
};
var createTextLayer = (documentRef, value, style, padding) => {
	var _a;
	const text = documentRef.createElement("span");
	Object.assign(text.style, {
		position: "relative",
		zIndex: "1",
		width: "100%",
		height: "100%",
		boxSizing: "border-box",
		display: "flex",
		alignItems: toFlexAlign(style.verticalAlign),
		justifyContent: toFlexJustify(style.horizontalAlign),
		padding: `0 ${padding}px`,
		overflow: "hidden",
		textOverflow: style.wrapText ? "clip" : "ellipsis",
		whiteSpace: style.wrapText ? "pre-wrap" : "nowrap",
		wordBreak: style.wrapText ? "break-word" : "normal",
		lineHeight: `${CELL_LINE_HEIGHT}`,
		textAlign: style.horizontalAlign || "left",
		color: style.color || "inherit",
		font: style.font || BODY_FONT,
		transform: style.shrinkToFit ? "scale(0.92)" : "none",
		transformOrigin: `${style.horizontalAlign || "left"} center`
	});
	if ((_a = style.richText) === null || _a === void 0 ? void 0 : _a.length) {
		const content = documentRef.createElement("span");
		content.dataset.fileViewerRichText = "true";
		Object.assign(content.style, {
			display: "inline-block",
			maxWidth: "100%",
			minWidth: "0",
			whiteSpace: "inherit",
			wordBreak: "inherit"
		});
		style.richText.forEach((run) => {
			const segment = documentRef.createElement("span");
			segment.textContent = run.text;
			segment.dataset.fileViewerRichTextRun = "true";
			if (run.fontFamily) segment.style.fontFamily = run.fontFamily;
			if (run.fontSize) segment.style.fontSize = `${run.fontSize}px`;
			if (run.color) segment.style.color = run.color;
			if (run.bold) segment.style.fontWeight = "bold";
			if (run.italic) segment.style.fontStyle = "italic";
			const decorations = [run.underline ? "underline" : "", run.strike ? "line-through" : ""].filter(Boolean);
			if (decorations.length) segment.style.textDecoration = decorations.join(" ");
			if (run.verticalAlign) segment.style.verticalAlign = run.verticalAlign;
			content.appendChild(segment);
		});
		text.appendChild(content);
	} else text.textContent = getTextValue(value);
	return text;
};
var applyOverflowLayout = (text, overflowLayout) => {
	if (!overflowLayout) return;
	Object.assign(text.style, {
		position: "absolute",
		left: `${overflowLayout.left}px`,
		top: "0",
		width: `${overflowLayout.width}px`,
		overflow: "hidden",
		textOverflow: "clip"
	});
};
var renderCellOverlay = (cellEl, borderStyle, textStyle, textValue, renderText, overflowLayout, zoomScale) => {
	const documentRef = cellEl.ownerDocument;
	cellEl.replaceChildren();
	Object.assign(cellEl.style, {
		pointerEvents: "none",
		overflow: overflowLayout ? "hidden" : "visible",
		background: "transparent"
	});
	const fragment = documentRef.createDocumentFragment();
	if (renderText) {
		const text = createTextLayer(documentRef, textValue, textStyle, scaleNumber(CELL_PADDING, zoomScale));
		applyOverflowLayout(text, overflowLayout);
		fragment.appendChild(text);
	}
	if (borderStyle.borderTop) fragment.appendChild(createBorderLine(documentRef, "top", borderStyle.borderTop));
	if (borderStyle.borderRight) fragment.appendChild(createBorderLine(documentRef, "right", borderStyle.borderRight));
	if (borderStyle.borderBottom) fragment.appendChild(createBorderLine(documentRef, "bottom", borderStyle.borderBottom));
	if (borderStyle.borderLeft) fragment.appendChild(createBorderLine(documentRef, "left", borderStyle.borderLeft));
	cellEl.appendChild(fragment);
};
var normalizeRichTextRuns = (value) => {
	if (!Array.isArray(value)) return;
	const runs = value.flatMap((candidate) => {
		if (!candidate || typeof candidate !== "object") return [];
		const run = candidate;
		if (typeof run.text !== "string" || !run.text) return [];
		const fontSize = typeof run.fontSize === "number" && Number.isFinite(run.fontSize) && run.fontSize > 0 ? run.fontSize : void 0;
		return [{
			text: run.text,
			...typeof run.fontFamily === "string" && run.fontFamily ? { fontFamily: run.fontFamily } : {},
			...fontSize ? { fontSize } : {},
			...typeof run.color === "string" && run.color ? { color: run.color } : {},
			...run.bold ? { bold: true } : {},
			...run.italic ? { italic: true } : {},
			...run.underline ? { underline: true } : {},
			...run.strike ? { strike: true } : {},
			...run.verticalAlign === "sub" || run.verticalAlign === "super" ? { verticalAlign: run.verticalAlign } : {}
		}];
	});
	return runs.length ? runs : void 0;
};
var normalizeCellStyle = (meta) => {
	var _a;
	if (!meta) return;
	const style = meta.style || {};
	const nextStyle = {};
	const richText = normalizeRichTextRuns(meta.richText);
	if (richText) nextStyle.richText = richText;
	if (style.backgroundColor) nextStyle.backgroundColor = style.backgroundColor;
	if (style.color) nextStyle.color = style.color;
	else if (style.backgroundColor && tinycolor(style.backgroundColor).isDark()) nextStyle.color = "#ffffff";
	const font = buildFont(style);
	if (font) nextStyle.font = font;
	else if (style.backgroundColor && tinycolor(style.backgroundColor).isDark()) nextStyle.font = `bold ${TABLE_FONT_SIZE}px ${TABLE_FONT_FAMILY}`;
	const borderTop = getBorderSide(style, "Top");
	if (borderTop) nextStyle.borderTop = borderTop;
	const borderRight = getBorderSide(style, "Right");
	if (borderRight) nextStyle.borderRight = borderRight;
	const borderBottom = getBorderSide(style, "Bottom");
	if (borderBottom) nextStyle.borderBottom = borderBottom;
	const borderLeft = getBorderSide(style, "Left");
	if (borderLeft) nextStyle.borderLeft = borderLeft;
	const horizontalAlign = alignFromClassName(meta.className);
	if (horizontalAlign) nextStyle.horizontalAlign = horizontalAlign;
	const verticalAlign = verticalAlignFromClassName(meta.className);
	if (verticalAlign) nextStyle.verticalAlign = verticalAlign;
	if (hasClassName(meta.className, "htWrap")) nextStyle.wrapText = true;
	if (hasClassName(meta.className, "htShrink")) nextStyle.shrinkToFit = true;
	if (!((_a = nextStyle.richText) === null || _a === void 0 ? void 0 : _a.length) && !nextStyle.backgroundColor && !nextStyle.color && !nextStyle.font && !hasBorder(nextStyle) && !hasTextLayout(nextStyle)) return;
	return nextStyle;
};
var createTableConfig = ({ hostHeight, darkMode = false, resizableColumns = false, resizableRows = false, copySelection, searchCell, sheetDefaults, virtualState, zoomScale = 1 }) => {
	const normalizedScale = normalizeZoomScale(zoomScale);
	const scaledPadding = scaleNumber(CELL_PADDING, normalizedScale);
	const scaledHeaderHeight = scaleNumber(34, normalizedScale);
	const scaledCellHeight = scaleNumber(normalizeRowHeight(sheetDefaults.rowHeight, sheetDefaults.rowHeight), normalizedScale);
	const scaledCellWidth = scaleNumber(sheetDefaults.colWidth, normalizedScale);
	const headerStyle = getIndexCellStyle(normalizedScale, darkMode);
	const loadingStyle = getLoadingCellStyle(normalizedScale, darkMode);
	const spanMethod = ({ rowIndex, colIndex, column }) => {
		if (colIndex === 0) return;
		const key = getCellCacheKey(rowIndex, colIndex, column);
		if (virtualState.mergeCoveredMap.has(key)) return {
			rowspan: 0,
			colspan: 0
		};
		const merge = virtualState.mergeStartMap.get(key);
		if (!merge) return;
		return {
			rowspan: merge.rowspan,
			colspan: merge.colspan
		};
	};
	const headerStyleMethod = () => headerStyle;
	const styleMethod = ({ row, rowIndex, colIndex, column }) => {
		if (colIndex === 0) return headerStyle;
		const currentRow = row;
		if (isHiddenVirtualRow(currentRow)) return;
		if (getRowState(currentRow) !== RowState.Loaded) return loadingStyle;
		const style = scaleCellStyle(virtualState.cellCache.get(getCellCacheKey(rowIndex, colIndex, column)), normalizedScale);
		const match = searchCell === null || searchCell === void 0 ? void 0 : searchCell(rowIndex, getDataColumnIndex(column, colIndex));
		return match ? {
			...style,
			backgroundColor: match === "active" ? "#ffbf47" : "#fff1a8",
			color: "#202124"
		} : style;
	};
	const renderMethod = ({ row, rowIndex, colIndex, column, value }) => {
		const currentRow = row;
		if (colIndex === 0 || isHiddenVirtualRow(currentRow) || getRowState(currentRow) !== RowState.Loaded) return;
		const cellKey = getCellCacheKey(rowIndex, colIndex, column);
		if (virtualState.mergeCoveredMap.has(cellKey)) return;
		const style = scaleCellStyle(virtualState.cellCache.get(cellKey), normalizedScale);
		const dataColIndex = getDataColumnIndex(column, colIndex);
		const measureDocument = typeof document === "undefined" ? void 0 : document;
		const overflowLayout = getExcelOverflowLayout(virtualState, currentRow, rowIndex, dataColIndex, column, style, value, normalizedScale, measureDocument);
		const mirror = !hasRenderableValue(value) ? getLeftOverflowMirror(virtualState, currentRow, rowIndex, dataColIndex, normalizedScale, measureDocument) : void 0;
		const match = searchCell === null || searchCell === void 0 ? void 0 : searchCell(rowIndex, dataColIndex);
		const renderText = shouldRenderTextInOverlay(style, column) || !!overflowLayout || !!mirror || !!match;
		if (!hasBorder(style) && !renderText) return;
		return ((cellEl) => {
			const baseStyle = {
				...style || {},
				font: (style === null || style === void 0 ? void 0 : style.font) || getBodyFont(normalizedScale),
				color: match ? "#202124" : style === null || style === void 0 ? void 0 : style.color,
				horizontalAlign: (style === null || style === void 0 ? void 0 : style.horizontalAlign) || (column === null || column === void 0 ? void 0 : column.align),
				verticalAlign: (style === null || style === void 0 ? void 0 : style.verticalAlign) || (column === null || column === void 0 ? void 0 : column.verticalAlign)
			};
			const collapsedStyle = hasBorder(style) ? getCollapsedBorderStyle(virtualState, rowIndex, dataColIndex, baseStyle, normalizedScale) : baseStyle;
			renderCellOverlay(cellEl, collapsedStyle, (mirror === null || mirror === void 0 ? void 0 : mirror.style) || collapsedStyle, mirror ? mirror.value : value, renderText, (mirror === null || mirror === void 0 ? void 0 : mirror.overflowLayout) || overflowLayout, normalizedScale);
			cellEl.style.boxShadow = match === "active" ? "inset 0 0 0 2px #9a5700" : "";
			if (match) {
				cellEl.dataset.spreadsheetSearch = match;
				cellEl.dataset.spreadsheetRow = `${rowIndex}`;
				cellEl.dataset.spreadsheetCol = `${dataColIndex}`;
				cellEl.style.background = match === "active" ? "#ffbf47" : "#fff1a8";
			} else {
				delete cellEl.dataset.spreadsheetSearch;
				delete cellEl.dataset.spreadsheetRow;
				delete cellEl.dataset.spreadsheetCol;
			}
		});
	};
	return {
		ROW_KEY: "__k",
		DISABLED: true,
		HEIGHT: Math.max(hostHeight, 240),
		MAX_HEIGHT: Math.max(hostHeight, 240),
		HEADER_HEIGHT: scaledHeaderHeight,
		CELL_HEIGHT: scaledCellHeight,
		CELL_WIDTH: scaledCellWidth,
		CELL_PADDING: scaledPadding,
		CELL_LINE_HEIGHT,
		COLUMNS_VERTICAL_ALIGN: "middle",
		HEADER_FONT: getHeaderFont(normalizedScale),
		BODY_FONT: getBodyFont(normalizedScale),
		BORDER_RADIUS: 0,
		BORDER_COLOR: darkMode ? EXCEL_DARK_GRID : EXCEL_GRID,
		HEADER_BG_COLOR: darkMode ? EXCEL_DARK_HEADER_BG : EXCEL_HEADER_BG,
		BODY_BG_COLOR: darkMode ? EXCEL_DARK_BODY_BG : "#ffffff",
		HEADER_TEXT_COLOR: darkMode ? EXCEL_DARK_HEADER_TEXT : EXCEL_HEADER_TEXT,
		BODY_TEXT_COLOR: darkMode ? EXCEL_DARK_BODY_TEXT : "#202124",
		READONLY_COLOR: darkMode ? EXCEL_DARK_BODY_BG : "#ffffff",
		READONLY_TEXT_COLOR: darkMode ? EXCEL_DARK_BODY_TEXT : "#202124",
		EDIT_BG_COLOR: darkMode ? "#18212f" : "#ffffff",
		PLACEHOLDER_COLOR: darkMode ? "#94a3b8" : "#8a94a3",
		SCROLLER_COLOR: darkMode ? "#475569" : "#c1c7d0",
		SCROLLER_FOCUS_COLOR: darkMode ? "#64748b" : "#9aa0a6",
		SELECT_ROW_COL_BG_COLOR: EXCEL_GREEN_SOFT,
		SELECT_AREA_COLOR: "rgba(33, 163, 102, 0.14)",
		SELECT_BORDER_COLOR: EXCEL_GREEN,
		AUTOFILL_POINT_BORDER_COLOR: EXCEL_GREEN,
		ENABLE_SELECTOR: true,
		ENABLE_SELECTOR_SINGLE: false,
		ENABLE_SELECTOR_SPAN_COL: true,
		ENABLE_SELECTOR_SPAN_ROW: true,
		ENABLE_SELECTOR_ALL_ROWS: true,
		ENABLE_SELECTOR_ALL_COLS: true,
		SELECTOR_AREA_MIN_X: DATA_AREA_MIN_COL_INDEX,
		ENABLE_CONTEXT_MENU: false,
		ENABLE_HEADER_CONTEXT_MENU: false,
		ENABLE_AUTOFILL: true,
		ENABLE_AUTOFILL_SPAN_COL: true,
		ENABLE_AUTOFILL_SPAN_ROW: true,
		ENABLE_PASTER: false,
		ENABLE_HISTORY: false,
		ENABLE_RESIZE_COLUMN: resizableColumns,
		ENABLE_RESIZE_COLUMN_TEXT: resizableColumns,
		RESIZE_COLUMN_LINE_COLOR: EXCEL_GREEN,
		RESIZE_COLUMN_TEXT_BG_COLOR: EXCEL_GREEN,
		RESIZE_COLUMN_MIN_WIDTH: 40,
		ENABLE_RESIZE_ROW: resizableRows,
		RESIZE_ROW_LINE_COLOR: EXCEL_GREEN,
		RESIZE_ROW_MIN_HEIGHT: scaleNumber(18, normalizedScale),
		ENABLE_KEYBOARD: true,
		ENABLE_FINDER: false,
		ENABLE_COPY: true,
		BEFORE_COPY_METHOD: copySelection ? (params) => {
			copySelection(params);
		} : void 0,
		BEFORE_AUTOFILL_DATA_METHOD: () => [],
		SPAN_METHOD: spanMethod,
		HEADER_CELL_STYLE_METHOD: headerStyleMethod,
		BODY_CELL_STYLE_METHOD: styleMethod,
		BODY_CELL_RENDER_METHOD: renderMethod,
		BODY_CELL_FORMATTER_METHOD: ({ row, rowIndex, colIndex, column, value }) => {
			if (isHiddenVirtualRow(row)) return "";
			if (colIndex === 0) {
				const displayIndex = rowIndex + 1 - virtualState.indexOffset;
				return displayIndex > 0 ? `${displayIndex}` : "";
			}
			if (getRowState(row) !== RowState.Loaded) return "";
			const currentRow = row;
			const style = scaleCellStyle(virtualState.cellCache.get(getCellCacheKey(rowIndex, colIndex, column)), normalizedScale);
			const dataColIndex = getDataColumnIndex(column, colIndex);
			const measureDocument = typeof document === "undefined" ? void 0 : document;
			const overflowLayout = getExcelOverflowLayout(virtualState, currentRow, rowIndex, dataColIndex, column, style, value, normalizedScale, measureDocument);
			const mirror = !hasRenderableValue(value) ? getLeftOverflowMirror(virtualState, currentRow, rowIndex, dataColIndex, normalizedScale, measureDocument) : void 0;
			if (shouldRenderTextInOverlay(style, column) || overflowLayout || mirror || (searchCell === null || searchCell === void 0 ? void 0 : searchCell(rowIndex, dataColIndex))) return "";
			if (value === null || value === void 0) return "";
			return `${value}`;
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet.js
var EXCEL_IMAGE_SCROLLBAR_GUARD = 18;
var DEFAULT_SPREADSHEET_WORKER_AUTO_THRESHOLD = 1048576;
var E_VIRT_TABLE_STYLE_MARKERS = [
	".e-virt-table-container",
	".e-virt-table-overlayer",
	".e-virt-table-editor",
	".e-virt-table-context-menu"
];
var SPREADSHEET_STYLE_SCOPE = ".excel-wrapper[data-file-viewer-spreadsheet-root]";
var E_VIRT_TABLE_ROTATE_KEYFRAME = "file-viewer-e-virt-table-rotate";
var enableEVirtTableShadowEventTargeting = (context) => {
	const isNativeTarget = context.isTarget.bind(context);
	context.isTarget = (event) => {
		if (isNativeTarget(event)) return true;
		return (typeof event.composedPath === "function" ? event.composedPath() : []).includes(context.containerElement);
	};
};
var scopedSpreadsheetStyle = `
.excel-wrapper{position:relative;width:100%;height:100%;display:flex;flex-direction:column;background:var(--file-viewer-render-surface-background,#fff);color:#172033;font-family:Aptos,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}
.excel-wrapper *{box-sizing:border-box}
.excel-wrapper .table-wrapper{position:relative;width:100%;flex:1;min-height:0;background:#fff;overflow:hidden}
.excel-wrapper .table-host{position:absolute;inset:0}
.excel-wrapper .table-target{width:100%;height:100%}
.excel-wrapper .table-host .e-virt-table-container,.excel-wrapper .table-host .e-virt-table-stage{width:100%!important}
.excel-wrapper .table-host .e-virt-table-container{height:100%!important}
.excel-wrapper .table-host .e-virt-table-stage{overflow:hidden}
.excel-wrapper .sheet-loading{position:absolute;right:18px;bottom:18px;z-index:20;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:14px;background:rgba(33,163,102,.1);border:1px solid rgba(33,163,102,.2);box-shadow:0 8px 20px rgba(33,163,102,.12);color:#1a7f50;font-size:12px;font-weight:700;pointer-events:none}
.excel-wrapper .sheet-loading-dot{width:8px;height:8px;flex-shrink:0;border-radius:999px;background:#21a366;box-shadow:0 0 0 6px rgba(33,163,102,.12);animation:file-viewer-spreadsheet-loading-pulse 1.2s ease-in-out infinite}
.excel-wrapper .sheet-loading-summary{color:#5f6368}
.excel-wrapper .excel-image-viewport{position:absolute;z-index:35;overflow:hidden;pointer-events:none}
.excel-wrapper .excel-image-layer{position:absolute;inset:0 auto auto 0;width:0;height:0;transform-origin:0 0;will-change:transform}
.excel-wrapper .excel-image{position:absolute;display:block;max-width:none;height:auto;object-fit:contain;user-select:none}
.excel-wrapper .excel-chart{position:absolute;display:block;max-width:none;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.08);user-select:none}
.excel-wrapper .excel-chart svg{display:block;width:100%;height:100%;overflow:visible}
.excel-wrapper .excel-image-lightbox{position:absolute;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:clamp(16px,4vw,48px);background:rgba(15,23,42,.9);box-sizing:border-box;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}
.excel-wrapper .excel-image-lightbox[data-open='true']{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
.excel-wrapper .excel-image-lightbox img{display:block;max-width:100%;max-height:100%;object-fit:contain;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.4);transform:scale(.985);transition:transform .18s ease;user-select:none}
.excel-wrapper .excel-image-lightbox[data-open='true'] img{transform:scale(1)}
.excel-wrapper .excel-image-lightbox button{position:absolute;top:16px;right:16px;display:grid;width:40px;height:40px;place-items:center;padding:0;border:1px solid rgba(255,255,255,.7);border-radius:999px;background:rgba(255,255,255,.96);color:#172033;font:400 27px/1 Arial,sans-serif;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.24);transition:background-color .14s ease,transform .14s ease}
.excel-wrapper .excel-image-lightbox button:hover{background:#fff;transform:scale(1.04)}
.excel-wrapper .excel-image-lightbox button:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
.excel-wrapper .loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.96);z-index:999;backdrop-filter:blur(6px)}
.excel-wrapper .loading-card{width:min(100%,460px);display:flex;align-items:center;gap:18px;padding:22px;border-radius:24px;background:rgba(255,255,255,.92);border:1px solid rgba(33,163,102,.1);box-shadow:0 22px 48px rgba(18,36,27,.12)}
.excel-wrapper .loading-brand{flex-shrink:0;width:78px;height:78px;display:flex;align-items:center;justify-content:center;border-radius:22px;background:linear-gradient(135deg,rgba(33,163,102,.14),rgba(33,163,102,.04));color:#1a7f50;font-size:18px;font-weight:900;letter-spacing:0}
.excel-wrapper .loading-copy{min-width:0;flex:1}
.excel-wrapper .loading-kicker{display:block;color:#21a366;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.excel-wrapper .loading-copy strong{display:block;margin-top:6px;color:#183828;font-size:20px;line-height:1.3}
.excel-wrapper .loading-copy p{margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.5}
.excel-wrapper .loading-spinner{width:28px;height:28px;border-radius:999px;border:3px solid rgba(33,163,102,.16);border-top-color:#21a366;animation:file-viewer-spreadsheet-loading-spin .8s linear infinite}
.excel-wrapper .error{position:absolute;left:50%;top:50%;z-index:1000;transform:translate(-50%,-50%);max-width:min(520px,calc(100% - 48px));padding:16px 18px;border-radius:16px;background:#fff7ed;color:#9a3412;border:1px solid rgba(234,88,12,.18);box-shadow:0 18px 42px rgba(154,52,18,.12);font-size:14px;line-height:1.6}
.excel-wrapper .toolbar{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;border-top:1px solid #e5e7eb;background:#f8fafc}
.excel-wrapper .btn-group{min-width:0;max-width:100%;flex:1 1 auto;display:flex;align-items:center;gap:6px;overflow-x:auto;overflow-y:hidden;scrollbar-gutter:stable;scrollbar-width:thin;overscroll-behavior-x:contain}
.excel-wrapper .sheet-tab{flex:0 0 auto;width:max-content;min-width:72px;max-width:min(260px,70vw);height:30px;border:1px solid transparent;border-radius:8px;padding:0 12px;background:transparent;color:#526173;font:inherit;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.excel-wrapper .sheet-tab:hover{background:#edf2f7}
.excel-wrapper .sheet-tab.active{border-color:rgba(33,163,102,.28);background:rgba(33,163,102,.12);color:#137347}
.excel-wrapper .summary{flex:0 0 auto;max-width:42%;overflow:hidden;color:#64748b;font-size:12px;font-weight:700;white-space:nowrap;text-overflow:ellipsis}
.excel-wrapper .hidden{display:none!important}
.excel-wrapper[data-spreadsheet-theme='dark']{color-scheme:dark;background:var(--file-viewer-render-surface-background,#0f172a);color:#e5e7eb}
.excel-wrapper[data-spreadsheet-theme='dark'] .table-wrapper{background:#111827}
.excel-wrapper[data-spreadsheet-theme='dark'] .toolbar{background:#111827;border-color:rgba(148,163,184,.22)}
.excel-wrapper[data-spreadsheet-theme='dark'] .sheet-tab{color:#cbd5e1}
.excel-wrapper[data-spreadsheet-theme='dark'] .sheet-tab:hover{background:#1f2937}
.excel-wrapper[data-spreadsheet-theme='dark'] .sheet-tab.active{border-color:rgba(52,211,153,.38);background:rgba(33,163,102,.2);color:#6ee7b7}
.excel-wrapper[data-spreadsheet-theme='dark'] .summary,.excel-wrapper[data-spreadsheet-theme='dark'] .sheet-loading-summary{color:#94a3b8}
.excel-wrapper[data-spreadsheet-theme='dark'] .loading{background:rgba(2,6,23,.9)}
.excel-wrapper[data-spreadsheet-theme='dark'] .loading-card{border-color:rgba(52,211,153,.2);background:rgba(17,24,39,.96);box-shadow:0 24px 58px rgba(0,0,0,.42)}
.excel-wrapper[data-spreadsheet-theme='dark'] .loading-copy strong{color:#f0fdf4}
.excel-wrapper[data-spreadsheet-theme='dark'] .loading-copy p{color:#94a3b8}
.excel-wrapper[data-spreadsheet-theme='dark'] .error{border-color:rgba(251,146,60,.28);background:#2a1710;color:#fdba74;box-shadow:0 20px 48px rgba(0,0,0,.36)}
@keyframes file-viewer-spreadsheet-loading-spin{to{transform:rotate(360deg)}}
@keyframes file-viewer-spreadsheet-loading-pulse{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1)}}
@media (max-width:720px){.excel-wrapper .toolbar{align-items:stretch;flex-direction:column}.excel-wrapper .btn-group{flex:0 0 auto}.excel-wrapper .summary{max-width:none;white-space:normal}.excel-wrapper .sheet-loading{left:12px;right:12px;bottom:58px;justify-content:center}.excel-wrapper .loading-card{margin:18px;flex-direction:column;text-align:center}.excel-wrapper .excel-image-lightbox button{top:12px;right:12px}}
@media (prefers-reduced-motion:reduce){.excel-wrapper .excel-image-lightbox,.excel-wrapper .excel-image-lightbox img,.excel-wrapper .excel-image-lightbox button{transition:none}}
`.replace(/\.excel-wrapper/g, SPREADSHEET_STYLE_SCOPE);
var isEVirtTableConstructor = (value) => {
	return typeof value === "function";
};
var asModuleRecord = (value) => {
	return value && typeof value === "object" ? value : null;
};
var getEVirtTableGlobalCandidate = () => {
	const globalRecord = typeof globalThis === "undefined" ? null : globalThis;
	return globalRecord === null || globalRecord === void 0 ? void 0 : globalRecord.EVirtTable;
};
var resolveEVirtTableConstructor = (module) => {
	const record = asModuleRecord(module);
	const defaultRecord = asModuleRecord(record === null || record === void 0 ? void 0 : record.default);
	const moduleExportsRecord = asModuleRecord(record === null || record === void 0 ? void 0 : record["module.exports"]);
	const globalCandidate = getEVirtTableGlobalCandidate();
	const constructor = [
		module,
		record === null || record === void 0 ? void 0 : record.default,
		record === null || record === void 0 ? void 0 : record.EVirtTable,
		record === null || record === void 0 ? void 0 : record["module.exports"],
		defaultRecord === null || defaultRecord === void 0 ? void 0 : defaultRecord.default,
		defaultRecord === null || defaultRecord === void 0 ? void 0 : defaultRecord.EVirtTable,
		moduleExportsRecord === null || moduleExportsRecord === void 0 ? void 0 : moduleExportsRecord.default,
		moduleExportsRecord === null || moduleExportsRecord === void 0 ? void 0 : moduleExportsRecord.EVirtTable,
		globalCandidate
	].find(isEVirtTableConstructor);
	if (!constructor) {
		const keys = record ? Object.keys(record).join(", ") : typeof module;
		throw new Error(`Unable to resolve e-virt-table constructor from module exports: ${keys}`);
	}
	return constructor;
};
var isEVirtTableStyleText = (value) => {
	return E_VIRT_TABLE_STYLE_MARKERS.every((marker) => value.includes(marker));
};
var collectEVirtTableStyleDocuments = (documentRef) => [documentRef, typeof document === "undefined" ? null : document].filter((value, index, values) => !!value && values.indexOf(value) === index);
var collectStyleElements = (documents) => documents.flatMap((candidateDocument) => {
	var _a;
	return Array.from(((_a = candidateDocument.head) === null || _a === void 0 ? void 0 : _a.querySelectorAll("style")) || []);
});
var loadedEVirtTableStyleText = "";
var resolveEVirtTableStyleText = (documentRef) => {
	var _a;
	const styles = collectStyleElements(collectEVirtTableStyleDocuments(documentRef));
	for (let index = styles.length - 1; index >= 0; index -= 1) {
		const cssText = ((_a = styles[index]) === null || _a === void 0 ? void 0 : _a.textContent) || "";
		if (isEVirtTableStyleText(cssText)) return cssText;
	}
	return "";
};
var loadEVirtTable = async (documentRef) => {
	const documents = collectEVirtTableStyleDocuments(documentRef);
	const stylesBeforeImport = new Set(collectStyleElements(documents));
	const module = await import("./@pages_filesystem_n_e-virt-table_dist_index__es__js.js");
	const injectedStyles = collectStyleElements(documents).filter((style) => !stylesBeforeImport.has(style) && isEVirtTableStyleText(style.textContent || ""));
	const injectedStyle = injectedStyles[injectedStyles.length - 1];
	if (injectedStyle) loadedEVirtTableStyleText = injectedStyle.textContent || "";
	injectedStyles.forEach((style) => style.remove());
	return {
		constructor: resolveEVirtTableConstructor(module),
		styleText: loadedEVirtTableStyleText || resolveEVirtTableStyleText(documentRef)
	};
};
var scopeEVirtTableStyleText = (cssText, shadow) => {
	const rootScope = shadow ? `:host,${SPREADSHEET_STYLE_SCOPE}` : SPREADSHEET_STYLE_SCOPE;
	const darkScope = shadow ? `:host(.dark),${SPREADSHEET_STYLE_SCOPE}[data-spreadsheet-theme='dark']` : `${SPREADSHEET_STYLE_SCOPE}[data-spreadsheet-theme='dark']`;
	const scopeSelector = (selector) => {
		const normalized = selector.trim();
		if (normalized === ":root") return rootScope;
		if (normalized === ".dark") return darkScope;
		return `${SPREADSHEET_STYLE_SCOPE} ${normalized}`;
	};
	return cssText.replace(/@keyframes\s+rotate\b/g, `@keyframes ${E_VIRT_TABLE_ROTATE_KEYFRAME}`).replace(/animation:\s*rotate\b/g, `animation:${E_VIRT_TABLE_ROTATE_KEYFRAME}`).replace(/(^|})\s*(:root|\.dark|\.e-virt-table-[^{}]+)\{/g, (_match, boundary, selectorList) => {
		return `${boundary}${selectorList.split(",").map(scopeSelector).join(",")}{`;
	});
};
var getTargetWindow = (target) => {
	return target.ownerDocument.defaultView;
};
var getDocumentBaseUrl = (target) => {
	return resolveFileViewerRuntimeAssetBaseUrl(target.ownerDocument);
};
var callListener = (listener, event) => {
	if (!listener) return;
	if (typeof listener === "function") {
		listener(event);
		return;
	}
	listener.handleEvent(event);
};
var MainThreadSpreadsheetWorker = class {
	constructor(targetWindow) {
		this.onmessage = null;
		this.onerror = null;
		this.destroyed = false;
		this.listeners = /* @__PURE__ */ new Map();
		this.parserPromise = null;
		this.context = null;
		this.targetWindow = targetWindow;
	}
	addEventListener(type, listener) {
		var _a;
		if (!this.listeners.has(type)) this.listeners.set(type, /* @__PURE__ */ new Set());
		(_a = this.listeners.get(type)) === null || _a === void 0 || _a.add(listener);
	}
	removeEventListener(type, listener) {
		var _a;
		(_a = this.listeners.get(type)) === null || _a === void 0 || _a.delete(listener);
	}
	terminate() {
		this.destroyed = true;
		this.listeners.clear();
	}
	postMessage(message) {
		this.handleMessage(message);
	}
	async loadParser() {
		if (!this.parserPromise) this.parserPromise = import("./parser-C5GJM8gC.js");
		const parser = await this.parserPromise;
		if (!this.context) this.context = parser.createSpreadsheetParserContext();
		return parser;
	}
	dispatch(type, event) {
		var _a;
		(_a = this.listeners.get(type)) === null || _a === void 0 || _a.forEach((listener) => callListener(listener, event));
	}
	dispatchMessage(data) {
		var _a;
		const targetGlobal = this.targetWindow;
		const MessageEventCtor = (targetGlobal === null || targetGlobal === void 0 ? void 0 : targetGlobal.MessageEvent) || (typeof MessageEvent !== "undefined" ? MessageEvent : void 0);
		const event = MessageEventCtor ? new MessageEventCtor("message", { data }) : {
			type: "message",
			data
		};
		(_a = this.onmessage) === null || _a === void 0 || _a.call(this, event);
		this.dispatch("message", event);
	}
	dispatchError(error) {
		var _a;
		const message = error instanceof Error ? error.message : String(error);
		const targetGlobal = this.targetWindow;
		const ErrorEventCtor = (targetGlobal === null || targetGlobal === void 0 ? void 0 : targetGlobal.ErrorEvent) || (typeof ErrorEvent !== "undefined" ? ErrorEvent : void 0);
		const event = ErrorEventCtor ? new ErrorEventCtor("error", {
			message,
			error
		}) : {
			type: "error",
			message,
			error
		};
		(_a = this.onerror) === null || _a === void 0 || _a.call(this, event);
		this.dispatch("error", event);
	}
	async handleMessage(message) {
		if (this.destroyed) return;
		try {
			const parser = await this.loadParser();
			(await parser.handleSpreadsheetWorkerRequest(this.context || parser.createSpreadsheetParserContext(), message)).forEach((response) => {
				if (!this.destroyed) this.dispatchMessage(response);
			});
		} catch (error) {
			if (!this.destroyed) this.dispatchError(error);
		}
	}
};
var AutoFallbackSpreadsheetWorker = class {
	constructor(primary, createFallback) {
		this.createFallback = createFallback;
		this.onmessage = null;
		this.onerror = null;
		this.destroyed = false;
		this.usingFallback = false;
		this.hasPrimaryMessage = false;
		this.pendingMessages = [];
		this.listeners = /* @__PURE__ */ new Map();
		this.handleMessage = (event) => {
			var _a;
			if (this.destroyed) return;
			if (!this.usingFallback) {
				this.hasPrimaryMessage = true;
				this.pendingMessages.length = 0;
			}
			(_a = this.onmessage) === null || _a === void 0 || _a.call(this, event);
			this.dispatch("message", event);
		};
		this.handleError = (event) => {
			var _a;
			if (this.destroyed) return;
			if (!this.usingFallback && !this.hasPrimaryMessage) {
				this.switchToFallback(event);
				return;
			}
			(_a = this.onerror) === null || _a === void 0 || _a.call(this, event);
			this.dispatch("error", event);
		};
		this.active = primary;
		this.attach(primary);
	}
	addEventListener(type, listener) {
		var _a;
		if (!this.listeners.has(type)) this.listeners.set(type, /* @__PURE__ */ new Set());
		(_a = this.listeners.get(type)) === null || _a === void 0 || _a.add(listener);
	}
	removeEventListener(type, listener) {
		var _a;
		(_a = this.listeners.get(type)) === null || _a === void 0 || _a.delete(listener);
	}
	terminate() {
		this.destroyed = true;
		this.detach(this.active);
		this.active.terminate();
		this.pendingMessages.length = 0;
		this.listeners.clear();
	}
	postMessage(message) {
		if (this.destroyed) return;
		if (!this.usingFallback && !this.hasPrimaryMessage) this.pendingMessages.push(message);
		this.active.postMessage(message);
	}
	attach(worker) {
		worker.addEventListener("message", this.handleMessage);
		worker.addEventListener("error", this.handleError);
	}
	detach(worker) {
		worker.removeEventListener("message", this.handleMessage);
		worker.removeEventListener("error", this.handleError);
	}
	dispatch(type, event) {
		var _a;
		(_a = this.listeners.get(type)) === null || _a === void 0 || _a.forEach((listener) => callListener(listener, event));
	}
	switchToFallback(event) {
		var _a;
		const messages = this.pendingMessages.splice(0);
		this.detach(this.active);
		this.active.terminate();
		this.usingFallback = true;
		this.hasPrimaryMessage = false;
		try {
			this.active = this.createFallback();
			this.attach(this.active);
			console.warn("[file-viewer] Spreadsheet Worker 自动模式启动失败，已回退到主线程解析。", event.message || event.type);
			messages.forEach((message) => this.active.postMessage(message));
		} catch (fallbackError) {
			const targetGlobal = typeof window !== "undefined" ? window : void 0;
			const ErrorEventCtor = (targetGlobal === null || targetGlobal === void 0 ? void 0 : targetGlobal.ErrorEvent) || (typeof ErrorEvent !== "undefined" ? ErrorEvent : void 0);
			const message = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
			const nextEvent = ErrorEventCtor ? new ErrorEventCtor("error", {
				message,
				error: fallbackError
			}) : {
				type: "error",
				message,
				error: fallbackError
			};
			(_a = this.onerror) === null || _a === void 0 || _a.call(this, nextEvent);
			this.dispatch("error", nextEvent);
		}
	}
};
var createMainThreadSpreadsheetWorker = (target) => {
	return new MainThreadSpreadsheetWorker(getTargetWindow(target));
};
var getSpreadsheetWorkerMode = (context) => {
	var _a, _b, _c;
	return (_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.spreadsheet) === null || _b === void 0 ? void 0 : _b.worker) !== null && _c !== void 0 ? _c : "auto";
};
var shouldUseSpreadsheetWorker = (byteLength, context) => {
	var _a;
	const spreadsheetOptions = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.spreadsheet;
	const workerMode = getSpreadsheetWorkerMode(context);
	if (workerMode === true) return true;
	if (workerMode === false) return false;
	return byteLength >= (typeof (spreadsheetOptions === null || spreadsheetOptions === void 0 ? void 0 : spreadsheetOptions.workerAutoThreshold) === "number" && Number.isFinite(spreadsheetOptions.workerAutoThreshold) && spreadsheetOptions.workerAutoThreshold >= 0 ? spreadsheetOptions.workerAutoThreshold : DEFAULT_SPREADSHEET_WORKER_AUTO_THRESHOLD);
};
var wrapAutoSpreadsheetWorker = (worker, target, context) => {
	if (getSpreadsheetWorkerMode(context) !== "auto") return worker;
	return new AutoFallbackSpreadsheetWorker(worker, () => createMainThreadSpreadsheetWorker(target));
};
var createSpreadsheetWorkerFactory = (target, bufferByteLength, context) => {
	return () => {
		var _a;
		if (!shouldUseSpreadsheetWorker(bufferByteLength, context)) return createMainThreadSpreadsheetWorker(target);
		const view = getTargetWindow(target);
		const WorkerCtor = (view === null || view === void 0 ? void 0 : view.Worker) || (typeof Worker !== "undefined" ? Worker : void 0);
		if (!WorkerCtor) return createMainThreadSpreadsheetWorker(target);
		const workerUrl = resolveFileViewerSpreadsheetWorkerUrl((_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.spreadsheet, getDocumentBaseUrl(target));
		try {
			return wrapAutoSpreadsheetWorker(new WorkerCtor(workerUrl, { type: "module" }), target, context);
		} catch (moduleWorkerError) {
			try {
				return wrapAutoSpreadsheetWorker(new WorkerCtor(workerUrl), target, context);
			} catch (classicWorkerError) {
				console.warn("[file-viewer] Spreadsheet Worker 无法创建，已回退到主线程解析。", classicWorkerError || moduleWorkerError);
				return createMainThreadSpreadsheetWorker(target);
			}
		}
	};
};
var createStyle = (documentRef, cssText = scopedSpreadsheetStyle) => {
	const style = documentRef.createElement("style");
	style.textContent = cssText;
	return style;
};
var createEVirtTableStyle = (documentRef, target, cssText) => {
	var _a;
	if (!cssText) throw new Error("Unable to resolve the e-virt-table stylesheet for the spreadsheet render surface.");
	const rootNode = target.getRootNode();
	const ShadowRootCtor = (_a = target.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.ShadowRoot;
	const style = createStyle(documentRef, scopeEVirtTableStyleText(cssText, !!ShadowRootCtor && rootNode instanceof ShadowRootCtor));
	style.dataset.fileViewerVendorStyle = "e-virt-table";
	return style;
};
var setHidden = (element, hidden) => {
	element.classList.toggle("hidden", hidden);
};
var clampZoom = (value) => {
	return Math.min(SPREADSHEET_MAX_ZOOM, Math.max(SPREADSHEET_MIN_ZOOM, Number(value.toFixed(2))));
};
var serializeSpreadsheetCopyCell = (value) => {
	if (value === null || value === void 0) return "";
	const text = `${value}`;
	return /[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
};
var serializeSpreadsheetCopyData = (data) => {
	if (!Array.isArray(data)) return serializeSpreadsheetCopyCell(data);
	return data.map((row) => {
		if (!Array.isArray(row)) return serializeSpreadsheetCopyCell(row);
		return row.map(serializeSpreadsheetCopyCell).join("	");
	}).join("\n");
};
var copyTextWithTextareaFallback = (documentRef, text) => {
	var _a;
	const body = documentRef.body;
	if (!body || typeof documentRef.execCommand !== "function") return false;
	const activeElement = documentRef.activeElement;
	const textarea = documentRef.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "true");
	textarea.setAttribute("aria-hidden", "true");
	Object.assign(textarea.style, {
		position: "fixed",
		top: "0",
		left: "0",
		width: "1px",
		height: "1px",
		padding: "0",
		border: "0",
		opacity: "0",
		pointerEvents: "none"
	});
	body.appendChild(textarea);
	textarea.focus({ preventScroll: true });
	textarea.select();
	textarea.setSelectionRange(0, textarea.value.length);
	let copied = false;
	try {
		copied = documentRef.execCommand("copy");
	} finally {
		textarea.remove();
		(_a = activeElement === null || activeElement === void 0 ? void 0 : activeElement.focus) === null || _a === void 0 || _a.call(activeElement, { preventScroll: true });
	}
	return copied;
};
var writeSpreadsheetClipboard = async (documentRef, text) => {
	var _a;
	const targetWindow = documentRef.defaultView;
	const clipboard = (_a = targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.navigator) === null || _a === void 0 ? void 0 : _a.clipboard;
	if (!!(targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.isSecureContext) && typeof (clipboard === null || clipboard === void 0 ? void 0 : clipboard.writeText) === "function") try {
		await clipboard.writeText(text);
		return true;
	} catch {
		return copyTextWithTextareaFallback(documentRef, text);
	}
	return copyTextWithTextareaFallback(documentRef, text);
};
var renderFileViewerSpreadsheet = async (buffer, target, type, context) => {
	var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
	const documentRef = target.ownerDocument;
	const loadedEVirtTable = await loadEVirtTable(documentRef);
	const EVirtTable = loadedEVirtTable.constructor;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const systemDark = (_c = (_b = (_a = documentRef.defaultView) === null || _a === void 0 ? void 0 : _a.matchMedia) === null || _b === void 0 ? void 0 : _b.call(_a, "(prefers-color-scheme: dark)").matches) !== null && _c !== void 0 ? _c : false;
	const darkMode = resolveFileViewerColorScheme((_d = context === null || context === void 0 ? void 0 : context.options) === null || _d === void 0 ? void 0 : _d.theme, systemDark) === "dark";
	const root = documentRef.createElement("div");
	root.className = "excel-wrapper";
	root.dataset.fileViewerSpreadsheetRoot = "true";
	root.dataset.spreadsheetTheme = darkMode ? "dark" : "light";
	root.dataset.viewerSearchProvider = "spreadsheet";
	root.dataset.viewerZoomProvider = "xlsx";
	const loading = documentRef.createElement("div");
	loading.className = "loading";
	const loadingCard = documentRef.createElement("div");
	loadingCard.className = "loading-card";
	const loadingBrand = documentRef.createElement("div");
	loadingBrand.className = "loading-brand";
	loadingBrand.textContent = "XLSX";
	const loadingCopy = documentRef.createElement("div");
	loadingCopy.className = "loading-copy";
	const loadingKicker = documentRef.createElement("span");
	loadingKicker.className = "loading-kicker";
	loadingKicker.textContent = t("spreadsheet.loading.kicker");
	const loadingTitle = documentRef.createElement("strong");
	loadingTitle.dataset.loadingTitle = "true";
	loadingTitle.textContent = t("spreadsheet.loading.title");
	const loadingHint = documentRef.createElement("p");
	loadingHint.textContent = t("spreadsheet.loading.hint");
	loadingCopy.append(loadingKicker, loadingTitle, loadingHint);
	const loadingSpinner = documentRef.createElement("span");
	loadingSpinner.className = "loading-spinner";
	loadingCard.append(loadingBrand, loadingCopy, loadingSpinner);
	loading.appendChild(loadingCard);
	const error = documentRef.createElement("div");
	error.className = "error hidden";
	const tableWrapper = documentRef.createElement("div");
	tableWrapper.className = "table-wrapper";
	const sheetLoading = documentRef.createElement("div");
	sheetLoading.className = "sheet-loading hidden";
	const sheetLoadingDot = documentRef.createElement("span");
	sheetLoadingDot.className = "sheet-loading-dot";
	const sheetLoadingText = documentRef.createElement("span");
	sheetLoadingText.textContent = t("spreadsheet.loading.streaming");
	const sheetLoadingSummary = documentRef.createElement("span");
	sheetLoadingSummary.className = "sheet-loading-summary";
	sheetLoading.append(sheetLoadingDot, sheetLoadingText, sheetLoadingSummary);
	const tableHostShell = documentRef.createElement("div");
	tableHostShell.className = "table-host";
	const tableHost = documentRef.createElement("div");
	tableHost.className = "table-target";
	const imageViewport = documentRef.createElement("div");
	imageViewport.className = "excel-image-viewport hidden";
	const imageLayer = documentRef.createElement("div");
	imageLayer.className = "excel-image-layer";
	imageViewport.appendChild(imageLayer);
	tableHostShell.append(tableHost, imageViewport);
	tableWrapper.append(sheetLoading, tableHostShell);
	const imageLightbox = documentRef.createElement("div");
	imageLightbox.className = "excel-image-lightbox";
	imageLightbox.dataset.open = "false";
	imageLightbox.setAttribute("role", "dialog");
	imageLightbox.setAttribute("aria-modal", "true");
	imageLightbox.setAttribute("aria-hidden", "true");
	const lightboxImage = documentRef.createElement("img");
	lightboxImage.alt = t("image.lightbox.alt");
	lightboxImage.draggable = false;
	const lightboxCloseButton = documentRef.createElement("button");
	lightboxCloseButton.type = "button";
	lightboxCloseButton.setAttribute("aria-label", t("image.lightbox.close"));
	lightboxCloseButton.textContent = "×";
	imageLightbox.append(lightboxImage, lightboxCloseButton);
	const toolbar = documentRef.createElement("div");
	toolbar.className = "toolbar";
	const sheetTabsBar = documentRef.createElement("div");
	sheetTabsBar.className = "btn-group";
	sheetTabsBar.setAttribute("aria-label", t("spreadsheet.tabs.ariaLabel"));
	const summary = documentRef.createElement("div");
	summary.className = "summary";
	toolbar.append(sheetTabsBar, summary);
	root.append(loading, error, tableWrapper, toolbar, imageLightbox);
	target.replaceChildren(createEVirtTableStyle(documentRef, target, loadedEVirtTable.styleText), createStyle(documentRef), root);
	let sheets = [];
	let sheetIndex = 0;
	let errorMessage = "";
	let totalRows = 0;
	let totalCols = 0;
	let sheetDefaults = { ...DEFAULT_SHEET_DEFAULTS };
	let sheetInitializing = true;
	let hasInitialWindow = false;
	let loadedWindowCount = 0;
	let loadingWindowCount = 0;
	let sheetImages = [];
	let sheetCharts = [];
	let zoom = 1;
	let imageViewportState = {
		scrollX: 0,
		scrollY: 0,
		width: 0,
		height: 0
	};
	let loadingState = true;
	let virtualState = createEmptyVirtualState();
	const sheetStateCache = /* @__PURE__ */ new Map();
	const sheetImageCache = /* @__PURE__ */ new Map();
	const sheetChartCache = /* @__PURE__ */ new Map();
	let table = null;
	let resizeObserver = null;
	let resizeFrame = 0;
	let scrollFrame = 0;
	let layoutRefreshToken = 0;
	const layoutRefreshTimers = [];
	let viewportRange = {
		start: 0,
		end: 0
	};
	let scrollDirection = 1;
	let lastScrollY = 0;
	let sheetSessionId = 0;
	let disposed = false;
	const imageSourceResolver = createSpreadsheetImageSourceResolver(documentRef);
	let imageLightboxPreviousFocus = null;
	let hasNotifiedFirstPaint = false;
	let hasAppliedDefaultInitialFit = false;
	let searchState = createEmptyFileViewerSearchState();
	let searchMatches = [];
	let searchCells = /* @__PURE__ */ new Set();
	let searchOptions = {};
	let searchRequestSequence = 0;
	let latestSearchRequest = 0;
	let pendingSearchJump = null;
	let resolveWorkbookReady = null;
	const workbookReady = new Promise((resolve) => {
		resolveWorkbookReady = resolve;
	});
	const resizableColumns = ((_f = (_e = context === null || context === void 0 ? void 0 : context.options) === null || _e === void 0 ? void 0 : _e.spreadsheet) === null || _f === void 0 ? void 0 : _f.resizableColumns) === true;
	const resizableRows = ((_h = (_g = context === null || context === void 0 ? void 0 : context.options) === null || _g === void 0 ? void 0 : _g.spreadsheet) === null || _h === void 0 ? void 0 : _h.resizableRows) === true;
	const controller = createFileViewerWorkerController(createSpreadsheetWorkerFactory(target, buffer.byteLength, context), { logErrors: false });
	const pendingSearchRequests = /* @__PURE__ */ new Map();
	const getActiveSheet = () => sheets.find((sheet) => sheet.id === sheetIndex);
	const getSheetTabs = () => {
		const visible = sheets.filter((sheet) => !sheet.hidden);
		return visible.length ? visible : sheets;
	};
	const getActiveSheetId = () => {
		var _a;
		return sheetIndex !== null && sheetIndex !== void 0 ? sheetIndex : (_a = sheets[0]) === null || _a === void 0 ? void 0 : _a.id;
	};
	const getColumnLabel = (column) => {
		let value = Math.max(0, column) + 1;
		let label = "";
		while (value > 0) {
			const remainder = (value - 1) % 26;
			label = String.fromCharCode(65 + remainder) + label;
			value = Math.floor((value - 1) / 26);
		}
		return label;
	};
	const createSpreadsheetSearchAnchor = (match, index) => ({
		id: `spreadsheet-cell-${match.sheet}-${match.row}-${match.col}`,
		index,
		line: match.row + 1,
		type: "block",
		label: `${match.sheetName}!${getColumnLabel(match.col)}${match.row + 1}`,
		text: match.text,
		top: match.row * sheetDefaults.rowHeight,
		left: match.col * sheetDefaults.colWidth,
		width: sheetDefaults.colWidth,
		height: sheetDefaults.rowHeight,
		spreadsheet: {
			sheetId: match.sheet,
			row: match.row,
			col: match.col
		}
	});
	const setSearchState = (query, matches, currentIndex = matches.length ? 0 : -1) => {
		const normalizedIndex = matches.length ? (currentIndex % matches.length + matches.length) % matches.length : -1;
		searchMatches = matches;
		searchCells = new Set(matches.map((match) => {
			var _a;
			const cell = (_a = match.anchor) === null || _a === void 0 ? void 0 : _a.spreadsheet;
			return cell ? `${cell.sheetId}:${cell.row}:${cell.col}` : "";
		}));
		searchState = {
			query,
			total: matches.length,
			currentIndex: normalizedIndex,
			current: normalizedIndex >= 0 ? matches[normalizedIndex] : null,
			matches
		};
		table === null || table === void 0 || table.draw();
		return searchState;
	};
	const getSearchCell = (row, col) => {
		var _a, _b;
		if (!searchCells.has(`${getActiveSheetId()}:${row}:${col}`)) return void 0;
		const current = (_b = (_a = searchState.current) === null || _a === void 0 ? void 0 : _a.anchor) === null || _b === void 0 ? void 0 : _b.spreadsheet;
		return (current === null || current === void 0 ? void 0 : current.sheetId) === getActiveSheetId() && current.row === row && current.col === col ? "active" : "match";
	};
	const getHostHeight = () => tableHost.clientHeight || 0;
	const showBlockingLoading = () => !errorMessage && !hasInitialWindow && (loadingState || sheetInitializing);
	const showStreamingLoading = () => !showBlockingLoading() && !errorMessage && hasInitialWindow && loadingWindowCount > 0;
	const scalePx = (value) => Math.max(1, Math.round(value * zoom));
	const scaleRowHeight = (value) => Math.max(.1, Math.round(value * zoom));
	const closeImageLightbox = () => {
		if (imageLightbox.dataset.open !== "true") return;
		imageLightbox.dataset.open = "false";
		imageLightbox.setAttribute("aria-hidden", "true");
		delete imageLightbox.dataset.imageId;
		if (imageLightboxPreviousFocus === null || imageLightboxPreviousFocus === void 0 ? void 0 : imageLightboxPreviousFocus.isConnected) imageLightboxPreviousFocus.focus({ preventScroll: true });
		imageLightboxPreviousFocus = null;
	};
	const openImageLightbox = (image) => {
		imageLightboxPreviousFocus = documentRef.activeElement instanceof HTMLElement ? documentRef.activeElement : null;
		lightboxImage.src = image.src;
		imageSourceResolver.resolve(image).then((source) => {
			if (!disposed && imageLightbox.dataset.imageId === image.id) lightboxImage.src = source;
		});
		imageLightbox.dataset.imageId = image.id;
		imageLightbox.dataset.open = "true";
		imageLightbox.setAttribute("aria-hidden", "false");
		lightboxCloseButton.focus({ preventScroll: true });
	};
	const containsViewportPoint = (item, x, y) => {
		const left = scalePx(item.left) - imageViewportState.scrollX;
		const top = scalePx(item.top) - imageViewportState.scrollY;
		const right = left + scalePx(item.width);
		const bottom = top + scalePx(item.height);
		return x >= left && x <= right && y >= top && y <= bottom;
	};
	const findImageAtViewportPoint = (clientX, clientY) => {
		const viewportRect = imageViewport.getBoundingClientRect();
		const x = clientX - viewportRect.left;
		const y = clientY - viewportRect.top;
		if (x < 0 || y < 0 || x > viewportRect.width || y > viewportRect.height) return;
		if ([...sheetCharts].reverse().some((chart) => containsViewportPoint(chart, x, y))) return;
		return [...sheetImages].reverse().find((image) => containsViewportPoint(image, x, y));
	};
	const handleImageDoubleClick = (event) => {
		const image = findImageAtViewportPoint(event.clientX, event.clientY);
		if (!image) return;
		event.preventDefault();
		event.stopPropagation();
		openImageLightbox(image);
	};
	const handleImageLightboxClick = (event) => {
		if (event.target === imageLightbox) closeImageLightbox();
	};
	const handleImageLightboxKeyDown = (event) => {
		if (event.key === "Escape" && imageLightbox.dataset.open === "true") {
			event.preventDefault();
			closeImageLightbox();
		}
	};
	tableHostShell.addEventListener("dblclick", handleImageDoubleClick, true);
	imageLightbox.addEventListener("click", handleImageLightboxClick);
	lightboxCloseButton.addEventListener("click", closeImageLightbox);
	documentRef.addEventListener("keydown", handleImageLightboxKeyDown);
	const getSheetLoadingText = () => {
		var _a;
		if (!sheets.length) return t("spreadsheet.state.parsingWorkbook");
		const activeName = (_a = getActiveSheet()) === null || _a === void 0 ? void 0 : _a.name;
		return activeName ? t("spreadsheet.state.preparingSheetNamed", { name: activeName }) : t("spreadsheet.state.preparingSheet");
	};
	const getCachedSummary = () => {
		if (!totalRows) return "";
		const cachedRows = Math.min(loadedWindowCount * 500, totalRows);
		return t("spreadsheet.state.cachedRows", {
			cached: cachedRows.toLocaleString(),
			total: totalRows.toLocaleString()
		});
	};
	const getStatusSummary = () => {
		var _a, _b;
		const rows = totalRows || ((_a = getActiveSheet()) === null || _a === void 0 ? void 0 : _a.rowCount) || 0;
		const cols = totalCols || ((_b = getActiveSheet()) === null || _b === void 0 ? void 0 : _b.colCount) || 0;
		if (!rows) return "";
		if (!cols) return t("spreadsheet.state.rows", { rows: rows.toLocaleString() });
		return t("spreadsheet.state.rowsAndColumns", {
			rows: rows.toLocaleString(),
			cols: cols.toLocaleString()
		});
	};
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < SPREADSHEET_MAX_ZOOM,
		canZoomOut: zoom > SPREADSHEET_MIN_ZOOM,
		canReset: zoom !== 1,
		minScale: SPREADSHEET_MIN_ZOOM,
		maxScale: SPREADSHEET_MAX_ZOOM
	});
	const getImageViewportScrollbarGuard = () => {
		const tableContainer = tableHost.querySelector(".e-virt-table-container");
		const vertical = tableContainer ? Math.max(tableContainer.offsetWidth - tableContainer.clientWidth, 0) : 0;
		const horizontal = tableContainer ? Math.max(tableContainer.offsetHeight - tableContainer.clientHeight, 0) : 0;
		return {
			vertical: vertical || EXCEL_IMAGE_SCROLLBAR_GUARD,
			horizontal: horizontal || EXCEL_IMAGE_SCROLLBAR_GUARD
		};
	};
	const renderImages = () => {
		const margin = 240;
		const guard = getImageViewportScrollbarGuard();
		const width = Math.max(imageViewportState.width - scalePx(68) - guard.vertical, 0);
		const height = Math.max(imageViewportState.height - scalePx(34) - guard.horizontal, 0);
		const visibleImages = sheetImages.filter((image) => {
			const x = scalePx(image.left) - imageViewportState.scrollX;
			const y = scalePx(image.top) - imageViewportState.scrollY;
			return x + scalePx(image.width) >= -240 && x <= width + margin && y + scalePx(image.height) >= -240 && y <= height + margin;
		});
		const visibleCharts = sheetCharts.filter((chart) => {
			const x = scalePx(chart.left) - imageViewportState.scrollX;
			const y = scalePx(chart.top) - imageViewportState.scrollY;
			return x + scalePx(chart.width) >= -240 && x <= width + margin && y + scalePx(chart.height) >= -240 && y <= height + margin;
		});
		setHidden(imageViewport, visibleImages.length === 0 && visibleCharts.length === 0);
		Object.assign(imageViewport.style, {
			left: `${scalePx(68)}px`,
			top: `${scalePx(34)}px`,
			right: "auto",
			bottom: "auto",
			width: `${width}px`,
			height: `${height}px`
		});
		imageLayer.style.transform = `translate(${-imageViewportState.scrollX}px, ${-imageViewportState.scrollY}px)`;
		const imageElements = visibleImages.map((image, index) => {
			const element = documentRef.createElement("img");
			element.className = "excel-image";
			element.src = image.src;
			element.alt = image.id;
			element.draggable = false;
			Object.assign(element.style, {
				left: `${scalePx(image.left)}px`,
				top: `${scalePx(image.top)}px`,
				width: `${scalePx(image.width)}px`,
				height: `${scalePx(image.height)}px`
			});
			element.dataset.imageIndex = `${index}`;
			imageSourceResolver.resolve(image).then((source) => {
				if (!disposed && element.isConnected && element.src !== source) element.src = source;
			});
			return element;
		});
		const chartElements = visibleCharts.map((chart) => {
			const element = renderSpreadsheetChart(documentRef, chart);
			Object.assign(element.style, {
				left: `${scalePx(chart.left)}px`,
				top: `${scalePx(chart.top)}px`,
				width: `${scalePx(chart.width)}px`,
				height: `${scalePx(chart.height)}px`
			});
			return element;
		});
		imageLayer.replaceChildren(...imageElements, ...chartElements);
	};
	const scrollActiveSheetIntoView = () => {
		requestAnimationFrame(() => {
			var _a;
			(_a = sheetTabsBar.querySelector(".sheet-tab.active")) === null || _a === void 0 || _a.scrollIntoView({
				block: "nearest",
				inline: "center",
				behavior: "smooth"
			});
		});
	};
	const renderChrome = () => {
		setHidden(loading, !showBlockingLoading());
		const loadingTitle = loading.querySelector("[data-loading-title]");
		if (loadingTitle) loadingTitle.textContent = getSheetLoadingText();
		error.textContent = errorMessage;
		setHidden(error, !errorMessage);
		setHidden(sheetLoading, !showStreamingLoading());
		const cacheText = sheetLoading.querySelector(".sheet-loading-summary");
		if (cacheText) cacheText.textContent = getCachedSummary();
		summary.textContent = getStatusSummary();
		sheetTabsBar.replaceChildren(...getSheetTabs().map((sheet) => {
			const button = documentRef.createElement("button");
			button.type = "button";
			button.className = `sheet-tab${sheetIndex === sheet.id ? " active" : ""}`;
			button.title = sheet.name;
			button.textContent = sheet.name;
			button.setAttribute("aria-pressed", sheetIndex === sheet.id ? "true" : "false");
			button.addEventListener("click", () => handleSheet(sheet.id));
			return button;
		}));
		renderImages();
	};
	const setLoading = (value) => {
		loadingState = value;
		renderChrome();
	};
	const emitWorker = (type, payload) => {
		setLoading(true);
		controller.emit(type, payload);
	};
	const requestWorkbookSearch = (query, options) => new Promise((resolve, reject) => {
		const requestId = ++searchRequestSequence;
		pendingSearchRequests.set(requestId, {
			resolve,
			reject
		});
		controller.emit("searchWorkbook", {
			requestId,
			query,
			caseSensitive: options.caseSensitive === true,
			wholeWord: options.wholeWord === true,
			maxMatches: options.maxMatches
		});
	});
	const applyRowHeight = (row, baseHeight) => {
		row.__baseHeight = baseHeight;
		row._height = scaleRowHeight(baseHeight);
	};
	const syncScaledRowHeights = () => {
		virtualState.rowHeightCache.forEach((height, rowIndex) => {
			const row = virtualState.rows[rowIndex];
			if (row) applyRowHeight(row, height);
		});
	};
	const setZoom = (scale) => {
		zoom = clampZoom(scale);
		syncScaledRowHeights();
		syncTableLayout();
		zoomEmitter.emit();
		renderChrome();
		return getZoomState();
	};
	const getSpreadsheetContentSize = () => {
		const contentWidth = virtualState.columns.reduce((sum, column) => {
			const candidate = column;
			if (candidate.hide) return sum;
			const width = Number(candidate.width);
			return sum + (Number.isFinite(width) && width > 0 ? width : sheetDefaults.colWidth);
		}, 0);
		const defaultRowHeight = normalizeRowHeight(sheetDefaults.rowHeight, DEFAULT_SHEET_DEFAULTS.rowHeight);
		let explicitHeight = 0;
		let explicitRows = 0;
		virtualState.rowHeightCache.forEach((height) => {
			explicitHeight += normalizeRowHeight(height, defaultRowHeight);
			explicitRows += 1;
		});
		return {
			contentWidth,
			contentHeight: 34 + explicitHeight + Math.max(0, virtualState.totalRows - explicitRows) * defaultRowHeight
		};
	};
	const resolveSpreadsheetScale = (request) => {
		var _a, _b;
		const content = getSpreadsheetContentSize();
		const autoMode = request.mode === "auto";
		const viewportWidth = request.viewportWidth || tableHost.clientWidth || 0;
		const viewportHeight = request.viewportHeight || tableHost.clientHeight || 0;
		if (viewportWidth <= 0 || viewportHeight <= 0) return;
		return resolveFileViewerFitScale({
			mode: autoMode ? "width" : request.mode,
			viewportWidth,
			viewportHeight,
			contentWidth: content.contentWidth,
			contentHeight: content.contentHeight,
			currentScale: zoom,
			minScale: (_a = request.minScale) !== null && _a !== void 0 ? _a : SPREADSHEET_MIN_ZOOM,
			maxScale: (_b = request.maxScale) !== null && _b !== void 0 ? _b : autoMode ? 1 : SPREADSHEET_MAX_ZOOM
		});
	};
	const fitSpreadsheet = (request) => {
		if (!virtualState.active || !virtualState.columns.length) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "pending",
			provider: "zoom"
		};
		const scale = resolveSpreadsheetScale(request);
		if (!scale) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "unmeasurable",
			provider: "zoom"
		};
		const state = setZoom(scale);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: state.scale,
			source: request.source,
			provider: "zoom"
		};
	};
	const applyDefaultInitialFit = () => {
		var _a, _b, _c, _d, _e, _f, _g;
		const explicitInitialScale = Number((_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.initialViewState) === null || _b === void 0 ? void 0 : _b.scale) !== null && _c !== void 0 ? _c : (_f = (_e = (_d = context === null || context === void 0 ? void 0 : context.options) === null || _d === void 0 ? void 0 : _d.initialViewState) === null || _e === void 0 ? void 0 : _e.zoom) === null || _f === void 0 ? void 0 : _f.scale);
		if (hasAppliedDefaultInitialFit || ((_g = context === null || context === void 0 ? void 0 : context.options) === null || _g === void 0 ? void 0 : _g.fit) !== void 0 || Number.isFinite(explicitInitialScale) && explicitInitialScale > 0) {
			hasAppliedDefaultInitialFit = true;
			return;
		}
		const scale = resolveSpreadsheetScale({
			mode: "auto",
			resize: "initial",
			padding: 0,
			source: "initial",
			reason: "initial",
			viewportWidth: tableHost.clientWidth || target.clientWidth || 0,
			viewportHeight: tableHost.clientHeight || target.clientHeight || 0,
			container: tableHost
		});
		if (!scale || scale >= zoom) {
			if (scale) hasAppliedDefaultInitialFit = true;
			return;
		}
		zoom = clampZoom(scale);
		syncScaledRowHeights();
		zoomEmitter.emit();
		hasAppliedDefaultInitialFit = true;
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		fit: fitSpreadsheet,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	const syncWindowStats = () => {
		loadedWindowCount = virtualState.loadedWindows.size;
		loadingWindowCount = virtualState.loadingWindows.size;
		renderChrome();
	};
	const syncImageViewport = () => {
		imageViewportState = {
			scrollX: (table === null || table === void 0 ? void 0 : table.ctx.scrollX) || 0,
			scrollY: (table === null || table === void 0 ? void 0 : table.ctx.scrollY) || 0,
			width: tableHost.clientWidth || 0,
			height: tableHost.clientHeight || 0
		};
		renderImages();
	};
	const markCopiedSelection = (params) => {
		var _a, _b, _c, _d;
		const selector = table === null || table === void 0 ? void 0 : table.ctx.selector;
		if (!selector) return;
		selector.xArrCopy = params.xArr.slice();
		selector.yArrCopy = params.yArr.slice();
		(_b = table === null || table === void 0 ? void 0 : (_a = table.ctx).emit) === null || _b === void 0 || _b.call(_a, "copyChange", {
			xArr: selector.xArrCopy,
			yArr: selector.yArrCopy,
			data: params.data
		});
		(_d = table === null || table === void 0 ? void 0 : (_c = table.ctx).emit) === null || _d === void 0 || _d.call(_c, "draw");
	};
	const copySpreadsheetSelection = (params) => {
		const text = serializeSpreadsheetCopyData(params.data);
		writeSpreadsheetClipboard(documentRef, text).then((copied) => {
			if (copied) {
				markCopiedSelection(params);
				return;
			}
			console.error("Spreadsheet copy failed: clipboard fallback returned false.");
		}).catch((error) => {
			console.error("Spreadsheet copy failed:", error);
		});
	};
	const buildTableView = () => ({
		config: createTableConfig({
			hostHeight: getHostHeight(),
			darkMode,
			resizableColumns,
			resizableRows,
			copySelection: copySpreadsheetSelection,
			searchCell: getSearchCell,
			sheetDefaults,
			virtualState,
			zoomScale: zoom
		}),
		columns: getDisplayColumns(virtualState.columns, zoom)
	});
	const resetViewportTracking = () => {
		viewportRange = {
			start: 0,
			end: 0
		};
		scrollDirection = 1;
		lastScrollY = 0;
	};
	const ensureViewportWindows = (startRow, endRow) => {
		if (!virtualState.active || !virtualState.totalRows) return;
		collectWindowStarts({
			startRow,
			endRow,
			direction: scrollDirection,
			totalRows: virtualState.totalRows
		}).forEach((windowStart) => requestWindow(windowStart, true));
	};
	const scheduleViewportLoad = () => {
		if (!table || disposed) return;
		if (scrollFrame) cancelAnimationFrame(scrollFrame);
		scrollFrame = requestAnimationFrame(() => {
			scrollFrame = 0;
			if (!table || !virtualState.active || !virtualState.totalRows || disposed) return;
			const head = Math.max(table.ctx.body.headIndex || 0, 0);
			const tail = Math.max(table.ctx.body.tailIndex || head, head);
			const scrollY = table.ctx.scrollY || 0;
			scrollDirection = scrollY >= lastScrollY ? 1 : -1;
			lastScrollY = scrollY;
			viewportRange = {
				start: head,
				end: tail
			};
			syncImageViewport();
			ensureViewportWindows(head, tail);
		});
	};
	const ensureTable = () => {
		if (table) return table;
		table = new EVirtTable(tableHost, {
			data: [],
			columns: [],
			config: createTableConfig({
				hostHeight: getHostHeight(),
				darkMode,
				resizableColumns,
				resizableRows,
				copySelection: copySpreadsheetSelection,
				searchCell: getSearchCell,
				sheetDefaults,
				virtualState,
				zoomScale: zoom
			})
		});
		enableEVirtTableShadowEventTargeting(table.ctx);
		table.on("onScrollX", scheduleViewportLoad);
		table.on("onScrollY", scheduleViewportLoad);
		table.on("resize", scheduleViewportLoad);
		table.on("resizeColumnChange", handleColumnResizeChange);
		table.on("resizeRowChange", handleRowResizeChange);
		return table;
	};
	const renderTable = (instance, columns = virtualState.columns, rows = virtualState.rows, resetScroll = false) => {
		const view = {
			config: createTableConfig({
				hostHeight: getHostHeight(),
				darkMode,
				resizableColumns,
				resizableRows,
				copySelection: copySpreadsheetSelection,
				searchCell: getSearchCell,
				sheetDefaults,
				virtualState,
				zoomScale: zoom
			}),
			columns: getDisplayColumns(columns, zoom)
		};
		instance.loadConfig(view.config);
		instance.loadColumns(view.columns);
		instance.loadData(rows);
		instance.draw();
		syncImageViewport();
		if (resetScroll) {
			requestAnimationFrame(() => {
				instance.scrollTo(0, 0);
				instance.draw();
				syncImageViewport();
				scheduleViewportLoad();
			});
			return;
		}
		scheduleViewportLoad();
	};
	function syncTableLayout() {
		const instance = ensureTable();
		const { config, columns } = buildTableView();
		instance.loadConfig(config);
		if (virtualState.active && columns.length) instance.loadColumns(columns);
		instance.doLayout();
		instance.draw();
		syncImageViewport();
		scheduleViewportLoad();
	}
	const clearScheduledLayoutRefresh = () => {
		layoutRefreshToken += 1;
		const view = getTargetWindow(target);
		while (layoutRefreshTimers.length) {
			const timer = layoutRefreshTimers.pop();
			if (timer !== void 0) view === null || view === void 0 || view.clearTimeout(timer);
		}
	};
	const refreshTableLayoutWhenVisible = () => {
		if (disposed || !table || !virtualState.active) return;
		const rect = tableHost.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		applyDefaultInitialFit();
		syncTableLayout();
	};
	const scheduleStableFirstPaintRefresh = () => {
		var _a;
		clearScheduledLayoutRefresh();
		const token = layoutRefreshToken;
		const view = getTargetWindow(target);
		if (!view) return;
		[
			0,
			32,
			120,
			300,
			700
		].forEach((delay) => {
			const timer = view.setTimeout(() => {
				const index = layoutRefreshTimers.indexOf(timer);
				if (index >= 0) layoutRefreshTimers.splice(index, 1);
				view.requestAnimationFrame(() => {
					if (token !== layoutRefreshToken) return;
					refreshTableLayoutWhenVisible();
				});
			}, delay);
			layoutRefreshTimers.push(timer);
		});
		(_a = documentRef.fonts) === null || _a === void 0 || _a.ready.then(() => {
			if (token !== layoutRefreshToken) return;
			refreshTableLayoutWhenVisible();
		}).catch(() => {});
	};
	function setColumnWidthByKey(columns, key, width) {
		for (const column of columns) {
			if (`${column.key}` === key) {
				column.width = width;
				return true;
			}
			if (Array.isArray(column.children) && setColumnWidthByKey(column.children, key, width)) return true;
		}
		return false;
	}
	function clearTableResizableHeaderCache() {
		var _a;
		try {
			(_a = table === null || table === void 0 ? void 0 : table.setCustomHeader) === null || _a === void 0 || _a.call(table, { resizableData: {} }, true);
		} catch {}
	}
	function handleColumnResizeChange(event) {
		if (!resizableColumns || disposed) return;
		const key = (event === null || event === void 0 ? void 0 : event.key) === void 0 ? "" : `${event.key}`;
		const displayWidth = Number(event === null || event === void 0 ? void 0 : event.width);
		if (!key || key === "__index" || !Number.isFinite(displayWidth) || displayWidth <= 0) return;
		const baseWidth = Math.max(1, Math.round(displayWidth / Math.max(zoom, .01)));
		if (!setColumnWidthByKey(virtualState.columns, key, Math.max(baseWidth, Math.round(40 / Math.max(zoom, 1))))) return;
		const activeSheetId = getActiveSheetId();
		if (activeSheetId !== void 0) sheetStateCache.set(activeSheetId, virtualState);
		queueMicrotask(() => {
			if (disposed || !table) return;
			clearTableResizableHeaderCache();
			syncTableLayout();
		});
	}
	function handleRowResizeChange(event) {
		if (!resizableRows || disposed) return;
		const rowIndex = Number(event === null || event === void 0 ? void 0 : event.rowIndex);
		const displayHeight = Number(event === null || event === void 0 ? void 0 : event.height);
		if (!Number.isInteger(rowIndex) || rowIndex < 0 || !Number.isFinite(displayHeight) || displayHeight <= 0) return;
		const row = virtualState.rows[rowIndex];
		if (!row) return;
		const baseHeight = normalizeRowHeight(Math.max(18, Math.round(displayHeight / Math.max(zoom, .01))), virtualState.defaults.rowHeight);
		applyRowHeight(row, baseHeight);
		virtualState.rowHeightCache.set(rowIndex, baseHeight);
		const activeSheetId = getActiveSheetId();
		if (activeSheetId !== void 0) sheetStateCache.set(activeSheetId, virtualState);
		syncTableLayout();
	}
	function requestWindow(startRow = 0, silent = true) {
		const sheetId = getActiveSheetId();
		if (sheetId === void 0) return;
		const windowStart = clampWindowStart(startRow, virtualState.totalRows);
		if (virtualState.loadedWindows.has(windowStart) || virtualState.loadingWindows.has(windowStart)) return;
		virtualState.loadingWindows.add(windowStart);
		syncWindowStats();
		if (virtualState.active) {
			markWindowState(virtualState.rows, virtualState.totalRows, windowStart, RowState.Loading);
			table === null || table === void 0 || table.draw();
		}
		errorMessage = "";
		emitWorker("parseSheet", {
			sheet: sheetId,
			startRow: windowStart,
			pageSize: 500,
			sessionId: sheetSessionId
		});
		if (silent) {
			loadingState = false;
			renderChrome();
		}
	}
	const initializeVirtualSheet = (ws) => {
		const meta = ws.meta;
		if (!meta) return;
		const { columns, dataKeys } = buildColumns(ws);
		virtualState = {
			...createEmptyVirtualState(),
			active: true,
			totalRows: meta.totalRows,
			totalCols: meta.totalCols,
			indexOffset: detectIndexOffset(ws),
			defaults: ws.defaults,
			dataKeys,
			rows: buildRows(meta.totalRows),
			columns
		};
		sheetDefaults = ws.defaults;
		totalRows = meta.totalRows;
		totalCols = meta.totalCols;
		syncWindowStats();
	};
	const clearVirtualRow = (row) => {
		virtualState.dataKeys.forEach((key) => {
			delete row[key];
		});
	};
	const applyStructureRowHeights = (rowHeights) => {
		if (!Array.isArray(rowHeights)) return;
		rowHeights.forEach((rawHeight, absoluteRow) => {
			if (rawHeight === void 0) return;
			const row = virtualState.rows[absoluteRow];
			if (!row) return;
			const height = normalizeRowHeight(rawHeight, virtualState.defaults.rowHeight);
			applyRowHeight(row, height);
			virtualState.rowHeightCache.set(absoluteRow, height);
		});
	};
	const applyWindowRows = (ws) => {
		var _a, _b;
		const meta = ws.meta;
		if (!meta) return;
		const rowIndexes = [];
		const endRow = Math.min(meta.endRow, virtualState.totalRows);
		for (let absoluteRow = meta.startRow; absoluteRow < endRow; absoluteRow += 1) {
			const row = virtualState.rows[absoluteRow];
			const relativeRow = absoluteRow - meta.startRow;
			if (!row) continue;
			clearVirtualRow(row);
			(((_a = ws.data) === null || _a === void 0 ? void 0 : _a[relativeRow]) || []).forEach((value, colIndex) => {
				if (value === "" || value === null || value === void 0) return;
				row[getDataKey(colIndex)] = value;
			});
			const windowHeight = getRowHeight(ws.rowHeights, relativeRow, virtualState.defaults.rowHeight);
			const height = normalizeRowHeight(getRowHeight((_b = ws.structure) === null || _b === void 0 ? void 0 : _b.rowHeights, absoluteRow, windowHeight), virtualState.defaults.rowHeight);
			applyRowHeight(row, height);
			row["__s"] = RowState.Loaded;
			virtualState.rowHeightCache.set(absoluteRow, height);
			rowIndexes.push(absoluteRow);
		}
		virtualState.windowRows.set(meta.startRow, rowIndexes);
	};
	const applyWindowCells = (ws) => {
		const meta = ws.meta;
		if (!meta) return;
		const keys = [];
		Object.entries(ws.cell || {}).forEach(([key, value]) => {
			const [row, col] = key.split("-").map(Number);
			const absoluteKey = displayCellKey(meta.startRow + row, col + 1);
			const style = normalizeCellStyle(value);
			if (!style) return;
			virtualState.cellCache.set(absoluteKey, style);
			keys.push(absoluteKey);
		});
		virtualState.windowCells.set(meta.startRow, keys);
	};
	const setSheetMerges = (merges) => {
		virtualState.mergeStartMap.clear();
		virtualState.mergeCoveredMap.clear();
		merges.forEach((merge) => {
			const startKey = displayCellKey(merge.row, merge.col + 1);
			virtualState.mergeStartMap.set(startKey, {
				...merge,
				col: merge.col + 1
			});
			for (let rowOffset = 0; rowOffset < merge.rowspan; rowOffset += 1) for (let colOffset = 0; colOffset < merge.colspan; colOffset += 1) {
				if (rowOffset === 0 && colOffset === 0) continue;
				const coveredKey = displayCellKey(merge.row + rowOffset, merge.col + colOffset + 1);
				virtualState.mergeCoveredMap.set(coveredKey, true);
			}
		});
	};
	const applySheetStructure = (ws) => {
		const structure = ws.structure;
		const mergeList = structure === null || structure === void 0 ? void 0 : structure.merge;
		if (mergeList) setSheetMerges(mergeList);
		else {
			const meta = ws.meta;
			if (meta && !virtualState.mergeStartMap.size) setSheetMerges((ws.merge || []).map((merge) => ({
				...merge,
				row: merge.row + meta.startRow
			})));
		}
		applyStructureRowHeights(structure === null || structure === void 0 ? void 0 : structure.rowHeights);
		if (structure === null || structure === void 0 ? void 0 : structure.images) {
			sheetImages = structure.images;
			const sheetId = getActiveSheetId();
			if (sheetId !== void 0) sheetImageCache.set(sheetId, structure.images);
		}
		if (structure === null || structure === void 0 ? void 0 : structure.charts) {
			sheetCharts = structure.charts;
			const sheetId = getActiveSheetId();
			if (sheetId !== void 0) sheetChartCache.set(sheetId, structure.charts);
		}
	};
	const applyVirtualWindow = (ws) => {
		var _a;
		const meta = ws.meta;
		if (!meta) return;
		const isFirstWindow = !hasInitialWindow;
		if (!virtualState.active) initializeVirtualSheet(ws);
		applySheetStructure(ws);
		applyWindowRows(ws);
		applyWindowCells(ws);
		applyDefaultInitialFit();
		virtualState.loadedWindows.add(meta.startRow);
		virtualState.loadingWindows.delete(meta.startRow);
		syncWindowStats();
		hasInitialWindow = true;
		const activeSheetId = getActiveSheetId();
		if (activeSheetId !== void 0) sheetStateCache.set(activeSheetId, virtualState);
		if (isFirstWindow) renderTable(ensureTable(), virtualState.columns, virtualState.rows, true);
		else table === null || table === void 0 || table.draw();
		loadingState = false;
		sheetInitializing = false;
		renderChrome();
		if (!hasNotifiedFirstPaint) {
			hasNotifiedFirstPaint = true;
			(_a = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _a === void 0 || _a.call(context);
		}
		if (isFirstWindow) scheduleStableFirstPaintRefresh();
		requestPendingSearchWindow();
		flushPendingSearchJump();
		const start = viewportRange.start || meta.startRow;
		const end = Math.max(viewportRange.end, meta.endRow - 1, meta.startRow);
		ensureViewportWindows(start, end);
	};
	const resetViewState = () => {
		errorMessage = "";
		totalRows = 0;
		totalCols = 0;
		sheetDefaults = { ...DEFAULT_SHEET_DEFAULTS };
		sheetImages = [];
		sheetCharts = [];
		virtualState = createEmptyVirtualState();
		hasInitialWindow = false;
		resetViewportTracking();
		syncWindowStats();
		syncImageViewport();
		if (!table) return;
		table.loadColumns([]);
		table.loadData([]);
		table.scrollTo(0, 0);
		table.draw();
	};
	const cacheCurrentSheetState = () => {
		const sheetId = getActiveSheetId();
		if (sheetId === void 0 || !virtualState.active) return;
		sheetStateCache.set(sheetId, virtualState);
	};
	const restoreCachedSheetState = (sheetId) => {
		const cached = sheetStateCache.get(sheetId);
		if (!cached) return false;
		cached.loadingWindows.clear();
		virtualState = cached;
		errorMessage = "";
		totalRows = cached.totalRows;
		totalCols = cached.totalCols;
		sheetDefaults = cached.defaults;
		sheetImages = sheetImageCache.get(sheetId) || [];
		sheetCharts = sheetChartCache.get(sheetId) || [];
		hasInitialWindow = cached.loadedWindows.size > 0;
		sheetInitializing = !hasInitialWindow;
		syncWindowStats();
		queueMicrotask(() => {
			if (disposed) return;
			renderTable(ensureTable(), cached.columns, cached.rows);
			syncImageViewport();
			scheduleStableFirstPaintRefresh();
		});
		return true;
	};
	const startSheetSession = () => {
		const sheetId = getActiveSheetId();
		if (sheetId === void 0) {
			loadingState = false;
			sheetInitializing = false;
			renderChrome();
			return;
		}
		sheetSessionId += 1;
		if (restoreCachedSheetState(sheetId)) {
			loadingState = false;
			renderChrome();
			return;
		}
		sheetInitializing = true;
		resetViewState();
		requestWindow(0, false);
	};
	const getSearchRowTop = (rowIndex) => {
		var _a;
		let top = scalePx(34);
		for (let index = 0; index < rowIndex; index += 1) {
			const height = (_a = virtualState.rowHeightCache.get(index)) !== null && _a !== void 0 ? _a : virtualState.defaults.rowHeight;
			top += scaleRowHeight(height);
		}
		return top;
	};
	function flushPendingSearchJump() {
		const pending = pendingSearchJump;
		if (!pending || pending.sheetId !== getActiveSheetId() || !virtualState.loadedWindows.has(getWindowStart(pending.row, virtualState.totalRows)) || !table) return;
		requestAnimationFrame(() => {
			if (disposed || !table || pendingSearchJump !== pending || pending.sheetId !== getActiveSheetId()) return;
			pendingSearchJump = null;
			const targetTop = Math.max(0, getSearchRowTop(pending.row) - Math.max(0, (tableHost.clientHeight || 0) * .35));
			const columnLeft = getSearchColumnLeft(getDisplayColumns(virtualState.columns, zoom), virtualState.dataKeys[pending.col] || getDataKey(pending.col));
			const targetLeft = columnLeft === void 0 ? table.ctx.scrollX || 0 : Math.max(0, columnLeft - tableHost.clientWidth / 2);
			table.scrollTo(targetLeft, targetTop);
			table.draw();
			syncImageViewport();
			scheduleViewportLoad();
		});
	}
	function requestPendingSearchWindow() {
		const pending = pendingSearchJump;
		if (!pending || pending.sheetId !== getActiveSheetId() || !virtualState.totalRows) return;
		const windowStart = getWindowStart(pending.row, virtualState.totalRows);
		if (virtualState.loadedWindows.has(windowStart)) {
			flushPendingSearchJump();
			return;
		}
		requestWindow(windowStart, false);
	}
	function jumpToSpreadsheetSearchMatch(match) {
		var _a, _b;
		const spreadsheet = (_a = match === null || match === void 0 ? void 0 : match.anchor) === null || _a === void 0 ? void 0 : _a.spreadsheet;
		pendingSearchJump = spreadsheet || null;
		if (!spreadsheet) return;
		if (spreadsheet.sheetId !== getActiveSheetId()) {
			cacheCurrentSheetState();
			sheetIndex = spreadsheet.sheetId;
			renderChrome();
			startSheetSession();
			scrollActiveSheetIntoView();
			const view = getTargetWindow(target);
			(_b = view === null || view === void 0 ? void 0 : view.queueMicrotask) === null || _b === void 0 || _b.call(view, requestPendingSearchWindow);
			return;
		}
		requestPendingSearchWindow();
	}
	function handleSheet(index) {
		if (sheetIndex === index) {
			scrollActiveSheetIntoView();
			return;
		}
		cacheCurrentSheetState();
		sheetIndex = index;
		renderChrome();
		startSheetSession();
		scrollActiveSheetIntoView();
	}
	controller.onWorkerEvent("searchWorkbook", ({ requestId, matches }) => {
		if (typeof requestId !== "number") return;
		const pending = pendingSearchRequests.get(requestId);
		if (!pending) return;
		pendingSearchRequests.delete(requestId);
		pending.resolve(Array.isArray(matches) ? matches : []);
	});
	registerFileViewerSearchProvider(root, {
		async search(query, options = {}) {
			const normalizedQuery = query.replace(/\s+/g, " ").trim();
			searchOptions = options;
			const requestNumber = ++latestSearchRequest;
			if (!normalizedQuery) {
				pendingSearchJump = null;
				return setSearchState("", []);
			}
			await workbookReady;
			const matches = await requestWorkbookSearch(normalizedQuery, searchOptions);
			if (requestNumber !== latestSearchRequest || disposed) return searchState;
			const nextMatches = matches.map((match, index) => ({
				id: `spreadsheet-search-${match.sheet}-${match.row}-${match.col}-${index}`,
				index,
				text: match.matchText,
				anchor: createSpreadsheetSearchAnchor(match, index),
				line: match.row + 1
			}));
			const nextState = setSearchState(normalizedQuery, nextMatches);
			jumpToSpreadsheetSearchMatch(nextState.current);
			return nextState;
		},
		next() {
			if (!searchMatches.length) return searchState;
			const nextState = setSearchState(searchState.query, searchMatches, searchState.currentIndex + 1);
			jumpToSpreadsheetSearchMatch(nextState.current);
			return nextState;
		},
		previous() {
			if (!searchMatches.length) return searchState;
			const nextState = setSearchState(searchState.query, searchMatches, searchState.currentIndex - 1);
			jumpToSpreadsheetSearchMatch(nextState.current);
			return nextState;
		},
		clear() {
			latestSearchRequest += 1;
			pendingSearchJump = null;
			return setSearchState("", []);
		},
		getState() {
			return searchState;
		}
	});
	const emitParseWorkbook = () => {
		var _a, _b;
		emitWorker("parseWorkbook", {
			workbook: buffer,
			fileType: type,
			filename: context === null || context === void 0 ? void 0 : context.filename,
			textEncoding: (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.spreadsheet) === null || _b === void 0 ? void 0 : _b.textEncoding
		});
	};
	controller.onWorkerEvent("sheets", ({ sheets: list }) => {
		sheets = list;
		resolveWorkbookReady === null || resolveWorkbookReady === void 0 || resolveWorkbookReady();
		resolveWorkbookReady = null;
		const firstSheet = list.find((sheet) => !sheet.hidden) || list[0];
		if (firstSheet) {
			sheetIndex = firstSheet.id;
			renderChrome();
			startSheetSession();
			scrollActiveSheetIntoView();
			return;
		}
		sheetInitializing = false;
		loadingState = false;
		renderChrome();
	});
	controller.onWorkerEvent("parseSheet", ({ sessionId, sheet, sheetData: ws }) => {
		if (sessionId !== sheetSessionId || sheet !== getActiveSheetId()) return;
		applyVirtualWindow(ws);
	});
	controller.onWorkerEvent("parseError", ({ sessionId, startRow, message }) => {
		resolveWorkbookReady === null || resolveWorkbookReady === void 0 || resolveWorkbookReady();
		resolveWorkbookReady = null;
		if (sessionId && sessionId !== sheetSessionId) return;
		sheetInitializing = false;
		loadingState = false;
		if (typeof startRow === "number") {
			virtualState.loadingWindows.delete(startRow);
			syncWindowStats();
			if (virtualState.active) {
				markWindowState(virtualState.rows, virtualState.totalRows, startRow, RowState.Placeholder);
				table === null || table === void 0 || table.draw();
			}
		} else {
			virtualState.loadingWindows.clear();
			syncWindowStats();
		}
		errorMessage = message || t("spreadsheet.error.parseFailed");
		renderChrome();
	});
	controller.onWorkerError((event) => {
		sheetInitializing = false;
		loadingState = false;
		errorMessage = event.message || t("spreadsheet.error.workerFailed");
		renderChrome();
	});
	(_j = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _j === void 0 || _j.call(context, {
		print: false,
		exportHtml: false
	});
	(_k = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _k === void 0 || _k.call(context, {
		beforeCapture: async ({ signal }) => {
			while (!hasInitialWindow && !errorMessage && !disposed) {
				if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw signal.reason;
				await new Promise((resolve) => {
					const view = getTargetWindow(target);
					if (view) view.setTimeout(resolve, 16);
					else setTimeout(resolve, 16);
				});
			}
			if (errorMessage) throw new Error(errorMessage);
		},
		getTarget: () => tableWrapper
	});
	ensureTable();
	const ResizeObserverCtor = ((_l = getTargetWindow(target)) === null || _l === void 0 ? void 0 : _l.ResizeObserver) || (typeof ResizeObserver !== "undefined" ? ResizeObserver : void 0);
	if (ResizeObserverCtor) {
		resizeObserver = new ResizeObserverCtor(() => {
			if (resizeFrame) cancelAnimationFrame(resizeFrame);
			resizeFrame = requestAnimationFrame(() => {
				resizeFrame = 0;
				syncTableLayout();
			});
		});
		resizeObserver.observe(tableHost);
	}
	renderChrome();
	emitParseWorkbook();
	return {
		$el: root,
		unmount() {
			var _a, _b;
			disposed = true;
			imageSourceResolver.dispose();
			closeImageLightbox();
			tableHostShell.removeEventListener("dblclick", handleImageDoubleClick, true);
			imageLightbox.removeEventListener("click", handleImageLightboxClick);
			lightboxCloseButton.removeEventListener("click", closeImageLightbox);
			documentRef.removeEventListener("keydown", handleImageLightboxKeyDown);
			if (resizeFrame) cancelAnimationFrame(resizeFrame);
			if (scrollFrame) cancelAnimationFrame(scrollFrame);
			clearScheduledLayoutRefresh();
			resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
			resizeObserver = null;
			pendingSearchJump = null;
			pendingSearchRequests.forEach(({ reject }) => {
				reject(/* @__PURE__ */ new Error("Spreadsheet renderer was unmounted before search completed."));
			});
			pendingSearchRequests.clear();
			resolveWorkbookReady === null || resolveWorkbookReady === void 0 || resolveWorkbookReady();
			resolveWorkbookReady = null;
			unregisterFileViewerSearchProvider(root);
			unregisterFileViewerZoomProvider(root);
			controller.destroy();
			table === null || table === void 0 || table.destroy();
			table = null;
			(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
			(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, null);
		}
	};
};
//#endregion
export { renderFileViewerSpreadsheet as default };
