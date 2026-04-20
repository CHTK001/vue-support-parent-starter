<template>
  <div class="log-panel">
    <div class="log-toolbar">
      <div class="log-type-tabs">
        <button
          class="log-tab"
          :class="{ 'is-active': logType === 'access' }"
          @click="switchLog('access')"
        >访问日志</button>
        <button
          class="log-tab"
          :class="{ 'is-active': logType === 'error' }"
          @click="switchLog('error')"
        >错误日志</button>
      </div>
      <div class="log-toolbar__right">
        <span class="log-lines-label">时间</span>
        <ElSelect v-model="timeFilterPreset" size="small" class="log-time-select">
          <ElOption
            v-for="item in timeFilterOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElDatePicker
          v-if="timeFilterPreset === 'custom'"
          v-model="customRange"
          type="datetimerange"
          size="small"
          class="log-time-range"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :clearable="true"
        />
        <span class="log-lines-label">行数</span>
        <ElInputNumber
          v-model="logLines"
          :min="10"
          :max="1000"
          :step="50"
          :controls="false"
          size="small"
          style="width: 72px"
        />
        <ElButton
          :icon="logPolling ? VideoPause : VideoPlay"
          :type="logPolling ? 'warning' : 'primary'"
          size="small"
          @click="togglePolling"
        >
          {{ logPolling ? '暂停' : '实时' }}
        </ElButton>
        <ElButton :icon="RefreshRight" size="small" :loading="logLoading" @click="loadLog" />
      </div>
    </div>

    <div class="log-content-wrap">
      <ElScrollbar ref="logScrollbar" class="log-scroll">
        <div v-if="logLoading && !filteredLogContent" class="log-loading">
          <ElIcon class="is-loading"><Loading /></ElIcon>
        </div>
        <pre v-else class="log-pre">{{ filteredLogContent || '暂无日志内容' }}</pre>
      </ElScrollbar>
    </div>
    <div class="log-filter-summary">
      当前显示 {{ filteredLineCount }} / {{ totalLineCount }} 行
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading, RefreshRight, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import {
  ElButton,
  ElDatePicker,
  ElIcon,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElScrollbar,
  ElSelect,
} from 'element-plus'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { tailNginxLog } from '../../api/nginx'

const props = defineProps<{ connectionId: string }>()

const logType = ref<'access' | 'error'>('access')
const logRawContent = ref('')
const logLoading = ref(false)
const logLines = ref(100)
const logPolling = ref(false)
const logScrollbar = ref<InstanceType<typeof ElScrollbar> | null>(null)
type TimeFilterPreset = 'all' | '5m' | '15m' | '1h' | '6h' | '24h' | 'custom'
const timeFilterPreset = ref<TimeFilterPreset>('all')
const customRange = ref<[Date, Date] | null>(null)
let pollingTimer: ReturnType<typeof setInterval> | null = null

const logPathMap = {
  access: '/var/log/nginx/access.log',
  error: '/var/log/nginx/error.log',
}

const timeFilterOptions: Array<{ label: string; value: TimeFilterPreset }> = [
  { label: '全部', value: 'all' },
  { label: '最近 5 分钟', value: '5m' },
  { label: '最近 15 分钟', value: '15m' },
  { label: '最近 1 小时', value: '1h' },
  { label: '最近 6 小时', value: '6h' },
  { label: '最近 24 小时', value: '24h' },
  { label: '自定义区间', value: 'custom' },
]

const parseLogTimestamp = (line: string): number | null => {
  const accessMatch = line.match(/\[(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s([+\-]\d{4})]/)
  if (accessMatch) {
    const monthMap: Record<string, string> = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    }
    const month = monthMap[accessMatch[2]]
    if (month) {
      const iso = `${accessMatch[3]}-${month}-${accessMatch[1]}T${accessMatch[4]}:${accessMatch[5]}:${accessMatch[6]}${accessMatch[7].slice(0, 3)}:${accessMatch[7].slice(3)}`
      const time = new Date(iso).getTime()
      return Number.isNaN(time) ? null : time
    }
  }

  const errorMatch = line.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (errorMatch) {
    const local = `${errorMatch[1]}-${errorMatch[2]}-${errorMatch[3]}T${errorMatch[4]}:${errorMatch[5]}:${errorMatch[6]}`
    const time = new Date(local).getTime()
    return Number.isNaN(time) ? null : time
  }
  return null
}

const resolveTimeRange = (): { start: number; end: number } | null => {
  const now = Date.now()
  switch (timeFilterPreset.value) {
    case '5m':
      return { start: now - 5 * 60 * 1000, end: now }
    case '15m':
      return { start: now - 15 * 60 * 1000, end: now }
    case '1h':
      return { start: now - 60 * 60 * 1000, end: now }
    case '6h':
      return { start: now - 6 * 60 * 60 * 1000, end: now }
    case '24h':
      return { start: now - 24 * 60 * 60 * 1000, end: now }
    case 'custom':
      if (customRange.value?.[0] && customRange.value?.[1]) {
        return {
          start: customRange.value[0].getTime(),
          end: customRange.value[1].getTime(),
        }
      }
      return null
    default:
      return null
  }
}

const filterLogByTime = (raw: string): string => {
  const range = resolveTimeRange()
  if (!range) return raw
  const lines = raw.split('\n')
  const result: string[] = []
  let currentLineTimestamp: number | null = null

  for (const line of lines) {
    const parsed = parseLogTimestamp(line)
    if (parsed !== null) {
      currentLineTimestamp = parsed
    }
    if (currentLineTimestamp === null) {
      continue
    }
    if (currentLineTimestamp >= range.start && currentLineTimestamp <= range.end) {
      result.push(line)
    }
  }
  return result.join('\n')
}

const filteredLogContent = computed(() => filterLogByTime(logRawContent.value))

const totalLineCount = computed(() => {
  if (!logRawContent.value) return 0
  return logRawContent.value.split('\n').filter(Boolean).length
})

const filteredLineCount = computed(() => {
  if (!filteredLogContent.value) return 0
  return filteredLogContent.value.split('\n').filter(Boolean).length
})

const loadLog = async () => {
  logLoading.value = true
  try {
    const res = await tailNginxLog(props.connectionId, logPathMap[logType.value], logLines.value)
    logRawContent.value = res?.data ?? ''
  } catch (e: any) {
    ElMessage.error('读取日志失败: ' + (e?.message ?? ''))
  } finally {
    logLoading.value = false
    await nextTick()
    logScrollbar.value?.setScrollTop(99999)
  }
}

const switchLog = (type: 'access' | 'error') => {
  logType.value = type
  loadLog()
}

const togglePolling = () => {
  if (logPolling.value) stopPolling()
  else startPolling()
}

const startPolling = () => {
  logPolling.value = true
  loadLog()
  pollingTimer = setInterval(loadLog, 3000)
}

const stopPolling = () => {
  logPolling.value = false
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
}

watch([timeFilterPreset, customRange], async () => {
  await nextTick()
  logScrollbar.value?.setScrollTop(99999)
})

onUnmounted(stopPolling)
</script>

<style scoped lang="scss">
.log-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #0f172a;
}

.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.96);
  border-bottom: 1px solid rgba(99, 102, 241, 0.18);
  flex-shrink: 0;
}

.log-type-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 3px;
}

.log-tab {
  padding: 4px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.14s ease;

  &.is-active {
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    font-weight: 600;
  }

  &:hover:not(.is-active) {
    background: rgba(255, 255, 255, 0.06);
    color: #94a3b8;
  }
}

.log-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-time-select {
  width: 130px;
}

.log-time-range {
  width: 320px;
}

.log-lines-label {
  font-size: 12px;
  color: #64748b;
}

.log-content-wrap {
  flex: 1;
  min-height: 0;
}

.log-scroll { height: 100%; }

.log-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #475569;
}

.log-pre {
  margin: 0;
  padding: 14px 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.65;
  color: #94a3b8;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-filter-summary {
  flex-shrink: 0;
  padding: 8px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  color: #64748b;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.95);
}
</style>
