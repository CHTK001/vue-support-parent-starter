<template>
  <div class="fs-root">
    <div class="fs-body">
      <!-- ==================== 左：图片舞台 ==================== -->
      <section class="fs-stage">
        <div class="fs-stage-inner">
          <!-- 空态：引导上传 -->
          <div v-if="!previewUrl" class="fs-drop" @click="pickImage">
            <el-icon :size="46" class="fs-drop-icon"><Picture /></el-icon>
            <p class="fs-drop-title">上传一张照片，开始识别人脸</p>
            <p class="fs-drop-desc">点击选择图片，或把照片拖到这里</p>
            <el-button type="primary" class="fs-drop-btn" @click.stop="pickImage">
              <el-icon><FolderOpened /></el-icon>选择图片
            </el-button>
          </div>

          <!-- 图片 + 检测叠加层 -->
          <div v-else class="fs-canvas" :class="{ 'is-busy': detecting }">
            <img :src="previewUrl" class="fs-img" alt="待识别人脸" />

            <!--
              叠加层与图片用同一 viewBox + 同一 preserveAspectRatio，
              二者缩放/留白完全一致，检测框坐标即可直接落在原图像素上。
            -->
            <svg
              v-if="mainHit"
              class="fs-overlay"
              :viewBox="`0 0 ${natural.w} ${natural.h}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- 人脸框：青色虚线圆角 -->
              <rect
                class="fs-box"
                :x="mainHit.box.x"
                :y="mainHit.box.y"
                :width="mainHit.box.width"
                :height="mainHit.box.height"
                rx="26"
              />
              <!-- 关键点 -->
              <circle
                v-for="(kp, i) in landmarks"
                :key="i"
                class="fs-kp"
                :cx="kp[0]"
                :cy="kp[1]"
                r="7"
              />
            </svg>

            <!-- 识别中遮罩 -->
            <div v-if="detecting" class="fs-mask">
              <el-icon :size="26" class="is-spin"><Loading /></el-icon>
              <span>正在识别人脸…</span>
            </div>

            <!-- 角标：找到相似脸 -->
            <div v-if="mainHit && !detecting" class="fs-found">
              <div class="fs-found-title">
                <el-icon><Search /></el-icon>找到相似脸
              </div>
              <div class="fs-found-sub">匹配度参考</div>
            </div>

            <!-- 未检出人脸 -->
            <div v-else-if="previewUrl && !detecting && !mainHit" class="fs-noface">
              <el-icon :size="20"><Warning /></el-icon>
              <span>未检测到人脸，请换一张正面清晰的照片</span>
            </div>
          </div>

          <!-- 操作条 -->
          <div v-if="previewUrl" class="fs-actions">
            <el-button class="fs-btn fs-btn-ghost" :disabled="busy" @click="pickImage">
              <el-icon><FolderOpened /></el-icon>更换图片
            </el-button>
            <el-button
              class="fs-btn fs-btn-accent"
              :disabled="busy || !mainHit"
              @click="recognizeCrop"
            >
              <el-icon><Crop /></el-icon>裁剪脸部
            </el-button>
            <el-button
              class="fs-btn fs-btn-brand"
              :disabled="busy || !mainHit"
              :loading="identifying"
              @click="runIdentify"
            >
              <el-icon v-if="!identifying"><Refresh /></el-icon>重新识别
            </el-button>
          </div>
        </div>
      </section>

      <!-- ==================== 右：相似面孔推荐 ==================== -->
      <aside class="fs-panel">
        <header class="fs-panel-head">
          <h2 class="fs-panel-title">相似面孔推荐</h2>
          <span class="fs-dots"><i v-for="n in 5" :key="n" /></span>
        </header>

        <!-- 分类切换 -->
        <nav class="fs-tabs">
          <button
            v-for="t in TABS"
            :key="t.key"
            class="fs-tab"
            :class="{ 'is-active': activeTab === t.key, 'is-off': !t.ready }"
            :disabled="!t.ready"
            :title="t.ready ? '' : t.reason"
            @click="activeTab = t.key"
          >
            {{ t.label }}
          </button>
        </nav>

        <!-- 结果网格 -->
        <div v-if="visibleHits.length" class="fs-grid">
          <article
            v-for="item in visibleHits"
            :key="item.id"
            class="fs-card"
            :class="{ 'is-picked': pickedId === item.id }"
            @click="pickedId = item.id"
          >
            <div class="fs-card-face">
              <img v-if="item.thumb" :src="item.thumb" :alt="item.label" class="fs-card-img" />
              <div v-else class="fs-card-fallback"><el-icon><User /></el-icon></div>
              <!-- 相似度环 -->
              <svg class="fs-ring" viewBox="0 0 120 120">
                <circle class="fs-ring-track" cx="60" cy="60" r="54" />
                <circle
                  class="fs-ring-bar"
                  cx="60"
                  cy="60"
                  r="54"
                  :stroke-dasharray="RING_C"
                  :stroke-dashoffset="ringOffset(item.score)"
                />
              </svg>
              <span v-if="pickedId === item.id" class="fs-check"><el-icon><Check /></el-icon></span>
            </div>
            <p class="fs-card-cap">
              <b class="fs-card-score">{{ percent(item.score) }}%</b>
              <span class="fs-card-sep">|</span>
              <span class="fs-card-tag">{{ item.label }}</span>
            </p>
          </article>
        </div>

        <!-- 无结果 -->
        <div v-else class="fs-blank">
          <el-icon :size="34" class="fs-blank-icon"><User /></el-icon>
          <p class="fs-blank-title">{{ blankTitle }}</p>
          <p class="fs-blank-desc">{{ blankDesc }}</p>
        </div>

        <!-- 画廊条 -->
        <div v-if="gallery.length" class="fs-gallery">
          <button
            v-for="g in gallery"
            :key="g.key"
            class="fs-thumb"
            :class="{ 'is-active': galleryKey === g.key }"
            @click="galleryKey = g.key"
          >
            <img :src="g.url" :alt="g.key" />
          </button>
        </div>

        <!-- 主行动 -->
        <el-button
          class="fs-cta"
          :disabled="busy"
          :loading="enrolling"
          @click="enrollCurrent"
        >
          <el-icon v-if="!enrolling"><Star /></el-icon>你可能也喜欢
        </el-button>

        <!-- 当前模型（只读，取自系统设置） -->
        <p class="fs-model">
          <el-icon><Setting /></el-icon>
          <span>检测模型 <b>{{ models.detector_model || '—' }}</b></span>
          <span class="fs-dot">·</span>
          <span>特征模型 <b>{{ models.feature_model || '—' }}</b></span>
        </p>
      </aside>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="fs-hidden" @change="onFilePicked" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Check, Crop, FolderOpened, Loading, Picture, Refresh, Search, Setting, Star, User, Warning,
} from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import type { FaceBox, FaceHit, FaceMatch } from '@/services/modules/face.api'

/** 相似度环周长：r=54 → 2πr */
const RING_C = 2 * Math.PI * 54

/** 分类页签。属性类筛选依赖 attribute/emotion 权重，本地未就绪时置灰并说明原因。 */
const TABS = [
  { key: 'all', label: '全部', ready: true, reason: '' },
  { key: 'age', label: '同年龄段', ready: false, reason: '需要人脸属性模型（本地权重未下载）' },
  { key: 'hair', label: '相似发型', ready: false, reason: '需要人脸属性模型（本地权重未下载）' },
  { key: 'shot', label: '上镜感', ready: false, reason: '需要人脸质量/表情模型（本地权重未下载）' },
] as const

const activeTab = ref<string>('all')
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref('')
const natural = ref({ w: 1, h: 1 })
const hits = ref<FaceHit[]>([])
const matches = ref<FaceMatch[]>([])
const models = ref<Record<string, any>>({})
const pickedId = ref('')
const galleryKey = ref('')

const detecting = ref(false)
const identifying = ref(false)
const enrolling = ref(false)

/** 目标人脸（取面积最大的一张） */
const mainHit = computed<FaceHit | null>(() => {
  if (!hits.value.length) return null
  return hits.value.reduce((a, b) => (b.box.width * b.box.height > a.box.width * a.box.height ? b : a))
})

const landmarks = computed<number[][]>(() => {
  const kp = mainHit.value?.box.keypoints
  if (!Array.isArray(kp)) return []
  return kp.filter((p) => Array.isArray(p) && p.length >= 2).map((p) => [Number(p[0]), Number(p[1])])
})

const busy = computed(() => detecting.value || identifying.value || enrolling.value)

/** 命中项：把向量库返回的 score 与 metadata 组装成卡片数据 */
interface HitCard {
  id: string
  score: number
  label: string
  thumb: string
}

const cards = computed<HitCard[]>(() =>
  matches.value.map((m) => {
    const meta = (m.metadata ?? {}) as Record<string, any>
    return {
      id: String(m.id),
      score: Number(m.score ?? 0),
      label: String(meta.label ?? meta.name ?? m.id),
      thumb: typeof meta.thumb === 'string' ? meta.thumb : '',
    }
  }),
)

const visibleHits = computed(() => (activeTab.value === 'all' ? cards.value : []))

/** 画廊：当前查询图 + 命中缩略图 */
const gallery = computed(() => {
  const list: { key: string; url: string }[] = []
  if (previewUrl.value) list.push({ key: 'query', url: previewUrl.value })
  for (const c of cards.value) {
    if (c.thumb) list.push({ key: c.id, url: c.thumb })
  }
  return list
})

const blankTitle = computed(() =>
  identifying.value ? '正在比对…' : previewUrl.value ? '人脸库还是空的' : '等待上传照片',
)

const blankDesc = computed(() => {
  if (identifying.value) return '正在与已登记人脸逐一比对'
  if (!previewUrl.value) return '上传一张含人脸的照片，这里会给出最像的几张'
  return '把当前人脸加入人脸库后再点「重新识别」，即可得到相似面孔推荐'
})

/** 余弦相似度 → 百分比展示 */
function percent(score: number): number {
  const v = score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, Math.round(v)))
}

function ringOffset(score: number): number {
  return RING_C * (1 - Math.max(0, Math.min(1, score <= 1 ? score : score / 100)))
}

/** 读系统设置里的 face 分组：检测/特征模型等，只读展示 */
async function loadModels() {
  try {
    models.value = await apiService.getFaceSettings()
  } catch {
    models.value = {}
  }
}

function pickImage() {
  fileInput.value?.click()
}

function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) void loadFile(f)
  input.value = ''
}

async function loadFile(file: File) {
  revokePreview()
  previewUrl.value = URL.createObjectURL(file)
  galleryKey.value = 'query'
  pickedId.value = ''
  matches.value = []
  hits.value = []
  await runDetect(file)
}

function revokePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

/** 读图片原始尺寸，作为叠加层 viewBox */
function readNaturalSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const im = new Image()
    im.onload = () => resolve({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 })
    im.onerror = () => resolve({ w: 1, h: 1 })
    im.src = url
  })
}

async function runDetect(file: File) {
  detecting.value = true
  try {
    natural.value = await readNaturalSize(previewUrl.value)
    const res = await apiService.detectFace(file, file.name)
    hits.value = res.faces ?? []
    if (!hits.value.length) {
      ElMessage.warning('未检测到人脸，请换一张正面清晰的照片')
    }
  } catch (e: any) {
    ElMessage.error(`人脸检测失败：${e?.message ?? e}`)
  } finally {
    detecting.value = false
  }
}

/** 1:N 识别：拿当前照片与向量库比对 */
async function runIdentify() {
  if (!previewUrl.value) return
  identifying.value = true
  try {
    const blob = await (await fetch(previewUrl.value)).blob()
    const res = await apiService.identifyFace(blob, 'query.png')
    matches.value = res.hits ?? []
    pickedId.value = matches.value.length ? String(matches.value[0].id) : ''
    if (!matches.value.length) {
      ElMessage.info('人脸库为空，先点「你可能也喜欢」把当前人脸登记进去')
    }
  } catch (e: any) {
    ElMessage.error(`识别失败：${e?.message ?? e}`)
  } finally {
    identifying.value = false
  }
}

/** 裁剪脸部：用检测返回的裁剪图再识别一次，聚焦面部区域 */
async function recognizeCrop() {
  const hit = mainHit.value
  if (!hit?.faceImage) {
    ElMessage.warning('没有拿到裁剪图，请重新检测')
    return
  }
  identifying.value = true
  try {
    const bin = atob(hit.faceImage)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i)
    const res = await apiService.identifyFace(new Blob([buf], { type: 'image/jpeg' }), 'crop.jpg')
    matches.value = res.hits ?? []
    pickedId.value = matches.value.length ? String(matches.value[0].id) : ''
    ElMessage.success(matches.value.length ? `裁剪后命中 ${matches.value.length} 张` : '裁剪后未命中')
  } catch (e: any) {
    ElMessage.error(`裁剪识别失败：${e?.message ?? e}`)
  } finally {
    identifying.value = false
  }
}

/** 把当前人脸登记进向量库，并存缩略图 + 标签供推荐卡片展示 */
async function enrollCurrent() {
  if (!previewUrl.value) return
  const hit = mainHit.value
  if (!hit) {
    ElMessage.warning('请先上传含人脸的照片')
    return
  }
  enrolling.value = true
  try {
    const id = `face-${Date.now()}`
    const thumb = hit.faceImage ? `data:image/jpeg;base64,${hit.faceImage}` : previewUrl.value
    const blob = await (await fetch(previewUrl.value)).blob()
    await apiService.enrollFace(id, blob, { label: `样本 ${id.slice(-4)}`, thumb }, 'enroll.png')
    ElMessage.success('已加入人脸库，点「重新识别」查看推荐')
    await runIdentify()
  } catch (e: any) {
    ElMessage.error(`登记失败：${e?.message ?? e}`)
  } finally {
    enrolling.value = false
  }
}

onMounted(() => {
  void loadModels()
})

onBeforeUnmount(() => {
  revokePreview()
})
</script>

<style scoped>
/*
 * 全部走项目 CSS 变量体系：
 *   --color-*  结构色（亮/暗自动切换）
 *   --mp-*     圆角 / 阴影
 *   --fs-*     本页品牌色（橙 + 青），只在这里定义一次
 */
.fs-root {
  --fs-brand: #f97316;
  --fs-brand-2: #fb923c;
  --fs-accent: #06b6d4;
  --fs-accent-2: #14b8a6;

  --fs-bg: var(--color-bg);
  --fs-card: var(--color-surface);
  --fs-text: var(--color-text);
  --fs-muted: var(--color-text-gray);
  --fs-border: var(--color-surface-border);
  --fs-hover: var(--color-surface-hover);
  --fs-radius: var(--mp-radius-lg, 14px);
  --fs-radius-sm: var(--mp-radius, 11px);
  --fs-shadow: var(--mp-shadow-pop, 0 10px 30px -10px rgba(16, 24, 40, 0.22));

  height: 100%;
  overflow: hidden;
  background: var(--fs-bg);
  color: var(--fs-text);
}

:global(html.dark) .fs-root {
  --fs-brand: #fb923c;
  --fs-brand-2: #fdba74;
  --fs-accent: #22d3ee;
  --fs-accent-2: #2dd4bf;
  --fs-shadow: 0 14px 36px -10px rgba(0, 0, 0, 0.6);
}

.fs-body {
  display: flex;
  gap: 24px;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

/* ---------------- 左侧舞台 ---------------- */
.fs-stage {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.fs-stage-inner {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.fs-canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: var(--fs-radius);
  overflow: hidden;
  background: var(--fs-card);
  border: 1px solid var(--fs-border);
}

.fs-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.fs-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.fs-box {
  fill: none;
  stroke: var(--fs-accent);
  stroke-width: 4;
  stroke-dasharray: 14 10;
  filter: drop-shadow(0 0 6px var(--fs-accent));
}

.fs-kp {
  fill: #fff;
  stroke: var(--fs-accent);
  stroke-width: 3;
}

.fs-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: color-mix(in srgb, var(--fs-card) 72%, transparent);
  color: var(--fs-muted);
  font-size: 14px;
}

.is-spin {
  animation: fs-spin 0.9s linear infinite;
  color: var(--fs-accent);
}

@keyframes fs-spin {
  to { transform: rotate(360deg); }
}

.fs-found {
  position: absolute;
  top: 18px;
  right: 18px;
  padding: 12px 18px;
  border-radius: var(--fs-radius-sm);
  background: var(--fs-card);
  box-shadow: var(--fs-shadow);
  text-align: center;
}

.fs-found-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--fs-brand);
  font-size: 15px;
}

.fs-found-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--fs-accent);
}

.fs-noface {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  background: var(--fs-card);
  border: 1px solid var(--fs-border);
  color: var(--fs-muted);
  font-size: 13px;
  white-space: nowrap;
}

/* 空态 */
.fs-drop {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: var(--fs-radius);
  border: 2px dashed var(--fs-border);
  background: var(--fs-card);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.fs-drop:hover {
  border-color: var(--fs-accent);
  background: var(--fs-hover);
}

.fs-drop-icon { color: var(--fs-accent); }
.fs-drop-title { margin: 4px 0 0; font-size: 16px; font-weight: 600; }
.fs-drop-desc { margin: 0; font-size: 13px; color: var(--fs-muted); }
.fs-drop-btn { margin-top: 10px; }

/* 操作条 */
.fs-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
}

.fs-btn {
  height: 46px;
  padding: 0 30px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  color: #fff;
}

.fs-btn-ghost {
  background: var(--fs-card);
  color: var(--fs-brand);
  border: 2px solid var(--fs-brand);
}

.fs-btn-accent {
  background: linear-gradient(135deg, var(--fs-accent-2), var(--fs-accent));
}

.fs-btn-brand {
  background: linear-gradient(135deg, var(--fs-brand-2), var(--fs-brand));
}

.fs-btn:disabled { opacity: 0.5; }

/* ---------------- 右侧面板 ---------------- */
.fs-panel {
  width: 400px;
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  box-sizing: border-box;
  border-radius: var(--fs-radius);
  background: var(--fs-card);
  border: 1px solid var(--fs-border);
  box-shadow: var(--fs-shadow);
  overflow-y: auto;
}

.fs-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fs-panel-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}

.fs-dots { display: flex; gap: 4px; }
.fs-dots i {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--fs-accent);
}

/* 页签 */
.fs-tabs {
  display: flex;
  gap: 6px;
  padding: 5px;
  border-radius: 999px;
  background: var(--fs-hover);
}

.fs-tab {
  flex: 1 1 0;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--fs-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}

.fs-tab.is-active {
  background: var(--fs-card);
  color: var(--fs-brand);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.fs-tab.is-off { opacity: 0.45; cursor: not-allowed; }

/* 结果网格 */
.fs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.fs-card {
  padding: 10px;
  border-radius: var(--fs-radius-sm);
  border: 1px solid var(--fs-border);
  background: var(--fs-card);
  cursor: pointer;
  transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s;
}

.fs-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--fs-shadow);
}

.fs-card.is-picked { border-color: var(--fs-brand); }

.fs-card-face {
  position: relative;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  background: var(--fs-hover);
}

.fs-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.fs-card-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; color: var(--fs-muted);
}

/* 相似度环 */
.fs-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  pointer-events: none;
}

.fs-ring-track {
  fill: none;
  stroke: color-mix(in srgb, var(--fs-brand) 22%, transparent);
  stroke-width: 7;
}

.fs-ring-bar {
  fill: none;
  stroke: var(--fs-brand);
  stroke-width: 7;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.fs-check {
  position: absolute;
  top: 6px; right: 6px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--fs-brand);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}

.fs-card-cap {
  margin: 8px 0 2px;
  text-align: center;
  font-size: 12px;
  color: var(--fs-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fs-card-score { color: var(--fs-brand); font-size: 13px; }
.fs-card-sep { margin: 0 4px; }

/* 空态 */
.fs-blank {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 12px;
  text-align: center;
}

.fs-blank-icon { color: var(--fs-border); }
.fs-blank-title { margin: 4px 0 0; font-weight: 600; }
.fs-blank-desc { margin: 0; font-size: 12px; color: var(--fs-muted); line-height: 1.7; }

/* 画廊 */
.fs-gallery {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.fs-thumb {
  width: 52px; height: 52px;
  flex: 0 0 52px;
  padding: 0;
  border-radius: var(--fs-radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  background: var(--fs-hover);
  cursor: pointer;
}

.fs-thumb.is-active { border-color: var(--fs-brand); }
.fs-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* 主行动 */
.fs-cta {
  height: 50px;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--fs-accent-2), var(--fs-accent));
}

.fs-cta:disabled { opacity: 0.5; }

/* 模型说明 */
.fs-model {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--fs-muted);
}

.fs-model b { color: var(--fs-accent); font-weight: 600; }
.fs-dot { opacity: 0.5; }

.fs-hidden { display: none; }
</style>
