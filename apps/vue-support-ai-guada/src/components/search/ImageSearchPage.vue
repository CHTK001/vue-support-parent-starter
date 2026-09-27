<template>
  <div class="is-root">
    <!-- 顶栏：标题 + 搜索框 + 上传入口 -->
    <header class="is-topbar">
      <div class="is-brand">
        <span class="is-brand-logo"><el-icon><Camera /></el-icon></span>
        <span class="is-brand-title">拍照搜同款</span>
      </div>

      <div class="is-searchbox">
        <el-icon class="is-searchbox-icon"><Search /></el-icon>
        <input v-model="keyword" class="is-searchbox-input" placeholder="按名称 / 标签检索图片库"
          @keydown.enter="loadLibrary(1)" />
        <button class="is-upload-btn" :disabled="busy" @click="pickImage">
          <el-icon><Upload /></el-icon>上传图片
        </button>
      </div>

      <div class="is-topbar-right">
        <button class="is-icon-action" :disabled="busy" @click="loadLibrary(1)">
          <el-icon><Clock /></el-icon><span>图片库</span>
        </button>
        <span class="is-badge" :class="available ? 'is-ok' : 'is-off'">
          {{ available ? '以图搜图已启用' : '未配置特征模型' }}
        </span>
      </div>
    </header>

    <div class="is-body">
      <!-- ==================== 左：图片舞台 ==================== -->
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

          <!-- 预览 + 扫描线 -->
          <div v-else class="is-canvas" :class="{ 'is-busy': searching }">
            <img :src="previewUrl" class="is-img" alt="查询图" />
            <div v-if="searching" class="is-scan"></div>

            <div v-if="!searching" class="is-found-tag">识别完成</div>
            <div v-if="searching" class="is-mask">
              <el-icon :size="26" class="is-spin"><Loading /></el-icon>
              <span>正在提取特征并检索…</span>
            </div>

            <div v-if="!searching && searched" class="is-result-tip">
              为你找到 <b>{{ results.length }}</b> 张相似图片
            </div>
          </div>

          <!-- 操作条 -->
          <div v-if="previewUrl" class="is-actions">
            <el-button class="is-btn-ghost" :disabled="busy" @click="pickImage">
              <el-icon><RefreshLeft /></el-icon>重新上传
            </el-button>
            <el-button class="is-btn-ghost" :disabled="busy" @click="pasteFromClipboard">
              <el-icon><Link /></el-icon>粘贴图片
            </el-button>
            <el-button class="is-btn-accent" :disabled="busy || !previewFile" @click="indexCurrent">
              <el-icon><Plus /></el-icon>加入图片库
            </el-button>
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/png,image/jpeg" class="is-hidden" @change="onFilePicked" />
      </section>

      <!-- ==================== 右：结果面板 ==================== -->
      <aside class="is-side">
        <div class="is-tabs">
          <button v-for="tab in tabs" :key="tab.key" class="is-tab"
            :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
            {{ tab.label }}
          </button>
        </div>

        <!-- 搜索无能力提示 -->
        <div v-if="!available" class="is-hint">
          <el-icon><Warning /></el-icon>
          <div>
            <p class="is-hint-title">以图搜图未启用</p>
            <p class="is-hint-desc">
              请到「系统设置 → 图片识别」配置特征模型（如 resnet50-feature / clip-image-feature），保存后立即生效。
            </p>
          </div>
        </div>

        <!-- 搜索结果 -->
        <template v-else-if="activeTab === 'result'">
          <div class="is-chips">
            <button v-for="c in scoreFilters" :key="c.value" class="is-chip"
              :class="{ active: minScore === c.value }" @click="minScore = c.value">
              {{ c.label }}
            </button>
          </div>

          <div v-loading="searching" class="is-grid">
            <article v-for="(item, i) in filteredResults" :key="item.vectorId || i" class="is-card">
              <div class="is-card-media">
                <img :src="resolveThumb(item)" :alt="item.name" />
                <span v-if="item.score != null" class="is-score">{{ (item.score * 100).toFixed(0) }}%</span>
              </div>
              <div class="is-card-body">
                <p class="is-card-name">{{ item.name || '未命名' }}</p>
                <div class="is-card-tags">
                  <span v-for="tag in (item.tags || []).slice(0, 2)" :key="tag" class="is-card-tag">{{ tag }}</span>
                </div>
              </div>
            </article>

            <div v-if="!searching && filteredResults.length === 0" class="is-empty">
              <el-icon :size="30"><Picture /></el-icon>
              <span>{{ searched ? '没有相似图片，先「加入图片库」再试' : '选一张图开始搜索' }}</span>
            </div>
          </div>
        </template>

        <!-- 图片库 -->
        <template v-else>
          <div class="is-chips">
            <button class="is-chip active">共 {{ total }} 张</button>
            <button class="is-chip" :disabled="busy" @click="loadLibrary(page)">刷新</button>
          </div>

          <div v-loading="libraryLoading" class="is-grid">
            <article v-for="item in library" :key="item.id" class="is-card">
              <div class="is-card-media">
                <img :src="resolveThumb(item)" :alt="item.name" />
                <button class="is-card-del" title="从图片库删除" :disabled="busy" @click.stop="removeImage(item)">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
              <div class="is-card-body">
                <p class="is-card-name">{{ item.name || '未命名' }}</p>
                <div class="is-card-tags">
                  <span v-for="tag in (item.tags || []).slice(0, 2)" :key="tag" class="is-card-tag">{{ tag }}</span>
                </div>
              </div>
            </article>

            <div v-if="!libraryLoading && library.length === 0" class="is-empty">
              <el-icon :size="30"><FolderOpened /></el-icon>
              <span>图片库还是空的</span>
            </div>
          </div>

          <div v-if="total > pageSize" class="is-pager">
            <el-button size="small" :disabled="page <= 1" @click="loadLibrary(page - 1)">上一页</el-button>
            <span class="is-pager-text">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
            <el-button size="small" :disabled="page >= Math.ceil(total / pageSize)"
              @click="loadLibrary(page + 1)">下一页</el-button>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Camera, Search, Upload, Picture, FolderOpened, RefreshLeft, Link,
  Plus, Clock, Warning, Delete, Loading,
} from '@element-plus/icons-vue'
import { apiService } from '@/services/ApiService'
import { usePopup } from '@/composables/usePopup'

/**
 * 以图搜图页面
 *
 * 复用后端默认图像特征管线（image.feature_model 配置的特征模型）：
 * 选图后自动提特征检索底库；也可把图「加入图片库」建索引。
 * 上传前统一经 canvas 转 PNG —— 后端图像解码走 OpenCV，不支持 webp，
 * 同时顺带把超大图压到合理边长，避免无谓的特征计算开销。
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
const previewUrl = ref('')
const previewFile = ref<File | null>(null)
const dragging = ref(false)
const searching = ref(false)
const busy = ref(false)
const searched = ref(false)

const available = ref(false)
const activeModel = ref('')
const results = ref<ImageItem[]>([])
const minScore = ref(0)

const activeTab = ref<'result' | 'library'>('result')
const tabs = [
  { key: 'result' as const, label: '相似图片' },
  { key: 'library' as const, label: '图片库' },
]

const scoreFilters = [
  { label: '全部', value: 0 },
  { label: '相似度 ≥ 90%', value: 0.9 },
  { label: '相似度 ≥ 80%', value: 0.8 },
]

const library = ref<ImageItem[]>([])
const libraryLoading = ref(false)
const keyword = ref('')
const page = ref(1)
const pageSize = ref(30)
const total = ref(0)

const filteredResults = computed(() =>
  results.value.filter((item) => (item.score ?? 1) >= minScore.value),
)

/** 缩略图 / 原图地址 */
function resolveThumb(item: ImageItem): string {
  if (item.url) return item.url
  if (item.thumbnail) return `data:image/jpeg;base64,${item.thumbnail}`
  return ''
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

/** 提特征检索 */
async function runSearch() {
  if (!previewFile.value) return
  searching.value = true
  try {
    const form = new FormData()
    form.append('file', previewFile.value)
    form.append('topK', '30')
    const data = await apiService._request('/image-search/search', {
      method: 'POST',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    results.value = Array.isArray(data) ? data : []
    searched.value = true
  } catch (e: any) {
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
    toast.success('已加入图片库')
    if (activeTab.value === 'library') await loadLibrary(page.value)
    if (searched.value) await runSearch()
  } catch (e: any) {
    if (isNotConfigured(e)) available.value = false
    toast.error(e?.message || '入库失败')
  } finally {
    busy.value = false
  }
}

async function removeImage(item: ImageItem) {
  if (item.id == null) return
  if (!(await confirm('删除图片', `确定把「${item.name || '未命名'}」从图片库删除？`))) return
  busy.value = true
  try {
    await apiService._request(`/image-search/${item.id}`, { method: 'DELETE' })
    toast.success('已删除')
    await loadLibrary(page.value)
  } catch (e: any) {
    toast.error(e?.message || '删除失败')
  } finally {
    busy.value = false
  }
}

async function loadLibrary(target = 1) {
  libraryLoading.value = true
  try {
    const data = await apiService._request('/image-search/list', {
      params: { page: target, size: pageSize.value, keyword: keyword.value || undefined },
    })
    library.value = data?.items || []
    total.value = data?.total || 0
    page.value = target
  } catch (e: any) {
    if (isNotConfigured(e)) available.value = false
    toast.error(e?.message || '加载图片库失败')
  } finally {
    libraryLoading.value = false
  }
}

function switchTab(tab: 'result' | 'library') {
  activeTab.value = tab
  if (tab === 'library' && library.value.length === 0) loadLibrary(1)
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

onMounted(async () => {
  await loadStatus()
  if (available.value) await loadLibrary(1)
})
</script>

<style scoped>
/*
 * 全部走项目 CSS 变量体系（亮/暗自动切换），与 FaceSearchPage 保持一致：
 *   --color-* 结构色；--mp-radius 圆角
 */
.is-root {
  --is-bg: var(--color-bg);
  --is-card: var(--color-surface);
  --is-text: var(--color-text);
  --is-muted: var(--color-text-gray);
  --is-border: var(--color-surface-border);
  --is-hover: var(--color-surface-hover);
  --is-radius: var(--mp-radius-lg, 14px);
  --is-radius-sm: var(--mp-radius, 11px);
  --is-accent: var(--el-color-primary, #ff7d1a);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--is-bg);
  color: var(--is-text);
}

/* ==================== 顶栏 ==================== */
.is-topbar {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--is-border);
  background: var(--is-card);
}

.is-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.is-brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--is-accent);
  color: #fff;
}

.is-brand-title {
  font-size: 16px;
  font-weight: 700;
}

.is-searchbox {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 720px;
  height: 38px;
  padding: 0 8px 0 12px;
  border-radius: 999px;
  background: var(--is-hover);
  border: 1px solid var(--is-border);
}

.is-searchbox-icon {
  color: var(--is-muted);
}

.is-searchbox-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--is-text);
  font-size: 14px;
}

.is-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: var(--is-accent);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.is-upload-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.is-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
}

.is-icon-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--is-muted);
  font-size: 13px;
  cursor: pointer;
}

.is-icon-action:hover {
  background: var(--is-hover);
  color: var(--is-text);
}

.is-badge {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 12px;
}

.is-badge.is-ok {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
}

.is-badge.is-off {
  color: var(--el-color-warning, #e6a23c);
  background: rgba(230, 162, 60, 0.14);
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

.is-stage-inner.is-drag {
  border-color: var(--is-accent);
  box-shadow: 0 0 0 3px rgba(255, 125, 26, 0.16);
}

.is-drop {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  border: 2px dashed var(--is-border);
  border-radius: var(--is-radius);
  margin: 14px;
}

.is-drop-icon {
  color: var(--is-muted);
}

.is-drop-title {
  margin: 6px 0 0;
  font-size: 15px;
  font-weight: 600;
}

.is-drop-desc {
  margin: 0;
  font-size: 13px;
  color: var(--is-muted);
}

.is-drop-btn {
  margin-top: 10px;
}

.is-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--is-hover);
}

.is-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 扫描线 */
.is-scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #37d6e0, transparent);
  box-shadow: 0 0 14px 3px rgba(55, 214, 224, 0.6);
  animation: is-scan-move 1.6s ease-in-out infinite;
}

@keyframes is-scan-move {
  0% { top: 6%; }
  50% { top: 92%; }
  100% { top: 6%; }
}

.is-found-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 13px;
}

.is-result-tip {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 13px;
}

.is-result-tip b {
  color: #ffd48a;
}

.is-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 13px;
}

.is-spin {
  animation: is-spin 1s linear infinite;
}

@keyframes is-spin {
  to { transform: rotate(360deg); }
}

.is-actions {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--is-border);
}

.is-btn-ghost,
.is-btn-accent {
  border-radius: 999px !important;
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
}

.is-tabs {
  display: flex;
  gap: 18px;
  padding: 12px 16px 0;
  border-bottom: 1px solid var(--is-border);
}

.is-tab {
  position: relative;
  padding: 6px 0 10px;
  border: none;
  background: transparent;
  color: var(--is-muted);
  font-size: 14px;
  cursor: pointer;
}

.is-tab.active {
  color: var(--is-text);
  font-weight: 600;
}

.is-tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--is-accent);
}

.is-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 16px;
}

.is-chip {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--is-border);
  background: transparent;
  color: var(--is-muted);
  font-size: 12px;
  cursor: pointer;
}

.is-chip.active {
  border-color: transparent;
  background: var(--is-accent);
  color: #fff;
}

.is-hint {
  display: flex;
  gap: 10px;
  margin: 14px 16px;
  padding: 12px;
  border-radius: var(--is-radius-sm);
  background: rgba(230, 162, 60, 0.1);
  color: var(--el-color-warning, #e6a23c);
}

.is-hint-title {
  margin: 0 0 4px;
  font-weight: 600;
  font-size: 13px;
}

.is-hint-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--is-muted);
}

.is-grid {
  flex: 1;
  min-height: 160px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0 16px 16px;
  align-content: start;
}

.is-card {
  border: 1px solid var(--is-border);
  border-radius: var(--is-radius-sm);
  background: var(--is-bg);
  overflow: hidden;
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

.is-score {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #b45309;
  font-size: 12px;
  font-weight: 700;
}

.is-card-del {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.is-card-body {
  padding: 8px 10px 10px;
}

.is-card-name {
  margin: 0;
  font-size: 13px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-card-tags {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  min-height: 18px;
}

.is-card-tag {
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--is-hover);
  color: var(--is-muted);
  font-size: 11px;
}

.is-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--is-muted);
  font-size: 13px;
}

.is-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px 14px;
}

.is-pager-text {
  font-size: 12px;
  color: var(--is-muted);
}
</style>
