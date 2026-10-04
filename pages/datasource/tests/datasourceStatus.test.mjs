/**
 * 数据源状态口径与左栏筛选的单元测试（node:test，无第三方依赖）。
 *
 * <p>运行：`node --test tests/`（或 `pnpm test`）。</p>
 *
 * <p>覆盖重点是本次修复的那个缺陷：左栏「异常」页签被渲染且可点，
 * 但筛选分支不存在——点进去永远是空列表。测试直接断言
 * `filterDataSources(list, "abnormal", "")` 必须返回全部异常项。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  filterDataSources,
  isAbnormal,
  isEnabled,
  isOffline,
  isOnline,
  matchKeyword,
  matchStatusKey,
  statusCounts
} from "../src/datasourceStatus.ts";

/** 造一条数据源，只写测试关心的字段。 */
const ds = (over = {}) => ({ name: "ds", type: "jdbc", ...over });

test("isEnabled：status 为 0 才停用，null/undefined 视为启用", () => {
  assert.equal(isEnabled(ds({ status: 0 })), false);
  assert.equal(isEnabled(ds({ status: 1 })), true);
  assert.equal(isEnabled(ds({ status: null })), true);
  assert.equal(isEnabled(ds()), true);
});

test("isAbnormal：仅『启用且最近一次测试失败』成立，从未测试不算异常", () => {
  assert.equal(isAbnormal(ds({ status: 1, lastTestOk: 0 })), true);
  assert.equal(isAbnormal(ds({ status: 1, lastTestOk: 1 })), false);
  assert.equal(isAbnormal(ds({ status: 1, lastTestOk: null })), false, "null=从未测试，不得误报为故障");
  assert.equal(isAbnormal(ds({ status: 1 })), false, "缺字段同样视为从未测试");
  assert.equal(isAbnormal(ds({ status: 0, lastTestOk: 0 })), false, "停用的数据源不算异常");
});

test("isOnline：启用且不异常", () => {
  assert.equal(isOnline(ds({ status: 1, lastTestOk: 1 })), true);
  assert.equal(isOnline(ds({ status: 1, lastTestOk: null })), true, "从未测试仍算在线");
  assert.equal(isOnline(ds({ status: 1, lastTestOk: 0 })), false, "测过且失败要移出在线");
  assert.equal(isOnline(ds({ status: 0 })), false);
});

test("isOffline：仅 status=0 成立", () => {
  assert.equal(isOffline(ds({ status: 0 })), true);
  assert.equal(isOffline(ds({ status: 1 })), false);
  assert.equal(isOffline(ds({ status: null })), false);
});

test("三类互斥且穷尽：每条恰好命中一个，计数可加", () => {
  const list = [
    ds({ name: "a", status: 1, lastTestOk: 1 }),
    ds({ name: "b", status: 1, lastTestOk: 0 }),
    ds({ name: "c", status: 1, lastTestOk: null }),
    ds({ name: "d", status: 0, lastTestOk: 0 }),
    ds({ name: "e", status: 0 }),
  ];
  for (const item of list) {
    const hits = [isOnline(item), isAbnormal(item), isOffline(item)].filter(Boolean);
    assert.equal(hits.length, 1, `${item.name} 必须恰好命中一个口径`);
  }
  const counts = statusCounts(list);
  assert.deepEqual(counts, { all: 5, online: 2, abnormal: 1, offline: 2 });
  assert.equal(counts.online + counts.abnormal + counts.offline, counts.all, "三类计数必须等于全部");
});

test("回归：statusKey=abnormal 必须筛出异常项（此前该分支缺失，恒为空）", () => {
  const list = [
    ds({ name: "ok", status: 1, lastTestOk: 1 }),
    ds({ name: "bad1", status: 1, lastTestOk: 0 }),
    ds({ name: "bad2", status: 1, lastTestOk: 0 }),
    ds({ name: "off", status: 0, lastTestOk: 0 }),
    ds({ name: "never", status: 1, lastTestOk: null }),
  ];
  const abnormal = filterDataSources(list, "abnormal", "");
  assert.deepEqual(
    abnormal.map(item => item.name),
    ["bad1", "bad2"],
    "异常档必须返回测过且失败的启用项",
  );
});

test("回归：每个状态键都必须有分支（含 all），不得出现『键存在却永远空』", () => {
  const list = [
    ds({ name: "ok", status: 1, lastTestOk: 1 }),
    ds({ name: "bad", status: 1, lastTestOk: 0 }),
    ds({ name: "off", status: 0 }),
  ];
  assert.equal(filterDataSources(list, "all", "").length, 3);
  assert.equal(filterDataSources(list, "online", "").length, 1);
  assert.equal(filterDataSources(list, "abnormal", "").length, 1);
  assert.equal(filterDataSources(list, "offline", "").length, 1);
  // 每个键都要能命中它自己那一条，而不是一律返回空
  for (const key of ["all", "online", "abnormal", "offline"]) {
    assert.ok(filterDataSources(list, key, "").length > 0, `${key} 不应为空`);
    assert.equal(matchStatusKey(list[0], key), filterDataSources(list, key, "").some(i => i.name === "ok"));
  }
});

test("关键词：匹配名称/类型/地址/备注，大小写不敏感，空关键词放行", () => {
  const item = ds({ name: "订单库", type: "jdbc", host: "10.0.0.7", remark: "主库 READONLY" });
  assert.equal(matchKeyword(item, ""), true);
  assert.equal(matchKeyword(item, "   "), true);
  assert.equal(matchKeyword(item, "订单"), true);
  assert.equal(matchKeyword(item, "JDBC"), true, "类型匹配应大小写不敏感");
  assert.equal(matchKeyword(item, "readonly"), true, "备注匹配应大小写不敏感");
  assert.equal(matchKeyword(item, "10.0.0"), true);
  assert.equal(matchKeyword(item, "不存在"), false);
});

test("关键词与状态叠加过滤", () => {
  const list = [
    ds({ name: "prod-bad", status: 1, lastTestOk: 0, host: "10.1.1.1" }),
    ds({ name: "prod-ok", status: 1, lastTestOk: 1, host: "10.1.1.2" }),
    ds({ name: "dev-bad", status: 1, lastTestOk: 0, host: "10.2.2.2" }),
  ];
  assert.deepEqual(
    filterDataSources(list, "abnormal", "prod").map(item => item.name),
    ["prod-bad"],
  );
  assert.deepEqual(
    filterDataSources(list, "all", "10.1.1").map(item => item.name),
    ["prod-bad", "prod-ok"],
  );
});
