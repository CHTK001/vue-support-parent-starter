<template>
  <div class="redis-dashboard fade-in">
    <!-- ===== 1. 顶部标题栏 ===== -->
    <header class="header-bar">
      <div class="header-left">
        <div class="title-row">
          <span class="title-badge">Redis</span>
          <h1 class="page-title">Redis 监控</h1>
        </div>
        <p class="page-desc">实时查看 Redis 实例的运行状态、内存占用、命令分布与持久化策略</p>
      </div>
      <div class="header-right">
        <span class="refresh-time">最后更新: {{ lastRefresh }}</span>
        <el-button @click="refreshData" class="refresh-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="btn-icon">
            <path d="M21 12a9 9 0 11-3-6.7L13 8" />
            <path d="M3 7v6h6" />
          </svg>
          刷新
        </el-button>
      </div>
    </header>

    <!-- ===== 2. 一级概览区：4 列等宽卡片 ===== -->
    <section class="overview-cards">
      <div class="ov-card" v-for="card in overviewCards" :key="card.key" :style="{ '--accent': card.color }">
        <div class="ov-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="ov-icon" v-html="card.icon"></svg>
        </div>
        <div class="ov-body">
          <span class="ov-label">{{ card.label }}</span>
          <span class="ov-value">{{ card.value }}</span>
          <span class="ov-note">{{ card.note }}</span>
        </div>
      </div>
    </section>

    <!-- ===== 3. 二级详情区：3 行 4 列信息网格 ===== -->
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

    <!-- ===== 4. 三级可视化区：左右双栏 ===== -->
    <section class="chart-section">
      <!-- 左：命令统计环形图 -->
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

      <!-- 右：内存仪表盘 -->
      <div class="chart-panel">
        <div class="panel-head">
          <span class="panel-title">内存仪表盘</span>
          <span class="panel-subtitle">已用 / 最大内存</span>
        </div>
        <div class="gauge-wrap">
          <svg viewBox="0 0 200 120" class="gauge-svg">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stop-color="#10b981" />
                <stop offset="50%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#f97316" />
              </linearGradient>
              <linearGradient id="gaugeBgGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stop-color="#f0f0f0" />
                <stop offset="100%" stop-color="#e5e7eb" />
              </linearGradient>
            </defs>
            <!-- 背景半圆 -->
            <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="url(#gaugeBgGrad)" stroke-width="14" stroke-linecap="round" />
            <!-- 进度半圆 -->
            <path
              :d="gaugeProgressPath(memUsagePercent)"
              fill="none"
              :stroke="gaugeStrokeColor"
              :stroke-width="14"
              stroke-linecap="round"
              class="gauge-arc"
            >
              <animate attributeName="d" :from="`M 20 110 A 80 80 0 0 1 20 110`" :to="gaugeProgressPath(memUsagePercent)" dur="0.8s" fill="freeze" />
            </path>
            <!-- 刻度点 -->
            <g class="gauge-ticks">
              <circle v-for="n in 11" :key="n" cx="20" cy="110" :transform="`rotate(${-85 + (n - 1) * 17} 100 110)`" r="2" fill="#d1d5db" />
            </g>
            <!-- 指针 -->
            <g :transform="`rotate(${gaugePointerAngle} 100 110)`" class="gauge-pointer-wrap">
              <line x1="100" y1="110" x2="100" y2="50" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round" />
              <circle cx="100" cy="110" r="6" fill="#1f2937" />
              <circle cx="100" cy="110" r="3" fill="#ffffff" />
            </g>
            <!-- 指针读数 -->
            <text x="100" y="95" text-anchor="middle" class="gauge-reading">{{ memUsed }} MB</text>
            <text x="100" y="108" text-anchor="middle" class="gauge-reading-label">{{ memUsagePercent }}%</text>
          </svg>
          <div class="gauge-footer">
            <div class="gauge-info-item">
              <span class="gauge-info-label">已用</span>
              <span class="gauge-info-value" style="color: #f97316">{{ memUsed }} MB</span>
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

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const lastRefresh = ref('—')

// 当前 Redis 实例信息
const mode = ref('单机模式')
const modeColor = ref('mode-single')

// ===== 一级概览卡片 =====
const overviewCards = ref([
  {
    key: 'keys',
    label: 'Key 数量',
    value: '128,456',
    note: '当前数据库',
    color: '#3b82f6',
    icon: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"', stroke: 'currentColor' },
  },
  {
    key: 'clients',
    label: '客户端连接',
    value: '142',
    note: '最大 10,000',
    color: '#10b981',
    icon: '<circle cx="9" cy="9" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke-linecap="round"/>',
  },
  {
    key: 'memory',
    label: '已用内存',
    value: '2.8 GB',
    note: '最大 8.0 GB',
    color: '#f97316',
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h18M3 15h18"/>',
  },
  {
    key: 'uptime',
    label: '运行时长',
    value: '45 天',
    note: '1,082,640 秒',
    color: '#8b5cf6',
    icon: '<circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,14" stroke-linecap="round"/>',
  },
])

// ===== 二级详情信息 =====
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

// ===== 四级命令统计 =====
const commandStats = ref([
  { name: 'GET', count: 285420, color: '#3b82f6' },
  { name: 'SET', count: 142310, color: '#10b981' },
  { name: 'HGETALL', count: 85420, color: '#f97316' },
  { name: 'DEL', count: 62180, color: '#ef4444' },
  { name: 'EXPIRE', count: 48320, color: '#8b5cf6' },
  { name: 'MGET', count: 35120, color: '#06b6d4' },
  { name: 'OTHERS', count: 24580, color: '#9ca3af' },
])

const totalCommands = computed(() => commandStats.value.reduce((s, c) => s + c.count, 0))

// 环形图参数
const donutR = 38
const donutStrokeW = 10
const donutCircumference = 2 * Math.PI * donutR // ≈ 238.76

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

// ===== 内存仪表盘 =====
const memUsed = ref(2816) // MB
const memMax = ref(8192) // MB
const memPeak = ref(3456) // MB

const memUsagePercent = computed(() => Math.round((memUsed.value / memMax.value) * 1000) / 10)

const gaugeStrokeColor = computed(() => {
  const v = memUsagePercent.value
  if (v >= 80) return '#f97316'
  if (v >= 60) return '#eab308'
  return 'url(#gaugeGrad)'
})

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

// ===== 数据刷新 =====
const refreshData = () => {
  lastRefresh.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  // 模拟数据波动
  overviewCards.value[0].value = String(Math.floor(120000 + Math.random() * 20000)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  overviewCards.value[1].value = String(130 + Math.floor(Math.random() * 30))
  overviewCards.value[2].value = (2.4 + Math.random() * 0.8).toFixed(1) + ' GB'
  overviewCards.value[3].value = Math.floor(40 + Math.random() * 15) + ' 天'

  memUsed.value = Math.floor(2500 + Math.random() * 800)
  memPeak.value = Math.floor(3200 + Math.random() * 600)

  commandStats.value.forEach(c => {
    c.count = Math.floor(c.count * (0.85 + Math.random() * 0.3))
  })

  // 更新时间戳
  detailCells.value[10].value = new Date().toLocaleTimeString('zh-CN')
}

let pollTimer: any = null

onMounted(() => {
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

/* ===== 1. 顶部标题栏 ===== */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
}

.title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.title-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #3b82f6;
  letter-spacing: 0.5px;
}
.page-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0; letter-spacing: -0.3px; }
.page-desc { font-size: 12px; color: #9ca3af; margin: 0; }

.header-right { display: flex; align-items: center; gap: 14px; }
.refresh-time { font-size: 12px; color: #9ca3af; }
.refresh-btn {
  display: flex; align-items: center; gap: 6px;
  background: #f1f5f9; color: #4b5563; border: 1px solid #e5e7eb;
  border-radius: 10px; padding: 8px 16px; font-size: 13px;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.refresh-btn:hover { background: #e2e8f0; transform: translateY(-1px); }
.btn-icon { width: 14px; height: 14px; stroke-width: 2; }

/* ===== 2. 一级概览卡片 ===== */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.ov-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.ov-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--accent);
  opacity: 0.7;
}
.ov-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

.ov-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ov-icon { width: 22px; height: 22px; color: var(--accent); stroke-width: 1.8; }
.ov-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ov-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
.ov-value { font-size: 26px; font-weight: 700; color: #1f2937; letter-spacing: -0.5px; line-height: 1.1; }
.ov-note { font-size: 11px; color: #9ca3af; }

/* ===== 3. 二级详情区 ===== */
.detail-section {
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  padding: 16px 20px;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
}
.section-title { font-size: 14px; font-weight: 600; color: #1f2937; margin: 0; }
.mode-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.mode-single { background: #ecfdf5; color: #10b981; border-color: #a7f3d0; }
.mode-cluster { background: #eff6ff; color: #3b82f6; border-color: #bfdbfe; }
.mode-sentinel { background: #fff7ed; color: #f97316; border-color: #fed7aa; }
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
  background: #f8fafc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: background 0.2s;
}
.detail-cell:hover { background: #f0f7ff; }
.cell-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
.cell-value { font-size: 12.5px; color: #1f2937; font-weight: 500; text-align: right; }

/* ===== 4. 三级可视化区 ===== */
.chart-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-panel {
  background: var(--el-card-bg-color, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
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
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
}
.panel-title { font-size: 14px; font-weight: 600; color: #1f2937; }
.panel-subtitle { font-size: 11.5px; color: #9ca3af; }

/* 环形图 */
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
.legend-item:hover { background: #f8fafc; }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.legend-name { color: #4b5563; font-weight: 500; flex: 1; }
.legend-pct { color: #9ca3af; font-weight: 500; font-family: 'SF Mono', monospace; }

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
  fill: #1f2937;
}
.donut-center-label {
  font-size: 8px;
  fill: #9ca3af;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 仪表盘 */
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
  fill: #1f2937;
}
.gauge-reading-label {
  font-size: 9px;
  fill: #9ca3af;
  font-weight: 500;
}

.gauge-footer {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter, #f0f0f0);
  width: 100%;
  justify-content: space-around;
}
.gauge-info-item { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.gauge-info-label { font-size: 11px; color: #9ca3af; font-weight: 500; }
.gauge-info-value { font-size: 14px; font-weight: 700; color: #1f2937; }
.gauge-warn { color: #f97316 !important; }
</style>
