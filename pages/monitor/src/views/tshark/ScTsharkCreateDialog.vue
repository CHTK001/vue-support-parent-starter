<!--
  新增抓包会话

  页面本身只保留「新增会话 + 会话表」，所有抓包参数收进这个弹层：
  网卡、过滤语法、过滤表达式、包数/时长上限、会话名。
  默认不设上限（0 = 不限），要停就回列表点「停止」。
-->
<template>
  <ReDialog
    :model-value="modelValue"
    title="新增抓包会话"
    width="560px"
    top="10vh"
    @update:model-value="onOpenChange"
  >
    <div class="create-form">
      <div class="create-row">
        <span class="create-label">会话名称</span>
        <ReInput
          :model-value="captureName"
          placeholder="可空，默认按网卡与时间生成"
          clearable
          @update:model-value="onName"
        />
      </div>

      <div class="create-row">
        <span class="create-label">网卡</span>
        <ReSelect
          :model-value="iface"
          :data="ifaceOptions"
          placeholder="选择要抓包的网卡"
          filterable
          clearable
          @update:model-value="onIface"
        />
      </div>

      <div class="create-row">
        <span class="create-label">过滤语法</span>
        <ReSelect
          :model-value="filterType"
          :data="FILTER_TYPES"
          @update:model-value="onFilterType"
        />
      </div>

      <div class="create-row">
        <span class="create-label">过滤表达式</span>
        <ReInput
          :model-value="filter"
          :placeholder="filterPlaceholder"
          clearable
          @update:model-value="onFilter"
        />
      </div>
      <p class="create-hint">{{ filterHint }}</p>

      <div class="create-row">
        <span class="create-label">包数上限</span>
        <ReInputNumber
          :model-value="count"
          :min="0"
          :max="1000000"
          placeholder="0 = 不限"
          @update:model-value="onCount"
        />
      </div>

      <div class="create-row">
        <span class="create-label">时长上限</span>
        <ReInputNumber
          :model-value="timeout"
          :min="0"
          :max="86400"
          placeholder="秒，0 = 不限"
          @update:model-value="onTimeout"
        />
      </div>

      <p v-if="!tsharkOk" class="create-warn">
        tshark 未就绪（未安装或不在 PATH 中），暂时无法抓包。
      </p>
    </div>

    <template #footer>
      <ReButton @click="emit('update:modelValue', false)">取消</ReButton>
      <ReButton type="primary" icon="VideoPlay" :loading="starting" :disabled="!tsharkOk" @click="emit('start')">
        开始抓包
      </ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReInputNumber from '@repo/ui/re-input-number'
import ReSelect from '@repo/ui/re-select'

const props = defineProps<{
  modelValue: boolean
  tsharkOk: boolean
  ifaceOptions: Array<{ label: string; value: string }>
  iface: string
  filter: string
  filterType: string
  captureName: string
  count: number
  timeout: number
  starting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'update:iface', v: string): void
  (e: 'update:filter', v: string): void
  (e: 'update:filterType', v: string): void
  (e: 'update:captureName', v: string): void
  (e: 'update:count', v: number): void
  (e: 'update:timeout', v: number): void
  (e: 'start'): void
}>()

const FILTER_TYPES = [
  { label: '自动识别（推荐）', value: 'auto' },
  { label: '捕获过滤（BPF）', value: 'bpf' },
  { label: '显示过滤（自动转 BPF）', value: 'display' },
]

const filterPlaceholder = computed(() => {
  if (props.filterType === 'bpf') return '如 tcp port 8080 / host 10.0.0.1'
  if (props.filterType === 'display') return '如 http / http.request.method == "GET" / dns'
  return '如 http、dns 或 tcp port 8080'
})

const filterHint = computed(() => {
  if (props.filterType === 'bpf') {
    return '捕获过滤只认 tcp / udp / port / host 这类语法；直接写 http 会启动失败。'
  }
  if (props.filterType === 'display') {
    return '实时抓包本身不支持显示过滤（tshark 抓包写文件时不能用 -Y），这里会尽量翻译成等价 BPF：http → tcp 80/8080/8000/8888，dns → port 53。翻译不了的表达式会被拒绝。'
  }
  return '自动识别：协议名（http / dns / tls）与带 ==、字段点号的表达式按显示过滤处理并翻译成 BPF；tcp port 8080 这类直接按捕获过滤执行。'
})

function onOpenChange(v: unknown) {
  emit('update:modelValue', !!v)
}
function onName(v: unknown) {
  emit('update:captureName', v == null ? '' : String(v))
}
function onIface(v: unknown) {
  emit('update:iface', v == null ? '' : String(v))
}
function onFilter(v: unknown) {
  emit('update:filter', v == null ? '' : String(v))
}
function onFilterType(v: unknown) {
  emit('update:filterType', v == null ? 'auto' : String(v))
}
function onCount(v: unknown) {
  emit('update:count', v == null || v === '' ? 0 : Number(v))
}
function onTimeout(v: unknown) {
  emit('update:timeout', v == null || v === '' ? 0 : Number(v))
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 2px;
}
.create-row {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}
.create-label {
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}
.create-hint {
  margin: -4px 0 2px 96px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.create-warn {
  margin: 4px 0 0;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
}
</style>
