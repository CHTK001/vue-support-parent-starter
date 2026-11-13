<!--
  工作区悬停预览（用户口径 2026-11-12 1.2）。

  <p>鼠标停在顶栏「工作目录」图标上，浮出一张小卡片列出当前会话工作区里的
  文件与目录（两层、最多 40 条），和侧栏「工作区」看到的是同一份树。
  它只是「先看一眼有没有那个文件」的入口，点任意一行仍然打开右侧工作区。</p>

  <p>数据按需拉取：第一次悬停时才请求 <code>/sessions/{id}/workspace/tree</code>，
  之后 30 秒内复用；切会话立即作废。</p>
-->
<template>
  <CustomPopover :show="visible" :anchor-el="anchorEl" :width="300" align="end" :offset="8" :max-height="380"
    popper-class="whc-popover" @mouseenter="onCardEnter" @mouseleave="onCardLeave">
    <div class="whc">
      <div class="whc__head">
        <span class="whc__title">{{ t('chat.toolbar.filesTitle') }}</span>
        <span v-if="flatNodes.length" class="whc__count">{{ flatNodes.length }}</span>
      </div>

      <div v-if="loading" class="whc__state">{{ t('chat.toolbar.filesLoading') }}</div>
      <div v-else-if="error" class="whc__state">{{ t('chat.toolbar.filesFailed') }}</div>
      <div v-else-if="!flatNodes.length" class="whc__state">{{ t('chat.toolbar.filesEmpty') }}</div>
      <ul v-else class="whc__list">
        <li v-for="node in flatNodes" :key="node.path">
          <button type="button" class="whc__row" :style="{ paddingLeft: `${8 + node.depth * 14}px` }"
            :title="node.path" @click="emit('open')">
            <svg v-if="node.isDirectory" class="whc__icon is-dir" viewBox="0 0 20 20" fill="none"
              stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">
              <path d="M2.8 5.6h4.4l1.3 1.7h8.7v8.1H2.8z" />
            </svg>
            <svg v-else class="whc__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linejoin="round" aria-hidden="true">
              <path d="M5 2.8h6.2L15.2 6.8v10.4H5z M11 2.8v4.2h4.2" />
            </svg>
            <span class="whc__name">{{ node.name }}</span>
          </button>
        </li>
      </ul>

      <button type="button" class="whc__more" @click="emit('open')">{{ t('chat.toolbar.filesOpen') }}</button>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomPopover from '../../ui/CustomPopover.vue'
import { apiService } from '@/services/ApiService'

interface TreeNode {
  name?: string
  path?: string
  isDirectory?: boolean
  children?: TreeNode[]
}

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  sessionId: string | null
}>()

const emit = defineEmits<{
  open: []
  'card-enter': []
  'card-leave': []
}>()

const { t } = useI18n()

const flatNodes = ref<Array<{ name: string; path: string; isDirectory: boolean; depth: number }>>([])
const loading = ref(false)
const error = ref(false)
let loadedFor: string | null = null
let loadedAt = 0

/** 把工作区树压成两层、最多 40 行的扁平列表（只做预览，不追求完整） */
function flatten(tree: TreeNode[]): Array<{ name: string; path: string; isDirectory: boolean; depth: number }> {
  const rows: Array<{ name: string; path: string; isDirectory: boolean; depth: number }> = []
  const walk = (nodes: TreeNode[], depth: number) => {
    for (const node of nodes) {
      if (rows.length >= 40) return
      if (!node?.name) continue
      rows.push({ name: node.name, path: String(node.path || node.name), isDirectory: !!node.isDirectory, depth })
      if (depth < 1 && Array.isArray(node.children)) walk(node.children, depth + 1)
    }
  }
  walk(tree, 0)
  return rows
}

async function ensureLoaded(): Promise<void> {
  const sid = props.sessionId
  if (!sid) return
  // 同一会话 30 秒内复用，避免每次悬停都打接口
  if (loadedFor === sid && Date.now() - loadedAt < 30_000) return
  loading.value = true
  error.value = false
  try {
    const res: any = await apiService.getWorkspaceTree(sid)
    const tree: TreeNode[] = res?.tree || res?.data?.tree || []
    flatNodes.value = flatten(tree)
    loadedFor = sid
    loadedAt = Date.now()
  } catch (e) {
    console.warn('[WorkspaceHoverCard] 读取工作区失败', e)
    error.value = true
    flatNodes.value = []
  } finally {
    loading.value = false
  }
}

// 打开时才拉数据；切会话把旧结果作废
watch(() => props.visible, (visible) => {
  if (visible) void ensureLoaded()
})
watch(() => props.sessionId, () => {
  loadedFor = null
  flatNodes.value = []
})

const onCardEnter = () => emit('card-enter')
const onCardLeave = () => emit('card-leave')
</script>

<style scoped>
.whc {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 2px;
}

.whc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 8px 4px;
}

.whc__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.whc__count {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}

.whc__state {
  padding: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.whc__list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 280px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}

.whc__row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 26px;
  padding-right: 8px;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  text-align: left;
  cursor: pointer;
  outline: none;
}

.whc__row:hover {
  background: var(--el-fill-color-light);
}

.whc__icon {
  flex: none;
  width: 13px;
  height: 13px;
  color: var(--el-text-color-secondary);
}

.whc__icon.is-dir {
  color: var(--el-color-warning);
}

.whc__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.whc__more {
  margin-top: 4px;
  padding: 5px 8px 2px;
  border: none;
  border-top: 1px solid var(--el-border-color-lighter);
  background: transparent;
  color: var(--el-color-primary);
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
}

.whc__more:hover {
  text-decoration: underline;
}
</style>
