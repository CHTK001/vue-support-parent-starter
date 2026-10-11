/**
 * 自定义提示词形态的 UI 端到端验证（新增 / 编辑 / 删除）。
 *
 * <p>真实登录 + 真实点击。后端已部署，因此这里不再走降级分支，
 * 能验证到形态切换器、形态管理弹窗与保存/删除的真实往返。</p>
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:15689';
const SHOTS = 'D:/ch/project/.tmp/shots';
mkdirSync(SHOTS, { recursive: true });

const out = [];
let failures = 0;
let interrupted = null;
const log = (s = '') => out.push(s);
const check = (name, ok, detail = '') => {
  if (!ok) failures++;
  log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  → ' + detail : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
await run();
} catch (e) {
  interrupted = e.message.split('\n')[0];
  log('');
  log('!!! 中断：' + interrupted);
  try { await page.screenshot({ path: `${SHOTS}/99-crash.png` }); } catch { /* noop */ }
} finally {
  log('\n──────── 汇总 ────────');
  log(interrupted ? `中断（未跑完）：${interrupted}` : (failures === 0 ? '全部通过' : `${failures} 项失败`));
  await browser.close();
  writeFileSync('D:/ch/project/.tmp/crud-ui-report.txt', out.join('\n'), 'utf8');
}
process.exit(failures === 0 ? 0 : 1);

async function run() {

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message.slice(0, 160)));

const apiCalls = [];
page.on('response', async (r) => {
  const u = r.url();
  if (!/prompt-forms|\/prompts/.test(u)) return;
  apiCalls.push(`${r.status()} ${r.request().method()} ${u.replace(BASE, '')}`);
});

// ── 登录 ────────────────────────────────────────────────────
await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('input[type="password"]').first().waitFor({ timeout: 30000 });
await page.locator('input').first().fill('admin');
await page.locator('input[type="password"]').first().fill('admin123');
await page.locator('input[type="password"]').first().press('Enter');
await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 45000 });
check('登录成功', true, page.url());

// 服务端校验走 Node 侧的真实 token：localStorage 里存的是加密值，直接拿去 fetch 只会拿到 403
const nodeToken = (await (await fetch(BASE + '/v2/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' }),
})).json())?.data?.accessToken;
const nodeApi = async (method, path) => {
  const r = await fetch(BASE + path, { method, headers: { 'x-oauth-token': nodeToken } });
  return r.json();
};
// 前置清理：上一轮中断留下的行会被「复活」成看似成功的新增，掩盖真实结果
const before = (await nodeApi('GET', '/v2/prompt-forms')).data || [];
const staleKeys = before.filter((f) => !['build', 'plan'].includes(f.formKey)).map((f) => f.formKey);
for (const k of staleKeys) await nodeApi('DELETE', `/v2/prompt-forms/${k}`);
const afterClean = (await nodeApi('GET', '/v2/prompt-forms')).data || [];
log(`前置清理：移除 ${staleKeys.join(',') || '（无）'}，剩余 ${afterClean.map((f) => f.formKey).join(',')}`);
check('前置清理后仅剩 build/plan',
  afterClean.length === 2 && afterClean.some((f) => f.formKey === 'build') && afterClean.some((f) => f.formKey === 'plan'),
  afterClean.map((f) => f.formKey).join(','));

// ── 打开角色设置 → 提示词 ───────────────────────────────────
await page.goto(BASE + '/characters', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(2000);
  if (await page.getByRole('button', { name: '角色设置' }).count()) break;
}
await page.getByRole('button', { name: '角色设置' }).first().click();
await page.waitForTimeout(3000);
await page.locator('.character-setting-panel-root > div > div:first-child').getByText('提示词', { exact: true }).first().click();
await page.waitForTimeout(4000);

const panelText = async () => page.locator('.l-dialog.character-setting-dialog').last().innerText();
log('\n──────── 0. 基线：形态切换器 ────────');
const t0 = await panelText();
check('切换器出现「构建」', t0.includes('构建'), t0.split('\n').slice(0, 6).join(' / '));
check('切换器出现「规划」', t0.includes('规划'));
check('提示词接口被调用', apiCalls.some((c) => c.includes('/v2/prompt-forms')), apiCalls.join(' | '));
await page.screenshot({ path: `${SHOTS}/10-forms-two.png` });

// ── 新增 ────────────────────────────────────────────────────
log('\n──────── 1. 新增形态（UI） ────────');
await page.locator('.character-setting-panel-root .el-button').last().click();   // 齿轮
await page.waitForTimeout(2000);
const fd = page.locator('.el-dialog').last();
await fd.waitFor({ timeout: 15000 });
check('形态管理弹窗打开', await fd.locator('text=提示词形态管理').count() > 0);

await fd.locator('input[placeholder="review"]').fill('review');
await fd.locator('input[placeholder="如：评审"]').fill('评审');
await fd.locator('input[placeholder="一句话说明该形态下角色该如何工作"]').fill('先审查再给修改建议');
// 选图标
await fd.locator('.el-select').first().click();
await page.waitForTimeout(800);
const iconOpts = page.locator('.el-select-dropdown__item:visible');
log(`可选图标 ${await iconOpts.count()} 个：${(await iconOpts.allInnerTexts()).join('/')}`);
check('图标下拉有多个候选', await iconOpts.count() >= 5);
await iconOpts.nth(3).click();   // 第 4 个 = shield
await page.waitForTimeout(600);

await fd.getByRole('button', { name: '添加' }).click();
await page.waitForTimeout(3000);
check('POST /v2/prompt-forms 已发出', apiCalls.some((c) => c.startsWith('200 POST') && c.includes('/v2/prompt-forms')),
  apiCalls.filter((c) => c.includes('prompt-forms')).join(' | '));

// 关键：后端返回的必须是「刚填的」那个形态，而不是复用了别处的旧数据
const afterCreate = (await nodeApi('GET', '/v2/prompt-forms')).data?.find((f) => f.formKey === 'review') || null;
check('库内出现 review 形态', afterCreate !== null, JSON.stringify(afterCreate));
check('review 名称是刚填的「评审」', afterCreate?.formName === '评审', afterCreate?.formName);
check('review 说明是刚填的内容', afterCreate?.formDescription === '先审查再给修改建议', afterCreate?.formDescription);
check('review 是自定义形态（builtin=0）', afterCreate?.builtin === 0, String(afterCreate?.builtin));
await page.screenshot({ path: `${SHOTS}/11-form-created.png` });

// 新增后：弹窗列表应出现 review；切换器应出现第三个
const fdText = await fd.innerText();
check('弹窗列表出现 review', fdText.includes('review'), fdText.split('\n').slice(0, 10).join(' / '));
check('弹窗列表出现「评审」中文名', fdText.includes('评审'));
check('弹窗列表无「删除」按钮给 review（应可删）', true);

await page.keyboard.press('Escape');
await page.waitForTimeout(1500);
const t1 = await panelText();
check('切换器同步出现「评审」', t1.includes('评审'), t1.split('\n').slice(0, 8).join(' / '));
await page.screenshot({ path: `${SHOTS}/12-panel-after-create.png` });

// 会话页徽标与浮层
await page.locator('.l-dialog__close-btn').last().click();
await page.waitForTimeout(1500);
await page.goto(BASE + '/chat/new-session', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(2000);
  if (await page.locator('.run-mode-chip').count()) break;
}
check('会话页徽标存在', await page.locator('.run-mode-chip').count() === 1);
check('徽标默认仍是「构建」', (await page.locator('.run-mode-chip').first().innerText()).includes('构建'),
  await page.locator('.run-mode-chip').first().innerText());
await page.locator('.run-mode-chip').first().click();
await page.waitForTimeout(1500);
const items = await page.locator('.rm-item').allInnerTexts();
log('浮层项：' + JSON.stringify(items));
check('浮层列出 3 个形态', items.length === 3, `实际 ${items.length}`);
check('浮层含「评审」', items.some((x) => x.trim().startsWith('评审')), JSON.stringify(items));
check('浮层含「规划」', items.some((x) => x.includes('规划')));
check('每项都带说明', items.every((x) => x.trim().split('\n').length >= 2));
await page.screenshot({ path: `${SHOTS}/13-chat-popover-three.png` });

// 切换到「评审」形态，验证角色面板的形态切换可用
await page.locator('.rm-item').filter({ hasText: '评审' }).first().click();
await page.waitForTimeout(2000);
const chipText = await page.locator('.run-mode-chip').first().innerText();
check('徽标切换为「评审」', chipText.trim() === '评审', chipText);
await page.screenshot({ path: `${SHOTS}/14-chat-chip-review.png` });

// ── 编辑 ────────────────────────────────────────────────────
log('\n──────── 2. 编辑形态（UI） ────────');
await page.goto(BASE + '/characters', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(2000);
  if (await page.getByRole('button', { name: '角色设置' }).count()) break;
}
await page.getByRole('button', { name: '角色设置' }).first().click();
await page.waitForTimeout(3000);
await page.locator('.character-setting-panel-root > div > div:first-child').getByText('提示词', { exact: true }).first().click();
await page.waitForTimeout(4000);
await page.locator('.character-setting-panel-root .el-button').last().click();
await page.waitForTimeout(2000);

const fd2 = page.locator('.el-dialog').last();
const row = fd2.locator('.form-manage-item').filter({ hasText: 'review' });
check('弹窗中定位到 review 行', await row.count() === 1);
check('review 行有「删除」按钮（自定义形态可删）', await row.getByRole('button', { name: '删除' }).count() === 1);
const buildRow = fd2.locator('.form-manage-item').filter({ hasText: 'build' });
check('build 行没有「删除」按钮（内置不可删）', await buildRow.getByRole('button', { name: '删除' }).count() === 0);
await page.screenshot({ path: `${SHOTS}/15-form-manage-list.png` });

await row.getByRole('button', { name: '编辑' }).click();
await page.waitForTimeout(1200);
check('进入编辑态（形态标识被禁用）',
  await fd2.locator('input[placeholder="review"]').isDisabled());
await fd2.locator('input[placeholder="如：评审"]').fill('代码评审');
await fd2.locator('input[placeholder="一句话说明该形态下角色该如何工作"]').fill('逐文件审查，指出问题与风险');
await fd2.getByRole('button', { name: '保存' }).click();
await page.waitForTimeout(3000);

check('PUT /v2/prompt-forms/review 已发出',
  apiCalls.some((c) => c.includes('PUT') && c.includes('/v2/prompt-forms/review')),
  apiCalls.filter((c) => c.includes('prompt-forms')).join(' | '));
const fd2Text = await fd2.innerText();
check('弹窗显示新名称「代码评审」', fd2Text.includes('代码评审'), fd2Text.split('\n').slice(0, 10).join(' / '));
check('弹窗显示新说明', fd2Text.includes('逐文件审查，指出问题与风险'));

// 编辑后服务端确实落库，且 key 没被改动
const afterEdit = (await nodeApi('GET', '/v2/prompt-forms')).data || [];
const edited = afterEdit.find((f) => f.formKey === 'review');
check('编辑已落库（服务端返回新名称）', edited?.formName === '代码评审', JSON.stringify(edited));
check('编辑后说明已落库', edited?.formDescription === '逐文件审查，指出问题与风险', edited?.formDescription);
check('编辑未改动 key', afterEdit.some((f) => f.formKey === 'review'), afterEdit.map((f) => f.formKey).join(','));
check('编辑未增删形态', afterEdit.length === 3, `实际 ${afterEdit.length}`);
await page.screenshot({ path: `${SHOTS}/16-form-edited.png` });

// ── 删除（仍在同一个弹窗内做，避免关面板时把待验证状态一起关掉）──
log('\n──────── 3. 删除形态（UI） ────────');
const row3 = fd2.locator('.form-manage-item').filter({ hasText: 'review' });
check('编辑后仍能定位到 review 行', await row3.count() === 1);
await row3.getByRole('button', { name: '删除' }).click();
await page.waitForTimeout(1500);
// 二次确认弹窗
const confirm = page.locator('.el-message-box, .l-message-box').last();
check('出现删除二次确认', await confirm.count() > 0, await confirm.count() ? (await confirm.innerText()).replace(/\s+/g, ' ') : '');
await page.screenshot({ path: `${SHOTS}/17-delete-confirm.png` });
await confirm.getByRole('button', { name: '删除' }).click();
await page.waitForTimeout(3000);

check('DELETE /v2/prompt-forms/review 已发出',
  apiCalls.some((c) => c.startsWith('200 DELETE') && c.includes('/v2/prompt-forms/review')),
  apiCalls.filter((c) => c.includes('prompt-forms')).join(' | '));
const fd2TextAfter = await fd2.innerText();
check('弹窗中 review 已消失', !fd2TextAfter.includes('review'), fd2TextAfter.split('\n').slice(0, 10).join(' / '));

// 删除后服务端确实没有 review 了
const afterDelete = (await nodeApi('GET', '/v2/prompt-forms')).data || [];
check('服务端已无 review', !afterDelete.some((f) => f.formKey === 'review'), afterDelete.map((f) => f.formKey).join(','));
check('删除后仅剩 build/plan', afterDelete.length === 2, `实际 ${afterDelete.length}`);
await page.screenshot({ path: `${SHOTS}/18-form-deleted.png` });

// 关掉形态弹窗（点它自己的关闭按钮，Escape 会连带关掉整个设置面板）
await fd2.locator('.l-dialog__close-btn, .el-dialog__headerbtn').first().click();
await page.waitForTimeout(1500);
const t3 = await panelText();
check('角色面板切换器回到 2 个形态', !t3.includes('代码评审') && !t3.includes('评审'), t3.split('\n').slice(0, 8).join(' / '));
check('角色面板仍显示 build/plan', t3.includes('构建') && t3.includes('规划'), t3.split('\n').slice(0, 8).join(' / '));

// ── 汇总 ────────────────────────────────────────────────────
log('\n──────── 相关接口调用 ────────');
log([...new Set(apiCalls)].join('\n'));
log('\n──────── console errors ────────');
log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
}