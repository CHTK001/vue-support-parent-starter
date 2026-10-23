<template>
  <div class="asr-page" data-page="asr">
    <ReCard title="音频识别" subtitle="上传或录制音频，用已配置的 ASR 模型转写为文字">
      <template #extra>
        <span v-if="modelReady" class="asr-model-badge">
          {{ modelConfig.asrProvider || 'whisper' }} · {{ modelConfig.asrModel || '未配置' }}
        </span>
        <span v-else class="asr-model-badge is-off">未配置 ASR 模型</span>
      </template>

      <!-- 未配置模型：与人脸识别 / 以图搜图同口径，优先提示去配置 -->
      <div v-if="!modelReady" class="asr-hint">
        <el-icon :size="28"><WarningFilled /></el-icon>
        <div>
          <p class="asr-hint-title">音频识别未启用</p>
          <p class="asr-hint-desc">
            请到「系统设置 → 音频配置」中选择 ASR 默认模型，保存后立即生效。
          </p>
          <ReButton type="primary" @click="goConfig">去配置模型</ReButton>
        </div>
      </div>

      <template v-else>
        <!-- ==================== 上：音频舞台 ==================== -->
        <section class="asr-stage">
          <div v-if="!audioLoaded" class="asr-drop" @click="pickFile">
            <div class="asr-drop-icon">
              <el-icon :size="42"><AudioFileOutlined /></el-icon>
            </div>
            <p class="asr-drop-title">点击或拖拽上传音频</p>
            <p class="asr-drop-desc">支持 WAV / MP3 / M4A / FLAC，建议单人说话、环境安静</p>
            <div class="asr-drop-actions" @click.stop>
              <ReButton type="primary" @click="pickFile">
                <el-icon><FolderOpened /></el-icon>选择音频
              </ReButton>
              <ReButton :type="recording ? 'danger' : 'default'" @click="toggleRecord">
                <el-icon><component :is="recording ? VideoOff : Microphone" /></el-icon>
                {{ recording ? '停止录制' : '开始录制' }}
              </ReButton>
            </div>
          </div>

          <div v-else class="asr-workspace">
            <div class="asr-player">
              <div class="asr-player-head">
                <span class="asr-player-title">{{ recording ? '录音中' : '已载入音频' }}</span>
                <span v-if="audioDuration" class="asr-player-duration">
                  {{ formatDuration(audioDuration) }}
                </span>
              </div>
              <!-- 原生播放器：录音用 Blob URL，上传用同方式，统一一处渲染 -->
              <audio ref="audioEl" :src="audioUrl" controls class="asr-audio" @loadedmetadata="onMeta" />
              <div class="asr-player-actions">
                <ReButton size="small" type="default" plain :disabled="recording" @click="pickFile">
                  更换音频
                </ReButton>
                <ReButton size="small" type="default" plain :disabled="recording" @click="resetAudio">
                  清空
                </ReButton>
              </div>
            </div>

            <div class="asr-run">
              <ReButton
                type="primary"
                size="large"
                :loading="transcribing"
                :disabled="recording || !audioLoaded"
                @click="runTranscribe"
              >
                <el-icon v-if="!transcribing"><Search /></el-icon>
                {{ transcribing ? '识别中…' : (result ? '重新识别' : '开始识别') }}
              </ReButton>
            </div>
          </div>
        </section>

        <!-- ==================== 下：识别结果 ==================== -->
        <section class="asr-result">
          <header class="asr-result-head">
            <h3 class="asr-result-title">识别结果</h3>
            <span v-if="result" class="asr-result-meta">
              {{ result.provider || 'whisper' }} · {{ result.model || modelConfig.asrModel }}
              <template v-if="result.language"> · {{ result.language }}</template>
            </span>
          </header>

          <ReEmpty v-if="error" :text="error" />
          <ReEmpty v-else-if="!result" text="载入音频后点击「开始识别」，转写结果会显示在这里" />

          <div v-else class="asr-result-body">
            <p class="asr-text">{{ result.text }}</p>
            <div class="asr-result-actions">
              <ReButton type="success" size="small" @click="copyText">
                <el-icon><Copy /></el-icon>复制文本
              </ReButton>
              <ReButton type="default" size="small" plain @click="downloadText">
                <el-icon><Download /></el-icon>下载 TXT
              </ReButton>
            </div>
          </div>
        </section>
      </template>
    </ReCard>

    <!--
      隐藏的文件选择器：必须常驻 DOM。
      原先同类页面把它放在「未上传」分支里，上传后该分支被 v-else 移出文档，
      ref 变 null，「更换音频」点下去没有任何反应。
    -->
    <input ref="fileInput" type="file" accept="audio/*" hidden @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
// @vicons/material 的导出名带 Outlined/Filled 后缀，且没有 VideoOff/Microphone/
// FolderOpened/Search/Copy/Download 这些短名（那几个是 element-plus 图标的叫法）。
// 这里按真实导出名导入并就地取别名，调用处不必跟着改。
import {
  AudioFileOutlined,
  VideocamOffOutlined as VideoOff,
  MicOutlined as Microphone,
  FolderOpenOutlined as FolderOpened,
  SearchOutlined as Search,
  ContentCopyOutlined as Copy,
  DownloadOutlined as Download,
} from '@vicons/material'
import { WarningFilled } from '@element-plus/icons-vue'
import ReCard from '@/components/re/ReCard.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'
import { apiService } from '@/services/ApiService'
import { useModelConfigStore } from '@/stores/modelConfig'
import { message } from '@repo/core'

/**
 * 音频识别：调用后端真实 ASR（{@code VirtualClient} SPI）转写音频。
 *
 * <p>模型来自 {@code asr} 分组的 {@code default_model}（系统设置 → 音频配置）；
 * provider 缺省走后端默认的 whisper 本地推理，密钥/地址仅云端 ASR 才需要，
 * 因此门禁只要求模型一项 —— 与 {@link useModelConfigStore} 的 ASR_REQUIRED 一致。</p>
 *
 * <p>不接 {@code /v1/audio/transcriptions}：那是 OpenAI 兼容壳，内部把
 * "Transcribe audio: <文件名>" 拼成 prompt 问聊天模型，不调用任何 ASR 引擎。</p>
 */
const router = useRouter()
const modelConfig = useModelConfigStore()
const modelReady = computed(() => modelConfig.asrReady)

const fileInput = ref<HTMLInputElement | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)
const audioUrl = ref('')
const audioLoaded = ref(false)
const audioDuration = ref(0)
const transcribing = ref(false)
const error = ref('')
const result = ref<{ text: string; language?: string; provider?: string; model?: string } | null>(null)

/** 录制状态与 MediaRecorder 句柄 */
const recording = ref(false)
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let objectUrl = ''

onMounted(async () => {
  // 强制拉一次合并视图：ASR 模型可能在「音频配置」页刚改过，
  // 用缓存的 store 会拿旧值把页面误判成「未配置」。
  try {
    await modelConfig.refresh()
  } catch {
    // 读取失败按未配置处理：页面会给出「去配置模型」的提示，不阻断渲染
  }
})

onBeforeUnmount(() => {
  stopRecordStream()
  revokeUrl()
})

function revokeUrl() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

function goConfig() {
  router.push('/setting/audio-config')
}

function formatDuration(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function onMeta() {
  audioDuration.value = audioEl.value?.duration ?? 0
}

/**
 * 判断所选文件是否为音频。
 *
 * <p>不能只看 {@code file.type}：部分来源（无扩展名、系统未登记 MIME）
 * 会给空 type，此时按扩展名兜底，避免「选了音频却提示不支持」。
 */
function isAudioFile(file: File) {
  if (file.type) {
    return file.type.startsWith('audio/')
  }
  return /\.(wav|mp3|m4a|flac|ogg|aac|opus|webm)$/i.test(file.name || '')
}

function loadAudio(blob: Blob, filename: string) {
  revokeUrl()
  objectUrl = URL.createObjectURL(blob)
  audioUrl.value = objectUrl
  audioLoaded.value = true
  error.value = ''
  result.value = null
  audioDuration.value = 0
  // 记住文件名供上传使用（FormData 需要）
  currentFilename.value = filename
}

/** 当前音频文件名（录音时为生成名） */
const currentFilename = ref('audio.wav')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!isAudioFile(file)) {
    message.warning('请选择音频文件')
    return
  }
  loadAudio(file, file.name)
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file && isAudioFile(file)) {
    loadAudio(file, file.name)
  }
}

function pickFile() {
  fileInput.value?.click()
}

function resetAudio() {
  revokeUrl()
  audioUrl.value = ''
  audioLoaded.value = false
  audioDuration.value = 0
  result.value = null
  error.value = ''
}

/** 浏览器录音流（停止时需要停掉，否则麦克风指示灯常亮） */
let mediaStream: MediaStream | null = null

async function toggleRecord() {
  if (recording.value) {
    mediaRecorder?.stop()
    return
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    message.warning('当前浏览器不支持录音')
    return
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordedChunks = []
    mediaRecorder = new MediaRecorder(mediaStream)
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data)
    }
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      if (blob.size > 0) {
        loadAudio(blob, `record-${Date.now()}.webm`)
      }
      stopRecordStream()
      recording.value = false
    }
    mediaRecorder.start()
    recording.value = true
    message.info('开始录音，说完请点「停止录制」')
  } catch (e: any) {
    message.error('无法访问麦克风：' + (e?.message || '未知错误'))
    stopRecordStream()
  }
}

function stopRecordStream() {
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
}

async function runTranscribe() {
  if (!audioLoaded.value || transcribing.value) return
  transcribing.value = true
  error.value = ''
  try {
    const blob = await fetch(audioUrl.value).then((r) => r.blob())
    const res = await apiService.transcribe(blob, {
      filename: currentFilename.value,
      language: modelConfig.asrLanguage || undefined,
    })
    if (!res || !res.text) {
      error.value = '识别失败：后端未返回文本。请检查 ASR 模型是否可用（系统设置 → 音频配置）。'
      return
    }
    result.value = res
  } catch (e: any) {
    error.value = '识别失败：' + (e?.message || '未知错误')
  } finally {
    transcribing.value = false
  }
}

async function copyText() {
  if (!result.value?.text) return
  try {
    await navigator.clipboard.writeText(result.value.text)
    message.success('已复制到剪贴板')
  } catch {
    message.warning('复制失败，请手动选择文本')
  }
}

function downloadText() {
  if (!result.value?.text) return
  const blob = new Blob([result.value.text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `asr-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('已开始下载')
}
</script>

<style scoped>
.asr-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}
.asr-model-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
}
.asr-model-badge.is-off {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
}
.asr-hint {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
}
.asr-hint-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}
.asr-hint-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}
.asr-stage {
  margin-bottom: 8px;
}
.asr-drop {
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s;
}
.asr-drop:hover {
  border-color: var(--el-color-primary);
}
.asr-drop-icon {
  color: var(--el-text-color-placeholder);
  margin-bottom: 10px;
}
.asr-drop-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}
.asr-drop-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
}
.asr-drop-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.asr-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.asr-player {
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  padding: 14px 16px;
}
.asr-player-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.asr-player-title {
  font-size: 14px;
  font-weight: 600;
}
.asr-player-duration {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.asr-audio {
  width: 100%;
  height: 36px;
}
.asr-player-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.asr-run {
  display: flex;
  justify-content: center;
}
.asr-result {
  border-top: 1px solid var(--el-border-color);
  padding-top: 16px;
}
.asr-result-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}
.asr-result-title {
  font-size: 14px;
  font-weight: 600;
}
.asr-result-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.asr-text {
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.asr-result-actions {
  display: flex;
  gap: 8px;
}
</style>
