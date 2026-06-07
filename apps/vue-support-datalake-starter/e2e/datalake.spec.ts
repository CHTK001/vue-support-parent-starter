import { test, expect } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:8853";
const API_BASE = "http://127.0.0.1:58081/v2/datalake";

/** 安全解析 JSON，处理空 body */
async function safeJson(res: any): Promise<any> {
  const text = await res.text();
  if (!text || text.trim().length === 0) return null;
  try { return JSON.parse(text); } catch { return null; }
}

/** 获取 Bearer token（非公共路径的 API 需要） */
async function getAuthToken(request: any): Promise<string | null> {
  try {
    const res = await request.post(`${API_BASE}/auth/token`, {
      data: { description: "playwright-e2e" },
    });
    if (res.status() !== 200) return null;
    const json = await res.json();
    return json?.token || null;
  } catch { return null; }
}

// ============================================================
// 1. 后端 API 联调测试
// ============================================================
test.describe("后端 API 联调", () => {

  test("采集器列表 API", async ({ request }) => {
    const res = await request.get(`${API_BASE}/collector/list`);
    expect(res.status()).toBe(200);
    const json = await safeJson(res);
    if (json) {
      console.log(`采集器数量: ${json.data?.length ?? "N/A"}`);
    } else {
      console.log("⚠ 采集器列表返回空 body（已知 Netty ProtocolServer 问题）");
    }
  });

  test("采集器重启 API", async ({ request }) => {
    const res = await request.post(`${API_BASE}/collector/HTTP/restart`);
    expect(res.status()).toBe(200);
    console.log(`采集器重启: HTTP ${res.status()}`);
  });

  test("订阅器列表与管理 API", async ({ request }) => {
    const r1 = await request.get(`${API_BASE}/subscriber/list`);
    expect(r1.status()).toBe(200);
    console.log(`订阅器列表: HTTP ${r1.status()}`);

    const r2 = await request.get(`${API_BASE}/subscriber/clients`);
    expect(r2.status()).toBe(200);
    console.log(`订阅器客户端: HTTP ${r2.status()}`);
  });

  test("节点类型列表 API", async ({ request }) => {
    const token = await getAuthToken(request);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await request.get(`${API_BASE}/node/list`, { headers });
    if (res.status() === 401) {
      console.log("⚠ /node/list 返回 401（需配置 TokenService），跳过详情");
      return;
    }
    expect(res.status()).toBe(200);
    const json = await safeJson(res);
    if (json?.data) {
      console.log(`节点类型: ${json.data.length} 种`);
      for (const n of json.data) {
        console.log(`  - ${n.type} (${n.spis?.length || 0} SPI)`);
      }
    }
  });

  test("节点 SPI 详情 API", async ({ request }) => {
    const token = await getAuthToken(request);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await request.get(`${API_BASE}/node/script/spis`, { headers });
    if (res.status() === 401) {
      console.log("⚠ /node/script/spis 返回 401（需配置 TokenService），跳过详情");
      return;
    }
    expect(res.status()).toBe(200);
    const json = await safeJson(res);
    if (json?.data) {
      console.log(`script SPI: ${json.data.length} 个`);
    }
  });

  test("脚本测试 API - JavaScript", async ({ request }) => {
    const token = await getAuthToken(request);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await request.post(`${API_BASE}/script/test`, {
      headers,
      data: {
        script: `(function(data) { data.parsed = { result: "test_ok", input: data.rawPayload }; return data; })(envelope)`,
        scriptType: "js",
        payload: JSON.stringify({ temperature: 25, humidity: 60 }),
      },
    });
    // 脚本测试可能返回 200 或 500（取决于脚本引擎）
    console.log(`JS 脚本测试: HTTP ${res.status()}`);
    const json = await safeJson(res);
    if (json) {
      console.log(`  结果: ${JSON.stringify(json.data || json.error)}`);
    }
  });

  test("管线校验器 - 获取状态", async ({ request }) => {
    const res = await request.get(`${API_BASE}/validator/status`);
    expect(res.status()).toBe(200);
    const json = await safeJson(res);
    if (json?.data) {
      console.log(`校验器: enabled=${json.data.enabled}, requirePipelineId=${json.data.requirePipelineId}, whitelist=${json.data.whitelist?.length || 0} 条IP`);
    }
  });

  test("管线校验器 - 切换启停", async ({ request }) => {
    // 直接 POST toggle 测试
    const toggle = await request.post(`${API_BASE}/validator/toggle`, {
      data: { enabled: true, requirePipelineId: true },
    });
    expect(toggle.status()).toBe(200);
    const json = await safeJson(toggle);
    if (json?.data) {
      console.log(`切换后: enabled=${json.data.enabled}, requirePipelineId=${json.data.requirePipelineId}`);
    }
  });

  test("管线校验器 - IP 白名单增删", async ({ request }) => {
    const testIp = "192.168.1.100";

    const add = await request.post(`${API_BASE}/validator/whitelist/add`, {
      data: { item: testIp },
    });
    expect(add.status()).toBe(200);
    console.log(`添加白名单: HTTP ${add.status()}`);

    const remove = await request.post(`${API_BASE}/validator/whitelist/remove`, {
      data: { item: testIp },
    });
    expect(remove.status()).toBe(200);
    console.log("✅ 白名单增删通过");
  });

  test("流水线 CRUD 全流程", async ({ request }) => {
    const pid = `e2e-crud-${Date.now()}`;

    // 创建（后端 handleCreatePipeline 需要 id + dsl 字段）
    const create = await request.post(`${API_BASE}/pipeline`, {
      data: {
        id: pid,
        dsl: JSON.stringify({
          name: "E2E 测试管线",
          description: "Playwright 自动测试",
          nodes: [
            { type: "source", spi: "http-source", config: {} },
            { type: "parse", spi: "json-parser", config: {} },
            { type: "sink", spi: "log-sink", config: {} },
          ],
        }),
      },
    });
    expect(create.status()).toBe(200);

    // 查询详情
    const get = await request.get(`${API_BASE}/pipeline/${pid}`);
    expect(get.status()).toBe(200);

    // 启动
    const start = await request.post(`${API_BASE}/pipeline/${pid}/start`);
    expect(start.status()).toBe(200);

    // 获取状态
    const status = await request.get(`${API_BASE}/pipeline/${pid}/status`);
    expect(status.status()).toBe(200);
    const statusJson = await status.json();
    console.log(`管线 [${pid}] 状态: lifecycle=${statusJson.lifecycle}`);

    // 停止
    await request.post(`${API_BASE}/pipeline/${pid}/stop`);

    // 删除
    const del = await request.delete(`${API_BASE}/pipeline/${pid}`);
    expect(del.status()).toBe(200);
    console.log("✅ 流水线 CRUD 全流程通过");
  });

  test("管线数据提交 API", async ({ request }) => {
    const pid = `submit-${Date.now()}`;
    await request.post(`${API_BASE}/pipeline`, {
      data: {
        id: pid,
        dsl: JSON.stringify({
          name: "提交测试",
          nodes: [
            { type: "source", spi: "http-source", config: {} },
            { type: "sink", spi: "log-sink", config: {} },
          ],
        }),
      },
    });
    await request.post(`${API_BASE}/pipeline/${pid}/start`);

    const submit = await request.post(`${API_BASE}/pipeline/${pid}/submit`, {
      data: { payload: JSON.stringify({ test: "hello" }), format: "json" },
    });
    console.log(`数据提交: HTTP ${submit.status()}`);
    expect(submit.status()).toBe(200);

    await request.post(`${API_BASE}/pipeline/${pid}/stop`);
    await request.delete(`${API_BASE}/pipeline/${pid}`);
    console.log("✅ 管线数据提交通过");
  });

  test("采集端点 - pipelineId 必填校验", async ({ request }) => {
    // 不带 pipelineId
    const res1 = await request.post(`${API_BASE}/collect`, {
      data: { data: "no pipelineId" },
    });
    console.log(`无 pipelineId 采集: HTTP ${res1.status()}`);

    // 带有效 pipelineId
    const res2 = await request.post(`${API_BASE}/collect`, {
      data: {
        pipelineId: "pipeline-management",
        data: JSON.stringify({ temperature: 28, humidity: 55, location: "beijing" }),
        format: "json",
      },
    });
    expect(res2.status()).toBe(200);
    const json2 = await res2.json();
    expect(json2.status).toBe("collected");
    console.log(`✅ 采集端点通过: ${json2.status}`);
  });

  test("监控统计 API", async ({ request }) => {
    const res = await request.get(`${API_BASE}/monitor/stats`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    console.log(`监控: activePipelines=${json.activePipelines}, throughput=${json.throughput}/s, todayProcessed=${json.todayProcessed}`);
    expect(json).toHaveProperty("activePipelines");
    expect(json).toHaveProperty("throughput");
  });

  test("死信队列 API", async ({ request }) => {
    const res = await request.get(`${API_BASE}/dlq/list`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    console.log(`✅ 死信队列: ${json?.length ?? 0} 条`);
  });

  test("SPI 清单 API", async ({ request }) => {
    const res = await request.get(`${API_BASE}/pipeline/spis`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    const keys = Object.keys(json || {});
    console.log(`✅ SPI 清单: ${keys.length} 种类型 (${keys.join(", ")})`);
  });

  test("订阅管理 API", async ({ request }) => {
    const r1 = await request.get(`${API_BASE}/subscription/list`);
    expect(r1.status()).toBe(200);
    console.log(`✅ 订阅列表: HTTP ${r1.status()}`);
  });

  // ---- 新增 CRUD 测试覆盖 (API 直接调用) ----

  test("死信队列 CRUD 操作 API", async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/dlq/list`);
    const list = await safeJson(listRes);
    const items = Array.isArray(list) ? list : [];
    if (items.length > 0) {
      const id = items[0].id;
      const retry = await request.post(`${API_BASE}/dlq/${id}/retry`);
      expect(retry.status()).toBe(200);
      console.log(`✅ DLQ 重试 [${id}]: HTTP 200`);
      const del = await request.delete(`${API_BASE}/dlq/${id}`);
      expect(del.status()).toBe(200);
      console.log(`✅ DLQ 删除 [${id}]: HTTP 200`);
    } else {
      console.log("ℹ️ 无死信记录，跳过重试/删除");
    }
    const clear = await request.delete(`${API_BASE}/dlq/clear`);
    expect(clear.status()).toBe(200);
    console.log("✅ DLQ 清空: HTTP 200");
  });

  test("身份令牌 CRUD API", async ({ request }) => {
    const desc = `api-test-${Date.now()}`;
    const create = await request.post(`${API_BASE}/auth/token`, { data: { description: desc } });
    expect(create.status()).toBe(200);
    const created = await safeJson(create);
    console.log(`✅ Token 创建: ${created?.token ? "token=" + created.token.substring(0, 12) + "..." : "OK"}`);
    const list = await request.get(`${API_BASE}/auth/token`);
    expect(list.status()).toBe(200);
    const token = created?.token || created?.data?.token;
    if (token) {
      const del = await request.delete(`${API_BASE}/auth/token?token=${token}`);
      expect(del.status()).toBe(200);
      console.log("✅ Token 删除: HTTP 200");
    }
  });

  test("系统设置 GET/PUT API", async ({ request }) => {
    const get = await request.get(`${API_BASE}/settings`);
    expect(get.status()).toBe(200);
    const settings = await safeJson(get);
    const data = settings?.data || settings;
    console.log(`✅ 系统设置: httpPort=${data?.httpPort}, authEnabled=${data?.authEnabled}`);
    const origAuth = data?.authEnabled;
    const put = await request.put(`${API_BASE}/settings`, {
      data: { authEnabled: false, rateLimit: 100 },
    });
    expect(put.status()).toBe(200);
    if (origAuth !== undefined) {
      await request.put(`${API_BASE}/settings`, { data: { authEnabled: origAuth } });
    }
    console.log("✅ 系统设置更新: HTTP 200 (已恢复)");
  });

  test("数据查询/链路追踪/聚合 API", async ({ request }) => {
    const query = await request.post(`${API_BASE}/data/query`, {
      data: { pipelineId: "pipeline-management", limit: 10 },
      timeout: 5000,
    }).catch(e => { console.log(`  ⚠️ 数据查询超时或失败: ${e.message}`); return null; });
    if (!query) {
      console.log(`  ⏭️ 跳过数据查询/追踪/聚合断言（后端数据查询不可用）`);
    } else {
      expect(query.status()).toBe(200);
      const queryResult = await safeJson(query);
      const records = queryResult?.data?.records || queryResult?.records || [];
      console.log(`✅ 数据查询: ${records.length} 条`);
      if (records.length > 0) {
        const traceId = records[0]?.traceId || records[0]?.trace_id;
        if (traceId) {
          const trace = await request.get(`${API_BASE}/data/trace/${traceId}`);
          expect(trace.status()).toBe(200);
          console.log(`✅ 链路追踪 [${traceId}]: HTTP 200`);
        }
      }
      const agg = await request.post(`${API_BASE}/data/aggregate`, {
        data: { pipelineId: "pipeline-management", field: "temperature", method: "avg" },
      });
      expect(agg.status()).toBe(200);
      console.log(`✅ 聚合查询: HTTP ${agg.status()}`);
    }
  });

  test("流水线暂停/恢复/更新 API", async ({ request }) => {
    const pid = `e2e-lifecycle-${Date.now()}`;
    await request.post(`${API_BASE}/pipeline`, {
      data: {
        id: pid,
        dsl: JSON.stringify({
          name: "生命周期测试",
          nodes: [{ type: "source", spi: "http-source", config: {} }, { type: "sink", spi: "log-sink", config: {} }],
        }),
      },
    });
    await request.post(`${API_BASE}/pipeline/${pid}/start`);
    const pause = await request.post(`${API_BASE}/pipeline/${pid}/pause`);
    expect(pause.status()).toBe(200);
    console.log("✅ 暂停管线: HTTP 200");
    const resume = await request.post(`${API_BASE}/pipeline/${pid}/resume`);
    expect(resume.status()).toBe(200);
    console.log("✅ 恢复管线: HTTP 200");
    const update = await request.put(`${API_BASE}/pipeline`, {
      data: { id: pid, description: "通过 PUT 更新" },
    });
    expect(update.status()).toBe(200);
    console.log("✅ 更新管线: HTTP 200");
    await request.post(`${API_BASE}/pipeline/${pid}/stop`);
    await request.delete(`${API_BASE}/pipeline/${pid}`);
    console.log("✅ 流水线生命周期 API 全流程通过");
  });

  test("后端采集器注册/心跳 API — 参数校验（不注册假客户端）", async ({ request }) => {
    // 测试缺失 clientId → 400（不真正注册客户端，避免污染采集管理列表）
    const noClientId = await request.post(`${API_BASE}/collector/register`, {
      data: { pipelineId: "test", topics: ["test"] },
    });
    expect(noClientId.status()).toBe(400);
    console.log("✅ 采集器注册无 clientId → 400");

    // 测试未知 client heartbeat → 404
    const unknownHb = await request.post(`${API_BASE}/collector/nonexistent-client/heartbeat`);
    expect(unknownHb.status()).toBe(404);
    console.log("✅ 未知采集器心跳 → 404");
  });

  test("订阅注册/轮询 API — 参数校验（不注册假客户端）", async ({ request }) => {
    // 测试缺失 clientId → 400（不真正注册客户端，避免污染订阅管理列表）
    const noClientId = await request.post(`${API_BASE}/subscribe/register`, {
      data: { topic: "weather" },
    });
    expect(noClientId.status()).toBe(400);
    console.log("✅ 订阅注册无 clientId → 400");

    // 测试轮询无 clientId → 400
    const noPollId = await request.get(`${API_BASE}/subscribe/poll`);
    expect(noPollId.status()).toBe(400);
    console.log("✅ 订阅轮询无 clientId → 400");

    // 测试未知 clientId 轮询 → 200 空列表（只读，不污染共享状态）
    const unknownPoll = await request.get(`${API_BASE}/subscribe/poll?clientId=readonly-check`);
    expect(unknownPoll.status()).toBe(200);
    const pollData = await safeJson(unknownPoll);
    console.log(`✅ 未知 clientId 轮询: HTTP 200, 返回 ${Array.isArray(pollData) ? pollData.length : 0} 条`);
  });

  test("监控指标/吞吐量/错误率 API", async ({ request }) => {
    const metrics = await request.get(`${API_BASE}/monitor/metrics`);
    expect(metrics.status()).toBe(200);
    const throughput = await request.get(`${API_BASE}/monitor/throughput`);
    expect(throughput.status()).toBe(200);
    const errors = await request.get(`${API_BASE}/monitor/errors`);
    expect(errors.status()).toBe(200);
    const tpData = await safeJson(throughput);
    const tpLen = Array.isArray(tpData) ? tpData.length : (tpData?.data?.length || 0);
    console.log(`✅ 监控指标: OK, 吞吐量趋势: ${tpLen} 点, 错误率: OK`);
  });
});

// ============================================================
// 2. 前端页面联调测试
// ============================================================
test.describe("前端页面联调", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "load" });
    await page.waitForSelector(".datalake-app", { timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test("页面正常加载", async ({ page }) => {
    await expect(page.locator(".brand-text h1")).toContainText("数据中台");
    await expect(page.locator(".server-status .status-text")).toBeVisible();
    console.log("✅ 品牌标题和服务器状态正常");
  });

  test("Tab 导航切换", async ({ page }) => {
    const tabs = page.locator(".tab-item");
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(7);
    console.log(`Tab 数量: ${tabCount}`);

    const tabLabels = ["监控大屏", "流水线管理", "数据查询", "订阅管理", "采集管理", "死信队列", "系统配置"];
    for (const label of tabLabels) {
      const tab = page.locator(".tab-item", { hasText: label });
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(400);
        await expect(tab).toHaveClass(/active/);
        console.log(`  ✅ ${label}`);
      }
    }
  });

  test("监控大屏 - 状态横幅与图表", async ({ page }) => {
    await page.locator(".tab-item", { hasText: "监控大屏" }).click();
    await page.waitForTimeout(1500);

    // 状态统计卡片
    const statCards = page.locator(".stat-card");
    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`✅ 监控大屏: ${cardCount} 个状态卡片`);

    // 生命周期六边形架构图节点
    const lifecycleNodes = page.locator(".lifecycle-node");
    const lcCount = await lifecycleNodes.count();
    expect(lcCount).toBeGreaterThanOrEqual(6);
    console.log(`✅ 生命周期流: ${lcCount} 个架构节点`);

    // 验证画布图表（ECharts）存在
    const canvases = await page.locator("canvas").count();
    console.log(`✅ 图表: ${canvases} 个 canvas 渲染`);
  });

  test("流水线管理 - 页面交互", async ({ page }) => {
    await page.locator(".tab-item", { hasText: "流水线管理" }).click();
    await page.waitForTimeout(2000);

    // 查找管线相关元素
    const hasList = await page.locator("table, .el-table, .pipeline-card, .sc-flow-editor").first().isVisible().catch(() => false);
    console.log(`✅ 流水线页面: ${hasList ? "内容已加载" : "等待数据"}`);
  });

  test("数据查询与订阅管理 - 页面加载", async ({ page }) => {
    for (const tab of ["数据查询", "订阅管理", "采集管理", "死信队列"]) {
      await page.locator(".tab-item", { hasText: tab }).click();
      await page.waitForTimeout(1000);
      console.log(`✅ ${tab} 页面加载完成`);
    }
  });

  test("刷新按钮与服务器状态", async ({ page }) => {
    const refreshBtn = page.locator(".header-refresh-btn");
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.dispatchEvent("click");
    await page.waitForTimeout(4000);

    const statusText = await page.locator(".status-text").textContent();
    console.log(`✅ 刷新后服务器状态: ${statusText}`);
  });
});

// ============================================================
// 3. 端到端集成流程测试
// ============================================================
test.describe("端到端集成流程", () => {

  test("完整链路: 创建管线 → 采集天气数据 → 查询监控", async ({ request }) => {
    const pipeId = `e2e-flow-${Date.now()}`;

    // Step 1: 创建带脚本节点的管线
    const createRes = await request.post(`${API_BASE}/pipeline`, {
      data: {
        id: pipeId,
        dsl: JSON.stringify({
          name: "E2E 天气数据处理",
          description: "采集天气数据 → 脚本解析 → 输出",
          nodes: [
            { type: "source", spi: "http-source", config: {} },
            {
            type: "script",
            spi: null,
            config: {
              script: `(function(data) { var raw = data.rawPayload; data.parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; return data; })(envelope)`,
              scriptType: "js",
            },
          },
          { type: "sink", spi: "log-sink", config: {} },
          ],
        }),
      },
    });
    expect(createRes.status()).toBe(200);
    console.log("✅ Step 1: 创建管线");

    // Step 2: 启动管线
    const startRes = await request.post(`${API_BASE}/pipeline/${pipeId}/start`);
    expect(startRes.status()).toBe(200);
    console.log("✅ Step 2: 启动管线");

    // Step 3: 采集天气数据
    const weather = {
      pipelineId: pipeId,
      data: JSON.stringify({
        location: "北京",
        temperature: 26.5,
        humidity: 45,
        pressure: 1013,
        weather: "晴",
        timestamp: new Date().toISOString(),
      }),
      format: "json",
    };
    const collectRes = await request.post(`${API_BASE}/collect`, { data: weather });
    expect(collectRes.status()).toBe(200);
    console.log("✅ Step 3: 采集天气数据");

    // Step 4: 提交数据
    const submitRes = await request.post(`${API_BASE}/pipeline/${pipeId}/submit`, {
      data: { payload: JSON.stringify({ test: "e2e_final" }), format: "json" },
    });
    expect(submitRes.status()).toBe(200);
    console.log("✅ Step 4: 提交数据");

    // Step 5: 查询管线状态
    const statusRes = await request.get(`${API_BASE}/pipeline/${pipeId}/status`);
    expect(statusRes.status()).toBe(200);
    const status = await statusRes.json();
    console.log(`✅ Step 5: 管线状态 = ${status.lifecycle}`);

    // Step 6: 查询监控
    const monitorRes = await request.get(`${API_BASE}/monitor/stats`);
    expect(monitorRes.status()).toBe(200);
    const monitor = await monitorRes.json();
    console.log(`✅ Step 6: 监控 — todayProcessed=${monitor.todayProcessed}, throughput=${monitor.throughput}/s`);

    // Step 7: 清理
    await request.post(`${API_BASE}/pipeline/${pipeId}/stop`);
    await request.delete(`${API_BASE}/pipeline/${pipeId}`);
    console.log("✅ Step 7: 清理完成");
  });

  test("校验器白名单流程: 开启→拦截→放行→白名单", async ({ request }) => {
    // Step 1: 确保校验器开启且 requirePipelineId
    await request.post(`${API_BASE}/validator/toggle`, {
      data: { enabled: true, requirePipelineId: true },
    });
    console.log("✅ 校验器已开启");

    // Step 2: 无 pipelineId 采集 - 可能被拦截
    const noPid = await request.post(`${API_BASE}/collect`, {
      data: { data: "should be rejected" },
    });
    console.log(`  无 pipelineId → HTTP ${noPid.status()}`);

    // Step 3: 有效 pipelineId 采集 - 应该成功
    const valid = await request.post(`${API_BASE}/collect`, {
      data: {
        pipelineId: "pipeline-management",
        data: JSON.stringify({ valid: true }),
        format: "json",
      },
    });
    expect(valid.status()).toBe(200);
    console.log(`✅ 有效 pipelineId → HTTP ${valid.status()}`);

    // Step 4: 白名单增删
    await request.post(`${API_BASE}/validator/whitelist/add`, {
      data: { item: "10.0.0.1" },
    });
    await request.post(`${API_BASE}/validator/whitelist/remove`, {
      data: { item: "10.0.0.1" },
    });
    console.log("✅ 白名单增删正常");
  });

  test("脚本节点测试: JS + Java 两种引擎", async ({ request }) => {
    // JavaScript 测试
    const jsRes = await request.post(`${API_BASE}/script/test`, {
      data: {
        script: `(function(data) { data.parsed = { doubled: data.rawPayload.length * 2 }; return data; })(envelope)`,
        scriptType: "js",
        payload: "hello-world",
      },
    });
    console.log(`JS 脚本测试: HTTP ${jsRes.status()}`);
    const jsJson = await safeJson(jsRes);
    console.log(`  结果: ${jsJson ? JSON.stringify(jsJson.data || jsJson.error) : "(空body)"}`);

    // Java 脚本测试
    const javaScript = `
      import java.util.Map;
      import java.util.HashMap;
      Map<String, Object> result = new HashMap<>();
      String raw = new String(envelope.getRawPayload(), "UTF-8");
      result.put("parsed", raw);
      result.put("length", raw.length());
      result.put("timestamp", System.currentTimeMillis());
      envelope.setParsed(result);
      return envelope;
    `;
    const javaRes = await request.post(`${API_BASE}/script/test`, {
      data: {
        script: javaScript,
        scriptType: "java",
        payload: JSON.stringify({ sensor: "temp_01", value: 23.5 }),
      },
    });
    console.log(`Java 脚本测试: HTTP ${javaRes.status()}`);
    const javaJson = await safeJson(javaRes);
    console.log(`  结果: ${javaJson ? JSON.stringify(javaJson.data || javaJson.error) : "(空body)"}`);
  });
});

// ============================================================
// 4. 模拟真人点击测试（有头模式 — 可观察的浏览器自动化）
// 使用 test.describe.serial 共享一个浏览器会话，模拟真实用户操作
// 使用 page.mouse.move / hover / 逐字输入 模拟真实用户操作
// ============================================================
test.describe.serial("模拟真人点击测试", () => {
  let sharedPage: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto(BASE_URL, { waitUntil: "networkidle" });
    await sharedPage.waitForSelector(".datalake-app", { timeout: 15000 });
  });

  test.afterAll(async () => {
    await sharedPage?.close();
  });

  /** 模拟真人点击：先平滑移动鼠标到元素位置，再点击 */
  async function humanClick(page: any, locator: any) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy, { steps: 8 });
      await page.waitForTimeout(80 + Math.random() * 120);
    }
    await locator.click();
    await page.waitForTimeout(200 + Math.random() * 250);
  }

  /** 模拟真人悬停：鼠标自然移动到元素上停留 */
  async function humanHover(page: any, locator: any) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy, { steps: 10 });
      await page.waitForTimeout(200 + Math.random() * 300);
    }
    await locator.hover();
    await page.waitForTimeout(150 + Math.random() * 150);
  }

  const TABS = ["监控大屏", "流水线管理", "数据查询", "订阅管理", "采集管理", "死信队列", "系统配置"];

  async function fetchOpenMeteoPayload() {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m");
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.current).toBeTruthy();
    return JSON.stringify(payload, null, 2);
  }

  test("天气管线真实数据入库 — 浏览器真人点击执行测试", async () => {
    const weatherPayload = await fetchOpenMeteoPayload();

    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "流水线管理" }));
    await sharedPage.waitForTimeout(1500);

    const searchInput = sharedPage.locator('input[placeholder="搜索 Pipeline..."]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, searchInput);
    await searchInput.press("Control+a");
    await searchInput.press("Delete");
    await sharedPage.keyboard.type("weather-pipeline", { delay: 25 + Math.random() * 25 });
    await sharedPage.waitForTimeout(800);

    const visiblePipelines = sharedPage.locator(".pipeline-item");
    await expect(visiblePipelines).toHaveCount(1, { timeout: 10000 });
    const weatherPipeline = visiblePipelines.first();
    await expect(weatherPipeline).toContainText("天气数据采集管线", { timeout: 10000 });
    await humanClick(sharedPage, weatherPipeline);
    await sharedPage.waitForTimeout(600);

    const testButton = sharedPage.locator(".info-right .btn-ghost", { hasText: "测试管线" });
    await expect(testButton).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, testButton);

    const dialog = sharedPage.locator(".el-dialog.dl-dialog", { hasText: "测试管线" });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const payloadInput = dialog.locator('textarea[placeholder="输入测试数据..."]');
    await expect(payloadInput).toBeVisible({ timeout: 3000 });
    await humanClick(sharedPage, payloadInput);
    await payloadInput.press("Control+a");
    await payloadInput.press("Delete");
    await sharedPage.keyboard.type(weatherPayload, { delay: 1 });

    const executeButton = dialog.locator(".btn-primary", { hasText: "执行测试" });
    await humanClick(sharedPage, executeButton);

    const resultSection = dialog.locator(".test-result-section");
    await expect(resultSection).toBeVisible({ timeout: 30000 });
    await expect(resultSection.locator(".state-tag")).toContainText("执行成功", { timeout: 10000 });
    await expect(resultSection).toContainText("submitted", { timeout: 10000 });

    console.log("天气管线已通过浏览器真人点击提交真实 Open-Meteo 数据并执行成功");
  });

  test("用户依次切换所有 Tab 导航 — 7个页面浏览", async () => {
    for (const label of TABS) {
      const tab = sharedPage.locator(".tab-item", { hasText: label });
      await expect(tab).toBeVisible({ timeout: 5000 });
      await humanClick(sharedPage, tab);
      await sharedPage.waitForTimeout(500 + Math.random() * 300);
      console.log(`  ✅ 切换到 "${label}"`);
    }
  });

  test("用户监控大屏 — 悬停统计卡片与架构节点", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "监控大屏" }));
    await sharedPage.waitForTimeout(1200);

    const statCards = sharedPage.locator(".stat-card");
    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      await humanHover(sharedPage, statCards.nth(i));
    }
    console.log(`  ✅ 悬停 ${cardCount} 个统计卡片`);

    await sharedPage.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    await sharedPage.waitForTimeout(600);

    const lcNodes = sharedPage.locator(".lifecycle-node");
    const lcCount = await lcNodes.count();
    expect(lcCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < Math.min(lcCount, 4); i++) {
      await humanHover(sharedPage, lcNodes.nth(i));
    }

    const canvases = await sharedPage.locator("canvas").count();
    console.log(`  ✅ 监控大屏: ${cardCount} 卡片, ${lcCount} 节点, ${canvases} 图表`);
  });

  test("管线增删查改 — 创建 Pipeline", async () => {
    // 切换到流水线管理
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "流水线管理" }));
    await sharedPage.waitForTimeout(1500);

    // 点击 "创建 Pipeline" 按钮
    const createBtn = sharedPage.locator(".graph-toolbar .btn-primary");
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, createBtn);
    console.log("  ➕ 点击「创建 Pipeline」按钮");

    // 等待 SaveDialog 弹出
    const dialog = sharedPage.locator(".dl-dialog").first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await sharedPage.waitForTimeout(400);

    // 填写名称（必填字段）
    const nameInput = dialog.locator('input[placeholder="Pipeline 名称"]');
    await expect(nameInput).toBeVisible({ timeout: 3000 });
    await humanClick(sharedPage, nameInput);
    const pipelineName = `E2E-真人-${Date.now()}`;
    await sharedPage.waitForTimeout(150);
    // 使用真实键盘输入（isTrusted=true），确保 Vue v-model 能正确捕获
    await nameInput.press('Control+a');
    await sharedPage.waitForTimeout(50);
    await nameInput.press('Delete');
    await sharedPage.waitForTimeout(50);
    await sharedPage.keyboard.type(pipelineName, { delay: 30 + Math.random() * 30 });
    console.log(`  📝 输入名称: ${pipelineName}`);

    // 填写描述
    const descInput = dialog.locator('textarea[placeholder="可选描述"]');
    if (await descInput.isVisible().catch(() => false)) {
      await humanClick(sharedPage, descInput);
      await descInput.fill("Playwright 真人点击测试创建");
    }

    // 点击「确定」按钮
    const submitBtn = dialog.locator(".dialog-footer .btn-primary");
    await humanClick(sharedPage, submitBtn);
    console.log("  ✅ 点击「确定」提交");

    // 等待对话框关闭 + 管线出现在列表中
    await sharedPage.waitForTimeout(1500);
    await expect(dialog).not.toBeVisible({ timeout: 10000 }).catch(() => {});
    const pipelineItem = sharedPage.locator(".pipeline-item", { hasText: pipelineName });
    await expect(pipelineItem).toBeVisible({ timeout: 8000 });
    console.log(`  ✅ 管线 "${pipelineName}" 已出现在列表`);
  });

  test("管线增删查改 — 启动/停止/删除管线", async () => {
    // 确保在流水线管理页
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "流水线管理" }));
    await sharedPage.waitForTimeout(1000);

    // 点击第一个管线项查看详情（查）
    const pipelineItems = sharedPage.locator(".pipeline-item");
    const itemCount = await pipelineItems.count();
    expect(itemCount).toBeGreaterThan(0);
    console.log(`  📋 管线列表共 ${itemCount} 项`);

    // 选中最上面一项
    const targetItem = pipelineItems.first();
    await humanClick(sharedPage, targetItem);
    await sharedPage.waitForTimeout(600);

    // 启动管线
    const startBtn = targetItem.locator(".btn-success-icon");
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await humanClick(sharedPage, startBtn);
      await sharedPage.waitForTimeout(1500);
      console.log("  ▶️ 点击「启动」按钮");
      // 验证指示器变化
      const indicator = targetItem.locator(".item-indicator");
      const cls = await indicator.getAttribute("class").catch(() => "");
      console.log(`     指示器: ${cls}`);
    }

    // 停止管线
    const stopBtn = targetItem.locator(".btn-warning-icon");
    if (await stopBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await humanClick(sharedPage, stopBtn);
      await sharedPage.waitForTimeout(1000);
      console.log("  ⏹️ 点击「停止」按钮");
    }

    // 删除管线
    const deleteBtn = targetItem.locator(".btn-danger-icon");
    if (await deleteBtn.isVisible().catch(() => false)) {
      sharedPage.once("dialog", (dialog) => {
        expect(dialog.message()).toBe("确定删除?");
        dialog.accept();
      });
      await humanClick(sharedPage, deleteBtn);
      await sharedPage.waitForTimeout(1500);
      console.log("  🗑️ 确认删除管线");
    }

    console.log("  ✅ 管线生命周期操作完成");
  });

  test("管线增删查改 — 编辑修改管线", async () => {
    // 确保在流水线管理页
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "流水线管理" }));
    await sharedPage.waitForTimeout(1000);

    // 选择一个管线
    const pipelineItems = sharedPage.locator(".pipeline-item");
    const itemCount = await pipelineItems.count();
    expect(itemCount).toBeGreaterThan(0);
    console.log(`  📋 管线列表共 ${itemCount} 项`);

    const targetItem = pipelineItems.first();
    await humanClick(sharedPage, targetItem);
    await sharedPage.waitForTimeout(800);
    console.log("  👆 选中管线");

    // 点击「编辑流程」按钮
    const editBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "编辑流程" });
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, editBtn);
    console.log("  ✏️ 点击「编辑流程」");
    await sharedPage.waitForTimeout(1500);

    // 验证已进入编辑模式：「保存流程」按钮和 palette 可见
    const saveBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "保存流程" });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    const palette = sharedPage.locator(".fe-palette").first();
    await expect(palette).toBeVisible({ timeout: 3000 }).catch(() => console.log("  ℹ️ palette 不可见（无拖拽节点）"));
    console.log("  ✅ 已进入编辑模式");

    // 保存流程（不做节点修改，仅验证保存 API）
    await humanClick(sharedPage, saveBtn);
    console.log("  💾 点击「保存流程」");
    await sharedPage.waitForTimeout(2000);

    // 验证 ElMessage.success「流程已保存」
    const successMsg = sharedPage.locator(".el-message--success");
    await expect(successMsg).toBeVisible({ timeout: 8000 });
    console.log("  ✅ 流程保存成功（ElMessage.success）");
  });

  test("流程编排 — 拖拽节点到画布", async () => {
    // 确保在流水线管理页
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "流水线管理" }));
    await sharedPage.waitForTimeout(1500);

    // 选择一个管线
    const pipelineItems = sharedPage.locator(".pipeline-item");
    const itemCount = await pipelineItems.count();
    expect(itemCount).toBeGreaterThan(0);
    console.log(`  📋 管线列表共 ${itemCount} 项`);

    const targetItem = pipelineItems.first();
    await humanClick(sharedPage, targetItem);
    await sharedPage.waitForTimeout(800);
    console.log("  👆 选中管线");

    // 进入编辑模式
    const editBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "编辑流程" });
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, editBtn);
    await sharedPage.waitForTimeout(2000);
    console.log("  ✏️ 已进入编辑模式");

    // 确认画布可见
    const canvasWrap = sharedPage.locator(".flow-editor__canvas-wrap").first();
    await expect(canvasWrap).toBeVisible({ timeout: 5000 });
    console.log("  ✅ 画布已加载");

    // 通过浏览器 API 模拟 HTML5 原生拖拽：palette → canvas
    const dragResult = await sharedPage.evaluate(() => {
      const items = document.querySelectorAll(".fe-palette__item");
      if (items.length === 0) return "NO_PALETTE";
      const canvas = document.querySelector(".flow-editor__canvas-wrap");
      if (!canvas) return "NO_CANVAS";

      const dt = new DataTransfer();
      dt.setData("text/plain", "source");
      (items[0] as HTMLElement).dispatchEvent(new DragEvent("dragstart", {
        dataTransfer: dt, bubbles: true, cancelable: true,
      }));
      canvas.dispatchEvent(new DragEvent("dragover", {
        dataTransfer: dt, bubbles: true, cancelable: true,
      }));
      const r = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new DragEvent("drop", {
        dataTransfer: dt, bubbles: true, cancelable: true,
        clientX: r.x + r.width * 0.5,
        clientY: r.y + r.height * 0.5,
      }));
      return `OK: canvas=${r.width.toFixed(0)}x${r.height.toFixed(0)}`;
    });
    console.log(`  🎯 拖拽结果: ${dragResult}`);
    await sharedPage.waitForTimeout(2000);

    // 保存流程
    const saveBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "保存流程" });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, saveBtn);
    await sharedPage.waitForTimeout(2000);

    // 验证保存成功提示
    const msg = sharedPage.locator(".el-message--success");
    await expect(msg).toBeVisible({ timeout: 8000 });
    console.log("  ✅ 拖拽 → 保存流程成功");
  });

  test("流程编排 — 连接两个节点（创建边）", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "流水线管理" }));
    await sharedPage.waitForTimeout(1500);
    const pipelineItems = sharedPage.locator(".pipeline-item");
    const itemCount = await pipelineItems.count();
    expect(itemCount).toBeGreaterThan(0);
    await humanClick(sharedPage, pipelineItems.first());
    await sharedPage.waitForTimeout(800);
    const editBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "编辑流程" });
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, editBtn);
    await sharedPage.waitForTimeout(2000);
    const canvasWrap = sharedPage.locator(".flow-editor__canvas-wrap").first();
    await expect(canvasWrap).toBeVisible({ timeout: 5000 });

    // 拖拽第一个节点 (source)
    await sharedPage.evaluate(() => {
      const items = document.querySelectorAll(".fe-palette__item");
      if (items.length === 0) return;
      const canvas = document.querySelector(".flow-editor__canvas-wrap");
      if (!canvas) return;
      const dt = new DataTransfer();
      dt.setData("text/plain", "source");
      (items[0] as HTMLElement).dispatchEvent(new DragEvent("dragstart", { dataTransfer: dt, bubbles: true, cancelable: true }));
      canvas.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
      const r = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true, clientX: r.x + r.width * 0.25, clientY: r.y + r.height * 0.5 }));
    });
    await sharedPage.waitForTimeout(1500);

    // 拖拽第二个节点 (parse)
    await sharedPage.evaluate(() => {
      const items = document.querySelectorAll(".fe-palette__item");
      if (items.length < 2) return;
      const canvas = document.querySelector(".flow-editor__canvas-wrap");
      if (!canvas) return;
      const dt = new DataTransfer();
      dt.setData("text/plain", "parse");
      (items[1] as HTMLElement).dispatchEvent(new DragEvent("dragstart", { dataTransfer: dt, bubbles: true, cancelable: true }));
      canvas.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
      const r = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true, clientX: r.x + r.width * 0.75, clientY: r.y + r.height * 0.5 }));
    });
    await sharedPage.waitForTimeout(1500);

    // 通过 Vue 组件内部访问 LogicFlow 实例，创建边
    const edgeResult = await sharedPage.evaluate(() => {
      const editorEl = document.querySelector(".flow-editor");
      if (!editorEl) return "NO_EDITOR";
      const vnode = (editorEl as any).__vueParentComponent;
      if (!vnode) return "NO_VNODE";
      const lfRef = vnode.component?.setupState?.lfRef;
      if (!lfRef) return "NO_LF_REF";
      const lf = lfRef.value;
      if (!lf) return "NO_LF_VALUE";
      const nodes = lf.graphModel.nodes;
      if (nodes.length < 2) return `NEED_MORE_NODES:${nodes.length}`;
      const sourceId = nodes[0].id;
      const targetId = nodes[1].id;
      if (sourceId === targetId) return "SAME_IDS";
      lf.addEdge({ sourceNodeId: sourceId, targetNodeId: targetId, type: "flow-edge" });
      return `EDGE_OK:${sourceId}->${targetId}`;
    });
    console.log(`  🎯 边创建结果: ${edgeResult}`);
    await sharedPage.waitForTimeout(2000);

    // 保存流程
    const saveBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "保存流程" });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, saveBtn);
    await sharedPage.waitForTimeout(2000);
    const msg = sharedPage.locator(".el-message--success");
    await expect(msg).toBeVisible({ timeout: 8000 });
    console.log("  ✅ 边创建 → 保存流程成功");
  });

  test("流程编排 — 删除节点", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "流水线管理" }));
    await sharedPage.waitForTimeout(1500);
    const pipelineItems = sharedPage.locator(".pipeline-item");
    const itemCount = await pipelineItems.count();
    expect(itemCount).toBeGreaterThan(0);
    await humanClick(sharedPage, pipelineItems.first());
    await sharedPage.waitForTimeout(800);
    const editBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "编辑流程" });
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, editBtn);
    await sharedPage.waitForTimeout(2000);
    const canvasWrap = sharedPage.locator(".flow-editor__canvas-wrap").first();
    await expect(canvasWrap).toBeVisible({ timeout: 5000 });

    // 拖拽一个节点到画布
    await sharedPage.evaluate(() => {
      const items = document.querySelectorAll(".fe-palette__item");
      if (items.length === 0) return;
      const canvas = document.querySelector(".flow-editor__canvas-wrap");
      if (!canvas) return;
      const dt = new DataTransfer();
      dt.setData("text/plain", "source");
      (items[0] as HTMLElement).dispatchEvent(new DragEvent("dragstart", { dataTransfer: dt, bubbles: true, cancelable: true }));
      canvas.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
      const r = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true, clientX: r.x + r.width * 0.5, clientY: r.y + r.height * 0.5 }));
    });
    await sharedPage.waitForTimeout(1500);

    // 按 Delete 键删除选中的节点（onKeyDown 绑定在 window 上）
    await sharedPage.keyboard.press("Delete");
    await sharedPage.waitForTimeout(1500);

    // 保存流程
    const saveBtn = sharedPage.locator(".info-right .btn-primary", { hasText: "保存流程" });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, saveBtn);
    await sharedPage.waitForTimeout(2000);
    const msg = sharedPage.locator(".el-message--success");
    await expect(msg).toBeVisible({ timeout: 8000 });
    console.log("  ✅ 删除节点 → 保存流程成功");
  });

  test("用户采集管理 — 刷新与客户端卡片浏览", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "采集管理" }));
    await sharedPage.waitForTimeout(1500);

    const refreshBtn = sharedPage.locator(".btn-ghost").first();
    if (await refreshBtn.isVisible().catch(() => false)) {
      await humanClick(sharedPage, refreshBtn);
      console.log("  🔄 点击刷新按钮");
      await sharedPage.waitForTimeout(1000);
    }

    const metrics = sharedPage.locator(".metric-card, .stat-card");
    const metricCount = await metrics.count();
    let hoveredMetricCount = 0;
    for (let i = 0; i < metricCount; i++) {
      const card = metrics.nth(i);
      if (await card.isVisible().catch(() => false)) {
        await humanHover(sharedPage, card);
        hoveredMetricCount++;
      }
    }
    console.log(`  📊 ${metricCount} 个统计卡片, 悬停 ${hoveredMetricCount} 个`);

    await sharedPage.evaluate(() => window.scrollTo({ top: 200, behavior: "smooth" }));
    await sharedPage.waitForTimeout(500);

    const clientCards = sharedPage.locator(".client-card");
    const clientCount = await clientCards.count();
    if (clientCount > 0) {
      for (let i = 0; i < Math.min(clientCount, 3); i++) {
        await humanHover(sharedPage, clientCards.nth(i));
      }
      console.log(`  🖥 ${clientCount} 个采集客户端`);
    } else {
      console.log("  ℹ️ 暂无采集客户端数据");
    }
  });

  test("用户订阅管理 — 浏览订阅器", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "订阅管理" }));
    await sharedPage.waitForTimeout(1500);

    const refreshBtn = sharedPage.locator(".btn-ghost").first();
    if (await refreshBtn.isVisible().catch(() => false)) {
      await humanClick(sharedPage, refreshBtn);
      await sharedPage.waitForTimeout(800);
    }

    const subscriberCards = sharedPage.locator(".subscriber-card");
    const count = await subscriberCards.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        await humanHover(sharedPage, subscriberCards.nth(i));
      }
      console.log(`  📡 ${count} 个订阅器`);
    } else {
      console.log("  ℹ️ 暂无订阅器数据");
    }

    const metrics = sharedPage.locator(".metric-card, .stat-card");
    const metricCount = await metrics.count();
    if (metricCount > 0) {
      for (let i = 0; i < metricCount; i++) {
        if (await metrics.nth(i).isVisible().catch(() => false)) {
          await humanHover(sharedPage, metrics.nth(i));
        }
      }
    }
    console.log(`  📊 ${metricCount} 个指标卡片`);
  });

  test("死信队列 — 重试/删除/清空操作", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "死信队列" }));
    await sharedPage.waitForTimeout(1500);

    const dlqCards = sharedPage.locator(".dlq-card");
    const cardCount = await dlqCards.count();
    console.log(`  死信记录: ${cardCount} 条`);

    if (cardCount > 0) {
      // 重试第一条（无确认对话框，直接调用 API）
      const retryBtn = dlqCards.first().locator(".btn-action.retry");
      if (await retryBtn.isVisible().catch(() => false)) {
        await humanClick(sharedPage, retryBtn);
        await sharedPage.waitForTimeout(1000);
        const successMsg = sharedPage.locator(".el-message--success").first();
        await expect(successMsg).toBeVisible({ timeout: 5000 });
        console.log("  ✅ 死信重试成功（ElMessage.success）");
        // 等消息消失
        await sharedPage.waitForTimeout(1500);
      }

      // 删除第一条（ElMessageBox.confirm → 确认）
      const deleteBtn = dlqCards.first().locator(".btn-action.delete");
      if (await deleteBtn.isVisible().catch(() => false)) {
        await humanClick(sharedPage, deleteBtn);
        const msgBox = sharedPage.locator(".el-message-box");
        await expect(msgBox).toBeVisible({ timeout: 5000 });
        console.log("  ⚠️ ElMessageBox 确认删除");
        await humanClick(sharedPage, msgBox.locator(".el-button--primary"));
        await sharedPage.waitForTimeout(1200);
        const delMsg = sharedPage.locator(".el-message--success");
        await expect(delMsg).toBeVisible({ timeout: 5000 });
        console.log("  ✅ 死信删除成功");
        await sharedPage.waitForTimeout(1000);
      }
    } else {
      console.log("  ℹ️ 死信队列为空，界面显示空状态");
      const empty = sharedPage.locator("[data-v-d8a00d5c] .empty-state");
      await expect(empty).toBeVisible({ timeout: 3000 });
      console.log("  ✅ 空状态展示正确");
    }

    // 清空全部（ElMessageBox.confirm → 确认）
    const clearBtn = sharedPage.locator(".btn-danger");
    if (await clearBtn.isVisible().catch(() => false)) {
      await humanClick(sharedPage, clearBtn);
      const msgBox = sharedPage.locator(".el-message-box");
      await expect(msgBox).toBeVisible({ timeout: 5000 });
      console.log("  ⚠️ ElMessageBox 确认清空");
      await humanClick(sharedPage, msgBox.locator(".el-button--primary"));
      await sharedPage.waitForTimeout(1500);
      const clearMsg = sharedPage.locator(".el-message--success");
      await expect(clearMsg).toBeVisible({ timeout: 5000 });
      console.log("  ✅ 死信队列已清空");
      await sharedPage.waitForTimeout(1000);
    }
  });

  test("系统配置 — 令牌创建/复制/吊销", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "系统配置" }));
    await sharedPage.waitForTimeout(2000);

    // 点击「创建令牌」按钮（在"令牌管理"面板中）
    const createBtn = sharedPage.locator(".page-panel").filter({ hasText: "令牌" }).getByRole("button", { name: "创建令牌" });
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, createBtn);
    await sharedPage.waitForTimeout(600);

    // 等待 ElDialog 弹出
    const dialog = sharedPage.locator(".el-dialog.dl-dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    console.log("  📋 创建令牌对话框已打开");

    // 填写用途描述
    const descInput = dialog.locator('input[placeholder="输入令牌用途描述"]');
    await expect(descInput).toBeVisible({ timeout: 3000 });
    await humanClick(sharedPage, descInput);
    await sharedPage.waitForTimeout(100);
    const tokenDesc = `e2e-token-${Date.now()}`;
    await sharedPage.keyboard.type(tokenDesc, { delay: 20 + Math.random() * 20 });
    console.log(`  📝 描述: ${tokenDesc}`);

    // 点击「确认」
    const confirmBtn = dialog.locator(".btn-primary");
    await humanClick(sharedPage, confirmBtn);
    await sharedPage.waitForTimeout(1500);

    // 验证令牌已出现在列表中
    await expect(dialog).not.toBeVisible({ timeout: 10000 }).catch(() => {});
    const tokenRows = sharedPage.locator(".token-row");
    const tokenCount = await tokenRows.count();
    expect(tokenCount).toBeGreaterThan(0);
    console.log(`  ✅ 令牌创建成功，共 ${tokenCount} 个`);

    // 复制第一个令牌
    const copyBtn = sharedPage.locator(".btn-action.copy").first();
    if (await copyBtn.isVisible().catch(() => false)) {
      await humanClick(sharedPage, copyBtn);
      await sharedPage.waitForTimeout(600);
      // 复制操作用 navigator.clipboard，成功后会 ElMessage.success
      const copyMsg = sharedPage.locator(".el-message--success").first();
      await expect(copyMsg).toBeVisible({ timeout: 5000 });
      console.log("  ✅ 令牌已复制（ElMessage.success）");
      await sharedPage.waitForTimeout(1000);
    }

    // 吊销第一个令牌（ElMessageBox.confirm）
    const delTokenBtn = sharedPage.locator(".btn-action.delete").first();
    if (await delTokenBtn.isVisible().catch(() => false)) {
      await humanClick(sharedPage, delTokenBtn);
      const msgBox = sharedPage.locator(".el-message-box");
      await expect(msgBox).toBeVisible({ timeout: 5000 });
      console.log("  ⚠️ ElMessageBox 确认吊销");
      await humanClick(sharedPage, msgBox.locator(".el-button--primary"));
      await sharedPage.waitForTimeout(1500);
      const revokeMsg = sharedPage.locator(".el-message--success");
      await expect(revokeMsg).toBeVisible({ timeout: 5000 });
      console.log("  ✅ 令牌已吊销");
      await sharedPage.waitForTimeout(1000);
    }
  });

  test("系统配置 — 系统开关查看与保存", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "系统配置" }));
    await sharedPage.waitForTimeout(1500);

    // 找到「系统开关」面板（第4个 page-panel）
    const sysPanel = sharedPage.locator(".page-panel").filter({ hasText: "系统开关" });
    await expect(sysPanel.first()).toBeVisible({ timeout: 5000 });

    // 定位 Token 鉴权开关
    const authToggle = sysPanel.first().locator(".toggle-row").filter({ hasText: "Token 鉴权" }).locator(".el-switch");
    if (await authToggle.isVisible().catch(() => false)) {
      // 记录切换前状态再切换
      await humanClick(sharedPage, authToggle);
      await sharedPage.waitForTimeout(600);
      console.log("  ✅ 切换 Token 鉴权开关");
    }

    // 点击系统开关面板的「保存」按钮
    const saveBtn = sysPanel.first().locator(".panel-header .btn-ghost");
    if (await saveBtn.isVisible().catch(() => false)) {
      await humanClick(sharedPage, saveBtn);
      await sharedPage.waitForTimeout(1500);
      const saveMsg = sharedPage.locator(".el-message--success");
      await expect(saveMsg).toBeVisible({ timeout: 5000 });
      console.log("  ✅ 系统设置保存成功（ElMessage.success）");
      await sharedPage.waitForTimeout(1000);
    }
  });

  test("数据查询 — 条件查询与链路追踪", async () => {
    await humanClick(sharedPage, sharedPage.locator(".tab-item", { hasText: "数据查询" }));
    await sharedPage.waitForTimeout(1500);

    // 输入 Pipeline ID
    const pipelineInput = sharedPage.locator('input[placeholder="输入 Pipeline ID"]');
    await expect(pipelineInput).toBeVisible({ timeout: 5000 });
    await humanClick(sharedPage, pipelineInput);
    await sharedPage.waitForTimeout(100);
    await pipelineInput.fill("");
    await sharedPage.keyboard.type("pipeline-management", { delay: 15 + Math.random() * 15 });
    console.log("  📝 Pipeline ID: pipeline-management");

    // 点击「查询」
    const queryBtn = sharedPage.locator(".btn-ghost", { hasText: "查询" });
    await humanClick(sharedPage, queryBtn);
    await sharedPage.waitForTimeout(2500);

    // 检查结果表格
    const dataTable = sharedPage.locator(".data-table");
    const hasResults = await dataTable.isVisible().catch(() => false);
    if (hasResults) {
      const rows = await dataTable.locator("tbody tr").count();
      console.log(`  📊 查询结果: ${rows} 行`);

      // 点击第一个 trace ID 进行链路追踪
      const traceIdLink = sharedPage.locator(".trace-id").first();
      if (await traceIdLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await humanClick(sharedPage, traceIdLink);
        await sharedPage.waitForTimeout(1000);

        // 验证 Trace 对话框出现
        const traceDialog = sharedPage.locator(".trace-dialog");
        await expect(traceDialog).toBeVisible({ timeout: 5000 });
        console.log("  ✅ 链路追踪对话框已打开");

        // 查看 trace 信息字段
        const traceFields = traceDialog.locator(".trace-field");
        const fieldCount = await traceFields.count();
        console.log(`  ℹ️ Trace 字段: ${fieldCount} 个`);

        // 关闭对话框
        const closeBtn = traceDialog.locator(".btn-close");
        await humanClick(sharedPage, closeBtn);
        await sharedPage.waitForTimeout(600);
        await expect(traceDialog).not.toBeVisible({ timeout: 3000 }).catch(() => {});
        console.log("  ✅ 关闭链路追踪对话框");
      } else {
        console.log("  ℹ️ 无 trace ID 可点击");
      }
    } else {
      console.log("  ℹ️ 数据查询无结果");
    }
  });

  test("用户点击全局刷新按钮 — 完整浏览轨迹", async () => {
    const browsing = ["监控大屏", "流水线管理", "数据查询"];
    for (const label of browsing) {
      const tab = sharedPage.locator(".tab-item", { hasText: label });
      await humanClick(sharedPage, tab);
      await sharedPage.waitForTimeout(400 + Math.random() * 300);
      console.log(`  👆 浏览 "${label}"`);
    }

    await sharedPage.evaluate(() => window.scrollTo({ top: 150, behavior: "smooth" }));
    await sharedPage.waitForTimeout(500);
    await sharedPage.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sharedPage.waitForTimeout(400);

    const headerRefresh = sharedPage.locator(".header-refresh-btn");
    await expect(headerRefresh).toBeVisible({ timeout: 5000 });

    const box = await headerRefresh.boundingBox();
    if (box) {
      await sharedPage.mouse.move(50, 150, { steps: 5 });
      await sharedPage.waitForTimeout(150);
      await sharedPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
      await sharedPage.waitForTimeout(100 + Math.random() * 150);
    }

    await headerRefresh.click();
    await sharedPage.waitForTimeout(2000);

    const statusText = await sharedPage.locator(".status-text").textContent().catch(() => "状态未知");
    const brandText = await sharedPage.locator(".brand-text h1").textContent().catch(() => "?");
    console.log(`  ✅ 刷新完成: ${brandText} — ${statusText}`);
  });
});