<script setup lang="ts">
// 渠道管理页（admin-only）。
//
// 设计原则：
// - 只展示 dsh-our-free-model 仓库的账号类渠道（Cline / Qoder / Trae / Gemini），
//   通过后端 /api/channels 拉取；前端不硬编码渠道清单，新增 SPI 实现即可自动呈现。
// - 每个渠道卡片呈现：
//     ① 渠道总开关（PUT /api/channels/{ch}/enabled）
//     ② 账号连接列表（绑定 / 刷新 / 签到 / 删除）
//     ③ 模型拉取 + 单模型开关（PUT /api/channels/{ch}/models/{m}/enabled）
// - 绑定交互：点「绑定账号」→ 弹窗 + 自动打开授权页（或显示二维码）→
//   后端 SSE 持续等待 → 拿到凭据自动关窗并刷新列表。用户不需要粘贴回调地址；
//   TRAE / Gemini / LobsterAI 由后端本地监听回环端口接收浏览器跳转。
// - 自动签到走后端 ChannelCheckinTask，前端「签到」按钮仅做手动补一次。

import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  // @element-plus/icons-vue 导出的名字**没有 Icon 后缀**（Refresh / Plus / Delete /
  // Connection / DataAnalysis）。此前按「XxxIcon」写，构建直接报 MISSING_EXPORT，
  // 整个应用打不出包。这里用 `as XxxIcon` 起别名，模板里的标签名保持不变。
  Refresh as RefreshIcon,
  Plus as PlusIcon,
  Delete as DeleteIcon,
  Connection as ConnectionIcon,
  DataAnalysis as DataAnalysisIcon,
} from '@element-plus/icons-vue'
import { channelApi, type ChannelSummary, type ChannelConnectionSummary } from '@/services/javaApi'

interface ParsedHandle {
  channel: string
  handle: Record<string, any>
  verifyUrl?: string
}

const loading = ref(false)
const loadError = ref('')
const channels = ref<ChannelSummary[]>([])

// 当前选中的渠道 id
const activeChannel = ref<string>('')

// 渠道卡片内的状态：是否正在签到 / 正在拉模型 / 正在刷新
const busy = ref<Record<string, { sign?: boolean; models?: boolean; refresh?: boolean; login?: boolean }>>({})

// 账号 label 输入
const accountLabel = ref<Record<string, string>>({})

const busyOf = (channel: string) => (busy.value[channel] ??= {})

const activeSummary = () => channels.value.find((c) => c.channel === activeChannel.value)

// ---------- 取数 ----------
async function loadChannels() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await channelApi.list()
    const data = (res as any)?.data ?? res
    channels.value = Array.isArray(data) ? data : []
    if (!activeChannel.value || !channels.value.some((c) => c.channel === activeChannel.value)) {
      activeChannel.value = channels.value[0]?.channel ?? ''
    }
  } catch (e: any) {
    loadError.value = e?.message ?? String(e)
    ElMessage.error('渠道列表加载失败：' + loadError.value)
  } finally {
    loading.value = false
  }
}

// ---------- 渠道总开关 ----------
async function toggleChannelEnabled(channel: string, enabled: boolean) {
  const b = busyOf(channel)
  if (b.login) return
  b.refresh = true
  try {
    await channelApi.setEnabled(channel, enabled)
    const c = channels.value.find((x) => x.channel === channel)
    if (c) c.enabled = enabled
    ElMessage.success('渠道状态已更新')
  } catch (e: any) {
    ElMessage.error('更新渠道开关失败：' + (e?.message ?? e))
  } finally {
    b.refresh = false
  }
}

// ---------- 账号绑定 ----------
// 交互契约（所有渠道统一）：
//   点「绑定账号」→ 立刻弹出绑定对话框 → 后端 start-login → 自动打开授权页/二维码
//   → SSE 持续等待 → 拿到凭据（done）自动关弹窗并刷新账号列表。
// 用户在弹窗里<b>不输入任何账号信息</b>（唯一例外：短信验证码、手动 API key，
// 这两类在页面内拿不到，但也都放在弹窗里完成，不散落在卡片上）。
//
// ⚠️ 用 reactive：模板直接读 bindState[c.channel]，必须响应式才能渲染弹窗内容。
const bindState = reactive<Record<string, {
  handle: Record<string, any>
  input: { phone: string; smsCode: string; apiKey: string }
}>>({})

// 进行中的 SSE 客户端（按渠道），用于「关闭弹窗 / 重新发起」时中止旧流。
const sseClients: Record<string, { close: () => void }> = {}

// 绑定对话框的可见性 / 阶段 / 计时
const bindDialogVisible = ref(false)
const bindChannel = ref('')
const bindPhase = ref<'starting' | 'waiting' | 'error'>('starting')
const bindError = ref('')
const bindElapsed = ref(0)
let bindTimer: ReturnType<typeof setInterval> | null = null

// Raccoon 之类扫码渠道的二维码图片（dataURL），由 url 本地渲染，不外发。
const qrImages = reactive<Record<string, string>>({})

function resetBindChannel(channel: string) {
  bindState[channel] = { handle: {}, input: { phone: '', smsCode: '', apiKey: '' } }
}
function ensureBindState(channel: string) {
  if (!bindState[channel]) resetBindChannel(channel)
  return bindState[channel]!
}

// 按渠道 loginMethod 把弹窗内的输入合并进句柄后再开流。
// 约定键（与 SPI 实现对齐）：
//   sms      → handle.phone / handle.smsCode（Loomy）
//   api-key  → handle.apiKey（OpenCode）
//   其余     → handle.callbackUrl（手写兜底；TRAE / Gemini / LobsterAI 已由后端监听回调，正常不会用到）
function buildPollHandle(channel: string): Record<string, any> {
  const state = bindState[channel]
  const handle: Record<string, any> = { ...(state?.handle ?? {}) }
  const input = state?.input ?? { phone: '', smsCode: '', apiKey: '' }
  if (input.phone?.trim()) handle.phone = input.phone.trim()
  if (input.smsCode?.trim()) handle.smsCode = input.smsCode.trim()
  if (input.apiKey?.trim()) handle.apiKey = input.apiKey.trim()
  return handle
}

// 统一句柄 URL 键读取链：后端统一写 verifyUrl（各实现旧键 loginUrl / qrUrl /
// url / verification_uri* 保留兼容）。
function handleVerifyUrl(handle: Record<string, any>): string {
  if (!handle) return ''
  return String(
    handle.verifyUrl
    || handle.verification_uri_complete
    || handle.verification_uri
    || handle.loginUrl
    || handle.qrUrl
    || handle.url
    || '',
  )
}

// 本次绑定是否由后端本地回调自动收尾（TRAE / Gemini / LobsterAI）。
// 后端在句柄里回 callbackListening；true 表示用户授权后浏览器跳转会被自动接收。
const callbackAuto = (channel: string) => bindState[channel]?.handle?.callbackListening === true

// 当前绑定的渠道登录方式
const bindMethod = () => String(channels.value.find((c) => c.channel === bindChannel.value)?.loginMethod ?? '')
const isSmsBind = () => /^sms$/i.test(bindMethod())
const isApiKeyBind = () => /^api-key$/i.test(bindMethod())
const isQrBind = () => /^qr-code$/i.test(bindMethod())
const bindNeedsInput = () => isSmsBind() || isApiKeyBind()

// 设备码：优先读句柄的 user_code；没有时从 verifyUrl 的 query 里兜底解析。
// 上游（如 MiniMax）只把码拼在 verification_uri_complete 里，句柄不带独立字段，
// 前端若只读 handle.user_code，弹窗上就会空一块，用户不知道该输什么。
function bindUserCode(): string {
  const handle = bindState[bindChannel.value]?.handle ?? {}
  const direct = String(handle.user_code ?? handle.userCode ?? '').trim()
  if (direct) return direct
  const url = handleVerifyUrl(handle)
  const m = /[?&]user_code=([^&#]+)/i.exec(url)
  return m ? decodeURIComponent(m[1]) : ''
}

// 短信发码是否已成功（句柄被 poll 回显带上 smsSent）
const smsSent = () => bindState[bindChannel.value]?.handle?.smsSent === true

// 自动打开授权页：新窗口 + noopener（防止被打开的页面拿到 opener 句柄）。
//
// ⚠️ 两个坑：
//   1. 必须由用户点击同步触发，否则会被浏览器拦截；
//   2. 带 noopener 特性时，浏览器规范规定 window.open() **一律返回 null**
//      （新窗口没有 opener 可回指，自然拿不到 WindowProxy）。
//      所以不能再用 `!win` 判断「被拦截」—— 那会让每一次正常的自动开窗都弹出
//      「浏览器拦截了授权页弹窗」的错误提示，用户看到成功打开的新标签页时却被告知失败。
function openAuthWindow(url: string) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
  // 不留 window 句柄，也就不做拦截判定：弹窗没开时用户仍可点弹窗内的
  // 「打开授权页」按钮（同一次点击上下文，属用户手势，不会再次被拦）。
}

// 扫码渠道：把 URL 本地渲染成二维码图片
async function renderQr(channel: string, url: string) {
  if (!url) return
  try {
    const QRCode = (await import('qrcode')).default
    qrImages[channel] = await QRCode.toDataURL(url, { width: 220, margin: 1 })
  } catch {
    // 渲染失败不影响主流程，弹窗里仍能看到链接
    qrImages[channel] = ''
  }
}

function stopBindTimer() {
  if (bindTimer) {
    clearInterval(bindTimer)
    bindTimer = null
  }
}

function closeBindDialog() {
  const channel = bindChannel.value
  if (channel) {
    sseClients[channel]?.close()
    delete sseClients[channel]
    const b = busy.value[channel]
    if (b) b.login = false
  }
  stopBindTimer()
  bindDialogVisible.value = false
}

// 开 SSE 流并驱动弹窗阶段。
function startSse(channel: string) {
  sseClients[channel]?.close()
  delete sseClients[channel]
  bindPhase.value = 'waiting'
  bindError.value = ''
  const sse = channelApi.sseLogin(
    channel,
    { handle: buildPollHandle(channel), label: accountLabel.value[channel] || undefined },
    {
      onPending: (data) => {
        // ⚠️ 合并服务端回显的句柄（Loomy 发码后写回的 msgid/smsSent、
        // Zcode 的 __lastPollAt 等），否则两次轮询之间服务端写入的状态会丢。
        const state = bindState[channel]
        if (data?.handle && typeof data.handle === 'object' && state) {
          Object.assign(state.handle, data.handle)
        }
      },
      onDone: (data) => {
        delete sseClients[channel]
        const b = busy.value[channel]
        if (b) b.login = false
        stopBindTimer()
        bindDialogVisible.value = false
        delete bindState[channel]
        ElMessage.success('账号绑定成功' + (data?.label ? '：' + data.label : ''))
        void loadChannels()
      },
      onFailed: (data) => {
        delete sseClients[channel]
        const b = busy.value[channel]
        if (b) b.login = false
        stopBindTimer()
        bindPhase.value = 'error'
        bindError.value = data?.code === 'TIMEOUT'
          ? '等待超时：请点「重新发起」再试'
          : (data?.message ?? data?.code ?? '未知错误')
      },
      onError: (err) => {
        delete sseClients[channel]
        const b = busy.value[channel]
        if (b) b.login = false
        stopBindTimer()
        bindPhase.value = 'error'
        bindError.value = err instanceof Error ? err.message : String(err)
      },
    },
    300,
  )
  sseClients[channel] = sse
}

// 点「绑定账号」的唯一入口：同步开窗（避免被拦截）→ 再拉句柄 → 开 SSE。
async function openBindDialog(channel: string) {
  const b = busyOf(channel)
  if (b.login) return
  b.login = true
  bindChannel.value = channel
  bindDialogVisible.value = true
  bindPhase.value = 'starting'
  bindError.value = ''
  bindElapsed.value = 0
  resetBindChannel(channel)
  stopBindTimer()
  bindTimer = setInterval(() => { bindElapsed.value += 1 }, 1000)

  try {
    const res = await channelApi.startLogin(channel)
    const out = (res as any)?.data ?? res
    const handle = (out?.handle ?? {}) as Record<string, any>
    bindState[channel]!.handle = handle

    const url = handleVerifyUrl(handle)
    if (isQrBind() && url) {
      await renderQr(channel, url)
    } else if (url && !isSmsBind() && !isApiKeyBind()) {
      // 授权页类渠道：直接开新窗口（用户点完就切过去了，不用回来操作本页）
      openAuthWindow(url)
    }

    // sms / api-key 需要用户先在弹窗里给出凭据，不立即开流；
    // 其余渠道（设备码 / 授权页 / 扫码）立刻开流等待。
    if (!bindNeedsInput()) {
      startSse(channel)
    } else {
      bindPhase.value = 'waiting'
    }
    // sms / api-key 之外的入参就绪后立刻发起；这里仅提示状态。
    if (handle.callbackListening === false) {
      ElMessage.warning('本地回调端口不可用，授权后需要手动粘贴回调地址')
    }
  } catch (e: any) {
    bindPhase.value = 'error'
    bindError.value = e?.message ?? String(e)
    b.login = false
  }
}

// 弹窗内「重新发起」：重新走一遍 start-login（换新授权码/新二维码）
async function restartBind() {
  const channel = bindChannel.value
  if (!channel) return
  sseClients[channel]?.close()
  delete sseClients[channel]
  const b = busyOf(channel)
  b.login = false
  await openBindDialog(channel)
}

// 短信：发码（把手机号带给后端，后端调 sendMsgCode 并写回 msgid）
async function sendSmsCode() {
  const state = bindState[bindChannel.value]
  if (!state) return
  if (!state.input.phone.trim()) {
    ElMessage.warning('请先填写手机号')
    return
  }
  state.input.smsCode = ''
  startSse(bindChannel.value)
}

// 短信：提交验证码；api-key：提交 key
function submitBindInput() {
  const channel = bindChannel.value
  const state = bindState[channel]
  if (!state) return
  if (isSmsBind() && !smsSent() && !state.input.smsCode.trim()) {
    void sendSmsCode()
    return
  }
  if (isApiKeyBind() && !state.input.apiKey.trim()) {
    ElMessage.warning('请填写 API key（匿名通道填 public）')
    return
  }
  startSse(channel)
}

// ---------- 账号刷新 / 签到 / 删除 ----------
async function refreshAccount(channel: string, label: string) {
  const b = busyOf(channel)
  b.refresh = true
  try {
    await channelApi.refresh(channel, { label })
    ElMessage.success('凭据已刷新')
  } catch (e: any) {
    ElMessage.error('刷新失败：' + (e?.message ?? e))
  } finally {
    b.refresh = false
  }
}

async function checkin(channel: string, label: string) {
  const b = busyOf(channel)
  b.sign = true
  try {
    const res = await channelApi.checkin(channel, { label })
    const out = (res as any)?.data ?? res
    if (out?.result && Object.keys(out.result).length > 0) {
      ElMessage.success('签到完成：' + JSON.stringify(out.result))
    } else {
      ElMessage.info(out?.message ?? '签到完成')
    }
  } catch (e: any) {
    ElMessage.error('签到失败：' + (e?.message ?? e))
  } finally {
    b.sign = false
  }
}

async function deleteAccount(channel: string, label: string) {
  try {
    await ElMessageBox.confirm(`删除账号「${label}」？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await channelApi.deleteConnection(channel, label)
    ElMessage.success('账号已删除')
    await loadChannels()
  } catch (e: any) {
    ElMessage.error('删除失败：' + (e?.message ?? e))
  }
}

// ---------- 模型 ----------
async function pullModels(channel: string) {
  const b = busyOf(channel)
  b.models = true
  try {
    const summary = channels.value.find((c) => c.channel === channel)
    const label = summary?.connections?.[0]?.label
    const res = await channelApi.listModels(channel, { label })
    const out = (res as any)?.data ?? res
    if (out?.models?.length) {
      ElMessage.success(`拉取到 ${out.models.length} 个模型，正在落库…`)
      // 落库走渠道专用端点（SPI listModels → sys_ai_provider_model），
      // 而非 /api/providers/{id}/models/import-all（该端点对 oauth 类 provider 会失败）。
      const impRes = await channelApi.importModels(channel, { label })
      const imp = (impRes as any)?.data ?? impRes
      if (imp?.ok) {
        ElMessage.success(`落库完成：新增 ${imp.created ?? 0}，更新 ${imp.updated ?? 0}`)
      }
      summary.models = out.models.map((m: any) => ({
        model: m.id,
        enabled: m.enabled ?? true,
        alias: m.name,
        contextWindow: m.contextWindow,
      }))
    } else {
      ElMessage.info('未返回模型')
    }
  } catch (e: any) {
    ElMessage.error('拉取模型失败：' + (e?.message ?? e))
  } finally {
    b.models = false
  }
}

async function toggleModel(channel: string, model: string, enabled: boolean) {
  try {
    await channelApi.setModelEnabled(channel, model, enabled)
    ElMessage.success(enabled ? '已启用 ' + model : '已停用 ' + model)
    const summary = channels.value.find((c) => c.channel === channel)
    const m = summary?.models?.find((x) => x.model === model)
    if (m) m.enabled = enabled
  } catch (e: any) {
    ElMessage.error('切换失败：' + (e?.message ?? e))
  }
}

watch(activeChannel, () => {
  /* 切换渠道卡片时不做额外操作 */
}, { immediate: false })

onMounted(() => {
  loadChannels()
})

// 卸载时中止所有进行中的登录流，避免后端线程空转到超时、前端残留回调。
onBeforeUnmount(() => {
  for (const key of Object.keys(sseClients)) {
    try {
      sseClients[key].close()
    } catch {
      /* 已关闭 */
    }
    delete sseClients[key]
  }
})

// 模板引用
const busyFor = (channel: string, key: 'sign' | 'models' | 'refresh' | 'login') =>
  busyOf(channel)[key] === true
const setAccountLabel = (channel: string, label: string) => {
  accountLabel.value[channel] = label
}
const setCallback = (channel: string, url: string) => {
  pendingCallback.value[channel] = url
}
const pendingCallbackFor = (channel: string) => pendingCallback.value[channel] ?? ''
const accountLabelFor = (channel: string) => accountLabel.value[channel] ?? ''
</script>

<template>
  <div class="chm" data-page="channel">
    <!-- 页头 -->
    <header class="chm-head">
      <div class="chm-head__text">
        <h2 class="chm-head__title">渠道管理</h2>
        <p class="chm-head__sub">
          账号类渠道的账号绑定、轮询、刷新、签到与模型开关。
          <b>{{ channels.length }}</b> 个已注册渠道
        </p>
      </div>
      <div class="chm-head__actions">
        <el-button class="chm-btn" :loading="loading" @click="loadChannels">
          <el-icon v-if="!loading" class="chm-btn__icon" aria-hidden="true"><RefreshIcon /></el-icon>
          刷新
        </el-button>
      </div>
    </header>

    <!-- 错误条 -->
    <div v-if="loadError" class="chm-alert is-danger">
      <span>渠道列表加载失败：{{ loadError }}</span>
      <button @click="loadChannels">重试</button>
    </div>

    <!-- 空态 -->
    <el-empty v-if="!loading && !channels.length" description="尚未注册任何账号类渠道">
      <template #description>
        <p>尚未注册任何账号类渠道</p>
        <p class="chm-empty__hint">
          渠道清单来自后端 SPI 注册表（{@code META-INF/extensions/AccountChannelAuthManager}）。
        </p>
      </template>
    </el-empty>

    <!-- 渠道卡片网格 -->
    <div v-else class="chm-grid">
      <section
        v-for="c in channels"
        :key="c.channel"
        class="chm-card"
        :class="{ 'is-active': c.channel === activeChannel }"
        role="button"
        tabindex="0"
        @click="activeChannel = c.channel"
        @keydown.enter="activeChannel = c.channel"
        @keydown.space.prevent="activeChannel = c.channel"
      >
        <!-- 卡片头 -->
        <div class="chm-card__head">
          <div class="chm-card__title">
            <b>{{ c.displayName || c.channel }}</b>
            <span class="chm-card__chip" v-if="c.supportsCheckin">可签到</span>
            <span class="chm-card__chip is-muted" v-else>无签到</span>
          </div>
          <el-switch
            v-model="c.enabled"
            class="chm-card__switch"
            @click.stop
            @change="(v: boolean | string | number) => toggleChannelEnabled(c.channel, !!v)"
          />
        </div>

        <!-- 账号区 -->
        <div class="chm-card__section">
          <div class="chm-card__sect-title">
            <el-icon aria-hidden="true"><ConnectionIcon /></el-icon>
            账号 <i class="chm-card__sect-count">{{ (c.connections ?? []).length }}</i>
          </div>
          <div class="chm-card__accounts">
            <div
              v-for="conn in c.connections ?? []"
              :key="conn.connectionId"
              class="chm-acc"
              :class="{ 'is-stale': conn.status === 'expired' || conn.status === 'invalid' }"
            >
              <span class="chm-acc__label" :title="conn.label">{{ conn.label || '未命名' }}</span>
              <span class="chm-acc__state" :class="{
                'is-valid': conn.status === 'valid',
                'is-stale': conn.status === 'expired' || conn.status === 'invalid',
                'is-pending': conn.status === 'unbound' || !conn.status,
              }">
                {{ conn.status || '未知' }}
              </span>
              <div class="chm-acc__actions">
                <button class="chm-acc__btn" :disabled="busyFor(c.channel, 'refresh')"
                        @click.stop="refreshAccount(c.channel, conn.label ?? '')">刷新</button>
                <button v-if="c.supportsCheckin" class="chm-acc__btn"
                        :disabled="busyFor(c.channel, 'sign')"
                        @click.stop="checkin(c.channel, conn.label ?? '')">签到</button>
                <button class="chm-acc__btn is-danger"
                        @click.stop="deleteAccount(c.channel, conn.label ?? '')">删除</button>
              </div>
            </div>
            <div v-if="!(c.connections ?? []).length" class="chm-card__empty">
              尚无绑定账号
            </div>
          </div>

          <!-- 绑定新账号：点一下即弹窗，授权页自动打开，SSE 完成后自动关窗 -->
          <div class="chm-card__bind">
            <div class="chm-card__bindrow">
              <!--
                v-model 只接受「成员表达式」（a / a.b / a[i]）；写成函数调用
                accountLabelFor(c.channel) 会直接编译失败：
                "v-model value must be a valid JavaScript member expression"，
                整个应用构建挂掉。这里本来就是「读用函数、写用 @input」的单向绑定，
                改成 :value 后语义不变、且能编译。
              -->
              <input
                :value="accountLabelFor(c.channel)"
                @input="setAccountLabel(c.channel, (e as any).target.value)"
                class="chm-input"
                placeholder="账号标签（可选）"
                style="flex: 1"
              />
              <button class="chm-btn chm-btn--primary" :disabled="busyFor(c.channel, 'login')"
                      @click.stop="openBindDialog(c.channel)">
                <el-icon v-if="!busyFor(c.channel, 'login')" class="chm-btn__icon" aria-hidden="true">
                  <PlusIcon />
                </el-icon>
                {{ busyFor(c.channel, 'login') ? '登录中…' : '绑定账号' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 模型区 -->
        <div class="chm-card__section">
          <div class="chm-card__sect-title">
            <el-icon aria-hidden="true"><DataAnalysisIcon /></el-icon>
            模型 <i class="chm-card__sect-count">{{ (c.models ?? []).length }}</i>
            <button class="chm-card__pull" :disabled="busyFor(c.channel, 'models')"
                    @click.stop="pullModels(c.channel)">
              {{ busyFor(c.channel, 'models') ? '拉取中…' : '拉取模型' }}
            </button>
          </div>
          <div class="chm-card__models">
            <label
              v-for="m in c.models ?? []"
              :key="m.model"
              class="chm-model"
              :class="{ 'is-off': !m.enabled }"
            >
              <input type="checkbox" :checked="m.enabled"
                     @change="(e) => toggleModel(c.channel, m.model, (e as any).target.checked)" />
              <span class="chm-model__name" :title="m.model">{{ m.model }}</span>
              <span v-if="m.contextWindow" class="chm-model__ctx">{{ m.contextWindow }}</span>
            </label>
            <div v-if="!(c.models ?? []).length" class="chm-card__empty">
              该渠道暂无已启用模型
            </div>
          </div>
        </div>
      </section>
    </div>

    <!--
      绑定账号对话框：所有渠道统一。
      内容 = 状态 / 授权码 / 二维码 / 链接 + （仅短信与 API key）对应输入框。
      拿到凭据（SSE done）自动关闭；用户在弹窗里不做任何账号粘贴。
    -->
    <el-dialog
      v-model="bindDialogVisible"
      :title="'绑定账号 · ' + (channels.find((c) => c.channel === bindChannel)?.displayName || bindChannel)"
      width="460px"
      append-to-body
      :close-on-click-modal="false"
      class="chm-bind-dialog"
      @closed="closeBindDialog"
    >
      <div class="chm-bind">
        <!-- 状态行 -->
        <div class="chm-bind__status" :class="{ 'is-error': bindPhase === 'error' }">
          <span class="chm-bind__dot" :class="{ 'is-error': bindPhase === 'error' }" />
          <span v-if="bindPhase === 'starting'">正在创建登录会话…</span>
          <span v-else-if="bindPhase === 'error'">失败：{{ bindError }}</span>
          <span v-else-if="isSmsBind() && !smsSent()">请输入手机号并获取验证码</span>
          <span v-else-if="isSmsBind()">验证码已发送，请填写后提交</span>
          <span v-else-if="isApiKeyBind()">请填写 API key 后提交</span>
          <span v-else-if="isQrBind()">请用微信扫码授权</span>
          <span v-else-if="callbackAuto(bindChannel)">已打开授权页，完成后会自动绑定（无需回到本页）</span>
          <span v-else>已打开授权页，请在那里完成登录</span>
          <span class="chm-bind__elapsed" v-if="bindPhase === 'waiting'">{{ bindElapsed }}s</span>
        </div>

        <!-- 二维码（Raccoon 等扫码渠道） -->
        <div v-if="isQrBind() && qrImages[bindChannel]" class="chm-bind__qr">
          <img :src="qrImages[bindChannel]" alt="登录二维码" />
        </div>

        <!-- 设备码 / 授权码 -->
        <div v-if="bindUserCode()" class="chm-bind__code">
          <span class="chm-bind__code-label">授权码</span>
          <b class="chm-bind__code-value">{{ bindUserCode() }}</b>
        </div>

        <!-- 授权链接（自动开窗失败或被关掉时的兜底入口） -->
        <div v-if="handleVerifyUrl(bindState[bindChannel]?.handle ?? {}) && !isSmsBind() && !isApiKeyBind()"
             class="chm-bind__link">
          <button class="chm-btn" type="button"
                  @click="openAuthWindow(handleVerifyUrl(bindState[bindChannel]?.handle ?? {}))">
            打开授权页
          </button>
          <a :href="handleVerifyUrl(bindState[bindChannel]?.handle ?? {})" target="_blank" rel="noopener noreferrer">
            或点此链接
          </a>
        </div>

        <!-- 短信登录（Loomy）：手机号 → 验证码 -->
        <div v-if="isSmsBind()" class="chm-bind__input">
          <div class="chm-bind__row">
            <input
              :value="bindState[bindChannel]?.input?.phone ?? ''"
              @input="(bindState[bindChannel]!.input.phone = (e as any).target.value)"
              class="chm-input"
              placeholder="手机号"
              inputmode="numeric"
            />
            <button class="chm-btn" type="button" :disabled="smsSent()" @click="sendSmsCode()">获取验证码</button>
          </div>
          <div class="chm-bind__row" v-if="smsSent()">
            <input
              :value="bindState[bindChannel]?.input?.smsCode ?? ''"
              @input="(bindState[bindChannel]!.input.smsCode = (e as any).target.value)"
              class="chm-input"
              placeholder="短信验证码"
              inputmode="numeric"
            />
            <button class="chm-btn chm-btn--primary" type="button" @click="submitBindInput()">提交</button>
          </div>
        </div>

        <!-- API key（OpenCode） -->
        <div v-if="isApiKeyBind()" class="chm-bind__input">
          <div class="chm-bind__row">
            <input
              :value="bindState[bindChannel]?.input?.apiKey ?? ''"
              @input="(bindState[bindChannel]!.input.apiKey = (e as any).target.value)"
              class="chm-input"
              placeholder="Zen API key（匿名通道填 public）"
            />
            <button class="chm-btn chm-btn--primary" type="button" @click="submitBindInput()">提交</button>
          </div>
        </div>

        <!-- 本地回调不可用时的兜底：允许手工粘贴回调地址 -->
        <div v-if="bindState[bindChannel]?.handle?.callbackListening === false" class="chm-bind__input">
          <div class="chm-bind__hint">检测到本地回调端口不可用，授权后请把浏览器地址栏的回调地址粘到下面：</div>
          <div class="chm-bind__row">
            <input
              :value="bindState[bindChannel]?.handle?.callbackUrl ?? ''"
              @input="(bindState[bindChannel]!.handle.callbackUrl = (e as any).target.value)"
              class="chm-input"
              placeholder="http://127.0.0.1:…/authorize?…"
            />
            <button class="chm-btn" type="button" @click="submitBindInput()">提交</button>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="chm-btn" type="button" @click="restartBind()"
                :disabled="bindPhase === 'starting'">重新发起</button>
        <button class="chm-btn" type="button" @click="closeBindDialog()">取消</button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.chm {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 24px;
}
.chm-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.chm-head__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.chm-head__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}
.chm-head__actions {
  display: flex;
  gap: 8px;
}
.chm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
  transition: all .15s ease;
}
.chm-btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.chm-btn--primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.chm-btn--primary:hover {
  background: var(--el-color-primary-light-3, #79bbff);
}
.chm-btn--primary:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.chm-alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.chm-alert.is-danger {
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 8%, transparent);
  color: var(--el-color-danger, #f56c6c);
}
.chm-alert button {
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  border-radius: 4px;
  padding: 2px 10px;
  cursor: pointer;
  font-size: 12px;
}
.chm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}
.chm-card {
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 10px;
  padding: 16px;
  background: var(--el-bg-color, #fff);
  display: flex;
  flex-direction: column;
  gap: 14px;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.chm-card.is-active {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);
}
.chm-card:focus {
  border-color: var(--el-color-primary, #409eff);
}
.chm-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.chm-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.chm-card__chip {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 14%, transparent);
  color: var(--el-color-success, #67c23a);
}
.chm-card__chip.is-muted {
  background: color-mix(in srgb, var(--el-text-color-secondary, #909399) 14%, transparent);
  color: var(--el-text-color-secondary, #909399);
}
.chm-card__switch {
  margin: 0;
}
.chm-card__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chm-card__sect-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular, #606266);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.chm-card__sect-count {
  font-style: normal;
  font-weight: 500;
  color: var(--el-text-color-secondary, #909399);
}
.chm-card__pull {
  margin-left: auto;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
}
.chm-card__pull:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.chm-card__pull:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.chm-card__empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
  padding: 8px;
  border: 1px dashed var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
  text-align: center;
}
.chm-card__accounts,
.chm-card__models {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chm-acc {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
  font-size: 13px;
}
.chm-acc.is-stale {
  border-color: color-mix(in srgb, var(--el-color-warning, #e6a23c) 50%, transparent);
}
.chm-acc__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary, #303133);
  font-weight: 500;
}
.chm-acc__state {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-text-color-secondary, #909399) 14%, transparent);
  color: var(--el-text-color-secondary, #909399);
}
.chm-acc__state.is-valid {
  background: color-mix(in srgb, var(--el-color-success, #67c23a) 14%, transparent);
  color: var(--el-color-success, #67c23a);
}
.chm-acc__state.is-stale {
  background: color-mix(in srgb, var(--el-color-warning, #e6a23c) 14%, transparent);
  color: var(--el-color-warning, #e6a23c);
}
.chm-acc__actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
.chm-acc__btn {
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}
.chm-acc__btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}
.chm-acc__btn.is-danger:hover {
  border-color: var(--el-color-danger-light-5, #fab6b6);
  color: var(--el-color-danger, #f56c6c);
}
.chm-acc__btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.chm-card__bind {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chm-card__bindrow {
  display: flex;
  gap: 6px;
}

/* ---------- 绑定弹窗 ---------- */
.chm-bind {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.chm-bind__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
}
.chm-bind__status.is-error {
  color: var(--el-color-danger, #f56c6c);
}
.chm-bind__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary, #409eff);
  animation: chm-pulse 1.2s ease-in-out infinite;
  flex: none;
}
.chm-bind__dot.is-error {
  background: var(--el-color-danger, #f56c6c);
  animation: none;
}
@keyframes chm-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
.chm-bind__elapsed {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary, #909399);
}
.chm-bind__qr {
  display: flex;
  justify-content: center;
}
.chm-bind__qr img {
  width: 220px;
  height: 220px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
}
.chm-bind__code {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 8px 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 6px;
}
.chm-bind__code-label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.chm-bind__code-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  letter-spacing: 1px;
  user-select: all;
}
.chm-bind__link {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.chm-bind__link a {
  color: var(--el-color-primary, #409eff);
}
.chm-bind__input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chm-bind__row {
  display: flex;
  gap: 8px;
}
.chm-bind__hint {
  font-size: 12px;
  color: var(--el-color-warning, #e6a23c);
}

.chm-input {
  padding: 5px 8px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  background: var(--el-fill-color-blank, #fff);
  width: 100%;
}
.chm-input:focus {
  outline: none;
  border-color: var(--el-color-primary, #409eff);
}
.chm-model {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.chm-model.is-off {
  opacity: .65;
}
.chm-model input[type='checkbox'] {
  accent-color: var(--el-color-primary, #409eff);
}
.chm-model__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary, #303133);
}
.chm-model__ctx {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
  font-variant-numeric: tabular-nums;
}
.chm-empty__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
</style>
