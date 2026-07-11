<template>
  <div class="page ai-page">
    <div class="page-head">
      <h1 class="page-title">AI 管理</h1>
      <div class="page-actions">
        <el-button size="small" :icon="Refresh" @click="scanClients" :loading="scanning">扫描客户端</el-button>
        <el-button size="small" :icon="Setting" @click="$router.push('/ai/providers')">提供商</el-button>
      </div>
    </div>

    <div class="ai-layout">
      <div class="ai-sidebar">
        <div class="sidebar-title">客户端 ({{ clients.length }})</div>
        <div class="client-list">
          <div v-for="c in clients" :key="c.id" class="client-item" :class="{ active: activeClient === c.id, installed: c.installed }" :title="c.path" @click="selectClient(c.id)">
            <span class="client-name">{{ c.name }}</span>
            <el-tag v-if="c.installed" size="small" type="success" effect="dark" class="client-tag">已装</el-tag>
            <el-tag v-else size="small" type="info" class="client-tag">未检测</el-tag>
          </div>
          <el-empty v-if="!clients.length" description="未检测到客户端" :image-size="30" class="mt-2" />
        </div>
      </div>

      <div class="ai-main">
        <el-tabs v-model="activeTab" class="ai-tabs">
          <el-tab-pane label="MCP 服务器" name="mcp">
            <div class="tab-toolbar">
              <el-input v-model="mcpSearch" placeholder="搜索 MCP 服务器…" clearable :prefix-icon="Search" style="width:220px" />
              <div class="toolbar-right">
                <el-button size="small" @click="mcpSelectAll">全选</el-button>
                <el-button size="small" @click="mcpDeselectAll">取消</el-button>
                <el-divider direction="vertical" />
                <el-button size="small" type="primary" @click="installMcp" :disabled="!selectedMcpCount" :loading="mcpInstalling">安装 ({{ selectedMcpCount }})</el-button>
              </div>
            </div>
            <div class="mcp-grid">
              <div v-for="srv in filteredMcp" :key="srv.id" class="mcp-card" :class="{ sel: mcpSelected.has(srv.id), installed: installedMcpNames.has(srv.npm || srv.name) }" @click="toggleMcp(srv.id)">
                <div class="mcp-card-top">
                  <span class="mcp-icon">{{ srv.icon }}</span>
                  <div class="mcp-check">
                    <el-checkbox :model-value="mcpSelected.has(srv.id)" @click.stop @change="toggleMcp(srv.id)" />
                    <el-tag v-if="installedMcpNames.has(srv.npm || srv.name)" size="small" type="success">已装</el-tag>
                  </div>
                </div>
                <div class="mcp-name">{{ srv.name }}</div>
                <div class="mcp-desc">{{ srv.description }}</div>
                <div class="mcp-tags">
                  <el-tag size="small" :type="tagType(srv.category)">{{ srv.category }}</el-tag>
                  <code v-if="srv.npm" class="mcp-npm">{{ srv.npm }}</code>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="'Skills (' + skills.length + ')'" name="skills">
            <div class="tab-toolbar">
              <el-input v-model="skillSearch" placeholder="搜索 Skills…" clearable :prefix-icon="Search" style="width:220px" />
              <div class="toolbar-right">
                <el-button size="small" @click="syncSkills" :loading="syncingSkills">同步到数据库</el-button>
              </div>
            </div>
            <div class="skill-grid">
              <div v-for="sk in filteredSkills" :key="sk.id || sk.skillId" class="skill-card" @click="toggleSkillEnabled(sk)">
                <div class="skill-card-top">
                  <div class="skill-info">
                    <div class="skill-name">{{ sk.name }}</div>
                    <div class="skill-desc">{{ sk.description }}</div>
                  </div>
                  <el-switch :model-value="!!sk.enabled" size="small" @click.stop @change="toggleSkillEnabled(sk)" />
                </div>
                <div class="skill-tags">
                  <el-tag size="small" :type="tagType(sk.category || '')">{{ sk.category }}</el-tag>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Setting, Search } from '@element-plus/icons-vue'
import { BUILTIN_MCP_SERVERS } from '@/resources/mcp-list'
import { BUILTIN_SKILLS } from '@/resources/skills-list'
import { scanAiAgents, listMcpServers, installMcpServer, syncAiSkills, toggleAiSkill, type AgentClient, type AiSkill } from '@/api/software'

const clients = ref<AgentClient[]>([])
const activeClient = ref('claude-desktop')
const scanning = ref(false)
const activeTab = ref('mcp')
const mcpSearch = ref('')
const skillSearch = ref('')
const mcpSelected = ref(new Set<string>())
const installedMcpNames = ref(new Set<string>())
const mcpInstalling = ref(false)
const skills = ref<AiSkill[]>([])
const syncingSkills = ref(false)

const filteredMcp = computed(() => {
  const q = mcpSearch.value.toLowerCase().trim()
  if (!q) return BUILTIN_MCP_SERVERS
  return BUILTIN_MCP_SERVERS.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || (s.npm || '').toLowerCase().includes(q))
})
const filteredSkills = computed(() => {
  const q = skillSearch.value.toLowerCase().trim()
  if (!q) return skills.value
  return skills.value.filter(s => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q))
})
const selectedMcpCount = computed(() => mcpSelected.value.size)

function tagType(cat: string): string {
  const map: Record<string, string> = { filesystem: '', database: 'success', search: 'warning', cloud: 'info', devtools: 'danger', ai: 'success', code: 'success', communication: 'warning', productivity: 'info', utility: '', security: 'danger' }
  return map[cat] || ''
}

function selectClient(id: string) {
  activeClient.value = id
  loadInstalledMcp()
}

async function scanClients() {
  scanning.value = true
  try {
    const result = await scanAiAgents()
    clients.value = result
    const installed = result.filter(c => c.installed)
    if (installed.length) {
      activeClient.value = installed[0].id
      await loadInstalledMcp()
    }
    ElMessage.success(`检测到 ${installed.length} 个已安装客户端`)
  } catch {
    ElMessage.error('扫描客户端失败')
  } finally {
    scanning.value = false
  }
}

async function loadInstalledMcp() {
  try {
    const servers = await listMcpServers(activeClient.value)
    installedMcpNames.value = new Set(servers.map(s => s.name))
  } catch {
    installedMcpNames.value = new Set()
  }
}

function toggleMcp(id: string) {
  if (mcpSelected.value.has(id)) mcpSelected.value.delete(id)
  else mcpSelected.value.add(id)
  mcpSelected.value = new Set(mcpSelected.value)
}

function mcpSelectAll() {
  const available = filteredMcp.value.filter(s => !installedMcpNames.value.has(s.npm || s.name))
  mcpSelected.value = new Set(available.map(s => s.id))
}
function mcpDeselectAll() { mcpSelected.value = new Set() }

async function installMcp() {
  if (!activeClient.value) { ElMessage.warning('请先选择客户端'); return }
  mcpInstalling.value = true
  let success = 0
  const selected = BUILTIN_MCP_SERVERS.filter(s => mcpSelected.value.has(s.id))
  for (const srv of selected) {
    try {
      const command = srv.npm ? 'npx' : (srv.command || 'npx')
      const args = srv.npm ? ['-y', srv.npm] : (srv.args || [])
      await installMcpServer(activeClient.value, srv.npm || srv.name, command, args)
      success++
    } catch (e) { /* skip one failure */ }
  }
  mcpInstalling.value = false
  mcpSelected.value = new Set()
  await loadInstalledMcp()
  ElMessage.success(`已完成 ${success}/${selected.length} 个 MCP 服务器安装`)
}

async function syncSkills() {
  syncingSkills.value = true
  try {
    const builtin: AiSkill[] = BUILTIN_SKILLS.map(s => ({
      skillId: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      enabled: s.enabled ?? true,
    }))
    skills.value = await syncAiSkills(builtin)
    ElMessage.success(`已同步 ${skills.value.length} 个 Skills`)
  } catch {
    ElMessage.error('同步 Skills 失败')
  } finally {
    syncingSkills.value = false
  }
}

async function toggleSkillEnabled(sk: AiSkill) {
  const newVal = !sk.enabled
  try {
    const result = await toggleAiSkill(sk.skillId, newVal)
    const idx = skills.value.findIndex(s => s.skillId === sk.skillId)
    if (idx >= 0) skills.value[idx] = result
  } catch {
    ElMessage.error('操作失败')
  }
}

async function loadSkills() {
  try {
    const { listAiSkills } = await import('@/api/software')
    skills.value = await listAiSkills()
  } catch {
    // If no skills in DB yet, use built-in as default
    skills.value = BUILTIN_SKILLS.map(s => ({
      skillId: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      enabled: s.enabled ?? true,
    }))
  }
}

onMounted(async () => {
  await scanClients()
  await loadSkills()
})
</script>

<style scoped>
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
.page-actions { display: flex; gap: 8px; }

.ai-layout { display: flex; gap: 16px; height: calc(100vh - 180px); }

.ai-sidebar { width: 200px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.sidebar-title { font-size: 13px; font-weight: 600; padding: 14px 14px 8px; color: var(--el-text-color-secondary); }
.client-list { flex: 1; overflow-y: auto; padding: 4px 8px; display: flex; flex-direction: column; gap: 2px; }
.client-item { display: flex; align-items: center; padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s; font-size: 13px; gap: 6px; }
.client-item:hover { background: var(--el-color-primary-light-9); }
.client-item.active { background: var(--el-color-primary-light-9); font-weight: 500; }
.client-item.installed { border-left: 2px solid var(--el-color-success); }
.client-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.client-tag { flex-shrink: 0; }

.ai-main { flex: 1; background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; padding: 16px; }
.ai-tabs { flex: 1; display: flex; flex-direction: column; }
:deep(.el-tabs__content) { flex: 1; overflow: auto; }
:deep(.el-tab-pane) { height: 100%; }

.tab-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }

.mcp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
.mcp-card { border: 1px solid var(--el-border-color-light); border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.15s; }
.mcp-card:hover { border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }
.mcp-card.sel { border-color: rgb(var(--el-color-primary)); background: var(--el-color-primary-light-9); }
.mcp-card.installed { border-color: var(--el-color-success-light-5); }
.mcp-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.mcp-check { display: flex; align-items: center; gap: 6px; }
.mcp-icon { font-size: 24px; }
.mcp-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.mcp-desc { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.4; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.mcp-tags { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.mcp-npm { font-size: 10px; color: var(--el-text-color-secondary); background: var(--el-fill-color-light); padding: 1px 5px; border-radius: 4px; }

.skill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
.skill-card { border: 1px solid var(--el-border-color-light); border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.15s; }
.skill-card:hover { border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }
.skill-card-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.skill-info { flex: 1; min-width: 0; }
.skill-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.skill-desc { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.4; }
.skill-tags { display: flex; gap: 4px; }

.mt-2 { margin-top: 8px; }
</style>
