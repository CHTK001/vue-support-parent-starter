/**
 * 列类型知识的单元测试（node:test，无第三方依赖）。
 *
 * <p>运行：`node --test tests/`（或 `pnpm test`）。</p>
 *
 * <p>这份常量被三处共用：设计视图的列网格、列属性对话框、新建表（设计表）对话框。
 * 它一旦出现重复项/脏数据，现象是「同一个类型在下拉里出现两次」或
 * 「下拉能选、后端构造 DbColumnDef 时拒绝」——都得跑到界面才发现，所以前置到这里。</p>
 *
 * <p>4.0.0.46 起类型表按方言分组（mysql / postgresql / oracle / sqlserver / sqlite /
 * duckdb / h2 / clickhouse）。本文件同时守：单一口径的自洽（每份都不重复、全大写），
 * 以及**方言归属**（VARCHAR2 只在 Oracle 出现、NVARCHAR 只在 SQL Server 出现 ——
 * 出现在别的方言里就是用户会选错的类型）。</p>
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
  ALL_COLUMN_TYPES,
  ENUM_LIKE_TYPES,
  SCALE_ALLOWED,
  SIZE_REQUIRED,
  UNSIGNED_ALLOWED,
  columnTypeGroupsFor,
  columnTypeSelectOptions,
  typeAllowsScale,
  typeAllowsUnsigned,
  typeNeedsSize,
} from "../src/utils/columnTypes.ts";

/** 全部方言键（与 utils/dbDialect.ts 保持一致） */
const ALL_DIALECTS = ["mysql", "postgresql", "clickhouse", "oracle", "sqlserver", "sqlite", "h2", "duckdb"];

test("所有方言的类型分组：不重复、大写、组名非空", () => {
  for (const dialect of ALL_DIALECTS) {
    const groups = columnTypeGroupsFor(dialect);
    assert.ok(groups.length > 0, `${dialect} 至少要有一个分组`);
    const seen = new Set();
    for (const group of groups) {
      assert.ok(group.label.trim(), `${dialect}/${group.label} 分组名不能为空`);
      assert.ok(Array.isArray(group.types) && group.types.length > 0, `${dialect}/${group.label} 分组必须有类型`);
      for (const type of group.types) {
        assert.equal(type, type.toUpperCase().trim(), `${dialect}/${type} 必须是大写标准名`);
        assert.ok(!seen.has(type), `${dialect} 类型重复出现在下拉里: ${type}`);
        seen.add(type);
      }
    }
  }
});

test("分组下拉项：value 必须是真实类型名，group 就是分组名", () => {
  for (const dialect of ALL_DIALECTS) {
    const groups = columnTypeGroupsFor(dialect);
    const options = columnTypeSelectOptions(dialect);
    const total = groups.reduce((sum, g) => sum + g.types.length, 0);
    assert.equal(options.length, total, `${dialect} 下拉项数量必须等于类型总数`);
    // value 会被原样拼进 DDL，必须是类型名本身
    assert.ok(options.every(o => o.value === o.value.toUpperCase()), `${dialect} value 必须是真实类型名`);
    // 每个 value 都能在某个分组里找到
    const all = new Set(groups.flatMap(g => g.types));
    assert.ok(options.every(o => all.has(o.value)), `${dialect} 下拉项与分组表不一一对应`);
  }
});

test("未知方言回落到 MySQL", () => {
  assert.equal(columnTypeGroupsFor(undefined), columnTypeGroupsFor("mysql"));
  assert.equal(columnTypeGroupsFor("redis"), columnTypeGroupsFor("mysql"));
  assert.equal(columnTypeGroupsFor(""), columnTypeGroupsFor("mysql"));
});

test("方言归属：不该出现在本方言的类型绝不出现", () => {
  const typesOf = (d) => new Set(columnTypeGroupsFor(d).flatMap(g => g.types));
  const mysql = typesOf("mysql");
  const pg = typesOf("postgresql");
  const oracle = typesOf("oracle");
  const sqlserver = typesOf("sqlserver");
  const duckdb = typesOf("duckdb");
  const clickhouse = typesOf("clickhouse");

  // Oracle 专属
  assert.ok(oracle.has("VARCHAR2") && oracle.has("NVARCHAR2") && oracle.has("NUMBER") && oracle.has("RAW")
    && oracle.has("CLOB") && oracle.has("BINARY_FLOAT"));
  assert.equal(mysql.has("VARCHAR2"), false, "VARCHAR2 不能出现在 MySQL");
  assert.equal(sqlserver.has("VARCHAR2"), false);
  // SQL Server 专属
  assert.ok(sqlserver.has("NVARCHAR") && sqlserver.has("DATETIME2") && sqlserver.has("DATETIMEOFFSET")
    && sqlserver.has("UNIQUEIDENTIFIER") && sqlserver.has("MONEY") && sqlserver.has("NTEXT"));
  assert.equal(mysql.has("NVARCHAR"), false, "NVARCHAR 不能出现在 MySQL");
  assert.equal(oracle.has("NVARCHAR"), false, "Oracle 用的是 NVARCHAR2");
  // PostgreSQL 专属
  assert.ok(pg.has("BYTEA") && pg.has("JSONB") && pg.has("TIMESTAMPTZ") && pg.has("INTERVAL"));
  assert.equal(mysql.has("BYTEA"), false);
  assert.equal(oracle.has("JSONB"), false, "JSONB 是 PostgreSQL 原生类型");
  // DuckDB 专属
  assert.ok(duckdb.has("HUGEINT") && duckdb.has("UTINYINT") && duckdb.has("UBIGINT"));
  assert.equal(mysql.has("HUGEINT"), false);
  // ClickHouse 专属
  assert.ok(clickhouse.has("STRING") && clickhouse.has("FIXEDSTRING")
    && clickhouse.has("INT8") && clickhouse.has("DATETIME64") && clickhouse.has("IPV6"));
  assert.equal(mysql.has("STRING"), false, "STRING 不能出现在 MySQL");
});

test("SQLite 只有 5 个存储类", () => {
  const sqlite = columnTypeGroupsFor("sqlite").flatMap(g => g.types);
  assert.equal(sqlite.length, 5, "SQLite 动态类型只有 5 个存储类");
  assert.deepEqual([...sqlite].sort(), ["BLOB", "INTEGER", "NUMERIC", "REAL", "TEXT"]);
});

test("VECTOR：MySQL 与 PostgreSQL(pgvector) 都有，且需要维度", () => {
  const mysql = new Set(columnTypeGroupsFor("mysql").flatMap(g => g.types));
  const pg = new Set(columnTypeGroupsFor("postgresql").flatMap(g => g.types));
  assert.ok(mysql.has("VECTOR"), "MySQL 9 应提供 VECTOR");
  assert.ok(pg.has("VECTOR"), "pgvector 应提供 VECTOR");
  assert.ok(typeNeedsSize("VECTOR"), "VECTOR 的长度=维度，必填");
  assert.ok(SIZE_REQUIRED.has("VECTOR"));
  assert.ok(ALL_COLUMN_TYPES.has("VECTOR"));
});

test("长度 / 小数位 / UNSIGNED 的适用范围", () => {
  // 后端 SIZE_REQUIRED：字符族 + 数值精度 + FIXEDSTRING + VECTOR（维度）。
  // 多一个少一个都会「界面不显示长度、后端却要长度」。
  for (const type of ["CHAR", "VARCHAR", "BINARY", "VARBINARY", "DECIMAL", "NUMERIC",
    "VARCHAR2", "NVARCHAR2", "NCHAR", "NVARCHAR", "RAW", "FIXEDSTRING", "VECTOR"]) {
    assert.ok(typeNeedsSize(type), `${type} 必须要长度`);
    assert.equal(SIZE_REQUIRED.has(type), true);
  }
  assert.equal(typeNeedsSize("INT"), false, "整数不该要长度");
  assert.equal(typeNeedsSize("TEXT"), false, "TEXT 不该要长度");
  assert.equal(typeNeedsSize("BYTEA"), false, "BYTEA 不定长");
  // NUMBER 允许小数位但长度可不给（Oracle 裸 NUMBER）
  assert.ok(typeAllowsScale("NUMBER"));
  assert.equal(typeNeedsSize("NUMBER"), false, "Oracle 允许裸 NUMBER");
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

test("ALL_COLUMN_TYPES 是所有方言的并集（供跨方言保留类型名）", () => {
  for (const dialect of ALL_DIALECTS) {
    for (const type of columnTypeGroupsFor(dialect).flatMap(g => g.types)) {
      assert.ok(ALL_COLUMN_TYPES.has(type), `${type} 应在并集里`);
    }
  }
});