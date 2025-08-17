<template>
  <div class="fs-full">
    <aside :class="['fs-left', { collapsed }]">
      <div class="left-header">
        <div class="title">
          <IconifyIconOnline icon="ri:hard-drive-2-line" /> 已安装的存储
        </div>
        <div class="actions">
          <el-button size="small" type="primary" @click="addStorage">
            <IconifyIconOnline icon="ri:add-line" /> 新增存储
          </el-button>
          <el-button size="small" @click="reload">
            <IconifyIconOnline icon="ri:refresh-line" /> 刷新
          </el-button>
          <el-button size="small" @click="toggleCollapse">
            <IconifyIconOnline :icon="collapsed ? 'ri:sidebar-unfold-line' : 'ri:sidebar-fold-line'" />
          </el-button>
        </div>
      </div>

      <el-scrollbar class="left-list thin-scrollbar">
        <div
          v-for="(s, idx) in storages"
          :key="idx"
          :class="['left-item', { active: selectedIndex === idx }]"
          @click="selectStorage(idx)"
        >
          <div class="row1">
            <span class="seq">#{{ idx + 1 }}</span>
            <span class="type">{{ s.fileStorageType }}</span>
            <el-tag size="small" :type="s.fileStorageEnabled ? 'success' : 'info'">
              {{ s.fileStorageEnabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <div class="row2">
            <span v-if="s.fileStorageType === 'FILESYSTEM'">
              {{ s.fileStorageEndpoint || '未配置路径' }}
            </span>
            <span v-else>
              {{ s.fileStorageBucket || '-' }} @ {{ s.fileStorageEndpoint || '-' }}
            </span>
          </div>
          <div class="row3">
            <el-button link size="small" @click.stop="doPreview(idx)">
              <IconifyIconOnline icon="ri:eye-line" /> 预览
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </aside>

    <main class="fs-right">
      <div class="toolbar">
        <el-radio-group v-model="mode" size="small">
          <el-radio-button label="list">列表</el-radio-button>
          <el-radio-button label="card">卡片</el-radio-button>
          <el-radio-button label="image">大图</el-radio-button>
        </el-radio-group>
        <el-button size="small" @click="fetchPreviewItems">
          <IconifyIconOnline icon="ri:refresh-line" /> 刷新
        </el-button>
      </div>

      <div class="preview-body thin-scrollbar">
        <template v-if="mode === 'list'">
          <el-table :data="previewItems" height="calc(100vh - 180px)" size="small" border>
            <el-table-column prop="name" label="名称" min-width="240" />
            <el-table-column prop="size" label="大小" width="120" />
            <el-table-column prop="modified" label="修改时间" width="200" />
          </el-table>
        </template>
        <template v-else-if="mode === 'card'">
          <div class="card-grid">
            <el-card v-for="it in previewItems" :key="it.id" class="file-card" shadow="hover">
              <div class="file-thumb">{{ it.ext || '文件' }}</div>
              <div class="file-name" :title="it.name">{{ it.name }}</div>
            </el-card>
          </div>
        </template>
        <template v-else>
          <div class="image-grid">
            <el-image v-for="it in previewItems" :key="it.id" :src="it.url" fit="cover" lazy />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFileStorageConfig, type FileStorageConfig } from '@/api/system-server-setting'
import { fileStorageList } from '@/api/file-manager/file-storage'

const route = useRoute()
const serverId = Number(route.params.serverId)

const collapsed = ref(false)
const storages = ref<FileStorageConfig[]>([])
const selectedIndex = ref<number | null>(null)
const mode = ref<'list' | 'card' | 'image'>('list')
const previewItems = ref<any[]>([])

function toggleCollapse() { collapsed.value = !collapsed.value }
function selectStorage(idx: number) { selectedIndex.value = idx }

function addStorage() {
  storages.value.push({
    fileStorageServerId: serverId,
    fileStorageEnabled: true,
    fileStorageType: 'FILESYSTEM',
    fileStorageEndpoint: '',
    fileStorageBucket: '',
    fileStorageAccessKey: '',
    fileStorageSecretKey: '',
    fileStorageRegion: ''
  } as any)
  selectedIndex.value = storages.value.length - 1
}

async function reload() {
  try {
    const res = await getFileStorageConfig(serverId)
    if (res?.success && Array.isArray(res.data)) {
      storages.value = res.data as any[]
      if (!storages.value.length) ElMessage.info('当前服务器暂无已安装的存储')
      selectedIndex.value = storages.value.length ? 0 : null
      await fetchPreviewItems()
    }
  } catch (e) {
    storages.value = []
  }
}

async function doPreview(idx: number) {
  selectedIndex.value = idx
  await fetchPreviewItems()
}

async function fetchPreviewItems() {
  try {
    const s = selectedIndex.value != null ? storages.value[selectedIndex.value] : storages.value[0]
    if (!s) { previewItems.value = []; return }
    const params = new URLSearchParams()
    params.append('serverId', String(serverId))
    params.append('type', s.fileStorageType || '')
    params.append('bucket', s.fileStorageBucket || '')
    params.append('endpoint', s.fileStorageEndpoint || '')
    params.append('basePath', s.fileStorageBasePath || '/')
    const res = await fileStorageList(params)
    const items = Array.isArray(res?.data) ? res.data : res?.data?.list || []
    previewItems.value = (items || []).map((it: any, i: number) => ({
      id: it.id || i,
      name: it.name || it.filename || it.fileName || it.path || '',
      size: it.size || it.length || '',
      modified: it.modified || it.updateTime || it.lastModified || '',
      ext: it.ext || it.suffix || '',
      url: it.url || it.previewUrl || it.downloadUrl || ''
    }))
  } catch (e) {
    previewItems.value = []
  }
}

onMounted(async () => {
  await reload()
})
</script>

<style scoped>
.fs-full { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 24px); gap: 12px; padding: 12px; }
.fs-left { border-right: 1px solid var(--el-border-color); overflow: hidden; transition: width .2s ease; }
.fs-left.collapsed { width: 0; padding: 0; margin: 0; }
.left-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.left-header .title { font-weight: 600; display: flex; align-items: center; gap: 6px; }
.left-list { height: calc(100vh - 120px); }
.left-item { padding: 8px; border-bottom: 1px solid var(--el-border-color); cursor: pointer; }
.left-item.active { background: var(--el-color-primary-light-9); }
.left-item .row1 { display: flex; align-items: center; gap: 8px; }
.left-item .row1 .seq { color: var(--el-text-color-secondary); }
.left-item .row2 { color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px; }
.left-item .row3 { display: flex; justify-content: flex-end; }
.fs-right { min-width: 0; }
.toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
.preview-body { height: calc(100vh - 170px); overflow: auto; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.file-card { width: 160px; }
.file-thumb { height: 100px; display: flex; align-items: center; justify-content: center; background: #f7f7f7; color: #888; }
.file-name { margin-top: 6px; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
@media (max-width: 1080px) { .fs-full { grid-template-columns: 1fr; } .fs-left { display:none; } }
</style>
