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
        <div v-if="logLoading && !logContent" class="log-loading">
          <ElIcon class="is-loading"><Loading /></ElIcon>
        </div>
        <pre v-else class="log-pre">{{ logContent || '暂无日志内容' }}</pre>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading, RefreshRight, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import {
  ElButton,
  ElIcon,
  ElInputNumber,
  ElMessage,
  ElScrollbar,
} from 'element-plus'
import { nextTick, onUnmounted, ref } from 'vue'
import { tailNginxLog } from '../../api/nginx'

const props = defineProps<{ connectionId: string }>()

const logType = ref<'access' | 'error'>('access')
const logContent = ref('')
const logLoading = ref(false)
const logLines = ref(100)
const logPolling = ref(false)
const logScrollbar = ref<InstanceType<typeof ElScrollbar> | null>(null)
let pollingTimer: ReturnType<typeof setInterval> | null = null

const logPathMap = {
  access: '/var/log/nginx/access.log',
  error: '/var/log/nginx/error.log',
}

const loadLog = async () => {
  logLoading.value = true
  try {
    const res = await tailNginxLog(props.connectionId, logPathMap[logType.value], logLines.value)
    logContent.value = res?.data ?? ''
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
</style>
