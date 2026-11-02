<template>
  <div class="dtp">
    <!-- 头部：标题 + 统计 + 操作 -->
    <section class="dtp-head">
      <div class="dtp-head__left">
        <span class="dtp-head__icon"><el-icon><Grid /></el-icon></span>
        <div class="dtp-head__text">
          <h2 class="dtp-head__title">机房拓扑</h2>
          <p class="dtp-head__sub">由设备台账的 IP 网段与所属区域推导：区域 → 网段 → 设备 → 通道</p>
        </div>
      </div>
      <ul class="dtp-stats">
        <li v-for="s in stats" :key="s.key" class="dtp-stat">
          <span class="dtp-stat__value">{{ s.value }}</span>
          <span class="dtp-stat__label">{{ s.label }}</span>
        </li>
      </ul>
      <div class="dtp-head__ops">
        <label class="dtp-switch">
          <el-switch v-model="onlineOnly" size="small" />
          <span>只看在线</span>
        </label>
        <ReButton icon="RefreshRight" :show-text="true" :loading="loading" @click="load">刷新</ReButton>
        <ReButton icon="FullScreen" :show-text="true" :disabled="!visibleNodes.length" @click="fitView">适应画布</ReButton>
      </div>
    </section>

    <!-- 画布 -->
    <section class="dtp-canvas">
      <ReRelationGraph
        v-if="visibleNodes.length"
        ref="graphRef"
        class="dtp-graph"
        :nodes="graphNodes"
        :edges="graphEdges"
        layout="group"
        group-type="bubble"
        :group-visible="true"
        :minimap="visibleNodes.length > 40"
        :node-badge="false"
        :edge-arrow="true"
        :highlight="true"
        :toolbar="true"
        toolbar-variant="pill"
        toolbar-position="top-right"
        @node-click="onNodeClick"
      >
        <template #node-tooltip="{ node }">
          <div class="dtp-tip">
            <div class="dtp-tip__title">{{ node.label }}</div>
            <div class="dtp-tip__row">
              {{ node.data?.kindLabel || '节点' }} · {{ node.data?.group || '未分组' }}
            </div>
            <div v-if="node.data?.online === false" class="dtp-tip__row dtp-tip__row--warn">离线</div>
          </div>
        </template>
      </ReRelationGraph>
      <ReEmpty v-else :description="emptyText" />

      <!-- 区域图例 -->
      <div v-if="areas.length" class="dtp-legend">
        <span v-for="area in areas" :key="area" class="dtp-legend__item" :title="area">
          <i class="dtp-legend__dot" :style="{ background: groupColorOf(area, GROUP_PALETTE) }" />
          <span class="dtp-legend__name">{{ area }}</span>
        </span>
      </div>

      <!-- 选中节点详情 -->
      <aside v-if="active" class="dtp-detail">
        <header class="dtp-detail__head">
          <span class="dtp-detail__kind">{{ KIND_LABELS[kindOf(active.id)] }}</span>
          <span class="dtp-detail__name" :title="active.label">{{ active.label || active.id }}</span>
          <el-icon class="dtp-detail__close" title="关闭" @click="activeId = ''"><Close /></el-icon>
        </header>
        <dl class="dtp-detail__rows">
          <div class="dtp-detail__row">
            <dt>区域</dt>
            <dd>{{ active.group || '未分组' }}</dd>
          </div>
          <div class="dtp-detail__row">
            <dt>上级</dt>
            <dd>{{ prevText }}</dd>
          </div>
          <div class="dtp-detail__row">
            <dt>下级</dt>
            <dd>{{ nextText }}</dd>
          </div>
          <div v-if="active.online != null" class="dtp-detail__row">
            <dt>状态</dt>
            <dd>
              <ReTag :type="active.online ? 'success' : 'info'" size="small" effect="plain">
                {{ active.online ? '在线' : '离线' }}
              </ReTag>
            </dd>
          </div>
        </dl>
        <div class="dtp-detail__ops">
          <ReButton icon="Aim" :show-text="true" size="small" @click="focusNode(active.id)">定位</ReButton>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 机房拓扑 —— 区域 → 网段 → 设备 → 通道 的四级视图。
 *
 * 数据来自 device-starter 的 `GET /api/device/topology`：
 *   - 节点：`{ id, label, group, type, size, online }`，id 带类型前缀
 *     （area: / subnet: / device: / channel:），前端按前缀区分层级；
 *   - 边：`{ source, target }`，区域 → 网段 → 设备 → 通道。
 *
 * 渲染复用 `@repo/ui` 的 ReRelationGraph（G6 内核，group 布局 + bubble 轮廓）：
 *   - `group` 取区域名，同区节点同色并落进同一个气泡；
 *   - 离线设备（及其通道）置灰，`只看在线` 过滤掉它们与悬空的边；
 *   - 点击节点在右下角浮出详情（区域 / 上级 / 下级 / 联机态）并可定位镜头。
 *
 * 拓扑不落库：完全由设备台账的 IP 与区域现场推导，台账一改刷新即变。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from 'vue'
import { Close, Grid } from '@element-plus/icons-vue'

import ReButton from '@repo/ui/re-button'
import ReEmpty from '@repo/ui/re-empty'
import ReRelationGraph, { GROUP_PALETTE, groupColorOf } from '@repo/ui/re-relation-graph'
import type { RelationEdge, RelationNode } from '@repo/ui/re-relation-graph'
import ReTag from '@repo/ui/re-tag'
import { message } from '@repo/core'

import { deviceApi } from '../api/deviceApi'
import type { TopologyNode } from '../types/device'

/** 节点层级（由 id 前缀判定） */
type NodeKind = 'area' | 'subnet' | 'device' | 'channel'

/** 层级 → 中文名 */
const KIND_LABELS: Record<NodeKind, string> = {
  area: '区域',
  subnet: '网段',
  device: '设备',
  channel: '通道',
}

/** 离线节点填充色（覆盖分组配色） */
const OFFLINE_FILL = '#d5d7da'

/** id 前缀 → 层级（id 缺失时按设备处理，避免脏数据把画布打挂） */
function kindOf(id: string | null | undefined): NodeKind {
  const text = String(id ?? '')
  if (text.startsWith('area:')) return 'area'
  if (text.startsWith('subnet:')) return 'subnet'
  if (text.startsWith('channel:')) return 'channel'
  return 'device'
}

const rawNodes = ref<TopologyNode[]>([])
const rawEdges = ref<{ source: string; target: string; label?: string }[]>([])
const loading = ref(false)
/** 只看在线：隐藏离线设备（及其通道）与悬空的边 */
const onlineOnly = ref(false)
/** 当前选中节点 id（空 = 不展开详情） */
const activeId = ref('')
/** 画布实例（ReRelationGraph 暴露的 fitView / focus） */
const graphRef = ref<unknown>(null)

/**
 * 视图限制：由设备台账右键的「在拓扑中查看」投递（按分组 / 厂商 / 设备）。
 *
 * <p>拓扑接口本身不接收过滤条件，这里在图上做一次「设备 + 地址链」闭包：
 * 保留被限制的设备、它上方的区域 / 网段，以及它下方的通道。</p>
 */
const props = defineProps<{
  filter?: { kind: 'group' | 'vendor' | 'device'; id: string } | null
}>()

/** 视图限制命中的拓扑设备节点 id（device:&lt;deviceId&gt;） */
const restricted = ref<Set<string>>(new Set())

/** 视图限制的保留集：设备 + 地址链（网段 / 区域）+ 通道 */
const keepSet = computed<Set<string>>(() => {
  const ids = new Set<string>()
  const parents = new Map<string, string[]>()
  const children = new Map<string, string[]>()
  for (const edge of rawEdges.value) {
    if (!parents.has(edge.target)) parents.set(edge.target, [])
    parents.get(edge.target)!.push(edge.source)
    if (!children.has(edge.source)) children.set(edge.source, [])
    children.get(edge.source)!.push(edge.target)
  }
  /** 向上收口：设备 → 网段 → 区域 */
  const walkUp = (id: string) => {
    const stack = [id]
    while (stack.length) {
      const cur = stack.pop()!
      if (ids.has(cur)) continue
      ids.add(cur)
      for (const parent of parents.get(cur) || []) stack.push(parent)
    }
  }
  /** 向下收口：设备 → 通道（设备本身可能已被 walkUp 收进来，单独用一个 seen 防环） */
  const walkDown = (id: string) => {
    const stack = [id]
    const seen = new Set<string>()
    while (stack.length) {
      const cur = stack.pop()!
      ids.add(cur)
      if (seen.has(cur)) continue
      seen.add(cur)
      for (const child of children.get(cur) || []) stack.push(child)
    }
  }
  for (const deviceId of restricted.value) {
    walkUp(deviceId)
    walkDown(deviceId)
  }
  return ids
})

/** 把视图限制换算成拓扑里的设备节点 id（分组 → 组成员，厂商 → 厂商设备） */
async function resolveRestricted(): Promise<void> {
  const query = props.filter
  if (!query) {
    restricted.value = new Set()
    return
  }
  try {
    let deviceIds: string[] = []
    if (query.kind === 'device') {
      deviceIds = [query.id]
    } else if (query.kind === 'group') {
      deviceIds = ((await deviceApi.groupDevices(query.id)) || []).map((item) => item.deviceInfoId)
    } else {
      const page = await deviceApi.page({ vendor: query.id, pageNo: 1, pageSize: 2000 })
      deviceIds = (page?.data || []).map((item) => item.deviceInfoId)
    }
    restricted.value = new Set(
      deviceIds.filter(Boolean).map((id) => `device:${id}`)
    )
  } catch {
    restricted.value = new Set()
  }
}

/**
 * 过滤后的节点：`只看在线` 时只留在线设备及其通道，并保留承载它们的网段与区域
 * （自下而上收一轮，避免留下没有设备的气泡）。
 */
const visibleNodes = computed<TopologyNode[]>(() => {
  // 脏数据兜底：没有 id 的节点直接丢掉（否则 Set / 画布都会带上 undefined）
  let base = rawNodes.value.filter((node) => !!node.id)
  // 视图限制（按分组 / 厂商 / 设备）：只留命中的设备及其地址链与通道
  if (restricted.value.size) base = base.filter((node) => keepSet.value.has(node.id))
  if (!onlineOnly.value) return base
  const keep = new Set<string>()
  for (const node of base) {
    const kind = kindOf(node.id)
    if ((kind === 'device' || kind === 'channel') && node.online !== false) {
      keep.add(node.id)
    }
  }
  // 网段：下面还有可见设备才留
  for (const edge of rawEdges.value) {
    if (keep.has(edge.target) && kindOf(edge.source) === 'subnet') {
      keep.add(edge.source)
    }
  }
  // 区域：下面还有可见网段或设备才留
  for (const edge of rawEdges.value) {
    if (keep.has(edge.target) && kindOf(edge.source) === 'area') {
      keep.add(edge.source)
    }
  }
  return base.filter((node) => keep.has(node.id))
})

/** 画布节点：补 group 兜底、离线置灰、带上层级给 tooltip 用 */
const graphNodes = computed<RelationNode[]>(() =>
  visibleNodes.value.map((node) => {
    const kind = kindOf(node.id)
    const offline = node.online === false
    return {
      id: node.id,
      label: node.label || node.id,
      group: node.group || '未分组',
      type: node.type || (kind === 'area' ? 'rect' : 'circle'),
      size: node.size,
      data: { kind, kindLabel: KIND_LABELS[kind], group: node.group || '未分组', online: node.online },
      ...(offline ? { style: { fill: OFFLINE_FILL, stroke: OFFLINE_FILL } } : {}),
    } as RelationNode
  }),
)

/** 画布边：丢掉两端不在可见集合里的悬空边，并显式给 id 防重复 */
const graphEdges = computed<RelationEdge[]>(() => {
  const ids = new Set(visibleNodes.value.map((node) => node.id))
  return rawEdges.value
    .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
    .map((edge) => ({
      id: `${edge.source}->${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
    }))
})

/** 区域清单（按画布上首次出现的顺序，用于图例） */
const areas = computed<string[]>(() => {
  const names: string[] = []
  for (const node of visibleNodes.value) {
    const group = node.group || '未分组'
    if (!names.includes(group)) names.push(group)
  }
  return names
})

/** 空状态文案（区分「真没设备」与「被只看在线过滤空」） */
const emptyText = computed(() => {
  const base = restricted.value.size
    ? rawNodes.value.filter((node) => keepSet.value.has(node.id))
    : rawNodes.value
  if (!base.length) {
    return props.filter
      ? '当前视图下没有可拓扑的设备：设备可能缺少 IP 或区域'
      : '还没有可拓扑的设备：先到设备台账接入设备，并补充 IP 与区域'
  }
  return '当前没有在线设备：关掉「只看在线」可以查看全部设备'
})

/** 顶部统计 */
const stats = computed(() => {
  const base = restricted.value.size
    ? rawNodes.value.filter((node) => keepSet.value.has(node.id))
    : rawNodes.value
  const countOf = (kind: NodeKind) => base.filter((node) => kindOf(node.id) === kind).length
  const devices = base.filter((node) => kindOf(node.id) === 'device')
  const online = devices.filter((node) => node.online === true).length
  return [
    { key: 'area', label: '区域', value: countOf('area') },
    { key: 'subnet', label: '网段', value: countOf('subnet') },
    { key: 'device', label: '设备', value: devices.length },
    { key: 'channel', label: '通道', value: countOf('channel') },
    {
      key: 'online',
      label: '在线率',
      value: devices.length ? `${Math.round((online / devices.length) * 100)}%` : '-',
    },
  ]
})

/** 当前选中节点 */
const active = computed<TopologyNode | null>(
  () => visibleNodes.value.find((node) => node.id === activeId.value) || null,
)

/** 节点 id → 展示名 */
function nameOf(id: string): string {
  return visibleNodes.value.find((node) => node.id === id)?.label || id
}

/** 选中节点的上级名称 */
const prevNames = computed<string[]>(() => {
  const current = active.value
  if (!current) return []
  return graphEdges.value.filter((edge) => edge.target === current.id).map((edge) => nameOf(String(edge.source)))
})

/** 选中节点的下级名称 */
const nextNames = computed<string[]>(() => {
  const current = active.value
  if (!current) return []
  return graphEdges.value.filter((edge) => edge.source === current.id).map((edge) => nameOf(String(edge.target)))
})

/** 名称列表 → 一行文本（超出 4 个折叠成「等 N 个」） */
function joinNames(names: string[]): string {
  if (!names.length) return '—'
  const head = names.slice(0, 4).join('、')
  return names.length > 4 ? `${head} 等 ${names.length} 个` : head
}
const prevText = computed(() => joinNames(prevNames.value))
const nextText = computed(() => joinNames(nextNames.value))

/** 画布命令：定位到某个节点（含 1 度邻居） */
function focusNode(id: string): void {
  const api = graphRef.value as { focus?: (ids: string[]) => void } | null
  api?.focus?.([id])
}

/** 画布命令：整图适应视口 */
function fitView(): void {
  const api = graphRef.value as { fitView?: () => void } | null
  api?.fitView?.()
}

/** 点击节点：记录选中，右下角浮出详情 */
function onNodeClick(detail: { id: string }): void {
  activeId.value = detail?.id || ''
}

async function load(): Promise<void> {
  loading.value = true
  try {
    await resolveRestricted()
    const data = await deviceApi.topology()
    rawNodes.value = data?.nodes || []
    rawEdges.value = data?.edges || []
    // 选中的节点在刷新后可能已不存在，清掉避免详情一直挂着
    if (activeId.value && !rawNodes.value.some((node) => node.id === activeId.value)) {
      activeId.value = ''
    }
  } catch (err) {
    rawNodes.value = []
    rawEdges.value = []
    message.error('加载机房拓扑失败：' + errorText(err))
  } finally {
    loading.value = false
  }
}

function errorText(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (err as Error)?.message
    || '未知错误'
}

onMounted(load)
</script>

<style scoped>
.dtp {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 0 12px;
  min-height: 100%;
  color: var(--el-text-color-primary);
}

/* ---- 头部 ---- */
.dtp-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.dtp-head__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dtp-head__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border-radius: var(--el-radius-base, 8px);
}
.dtp-head__text {
  min-width: 0;
}
.dtp-head__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}
.dtp-head__sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dtp-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dtp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 44px;
}
.dtp-stat__value {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.dtp-stat__label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.dtp-head__ops {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.dtp-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
}

/* ---- 画布 ---- */
.dtp-canvas {
  position: relative;
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dtp-graph {
  flex: 1;
  min-width: 0;
  min-height: 520px;
}

.dtp-tip {
  font-size: 12px;
  line-height: 1.6;
}
.dtp-tip__title {
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 600;
}
.dtp-tip__row {
  color: var(--el-text-color-secondary);
}
.dtp-tip__row--warn {
  color: var(--el-color-warning);
}

/* ---- 图例 ---- */
.dtp-legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  max-width: 46%;
  max-height: 96px;
  overflow-y: auto;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 8px);
  backdrop-filter: blur(4px);
  pointer-events: auto;
}
.dtp-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 160px;
}
.dtp-legend__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dtp-legend__name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---- 选中详情 ---- */
.dtp-detail {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 260px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  backdrop-filter: blur(4px);
}
.dtp-detail__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.dtp-detail__kind {
  flex: none;
  padding: 1px 6px;
  font-size: 11px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: 4px;
}
.dtp-detail__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.dtp-detail__close {
  flex: none;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.dtp-detail__close:hover {
  color: var(--el-color-primary);
}
.dtp-detail__rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  font-size: 12px;
}
.dtp-detail__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.dtp-detail__row dt {
  flex: none;
  width: 32px;
  color: var(--el-text-color-secondary);
}
.dtp-detail__row dd {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
}
.dtp-detail__ops {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
