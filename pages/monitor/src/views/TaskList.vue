<template>
  <div class="task-list fade-in">
    <div class="summary-row">
      <div v-for="s in summary" :key="s.label" class="summary-card" :style="{ borderColor: s.color + '25' }">
        <span class="card-label">{{ s.label }}</span>
        <span class="card-value" :style="{ color: s.color }">{{ s.value }}</span>
        <div class="card-bar" :style="{ background: `linear-gradient(90deg, ${s.color}, ${s.color}66)` }"></div>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.monitorId" placeholder="选择资产" class="filter-select" clearable filterable>
        <el-option v-for="m in monitors" :key="m.id" :label="`${m.monitorName} (${m.monitorHost})`" :value="m.id" />
      </el-select>
      <el-select v-model="filters.provider" placeholder="采集方式" class="filter-select" clearable>
        <el-option label="全部" value="" />
        <el-option label="本地" value="LOCAL" />
        <el-option label="终端" value="TERMINAL" />
        <el-option label="HTTP" value="HTTP" />
        <el-option label="Prometheus" value="PROMETHEUS" />
      </el-select>
      <el-button @click="fetchList" class="action-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon"><path d="M21 12a9 9 0 11-3-6.7L13 8"/><path d="M3 7v6h6"/></svg>
        刷新
      </el-button>
      <el-button type="primary" @click="openAdd" class="add-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon"><path d="M12 5v14M5 12h14"/></svg>
        新增任务
      </el-button>
    </div>

    <el-table :data="filtered" v-loading="loading" border stripe class="task-table">
      <el-table-column prop="monitorTaskName" label="任务名称" min-width="180" />
      <el-table-column prop="provider" label="采集方式" width="100" align="center">
        <template #default="{ row }">
          <el-tag :class="['mode-tag', modeClass(row.provider)]" effect="light">{{ modeLabel(row.provider) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="serviceType" label="服务类型" width="100" align="center">
        <template #default="{ row }">
          <span :class="['type-tag', typeClass(row.serviceType)]" effect="light">{{ row.serviceType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="所属资产" width="130" align="center">
        <template #default="{ row }">
          <span v-if="monitorMap.get(row.monitorId)">{{ monitorMap.get(row.monitorId).monitorName }}</span>
          <span v-else class="dim">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="monitorTaskCron" label="Cron 表达式" width="160" align="center" />
      <el-table-column prop="monitorTaskTimeout" label="超时(ms)" width="90" align="center" />
      <el-table-column prop="monitorTaskEnabled" label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.monitorTaskEnabled === 1"
            :loading="row._toggling"
            active-text="运行中"
            inactive-text="已暂停"
            inline-prompt
            size="small"
            @change="handleToggleEnabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="lastRunTime" label="最近执行" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.lastRunTime" class="dim">{{ row.lastRunTime.slice(0, 19).replace('T', ' ') }}</span>
          <span v-else class="dim">尚未执行</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" @click="editRow(row)">编辑</el-button>
          <el-button text size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showDialog" :title="editId ? '编辑任务' : '新增采集任务'" width="560px" destroy-on-close>
      <el-form :model="form" label-position="top" class="task-form">
        <el-form-item label="任务名称"><el-input v-model="form.monitorTaskName" placeholder="例如：Redis INFO 采集" /></el-form-item>
        <el-form-item label="所属资产">
          <el-select v-model="form.monitorId" style="width:100%" placeholder="请选择资产">
            <el-option v-for="m in monitors" :key="m.id" :label="`${m.monitorName} (${m.monitorHost}:${m.monitorPort})`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="采集方式">
              <el-select v-model="form.provider" style="width:100%">
                <el-option label="本地采集 (LOCAL)" value="LOCAL" />
                <el-option label="终端采集 (TERMINAL)" value="TERMINAL" />
                <el-option label="HTTP 拉取" value="HTTP" />
                <el-option label="Prometheus" value="PROMETHEUS" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务类型">
              <el-select v-model="form.serviceType" style="width:100%">
                <el-option label="服务器" value="SERVER" />
                <el-option label="Redis" value="REDIS" />
                <el-option label="MySQL" value="MYSQL" />
                <el-option label="PostgreSQL" value="PG" />
                <el-option label="Oracle" value="ORACLE" />
                <el-option label="MSSQL" value="MSSQL" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="采集参数 (JSON)">
          <el-input v-model="form.collectConfig" type="textarea" :rows="3" placeholder='{"host":"192.168.1.10","port":6379}' />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Cron 表达式">
              <el-input v-model="form.monitorTaskCron" placeholder="0/10 * * * * ?" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="超时 (毫秒)">
              <el-input-number v-model="form.monitorTaskTimeout" :min="1000" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.monitorTaskRemark" placeholder="任务说明" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.monitorTaskEnabled" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" class="add-btn">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTasks, saveTask, delTask, getMonitors, setTaskEnabled } from '../api'

const tasks = ref<any[]>([])
const monitors = ref<any[]>([])
const monitorMap = ref(new Map<number, any>())
const loading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const form = ref<any>({ provider: 'LOCAL', serviceType: 'SERVER', monitorTaskTimeout: 5000, monitorTaskEnabled: 1 })
const filters = ref({ monitorId: '', provider: '' })

const summary = computed(() => [
  { label: '任务总数', value: tasks.value.length, color: '#3b82f6' },
  { label: '运行中', value: tasks.value.filter(r => r.monitorTaskEnabled === 1).length, color: '#10b981' },
  { label: '已暂停', value: tasks.value.filter(r => r.monitorTaskEnabled === 0).length, color: '#9ca3af' },
  { label: '本地采集', value: tasks.value.filter(r => r.provider === 'LOCAL').length, color: '#8b5cf6' },
])

const filtered = computed(() => {
  let r = tasks.value
  if (filters.value.monitorId) r = r.filter(x => x.monitorId === filters.value.monitorId)
  if (filters.value.provider) r = r.filter(x => x.provider === filters.value.provider)
  return r
})

const modeClass = (m: string) => {
  const map: Record<string, string> = { LOCAL: 'blue', TERMINAL: 'orange', HTTP: 'cyan', PROMETHEUS: 'purple' }
  return map[m] || 'gray'
}
const modeLabel = (m: string) => {
  const map: Record<string, string> = { LOCAL: '本地', TERMINAL: '终端', HTTP: 'HTTP', PROMETHEUS: 'Prometheus' }
  return map[m] || m
}

const typeClass = (t: string) => {
  const map: Record<string, string> = { SERVER: 'blue', REDIS: 'orange', MYSQL: 'cyan', PG: 'green', ORACLE: 'red', MSSQL: 'purple' }
  return map[t] || 'gray'
}

const fetchList = async () => {
  loading.value = true
  try {
    const [t, m] = await Promise.all([
      filters.value.monitorId ? getTasks(Number(filters.value.monitorId)) : getTasks(),
      getMonitors(),
    ])
    tasks.value = t
    monitors.value = m
    monitorMap.value = new Map(m.map((x: any) => [x.id, x]))
  } catch (e: any) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
}

const openAdd = () => { editId.value = null; form.value = { provider: 'LOCAL', serviceType: 'SERVER', monitorTaskTimeout: 5000, monitorTaskEnabled: 1 }; showDialog.value = true }
const editRow = (row: any) => { editId.value = row.id; form.value = { ...row }; showDialog.value = true }

const handleSave = async () => {
  try { await saveTask(editId.value || 0, form.value); showDialog.value = false; await fetchList() }
  catch (e: any) { ElMessage.error(e.message || '保存失败') }
}

const handleDelete = async (id: number) => {
  try { await ElMessageBox.confirm('确认删除该任务？', '提示', { type: 'warning' }); await delTask(id); await fetchList() }
  catch (e: any) { if (e !== 'cancel') ElMessage.error(e.message || '删除失败') }
}

const handleToggleEnabled = async (row: any) => {
  row._toggling = true
  try {
    const newEnabled = row.monitorTaskEnabled === 1 ? 0 : 1
    await setTaskEnabled(row.id, newEnabled === 1)
    row.monitorTaskEnabled = newEnabled
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

.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.summary-card {
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px; border: 1px solid; padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 8px;
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
.card-label { font-size: 13px; color: #9ca3af; font-weight: 500; }
.card-value { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
.card-bar { height: 3px; border-radius: 2px; opacity: 0.7; }

.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; background: var(--el-card-bg-color, #ffffff); padding: 12px 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.filter-select { width: 200px; }
.action-btn, .add-btn { display: flex; align-items: center; gap: 6px; border-radius: 10px; padding: 8px 14px; font-size: 13px; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.action-btn { background: #f1f5f9; color: #4b5563; border: 1px solid #e5e7eb; }
.action-btn:hover { background: #e2e8f0; }
.add-btn { background: #3b82f6; color: #fff; border: none; padding: 8px 16px; font-weight: 500; box-shadow: 0 2px 8px rgba(59,130,246,0.25); }
.add-btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

.task-table { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
.task-table :deep(.el-table__header th) { background: #f8fafc; color: #4b5563; font-weight: 600; font-size: 12.5px; }
.task-table :deep(.el-table__row:hover) { background: #f0f7ff !important; }
.dim { color: #9ca3af; font-size: 12px; }

.mode-tag.blue { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }
.mode-tag.orange { color: #f97316; background: #fff7ed; border-color: #fed7aa; }
.mode-tag.cyan { color: #06b6d4; background: #ecfeff; border-color: #a5f3fc; }
.mode-tag.purple { color: #8b5cf6; background: #f5f3ff; border-color: #ddd6fe; }
.status-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
.status-pill.on { color: #10b981; background: #ecfdf5; }
.status-pill.off { color: #9ca3af; background: #f3f4f6; }

.task-form :deep(.el-form-item__label) { font-weight: 500; color: #4b5563; font-size: 13px; }
</style>
