<script setup lang="ts">
/**
 * 方向 3「Ledger（档案台）」—— 推荐主骨架。
 *
 * <p><b>核心判断</b>：知识库用户的真实动作链是「找一份文档 → 看它讲了什么 → 就它提问」。
 * 现有 7 个平级 Tab 把这条链切碎了，每换一步都要离开当前页。本方向把它压成三栏常驻：
 * 左「库目录 + 作品录」、中「档案卡」、右「问答」。三步不换页。</p>
 *
 * <p><b>签名元素：命令条</b> —— 顶部一个可吸附输入框，<kbd>⌘K</kbd> /
 * <kbd>Ctrl</kbd>+<kbd>K</kbd> 唤起，一次检索跨「文档 / 实体 / 问答」三类结果。
 * 这是全站最快的一条路径，也是此方向唯一「敢花 boldness」的地方，其余全部克制。</p>
 *
 * <p>Phase 2 探索稿 —— mock 数据，不动真实逻辑。真实实现时命令条走
 * {@code KBSearchPanel} 已有的检索接口，三栏数据来自 store 与 selectedKB。</p>
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  MOCK_KBS, MOCK_FILES, MOCK_ENTITIES, MOCK_RELATIONS, MOCK_TURNS,
  ENTITY_LABEL, STATUS_LABEL, type MockFile,
} from './mockData'
import { fmtNum, fmtSize, fmtAgo, STATUS_TOKEN } from './shared'

const kbs = MOCK_KBS
const activeKb = ref(kbs[0])
const files = MOCK_FILES
const turns = MOCK_TURNS

const selected = ref<MockFile | null>(files[0])

/** 命令条 */
const cmdOpen = ref(false)
const cmdQuery = ref('')
const cmdInput = ref<HTMLInputElement | null>(null)

/** 跨三类检索（文档 / 实体 / 问答） */
const cmdResults = computed(() => {
  const q = cmdQuery.value.trim().toLowerCase()
  const docs = files
    .filter((f) => !q || f.displayName.toLowerCase().includes(q))
    .slice(0, 5)
    .map((f) => ({ kind: 'doc' as const, id: f.id, title: f.displayName, hint: `${f.totalChunks} 块` }))
  const ents = MOCK_ENTITIES
    .filter((e) => !q || e.text.toLowerCase().includes(q))
    .slice(0, 4)
    .map((e) => ({ kind: 'entity' as const, id: e.id, title: e.text, hint: `${ENTITY_LABEL[e.type]} · ${e.degree} 关系` }))
  const qas = turns
    .filter((t) => !q || t.question.toLowerCase().includes(q))
    .slice(0, 3)
    .map((t) => ({ kind: 'qa' as const, id: String(t.id), title: t.question, hint: '问答记录' }))
  return [
    { group: '文档', items: docs },
    { group: '实体', items: ents },
    { group: '问答', items: qas },
  ].filter((g) => g.items.length)
})

function openCmd() {
  cmdOpen.value = true
  cmdQuery.value = ''
  requestAnimationFrame(() => cmdInput.value?.focus())
}

function closeCmd() {
  cmdOpen.value = false
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    cmdOpen.value ? closeCmd() : openCmd()
  }
  if (e.key === 'Escape' && cmdOpen.value) closeCmd()
  // ↑↓ 在文档列表里移动选择（键盘优先）
  if (!cmdOpen.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    e.preventDefault()
    const i = files.findIndex((f) => f.id === selected.value?.id)
    const next = e.key === 'ArrowDown' ? Math.min(files.length - 1, i + 1) : Math.max(0, i - 1)
    selected.value = files[next]
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

/** 文档详情里展示的 token / chunk 统计（此前完全未上屏） */
const detailStats = computed(() => {
  const f = selected.value
  if (!f) return []
  return [
    { k: '切块', v: fmtNum(f.totalChunks) },
    { k: 'Tokens', v: fmtNum(f.totalTokens) },
    { k: '大小', v: fmtSize(f.fileSize) },
    { k: '上传', v: fmtAgo(f.uploadedAt) },
  ]
})

const counts = computed(() => ({
  done: files.filter((f) => f.processingStatus === 'completed').length,
  bad: files.filter((f) => f.processingStatus === 'failed').length,
}))

/**
 * 切块预览（mock）：真实实现应改为按需调用「获取文件分块」接口，
 * 这里用摘要句子拼出前几块，让「块」这个单位在档案卡里可见。
 */
const chunkPreview = computed(() => {
  const f = selected.value
  if (!f || !f.totalChunks) return []
  return [
    '宴桃园豪杰三结义，斩黄巾英雄首立功。玄德、云长、翼德邂逅于涿郡，同心协力，桃园结义。',
    '操幼时好游猎，喜歌舞，有权谋，多机变。及长，任侠放荡，不治行业，世人未之奇也。',
    '玄德三顾茅庐，孔明隆中对曰：荆州北据汉、沔，利尽南海，东连吴会，西通巴、蜀，此用武之地。',
  ].slice(0, Math.min(3, f.totalChunks))
})

/** 每块 token（mock：按总 token 均分后取整，仅示意） */
const chunkTokens = computed(() => {
  const f = selected.value
  if (!f || !f.totalChunks) return []
  const per = Math.round(f.totalTokens / f.totalChunks)
  return chunkPreview.value.map((_, i) => per + (i === 0 ? 12 : 0))
})
</script>

<template>
  <div class="lg">
    <!-- ================= 命令条（签名元素） ================= -->
    <header class="lg__bar">
      <button type="button" class="lg__cmd" @click="openCmd">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" class="lg__cmd-ico">
          <circle cx="6.8" cy="6.8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M10.4 10.4 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span>搜索文档、实体、问答记录</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div class="lg__crumbs">
        <span class="lg__chip">{{ counts.done }} 已索引</span>
        <span v-if="counts.bad" class="lg__chip lg__chip--bad">{{ counts.bad }} 失败</span>
      </div>
    </header>

    <div class="lg__cols">
      <!-- ================= 左：库目录 + 文档 ================= -->
      <aside class="lg__nav">
        <div class="nav__group">
          <h2 class="nav__title">知识库</h2>
          <button
            v-for="k in kbs"
            :key="k.id"
            type="button"
            class="nav__kb"
            :class="{ 'is-on': k.id === activeKb.id, 'is-off': !k.isActive }"
            @click="activeKb = k"
          >
            <span class="nav__kb-dot" />
            <span class="nav__kb-name">{{ k.name }}</span>
            <span v-if="!k.isActive" class="nav__kb-off">停用</span>
          </button>
        </div>

        <div class="nav__group nav__group--grow">
          <h2 class="nav__title">
            文档
            <em>{{ files.length }}</em>
          </h2>
          <button
            v-for="f in files"
            :key="f.id"
            type="button"
            class="nav__doc"
            :class="{ 'is-on': selected?.id === f.id }"
            @click="selected = f"
          >
            <span class="nav__status" :data-tone="STATUS_TOKEN[f.processingStatus]" />
            <span class="nav__doc-name">{{ f.displayName }}</span>
            <span class="nav__doc-hint">{{ STATUS_LABEL[f.processingStatus] }}</span>
          </button>
        </div>

        <div class="nav__group">
          <h2 class="nav__title">图谱</h2>
          <p class="nav__graph">{{ MOCK_ENTITIES.length }} 实体 · {{ MOCK_RELATIONS.length }} 关系</p>
        </div>
      </aside>

      <!-- ================= 中：档案卡 ================= -->
      <main class="lg__main">
        <template v-if="selected">
          <div class="card__head">
            <p class="card__path">
              {{ activeKb.name }}<span>/</span>{{ selected.relativePath || '根目录' }}
            </p>
            <h1 class="card__title">{{ selected.displayName }}</h1>
            <div class="card__state" :data-tone="STATUS_TOKEN[selected.processingStatus]">
              {{ STATUS_LABEL[selected.processingStatus] }}
              <template v-if="selected.processingStatus === 'processing'">
                · {{ selected.progressPercentage }}% · {{ selected.currentStep }}
              </template>
            </div>
          </div>

          <div class="card__stats">
            <div v-for="s in detailStats" :key="s.k" class="card__stat">
              <b>{{ s.v }}</b>
              <span>{{ s.k }}</span>
            </div>
          </div>

          <!-- 失败可原地重试 -->
          <div v-if="selected.processingStatus === 'failed'" class="card__err">
            <b>为什么失败</b>
            <p>{{ selected.errorMessage }}</p>
            <button type="button" class="card__retry">开启 OCR 后重新解析</button>
          </div>

          <section class="card__body">
            <h2 class="card__h2">摘要</h2>
            <p class="card__text">
              文档已按 {{ activeKb.chunkMaxSize }} 字上限切分为 {{ fmtNum(selected.totalChunks) }} 块，
              相邻块重叠 {{ activeKb.chunkOverlapSize }} 字以避免语义断裂；
              共 {{ fmtNum(selected.totalTokens) }} tokens，全部写入向量索引并可被问答检索。
            </p>

            <h2 class="card__h2">抽取到的实体</h2>
            <div class="card__ents">
              <span v-for="e in MOCK_ENTITIES.slice(0, 6)" :key="e.id" class="card__ent">
                {{ e.text }}<i>{{ ENTITY_LABEL[e.type] }}</i>
              </span>
            </div>

            <!-- 切块预览：让"块"这个抽象单位第一次可见（总块数此前从未上屏） -->
            <h2 class="card__h2">切块预览 <em>{{ fmtNum(selected.totalChunks) }} 块</em></h2>
            <ol class="card__chunks">
              <li v-for="(c, i) in chunkPreview" :key="i">
                <span class="card__chunk-no">{{ String(i + 1).padStart(3, '0') }}</span>
                <p class="card__chunk-text">{{ c }}</p>
                <span class="card__chunk-tok">{{ chunkTokens[i] }} tok</span>
              </li>
            </ol>

            <!-- 引用关系：哪些问答用到了它 -->
            <h2 class="card__h2">被引用 <em>{{ turns.length }} 次</em></h2>
            <ul class="card__cited">
              <li v-for="t in turns" :key="t.id">
                <span class="card__cited-q">{{ t.question }}</span>
                <span class="card__cited-t">{{ (t.elapsed / 1000).toFixed(1) }}s</span>
              </li>
            </ul>
          </section>
        </template>
        <div v-else class="card__empty">选择左侧文档查看档案</div>
      </main>

      <!-- ================= 右：问答（常驻） ================= -->
      <aside class="lg__ask">
        <h2 class="ask__title">就本库提问</h2>
        <div class="ask__turn" v-for="t in turns" :key="t.id">
          <p class="ask__q">{{ t.question }}</p>
          <p class="ask__a">{{ t.answer.split('\n')[0] }}</p>
          <div class="ask__cites">
            <span v-for="c in t.citations" :key="c.index" class="ask__cite">
              [{{ c.index }}] {{ c.fileName }}
            </span>
          </div>
          <p class="ask__meta">{{ (t.elapsed / 1000).toFixed(1) }}s</p>
        </div>
        <div class="ask__input">
          <input type="text" placeholder="输入你的问题…" />
          <button type="button">发送</button>
        </div>
      </aside>
    </div>

    <!-- ================= 命令面板 ================= -->
    <Teleport to="body">
      <div v-if="cmdOpen" class="cmd-mask" @click.self="closeCmd">
        <div class="cmd" role="dialog" aria-label="全库检索">
          <input
            ref="cmdInput"
            v-model="cmdQuery"
            class="cmd__input"
            type="text"
            placeholder="搜索文档、实体、问答…"
            @keydown.esc="closeCmd"
          />
          <div class="cmd__list">
            <section v-for="g in cmdResults" :key="g.group" class="cmd__group">
              <h3>{{ g.group }}</h3>
              <button
                v-for="r in g.items"
                :key="r.id"
                type="button"
                class="cmd__row"
                @click="closeCmd"
              >
                <span class="cmd__row-title">{{ r.title }}</span>
                <span class="cmd__row-hint">{{ r.hint }}</span>
              </button>
            </section>
            <p v-if="!cmdResults.length" class="cmd__none">没有匹配结果</p>
          </div>
          <footer class="cmd__foot">
            <span>↑↓ 移动</span><span>↵ 打开</span><span>esc 关闭</span>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.lg {
  --l-ink: var(--text-primary, #17191f);
  --l-ink2: var(--text-secondary, #5c6270);
  --l-ink3: var(--text-tertiary, #8b8f9c);
  --l-card: var(--bg-container, #fff);
  --l-line: var(--border-default, #e6e8ee);
  --l-line2: var(--border-subtle, #f0f2f7);
  --l-hover: var(--bg-hover, #f5f7fb);
  --l-blue: var(--brand-600, #2563eb);
  --l-blue-soft: var(--brand-50, #eef4ff);
  --l-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg-page, #fbfbfd);
  color: var(--l-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ---------- 顶栏 / 命令条 ---------- */
.lg__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--l-line);
  background: var(--l-card);
}

.lg__cmd {
  appearance: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(440px, 46vw);
  padding: 7px 10px;
  border: 1px solid var(--l-line);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-fill, #f6f7fb);
  color: var(--l-ink3);
  font-size: 12.5px;
  text-align: left;
  transition: border-color 140ms var(--ease-out, ease-out), background-color 140ms var(--ease-out, ease-out);
}

.lg__cmd:hover {
  border-color: color-mix(in srgb, var(--l-blue) 38%, var(--l-line));
  background: var(--l-card);
}

.lg__cmd span { flex: 1; }
.lg__cmd-ico { color: var(--l-ink3); flex-shrink: 0; }

.lg__cmd kbd {
  font-family: var(--l-mono);
  font-size: 10px;
  padding: 2px 5px;
  border: 1px solid var(--l-line);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: var(--l-card);
  color: var(--l-ink3);
}

.lg__crumbs {
  margin-left: auto;
  display: flex;
  gap: 6px;
}

.lg__chip {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
  color: var(--l-ink2);
}

.lg__chip--bad {
  background: color-mix(in srgb, var(--status-error, #dc2626) 10%, transparent);
  color: var(--status-error, #dc2626);
}

/* ---------- 三栏 ---------- */
.lg__cols {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 360px;
}

/* ---------- 左栏 ---------- */
.lg__nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 14px 10px 14px 14px;
  border-right: 1px solid var(--l-line);
  overflow-y: auto;
}

.nav__group--grow {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.nav__title {
  margin: 0 0 6px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--l-ink3);
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav__title em {
  font-style: normal;
  font-family: var(--l-mono);
  font-size: 10px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
  color: var(--l-ink2);
}

.nav__kb,
.nav__doc {
  appearance: none;
  cursor: pointer;
  width: 100%;
  border: 0;
  background: none;
  text-align: left;
  border-radius: var(--radius-sm, 6px);
  transition: background-color 140ms var(--ease-out, ease-out);
}

.nav__kb {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  font-size: 12.5px;
  color: var(--l-ink2);
}

.nav__kb:hover { background: var(--l-hover); }

.nav__kb.is-on {
  background: var(--l-blue-soft);
  color: var(--l-blue);
  font-weight: 600;
}

.nav__kb.is-off .nav__kb-name { color: var(--l-ink3); }

.nav__kb-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.65;
  flex-shrink: 0;
}

.nav__kb-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav__kb-off {
  font-size: 9.5px;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid currentColor;
  opacity: 0.7;
}

.nav__doc {
  display: grid;
  grid-template-columns: 6px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 7px;
  padding: 6px 8px;
  position: relative;
}

.nav__doc::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: 2px;
  background: var(--l-blue);
  opacity: 0;
  transform: translateX(-3px);
  transition: opacity 160ms var(--ease-out, ease-out), transform 160ms var(--ease-out, ease-out);
}

.nav__doc.is-on::before {
  opacity: 1;
  transform: translateX(0);
}

.nav__doc:hover { background: var(--l-hover); }
.nav__doc.is-on { background: var(--l-blue-soft); }

.nav__status {
  grid-row: 1 / span 2;
  align-self: center;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-info, #64748b);
}

.nav__status[data-tone='success'] { background: var(--status-success, #15803d); }
.nav__status[data-tone='warning'] { background: var(--status-warning, #b45309); }
.nav__status[data-tone='error'] { background: var(--status-error, #dc2626); }

.nav__doc-name {
  font-size: 12.5px;
  line-height: 1.35;
  color: var(--l-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav__doc-hint {
  font-size: 10px;
  color: var(--l-ink3);
}

.nav__graph {
  margin: 0;
  font-size: 11.5px;
  color: var(--l-ink2);
  font-family: var(--l-mono);
}

/* ---------- 中栏 ---------- */
.lg__main {
  padding: 20px 22px;
  overflow-y: auto;
  min-width: 0;
}

.card__path {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--l-ink3);
  font-family: var(--l-mono);
}

.card__path span { margin: 0 3px; opacity: 0.6; }

.card__title {
  margin: 0;
  font-size: 19px;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.card__state {
  margin-top: 6px;
  display: inline-block;
  font-size: 11.5px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
  color: var(--l-ink2);
}

.card__state[data-tone='success'] { background: color-mix(in srgb, var(--status-success, #15803d) 10%, transparent); color: var(--status-success, #15803d); }
.card__state[data-tone='warning'] { background: color-mix(in srgb, var(--status-warning, #b45309) 12%, transparent); color: var(--status-warning, #b45309); }
.card__state[data-tone='error'] { background: color-mix(in srgb, var(--status-error, #dc2626) 10%, transparent); color: var(--status-error, #dc2626); }

.card__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 16px 0 0;
  border: 1px solid var(--l-line);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  background: var(--l-card);
}

.card__stat {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card__stat + .card__stat { border-left: 1px solid var(--l-line2); }

.card__stat b {
  font-size: 15px;
  font-weight: 600;
  font-family: var(--l-mono);
  font-variant-numeric: tabular-nums;
}

.card__stat span {
  font-size: 10.5px;
  color: var(--l-ink3);
}

.card__err {
  margin-top: 14px;
  padding: 11px 13px;
  border: 1px solid color-mix(in srgb, var(--status-error, #dc2626) 30%, transparent);
  border-radius: var(--radius-md, 8px);
  background: color-mix(in srgb, var(--status-error, #dc2626) 5%, var(--l-card));
}

.card__err b {
  font-size: 11.5px;
  color: var(--status-error, #dc2626);
}

.card__err p {
  margin: 4px 0 8px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--l-ink2);
}

.card__retry {
  appearance: none;
  cursor: pointer;
  border: 1px solid var(--l-line);
  background: var(--l-card);
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-sm, 6px);
  color: var(--l-ink);
}

.card__h2 {
  margin: 20px 0 7px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--l-ink3);
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.card__h2 em {
  font-style: normal;
  font-family: var(--l-mono);
  font-size: 10px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
  color: var(--l-ink2);
}

/* 切块预览 */
.card__chunks {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card__chunks li {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 46px;
  gap: 9px;
  align-items: start;
  padding: 8px 10px;
  border: 1px solid var(--l-line2);
  border-radius: var(--radius-sm, 6px);
  background: var(--l-card);
}

.card__chunk-no {
  font-family: var(--l-mono);
  font-size: 10px;
  color: var(--l-ink3);
  padding-top: 1px;
}

.card__chunk-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--l-ink2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__chunk-tok {
  font-family: var(--l-mono);
  font-size: 10px;
  color: var(--l-ink3);
  text-align: right;
  padding-top: 1px;
}

/* 被引用 */
.card__cited {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card__cited li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 12px;
  color: var(--l-ink2);
}

.card__cited-q {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__cited-t {
  font-family: var(--l-mono);
  font-size: 10px;
  color: var(--l-ink3);
}

.card__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
  color: var(--l-ink2);
}

.card__ents {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card__ent {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--bg-fill, #f1f3f8);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.card__ent i {
  font-style: normal;
  font-size: 10px;
  color: var(--l-ink3);
}

.card__empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--l-ink3);
  font-size: 13px;
}

/* ---------- 右栏：问答 ---------- */
.lg__ask {
  border-left: 1px solid var(--l-line);
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
  gap: 12px;
  overflow-y: auto;
}

.ask__title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--l-ink3);
}

.ask__q {
  margin: 0 0 5px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.ask__a {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--l-ink2);
}

.ask__cites {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 8px;
}

.ask__cite {
  font-size: 11px;
  color: var(--l-blue);
  font-family: var(--l-mono);
  padding: 3px 7px;
  border-radius: var(--radius-sm, 6px);
  background: var(--l-blue-soft);
  cursor: pointer;
}

.ask__meta {
  margin: 6px 0 0;
  font-size: 10.5px;
  color: var(--l-ink3);
  font-family: var(--l-mono);
}

.ask__input {
  margin-top: auto;
  display: flex;
  gap: 6px;
}

.ask__input input {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  font-size: 12.5px;
  border: 1px solid var(--l-line);
  border-radius: var(--radius-md, 8px);
  background: var(--l-card);
  color: var(--l-ink);
}

.ask__input input:focus {
  outline: none;
  border-color: var(--l-blue);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--l-blue) 14%, transparent);
}

.ask__input button {
  appearance: none;
  cursor: pointer;
  border: 0;
  padding: 0 14px;
  border-radius: var(--radius-md, 8px);
  background: var(--l-blue);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

/* ---------- 命令面板 ---------- */
.cmd-mask {
  position: fixed;
  inset: 0;
  z-index: 6000;
  background: color-mix(in srgb, var(--overlay-bg, rgba(15, 18, 33, 0.45)) 80%, transparent);
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  backdrop-filter: blur(3px);
}

.cmd {
  width: min(560px, 92vw);
  /* 高度贴合结果数量：60vh 是上限而非固定高度（此前单条结果也撑满 60vh） */
  display: flex;
  flex-direction: column;
  background: var(--l-card, #fff);
  border: 1px solid var(--border-default, #e6e8ee);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-lg, 0 24px 48px rgba(15, 18, 33, 0.22));
  overflow: hidden;
  align-self: flex-start;
  animation: cmd-in 180ms var(--ease-out, ease-out) both;
}

@keyframes cmd-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.cmd__input {
  border: 0;
  border-bottom: 1px solid var(--border-subtle, #f0f2f7);
  padding: 14px 16px;
  font-size: 14px;
  background: none;
  color: var(--text-primary, #17191f);
}

.cmd__input:focus { outline: none; }

.cmd__list {
  overflow-y: auto;
  padding: 6px;
  max-height: 46vh;
}

.cmd__group h3 {
  margin: 8px 8px 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-tertiary, #8b8f9c);
}

.cmd__row {
  appearance: none;
  cursor: pointer;
  width: 100%;
  border: 0;
  background: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  text-align: left;
}

.cmd__row:hover,
.cmd__row:focus-visible {
  background: var(--bg-hover, #f5f7fb);
  outline: none;
}

.cmd__row-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary, #17191f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmd__row-hint {
  font-size: 10.5px;
  color: var(--text-tertiary, #8b8f9c);
  font-family: var(--l-mono, monospace);
}

.cmd__none {
  padding: 18px;
  text-align: center;
  font-size: 12.5px;
  color: var(--text-tertiary, #8b8f9c);
}

.cmd__foot {
  display: flex;
  gap: 14px;
  padding: 8px 14px;
  border-top: 1px solid var(--border-subtle, #f0f2f7);
  font-size: 10.5px;
  color: var(--text-tertiary, #8b8f9c);
  font-family: var(--l-mono, monospace);
}

/* ---------- 暗色 ---------- */
html.dark .lg {
  --l-ink: var(--text-primary, #e8edf6);
  --l-ink2: var(--text-secondary, #9aa6bd);
  --l-ink3: var(--text-tertiary, #76839c);
  --l-card: var(--bg-container, #1a1d27);
  --l-line: var(--border-default, rgba(255, 255, 255, 0.12));
  --l-line2: var(--border-subtle, rgba(255, 255, 255, 0.07));
  --l-hover: var(--bg-hover, rgba(255, 255, 255, 0.05));
  --l-blue: var(--brand-400, #60a5fa);
  --l-blue-soft: color-mix(in srgb, var(--brand-400, #60a5fa) 14%, transparent);
}

/* ---------- 响应式 ---------- */
@media (max-width: 1280px) {
  .lg__cols { grid-template-columns: 220px minmax(0, 1fr) 300px; }
}

/* 中屏：问答栏折叠为底部抽屉的入口（保持三栏心智，但不挤） */
@media (max-width: 1080px) {
  .lg__cols { grid-template-columns: 220px minmax(0, 1fr); }
  .lg__ask { display: none; }
}

/* 移动端：单栏，左栏变横向滚动条 */
@media (max-width: 760px) {
  .lg__cols { grid-template-columns: 1fr; }
  .lg__nav {
    border-right: 0;
    border-bottom: 1px solid var(--l-line);
    padding: 10px;
    max-height: 42vh;
  }
  .lg__main { padding: 14px; }
  .card__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .card__stat:nth-child(3) { border-left: 0; }
  .card__stat:nth-child(n + 3) { border-top: 1px solid var(--l-line2); }
  .lg__cmd { width: 100%; }
  .lg__cmd kbd { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .cmd { animation: none; }
  .nav__doc::before { transition: none; }
}
</style>
