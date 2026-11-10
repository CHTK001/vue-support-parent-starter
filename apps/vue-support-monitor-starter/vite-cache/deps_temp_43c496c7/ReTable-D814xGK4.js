import { Kn as ref, Ot as nextTick, U as computed, Yn as shallowRef, tt as defineAsyncComponent } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { i as getStorageKey } from "./src-BMpqrrtG.js";
import { d as log } from "./src-RZAlNKAF.js";
import ReTable from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTable/ReTable.vue";
import ReTableToolbar from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTable/ReTableToolbar.vue";
//#region ../../packages/ui/src/components/ReTable/columnStorage.ts
/** localStorage 默认实现：key 由 getStorageKey 加前缀，避免多 app 串数据 */
function tableKey(tableId) {
	return getStorageKey(`re-table:${tableId}`);
}
/** localStorage 默认实现：读取失败时返回 undefined */
var localColumnStorage = {
	get(key) {
		if (typeof localStorage === "undefined") return void 0;
		try {
			const raw = localStorage.getItem(tableKey(key));
			if (!raw) return void 0;
			const parsed = JSON.parse(raw);
			if (!parsed || !Array.isArray(parsed.order)) return void 0;
			return parsed;
		} catch {
			return;
		}
	},
	set(key, state) {
		if (typeof localStorage === "undefined") return;
		try {
			localStorage.setItem(tableKey(key), JSON.stringify(state));
		} catch {}
	},
	remove(key) {
		if (typeof localStorage === "undefined") return;
		try {
			localStorage.removeItem(tableKey(key));
		} catch {}
	}
};
/** sessionStorage 实现：会话级存储（同样走统一前缀） */
var sessionColumnStorage = {
	get(key) {
		if (typeof sessionStorage === "undefined") return void 0;
		try {
			const raw = sessionStorage.getItem(tableKey(key));
			if (!raw) return void 0;
			const parsed = JSON.parse(raw);
			if (!parsed || !Array.isArray(parsed.order)) return void 0;
			return parsed;
		} catch {
			return;
		}
	},
	set(key, state) {
		if (typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(tableKey(key), JSON.stringify(state));
		} catch {}
	},
	remove(key) {
		if (typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.removeItem(tableKey(key));
		} catch {}
	}
};
//#endregion
//#region ../../packages/ui/src/components/ReTable/composables/useTableExport.ts
/**
* useTableExport - 表格数据导出 composable
* 
* 支持导出 Excel、CSV、JSON 格式
*/
function useTableExport(options = {}) {
	const { enabled = false, types = [
		"excel",
		"csv",
		"json"
	], filename = "table-data", columns = [], columnTitles = {} } = options;
	const isEnabled = ref(enabled);
	const isExporting = ref(false);
	const exportTypes = ref(types);
	const formatData = (data, opts) => {
		const cols = opts.columns || columns;
		const titles = opts.columnTitles || columnTitles;
		if (cols.length === 0) return data.map((row) => {
			const newRow = {};
			Object.keys(row).forEach((key) => {
				const title = titles[key] || key;
				newRow[title] = row[key];
			});
			return newRow;
		});
		return data.map((row) => {
			const newRow = {};
			cols.forEach((col) => {
				const title = titles[col] || col;
				newRow[title] = row[col];
			});
			return newRow;
		});
	};
	const downloadFile = (content, filename, mimeType) => {
		const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};
	const exportToExcel = async (data, opts = {}) => {
		if (!isEnabled.value) return;
		isExporting.value = true;
		try {
			const formattedData = formatData(data, opts);
			const name = opts.filename || filename;
			if (formattedData.length === 0) {
				log.warn(`[useTableExport] No data to export`);
				return;
			}
			const headers = Object.keys(formattedData[0]);
			let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"></head>
        <body>
        <table border="1">
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
      `;
			formattedData.forEach((row) => {
				html += "<tr>";
				headers.forEach((h) => {
					const value = row[h] ?? "";
					html += `<td>${value}</td>`;
				});
				html += "</tr>";
			});
			html += "</tbody></table></body></html>";
			downloadFile(html, `${name}.xls`, "application/vnd.ms-excel;charset=utf-8");
		} finally {
			isExporting.value = false;
		}
	};
	const exportToCsv = async (data, opts = {}) => {
		if (!isEnabled.value) return;
		isExporting.value = true;
		try {
			const formattedData = formatData(data, opts);
			const name = opts.filename || filename;
			if (formattedData.length === 0) {
				log.warn(`[useTableExport] No data to export`);
				return;
			}
			const headers = Object.keys(formattedData[0]);
			const escapeValue = (val) => {
				const str = String(val ?? "");
				if (str.includes(",") || str.includes("\"") || str.includes("\n")) return `"${str.replace(/"/g, "\"\"")}"`;
				return str;
			};
			let csv = "﻿";
			csv += headers.map(escapeValue).join(",") + "\n";
			formattedData.forEach((row) => {
				csv += headers.map((h) => escapeValue(row[h])).join(",") + "\n";
			});
			downloadFile(csv, `${name}.csv`, "text/csv;charset=utf-8");
		} finally {
			isExporting.value = false;
		}
	};
	const exportToJson = async (data, opts = {}) => {
		if (!isEnabled.value) return;
		isExporting.value = true;
		try {
			const formattedData = formatData(data, opts);
			const name = opts.filename || filename;
			const json = JSON.stringify(formattedData, null, 2);
			downloadFile(json, `${name}.json`, "application/json;charset=utf-8");
		} finally {
			isExporting.value = false;
		}
	};
	const exportData = async (type, data, opts = {}) => {
		switch (type) {
			case "excel": return exportToExcel(data, opts);
			case "csv": return exportToCsv(data, opts);
			case "json": return exportToJson(data, opts);
			default: log.warn(`[useTableExport] Unknown export type: ${type}`);
		}
	};
	return {
		isEnabled,
		isExporting,
		exportTypes,
		exportToExcel,
		exportToCsv,
		exportToJson,
		exportData
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReTable/composables/useTableColumnSearch.ts
/**
* useTableColumnSearch - 列搜索 composable
* 
* 支持表头列搜索 + 本地过滤
*/
function useTableColumnSearch(options = {}) {
	const { enabled = false, searchableColumns = [], debounce = 300, caseSensitive = false } = options;
	const isEnabled = ref(enabled);
	const searchValues = ref(/* @__PURE__ */ new Map());
	const hasSearch = computed(() => {
		for (const value of searchValues.value.values()) if (value.trim()) return true;
		return false;
	});
	const searchCount = computed(() => {
		let count = 0;
		for (const value of searchValues.value.values()) if (value.trim()) count++;
		return count;
	});
	const isColumnSearchable = (columnKey) => {
		if (searchableColumns.length === 0) return true;
		return searchableColumns.includes(columnKey);
	};
	const setSearchValue = (columnKey, value) => {
		if (!isEnabled.value) return;
		if (!isColumnSearchable(columnKey)) return;
		searchValues.value.set(columnKey, value);
	};
	const clearSearchValue = (columnKey) => {
		searchValues.value.delete(columnKey);
	};
	const clearAllSearch = () => {
		searchValues.value.clear();
	};
	const getSearchValue = (columnKey) => {
		return searchValues.value.get(columnKey) || "";
	};
	const filterData = (data) => {
		if (!hasSearch.value) return data;
		return data.filter((row) => {
			for (const [columnKey, searchValue] of searchValues.value.entries()) {
				const trimmedValue = searchValue.trim();
				if (!trimmedValue) continue;
				const cellValue = row[columnKey];
				if (cellValue === null || cellValue === void 0) return false;
				const cellStr = String(cellValue);
				const searchStr = trimmedValue;
				if (caseSensitive) {
					if (!cellStr.includes(searchStr)) return false;
				} else if (!cellStr.toLowerCase().includes(searchStr.toLowerCase())) return false;
			}
			return true;
		});
	};
	const getSearchParams = () => {
		const params = {};
		for (const [columnKey, value] of searchValues.value.entries()) {
			const trimmedValue = value.trim();
			if (trimmedValue) params[columnKey] = trimmedValue;
		}
		return params;
	};
	return {
		isEnabled,
		searchValues,
		hasSearch,
		searchCount,
		setSearchValue,
		clearSearchValue,
		clearAllSearch,
		getSearchValue,
		isColumnSearchable,
		filterData,
		getSearchParams
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReTable/composables/useTableSelection.ts
/**
* useTableSelection - 跨页选择管理 composable
* 
* 支持跨页选择缓存、全选/清空、恢复选中状态
*/
function useTableSelection(options = {}) {
	const { tableRef, rowKey = "id" } = options;
	const selectionCache = ref({});
	const onSelectionChange = (currentPage, selectedRows) => {
		selectionCache.value[currentPage] = selectedRows;
	};
	const getAllSelection = () => {
		return Object.values(selectionCache.value).flat();
	};
	const getCurrentSelection = (currentPage) => {
		return selectionCache.value[currentPage] || [];
	};
	const getSelectionKeys = () => {
		return getAllSelection().map((row) => row[rowKey]);
	};
	const clearSelection = () => {
		tableRef?.value?.clearSelection();
		selectionCache.value = {};
	};
	const clearPageSelection = (page) => {
		delete selectionCache.value[page];
	};
	const toggleRowSelection = (row, selected) => {
		tableRef?.value?.toggleRowSelection(row, selected);
	};
	const toggleAllSelection = () => {
		tableRef?.value?.toggleAllSelection();
	};
	const restorePageSelection = (currentPage) => {
		nextTick(() => {
			const selectedRows = selectionCache.value[currentPage];
			if (selectedRows && selectedRows.length > 0) selectedRows.forEach((row) => {
				tableRef?.value?.toggleRowSelection(row, true);
			});
		});
	};
	const isRowSelected = (row) => {
		return getAllSelection().some((selected) => selected[rowKey] === row[rowKey]);
	};
	const selectionCount = computed(() => getAllSelection().length);
	return {
		selectionCache,
		selectionCount,
		hasSelection: computed(() => selectionCount.value > 0),
		selectedRows: computed(() => getAllSelection()),
		onSelectionChange,
		getAllSelection,
		getCurrentSelection,
		getSelectionKeys,
		clearSelection,
		clearPageSelection,
		toggleRowSelection,
		toggleAllSelection,
		restorePageSelection,
		isRowSelected
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReTable/composables/useTableBatchAction.ts
/**
* useTableBatchAction - 批量操作 composable
* 
* 封装批量删除、导出、审核等操作的状态与方法
*/
function useTableBatchAction(options = {}) {
	const { actions: initialActions = [], confirmMode = "confirm" } = options;
	const selected = shallowRef([]);
	const isProcessing = ref(false);
	const actions = shallowRef(initialActions);
	const selectedCount = computed(() => selected.value.length);
	const hasSelected = computed(() => selected.value.length > 0);
	const setSelected = (rows) => {
		selected.value = rows;
	};
	const addSelected = (rows) => {
		const existing = new Set(selected.value);
		for (const row of rows) if (!existing.has(row)) {
			selected.value.push(row);
			existing.add(row);
		}
	};
	const removeSelected = (rows) => {
		const toRemove = new Set(rows);
		selected.value = selected.value.filter((row) => !toRemove.has(row));
	};
	const clearSelected = () => {
		selected.value = [];
	};
	const isSelected = (row, key) => {
		if (key) {
			const rowId = row[key];
			return selected.value.some((s) => s[key] === rowId);
		}
		return selected.value.includes(row);
	};
	const execute = async (actionKey) => {
		const action = actions.value.find((a) => a.key === actionKey);
		if (!action) {
			log.warn(`[useTableBatchAction] Action "${actionKey}" not found`);
			return;
		}
		if (action.disabled && action.disabled(selected.value)) return;
		let target = selected.value;
		if (action.filter) target = action.filter(target);
		if (target.length === 0) {
			log.warn(`[useTableBatchAction] No items to process after filter`);
			return;
		}
		if (action.confirm || confirmMode === "confirm") {
			const message = action.confirmMessage || `确认执行 "${action.label}" 操作？`;
			if (!window.confirm(message)) return;
		}
		isProcessing.value = true;
		try {
			await action.handler(target);
			clearSelected();
		} finally {
			isProcessing.value = false;
		}
	};
	const registerAction = (action) => {
		const existing = actions.value.findIndex((a) => a.key === action.key);
		if (existing >= 0) actions.value[existing] = action;
		else actions.value.push(action);
	};
	const unregisterAction = (actionKey) => {
		actions.value = actions.value.filter((a) => a.key !== actionKey);
	};
	return {
		selected,
		selectedCount,
		hasSelected,
		isProcessing,
		actions,
		setSelected,
		addSelected,
		removeSelected,
		clearSelected,
		isSelected,
		execute,
		registerAction,
		unregisterAction
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReTable/index.ts
/**
* ReTable —— 表格组件（el-table 封装）
*
* 支持两种数据源与列 schema 渲染：
*   前端分页：<ReTable :columns="cols" :data="rows" />              （组件切片）
*   后端分页：<ReTable :columns="cols" :loader="fetchUsers" />     （组件只发分页与查询参数）
*/
/** 卡片布局使用面窄，异步加载避免打进主包 */
var ReTableCardView = defineAsyncComponent(() => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTable/ReTableCardView.vue"));
var plugin = { install(app) {
	app.component("ReTable", ReTable);
	app.component("ReTableCardView", ReTableCardView);
	app.component("ReTableToolbar", ReTableToolbar);
} };
var ReTable_default = ReTable;
//#endregion
export { ReTable_default as default, plugin as install, localColumnStorage, sessionColumnStorage, useTableBatchAction, useTableColumnSearch, useTableExport, useTableSelection };
