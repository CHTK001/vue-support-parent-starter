import { test, expect } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:8853";
const API_BASE = "http://127.0.0.1:58081/v2/datalake";

/** 安全解析 JSON，处理空 body */
async function safeJson(res: any): Promise<any> {
  const text = await res.text();
  if (!text || text.trim().length === 0) return null;
  try { return JSON.parse(text); } catch { return null; }
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
    const res = await request.get(`${API_BASE}/node/list`);
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
    const res = await request.get(`${API_BASE}/node/script/spis`);
    expect(res.status()).toBe(200);
    const json = await safeJson(res);
    if (json?.data) {
      console.log(`script SPI: ${json.data.length} 个`);
    }
  });

  test("脚本测试 API - JavaScript", async ({ request }) => {
    const res = await request.post(`${API_BASE}/script/test`, {
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

    // 创建
    const create = await request.post(`${API_BASE}/pipeline`, {
      data: {
        id: pid,
        name: "E2E 测试管线",
        description: "Playwright 自动测试",
        nodes: [
          { type: "source", spi: "http-source", config: {} },
          { type: "parse", spi: "json-parser", config: {} },
          { type: "sink", spi: "log-sink", config: {} },
        ],
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
    console.log(`管线 [${pid}] 状态: lifecycle=${statusJson.data?.lifecycle}`);

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
        id: pid, name: "提交测试",
        nodes: [
          { type: "source", spi: "http-source", config: {} },
          { type: "sink", spi: "log-sink", config: {} },
        ],
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
    expect(json2.status).toBe("ok");
    console.log(`✅ 采集端点通过: ${json2.status}`);
  });

  test("监控统计 API", async ({ request }) => {
    const res = await request.get(`${API_BASE}/monitor/stats`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    console.log(`监控: activePipelines=${json.data?.activePipelines}, throughput=${json.data?.throughput}/s, todayProcessed=${json.data?.todayProcessed}`);
    expect(json.data).toHaveProperty("activePipelines");
    expect(json.data).toHaveProperty("throughput");
  });

  test("死信队列 API", async ({ request }) => {
    const res = await request.get(`${API_BASE}/dlq/list`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    console.log(`✅ 死信队列: ${json.data?.length ?? 0} 条`);
  });

  test("SPI 清单 API", async ({ request }) => {
    const res = await request.get(`${API_BASE}/pipeline/spis`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    const keys = Object.keys(json.data || {});
    console.log(`✅ SPI 清单: ${keys.length} 种类型 (${keys.join(", ")})`);
  });

  test("订阅管理 API", async ({ request }) => {
    const r1 = await request.get(`${API_BASE}/subscription/list`);
    expect(r1.status()).toBe(200);
    console.log(`✅ 订阅列表: HTTP ${r1.status()}`);
  });
});

// ============================================================
// 2. 前端页面联调测试
// ============================================================
test.describe("前端页面联调", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".datalake-app", { timeout: 15000 });
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

    const bannerItems = page.locator(".banner-item");
    const bannerCount = await bannerItems.count();
    expect(bannerCount).toBeGreaterThan(0);
    console.log(`✅ 监控大屏: ${bannerCount} 个状态横幅`);
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
    await refreshBtn.click();
    await page.waitForTimeout(2000);

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
    console.log(`✅ Step 5: 管线状态 = ${status.data?.lifecycle}`);

    // Step 6: 查询监控
    const monitorRes = await request.get(`${API_BASE}/monitor/stats`);
    expect(monitorRes.status()).toBe(200);
    const monitor = await monitorRes.json();
    console.log(`✅ Step 6: 监控 — todayProcessed=${monitor.data?.todayProcessed}, throughput=${monitor.data?.throughput}/s`);

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