/**
 * @playwright/test
 * @description: Playwright tests for model management button states (dynamic vs static)
 */
import { test, expect } from '@playwright/test';

test('model row buttons dynamic state - visible when model has content', async ({ page }) => {
  // 1. Navigate to AI settings
  await page.goto('/ai/settings');

  // 2. Wait for model row to load
  await page.waitForSelector('.model-provider-sortable-row', { state: 'visible' });

  // 3. Select a platform with models
  const firstRow = page.locator('.model-provider-sortable-row').first();
  await expect(firstRow).toBeVisible({ timeout: 5000 });

  // 4. Model name should be visible (dynamic - model has content)
  const modelName = firstRow.locator('.mh-model-name');
  await expect(modelName).toBeVisible({ timeout: 5000 });

  // 5. Row actions should be revealed on hover (dynamic state)
  await firstRow.hover();
  const rowActions = firstRow.locator('.mh-row-actions');
  await expect(rowActions).toBeVisible({ timeout: 3000 });

  // 6. Action buttons within row actions should be interactive
  const renameBtn = rowActions.locator('.mh-act-edit');
  await expect(renameBtn).toBeVisible({ timeout: 3000 });
  await expect(renameBtn).toBeEnabled({ timeout: 3000 });
});

test('model row buttons static state - hidden when model is empty', async ({ page }) => {
  // 1. Navigate to AI settings
  await page.goto('/ai/settings');

  // 2. Look for empty state or model row without content
  await page.waitForSelector('.empty-state-container', { state: 'visible', timeout: 5000 });

  // 3. If model rows exist, verify actions are hidden (static state)
  const rows = page.locator('.model-provider-sortable-row');
  const rowCount = await rows.count();

  if (rowCount > 0) {
    // Check first row - actions should be hidden when no model content
    const firstRow = rows.nth(0);
    const rowActions = firstRow.locator('.mh-row-actions');

    // Actions should be hidden (opacity: 0) by default
    const computedStyle = await rowActions.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(computedStyle)).toBe(0);

    // Rename button should not be enabled
    const renameBtn = rowActions.locator('.mh-act-edit');
    await expect(renameBtn).not.toBeEnabled({ timeout: 3000 });
  }
});

test('model row buttons focus-visible state', async ({ page }) => {
  // 1. Navigate to AI settings
  await page.goto('/ai/settings');

  // 2. Focus on a model row via keyboard
  await page.waitForSelector('.model-provider-sortable-row', { state: 'visible' });
  const firstRow = page.locator('.model-provider-sortable-row').first();

  // 3. Press Tab to focus the row
  await firstRow.focus();

  // 4. Row should have focus-visible ring
  await expect(firstRow).toHaveCSS('outline', /2px solid rgba/);

  // 5. Row actions should be focus-within visible
  const rowActions = firstRow.locator('.mh-row-actions');
  await expect(rowActions).toBeVisible({ timeout: 3000 });

  // 6. Escape to blur
  await page.keyboardpress('Escape');
  await expect(rowActions).not.toBeVisible({ timeout: 1000 });
});

test('model rename button enables only for editable models', async ({ page }) => {
  // 1. Navigate to AI settings
  await page.goto('/ai/settings');

  // 2. Wait for model rows
  await page.waitForSelector('.model-provider-sortable-row', { state: 'visible' });

  // 2. Find rows with enabled models vs disabled
  const enabledRows = page.locator('.model-provider-sortable-row').filter({ has: page.locator('.model-switch[checked]') });
  const disabledRows = page.locator('.model-provider-sortable-row').filter({ has: page.locator('.model-switch:not([checked])') });

  // 3. Rename button should be available for enabled models
  const enabledFirst = await enabledRows.first().locator('.mh-row-actions').locator('.mh-act-edit');
  await expect(enabledFirst).toBeEnabled({ timeout: 3000 });

  // 4. Disabled models should have rename disabled or hidden
  if (await disabledRows.count() > 0) {
    const disabledFirst = await disabledRows.first().locator('.mh-row-actions').locator('.mh-act-edit');
    // Either disabled or hidden
    const isEnabled = await disabledFirst.isEnabled();
    const isVisible = await disabledFirst.isVisible();
    expect(isEnabled || !isVisible).toBe(true);
  }
});

test('model description editor toggle visibility', async ({ page }) => {
  // 1. Navigate to AI settings
  await page.goto('/ai/settings');

  // 2. Wait for model row
  await page.waitForSelector('.model-provider-sortable-row', { state: 'visible' });

  // 3. Click description edit button (tooltip with pen icon)
  const firstRow = page.locator('.model-provider-sortable-row').first();
  const descTrigger = firstRow.locator('.model-provider-action-btn');

  // 4. Trigger should be visible and clickable
  await expect(descTrigger).toBeVisible({ timeout: 3000 });
  await expect(descTrigger).toBeEnabled({ timeout: 3000 });

  // 5. Click should open description editor popover
  await descTrigger.click();
  await page.waitForSelector('.popover', { state: 'visible', timeout: 3000 });

  // 6. Description field should be editable
  const descInput = page.locator('textarea[placeholder*="描述"]');
  await expect(descInput).toBeVisible({ timeout: 3000 });

  // 7. Cancel should close the popover
  const cancelBtn = page.locator('button:有文字内容 contains 取消');
  await expect(cancelBtn).toBeVisible({ timeout: 3000 });
  await cancelBtn.click();

  // 8. Popover should close
  await expect(page.locator('.popover')).not.toBeVisible({ timeout: 1000 });
});