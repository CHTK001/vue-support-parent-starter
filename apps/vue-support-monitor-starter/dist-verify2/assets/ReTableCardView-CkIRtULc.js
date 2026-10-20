import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { t as ElEmpty } from "./empty-C7c8XFvh.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                    */
//#region ../../packages/ui/src/components/ReTable/ReTableCardView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-table__card-select-all"
};
var _hoisted_2 = {
	key: 1,
	class: "re-table__card-empty"
};
var _hoisted_3 = ["onClick", "onContextmenu"];
var _hoisted_4 = { class: "re-table__card-body" };
var _hoisted_5 = {
	key: 0,
	class: "re-table__card-title"
};
var _hoisted_6 = {
	key: 1,
	class: "re-table__card-desc"
};
var _hoisted_7 = {
	key: 2,
	class: "re-table__card-tags"
};
var _hoisted_8 = {
	key: 3,
	class: "re-table__card-fields"
};
var _hoisted_9 = {
	key: 0,
	class: "re-table__card-field-label"
};
var _hoisted_10 = { class: "re-table__card-field-value" };
//#endregion
//#region ../../packages/ui/src/components/ReTable/ReTableCardView.vue
var ReTableCardView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReTableCardView",
	__name: "ReTableCardView",
	props: {
		rows: {
			type: Array,
			default: () => []
		},
		columns: {
			type: Array,
			default: () => []
		},
		/** 卡片专属属性 */
		layout: {
			type: Object,
			default: () => ({})
		},
		rowKey: {
			type: String,
			default: "id"
		},
		/** 是否显示 checkbox */
		selectable: {
			type: Boolean,
			default: false
		},
		/** 右键菜单项 */
		contextMenu: {
			type: Array,
			default: () => []
		},
		/** 空数据提示文字 */
		emptyText: {
			type: String,
			default: "暂无数据"
		}
	},
	emits: [
		"row-click",
		"selection-change",
		"context-menu"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReTable 卡片模式视图
		*
		* 默认按 columns 中的 prop 渲染字段；可通过 fields 自定义；
		* 标记 title 的字段在卡片头部放大展示；
		* 标记 cover 的字段作为封面图渲染。
		* 支持：checkbox 选择、右键菜单
		*/
		const props = __props;
		const emit = __emit;
		/** 选中行 key 集合 */
		const selectedKeys = ref(/* @__PURE__ */ new Set());
		/** 全选状态 */
		const isAllSelected = computed(() => {
			if (props.rows.length === 0) return false;
			return props.rows.every((row) => selectedKeys.value.has(String(row[props.rowKey] ?? "")));
		});
		/** 半选状态 */
		const isIndeterminate = computed(() => {
			if (props.rows.length === 0) return false;
			const count = props.rows.filter((row) => selectedKeys.value.has(String(row[props.rowKey] ?? ""))).length;
			return count > 0 && count < props.rows.length;
		});
		/** 切换全选 */
		function onToggleAll(val) {
			if (val) for (const row of props.rows) selectedKeys.value.add(String(row[props.rowKey] ?? ""));
			else selectedKeys.value.clear();
			emitSelectionChange();
		}
		/** 切换单行选中 */
		function onToggleRow(row) {
			const key = String(row[props.rowKey] ?? "");
			if (selectedKeys.value.has(key)) selectedKeys.value.delete(key);
			else selectedKeys.value.add(key);
			emitSelectionChange();
		}
		/** 判断行是否选中 */
		function isRowSelected(row) {
			return selectedKeys.value.has(String(row[props.rowKey] ?? ""));
		}
		/** 发射选中变化 */
		function emitSelectionChange() {
			const selectedRows = props.rows.filter((row) => selectedKeys.value.has(String(row[props.rowKey] ?? "")));
			emit("selection-change", selectedRows);
		}
		/** 字段列表 */
		const fields = computed(() => {
			const order = props.layout.fieldOrder;
			const customFields = props.layout.fields;
			if (customFields && customFields.length > 0) {
				if (order) {
					const map = new Map(customFields.map((f) => [f.prop, f]));
					return order.map((p) => map.get(p)).filter((f) => Boolean(f)).concat(customFields.filter((f) => !order.includes(f.prop)));
				}
				return customFields;
			}
			const list = (props.columns ?? []).filter((c) => !c.hidden).map((c) => ({
				prop: c.prop,
				label: c.label
			}));
			if (order) return order.map((p) => list.find((f) => f.prop === p)).filter((f) => Boolean(f)).concat(list.filter((f) => !order.includes(f.prop)));
			return list;
		});
		/** 字段在该行为空（渲染会变成 "-"） */
		function isBlankField(field) {
			if (!props.rows.length) return false;
			return props.rows.every((row) => {
				const v = row[field.prop];
				return v == null || v === "";
			});
		}
		/** 标题字段：显式 title 优先；未配置时取第一个有值的非封面字段 */
		const titleField = computed(() => {
			const explicit = fields.value.find((f) => f.title);
			if (explicit) return explicit;
			return fields.value.find((f) => !f.cover && !isBlankField(f));
		});
		/** 副标题字段：显式 desc */
		const descField = computed(() => fields.value.find((f) => f.desc));
		/** 标签字段：显式 tag / type=tag */
		const tagFields = computed(() => fields.value.filter((f) => f.tag || f.type === "tag"));
		/** 封面字段 */
		const coverField = computed(() => fields.value.find((f) => f.cover));
		/** 非标题/副标题/封面/标签字段（按 fields 顺序） */
		const bodyFields = computed(() => fields.value.filter((f) => f !== titleField.value && f !== descField.value && f !== coverField.value && !tagFields.value.includes(f)));
		/** 卡片容器样式 */
		const containerStyle = computed(() => ({
			display: "grid",
			gridTemplateColumns: `repeat(${props.layout.columns ?? 3}, minmax(${props.layout.minWidth ?? 240}px, 1fr))`,
			gap: `${props.layout.gap ?? 12}px`,
			alignItems: "start"
		}));
		/**
		* 单卡样式。
		*
		* 圆角缺省走基线令牌 --re-surface-radius（与 ReStatCard / ReCard 同一规格），
		* 调用方传 layout.radius 时仍以传入值为准（保持既有 API 语义）。
		*
		* 底色用**自定义属性**下发而不是直接写 background：
		* 内联 style 优先级高于类选择器，直接写 background 会让
		* `.re-table__card--selected` 的选中底色永远被压制（历史 bug）。
		*/
		function cardStyle() {
			const bg = props.layout.background ?? "var(--el-bg-color-overlay)";
			const hover = props.layout.hoverable !== false;
			return {
				"--re-table-card-bg": bg,
				borderRadius: props.layout.radius != null ? `${props.layout.radius}px` : "var(--re-surface-radius, 12px)",
				...hover ? { cursor: "pointer" } : {}
			};
		}
		/** 渲染字段值 */
		function renderValue(row, field) {
			const value = row[field.prop];
			if (field.render) return field.render(row, value);
			if (value == null) return "-";
			return String(value);
		}
		/** 空数据状态 */
		const isEmpty = computed(() => !props.rows || props.rows.length === 0);
		function onCardClick(row) {
			emit("row-click", row);
		}
		/** 卡片右键 */
		function onCardContextmenu(row, index, event) {
			if (!props.contextMenu || props.contextMenu.length === 0) return;
			event.preventDefault();
			emit("context-menu", {
				row,
				rowIndex: index,
				event
			});
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-table__card-layout", { "re-table__card-layout--empty": isEmpty.value }]) }, [__props.selectable && !isEmpty.value ? (openBlock(), createElementBlock("div", _hoisted_1, [createVNode(unref(ElCheckbox), {
				"model-value": isAllSelected.value,
				indeterminate: isIndeterminate.value,
				onChange: _cache[0] || (_cache[0] = (v) => onToggleAll(v))
			}, {
				default: withCtx(() => [createTextVNode(" 全选 (" + toDisplayString(__props.rows.filter((r) => isRowSelected(r)).length) + "/" + toDisplayString(__props.rows.length) + ") ", 1)]),
				_: 1
			}, 8, ["model-value", "indeterminate"])])) : createCommentVNode("", true), isEmpty.value ? (openBlock(), createElementBlock("div", _hoisted_2, [createVNode(unref(ElEmpty), {
				description: __props.emptyText,
				"image-size": 80
			}, null, 8, ["description"])])) : (openBlock(), createElementBlock("div", {
				key: 2,
				class: "re-table__card-grid",
				style: normalizeStyle(containerStyle.value)
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.rows, (row, idx) => {
				return openBlock(), createElementBlock("div", {
					key: idx,
					class: normalizeClass(["re-table__card", { "re-table__card--selected": isRowSelected(row) }]),
					style: normalizeStyle(cardStyle()),
					onClick: ($event) => onCardClick(row),
					onContextmenu: (e) => onCardContextmenu(row, idx, e)
				}, [
					__props.selectable ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: "re-table__card-check",
						onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
					}, [createVNode(unref(ElCheckbox), {
						"model-value": isRowSelected(row),
						onChange: ($event) => onToggleRow(row)
					}, null, 8, ["model-value", "onChange"])])) : createCommentVNode("", true),
					coverField.value && row[coverField.value.prop] ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: "re-table__card-cover",
						style: normalizeStyle({
							height: `${__props.layout.coverHeight ?? 160}px`,
							backgroundImage: `url(${String(row[coverField.value.prop])})`
						})
					}, null, 4)) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_4, [
						titleField.value ? (openBlock(), createElementBlock("div", _hoisted_5, toDisplayString(renderValue(row, titleField.value)), 1)) : createCommentVNode("", true),
						descField.value ? (openBlock(), createElementBlock("div", _hoisted_6, toDisplayString(renderValue(row, descField.value)), 1)) : createCommentVNode("", true),
						tagFields.value.length ? (openBlock(), createElementBlock("div", _hoisted_7, [(openBlock(true), createElementBlock(Fragment, null, renderList(tagFields.value, (f) => {
							return openBlock(), createElementBlock("span", {
								key: f.prop,
								class: "re-table__card-tag"
							}, toDisplayString(renderValue(row, f)), 1);
						}), 128))])) : createCommentVNode("", true),
						bodyFields.value.length ? (openBlock(), createElementBlock("div", _hoisted_8, [(openBlock(true), createElementBlock(Fragment, null, renderList(bodyFields.value, (field) => {
							return openBlock(), createElementBlock("div", {
								key: field.prop,
								class: "re-table__card-field"
							}, [field.label ? (openBlock(), createElementBlock("span", _hoisted_9, toDisplayString(field.label), 1)) : createCommentVNode("", true), createBaseVNode("span", _hoisted_10, toDisplayString(renderValue(row, field)), 1)]);
						}), 128))])) : createCommentVNode("", true),
						renderSlot(_ctx.$slots, `card-${idx}`, { row }, void 0, true),
						renderSlot(_ctx.$slots, "card", { row }, void 0, true)
					])
				], 46, _hoisted_3);
			}), 128))], 4))], 2);
		};
	}
}), [["__scopeId", "data-v-c8fb4177"]]);
//#endregion
export { ReTableCardView_default as t };
