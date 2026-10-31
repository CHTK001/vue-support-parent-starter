<!--
  模板库 · 档案轨（左） + 多页签工作台（右）

  布局：
    - 左栏 286px 卡片轨：标题 + 数量、搜索 + 图标按钮、来源筛选；
      条目为细线/强调条样式，滚动到底自动追加下一页；
      整条右键：绘制来源 → 进入设计器 / 编辑 / 删除，消息、组卷来源 → 仅预览；
      左键单击选中并在右侧打开对应页签。
    - 右栏 ReTabs 工作台：页签标题取模板名称，页签右键关闭 / 关闭其他 / 关闭全部；
      面板展示模板详情（来源、类型、语言、状态、创建/修改信息、备注）与图标操作。

  说明：本页没有整体顶栏，所有操作都收在左栏头部与右栏详情头部，按钮仅用图标 + 悬浮提示。
-->
<template>
  <div class="tpl">
    <!-- ==================== 左栏：模板轨 ==================== -->
    <aside class="rail">
      <header class="rail__head">
        <div class="rail__title">
          <h1>模板库</h1>
          <span class="rail__count">{{ total }}</span>
        </div>

        <div class="rail__tools">
          <ReInput
            v-model="query.keyword"
            size="small"
            clearable
            prefix-icon="Search"
            placeholder="搜索名称 / 副标题"
            @keyup.enter="reload"
            @clear="reload"
          />
          <ReButton
            text
            :show-text="false"
            icon="Plus"
            tip="新建模板"
            :icon-size="28"
            @click="openCreate"
          />
          <ReButton
            text
            :show-text="false"
            icon="RefreshLeft"
            tip="同步来源"
            :icon-size="28"
            :loading="syncing"
            :disabled="syncing"
            @click="syncAll"
          />
        </div>

        <div class="rail__filters">
          <ReSelect
            v-model="query.source"
            size="small"
            clearable
            placeholder="来源全量"
            :options="sourceOptions"
            @change="reload"
          />
        </div>

        <!-- 页面操作：打印机管理 / 调用日志（仅图标 + 悬浮提示） -->
        <div class="rail__actions">
          <ReButton
            text
            :show-text="false"
            icon="Printer"
            tip="打印机管理"
            :icon-size="28"
            @click="openPrinterManage"
          />
          <ReButton
            text
            :show-text="false"
            icon="Document"
            tip="调用日志"
            :icon-size="28"
            @click="openLogs"
          />
        </div>
      </header>

      <div ref="listRef" class="rail__list" @scroll.passive="onListScroll">
        <div v-if="loading && !rows.length" class="rail__state">加载中…</div>
        <div v-else-if="!rows.length" class="rail__state">没有匹配的模板</div>
        <template v-else>
          <div
            v-for="row in rows"
            :key="row.id"
            class="entry"
            :class="{ 'is-active': activeTab === String(row.id) }"
            tabindex="0"
            @click="addTab(row)"
            @keydown.enter="addTab(row)"
            @contextmenu.prevent="openRowMenu($event, row)"
          >
            <span class="entry__mark" :style="{ '--tpl-tint': sourceTint(row.source) }">
              {{ initials(row.name) }}
            </span>
            <span class="entry__main">
              <span class="entry__name" :title="row.name">{{ row.name }}</span>
              <span class="entry__meta">
                {{ sourceLabel(row.source) }} · {{ typeLabel(row.type) }}
              </span>
            </span>
            <span class="entry__dot" :class="`is-${row.status}`" :title="statusMeta(row.status).label" />
          </div>

          <div class="rail__more">
            <span v-if="loadingMore" class="rail__spinner" />
            {{ loadingMore ? '加载中…' : hasMore ? '继续滚动加载' : '已全部加载' }}
          </div>
        </template>
      </div>

      <footer class="rail__foot">
        <span>{{ syncCount ? `已同步 ${syncCount} 个` : '模板来自多来源同步' }}</span>
        <span class="rail__foot-hint">右键条目操作</span>
      </footer>
    </aside>

    <!-- ==================== 右栏：多页签工作台 ==================== -->
    <section class="deck">
      <ReTabs
        v-model="activeTab"
        :tabs="tabs"
        :context-menu="tabContextMenu"
        :closable="true"
        :show-close-all="true"
        empty-text="从左侧选择模板"
        @close="closeTab"
        @context-command="onTabCommand"
        @close-all="closeAllTabs"
      >
        <template #default="{ tab }">
          <!-- 模板详情（工作区） -->
          <div v-if="isSheetTab(tab.name)" class="work">
            <div v-if="tabRows[tab.name]">
            <article class="work__sheet">
            <header class="work__head">
              <span class="work__mark" :style="{ '--tpl-tint': sourceTint(tabRows[tab.name].source) }">
                {{ initials(tabRows[tab.name].name) }}
              </span>
              <div class="work__title">
                <h2>{{ tabRows[tab.name].name }}</h2>
                <p>{{ tabRows[tab.name].subtitle || '未填写副标题' }}</p>
              </div>
              <div class="work__acts">
                <ReButton
                  text
                  :show-text="false"
                  icon="View"
                  tip="预览模板"
                  :icon-size="30"
                  @click="openPreview(tabRows[tab.name])"
                />
                <template v-if="tabRows[tab.name].source === 'hiprint'">
                  <ReButton
                    text
                    :show-text="false"
                    icon="EditPen"
                    tip="编辑模板信息"
                    :icon-size="30"
                    @click="openEdit(tabRows[tab.name])"
                  />
                  <ReButton
                    text
                    :show-text="false"
                    icon="MagicStick"
                    tip="进入设计器"
                    :icon-size="30"
                    @click="openDesigner(tabRows[tab.name])"
                  />
                </template>
              </div>
            </header>

            <div class="work__chips">
              <span class="chip">{{ sourceLabel(tabRows[tab.name].source) }}</span>
              <span class="chip">{{ typeLabel(tabRows[tab.name].type) }}</span>
              <span class="chip">{{ languageLabel(tabRows[tab.name].language) }}</span>
              <el-tag :type="statusMeta(tabRows[tab.name].status).type" size="small" effect="plain" round>
                {{ statusMeta(tabRows[tab.name].status).label }}
              </el-tag>
            </div>

            <dl class="work__meta">
              <div><dt>创建者</dt><dd>{{ tabRows[tab.name].creator || '—' }}</dd></div>
              <div><dt>最后修改</dt><dd>{{ tabRows[tab.name].modifier || '—' }}</dd></div>
              <div><dt>创建时间</dt><dd>{{ formatTime(tabRows[tab.name].createdAt) }}</dd></div>
              <div><dt>更新时间</dt><dd>{{ formatTime(tabRows[tab.name].updatedAt) }}</dd></div>
              <div v-if="tabRows[tab.name].sourceId">
                <dt>来源记录</dt>
                <dd class="mono">{{ tabRows[tab.name].sourceId }}</dd>
              </div>
              <div v-if="tabRows[tab.name].providerId">
                <dt>来源提供方</dt>
                <dd class="mono">{{ tabRows[tab.name].providerId }}</dd>
              </div>
            </dl>

            <section v-if="tabRows[tab.name].remark" class="work__remark">
              <h3>备注</h3>
              <p>{{ tabRows[tab.name].remark }}</p>
            </section>

            <p class="work__note">
              {{
                tabRows[tab.name].source === 'hiprint'
                  ? '绘制来源模板可在设计器中拖拽编辑，保存后立即生效。'
                  : '消息 / 组卷来源由对应模块同步生成，此处只读，仅支持预览。'
              }}
            </p>
            </article>
            </div>
          </div>

          <!-- 预览页签 -->
          <div v-else-if="isPreviewTab(tab.name)" class="work">
            <TemplatePreviewView :template-id="tplIdOf(tab.name)" />
          </div>

          <!-- 设计器页签 -->
          <div v-else-if="isDesignTab(tab.name)" class="work">
            <TemplateDesigner
              :template-id="tplIdOf(tab.name)"
              @back="switchToSheet"
              @preview="openDesignPreview"
            />
          </div>
        </template>

        <template #empty>
          <div class="deck-empty">
            <span class="deck-empty__mark">
              <ReIcon name="Document" :size="22" />
            </span>
            <b>还没有打开模板</b>
            <span>从左栏选择模板，或右键条目直接进入设计器 / 预览</span>
          </div>
        </template>
      </ReTabs>
    </section>

    <!-- 条目右键菜单 -->
    <ReContextMenu ref="ctxMenu" :items="ctxItems" @select="onCtxSelect" />

    <!-- 新建 / 编辑弹窗 -->
    <ReDialog v-model="formVisible" :title="formTitle" width="520px" @confirm="onFormConfirm">
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="模板名称" required>
          <el-input v-model="form.name" placeholder="例如 出库单" maxlength="64" />
        </el-form-item>
        <el-form-item label="模板副标题">
          <el-input v-model="form.subtitle" placeholder="例如 仓库出库单据" maxlength="128" />
        </el-form-item>
        <el-form-item label="模板语言" required>
          <el-select v-model="form.language" class="w-full">
            <el-option v-for="item in languageOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板类型" required>
          <el-select v-model="form.type" class="w-full">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="onFormConfirm">确定</ReButton>
      </template>
    </ReDialog>

    <!-- 打印参数弹窗：选好打印机和份数后，只有「确定打印」才会发起 -->
    <ReDialog v-model="printDialogVisible" title="打印" width="400px" @confirm="onPrintConfirm">
      <el-form :model="printParams" label-width="80px">
        <el-form-item label="打印机" required>
          <ReSelect v-model="printParams.printer" :options="printerOptions" placeholder="选择打印机" />
        </el-form-item>
        <el-form-item label="份数">
          <el-input-number v-model="printParams.copies" :min="1" :max="99" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="printDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="printing" @click="onPrintConfirm">确定打印</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 模板库资产列表页（档案轨布局）。
 *
 * <p>左栏是一条可滚动加载的模板轨，右栏是 ReTabs 多页签工作台：
 * 页签只保存「打开了哪个模板」，面板内容由 tabRows 快照驱动，
 * 因此列表翻页、筛选、增删改之后已打开的页签仍然能正常渲染。</p>
 *
 * <p>业务保留：来源同步、分页查询（改为滚动追加）、新建 / 编辑 / 删除、
 * 进入设计器 / 预览、页签关闭与右键菜单；不再有表格多选与批量删除。</p>
 */
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReIcon from '@repo/ui/re-icon'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import ReTabs from '@repo/ui/re-tabs'
import ReContextMenu from '@repo/ui/re-context-menu'
import type { ReContextMenuItem } from '@repo/ui/re-context-menu'
import type { ReTabsContextItem, ReTabsItem } from '@repo/ui/re-tabs'

import { templateApi } from '../api/templateApi'
import type { TemplateInfo, TemplateStatus, LogRecord, PrinterConfig } from '../types/template'
import TemplatePreviewView from '../views/TemplatePreviewView.vue'
import TemplateDesigner from '../views/TemplateDesigner.vue'
import {
  tplLanguageLabels,
  tplTypeLabels,
  tplSourceLabels,
  languageLabel,
  sourceLabel,
  statusMeta,
  typeLabel
} from '../utils/i18n'

const router = useRouter()

// ==================== 列表状态 ====================
/** 已加载的模板（滚动追加） */
const rows = ref<TemplateInfo[]>([])
/** 服务端总数（决定是否还有下一页） */
const total = ref(0)
/** 是否还有下一页 */
const hasMore = computed(() => rows.value.length < total.value)
/** 首页加载中 */
const loading = ref(false)
/** 追加加载中 */
const loadingMore = ref(false)
/** 已加载到第几页 */
const page = ref(1)
/** 每页条数 */
const pageSize = 20
/** 请求序号：重置查询时丢弃在途的旧响应 */
let loadSeq = 0

/** 查询条件（分页由滚动控制，不从外部修改） */
const query = reactive<Record<string, any>>({
  keyword: '',
  source: ''
})

const listRef = ref<HTMLElement | null>(null)

/** 首页 / 重新查询 */
function reload(): void {
  void fetchPage(true)
}

/**
 * 拉取一页数据。
 *
 * @param reset true=从第一页重新加载并替换列表；false=追加下一页
 */
async function fetchPage(reset: boolean): Promise<void> {
  if (!reset && (loading.value || loadingMore.value || !hasMore.value)) return
  const token = ++loadSeq
  const target = reset ? 1 : page.value + 1
  if (reset) loading.value = true
  else loadingMore.value = true
  try {
    const res = await templateApi.page({
      keyword: query.keyword.trim() || undefined,
      source: query.source || undefined,
      page: target,
      size: pageSize
    })
    // 期间又发起了新查询：丢弃本次结果
    if (token !== loadSeq) return
    const records = Array.isArray(res?.records) ? res.records : []
    rows.value = reset ? (records as unknown as TemplateInfo[]) : [...rows.value, ...(records as unknown as TemplateInfo[])]
    total.value = Number(res?.total ?? rows.value.length)
    page.value = target
    if (reset && listRef.value) listRef.value.scrollTop = 0
    await nextTick()
    fillViewport()
  } catch (err) {
    if (token === loadSeq) ElMessage.error(String(err))
  } finally {
    if (token === loadSeq) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

/** 一页填不满可视区时继续追加，避免出现「明明还有数据却滚不动」 */
function fillViewport(): void {
  const el = listRef.value
  if (!el || loading.value || loadingMore.value || !hasMore.value) return
  if (el.scrollHeight <= el.clientHeight + 4) void fetchPage(false)
}

/** 滚动到底部附近自动加载下一页 */
function onListScroll(event: Event): void {
  const el = event.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 64) void fetchPage(false)
}

/** 关键词输入 320ms 防抖后查询 */
let keywordTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => query.keyword,
  () => {
    if (keywordTimer) clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => reload(), 320)
  }
)

// ==================== 来源同步 ====================
/** 来源下拉选项 */
const sourceOptions = computed(() =>
  Object.entries(tplSourceLabels).map(([value, label]) => ({ label, value }))
)
/** 正在同步中 */
const syncing = ref(false)
/** 已同步来源的累计模板数 */
const syncCount = ref(0)
/** 来源同步计数：source -> count */
const sourceCount = ref<Record<string, number>>({})

/** 加载来源同步信息 */
async function loadSyncSources(): Promise<void> {
  try {
    const list = await templateApi.syncSources()
    sourceCount.value = {}
    for (const item of list) {
      sourceCount.value[item.source] = item.count
    }
    syncCount.value = Object.values(sourceCount.value).reduce((sum, c) => sum + c, 0)
  } catch {
    // 来源接口与同步按钮相互独立，不影响列表
  }
}

/** 全量来源同步 */
async function syncAll(): Promise<void> {
  syncing.value = true
  try {
    const result = await templateApi.syncAll()
    for (const [source, count] of Object.entries(result)) {
      sourceCount.value[source] = count
    }
    syncCount.value = Object.values(sourceCount.value).reduce((sum, c) => sum + c, 0)
    reload()
    loadSyncSources()
  } catch {
    ElMessage.error('来源同步失败')
  } finally {
    syncing.value = false
  }
}

/** 页面初始化：拉取来源同步信息 + 首页列表 */
onMounted(async () => {
  await loadSyncSources()
  reload()
})

// ==================== 新增 / 编辑 ====================
const formVisible = ref(false)
const formTitle = ref('')
const editingId = ref('')
const formRef = ref<Record<string, any> | null>(null)
const form = ref<Partial<TemplateInfo>>({})
const saving = ref(false)

function openCreate(): void {
  formTitle.value = '新建模板'
  editingId.value = ''
  form.value = {}
  formVisible.value = true
}

function openEdit(row: TemplateInfo): void {
  formTitle.value = '编辑模板'
  editingId.value = row.id
  form.value = { ...row }
  formVisible.value = true
}

/** 新增/编辑表单提交 */
async function onFormConfirm(): Promise<void> {
  if (!form.value.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      id: editingId.value,
      name: form.value.name,
      subtitle: form.value.subtitle,
      language: form.value.language,
      type: form.value.type,
      status: (form.value.status as TemplateStatus) ?? 'draft',
      remark: form.value.remark
    }
    if (editingId.value) {
      const updated = await templateApi.update(editingId.value, payload)
      ElMessage.success('更新成功')
      patchRow({ ...form.value, ...(updated ?? {}), id: editingId.value } as TemplateInfo)
    } else {
      await templateApi.add(payload)
      ElMessage.success('新增成功')
      reload()
    }
    formVisible.value = false
  } catch (err) {
    ElMessage.error(String(err))
  } finally {
    saving.value = false
  }
}

/**
 * 单条更新后的就地同步：列表行、页签标题、页签面板数据一起改。
 *
 * <p>不做整页重载，避免滚动位置与页签被重置。</p>
 *
 * @param updated 更新后的模板
 */
function patchRow(updated: TemplateInfo): void {
  const index = rows.value.findIndex(r => r.id === updated.id)
  if (index >= 0) rows.value[index] = { ...rows.value[index], ...updated }
  if (tabRows[updated.id]) tabRows[updated.id] = { ...tabRows[updated.id], ...updated }
  const tab = tabs.value.find(t => t.name === String(updated.id))
  if (tab && updated.name) tab.label = updated.name
}

// ==================== 删除 ====================
/** 删除模板 */
async function removeTemplate(row: TemplateInfo): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.name}」？`, '删除', {
      type: 'warning'
    })
    await templateApi.remove(row.id)
    ElMessage.success('删除成功')
    // 已经打开的页签一并关掉，避免留下指向已删除数据的详情
    closeTab(String(row.id))
    reload()
  } catch (err) {
    if (String(err) !== 'Error: cancel') ElMessage.error(String(err))
  }
}

// ==================== 右键菜单 ====================
const ctxMenu = ref<InstanceType<typeof ReContextMenu> | null>(null)
/** 当前右键的模板 */
const ctxRow = ref<TemplateInfo | null>(null)

/** 菜单项：绘制来源可设计/编辑/打印/删除，消息与组卷来源只读 */
const ctxItems = computed<ReContextMenuItem[]>(() => {
  const row = ctxRow.value
  if (!row) return []
  if (row.source === 'hiprint') {
    return [
      { label: '进入设计器', command: 'design', icon: 'MagicStick' },
      { label: '编辑模板', command: 'edit', icon: 'EditPen' },
      { separator: true },
      { label: '预览', command: 'preview', icon: 'View' },
      { label: '打印', command: 'print', icon: 'Printer' },
      { separator: true },
      { label: '删除模板', command: 'remove', icon: 'Delete', danger: true }
    ]
  }
  return [{ label: '预览', command: 'preview', icon: 'View' }]
})

/** 在鼠标位置弹出条目菜单 */
function openRowMenu(event: MouseEvent, row: TemplateInfo): void {
  ctxRow.value = row
  ctxMenu.value?.open(event.clientX, event.clientY)
}

/** 菜单命令分发 */
function onCtxSelect(command: string): void {
  const row = ctxRow.value
  if (!row) return
  switch (command) {
    case 'design':
      openDesigner(row)
      break
    case 'edit':
      openEdit(row)
      break
    case 'remove':
      removeTemplate(row)
      break
    case 'preview':
      openPreview(row)
      break
    case 'print':
      openPrintDialog(row)
      break
  }
}

// ==================== 右侧工作台 ====================
/** 当前激活的页签 name */
const activeTab = ref('')
/** 页签列表 */
const tabs = ref<ReTabsItem[]>([])
/** 页签 -> 模板快照：列表翻页/筛选后已打开的页签仍可渲染 */
const tabRows = reactive<Record<string, TemplateInfo>>({})

/** 页签右键菜单 */
const tabContextMenu: ReTabsContextItem[] = [
  { key: 'close', label: '关闭' },
  { key: 'close-other', label: '关闭其他' },
  { key: 'close-all', label: '关闭全部' }
]

/** 打开（或切换到）模板详情页签 */
function addTab(row: TemplateInfo): void {
  addSheetTab(row)
}

/** 关闭页签 */
function closeTab(name: string): void {
  tabs.value = tabs.value.filter(t => t.name !== name)
  delete tabRows[name]
  if (activeTab.value === name) {
    activeTab.value = tabs.value[tabs.value.length - 1]?.name ?? ''
  }
}

/** 关闭全部页签 */
function closeAllTabs(): void {
  tabs.value = []
  activeTab.value = ''
  Object.keys(tabRows).forEach(key => delete tabRows[key])
}

/** 页签右键命令 */
function onTabCommand(payload: { key: string; tab: ReTabsItem }): void {
  const tab = payload.tab
  if (!tab) return
  switch (payload.key) {
    case 'close':
      closeTab(tab.name)
      break
    case 'close-other':
      tabs.value = [tab]
      activeTab.value = tab.name
      Object.keys(tabRows).forEach(key => {
        if (key !== tab.name) delete tabRows[key]
      })
      break
    case 'close-all':
      closeAllTabs()
      break
  }
}

// ==================== 工作区页签（详情 / 预览 / 设计器） ====================
/** 页签 | 类型：无 `:` 的是模板详情，`:preview` 只读预览，`:design` 设计器 */
function isSheetTab(name: string): boolean { return !name.includes(':') }
function isPreviewTab(name: string): boolean { return name.endsWith(':preview') }
function isDesignTab(name: string): boolean { return name.endsWith(':design') }

/** 页签名字里的模板 ID */
function tplIdOf(name: string): string {
  return name.replace(/:preview$/, '').replace(/:design$/, '')
}

/** 模板详情（必选） */
function addSheetTab(row: TemplateInfo): void {
  const id = String(row.id)
  tabRows[id] = { ...row }
  const existing = tabs.value.find(t => t.name === id)
  if (existing) existing.label = row.name
  else tabs.value.push({ name: id, label: row.name, closable: true })
  activeTab.value = id
}

/** 只读预览页签 */
function addPreviewTab(row: TemplateInfo): void {
  const id = String(row.id)
  const name = `${id}:preview`
  const existing = tabs.value.find(t => t.name === name)
  if (existing) {
    existing.label = row.name
    existing.hint = '预览'
    return
  }
  tabs.value.push({ name, label: row.name, hint: '预览', closable: true })
  activeTab.value = name
}

/** 设计器页签 */
function addDesignTab(row: TemplateInfo): void {
  const id = String(row.id)
  const name = `${id}:design`
  const existing = tabs.value.find(t => t.name === name)
  if (existing) {
    existing.label = row.name
    existing.hint = '设计'
    return
  }
  tabs.value.push({ name, label: row.name, hint: '设计', closable: true })
  activeTab.value = name
}

/** 切换回模板详情（设计器页签返回时的目标） */
function switchToSheet(tabName: string): void {
  const id = tplIdOf(tabName)
  const row = rows.value.find(r => r.id === id) || tabRows[id] || ({} as TemplateInfo)
  addSheetTab(row)
  activeTab.value = id
}

/** 从设计器页签打开预览页签 */
function openDesignPreview(): void {
  const tab = tabs.value.find(t => t.name === activeTab.value)
  if (!tab || !isDesignTab(tab.name)) return
  addPreviewTab({ id: tplIdOf(tab.name), name: tab.label ?? '' } as TemplateInfo)
}

/** 预览（消息 / 组卷来源也走这里） */
function openPreview(row: TemplateInfo): void {
  recordLog(row, 'preview', {})
  addPreviewTab(row)
}

/** 进入设计器（仅绘制来源） */
function openDesigner(row: TemplateInfo): void {
  recordLog(row, 'design', {})
  addDesignTab(row)
}

// ==================== 打印 ====================
/** 当前准备打印的模板 */
const printRow = ref<TemplateInfo | null>(null)
/** 打印弹窗及等待态 */
const printDialogVisible = ref(false)
const printing = ref(false)
/** 打印机列表 */
const printers = ref<PrinterConfig[]>([])
/** 打印参数 */
const printParams = reactive<Record<string, any>>({ printer: '', copies: 1 })
/** 打印机选项 */
const printerOptions = computed(() => printers.value.map(p => ({ label: p.name, value: p.name })))

/** 加载打印机列表（只取一次，弹窗打开时刷新） */
async function loadPrinters(): Promise<void> {
  try {
    printers.value = await templateApi.printerList()
  } catch {
    /* 没有打印机就手动选，不影响其他操作 */
  }
}

/** 打开打印参数弹窗 */
async function openPrintDialog(row: TemplateInfo): Promise<void> {
  printRow.value = row
  if (printers.value.length === 0) await loadPrinters()
  printParams.printer = printers.value.find(p => p.isDefault)?.name ?? ''
  printParams.copies = 1
  printDialogVisible.value = true
}

/** 确认打印：用户点击确定后才请求 */
async function onPrintConfirm(): Promise<void> {
  const row = printRow.value
  if (!row) {
    ElMessage.warning('未指定模板')
    return
  }
  if (!printParams.printer) {
    ElMessage.warning('请选择打印机')
    return
  }
  printing.value = true
  try {
    await templateApi.print(String(row.id), { printer: printParams.printer, copies: printParams.copies })
    recordLog(row, 'print', { printer: printParams.printer, copies: printParams.copies })
    printDialogVisible.value = false
    ElMessage.success(`已发送到「${printParams.printer}」`)
  } catch (err) {
    ElMessage.error(String(err))
  } finally {
    printing.value = false
  }
}

/** 调用日志：预览 / 设计 / 打印 归集到日志页，参数、时间、IP 一并提供 */
function recordLog(row: TemplateInfo, action: 'preview' | 'design' | 'print', parameters: Record<string, any>): void {
  const record: LogRecord = {
    id: String(Date.now()),
    templateId: String(row.id),
    templateName: row.name,
    action,
    parameters,
    time: new Date().toISOString(),
    ip: '127.0.0.1',
    operator: row.creator
  }
  templateApi.log(record).catch(() => {
    /* 日志只负责记录，失败不影响主操作 */
  })
}

// ==================== 页面入口 ====================
function openPrinterManage(): void {
  router.push({ name: 'TemplatePrinter' })
}

function openLogs(): void {
  router.push({ name: 'TemplateLogs' })
}

// ==================== 字典 / 展示 ====================
/** 语言下拉选项 */
const languageOptions = computed(() =>
  Object.entries(tplLanguageLabels).map(([value, label]) => ({ label, value }))
)
/** 类型下拉选项 */
const typeOptions = computed(() =>
  Object.entries(tplTypeLabels).map(([value, label]) => ({ label, value }))
)

/** 来源强调色：与状态语义色一致，暗色主题自动跟随 */
function sourceTint(source: string): string {
  if (source === 'message') return 'var(--el-color-success)'
  if (source === 'paper') return 'var(--el-color-warning)'
  return 'var(--el-color-primary)'
}

/** 名称首字：作为档案轨的色块标记 */
function initials(name: string): string {
  return (name || '?').trim().slice(0, 1)
}

/**
 * 时间格式化：2026-10-31 14:22。
 *
 * @param value 后端时间字段
 */
function formatTime(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<style lang="scss" scoped>
.tpl {
  display: flex;
  gap: 10px;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

/* ==================== 左栏档案轨 ==================== */
.rail {
  display: flex;
  flex: 0 0 286px;
  flex-direction: column;
  width: 286px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.rail__head {
  padding: 12px 12px 9px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rail__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;

  h1 {
    margin: 0;
    font-size: 15px;
    font-weight: 650;
    letter-spacing: 0.01em;
  }
}

.rail__count {
  padding: 0 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 17px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}

.rail__tools {
  display: flex;
  align-items: center;
  gap: 2px;

  :deep(.el-input) {
    flex: 1;
    min-width: 0;
  }
}

.rail__filters {
  margin-top: 8px;

  :deep(.el-select) {
    width: 100%;
  }
}

.rail__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
}

.rail__list {
  flex: 1;
  min-height: 0;
  padding: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.rail__state {
  padding: 26px 0;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.rail__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 12px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
  border-top: 1px solid var(--el-border-color-lighter);
}

.rail__foot-hint {
  white-space: nowrap;
  opacity: 0.8;
}

.rail__more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.rail__spinner {
  width: 11px;
  height: 11px;
  border: 1.5px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: tpl-spin 0.7s linear infinite;
}

@keyframes tpl-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------- 档案条目 ---------- */
.entry {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;

  & + & {
    margin-top: 1px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 9px;
    bottom: 9px;
    left: 0;
    width: 2px;
    background: transparent;
    border-radius: 2px;
    transition: background 0.15s ease;
  }

  &:hover {
    background: var(--el-fill-color-light);
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--el-color-primary-light-7);
  }

  &.is-active {
    background: var(--el-color-primary-light-9);

    &::before {
      background: var(--el-color-primary);
    }

    .entry__name {
      color: var(--el-color-primary);
    }
  }
}

.entry__mark {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 13px;
  font-weight: 650;
  color: var(--tpl-tint);
  background: color-mix(in srgb, var(--tpl-tint) 10%, transparent);
  border-radius: 8px;
}

.entry__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.entry__name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 550;
  line-height: 1.35;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: color 0.15s ease;
}

.entry__meta {
  overflow: hidden;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.entry__dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.is-online {
    background: var(--el-color-success);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 16%, transparent);
  }

  &.is-offline {
    background: var(--el-color-info);
  }

  &.is-draft {
    background: var(--el-color-warning);
  }
}

/* ==================== 右栏工作台 ==================== */
.deck {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.deck-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  padding: 24px;

  b {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.deck-empty__mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 4px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 12px;
  opacity: 0.9;
}

.work {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 18px 20px 24px;
  overflow: auto;
  background: var(--el-bg-color-page);
}

.work__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.work__mark {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 17px;
  font-weight: 700;
  color: var(--tpl-tint);
  background: color-mix(in srgb, var(--tpl-tint) 12%, var(--el-bg-color));
  border-radius: 11px;
}

.work__title {
  flex: 1;
  min-width: 0;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  p {
    margin: 3px 0 0;
    overflow: hidden;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.work__acts {
  display: flex;
  flex: 0 0 auto;
  gap: 2px;
}

.work__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.chip {
  padding: 2px 8px;
  font-size: 11px;
  line-height: 18px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
}

.work__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  background: var(--el-border-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  > div {
    padding: 10px 12px;
    background: var(--el-bg-color);
  }

  dt {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }

  dd {
    margin: 3px 0 0;
    font-size: 13px;
    font-weight: 550;
    word-break: break-all;
  }
}

.work__remark {
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;

  h3 {
    margin: 0 0 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
  }
}

.work__note {
  margin: auto 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
}

@media (max-width: 900px) {
  .rail {
    flex-basis: 240px;
    width: 240px;
  }
}
</style>
