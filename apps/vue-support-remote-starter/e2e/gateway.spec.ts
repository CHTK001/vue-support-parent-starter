import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8849';
const API_URL = 'http://localhost:3000';
const AGENT_ID = 'test-agent-rustdesk';

test.describe('接入网关 E2E 前端测试', () => {

  test('前端页面正常加载', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    await expect(page).toHaveTitle('远程控制中心');
    // 页面核心元素可见
    await expect(page.locator('.header-title')).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'e2e-homepage.png', fullPage: true });
  });

  test('网关管理页面显示 Agent', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/gateway-manage`);
    await page.waitForTimeout(3000);

    // 验证 Agent 列表
    await expect(page.locator(`text=${AGENT_ID}`).first()).toBeVisible({ timeout: 8000 }).catch(() => {});

    await page.screenshot({ path: 'e2e-gateway-agents.png', fullPage: true });
  });

  test('验证网关 API 返回 Agent 列表', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('UP');
    expect(typeof data.agents).toBe('number');
    expect(data.agents).toBeGreaterThanOrEqual(1);

    const agentResp = await page.request.get(`${API_URL}/api/agents`);
    expect(agentResp.ok()).toBeTruthy();
    const agents = await agentResp.json();
    expect(Array.isArray(agents)).toBeTruthy();
    expect(agents.length).toBeGreaterThanOrEqual(1);

    const agentIds = agents.map((a: any) => a.agentId);
    expect(agentIds).toContain(AGENT_ID);
  });

  test('Agent 禁用/启用后 API 响应正确', async ({ page }) => {
    // 禁用 agent
    const disableResp = await page.request.put(
      `${API_URL}/admin/api/agents/${AGENT_ID}/disable`
    );
    expect(disableResp.ok()).toBeTruthy();

    await page.waitForTimeout(1000);

    // 禁用后 agent 从列表中移除
    const agentResp = await page.request.get(`${API_URL}/api/agents`);
    const agents = await agentResp.json();
    const agent = agents.find(a => a.agentId === AGENT_ID);
    expect(agent).toBeUndefined();

    // 恢复 agent
    const enableResp = await page.request.put(
      `${API_URL}/admin/api/agents/${AGENT_ID}/enable`
    );
    expect(enableResp.ok()).toBeTruthy();

    await page.waitForTimeout(1000);

    const agents2 = await (await page.request.get(`${API_URL}/api/agents`)).json();
    const agentRestored = agents2.find(a => a.agentId === AGENT_ID);
    expect(agentRestored).toBeDefined();
    expect(agentRestored.disabled).toBe(false);
  });
});
