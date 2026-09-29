<template>
  <div class="is-root">
    <!-- ============ 顶栏：品牌 / 上传入口 / 状态 ============ -->
    <header class="is-topbar">
      <div class="is-brand">
        <span class="is-brand-logo"><el-icon><Camera /></el-icon></span>
        <span class="is-brand-title">拍照搜同款</span>
      </div>

      <div class="is-searchbox">
        <span class="is-searchbox-tip">选一张图，检索底库中最相似的图片</span>
        <button class="is-upload-btn" :disabled="busy" @click="pickImage">
          <el-icon><Upload /></el-icon>上传图片
        </button>
      </div>

      <div class="is-topbar-right">
        <span class="is-badge" :class="available ? 'is-ok' : 'is-off'">
          {{ available ? '以图搜图已启用' : '未配置特征模型' }}
        </span>
      </div>
    </header>

    <div class="is-body" :class="{ 'is-focused': resultFocused }">
      <!-- ============ 左：查询图画布 ============ -->
      <section class="is-stage">
        <div class="is-stage-inner" :class="{ 'is-drag': dragging }" @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
          <!-- 空态 -->
          <div v-if="!previewUrl" class="is-drop" @click="pickImage">
            <el-icon :size="46" class="is-drop-icon"><Picture /></el-icon>
            <p class="is-drop-title">拖拽图片到此处即可搜索</p>
            <p class="is-drop-desc">或点击选择图片，支持 PNG / JPG</p>
            <el-button type="primary" class="is-drop-btn" @click.stop="pickImage">
              <el-icon><FolderOpened /></el-icon>选择图片
            </el-button>
          </div>

          <!-- 预览 + 检索态 -->
          <div v-else ref="queryCanvasRef" class="is-canvas" :class="{ 'is-busy': searching }">
            <img :src="previewUrl" class="is-img" alt="查询图" />
            <div v-if="searching" class="is-scan"></div>

            <!-- 左上：完成态胶囊 -->
            <div v-if="!searching" class="is-found-tag">
              <el-icon><CircleCheckFilled /></el-icon>{{ searched ? '检索完成' : '待检索' }}
            </div>

            <!-- 右上：相似度卡（主色左边条） -->
            <div v-if="!searching && scoreStats" class="is-score-card">
              <p class="is-score-card-label">最高相似度</p>
              <p class="is-score-card-value">{{ (scoreStats.top * 100).toFixed(0) }}<i>%</i></p>
            </div>

            <!-- 取景框四角 + 引线标注卡：仅在左栏够宽时出现，
                 收窄成参考栏后再显示会压在图上（见样式里的 :not(.is-focused)） -->
            <div v-if="!searching" class="is-figure">
              <span class="is-corner is-tl"></span>
              <span class="is-corner is-tr"></span>
              <span class="is-corner is-bl"></span>
              <span class="is-corner is-br"></span>
              <div class="is-callouts">
                <div class="is-callout is-callout-l">
                  <p class="is-callout-title">特征模型</p>
                  <p class="is-callout-text">{{ activeModel || '未加载' }}</p>
                </div>
                <div class="is-callout is-callout-r">
                  <p class="is-callout-title">图像信息</p>
                  <p class="is-callout-text">
                    {{ queryMeta ? `${queryMeta.width}×${queryMeta.height} · ${formatSize(queryMeta.size)}` : '—' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 左下：操作卡（竖排按钮） -->
            <div v-if="!searching" class="is-actcard">
              <button class="is-actcard-btn" :disabled="busy" @click="pickImage">
                <el-icon><Upload /></el-icon>上传图片
              </button>
              <button class="is-actcard-btn is-primary" :disabled="busy" @click="pasteFromClipboard">
                <el-icon><Link /></el-icon>粘贴图片
              </button>
              <button class="is-actcard-btn" :disabled="busy || !previewFile" @click="indexCurrent">
                <el-icon><Plus /></el-icon>加入图像底库
              </button>
            </div>

            <!-- 右下：特征摘要（相似度分桶分布） -->
            <div v-if="!searching && scoreStats" class="is-sumcard">
              <p class="is-sumcard-title">
                特征摘要
                <span class="is-sumcard-sub">命中 {{ scoreStats.count }} 张</span>
              </p>
              <div class="is-bars">
                <div v-for="b in scoreBuckets" :key="b.label" class="is-bar-col">
                  <span class="is-bar-num">{{ b.n }}</span>
                  <span class="is-bar" :style="{ height: Math.max(4, b.pct * 0.42) + 'px' }"></span>
                  <span class="is-bar-label">{{ b.label }}</span>
                </div>
              </div>
            </div>

            <div v-if="searching" class="is-mask">
              <el-icon :size="26" class="is-spin"><Loading /></el-icon>
              <span>正在提取特征并检索…</span>
            </div>

            <div v-if="!searching && searched" class="is-result-tip">
              为你找到 <b>{{ results.length }}</b> 张相似图片
              <span v-if="elapsedMs != null" class="is-result-cost">耗时 {{ elapsedMs }} ms</span>
            </div>
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/png,image/jpeg" class="is-hidden" @change="onFilePicked" />
      </section>

      <!-- ============ 右：结果面板 ============ -->
      <aside class="is-side">
        <div class="is-tabs">
          <button class="is-tab active">相似图片</button>
          <el-icon class="is-tabs-arrow"><ArrowDown /></el-icon>
        </div>

        <!-- 未启用提示 -->
        <div v-if="!available" class="is-hint">
          <el-icon><Warning /></el-icon>
          <div>
            <p class="is-hint-title">以图搜图未启用</p>
            <p class="is-hint-desc">
              请到「系统设置 → 默认模型」配置特征模型（如 resnet50-feature / clip-image-feature / cn-clip-rn50-image），保存后立即生效。
            </p>
          </div>
        </div>

        <template v-else>
          <div class="is-chips">
            <button v-for="c in scoreFilters" :key="c.value" class="is-chip"
              :class="{ active: minScore === c.value }" @click="minScore = c.value">
              {{ c.label }}
            </button>
          </div>

          <div v-loading="searching" ref="resultGridRef" class="is-grid">
            <article v-for="(item, i) in filteredResults" :key="item.vectorId || i" class="is-card">
              <div class="is-card-media">
                <img :src="resolveThumb(item)" :alt="item.name" />
                <!-- 左上圆形徽标：直接承载相似度，是判读结果的第一眼信息 -->
                <span v-if="item.score != null" class="is-card-rank">
                  {{ (item.score * 100).toFixed(0) }}<i>%</i>
                </span>
              </div>
              <div class="is-card-body">
                <p class="is-card-name">{{ item.name || '未命名' }}<span class="is-card-tagname">匹配度</span></p>
                <p class="is-card-meta">
                  <span class="is-card-dim">{{ formatDims(item) }}</span>
                  <span v-for="tag in (item.tags || []).slice(0, 1)" :key="tag" class="is-card-tag">{{ tag }}</span>
                </p>
              </div>
            </article>

            <!--
              空态与有结果时**保持同一版面**：占位尺寸、外层容器、底部统计条都不变，
              只把内容换成提示。否则「有结果」与「没结果」两种情况下页面高度、
              滚动位置、面板宽度都会跳，看起来像换了个页面。
            -->
            <div v-if="!searching && filteredResults.length === 0" class="is-empty">
              <el-icon :size="34"><Picture /></el-icon>
              <p class="is-empty-title">
                {{ searched ? '底库里没有相似图片' : '选一张图开始搜索' }}
              </p>
              <p class="is-empty-desc">
                {{ searched
                  ? '可由管理员到「系统设置 → 图像底库」补充底图，或放宽上方相似度筛选'
                  : '支持拖拽、点击选择与粘贴，检索结果会显示在这里' }}
              </p>
            </div>
          </div>
        </template>

        <!-- ============ 底部统计条 ============ -->
        <!--
          无结果时也要渲染，只是各项显示「—」：
          这是「没数据也和有结果一致」的关键 —— 统计条若整块消失，
          侧栏高度会突然缩短，下方内容跟着上移，视觉上像两个页面。
        -->
        <div v-if="available" class="is-footbar">
          <span class="is-footbar-title">检索统计</span>
          <div class="is-footbar-items">
            <span class="is-footbar-item">命中：{{ scoreStats ? scoreStats.count : '—' }}</span>
            <span class="is-footbar-item">最高：{{ scoreStats ? `${(scoreStats.top * 100).toFixed(0)}%` : '—' }}</span>
            <span class="is-footbar-item">均值：{{ scoreStats ? `${(scoreStats.avg * 100).toFixed(0)}%` : '—' }}</span>
            <span class="is-footbar-item is-footbar-cost">
              耗时：{{ elapsedMs == null ? '—' : `${elapsedMs} ms` }}
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
// 图标按实际使用裁剪：Search/Clock/Delete 随图像底库迁往系统设置后已无用，
// 留着会让人以为本页还有搜索框与删除入口
import {
  Camera, Upload, Picture, FolderOpened, Link,
  Plus, Warning, Loading, ArrowDown, CircleCheckFilled,
} from '@element-plus/icons-vue'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import { apiService } from '@/services/ApiService'
import { resolveImageUrl } from '@/utils/imageSearchUrl'
import { usePopup } from '@/composables/usePopup'

/**
 * 以图搜图页面
 *
 * <p>复用后端默认图像特征管线（image.feature_model 配置的特征模型）：
 * 选图后自动提特征检索底库；也可把图「加入图像底库」建索引。
 * 上传前统一经 canvas 转 PNG —— 后端图像解码走 OpenCV，不支持 webp，
 * 同时顺带把超大图压到合理边长，避免无谓的特征计算开销。</p>
 *
 * <p>画布上的标注卡、相似度分桶图、底部统计条一律取自**真实计算结果**
 * （`queryMeta` / `scoreStats` / `scoreBuckets`），不填任何占位或编造值 ——
 * 界面上出现一个数字，用户就会当它是后端给的。</p>
 */

interface ImageItem {
  id?: number
  vectorId?: string
  name?: string
  tags?: string[]
  thumbnail?: string | null
  url?: string | null
  score?: number | null
  width?: number
  height?: number
}

const MAX_UPLOAD_EDGE = 1600

const { toast, confirm } = usePopup()

const fileInput = ref<HTMLInputElement | null>(null)
/** 查询图画布容器：viewerjs 挂在这里，点查询图可放大查看细节 */
const queryCanvasRef = ref<HTMLElement | null>(null)
/** 结果网格容器：viewerjs 挂在这里，结果图可放大并左右切换 */
const resultGridRef = ref<HTMLElement | null>(null)
const previewUrl = ref('')
const previewFile = ref<File | null>(null)
/** 查询图自身的元信息，画布标注卡要显示，必须来自真实解码结果 */
const queryMeta = ref<{ width: number; height: number; size: number } | null>(null)
const dragging = ref(false)
const searching = ref(false)
const busy = ref(false)
const searched = ref(false)

const available = ref(false)
const activeModel = ref('')
const results = ref<ImageItem[]>([])
const minScore = ref(0)
/**
 * 上次检索的端到端耗时（毫秒）。
 *
 * <p>{@code null} 表示本次会话尚未检索过 —— 显示为「—」而不是 0，
 * 0 会被读成「瞬间完成」。</p>
 */
const elapsedMs = ref<number | null>(null)

const scoreFilters = [
  { label: '全部', value: 0 },
  { label: '相似度 ≥ 90%', value: 0.9 },
  { label: '相似度 ≥ 80%', value: 0.8 },
]

const filteredResults = computed(() =>
  results.value.filter((item) => (item.score ?? 1) >= minScore.value),
)

/**
 * 是否已进入「结果优先」版面。
 *
 * <p>检索命中后版面重心应交给结果：查询图退为左侧参考栏，结果区吃掉剩余宽度。
 * 若不加这个状态，左侧 `.is-stage` 的 `flex: 1` 会一直占满，结果被压在固定的
 * 340px 窄栏里，出现「输入占主导、结果不突出」的重点错位。</p>
 */
const resultFocused = computed(() => searched.value && filteredResults.value.length > 0)

/** 只统计真正带分数的结果，避免把无分数的项算进均值 */
const scoredResults = computed(() =>
  results.value
    .map((item) => item.score)
    .filter((v): v is number => typeof v === 'number'),
)

/** 相似度统计：右上相似度卡与底部统计条共用 */
const scoreStats = computed(() => {
  const arr = scoredResults.value
  if (!arr.length) { return null; }
  return {
    top: Math.max(...arr),
    avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    count: arr.length,
  }
})

/**
 * 相似度分桶分布，供右下「特征摘要」图使用。
 * pct 以最大桶为基准归一（最高桶 100%），便于用纯 CSS 画柱子。
 */
const scoreBuckets = computed(() => {
  const arr = scoredResults.value
  const buckets = [
    { label: '≥90%', n: arr.filter((v) => v >= 0.9).length },
    { label: '8-9', n: arr.filter((v) => v >= 0.8 && v < 0.9).length },
    { label: '7-8', n: arr.filter((v) => v >= 0.7 && v < 0.8).length },
    { label: '<7', n: arr.filter((v) => v < 0.7).length },
  ]
  const max = Math.max(1, ...buckets.map((b) => b.n))
  return buckets.map((b) => ({ ...b, pct: Math.round((b.n / max) * 100) }))
})

/**
 * 缩略图 / 原图地址。
 *
 * <p>统一走 {@link resolveImageUrl}：原先这里直接 `return item.url`，漏了
 * baseURL（/v2）与令牌，浏览器把 `/image-search/9/image` 解析到前端自身
 * 且 vite 不代理该路径，搜出来的图整片 404。与底库面板共用一份实现，
 * 避免再次各写一份而漂移。</p>
 */
function resolveThumb(item: ImageItem): string {
  return resolveImageUrl(item)
}

/**
 * 放大查看：查询图与结果图都用 viewerjs。
 *
 * <p>不再自己写弹层查看器：viewerjs 直接给到滚轮缩放、拖拽平移、
 * 结果图左右切换与缩略导航，且它只接管容器内的 img，不会干扰卡片上的
 * 其它交互元素。</p>
 *
 * <p>实例在容器重建（查询图/结果变化）后需要重建或 update，否则它内部
 * 缓存的图片列表仍是旧的 —— 表现是「点新图没反应」或「切到已删的图」。</p>
 */
let queryViewer: Viewer | null = null
let resultViewer: Viewer | null = null

/** 查询图查看器：单图，工具栏保留缩放/1:1 */
function syncQueryViewer() {
  if (!previewUrl.value || !queryCanvasRef.value) {
    queryViewer?.destroy()
    queryViewer = null
    return
  }
  if (queryViewer) {
    queryViewer.update()
    return
  }
  queryViewer = new Viewer(queryCanvasRef.value, {
    navbar: false,
    title: () => '查询图',
    filter: (image: HTMLImageElement) => image.classList.contains('is-img'),
  })
}

/** 结果图查看器：多图连播，带缩略导航便于逐张比对 */
function syncResultViewer() {
  if (!resultGridRef.value) {
    resultViewer?.destroy()
    resultViewer = null
    return
  }
  if (resultViewer) {
    resultViewer.update()
    return
  }
  resultViewer = new Viewer(resultGridRef.value, {
    navbar: true,
    toolbar: true,
    title: (image: HTMLImageElement) => image.alt || '',
    filter: (image: HTMLImageElement) => image.closest('.is-card-media') !== null,
  })
}

/** 字节数转可读文本 */
function formatSize(bytes: number): string {  if (!bytes || bytes < 0) { return '—'; }
  if (bytes < 1024) { return `${bytes} B`; }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(0)} KB`; }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 结果项尺寸：后端没返回宽高时如实显示「—」，不猜 */
function formatDims(item: ImageItem): string {
  return item.width && item.height ? `${item.width}×${item.height}` : '尺寸未知'
}

function pickImage() {
  fileInput.value?.click()
}

async function onFilePicked(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (file) await useImage(file)
}

async function onDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) await useImage(file)
}

/** 从剪贴板取图 */
async function pasteFromClipboard() {
  try {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const type = item.types.find((t) => t.startsWith('image/'))
      if (type) {
        const blob = await item.getType(type)
        await useImage(new File([blob], 'clipboard.png', { type }))
        return
      }
    }
    toast.error('剪贴板里没有图片')
  } catch (e) {
    toast.error('读取剪贴板失败，请改用「选择图片」')
  }
}

/** 选定图片：转 PNG 预览 + 立即检索 */
async function useImage(file: File) {
  busy.value = true
  try {
    const normalized = await normalizeToPng(file)
    previewFile.value = normalized
    previewUrl.value = URL.createObjectURL(normalized)
    searched.value = false
    results.value = []
    await runSearch()
  } catch (e: any) {
    toast.error(e?.message || '图片处理失败')
  } finally {
    busy.value = false
  }
}

/**
 * 统一转成 PNG：后端 OpenCV 解码不支持 webp；同时限制最长边。
 * 顺带把解码出的真实宽高与落盘体积记进 queryMeta，供画布标注卡显示。
 */
function normalizeToPng(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('浏览器不支持 canvas'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('图片编码失败'))
            return
          }
          queryMeta.value = { width, height, size: blob.size }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' }))
        }, 'image/png')
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('无法解析该图片'))
    }
    img.src = objectUrl
  })
}

/**
 * 提特征检索。
 *
 * <p>顺带记录端到端耗时：从发请求到拿到结果的墙钟时间，包含网络往返与后端
 * 特征提取。这是用户唯一能感知的指标，改模型/换向量库时靠它判断是否变慢。</p>
 *
 * <p>用 {@code performance.now()} 而非 {@code Date.now()}：前者是单调时钟，
 * 不受系统时间调整影响；后者在 NTP 校时或手动改时间时可能给出负值。</p>
 */
async function runSearch() {
  if (!previewFile.value) return
  searching.value = true
  const startedAt = performance.now()
  try {
    const form = new FormData()
    form.append('file', previewFile.value)
    // 不传 topK：由后端取「系统设置 → 默认模型 → 以图搜图」的 search_top_k。
    // 此前这里写死 '30'，用户改设置对返回条数毫无影响，只能改代码重新打包。
    const data = await apiService._request('/image-search/search', {
      method: 'POST',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    results.value = Array.isArray(data) ? data : []
    searched.value = true
    elapsedMs.value = Math.round(performance.now() - startedAt)
  } catch (e: any) {
    // 失败也要给出耗时：超时/报错时「等了多久」是排查的第一手信息
    elapsedMs.value = Math.round(performance.now() - startedAt)
    if (isNotConfigured(e)) available.value = false
    toast.error(e?.message || '检索失败')
  } finally {
    searching.value = false
  }
}

/** 把当前图加入底库 */
async function indexCurrent() {
  if (!previewFile.value) return
  busy.value = true
  try {
    const form = new FormData()
    form.append('file', previewFile.value)
    form.append('name', previewFile.value.name)
    await apiService._request('/image-search/index', {
      method: 'POST',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    toast.success('已加入图像底库')
    if (searched.value) await runSearch()
  } catch (e: any) {
    if (isNotConfigured(e)) available.value = false
    toast.error(e?.message || '入库失败')
  } finally {
    busy.value = false
  }
}

/** 未配置特征模型时后端返回的提示，用来把右上角状态置灰 */
function isNotConfigured(error: any): boolean {
  const msg = String(error?.message || '')
  return msg.includes('feature_model') || msg.includes('未启用')
}

async function loadStatus() {
  try {
    const data = await apiService._request('/image-search/status')
    available.value = !!data?.available
    activeModel.value = data?.model || ''
  } catch (e) {
    available.value = false
  }
}

// 查询图换新后要重建查看器，否则 viewerjs 内部仍是上一张图
watch(previewUrl, async () => {
  queryViewer?.destroy()
  queryViewer = null
  await nextTick()
  syncQueryViewer()
})

// 结果集变化（新检索、改筛选）后刷新查看器的图片列表
watch(
  () => filteredResults.value.length,
  async () => {
    await nextTick()
    syncResultViewer()
  }
)

// 结果面板首次可用时挂载结果查看器
watch(available, async (ok) => {
  if (!ok) {
    return
  }
  await nextTick()
  syncResultViewer()
})

onMounted(async () => {
  await loadStatus()
})

onBeforeUnmount(() => {
  queryViewer?.destroy()
  resultViewer?.destroy()
  queryViewer = null
  resultViewer = null
})
</script>

<style scoped>
/* ============================================================================
   令牌口径
   ----------------------------------------------------------------------------
   全部色值 / 圆角 / 过渡都取 koi 体系的 --el-* 令牌，不写死任何品牌色：
   · 底 / 面   --el-bg-color / --el-bg-color-overlay / --el-fill-color-light
   · 文字      --el-text-color-primary / -regular / -secondary
   · 描边      --el-border-color / -lighter
   · 主色      --el-color-primary 及已定义的 light-N
   · 圆角      --el-radius-xs(4) sm(6) md(8) lg(12) xl(16) full(9999)
   · 过渡      --el-transition-duration-fast

   **所有 var() 一律带 fallback，这不是洁癖，是有实测教训的**：
   本主题只定义了 primary 的 light-3/5/7/8，light-2/4/6/9 根本没定义。
   而 CSS 里 `var(--不存在的变量)` 且无 fallback 时，该声明会变成
   *invalid at computed-value time* 并静默回落到初始值 —— **不报错、不告警**。
   实测后果：顶栏的 linear-gradient 整条失效 → 背景透明 → 白字压白底 →
   品牌名与右侧按钮整排「消失」，而功能验收 26 项全绿。
   所以兜底写在这一层（别名定义处），下游 90 多处 var(--is-*) 一并受益。

   两处固定深色（.is-mask / .is-result-tip 的 rgba(0,0,0,…)）不参与换肤：
   盖在用户照片上，明暗不可控，只有固定深底才能保证白字可读。
   ============================================================================ */
.is-root {
  --is-bg: var(--el-bg-color, #fff);
  --is-card: var(--el-bg-color, #fff);
  --is-overlay: var(--el-bg-color-overlay, #fff);
  --is-text: var(--el-text-color-primary, #303133);
  --is-regular: var(--el-text-color-regular, #606266);
  --is-muted: var(--el-text-color-secondary, #909399);
  --is-border: var(--el-border-color-lighter, #ebeef5);
  --is-border-strong: var(--el-border-color, #dcdfe6);
  --is-hover: var(--el-fill-color-light, #f5f7fa);
  --is-radius: var(--el-radius-lg, 12px);
  --is-radius-sm: var(--el-radius-md, 8px);
  --is-primary: var(--el-color-primary, #409eff);
  --is-primary-soft: color-mix(in srgb, var(--is-primary) 12%, transparent);
  --is-primary-line: color-mix(in srgb, var(--is-primary) 40%, transparent);

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--is-text);
  background: var(--is-bg);
}

/* ==================== 顶栏 ==================== */
/* 刻意**不**照搬参考图那条彩色渐变顶栏：宿主布局（会话/助手/知识库…侧栏 +
   自己的头部）已经是浅色体系，再插一条主色渐变横条会与之打架，
   整页像贴了张别人的皮。参考图只借画布与结果面板的视觉语言，顶栏保持浅色。 */
.is-topbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--is-border);
  background: var(--is-card);
}

.is-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.is-brand-logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--el-radius-md, 8px);
  font-size: 18px;
  color: var(--is-primary);
  background: var(--is-primary-soft);
}

.is-brand-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--is-text);
}

.is-searchbox {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 620px;
  padding: 4px 4px 4px 16px;
  border: 1px solid var(--is-border);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--is-hover);
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.is-searchbox:focus-within {
  border-color: var(--is-primary);
}

/* 原来的关键词输入框随图像底库一起迁走了（这里搜的是库内条目），
   位置留一句说明，避免顶栏右侧空一大块看着像控件坏了 */
.is-searchbox-tip {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--is-muted);
}

.is-upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 7px 18px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary, #409eff);
  color: var(--el-color-white, #fff);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.is-upload-btn:hover:not(:disabled) {
  opacity: 0.88;
}

.is-upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.is-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
}

.is-badge {
  padding: 5px 14px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.is-badge.is-ok {
  background: var(--el-color-success-light-9, #f0f9eb);
  color: var(--el-color-success-dark-2, #529b2e);
}

.is-badge.is-off {
  background: var(--el-color-danger-light-9, #fef0f0);
  color: var(--el-color-danger-dark-2, #c45656);
}

/* ==================== 主体 ==================== */
.is-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.is-stage {
  flex: 1;
  min-width: 0;
  padding: 14px;
  display: flex;
  transition: flex-basis 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

.is-stage-inner {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--is-radius);
  border: 1px solid var(--is-border);
  background: var(--is-card);
  overflow: hidden;
}

/* 拖拽悬停：这一圈主色光环是「正在接收文件」的唯一提示，
   属状态反馈而非卡片投影，故保留；色源从主色派生 */
.is-stage-inner.is-drag {
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 3px var(--is-primary-soft);
}

/* ---------- 空态 ---------- */
.is-drop {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}

.is-drop:hover {
  background: var(--is-hover);
}

.is-drop:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: -4px;
}

.is-drop-icon {
  color: var(--el-text-color-placeholder, #a8abb2);
  margin-bottom: 4px;
}

.is-drop-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--is-regular);
}

.is-drop-desc {
  margin: 0;
  font-size: 13px;
  color: var(--is-muted);
}

.is-drop-btn {
  margin-top: 12px;
  border-radius: var(--el-radius-full, 9999px) !important;
}

/* ---------- 画布 ---------- */
.is-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--is-hover);
  overflow: hidden;
}

.is-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 扫描线：这是「正在提取特征」的唯一动态视觉反馈，
   高光是功能性发光（去掉就退化成一条静态线），故保留，
   色源从主色派生，免得多套主题下这条线与页面主色完全不搭 */
.is-scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--el-color-primary, #409eff), transparent);
  box-shadow: 0 0 14px 3px color-mix(in srgb, var(--el-color-primary, #409eff) 60%, transparent);
  animation: is-scan-move 1.6s ease-in-out infinite;
}

@keyframes is-scan-move {
  0% { top: 6%; }
  50% { top: 92%; }
  100% { top: 6%; }
}

/* 左上：完成态胶囊 */
.is-found-tag {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary, #409eff);
  color: var(--el-color-white, #fff);
  font-size: 13px;
  font-weight: 600;
}

/* 右上：相似度卡，主色左边条 */
.is-score-card {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  min-width: 104px;
  padding: 8px 14px 8px 12px;
  border-radius: var(--is-radius-sm);
  border-left: 3px solid var(--el-color-primary, #409eff);
  background: var(--is-overlay);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--el-color-black, #000) 12%, transparent);
}

.is-score-card-label {
  margin: 0;
  font-size: 12px;
  color: var(--is-muted);
}

.is-score-card-value {
  margin: 2px 0 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--el-color-primary, #409eff);
}

.is-score-card-value i,
.is-card-rank i {
  font-style: normal;
  font-size: 0.6em;
  margin-left: 1px;
}

/* ---------- 取景框 + 引线标注卡 ---------- */
/* 四角括号：参考图用检测框表达「这是被分析的区域」。
   通用图片检索没有检测框可画，所以只保留取景语汇本身（四角括号），
   不伪造检测框与特征点 —— 那会让用户以为界面上那些点是后端算出来的。 */
.is-figure {
  position: absolute;
  inset: 14px;
  pointer-events: none;
  z-index: 2;
}

.is-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid var(--el-color-primary, #409eff);
}

.is-corner.is-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.is-corner.is-tr { top: 0; right: 0; border-left: none; border-bottom: none; }
.is-corner.is-bl { bottom: 0; left: 0; border-right: none; border-top: none; }
.is-corner.is-br { bottom: 0; right: 0; border-left: none; border-top: none; }

.is-callouts {
  position: absolute;
  inset: 0;
}

.is-callout {
  position: absolute;
  padding: 7px 13px;
  border-radius: var(--is-radius-sm);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 88%, #000);
  color: var(--el-color-white, #fff);
  /* 标注卡压在照片上，必须始终可读：加一层同色系暗底做对比保险 */
  text-shadow: 0 1px 2px color-mix(in srgb, var(--el-color-black, #000) 35%, transparent);
}

.is-callout-l { left: 0; top: 46%; }
.is-callout-r { right: 0; top: 32%; }

.is-callout-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.is-callout-text {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.92;
  white-space: nowrap;
}

/* 左栏收窄后引线标注会压在图上（368px 宽塞不下两张卡），只在够宽时出现 */
.is-body.is-focused .is-callouts {
  display: none;
}

/* ---------- 左下：操作卡 ---------- */
.is-actcard {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: var(--is-radius);
  border: 1px solid var(--is-border);
  background: var(--is-overlay);
  box-shadow: 0 4px 18px color-mix(in srgb, var(--el-color-black, #000) 14%, transparent);
}

.is-actcard-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 132px;
  padding: 9px 12px;
  border: 1px solid var(--is-primary-line);
  border-radius: var(--is-radius-sm);
  background: transparent;
  color: var(--el-color-primary, #409eff);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  /* 「加入图像底库」五个字在窄栏里会被断成两行 */
  white-space: nowrap;
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}

.is-actcard-btn:hover:not(:disabled) {
  background: var(--is-primary-soft);
}

.is-actcard-btn:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: 2px;
}

.is-actcard-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.is-actcard-btn.is-primary {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: var(--el-color-white, #fff);
}

.is-actcard-btn.is-primary:hover:not(:disabled) {
  background: var(--el-color-primary-light-3, #79bbff);
}

/* 收窄成参考栏时竖排卡片会挤占画面，改为横排换行 */
.is-body.is-focused .is-actcard {
  left: 10px;
  right: 10px;
  bottom: 10px;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 8px;
}

.is-body.is-focused .is-actcard-btn {
  width: auto;
  flex: 1 1 88px;
  padding: 7px 10px;
}

/* 收窄成参考栏时操作卡会横排铺满底部，和同样贴底的结果提示撞在一起
   （实测「为你找到 2 张」压在三个按钮上）。此处直接隐藏结果提示 ——
   它说的「找到 N 张」在底部统计条里已经有了（命中 / 最高 / 均值），
   窄栏里重复一遍只会更挤。 */
.is-body.is-focused .is-result-tip {
  display: none;
}

/* ---------- 右下：特征摘要 ---------- */
.is-sumcard {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 3;
  width: 208px;
  padding: 10px 12px 8px;
  border-radius: var(--is-radius);
  border: 1px solid var(--is-border);
  background: var(--is-overlay);
  box-shadow: 0 4px 18px color-mix(in srgb, var(--el-color-black, #000) 14%, transparent);
}

.is-sumcard-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
}

.is-sumcard-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--is-muted);
}

.is-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 68px;
}

.is-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  height: 100%;
}

.is-bar-num {
  font-size: 11px;
  color: var(--is-muted);
}

.is-bar {
  width: 100%;
  max-width: 26px;
  border-radius: var(--el-radius-xs, 4px) var(--el-radius-xs, 4px) 0 0;
  background: linear-gradient(180deg, var(--el-color-primary, #409eff) 0%, var(--el-color-primary-light-3, #79bbff) 100%);
  transition: height var(--el-transition-duration-fast, 0.2s) ease;
}

.is-bar-label {
  font-size: 11px;
  color: var(--is-muted);
  white-space: nowrap;
}

/* 收窄后右下摘要卡与左下操作卡会打架，隐藏 */
.is-body.is-focused .is-sumcard {
  display: none;
}

/* ---------- 蒙版 / 结果提示 ---------- */
/* 盖在用户照片上的浮层必须始终是深色半透明蒙版（照片明暗不可控，
   只有固定深底才能保证白字可读），故这里的 rgba(0,0,0,…) 属功能性固定配色 */
.is-mask {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.55);
  color: var(--el-color-white, #fff);
  font-size: 14px;
}

.is-spin {
  animation: is-rot 1s linear infinite;
}

@keyframes is-rot {
  to { transform: rotate(360deg); }
}

.is-result-tip {
  position: absolute;
  left: 50%;
  bottom: 14px;
  z-index: 3;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: var(--el-radius-full, 9999px);
  background: rgba(0, 0, 0, 0.6);
  color: var(--el-color-white, #fff);
  font-size: 13px;
}

.is-result-tip b {
  font-weight: 700;
  color: color-mix(in srgb, var(--el-color-white, #fff) 60%, var(--el-color-primary, #409eff));
}

.is-hidden {
  display: none;
}

/* ==================== 结果面板 ==================== */
.is-side {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--is-border);
  background: var(--is-card);
  min-height: 0;
  transition: width 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ---- 结果优先版面 ----
   检索命中后把宽度让给结果区：左侧查询图收窄成参考栏，结果区吃掉剩余空间。
   未命中时保持「输入占主导」（此时用户正要看自己传了什么图），命中后重心转移到结果。 */
.is-body.is-focused .is-stage {
  /* 左栏退成参考条：240px 起保证查询图还认得出（低于这个数就只剩一小块色块，
     失去「我传的是这张图」的意义），上限 340px 避免大屏上参考条过宽，
     中间跟随视口 22%。命中后结果区拿到约 78% 宽度。 */
  flex: 0 0 clamp(240px, 22%, 340px);
}

.is-body.is-focused .is-side {
  width: auto;
  flex: 1 1 auto;
}

/* 结果区变宽后每行多放几张，避免缩略图被拉成大图而失去「一览」价值 */
.is-body.is-focused .is-grid {
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
}

/* 左栏收窄后边框盒若仍撑满列高，里面只有一张小图、上下几百像素留白，
   比收窄之前更空。改为按内容收缩，空白还给页面背景。 */
.is-body.is-focused .is-stage-inner {
  align-self: flex-start;
  max-height: 100%;
}

.is-body.is-focused .is-canvas {
  flex: 0 0 auto;
}

/* 图片高度用 vh：.is-canvas 改成内容高度后高度不确定，
   img 的 max-height:100% 会失去参照而失效，vh 是确定值。 */
.is-body.is-focused .is-img {
  max-height: 46vh;
}

/* ---------- 页签 ---------- */
.is-tabs {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 0 16px;
  border-bottom: 1px solid var(--is-border);
  flex-shrink: 0;
}

.is-tab {
  position: relative;
  padding: 13px 0 11px;
  border: none;
  background: transparent;
  color: var(--is-muted);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--el-transition-duration-fast, 0.2s) ease;
}

.is-tab:hover {
  color: var(--is-regular);
}

.is-tab:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: 2px;
}

.is-tab.active {
  color: var(--el-color-primary, #409eff);
  font-weight: 700;
}

.is-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 3px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary, #409eff);
}

.is-tabs-arrow {
  margin-left: auto;
  color: var(--is-muted);
  cursor: pointer;
}

/* ---------- 筛选 chips ---------- */
.is-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  flex-shrink: 0;
}

.is-chip {
  padding: 6px 14px;
  border: 1px solid var(--is-border-strong);
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--is-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}

.is-chip:hover:not(:disabled) {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}

.is-chip:focus-visible {
  outline: 2px solid var(--el-color-primary, #409eff);
  outline-offset: 2px;
}

.is-chip.active {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
  background: var(--is-primary-soft);
}

.is-chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ---------- 未启用提示 ---------- */
.is-hint {
  display: flex;
  gap: 10px;
  margin: 16px;
  padding: 14px;
  border-radius: var(--is-radius-sm);
  background: var(--el-color-warning-light-9, #fdf6ec);
  color: var(--el-color-warning-dark-2, #b88230);
}

.is-hint-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.is-hint-desc {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.6;
}

/* ---------- 结果网格 ---------- */
.is-grid {
  flex: 1;
  min-height: 160px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0 16px 16px;
  align-content: start;
}

.is-card {
  border: 1px solid var(--is-border);
  border-radius: var(--is-radius-sm);
  background: var(--is-bg);
  overflow: hidden;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.is-card:hover {
  border-color: var(--el-color-primary, #409eff);
}

.is-card-media {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--is-hover);
}

.is-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 左上圆形徽标：直接承载相似度百分比。
   底色用 overlay 派生而非写死半透明白 —— 暗色下写死白底会留一块亮斑。 */
.is-card-rank {
  position: absolute;
  top: 8px;
  left: 8px;
  /* 必须用 flex 而非 grid：grid 容器里**每个子元素都是独立 grid item**，
     徽标内容是文本「100」+ <i>%</i>，在 grid 下会变成两个纵向堆叠的 item，
     于是「100%」被拆成两行（加 white-space:nowrap 也治不了，那不是换行问题）。
     flex 默认 row，两者才会排在同一行。 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary, #409eff);
  color: var(--el-color-white, #fff);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black, #000) 22%, transparent);
}

.is-card-body {
  padding: 8px 10px 10px;
}

.is-card-name {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--is-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-card-tagname {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 400;
  color: var(--is-muted);
}

.is-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--is-muted);
  overflow: hidden;
}

.is-card-dim {
  flex-shrink: 0;
}

.is-card-tag {
  padding: 1px 6px;
  border-radius: var(--el-radius-xs, 4px);
  background: var(--is-primary-soft);
  color: var(--el-color-primary, #409eff);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- 空态 ---------- */
.is-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  /*
    与有结果时占同样高度：空态若只在内容高度上，侧栏会随结果有无而伸缩，
    页面看起来像换了一个。min-height 取网格一屏的近似值，两种状态视觉一致。
  */
  min-height: 320px;
  padding: 32px 16px;
  color: var(--is-muted);
  font-size: 13px;
  text-align: center;
}

.is-empty-title {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--is-regular);
}

.is-empty-desc {
  margin: 0;
  max-width: 280px;
  line-height: 1.6;
  color: var(--is-muted);
}

/* 结果提示里的耗时：与「为你找到 N 张」同一行，弱化一档 */
.is-result-cost {
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid rgba(255, 255, 255, 0.35);
  font-weight: 400;
  opacity: 0.85;
}

/* ---------- 底部统计条 ---------- */
.is-footbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--is-border);
  flex-shrink: 0;
}

/* 耗时放末尾，与命中/最高/均值同排；数字等宽避免每次刷新宽度抖动 */
.is-footbar-cost {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.is-footbar-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--is-regular);
}

.is-footbar-items {
  display: flex;
  flex: 1;
  gap: 10px;
}

.is-footbar-item {
  /* 参考图是三等分铺开，但面板被拉到近 1000px 宽时，
     1px 实线会拉成 300px 长的横杠。限一下上限。 */
  flex: 1 1 0;
  max-width: 220px;
  padding-top: 6px;
  border-top: 2px solid var(--el-color-primary, #409eff);
  font-size: 12px;
  color: var(--is-muted);
  white-space: nowrap;
}
</style>
