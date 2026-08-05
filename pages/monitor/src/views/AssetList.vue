<template>
  <div class="asset-list fade-in">
    <div class="summary-row">
      <div v-for="s in summary" :key="s.label" class="summary-card" :style="{ borderColor: s.color + '25' }">
        <span class="card-label">{{ s.label }}</span>
        <span class="card-value" :style="{ color: s.color }">{{ s.value }}</span>
        <div class="card-bar" :style="{ background: `linear-gradient(90deg, ${s.color}, ${s.color}66)` }"></div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <input v-model="filters.keyword" placeholder="搜索名称 / 主机地址…" />
      </div>
      <el-select v-model="filters.serviceType" placeholder="服务类型" class="filter-select" clearable>
        <el-option label="全部" value="" />
        <el-option label="服务器" value="SERVER" />
        <el-option label="Redis" value="REDIS" />
        <el-option label="MySQL" value="MYSQL" />
        <el-option label="PostgreSQL" value="PG" />
        <el-option label="Oracle" value="ORACLE" />
        <el-option label="MSSQL" value="MSSQL" />
      </el-select>
      <el-select v-model="filters.enabled" placeholder="状态" class="filter-select" clearable>
        <el-option label="全部" value="" />
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button @click="fetchList" class="action-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon"><path d="M21 12a9 9 0 11-3-6.7L13 8"/><path d="M3 7v6h6"/></svg>
        刷新
      </el-button>
      <el-button type="primary" @click="openAdd" class="add-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon"><path d="M12 5v14M5 12h14"/></svg>
        新增资产
      </el-button>
    </div>

    <el-table :data="filtered" v-loading="loading" border stripe class="asset-table">
      <el-table-column prop="monitorName" label="资产名称" min-width="160">
        <template #default="{ row }"><span class="name-cell">{{ row.monitorName }}</span></template>
      </el-table-column>
      <el-table-column prop="monitorHost" label="主机地址" min-width="150" />
      <el-table-column prop="monitorPort" label="端口" width="80" align="center" />
      <el-table-column prop="serviceType" label="服务类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :class="['type-tag', typeClass(row.serviceType)]" effect="light">{{ typeLabel(row.serviceType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="serverType" label="系统类型" width="90" align="center">
        <template #default="{ row }"><span v-if="row.serverType">{{ row.serverType }}</span><span v-else class="dim">—</span></template>
      </el-table-column>
      <el-table-column prop="monitorGroup" label="分组" width="100" align="center">
        <template #default="{ row }"><span v-if="row.monitorGroup">{{ row.monitorGroup }}</span><span v-else class="dim">—</span></template>
      </el-table-column>
      <el-table-column prop="monitorEnabled" label="状态" width="80" align="center">
        <template #default="{ row }">
          <span :class="['status-pill', row.monitorEnabled === 1 ? 'on' : 'off']">{{ row.monitorEnabled === 1 ? '运行中' : '已停用' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" @click="editRow(row)">编辑</el-button>
          <el-button text size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showDialog" :title="editId ? '编辑资产' : '新增资产'" width="520px" destroy-on-close>
      <el-form :model="form" label-position="top" class="asset-form">
        <el-form-item label="资产名称"><el-input v-model="form.monitorName" placeholder="例如：prod-web-01" /></el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="主机地址"><el-input v-model="form.monitorHost" placeholder="192.168.1.100" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口"><el-input-number v-model="form.monitorPort" :min="1" :max="65535" controls-position="right" style="width:100%" /></el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
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
          <el-col :span="12" v-if="form.serviceType === 'SERVER'">
            <el-form-item label="系统类型">
              <el-select v-model="form.serverType" style="width:100%">
                <el-option label="Linux" value="LINUX" />
                <el-option label="Windows" value="WINDOWS" />
                <el-option label="macOS" value="MACOS" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="分组"><el-input v-model="form.monitorGroup" placeholder="例如：prod / test" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.monitorDescription" placeholder="资产备注说明" /></el-form-item>
        <el-form-item label="启用状态"><el-switch v-model="form.monitorEnabled" :active-value="1" :inactive-value="0" /></el-form-item>
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
import { getMonitors, saveMonitor, delMonitor } from '../api'

const list = ref<any[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const form = ref<any>({ monitorEnabled: 1, monitorPort: 22, serviceType: 'SERVER' })
const filters = ref({ keyword: '', serviceType: '', enabled: '' })

const summary = computed(() => [
  { label: '资产总数', value: list.value.length, color: '#3b82f6' },
  { label: '运行中', value: list.value.filter(r => r.monitorEnabled === 1).length, color: '#10b981' },
  { label: '已停用', value: list.value.filter(r => r.monitorEnabled === 0).length, color: '#9ca3af' },
  { label: 'Redis', value: list.value.filter(r => r.serviceType === 'REDIS').length, color: '#f97316' },
])

const filtered = computed(() => {
  let r = list.value
  if (filters.value.keyword) {
    const kw = filters.value.keyword.toLowerCase()
    r = r.filter(x => (x.monitorName || '').toLowerCase().includes(kw) || (x.monitorHost || '').toLowerCase().includes(kw))
  }
  if (filters.value.serviceType) r = r.filter(x => x.serviceType === filters.value.serviceType)
  if (filters.value.enabled !== '') r = r.filter(x => x.monitorEnabled === Number(filters.value.enabled))
  return r
})

const typeClass = (t: string) => {
  const map: Record<string, string> = { SERVER: 'blue', REDIS: 'orange', MYSQL: 'cyan', PG: 'green', ORACLE: 'red', MSSQL: 'purple' }
  return map[t] || 'gray'
}
const typeLabel = (t: string) => {
  const map: Record<string, string> = { SERVER: '服务器', REDIS: 'Redis', MYSQL: 'MySQL', PG: 'PostgreSQL', ORACLE: 'Oracle', MSSQL: 'MSSQL' }
  return map[t] || t
}

const fetchList = async () => {
  loading.value = true
  try { list.value = await getMonitors() }
  catch (e: any) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
}

const openAdd = () => { editId.value = null; form.value = { monitorEnabled: 1, monitorPort: 22, serviceType: 'SERVER' }; showDialog.value = true }
const editRow = (row: any) => { editId.value = row.id; form.value = { ...row }; showDialog.value = true }

const handleSave = async () => {
  try { await saveMonitor(editId.value || 0, form.value); showDialog.value = false; await fetchList() }
  catch (e: any) { ElMessage.error(e.message || '保存失败') }
}

const handleDelete = async (id: number) => {
  try { await ElMessageBox.confirm('确认删除该资产？', '提示', { type: 'warning' }); await delMonitor(id); await fetchList() }
  catch (e: any) { if (e !== 'cancel') ElMessage.error(e.message || '删除失败') }
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

.filter-bar {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px; background: var(--el-card-bg-color, #ffffff);
  padding: 12px 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.search-box { flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #e5e7eb; }
.search-icon { width: 16px; height: 16px; color: #9ca3af; }
.search-box input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: #1f2937; }
.search-box input::placeholder { color: #9ca3af; }
.filter-select { width: 130px; }
.action-btn, .add-btn { display: flex; align-items: center; gap: 6px; border-radius: 10px; padding: 8px 14px; font-size: 13px; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.action-btn { background: #f1f5f9; color: #4b5563; border: 1px solid #e5e7eb; }
.action-btn:hover { background: #e2e8f0; }
.add-btn { background: #3b82f6; color: #fff; border: none; padding: 8px 16px; font-weight: 500; box-shadow: 0 2px 8px rgba(59,130,246,0.25); }
.add-btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

.asset-table { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
.asset-table :deep(.el-table__header th) { background: #f8fafc; color: #4b5563; font-weight: 600; font-size: 12.5px; }
.asset-table :deep(.el-table__row:hover) { background: #f0f7ff !important; }
.name-cell { font-weight: 500; color: #1f2937; }
.dim { color: #9ca3af; font-size: 12px; }

.type-tag.blue { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; }
.type-tag.orange { color: #f97316; background: #fff7ed; border-color: #fed7aa; }
.type-tag.cyan { color: #06b6d4; background: #ecfeff; border-color: #a5f3fc; }
.type-tag.green { color: #10b981; background: #ecfdf5; border-color: #a7f3d0; }
.type-tag.red { color: #ef4444; background: #fef2f2; border-color: #fecaca; }
.type-tag.purple { color: #8b5cf6; background: #f5f3ff; border-color: #ddd6fe; }
.type-tag.gray { color: #6b7280; background: #f3f4f6; border-color: #d1d5db; }

.status-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
.status-pill.on { color: #10b981; background: #ecfdf5; }
.status-pill.off { color: #9ca3af; background: #f3f4f6; }

.asset-form :deep(.el-form-item__label) { font-weight: 500; color: #4b5563; font-size: 13px; }
</style>
