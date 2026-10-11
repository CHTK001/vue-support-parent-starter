<script setup lang="ts">
/**
 * 库内智能问答面板。
 *
 * <p>只在本知识库范围内提问：后端 {@code POST /bases/{id}/ask} 走向量检索取回分片、
 * 交大模型作答并返回引用，本组件负责把引用渲染成可点击的角标与来源卡片，
 * 点来源直接调起原文预览。</p>
 *
 * <p>答案里的迷你关系图取自已有的图谱数据：把「引用文件里出现过的实体名」筛成子图，
 * 不额外请求后端——图谱本来就已在前端缓存里（{@code /v2/rag/graph}）。</p>
 *
 * <p><b>风格</b>：与系统一致 —— 布局用 Tailwind 工具类，容器与气泡表面用组件库基线
 * {@code re-surface}，标签/按钮/空态用 {@code @/components/re/*}（ReTag / ReButton / ReEmpty）；
 * 颜色只用 koi 令牌 {@code --rm-*}。原先 {@code .kb-ask__*} 一整套手写 BEM 已移除。</p>
 *
 * <p><b>顺带修</b>：原模板用了 {@code <Document />} 图标但 import 里没有它
 * （会触发 "Failed to resolve component"、引用角标整块不渲染），且 {@code Loading}
 * 导入后从未使用；本次补齐与清理。</p>
 */
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { Promotion, Search, Position, ChatLineSquare, Document, Delete, WarningFilled } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { usePopup } from '@/composables/usePopup'
import KBFilePreview from './KBFilePreview.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReSquareButton from '@repo/ui/re-button'
import ReTag from '@/components/re/ReTag.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'

// 关系图用 G6 内核的 ReRelationGraph（@repo/ui 提供）。
// 必须显式引入：本应用没有全局注册它（vite 的 Components() 只扫本应用 src/components，
// 该组件在 packages/ui 下），漏了会让 <ReRelationGraph> 解析失败、迷你图谱整块空白，
// 且只有控制台一条 "Failed to resolve component" 警告。
const ReRelationGraph = defineAsyncComponent(() =>
  import('@repo/ui/re-relation-graph').then((m) => m.default),
)

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
    nodes: hit.map((n) => ({ ...n, size: 44 })),
    edges: edges.map((e) => ({ ...e, size: 1 })),
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

/** 清空问答记录 */
function clearTurns() {
  turns.value = []
}

// 切换知识库时清空，避免上一个库的答案串到下一个库
watch(() => props.kbId, () => clearTurns())
</script>

<template>
  <div class="kb-ask re-surface h-full min-h-0 flex flex-col !p-0 overflow-hidden">
    <!-- 标题栏 -->
    <div class="shrink-0 flex items-center justify-between gap-2 px-5 pt-4 pb-3 border-b border-[var(--rm-border-light)]">
      <div class="flex items-baseline gap-2.5 min-w-0">
        <h2 class="m-0 text-base font-semibold">智能问答</h2>
        <span class="inline-flex items-center gap-1.5 text-xs text-[var(--rm-text-secondary)]">
          <i class="w-1.5 h-1.5 rounded-full bg-[var(--rm-success)]" />已接入{{ kbName || '本知识库' }}
        </span>
      </div>
      <ReSquareButton v-if="hasTurns" layout="square" size="small" class="kb-btn" :icon="Delete" tip="清空对话"
        @click="clearTurns" />
    </div>

    <!-- 问答记录 -->
    <div class="flex-1 min-h-0 overflow-auto px-5 py-4">
      <!-- 空态：提示语与快捷提问一起在消息区居中。
           之前 ReEmpty 贴着顶部、快捷提问单独挂在输入框上沿，
           中间空出半屏，且按钮视觉上像粘在输入框边框上。 -->
      <div
        v-if="!hasTurns"
        class="h-full min-h-72 flex flex-col items-center justify-center gap-6 pb-20"
      >
        <ReEmpty text="基于本知识库提问，回答会附带引用来源" />
        <div class="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
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
        <div class="inline-block max-w-[86%] ml-auto px-3.5 py-2.5 rounded-[var(--rm-radius-lg,12px)] bg-[var(--rm-primary-light-9)] text-sm leading-relaxed break-words">
          {{ turn.question }}
        </div>

        <!-- 回答 -->
        <div class="mt-3">
          <el-skeleton v-if="turn.loading" :rows="3" animated />
          <template v-else>
            <div
              class="re-surface re-surface--dense flex flex-col"
              :class="turn.error ? 'kb-ask__error' : ''"
            >
              <p class="m-0 text-sm leading-relaxed whitespace-pre-wrap break-words flex items-start gap-2">
                <el-icon v-if="turn.error" class="mt-0.5 shrink-0 text-[var(--rm-danger)]"><WarningFilled /></el-icon>
                <span>{{ turn.answer }}</span>
              </p>

              <!-- 引用来源 -->
              <div
                v-if="turn.citations.length"
                class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--rm-border-light)]"
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
    <div class="relative shrink-0 px-5 pt-3 pb-4 border-t border-[var(--rm-border-light)]">
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
        class="!absolute !right-[30px] !bottom-[26px]"
        @click="submit()"
      />
    </div>

    <!-- 引用原文预览 -->
    <KBFilePreview v-model="previewVisible" :kb-id="kbId" :path="previewPath" />
  </div>
</template>

<style scoped>
/* 失败态：整块气泡描边与浅底转危险色，和正常答复一眼区分 */
.kb-ask__error {
  border: 1px solid color-mix(in srgb, var(--rm-danger) 35%, transparent);
  background: color-mix(in srgb, var(--rm-danger) 6%, transparent);
  color: var(--rm-text-regular);
}
</style>