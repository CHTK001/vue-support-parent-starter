<script setup lang="ts">
/**
 * 台账导入弹窗。
 *
 * <p>两段式：先按「干模拟」校验并展示逐行预览，确认无误后再真正写库。
 * 之前只有一个确认按钮，点了只出预览、永远不写库，看起来就是「导入无效」。</p>
 *
 * <p>模式与干模拟开关是弹窗自己的状态，会随 confirm 事件一起交给父组件，
 * 不再出现「界面上选了更新、后端仍按新增跑」的错位。</p>
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
import type { DeviceImportResult } from '../types/device'

/** 弹窗显隐（父组件 v-model 绑定） */
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  /** 初始导入模式 */
  mode?: 'create' | 'update' | 'upsert'
  /** 初始干模拟 */
  dryRun?: boolean
  /** 导入结果；null/undefined 表示还没跑过 */
  result?: DeviceImportResult
  /** 父组件正在请求（干模拟或写库） */
  loading?: boolean
}>()

const emit = defineEmits<{
  /** 上传确认：文件 + 当前模式/干模拟 */
  confirm: [file: File, payload: { mode: 'create' | 'update' | 'upsert'; dryRun: boolean }]
  /** 下载模板 */
  download: []
  /** 重新选择文件（父组件清空上一次结果） */
  reset: []
  /** 弹窗关闭（已选文件重置） */
  closed: []
}>()

const mode = ref<'create' | 'update' | 'upsert'>(props.mode || 'create')
const dryRun = ref(props.dryRun ?? true)
const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const dragging = ref(false)
/** 本次结果是否来自干模拟：是 → 预览态，可继续「确认写入」 */
const ranDryRun = ref(false)
/** 最近一次请求是不是干模拟；等结果真的回来再落到 ranDryRun，写库失败时仍停在预览态 */
const requestedDryRun = ref(false)

watch(
  () => props.result,
  () => {
    ranDryRun.value = requestedDryRun.value
  }
)

/** 显示态：上传 / 干模拟预览 / 写库完成 */
const status = computed<'upload' | 'preview' | 'done'>(() => {
  if (!props.result) return 'upload'
  return ranDryRun.value ? 'preview' : 'done'
})

/** 父组件请求中或本地刚触发，按钮统一进 loading */
const busy = computed<boolean>(() => Boolean(props.loading))

/** 有文件才能确认导入 */
const canConfirm = computed<boolean>(() => !!file.value && !busy.value && !props.result)

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

/** 第一段：干模拟（或用户取消勾选干模拟时直接写库） */
function onConfirm() {
  if (!file.value || busy.value) return
  requestedDryRun.value = dryRun.value
  emit('confirm', file.value, { mode: mode.value, dryRun: dryRun.value })
}

/** 第二段：预览通过后真正写库 */
function onWrite() {
  if (!file.value || busy.value) return
  dryRun.value = false
  requestedDryRun.value = false
  emit('confirm', file.value, { mode: mode.value, dryRun: false })
}

/** 重新选择：清空文件与父组件上一次结果 */
function onReset() {
  file.value = null
  ranDryRun.value = false
  requestedDryRun.value = false
  emit('reset')
}

/** 弹窗关闭：重置文件，通知父组件 */
function onClosed() {
  file.value = null
  ranDryRun.value = false
  requestedDryRun.value = false
  emit('closed')
}

/** 每次打开都回到初始状态，避免沿用上一次的文件/模式 */
watch(
  () => visible.value,
  (value) => {
    if (value) {
      file.value = null
      ranDryRun.value = false
      requestedDryRun.value = false
      mode.value = props.mode || 'create'
      dryRun.value = props.dryRun ?? true
    } else {
      onClosed()
    }
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
        <div class="dt__opt" v-for="o in [{ value: 'create', label: '新建台账' }, { value: 'update', label: '更新台账' }, { value: 'upsert', label: '新增/更新' }]" :key="o.value">
          <input v-model="mode" type="radio" :id="`mode-${o.value}`" :value="o.value" />
          <label :for="`mode-${o.value}`">{{ o.label }}</label>
        </div>
        <div class="dt__opt">
          <input v-model="dryRun" type="checkbox" id="dry-run" />
          <label for="dry-run">干模拟（只校验，不写库）</label>
        </div>
      </div>
    </div>

    <!-- 预览 / 完成：逐行结果 -->
    <div v-else class="dt">
      <div class="dt__preview">
        <ReTag v-if="status === 'preview'" type="warning" effect="plain" size="small">干模拟</ReTag>
        <ReTag v-else type="success" effect="plain" size="small">已写入</ReTag>
        <span v-if="status === 'preview' && (props.result?.errorCount ?? 0) === 0">
          校验通过，点「确认写入」才会真正写库。
        </span>
        <span v-else-if="status === 'preview'">
          有 {{ props.result?.errorCount ?? 0 }} 行错误：修正文件后点「重新选择」再导一次。
        </span>
        <span v-else>本次导入已结束，关闭弹窗后列表会自动刷新。</span>
      </div>

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

      <!-- 第一段：上传 + 干模拟 -->
      <ReButton
        v-if="status === 'upload'"
        icon="Ok"
        :show-text="true"
        type="primary"
        :loading="busy"
        :disabled="!canConfirm"
        @click="onConfirm"
      >
        确认导入
      </ReButton>

      <!-- 第二段：预览通过后真正写库 -->
      <template v-else-if="status === 'preview'">
        <ReButton icon="RefreshLeft" :show-text="true" :disabled="busy" @click="onReset">重新选择</ReButton>
        <ReButton
          v-if="(props.result?.errorCount ?? 0) === 0"
          icon="Upload"
          :show-text="true"
          type="primary"
          :loading="busy"
          @click="onWrite"
        >
          确认写入
        </ReButton>
      </template>
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
.dt__preview { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 11.5px; color: var(--el-text-color-secondary); }
.dt__empty { padding: 24px 0; text-align: center; color: var(--el-text-color-placeholder); }
.dt__summ { padding: 10px 0 4px; color: var(--el-text-color-regular); }
.dt__summ b { color: var(--el-color-primary); }
.dt__table { width: 100%; border-collapse: collapse; }
.dt__table th,
.dt__table td { padding: 8px 10px; border-top: 1px solid var(--el-border-color); text-align: left; }
.dt__table th { background: var(--el-fill-color); font-weight: 500; }
</style>
