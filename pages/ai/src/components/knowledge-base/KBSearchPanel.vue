<!-- KnowledgeBasePage/KBSearchPanel.vue -->
<template>
  <div class="kb-search__panel flex w-full h-full flex-1 flex-col gap-4 overflow-hidden min-h-0">
    <!-- 搜索区：查询词是单行语义，回车即搜；原来用 3 行 textarea + Ctrl+Enter，
     主按钮又只有一个无文字的方形图标，用户看不出这里能提交。 -->
    <div class="kb-search__box shrink-0">
      <div class="flex flex-col gap-3">
        <div class="kb-search__row items-start">
          <el-input
            v-model="searchForm.query"
            :placeholder="t('knowledge.search.contentPlaceholder')"
            clearable
            class="flex-1 min-w-0"
            @keyup.enter="handleSearch"
          />
          <ReButton type="primary" :icon="Search" :loading="isSearching" :disabled="!canSearch" @click="handleSearch">
            {{ t('knowledge.search.searchBtn') }}
          </ReButton>
        </div>

        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex-1 min-w-[220px] flex items-center gap-3">
            <span class="text-sm text-[var(--rm-text-secondary)] shrink-0">{{ t('knowledge.search.resultCount') }}</span>
            <el-slider v-model="searchForm.topK" :min="1" :max="20" :step="1" show-input class="flex-1" />
          </div>
        </div>
      </div>
    </div>

    <!-- 结果区 -->
    <div v-if="searchResults.length > 0 || isSearching" class="flex-1 min-h-0 overflow-hidden flex flex-col">
      <div v-if="isSearching" class="flex-1 flex flex-col items-center justify-center text-[var(--rm-text-secondary)]">
        <el-icon class="animate-spin text-3xl"><Loading /></el-icon>
        <p class="text-sm mt-2">{{ t('knowledge.search.searching') }}</p>
      </div>

      <div v-else class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div class="flex justify-between items-center gap-2 mb-3 pb-2 border-b border-[var(--rm-border-light)]">
          <span class="text-sm font-medium">{{ t('knowledge.search.foundResults', { count: searchResults.length }) }}</span>
          <ReSquareButton layout="square" size="small" class="kb-btn" :icon="Delete"
            :tip="t('knowledge.search.clearResults')" @click="clearResults" />
        </div>

        <div class="kb-search__results flex-1 overflow-y-auto flex flex-col gap-2">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="kb-search__result cursor-pointer flex flex-col gap-2"
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
                <!--
                  后端 /v2/rag/search 只回单个 score，映射层写入 finalScore 而不写 similarity，
                  所以这里不能无条件读 similarity —— 原来恒为 undefined，卡片上每条都显示
                  「相似度: 0.0%」，看着像检索失败。改为按实际可用的分数选择展示方式：
                  有真 similarity 才按百分比，否则按 finalScore 原值显示相关度（不臆造量纲）。
                -->
                <ReTag v-else-if="result.similarity != null" type="success" size="small">
                  {{ t('knowledge.search.similarity') }}: {{ (result.similarity * 100).toFixed(1) }}%
                </ReTag>
                <ReTag v-else-if="result.finalScore != null" type="success" size="small">
                  {{ t('knowledge.search.relevance') }}: {{ result.finalScore.toFixed(3) }}
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

    <!-- 已搜索但无结果：紧凑提示，不占满中栏 -->
    <div v-else-if="hasSearched" class="kb-search__hint">
      <p class="kb-search__hint-t">{{ t('knowledge.search.notFound') }}</p>
      <p class="kb-search__hint-d">{{ t('knowledge.search.notFoundHint') }}</p>
      <ul class="kb-search__tips">
        <li>换个说法再试：把长句拆成<b>人名 + 关系</b>（例如「董卓 与 吕布 的关系」）。</li>
        <li>把「返回条数」调大：它决定召回上限，太小会漏掉次要切片。</li>
        <li>确认该库已索引：左栏「文档」里状态为<b>已索引</b>的文档才参与检索。</li>
      </ul>
    </div>

    <!-- 初始态：把「怎么搜」摊开，而不是留一整块空白 -->
    <div v-else class="kb-search__hint">
      <p class="kb-search__hint-t">{{ t('knowledge.search.initial') }}</p>
      <p class="kb-search__hint-d">{{ t('knowledge.search.initialHint') }}</p>
      <ul class="kb-search__tips">
        <li><b>语义</b>按意思找，问句也能命中；<b>关键词</b>按字面找，专有名词更准。</li>
        <li>结果里的 <b>语义 / 关键词 / 综合</b> 三个分数同时列出，一眼看出它为什么被召回。</li>
        <li>点任一条结果可直接打开对应文档的原文。</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 知识库检索面板。
 *
 * <p>风格与系统一致：容器表面用组件库基线 {@code re-surface}（含 hover 态），
 * 结果卡片用 {@code ReTag}，按钮用 {@code ReButton}；
 * 颜色只用 koi 令牌 {@code --rm-*} —— 原先的 {@code dark:bg-gray-800} /
 * {@code dark:border-gray-700} / {@code dark:hover:border-blue-500} 等硬编码暗色类已全部移除。</p>
 *
 * <p>高亮逻辑见 {@code ./searchHighlight.ts}（剥 Markdown → HTML 转义 → 套 {@code <mark>}）；
 * mark 的底色走 koi 令牌，因此暗色下自动跟随。</p>
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Loading, Delete } from '@element-plus/icons-vue'
import type { KnowledgeBase } from '@/stores/knowledgeBase'
import { usePopup } from '@/composables/usePopup'
import { apiService } from '@/services/ApiService'
import { highlightText } from './searchHighlight'
import ReButton from '@repo/ui/re-button'
import ReSquareButton from '@repo/ui/re-button'
import ReTag from '@/components/ui/ReTag.vue'

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
  /** 知识库列表 */
  knowledgeBases: KnowledgeBase[]
  /** 默认检索的知识库 ID */
  defaultKbId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 点击某条结果 */
  resultClick: [result: SearchResult]
}>()

const { t } = useI18n()
const { toast } = usePopup()

/** 搜索表单 */
const searchForm = ref({
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
  return Boolean(props.defaultKbId) && searchForm.value.query.trim().length > 0
})

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
    // 使用传入的默认知识库 ID
    if (!props.defaultKbId) {
      toast.warning(t('knowledge.search.selectKbFirst'))
      return
    }

    const response = await apiService.searchKnowledgeBase(
      props.defaultKbId,
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

// 切换知识库时清空上次搜索结果，避免结果与当前库不对应
watch(() => props.defaultKbId, (newKbId, oldKbId) => {
  if (oldKbId && newKbId !== oldKbId) {
    clearResults()
    searchForm.value.query = ''
  }
})
</script>
