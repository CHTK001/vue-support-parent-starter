import { D as createVNode, E as createTextVNode, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { i as createDbTable } from "./manageConsoles-BaCEHWGA.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReInputNumber_default } from "./ReInputNumber-BOzz1hL8.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
//#region ../../pages/datasource/src/utils/columnTypes.ts
/**
* 列类型知识：类型分组 + 长度 / 小数位 / UNSIGNED 的适用范围。
*
* <p>三处要用**同一份**：设计视图的列网格、新增/修改列对话框、新建表（设计表）对话框。
* 此前它们各存一份，改类型表只改到其中一处，就会出现「下拉里有、提交被后端拒」
* 或「列表里没有、但库里有该类型」这类对不上的现象。</p>
*
* <p>权威口径在后端 {@code DbColumnDef.SUPPORTED_TYPES / SIZE_REQUIRED / SCALE_ALLOWED /
* UNSIGNED_ALLOWED}，这里是它的前端镜像：**两边要同步改**。镜像的作用是让界面提前
* 置灰/隐藏，而不是让后端少校验一层 —— 后端构造 {@code DbColumnDef} 时仍然全量校验。</p>
*
* @author CH
* @since 4.0.0.46
*/
/** 列类型分组（按类别分组只为下拉可读，不是分批请求）。 */
var COLUMN_TYPE_GROUPS = [
	{
		label: "整数",
		types: [
			"TINYINT",
			"SMALLINT",
			"MEDIUMINT",
			"INT",
			"INTEGER",
			"BIGINT"
		]
	},
	{
		label: "布尔 / 位",
		types: [
			"BIT",
			"BOOL",
			"BOOLEAN"
		]
	},
	{
		label: "定点 / 浮点",
		types: [
			"DECIMAL",
			"NUMERIC",
			"FLOAT",
			"DOUBLE",
			"REAL",
			"DOUBLE PRECISION"
		]
	},
	{
		label: "字符",
		types: [
			"CHAR",
			"VARCHAR",
			"TINYTEXT",
			"TEXT",
			"MEDIUMTEXT",
			"LONGTEXT"
		]
	},
	{
		label: "二进制",
		types: [
			"BINARY",
			"VARBINARY",
			"TINYBLOB",
			"BLOB",
			"MEDIUMBLOB",
			"LONGBLOB"
		]
	},
	{
		label: "日期时间",
		types: [
			"DATE",
			"TIME",
			"DATETIME",
			"TIMESTAMP",
			"YEAR"
		]
	},
	{
		label: "枚举 / 集合",
		types: ["ENUM", "SET"]
	},
	{
		label: "JSON",
		types: ["JSON"]
	}
];
/** 需要长度输入的类型（镜像后端 SIZE_REQUIRED：CHAR/VARCHAR/BINARY/VARBINARY/DECIMAL/NUMERIC）。 */
var SIZE_REQUIRED = /* @__PURE__ */ new Set([
	"CHAR",
	"VARCHAR",
	"BINARY",
	"VARBINARY",
	"DECIMAL",
	"NUMERIC"
]);
/** 允许小数位的类型（镜像后端 SCALE_ALLOWED）。 */
var SCALE_ALLOWED = /* @__PURE__ */ new Set([
	"DECIMAL",
	"NUMERIC",
	"FLOAT",
	"DOUBLE",
	"REAL"
]);
/** 允许 UNSIGNED 的类型（镜像后端 UNSIGNED_ALLOWED，用于置灰而不是让用户试错）。 */
var UNSIGNED_ALLOWED = /* @__PURE__ */ new Set([
	"TINYINT",
	"SMALLINT",
	"MEDIUMINT",
	"INT",
	"INTEGER",
	"BIGINT",
	"DECIMAL",
	"NUMERIC",
	"FLOAT",
	"DOUBLE",
	"REAL",
	"DOUBLE PRECISION",
	"BIT",
	"YEAR"
]);
/** ENUM / SET：除了类型本身还要给取值列表，否则后端构造期就拒绝。 */
var ENUM_LIKE_TYPES = /* @__PURE__ */ new Set(["ENUM", "SET"]);
/**
* 该类型是否需要长度输入。
*
* @param type 类型名
* @return true=需要
*/
var typeNeedsSize = (type) => SIZE_REQUIRED.has(type);
/**
* 该类型是否允许小数位。
*
* @param type 类型名
* @return true=允许
*/
var typeAllowsScale = (type) => SCALE_ALLOWED.has(type);
/**
* 类型下拉的分组项。
*
* <p>ReSelect 用 `group` 字段做分组标题（不是 el-option-group）。
* 做成函数而不是常量：调用方可能往 {@link COLUMN_TYPE_GROUPS} 里补「其他」分组
* （遇到后端类型表以外的类型时），常量快照看不到补进去的项。</p>
*
* @returns 分组下拉项
*/
var columnTypeSelectOptions = () => COLUMN_TYPE_GROUPS.flatMap((g) => g.types.map((t) => ({
	label: t,
	value: t,
	group: g.label
})));
//#endregion
//#region ../../pages/datasource/src/components/console/CreateTableDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "ct" };
var _hoisted_2 = { class: "ct-head" };
var _hoisted_3 = { class: "ct-form__item" };
var _hoisted_4 = { class: "ct-form__item" };
var _hoisted_5 = { class: "ct-form__item ct-form__item--wide" };
var _hoisted_6 = { class: "ct-grid-bar" };
var _hoisted_7 = { class: "ct-grid" };
var _hoisted_8 = {
	key: 0,
	class: "ct-grid__sub"
};
var _hoisted_9 = { class: "ct-grid__sub-label" };
var _hoisted_10 = {
	key: 1,
	class: "ct-na",
	"aria-hidden": "true"
};
var _hoisted_11 = {
	key: 1,
	class: "ct-na",
	"aria-hidden": "true"
};
var _hoisted_12 = {
	key: 0,
	class: "ct-form__error"
};
//#endregion
//#region ../../pages/datasource/src/components/console/CreateTableDialog.vue
var CreateTableDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "CreateTableDialog",
	props: {
		modelValue: { type: Boolean },
		database: { default: "" },
		datasourceId: { default: void 0 },
		initialName: { default: "" },
		initialColumns: { default: () => [] }
	},
	emits: ["update:modelValue", "created"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** 行 key 自增（数组里可能有多行同名/空名，key 必须唯一且稳定） */
		let rowSeq = 0;
		/** 新建一行：默认 VARCHAR(255) 可空，是多数场景的起点 */
		const newRow = (partial = {}) => ({
			key: ++rowSeq,
			name: "",
			type: "VARCHAR",
			size: 255,
			scale: null,
			nullable: true,
			primaryKey: false,
			autoIncrement: false,
			defaultValue: "",
			comment: "",
			enumText: "",
			...partial
		});
		const name = ref("");
		const remark = ref("");
		const rows = ref([newRow()]);
		const busy = ref(false);
		const error = ref("");
		/** 类型下拉项（分组） */
		const typeOptions = computed(() => columnTypeSelectOptions());
		/**
		* 列设计网格 → ReTable 列配置（原来 11 轨手写 grid 的表头收敛到此）。
		*
		* <p>除「类型」外每列都配 slot —— 单元格里是输入控件而不是数据值；
		* 「操作」列没有对应字段，造稳定合成 prop {@code actions}；
		* 序号列改走 ReTable 的 show-index，不再单开一轨。</p>
		*
		* <p>宽度按原轨道（150 / 76 / 64 / 92 / 78 / 78 / …）等价给出，两处**有意加宽**：
		* 类型 150→190，因为 ENUM/SET 的取值输入从「跨整行副行」收进了该单元格；
		* 操作 40→56，因为 el-table 单元格自带内边距，40px 装不下 32px 的方块按钮。</p>
		*/
		const ctColumns = [
			{
				prop: "name",
				label: "字段名",
				minWidth: 110,
				slot: "name"
			},
			{
				prop: "type",
				label: "类型",
				width: 190,
				slot: "type"
			},
			{
				prop: "size",
				label: "长度",
				width: 84,
				slot: "size"
			},
			{
				prop: "scale",
				label: "小数位",
				width: 76,
				slot: "scale"
			},
			{
				prop: "nullable",
				label: "可空",
				width: 72,
				align: "center",
				slot: "nullable"
			},
			{
				prop: "primaryKey",
				label: "主键",
				width: 72,
				align: "center",
				slot: "primaryKey"
			},
			{
				prop: "autoIncrement",
				label: "自增",
				width: 72,
				align: "center",
				slot: "autoIncrement"
			},
			{
				prop: "defaultValue",
				label: "默认值",
				minWidth: 96,
				slot: "defaultValue"
			},
			{
				prop: "comment",
				label: "注释",
				minWidth: 110,
				slot: "comment"
			},
			{
				prop: "actions",
				label: "操作",
				width: 56,
				align: "center",
				slot: "actions"
			}
		];
		/**
		* 表格数据桥接：{@link DesignColumn} 没有索引签名，直接喂 {@code data} 会报 TS2322
		* （仓内既有写法统一走 {@code as unknown as} 收成 Record 形状）。
		*
		* <p>{@code as} 是零成本断言，返回的仍是 {@code rows.value} 本身 —— 同一个数组、
		* 同一批行对象，所以单元格里 v-model 的改动与删行都直接落在原数组上，不需要回写。</p>
		*/
		const gridData = computed(() => rows.value);
		/** 有表名且至少填了一列才能提交 */
		const canSubmit = computed(() => Boolean(name.value.trim()) && rows.value.some((r) => r.name.trim()));
		/** 每次打开都清空上一次的内容与报错 */
		watch(() => props.modelValue, (open) => {
			if (!open) return;
			name.value = props.initialName || "";
			remark.value = "";
			rows.value = props.initialColumns.length ? props.initialColumns.map((c) => newRow({
				name: c.name,
				type: c.type || "VARCHAR",
				size: c.size ?? null,
				scale: c.scale ?? null,
				nullable: c.nullable ?? true,
				primaryKey: c.primaryKey ?? false,
				autoIncrement: c.autoIncrement ?? false,
				defaultValue: c.defaultValue || "",
				comment: c.comment || "",
				enumText: c.enumText || ""
			})) : [newRow()];
			error.value = "";
		});
		/** 加一列 */
		function addRow() {
			rows.value.push(newRow());
		}
		/** 删一列（删空了也允许，提交前会拦）
		*  ReTable 列插槽只回传 row、没有 el-table 列插槽的 $index，
		*  故按下标查找后 splice —— 与原来直接 splice(index, 1) 等价。 */
		function removeRow(cellRow) {
			const row = cellRow;
			const i = rows.value.indexOf(row);
			if (i >= 0) rows.value.splice(i, 1);
		}
		/**
		* 勾「主键」：主键列必非空（内核会把 PRIMARY KEY 当成 NOT NULL），
		* 与其让内核默默改写，不如在界面上直接把「可空」压成「否」并锁住。
		*/
		function togglePk(row, value) {
			row.primaryKey = value === true;
			if (row.primaryKey) row.nullable = false;
		}
		/** 勾「自增」：同上 —— 自增列不可空是后端构造期就拒绝的硬规则 */
		function toggleAuto(row, value) {
			row.autoIncrement = value === true;
			if (row.autoIncrement) row.nullable = false;
		}
		/** ENUM / SET 取值文本 → 列表（去空白、去空项） */
		function parseEnum(text) {
			return text.split(",").map((item) => item.trim()).filter(Boolean);
		}
		/**
		* 提交前校验。
		*
		* <p>都是**能在界面上说清楚**的问题（缺长度、列名重、枚举没给取值），
		* 不代替后端校验：后端 `DbColumnDef` 构造期还会再过一遍白名单。</p>
		*
		* @param filled 已填字段名的行
		* @returns 空串表示通过，否则是可读错误
		*/
		function validate(filled) {
			if (!name.value.trim()) return "请填写表名";
			if (filled.length === 0) return "至少填写一列";
			const seen = /* @__PURE__ */ new Set();
			for (let i = 0; i < filled.length; i++) {
				const row = filled[i];
				const column = row.name.trim();
				const no = i + 1;
				if (!/^[A-Za-z0-9_]+$/.test(column) || column.length > 64) return `第 ${no} 列名不合法（字母、数字、下划线，最长 64 字符）：${column || "（空）"}`;
				const key = column.toLowerCase();
				if (seen.has(key)) return `列名重复：${column}`;
				seen.add(key);
				if (typeNeedsSize(row.type) && !(row.size && row.size > 0)) return `第 ${no} 列（${row.type}）必须填写长度`;
				if (ENUM_LIKE_TYPES.has(row.type) && parseEnum(row.enumText).length === 0) return `第 ${no} 列（${row.type}）必须填写取值（用逗号分隔）`;
			}
			return "";
		}
		async function submit() {
			const filled = rows.value.filter((r) => r.name.trim());
			const invalid = validate(filled);
			if (invalid) {
				error.value = invalid;
				return;
			}
			const table = name.value.trim();
			busy.value = true;
			error.value = "";
			try {
				const columns = filled.map((row) => ({
					columnName: row.name.trim(),
					type: row.type,
					size: typeNeedsSize(row.type) ? row.size ?? void 0 : void 0,
					scale: typeAllowsScale(row.type) ? row.scale ?? void 0 : void 0,
					nullable: row.nullable,
					autoIncrement: row.autoIncrement,
					defaultValue: row.defaultValue.trim() || void 0,
					comment: row.comment.trim() || void 0,
					enumValues: ENUM_LIKE_TYPES.has(row.type) ? parseEnum(row.enumText) : void 0
				}));
				await createDbTable({
					table,
					columns,
					primaryKey: filled.filter((row) => row.primaryKey).map((row) => row.name.trim()),
					comment: remark.value.trim() || void 0,
					datasourceId: props.datasourceId,
					database: props.database || void 0
				});
				message.success(`表 ${table} 创建成功`);
				emit("created", props.database, table);
				emit("update:modelValue", false);
			} catch (e) {
				error.value = String(e?.message ?? e);
			} finally {
				busy.value = false;
			}
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(component), {
				"model-value": __props.modelValue,
				title: "新建表（设计表）",
				width: "min(1000px, 96vw)",
				"onUpdate:modelValue": _cache[3] || (_cache[3] = (v) => emit("update:modelValue", Boolean(v)))
			}, {
				footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[2] || (_cache[2] = ($event) => emit("update:modelValue", false)) }, {
					default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(unref(ReButton_default), {
					type: "primary",
					loading: busy.value,
					disabled: !canSubmit.value,
					onClick: submit
				}, {
					default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("创建", -1)])]),
					_: 1
				}, 8, ["loading", "disabled"])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_1, [
					createBaseVNode("div", _hoisted_2, [
						createBaseVNode("div", _hoisted_3, [_cache[4] || (_cache[4] = createBaseVNode("label", null, "目标库", -1)), createVNode(unref(ReInput_default), {
							"model-value": __props.database,
							disabled: ""
						}, null, 8, ["model-value"])]),
						createBaseVNode("div", _hoisted_4, [_cache[5] || (_cache[5] = createBaseVNode("label", null, "表名", -1)), createVNode(unref(ReInput_default), {
							modelValue: name.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => name.value = $event),
							placeholder: "请输入表名"
						}, null, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_5, [_cache[6] || (_cache[6] = createBaseVNode("label", null, "表注释", -1)), createVNode(unref(ReInput_default), {
							modelValue: remark.value,
							"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => remark.value = $event),
							placeholder: "请输入表注释"
						}, null, 8, ["modelValue"])])
					]),
					createBaseVNode("div", _hoisted_6, [
						_cache[7] || (_cache[7] = createBaseVNode("span", { class: "ct-grid-bar__title" }, "列设计", -1)),
						_cache[8] || (_cache[8] = createBaseVNode("span", { class: "ct-grid-bar__hint" }, "勾主键 / 自增会自动把该列置为「不可空」", -1)),
						_cache[9] || (_cache[9] = createBaseVNode("span", { class: "ct-spacer" }, null, -1)),
						createVNode(unref(ReButton_default), {
							layout: "square",
							type: "primary",
							icon: "Plus",
							tip: "添加一列",
							onClick: addRow
						})
					]),
					createBaseVNode("div", _hoisted_7, [createVNode(unref(ReTable_default), {
						data: gridData.value,
						columns: ctColumns,
						engine: "element",
						pagination: false,
						toolbar: false,
						"layout-table": { maxHeight: "46vh" },
						settings: { border: false },
						"row-key": "key",
						"show-index": "",
						"index-width": "40",
						"index-align": "right"
					}, {
						"col-name": withCtx(({ row }) => [createVNode(unref(ReInput_default), {
							modelValue: row.name,
							"onUpdate:modelValue": ($event) => row.name = $event,
							class: "ct-mono",
							placeholder: "字段名"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						"col-type": withCtx(({ row }) => [createVNode(unref(ReSelect_default), {
							modelValue: row.type,
							"onUpdate:modelValue": ($event) => row.type = $event,
							options: typeOptions.value,
							filterable: ""
						}, null, 8, [
							"modelValue",
							"onUpdate:modelValue",
							"options"
						]), unref(ENUM_LIKE_TYPES).has(row.type) ? (openBlock(), createElementBlock("div", _hoisted_8, [createBaseVNode("span", _hoisted_9, toDisplayString(row.type) + " 取值", 1), createVNode(unref(ReInput_default), {
							modelValue: row.enumText,
							"onUpdate:modelValue": ($event) => row.enumText = $event,
							placeholder: "a, b, c（逗号分隔，必填）"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])])) : createCommentVNode("", true)]),
						"col-size": withCtx(({ row }) => [unref(typeNeedsSize)(row.type) ? (openBlock(), createBlock(unref(ReInputNumber_default), {
							key: 0,
							"model-value": row.size ?? void 0,
							size: "small",
							min: 1,
							max: 65535,
							"controls-position": "right",
							placeholder: "长度",
							"onUpdate:modelValue": ($event) => row.size = $event ?? null
						}, null, 8, ["model-value", "onUpdate:modelValue"])) : (openBlock(), createElementBlock("span", _hoisted_10, "—"))]),
						"col-scale": withCtx(({ row }) => [unref(typeAllowsScale)(row.type) ? (openBlock(), createBlock(unref(ReInputNumber_default), {
							key: 0,
							"model-value": row.scale ?? void 0,
							size: "small",
							min: 0,
							max: 30,
							"controls-position": "right",
							placeholder: "位",
							"onUpdate:modelValue": ($event) => row.scale = $event ?? null
						}, null, 8, ["model-value", "onUpdate:modelValue"])) : (openBlock(), createElementBlock("span", _hoisted_11, "—"))]),
						"col-nullable": withCtx(({ row }) => [createVNode(unref(ReSwitch_default), {
							modelValue: row.nullable,
							"onUpdate:modelValue": ($event) => row.nullable = $event,
							layout: "square",
							size: "small",
							class: "ct-bool",
							"aria-label": "允许为空",
							title: "允许为空",
							disabled: row.primaryKey || row.autoIncrement
						}, null, 8, [
							"modelValue",
							"onUpdate:modelValue",
							"disabled"
						])]),
						"col-primaryKey": withCtx(({ row }) => [createVNode(unref(ReSwitch_default), {
							"model-value": row.primaryKey,
							layout: "square",
							size: "small",
							class: "ct-bool",
							"aria-label": "主键",
							title: "主键",
							"onUpdate:modelValue": ($event) => togglePk(row, $event)
						}, null, 8, ["model-value", "onUpdate:modelValue"])]),
						"col-autoIncrement": withCtx(({ row }) => [createVNode(unref(ReSwitch_default), {
							"model-value": row.autoIncrement,
							layout: "square",
							size: "small",
							class: "ct-bool",
							"aria-label": "自增",
							title: "自增",
							"onUpdate:modelValue": ($event) => toggleAuto(row, $event)
						}, null, 8, ["model-value", "onUpdate:modelValue"])]),
						"col-defaultValue": withCtx(({ row }) => [createVNode(unref(ReInput_default), {
							modelValue: row.defaultValue,
							"onUpdate:modelValue": ($event) => row.defaultValue = $event,
							class: "ct-mono",
							placeholder: "默认值"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						"col-comment": withCtx(({ row }) => [createVNode(unref(ReInput_default), {
							modelValue: row.comment,
							"onUpdate:modelValue": ($event) => row.comment = $event,
							placeholder: "列注释"
						}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
						"col-actions": withCtx(({ row }) => [createVNode(unref(ReButton_default), {
							icon: "Delete",
							layout: "square",
							type: "danger",
							tip: "删除该列",
							onClick: ($event) => removeRow(row)
						}, null, 8, ["onClick"])]),
						empty: withCtx(() => [..._cache[10] || (_cache[10] = [createBaseVNode("p", { class: "ct-grid__empty" }, "还没有列，点右上角「添加一列」开始设计", -1)])]),
						_: 1
					}, 8, ["data"])]),
					_cache[11] || (_cache[11] = createBaseVNode("p", { class: "ct-form__tip" }, " 引号、列注释与自增写法由后端按目标库内核选择（MySQL 用反引号与 AUTO_INCREMENT， H2 / PostgreSQL 用双引号与 GENERATED BY DEFAULT AS IDENTITY），这里只描述结构。 ", -1)),
					error.value ? (openBlock(), createElementBlock("p", _hoisted_12, toDisplayString(error.value), 1)) : createCommentVNode("", true)
				])]),
				_: 1
			}, 8, ["model-value"]);
		};
	}
}), [["__scopeId", "data-v-241f4501"]]);
//#endregion
export { UNSIGNED_ALLOWED as a, SIZE_REQUIRED as i, COLUMN_TYPE_GROUPS as n, SCALE_ALLOWED as r, CreateTableDialog_default as t };
