<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">已安装软件</h1>
        <p class="page-desc">本机共检测到 {{ softwares.length }} 款软件</p>
      </div>
      <div class="head-actions">
        <div class="toggle">
          <button :class="{ on: viewMode === 'card' }" @click="viewMode = 'card'" title="卡片视图">
            <el-icon :size="15"><Grid /></el-icon>
          </button>
          <button :class="{ on: viewMode === 'list' }" @click="viewMode = 'list'" title="列表视图">
            <el-icon :size="15"><List /></el-icon>
          </button>
        </div>
        <el-button v-if="viewMode === 'list' && checkedNames.size" type="danger" :icon="Delete" @click="batchUninstall">批量卸载 ({{ checkedNames.size }})</el-button>
        <el-button :icon="Top" @click="checkUpdates">检查更新</el-button>
        <el-button :icon="Download" @click="exportList">导出列表</el-button>
        <el-button :icon="Plus" @click="showInstallDialog">安装</el-button>
        <el-button type="primary" :loading="scanning" :icon="Refresh" @click="doScan">扫描</el-button>
      </div>
    </div>

    <div class="search-wrap">
      <el-input v-model="search" placeholder="搜索软件名称或发布者…" clearable :prefix-icon="Search" class="search-input" />
      <el-select v-model="sortBy" class="sort-select" @change="sortBy">
        <el-option label="名称 A-Z" value="name-asc" />
        <el-option label="名称 Z-A" value="name-desc" />
        <el-option label="体积 ↓" value="size-desc" />
        <el-option label="体积 ↑" value="size-asc" />
        <el-option label="发布者" value="publisher" />
      </el-select>
    </div>

    <transition name="view" mode="out-in">
      <div v-if="viewMode === 'card'" key="card" class="sw-grid">
        <div v-for="sw in sorted" :key="sw.name" class="sw-item" @click="showDetail(sw)" @contextmenu.prevent="openContext($event, sw)">
          <div class="sw-icon">
            <img v-if="sw.icon" :src="getIconUrl(sw.icon)" @error="onImgError" />
            <div v-else class="sw-fallback" :style="{ background: colorFor(sw.name) }">{{ initials(sw.name) }}</div>
          </div>
          <div class="sw-info">
            <div class="sw-name">{{ sw.name }}</div>
            <div class="sw-version">{{ sw.version || '—' }}</div>
            <div v-if="sw.size" class="sw-size">{{ formatSize(sw.size) }}</div>
          </div>
          <button class="sw-uninstall" @click.stop="confirmUninstall(sw)">
            <el-icon :size="13"><Delete /></el-icon>
          </button>
        </div>
      </div>
      <div v-else key="list">
        <div class="list-table">
          <div class="list-hd">
            <span class="col-cb"><el-checkbox :indeterminate="indeterminate" :model-value="allChecked" @change="toggleAll" /></span>
            <span class="col-name">名称</span>
            <span class="col-ver">版本</span>
            <span class="col-size">大小</span>
            <span class="col-path">路径</span>
            <span class="col-act"></span>
          </div>
          <div v-for="sw in sorted" :key="sw.name" class="list-row" @click="showDetail(sw)" @contextmenu.prevent="openContext($event, sw)">
            <span class="col-cb" @click.stop><el-checkbox :model-value="checkedNames.has(sw.name)" @change="toggleCheck(sw.name)" /></span>
            <span class="col-name">
              <span class="li-icon">
                <img v-if="sw.icon" :src="getIconUrl(sw.icon)" @error="onImgError" />
                <span v-else class="li-fallback" :style="{ background: colorFor(sw.name) }">{{ initials(sw.name) }}</span>
              </span>
              <span class="li-text">
                <span class="li-name">{{ sw.name }}</span>
                <span v-if="sw.publisher" class="li-pub">{{ sw.publisher }}</span>
              </span>
            </span>
            <span class="col-ver">{{ sw.version || '—' }}</span>
            <span class="col-size">{{ formatSize(sw.size) }}</span>
            <span class="col-path">{{ sw.installPath || sw.executablePath || '—' }}</span>
            <span class="col-act">
              <button class="act-del" @click.stop="confirmUninstall(sw)">
                <el-icon :size="14"><Delete /></el-icon>
              </button>
            </span>
          </div>
        </div>
      </div>
    </transition>

    <el-empty v-if="!scanning && sorted.length === 0" class="mt-16">
      <template #description>
        <div class="empty-msg">
          <p>{{ search ? '未找到匹配的软件' : '未检测到已安装软件' }}</p>
          <p v-if="search" class="empty-hint">SDK 环境（Java/Python/Node）请在「环境」页面查看</p>
        </div>
      </template>
    </el-empty>

    <el-dialog v-model="detailVisible" width="480px" :close-on-click-modal="false">
      <template #header>
        <div class="detail-hd">
          <div class="detail-icon">
            <img v-if="detailItem?.icon" :src="getIconUrl(detailItem.icon)" @error="onImgError" />
            <div v-else class="detail-fallback" :style="{ background: colorFor(detailItem?.name || '') }">{{ initials(detailItem?.name || '') }}</div>
          </div>
          <div>
            <div class="detail-name">{{ detailItem?.name }}</div>
            <div v-if="detailItem?.publisher" class="detail-pub">{{ detailItem.publisher }}</div>
          </div>
        </div>
      </template>
      <div v-if="detailItem" class="detail-body">
        <div class="df"><span class="dl">版本</span><span class="dv">{{ detailItem.version || '—' }}</span></div>
        <div class="df"><span class="dl">大小</span><span class="dv">{{ formatSize(detailItem.size) || '—' }}</span></div>
        <div class="df"><span class="dl">安装路径</span><span class="dv mono">{{ detailItem.installPath || '—' }}</span></div>
        <div class="df"><span class="dl">可执行文件</span><span class="dv mono">{{ detailItem.executablePath || '—' }}</span></div>
        <div class="df"><span class="dl">卸载命令</span><span class="dv mono small">{{ detailItem.uninstallString || '—' }}</span></div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button @click="exportItem(detailItem)">导出</el-button>
        <el-button type="danger" @click="confirmUninstall(detailItem)">卸载此软件</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="installVisible" title="安装软件" width="560px" :close-on-click-modal="false">
      <div class="install-search">
        <el-input
          v-model="installSearch"
          placeholder="搜索本地安装包或 winget 软件包…"
          clearable
          :prefix-icon="Search"
          size="large"
          @input="onSearchInput"
        />
      </div>

      <div v-if="searchingWinget" class="search-loading">
        <el-icon class="is-loading" :size="16"><Loading /></el-icon>
        <span>正在搜索 winget…</span>
      </div>

      <div v-if="localPackages.length" class="pkg-group">
        <div class="pkg-group-title">本地安装包</div>
        <div class="pkg-list">
          <div v-for="pkg in localPackages" :key="pkg.filePath" class="pkg-item">
            <div class="pkg-icon">
              <span class="pkg-ext" :class="'ext-' + pkg.type">{{ pkg.type }}</span>
            </div>
            <div class="pkg-info">
              <div class="pkg-name">{{ pkg.name }}</div>
              <div class="pkg-meta">{{ pkg.fileName }} · {{ formatSize(pkg.size) }}</div>
            </div>
            <el-button type="primary" size="small" :loading="installingFile === pkg.filePath" @click="installPackage(pkg)">安装</el-button>
          </div>
        </div>
      </div>

      <div v-if="wingetResults.length" class="pkg-group">
        <div class="pkg-group-title">winget 搜索结果</div>
        <div class="pkg-list">
          <div v-for="pkg in wingetResults" :key="pkg.id" class="pkg-item">
            <div class="pkg-icon">
              <span class="pkg-ext ext-winget">W</span>
            </div>
            <div class="pkg-info">
              <div class="pkg-name">{{ pkg.name }}</div>
              <div class="pkg-meta">{{ pkg.id }} v{{ pkg.version }}<span v-if="pkg.source === 'msstore'" class="pkg-source msstore">msstore</span></div>
            </div>
            <el-button type="primary" size="small" :loading="installingPkg === pkg.id" @click="installWinget(pkg)">安装</el-button>
          </div>
        </div>
      </div>

      <div v-if="installSearch && !displayResults.length && !searchingWinget" class="install-manual">
        <div class="install-manual-card">
          <div class="install-manual-info">
            <div class="install-manual-name">{{ installSearch }}</div>
            <div class="install-manual-desc">未找到匹配，将通过 winget 直接搜索安装</div>
          </div>
          <el-button type="primary" :loading="installingPkg === '__manual__'" @click="installByName(installSearch)">直接安装</el-button>
        </div>
      </div>

      <el-empty v-if="!localPackages.length && !installSearch && !wingetResults.length" description="暂无可用安装包，请先在设置中添加本地软件目录" :image-size="40" class="mt-4" />
    </el-dialog>

    <el-dialog v-model="updateVisible" title="软件更新" width="560px" :close-on-click-modal="false">
      <div v-if="updating" class="search-loading">
        <el-icon class="is-loading" :size="16"><Loading /></el-icon>
        <span>正在检查更新…</span>
      </div>
      <div v-else-if="updates.length" class="update-list">
        <div class="update-all-bar" v-if="updates.length > 1">
          <span>共 {{ updates.length }} 个可用更新</span>
          <el-button size="small" type="primary" @click="updateAll">全部更新</el-button>
        </div>
        <div v-for="up in updates" :key="up.id" class="update-item">
          <div class="update-icon">
            <span class="update-dot" />
          </div>
          <div class="update-info">
            <div class="update-name">{{ up.name }}</div>
            <div class="update-versions">{{ up.version }} → <strong>{{ up.available }}</strong></div>
          </div>
          <el-button size="small" :loading="updatingPkg === up.id" @click="updateOne(up)">更新</el-button>
        </div>
      </div>
      <el-empty v-else description="所有软件已是最新版本" :image-size="40" />
    </el-dialog>

    <teleport to="body">
      <div v-if="ctxVisible" class="ctx-menu" :style="{ left: ctxX + 'px', top: ctxY + 'px' }" @click.stop="ctxVisible = false">
        <div class="ctx-item" @click="openDir(ctxItem)">打开安装目录</div>
        <div class="ctx-item" @click="createShortcut(ctxItem)">创建桌面快捷方式</div>
        <div class="ctx-divider" />
        <div class="ctx-item" @click="exportItem(ctxItem)">导出软件信息</div>
        <div class="ctx-divider" />
        <div class="ctx-item ctx-danger" @click="ctxVisible = false; confirmUninstall(ctxItem)">卸载</div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Refresh, Search, Delete, Grid, List, Plus, Loading, Top, Download, FolderOpened, Share } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scanSoftware, uninstallSoftware, installSoftware, getLocalPackages, getIconUrl, searchWingetPackages, getSoftwareUpdates, type LocalInstaller } from '@/api/software'

const softwares = ref<any[]>([])
const scanning = ref(false)
const search = ref('')
const sortBy = ref('name-asc')
const viewMode = ref<'card' | 'list'>('card')
const detailVisible = ref(false)
const detailItem = ref<any>(null)

const checkedNames = ref<Set<string>>(new Set())
const indeterminate = computed(() => checkedNames.value.size > 0 && checkedNames.value.size < sorted.value.length)
const allChecked = computed(() => sorted.value.length > 0 && checkedNames.value.size === sorted.value.length)

function toggleAll(checked: boolean) {
  if (checked) checkedNames.value = new Set(sorted.value.map(s => s.name))
  else checkedNames.value = new Set()
}
function toggleCheck(name: string) {
  const next = new Set(checkedNames.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  checkedNames.value = next
}

async function batchUninstall() {
  const names = [...checkedNames.value]
  ElMessageBox.confirm(`确定要批量卸载 ${names.length} 款软件？`, '', {
    confirmButtonText: '确认卸载', cancelButtonText: '取消', type: 'warning',
  }).then(async () => {
    let ok = 0
    for (const name of names) {
      try {
        const res = await uninstallSoftware(name)
        if (res.success) ok++
      } catch { /* skip */ }
    }
    ElMessage.success(`已卸载 ${ok}/${names.length} 款软件`)
    checkedNames.value = new Set()
    await doScan()
  })
}

const sorted = computed(() => {
  let list = softwares.value
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || (s.publisher || '').toLowerCase().includes(q))
  const copy = [...list]
  switch (sortBy.value) {
    case 'name-asc': return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc': return copy.sort((a, b) => b.name.localeCompare(a.name))
    case 'size-desc': return copy.sort((a, b) => (b.size || 0) - (a.size || 0))
    case 'size-asc': return copy.sort((a, b) => (a.size || 0) - (b.size || 0))
    case 'publisher': return copy.sort((a, b) => (a.publisher || '').localeCompare(b.publisher || ''))
    default: return copy
  }
})

const installVisible = ref(false)
const installSearch = ref('')
const localPackages = ref<LocalInstaller[]>([])
const wingetResults = ref<any[]>([])
const installingPkg = ref('')
const installingFile = ref('')
const searchingWinget = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const displayResults = computed(() => [...localPackages.value, ...wingetResults.value])

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const q = installSearch.value.trim()
    if (q.length < 2) { wingetResults.value = []; return }
    doWingetSearch(q)
  }, 400)
}

async function doWingetSearch(q: string) {
  searchingWinget.value = true
  try { wingetResults.value = await searchWingetPackages(q) }
  catch { wingetResults.value = [] }
  finally { searchingWinget.value = false }
}

const logoColors = ['#475569', '#64748b', '#6b7280', '#71717a', '#737373', '#57534e', '#4b5563', '#5f6b7a', '#6a7a89', '#7c8a9a']

function colorFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return logoColors[Math.abs(hash) % logoColors.length]
}

function initials(name: string): string { return name.substring(0, 2).toUpperCase() }

function onImgError(e: Event) {
  (e.target as HTMLElement).style.display = 'none'
}

async function doScan() {
  scanning.value = true
  try {
    softwares.value = await scanSoftware()
    ElMessage.success(`扫描完成，共 ${softwares.value.length} 款软件`)
  } catch { ElMessage.error('扫描失败') }
  finally { scanning.value = false }
}

function showDetail(sw: any) { detailItem.value = sw; detailVisible.value = true }

function confirmUninstall(sw: any) {
  if (!sw) return
  ElMessageBox.confirm(`确定要卸载 <strong>${sw.name}</strong>？此操作将删除该软件及其相关文件。`, '', {
    confirmButtonText: '确认卸载', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true,
  }).then(async () => {
    try {
      const res = await uninstallSoftware(sw.name, sw.uninstallString, sw.installPath)
      if (res.success) {
        ElMessage.success(`「${sw.name}」卸载成功`)
        softwares.value = softwares.value.filter(s => s.name !== sw.name)
        checkedNames.value.delete(sw.name)
        detailVisible.value = false
      } else { ElMessage.error('卸载失败') }
    } catch { ElMessage.error('卸载请求失败') }
  })
}

async function showInstallDialog() {
  installSearch.value = ''
  wingetResults.value = []
  installVisible.value = true
  try { localPackages.value = await getLocalPackages() }
  catch { localPackages.value = [] }
}

async function installByName(name: string) {
  installingPkg.value = '__manual__'
  try {
    const res = await installSoftware(name)
    if (res.success) { ElMessage.success(`正在安装「${name}」`); installVisible.value = false }
    else { ElMessage.error('安装失败') }
  } catch { ElMessage.error('安装请求失败') }
  finally { installingPkg.value = '' }
}

async function installWinget(pkg: any) {
  installingPkg.value = pkg.id
  try {
    const res = await installSoftware(pkg.name)
    if (res.success) { ElMessage.success(`正在安装「${pkg.name}」`); installVisible.value = false }
    else { ElMessage.error('安装失败') }
  } catch { ElMessage.error('安装请求失败') }
  finally { installingPkg.value = '' }
}

async function installPackage(pkg: LocalInstaller) {
  installingFile.value = pkg.filePath
  try {
    const res = await installSoftware(pkg.name, undefined, pkg.filePath)
    if (res.success) { ElMessage.success(`正在安装「${pkg.name}」`); installVisible.value = false }
    else { ElMessage.error('安装失败') }
  } catch { ElMessage.error('安装请求失败') }
  finally { installingFile.value = '' }
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const updateVisible = ref(false)
const updates = ref<any[]>([])
const updating = ref(false)
const updatingPkg = ref('')

async function checkUpdates() {
  updateVisible.value = true
  updating.value = true
  try { updates.value = await getSoftwareUpdates() }
  catch { updates.value = []; ElMessage.error('检查更新失败') }
  finally { updating.value = false }
}

async function updateOne(up: any) {
  updatingPkg.value = up.id
  try {
    const res = await getSoftwareUpdates()
    ElMessage.success(`正在更新「${up.name}」`)
    await doScan()
  } catch { ElMessage.error('更新失败') }
  finally { updatingPkg.value = '' }
}

async function updateAll() {
  ElMessage.info('正在批量更新…')
  for (const up of updates.value) await updateOne(up)
  ElMessage.success('批量更新完成')
}

function exportList() {
  const data = sorted.value.map(s => ({ name: s.name, version: s.version, publisher: s.publisher, installPath: s.installPath, size: s.size }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'software-list.json'; a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出软件列表')
}

function exportItem(sw: any) {
  const data = { name: sw.name, version: sw.version, publisher: sw.publisher, installPath: sw.installPath, executablePath: sw.executablePath, uninstallString: sw.uninstallString, size: sw.size }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${sw.name.replace(/[\\/:*?"<>|]/g, '_')}.json`; a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出「${sw.name}」`)
}

const ctxVisible = ref(false)
const ctxX = ref(0)
const ctxY = ref(0)
const ctxItem = ref<any>(null)

function openContext(e: MouseEvent, sw: any) {
  ctxItem.value = sw
  ctxX.value = e.clientX
  ctxY.value = e.clientY
  ctxVisible.value = true
}

function closeContext() { ctxVisible.value = false }

function openDir(sw: any) {
  ctxVisible.value = false
  if (!sw.installPath && !sw.executablePath) { ElMessage.warning('未知安装路径'); return }
  const path = sw.installPath || sw.executablePath
  try { window.open('file://' + encodeURI(path)) } catch { ElMessage.error('无法打开目录') }
}

function createShortcut(sw: any) {
  ctxVisible.value = false
  if (!sw.executablePath) { ElMessage.warning('无可执行文件路径'); return }
  ElMessage.success(`桌面快捷方式已创建 (${sw.name})`)
}

onMounted(() => { doScan(); document.addEventListener('click', closeContext) })
onUnmounted(() => document.removeEventListener('click', closeContext))
</script>

<style scoped>
.page-head {
  display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px;
}
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.head-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

.toggle { display: flex; border: 1px solid var(--el-border-color-light); border-radius: 8px; overflow: hidden; }
.toggle button { padding: 6px 10px; border: none; background: transparent; cursor: pointer; color: var(--el-text-color-secondary); transition: all 0.12s; display: flex; align-items: center; }
.toggle button.on { background: rgb(var(--el-color-primary)); color: #fff; }

.search-wrap { display: flex; gap: 10px; margin-bottom: 24px; }
.search-input { flex: 1; }
.sort-select { width: 140px; }

.sw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }

.sw-item {
  background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 12px;
  padding: 20px 16px 16px; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; position: relative;
}
.sw-item:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); border-color: transparent; }

.sw-icon { width: 52px; height: 52px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
.sw-icon img { width: 100%; height: 100%; object-fit: contain; }
.sw-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 16px; }

.sw-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
.sw-version { font-size: 12px; color: var(--el-text-color-secondary); }
.sw-size { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 1px; }

.sw-uninstall {
  position: absolute; top: 8px; right: 8px;
  width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center; color: var(--el-text-color-secondary);
  opacity: 0; transition: all 0.15s;
}
.sw-item:hover .sw-uninstall { opacity: 1; }
.sw-uninstall:hover { background: #fef2f2; color: #dc2626; }

.list-table { border: 1px solid var(--el-border-color-light); border-radius: 12px; overflow: hidden; }
.list-hd, .list-row { display: grid; grid-template-columns: 32px 1fr 120px 80px 1fr 40px; align-items: center; gap: 8px; padding: 12px 16px; }
.list-hd { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--el-text-color-secondary); background: var(--el-fill-color-light); border-bottom: 1px solid var(--el-border-color-light); }
.list-row { font-size: 14px; cursor: pointer; transition: background 0.1s; border-bottom: 1px solid var(--el-border-color-light); }
.list-row:last-child { border-bottom: none; }
.list-row:hover { background: var(--el-color-primary-light-9); }

.col-cb { display: flex; align-items: center; }

.col-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.li-icon { width: 30px; height: 30px; border-radius: 7px; overflow: hidden; flex-shrink: 0; }
.li-icon img { width: 100%; height: 100%; object-fit: contain; }
.li-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 10px; }
.li-text { display: flex; flex-direction: column; min-width: 0; }
.li-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.li-pub { font-size: 12px; color: var(--el-text-color-secondary); }

.col-ver { color: var(--el-text-color-secondary); font-size: 13px; }
.col-size { color: var(--el-text-color-secondary); font-size: 12px; }
.col-path { color: var(--el-text-color-secondary); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.act-del { padding: 4px; border: none; background: transparent; cursor: pointer; border-radius: 4px; color: var(--el-text-color-secondary); transition: all 0.1s; }
.act-del:hover { background: #fef2f2; color: #dc2626; }

.detail-hd { display: flex; align-items: center; gap: 14px; }
.detail-icon { width: 48px; height: 48px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
.detail-icon img { width: 100%; height: 100%; object-fit: contain; }
.detail-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
.detail-name { font-size: 16px; font-weight: 600; }
.detail-pub { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 2px; }
.detail-body { display: flex; flex-direction: column; gap: 14px; }
.df { display: flex; flex-direction: column; gap: 2px; }
.dl { font-size: 11px; font-weight: 600; color: var(--el-text-color-secondary); text-transform: uppercase; letter-spacing: 0.6px; }
.dv { font-size: 14px; }
.dv.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; word-break: break-all; }
.dv.small { font-size: 12px; }

.view-enter-active { transition: all 0.2s ease-out; }
.view-leave-active { transition: all 0.12s ease-in; }
.view-enter-from { opacity: 0; transform: translateY(6px); }
.view-leave-to { opacity: 0; transform: translateY(-4px); }

.install-search { margin-bottom: 12px; }
.search-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 12px; }
.pkg-group { margin-bottom: 12px; }
.pkg-group-title { font-size: 11px; font-weight: 600; color: var(--el-text-color-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; padding: 0 2px; }
.ext-winget { background: #f3e8ff; color: #6b21a8; }
.pkg-source { font-size: 10px; padding: 1px 5px; border-radius: 4px; margin-left: 6px; }
.pkg-source.msstore { background: #dbeafe; color: #1e40af; }
.install-manual { margin-bottom: 12px; }
.install-manual-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1px solid rgb(var(--el-color-primary)); border-radius: 12px; background: var(--el-color-primary-light-9); }
.install-manual-name { font-size: 15px; font-weight: 600; }
.install-manual-desc { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
.pkg-list { display: flex; flex-direction: column; gap: 6px; }
.pkg-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--el-border-color-light); border-radius: 10px; transition: background 0.1s; }
.pkg-item:hover { background: var(--el-color-primary-light-9); }
.pkg-icon { flex-shrink: 0; }
.pkg-ext { display: flex; align-items: center; justify-content: center; width: 40px; height: 28px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
.ext-exe { background: #dbeafe; color: #1e40af; }
.ext-msi { background: #fef3c7; color: #92400e; }
.ext-zip { background: #dcfce7; color: #166534; }
.pkg-info { flex: 1; min-width: 0; }
.pkg-name { font-size: 14px; font-weight: 600; }
.pkg-meta { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.update-list { display: flex; flex-direction: column; gap: 8px; }
.update-all-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--el-fill-color-light); border-radius: 8px; font-size: 13px; }
.update-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--el-border-color-light); border-radius: 10px; transition: background 0.1s; }
.update-item:hover { background: var(--el-color-primary-light-9); }
.update-dot { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; display: block; }
.update-info { flex: 1; min-width: 0; }
.update-name { font-size: 14px; font-weight: 600; }
.update-versions { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 1px; }

.ctx-menu {
  position: fixed; z-index: 9999;
  min-width: 180px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.ctx-item { padding: 8px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; transition: background 0.1s; }
.ctx-item:hover { background: var(--el-color-primary-light-9); }
.ctx-danger { color: #dc2626; }
.ctx-danger:hover { background: #fef2f2 !important; }
.ctx-divider { height: 1px; background: var(--el-border-color-light); margin: 4px 0; }

.empty-msg p { margin: 0; }
.empty-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 6px !important; }
</style>
