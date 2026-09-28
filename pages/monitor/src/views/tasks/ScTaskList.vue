<template>
  <div class="task-list fade-in">
    <ReSkeleton :loading="loading" :rows="3" :count="1" animated>
      <div class="summary-row">
        <ReStatCard
          v-for="(s, i) in summary"
          :key="s.label"
          :title="s.label"
          :value="s.value"
          :icon-color="statMeta[i].color"
        >
          <template #icon><component :is="statMeta[i].icon" /></template>
          <template #value><ReCountup :value="s.value" /></template>
        </ReStatCard>
      </div>
    </ReSkeleton>

    <ReCard layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="filter-bar">
        <ReSelect v-model="filters.monitorId" placeholder="选择资产" class="filter-select" clearable filterable
          :data="monitors.map(m => ({ label: `${m.monitorName} (${m.monitorHost})`, value: m.id }))" />
        <ReSelect v-model="filters.taskType" placeholder="任务类型" class="filter-select" clearable
          :data="[{ label: '全部', value: '' }, { label: '健康检查', value: 'HEALTH' }, { label: '指标采集', value: 'COLLECT' }, { label: '告警任务', value: 'ALERT' }, { label: '自定义', value: 'CUSTOM' }]" />
        <span class="filter-divider"></span>
        <ReButton show-text icon="RefreshLeft" plain @click="fetchList">刷新</ReButton>
        <ReButton show-text icon="Plus" type="primary" @click="openAdd">新增任务</ReButton>
      </div>
    </ReCard>

    <ReTable :data="filtered" :loading="loading" border stripe class="task-table" :pagination="false" :toolbar="false">
      <ReTableColumn prop="taskName" label="任务名称" min-width="160">
        <template #default="{ row }"><span class="name-cell">{{ row.taskName }}</span></template>
      </ReTableColumn>
      <ReTableColumn prop="taskType" label="任务类型" width="100" align="center">
        <template #default="{ row }">
          <ReTag :class="['type-tag', typeClass(row.taskType)]" effect="plain" >{{ typeLabel(row.taskType) }}</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="所属资产" width="130" align="center">
        <template #default="{ row }">
          <span v-if="monitorMap.get(row.monitorId)" class="dim">{{ monitorMap.get(row.monitorId).monitorName }}</span>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="taskCron" label="Cron" width="140" align="center" />
      <ReTableColumn prop="taskStatus" label="运行状态" width="100" align="center">
        <template #default="{ row }">
          <ReTag v-if="row.taskStatus" :class="['status-pill', statusClass(row.taskStatus)]" effect="plain" >
            {{ statusLabel(row.taskStatus) }}
          </ReTag>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="taskEnabled" label="启用" width="70" align="center">
        <template #default="{ row }">
          <ReSwitch
            :model-value="row.taskEnabled === 1"
            :loading="row._toggling"

            inline-prompt
            active-text="开"
            inactive-text="关"
            @change="handleToggleEnabled(row)"
          />
        </template>
      </ReTableColumn>
      <ReTableColumn prop="createTime" label="创建时间" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.createTime" class="dim">{{ row.createTime.slice(0, 19).replace('T', ' ') }}</span>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <ReButton link @click="handleTrigger(row.id)">采集</ReButton>
          <ReButton link @click="editRow(row)">编辑</ReButton>
          <ReButton link type="danger" @click="handleDelete(row.id)">删除</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <ReDialog append-to-body v-model="showDialog" :title="editId ? '编辑任务' : '新增采集任务'" width="520" :height="460" destroy-on-close confirm-text="保存" cancel-text="取消" compact @confirm="handleSave" @cancel="showDialog = false">
      <ReForm :model="form" label-position="top" class="task-form">
        <ReFormItem label="任务名称"><ReInput v-model="form.taskName" placeholder="例如：Redis 健康检查" /></ReFormItem>
        <ReFormItem label="所属资产">
          <ReSelect v-model="form.monitorId" style="width:100%" placeholder="请选择资产"
            :data="monitors.map(m => ({ label: `${m.monitorName} (${m.monitorHost}:${m.monitorPort})`, value: m.id }))" />
        </ReFormItem>
        <ReFormItem label="任务类型">
          <ReSelect v-model="form.taskType" style="width:100%"
            :data="[{ label: '健康检查 (HEALTH)', value: 'HEALTH' }, { label: '指标采集 (COLLECT)', value: 'COLLECT' }, { label: '告警任务 (ALERT)', value: 'ALERT' }, { label: '自定义 (CUSTOM)', value: 'CUSTOM' }]" />
        </ReFormItem>
        <ReFormItem label="任务配置 (JSON)">
          <ReInput v-model="form.taskConfig" type="textarea" :rows="3" placeholder='{"host":"192.168.1.10","port":6379}' />
        </ReFormItem>
        <ReFormItem label="Cron 表达式">
          <ReInput v-model="form.taskCron" placeholder="0/30 * * * * ?" />
        </ReFormItem>
        <ReFormItem label="描述"><ReInput v-model="form.taskDescription" placeholder="任务说明" /></ReFormItem>
        <ReFormItem label="启用状态"><ReSwitch v-model="form.taskEnabled" :active-value="1" :inactive-value="0" /></ReFormItem>
      </ReForm>
    </ReDialog>

    <ReCard layout="simple" :radius="14" :padding="0" shadow="never">
      <template #header>
        <div class="bars-head">
          <div class="bars-title-wrap">
            <ReIcon name="PieChart" :size="18" />
            <span class="bars-title">任务状态分布</span>
          </div>
          <span class="bars-sub">按 taskType 统计 | 高度=任务数</span>
        </div>
      </template>
      <div class="bars-body">
        <ReThree v-if="tasks.length" :height="180" :render="renderTaskBars" :animate="animateBars" :auto-rotate="true" :auto-rotate-speed="0.5" />
      </div>
    </ReCard>
  </div>
</template>

<script setup lang="ts" name="ReTaskList">
import { ref, computed, onMounted, shallowRef } from 'vue'
import * as THREE from 'three'
import type { ReThreeContext } from '@repo/ui/re-three'
import { message } from '@repo/core'
import { getTasks, saveTask, delTask, getMonitors, setTaskEnabled, triggerCollect } from '../../api'

const tasks = ref<any[]>([])
const monitors = ref<any[]>([])
const monitorMap = ref(new Map<number, any>())
const loading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const form = ref<any>({ taskType: 'COLLECT', taskEnabled: 1 })
const filters = ref({ monitorId: '', taskType: '' })

const summary = computed(() => [
  { label: '任务总数', value: tasks.value.length, color: 'var(--el-color-primary)' },
  { label: '已启用', value: tasks.value.filter(r => r.taskEnabled === 1).length, color: 'var(--el-color-success)' },
  { label: '已禁用', value: tasks.value.filter(r => r.taskEnabled === 0).length, color: 'var(--el-color-info)' },
  { label: '运行中', value: tasks.value.filter(r => r.taskStatus === 'RUNNING').length, color: 'var(--el-color-success)' },
])

/** 纯展示：摘要卡图标与配色（对齐 tokens --metric-* / --status-*），与 summary 按下标一一对应 */
const statMeta = computed(() => [
  { icon: 'DataLine', color: 'var(--metric-cpu)' },
  { icon: 'Open', color: 'var(--status-success)' },
  { icon: 'TurnOff', color: 'var(--text-tertiary)' },
  { icon: 'CircleCheck', color: 'var(--status-success)' },
])

const filtered = computed(() => {
  let r = tasks.value
  if (filters.value.monitorId) r = r.filter(x => x.monitorId === filters.value.monitorId)
  if (filters.value.taskType) r = r.filter(x => x.taskType === filters.value.taskType)
  return r
})

const typeColorMap: Record<string, number> = { HEALTH: 0x22c55e, COLLECT: 0x5b8def, ALERT: 0xf59e0b, CUSTOM: 0x64748b }
const barGroup = shallowRef<THREE.Group | null>(null)

const renderTaskBars = (ctx: ReThreeContext) => {
  const { scene, THREE } = ctx
  const grp = new THREE.Group()
  scene.add(grp)
  barGroup.value = grp

  const counts: Record<string, number> = {}
  tasks.value.forEach(t => { counts[t.taskType || 'UNKNOWN'] = (counts[t.taskType || 'UNKNOWN'] || 0) + 1 })
  const entries = Object.entries(counts)
  const spacing = 12
  const totalWidth = entries.length * spacing
  const startX = -totalWidth / 2 + spacing / 2

  entries.forEach(([type, count], i) => {
    const height = Math.max(1, count) * 3
    const geo = new THREE.BoxGeometry(6, height, 6)
    geo.translate(0, height / 2, 0)
    const color = typeColorMap[type] || 0x94a3b8
    const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.x = startX + i * spacing
    grp.add(mesh)
  })

  ctx.camera.position.set(0, 20, 60)
  ctx.camera.lookAt(0, 5, 0)
}

const animateBars = (ctx: ReThreeContext) => {
  if (barGroup.value) {
    const t = Date.now() * 0.001
    barGroup.value.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const baseY = child.geometry.parameters.height ? 0 : 0
        child.scale.y = 1 + Math.sin(t * 1.5 + i * 0.5) * 0.05
      }
    })
  }
}

const typeClass = (t: string) => {
  const map: Record<string, string> = { HEALTH: 'green', COLLECT: 'blue', ALERT: 'orange', CUSTOM: 'gray' }
  return map[t] || 'gray'
}
const typeLabel = (t: string) => {
  const map: Record<string, string> = { HEALTH: '健康', COLLECT: '采集', ALERT: '告警', CUSTOM: '自定义' }
  return map[t] || t
}
const statusClass = (s: string) => {
  const map: Record<string, string> = { RUNNING: 'on', STOPPED: 'off', ERROR: 'err' }
  return map[s] || 'off'
}
const statusLabel = (s: string) => {
  const map: Record<string, string> = { RUNNING: '运行中', STOPPED: '已停止', ERROR: '异常' }
  return map[s] || s
}

/**
 * 归一化后端任务实体到前端展示结构
 *
 * 后端字段: monitorTaskName/monitorTaskCron/monitorTaskEnabled/serviceType/provider/lastRunTime
 * 前端字段: taskName/taskCron/taskEnabled/taskType/taskStatus(派生)
 */
const normalizeTask = (raw: any) => {
  const enabled = raw.monitorTaskEnabled ?? raw.taskEnabled ?? 0
  return {
    ...raw,
    taskName: raw.taskName ?? raw.monitorTaskName,
    taskCron: raw.taskCron ?? raw.monitorTaskCron,
    taskEnabled: enabled,
    taskType: raw.taskType ?? raw.serviceType ?? raw.provider ?? 'COLLECT',
    taskStatus: raw.taskStatus ?? (enabled === 1 ? 'RUNNING' : 'STOPPED'),
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const [t, m] = await Promise.all([
      filters.value.monitorId ? getTasks(Number(filters.value.monitorId)) : getTasks(),
      getMonitors(),
    ])
    tasks.value = (t || []).map(normalizeTask)
    monitors.value = m
    monitorMap.value = new Map(m.map((x: any) => [x.id, x]))
  } catch (e: any) { message.error(e.message || '加载失败') }
  finally { loading.value = false }
}

const openAdd = () => { editId.value = null; form.value = { taskType: 'COLLECT', taskEnabled: 1 }; showDialog.value = true }
const editRow = (row: any) => { editId.value = row.id; form.value = { ...row }; showDialog.value = true }

/** 提交载荷：前端表单字段映射回后端实体列 */
const toBackendPayload = (f: any) => ({
  id: f.id,
  monitorId: f.monitorId,
  monitorTaskName: f.taskName,
  serviceType: f.taskType,
  provider: f.provider,
  collectConfig: f.collectConfig,
  monitorTaskCron: f.taskCron,
  monitorTaskTimeout: f.monitorTaskTimeout,
  monitorTaskEnabled: f.taskEnabled,
  monitorTaskRemark: f.taskDescription || f.monitorTaskRemark,
})

const handleSave = async () => {
  try { await saveTask(editId.value || 0, toBackendPayload(form.value)); showDialog.value = false; await fetchList() }
  catch (e: any) { message.error(e.message || '保存失败') }
}

const handleDelete = async (id: number) => {
  try { await message.confirm('确认删除该任务？'); await delTask(id); await fetchList() }
  catch (e: any) { if (!e) return; message.error(e.message || '删除失败') }
}

const handleTrigger = async (id: number) => {
  try {
    await triggerCollect(id)
    message.success('已触发采集，请稍后查看结果')
  } catch (e: any) { message.error(e.message || '触发失败') }
}

const handleToggleEnabled = async (row: any) => {
  row._toggling = true
  try {
    const newEnabled = row.taskEnabled === 1 ? 0 : 1
    await setTaskEnabled(row.id, newEnabled === 1)
    row.taskEnabled = newEnabled
    message.success(newEnabled === 1 ? '任务已启用' : '任务已暂停')
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    row._toggling = false
  }
}

onMounted(fetchList)
</script>

 <style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}
/* 统计卡视觉（圆角/无边框/双层柔光/悬停上浮）由 ReStatCard 的 re-surface 基线提供，
   此处不再覆写一遍，避免与基线重复且互相打架。 */

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.filter-select { width: 200px; }
.filter-divider {
  width: 1px;
  height: 24px;
  background: var(--border-subtle);
}

.task-table {
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.task-table :deep(.el-table__header th) {
  background: var(--bg-fill);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 12px;
  padding: 10px 12px;
}
.task-table :deep(.el-table__row td) { padding: 9px 12px; }
.task-table :deep(.el-table__row) {
  transition: background-color var(--transition-base);
}
.task-table :deep(.el-table__row:hover) {
  background: color-mix(in srgb, var(--brand-500) 6%, transparent) !important;
}
.dim { color: var(--text-tertiary); font-size: 11.5px; }

.type-tag { font-size: 11px; font-weight: 600; padding: 1px 6px; }
.type-tag.green { color: var(--status-success); }
.type-tag.blue { color: var(--metric-cpu); }
.type-tag.orange { color: var(--metric-disk); }
.type-tag.gray { color: var(--text-tertiary); }
.status-pill { font-size: 11px; font-weight: 600; }
.status-pill.on { color: var(--status-success); }
.status-pill.off { color: var(--text-tertiary); }
.status-pill.err { color: var(--status-error); }

.task-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 13px;
}


.bars-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.bars-title-wrap { display: flex; align-items: center; gap: 8px; }
.bars-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.bars-sub { font-size: 11.5px; color: var(--text-tertiary); }
.bars-body { width: 100%; }

.task-list :deep(.el-switch),
.task-list :deep(.el-button) {
  cursor: pointer;
}
.task-list :deep(.el-button:focus-visible),
.task-list :deep(.el-switch:focus-visible) {
  box-shadow: var(--focus-ring);
  outline: none;
}

@media (max-width: 768px) {
  .summary-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
  .filter-select { width: 100%; }
  .filter-divider { display: none; }
}
 </style>