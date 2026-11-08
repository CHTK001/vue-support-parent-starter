<script setup lang="ts">
/**
 * 台账导入弹窗。
 *
 * <p>给用户一个 Excel 导入入口：选文件（支持拖拽）、选模式（新增/更新/新增更新）、干模拟，
 * 使用 {@code deviceApi.importDevices} 逐行校验后写库，最后展示逐行结果（创建/更新/跳过/错误）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { ref, computed, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReIcon from '@repo/ui/re-icon'
import ReScrollbar from '@repo/ui/re-scrollbar'
import ReDialog from '@repo/ui/re-dialog'
import ReTag from '@repo/ui/re-tag'
import type { DeviceImportResult } from '@pages/device/src/types/device'

/** 弹窗显隐（父组件 v-model 绑定） */
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  /** 导入模式 */
  mode?: 'create' | 'update' | 'upsert'
  /** 干模拟 */
  dryRun?: boolean
  /** 导入结果 */
  result?: DeviceImportResult
}>()

const emit = defineEmits<{
  /** 上传确认（参数为选中的文件） */
  confirm: [file: File]
  /** 下载模板 */
  download: []
  /** 弹窗关闭（已选文件重置） */
  closed: []
}>()

const mode = ref(props.mode || 'create')
const dryRun = ref(props.dryRun ?? true)
const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const importing = ref(false)
const dragging = ref(false)

/** 显示态：等待导入 / 结果页 */
const status = computed<'upload' | 'done'>(() => (props.result ? 'done' : 'upload'))

/** 有文件才能确认导入 */
const canConfirm = computed<boolean>(() => !!file.value && !importing.value && !props.result)

/** 逐行结果的状态标签 */
const rowType: Record<string, 'success' | 'primary' | 'info' | 'danger'> = {
  create: 'success',
  update: 'primary',
  skip: 'info',
  error: 'danger'
}
const rowLabel: Record<string, string> = { create: '创建', update: '更新', skip: '跳过', error: '错误' }

/** 文件选择 → 存入状态 */
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  file.value = input.files?.[0] || null
}

/** 拖拽落文件 */
function onDrop(event: DragEvent) {
  event.preventDefault()
  dragging.value = false
  const files = event.dataTransfer?.files
  file.value = files?.[0] || null
}

/** 打开文件选择器 */
function openFilePicker() {
  fileInput.value?.click()
}

/** 确认导入（交父组件写库） */
async function onConfirm() {
  if (!file.value || importing.value) return
  importing.value = true
  try {
    emit('confirm', file.value)
  } finally {
    importing.value = false
  }
}

/** 弹窗关闭：重置文件，通知父组件 */
function onClosed() {
  file.value = null
  emit('closed')
}

/** 弹窗跟随显隐关一下也清文件 */
watch(
  () => props.result,
  () => {
    // 结果返回后，弹窗保持打开等待用户确认关闭
  }
)

watch(
  () => visible.value,
  (val) => {
    if (!val) onClosed()
  }
)
</script>

<template>
  <ReDialog :title="status === 'done' ? '导入完成' : '导入台账'" width="860px" @closed="onClosed">
    <!-- 未开始：文件选择 + 模式 -->
    <div v-if="status === 'upload'" class="dt">
      <div class="dt__hint">
        上传 Excel 台账模板（
        <ReButton icon="Download" link size="small" type="primary" @click="emit('download')">点击下载</ReButton>
        ）；模式为 <b>新增</b> 按编号创建，<b>更新</b> 按编号更新，<b>新增/更新</b> 自动判断
      </div>

      <!-- 拖拽区 -->
      <div class="dt__drop" :class="{ 'dt__drop--drag': dragging }" @dragover="dragging = true" @dragleave="dragging = false" @drop="onDrop">
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          class="dt__file"
          @change="onFileChange"
        />
        <i class="dt__icon">
          <ReIcon name="Upload" :size="22" />
        </i>
        <div class="dt__main" v-if="!file">
          拖拽文件到这里，或 <ReButton link size="small" @click="openFilePicker">选择文件</ReButton>
          <div class="dt__sub">支持 .xlsx / .xls，≤ 5000 行</div>
        </div>
        <div v-else class="dt__file">
          <ReIcon name="Document" :size="16" />
          <span>{{ file.name }}（{{ (file.size / 1024).toFixed(1) }} KB）</span>
          <button type="button" class="dt__del" @click="file = null">
            <ReIcon name="Close" :size="11" />
          </button>
        </div>
      </div>

      <div class="dt__opts">
        <div class="dt__opt" v-for="o in [{ value: 'create', label: '新建账台' }, { value: 'update', label: '更新账台' }, { value: 'upsert', label: '新增/更新' }]" :key="o.value">
          <input v-model="mode" type="radio" :id="`mode-${o.value}`" :value="o.value" />
          <label :for="`mode-${o.value}`">{{ o.label }}</label>
        </div>
        <div class="dt__opt">
          <input v-model="dryRun" type="checkbox" id="dry-run" />
          <label for="dry-run">干模拟（只校验，不写库）</label>
        </div>
      </div>
    </div>

    <!-- 已完成：逐行结果 -->
    <div v-else class="dt">
      <ReScrollbar height="260">
        <table v-if="props.result?.rows.length" class="dt__table">
          <thead>
            <tr>
              <th>行号</th>
              <th>状态</th>
              <th>设备</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in props.result.rows" :key="r.row">
              <td class="mono">{{ r.row }}</td>
              <td>
                <ReTag :type="rowType[r.action || 'skip']" effect="plain" size="small">
                  {{ rowLabel[r.action || 'skip'] }}
                </ReTag>
              </td>
              <td class="mono">{{ r.deviceName || r.deviceId || '-' }}</td>
              <td>{{ r.message || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="dt__empty">没有结果</div>
      </ReScrollbar>
      <div class="dt__summ">
        共 <b>{{ props.result?.total ?? 0 }}</b> 行：创建 {{ props.result?.createCount ?? 0 }}，
        更新 {{ props.result?.updateCount ?? 0 }}，跳过 {{ props.result?.skipCount ?? 0 }}，
        错误 {{ props.result?.errorCount ?? 0 }}
      </div>
    </div>

    <template #footer>
      <ReButton @click="onClosed">关闭</ReButton>
      <ReButton v-if="status === 'upload'" icon="Ok" :show-text="true" type="primary"
        :loading="importing" :disabled="!canConfirm" @click="onConfirm">
        确认导入
      </ReButton>
    </template>
  </ReDialog>
</template>

<style scoped>
.dt { font-size: 13px; }
.dt__hint { font-size: 11.5px; color: var(--el-text-color-secondary); margin-bottom: 12px; }
.dt__drop { position: relative; border: 1px dashed var(--el-border-color); border-radius: 6px; padding: 28px 16px; text-align: center; cursor: pointer; }
.dt__drop--drag { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.dt__file { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.dt__icon { display: block; margin: 0 auto 8px; color: var(--el-text-color-secondary); }
.dt__main { color: var(--el-text-color-regular); }
.dt__sub { font-size: 11px; color: var(--el-text-color-placeholder); }
.dt__file { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--el-fill-color); }
.dt__del { border: none; background: transparent; color: var(--el-text-color-placeholder); cursor: pointer; display: inline-flex; padding: 2px; border-radius: 4px; }
.dt__del:hover { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
.dt__opts { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; }
.dt__opt { display: flex; gap: 5px; align-items: center; color: var(--el-text-color-regular); }
.dt__empty { padding: 24px 0; text-align: center; color: var(--el-text-color-placeholder); }
.dt__summ { padding: 10px 0 4px; color: var(--el-text-color-regular); }
.dt__summ b { color: var(--el-color-primary); }
.dt__table { width: 100%; border-collapse: collapse; }
.dt__table th,
.dt__table td { padding: 8px 10px; border-top: 1px solid var(--el-border-color); text-align: left; }
.dt__table th { background: var(--el-fill-color); font-weight: 500; }
</style>