<!--
  模板库资产列表（Variant A：左侧卡片列表右键菜单 + 右侧标签页工作台）

  布局结构：
    - 顶栏：模板列表页标题 + 来源筛选 / 关键词搜索 + 新建模板 / 同步来源
    - 左栏：模板卡片列表，整张卡片支持右键菜单（hiprint → 进入设计器/编辑/删除，
      message/paper → 仅预览）；左键单击选中卡片激活右侧工作区页签。
    - 右栏：ReTabs 多标签工作区，每个页签打开一个模板的预览/设计器，页签本身
      也支持右键菜单（重命名/关闭/关闭其他/关闭全部）
-->
<template>
  <div class="tpl">
    <!-- ==================== 顶栏 ==================== -->
    <header class="tpl-header">
      <div class="tpl-header__left">
        <h1 class="tpl-header__title">模板库</h1>
        <span class="tpl-header__count">共 <b>{{ total }}</b> 个模板</span>
      </div>
      <div class="tpl-header__right">
        <ReSelect
          v-model="query.source"
          placeholder="来源全量"
          clearable
          class="tpl-search"
          :options="sourceOptions"
          @change="goto(1)"
        />
        <ReInput
          v-model="query.keyword"
          placeholder="搜索模板名称 / 副标题"
          clearable
          class="tpl-search"
          @keyup.enter="goto(1)"
        />
        <ReButton type="primary" @click="openCreate">
          <ReIcon name="Plus" :size="12" />
          新建模板
        </ReButton>
        <ReButton :loading="syncing" @click="syncAll" :disabled="syncing">
          <ReIcon name="RefreshLeft" :size="12" />
          同步来源
        </ReButton>
        <span class="tpl-header__synced" v-if="syncCount">
          来源 <b>{{ sourceCountText }}</b>
        </span>
      </div>
    </header>

    <!-- ==================== 内容区 ==================== -->
    <div class="tpl-body">
      <!-- 左侧卡片列表 -->
      <div class="tpl-left">
        <ReTable
          ref="tableRef"
          class="tpl-table"
          table-id="template-library"
          :loader="loadTemplates"
          :params="query"
          :columns="columns"
          row-key="id"
          :layout-table="{ fill: true }"
          :context-menu="contextMenu"
          show-selection
          stripe
          :page-sizes="[10, 20, 50, 100]"
          v-model:page="query.page"
          v-model:page-size="query.pageSize"
          @row-click="onRowClick"
          @selection-change="onSelectionChange"
          @context-menu-select="onTableMenuSelect"
          @search="goto(1)"
          @search-reset="goto(1)"
        >
          <template #toolbar>
            <span class="tpl-toolbar-selected" v-if="selectedCount">已选 {{ selectedCount }} 项</span>
            <ReButton text type="danger" icon="Delete" :disabled="!!busyKey" @click="batchRemove">批量删除</ReButton>
            <ReButton text icon="RefreshLeft" @click="clearSelection">清空选择</ReButton>
          </template>

          <!-- 模板名称 + 副标题 -->
          <template #name="{ row }: { row: TemplateInfo }">
            <div class="tpl-dev">
              <div class="tpl-dev__top">
                <span class="tpl-dev__name" :title="row.name">{{ row.name }}</span>
                <el-tag :type="statusMeta(row.status).type" size="small" effect="plain">
                  {{ statusMeta(row.status).label }}
                </el-tag>
              </div>
              <div class="tpl-dev__code">{{ row.subtitle || '—' }}</div>
            </div>
          </template>

          <!-- 类型 -->
          <template #type="{ row }: { row: TemplateInfo }">
            <span class="tpl-cell">{{ typeLabel(row.type) }}</span>
          </template>

          <!-- 来源 -->
          <template #source="{ row }: { row: TemplateInfo }">
            <span class="tpl-cell">{{ sourceLabel(row.source) }}</span>
          </template>

          <!-- 语言 -->
          <template #language="{ row }: { row: TemplateInfo }">
            <span class="tpl-cell">{{ languageLabel(row.language) }}</span>
          </template>

          <!-- 状态列：仅占位（右键/双击除设计外操作） -->
          <template #status="{ row }: { row: TemplateInfo }">
            <el-tag :type="statusMeta(row.status).type" size="small" effect="plain">
              {{ statusMeta(row.status).label }}
            </el-tag>
          </template>
        </ReTable>

        <!-- 底部信息条 -->
        <footer class="tpl-bar">
          <div class="tpl-bar__info">
            <span class="tpl-bar__hint">右键模板卡打开操作菜单</span>
          </div>
          <div class="tpl-bar__right">
            <span class="tpl-bar__op">每页 {{ query.pageSize }} 条</span>
          </div>
        </footer>
      </div>

      <!-- 右侧标签页工作台 -->
      <div class="tpl-right">
        <ReTabs
          v-model="activeTab"
          :tabs="tabs"
          :context-menu="tabContextMenu"
          :closable="true"
          :show-close-all="true"
          empty-text="从左侧选择模板，右键打开功能"
          @close="closeTab"
          @context-command="onTabCommand"
          @close-all="closeAllTabs"
        />
      </div>
    </div>

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
  </div>
</template>

<script setup lang="ts">
/**
 * 模板库资产列表页。
 *
 * 布局：左侧卡片列表（右键菜单：进入设计器/编辑/删除，消息/组卷来源只读预览）+
 * 右侧多标签工作区（ReTabs：每个页签一个模板的预览/设计器，页签可右键关闭/关闭其他/关闭全部）。
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, EditPen, MagicStick } from '@element-plus/icons-vue'
import ReDialog from '@repo/ui/re-dialog'
import ReIcon from '@repo/ui/re-icon'
import ReInput from '@repo/ui/re-input'
import ReButton from '@repo/ui/re-button'
import ReSelect from '@repo/ui/re-select'
import ReTable from '@repo/ui/re-table'
import ReTabs from '@repo/ui/re-tabs'
import type {
  RePageResult,
  ReTableColumn,
  ReTableContextMenuContext,
  ReTableContextMenuItem,
  ReTableLoadParams
} from '@repo/ui/re-table'
import type { ReTabsItem, ReTabsContextItem } from '@repo/ui/re-tabs'

import { templateApi } from '../api/templateApi'
import type {
  TemplateInfo,
  TemplateLanguage,
  TemplateSource,
  TemplateStatus,
  TemplateType
} from '../types/template'
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

const tableRef = ref<{ reload: () => void; goto: (page?: number) => void; clearAllSelection: () => void } | null>(null)
const rows = ref<TemplateInfo[]>([])
const loading = ref(false)
const saving = ref(false)
const busyKey = ref<string | null>(null)
const total = ref(0)
const selectedRows = ref<TemplateInfo[]>([])

// ==================== 来源同步 ====================
/** 来源下拉选项 */
const sourceOptions = computed(() =>
  Object.entries(tplSourceLabels).map(([value, label]) => ({ label, value }))
)
/** 正在同步中 */
const syncing = ref(false)
/** 已同步来源的累计模板数（每献同步后回显） */
const syncCount = ref(0)
/** 来源同步描述文本 */
const sourceCountText = computed(() =>
  syncCount.value ? `已同步 ${syncCount.value} 个` : ''
)
/** 来源同步计数：source -> count */
const sourceCount = ref<Record<string, number>>({})

/** 加载来源同步信息 */
async function loadSyncSources() {
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
async function syncAll() {
  syncing.value = true
  try {
    const result = await templateApi.syncAll()
    for (const [source, count] of Object.entries(result)) {
      sourceCount.value[source] = count
    }
    syncCount.value = Object.values(sourceCount.value).reduce((sum, c) => sum + c, 0)
    goto(1)
    loadSyncSources()
  } catch {
    ElMessage.error('来源同步失败')
  } finally {
    syncing.value = false
  }
}

/** 页面初始化：拉取来源同步信息 */
onMounted(async () => {
  await loadSyncSources()
})

// ==================== 查询参数 ====================
/** 查询参数 = ReTable params（分页 + 内置搜索区） */
const query = reactive<Record<string, any>>({
  keyword: '',
  source: '',
  page: 1,
  pageSize: 20
})

/** ReTable 页码翻页 / 搜索重置 */
function goto(page?: number) {
  if (page) query.page = page
  loadTemplates({ page: query.page, pageSize: query.pageSize })
}

// ==================== 新增 / 编辑弹窗 ====================
/** 新增 / 编辑弹窗 */
const formVisible = ref(false)
const formTitle = ref('')
const editingId = ref('')
const formRef = ref<Record<string, any> | null>(null)
const form = ref<Partial<TemplateInfo>>({})

// ==================== 列表列定义 ====================
/** 表格列定义：名称（左）/ 语言 / 类型 / 来源 / 状态 */
const columns: ReTableColumn[] = [
  { prop: 'name', label: '模板', slot: 'name', minWidth: 260 },
  { prop: 'language', label: '语言', slot: 'language', width: 150 },
  { prop: 'type', label: '类型', slot: 'type', width: 130 },
  { prop: 'source', label: '来源', slot: 'source', width: 110 },
  { prop: 'status', label: '状态', slot: 'status', width: 120 }
]

// ==================== 通行：卡片行右键菜单 ====================
/** 卡片行右键菜单：进入设计器 / 编辑 / 删除 */
const tableMenu: ReTableContextMenuItem[] = [
  { key: 'design', label: '进入设计器', icon: MagicStick },
  { key: 'edit', label: '编辑模板', icon: EditPen },
  { key: 'remove', label: '删除模板', icon: Delete, divided: true }
]

/** 行右键菜单提供者：消息 / 组卷来源只读，绘制来源可进入设计器 / 编辑 / 删除 */
function contextMenu(ctx: ReTableContextMenuContext): ReTableContextMenuItem[] {
  const row = ctx.row as unknown as TemplateInfo
  if (row.source === 'hiprint') return tableMenu
  return [
    { key: 'preview', label: '预览', icon: MagicStick }
  ]
}

// ==================== 右侧工作区：页签 ====================
/** 当前激活的页签 name */
const activeTab = ref('')
const tabs = ref<ReTabsItem[]>([])

/** 页签右键菜单：关闭 / 关闭其他 / 关闭全部 */
const tabContextMenu: ReTabsContextItem[] = [
  { key: 'close', label: '关闭' },
  { key: 'close-other', label: '关闭其他' },
  { key: 'close-all', label: '关闭全部' }
]

/** 添加页签（左侧卡片右键或左键单击时） */
function addTab(row: TemplateInfo): void {
  const id = `${row.id}`
  if (tabs.value.some(t => t.name === id)) {
    activeTab.value = id
    return
  }
  tabs.value.push({
    name: id,
    label: row.name,
    disabled: false,
    closable: true
  })
  activeTab.value = id
}

/** 关闭页签 */
function closeTab(name: string): void {
  tabs.value = tabs.value.filter(t => t.name !== name)
  if (activeTab.value === name && tabs.value.length > 0) {
    activeTab.value = tabs.value[tabs.value.length - 1].name
  } else if (tabs.value.length === 0) {
    activeTab.value = ''
  }
}

/** 关闭全部页签 */
function closeAllTabs(): void {
  tabs.value = []
  activeTab.value = ''
}

/** 页签右键菜单：关闭 / 关闭其他 / 关闭全部 */
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
      break
    case 'close-all':
      closeAllTabs()
      break
  }
}

// ==================== 行操作 ====================
/** 行点击 */
function onRowClick(row: Record<string, unknown>): void {
  addTab(row as unknown as TemplateInfo)
}

/** 右键菜单选中：ctx.row 就是被右键的模板 */
function onTableMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void {
  const row = ctx.row as unknown as TemplateInfo
  switch (item.key) {
    case 'design':
      addTab(row)
      router.push({ name: 'TemplateDesigner', params: { id: row.id }, query: { mode: 'design' } })
      break
    case 'edit':
      openEdit(row)
      break
    case 'remove':
      removeTemplate(row)
      break
    case 'preview':
      addTab(row)
      router.push({ name: 'TemplatePreview', params: { id: row.id } })
      break
  }
}

/** 选择变化 */
function onSelectionChange(rows: Record<string, unknown>[]): void {
  selectedRows.value = rows as unknown as TemplateInfo[]
}
const selectedCount = computed(() => selectedRows.value.length)

/** 清空选择 */
function clearSelection(): void {
  tableRef.value?.clearAllSelection()
}

// ==================== 新增 / 编辑 ====================
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
      await templateApi.update(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await templateApi.add(payload)
      ElMessage.success('新增成功')
    }
    formVisible.value = false
    await goto(1)
  } catch (err) {
    ElMessage.error(String(err))
  } finally {
    saving.value = false
  }
}

// ==================== 删除 ====================
/** 删除模板（行右键菜单的删除） */
async function removeTemplate(row: TemplateInfo): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.name}」？`, '删除', {
      type: 'warning'
    })
    await templateApi.remove(row.id)
    ElMessage.success('删除成功')
    await goto(1)
  } catch (err) {
    if (String(err) !== 'Error: cancel') ElMessage.error(String(err))
  }
}

/** 批量删除（受限 busyKey，避免连点打乱台账） */
async function batchRemove(): Promise<void> {
  if (!selectedCount.value || busyKey.value) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedCount.value} 个模板？`, '删除', { type: 'warning' })
    busyKey.value = 'batch'
    const ids = selectedRows.value.map(r => r.id)
    await Promise.all(ids.map(id => templateApi.remove(id)))
    ElMessage.success('删除成功')
    await goto(1)
  } catch (err) {
    if (String(err) !== 'Error: cancel') ElMessage.error(String(err))
  } finally {
    busyKey.value = null
  }
}

// ==================== 加载 ====================
/** ReTable loader：负责按 page / pageSize / params 取后端分页 */
async function loadTemplates({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true
  try {
    const res = await templateApi.page({
      keyword: ((params?.keyword as string) ?? query.keyword as string) || undefined,
      source: query.source || undefined,
      page,
      size: pageSize as number
    })
    const records = Array.isArray(res?.records) ? res.records : []
    // 落盘，给 ReTable 挂接的 ReTableContextMenuItem 使用
    rows.value = records as unknown as TemplateInfo[]
    return { total: Number(res?.total ?? 0), data: records as unknown as Record<string, unknown>[] }
  } catch (err) {
    ElMessage.error(String(err))
    return { total: 0, data: [] }
  } finally {
    loading.value = false
  }
}

/** 搜索：ReTable params 自带 keyword 条件，翻页即可 */

// ==================== 字典 ====================
/** 语言下拉选项 */
const languageOptions = computed(() =>
  Object.entries(tplLanguageLabels).map(([value, label]) => ({ label, value }))
)
/** 类型下拉选项 */
const typeOptions = computed(() =>
  Object.entries(tplTypeLabels).map(([value, label]) => ({ label, value }))
)
</script>

<style lang="scss" scoped>
.tpl {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

.tpl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tpl-header__left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.tpl-header__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tpl-header__count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tpl-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tpl-search {
  width: 220px;
}

.tpl-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ================= 左侧卡片区 ================= */
.tpl-left {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--bg-container);
}

.tpl-table {
  flex: 1;
  overflow: auto;
  background: var(--bg-container);
}

.tpl-table :deep(.vxe-body--row) {
  cursor: pointer;
}

.tpl-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 36px;
  background: var(--el-bg-color-page);
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tpl-bar__hint {
  opacity: 0.8;
}

.tpl-bar__right {
  display: flex;
  gap: 16px;
}

.tpl-bar__op {
  white-space: nowrap;
}

.tpl-toolbar-selected {
  margin-right: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.tpl-dev {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tpl-dev__top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tpl-dev__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.tpl-dev__code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.tpl-cell {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* ================= 右侧工作区 ================= */
.tpl-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-elevated);
}

.tpl-right :deep(.re-tabs) {
  flex: 1;
}
.tpl-right :deep(.re-tabs__pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tpl-right :deep(.re-tabs__body) {
  flex: 1;
  overflow: auto;
}
.tpl-right :deep(.re-tabs__content) {
  height: 100%;
}

/* 设计师/预览页面的占位框架：等路由挂载的区域 */
.tpl-right .tpl-iframe {
  flex: 1;
  border: none;
  background: var(--bg-container);
  border-radius: 0 0 8px 8px;
}

@media (max-width: 768px) {
  .tpl-left {
    width: 240px;
  }
  .tpl-header__right {
    gap: 6px;
  }
}
</style>
