<!-- KnowledgeBasePage/KBSearchDialog.vue -->
<template>
  <ReDialog
    v-model="dialogVisible"
    :title="t('knowledge.search.title')"
    :width="700"
    :close-on-click-modal="false"
  >
    <!-- 搜索区 -->
    <div class="flex flex-col gap-4">
      <el-form :model="searchForm" label-width="80px">
        <el-form-item :label="t('knowledge.search.kbLabel')">
          <el-select v-model="searchForm.kbId" :placeholder="t('knowledge.search.kbPlaceholder')" class="w-full" @change="handleKBChange">
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('knowledge.search.contentLabel')">
          <el-input
            v-model="searchForm.query"
            type="textarea"
            :rows="3"
            :placeholder="t('knowledge.search.contentPlaceholder')"
            @keyup.enter.ctrl="handleSearch"
          />
        </el-form-item>

        <el-form-item :label="t('knowledge.search.resultCount')">
          <el-slider v-model="searchForm.topK" :min="1" :max="20" :step="1" show-input />
        </el-form-item>
      </el-form>

      <div class="flex justify-end">
        <ReButton type="primary" :icon="Search" :loading="isSearching" :disabled="!canSearch" @click="handleSearch">
          {{ t('knowledge.search.searchBtn') }}
        </ReButton>
      </div>

      <!-- 结果区 -->
      <div v-if="searchResults.length > 0 || isSearching" class="flex flex-col">
        <div v-if="isSearching" class="flex flex-col items-center justify-center py-8 text-[var(--rm-text-secondary)]">
          <el-icon class="animate-spin text-3xl"><Loading /></el-icon>
          <p class="text-sm mt-2">{{ t('knowledge.search.searching') }}</p>
        </div>

        <div v-else class="flex flex-col">
          <div class="flex justify-between items-center gap-2 mb-3 pb-2 border-b border-[var(--rm-border-light)]">
            <span class="text-sm font-medium">{{ t('knowledge.search.foundResults', { count: searchResults.length }) }}</span>
            <ReButton link @click="clearResults">{{ t('knowledge.search.clearResults') }}</ReButton>
          </div>

          <div class="max-h-[400px] overflow-y-auto flex flex-col gap-2">
            <div
              v-for="(result, index) in searchResults"
              :key="index"
              class="re-surface re-surface--dense re-surface--hover cursor-pointer flex flex-col gap-2"
              @click="handleResultClick(result)"
            >
              <!-- 分数 -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <template v-if="hasHybridScores(result)">
                    <ReTag type="primary" effect="plain" size="small">
                      {{ t('knowledge.search.semantic') }} <b class="ml-1">{{ (result.semanticScore || 0).toFixed(2) }}</b>
                    </ReTag>
                    <ReTag type="success" effect="plain" size="small">
                      {{ t('knowledge.search.keyword') }} <b class="ml-1">{{ (result.keywordScore || 0).toFixed(2) }}</b>
                    </ReTag>
                    <ReTag type="warning" size="small">
                      {{ t('knowledge.search.comprehensive') }} <b class="ml-1">{{ (result.finalScore || 0).toFixed(2) }}</b>
                    </ReTag>
                  </template>
                  <ReTag v-else type="success" size="small">
                    {{ t('knowledge.search.similarity') }}: {{ ((result.similarity || 0) * 100).toFixed(1) }}%
                  </ReTag>
                </div>
                <span class="text-xs text-[var(--rm-text-disabled)]">#{{ index + 1 }}</span>
              </div>

              <!-- 来源文件 -->
              <div v-if="result.fileName || result.metadata?.fileId">
                <ReTag type="info" size="small">{{ result.fileName || t('knowledge.search.unknownFile') }}</ReTag>
              </div>

              <!-- 内容预览 -->
              <!-- eslint-disable-next-line vue/no-v-html —— highlightText 已先做 HTML 转义再高亮 -->
              <div class="kb-search-hl text-sm leading-relaxed line-clamp-3" v-html="highlightText(result.content, searchForm.query)" />

              <!-- 元数据 -->
              <div v-if="result.metadata" class="text-xs text-[var(--rm-text-disabled)]">
                <span v-if="result.metadata.chunk_index">{{ t('knowledge.search.chunk') }} #{{ result.metadata.chunk_index }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已搜索但无结果 -->
      <ReEmpty v-else-if="hasSearched" :text="`${t('knowledge.search.notFound')} · ${t('knowledge.search.notFoundHint')}`" />

      <!-- 初始态 -->
      <ReEmpty v-else :text="`${t('knowledge.search.initial')} · ${t('knowledge.search.initialHint')}`" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ReButton @click="dialogVisible = false">{{ t('common.close') }}</ReButton>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 知识库检索弹框。
 *
 * <p>风格与系统一致：弹框外壳用仓库标准 {@code ReDialog}（koi，标题栏可拖拽）；结果卡用组件库基线
 * {@code re-surface}（含 hover 态），标签与按钮用 {@code ReTag} / {@code ReButton}，
 * 空态用 {@code ReEmpty}；颜色只用 koi 令牌 {@code --rm-*} —— 原先的
 * {@code text-gray-*} / {@code dark:border-gray-700} / {@code dark:hover:border-blue-500}
 * 等硬编码类已全部移除（暗色由令牌自动跟随）。</p>
 *
 * <p>顺带修 {@code highlightText}：原实现在「无关键词 / 无文本」分支直接返回未转义文本
 * （{@code return text}）而模板用 {@code v-html} 渲染，是一处 XSS 面；
 * 现改为与主路径一致地先做 HTML 转义。</p>
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Loading } from '@element-plus/icons-vue'
import type { KnowledgeBase } from '@/stores/knowledgeBase'
import { usePopup } from '@/composables/usePopup'
import { apiService } from '@/services/ApiService'
import ReDialog from '@repo/ui/re-dialog'
import ReButton from '@/components/re/ReButton.vue'
import ReTag from '@/components/re/ReTag.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'

const { t } = useI18n()

/** 检索结果条目 */
interface SearchResult {
  /** 命中片段 */
  content: string
  /** 元数据 */
  metadata: Record<string, any>
  /** 旧版相似度字段（兼容纯语义搜索） */
  similarity?: number
  /** 语义分数 */
  semanticScore?: number
  /** 关键词分数 */
  keywordScore?: number
  /** 综合分数 */
  finalScore?: number
  /** 来源文件名 */
  fileName?: string
}

/** 组件属性 */
interface Props {
  /** 是否显示（v-model） */
  modelValue: boolean
  /** 知识库列表 */
  knowledgeBases: KnowledgeBase[]
  /** 默认选中的知识库 ID */
  defaultKbId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 同步显示状态 */
  'update:modelValue': [value: boolean]
  /** 点击某条结果 */
  resultClick: [result: SearchResult]
}>()

const { toast } = usePopup()

/** 弹框显隐 */
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/** 搜索表单 */
const searchForm = ref({
  kbId: props.defaultKbId || '',
  query: '',
  topK: 10,
})

/** 是否搜索中 */
const isSearching = ref(false)
/** 是否已执行过搜索 */
const hasSearched = ref(false)
/** 搜索结果 */
const searchResults = ref<SearchResult[]>([])

/** 是否可以执行搜索（需选定知识库且关键词非空） */
const canSearch = computed(() => {
  return Boolean(searchForm.value.kbId) && searchForm.value.query.trim().length > 0
})

/** 切换知识库时清空上次结果，避免结果与当前库不对应 */
function handleKBChange() {
  clearResults()
}

/** 执行搜索 */
async function handleSearch() {
  if (!canSearch.value) {
    toast.warning(t('knowledge.search.selectKbWarning'))
    return
  }

  isSearching.value = true
  hasSearched.value = false
  searchResults.value = []

  try {
    const response = await apiService.searchKnowledgeBase(
      searchForm.value.kbId,
      searchForm.value.query.trim(),
      searchForm.value.topK,
    )

    searchResults.value = response.results || []
    hasSearched.value = true

    if (searchResults.value.length === 0) {
      toast.info(t('knowledge.search.notFound'))
    } else {
      toast.success(t('knowledge.search.foundResults', { count: searchResults.value.length }))
    }
  } catch (error: any) {
    console.error('搜索失败:', error)
    toast.error(error.response?.data?.detail || t('knowledge.search.searchFailed'))
  } finally {
    isSearching.value = false
  }
}

/** 清空搜索结果 */
function clearResults() {
  searchResults.value = []
  hasSearched.value = false
}

/**
 * 高亮匹配关键词：先整体 HTML 转义（防 XSS），再对关键词套 `<mark>`。
 *
 * @param text 原文
 * @param query 查询词（按空白切分为多个关键词）
 * @returns 转义并高亮后的 HTML
 */
function highlightText(text: string, query: string): string {
  /** 转义 HTML 特殊字符 */
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  if (!query || !text) {
    return escapeHtml(text || '')
  }

  try {
    const escapedText = escapeHtml(text)
    const keywords = query.trim().split(/\s+/).filter(k => k.length > 0)
    let highlighted = escapedText

    keywords.forEach((keyword) => {
      // 转义关键词里的正则元字符，避免构造成非法/越界正则
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escapedKeyword})`, 'gi')
      // 底色走 koi 令牌，暗色自动跟随（原先是 dark:bg-yellow-700 硬编码）
      highlighted = highlighted.replace(regex, '<mark class="kb-search-mark">$1</mark>')
    })

    return highlighted
  } catch (e) {
    console.error('高亮处理失败:', e)
    return escapeHtml(text)
  }
}

/**
 * 是否为混合搜索（三个分数齐全）。
 *
 * @param result 检索结果
 * @returns 是否混合模式
 */
function hasHybridScores(result: SearchResult): boolean {
  return result.semanticScore !== undefined &&
    result.keywordScore !== undefined &&
    result.finalScore !== undefined
}

/**
 * 处理结果点击。
 *
 * @param result 被点击的结果
 */
function handleResultClick(result: SearchResult) {
  emit('resultClick', result)
}

// 打开时补齐默认知识库；关闭时清空，避免下次打开还显示上次结果
watch(dialogVisible, (visible) => {
  if (visible) {
    if (!searchForm.value.kbId && props.defaultKbId) {
      searchForm.value.kbId = props.defaultKbId
    }
  } else {
    clearResults()
    searchForm.value.query = ''
  }
})
</script>

<style scoped>
/* 关键词高亮：由 v-html 注入，无法用 Tailwind 条件类表达，故留一条作用域规则；
   底色与前景色均走 koi 令牌，暗色自动跟随。 */
:deep(.kb-search-mark) {
  background: var(--rm-primary-light-9);
  color: var(--rm-primary);
  border-radius: 3px;
  padding: 0 2px;
}
</style>