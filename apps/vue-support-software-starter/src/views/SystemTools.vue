<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">系统工具</h1>
        <p class="page-desc">启动项 / 进程 / 服务 / 注册表管理</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="tool-tabs">
      <el-tab-pane label="启动项管理" name="startup">
        <div class="seg">
          <div class="seg-hd">
            <h2 class="seg-title">开机自启程序</h2>
            <el-button size="small" :loading="startupLoading" @click="loadStartup">刷新</el-button>
          </div>
          <div v-if="startupItems.length" class="tool-list">
            <div v-for="item in startupItems" :key="item.name + item.location" class="tool-item">
              <div class="ti-left">
                <span class="ti-dot" :class="item.enabled ? 'on' : 'off'" />
                <div class="ti-info">
                  <div class="ti-name">{{ item.name }}</div>
                  <div class="ti-path">{{ item.command || item.location }}</div>
                </div>
              </div>
              <div class="ti-right">
                <span class="ti-loc">{{ item.location }}</span>
                <el-switch :model-value="item.enabled" @change="(v: boolean) => toggleStartupItem(item, v)" size="small" />
                <button class="ti-del" @click="removeStartupItem(item)"><el-icon :size="13"><Delete /></el-icon></button>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无启动项" :image-size="40" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="进程管理" name="processes">
        <div class="seg">
          <div class="seg-hd">
            <h2 class="seg-title">运行进程 ({{ processes.length }})</h2>
            <el-input v-model="procSearch" placeholder="搜索进程名" clearable size="small" class="proc-search" />
            <el-button size="small" :loading="procLoading" @click="loadProcesses">刷新</el-button>
          </div>
          <div class="proc-table">
            <div class="proc-hd">
              <span class="pc-pid">PID</span>
              <span class="pc-name">名称</span>
              <span class="pc-mem">内存</span>
              <span class="pc-act"></span>
            </div>
            <div v-for="p in filteredProcs" :key="p.pid" class="proc-row">
              <span class="pc-pid">{{ p.pid }}</span>
              <span class="pc-name">{{ p.name }}</span>
              <span class="pc-mem">{{ formatBytes(p.memoryBytes) }}</span>
              <span class="pc-act"><button class="act-kill" @click="doKillProcess(p)">结束</button></span>
            </div>
          </div>
          <el-empty v-if="!procLoading && !filteredProcs.length" description="无匹配进程" :image-size="40" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="服务管理" name="services">
        <div class="seg">
          <div class="seg-hd">
            <h2 class="seg-title">系统服务 ({{ services.length }})</h2>
            <el-input v-model="svcSearch" placeholder="搜索服务名" clearable size="small" class="proc-search" />
            <el-button size="small" :loading="svcLoading" @click="loadServices">刷新</el-button>
          </div>
          <div class="proc-table">
            <div class="proc-hd">
              <span class="pc-name wide">名称</span>
              <span class="pc-mem">状态</span>
              <span class="pc-mem">启动类型</span>
              <span class="pc-act"></span>
            </div>
            <div v-for="s in filteredSvcs" :key="s.name" class="proc-row">
              <span class="pc-name wide">
                <span class="svc-dot" :class="s.status === 'Running' ? 'on' : 'off'" />
                {{ s.displayName || s.name }}
              </span>
              <span class="pc-mem"><span class="stat-tag" :class="s.status === 'Running' ? 'running' : 'stopped'">{{ s.status }}</span></span>
              <span class="pc-mem">{{ s.startType }}</span>
              <span class="pc-act">
                <button v-if="s.status !== 'Running'" class="act-start" @click="doControlService(s, 'start')">启动</button>
                <button v-else class="act-stop" @click="doControlService(s, 'stop')">停止</button>
              </span>
            </div>
          </div>
          <el-empty v-if="!svcLoading && !filteredSvcs.length" description="无匹配服务" :image-size="40" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="剪贴板历史" name="clipboard">
        <div class="seg">
          <div class="seg-hd">
            <h2 class="seg-title">剪贴板记录 ({{ clipboardItems.length }})</h2>
            <el-input v-model="clipSearch" placeholder="搜索内容" clearable size="small" class="proc-search" />
            <el-button size="small" :loading="cbLoading" @click="loadClipboard">刷新</el-button>
            <el-button v-if="clipboardItems.length" size="small" text type="danger" @click="clearClipboard">清空</el-button>
          </div>
          <div class="clip-list" v-loading="cbLoading">
            <div v-for="(item, i) in filteredClip" :key="i" class="clip-item" @click="copyClip(item)">
              <div class="clip-preview">{{ item.content }}</div>
              <div class="clip-meta">
                <span>{{ item.date || item.time }}</span>
                <span>{{ item.length }} 字符</span>
                <span class="clip-copy-hint">点击复制</span>
              </div>
            </div>
          </div>
          <el-empty v-if="!cbLoading && !filteredClip.length" description="无剪贴板记录" :image-size="40" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="系统清理" name="cleanup">
        <div class="seg">
          <div class="seg-hd">
            <h2 class="seg-title">空间清理</h2>
            <div class="reg-actions">
              <span v-if="cleanupItems.length" class="reg-count">{{ cleanupItems.length }} 项，共 {{ totalCleanupSize }}</span>
              <el-button size="small" :loading="clLoading" @click="loadCleanup">扫描</el-button>
              <el-button v-if="cleanupItems.length" size="small" type="danger" :loading="clCleaning" @click="doClCleanAll">一键清理</el-button>
            </div>
          </div>
          <div class="tool-list">
            <div v-for="(item, i) in cleanupItems" :key="i" class="tool-item">
              <div class="ti-left">
                <el-icon :size="15" :class="'cl-icon cl-' + item.type"><Delete /></el-icon>
                <div class="ti-info">
                  <div class="ti-name">{{ item.name }}</div>
                  <div class="ti-path">{{ item.path }}</div>
                </div>
              </div>
              <div class="ti-right">
                <span class="cl-size">{{ item.sizeFormatted }}</span>
                <el-button size="small" text type="danger" @click="doClCleanOne(i)">清理</el-button>
              </div>
            </div>
          </div>
          <el-empty v-if="!clLoading && !cleanupItems.length" description="点击「扫描」检查可清理空间" :image-size="40" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="网络工具" name="network">
        <div class="seg">
          <div class="seg-hd">
            <h2 class="seg-title">网络诊断</h2>
            <el-select v-model="netTool" size="small" class="net-tool-select">
              <el-option label="Ping" value="ping" />
              <el-option label="Tracert" value="tracert" />
              <el-option label="DNS 查询" value="dns" />
              <el-option label="端口检测" value="port" />
              <el-option label="网络连接" value="connections" />
              <el-option label="本机 IP" value="localip" />
            </el-select>
            <el-input v-if="netTool !== 'connections' && netTool !== 'localip'" v-model="netHost" placeholder="主机名或 IP" clearable size="small" class="net-host-input" @keyup.enter="runNetTool" />
            <el-input v-if="netTool === 'port'" v-model.number="netPort" placeholder="端口" clearable size="small" class="net-port-input" />
            <el-button size="small" :loading="netLoading" @click="runNetTool">执行</el-button>
          </div>

          <div v-if="netTool === 'connections' && !netLoading" class="proc-table">
            <div class="proc-hd"><span class="pc-name wide">协议</span><span class="pc-name">本地地址</span><span class="pc-name">远程地址</span><span class="pc-mem">状态</span></div>
            <div v-for="(c, i) in netConnections" :key="i" class="proc-row">
              <span class="pc-name wide">{{ c.protocol }}</span>
              <span class="pc-name" style="font-family:monospace;font-size:11px">{{ c.local }}</span>
              <span class="pc-name" style="font-family:monospace;font-size:11px">{{ c.remote }}</span>
              <span class="pc-mem">{{ c.state }}</span>
            </div>
          </div>

          <div v-if="netTool === 'localip' && netLocalIp.ips" class="tool-list">
            <div v-for="(ip, i) in netLocalIp.ips" :key="i" class="tool-item">
              <div class="ti-left"><span class="ti-name">{{ ip }}</span></div>
            </div>
          </div>

          <div v-if="netOutput" class="net-output">
            <pre class="net-pre">{{ netOutput }}</pre>
          </div>

          <el-empty v-if="!netLoading && !netOutput && !netConnections.length && netTool !== 'localip'" description="输入主机后点击执行" :image-size="40" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="注册表清理" name="registry">
        <div class="seg">
          <div class="seg-hd">
            <h2 class="seg-title">残留注册表项</h2>
            <div class="reg-actions">
              <span v-if="orphans.length" class="reg-count">发现 {{ orphans.length }} 项</span>
              <el-button size="small" :loading="regLoading" @click="loadRegistry">扫描</el-button>
              <el-button v-if="orphans.length" size="small" type="danger" :loading="cleaning" @click="doCleanAll">一键清理</el-button>
            </div>
          </div>
          <div v-if="orphans.length" class="tool-list">
            <div v-for="(entry, i) in orphans" :key="i" class="tool-item">
              <div class="ti-left">
                <el-icon :size="15" class="reg-icon"><WarningFilled /></el-icon>
                <div class="ti-info">
                  <div class="ti-name">{{ entry.name }}</div>
                  <div class="ti-path">{{ entry.key }}</div>
                  <div class="ti-hint">{{ entry.suggestion }}</div>
                </div>
              </div>
              <div class="ti-right">
                <el-button size="small" text type="danger" @click="doCleanOne(i)">清理</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="点击「扫描」检查残留注册表项" :image-size="40" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, WarningFilled } from '@element-plus/icons-vue'
import { listStartup, toggleStartup, listProcesses, killProcess, listServices, controlService, scanRegistry, cleanRegistry, getClipboardHistory, setClipboardText, clearClipboardHistory, scanCleanup, executeCleanup, networkPing, networkTraceroute, networkDns, networkPort, networkConnections, networkLocalIp } from '@/api/software'

const activeTab = ref('startup')

const startupItems = ref<any[]>([])
const startupLoading = ref(false)

const processes = ref<any[]>([])
const procLoading = ref(false)
const procSearch = ref('')

const services = ref<any[]>([])
const svcLoading = ref(false)
const svcSearch = ref('')

const orphans = ref<any[]>([])
const regLoading = ref(false)
const cleaning = ref(false)

const filteredProcs = computed(() => {
  const q = procSearch.value.toLowerCase().trim()
  if (!q) return processes.value
  return processes.value.filter(p => p.name.toLowerCase().includes(q))
})

const filteredSvcs = computed(() => {
  const q = svcSearch.value.toLowerCase().trim()
  if (!q) return services.value
  return services.value.filter(s => (s.displayName || s.name).toLowerCase().includes(q))
})

async function loadStartup() {
  startupLoading.value = true
  try { startupItems.value = await listStartup() }
  catch { ElMessage.error('加载启动项失败') }
  finally { startupLoading.value = false }
}

async function toggleStartupItem(item: any, enabled: boolean) {
  try {
    await toggleStartup(item.name, enabled)
    item.enabled = enabled
    ElMessage.success(enabled ? '已启用' : '已禁用')
  } catch { ElMessage.error('操作失败') }
}

async function removeStartupItem(item: any) {
  try {
    await toggleStartup(item.name, false)
    startupItems.value = startupItems.value.filter(i => i !== item)
    ElMessage.success('已移除')
  } catch { ElMessage.error('移除失败') }
}

async function loadProcesses() {
  procLoading.value = true
  try { processes.value = await listProcesses() }
  catch { ElMessage.error('加载进程失败') }
  finally { procLoading.value = false }
}

async function doKillProcess(p: any) {
  ElMessageBox.confirm(`确定结束进程「${p.name}」(PID: ${p.pid})？`, '', {
    confirmButtonText: '结束进程', cancelButtonText: '取消', type: 'warning',
  }).then(async () => {
    try {
      await killProcess(p.pid)
      ElMessage.success('进程已结束')
      processes.value = processes.value.filter(pp => pp.pid !== p.pid)
    } catch { ElMessage.error('结束进程失败') }
  })
}

async function loadServices() {
  svcLoading.value = true
  try { services.value = await listServices() }
  catch { ElMessage.error('加载服务失败') }
  finally { svcLoading.value = false }
}

async function doControlService(s: any, action: string) {
  try {
    await controlService(s.name, action)
    ElMessage.success(`${action === 'start' ? '启动' : '停止'}成功`)
    await loadServices()
  } catch { ElMessage.error('操作失败') }
}

async function loadRegistry() {
  regLoading.value = true
  try { orphans.value = await scanRegistry() }
  catch { ElMessage.error('扫描注册表失败') }
  finally { regLoading.value = false }
}

async function doCleanOne(index: number) {
  const entry = orphans.value[index]
  try {
    await cleanRegistry([entry])
    orphans.value.splice(index, 1)
    ElMessage.success('已清理')
  } catch { ElMessage.error('清理失败') }
}

async function doCleanAll() {
  cleaning.value = true
  try {
    await cleanRegistry(orphans.value)
    ElMessage.success(`已清理 ${orphans.value.length} 项`)
    orphans.value = []
  } catch { ElMessage.error('清理失败') }
  finally { cleaning.value = false }
}

const clipboardItems = ref<any[]>([])
const cbLoading = ref(false)
const clipSearch = ref('')

const cleanupItems = ref<any[]>([])
const clLoading = ref(false)
const clCleaning = ref(false)

const netTool = ref('ping')
const netHost = ref('localhost')
const netPort = ref(80)
const netLoading = ref(false)
const netOutput = ref('')
const netConnections = ref<any[]>([])
const netLocalIp = ref<any>({})

const filteredClip = computed(() => {
  const q = clipSearch.value.toLowerCase().trim()
  if (!q) return clipboardItems.value
  return clipboardItems.value.filter(i => (i.content || '').toLowerCase().includes(q))
})

const totalCleanupSize = computed(() => {
  const total = cleanupItems.value.reduce((s: number, i: any) => s + (i.size || 0), 0)
  if (total < 1048576) return (total / 1024).toFixed(0) + ' KB'
  if (total < 1073741824) return (total / 1048576).toFixed(1) + ' MB'
  return (total / 1073741824).toFixed(1) + ' GB'
})

async function loadClipboard() {
  cbLoading.value = true
  try { clipboardItems.value = await getClipboardHistory() }
  catch { ElMessage.error('加载失败') }
  finally { cbLoading.value = false }
}

async function copyClip(item: any) {
  try {
    await setClipboardText(item.fullContent || item.content)
    ElMessage.success('已复制到剪贴板')
  } catch { ElMessage.error('复制失败') }
}

async function clearClipboard() {
  try {
    await clearClipboardHistory()
    clipboardItems.value = []
    ElMessage.success('已清空')
  } catch { ElMessage.error('清空失败') }
}

async function loadCleanup() {
  clLoading.value = true
  try { cleanupItems.value = await scanCleanup() }
  catch { ElMessage.error('扫描失败') }
  finally { clLoading.value = false }
}

async function doClCleanOne(index: number) {
  try {
    await executeCleanup([cleanupItems.value[index]])
    cleanupItems.value.splice(index, 1)
    ElMessage.success('已清理')
  } catch { ElMessage.error('清理失败') }
}

async function doClCleanAll() {
  clCleaning.value = true
  try {
    await executeCleanup(cleanupItems.value)
    ElMessage.success('清理完成')
    cleanupItems.value = []
  } catch { ElMessage.error('清理失败') }
  finally { clCleaning.value = false }
}

async function runNetTool() {
  netLoading.value = true
  netOutput.value = ''
  netConnections.value = []
  netLocalIp.value = {}
  try {
    switch (netTool.value) {
      case 'ping': {
        const r = await networkPing(netHost.value || 'localhost')
        netOutput.value = r.output || ''
        break
      }
      case 'tracert': {
        const r = await networkTraceroute(netHost.value || 'localhost')
        netOutput.value = r.output || ''
        break
      }
      case 'dns': {
        const r = await networkDns(netHost.value || 'localhost')
        netOutput.value = r.output || ''
        break
      }
      case 'port': {
        const r = await networkPort(netHost.value || 'localhost', netPort.value || 80)
        netOutput.value = r.message || ''
        break
      }
      case 'connections': {
        netConnections.value = await networkConnections()
        break
      }
      case 'localip': {
        netLocalIp.value = await networkLocalIp()
        break
      }
    }
  } catch { ElMessage.error('执行失败') }
  finally { netLoading.value = false }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  const mb = bytes / 1048576
  if (mb < 1) return (bytes / 1024).toFixed(1) + ' KB'
  return mb.toFixed(1) + ' MB'
}

onMounted(() => { loadStartup() })
</script>

<style scoped>
.page-head { margin-bottom: 28px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }
.tool-tabs { --el-tabs-header-height: 44px; }

.seg { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 14px; padding: 24px; }
.seg-hd { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.seg-title { font-size: 16px; font-weight: 600; flex: 1; }

.tool-list { display: flex; flex-direction: column; gap: 4px; }
.tool-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; transition: background 0.1s; gap: 12px; }
.tool-item:hover { background: var(--el-color-primary-light-9); }
.ti-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.ti-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ti-dot.on { background: #22c55e; }
.ti-dot.off { background: var(--el-text-color-secondary); }
.ti-info { min-width: 0; }
.ti-name { font-size: 14px; font-weight: 500; }
.ti-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
.ti-hint { font-size: 11px; color: #dc2626; margin-top: 1px; }
.ti-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ti-loc { font-size: 11px; color: var(--el-text-color-secondary); padding: 2px 8px; background: var(--el-fill-color-light); border-radius: 4px; }
.ti-del { padding: 4px; border: none; background: transparent; cursor: pointer; border-radius: 4px; color: var(--el-text-color-secondary); }
.ti-del:hover { background: #fef2f2; color: #dc2626; }

.proc-search { width: 180px; }
.proc-table { border: 1px solid var(--el-border-color-light); border-radius: 8px; overflow: hidden; }
.proc-hd, .proc-row { display: grid; grid-template-columns: 70px 1fr 100px 60px; gap: 8px; padding: 8px 12px; align-items: center; }
.proc-hd { font-size: 11px; font-weight: 600; color: var(--el-text-color-secondary); background: var(--el-fill-color-light); text-transform: uppercase; }
.proc-row { font-size: 13px; border-bottom: 1px solid var(--el-border-color-light); transition: background 0.1s; }
.proc-row:last-child { border-bottom: none; }
.proc-row:hover { background: var(--el-color-primary-light-9); }
.pc-pid { color: var(--el-text-color-secondary); }
.pc-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-name.wide { display: flex; align-items: center; gap: 6px; }
.pc-mem { color: var(--el-text-color-secondary); font-size: 12px; }

.svc-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.svc-dot.on { background: #22c55e; }
.svc-dot.off { background: var(--el-text-color-secondary); }

.stat-tag { font-size: 11px; padding: 1px 8px; border-radius: 100px; }
.stat-tag.running { background: #dcfce7; color: #166534; }
.stat-tag.stopped { background: var(--el-fill-color-light); color: var(--el-text-color-secondary); }

.act-kill { padding: 3px 10px; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; background: transparent; color: #dc2626; transition: all 0.1s; }
.act-kill:hover { background: #fef2f2; }

.act-start { padding: 3px 10px; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; background: #dcfce7; color: #166534; }
.act-start:hover { background: #bbf7d0; }
.act-stop { padding: 3px 10px; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; background: #fee2e2; color: #b91c1c; }
.act-stop:hover { background: #fecaca; }

.reg-actions { display: flex; align-items: center; gap: 8px; }
.reg-count { font-size: 13px; color: var(--el-text-color-secondary); }
.reg-icon { color: #f59e0b; flex-shrink: 0; }

.clip-list { display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; }
.clip-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.1s; border: 1px solid var(--el-border-color-light); }
.clip-item:hover { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary-light-7); }
.clip-preview { font-size: 13px; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clip-meta { display: flex; gap: 12px; font-size: 11px; color: var(--el-text-color-secondary); margin-top: 4px; }
.clip-copy-hint { color: rgb(var(--el-color-primary)); opacity: 0; transition: opacity 0.15s; }
.clip-item:hover .clip-copy-hint { opacity: 1; }

.cl-icon { flex-shrink: 0; }
.cl-temp { color: #f59e0b; }
.cl-system { color: #dc2626; }
.cl-browser { color: #2563eb; }
.cl-recycle { color: #059669; }
.cl-large-file { color: #7c3aed; }
.cl-size { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); font-family: monospace; }

.net-tool-select { width: 140px; }
.net-host-input { width: 200px; }
.net-port-input { width: 100px; }
.net-output { margin-top: 12px; }
.net-pre { background: var(--el-fill-color-light); padding: 12px 16px; border-radius: 8px; font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace; max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-all; line-height: 1.6; }
</style>
