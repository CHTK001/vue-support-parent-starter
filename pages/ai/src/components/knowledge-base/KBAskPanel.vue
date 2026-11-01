<script setup lang="ts">
/**
 * 库内智能问答面板。
 *
 * <p>只在本知识库范围内提问：后端 {@code POST /bases/{id}/ask} 当前只提供一次性
 * 问答形态（实测 A/B/C 三种调法都返回整包 JSON，远端无该接口的 SSE 流式形态；
 * 日后再出流式，后端事件名以 {@code ChatStreamService} 为准，前端届时把
 * {@link submit} 改成队列消费即可，渲染层不用动）。</p>
 *
 * <p>本组件负责把引用渲染成可点击的角标与来源卡片，点来源直接调起原文预览。
 * 答案正文走会话同款 {@code MarkdownContent} 组件
 * （{@code @/components/ui/MarkdownContent.vue}，含代码高亮 + KaTeX +
 * 原始 HTML 转义防注入 + rAF 合并渲染），引用角标 {@code [n]} 在进组件前
 * 先换成带 {@code data-cite} 的徽标 span，保证「角标可读、点击可达原文」——
 * 角标序号直接对应后端 {@code citations[index]}，与来源卡片同源。</p>
 *
 * <p>答案里的迷你关系图取自已有的图谱数据：把「引用文件里出现过的实体名」筛成子图，
 * 不额外请求后端——图谱本来就已在前端缓存里（{@code /v2/rag/graph}）。</p>
 *
 * <p><b>风格</b>：与系统一致 —— 布局用 Tailwind 工具类，容器与气泡表面用组件库基线
 * 标签/按钮用 {@code @/components/ui/*}（ReTag / ReButton）；容器与气泡表面走设计层 kb-ask 系列；
 * 颜色只用 koi 令牌 {@code --rm-*}。原先 {@code .kb-ask__*} 一整套手写 BEM 已移除。</p>
 *
 * <p><b>顺带修</b>：原模板用了 {@code <Document />} 图标但 import 里没有它
 * （会触发 "Failed to resolve component"、引用角标整块不渲染），且 {@code Loading}
 * 导入后从未使用；本次补齐与清理。</p>
 */
import { computed, ref, watch } from 'vue'
import { Promotion, Search, Position, ChatLineSquare, Document, Delete, WarningFilled } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { usePopup } from '@/composables/usePopup'
import MarkdownContent from '@/components/ui/MarkdownContent.vue'
import KBFilePreview from './KBFilePreview.vue'
import ReButton from '@/components/ui/ReButton.vue'
import ReSquareButton from '@repo/ui/re-button'
import ReTag from '@/components/ui/ReTag.vue'

// 关系图谱使用 G6 内核的 ReRelationGraph（@repo/ui 已提供）。
// 该包导出的默认值本身就是 defineAsyncComponent 包过的异步组件（按主题懒加载），
// 这里直接引入即可，不要再套一层 defineAsyncComponent —— 两层会让类型退化成联合类型，
// 而且内层 loader 的返回值与 AsyncComponentLoader 契约不匹配。
import ReRelationGraph from '@repo/ui/re-relation-graph'

const props = defineProps<{
  /** 知识库ID */
  kbId: string
  /** 知识库名称，用于标题与空态文案 */
  kbName?: string
  /** 图谱节点，用于答案的迷你子图（可选） */
  graphNodes?: Array<{ id: string; text: string }>
  /** 图谱边，用于迷你子图（可选） */
  graphEdges?: Array<{ from: string; to: string; text?: string }>
}>()

const emit = defineEmits<{
  /** 「在关系图谱中查看」：请求宿主切换到知识图谱视图 */
  (e: 'view-graph'): void
}>()

const { toast } = usePopup()

/** 一次问答的记录 */
interface Turn {
  /** 轮次标识 */
  id: number
  /** 提问内容 */
  question: string
  /** 回答正文 */
  answer: string
  /** 是否加载中 */
  loading: boolean
  /** 是否失败（渲染成告警态，而非普通答复） */
  error?: boolean
  /** 后端耗时（毫秒） */
  elapsed?: number
  /** 引用来源 */
  citations: Array<{ index?: number; doc_path?: string; file_name?: string; score?: number; snippet?: string }>
}

/**
 * 把后端内部错误翻译成用户能看懂的话。
 *
 * <p>检索管线未就绪时后端会抛 {@code Node execution failed: search [pipeline=rag-query] [node=search]}
 * 这类内部串，直接展示会让人一头雾水；这里按特征归类，给出可操作的提示。
 * 后端错误体字段是 {@code msg}（不是 {@code message}），调用方需把状态码一并传入，
 * 以便在拿不到可读正文时也能给出 5xx 兜底文案。</p>
 *
 * @param raw    原始错误文案（优先取响应体 msg/message/detail）
 * @param status HTTP 状态码（可选）
 * @returns 面向用户的提示
 */
function friendlyError(raw: string, status?: number): string {
  const s = String(raw || '')
  if (/pipeline=rag-query|node=search|vector dimensions|arraycopy|jvector|LoadVectors/i.test(s)) {
    return '检索服务暂时不可用：向量索引与当前嵌入模型不一致。请在「设置中心 → 默认模型」确认嵌入模型后，重新上传文档或点「重新生成图谱」以重建索引，然后重试。'
  }
  if (/timeout|timed out|超时/i.test(s)) {
    return '问答超时：知识库较大或模型繁忙，请稍后重试，或缩小提问范围。'
  }
  if (/unauthor|401|403|权限/i.test(s)) {
    return '没有访问该知识库的权限，请确认登录状态或联系管理员。'
  }
  if (s && !/status code/i.test(s)) {
    return s
  }
  if (status && status >= 500) {
    return `服务端处理问答时出错（HTTP ${status}）：可能是检索索引未就绪或模型服务异常。请稍后重试；若持续失败，请联系管理员检查检索服务。`
  }
  return status ? `问答失败（HTTP ${status}），请稍后重试。` : '未知错误，请稍后重试。'
}

/** 问答记录列表 */
const turns = ref<Turn[]>([])
/** 输入框内容 */
const question = ref('')
/** 是否正在提问 */
const asking = ref(false)
/** 预览弹窗可见 */
const previewVisible = ref(false)
/** 预览的相对路径 */
const previewPath = ref('')

/** 快捷提问：按当前实体名动态生成，没有实体时给通用问题 */
const quickQuestions = computed(() => {
  const names = (props.graphNodes || []).map((n) => String(n.text || '')).filter(Boolean)
  const picked = names.slice(0, 3)
  if (picked.length === 0) {
    return ['总结本库核心内容', '这些文档讲了什么主题', '列出最重要的几个概念']
  }
  const qs = [`总结${picked[0]}的人物关系`, `生成关于${picked[0]}的关系时间线`]
  if (picked[1]) {
    qs.push(`列出与${picked[1]}有关的实体`)
  }
  if (picked[2]) {
    qs.push(`${picked[1]}与${picked[2]}之间是什么关系`)
  }
  return qs.slice(0, 3)
})

/** 是否已问过 */
const hasTurns = computed(() => turns.value.length > 0)

/** 当前最后一轮的迷你子图（只在该轮有引用时算） */
const miniGraph = computed(() => {
  const last = turns.value[turns.value.length - 1]
  if (!last || last.citations.length === 0) {
    return { nodes: [] as any[], edges: [] as any[] }
  }
  // 引用文件路径里出现过的实体名 → 命中即纳入子图
  const blob = last.citations.map((c) => String(c.doc_path || '') + ' ' + String(c.file_name || '')).join(' ')
  const hit = (props.graphNodes || []).filter((n) => {
    const t = String(n.text || '')
    return t.length >= 2 && blob.includes(t)
  })
  const ids = new Set(hit.map((n) => n.id))
  const edges = (props.graphEdges || []).filter((e) => ids.has(e.from) && ids.has(e.to))
  return {
    nodes: hit.map((n) => ({
      id: n.id,
      // label 供 G6 渲染；text 保留给上方来源标签列表复用
      label: String(n.text || n.id),
      text: String(n.text || n.id),
      size: 44,
      group: "hit",
    })),
    // 后端契约是 from/to，G6 契约是 source/target（缺 id 时组件按 source-target 生成）
    edges: edges.map((e) => ({
      source: String(e.from),
      target: String(e.to),
      label: String(e.text ?? ""),
    })),
  }
})

/** 当前轮次命中的引用文件名（迷你图上方的来源角标） */
const activeCitationNames = computed(() => {
  const last = turns.value[turns.value.length - 1]
  if (!last) {
    return []
  }
  return last.citations.map((c) => String(c.file_name || c.doc_path || '')).filter(Boolean)
})

/**
 * 提交提问。
 *
 * <p>当前远端只有一次性问答形态（无该接口的 SSE 实现，A/B/C 实测均为整包 JSON），
 * 所以这里是「整包回来再渲染」——不是没做流式，是后端没给流。流式形态一旦落地，
 * 只需把这里改成逐事件往 {@code turn.answer} 后追加（渲染层
 * {@code MarkdownContent} 自带 rAF 合并逐帧渲染，天然支持流式追加，不用动）。</p>
 *
 * @param q 提问内容；缺省用输入框的值
 */
async function submit(q?: string) {
  const text = String(q ?? question.value).trim()
  if (!text || asking.value) {
    return
  }
  if (!props.kbId) {
    toast.error('请先选择知识库')
    return
  }
  const turn: Turn = { id: Date.now(), question: text, answer: '', loading: true, citations: [] }
  turns.value.push(turn)
  question.value = ''
  asking.value = true
  try {
    const r = await apiService.askKnowledgeBase(props.kbId, text, 6)
    turn.answer = r?.answer || '（没有检索到相关内容）'
    turn.citations = r?.citations || []
    turn.elapsed = r?.elapsed_ms
    turn.loading = false
  } catch (e: any) {
    const d = e?.response?.data
    const raw = d?.msg || d?.message || d?.detail || d?.error || e?.message || ''
    turn.answer = friendlyError(raw, e?.response?.status)
    turn.error = true
    turn.loading = false
  } finally {
    asking.value = false
  }
}

/**
 * 打开引用原文预览。
 *
 * @param path 引用里的相对路径
 */
function openCitation(path: string) {
  if (!path) {
    return
  }
  previewPath.value = path
  previewVisible.value = true
}

/**
 * 答案正文渲染：Markdown 管线 + 引用角标着色。
 *
 * <p>后端 answer 里的 {@code [n]} 是引用角标，序号对应
 * {@code citations[index]}。这里只负责把角标换成徽标 span
 * （{@code data-cite} 留给样式与点击），真正的 Markdown 解析
 * 交给会话同款 {@code MarkdownContent} 组件
 * （{@code @/components/ui/MarkdownContent.vue}：会话气泡、
 * 思考区、时间线都在用它，含代码高亮 + KaTeX + 原始 HTML
 * 转义 + rAF 合并渲染）。顺序不能反：先着色后解析，
 * 否则徽标 span 会被转义成文本。</p>
 *
 * <p>角标与来源卡片同源（都按 {@code citations[index]}），
 * 点角标直接 {@link openCitation} 打开同一份原文——
 * 角标可读、点击可达，不再是摆设。</p>
 *
 * @param turn 目标问答轮次
 */
function citableAnswer(turn: Turn): string {
  const raw = String(turn?.answer || '')
  if (!raw) {
    return ''
  }
  const byIndex = new Map<number, number>()
  ;(turn?.citations || []).forEach((c, i) => {
    const n = Number(c?.index)
    if (Number.isFinite(n)) byIndex.set(n, i)
  })
  // 只着色「真实存在」的角标：文本里的 [981] 若 citations 里没有 index=981，
  // 就原样保留为文本，不臆造链接（后端角标与 citations 对不齐是已知现象）。
  return raw.replace(/\[(\d+)\]/g, (m, d) => {
    const n = Number(d)
    if (!byIndex.has(n)) return m
    const ci = byIndex.get(n)!
    const c = turn.citations[ci] || {}
    const name = String(c.file_name || c.doc_path || `引用 ${n}`)
    const path = String(c.doc_path || '')
    return `<span class="kb-cite" data-cite="${ci}" data-path="${path.replace(/"/g, '&quot;')}" title="${name.replace(/"/g, '&quot;')}">${n}</span>`
  })
}

/**
 * 引用角标点击（事件委托：答案是 v-html 渲染的，徽标在解析后的 DOM 里）。
 *
 * @param e 点击事件；只处理带 {@code data-cite} 的徽标
 */
function onAnswerClick(e: MouseEvent) {
  const el = (e.target as HTMLElement)?.closest?.('[data-cite]') as HTMLElement | null
  if (!el) return
  const path = el.getAttribute('data-path') || ''
  if (path) openCitation(path)
}

/** 清空问答记录 */
function clearTurns() {
  turns.value = []
}

// 切换知识库时清空，避免上一个库的答案串到下一个库
watch(() => props.kbId, () => clearTurns())
</script>

<template>
  <div class="kb-ask h-full min-h-0 flex flex-col overflow-hidden">
    <!-- 标题栏 -->
    <div class="kb-ask__head">
      <div class="flex items-baseline gap-2.5 min-w-0">
        <h2 class="kb-ask__title"><i class="dot" />智能问答</h2>
        <p class="kb-ask__sub">已接入{{ kbName || '本知识库' }}</p>
      </div>
      <ReSquareButton v-if="hasTurns" layout="square" size="small" class="kb-btn" :icon="Delete" tip="清空对话"
        @click="clearTurns" />
    </div>

    <!-- 问答记录 -->
    <div class="kb-ask__log">
      <!-- 空态：提示语与快捷提问一起在消息区居中。
           之前 ReEmpty 贴着顶部、快捷提问单独挂在输入框上沿，
           中间空出半屏，且按钮视觉上像粘在输入框边框上。 -->
      <div
        v-if="!hasTurns"
        class="kb-ask__empty"
      >
        <div>
          <p class="kb-ask__quote">基于本知识库提问，<br />回答会<span>附带引用来源</span></p>
          <p class="kb-ask__hint">检索命中的文档分片将作为引用展示，可点击查看原文</p>
        </div>
        <div class="kb-ask__quick">
          <ReButton
            v-for="q in quickQuestions"
            :key="q"
            size="small"
            round
            class="!max-w-full"
            :icon="q.includes('总结') ? ChatLineSquare : q.includes('时间线') ? Promotion : Search"
            @click="submit(q)"
          >{{ q }}</ReButton>
        </div>
      </div>

      <div
        v-for="turn in turns"
        :key="turn.id"
        class="[&+&]:mt-5 [&+&]:pt-5 [&+&]:border-t [&+&]:border-dashed [&+&]:border-[var(--rm-border-light)]"
      >
        <!-- 提问 -->
        <div class="kb-ask__q">{{ turn.question }}</div>

        <!-- 回答 -->
        <div class="mt-3">
          <el-skeleton v-if="turn.loading" :rows="3" animated />
          <template v-else>
            <div
              class="kb-ask__a"
              :class="turn.error ? 'kb-ask__error' : ''"
            >
              <p class="m-0 text-sm leading-relaxed whitespace-pre-wrap break-words flex items-start gap-2">
                <el-icon v-if="turn.error" class="mt-0.5 shrink-0 text-[var(--kb-danger)]"><WarningFilled /></el-icon>
                <!-- 答案渲染走会话同款 MarkdownContent（代码高亮 + KaTeX + HTML 转义 + rAF 合并）；
                     引用角标先由 citableAnswer 着色成徽标，再进组件解析；徽标点击走 onAnswerClick 事件委托 -->
                <span v-if="turn.error">{{ turn.answer }}</span>
                <span v-else class="kb-ask__md flex-1 min-w-0" @click="onAnswerClick"><MarkdownContent :content="citableAnswer(turn)" /></span>
              </p>

              <!-- 引用来源 -->
              <div
                v-if="turn.citations.length"
                class="kb-ask__cites"
              >
                <ReButton
                  v-for="c in turn.citations"
                  :key="c.doc_path + String(c.index)"
                  size="small"
                  round
                  :icon="Document"
                  :title="`${c.doc_path}（相似度 ${c.score ?? '-'}）\n${c.snippet || ''}`"
                  class="!max-w-[220px]"
                  @click="openCitation(String(c.doc_path || ''))"
                >{{ c.file_name || c.doc_path }}</ReButton>
              </div>

              <!-- 迷你关系图：只在本轮引用命中实体时出现 -->
              <div
                v-if="miniGraph.nodes.length > 1"
                class="mt-3.5 p-3 rounded-[var(--rm-radius-md,8px)] border border-dashed border-[var(--rm-border-light)] bg-[var(--rm-bg-subtle)]"
              >
                <div class="flex flex-wrap items-center gap-1.5 mb-2">
                  <span class="text-xs text-[var(--rm-text-secondary)]">关联实体</span>
                  <ReTag v-for="n in miniGraph.nodes.slice(0, 6)" :key="n.id" size="small" effect="plain">{{ n.text }}</ReTag>
                </div>
                <div class="rounded-[var(--rm-radius-sm,6px)] overflow-hidden bg-[var(--rm-bg-overlay)]">
                  <!-- 迷你图同样关闭按钮工具条（缩放走滚轮），保持 180px 画布干净 -->
                  <ReRelationGraph :nodes="miniGraph.nodes" :edges="miniGraph.edges" height="180px" :toolbar="false" />
                </div>
                <ReButton link type="primary" :icon="Position" size="small" class="mt-1.5" @click="emit('view-graph')">在关系图谱中查看</ReButton>
              </div>

              <div v-if="turn.elapsed" class="mt-2 text-[11px] text-[var(--rm-text-disabled)] text-right">
                耗时 {{ (turn.elapsed / 1000).toFixed(1) }}s
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 输入框 -->
    <div class="kb-ask__input">
      <el-input
        v-model="question"
        type="textarea"
        :rows="2"
        resize="none"
        placeholder="基于本知识库提问，支持引用文档与图谱"
        :disabled="asking"
        @keydown.enter.exact.prevent="submit()"
      />
      <ReButton
        type="primary"
        circle
        :icon="Promotion"
        :loading="asking"
        :disabled="!question.trim()"
        aria-label="提问"
        class="kb-ask__send !absolute !right-[30px] !bottom-[26px]"
        @click="submit()"
      />
    </div>

    <!-- 引用原文预览 -->
    <KBFilePreview v-model="previewVisible" :kb-id="kbId" :path="previewPath" />
  </div>
</template>

<style scoped>
/* 答案区排版：MarkdownContent 吐出来的节点在本组件作用域下只做两件事——
   段落间距收紧、引用角标着色。其余（代码高亮/KaTeX/表格）沿用会话全局样式，不重复造。*/
.kb-ask__md :deep(p) { margin: 0 0 0.5em; }
.kb-ask__md :deep(p:last-child) { margin-bottom: 0; }
/* 引用角标：小徽标，可点，直达原文 */
.kb-ask__md :deep(.kb-cite) {
  display: inline-block;
  min-width: 1.4em;
  margin: 0 0.15em;
  padding: 0 0.3em;
  border-radius: 999px;
  background: var(--rm-primary-soft, var(--rm-bg-subtle));
  color: var(--rm-primary);
  font-size: 0.8em;
  line-height: 1.6;
  text-align: center;
  cursor: pointer;
  vertical-align: 0.1em;
}
.kb-ask__md :deep(.kb-cite:hover) {
  background: var(--rm-primary);
  color: #fff;
}
</style>
