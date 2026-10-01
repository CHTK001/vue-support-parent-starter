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
 * <p>颜色一律走 Element Plus / koi 变量，暗色自动跟随。</p>
 */
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { Promotion, Search, Position, ChatLineSquare, Loading } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { usePopup } from '@/composables/usePopup'
import KBFilePreview from './KBFilePreview.vue'

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

const { toast } = usePopup()

/** 一次问答的记录 */
interface Turn {
  id: number
  question: string
  answer: string
  loading: boolean
  elapsed?: number
  citations: Array<{ index?: number; doc_path?: string; file_name?: string; score?: number; snippet?: string }>
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
  if (picked[1]) qs.push(`列出与${picked[1]}有关的实体`)
  if (picked[2]) qs.push(`${picked[1]}与${picked[2]}之间是什么关系`)
  return qs.slice(0, 3)
})

/** 是否已问过 */
const hasTurns = computed(() => turns.value.length > 0)

/** 当前最后一轮的迷你子图（只在该轮有引用时算） */
const miniGraph = computed(() => {
  const last = turns.value[turns.value.length - 1]
  if (!last || last.citations.length === 0) return { nodes: [] as any[], edges: [] as any[] }
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

/**
 * 当前轮次命中的引用文件名（迷你图上方的来源角标）。
 */
const activeCitationNames = computed(() => {
  const last = turns.value[turns.value.length - 1]
  if (!last) return []
  return last.citations.map((c) => String(c.file_name || c.doc_path || '')).filter(Boolean)
})

/**
 * 提交提问。
 *
 * @param q 提问内容；缺省用输入框的值
 */
async function submit(q?: string) {
  const text = String(q ?? question.value).trim()
  if (!text || asking.value) return
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
    turn.answer = '提问失败：' + (e?.response?.data?.message || e?.message || '未知错误')
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
  if (!path) return
  previewPath.value = path
  previewVisible.value = true
}

/**
 * 清空问答记录。
 */
function clearTurns() {
  turns.value = []
}

// 切换知识库时清空，避免上一个库的答案串到下一个库
watch(() => props.kbId, () => clearTurns())
</script>

<template>
  <div class="kb-ask">
    <!-- 标题栏 -->
    <div class="kb-ask__head">
      <div class="kb-ask__title">
        <h2>智能问答</h2>
        <span class="kb-ask__badge">
          <i class="kb-ask__dot" />已接入{{ kbName || '本知识库' }}
        </span>
      </div>
      <el-button v-if="hasTurns" link @click="clearTurns">清空</el-button>
    </div>

    <!-- 问答记录 -->
    <div class="kb-ask__body">
      <template v-if="!hasTurns">
        <el-empty :image-size="72" description="基于本知识库提问，回答会附带引用来源" />
      </template>

      <div v-for="turn in turns" :key="turn.id" class="kb-ask__turn">
        <!-- 提问 -->
        <div class="kb-ask__q">{{ turn.question }}</div>

        <!-- 回答 -->
        <div class="kb-ask__a">
          <el-skeleton v-if="turn.loading" :rows="3" animated />
          <template v-else>
            <p class="kb-ask__text">{{ turn.answer }}</p>

            <!-- 引用来源 -->
            <div v-if="turn.citations.length" class="kb-ask__cites">
              <button
                v-for="c in turn.citations"
                :key="c.doc_path + String(c.index)"
                type="button"
                class="kb-ask__cite"
                :title="`${c.doc_path}（相似度 ${c.score ?? '-'}）\n${c.snippet || ''}`"
                @click="openCitation(String(c.doc_path || ''))"
              >
                <el-icon><Document /></el-icon>
                <span class="truncate">{{ c.file_name || c.doc_path }}</span>
              </button>
            </div>

            <!-- 迷你关系图：只在本轮引用命中实体时出现 -->
            <div v-if="miniGraph.nodes.length > 1" class="kb-ask__mini">
              <div class="kb-ask__mini-tags">
                <span class="kb-ask__mini-label">关联实体</span>
                <el-tag v-for="n in miniGraph.nodes.slice(0, 6)" :key="n.id" size="small" effect="plain">
                  {{ n.text }}
                </el-tag>
              </div>
              <div class="kb-ask__mini-canvas">
                <ReRelationGraph
                  :nodes="miniGraph.nodes"
                  :edges="miniGraph.edges"
                  height="180px"
                />
              </div>
              <el-button link type="primary" class="kb-ask__mini-link">
                <el-icon><Position /></el-icon>在关系图谱中查看
              </el-button>
            </div>

            <div v-if="turn.elapsed" class="kb-ask__meta">耗时 {{ (turn.elapsed / 1000).toFixed(1) }}s</div>
          </template>
        </div>
      </div>
    </div>

    <!-- 快捷提问 -->
    <div v-if="!hasTurns" class="kb-ask__quick">
      <button v-for="q in quickQuestions" :key="q" type="button" class="kb-ask__quick-btn" @click="submit(q)">
        <el-icon><component :is="q.includes('总结') ? ChatLineSquare : q.includes('时间线') ? Promotion : Search" /></el-icon>
        <span class="truncate">{{ q }}</span>
      </button>
    </div>

    <!-- 输入框 -->
    <div class="kb-ask__composer">
      <el-input
        v-model="question"
        type="textarea"
        :rows="2"
        resize="none"
        placeholder="基于本知识库提问，支持引用文档与图谱"
        :disabled="asking"
        @keydown.enter.exact.prevent="submit()"
      />
      <el-button
        type="primary"
        circle
        :loading="asking"
        :disabled="!question.trim()"
        class="kb-ask__send"
        @click="submit()"
      >
        <el-icon v-if="!asking"><Promotion /></el-icon>
      </el-button>
    </div>

    <!-- 引用原文预览 -->
    <KBFilePreview
      v-model="previewVisible"
      :kb-id="kbId"
      :path="previewPath"
    />
  </div>
</template>

<style scoped>
.kb-ask {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, 12px);
  overflow: hidden;
}

.kb-ask__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.kb-ask__title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.kb-ask__title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-ask__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-ask__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-success);
}

.kb-ask__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px;
}

.kb-ask__turn + .kb-ask__turn {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.kb-ask__q {
  display: inline-block;
  max-width: 86%;
  margin-left: auto;
  padding: 9px 14px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.kb-ask__a {
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
}

.kb-ask__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.kb-ask__cites {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.kb-ask__cite {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 220px;
  padding: 5px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.kb-ask__cite:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.kb-ask__mini {
  margin-top: 14px;
  padding: 12px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
}

.kb-ask__mini-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.kb-ask__mini-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-ask__mini-canvas {
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-bg-color);
  overflow: hidden;
}

.kb-ask__mini-link {
  margin-top: 6px;
  font-size: 12px;
}

.kb-ask__meta {
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}

.kb-ask__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 12px;
}

.kb-ask__quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 7px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), border-color var(--el-transition-duration, 0.2s);
}

.kb-ask__quick-btn:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.kb-ask__composer {
  position: relative;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.kb-ask__send {
  position: absolute;
  right: 30px;
  bottom: 26px;
}
</style>
