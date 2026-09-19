<template>
  <div class="usage-config-settings">
    <el-form :model="form" label-width="180px" class="settings-form">
      <el-form-item label="用量统计开关">
        <el-switch v-model="form.enabled" />
        <span class="form-tip">开启后记录所有API调用用量</span>
      </el-form-item>
      <el-form-item label="定时同步时间">
        <el-time-picker
          v-model="form.syncTime"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="选择每日同步时间"
        />
        <span class="form-tip">每天定时同步用量数据（仅同步当天数据）</span>
      </el-form-item>
      <el-form-item label="后台时间轮询间隔">
        <el-input-number v-model="form.pollInterval" :min="1" :max="1440" />
        <span class="form-tip">分钟，后台轮询用量数据的间隔</span>
      </el-form-item>
      <el-form-item label="Provider SPI开关">
        <el-switch v-model="form.providerSpiEnabled" />
        <span class="form-tip">开启后同步时只同步已开启的Provider</span>
      </el-form-item>
      <el-form-item label="手动全量同步">
        <div class="sync-actions">
          <el-button 
            type="primary" 
            @click="manualSync" 
            :loading="taskStatus.aggregateAllRunning"
            :disabled="taskStatus.aggregateAllRunning"
          >
            {{ taskStatus.aggregateAllRunning ? '同步中...' : '立即全量同步' }}
          </el-button>
          <el-button 
            v-if="taskStatus.aggregateAllRunning" 
            type="danger" 
            @click="cancelSync"
          >
            取消
          </el-button>
        </div>
        <span class="form-tip">手动触发全量用量数据同步，重复点击会取消前一次任务</span>
      </el-form-item>
    </el-form>
    <div class="form-actions">
      <el-button type="primary" @click="save" :loading="saving">保存用量配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { usageApi } from '@/services/javaApi'

const form = ref({
  enabled: true,
  syncTime: '02:00',
  pollInterval: 60,
  providerSpiEnabled: true,
})

const saving = ref(false)
const taskStatus = ref({
  aggregateRunning: false,
  aggregateAllRunning: false,
})

// SSE 连接
let eventSource: EventSource | null = null

const load = async () => {
  try {
    const res = await usageApi.config()
    const data = res?.data || res
    if (data) {
      form.value = { ...form.value, ...data }
    }
  } catch (e) {
    console.error('加载用量配置失败:', e)
  }
  // 连接 SSE
  connectSSE()
}

// 连接 SSE
const connectSSE = () => {
  disconnectSSE()
  eventSource = new EventSource('/v2/usage/task-status/stream')
  
  eventSource.addEventListener('status', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data)
      taskStatus.value = data
    } catch (err) {
      console.error('SSE 解析错误:', err)
    }
  })
  
  eventSource.onerror = () => {
    console.warn('SSE 连接断开，5秒后重连')
    setTimeout(connectSSE, 5000)
  }
}

// 断开 SSE
const disconnectSSE = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

const save = async () => {
  saving.value = true
  try {
    await usageApi.updateConfig(form.value)
    ElMessage.success('用量配置保存成功')
  } catch (e) {
    console.error('保存用量配置失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const manualSync = async () => {
  try {
    await usageApi.syncAll()
    ElMessage.success('全量同步已触发')
  } catch (e) {
    console.error('手动同步失败:', e)
    ElMessage.error('同步失败')
  }
}

const cancelSync = async () => {
  try {
    await fetch('/v2/usage/aggregate-all/cancel', { method: 'POST' })
    ElMessage.success('已取消全量同步任务')
  } catch (e) {
    console.error('取消同步失败:', e)
    ElMessage.error('取消失败')
  }
}

onMounted(load)
onUnmounted(disconnectSSE)
</script>

<style scoped>
.usage-config-settings {
  max-width: 700px;
}

.settings-form {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.sync-actions {
  display: flex;
  gap: 8px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
