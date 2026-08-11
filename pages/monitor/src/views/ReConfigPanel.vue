<template>
  <div class="config-panel fade-in">
    <header class="panel-header">
      <div class="header-left">
        <h2>全局配置</h2>
        <span class="header-desc">监控模块全局参数，重启采集器后生效</span>
      </div>
      <el-button type="primary" @click="doSaveAll" class="save-btn">
        <ReIcon name="Bottom" />
        保存全部
      </el-button>
    </header>

    <div class="config-grid">
      <ReCard v-for="section in sections" :key="section.name" layout="simple" :radius="14" :padding="18" hoverable>
        <template #header>
          <div class="card-title">
            <ReIcon :name="section.icon" :size="18" />
            <span class="card-name">{{ section.name }}</span>
          </div>
        </template>
        <el-form :model="section" label-position="top">
          <el-form-item v-for="field in section.fields" :key="field.key" :label="field.label">
            <template v-if="field.type === 'number'">
              <el-input-number
                v-model="cfg[field.key]"
                :min="field.min" :max="field.max"
                controls-position="right"
                style="width: 200px"
              />
            </template>
            <template v-else-if="field.type === 'switch'">
              <el-switch v-model="cfg[field.key]" :active-value="1" :inactive-value="0" />
            </template>
            <template v-else>
              <el-input v-model="cfg[field.key]" />
            </template>
            <span class="field-desc" v-if="field.desc">{{ field.desc }}</span>
          </el-form-item>
        </el-form>
      </ReCard>
    </div>
  </div>
</template>

<script setup lang="ts" name="ReConfigPanel">
import { ref, reactive, onMounted } from 'vue'
import { message } from '@repo/core'
import { getAllConfig, saveConfig } from '../api'

const cfg = reactive<any>({
  'monitor.collect.defaultInterval': 30,
  'monitor.collect.maxConcurrency': 10,
  'monitor.collect.collectTimeout': 30,
  'monitor.redis.scanCount': 100,
  'monitor.redis.redisTimeout': 30,
  'monitor.redis.allowDelete': 1,
  'monitor.metric.hourRetention': 90,
  'monitor.metric.metricRetention': 7,
  'monitor.metric.cleanupInterval': 1,
  'monitor.gateway.connectTimeout': 10,
  'monitor.gateway.retryCount': 3,
  'monitor.gateway.healthCheckInterval': 60,
  'monitor.alert.cpuThreshold': 80,
  'monitor.alert.memoryThreshold': 85,
  'monitor.alert.diskThreshold': 90,
  'monitor.ssh.defaultPort': 22,
  'monitor.ssh.connectTimeout': 10,
  'monitor.ssh.cmdTimeout': 60,
})

const sections = ref([
  {
    name: '采集配置',
    icon: 'Timer',
    fields: [
      { key: 'monitor.collect.defaultInterval', label: '默认采集间隔 (秒)', type: 'number' as const, min: 1, max: 86400, desc: '未指定 cron 时的默认间隔' },
      { key: 'monitor.collect.maxConcurrency', label: '最大并发采集数', type: 'number' as const, min: 1, max: 100, desc: '同一时刻允许并发执行的最大采集任务数' },
      { key: 'monitor.collect.collectTimeout', label: '采集超时 (秒)', type: 'number' as const, min: 1, max: 600, desc: '单次采集任务的超时上限' },
    ],
  },
  {
    name: 'Redis 操作',
    icon: 'RedDot',
    fields: [
      { key: 'monitor.redis.scanCount', label: 'SCAN COUNT', type: 'number' as const, min: 100, max: 10000, desc: '每次 SCAN 期望返回的 key 数量' },
      { key: 'monitor.redis.redisTimeout', label: '操作超时 (秒)', type: 'number' as const, min: 1, max: 600, desc: 'Redis 命令执行超时' },
      { key: 'monitor.redis.allowDelete', label: '允许删除 Key', type: 'switch' as const, desc: '是否允许通过 API 删除 Redis key' },
    ],
  },
  {
    name: '指标存储',
    icon: 'Odometer',
    fields: [
      { key: 'monitor.metric.hourRetention', label: '小时聚合保留 (天)', type: 'number' as const, min: 1, max: 365, desc: 'ms_monitor_metric_hourly 数据保留天数' },
      { key: 'monitor.metric.metricRetention', label: '通用时序保留 (天)', type: 'number' as const, min: 1, max: 365, desc: 'ms_monitor_metric_general 数据保留天数' },
      { key: 'monitor.metric.cleanupInterval', label: '清理周期 (天)', type: 'number' as const, min: 1, max: 365, desc: '定时清理过期数据的间隔' },
    ],
  },
  {
    name: '网关配置',
    icon: 'Grid',
    fields: [
      { key: 'monitor.gateway.connectTimeout', label: '连接超时 (秒)', type: 'number' as const, min: 1, max: 60, desc: '建立 SSH/Redis 连接的超时' },
      { key: 'monitor.gateway.retryCount', label: '重试次数', type: 'number' as const, min: 0, max: 10, desc: '连接失败后的重试次数' },
      { key: 'monitor.gateway.healthCheckInterval', label: '健康检查间隔 (秒)', type: 'number' as const, min: 5, max: 3600, desc: '自动健康探测的间隔' },
    ],
  },
  {
    name: '告警阈值',
    icon: 'WarningFilled',
    fields: [
      { key: 'monitor.alert.cpuThreshold', label: 'CPU 告警阈值 (%)', type: 'number' as const, min: 1, max: 100, desc: 'CPU 使用率超过此值触发告警' },
      { key: 'monitor.alert.memoryThreshold', label: '内存告警阈值 (%)', type: 'number' as const, min: 1, max: 100, desc: '内存使用率超过此值触发告警' },
      { key: 'monitor.alert.diskThreshold', label: '磁盘告警阈值 (%)', type: 'number' as const, min: 1, max: 100, desc: '磁盘使用率超过此值触发告警' },
    ],
  },
  {
    name: '终端配置',
    icon: 'Terminal',
    fields: [
      { key: 'monitor.ssh.defaultPort', label: '默认 SSH 端口', type: 'number' as const, min: 1, max: 65535, desc: '终端采集任务默认使用的 SSH 端口' },
      { key: 'monitor.ssh.connectTimeout', label: '连接超时 (秒)', type: 'number' as const, min: 1, max: 60, desc: 'SSH 连接建立超时' },
      { key: 'monitor.ssh.cmdTimeout', label: '命令超时 (秒)', type: 'number' as const, min: 1, max: 600, desc: 'SSH 命令执行超时' },
    ],
  },
])

const loadConfig = async () => {
  try {
    const all = await getAllConfig()
    if (all && typeof all === 'object') {
      for (const [k, v] of Object.entries(all)) {
        if (k.startsWith('monitor.') && k in cfg) {
          if (cfg[k] === 1 || cfg[k] === 0) {
            ;(cfg as any)[k] = v === '1' ? 1 : 0
          } else {
            ;(cfg as any)[k] = v !== undefined ? (Number(v) || v) : (cfg as any)[k]
          }
        }
      }
    }
  } catch (e: any) { message.error(e.message || '加载配置失败') }
}

const doSaveAll = async () => {
  const configs = Object.entries(cfg).map(([k, v]) => ({
    configKey: k,
    configValue: String(v),
    configType: typeof v === 'number' ? 'NUMBER' : 'STRING',
  }))
  try {
    await saveConfig(configs)
    message.success('配置已保存')
    await loadConfig()
  } catch (e: any) { message.error(e.message || '保存失败') }
}

onMounted(loadConfig)
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.header-left h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: var(--el-text-color-primary); letter-spacing: -0.3px; }
.header-desc { font-size: 13px; color: var(--el-text-color-secondary); }
.save-btn { display: flex; align-items: center; gap: 8px; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 500; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.save-btn:hover { transform: translateY(-1px); }
.btn-icon { width: 14px; height: 14px; }

.config-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.card-title { display: flex; align-items: center; gap: 10px; }
.card-name { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
.card-title :deep(.re-icon) { color: var(--el-color-primary); }
:deep(.el-form-item__label) { font-weight: 500; color: var(--el-text-color-regular); font-size: 13px; margin-bottom: 4px; }
.field-desc { display: block; font-size: 11.5px; color: var(--el-text-color-secondary); margin-top: 2px; }
</style>
