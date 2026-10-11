<template>
  <div class="session-config-page">
    <SettingsCard title="会话配置" subtitle="配置会话的行为开关（只影响你自己的会话）">
      <SettingsRow
        label="AI 联想下一个任务"
        description="开启后，会话页会在输入框上方、目标条下方展示 AI 建议的下一步任务，点击即可作为当前目标开始"
      >
        <div class="session-config-controls">
          <el-switch
            :model-value="enabled"
            :loading="saving"
            :disabled="loading"
            aria-label="是否允许 AI 联想下一个任务"
            @change="onToggle"
          />
          <span class="session-config-state">{{ stateLabel }}</span>
        </div>
      </SettingsRow>

      <SettingsRow
        label="最多联想条数"
        description="每次让 AI 联想多少条下一步任务（1-10）"
      >
        <el-select
          v-model="maxCountModel"
          :disabled="loading"
          class="w-56"
          aria-label="AI 每次最多联想多少条下一步任务"
          @change="onMaxChange"
        >
          <el-option v-for="n in MAX_COUNT_OPTIONS" :key="n" :label="`${n} 条`" :value="n" />
        </el-select>
      </SettingsRow>

      <SettingsRow
        label="会话超时时间"
        description="一次回复连续这么久（分钟）没有任何输出就判定为超时，服务端结束该次回复并给出超时提示；填 0 = 不限制"
      >
        <el-select
          v-model="idleTimeoutModel"
          :disabled="loading"
          class="w-56"
          aria-label="会话超时时间（分钟）"
          @change="onIdleTimeoutChange"
        >
          <el-option
            v-for="m in IDLE_TIMEOUT_OPTIONS"
            :key="m"
            :label="m === 0 ? '不限制' : `${m} 分钟`"
            :value="m"
          />
        </el-select>
      </SettingsRow>

      <p class="session-config-note">
        <span class="session-config-note__icon"><el-icon><InfoFilled /></el-icon></span>
        <span class="session-config-note__text">
          提示：这里改的是<b>默认值</b>。每个会话会保留自己当时的取值，之后再改默认值不会回溯改写已有会话；
          想让某个会话重新跟随默认值，可在会话页把该会话的开关关掉再打开。
        </span>
      </p>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import { InfoFilled } from '@element-plus/icons-vue'

const { t } = useI18n()
const { notify } = usePopup()

/** 配置分组：与后端 SessionGlobalSettingProvider.GROUP 一致 */
const GROUP = 'session'
/** 开关字段名 */
const FIELD_ENABLED = 'ai_next_task_enabled'
/** 条数字段名 */
const FIELD_MAX = 'ai_next_task_max'
/** 会话超时字段名（分钟） */
const FIELD_IDLE_TIMEOUT = 'stream_idle_timeout_minutes'
/** 会话超时兜底值：后端未返回时用它，不让输入框空着 */
const DEFAULT_IDLE_TIMEOUT = 30

/**
 * 会话超时的可选档位（分钟）。0 = 不限制。
 *
 * <p>用下拉而不是数字框：本页原先用 el-input-number，实测它的 +/- 按钮点了没反应
 * （直接 click span 与内部 icon 都试过，输入框仍是原值；同一组件在别的页面正常）。
 * 超时本就该选档位而不是手打任意分钟数，顺带也避开了这个控件问题。</p>
 */
const IDLE_TIMEOUT_OPTIONS = [0, 5, 10, 15, 30, 45, 60, 120]

/** 联想条数的可选档位 */
const MAX_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10]

const loading = ref(false)
const saving = ref(false)
const enabled = ref(false)
const defaultEnabled = ref(false)
const overridden = ref(false)
const maxCount = ref(3)
const idleTimeout = ref(DEFAULT_IDLE_TIMEOUT)
/**
 * 下拉框的 v-model 绑定目标。
 *
 * <p>存的是「已归一化到可选档位内」的值：库里若被手工填了档位外的数字（例如 37），
 * 这里会落到最近的合法档位，避免下拉显示成一个列表里不存在的项。</p>
 */
const maxCountModel = ref(3)
const idleTimeoutModel = ref(DEFAULT_IDLE_TIMEOUT)

/**
 * 把任意数值归一化到给定档位里最近的一个。
 *
 * @param value   原始值
 * @param options 合法档位（升序）
 * @param fallback 全部不可用时的兜底
 * @returns 归一化后的档位值
 */
function nearestOption(value: number, options: number[], fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }
  if (options.includes(value)) {
    return value
  }
  let best = options[0]
  for (const option of options) {
    if (Math.abs(option - value) < Math.abs(best - value)) {
      best = option
    }
  }
  return best
}

/**
 * 开关状态文案：区分「继承默认值」与「已覆盖」两种来源。
 *
 * 后端 merged 视图里 `overridden=false` 表示继承全局默认；此时直接说「关闭」会让人
 * 以为是自己关掉的，实际改一次默认值就会跟着变。
 */
const stateLabel = computed((): string => {
  if (!overridden.value) {
    return `跟随默认（${defaultEnabled.value ? '开' : '关'}）`
  }
  return enabled.value ? '已开启' : '已关闭'
})

/**
 * 从 merged 响应里取到指定字段的值。
 *
 * merged 响应是双层信封（见 DefaultModelSettings 的 pickGroups 注释），
 * 这里对数组/对象两种形态都兜住。
 *
 * @param response 接口响应
 * @param field    字段名
 * @returns 字段值；取不到时返回 undefined
 */
const pickField = (response: any, field: string): any => {
  const first = response?.data ?? response
  const items = Array.isArray(first) ? first : Array.isArray(first?.data) ? first.data : []
  return items.find((item: any) => item?.field === field)
}

/**
 * 加载该分组的合并视图（全局默认 + 本人覆盖）。
 */
const load = async () => {
  loading.value = true
  try {
    const response = await apiService.fetchMergedGroupSettings(GROUP)
    const item = pickField(response, FIELD_ENABLED)
    if (item) {
      overridden.value = item.overridden === true
      enabled.value = String(item.value ?? '').toLowerCase() === 'true'
      defaultEnabled.value = String(item.defaultValue ?? '').toLowerCase() === 'true'
    }
    const maxItem = pickField(response, FIELD_MAX)
    const max = Number(maxItem?.value ?? maxItem?.defaultValue)
    maxCount.value = Number.isFinite(max) && max >= 1 ? Math.min(max, 10) : 3
    maxCountModel.value = nearestOption(maxCount.value, MAX_COUNT_OPTIONS, 3)
    const idleItem = pickField(response, FIELD_IDLE_TIMEOUT)
    const idle = Number(idleItem?.value ?? idleItem?.defaultValue)
    // 0 是合法值（= 不限制超时），所以不能用 `|| DEFAULT` 兜底，否则 0 会被吞成 30
    idleTimeout.value = Number.isFinite(idle) && idle >= 0
      ? Math.min(idle, 180)
      : DEFAULT_IDLE_TIMEOUT
    idleTimeoutModel.value = nearestOption(idleTimeout.value, IDLE_TIMEOUT_OPTIONS, DEFAULT_IDLE_TIMEOUT)
  } catch (error) {
    console.error('获取 session 分组设置失败:', error)
    notify.error(t('settings.loadFailed'), error)
  } finally {
    loading.value = false
  }
}

/**
 * 写入用户覆盖层（不动全局默认）。
 *
 * @param payload 字段值集合
 */
const saveOverrides = async (payload: Record<string, unknown>) => {
  saving.value = true
  try {
    await apiService.updateUserGroupOverrides(GROUP, payload)
    await load()
  } catch (error) {
    console.error('保存 session 分组设置失败:', error)
    notify.error('保存设置失败', error)
  } finally {
    saving.value = false
  }
}

/**
 * 开关切换：写本人覆盖层。
 *
 * @param value 切换后的值
 */
const onToggle = async (value: boolean | string | number) => {
  enabled.value = value === true
  await saveOverrides({ [FIELD_ENABLED]: enabled.value })
}

/**
 * 条数变更：写本人覆盖层。
 *
 * @param value 变更后的值
 */
const onMaxChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  maxCount.value = nearestOption(Math.trunc(Number(value)), MAX_COUNT_OPTIONS, 3)
  maxCountModel.value = maxCount.value
  saveOverrides({ [FIELD_MAX]: maxCount.value })
}

/**
 * 会话超时变更：写本人覆盖层。
 *
 * @param value 变更后的分钟数
 */
const onIdleTimeoutChange = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return
  }
  // 0 = 不限制，是合法取值，必须原样写下去
  idleTimeout.value = nearestOption(Math.trunc(Number(value)), IDLE_TIMEOUT_OPTIONS, DEFAULT_IDLE_TIMEOUT)
  idleTimeoutModel.value = idleTimeout.value
  saveOverrides({ [FIELD_IDLE_TIMEOUT]: idleTimeout.value })
}

onMounted(load)
</script>

<style scoped>
.session-config-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-config-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.session-config-state {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}

/* 底部说明：SettingsCard 自身无内边距，里面的 .set-row 各带 15px 18px，
   这段裸 <p> 直接贴着卡片左右边框与下边缘，看起来像溢出。补齐 18px 左右 +
   底部留白，并用一条与 .set-row 分隔线同源的细线把「说明」和「配置项」分开。 */
.session-config-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  padding: 14px 18px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.session-config-note__icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--el-text-color-placeholder);
}

.session-config-note__text {
  min-width: 0;
}

/* <b> 就在本组件模板里，scoped 样式直接命中，无需 :deep */
.session-config-note b {
  color: var(--el-text-color-regular);
  font-weight: 600;
}
</style>