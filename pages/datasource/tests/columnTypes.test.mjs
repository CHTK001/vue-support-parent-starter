/**
 * 列类型知识的单元测试（node:test，无第三方依赖）。
 *
 * <p>运行：`node --test tests/`（或 `pnpm test`）。</p>
 *
 * <p>这份常量被三处共用：设计视图的列网格、列属性对话框、新建表（设计表）对话框。
 * 它一旦出现重复项/脏数据，现象是「同一个类型在下拉里出现两次」或
 * 「下拉能选、后端构造 DbColumnDef 时拒绝」——都得跑到界面才发现，所以前置到这里。</p>
 *
 * <p>后端 {@code DbColumnDef.SUPPORTED_TYPES} 是权威口径，本文件守的是**前端镜像内部**
 * 的自洽；两边同步改动仍靠 code review（跨语言无法在单测里直接比对）。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  COLUMN_TYPE_GROUPS,
  ENUM_LIKE_TYPES,
  SCALE_ALLOWED,
  SIZE_REQUIRED,
  UNSIGNED_ALLOWED,
  columnTypeSelectOptions,
  typeAllowsScale,
  typeAllowsUnsigned,
  typeNeedsSize,
} from "../src/utils/columnTypes.ts";

test("类型分组：不重复、大写、组名非空", () => {
  const seen = new Set();
  assert.ok(COLUMN_TYPE_GROUPS.length > 0, "至少要有一个分组");
  for (const group of COLUMN_TYPE_GROUPS) {
    assert.ok(group.label.trim(), "分组名不能为空");
    assert.ok(Array.isArray(group.types) && group.types.length > 0, `${group.label} 分组必须有类型`);
    for (const type of group.types) {
      assert.equal(type, type.toUpperCase().trim(), `${type} 必须是大写标准名`);
      assert.ok(!seen.has(type), `类型重复出现在下拉里: ${type}`);
      seen.add(type);
    }
  }
});

test("分组下拉项：与分组表一一对应，group 字段就是分组名", () => {
  const options = columnTypeSelectOptions();
  const total = COLUMN_TYPE_GROUPS.reduce((sum, g) => sum + g.types.length, 0);
  assert.equal(options.length, total, "下拉项数量必须等于类型总数");
  const byGroup = new Map(COLUMN_TYPE_GROUPS.map(g => [g.label, g.types.length]));
  for (const group of [...new Set(options.map(o => o.group))]) {
    const count = options.filter(o => o.group === group).length;
    assert.equal(count, byGroup.get(group), `分组 ${group} 的项数对不上`);
  }
  // value 必须是真实类型名 —— 它会被原样拼进 DDL
  assert.ok(options.every(o => o.value === o.value.toUpperCase()), "value 必须是真实类型名");
});

test("长度 / 小数位 / UNSIGNED 的适用范围", () => {
  // 后端 SIZE_REQUIRED 只认这 6 个：多一个少一个都会「界面不显示长度、后端却要长度」
  for (const type of ["CHAR", "VARCHAR", "BINARY", "VARBINARY", "DECIMAL", "NUMERIC"]) {
    assert.ok(typeNeedsSize(type), `${type} 必须要长度`);
    assert.equal(SIZE_REQUIRED.has(type), true);
  }
  assert.equal(typeNeedsSize("INT"), false, "整数不该要长度");
  assert.equal(typeNeedsSize("TEXT"), false, "TEXT 不该要长度");
  // DECIMAL 要长度 + 小数位；FLOAT 只要小数位；VARCHAR 两个都不给小数位
  assert.ok(typeAllowsScale("DECIMAL"));
  assert.ok(typeAllowsScale("FLOAT"));
  assert.equal(typeAllowsScale("VARCHAR"), false);
  assert.equal(typeAllowsScale("BIGINT"), false);
  // UNSIGNED 只给数值类：字符类给了也只会被后端拒绝
  assert.ok(typeAllowsUnsigned("BIGINT"));
  assert.equal(typeAllowsUnsigned("VARCHAR"), false);
  assert.equal(UNSIGNED_ALLOWED.has("VARCHAR"), false);
  assert.equal(SCALE_ALLOWED.has("VARCHAR"), false);
});

test("ENUM / SET 才需要取值列表", () => {
  assert.ok(ENUM_LIKE_TYPES.has("ENUM"));
  assert.ok(ENUM_LIKE_TYPES.has("SET"));
  assert.equal(ENUM_LIKE_TYPES.has("VARCHAR"), false);
  assert.equal(ENUM_LIKE_TYPES.has("JSON"), false);
});
