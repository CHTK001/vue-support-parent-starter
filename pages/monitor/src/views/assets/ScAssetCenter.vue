<template>
  <div class="asset-center fade-in">
    <!-- 概览 -->
    <!-- layout="stacked"：图标插槽是 32x3px 横向色条，为竖排设计，详见 ScAssetList 同处注释。 -->
    <div class="summary-row">
      <ReStatCard
        size="compact"
        layout="stacked"
        v-for="s in summary"
        :key="s.label"
        :title="s.label"
        :value="s.value"
        :icon-color="s.color"
      >
        <template #value><ReCountup :value="s.value" :duration="600" /></template>
        <template #icon>
          <div class="stat-bar" :style="{ background: s.color }"></div>
        </template>
      </ReStatCard>
    </div>

    <!-- 筛选 -->
    <ReCard layout="simple" :radius="12" :padding="14" shadow="never">
      <div class="filter-bar">
        <div class="search-box">
          <ReIcon class="search-icon" name="Search" :size="14" />
          <input v-model="filters.keyword" placeholder="搜索名称 / 地址 / 序列号…" @keyup.enter="fetchList" />
        </div>
        <ReSelect
          v-model="filters.assetType"
          placeholder="资产大类"
          class="filter-select"
          clearable
          :data="typeOptions"
          @change="fetchList"
        />
        <ReSelect
          v-model="filters.online"
          placeholder="在线状态"
          class="filter-select"
          clearable
          :data="[{ label: '在线', value: '1' }, { label: '离线', value: '0' }]"
        />
        <span class="filter-divider"></span>
        <span class="filter-hint">共 {{ filtered.length }} 项</span>
        <ReButton show-text icon="RefreshLeft" plain @click="fetchList">刷新</ReButton>
      </div>
    </ReCard>

    <!-- 资产列表 -->
    <ReTable
      :data="filtered"
      :loading="loading"
      border
      stripe
      class="asset-table"
      :pagination="false"
      :toolbar="false"
      empty-text="暂无资产"
    >
      <ReTableColumn label="大类" width="90" align="center">
        <template #default="{ row }">
          <ReTag :class="['type-tag', row.assetType === 'HOST' ? 'blue' : 'purple']" effect="plain" >
            {{ row.assetType === 'HOST' ? '主机' : '设备' }}
          </ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="name" label="资产名称" min-width="170">
        <template #default="{ row }">
          <span class="name-cell">{{ row.name || '—' }}</span>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="address" label="地址" min-width="140">
        <template #default="{ row }">
          <span v-if="row.address">{{ row.address }}</span>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="端口" width="80" align="center">
        <template #default="{ row }">
          <span v-if="row.port">{{ row.port }}</span>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="分类" width="110" align="center">
        <template #default="{ row }">
          <span v-if="row.categoryLabel">{{ row.categoryLabel }}</span>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="厂商 / 分组" width="110" align="center">
        <template #default="{ row }">
          <span v-if="row.assetType === 'DEVICE'">{{ vendorLabel(row.vendor) }}</span>
          <span v-else-if="row.groupId" class="dim">#{{ row.groupId }}</span>
          <span v-else class="dim">—</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="状态" width="90" align="center">
        <template #default="{ row }">
          <span :class="['status-pill', row.online ? 'on' : 'off']">{{ row.online ? '在线' : '离线' }}</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="100" fixed="right" align="right">
        <template #default="{ row }">
          <ReButton link @click="openDetail(row)">详情</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <!-- 资产详情 -->
    <ReDialog
      v-model="showDetail"
      :title="detailTitle"
      width="820"
      :height="640"
      destroy-on-close
      compact
      @cancel="showDetail = false"
    >
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="hostDetail">
          <!-- 主机资产 -->
          <section class="detail-section">
            <h4 class="section-title">基础信息</h4>
            <ReRow :gutter="16">
              <ReCol :span="8"><div class="kv"><span class="k">名称</span><span class="v">{{ hostDetail.name || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">地址</span><span class="v">{{ hostDetail.address || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">SSH 端口</span><span class="v">{{ hostDetail.port ?? '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">系统类型</span><span class="v">{{ hostDetail.osType || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">在线状态</span><span class="v">{{ hostDetail.online ? '在线' : '离线' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">最近在线</span><span class="v">{{ fmtTime(hostDetail.onlineTime) }}</span></div></ReCol>
            </ReRow>
          </section>

          <section class="detail-section">
            <h4 class="section-title">通道</h4>
            <ReRow :gutter="12" class="mb-12">
              <ReCol :span="8">
                <div class="flag" :class="hostDetail.collectEnabled ? 'on' : 'off'">采集 {{ onOff(hostDetail.collectEnabled) }}</div>
              </ReCol>
              <ReCol :span="8">
                <div class="flag" :class="hostDetail.agentEnabled ? 'on' : 'off'">Agent {{ onOff(hostDetail.agentEnabled) }}</div>
              </ReCol>
              <ReCol :span="8">
                <div class="flag" :class="hostDetail.remoteEnabled ? 'on' : 'off'">远控 {{ onOff(hostDetail.remoteEnabled) }}</div>
              </ReCol>
            </ReRow>
            <ReTable :data="hostDetail.channels || []" border :pagination="false" :toolbar="false" empty-text="无服务节点">
              <ReTableColumn prop="name" label="节点" min-width="140" />
              <ReTableColumn prop="protocol" label="协议" width="90" align="center" />
              <ReTableColumn prop="port" label="端口" width="80" align="center" />
              <ReTableColumn label="状态" width="90" align="center">
                <template #default="{ row }">
                  <span :class="['status-pill', row.status === 'RUNNING' ? 'on' : 'off']">
                    {{ row.status === 'RUNNING' ? '运行中' : '已停止' }}
                  </span>
                </template>
              </ReTableColumn>
              <ReTableColumn prop="url" label="访问地址" min-width="160">
                <template #default="{ row }"><span class="dim">{{ row.url || '—' }}</span></template>
              </ReTableColumn>
            </ReTable>
          </section>
        </template>

        <template v-else-if="deviceDetail">
          <!-- 设备资产 -->
          <section class="detail-section">
            <h4 class="section-title">基础信息</h4>
            <ReRow :gutter="16">
              <ReCol :span="8"><div class="kv"><span class="k">名称</span><span class="v">{{ deviceDetail.name || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">地址</span><span class="v">{{ deviceDetail.address || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">端口</span><span class="v">{{ deviceDetail.port ?? '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">设备大类</span><span class="v">{{ deviceDetail.categoryLabel || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">厂商 / 型号</span><span class="v">{{ vendorLabel(deviceDetail.vendor) }} {{ deviceDetail.model || '' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">序列号</span><span class="v">{{ deviceDetail.serial || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">固件</span><span class="v">{{ deviceDetail.firmware || '—' }}</span></div></ReCol>
              <ReCol :span="8"><div class="kv"><span class="k">所属组织</span><span class="v">{{ deviceDetail.orgName || '—' }}</span></div></ReCol>
              <ReCol :span="8">
                <div class="kv"><span class="k">在线状态</span><span class="v">{{ deviceDetail.online ? '在线' : '离线' }}</span></div>
              </ReCol>
            </ReRow>
            <ReRow :gutter="12" class="mt-8">
              <ReCol :span="8">
                <div class="flag" :class="deviceDetail.online ? 'on' : 'off'">探测 {{ onOff(deviceDetail.online) }}</div>
              </ReCol>
              <ReCol :span="8">
                <div class="flag" :class="deviceDetail.sessionOnline ? 'on' : 'off'">会话 {{ onOff(deviceDetail.sessionOnline) }}</div>
              </ReCol>
              <ReCol :span="8">
                <div class="flag plain">离线阈值 {{ deviceDetail.offlineThreshold ?? '—' }} 秒</div>
              </ReCol>
            </ReRow>
          </section>

          <section v-if="deviceDetail.geo?.located" class="detail-section">
            <h4 class="section-title">位置</h4>
            <div class="kv wide">
              <span class="k">坐标</span>
              <span class="v">{{ deviceDetail.geo.latitude }}, {{ deviceDetail.geo.longitude }}</span>
            </div>
            <div v-if="deviceDetail.geo.address" class="kv wide">
              <span class="k">地址</span>
              <span class="v">{{ deviceDetail.geo.address }}</span>
            </div>
          </section>

          <section class="detail-section">
            <h4 class="section-title">
              通道
              <span class="section-extra">已启用 {{ deviceDetail.enabledChannelCount }} / {{ deviceDetail.channelCount }}</span>
            </h4>
            <ReTable :data="deviceDetail.channels || []" border :pagination="false" :toolbar="false" empty-text="无通道">
              <ReTableColumn prop="channelNo" label="通道号" width="80" align="center" />
              <ReTableColumn prop="channelName" label="通道名称" min-width="140" />
              <ReTableColumn prop="channelType" label="类型" width="100" align="center" />
              <ReTableColumn prop="channelStatus" label="状态" width="90" align="center">
                <template #default="{ row }"><span class="dim">{{ row.channelStatus || '—' }}</span></template>
              </ReTableColumn>
            </ReTable>
          </section>
        </template>

        <!-- 监控项与告警：主机与设备共用同一区块 -->
        <section v-if="currentMonitors.length" class="detail-section">
          <h4 class="section-title">
            监控项
            <span class="section-extra">
              共 {{ currentMonitors.length }} 项 · 活跃告警 {{ currentActiveAlarmCount }} 条
            </span>
          </h4>
          <ReTable :data="currentMonitors" border :pagination="false" :toolbar="false">
            <ReTableColumn prop="name" label="监控项" min-width="140" />
            <ReTableColumn prop="host" label="地址" min-width="130" />
            <ReTableColumn prop="serviceType" label="服务类型" width="100" align="center" />
            <ReTableColumn label="状态" width="90" align="center">
              <template #default="{ row }">
                <span :class="['status-pill', row.enabled ? 'on' : 'off']">{{ row.enabled ? '启用' : '停用' }}</span>
              </template>
            </ReTableColumn>
            <ReTableColumn label="告警" width="110" align="center">
              <template #default="{ row }">
                <span v-if="row.activeAlarmCount > 0" class="status-pill alarm">
                  {{ row.activeAlarmCount }} 条<span v-if="row.maxLevel"> · {{ row.maxLevel }}</span>
                </span>
                <span v-else class="dim">无</span>
              </template>
            </ReTableColumn>
          </ReTable>
        </section>
        <section v-else class="detail-section">
          <h4 class="section-title">监控项</h4>
          <div class="empty-hint">该资产暂无关联监控项</div>
        </section>
      </div>

      <template #footer>
        <ReButton @click="showDetail = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="ScAssetCenter">
import { ref, computed, onMounted } from 'vue'
import { message } from '@repo/core'
import {
  searchAssets,
  getHostAssetDetail,
  getDeviceAssetDetail,
  type AssetBrief,
  type AssetType,
  type AssetMonitorItem,
  type HostAssetDetail,
  type DeviceAssetDetail,
} from '../../api'

const list = ref<AssetBrief[]>([])
const loading = ref(false)
const filters = ref<{ keyword: string; assetType: '' | AssetType; online: '' | string }>({
  keyword: '',
  assetType: '',
  online: '',
})

const typeOptions = [
  { label: '全部大类', value: '' },
  { label: '主机', value: 'HOST' },
  { label: '设备', value: 'DEVICE' },
]

const showDetail = ref(false)
const detailLoading = ref(false)
const current = ref<AssetBrief | null>(null)
const hostDetail = ref<HostAssetDetail | null>(null)
const deviceDetail = ref<DeviceAssetDetail | null>(null)

const cssPrimary = 'var(--el-color-primary)'
const cssSuccess = 'var(--el-color-success)'
const cssInfo = 'var(--el-color-info)'
const cssWarning = 'var(--el-color-warning)'

const hosts = computed(() => list.value.filter(a => a.assetType === 'HOST'))
const devices = computed(() => list.value.filter(a => a.assetType === 'DEVICE'))

const summary = computed(() => [
  { label: '资产总数', value: list.value.length, color: cssPrimary },
  { label: '主机', value: hosts.value.length, color: cssSuccess },
  { label: '设备', value: devices.value.length, color: cssInfo },
  { label: '离线', value: list.value.filter(a => !a.online).length, color: cssWarning },
])

/** 大类与在线状态在后端已按需过滤，这里只做关键字的即时反馈，避免每次输入都打接口 */
const filtered = computed(() => {
  const kw = filters.value.keyword.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    a =>
      (a.name || '').toLowerCase().includes(kw) ||
      (a.address || '').toLowerCase().includes(kw) ||
      (a.categoryLabel || '').toLowerCase().includes(kw),
  )
})

const detailTitle = computed(() => {
  if (!current.value) return '资产详情'
  const kind = current.value.assetType === 'HOST' ? '主机资产' : '设备资产'
  return `${kind} · ${current.value.name || current.value.assetId}`
})

const currentMonitors = computed<AssetMonitorItem[]>(
  () => hostDetail.value?.monitors || deviceDetail.value?.monitors || [],
)
const currentActiveAlarmCount = computed(
  () => hostDetail.value?.activeAlarmCount || deviceDetail.value?.activeAlarmCount || 0,
)

async function fetchList() {
  loading.value = true
  try {
    const kw = filters.value.keyword.trim()
    list.value = (await searchAssets(kw || undefined, filters.value.assetType || undefined)) ?? []
  } catch (e: any) {
    message.error(e?.message || '资产加载失败')
  } finally {
    loading.value = false
  }
}

async function openDetail(row: AssetBrief) {
  current.value = row
  hostDetail.value = null
  deviceDetail.value = null
  showDetail.value = true
  detailLoading.value = true
  try {
    if (row.assetType === 'HOST') {
      hostDetail.value = await getHostAssetDetail(row.assetId)
    } else {
      deviceDetail.value = await getDeviceAssetDetail(row.assetId)
    }
  } catch (e: any) {
    message.error(e?.message || '资产详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

const onOff = (v: boolean) => (v ? '开启' : '关闭')
const vendorLabel = (v?: string) =>
  ({ hikvision: '海康威视', dahua: '大华' } as Record<string, string>)[v || ''] || v || '—'
const fmtTime = (t?: string) => (t ? t.slice(0, 19).replace('T', ' ') : '—')

onMounted(fetchList)
</script>

<style scoped>
/* 本文件原先整套用 pages/monitor/src/styles/tokens.css 的私有令牌（--bg-* / --text-*
   / --border-subtle / --status-* / --shadow-card / --border-radius*），而那份 tokens.css
   只有 :root、没有暗色变体，暗色模式下这些值全部停留在亮色。已统一改走 EP 语义令牌；
   --metric-* 是各监控域的固定色相（需彼此可区分），保留不换。 */
/* 页面入场淡入：0.35s 刻意慢于微交互档（整块内容从下方 8px 升起，需要时间被看清），
   且 both 填充保证动画结束后停在终态，reduced-motion 下直接停掉不会留残影 */
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
/* 3px 高的统计色条，圆角 2px 比 koi 最小档 4px 还小，用 EP 自带的 --el-border-radius-small。
   底色由模板 :style 传入（脚本里的 s.color），不属本文件令牌范围 */
.stat-bar { height: 3px; width: 32px; border-radius: var(--el-border-radius-small, 2px); margin-top: 6px; }

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
}
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  border: 1px solid var(--el-border-color-lighter);
  min-width: 220px;
}
.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.search-icon { width: 14px; height: 14px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.filter-select { width: 140px; }
.filter-divider { width: 1px; height: 24px; background: var(--el-border-color-lighter); }
.filter-hint { font-size: 12px; color: var(--el-text-color-secondary); }

.asset-table {
  margin-top: 14px;
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  /* 原来只有 box-shadow: var(--shadow-card) 承载边界；按 koi 规约改成 1px 边框 */
  border: 1px solid var(--el-border-color-lighter);
}
.name-cell { font-weight: 500; color: var(--el-text-color-primary); font-size: 13px; }
.dim { color: var(--el-text-color-secondary); font-size: 11.5px; }

.type-tag { font-size: 11px; font-weight: 600; padding: 1px 6px; /* 原为 3px，取最小档 4px */ border-radius: var(--el-radius-xs, 4px); }
/* --metric-* 是各监控域的固定色相，彼此需可区分，保留原色相 */
.type-tag.blue { color: var(--metric-cpu); }
.type-tag.purple { color: var(--metric-jvm); }

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px;
  font-weight: 600;
}
.status-pill.on { color: var(--el-color-success); background: color-mix(in srgb, var(--el-color-success) 12%, transparent); }
.status-pill.off { color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); }
.status-pill.alarm { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); }

.detail-body { min-height: 200px; }
.detail-section { margin-bottom: 18px; }
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
  line-height: 1.2;
}
.section-extra { font-size: 11px; font-weight: 400; color: var(--el-text-color-secondary); }

.kv { display: flex; gap: 8px; padding: 4px 0; font-size: 12.5px; }
.kv .k { color: var(--el-text-color-secondary); width: 62px; flex-shrink: 0; }
.kv .v { color: var(--el-text-color-primary); word-break: break-all; }
.kv.wide { padding: 3px 0; }

.flag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--el-radius-sm, 6px);
  font-size: 12px;
  font-weight: 500;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
}
.flag.on { color: var(--el-color-success); background: color-mix(in srgb, var(--el-color-success) 12%, transparent); }
.flag.off { color: var(--el-text-color-secondary); }
.flag.plain { color: var(--el-text-color-regular); }

.mb-12 { margin-bottom: 12px; }
.mt-8 { margin-top: 8px; }
.empty-hint { font-size: 12px; color: var(--el-text-color-secondary); padding: 6px 0; }

@media (max-width: 768px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .filter-select { width: 100% !important; flex: 1 1 100%; }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  /* 入场淡入可停：animation 用 both 填充，终态是完全不透明且无位移，停掉即直接呈现 */
  .fade-in {
    animation: none;
  }
}
</style>
