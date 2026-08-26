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

// 键名与后端调度/Provider 实际读取的键严格对齐（MonitorScheduler/MonitorConfigService）
const cfg = reactive<any>({
  'monitor.collect.interval.ms': 10000,
  'monitor.collect.concurrency': 50,
  'monitor.local.skip.macos': 0,
  'monitor.redis.allowDelete': 1,
  'monitor.redis.scan.count': 100,
  'monitor.data.retention.days': 30,
  'monitor.prometheus.enabled': 0,
  'monitor.alert.webhook.url': '',
})

const sections = ref([
  {
    name: '采集配置',
    icon: 'Timer',
    fields: [
      { key: 'monitor.collect.interval.ms', label: '采集节流间隔 (毫秒)', type: 'number' as const, min: 1000, max: 600000, desc: 'MonitorScheduler.tick 的最小触发粒度' },
      { key: 'monitor.collect.concurrency', label: '最大并发采集数', type: 'number' as const, min: 1, max: 200, desc: '同一时刻允许并发执行的最大采集任务数' },
      { key: 'monitor.local.skip.macos', label: 'macOS 跳过本机采集', type: 'switch' as const, desc: '开发机为 macOS 时避免无效 LOCAL 采集' },
    ],
  },
  {
    name: 'Redis 操作',
    icon: 'RedDot',
    fields: [
      { key: 'monitor.redis.scan.count', label: 'SCAN COUNT', type: 'number' as const, min: 10, max: 10000, desc: '每次扫描期望返回的 key 数量' },
      { key: 'monitor.redis.allowDelete', label: '允许删除 Key', type: 'switch' as const, desc: '是否允许通过 API 删除 Redis key' },
    ],
  },
  {
    name: '指标存储',
    icon: 'Odometer',
    fields: [
      { key: 'monitor.data.retention.days', label: '明细保留 (天)', type: 'number' as const, min: 1, max: 365, desc: '时序明细与聚合表的清理阈值(cleanupOldData)' },
    ],
  },
  {
    name: 'Prometheus',
    icon: 'Grid',
    fields: [
      { key: 'monitor.prometheus.enabled', label: '启用 Prometheus Provider', type: 'switch' as const, desc: '关闭时不注册 PROMETHEUS 采集器' },
    ],
  },
  {
    name: '告警通知',
    icon: 'WarningFilled',
    fields: [
      { key: 'monitor.alert.webhook.url', label: 'Webhook 地址', type: 'text' as const, desc: '告警事件 POST 推送地址(留空则仅日志+落库)' },
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
