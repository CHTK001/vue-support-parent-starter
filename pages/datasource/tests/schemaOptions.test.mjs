/**
 * 表 / 字段下拉选项映射的单元测试（node:test，无第三方依赖）。
 *
 * <p>运行：`node --test tests/`（或 `pnpm test`）。</p>
 *
 * <p>覆盖的是三联选的中文显示口径：有注释显示中文、没有显示真实名，
 * 且真实名（value / table / field）永远不被中文覆盖 ——
 * 一旦被覆盖，落库时就会拿「用户姓名」这种词去当列名。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import test from "node:test";
import assert from "node:assert/strict";

import { toTableOptions, toColumnOptions, toTableRows, toColumnRows } from "../src/api/schemaOptions.ts";

/** 造一条表元数据，只写测试关心的字段 */
const table = (over = {}) => ({ name: "t", comment: null, type: null, ...over });

/** 造一条列元数据，只写测试关心的字段 */
const column = (over = {}) => ({ name: "c", label: null, typeName: null, ...over });

test("表：有注释时 label 显示中文，subtitle 给真实表名与类型", () => {
  const [opt] = toTableOptions([table({ name: "ms_user", comment: "用户表", type: "TABLE" })]);
  assert.equal(opt.label, "用户表", "有注释必须显示中文");
  assert.equal(opt.description, "ms_user · TABLE", "subtitle 要带真实表名与类型");
  assert.equal(opt.value, "ms_user", "value 必须仍是真实表名");
  assert.equal(opt.table, "ms_user");
});

test("表：无注释时 label 回退表名，不得留空", () => {
  const rows = [
    table({ name: "plain", comment: null }),
    table({ name: "blank", comment: "" }),
    table({ name: "spaces", comment: "   " }),
    // 后端漏发 comment 时是 undefined，不是空串 —— 两种都得回退
    table({ name: "undef", comment: undefined }),
  ];
  for (const opt of toTableOptions(rows)) {
    assert.equal(opt.label, opt.value, `${opt.value} 无注释时 label 应回退表名`);
  }
});

test("表：注释两侧空白要剪掉，中文名里带空格会显得像多了一项", () => {
  const [opt] = toTableOptions([table({ name: "t", comment: "  订单表  " })]);
  assert.equal(opt.label, "订单表");
});

test("表：view 类型也照样给出，不因类型不同丢副标题", () => {
  const [opt] = toTableOptions([table({ name: "v", comment: "视图", type: "VIEW" })]);
  assert.equal(opt.label, "视图");
  assert.equal(opt.description, "v · VIEW");
});

test("表：无类型时 subtitle 只给表名，不留多余分隔符", () => {
  const [opt] = toTableOptions([table({ name: "t", type: null })]);
  assert.equal(opt.description, "t", "没有类型就不该拼出 't · ' 这种尾巴");
});

test("字段：有注释时 label 显示中文，subtitle 给真实字段名与类型", () => {
  const [opt] = toColumnOptions([column({ name: "user_name", label: "用户名", typeName: "VARCHAR" })]);
  assert.equal(opt.label, "用户名");
  assert.equal(opt.description, "user_name · VARCHAR");
  assert.equal(opt.value, "user_name", "value 必须仍是真实字段名");
  assert.equal(opt.field, "user_name");
});

test("字段：无注释时 label 回退字段名", () => {
  for (const opt of toColumnOptions([column({ name: "c", label: null }), column({ name: "d", label: "  " })])) {
    assert.equal(opt.label, opt.value);
  }
});

test("字段：主键标记原样带出，供选项上打「主键」角标", () => {
  const rows = toColumnOptions([
    column({ name: "id", primaryKey: true }),
    column({ name: "age" }),
  ]);
  assert.equal(rows[0].primaryKey, true);
  assert.equal(rows[1].primaryKey, null, "没给主键信息时按无主键处理，不留 undefined");
});

test("空输入返回空数组，不得抛错（下拉刚打开时就会走到这里）", () => {
  assert.deepEqual(toTableOptions([]), []);
  assert.deepEqual(toColumnOptions([]), []);
  assert.deepEqual(toTableOptions(null), []);
  assert.deepEqual(toColumnOptions(undefined), []);
});

test("顺序保持原样：下拉顺序直接等于用户认知里的表顺序", () => {
  const rows = ["c", "a", "b"].map(name => table({ name }));
  assert.deepEqual(toTableOptions(rows).map(o => o.value), ["c", "a", "b"]);
});

test("选项自带真实名字段：中文只是展示，字段映射不能拿去当落库列名", () => {
  const [opt] = toTableOptions([table({ name: "ms_user", comment: "用户表" })]);
  assert.notEqual(opt.label, opt.value, "本用例前提：中文与表名确实不同");
  assert.equal(opt.value, "ms_user");
  assert.equal(opt.table, "ms_user");
  const [col] = toColumnOptions([column({ name: "user_name", label: "用户名" })]);
  assert.equal(col.field, "user_name");
});

test("往返：选项 → 行，中文与类型都不丢", () => {
  const source = [table({ name: "ms_user", comment: "用户表", type: "BASE TABLE" })];
  const rows = toTableRows(toTableOptions(source));
  assert.deepEqual(rows, source, "选项里挂了 raw，往返必须原样还原");
});

test("往返：字段选项 → 行，主键标记不丢", () => {
  const source = [column({ name: "id", label: "编号", typeName: "BIGINT", primaryKey: true })];
  assert.deepEqual(toColumnRows(toColumnOptions(source)), source);
});

test("裸选项（宿主自己拼的、没有 raw）也能还原成行，不静默丢弃", () => {
  // 采集侧 middlewareForm 就是这么喂的：只给 value/label
  const rows = toTableRows([{ value: "3", label: "订单库（10.0.0.1:3306）" }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "3");
  assert.equal(rows[0].comment, null);
});

test("裸选项优先读 table/field 字段（比 value 更贴近真实名）", () => {
  const rows = toTableRows([{ value: "x", table: "ms_real", label: "用户表" }]);
  assert.equal(rows[0].name, "ms_real", "有 table 就该用它，而不是拿 value 顶");
});

test("还原空选项返回空数组", () => {
  assert.deepEqual(toTableRows([]), []);
  assert.deepEqual(toColumnRows([]), []);
  assert.deepEqual(toTableRows(null), []);
});