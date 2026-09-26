<template>
  <div class="flex flex-col gap-2">
    <!-- 新建分组 -->
    <SettingsCard title="新建分组">
      <SettingsRow label="分组名称" description="创建后可在会话列表中选择该分组，最多 20 个字符" control-flex>
        <div class="flex gap-2 w-full">
          <el-input v-model="newGroupName" placeholder="输入新分组名称" maxlength="20" show-word-limit
            @keyup.enter="handleCreateGroup" />
          <el-button type="primary" :disabled="!newGroupName.trim()" @click="handleCreateGroup">
            新建
          </el-button>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- 分组列表 -->
    <SettingsCard title="分组列表">
      <!-- 工具条 -->
      <div class="list-toolbar">
        <el-checkbox :model-value="allSelected" :indeterminate="indeterminate" @change="toggleSelectAll">
          全选
        </el-checkbox>
        <el-button v-if="selectedIds.length > 0" type="danger" plain size="small" @click="handleBatchDelete">
          批量删除（{{ selectedIds.length }}）
        </el-button>
      </div>

      <div class="group-list">
        <div v-if="groups.length === 0" class="list-empty">暂无自定义分组</div>
        <draggable v-else v-model="localGroups" item-key="id" handle=".drag-handle"
          :force-fallback="true" :fallback-tolerance="4" :animation="160"
          ghost-class="sortable-ghost" chosen-class="sortable-chosen"
          @end="onDragEnd">
          <template #item="{ element }">
            <div class="group-item" :class="{ 'is-editing': editingId === element.id }">
              <!-- 拖拽手柄 -->
              <div class="drag-handle">
                <el-icon class="w-4 h-4"><ReOrderDotsHorizontal20Regular /></el-icon>
              </div>
              <!-- 选择框 -->
              <el-checkbox :model-value="selectedIds.includes(element.id)" class="select-check"
                @change="toggleSelect(element)" @click.stop />

              <!-- 编辑模式 -->
              <template v-if="editingId === element.id">
                <el-input v-model="editingName" size="small" maxlength="20" class="flex-1"
                  @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
                <el-button type="primary" size="small" @click="saveEdit">保存</el-button>
                <el-button size="small" @click="cancelEdit">取消</el-button>
              </template>

              <!-- 展示模式 -->
              <template v-else>
                <span class="group-name">{{ element.name }}</span>
                <span class="group-sort">{{ element.sortOrder + 1 }}</span>
                <div class="group-ops">
                  <button class="op-btn" title="编辑" @click="startEdit(element)">
                    <el-icon class="w-3.5 h-3.5"><Edit16Regular /></el-icon>
                  </button>
                  <button class="op-btn op-btn-danger" title="删除" @click="handleDeleteGroup(element)">
                    <el-icon class="w-3.5 h-3.5"><Delete20Regular /></el-icon>
                  </button>
                </div>
              </template>
            </div>
          </template>
        </draggable>
      </div>

      <template #footer>
        <ul class="hints">
          <li>拖拽可调整分组顺序</li>
          <li>删除分组后，该分组下的会话将自动归入“任务列表”</li>
          <li>“任务列表”为默认分组，不可删除或重命名</li>
        </ul>
      </template>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useSessionGroupStore } from '@/stores/sessionGroup'
import { usePopup } from '@/composables/usePopup'
import { ReOrderDotsHorizontal20Regular, Edit16Regular, Delete20Regular } from '@vicons/fluent'
import type { SessionGroup } from '@/types/session'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

const sessionGroupStore = useSessionGroupStore()
const { toast, confirm } = usePopup()

const newGroupName = ref('')
const localGroups = ref<SessionGroup[]>([])
const editingId = ref<string | null>(null)
const editingName = ref('')

const groups = computed(() => sessionGroupStore.sortedGroups)

// 多选
const selectedIds = ref<string[]>([])
const allSelected = computed(() => groups.value.length > 0 && selectedIds.value.length === groups.value.length)
const indeterminate = computed(() => selectedIds.value.length > 0 && selectedIds.value.length < groups.value.length)

const toggleSelect = (group: SessionGroup) => {
  const idx = selectedIds.value.indexOf(group.id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(group.id)
}
const toggleSelectAll = (value: any) => {
  selectedIds.value = value ? groups.value.map(g => g.id) : []
}

watch(groups, (newGroups) => {
  localGroups.value = [...newGroups]
  const idSet = new Set(newGroups.map(g => g.id))
  selectedIds.value = selectedIds.value.filter(id => idSet.has(id))
}, { deep: true, immediate: true })

onMounted(() => {
  sessionGroupStore.loadGroups(true)
})

const handleCreateGroup = async () => {
  const name = newGroupName.value.trim()
  if (!name) return
  const group = await sessionGroupStore.createGroup(name)
  if (group) {
    toast.success('分组创建成功')
    newGroupName.value = ''
  } else {
    toast.error('分组创建失败')
  }
}

const startEdit = (group: SessionGroup) => {
  editingId.value = group.id
  editingName.value = group.name
}

const saveEdit = async () => {
  if (!editingId.value) return
  const name = editingName.value.trim()
  if (!name) { toast.error('分组名称不能为空'); return }
  const success = await sessionGroupStore.updateGroup(editingId.value, name)
  if (success) {
    toast.success('分组名称已更新')
    editingId.value = null
  } else {
    toast.error('更新失败')
  }
}

const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
}

const handleDeleteGroup = async (group: SessionGroup) => {
  const confirmed = await confirm('删除分组', `确定要删除分组 “${group.name}” 吗？该分组下的会话将自动归入未分组。`, {
    type: 'warning',
    confirmText: '删除',
    cancelText: '取消'
  })
  if (confirmed) {
    const success = await sessionGroupStore.deleteGroup(group.id)
    if (success) toast.success('分组已删除')
    else toast.error('删除失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  const confirmed = await confirm(
    '批量删除分组',
    `确定要删除选中的 ${selectedIds.value.length} 个分组吗？分组下的会话将自动归入未分组。`,
    { type: 'warning', confirmText: '删除', cancelText: '取消' }
  )
  if (confirmed) {
    const ids = [...selectedIds.value]
    const success = await sessionGroupStore.batchDeleteGroups(ids)
    if (success) {
      toast.success(`已删除 ${ids.length} 个分组`)
      selectedIds.value = []
    } else {
      toast.error('批量删除失败')
    }
  }
}

const onDragEnd = async () => {
  const orderedIds = localGroups.value.map(g => g.id)
  const success = await sessionGroupStore.reorderGroups(orderedIds)
  if (success) {
    toast.success('分组顺序已更新')
  } else {
    toast.error('排序更新失败')
    localGroups.value = [...groups.value]
  }
}
</script>

<style scoped>
/* 工具条 */
.list-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 16px;
  border-bottom: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
}

.group-list { max-height: 460px; overflow-y: auto; }
.list-empty { padding: 34px 0; text-align: center; font-size: 13px; color: var(--el-text-color-secondary); }

.group-item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 16px;
  border-top: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  transition: background 0.16s ease;
}
.group-item:first-child { border-top: none; }
.group-item:hover { background: var(--el-fill-color-light); }
.group-item.is-editing { background: var(--color-surface, var(--el-bg-color)); }

.drag-handle {
  cursor: grab; touch-action: none; color: var(--el-text-color-secondary);
  display: inline-flex;
}
.drag-handle:active { cursor: grabbing; }
.select-check { margin-right: 2px; }

.group-name { flex: 1; font-size: 13.5px; color: var(--el-text-color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.group-sort { font-size: 12px; color: var(--el-text-color-secondary); width: 16px; text-align: center; }

.group-ops { display: flex; align-items: center; gap: 2px; }
.op-btn {
  width: 26px; height: 26px; border: none; border-radius: 7px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--el-text-color-secondary); background: transparent;
  transition: background 0.16s ease, color 0.16s ease;
}
.op-btn:hover { background: var(--el-fill-color); color: var(--el-text-color-primary); }
.op-btn-danger:hover { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }

.hints { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
.hints li { line-height: 1.5; }
</style>

<!-- 全局：Sortable fallback 拖拽层（挂载到 body，scoped 不生效），全部走变量 -->
<style>
.sortable-ghost {
  opacity: 0.55;
  background: var(--el-color-primary-light-9) !important;
}
.sortable-ghost .group-name,
.sortable-ghost .group-sort { color: var(--el-color-primary) !important; }
.sortable-fallback {
  opacity: 0.96 !important;
  border-radius: 10px;
  box-shadow: 0 14px 34px var(--el-box-shadow-light, rgba(0, 0, 0, 0.18));
  background: var(--el-bg-color, var(--color-surface));
  border: 1px solid var(--el-border-color, var(--color-surface-border));
}
.sortable-fallback .group-item { border-top: none !important; }
.sortable-fallback.is-dragging { cursor: grabbing; }
.sortable-drag { opacity: 1 !important; }
</style>
