<template>
  <el-dialog
    v-model="visible"
    title="执行脚本"
    width="70%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="execute-dialog">
      <!-- 脚本信息 -->
      <div class="script-info">
        <div class="info-header">
          <IconifyIconOnline :icon="getScriptIcon(scriptData?.type)" />
          <div class="script-details">
            <h3>{{ scriptData?.name || '未知脚本' }}</h3>
            <p>{{ scriptData?.description || '暂无描述' }}</p>
          </div>
          <el-tag :type="getScriptTypeTagType(scriptData?.type)" size="small">
            {{ scriptData?.type }}
          </el-tag>
        </div>
      </div>

      <!-- 执行参数配置 -->
      <div class="execute-config">
        <h4>执行配置</h4>
        <el-form :model="executeForm" label-width="100px">
          <el-form-item label="执行参数">
            <el-input
              v-model="executeForm.parameters"
              type="textarea"
              :rows="2"
              placeholder="请输入执行参数，多个参数用空格分隔"
            />
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="工作目录">
                <el-input
                  v-model="executeForm.workingDir"
                  placeholder="脚本执行的工作目录"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="超时时间">
                <el-input-number
                  v-model="executeForm.timeout"
                  :min="1"
                  :max="3600"
                  placeholder="秒"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="环境变量">
            <div class="env-variables">
              <div
                v-for="(env, index) in executeForm.envVars"
                :key="index"
                class="env-item"
              >
                <el-input
                  v-model="env.key"
                  placeholder="变量名"
                  style="width: 40%"
                />
                <span>=</span>
                <el-input
                  v-model="env.value"
                  placeholder="变量值"
                  style="width: 40%"
                />
                <el-button
                  type="danger"
                  size="small"
                  @click="removeEnvVar(index)"
                >
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </div>
              <el-button
                type="primary"
                size="small"
                @click="addEnvVar"
              >
                <IconifyIconOnline icon="ri:add-line" />
                添加环境变量
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="执行选项">
            <el-checkbox v-model="executeForm.async">异步执行</el-checkbox>
            <el-checkbox v-model="executeForm.saveOutput">保存输出</el-checkbox>
          </el-form-item>
        </el-form>
      </div>

      <!-- 执行结果 -->
      <div v-if="executionResult" class="execution-result">
        <h4>执行结果</h4>
        <div class="result-header">
          <el-tag
            :type="getStatusTagType(executionResult.status)"
            size="large"
          >
            <IconifyIconOnline :icon="getStatusIcon(executionResult.status)" />
            {{ getStatusText(executionResult.status) }}
          </el-tag>
          <span v-if="executionResult.duration" class="duration">
            耗时: {{ formatDuration(executionResult.duration) }}
          </span>
        </div>

        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane label="标准输出" name="stdout">
            <div class="output-content">
              <pre v-if="executionResult.stdout">{{ executionResult.stdout }}</pre>
              <div v-else class="no-output">暂无输出</div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="错误输出" name="stderr">
            <div class="output-content">
              <pre v-if="executionResult.stderr">{{ executionResult.stderr }}</pre>
              <div v-else class="no-output">暂无错误输出</div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="执行信息" name="info">
            <div class="execution-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="执行ID">
                  {{ executionResult.id }}
                </el-descriptions-item>
                <el-descriptions-item label="退出码">
                  {{ executionResult.exitCode ?? '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">
                  {{ formatTime(executionResult.startTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ formatTime(executionResult.endTime) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="executionResult?.status === 'running'"
          type="danger"
          @click="handleStop"
          :loading="stopping"
        >
          停止执行
        </el-button>
        <el-button
          type="primary"
          @click="handleExecute"
          :loading="executing"
          :disabled="!scriptData"
        >
          {{ executionResult?.status === 'running' ? '执行中...' : '开始执行' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import IconifyIconOnline from '@/components/ReIcon/src/iconifyIconOnline'

// Props
interface Props {
  modelValue: boolean
  server: any
  scriptData?: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

// 响应式数据
const visible = ref(false)
const executing = ref(false)
const stopping = ref(false)
const activeTab = ref('stdout')
const executionResult = ref(null)

const executeForm = reactive({
  parameters: '',
  workingDir: '',
  timeout: 300,
  envVars: [],
  async: false,
  saveOutput: true
})

// 监听器
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    resetForm()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 方法
const resetForm = () => {
  executeForm.parameters = ''
  executeForm.workingDir = ''
  executeForm.timeout = 300
  executeForm.envVars = []
  executeForm.async = false
  executeForm.saveOutput = true
  executionResult.value = null
}

const addEnvVar = () => {
  executeForm.envVars.push({ key: '', value: '' })
}

const removeEnvVar = (index: number) => {
  executeForm.envVars.splice(index, 1)
}

const handleExecute = async () => {
  if (!props.scriptData) {
    ElMessage.warning('请选择要执行的脚本')
    return
  }

  executing.value = true
  try {
    // TODO: 调用API执行脚本
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟执行结果
    executionResult.value = {
      id: Date.now(),
      status: 'running',
      startTime: new Date(),
      endTime: null,
      duration: null,
      exitCode: null,
      stdout: '脚本开始执行...\n',
      stderr: ''
    }

    // 模拟异步更新结果
    setTimeout(() => {
      if (executionResult.value) {
        executionResult.value.status = 'success'
        executionResult.value.endTime = new Date()
        executionResult.value.duration = 5000
        executionResult.value.exitCode = 0
        executionResult.value.stdout += '脚本执行完成\n退出码: 0'
      }
    }, 3000)

    emit('success')
  } catch (error) {
    ElMessage.error('脚本执行失败')
  } finally {
    executing.value = false
  }
}

const handleStop = async () => {
  stopping.value = true
  try {
    // TODO: 调用API停止脚本
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (executionResult.value) {
      executionResult.value.status = 'cancelled'
      executionResult.value.endTime = new Date()
    }
    
    ElMessage.success('脚本执行已停止')
  } catch (error) {
    ElMessage.error('停止脚本失败')
  } finally {
    stopping.value = false
  }
}

const handleClose = () => {
  visible.value = false
}

// 工具函数
const formatTime = (date: Date | null) => {
  return date ? date.toLocaleString() : '无'
}

const formatDuration = (duration: number | null) => {
  if (!duration) return '0s'
  
  if (duration < 1000) {
    return `${duration}ms`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m${seconds}s`
  }
}

const getScriptIcon = (type: string) => {
  const iconMap = {
    shell: 'ri:terminal-line',
    python: 'ri:code-s-slash-line',
    powershell: 'ri:windows-line',
    batch: 'ri:file-text-line'
  }
  return iconMap[type] || 'ri:file-text-line'
}

const getScriptTypeTagType = (type: string) => {
  const typeMap = {
    shell: 'success',
    python: 'warning',
    powershell: 'info',
    batch: 'primary'
  }
  return typeMap[type] || 'default'
}

const getStatusTagType = (status: string) => {
  const typeMap = {
    success: 'success',
    failed: 'danger',
    running: 'warning',
    cancelled: 'info'
  }
  return typeMap[status] || 'default'
}

const getStatusIcon = (status: string) => {
  const iconMap = {
    success: 'ri:check-line',
    failed: 'ri:close-line',
    running: 'ri:loader-line',
    cancelled: 'ri:stop-line'
  }
  return iconMap[status] || 'ri:question-line'
}

const getStatusText = (status: string) => {
  const textMap = {
    success: '执行成功',
    failed: '执行失败',
    running: '执行中',
    cancelled: '已取消'
  }
  return textMap[status] || '未知状态'
}
</script>

<style scoped lang="scss">
.execute-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.script-info {
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;

  .info-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .iconify {
      font-size: 24px;
      color: #3b82f6;
      margin-top: 4px;
    }

    .script-details {
      flex: 1;

      h3 {
        margin: 0 0 4px 0;
        font-size: 18px;
        color: #111827;
      }

      p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }
    }
  }
}

.execute-config {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 16px 0;
    color: #111827;
    font-size: 16px;
  }

  .env-variables {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;

    .env-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.execution-result {
  h4 {
    margin: 0 0 16px 0;
    color: #111827;
    font-size: 16px;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .duration {
      color: #6b7280;
      font-size: 14px;
    }
  }

  .result-tabs {
    .output-content {
      max-height: 300px;
      overflow-y: auto;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 12px;

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        line-height: 1.4;
      }

      .no-output {
        color: #9ca3af;
        text-align: center;
        padding: 20px;
        font-style: italic;
      }
    }

    .execution-info {
      padding: 12px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
