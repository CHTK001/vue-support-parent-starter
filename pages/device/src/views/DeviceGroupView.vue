<template>
  <div class="dvg">
    <!-- KPI -->
    <section class="dvg-kpis">
      <ReStatCard size="compact" title="分组总数" :value="String(flatTree.filter((n) => n.groupId).length)" icon="FolderOpened" icon-color="var(--el-color-primary)" />
      <ReStatCard size="compact" title="已分配设备" :value="String(assignedCount)" icon="Grid" icon-color="var(--el-color-success)" />
      <ReStatCard size="compact" title="未分组设备" :value="String(unassignedCount)" icon="QuestionFilled" icon-color="var(--el-color-warning)" />
    </section>

    <div class="dvg-body">
      <!-- 左：分组树 -->
      <section class="dvg-tree-panel">
        <header class="dvg-tree-panel__head">
          <span class="dvg-tree-panel__bar" />
          <span>设备分组</span>
          <span class="dvg-tree-panel__count">{{ flatTree.filter((n) => n.groupId).length }}</span>
          <div class="dvg-tree-panel__ops">
            <ReButton icon="Plus" layout="square" tip="新建分组" type="primary" @click="openCreate(null)" />
            <ReButton icon="RefreshRight" layout="square" tip="刷新" :loading="loading" @click="fetchTree" />
          </div>
        </header>

        <div class="dvg-tree">
          <div
            v-for="node in flatTree"
            :key="node.groupId || '__ungrouped'"
            class="dvg-tree-node"
            :class="{ 'is-active': activeGroupId === node.groupId }"
            :style="{ paddingLeft: `${10 + (node.depth || 0) * 14}px` }"
            @click="selectGroup(node)"
          >
            <span class="dvg-tree-node__icon">
              <el-icon><FolderOpened /></el-icon>
            </span>
            <span class="dvg-tree-node__name">{{ node.groupName }}</span>
            <span v-if="node.deviceCount >= 0" class="dvg-tree-node__badge">{{ node.deviceCount }}</span>
            <span class="dvg-tree-node__ops">
              <el-dropdown v-if="node.groupId" trigger="click" placement="bottom-end" @command="(cmd: string) => onNodeCommand(cmd, node)">
                <el-icon class="dvg-tree-node__more" @click.stop><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="create">新增子分组</el-dropdown-item>
                    <el-dropdown-item command="edit">重命名</el-dropdown-item>
                    <el-dropdown-item command="delete" divided style="color: var(--el-color-danger)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </span>
          </div>
        </div>
      </section>

      <!-- 右：分组内设备 -->
      <section class="dvg-device-panel">
        <header class="dvg-device-panel__head">
          <span class="dvg-device-panel__bar" />
          <span>{{ activeGroupName }}</span>
          <span v-if="activeGroupId" class="dvg-device-panel__count">{{ groupDevices.length }} 台</span>
          <div class="dvg-device-panel__ops">
            <template v-if="activeGroupId">
              <ReButton icon="Plus" layout="square" tip="分配设备" @click="openAssign" />
              <ReButton icon="Delete" layout="square" tip="清空分组" :disabled="!groupDevices.length" @click="clearGroup" />
            </template>
          </div>
        </header>

        <template v-if="activeGroupId === ''">
          <!-- 未分组：显示所有未分配设备的设备 -->
          <div class="dvg-device-list">
            <div v-if="unassignedDevices.length === 0" class="dvg-empty">
              <el-icon :size="32"><FolderOpened /></el-icon>
              <span>所有设备均已分配</span>
            </div>
            <div v-else class="dvg-grid">
              <article
                v-for="d in unassignedDevices"
                :key="d.deviceInfoId"
                class="dvg-device-card"
              >
                <div class="dvg-device-card__head">
                  <el-icon class="dvg-device-card__icon"><VideoCamera /></el-icon>
                  <span class="dvg-device-card__name">{{ d.deviceInfoName }}</span>
                  <span class="dvg-device-card__tag">未分组</span>
                </div>
                <div class="dvg-device-card__meta">{{ d.deviceInfoVendor }} · {{ d.deviceInfoIp || '无 IP' }}</div>
              </article>
            </div>
          </div>
        </template>

        <template v-else-if="activeGroupId">
          <div v-if="groupDevices.length === 0" class="dvg-empty">
            <el-icon :size="32"><VideoCamera /></el-icon>
            <span>分组内暂无设备，点右上角「分配设备」添加</span>
          </div>
          <div v-else class="dvg-device-list">
            <div class="dvg-grid">
              <article
                v-for="d in groupDevices"
                :key="d.deviceInfoId"
                class="dvg-device-card"
              >
                <div class="dvg-device-card__head">
                  <el-icon class="dvg-device-card__icon"><VideoCamera /></el-icon>
                  <span class="dvg-device-card__name">{{ d.deviceInfoName }}</span>
                  <el-icon class="dvg-device-card__check"><CircleCheck /></el-icon>
                </div>
                <div class="dvg-device-card__meta">{{ d.deviceInfoVendor }} · {{ d.deviceInfoIp || '无 IP' }}</div>
              </article>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="dvg-empty">
            <el-icon :size="32"><FolderOpened /></el-icon>
            <span>从左侧选择一个分组</span>
          </div>
        </template>
      </section>
    </div>

    <!-- 新增 / 编辑分组对话框 -->
    <ReDialog v-model="dialogVisible" :title="editingId ? '编辑分组' : '新建分组'" width="480px">
      <el-form label-position="top" class="dvg-form">
        <ReFormItem label="分组名称" required>
          <ReInput v-model="form.groupName" placeholder="例如 研发中心 / 一期机房" />
        </ReFormItem>
        <ReFormItem label="上级分组">
          <ReSelect v-model="form.groupParent" :options="groupOptions" placeholder="顶级分组（留空）" clearable />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.groupRemark" placeholder="选填" />
        </ReFormItem>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="dialogSaving" @click="onSubmit">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 分配设备对话框 -->
    <ReDialog v-model="assignVisible" title="分配设备" width="800px">
      <div class="dvg-assign-tip">全量替换：操作会覆盖该分组下已有设备，请确认。</div>
      <div class="dvg-assign-list">
        <div
          v-for="d in allDevices"
          :key="d.deviceInfoId"
          class="dvg-device-card"
          :class="{ 'is-assigned': pendingAssigned.has(d.deviceInfoId || '') }"
          @click="pendingToggle(d)"
        >
          <div class="dvg-device-card__head">
            <el-icon class="dvg-device-card__icon"><VideoCamera /></el-icon>
            <span class="dvg-device-card__name">{{ d.deviceInfoName }}</span>
            <el-icon class="dvg-device-card__check">
              <CircleCheck v-if="pendingAssigned.has(d.deviceInfoId || '')" />
              <CirclePlus v-else />
            </el-icon>
          </div>
          <div class="dvg-device-card__meta">{{ d.deviceInfoVendor }} · {{ d.deviceInfoIp || '无 IP' }}</div>
        </div>
      </div>
      <template #footer>
        <ReButton @click="assignVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="assignSaving" @click="onAssignSave">确认分配 ({{ pendingAssigned.size }})</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CircleCheck, CirclePlus, FolderOpened, MoreFilled, QuestionFilled, VideoCamera } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import { ReFormItem } from '@repo/ui/re-kit'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'

import deviceApi from '../api/deviceApi'
import type { DeviceGroupNode, DeviceInfo } from '../types/device'

const loading = ref(false)
const groupTree = ref<DeviceGroupNode[]>([])
const groupDevices = ref<DeviceInfo[]>([])
const allDevices = ref<DeviceInfo[]>([])
const activeGroupId = ref('')
const assigned = ref<Set<string>>(new Set())

/** 树扁平化（带层级深度），用于渲染缩进列表 */
const flatTree = computed(() => {
  const out: Array<DeviceGroupNode & { depth: number }> = []
  const walk = (nodes: DeviceGroupNode[], depth: number) => {
    for (const n of nodes) {
      out.push({ ...n, depth })
      if (n.children?.length) walk(n.children, depth + 1)
    }
  }
  walk(groupTree.value, 0)
  return out
})

/** 当前选中分组名 */
const activeGroupName = computed(() =>
  flatTree.value.find((n) => n.groupId === activeGroupId.value)?.groupName || '选择分组',
)

/** 已分配设备（去重，跨分组不重复计数） */
const assignedCount = computed(() => assigned.value.size)

/** 未分组设备数 */
const unassignedCount = computed(() => Math.max(0, allDevices.value.length - assignedCount.value))

/** 未分配设备列表 */
const unassignedDevices = computed(() =>
  allDevices.value.filter((d) => !assigned.value.has(d.deviceInfoId || '')),
)

/** 分组选项（下拉用，带层级缩进） */
const groupOptions = computed(() =>
  flatTree.value
    .filter((n) => n.groupId && n.groupId !== activeGroupId.value)
    .map((n) => ({ value: n.groupId, label: `${'　'.repeat(n.depth || 0)}${n.groupName}` })),
)

/** dialog state */
const dialogVisible = ref(false)
const dialogSaving = ref(false)
const editingId = ref('')
const form = reactive({ groupName: '', groupParent: '', groupRemark: '' })

/** assign dialog state */
const assignVisible = ref(false)
const assignSaving = ref(false)
const pendingAssigned = ref<Set<string>>(new Set())

async function fetchTree() {
  loading.value = true
  try {
    groupTree.value = await deviceApi.groupTree()
    await fetchAllDevices()
    await refreshAssignedSet()
  } finally {
    loading.value = false
  }
}

async function fetchAllDevices() {
  allDevices.value = (await deviceApi.list()) as DeviceInfo[]
}

async function refreshAssignedSet() {
  const next = new Set<string>()
  const groups = flatTree.value.filter((n) => n.groupId && n.deviceCount > 0)
  for (const node of groups) {
    try {
      const devs = (await deviceApi.groupDevices(node.groupId)) as DeviceInfo[]
      for (const d of devs) next.add(d.deviceInfoId || '')
    } catch {
      // 某个分组查询失败不影响其它分组
    }
  }
  assigned.value = next
}

async function selectGroup(node: DeviceGroupNode) {
  activeGroupId.value = node.groupId
  if (!node.groupId) {
    groupDevices.value = []
    return
  }
  groupDevices.value = (await deviceApi.groupDevices(node.groupId)) as DeviceInfo[]
}

function openCreate(parentId: string | null) {
  editingId.value = ''
  form.groupName = ''
  form.groupParent = parentId || ''
  form.groupRemark = ''
  dialogVisible.value = true
}

function openEdit(node: DeviceGroupNode) {
  editingId.value = node.groupId
  form.groupName = node.groupName
  form.groupParent = node.groupParent || ''
  form.groupRemark = node.groupRemark || ''
  dialogVisible.value = true
}

async function onSubmit() {
  if (!form.groupName.trim()) {
    ElMessage.warning('请填写分组名称')
    return
  }
  dialogSaving.value = true
  try {
    if (editingId.value) {
      await deviceApi.updateGroup(editingId.value, { groupName: form.groupName, groupParent: form.groupParent, groupRemark: form.groupRemark })
      ElMessage.success('分组已更新')
    } else {
      await deviceApi.createGroup({ groupName: form.groupName, groupParent: form.groupParent || undefined, groupRemark: form.groupRemark || undefined })
      ElMessage.success('分组已创建')
    }
    dialogVisible.value = false
    await fetchTree()
  } catch (e: unknown) {
    ElMessage.error(`操作失败：${(e as any)?.response?.data?.message || (e as Error)?.message}`)
  } finally {
    dialogSaving.value = false
  }
}

async function onNodeCommand(cmd: string, node: DeviceGroupNode) {
  if (cmd === 'create') openCreate(node.groupId)
  else if (cmd === 'edit') openEdit(node)
  else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm(`删除分组「${node.groupName}」？分组内设备将移出。`, '确认', { type: 'warning' })
      await deviceApi.deleteGroup(node.groupId)
      ElMessage.success('分组已删除')
      if (activeGroupId.value === node.groupId) activeGroupId.value = ''
      await fetchTree()
    } catch (e: unknown) {
      if ((e as any) !== 'cancel') ElMessage.error('删除失败')
    }
  }
}

function openAssign() {
  pendingAssigned.value = new Set((groupDevices.value || []).map((d) => d.deviceInfoId || ''))
  assignVisible.value = true
}

function toggleAssign(d: DeviceInfo) {
  const id = d.deviceInfoId || ''
  if (pendingAssigned.value.has(id)) pendingAssigned.value.delete(id)
  else pendingAssigned.value.add(id)
}

function pendingToggle(d: DeviceInfo) {
  toggleAssign(d)
}

async function onAssignSave() {
  if (!activeGroupId.value) return
  assignSaving.value = true
  try {
    await deviceApi.assignGroupDevices(activeGroupId.value, [...pendingAssigned.value])
    ElMessage.success('分配成功')
    assignVisible.value = false
    await selectGroup({ groupId: activeGroupId.value, groupName: '' } as DeviceGroupNode)
    await fetchTree()
  } catch (e: unknown) {
    ElMessage.error(`分配失败：${(e as any)?.response?.data?.message || (e as Error)?.message}`)
  } finally {
    assignSaving.value = false
  }
}

async function clearGroup() {
  if (!activeGroupId.value) return
  try {
    await ElMessageBox.confirm('确定清空该分组下的所有设备？', '确认', { type: 'warning' })
    await deviceApi.assignGroupDevices(activeGroupId.value, [])
    ElMessage.success('已清空')
    groupDevices.value = []
    await fetchTree()
  } catch (e: unknown) {
    if ((e as any) !== 'cancel') ElMessage.error('操作失败')
  }
}

onMounted(() => { void fetchTree() })
</script>

<style scoped>
.dvg {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 0 12px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

.dvg-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 200px);
  gap: 12px;
}

.dvg-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 14px;
}

/* 树面板 */
.dvg-tree-panel {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  overflow: hidden;
}
.dvg-tree-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
  font-weight: 600;
}
.dvg-tree-panel__bar {
  width: 5px; height: 15px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dvg-tree-panel__count {
  font-size: 12px; color: var(--el-text-color-secondary); font-weight: 400;
}
.dvg-tree-panel__ops {
  margin-left: auto; display: flex; gap: 4px;
}

.dvg-tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}
.dvg-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.dvg-tree-node:hover { background: var(--el-fill-color-light); }
.dvg-tree-node.is-active { background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); color: var(--el-color-primary); }
.dvg-tree-node__icon { color: var(--el-color-primary); flex: none; }
.dvg-tree-node__name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dvg-tree-node__badge {
  font-size: 11px; padding: 1px 7px;
  border-radius: 20px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}
.dvg-tree-node__ops { display: none; flex: none; }
.dvg-tree-node:hover .dvg-tree-node__ops { display: flex; }
.dvg-tree-node__more { cursor: pointer; color: var(--el-text-color-secondary); }
.dvg-tree-node__more:hover { color: var(--el-color-primary); }

/* 设备面板 */
.dvg-device-panel {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  overflow: hidden;
}
.dvg-device-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px; font-weight: 600;
}
.dvg-device-panel__bar {
  width: 5px; height: 15px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dvg-device-panel__count { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 400; }
.dvg-device-panel__ops { margin-left: auto; display: flex; gap: 4px; }

.dvg-device-list { flex: 1; min-height: 0; overflow-y: auto; padding: 12px; }
.dvg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.dvg-device-card {
  background: var(--el-fill-color-light);
  border: 1.5px solid transparent;
  border-radius: 10px;
  padding: 10px 12px;
  transition: all 0.18s ease;
  user-select: none;
}
.dvg-device-card:hover { border-color: var(--el-color-primary-light-5); transform: translateY(-1px); }
.dvg-device-card.is-assigned { border-color: var(--el-color-success-light-5); background: color-mix(in srgb, var(--el-color-success-light-9), transparent); }
.dvg-device-card__head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.dvg-device-card__icon { color: var(--el-color-primary); font-size: 16px; }
.dvg-device-card__name { flex: 1; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dvg-device-card__check { color: var(--el-color-success); font-size: 16px; }
.dvg-device-card__tag {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  color: var(--el-color-warning);
}
.dvg-device-card__meta { font-size: 11.5px; color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dvg-empty {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  color: var(--el-text-color-secondary); font-size: 13px;
}

.dvg-form { display: flex; flex-direction: column; gap: 4px; }

.dvg-assign-tip {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-warning-light) 30%, transparent);
  color: var(--el-color-warning);
  font-size: 12.5px;
}
.dvg-assign-list {
  max-height: 420px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}
.dvg-assign-list .dvg-device-card { cursor: pointer; }
</style>
