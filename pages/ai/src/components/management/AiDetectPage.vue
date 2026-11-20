<template>
  <div class="detect-root" data-page="ai-detect">
    <!-- ==================== 顶栏：模式切换 + 右上角结论卡 ==================== -->
    <header class="detect-head">
      <div class="detect-tabs" role="tablist">
        <button
          type="button"
          class="detect-tab"
          :class="{ 'is-active': mode === 'text' }"
          role="tab"
          :aria-selected="mode === 'text' ? 'true' : 'false'"
          @click="switchMode('text')"
        >文本检测</button>
        <button
          type="button"
          class="detect-tab"
          :class="{ 'is-active': mode === 'image' }"
          role="tab"
          :aria-selected="mode === 'image' ? 'true' : 'false'"
          @click="switchMode('image')"
        >图片检测</button>
      </div>

      <!--
        右上角结论卡：分数 + 结论一眼可见。
        检测中显示进行态；无结果时占位说明口径，避免布局跳动。
      -->
      <div class="detect-verdict" :class="verdictToneClass" data-testid="detect-verdict">
        <template v-if="busy">
          <div class="detect-verdict-score is-busy">…</div>
          <div class="detect-verdict-meta">
            <p class="detect-verdict-title">检测中</p>
            <p class="detect-verdict-sub">正在分析{{ mode === 'text' ? '文本特征' : '图片元数据' }}…</p>
          </div>
        </template>
        <template v-else-if="mode === 'text' && textResult">
          <div class="detect-verdict-score" :style="{ '--pct': textScorePct }">
            <i class="detect-verdict-ring" /><span class="detect-verdict-num">{{ textResult.report.aiProbability }}</span>
          </div>
          <div class="detect-verdict-meta">
            <p class="detect-verdict-title">{{ textResult.report.verdict }}</p>
            <p class="detect-verdict-sub">
              AI 可能性 {{ textResult.report.aiProbability }}/100 · 阈值 {{ textResult.threshold }} · 置信度{{ textResult.report.confidence }}
            </p>
          </div>
        </template>
        <template v-else-if="mode === 'image' && imageResult">
          <div class="detect-verdict-score is-plain" :style="{ '--pct': imageScorePct }">
            <i class="detect-verdict-ring" /><span class="detect-verdict-num">{{ imageVerdictShort }}</span>
          </div>
          <div class="detect-verdict-meta">
            <p class="detect-verdict-title">{{ imageResult.report.verdict }}</p>
            <p class="detect-verdict-sub">
              {{ imageResult.report.format }} · 置信度{{ imageResult.report.confidence }}
              <template v-if="imageResult.report.generator"> · {{ imageResult.report.generator }}</template>
            </p>
          </div>
        </template>
        <template v-else>
          <div class="detect-verdict-score is-idle">--</div>
          <div class="detect-verdict-meta">
            <p class="detect-verdict-title">暂无结论</p>
            <p class="detect-verdict-sub">{{ mode === 'text' ? '输入文本并点击「开始检测」' : '上传图片并点击「开始检测」' }}</p>
          </div>
        </template>
      </div>
    </header>

    <!-- ==================== 主体 ==================== -->
    <div class="detect-body">
      <!-- ---------- 文本检测 ---------- -->
      <section v-show="mode === 'text'" class="detect-pane">
        <div class="detect-card" :class="{ 'detect-card--fill': !textResult }">
          <div class="detect-card-head">
            <h2 class="detect-card-title">待检测文本</h2>
            <span class="detect-card-hint" :class="{ 'is-over': textOverLimit }">
              {{ textLength }} / {{ TEXT_LIMIT }} 字<template v-if="textOverLimit">（超出上限）</template>
            </span>
          </div>
          <textarea
            v-model="textInput"
            class="detect-textarea"
            :maxlength="TEXT_LIMIT + 500"
            placeholder="粘贴一段文字，判断它是否由 AI 生成。支持文章、评论、报告、邮件等。"
            spellcheck="false"
          />
          <div class="detect-card-foot">
            <span class="detect-tip">纯统计特征分析，不上传不改写；分数越高越像 AI 生成。</span>
            <ReButton type="primary" :disabled="!textInput.trim() || textOverLimit || busy" :loading="busy && mode === 'text'" @click="runTextDetect">
              开始检测
            </ReButton>
          </div>
        </div>

        <template v-if="textResult">
          <!-- 依据 -->
          <div class="detect-card">
            <div class="detect-card-head">
              <h2 class="detect-card-title">判断依据</h2>
            </div>
            <div class="detect-marker-cols">
              <div class="detect-marker-col">
                <p class="detect-marker-head is-ai">AI 写作迹象（{{ textResult.report.aiMarkers.length }}）</p>
                <ul v-if="textResult.report.aiMarkers.length" class="detect-marker-list">
                  <li v-for="(m, i) in textResult.report.aiMarkers" :key="'a' + i" class="detect-marker">
                    <span class="detect-marker-evidence" :title="m.evidence">{{ m.evidence }}</span>
                    <span class="detect-marker-reason">{{ m.reason }}</span>
                  </li>
                </ul>
                <p v-else class="detect-marker-empty">未发现明显 AI 写作迹象</p>
              </div>
              <div class="detect-marker-col">
                <p class="detect-marker-head is-human">人工写作迹象（{{ textResult.report.humanMarkers.length }}）</p>
                <ul v-if="textResult.report.humanMarkers.length" class="detect-marker-list">
                  <li v-for="(m, i) in textResult.report.humanMarkers" :key="'h' + i" class="detect-marker">
                    <span class="detect-marker-evidence" :title="m.evidence">{{ m.evidence }}</span>
                    <span class="detect-marker-reason">{{ m.reason }}</span>
                  </li>
                </ul>
                <p v-else class="detect-marker-empty">未发现明显人工写作迹象</p>
              </div>
            </div>
          </div>

          <!-- 逐句标注 -->
          <div v-if="textResult.report.sentences.length" class="detect-card">
            <div class="detect-card-head">
              <h2 class="detect-card-title">逐句标注</h2>
              <span class="detect-card-hint">标红句子为「可能有 AI 参与」及以上</span>
            </div>
            <ol class="detect-sentences">
              <li
                v-for="s in textResult.report.sentences"
                :key="s.index"
                class="detect-sentence"
                :class="{ 'is-ai': s.score >= textResult.threshold, 'is-mid': s.score < textResult.threshold && s.score >= 40 }"
              >
                <span class="detect-sentence-score">{{ s.score }}</span>
                <div class="detect-sentence-body">
                  <p class="detect-sentence-text">{{ s.text }}</p>
                  <p class="detect-sentence-label">{{ s.label }}<template v-if="s.reasons && s.reasons.length"> · {{ s.reasons.join('；') }}</template></p>
                </div>
              </li>
            </ol>
          </div>

          <!-- 写作指纹 -->
          <div class="detect-card">
            <div class="detect-card-head">
              <h2 class="detect-card-title">写作指纹</h2>
            </div>
            <div class="detect-fingerprints">
              <div v-for="f in fingerprintItems" :key="f.label" class="detect-fingerprint">
                <span class="detect-fingerprint-num">{{ f.value }}</span>
                <span class="detect-fingerprint-label">{{ f.label }}</span>
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- ---------- 图片检测 ---------- -->
      <section v-show="mode === 'image'" class="detect-pane">
        <div class="detect-card" :class="{ 'detect-card--fill': !imageResult }">
          <div class="detect-card-head">
            <h2 class="detect-card-title">待检测图片</h2>
            <span class="detect-card-hint">支持 JPEG / PNG / WEBP，单张 ≤ 20MB</span>
          </div>

          <!-- 上传区 / 预览区 -->
          <div
            v-if="!imageUrl"
            class="detect-drop"
            :class="{ 'is-dragover': dragOver }"
            role="button"
            tabindex="0"
            aria-label="上传图片"
            @click="pickImage"
            @keydown.enter.prevent="pickImage"
            @keydown.space.prevent="pickImage"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <div class="detect-drop-inner">
              <svg class="detect-drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <rect x="3" y="4" width="18" height="16" rx="2.5" />
                <circle cx="9" cy="10" r="1.8" />
                <path d="M3.5 17.5 9 12.5l4 3.5 3.5-3 4 4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <p class="detect-drop-title">上传图片，检测是否带 AI 生成痕迹</p>
              <p class="detect-drop-desc">点击选择图片，或把图片拖到这里</p>
            </div>
          </div>
          <div v-else class="detect-preview">
            <img :src="imageUrl" class="detect-preview-img" alt="待检测图片" />
            <div v-if="busy && mode === 'image'" class="detect-preview-mask">
              <span>检测中…</span>
            </div>
          </div>

          <div class="detect-card-foot">
            <span class="detect-tip">基于图片元数据（C2PA 凭证 / XMP / EXIF / 生成参数块）判断，无凭证不等于非 AI。</span>
            <div class="detect-foot-actions">
              <ReButton v-if="imageUrl" :disabled="busy" @click="clearImage">清除</ReButton>
              <ReButton type="primary" :disabled="!imageFile || busy" :loading="busy && mode === 'image'" @click="runImageDetect">
                {{ imageUrl ? '重新检测' : '开始检测' }}
              </ReButton>
            </div>
          </div>
        </div>

        <div v-if="imageResult" class="detect-card">
          <div class="detect-card-head">
            <h2 class="detect-card-title">元数据信号</h2>
            <span class="detect-card-hint">{{ imageResult.fileName }} · {{ formatSize(imageResult.size) }}</span>
          </div>
          <div class="detect-image-facts">
            <div class="detect-fact">
              <span class="detect-fact-k">内容凭证（C2PA）</span>
              <span class="detect-fact-v" :class="imageResult.report.hasContentCredentials ? 'is-hit' : ''">
                {{ imageResult.report.hasContentCredentials ? '存在' : '未发现' }}
              </span>
            </div>
            <div class="detect-fact">
              <span class="detect-fact-k">来源类型（IPTC）</span>
              <span class="detect-fact-v">{{ imageResult.report.digitalSourceType || '—' }}</span>
            </div>
            <div class="detect-fact">
              <span class="detect-fact-k">生成器</span>
              <span class="detect-fact-v" :class="imageResult.report.generator ? 'is-hit' : ''">
                {{ imageResult.report.generator || '未发现' }}
              </span>
            </div>
            <div class="detect-fact">
              <span class="detect-fact-k">生成参数块</span>
              <span class="detect-fact-v" :class="imageResult.report.generationParams ? 'is-hit' : ''">
                {{ imageResult.report.generationParams ? '检测到（prompt/steps/sampler/seed 等）' : '未发现' }}
              </span>
            </div>
          </div>
          <ul v-if="imageResult.report.signals.length" class="detect-signals">
            <li v-for="(s, i) in imageResult.report.signals" :key="i" class="detect-signal">{{ s }}</li>
          </ul>
          <p v-else class="detect-marker-empty">未读取到可判定的元数据信号</p>
        </div>
      </section>
    </div>

    <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/webp" class="detect-file-input" @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { message } from '@repo/core'
import ReButton from '@/components/ui/ReButton.vue'
import { detectApi } from '@/services/javaApi'
import type { DetectImageResult, DetectTextResult } from '@/services/javaApi'

/** 文本长度上限：与后端 DetectController 的上限（SUGGESTED_MAX_CHARS * 4）一致 */
const TEXT_LIMIT = 4200 * 4

type Mode = 'text' | 'image'

const mode = ref<Mode>('text')
const busy = ref(false)

// ---------- 文本 ----------
const textInput = ref('')
const textResult = ref<DetectTextResult | null>(null)
const textLength = computed(() => textInput.value.length)
const textOverLimit = computed(() => textLength.value > TEXT_LIMIT)

// ---------- 图片 ----------
const fileInputRef = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imageUrl = ref('')
const imageResult = ref<DetectImageResult | null>(null)
const dragOver = ref(false)

// ---------- 结论卡 ----------
/** 分数环的百分比（conic-gradient 用） */
const textScorePct = computed(() => `${Math.max(0, Math.min(100, textResult.value?.report.aiProbability ?? 0))}%`)
/** 图片没有连续分数，用置信度映射一个展示比例：高=90 中=60 低=30 */
const imageScorePct = computed(() => {
  const c = imageResult.value?.report.confidence
  if (c === '高') return '90%'
  if (c === '中') return '60%'
  if (c === '低') return '30%'
  return '0%'
})
/** 图片结论的环内短文案 */
const imageVerdictShort = computed(() => {
  const v = imageResult.value?.report.verdict ?? ''
  if (v.includes('生成')) return 'AI'
  if (v.includes('参与')) return '疑似'
  if (v.includes('未发现')) return '人工'
  return '存疑'
})

/** 结论卡配色：按当前模式的判定结果给 tone */
const verdictToneClass = computed(() => {
  if (busy.value) return 'is-busy'
  if (mode.value === 'text' && textResult.value) {
    return textResult.value.likelyAi ? 'is-risk' : 'is-safe'
  }
  if (mode.value === 'image' && imageResult.value) {
    const v = imageResult.value.report.verdict
    if (v.includes('AI 生成')) return 'is-risk'
    if (v.includes('AI 参与')) return 'is-warn'
    if (v.includes('未发现')) return 'is-safe'
    return 'is-idle'
  }
  return 'is-idle'
})

/** 写作指纹展示项 */
const fingerprintItems = computed(() => {
  const fp = textResult.value?.report.fingerprint
  if (!fp) return []
  return [
    { label: '句子数', value: fp.sentenceCount },
    { label: '总字数', value: fp.totalChars },
    { label: '平均句长', value: fp.avgSentenceLength },
    { label: '句长波动', value: fp.lengthStdDev },
    { label: 'AI 高频词', value: fp.aiPhraseHits },
    { label: '第一人称', value: fp.firstPersonHits },
    { label: '口语缩写', value: fp.contractionHits },
    { label: '口语词', value: fp.colloquialHits },
    { label: '具体数字', value: fp.numberHits },
    { label: '破折号', value: fp.dashHits },
    { label: '排比句', value: fp.parallelismHits },
  ]
})

function switchMode(next: Mode) {
  if (mode.value === next) return
  mode.value = next
}

async function runTextDetect() {
  const text = textInput.value.trim()
  if (!text || busy.value) return
  busy.value = true
  try {
    textResult.value = await detectApi.detectText(text)
  } catch (e: any) {
    message.error(e?.message || '文本检测失败')
  } finally {
    busy.value = false
  }
}

function pickImage() {
  fileInputRef.value?.click()
}

function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) acceptFile(file)
}

function onDrop(ev: DragEvent) {
  dragOver.value = false
  const file = ev.dataTransfer?.files?.[0]
  if (file) acceptFile(file)
}

function acceptFile(file: File) {
  if (!/image\/(jpeg|png|webp)/i.test(file.type)) {
    message.warning('仅支持 JPEG / PNG / WEBP 图片')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    message.warning('图片超过 20MB 上限')
    return
  }
  clearImage()
  imageFile.value = file
  imageUrl.value = URL.createObjectURL(file)
}

function clearImage() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageFile.value = null
  imageUrl.value = ''
  imageResult.value = null
}

async function runImageDetect() {
  if (!imageFile.value || busy.value) return
  busy.value = true
  try {
    imageResult.value = await detectApi.detectImage(imageFile.value)
  } catch (e: any) {
    message.error(e?.message || '图片检测失败')
  } finally {
    busy.value = false
  }
}

function formatSize(bytes: number): string {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

onBeforeUnmount(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
})
</script>

<style scoped>
.detect-root {
  --det-bg: var(--el-bg-color);
  --det-card: var(--el-bg-color);
  --det-text: var(--el-text-color-primary);
  --det-muted: var(--el-text-color-secondary);
  --det-border: var(--el-border-color-lighter);
  --det-hover: var(--el-fill-color-light);
  --det-radius: var(--el-radius-lg, 12px);
  --det-accent: var(--el-color-primary);
  --det-risk: var(--el-color-danger);
  --det-warn: var(--el-color-warning);
  --det-safe: var(--el-color-success);

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  padding: 16px 20px 20px;
  background: var(--det-bg);
  color: var(--det-text);
}

html.dark .detect-root {
  --det-border: var(--el-border-color);
}

/* ==================== 顶栏 ==================== */
.detect-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.detect-tabs {
  display: inline-flex;
  padding: 4px;
  border: 1px solid var(--det-border);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--det-card);
}

.detect-tab {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--det-muted);
  font-size: 14px;
  line-height: 1;
  padding: 9px 18px;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.detect-tab:hover {
  color: var(--det-text);
}

.detect-tab.is-active {
  color: var(--el-color-white);
  background: var(--det-accent);
  font-weight: 600;
}

/* ---------- 右上角结论卡 ---------- */
.detect-verdict {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 300px;
  max-width: 460px;
  padding: 12px 18px;
  border: 1px solid var(--det-border);
  border-radius: var(--det-radius);
  background: var(--det-card);
  border-left: 4px solid var(--det-muted);
}

.detect-verdict.is-risk { border-left-color: var(--det-risk); }
.detect-verdict.is-warn { border-left-color: var(--det-warn); }
.detect-verdict.is-safe { border-left-color: var(--det-safe); }
.detect-verdict.is-busy { border-left-color: var(--det-accent); }

.detect-verdict-score {
  --pct: 0%;
  position: relative;
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
}

.detect-verdict-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    conic-gradient(currentColor var(--pct), var(--det-border) var(--pct));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
}

.detect-verdict.is-risk .detect-verdict-score { color: var(--det-risk); }
.detect-verdict.is-warn .detect-verdict-score { color: var(--det-warn); }
.detect-verdict.is-safe .detect-verdict-score { color: var(--det-safe); }
.detect-verdict.is-busy .detect-verdict-score { color: var(--det-accent); }
.detect-verdict.is-idle .detect-verdict-score { color: var(--det-muted); }

.detect-verdict-num {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--det-text);
}

.detect-verdict-score.is-plain .detect-verdict-num {
  font-size: 15px;
}

.detect-verdict-score.is-busy .detect-verdict-num,
.detect-verdict-score.is-idle .detect-verdict-num {
  color: var(--det-muted);
  font-weight: 600;
}

.detect-verdict-meta {
  min-width: 0;
}

.detect-verdict-title {
  margin: 0 0 3px;
  font-size: 15px;
  font-weight: 600;
  color: var(--det-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detect-verdict-sub {
  margin: 0;
  font-size: 12px;
  color: var(--det-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 主体 ==================== */
.detect-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.detect-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.detect-card {
  border: 1px solid var(--det-border);
  border-radius: var(--det-radius);
  background: var(--det-card);
  padding: 16px 18px;
}

/* 无结果时：输入卡片撑满面板剩余高度，页面不留大片空白 */
.detect-card--fill {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.detect-card--fill .detect-textarea {
  flex: 1;
  min-height: 180px;
}

.detect-card--fill .detect-drop,
.detect-card--fill .detect-preview {
  flex: 1;
  min-height: 220px;
}

.detect-card--fill .detect-drop {
  display: flex;
  flex-direction: column;
}

.detect-card--fill .detect-drop-inner {
  flex: 1;
  justify-content: center;
}

.detect-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.detect-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--det-text);
}

.detect-card-hint {
  font-size: 12px;
  color: var(--det-muted);
}

.detect-card-hint.is-over {
  color: var(--det-risk);
  font-weight: 600;
}

/* ---------- 文本 ---------- */
.detect-textarea {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  padding: 12px 14px;
  border: 1px solid var(--det-border);
  border-radius: 10px;
  background: var(--det-bg);
  color: var(--det-text);
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
}

.detect-textarea:focus {
  border-color: var(--det-accent);
}

.detect-textarea::placeholder {
  color: var(--det-muted);
}

.detect-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.detect-foot-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detect-tip {
  font-size: 12px;
  color: var(--det-muted);
}

.detect-marker-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.detect-marker-head {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
}

.detect-marker-head.is-ai { color: var(--det-risk); }
.detect-marker-head.is-human { color: var(--det-safe); }

.detect-marker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detect-marker {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--det-border);
  border-radius: 8px;
  background: var(--det-hover);
}

.detect-marker-evidence {
  font-size: 13px;
  color: var(--det-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detect-marker-reason {
  font-size: 12px;
  color: var(--det-muted);
}

.detect-marker-empty {
  margin: 0;
  font-size: 13px;
  color: var(--det-muted);
}

.detect-sentences {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.detect-sentence {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--det-border);
  border-radius: 8px;
}

.detect-sentence.is-ai {
  border-color: color-mix(in srgb, var(--det-risk) 45%, transparent);
  background: color-mix(in srgb, var(--det-risk) 8%, transparent);
}

.detect-sentence.is-mid {
  border-color: color-mix(in srgb, var(--det-warn) 40%, transparent);
  background: color-mix(in srgb, var(--det-warn) 7%, transparent);
}

.detect-sentence-score {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--det-border);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--det-muted);
}

.detect-sentence.is-ai .detect-sentence-score {
  color: var(--det-risk);
  border-color: var(--det-risk);
}

.detect-sentence.is-mid .detect-sentence-score {
  color: var(--det-warn);
  border-color: var(--det-warn);
}

.detect-sentence-body {
  min-width: 0;
}

.detect-sentence-text {
  margin: 0 0 2px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--det-text);
  word-break: break-word;
}

.detect-sentence-label {
  margin: 0;
  font-size: 12px;
  color: var(--det-muted);
}

.detect-fingerprints {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}

.detect-fingerprint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border: 1px solid var(--det-border);
  border-radius: 10px;
  background: var(--det-hover);
}

.detect-fingerprint-num {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--det-text);
}

.detect-fingerprint-label {
  font-size: 12px;
  color: var(--det-muted);
}

/* ---------- 图片 ---------- */
.detect-drop {
  border: 2px dashed var(--det-border);
  border-radius: var(--det-radius);
  background: var(--det-bg);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.detect-drop:focus-visible {
  outline: 2px solid var(--det-accent);
  outline-offset: 2px;
}

.detect-drop.is-dragover {
  border-color: var(--det-accent);
}

.detect-drop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 44px 20px;
  cursor: pointer;
  color: var(--det-muted);
}

.detect-drop-inner:hover {
  color: var(--det-accent);
}

.detect-drop-icon {
  width: 44px;
  height: 44px;
  margin-bottom: 4px;
}

.detect-drop-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--det-text);
}

.detect-drop-desc {
  margin: 0;
  font-size: 12px;
}

.detect-preview {
  position: relative;
  border: 1px solid var(--det-border);
  border-radius: var(--det-radius);
  overflow: hidden;
  background: var(--det-hover);
  display: grid;
  place-items: center;
  min-height: 220px;
}

.detect-preview-img {
  max-width: 100%;
  max-height: 380px;
  object-fit: contain;
  display: block;
}

.detect-preview-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--det-bg) 65%, transparent);
  color: var(--det-text);
  font-size: 14px;
  font-weight: 600;
}

.detect-image-facts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.detect-fact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid var(--det-border);
  border-radius: 8px;
  background: var(--det-hover);
}

.detect-fact-k {
  font-size: 13px;
  color: var(--det-muted);
  flex-shrink: 0;
}

.detect-fact-v {
  font-size: 13px;
  color: var(--det-text);
  text-align: right;
  word-break: break-all;
}

.detect-fact-v.is-hit {
  color: var(--det-risk);
  font-weight: 600;
}

.detect-signals {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detect-signal {
  position: relative;
  padding-left: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--det-text);
}

.detect-signal::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--det-accent);
}

/* 裁剪隐藏而非 display:none：部分 WebView/Electron 环境下，
   display:none 的文件输入框编程式 click() 不会弹出文件选择框 */
.detect-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  border: 0;
  overflow: hidden;
  opacity: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  pointer-events: none;
}

@media (max-width: 720px) {
  .detect-root {
    padding: 12px;
  }

  .detect-verdict {
    width: 100%;
    min-width: 0;
  }
}
</style>
