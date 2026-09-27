<template>
  <div class="wg">
    <section class="wg-main">
      <!-- 顶部工具条 -->
      <header class="wg-top">
        <!-- 图像 / 视频：站点自身的功能开关 -->
        <div class="wg-media-switch">
          <button
            type="button"
            class="wg-tab"
            :class="{ 'is-active': mediaType === 'image' }"
            @click="switchMedia('image')"
          >
            图像
          </button>
          <button
            type="button"
            class="wg-tab"
            :class="{ 'is-active': mediaType === 'video' }"
            @click="switchMedia('video')"
          >
            视频
          </button>
        </div>

        <label class="wg-search">
          <WgIcon :d="ICONS.search" />
          <input
            v-model="keyword"
            class="wg-search-input"
            type="search"
            placeholder="搜索提示词、描述"
            aria-label="搜索提示词、描述"
          />
        </label>

        <!-- 模型筛选：真下拉组件 -->
        <el-popover placement="bottom-start" :width="320" trigger="click" popper-class="wg-popper">
          <template #reference>
            <button type="button" class="wg-chip" title="按模型筛选">
              <span>{{ modelFilterLabel }}</span>
              <WgIcon :d="ICONS.chevron" />
            </button>
          </template>
          <div class="wg-menu">
            <p class="wg-menu-title">创作模型</p>
            <button
              v-for="opt in modelFilterOptions"
              :key="opt.key || 'all'"
              type="button"
              class="wg-menu-item"
              :class="{ 'is-active': modelFilter === opt.key }"
              @click="modelFilter = opt.key"
            >
              <span class="wg-menu-text">
                <span class="wg-menu-name">{{ opt.label }}</span>
                <span v-if="opt.desc" class="wg-menu-desc">{{ opt.desc }}</span>
              </span>
              <WgIcon v-if="modelFilter === opt.key" :d="ICONS.check" class="wg-menu-check" />
            </button>
          </div>
        </el-popover>

        <!-- 状态筛选 -->
        <el-popover placement="bottom-start" :width="220" trigger="click" popper-class="wg-popper">
          <template #reference>
            <button type="button" class="wg-chip" title="按状态筛选">
              <span>{{ statusFilterLabel }}</span>
              <WgIcon :d="ICONS.chevron" />
            </button>
          </template>
          <div class="wg-menu">
            <p class="wg-menu-title">状态</p>
            <button
              v-for="opt in STATUS_OPTIONS"
              :key="opt.key || 'all'"
              type="button"
              class="wg-menu-item"
              :class="{ 'is-active': statusFilter === opt.key }"
              @click="statusFilter = opt.key"
            >
              <span class="wg-menu-text"><span class="wg-menu-name">{{ opt.label }}</span></span>
              <WgIcon v-if="statusFilter === opt.key" :d="ICONS.check" class="wg-menu-check" />
            </button>
          </div>
        </el-popover>

        <button
          type="button"
          class="wg-chip is-icon"
          :class="{ 'is-strong': onlyFavorite }"
          :aria-pressed="onlyFavorite"
          title="仅收藏"
          @click="onlyFavorite = !onlyFavorite"
        >
          <WgIcon :d="ICONS.star" />
          <span>仅收藏</span>
        </button>

        <div class="wg-top-right">
          <el-popover placement="bottom-end" :width="200" trigger="click" popper-class="wg-popper">
            <template #reference>
              <button type="button" class="wg-chip" title="排序">
                <span>{{ sortLabel }}</span>
                <WgIcon :d="ICONS.chevron" />
              </button>
            </template>
            <div class="wg-menu">
              <p class="wg-menu-title">排序</p>
              <button
                v-for="opt in SORT_OPTIONS"
                :key="opt.key"
                type="button"
                class="wg-menu-item"
                :class="{ 'is-active': sortOrder === opt.key }"
                @click="sortOrder = opt.key"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">{{ opt.label }}</span></span>
                <WgIcon v-if="sortOrder === opt.key" :d="ICONS.check" class="wg-menu-check" />
              </button>
            </div>
          </el-popover>

          <div class="wg-views">
            <button
              type="button"
              class="wg-view"
              :class="{ 'is-active': viewStyle === 'list' }"
              aria-label="列表视图"
              title="列表视图"
              @click="viewStyle = 'list'"
            >
              <WgIcon :d="ICONS.list" />
            </button>
            <button
              type="button"
              class="wg-view"
              :class="{ 'is-active': viewStyle === 'grid' }"
              aria-label="网格视图"
              title="网格视图"
              @click="viewStyle = 'grid'"
            >
              <WgIcon :d="ICONS.grid" />
            </button>
          </div>
        </div>
      </header>

      <!-- 结果画布 -->
      <div ref="canvasRef" class="wg-canvas">
        <!-- 生成中：与结果行同构（占位卡 + 信息面板），置于最顶部 -->
        <div v-if="runningTasks.length" class="wg-running">
          <section v-for="item in runningTasks" :key="item.taskId" class="wg-row">
            <div class="wg-row-media">
              <figure class="wg-card">
                <div class="wg-generating" :style="{ aspectRatio: aspectOf(item.size) }">
                  <span class="wg-spark"><WgIcon :d="ICONS.sparkle" /></span>
                  <span class="wg-pct">{{ stageText(item) }}</span>
                  <span class="wg-pct-num">{{ item.progress ?? 0 }}%</span>
                </div>
              </figure>
            </div>

            <GenerateTaskInfo
              :task="item"
              running
              :model-label="modelLabel"
              :format-elapsed="formatElapsed"
              :format-time="formatTime"
            />
          </section>
        </div>

        <!-- 结果：一次请求一行，图片从左到右，最右是本行参数 -->
        <div v-if="resultRows.length" class="wg-rows" :class="{ 'is-grid': viewStyle === 'grid' }">
          <section v-for="row in resultRows" :key="row.taskId" class="wg-row">
            <div class="wg-row-media" v-viewer="viewerOptions">
              <figure v-for="entry in row.items" :key="entry.key" class="wg-card">
                <video
                  v-if="row.type === 'video'"
                  :src="entry.url"
                  class="wg-media"
                  controls
                  preload="metadata"
                />
                <img v-else :src="entry.url" class="wg-media" :alt="row.prompt" loading="lazy" />
                <figcaption class="wg-card-actions">
                  <button
                    type="button"
                    class="wg-icon"
                    aria-label="下载"
                    title="下载"
                    @click="download(entry.url, row.type)"
                  >
                    <WgIcon :d="ICONS.download" />
                  </button>
                  <button
                    type="button"
                    class="wg-icon"
                    aria-label="再次生成"
                    title="再次生成"
                    :disabled="row.task.status === 'RUNNING'"
                    @click="remake(row.task)"
                  >
                    <WgIcon :d="ICONS.refresh" />
                  </button>
                  <button
                    type="button"
                    class="wg-icon"
                    aria-label="做同款"
                    title="做同款"
                    @click="sameStyle(row.task)"
                  >
                    <WgIcon :d="ICONS.sparkle" />
                  </button>
                </figcaption>
              </figure>
            </div>

            <GenerateTaskInfo
              :task="row.task"
              :model-label="modelLabel"
              :format-elapsed="formatElapsed"
              :format-time="formatTime"
            />
          </section>
        </div>

        <p v-if="!runningTasks.length && !resultRows.length" class="wg-empty">
          还没有作品，描述你想象的场景，开始生成
        </p>
      </div>

      <!-- 输入条：直接复用会话的 ChatInput 外观骨架（generate/GenerateComposer.vue） -->
      <footer class="wg-composer">
        <GenerateComposer
          v-model:value="prompt"
          :busy="submitting"
          :placeholder="placeholder"
          @submit="onComposerSubmit"
          @pick-reference="pickReference"
        >
          <!-- 参数芯片：模型 / 分辨率 / 比例 / 时长 / 张数 / 风格 -->
          <template #buttons>
            <el-popover placement="top-start" :width="300" trigger="click" popper-class="wg-popper">
              <template #reference>
                <button type="button" class="wg-chip is-strong" title="创作模型">
                  <span>{{ modelLabel(model) }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">创作模型</p>
                <button
                  v-for="opt in currentModels"
                  :key="opt.model"
                  type="button"
                  class="wg-menu-item"
                  :class="{ 'is-active': model === opt.model }"
                  @click="pickModel(opt.model)"
                >
                  <span class="wg-menu-text">
                    <span class="wg-menu-name">{{ modelLabel(opt.model) }}</span>
                    <span class="wg-menu-desc">{{ opt.providerName }}</span>
                  </span>
                  <WgIcon v-if="model === opt.model" :d="ICONS.check" class="wg-menu-check" />
                </button>
              </div>
            </el-popover>

            <!-- 分辨率 + 比例 -->
            <el-popover
              v-if="sizes.length"
              placement="top-start"
              :width="300"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button type="button" class="wg-chip" title="分辨率与比例">
                  <span>{{ size || sizes[0] }}<template v-if="activeRatio"> · {{ activeRatio }}</template></span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">设置</p>
                <div class="wg-seg">
                  <button
                    v-for="item in sizes"
                    :key="item"
                    type="button"
                    class="wg-seg-item"
                    :class="{ 'is-active': size === item }"
                    @click="size = item"
                  >
                    {{ resolutionLabel(item) }}
                  </button>
                </div>
                <div v-if="ratios.length" class="wg-ratio-grid">
                  <button
                    v-for="item in ratios"
                    :key="item"
                    type="button"
                    class="wg-ratio"
                    :class="{ 'is-active': activeRatio === item }"
                    :aria-pressed="activeRatio === item"
                    @click="pickRatio(item)"
                  >
                    <span class="wg-ratio-box" :style="ratioBoxStyle(item)"></span>
                    <span class="wg-ratio-label">{{ item }}</span>
                  </button>
                </div>
              </div>
            </el-popover>

            <!-- 时长（视频） -->
            <el-popover
              v-if="mediaType === 'video' && durations.length"
              placement="top-start"
              :width="300"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button type="button" class="wg-chip" title="时长">
                  <span>{{ duration || durations[0] }}s</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">时长</p>
                <el-slider
                  :model-value="duration || durations[0]"
                  :min="Math.min(...durations)"
                  :max="Math.max(...durations)"
                  :step="1"
                  :marks="durationMarks"
                  @update:model-value="onDurationPick"
                />
              </div>
            </el-popover>

            <!-- 张数 -->
            <el-popover
              v-if="mediaType === 'image'"
              placement="top-start"
              :width="180"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button type="button" class="wg-chip" title="张数">
                  <span>{{ count }} 张</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">张数</p>
                <button
                  v-for="n in countOptions"
                  :key="n"
                  type="button"
                  class="wg-menu-item"
                  :class="{ 'is-active': count === n }"
                  @click="count = n"
                >
                  <span class="wg-menu-text"><span class="wg-menu-name">{{ n }} 张</span></span>
                  <WgIcon v-if="count === n" :d="ICONS.check" class="wg-menu-check" />
                </button>
              </div>
            </el-popover>

            <!-- 风格：缩略图为真实生成图 -->
            <el-popover
              v-if="mediaType === 'image'"
              placement="top-start"
              :width="360"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button
                  type="button"
                  class="wg-chip"
                  :class="{ 'is-strong': !!style }"
                  title="风格模板"
                >
                  <span>{{ styleLabel }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">风格</p>
                <div class="wg-style-grid">
                  <button
                    v-for="item in STYLE_TEMPLATES"
                    :key="item.key || 'none'"
                    type="button"
                    class="wg-style"
                    :class="{ 'is-active': style === item.key }"
                    :aria-pressed="style === item.key"
                    @click="pickStyle(item.key)"
                  >
                    <span class="wg-style-thumb">
                      <img
                        v-if="stylePreview(item.key)"
                        :src="stylePreview(item.key)"
                        :alt="item.name"
                        loading="lazy"
                      />
                      <span v-else class="wg-style-fallback">{{ item.name }}</span>
                    </span>
                    <span class="wg-style-name">{{ item.name }}</span>
                  </button>
                </div>
              </div>
            </el-popover>
          </template>
        </GenerateComposer>

        <!-- 参考图缩略图：挂在输入条上方 -->
        <figure v-if="referenceImage" class="wg-ref">
          <img :src="referenceImage" alt="参考图" />
          <button
            type="button"
            class="wg-ref-del"
            aria-label="移除参考图"
            title="移除"
            @click="referenceImage = ''"
          >
            <WgIcon :d="ICONS.close" />
          </button>
        </figure>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="wg-file"
          @change="onFilePicked"
        />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onActivated, onMounted, onUnmounted, ref } from 'vue'
import { apiService } from '../../services/ApiService'
import type { GenerateModel, GenerateTask, GenerateTaskStatus } from '../../services/modules/generate.api'
import vViewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'
import GenerateComposer from './GenerateComposer.vue'
import GenerateTaskInfo from './GenerateTaskInfo.vue'
import { ElMessage } from 'element-plus'

/**
 * 内联 SVG 图标（Heroicons 24 outline 风格）。
 *
 * 统一走 currentColor，颜色由外层 CSS 变量决定，图标本身不带颜色。
 */
const ICONS: Record<string, string> = {
  check: 'm4.5 12.75 6 6 9-13.5',
  chevron: 'm19.5 8.25-7.5 7.5-7.5-7.5',
  download: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
  refresh:
    'M16.023 9.348h4.992M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
  sparkle:
    'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z',
  image:
    'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z',
  close: 'M6 18 18 6M6 6l12 12',
  at: 'M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25',
  search: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
  send: 'M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18',
  star: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z',
  list: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  grid: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
}

/** 线性图标组件：统一尺寸与描边，颜色继承 currentColor */
const WgIcon = (props: { d: string }) =>
  h(
    'svg',
    {
      class: 'wg-svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    [h('path', { d: props.d })],
  )

/** 状态筛选项 */
const STATUS_OPTIONS: ReadonlyArray<{ key: GenerateTaskStatus | ''; label: string }> = [
  { key: '', label: '全部状态' },
  { key: 'RUNNING', label: '生成中' },
  { key: 'SUCCESS', label: '已完成' },
  { key: 'FAILED', label: '失败' },
  { key: 'CANCELED', label: '已取消' },
]

/** 排序项 */
const SORT_OPTIONS = [
  { key: 'newest' as const, label: '最新优先' },
  { key: 'oldest' as const, label: '最早优先' },
]

/** 风格模板：缩略图取自真实生成结果，不用纯色占位 */
interface StyleTemplate {
  key: string
  name: string
}

const STYLE_TEMPLATES: ReadonlyArray<StyleTemplate> = [
  { key: '', name: '无风格' },
  { key: 'photo', name: '胶片写实' },
  { key: 'anime', name: '动漫二次元' },
  { key: 'ink', name: '国风水墨' },
  { key: 'cyber', name: '赛博霓虹' },
  { key: 'clay', name: '黏土立体' },
  { key: 'product', name: '商业产品' },
  { key: 'sketch', name: '铅笔线稿' },
  { key: 'pixel', name: '像素怀旧' },
]

/** v-viewer 配置：缩放 / 旋转 / 上下翻页 */
const viewerOptions = {
  toolbar: {
    zoomIn: 1,
    zoomOut: 1,
    oneToOne: 1,
    reset: 1,
    prev: 1,
    next: 1,
    rotateLeft: 1,
    rotateRight: 1,
    flipHorizontal: 1,
    flipVertical: 1,
  },
  movable: true,
  zoomable: true,
  scalable: false,
  transition: true,
  keyboard: true,
  tooltip: 1,
  zIndex: 4000,
} as const

const mediaType = ref<'image' | 'video'>('image')
const models = ref<GenerateModel[]>([])
const model = ref('')
const prompt = ref('')
const size = ref('')
const count = ref(1)
const duration = ref<number | undefined>(undefined)
const style = ref('')
const referenceImage = ref('')
const submitting = ref(false)

const tasks = ref<GenerateTask[]>([])
const keyword = ref('')
const modelFilter = ref('')
const statusFilter = ref<GenerateTaskStatus | ''>('')
const onlyFavorite = ref(false)
const sortOrder = ref<'newest' | 'oldest'>('newest')
const viewStyle = ref<'list' | 'grid'>('list')

const canvasRef = ref<HTMLElement | null>(null)
const promptRef = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

/** 轮询定时器句柄，卸载时统一清理 */
let pollTimer: ReturnType<typeof setTimeout> | null = null

const currentModels = computed(() => models.value.filter((item) => item.type === mediaType.value))
const currentConfig = computed(() => currentModels.value.find((item) => item.model === model.value)?.config)
const sizes = computed(() => currentConfig.value?.sizes ?? [])
const maxCount = computed(() => Math.max(1, currentConfig.value?.maxCount ?? 1))
const durations = computed(() => currentConfig.value?.durations ?? [])
const countOptions = computed(() => Array.from({ length: maxCount.value }, (_, i) => i + 1))

/** 把 "1792x1024" 约分成比例 "16:9" */
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

const ratioOf = (value: string | null) => {
  const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec((value ?? '').trim())
  if (!matched) {
    return ''
  }
  const w = Number(matched[1])
  const h = Number(matched[2])
  if (!w || !h) {
    return ''
  }
  const g = gcd(w, h)
  return `${w / g}:${h / g}`
}

/** 生成中占位卡按目标尺寸保持同比例，不写死方图 */
const aspectOf = (value: string | null) => {
  const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec((value ?? '').trim())
  return matched ? `${matched[1]} / ${matched[2]}` : '1 / 1'
}

const ratios = computed(() => {
  const set = new Set<string>()
  for (const item of sizes.value) {
    const r = ratioOf(item)
    if (r) {
      set.add(r)
    }
  }
  return [...set]
})

const activeRatio = computed(() => ratioOf(size.value))

const durationMarks = computed(() => {
  if (durations.value.length < 2) {
    return {}
  }
  const marks: Record<number, string> = {}
  for (const d of durations.value) {
    marks[d] = `${d}s`
  }
  return marks
})

const modelLabel = (value: string) => {
  if (!value) {
    return '选择模型'
  }
  const hit = models.value.find((item) => item.model === value)
  return hit?.alias || hit?.model || value
}

const styleLabel = computed(() => {
  const hit = STYLE_TEMPLATES.find((item) => item.key === style.value)
  return hit?.name ?? '无风格'
})

const placeholder = computed(() =>
  mediaType.value === 'image' ? '描述你所想象的场景...' : '描述你想要的视频内容...',
)


/** 分辨率文案："1024x1024" → "1K 方图" */
const resolutionLabel = (value: string) => {
  const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec((value ?? '').trim())
  if (!matched) {
    return value
  }
  const w = Number(matched[1])
  const h = Number(matched[2])
  const shortSide = Math.min(w, h)
  const level =
    shortSide >= 1440
      ? '2K'
      : shortSide >= 1024
        ? '1K'
        : shortSide >= 720
          ? '720P'
          : shortSide >= 480
            ? '480P'
            : `${shortSide}P`
  if (w === h) {
    return `${level} 方图`
  }
  return `${level} ${w > h ? '横' : '竖'}图`
}

/** 比例图标外框：按 W:H 撑开小矩形，最大边 18px */
const ratioBoxStyle = (value: string) => {
  const matched = /^(\d+)\s*:\s*(\d+)$/.exec((value ?? '').trim())
  if (!matched) {
    return { width: '18px', height: '18px' }
  }
  const w = Number(matched[1])
  const h = Number(matched[2])
  const scale = 18 / Math.max(w, h)
  return {
    width: `${Math.max(6, Math.round(w * scale))}px`,
    height: `${Math.max(6, Math.round(h * scale))}px`,
  }
}

/** 过滤 + 排序后的任务 */
const visibleTasks = computed(() => {
  let list = [...tasks.value]
  if (modelFilter.value) {
    list = list.filter((task) => task.model === modelFilter.value)
  }
  if (statusFilter.value) {
    list = list.filter((task) => task.status === statusFilter.value)
  }
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (task) =>
        (task.prompt ?? '').toLowerCase().includes(kw) || (task.model ?? '').toLowerCase().includes(kw),
    )
  }
  if (sortOrder.value === 'oldest') {
    list.reverse()
  }
  return list
})

/** 结果行：一次请求一行 */
const resultRows = computed(() =>
  visibleTasks.value
    .filter((task) => task.status === 'SUCCESS' && task.urls.length > 0)
    .map((task) => ({
      taskId: task.taskId,
      task,
      type: task.type,
      prompt: task.prompt,
      items: task.urls.map((url, index) => ({ key: `${task.taskId}-${index}`, url })),
    })),
)

/** 生成中：待处理 + 进行中 */
const runningTasks = computed(() =>
  visibleTasks.value.filter((task) => task.status === 'RUNNING' || task.status === 'PENDING'),
)

const modelFilterOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const task of tasks.value) {
    if (task.model) {
      seen.set(task.model, modelLabel(task.model))
    }
  }
  return [{ key: '', label: '全部模型', desc: '不过滤' }].concat(
    Array.from(seen.entries()).map(([key, label]) => ({ key, label, desc: '' })),
  )
})

const modelFilterLabel = computed(() => modelFilter.value ? modelLabel(modelFilter.value) : '全部模型')
const statusFilterLabel = computed(
  () => STATUS_OPTIONS.find((item) => item.key === statusFilter.value)?.label ?? '全部状态',
)
const sortLabel = computed(() => SORT_OPTIONS.find((item) => item.key === sortOrder.value)?.label ?? '最新优先')


const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

const formatTime = (value: number | null) => {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const formatElapsed = (value: number | null) => {
  if (value === null || value === undefined) {
    return '—'
  }
  return `${(value / 1000).toFixed(1)}s`
}

/** 进行中任务没有 elapsedMillis，用「现在 - 创建时间」实时估算 */

/**
 * 进行中任务的阶段文案。
 *
 * 进度由后端按真实可观测阶段写入（排队 / provider 计算 / base64 编码），
 * 这里只做展示翻译，不在前端凭空插值——那样出来的是假进度。
 */
const stageText = (task: GenerateTask) => {
  const value = task.progress ?? 0
  if (value <= 5) {
    return '排队中...'
  }
  if (value < 85) {
    return '模型生成中...'
  }
  if (value < 100) {
    return '结果编码中...'
  }
  return '即将完成...'
}

const pickModel = (value: string) => {
  model.value = value
  const list = models.value.find((item) => item.model === value)?.config?.sizes
  if (list?.length && !list.includes(size.value)) {
    size.value = list[0]
  }
}

/** 选比例：切到该比例下的第一个可用分辨率 */
const pickRatio = (value: string) => {
  const hit = sizes.value.find((item) => ratioOf(item) === value)
  if (hit) {
    size.value = hit
  }
}

/** 时长滑块回填：el-slider 可能给出数组，取第一个 */
const onDurationPick = (value: number | number[]) => {
  duration.value = Array.isArray(value) ? value[0] : value
}

const pickStyle = (key: string) => {
  style.value = key
}

/**
 * 风格缩略图：优先取该风格真实生成过的图；
 * 没有则按索引从全部真实结果里取一张，保证缩略图始终是真实画面而非纯色块。
 */
const stylePreview = (key: string) => {
  const pool = tasks.value.filter((task) => (task.urls?.length ?? 0) > 0)
  if (!pool.length) {
    return ''
  }
  const matched = key ? pool.filter((task) => task.style === key) : pool
  const source = matched.length ? matched : pool
  const index = key ? Math.abs(hashKey(key)) % source.length : 0
  return source[index]?.urls?.[0] ?? ''
}

/** 字符串稳定散列，保证同一风格每次拿到同一张图 */
const hashKey = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash
}

const switchMedia = (value: 'image' | 'video') => {
  if (mediaType.value === value) {
    return
  }
  mediaType.value = value
  model.value = ''
  size.value = ''
  duration.value = undefined
  void loadModels()
}


const pickReference = () => {
  fileInput.value?.click()
}

const onFilePicked = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    referenceImage.value = String(reader.result ?? '')
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const download = (url: string, type: 'image' | 'video') => {
  const a = document.createElement('a')
  a.href = url
  a.download = type === 'video' ? 'generate.mp4' : 'generate.png'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const remake = (task: GenerateTask) => {
  prompt.value = task.prompt
  model.value = task.model
  size.value = task.size ?? ''
  style.value = task.style ?? ''
  count.value = task.count ?? 1
  void nextTick(() => promptRef.value?.focus())
}

const sameStyle = (task: GenerateTask) => {
  style.value = task.style ?? ''
  model.value = task.model
  void nextTick(() => promptRef.value?.focus())
}

const loadModels = async () => {
  try {
    const list = await apiService.fetchGenerateModels(mediaType.value)
    models.value = list
    const keep = list.find((item) => item.model === model.value)
    const next = keep ?? list[0]
    if (next) {
      model.value = next.model
      const configSizes = next.config?.sizes ?? []
      if (!configSizes.includes(size.value)) {
        size.value = configSizes[0] ?? ''
      }
      if (!next.config?.durations?.length) {
        duration.value = undefined
      }
    }
  } catch {
    models.value = []
    model.value = ''
  }
}

const loadHistory = async () => {
  try {
    tasks.value = await apiService.fetchGenerateHistory(mediaType.value, 30)
  } catch {
    tasks.value = []
  }
}

/** 单任务轮询：终态后落回列表 */
const pollTask = async (taskId: string, attempt: number) => {
  try {
    const task = await apiService.fetchGenerateTask(taskId)
    if (task) {
      const index = tasks.value.findIndex((item) => item.taskId === taskId)
      if (index >= 0) {
        tasks.value.splice(index, 1, task)
      } else {
        tasks.value.unshift(task)
      }
      if (task.status === 'SUCCESS' || task.status === 'FAILED' || task.status === 'CANCELED') {
        return
      }
    }
  } catch {
    // 单次查询失败不终止轮询，达到上限后自然结束
  }
  if (attempt >= 90) {
    return
  }
  pollTimer = setTimeout(() => void pollTask(taskId, attempt + 1), 2000)
}

/** GenerateComposer 提交：提示词由编辑器传入 */
const onComposerSubmit = async (text: string) => {
  if (submitting.value) {
    return
  }
  if (!text.trim()) {
    ElMessage.warning('请先描述你想生成的画面')
    return
  }
  if (!model.value) {
    ElMessage.warning('请先选择生成模型')
    return
  }
  submitting.value = true
  try {
    const task = await apiService.createGenerateTask({
      type: mediaType.value,
      model: model.value,
      prompt: text.trim(),
      size: size.value || undefined,
      count: mediaType.value === 'image' ? count.value : undefined,
      duration: mediaType.value === 'video' ? (duration.value ?? durations.value[0]) : undefined,
      style: style.value || undefined,
      referenceImage: referenceImage.value || undefined,
    })
    tasks.value.unshift(task)
    prompt.value = ''
    await nextTick()
    // 滚到顶部，让「进行中」行第一时间可见
    canvasRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
    void pollTask(task.taskId, 0)
  } catch (error) {
    // 之前这里只有 finally，异常被静默吞掉，表现为「点了发送没反应」
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error(`生成请求失败：${message}`)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadModels()
  await loadHistory()
})

/**
 * keep-alive 缓存下重新进入页面时 onMounted 不会再次执行，
 * 这里补一次刷新，保证历史与模型是最新的。
 */
onActivated(async () => {
  if (!tasks.value.length) {
    await loadModels()
    await loadHistory()
  }
})

onUnmounted(() => {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
})
</script>

<style scoped>
.wg {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--color-page-bg, var(--el-bg-color-page));
  color: var(--color-text);
  /* 唯一的尺寸令牌：结果图与生成中占位卡共用，改这里全页等比变化 */
  --wg-media-h: 212px;
}

.wg-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ---------- 顶部工具条 ---------- */

.wg-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 20px 4px;
}

.wg-media-switch {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.wg-top-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.wg-search {
  display: flex;
  flex: 0 1 280px;
  align-items: center;
  gap: 6px;
  min-width: 170px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--size-dialog-rounded-radius);
  background: var(--color-input-bg);
  color: var(--color-text-gray);
  transition: all 0.2s;
}

.wg-search:focus-within {
  border-color: var(--color-primary);
}

.wg-search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  outline: none;
}

.wg-search-input::placeholder {
  color: var(--color-text-gray);
}

.wg-views {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--size-dialog-rounded-radius);
  background: var(--color-secondary-surface);
}

.wg-view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--size-dialog-rounded-radius);
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  transition: all 0.2s;
}

.wg-view:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-text);
}

.wg-view.is-active {
  background: var(--color-sidebar-bg-active);
  color: var(--color-primary);
}

.wg-tab {
  padding: 7px 16px;
  border: 0;
  border-radius: var(--size-dialog-rounded-radius);
  background: transparent;
  color: var(--color-text-gray);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.wg-tab:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-text);
}

.wg-tab.is-active {
  background: var(--color-sidebar-bg-active);
  color: var(--color-primary);
}

/* 参数芯片：与 chat-input/ChatInputToolbar.vue 的 .workspace-btn 同度量 */
.wg-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--size-dialog-rounded-radius);
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.wg-chip:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-primary);
}

/* 当前生效的参数：主题色浅底，与会话的"已激活"态一致 */
.wg-chip.is-strong {
  background: var(--color-sidebar-bg-active);
  color: var(--color-primary);
}

.wg-svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

/* ---------- 结果画布 ---------- */

.wg-canvas {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 20px 16px;
}

.wg-empty {
  margin: 48px 0;
  text-align: center;
  color: var(--color-text-gray);
  font-size: 14px;
}

/* 生成中 */
/* 进行中：与结果行同构，直接复用 .wg-row 的布局 */
.wg-running {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 18px;
}

.wg-generating {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  min-height: var(--wg-media-h);
  overflow: hidden;
  border-radius: var(--size-rounded-radius);
  color: var(--el-color-white);
  background:
    linear-gradient(
      115deg,
      color-mix(in srgb, var(--el-color-white) 16%, transparent) 0%,
      transparent 40%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary) 88%, var(--el-color-white) 12%) 0%,
      color-mix(in srgb, var(--el-color-primary) 42%, var(--el-color-black) 58%) 45%,
      color-mix(in srgb, var(--el-color-primary) 10%, var(--el-color-black) 90%) 100%
    );
  background-size: 220% 100%, 100% 100%;
  animation: wg-shimmer 3.2s linear infinite;
}

.wg-spark {
  display: flex;
  animation: wg-breathe 2.4s ease-in-out infinite;
}

.wg-spark .wg-svg {
  width: 26px;
  height: 26px;
}

/* 阶段文案在上、百分比在下，两行居中 */
.wg-pct {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.wg-pct-num {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}



/* 结果行：无背景卡。图片定高、面板 stretch 到同高，两者上下严格对齐 */
.wg-rows {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 图片 + 面板作为一组靠右，左侧留白由 justify-content 控制 */
.wg-row {
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  gap: 14px;
  max-width: 100%;
}

/* 面板按内容宽度收缩，不再拉满剩余空间 */
.wg-row-info {
  flex: 0 1 auto;
  width: clamp(240px, 30%, 340px);
}

.wg-row-media {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 10px;
}

/*
 * 图片卡：与输入库同族的表面令牌 + 大圆角，
 * 悬停/聚焦时描边走主题色，与 chat 输入区 focus 态一致。
 */
.wg-card {
  position: relative;
  display: flex;
  align-items: stretch;
  margin: 0;
  overflow: hidden;
  border-radius: var(--size-rounded-radius);
  background: var(--color-secondary-surface);
  transition: box-shadow 0.15s, transform 0.15s;
}

.wg-card:hover,
.wg-card:focus-within {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 34%, transparent);
}

.wg-card:hover {
  transform: translateY(-2px);
}

/* 图片：固定高度、宽度按原始比例自适应（方图即正方形），圆角由 .wg-card 裁切 */
.wg-media {
  display: block;
  box-sizing: border-box;
  width: auto;
  /* 卡片无边框，图片高度直接等于令牌值，与右侧面板严格等高 */
  height: var(--wg-media-h);
  max-width: 100%;
  border-radius: var(--size-rounded-radius);
  object-fit: contain;
}

.wg-card-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--el-radius-full);
  background: var(--el-overlay-color-light);
  opacity: 0;
  transition: opacity var(--el-transition-duration);
}

.wg-card:hover .wg-card-actions,
.wg-card:focus-within .wg-card-actions {
  opacity: 1;
}

/* 图标按钮：显式 flex 居中 + 零内边距，避免图标偏位 */
.wg-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--el-radius-full);
  background: transparent;
  color: var(--el-color-white);
  line-height: 1;
  cursor: pointer;
  transition: background var(--el-transition-duration);
}

.wg-icon:hover:not(:disabled) {
  background: var(--el-fill-color-light);
}

.wg-icon:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/*
 * 右侧信息面板：徽标 + 提示词标题 + 两列参数。
 * align-self: stretch 之外还要让内部内容可压缩，标题限 1 行，
 * 这样面板高度恒等于图片高度，两者在任意提示词长度下都严格对齐。
 */
/*
 * 右侧信息面板：与图片卡同高度对齐的关键是「两侧都不加边框」——
 * 边框会让盒模型多出 2px，导致 img 与 panel 恒差 2px。
 * 层级靠 --color-input-bg / --color-secondary-surface 的底色差区分。
 */

/* ---------- 输入条：整体合并进一个带背景色的框 ---------- */

.wg-composer {
  flex: 0 0 auto;
  padding: 8px 20px 16px;
}

/*
 * 输入库：与 chat/ChatInput.vue 的 .input-area 完全同构。
 * 变量名、圆角、内边距、边框、过渡全部照抄，不另立一套。
 */

.wg-composer-box:focus-within {
  border-color: var(--color-primary);
}



/* 工具按钮：与 chat/ChatInput.vue 的 .tool-btn 同变量、同悬停色 */

.wg-tool:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-primary);
}

.wg-ref {
  position: relative;
  flex: 0 0 auto;
  margin: 0;
}

.wg-ref img {
  display: block;
  width: 44px;
  height: 44px;
  border-radius: var(--size-dialog-rounded-radius);
  object-fit: cover;
}

.wg-ref-del {
  position: absolute;
  top: -6px;
  right: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: var(--el-radius-full);
  background: var(--el-color-danger);
  color: var(--el-color-white);
  line-height: 1;
  cursor: pointer;
}

.wg-ref-del .wg-svg {
  width: 11px;
  height: 11px;
}

/* 输入区：与 chat/ChatInput.vue 的 .message-editor .ProseMirror 同度量 */

.wg-input::placeholder {
  color: var(--el-text-color-placeholder, var(--color-text-gray));
}

/* 发送键：与 chat/ChatInput.vue 的 .send-btn 同为 50% 圆形 + 主色底 */

.wg-send:hover:not(:disabled) {
  opacity: 0.85;
}

.wg-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}


.wg-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}


/* ---------- 焦点态与动效降级 ---------- */

.wg-tab:focus-visible,
.wg-chip:focus-visible,
.wg-view:focus-visible,
.wg-tool:focus-visible,
.wg-icon:focus-visible,
.wg-send:focus-visible,
.wg-ref-del:focus-visible,
.wg-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

@keyframes wg-shimmer {
  from {
    background-position: 150% 0, 0 0;
  }
  to {
    background-position: -50% 0, 0 0;
  }
}

@keyframes wg-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wg-generating,
  .wg-spark {
    animation: none;
  }

  .wg-tab,
  .wg-chip,
  .wg-view,
  .wg-tool,
  .wg-icon,
  .wg-send,
  .wg-card-actions {
    transition: none;
  }
}

/* ---------- 响应式 ---------- */

@media (max-width: 1024px) {
  .wg-row {
    flex-direction: column;
    align-items: stretch;
  }

  .wg-row-info {
    flex: 1 1 auto;
  }
}

@media (max-width: 768px) {
  .wg-top,
  .wg-canvas,
  .wg-composer {
    padding-left: 12px;
    padding-right: 12px;
  }

  .wg-search {
    flex: 1 1 100%;
  }

  .wg {
    --wg-media-h: 118px;
  }


  .wg-chips {
    justify-content: flex-start;
  }
}
</style>

<style>
/*
 * popover 内容被 teleport 到 body，scoped 选择器够不到，
 * 因此下拉菜单相关样式放在非 scoped 块里。
 * 颜色全部走 koi / Element Plus 变量，明暗主题自动适配。
 */
.wg-popper.el-popper {
  padding: 8px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--size-dialog-rounded-radius);
  background: var(--color-input-bg);
  box-shadow: var(--el-box-shadow-light);
}

.wg-popper .wg-menu-title {
  margin: 0 0 6px;
  padding: 0 4px;
  color: var(--color-text-gray);
  font-size: 12px;
}

.wg-popper .wg-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--size-dialog-rounded-radius);
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.wg-popper .wg-menu-item:hover {
  background: var(--color-sidebar-bg-hover);
}

.wg-popper .wg-menu-item.is-active {
  background: var(--color-sidebar-bg-active);
  color: var(--color-primary);
}

.wg-popper .wg-menu-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wg-popper .wg-menu-name {
  font-size: 13px;
}

.wg-popper .wg-menu-desc {
  color: var(--color-text-gray);
  font-size: 12px;
}

.wg-popper .wg-menu-check {
  flex: 0 0 auto;
  color: var(--el-color-primary);
}

.wg-popper .wg-seg {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: var(--size-rounded-radius);
  background: var(--color-secondary-surface);
}

.wg-popper .wg-seg-item {
  flex: 1;
  padding: 6px 4px;
  border: 0;
  border-radius: var(--size-dialog-rounded-radius);
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}

.wg-popper .wg-seg-item.is-active {
  background: var(--color-primary);
  color: var(--el-color-white);
}

.wg-popper .wg-ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin-top: 8px;
}

.wg-popper .wg-ratio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--size-dialog-rounded-radius);
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  transition: all 0.15s;
}

.wg-popper .wg-ratio:hover {
  background: var(--color-sidebar-bg-hover);
}

.wg-popper .wg-ratio.is-active {
  border-color: var(--color-primary);
  background: var(--color-sidebar-bg-active);
  color: var(--color-primary);
}

.wg-popper .wg-ratio-box {
  display: block;
  border: 1.5px solid currentColor;
  border-radius: 2px;
}

.wg-popper .wg-ratio-label {
  font-size: 11px;
}

.wg-popper .wg-style-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.wg-popper .wg-style {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--size-dialog-rounded-radius);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.wg-popper .wg-style:hover {
  background: var(--color-sidebar-bg-hover);
}

.wg-popper .wg-style.is-active {
  border-color: var(--color-primary);
  background: var(--color-sidebar-bg-active);
}

.wg-popper .wg-style-thumb {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--size-dialog-rounded-radius);
  background: var(--color-secondary-surface);
  overflow: hidden;
}

.wg-popper .wg-style-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 暂无真实图时的兜底：显示风格名，不画假色块 */
.wg-popper .wg-style-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-gray);
  font-size: 12px;
  text-align: center;
}

.wg-popper .wg-style-name {
  color: var(--el-text-color-regular);
  font-size: 12px;
  text-align: center;
}

/* v-viewer 皮肤跟随 koi 变量 */
.viewer-backdrop {
  background-color: var(--el-overlay-color);
}

.viewer-toolbar > ul > li {
  background-color: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
}
</style>
