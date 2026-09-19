<template>
  <div class="ilink-bind-form">
    <p class="text-sm text-gray-600 dark:text-[#c5c7cc] mb-4 text-center">请使用微信扫描下方二维码完成绑定</p>
    <div class="qrcode-container inline-block p-4 bg-white rounded-lg mx-auto block w-fit">
      <img v-if="qrcodeUrl" :src="qrcodeUrl" alt="微信二维码" class="w-48 h-48" />
      <div v-else class="w-48 h-48 flex items-center justify-center bg-gray-100">
        <el-icon class="is-loading" size="32">
          <LoadingOutlined />
        </el-icon>
      </div>
    </div>
    <div v-if="qrcodeCountdown > 0" class="mt-4 text-sm text-gray-500 text-center">
      二维码将在 <span class="font-medium text-primary">{{ qrcodeCountdown }}</span> 秒后刷新
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { LoadingOutlined } from '@ant-design/icons-vue'
import { apiService } from '@/services/ApiService'

const emit = defineEmits<{
  (e: 'bind', data: Record<string, any>): void
}>()

const qrcodeUrl = ref('')
const qrcodeCountdown = ref(0)
let qrcodeTimer: any = null

const fetchQrcode = async () => {
  try {
    const res = await apiService.post('/v2/connectors/ilink/qrcode')
    qrcodeUrl.value = res.data.qrcodeUrl
    qrcodeCountdown.value = res.data.countdown || 60
  } catch (error) {
    console.error('获取二维码失败:', error)
    qrcodeCountdown.value = 60
  }
}

onMounted(() => {
  fetchQrcode()
  qrcodeTimer = setInterval(() => {
    if (qrcodeCountdown.value > 0) {
      qrcodeCountdown.value--
    } else {
      fetchQrcode()
    }
  }, 1000)
})

onUnmounted(() => {
  if (qrcodeTimer) {
    clearInterval(qrcodeTimer)
  }
})
</script>

<style scoped>
.qrcode-container {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
