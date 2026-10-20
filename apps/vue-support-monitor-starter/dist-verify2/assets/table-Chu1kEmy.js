import { $n as normalizeClass, B as h$1, Bn as isFunction, D as createVNode, E as createTextVNode, Hn as isObject, Ht as watch, J as inject, Jn as isString, L as getCurrentInstance, Lt as useSlots, On as unref, Pn as hasOwn, Rn as isArray, St as resolveComponent, Tn as toRefs, Ut as watchEffect, Yt as withDirectives, Z as isVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, ft as onUnmounted, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, pt as onUpdated, qt as withCtx, r as Comment, rr as toDisplayString, rt as onBeforeMount, tt as nextTick, un as isRef, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, f as render } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { t as baseFlatten } from "./_baseFlatten-D6objHuc.js";
import { t as merge } from "./merge-DIljS_69.js";
import { t as get } from "./get-cR0zxN0m.js";
import { t as castArray } from "./castArray-DkZAeVfZ.js";
import { t as debounce } from "./debounce-DfrQLO3V.js";
import { t as map } from "./map-BLFeDwW3.js";
import { a as throwError, f as isNumber, h as isUndefined, i as debugWarn, l as isBoolean, p as isPropAbsent, r as useNamespace, u as isElement } from "./use-namespace-BksmY6RT.js";
import { n as getProp } from "./objects-BYkkqs6t.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
import { h as useResizeObserver, u as useEventListener } from "./dist-Clzx2YUA.js";
import { a as removeClass, i as hasClass, t as addClass } from "./style-D30oR_2q.js";
import { n as rAF } from "./raf-Ck-OXP6t.js";
import { r as useTooltipContentProps, t as ElTooltip } from "./tooltip-DEX5DBfd.js";
import { n as useFormSize } from "./use-form-common-props-DzQ9ZY64.js";
import { n as _plugin_vue_export_helper_default } from "./focus-trap-B31xXeBw.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { a as arrow_right_default, dt as loading_default, o as arrow_up_default, r as arrow_down_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElScrollbar } from "./scrollbar-DRrkTSQ2.js";
import { t as isGreaterThan } from "./numbers-I--Pu7qj.js";
import { r as useGlobalConfig } from "./use-global-config-CwtC64sR.js";
import { r as ElCheckboxGroup, t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/flatMap.js
/**
* Creates a flattened array of values by running each element in `collection`
* thru `iteratee` and flattening the mapped results. The iteratee is invoked
* with three arguments: (value, index|key, collection).
*
* @static
* @memberOf _
* @since 4.0.0
* @category Collection
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} [iteratee=_.identity] The function invoked per iteration.
* @returns {Array} Returns the new flattened array.
* @example
*
* function duplicate(n) {
*   return [n, n];
* }
*
* _.flatMap([1, 2], duplicate);
* // => [1, 1, 2, 2]
*/
function flatMap(collection, iteratee) {
	return baseFlatten(map(collection, iteratee), 1);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/isNull.js
/**
* Checks if `value` is `null`.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Lang
* @param {*} value The value to check.
* @returns {boolean} Returns `true` if `value` is `null`, else `false`.
* @example
*
* _.isNull(null);
* // => true
*
* _.isNull(void 0);
* // => false
*/
function isNull(value) {
	return value === null;
}
//#endregion
//#region ../../node_modules/.pnpm/normalize-wheel-es@1.2.0/node_modules/normalize-wheel-es/dist/index.mjs
var v = !1;
var o;
var f;
var s;
var u;
var d;
var N;
var l;
var p;
var m;
var w;
var D;
var x;
var E;
var M;
var F;
function a() {
	if (!v) {
		v = !0;
		var e = navigator.userAgent, n = /(?:MSIE.(\d+\.\d+))|(?:(?:Firefox|GranParadiso|Iceweasel).(\d+\.\d+))|(?:Opera(?:.+Version.|.)(\d+\.\d+))|(?:AppleWebKit.(\d+(?:\.\d+)?))|(?:Trident\/\d+\.\d+.*rv:(\d+\.\d+))/.exec(e), i = /(Mac OS X)|(Windows)|(Linux)/.exec(e);
		if (x = /\b(iPhone|iP[ao]d)/.exec(e), E = /\b(iP[ao]d)/.exec(e), w = /Android/i.exec(e), M = /FBAN\/\w+;/i.exec(e), F = /Mobile/i.exec(e), D = !!/Win64/.exec(e), n) {
			o = n[1] ? parseFloat(n[1]) : n[5] ? parseFloat(n[5]) : NaN, o && document && document.documentMode && (o = document.documentMode);
			var r = /(?:Trident\/(\d+.\d+))/.exec(e);
			N = r ? parseFloat(r[1]) + 4 : o, f = n[2] ? parseFloat(n[2]) : NaN, s = n[3] ? parseFloat(n[3]) : NaN, u = n[4] ? parseFloat(n[4]) : NaN, u ? (n = /(?:Chrome\/(\d+\.\d+))/.exec(e), d = n && n[1] ? parseFloat(n[1]) : NaN) : d = NaN;
		} else o = f = s = d = u = NaN;
		if (i) {
			if (i[1]) {
				var t = /(?:Mac OS X (\d+(?:[._]\d+)?))/.exec(e);
				l = t ? parseFloat(t[1].replace("_", ".")) : !0;
			} else l = !1;
			p = !!i[2], m = !!i[3];
		} else l = p = m = !1;
	}
}
var _ = {
	ie: function() {
		return a() || o;
	},
	ieCompatibilityMode: function() {
		return a() || N > o;
	},
	ie64: function() {
		return _.ie() && D;
	},
	firefox: function() {
		return a() || f;
	},
	opera: function() {
		return a() || s;
	},
	webkit: function() {
		return a() || u;
	},
	safari: function() {
		return _.webkit();
	},
	chrome: function() {
		return a() || d;
	},
	windows: function() {
		return a() || p;
	},
	osx: function() {
		return a() || l;
	},
	linux: function() {
		return a() || m;
	},
	iphone: function() {
		return a() || x;
	},
	mobile: function() {
		return a() || x || E || w || F;
	},
	nativeApp: function() {
		return a() || M;
	},
	android: function() {
		return a() || w;
	},
	ipad: function() {
		return a() || E;
	}
};
var A = _;
var c = !!(typeof window < "u" && window.document && window.document.createElement);
var h = {
	canUseDOM: c,
	canUseWorkers: typeof Worker < "u",
	canUseEventListeners: c && !!(window.addEventListener || window.attachEvent),
	canUseViewport: c && !!window.screen,
	isInWorker: !c
};
var X;
h.canUseDOM && (X = document.implementation && document.implementation.hasFeature && document.implementation.hasFeature("", "") !== !0);
function S(e, n) {
	if (!h.canUseDOM || n && !("addEventListener" in document)) return !1;
	var i = "on" + e, r = i in document;
	if (!r) {
		var t = document.createElement("div");
		t.setAttribute(i, "return;"), r = typeof t[i] == "function";
	}
	return !r && X && e === "wheel" && (r = document.implementation.hasFeature("Events.wheel", "3.0")), r;
}
var b = S;
var O = 10;
var I = 40;
var P = 800;
function T(e) {
	var n = 0, i = 0, r = 0, t = 0;
	return "detail" in e && (i = e.detail), "wheelDelta" in e && (i = -e.wheelDelta / 120), "wheelDeltaY" in e && (i = -e.wheelDeltaY / 120), "wheelDeltaX" in e && (n = -e.wheelDeltaX / 120), "axis" in e && e.axis === e.HORIZONTAL_AXIS && (n = i, i = 0), r = n * O, t = i * O, "deltaY" in e && (t = e.deltaY), "deltaX" in e && (r = e.deltaX), (r || t) && e.deltaMode && (e.deltaMode == 1 ? (r *= I, t *= I) : (r *= P, t *= P)), r && !n && (n = r < 1 ? -1 : 1), t && !i && (i = t < 1 ? -1 : 1), {
		spinX: n,
		spinY: i,
		pixelX: r,
		pixelY: t
	};
}
T.getEventType = function() {
	return A.firefox() ? "DOMMouseScroll" : b("wheel") ? "wheel" : "mousewheel";
};
var Y = T;
/**
* Checks if an event is supported in the current execution environment.
*
* NOTE: This will not work correctly for non-generic events such as `change`,
* `reset`, `load`, `error`, and `select`.
*
* Borrows from Modernizr.
*
* @param {string} eventNameSuffix Event name, e.g. "click".
* @param {?boolean} capture Check if the capture phase is supported.
* @return {boolean} True if the event is supported.
* @internal
* @license Modernizr 3.0.0pre (Custom Build) | MIT
*/
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/directives/mousewheel/index.mjs
var SCOPE = "_Mousewheel";
var mousewheel = function(element, callback) {
	if (element && element.addEventListener) {
		removeWheelHandler(element);
		const fn = function(event) {
			const normalized = Y(event);
			callback && Reflect.apply(callback, this, [event, normalized]);
		};
		element[SCOPE] = { wheelHandler: fn };
		element.addEventListener("wheel", fn, { passive: true });
	}
};
var removeWheelHandler = (element) => {
	if (element["_Mousewheel"]?.wheelHandler) {
		element.removeEventListener("wheel", element[SCOPE].wheelHandler);
		element[SCOPE] = null;
	}
};
var Mousewheel = {
	beforeMount(el, binding) {
		mousewheel(el, binding.value);
	},
	unmounted(el) {
		removeWheelHandler(el);
	},
	updated(el, binding) {
		if (binding.value !== binding.oldValue) mousewheel(el, binding.value);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table/defaults.mjs
/**
* @deprecated Removed after 3.0.0, Use `TableProps` instead.
*/
var tableProps = {
	/**
	* @description table data
	*/
	data: {
		type: Array,
		default: () => []
	},
	/**
	* @description size of Table
	*/
	size: useSizeProp,
	width: [String, Number],
	/**
	* @description table's height. By default it has an `auto` height. If its value is a number, the height is measured in pixels; if its value is a string, the value will be assigned to element's style.height, the height is affected by external styles
	*/
	height: [String, Number],
	/**
	* @description table's max-height. The legal value is a number or the height in px
	*/
	maxHeight: [String, Number],
	/**
	* @description whether width of column automatically fits its container
	*/
	fit: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether Table is striped
	*/
	stripe: Boolean,
	/**
	* @description whether Table has vertical border
	*/
	border: Boolean,
	/**
	* @description key of row data, used for optimizing rendering. Required if `reserve-selection` is on or display tree data. When its type is String, multi-level access is supported, e.g. `user.info.id`, but `user.info[0].id` is not supported, in which case `Function` should be used
	*/
	rowKey: [String, Function],
	/**
	* @description whether Table header is visible
	*/
	showHeader: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to display a summary row
	*/
	showSummary: Boolean,
	/**
	* @description displayed text for the first column of summary row
	*/
	sumText: String,
	/**
	* @description custom summary method
	*/
	summaryMethod: Function,
	/**
	* @description function that returns custom class names for a row, or a string assigning class names for every row
	*/
	rowClassName: [String, Function],
	/**
	* @description function that returns custom style for a row, or an object assigning custom style for every row
	*/
	rowStyle: [Object, Function],
	/**
	* @description function that returns custom class names for a cell, or a string assigning class names for every cell
	*/
	cellClassName: [String, Function],
	/**
	* @description function that returns custom style for a cell, or an object assigning custom style for every cell
	*/
	cellStyle: [Object, Function],
	/**
	* @description function that returns custom class names for a row in table header, or a string assigning class names for every row in table header
	*/
	headerRowClassName: [String, Function],
	/**
	* @description function that returns custom style for a row in table header, or an object assigning custom style for every row in table header
	*/
	headerRowStyle: [Object, Function],
	/**
	* @description function that returns custom class names for a cell in table header, or a string assigning class names for every cell in table header
	*/
	headerCellClassName: [String, Function],
	/**
	* @description function that returns custom style for a cell in table header, or an object assigning custom style for every cell in table header
	*/
	headerCellStyle: [Object, Function],
	/**
	* @description whether current row is highlighted
	*/
	highlightCurrentRow: Boolean,
	/**
	* @description key of current row, a set only prop
	*/
	currentRowKey: [String, Number],
	/**
	* @description displayed text when data is empty. You can customize this area with `#empty`
	*/
	emptyText: String,
	/**
	* @description set expanded rows by this prop, prop's value is the keys of expand rows, you should set row-key before using this prop
	*/
	expandRowKeys: Array,
	/**
	* @description whether expand all rows by default, works when the table has a column type="expand" or contains tree structure data
	*/
	defaultExpandAll: Boolean,
	/**
	* @description enable expandable rows, works when the table has a column type="expand"
	*/
	rowExpandable: { type: Function },
	/**
	* @description set the default sort column and order. property `prop` is used to set default sort column, property `order` is used to set default sort order
	*/
	defaultSort: Object,
	/**
	* @description the `effect` of the overflow tooltip
	*/
	tooltipEffect: String,
	/**
	* @description the options for the overflow tooltip, [see the following tooltip component](tooltip.html#attributes)
	*/
	tooltipOptions: Object,
	/**
	* @description method that returns rowspan and colspan
	*/
	spanMethod: Function,
	/**
	* @description controls the behavior of master checkbox in multi-select tables when only some rows are selected (but not all). If true, all rows will be selected, else deselected
	*/
	selectOnIndeterminate: {
		type: Boolean,
		default: true
	},
	/**
	* @description horizontal indentation of tree data
	*/
	indent: {
		type: Number,
		default: 16
	},
	/**
	* @description configuration for rendering nested data
	*/
	treeProps: {
		type: Object,
		default: () => {
			return {
				hasChildren: "hasChildren",
				children: "children",
				checkStrictly: false
			};
		}
	},
	/**
	* @description whether to lazy loading data
	*/
	lazy: Boolean,
	/**
	* @description method for loading child row data, only works when `lazy` is true
	*/
	load: Function,
	style: {
		type: [
			String,
			Object,
			Array,
			Boolean
		],
		default: () => ({})
	},
	className: {
		type: String,
		default: ""
	},
	/**
	* @description sets the algorithm used to lay out table cells, rows, and columns
	*/
	tableLayout: {
		type: String,
		default: "fixed"
	},
	/**
	* @description always show scrollbar
	*/
	scrollbarAlwaysOn: Boolean,
	/**
	* @description ensure main axis minimum-size doesn't follow the content
	*/
	flexible: Boolean,
	/**
	* @description whether to hide extra content and show them in a tooltip when hovering on the cell.It will affect all the table columns
	*/
	showOverflowTooltip: {
		type: [Boolean, Object],
		default: void 0
	},
	/**
	* @description function that formats cell tooltip content, works when `show-overflow-tooltip` is `true`
	*/
	tooltipFormatter: Function,
	appendFilterPanelTo: String,
	scrollbarTabindex: {
		type: [Number, String],
		default: void 0
	},
	/**
	* @description whether to allow drag the last column
	*/
	allowDragLastColumn: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to preserve expanded row content in DOM when collapsed
	*/
	preserveExpandedContent: Boolean,
	/**
	* @description whether to use native scrollbars
	*/
	nativeScrollbar: Boolean
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/util.mjs
var tableIdSeed = 1;
var columnIdSeed = 1;
var createTableId = (namespace) => `${namespace}-table_${tableIdSeed++}`;
var createTableColumnId = (parentId) => `${parentId}_column_${columnIdSeed++}`;
var getCell = function(event) {
	return event.target?.closest("td");
};
var orderBy = function(array, sortKey, reverse, sortMethod, sortBy) {
	if (!sortKey && !sortMethod && (!sortBy || isArray(sortBy) && !sortBy.length)) return array;
	if (isString(reverse)) reverse = reverse === "descending" ? -1 : 1;
	else reverse = reverse && reverse < 0 ? -1 : 1;
	const getKey = sortMethod ? null : function(value, index) {
		if (sortBy) return flatMap(castArray(sortBy), (by) => {
			if (isString(by)) return get(value, by);
			else return by(value, index, array);
		});
		if (sortKey !== "$key") {
			if (isObject(value) && "$value" in value) value = value.$value;
		}
		return [isObject(value) ? sortKey ? get(value, sortKey) : null : value];
	};
	const compare = function(a, b) {
		if (sortMethod) return sortMethod(a.value, b.value);
		for (let i = 0, len = a.key?.length ?? 0; i < len; i++) {
			if (a.key?.[i] < b.key?.[i]) return -1;
			if (a.key?.[i] > b.key?.[i]) return 1;
		}
		return 0;
	};
	return array.map((value, index) => {
		return {
			value,
			index,
			key: getKey ? getKey(value, index) : null
		};
	}).sort((a, b) => {
		let order = compare(a, b);
		if (!order) order = a.index - b.index;
		return order * +reverse;
	}).map((item) => item.value);
};
var getColumnById = function(table, columnId) {
	let column = null;
	table.columns.forEach((item) => {
		if (item.id === columnId) column = item;
	});
	return column;
};
var getColumnByKey = function(table, columnKey) {
	let column = null;
	for (let i = 0; i < table.columns.length; i++) {
		const item = table.columns[i];
		if (item.columnKey === columnKey) {
			column = item;
			break;
		}
	}
	if (!column) throwError("ElTable", `No column matching with column-key: ${columnKey}`);
	return column;
};
var getColumnByCell = function(table, cell, namespace) {
	const matches = (cell.className || "").match(new RegExp(`${namespace}-table_[^\\s]+`, "gm"));
	if (matches) return getColumnById(table, matches[0]);
	return null;
};
var getRowIdentity = (row, rowKey) => {
	if (!row) throw new Error("Row is required when get row identity");
	if (isString(rowKey)) {
		if (!rowKey.includes(".")) return `${row[rowKey]}`;
		const key = rowKey.split(".");
		let current = row;
		for (const element of key) current = current[element];
		return `${current}`;
	} else if (isFunction(rowKey)) return rowKey.call(null, row);
	return "";
};
var getKeysMap = function(array, rowKey, flatten = false, childrenKey = "children") {
	const data = array || [];
	const arrayMap = {};
	data.forEach((row, index) => {
		arrayMap[getRowIdentity(row, rowKey)] = {
			row,
			index
		};
		if (flatten) {
			const children = row[childrenKey];
			if (isArray(children)) Object.assign(arrayMap, getKeysMap(children, rowKey, true, childrenKey));
		}
	});
	return arrayMap;
};
function mergeOptions(defaults, config) {
	const options = {};
	let key;
	for (key in defaults) options[key] = defaults[key];
	for (key in config) if (hasOwn(config, key)) {
		const value = config[key];
		if (!isUndefined(value)) options[key] = value;
	}
	return options;
}
function parseWidth(width) {
	if (width === "") return width;
	if (!isUndefined(width)) {
		width = Number.parseInt(width, 10);
		if (Number.isNaN(width)) width = "";
	}
	return width;
}
function parseMinWidth(minWidth) {
	if (minWidth === "") return minWidth;
	if (!isUndefined(minWidth)) {
		minWidth = parseWidth(minWidth);
		if (Number.isNaN(minWidth)) minWidth = 80;
	}
	return minWidth;
}
function parseHeight(height) {
	if (isNumber(height)) return height;
	if (isString(height)) if (/^\d+(?:px)?$/.test(height)) return Number.parseInt(height, 10);
	else return height;
	return null;
}
function compose(...funcs) {
	if (funcs.length === 0) return (arg) => arg;
	if (funcs.length === 1) return funcs[0];
	return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
function toggleRowStatus(statusArr, row, newVal, tableTreeProps, selectable, rowIndex, rowKey) {
	let _rowIndex = rowIndex ?? 0;
	let changed = false;
	const getIndex = () => {
		if (!rowKey) return statusArr.indexOf(row);
		const id = getRowIdentity(row, rowKey);
		return statusArr.findIndex((item) => getRowIdentity(item, rowKey) === id);
	};
	const index = getIndex();
	const included = index !== -1;
	const isRowSelectable = selectable?.call(null, row, _rowIndex);
	const toggleStatus = (type) => {
		if (type === "add") statusArr.push(row);
		else statusArr.splice(index, 1);
		changed = true;
	};
	const getChildrenCount = (row) => {
		let count = 0;
		const children = tableTreeProps?.children && row[tableTreeProps.children];
		if (children && isArray(children)) {
			count += children.length;
			children.forEach((item) => {
				count += getChildrenCount(item);
			});
		}
		return count;
	};
	if (!selectable || isRowSelectable) if (isBoolean(newVal)) {
		if (newVal && !included) toggleStatus("add");
		else if (!newVal && included) toggleStatus("remove");
	} else included ? toggleStatus("remove") : toggleStatus("add");
	if (!tableTreeProps?.checkStrictly && tableTreeProps?.children && isArray(row[tableTreeProps.children])) row[tableTreeProps.children].forEach((item) => {
		const childChanged = toggleRowStatus(statusArr, item, newVal ?? !included, tableTreeProps, selectable, _rowIndex + 1, rowKey);
		_rowIndex += getChildrenCount(item) + 1;
		if (childChanged) changed = childChanged;
	});
	return changed;
}
function walkTreeNode(root, cb, childrenKey = "children", lazyKey = "hasChildren", lazy = false) {
	const isNil = (array) => !(isArray(array) && array.length);
	function _walker(parent, children, level) {
		cb(parent, children, level);
		children.forEach((item) => {
			if (item[lazyKey] && lazy) {
				cb(item, null, level + 1);
				return;
			}
			const children = item[childrenKey];
			if (!isNil(children)) _walker(item, children, level + 1);
		});
	}
	root.forEach((item) => {
		if (item[lazyKey] && lazy) {
			cb(item, null, 0);
			return;
		}
		const children = item[childrenKey];
		if (!isNil(children)) _walker(item, children, 0);
	});
}
var getTableOverflowTooltipProps = (props, innerText, row, column) => {
	const tooltipFormatterContent = isFunction(column?.tooltipFormatter) ? column.tooltipFormatter({
		row,
		column,
		cellValue: getProp(row, column.property).value
	}) : void 0;
	if (isVNode(tooltipFormatterContent)) return {
		slotContent: tooltipFormatterContent,
		content: null,
		strategy: "fixed",
		...props
	};
	return {
		slotContent: null,
		content: tooltipFormatterContent ?? innerText,
		strategy: "fixed",
		...props
	};
};
var removePopper = null;
function createTablePopper(props, popperContent, row, column, trigger, table) {
	const tableOverflowTooltipProps = getTableOverflowTooltipProps(props, popperContent, row, column);
	const mergedProps = {
		...tableOverflowTooltipProps,
		slotContent: void 0
	};
	if (removePopper?.trigger === trigger) {
		const comp = removePopper.vm?.component;
		merge(comp?.props, mergedProps);
		if (comp && tableOverflowTooltipProps.slotContent) comp.slots.content = () => [tableOverflowTooltipProps.slotContent];
		return;
	}
	removePopper?.();
	const parentNode = table?.refs.tableWrapper;
	const ns = parentNode?.dataset.prefix;
	const vm = createVNode(ElTooltip, {
		virtualTriggering: true,
		virtualRef: trigger,
		appendTo: parentNode,
		placement: "top",
		transition: "none",
		offset: 0,
		hideAfter: 0,
		...mergedProps
	}, tableOverflowTooltipProps.slotContent ? { content: () => tableOverflowTooltipProps.slotContent } : void 0);
	vm.appContext = {
		...table.appContext,
		...table
	};
	const container = document.createElement("div");
	render(vm, container);
	vm.component.exposed.onOpen();
	const scrollContainer = parentNode?.querySelector(`.${ns}-scrollbar__wrap`);
	removePopper = () => {
		if (vm.component?.exposed?.onClose) vm.component.exposed.onClose();
		render(null, container);
		const currentRemovePopper = removePopper;
		scrollContainer?.removeEventListener("scroll", currentRemovePopper);
		currentRemovePopper.trigger = void 0;
		currentRemovePopper.vm = void 0;
		removePopper = null;
	};
	removePopper.trigger = trigger ?? void 0;
	removePopper.vm = vm;
	scrollContainer?.addEventListener("scroll", removePopper);
}
function getCurrentColumns(column) {
	if (column.children) return flatMap(column.children, getCurrentColumns);
	else return [column];
}
function getColSpan(colSpan, column) {
	return colSpan + column.colSpan;
}
var isFixedColumn = (index, fixed, store, realColumns) => {
	let start = 0;
	let after = index;
	const columns = store.states.columns.value;
	if (realColumns) {
		const curColumns = getCurrentColumns(realColumns[index]);
		start = columns.slice(0, columns.indexOf(curColumns[0])).reduce(getColSpan, 0);
		after = start + curColumns.reduce(getColSpan, 0) - 1;
	} else start = index;
	let fixedLayout;
	switch (fixed) {
		case "left":
			if (after < store.states.fixedLeafColumnsLength.value) fixedLayout = "left";
			break;
		case "right":
			if (start >= columns.length - store.states.rightFixedLeafColumnsLength.value) fixedLayout = "right";
			break;
		default: if (after < store.states.fixedLeafColumnsLength.value) fixedLayout = "left";
		else if (start >= columns.length - store.states.rightFixedLeafColumnsLength.value) fixedLayout = "right";
	}
	return fixedLayout ? {
		direction: fixedLayout,
		start,
		after
	} : {};
};
var getFixedColumnsClass = (namespace, index, fixed, store, realColumns, offset = 0) => {
	const classes = [];
	const { direction, start, after } = isFixedColumn(index, fixed, store, realColumns);
	if (direction) {
		const isLeft = direction === "left";
		classes.push(`${namespace}-fixed-column--${direction}`);
		if (isLeft && after + offset === store.states.fixedLeafColumnsLength.value - 1) classes.push("is-last-column");
		else if (!isLeft && start - offset === store.states.columns.value.length - store.states.rightFixedLeafColumnsLength.value) classes.push("is-first-column");
	}
	return classes;
};
function getOffset(offset, column) {
	return offset + (isNull(column.realWidth) || Number.isNaN(column.realWidth) ? Number(column.width) : column.realWidth);
}
var getFixedColumnOffset = (index, fixed, store, realColumns) => {
	const { direction, start = 0, after = 0 } = isFixedColumn(index, fixed, store, realColumns);
	if (!direction) return;
	const styles = {};
	const isLeft = direction === "left";
	const columns = store.states.columns.value;
	if (isLeft) styles.left = columns.slice(0, start).reduce(getOffset, 0);
	else styles.right = columns.slice(after + 1).reverse().reduce(getOffset, 0);
	return styles;
};
var ensurePosition = (style, key) => {
	if (!style) return;
	if (!Number.isNaN(style[key])) style[key] = `${style[key]}px`;
};
function ensureValidVNode(vnodes) {
	return vnodes.some((child) => {
		if (!isVNode(child)) return true;
		if (child.type === Comment) return false;
		if (child.type === Fragment && !ensureValidVNode(child.children)) return false;
		return true;
	}) ? vnodes : null;
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/store/expand.mjs
function useExpand(watcherData) {
	const instance = getCurrentInstance();
	const defaultExpandAll = ref(false);
	const expandRows = ref([]);
	const canRowExpand = (row, index) => {
		const expandableFn = instance.store.states.rowExpandable.value;
		return expandableFn?.(row, index) ?? true;
	};
	const updateExpandRows = () => {
		const data = watcherData.data.value || [];
		const rowKey = watcherData.rowKey.value;
		if (defaultExpandAll.value) expandRows.value = instance.store.states.rowExpandable.value ? data.filter(canRowExpand) : data.slice();
		else if (rowKey) {
			const expandRowsMap = getKeysMap(expandRows.value, rowKey);
			expandRows.value = data.filter((row, index) => {
				return !!expandRowsMap[getRowIdentity(row, rowKey)] && canRowExpand(row, index);
			});
		} else expandRows.value = [];
	};
	const toggleRowExpansion = (row, expanded) => {
		const rowIndex = (watcherData.data.value || []).indexOf(row);
		if (rowIndex > -1 && !canRowExpand(row, rowIndex)) return;
		if (toggleRowStatus(expandRows.value, row, expanded, void 0, void 0, void 0, watcherData.rowKey.value)) instance.emit("expand-change", row, expandRows.value.slice());
	};
	const setExpandRowKeys = (rowKeys) => {
		instance.store.assertRowKey();
		const data = watcherData.data.value || [];
		const rowKey = watcherData.rowKey.value;
		const keysMap = getKeysMap(data, rowKey);
		expandRows.value = rowKeys.reduce((prev, cur) => {
			const info = keysMap[cur];
			if (info && canRowExpand(info.row, info.index)) prev.push(info.row);
			return prev;
		}, []);
	};
	const isRowExpanded = (row) => {
		const rowKey = watcherData.rowKey.value;
		if (rowKey) return !!getKeysMap(expandRows.value, rowKey)[getRowIdentity(row, rowKey)];
		return expandRows.value.includes(row);
	};
	return {
		updateExpandRows,
		toggleRowExpansion,
		setExpandRowKeys,
		isRowExpanded,
		states: {
			expandRows,
			defaultExpandAll
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/store/current.mjs
function useCurrent(watcherData) {
	const instance = getCurrentInstance();
	const _currentRowKey = ref(null);
	const currentRow = ref(null);
	const setCurrentRowKey = (key) => {
		instance.store.assertRowKey();
		_currentRowKey.value = key;
		setCurrentRowByKey(key);
	};
	const restoreCurrentRowKey = () => {
		_currentRowKey.value = null;
	};
	const setCurrentRowByKey = (key) => {
		const { data, rowKey } = watcherData;
		const oldCurrentRow = currentRow.value;
		let _currentRow = null;
		if (rowKey.value) _currentRow = (unref(data) || []).find((item) => getRowIdentity(item, rowKey.value) === key) ?? null;
		currentRow.value = _currentRow ?? null;
		instance.emit("current-change", currentRow.value, oldCurrentRow);
	};
	const updateCurrentRow = (_currentRow) => {
		const oldCurrentRow = currentRow.value;
		if (_currentRow && _currentRow !== oldCurrentRow) {
			currentRow.value = _currentRow;
			instance.emit("current-change", currentRow.value, oldCurrentRow);
			return;
		}
		if (!_currentRow && oldCurrentRow) {
			currentRow.value = null;
			instance.emit("current-change", null, oldCurrentRow);
		}
	};
	const updateCurrentRowData = () => {
		const rowKey = watcherData.rowKey.value;
		const data = watcherData.data.value || [];
		const oldCurrentRow = currentRow.value;
		if (oldCurrentRow && !data.includes(oldCurrentRow)) if (rowKey) setCurrentRowByKey(getRowIdentity(oldCurrentRow, rowKey));
		else {
			currentRow.value = null;
			instance.emit("current-change", null, oldCurrentRow);
		}
		else if (_currentRowKey.value) {
			setCurrentRowByKey(_currentRowKey.value);
			restoreCurrentRowKey();
		}
	};
	return {
		setCurrentRowKey,
		restoreCurrentRowKey,
		setCurrentRowByKey,
		updateCurrentRow,
		updateCurrentRowData,
		states: {
			_currentRowKey,
			currentRow
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/store/tree.mjs
function useTree(watcherData) {
	const expandRowKeys = ref([]);
	const treeData = ref({});
	const indent = ref(16);
	const lazy = ref(false);
	const lazyTreeNodeMap = ref({});
	const lazyColumnIdentifier = ref("hasChildren");
	const childrenColumnName = ref("children");
	const checkStrictly = ref(false);
	const instance = getCurrentInstance();
	const normalizedData = computed(() => {
		if (!watcherData.rowKey.value) return {};
		return normalize(watcherData.data.value || []);
	});
	const normalizedLazyNode = computed(() => {
		const rowKey = watcherData.rowKey.value;
		const keys = Object.keys(lazyTreeNodeMap.value);
		const res = {};
		if (!keys.length) return res;
		keys.forEach((key) => {
			if (lazyTreeNodeMap.value[key].length) {
				const item = { children: [] };
				lazyTreeNodeMap.value[key].forEach((row) => {
					const currentRowKey = getRowIdentity(row, rowKey);
					item.children.push(currentRowKey);
					if (row[lazyColumnIdentifier.value] && !res[currentRowKey]) res[currentRowKey] = { children: [] };
				});
				res[key] = item;
			}
		});
		return res;
	});
	const normalize = (data) => {
		const rowKey = watcherData.rowKey.value;
		const res = {};
		walkTreeNode(data, (parent, children, level) => {
			const parentId = getRowIdentity(parent, rowKey);
			if (isArray(children)) res[parentId] = {
				children: children.map((row) => getRowIdentity(row, rowKey)),
				level
			};
			else if (lazy.value) res[parentId] = {
				children: [],
				lazy: true,
				level
			};
		}, childrenColumnName.value, lazyColumnIdentifier.value, lazy.value);
		return res;
	};
	const updateTreeData = (ifChangeExpandRowKeys = false, ifExpandAll) => {
		ifExpandAll ||= instance.store?.states.defaultExpandAll.value;
		const nested = normalizedData.value;
		const normalizedLazyNode_ = normalizedLazyNode.value;
		const keys = Object.keys(nested);
		const newTreeData = {};
		if (keys.length) {
			const oldTreeData = unref(treeData);
			const rootLazyRowKeys = [];
			const getExpanded = (oldValue, key) => {
				if (ifChangeExpandRowKeys) if (expandRowKeys.value) return ifExpandAll || expandRowKeys.value.includes(key);
				else return !!(ifExpandAll || oldValue?.expanded);
				else {
					const included = ifExpandAll || expandRowKeys.value && expandRowKeys.value.includes(key);
					return !!(oldValue?.expanded || included);
				}
			};
			keys.forEach((key) => {
				const oldValue = oldTreeData[key];
				const newValue = { ...nested[key] };
				newValue.expanded = getExpanded(oldValue, key);
				if (newValue.lazy) {
					const { loaded = false, loading = false } = oldValue || {};
					newValue.loaded = !!loaded;
					newValue.loading = !!loading;
					rootLazyRowKeys.push(key);
				}
				newTreeData[key] = newValue;
			});
			const lazyKeys = Object.keys(normalizedLazyNode_);
			if (lazy.value && lazyKeys.length && rootLazyRowKeys.length) lazyKeys.forEach((key) => {
				const oldValue = oldTreeData[key];
				const lazyNodeChildren = normalizedLazyNode_[key].children;
				if (rootLazyRowKeys.includes(key)) {
					if (newTreeData[key].children?.length !== 0) throw new Error("[ElTable]children must be an empty array.");
					newTreeData[key].children = lazyNodeChildren;
				} else {
					const { loaded = false, loading = false } = oldValue || {};
					newTreeData[key] = {
						lazy: true,
						loaded: !!loaded,
						loading: !!loading,
						expanded: getExpanded(oldValue, key),
						children: lazyNodeChildren,
						level: void 0
					};
				}
			});
		}
		treeData.value = newTreeData;
		instance.store?.updateTableScrollY();
	};
	watch(() => expandRowKeys.value, () => {
		updateTreeData(true);
	}, { deep: true });
	watch(() => normalizedData.value, () => {
		updateTreeData();
	});
	watch(() => normalizedLazyNode.value, () => {
		updateTreeData();
	});
	const updateTreeExpandKeys = (value) => {
		expandRowKeys.value = value;
		updateTreeData();
	};
	const isUseLazy = (data) => {
		return lazy.value && data && "loaded" in data && !data.loaded;
	};
	const toggleTreeExpansion = (row, expanded) => {
		instance.store.assertRowKey();
		const rowKey = watcherData.rowKey.value;
		const id = getRowIdentity(row, rowKey);
		const data = id && treeData.value[id];
		if (id && data && "expanded" in data) {
			const oldExpanded = data.expanded;
			expanded = isUndefined(expanded) ? !data.expanded : expanded;
			treeData.value[id].expanded = expanded;
			if (oldExpanded !== expanded) instance.emit("expand-change", row, expanded);
			expanded && isUseLazy(data) && loadData(row, id, data);
			instance.store.updateTableScrollY();
		}
	};
	const loadOrToggle = (row) => {
		instance.store.assertRowKey();
		const rowKey = watcherData.rowKey.value;
		const id = getRowIdentity(row, rowKey);
		const data = treeData.value[id];
		if (isUseLazy(data)) loadData(row, id, data);
		else toggleTreeExpansion(row, void 0);
	};
	const loadData = (row, key, treeNode) => {
		const { load } = instance.props;
		if (load && !treeData.value[key].loaded) {
			treeData.value[key].loading = true;
			load(row, treeNode, (data) => {
				if (!isArray(data)) throw new TypeError("[ElTable] data must be an array");
				treeData.value[key].loading = false;
				treeData.value[key].loaded = true;
				treeData.value[key].expanded = true;
				if (data.length) lazyTreeNodeMap.value = {
					...lazyTreeNodeMap.value,
					[key]: data
				};
				instance.emit("expand-change", row, true);
			});
		}
	};
	const updateKeyChildren = (key, data) => {
		const { lazy, rowKey } = instance.props;
		if (!lazy) return;
		if (!rowKey) throw new Error("[Table] rowKey is required in updateKeyChild");
		if (lazyTreeNodeMap.value[key]) lazyTreeNodeMap.value = {
			...lazyTreeNodeMap.value,
			[key]: data
		};
	};
	return {
		loadData,
		loadOrToggle,
		toggleTreeExpansion,
		updateTreeExpandKeys,
		updateTreeData,
		updateKeyChildren,
		normalize,
		states: {
			expandRowKeys,
			treeData,
			indent,
			lazy,
			lazyTreeNodeMap,
			lazyColumnIdentifier,
			childrenColumnName,
			checkStrictly
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/store/watcher.mjs
var sortData = (data, states) => {
	const sortingColumn = states.sortingColumn;
	if (!sortingColumn || isString(sortingColumn.sortable)) return data;
	return orderBy(data, states.sortProp, states.sortOrder, sortingColumn.sortMethod, sortingColumn.sortBy);
};
var doFlattenColumns = (columns) => {
	const result = [];
	columns.forEach((column) => {
		if (column.children && column.children.length > 0) result.push.apply(result, doFlattenColumns(column.children));
		else result.push(column);
	});
	return result;
};
function useWatcher$1() {
	const instance = getCurrentInstance();
	const { size: tableSize } = toRefs(instance.proxy?.$props);
	const rowKey = ref(null);
	const data = ref([]);
	const _data = ref([]);
	const isComplex = ref(false);
	const _columns = ref([]);
	const originColumns = ref([]);
	const columns = ref([]);
	const fixedColumns = ref([]);
	const rightFixedColumns = ref([]);
	const leafColumns = ref([]);
	const fixedLeafColumns = ref([]);
	const rightFixedLeafColumns = ref([]);
	const updateOrderFns = [];
	const leafColumnsLength = ref(0);
	const fixedLeafColumnsLength = ref(0);
	const rightFixedLeafColumnsLength = ref(0);
	const isAllSelected = ref(false);
	const selection = ref([]);
	const selectionIndeterminate = ref({});
	const reserveSelection = ref(false);
	const selectOnIndeterminate = ref(false);
	const selectable = ref(null);
	const rowExpandable = ref(null);
	const filters = ref({});
	const filteredData = ref(null);
	const sortingColumn = ref(null);
	const sortProp = ref(null);
	const sortOrder = ref(null);
	const hoverRow = ref(null);
	let halfSelection = [];
	const selectedMap = computed(() => {
		return rowKey.value ? getKeysMap(selection.value, rowKey.value) : void 0;
	});
	const getRowChildren = (row) => {
		const { childrenColumnName, lazyTreeNodeMap } = instance.store.states;
		const inlineChildren = row[childrenColumnName.value] ?? [];
		if (!rowKey.value) return inlineChildren;
		const id = getRowIdentity(row, rowKey.value);
		return [...lazyTreeNodeMap.value?.[id] ?? [], ...inlineChildren];
	};
	watch(data, () => {
		if (instance.state) {
			scheduleLayout(false);
			if (instance.props.tableLayout === "auto") instance.refs.tableHeaderRef?.updateFixedColumnStyle();
		}
	}, { deep: true });
	const assertRowKey = () => {
		if (!rowKey.value) throw new Error("[ElTable] prop row-key is required");
	};
	const updateChildFixed = (column) => {
		column.children?.forEach((childColumn) => {
			childColumn.fixed = column.fixed;
			updateChildFixed(childColumn);
		});
	};
	const updateColumns = () => {
		_columns.value.forEach((column) => {
			updateChildFixed(column);
		});
		fixedColumns.value = _columns.value.filter((column) => [true, "left"].includes(column.fixed));
		const selectColumn = _columns.value.find((column) => column.type === "selection");
		let selectColFixLeft;
		if (selectColumn && selectColumn.fixed !== "right" && !fixedColumns.value.includes(selectColumn)) {
			if (_columns.value.indexOf(selectColumn) === 0 && fixedColumns.value.length) {
				fixedColumns.value.unshift(selectColumn);
				selectColFixLeft = true;
			}
		}
		rightFixedColumns.value = _columns.value.filter((column) => column.fixed === "right");
		const notFixedColumns = _columns.value.filter((column) => (selectColFixLeft ? column.type !== "selection" : true) && !column.fixed);
		originColumns.value = Array.from(fixedColumns.value).concat(notFixedColumns).concat(rightFixedColumns.value);
		const leafColumns = doFlattenColumns(notFixedColumns);
		const fixedLeafColumns = doFlattenColumns(fixedColumns.value);
		const rightFixedLeafColumns = doFlattenColumns(rightFixedColumns.value);
		leafColumnsLength.value = leafColumns.length;
		fixedLeafColumnsLength.value = fixedLeafColumns.length;
		rightFixedLeafColumnsLength.value = rightFixedLeafColumns.length;
		columns.value = Array.from(fixedLeafColumns).concat(leafColumns).concat(rightFixedLeafColumns);
		isComplex.value = fixedColumns.value.length > 0 || rightFixedColumns.value.length > 0;
	};
	const scheduleLayout = (needUpdateColumns, immediate = false) => {
		if (needUpdateColumns) updateColumns();
		if (immediate) instance.state.doLayout();
		else instance.state.debouncedUpdateLayout();
	};
	const isSelected = (row) => {
		if (selectedMap.value) return !!selectedMap.value[getRowIdentity(row, rowKey.value)];
		else return selection.value.includes(row);
	};
	const rowIndexMap = computed(() => {
		const map = /* @__PURE__ */ new Map();
		if (!rowKey.value || !selectable.value) return map;
		let index = 0;
		const _traverse = (rows) => {
			if (!isArray(rows)) return;
			rows.forEach((row) => {
				const id = getRowIdentity(row, rowKey.value);
				map.set(id, index);
				index += 1;
				const children = getRowChildren(row);
				if (children.length) _traverse(children);
			});
		};
		_traverse(data.value || []);
		return map;
	});
	const updateSelectionByChildren = (options = {}) => {
		const { emitChange = true } = options;
		if (treeStates.checkStrictly.value || !rowKey.value) {
			selectionIndeterminate.value = {};
			halfSelection = [];
			return;
		}
		const rowKeyValue = rowKey.value;
		const rowIndexMapValue = options.rowIndexMap ?? rowIndexMap.value;
		const selectableFn = selectable.value;
		const rowIdCache = /* @__PURE__ */ new WeakMap();
		const getCachedRowId = (row) => {
			const cachedId = rowIdCache.get(row);
			if (cachedId) return cachedId;
			const id = getRowIdentity(row, rowKeyValue);
			rowIdCache.set(row, id);
			return id;
		};
		const indeterminateMap = {};
		const nextHalfSelection = [];
		const selectedIdSet = new Set(selection.value.map((row) => getCachedRowId(row)));
		const rowsToAdd = [];
		let selectionChanged = false;
		const _updateSelectionForRow = (row, id, selected) => {
			const isRowSelected = selectedIdSet.has(id);
			if (selected && !isRowSelected) {
				rowsToAdd.push(row);
				selectedIdSet.add(id);
				selectionChanged = true;
			} else if (!selected && isRowSelected) {
				selectedIdSet.delete(id);
				selectionChanged = true;
			}
		};
		const _walk = (rows) => {
			let selectedCount = 0;
			let selectableCount = 0;
			if (!isArray(rows)) return {
				selectedCount,
				selectableCount
			};
			rows.forEach((row) => {
				const id = getCachedRowId(row);
				const children = getRowChildren(row);
				let childSelectedCount = 0;
				let childSelectableCount = 0;
				if (children.length) {
					const childResult = _walk(children);
					childSelectedCount = childResult.selectedCount;
					childSelectableCount = childResult.selectableCount;
				}
				const rowSelectable = selectableFn ? selectableFn.call(null, row, rowIndexMapValue.get(id) ?? 0) : true;
				if (rowSelectable) {
					if (childSelectableCount > 0) {
						const allSelected = childSelectedCount === childSelectableCount;
						if (!allSelected && !(childSelectedCount === 0)) {
							indeterminateMap[id] = true;
							nextHalfSelection.push(row);
						}
						_updateSelectionForRow(row, id, allSelected);
					}
				}
				if (rowSelectable) {
					selectableCount += 1;
					if (selectedIdSet.has(id)) selectedCount += 1;
				}
				selectedCount += childSelectedCount;
				selectableCount += childSelectableCount;
			});
			return {
				selectedCount,
				selectableCount
			};
		};
		_walk(data.value || []);
		if (selectionChanged) {
			const nextSelection = selection.value.filter((row) => selectedIdSet.has(getCachedRowId(row)));
			rowsToAdd.forEach((row) => {
				if (!selectedIdSet.has(getCachedRowId(row))) return;
				nextSelection.push(row);
			});
			selection.value = nextSelection;
		}
		selectionIndeterminate.value = indeterminateMap;
		halfSelection = nextHalfSelection;
		if (selectionChanged && emitChange) instance.emit("selection-change", selection.value ? selection.value.slice() : []);
	};
	const clearSelection = () => {
		isAllSelected.value = false;
		const oldSelection = selection.value;
		selection.value = [];
		selectionIndeterminate.value = {};
		halfSelection = [];
		if (oldSelection.length) instance.emit("selection-change", []);
	};
	const cleanSelection = () => {
		let deleted;
		if (rowKey.value) {
			deleted = [];
			const childrenKey = instance?.store?.states?.childrenColumnName.value;
			const dataMap = getKeysMap(data.value, rowKey.value, true, childrenKey);
			const { lazyTreeNodeMap } = instance.store.states;
			if (lazyTreeNodeMap.value) Object.entries(lazyTreeNodeMap.value).forEach(([parentId, lazyRows]) => {
				if (dataMap[parentId]) lazyRows.forEach((row) => {
					const id = getRowIdentity(row, rowKey.value);
					if (!dataMap[id]) dataMap[id] = {
						row,
						index: -1
					};
				});
			});
			for (const key in selectedMap.value) if (hasOwn(selectedMap.value, key) && !dataMap[key]) deleted.push(selectedMap.value[key].row);
		} else deleted = selection.value.filter((item) => !data.value.includes(item));
		if (deleted.length) {
			const newSelection = selection.value.filter((item) => !deleted.includes(item));
			selection.value = newSelection;
			updateSelectionByChildren({ emitChange: false });
			instance.emit("selection-change", [...newSelection]);
		}
	};
	const getSelectionRows = () => {
		return (selection.value || []).slice();
	};
	const getHalfSelectionRows = () => {
		return halfSelection.slice();
	};
	const cascadeToLazyChildren = (row, selected, rowIndexMap) => {
		if (!rowKey.value || treeStates.checkStrictly.value || !treeStates.lazy.value) return;
		const { lazyTreeNodeMap, childrenColumnName } = instance.store.states;
		const id = getRowIdentity(row, rowKey.value);
		const lazyChildren = lazyTreeNodeMap.value?.[id] ?? [];
		const inlineChildren = row[childrenColumnName.value] ?? [];
		const treeProps = {
			children: childrenColumnName.value,
			checkStrictly: false
		};
		for (const child of lazyChildren) {
			const childIndex = rowIndexMap.get(getRowIdentity(child, rowKey.value)) ?? 0;
			toggleRowStatus(selection.value, child, selected, treeProps, selectable.value, childIndex, rowKey.value);
			cascadeToLazyChildren(child, selected, rowIndexMap);
		}
		for (const child of inlineChildren) cascadeToLazyChildren(child, selected, rowIndexMap);
	};
	const toggleRowSelection = (row, selected, emitChange = true, ignoreSelectable = false) => {
		const treeProps = {
			children: instance?.store?.states?.childrenColumnName.value,
			checkStrictly: instance?.store?.states?.checkStrictly.value
		};
		if (toggleRowStatus(selection.value, row, selected, treeProps, ignoreSelectable ? void 0 : selectable.value, data.value.indexOf(row), rowKey.value)) {
			if (treeStates.lazy.value && !treeStates.checkStrictly.value) {
				cascadeToLazyChildren(row, selected ?? isSelected(row), rowIndexMap.value);
				updateSelectionByChildren({
					emitChange: false,
					rowIndexMap: rowIndexMap.value
				});
			} else updateSelectionByChildren({ emitChange: false });
			const newSelection = (selection.value || []).slice();
			if (emitChange) instance.emit("select", newSelection, row);
			instance.emit("selection-change", newSelection);
		}
	};
	const _toggleAllSelection = () => {
		const value = selectOnIndeterminate.value ? !isAllSelected.value : !(isAllSelected.value || selection.value.length);
		isAllSelected.value = value;
		let selectionChanged = false;
		let childrenCount = 0;
		const rowKey = instance?.store?.states?.rowKey.value;
		const { childrenColumnName } = instance.store.states;
		const treeProps = {
			children: childrenColumnName.value,
			checkStrictly: false
		};
		data.value.forEach((row, index) => {
			const rowIndex = index + childrenCount;
			if (toggleRowStatus(selection.value, row, value, treeProps, selectable.value, rowIndex, rowKey)) selectionChanged = true;
			childrenCount += getChildrenCount(getRowIdentity(row, rowKey));
		});
		const rowIndexMapVal = rowIndexMap.value;
		if (treeStates.lazy.value && !treeStates.checkStrictly.value && rowKey) for (const lazyRows of Object.values(treeStates.lazyTreeNodeMap.value)) for (const child of lazyRows) {
			const childIndex = rowIndexMapVal.get(getRowIdentity(child, rowKey)) ?? 0;
			if (toggleRowStatus(selection.value, child, value, treeProps, selectable.value, childIndex, rowKey)) selectionChanged = true;
			cascadeToLazyChildren(child, value, rowIndexMapVal);
		}
		updateSelectionByChildren({
			emitChange: false,
			rowIndexMap: rowIndexMapVal
		});
		if (selectionChanged) instance.emit("selection-change", selection.value ? [...selection.value] : []);
		instance.emit("select-all", (selection.value || []).slice());
	};
	const updateAllSelected = () => {
		if (data.value?.length === 0) {
			isAllSelected.value = false;
			return;
		}
		let rowIndex = 0;
		let selectedCount = 0;
		const checkSelectedStatus = (rows) => {
			for (const row of rows) {
				const isRowSelectable = selectable.value && selectable.value.call(null, row, rowIndex);
				if (!isSelected(row)) {
					if (!selectable.value || isRowSelectable) return false;
				} else selectedCount++;
				rowIndex++;
				const children = getRowChildren(row);
				if (children.length && !checkSelectedStatus(children)) return false;
			}
			return true;
		};
		const isAllSelected_ = checkSelectedStatus(data.value || []);
		isAllSelected.value = selectedCount === 0 ? false : isAllSelected_;
	};
	const getRowIndeterminate = (row) => {
		if (!rowKey.value) return false;
		const id = getRowIdentity(row, rowKey.value);
		return !!selectionIndeterminate.value[id];
	};
	const getChildrenCount = (rowKey) => {
		if (!instance || !instance.store) return 0;
		const { treeData } = instance.store.states;
		let count = 0;
		const children = treeData.value[rowKey]?.children;
		if (children) {
			count += children.length;
			children.forEach((childKey) => {
				count += getChildrenCount(childKey);
			});
		}
		return count;
	};
	const updateFilters = (column, values) => {
		const filters_ = {};
		castArray(column).forEach((col) => {
			filters.value[col.id] = values;
			filters_[col.columnKey || col.id] = values;
		});
		return filters_;
	};
	const updateSort = (column, prop, order) => {
		if (sortingColumn.value && sortingColumn.value !== column) sortingColumn.value.order = null;
		sortingColumn.value = column;
		sortProp.value = prop;
		sortOrder.value = order;
	};
	const execFilter = () => {
		let sourceData = unref(_data);
		Object.keys(filters.value).forEach((columnId) => {
			const values = filters.value[columnId];
			if (!values || values.length === 0) return;
			const column = getColumnById({ columns: columns.value }, columnId);
			if (column && column.filterMethod) sourceData = sourceData.filter((row) => {
				return values.some((value) => column.filterMethod.call(null, value, row, column));
			});
		});
		filteredData.value = sourceData;
	};
	const execSort = () => {
		data.value = sortData(filteredData.value ?? [], {
			sortingColumn: sortingColumn.value,
			sortProp: sortProp.value,
			sortOrder: sortOrder.value
		});
	};
	const execQuery = (ignore = void 0) => {
		if (!ignore?.filter) execFilter();
		execSort();
	};
	const clearFilter = (columnKeys) => {
		const { tableHeaderRef } = instance.refs;
		if (!tableHeaderRef) return;
		const panels = Object.assign({}, tableHeaderRef.filterPanels);
		const keys = Object.keys(panels);
		if (!keys.length) return;
		if (isString(columnKeys)) columnKeys = [columnKeys];
		if (isArray(columnKeys)) {
			const columns_ = columnKeys.map((key) => getColumnByKey({ columns: columns.value }, key));
			keys.forEach((key) => {
				const column = columns_.find((col) => col.id === key);
				if (column) column.filteredValue = [];
			});
			instance.store.commit("filterChange", {
				column: columns_,
				values: [],
				silent: true,
				multi: true
			});
		} else {
			keys.forEach((key) => {
				const column = columns.value.find((col) => col.id === key);
				if (column) column.filteredValue = [];
			});
			filters.value = {};
			instance.store.commit("filterChange", {
				column: {},
				values: [],
				silent: true
			});
		}
	};
	const clearSort = () => {
		if (!sortingColumn.value) return;
		updateSort(null, null, null);
		instance.store.commit("changeSortCondition", { silent: true });
	};
	const { setExpandRowKeys, toggleRowExpansion, updateExpandRows, states: expandStates, isRowExpanded } = useExpand({
		data,
		rowKey
	});
	const { updateTreeExpandKeys, toggleTreeExpansion, updateTreeData, updateKeyChildren, loadOrToggle, states: treeStates } = useTree({
		data,
		rowKey
	});
	const { updateCurrentRowData, updateCurrentRow, setCurrentRowKey, states: currentData } = useCurrent({
		data,
		rowKey
	});
	const setExpandRowKeysAdapter = (val) => {
		setExpandRowKeys(val);
		updateTreeExpandKeys(val);
	};
	const toggleRowExpansionAdapter = (row, expanded) => {
		if (columns.value.some(({ type }) => type === "expand")) toggleRowExpansion(row, expanded);
		else toggleTreeExpansion(row, expanded);
	};
	watch(() => treeStates.checkStrictly.value, (value) => {
		if (value) {
			selectionIndeterminate.value = {};
			halfSelection = [];
		} else updateSelectionByChildren({ emitChange: false });
		updateAllSelected();
	});
	watch(() => treeStates.lazyTreeNodeMap.value, () => {
		if (!treeStates.lazy.value || treeStates.checkStrictly.value || !rowKey.value) return;
		const rowIndexMapVal = rowIndexMap.value;
		const prevLen = selection.value.length;
		for (const parentId of Object.keys(treeStates.lazyTreeNodeMap.value)) {
			if (!selectedMap.value?.[parentId]) continue;
			cascadeToLazyChildren(selectedMap.value[parentId].row, true, rowIndexMapVal);
		}
		const cascadeChanged = selection.value.length !== prevLen;
		updateSelectionByChildren({
			emitChange: !cascadeChanged,
			rowIndexMap: rowIndexMapVal
		});
		updateAllSelected();
		if (cascadeChanged) instance.emit("selection-change", [...selection.value]);
	});
	return {
		assertRowKey,
		updateColumns,
		scheduleLayout,
		isSelected,
		clearSelection,
		cleanSelection,
		getSelectionRows,
		getHalfSelectionRows,
		toggleRowSelection,
		_toggleAllSelection,
		toggleAllSelection: null,
		updateAllSelected,
		updateSelectionByChildren,
		getRowIndeterminate,
		updateFilters,
		updateCurrentRow,
		updateSort,
		execFilter,
		execSort,
		execQuery,
		clearFilter,
		clearSort,
		toggleRowExpansion,
		setExpandRowKeysAdapter,
		setCurrentRowKey,
		toggleRowExpansionAdapter,
		isRowExpanded,
		updateExpandRows,
		updateCurrentRowData,
		loadOrToggle,
		updateTreeData,
		updateKeyChildren,
		states: {
			tableSize,
			rowKey,
			data,
			_data,
			isComplex,
			_columns,
			originColumns,
			columns,
			fixedColumns,
			rightFixedColumns,
			leafColumns,
			fixedLeafColumns,
			rightFixedLeafColumns,
			updateOrderFns,
			leafColumnsLength,
			fixedLeafColumnsLength,
			rightFixedLeafColumnsLength,
			isAllSelected,
			selection,
			selectionIndeterminate,
			reserveSelection,
			selectOnIndeterminate,
			selectable,
			rowExpandable,
			filters,
			filteredData,
			sortingColumn,
			sortProp,
			sortOrder,
			hoverRow,
			...expandStates,
			...treeStates,
			...currentData
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/store/index.mjs
function replaceColumn(array, column) {
	return array.map((item) => {
		if (item.id === column.id) return column;
		else if (item.children?.length) item.children = replaceColumn(item.children, column);
		return item;
	});
}
function sortColumn(array) {
	array.forEach((item) => {
		item.no = item.getColumnIndex?.();
		if (item.children?.length) sortColumn(item.children);
	});
	array.sort((cur, pre) => cur.no - pre.no);
}
function useStore() {
	const instance = getCurrentInstance();
	const watcher = useWatcher$1();
	const ns = useNamespace("table");
	const { t } = useLocale();
	const mutations = {
		setData(states, data) {
			const dataInstanceChanged = unref(states._data) !== data;
			states.data.value = data;
			states._data.value = data;
			instance.store.execQuery();
			instance.store.updateCurrentRowData();
			instance.store.updateExpandRows();
			instance.store.updateTreeData(instance.store.states.defaultExpandAll.value);
			if (unref(states.reserveSelection)) instance.store.assertRowKey();
			else if (dataInstanceChanged) instance.store.clearSelection();
			else instance.store.cleanSelection();
			instance.store.updateSelectionByChildren({ emitChange: false });
			instance.store.updateAllSelected();
			if (instance.$ready) instance.store.scheduleLayout();
		},
		insertColumn(states, column, parent, updateColumnOrder) {
			const array = unref(states._columns);
			let newColumns = [];
			if (!parent) {
				array.push(column);
				newColumns = array;
			} else {
				if (parent && !parent.children) parent.children = [];
				parent.children?.push(column);
				newColumns = replaceColumn(array, parent);
			}
			sortColumn(newColumns);
			states._columns.value = newColumns;
			states.updateOrderFns.push(updateColumnOrder);
			if (column.type === "selection") {
				states.selectable.value = column.selectable;
				states.reserveSelection.value = column.reserveSelection;
			}
			if (instance.$ready) {
				instance.store.updateColumns();
				instance.store.scheduleLayout();
			}
		},
		updateColumnOrder(states, column) {
			if (column.getColumnIndex?.() === column.no) return;
			sortColumn(states._columns.value);
			if (instance.$ready) instance.store.updateColumns();
		},
		removeColumn(states, column, parent, updateColumnOrder) {
			const array = unref(states._columns) || [];
			if (parent) {
				parent.children?.splice(parent.children.findIndex((item) => item.id === column.id), 1);
				nextTick(() => {
					if (parent.children?.length === 0) delete parent.children;
				});
				states._columns.value = replaceColumn(array, parent);
			} else {
				const index = array.indexOf(column);
				if (index > -1) {
					array.splice(index, 1);
					states._columns.value = array;
				}
			}
			const updateFnIndex = states.updateOrderFns.indexOf(updateColumnOrder);
			updateFnIndex > -1 && states.updateOrderFns.splice(updateFnIndex, 1);
			if (instance.$ready) {
				instance.store.updateColumns();
				instance.store.scheduleLayout();
			}
		},
		sort(states, options) {
			const { prop, order, init } = options;
			if (prop) {
				const column = unref(states.columns).find((column) => column.property === prop);
				if (column) {
					column.order = order;
					instance.store.updateSort(column, prop, order);
					instance.store.commit("changeSortCondition", { init });
				}
			}
		},
		changeSortCondition(states, options) {
			const { sortingColumn, sortProp, sortOrder } = states;
			const columnValue = unref(sortingColumn), propValue = unref(sortProp), orderValue = unref(sortOrder);
			if (isNull(orderValue)) {
				states.sortingColumn.value = null;
				states.sortProp.value = null;
			}
			instance.store.execQuery({ filter: true });
			if (!options || !(options.silent || options.init)) instance.emit("sort-change", {
				column: columnValue,
				prop: propValue,
				order: orderValue
			});
			instance.store.updateTableScrollY();
		},
		filterChange(_states, options) {
			const { column, values, silent } = options;
			const newFilters = instance.store.updateFilters(column, values);
			instance.store.execQuery();
			if (!silent) instance.emit("filter-change", newFilters);
			instance.store.updateTableScrollY();
		},
		toggleAllSelection() {
			instance.store.toggleAllSelection?.();
		},
		rowSelectedChanged(_states, row) {
			instance.store.toggleRowSelection(row);
			instance.store.updateAllSelected();
		},
		setHoverRow(states, row) {
			states.hoverRow.value = row;
		},
		setCurrentRow(_states, row) {
			instance.store.updateCurrentRow(row);
		}
	};
	const commit = function(name, ...args) {
		const mutations = instance.store.mutations;
		if (mutations[name]) mutations[name].apply(instance, [instance.store.states, ...args]);
		else throw new Error(`Action not found: ${name}`);
	};
	const updateTableScrollY = function() {
		nextTick(() => instance.layout.updateScrollY.apply(instance.layout));
	};
	return {
		ns,
		t,
		...watcher,
		mutations,
		commit,
		updateTableScrollY
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/store/helper.mjs
var InitialStateMap = {
	rowKey: "rowKey",
	defaultExpandAll: "defaultExpandAll",
	rowExpandable: "rowExpandable",
	selectOnIndeterminate: "selectOnIndeterminate",
	indent: "indent",
	lazy: "lazy",
	["treeProps.hasChildren"]: {
		key: "lazyColumnIdentifier",
		default: "hasChildren"
	},
	["treeProps.children"]: {
		key: "childrenColumnName",
		default: "children"
	},
	["treeProps.checkStrictly"]: {
		key: "checkStrictly",
		default: false
	}
};
function createStore(table, props) {
	if (!table) throw new Error("Table is required.");
	const store = useStore();
	store.toggleAllSelection = debounce(store._toggleAllSelection, 10);
	Object.keys(InitialStateMap).forEach((key) => {
		handleValue(getArrKeysValue(props, key), key, store);
	});
	proxyTableProps(store, props);
	return store;
}
function proxyTableProps(store, props) {
	Object.keys(InitialStateMap).forEach((key) => {
		watch(() => getArrKeysValue(props, key), (value) => {
			handleValue(value, key, store);
		});
	});
}
function handleValue(value, propsKey, store) {
	let newVal = value;
	let storeKey = InitialStateMap[propsKey];
	if (isObject(storeKey)) {
		newVal = newVal || storeKey.default;
		storeKey = storeKey.key;
	}
	store.states[storeKey].value = newVal;
}
function getArrKeysValue(props, key) {
	if (key.includes(".")) {
		const keyList = key.split(".");
		let value = props;
		keyList.forEach((k) => {
			value = value[k];
		});
		return value;
	} else return props[key];
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-layout.mjs
var TableLayout = class {
	constructor(options) {
		this.observers = [];
		this.table = null;
		this.store = null;
		this.columns = [];
		this.fit = true;
		this.showHeader = true;
		this.heightMap = {};
		this.height = ref(null);
		this.scrollX = ref(false);
		this.scrollY = ref(false);
		this.bodyWidth = ref(null);
		this.fixedWidth = ref(null);
		this.rightFixedWidth = ref(null);
		this.gutterWidth = 0;
		for (const name in options) if (hasOwn(options, name)) if (isRef(this[name])) this[name].value = options[name];
		else this[name] = options[name];
		if (!this.table) throw new Error("Table is required for Table Layout");
		if (!this.store) throw new Error("Store is required for Table Layout");
	}
	updateScrollY() {
		const height = this.height.value;
		/**
		* When the height is not initialized, it is null.
		* After the table is initialized, when the height is not configured, the height is 0.
		*/
		if (isNull(height)) return false;
		const scrollBarRef = this.table.refs.scrollBarRef;
		if (this.table.vnode.el && scrollBarRef?.wrapRef) {
			let scrollY = true;
			const prevScrollY = this.scrollY.value;
			scrollY = scrollBarRef.wrapRef.scrollHeight > scrollBarRef.wrapRef.clientHeight;
			this.scrollY.value = scrollY;
			return prevScrollY !== scrollY;
		}
		return false;
	}
	setHeight(value, prop = "height") {
		if (!isClient) return;
		const el = this.table.vnode.el;
		value = parseHeight(value);
		this.height.value = Number(value);
		this.heightMap[prop] = value;
		if (!el && (value || value === 0)) {
			nextTick(() => {
				if (this.heightMap[prop] === value) this.setHeight(value, prop);
			});
			return;
		}
		if (el && isNumber(value)) {
			el.style[prop] = `${value}px`;
			this.updateElsHeight();
		} else if (el && isString(value)) {
			el.style[prop] = value;
			this.updateElsHeight();
		}
	}
	setMaxHeight(value) {
		this.setHeight(value, "max-height");
	}
	getFlattenColumns() {
		const flattenColumns = [];
		this.table.store.states.columns.value.forEach((column) => {
			if (column.isColumnGroup) flattenColumns.push.apply(flattenColumns, column.columns);
			else flattenColumns.push(column);
		});
		return flattenColumns;
	}
	updateElsHeight() {
		this.updateScrollY();
		this.notifyObservers("scrollable");
	}
	headerDisplayNone(elm) {
		if (!elm) return true;
		let headerChild = elm;
		while (headerChild.tagName !== "DIV") {
			if (getComputedStyle(headerChild).display === "none") return true;
			headerChild = headerChild.parentElement;
		}
		return false;
	}
	updateColumnsWidth() {
		if (!isClient) return;
		const fit = this.fit;
		const bodyWidth = this.table.vnode.el?.clientWidth;
		let bodyMinWidth = 0;
		const flattenColumns = this.getFlattenColumns();
		const flexColumns = flattenColumns.filter((column) => !isNumber(column.width));
		flattenColumns.forEach((column) => {
			if (isNumber(column.width) && column.realWidth) column.realWidth = null;
		});
		if (flexColumns.length > 0 && fit) {
			flattenColumns.forEach((column) => {
				bodyMinWidth += Number(column.width || column.minWidth || 80);
			});
			if (bodyMinWidth <= bodyWidth) {
				this.scrollX.value = false;
				const totalFlexWidth = bodyWidth - bodyMinWidth;
				if (flexColumns.length === 1) flexColumns[0].realWidth = Number(flexColumns[0].minWidth || 80) + totalFlexWidth;
				else {
					const flexWidthPerPixel = totalFlexWidth / flexColumns.reduce((prev, column) => prev + Number(column.minWidth || 80), 0);
					let noneFirstWidth = 0;
					flexColumns.forEach((column, index) => {
						if (index === 0) return;
						const flexWidth = Math.floor(Number(column.minWidth || 80) * flexWidthPerPixel);
						noneFirstWidth += flexWidth;
						column.realWidth = Number(column.minWidth || 80) + flexWidth;
					});
					flexColumns[0].realWidth = Number(flexColumns[0].minWidth || 80) + totalFlexWidth - noneFirstWidth;
				}
			} else {
				this.scrollX.value = true;
				flexColumns.forEach((column) => {
					column.realWidth = Number(column.minWidth);
				});
			}
			this.bodyWidth.value = Math.max(bodyMinWidth, bodyWidth);
			this.table.state.resizeState.value.width = this.bodyWidth.value;
		} else {
			flattenColumns.forEach((column) => {
				if (!column.width && !column.minWidth) column.realWidth = 80;
				else column.realWidth = Number(column.width || column.minWidth);
				bodyMinWidth += column.realWidth;
			});
			this.scrollX.value = bodyMinWidth > bodyWidth;
			this.bodyWidth.value = bodyMinWidth;
		}
		const fixedColumns = this.store.states.fixedColumns.value;
		if (fixedColumns.length > 0) {
			let fixedWidth = 0;
			fixedColumns.forEach((column) => {
				fixedWidth += Number(column.realWidth || column.width);
			});
			this.fixedWidth.value = fixedWidth;
		}
		const rightFixedColumns = this.store.states.rightFixedColumns.value;
		if (rightFixedColumns.length > 0) {
			let rightFixedWidth = 0;
			rightFixedColumns.forEach((column) => {
				rightFixedWidth += Number(column.realWidth || column.width);
			});
			this.rightFixedWidth.value = rightFixedWidth;
		}
		this.notifyObservers("columns");
	}
	addObserver(observer) {
		this.observers.push(observer);
	}
	removeObserver(observer) {
		const index = this.observers.indexOf(observer);
		if (index !== -1) this.observers.splice(index, 1);
	}
	notifyObservers(event) {
		this.observers.forEach((observer) => {
			switch (event) {
				case "columns":
					observer.state?.onColumnsChange(this);
					break;
				case "scrollable":
					observer.state?.onScrollableChange(this);
					break;
				default: throw new Error(`Table Layout don't have event ${event}.`);
			}
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/tokens.mjs
var TABLE_INJECTION_KEY = Symbol("ElTable");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-header/utils-helper.mjs
var getAllColumns = (columns) => {
	const result = [];
	columns.forEach((column) => {
		if (column.children) {
			result.push(column);
			result.push.apply(result, getAllColumns(column.children));
		} else result.push(column);
	});
	return result;
};
var convertToRows = (originColumns) => {
	let maxLevel = 1;
	const traverse = (column, parent) => {
		if (parent) {
			column.level = parent.level + 1;
			if (maxLevel < column.level) maxLevel = column.level;
		}
		if (column.children) {
			let colSpan = 0;
			column.children.forEach((subColumn) => {
				traverse(subColumn, column);
				colSpan += subColumn.colSpan;
			});
			column.colSpan = colSpan;
		} else column.colSpan = 1;
	};
	originColumns.forEach((column) => {
		column.level = 1;
		traverse(column, void 0);
	});
	const rows = [];
	for (let i = 0; i < maxLevel; i++) rows.push([]);
	getAllColumns(originColumns).forEach((column) => {
		if (!column.children) column.rowSpan = maxLevel - column.level + 1;
		else {
			column.rowSpan = 1;
			column.children.forEach((col) => col.isSubColumn = true);
		}
		rows[column.level - 1].push(column);
	});
	return rows;
};
function useUtils$1(props) {
	const parent = inject(TABLE_INJECTION_KEY);
	const columnRows = computed(() => {
		return convertToRows(props.store.states.originColumns.value);
	});
	const isGroup = computed(() => {
		const result = columnRows.value.length > 1;
		if (result && parent) parent.state.isGroup.value = true;
		return result;
	});
	const toggleAllSelection = (event) => {
		event.stopPropagation();
		parent?.store.commit("toggleAllSelection");
	};
	return {
		isGroup,
		toggleAllSelection,
		columnRows
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/filter-panel.vue_vue_type_script_lang.mjs
var filter_panel_vue_vue_type_script_lang_default = defineComponent({
	name: "ElTableFilterPanel",
	components: {
		ElCheckbox,
		ElCheckboxGroup,
		ElScrollbar,
		ElTooltip,
		ElIcon,
		ArrowDown: arrow_down_default,
		ArrowUp: arrow_up_default
	},
	props: {
		placement: {
			type: String,
			default: "bottom-start"
		},
		store: { type: Object },
		column: { type: Object },
		upDataColumn: { type: Function },
		appendTo: useTooltipContentProps.appendTo
	},
	setup(props) {
		const instance = getCurrentInstance();
		const { t } = useLocale();
		const ns = useNamespace("table-filter");
		const parent = instance?.parent;
		if (props.column && !parent.filterPanels.value[props.column.id]) parent.filterPanels.value[props.column.id] = instance;
		const tooltipRef = ref(null);
		const rootRef = ref(null);
		const checkedIndex = ref(0);
		const filters = computed(() => {
			return props.column && props.column.filters;
		});
		const filterClassName = computed(() => {
			if (props.column && props.column.filterClassName) return `${ns.b()} ${props.column.filterClassName}`;
			return ns.b();
		});
		const filterValue = computed({
			get: () => (props.column?.filteredValue || [])[0],
			set: (value) => {
				if (filteredValue.value) if (!isPropAbsent(value)) filteredValue.value.splice(0, 1, value);
				else filteredValue.value.splice(0, 1);
			}
		});
		const filteredValue = computed({
			get() {
				if (props.column) return props.column.filteredValue || [];
				return [];
			},
			set(value) {
				if (props.column) props.upDataColumn?.("filteredValue", value);
			}
		});
		const multiple = computed(() => {
			if (props.column) return props.column.filterMultiple;
			return true;
		});
		const isActive = (filter) => {
			return filter.value === filterValue.value;
		};
		const hidden = () => {
			tooltipRef.value?.onClose();
		};
		const handleConfirm = () => {
			confirmFilter(filteredValue.value);
			hidden();
		};
		const handleReset = () => {
			filteredValue.value = [];
			confirmFilter(filteredValue.value);
			hidden();
		};
		const handleSelect = (_filterValue, index) => {
			filterValue.value = _filterValue;
			checkedIndex.value = index;
			if (!isPropAbsent(_filterValue)) confirmFilter(filteredValue.value);
			else confirmFilter([]);
			hidden();
		};
		const confirmFilter = (filteredValue) => {
			props.store?.commit("filterChange", {
				column: props.column,
				values: filteredValue
			});
			props.store?.updateAllSelected();
		};
		const handleShowTooltip = () => {
			rootRef.value?.focus();
			!multiple.value && initCheckedIndex();
			if (props.column) props.upDataColumn?.("filterOpened", true);
		};
		const handleHideTooltip = () => {
			if (props.column) props.upDataColumn?.("filterOpened", false);
		};
		const initCheckedIndex = () => {
			if (isPropAbsent(filterValue)) {
				checkedIndex.value = 0;
				return;
			}
			const idx = (filters.value || []).findIndex((item) => {
				return item.value === filterValue.value;
			});
			checkedIndex.value = idx >= 0 ? idx + 1 : 0;
		};
		const handleKeydown = (event) => {
			const code = getEventCode(event);
			const len = (filters.value ? filters.value.length : 0) + 1;
			let index = checkedIndex.value;
			let isPreventDefault = true;
			switch (code) {
				case EVENT_CODE.down:
				case EVENT_CODE.right:
					index = (index + 1) % len;
					break;
				case EVENT_CODE.up:
				case EVENT_CODE.left:
					index = (index - 1 + len) % len;
					break;
				case EVENT_CODE.tab:
					hidden();
					isPreventDefault = false;
					break;
				case EVENT_CODE.enter:
				case EVENT_CODE.space:
					if (index === 0) handleSelect(null, 0);
					else {
						const item = (filters.value || [])[index - 1];
						item.value && handleSelect(item.value, index);
					}
					break;
				default: isPreventDefault = false;
			}
			isPreventDefault && event.preventDefault();
			checkedIndex.value = index;
			rootRef.value?.querySelector(`.${ns.e("list-item")}:nth-child(${index + 1})`)?.focus();
		};
		return {
			multiple,
			filterClassName,
			filteredValue,
			filterValue,
			filters,
			handleConfirm,
			handleReset,
			handleSelect,
			isPropAbsent,
			isActive,
			t,
			ns,
			tooltipRef,
			rootRef,
			checkedIndex,
			handleShowTooltip,
			handleHideTooltip,
			handleKeydown
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/filter-panel.mjs
var _hoisted_1$2 = ["disabled"];
var _hoisted_2$1 = ["tabindex", "aria-checked"];
var _hoisted_3 = [
	"tabindex",
	"aria-checked",
	"onClick"
];
var _hoisted_4 = ["aria-label"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_checkbox = resolveComponent("el-checkbox");
	const _component_el_checkbox_group = resolveComponent("el-checkbox-group");
	const _component_el_scrollbar = resolveComponent("el-scrollbar");
	const _component_arrow_up = resolveComponent("arrow-up");
	const _component_arrow_down = resolveComponent("arrow-down");
	const _component_el_icon = resolveComponent("el-icon");
	const _component_el_tooltip = resolveComponent("el-tooltip");
	return openBlock(), createBlock(_component_el_tooltip, {
		ref: "tooltipRef",
		offset: 0,
		placement: _ctx.placement,
		"show-arrow": false,
		trigger: "click",
		role: "dialog",
		teleported: "",
		effect: "light",
		pure: "",
		loop: "",
		"popper-class": _ctx.filterClassName,
		persistent: "",
		"append-to": _ctx.appendTo,
		onShow: _ctx.handleShowTooltip,
		onHide: _ctx.handleHideTooltip
	}, {
		content: withCtx(() => [_ctx.multiple ? (openBlock(), createElementBlock("div", {
			key: 0,
			ref: "rootRef",
			tabindex: "-1",
			class: normalizeClass(_ctx.ns.e("multiple"))
		}, [createBaseVNode("div", { class: normalizeClass(_ctx.ns.e("content")) }, [createVNode(_component_el_scrollbar, { "wrap-class": _ctx.ns.e("wrap") }, {
			default: withCtx(() => [createVNode(_component_el_checkbox_group, {
				modelValue: _ctx.filteredValue,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => _ctx.filteredValue = $event),
				class: normalizeClass(_ctx.ns.e("checkbox-group"))
			}, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.filters, (filter) => {
					return openBlock(), createBlock(_component_el_checkbox, {
						key: filter.value,
						value: filter.value
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(filter.text), 1)]),
						_: 2
					}, 1032, ["value"]);
				}), 128))]),
				_: 1
			}, 8, ["modelValue", "class"])]),
			_: 1
		}, 8, ["wrap-class"])], 2), createBaseVNode("div", { class: normalizeClass(_ctx.ns.e("bottom")) }, [createBaseVNode("button", {
			class: normalizeClass(_ctx.ns.is("disabled", _ctx.filteredValue.length === 0)),
			disabled: _ctx.filteredValue.length === 0,
			type: "button",
			onClick: _cache[1] || (_cache[1] = (...args) => _ctx.handleConfirm && _ctx.handleConfirm(...args))
		}, toDisplayString(_ctx.t("el.table.confirmFilter")), 11, _hoisted_1$2), createBaseVNode("button", {
			type: "button",
			onClick: _cache[2] || (_cache[2] = (...args) => _ctx.handleReset && _ctx.handleReset(...args))
		}, toDisplayString(_ctx.t("el.table.resetFilter")), 1)], 2)], 2)) : (openBlock(), createElementBlock("ul", {
			key: 1,
			ref: "rootRef",
			tabindex: "-1",
			role: "radiogroup",
			class: normalizeClass(_ctx.ns.e("list")),
			onKeydown: _cache[4] || (_cache[4] = (...args) => _ctx.handleKeydown && _ctx.handleKeydown(...args))
		}, [createBaseVNode("li", {
			role: "radio",
			class: normalizeClass([_ctx.ns.e("list-item"), _ctx.ns.is("active", _ctx.isPropAbsent(_ctx.filterValue))]),
			tabindex: _ctx.checkedIndex === 0 ? 0 : -1,
			"aria-checked": _ctx.isPropAbsent(_ctx.filterValue),
			onClick: _cache[3] || (_cache[3] = ($event) => _ctx.handleSelect(null, 0))
		}, toDisplayString(_ctx.t("el.table.clearFilter")), 11, _hoisted_2$1), (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.filters, (filter, idx) => {
			return openBlock(), createElementBlock("li", {
				key: filter.value,
				role: "radio",
				class: normalizeClass([_ctx.ns.e("list-item"), _ctx.ns.is("active", _ctx.isActive(filter))]),
				tabindex: _ctx.checkedIndex === idx + 1 ? 0 : -1,
				"aria-checked": _ctx.isActive(filter),
				onClick: ($event) => _ctx.handleSelect(filter.value, idx + 1)
			}, toDisplayString(filter.text), 11, _hoisted_3);
		}), 128))], 34))]),
		default: withCtx(() => [createBaseVNode("button", {
			type: "button",
			class: normalizeClass(`${_ctx.ns.namespace.value}-table__column-filter-trigger`),
			"aria-label": _ctx.t("el.table.filterLabel", { column: _ctx.column?.label || "" })
		}, [createVNode(_component_el_icon, null, {
			default: withCtx(() => [renderSlot(_ctx.$slots, "filter-icon", {}, () => [_ctx.column?.filterOpened ? (openBlock(), createBlock(_component_arrow_up, { key: 0 })) : (openBlock(), createBlock(_component_arrow_down, { key: 1 }))])]),
			_: 3
		})], 10, _hoisted_4)]),
		_: 3
	}, 8, [
		"placement",
		"popper-class",
		"append-to",
		"onShow",
		"onHide"
	]);
}
var filter_panel_default = /* @__PURE__ */ _plugin_vue_export_helper_default(filter_panel_vue_vue_type_script_lang_default, [["render", _sfc_render]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/layout-observer.mjs
function useLayoutObserver(root) {
	const instance = getCurrentInstance();
	onBeforeMount(() => {
		tableLayout.value.addObserver(instance);
	});
	onMounted(() => {
		onColumnsChange(tableLayout.value);
		onScrollableChange(tableLayout.value);
	});
	onUpdated(() => {
		onColumnsChange(tableLayout.value);
		onScrollableChange(tableLayout.value);
	});
	onUnmounted(() => {
		tableLayout.value.removeObserver(instance);
	});
	const tableLayout = computed(() => {
		const layout = root.layout;
		if (!layout) throw new Error("Can not find table layout.");
		return layout;
	});
	const onColumnsChange = (layout) => {
		const cols = root.vnode.el?.querySelectorAll("colgroup > col") || [];
		if (!cols.length) return;
		const flattenColumns = layout.getFlattenColumns();
		const columnsMap = {};
		flattenColumns.forEach((column) => {
			columnsMap[column.id] = column;
		});
		for (let i = 0, j = cols.length; i < j; i++) {
			const col = cols[i];
			const column = columnsMap[col.getAttribute("name")];
			if (column) col.setAttribute("width", column.realWidth || column.width);
		}
	};
	const onScrollableChange = (layout) => {
		const cols = root.vnode.el?.querySelectorAll("colgroup > col[name=gutter]") || [];
		for (let i = 0, j = cols.length; i < j; i++) cols[i].setAttribute("width", layout.scrollY.value ? layout.gutterWidth : "0");
		const ths = root.vnode.el?.querySelectorAll("th.gutter") || [];
		for (let i = 0, j = ths.length; i < j; i++) {
			const th = ths[i];
			th.style.width = layout.scrollY.value ? `${layout.gutterWidth}px` : "0";
			th.style.display = layout.scrollY.value ? "" : "none";
		}
	};
	return {
		tableLayout: tableLayout.value,
		onColumnsChange,
		onScrollableChange
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-header/event-helper.mjs
function useEvent(props, emit) {
	const instance = getCurrentInstance();
	const parent = inject(TABLE_INJECTION_KEY);
	const handleFilterClick = (event) => {
		event.stopPropagation();
	};
	const handleHeaderClick = (event, column) => {
		if (!column.filters && column.sortable) handleSortClick(event, column, false);
		else if (column.filterable && !column.sortable) handleFilterClick(event);
		parent?.emit("header-click", column, event);
	};
	const handleHeaderContextMenu = (event, column) => {
		parent?.emit("header-contextmenu", column, event);
	};
	const draggingColumn = ref(null);
	const dragging = ref(false);
	const dragState = ref();
	const handleMouseDown = (event, column) => {
		if (!isClient) return;
		if (column.children && column.children.length > 0) return;
		/* istanbul ignore if */
		if (draggingColumn.value && props.border && draggingColumn.value.id === column.id) {
			dragging.value = true;
			const table = parent;
			emit("set-drag-visible", true);
			const tableLeft = (table?.vnode.el)?.getBoundingClientRect().left;
			const columnEl = instance?.vnode?.el?.querySelector(`th.${column.id}`);
			const columnRect = columnEl.getBoundingClientRect();
			const minLeft = columnRect.left - tableLeft + 30;
			addClass(columnEl, "noclick");
			dragState.value = {
				startMouseLeft: event.clientX,
				startLeft: columnRect.right - tableLeft,
				startColumnLeft: columnRect.left - tableLeft,
				tableLeft
			};
			const resizeProxy = table?.refs.resizeProxy;
			resizeProxy.style.left = `${dragState.value.startLeft}px`;
			document.onselectstart = function() {
				return false;
			};
			document.ondragstart = function() {
				return false;
			};
			const handleMouseMove = (event) => {
				const deltaLeft = event.clientX - dragState.value.startMouseLeft;
				const proxyLeft = dragState.value.startLeft + deltaLeft;
				resizeProxy.style.left = `${Math.max(minLeft, proxyLeft)}px`;
			};
			const handleMouseUp = () => {
				if (dragging.value) {
					const { startColumnLeft, startLeft } = dragState.value;
					column.width = column.realWidth = Number.parseInt(resizeProxy.style.left, 10) - startColumnLeft;
					table?.emit("header-dragend", column.width, startLeft - startColumnLeft, column, event);
					requestAnimationFrame(() => {
						props.store.scheduleLayout(false, true);
					});
					document.body.style.cursor = "";
					dragging.value = false;
					draggingColumn.value = null;
					dragState.value = void 0;
					emit("set-drag-visible", false);
				}
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
				document.onselectstart = null;
				document.ondragstart = null;
				setTimeout(() => {
					removeClass(columnEl, "noclick");
				}, 0);
			};
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}
	};
	const handleMouseMove = (event, column) => {
		if (!props.border || column.children && column.children.length > 0) return;
		const el = event.target;
		const target = isElement(el) ? el.closest("th") : null;
		if (!target) return;
		const isSortable = hasClass(target, "is-sortable");
		if (isSortable) {
			const cursor = dragging.value ? "col-resize" : "";
			target.style.cursor = cursor;
			const caret = target.querySelector(".caret-wrapper");
			if (caret) caret.style.cursor = cursor;
		}
		if (!column.resizable || dragging.value) {
			draggingColumn.value = null;
			return;
		}
		const rect = target.getBoundingClientRect();
		const isLastTh = target.parentNode?.lastElementChild === target;
		const allowDrag = props.allowDragLastColumn || !isLastTh;
		const isResizeHandleActive = rect.width > 12 && rect.right - event.clientX < 8 && allowDrag;
		const cursor = isResizeHandleActive ? "col-resize" : "";
		document.body.style.cursor = cursor;
		draggingColumn.value = isResizeHandleActive ? column : null;
		if (isSortable) target.style.cursor = cursor;
	};
	const handleMouseOut = () => {
		if (!isClient || dragging.value) return;
		document.body.style.cursor = "";
	};
	const toggleOrder = ({ order, sortOrders }) => {
		if (order === "") return sortOrders[0];
		const index = sortOrders.indexOf(order || null);
		return sortOrders[index > sortOrders.length - 2 ? 0 : index + 1];
	};
	const handleSortClick = (event, column, givenOrder) => {
		event.stopPropagation();
		const order = column.order === givenOrder ? null : givenOrder || toggleOrder(column);
		const target = event.target?.closest("th");
		if (target) {
			if (hasClass(target, "noclick")) {
				removeClass(target, "noclick");
				return;
			}
		}
		if (!column.sortable) return;
		const clickTarget = event.currentTarget;
		if (["ascending", "descending"].some((str) => hasClass(clickTarget, str) && !column.sortOrders.includes(str))) return;
		const states = props.store.states;
		let sortProp = states.sortProp.value;
		let sortOrder;
		const sortingColumn = states.sortingColumn.value;
		if (sortingColumn !== column || sortingColumn === column && isNull(sortingColumn.order)) {
			if (sortingColumn) sortingColumn.order = null;
			states.sortingColumn.value = column;
			sortProp = column.property ?? null;
		}
		if (!order) sortOrder = column.order = null;
		else sortOrder = column.order = order;
		states.sortProp.value = sortProp;
		states.sortOrder.value = sortOrder;
		parent?.store.commit("changeSortCondition");
	};
	return {
		handleHeaderClick,
		handleHeaderContextMenu,
		handleMouseDown,
		handleMouseMove,
		handleMouseOut,
		handleSortClick,
		handleFilterClick
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-header/style.helper.mjs
function useStyle$2(props) {
	const parent = inject(TABLE_INJECTION_KEY);
	const ns = useNamespace("table");
	const getHeaderRowStyle = (rowIndex) => {
		const headerRowStyle = parent?.props.headerRowStyle;
		if (isFunction(headerRowStyle)) return headerRowStyle.call(null, { rowIndex });
		return headerRowStyle;
	};
	const getHeaderRowClass = (rowIndex) => {
		const classes = [];
		const headerRowClassName = parent?.props.headerRowClassName;
		if (isString(headerRowClassName)) classes.push(headerRowClassName);
		else if (isFunction(headerRowClassName)) classes.push(headerRowClassName.call(null, { rowIndex }));
		return classes.join(" ");
	};
	const getHeaderCellStyle = (rowIndex, columnIndex, row, column) => {
		let headerCellStyles = parent?.props.headerCellStyle ?? {};
		if (isFunction(headerCellStyles)) headerCellStyles = headerCellStyles.call(null, {
			rowIndex,
			columnIndex,
			row,
			column
		});
		const fixedStyle = getFixedColumnOffset(columnIndex, column.fixed, props.store, row);
		ensurePosition(fixedStyle, "left");
		ensurePosition(fixedStyle, "right");
		return Object.assign({}, headerCellStyles, fixedStyle);
	};
	const getHeaderCellClass = (rowIndex, columnIndex, row, column) => {
		const fixedClasses = getFixedColumnsClass(ns.b(), columnIndex, column.fixed, props.store, row);
		const classes = [
			column.id,
			column.order,
			column.headerAlign,
			column.className,
			column.labelClassName,
			...fixedClasses
		];
		if (!column.children) classes.push("is-leaf");
		if (column.sortable) classes.push("is-sortable");
		const headerCellClassName = parent?.props.headerCellClassName;
		if (isString(headerCellClassName)) classes.push(headerCellClassName);
		else if (isFunction(headerCellClassName)) classes.push(headerCellClassName.call(null, {
			rowIndex,
			columnIndex,
			row,
			column
		}));
		classes.push(ns.e("cell"));
		return classes.filter((className) => Boolean(className)).join(" ");
	};
	return {
		getHeaderRowStyle,
		getHeaderRowClass,
		getHeaderCellStyle,
		getHeaderCellClass
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-header/index.mjs
var table_header_default = defineComponent({
	name: "ElTableHeader",
	components: { ElCheckbox },
	props: {
		fixed: {
			type: String,
			default: ""
		},
		store: {
			required: true,
			type: Object
		},
		border: Boolean,
		defaultSort: {
			type: Object,
			default: () => {
				return {
					prop: "",
					order: ""
				};
			}
		},
		appendFilterPanelTo: { type: String },
		allowDragLastColumn: { type: Boolean }
	},
	setup(props, { emit }) {
		const instance = getCurrentInstance();
		const parent = inject(TABLE_INJECTION_KEY);
		const ns = useNamespace("table");
		const filterPanels = ref({});
		const { onColumnsChange, onScrollableChange } = useLayoutObserver(parent);
		const isTableLayoutAuto = parent?.props.tableLayout === "auto";
		const saveIndexSelection = reactive(/* @__PURE__ */ new Map());
		const theadRef = ref();
		let delayId;
		const updateFixedColumnStyle = () => {
			delayId = setTimeout(() => {
				if (saveIndexSelection.size > 0) {
					saveIndexSelection.forEach((column, key) => {
						const el = theadRef.value.querySelector(`.${key.replace(/\s/g, ".")}`);
						if (el) column.width = el.getBoundingClientRect().width || column.width;
					});
					saveIndexSelection.clear();
				}
			});
		};
		watch(saveIndexSelection, updateFixedColumnStyle);
		onBeforeUnmount(() => {
			if (delayId) {
				clearTimeout(delayId);
				delayId = void 0;
			}
		});
		onMounted(async () => {
			await nextTick();
			await nextTick();
			const { prop, order } = props.defaultSort;
			parent?.store.commit("sort", {
				prop,
				order,
				init: true
			});
			updateFixedColumnStyle();
		});
		const { handleHeaderClick, handleHeaderContextMenu, handleMouseDown, handleMouseMove, handleMouseOut, handleSortClick, handleFilterClick } = useEvent(props, emit);
		const { getHeaderRowStyle, getHeaderRowClass, getHeaderCellStyle, getHeaderCellClass } = useStyle$2(props);
		const { isGroup, toggleAllSelection, columnRows } = useUtils$1(props);
		const { t } = useLocale();
		instance.state = {
			onColumnsChange,
			onScrollableChange
		};
		instance.filterPanels = filterPanels;
		return {
			ns,
			t,
			filterPanels,
			onColumnsChange,
			onScrollableChange,
			columnRows,
			getHeaderRowClass,
			getHeaderRowStyle,
			getHeaderCellClass,
			getHeaderCellStyle,
			handleHeaderClick,
			handleHeaderContextMenu,
			handleMouseDown,
			handleMouseMove,
			handleMouseOut,
			handleSortClick,
			handleFilterClick,
			isGroup,
			toggleAllSelection,
			saveIndexSelection,
			isTableLayoutAuto,
			theadRef,
			updateFixedColumnStyle
		};
	},
	render() {
		const { ns, t, isGroup, columnRows, getHeaderCellStyle, getHeaderCellClass, getHeaderRowClass, getHeaderRowStyle, handleHeaderClick, handleHeaderContextMenu, handleMouseDown, handleMouseMove, handleSortClick, handleMouseOut, store, $parent, saveIndexSelection, isTableLayoutAuto } = this;
		let rowSpan = 1;
		return h$1("thead", {
			ref: "theadRef",
			class: ns.is("group", isGroup)
		}, columnRows.map((subColumns, rowIndex) => h$1("tr", {
			class: getHeaderRowClass(rowIndex),
			key: rowIndex,
			style: getHeaderRowStyle(rowIndex)
		}, subColumns.map((column, cellIndex) => {
			if (column.rowSpan > rowSpan) rowSpan = column.rowSpan;
			const _class = getHeaderCellClass(rowIndex, cellIndex, subColumns, column);
			if (isTableLayoutAuto && column.fixed) saveIndexSelection.set(_class, column);
			return h$1("th", {
				class: _class,
				colspan: column.colSpan,
				key: `${column.id}-thead`,
				rowspan: column.rowSpan,
				scope: column.colSpan > 1 ? "colgroup" : "col",
				ariaSort: column.sortable ? column.order : void 0,
				style: getHeaderCellStyle(rowIndex, cellIndex, subColumns, column),
				onClick: ($event) => {
					if ($event.currentTarget?.classList.contains("noclick")) return;
					handleHeaderClick($event, column);
				},
				onContextmenu: ($event) => handleHeaderContextMenu($event, column),
				onMousedown: ($event) => handleMouseDown($event, column),
				onMousemove: ($event) => handleMouseMove($event, column),
				onMouseout: handleMouseOut
			}, [h$1("div", { class: ["cell", column.filteredValue && column.filteredValue.length > 0 ? "highlight" : ""] }, [
				column.renderHeader ? column.renderHeader({
					column,
					$index: cellIndex,
					store,
					_self: $parent
				}) : column.label,
				column.sortable && h$1("button", {
					type: "button",
					class: "caret-wrapper",
					"aria-label": t("el.table.sortLabel", { column: column.label || "" }),
					onClick: ($event) => handleSortClick($event, column)
				}, [h$1("i", {
					onClick: ($event) => handleSortClick($event, column, "ascending"),
					class: "sort-caret ascending"
				}), h$1("i", {
					onClick: ($event) => handleSortClick($event, column, "descending"),
					class: "sort-caret descending"
				})]),
				column.filterable && h$1(filter_panel_default, {
					store,
					placement: column.filterPlacement || "bottom-start",
					appendTo: $parent?.appendFilterPanelTo,
					column,
					upDataColumn: (key, value) => {
						column[key] = value;
					}
				}, { "filter-icon": () => column.renderFilterIcon ? column.renderFilterIcon({ filterOpened: column.filterOpened }) : null })
			])]);
		}))));
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-body/events-helper.mjs
function useEvents(props) {
	const parent = inject(TABLE_INJECTION_KEY);
	const tooltipContent = ref("");
	const tooltipTrigger = ref(h$1("div"));
	const handleEvent = (event, row, name) => {
		const table = parent;
		const cell = getCell(event);
		let column = null;
		const namespace = table?.vnode.el?.dataset.prefix;
		if (cell) {
			column = getColumnByCell({ columns: props.store?.states.columns.value ?? [] }, cell, namespace);
			if (column) table?.emit(`cell-${name}`, row, column, cell, event);
		}
		table?.emit(`row-${name}`, row, column, event);
	};
	const handleDoubleClick = (event, row) => {
		handleEvent(event, row, "dblclick");
	};
	const handleClick = (event, row) => {
		props.store?.commit("setCurrentRow", row);
		handleEvent(event, row, "click");
	};
	const handleContextMenu = (event, row) => {
		handleEvent(event, row, "contextmenu");
	};
	const handleMouseEnter = debounce((index) => {
		props.store?.commit("setHoverRow", index);
	}, 30);
	const handleMouseLeave = debounce(() => {
		props.store?.commit("setHoverRow", null);
	}, 30);
	const getPadding = (el) => {
		const style = window.getComputedStyle(el, null);
		return {
			left: Number.parseInt(style.paddingLeft, 10) || 0,
			right: Number.parseInt(style.paddingRight, 10) || 0,
			top: Number.parseInt(style.paddingTop, 10) || 0,
			bottom: Number.parseInt(style.paddingBottom, 10) || 0
		};
	};
	const toggleRowClassByCell = (rowSpan, event, toggle) => {
		let node = (event?.target)?.parentNode;
		while (rowSpan > 1) {
			node = node?.nextSibling;
			if (!node || node.nodeName !== "TR") break;
			toggle(node, "hover-row hover-fixed-row");
			rowSpan--;
		}
	};
	const handleCellMouseEnter = (event, row, tooltipOptions) => {
		if (!parent) return;
		const table = parent;
		const cell = getCell(event);
		const namespace = table?.vnode.el?.dataset.prefix;
		let column = null;
		if (cell) {
			column = getColumnByCell({ columns: props.store?.states.columns.value ?? [] }, cell, namespace);
			if (!column) return;
			if (cell.rowSpan > 1) toggleRowClassByCell(cell.rowSpan, event, addClass);
			const hoverState = table.hoverState = {
				cell,
				column,
				row
			};
			table?.emit("cell-mouse-enter", hoverState.row, hoverState.column, hoverState.cell, event);
		}
		if (!tooltipOptions) {
			if (removePopper?.trigger === cell) removePopper?.();
			return;
		}
		const cellChild = event.target.querySelector(".cell");
		if (!(hasClass(cellChild, `${namespace}-tooltip`) && cellChild.childNodes.length && cellChild.textContent?.trim())) return;
		const range = document.createRange();
		range.setStart(cellChild, 0);
		range.setEnd(cellChild, cellChild.childNodes.length);
		/** detail: https://github.com/element-plus/element-plus/issues/10790
		*  What went wrong?
		*  UI > Browser > Zoom, In Blink/WebKit, getBoundingClientRect() sometimes returns inexact values, probably due to lost precision during internal calculations. In the example above:
		*    - Expected: 188
		*    - Actual: 188.00000762939453
		*/
		const { width: rangeWidth, height: rangeHeight } = range.getBoundingClientRect();
		const { width: cellChildWidth, height: cellChildHeight } = cellChild.getBoundingClientRect();
		const { top, left, right, bottom } = getPadding(cellChild);
		const horizontalPadding = left + right;
		const verticalPadding = top + bottom;
		if (isGreaterThan(rangeWidth + horizontalPadding, cellChildWidth) || isGreaterThan(rangeHeight + verticalPadding, cellChildHeight) || isGreaterThan(cellChild.scrollWidth, cellChildWidth)) createTablePopper(tooltipOptions, (cell?.innerText || cell?.textContent) ?? "", row, column, cell, table);
		else if (removePopper?.trigger === cell) removePopper?.();
	};
	const handleCellMouseLeave = (event) => {
		const cell = getCell(event);
		if (!cell) return;
		if (cell.rowSpan > 1) toggleRowClassByCell(cell.rowSpan, event, removeClass);
		const oldHoverState = parent?.hoverState;
		parent?.emit("cell-mouse-leave", oldHoverState?.row, oldHoverState?.column, oldHoverState?.cell, event);
	};
	return {
		handleDoubleClick,
		handleClick,
		handleContextMenu,
		handleMouseEnter,
		handleMouseLeave,
		handleCellMouseEnter,
		handleCellMouseLeave,
		tooltipContent,
		tooltipTrigger
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-body/styles-helper.mjs
function useStyles(props) {
	const parent = inject(TABLE_INJECTION_KEY);
	const ns = useNamespace("table");
	const getRowStyle = (row, rowIndex) => {
		const rowStyle = parent?.props.rowStyle;
		if (isFunction(rowStyle)) return rowStyle.call(null, {
			row,
			rowIndex
		});
		return rowStyle || null;
	};
	const getRowClass = (row, rowIndex, displayIndex) => {
		const classes = [ns.e("row")];
		if (parent?.props.highlightCurrentRow && row === props.store?.states.currentRow.value) classes.push("current-row");
		if (props.stripe && displayIndex % 2 === 1) classes.push(ns.em("row", "striped"));
		const rowClassName = parent?.props.rowClassName;
		if (isString(rowClassName)) classes.push(rowClassName);
		else if (isFunction(rowClassName)) classes.push(rowClassName.call(null, {
			row,
			rowIndex
		}));
		return classes;
	};
	const getCellStyle = (rowIndex, columnIndex, row, column) => {
		const cellStyle = parent?.props.cellStyle;
		let cellStyles = cellStyle ?? {};
		if (isFunction(cellStyle)) cellStyles = cellStyle.call(null, {
			rowIndex,
			columnIndex,
			row,
			column
		});
		const fixedStyle = getFixedColumnOffset(columnIndex, props?.fixed, props.store);
		ensurePosition(fixedStyle, "left");
		ensurePosition(fixedStyle, "right");
		return Object.assign({}, cellStyles, fixedStyle);
	};
	const getCellClass = (rowIndex, columnIndex, row, column, offset) => {
		const fixedClasses = getFixedColumnsClass(ns.b(), columnIndex, props?.fixed, props.store, void 0, offset);
		const classes = [
			column.id,
			column.align,
			column.className,
			...fixedClasses
		];
		const cellClassName = parent?.props.cellClassName;
		if (isString(cellClassName)) classes.push(cellClassName);
		else if (isFunction(cellClassName)) classes.push(cellClassName.call(null, {
			rowIndex,
			columnIndex,
			row,
			column
		}));
		classes.push(ns.e("cell"));
		return classes.filter((className) => Boolean(className)).join(" ");
	};
	const getSpan = (row, column, rowIndex, columnIndex) => {
		let rowspan = 1;
		let colspan = 1;
		const fn = parent?.props.spanMethod;
		if (isFunction(fn)) {
			const result = fn({
				row,
				column,
				rowIndex,
				columnIndex
			});
			if (isArray(result)) {
				rowspan = result[0];
				colspan = result[1];
			} else if (isObject(result)) {
				rowspan = result.rowspan;
				colspan = result.colspan;
			}
		}
		return {
			rowspan,
			colspan
		};
	};
	const getColspanRealWidth = (columns, colspan, index) => {
		if (colspan < 1) return columns[index].realWidth;
		const widthArr = columns.map(({ realWidth, width }) => realWidth || width).slice(index, index + colspan);
		return Number(widthArr.reduce((acc, width) => Number(acc) + Number(width), -1));
	};
	return {
		getRowStyle,
		getRowClass,
		getCellStyle,
		getCellClass,
		getSpan,
		getColspanRealWidth
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-body/td-wrapper.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = ["colspan", "rowspan"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-body/td-wrapper.mjs
var td_wrapper_default = /* @__PURE__ */ defineComponent({
	name: "TableTdWrapper",
	__name: "td-wrapper",
	props: {
		colspan: {
			type: Number,
			default: 1
		},
		rowspan: {
			type: Number,
			default: 1
		}
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("td", {
				colspan: __props.colspan,
				rowspan: __props.rowspan
			}, [renderSlot(_ctx.$slots, "default")], 8, _hoisted_1$1);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-body/render-helper.mjs
function useRender$1(props) {
	const parent = inject(TABLE_INJECTION_KEY);
	const ns = useNamespace("table");
	const { handleDoubleClick, handleClick, handleContextMenu, handleMouseEnter, handleMouseLeave, handleCellMouseEnter, handleCellMouseLeave, tooltipContent, tooltipTrigger } = useEvents(props);
	const { getRowStyle, getRowClass, getCellStyle, getCellClass, getSpan, getColspanRealWidth } = useStyles(props);
	let displayIndex = -1;
	const firstDefaultColumnIndex = computed(() => {
		return props.store?.states.columns.value.findIndex(({ type }) => type === "default");
	});
	const getKeyOfRow = (row, index) => {
		const rowKey = (parent?.props)?.rowKey;
		if (rowKey) return getRowIdentity(row, rowKey);
		return index;
	};
	const rowRender = (row, $index, treeRowData, expanded = false) => {
		const { tooltipEffect, tooltipOptions, store } = props;
		const { indent, columns } = store.states;
		const rowClasses = [];
		let display = true;
		if (treeRowData) {
			rowClasses.push(ns.em("row", `level-${treeRowData.level}`));
			display = !!treeRowData.display;
		}
		if ($index === 0) displayIndex = -1;
		if (props.stripe && display) displayIndex++;
		rowClasses.push(...getRowClass(row, $index, displayIndex));
		return h$1("tr", {
			style: [display ? null : { display: "none" }, getRowStyle(row, $index)],
			class: rowClasses,
			key: getKeyOfRow(row, $index),
			onDblclick: ($event) => handleDoubleClick($event, row),
			onClick: ($event) => handleClick($event, row),
			onContextmenu: ($event) => handleContextMenu($event, row),
			onMouseenter: () => handleMouseEnter($index),
			onMouseleave: handleMouseLeave
		}, columns.value.map((column, cellIndex) => {
			const { rowspan, colspan } = getSpan(row, column, $index, cellIndex);
			if (!rowspan || !colspan) return null;
			const columnData = Object.assign({}, column);
			columnData.realWidth = getColspanRealWidth(columns.value, colspan, cellIndex);
			const data = {
				store,
				_self: props.context || parent,
				column: columnData,
				row,
				$index,
				cellIndex,
				expanded
			};
			if (cellIndex === firstDefaultColumnIndex.value && treeRowData) {
				data.treeNode = {
					indent: treeRowData.level && treeRowData.level * indent.value,
					level: treeRowData.level
				};
				if (isBoolean(treeRowData.expanded)) {
					data.treeNode.expanded = treeRowData.expanded;
					if ("loading" in treeRowData) data.treeNode.loading = treeRowData.loading;
					if ("noLazyChildren" in treeRowData) data.treeNode.noLazyChildren = treeRowData.noLazyChildren;
				}
			}
			const baseKey = `${getKeyOfRow(row, $index)},${cellIndex}`;
			const patchKey = columnData.columnKey || columnData.rawColumnKey || "";
			const mergedTooltipOptions = column.showOverflowTooltip && merge({ effect: tooltipEffect }, tooltipOptions, column.showOverflowTooltip);
			return h$1(td_wrapper_default, {
				style: getCellStyle($index, cellIndex, row, column),
				class: getCellClass($index, cellIndex, row, column, colspan - 1),
				key: `${patchKey}${baseKey}`,
				rowspan,
				colspan,
				onMouseenter: ($event) => handleCellMouseEnter($event, row, mergedTooltipOptions),
				onMouseleave: handleCellMouseLeave
			}, { default: () => cellChildren(cellIndex, column, data) });
		}));
	};
	const cellChildren = (_cellIndex, column, data) => {
		return column.renderCell(data);
	};
	const wrappedRowRender = (row, $index) => {
		const store = props.store;
		const { isRowExpanded, assertRowKey } = store;
		const { treeData, lazyTreeNodeMap, childrenColumnName, rowKey } = store.states;
		const columns = store.states.columns.value;
		if (columns.some(({ type }) => type === "expand")) {
			const expanded = isRowExpanded(row);
			const tr = rowRender(row, $index, void 0, expanded);
			const renderExpanded = parent?.renderExpanded;
			if (!renderExpanded) {
				console.error("[Element Error]renderExpanded is required.");
				return tr;
			}
			const rows = [[tr]];
			if (parent.props.preserveExpandedContent || expanded) rows[0].push(h$1("tr", {
				key: `expanded-row__${tr.key}`,
				style: { display: expanded ? "" : "none" }
			}, [h$1("td", {
				colspan: columns.length,
				class: `${ns.e("cell")} ${ns.e("expanded-cell")}`
			}, [renderExpanded({
				row,
				$index,
				store,
				expanded
			})])]));
			return rows;
		} else if (Object.keys(treeData.value).length) {
			assertRowKey();
			const key = getRowIdentity(row, rowKey.value);
			let cur = treeData.value[key];
			let treeRowData = null;
			if (cur) {
				treeRowData = {
					expanded: cur.expanded,
					level: cur.level,
					display: true,
					noLazyChildren: void 0,
					loading: void 0
				};
				if (isBoolean(cur.lazy)) {
					if (treeRowData && isBoolean(cur.loaded) && cur.loaded) treeRowData.noLazyChildren = !(cur.children && cur.children.length);
					treeRowData.loading = cur.loading;
				}
			}
			const tmp = [rowRender(row, $index, treeRowData ?? void 0)];
			if (cur) {
				let i = 0;
				const traverse = (children, parent) => {
					if (!(children && children.length && parent)) return;
					children.forEach((node) => {
						const innerTreeRowData = {
							display: parent.display && parent.expanded,
							level: parent.level + 1,
							expanded: false,
							noLazyChildren: false,
							loading: false
						};
						const childKey = getRowIdentity(node, rowKey.value);
						if (isPropAbsent(childKey)) throw new Error("For nested data item, row-key is required.");
						cur = { ...treeData.value[childKey] };
						if (cur) {
							innerTreeRowData.expanded = cur.expanded;
							cur.level = cur.level || innerTreeRowData.level;
							cur.display = !!(cur.expanded && innerTreeRowData.display);
							if (isBoolean(cur.lazy)) {
								if (isBoolean(cur.loaded) && cur.loaded) innerTreeRowData.noLazyChildren = !(cur.children && cur.children.length);
								innerTreeRowData.loading = cur.loading;
							}
						}
						i++;
						tmp.push(rowRender(node, $index + i, innerTreeRowData));
						if (cur) traverse(lazyTreeNodeMap.value[childKey] || node[childrenColumnName.value], cur);
					});
				};
				cur.display = true;
				traverse(lazyTreeNodeMap.value[key] || row[childrenColumnName.value], cur);
			}
			return tmp;
		} else return rowRender(row, $index, void 0);
	};
	return {
		wrappedRowRender,
		tooltipContent,
		tooltipTrigger
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-body/index.mjs
var table_body_default = defineComponent({
	name: "ElTableBody",
	props: {
		store: {
			required: true,
			type: Object
		},
		stripe: Boolean,
		tooltipEffect: String,
		tooltipOptions: { type: Object },
		context: {
			default: () => ({}),
			type: Object
		},
		rowClassName: [String, Function],
		rowStyle: [Object, Function],
		fixed: {
			type: String,
			default: ""
		},
		highlight: Boolean
	},
	setup(props) {
		const instance = getCurrentInstance();
		const parent = inject(TABLE_INJECTION_KEY);
		const ns = useNamespace("table");
		const { wrappedRowRender, tooltipContent, tooltipTrigger } = useRender$1(props);
		const { onColumnsChange, onScrollableChange } = useLayoutObserver(parent);
		const hoveredCellList = [];
		watch(props.store?.states.hoverRow, (newVal, oldVal) => {
			const el = instance?.vnode.el;
			const rows = Array.from(el?.children || []).filter((e) => e?.classList.contains(`${ns.e("row")}`));
			let rowNum = newVal;
			const childNodes = rows[rowNum]?.childNodes;
			if (childNodes?.length) {
				let control = 0;
				Array.from(childNodes).reduce((acc, item, index) => {
					if (childNodes[index]?.colSpan > 1) control = childNodes[index]?.colSpan;
					if (item.nodeName !== "TD" && control === 0) acc.push(index);
					control > 0 && control--;
					return acc;
				}, []).forEach((rowIndex) => {
					rowNum = newVal;
					while (rowNum > 0) {
						const preChildNodes = rows[rowNum - 1]?.childNodes;
						if (preChildNodes[rowIndex] && preChildNodes[rowIndex].nodeName === "TD" && preChildNodes[rowIndex].rowSpan > 1) {
							addClass(preChildNodes[rowIndex], "hover-cell");
							hoveredCellList.push(preChildNodes[rowIndex]);
							break;
						}
						rowNum--;
					}
				});
			} else {
				hoveredCellList.forEach((item) => removeClass(item, "hover-cell"));
				hoveredCellList.length = 0;
			}
			if (!props.store?.states.isComplex.value || !isClient) return;
			rAF(() => {
				const oldRow = rows[oldVal];
				const newRow = rows[newVal];
				if (oldRow && !oldRow.classList.contains("hover-fixed-row")) removeClass(oldRow, "hover-row");
				if (newRow) addClass(newRow, "hover-row");
			});
		});
		onUnmounted(() => {
			removePopper?.();
		});
		return {
			ns,
			onColumnsChange,
			onScrollableChange,
			wrappedRowRender,
			tooltipContent,
			tooltipTrigger
		};
	},
	render() {
		const { wrappedRowRender, store } = this;
		return h$1("tbody", { tabIndex: -1 }, [(store?.states.data.value || []).reduce((acc, row) => {
			return acc.concat(wrappedRowRender(row, acc.length));
		}, [])]);
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-footer/mapState-helper.mjs
function useMapState() {
	const store = inject(TABLE_INJECTION_KEY)?.store;
	return {
		leftFixedLeafCount: computed(() => {
			return store?.states.fixedLeafColumnsLength.value ?? 0;
		}),
		rightFixedLeafCount: computed(() => {
			return store?.states.rightFixedColumns.value.length ?? 0;
		}),
		columnsCount: computed(() => {
			return store?.states.columns.value.length ?? 0;
		}),
		leftFixedCount: computed(() => {
			return store?.states.fixedColumns.value.length ?? 0;
		}),
		rightFixedCount: computed(() => {
			return store?.states.rightFixedColumns.value.length ?? 0;
		}),
		columns: computed(() => store?.states.columns.value ?? [])
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-footer/style-helper.mjs
function useStyle$1(props) {
	const { columns } = useMapState();
	const ns = useNamespace("table");
	const getCellClasses = (columns, cellIndex) => {
		const column = columns[cellIndex];
		const classes = [
			ns.e("cell"),
			column.id,
			column.align,
			column.labelClassName,
			...getFixedColumnsClass(ns.b(), cellIndex, column.fixed, props.store)
		];
		if (column.className) classes.push(column.className);
		if (!column.children) classes.push(ns.is("leaf"));
		return classes;
	};
	const getCellStyles = (column, cellIndex) => {
		const fixedStyle = getFixedColumnOffset(cellIndex, column.fixed, props.store);
		ensurePosition(fixedStyle, "left");
		ensurePosition(fixedStyle, "right");
		return fixedStyle;
	};
	return {
		getCellClasses,
		getCellStyles,
		columns
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-footer/index.mjs
var table_footer_default = defineComponent({
	name: "ElTableFooter",
	props: {
		fixed: {
			type: String,
			default: ""
		},
		store: {
			required: true,
			type: Object
		},
		summaryMethod: Function,
		sumText: String,
		border: Boolean,
		defaultSort: {
			type: Object,
			default: () => {
				return {
					prop: "",
					order: ""
				};
			}
		}
	},
	setup(props) {
		const parent = inject(TABLE_INJECTION_KEY);
		const ns = useNamespace("table");
		const { getCellClasses, getCellStyles, columns } = useStyle$1(props);
		const { onScrollableChange, onColumnsChange } = useLayoutObserver(parent);
		return {
			ns,
			onScrollableChange,
			onColumnsChange,
			getCellClasses,
			getCellStyles,
			columns
		};
	},
	render() {
		const { columns, getCellStyles, getCellClasses, summaryMethod, sumText } = this;
		const data = this.store.states.data.value;
		let sums = [];
		if (summaryMethod) sums = summaryMethod({
			columns,
			data
		});
		else columns.forEach((column, index) => {
			if (index === 0) {
				sums[index] = sumText;
				return;
			}
			const values = data.map((item) => Number(item[column.property]));
			const precisions = [];
			let notNumber = true;
			values.forEach((value) => {
				if (!Number.isNaN(+value)) {
					notNumber = false;
					const decimal = `${value}`.split(".")[1];
					precisions.push(decimal ? decimal.length : 0);
				}
			});
			const precision = Math.max.apply(null, precisions);
			if (!notNumber) sums[index] = values.reduce((prev, curr) => {
				const value = Number(curr);
				if (!Number.isNaN(+value)) return Number.parseFloat((prev + curr).toFixed(Math.min(precision, 20)));
				else return prev;
			}, 0);
			else sums[index] = "";
		});
		return h$1(h$1("tfoot", [h$1("tr", {}, [...columns.map((column, cellIndex) => h$1("td", {
			key: cellIndex,
			colspan: column.colSpan,
			rowspan: column.rowSpan,
			class: getCellClasses(columns, cellIndex),
			style: getCellStyles(column, cellIndex)
		}, [h$1("div", { class: ["cell", column.labelClassName] }, [sums[cellIndex]])]))])]));
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table/utils-helper.mjs
function useUtils(store) {
	const setCurrentRow = (row) => {
		store.commit("setCurrentRow", row);
	};
	const getSelectionRows = () => {
		return store.getSelectionRows();
	};
	const getHalfSelectionRows = () => {
		return store.getHalfSelectionRows();
	};
	const toggleRowSelection = (row, selected, ignoreSelectable = true) => {
		store.toggleRowSelection(row, selected, false, ignoreSelectable);
		store.updateAllSelected();
	};
	const clearSelection = () => {
		store.clearSelection();
	};
	const clearFilter = (columnKeys) => {
		store.clearFilter(columnKeys);
	};
	const toggleAllSelection = () => {
		store.commit("toggleAllSelection");
	};
	const toggleRowExpansion = (row, expanded) => {
		store.toggleRowExpansionAdapter(row, expanded);
	};
	const clearSort = () => {
		store.clearSort();
	};
	const sort = (prop, order) => {
		store.commit("sort", {
			prop,
			order
		});
	};
	const updateKeyChildren = (key, data) => {
		store.updateKeyChildren(key, data);
	};
	return {
		setCurrentRow,
		getSelectionRows,
		getHalfSelectionRows,
		toggleRowSelection,
		clearSelection,
		clearFilter,
		toggleAllSelection,
		toggleRowExpansion,
		clearSort,
		sort,
		updateKeyChildren
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table/style-helper.mjs
function useStyle(props, layout, store, table) {
	const isHidden = ref(false);
	const renderExpanded = ref(null);
	const resizeProxyVisible = ref(false);
	const setDragVisible = (visible) => {
		resizeProxyVisible.value = visible;
	};
	const resizeState = ref({
		width: null,
		height: null,
		headerHeight: null
	});
	const isGroup = ref(false);
	const scrollbarViewStyle = {
		display: "inline-block",
		verticalAlign: "middle"
	};
	const tableWidth = ref();
	const tableScrollHeight = ref(0);
	const bodyScrollHeight = ref(0);
	const headerScrollHeight = ref(0);
	const footerScrollHeight = ref(0);
	const appendScrollHeight = ref(0);
	watch(() => props.height, (value) => {
		layout.setHeight(value ?? null);
	}, { immediate: true });
	watch(() => props.maxHeight, (value) => {
		layout.setMaxHeight(value ?? null);
	}, { immediate: true });
	watch(() => [props.currentRowKey, store.states.rowKey], ([currentRowKey, rowKey]) => {
		if (!unref(rowKey) || !unref(currentRowKey)) return;
		store.setCurrentRowKey(`${currentRowKey}`);
	}, { immediate: true });
	watch(() => props.data, (data) => {
		table.store.commit("setData", data);
	}, {
		immediate: true,
		deep: true
	});
	watchEffect(() => {
		if (props.expandRowKeys) store.setExpandRowKeysAdapter(props.expandRowKeys);
	});
	const handleMouseLeave = () => {
		table.store.commit("setHoverRow", null);
		if (table.hoverState) table.hoverState = null;
	};
	const handleHeaderFooterMousewheel = (_event, data) => {
		const { pixelX, pixelY } = data;
		if (Math.abs(pixelX) >= Math.abs(pixelY)) table.refs.bodyWrapper.scrollLeft += data.pixelX / 5;
	};
	const shouldUpdateHeight = computed(() => {
		return props.height || props.maxHeight || store.states.fixedColumns.value.length > 0 || store.states.rightFixedColumns.value.length > 0;
	});
	const tableBodyStyles = computed(() => {
		return { width: layout.bodyWidth.value ? `${layout.bodyWidth.value}px` : "" };
	});
	const doLayout = () => {
		if (shouldUpdateHeight.value) layout.updateElsHeight();
		layout.updateColumnsWidth();
		if (typeof window === "undefined") return;
		requestAnimationFrame(syncPosition);
	};
	onMounted(async () => {
		await nextTick();
		store.updateColumns();
		bindEvents();
		requestAnimationFrame(doLayout);
		const el = table.vnode.el;
		const tableHeader = table.refs.headerWrapper;
		if (props.flexible && el && el.parentElement) el.parentElement.style.minWidth = "0";
		resizeState.value = {
			width: tableWidth.value = el.offsetWidth,
			height: el.offsetHeight,
			headerHeight: props.showHeader && tableHeader ? tableHeader.offsetHeight : null
		};
		store.states.columns.value.forEach((column) => {
			if (column.filteredValue && column.filteredValue.length) table.store.commit("filterChange", {
				column,
				values: column.filteredValue,
				silent: true
			});
		});
		table.$ready = true;
	});
	const setScrollClassByEl = (el, className) => {
		if (!el) return;
		const classList = Array.from(el.classList).filter((item) => !item.startsWith("is-scrolling-"));
		classList.push(layout.scrollX.value ? className : "is-scrolling-none");
		el.className = classList.join(" ");
	};
	const setScrollClass = (className) => {
		const { tableWrapper } = table.refs;
		setScrollClassByEl(tableWrapper, className);
	};
	const hasScrollClass = (className) => {
		const { tableWrapper } = table.refs;
		return !!(tableWrapper && tableWrapper.classList.contains(className));
	};
	const syncPosition = function() {
		if (!table.refs.scrollBarRef) return;
		if (!layout.scrollX.value) {
			const scrollingNoneClass = "is-scrolling-none";
			if (!hasScrollClass(scrollingNoneClass)) setScrollClass(scrollingNoneClass);
			return;
		}
		const scrollContainer = table.refs.scrollBarRef.wrapRef;
		if (!scrollContainer) return;
		const { scrollLeft, offsetWidth, scrollWidth } = scrollContainer;
		const { headerWrapper, footerWrapper } = table.refs;
		if (headerWrapper) headerWrapper.scrollLeft = scrollLeft;
		if (footerWrapper) footerWrapper.scrollLeft = scrollLeft;
		if (scrollLeft >= scrollWidth - offsetWidth - 1) setScrollClass("is-scrolling-right");
		else if (scrollLeft === 0) setScrollClass("is-scrolling-left");
		else setScrollClass("is-scrolling-middle");
	};
	const bindEvents = () => {
		if (!table.refs.scrollBarRef) return;
		if (table.refs.scrollBarRef.wrapRef) useEventListener(table.refs.scrollBarRef.wrapRef, "scroll", syncPosition, { passive: true });
		if (props.fit) useResizeObserver(table.vnode.el, resizeListener);
		else useEventListener(window, "resize", resizeListener);
		useResizeObserver(table.refs.tableInnerWrapper, () => {
			resizeListener();
			table.refs?.scrollBarRef?.update();
		});
	};
	const resizeListener = () => {
		const el = table.vnode.el;
		if (!table.$ready || !el) return;
		let shouldUpdateLayout = false;
		const { width: oldWidth, height: oldHeight, headerHeight: oldHeaderHeight } = resizeState.value;
		const width = tableWidth.value = el.offsetWidth;
		if (oldWidth !== width) shouldUpdateLayout = true;
		const height = el.offsetHeight;
		if ((props.height || shouldUpdateHeight.value) && oldHeight !== height) shouldUpdateLayout = true;
		const tableHeader = props.tableLayout === "fixed" ? table.refs.headerWrapper : table.refs.tableHeaderRef?.$el;
		if (props.showHeader && tableHeader?.offsetHeight !== oldHeaderHeight) shouldUpdateLayout = true;
		tableScrollHeight.value = table.refs.tableWrapper?.scrollHeight || 0;
		headerScrollHeight.value = tableHeader?.scrollHeight || 0;
		footerScrollHeight.value = table.refs.footerWrapper?.offsetHeight || 0;
		appendScrollHeight.value = table.refs.appendWrapper?.offsetHeight || 0;
		bodyScrollHeight.value = tableScrollHeight.value - headerScrollHeight.value - footerScrollHeight.value - appendScrollHeight.value;
		if (shouldUpdateLayout) {
			resizeState.value = {
				width,
				height,
				headerHeight: props.showHeader && tableHeader?.offsetHeight || 0
			};
			doLayout();
		}
	};
	const tableSize = useFormSize();
	const bodyWidth = computed(() => {
		const { bodyWidth: bodyWidth_, scrollY, gutterWidth } = layout;
		return bodyWidth_.value ? `${bodyWidth_.value - (scrollY.value ? gutterWidth : 0)}px` : "";
	});
	const tableLayout = computed(() => {
		if (props.maxHeight) return "fixed";
		return props.tableLayout;
	});
	return {
		isHidden,
		renderExpanded,
		setDragVisible,
		isGroup,
		handleMouseLeave,
		handleHeaderFooterMousewheel,
		tableSize,
		emptyBlockStyle: computed(() => {
			if (props.data && props.data.length) return;
			let height = "100%";
			if (props.height && bodyScrollHeight.value) height = `${bodyScrollHeight.value}px`;
			const width = tableWidth.value;
			return {
				width: width ? `${width}px` : "",
				height
			};
		}),
		resizeProxyVisible,
		bodyWidth,
		resizeState,
		doLayout,
		tableBodyStyles,
		tableLayout,
		scrollbarViewStyle,
		scrollbarStyle: computed(() => {
			if (props.height) return { height: "100%" };
			if (props.maxHeight) if (!Number.isNaN(Number(props.maxHeight))) return { maxHeight: `${+props.maxHeight - headerScrollHeight.value - footerScrollHeight.value}px` };
			else return { maxHeight: `calc(${props.maxHeight} - ${headerScrollHeight.value + footerScrollHeight.value}px)` };
			return {};
		})
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table/key-render-helper.mjs
function useKeyRender(table) {
	let observer;
	const initWatchDom = () => {
		const columnsWrapper = table.vnode.el.querySelector(".hidden-columns");
		const config = {
			childList: true,
			subtree: true
		};
		const updateOrderFns = table.store.states.updateOrderFns;
		observer = new MutationObserver(() => {
			updateOrderFns.forEach((fn) => fn());
		});
		observer.observe(columnsWrapper, config);
	};
	onMounted(() => {
		initWatchDom();
	});
	onUnmounted(() => {
		observer?.disconnect();
	});
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/h-helper.mjs
function hColgroup(props) {
	const isAuto = props.tableLayout === "auto";
	let columns = props.columns || [];
	if (isAuto) {
		if (columns.every(({ width }) => isUndefined(width))) columns = [];
	}
	const getPropsData = (column) => {
		const propsData = {
			key: `${props.tableLayout}_${column.id}`,
			style: {},
			name: void 0
		};
		if (isAuto) propsData.style = { width: `${column.width}px` };
		else propsData.name = column.id;
		return propsData;
	};
	return h$1("colgroup", {}, columns.map((column) => h$1("col", getPropsData(column))));
}
hColgroup.props = ["columns", "tableLayout"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/composables/use-scrollbar.mjs
var useScrollbar = () => {
	const scrollBarRef = ref();
	const scrollTo = (options, yCoord) => {
		const scrollbar = scrollBarRef.value;
		if (scrollbar) scrollbar.scrollTo(options, yCoord);
	};
	const setScrollPosition = (position, offset) => {
		const scrollbar = scrollBarRef.value;
		if (scrollbar && isNumber(offset) && ["Top", "Left"].includes(position)) scrollbar[`setScroll${position}`](offset);
	};
	const setScrollTop = (top) => setScrollPosition("Top", top);
	const setScrollLeft = (left) => setScrollPosition("Left", left);
	return {
		scrollBarRef,
		scrollTo,
		setScrollTop,
		setScrollLeft
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["data-prefix"];
var _hoisted_2 = {
	ref: "hiddenColumns",
	class: "hidden-columns"
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table.mjs
var table_default = /* @__PURE__ */ defineComponent({
	name: "ElTable",
	__name: "table",
	props: tableProps,
	emits: [
		"select",
		"select-all",
		"selection-change",
		"cell-mouse-enter",
		"cell-mouse-leave",
		"cell-dblclick",
		"cell-contextmenu",
		"cell-click",
		"row-dblclick",
		"row-click",
		"row-contextmenu",
		"header-click",
		"header-contextmenu",
		"sort-change",
		"filter-change",
		"current-change",
		"header-dragend",
		"expand-change",
		"scroll"
	],
	setup(__props, { expose: __expose }) {
		const props = __props;
		const { t } = useLocale();
		const ns = useNamespace("table");
		const globalConfig = useGlobalConfig("table");
		const table = getCurrentInstance();
		provide(TABLE_INJECTION_KEY, table);
		const store = createStore(table, props);
		table.store = store;
		const layout = new TableLayout({
			store: table.store,
			table,
			fit: props.fit,
			showHeader: props.showHeader
		});
		table.layout = layout;
		const isEmpty = computed(() => (store.states.data.value || []).length === 0);
		/**
		* open functions
		*/
		const { setCurrentRow, getSelectionRows, getHalfSelectionRows, toggleRowSelection, clearSelection, clearFilter, toggleAllSelection, toggleRowExpansion, clearSort, sort, updateKeyChildren } = useUtils(store);
		const { isHidden, renderExpanded, setDragVisible, isGroup, handleMouseLeave, handleHeaderFooterMousewheel, tableSize, emptyBlockStyle, resizeProxyVisible, bodyWidth, resizeState, doLayout, tableBodyStyles, tableLayout, scrollbarViewStyle, scrollbarStyle } = useStyle(props, layout, store, table);
		const { scrollBarRef, scrollTo, setScrollLeft, setScrollTop } = useScrollbar();
		const debouncedUpdateLayout = debounce(doLayout, 50);
		const tableId = createTableId(ns.namespace.value);
		const context = table;
		table.tableId = tableId;
		table.state = {
			isGroup,
			resizeState,
			doLayout,
			debouncedUpdateLayout
		};
		const computedSumText = computed(() => props.sumText ?? t("el.table.sumText"));
		const computedEmptyText = computed(() => {
			return props.emptyText ?? t("el.table.emptyText");
		});
		const computedTooltipEffect = computed(() => props.tooltipEffect ?? globalConfig.value?.tooltipEffect);
		const computedTooltipOptions = computed(() => props.tooltipOptions ?? globalConfig.value?.tooltipOptions);
		const columns = computed(() => {
			return convertToRows(store.states.originColumns.value)[0];
		});
		useKeyRender(table);
		onBeforeUnmount(() => {
			debouncedUpdateLayout.cancel();
		});
		__expose({
			ns,
			layout,
			store,
			columns,
			handleHeaderFooterMousewheel,
			handleMouseLeave,
			tableId,
			tableSize,
			isHidden,
			isEmpty,
			renderExpanded,
			resizeProxyVisible,
			resizeState,
			isGroup,
			bodyWidth,
			tableBodyStyles,
			emptyBlockStyle,
			debouncedUpdateLayout,
			/**
			* @description used in single selection Table, set a certain row selected. If called without any parameter, it will clear selection
			*/
			setCurrentRow,
			/**
			* @description returns the currently selected rows
			*/
			getSelectionRows,
			/**
			* @description returns the currently half-selected rows
			*/
			getHalfSelectionRows,
			/**
			* @description used in multiple selection Table, toggle if a certain row is selected. With the second parameter, you can directly set if this row is selected
			*/
			toggleRowSelection,
			/**
			* @description used in multiple selection Table, clear user selection
			*/
			clearSelection,
			/**
			* @description clear filters of the columns whose `columnKey` are passed in. If no params, clear all filters
			*/
			clearFilter,
			/**
			* @description used in multiple selection Table, toggle select all and deselect all
			*/
			toggleAllSelection,
			/**
			* @description used in expandable Table or tree Table, toggle if a certain row is expanded. With the second parameter, you can directly set if this row is expanded or collapsed
			*/
			toggleRowExpansion,
			/**
			* @description clear sorting, restore data to the original order
			*/
			clearSort,
			/**
			* @description refresh the layout of Table. When the visibility of Table changes, you may need to call this method to get a correct layout
			*/
			doLayout,
			/**
			* @description sort Table manually. Property `prop` is used to set sort column, property `order` is used to set sort order
			*/
			sort,
			/**
			* @description used in lazy Table, must set `rowKey`, update key children
			*/
			updateKeyChildren,
			t,
			setDragVisible,
			context,
			computedSumText,
			computedEmptyText,
			computedTooltipEffect,
			computedTooltipOptions,
			tableLayout,
			scrollbarViewStyle,
			scrollbarStyle,
			scrollBarRef,
			/**
			* @description scrolls to a particular set of coordinates
			*/
			scrollTo,
			/**
			* @description set horizontal scroll position
			*/
			setScrollLeft,
			/**
			* @description set vertical scroll position
			*/
			setScrollTop,
			/**
			* @description whether to allow drag the last column
			*/
			allowDragLastColumn: props.allowDragLastColumn
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref: "tableWrapper",
				class: normalizeClass([
					{
						[unref(ns).m("fit")]: __props.fit,
						[unref(ns).m("striped")]: __props.stripe,
						[unref(ns).m("border")]: __props.border || unref(isGroup),
						[unref(ns).m("hidden")]: unref(isHidden),
						[unref(ns).m("group")]: unref(isGroup),
						[unref(ns).m("fluid-height")]: __props.maxHeight,
						[unref(ns).m("scrollable-x")]: unref(layout).scrollX.value,
						[unref(ns).m("scrollable-y")]: unref(layout).scrollY.value,
						[unref(ns).m("enable-row-hover")]: !unref(store).states.isComplex.value,
						[unref(ns).m("enable-row-transition")]: (unref(store).states.data.value || []).length !== 0 && (unref(store).states.data.value || []).length < 100,
						"has-footer": __props.showSummary
					},
					unref(ns).m(unref(tableSize)),
					__props.className,
					unref(ns).b(),
					unref(ns).m(`layout-${unref(tableLayout)}`)
				]),
				style: normalizeStyle(__props.style),
				"data-prefix": unref(ns).namespace.value,
				onMouseleave: _cache[1] || (_cache[1] = (...args) => unref(handleMouseLeave) && unref(handleMouseLeave)(...args))
			}, [createBaseVNode("div", {
				ref: "tableInnerWrapper",
				class: normalizeClass(unref(ns).e("inner-wrapper"))
			}, [
				createBaseVNode("div", _hoisted_2, [renderSlot(_ctx.$slots, "default")], 512),
				__props.showHeader && unref(tableLayout) === "fixed" ? withDirectives((openBlock(), createElementBlock("div", {
					key: 0,
					ref: "headerWrapper",
					class: normalizeClass(unref(ns).e("header-wrapper"))
				}, [createBaseVNode("table", {
					ref: "tableHeader",
					class: normalizeClass(unref(ns).e("header")),
					style: normalizeStyle(unref(tableBodyStyles)),
					border: "0",
					cellpadding: "0",
					cellspacing: "0"
				}, [createVNode(unref(hColgroup), {
					columns: unref(store).states.columns.value,
					"table-layout": unref(tableLayout)
				}, null, 8, ["columns", "table-layout"]), createVNode(unref(table_header_default), {
					ref: "tableHeaderRef",
					border: __props.border,
					"default-sort": __props.defaultSort,
					store: unref(store),
					"append-filter-panel-to": __props.appendFilterPanelTo,
					"allow-drag-last-column": __props.allowDragLastColumn,
					onSetDragVisible: unref(setDragVisible)
				}, null, 8, [
					"border",
					"default-sort",
					"store",
					"append-filter-panel-to",
					"allow-drag-last-column",
					"onSetDragVisible"
				])], 6)], 2)), [[unref(Mousewheel), unref(handleHeaderFooterMousewheel)]]) : createCommentVNode("v-if", true),
				createBaseVNode("div", {
					ref: "bodyWrapper",
					class: normalizeClass(unref(ns).e("body-wrapper"))
				}, [createVNode(unref(ElScrollbar), {
					ref_key: "scrollBarRef",
					ref: scrollBarRef,
					"view-style": unref(scrollbarViewStyle),
					"wrap-style": unref(scrollbarStyle),
					always: __props.scrollbarAlwaysOn,
					tabindex: __props.scrollbarTabindex,
					native: __props.nativeScrollbar,
					onScroll: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("scroll", $event))
				}, {
					default: withCtx(() => [
						createBaseVNode("table", {
							ref: "tableBody",
							class: normalizeClass(unref(ns).e("body")),
							cellspacing: "0",
							cellpadding: "0",
							border: "0",
							style: normalizeStyle({
								width: unref(bodyWidth),
								tableLayout: unref(tableLayout)
							})
						}, [
							createVNode(unref(hColgroup), {
								columns: unref(store).states.columns.value,
								"table-layout": unref(tableLayout)
							}, null, 8, ["columns", "table-layout"]),
							__props.showHeader && unref(tableLayout) === "auto" ? (openBlock(), createBlock(unref(table_header_default), {
								key: 0,
								ref: "tableHeaderRef",
								class: normalizeClass(unref(ns).e("body-header")),
								border: __props.border,
								"default-sort": __props.defaultSort,
								store: unref(store),
								"append-filter-panel-to": __props.appendFilterPanelTo,
								onSetDragVisible: unref(setDragVisible)
							}, null, 8, [
								"class",
								"border",
								"default-sort",
								"store",
								"append-filter-panel-to",
								"onSetDragVisible"
							])) : createCommentVNode("v-if", true),
							createVNode(unref(table_body_default), {
								context: unref(context),
								highlight: __props.highlightCurrentRow,
								"row-class-name": __props.rowClassName,
								"tooltip-effect": computedTooltipEffect.value,
								"tooltip-options": computedTooltipOptions.value,
								"row-style": __props.rowStyle,
								store: unref(store),
								stripe: __props.stripe
							}, null, 8, [
								"context",
								"highlight",
								"row-class-name",
								"tooltip-effect",
								"tooltip-options",
								"row-style",
								"store",
								"stripe"
							]),
							__props.showSummary && unref(tableLayout) === "auto" ? (openBlock(), createBlock(unref(table_footer_default), {
								key: 1,
								class: normalizeClass(unref(ns).e("body-footer")),
								border: __props.border,
								"default-sort": __props.defaultSort,
								store: unref(store),
								"sum-text": computedSumText.value,
								"summary-method": __props.summaryMethod
							}, null, 8, [
								"class",
								"border",
								"default-sort",
								"store",
								"sum-text",
								"summary-method"
							])) : createCommentVNode("v-if", true)
						], 6),
						isEmpty.value ? (openBlock(), createElementBlock("div", {
							key: 0,
							ref: "emptyBlock",
							style: normalizeStyle(unref(emptyBlockStyle)),
							class: normalizeClass(unref(ns).e("empty-block"))
						}, [createBaseVNode("span", { class: normalizeClass(unref(ns).e("empty-text")) }, [renderSlot(_ctx.$slots, "empty", {}, () => [createTextVNode(toDisplayString(computedEmptyText.value), 1)])], 2)], 6)) : createCommentVNode("v-if", true),
						_ctx.$slots.append ? (openBlock(), createElementBlock("div", {
							key: 1,
							ref: "appendWrapper",
							class: normalizeClass(unref(ns).e("append-wrapper"))
						}, [renderSlot(_ctx.$slots, "append")], 2)) : createCommentVNode("v-if", true)
					]),
					_: 3
				}, 8, [
					"view-style",
					"wrap-style",
					"always",
					"tabindex",
					"native"
				])], 2),
				__props.showSummary && unref(tableLayout) === "fixed" ? withDirectives((openBlock(), createElementBlock("div", {
					key: 1,
					ref: "footerWrapper",
					class: normalizeClass(unref(ns).e("footer-wrapper"))
				}, [createBaseVNode("table", {
					class: normalizeClass(unref(ns).e("footer")),
					cellspacing: "0",
					cellpadding: "0",
					border: "0",
					style: normalizeStyle(unref(tableBodyStyles))
				}, [createVNode(unref(hColgroup), {
					columns: unref(store).states.columns.value,
					"table-layout": unref(tableLayout)
				}, null, 8, ["columns", "table-layout"]), createVNode(unref(table_footer_default), {
					border: __props.border,
					"default-sort": __props.defaultSort,
					store: unref(store),
					"sum-text": computedSumText.value,
					"summary-method": __props.summaryMethod
				}, null, 8, [
					"border",
					"default-sort",
					"store",
					"sum-text",
					"summary-method"
				])], 6)], 2)), [[vShow, !isEmpty.value], [unref(Mousewheel), unref(handleHeaderFooterMousewheel)]]) : createCommentVNode("v-if", true),
				__props.border || unref(isGroup) ? (openBlock(), createElementBlock("div", {
					key: 2,
					class: normalizeClass(unref(ns).e("border-left-patch"))
				}, null, 2)) : createCommentVNode("v-if", true)
			], 2), withDirectives(createBaseVNode("div", {
				ref: "resizeProxy",
				class: normalizeClass(unref(ns).e("column-resize-proxy"))
			}, null, 2), [[vShow, unref(resizeProxyVisible)]])], 46, _hoisted_1);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-column/defaults.mjs
/**
* @deprecated Removed after 3.0.0, Use `TableColumnProps` instead.
*/
var tableColumnProps = {
	/**
	* @description type of the column. If set to `selection`, the column will display checkbox. If set to `index`, the column will display index of the row (staring from 1). If set to `expand`, the column will display expand icon
	*/
	type: {
		type: String,
		default: "default"
	},
	/**
	* @description column label
	*/
	label: String,
	/**
	* @description class name of cells in the column
	*/
	className: String,
	/**
	* @description class name of the label of this column
	*/
	labelClassName: String,
	/**
	* @description
	*/
	property: String,
	/**
	* @description field name. You can also use its alias: `property`
	*/
	prop: String,
	/**
	* @description column width
	*/
	width: {
		type: [String, Number],
		default: ""
	},
	/**
	* @description column minimum width. Columns with `width` has a fixed width, while columns with `min-width` has a width that is distributed in proportion
	*/
	minWidth: {
		type: [String, Number],
		default: ""
	},
	/**
	* @description render function for table header of this column
	*/
	renderHeader: Function,
	/**
	* @description whether column can be sorted. Remote sorting can be done by setting this attribute to 'custom' and listening to the `sort-change` event of Table
	*/
	sortable: {
		type: [Boolean, String],
		default: false
	},
	/**
	* @description sorting method, works when `sortable` is `true`. Should return a number, just like Array.sort
	*/
	sortMethod: Function,
	/**
	* @description specify which property to sort by, works when `sortable` is `true` and `sort-method` is `undefined`. If set to an Array, the column will sequentially sort by the next property if the previous one is equal
	*/
	sortBy: [
		String,
		Function,
		Array
	],
	/**
	* @description whether column width can be resized, works when `border` of `el-table` is `true`
	*/
	resizable: {
		type: Boolean,
		default: true
	},
	/**
	* @description column's key. If you need to use the filter-change event, you need this attribute to identify which column is being filtered
	*/
	columnKey: String,
	/**
	* @description alignment, the value should be 'left' \/ 'center' \/ 'right'
	*/
	align: String,
	/**
	* @description alignment of the table header. If omitted, the value of the above `align` attribute will be applied, the value should be 'left' \/ 'center' \/ 'right'
	*/
	headerAlign: String,
	/**
	* @description whether to hide extra content and show them in a tooltip when hovering on the cell
	*/
	showOverflowTooltip: {
		type: [Boolean, Object],
		default: void 0
	},
	/**
	* @description function that formats cell tooltip content, works when `show-overflow-tooltip` is `true`
	*/
	tooltipFormatter: Function,
	/**
	* @description whether column is fixed at left / right. Will be fixed at left if `true`
	*/
	fixed: [Boolean, String],
	/**
	* @description function that formats cell content
	*/
	formatter: Function,
	/**
	* @description function that determines if a certain row can be selected, works when `type` is 'selection'
	*/
	selectable: Function,
	/**
	* @description whether to reserve selection after data refreshing, works when `type` is 'selection'. Note that `row-key` is required for this to work
	*/
	reserveSelection: Boolean,
	/**
	* @description data filtering method. If `filter-multiple` is on, this method will be called multiple times for each row, and a row will display if one of the calls returns `true`
	*/
	filterMethod: Function,
	/**
	* @description filter value for selected data, might be useful when table header is rendered with `render-header`
	*/
	filteredValue: Array,
	/**
	* @description an array of data filtering options. For each element in this array, `text` and `value` are required
	*/
	filters: Array,
	/**
	* @description placement for the filter dropdown
	*/
	filterPlacement: String,
	/**
	* @description whether data filtering supports multiple options
	*/
	filterMultiple: {
		type: Boolean,
		default: true
	},
	/**
	* @description className for the filter dropdown
	*/
	filterClassName: String,
	/**
	* @description customize indices for each row, works on columns with `type=index`
	*/
	index: [Number, Function],
	/**
	* @description the order of the sorting strategies used when sorting the data, works when `sortable` is `true`. Accepts an array, as the user clicks on the header, the column is sorted in order of the elements in the array
	*/
	sortOrders: {
		type: Array,
		default: () => {
			return [
				"ascending",
				"descending",
				null
			];
		},
		validator: (val) => {
			return val.every((order) => [
				"ascending",
				"descending",
				null
			].includes(order));
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/config.mjs
var defaultClassNames = {
	selection: "table-column--selection",
	expand: "table__expand-column"
};
var cellStarts = {
	default: { order: "" },
	selection: {
		width: 48,
		minWidth: 48,
		realWidth: 48,
		order: ""
	},
	expand: {
		width: 48,
		minWidth: 48,
		realWidth: 48,
		order: ""
	},
	index: {
		width: 48,
		minWidth: 48,
		realWidth: 48,
		order: ""
	}
};
var getDefaultClassName = (type) => {
	return defaultClassNames[type] || "";
};
var cellForced = {
	selection: {
		renderHeader({ store }) {
			function isDisabled() {
				return store.states.data.value && store.states.data.value.length === 0;
			}
			return h$1(ElCheckbox, {
				disabled: isDisabled(),
				size: store.states.tableSize.value,
				indeterminate: store.states.selection.value.length > 0 && !store.states.isAllSelected.value,
				"onUpdate:modelValue": store.toggleAllSelection ?? void 0,
				modelValue: store.states.isAllSelected.value,
				ariaLabel: store.t("el.table.selectAllLabel")
			});
		},
		renderCell({ row, column, store, $index }) {
			return h$1(ElCheckbox, {
				disabled: column.selectable ? !column.selectable.call(null, row, $index) : false,
				size: store.states.tableSize.value,
				onChange: () => {
					store.commit("rowSelectedChanged", row);
				},
				onClick: (event) => event.stopPropagation(),
				modelValue: store.isSelected(row),
				indeterminate: store.getRowIndeterminate(row),
				ariaLabel: store.t("el.table.selectRowLabel")
			});
		},
		sortable: false,
		resizable: false
	},
	index: {
		renderHeader({ column }) {
			return column.label || "#";
		},
		renderCell({ column, $index }) {
			let i = $index + 1;
			const index = column.index;
			if (isNumber(index)) i = $index + index;
			else if (isFunction(index)) i = index($index);
			return h$1("div", {}, [i]);
		},
		sortable: false
	},
	expand: {
		renderHeader({ column }) {
			return column.label || "";
		},
		renderCell({ column, row, store, expanded, $index }) {
			const { ns } = store;
			const classes = [ns.e("expand-icon")];
			if (!column.renderExpand && expanded) classes.push(ns.em("expand-icon", "expanded"));
			const callback = function(e) {
				e.stopPropagation();
				store.toggleRowExpansion(row);
			};
			const isRowExpandable = store.states.rowExpandable.value?.(row, $index) ?? true;
			if (!isRowExpandable) classes.push(ns.is("disabled"));
			return h$1("button", {
				type: "button",
				disabled: !isRowExpandable,
				"aria-label": store.t(expanded ? "el.table.collapseRowLabel" : "el.table.expandRowLabel"),
				"aria-expanded": expanded,
				class: classes,
				onClick: callback
			}, { default: () => {
				if (column.renderExpand) return [column.renderExpand({
					expanded,
					expandable: isRowExpandable
				})];
				return [h$1(ElIcon, null, { default: () => {
					return [h$1(arrow_right_default)];
				} })];
			} });
		},
		sortable: false,
		resizable: false
	}
};
function defaultRenderCell({ row, column, $index }) {
	const property = column.property;
	const value = property && getProp(row, property).value;
	if (column && column.formatter) return column.formatter(row, column, value, $index);
	return value?.toString?.() || "";
}
function treeCellPrefix({ row, treeNode, store }, createPlaceholder = false) {
	const { ns } = store;
	if (!treeNode) {
		if (createPlaceholder) return [h$1("span", { class: ns.e("placeholder") })];
		return null;
	}
	const ele = [];
	const callback = function(e) {
		e.stopPropagation();
		if (treeNode.loading) return;
		store.loadOrToggle(row);
	};
	if (treeNode.indent) ele.push(h$1("span", {
		class: ns.e("indent"),
		style: { "padding-left": `${treeNode.indent}px` }
	}));
	if (isBoolean(treeNode.expanded) && !treeNode.noLazyChildren) {
		const expandClasses = [ns.e("expand-icon"), treeNode.expanded ? ns.em("expand-icon", "expanded") : ""];
		let icon = arrow_right_default;
		if (treeNode.loading) icon = loading_default;
		ele.push(h$1("button", {
			type: "button",
			"aria-label": store.t(treeNode.expanded ? "el.table.collapseRowLabel" : "el.table.expandRowLabel"),
			"aria-expanded": treeNode.expanded,
			class: expandClasses,
			onClick: callback
		}, { default: () => {
			return [h$1(ElIcon, { class: ns.is("loading", treeNode.loading) }, { default: () => [h$1(icon)] })];
		} }));
	} else ele.push(h$1("span", { class: ns.e("placeholder") }));
	return ele;
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-column/watcher-helper.mjs
function getAllAliases(props, aliases) {
	return props.reduce((prev, cur) => {
		prev[cur] = cur;
		return prev;
	}, aliases);
}
function useWatcher(owner, props_) {
	const instance = getCurrentInstance();
	const registerComplexWatchers = () => {
		const props = ["fixed"];
		const aliases = {
			realWidth: "width",
			realMinWidth: "minWidth"
		};
		const allAliases = getAllAliases(props, aliases);
		Object.keys(allAliases).forEach((key) => {
			const columnKey = aliases[key];
			if (hasOwn(props_, columnKey)) watch(() => props_[columnKey], (newVal) => {
				let value = newVal;
				if (columnKey === "width" && key === "realWidth") value = parseWidth(newVal);
				if (columnKey === "minWidth" && key === "realMinWidth") value = parseMinWidth(newVal);
				instance.columnConfig.value[columnKey] = value;
				instance.columnConfig.value[key] = value;
				const updateColumns = columnKey === "fixed";
				owner.value.store.scheduleLayout(updateColumns);
			});
		});
	};
	const registerNormalWatchers = () => {
		const props = [
			"label",
			"filters",
			"filterMultiple",
			"filteredValue",
			"sortable",
			"index",
			"formatter",
			"className",
			"labelClassName",
			"filterClassName",
			"showOverflowTooltip",
			"tooltipFormatter",
			"resizable"
		];
		const parentProps = ["showOverflowTooltip"];
		const aliases = {
			property: "prop",
			align: "realAlign",
			headerAlign: "realHeaderAlign"
		};
		const allAliases = getAllAliases(props, aliases);
		Object.keys(allAliases).forEach((key) => {
			const columnKey = aliases[key];
			if (hasOwn(props_, columnKey)) watch(() => props_[columnKey], (newVal) => {
				instance.columnConfig.value[key] = newVal;
				if (key === "filters" || key === "filterMethod") instance.columnConfig.value["filterable"] = !!(instance.columnConfig.value["filters"] || instance.columnConfig.value["filterMethod"]);
			});
		});
		parentProps.forEach((key) => {
			if (hasOwn(owner.value.props, key)) watch(() => owner.value.props[key], (newVal) => {
				if (instance.columnConfig.value.type === "selection") return;
				if (!isUndefined(props_[key])) return;
				instance.columnConfig.value[key] = newVal;
			});
		});
		const globalConfig = useGlobalConfig("table");
		if (globalConfig.value && hasOwn(globalConfig.value, "showOverflowTooltip")) watch(() => globalConfig.value?.showOverflowTooltip, (newVal) => {
			if (instance.columnConfig.value.type === "selection") return;
			if (!isUndefined(props_.showOverflowTooltip) || !isUndefined(owner.value.props.showOverflowTooltip)) return;
			instance.columnConfig.value.showOverflowTooltip = newVal;
		});
	};
	return {
		registerComplexWatchers,
		registerNormalWatchers
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/table-column/render-helper.mjs
function useRender(props, slots, owner) {
	const instance = getCurrentInstance();
	const columnId = ref("");
	const isSubColumn = ref(false);
	const realAlign = ref();
	const realHeaderAlign = ref();
	const ns = useNamespace("table");
	watchEffect(() => {
		realAlign.value = props.align ? `is-${props.align}` : null;
		realAlign.value;
	});
	watchEffect(() => {
		realHeaderAlign.value = props.headerAlign ? `is-${props.headerAlign}` : realAlign.value;
		realHeaderAlign.value;
	});
	const columnOrTableParent = computed(() => {
		let parent = instance.vnode.vParent || instance.parent;
		while (parent && !parent.tableId && !parent.columnId) parent = parent.vnode.vParent || parent.parent;
		return parent;
	});
	const hasTreeColumn = computed(() => {
		const { store } = instance.parent;
		if (!store) return false;
		const { treeData } = store.states;
		const treeDataValue = treeData.value;
		return treeDataValue && Object.keys(treeDataValue).length > 0;
	});
	const realWidth = ref(parseWidth(props.width));
	const realMinWidth = ref(parseMinWidth(props.minWidth));
	const setColumnWidth = (column) => {
		if (realWidth.value) column.width = realWidth.value;
		if (realMinWidth.value) column.minWidth = realMinWidth.value;
		if (!realWidth.value && realMinWidth.value) column.width = void 0;
		if (!column.minWidth) column.minWidth = 80;
		column.realWidth = Number(isUndefined(column.width) ? column.minWidth : column.width);
		return column;
	};
	const setColumnForcedProps = (column) => {
		const type = column.type;
		const source = cellForced[type] || {};
		Object.keys(source).forEach((prop) => {
			const value = source[prop];
			if (prop !== "className" && !isUndefined(value)) column[prop] = value;
		});
		const className = getDefaultClassName(type);
		if (className) {
			const forceClass = `${unref(ns.namespace)}-${className}`;
			column.className = column.className ? `${column.className} ${forceClass}` : forceClass;
		}
		return column;
	};
	const checkSubColumn = (children) => {
		if (isArray(children)) children.forEach((child) => check(child));
		else check(children);
		function check(item) {
			if (item?.type?.name === "ElTableColumn") item.vParent = instance;
		}
	};
	const setColumnRenders = (column) => {
		if (props.renderHeader) debugWarn("TableColumn", "Comparing to render-header, scoped-slot header is easier to use. We recommend users to use scoped-slot header.");
		else if (column.type !== "selection") column.renderHeader = (scope) => {
			instance.columnConfig.value["label"];
			if (slots.header) {
				const slotResult = slots.header(scope);
				if (ensureValidVNode(slotResult)) return h$1(Fragment, slotResult);
			}
			return createTextVNode(column.label);
		};
		if (slots["filter-icon"]) column.renderFilterIcon = (scope) => {
			return renderSlot(slots, "filter-icon", scope);
		};
		if (slots.expand) column.renderExpand = (scope) => {
			return renderSlot(slots, "expand", scope);
		};
		let originRenderCell = column.renderCell;
		if (column.type === "expand") {
			column.renderCell = (data) => h$1("div", { class: "cell" }, [originRenderCell(data)]);
			owner.value.renderExpanded = (row) => {
				return slots.default ? slots.default(row) : slots.default;
			};
		} else {
			originRenderCell = originRenderCell || defaultRenderCell;
			column.renderCell = (data) => {
				let children = null;
				if (slots.default) {
					const vnodes = slots.default(data);
					children = vnodes.some((v) => v.type !== Comment) ? vnodes : originRenderCell(data);
				} else children = originRenderCell(data);
				const { columns } = owner.value.store.states;
				const firstUserColumnIndex = columns.value.findIndex((item) => item.type === "default");
				const prefix = treeCellPrefix(data, hasTreeColumn.value && data.cellIndex === firstUserColumnIndex);
				const props = {
					class: "cell",
					style: {}
				};
				if (column.showOverflowTooltip) {
					props.class = `${props.class} ${unref(ns.namespace)}-tooltip`;
					props.style = { width: `${(data.column.realWidth || Number(data.column.width)) - 1}px` };
				}
				checkSubColumn(children);
				return h$1("div", props, [prefix, children]);
			};
		}
		return column;
	};
	const getPropsData = (...propsKey) => {
		return propsKey.reduce((prev, cur) => {
			if (isArray(cur)) cur.forEach((key) => {
				prev[key] = props[key];
			});
			return prev;
		}, {});
	};
	const getColumnElIndex = (children, child) => {
		return Array.prototype.indexOf.call(children, child);
	};
	const updateColumnOrder = () => {
		owner.value.store.commit("updateColumnOrder", instance.columnConfig.value);
	};
	return {
		columnId,
		realAlign,
		isSubColumn,
		realHeaderAlign,
		columnOrTableParent,
		setColumnWidth,
		setColumnForcedProps,
		setColumnRenders,
		getPropsData,
		getColumnElIndex,
		updateColumnOrder
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/src/tableColumn.mjs
var tableColumn_default = /* @__PURE__ */ defineComponent({
	name: "ElTableColumn",
	__name: "index",
	props: tableColumnProps,
	setup(__props) {
		const props = __props;
		const slots = useSlots();
		const instance = getCurrentInstance();
		const globalConfig = useGlobalConfig("table");
		const columnConfig = ref({});
		const owner = computed(() => {
			let parent = instance.parent;
			while (parent && !parent.tableId) parent = parent.parent;
			return parent;
		});
		const { registerNormalWatchers, registerComplexWatchers } = useWatcher(owner, props);
		const { columnId, isSubColumn, realHeaderAlign, columnOrTableParent, setColumnWidth, setColumnForcedProps, setColumnRenders, getPropsData, getColumnElIndex, realAlign, updateColumnOrder } = useRender(props, slots, owner);
		const parent = columnOrTableParent.value;
		columnId.value = createTableColumnId("tableId" in parent ? parent.tableId : parent.columnId);
		onBeforeMount(() => {
			isSubColumn.value = owner.value !== parent;
			const type = props.type || "default";
			const sortable = props.sortable === "" ? true : props.sortable;
			const showOverflowTooltip = type === "selection" ? false : isUndefined(props.showOverflowTooltip) ? parent.props.showOverflowTooltip ?? globalConfig.value?.showOverflowTooltip : props.showOverflowTooltip;
			const tooltipFormatter = isUndefined(props.tooltipFormatter) ? parent.props.tooltipFormatter ?? globalConfig.value?.tooltipFormatter : props.tooltipFormatter;
			const defaults = {
				...cellStarts[type],
				id: columnId.value,
				type,
				property: props.prop || props.property,
				align: realAlign,
				headerAlign: realHeaderAlign,
				showOverflowTooltip,
				tooltipFormatter,
				filterable: props.filters || props.filterMethod,
				filteredValue: [],
				filterPlacement: "",
				filterClassName: "",
				isColumnGroup: false,
				isSubColumn: false,
				filterOpened: false,
				sortable,
				index: props.index,
				rawColumnKey: instance.vnode.key
			};
			let column = getPropsData([
				"columnKey",
				"label",
				"className",
				"labelClassName",
				"type",
				"renderHeader",
				"formatter",
				"fixed",
				"resizable"
			], [
				"sortMethod",
				"sortBy",
				"sortOrders"
			], ["selectable", "reserveSelection"], [
				"filterMethod",
				"filters",
				"filterMultiple",
				"filterOpened",
				"filteredValue",
				"filterPlacement",
				"filterClassName"
			]);
			column = mergeOptions(defaults, column);
			column = compose(setColumnRenders, setColumnWidth, setColumnForcedProps)(column);
			columnConfig.value = column;
			registerNormalWatchers();
			registerComplexWatchers();
		});
		onMounted(() => {
			const parent = columnOrTableParent.value;
			const children = isSubColumn.value ? parent.vnode.el?.children : parent.refs.hiddenColumns?.children;
			const getColumnIndex = () => getColumnElIndex(children || [], instance.vnode.el);
			columnConfig.value.getColumnIndex = getColumnIndex;
			getColumnIndex() > -1 && owner.value.store.commit("insertColumn", columnConfig.value, isSubColumn.value ? "columnConfig" in parent && parent.columnConfig.value : null, updateColumnOrder);
		});
		onBeforeUnmount(() => {
			const getColumnIndex = columnConfig.value.getColumnIndex;
			(getColumnIndex ? getColumnIndex() : -1) > -1 && owner.value.store.commit("removeColumn", columnConfig.value, isSubColumn.value ? "columnConfig" in parent && parent.columnConfig.value : null, updateColumnOrder);
		});
		instance.columnId = columnId.value;
		instance.columnConfig = columnConfig;
		const TableColumnRenderer = () => {
			try {
				const renderDefault = slots.default?.({
					row: {},
					column: {},
					$index: -1
				});
				const children = [];
				if (isArray(renderDefault)) {
					for (const childNode of renderDefault) if (childNode.type?.name === "ElTableColumn" || childNode.shapeFlag & 2) children.push(childNode);
					else if (childNode.type === Fragment && isArray(childNode.children)) childNode.children.forEach((vnode) => {
						if (vnode?.patchFlag !== 1024 && !isString(vnode?.children)) children.push(vnode);
					});
				}
				return h$1("div", children);
			} catch {
				return h$1("div", []);
			}
		};
		return (_ctx, _cache) => {
			return openBlock(), createBlock(TableColumnRenderer);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/table/index.mjs
var ElTable = withInstall(table_default, { TableColumn: tableColumn_default });
var ElTableColumn = withNoopInstall(tableColumn_default);
//#endregion
export { ElTableColumn as n, ElTable as t };
