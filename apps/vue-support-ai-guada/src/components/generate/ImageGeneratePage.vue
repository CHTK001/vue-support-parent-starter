<template>
  <div class="ig-root">
    <PageHeader :title="headerTitle" :hide-window-controls="layoutStore.workspaceVisible">
      <template #actions>
        <el-radio-group v-model="mediaType" size="small" class="ig-type-switch">
          <el-radio-button value="image">图像</el-radio-button>
          <el-radio-button value="video">视频</el-radio-button>
        </el-radio-group>
        <el-button v-if="tasks.length" size="small" text @click="loadHistory">
          <el-icon><ArrowClockwise20Regular /></el-icon>
          刷新
        </el-button>
      </template>
    </PageHeader>

    <div class="ig-body">
      <!-- 空态引导 -->
      <div v-if="!tasks.length" class="ig-empty">
        <el-icon :size="42" class="ig-empty-icon"><Image20Regular /></el-icon>
        <p class="ig-empty-title">还没有生成记录</p>
        <p class="ig-empty-desc">在下方输入提示词，生成第一张{{ mediaType === 'image' ? '图片' : '视频' }}</p>
      </div>

      <!-- 结果网格 -->
      <div v-else class="ig-grid-wrap">
        <div class="ig-grid">
          <article v-for="task in tasks" :key="task.taskId" class="ig-card" :class="{ 'is-failed': task.status === 'FAILED' }">
            <!-- 媒体区 -->
            <div class="ig-media">
              <template v-if="task.status === 'SUCCESS' && task.urls.length">
                <video v-if="task.type === 'video'" :src="task.urls[0]" controls class="ig-media-el" />
                <img v-else :src="task.urls[0]" :alt="task.prompt" class="ig-media-el" loading="lazy" />
              </template>

              <!-- 进行中 -->
              <div v-else-if="isRunning(task)" class="ig-media-mask">
                <el-icon :size="26" class="ig-spin"><ArrowClockwise20Regular /></el-icon>
                <span class="ig-progress-text">{{ task.progress ?? 0 }}%</span>
                <el-progress
                  :percentage="task.progress ?? 0"
                  :stroke-width="3"
                  :show-text="false"
                  class="ig-progress"
                />
              </div>

              <!-- 失败 / 已取消 -->
              <div v-else class="ig-media-mask is-error">
                <el-icon :size="24"><ErrorCircle24Regular /></el-icon>
                <span class="ig-error-text">{{ task.errorMessage || (task.status === 'CANCELED' ? '已取消' : '生成失败') }}</span>
              </div>
            </div>

            <!-- 信息区 -->
            <div class="ig-meta">
              <p class="ig-prompt" :title="task.prompt">{{ task.prompt }}</p>
              <div class="ig-tags">
                <span class="ig-tag">{{ modelLabel(task.model) }}</span>
                <span v-if="task.size" class="ig-tag">{{ task.size }}</span>
                <span v-if="task.type === 'video' && task.duration" class="ig-tag">{{ task.duration }}s</span>
              </div>
              <p class="ig-time">{{ formatTime(task.createdAt) }}</p>
            </div>

            <!-- 操作行 -->
            <div class="ig-actions">
              <el-tooltip content="用相同参数再生成一次" placement="top">
                <button class="ig-action" :disabled="!currentConfig" @click="remake(task)">
                  <el-icon :size="14"><ArrowSync20Regular /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="下载原图" placement="top">
                <a
                  v-if="task.status === 'SUCCESS' && task.urls.length"
                  class="ig-action"
                  :href="task.urls[0]"
                  :download="downloadName(task)"
                  target="_blank"
                  rel="noopener"
                >
                  <el-icon :size="14"><ArrowDownload24Regular /></el-icon>
                </a>
              </el-tooltip>
              <el-tooltip content="取消生成" placement="top">
                <button v-if="isRunning(task)" class="ig-action" @click="cancel(task)">
                  <el-icon :size="14"><Dismiss24Regular /></el-icon>
                </button>
              </el-tooltip>
            </div>
          </article>
        </div>
      </div>

      <!-- 会话输入框 -->
      <div class="ig-composer">
        <div class="ig-composer-inner">
          <!-- 参考图 -->
          <div v-if="referenceImage" class="ig-ref">
            <img :src="referenceImage" alt="参考图" class="ig-ref-img" />
            <button class="ig-ref-remove" @click="referenceImage = ''">
              <el-icon :size="12"><Dismiss16Filled /></el-icon>
            </button>
          </div>

          <el-input
            v-model="prompt"
            type="textarea"
            :rows="2"
            resize="none"
            :placeholder="placeholder"
            class="ig-prompt-input"
            @keydown.enter.exact.prevent="submit"
          />

          <!-- 参数条 -->
          <div class="ig-params">
            <el-select v-model="model" size="small" class="ig-param" placeholder="选择模型" :loading="loadingModels">
              <el-option v-for="m in models" :key="m.model" :label="modelLabel(m.model)" :value="m.model">
                <span class="ig-opt-name">{{ modelLabel(m.model) }}</span>
                <span class="ig-opt-provider">{{ m.providerName }}</span>
              </el-option>
            </el-select>

            <el-select
              v-if="currentConfig && currentConfig.sizes.length"
              v-model="size"
              size="small"
              class="ig-param"
              placeholder="分辨率"
            >
              <el-option v-for="s in currentConfig.sizes" :key="s" :label="s" :value="s" />
            </el-select>

            <el-input-number
              v-if="currentConfig && currentConfig.maxCount > 1"
              v-model="count"
              :min="1"
              :max="currentConfig.maxCount"
              size="small"
              class="ig-param-num"
              controls-position="right"
            />

            <el-select
              v-if="mediaType === 'video' && currentConfig && currentConfig.durations.length"
              v-model="duration"
              size="small"
              class="ig-param"
              placeholder="时长"
            >
              <el-option v-for="d in currentConfig.durations" :key="d" :label="`${d} 秒`" :value="d" />
            </el-select>

            <el-popover v-if="currentConfig && currentConfig.negativePrompt" placement="top" :width="280" trigger="click">
              <template #reference>
                <el-button size="small" :type="negativePrompt ? 'primary' : 'default'" plain>负面词</el-button>
              </template>
              <el-input v-model="negativePrompt" type="textarea" :rows="3" resize="none" placeholder="不希望出现的元素，逗号分隔" />
            </el-popover>

            <el-tooltip v-if="currentConfig && currentConfig.referenceImage" :content="referenceImage ? '已添加参考图，点击移除' : '添加参考图'" placement="top">
              <button class="ig-param-btn" :class="{ 'is-on': !!referenceImage }" @click="pickReference">
                <el-icon :size="14"><ImageMultiple20Regular /></el-icon>
                参考图
              </button>
            </el-tooltip>

            <span class="ig-spacer" />

            <el-button
              type="primary"
              size="small"
              :loading="submitting"
              :disabled="!canSubmit"
              class="ig-submit"
              @click="submit"
            >
              <el-icon><Send20Regular /></el-icon>
              生成
            </el-button>
          </div>
        </div>
        <p class="ig-hint">{{ hintText }}</p>
      </div>
    </div>

    <!-- 参考图选择 -->
    <input ref="refInput" type="file" accept="image/*" class="ig-hidden-file" @change="onReferencePicked" />
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  Image20Regular, ImageMultiple20Regular, ArrowClockwise20Regular, ArrowSync20Regular,
  ArrowDownload24Regular, Dismiss24Regular, Dismiss16Filled, ErrorCircle24Regular, Send20Regular,
} from '@vicons/fluent'
import PageHeader from '../PageHeader.vue'
import { useLayoutStore } from '@/stores/layout'
import { apiService } from '@/services/ApiService'
import type { GenerateModel, GenerateTask } from '@/services/modules/generate.api'

const { t } = useI18n()
const layoutStore = useLayoutStore()

/** 媒体类型：图像 / 视频 */
const mediaType = ref<'image' | 'video'>('image')
/** 可选模型（后端已过滤掉供应商无对应实现的） */
const models = ref<GenerateModel[]>([])
const loadingModels = ref(false)
/** 任务列表：新任务插在前面 */
const tasks = ref<GenerateTask[]>([])
/** 会话框状态 */
const prompt = ref('')
const negativePrompt = ref('')
const model = ref('')
const size = ref('')
const count = ref(1)
const duration = ref<number | undefined>(undefined)
const referenceImage = ref('')
const submitting = ref(false)
const refInput = ref<HTMLInputElement | null>(null)

/** 轮询定时器：同一时刻只存在一个 */
let pollTimer: number | undefined
/** 参考图最大边长（超过则等比缩放，控制请求体大小） */
const REF_MAX_EDGE = 1024

const headerTitle = computed(() => (mediaType.value === 'image' ? '图像生成' : '视频生成'))

const currentModel = computed(() => models.value.find((m) => m.model === model.value) ?? null)
const currentConfig = computed(() => currentModel.value?.config ?? null)

const placeholder = computed(() =>
  mediaType.value === 'image' ? '描述你想要的画面…' : '描述你想要的视频内容…'
)

const canSubmit = computed(() => !!prompt.value.trim() && !!model.value && !submitting.value)

const hintText = computed(() => {
  if (!models.value.length) {
    return mediaType.value === 'image'
      ? '当前没有可用的图像模型：请在「模型管理」里把模型的类型设为「文生图」，并确认其供应商已配置密钥'
      : '当前没有可用的视频模型：VideoClient 目前仅 zhipu 落地了实现'
  }
  if (!currentConfig.value?.referenceImage && referenceImage.value) {
    return '当前模型不支持参考图，已忽略'
  }
  return 'Enter 发送 · Shift+Enter 换行'
})

/** 模型展示名：优先别名 */
const modelLabel = (name: string) => {
  const hit = models.value.find((m) => m.model === name)
  return hit?.alias || name
}

const isRunning = (task: GenerateTask) => task.status === 'PENDING' || task.status === 'RUNNING'

/** 毫秒时间戳 → MM-DD HH:mm */
const formatTime = (ms: number | null) => {
  if (!ms) return ''
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const downloadName = (task: GenerateTask) => {
  const ext = task.type === 'video' ? 'mp4' : 'png'
  return `generate-${task.taskId}.${ext}`
}

/** 拉取可选模型 */
const loadModels = async () => {
  loadingModels.value = true
  try {
    models.value = await apiService.fetchGenerateModels(mediaType.value)
    // 保持已有选择；失效则回落到第一个可用模型
    if (!models.value.some((m) => m.model === model.value)) {
      model.value = models.value[0]?.model ?? ''
    }
    syncDefaults()
  } catch (e: any) {
    console.error('加载生成模型失败:', e)
    models.value = []
    model.value = ''
  } finally {
    loadingModels.value = false
  }
}

/** 切模型后把参数收敛到该模型允许的范围 */
const syncDefaults = () => {
  const cfg = currentConfig.value
  if (!cfg) return
  if (cfg.sizes.length && !cfg.sizes.includes(size.value)) {
    size.value = cfg.sizes[0]
  }
  if (!cfg.sizes.length) {
    size.value = ''
  }
  count.value = Math.min(Math.max(1, count.value), Math.max(1, cfg.maxCount))
  if (cfg.durations.length && !cfg.durations.includes(duration.value as number)) {
    duration.value = cfg.durations[0]
  }
  if (!cfg.negativePrompt) {
    negativePrompt.value = ''
  }
  if (!cfg.referenceImage) {
    referenceImage.value = ''
  }
}

/** 拉取历史 */
const loadHistory = async () => {
  try {
    tasks.value = await apiService.fetchGenerateHistory(mediaType.value, 30)
    if (tasks.value.some(isRunning)) startPolling()
  } catch (e: any) {
    console.error('加载生成历史失败:', e)
  }
}

/** 提交生成 */
const submit = async () => {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const task = await apiService.createGenerateTask({
      type: mediaType.value,
      model: model.value,
      prompt: prompt.value.trim(),
      negativePrompt: negativePrompt.value.trim() || undefined,
      size: size.value || undefined,
      count: count.value > 1 ? count.value : undefined,
      duration: duration.value,
      referenceImage: referenceImage.value || undefined,
    })
    // 新任务置顶；同一 taskId 轮询回来时原地替换
    tasks.value = [task, ...tasks.value.filter((t) => t.taskId !== task.taskId)]
    prompt.value = ''
    startPolling()
  } catch (e: any) {
    ElMessage.error(e?.message || '创建生成任务失败')
  } finally {
    submitting.value = false
  }
}

/** 取消生成 */
const cancel = async (task: GenerateTask) => {
  try {
    await apiService.cancelGenerateTask(task.taskId)
    task.status = 'CANCELED'
  } catch (e: any) {
    ElMessage.error(e?.message || '取消失败')
  }
}

/** 用相同参数再生成一次 */
const remake = (task: GenerateTask) => {
  prompt.value = task.prompt
  negativePrompt.value = task.negativePrompt || ''
  model.value = task.model
  if (task.size) size.value = task.size
  if (task.duration) duration.value = task.duration
  nextTickScroll()
}

const nextTickScroll = () => {
  window.requestAnimationFrame(() => {
    const el = document.querySelector<HTMLTextAreaElement>('.ig-prompt-input textarea')
    el?.focus()
  })
}

/** 轮询进行中的任务 */
const startPolling = () => {
  stopPolling()
  pollTimer = window.setInterval(async () => {
    const running = tasks.value.filter(isRunning)
    if (!running.length) {
      stopPolling()
      return
    }
    await Promise.all(
      running.map(async (t) => {
        try {
          const fresh = await apiService.fetchGenerateTask(t.taskId)
          if (fresh) Object.assign(t, fresh)
        } catch {
          // 单个任务查询失败不打断整轮
        }
      }),
    )
  }, 2000)
}

const stopPolling = () => {
  if (pollTimer !== undefined) {
    window.clearInterval(pollTimer)
    pollTimer = undefined
  }
}

/** 打开系统文件选择 */
const pickReference = () => {
  if (referenceImage.value) {
    referenceImage.value = ''
    return
  }
  refInput.value?.click()
}

/** 读取参考图并等比缩放到 REF_MAX_EDGE */
const onReferencePicked = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, REF_MAX_EDGE / Math.max(img.width, img.height))
      if (scale >= 1) {
        referenceImage.value = String(reader.result)
      } else {
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          referenceImage.value = String(reader.result)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        referenceImage.value = canvas.toDataURL('image/jpeg', 0.9)
      }
    }
    img.onerror = () => {
      referenceImage.value = String(reader.result)
    }
    img.src = String(reader.result)
  }
  reader.readAsDataURL(file)
  input.value = ''
}

watch(mediaType, async () => {
  stopPolling()
  tasks.value = []
  referenceImage.value = ''
  await loadModels()
  await loadHistory()
})

watch(model, syncDefaults)

onUnmounted(stopPolling)

void loadModels().then(loadHistory)
</script>

<style scoped>
.ig-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--color-bg);
}

/* 主体：结果区可滚动，输入框固定底部 */
.ig-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.ig-grid-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px 8px;
  scrollbar-gutter: stable;
}

.ig-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

/* ===== 结果卡片 ===== */
.ig-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--size-surface-radius);
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  overflow: hidden;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.ig-card:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-surface-border));
  box-shadow: var(--shadow-card);
}

.ig-media {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--color-sidebar-bg);
  overflow: hidden;
}
.ig-media-el {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ig-media-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-gray);
}
.ig-media-mask.is-error {
  color: var(--el-color-danger);
  padding: 12px;
  text-align: center;
}
.ig-spin {
  animation: ig-rot 1.1s linear infinite;
}
@keyframes ig-rot {
  to {
    transform: rotate(360deg);
  }
}
.ig-progress-text {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.ig-progress {
  width: 62%;
}
.ig-error-text {
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.ig-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px 8px;
}
.ig-prompt {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ig-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.ig-tag {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--color-text-gray);
  background: var(--color-sidebar-bg-hover);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ig-time {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-disabled);
}

.ig-actions {
  display: flex;
  gap: 2px;
  padding: 0 8px 8px;
}
.ig-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: calc(var(--size-surface-radius) - 6px);
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease, background 0.15s ease;
}
.ig-action:hover:not(:disabled) {
  color: var(--color-primary);
  background: var(--color-sidebar-bg-hover);
}
.ig-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== 空态 ===== */
.ig-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding-bottom: 12vh;
}
.ig-empty-icon {
  color: var(--color-text-disabled);
}
.ig-empty-title {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-gray);
}
.ig-empty-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-disabled);
}

/* ===== 会话输入框 ===== */
.ig-composer {
  flex-shrink: 0;
  padding: 10px 20px 14px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-surface-border);
}
.ig-composer-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 10px 12px;
  border-radius: var(--size-surface-radius);
  background: var(--color-bg);
  border: 1px solid var(--color-surface-border);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.ig-composer-inner:focus-within {
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-surface-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.ig-ref {
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
}
.ig-ref-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: calc(var(--size-surface-radius) - 8px);
  border: 1px solid var(--color-surface-border);
  display: block;
}
.ig-ref-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--color-text);
  color: var(--color-surface);
  cursor: pointer;
}

.ig-prompt-input {
  --el-input-bg-color: transparent;
}
.ig-prompt-input :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  resize: none;
}

.ig-params {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.ig-param {
  width: 168px;
}
.ig-param-num {
  width: 96px;
}
.ig-param-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid var(--color-surface-border);
  border-radius: calc(var(--size-surface-radius) - 8px);
  background: var(--color-surface);
  color: var(--color-text-gray);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.ig-param-btn:hover {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-surface-border));
}
.ig-param-btn.is-on {
  color: var(--color-primary);
  background: var(--color-primary-50);
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}
.ig-spacer {
  flex: 1;
  min-width: 0;
}
.ig-submit {
  gap: 4px;
}

.ig-opt-name {
  margin-right: 8px;
}
.ig-opt-provider {
  color: var(--color-text-disabled);
  font-size: 12px;
}

.ig-hint {
  max-width: 1080px;
  margin: 6px auto 0;
  font-size: 11px;
  color: var(--color-text-disabled);
}

.ig-hidden-file {
  display: none;
}
</style>
