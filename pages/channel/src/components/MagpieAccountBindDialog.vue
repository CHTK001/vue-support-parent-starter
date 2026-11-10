<template>
  <ReDialog
    v-model="visible"
    :title="title"
    width="560px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="stopPoll"
  >
    <div class="mab">
      <p class="mab__intro">
        为「{{ channelName || channel }}」添加一个可用的账号：按提示完成授权即可，
        之后这个账号可以直接在本页使用。
      </p>

      <!-- 网关里还没有该渠道的上游：先接入上游，否则没有可绑定的对象 -->
      <div v-if="!providers.length" class="mab__empty">
        <p class="mab__empty-title">「{{ channelName || channel }}」还没有可添加的账号来源</p>
        <p class="mab__hint">
          一个来源对应一组可登录的账号；先接入来源（服务地址或登录方式），
          再回来添加账号。
        </p>
        <el-button type="primary" @click="emit('manage-upstream')">去接入</el-button>
      </div>

      <template v-else>
        <!-- 多个来源时让用户选一个；只有一个直接展示 -->
        <section v-if="providers.length > 1" class="mab__pick">
          <p class="mab__label">从哪个来源添加</p>
          <label v-for="p in providers" :key="String(p.id ?? '')" class="mab__option">
            <input v-model="pickedId" type="radio" :value="String(p.id ?? '')" />
            <span class="mab__option-name">{{ providerLabel(p) }}</span>
            <span class="mab__option-meta">{{ optionMeta(p) }}</span>
          </label>
        </section>
        <section v-else class="mab__single">
          <span class="mab__label">来源</span>
          <b>{{ providerLabel(providers[0]!) }}</b>
          <span class="mab__option-meta">{{ optionMeta(providers[0]!) }}</span>
        </section>

        <div v-if="prompt" class="mab__ask">
          <p class="mab__ask-title">{{ prompt.message || '请填写' }}</p>
          <el-select
            v-if="prompt.type === 'select'"
            v-model="promptValue"
            placeholder="请选择"
            class="mab__ask-input"
          >
            <el-option v-for="opt in (prompt.options ?? [])" :key="opt" :label="opt" :value="opt" />
          </el-select>
          <el-input
            v-else
            v-model="promptValue"
            class="mab__ask-input"
            :type="prompt.type === 'password' ? 'password' : 'text'"
            :placeholder="prompt.placeholder || '请输入'"
            :show-password="prompt.type === 'password'"
            @keyup.enter="answerPrompt"
          />
          <p v-if="promptError" class="mab__error">{{ promptError }}</p>
          <el-button type="primary" :loading="starting" :disabled="!promptValue.trim()" @click="answerPrompt">
            下一步
          </el-button>
        </div>

        <div class="mab__state" :class="'is-' + (session?.state || (starting ? 'starting' : 'idle'))">
          <span class="mab__dot" aria-hidden="true" />
          <span>{{ stateText }}</span>
        </div>

        <div v-if="session?.url" class="mab__url">
          <span class="mab__label">授权地址</span>
          <a :href="String(session.url)" target="_blank" rel="noopener noreferrer">
            {{ session.url }}
          </a>
        </div>
        <p v-if="session?.user" class="mab__hint">已登录账号：{{ session.user }}</p>
        <p v-if="session?.message" class="mab__hint">{{ session.message }}</p>
        <p v-if="error" class="mab__error">{{ error }}</p>
      </template>
    </div>

    <template #footer>
      <el-button v-if="session?.url" @click="openAuthPage">打开授权页</el-button>
      <el-button v-if="running" @click="cancel">取消登录</el-button>
      <el-button @click="visible = false">关闭</el-button>
      <el-button
        v-if="providers.length && !finished && !prompt"
        type="primary"
        :loading="starting"
        :disabled="!canStart"
        @click="start"
      >
        {{ session?.id ? '重新发起' : '开始添加' }}
      </el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 「新增账号」的 Magpie 绑定弹窗。
 *
 * <p><b>为什么单独一个弹窗</b>：网关托管的渠道，账号登录由 magpie 负责
 * （{@code POST /api/channels/{channel}/signin}），凭据不经过本服务。以前这条
 * 路径要跳到网关自己的管理页才能走，渠道页只能给一句「去网关登录」；现在把
 * 这段登录流程搬到渠道页里，用户点「新增账号」原地完成，不离开当前页面。</p>
 *
 * <p>插件接管的 provider 传 {@code provider + method}，内置的传 {@code agent}；
 * 网关返回的授权地址在浏览器里打开，这里只轮询会话状态。</p>
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ReDialog from '@repo/ui/re-dialog'
import { channelApi, type MagpieProvider, type MagpieSigninPrompt, type MagpieSigninSession } from '../channelApi'

const props = withDefaults(
  defineProps<{
    /** 弹窗显隐（v-model） */
    modelValue: boolean
    /** 业务渠道标识（展示与归属） */
    channel: string
    /** 业务渠道展示名 */
    channelName?: string
    /** 网关渠道标识（如 magpie） */
    gatewayChannel: string
    /** 网关连接的 connectionId：上游管理与登录都按它取凭据 */
    connectionId?: string
    /** 该业务渠道在网关里命中的上游实例 */
    providers?: MagpieProvider[]
  }>(),
  {
    channelName: '',
    connectionId: '',
    providers: () => [],
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  /** 绑定成功：调用方刷新渠道摘要与网关索引 */
  (e: 'bound', session: MagpieSigninSession): void
  /** 网关里还没有该渠道的上游：调用方负责打开网关的上游入口 */
  (e: 'manage-upstream'): void
}>()

/** 弹窗显隐双向绑定 */
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const title = computed(() => `新增账号 · ${props.channelName || props.channel}`)

/** 选中的上游 provider id */
const pickedId = ref('')
const starting = ref(false)
const session = ref<MagpieSigninSession | null>(null)
const error = ref('')
/** 插件登录当前要回答的问题（null 表示没有下一问） */
const prompt = ref<MagpieSigninPrompt | null>(null)
/** 已答过的内容：网关要求答下一问时原样回传 */
const signinInputs = ref<Record<string, string>>({})
/** 当前这一问的答案 */
const promptValue = ref('')
const promptError = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

/** 上游展示名：网关 name 优先，没有退回 id */
function providerLabel(provider: MagpieProvider): string {
  return String(provider?.name ?? '').trim() || String(provider?.id ?? '')
}

/** 上游副信息：凭据与账号数 */
function optionMeta(provider: MagpieProvider): string {
  const bits: string[] = []
  bits.push(provider.hasKey ? '已配置凭据' : '未配置凭据')
  const accounts = Number(provider.pluginAccounts ?? 0)
  if (accounts > 0) bits.push(`${accounts} 个账号`)
  return bits.join(' · ')
}

/** 是否插件接管的 provider：与上游面板同一套判定 */
function isPluginManaged(provider: MagpieProvider): boolean {
  const move = provider.move as Record<string, unknown> | undefined
  const state = move?.state ?? (provider as Record<string, unknown>).moveState
  if (String(state ?? '') === 'plugin') return true
  const account = (provider as Record<string, unknown>).account as Record<string, unknown> | undefined
  const logins = Array.isArray(account?.logins) ? account.logins : []
  if (logins.some((row) => String((row as Record<string, unknown>)?.agent ?? '').startsWith('plugin:'))) {
    return true
  }
  return String((provider as Record<string, unknown>).chat ?? '').startsWith('plugin://')
}

const running = computed(() => {
  const state = session.value?.state
  return !prompt.value && (state === 'installing' || state === 'waiting')
})

/** 绑定完成后按钮收起（要再绑一个就关掉重开） */
const finished = computed(() => session.value?.state === 'done')

const canStart = computed(
  () => !!pickedId.value && !!props.connectionId && !starting.value && !prompt.value,
)

const stateText = computed(() => {
  if (prompt.value) return '请先回答下面的问题'
  if (starting.value && !session.value?.id) return '正在准备登录…'
  const state = session.value?.state
  if (state === 'installing') return '正在安装登录组件，装好后会自动继续'
  if (state === 'waiting') return '等待在授权页完成登录'
  if (state === 'done') return '已完成：账号已添加'
  if (state === 'failed') return '登录失败'
  if (state === 'canceled') return '已取消登录'
  if (!session.value?.id) return '选择账号来源后点「开始添加」'
  return '准备中'
})

/** 打开时重置会话并默认选中第一个上游 */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      stopPoll()
      return
    }
    session.value = null
    error.value = ''
    prompt.value = null
    promptValue.value = ''
    promptError.value = ''
    signinInputs.value = {}
    pickedId.value = props.providers[0] ? String(props.providers[0].id ?? '') : ''
  },
)

/** 上游清单异步到达（先开弹窗、后拉到 provider）时补一次默认选中 */
watch(
  () => props.providers,
  (rows) => {
    if (!props.modelValue) return
    if (pickedId.value && rows.some((p) => String(p.id ?? '') === pickedId.value)) return
    pickedId.value = rows[0] ? String(rows[0].id ?? '') : ''
  },
)

/** 发起登录：插件与内置走不同参数，凭据由网关自己保存 */
async function start(): Promise<void> {
  const provider = props.providers.find((p) => String(p.id ?? '') === pickedId.value)
  const id = String(provider?.id ?? '')
  if (!provider || !id) {
    error.value = '请选择要绑定的上游'
    return
  }
  if (!props.connectionId) {
    error.value = '网关连接不可用，请刷新后再试'
    return
  }
  starting.value = true
  error.value = ''
  promptError.value = ''
  prompt.value = null
  signinInputs.value = {}
  promptValue.value = ''
  session.value = null
  try {
    if (!isPluginManaged(provider)) {
      await launchSignin({ agent: id })
      return
    }
    // 插件登录先问清楚它要什么：loomy 这一步就是手机号，直接 POST signin 只会 400。
    const out = payloadOf(
      await channelApi.magpieSigninPrompt(props.gatewayChannel, {
        connectionId: props.connectionId,
        provider: id,
        method: 0,
        inputs: {},
      }),
    )
    if (out?.error) {
      error.value = String(out.error)
      return
    }
    signinInputs.value = (out?.inputs ?? {}) as Record<string, string>
    if (out?.prompt) {
      prompt.value = out.prompt as MagpieSigninPrompt
      return
    }
    await launchSignin({ plugin: true, provider: id, method: 0, inputs: signinInputs.value })
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    starting.value = false
  }
}

/** 统一穿透 `{ok,channel,result}` 与统一响应信封 */
function payloadOf(res: unknown): any {
  const out = (res as any)?.data ?? res
  return out?.result ?? out
}

/** 回答当前这一问；还有下一问就继续问，没有就发起登录 */
async function answerPrompt(): Promise<void> {
  const current = prompt.value
  const provider = props.providers.find((p) => String(p.id ?? '') === pickedId.value)
  const id = String(provider?.id ?? '')
  if (!current || !id) return
  const value = promptValue.value.trim()
  if (!value) {
    promptError.value = '请填写后继续'
    return
  }
  starting.value = true
  promptError.value = ''
  try {
    const out = payloadOf(
      await channelApi.magpieSigninPrompt(props.gatewayChannel, {
        connectionId: props.connectionId,
        provider: id,
        method: 0,
        inputs: signinInputs.value,
        key: current.key,
        value,
      }),
    )
    if (out?.error) {
      promptError.value = String(out.error)
      return
    }
    signinInputs.value = (out?.inputs ?? signinInputs.value) as Record<string, string>
    if (out?.prompt) {
      prompt.value = out.prompt as MagpieSigninPrompt
      promptValue.value = ''
      return
    }
    prompt.value = null
    await launchSignin({ plugin: true, provider: id, method: 0, inputs: signinInputs.value })
  } catch (e: any) {
    promptError.value = e?.message ?? String(e)
  } finally {
    starting.value = false
  }
}

/**
 * 真正发起登录并接管会话。
 *
 * <p>免登录插件（opencode-zen-free）会在这一步直接回 {@code state=done} 且没有
 * {@code id}：这不是「网关没有返回登录会话」，账号其实已经可用。</p>
 *
 * @param body 登录参数（插件：provider + method + inputs；内置：agent）
 */
async function launchSignin(body: Record<string, unknown>): Promise<void> {
  const res = await channelApi.magpieSignin(props.gatewayChannel, {
    connectionId: props.connectionId,
    ...body,
  } as any)
  session.value = payloadOf(res) as MagpieSigninSession
  if (session.value?.state === 'done') {
    prompt.value = null
    ElMessage.success('账号已添加' + (session.value?.user ? '：' + session.value.user : ''))
    emit('bound', session.value)
    visible.value = false
    return
  }
  if (!session.value?.id) {
    error.value = String(
      session.value?.message ?? session.value?.error ?? '登录没有启动，请稍后重试',
    )
    return
  }
  if (session.value.url) openAuthPage()
  schedulePoll()
}

/** 打开授权页（弹窗被拦截时可再点一次） */
function openAuthPage(): void {
  const url = session.value?.url
  if (url) window.open(String(url), '_blank', 'noopener,noreferrer')
}

/** 安排下一次轮询（2.5s 一次，终态停止） */
function schedulePoll(): void {
  stopPoll()
  timer = setTimeout(() => void poll(), 2500)
}

/** 轮询登录会话；完成后通知调用方刷新数据 */
async function poll(): Promise<void> {
  const id = session.value?.id
  if (!id || !props.modelValue) return
  try {
    const res = await channelApi.magpieSigninStatus(props.gatewayChannel, id, {
      connectionId: props.connectionId,
    })
    const out = (res as any)?.data ?? res
    session.value = (out?.result ?? out) as MagpieSigninSession
    const state = session.value?.state
    if (state === 'done') {
      ElMessage.success('账号已绑定' + (session.value?.user ? '：' + session.value.user : ''))
      emit('bound', session.value)
      visible.value = false
      return
    }
    if (state === 'failed') {
      error.value = String(session.value?.message ?? '登录失败')
      return
    }
    if (state === 'canceled') return
    schedulePoll()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
}

/** 取消登录会话 */
async function cancel(): Promise<void> {
  const id = session.value?.id
  if (!id) return
  try {
    await channelApi.magpieSigninCancel(props.gatewayChannel, id, { connectionId: props.connectionId })
    session.value = { ...session.value, state: 'canceled' }
    ElMessage.info('已取消登录')
  } catch (e: any) {
    ElMessage.error('取消失败：' + (e?.message ?? e))
  } finally {
    stopPoll()
  }
}

/** 清掉定时器（关弹窗 / 卸载时） */
function stopPoll(): void {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
}

onBeforeUnmount(stopPoll)
</script>

<style scoped>
.mab {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  color: var(--text-primary, #0f172a);
}
.mab__intro {
  margin: 0;
  line-height: 1.6;
  color: var(--text-secondary, #475569);
}
.mab__intro b {
  color: var(--text-primary, #0f172a);
}
.mab__label {
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
.mab__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-tertiary, #94a3b8);
}
.mab__error {
  margin: 0;
  font-size: 12px;
  color: var(--el-color-danger, #dc2626);
}
.mab__empty {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px dashed var(--border-strong, #d3dceb);
  border-radius: 8px;
}
.mab__empty-title {
  margin: 0;
  font-weight: 600;
}
.mab__empty :deep(.el-button) {
  align-self: flex-start;
}
.mab__pick {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mab__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 8px;
  cursor: pointer;
}
.mab__option:has(input:checked) {
  border-color: var(--brand-500, #3b82f6);
  background: color-mix(in srgb, var(--brand-500, #3b82f6) 6%, transparent);
}
.mab__option-name {
  font-weight: 600;
}
.mab__option-meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
.mab__single {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 8px;
  background: var(--fill-quaternary, #f8fafc);
}
.mab__single .mab__option-meta {
  margin-left: auto;
}
/* 登录前的一问：题面 + 输入 + 下一步，单独一块，和状态行分开 */
.mab__ask {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 8px;
  background: var(--fill-quaternary, #f8fafc);
}
.mab__ask-title {
  margin: 0;
  font-weight: 600;
  line-height: 1.5;
}
.mab__ask-input {
  width: 100%;
}
.mab__ask :deep(.el-button) {
  align-self: flex-start;
}
.mab__state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--fill-quaternary, #f8fafc);
  color: var(--text-secondary, #475569);
}
.mab__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary, #94a3b8);
}
.mab__state.is-waiting .mab__dot,
.mab__state.is-installing .mab__dot,
.mab__state.is-starting .mab__dot {
  background: var(--el-color-warning, #f59e0b);
}
.mab__state.is-done .mab__dot {
  background: var(--el-color-success, #22c55e);
}
.mab__state.is-failed .mab__dot {
  background: var(--el-color-danger, #dc2626);
}
.mab__url {
  display: flex;
  flex-direction: column;
  gap: 4px;
  word-break: break-all;
}
.mab__url a {
  font-size: 12px;
  color: var(--brand-600, #2563eb);
}
</style>
