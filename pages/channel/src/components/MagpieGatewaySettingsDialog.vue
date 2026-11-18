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
        网关地址已按默认值填好：本机会自动读取配置目录里的当前 Key，远程地址则要补上页面 Key。
        也可以直接粘贴网关启动时打印的整条链接（含页面 Key），地址与 Key 会自动拆开。
      </p>

      <!-- 成功回显但没有 mode：后端是旧版本，本地/远程只能按地址猜，手填局域网 IP 可能不准 -->
      <p v-if="legacyBackend" class="mgs__hint mgs__legacy">
        当前后端版本较旧，没有返回部署形态：本地 / 远程只能按地址猜测，手填局域网 IP 时可能不准。
        升级后端后，这里会显示配置目录、Key 来源与本机局域网地址。
      </p>

      <label class="mgs__field">
        <span class="mgs__label">网关地址</span>
        <el-input
          :model-value="baseUrl"
          placeholder="http://127.0.0.1:3425"
          @update:model-value="onBaseUrlInput"
        />
        <em class="mgs__hint">对话与出图请求走这个地址；管理页地址由后端按它推导。</em>
      </label>

      <!-- 本地：magpie 只监听数据面，管理面状态落在配置目录里，由后端现读 -->
      <label v-if="isLocal" class="mgs__field">
        <span class="mgs__label">magpie 配置目录</span>
        <el-input
          :model-value="configDir"
          :placeholder="configDirPlaceholder"
          @update:model-value="(v: string) => (configDir = v)"
        />
      </label>
      <p v-if="isLocal" class="mgs__hint">
        本地会自动从该目录读取当前页面 Key 与网关 Key<template v-if="describeConfigDir">（当前生效：<b>{{ describeConfigDir }}</b>）</template>。
      </p>
      <!-- 本机网卡的局域网地址：后端枚举得到，给手机 / 另一台电脑填；取不到就不显示 -->
      <p v-if="isLocal && lanUrls.length" class="mgs__hint">
        给别的设备用：<b>{{ lanUrls.join('、') }}</b>。需要 <b>magpie web</b> 绑到 <b>0.0.0.0:3430</b>
        并固定 <b>MAGPIE_WEB_KEY</b>，否则对面进不了管理面。
      </p>

      <!-- 远程：没有本机配置文件可读，只能走 HTTP 带 Key。
           必须用显式的 !isLocal，不能写 v-else：紧邻的上一个 v-if 是「有局域网地址」，
           v-else 会绑到那个条件上，导致单网卡 / 旧后端（lanUrls 为空）时本地与远程字段同框。 -->
      <template v-if="!isLocal">
        <label class="mgs__field">
          <span class="mgs__label">页面 Key</span>
          <el-input
            :model-value="pageKey"
            placeholder="启动链接里的 k=…"
            @update:model-value="(v: string) => (pageKey = v)"
          />
        </label>

        <label class="mgs__field">
          <span class="mgs__label">网关 Key</span>
          <el-input
            v-model="gatewayKey"
            type="password"
            show-password
            placeholder="网关如果设置了访问密钥就填这里（可空）"
          />
        </label>
        <p class="mgs__hint">远程只走 HTTP，需要这两把 Key。</p>
      </template>

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
      <el-button type="primary" :loading="saving" :disabled="!canSave" @click="save">
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
 *
 * <p>只留一个「网关地址」：管理页地址由后端按它推导（3425 → 3430）。地址主机名是
 * 回环（127.0.0.1 / localhost / ::1 / 0.0.0.0）时判为本地，显示「magpie 配置目录」，
 * 后端会从那里现读当前页面 Key 与网关 Key；其余地址判为远程，只能走 HTTP 带 Key，
 * 因此显示页面 Key / 网关 Key。切换模式只切显示，已填的值都留着。</p>
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

/**
 * magpie 网关的默认数据面地址。
 *
 * <p>与后端 {@code MagpieSupport.DEFAULT_BASE_URL} 同一个口径：magpie 装好就在
 * 3425 上提供 OpenAI 兼容接口，用户不必去查端口。留空反而是最差的默认值——
 * 「保存并检测」会一直是禁用状态，用户不知道要先填什么。</p>
 */
const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:3425'

const baseUrl = ref(DEFAULT_GATEWAY_URL)
/** magpie 配置目录（本地回落用；空表示让后端按环境变量 / 默认路径解析） */
const configDir = ref('')
const pageKey = ref('')
const gatewayKey = ref('')
const saving = ref(false)
const phase = ref<'idle' | 'saving' | 'done' | 'failed'>('idle')
const error = ref('')
let stream: { close: () => void } | undefined

/**
 * 后端 describe 给的部署形态（local / remote）。
 *
 * <p>前端按主机名只能认出回环；填本机网卡 IP（{@code 192.168.x.x}）时后端同样判本地、
 * 同样能读配置目录。所以形态以后端为准，拿不到（还没加载）才退回本地预览。</p>
 */
const backendMode = ref<'' | 'local' | 'remote'>('')

/** describe 给的本机局域网地址（多网卡全列）；取不到就是空数组，不显示这一行 */
const lanUrls = ref<string[]>([])

/** describe 给的实际生效配置目录（用户没填时就靠它给个真实路径，而不是占位符） */
const describeConfigDir = ref('')

/**
 * 后端版本过旧：{@code /providers} 请求成功但响应里没有 {@code mode}。
 *
 * <p>新版后端的 {@code describe()} 无论管理面 ok:false 还是 ok:true 都必带 mode
 * （纯内存计算、不探活）。所以「成功响应里缺 mode」只可能是旧后端，判据可靠。
 * 这里只在请求成功时置位：请求失败多半是网关没起 / Key 失效，不能张冠李戴成
 * 「后端旧」。旧后端下本地/远程只能按回环地址猜，手填本机网卡 IP 会判成远程，
 * 因此给一条说明，而不是悄悄用错的形态继续。</p>
 */
const legacyBackend = ref(false)

/** 配置目录输入框的占位：后端实际用的目录优先，其次才是约定的默认路径 */
const configDirPlaceholder = computed(
  () => describeConfigDir.value || '%USERPROFILE%\\.config\\magpie',
)

/** magpie 的回环主机名（与后端 {@code MagpieSupport#isLoopback} 同一组，仅用于输入时预览） */
const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '[::1]', '::1', '0.0.0.0']

/**
 * 取地址里的主机名（小写，IPv6 保留方括号）。
 *
 * <p>没写协议时按 {@code http://} 补，这样 {@code 127.0.0.1:3425} 也能判成本地；
 * 纯字符串切分而不是 {@code new URL}，因为裸 IPv6（{@code ::1}）后者解析不了。</p>
 *
 * @param raw 用户输入的地址
 * @returns 主机名；取不到时返回空串
 */
function hostOf(raw: string): string {
  const text = raw.trim()
  if (!text) return ''
  const afterScheme = text.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  const authority = afterScheme.split(/[/?#]/)[0]
  const hostPort = authority.includes('@')
    ? authority.slice(authority.lastIndexOf('@') + 1)
    : authority
  if (hostPort.startsWith('[')) {
    const end = hostPort.indexOf(']')
    return (end < 0 ? hostPort : hostPort.slice(0, end + 1)).toLowerCase()
  }
  // 裸 IPv6 有多个冒号，不能按 host:port 切
  if (hostPort.split(':').length > 2) return hostPort.toLowerCase()
  const colon = hostPort.lastIndexOf(':')
  return (colon > 0 ? hostPort.slice(0, colon) : hostPort).toLowerCase()
}

/**
 * 地址是否落在本机回环上（纯函数，只看主机名）。
 *
 * @param raw 用户输入的地址
 * @returns true 表示回环地址，可读本机配置目录
 */
function isLoopbackAddress(raw: string): boolean {
  return LOOPBACK_HOSTS.includes(hostOf(raw))
}

/** {@code lanUrls} 里的主机名集合（后端枚举的本机网卡地址，用来识别手填的局域网 IP） */
const lanHosts = computed(() =>
  lanUrls.value.map((u) => hostOf(u)).filter(Boolean),
)

/**
 * 当前是本地还是远程。
 *
 * <p>判定顺序：后端 {@code mode}（它认识本机所有网卡 IP）→ 主机名是回环 → 主机名出现在
 * {@code lanUrls} 里（那是后端枚举出来的本机地址，不是猜的）。三者都不中才算远程。
 * 用户一改地址就丢掉旧的 {@code mode}，避免把上一个地址的结论贴到新地址上。</p>
 */
const isLocal = computed(() => {
  if (backendMode.value) return backendMode.value === 'local'
  if (isLoopbackAddress(baseUrl.value)) return true
  const host = hostOf(baseUrl.value)
  return host !== '' && lanHosts.value.includes(host)
})

/** 远程必须带页面 Key；本地地址 + 配置目录就够 */
const canSave = computed(() => {
  if (!baseUrl.value.trim()) return false
  return isLocal.value || pageKey.value.trim() !== ''
})

const statusText = computed(() => {
  if (phase.value === 'saving') return '正在连接网关…'
  if (phase.value === 'done') return '已保存：网关可用'
  if (phase.value === 'failed') return '没有连通，请检查地址与 Key'
  return '填好后点「保存并检测」'
})

/** 打开时回显当前网关地址；没有绑定过就用默认 3425，不猜别的端口 */
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      closeStream()
      return
    }
    phase.value = 'idle'
    error.value = ''
    // 每次打开重新判版本：先清空，只有「成功响应里缺 mode」才置位
    legacyBackend.value = false
    if (!props.connectionId) return
    try {
      const res = await channelApi.magpieProviders(props.gatewayChannel, {
        connectionId: props.connectionId,
      })
      const out = (res as any)?.data ?? res
      // 已绑定的地址覆盖默认值；后端没返回就保留默认 3425
      if (out?.baseUrl) baseUrl.value = String(out.baseUrl)
      // 形态与局域网地址都以后端为准：它认识本机网卡 IP，前端只认识回环
      const hasMode = out?.mode === 'local' || out?.mode === 'remote'
      backendMode.value = hasMode ? out.mode : ''
      // 请求成功却没有 mode → 旧后端；请求失败走 catch，不在这里判（多半是网关没起）
      legacyBackend.value = !hasMode
      lanUrls.value = Array.isArray(out?.lanUrls)
        ? out.lanUrls.map((u: unknown) => String(u)).filter(Boolean)
        : []
      describeConfigDir.value = typeof out?.configDir === 'string' ? out.configDir.trim() : ''
      // 旧的 page_url 不再回显：管理页地址由后端按 baseUrl 推导（3425 → 3430）
    } catch {
      /* 回显失败不影响填写，保存时会重新探活；不是后端版本问题，保持 legacyBackend=false */
    }
  },
)

/**
 * 网关地址输入：整条启动链接（http://host:3430/?k=…）拆成网关地址与页面 Key。
 *
 * @param raw 输入框内容
 */
function onBaseUrlInput(raw: string): void {
  baseUrl.value = raw
  // 地址改了，上一个地址的形态结论失效，回到按主机名 + 本机地址预览。
  // lanUrls / configDir 是本机事实（不随地址变），保留下来才能认出「填的是本机网卡 IP」。
  backendMode.value = ''
  const split = splitGatewayLink(raw)
  if (!split) return
  baseUrl.value = split.gateway
  pageKey.value = split.pageKey
}

/**
 * 把整条启动链接拆成网关地址 / 页面 Key。
 *
 * @param raw 链接
 * @returns 拆好的两段；没有 k= 参数时返回 null（按普通地址处理）
 */
function splitGatewayLink(raw: string): { gateway: string; pageKey: string } | null {
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
  return { gateway, pageKey: key }
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
    // 只提交一个地址：管理页地址由后端按 baseUrl 推导，不再写 pageUrl
    handle.baseUrl = baseUrl.value.trim()
    handle.pageKey = pageKey.value.trim()
    handle.apiKey = gatewayKey.value.trim()
    // 本地回落的配置目录：留空就不写，避免把后端的默认路径钉死成空值
    const dir = configDir.value.trim()
    if (dir) handle.config_dir = dir
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
/* 后端版本提示：比普通 hint 更醒目，但不是报错，用 info 色调 + 细边框 */
.mgs__legacy {
  padding: 8px 10px;
  border: 1px solid var(--el-color-info-light-5, #c8d3e0);
  border-radius: 8px;
  background: var(--el-color-info-light-9, #f4f7fb);
  color: var(--text-secondary, #475569);
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
