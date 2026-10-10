<template>
  <div class="flex-1 mcp-page">
    <!-- 非管理员：无权限，不渲染任何内容、不发起写请求 -->
    <div v-if="!admin" class="mcp-forbidden">
      <el-icon size="40" class="mb-3 opacity-40"><LockOutlined /></el-icon>
      <div class="text-sm" style="color: var(--el-text-color-secondary)">仅管理员可配置 MCP</div>
    </div>

    <template v-else>
      <!-- ============ 市场视图 ============ -->
      <template v-if="view === 'market'">
        <div class="market-topbar">
          <el-input v-model="keyword" size="default" clearable class="market-topbar__search"
            placeholder="搜索 MCP（内置推荐 / 第三方仓库）"
            @keyup.enter="handleSearch" @clear="handleClear">
            <template #prefix>
              <el-icon><SearchOutlined /></el-icon>
            </template>
          </el-input>
          <el-button size="default" @click="openSourceConfig">
            <el-icon class="mr-1"><SettingsOutlined /></el-icon>来源设置
          </el-button>
          <el-button size="default" @click="switchManage">管理</el-button>
          <el-button size="default" type="primary" @click="openAddForm">
            <el-icon class="mr-1"><PlusOutlined /></el-icon>添加
          </el-button>
        </div>

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
          <!-- 默认浏览：分类标签 + 分组 -->
          <template v-if="!hasKeyword">
            <div class="market-tabs" role="tablist">
              <div v-for="tab in tabs" :key="tab" role="tab" class="market-tab"
                :class="{ active: activeTab === tab }" @click="activeTab = tab">
                {{ tab }}
              </div>
            </div>

            <div v-for="g in groups" :key="g.cat" class="market-group">
              <div class="market-group-head" @click="toggleGroup(g.cat)">
                <span class="market-group-title">{{ g.cat }}</span>
                <span class="market-group-arrow" :class="{ collapsed: collapsed.has(g.cat) }">›</span>
              </div>
              <div v-show="!collapsed.has(g.cat)" class="market-grid">
                <div v-for="card in g.items" :key="card.id" class="market-cell market-cell--clickable"
                  @click="openDetail(card)">
                  <PluginIcon :icon="card.icon" :name="card.name" class="market-cell-icon" />
                  <div class="market-cell-body">
                    <div class="market-cell-title">{{ card.name }}</div>
                    <div class="market-cell-desc">{{ card.description }}</div>
                  </div>
                  <el-button class="market-cell-btn" plain
                    :type="isInstalled(card) ? 'success' : ''"
                    :disabled="isInstalled(card)" :loading="installingId === card.id"
                    @click.stop="handleInstall(card)">
                    {{ isInstalled(card) ? '已安装' : '安装' }}
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
                  <span class="market-group-title">内置推荐（{{ searchBuiltin.length }}）</span>
                </div>
                <div class="market-grid">
                  <div v-for="card in searchBuiltin" :key="card.id"
                    class="market-cell market-cell--clickable" @click="openDetail(card)">
                    <PluginIcon :icon="card.icon" :name="card.name" class="market-cell-icon" />
                    <div class="market-cell-body">
                      <div class="market-cell-title">{{ card.name }}</div>
                      <div class="market-cell-desc">{{ card.description }}</div>
                    </div>
                    <el-button class="market-cell-btn" plain
                      :type="isInstalled(card) ? 'success' : ''" :disabled="isInstalled(card)"
                      :loading="installingId === card.id" @click.stop="handleInstall(card)">
                      {{ isInstalled(card) ? '已安装' : '安装' }}
                    </el-button>
                  </div>
                </div>
              </div>

              <div v-if="onlineResults.length" class="market-group">
                <div class="market-group-head market-group-head--static">
                  <span class="market-group-title">第三方仓库（{{ onlineResults.length }}）</span>
                </div>
                <div class="market-grid">
                  <div v-for="card in onlineResults" :key="card.id"
                    class="market-cell market-cell--clickable" @click="openDetail(card)">
                    <PluginIcon :icon="card.icon" :name="card.name" class="market-cell-icon" />
                    <div class="market-cell-body">
                      <div class="market-cell-title">{{ card.name }}</div>
                      <div class="market-cell-desc">{{ card.description }}</div>
                    </div>
                    <el-button class="market-cell-btn" plain type="primary"
                      @click.stop="handleConfigure(card)">手动配置</el-button>
                  </div>
                </div>
              </div>

              <div v-if="!searchBuiltin.length && !onlineResults.length" class="market-empty">
                <svg class="market-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <div class="market-empty__title">未找到匹配的 MCP</div>
                <div class="market-empty__hint">“{{ keyword }}”，可在「来源设置」中开启在线来源</div>
              </div>
            </template>
          </template>
        </template>
      </template>

      <!-- ============ 管理视图 ============ -->
      <template v-else>
        <div class="market-topbar">
          <el-button size="default" @click="view = 'market'">
            <el-icon class="mr-1"><ArrowBackOutlined /></el-icon>返回市场
          </el-button>
          <span class="manage-title">MCP 管理（{{ boundList.length }}）</span>
        </div>

        <div v-if="boundList.length" class="manage-grid">
          <div v-for="s in boundList" :key="s.mcp_server_id" class="manage-card">
            <div class="manage-card__main" @click="openDetail(s)">
              <PluginIcon :icon="s.icon" :name="s.name" size="md" />
              <div class="manage-card__body">
                <div class="manage-card__name">{{ s.name }}</div>
                <div class="manage-card__meta">{{ transportLabel(s.transport) }}</div>
                <div class="manage-card__status"
                  v-if="s.last_test_status && s.last_test_status !== 'disconnected'">
                  <el-tag
                    :type="s.last_test_status === 'connected' ? 'success' : 'danger'" effect="light">
                    {{ s.last_test_status === 'connected' ? '已连接' : '连接失败' }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="manage-card__actions">
              <el-switch :model-value="s.enabled" @update:model-value="(v) => handleToggle(s, !!v)" />
              <LTooltip content="测试连接" placement="top">
                <el-button link :loading="testingId === s.mcp_server_id"
                  @click="handleTest(s)"><el-icon><WifiTetheringOutlined /></el-icon></el-button>
              </LTooltip>
              <LTooltip content="编辑" placement="top">
                <el-button link @click="openEditForm(s)"><el-icon><EditOutlined /></el-icon></el-button>
              </LTooltip>
              <LTooltip content="删除" placement="top">
                <el-button link type="danger" @click="handleDelete(s)">
                  <el-icon><DeleteOutlined /></el-icon>
                </el-button>
              </LTooltip>
            </div>
          </div>
        </div>

        <div v-else class="market-empty">
          <el-icon size="40" class="mb-3 opacity-40"><InboxOutlined /></el-icon>
          <div class="market-empty__title">暂无已添加的 MCP 服务器</div>
        </div>
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
    <LDialog v-model="sourceVisible" title="MCP 来源设置" width="520px" align-center destroy-on-close>
      <div class="source-list" v-if="sourceConfig">
        <div class="source-item">
          <div>
            <div class="source-item__name">内置推荐</div>
            <div class="source-item__desc">官方策展、可一键安装，始终开启</div>
          </div>
          <el-switch :model-value="true" disabled />
        </div>
        <div v-for="o in sourceConfig.online" :key="o.key" class="source-item">
          <div>
            <div class="source-item__name">{{ o.name }}</div>
            <div class="source-item__desc">在线第三方仓库检索</div>
          </div>
          <el-switch :model-value="sourceState[o.key]"
            @update:model-value="(v) => (sourceState[o.key] = !!v)" />
        </div>
      </div>
      <template #footer>
        <el-button @click="sourceVisible = false">取消</el-button>
        <el-button type="primary" :loading="sourceSaving" @click="saveSourceConfig">保存</el-button>
      </template>
    </LDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {isAdmin, message} from '@repo/core'
import { ElMessageBox } from 'element-plus';
import {
  SearchOutlined, PlusOutlined, SettingsOutlined, LockOutlined, DeleteOutlined,
  EditOutlined, InboxOutlined, ArrowBackOutlined, WifiTetheringOutlined,
} from '@vicons/material'
import { mcpApi } from '@/services/javaApi'
import PluginIcon from '@/components/ui/PluginIcon.vue'
import LTooltip from '@/components/ui/LTooltip.vue'
import LDialog from '@/components/ui/LDialog.vue'
import McpDetailDialog from './McpDetailDialog.vue'
import McpServerFormDialog from './McpServerFormDialog.vue'

const admin = ref(isAdmin())

const view = ref<'market' | 'manage'>('market')

// 数据
const builtinList = ref<any[]>([])
const boundList = ref<any[]>([])
const loadingInitial = ref(false)

// 市场浏览
const FEATURED = '精选'
const activeTab = ref<string>(FEATURED)
const collapsed = ref<Set<string>>(new Set())

const labels = computed<string[]>(() => {
  const order: string[] = []
  const seen = new Set<string>()
  builtinList.value.forEach((c) => (c.labels || []).forEach((l: string) => {
    if (!seen.has(l)) { seen.add(l); order.push(l) }
  }))
  return order
})
const tabs = computed(() => [FEATURED, ...labels.value].slice(0, 7))

function firstLabel(c: any) {
  return c.labels?.length ? c.labels[0] : '其它'
}
const groups = computed(() => {
  if (activeTab.value === FEATURED) {
    return labels.value
      .map((l) => ({ cat: l, items: builtinList.value.filter((c) => firstLabel(c) === l) }))
      .filter((g) => g.items.length)
  }
  const l = activeTab.value
  return [{ cat: l, items: builtinList.value.filter((c) => c.labels?.includes(l)) }]
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

// 搜索
const keyword = ref('')
const searching = ref(false)
const onlineResults = ref<any[]>([])
const hasKeyword = computed(() => keyword.value.trim() !== '')
const searchBuiltin = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return []
  return builtinList.value.filter(
    (c) => c.name.toLowerCase().includes(k) || c.description.toLowerCase().includes(k))
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  runSearch()
}
function handleClear() {
  keyword.value = ''
  onlineResults.value = []
  searching.value = false
}
async function runSearch() {
  const k = keyword.value.trim()
  if (!k) { handleClear(); return }
  searching.value = true
  try {
    const res = await mcpApi.online(k)
    onlineResults.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    console.error('MCP 在线检索失败:', e)
    onlineResults.value = []
  } finally {
    searching.value = false
  }
}

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
    message.success(`已添加「${card.name}」`)
    await loadBound()
    if (card.requiresKey) {
      message.warning('该服务器需要 API Key，请在管理中编辑补充环境变量')
    } else if (card.requiresConfig) {
      message.warning('请在管理中编辑确认授权目录等配置')
    }
  } catch (e: any) {
    message.error(e?.message || '添加失败')
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
      message.success('已保存')
    } else {
      await mcpApi.create(data)
      message.success('已添加')
    }
    formVisible.value = false
    await loadBound()
  } catch (e: any) {
    message.error(e?.message || '保存失败')
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
    message.error(e?.message || '操作失败')
  }
}
async function handleTest(s: any) {
  testingId.value = s.mcp_server_id
  try {
    const res = await mcpApi.testConnection({ mcp_server_id: s.mcp_server_id, name: s.name, transport: s.transport })
    if (res?.data?.success) {
      message.success(`连接成功，发现 ${res.data.tools?.length || 0} 个工具`)
      await loadBound()
    } else {
      message.error(res?.data?.error || '连接失败')
    }
  } catch (e: any) {
    message.error(e?.message || '连接失败')
  } finally {
    testingId.value = ''
  }
}
async function handleDelete(s: any) {
  try {
    await ElMessageBox.confirm(`确定删除 MCP「${s.name}」？`, '删除确认', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await mcpApi.delete(s.mcp_server_id)
    message.success('已删除')
    await loadBound()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}
function switchManage() {
  view.value = 'manage'
}

function transportLabel(t: any) {
  if (!t) return '未配置'
  if (t.type === 'stdio') return `stdio · ${t.command || ''}`
  return `${(t.type || '').toUpperCase()} · ${t.url || ''}`
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
    message.error(e?.message || '加载来源失败')
  }
}
async function saveSourceConfig() {
  sourceSaving.value = true
  try {
    await mcpApi.updateCatalogConfig(sourceState.value)
    message.success('来源设置已保存')
    sourceVisible.value = false
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    sourceSaving.value = false
  }
}

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

/* ===== 顶栏 ===== */
.market-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0 16px;
}
.market-topbar__search {
  width: 280px;
  max-width: 42%;
}
.manage-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ===== 分类标签 ===== */
.market-tabs {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow-x: hidden;
  white-space: nowrap;
  padding: 2px 2px 10px;
  border-bottom: 1px solid var(--el-border-color);
  margin-bottom: 14px;
}
.market-tab {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding-bottom: 6px;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
  flex: none;
}
.market-tab:hover { color: var(--el-text-color-primary); }
.market-tab.active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
  font-weight: 600;
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

/* ===== 网格 / 单元 ===== */
.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 12px;
}
.market-cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 var(--mp-radius-lg, 14px)：--mp-* 来自未引入的 modern-polish.css，是空令牌，
     收敛到 --el-radius-lg 档（14px 距 12/16 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  min-width: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.market-cell:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
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

/* ===== 空态 ===== */
.market-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 16px;
  color: var(--el-text-color-secondary);
}
.market-empty__icon { width: 40px; height: 40px; margin-bottom: 12px; opacity: 0.45; }
.market-empty__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.market-empty__hint { font-size: 12px; margin-top: 4px; }

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

/* 键盘焦点可见性：分类页签 / 分组头 / 市场单元 / 已装条目主区都是带 @click 的 div
   （不是可聚焦控件），浏览器不给默认焦点环。
   四者原有 cursor: pointer 都已在上面声明（.market-cell 走 .market-cell--clickable），
   不重复写。环用主色 12% —— 本文件没有任何写死的深色底，底色全走令牌，
   深浅两套主题下都只是一档主色描边，12% 足够可见。 */
.market-tab,
.market-group-head,
.market-cell,
.manage-card__main {
  outline: none;
}

.market-tab:focus-visible,
.market-group-head:focus-visible,
.market-cell:focus-visible,
.manage-card__main:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 注意：本文件不在 A 段清单内，所以 .market-tab / .market-group-arrow（折叠箭头旋转）/
   .market-cell / .manage-card 自带的 transition 未做 reduced-motion 降级，
   按「照清单做、不自行扩范围」的约定留待下一轮。 */
</style>
