<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">AI 提供商</h1>
        <p class="page-desc">管理 AI 模型提供商与 API 密钥，支持从接口获取模型列表</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Download" @click="doExport">导出</el-button>
        <el-button :icon="Upload" @click="triggerImport">导入</el-button>
        <input ref="importInput" type="file" accept=".json" class="hidden-input" @change="doImport" />
        <el-button type="primary" :icon="Plus" @click="openDialog(null)">添加提供商</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <div v-for="proto in PROTOCOLS" :key="proto.value" class="filter-chip" :class="{ active: activeProtocol === proto.value }" @click="activeProtocol = proto.value">
        <span>{{ proto.label }}</span>
        <span class="filter-count">{{ countByProtocol(proto.value) }}</span>
      </div>
    </div>

    <div class="provider-grid">
      <div v-for="p in filteredProviders" :key="p.id" class="provider-card">
        <div class="pc-top">
          <div class="pc-badge">{{ p.name.slice(0, 2).toUpperCase() }}</div>
          <div class="pc-info">
            <div class="pc-name-row">
              <span class="pc-name">{{ p.name }}</span>
              <el-tag size="small" :type="tagType(p.protocol)" class="pc-proto">{{ p.protocol.toUpperCase() }}</el-tag>
            </div>
            <code class="pc-endpoint">{{ p.apiEndpoint }}</code>
          </div>
          <el-switch :model-value="p.enabled" size="small" @change="toggleProvider(p)" />
        </div>
        <div class="pc-models">
          <span class="pc-model-label">模型 ({{ (p.models || []).length }})</span>
          <div class="pc-model-tags">
            <el-tag v-for="m in (p.models || []).slice(0, 8)" :key="m" size="small" type="info">{{ m }}</el-tag>
            <el-tag v-if="(p.models || []).length > 8" size="small">+{{ (p.models || []).length - 8 }}</el-tag>
          </div>
        </div>
        <div class="pc-actions">
          <el-button text size="small" :icon="Refresh" @click="fetchProviderModels(p)">获取模型</el-button>
          <el-button text size="small" :icon="Edit" @click="openDialog(p)">编辑</el-button>
          <el-button text size="small" type="danger" :icon="Delete" @click="deleteProvider(p.id)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="!providers.length" description="暂无配置，点击上方按钮添加" :image-size="50" class="mt-8" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑提供商' : '添加提供商'" width="540px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="例如: My AI Service" />
        </el-form-item>
        <el-form-item label="协议">
          <el-radio-group v-model="form.protocol">
            <el-radio-button value="openai">OpenAI</el-radio-button>
            <el-radio-button value="claude">Claude</el-radio-button>
            <el-radio-button value="gemini">Gemini</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="API 地址">
          <el-input v-model="form.apiEndpoint" :placeholder="endpointPlaceholder" />
        </el-form-item>
        <el-form-item label="API 密钥">
          <el-input v-model="form.apiKey" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="模型列表">
          <div class="model-toolbar">
            <el-button size="small" @click="fetchModels" :loading="fetching">
              <el-icon><Refresh /></el-icon> 从接口获取模型
            </el-button>
            <el-tag v-if="fetchedCount" type="success" size="small">获取到 {{ fetchedCount }} 个模型</el-tag>
            <el-button size="small" text type="primary" @click="addModelRow" style="margin-left:auto">
              <el-icon><Plus /></el-icon> 手动添加
            </el-button>
          </div>
          <div class="model-rows">
            <div v-for="(row, idx) in modelRows" :key="idx" class="model-row">
              <el-select v-model="row.id" filterable allow-create default-first-option style="flex:1" placeholder="模型 ID" @change="v => { if (!row.displayName) row.displayName = v }">
                <el-option v-for="m in availableModels" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
              <el-icon class="mx-1"><ArrowRight /></el-icon>
              <el-input v-model="row.displayName" style="flex:1" :placeholder="row.id || '显示名称'" />
              <el-button text type="danger" size="small" @click="modelRows.splice(idx, 1)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProvider" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh, ArrowRight, Download, Upload } from '@element-plus/icons-vue'
import { listAiModules, saveAiModule, updateAiModule, deleteAiModule, exportAllData, importAllData, type AiModule } from '@/api/software'

interface Provider extends AiModule {
  protocol: string
  models: string[]
  enabled: boolean
}

const providers = ref<Provider[]>([])
const dialogVisible = ref(false)
const saving = ref(false)
const editing = ref<Provider | null>(null)
const fetching = ref(false)
const availableModels = ref<{ id: string; name: string }[]>([])
const fetchedCount = ref(0)
const activeProtocol = ref('')
const importInput = ref<HTMLInputElement>()

async function doExport() {
  try {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'toolkit-export.json'; a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('已导出')
  } catch { ElMessage.error('导出失败') }
}

function triggerImport() { importInput.value?.click() }

async function doImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    const res = await importAllData(data)
    if (res.success) {
      ElMessage.success(`导入成功: ${res.imported?.length || 0} 项`)
      await load()
    } else {
      ElMessage.error('导入失败: ' + (res.error || '未知错误'))
    }
  } catch { ElMessage.error('文件格式错误') }
  finally { (e.target as HTMLInputElement).value = '' }
}

const PROTOCOLS = [
  { value: '', label: '全部' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
]

const ENDPOINT_PRESETS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com/v1',
}

const form = ref({ name: '', apiEndpoint: '', apiKey: '', protocol: 'openai' })
const modelRows = ref<{ id: string; displayName: string }[]>([])

const endpointPlaceholder = computed(() => ENDPOINT_PRESETS[form.value.protocol] || 'https://api.example.com/v1')
const filteredProviders = computed(() => {
  if (!activeProtocol.value) return providers.value
  return providers.value.filter(p => p.protocol === activeProtocol.value)
})

function countByProtocol(proto: string) {
  return proto ? providers.value.filter(p => p.protocol === proto).length : providers.value.length
}

function tagType(proto: string): string {
  const map: Record<string, string> = { openai: 'success', claude: 'warning', gemini: 'info' }
  return map[proto] || ''
}

function addModelRow() { modelRows.value.push({ id: '', displayName: '' }) }

function openDialog(p: Provider | null) {
  editing.value = p
  availableModels.value = []
  fetchedCount.value = 0
  if (p) {
    form.value = { name: p.name, apiEndpoint: p.apiEndpoint || '', apiKey: p.apiKey || '', protocol: p.protocol || 'openai' }
    modelRows.value = (p.models || []).map(m => ({ id: m, displayName: m }))
  } else {
    form.value = { name: '', apiEndpoint: ENDPOINT_PRESETS.openai, apiKey: '', protocol: 'openai' }
    modelRows.value = []
  }
  dialogVisible.value = true
}

async function fetchModels() {
  if (!form.value.apiEndpoint) { ElMessage.warning('请先填写 API 地址'); return }
  fetching.value = true
  availableModels.value = []
  try {
    const res = await fetch(`${form.value.apiEndpoint}/models`, {
      headers: form.value.apiKey ? { 'Authorization': `Bearer ${form.value.apiKey}` } : {}
    })
    if (res.ok) {
      const data = await res.json()
      availableModels.value = (data.data || data.models || []).map((m: any) => ({
        id: m.id || m,
        name: m.id || m.name || m
      }))
      fetchedCount.value = availableModels.value.length
    } else {
      ElMessage.warning('获取失败，请检查 API 地址和密钥')
    }
  } catch {
    ElMessage.warning('无法连接到接口')
  } finally {
    fetching.value = false
  }
}

async function fetchProviderModels(p: Provider) {
  try {
    const res = await fetch(`${p.apiEndpoint || ''}/models`, {
      headers: p.apiKey ? { 'Authorization': `Bearer ${p.apiKey}` } : {}
    })
    if (res.ok) {
      const data = await res.json()
      const models = (data.data || data.models || []).map((m: any) => m.id || m)
      if (models.length) {
        p.models = models
        if (p.id) await updateAiModule(p.id, p)
        ElMessage.success(`获取到 ${models.length} 个模型`)
      }
    }
  } catch { /* ignore */ }
}

async function saveProvider() {
  if (!form.value.name || !form.value.apiEndpoint) { ElMessage.warning('请填写名称和 API 地址'); return }
  saving.value = true
  const models = modelRows.value.filter(r => r.id.trim()).map(r => r.id.trim())
  try {
    const data = {
      name: form.value.name,
      provider: form.value.protocol,
      model: models[0] || '',
      apiEndpoint: form.value.apiEndpoint,
      apiKey: form.value.apiKey,
      enabled: true,
      models,
      protocol: form.value.protocol,
    } as any
    if (editing.value?.id) {
      await updateAiModule(editing.value.id, data)
    } else {
      await saveAiModule(data)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await load()
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

async function toggleProvider(p: Provider) {
  p.enabled = !p.enabled
  if (p.id) {
    try { await updateAiModule(p.id, p) } catch { p.enabled = !p.enabled }
  }
}

async function deleteProvider(id?: number) {
  if (!id) return
  try {
    await ElMessageBox.confirm('确定删除？', '提示')
    await deleteAiModule(id)
    await load()
    ElMessage.success('已删除')
  } catch {}
}

async function load() {
  try {
    const modules = await listAiModules()
    providers.value = modules.map(m => ({
      ...m,
      protocol: (m as any).protocol || 'openai',
      models: (m as any).models || [m.model].filter(Boolean),
      enabled: m.enabled ?? true,
    }))
  } catch { providers.value = [] }
}

watch(() => form.value.protocol, (proto) => {
  if (!editing.value && !form.value.apiEndpoint) {
    form.value.apiEndpoint = ENDPOINT_PRESETS[proto] || form.value.apiEndpoint
  }
})

onMounted(() => { load() })
</script>

<style scoped>
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.filter-chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; border: 1px solid var(--el-border-color-light); cursor: pointer; font-size: 13px; transition: all 0.12s; }
.filter-chip:hover { border-color: rgb(var(--el-color-primary)); }
.filter-chip.active { border-color: rgb(var(--el-color-primary)); background: var(--el-color-primary-light-9); font-weight: 500; }
.filter-count { font-size: 11px; padding: 0 6px; border-radius: 100px; background: var(--el-fill-color-light); }

.provider-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; }
.provider-card { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 12px; padding: 16px; }
.provider-card:hover { border-color: var(--el-color-primary-light-7); }

.pc-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.pc-badge { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: var(--el-color-primary-light-9); color: rgb(var(--el-color-primary)); flex-shrink: 0; }
.pc-info { flex: 1; min-width: 0; }
.pc-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.pc-name { font-size: 14px; font-weight: 600; }
.pc-endpoint { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; }
.pc-models { margin-bottom: 10px; }
.pc-model-label { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
.pc-model-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.pc-actions { display: flex; gap: 4px; border-top: 1px solid var(--el-border-color-light); padding-top: 10px; }

.model-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.model-rows { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
.model-row { display: flex; align-items: center; gap: 6px; }
.mx-1 { margin: 0 4px; color: var(--el-text-color-secondary); flex-shrink: 0; }

.mt-8 { margin-top: 32px; }
.head-actions { display: flex; align-items: center; gap: 8px; }
.hidden-input { display: none; }
</style>
