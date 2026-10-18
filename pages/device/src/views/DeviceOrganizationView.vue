<template>
  <div class="dor">
    <!-- 概览指标 -->
    <section class="dor-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- 筛选与操作 -->
    <section class="dor-filter">
      <div class="dor-field dor-field--search">
        <ReInput v-model="keyword" placeholder="搜索组织名称..." clearable prefix-icon="Search" />
      </div>
      <div class="dor-field">
        <ReSelect
          v-model="filters.vendor"
          placeholder="全部厂商"
          clearable
          :options="vendorOptions"
          @change="fetchTree"
        />
      </div>
      <span class="dor-filter__meta">
        {{ orgs.length }} 个节点 · {{ devices.length }} 台设备
      </span>
      <div class="dor-ops">
        <ReButton icon="Sort" layout="square" :tip="expandAll ? '全部收起' : '全部展开'" @click="toggleExpand" />
        <ReButton icon="RefreshRight" layout="square" tip="刷新组织" :loading="loading" @click="fetchTree" />
        <ReButton icon="Share" :show-text="true" type="primary" :loading="syncing" @click="onSync">
          同步组织
        </ReButton>
      </div>
    </section>

    <div class="dor-body">
      <!-- 组织架构树 -->
      <section class="dor-panel dor-panel--fill dor-tree">
        <header class="dor-panel__head">
          <span class="dor-panel__bar" />
          <span>组织架构</span>
          <span class="dor-panel__count">{{ rootCount }} 个根节点</span>
        </header>

        <div v-if="loadError" class="dor-error">
          <span>{{ loadError }}</span>
          <ReButton icon="RefreshRight" layout="square" tip="重试" :loading="loading" @click="fetchTree" />
        </div>

        <el-tree
          v-if="tree.length"
          ref="treeRef"
          :key="`org-tree-${expandAll}`"
          :data="tree"
          :props="TREE_PROPS"
          node-key="deviceOrganizationId"
          :filter-node-method="filterNode"
          :default-expand-all="expandAll"
          :expand-on-click-node="false"
          highlight-current
          class="dor-tree__el"
          @node-click="onSelectNode"
        >
          <template #default="{ data }">
            <span class="dor-node">
              <span class="dor-node__name">{{ data.deviceOrganizationName }}</span>
              <span v-if="deviceCountOf(data)" class="dor-node__count">{{ deviceCountOf(data) }}</span>
            </span>
          </template>
        </el-tree>

        <article v-else class="dor-ghost">
          <span class="dor-ghost__icon"><el-icon><OfficeBuilding /></el-icon></span>
          <p class="dor-ghost__title">暂无组织节点</p>
          <p class="dor-ghost__desc">
            组织由厂商侧下发，点「同步组织」把厂商的组织架构拉过来；没接平台账号时该列表为空。
          </p>
        </article>
      </section>

      <!-- 选中节点详情 -->
      <section class="dor-panel dor-panel--fill dor-detail">
        <header class="dor-panel__head">
          <span class="dor-panel__bar" />
          <span>节点详情</span>
          <span v-if="current" class="dor-panel__count">{{ current.deviceOrganizationName }}</span>
        </header>

        <template v-if="current">
          <div class="dor-meta">
            <div class="dor-meta__item">
              <span class="dor-meta__label">厂商</span>
              <span class="dor-meta__value">{{ current.deviceOrganizationVendor || '—' }}</span>
            </div>
            <div class="dor-meta__item">
              <span class="dor-meta__label">节点 ID</span>
              <span class="dor-meta__value dor-mono">{{ current.deviceOrganizationId }}</span>
            </div>
            <div class="dor-meta__item">
              <span class="dor-meta__label">上级节点</span>
              <span class="dor-meta__value">{{ current.deviceOrganizationParentId || '（根节点）' }}</span>
            </div>
            <div class="dor-meta__item">
              <span class="dor-meta__label">组织路径</span>
              <span class="dor-meta__value">{{ current.deviceOrganizationPath || '—' }}</span>
            </div>
            <div class="dor-meta__item">
              <span class="dor-meta__label">下级节点</span>
              <span class="dor-meta__value">{{ childrenCount }} 个</span>
            </div>
            <div class="dor-meta__item">
              <span class="dor-meta__label">含下级设备</span>
              <span class="dor-meta__value">{{ subtreeDevices.length }} 台</span>
            </div>
          </div>

          <div class="dor-devices">
            <span class="dor-devices__title">该节点（含下级）的设备</span>
            <div v-if="subtreeDevices.length" class="dor-devices__list">
              <article v-for="d in subtreeDevices" :key="d.deviceInfoId" class="dor-device">
                <span class="dor-device__icon">
                  <el-icon><component :is="categoryIcon(d.deviceInfoCategory)" /></el-icon>
                </span>
                <div class="dor-device__text">
                  <span class="dor-device__name">{{ d.deviceInfoName || d.deviceInfoId }}</span>
                  <span class="dor-device__meta">{{ d.deviceInfoIp || '无 IP' }} · {{ d.deviceInfoVendor || '未知厂商' }}</span>
                </div>
                <ReTag :type="d.deviceInfoOnline ? 'success' : 'info'" size="small" effect="plain">
                  {{ d.deviceInfoOnline ? '在线' : '离线' }}
                </ReTag>
              </article>
            </div>
            <span v-else class="dor-devices__none">该组织下暂无设备</span>
          </div>
        </template>

        <article v-else class="dor-ghost dor-ghost--small">
          <span class="dor-ghost__icon"><el-icon><Position /></el-icon></span>
          <p class="dor-ghost__title">选中左侧节点查看详情</p>
          <p class="dor-ghost__desc">节点下的设备按组织归属统计，只读展示。</p>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备组织 —— 厂商侧组织架构与组织内设备。
 *
 * 数据来自 device-starter 的 `/api/device`：
 *   - GET  /org/tree?vendor=  组织树（扁平节点，parentId 建树）
 *   - POST /org/sync          触发厂商侧组织同步
 *   - GET  /list?orgId=       设备台账（按 deviceInfoOrgId 归属统计）
 *
 * 组织由厂商侧下发，本页只读：建树、按名称检索、统计每级设备数，
 * 不做增删改（后端也确实没有组织 CRUD）。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { AlarmClock, ChatDotRound, Lock, OfficeBuilding, Position, Share, VideoCamera } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import ReStatCard from '@repo/ui/re-stat-card'
import ReTag from '@repo/ui/re-tag'

import deviceApi from '@/api/deviceApi'
import type { DeviceCategory, DeviceInfo } from '@/types/device'

/** 组织节点（厂商侧下发，扁平结构） */
interface DeviceOrganization {
  deviceOrganizationId: string
  deviceOrganizationParentId?: string
  deviceOrganizationName: string
  deviceOrganizationPath?: string
  deviceOrganizationVendor?: string
}

/** 树节点：补 children 与可检索的扁平文本 */
interface OrgTreeNode extends DeviceOrganization {
  searchText: string
  children: OrgTreeNode[]
}

const TREE_PROPS = { children: 'children', label: 'deviceOrganizationName' }

/** 大类 → 图标 */
const CATEGORY_ICONS: Record<string, unknown> = {
  camera: VideoCamera,
  accessControl: Lock,
  alarm: AlarmClock,
  intercom: ChatDotRound,
}

const orgs = ref<DeviceOrganization[]>([])
const devices = ref<DeviceInfo[]>([])
const tree = ref<OrgTreeNode[]>([])
const loading = ref(false)
const syncing = ref(false)
const loadError = ref('')
const expandAll = ref(true)

const keyword = ref('')
const filters = reactive({ vendor: '' })
const current = ref<OrgTreeNode | null>(null)
const treeRef = ref<{ filter: (v: string) => void; setCurrentKey: (k?: string) => void } | null>(null)

const vendorOptions = computed(() => {
  const set = new Set<string>()
  orgs.value.forEach((o) => o.deviceOrganizationVendor && set.add(o.deviceOrganizationVendor))
  return [...set].sort().map((v) => ({ value: v, label: v }))
})

/** 各节点（含下级）的设备数 */
const deviceCountByOrg = computed(() => {
  const direct = new Map<string, number>()
  devices.value.forEach((d) => {
    if (!d.deviceInfoOrgId) return
    direct.set(d.deviceInfoOrgId, (direct.get(d.deviceInfoOrgId) || 0) + 1)
  })
  const total = new Map<string, number>()
  const walk = (n: OrgTreeNode): number => {
    const n_ = direct.get(n.deviceOrganizationId) || 0
    const sum = (n.children || []).reduce((acc, c) => acc + walk(c), n_)
    total.set(n.deviceOrganizationId, sum)
    return sum
  }
  tree.value.forEach(walk)
  return total
})

const rootCount = computed(() => tree.value.length)

const leafCount = computed(() => {
  let n = 0
  const walk = (list: OrgTreeNode[]) => {
    list.forEach((x) => (x.children?.length ? walk(x.children) : (n += 1)))
  }
  walk(tree.value)
  return n
})

const maxDepth = computed(() => {
  const depth = (n: OrgTreeNode): number => 1 + (n.children?.length ? Math.max(...n.children.map(depth)) : 0)
  return tree.value.length ? Math.max(...tree.value.map(depth)) : 0
})

const childrenCount = computed(() => current.value?.children?.length || 0)

/** 选中节点及其下级的设备 */
const subtreeDevices = computed(() => {
  if (!current.value) return []
  const ids = new Set<string>()
  const walk = (n: OrgTreeNode) => {
    ids.add(n.deviceOrganizationId)
    ;(n.children || []).forEach(walk)
  }
  walk(current.value)
  return devices.value.filter((d) => ids.has(d.deviceInfoOrgId))
})

const kpis = computed(() => [
  {
    key: 'total',
    title: '组织节点',
    value: orgs.value.length,
    desc: `根节点 ${rootCount.value} 个`,
    icon: OfficeBuilding,
    iconColor: 'var(--el-color-primary)',
  },
  {
    key: 'vendor',
    title: '接入厂商',
    value: vendorOptions.value.length,
    desc: vendorOptions.value.map((v) => v.value).join(' / ') || '—',
    icon: Share,
    iconColor: 'var(--el-color-info)',
  },
  {
    key: 'leaf',
    title: '末级节点',
    value: leafCount.value,
    desc: `最大层级 ${maxDepth.value} 层`,
    icon: Position,
    iconColor: 'var(--el-color-success)',
  },
  {
    key: 'device',
    title: '纳入设备',
    value: devices.value.length,
    desc: '按组织归属统计',
    icon: VideoCamera,
    iconColor: 'var(--metric-disk, var(--el-color-warning))',
  },
])

function categoryIcon(category?: DeviceCategory): unknown {
  return CATEGORY_ICONS[category || ''] || VideoCamera
}

function deviceCountOf(node: OrgTreeNode): number {
  return deviceCountByOrg.value.get(node.deviceOrganizationId) || 0
}

/** 扁平列表 → 树。parentId 指向不存在的节点（厂商脏数据）时挂到根，避免整支丢失 */
function buildTree(list: DeviceOrganization[]): OrgTreeNode[] {
  const nodes = new Map<string, OrgTreeNode>()
  list.forEach((o) => {
    nodes.set(o.deviceOrganizationId, {
      ...o,
      deviceOrganizationName: o.deviceOrganizationName || o.deviceOrganizationId,
      searchText: '',
      children: [],
    })
  })

  const roots: OrgTreeNode[] = []
  list.forEach((o) => {
    const node = nodes.get(o.deviceOrganizationId)!
    const parent = o.deviceOrganizationParentId ? nodes.get(o.deviceOrganizationParentId) : undefined
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  })

  // 自底向上累加 searchText，父节点也能命中子节点名称
  const collect = (n: OrgTreeNode): string => {
    const kids = n.children.map(collect).join(' ')
    n.searchText = `${n.deviceOrganizationName} ${kids}`
    return n.searchText
  }
  roots.forEach(collect)

  return roots
}

function filterNode(value: string, data: OrgTreeNode): boolean {
  if (!value) return true
  return data.searchText.toLowerCase().includes(value.toLowerCase())
}

async function fetchTree(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const [orgList, deviceList] = await Promise.all([
      deviceApi.getOrgTree(filters.vendor || undefined) as Promise<DeviceOrganization[]>,
      deviceApi.list() as Promise<DeviceInfo[]>,
    ])
    orgs.value = orgList || []
    devices.value = deviceList || []
    tree.value = buildTree(orgs.value)
    // 树重建后原选中节点可能已不存在，避免详情区留在过期数据上
    const keepId = current.value?.deviceOrganizationId
    current.value = keepId
      ? findNode(tree.value, keepId)
      : (tree.value[0] ?? null)
    if (current.value) treeRef.value?.setCurrentKey(current.value.deviceOrganizationId)
    if (keyword.value) treeRef.value?.filter(keyword.value)
  } catch (e: unknown) {
    orgs.value = []
    devices.value = []
    tree.value = []
    current.value = null
    loadError.value = errText(e)
    ElMessage.error(`组织架构加载失败：${loadError.value}`)
  } finally {
    loading.value = false
  }
}

function findNode(list: OrgTreeNode[], id: string): OrgTreeNode | null {
  for (const n of list) {
    if (n.deviceOrganizationId === id) return n
    const hit = findNode(n.children, id)
    if (hit) return hit
  }
  return null
}

/** 触发厂商侧组织同步 */
async function onSync(): Promise<void> {
  syncing.value = true
  try {
    await deviceApi.syncOrg()
    ElMessage.success('组织同步已触发')
    await fetchTree()
  } catch (e: unknown) {
    ElMessage.error(`组织同步失败：${errText(e)}`)
  } finally {
    syncing.value = false
  }
}

function onSelectNode(data: OrgTreeNode): void {
  current.value = data
}

function toggleExpand(): void {
  expandAll.value = !expandAll.value
  // default-expand-all 只在初始化生效：换 key 重建树后把当前选中节点补回来
  nextTick(() => {
    if (current.value) treeRef.value?.setCurrentKey(current.value.deviceOrganizationId)
    if (keyword.value) treeRef.value?.filter(keyword.value)
  })
}

function errText(e: unknown): string {
  return (e as { msg?: string })?.msg || (e instanceof Error ? e.message : String(e))
}

watch(keyword, (v) => treeRef.value?.filter(v))

onMounted(fetchTree)
</script>

<style scoped>
.dor {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 12px 12px;
  /* 高度够就吃满剩余空间（树与详情内滚），不够就自然撑开让主区滚动 */
  min-height: 100%;
  color: var(--el-text-color-primary);
}

.dor-kpis {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.dor-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dor-field {
  width: 160px;
}
.dor-field--search {
  width: 240px;
}
.dor-field :deep(.el-input),
.dor-field :deep(.el-select) {
  width: 100%;
}
.dor-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dor-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
@media (max-width: 1100px) {
  .dor-field,
  .dor-field--search {
    width: 100%;
  }
  .dor-filter__meta {
    margin-left: 0;
  }
  .dor-ops {
    padding-left: 0;
    border-left: none;
  }
}

.dor-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 14px;
}
@media (max-width: 1100px) {
  .dor-body {
    grid-template-columns: 1fr;
  }
}

.dor-panel {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dor-panel--fill {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.dor-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dor-panel__bar {
  width: 6px;
  height: 16px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.dor-panel__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.dor-panel__ops {
  margin-left: auto;
}

.dor-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: var(--el-radius-base, 8px);
}

.dor-tree__el {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: transparent;
  --el-tree-node-hover-bg-color: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}
.dor-tree__el :deep(.el-tree-node__content) {
  height: 34px;
  border-radius: var(--el-radius-base, 8px);
}
.dor-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  overflow: hidden;
}
.dor-node__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dor-node__count {
  margin-left: auto;
  padding: 0 7px;
  font-size: 11.5px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-text-color-primary) 8%, transparent);
  border-radius: 999px;
}

.dor-meta {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 16px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
  border-radius: var(--el-radius-lg, 12px);
}
.dor-meta__item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.dor-meta__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dor-meta__value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dor-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12.5px;
}

.dor-devices {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dor-devices__title {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dor-devices__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
}
.dor-device {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.dor-device__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-radius: var(--el-radius-base, 8px);
}
.dor-device__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.dor-device__name {
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dor-device__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dor-devices__none {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.dor-ghost {
  flex: 1;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 22px;
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
}
.dor-ghost--small {
  min-height: 120px;
}
.dor-ghost__icon {
  font-size: 30px;
  color: var(--el-text-color-placeholder);
}
.dor-ghost__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.dor-ghost__desc {
  margin: 0;
  max-width: 420px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
