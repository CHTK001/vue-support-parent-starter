<template>
  <LDialog :model-value="modelValue" @update:model-value="onVisibleChange" :title="title" width="640px">
    <div class="lmp">
      <el-tabs v-model="activeTab" class="lmp-tabs">
        <!-- ============ 从提供商获取 ============ -->
        <el-tab-pane label="从提供商获取" name="provider">
          <el-input v-model="search" placeholder="搜索模型标识..." clearable class="lmp-search">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <div v-loading="loading" class="lmp-list">
            <div
              v-for="m in providerRows"
              :key="m.modelId"
              class="lmp-row"
              :class="{ 'is-active': m.modelId === currentValue }"
              @click="choose(m.modelId)"
            >
              <div class="lmp-row-main">
                <div class="lmp-row-top">
                  <span class="lmp-name">{{ m.modelId }}</span>
                  <span class="lmp-badges">
                    <span v-if="m.recommended" class="lmp-badge lmp-badge--rec">推荐</span>
                    <span
                      class="lmp-badge"
                      :class="m.available ? 'lmp-badge--ok' : 'lmp-badge--off'"
                    >
                      <span class="lmp-dot" :class="m.available ? 'is-ok' : 'is-off'"></span>
                      {{ m.available ? '已就绪' : '未下载' }}
                    </span>
                  </span>
                </div>
                <div class="lmp-path" :title="m.available ? m.localPath : m.downloadUrl">
                  {{ m.available ? (m.localPath || '-') : (m.downloadUrl ? '下载：' + shortUrl(m.downloadUrl) : '未配置下载地址') }}
                </div>
              </div>
              <el-icon v-if="m.modelId === currentValue" class="lmp-check" :size="18">
                <CheckCircleFilled />
              </el-icon>
            </div>

            <div v-if="!loading && providerRows.length === 0" class="lmp-empty">
              <div class="lmp-empty-main">没有匹配的本地模型</div>
              <div class="lmp-empty-sub">可切换到「服务器目录」选择已放置的模型目录</div>
              <el-button size="small" class="lmp-retry" @click="retry">重新加载</el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- ============ 服务器目录 ============ -->
        <el-tab-pane label="服务器目录" name="dir">
          <div class="lmp-dir">
            <el-input
              :model-value="selectedDir"
              readonly
              placeholder="点击右侧按钮浏览服务器模型目录"
              class="lmp-dir-input"
            />
            <el-button @click="filePickerVisible = true">
              <el-icon class="lmp-btn-icon"><FolderOpened /></el-icon>
              浏览目录
            </el-button>
          </div>
          <p class="lmp-dir-hint">
            选择服务器上已放置模型文件的目录。目录内模型结构需与该字段的默认模型同族（相同 Translator 可解析）。
          </p>
          <div class="lmp-dir-actions">
            <el-button type="primary" :disabled="!selectedDir" @click="choose(selectedDir)">使用该目录</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button text @click="clear">留空 / 清除</el-button>
      <el-button @click="close">取消</el-button>
    </template>

    <!-- 服务器目录选择器 -->
    <ReFilePicker
      v-model="filePickerVisible"
      title="选择模型目录"
      directory-mode
      initial-path="/"
      :loader="dirLoader"
      @select="onDirPicked"
    />
  </LDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, FolderOpened } from '@element-plus/icons-vue'
import { CheckCircleFilled } from '@vicons/material'
import { ElTabs, ElTabPane, ElInput, ElButton, ElIcon } from 'element-plus'
import LDialog from '@/components/ui/LDialog.vue'
import ReFilePicker from '@repo/ui/re-file-picker'
import { adminApi } from '@/framework/context'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '选择本地模型' },
  description: { type: String, default: '' },
  currentValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'select'])

const activeTab = ref('provider')
const search = ref('')
const loading = ref(false)
const localModels = ref([])
const selectedDir = ref('')
const filePickerVisible = ref(false)

// 从字段描述中抽取候选模型标识，与注册表取交集，得到该字段的精确候选
const candidateIds = computed(() => {
  if (!props.description) return []
  const tokens = String(props.description).match(/[A-Za-z0-9][A-Za-z0-9._-]+/g) || []
  const known = new Set(localModels.value.map((m) => m.modelId))
  const out = []
  for (const tk of tokens) {
    if (known.has(tk) && !out.includes(tk)) out.push(tk)
  }
  return out
})

const providerRows = computed(() => {
  let rows
  if (candidateIds.value.length) {
    const byId = new Map(localModels.value.map((m) => [m.modelId, m]))
    rows = candidateIds.value.map((id) => byId.get(id)).filter(Boolean)
  } else {
    rows = [...localModels.value].sort(
      (a, b) => Number(b.recommended) - Number(a.recommended) || a.modelId.localeCompare(b.modelId),
    )
  }
  if (search.value) {
    const q = search.value.trim().toLowerCase()
    if (q) rows = rows.filter((m) => m.modelId.toLowerCase().includes(q))
  }
  return rows
})

// 共享在途请求，避免快速开关/重复触发导致并发请求被取消而清空列表
let loadPromise = null
const loadLocal = () => {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    loading.value = true
    try {
      const res = await adminApi.get('/v2/ai/models/local')
      const rows = Array.isArray(res) ? res : res?.data || []
      // 仅在拿到数据时覆盖；失败保留已有列表，不置空
      if (rows.length) localModels.value = rows
      return rows
    } catch (e) {
      console.error('加载本地模型清单失败:', e)
      return localModels.value
    } finally {
      loading.value = false
      loadPromise = null
    }
  })()
  return loadPromise
}

// 打开时：无数据则加载，有数据直接复用（可用性变化由后端短缓存 + 手动刷新处理）
const ensureLocal = () => {
  if (localModels.value.length) return Promise.resolve(localModels.value)
  return loadLocal()
}

const retry = () => {
  loadPromise = null
  return loadLocal()
}

// ReFilePicker loader：调用目录浏览接口，映射为 FilePickerItem
const dirLoader = async (path) => {
  const res = await adminApi.get('/v2/file/dir/list', { params: { path: path || '' } })
  const rows = Array.isArray(res) ? res : res?.data || []
  return rows.map((r) => ({ key: r.path, name: r.name, isDir: true }))
}

const onDirPicked = (items) => {
  if (items && items.length) {
    selectedDir.value = items[0].key
  }
  filePickerVisible.value = false
}

const shortUrl = (u) => {
  try {
    const url = String(u)
    return url.length > 72 ? url.slice(0, 69) + '...' : url
  } catch {
    return u
  }
}

const choose = (value) => {
  emit('select', value || '')
  close()
}
const clear = () => choose('')
const close = () => emit('update:modelValue', false)
const onVisibleChange = (v) => emit('update:modelValue', v)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      activeTab.value = 'provider'
      search.value = ''
      selectedDir.value = ''
      ensureLocal()
    }
  },
)

// 弹窗已开时切换字段（description 变化）也确保按新字段加载
watch(
  () => props.description,
  () => {
    if (props.modelValue) ensureLocal()
  },
)
</script>

<style scoped>
.lmp-tabs :deep(.el-tabs__header) { margin-bottom: 12px; }
.lmp-search { margin-bottom: 10px; }

.lmp-list {
  max-height: 360px;
  min-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lmp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease;
}
.lmp-row:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
}
.lmp-row.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.lmp-row-main { flex: 1; min-width: 0; }
.lmp-row-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lmp-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.lmp-badges { display: inline-flex; align-items: center; gap: 6px; }
.lmp-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-secondary);
}
.lmp-badge--rec {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.lmp-badge--ok {
  color: var(--el-color-success);
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}
.lmp-badge--off {
  color: var(--el-text-color-secondary);
}
.lmp-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.lmp-dot.is-ok { background: var(--el-color-success); }
.lmp-dot.is-off { background: var(--el-text-color-placeholder); }
.lmp-path {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lmp-check { color: var(--el-color-primary); flex-shrink: 0; }

.lmp-empty { padding: 40px 0; text-align: center; }
.lmp-retry { margin-top: 12px; }
.lmp-empty-main { font-size: 13px; color: var(--el-text-color-regular); }
.lmp-empty-sub { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }

.lmp-dir { display: flex; gap: 10px; align-items: stretch; }
.lmp-dir-input { flex: 1; }
.lmp-btn-icon { margin-right: 4px; }
.lmp-dir-hint {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.lmp-dir-actions { margin-top: 16px; }
</style>
