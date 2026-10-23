<template>
  <div class="ocr-root" data-page="ocr">
    <div class="ocr-body">
      <!-- ==================== 左：图片舞台 ==================== -->
      <section class="ocr-stage">
        <div
          class="ocr-stage-inner"
          :class="{ 'is-dragover': dragOver }"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
        >
          <!-- 未配置模型：与其它图像菜单同口径，先在舞台内引导去配置 -->
          <div v-if="!modelReady" class="ocr-drop">
            <el-icon :size="46" class="ocr-drop-icon is-warn"><WarningFilled /></el-icon>
            <p class="ocr-drop-title">OCR 识别未启用</p>
            <p class="ocr-drop-desc">
              需要「文字检测模型」和「文字识别模型」两级模型，请先在「系统设置 → 默认模型 → OCR」中配置。
            </p>
            <ReButton type="primary" @click="goConfig">去配置模型</ReButton>
          </div>

          <!-- 空态：引导上传。模型不可用时不给上传入口（传了必然失败，等于骗用户） -->
          <div v-else-if="!originalUrl" class="ocr-drop" :class="{ 'is-blocked': ocrUnavailable }" @click="pickImage">
            <el-icon :size="46" class="ocr-drop-icon"><Picture /></el-icon>
            <template v-if="ocrUnavailable">
              <p class="ocr-drop-title">OCR 模型暂不可用</p>
              <p class="ocr-drop-desc">先让模型就绪再上传：右侧状态卡里能看到当前配置的模型与失败原因</p>
            </template>
            <template v-else>
              <p class="ocr-drop-title">上传一张图片，开始识别文字</p>
              <p class="ocr-drop-desc">点击选择图片，或把图片拖到这里</p>
              <el-button type="primary" class="ocr-drop-btn" @click.stop="pickImage">
                <el-icon><FolderOpened /></el-icon>选择图片
              </el-button>
            </template>
          </div>

          <!--
            图片舞台只有一张 <img>：检测框开关切的是 src（后端标注图 ⇄ 原图），
            不是两张图叠在一起 —— 标注图本身就是「原图 + 框 + 文字」的合成结果，
            再叠一层原图反而会出现两层像素对不齐的鬼影。
          -->
          <div v-else class="ocr-canvas">
            <img :src="displayUrl" class="ocr-img" :alt="displayLabel" />

            <!-- 所见即所得的标签：标注图没拿到时开关会置灰回落到原图，
                 写明当前是哪一张，用户才不会以为识别的框丢了 -->
            <div class="ocr-badge">{{ displayLabel }}</div>

            <!-- 识别中遮罩：两个请求任一未回都算「识别中」 -->
            <div v-if="busy" class="ocr-mask">
              <ReLoader loading size="lg" :fullscreen="false" />
              <span class="ocr-mask-text">识别中…</span>
            </div>
          </div>

          <!-- 操作条 -->
          <div v-if="originalUrl" class="ocr-actions">
            <el-button class="ocr-btn ocr-btn-ghost" :disabled="busy" @click="pickImage">
              <el-icon><FolderOpened /></el-icon>更换图片
            </el-button>

            <!--
              检测框开关：两张图在上传时已并行取回，这里是纯显示切换，不重新请求 ——
              一个「看一下原图」的动作不该再等一次模型推理。
              标注图不可用时置灰（点了也只能得到原图，属于骗人的开关）。
            -->
            <button
              type="button"
              class="ocr-box-toggle"
              :class="{ 'is-on': showBox, 'is-disabled': !annotatedUrl }"
              :disabled="!annotatedUrl"
              :aria-pressed="showBox ? 'true' : 'false'"
              :title="boxToggleTitle"
              @click="showBox = !showBox"
            >
              <span class="ocr-box-toggle__track"><i class="ocr-box-toggle__knob" /></span>
              <span class="ocr-box-toggle__label">检测框</span>
            </button>

            <el-button
              class="ocr-btn ocr-btn-brand"
              :disabled="busy"
              :loading="busy"
              @click="rerun"
            >
              <el-icon v-if="!busy"><Refresh /></el-icon>重新识别
            </el-button>
          </div>
        </div>
      </section>

      <!-- ==================== 右：识别文本 ==================== -->
      <aside class="ocr-panel">
        <header class="ocr-panel-head">
          <h2 class="ocr-panel-title">识别文本</h2>
          <span class="ocr-dots"><i v-for="n in 5" :key="n" /></span>
        </header>

        <!--
          错误通道刻意独立于结果通道，不并入下面的 v-if 链：
          「文字识别成功、标注图失败」是可能的组合，串成一个 v-else 链会让其中一个
          被另一个吃掉，用户就只能看到半截状态。
        -->
        <div v-if="errorLines.length && !modelBrokenOnly" class="ocr-error" role="alert">
          <el-icon><Warning /></el-icon>
          <div class="ocr-error-body">
            <p v-for="(line, i) in errorLines" :key="i" class="ocr-error-line">{{ line }}</p>
          </div>
        </div>

        <!--
          模型不可用：这是「环境/配置」层面的失败，不是图片的问题。
          单独做成状态卡，把「当前指向哪个模型」和「后端原文」一起摊开 ——
          否则用户只看到一行技术报错，既不知道是图片不行，也不知道该找谁补权重。
        -->
        <div v-if="modelBrokenOnly" class="ocr-setup" role="alert">
          <el-icon :size="30" class="ocr-setup-icon"><Warning /></el-icon>
          <p class="ocr-setup-title">OCR 模型当前不可用</p>
          <p class="ocr-setup-desc">
            识别需要「文字检测 + 文字识别」两级模型；模型不就绪时上传必然失败，所以暂时关掉了上传入口。
          </p>
          <ul class="ocr-setup-list">
            <li v-for="item in setupModels" :key="item.field" class="ocr-setup-item">
              <span class="ocr-setup-k">{{ item.label }}</span>
              <code class="ocr-setup-v" :class="{ 'is-empty': !item.value }">{{ item.value || '未配置' }}</code>
            </li>
          </ul>
          <p v-if="recognizeError" class="ocr-setup-detail">{{ recognizeError }}</p>
          <el-button class="ocr-btn ocr-btn-ghost" :loading="!ocrConfigLoaded" @click="recheckModels">
            <el-icon><Refresh /></el-icon>重新检测
          </el-button>
        </div>

        <!-- 识别中：骨架（右侧此刻还没有任何可展示的文本） -->
        <div v-if="recognizeBusy" class="ocr-skeleton" aria-busy="true">
          <el-skeleton :rows="6" animated />
          <p class="ocr-skeleton-text">正在识别文字…</p>
        </div>

        <!-- 结果：统计 + 文本体 -->
        <template v-else-if="ocrText">
          <div class="ocr-stat">
            <div class="ocr-stat-row">
              <span class="ocr-stat-k">文本块</span>
              <span class="ocr-stat-v">{{ textBlocks ?? '—' }}</span>
            </div>
            <div class="ocr-stat-row">
              <span class="ocr-stat-k">耗时</span>
              <span class="ocr-stat-v">{{ elapsedMs != null ? `${elapsedMs} ms` : '—' }}</span>
            </div>
          </div>

          <div class="ocr-text-bar">
            <span class="ocr-text-hint">等宽展示 · 可选中</span>
            <el-button
              class="ocr-copy"
              :class="{ 'is-copied': copied }"
              size="small"
              :type="copied ? 'success' : 'default'"
              plain
              @click="copyText"
            >
              <el-icon><component :is="copied ? Check : DocumentCopy" /></el-icon>{{ copied ? '已复制' : '复制' }}
            </el-button>
          </div>

          <pre class="ocr-text">{{ ocrText }}</pre>
        </template>

        <!-- 空态：没有任何错误、也没有文本时才显示（有错误时上面那条已经说清楚了） -->
        <div v-else-if="!errorLines.length && !modelBrokenOnly" class="ocr-blank">
          <el-icon :size="34" class="ocr-blank-icon"><DocumentCopy /></el-icon>
          <p class="ocr-blank-title">{{ originalUrl ? '没有识别到文字' : '等待上传图片' }}</p>
          <p class="ocr-blank-desc">{{ blankDesc }}</p>
        </div>
      </aside>
    </div>

    <!-- 隐藏的文件选择器：必须常驻 DOM，放进 v-if 分支里上传后 ref 会变 null -->
    <input ref="fileInput" type="file" accept="image/*" class="ocr-hidden" @change="onFilePicked" />
  </div>
</template>

<script setup lang="ts">
import { message } from '@repo/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, DocumentCopy, FolderOpened, Picture, Refresh, Warning, WarningFilled } from '@element-plus/icons-vue'
import { currentToken } from '@/framework/context'
import { getClientId } from '@/utils/clientId'
import ReLoader from '@repo/ui/re-loader'
import ReButton from '@/components/re/ReButton.vue'
import { useRouter } from 'vue-router'
import { useModelConfigStore } from '@/stores/modelConfig'

/**
 * 图像 → OCR 识别。
 *
 * <p>布局沿用 {@code FaceSearchPage}：左侧图片舞台（空态 / 图片 / 处理中遮罩 / 操作条），
 * 右侧结果面板（统计 / 文本体 / 空态）。</p>
 *
 * <p>与其它图片页最大的不同：这里的**两个接口各给一半结果**，且都是模型推理。</p>
 * <ul>
 *   <li>{@code POST /v2/ocr/recognize} → JSON 信封，{@code data = {count, text, results, elapsedMs}}；</li>
 *   <li>{@code POST /v2/ocr/annotate} → {@code image/jpeg} 二进制（原图 + 检测框 + 文字）。</li>
 * </ul>
 * <p>所以上传后**并行**发这两个请求：串行会把用户等待时间翻倍，而两者互不依赖。</p>
 */

/**
 * {@code /v2/ocr/recognize} 的 {@code data} 结构。
 *
 * <p>字段取自后端 {@code OcrController.recognize} 的 {@code Map.of(...)} 原样序列化，
 * 不是猜的；其中 {@code results} 的元素是 {@code OcrResult} record：
 * {@code {text, confidence, boundingBox:{x,y,width,height,confidence,label,labelName,keypoints}, angle}}。</p>
 */
interface OcrRecognizeData {
  /** 文本块数量（后端 {@code results.size()}，含空白块） */
  count?: number
  /** 拼接全文：非空文本块以 \n 连接 —— 右侧直接按这个字符串展示，不再自己拼 */
  text?: string
  /** 明细（文本 / 置信度 / 位置 / 角度），本页只用来兜底算块数 */
  results?: Array<{ text?: string; confidence?: number; angle?: number }>
  /** 后端实测耗时（毫秒） */
  elapsedMs?: number
}

const fileInput = ref<HTMLInputElement | null>(null)
/** 原图 object URL（当前上传的文件） */
const originalUrl = ref('')
/** 后端标注图 object URL；空串表示这次没拿到（模型未配置 / 解码失败），此时回落到原图 */
const annotatedUrl = ref('')
/** 检测框开关：开启看标注图，关闭看原图 */
const showBox = ref(true)
const ocrText = ref('')
const textBlocks = ref<number | null>(null)
const elapsedMs = ref<number | null>(null)
const recognizeBusy = ref(false)
const annotateBusy = ref(false)
const recognizeError = ref('')
const annotateError = ref('')
const copied = ref(false)
const dragOver = ref(false)

/**
 * OCR 分组的模型配置（来自 `/v2/settings/ocr/merged`）。
 *
 * <p>为什么要读它：OCR 是「检测 + 识别」两级模型管线，任一级没配好就必然识别失败。
 * 页面如果只在用户传图之后抛一句原始异常，用户会以为是图片的问题。先把配置摊开，
 * 缺什么、当前指向哪个模型，一眼能看到。</p>
 */
const modelConfig = useModelConfigStore()
const router = useRouter()
/** OCR 是否已配齐（检测 + 识别）：与侧栏徽标、点击门禁同一个来源，不各自读一套 */
const modelReady = computed(() => modelConfig.ocrReady)
/**
 * 「配好了但跑不起来」的运行期问题（如部署包缺 ONNX 权重）。
 * 未配置走舞台里的标准门禁，只有这一类才用右侧状态卡 —— 它不是配置问题，没地方可点。
 */
const modelBrokenOnly = computed(() => ocrModelBroken.value || stickyUnavailable.value)
const ocrConfig = ref<Record<string, string>>({})
const ocrConfigLoaded = ref(false)
/** 配置里为空的必需字段（中文名，直接给用户看） */
const ocrMissingFields = computed(() => {
  const missing: string[] = []
  if (!String(ocrConfig.value.detector_model || '').trim()) missing.push('文字检测模型')
  if (!String(ocrConfig.value.recognizer_model || '').trim()) missing.push('文字识别模型')
  return missing
})

/** 状态卡里要展示的两个必需模型（字段名 + 中文名 + 当前值） */
const setupModels = computed(() => [
  { field: 'detector_model', label: '文字检测模型', value: String(modelConfig.ocrDetectorModel || '').trim() },
  { field: 'recognizer_model', label: '文字识别模型', value: String(modelConfig.ocrRecognizerModel || '').trim() },
])

/**
 * 后端报的是「模型/权重层面」的问题，而不是图片本身的问题。
 *
 * <p>两种情况都会落进来：① 配置为空（从未配置）；② 配置有值但部署包里缺权重
 * （实测原文：{@code 未在 classpath 找到匹配 *.onnx 的文件: ocr/PP-OCRv6/...}）。
 * 对用户来说两者是同一件事 —— 「这台机器现在跑不了 OCR」，所以用同一个状态卡呈现，
 * 只是把后端原文作为细节附在下面，不去改写它。</p>
 */
const ocrModelBroken = computed(() => /未在 classpath|模型未配置|模型不可用|onnx|模型文件/i.test(recognizeError.value))

/**
 * 「上次已知不可用」的会话内记忆。
 *
 * <p>权重缺失这类问题只有真跑一次推理才暴露，而它一旦暴露就不会自己好。若只放在
 * recognizeError 里，用户刷新一次页面又看到「上传一张图片」的引导，传上去再失败一遍
 * —— 同一个结论反复演示。这里记进 sessionStorage：刷新/切页仍按不可用呈现，
 * 点「重新检测」才清掉（那正是部署侧补齐权重的时刻）。</p>
 */
const STICKY_KEY = 'ocr.modelUnavailable'
const stickyUnavailable = ref(sessionStorage.getItem(STICKY_KEY) === '1')

/** 整页是否处于「不可用」状态：此时不该让用户继续传图（传了必然失败） */
/** 与后端 OcrClientManager.available() 对齐：至少有一个模型配置即可用，仅当两者均缺失才判不可用 */
const ocrUnavailable = computed(() => ocrMissingFields.value.length >= 2 || ocrModelBroken.value || stickyUnavailable.value)

/**
 * 读取 OCR 模型配置。
 *
 * <p>只做展示，不做门禁之外的副作用；失败就静默（配置读不到不该让整页白屏，
 * 真正的失败仍会由上传后的识别错误呈现）。</p>
 */
async function loadOcrConfig() {
  try {
    const res = await fetch('/v2/settings/ocr/merged', { headers: ocrHeaders() })
    const body = await readJson(res)
    // 信封是 { code, data: { success, data: [ {field, value, ...} ] } }
    const rows = (body as { data?: { data?: Array<{ field?: string; value?: unknown }> } })?.data?.data
    if (Array.isArray(rows)) {
      const map: Record<string, string> = {}
      for (const r of rows) {
        if (r?.field) map[String(r.field)] = r.value == null ? '' : String(r.value)
      }
      ocrConfig.value = map
    }
  } catch {
    /* 读不到配置就当作「未知」，交给识别错误去呈现 */
  } finally {
    ocrConfigLoaded.value = true
  }
}

/** 重新检测：清掉错误并重读配置（部署侧补了权重后不用刷新整页） */
async function recheckModels() {
  recognizeError.value = ''
  annotateError.value = ''
  stickyUnavailable.value = false
  sessionStorage.removeItem(STICKY_KEY)
  ocrConfigLoaded.value = false
  await loadOcrConfig()
}

// 一旦确认是模型层面的失败就记住它，刷新后仍按不可用呈现
watch(ocrModelBroken, (broken) => {
  if (!broken) return
  stickyUnavailable.value = true
  sessionStorage.setItem(STICKY_KEY, '1')
})

onMounted(() => {
  // 就绪判定交给 store（与侧栏徽标同一份数据），本地再读一次只为把模型名摊开
  void modelConfig.load()
  void loadOcrConfig()
})

/** 与其它图像页一致：跳到默认模型设置 */
function goConfig() {
  router.push('/setting/default-models')
}

/** 当前上传的文件（重新识别的入参）；刻意不放 ref —— 它不参与渲染 */
let sourceFile: File | null = null
/** 复制反馈计时器 */
let copyTimer: number | undefined
/**
 * 上传 / 重新识别的批次号。
 *
 * <p>两个请求是并行的，谁先回来不确定。用户连续换图时，上一张的响应可能**后**到，
 * 把新图的文本/标注图覆盖掉（表现为「刚上传的图显示了上一张的字」）。
 * 写入状态前比对批次号，只有当前批次的结果才落地。</p>
 */
let loadSeq = 0

const busy = computed(() => recognizeBusy.value || annotateBusy.value)

/** 舞台上实际渲染的那张图：开关打开且标注图已到手才用标注图 */
const displayUrl = computed(() => (showBox.value && annotatedUrl.value ? annotatedUrl.value : originalUrl.value))

/** 舞台角标文案：说明当前看的是哪一张，避免「框没出来」被误读成识别失败 */
const displayLabel = computed(() => (showBox.value && annotatedUrl.value ? '检测框标注图' : '原图'))

/** 检测框开关的悬浮说明：不可用时给出原因，而不是一个沉默的灰按钮 */
const boxToggleTitle = computed(() => {
  if (annotatedUrl.value) {
    return '显示/隐藏检测框（开启看后端标注图，关闭看原图）'
  }
  return annotateError.value || '检测标注图尚未生成'
})

/** 页面上的错误行：识别与标注各留各的原因，互不覆盖 */
const errorLines = computed(() => {
  const lines: string[] = []
  if (recognizeError.value) lines.push(recognizeError.value)
  if (annotateError.value) lines.push(annotateError.value)
  return lines
})

const blankDesc = computed(() =>
  originalUrl.value
    ? '后端没有返回任何文字块，换一张文字更清晰的图片试试'
    : '上传图片后会自动识别：左侧看检测框标注图，右侧看识别全文',
)

/**
 * 判断所选文件是否为图片。
 *
 * <p>不能只看 {@code file.type}：部分来源（无扩展名、系统未登记 MIME）会给空 type，
 * 此时按扩展名兜底，避免「选了图却提示不是图片」。</p>
 */
function isImageFile(file: File): boolean {
  if (file.type) return file.type.startsWith('image/')
  return /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(file.name || '')
}

/**
 * 直连 {@code /v2/ocr/**} 的请求头。
 *
 * <p>为什么手写 fetch 而不是走 ApiService：本页只是两个一次性上传口，不进任何业务模块；
 * 但**鉴权不能省** —— 框架的令牌是 {@code x-oauth-token} 请求头（同 {@code v2Http} 的
 * {@code X-Client-Id}），裸 fetch 不会自动带，漏了就是 401。</p>
 */
function ocrHeaders(): Record<string, string> {
  return { 'x-oauth-token': currentToken() || '', 'X-Client-Id': getClientId() }
}

/** 从后端信封里取可读原因：{@code success=false} 时 msg / error 都可能是原因 */
function backendMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const obj = body as { msg?: unknown; error?: unknown; message?: unknown }
  return String(obj.msg || obj.error || obj.message || '').trim()
}

/** 非 2xx 时的中文提示：状态码本身不可读，这里翻成人话 */
function httpHint(status: number): string {
  if (status === 401 || status === 403) return `登录状态已失效或无访问权限（HTTP ${status}），请重新登录后再试`
  if (status === 413) return `图片体积超过服务端上限（HTTP ${status}），请压缩后重试`
  return `HTTP ${status}`
}

/** 异常/非 JSON 响应 → 一行可读文案 */
function errText(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    // 非 JSON（网关 HTML、空体…）：交给调用方按 HTTP 状态给文案
    return null
  }
}

/** 换图 / 卸载时释放原图 URL */
function revokeOriginalUrl() {
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
  originalUrl.value = ''
}

/** 释放标注图 URL（必须在 <img> 已经指向别处之后调用，否则图会先白一下） */
function revokeAnnotatedUrl() {
  if (annotatedUrl.value) URL.revokeObjectURL(annotatedUrl.value)
  annotatedUrl.value = ''
}

function pickImage() {
  fileInput.value?.click()
}

function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  // 清空 value：否则连续选同一个文件不会再触发 change
  input.value = ''
  if (file) void loadFile(file)
}

function onDragOver() {
  dragOver.value = true
}

/**
 * dragleave 在子元素之间移动时也会冒泡触发。
 *
 * <p>不判断 relatedTarget 的话，鼠标从容器滑到图片上就会把高亮收掉，
 * 拖拽提示一闪一闪。</p>
 */
function onDragLeave(e: DragEvent) {
  const host = e.currentTarget as HTMLElement | null
  const next = e.relatedTarget as Node | null
  if (host && next && host.contains(next)) return
  dragOver.value = false
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) void loadFile(file)
}

/** 上传入口：重置状态 → 并行取「文本」与「标注图」 */
async function loadFile(file: File) {
  // 模型没就绪就直接拦在入口：让它跑一次必然失败的推理，只是把同一件事
  // 换成一个更吓人的报错，还浪费一次上传。三个入口（点击/拖拽/文件选择）都走这里。
  if (ocrUnavailable.value) {
    message.warning('OCR 模型当前不可用，请先让模型就绪')
    return
  }
  if (!isImageFile(file)) {
    message.warning('请选择图片文件')
    return
  }
  const seq = (loadSeq += 1)
  sourceFile = file
  revokeAnnotatedUrl()
  revokeOriginalUrl()
  originalUrl.value = URL.createObjectURL(file)

  // 上一张图的结论全部作废：否则新图会短暂显示旧文本/旧错误
  ocrText.value = ''
  textBlocks.value = null
  elapsedMs.value = null
  recognizeError.value = ''
  annotateError.value = ''
  copied.value = false

  await Promise.allSettled([runRecognize(file, seq), runAnnotate(file, seq)])
  if (seq !== loadSeq) return
  notify()
}

/** 重新识别当前图（模型刚配好、上一次 5xx 抖动时不用重新选文件） */
async function rerun() {
  const file = sourceFile
  if (!file || busy.value) return
  const seq = (loadSeq += 1)
  ocrText.value = ''
  textBlocks.value = null
  elapsedMs.value = null
  recognizeError.value = ''
  annotateError.value = ''
  copied.value = false

  await Promise.allSettled([runRecognize(file, seq), runAnnotate(file, seq)])
  if (seq !== loadSeq) return
  notify()
}

/**
 * 结果提示只弹一次。
 *
 * <p>两个请求是同一份失败原因的两面（模型未配置时两个口都会挂），各弹一个 toast
 * 等于把同一句话说两遍；页面上两条错误仍分别保留。</p>
 */
function notify() {
  if (recognizeError.value) message.error(recognizeError.value)
  else if (annotateError.value) message.warning(annotateError.value)
}

/** OCR 文字识别：拿全文 + 块数 + 后端耗时 */
async function runRecognize(file: File, seq: number) {
  recognizeBusy.value = true
  try {
    const form = new FormData()
    form.append('file', file, file.name || 'ocr.png')
    const res = await fetch('/v2/ocr/recognize', { method: 'POST', headers: ocrHeaders(), body: form })
    const body = await readJson(res)
    if (!res.ok || !body || (body as { success?: boolean }).success === false || !(body as { data?: unknown }).data) {
      // 这个口的失败原因后端写在 msg 里（如「文字识别失败: OCR 模型未配置：请在设置中配置
      // ocr 分组的 detector_model / recognizer_model」），原样展示，不自己改写
      const reason = backendMessage(body) || `文字识别失败（${httpHint(res.status)}）`
      if (seq === loadSeq) recognizeError.value = reason
      return
    }
    if (seq !== loadSeq) return
    const data = (body as { data?: OcrRecognizeData }).data ?? {}
    ocrText.value = typeof data.text === 'string' ? data.text : ''
    const count = Number(data.count)
    textBlocks.value = Number.isFinite(count)
      ? count
      : Array.isArray(data.results)
        ? data.results.length
        : null
    const cost = Number(data.elapsedMs)
    elapsedMs.value = Number.isFinite(cost) ? cost : null
  } catch (e) {
    if (seq === loadSeq) recognizeError.value = `文字识别请求失败：${errText(e)}`
  } finally {
    // 只有当前批次能收起遮罩：上一张图的迟到响应不该把新图的遮罩收掉
    if (seq === loadSeq) recognizeBusy.value = false
  }
}

/** 检测标注图：后端回 {@code image/jpeg} 二进制，转 object URL 才能给 <img> */
async function runAnnotate(file: File, seq: number) {
  annotateBusy.value = true
  try {
    const form = new FormData()
    form.append('file', file, file.name || 'ocr.png')
    const res = await fetch('/v2/ocr/annotate', { method: 'POST', headers: ocrHeaders(), body: form })
    if (!res.ok) {
      // 这个口失败时后端回**空体**（ResponseEntity.badRequest().build()），拿不到原因；
      // 真实原因由并行的 /recognize 给出，这里只说明「标注图没拿到」，不编造具体成因
      if (seq === loadSeq) {
        annotateError.value = `检测标注图生成失败（${httpHint(res.status)}），已回落到原图显示`
      }
      return
    }
    const blob = await res.blob()
    if (seq !== loadSeq) return
    if (!blob.size) {
      annotateError.value = '检测标注图内容为空，已回落到原图显示'
      return
    }
    revokeAnnotatedUrl()
    annotatedUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    if (seq === loadSeq) annotateError.value = `检测标注图请求失败：${errText(e)}，已回落到原图显示`
  } finally {
    // 同 runRecognize：迟到响应不得改变当前批次的加载态
    if (seq === loadSeq) annotateBusy.value = false
  }
}

/** 复制全文：成功时按钮文案变「已复制」，1.5s 后复原 */
async function copyText() {
  if (!ocrText.value) return
  const ok = await writeClipboard(ocrText.value)
  if (!ok) {
    message.warning('复制失败，请手动选中文本复制')
    return
  }
  copied.value = true
  if (copyTimer) window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copied.value = false
  }, 1500)
}

/**
 * 写系统剪贴板。
 *
 * <p>{@code navigator.clipboard} 只在安全上下文（https / localhost）存在：用
 * 「局域网 IP + 明文 HTTP」打开应用时它是 undefined，只写这一条路径的话内网用户点
 * 「复制」永远只得到一句失败提示。故用临时 textarea + execCommand 兜底。</p>
 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 被权限策略拒绝时走下面的兜底路径
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-1000px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

onBeforeUnmount(() => {
  // 递增批次号：仍在飞的响应回来后不会再往已卸载的组件里写状态
  loadSeq += 1
  revokeOriginalUrl()
  revokeAnnotatedUrl()
  if (copyTimer) window.clearTimeout(copyTimer)
})
</script>

<style scoped>
/* ============================================================================
   令牌口径与 FaceSearchPage 一致：
   1. 结构色（底 / 面 / 文字 / 边框 / 悬浮）全部走 --el-* 主题变量；
   2. 品牌色（主橙 + 辅青）是本页的身份标识（拖放区图标、按钮、开关），
      换成语义色会与主题主色混成一片，故保留色值，亮暗两套在 html.dark 分支各自固定；
   3. 卡片与常驻面板不加投影，层次由 1px 边框 + 留白表达；
      投影只留给真正「浮在图片上」的元素（开关滑块）。
   ============================================================================ */
.ocr-root {
  --ocr-brand: #f97316;
  --ocr-brand-2: #fb923c;
  --ocr-accent: #06b6d4;
  --ocr-accent-2: #14b8a6;

  --ocr-bg: var(--el-bg-color);
  --ocr-card: var(--el-bg-color);
  --ocr-text: var(--el-text-color-primary);
  --ocr-muted: var(--el-text-color-secondary);
  --ocr-border: var(--el-border-color-lighter);
  --ocr-hover: var(--el-fill-color-light);
  --ocr-radius: var(--el-radius-lg, 12px);
  --ocr-radius-sm: var(--el-radius-lg, 12px);

  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--ocr-bg);
  color: var(--ocr-text);
}

:global(html.dark) .ocr-root {
  --ocr-brand: #fb923c;
  --ocr-brand-2: #fdba74;
  --ocr-accent: #22d3ee;
  --ocr-accent-2: #2dd4bf;
}

.ocr-body {
  display: flex;
  gap: 24px;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

/* ---------------- 左：舞台 ---------------- */
.ocr-stage {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ocr-stage-inner {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-radius: var(--ocr-radius);
}

/* 拖拽高亮：用 outline 而不是 border —— 它不参与布局，
   高亮出现/消失时图片不会跟着抖一下 */
.ocr-stage-inner.is-dragover {
  outline: 2px dashed var(--ocr-accent);
  outline-offset: -6px;
}

.ocr-canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: var(--ocr-radius);
  overflow: hidden;
  background: var(--ocr-card);
  border: 1px solid var(--ocr-border);
}

.ocr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* 角标：贴在图片上，投影是「浮起来」的功能性提示 */
.ocr-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 5px 12px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--ocr-card);
  border: 1px solid var(--ocr-border);
  color: var(--ocr-muted);
  font-size: 12px;
  line-height: 18px;
}

/* 识别中遮罩：照片明暗不可控，底色从卡片色半透明派生而不是写死黑 */
.ocr-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: color-mix(in srgb, var(--ocr-card) 72%, transparent);
}

.ocr-mask-text {
  font-size: 14px;
  color: var(--ocr-muted);
}

/* 空态 */
.ocr-drop {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: var(--ocr-radius);
  border: 2px dashed var(--ocr-border);
  background: var(--ocr-card);
  cursor: pointer;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.ocr-drop:hover {
  border-color: var(--ocr-accent);
}

.ocr-drop-icon {
  color: var(--ocr-accent);
}

.ocr-drop-title {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
}

.ocr-drop-desc {
  margin: 0;
  font-size: 13px;
  color: var(--ocr-muted);
}

.ocr-drop-btn {
  margin-top: 10px;
}

/* 操作条 */
.ocr-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.ocr-btn {
  height: 46px;
  padding: 0 26px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 15px;
  font-weight: 600;
  border: none;
}

.ocr-btn-ghost {
  background: var(--ocr-card);
  color: var(--ocr-brand);
  border: 2px solid var(--ocr-brand);
}

.ocr-btn-brand {
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--ocr-accent-2), var(--ocr-accent));
}

.ocr-btn:disabled {
  opacity: 0.5;
}

/* ---------------- 检测框开关 ---------------- */
/* 原生 button + aria-pressed：一个二元开关不需要引入额外组件，
   也省得 el-switch 的类名成为验证时唯一可用的选择器 */
.ocr-box-toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--ocr-border);
  background: var(--ocr-card);
  color: var(--ocr-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.ocr-box-toggle:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.ocr-box-toggle:hover:not(:disabled) {
  border-color: var(--ocr-accent);
}

.ocr-box-toggle__track {
  position: relative;
  width: 34px;
  height: 18px;
  flex: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-darker);
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.ocr-box-toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-white);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-text-color-primary) 24%, transparent);
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}

/* 开启态：轨道换成身份色，滑块右移。轨道底色恒为青，故滑块固定纯白 */
.ocr-box-toggle.is-on {
  color: var(--ocr-accent);
  border-color: color-mix(in srgb, var(--ocr-accent) 45%, transparent);
}

.ocr-box-toggle.is-on .ocr-box-toggle__track {
  background: var(--ocr-accent);
}

.ocr-box-toggle.is-on .ocr-box-toggle__knob {
  transform: translateX(16px);
}

/* 标注图不可用：开关点了也只能得到原图，置灰并保留 title 说明原因 */
.ocr-box-toggle.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------------- 右：文本面板 ---------------- */
.ocr-panel {
  width: 400px;
  flex: 0 0 400px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
  box-sizing: border-box;
  border-radius: var(--ocr-radius);
  background: var(--ocr-card);
  border: 1px solid var(--ocr-border);
  /* 面板自身不滚：长文本由 .ocr-text 内部滚动，
     这样标题与复制按钮始终留在视野里 */
  overflow: hidden;
}

.ocr-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ocr-panel-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}

.ocr-dots {
  display: flex;
  gap: 4px;
}

.ocr-dots i {
  width: 5px;
  height: 5px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--ocr-accent);
}

/* 统计卡：数值全部来自后端 data.count / data.elapsedMs */
.ocr-stat {
  display: flex;
  gap: 10px;
  flex: none;
}

.ocr-stat-row {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--ocr-radius-sm);
  background: var(--ocr-hover);
  font-size: 12px;
}

.ocr-stat-k {
  color: var(--ocr-muted);
}

.ocr-stat-v {
  color: var(--ocr-text);
  font-weight: 600;
}

.ocr-text-bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ocr-text-hint {
  font-size: 11px;
  color: var(--ocr-muted);
}

/* 复制按钮：成功后文字变「已复制」并转 success 语义色，1.5s 复原 */
.ocr-copy {
  border-radius: var(--el-radius-full, 9999px);
}

.ocr-copy.is-copied {
  border-color: var(--el-color-success);
}

/*
  文本体：<pre> 自带换行保留，等宽字体 + 可选中，滚动条留在容器内部。
  white-space: pre-wrap 而不是 pre —— 识别出的长行必须能折行，
  否则用户要在横向滚动条里读一整段文字。
*/
.ocr-text {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 12px 14px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
  border-radius: var(--ocr-radius-sm);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--ocr-border);
  color: var(--ocr-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.75;
}

/* 识别中骨架 */
.ocr-skeleton {
  flex: 1 1 auto;
  min-height: 0;
  padding: 4px 2px;
}

.ocr-skeleton-text {
  margin: 14px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--ocr-muted);
}

/* 错误：可读中文原因，原样展示后端文案（模型未配置等） */
.ocr-error {
  flex: none;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--ocr-radius-sm);
  border: 1px solid var(--el-color-danger-light-7);
  background: var(--el-color-danger-light-9);
}

.ocr-error > .el-icon {
  flex: none;
  margin-top: 2px;
  color: var(--el-color-danger);
}

.ocr-error-body {
  min-width: 0;
}

.ocr-error-line {
  margin: 0 0 4px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.ocr-error-line:last-child {
  margin-bottom: 0;
}

/* 空态 */
.ocr-blank {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 12px;
  text-align: center;
}

.ocr-blank-icon {
  color: var(--ocr-border);
}

.ocr-blank-title {
  margin: 4px 0 0;
  font-weight: 600;
}

.ocr-blank-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ocr-muted);
}

.ocr-hidden {
  display: none;
}

/* 尊重系统「减少动态效果」偏好：只停本组件自身的过渡与位移 */
@media (prefers-reduced-motion: reduce) {
  .ocr-drop,
  .ocr-box-toggle,
  .ocr-box-toggle__track,
  .ocr-box-toggle__knob {
    transition: none;
  }
}

/* ==================== 模型不可用状态卡 ====================
   把「当前配置的模型」和「后端原文」摊开：环境问题不该被读成图片问题 */
.ocr-setup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 18px 18px 16px;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 10px;
  background: var(--el-color-warning-light-9);
}

.ocr-setup-icon {
  color: var(--el-color-warning);
}

.ocr-setup-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ocr-setup-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.ocr-setup-list {
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
  width: 100%;
}

.ocr-setup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.ocr-setup-k {
  flex: none;
  width: 92px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ocr-setup-v {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.ocr-setup-v.is-empty {
  color: var(--el-color-danger);
}

.ocr-setup-detail {
  margin: 2px 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}

/* 不可用时的上传空态：去掉可点击的暗示 */
.ocr-drop-icon.is-warn {
  color: var(--el-color-warning);
}

.ocr-drop.is-blocked {
  cursor: not-allowed;
}

.ocr-drop.is-blocked .ocr-drop-icon {
  opacity: 0.45;
}
</style>

