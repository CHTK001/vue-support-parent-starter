<template>
  <LDialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)"
    title="模型推理参数" width="640px">
    <div v-loading="loading" class="omp">
      <div class="omp-head">
        <span class="omp-model" :title="modelId">{{ modelId }}</span>
        <el-tag v-if="recommended" size="small" type="warning">推荐模型</el-tag>
        <el-tag v-if="gpuUsable" size="small" type="success">本机 GPU 可用</el-tag>
        <el-tag v-else size="small" type="info">本机无 GPU / 缺 CUDA 组件</el-tag>
      </div>

      <!-- 推理设备 -->
      <div class="omp-field">
        <div class="omp-label">推理设备</div>
        <el-radio-group v-model="device">
          <el-radio-button v-for="opt in deviceOptions" :key="opt" :value="opt">
            {{ optLabel(opt) }}
          </el-radio-button>
        </el-radio-group>
        <p class="omp-hint">
          当前实际解析为 <b>{{ resolvedDevice || 'cpu' }}</b>。auto 表示按本机驱动与 CUDA 原生库自动判定；
          选择 gpu 但本机缺少 onnxruntime_gpu 构件时会自动回退 CPU。
        </p>
      </div>

      <!-- 通用数值参数 -->
      <div class="omp-field">
        <div class="omp-label">通用参数</div>
        <el-form label-width="150px" label-position="left">
          <el-form-item label="置信度阈值">
            <el-input v-model="threshold" placeholder="留空使用模型默认值" clearable />
          </el-form-item>
          <el-form-item label="NMS IOU 阈值">
            <el-input v-model="iouThreshold" placeholder="留空使用模型默认值" clearable />
          </el-form-item>
          <el-form-item label="推理线程数">
            <el-input v-model="threads" placeholder="留空使用运行时默认" clearable />
          </el-form-item>
        </el-form>
      </div>

      <!-- 模型特有额外参数 -->
      <div class="omp-field">
        <div class="omp-label">
          模型额外参数
          <el-button link type="primary" size="small" @click="addExtra">+ 添加</el-button>
        </div>
        <p class="omp-hint">
          不同模型支持的额外参数不同，由各自推理实现声明读取，例如 inputSize、candidates、
          providersParams 等。键名需与该模型的实现一致，否则不会生效。
        </p>
        <div v-for="(row, i) in extras" :key="i" class="omp-extra">
          <el-input v-model="row.key" placeholder="参数键，如 inputSize" style="width: 200px" />
          <el-input v-model="row.value" placeholder="参数值" style="flex: 1" />
          <el-button link type="danger" @click="extras.splice(i, 1)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <div v-if="extras.length === 0" class="omp-empty">暂无额外参数</div>
      </div>

      <p v-if="error" class="omp-error">{{ error }}</p>
    </div>

    <template #footer>
      <el-button @click="resetAll" :disabled="saving">恢复默认</el-button>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </LDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { adminApi } from '@/framework/context'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  modelId: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const deviceOptions = ref(['auto', 'cpu', 'gpu'])
const gpuUsable = ref(false)
const recommended = ref(false)
const resolvedDevice = ref('')
const schema = ref({})

const device = ref('auto')
const threshold = ref('')
const iouThreshold = ref('')
const threads = ref('')
const extras = ref([])

const optLabel = (v) => (v === 'auto' ? '自动' : v === 'cpu' ? 'CPU' : 'GPU')

const load = async () => {
  if (!props.modelId) return
  loading.value = true
  error.value = ''
  try {
    const res = await adminApi.get(`/v2/onnx/model-params/${encodeURIComponent(props.modelId)}`)
    const data = res?.data || res || {}
    deviceOptions.value = data.deviceOptions?.length ? data.deviceOptions : ['auto', 'cpu', 'gpu']
    schema.value = data.schema || {}
    resolvedDevice.value = data.resolvedDevice || ''
    recommended.value = !!data.recommended
    const params = data.params || {}
    device.value = params.device || 'auto'
    threshold.value = params.threshold ?? ''
    iouThreshold.value = params.iouThreshold ?? ''
    threads.value = params.threads ?? ''
    const known = ['device', 'threshold', 'iouThreshold', 'threads']
    extras.value = Object.entries(params)
      .filter(([k]) => !known.includes(k))
      .map(([key, value]) => ({ key, value: value == null ? '' : String(value) }))
  } catch (e) {
    error.value = e?.message || '加载模型参数失败'
  } finally {
    loading.value = false
  }
}

const loadDeviceStatus = async () => {
  try {
    const res = await adminApi.get('/v2/onnx/model-params/device-status', {
      params: { model_id: props.modelId }
    })
    const data = res?.data || res || {}
    gpuUsable.value = !!data.gpuUsable
  } catch {
    gpuUsable.value = false
  }
}

const addExtra = () => extras.value.push({ key: '', value: '' })

const collect = () => {
  const params = {}
  if (device.value && device.value !== 'auto') params.device = device.value
  else if (device.value === 'auto') delete params.device
  if (threshold.value !== '' && threshold.value != null) params.threshold = Number(threshold.value)
  if (iouThreshold.value !== '' && iouThreshold.value != null) params.iouThreshold = Number(iouThreshold.value)
  if (threads.value !== '' && threads.value != null) params.threads = Number(threads.value)
  for (const row of extras.value) {
    const k = (row.key || '').trim()
    if (!k) continue
    const raw = row.value
    const num = Number(raw)
    params[k] = raw !== '' && !Number.isNaN(num) ? num : raw
  }
  return params
}

const submit = async () => {
  saving.value = true
  error.value = ''
  try {
    await adminApi.put(`/v2/onnx/model-params/${encodeURIComponent(props.modelId)}`, collect())
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
    error.value = e?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

const resetAll = async () => {
  saving.value = true
  error.value = ''
  try {
    await adminApi.delete(`/v2/onnx/model-params/${encodeURIComponent(props.modelId)}`)
    device.value = 'auto'
    threshold.value = ''
    iouThreshold.value = ''
    threads.value = ''
    extras.value = []
    emit('saved')
  } catch (e) {
    error.value = e?.message || '重置失败'
  } finally {
    saving.value = false
  }
}

watch(() => props.modelValue, (v) => {
  if (v && props.modelId) {
    load()
    loadDeviceStatus()
  }
})

watch(() => props.modelId, (v) => {
  if (props.modelValue && v) load()
})
</script>

<style scoped>
.omp {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.omp-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.omp-model {
  font-weight: 600;
  font-family: monospace;
}

.omp-field {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px;
}

.omp-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.omp-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 6px 0 0;
  line-height: 1.6;
}

.omp-extra {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.omp-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 8px;
}

.omp-error {
  color: var(--el-color-danger);
  font-size: 12px;
  margin: 0;
}
</style>
