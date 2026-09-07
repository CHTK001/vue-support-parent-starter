#!/usr/bin/env python3
# -*- coding: utf-8 -*-
path = r'D:\ch\project\vue-support-parent-starter\pages\ai\playwright-server-all.spec.ts'
with open(path, 'rb') as f:
    content = f.read()

# B16: handle confirm() and verify row count
old_b16 = b'      await page.locator(\'button.ab.ad[data-a="delete"]\').first().click();\n      console.log("  \xe2\x9c\x93 \xe5\x88\xa0\xe9\x99\xa4\xe7\xa1\xae\xe8\xae\xa4\xe5\xbc\xb9\xe7\xaa\x86");'
new_b16 = (b'      // intercept browser confirm() so deletion proceeds\n'
           b'      await page.evaluate(() => { window.__cf = () => true; window.confirm = window.__cf; });\n'
           b'      await page.locator(\'button.ab.ad[data-a="delete"]\').first().click();\n'
           b'      await page.waitForTimeout(200);\n'
           b'      expect(await page.locator("#tbody tr").count()).toBe(2);\n'
           b'      console.log("  \xe2\x9c\x93 \xe5\x88\xa0\xe9\x99\xa4\xe5\x90\x8e\xe8\xa1\x8c\xe6\x95\xb0 3\xe2\x86\x922");')
if old_b16 in content:
    content = content.replace(old_b16, new_b16)
    print('B16 updated')
else:
    print('B16 not found, trying raw bytes...')
    # find it by line number
    lines = content.split(b'\n')
    for i, line in enumerate(lines):
        if b'data-a="delete"' in line and b'first()' in line:
            print(f'  Found at line {i+1}: {line[:80]}')

# B11: verify detail has more fields
old_b11 = b'      expect(await page.locator("#detail-content").textContent()).toContain("web-01");'
new_b11 = b'      const detailText = await page.locator("#detail-content").textContent();\n      expect(detailText).toContain("web-01");\n      expect(detailText).toContain("serverHostAddress");'
if old_b11 in content:
    content = content.replace(old_b11, new_b11)
    print('B11 updated')
else:
    print('B11 not found')

with open(path, 'wb') as f:
    f.write(content)
print('done')
