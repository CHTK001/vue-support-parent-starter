<template>
  <!--
    以图搜图 · 图像底库管理（管理员）

    底库是**全局共享资源**，任何人都能改就等于向量索引可被任意污染，而检索结果的
    准确度完全依赖它。所以管理动作（上传 / 删除 / 批量删除）收敛到这里，
    检索页只保留「查询」。

    ★ 只做管理员可见：父组件用 isAdmin() 控制挂载，这里再兜一层，
      避免将来被别处复用时漏掉鉴权。后端接口也都带 @Permission("admin")，
      前后端双保险 —— 前端隐藏只是体验，真正的闸门在后端。

    ★ 本组件只渲染「内容区」：左侧导航与顶部栏由宿主提供，这里不重复实现。

    令牌口径统一走 koi 三层变量：--el-*（Element Plus 运行时）
    → --theme-*（框架令牌） → --rm-*（Modern），不写死色值/圆角/时长。
  -->
  <div class="lib-page">
    <!-- ── 页头 ───────────────────────────────────────────── -->
    <header class="lib-head">
      <div class="lib-head-text">
        <h2 class="lib-head-title">图像底库</h2>
        <p class="lib-head-sub">以图搜图的检索底库，上传图片后自动提取特征向量入库</p>
      </div>
      <div class="lib-head-actions">
        <el-button :disabled="loading" @click="refresh">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="primary" :disabled="!available || uploading" @click="pickFiles">
          <el-icon><Upload /></el-icon>上传图片
        </el-button>
      </div>
    </header>

    <!--
      模型未就绪 / 配置的模型不在可用清单里：给一条能直接走通的入口，
      而不是只留一句「请去配置」。底库没有特征模型就没有任何可用能力 ——
      上传必然失败、检索必然为空，此时整页只留这句引导，不摆一堆空控件。
    -->
    <section v-if="blockedReason" class="lib-blocked">
      <el-icon class="lib-blocked-icon"><WarningFilled /></el-icon>
      <h3 class="lib-blocked-title">{{ blockedReason.title }}</h3>
      <p class="lib-blocked-desc">{{ blockedReason.desc }}</p>
      <p class="lib-blocked-current">
        当前配置的图像特征模型：<strong>{{ modelName || '（未配置）' }}</strong>
      </p>
      <el-button type="primary" @click="goModelConfig">
        <el-icon><Setting /></el-icon>去配置模型
      </el-button>
    </section>

    <template v-else>
    <!-- ── 统计卡 ─────────────────────────────────────────── -->
    <section class="lib-stats">
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-primary"><Picture /></el-icon>
        <span class="lib-stat-label">图片总数</span>
        <strong class="lib-stat-value">{{ total }}</strong>
      </div>
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-success"><CircleCheck /></el-icon>
        <span class="lib-stat-label">特征已入库</span>
        <strong class="lib-stat-value">{{ statWithOriginal }}</strong>
      </div>
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-warning"><Warning /></el-icon>
        <span class="lib-stat-label">仅缩略图待处理</span>
        <strong class="lib-stat-value">{{ statThumbOnly }}</strong>
      </div>
      <div class="lib-stat">
        <el-icon class="lib-stat-icon is-info"><Files /></el-icon>
        <span class="lib-stat-label">占用体积</span>
        <strong class="lib-stat-value">{{ statSizeText }}</strong>
      </div>
    </section>

    <!-- ── 上传区 ─────────────────────────────────────────── -->
    <section class="lib-upload">
      <div class="lib-drop" :class="{ 'is-drag': dragging }" @click="pickFiles"
        @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
        <el-icon class="lib-drop-icon"><UploadFilled /></el-icon>
        <p class="lib-drop-main">把图片拖到这里，或点击选择</p>
        <p class="lib-drop-sub">支持 PNG、JPG，可多选，入库后自动提取特征</p>
      </div>
      <ul class="lib-tips">
        <li><el-icon><CircleCheck /></el-icon>自动提取特征向量</li>
        <li><el-icon><CircleCheck /></el-icon>异常可单独重试</li>
        <li><el-icon><CircleCheck /></el-icon>重复图片自动标记</li>
      </ul>
    </section>

    <input ref="fileInput" type="file" accept="image/png,image/jpeg" multiple class="lib-hidden"
      @change="onPicked" />

    <!-- 上传进度：串行入库，进度按第几张给，比转圈更能说明还要等多久 -->
    <div v-if="uploading" class="lib-progress">
      <el-progress :percentage="progress" :stroke-width="6" />
      <span class="lib-progress-text">{{ progressText }}</span>
    </div>

    <!-- ── 列表区 ─────────────────────────────────────────── -->
    <section class="lib-panel">
      <!-- 标题与检索控件同一行：标题居左、控件居右，与设计图一致 -->
      <div class="lib-toolbar">
        <div class="lib-panel-title">
          图片列表
          <span class="lib-panel-count">共 {{ total }} 张</span>
        </div>

        <el-input v-model="keyword" placeholder="按名称/关键词检索" clearable class="lib-search"
          @keyup.enter="applyKeyword" @clear="applyKeyword">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select v-model="statusFilter" class="lib-filter">
          <el-option label="全部状态" value="all" />
          <el-option label="特征已入库" value="original" />
          <el-option label="仅缩略图" value="thumbOnly" />
          <el-option label="重复图片" value="duplicate" />
        </el-select>

        <div class="lib-view-toggle">
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'grid' }"
            title="网格视图" @click="viewMode = 'grid'">
            <el-icon><Grid /></el-icon>
          </button>
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'list' }"
            title="列表视图" @click="viewMode = 'list'">
            <el-icon><Menu /></el-icon>
          </button>
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'table' }"
            title="表格视图（服务端分页，适合大量条目）" @click="viewMode = 'table'">
            <el-icon><Tickets /></el-icon>
          </button>
        </div>
      </div>

      <!-- 网格视图：viewerjs 挂在本容器上，点任意图即可缩放/左右切换 -->
      <div v-if="viewMode === 'grid'" ref="gridRef" v-loading="loading" class="lib-grid">
        <figure v-for="item in visibleItems" :key="item.id" class="lib-cell"
          :class="{ 'is-selected': selected.has(item.id) }">
          <div class="lib-thumb">
            <img :src="resolveUrl(item)" :alt="item.name" loading="lazy" />

            <!-- 勾选：批量删除的入口。点击不触发预览 -->
            <span class="lib-check" @click.stop="toggleSelect(item)">
              <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
            </span>

            <!-- 状态角标。特征向量人人都有（否则进不了库），
                 所以「已入库 / 仅缩略图」按 hasOriginal 区分展示口径 -->
            <span class="lib-badges">
              <span v-if="isDuplicate(item)" class="lib-badge is-dup">重复</span>
              <span v-if="item.hasOriginal" class="lib-badge is-ok">特征已入库</span>
              <span v-else class="lib-badge is-warn">仅缩略图</span>
            </span>

            <!-- hover 操作条：明暗不可控，固定深底保证图标可读 -->
            <div class="lib-actions">
              <button type="button" class="lib-act" title="查看原图" @click.stop="preview(item)">
                <el-icon><ZoomIn /></el-icon>
              </button>
              <button type="button" class="lib-act is-danger" title="删除" :disabled="busy"
                @click.stop="removeOne(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>

          <figcaption class="lib-meta">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
            <div v-if="item.tags && item.tags.length" class="lib-tags">
              <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="lib-tag" :title="tag">{{ tag }}</span>
              <span v-if="item.tags.length > 3" class="lib-tag is-more">+{{ item.tags.length - 3 }}</span>
            </div>
          </figcaption>
        </figure>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的图片"
          class="lib-empty" />
      </div>

      <!-- 列表视图：名称/规格/状态一览，条目多时比网格好扫 -->
      <div v-else-if="viewMode === 'list'" v-loading="loading" class="lib-list">
        <div v-for="item in visibleItems" :key="item.id" class="lib-row"
          :class="{ 'is-selected': selected.has(item.id) }">
          <span class="lib-check is-inline" @click.stop="toggleSelect(item)">
            <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
          </span>
          <img class="lib-row-thumb" :src="resolveUrl(item)" :alt="item.name" loading="lazy"
            @click="preview(item)" />
          <div class="lib-row-body">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
            <div v-if="item.tags && item.tags.length" class="lib-tags">
              <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="lib-tag" :title="tag">{{ tag }}</span>
              <span v-if="item.tags.length > 3" class="lib-tag is-more">+{{ item.tags.length - 3 }}</span>
            </div>
          </div>
          <span class="lib-badges is-inline">
            <span v-if="isDuplicate(item)" class="lib-badge is-dup">重复</span>
            <span v-if="item.hasOriginal" class="lib-badge is-ok">特征已入库</span>
            <span v-else class="lib-badge is-warn">仅缩略图</span>
          </span>
          <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
            @click.stop="removeOne(item)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的图片" />
      </div>

      <!--
        表格视图（ReTable）：后端分页/检索走 GET /image-search/list（page/size/keyword），
        状态筛选仍在页内做（后端 list 无该维度，与网格/列表同一口径）。
        列可显隐/拖列（ReTable 列配置持久化），带完整分页器（总数/跳页/每页条数）。
      -->
      <div v-else class="lib-table">
        <ReTable
          ref="tableRef"
          table-id="image-lib-table"
          :loader="tableLoader"
          :columns="tableColumns"
          :params="tableParams"
          :show-selection="true"
          :pagination="true"
          row-key="id"
          empty-text="没有符合条件的图片"
          @selection-change="onTableSelection"
        >
          <template #thumb="{ row }">
            <img class="lt-thumb" :src="resolveUrl(asItem(row))" :alt="String(row.name ?? '')" loading="lazy"
              @click="preview(asItem(row))" />
          </template>
          <template #name="{ row }">
            <span class="lib-name" :title="String(row.name ?? '')">{{ row.name || '未命名' }}</span>
          </template>
          <template #tags="{ row }">
            <div v-if="row.tags && row.tags.length" class="lib-tags">
              <span v-for="tag in (row.tags || []).slice(0, 3)" :key="tag" class="lib-tag" :title="tag">{{ tag }}</span>
              <span v-if="(row.tags || []).length > 3" class="lib-tag is-more">+{{ (row.tags || []).length - 3 }}</span>
            </div>
            <span v-else class="lib-muted">—</span>
          </template>
          <template #state="{ row }">
            <span class="lib-badges is-inline">
              <span v-if="isDuplicate(asItem(row))" class="lib-badge is-dup">重复</span>
              <span v-if="asItem(row).hasOriginal" class="lib-badge is-ok">特征已入库</span>
              <span v-else class="lib-badge is-warn">仅缩略图</span>
            </span>
          </template>
          <template #actions="{ row }">
            <div class="lt-actions">
              <button type="button" class="lib-act is-onlight" title="查看原图"
                @click.stop="preview(asItem(row))">
                <el-icon><ZoomIn /></el-icon>
              </button>
              <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
                @click.stop="removeOne(asItem(row))">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </ReTable>
      </div>

      <!-- 翻页（表格视图用 ReTable 自带分页器） -->
      <div v-if="viewMode !== 'table' && total > pageSize" class="lib-pager">
        <el-button :disabled="page <= 1 || loading" @click="load(page - 1)">上一页</el-button>
        <span class="lib-pager-text">{{ page }} / {{ pageCount }}</span>
        <el-button :disabled="page >= pageCount || loading" @click="load(page + 1)">下一页</el-button>
      </div>
    </section>

    <!-- ── 批量操作条：有选中才出现，避免常驻占位 ──────────────── -->
    <footer class="lib-batch" :class="{ 'is-visible': selected.size > 0 }">
      <span class="lib-batch-count">已选 {{ selected.size }} 张</span>
      <div class="lib-batch-actions">
        <el-button :disabled="busy" @click="clearSelection">取消选择</el-button>
        <el-button type="danger" :disabled="busy" @click="removeSelected">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>
    </footer>

    <!-- 底栏：把当前生效的检索参数亮出来，排查「搜不到」时先看这两个值 -->
    <div class="lib-foot">
      特征模型：{{ modelName || '未配置' }}
      <template v-if="minSimilarity !== null"> · 相似度下限 {{ minSimilarity }}</template>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  CircleCheck, Delete, Files, Grid, Menu, Picture, Refresh, Search, Select, Setting, Tickets, Upload,
  UploadFilled, Warning, WarningFilled, ZoomIn,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn, ReTableLoadParams, RePageResult } from '@repo/ui/re-table'
import { apiService } from '@/services/ApiService'
import { resolveImageUrl } from '@/utils/imageSearchUrl'
import { createAuthImageLoader } from '@/utils/authImage'
import { toErrorMessage } from '@/utils/errors'
import { usePopup } from '@/composables/usePopup'
import { useModelConfigStore } from '@/stores/modelConfig'

/**
 * 以图搜图图像底库管理面板。
 *
 * <p>依赖后端 admin 接口：{@code GET /image-search/status}、
 * {@code GET /image-search/list}、{@code POST /image-search/index}、
 * {@code DELETE /image-search/{id}}、{@code GET /image-search/{id}/image}。</p>
 *
 * <p>批量删除没有专门的批接口，逐个 DELETE 串行执行：条数由用户勾选决定，
 * 量级很小，串行能准确报出「成功几张、失败哪几张」，比并发后汇总错误更有用。
 * 后端 {@code remove} 对不存在的 id 返回业务错误码，重复删除也不会误报成功。</p>
 */

interface ImageItem {
  id: number
  name?: string
  tags?: string[]
  thumbnail?: string | null
  url?: string | null
  /** 后端是否留有原图；false 表示只能看缩略图 */
  hasOriginal?: boolean
  width?: number
  height?: number
  /** 原图字节数；历史记录为 null（未知） */
  size?: number | null
}

const { toast, confirm } = usePopup()
const router = useRouter()

const fileInput = ref<HTMLInputElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const items = ref<ImageItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(24)
const keyword = ref('')
const statusFilter = ref<'all' | 'original' | 'thumbOnly' | 'duplicate'>('all')
const viewMode = ref<'grid' | 'list' | 'table'>('grid')
/** 已提交的检索词（回车/清空生效）：网格与表格共用同一口径 */
const kwApplied = ref('')
/** 表格视图实例：删除/上传后让它重新拉当页、清空它的勾选 */
const tableRef = ref<{ reload: () => void; clearAllSelection: () => void } | null>(null)
const loading = ref(false)
const busy = ref(false)
const dragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const progressText = ref('')
/** null = 尚未探测；false = 未配置特征模型 */
const available = ref<boolean | null>(null)
const modelName = ref('')
const minSimilarity = ref<number | null>(null)
/** 模型配置门禁：可用性与模型名都以「是否真的配置过」为准，种子默认值不算配置 */
const modelConfig = useModelConfigStore()
/**
 * 配置的模型是否出现在能力清单里。
 *
 * <p>null = 未探测/查询失败（不据此拦页面）；true/false = 权威结论。</p>
 *
 * <p>为什么要单独查：{@code /status} 只回答「配置项填了没有」，它读的是配置串本身。
 * 填了一个并不存在、或没被注册进模型清单的名字，它照样说 available=true ——
 * 用户按这个去配置页只能看到空白选项，却不知道问题在哪。能力清单
 * {@code /v2/ai/models/capability/feature} 才是「这个模型能不能被选用」的判据。</p>
 */
const modelRegistered = ref<boolean | null>(null)
/** 勾选中的记录 id，批量删除的作用域 */
const selected = ref<Set<number>>(new Set())

/** viewerjs 实例：挂在网格容器上，负责缩放与左右切换 */
let viewer: Viewer | null = null

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

/**
 * 是否该把整页拦成「去配置模型」。
 *
 * <p>两种情况都拦：① 压根没配特征模型；② 配了但名字不在能力清单里。
 * 二者对用户都是「不可用」，区别只在文案 —— 第二种若不说明，
 * 用户会以为自己配对了却仍然搜不到，比没配更让人困惑。</p>
 */
const blockedReason = computed<{ title: string; desc: string } | null>(() => {
  if (available.value === false || modelRegistered.value === false) {
    return {
      title: modelRegistered.value === false ? '图像特征模型不可用' : '以图搜图未启用',
      desc:
        modelRegistered.value === false
          ? '配置的图像特征模型不在后端可用模型清单中，上传与检索都会失败。请到模型配置页改选一个已注册的图像特征模型。'
          : '图像底库需要「图像特征模型」才能提取特征。当前未配置，上传与检索都不可用。',
    }
  }
  // available === null 表示仍在探测，避免闪烁先不拦
  return null
})

/**
 * 跳到模型配置页。
 *
 * <p>底库没有特征模型时没有任何可用能力，光提示「请去配置」等于把用户丢在原地，
 * 所以给一个能直接走通的入口。</p>
 */
function goModelConfig() {
  router.push({ name: 'SystemSettings', params: { tab: 'default-models' } })
}

const statWithOriginal = computed(() => items.value.filter((x) => x.hasOriginal).length)
const statThumbOnly = computed(() => items.value.filter((x) => !x.hasOriginal).length)

/** 已知体积求和；历史记录 size 为 null 的不计入，避免把未知当 0 */
const statSizeText = computed(() => {
  const known = items.value.map((x) => x.size).filter((n): n is number => typeof n === 'number' && n > 0)
  if (!known.length) {
    return '—'
  }
  return formatSize(known.reduce((a, b) => a + b, 0))
})

/**
 * 重复图片指纹。
 *
 * <p>用缩略图内容算指纹而不是按文件名判断：同名不同图、不同名同图都很常见，
 * 只有「像素内容一致」才是真正的重复。缩略图是原图等比缩放的 JPEG base64，
 * 同图必然同串（同一后端、同一压缩参数），据此可稳定识别。</p>
 */
const duplicateIds = computed(() => {
  const seen = new Map<string, number[]>()
  for (const item of items.value) {
    const key = item.thumbnail
    if (!key) {
      continue
    }
    const list = seen.get(key) || []
    list.push(item.id)
    seen.set(key, list)
  }
  const dup = new Set<number>()
  for (const list of seen.values()) {
    if (list.length > 1) {
      list.forEach((id) => dup.add(id))
    }
  }
  return dup
})

function isDuplicate(item: ImageItem): boolean {
  return duplicateIds.value.has(item.id)
}

/** 状态筛选在前端做：底库条数不大，后端 list 未提供该维度 */
const visibleItems = computed(() => {
  if (statusFilter.value === 'all') {
    return items.value
  }
  if (statusFilter.value === 'original') {
    return items.value.filter((x) => x.hasOriginal)
  }
  if (statusFilter.value === 'thumbOnly') {
    return items.value.filter((x) => !x.hasOriginal)
  }
  return items.value.filter((x) => isDuplicate(x))
})

/**
 * 取可直接给 img.src 用的地址。
 *
 * <p>实现收敛在 {@link resolveImageUrl} + {@link authImages}：检索页此前各写了一份
 * 并漏掉 baseURL 与令牌，搜出来的图整片裂开，而本面板是好的。两处共用即不会再漂移。</p>
 *
 * <p><b>令牌不再进 URL</b>（原实现拼 `?x-oauth-token=…`）：
 * 查询参数会进浏览器历史、Nginx / 网关 / WAF 日志，以及最致命的 Referer ——
 * 本页面能跳到外链，点一下就把整个 accessToken 送出去了。
 * 现在由 {@link authImages} 用 fetch 带请求头取图并转 blob 地址。</p>
 */
const authImages = createAuthImageLoader()

function resolveUrl(item: ImageItem): string {
  return resolveImageUrl(item, authImages)
}

/**
 * 字节数格式化。
 *
 * @param bytes 字节数
 * @returns 人类可读体积；非正数返回「未知」
 */
function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '未知'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 「640×480 · 186 KB」；缺哪项就少显示哪项，不留空洞 */
function formatMeta(item: ImageItem): string {
  const parts: string[] = []
  if (item.width && item.height) {
    parts.push(`${item.width}×${item.height}`)
  }
  if (typeof item.size === 'number' && item.size > 0) {
    parts.push(formatSize(item.size))
  }
  return parts.length ? parts.join(' · ') : '规格未知'
}

function pickFiles() {
  fileInput.value?.click()
}

function toggleSelect(item: ImageItem) {
  const next = new Set(selected.value)
  if (next.has(item.id)) {
    next.delete(item.id)
  } else {
    next.add(item.id)
  }
  selected.value = next
}

function clearSelection() {
  selected.value = new Set()
  // 表格视图有自己的勾选状态，不同步清会留下「看着没选、批量还删」的幽灵态
  tableRef.value?.clearAllSelection()
}

/**
 * 检索词提交（回车/清空触发）。
 *
 * <p>与网格一致：输入过程中不打服务端，提交后一次查询。表格视图通过
 * {@link tableParams} 感知变化自动回第 1 页重查。</p>
 */
function applyKeyword() {
  kwApplied.value = keyword.value.trim()
  if (viewMode.value !== 'table') void load(1)
}

/* ── 表格视图（ReTable · 后端分页/检索；状态筛选仍按页内口径，同网格） ── */

/** 表格参数：检索词/状态变化 → ReTable 自动回第 1 页重查 */
const tableParams = computed(() => ({
  keyword: kwApplied.value,
  status: statusFilter.value,
}))

/**
 * 表格行 → 图像条目（loader 已返回原始 ImageItem，这里只是槽位的类型收窄）。
 *
 * @param row 表格行
 * @return 图像条目
 */
function asItem(row: unknown): ImageItem {
  return row as ImageItem
}

/** 表格列：缩略图/名称/规格/体积/状态/操作（图像后端暂无排序字段，不开列排序） */
const tableColumns: ReTableColumn[] = [
  { prop: 'thumb', label: '图片', width: 76, slot: 'thumb', align: 'center' },
  { prop: 'name', label: '名称', minWidth: 160, slot: 'name', showOverflowTooltip: true },
  {
    prop: 'dims',
    label: '规格',
    width: 130,
    align: 'center',
    formatter: (row) => {
      const w = Number((row as Record<string, unknown>).width ?? 0)
      const h = Number((row as Record<string, unknown>).height ?? 0)
      return w && h ? `${w} × ${h}` : '—'
    },
  },
  {
    prop: 'size',
    label: '体积',
    width: 100,
    align: 'right',
    formatter: (_row, _col, cell) => (typeof cell === 'number' ? formatSize(cell) : '—'),
  },
  { prop: 'tags', label: '关键词', minWidth: 220, slot: 'tags' },
  { prop: 'state', label: '状态', width: 190, slot: 'state' },
  { prop: 'actions', label: '操作', width: 110, slot: 'actions', fixed: 'right', align: 'center' },
]

/**
 * 表格 loader：ReTable 注入 page/pageSize 与 params（{@link tableParams}）。
 *
 * <p>状态筛选后端 list 没有该维度，仍在**当页内**过滤 —— 与网格/列表
 * {@link visibleItems} 完全同口径（total 用服务端命中数）。</p>
 *
 * @param p ReTable 传入的分页与查询参数
 * @return 分页结果
 *
 * 返回类型保持裸 RePageResult：ReTableLoader 形参类型是非泛型的，
 * 声明成 RePageResult<ImageItem> 反而赋不过去（TS2322）。
 * 与全仓其余 26 个 loader 的写法一致，行类型在返回处显式收敛。
 */
async function tableLoader(p: ReTableLoadParams): Promise<RePageResult> {
  const params = (p.params ?? {}) as Record<string, unknown>
  const kw = String(params.keyword ?? '').trim()
  const st = String(params.status ?? 'all')
  const data = await apiService._request('/image-search/list', {
    params: { page: p.page, size: p.pageSize, keyword: kw || undefined },
  })
  const list: ImageItem[] = data?.items ?? []
  // 状态卡与重复指纹在表格模式下同样按「当页」口径（与网格一致），同步数据源
  items.value = list
  let out = list
  if (st === 'original') {
    out = list.filter((x) => x.hasOriginal)
  } else if (st === 'thumbOnly') {
    out = list.filter((x) => !x.hasOriginal)
  } else if (st === 'duplicate') {
    // 重复指纹基于当页缩略图计算，口径与网格一致
    const seen = new Set<string>()
    const dup = new Set<number>()
    for (const x of list) {
      if (!x.thumbnail) continue
      if (seen.has(x.thumbnail)) dup.add(x.id)
      seen.add(x.thumbnail)
    }
    out = list.filter((x) => dup.has(x.id))
  }
  // ImageItem 是带具体字段的展示行，对 RePageResult 的 Record<string, unknown> 形参做一次显式收敛；
  // 运行时值没有任何转换，ReTable 只按列的 prop 取字段，不受这个断言影响。
  return { total: data?.total ?? 0, items: out as unknown as Record<string, unknown>[] }
}

/**
 * 表格勾选 → 同步到批量删除条（与网格/列表共用同一个 {@link selected}）。
 *
 * @param rows 当前勾选的行
 */
function onTableSelection(rows: Array<Record<string, unknown>>) {
  selected.value = new Set(rows.map((r) => Number(r.id)))
}

async function onPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length) {
    await upload(files)
  }
}

async function onDrop(event: DragEvent) {
  dragging.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length) {
    await upload(files)
  }
}

/**
 * 逐张上传。
 *
 * <p>串行而不是并发：入库要跑特征提取（ONNX），并发只会互相抢 CPU/GPU
 * 反而更慢，还会把后端线程池打满。逐张串行顺带能给出准确的第几张进度。</p>
 */
/**
 * 上传前的体积与分辨率校验（5.5）。
 *
 * <p>此前这条路径**完全不做校验**：任何文件都直接 multipart 送去入库。后果有两头 ——
 * 一端是几十 KB 的小图照样入库、抽出了一个几乎恒等于噪声的特征向量，检索时永远不中，
 * 用户看到的是「明明传了这张图却搜不到」，无从判断是图太小还是模型不对；
 * 另一端是手机直出的 12MP 原图会顶到服务端 multipart 上限（100MB）整批失败。</p>
 *
 * <p>下限取 128px 短边：CLIP 类特征模型在这个尺寸以下基本没有可分辨语义；
 * 上限 20MB 兼顾清晰度与传输开销，超过的请用户先压缩。</p>
 */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const MIN_UPLOAD_EDGE = 128

/**
 * 校验单张图片是否可入库。
 *
 * @param file 待上传文件
 * @returns 通过返回 null，否则返回拒绝原因
 */
async function validateImage(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) {
    return '不是图片文件'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `体积 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过 20MB 上限，请压缩后再上传`
  }
  try {
    const size = await readImageSize(file)
    if (size && Math.min(size.w, size.h) < MIN_UPLOAD_EDGE) {
      return `分辨率 ${size.w}×${size.h} 过低，短边需不小于 ${MIN_UPLOAD_EDGE}px（过小的图提不出可用特征，检索时不会命中）`
    }
  } catch {
    // 尺寸读不出来不拦：让后端解码判据去兜底，它报出的错比这里更准
  }
  return null
}

/**
 * 读取图片像素尺寸。
 *
 * @param file 图片文件
 * @returns 宽高；读取失败时返回 null
 */
function readImageSize(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    const done = (v: { w: number; h: number } | null) => {
      URL.revokeObjectURL(url)
      resolve(v)
    }
    img.onload = () => done({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => done(null)
    img.src = url
  })
}

async function upload(files: File[]) {
  uploading.value = true
  progress.value = 0
  let ok = 0
  const failed: string[] = []
  // 进度以「通过校验的待传张数」为分母，避免被刷掉的文件把进度条顶住不动
  const accepted: File[] = []
  for (const file of files) {
    const reason = await validateImage(file)
    if (reason) {
      failed.push(`${file.name}：${reason}`)
    } else {
      accepted.push(file)
    }
  }
  if (!accepted.length) {
    uploading.value = false
    toast.error(`${failed.length} 张全部被拒：${failed.slice(0, 3).join('；')}`)
    return
  }
  try {
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i]
      progressText.value = `正在入库 ${i + 1}/${accepted.length}：${file.name}`
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('name', file.name)
        await apiService._request('/image-search/index', {
          method: 'POST',
          data: form,
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        ok++
      } catch (e: any) {
        failed.push(`${file.name}：${e?.message || '未知错误'}`)
      }
      progress.value = Math.round(((i + 1) / accepted.length) * 100)
    }
  } finally {
    uploading.value = false
    progress.value = 0
    progressText.value = ''
  }
  if (ok) {
    toast.success(`成功入库 ${ok} 张`)
  }
  if (failed.length) {
    // 逐条报出来，不要只给一句「部分失败」让人自己猜是哪几张
    toast.error(`${failed.length} 张未入库：${failed.slice(0, 3).join('；')}`)
  }
  // 全部被拒时不该再拉一次列表：服务端数据没变，白白闪一下加载态
  if (ok > 0) {
    await load(1)
  }
}

/**
 * 删除单张。
 *
 * @param item 待删记录
 */
async function removeOne(item: ImageItem) {
  if (!(await confirm('删除图片', `确定把「${item.name || '未命名'}」从图像底库删除？删除后无法恢复。`))) {
    return
  }
  busy.value = true
  try {
    await apiService._request(`/image-search/${item.id}`, { method: 'DELETE' })
    toast.success('已删除')
    const next = new Set(selected.value)
    next.delete(item.id)
    selected.value = next
    await reloadKeepPage()
  } catch (e: any) {
    toast.error(e?.message || '删除失败')
  } finally {
    busy.value = false
  }
}

/**
 * 批量删除。
 *
 * <p>先把 id 列表快照下来再删：删除过程中 {@code selected} 会被改动，
 * 直接遍历它会把「删过的集合」当成「待删集合」。</p>
 */
async function removeSelected() {
  const ids = [...selected.value]
  if (!ids.length) {
    return
  }
  if (!(await confirm('批量删除', `确定删除选中的 ${ids.length} 张图片？删除后无法恢复。`))) {
    return
  }
  busy.value = true
  const failed: string[] = []
  let ok = 0
  try {
    for (const id of ids) {
      try {
        await apiService._request(`/image-search/${id}`, { method: 'DELETE' })
        ok++
      } catch (e: any) {
        const name = items.value.find((x) => x.id === id)?.name || `#${id}`
        failed.push(`${name}：${e?.message || '未知错误'}`)
      }
    }
  } finally {
    busy.value = false
  }
  if (ok) {
    toast.success(`已删除 ${ok} 张`)
  }
  if (failed.length) {
    toast.error(`${failed.length} 张删除失败：${failed.slice(0, 3).join('；')}`)
  }
  clearSelection()
  await reloadKeepPage()
}

/**
 * 删除后重载并保证不停在空白页。
 *
 * <p>当前页被删空时退回上一页：否则用户看到空白页，会以为删错了或列表坏了。</p>
 */
async function reloadKeepPage() {
  const remainOnPage = visibleItems.value.length
  const target = remainOnPage === 0 && page.value > 1 ? page.value - 1 : page.value
  await load(target)
}

/**
 * 用 viewerjs 打开预览。
 *
 * <p>viewerjs 已挂在网格容器上，直接调 {@code view()} 并指定索引即可获得
 * 缩放、拖拽、左右切换（同页多图连播）等完整能力，不必自己写查看器。
 * 网格视图下索引按「当前可见项」对齐，与 viewer 内部顺序一致。</p>
 */
function preview(item: ImageItem) {
  const index = visibleItems.value.findIndex((x) => x.id === item.id)
  if (viewer && index >= 0) {
    viewer.view(index)
    return
  }
  // 列表视图没有挂 viewer（没有 img 容器语义），退化为一次性查看器
  const src = resolveUrl(item)
  if (!src) {
    return
  }
  openTransientViewer(src, item)
}

/** 列表视图的临时查看器：临时容器用完即销毁，避免污染 DOM */
function openTransientViewer(src: string, item: ImageItem) {
  const holder = document.createElement('div')
  holder.style.display = 'none'
  const img = document.createElement('img')
  img.src = src
  img.alt = item.name || ''
  holder.appendChild(img)
  document.body.appendChild(holder)
  const temp = new Viewer(holder, {
    navbar: false,
    title: () => item.name || '',
    hidden: () => {
      temp.destroy()
      holder.remove()
    },
  })
  temp.view()
}

async function load(target = 1) {
  // 表格视图自管数据（ReTable loader）：这里只负责网格/列表的数据源与状态卡
  if (viewMode.value === 'table') {
    tableRef.value?.reload()
    return
  }
  loading.value = true
  try {
    const data = await apiService._request('/image-search/list', {
      params: { page: target, size: pageSize.value, keyword: kwApplied.value || undefined },
    })
    items.value = data?.items ?? []
    total.value = data?.total ?? 0
    page.value = target
    // 翻页后旧的勾选不应残留：它指向的是上一页的记录
    clearSelection()
    await syncViewer()
  } catch (e: any) {
    items.value = []
    total.value = 0
    toast.error(toErrorMessage(e, '加载图像底库失败'))
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadStatus()
  await load(page.value)
}

/** 网格节点重建后刷新 viewerjs 的图片索引 */
async function syncViewer() {
  await nextTick()
  if (viewMode.value !== 'grid') {
    return
  }
  if (viewer) {
    viewer.update()
    return
  }
  if (gridRef.value) {
    viewer = new Viewer(gridRef.value, {
      navbar: false,
      toolbar: true,
      title: (image: HTMLImageElement) => image.alt || '',
      // 只看图：网格里的角标/按钮不是 img，但显式声明意图更稳
      filter: (image: HTMLImageElement) => !!image.src,
    })
  }
}

async function loadStatus() {
  // 以设置中心同源的合并视图为准：/image-search/status 会把系统种子
  // cn-clip-rn50-image 当作「已配置」，设置中心却显示未配置。
  await modelConfig.load()
  available.value = modelConfig.imageReady
  modelName.value = modelConfig.imageFeatureModel
  await checkModelRegistered()
}

/**
 * 用能力清单校验配置的模型是否真的可选。
 *
 * <p>查询失败不拦页面：宁可放过（用户还能用），也不要因为一个辅助接口抖动
 * 就把整个底库页判成不可用。</p>
 */
async function checkModelRegistered() {
  const want = modelName.value
  if (!want) {
    modelRegistered.value = null
    return
  }
  try {
    const raw = await apiService._request('/ai/models/capability/feature')
    // 该接口可能返回双层包装，两种形态都兼容
    const list = Array.isArray(raw) ? raw : raw?.data
    if (!Array.isArray(list)) {
      modelRegistered.value = null
      return
    }
    modelRegistered.value = list.includes(want)
  } catch {
    modelRegistered.value = null
  }
}

/**
 * 读检索参数用于底栏展示。
 *
 * <p>读失败不影响管理功能，故静默降级：底栏少一行，不弹错误。</p>
 */
async function loadSearchParams() {
  try {
    const data = await apiService._request('/settings/image_search')
    // 该接口是双层包装：{ code, data: { success, data: { field: value } } }，
    // 取值前要再拆一层，否则拿不到任何字段（底栏会静默少一行）。
    const fields = data?.data ?? data
    // 键名与后端 image_search 分组登记的一致（min_similarity），不是 similarity
    const raw = fields?.min_similarity ?? null
    const n = Number(raw)
    minSimilarity.value = Number.isFinite(n) && n > 0 ? n : null
  } catch {
    minSimilarity.value = null
  }
}

// 视图切换：list/table 视图下没有网格容器，销毁 viewer 释放监听；
// 从表格切回网格/列表时补一次加载（表格期间可能改过检索条件）
watch(viewMode, async (mode, prev) => {
  if (mode !== 'grid' && viewer) {
    viewer.destroy()
    viewer = null
  }
  if (mode === 'grid') {
    await syncViewer()
  }
  if (prev === 'table' && mode !== 'table') {
    await load(page.value)
  }
})

onMounted(async () => {
  await loadStatus()
  loadSearchParams()
  // 被拦时不拉列表：拉了也渲染不出来，只是白发一串必然失败的请求
  if (!blockedReason.value) {
    await load(1)
  }
})

onBeforeUnmount(() => {
  viewer?.destroy()
  viewer = null
})

defineExpose({ reload: load })
</script>

<style scoped src="./library-panel.css"></style>

<style scoped>
/* ── 表格视图（ReTable 内的槽位内容）── */
.lib-table {
  width: 100%;
}

.lt-thumb {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--el-border-radius-base, 4px);
  background: var(--el-fill-color-light);
  cursor: zoom-in;
}

.lt-actions {
  display: inline-flex;
  gap: 4px;
}
</style>
