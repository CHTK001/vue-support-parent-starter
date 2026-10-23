<template>
  <ReDialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)"
    title="添加 ONNX 外部模型目录" width="620px" append-to-body>
    <div class="oxd">
      <!-- 1. 服务器模型目录 -->
      <div class="oxd-field">
        <div class="oxd-label">
          <span class="oxd-label-text">服务器模型目录</span>
          <span class="oxd-required">*</span>
        </div>
        <div class="oxd-dir">
          <el-input :model-value="dir" readonly placeholder="点击右侧按钮浏览服务器模型目录" class="oxd-dir-input">
            <template #prefix>
              <el-icon><FolderOpened /></el-icon>
            </template>
          </el-input>
          <el-button @click="filePickerVisible = true">浏览目录</el-button>
        </div>
        <p class="oxd-hint">选择服务器上已放置模型文件的目录，模型将从该目录直接加载，无需下载。</p>
      </div>

      <!-- 2. 模板模型 -->
      <div class="oxd-field">
        <div class="oxd-label">
          <span class="oxd-label-text">模板模型</span>
          <span class="oxd-required">*</span>
        </div>
        <el-input v-model="search" placeholder="搜索作为解析模板的已注册模型..." clearable class="oxd-search">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div v-loading="loading" class="oxd-list">
          <div v-for="m in templateRows" :key="m.modelId" class="oxd-row"
            :class="{ 'is-active': m.modelId === template }" @click="template = m.modelId">
            <span class="oxd-row-name" :title="m.modelId">{{ m.modelId }}</span>
            <span v-if="m.recommended" class="oxd-rec">推荐</span>
            <el-icon v-if="m.modelId === template" class="oxd-check" :size="17"><CheckCircleFilled /></el-icon>
          </div>
          <div v-if="!loading && templateRows.length === 0" class="oxd-empty">没有匹配的已注册模型</div>
        </div>
        <p class="oxd-hint">目录内模型结构需与模板模型同族（相同 Translator 可解析）。</p>
      </div>

      <p v-if="error" class="oxd-error">{{ error }}</p>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!dir || !template" @click="submit">添加</el-button>
    </template>

    <!-- 服务器目录选择器 -->
    <ReFilePicker v-model="filePickerVisible" title="选择模型目录" directory-mode initial-path="/"
      :loader="dirLoader" @select="onDirPicked" />
  </ReDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, FolderOpened } from '@element-plus/icons-vue'
import { CheckCircleFilled } from '@vicons/material'
import ReDialog from '@repo/ui/re-dialog'
import ReFilePicker from '@repo/ui/re-file-picker'
import { adminApi } from '@/framework/context'
import { usePopup } from '@/composables/usePopup'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { notify } = usePopup()

const dir = ref('')
const template = ref('')
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const localModels = ref([])
const filePickerVisible = ref(false)

const templateRows = computed(() => {
  let rows = [...localModels.value].sort(
    (a, b) => Number(b.recommended) - Number(a.recommended) || a.modelId.localeCompare(b.modelId),
  )
  const q = search.value.trim().toLowerCase()
  if (q) rows = rows.filter((m) => m.modelId.toLowerCase().includes(q))
  return rows.slice(0, 120)
})

let loadPromise = null
const loadTemplates = () => {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    loading.value = true
    try {
      const res = await adminApi.get('/v2/ai/models/local')
      const rows = Array.isArray(res) ? res : res?.data || []
      // 只列可用的模板：已登记的外部目录（路径型）或本地已就绪的模型。
      // 完整目录里还有 200 多个未下载的候选模型，全量列出等于「显示全部数据」。
      const usable = rows.filter((m) => {
        const id = String(m?.modelId || '')
        const external = id.startsWith('/')
        return external || m?.available === true
      })
      if (usable.length) localModels.value = usable
      else if (rows.length) localModels.value = rows
    } catch (e) {
      console.error('加载模板模型清单失败:', e)
    } finally {
      loading.value = false
      loadPromise = null
    }
  })()
  return loadPromise
}

// ONNX 的 appkey 就是本地模型目录，目录浏览必须走 ONNX 专用接口：
// 它被钉在模型根之下并带禁入规则；通用文件目录接口无边界，能一路浏览到 /etc、/root/.ssh。
// showFiles=true：最后一层目录里的 model.onnx 等文件要能看见，否则目标目录永远像空的；
// 目录模式下 ReFilePicker 只把这些文件当定位参考，不允许选中。
const dirLoader = async (path) => {
  const res = await adminApi.get('/api/onnx/external/browse', { params: { path: path || '', showFiles: true } })
  const payload = res?.data || res || {}
  const rows = Array.isArray(payload) ? payload : payload.items || []
  return rows.map((r) => ({
    key: r.path,
    name: r.name,
    isDir: r.isDirectory !== false,
    updatedAt: r.updatedAt ?? undefined,
  }))
}

const onDirPicked = (items) => {
  if (items && items.length) dir.value = items[0].key
  filePickerVisible.value = false
}

const submit = async () => {
  if (!dir.value || !template.value) return
  saving.value = true
  error.value = ''
  try {
    await adminApi.post('/api/onnx/external', { dir: dir.value, template: template.value })
    notify.success('添加成功', `已绑定外部模型目录：${dir.value}`)
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
    error.value = e?.message || '添加失败，请检查目录与模板是否匹配'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      dir.value = ''
      template.value = ''
      search.value = ''
      error.value = ''
      if (!localModels.value.length) loadTemplates()
    }
  },
)
</script>

<style scoped>
.oxd { display: flex; flex-direction: column; gap: 18px; }
.oxd-field { display: flex; flex-direction: column; }
.oxd-label { display: flex; align-items: center; gap: 3px; margin-bottom: 8px; }
.oxd-label-text { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.oxd-required { color: var(--el-color-danger); font-size: 13px; }

.oxd-dir { display: flex; gap: 10px; align-items: stretch; }
.oxd-dir-input { flex: 1; }
.oxd-hint { margin: 7px 0 0; font-size: 12px; line-height: 1.5; color: var(--el-text-color-secondary); }

.oxd-search { margin-bottom: 9px; }
.oxd-list {
  max-height: 232px;
  min-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px;
}
.oxd-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base, 8px);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.oxd-row:hover { border-color: var(--el-color-primary-light-5); background: var(--el-fill-color-light); }
.oxd-row.is-active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.oxd-row-name {
  flex: 1; min-width: 0;
  font-size: 13px; font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.oxd-rec {
  flex-shrink: 0;
  font-size: 11px; line-height: 1;
  padding: 3px 7px;
  border-radius: 999px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.oxd-check { color: var(--el-color-primary); flex-shrink: 0; }
.oxd-empty { padding: 32px 0; text-align: center; font-size: 13px; color: var(--el-text-color-secondary); }
.oxd-error {
  margin: 0;
  padding: 9px 12px;
  font-size: 12px;
  border-radius: var(--el-border-radius-base, 8px);
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

/* 动效降级：系统开启「减少动态效果」时，模型行的描边与底色直接到位。
   只关 .oxd-row 自己的 transition，不写 `*` / .oxd-row * 通配，
   避免把 el-tag / el-input / el-scrollbar 内部 Element Plus 组件的合法过渡一起掐掉。
   .is-active 选中态是静态声明，停掉过渡后照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .oxd-row {
    transition: none;
  }
}

/* 键盘焦点可见性：模型行是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 行底色透明、落在弹层表面色上，一档主色描边足够可见。 */
.oxd-row {
  outline: none;
}

.oxd-row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
