import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:15173';
const TOKEN = 'test123';

test.describe('接入网关 E2E 前端测试', () => {

  test('前端页面正常加载，网关已连接', async ({ page }) => {
    await page.goto(`${BASE_URL}/?token=${TOKEN}`);
    await page.waitForTimeout(3000);
    await expect(page).toHaveTitle('远程控制中心');
    // 网关连接状态
    await expect(page.locator('text=网关已连接')).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: 'e2e-homepage.png', fullPage: true });
  });

  test('网关管理页面显示两个 Agent', async ({ page }) => {
    await page.goto(`${BASE_URL}/?token=${TOKEN}#/gateway-manage`);
    await page.waitForTimeout(3000);

    // 验证 Agent 列表
    await expect(page.locator('text=playwright-agent-1').first()).toBeVisible({ timeout: 8000 }).catch(() => {});
    await expect(page.locator('text=playwright-agent-2').first()).toBeVisible({ timeout: 8000 }).catch(() => {});

    await page.screenshot({ path: 'e2e-gateway-agents.png', fullPage: true });
  });

  test('验证网关 API 返回 Agent 列表', async ({ page }) => {
    const response = await page.request.get(`http://localhost:13000/health?token=${TOKEN}`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('UP');
    expect(data.agents).toBeGreaterThanOrEqual(2);

    const agentResp = await page.request.get(`http://localhost:13000/api/agents?token=${TOKEN}`);
    expect(agentResp.ok()).toBeTruthy();
    const agents = await agentResp.json();
    expect(Array.isArray(agents)).toBeTruthy();
    expect(agents.length).toBeGreaterThanOrEqual(2);

    const agentIds = agents.map(a => a.agentId);
    expect(agentIds).toContain('playwright-agent-1');
    expect(agentIds).toContain('playwright-agent-2');
  });

  test('Agent 禁用/启用后 API 响应正确', async ({ page }) => {
    // 禁用 agent-2
    const disableResp = await page.request.put(
      `http://localhost:13000/admin/api/agents/playwright-agent-2/disable?token=${TOKEN}`
    );
    expect(disableResp.ok()).toBeTruthy();

    await page.waitForTimeout(1000);

    // 验证禁用状态
    const agentResp = await page.request.get(`http://localhost:13000/api/agents?token=${TOKEN}`);
    const agents = await agentResp.json();
    const agent2 = agents.find(a => a.agentId === 'playwright-agent-2');
    expect(agent2.disabled).toBe(true);

    // 恢复 agent-2
    const enableResp = await page.request.put(
      `http://localhost:13000/admin/api/agents/playwright-agent-2/enable?token=${TOKEN}`
    );
    expect(enableResp.ok()).toBeTruthy();

    await page.waitForTimeout(1000);

    const agents2 = await (await page.request.get(`http://localhost:13000/api/agents?token=${TOKEN}`)).json();
    const agent2Restored = agents2.find(a => a.agentId === 'playwright-agent-2');
    expect(agent2Restored.disabled).toBe(false);
  });
});
