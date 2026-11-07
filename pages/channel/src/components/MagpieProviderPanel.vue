<template>
  <div class="mg-up">
    <div class="mg-up__head">
      <span class="mg-up__title">
        网关上游
        <i>{{ providers.length }}</i>
      </span>
      <span class="mg-up__ops">
        <select
          v-if="connections.length > 1"
          v-model="connectionId"
          class="mg-up__select"
          title="选择要管理的 Magpie 网关"
          @change="load()"
        >
          <option v-for="c in connections" :key="c.connectionId" :value="c.connectionId">
            {{ c.label || c.connectionId }}
          </option>
        </select>
        <button type="button" class="mg-up__btn" :disabled="loading" @click="load()">
          {{ loading ? '读取中…' : '刷新' }}
        </button>
        <button type="button" class="mg-up__btn is-primary" @click="openEditor(null)">
          ＋ 新增上游
        </button>
      </span>
    </div>

    <p v-if="baseUrl" class="mg-up__hint">
      网关 {{ baseUrl }}
      <template v-if="pageUrl">
        ｜ 页面
        <a :href="pageUrl" target="_blank" rel="noopener noreferrer">打开管理面</a>
      </template>
    </p>
    <p v-if="error" class="mg-up__error">{{ error }}</p>

    <div v-if="!connections.length" class="mg-up__empty">
      先在「账号」页绑定 Magpie 网关（地址 + 网关 key），再回到这里管理上游。
    </div>
    <div v-else class="mg-up__tablewrap">
      <table class="mg-up__table">
        <thead>
          <tr>
            <th>名称</th>
            <th>ID</th>
            <th>协议</th>
            <th>凭据</th>
            <th>账号</th>
            <th>模型</th>
            <th class="is-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in providers" :key="String(p.id)">
            <td class="is-name" :title="String(p.name ?? '')">
              {{ p.name || p.id }}
              <span v-if="isPluginManaged(p)" class="mg-up__tag is-plugin" title="该上游由插件接管，登录与签到走插件">
                插件
              </span>
            </td>
            <td class="is-id" :title="String(p.id ?? '')">{{ p.id }}</td>
            <td>{{ protocolText(p) }}</td>
            <td>
              <span class="mg-up__tag" :class="{ 'is-off': !p.hasKey }">
                {{ credentialText(p) }}
              </span>
            </td>
            <td>{{ accountText(p) }}</td>
            <td>{{ (p.models ?? []).length }}</td>
            <td class="is-actions">
              <button
                v-if="signinEnabled"
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="openSignin(p)"
              >登录</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="quotaLoading && quotaProviderId === p.id"
                @click="openQuotas(p)"
              >额度</button>
              <button type="button" class="mg-up__link" @click="openEditor(p)">编辑</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="pullModels(p)"
              >拉模型</button>
              <button
                type="button"
                class="mg-up__link"
                :disabled="busyId === p.id"
                @click="testProvider(p)"
              >测试</button>
              <button type="button" class="mg-up__link is-danger" @click="remove(p)">删除</button>
            </td>
          </tr>
          <tr v-if="!providers.length && !loading">
            <td colspan="7" class="mg-up__empty-cell">
              <template v-if="error">管理面不可用：{{ error }}</template>
              <template v-else>网关里还没有上游 provider，点「新增上游」添加</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReDialog
      v-model="dialogVisible"
      :title="editing ? '编辑上游 provider' : '新增上游 provider'"
      width="640px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form label-width="110px" class="mg-up__form">
        <div class="mg-up__grid">
          <el-form-item label="ID" required>
            <el-input v-model="form.id" placeholder="如 codex / claude" maxlength="64" :disabled="editing" />
          </el-form-item>
          <el-form-item label="显示名">
            <el-input v-model="form.name" placeholder="如 Codex 订阅" maxlength="128" />
          </el-form-item>
        </div>
        <el-form-item label="预设">
          <el-input v-model="form.preset" placeholder="可选：magpie 内置 preset 标识" maxlength="64" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input
            v-model="form.key"
            type="password"
            show-password
            spellcheck="false"
            :placeholder="editing ? '留空表示保留原 key' : '上游自己的 API key'"
          />
          <span class="mg-up__formhint">只写不改：读接口只回脱敏值，留空即保留原 key。</span>
        </el-form-item>
        <div class="mg-up__grid">
          <el-form-item label="Chat 地址">
            <el-input v-model="form.chat" placeholder="https://…/v1" maxlength="512" />
          </el-form-item>
          <el-form-item label="Responses">
            <el-input v-model="form.responses" placeholder="可留空" maxlength="512" />
          </el-form-item>
          <el-form-item label="Anthropic">
            <el-input v-model="form.anthropic" placeholder="可留空" maxlength="512" />
          </el-form-item>
          <el-form-item label="Gemini">
            <el-input v-model="form.gemini" placeholder="可留空" maxlength="512" />
          </el-form-item>
        </div>
        <el-form-item label="模型">
          <el-input
            v-model="form.modelsText"
            type="textarea"
            :rows="4"
            placeholder="一行一个模型 id，也可用逗号分隔；留空表示使用上游 / 预设的目录"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submit()">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 上游登录：授权在浏览器完成，凭据由 magpie 自己保存 -->
    <ReDialog
      v-model="signinVisible"
      :title="signinTitle"
      width="560px"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
      @closed="stopSignin"
    >
      <div class="mg-up__signin">
        <p class="mg-up__signin-state">
          状态：<b :class="'is-' + (signinSession?.state || 'waiting')">{{ signinStateText() }}</b>
        </p>
        <p v-if="signinHint" class="mg-up__formhint">{{ signinHint }}</p>
        <div v-if="signinSession?.url" class="mg-up__signin-url">
          <a :href="String(signinSession.url)" target="_blank" rel="noopener noreferrer">
            {{ signinSession.url }}
          </a>
        </div>
        <p v-if="signinSession?.user" class="mg-up__formhint">
          已登录账号：{{ signinSession.user }}
        </p>
        <p v-if="signinError" class="mg-up__error">{{ signinError }}</p>
      </div>
      <template #footer>
        <ReButton v-if="signinSession?.url" @click="openSigninPage()">打开授权页</ReButton>
        <ReButton v-if="signinRunning" @click="cancelSignin()">取消登录</ReButton>
        <ReButton type="primary" @click="signinVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 额度卡：直读管理面，含签到状态与插件账号 -->
    <ReDialog
      v-model="quotaVisible"
      :title="quotaTitle"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <div class="mg-up__quota">
        <p v-if="quotaError" class="mg-up__error">{{ quotaError }}</p>
        <p v-else-if="quotaLoading" class="mg-up__formhint">读取中…</p>
        <p v-else-if="!quotaRows.length" class="mg-up__formhint">
          网关没有返回额度卡（该上游可能没有可用账号，或还没登录）。
        </p>
        <div v-for="(q, i) in quotaRows" :key="i" class="mg-up__quota-card">
          <div class="mg-up__quota-head">
            <b>{{ String(q.provider ?? quotaProviderId) }}</b>
            <span class="mg-up__tag">{{ quotaKindText(q) }}</span>
            <span v-if="q.user" class="mg-up__formhint">账号 {{ q.user }}</span>
            <span v-if="q.plan" class="mg-up__formhint">套餐 {{ q.plan }}</span>
          </div>
          <p v-if="q.balance !== undefined && q.balance !== null" class="mg-up__quota-balance">
            余额 <b>{{ q.balance }}</b>
          </p>
          <ul v-if="quotaWindows(q).length" class="mg-up__quota-list">
            <li v-for="(w, j) in quotaWindows(q)" :key="j">
              <span>{{ windowName(w) }}</span>
              <span>{{ windowAmount(w) }}</span>
              <span v-if="windowReset(w)" class="mg-up__formhint">{{ windowReset(w) }}</span>
            </li>
          </ul>
          <p v-if="q.checkin && Object.keys(q.checkin).length" class="mg-up__formhint">
            签到：{{ briefText(q.checkin) }}
          </p>
        </div>
      </div>
      <template #footer>
        <ReButton v-if="quotaProviderId" :loading="quotaLoading" @click="refreshQuota()">
          重新读取
        </ReButton>
        <ReButton type="primary" @click="quotaVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Magpie 网关「上游 provider」管理面板。
 *
 * <p>Magpie 是常驻网关：上游（Codex / Claude / Gemini / 自定义 OpenAI 兼容服务）
 * 在 magpie 自己那里维护。本面板通过 magpie 的管理面
 * （{@code /api/providers}、{@code /api/provider/save|delete|models|test}）
 * 做增删改查，改完立即失效路由缓存，新的模型马上可以被免费渠道路由到。</p>
 *
 * <p>凭据口径：列表只回脱敏 key；编辑留空表示保留原值（magpie 的 save 语义）。</p>
 */
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import {
  channelApi,
  type ChannelConnectionSummary,
  type MagpieProvider,
  type MagpieQuota,
  type MagpieSigninSession,
} from '../channelApi'

const props = defineProps<{
  /** 渠道标识（固定 magpie） */
  channel: string
  /** 该渠道下已绑定的网关连接 */
  connections: ChannelConnectionSummary[]
  /** 是否显示「登录」入口（后端 supportsSignin） */
  signinEnabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'changed'): void
}>()

/** 当前管理的网关连接（多网关时可切换） */
const connectionId = ref('')
const loading = ref(false)
const error = ref('')
const baseUrl = ref('')
const pageUrl = ref('')
const providers = ref<MagpieProvider[]>([])
const busyId = ref('')

/** ── 上游登录（授权在浏览器完成，凭据不经过本服务） ── */
const signinVisible = ref(false)
const signinProvider = ref<MagpieProvider | null>(null)
const signinSession = ref<MagpieSigninSession | null>(null)
const signinError = ref('')
const signinPolling = ref(false)
let signinTimer: ReturnType<typeof setTimeout> | undefined

const signinTitle = computed(
  () => `上游登录 · ${signinProvider.value?.name || signinProvider.value?.id || ''}`,
)

/** 会话是否还没结束（installing / waiting / 未知） */
const signinRunning = computed(() => {
  const state = signinSession.value?.state
  return !state || state === 'waiting' || state === 'installing'
})

/** 当前会话的说明文案 */
const signinHint = computed(() => {
  const state = signinSession.value?.state
  if (state === 'installing') return '插件正在安装，装完后会给出授权页地址…'
  if (state === 'done') return '登录完成，网关已经保存凭据。'
  if (state === 'failed') return '登录失败，可关闭后重新发起。'
  if (state === 'canceled') return '已取消登录。'
  return '在打开的页面完成授权；本窗口会自动刷新状态。没弹出页面就点「打开授权页」。'
})

/** ── 额度卡（管理面直读，含签到状态与插件账号） ── */
const quotaVisible = ref(false)
const quotaLoading = ref(false)
const quotaError = ref('')
const quotaProviderId = ref('')
const quotaRows = ref<MagpieQuota[]>([])

const quotaTitle = computed(() => {
  const id = quotaProviderId.value
  const name = providers.value.find((p) => String(p.id ?? '') === id)?.name
  return `额度 · ${name || id}`
})

const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const originalId = ref('')

const form = reactive({
  id: '',
  name: '',
  preset: '',
  key: '',
  chat: '',
  responses: '',
  anthropic: '',
  gemini: '',
  modelsText: '',
})

const selectedConnection = computed(
  () => props.connections.find((c) => c.connectionId === connectionId.value) ?? props.connections[0],
)

/** 同步默认连接：优先主账号，其次第一条 */
watch(
  () => props.connections,
  (list) => {
    if (!list.length) {
      connectionId.value = ''
      return
    }
    if (list.some((c) => c.connectionId === connectionId.value)) return
    connectionId.value = (list.find((c) => c.primary) ?? list[0])!.connectionId ?? ''
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  if (props.connections.length && connectionId.value) void load()
})

// 切换网关（多连接）时重新读取；props 同步发生在挂载前也算一次
watch(connectionId, (id, prev) => {
  if (id && id !== prev) void load()
})

/** 读取上游清单 */
async function load(): Promise<void> {
  if (!connectionId.value) {
    providers.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await channelApi.magpieProviders(props.channel, { connectionId: connectionId.value })
    const out = (res as any)?.data ?? res
    baseUrl.value = String(out?.baseUrl ?? '')
    pageUrl.value = String(out?.pageUrl ?? '')
    providers.value = (out?.providers ?? []) as MagpieProvider[]
    if (out?.ok === false) {
      error.value = String(out?.message ?? 'Magpie 管理接口不可用')
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
    providers.value = []
  } finally {
    loading.value = false
  }
}

/** 打开新增 / 编辑弹窗 */
function openEditor(provider: MagpieProvider | null): void {
  editing.value = !!provider
  originalId.value = provider ? String(provider.id ?? '') : ''
  form.id = originalId.value
  form.name = String(provider?.name ?? '')
  form.preset = String(provider?.preset ?? '')
  form.key = ''
  form.chat = String(provider?.chat ?? '')
  form.responses = String(provider?.responses ?? '')
  form.anthropic = String(provider?.anthropic ?? '')
  form.gemini = String(provider?.gemini ?? '')
  form.modelsText = modelIdsOf(provider?.models).join('\n')
  dialogVisible.value = true
}

/** 保存（新增 / 覆盖 / 改名） */
async function submit(): Promise<void> {
  const id = form.id.trim()
  if (!id) {
    ElMessage.warning('请填写 provider ID')
    return
  }
  const provider: Record<string, unknown> = { id }
  const name = form.name.trim()
  if (name) provider.name = name
  if (form.preset.trim()) provider.preset = form.preset.trim()
  // 空 key 不发送：magpie 的 save 以「缺 key」表示保留原值
  if (form.key.trim()) provider.key = form.key.trim()
  for (const key of ['chat', 'responses', 'anthropic', 'gemini'] as const) {
    const value = form[key].trim()
    if (value) provider[key] = value
  }
  const models = form.modelsText
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  provider.models = models

  saving.value = true
  try {
    await channelApi.saveMagpieProvider(props.channel, {
      connectionId: connectionId.value,
      provider,
      isNew: !editing.value,
      from: editing.value && originalId.value && originalId.value !== id ? originalId.value : undefined,
    })
    ElMessage.success(editing.value ? '上游已更新' : '上游已新增')
    dialogVisible.value = false
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e?.message ?? e))
  } finally {
    saving.value = false
  }
}

/** 删除 */
async function remove(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  try {
    await ElMessageBox.confirm(`删除上游 provider「${provider.name || id}」？网关内该上游的模型会立即不可用。`, '确认删除', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await channelApi.deleteMagpieProvider(props.channel, { connectionId: connectionId.value, id })
    ElMessage.success('已删除')
    await load()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

/** 拉模型：把网关返回的模型 id 填回表单，避免手抄 */
async function pullModels(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  busyId.value = id
  try {
    const res = await channelApi.magpieProviderAction(props.channel, 'models', {
      connectionId: connectionId.value,
      provider,
    })
    const out = (res as any)?.data ?? res
    const ids = extractModelIds(out?.result ?? out)
    if (!ids.length) {
      ElMessage.info('网关未返回模型清单')
      return
    }
    openEditor(provider)
    form.modelsText = ids.join('\n')
    ElMessage.success(`已带出 ${ids.length} 个模型，确认后保存`)
  } catch (e: any) {
    ElMessage.error('拉取模型失败：' + (e?.message ?? e))
  } finally {
    busyId.value = ''
  }
}

/** 连通性测试 */
async function testProvider(provider: MagpieProvider): Promise<void> {
  busyId.value = String(provider.id ?? '')
  try {
    const res = await channelApi.magpieProviderAction(props.channel, 'test', {
      connectionId: connectionId.value,
      provider,
    })
    const out = (res as any)?.data ?? res
    ElMessage.success('测试已发起：' + brief(out?.result ?? out))
  } catch (e: any) {
    ElMessage.error('测试失败：' + (e?.message ?? e))
  } finally {
    busyId.value = ''
  }
}

/**
 * 该 provider 是否由插件接管（magpie 用 {@code move.state=plugin} 表示）。
 *
 * <p>接管后登录要走插件端点，所以按钮文案与请求体都得跟着变。</p>
 *
 * @param provider 上游行
 * @returns 是否插件接管
 */
function isPluginManaged(provider: MagpieProvider): boolean {
  const move = provider.move as Record<string, unknown> | undefined
  const state = move?.state ?? (provider as Record<string, unknown>).moveState
  return String(state ?? '') === 'plugin'
}

/**
 * 发起上游登录。
 *
 * <p>插件接管的 provider 传 {@code provider + method}，内置的传 {@code agent}；
 * 授权在 magpie 打开的页面里完成，凭据不经过本服务。</p>
 *
 * @param provider 上游行
 */
async function openSignin(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  signinProvider.value = provider
  signinSession.value = null
  signinError.value = ''
  signinVisible.value = true
  busyId.value = id
  try {
    const res = isPluginManaged(provider)
      ? await channelApi.magpieSignin(props.channel, {
          connectionId: connectionId.value,
          plugin: true,
          provider: id,
          method: 0,
        })
      : await channelApi.magpieSignin(props.channel, {
          connectionId: connectionId.value,
          agent: id,
        })
    const out = (res as any)?.data ?? res
    signinSession.value = (out?.result ?? out) as MagpieSigninSession
    if (!signinSession.value?.id) {
      signinError.value = '网关没有返回登录会话'
      return
    }
    if (signinSession.value.url) openSigninPage()
    schedulePoll()
  } catch (e: any) {
    signinError.value = e?.message ?? String(e)
  } finally {
    busyId.value = ''
  }
}

/** 打开授权页（弹窗被拦截时用户可再点按钮） */
function openSigninPage(): void {
  const url = signinSession.value?.url
  if (url) window.open(String(url), '_blank', 'noopener,noreferrer')
}

/** 登录状态文案 */
function signinStateText(): string {
  const state = signinSession.value?.state
  if (state === 'installing') return '安装插件中'
  if (state === 'waiting') return '等待授权'
  if (state === 'done') return '已完成'
  if (state === 'failed') return '失败'
  if (state === 'canceled') return '已取消'
  return '准备中'
}

/** 安排下一次轮询（2.5s 一次，终态停止） */
function schedulePoll(): void {
  stopPoll()
  signinTimer = setTimeout(() => void pollSignin(), 2500)
}

/** 轮询登录会话；完成后刷新上游与额度 */
async function pollSignin(): Promise<void> {
  const id = signinSession.value?.id
  if (!id || !signinVisible.value) return
  signinPolling.value = true
  try {
    const res = await channelApi.magpieSigninStatus(props.channel, id, {
      connectionId: connectionId.value,
    })
    const out = (res as any)?.data ?? res
    signinSession.value = (out?.result ?? out) as MagpieSigninSession
    const state = signinSession.value?.state
    if (state === 'done') {
      ElMessage.success('上游登录完成')
      await load()
      emit('changed')
      return
    }
    if (state === 'failed') {
      signinError.value = String(signinSession.value?.message ?? '登录失败')
      return
    }
    if (state === 'canceled') return
    schedulePoll()
  } catch (e: any) {
    signinError.value = e?.message ?? String(e)
  } finally {
    signinPolling.value = false
  }
}

/** 取消登录会话 */
async function cancelSignin(): Promise<void> {
  const id = signinSession.value?.id
  if (!id) return
  try {
    await channelApi.magpieSigninCancel(props.channel, id, { connectionId: connectionId.value })
    signinSession.value = { ...signinSession.value, state: 'canceled' }
    ElMessage.info('已取消登录')
  } catch (e: any) {
    ElMessage.error('取消失败：' + (e?.message ?? e))
  } finally {
    stopPoll()
  }
}

/** 停止轮询（关弹窗 / 卸载时） */
function stopSignin(): void {
  stopPoll()
  signinPolling.value = false
}

/** 清掉定时器 */
function stopPoll(): void {
  if (signinTimer) {
    clearTimeout(signinTimer)
    signinTimer = undefined
  }
}

/**
 * 打开某上游的额度卡。
 *
 * @param provider 上游行
 */
async function openQuotas(provider: MagpieProvider): Promise<void> {
  const id = String(provider.id ?? '')
  if (!id) return
  quotaProviderId.value = id
  quotaRows.value = []
  quotaError.value = ''
  quotaVisible.value = true
  await loadQuotas()
}

/**
 * 读取额度卡（按当前 provider 过滤）。
 */
async function loadQuotas(): Promise<void> {
  if (!quotaProviderId.value) return
  quotaLoading.value = true
  quotaError.value = ''
  try {
    const res = await channelApi.magpieQuotas(
      props.channel,
      { connectionId: connectionId.value },
      quotaProviderId.value,
    )
    const out = (res as any)?.data ?? res
    quotaRows.value = (out?.result?.quotas ?? out?.quotas ?? []) as MagpieQuota[]
  } catch (e: any) {
    quotaError.value = e?.message ?? String(e)
    quotaRows.value = []
  } finally {
    quotaLoading.value = false
  }
}

/**
 * 让网关重新读一次额度（跳过缓存）。
 */
async function refreshQuota(): Promise<void> {
  if (!quotaProviderId.value) return
  quotaLoading.value = true
  quotaError.value = ''
  try {
    const res = await channelApi.magpieQuotaRefresh(
      props.channel,
      quotaProviderId.value,
      quotaRows.value[0]?.user,
      { connectionId: connectionId.value },
    )
    const out = (res as any)?.data ?? res
    quotaRows.value = (out?.result?.quotas ?? out?.quotas ?? []) as MagpieQuota[]
    ElMessage.success('额度已刷新')
  } catch (e: any) {
    quotaError.value = e?.message ?? String(e)
  } finally {
    quotaLoading.value = false
  }
}

/** 额度卡类型文案 */
function quotaKindText(quota: MagpieQuota): string {
  if (quota.kind === 'balance') return '余额'
  if (quota.kind === 'subscription') return '订阅'
  return String(quota.kind ?? '额度')
}

/** 额度卡里的窗口列表（结构由上游决定，做空值兜底） */
function quotaWindows(quota: MagpieQuota): Array<Record<string, unknown>> {
  return Array.isArray(quota.windows) ? quota.windows : []
}

/** 窗口名 */
function windowName(w: Record<string, unknown>): string {
  return String(w.name ?? w.Name ?? '窗口')
}

/** 窗口用量：remaining / limit 单位 */
function windowAmount(w: Record<string, unknown>): string {
  const remaining = w.remaining ?? w.Remaining
  const limit = w.limit ?? w.Limit
  const unit = w.unit ?? w.Unit ?? ''
  if (remaining === undefined && limit === undefined) return '—'
  if (limit === undefined) return `${remaining} ${unit}`.trim()
  return `${remaining ?? '?'} / ${limit} ${unit}`.trim()
}

/** 窗口重置时间（毫秒时间戳） */
function windowReset(w: Record<string, unknown>): string {
  const raw = w.resetsAt ?? w.ResetsAt ?? w.resetAt
  const ms = Number(raw)
  if (!raw || Number.isNaN(ms) || ms <= 0) return ''
  const date = new Date(ms)
  return `重置 ${date.toLocaleString()}`
}

/** 对象摘要（最多 80 字） */
function briefText(value: unknown): string {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value)
    return text.length > 80 ? text.slice(0, 80) + '…' : text
  } catch {
    return '—'
  }
}

onUnmounted(stopSignin)

/** 协议摘要 */
function protocolText(provider: MagpieProvider): string {
  const list: string[] = []
  if (provider.chat) list.push('chat')
  if (provider.responses) list.push('responses')
  if (provider.anthropic) list.push('anthropic')
  if (provider.gemini) list.push('gemini')
  return list.length ? list.join(' / ') : '—'
}

/** 凭据展示：优先脱敏 key，其次 keyList 条数（magpie 的凭据在 keyList 里） */
function credentialText(provider: MagpieProvider): string {
  if (provider.key) return String(provider.key)
  const count = provider.keyCount
    ?? (Array.isArray(provider.keyList) ? provider.keyList.length : 0)
  return count > 0 ? `已配置 ${count} 条` : '无'
}

/**
 * 账号数：内置凭据行 + 插件账号数。
 *
 * <p>magpie 的 provider 行同时可能有两种账号：内置 {@code keyList} 与插件接管后的
 * {@code pluginAccounts}。分开报，才能看出插件到底接管了多少个账号。</p>
 *
 * @param provider 上游行
 * @returns 账号摘要
 */
function accountText(provider: MagpieProvider): string {
  const builtin = provider.keyCount
    ?? (Array.isArray(provider.keyList) ? provider.keyList.length : 0)
  const plugin = Number(provider.pluginAccounts ?? 0)
  const parts: string[] = []
  if (builtin > 0) parts.push(`内置 ${builtin}`)
  if (plugin > 0) parts.push(`插件 ${plugin}`)
  return parts.length ? parts.join(' · ') : '—'
}

/** 模型 id 归一：magpie 下发对象数组 [{id,name}]，也兼容字符串数组 */
function modelIdsOf(models: MagpieProvider['models']): string[] {
  const ids: string[] = []
  for (const item of models ?? []) {
    if (typeof item === 'string' && item.trim()) ids.push(item.trim())
    else if (item && typeof item === 'object' && item.id) ids.push(String(item.id))
  }
  return Array.from(new Set(ids))
}

/** 从上游响应里挖出模型 id */
function extractModelIds(result: any): string[] {
  const raw = result?.modelIds
    ?? result?.models
    ?? result?.provider?.models
    ?? result?.data
    ?? result?.ids
  if (!Array.isArray(raw)) return []
  const ids: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) ids.push(item.trim())
    else if (item && typeof item === 'object' && item.id) ids.push(String(item.id))
  }
  return Array.from(new Set(ids))
}

/** 响应摘要（最多 120 字） */
function brief(value: unknown): string {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value)
    return text.length > 120 ? text.slice(0, 120) + '…' : text
  } catch {
    return '已返回'
  }
}
</script>

<style scoped>
.mg-up {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mg-up__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.mg-up__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.mg-up__title i {
  margin-left: 4px;
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.mg-up__select {
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
}
.mg-up__btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-up__btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.mg-up__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mg-up__btn.is-primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.mg-up__hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}
.mg-up__tablewrap {
  overflow-x: auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
}
.mg-up__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.mg-up__table th,
.mg-up__table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  white-space: nowrap;
}
.mg-up__table th {
  font-weight: 600;
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-up__table tbody tr:last-child td {
  border-bottom: none;
}
.mg-up__table td.is-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary, #303133);
}
.mg-up__table td.is-id {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__table td.is-actions,
.mg-up__table th.is-actions {
  text-align: right;
}
.mg-up__tag {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  color: var(--el-color-success, #67c23a);
  background: var(--el-color-success-light-9, #f0f9eb);
}
.mg-up__tag.is-off {
  color: var(--el-text-color-secondary, #909399);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mg-up__link {
  padding: 0 6px;
  border: none;
  background: none;
  color: var(--el-color-primary, #409eff);
  font-size: 12.5px;
  cursor: pointer;
}
.mg-up__link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mg-up__link.is-danger {
  color: var(--el-color-danger, #f56c6c);
}
.mg-up__empty,
.mg-up__empty-cell {
  padding: 18px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__form {
  padding-top: 4px;
}
.mg-up__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}
.mg-up__formhint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}
.mg-up__tag.is-plugin {
  margin-left: 6px;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.mg-up__signin {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}
.mg-up__signin-state {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
}
.mg-up__signin-state b.is-waiting,
.mg-up__signin-state b.is-installing {
  color: var(--el-color-warning, #e6a23c);
}
.mg-up__signin-state b.is-done {
  color: var(--el-color-success, #67c23a);
}
.mg-up__signin-state b.is-failed {
  color: var(--el-color-danger, #f56c6c);
}
.mg-up__signin-url {
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light, #f5f7fa);
  font-size: 12px;
  word-break: break-all;
}
.mg-up__signin-url a {
  color: var(--el-color-primary, #409eff);
  text-decoration: none;
}
.mg-up__quota {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}
.mg-up__quota-card {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  background: var(--el-fill-color-blank, #fff);
}
.mg-up__quota-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--el-text-color-primary, #303133);
}
.mg-up__quota-head .mg-up__tag {
  margin-left: 0;
}
.mg-up__quota-head .mg-up__formhint {
  margin: 0;
}
.mg-up__quota-balance {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: var(--el-text-color-regular, #606266);
}
.mg-up__quota-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mg-up__quota-list li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
}
.mg-up__quota-list li .mg-up__formhint {
  margin: 0;
}
@media (max-width: 640px) {
  .mg-up__grid {
    grid-template-columns: 1fr;
  }
}
</style>
