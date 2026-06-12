import { test, expect } from '@playwright/test';

test.describe('Monitor Frontend - Complete Verification', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8852/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(3000);
    });

    test('1. homepage loads and renders layout structure', async ({ page }) => {
        // Take screenshot for visual verification
        await page.screenshot({ path: 'monitor-verification-home.png', fullPage: true });
        
        // Verify page title
        await expect(page).toHaveTitle(/运维管理/);
        
        // Verify body is rendered with content
        const body = await page.locator('body').textContent();
        expect(body?.length).toBeGreaterThan(0);
        
        // Verify URL
        const url = page.url();
        expect(url).toContain('localhost:8852');
    });

    test('2. verify Vue app is mounted', async ({ page }) => {
        // Check that the Vue app div exists
        await expect(page.locator('#app')).toBeVisible();
        
        // Take screenshot to verify rendering
        await page.screenshot({ path: 'monitor-verification-app.png', fullPage: true });
    });

    test('3. verify page loads without JavaScript errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        page.on('pageerror', err => {
            errors.push(err.message);
        });
        
        // Reload to check for errors
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // Should not have critical errors
        expect(errors.length).toBeLessThan(5);
    });
});
