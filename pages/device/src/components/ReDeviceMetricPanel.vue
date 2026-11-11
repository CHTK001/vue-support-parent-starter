<template>
  <div class="dmp">
    <header class="dmp__head">
      <div>
        <div class="dmp__title">环境指标</div>
        <div class="dmp__meta">
          {{ lastCollected ? `采集于 ${lastCollected}` : '等待首次采集' }}
        </div>
      </div>
      <el-button size="small" :loading="loading" @click="refresh(true)">
        <el-icon class="mr-1"><Refresh /></el-icon>立即采集
      </el-button>
    </header>

    <div v-if="metrics.length" class="dmp__grid">
      <article v-for="item in metrics" :key="item.deviceMetricKey" class="dmp__card">
        <div class="dmp__name">{{ item.deviceMetricName || item.deviceMetricKey }}</div>
        <div class="dmp__value">
          {{ item.deviceMetricValue || '—' }}
          <span v-if="item.deviceMetricUnit" class="dmp__unit">{{ item.deviceMetricUnit }}</span>
        </div>
        <div class="dmp__time">{{ item.deviceMetricDataTime || '厂商未返回时间' }}</div>
      </article>
    </div>
    <el-empty v-else description="暂无指标。可点击「立即采集」，或先在凭据高级配置中开启环境指标采集。" />
  </div>
</template>

<script setup lang="ts">
/**
 * 设备环境指标面板（气象站 / 温湿度传感器）。
 *
 * <p>定时任务负责把厂商读数写入最新快照；页面每 10 秒读取一次快照，
 * 「立即采集」会绕过时间轮主动拉一次。指标值保留字符串，兼容风向、天气现象。</p>
 *
 * @author CH
 * @since 4.0.0.54
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import { Refresh } from '@element-plus/icons-vue'
import { deviceApi } from '../api/deviceApi'
import type { DeviceMetric } from '../types/device'

const props = defineProps<{ deviceId: string }>()

const metrics = ref<DeviceMetric[]>([])
const loading = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const lastCollected = computed(() => {
  const times = metrics.value
    .map((item) => item.deviceMetricCollectedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
  return times.length ? times[times.length - 1] : ''
})

async function load(): Promise<void> {
  if (!props.deviceId) return
  try {
    metrics.value = (await deviceApi.listMetrics(props.deviceId)) || []
  } catch {
    metrics.value = []
  }
}

/**
 * 采集并刷新。
 *
 * @param manual 是否手动触发；手动失败时提示，轮询失败保持静默
 */
async function refresh(manual = false): Promise<void> {
  if (!props.deviceId || loading.value) return
  loading.value = true
  try {
    await deviceApi.collectMetrics(props.deviceId)
    await load()
  } catch (err: unknown) {
    if (manual) {
      message.error('采集指标失败: ' + ((err as Error)?.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refresh()
  timer = setInterval(() => {
    void load()
  }, 10_000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
})

watch(
  () => props.deviceId,
  () => {
    metrics.value = []
    void refresh()
  }
)
</script>

<style scoped>
.dmp {
  padding: 4px 2px 12px;
}

.dmp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.dmp__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dmp__meta {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dmp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.dmp__card {
  min-height: 112px;
  padding: 14px 16px;
  background: linear-gradient(145deg, var(--el-bg-color), var(--el-fill-color-lighter));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.dmp__name {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dmp__value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 650;
  line-height: 1.05;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.dmp__unit {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.dmp__time {
  margin-top: 10px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>
