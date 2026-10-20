<template>
  <LDialog v-model="dialogVisible" :title="isEdit ? t('scheduler.edit.editTitle') : t('scheduler.edit.createTitle')" width="775px" align-center
    destroy-on-close class="dialog-with-scroll" style="max-height: 70vh;">
    <div class="dialog-content">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="left" label-width="100px" size="default">
        <!-- 基本信息 -->
        <el-form-item :label="t('scheduler.edit.nameLabel')" prop="name">
          <el-input v-model="form.name" :placeholder="t('scheduler.edit.namePlaceholder')" clearable />
        </el-form-item>

        <el-form-item :label="t('scheduler.edit.descLabel')" prop="description">
          <el-input v-model="form.description" :placeholder="t('scheduler.edit.descPlaceholder')" clearable />
        </el-form-item>

        <el-form-item :label="t('scheduler.edit.promptLabel')" prop="prompt">
          <el-input v-model="form.prompt" type="textarea" :rows="3"
            :placeholder="t('scheduler.edit.promptPlaceholder')" />
        </el-form-item>

        <!-- 时间设置：对应后端 schedule 对象（kind=cron / kind=every） -->
        <el-form-item :label="t('scheduler.edit.timeLabel')" required class="time-setting-item">
          <div class="time-mode-wrapper">
            <el-radio-group v-model="timeMode" class="time-mode-tabs">
              <el-radio-button value="preset">{{ t('scheduler.edit.modePreset') }}</el-radio-button>
              <el-radio-button value="every">{{ t('scheduler.edit.modeEvery') }}</el-radio-button>
              <el-radio-button value="cron">{{ t('scheduler.edit.modeCron') }}</el-radio-button>
            </el-radio-group>

            <!-- 常用调度：GET /api/cron/jobs/cron-presets -->
            <div v-if="timeMode === 'preset'" class="schedule-panel">
              <el-select v-model="form.presetCron" :placeholder="t('scheduler.edit.presetPlaceholder')" style="width: 260px">
                <el-option v-for="preset in cronPresets" :key="preset.value" :label="preset.label" :value="preset.value">
                  <div class="flex items-center justify-between gap-3">
                    <span>{{ preset.label }}</span>
                    <span class="text-gray-400 text-xs font-mono">{{ preset.value }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="text-xs text-gray-400 mt-1 font-mono">{{ form.presetCron || '-' }}</div>
            </div>

            <!-- 固定间隔：schedule.kind = every + every_ms -->
            <div v-else-if="timeMode === 'every'" class="schedule-panel flex items-center gap-2">
              <span class="text-xs text-gray-500">{{ t('scheduler.edit.every') }}</span>
              <ReNumberSelect v-model="everyConfig.value" :min="1" :max="9999" controls-position="right"
                style="width: 120px" />
              <el-select v-model="everyConfig.unit" style="width: 100px">
                <el-option :label="t('scheduler.edit.unitMinute')" value="minute" />
                <el-option :label="t('scheduler.edit.unitHour')" value="hour" />
              </el-select>
              <span class="text-xs text-gray-500">{{ t('scheduler.edit.execOnce') }}</span>
            </div>

            <!-- 自定义 Cron：六段表达式（秒 分 时 日 月 周） -->
            <div v-else class="schedule-panel">
              <el-input v-model="form.cronExpression" placeholder="0 0 9 * * *" class="font-mono text-sm"
                style="width: 260px" />
              <div class="text-xs text-gray-400 mt-1">
                {{ t('scheduler.edit.cronFormat') }}
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 执行目标：新建会话 / 指定会话（metadata.conversation_id） -->
        <el-form-item :label="t('scheduler.edit.targetLabel')" prop="targetMode">
          <el-radio-group v-model="form.targetMode" :disabled="isEdit">
            <el-radio-button value="new_conversation">
              <span class="flex items-center gap-1">
                <el-icon :size="14">
                  <AddCircleOutlineRound />
                </el-icon>
                {{ t('scheduler.edit.newSession') }}
              </span>
            </el-radio-button>
            <el-radio-button value="existing_conversation">
              <span class="flex items-center gap-1">
                <el-icon :size="14">
                  <LogInRound />
                </el-icon>
                {{ t('scheduler.edit.existingSession') }}
              </span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 已有会话时需要选择会话ID -->
        <el-form-item v-if="form.targetMode === 'existing_conversation'" :label="t('scheduler.edit.targetSessionLabel')"
          prop="conversationId">
          <el-input v-model="form.conversationId" :placeholder="t('scheduler.edit.targetSessionPlaceholder')" clearable
            :disabled="isEdit" />
          <div v-if="isEdit" class="text-xs text-gray-400 mt-1">{{ t('scheduler.edit.createOnlyHint') }}</div>
        </el-form-item>

        <!-- Agent 类型（metadata.agent_type），来自 GET /api/agents 目录 -->
        <el-form-item :label="t('scheduler.edit.agentLabel')" prop="agentType">
          <el-select v-model="form.agentType" :placeholder="t('scheduler.edit.agentPlaceholder')" style="width: 100%"
            filterable :disabled="isEdit">
            <el-option v-for="agent in agents" :key="agent.agent_id" :label="agent.name" :value="agent.agent_id">
              <div class="flex items-center justify-between gap-3">
                <span>{{ agent.name }}</span>
                <span class="text-gray-400 text-xs">{{ agent.agent_source }}</span>
              </div>
            </el-option>
          </el-select>
          <div v-if="isEdit" class="text-xs text-gray-400 mt-1">{{ t('scheduler.edit.createOnlyHint') }}</div>
        </el-form-item>

        <!-- 模型（metadata.agent_config：provider_id + model），后端执行时按此建会话 -->
        <el-form-item :label="t('scheduler.edit.modelLabel')" prop="modelId">
          <el-select v-model="form.modelId" :placeholder="t('scheduler.edit.modelPlaceholder')" style="width: 100%" filterable clearable>
            <el-option v-for="model in availableModels" :key="model.id" :label="model.modelName" :value="model.id">
              <div class="flex items-center gap-2">
                <span>{{ model.modelName }}</span>
                <span class="text-gray-400 text-xs">{{ model.providerName }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 可选配置 -->
        <el-divider content-position="left">{{ t('scheduler.edit.advanced') }}</el-divider>

        <!-- state.max_retries：后端仅此一个重试字段，无重试间隔与最大执行次数 -->
        <el-form-item :label="t('scheduler.edit.retryCount')">
          <ReNumberSelect v-model="form.maxRetries" :min="0" :max="10" controls-position="right"
            style="width: 120px" />
        </el-form-item>

        <el-form-item :label="t('scheduler.edit.enabledLabel')">
          <el-switch v-model="form.enabled" inline-prompt :active-text="t('scheduler.edit.enable')" :inactive-text="t('scheduler.edit.disable')" />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer flex justify-end gap-2">
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">{{ t('scheduler.edit.save') }}</el-button>
      </div>
    </template>
  </LDialog>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElForm, ElFormItem, ElInput, ElRadioGroup, ElRadioButton, ElSwitch, ElInputNumber, ElDivider, ElIcon, ElButton, ElSelect, ElOption } from 'element-plus';
import { AddCircleOutlineRound, LogInRound } from '@vicons/material'
import type { ScheduledTask, ScheduledTaskForm, CronSchedule } from '../../types/scheduler'
import type { Model, ModelProvider } from '../../types/api'
import { apiService } from '../../services/ApiService'
import { agentApi } from '@/services/javaApi'
import ReNumberSelect from '@/components/ui/ReNumberSelect.vue'
import LDialog from '@/components/ui/LDialog.vue'

const { t } = useI18n()
/** 三种调度输入模式，全部落到后端 schedule 的两种 kind 上 */
type TimeMode = 'preset' | 'every' | 'cron'
/** every 的单位换算成后端要的毫秒数 */
type EveryUnit = 'minute' | 'hour'
/** 执行目标，与后端 execution_mode 取值一致 */
type TargetMode = 'new_conversation' | 'existing_conversation'

interface Props {
  modelValue: boolean
  isEdit: boolean
  task: ScheduledTask | null
  cronPresets: { label: string; value: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: ScheduledTaskForm]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref<any>(null)
const submitting = ref(false)

// 时间模式
const timeMode = ref<TimeMode>('preset')

// 固定间隔配置（提交时换算为 schedule.every_ms）
const everyConfig = ref<{ value: number; unit: EveryUnit }>({ value: 1, unit: 'hour' })

/** 编辑态：后端已存的 agent_config 在模型下拉里解析不到时，不提交该键以免被清空 */
const keepStoredAgentConfig = ref(false)

// Agent 目录（GET /api/agents）
const agents = ref<any[]>([])

// 模型列表
const modelProviders = ref<ModelProvider[]>([])
const allModels = ref<Model[]>([])

// 可用的模型列表（按提供商分组后的扁平列表）
const availableModels = computed(() => {
  return allModels.value.filter(model => model.isActive)
})

/** 选中的模型对象：后端 agent_config 需要 provider_id + model 名 */
const selectedModel = computed(() => {
  if (!form.value.modelId) return null
  return allModels.value.find(model => model.id === form.value.modelId) || null
})

const emptyForm = () => ({
  name: '',
  description: '',
  prompt: '',
  presetCron: props.cronPresets[0]?.value || '0 0 9 * * *',
  cronExpression: '0 0 9 * * *',
  targetMode: 'new_conversation' as TargetMode,
  conversationId: '',
  agentType: agents.value[0]?.agent_id || '',
  modelId: '',
  maxRetries: 0,
  enabled: true
})

const form = ref(emptyForm())

/** 六段 cron 校验：后端预设目录（cron-presets）全部是秒级的六段表达式 */
const CRON_PATTERN = /^\S+(\s+\S+){5}$/

/**
 * 校验时间配置合法性
 */
function validateTimeConfig(): string | null {
  if (timeMode.value === 'preset' && !form.value.presetCron) {
    return t('scheduler.edit.presetRequired')
  }
  if (timeMode.value === 'cron' && !CRON_PATTERN.test(form.value.cronExpression.trim())) {
    return t('scheduler.edit.cronInvalid')
  }
  return null
}

/**
 * 组装后端 schedule 对象
 */
function buildSchedule(): CronSchedule {
  if (timeMode.value === 'every') {
    const unitMs = everyConfig.value.unit === 'hour' ? 3600000 : 60000
    return {
      kind: 'every',
      every_ms: everyConfig.value.value * unitMs,
      description: `${everyConfig.value.value} ${t(everyConfig.value.unit === 'hour' ? 'scheduler.edit.unitHour' : 'scheduler.edit.unitMinute')}`
    }
  }
  const cron = (timeMode.value === 'preset' ? form.value.presetCron : form.value.cronExpression).trim()
  const preset = props.cronPresets.find(item => item.value === cron)
  return { kind: 'cron', cron, description: preset?.label || null }
}

/**
 * 提交表单：emit 视图层表单，snake_case body 由 scheduler.api 模块转换
 */
async function handleSubmit() {
  try {
    await formRef.value?.validate()

    const timeError = validateTimeConfig()
    if (timeError) {
      message.warning(timeError)
      return
    }

    submitting.value = true

    const model = selectedModel.value
    const data: ScheduledTaskForm = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      prompt: form.value.prompt.trim(),
      schedule: buildSchedule(),
      enabled: form.value.enabled,
      maxRetries: form.value.maxRetries,
      // 编辑态下这两个键后端 PUT 不接受，api 模块会直接丢弃
      agentType: form.value.agentType || undefined,
      conversationId: form.value.targetMode === 'existing_conversation'
        ? form.value.conversationId.trim()
        : null,
      agentConfig: model
        ? { providerId: model.providerId || null, model: model.modelName || model.id }
        : (keepStoredAgentConfig.value ? undefined : null)
    }

    emit('save', data)
  } catch (err) {
    // 表单验证失败
  } finally {
    submitting.value = false
  }
}

/**
 * 初始化表单数据：把后端 job 反解成三种输入模式之一
 */
function initForm() {
  if (props.isEdit && props.task) {
    const task = props.task
    const cron = task.schedule.cron || ''
    const matched = props.cronPresets.some(item => item.value === cron)
    if (task.schedule.kind === 'every') {
      timeMode.value = 'every'
      const everyMs = task.schedule.every_ms || 3600000
      everyConfig.value = everyMs % 3600000 === 0
        ? { value: everyMs / 3600000, unit: 'hour' }
        : { value: Math.max(1, Math.round(everyMs / 60000)), unit: 'minute' }
    } else if (cron && matched) {
      timeMode.value = 'preset'
      form.value.presetCron = cron
    } else {
      timeMode.value = 'cron'
      form.value.cronExpression = cron || '0 0 9 * * *'
    }
    form.value = {
      name: task.name || '',
      description: task.description || '',
      prompt: task.prompt || '',
      presetCron: cron && matched ? cron : (props.cronPresets[0]?.value || '0 0 9 * * *'),
      cronExpression: cron || '0 0 9 * * *',
      targetMode: task.conversationId ? 'existing_conversation' : 'new_conversation',
      conversationId: task.conversationId || '',
      agentType: task.agentType || '',
      modelId: resolveModelId(task.agentConfig),
      maxRetries: task.state.maxRetries || 0,
      enabled: task.enabled ?? true
    }
    keepStoredAgentConfig.value = !!task.agentConfig?.model && !form.value.modelId
  } else {
    form.value = emptyForm()
    timeMode.value = 'preset'
    everyConfig.value = { value: 1, unit: 'hour' }
    keepStoredAgentConfig.value = false
  }
}

/**
 * 回填模型下拉：后端只存 provider_id + model 名，按此反查前端模型 id
 */
function resolveModelId(agentConfig: ScheduledTask['agentConfig']): string {
  if (!agentConfig?.model) return ''
  const hit = allModels.value.find(model =>
    model.modelName === agentConfig.model &&
    (!agentConfig.providerId || (model.providerId || '') === agentConfig.providerId))
  return hit?.id || ''
}

const rules = computed(() => ({
  name: [
    { required: true, message: t('scheduler.edit.nameRequired'), trigger: 'blur' },
    { min: 1, max: 100, message: t('scheduler.edit.nameLength'), trigger: 'blur' }
  ],
  prompt: [
    { required: true, message: t('scheduler.edit.promptRequired'), trigger: 'blur' }
  ],
  targetMode: [
    { required: true, message: t('scheduler.edit.targetRequired'), trigger: 'change' }
  ],
  conversationId: [
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (form.value.targetMode === 'existing_conversation' && !value) {
          callback(new Error(t('scheduler.edit.targetSessionRequired')))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}))

// 监听弹窗打开，初始化表单
watch(() => props.modelValue, (val) => {
  if (val) {
    Promise.all([loadAgents(), loadModels()]).finally(() => {
      initForm()
      nextTick(() => formRef.value?.clearValidate())
    })
  }
})

// 加载 Agent 目录（GET /api/agents）
async function loadAgents() {
  try {
    const res: any = await agentApi.list()
    agents.value = res?.data || []
  } catch (error) {
    console.error('获取 Agent 列表失败:', error)
  }
}

// 加载模型列表
async function loadModels() {
  try {
    const response = await apiService.fetchModels()
    modelProviders.value = response.items || []
    // 扁平化所有模型
    allModels.value = modelProviders.value.flatMap(provider =>
      (provider.models || []).map(model => ({
        ...model,
        providerName: provider.name
      }))
    )
  } catch (error) {
    console.error('获取模型列表失败:', error)
  }
}
</script>

<style scoped>

:deep(.el-divider__text) {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.time-mode-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.time-mode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.schedule-panel {
  padding: 12px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  background-color: var(--el-fill-color-light);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: block;
}

:deep(.time-setting-item .el-form-item__content) {
  display: block;
  width: 100%;
}
</style>
