// 浏览器验收：文件预览 + 智能问答 + 列表页统计卡/活动栏
const { chromium } = require('playwright')
const BASE = 'http://localhost:15689'
const API = 'http://192.168.50.198:8787'
const SHOTS = 'D:\\ch\\project\\.openchamber\\screenshots\\'
const PASS = [], FAIL = []
function check(n, c, d) {
  ;(c ? PASS : FAIL).push(n)
  console.log(`  [${c ? 'PASS' : 'FAIL'}] ${n}${d !== undefined && d !== '' ? '  -> ' + d : ''}`)
  return c
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function api(path, tok, method = 'GET', body) {
  const h = { 'User-Agent': 'acc/1.0' }
  if (tok) h.Authorization = 'Bearer ' + tok
  if (body !== undefined) h['Content-Type'] = 'application/json'
  const r = await fetch(API + path, { method, headers: h, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  return r.json()
}
function deep(d) { let c = d; for (let i = 0; i < 5; i++) { if (c && typeof c === 'object' && c.data && typeof c.data === 'object') c = c.data; else break } return c }

;(async () => {
  const tok = deep(await api('/v2/user/login', null, 'POST', { username: 'admin', password: 'admin123' })).accessToken

  // 造一个带 markdown 内容的库
  const NAME = 'UI验收-' + Date.now()
  const kb = deep(await api('/api/knowledge/bases', tok, 'POST', { name: NAME, description: '预览与问答验收' }))
  const KID = kb.knowledge_base_id
  console.log('  KID=' + KID)

  console.log('\n== 0) 后端新端点 ==')
  const ov = deep(await api('/api/knowledge/bases/overview', tok))
  check('/bases/overview 可用', !!ov && !!ov.totals, JSON.stringify(ov && ov.totals))
  check('overview 含 per_base', !!(ov && ov.per_base))
  check('per_base 里有本库条目', !!(ov && ov.per_base && ov.per_base[KID]), JSON.stringify(ov && ov.per_base && ov.per_base[KID]))
  const ask0 = await api('/api/knowledge/bases/' + KID + '/ask', tok, 'POST', { query: '测试' })
  check('/ask 端点存在（空库也应返回结构而非404）', !!(ask0 && ask0.data !== undefined || ask0.code !== undefined), JSON.stringify(ask0).slice(0, 120))

  // 写入 markdown 知识点
  const md = '# 三国演义\n\n## 桃园结义\n\n刘备、关羽、张飞 三人在桃园结义。\n\n- 地点：桃园\n- 事件：桃园结义\n'
  await api('/api/knowledge/bases/' + KID + '/file', tok, 'PUT', { path: 'preview-demo.md', content: md })
  // 再写一个空内容文件：抽取文本为空 → 后端判 FAILED → 前端「失败」分栏应有 1 条。
  // 没有这个文件就无法验证分栏到底有没有在过滤（单文件且已索引时「全部」和「已索引」都是 1）。
  await api('/api/knowledge/bases/' + KID + '/file', tok, 'PUT', { path: 'empty.md', content: '' })
  await sleep(2500)
  const f = deep(await api('/api/knowledge/bases/' + KID + '/file?path=preview-demo.md', tok))
  check('后端能读回原文', f && f.content && f.content.includes('桃园结义'), 'len=' + (f && f.content ? f.content.length : 0))
  const treeRaw = deep(await api('/api/knowledge/bases/' + KID + '/tree?path=', tok))
  const rows = Array.isArray(treeRaw) ? treeRaw : (treeRaw && treeRaw.tree) || []
  const stMap = {}
  rows.forEach((r) => { stMap[r.rel_path] = r.processing_status })
  console.log('     /tree 状态: ' + JSON.stringify(stMap))
  check('已索引文件 processing_status=completed', stMap['preview-demo.md'] === 'completed', String(stMap['preview-demo.md']))
  check('空文件 processing_status=failed', stMap['empty.md'] === 'failed', String(stMap['empty.md']))

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 200)))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('[console] ' + m.text().slice(0, 200)) })

  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForSelector('input[type="password"]', { timeout: 30000 })
  await page.locator('input[type="text"]').first().fill('admin')
  await page.locator('input[type="password"]').first().fill('admin123')
  await page.locator('button').first().click({ timeout: 8000 }).catch(() => {})
  for (let i = 0; i < 25; i++) { await page.waitForTimeout(1000); if (!page.url().includes('/login')) break }
  check('登录成功', !page.url().includes('/login'), page.url())

  await page.goto(BASE + '/knowledge-base', { waitUntil: 'domcontentloaded', timeout: 180000 })
  // vite dev 首次访问要冷编译新组件，可能十几秒；显式等统计卡出现而不是死等固定秒数
  await page.waitForSelector('.kb-stat', { timeout: 120000 }).catch(() => {})
  await page.waitForTimeout(3000)

  console.log('\n== 1) 列表页：统计卡 + 活动栏 ==')
  const stats = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-stat')).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()))
  check('有 4 张统计卡', stats.length === 4, stats.length + ' 张: ' + stats.join(' | '))
  check('统计卡含「知识库」「文档总量」「实体节点」「关系连线」',
    stats.some((s) => s.includes('知识库')) && stats.some((s) => s.includes('文档总量')) &&
    stats.some((s) => s.includes('实体节点')) && stats.some((s) => s.includes('关系连线')), stats.join(' | '))
  check('统计卡有非空数字', stats.every((s) => /\d/.test(s)), stats.join(' | '))
  check('有「最近活动」栏', await page.locator('.kb-home__side').count() > 0)
  check('活动栏标题正确', ((await page.evaluate(() => { const e = document.querySelector('.kb-home__side'); return e ? e.innerText : '' })) || '').includes('最近活动'))
  const cards = await page.locator('.kb-home__card').count()
  check('知识库卡片网格存在', cards > 0, cards + ' 张')
  check('首个卡片是大卡（is-featured）', await page.locator('.kb-home__card.is-featured').count() === 1)
  const metrics = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-home__card')).slice(0, 2).map((c) => (c.querySelector('.kb-card__metrics') || { innerText: '' }).innerText.replace(/\s+/g, ' ').trim()))
  check('卡片显示实体/关系/文档/就绪徽标', metrics.length > 0 && /实体/.test(metrics[0]) && /关系/.test(metrics[0]) && /文档/.test(metrics[0]), metrics.join(' | '))
  await page.screenshot({ path: SHOTS + 'ui-01-list.png', fullPage: false })
  console.log('     统计卡: ' + stats.join(' | '))
  console.log('     卡片徽标: ' + metrics.join(' | '))

  console.log('\n== 2) 进入知识库：双栏 + 状态分栏 ==')
  await page.evaluate((name) => {
    document.querySelectorAll('*').forEach((el) => {
      if (el.children.length === 0 && (el.textContent || '').trim() === name) {
        let p = el
        for (let i = 0; i < 8 && p; i++) {
          const btn = Array.from(p.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === '进入')
          if (btn) { btn.click(); return }
          p = p.parentElement
        }
      }
    })
  }, NAME)
  await page.waitForFunction(() => /智能问答/.test(document.body.innerText || ''), null, { timeout: 120000 }).catch(() => {})
  await page.waitForSelector('.kb-split__tree .el-tree-node, .kb-split__tree', { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(4000)
  const bodyText = await page.evaluate(() => document.body.innerText || '')
  check('右侧出现「智能问答」', bodyText.includes('智能问答'))
  check('左侧出现「文档」标题', /文档/.test(bodyText))
  check('双栏容器存在', await page.locator('.kb-split').count() > 0)
  check('问答面板存在', await page.locator('.kb-ask').count() > 0)
  const filters = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-split__filter')).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()))
  check('有 全部/已索引/解析中/失败 四个分栏', filters.length === 4, filters.join(' | '))
  check('分栏带计数', filters.every((s) => /\d/.test(s)), filters.join(' | '))
  console.log('     分栏: ' + filters.join(' | '))
  check('文件出现在列表里', bodyText.includes('preview-demo.md'), '')
  // 回归锁：左栏双栏下只有 ~430px，五列固定宽会把 1fr 的名称列压成 0 宽，文件名看不见
  const nameWidth = await page.evaluate(() => {
    const el = document.querySelector('.kb-split__tree .file-row span.truncate')
    return el ? Math.round(el.getBoundingClientRect().width) : -1
  })
  check('文件名列没有被压成 0 宽', nameWidth > 40, nameWidth + 'px')
  check('快捷提问胶囊存在', await page.locator('.kb-split .kb-ask__quick-btn').count() > 0)
  await page.screenshot({ path: SHOTS + 'ui-02-split.png' })

  // 分栏按钮必须真的过滤列表（之前只改了 ref，点了不生效）
  const rowCount = async () => page.locator('.kb-split__tree .file-row').count()
  const rowTexts = async () => page.evaluate(() => Array.from(document.querySelectorAll('.kb-split__tree .file-row')).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()))
  const clickFilter = async (label) => {
    await page.locator('.kb-split__filter', { hasText: label }).first().click({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1500)
  }
  const allRows = await rowCount()
  await clickFilter('已索引')
  const indexedRows = await rowCount()
  await clickFilter('失败')
  const failedRows = await rowCount()
  const failedText = await rowTexts()
  await clickFilter('全部')
  const backRows = await rowCount()
  console.log('     全部 ' + allRows + ' 行 -> 已索引 ' + indexedRows + ' 行 -> 失败 ' + failedRows + ' 行 -> 全部 ' + backRows + ' 行')
  console.log('     「失败」分栏内容: ' + failedText.join(' || '))
  check('「已索引」分栏真的过滤了列表', allRows > indexedRows, allRows + ' -> ' + indexedRows)
  check('「失败」分栏能筛出解析失败的文件', failedRows > 0 && failedRows < allRows, failedRows + ' 行')
  check('「失败」分栏显示的是 empty.md', failedText.join(' ').includes('empty.md'), failedText.join(' || '))
  check('「全部」能恢复完整列表', backRows === allRows, allRows + ' <- ' + backRows)
  await page.screenshot({ path: SHOTS + 'ui-02b-filter.png' })

  console.log('\n== 3) 文件预览 ==')
  // 点 .file-row（那个挂了 @click 的元素），不要用 getByText：
  // 名称是列内的 <span>，列宽被压缩时它的宽度会是 0，Playwright 判定不可点击直接超时。
  await page.locator('.kb-split__tree .file-row', { hasText: 'preview-demo.md' }).first().click({ timeout: 15000 })
  await page.waitForTimeout(3000)
  const dlgCount = await page.locator('.l-dialog').count()
  check('弹出预览对话框', dlgCount >= 1, dlgCount + ' 个')
  const pv = await page.evaluate(() => {
    const ds = document.querySelectorAll('.l-dialog')
    const d = ds[ds.length - 1]
    if (!d) { return { text: '', html: '', missing: true } }
    const body = d.querySelector('.kb-preview__body')
    return { text: (d.innerText || '').replace(/\s+/g, ' ').slice(0, 200), html: body ? body.innerHTML : '', missing: false }
  })
  check('预览里有原文内容', !pv.missing && (pv.text.includes('桃园结义') || pv.text.includes('三国演义')), pv.missing ? '对话框不存在' : pv.text.slice(0, 120))
  check('Markdown 渲染成标题标签', /<h1|<h2/.test(pv.html), pv.html.slice(0, 100))
  check('Markdown 渲染成列表', /<li>/.test(pv.html), '')
  await page.screenshot({ path: SHOTS + 'ui-03-preview.png' })
  // 关掉
  await page.locator('.l-dialog').last().locator('button').filter({ hasText: '关闭' }).first().click({ timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1200)

  console.log('\n== 4) 智能问答 ==')
  const qbox = page.locator('.kb-ask__composer textarea')
  check('有提问输入框', await qbox.count() > 0)
  await qbox.fill('桃园结义是谁的？')
  await page.locator('.kb-ask__send').click({ timeout: 10000 })
  // 不能固定等 2.5s 再断言：模型快的时候 2.5s 内回答已经回来了，骨架屏已消失，会假红。
  // 改成点击后 1.2s 内轮询，只要出现过骨架屏就算通过。
  let sawLoading = false
  for (let i = 0; i < 12; i++) {
    if (await page.locator('.kb-ask__a .el-skeleton').count() > 0) { sawLoading = true; break }
    await page.waitForTimeout(100)
  }
  check('提问后进入 loading', sawLoading, sawLoading ? '' : '1.2s 内未出现骨架屏')
  await page.screenshot({ path: SHOTS + 'ui-04-ask-loading.png' })
  // 等回答（LLM 可能要 30~120s）
  let done = false
  for (let i = 0; i < 40; i++) {
    await sleep(5000)
    const has = await page.locator('.kb-ask__text').count()
    if (has > 0) { done = true; break }
  }
  check('拿到回答', done, done ? '' : '超时 200s')
  if (done) {
    const ans = await page.evaluate(() => { const e = document.querySelector('.kb-ask__text'); return e ? e.innerText : '' })
    check('回答非空', ans.trim().length > 0, ans.slice(0, 100))
    const cites = await page.locator('.kb-ask__cite').count()
    check('有引用来源角标', cites > 0, cites + ' 条')
    const citeText = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-ask__cite')).map((e) => e.innerText.trim()).join(' | '))
    console.log('     引用: ' + citeText)
    check('引用指向本库文件', citeText.includes('preview-demo'), citeText)
    await page.screenshot({ path: SHOTS + 'ui-05-ask-answer.png' })
    // 点引用开预览
    await page.locator('.kb-ask__cite').first().click({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const citeDlg = await page.evaluate(() => {
      const ds = document.querySelectorAll('.l-dialog')
      const d = ds[ds.length - 1]
      return d ? (d.innerText || '').slice(0, 150) : ''
    })
    check('点引用能打开原文预览', citeDlg.includes('桃园结义') || citeDlg.includes('三国演义'), citeDlg.slice(0, 90))
    await page.screenshot({ path: SHOTS + 'ui-06-cite-preview.png' })
  }

  console.log('\n== 5) 暗色模式 ==')
  await page.evaluate(() => { document.querySelectorAll('.l-dialog button').forEach((b) => { if ((b.innerText || '').trim() === '关闭') b.click() }) })
  await page.waitForTimeout(1000)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(2000)
  await page.screenshot({ path: SHOTS + 'ui-07-dark.png' })
  const darkHasHardcode = await page.evaluate(() => {
    // 抽查双栏面板里是否还有内联写死的浅色背景
    const els = Array.from(document.querySelectorAll('.kb-split, .kb-ask, .kb-stat'))
    return els.filter((e) => /background:\s*(#fff|white|rgb\(255,\s*255,\s*255\))/i.test(e.getAttribute('style') || '')).length
  })
  check('双栏区无写死白色底', darkHasHardcode === 0, darkHasHardcode + ' 处')
  await page.evaluate(() => document.documentElement.classList.remove('dark'))

  console.log('\n== 6) 清理 ==')
  await api('/api/knowledge/bases/' + KID + '?purge=true', tok, 'DELETE')
  await sleep(1000)

  const real = errs.filter((e) => !/Failed to load resource|ERR_ABORTED|ResizeObserver|favicon|settings\/appearance|settings\/browser/.test(e))
  check('无相关控制台错误', real.length === 0, 'count=' + real.length)
  real.slice(0, 6).forEach((e) => console.log('     ' + e))

  console.log(`\n==== ${PASS.length} PASS / ${FAIL.length} FAIL ====`)
  if (FAIL.length) console.log('失败项: ' + FAIL.join(' | '))
  await browser.close()
  process.exit(FAIL.length ? 1 : 0)
})().catch((e) => { console.error('ERR', e.message); process.exit(2) })
