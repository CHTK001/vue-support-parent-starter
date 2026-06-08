<template>
  <div class="p-6">
    <el-card class="mb-6 shadow-sm rounded-xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-el-text">主动采集器管理</h2>
        <el-button type="primary" @click="refreshStats">刷新状态</el-button>
      </div>

      <div class="mb-4">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="Kafka 采集器">
            <el-tag :type="stats.kafka?.running ? 'success' : 'info'" size="small">
              {{ stats.kafka?.running ? '运行中' : '未运行' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="RabbitMQ 采集器">
            <el-tag :type="stats.rabbitmq?.running ? 'success' : 'info'" size="small">
              {{ stats.rabbitmq?.running ? '运行中' : '未运行' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="ActiveMQ 采集器">
            <el-tag :type="stats.activemq?.running ? 'success' : 'info'" size="small">
              {{ stats.activemq?.running ? '运行中' : '未运行' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 当前映射 -->
      <div class="mb-6">
        <h3 class="text-lg font-medium text-el-text mb-3">当前映射关系</h3>
        <el-table :data="mappings" border style="width: 100%">
          <el-table-column prop="protocol" label="协议" width="120" />
          <el-table-column prop="topic" label="Topic" width="200" />
          <el-table-column prop="pipelineId" label="Pipeline ID" width="200" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="unregisterMapping(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 新增映射 -->
      <div>
        <h3 class="text-lg font-medium text-el-text mb-3">新增映射</h3>
        <el-form :model="newMapping" inline>
          <el-form-item label="协议">
            <el-select v-model="newMapping.protocol" placeholder="选择协议">
              <el-option label="Kafka" value="KAFKA" />
              <el-option label="RabbitMQ" value="RABBITMQ" />
              <el-option label="ActiveMQ" value="ACTIVEMQ" />
            </el-select>
          </el-form-item>
          <el-form-item label="Topic">
            <el-input v-model="newMapping.topic" placeholder="请输入 Topic" />
          </el-form-item>
          <el-form-item label="Pipeline ID">
            <el-input v-model="newMapping.pipelineId" placeholder="请输入 Pipeline ID" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="registerMapping">注册</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const stats = ref<any>({})
const mappings = ref<any[]>([])
const newMapping = ref({
  protocol: 'KAFKA',
  topic: '',
  pipelineId: ''
})

const refreshStats = async () => {
  try {
    const response = await fetch('/api/active-collector/stats')
    const data = await response.json()
    stats.value = data
    mappings.value = data.mappings || []
  } catch (error) {
    ElMessage.error('获取状态失败')
  }
}

const registerMapping = async () => {
  if (!newMapping.value.topic || !newMapping.value.pipelineId) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    await fetch('/api/active-collector/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMapping.value)
    })
    ElMessage.success('映射注册成功')
    refreshStats()
    newMapping.value.topic = ''
    newMapping.value.pipelineId = ''
  } catch (error) {
    ElMessage.error('注册失败')
  }
}

const unregisterMapping = async (row: any) => {
  await ElMessageBox.confirm('确定删除该映射?', '确认')
  try {
    await fetch(`/api/active-collector/mapping?protocol=${row.protocol}&topic=${row.topic}`, {
      method: 'DELETE'
    })
    ElMessage.success('删除成功')
    refreshStats()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  refreshStats()
})
</script>