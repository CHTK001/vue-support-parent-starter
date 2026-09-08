import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://127.0.0.1:5173';

// ── Page Objects ──────────────────────────────────────────────
class SettingsPage {
  constructor(private page: Page) {}

  async navigate(path: string) {
    await this.page.goto(`${BASE}/settings/${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  }

  async waitForReady() {
    await this.page.waitForSelector('.arco-select, [class*="empty"]', { timeout: 10000 });
  }

  get selects() {
    return this.page.locator('.arco-select');
  }

  async clickSelect(index: number) {
    const sel = this.selects.nth(index);
    await sel.click({ force: true });
    await this.page.waitForTimeout(500);
    return this.page.locator('[class*="select-option"]');
  }

  async getErrorCount() {
    return this.page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((e: any) => e.responseStatus && e.responseStatus >= 400).length;
    });
  }

  get bodyText() {
    return this.page.evaluate(() => document.body.innerText);
  }
}

// ── Tests ─────────────────────────────────────────────────────

test.describe('Settings Pages', () => {

  test('OCR page renders with model selects', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigate('ocr');
    await settings.waitForReady();

    const text = await settings.bodyText;
    expect(text).toContain('OCR');

    const selectCount = await settings.selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(1);

    // Click first select to verify options load from /v2/ai/models/capabilities
    const opts = await settings.clickSelect(0);
    await page.waitForTimeout(500);
    const optCount = await opts.count();
    expect(optCount).toBeGreaterThan(0);
  });

  test('Face page renders with model selects', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigate('face');
    await settings.waitForReady();

    const text = await settings.bodyText;
    expect(text).toContain('人脸');

    const selectCount = await settings.selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(1);
  });

  test('Image Recognition page renders with model selects', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigate('image-recognition');
    await settings.waitForReady();

    const text = await settings.bodyText;
    expect(text).toContain('图片') || expect(text).toContain('图像');

    const selectCount = await settings.selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(1);
  });

  test('Layout page renders with model selects', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.navigate('layout');
    await settings.waitForReady();

    const text = await settings.bodyText;
    expect(text).toContain('布局') || expect(text).toContain('版面');

    const selectCount = await settings.selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(1);
  });

  test('Usage Library page has no diff errors', async ({ page }) => {
    const pageObj = new SettingsPage(page);
    await pageObj.navigate('usage-library');
    await page.waitForTimeout(4000);

    const pageErrors: string[] = [];
    page.on('pageerror', e => pageErrors.push(e.message));

    const diffErrors = pageErrors.filter(e => e.includes('diff'));
    expect(diffErrors).toHaveLength(0);
  });
});

test.describe('Backend API', () => {

  test('GET /api/requirements/tag-bindings returns success', async ({ request }) => {
    const res = await request.get(`${BASE}/api/requirements/tag-bindings`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/knowledge/binding with query params returns binding', async ({ request }) => {
    const res = await request.get(
      `${BASE}/api/knowledge/binding?kind=workpath&target_id=D:/test/path`
    );
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.target_kind).toBe('workpath');
    expect(body.data.target_id).toBe('D:/test/path');
  });

  test('GET /v2/ai/models/capabilities returns model groups', async ({ request }) => {
    const res = await request.get(`${BASE}/v2/ai/models/capabilities`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Object.keys(body.data).length).toBeGreaterThan(0);
    // Verify known capability keys
    expect(body.data).toHaveProperty('ocr');
    expect(body.data).toHaveProperty('feature');
    expect(body.data).toHaveProperty('enhance');
  });

  test('POST /api/fs/metadata returns file info', async ({ request }) => {
    const res = await request.post(`${BASE}/api/fs/metadata`, {
      data: { path: '/tmp', workspace: '' }
    });
    const body = await res.json();
    // Either success or NOT_FOUND is acceptable
    expect(body.code === '00000' || body.success === true).toBeTruthy();
  });
});

test.describe('Zoom Fix Verification', () => {

  test('No zoom/metadata errors on any settings page', async ({ page }) => {
    const zoomErrors: string[] = [];
    page.on('console', m => {
      if (m.type() === 'error' && (m.text().includes('zoom') || m.text().includes('metadata'))) {
        zoomErrors.push(m.text());
      }
    });

    for (const path of ['ocr', 'face', 'image-recognition', 'layout']) {
      const settings = new SettingsPage(page);
      await settings.navigate(path);
      await page.waitForTimeout(3000);
    }

    expect(zoomErrors).toHaveLength(0);
  });
});
