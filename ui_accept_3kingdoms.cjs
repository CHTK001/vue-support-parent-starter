// 三国全业务验收：列表页 → 双栏目录树(含嵌套目录) → 原文预览 → 智能问答引用溯源 → 关系图谱 → 暗色
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

// ── 三国语料：根目录 4 篇 + 嵌套目录 2 篇 + 1 个空文件（应落「失败」分栏） ──
const DOCS = [
  ['桃园结义.md', `# 桃园结义

桃园结义是《三国演义》中的经典情节，发生在张飞庄后的桃园中。

## 参与者

- 刘备
- 关羽
- 张飞

三人在桃园中焚香结拜，誓为异姓兄弟。

## 意义

这次结义奠定了蜀汉政权的雏形。
`],
  ['三顾茅庐.md', `# 三顾茅庐

刘备为请诸葛亮出山辅佐，**三次**到隆中拜访，世称「三顾茅庐」。

## 地点

- 隆中（今湖北襄阳西）
- 茅庐

## 结果

诸葛亮出山，提出《隆中对》。
`],
  ['赤壁之战.md', `# 赤壁之战

赤壁之战发生于东汉末年，孙权与刘备联军以少胜多击败曹操。

## 参战方

- 曹操：北方统一，率二十余万南下
- 孙权
- 刘备

## 关键人物

- 周瑜：孙刘联军总指挥
- 诸葛亮：出使曹营促成联盟
- 黄盖：诈降火攻

## 结果

曹操退回北方，奠定三国鼎立格局。
`],
  ['官渡之战.md', `# 官渡之战

官渡之战是曹操与袁绍之间的决定性战役。

## 背景

- 袁绍：占据河北，兵多粮广
- 曹操：挟天子以令诸侯

## 结果

曹操以少胜多，袁绍大军溃败，为统一北方奠定基础。
`],
  ['战役/火烧连营.md', `# 火烧连营

陆逊在夷陵之战中火烧刘备连营，蜀军大败。

## 地点

- 夷陵（今湖北宜昌）

## 关键人物

- 陆逊：东吴主帅
- 刘备：蜀汉皇帝亲征
`],
  ['人物/关羽生平.md', `# 关羽生平

关羽，字云长，河东解人。

## 重要经历

- 桃园结义，与刘备、张飞结为兄弟
- 千里走单骑，脱离曹操回归刘备
- 败走麦城，最终被东吴擒获杀害

## 评价

后世尊为「关公」，与文丑并列武圣。
`],
]
const EMPTY = '占位.md' // 空内容 → 抽取文本为空 → 后端 FAILED → 「失败」分栏

;(async () => {
  const tok = deep(await api('/v2/user/login', null, 'POST', { username: 'admin', password: 'admin123' })).accessToken
  const NAME = '三国全业务验收-' + Date.now()
  const kb = deep(await api('/api/knowledge/bases', tok, 'POST', { name: NAME, description: '三国全业务验收' }))
  const KID = kb.knowledge_base_id
  console.log('  KID=' + KID)

  console.log('\n== 0) 造语料 ==')
  for (const p of ['战役', '人物']) {
    const st = await api(`/api/knowledge/bases/${KID}/folder`, tok, 'POST', { path: p })
    check('建目录 ' + p, st && st.success !== false, '')
  }
  for (const [rel, content] of DOCS) {
    const r = await api(`/api/knowledge/bases/${KID}/file`, tok, 'PUT', { path: rel, content })
    if (!(r && r.success !== false)) check('写文件 ' + rel, false, JSON.stringify(r).slice(0, 100))
  }
  await api(`/api/knowledge/bases/${KID}/file`, tok, 'PUT', { path: EMPTY, content: '' })
  console.log('  已写入 ' + DOCS.length + ' 篇三国知识点 + 1 个空文件（含 2 个嵌套目录）')
  await sleep(6000)

  const tree = await api(`/api/knowledge/bases/${KID}/tree?path=`, tok)
  const rows = Array.isArray(tree.data) ? tree.data : (tree.data && tree.data.tree) || []
  console.log('  /tree 根目录: ' + rows.map((r) => `${r.name}${r.is_dir ? '/' : ':' + r.processing_status}`).join(' | '))
  const names = rows.map((r) => r.name)
  check('根目录 4 篇知识点 + 2 个目录 + 1 空文件', rows.length === 7, rows.length + ' 项')
  check('嵌套目录都在', names.includes('战役') && names.includes('人物'), names.join(','))
  check('知识点状态 completed', rows.filter((r) => !r.is_dir && r.name !== EMPTY).every((r) => r.processing_status === 'completed'), '')
  check('空文件状态 failed', rows.filter((r) => r.name === EMPTY).every((r) => r.processing_status === 'failed'), JSON.stringify(rows.filter((r) => r.name === EMPTY)))

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await (await browser.newContext({ viewport: { width: 1700, height: 1000 } })).newPage()
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
  await page.waitForSelector('.kb-stat', { timeout: 120000 }).catch(() => {})
  await page.waitForTimeout(3000)

  console.log('\n== 1) 列表页 ==')
  const stats = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-stat')).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()))
  check('4 张统计卡', stats.length === 4, stats.join(' | '))
  const docTotal = (stats.join(' ').match(/文档总量\s*(\d+)/) || [])[1]
  // 文档总量 = 全部文件数（6 篇知识点 + 1 个空占位文件 = 7），不是知识点数
  check('文档总量 = 7（含空占位文件）', docTotal === '7', '统计卡=' + stats.join(' | '))
  check('有「最近活动」栏且含本库', await page.evaluate((name) => {
    const e = document.querySelector('.kb-home__side')
    return !!e && (e.innerText || '').includes(name)
  }, NAME), '')
  check('大卡 is-featured 唯一', await page.locator('.kb-home__card.is-featured').count() === 1, '')
  await page.screenshot({ path: SHOTS + 'sg-01-list.png' })

  console.log('\n== 2) 详情双栏 + 目录树 ==')
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
  await page.waitForSelector('.kb-split__tree .file-row', { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(4000)
  const filters = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-split__filter')).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()))
  check('四个状态分栏', filters.length === 4, filters.join(' | '))
  // 分栏计数只算「文件」，目录不计入（目录无处理状态），所以 全部=5（4 已索引 + 1 失败），
  // 而渲染行数含目录 = 7
  check('「已索引」计数 = 4', /已索引\s*4/.test(filters.join(' ')), filters.join(' | '))
  check('「全部」计数 = 5（只算文件）', /全部\s*5/.test(filters.join(' ')), filters.join(' | '))
  check('「失败」计数 = 1', /失败\s*1/.test(filters.join(' ')), filters.join(' | '))
  const rootRows = await page.locator('.kb-split__tree .file-row').count()
  check('根目录渲染 7 行（5 文件 + 2 目录）', rootRows === 7, rootRows + ' 行')
  const nameWidth = await page.evaluate(() => {
    const el = document.querySelector('.kb-split__tree .file-row span.truncate')
    return el ? Math.round(el.getBoundingClientRect().width) : -1
  })
  check('文件名列宽度正常', nameWidth > 40, nameWidth + 'px')
  await page.screenshot({ path: SHOTS + 'sg-02-split.png' })

  console.log('\n== 3) 状态分栏真过滤（含「失败」） ==')
  const rowCount = async () => page.locator('.kb-split__tree .file-row').count()
  const clickFilter = async (label) => {
    await page.locator('.kb-split__filter', { hasText: label }).first().click({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1500)
  }
  await clickFilter('已索引')
  const idxRows = await rowCount()
  const idxText = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-split__tree .file-row')).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()))
  console.log('  已索引 ' + idxRows + ' 行: ' + idxText.join(' || '))
  check('「已索引」只留已索引文件 + 目录（2 目录仍在）', idxRows === 6 && idxText.some((t) => t.includes('占位.md')) === false, idxRows + ' 行')
  await clickFilter('失败')
  const failRows = await rowCount()
  const failText = await page.evaluate(() => Array.from(document.querySelectorAll('.kb-split__tree .file-row')).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()))
  check('「失败」只留空文件 + 2 目录', failRows === 3 && failText.join(' ').includes('占位.md'), failRows + ' 行: ' + failText.join(' || '))
  await clickFilter('全部')
  check('「全部」恢复 7 行', (await rowCount()) === 7, '')

  console.log('\n== 4) 进嵌套目录 ==')
  await page.locator('.kb-split__tree .file-row', { hasText: '战役' }).first().click({ timeout: 15000 })
  await page.waitForTimeout(3000)
  const deepText = await page.evaluate(() => document.querySelector('.kb-split__tree').innerText || '')
  check('进入「战役」目录看到嵌套知识点', deepText.includes('火烧连营'), deepText.replace(/\s+/g, ' ').slice(0, 120))
  await page.screenshot({ path: SHOTS + 'sg-03-folder.png' })

  console.log('\n== 5) 原文预览（嵌套目录里的文件） ==')
  await page.locator('.kb-split__tree .file-row', { hasText: '火烧连营' }).first().click({ timeout: 15000 })
  await page.waitForTimeout(3000)
  check('弹出预览对话框', (await page.locator('.l-dialog').count()) >= 1, '')
  const pv = await page.evaluate(() => {
    const ds = document.querySelectorAll('.l-dialog')
    const d = ds[ds.length - 1]
    if (!d) return { text: '', html: '', missing: true }
    const body = d.querySelector('.kb-preview__body')
    return { text: (d.innerText || '').replace(/\s+/g, ' ').slice(0, 220), html: body ? body.innerHTML : '', missing: false }
  })
  check('预览显示三国原文', !pv.missing && (pv.text.includes('夷陵') || pv.text.includes('陆逊')), pv.missing ? '对话框不存在' : pv.text.slice(0, 120))
  check('Markdown 渲染标题', /<h1|<h2/.test(pv.html), pv.html.slice(0, 80))
  check('Markdown 渲染列表', /<li>/.test(pv.html), '')
  await page.screenshot({ path: SHOTS + 'sg-04-preview.png' })
  await page.locator('.l-dialog').last().locator('button').filter({ hasText: '关闭' }).first().click({ timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1200)

  console.log('\n== 6) 智能问答 + 引用溯源（三国） ==')
  const qbox = page.locator('.kb-ask__composer textarea')
  const QUESTIONS = ['桃园结义是哪三个人？', '三顾茅庐刘备用了几次？', '赤壁之战是谁以少胜多？']
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i]
    await qbox.fill(q)
    await page.locator('.kb-ask__send').click({ timeout: 10000 })
    // 第 i 问的回答是第 i 个 .kb-ask__text（第 0 问就是 0 个之前，即 count > i）
    let got = false
    for (let k = 0; k < 45; k++) {
      await sleep(4000)
      const n = await page.locator('.kb-ask__text').count()
      if (n > i) { got = true; break }
    }
    // 引用取「最后一个有回答的回合」，不按下标硬取
    const ans = await page.evaluate(() => {
      const all = document.querySelectorAll('.kb-ask__text')
      return all.length ? all[all.length - 1].innerText : ''
    })
    const cite = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('.kb-ask__a')).filter((t) => t.querySelector('.kb-ask__text'))
      const t = all[all.length - 1]
      return t ? Array.from(t.querySelectorAll('.kb-ask__cite')).map((e) => e.innerText.trim()).join(' | ') : ''
    })
    console.log(`  Q${i + 1} ${q} -> ${got ? '有回答' : '超时'} | 引用: ${cite || '无'}`)
    check(`Q${i + 1} 有回答`, got && ans.trim().length > 0, ans.slice(0, 70))
    check(`Q${i + 1} 引用指向本库三国文件`, /\.md/.test(cite), cite)
    if (i === 0) {
      await page.screenshot({ path: SHOTS + 'sg-05-ask.png' })
      await page.locator('.kb-ask__cite').first().click({ timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(3000)
      const dlg = await page.evaluate(() => {
        const ds = document.querySelectorAll('.l-dialog')
        const d = ds[ds.length - 1]
        return d ? (d.innerText || '').replace(/\s+/g, ' ').slice(0, 160) : ''
      })
      check('点引用打开原文预览（内容与该知识点一致）', dlg.includes('桃园') || dlg.includes('结义'), dlg.slice(0, 100))
      await page.screenshot({ path: SHOTS + 'sg-06-cite-preview.png' })
      await page.evaluate(() => { document.querySelectorAll('.l-dialog button').forEach((b) => { if ((b.innerText || '').trim() === '关闭') b.click() }) })
      await page.waitForTimeout(1000)
    }
  }

  console.log('\n== 7) 关系图谱 ==')
  await page.locator('.el-tabs__item').filter({ hasText: '关系图谱' }).first().click({ timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(3000)
  // 计数以后端 /v2/rag/graph 为准（页面头部文案单独交叉校验），
  // 不用 innerText 去读可能被 v-show 隐藏的 tab-pane（隐藏元素 innerText 为空串）
  const readGraph = async () => {
    const r = deep(await api(`/v2/rag/graph?knowledge_base_id=${KID}`, tok)) || {}
    return { ent: r.entityCount, rel: r.relationCount, nodes: (r.nodes || []).length, placeholder: r.placeholder }
  }
  let g = await readGraph()
  console.log(`  后端 /v2/rag/graph: 实体=${g.ent} 关系=${g.rel} 节点=${g.nodes}`)
  if (g.nodes === 0) {
    const genBtn = page.getByRole('button', { name: /生成图谱|重新生成/ }).first()
    if (await genBtn.count() > 0) {
      console.log('  点「生成图谱」触发关系抽取（可能较慢）...')
      await genBtn.click({ timeout: 10000 }).catch(() => {})
      for (let k = 0; k < 45; k++) {
        await sleep(4000)
        g = await readGraph()
        if (g.nodes > 0) break
      }
      console.log(`  生成后: 实体=${g.ent} 关系=${g.rel} 节点=${g.nodes}`)
    }
  }
  check('图谱有实体', Number(g.ent) > 0, '实体=' + g.ent)
  check('图谱有关系', Number(g.rel) > 0, '关系=' + g.rel)
  const bodyTxt = await page.evaluate(() => document.body.innerText || '')
  const m = bodyTxt.match(/实体\s*(\d+)\s*[·・]\s*关系\s*(\d+)/)
  check('图谱头部显示实体/关系计数', !!m, m ? `实体 ${m[1]} · 关系 ${m[2]}` : bodyTxt.slice(0, 120))
  if (m) {
    check('头部实体数与后端一致', Number(m[1]) === Number(g.ent), `头部=${m[1]} 后端=${g.ent}`)
    check('头部关系数与后端一致', Number(m[2]) === Number(g.rel), `头部=${m[2]} 后端=${g.rel}`)
  }
  check('X6 图谱已渲染', (await page.locator('.x6rg').count()) > 0, '')
  const nodeCount = await page.locator('.x6rg .x6-node').count()
  check('图谱节点已绘制且不少于后端节点数', nodeCount > 0 && nodeCount >= g.nodes, `${nodeCount} 个节点 / 后端 ${g.nodes}`)
  await page.screenshot({ path: SHOTS + 'sg-07-graph.png' })

  console.log('\n== 8) 暗色模式 ==')
  await page.evaluate(() => { document.documentElement.classList.add('dark') })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: SHOTS + 'sg-08-dark.png' })
  await page.evaluate(() => document.documentElement.classList.remove('dark'))

  console.log('\n== 9) 清理 ==')
  await api(`/api/knowledge/bases/${KID}?purge=true`, tok, 'DELETE')
  await sleep(1500)
  // 排除项里只放两类明确的、与知识库业务无关的噪音：
  // 1) 资源加载类（favicon / 被 abort 的请求 / ResizeObserver）
  // 2) chat 页那条长连 SSE 的空闲重连：本次验收要跑 8 分钟以上，登录后停在
  //    /chat/new-session 的 /v2/events/sessions 流会因空闲被服务端断开，客户端按
  //    「第 N 次」退避重连。已核对后端日志：该窗口内后端**没有重启**（最后一次启动
  //    20:51:08，验收 20:57 才开始），所以不是被部署打断，也不属于知识库链路。
  const real = errs.filter((e) => !/Failed to load resource|ERR_ABORTED|ResizeObserver|favicon|settings\/appearance|settings\/browser/.test(e)
    && !/\[SessionEvents\] SSE 连接错误/.test(e))
  check('无相关控制台错误', real.length === 0, 'count=' + real.length)
  real.slice(0, 6).forEach((e) => console.log('     ' + e))

  console.log(`\n==== ${PASS.length} PASS / ${FAIL.length} FAIL ====`)
  if (FAIL.length) console.log('失败项: ' + FAIL.join(' | '))
  await browser.close()
  process.exit(FAIL.length ? 1 : 0)
})().catch((e) => { console.error('ERR', e.message); process.exit(2) })
