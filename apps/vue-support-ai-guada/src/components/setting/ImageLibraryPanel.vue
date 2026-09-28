<template>
  <!--
    以图搜图 · 图片库管理（管理员）

    从「拍照搜同款」业务页搬到这里的原因：底库是**全局共享资源**，
    任何人都能改就等于向量索引可被任意污染，而检索结果的准确度完全依赖它。
    所以管理动作（上传 / 删除）收敛到系统设置，检索页只保留「查询」。

    ★ 只做管理员可见：父组件用 isAdmin() 控制挂载，这里再兜一层，
      避免将来被别处复用时漏掉鉴权。后端 5 个接口也都带 @Permission("admin")，
      前后端双保险 —— 前端隐藏只是体验，真正的闸门在后端。
  -->
  <div class="lib">
    <!-- 工具条 -->
    <div class="lib-bar">
      <el-input v-model="keyword" placeholder="按名称检索" clearable class="lib-search"
        @keyup.enter="load(1)" @clear="load(1)">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>

      <span class="lib-count">共 {{ total }} 张</span>

      <div class="lib-actions">
        <el-button :disabled="busy || available === null || !available" @click="pickFiles">
          <el-icon><Upload /></el-icon>上传图片
        </el-button>
        <el-button :disabled="busy" @click="load(page)">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 不可用提示：特征模型没配时上传必然失败，先说清楚原因而不是让人试错 -->
    <el-alert v-if="available === false" type="warning" :closable="false" show-icon class="lib-alert"
      title="以图搜图未启用，无法管理图片库"
      description="请先在本页上方配置「默认图片特征模型」并保存，特征模型可用后才能上传入库。" />

    <!-- 上传区：支持点选与拖拽 -->
    <div v-else class="lib-drop" :class="{ 'is-drag': dragging }" @click="pickFiles"
      @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
      <el-icon :size="26"><UploadFilled /></el-icon>
      <span>把图片拖到这里，或点击选择</span>
      <span class="lib-drop-sub">支持 PNG / JPG，可多选；入库会自动提取特征</span>
    </div>

    <input ref="fileInput" type="file" accept="image/png,image/jpeg" multiple class="lib-hidden"
      @change="onPicked" />

    <!-- 上传进度 -->
    <div v-if="uploading" class="lib-progress">
      <el-progress :percentage="progress" :stroke-width="6" />
      <span class="lib-progress-text">{{ progressText }}</span>
    </div>

    <!-- 图片网格 -->
    <div v-loading="loading" class="lib-grid">
      <figure v-for="item in items" :key="item.id" class="lib-cell">
        <div class="lib-thumb" @click="open(item)">
          <img :src="resolveUrl(item)" :alt="item.name" loading="lazy" />
          <span v-if="!item.hasOriginal" class="lib-nofull" title="该图入库时未保存原图，仅有缩略图">
            仅缩略图
          </span>
          <span class="lib-zoom"><el-icon><ZoomIn /></el-icon></span>
        </div>
        <figcaption class="lib-meta">
          <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
          <span class="lib-dim">{{ formatDims(item) }}</span>
        </figcaption>
        <el-button class="lib-del" size="small" text type="danger" :disabled="busy"
          @click="remove(item)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </figure>

      <el-empty v-if="!loading && items.length === 0" description="图片库还是空的，先上传几张"
        class="lib-empty" />
    </div>

    <!-- 翻页 -->
    <div v-if="total > pageSize" class="lib-pager">
      <el-button :disabled="page <= 1 || loading" @click="load(page - 1)">上一页</el-button>
      <span class="lib-pager-text">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <el-button :disabled="page >= Math.ceil(total / pageSize) || loading" @click="load(page + 1)">下一页</el-button>
    </div>

    <!-- 原图查看器 -->
    <LDialog v-model="viewerVisible" :title="current?.name || '查看图片'" width="70%">
      <div class="lib-viewer-body">
        <img v-if="viewerSrc" :src="viewerSrc" :alt="current?.name" class="lib-viewer-img" />
        <p v-if="current" class="lib-viewer-meta">
          <span v-if="current.hasOriginal">原图</span>
          <span v-else class="lib-warn-text">该图入库时未保存原图，当前显示的是缩略图</span>
          <span class="lib-viewer-dim">{{ formatDims(current) }}</span>
        </p>
      </div>
    </LDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Delete, Refresh, Search, Upload, UploadFilled, ZoomIn } from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { currentToken } from '@/framework/context'
import { usePopup } from '@/composables/usePopup'
import LDialog from '@/components/ui/LDialog.vue'

/**
 * 以图搜图图片库管理面板。
 *
 * <p>依赖后端 5 个 admin 接口：{@code GET /image-search/status}、
 * {@code GET /image-search/list}、{@code POST /image-search/index}、
 * {@code DELETE /image-search/{id}}、{@code GET /image-search/{id}/image}。</p>
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
  createdAt?: number
}

const { toast, confirm } = usePopup()

const fileInput = ref<HTMLInputElement | null>(null)
const items = ref<ImageItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(24)
const keyword = ref('')
const loading = ref(false)
const busy = ref(false)
const dragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const progressText = ref('')
/** null = 尚未探测；false = 未配置特征模型 */
const available = ref<boolean | null>(null)

const viewerVisible = ref(false)
const viewerSrc = ref('')
const current = ref<ImageItem | null>(null)

/**
 * 取可直接给 img.src 用的地址。
 *
 * <p>两个要点都是照抄仓库既有约定（见 services/modules/workspace.api.ts）：
 * 1) 后端 {@code list} 返回的 {@code url} 是**不带 /v2 前缀**的相对路径
 *    （{@code /image-search/{id}/image}），这里拼上 baseURL 即可；
 *    Web 下 baseURL 是 {@code /v2}（vite 代理），Electron 下是绝对地址。
 *    <b>后端绝不能再补 /v2</b>：前端已经拼过一次，补了就成了 {@code /v2/v2/...}，
 *    全部图片 404 但「元素存在」类断言照样通过，只能靠 naturalWidth&gt;0 抓出来。
 * 2) <code>&lt;img&gt;</code> 带不了请求头，所以令牌用
 *    {@code x-oauth-token} 查询参数传 —— 参数名与后端 oauth 客户端 tokenName 一致。</p>
 *
 * <p>不自己 fetch 再转 blob URL：那样还得手工补 Authorization 头，
 * 容易漏掉 X-Client-Id 等其它头，而且多一次无谓的内存拷贝。</p>
 */
function resolveUrl(item: ImageItem): string {
  if (!item.url) {
    return item.thumbnail ? `data:image/jpeg;base64,${item.thumbnail}` : ''
  }
  const base = apiService.baseURL.replace(/\/+$/, '')
  const path = item.url.startsWith('/') ? item.url : '/' + item.url
  const token = currentToken()
  const q = token ? `?x-oauth-token=${encodeURIComponent(token)}` : ''
  return base + path + q
}

function formatDims(item: ImageItem): string {
  return item.width && item.height ? `${item.width}×${item.height}` : '尺寸未知'
}

function pickFiles() {
  fileInput.value?.click()
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
async function upload(files: File[]) {
  uploading.value = true
  progress.value = 0
  let ok = 0
  const failed: string[] = []
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      progressText.value = `正在入库 ${i + 1}/${files.length}：${file.name}`
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
      progress.value = Math.round(((i + 1) / files.length) * 100)
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
    toast.error(`${failed.length} 张失败：${failed.slice(0, 3).join('；')}`)
  }
  await load(1)
}

async function remove(item: ImageItem) {
  if (!(await confirm('删除图片', `确定把「${item.name || '未命名'}」从图片库删除？删除后无法恢复。`))) {
    return
  }
  busy.value = true
  try {
    await apiService._request(`/image-search/${item.id}`, { method: 'DELETE' })
    toast.success('已删除')
    // 删完当前页可能空了，退回上一页而不是停在空白页
    const remain = items.value.filter((x) => x.id !== item.id).length
    await load(remain === 0 && page.value > 1 ? page.value - 1 : page.value)
  } catch (e: any) {
    toast.error(e?.message || '删除失败')
  } finally {
    busy.value = false
  }
}

/**
 * 打开原图查看器。
 *
 * <p>直接给 img.src 赋可访问地址即可，不再 fetch 成 blob ——
 * 后端对无原图的历史记录会自动回退返回缩略图，所以两种情况都不会裂图，
 * 靠 hasOriginal 决定要不要提示用户。</p>
 */
function open(item: ImageItem) {
  current.value = item
  viewerSrc.value = resolveUrl(item)
  viewerVisible.value = true
}

async function load(target = 1) {
  loading.value = true
  try {
    const data = await apiService._request('/image-search/list', {
      params: { page: target, size: pageSize.value, keyword: keyword.value || undefined },
    })
    items.value = data?.items ?? []
    total.value = data?.total ?? 0
    page.value = target
  } catch (e: any) {
    items.value = []
    total.value = 0
    toast.error(e?.message || '加载图片库失败')
  } finally {
    loading.value = false
  }
}

async function loadStatus() {
  try {
    const data = await apiService._request('/image-search/status')
    available.value = !!data?.available
  } catch {
    available.value = false
  }
}

onMounted(async () => {
  await loadStatus()
  if (available.value) {
    await load(1)
  }
})

defineExpose({ reload: load })
</script>

<style scoped>
/* 令牌口径：全部取 --el-* ，色值/圆角/过渡不写死 */
.lib {
  --lib-border: var(--el-border-color-lighter, #ebeef5);
  --lib-radius: var(--el-radius-lg, 12px);
  --lib-radius-sm: var(--el-radius-md, 8px);

  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lib-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lib-search {
  width: 240px;
}

.lib-count {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.lib-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.lib-alert {
  margin: 0;
}

/* 上传区 */
.lib-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 20px;
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: var(--lib-radius);
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
  cursor: pointer;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.lib-drop:hover {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}

.lib-drop.is-drag {
  border-color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, transparent);
}

.lib-drop-sub {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
}

.lib-hidden {
  display: none;
}

.lib-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lib-progress-text {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

/* 网格 */
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  min-height: 120px;
}

.lib-cell {
  position: relative;
  margin: 0;
  border: 1px solid var(--lib-border);
  border-radius: var(--lib-radius-sm);
  overflow: hidden;
  background: var(--el-bg-color, #fff);
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.lib-cell:hover {
  border-color: var(--el-color-primary, #409eff);
}

.lib-thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light, #f5f7fa);
  cursor: zoom-in;
  overflow: hidden;
}

.lib-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lib-zoom {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 26px;
  color: var(--el-color-white, #fff);
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.lib-thumb:hover .lib-zoom {
  opacity: 1;
}

.lib-nofull {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 1px 6px;
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-color-warning, #e6a23c);
  color: var(--el-color-white, #fff);
  font-size: 11px;
}

/* 放大图标压在照片上，照片明暗不可控，必须固定深底才保证图标可读 */
.lib-zoom {
  background: rgba(0, 0, 0, 0.4);
}

.lib-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 8px 8px;
}

.lib-name {
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lib-dim {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}

.lib-del {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: var(--el-radius-full, 9999px);
  background: rgba(0, 0, 0, 0.45);
  color: var(--el-color-white, #fff);
  opacity: 0;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.lib-cell:hover .lib-del {
  opacity: 1;
}

.lib-empty {
  grid-column: 1 / -1;
}

.lib-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.lib-pager-text {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

/* 查看器 */
.lib-viewer-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-height: 220px;
}

.lib-viewer-img {
  max-width: 100%;
  /* 限高，避免竖图把对话框撑到超出视口后要滚动才能看全 */
  max-height: 66vh;
  object-fit: contain;
  border-radius: var(--lib-radius-sm);
}

.lib-viewer-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.lib-viewer-dim {
  color: var(--el-text-color-placeholder, #a8abb2);
}

.lib-warn-text {
  color: var(--el-color-warning, #e6a23c);
}
</style>
