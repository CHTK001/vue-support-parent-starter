<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">相册</h1>
        <p class="page-desc">{{ images.length }} 张图片</p>
      </div>
    </div>

    <div class="search-wrap">
      <el-input v-model="search" placeholder="搜索图片名称…" clearable :prefix-icon="Search" />
    </div>

    <div v-loading="loading" class="album-grid">
      <div v-for="img in filtered" :key="img.path" class="album-card" @click="preview(img)">
        <div class="album-thumb">
          <img :src="getImageUrl(img.path)" :alt="img.name" @error="onImgError" />
          <div class="album-mask">
            <el-icon :size="22" class="album-zoom"><ZoomIn /></el-icon>
            <div class="album-caption">
              <span class="album-name">{{ img.name }}</span>
              <span class="album-size">{{ formatSize(img.size) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && filtered.length === 0" :description="search ? '未找到匹配的图片' : '暂无图片，请先在设置中添加图片目录'" class="mt-16" />

    <teleport to="body">
      <transition name="overlay">
        <div v-if="previewVisible" class="preview-layer" @click.self="previewVisible = false">
          <div class="preview-bar">
            <span class="preview-label">{{ previewName }}</span>
            <button class="preview-close" @click="previewVisible = false">
              <el-icon :size="18"><Close /></el-icon>
            </button>
          </div>
          <div class="preview-frame">
            <img :src="previewUrl" class="preview-img" />
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, ZoomIn, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getImages, getImageUrl } from '@/api/software'

const images = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const previewVisible = ref(false)
const previewUrl = ref('')
const previewName = ref('')

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return images.value
  return images.value.filter(img => img.name.toLowerCase().includes(q))
})

async function load() {
  loading.value = true
  try { images.value = await getImages() }
  catch { ElMessage.error('加载图片失败') }
  finally { loading.value = false }
}

function preview(img: any) {
  previewUrl.value = getImageUrl(img.path)
  previewName.value = img.name
  previewVisible.value = true
}

function onImgError(e: Event) { (e.target as HTMLElement).style.display = 'none' }

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

onMounted(() => { load() })
</script>

<style scoped>
.page-head { margin-bottom: 28px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.search-wrap { margin-bottom: 24px; }

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.album-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  background: var(--el-bg-color);
}

.album-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border-color: transparent;
}

.album-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.album-thumb img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.album-card:hover .album-thumb img {
  transform: scale(1.06);
}

.album-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.5), transparent 50%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 14px;
  opacity: 0;
  transition: opacity 0.2s;
}

.album-card:hover .album-mask {
  opacity: 1;
}

.album-zoom {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.album-card:hover .album-zoom {
  opacity: 0.8;
}

.album-caption {
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.album-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-size {
  font-size: 11px;
  opacity: 0.75;
}

/* Fullscreen overlay */
.preview-layer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  color: rgba(255, 255, 255, 0.8);
}

.preview-label {
  font-size: 14px;
  font-weight: 500;
}

.preview-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background 0.12s;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.preview-frame {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 40px;
  min-height: 0;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
