<script setup lang="ts">
// 文生图渠道面板（Pollinations / Trae 等）。
//
// 与对话面板的区别：
// - 产出物是图片，需要「宽高比 + 张数」参数与画廊；
// - 免登录渠道（Pollinations）返回的是「按需出图」URL，图片在浏览器加载时才真正生成，
//   因此每张图都有「渲染中」骨架，直到 img 的 load 事件触发；
// - 需要登录态的渠道（Trae）可在下方临时填 JWT，仅本次请求生效、不落库。

import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { channelApi } from '../channelApi'

const props = defineProps<{
  /** 渠道标识（如 image-pollinations / image-trae） */
  channel: string
  /** 渠道展示名 */
  displayName?: string
  /** 进入优先级 */
  priority?: number
  /** 渠道列表里的模型（`{ model, enabled, alias }`） */
  models: Array<{ model: string; enabled: boolean; alias?: string }>
}>()

/** 出图结果（后端已压平为前端可直接渲染的结构） */
interface GeneratedImage {
  key?: string
  url: string
  thumbUrl?: string
  width?: number
  height?: number
  format?: string
}

/** 宽高比选项（与后端 resolveSize 的映射保持一致） */
const RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4']

/** 快捷提示词：一条写实、一条风格化，便于快速验证渠道 */
const QUICK_PROMPTS = [
  '一只橘猫趴在服务器机柜上打盹，机房冷光，写实摄影，浅景深',
  '赛博朋克风格的运维控制台，霓虹紫与青色，等距视角插画',
]

const prompt = ref('')
const ratio = ref('1:1')
const count = ref(1)
const token = ref('')
const model = ref('')
const busy = ref(false)
const elapsed = ref<number | null>(null)
const images = ref<GeneratedImage[]>([])
/** 已加载完成的图片 URL：用于把「渲染中」骨架撤掉 */
const loaded = reactive<Record<string, boolean>>({})
const errors = reactive<{ text: string }>({ text: '' })
const localModels = ref<Array<{ id: string; name?: string }>>([])
const refreshing = ref(false)

/** 模型清单：优先实时刷新，回退渠道列表 */
const modelOptions = computed(() =>
  localModels.value.length
    ? localModels.value.map((m) => ({ id: m.id, name: m.name }))
    : (props.models ?? []).map((m) => ({ id: m.model, name: m.alias })),
)

/** 该渠道是否需要登录令牌（Trae 需要本机登录态或 JWT，免登录渠道不需要） */
const needsToken = computed(() => props.channel.includes('trae'))

/** 结果框的宽高比跟随当前选择，避免 16:9 的图被裁进 1:1 的方形框 */
const frameStyle = computed(() => ({ aspectRatio: ratio.value.replace(':', ' / ') }))

watch(
  modelOptions,
  (options) => {
    if (!options.length) {
      model.value = ''
      return
    }
    if (!options.some((m) => m.id === model.value)) {
      model.value = options[0].id
    }
  },
  { immediate: true },
)

async function refreshModels() {
  if (refreshing.value) return
  refreshing.value = true
  errors.text = ''
  try {
    const res = await channelApi.imageModels(props.channel)
    localModels.value = res.models ?? []
    // 渠道未就绪（宿主没把底层 ChatClient 模块装进来）：只提示原因，不当成刷新成功
    if (res.available === false) {
      errors.text = res.reason || '该渠道未就绪：底层 ChatClient 扩展未注册'
      return
    }
    ElMessage.success(
      localModels.value.length
        ? `已刷新 ${localModels.value.length} 个模型`
        : '该渠道未声明可选模型，将使用默认模型',
    )
  } catch (e) {
    errors.text = e instanceof Error ? e.message : String(e)
  } finally {
    refreshing.value = false
  }
}

async function generate() {
  if (busy.value) return
  const text = prompt.value.trim()
  if (!text) {
    ElMessage.warning('先描述想生成的画面')
    return
  }
  busy.value = true
  errors.text = ''
  elapsed.value = null
  images.value = []
  // 清掉上一轮的「已加载」标记：同一 URL 重试时不应沿用旧的骨架状态
  Object.keys(loaded).forEach((key) => delete loaded[key])
  try {
    const res = await channelApi.generateImage(props.channel, {
      prompt: text,
      ratio: ratio.value,
      n: count.value,
      model: model.value || undefined,
      token: token.value.trim() || undefined,
    })
    images.value = res.images ?? []
    elapsed.value = res.elapsedMs ?? null
    if (!images.value.length) {
      errors.text = '上游没有返回图片地址'
    }
  } catch (e) {
    errors.text = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

function useQuick(text: string) {
  prompt.value = text
}

/** 图片真正加载完成（Pollinations 通常需要 10~40 秒渲染） */
function markLoaded(url: string) {
  loaded[url] = true
}

/** 打开原图（新窗口 + noopener） */
function openImage(url: string) {
  window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <div class="imgc">
    <div class="imgc__head">
      <div class="imgc__ident">
        <b>{{ displayName || channel }}</b>
        <span class="imgc__badge">ImageChannel SPI · 文生图</span>
        <span v-if="priority !== undefined" class="imgc__prio">优先级 {{ priority }}</span>
      </div>
      <button type="button" class="imgc__refresh" :disabled="refreshing" @click="refreshModels">
        {{ refreshing ? '刷新中…' : '刷新模型' }}
      </button>
    </div>

    <div class="imgc__models">
      <button
        v-for="m in modelOptions"
        :key="m.id"
        type="button"
        class="imgc__model"
        :class="{ 'is-active': model === m.id }"
        :title="m.name || m.id"
        @click="model = m.id"
      >
        {{ m.name || m.id }}
      </button>
      <span v-if="!modelOptions.length" class="imgc__empty">该渠道未声明可选模型，使用默认模型</span>
    </div>

    <div class="imgc__dock">
      <label class="imgc__field">
        <span>画面描述</span>
        <textarea v-model="prompt" rows="3" placeholder="例如：一只橘猫趴在服务器机柜上打盹，机房冷光，写实摄影" />
      </label>

      <div class="imgc__row">
        <label class="imgc__field imgc__field--inline">
          <span>宽高比</span>
          <div class="imgc__ratios">
            <button
              v-for="r in RATIOS"
              :key="r"
              type="button"
              class="imgc__ratio"
              :class="{ 'is-active': ratio === r }"
              @click="ratio = r"
            >{{ r }}</button>
          </div>
        </label>
        <label class="imgc__field imgc__field--inline">
          <span>张数</span>
          <select v-model.number="count" class="imgc__select">
            <option :value="1">1 张</option>
            <option :value="2">2 张</option>
            <option :value="3">3 张</option>
            <option :value="4">4 张</option>
          </select>
        </label>
      </div>

      <label v-if="needsToken" class="imgc__field">
        <span>登录令牌（可选，仅本次请求生效）</span>
        <input v-model="token" type="password" placeholder="Trae 的 JWT；留空则读本机登录态" autocomplete="off" />
      </label>

      <div class="imgc__quick">
        <button
          v-for="(q, i) in QUICK_PROMPTS"
          :key="i"
          type="button"
          class="imgc__chip"
          :title="q"
          @click="useQuick(q)"
        >示例 {{ i + 1 }}</button>
        <button type="button" class="imgc__send" :disabled="busy" @click="generate">
          {{ busy ? '生成中…' : '开始生成' }}
        </button>
      </div>
    </div>

    <div v-if="errors.text" class="imgc__error">{{ errors.text }}</div>

    <div v-if="images.length" class="imgc__result">
      <div class="imgc__result-head">
        <b>生成结果</b>
        <span v-if="elapsed !== null">{{ elapsed }} ms · {{ images.length }} 张 · {{ ratio }}</span>
      </div>
      <div class="imgc__grid">
        <figure v-for="(img, i) in images" :key="img.key || `${img.url}-${i}`" class="imgc__card">
          <div class="imgc__frame" :class="{ 'is-loading': !loaded[img.url] }" :style="frameStyle">
            <img :src="img.thumbUrl || img.url" :alt="prompt" loading="lazy" @load="markLoaded(img.url)" />
            <span v-if="!loaded[img.url]" class="imgc__skeleton">图片渲染中…</span>
          </div>
          <figcaption class="imgc__meta">
            <span>{{ img.width && img.height ? `${img.width}×${img.height}` : ratio }}</span>
            <a href="javascript:void(0)" @click="openImage(img.url)">打开原图</a>
          </figcaption>
        </figure>
      </div>
    </div>
  </div>
</template>

<style scoped>
.imgc {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
}
.imgc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.imgc__ident {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.imgc__ident b {
  font-size: 13px;
  color: var(--text-primary, #0f172a);
}
.imgc__badge {
  font-size: 11px;
  color: #7c3aed;
  border: 1px solid color-mix(in srgb, #7c3aed 35%, transparent);
  background: color-mix(in srgb, #7c3aed 8%, transparent);
  border-radius: 999px;
  padding: 1px 8px;
}
.imgc__prio {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.imgc__refresh {
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: transparent;
  color: var(--text-secondary, #475569);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all .15s ease;
}
.imgc__refresh:hover {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.imgc__models {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.imgc__model {
  border: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-elevated, #f8fafc);
  color: var(--text-secondary, #475569);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all .15s ease;
}
.imgc__model:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
}
.imgc__model.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 10%, transparent);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}
.imgc__empty {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.imgc__dock {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.imgc__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #475569);
}
.imgc__field--inline {
  flex-direction: column;
}
.imgc__field input,
.imgc__field textarea {
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 6px;
  padding: 6px 9px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary, #0f172a);
  background: var(--bg-container, #fff);
  outline: none;
  resize: vertical;
}
.imgc__field input:focus,
.imgc__field textarea:focus {
  border-color: var(--el-color-primary, #409eff);
}
.imgc__row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}
.imgc__ratios {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.imgc__ratio {
  border: 1px solid var(--border-default, #e2e9f3);
  background: transparent;
  color: var(--text-secondary, #475569);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 11px;
  cursor: pointer;
}
.imgc__ratio.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 10%, transparent);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}
.imgc__select {
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary, #0f172a);
  background: var(--bg-container, #fff);
  outline: none;
}
.imgc__quick {
  display: flex;
  align-items: center;
  gap: 6px;
}
.imgc__chip {
  border: 1px dashed var(--border-default, #e2e9f3);
  background: transparent;
  color: var(--text-tertiary, #94a3b8);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 11px;
  cursor: pointer;
}
.imgc__chip:hover {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.imgc__send {
  margin-left: auto;
  border: 1px solid var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: #fff;
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
  transition: background .15s ease;
}
.imgc__send:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.imgc__error {
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--el-color-danger, #f56c6c);
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 8%, transparent);
}
.imgc__result {
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 10px;
  overflow: hidden;
}
.imgc__result-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 7px 10px;
  border-bottom: 1px solid var(--border-default, #e2e9f3);
  background: var(--bg-elevated, #f8fafc);
}
.imgc__result-head b {
  font-size: 12px;
  color: var(--text-primary, #0f172a);
}
.imgc__result-head span {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.imgc__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  padding: 10px;
}
.imgc__card {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.imgc__frame {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-elevated, #f8fafc);
  border: 1px solid var(--border-default, #e2e9f3);
}
.imgc__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.imgc__frame.is-loading img {
  opacity: .25;
}
.imgc__skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  animation: imgc-pulse 1.4s ease-in-out infinite;
}
@keyframes imgc-pulse {
  0%, 100% { opacity: .45; }
  50% { opacity: 1; }
}
.imgc__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
}
.imgc__meta a {
  color: var(--el-color-primary, #409eff);
  text-decoration: none;
}
.imgc__meta a:hover {
  text-decoration: underline;
}
</style>
