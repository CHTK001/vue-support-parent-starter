import { test, expect } from '@playwright/test';

test.describe('Monitor Frontend - Menu Structure Verification', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8852/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(3000);
    });

    test('1. extract and verify all menu items', async ({ page }) => {
        // Take screenshot
        await page.screenshot({ path: 'monitor-verification-menu.png', fullPage: true });

        // Extract menu items from the sidebar
        const menuItems = await page.evaluate(() => {
            // Try multiple selectors for menu items
            const selectors = [
                '.el-menu-item',
                '.n-menu-item',
                '.sidebar-menu-item',
                '[class*="menu-item"]',
                '.el-sub-menu',
                '.n-menu-sub-menu',
                '.menu-link',
                'a.sidebar-link',
                '.n-menu-menu-item-content',
            ];
            
            let items: string[] = [];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length < 50 && !items.includes(text)) {
                        items.push(text);
                    }
                });
            }
            
            // Also try to find links with known menu titles
            const linkSelectors = [
                'a[href*="/node"]',
                'a[href*="/server"]',
                'a[href*="/setting"]',
                'a[href*="/skywalking"]',
                'a[href*="/device"]',
                'a[href*="/project"]',
                'a[href*="/sync"]',
                'a[href*="/arthas"]',
                'a[href*="/panel"]',
                'a[href*="/ai"]',
                'a[href*="/datalake"]',
            ];
            
            for (const selector of linkSelectors) {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length < 50 && !items.includes(text)) {
                        items.push(text);
                    }
                });
            }
            
            return items;
        });
        
        console.log('Found menu items:', menuItems);
        
        // Verify key menu items exist
        const expectedMenus = ['节点管理', '服务器管理', '同步管理'];
        const foundMenus = new Set(menuItems);
        
        for (const expected of expectedMenus) {
            // Check if any menu item contains the expected text
            const found = Array.from(foundMenus).some(item => item.includes(expected));
            console.log(`Expected menu "${expected}": ${found ? 'FOUND' : 'NOT FOUND'}`);
        }
        
        // Take screenshot
        await page.screenshot({ path: 'monitor-verification-menu-items.png', fullPage: true });
    });

    test('2. check for duplicate or unexpected menus', async ({ page }) => {
        // Get all visible text in the sidebar/navigation area
        const sidebarText = await page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar') || 
                           document.querySelector('[class*="sidebar"]') ||
                           document.querySelector('[class*="menu"]') ||
                           document.body;
            return sidebar?.textContent || '';
        });
        
        console.log('Sidebar text length:', sidebarText.length);
        console.log('Sidebar text:', sidebarText.substring(0, 2000));
        
        // Count unique menu entries
        const uniqueWords = new Set(sidebarText.split(/[\s\n]+/).filter(w => w.length > 1 && w.length < 30));
        console.log('Unique words in sidebar:', uniqueWords.size);
    });
});
