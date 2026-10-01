<template>
  <LDialog
    v-model="showModal"
    :title="t('knowledge.chunks.title', { name: selectedFile?.displayName })"
    width="800px"
    :close-on-click-modal="true"
    append-to-body
    @close="handleClose"
  >
    <div v-if="loading" class="min-h-[200px] flex flex-col items-center justify-center text-[var(--rm-text-secondary)]">
      <el-icon class="text-2xl"><Loading /></el-icon>
      <p class="mt-2 text-sm">{{ t('knowledge.chunks.loading') }}</p>
    </div>

    <ReEmpty v-else-if="chunks.length === 0" :text="t('knowledge.chunks.empty')" />

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="(chunk, index) in chunks"
        :key="chunk.id"
        class="re-surface re-surface--dense re-surface--hover flex flex-col"
      >
        <div class="flex justify-between items-center gap-2 pb-2 mb-2 border-b border-[var(--rm-border-light)]">
          <span class="text-sm font-mono font-bold text-[var(--rm-text-secondary)]">
            #{{ (currentPage - 1) * pageSize + index + 1 }}
          </span>
          <span class="text-xs text-[var(--rm-text-disabled)]">
            {{ t('knowledge.chunks.index') }}: {{ chunk.chunkIndex }}，{{ t('knowledge.chunks.tokenCount') }}: {{ chunk.tokenCount }}
          </span>
        </div>
        <div class="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed p-3 rounded-[var(--rm-radius-sm,4px)] bg-[var(--rm-bg-subtle)] text-[var(--rm-text)]">
          {{ chunk.content }}
        </div>
      </div>
    </div>

    <template v-if="chunks.length > 0" #footer>
      <div class="flex justify-between items-center gap-3 flex-wrap w-full">
        <div class="text-sm text-[var(--rm-text-secondary)]">
          {{ t('knowledge.chunks.pagination', {
            total: totalChunks,
            start: Math.min(totalChunks, (currentPage - 1) * pageSize + 1),
            end: Math.min(totalChunks, currentPage * pageSize),
          }) }}
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalChunks"
          layout="prev, pager, next"
          :hide-on-single-page="totalChunks <= pageSize"
          @current-change="handlePageChange"
        />
      </div>
    </template>
  </LDialog>
</template>

<script setup lang="ts">
/**
 * 文件分块内容查看。
 *
 * <p>风格与系统一致：弹框外壳用应用标准 {@code LDialog}，内部（加载态 / 空态 / 分块卡 /
 * 分页条）全部走 Tailwind 工具类 + 组件库基线 {@code re-surface} + {@code ReEmpty}；
 * 颜色只用 koi 令牌 {@code --rm-*}，不再出现硬编码暗色值
 * （原先散落的 {@code dark:text-[#6b6d75]} 一类已全部移除）。</p>
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'
import type { KBFile } from '@/stores/knowledgeBase'
import { useKnowledgeBaseStore } from '@/stores/knowledgeBase'
import { usePopup } from '@/composables/usePopup'
import { apiService } from '@/services/ApiService'
import LDialog from '@/components/ui/LDialog.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'

/** 组件属性 */
interface Props {
  /** 是否显示（v-model） */
  modelValue: boolean
  /** 目标文件 */
  selectedFile: KBFile | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  /** 同步显示状态 */
  'update:modelValue': [value: boolean]
}>()

const store = useKnowledgeBaseStore()
const { t } = useI18n()
const { toast } = usePopup()

/** 弹框显隐（内部副本） */
const showModal = ref(false)
/** 是否加载中 */
const loading = ref(false)
/** 当前页分块 */
const chunks = ref<any[]>([])
/** 分块总数 */
const totalChunks = ref(0)
/** 当前页码 */
const currentPage = ref(1)
/** 每页条数 */
const pageSize = ref(10)

// 监听外部传入的 modelValue
watch(() => props.modelValue, (newValue) => {
  showModal.value = newValue
  if (newValue && props.selectedFile) {
    // 打开弹窗时加载第一页数据
    currentPage.value = 1
    loadChunks()
  }
})

// 监听内部 showModal 变化，同步到外部
watch(showModal, (newValue) => {
  emit('update:modelValue', newValue)
})

/**
 * 加载文件分块内容。
 */
async function loadChunks() {
  if (!props.selectedFile || !store.activeKnowledgeBaseId) {
    toast.error(t('knowledge.chunks.noFileSelected'))
    return
  }

  // 已完成或处理失败的文件均可查看分块内容
  if (props.selectedFile.processingStatus !== 'completed' && props.selectedFile.processingStatus !== 'failed') {
    toast.warning(t('knowledge.chunks.fileNotReady'))
    return
  }

  loading.value = true

  try {
    // 获取分块数据，计算正确的 skip 值 (currentPage 从 1 开始，所以要减 1)
    const skip = (currentPage.value - 1) * pageSize.value
    const data = await apiService.getKBFileChunks(
      store.activeKnowledgeBaseId,
      props.selectedFile.id,
      skip,
      pageSize.value,
    )

    chunks.value = data

    // 使用文件记录中的 totalChunks 字段作为总分块数
    totalChunks.value = props.selectedFile.totalChunks || 0
  } catch (error: any) {
    console.error('获取文件分块失败:', error)
    toast.error(error.response?.data?.detail || t('knowledge.chunks.loadFailed'))
    chunks.value = []
    totalChunks.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 处理分页变化。
 *
 * @param page 目标页码
 */
async function handlePageChange(page: number) {
  currentPage.value = page
  await loadChunks()
}

/** 处理关闭事件：重置状态 */
function handleClose() {
  chunks.value = []
  totalChunks.value = 0
  currentPage.value = 1
}

// 暴露方法供父组件调用
defineExpose({
  loadChunks,
})
</script>