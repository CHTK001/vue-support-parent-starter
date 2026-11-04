<script setup lang="ts">
// ChatClient 免登录渠道面板（如 DuckDuckGo）。
//
// 与账号类渠道不同：没有绑定流程、没有连接行，只有「内置模型 + 试对话」。
// 后端每次调用新建 ChatClient、结束即关闭，前端因此不需要任何登录态或凭据输入。

import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { channelApi } from '../channelApi'

const props = defineProps<{
  /** 渠道标识（如 chat-duckduckgo） */
  channel: string
  /** 渠道展示名 */
  displayName?: string
  /** 进入优先级 */
  priority?: number
  /** 渠道列表里的模型（`{ model, enabled, alias, contextWindow }`） */
  models: Array<{ model: string; enabled: boolean; alias?: string; contextWindow?: number }>
}>()

const selectedModel = ref('')
const prompt = ref('')
const system = ref('')
const token = ref('')
const answer = ref('')
const elapsed = ref<number | null>(null)
const busy = ref(false)
const refreshing = ref(false)
const localModels = ref<Array<{ id: string; name?: string; contextWindow?: number }>>([])
const errors = reactive<{ text: string }>({ text: '' })

/** 模型清单：优先用实时刷新结果，回退渠道列表的内置模型 */
const modelOptions = computed(() =>
  localModels.value.length
    ? localModels.value.map((m) => ({ id: m.id, name: m.name, contextWindow: m.contextWindow }))
    : (props.models ?? []).map((m) => ({ id: m.model, name: m.alias, contextWindow: m.contextWindow })),
)

watch(
  modelOptions,
  (options) => {
    if (!options.length) {
      selectedModel.value = ''
      return
    }
    if (!options.some((m) => m.id === selectedModel.value)) {
      selectedModel.value = options[0].id
    }
  },
  { immediate: true },
)

/** 快捷提示词：一条验证连通性，一条验证推理 */
const QUICK_PROMPTS = [
  '用一句话说明你是谁，以及你由哪个渠道提供。',
  '把这段中文改写成更简洁的运维告警：渠道账号今晚将统一刷新凭据。',
]

/** 该渠道是否需要登录令牌（Trae 可填 JWT 覆盖本机登录态，DuckDuckGo 完全免登录） */
const needsToken = computed(() => props.channel.includes('trae'))

async function refreshModels() {
  if (refreshing.value) return
  refreshing.value = true
  errors.text = ''
  try {
    const res = await channelApi.chatModels(props.channel)
    localModels.value = res.models ?? []
    // 渠道未就绪（宿主工程没把底层 ChatClient 模块装进来）：只提示原因，不当成成功
    if (res.available === false) {
      errors.text = res.reason || '该渠道未就绪：底层 ChatClient 扩展未注册'
      return
    }
    ElMessage.success(`已刷新 ${localModels.value.length} 个模型`)
  } catch (e) {
    errors.text = e instanceof Error ? e.message : String(e)
  } finally {
    refreshing.value = false
  }
}

async function send() {
  if (busy.value) return
  const text = prompt.value.trim()
  if (!text) {
    ElMessage.warning('先输入要发送的内容')
    return
  }
  busy.value = true
  errors.text = ''
  answer.value = ''
  elapsed.value = null
  try {
    const res = await channelApi.chat(props.channel, {
      prompt: text,
      model: selectedModel.value || undefined,
      system: system.value || undefined,
      token: token.value.trim() || undefined,
    })
    answer.value = res.answer ?? ''
    elapsed.value = res.elapsedMs ?? null
  } catch (e) {
    errors.text = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

function useQuick(text: string) {
  prompt.value = text
}
</script>

<template>
  <div class="chatc">
    <div class="chatc__head">
      <div class="chatc__ident">
        <b>{{ displayName || channel }}</b>
        <span class="chatc__badge">ChatClient SPI · 免登录</span>
        <span v-if="priority !== undefined" class="chatc__prio">优先级 {{ priority }}</span>
      </div>
      <button type="button" class="chatc__refresh" :disabled="refreshing" @click="refreshModels">
        {{ refreshing ? '刷新中…' : '刷新模型' }}
      </button>
    </div>

    <div class="chatc__models">
      <button
        v-for="m in modelOptions"
        :key="m.id"
        type="button"
        class="chatc__model"
        :class="{ 'is-active': selectedModel === m.id }"
        :title="m.name || m.id"
        @click="selectedModel = m.id"
      >
        {{ m.name || m.id }}
      </button>
      <span v-if="!modelOptions.length" class="chatc__empty">
        未读取到模型（确认对应 ChatClient 模块在 classpath 上）
      </span>
    </div>

    <div class="chatc__dock">
      <label v-if="needsToken" class="chatc__field">
        <span>登录令牌（可选，仅本次请求生效）</span>
        <input v-model="token" type="password" placeholder="Trae 的 JWT；留空则读本机登录态" autocomplete="off" />
      </label>
      <label class="chatc__field">
        <span>系统提示词（可选）</span>
        <input v-model="system" type="text" placeholder="如：只回答运维相关问题" />
      </label>
      <label class="chatc__field">
        <span>发送内容</span>
        <textarea v-model="prompt" rows="3" placeholder="输入一句话验证渠道连通性" />
      </label>
      <div class="chatc__quick">
        <button
          v-for="(q, i) in QUICK_PROMPTS"
          :key="i"
          type="button"
          class="chatc__chip"
          :title="q"
          @click="useQuick(q)"
        >示例 {{ i + 1 }}</button>
        <button type="button" class="chatc__send" :disabled="busy" @click="send">
          {{ busy ? '对话中…' : '发起试对话' }}
        </button>
      </div>
    </div>

    <div v-if="errors.text" class="chatc__error">{{ errors.text }}</div>

    <div class="chatc__answer" :class="{ 'is-empty': !answer }">
      <div class="chatc__answer-head">
        <b>回答</b>
        <span v-if="elapsed !== null">{{ elapsed }} ms · {{ selectedModel || '默认模型' }}</span>
      </div>
      <pre class="chatc__answer-body">{{ answer || (busy ? '等待上游返回…' : '尚未发起对话') }}</pre>
    </div>
  </div>
</template>

<style scoped>
.chatc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
}
.chatc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.chatc__ident {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.chatc__ident b {
  font-size: 13px;
  color: var(--text-primary, #0f172a);
}
.chatc__badge {
  font-size: 11px;
  color: var(--el-color-primary, #409eff);
  border: 1px solid color-mix(in srgb, var(--el-color-primary, #409eff) 35%, transparent);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, transparent);
  border-radius: 999px;
  padding: 1px 8px;
}
.chatc__prio {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.chatc__refresh {
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: transparent;
  color: var(--text-secondary, #475569);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all .15s ease;
}
.chatc__refresh:hover {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.chatc__models {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chatc__model {
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-elevated, #f8fafc);
  color: var(--text-secondary, #475569);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all .15s ease;
}
.chatc__model:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
}
.chatc__model.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 10%, transparent);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}
.chatc__empty {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.chatc__dock {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chatc__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #475569);
}
.chatc__field input,
.chatc__field textarea {
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 6px;
  padding: 6px 9px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary, #0f172a);
  background: var(--bg-container, #fff);
  outline: none;
  resize: vertical;
}
.chatc__field input:focus,
.chatc__field textarea:focus {
  border-color: var(--el-color-primary, #409eff);
}
.chatc__quick {
  display: flex;
  align-items: center;
  gap: 6px;
}
.chatc__chip {
  border: 1px dashed var(--border-default, #e2e9f3);
  background: transparent;
  color: var(--text-tertiary, #94a3b8);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 11px;
  cursor: pointer;
}
.chatc__chip:hover {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.chatc__send {
  margin-left: auto;
  border: 1px solid var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
  transition: background .15s ease;
}
.chatc__send:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.chatc__error {
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-color-danger, #f56c6c);
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 8%, transparent);
}
.chatc__answer {
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 10px;
  overflow: hidden;
}
.chatc__answer.is-empty {
  opacity: .75;
}
.chatc__answer-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 7px 10px;
  border-bottom: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-elevated, #f8fafc);
}
.chatc__answer-head b {
  font-size: 12px;
  color: var(--text-primary, #0f172a);
}
.chatc__answer-head span {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.chatc__answer-body {
  margin: 0;
  padding: 10px;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-secondary, #475569);
  font-family: inherit;
  max-height: 220px;
  overflow-y: auto;
}
</style>
