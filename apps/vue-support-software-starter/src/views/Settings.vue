<template>
  <div class="page settings-page">
    <div class="page-head">
      <div>
        <h1 class="page-title">设置</h1>
        <p class="page-desc">管理软件安装与环境配置</p>
      </div>
    </div>

    <section class="seg">
      <h2 class="seg-title">安装方式</h2>
      <p class="seg-desc">选择软件的默认安装来源</p>
      <div class="radio-grid">
        <label v-for="opt in installOptions" :key="opt.value" class="radio-box" :class="{ sel: installMode === opt.value }">
          <el-radio v-model="installMode" :value="opt.value" class="radio-raw" />
          <el-icon :size="20" class="radio-icon"><component :is="opt.icon" /></el-icon>
          <div class="radio-text">
            <span class="radio-label">{{ opt.label }}</span>
            <span class="radio-desc">{{ opt.desc }}</span>
          </div>
          <span v-if="installMode === opt.value" class="radio-check">
            <el-icon :size="14"><Check /></el-icon>
          </span>
        </label>
      </div>
    </section>

    <transition name="reveal">
      <section v-if="installMode === 'third-party'" class="seg">
        <h2 class="seg-title">三方服务</h2>
        <p class="seg-desc">配置多个第三方服务（安装、更新、清理、监控等）</p>
        <div class="seg-body">
          <third-party-service-manager />
        </div>
      </section>
    </transition>

    <transition name="reveal">
      <section v-if="installMode === 'local'" class="seg">
        <h2 class="seg-title">本地软件目录</h2>
        <p class="seg-desc">放置 .exe / .msi / .zip 安装包，可直接从软件列表安装</p>
        <div class="dir-inline">
          <el-input v-model="newDir" placeholder="输入或选择目录路径" @keyup.enter="addDir" />
          <DirPicker @select="v => newDir = v" />
          <el-button type="primary" @click="addDir">添加</el-button>
        </div>
        <div v-if="localDirs.length" class="dir-list">
          <div v-for="(d, i) in localDirs" :key="i" class="dir-item">
            <el-icon :size="15" class="text-el-text-secondary"><FolderOpened /></el-icon>
            <span class="dir-path">{{ d }}</span>
            <button class="dir-rm" @click="removeDir(i)"><el-icon :size="13"><Close /></el-icon></button>
          </div>
        </div>
        <el-empty v-else description="暂未添加" :image-size="40" class="mt-4" />
      </section>
    </transition>

    <section class="seg">
      <h2 class="seg-title">AI 能力</h2>
      <p class="seg-desc">为各 AI 能力分配默认使用的模型</p>
      <div class="radio-grid">
        <label v-for="cat in categories" :key="cat.key" class="radio-box" :class="{ sel: activeAiTab === cat.key }">
          <el-radio v-model="activeAiTab" :value="cat.key" class="radio-raw" />
          <el-icon :size="20" class="radio-icon"><component :is="cat.icon" /></el-icon>
          <div class="radio-text">
            <span class="radio-label">{{ cat.label }}</span>
            <span class="radio-desc">{{ cat.desc }}</span>
          </div>
          <span v-if="getAssigned(cat.key)" class="radio-check">
            <el-icon :size="14"><Check /></el-icon>
          </span>
        </label>
      </div>

      <transition name="reveal">
        <div v-if="activeAiTab" class="ai-config-panel">
          <div v-if="!providers.length" class="seg-empty">
            <p>暂无已配置的提供商</p>
            <el-button size="small" @click="$router.push('/ai/providers')">前往配置</el-button>
          </div>

          <div v-else class="ai-seg-body">
            <el-select
              v-model="catAssignments[activeAiTab]"
              placeholder="选择提供商 — 模型"
              clearable
              class="ai-select"
              @change="saveCat(activeAiTab)"
            >
              <el-option-group v-for="p in providers" :key="p.id" :label="p.name">
                <el-option
                  v-for="m in (p.models || [p.model]).filter(Boolean)"
                  :key="p.id + '|' + m"
                  :label="p.name + ' — ' + m"
                  :value="p.id + '|' + m"
                />
              </el-option-group>
            </el-select>

            <div v-if="getAssigned(activeAiTab)" class="ai-selected-info">
              <div class="info-row">
                <span class="info-label">端点</span>
                <code class="info-val">{{ selectedProvider(activeAiTab)?.apiEndpoint || '—' }}</code>
              </div>
              <div class="info-row">
                <span class="info-label">模型</span>
                <code class="info-val">{{ selectedModel(activeAiTab) || '—' }}</code>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </section>

    <section class="seg">
      <h2 class="seg-title">图片目录</h2>
      <p class="seg-desc">存放图片的目录，可在相册中浏览</p>
      <div class="tree-dir-wrap">
        <el-cascader
          v-model="imageDirs"
          :options="treeRoots"
          :props="treeProps"
          placeholder="浏览本地目录树，选择图片目录"
          clearable
          collapse-tags
          collapse-tags-tooltip
          class="tree-dir"
          @change="onDirChange"
        />
        <el-button v-if="imageDirs.length" text type="danger" size="small" @click="imageDirs = []">
          <el-icon :size="14"><Delete /></el-icon> 清空
        </el-button>
      </div>
      <div v-if="imageDirs.length" class="dir-list mt-3">
        <div v-for="(d, i) in imageDirs" :key="i" class="dir-item">
          <el-icon :size="15" class="text-el-text-secondary"><Picture /></el-icon>
          <span class="dir-path">{{ d }}</span>
          <button class="dir-rm" @click="imageDirs.splice(i, 1)"><el-icon :size="13"><Close /></el-icon></button>
        </div>
      </div>
      <el-empty v-else description="暂未添加" :image-size="40" class="mt-4" />
    </section>

    <div class="actions">
      <el-button @click="reset">重置</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存设置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Delete, FolderOpened, Picture, Download, FolderAdd, Check, Close, ChatLineSquare, PictureFilled, Connection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings, listAiModules, browseDirectory, type AiModule, type DirEntry } from '@/api/software'
import DirPicker from '@/components/DirPicker.vue'
import ThirdPartyServiceManager from '@/components/ThirdPartyServiceManager.vue'

const router = useRouter()

const saving = ref(false)
const installMode = ref('package')
const localDirs = ref<string[]>([])
const newDir = ref('')
const imageDirs = ref<string[]>([])
const treeRoots = ref<CascaderOption[]>([])

interface CascaderOption {
  value: string
  label: string
  leaf: boolean
  loading?: boolean
  children?: CascaderOption[]
}

const treeProps = {
  lazy: true,
  multiple: true,
  checkStrictly: true,
  lazyLoad: async (node: any, resolve: (children: CascaderOption[]) => void) => {
    if (node.level === 0) {
      const roots = await loadTreeNodes('')
      resolve(roots)
    } else {
      const children = await loadTreeNodes(node.value)
      resolve(children)
    }
  },
}

async function loadTreeNodes(path: string): Promise<CascaderOption[]> {
  try {
    const entries = await browseDirectory(path || undefined)
    return entries
      .filter((e: DirEntry) => e.isDir)
      .map((e: DirEntry) => ({ value: e.path, label: e.name, leaf: false }))
  } catch {
    return []
  }
}

function onDirChange() {
  // cascader v-model auto syncs to imageDirs
}
const providers = ref<(AiModule & { protocol: string; models: string[] })[]>([])
const catAssignments = reactive<Record<string, string>>({})
const activeAiTab = ref('chat')

const categories = [
  { key: 'chat', label: '对话 AI', desc: '通用对话 / 助手', icon: ChatLineSquare },
  { key: 'image', label: '文生图 AI', desc: '图像生成 / 绘画', icon: PictureFilled },
  { key: 'knowledge', label: '知识图谱 AI', desc: '知识检索 / 图谱分析', icon: Connection },
]

function getAssigned(key: string): boolean {
  return !!catAssignments[key]
}

function selectedProvider(key: string) {
  const val = catAssignments[key]
  if (!val) return null
  const [pid] = val.split('|')
  return providers.value.find(p => String(p.id) === pid) || null
}

function selectedModel(key: string) {
  const val = catAssignments[key]
  if (!val) return null
  const parts = val.split('|')
  return parts.slice(1).join('|') || null
}

const installOptions = [
  { value: 'package', label: '包管理器', desc: 'winget / brew / apt', icon: Download },
  { value: 'third-party', label: '三方服务', desc: '自建 API 下载安装', icon: Download },
  { value: 'local', label: '本地安装', desc: '从本地目录选择安装包', icon: FolderAdd },
]

async function saveCat(key: string) {
  const val = catAssignments[key]
  await saveSettings({ [`ai.category.${key}`]: val || '' })
}

async function load() {
  try {
    const s = await getSettings()
    installMode.value = s['install.mode'] || 'package'
    localDirs.value = (s['local.software.directories'] || '').split(',').filter(Boolean)
    imageDirs.value = (s['image.directories'] || '').split(',').filter(Boolean)
    catAssignments.chat = s['ai.category.chat'] || ''
    catAssignments.image = s['ai.category.image'] || ''
    catAssignments.knowledge = s['ai.category.knowledge'] || ''
  } catch { ElMessage.error('加载设置失败') }

  try {
    const modules = await listAiModules()
    providers.value = modules
      .filter(m => m.enabled !== false)
      .map(m => ({
        ...m,
        protocol: (m as any).protocol || '',
        models: (m as any).models || [],
      }))
  } catch { providers.value = [] }
}

async function save() {
  saving.value = true
  try {
    const settings: Record<string, string> = {
      'install.mode': installMode.value,
      'local.software.directories': localDirs.value.join(','),
      'image.directories': imageDirs.value.join(','),
    }
    for (const cat of categories) {
      settings[`ai.category.${cat.key}`] = catAssignments[cat.key] || ''
    }
    await saveSettings(settings)
    ElMessage.success('设置已保存')
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

function reset() {
  installMode.value = 'package'
  localDirs.value = []
  imageDirs.value = []
  catAssignments.chat = ''
  catAssignments.image = ''
  catAssignments.knowledge = ''
  activeAiTab.value = 'chat'
}

function addDir() {
  const v = newDir.value.trim()
  if (v && !localDirs.value.includes(v)) localDirs.value.push(v)
  newDir.value = ''
}
function removeDir(i: number) { localDirs.value.splice(i, 1) }

onMounted(() => { load() })
</script>

<style scoped>
.settings-page { max-width: 720px; }

.page-head { margin-bottom: 32px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-desc { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 6px; }

.seg {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 14px;
}

.seg-title { font-size: 16px; font-weight: 600; }
.seg-desc { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px; }
.seg-body { margin-top: 16px; }

.radio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.radio-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 20px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.radio-box:hover { border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }
.radio-box.sel { border-color: rgb(var(--el-color-primary)); background: var(--el-color-primary-light-9); }

.radio-raw { position: absolute; opacity: 0; pointer-events: none; }
.radio-icon { color: rgb(var(--el-color-primary)); }
.radio-text { display: flex; flex-direction: column; gap: 2px; }
.radio-label { font-size: 14px; font-weight: 600; }
.radio-desc { font-size: 11px; color: var(--el-text-color-secondary); }
.radio-check {
  position: absolute; top: 8px; right: 8px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgb(var(--el-color-primary));
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 8px; }
.hint code { background: var(--el-color-primary-light-9); padding: 1px 6px; border-radius: 4px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }

.dir-inline { display: flex; gap: 8px; margin-top: 16px; }

.dir-list { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }

.dir-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  transition: background 0.12s;
}
.dir-item:hover { background: var(--el-color-primary-light-9); }

.dir-path { flex: 1; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dir-rm {
  width: 26px; height: 26px; border-radius: 6px;
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: all 0.12s;
  color: var(--el-text-color-secondary);
}
.dir-item:hover .dir-rm { opacity: 1; }
.dir-rm:hover { background: #fef2f2; color: #dc2626; }

.ai-config-panel { margin-top: 16px; }

.ai-seg-body { display: flex; flex-direction: column; gap: 12px; }

.ai-select { width: 100%; max-width: 400px; }

.ai-selected-info {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row { display: flex; align-items: center; gap: 8px; }
.info-label { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); min-width: 40px; }
.info-val { font-size: 12px; font-family: 'SF Mono', 'Fira Code', monospace; color: var(--el-text-color-primary); word-break: break-all; }

.seg-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 0; color: var(--el-text-color-secondary); font-size: 13px; }

.tree-dir-wrap { display: flex; align-items: center; gap: 8px; margin-top: 16px; }
.tree-dir { flex: 1; }
.mt-3 { margin-top: 12px; }

.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
.mb-2 { margin-bottom: 8px; }

.reveal-enter-active { transition: all 0.2s ease-out; }
.reveal-leave-active { transition: all 0.15s ease-in; }
.reveal-enter-from { opacity: 0; transform: translateY(-6px); }
.reveal-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
