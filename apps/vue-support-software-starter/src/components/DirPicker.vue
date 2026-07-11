<template>
  <el-popover placement="bottom-start" :width="420" trigger="click" @show="init" :visible="visible" @update:visible="v => $emit('update:visible', v)">
    <template #reference>
      <slot :open="() => visible = true">
        <el-button>{{ label }}</el-button>
      </slot>
    </template>

    <div class="dir-picker">
      <div class="dp-head">
        <span class="dp-title">选择目录</span>
      </div>

      <div class="dp-path">
        <el-button v-if="currentPath" text size="small" @click="goUp">
          <el-icon :size="14"><Back /></el-icon>
        </el-button>
        <span class="dp-path-text">{{ currentPath || '磁盘根目录' }}</span>
      </div>

      <div class="dp-list" v-loading="loading">
        <div
          v-for="item in items"
          :key="item.path"
          class="dp-item"
          :class="{ sel: selectedPath === item.path }"
          @click="selectDir(item)"
          @dblclick="enterDir(item)"
        >
          <el-icon :size="15" class="dp-icon"><FolderOpened /></el-icon>
          <span class="dp-name">{{ item.name }}</span>
          <el-icon v-if="selectedPath === item.path" :size="13" class="dp-check"><Check /></el-icon>
        </div>
        <el-empty v-if="!loading && !items.length" description="空目录" :image-size="30" />
      </div>

      <div class="dp-footer">
        <span class="dp-selected">{{ selectedPath || '未选择' }}</span>
        <div class="dp-actions">
          <el-button size="small" @click="visible = false">取消</el-button>
          <el-button size="small" type="primary" :disabled="!selectedPath" @click="confirm">确认</el-button>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FolderOpened, Check, Back } from '@element-plus/icons-vue'
import { browseDirectory, DirEntry } from '@/api/software'

const props = defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  (e: 'select', path: string): void
}>()

const visible = ref(false)
const loading = ref(false)
const currentPath = ref('')
const items = ref<DirEntry[]>([])
const selectedPath = ref('')

async function loadDir(path?: string) {
  loading.value = true
  try {
    items.value = await browseDirectory(path)
    currentPath.value = path || ''
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function init() {
  selectedPath.value = ''
  loadDir()
}

function enterDir(item: DirEntry) {
  if (!item.isDir) return
  loadDir(item.path)
}

function selectDir(item: DirEntry) {
  selectedPath.value = item.path
}

function goUp() {
  if (!currentPath.value) return
  const parent = currentPath.value.replace(/\\$/, '')
  const idx = parent.lastIndexOf('\\')
  if (idx < 0) {
    // Back to drives
    loadDir()
  } else {
    loadDir(parent.substring(0, idx))
  }
}

function confirm() {
  if (selectedPath.value) {
    emit('select', selectedPath.value)
    visible.value = false
  }
}
</script>

<style scoped>
.dir-picker { font-size: 13px; }

.dp-head { margin-bottom: 8px; }
.dp-title { font-weight: 600; font-size: 14px; }

.dp-path {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: 6px;
  background: var(--el-fill-color-light);
  margin-bottom: 8px;
}
.dp-path-text { font-size: 12px; font-family: monospace; color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dp-list { max-height: 240px; overflow-y: auto; margin-bottom: 8px; display: flex; flex-direction: column; gap: 1px; }

.dp-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 6px;
  cursor: pointer; transition: background 0.1s;
}
.dp-item:hover { background: var(--el-color-primary-light-9); }
.dp-item.sel { background: var(--el-color-primary-light-9); }

.dp-icon { color: var(--el-text-color-secondary); flex-shrink: 0; }
.dp-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dp-check { color: rgb(var(--el-color-primary)); flex-shrink: 0; }

.dp-footer {
  border-top: 1px solid var(--el-border-color-light);
  padding-top: 8px;
  display: flex; flex-direction: column; gap: 6px;
}
.dp-selected { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dp-actions { display: flex; justify-content: flex-end; gap: 6px; }
</style>
