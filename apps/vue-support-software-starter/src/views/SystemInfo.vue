<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">系统信息</h1>
        <p class="page-desc">操作系统、硬件、运行时与环境变量</p>
      </div>
      <el-button size="default" :icon="Refresh" @click="load" :loading="loading">刷新</el-button>
    </div>

    <div v-if="info" class="grid-2">
      <div class="seg">
        <h2 class="seg-title">操作系统</h2>
        <div class="prop-list">
          <div class="prop"><span class="prop-key">系统名称</span><span class="prop-val">{{ info.osName }}</span></div>
          <div class="prop"><span class="prop-key">系统版本</span><span class="prop-val">{{ info.osVersion }}</span></div>
          <div class="prop"><span class="prop-key">系统架构</span><span class="prop-val">{{ info.osArch }}</span></div>
          <div class="prop"><span class="prop-key">运行时间</span><span class="prop-val">{{ formatUptime(info.uptime) }}</span></div>
          <div class="prop"><span class="prop-key">用户</span><span class="prop-val">{{ info.userName }}</span></div>
        </div>
      </div>

      <div class="seg">
        <h2 class="seg-title">处理器</h2>
        <div class="prop-list">
          <div class="prop"><span class="prop-key">架构</span><span class="prop-val">{{ info.cpuArch }}</span></div>
          <div class="prop"><span class="prop-key">逻辑核心</span><span class="prop-val">{{ info.cpuCores }}</span></div>
          <div class="prop"><span class="prop-key">可用处理器</span><span class="prop-val">{{ info.availableProcessors }}</span></div>
          <div class="prop"><span class="prop-key">系统负载</span><span class="prop-val">{{ info.systemLoadAverage >= 0 ? info.systemLoadAverage.toFixed(2) : 'N/A' }}</span></div>
          <div class="prop"><span class="prop-key">CPU 使用率</span><span class="prop-val">{{ info.cpuLoad >= 0 ? info.cpuLoad.toFixed(1) + '%' : 'N/A' }}</span></div>
        </div>
      </div>

      <div class="seg">
        <h2 class="seg-title">内存</h2>
        <div class="prop-list">
          <div class="prop"><span class="prop-key">总内存</span><span class="prop-val">{{ formatBytes(info.totalMemory) }}</span></div>
          <div class="prop"><span class="prop-key">已使用</span><span class="prop-val">{{ formatBytes(info.usedMemory) }}</span></div>
          <div class="prop"><span class="prop-key">空闲</span><span class="prop-val">{{ formatBytes(info.freeMemory) }}</span></div>
        </div>
        <div class="bar-wrap">
          <div class="bar-label">{{ info.memoryUsagePercent.toFixed(1) }}%</div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: info.memoryUsagePercent + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="seg">
        <h2 class="seg-title">JVM 运行时</h2>
        <div class="prop-list">
          <div class="prop"><span class="prop-key">Java 版本</span><span class="prop-val">{{ info.javaVersion }}</span></div>
          <div class="prop"><span class="prop-key">Java 厂商</span><span class="prop-val">{{ info.javaVendor }}</span></div>
          <div class="prop"><span class="prop-key">JVM 名称</span><span class="prop-val">{{ info.jvmName }}</span></div>
          <div class="prop"><span class="prop-key">JVM 版本</span><span class="prop-val">{{ info.jvmVersion }}</span></div>
          <div class="prop"><span class="prop-key">堆内存 (最大)</span><span class="prop-val">{{ formatBytes(info.jvmMaxMemory) }}</span></div>
          <div class="prop"><span class="prop-key">堆内存 (已用)</span><span class="prop-val">{{ formatBytes(info.jvmMemory - info.jvmFreeMemory) }} / {{ formatBytes(info.jvmMemory) }}</span></div>
        </div>
      </div>
    </div>

    <div v-if="info && info.disks.length" class="seg mt-6">
      <h2 class="seg-title">磁盘</h2>
      <div class="disk-grid">
        <div v-for="disk in info.disks" :key="disk.name" class="disk-card">
          <div class="disk-top">
            <span class="disk-name">{{ disk.name || 'unnamed' }}</span>
            <span class="disk-type">{{ disk.type }}</span>
          </div>
          <div class="disk-bar-wrap">
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: disk.usagePercent + '%' }"></div>
            </div>
            <div class="bar-label-sm">{{ disk.usagePercent.toFixed(0) }}%</div>
          </div>
          <div class="disk-detail">
            <span>{{ formatBytes(disk.used) }} / {{ formatBytes(disk.total) }}</span>
            <span>可用 {{ formatBytes(disk.usable) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="info && info.networks.length" class="seg mt-6">
      <h2 class="seg-title">网络接口</h2>
      <div class="net-list">
        <div v-for="net in info.networks" :key="net.name" class="net-item">
          <span class="net-name">{{ net.name }}</span>
          <div class="net-addrs">
            <span v-for="addr in net.addresses" :key="addr" class="net-addr">{{ addr }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="info && info.environment" class="seg mt-6">
      <h2 class="seg-title">环境变量</h2>
      <p class="seg-desc">PATH、HOME、Java、Python、Node.js 等关键变量</p>
      <el-collapse accordion class="env-collapse">
        <el-collapse-item v-for="(val, key) in info.environment" :key="key" :title="key" :name="key">
          <div class="env-val">{{ val }}</div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getSystemInfo, SystemInfo } from '@/api/software'

const loading = ref(false)
const info = ref<SystemInfo | null>(null)

async function load() {
  loading.value = true
  try {
    info.value = await getSystemInfo()
  } catch {
    ElMessage.error('获取系统信息失败')
  } finally {
    loading.value = false
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function formatUptime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(d + '天')
  if (h > 0) parts.push(h + '小时')
  parts.push(m + '分钟')
  return parts.join(' ')
}

onMounted(() => { load() })
</script>

<style scoped>
.page-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 28px;
}
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.seg { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 14px; padding: 24px; }
.seg-title { font-size: 16px; font-weight: 600; margin-bottom: 14px; }
.seg-desc { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px; margin-bottom: 12px; }

.prop-list { display: flex; flex-direction: column; gap: 8px; }
.prop { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.prop-key { color: var(--el-text-color-secondary); }
.prop-val { font-weight: 500; color: var(--el-text-color-primary); }

.bar-wrap { margin-top: 12px; }
.bar-label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.bar-track { height: 6px; border-radius: 3px; background: var(--el-fill-color-light); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; background: rgb(var(--el-color-primary)); transition: width 0.4s; }

.disk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.disk-card { border: 1px solid var(--el-border-color-light); border-radius: 10px; padding: 14px; }
.disk-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.disk-name { font-size: 14px; font-weight: 600; }
.disk-type { font-size: 11px; padding: 1px 8px; border-radius: 100px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); }
.disk-bar-wrap { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.disk-bar-wrap .bar-track { flex: 1; }
.bar-label-sm { font-size: 12px; color: var(--el-text-color-secondary); min-width: 36px; text-align: right; }
.disk-detail { font-size: 12px; color: var(--el-text-color-secondary); display: flex; justify-content: space-between; }

.net-list { display: flex; flex-direction: column; gap: 10px; }
.net-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--el-border-color-light); border-radius: 8px; }
.net-name { font-size: 13px; font-weight: 600; white-space: nowrap; min-width: 120px; }
.net-addrs { display: flex; flex-direction: column; gap: 2px; }
.net-addr { font-size: 12px; color: var(--el-text-color-secondary); font-family: monospace; }

.env-collapse { --el-collapse-header-bg-color: transparent; --el-collapse-content-bg-color: transparent; }
.env-val { font-size: 12px; color: var(--el-text-color-secondary); word-break: break-all; font-family: monospace; white-space: pre-wrap; }

.mt-6 { margin-top: 16px; }

@media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
</style>
