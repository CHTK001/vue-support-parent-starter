<template>
  <div class="asset-list fade-in">
    <div class="summary-row">
      <!-- layout="stacked"：图标插槽里放的是 32x3px 的横向色条，是为竖排设计的。
           紧凑档默认横排会把色条甩到数值左边变成一根短横线，所以这里保留竖排，
           只拿紧凑档的尺寸收益。 -->
      <ReStatCard
        size="compact"
        layout="stacked"
        v-for="s in summary"
        :key="s.label"
        :title="s.label"
        :value="s.value"
        :icon-color="s.color"
      >
        <template #value><ReCountup :value="s.value" :duration="800" /></template>
        <template #icon>
          <div class="stat-bar" :style="{ background: s.color }"></div>
        </template>
      </ReStatCard>
    </div>

    <ReCard layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="filter-bar">
        <div class="search-box">
          <ReIcon class="search-icon" name="Search" :size="14" />
          <input v-model="filters.keyword" placeholder="搜索名称 / 主机地址…" />
        </div>
        <ReSelect v-model="filters.serviceType" placeholder="服务类型" class="filter-select" clearable
          :data="[{ label: '全部', value: '' }, { label: '服务器', value: 'SERVER' }, { label: 'Redis', value: 'REDIS' }, { label: 'MySQL', value: 'MYSQL' }, { label: 'PostgreSQL', value: 'PG' }, { label: 'Oracle', value: 'ORACLE' }, { label: 'MSSQL', value: 'MSSQL' }]" />
        <ReSelect v-model="filters.enabled" placeholder="状态" class="filter-select" clearable
          :data="[{ label: '全部', value: '' }, { label: '启用', value: 1 }, { label: '禁用', value: 0 }]" />
        <span class="filter-divider"></span>
        <ReButton show-text icon="RefreshLeft" plain @click="fetchList">刷新</ReButton>
        <ReButton show-text icon="Plus" type="primary" @click="openAdd">新增资产</ReButton>
      </div>
    </ReCard>

    <ReTable :data="filtered" :loading="loading" border stripe class="asset-table" :pagination="false" :toolbar="false">
      <ReTableColumn prop="monitorName" label="资产名称" min-width="160">
        <template #default="{ row }"><span class="name-cell">{{ row.monitorName }}</span></template>
      </ReTableColumn>
      <ReTableColumn prop="monitorHost" label="主机地址" min-width="150" />
      <ReTableColumn prop="monitorPort" label="端口" width="80" align="center" />
      <ReTableColumn prop="serviceType" label="服务类型" width="100" align="center">
        <template #default="{ row }">
          <ReTag :class="['type-tag', typeClass(row.serviceType)]" effect="plain" >{{ typeLabel(row.serviceType) }}</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="serverType" label="系统类型" width="90" align="center">
        <template #default="{ row }"><span v-if="row.serverType">{{ row.serverType }}</span><span v-else class="dim">—</span></template>
      </ReTableColumn>
      <ReTableColumn prop="monitorGroup" label="分组" width="100" align="center">
        <template #default="{ row }"><span v-if="row.monitorGroup">{{ row.monitorGroup }}</span><span v-else class="dim">—</span></template>
      </ReTableColumn>
      <ReTableColumn prop="monitorEnabled" label="状态" width="80" align="center">
        <template #default="{ row }">
          <span :class="['status-pill', row.monitorEnabled === 1 ? 'on' : 'off']">{{ row.monitorEnabled === 1 ? '运行中' : '已停用' }}</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="探针" width="90" align="center">
        <template #default="{ row }">
          <template v-if="!row.monitorAgentKey">
            <span class="dim">—</span>
          </template>
          <template v-else-if="agentStatusMap[row.id]?.online === true">
            <span class="status-pill on">在线</span>
          </template>
          <template v-else-if="agentStatusMap[row.id]?.online === false">
            <span class="status-pill off">离线</span>
          </template>
          <template v-else>
            <span class="dim">未知</span>
          </template>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="createTime" label="创建时间" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.createTime" class="dim">{{ row.createTime.slice(0, 19).replace('T', ' ') }}</span>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="140" fixed="right" align="right">
        <template #default="{ row }">
          <ReButton link @click="editRow(row)">编辑</ReButton>
          <ReButton link type="danger" @click="handleDelete(row.id)">删除</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <ReDialog v-model="showDialog" :title="editId ? '编辑资产' : '新增资产'" width="520" :height="560" destroy-on-close confirm-text="保存" cancel-text="取消" compact :footer-hidden="false" @confirm="handleSave" @cancel="showDialog = false">
      <ReForm :model="form" label-position="top" class="asset-form" :disabled="serverHostLoading">
        <ReFormItem label="服务器配置">
          <ReSelect v-model="form.msServerHostId" placeholder="从服务器台账关联（可选）" clearable filterable style="width:100%"
            :data="serverHosts.map(h => ({ label: `${h.serverHostName}（${h.serverHostAddress}）`, value: h.id }))"
            @change="onServerHostChange(form.msServerHostId)" />
        </ReFormItem>
        <ReFormItem label="资产名称"><ReInput v-model="form.monitorName" placeholder="例如：prod-web-01" /></ReFormItem>
        <ReRow :gutter="20">
          <ReCol :span="12">
            <ReFormItem label="主机地址"><ReInput v-model="form.monitorHost" placeholder="192.168.1.100" /></ReFormItem>
          </ReCol>
          <ReCol :span="12">
            <ReFormItem label="端口"><ReInputNumber v-model="form.monitorPort" :min="1" :max="65535" controls-position="right" style="width:100%" /></ReFormItem>
          </ReCol>
        </ReRow>
        <ReRow :gutter="20">
          <ReCol :span="12">
            <ReFormItem label="服务类型">
              <ReSelect v-model="form.serviceType" style="width:100%"
                :data="[{ label: '服务器', value: 'SERVER' }, { label: 'Redis', value: 'REDIS' }, { label: 'MySQL', value: 'MYSQL' }, { label: 'PostgreSQL', value: 'PG' }, { label: 'Oracle', value: 'ORACLE' }, { label: 'MSSQL', value: 'MSSQL' }]" />
            </ReFormItem>
          </ReCol>
          <ReCol :span="12" v-if="form.serviceType === 'SERVER'">
            <ReFormItem label="系统类型">
              <ReSelect v-model="form.serverType" style="width:100%"
                :data="[{ label: 'Linux', value: 'LINUX' }, { label: 'Windows', value: 'WINDOWS' }, { label: 'macOS', value: 'MACOS' }]" />
            </ReFormItem>
          </ReCol>
        </ReRow>
        <ReFormItem label="分组"><ReInput v-model="form.monitorGroup" placeholder="例如：prod / test" /></ReFormItem>
        <ReFormItem label="描述"><ReInput v-model="form.monitorDescription" placeholder="资产备注说明" /></ReFormItem>
        <ReFormItem label="启用状态"><ReSwitch v-model="form.monitorEnabled" :active-value="1" :inactive-value="0" /></ReFormItem>
      </ReForm>
    </ReDialog>

    <ReCard layout="simple" :radius="14" :padding="0" shadow="never">
      <template #header>
        <div class="globe-head">
          <div class="globe-title-wrap">
            <ReIcon name="Earth" :size="18" />
            <span class="globe-title">资产分布</span>
          </div>
          <div class="globe-legend">
            <span v-for="g in legend" :key="g.label" class="legend-item">
              <span class="legend-dot" :style="{ background: g.color }"></span>
              {{ g.label }}: {{ g.count }}
            </span>
          </div>
        </div>
      </template>
      <div class="globe-body">
        <ReThree v-if="list.length" :height="220" :render="renderGlobe" :animate="animateGlobe" :auto-rotate="true" :auto-rotate-speed="0.3" />
      </div>
    </ReCard>
  </div>
</template>

<script setup lang="ts" name="ReAssetList">
import { ref, computed, onMounted, shallowRef } from 'vue'
import * as THREE from 'three'
import type { ReThreeContext } from '@repo/ui/re-three'
// ReStatCard 走 main.ts 全局注册（defineThemeComponent 的 component 导出是
// 主题异步加载器，直接 import 当组件用会渲染成 [object Promise]）
import { message } from '@repo/core'
import { getMonitors, saveMonitor, delMonitor, getAgentStatus, getServerHosts } from '../api'

const list = ref<any[]>([])
const agentStatusMap = ref<Record<number, { online: boolean; lastHeartbeat: string }>>({})
const loading = ref(false)
const showDialog = ref(false)
const editId = ref<number | null>(null)
const form = ref<any>({ monitorEnabled: 1, monitorPort: 22, serviceType: 'SERVER' })
const filters = ref({ keyword: '', serviceType: '', enabled: '' })
const serverHosts = ref<any[]>([])
const serverHostLoading = ref(false)

const cssPrimary = 'var(--el-color-primary)'
const cssSuccess = 'var(--el-color-success)'
const cssInfo = 'var(--el-color-info)'
const cssWarning = 'var(--el-color-warning)'

const serviceColorMap: Record<string, number> = {
  SERVER: 0x5b8def,
  REDIS: 0xf59e0b,
  MYSQL: 0x22c55e,
  PG: 0x06b6d4,
  ORACLE: 0xef4444,
  MSSQL: 0xa855f7,
}

const legend = computed(() => {
  const map: Record<string, number> = {}
  list.value.forEach(x => { map[x.serviceType || 'UNKNOWN'] = (map[x.serviceType || 'UNKNOWN'] || 0) + 1 } )
  return Object.entries(map).map(([type, count]) => ({
    label: type,
    count,
    color: '#' + (serviceColorMap[type] || 0x64748b).toString(16).padStart(6, '0'),
  }))
})

const globePoints = shallowRef<THREE.Points | null>(null)
const globeGroup = shallowRef<THREE.Group | null>(null)
const globeMesh = shallowRef<THREE.Mesh | null>(null)

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

const hashString = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) & 0xffffffff }
  return h
}

const renderGlobe = (ctx: ReThreeContext) => {
  const { scene, THREE } = ctx

  const grp = new THREE.Group()
  scene.add(grp)
  globeGroup.value = grp

  const R = 40
  const geo = new THREE.SphereGeometry(R * 0.99, 48, 32)
  const mat = new THREE.MeshPhongMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.85,
    wireframe: false,
  })
  const sphere = new THREE.Mesh(geo, mat)
  grp.add(sphere)

  const wireGeo = new THREE.SphereGeometry(R * 1.0, 24, 16)
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true, transparent: true, opacity: 0.2 })
  const wire = new THREE.Mesh(wireGeo, wireMat)
  grp.add(wire)

  const positions: Float32Array = new Float32Array(list.value.length * 3)
  const colors: Float32Array = new Float32Array(list.value.length * 3)

  list.value.forEach((item, i) => {
    const seed = hashString(item.monitorHost || `idx${i}`)
    const lat = ((seed % 140) - 70)
    const lon = ((seed * 13) % 360) - 180
    const col = serviceColorMap[item.serviceType] || 0x94a3b8
    const colV = new THREE.Color(col)
    const v = latLonToVec3(lat, lon, R)
    positions[i * 3] = v.x
    positions[i * 3 + 1] = v.y
    positions[i * 3 + 2] = v.z
    colors[i * 3] = colV.r
    colors[i * 3 + 1] = colV.g
    colors[i * 3 + 2] = colV.b
  })

  const dotGeo = new THREE.BufferGeometry()
  dotGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  dotGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const dotMat = new THREE.PointsMaterial({ size: 1.8, vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true })
  const dots = new THREE.Points(dotGeo, dotMat)
  grp.add(dots)
  globePoints.value = dots

  ctx.camera.position.set(0, 15, 120)
  ctx.camera.lookAt(0, 0, 0)
}

const animateGlobe = (ctx: ReThreeContext) => {
  if (globePoints.value) {
    const t = Date.now() * 0.001
    // material 可能为材质数组，统一收敛为单材质处理
    const mat = Array.isArray(globePoints.value.material)
      ? globePoints.value.material[0]
      : globePoints.value.material
    if (mat && 'opacity' in mat) {
      mat.opacity = 0.7 + Math.sin(t * 2) * 0.25
    }
  }
  if (globeGroup.value) {
    globeGroup.value.rotation.y += 0.001
  }
}

const summary = computed(() => [
  { label: '资产总数', value: list.value.length, color: cssPrimary },
  { label: '运行中', value: list.value.filter(r => r.monitorEnabled === 1).length, color: cssSuccess },
  { label: '已停用', value: list.value.filter(r => r.monitorEnabled === 0).length, color: cssInfo },
  { label: 'Redis', value: list.value.filter(r => r.serviceType === 'REDIS').length, color: cssWarning },
])

const filtered = computed(() => {
  let r = list.value
  if (filters.value.keyword) {
    const kw = filters.value.keyword.toLowerCase()
    r = r.filter(x => (x.monitorName || '').toLowerCase().includes(kw) || (x.monitorHost || '').toLowerCase().includes(kw))
  }
  if (filters.value.serviceType) r = r.filter(x => x.serviceType === filters.value.serviceType)
  if (filters.value.enabled !== '') r = r.filter(x => x.monitorEnabled === Number(filters.value.enabled))
  return r
})

const typeClass = (t: string) => {
  const map: Record<string, string> = { SERVER: 'blue', REDIS: 'orange', MYSQL: 'cyan', PG: 'green', ORACLE: 'red', MSSQL: 'purple' }
  return map[t] || 'gray'
}
const typeLabel = (t: string) => {
  const map: Record<string, string> = { SERVER: '服务器', REDIS: 'Redis', MYSQL: 'MySQL', PG: 'PostgreSQL', ORACLE: 'Oracle', MSSQL: 'MSSQL' }
  return map[t] || t
}

const fetchList = async () => {
  loading.value = true
  try {
    const [monitors, statusList] = await Promise.all([
      getMonitors(),
      getAgentStatus().catch(() => []),
    ])
    list.value = monitors ?? []
    // 按 monitorId 构建探针状态索引，供表格列合并显示
    const map: Record<number, { online: boolean; lastHeartbeat: string }> = {}
    for (const s of (statusList ?? [])) { map[s.monitorId] = { online: s.online, lastHeartbeat: s.lastHeartbeat } }
    agentStatusMap.value = map
  } catch (e: any) { message.error(e.message || '加载失败') }
  finally { loading.value = false }
}

const openAdd = () => { editId.value = null; form.value = { monitorEnabled: 1, monitorPort: 22, serviceType: 'SERVER', msServerHostId: null }; showDialog.value = true; loadServerHosts() }
const editRow = (row: any) => { editId.value = row.id; form.value = { ...row }; showDialog.value = true; loadServerHosts() }

async function loadServerHosts() {
  serverHostLoading.value = true
  try { serverHosts.value = await getServerHosts().catch(() => []) }
  finally { serverHostLoading.value = false }
}

/** 选择服务器主机后自动回填资产基础字段 */
function onServerHostChange(hostId: number | null) {
  if (!hostId) { form.value.monitorHost = ''; form.value.monitorPort = 22; form.value.serviceType = 'SERVER'; form.value.serverType = ''; return }
  const host = serverHosts.value.find((h: any) => h.id === hostId)
  if (host) {
    form.value.monitorName = host.serverHostName || form.value.monitorName
    form.value.monitorHost = host.serverHostAddress || ''
    form.value.monitorPort = host.serverHostPort || 22
    form.value.serviceType = 'SERVER'
    form.value.serverType = host.serverHostOsType || ''
  }
}

const handleSave = async () => {
  // editId 为 null 表示新增：必须传 null，不能 `|| 0`（0 会被判定成"更新 0 号"而走 PUT）
  try { await saveMonitor(editId.value, form.value); showDialog.value = false; await fetchList() }
  catch (e: any) { message.error(e.message || '保存失败') }
}

const handleDelete = async (id: number) => {
  try { await message.confirm('确认删除该资产？'); await delMonitor(id); await fetchList() }
  catch (e: any) { if (!e) return; message.error(e.message || '删除失败') }
}

onMounted(fetchList)
</script>

 <style scoped>
/* 本文件原先整套用 pages/monitor/src/styles/tokens.css 的私有令牌（--bg-* / --text-*
   / --border-subtle / --brand-500 / --status-* / --shadow-card* / --border-radius* /
   --focus-ring），而那份 tokens.css 只有 :root、没有暗色变体，暗色模式下这些值全部停留在亮色。
   已统一改走 EP 语义令牌；--metric-* 是各监控域的固定色相（需彼此可区分），保留不换。 */
/* 页面入场淡入：0.35s 刻意慢于微交互档（整块内容从下方 8px 升起，需要时间被看清），
   且 both 填充保证动画结束后停在终态，reduced-motion 下直接停掉不会留残影 */
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
/* 统计卡视觉与悬停由 ReStatCard 的 re-surface 基线提供，此处不再覆写 */
/* 3px 高的统计色条，圆角 2px 比 koi 最小档 4px 还小，用 EP 自带的 --el-border-radius-small。
   底色由模板 :style 传入（脚本里的 s.color），不属本文件令牌范围 */
.stat-bar {
  height: 3px;
  width: 32px;
  border-radius: var(--el-border-radius-small, 2px);
  margin-top: 6px;
  /* 进度条宽度过渡刻意慢于微交互档：命中率的数值变化要看得见，不套 fast 令牌 */
  transition: width 0.3s ease;
}

.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  /* 原为 var(--border-radius)（tokens.css 里是 10px），10px 距 8/12 等距，取 12px(lg) */
  border-radius: var(--el-radius-lg, 12px);
  /* koi 规约：容器静止态不加投影，边界改由这圈 1px 边框承载 */
  border: 1px solid var(--el-border-color-lighter);
  transition: box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
/* 允许的两处投影之一：悬浮抬升反馈 */
.filter-bar:hover { box-shadow: var(--el-box-shadow); }
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  border: 1px solid var(--el-border-color-lighter);
  /* 原为 var(--transition-base)（展开即 all 0.18s ease），显式列出真实会变的属性并取 0.2s 档 */
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.search-box:focus-within {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color);
}
.search-box input:focus-visible {
  outline: none;
  /* 原来用 var(--focus-ring)（写死的 rgba(22,124,255,.18) 靛蓝，不跟随主题主色），
     换成全站统一的主色浅混焦点环 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: var(--el-radius-xs, 4px);
}
.search-icon {
  width: 14px;
  height: 14px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.search-box input::placeholder { color: var(--el-text-color-placeholder); }
.filter-select { width: 140px; }
.filter-divider {
  width: 1px;
  height: 24px;
  background: var(--el-border-color-lighter);
}

.asset-table {
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  /* 原来只有 box-shadow: var(--shadow-card) 承载边界；按 koi 规约改成 1px 边框 */
  border: 1px solid var(--el-border-color-lighter);
}
.asset-table :deep(.el-table__header th) {
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-weight: 600;
  font-size: 12px;
  padding: 10px 12px;
}
.asset-table :deep(.el-table__row td) { padding: 9px 12px; }
.asset-table :deep(.el-table__row:hover) {
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent) !important;
}
.name-cell {
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 13px;
}
.dim { color: var(--el-text-color-secondary); font-size: 11.5px; }

.type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  /* 原为 3px，取最小档 4px */
  border-radius: var(--el-radius-xs, 4px);
}
/* --metric-* 是各监控域的固定色相，彼此需可区分，保留原色相 */
.type-tag.blue { color: var(--metric-cpu); }
.type-tag.orange { color: var(--metric-disk); }
.type-tag.cyan { color: var(--el-color-info); }
.type-tag.green { color: var(--el-color-success); }
.type-tag.red { color: var(--el-color-danger); }
.type-tag.purple { color: var(--metric-jvm); }
.type-tag.gray { color: var(--el-text-color-placeholder); }

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px;
  font-weight: 600;
}
.status-pill.on {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.status-pill.off {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.asset-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.globe-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.globe-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.globe-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.globe-legend { display: flex; gap: 12px; }
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
  display: inline-block;
}
.globe-body { width: 100%; }

@media (max-width: 768px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .filter-select { width: 100% !important; flex: 1 1 100%; }
  .globe-legend { flex-wrap: wrap; }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  /* 入场淡入可停：animation 用 both 填充，终态是完全不透明且无位移，停掉即直接呈现 */
  .fade-in {
    animation: none;
  }
  .filter-bar,
  .search-box {
    transition: none;
  }
  /* 统计色条的宽度过渡可停：宽度是脚本直接给的终值，动画只是让它平滑一下 */
  .stat-bar {
    transition: none;
  }
}
</style>
