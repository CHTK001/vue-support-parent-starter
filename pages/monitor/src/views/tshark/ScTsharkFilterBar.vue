<!--
  显示过滤条

  报文 / 统计 / 会话流三个标签共用同一份过滤表达式：后端把过滤翻译成参数化 SQL，
  三者才对得上（只筛报文而统计仍是全量，用户会以为统计错了）。
  这里只负责「编辑 + 应用 + 错误提示」，取数与联动由父级 useTshark 负责。

  语法是常用字段子集（协议名、ip.addr/src/dst、tcp/udp.port、port、frame contains、
  http.request.method/uri/response.code、dns.qry.name、tcp.flags.*，and/or/not/括号）。
  不认识的字段后端会回明确错误，不会静默忽略 —— 静默忽略会让「过滤了还是全量」变得无从解释。
-->
<template>
  <div class="tshark-filterbar">
    <div class="tshark-filterbar__row">
      <span class="tshark-filterbar__prompt" aria-hidden="true">▸</span>
      <span class="tshark-filterbar__label">显示过滤</span>
      <ReInput
        class="tshark-filterbar__input"
        :model-value="draft"
        :placeholder="placeholder"
        clearable
        @update:model-value="onInput"
        @keyup.enter="apply"
      />
      <ReButton type="primary" :disabled="starting" @click="apply">应用</ReButton>
      <ReButton :disabled="!applied && !draft.trim()" @click="clear">清除</ReButton>
      <span v-if="applied" class="tshark-filterbar__on">过滤已生效</span>
      <span class="tshark-panel__spacer" />
      <span class="tshark-dim tshark-filterbar__tip" :title="syntaxTip">语法</span>
    </div>
    <div v-if="error" class="tshark-filterbar__error">{{ error }}</div>
    <div v-else-if="applied" class="tshark-filterbar__hint">报文、统计与会话流都按「{{ applied }}」筛选</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReInput from '@repo/ui/re-input'

const props = defineProps<{
  /** 已生效的过滤表达式 */
  modelValue: string
  /** 后端拒绝过滤时的错误文本 */
  error?: string
  /** 应用过程中置灰按钮（统计命中量大时后端会拒绝） */
  starting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'apply', v: string): void
}>()

const placeholder = '显示过滤：http / ip.addr == 1.2.3.4 / tcp.port == 80 and http.request.method == GET'

const syntaxTip = [
  '协议名：tcp / udp / http / tls / dns / ssh …',
  '地址：ip.addr == 1.2.3.4、ip.src、ip.dst',
  '端口：tcp.port == 80、udp.port、port == 443',
  '长度/帧号：frame.len > 100、frame.number == 5',
  '内容：frame contains "GET"',
  'HTTP：http.request.method == GET、http.request.uri、http.response.code == 200',
  'DNS：dns.qry.name contains "example"',
  '标志位：tcp.flags.syn == 1、tcp.flags.ack == 0',
  '组合：and / or / not 与小括号',
  '其它裸词按关键字模糊匹配',
].join('\n')

const applied = computed(() => props.modelValue || '')

/** 输入框里的草稿；与 modelValue 分开，回车/点按钮才真正生效 */
const draft = ref(props.modelValue || '')

watch(
  () => props.modelValue,
  (v) => {
    // 外部（如切会话、点协议/点流联动）改了已生效值，草稿同步过去；
    // 有错误时不覆盖，让用户能继续改那份被拒绝的表达式
    if (!props.error) draft.value = v || ''
  },
)

function onInput(v: unknown) {
  draft.value = v == null ? '' : String(v)
}

function apply() {
  emit('update:modelValue', draft.value.trim())
  emit('apply', draft.value.trim())
}

function clear() {
  draft.value = ''
  emit('update:modelValue', '')
  emit('apply', '')
}
</script>

<style scoped>
.tshark-filterbar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tshark-filterbar__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
  /* 终端式过滤条：整行一个浅底盒子，提示符在前，输入框在里 */
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}
.tshark-filterbar__prompt {
  flex: none;
  font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 13px;
  line-height: 1;
  color: var(--el-color-primary);
}
.tshark-filterbar__label {
  flex: none;
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}
.tshark-filterbar__input {
  flex: 1 1 300px;
  min-width: 200px;
}
.tshark-filterbar__input :deep(.el-input__wrapper) {
  background: var(--el-bg-color);
  box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
}
.tshark-filterbar__input :deep(.el-input__inner) {
  font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 12px;
}
.tshark-filterbar__on {
  flex: none;
  font-size: 11.5px;
  color: var(--el-color-success);
}
.tshark-filterbar__tip {
  flex: none;
  font-size: 11.5px;
  cursor: help;
  border-bottom: 1px dashed var(--el-border-color);
}
.tshark-filterbar__hint {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.tshark-filterbar__error {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
}
</style>
