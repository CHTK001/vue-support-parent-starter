#!/usr/bin/env python3
# -*- coding: utf-8 -*-
path = r'D:\ch\project\vue-support-parent-starter\pages\ai\playwright-server-all.spec.ts'
with open(path, 'rb') as f:
    lines = f.readlines()

# B16: replace lines 616-617 (0-indexed: 615-616)
# Line 616: await page.locator('button.ab.ad[data-a="delete"]').first().click();
# Line 617: console.log("  ✓ 删除确认弹窗");
new_b16_lines = [
    b'      // intercept browser confirm() so deletion proceeds\n',
    b'      await page.evaluate(() => { window.__cf = () => true; window.confirm = window.__cf; });\n',
    b'      await page.locator(\'button.ab.ad[data-a="delete"]\').first().click();\n',
    b'      await page.waitForTimeout(200);\n',
    b'      expect(await page.locator("#tbody tr").count()).toBe(2);\n',
    b'      console.log("  \xe2\x9c\x93 \xe5\x88\xa0\xe9\x99\xa4\xe5\x90\x8e\xe8\xa1\x8c\xe6\x95\xb0 3\xe2\x86\x922");\n',
]
lines[615:617] = new_b16_lines

with open(path, 'wb') as f:
    f.writelines(lines)
print('B16 patched')
