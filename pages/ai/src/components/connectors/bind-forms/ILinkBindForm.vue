<template>
  <div class="ilink-bind-form flex flex-col items-center px-2 pb-1">
    <p class="text-sm text-gray-600 dark:text-gray-200 text-center min-h-[20px] leading-5">{{ statusText }}</p>

    <div class="qr-card mt-3 p-4 bg-white rounded-2xl border border-gray-100">
      <img v-if="qrDataUrl" :src="qrDataUrl" alt="微信二维码" class="w-52 h-52 rounded-lg block" />
      <div v-else class="w-52 h-52 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300">
        <el-icon class="is-loading" size="34">
          <LoadingOutlined />
        </el-icon>
      </div>
    </div>

    <div class="mt-4 h-5 text-xs text-center">
      <span v-if="confirmed" class="text-green-600">绑定成功，正在刷新…</span>
      <span v-else-if="qrcodeCountdown > 0" class="text-gray-400 dark:text-gray-400">
        二维码将在 {{ qrcodeCountdown }} 秒后自动刷新
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LoadingOutlined } from '@vicons/antd'
import QRCode from 'qrcode'
import { api } from '@/framework/context'

const props = defineProps<{ modelValue?: Record<string, any> }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: Record<string, any>): void
  (e: 'confirmed', data: { botId?: string }): void
}>()

const qrcodeUrl = ref('')
const qrDataUrl = ref('')
const qrcodeKey = ref('')
const qrcodeCountdown = ref(0)
const sessionStatus = ref('pending')
const confirmed = ref(false)

let pollTimer: any = null
let countdownTimer: any = null
let retryTimer: any = null
let stopped = false

const statusText = computed(() => {
  switch (sessionStatus.value) {
    case 'scanned':
      return '已扫码，请在微信中点击确认'
    case 'confirmed':
      return '绑定成功'
    case 'expired':
      return '二维码已过期，正在自动刷新…'
    case 'error':
      return '二维码获取失败，正在重试…'
    default:
      return '请使用微信扫描下方二维码完成绑定'
  }
})

const clearTimers = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

// 二维码页面 URL 是 HTML（X-Frame-Options: SAMEORIGIN，无法直接 img/iframe），
// 其二维码内容即该完整 URL，这里用 qrcode 库本地渲染成 PNG dataURL
const renderQr = async (text: string) => {
  if (!text) return
  try {
    qrDataUrl.value = await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } catch (error) {
    qrDataUrl.value = ''
  }
}

const startCountdown = (expireAt?: number | null) => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  const base = expireAt ? Number(expireAt) : Date.now() + 180_000
  const tick = () => {
    const remain = Math.max(0, Math.round((base - Date.now()) / 1000))
    qrcodeCountdown.value = remain
    if (remain <= 0) {
      begin()
    }
  }
  tick()
  countdownTimer = setInterval(tick, 1000)
}

const begin = async () => {
  if (stopped || confirmed.value) return
  clearTimers()
  sessionStatus.value = 'pending'
  try {
    const data = await api.post('/connectors/ilink/qrcode', {})
    if (stopped) return
    qrcodeKey.value = data?.key || ''
    if (data?.qrcodeUrl) {
      qrcodeUrl.value = data.qrcodeUrl
      renderQr(data.qrcodeUrl)
    }
    startCountdown(data?.expireAt)
    pollTimer = setInterval(poll, 2000)
    poll()
  } catch (error: any) {
    if (stopped) return
    sessionStatus.value = 'error'
    retryTimer = setTimeout(begin, 3000)
  }
}

const poll = async () => {
  if (!qrcodeKey.value || stopped || confirmed.value) return
  try {
    const s = await api.get('/connectors/ilink/qrcode/status', {
      params: { key: qrcodeKey.value },
    })
    if (stopped) return
    sessionStatus.value = s?.status || 'pending'
    if (s?.qrcodeUrl && s.qrcodeUrl !== qrcodeUrl.value) {
      qrcodeUrl.value = s.qrcodeUrl
      renderQr(s.qrcodeUrl)
      startCountdown(s?.expireAt)
    }
    if (s?.status === 'confirmed') {
      confirmed.value = true
      emit('update:modelValue', { ...(props.modelValue || {}), confirmed: true, botId: s.botId })
      emit('confirmed', { botId: s.botId })
      clearTimers()
    } else if (s?.status === 'expired') {
      begin()
    }
  } catch (error) {
    // 瞬时错误忽略，下一轮继续
  }
}

onMounted(begin)
onUnmounted(() => {
  stopped = true
  clearTimers()
})
</script>

<style scoped>
.qr-card {
  /* 二维码卡片是页面内区块，不加装饰投影（去掉原 0 2px 10px rgba(0,0,0,.06)） */
}
</style>
