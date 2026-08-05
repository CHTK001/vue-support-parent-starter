<template>
  <div class="config-panel fade-in">
    <header class="panel-header">
      <div class="header-left">
        <h2>全局配置</h2>
        <span class="header-desc">监控模块全局参数，重启采集器后生效</span>
      </div>
      <el-button type="primary" @click="doSaveAll" class="save-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
        保存全部
      </el-button>
    </header>

    <div class="config-grid">
      <div class="config-card" v-for="section in sections" :key="section.name">
        <div class="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="card-icon" v-html="section.icon"></svg>
          <span>{{ section.name }}</span>
        </div>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    fields: [
      { key: 'monitor.collect.defaultInterval', label: '默认采集间隔 (秒)', type: 'number' as const, min: 1, max: 86400, desc: '未指定 cron 时的默认间隔' },
      { key: 'monitor.collect.maxConcurrency', label: '最大并发采集数', type: 'number' as const, min: 1, max: 100, desc: '同一时刻允许并发执行的最大采集任务数' },
      { key: 'monitor.collect.collectTimeout', label: '采集超时 (秒)', type: 'number' as const, min: 1, max: 600, desc: '单次采集任务的超时上限' },
    ],
  },
  {
    name: 'Redis 操作',
    icon: '<circle cx="5" cy="12" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/>',
    fields: [
      { key: 'monitor.redis.scanCount', label: 'SCAN COUNT', type: 'number' as const, min: 100, max: 10000, desc: '每次 SCAN 期望返回的 key 数量' },
      { key: 'monitor.redis.redisTimeout', label: '操作超时 (秒)', type: 'number' as const, min: 1, max: 600, desc: 'Redis 命令执行超时' },
      { key: 'monitor.redis.allowDelete', label: '允许删除 Key', type: 'switch' as const, desc: '是否允许通过 API 删除 Redis key' },
    ],
  },
  {
    name: '指标存储',
    icon: '<polyline points="3,17 9,11 13,15 21,7"/><polyline points="14,7 21,7 21,14"/>',
    fields: [
      { key: 'monitor.metric.hourRetention', label: '小时聚合保留 (天)', type: 'number' as const, min: 1, max: 365, desc: 'ms_monitor_metric_hourly 数据保留天数' },
      { key: 'monitor.metric.metricRetention', label: '通用时序保留 (天)', type: 'number' as const, min: 1, max: 365, desc: 'ms_monitor_metric_general 数据保留天数' },
      { key: 'monitor.metric.cleanupInterval', label: '清理周期 (天)', type: 'number' as const, min: 1, max: 365, desc: '定时清理过期数据的间隔' },
    ],
  },
  {
    name: '网关配置',
    icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    fields: [
      { key: 'monitor.gateway.connectTimeout', label: '连接超时 (秒)', type: 'number' as const, min: 1, max: 60, desc: '建立 SSH/Redis 连接的超时' },
      { key: 'monitor.gateway.retryCount', label: '重试次数', type: 'number' as const, min: 0, max: 10, desc: '连接失败后的重试次数' },
      { key: 'monitor.gateway.healthCheckInterval', label: '健康检查间隔 (秒)', type: 'number' as const, min: 5, max: 3600, desc: '自动健康探测的间隔' },
    ],
  },
  {
    name: '告警阈值',
    icon: '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    fields: [
      { key: 'monitor.alert.cpuThreshold', label: 'CPU 告警阈值 (%)', type: 'number' as const, min: 1, max: 100, desc: 'CPU 使用率超过此值触发告警' },
      { key: 'monitor.alert.memoryThreshold', label: '内存告警阈值 (%)', type: 'number' as const, min: 1, max: 100, desc: '内存使用率超过此值触发告警' },
      { key: 'monitor.alert.diskThreshold', label: '磁盘告警阈值 (%)', type: 'number' as const, min: 1, max: 100, desc: '磁盘使用率超过此值触发告警' },
    ],
  },
  {
    name: '终端配置',
    icon: '<polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/>',
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
          // 布尔型字段
          if (cfg[k] === 1 || cfg[k] === 0) {
            ;(cfg as any)[k] = v === '1' ? 1 : 0
          } else {
            ;(cfg as any)[k] = v !== undefined ? (Number(v) || v) : (cfg as any)[k]
          }
        }
      }
    }
  } catch (e: any) { ElMessage.error(e.message || '加载配置失败') }
}

const doSaveAll = async () => {
  const promises = Object.entries(cfg).map(([k, v]) =>
    saveConfig({ monitorConfigKey: k, monitorConfigValue: String(v) })
  )
  try {
    await Promise.all(promises)
    ElMessage.success('配置已保存')
  } catch (e: any) { ElMessage.error(e.message || '保存失败') }
}

onMounted(loadConfig)
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.header-left h2 { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1f2937; letter-spacing: -0.3px; }
.header-desc { font-size: 13px; color: #9ca3af; }
.save-btn { display: flex; align-items: center; gap: 8px; background: #3b82f6; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 500; box-shadow: 0 2px 8px rgba(59,130,246,0.25); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.save-btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,0.35); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

.config-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.config-card { background: var(--el-card-bg-color, #ffffff); border-radius: 12px; padding: 20px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid var(--el-border-color-lighter, #f0f0f0); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.config-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.card-title { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0); }
.card-title span { font-size: 14px; font-weight: 600; color: #1f2937; }
.card-icon { width: 16px; height: 16px; color: #3b82f6; stroke-width: 2; }
.config-card :deep(.el-form-item__label) { font-weight: 500; color: #4b5563; font-size: 13px; margin-bottom: 4px; }
.field-desc { display: block; font-size: 11.5px; color: #9ca3af; margin-top: 2px; }
</style>
