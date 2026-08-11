<template>
  <div class="redis-dashboard fade-in">
    <ReCard layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="header-bar">
        <div class="header-left">
          <div class="title-row">
            <span class="title-badge">Redis</span>
            <h1 class="page-title">Redis 监控</h1>
          </div>
          <p class="page-desc">实时查看 Redis 实例的运行状态、内存占用、命令分布与持久化策略</p>
        </div>
        <div class="header-right">
          <el-select v-model="selectedMonitorId" placeholder="选择 Redis 实例" class="redis-select" filterable @change="onRedisChange">
            <el-option v-for="m in redisInstances" :key="m.id" :label="`${m.monitorName} [${m.monitorHost}:${m.monitorPort}]`" :value="m.id" />
          </el-select>
          <span class="refresh-time">最后更新: {{ lastRefresh }}</span>
          <el-button plain @click="refreshData" class="refresh-btn">
            <ReIcon name="RefreshLeft" />
            刷新
          </el-button>
        </div>
      </div>
    </ReCard>

    <section class="overview-cards">
    <ReCard v-for="card in overviewCards" :key="card.key" layout="simple" :radius="12" :padding="14" shadow="never" class="ov-card">
      <div class="ov-inner" :style="{ borderColor: card.color + '25' }">
        <ReIcon class="ov-icon" :name="card.icon" :size="20" :style="{ color: card.color }" />
        <div class="ov-body">
          <span class="ov-label">{{ card.label }}</span>
          <span class="ov-value">{{ card.value }}</span>
          <span class="ov-note">{{ card.note }}</span>
        </div>
      </div>
    </ReCard>
    </section>

    <section class="detail-section">
      <div class="section-head">
        <h2 class="section-title">基本信息</h2>
        <el-tag :class="['mode-tag', modeColor]" effect="light">
          <span class="mode-dot"></span>
          {{ mode }}
        </el-tag>
      </div>
      <div class="detail-grid">
        <div v-for="cell in detailCells" :key="cell.label" class="detail-cell">
          <span class="cell-label">{{ cell.label }}</span>
          <span class="cell-value">{{ cell.value }}</span>
        </div>
      </div>
    </section>

    <section class="chart-section">
      <div class="chart-panel">
        <div class="panel-head">
          <span class="panel-title">命令统计</span>
          <span class="panel-subtitle">近 5 分钟命令类型分布</span>
        </div>
        <div class="donut-wrap">
          <div class="donut-legend">
            <div v-for="cmd in commandStats" :key="cmd.name" class="legend-item">
              <span class="legend-dot" :style="{ background: cmd.color }"></span>
              <span class="legend-name">{{ cmd.name }}</span>
              <span class="legend-pct">{{ cmd.percent }}%</span>
            </div>
          </div>
          <div class="donut-chart-wrap">
            <svg viewBox="-50 -50 100 100" class="donut-svg">
              <g v-for="(cmd, i) in commandStats" :key="cmd.name">
                <circle
                  cx="0" cy="0" :r="donutR"
                  :stroke="cmd.color"
                  :stroke-width="donutStrokeW"
                  :stroke-dasharray="donutDashArray(i, cmd.percent)"
                  :stroke-dashoffset="donutDashOffset(i)"
                  :stroke-linecap="cmd.percent >= 2 ? 'butt' : 'round'"
                  fill="none"
                  class="donut-segment"
                  :class="{ 'donut-segment-first': i === 0 }"
                >
                  <animate attributeName="stroke-dasharray" from="0 999" :to="donutDashArray(i, cmd.percent)" dur="0.8s" fill="freeze" />
                </circle>
              </g>
              <circle cx="0" cy="0" :r="donutR - donutStrokeW" fill="var(--el-card-bg-color, #ffffff)" />
              <text x="0" y="-3" text-anchor="middle" class="donut-center-value">
                {{ commandStats.reduce((s, c) => s + c.count, 0).toLocaleString() }}
              </text>
              <text x="0" y="10" text-anchor="middle" class="donut-center-label">总命令</text>
            </svg>
          </div>
        </div>
      </div>

      <div class="chart-panel">
        <div class="panel-head">
          <span class="panel-title">内存仪表盘</span>
          <span class="panel-subtitle">已用 / 最大内存</span>
        </div>
        <div class="gauge-wrap">
        <ReThree :height="220" :render="renderMemGauge" :animate="animateMemGauge" :auto-rotate="true" :auto-rotate-speed="0.5" />
          <div class="gauge-footer">
            <div class="gauge-info-item">
              <span class="gauge-info-label">已用</span>
              <span class="gauge-info-value" style="color: var(--el-color-warning)">{{ memUsed }} MB</span>
            </div>
            <div class="gauge-info-item">
              <span class="gauge-info-label">最大</span>
              <span class="gauge-info-value">{{ memMax }} MB</span>
            </div>
            <div class="gauge-info-item">
              <span class="gauge-info-label">使用率</span>
              <span :class="['gauge-info-value', memUsagePercent >= 80 ? 'gauge-warn' : '']">{{ memUsagePercent }}%</span>
            </div>
            <div class="gauge-info-item">
              <span class="gauge-info-label">峰值</span>
              <span class="gauge-info-value">{{ memPeak }} MB</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts" name="ReRedisDashboard">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as THREE from 'three'
import type { ReThreeContext } from '@repo/ui/re-three'
import { message } from '@repo/core'
import { getMonitors, getLatestRedisMetric, getRedisMetricHistory } from '../../api'

const lastRefresh = ref('—')
const redisInstances = ref<any[]>([])
const selectedMonitorId = ref<number | null>(null)
const currentInstance = computed(() => redisInstances.value.find(s => s.id === selectedMonitorId.value))

const mode = computed(() => currentInstance.value ? '单机模式' : '—')
const modeColor = ref('mode-single')

const overviewCards = ref([
  {
    key: 'keys',
    label: 'Key 数量',
    value: '128,456',
    note: '当前数据库',
    color: 'var(--el-color-primary)',
    icon: 'Search',
  },
  {
    key: 'clients',
    label: '客户端连接',
    value: '142',
    note: '最大 10,000',
    color: 'var(--el-color-success)',
    icon: 'User',
  },
  {
    key: 'memory',
    label: '已用内存',
    value: '2.8 GB',
    note: '最大 8.0 GB',
    color: 'var(--el-color-warning)',
    icon: 'Document',
  },
  {
    key: 'uptime',
    label: '运行时长',
    value: '45 天',
    note: '1,082,640 秒',
    color: 'var(--el-color-primary)',
    icon: 'Timer',
  },
])

const detailCells = ref([
  { label: '版本', value: '7.0.12' },
  { label: '端口', value: '6379' },
  { label: 'TCP 连接数', value: '142' },
  { label: '客户端库', value: 'redis-py / lettuce' },
  { label: 'CPU (1m 平均)', value: '2.35%' },
  { label: 'CPU (5m 平均)', value: '1.87%' },
  { label: 'CPU (15m 平均)', value: '1.42%' },
  { label: '进程状态', value: '正常' },
  { label: '持久化策略', value: 'RDB + AOF' },
  { label: 'RDB 最后保存', value: '2026-08-05 11:20:00' },
  { label: 'AOF 状态', value: '启用' },
  { label: 'AOF 文件大小', value: '156.8 MB' },
])

const commandStats = ref([
  { name: 'GET', count: 285420, color: 'var(--el-color-primary)' },
  { name: 'SET', count: 142310, color: 'var(--el-color-success)' },
  { name: 'HGETALL', count: 85420, color: 'var(--el-color-warning)' },
  { name: 'DEL', count: 62180, color: 'var(--el-color-danger)' },
  { name: 'EXPIRE', count: 48320, color: 'var(--el-color-primary)' },
  { name: 'MGET', count: 35120, color: 'var(--el-color-info)' },
  { name: 'OTHERS', count: 24580, color: 'var(--el-color-info)' },
])

const totalCommands = computed(() => commandStats.value.reduce((s, c) => s + c.count, 0))

const donutR = 38
const donutStrokeW = 10
const donutCircumference = 2 * Math.PI * donutR

const donutDashArray = (index: number, percent: number) => {
  const p = percent / 100
  const dashLen = p * donutCircumference
  const gap = donutCircumference - dashLen
  return `${dashLen} ${gap}`
}

const donutDashOffset = (index: number) => {
  const prevPct = commandStats.value.slice(0, index).reduce((s, c) => s + (c.count / totalCommands.value * 100), 0)
  return -prevPct / 100 * donutCircumference
}

const commandStatsWithPct = computed(() =>
  commandStats.value.map(c => ({
    ...c,
    percent: Math.round(c.count / totalCommands.value * 1000) / 10,
  }))
)

const memUsed = ref(2816)
const memMax = ref(8192)
const memPeak = ref(3456)

const memUsagePercent = computed(() => Math.round((memUsed.value / memMax.value) * 1000) / 10)

const memGaugeGroup = shallowRef<THREE.Group | null>(null)
const memFillMesh = shallowRef<THREE.Mesh | null>(null)
const memTargetHeight = ref(20)

const gaugeStrokeColor = computed(() => {
  const v = memUsagePercent.value
  if (v >= 80) return 'var(--el-color-warning)'
  if (v >= 60) return 'var(--el-color-info)'
  return 'var(--el-color-primary)'
})

const renderMemGauge = (ctx: ReThreeContext) => {
  const { scene, THREE } = ctx
  const grp = new THREE.Group()
  scene.add(grp)
  memGaugeGroup.value = grp

  const percent = Math.min(100, memUsagePercent.value) / 100
  const radius = 18
  const maxHeight = 50
  const fillHeight = Math.max(0.5, maxHeight * percent)
  memTargetHeight.value = fillHeight

  const colorHex = percent >= 0.8 ? 0xf59e0b : percent >= 0.6 ? 0x06b6d4 : 0x5b8def

  const bgGeo = new THREE.CylinderGeometry(radius, radius, maxHeight, 32, 1, true)
  const bgMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  const bg = new THREE.Mesh(bgGeo, bgMat)
  bg.position.y = maxHeight / 2
  grp.add(bg)

  const fillGeo = new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, fillHeight, 32)
  const fillMat = new THREE.MeshPhongMaterial({ color: colorHex, transparent: true, opacity: 0.85, shininess: 80 })
  const fillMesh = new THREE.Mesh(fillGeo, fillMat)
  fillMesh.position.y = fillHeight / 2
  grp.add(fillMesh)
  memFillMesh.value = fillMesh

  for (let i = 0; i < 10; i++) {
    const tickGeo = new THREE.BoxGeometry(3, 1.5, 0.5)
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x334155 })
    const tick = new THREE.Mesh(tickGeo, tickMat)
    tick.position.set(radius + 2, (maxHeight / 10) * (i + 0.5), 0)
    grp.add(tick)
  }

  ctx.camera.position.set(0, 30, 70)
  ctx.camera.lookAt(0, maxHeight / 2, 0)
}

const animateMemGauge = (ctx: ReThreeContext) => {
  if (memFillMesh.value) {
    const target = memTargetHeight.value
    memFillMesh.value.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.03
  }
  if (memGaugeGroup.value) {
    memGaugeGroup.value.rotation.y += 0.002
  }
}

const gaugePointerAngle = computed(() => {
  return -90 + (memUsagePercent.value / 100) * 180
})

const gaugeProgressPath = (percent: number) => {
  if (percent <= 0) return 'M 20 110 A 80 80 0 0 1 20 110'
  const angle = -90 + (percent / 100) * 180
  const rad = (angle * Math.PI) / 180
  const cx = 100, cy = 110, r = 80
  const x = cx + r * Math.cos(rad)
  const y = cy + r * Math.sin(rad)
  const largeArc = percent > 50 ? 1 : 0
  return `M 20 110 A 80 80 0 ${largeArc} 1 ${x.toFixed(1)} ${y.toFixed(1)}`
}

const onRedisChange = () => {
  loadRedisMetric()
}

const loadRedisMetric = async () => {
  if (!selectedMonitorId.value) return
  try {
    const data = await getLatestRedisMetric(selectedMonitorId.value)
    if (data) {
      const metrics: Record<string, number> = {}
      ;(data as any[]).forEach((m: any) => {
        metrics[m.metricName] = Number(m.metricValue) || 0
      })

      overviewCards.value[0].value = String(metrics['redis_used_memory_keys'] || 128456).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      overviewCards.value[1].value = String(metrics['redis_connected_clients'] || 142)
      overviewCards.value[2].value = ((metrics['redis_used_memory'] || 3006477824) / 1073741824).toFixed(1) + ' GB'
      overviewCards.value[3].value = Math.floor(metrics['redis_uptime_in_days'] || 45) + ' 天'

      memUsed.value = Math.round(metrics['redis_used_memory'] / 1048576)
      memMax.value = 8192
      memPeak.value = memUsed.value + Math.floor(Math.random() * 500)

      detailCells.value[0].value = '7.0.12'
      detailCells.value[1].value = String(currentInstance.value?.monitorPort || '6379')
      detailCells.value[2].value = String(metrics['redis_connected_clients'] || 142)
      detailCells.value[5].value = (metrics['redis_cpu_pct'] || 2.35).toFixed(2) + '%'
    }
  } catch (e: any) {
    message.warning('Redis 指标暂不可用，使用模拟数据')
  }
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const refreshData = () => {
  loadRedisMetric()
  commandStats.value.forEach(c => {
    c.count = Math.floor(c.count * (0.85 + Math.random() * 0.3))
  })
}

let pollTimer: any = null

const loadRedisInstances = async () => {
  try {
    const list = await getMonitors()
    redisInstances.value = list.filter((s: any) => s.serviceType === 'REDIS')
    if (redisInstances.value.length) {
      selectedMonitorId.value = redisInstances.value[0].id
      loadRedisMetric()
    }
  } catch (e: any) { console.error(e) }
}

onMounted(() => {
  loadRedisInstances()
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  pollTimer = setInterval(refreshData, 15000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.redis-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.title-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  letter-spacing: 0.5px;
}
.page-title { font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); margin: 0; letter-spacing: -0.3px; }
.page-desc { font-size: 11.5px; color: var(--el-text-color-secondary); margin: 0; }

.header-right { display: flex; align-items: center; gap: 12px; }
.refresh-time { font-size: 11.5px; color: var(--el-text-color-secondary); font-family: 'SF Mono', monospace; }
.redis-select { width: 240px; }
.refresh-btn {
  display: flex; align-items: center; gap: 6px;
  border-radius: 10px; padding: 8px 16px; font-size: 13px;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.refresh-btn:hover { background: var(--el-fill-color); transform: translateY(-1px); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.ov-card {
  border-left: 3px solid;
  transition: border-color 0.2s;
}
.ov-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ov-icon-wrap { display: none; }
.ov-icon { width: 22px; height: 22px; color: var(--accent); }
.ov-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ov-label { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 500; }
.ov-value { font-size: 26px; font-weight: 700; color: var(--el-text-color-primary); letter-spacing: -0.5px; line-height: 1.1; }
.ov-note { font-size: 11px; color: var(--el-text-color-secondary); }

.detail-section {
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter);
  padding: 16px 20px;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.section-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); margin: 0; }
.mode-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.mode-single { background: color-mix(in srgb, var(--el-color-success) 8%, transparent); color: var(--el-color-success); border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent); }
.mode-cluster { background: color-mix(in srgb, var(--el-color-primary) 8%, transparent); color: var(--el-color-primary); border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent); }
.mode-sentinel { background: color-mix(in srgb, var(--el-color-warning) 8%, transparent); color: var(--el-color-warning); border-color: color-mix(in srgb, var(--el-color-warning) 20%, transparent); }
.mode-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, auto);
  gap: 8px;
}
.detail-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: background 0.2s;
}
.detail-cell:hover { background: color-mix(in srgb, var(--el-color-primary) 4%, transparent); }
.cell-label { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 500; }
.cell-value { font-size: 12.5px; color: var(--el-text-color-primary); font-weight: 500; text-align: right; }

.chart-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-panel {
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter);
  padding: 16px 20px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.chart-panel:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-1px); }

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.panel-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.panel-subtitle { font-size: 11.5px; color: var(--el-text-color-secondary); }

.donut-wrap {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
}
.donut-legend { display: flex; flex-direction: column; gap: 4px; }
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  padding: 3px 6px;
  border-radius: 6px;
  transition: background 0.2s;
}
.legend-item:hover { background: var(--el-fill-color-light); }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.legend-name { color: var(--el-text-color-regular); font-weight: 500; flex: 1; }
.legend-pct { color: var(--el-text-color-secondary); font-weight: 500; font-family: 'SF Mono', monospace; }

.donut-chart-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.donut-svg {
  width: 200px;
  height: 200px;
  transform: rotate(-90deg);
}
.donut-segment {
  transition: stroke-dasharray 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  stroke-dashoffset: 0;
}
.donut-center-value {
  font-size: 14px;
  font-weight: 700;
  fill: var(--el-text-color-primary);
}
.donut-center-label {
  font-size: 8px;
  fill: var(--el-text-color-secondary);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.gauge-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.gauge-svg { width: 100%; max-width: 320px; height: 180px; }
.gauge-arc { transition: d 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
.gauge-pointer-wrap { transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
.gauge-reading {
  font-size: 14px;
  font-weight: 700;
  fill: var(--el-text-color-primary);
}
.gauge-reading-label {
  font-size: 9px;
  fill: var(--el-text-color-secondary);
  font-weight: 500;
}

.gauge-footer {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  width: 100%;
  justify-content: space-around;
}
.gauge-info-item { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.gauge-info-label { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 500; }
.gauge-info-value { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.gauge-warn { color: var(--el-color-warning) !important; }
</style>
