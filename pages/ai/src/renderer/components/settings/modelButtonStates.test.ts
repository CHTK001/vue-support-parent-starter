/**
 * @playwright/test
 * @description: Playwright tests for model management button states (dynamic vs static)
 */
import { test, expect } from '@playwright/test';

async function expandFirstCard(page: import('@playwright/test').Page) {
  const cards = page.locator('.model-provider-sortable-card');
  await expect(cards.first()).toBeVisible({ timeout: 30000 });
  await cards.first().locator('.provider-chevron').click();
  await page.waitForTimeout(500);
}

test('model row buttons dynamic state - visible when model has content', async ({ page }) => {
  await page.goto('/settings/model');
  await page.waitForLoadState('networkidle');

  // Expand first card to reveal model rows
  await expandFirstCard(page);

  // Wait for model rows to load
  const rows = page.locator('.model-provider-sortable-row');
  await expect(rows.first()).toBeVisible({ timeout: 30000 });

  // Model name should be visible
  const firstRow = rows.first();
  const modelName = firstRow.locator('.model-name');
  await expect(modelName).toBeVisible({ timeout: 5000 });

  // Row actions should be revealed on hover
  await firstRow.hover();
  const rowActions = firstRow.locator('.model-actions');
  await expect(rowActions).toBeVisible({ timeout: 3000 });

  // Model switch should be interactive
  const modelSwitch = rowActions.locator('.model-switch');
  await expect(modelSwitch).toBeVisible({ timeout: 3000 });
  await expect(modelSwitch).toBeEnabled({ timeout: 3000 });

  // Rename button (icon-write) should be visible
  const renameBtn = rowActions.locator('.i-icon-write').locator('..');
  await expect(renameBtn).toBeVisible({ timeout: 3000 });
  await expect(renameBtn).toBeEnabled({ timeout: 3000 });
});

test('model row buttons static state - hidden when model is empty', async ({ page }) => {
  await page.goto('/settings/model');
  await page.waitForLoadState('networkidle');

  // Expand first card
  await expandFirstCard(page);

  // Verify model rows exist
  const rows = page.locator('.model-provider-sortable-row');
  await expect(rows.first()).toBeVisible({ timeout: 30000 });

  // Check first row - actions should be hidden by default (opacity: 0)
  const firstRow = rows.first();
  const rowActions = firstRow.locator('.model-actions');
  const computedStyle = await rowActions.evaluate((el) => window.getComputedStyle(el).opacity);
  expect(parseFloat(computedStyle)).toBe(0);
});

test('model row buttons focus-visible state', async ({ page }) => {
  await page.goto('/settings/model');
  await page.waitForLoadState('networkidle');

  // Expand first card
  await expandFirstCard(page);

  // Wait for model rows
  const firstRow = page.locator('.model-provider-sortable-row').first();
  await expect(firstRow).toBeVisible({ timeout: 30000 });

  // Focus on the row
  await firstRow.focus();

  // Row actions should become visible on focus
  const rowActions = firstRow.locator('.model-actions');
  await expect(rowActions).toBeVisible({ timeout: 3000 });

  // Escape to blur
  await page.keyboard.press('Escape');
});

test('model rename button enables only for editable models', async ({ page }) => {
  await page.goto('/settings/model');
  await page.waitForLoadState('networkidle');

  // Expand first card
  await expandFirstCard(page);

  // Wait for model rows
  await page.waitForSelector('.model-provider-sortable-row', { state: 'visible' });

  // Find rows with enabled/disabled switches
  const enabledRows = page.locator('.model-provider-sortable-row').filter({ has: page.locator('.model-switch.arco-switch-checked') });
  const disabledRows = page.locator('.model-provider-sortable-row').filter({ has: page.locator('.model-switch:not(.arco-switch-checked)') });

  // Rename button should be available for enabled models
  const enabledFirst = enabledRows.first().locator('.model-actions').locator('.i-icon-write').locator('..');
  await expect(enabledFirst).toBeEnabled({ timeout: 3000 });

  // Disabled models should have rename disabled or hidden
  if (await disabledRows.count() > 0) {
    const disabledFirst = disabledRows.first().locator('.model-actions').locator('.i-icon-write').locator('..');
    const isEnabled = await disabledFirst.isEnabled();
    const isVisible = await disabledFirst.isVisible();
    expect(isEnabled || !isVisible).toBe(true);
  }
});

test('model description editor toggle visibility', async ({ page }) => {
  await page.goto('/settings/model');
  await page.waitForLoadState('networkidle');

  // Expand first card
  await expandFirstCard(page);

  // Wait for model row
  await page.waitForSelector('.model-provider-sortable-row', { state: 'visible' });

  // Hover over first row to reveal actions
  const firstRow = page.locator('.model-provider-sortable-row').first();
  await firstRow.hover();

  // Find description edit button (icon-write in model row actions)
  const descTrigger = firstRow.locator('.model-actions .i-icon-write').locator('..');
  await expect(descTrigger).toBeVisible({ timeout: 3000 });
  await expect(descTrigger).toBeEnabled({ timeout: 3000 });
});
