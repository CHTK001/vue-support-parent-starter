<template>
  <ReDialog
    v-model="visible"
    title="网关设置"
    width="560px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="closeStream"
  >
    <div class="mgs">
      <p class="mgs__intro">
        填写网关地址后点「保存并检测」。可以只填网关地址，也可以直接粘贴网关启动时打印的
        整条链接（含页面 Key），其余字段会自动拆开。
      </p>

      <label class="mgs__field">
        <span class="mgs__label">网关地址</span>
        <el-input
          :model-value="baseUrl"
          placeholder="http://127.0.0.1:3425"
          @update:model-value="onBaseUrlInput"
        />
        <em class="mgs__hint">对话与出图请求走这个地址。</em>
      </label>

      <label class="mgs__field">
        <span class="mgs__label">管理页地址</span>
        <el-input
          :model-value="pageUrl"
          placeholder="http://127.0.0.1:3430（留空按网关地址推导）"
          @update:model-value="(v: string) => (pageUrl = v)"
        />
        <em class="mgs__hint">管理上游账号与查看额度时使用。</em>
      </label>

      <label class="mgs__field">
        <span class="mgs__label">页面 Key</span>
        <el-input
          :model-value="pageKey"
          placeholder="启动链接里的 k=…"
          @update:model-value="(v: string) => (pageKey = v)"
        />
        <em class="mgs__hint">管理上游账号需要；只做对话可以留空。</em>
      </label>

      <label class="mgs__field">
        <span class="mgs__label">网关 Key</span>
        <el-input
          v-model="gatewayKey"
          type="password"
          show-password
          placeholder="网关如果设置了访问密钥就填这里"
        />
      </label>

      <div class="mgs__state" :class="'is-' + phase">
        <span class="mgs__dot" aria-hidden="true" />
        <span>{{ statusText }}</span>
      </div>
      <p v-if="error" class="mgs__error">{{ error }}</p>

      <div class="mgs__download">
        <div>
          <b>还没有安装网关？</b>
          <p class="mgs__hint">下载后启动它，再把上面打印的地址填回来。</p>
        </div>
        <el-button @click="openDownloadPage">下载网关</el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="saving" :disabled="!baseUrl.trim()" @click="save">
        保存并检测
      </el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 「网关设置」弹窗：配置网关地址并在保存时探活。
 *
 * <p>为什么单独一个入口：网关地址不是某个业务渠道的属性，而是所有托管渠道共用
 * 的基础设置。以前只能从「Magpie」渠道的绑定表单里改，用户既不知道去哪找，
 * 也容易把它当成一次账号绑定。这里只做地址维护：保存时按同样的
 * start-login → SSE 流程让后端探活并落库，成功后刷新页面数据。</p>
 */
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ReDialog from '@repo/ui/re-dialog'
import { channelApi } from '../channelApi'

const props = withDefaults(
  defineProps<{
    /** 弹窗显隐（v-model） */
    modelValue: boolean
    /** 网关渠道标识 */
    gatewayChannel: string
    /** 网关连接的 connectionId（用于回显地址） */
    connectionId?: string
  }>(),
  { connectionId: '' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  /** 保存成功：调用方刷新渠道摘要与网关索引 */
  (e: 'saved'): void
}>()

/** 弹窗显隐双向绑定 */
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

/** 网关官方发布页（Windows / macOS 安装包） */
const DOWNLOAD_URL = 'https://github.com/yetone/magpie/releases/latest'

const baseUrl = ref('')
const pageUrl = ref('')
const pageKey = ref('')
const gatewayKey = ref('')
const saving = ref(false)
const phase = ref<'idle' | 'saving' | 'done' | 'failed'>('idle')
const error = ref('')
let stream: { close: () => void } | undefined

const statusText = computed(() => {
  if (phase.value === 'saving') return '正在连接网关…'
  if (phase.value === 'done') return '已保存：网关可用'
  if (phase.value === 'failed') return '没有连通，请检查地址与 Key'
  return '填好后点「保存并检测」'
})

/** 打开时回显当前网关地址（拿不到就留空，不猜） */
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      closeStream()
      return
    }
    phase.value = 'idle'
    error.value = ''
    if (!props.connectionId) return
    try {
      const res = await channelApi.magpieProviders(props.gatewayChannel, {
        connectionId: props.connectionId,
      })
      const out = (res as any)?.data ?? res
      if (!baseUrl.value) baseUrl.value = String(out?.baseUrl ?? '')
      if (!pageUrl.value) pageUrl.value = String(out?.pageUrl ?? '')
    } catch {
      /* 回显失败不影响填写，保存时会重新探活 */
    }
  },
)

/**
 * 网关地址输入：整条启动链接（http://host:3430/?k=…）拆成三个字段。
 *
 * @param raw 输入框内容
 */
function onBaseUrlInput(raw: string): void {
  baseUrl.value = raw
  const split = splitGatewayLink(raw)
  if (!split) return
  baseUrl.value = split.gateway
  pageUrl.value = split.pageUrl
  pageKey.value = split.pageKey
}

/**
 * 把整条启动链接拆成网关地址 / 页面地址 / 页面 Key。
 *
 * @param raw 链接
 * @returns 拆好的三段；没有 k= 参数时返回 null（按普通地址处理）
 */
function splitGatewayLink(raw: string): { gateway: string; pageUrl: string; pageKey: string } | null {
  const text = raw.trim()
  const queryAt = text.indexOf('?')
  if (queryAt < 0) return null
  const base = text.slice(0, queryAt)
  let key = ''
  for (const piece of text.slice(queryAt + 1).split('&')) {
    const eq = piece.indexOf('=')
    if (eq > 0 && piece.slice(0, eq) === 'k') {
      try {
        key = decodeURIComponent(piece.slice(eq + 1))
      } catch {
        key = piece.slice(eq + 1)
      }
    }
  }
  if (!key) return null
  // 页面端口 3430 → 数据面 3425；其它端口视为同一个反代入口，原样保留
  const gateway = base.replace(/:3430(?=\/|$)/, ':3425')
  return { gateway, pageUrl: base, pageKey: key }
}

/** 保存：走渠道登录流程，后端探活成功后把凭据落库 */
async function save(): Promise<void> {
  if (saving.value) return
  saving.value = true
  phase.value = 'saving'
  error.value = ''
  closeStream()
  try {
    const res = await channelApi.startLogin(props.gatewayChannel)
    const out = (res as any)?.data ?? res
    const handle = { ...(out?.handle ?? {}) } as Record<string, unknown>
    handle.baseUrl = baseUrl.value.trim()
    handle.pageUrl = pageUrl.value.trim()
    handle.pageKey = pageKey.value.trim()
    handle.apiKey = gatewayKey.value.trim()
    watchStream(handle)
  } catch (e: any) {
    phase.value = 'failed'
    error.value = e?.message ?? String(e)
    saving.value = false
  }
}

/**
 * 打开探活用的登录流；done 即网关可用。
 *
 * @param handle 登录句柄（地址与 Key）
 */
function watchStream(handle: Record<string, unknown>): void {
  let settled = false
  const finish = (ok: boolean, message = ''): void => {
    if (settled) return
    settled = true
    closeStream()
    saving.value = false
    if (ok) {
      phase.value = 'done'
      ElMessage.success('网关已保存')
      emit('saved')
      return
    }
    phase.value = 'failed'
    error.value = message || '没有连通，请检查地址与 Key'
  }
  stream = channelApi.sseLogin(
    props.gatewayChannel,
    { handle },
    {
      onDone: () => finish(true),
      onFailed: (data) => finish(false, String(data?.message ?? data?.code ?? '')),
      onError: (err) => finish(false, err instanceof Error ? err.message : String(err)),
      onClose: () => finish(phase.value === 'done'),
    },
    90,
  )
}

/** 关闭弹窗 / 卸载时中止探活流 */
function closeStream(): void {
  stream?.close()
  stream = undefined
}

/** 打开发布页：由用户点击触发，不会被拦截 */
function openDownloadPage(): void {
  window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.mgs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  color: var(--text-primary, #0f172a);
}
.mgs__intro {
  margin: 0;
  line-height: 1.6;
  color: var(--text-secondary, #475569);
}
.mgs__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mgs__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}
.mgs__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-tertiary, #94a3b8);
}
.mgs__error {
  margin: 0;
  font-size: 12px;
  color: var(--el-color-danger, #dc2626);
}
.mgs__state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--fill-quaternary, #f8fafc);
  color: var(--text-secondary, #475569);
}
.mgs__dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary, #94a3b8);
}
.mgs__state.is-saving .mgs__dot {
  background: var(--el-color-warning, #f59e0b);
}
.mgs__state.is-done .mgs__dot {
  background: var(--el-color-success, #22c55e);
}
.mgs__state.is-failed .mgs__dot {
  background: var(--el-color-danger, #dc2626);
}
.mgs__download {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px dashed var(--border-strong, #d3dceb);
  border-radius: 8px;
}
</style>
