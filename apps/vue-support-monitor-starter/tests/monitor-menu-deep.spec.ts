import { test, expect } from '@playwright/test';

test.describe('Monitor Frontend - Menu Deep Analysis', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8852/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(3000);
    });

    test('extract all sidebar menu items with full structure', async ({ page }) => {
        await page.screenshot({ path: 'monitor-verification-sidebar.png', fullPage: true });

        const menuStructure = await page.evaluate(() => {
            // Find the sidebar menu container
            const menuContainers = document.querySelectorAll('.el-menu, .n-menu, [class*="sider-menu"], [class*="side-menu"], [class*="sidebar-menu"]');
            
            let menus: any[] = [];
            
            // Try to find all menu items recursively
            function extractMenuItems(container: Element, depth: number = 0) {
                const items = container.querySelectorAll('.el-menu-item, .el-sub-menu__title, .n-menu-item-content, [class*="menu-item"]');
                items.forEach((item: Element) => {
                    const text = item.textContent?.trim().split(/\s+/).filter(t => t.length > 0 && t.length < 30).join(' ').substring(0, 50);
                    if (text) {
                        menus.push({
                            text,
                            depth,
                            className: item.className?.toString().substring(0, 100)
                        });
                    }
                });
                
                // Check for nested menus
                const submenus = container.querySelectorAll('.el-menu--inline, [class*="submenu"]');
                submenus.forEach((sub: Element) => {
                    extractMenuItems(sub, depth + 1);
                });
            }
            
            menuContainers.forEach((container: Element) => {
                extractMenuItems(container);
            });
            
            // Fallback: extract all unique text from potential menu elements
            const allPotentialMenus = document.querySelectorAll('a, button, span');
            allPotentialMenus.forEach((el: Element) => {
                const text = el.textContent?.trim().split(/\s+/).filter(t => t.length > 1 && t.length < 30).join(' ').substring(0, 50);
                if (text && !menus.some(m => m.text === text)) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && rect.width < 300 && rect.height < 50) {
                        menus.push({
                            text,
                            depth: 0,
                            className: el.className?.toString().substring(0, 100) || '',
                            x: Math.round(rect.x),
                            y: Math.round(rect.y)
                        });
                    }
                }
            });
            
            return menus;
        });
        
        console.log('=== Full Menu Structure ===');
        menuStructure.forEach((item, index) => {
            console.log(`${index + 1}. [depth:${item.depth}] ${item.text} (${item.className})`);
        });
        
        // Group by position
        const topMenus = menuStructure.filter(m => m.depth === 0).map(m => m.text);
        console.log('\n=== Top Level Menus ===');
        console.log(topMenus.join(', '));
        
        await page.screenshot({ path: 'monitor-verification-full-menu.png', fullPage: true });
    });

    test('check menu count and identify duplicates', async ({ page }) => {
        const menuAnalysis = await page.evaluate(() => {
            // Get all clickable elements in the sidebar
            const sidebarElements = document.querySelectorAll('.sidebar *, [class*="side-bar"] *');
            
            const menuTitles: string[] = [];
            sidebarElements.forEach((el: Element) => {
                const text = el.textContent?.trim();
                if (text && text.length > 1 && text.length < 50 && 
                    (el.tagName === 'SPAN' || el.tagName === 'A' || el.tagName === 'BUTTON')) {
                    // Check if it's not a UI helper text
                    if (!['收起', '展开', '更多', '退出', '登录', '注册'].includes(text)) {
                        menuTitles.push(text);
                    }
                }
            });
            
            // Find duplicates
            const counts: Record<string, number> = {};
            menuTitles.forEach(title => {
                counts[title] = (counts[title] || 0) + 1;
            });
            
            const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
            
            return {
                totalMenus: menuTitles.length,
                uniqueMenus: new Set(menuTitles).size,
                menus: [...new Set(menuTitles)],
                duplicates: duplicates.map(([title, count]) => ({ title, count })),
                sample: menuTitles.slice(0, 20)
            };
        });
        
        console.log('=== Menu Analysis ===');
        console.log('Total menu items:', menuAnalysis.totalMenus);
        console.log('Unique menu items:', menuAnalysis.uniqueMenus);
        console.log('Duplicates:', menuAnalysis.duplicates.length > 0 ? JSON.stringify(menuAnalysis.duplicates) : 'None');
        console.log('Sample menus:', menuAnalysis.sample.join(', '));
    });
});
