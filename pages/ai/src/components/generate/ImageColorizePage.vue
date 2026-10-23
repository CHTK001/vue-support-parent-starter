<template>
  <div class="cz-root">
    <div class="cz-body">
      <!-- ==================== 左：图片舞台 ==================== -->
      <section class="cz-stage">
        <div class="cz-stage-inner">
          <!-- 未配置模型：与人脸识别同口径，先引导去配置 -->
          <div v-if="!modelReady" class="cz-drop">
            <el-icon :size="46" class="cz-drop-icon is-warn"><WarningFilled /></el-icon>
            <p class="cz-drop-title">图像上色未启用</p>
            <p class="cz-drop-desc">
              请到「系统设置 → 模型配置 → 默认模型 → 图片识别」配置上色模型，保存后立即生效
            </p>
            <ReButton type="primary" @click="goConfig">去配置模型</ReButton>
          </div>

          <!-- 空态：引导上传 -->
          <div v-else-if="!imageLoaded" class="cz-drop" @click="pickFile" @dragover.prevent @drop.prevent="onDrop">
            <el-icon :size="46" class="cz-drop-icon"><Picture /></el-icon>
            <p class="cz-drop-title">上传一张图片，开始上色</p>
            <p class="cz-drop-desc">点击选择图片，或把图片拖到这里 · 建议灰度图或线稿效果更佳</p>
            <ReButton type="primary" :disabled="generating" @click.stop="pickFile">
              <el-icon><FolderOpened /></el-icon>选择图片
            </ReButton>
          </div>

          <!-- 图片舞台：有结果 → 拖拽对比；否则原图预览 -->
          <div v-else class="cz-canvas">
            <!-- 拖拽对比（默认）：原图 ⇄ 上色，与人脸识别页同一套视觉语言 -->
            <div v-if="resultUrl && compareMode" class="cz-compare" :style="{ '--cz-aspect': compareAspect }">
              <ReImageCompare
                :left-image="originalUrl"
                :right-image="resultUrl"
                left-label="原图"
                right-label="上色"
                :default-slider-handle="50"
              />
            </div>
            <!-- 单图模式 -->
            <img v-else-if="resultUrl" :src="resultUrl" class="cz-img" alt="上色结果" />
            <img v-else :src="originalUrl" class="cz-img" alt="原图" />

            <!-- 处理中遮罩：统一走 ReLoader（默认加载动画） -->
            <div v-if="generating" class="cz-mask">
              <ReLoader loading size="lg" :fullscreen="false" />
              <span class="cz-mask-text">正在上色…</span>
            </div>

            <!-- 失败提示 -->
            <div v-if="resultError && !generating" class="cz-error">
              <el-icon><Warning /></el-icon>
              <span>{{ resultError }}</span>
            </div>
          </div>
        </div>

        <!-- 操作条：只留「主行动（上色）+ 结果产出（下载）」。
             切换对比 / 更换图片 / 清空 移到右缘悬浮工具条 —— 四个按钮平铺时
             主次不分，用户每次都要在一排里找哪个是「开始上色」。 -->
        <div v-if="imageLoaded" class="cz-actions">
          <ReButton class="cz-btn cz-btn-accent" type="primary" :disabled="generating || !imageLoaded" @click="colorizeImage">
            <el-icon v-if="!generating"><Refresh /></el-icon>
            <el-icon v-else class="is-spin"><Loading /></el-icon>
            {{ generating ? '上色中…' : (resultUrl ? '重新上色' : '开始上色') }}
          </ReButton>
          <ReButton class="cz-btn cz-btn-brand" type="success" :disabled="!resultUrl || generating" @click="download">
            <el-icon><Download /></el-icon>下载彩色图
          </ReButton>
        </div>
      </section>

      <!-- ==================== 右：结果面板 ==================== -->
      <aside class="cz-panel">
        <header class="cz-panel-head">
          <h2 class="cz-panel-title">上色结果</h2>
          <span class="cz-dots"><i v-for="n in 5" :key="n" /></span>
        </header>

        <!-- 状态卡 -->
        <div class="cz-stat">
          <div class="cz-stat-row">
            <span class="cz-stat-k">状态</span>
            <span class="cz-stat-v" :class="statusClass">{{ statusText }}</span>
          </div>
          <div class="cz-stat-row">
            <span class="cz-stat-k">耗时</span>
            <span class="cz-stat-v">{{ elapsedMs != null ? elapsedMs + ' ms' : '—' }}</span>
          </div>
          <div class="cz-stat-row">
            <span class="cz-stat-k">尺寸</span>
            <span class="cz-stat-v">{{ resultSize || '—' }}</span>
          </div>
        </div>

        <!-- 原图 / 结果缩略对照（无人脸识别页的「相似面孔」网格，这里给两图并排缩略） -->
        <div v-if="resultUrl" class="cz-thumbs">
          <figure class="cz-thumb">
            <img :src="originalUrl" alt="原图缩略" />
            <figcaption>原图</figcaption>
          </figure>
          <figure class="cz-thumb is-accent">
            <img :src="resultUrl" alt="上色缩略" />
            <figcaption>上色</figcaption>
          </figure>
        </div>

        <!-- 空态 -->
        <div v-else class="cz-blank">
          <el-icon :size="34" class="cz-blank-icon"><Picture /></el-icon>
          <p class="cz-blank-title">{{ imageLoaded ? '等待上色' : '还没有图片' }}</p>
          <p class="cz-blank-desc">
            {{ imageLoaded ? '点「开始上色」调用后端模型生成彩色图' : '上传图片后即可调用后端上色模型' }}
          </p>
        </div>

        <!-- 当前模型（只读，取自系统设置；未配置时明确显示「未配置」） -->
        <p class="cz-model">
          <el-icon><Setting /></el-icon>
          <span>上色模型 <b>{{ modelConfig.colorizeModel || '未配置' }}</b></span>
        </p>
      </aside>

      <!-- ==================== 右缘悬浮工具条 ====================
           与人脸识别页同一套交互语言：贴舞台右缘竖排图标钮，
           开关类按钮用 is-on 高亮，动作类按钮常态与开关一致、悬停转危险色。
           工具栏始终渲染（上传/更换图片常驻可直接选图），清空在空态置灰。 -->
      <div class="cz-rail">
        <button
          v-for="tool in railItems"
          :key="tool.key"
          class="cz-rail-btn"
          :class="[{ 'is-on': tool.active() }, tool.cls || '']"
          :title="tool.title"
          :aria-label="tool.title"
          :disabled="tool.disabled ? tool.disabled() : false"
          @click="tool.toggle"
        >
          <el-icon :size="18"><component :is="tool.icon" /></el-icon>
        </button>
      </div>
    </div>

    <!-- 隐藏的文件选择器：必须常驻 DOM。放在「未上传」分支里会导致上传后 ref 变 null，
         「更换图片」点下去没有任何反应。 -->
    <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Picture, FolderOpened, Download, Refresh, Setting, Switch, Loading, Warning, Delete,
} from '@element-plus/icons-vue'
import { WarningFilled } from '@element-plus/icons-vue'
import ReButton from '@/components/re/ReButton.vue'
import ReImageCompare from '@repo/ui/re-image-compare'
import ReLoader from '@repo/ui/re-loader'
import { apiService } from '@/services/ApiService'
import { useModelConfigStore } from '@/stores/modelConfig'
import { message } from '@repo/core'

/**
 * 图像上色。
 *
 * <p>布局与 {@code FaceSearchPage} 一致：左侧图片舞台（空态 / 原图 / 拖拽对比 / 处理中遮罩），
 * 右侧结果面板（状态、缩略对照、当前模型）。模型来自 {@code image} 分组的
 * {@code colorize_model}（系统设置 → 模型配置 → 默认模型 → 图片识别）。</p>
 */
const router = useRouter()
const modelConfig = useModelConfigStore()
const modelReady = computed(() => modelConfig.colorizeReady)

const fileInput = ref<HTMLInputElement | null>(null)
const imageLoaded = ref(false)
const generating = ref(false)
const resultError = ref('')
/** true = 原图/上色拖拽对比，false = 只看结果图 */
const compareMode = ref(true)
/** 原图宽高比，用于对比容器定比例（避免 contain 留白让滑块偏离图像中线） */
const compareAspect = ref(4 / 3)
/** 上次上色耗时（毫秒） */
const elapsedMs = ref<number | null>(null)
/** 结果图尺寸文案 */
const resultSize = ref('')

let sourceFile: File | null = null
let originalObjectUrl = ''
let resultObjectUrl = ''

const originalUrl = ref('')
const resultUrl = ref('')

/** 状态文案 */
const statusText = computed(() => {
  if (generating.value) return '处理中'
  if (resultError.value) return '失败'
  if (resultUrl.value) return '已完成'
  return imageLoaded.value ? '待上色' : '空闲'
})

/** 状态色 */
const statusClass = computed(() => {
  if (generating.value) return 'is-busy'
  if (resultError.value) return 'is-error'
  if (resultUrl.value) return 'is-ok'
  return ''
})

onMounted(async () => {
  // 强制刷新合并视图：上色模型可能在设置中心刚改过，缓存会误判成「未配置」
  try {
    await modelConfig.refresh()
  } catch {
    // 读取失败按未配置处理，页面会给出「去配置模型」提示
  }
})

onBeforeUnmount(() => {
  revokeUrls()
})

function revokeUrls() {
  if (originalObjectUrl) URL.revokeObjectURL(originalObjectUrl)
  if (resultObjectUrl) URL.revokeObjectURL(resultObjectUrl)
  originalObjectUrl = ''
  resultObjectUrl = ''
}

function revokeResultUrl() {
  if (resultObjectUrl) URL.revokeObjectURL(resultObjectUrl)
  resultObjectUrl = ''
}

function goConfig() {
  router.push('/setting/default-models')
}

/**
 * 判断所选文件是否为图片。
 *
 * <p>不能只看 {@code file.type}：部分来源（无扩展名、系统未登记 MIME）会给空 type，
 * 此时按扩展名兜底，避免「选了图却提示不是图片」。</p>
 *
 * @param file 用户选择的文件
 * @returns 是否按图片处理
 */
function isImageFile(file: File) {
  if (file.type) {
    return file.type.startsWith('image/')
  }
  return /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(file.name || '')
}

/**
 * 读出图片宽高比写入 compareAspect（失败保持兜底比例，不影响上色）。
 *
 * @param url 图片地址（blob URL）
 */
function syncCompareAspect(url: string) {
  if (!url) return
  const probe = new Image()
  probe.onload = () => {
    if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
      compareAspect.value = probe.naturalWidth / probe.naturalHeight
    }
  }
  probe.src = url
}

function loadImageFromFile(file: File) {
  if (!isImageFile(file)) {
    message.warning('请选择图片文件')
    return
  }
  revokeUrls()
  sourceFile = file
  originalObjectUrl = URL.createObjectURL(file)
  originalUrl.value = originalObjectUrl
  resultUrl.value = ''
  resultError.value = ''
  elapsedMs.value = null
  resultSize.value = ''
  imageLoaded.value = true
  syncCompareAspect(originalObjectUrl)
  void colorizeImage()
}

async function colorizeImage() {
  if (!sourceFile || !modelReady.value || generating.value) return
  generating.value = true
  resultError.value = ''
  const started = Date.now()
  try {
    const blob = await apiService.colorizeImage(sourceFile, sourceFile.name || 'colorize.png')
    elapsedMs.value = Date.now() - started
    if (!blob) {
      resultError.value = modelReady.value
        ? '上色失败，请检查模型是否可用后重试'
        : '图像上色模型未配置，请先到「系统设置 → 模型配置 → 默认模型 → 图片识别」配置上色模型'
      return
    }
    revokeResultUrl()
    resultObjectUrl = URL.createObjectURL(blob)
    resultUrl.value = resultObjectUrl
    // 结果尺寸：从 blob URL 读一次（不阻塞渲染）
    const probe = new Image()
    probe.onload = () => {
      resultSize.value = `${probe.naturalWidth} × ${probe.naturalHeight}`
    }
    probe.src = resultObjectUrl
  } finally {
    generating.value = false
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) loadImageFromFile(file)
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) loadImageFromFile(file)
}

function pickFile() {
  fileInput.value?.click()
}

function download() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `colorized-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  message.success('已开始下载上色图片')
}

/**
 * 清空当前工作区：图片、结果、耗时、尺寸全部归零，回到初始空态。
 *
 * <p>必须同时回收两个 blob URL —— 只把 {@code originalUrl/resultUrl} 置空
 * 会漏掉 {@code URL.revokeObjectURL}，反复「清空 → 再上传」会持续占用内存
 * （上色结果动辄数百 KB 到数 MB）。</p>
 */
function clearWorkspace() {
  revokeUrls()
  sourceFile = null
  originalUrl.value = ''
  resultUrl.value = ''
  resultError.value = ''
  elapsedMs.value = null
  resultSize.value = ''
  imageLoaded.value = false
  compareMode.value = true
  compareAspect.value = 4 / 3
}

/** 右缘悬浮工具条的一项 */
interface RailTool {
  key: string
  title: string
  icon: any
  active: () => boolean
  toggle: () => void
  /** 返回 false 时该按钮**不渲染**（如没有结果就没有「下载」） */
  visible?: () => boolean
  /** 返回 true 时该按钮置灰（常驻但当前不可用，如空态的清空） */
  disabled?: () => boolean
  /** 附加样式类（如清空按钮的 is-danger 危险色悬停） */
  cls?: string
}

/**
 * 右缘悬浮工具条：从底部操作条挪过来的次要操作。
 *
 * <p>保留在操作条里的只有「开始上色」与「下载彩色图」两个主路径动作；
 * 切换对比、更换图片、清空属于随时可用的工具，竖排贴在舞台右缘不占版面。</p>
 */
const RAIL: RailTool[] = [
  {
    key: 'compare',
    title: '切换 拖拽对比 / 单图查看',
    icon: Switch,
    // 仅在已有结果时才有意义：没有彩色图就无从对比
    visible: () => !!resultUrl.value,
    active: () => compareMode.value,
    toggle: () => {
      compareMode.value = !compareMode.value
    },
  },
  {
    key: 'change',
    title: '选择/更换上传图片',
    icon: FolderOpened,
    active: () => false,
    // 常驻：空态也能直接从这里选图，不再隐藏整条工具栏
    disabled: () => generating.value,
    toggle: () => pickFile(),
  },
  {
    key: 'download',
    title: '下载彩色图',
    icon: Download,
    active: () => false,
    visible: () => !!resultUrl.value,
    toggle: () => download(),
  },
  {
    key: 'clear',
    title: '清空当前图片与结果',
    icon: Delete,
    active: () => false,
    // 常驻：空态置灰而不是隐藏，保证工具条三件套（上传/清空/对比）始终在同一位置
    disabled: () => !imageLoaded.value,
    toggle: () => clearWorkspace(),
    // 危险动作：悬停给红色，避免与旁边几个"开关"混淆
    cls: 'is-danger',
  },
]

/** 工具条按当前状态过滤（无色图时隐藏对比/下载，无图时隐藏清空） */
const railItems = computed(() => RAIL.filter((t) => (t.visible ? t.visible() : true)))
</script>

<style scoped>
/* ============ 骨架：左舞台 + 右面板，与人脸识别页同构 ============ */
.cz-root {
  height: 100%;
  padding: 18px;
  box-sizing: border-box;
  background: var(--el-bg-color, #fff);
}

.cz-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  height: 100%;
  min-height: 0;
  /* 右缘悬浮工具条相对本容器绝对定位（贴面板左侧、压在舞台右缘之上） */
  position: relative;
}

@media (max-width: 900px) {
  .cz-body { grid-template-columns: 1fr; }
}

/* ============ 左：舞台 ============ */
.cz-stage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}

.cz-stage-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: var(--el-radius-lg, 12px);
  border: 2px dashed var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: hidden;
}

/* 空态 / 未配置 */
.cz-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 28px;
  text-align: center;
  cursor: pointer;
}

.cz-drop-icon { color: var(--el-color-primary); }
.cz-drop-icon.is-warn { color: var(--el-color-warning); }
.cz-drop-title { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); margin: 4px 0 0; }
.cz-drop-desc { font-size: 13px; color: var(--el-text-color-secondary); margin: 0 0 8px; max-width: 420px; line-height: 20px; }

/* 画布 */
.cz-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.cz-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--el-radius-md, 8px);
}

/* 拖拽对比：宽度按图片比例收缩，让滑块落在图像中线 */
.cz-compare {
  height: 100%;
  max-height: 100%;
  width: min(100%, calc((100vh - 260px) * var(--cz-aspect, 1.3333)));
  max-width: 100%;
  margin-inline: auto;
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
}

.cz-compare :deep(.re-image-compare) {
  height: 100%;
  padding: 0;
  background: transparent;
}

.cz-compare :deep(.vci--container) {
  height: 100% !important;
}

/* 处理中遮罩：盖在图片上，深色半透明保证白字可读 */
.cz-mask {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: var(--el-radius-md, 8px);
  background: rgba(0, 0, 0, 0.55);
}

.cz-mask-text { font-size: 14px; color: var(--el-color-white, #fff); }

/* 失败提示 */
.cz-error {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  max-width: 90%;
}

/* 操作条 */
.cz-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.cz-btn { display: inline-flex; align-items: center; gap: 6px; }
.cz-btn-accent { min-width: 120px; }
.cz-btn-brand { margin-left: auto; }

.is-spin { animation: cz-spin 0.9s linear infinite; }
@keyframes cz-spin { to { transform: rotate(360deg); } }

/* ============ 右缘悬浮工具条（与人脸识别页同构） ============
   定位口径：面板宽 320px，工具条贴其左侧再留 4px 间隙，
   于是它压在舞台右缘之上、不碰面板 —— 与人脸识别页 .fs-rail 同一做法。 */
.cz-rail {
  position: absolute;
  right: calc(320px + 4px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 5;
}

.cz-rail-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}

.cz-rail-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.cz-rail-btn:hover { transform: translateY(-1px); }

.cz-rail-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 开启态（如拖拽对比生效中）用主色填充，一眼看出当前处于哪种查看方式 */
.cz-rail-btn.is-on {
  color: var(--el-color-white);
  border-color: transparent;
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

/* 清空是「动作」不是「开关」：常态与开关一致，只在悬停时转危险色 */
.cz-rail-btn.is-danger:hover {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 45%, transparent);
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--el-bg-color));
}

/* 窄屏退化为单列：工具条改横向贴在舞台右上角，避免压住图片 */
@media (max-width: 900px) {
  .cz-rail {
    right: 24px;
    top: 24px;
    transform: none;
    flex-direction: row;
  }
}

/* ============ 右：面板 ============ */
.cz-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow-y: auto;
}

.cz-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cz-panel-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 装饰点：与人脸识别页的 .fs-dots 同一视觉 */
.cz-dots { display: inline-flex; gap: 3px; }
.cz-dots i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--el-color-primary-light-5);
}

/* 状态卡 */
.cz-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
}

.cz-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.cz-stat-k { color: var(--el-text-color-secondary); }
.cz-stat-v { color: var(--el-text-color-primary); font-weight: 600; }
.cz-stat-v.is-ok { color: var(--el-color-success); }
.cz-stat-v.is-error { color: var(--el-color-danger); }
.cz-stat-v.is-busy { color: var(--el-color-primary); }

/* 缩略对照 */
.cz-thumbs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cz-thumb {
  margin: 0;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}

.cz-thumb.is-accent { border-color: var(--el-color-success-light-5); }

.cz-thumb img {
  display: block;
  width: 100%;
  height: 110px;
  object-fit: cover;
}

.cz-thumb figcaption {
  padding: 6px 0;
  text-align: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 空态 */
.cz-blank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 26px 12px;
  text-align: center;
}

.cz-blank-icon { color: var(--el-text-color-placeholder); }
.cz-blank-title { margin: 4px 0 0; font-size: 13px; font-weight: 600; color: var(--el-text-color-regular); }
.cz-blank-desc { margin: 0; font-size: 12px; color: var(--el-text-color-secondary); line-height: 18px; }

/* 当前模型 */
.cz-model {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: auto 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cz-model b { color: var(--el-text-color-regular); font-weight: 600; }

/* 尊重系统「减少动态效果」。
   注意 .is-spin（「上色中…」按钮上的转圈）**不在这里停** ——
   停掉之后按钮看着像卡死，用户会重复点击；改为放慢转速，保留"在转"的反馈。 */
@media (prefers-reduced-motion: reduce) {
  .is-spin { animation-duration: 1.8s; }
  .cz-rail-btn:hover { transform: none; }
  .cz-rail-btn { transition: none; }
}
</style>

