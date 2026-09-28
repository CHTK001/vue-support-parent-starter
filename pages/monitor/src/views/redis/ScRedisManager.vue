<template>
  <div class="redis-mgr fade-in">
    <ReCard layout="simple" :radius="12" :padding="0" shadow="never">
      <div class="ctrl-row">
        <div class="sel-group">
          <label class="ctrl-label">选择 Redis 任务</label>
          <ReSelect v-model="selectedTaskId" placeholder="请选择任务" class="ctrl-select" @change="onTaskChange"
            :data="redisTasks.map(t => ({ label: `${t.monitorTaskName} [${getMonitorLabel(t.monitorId)}]`, value: t.id }))" />
        </div>
        <div class="sel-group">
          <label class="ctrl-label">Key 前缀</label>
          <input v-model="scanPattern" placeholder="例如：user:*" class="ctrl-input" @keyup.enter="doScan" />
        </div>
        <div class="ctrl-actions">
          <ReButton show-text icon="Search" @click="doScan">扫描</ReButton>
        </div>
      </div>
    </ReCard>

    <div class="redis-body">
      <ReCard layout="simple" :radius="12" :padding="0" shadow="never">
        <template #header>
          <div class="panel-head">
            <span class="panel-title">Redis Keys</span>
            <span class="panel-count dim">{{ filteredKeys.length }} 个</span>
          </div>
        </template>
        <template v-if="scanLoading">
          <div class="key-skeleton">
            <ReSkeleton loading :rows="6" :count="1" animated />
          </div>
        </template>
        <div v-else class="key-list">
          <div v-for="k in filteredKeys" :key="k" :class="['key-item', { active: selectedKey === k }]" @click="selectedKey = k; loadValue()">
            <span class="key-text">{{ k }}</span>
            <ReButton link type="danger" @click.stop="handleDeleteKey(k)" class="del-btn"><ReIcon name="Close" /></ReButton>
          </div>
          <ReEmpty v-if="filteredKeys.length === 0" description="暂无数据，请先扫描" :image-size="60" />
        </div>
      </ReCard>

      <ReCard layout="simple" :radius="12" :padding="0" shadow="never">
        <template #header>
          <div class="panel-head"><span class="panel-title">键值操作</span></div>
        </template>
        <div class="value-card" v-if="selectedKey">
          <ReForm :model="kvForm" label-position="top" class="kv-form">
            <ReFormItem label="Key"><ReInput v-model="kvForm.key" disabled /></ReFormItem>
            <ReFormItem label="Type">
              <ReTag :type="getTypeColor(kvForm.type)">
                {{ kvForm.type || 'string' }}
              </ReTag>
            </ReFormItem>
            <ReFormItem label="Value"><ReInput v-model="kvForm.value" type="textarea" :rows="8" placeholder="键值内容" /></ReFormItem>
            <ReFormItem label="TTL (秒, 空=永久)"><ReInputNumber v-model="kvForm.ttl" :min="1" controls-position="right" placeholder="永久" /></ReFormItem>
            <div class="kv-actions">
              <ReButton show-text icon="View" @click="loadValue">读取</ReButton>
              <ReButton show-text icon="EditPen" @click="doSet">写入</ReButton>
              <ReButton show-text icon="Timer" @click="doExpire">设置过期</ReButton>
              <ReButton show-text icon="Delete" type="danger" @click="handleDeleteKey(selectedKey)">删除</ReButton>
            </div>
          </ReForm>
        </div>
        <div v-else class="value-empty">
          <ReEmpty description="请从左侧选择一个 Key" :image-size="60" />
        </div>
      </ReCard>
    </div>
  </div>
</template>

<script setup lang="ts" name="ReRedisManager">
import { ref, computed, onMounted } from 'vue'
import { message } from '@repo/core'
import { getMonitors, getTasks, scanRedisKeys, getRedisValue, setRedisValue, delRedisKeys, expireRedisKey } from '../../api'

const monitors = ref<any[]>([])
const monitorMap = ref(new Map<number, any>())
const redisTasks = ref<any[]>([])
const selectedTaskId = ref<number | null>(null)
const scanPattern = ref('*')
const scanLoading = ref(false)
const keys = ref<string[]>([])
const keyFilter = ref('')
const selectedKey = ref('')
const kvForm = ref({ key: '', value: '', type: 'string', ttl: 0 })

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
    redisTasks.value = (await getTasks()).filter((t: any) => t.monitorId && monitors.value.some((m: any) => m.id === t.monitorId && m.serviceType === 'REDIS'))
    if (redisTasks.value.length) selectedTaskId.value = redisTasks.value[0].id
  } catch (e: any) { message.error(e.message || '加载数据失败') }
}

const doScan = async () => {
  if (!selectedTaskId.value) { message.warning('请先选择任务'); return }
  scanLoading.value = true
  try {
    const result = await scanRedisKeys(selectedTaskId.value, scanPattern.value)
    keys.value = result.keys || []
  } catch (e: any) { message.error(e.message || '扫描失败') }
  finally { scanLoading.value = false }
}

const loadValue = async () => {
  if (!selectedTaskId.value || !selectedKey.value) return
  try {
    const result = await getRedisValue(selectedTaskId.value, selectedKey.value)
    // 适配新的结构化返回 {key, value, type, ttl}
    kvForm.value.key = result?.key || selectedKey.value
    kvForm.value.value = result?.value ?? ''
    // 如果有 TTL 信息，更新表单
    if (result?.ttl != null && result.ttl >= 0) {
      kvForm.value.ttl = result.ttl
    }
  } catch (e: any) { message.error(e.message || '读取失败') }
}

const doSet = async () => {
  if (!selectedTaskId.value || !kvForm.value.key) { message.warning('缺少参数'); return }
  try {
    await setRedisValue(selectedTaskId.value, kvForm.value.key, kvForm.value.value, kvForm.value.ttl || undefined)
    message.success('写入成功')
  } catch (e: any) { message.error(e.message || '写入失败') }
}

const doExpire = async () => {
  if (!selectedTaskId.value || !kvForm.value.ttl || !kvForm.value.key) { message.warning('请输入 TTL'); return }
  try {
    await expireRedisKey(selectedTaskId.value, kvForm.value.key, kvForm.value.ttl)
    message.success(`过期时间已设为 ${kvForm.value.ttl}s`)
  } catch (e: any) { message.error(e.message || '设置失败') }
}

const handleDeleteKey = async (key: string) => {
  if (!selectedTaskId.value) return
  try {
    await message.confirm(`确认删除 key: ${key}`)
    await delRedisKeys(selectedTaskId.value, [key])
    if (selectedKey.value === key) selectedKey.value = ''
    await doScan()
  } catch (e: any) { if (!e) return; message.error(e.message || '删除失败') }
}

const getTypeColor = (type: string) => {
  const map: Record<string, any> = {
    string: '',
    hash: 'warning',
    list: 'success',
    set: 'info',
    zset: '',
    raw_bytes: 'danger'
  }
  return map[type] ?? ''
}

onMounted(loadMonitors)
</script>

 <style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.ctrl-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 14px 18px;
  margin-bottom: 16px;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}
.sel-group { display: flex; flex-direction: column; gap: 4px; }
.ctrl-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.ctrl-select { width: 320px; }
.ctrl-input {
  width: 160px;
  padding: 8px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-sm);
  font-size: 13px;
  outline: none;
  background: var(--bg-fill);
  color: var(--text-primary);
  transition: var(--transition-base);
}
.ctrl-input:focus {
  border-color: var(--brand-500);
  background: var(--bg-container);
}
.scan-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--border-radius-sm);
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition-base);
}
.scan-btn:hover { transform: translateY(-1px); }

.redis-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 380px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.panel-title { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.panel-count { font-size: 12px; color: var(--text-tertiary); }
.key-list {
  flex: 1;
  overflow: auto;
  padding: 6px;
}
.key-skeleton {
  flex: 1;
  padding: 12px;
}
.value-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.key-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--border-radius-sm);
  font-size: 12.5px;
  color: var(--text-secondary);
  cursor: pointer;
  word-break: break-all;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.key-item:hover {
  background: color-mix(in srgb, var(--brand-500) 6%, transparent);
  transform: translateX(2px);
}
.key-item.active {
  background: color-mix(in srgb, var(--metric-cpu) 8%, transparent);
  border-color: var(--metric-cpu);
  color: var(--text-primary);
  font-weight: 500;
}
.del-btn {
  font-size: 16px;
  padding: 2px;
  opacity: 0.5;
  transition: opacity var(--transition-base);
}
.del-btn:hover { opacity: 1; }

.value-card {
  flex: 1;
  padding: 16px 20px;
  overflow: auto;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}
.kv-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 13px;
}
.kv-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.action-btn {
  padding: 7px 14px;
  font-size: 13px;
  border-radius: var(--border-radius-sm);
  transition: var(--transition-base);
}
.action-btn:hover { transform: translateY(-1px); }

/* 可访问性：键盘焦点可见 */
.ctrl-input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.ctrl-select:focus-within,
.ctrl-input:focus {
  border-color: var(--brand-500);
}
.key-item:focus-visible,
.del-btn:focus-visible,
.kv-actions :deep(.re-btn):focus-visible,
.ctrl-actions :deep(.re-btn):focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--border-radius-sm);
}
.ctrl-input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}
.ctrl-row,
.value-card,
.key-item,
.del-btn,
.kv-actions {
  transition: box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}
.ctrl-row:hover,
.value-card:hover {
  box-shadow: var(--shadow-card-hover);
}

/* 响应式 */
@media (max-width: 900px) {
  .ctrl-row {
    flex-direction: column;
    align-items: stretch;
  }
  .ctrl-select {
    width: 100%;
  }
  .ctrl-input {
    width: 100%;
  }
  .redis-body {
    grid-template-columns: 1fr;
    height: auto;
  }
  .key-list {
    max-height: 300px;
  }
}
</style>
