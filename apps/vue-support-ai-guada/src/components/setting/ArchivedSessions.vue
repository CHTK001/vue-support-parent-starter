<template>
  <div class="flex flex-col gap-3">
    <SettingsCard title="归档会话">
      <!-- 搜索 + 筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchKeyword" :placeholder="t('settings.archived.searchPlaceholder')" clearable
          class="flex-1 min-w-40" @keyup.enter="handleSearch" @clear="handleSearch">
          <template #prefix>
            <el-icon class="text-(--el-text-color-secondary)"><Search16Regular /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterGroupId" :placeholder="t('settings.archived.allGroups')" clearable
          style="width: 128px; flex-shrink: 0" @change="handleSearch">
          <el-option :label="t('settings.archived.allGroups')" :value="''" />
          <el-option v-for="g in sessionGroupStore.sortedGroups" :key="g.id" :label="g.name" :value="g.id" />
          <el-option :label="t('settings.archived.ungrouped')" :value="UNGROUPED_ID" />
        </el-select>
        <el-button :loading="isLoading" circle @click="loadArchivedSessions">
          <el-icon><ArrowClockwise20Regular /></el-icon>
        </el-button>
      </div>

      <!-- 批量操作 -->
      <div v-if="archivedSessions.length > 0" class="batch-bar">
        <div class="flex items-center gap-3">
          <el-checkbox v-model="selectAll" @change="handleSelectAll">{{ t('common.selectAll') }}</el-checkbox>
          <span v-if="selectedIds.size > 0" class="batch-count">
            {{ t('settings.archived.selectedCount', { n: selectedIds.size }) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <el-button type="primary" :disabled="selectedIds.size === 0" :loading="batchLoading"
            @click="handleBatchUnarchive">
            {{ t('settings.archived.batchUnarchive') }}
          </el-button>
          <el-button type="danger" :disabled="selectedIds.size === 0" :loading="batchDeleting"
            @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="isLoading" class="state-loading">
        <el-icon class="animate-spin text-2xl mr-2"><Loading /></el-icon>
        <span>{{ t('common.loading') }}</span>
      </div>

      <!-- 列表 -->
      <div v-else-if="archivedSessions.length > 0" class="arch-list">
        <div v-for="session in archivedSessions" :key="session.id" class="arch-item">
          <el-checkbox :model-value="selectedIds.has(session.id)"
            @change="(val: string | number | boolean) => toggleSelect(session.id, val)" />
          <span class="arch-title">{{ session.title }}</span>
          <span class="arch-time">{{ formatLastActive(session.lastActiveAt || session.updatedAt) }}</span>
          <button class="op-btn op-btn-primary" :title="t('settings.archived.unarchive')"
            @click="handleUnarchive(session)">
            <el-icon class="w-3.5 h-3.5"><ArrowUndo20Regular /></el-icon>
          </button>
          <button class="op-btn op-btn-danger" title="删除" @click="handleDelete(session)">
            <el-icon class="w-3.5 h-3.5"><Delete /></el-icon>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="state-empty">
        <Archive20Regular class="state-empty-ico" />
        <span>{{ hasSearched ? t('settings.archived.noMatchFound') : t('settings.archived.noArchived') }}</span>
      </div>
    </SettingsCard>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="flex justify-center pt-1">
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total"
        layout="prev, pager, next" @current-change="handlePageChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Archive20Regular, ArrowUndo20Regular, ArrowClockwise20Regular, Search16Regular } from '@vicons/fluent'
import { Loading, Delete } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { apiService } from '@/services/ApiService'
import { useSessionGroupStore } from '@/stores/sessionGroup'
import { useSessionStore, UNGROUPED_ID } from '@/stores/session'
import { usePopup } from '@/composables/usePopup'
import type { Session } from '@/types/session'
import SettingsCard from './SettingsCard.vue'

const { t } = useI18n()

const sessionGroupStore = useSessionGroupStore()
const sessionStore = useSessionStore()
const { toast, confirm } = usePopup()

const isLoading = ref(false)
const batchLoading = ref(false)
const batchDeleting = ref(false)
const archivedSessions = ref<Session[]>([])
const selectedIds = ref<Set<string>>(new Set())

const selectAll = ref(false)
const searchKeyword = ref('')
const filterGroupId = ref('')
const currentPage = ref(1)
const pageSize = 20
const total = ref(0)
const hasSearched = ref(false)

const loadArchivedSessions = async () => {
  isLoading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize
    const groupId = filterGroupId.value === '' ? undefined
      : filterGroupId.value === UNGROUPED_ID ? null
      : filterGroupId.value
    const data = await apiService.fetchArchivedSessions(skip, pageSize, searchKeyword.value.trim() || undefined, groupId)
    archivedSessions.value = data.items || []
    total.value = data.total || 0
    hasSearched.value = !!(searchKeyword.value.trim() || filterGroupId.value)
  } catch (error) {
    console.error('加载归档会话失败:', error)
    toast.error(t('settings.archived.loadFailed'))
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  selectedIds.value = new Set()
  selectAll.value = false
  loadArchivedSessions()
}

const debouncedSearch = useDebounceFn(handleSearch, 300)
watch(searchKeyword, () => {
  if (searchKeyword.value) debouncedSearch()
  else handleSearch()
})

const handlePageChange = () => {
  selectedIds.value = new Set()
  selectAll.value = false
  loadArchivedSessions()
}

const toggleSelect = (sessionId: string, val: string | number | boolean) => {
  if (val) selectedIds.value.add(sessionId)
  else selectedIds.value.delete(sessionId)
  selectedIds.value = new Set(selectedIds.value)
  selectAll.value = archivedSessions.value.length > 0 && selectedIds.value.size === archivedSessions.value.length
}

const handleSelectAll = (val: string | number | boolean) => {
  selectedIds.value = val
    ? new Set(archivedSessions.value.map(s => s.id))
    : new Set()
}

const handleUnarchive = async (session: Session) => {
  try {
    const result = await apiService.archiveSession(session.id, false)
    if (result.success && result.session) {
      sessionStore.setSession(result.session)
      if (archivedSessions.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      await loadArchivedSessions()
      toast.success(t('settings.archived.unarchived'))
    }
  } catch (error) {
    console.error('取消归档失败:', error)
    toast.error(t('settings.archived.unarchiveFailed'))
  }
}

const handleBatchUnarchive = async () => {
  if (selectedIds.value.size === 0) return

  const confirmed = await confirm(t('settings.archived.batchUnarchiveTitle'), t('settings.archived.batchUnarchiveConfirm', { n: selectedIds.value.size }), {
    type: 'info',
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel')
  })
  if (!confirmed) return

  batchLoading.value = true
  try {
    const ids = Array.from(selectedIds.value)
    const result = await apiService.batchArchiveSessions(ids, false)

    for (const id of ids) {
      if (!result.skipped.includes(id)) {
        try {
          const session = await apiService.fetchSession(id)
          sessionStore.setSession(session)
        } catch {
          // ignore
        }
      }
    }

    selectedIds.value = new Set()
    selectAll.value = false
    await loadArchivedSessions()

    if (result.skipped.length > 0) {
      toast.warning(t('settings.archived.batchUnarchivedWithSkipped', { n: result.skipped.length }))
    } else {
      toast.success(t('settings.archived.batchUnarchiveSuccess'))
    }
  } catch (error) {
    console.error('批量取消归档失败:', error)
    toast.error(t('settings.archived.batchUnarchiveFailed'))
  } finally {
    batchLoading.value = false
  }
}

const handleDelete = async (session: Session) => {
  const confirmed = await confirm('删除会话', `确定要删除会话 “${session.title}” 吗？此操作不可恢复。`, {
    type: 'warning',
    confirmText: '删除',
    cancelText: '取消'
  })
  if (!confirmed) return

  try {
    await apiService.deleteSession(session.id)
    if (archivedSessions.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    await loadArchivedSessions()
    toast.success('删除成功')
  } catch (error) {
    console.error('删除会话失败:', error)
    toast.error('删除失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.size === 0) return

  const confirmed = await confirm('批量删除', `确定要删除选中的 ${selectedIds.value.size} 个会话吗？此操作不可恢复。`, {
    type: 'warning',
    confirmText: '删除',
    cancelText: '取消'
  })
  if (!confirmed) return

  batchDeleting.value = true
  try {
    const ids = Array.from(selectedIds.value)
    await apiService.batchDeleteSessions(ids)
    selectedIds.value = new Set()
    selectAll.value = false
    await loadArchivedSessions()
    toast.success('批量删除成功')
  } catch (error) {
    console.error('批量删除失败:', error)
    toast.error('批量删除失败')
  } finally {
    batchDeleting.value = false
  }
}

function formatLastActive(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('settings.archived.justNow')
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}m`
  return t('settings.archived.earlier')
}

onMounted(() => {
  sessionGroupStore.loadGroups()
  loadArchivedSessions()
})
</script>

<style scoped>
/* 筛选栏 */
.filter-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.batch-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.batch-count { font-size: 12px; color: var(--el-text-color-secondary); }

/* 状态 */
.state-loading {
  display: flex; align-items: center; justify-content: center;
  padding: 42px 0; color: var(--el-text-color-secondary); font-size: 13px;
}
.state-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 0; color: var(--el-text-color-secondary); font-size: 13px; gap: 12px;
}
.state-empty-ico { width: 40px; height: 40px; opacity: 0.35; }

/* 列表 */
.arch-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  transition: background 0.16s ease;
}
.arch-item:hover { background: var(--el-fill-color-light); }
.arch-title {
  flex: 1; font-size: 13.5px; color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.arch-time { font-size: 12px; color: var(--el-text-color-secondary); flex-shrink: 0; width: 46px; text-align: right; }

.op-btn {
  /* 原值 7px → sm 档 */
  width: 26px; height: 26px; border: none; border-radius: var(--el-radius-sm, 6px); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; transition: background 0.16s ease, color 0.16s ease;
}
.op-btn-primary { color: var(--el-color-primary); }
.op-btn-primary:hover { background: var(--el-color-primary-light-9); }
.op-btn-danger { color: var(--el-color-danger); }
.op-btn-danger:hover { background: var(--el-color-danger-light-9); }

/* 动效降级：系统开启「减少动态效果」时，列表行悬停底色与操作按钮底色直接到位。
   逐个列出，不写 `*` / `.arch-list *` 通配，
   避免把 el-checkbox / el-pagination / el-icon 内部 Element Plus 组件的合法过渡一起掐掉。
   这两个都只带 transition（无 animation），hover 态本身是静态样式，照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .arch-item,
  .op-btn {
    transition: none;
  }
}
</style>
