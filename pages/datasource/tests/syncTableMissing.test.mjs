/**
 * 「表不存在」分侧判定的回归测试（node:test，无第三方依赖）。
 *
 * <p>锁住一个真实缺陷：源表不存在时曾经弹出「设计表」弹框。
 * 用户看到的报错是</p>
 *
 * <pre>
 * 源不可用：源表不存在或无法读取: Table '_healthcheck_tmp.workshop_asset' doesn't exist
 * </pre>
 *
 * <p>这条文案同时命中 `isTableMissingError`（含「无法读取」），
 * 于是前端认为「表不存在 → 该建表」，把用户引向建一张源表 ——
 * 而真正要改的是 SQL 里的库名（`_healthcheck_tmp`）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  isSourceTableMissingError,
  isTableMissingError,
  shouldOpenTableDesigner
} from "../src/syncTableMissing.ts";

/** 真实后端文案：源表不存在（库名写错）。 */
const SOURCE_MISSING =
  "源表不存在或无法读取: Table '_healthcheck_tmp.workshop_asset' doesn't exist"
  + "（源 SQL: SELECT * FROM `_healthcheck_tmp`.`workshop_asset`）";

/** 真实后端文案：目标表不存在。 */
const TARGET_MISSING = "目标表不存在或没有可读列: ngxacc.device_channel";

test("源侧缺表：不弹设计表（源表不归本系统创建）", () => {
  assert.equal(isSourceTableMissingError(SOURCE_MISSING), true, "先确认命中源侧契约");
  assert.equal(
    shouldOpenTableDesigner(SOURCE_MISSING),
    false,
    "源侧缺表必须只弹提示，不能弹建表框"
  );
});

test("源侧文案虽含『无法读取』，也不得被当成可建表的信号", () => {
  // 这是缺陷的直接成因：isTableMissingError 会命中，只看它就会误弹。
  assert.equal(isTableMissingError(SOURCE_MISSING), true, "确实会命中通用缺表判定");
  assert.equal(shouldOpenTableDesigner(SOURCE_MISSING), false, "但分侧后必须拦住");
});

test("目标侧缺表：仍然弹设计表（建目标表是合理补救）", () => {
  assert.equal(shouldOpenTableDesigner(TARGET_MISSING), true);
});

test("方言原生串（旧后端 / 非 MySQL）按通用缺表处理", () => {
  assert.equal(shouldOpenTableDesigner("Table 'db.tbl' doesn't exist"), true);
  assert.equal(shouldOpenTableDesigner('relation "public.tbl" does not exist'), true);
  assert.equal(shouldOpenTableDesigner("ORA-00942: table or view does not exist"), true);
});

test("与缺表无关的报错一律不弹设计表", () => {
  assert.equal(shouldOpenTableDesigner("连接超时"), false);
  assert.equal(shouldOpenTableDesigner("Access denied for user 'root'"), false);
  assert.equal(shouldOpenTableDesigner(""), false);
});
