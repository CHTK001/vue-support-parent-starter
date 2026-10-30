<!--
  RePrinter —— 打印机管理面板（独立组件）
  @since 4.0.0.60
  @author CH
  Provides a complete printer management UI:
    - 打印机列表（只显示已接入的打印机）
    - 设置默认打印机（"第三方的打印" 的步进：用哪台机器打，就在这选）
    - 新增/编辑（地址/端口/Token 等第三方的连接参数由该主单维护）
    - 发现打印机（由外部 Agent 发现后的接入列表）
  mode 由宿主决定：
    - "page"  打印机Management 页面（打印机管理页，ReTable 驱动）
    - "selector" 打印机选择（模板设计器的 `打印` 流，让盒子从打印机中挑）
-->
<template>
  <div class="re-printer" :class="`re-printer--${mode}`">
    <!-- ==================== 顶栏 ==================== -->
    <header class="re-printer__header">
      <div class="re-printer__left">
        <h3 class="re-printer__title">
          <ReIcon name="Printer" :size="14" />
          {{ title }}
          <span class="re-printer__count">共 {{ printers.length }} 台</span>
        </h3>
      </div>
      <div class="re-printer__right">
        <template v-if="mode === 'page'">
          <ReButton text @click="onDiscover">发现打印机</ReButton>
          <ReButton type="primary" @click="openForm">
            <ReIcon name="Plus" :size="12" />
            添加打印机
          </ReButton>
        </template>
      </div>
    </header>

    <!-- ==================== 列表（page 模式） ==================== -->
    <ReTable
      v-if="mode === 'page'"
      ref="tableRef"
      class="re-printer__table"
      table-id="printer-manager"
      :loader="loadPrinters"
      :columns="columns"
      row-key="name"
      :layout-table="{ fill: true }"
      show-selection
      stripe
      :page-sizes="[10, 20, 50, 100]"
      v-model:page="page"
      v-model:page-size="pageSize"
      @row-click="onRowClick"
      @context-menu-select="onContextMenu"
    >
      <!-- 打印机名 + 地址 -->
      <template #name="{ row }: { row: PrinterConfig }">
        <div class="re-printer-device">
          <div class="re-printer-device__name">{{ row.name }}</div>
          <div class="re-printer-device__meta">{{ host(row) }}</div>
        </div>
      </template>

      <!-- 类型（模型） -->
      <template #type="{ row }: { row: PrinterConfig }">
        <span class="re-printer-cell">{{ row.type || '—' }}</span>
      </template>

      <!-- 默认（Tag） -->
      <template #isDefault="{ row }: { row: PrinterConfig }">
        <el-tag v-if="row.isDefault" type="success" size="small" effect="light">默认</el-tag>
      </template>

      <!-- 操作 -->
      <template #action="{ row }: { row: PrinterConfig }">
        <div class="re-printer-actions">
          <ReButton text type="primary" @click="onSetDefault(row.name)">设为默认</ReButton>
          <ReButton text @click="onEdit(row)">编辑</ReButton>
          <ReButton text type="danger" @click="onRemove(row.name)">删除</ReButton>
        </div>
      </template>
    </ReTable>

    <!-- ==================== 列表（selector 模式） ==================== -->
    <div v-else class="re-printer__list">
      <div v-if="loading" class="re-printer__empty">加载中...</div>
      <div v-else-if="!printers.length" class="re-printer__empty">
        暂无打印机，请 <ReButton type="primary" text @click="openForm">添加打印机</ReButton> 或
        <ReButton text @click="onDiscover">发现打印机</ReButton>
      </div>
      <div v-else class="re-printer__items">
        <div
          v-for="printer in printers"
          :key="printer.name"
          class="re-printer-item"
          :class="{
            're-printer-item--selected': printer.name === printerName,
            're-printer-item--default': printer.isDefault
          }"
          @click="onSelect(printer.name)"
        >
          <div class="re-printer-item__body">
            <div class="re-printer-item__name">
              <span class="re-printer-item__name-text">{{ printer.name }}</span>
              <el-tag v-if="printer.isDefault" type="success" size="small" effect="light">默认</el-tag>
              <el-tag v-if="printer.address" type="info" size="small" effect="plain">{{ host(printer) }}</el-tag>
            </div>
            <div class="re-printer-item__meta">
              {{ printer.type || '未分类' }} · {{ printer.remark || '无备注' }}
            </div>
          </div>
          <div class="re-printer-item__actions">
            <ReButton text size="small" type="primary" @click.stop="onSetDefault(printer.name)">
              设为默认
            </ReButton>
          </div>
        </div>
      </div>

      <!-- 第三方的确认 -->
      <div class="re-printer__footer">
        <ReButton type="primary" :disabled="!printerName" @click="onPrint">
          确认并第三方的打印
        </ReButton>
      </div>
    </div>

    <!-- ==================== 新增/编辑弹窗 ==================== -->
    <ReDialog v-model="formVisible" :title="formTitle" width="520px" @confirm="onFormConfirm">
      <el-form ref="formRef" :model="form" label-width="110px">
        <el-form-item label="打印机设备名" required>
          <el-input v-model="form.name" placeholder="设备名称，如 HP LaserJet Pro" maxlength="64" />
        </el-form-item>
        <el-form-item label="打印机类型">
          <el-input v-model="form.type" placeholder="如 HP LaserJet Pro / 第三方云" maxlength="64" />
        </el-form-item>
        <el-form-item label="连接地址">
          <el-input v-model="form.address" placeholder="IP/域名，如 192.168.1.100" maxlength="128" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="form.port" :min="0" :max="65535" class="w-full" />
        </el-form-item>
        <el-form-item label="认证名">
          <el-input v-model="form.username" placeholder="认证用户名（可选）" maxlength="64" />
        </el-form-item>
        <el-form-item label="认证 Token">
          <el-input v-model="form.token" placeholder="认证 Token（可选）" maxlength="128" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="typescript" :rows="2" maxlength="200" show-word-limit />
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
 * RePrinter —— 打印机管理面板（独立组件）
 *
 * mode:
 *   - "page"    管理页面，ReTable 驱动（打印机组 + 全量操作）
 *   - "selector" 选择器：设计器的 `打印` 流里选打印机并第三方的确认
 *
 * Props/Events（宿主对接用）:
 *   - v-model:printer  当前选中的打印机名（selector 模式）
 *   - on:print        点击了"确认并第三方的打印"（把打印机名交给宿主去做 `tpl.print`）
 *   - on:edit         编辑某台打印机（在管理页面里选打印机）
 *   - on:remove       删除某台打印机
 */
import { computed, onMounted, reactive, ref } from 'vue'
import ReIcon from '@repo/ui/re-icon'
import ReButton from '@repo/ui/re-button'
import ReTable from '@repo/ui/re-table'
import ReDialog from '@repo/ui/re-dialog'
import type { PrinterConfig } from '../types/template'
import { templateApi } from '../api/templateApi'

export const printerMode = defineModel<'page' | 'selector'>('mode', { default: 'page' })

// 设备数量由打印机管理页面的文字接管 (只在 "page" 模式显示)
const props = defineProps<{
  /** 标题（管理部） */
  title?: string
  /** 回显的打印机名（selector 模式用） */
  printer?: string
}>()

const emit = defineEmits<{
  /** 确认并第三方的打印（把打印机名交给宿主） */
  print: [name: string]
  /** 编辑 */
  edit: [row: PrinterConfig]
  /** 删除 */
  remove: [name: string]
}>()

/** 选中的打印机名 */
const printerName = computed(() => props.printer ?? '')

// ==================== 打印机列表 ====================
const tableRef = ref<any>(null)
const printers = ref<PrinterConfig[]>([])
const loading = ref(false)
const saving = ref(false)

/** page 分页 */
const page = ref(1)
const pageSize = ref(10)

const columns: Omit<ReTableColumn, 'prop'> & { prop: string }[] = []
// slots

// ==================== 加载 ====================
async function loadPrinters(): Promise<void> {
  loading.value = true
  try {
    const list = await templateApi.printerList()
    printers.value = (Array.isArray(list) ? list : []).slice(
      (page.value - 1) * pageSize.value,
      page.value * pageSize.value
    )
  } catch (err) {
    printers.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadPrinters()
})

// ==================== 操作 ====================
function host(row: PrinterConfig): string {
  if (!row.address) return '内网'
  if (row.port) return `${row.address}:${row.port}`
  return row.address
}

/** 发现打印机 */
async function onDiscover(): Promise<void> {
  tableRef.value?.reload()
  await loadPrinters()
}

/** 行点击 */
function onRowClick(row: PrinterConfig): void {
  void row
}

/** 右键菜单 */
function onContextMenu(_item: any, ctx: { row: PrinterConfig }): void {
  void _item
  const row = ctx.row
  if (!row) return
  if (row.isDefault) return
  void onSetDefault(row.name)
}

/** 设为默认 */
async function onSetDefault(name: string): Promise<void> {
  saving.value = true
  try {
    await templateApi.setDefaultPrinter(name)
    await loadPrinters()
    tableRef.value?.reload()
  } catch (err) {
    ElMessage.error(String(err))
  } finally {
    saving.value = false
  }
}

/** 新增 */
function openForm(): void {
  formRef.value?.resetFields()
  form.value = { isDefault: false } as PrinterConfig
  editingName.value = null
  formVisible.value = true
}

/** 编辑 */
function onEdit(row: PrinterConfig): void {
  editingName.value = row.name
  form.value = { ...row }
  formVisible.value = true
}

/** 删除 */
async function onRemove(name: string): Promise<void> {
  saving.value = true
  try {
    await ElMessageBox.confirm(`确定删除打印机「${name}」？`, '删除', { type: 'warning' })
    await templateApi.removePrinter(name)
    await loadPrinters()
    tableRef.value?.reload()
    ElMessage.success('删除成功')
  } catch (err) {
    if (String(err) !== 'Error: cancel') ElMessage.error(String(err))
  } finally {
    saving.value = false
  }
}

/** 窗体保存 */
async function onFormConfirm(): Promise<void> {
  const ok = await ElMessageBox.confirm(`保存打印机「${form.name ?? '未命名'}」并推进默认打印？`, '打印机管理', { type: 'info' })
  try {
    if (ok) {
      saving.value = true
      await templateApi.setPrinter({
        name: form.name,
        type: form.type,
        address: form.address,
        port: form.port,
        username: form.username,
        token: form.token,
        remark: form.remark
      })
      ElMessage.success('打印机已保存')
      formVisible.value = false
      await loadPrinters()
    }
  } catch (err) {
    ElMessage.error(String(err))
  } finally {
    saving.value = false
  }
}

/** 确认并第三方的打印（selector 模式） */
function onPrint(): void {
  const name = printerName.value
  if (!name) {
    ElMessage.warning('请先选择一台打印机')
    return
  }
  emit('print', name)
}

// ==================== form ====================
const formVisible = ref(false)
const editingName = ref<string | null>(null)
const formRef = ref<any>(null)
const form = ref<Partial<PrinterConfig>>({})
const searchFormRef = ref<any>(null)
const searchForm = ref<Record<string, any>>({ keyword: '', page: 1, pageSize: 10 })
const typeOptions = computed(() => [{ label: '本地', value: 'local' }, { label: '网络', value: 'network' }])

function openForm(): void {
  formVisible.value = true
}

onMounted(() => {
  void loadPrinters()
})

// ==================== 选项 ====================
// 打印机类型
const typeOptions2 = computed(() => [
  { label: '本地打印机', value: 'local' },
  { label: '网络打印机', value: 'network' },
  { label: '第三方', value: 'third' }
])

// ==================== 选择 ====================
/** selector 模式下选中打印机 */
function onSelect(name: string): void {
  printingName.value = name
  if (printerName.value !== name) printerName.value = name
}

// ReTable columns
const colName: any = [
  { prop: 'name', label: '打印机名称', slot: 'name', minWidth: 220 },
  { prop: 'type', label: '类型', slot: 'type', width: 160 },
  { prop: 'isDefault', label: '是否默认', slot: 'isDefault', width: 90, fixed: 'right' },
  { prop: 'action', label: '操作', slot: 'action', width: 150, fixed: 'right' }
]

onMounted(() => {
  void loadPrinters()
})
</script>

<style lang="scss" scoped>
.re-printer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
  overflow: hidden;
}

.re-printer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.re-printer__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.re-printer__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
}

.re-printer__right {
  display: flex;
  gap: 8px;
}

/* ==================== 列表 ==================== */
.re-printer__table {
  flex: 1;
  overflow: auto;
}

.re-printer__list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.re-printer__items {
  flex: 1;
  overflow: auto;
}

.re-printer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-page);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-border-color);
    background: var(--el-fill-color-light);
  }

  &--selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &--default::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    background: var(--el-color-success);
    border-radius: var(--el-radius-round);
  }
}

.re-printer-item__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.re-printer-item__name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.re-printer-item__name-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.re-printer-item__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-printer-item__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.re-printer__footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.re-printer__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/* 打印机名称 */
.re-printer-device {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.re-printer-device__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.re-printer-device__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-printer-cell {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.re-printer-actions {
  display: flex;
  gap: 8px;
}
</style>
