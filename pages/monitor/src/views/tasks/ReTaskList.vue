<template>
  <div class="task-list fade-in">
    <div class="summary-row">
      <ReCard v-for="s in summary" :key="s.label" layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="sum-card" :style="{ borderColor: s.color + '25' }">
        <div class="sum-top">
          <span class="sum-label">{{ s.label }}</span>
          <ReIcon name="Top" :size="12" style="color: var(--el-text-color-secondary)" />
        </div>
        <div class="sum-mid">
          <span class="sum-value" :style="{ color: s.color }">{{ s.value }}</span>
        </div>
        <div class="sum-bar" :style="{ background: s.color }"></div>
      </div>
    </ReCard>
    </div>

    <ReCard layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="filter-bar">
        <el-select v-model="filters.monitorId" placeholder="选择资产" class="filter-select" clearable filterable>
          <el-option v-for="m in monitors" :key="m.id" :label="`${m.monitorName} (${m.monitorHost})`" :value="m.id" />
        </el-select>
        <el-select v-model="filters.taskType" placeholder="任务类型" class="filter-select" clearable>
          <el-option label="全部" value="" />
          <el-option label="健康检查" value="HEALTH" />
          <el-option label="指标采集" value="COLLECT" />
          <el-option label="告警任务" value="ALERT" />
          <el-option label="自定义" value="CUSTOM" />
        </el-select>
        <span class="filter-divider"></span>
        <el-button @click="fetchList" plain class="action-btn">
          <ReIcon name="RefreshLeft" />
          刷新
        </el-button>
        <el-button type="primary" @click="openAdd" class="add-btn">
          <ReIcon name="Plus" />
          新增任务
        </el-button>
      </div>
    </ReCard>

    <el-table :data="filtered" v-loading="loading" border stripe class="task-table">
      <el-table-column prop="taskName" label="任务名称" min-width="160">
        <template #default="{ row }"><span class="name-cell">{{ row.taskName }}</span></template>
      </el-table-column>
      <el-table-column prop="taskType" label="任务类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :class="['type-tag', typeClass(row.taskType)]" effect="plain" size="small">{{ typeLabel(row.taskType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="所属资产" width="130" align="center">
        <template #default="{ row }">
          <span v-if="monitorMap.get(row.monitorId)" class="dim">{{ monitorMap.get(row.monitorId).monitorName }}</span>
          <span v-else class="dim">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="taskCron" label="Cron" width="140" align="center" />
      <el-table-column prop="taskStatus" label="运行状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.taskStatus" :class="['status-pill', statusClass(row.taskStatus)]" effect="plain" size="small">
            {{ statusLabel(row.taskStatus) }}
          </el-tag>
          <span v-else class="dim">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="taskEnabled" label="启用" width="70" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.taskEnabled === 1"
            :loading="row._toggling"
            size="small"
            inline-prompt
            active-text="开"
            inactive-text="关"
            @change="handleToggleEnabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.createTime" class="dim">{{ row.createTime.slice(0, 19).replace('T', ' ') }}</span>
          <span v-else class="dim">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" @click="handleTrigger(row.id)">采集</el-button>
          <el-button text size="small" @click="editRow(row)">编辑</el-button>
          <el-button text size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog append-to-body v-model="showDialog" :title="editId ? '编辑任务' : '新增采集任务'" width="520px" destroy-on-close>
      <el-form :model="form" label-position="top" class="task-form">
        <el-form-item label="任务名称"><el-input v-model="form.taskName" placeholder="例如：Redis 健康检查" /></el-form-item>
        <el-form-item label="所属资产">
          <el-select v-model="form.monitorId" style="width:100%" placeholder="请选择资产">
            <el-option v-for="m in monitors" :key="m.id" :label="`${m.monitorName} (${m.monitorHost}:${m.monitorPort})`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="form.taskType" style="width:100%">
            <el-option label="健康检查 (HEALTH)" value="HEALTH" />
            <el-option label="指标采集 (COLLECT)" value="COLLECT" />
            <el-option label="告警任务 (ALERT)" value="ALERT" />
            <el-option label="自定义 (CUSTOM)" value="CUSTOM" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务配置 (JSON)">
          <el-input v-model="form.taskConfig" type="textarea" :rows="3" placeholder='{"host":"192.168.1.10","port":6379}' />
        </el-form-item>
        <el-form-item label="Cron 表达式">
          <el-input v-model="form.taskCron" placeholder="0/30 * * * * ?" />
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.taskDescription" placeholder="任务说明" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.taskEnabled" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

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
import { ElMessage, ElMessageBox } from 'element-plus'
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
  } catch (e: any) { ElMessage.error(e.message || '加载失败') }
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
  catch (e: any) { ElMessage.error(e.message || '保存失败') }
}

const handleDelete = async (id: number) => {
  try { await ElMessageBox.confirm('确认删除该任务？'); await delTask(id); await fetchList() }
  catch (e: any) { if (!e) return; ElMessage.error(e.message || '删除失败') }
}

const handleTrigger = async (id: number) => {
  try {
    await triggerCollect(id)
    ElMessage.success('已触发采集，请稍后查看结果')
  } catch (e: any) { ElMessage.error(e.message || '触发失败') }
}

const handleToggleEnabled = async (row: any) => {
  row._toggling = true
  try {
    const newEnabled = row.taskEnabled === 1 ? 0 : 1
    await setTaskEnabled(row.id, newEnabled === 1)
    row.taskEnabled = newEnabled
    ElMessage.success(newEnabled === 1 ? '任务已启用' : '任务已暂停')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    row._toggling = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 14px; }

.filter-bar { display: flex; align-items: center; gap: 12px; }
.filter-select { width: 200px; }
.filter-divider { width: 1px; height: 24px; background: var(--el-border-color-light); }
.action-btn, .add-btn {
  display: flex; align-items: center; gap: 6px; border-radius: 8px;
  padding: 7px 14px; font-size: 12.5px; font-weight: 500;
}

.task-table { border-radius: 8px; overflow: hidden; }
.task-table :deep(.el-table__header th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600; font-size: 12px;
  padding: 10px 12px;
}
.task-table :deep(.el-table__row td) { padding: 9px 12px; }
.task-table :deep(.el-table__row:hover) { background: color-mix(in srgb, var(--el-color-primary) 3%, transparent) !important; }
.dim { color: var(--el-text-color-secondary); font-size: 11.5px; }

.type-tag.green { color: var(--el-color-success); }
.type-tag.blue { color: var(--el-color-primary); }
.type-tag.orange { color: var(--el-color-warning); }
.type-tag.gray { color: var(--el-text-color-regular); }
.status-pill.on { color: var(--el-color-success); }
.status-pill.off { color: var(--el-text-color-secondary); }
.status-pill.err { color: var(--el-color-danger); }

.task-form :deep(.el-form-item__label) { font-weight: 500; color: var(--el-text-color-regular); font-size: 13px; }

.sum-card {
  border-left: 3px solid; padding-left: 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.sum-top { display: flex; align-items: center; justify-content: space-between; }
.sum-label { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 500; }
.sum-mid { display: flex; align-items: baseline; gap: 4px; }
.sum-value { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
.sum-bar { height: 2px; border-radius: 2px; opacity: 0.6; }

.bars-head { display: flex; justify-content: space-between; align-items: center; }
.bars-title-wrap { display: flex; align-items: center; gap: 8px; }
.bars-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.bars-sub { font-size: 11.5px; color: var(--el-text-color-secondary); }
.bars-body { width: 100%; }
</style>