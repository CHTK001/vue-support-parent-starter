<template>
  <div class="model-metrics-settings">
    <el-form :model="form" label-width="180px" class="settings-form">
      <el-form-item label="模型指标采集开关">
        <el-switch v-model="form.enabled" />
        <span class="form-tip">开启后采集模型调用指标（Token、延迟等）</span>
      </el-form-item>
      <el-form-item label="定时同步时间">
        <el-time-picker
          v-model="form.syncTime"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="选择每日同步时间"
        />
        <span class="form-tip">每天定时同步模型指标到数据库</span>
      </el-form-item>
      <el-form-item label="同步时清空旧数据">
        <el-switch v-model="form.clearBeforeSync" />
        <span class="form-tip">开启后每次同步前清空旧的指标数据</span>
      </el-form-item>
      <el-form-item label="使用官方定价">
        <el-switch v-model="form.useOfficialPricing" />
        <span class="form-tip">开启后用量金额使用官方定价计算</span>
      </el-form-item>
      <el-form-item label="手动同步">
        <el-button type="primary" @click="manualSync" :loading="syncing">立即同步指标</el-button>
        <span class="form-tip">手动触发模型指标数据同步</span>
      </el-form-item>
    </el-form>
    <div class="form-actions">
      <el-button type="primary" @click="save" :loading="saving">保存指标配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { modelMetricsApi } from '@/services/javaApi'

const form = ref({
  enabled: true,
  syncTime: '03:00',
  clearBeforeSync: true,
  useOfficialPricing: true,
})

const saving = ref(false)
const syncing = ref(false)

const load = async () => {
  try {
    const data = await modelMetricsApi.getConfig()
    if (data) {
      form.value = { ...form.value, ...data }
    }
  } catch (e) {
    console.error('加载模型指标配置失败:', e)
  }
}

const save = async () => {
  saving.value = true
  try {
    await modelMetricsApi.updateConfig(form.value)
    ElMessage.success('模型指标配置保存成功')
  } catch (e) {
    console.error('保存模型指标配置失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const manualSync = async () => {
  syncing.value = true
  try {
    await modelMetricsApi.refresh()
    ElMessage.success('指标同步已触发')
  } catch (e) {
    console.error('手动同步失败:', e)
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.model-metrics-settings {
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

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
