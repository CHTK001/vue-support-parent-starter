<template>
  <div class="tts-page" data-page="tts">
    <ReCard title="语音合成" subtitle="输入文本，用已配置的 TTS 模型生成语音">
      <template #extra>
        <span v-if="modelReady" class="tts-model-badge">
          {{ modelConfig.ttsProvider || '默认服务商' }} · {{ modelConfig.ttsModel || '未配置' }}
        </span>
        <span v-else class="tts-model-badge is-off">未配置 TTS 模型</span>
      </template>

      <div v-if="!modelReady" class="tts-hint">
        <el-icon :size="28"><WarningFilled /></el-icon>
        <div>
          <p class="tts-hint-title">语音合成未启用</p>
          <p class="tts-hint-desc">
            请到「系统设置 → 音频配置」中选择 TTS 默认模型，保存后立即生效。
          </p>
          <ReButton type="primary" @click="goConfig">去配置模型</ReButton>
        </div>
      </div>

      <template v-else>
        <div class="tts-editor">
          <el-input
            v-model="text"
            type="textarea"
            :rows="5"
            class="tts-textarea"
            placeholder="输入要合成的文本，支持多行"
          />
          <div class="tts-options">
            <el-select v-model="voice" class="tts-opt" placeholder="默认音色" clearable>
              <el-option
                v-for="(name, index) in speakerNames"
                :key="index"
                :label="`${name}（#${index}）`"
                :value="String(index)"
              />
            </el-select>
            <el-select v-model="format" class="tts-opt">
              <el-option label="WAV" value="wav" />
              <el-option label="MP3" value="mp3" />
              <el-option label="OGG" value="ogg" />
              <el-option label="FLAC" value="flac" />
            </el-select>
            <el-select v-model="language" class="tts-opt" placeholder="默认语言" clearable>
              <el-option label="中文" value="zh" />
              <el-option label="英文" value="en" />
            </el-select>
            <ReButton type="primary" :loading="synthesizing" @click="runSynthesize">
              <el-icon v-if="!synthesizing"><Play /></el-icon>
              {{ synthesizing ? '合成中…' : '合成语音' }}
            </ReButton>
          </div>
        </div>

        <section class="tts-result">
          <header class="tts-result-head">
            <h3 class="tts-result-title">合成结果</h3>
          </header>
          <ReEmpty v-if="error" :text="error" />
          <ReEmpty v-else-if="!audioUrl" text="输入文本后点击「合成语音」，音频会显示在这里" />
          <div v-else class="tts-result-body">
            <audio :src="audioUrl" controls class="tts-audio" />
            <div class="tts-result-actions">
              <ReButton type="success" size="small" @click="download">
                <el-icon><Download /></el-icon>下载音频
              </ReButton>
              <ReButton type="default" size="small" plain @click="reset">清空</ReButton>
            </div>
          </div>
        </section>
      </template>
    </ReCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'
import { PlayArrowOutlined as Play, DownloadOutlined as Download } from '@vicons/material'
import ReCard from '@/components/ui/ReCard.vue'
import ReButton from '@/components/ui/ReButton.vue'
import ReEmpty from '@/components/ui/ReEmpty.vue'
import { apiService } from '@/services/ApiService'
import { useModelConfigStore } from '@/stores/modelConfig'
import { message } from '@repo/core'

/**
 * 语音合成：调用后端 {@code /api/tts} 生成语音。
 *
 * <p>模型来自 {@code tts} 分组的 {@code default_model}（系统设置 → 音频配置）；
 * provider 缺省时后端回落到 {@code ai.tts.provider} 配置文件。</p>
 */
const router = useRouter()
const modelConfig = useModelConfigStore()
const modelReady = computed(() => modelConfig.ttsReady)

const text = ref('')
const voice = ref('')
const format = ref('wav')
const language = ref('')
const synthesizing = ref(false)
const error = ref('')
const audioUrl = ref('')
const speakerNames = ref<string[]>([])

let objectUrl = ''

onMounted(async () => {
  try {
    await modelConfig.refresh()
  } catch {
    // 读取失败按未配置处理：页面给出「去配置模型」提示，不阻断渲染
  }
  try {
    const cfg = await apiService.ttsConfig()
    if (cfg) {
      format.value = cfg.format || 'wav'
      language.value = cfg.language || ''
      voice.value = cfg.voice || ''
    }
  } catch {
    // 配置摘要取不到不影响合成（合成时仍可显式传参）
  }
})

onBeforeUnmount(() => {
  revokeUrl()
})

function revokeUrl() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

function goConfig() {
  router.push('/setting/audio-config')
}

async function runSynthesize() {
  if (!text.value?.trim() || synthesizing.value) return
  synthesizing.value = true
  error.value = ''
  try {
    const blob = await apiService.synthesize(text.value, {
      voice: voice.value || undefined,
      format: format.value,
      language: language.value || undefined,
    })
    if (!blob || blob.size === 0) {
      error.value = '合成失败：后端未返回音频。请检查 TTS 模型是否可用（系统设置 → 音频配置）。'
      return
    }
    revokeUrl()
    objectUrl = URL.createObjectURL(blob)
    audioUrl.value = objectUrl
  } catch (e: any) {
    error.value = '合成失败：' + (e?.message || '未知错误')
  } finally {
    synthesizing.value = false
  }
}

function reset() {
  revokeUrl()
  audioUrl.value = ''
  error.value = ''
}

function download() {
  if (!audioUrl.value) return
  const a = document.createElement('a')
  a.href = audioUrl.value
  a.download = `tts-${Date.now()}.${format.value || 'wav'}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  message.success('已开始下载')
}
</script>

<style scoped>
.tts-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}
.tts-model-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
}
.tts-model-badge.is-off {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
}
.tts-hint {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
}
.tts-hint-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}
.tts-hint-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}
.tts-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tts-textarea {
  width: 100%;
}
.tts-options {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.tts-opt {
  width: 180px;
}
.tts-result {
  border-top: 1px solid var(--el-border-color);
  margin-top: 18px;
  padding-top: 16px;
}
.tts-result-head {
  margin-bottom: 10px;
}
.tts-result-title {
  font-size: 14px;
  font-weight: 600;
}
.tts-audio {
  width: 100%;
  height: 36px;
}
.tts-result-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
