#!/usr/bin/env python3
# -*- coding: utf-8 -*-
path = r'D:\ch\project\vue-support-parent-starter\pages\ai\playwright-server-all.spec.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# B14: after save, verify new host data appears in table
old_b14 = (
    '      await page.locator("#f-save").click();\n'
    '      await page.waitForTimeout(300);\n'
    '      expect(await page.locator("#tbody tr").count()).toBeGreaterThanOrEqual(4);')
new_b14 = (
    '      await page.locator("#f-save").click();\n'
    '      await page.waitForTimeout(300);\n'
    '      expect(await page.locator("#tbody tr").count()).toBeGreaterThanOrEqual(4);\n'
    '      const tbodyText = await page.locator("#tbody").textContent();\n'
    '      expect(tbodyText).toContain("test-host"); expect(tbodyText).toContain("10.0.0.99");')
assert old_b14 in content, "B14 old not found"
content = content.replace(old_b14, new_b14)
print('B14 updated')

# B15: after edit+save, verify name change persisted
old_b15 = (
    '      const name = await page.locator("#f-name").inputValue();\n'
    '      expect(name).toBeTruthy();\n'
    '      await page.locator("#f-cancel").click();')
new_b15 = (
    '      const name = await page.locator("#f-name").inputValue();\n'
    '      expect(name).toBeTruthy();\n'
    '      // 修改名称后保存，验证实际生效\n'
    '      await page.locator("#f-name").fill("edit-host");\n'
    '      await page.locator("#f-save").click();\n'
    '      await page.waitForTimeout(200);\n'
    '      const edittedText = await page.locator("#tbody").textContent();\n'
    '      expect(edittedText).toContain("edit-host");')
assert old_b15 in content, "B15 old not found"
content = content.replace(old_b15, new_b15)
print('B15 updated')

# B16: handle confirm() dialog and verify row count decreases from 3 to 2
old_b16 = (
    '      await page.locator(\'button.ab.ad[data-a="delete"]\').first().click();\n'
    '      console.log("  \u2713 \u5220\u9664\u786e\u8ba4\u5f39\u7a97");')
new_b16 = (
    '      await page.locator(\'button.ab.ad[data-a="delete"]\').first().click();\n'
    '      // handle browser confirm() dialog\n'
    '      await page.evaluate(() => window.__confirmAnswer = true);\n'
    '      window.confirm = () => window.__confirmAnswer;\n'
    '      await page.locator(\'button.ab.ad[data-a="delete"]\').first().click();\n'
    '      await page.waitForTimeout(200);\n'
    '      expect(await page.locator("#tbody tr").count()).toBe(2);\n'
    '      console.log("  \u2713 \u5220\u9664\u540e\u884c\u6570 3\u21922");')
assert old_b16 in content, "B16 old not found"
content = content.replace(old_b16, new_b16)
print('B16 updated')

# B11: verify detail has more fields than just the name
old_b11 = (
    '      expect(await page.locator("#detail-content").textContent()).toContain("web-01");')
new_b11 = (
    '      const detailText = await page.locator("#detail-content").textContent();\n'
    '      expect(detailText).toContain("web-01");\n'
    '      expect(detailText).toContain("serverHostAddress");')
assert old_b11 in content, "B11 old not found"
content = content.replace(old_b11, new_b11)
print('B11 updated')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('All changes written')
