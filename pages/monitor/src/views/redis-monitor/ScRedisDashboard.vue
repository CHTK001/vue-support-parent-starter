<template>
  <div class="redis-dashboard fade-in">
    <ReCard layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="header-bar">
        <div class="header-left">
          <div class="title-row">
            <span class="title-badge">Redis</span>
            <h1 class="page-title">Redis 监控</h1>
          </div>
          <p class="page-desc">实时查看 Redis 实例的运行状态、内存占用与关键指标</p>
        </div>
        <div class="header-right">
          <ReSelect v-model="selectedMonitorId" placeholder="选择 Redis 实例" class="redis-select" filterable @change="onRedisChange"
            :data="redisInstances.map(m => ({ label: `${m.monitorName} [${m.monitorHost}:${m.monitorPort}]`, value: m.id }))" />
          <span class="refresh-time">最后更新: {{ lastRefresh }}</span>
          <span class="live-pulse"></span>
          <ReButton show-text icon="RefreshLeft" plain @click="loadRedisMetric">刷新</ReButton>
        </div>
      </div>
    </ReCard>

    <section class="overview-cards">
    <ReCard v-for="card in overviewCards" :key="card.key" layout="simple" :radius="12" :padding="14" shadow="never" class="ov-card">
      <div class="ov-inner" :style="{ borderLeft: '2px solid ' + card.color + '40' }">
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
        <ReTag :class="['mode-tag', modeColor, { 'mode-pulse': mode === '单机模式' }]" effect="light">
          <span class="mode-dot"></span>
          {{ mode }}
        </ReTag>
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
          <span class="panel-title">关键指标</span>
          <span class="panel-subtitle">来自最近一次 INFO 采集</span>
        </div>
        <div class="stat-grid">
          <div class="stat-item" :class="{ 'stat-warn': getStatWarn('commandsPerSec') }">
            <span class="stat-label">瞬时 OPS</span>
            <span class="stat-value">{{ stats.commandsPerSec }}</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" :style="{ width: getStatPercent('commandsPerSec') + '%', background: getStatWarn('commandsPerSec') ? 'var(--el-color-danger)' : 'var(--el-color-primary)' }"></div>
            </div>
          </div>
          <div class="stat-item" :class="{ 'stat-warn': getStatWarn('hitRate') }">
            <span class="stat-label">命中率</span>
            <span class="stat-value">{{ stats.hitRate }}</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" :style="{ width: getStatPercent('hitRate') + '%', background: getStatWarn('hitRate') ? 'var(--el-color-danger)' : 'var(--el-color-success)' }"></div>
            </div>
          </div>
          <div class="stat-item" :class="{ 'stat-warn': getStatWarn('expiredKeys') }">
            <span class="stat-label">过期键</span>
            <span class="stat-value">{{ stats.expiredKeys }}</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" :style="{ width: getStatPercent('expiredKeys') + '%', background: getStatWarn('expiredKeys') ? 'var(--el-color-danger)' : 'var(--el-color-warning)' }"></div>
            </div>
          </div>
          <div class="stat-item" :class="{ 'stat-warn': getStatWarn('evictedKeys') }">
            <span class="stat-label">驱逐键</span>
            <span class="stat-value">{{ stats.evictedKeys }}</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" :style="{ width: getStatPercent('evictedKeys') + '%', background: getStatWarn('evictedKeys') ? 'var(--el-color-danger)' : 'var(--el-color-info)' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-panel">
        <div class="panel-head">
          <span class="panel-title">内存仪表盘</span>
          <span class="panel-subtitle">已用 / 峰值内存使用率</span>
        </div>
        <div class="gauge-wrap">
        <ReThree :height="220" :render="renderMemGauge" :animate="animateMemGauge" :auto-rotate="true" :auto-rotate-speed="0.5" />
          <div class="gauge-footer">
            <div class="gauge-info-item">
              <span class="gauge-info-label">已用</span>
              <span class="gauge-info-value" style="color: var(--el-color-warning)">{{ memUsed }} MB</span>
            </div>
            <div class="gauge-info-item">
              <span class="gauge-info-label">峰值</span>
              <span class="gauge-info-value">{{ memPeak }} MB</span>
            </div>
            <div class="gauge-info-item">
              <span class="gauge-info-label">峰值利用率</span>
              <span :class="['gauge-info-value', memUsagePercent >= 80 ? 'gauge-warn' : '']">{{ memUsagePercent }}%</span>
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
import { getMonitors, getRedisSnapshot } from '../../api'

const lastRefresh = ref('—')
const redisInstances = ref<any[]>([])
const selectedMonitorId = ref<number | null>(null)
const currentInstance = computed(() => redisInstances.value.find(s => s.id === selectedMonitorId.value))

const mode = computed(() => currentInstance.value ? '单机模式' : '—')
const modeColor = ref('mode-single')

/** 最近一次采集的指标快照（metricName -> value） */
const snapshot = ref<Record<string, number>>({})

/** 概览卡片 */
const overviewCards = ref([
  { key: 'keys', label: 'Key 数量', value: '—', note: '当前数据库', color: 'var(--el-color-primary)', icon: 'Search' },
  { key: 'clients', label: '客户端连接', value: '—', note: 'connected_clients', color: 'var(--el-color-success)', icon: 'User' },
  { key: 'memory', label: '已用内存', value: '—', note: 'used_memory', color: 'var(--el-color-warning)', icon: 'Document' },
  { key: 'uptime', label: '运行时长', value: '—', note: 'uptime_in_seconds', color: 'var(--el-color-primary)', icon: 'Timer' },
])

/** 详细信息单元格 */
const detailCells = ref([
  { label: '端口', value: '—' },
  { label: 'TCP 连接数', value: '—' },
  { label: '累计连接数', value: '—' },
  { label: '从节点数', value: '—' },
  { label: 'AOF 状态', value: '—' },
  { label: '阻塞客户端', value: '—' },
  { label: '拒绝连接数', value: '—' },
  { label: '总命令处理数', value: '—' },
])

/** 关键指标统计（_ 前缀为原始数值，供进度条/告警使用） */
interface RedisStatView {
  commandsPerSec: string;
  hitRate: string;
  expiredKeys: string;
  evictedKeys: string;
  _commandsPerSec: number;
  _hitRate: number;
  _expiredKeys: number;
  _evictedKeys: number;
  /** 动态取原始值（进度条/告警共用），键 = 'commandsPerSec' | 'hitRate' | ... */
  [key: string]: string | number;
}
const stats = computed<RedisStatView>(() => {
  const s = snapshot.value
  const fmt = (n: number | undefined): string => (n == null ? '—' : Number(n).toLocaleString())
  const pct = (n: number | undefined): string => (n == null ? '—' : `${Number(n).toFixed(1)}%`)
  return {
    commandsPerSec: fmt(s['redis_instaneous_ops']),
    hitRate: pct(s['redis_hit_rate']),
    expiredKeys: fmt(s['redis_expired_keys']),
    evictedKeys: fmt(s['redis_evicted_keys']),
    // 原始数值用于进度条
    _commandsPerSec: s['redis_instaneous_ops'] ?? 0,
    _hitRate: s['redis_hit_rate'] ?? 0,
    _expiredKeys: s['redis_expired_keys'] ?? 0,
    _evictedKeys: s['redis_evicted_keys'] ?? 0,
  }
})

/** 进度条百分比（OPS 假设上限 50000，键数假设上限 10000） */
const statMaxMap: Record<string, number> = {
  commandsPerSec: 50000,
  hitRate: 100,
  expiredKeys: 10000,
  evictedKeys: 10000,
}
const getStatPercent = (key: string): number => {
  const raw = stats.value['_' + key] as number
  if (!raw) return 0
  const max = statMaxMap[key] || 100
  return Math.min(100, Math.round((raw / max) * 100))
}
/** 告警判断：OPS > 80%上限，命中率 < 60%，过期/驱逐键 > 80%上限 */
const getStatWarn = (key: string): boolean => {
  const raw = stats.value['_' + key] as number
  if (!raw) return false
  if (key === 'hitRate') return raw < 60
  if (key === 'commandsPerSec') return raw > 40000
  return raw > 8000
}

/** 内存数据（真实值，无数据时显示 —） */
const memUsed = ref<number | null>(null)
const memPeak = ref<number | null>(null)
const memMax = ref<number | null>(null)

const memUsagePercent = computed(() => {
  // 优先用 maxmemory(配置上限) 计算使用率；未配置(0)则退回 峰值 口径
  const base = (memMax.value != null && memMax.value > 0) ? memMax.value : memPeak.value
  if (memUsed.value == null || base == null || base <= 0) {
    return 0
  }
  return Math.round((memUsed.value / base) * 1000) / 10
})

const memGaugeGroup = shallowRef<THREE.Group | null>(null)
const memFillMesh = shallowRef<THREE.Mesh | null>(null)
const memTargetHeight = ref(0)

const renderMemGauge = (ctx: ReThreeContext) => {
  const { scene, THREE } = ctx
  const grp = new THREE.Group()
  scene.add(grp)
  memGaugeGroup.value = grp

  const percent = Math.min(100, memUsagePercent.value) / 100
  const radius = 18
  const maxHeight = 50
  const fillHeight = Math.max(0.5, maxHeight * (percent || 0.05))
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

  ctx.camera.position.set(0, 30, 70)
  ctx.camera.lookAt(0, maxHeight / 2, 0)
}

const animateMemGauge = (ctx: ReThreeContext) => {
  if (memFillMesh.value) {
    memFillMesh.value.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.03
  }
  if (memGaugeGroup.value) {
    memGaugeGroup.value.rotation.y += 0.002
  }
}

const onRedisChange = () => {
  loadRedisMetric()
}

const loadRedisMetric = async () => {
  if (!selectedMonitorId.value) return
  try {
    // 从历史接口聚合最近一次全量指标快照（真实采集数据）
    const metrics = await getRedisSnapshot(selectedMonitorId.value)

    if (!metrics || Object.keys(metrics).length === 0) {
      resetToEmpty()
      return
    }
    snapshot.value = metrics

    const num = (v: number | undefined, d?: number): number | undefined => v ?? d
    // 优先用各 db 键数合计（keyspace 段），否则退回 total_keys（INFO 无 dbsize 时）
    const keys = num(metrics['redis_db_keys_total'], metrics['redis_total_keys'])
    const clients = num(metrics['redis_connected_clients'])
    const usedBytes = num(metrics['redis_used_memory_bytes'])
    const uptimeSec = num(metrics['redis_uptime_seconds'])

    overviewCards.value[0].value = keys != null ? Number(keys).toLocaleString() : '—'
    overviewCards.value[1].value = clients != null ? Number(clients).toLocaleString() : '—'
    overviewCards.value[2].value = usedBytes != null ? (usedBytes / 1073741824).toFixed(1) + ' GB' : '—'
    overviewCards.value[3].value = uptimeSec != null ? formatUptime(uptimeSec) : '—'

    memUsed.value = usedBytes != null ? Math.round(usedBytes / 1048576) : null
    memPeak.value = metrics['redis_used_memory_peak_bytes'] != null
      ? Math.round(metrics['redis_used_memory_peak_bytes'] / 1048576)
      : null
    memMax.value = metrics['redis_maxmemory_bytes'] != null && metrics['redis_maxmemory_bytes'] > 0
      ? Math.round(metrics['redis_maxmemory_bytes'] / 1048576)
      : null

    detailCells.value[0].value = String(currentInstance.value?.monitorPort || '—')
    detailCells.value[1].value = clients != null ? Number(clients).toLocaleString() : '—'
    detailCells.value[2].value = fmtOpt(metrics['redis_total_connections'])
    detailCells.value[3].value = fmtOpt(metrics['redis_connected_slaves'])
    detailCells.value[4].value = (metrics['redis_aof_enabled'] != null ? metrics['redis_aof_enabled'] : 0) === 1 ? '启用' : '关闭'
    detailCells.value[5].value = fmtOpt(metrics['redis_blocked_clients'])
    detailCells.value[6].value = fmtOpt(metrics['redis_rejected_connections'])
    detailCells.value[7].value = fmtOpt(metrics['redis_total_commands'])
  } catch (e: any) {
    message.warning(e?.message || 'Redis 指标加载失败')
    resetToEmpty()
  }
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** 格式化可空数值（数字转千分位，缺失显示 —） */
const fmtOpt = (v: number | undefined): string => (v == null ? '—' : Number(v).toLocaleString())

/** 秒级运行时长转天 */
const formatUptime = (sec: number): string => {
  if (sec < 86400) {
    return `${Math.floor(sec / 3600)} 小时`
  }
  return `${(sec / 86400).toFixed(1)} 天`
}

/** 无数据时全部置为占位 */
const resetToEmpty = () => {
  snapshot.value = {}
  overviewCards.value.forEach(c => { c.value = '—' })
  detailCells.value.forEach(c => { c.value = '—' })
  memUsed.value = null
  memPeak.value = null
  memMax.value = null
}

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

let pollTimer: any = null

onMounted(() => {
  loadRedisInstances()
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  pollTimer = setInterval(loadRedisMetric, 15000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

 <style scoped>
/* 本文件原先整套用 pages/monitor/src/styles/tokens.css 的私有令牌（--bg-* / --text-*
   / --border-subtle / --status-success / --shadow-card* / --border-radius* /
   --transition-base），而那份 tokens.css 只有 :root、没有暗色变体，暗色模式下这些值
   全部停留在亮色。已统一改走 EP 语义令牌；--metric-* 是各组件的固定标识色
   （Redis 红 / CPU 蓝 / 磁盘橙，需彼此可区分），保留不换。 */
/* 页面入场淡入：0.35s 刻意慢于微交互档（整块内容从下方 8px 升起，需要时间被看清），
   且 both 填充保证动画结束后停在终态，reduced-motion 下直接停掉不会留残影 */
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
  padding: 16px;
  background: var(--el-bg-color);
  /* 原为 var(--border-radius)（tokens.css 里是 10px），10px 距 8/12 等距，取 12px(lg) */
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：容器静止态不加投影，边界改由这圈 1px 边框承载 */
  border: 1px solid var(--el-border-color-lighter);
}

.title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.title-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--el-radius-xs, 4px);
  background: color-mix(in srgb, var(--metric-redis) 12%, transparent);
  color: var(--metric-redis);
  letter-spacing: 0.5px;
}
.page-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
  letter-spacing: -0.3px;
}
.page-desc { font-size: 11.5px; color: var(--el-text-color-secondary); margin: 0; }

.header-right { display: flex; align-items: center; gap: 12px; }
.refresh-time {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  font-family: 'SF Mono', monospace;
}
.redis-select { width: 240px; }
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--el-radius-sm, 6px);
  padding: 8px 16px;
  font-size: 13px;
  /* 原为 var(--transition-base)（展开即 all 0.18s ease），显式列出真实会变的属性并取 0.2s 档 */
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}
.refresh-btn:hover { background: var(--el-fill-color-lighter); transform: translateY(-1px); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.ov-card {
  /* 左侧 3px 强调色由各子类用 border-left-color 覆盖；border 必须写在它之前，
     否则 1px 边框会把 3px 强调条压成 1px */
  border: 1px solid var(--el-border-color-lighter);
  border-left: 3px solid;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  padding: 16px;
}
/* 允许的两处投影之一：悬浮抬升反馈 */
.ov-card:hover { box-shadow: var(--el-box-shadow); }
.ov-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ov-icon-wrap { display: none; }
.ov-icon { width: 22px; height: 22px; color: var(--metric-cpu); }
.ov-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.ov-label { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 500; }
.ov-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: -0.5px;
  line-height: 1.1;
}
.ov-note { font-size: 11px; color: var(--el-text-color-secondary); }

.detail-section {
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：容器静止态不加投影，边界由边框承载 */
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
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}
.mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.mode-single {
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  color: var(--el-color-success);
  border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent);
}
.mode-cluster {
  background: color-mix(in srgb, var(--metric-cpu) 8%, transparent);
  color: var(--metric-cpu);
  border-color: color-mix(in srgb, var(--metric-cpu) 20%, transparent);
}
.mode-sentinel {
  background: color-mix(in srgb, var(--metric-disk) 8%, transparent);
  color: var(--metric-disk);
  border-color: color-mix(in srgb, var(--metric-disk) 20%, transparent);
}
.mode-dot { width: 5px; height: 5px; border-radius: var(--el-radius-full, 9999px); background: currentColor; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.detail-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  transition: background-color var(--el-transition-duration-fast, 0.2s);
}
.detail-cell:hover { background: color-mix(in srgb, var(--metric-cpu) 4%, transparent); }
.cell-label { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 500; }
.cell-value {
  font-size: 12.5px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  text-align: right;
}

.chart-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-panel {
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：容器静止态不加投影，边界由边框承载 */
  border: 1px solid var(--el-border-color-lighter);
  padding: 16px 20px;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}
.chart-panel:hover {
  /* 允许的两处投影之一：悬浮抬升反馈 */
  box-shadow: var(--el-box-shadow);
  transform: translateY(-1px);
}

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

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
}
.stat-label { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 500; }
.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-family: 'SF Mono', monospace;
}
.stat-bar {
  height: 4px;
  background: var(--el-fill-color);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}
.stat-warn {
  border-color: var(--el-color-danger) !important;
  background: color-mix(in srgb, var(--el-color-danger) 5%, var(--el-fill-color-lighter)) !important;
}

.gauge-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
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
.gauge-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}
.gauge-info-label { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 500; }
.gauge-info-value { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); }
.gauge-warn { color: var(--metric-disk) !important; }

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  /* 入场淡入可停：animation 用 both 填充，终态是完全不透明且无位移，停掉即直接呈现 */
  .fade-in {
    animation: none;
  }
  .ov-card,
  .chart-panel,
  .detail-cell,
  .refresh-btn {
    transition: none;
  }
  .live-pulse,
  .mode-pulse .mode-dot {
    animation: none;
  }
}

/* 实时脉冲点 */
.live-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-success);
  animation: livePulse 2s ease-in-out infinite;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(10, 191, 83, 0.5); }
  50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(10, 191, 83, 0); }
}

/* mode-tag 脉冲点 */
.mode-pulse .mode-dot {
  animation: livePulse 2s ease-in-out infinite;
}
</style>