<template>
  <div class="flex-1 mcp-page">
    <!-- 非管理员：无权限，不渲染任何内容、不发起写请求 -->
    <div v-if="!admin" class="mcp-forbidden">
      <el-icon size="40" class="mb-3 opacity-40"><LockOutlined /></el-icon>
      <div class="text-sm" style="color: var(--el-text-color-secondary)">{{ t('plugins.mcp.adminOnly') }}</div>
    </div>

    <template v-else>
      <!-- ============ 市场视图 ============ -->
      <template v-if="view === 'market'">
        <!-- 本周精选横幅：取内置推荐第一条（真实数据；pm-* 为市场壳共享样式） -->
        <div v-if="featuredCard" class="pm-banner">
          <div class="pm-banner-body">
            <div class="pm-banner-kicker">{{ t('plugins.market.featuredKicker') }}</div>
            <div class="pm-banner-title">{{ featuredCard.name }}</div>
            <div class="pm-banner-desc">{{ featuredCard.description }}</div>
          </div>
          <el-button class="pm-banner-cta" type="primary" plain @click="openDetail(featuredCard)">{{ t('plugins.market.featuredCta') }}</el-button>
        </div>

        <!-- 次要操作：来源设置 / 管理 / 添加（搜索在市场壳页头；页头「添加」经 defineExpose 打开表单） -->
        <div class="pm-toolbar">
          <el-button size="default" @click="openSourceConfig">
            <el-icon class="mr-1"><SettingsOutlined /></el-icon>{{ t('plugins.mcp.sourceSettings') }}
          </el-button>
          <el-button size="default" @click="switchManage">{{ t('plugins.mcp.manage') }}</el-button>
          <el-button size="default" type="primary" @click="openAddForm">
            <el-icon class="mr-1"><PlusOutlined /></el-icon>{{ t('plugins.mcp.add') }}
          </el-button>
        </div>

        <!-- 计数 + 排序工具条 -->
        <MarketToolbar v-if="!loadingInitial && builtinList.length" market="mcp"
          :total="builtinList.length" :filtered="marketFilteredCount" />

        <!-- 初始骨架：加载内置推荐 -->
        <div v-if="loadingInitial" class="market-skeleton" aria-hidden="true">
          <div class="market-skeleton__tabs">
            <div v-for="n in 7" :key="'st-' + n" class="skel skel--tab"></div>
          </div>
          <div v-for="g in 3" :key="'sg-' + g" class="market-skeleton__group">
            <div class="skel skel--grouphead"></div>
            <div class="market-skeleton__grid">
              <div v-for="c in 4" :key="'sc-' + g + '-' + c" class="market-skeleton__cell">
                <div class="skel skel--circle"></div>
                <div class="market-skeleton__lines">
                  <div class="skel skel--title"></div>
                  <div class="skel skel--desc"></div>
                </div>
                <div class="skel skel--btn"></div>
              </div>
            </div>
          </div>
        </div>

        <template v-else>
          <!-- 默认浏览：分类由市场壳左栏索引驱动（精选 = 按首标签分组展示全部） -->
          <template v-if="!hasKeyword">
            <div v-for="g in groups" :key="g.cat" class="market-group">
              <div class="market-group-head" role="button" tabindex="0" @click="toggleGroup(g.cat)"
                @keydown.enter.self.prevent="toggleGroup(g.cat)" @keydown.space.self.prevent="toggleGroup(g.cat)">
                <span class="market-group-title">{{ g.cat }}</span>
                <span class="market-group-arrow" :class="{ collapsed: collapsed.has(g.cat) }">›</span>
              </div>
              <div v-show="!collapsed.has(g.cat)" class="market-grid">
                <div v-for="card in g.items" :key="card.id" class="market-cell market-cell--clickable"
                  role="button" tabindex="0" @click="openDetail(card)"
                  @keydown.enter.self.prevent="openDetail(card)" @keydown.space.self.prevent="openDetail(card)">
                  <PluginIcon :icon="card.icon" :name="card.name" class="market-cell-icon" />
                  <div class="market-cell-body">
                    <div class="market-cell-title"><template v-for="(seg, i) in splitHighlight(card.name, keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
                    <div class="market-cell-desc"><template v-for="(seg, i) in splitHighlight(card.description || '', keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
                  </div>
                  <MarketFavButton market="mcp" :id="String(card.id)" />
                  <el-button class="market-cell-btn" plain
                    :type="isInstalled(card) ? 'success' : ''"
                    :disabled="isInstalled(card)" :loading="installingId === card.id"
                    @click.stop="handleInstall(card)">
                    {{ isInstalled(card) ? t('plugins.mcp.installed') : t('plugins.mcp.install') }}
                  </el-button>
                </div>
              </div>
            </div>
          </template>

          <!-- 搜索结果 -->
          <template v-else>
            <div v-if="searching" class="market-skeleton" aria-hidden="true">
              <div v-for="g in 2" :key="'mssg-' + g" class="market-skeleton__group">
                <div class="skel skel--grouphead"></div>
                <div class="market-skeleton__grid">
                  <div v-for="c in 4" :key="'mssc-' + g + '-' + c" class="market-skeleton__cell">
                    <div class="skel skel--circle"></div>
                    <div class="market-skeleton__lines">
                      <div class="skel skel--title"></div>
                      <div class="skel skel--desc"></div>
                    </div>
                    <div class="skel skel--btn"></div>
                  </div>
                </div>
              </div>
            </div>

            <template v-else>
              <div v-if="searchBuiltin.length" class="market-group">
                <div class="market-group-head market-group-head--static">
                  <span class="market-group-title">{{ t('plugins.mcp.builtinPicks', { count: searchBuiltin.length }) }}</span>
                </div>
                <div class="market-grid">
                  <div v-for="card in searchBuiltin" :key="card.id"
                    class="market-cell market-cell--clickable" role="button" tabindex="0" @click="openDetail(card)"
                    @keydown.enter.self.prevent="openDetail(card)" @keydown.space.self.prevent="openDetail(card)">
                    <PluginIcon :icon="card.icon" :name="card.name" class="market-cell-icon" />
                    <div class="market-cell-body">
                      <div class="market-cell-title"><template v-for="(seg, i) in splitHighlight(card.name, keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
                      <div class="market-cell-desc"><template v-for="(seg, i) in splitHighlight(card.description || '', keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
                    </div>
                    <el-button class="market-cell-btn" plain
                      :type="isInstalled(card) ? 'success' : ''" :disabled="isInstalled(card)"
                      :loading="installingId === card.id" @click.stop="handleInstall(card)">
                      {{ isInstalled(card) ? t('plugins.mcp.installed') : t('plugins.mcp.install') }}
                    </el-button>
                  </div>
                </div>
              </div>

              <div v-if="onlineResults.length" class="market-group">
                <div class="market-group-head market-group-head--static">
                  <span class="market-group-title">{{ t('plugins.mcp.thirdPartyRepos', { count: onlineResults.length }) }}</span>
                </div>
                <div class="market-grid">
                  <div v-for="card in onlineResults" :key="card.id"
                    class="market-cell market-cell--clickable" role="button" tabindex="0" @click="openDetail(card)"
                    @keydown.enter.self.prevent="openDetail(card)" @keydown.space.self.prevent="openDetail(card)">
                    <PluginIcon :icon="card.icon" :name="card.name" class="market-cell-icon" />
                    <div class="market-cell-body">
                      <div class="market-cell-title"><template v-for="(seg, i) in splitHighlight(card.name, keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
                      <div class="market-cell-desc"><template v-for="(seg, i) in splitHighlight(card.description || '', keyword)" :key="i"><mark v-if="seg.hit" class="pm-hl">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></div>
                    </div>
                    <el-button class="market-cell-btn" plain type="primary"
                      @click.stop="handleConfigure(card)">{{ t('plugins.mcp.manualConfig') }}</el-button>
                  </div>
                </div>
              </div>

              <MarketEmpty v-if="!searchBuiltin.length && !onlineResults.length" market="mcp"
                :title="t(searchFailed ? 'plugins.mcp.searchFailed' : 'plugins.mcp.noMatchTitle')"
                :hint="searchFailed ? '' : t('plugins.mcp.noMatchHint', { keyword })" clearable />
            </template>
          </template>
        </template>
      </template>

      <!-- ============ 管理视图 ============ -->
      <template v-else>
        <div class="market-topbar">
          <el-button size="default" @click="view = 'market'">
            <el-icon class="mr-1"><ArrowBackOutlined /></el-icon>{{ t('plugins.mcp.backToMarket') }}
          </el-button>
          <span class="manage-title">{{ t('plugins.mcp.manageTitle', { count: boundList.length }) }}</span>
        </div>

        <div v-if="boundList.length" class="manage-grid">
          <div v-for="s in boundList" :key="s.mcp_server_id" class="manage-card">
            <div class="manage-card__main" role="button" tabindex="0" @click="openDetail(s)"
              @keydown.enter.self.prevent="openDetail(s)" @keydown.space.self.prevent="openDetail(s)">
              <PluginIcon :icon="s.icon" :name="s.name" size="md" />
              <div class="manage-card__body">
                <div class="manage-card__name">{{ s.name }}</div>
                <div class="manage-card__meta">{{ transportLabel(s.transport) }}</div>
                <div class="manage-card__status"
                  v-if="s.last_test_status && s.last_test_status !== 'disconnected'">
                  <el-tag
                    :type="s.last_test_status === 'connected' ? 'success' : 'danger'" effect="light">
                    {{ s.last_test_status === 'connected' ? t('plugins.mcp.connected') : t('plugins.mcp.connectFailed') }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="manage-card__actions">
              <el-switch :model-value="s.enabled" @update:model-value="(v) => handleToggle(s, !!v)" />
              <LTooltip :content="t('plugins.mcp.testConnection')" placement="top">
                <el-button link :loading="testingId === s.mcp_server_id"
                  @click="handleTest(s)"><el-icon><WifiTetheringOutlined /></el-icon></el-button>
              </LTooltip>
              <LTooltip :content="t('plugins.mcp.edit')" placement="top">
                <el-button link @click="openEditForm(s)"><el-icon><EditOutlined /></el-icon></el-button>
              </LTooltip>
              <LTooltip :content="t('plugins.mcp.delete')" placement="top">
                <el-button link type="danger" @click="handleDelete(s)">
                  <el-icon><DeleteOutlined /></el-icon>
                </el-button>
              </LTooltip>
            </div>
          </div>
        </div>

        <MarketEmpty v-else market="mcp" :title="t('plugins.mcp.manageEmpty')" />
      </template>
    </template>

    <!-- 详情 -->
    <McpDetailDialog v-model:visible="detailVisible" :target="detailTarget"
      :installed="detailInstalled" :installing="installingId === detailTarget?.id"
      @install="handleInstall" @configure="handleConfigure" />

    <!-- 新增 / 编辑表单 -->
    <McpServerFormDialog v-model:visible="formVisible" :initial="formInitial" :saving="formSaving"
      @save="handleFormSave" />

    <!-- 来源设置 -->
    <ReDialog :close-on-click-modal="true" v-model="sourceVisible" :title="t('plugins.mcp.sourceSettingsTitle')" width="520px" align-center destroy-on-close>
      <div class="source-list" v-if="sourceConfig">
        <div class="source-item">
          <div>
            <div class="source-item__name">{{ t('plugins.mcp.sourceBuiltinName') }}</div>
            <div class="source-item__desc">{{ t('plugins.mcp.sourceBuiltinDesc') }}</div>
          </div>
          <el-switch :model-value="true" disabled />
        </div>
        <div v-for="o in sourceConfig.online" :key="o.key" class="source-item">
          <div>
            <div class="source-item__name">{{ o.name }}</div>
            <div class="source-item__desc">{{ t('plugins.mcp.sourceOnlineDesc') }}</div>
          </div>
          <el-switch :model-value="sourceState[o.key]"
            @update:model-value="(v) => (sourceState[o.key] = !!v)" />
        </div>
      </div>
      <template #footer>
        <el-button @click="sourceVisible = false">{{ t('plugins.mcp.cancel') }}</el-button>
        <el-button type="primary" :loading="sourceSaving" @click="saveSourceConfig">{{ t('plugins.mcp.save') }}</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import {isAdmin, message} from '@repo/core'
import {
  PlusOutlined, SettingsOutlined, LockOutlined, DeleteOutlined,
  EditOutlined, ArrowBackOutlined, WifiTetheringOutlined,
} from '@vicons/material'
import { mcpApi } from '@/services/javaApi'
import PluginIcon from '@/components/ui/PluginIcon.vue'
import LTooltip from '@/components/ui/LTooltip.vue'
import ReDialog from '@repo/ui/re-dialog'
import McpDetailDialog from './McpDetailDialog.vue'
import McpServerFormDialog from './McpServerFormDialog.vue'
import { pluginsMarket, syncMarketSlice, splitHighlight, loadStoredSet, saveStoredSet, sortMarketList } from './plugins-market'
import MarketEmpty from './MarketEmpty.vue'
import MarketToolbar from './MarketToolbar.vue'
import MarketFavButton from './MarketFavButton.vue'

const { t } = useI18n()
const admin = ref(isAdmin())

const view = ref<'market' | 'manage'>('market')

// 数据
const builtinList = ref<any[]>([])
const boundList = ref<any[]>([])
const loadingInitial = ref(false)

// 市场浏览（分类 / 关键词上提到市场壳共享状态；store 里 '' = 精选）
const FEATURED = '精选'
const activeTab = computed({
  get: () => pluginsMarket.mcp.category || FEATURED,
  set: (v: string) => { pluginsMarket.mcp.category = v === FEATURED ? '' : v },
})
/** 分组折叠态：localStorage 持久化，刷新 / 重开页面后保留 */
const collapsed = ref<Set<string>>(loadStoredSet('mcp', 'collapsed'))
watch(collapsed, (set) => saveStoredSet('mcp', 'collapsed', set), { deep: true })

const labels = computed<string[]>(() => {
  const order: string[] = []
  const seen = new Set<string>()
  builtinList.value.forEach((c) => (c.labels || []).forEach((l: string) => {
    if (!seen.has(l)) { seen.add(l); order.push(l) }
  }))
  return order
})
function firstLabel(c: any) {
  return c.labels?.length ? c.labels[0] : t('plugins.mcp.other')
}
/** 状态筛选（市场壳左栏）：installed / not_installed，'' = 全部 */
function statusMatch(c: any): boolean {
  const st = pluginsMarket.mcp.status
  if (!st) return true
  return (st === 'installed') === isInstalled(c)
}
/** 排序：default = 目录原序；name = 名称字典序；pinned = 收藏优先（四市场共享实现） */
function sortCards(list: any[]): any[] {
  return sortMarketList('mcp', list, pluginsMarket.mcp.sort, (c) => String(c.id), (c) => String(c.name))
}
const groups = computed(() => {
  if (activeTab.value === FEATURED) {
    return labels.value
      .map((l) => ({ cat: l, items: sortCards(builtinList.value.filter((c) => firstLabel(c) === l && statusMatch(c))) }))
      .filter((g) => g.items.length)
  }
  const l = activeTab.value
  return [{ cat: l, items: sortCards(builtinList.value.filter((c) => c.labels?.includes(l) && statusMatch(c))) }]
})

/** 工具条「已筛出 N 条」：浏览态 = 各组命中之和；搜索态 = 内置 + 在线命中 */
const marketFilteredCount = computed(() => {
  if (hasKeyword.value) return searchBuiltin.value.length + onlineResults.value.length
  return groups.value.reduce((n, g) => n + g.items.length, 0)
})
function toggleGroup(cat: string) {
  if (collapsed.value.has(cat)) collapsed.value.delete(cat)
  else collapsed.value.add(cat)
}

// 已安装匹配（按名称）
const installedNames = computed(() => new Set(boundList.value.map((s) => s.name)))
function isInstalled(card: any) {
  return installedNames.value.has(card.name)
}

// 搜索（关键词上提到市场壳共享状态，页头搜索框双向绑定）
const keyword = computed({
  get: () => pluginsMarket.mcp.keyword,
  set: (v: string) => { pluginsMarket.mcp.keyword = v },
})
const searching = ref(false)
const onlineResults = ref<any[]>([])
const hasKeyword = computed(() => keyword.value.trim() !== '')
const searchBuiltin = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return []
  return builtinList.value.filter(
    (c) => c.name.toLowerCase().includes(k) || c.description.toLowerCase().includes(k))
})

/** 在线检索失败标志：空态提示「服务暂不可用」而非「无结果」 */
const searchFailed = ref(false)
/** 竞态守卫：只采纳最后一次检索的响应 */
let searchSeq = 0
/** 输入防抖：停止输入 600ms 后自动在线检索（回车仍立即检索） */
let searchTimer: ReturnType<typeof setTimeout> | null = null

function handleClear() {
  cancelSearchDebounce()
  searchSeq++
  keyword.value = ''
  onlineResults.value = []
  searchFailed.value = false
  searching.value = false
}

function cancelSearchDebounce() {
  if (searchTimer) { clearTimeout(searchTimer); searchTimer = null }
}

async function runSearch() {
  const k = keyword.value.trim()
  if (!k) { handleClear(); return }
  const seq = ++searchSeq
  searching.value = true
  try {
    const res = await mcpApi.online(k)
    if (seq !== searchSeq) return
    onlineResults.value = Array.isArray(res?.data) ? res.data : []
    searchFailed.value = false
  } catch (e) {
    console.error('MCP 在线检索失败:', e)
    if (seq !== searchSeq) return
    onlineResults.value = []
    searchFailed.value = true
  } finally {
    if (seq === searchSeq) searching.value = false
  }
}

// 关键词变化 → 防抖自动在线检索（immediate：带 ?q= 直达时自动出在线结果）；内置目录过滤是 computed，实时生效
watch(keyword, () => {
  cancelSearchDebounce()
  if (!keyword.value.trim()) { handleClear(); return }
  searchTimer = setTimeout(() => { searchTimer = null; runSearch() }, 600)
}, { immediate: true })

// 安装
const installingId = ref('')
async function handleInstall(card: any) {
  if (!card.installable || isInstalled(card)) return
  installingId.value = card.id
  try {
    await mcpApi.create({
      name: card.name,
      description: card.description,
      icon: card.icon,
      transport: card.transport,
    })
    message.success(t('plugins.mcp.addedNamed', { name: card.name }))
    await loadBound()
    if (card.requiresKey) {
      message.warning(t('plugins.mcp.requiresKeyWarning'))
    } else if (card.requiresConfig) {
      message.warning(t('plugins.mcp.requiresConfigWarning'))
    }
  } catch (e: any) {
    message.error(e?.message || t('plugins.mcp.addFailed'))
  } finally {
    installingId.value = ''
  }
}

// 详情
const detailVisible = ref(false)
const detailTarget = ref<any>(null)
const detailInstalled = computed(() => {
  const t = detailTarget.value
  return !!t && (t.mcp_server_id ? true : isInstalled(t))
})
function openDetail(card: any) {
  detailTarget.value = card
  detailVisible.value = true
}

// 手动配置（第三方仓库）
function handleConfigure(card: any) {
  detailVisible.value = false
  formInitial.value = card
  formVisible.value = true
}

// 表单（新增 / 编辑）
const formVisible = ref(false)
const formInitial = ref<any>(null)
const formSaving = ref(false)
function openAddForm() {
  formInitial.value = null
  formVisible.value = true
}
function openEditForm(s: any) {
  formInitial.value = s
  formVisible.value = true
}
async function handleFormSave({ id, data }: { id?: string; data: any }) {
  formSaving.value = true
  try {
    if (id) {
      await mcpApi.update(id, data)
      message.success(t('plugins.mcp.saved'))
    } else {
      await mcpApi.create(data)
      message.success(t('plugins.mcp.added'))
    }
    formVisible.value = false
    await loadBound()
  } catch (e: any) {
    message.error(e?.message || t('plugins.mcp.saveFailed'))
  } finally {
    formSaving.value = false
  }
}

// 管理：启停 / 测试 / 删除
const testingId = ref('')
async function handleToggle(s: any, enabled: boolean) {
  try {
    await mcpApi.toggle(s.mcp_server_id, enabled)
    s.enabled = enabled
  } catch (e: any) {
    message.error(e?.message || t('plugins.mcp.operationFailed'))
  }
}
async function handleTest(s: any) {
  testingId.value = s.mcp_server_id
  try {
    const res = await mcpApi.testConnection({ mcp_server_id: s.mcp_server_id, name: s.name, transport: s.transport })
    if (res?.data?.success) {
      message.success(t('plugins.mcp.connectSuccessTools', { count: res.data.tools?.length || 0 }))
      await loadBound()
    } else {
      message.error(res?.data?.error || t('plugins.mcp.connectFailed'))
    }
  } catch (e: any) {
    message.error(e?.message || t('plugins.mcp.connectFailed'))
  } finally {
    testingId.value = ''
  }
}
async function handleDelete(s: any) {
  try {
    await message.confirm(t('plugins.mcp.removeConfirm', { name: s.name }), t('plugins.mcp.removeConfirmTitle'), t('plugins.mcp.delete'), t('plugins.mcp.cancel'), 'warning')
  } catch {
    return
  }
  try {
    await mcpApi.delete(s.mcp_server_id)
    message.success(t('plugins.mcp.deleted'))
    await loadBound()
  } catch (e: any) {
    message.error(e?.message || t('plugins.mcp.deleteFailed'))
  }
}
function switchManage() {
  view.value = 'manage'
}

function transportLabel(transport: any) {
  if (!transport) return t('plugins.mcp.notConfigured')
  if (transport.type === 'stdio') return `stdio · ${transport.command || ''}`
  return `${(transport.type || '').toUpperCase()} · ${transport.url || ''}`
}

// 来源设置
const sourceVisible = ref(false)
const sourceConfig = ref<any>(null)
const sourceState = ref<Record<string, boolean>>({})
const sourceSaving = ref(false)
async function openSourceConfig() {
  try {
    const res = await mcpApi.catalogConfig()
    sourceConfig.value = res?.data
    const state: Record<string, boolean> = {}
    ;(res?.data?.online || []).forEach((o: any) => { state[o.key] = !!o.enabled })
    sourceState.value = state
    sourceVisible.value = true
  } catch (e: any) {
    message.error(e?.message || t('plugins.mcp.loadSourcesFailed'))
  }
}
async function saveSourceConfig() {
  sourceSaving.value = true
  try {
    await mcpApi.updateCatalogConfig(sourceState.value)
    message.success(t('plugins.mcp.sourceSettingsSaved'))
    sourceVisible.value = false
  } catch (e: any) {
    message.error(e?.message || t('plugins.mcp.saveFailed'))
  } finally {
    sourceSaving.value = false
  }
}

/** 本周精选位：取内置推荐第一条（真实数据） */
const featuredCard = computed(() => builtinList.value[0] || null)

// 回填市场壳：类目 / 状态分桶 / 总数（真实计数，Bento 卡与左栏索引展示用）
watchEffect(() => {
  const list = builtinList.value
  const counts: Record<string, number> = {}
  list.forEach((c) => {
    const l = firstLabel(c)
    counts[l] = (counts[l] || 0) + 1
  })
  syncMarketSlice('mcp', {
    total: list.length,
    categories: Object.keys(counts),
    categoryCounts: counts,
    statuses: [
      { key: 'installed', label: t('plugins.mcp.installed'), count: list.filter((c) => isInstalled(c)).length, tone: 'success' },
      { key: 'not_installed', label: t('plugins.mcp.notInstalled'), count: list.filter((c) => !isInstalled(c)).length, tone: 'info' },
    ],
  })
})

defineExpose({
  /** 市场壳页头「添加」入口：打开新增表单 */
  openAdd: () => { openAddForm() },
  /** 市场壳页头搜索：回车触发内置过滤 + 在线检索 */
  runSearch: () => { cancelSearchDebounce(); runSearch() },
  clearSearch: () => { cancelSearchDebounce(); handleClear() },
})

// 初始加载
async function loadBuiltin() {
  const res = await mcpApi.builtin()
  builtinList.value = Array.isArray(res?.data) ? res.data : []
}
async function loadBound() {
  const res = await mcpApi.list()
  boundList.value = Array.isArray(res?.data) ? res.data : []
}
onMounted(async () => {
  if (!admin.value) return
  loadingInitial.value = true
  try {
    await Promise.all([loadBuiltin(), loadBound()])
  } catch (e) {
    console.error('加载 MCP 失败:', e)
  } finally {
    loadingInitial.value = false
  }
})
</script>

<style scoped>
.mcp-page {
  min-width: 0;
}
.mcp-forbidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
}

/* ===== 顶栏（管理视图返回行；市场视图搜索/按钮已上提到市场壳页头） ===== */
.market-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0 16px;
}
.manage-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ===== 分组 ===== */
.market-group { margin-bottom: 20px; }
.market-group-head {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  user-select: none;
}
.market-group-head--static { cursor: default; }
.market-group-title { font-size: 13px; font-weight: 600; }
.market-group-arrow {
  color: var(--el-text-color-secondary);
  font-size: 16px;
  line-height: 1;
  transition: transform 0.2s;
}
.market-group-arrow.collapsed { transform: rotate(90deg); }

/* ===== 网格：等宽等高，同行卡片拉伸对齐（旧「方案 10」双列瀑布流已撤） ===== */
.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 12px;
}
.market-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
  padding: 14px;
  border: 1px solid var(--border-subtle, #eef2f8);
  /* 原值 var(--mp-radius-lg, 14px)：--mp-* 来自未引入的 modern-polish.css，是空令牌，
     收敛到 12px 档（14px 距 12/16 等距，本仓统一取 12px） */
  border-radius: var(--radius-lg, var(--el-radius-lg, 12px));
  background: var(--bg-container, #ffffff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  min-width: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.market-cell:hover {
  border-color: color-mix(in srgb, var(--brand-500, #3b82f6) 45%, transparent);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
}
.market-cell-icon {
  flex: none;
  align-self: flex-start;
}
.market-cell-body { flex: 1; min-width: 0; }
.market-cell-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.market-cell-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  margin-top: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.market-cell-btn {
  width: 100%;
  margin: 0;
}
.market-cell-btn.el-button--success.is-disabled,
.market-cell-btn.el-button--success.is-disabled:hover,
.market-cell-btn.el-button--success.is-disabled:focus {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border-color: transparent;
}
.market-cell-btn.el-button--success.is-disabled::before {
  content: "\2713";
  margin-right: 5px;
  font-weight: 700;
}
.market-cell--clickable { cursor: pointer; }

/* ===== 骨架屏 ===== */
.skel {
  flex: none;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background: linear-gradient(90deg,
    var(--el-fill-color) 25%, var(--el-fill-color-light) 37%, var(--el-fill-color) 63%);
  background-size: 400% 100%;
  animation: skel-shimmer 1.4s ease infinite;
}
@keyframes skel-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
.market-skeleton__tabs {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 2px 2px 10px;
  border-bottom: 1px solid var(--el-border-color);
  margin-bottom: 14px;
}
.skel--tab { width: 56px; max-width: 12%; height: 15px; }
.market-skeleton__group { margin-bottom: 20px; }
.skel--grouphead { width: 120px; height: 13px; margin-bottom: 12px; }
.market-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px 12px;
}
.market-skeleton__cell {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
}
.skel--circle { width: 34px; height: 34px; border-radius: 50%; }
.market-skeleton__lines { flex: 1; min-width: 0; }
.skel--title { height: 12px; width: 62%; }
.skel--desc { height: 10px; width: 92%; margin-top: 7px; }
.skel--btn { width: 52px; height: 26px; }
@media (prefers-reduced-motion: reduce) {
  .skel { animation: none; }
}

/* ===== 管理卡片 ===== */
.manage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.manage-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 var(--mp-radius-lg, 14px)：--mp-* 来自未引入的 modern-polish.css，是空令牌，
     收敛到 --el-radius-lg 档（14px 距 12/16 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.manage-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}
.manage-card__main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.manage-card__body { min-width: 0; flex: 1; }
.manage-card__name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.manage-card__meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 3px;
}
.manage-card__status { margin-top: 6px; }
.manage-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}

/* ===== 来源设置 ===== */
.source-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 8px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
}
.source-item:hover { background: var(--el-fill-color-light); }
.source-item__name { font-size: 13px; font-weight: 600; }
.source-item__desc { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }

/* 键盘焦点可见性：分组头 / 市场单元 / 已装条目主区都是带 @click 的 div
   （不是可聚焦控件），浏览器不给默认焦点环。
   三者原有 cursor: pointer 都已在上面声明（.market-cell 走 .market-cell--clickable），
   不重复写。环用主色 12% —— 本文件没有任何写死的深色底，底色全走令牌，
   深浅两套主题下都只是一档主色描边，12% 足够可见。 */
.market-group-head,
.market-cell,
.manage-card__main {
  outline: none;
}

.market-group-head:focus-visible,
.market-cell:focus-visible,
.manage-card__main:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 注意：本文件不在 A 段清单内，所以 .market-group-arrow（折叠箭头旋转）/
   .market-cell / .manage-card 自带的 transition 未做 reduced-motion 降级，
   按「照清单做、不自行扩范围」的约定留待下一轮。 */
</style>
