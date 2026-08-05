<template>
  <div class="redis-mgr fade-in">
    <div class="ctrl-row">
      <div class="sel-group">
        <label class="ctrl-label">选择 Redis 任务</label>
        <el-select v-model="selectedTaskId" placeholder="请选择任务" class="ctrl-select" @change="onTaskChange">
          <el-option v-for="t in redisTasks" :key="t.id" :label="`${t.monitorTaskName} [${getMonitorLabel(t.monitorId)}]`" :value="t.id" />
        </el-select>
      </div>
      <div class="sel-group">
        <label class="ctrl-label">Key 前缀</label>
        <input v-model="scanPattern" placeholder="例如：user:*" class="ctrl-input" @keyup.enter="doScan" />
      </div>
      <div class="ctrl-actions">
        <el-button @click="doScan" class="scan-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          扫描
        </el-button>
      </div>
    </div>

    <div class="redis-body">
      <div class="key-panel">
        <div class="panel-head">
          <span class="panel-title">Redis Keys</span>
          <span class="panel-count dim">{{ filteredKeys.length }} 个</span>
        </div>
        <div class="key-list" v-loading="scanLoading">
          <div v-for="k in filteredKeys" :key="k" :class="['key-item', { active: selectedKey === k }]" @click="selectedKey = k; loadValue()">
            <span class="key-text">{{ k }}</span>
            <el-button text size="small" type="danger" @click.stop="handleDeleteKey(k)" class="del-btn">×</el-button>
          </div>
          <el-empty v-if="filteredKeys.length === 0" description="暂无数据，请先扫描" :image-size="60" />
        </div>
      </div>

      <div class="value-panel">
        <div class="panel-head"><span class="panel-title">键值操作</span></div>
        <div class="value-card" v-if="selectedKey">
          <el-form :model="kvForm" label-position="top" class="kv-form">
            <el-form-item label="Key"><el-input v-model="kvForm.key" disabled /></el-form-item>
            <el-form-item label="Value"><el-input v-model="kvForm.value" type="textarea" :rows="8" placeholder="键值内容" /></el-form-item>
            <el-form-item label="TTL (秒, 空=永久)"><el-input-number v-model="kvForm.ttl" :min="1" controls-position="right" placeholder="永久" /></el-form-item>
            <div class="kv-actions">
              <el-button @click="loadValue" class="action-btn">读取</el-button>
              <el-button @click="doSet" class="action-btn">写入</el-button>
              <el-button @click="doExpire" class="action-btn">设置过期</el-button>
              <el-button type="danger" @click="handleDeleteKey(selectedKey)" class="action-btn">删除</el-button>
            </div>
          </el-form>
        </div>
        <el-empty v-else description="请从左侧选择一个 Key" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMonitors, getTasks, scanRedisKeys, getRedisValue, setRedisValue, delRedisKeys, expireRedisKey } from '../api'

const monitors = ref<any[]>([])
const monitorMap = ref(new Map<number, any>())
const redisTasks = ref<any[]>([])
const selectedTaskId = ref<number | null>(null)
const scanPattern = ref('*')
const scanLoading = ref(false)
const keys = ref<string[]>([])
const keyFilter = ref('')
const selectedKey = ref('')
const kvForm = ref({ key: '', value: '', ttl: 0 })

const filteredKeys = computed(() => {
  if (!keyFilter.value) return keys.value
  const f = keyFilter.value.toLowerCase()
  return keys.value.filter(k => k.toLowerCase().includes(f))
})

const getMonitorLabel = (monitorId: number) => {
  const m = monitorMap.value.get(monitorId)
  return m ? `${m.monitorName}(${m.monitorHost}:${m.monitorPort})` : `id=${monitorId}`
}

const onTaskChange = () => { keys.value = []; selectedKey.value = '' }

const loadMonitors = async () => {
  try {
    monitors.value = await getMonitors()
    monitorMap.value = new Map(monitors.value.map((x: any) => [x.id, x]))
    redisTasks.value = (await getTasks()).filter((t: any) => t.serviceType === 'REDIS')
    if (redisTasks.value.length) selectedTaskId.value = redisTasks.value[0].id
  } catch (e: any) { ElMessage.error(e.message || '加载数据失败') }
}

const doScan = async () => {
  if (!selectedTaskId.value) { ElMessage.warning('请先选择任务'); return }
  scanLoading.value = true
  try {
    const result = await scanRedisKeys(selectedTaskId.value, scanPattern.value)
    keys.value = result.keys || []
  } catch (e: any) { ElMessage.error(e.message || '扫描失败') }
  finally { scanLoading.value = false }
}

const loadValue = async () => {
  if (!selectedTaskId.value || !selectedKey.value) return
  try {
    kvForm.value.value = await getRedisValue(selectedTaskId.value, selectedKey.value) || ''
  } catch (e: any) { ElMessage.error(e.message || '读取失败') }
}

const doSet = async () => {
  if (!selectedTaskId.value || !kvForm.value.key) { ElMessage.warning('缺少参数'); return }
  try {
    await setRedisValue(selectedTaskId.value, kvForm.value.key, kvForm.value.value, kvForm.value.ttl || undefined)
    ElMessage.success('写入成功')
  } catch (e: any) { ElMessage.error(e.message || '写入失败') }
}

const doExpire = async () => {
  if (!selectedTaskId.value || !kvForm.value.ttl || !kvForm.value.key) { ElMessage.warning('请输入 TTL'); return }
  try {
    await expireRedisKey(selectedTaskId.value, kvForm.value.key, kvForm.value.ttl)
    ElMessage.success(`过期时间已设为 ${kvForm.value.ttl}s`)
  } catch (e: any) { ElMessage.error(e.message || '设置失败') }
}

const handleDeleteKey = async (key: string) => {
  if (!selectedTaskId.value) return
  try {
    await ElMessageBox.confirm(`确认删除 key: ${key}`, '提示', { type: 'warning' })
    await delRedisKeys(selectedTaskId.value, [key])
    if (selectedKey.value === key) selectedKey.value = ''
    await doScan()
  } catch (e: any) { if (e !== 'cancel') ElMessage.error(e.message || '删除失败') }
}

onMounted(loadMonitors)
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.ctrl-row { display: flex; align-items: flex-end; gap: 16px; background: var(--el-card-bg-color, #ffffff); padding: 14px 18px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 16px; }
.sel-group { display: flex; flex-direction: column; gap: 4px; }
.ctrl-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
.ctrl-select { width: 320px; }
.ctrl-input { width: 160px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; background: #f8fafc; color: #1f2937; transition: border-color 0.2s; }
.ctrl-input:focus { border-color: #3b82f6; background: #fff; }
.scan-btn { display: flex; align-items: center; gap: 6px; background: #3b82f6; color: #fff; border: none; border-radius: 10px; padding: 8px 18px; font-size: 13px; font-weight: 500; box-shadow: 0 2px 8px rgba(59,130,246,0.25); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.scan-btn:hover { background: #2563eb; transform: translateY(-1px); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

.redis-body { display: grid; grid-template-columns: 320px 1fr; gap: 16px; height: calc(100vh - 220px); min-height: 380px; }
.key-panel, .value-panel { background: var(--el-card-bg-color, #ffffff); border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); display: flex; flex-direction: column; overflow: hidden; }
.panel-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0); }
.panel-title { font-size: 13.5px; font-weight: 600; color: #1f2937; }
.panel-count { font-size: 12px; color: #9ca3af; }
.key-list { flex: 1; overflow: auto; padding: 6px; }
.key-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 8px; font-size: 12.5px; color: #4b5563; cursor: pointer; word-break: break-all; transition: all 0.2s; }
.key-item:hover { background: #f0f7ff; }
.key-item.active { background: #e0e7ff; color: #3b82f6; font-weight: 500; }
.del-btn { font-size: 16px; padding: 2px; opacity: 0.5; }
.del-btn:hover { opacity: 1; }

.value-card { flex: 1; padding: 16px 20px; overflow: auto; }
.kv-form :deep(.el-form-item__label) { font-weight: 500; color: #4b5563; font-size: 13px; }
.kv-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.action-btn { padding: 7px 14px; font-size: 13px; border-radius: 8px; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.action-btn:hover { transform: translateY(-1px); }
</style>
