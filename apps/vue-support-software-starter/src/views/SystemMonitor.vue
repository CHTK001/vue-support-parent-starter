<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">实时监控</h1>
        <p class="page-desc">CPU / 内存 / 磁盘 实时态势</p>
      </div>
      <el-button :loading="paused" @click="paused = !paused">{{ paused ? '继续' : '暂停' }}</el-button>
    </div>

    <div class="mon-grid">
      <el-card class="shadow-sm rounded-xl p-6 mon-card">
        <div class="mon-header">
          <span class="mon-title">CPU 使用率</span>
          <span class="mon-val" :class="{ high: snapshot.cpu > 80 }">{{ snapshot.cpu }}%</span>
        </div>
        <div class="mon-bar"><div class="mon-fill" :style="{ width: snapshot.cpu + '%', background: snapshot.cpu > 80 ? '#dc2626' : 'rgb(var(--el-color-primary))' }" /></div>
        <div ref="cpuChart" class="mon-chart">
          <div v-for="(pt, i) in cpuHistory" :key="i" class="mon-col" :style="{ height: Math.max(2, pt.value) + '%' }" />
        </div>
      </el-card>

      <el-card class="shadow-sm rounded-xl p-6 mon-card">
        <div class="mon-header">
          <span class="mon-title">内存使用率</span>
          <span class="mon-val" :class="{ high: snapshot.memory > 80 }">{{ snapshot.memory }}%</span>
        </div>
        <div class="mon-bar"><div class="mon-fill" :style="{ width: snapshot.memory + '%', background: snapshot.memory > 80 ? '#dc2626' : 'rgb(var(--el-color-primary))' }" /></div>
        <div class="mon-detail">
          <span>{{ formatBytes(snapshot.memoryUsed) }} / {{ formatBytes(snapshot.memoryTotal) }}</span>
        </div>
        <div ref="memChart" class="mon-chart">
          <div v-for="(pt, i) in memHistory" :key="i" class="mon-col mon-col-mem" :style="{ height: Math.max(2, pt.value) + '%' }" />
        </div>
      </el-card>

      <el-card class="shadow-sm rounded-xl p-6 mon-card">
        <div class="mon-header">
          <span class="mon-title">磁盘</span>
          <span class="mon-val" :class="{ high: snapshot.diskPercent > 90 }">{{ snapshot.diskPercent }}%</span>
        </div>
        <div class="mon-disks">
          <div v-for="disk in snapshot.disks" :key="disk.name" class="mon-disk-item">
            <div class="mon-disk-hd">
              <span class="mon-disk-name">{{ disk.name }}</span>
              <span class="mon-disk-pct">{{ disk.percent }}%</span>
            </div>
            <div class="mon-bar"><div class="mon-fill" :style="{ width: disk.percent + '%' }" /></div>
          </div>
        </div>
      </el-card>

      <el-card class="shadow-sm rounded-xl p-6 mon-card mon-card-wide">
        <div class="mon-header"><span class="mon-title">系统概况</span></div>
        <div class="mon-stats">
          <div class="mon-stat"><span class="ms-label">线程数</span><span class="ms-val">{{ snapshot.threadCount }}</span></div>
          <div class="mon-stat"><span class="ms-label">运行时间</span><span class="ms-val">{{ formatUptime(snapshot.uptime) }}</span></div>
          <div class="mon-stat"><span class="ms-label">采样时间</span><span class="ms-val">{{ snapshot.time }}</span></div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMonitorSnapshot } from '@/api/software'

const paused = ref(false)
const snapshot = reactive<any>({ cpu: 0, memory: 0, memoryUsed: 0, memoryTotal: 0, diskPercent: 0, disks: [], threadCount: 0, uptime: 0, time: '' })
const cpuHistory = reactive<{ time: string; value: number }[]>([])
const memHistory = reactive<{ time: string; value: number }[]>([])
let timer: any = null

async function tick() {
  if (paused.value) return
  try {
    const data = await getMonitorSnapshot()
    Object.assign(snapshot, data)
    if (data.cpuHistory) {
      cpuHistory.splice(0, cpuHistory.length, ...data.cpuHistory)
    }
    if (data.memHistory) {
      memHistory.splice(0, memHistory.length, ...data.memHistory)
    }
  } catch { /* ignore */ }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(1) + ' GB'
}

function formatUptime(ms: number): string {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}m`
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 2000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.page-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.mon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mon-card { display: flex; flex-direction: column; gap: 10px; }
.mon-card-wide { grid-column: 1 / -1; }

.mon-header { display: flex; align-items: center; justify-content: space-between; }
.mon-title { font-size: 14px; font-weight: 600; }
.mon-val { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
.mon-val.high { color: #dc2626; }

.mon-bar { height: 6px; background: var(--el-fill-color-light); border-radius: 100px; overflow: hidden; }
.mon-fill { height: 100%; border-radius: 100px; transition: width 0.5s; }

.mon-chart { display: flex; align-items: flex-end; gap: 2px; height: 60px; padding-top: 8px; }
.mon-col { flex: 1; background: rgb(var(--el-color-primary)); border-radius: 2px 2px 0 0; transition: height 0.3s; min-height: 2px; }
.mon-col-mem { background: #06b6d4; }

.mon-detail { font-size: 12px; color: var(--el-text-color-secondary); }

.mon-disks { display: flex; flex-direction: column; gap: 8px; }
.mon-disk-item { display: flex; flex-direction: column; gap: 4px; }
.mon-disk-hd { display: flex; justify-content: space-between; font-size: 12px; }
.mon-disk-name { font-weight: 500; }
.mon-disk-pct { color: var(--el-text-color-secondary); }

.mon-stats { display: flex; gap: 24px; }
.mon-stat { display: flex; flex-direction: column; gap: 2px; }
.ms-label { font-size: 12px; color: var(--el-text-color-secondary); }
.ms-val { font-size: 18px; font-weight: 600; }
</style>
