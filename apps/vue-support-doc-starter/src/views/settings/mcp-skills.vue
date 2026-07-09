<template>
  <div class="page-card">
    <BackButton to="/dashboard" />

    <div class="page-header">
      <h2>MCP / Skills 配置</h2>
      <div class="header-actions">
        <el-button-group>
          <el-button :type="viewMode === 'card' ? 'primary' : ''" size="small" @click="viewMode = 'card'">
            <el-icon><Grid /></el-icon>
          </el-button>
          <el-button :type="viewMode === 'list' ? 'primary' : ''" size="small" @click="viewMode = 'list'">
            <el-icon><List /></el-icon>
          </el-button>
        </el-button-group>
        <el-button size="small" type="primary" :loading="syncing" @click="syncAll">
          <el-icon><Refresh /></el-icon> 同步
        </el-button>
      </div>
    </div>

    <CardNav :items="settingsNav" />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="MCP 服务" name="mcp">
        <div v-if="activeTab === 'mcp'">
          <div class="toolbar">
            <el-input v-model="mcpSearch" placeholder="搜索 MCP..." clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <el-button type="primary" size="small" @click="openMcpDialog()">
                <el-icon><Plus /></el-icon> 添加
              </el-button>
            </div>
          </div>

          <div v-if="viewMode === 'card'" class="card-grid">
            <div v-for="item in filteredMcp" :key="item.name" class="card-item">
              <div class="card-item-header">
                <div class="card-item-icon devtools"><el-icon><Connection /></el-icon></div>
                <div class="card-item-info">
                  <div class="card-item-name">{{ item.name }}</div>
                  <div class="card-item-sub">{{ item.command }}</div>
                </div>
                <el-tag :type="item.enabled ? 'success' : 'info'" size="small">{{ item.enabled ? '启用' : '禁用' }}</el-tag>
              </div>
              <div class="card-item-tags">
                <el-tag v-for="c in item.clients" :key="c.id" size="small" style="margin:1px" effect="plain">
                  <el-image :src="c.logo" style="width:14px;height:14px;vertical-align:middle;margin-right:2px">
                    <template #error><span style="font-size:12px">{{ c.icon }}</span></template>
                  </el-image>
                  {{ c.name }}
                </el-tag>
              </div>
              <div class="card-item-footer">
                <el-button size="small" text type="primary" @click="openMcpDialogByName(item.name)">编辑</el-button>
                <el-button size="small" text type="danger" @click="deleteMcpGroup(item)">删除</el-button>
              </div>
            </div>
          </div>

          <el-table v-else :data="filteredMcp" style="width: 100%" max-height="calc(100vh - 300px)" row-key="name">
            <el-table-column label="名称" min-width="180">
              <template #default="{ row }">
                <div class="name-cell">
                  <div class="name-title">{{ row.name }}</div>
                  <div class="name-sub">{{ row.command }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column label="客户端" min-width="180">
              <template #default="{ row }">
                <div class="client-tags">
                  <el-tag v-for="c in row.clients" :key="c.id" size="small" style="margin:1px" effect="plain">
                    <el-image :src="c.logo" style="width:14px;height:14px;vertical-align:middle;margin-right:2px">
                      <template #error><span style="font-size:12px">{{ c.icon }}</span></template>
                    </el-image>
                    {{ c.name }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="启用" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="openMcpDialogByName(row.name)">编辑</el-button>
                <el-button size="small" text type="danger" @click="deleteMcpGroup(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Skills" name="skills">
        <div v-if="activeTab === 'skills'">
          <div class="toolbar">
            <el-input v-model="skillSearch" placeholder="搜索 Skill..." clearable prefix-icon="Search" style="width: 220px" />
            <div class="toolbar-right">
              <el-button type="primary" size="small" @click="openSkillDialog()">
                <el-icon><Plus /></el-icon> 添加
              </el-button>
            </div>
          </div>

          <div v-if="viewMode === 'card'" class="card-grid">
            <div v-for="item in filteredSkills" :key="item.name" class="card-item">
              <div class="card-item-header">
                <div class="card-item-icon skills"><el-icon><Promotion /></el-icon></div>
                <div class="card-item-info">
                  <div class="card-item-name">{{ item.name }}</div>
                  <div class="card-item-sub">{{ item.description || '暂无描述' }}</div>
                </div>
                <el-tag :type="item.enabled ? 'success' : 'info'" size="small">{{ item.enabled ? '启用' : '禁用' }}</el-tag>
              </div>
              <div class="card-item-tags">
                <el-tag v-for="c in item.clients" :key="c.id" size="small" style="margin:1px" effect="plain">
                  <el-image :src="c.logo" style="width:14px;height:14px;vertical-align:middle;margin-right:2px">
                    <template #error><span style="font-size:12px">{{ c.icon }}</span></template>
                  </el-image>
                  {{ c.name }}
                </el-tag>
              </div>
              <div class="card-item-footer">
                <el-button size="small" text type="primary" @click="openSkillDialogByName(item.name)">编辑</el-button>
                <el-button size="small" text type="danger" @click="deleteSkillGroup(item)">删除</el-button>
              </div>
            </div>
          </div>

          <el-table v-else :data="filteredSkills" style="width: 100%" max-height="calc(100vh - 300px)" row-key="name">
            <el-table-column label="名称" min-width="200">
              <template #default="{ row }">
                <div class="name-cell">
                  <div class="name-title">{{ row.name }}</div>
                  <div class="name-sub">{{ row.description || '暂无描述' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column label="客户端" min-width="180">
              <template #default="{ row }">
                <div class="client-tags">
                  <el-tag v-for="c in row.clients" :key="c.id" size="small" style="margin:1px" effect="plain">
                    <el-image :src="c.logo" style="width:14px;height:14px;vertical-align:middle;margin-right:2px">
                      <template #error><span style="font-size:12px">{{ c.icon }}</span></template>
                    </el-image>
                    {{ c.name }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="启用" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="openSkillDialogByName(row.name)">编辑</el-button>
                <el-button size="small" text type="danger" @click="deleteSkillGroup(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="mcpDialogVisible" :title="editingMcpName || '添加 MCP 服务'" width="520px" destroy-on-close>
      <el-form :model="mcpForm" label-width="80px" size="small">
        <el-form-item label="名称"><el-input v-model="mcpForm.name" /></el-form-item>
        <el-form-item label="命令"><el-input v-model="mcpForm.command" placeholder="npx" /></el-form-item>
        <el-form-item label="参数"><el-input v-model="mcpForm.args" placeholder='["-y","pkg"]' /></el-form-item>
        <el-form-item label="描述"><el-input v-model="mcpForm.description" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="mcpForm.category" placeholder="devtools" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="mcpForm.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="mcpDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveMcp" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="skillDialogVisible" :title="editingSkillName || '编辑 Skill'" width="720px" destroy-on-close>
      <div v-loading="skillContentLoading">
        <div class="editor-info" v-if="skillFilePath">
          <span class="editor-path">{{ skillFilePath }}</span>
        </div>
        <el-input
          v-model="skillContent"
          type="textarea"
          :rows="20"
          placeholder="Skill 文件内容"
          style="font-family: monospace; font-size: 13px;"
        />
      </div>
      <template #footer>
        <el-button size="small" @click="skillDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveSkillContentAction" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search, Grid, List, Connection, Promotion } from "@element-plus/icons-vue";
import { listMcpServers, saveMcpServer, deleteMcpServer, listSkills, saveSkill as saveSkillApi, deleteSkill, scanAllClients, listAgentClients, type McpServerEntry, type SkillEntry, type AgentClientData } from "@/services";

const { t } = useI18n();
const route = useRoute();

const navIcons = {
  general: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  sync: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
  clients: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  mcpskills: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
};

const settingsNav = computed(() => [
  { name: t('menu.settingsGeneral'), desc: '通用设置', path: '/settings/general', icon: navIcons.general },
  { name: t('menu.settingsSync'), desc: '同步配置', path: '/settings/sync', icon: navIcons.sync },
  { name: t('menu.settingsClients'), desc: '客户端管理', path: '/settings/clients', icon: navIcons.clients },
  { name: 'MCP / Skills', desc: 'MCP 与 Skills 配置', path: '/settings/mcpskills', icon: navIcons.mcpskills },
]);

const activeTab = ref("mcp");
const viewMode = ref<"card" | "list">("card");
const saving = ref(false);
const syncing = ref(false);
const mcpSearch = ref("");
const skillSearch = ref("");
const clients = ref<AgentClientData[]>([]);

const clientMap = computed(() => {
  const m = new Map<string, AgentClientData>();
  for (const c of clients.value) m.set(c.id, c);
  return m;
});

// MCP - grouped by name
const mcpServers = ref<McpServerEntry[]>([]);
interface McpGroup { name: string; command: string; category: string; enabled: boolean; clients: AgentClientData[]; ids: string[]; }
const filteredMcp = computed(() => {
  const cm = clientMap.value;
  const list = !mcpSearch.value ? mcpServers.value : mcpServers.value.filter(s =>
    s.name?.toLowerCase().includes(mcpSearch.value.toLowerCase()) || s.command?.toLowerCase().includes(mcpSearch.value.toLowerCase()));
  const map = new Map<string, McpGroup>();
  for (const s of list) {
    const key = s.name;
    if (!map.has(key)) {
      const c = s.clientId ? cm.get(s.clientId) : undefined;
      map.set(key, { name: key, command: s.command || "", category: s.category || "", enabled: s.enabled !== false, clients: c ? [c] : [], ids: s.id ? [s.id] : [] });
    } else {
      const g = map.get(key)!;
      const c = s.clientId && !g.clients.some(x => x.id === s.clientId) ? cm.get(s.clientId) : undefined;
      if (c) g.clients.push(c);
      if (s.id && !g.ids.includes(s.id)) g.ids.push(s.id);
    }
  }
  return Array.from(map.values());
});

const mcpDialogVisible = ref(false);
const editingMcpName = ref("");
const mcpForm = reactive({ name: "", command: "", args: "[]", description: "", category: "", enabled: true });

function openMcpDialogByName(name: string) {
  const rows = mcpServers.value.filter(s => s.name === name);
  if (rows.length > 0) {
    const r = rows[0];
    editingMcpName.value = r.name;
    Object.assign(mcpForm, { name: r.name, command: r.command || "", args: r.args || "[]", description: r.description || "", category: r.category || "", enabled: r.enabled !== false });
  }
  mcpDialogVisible.value = true;
}

async function saveMcp() {
  saving.value = true;
  try {
    const affected = mcpServers.value.filter(s => s.name === editingMcpName.value);
    for (const row of affected) await saveMcpServer({ ...mcpForm, id: row.id, clientId: row.clientId });
    ElMessage.success("保存成功"); mcpDialogVisible.value = false; await loadMcpServers();
  } catch { ElMessage.error("保存失败"); } finally { saving.value = false; }
}

async function deleteMcpGroup(group: McpGroup) {
  try {
    await ElMessageBox.confirm("确认删除所有客户端的 " + group.name + "？", "提示", { type: "warning" });
    for (const id of group.ids) { try { await deleteMcpServer(id); } catch {} }
    ElMessage.success("已删除"); await loadMcpServers();
  } catch {}
}

async function loadMcpServers() { try { mcpServers.value = await listMcpServers(); } catch { mcpServers.value = []; } }

// Skills - grouped by name
const skills = ref<SkillEntry[]>([]);
interface SkillGroup { name: string; description: string; category: string; enabled: boolean; clients: AgentClientData[]; ids: string[]; }
const filteredSkills = computed(() => {
  const cm = clientMap.value;
  const list = !skillSearch.value ? skills.value : skills.value.filter(s =>
    s.name?.toLowerCase().includes(skillSearch.value.toLowerCase()) || s.description?.toLowerCase().includes(skillSearch.value.toLowerCase()));
  const map = new Map<string, SkillGroup>();
  for (const s of list) {
    const key = s.name;
    if (!map.has(key)) {
      const c = s.clientId ? cm.get(s.clientId) : undefined;
      map.set(key, { name: key, description: s.description || "", category: s.category || "", enabled: s.enabled !== false, clients: c ? [c] : [], ids: s.id ? [s.id] : [] });
    } else {
      const g = map.get(key)!;
      const c = s.clientId && !g.clients.some(x => x.id === s.clientId) ? cm.get(s.clientId) : undefined;
      if (c) g.clients.push(c);
      if (s.id && !g.ids.includes(s.id)) g.ids.push(s.id);
    }
  }
  return Array.from(map.values());
});

const skillDialogVisible = ref(false);
const editingSkillName = ref("");
const skillContent = ref("");
const skillFilePath = ref("");
const skillContentLoading = ref(false);

function openSkillDialogByName(name: string) {
  const rows = skills.value.filter(s => s.name === name);
  if (rows.length === 0) return;
  const r = rows[0];
  editingSkillName.value = r.name;
  skillFilePath.value = "";
  skillContent.value = "";
  skillDialogVisible.value = true;
  if (r.id) {
    skillContentLoading.value = true;
    fetch(`/api/skills/content/${r.id}`).then(res => res.json()).then(data => {
      skillContent.value = data.content || "";
      skillFilePath.value = data.path || "";
    }).catch(() => { skillContent.value = ""; }).finally(() => { skillContentLoading.value = false; });
  }
}

async function saveSkillContentAction() {
  const rows = skills.value.filter(s => s.name === editingSkillName.value);
  if (rows.length === 0 || !rows[0].id) return;
  saving.value = true;
  try {
    await fetch(`/api/skills/content/${rows[0].id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: skillContent.value })
    });
    ElMessage.success("保存成功"); skillDialogVisible.value = false;
  } catch { ElMessage.error("保存失败"); } finally { saving.value = false; }
}

async function deleteSkillGroup(group: SkillGroup) {
  try {
    await ElMessageBox.confirm("确认删除所有客户端的 " + group.name + "？", "提示", { type: "warning" });
    for (const id of group.ids) { try { await deleteSkill(id); } catch {} }
    ElMessage.success("已删除"); await loadSkills();
  } catch {}
}

async function loadSkills() { try { skills.value = await listSkills(); } catch { skills.value = []; } }

async function syncAll() {
  syncing.value = true;
  try { await scanAllClients(); ElMessage.success("同步完成"); await Promise.all([loadMcpServers(), loadSkills()]); }
  catch { ElMessage.error("同步失败"); } finally { syncing.value = false; }
}

onMounted(async () => {
  try { clients.value = await listAgentClients(); } catch { clients.value = []; }
  loadMcpServers(); loadSkills();
});
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.toolbar-right { display: flex; gap: 8px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.card-item { background: #fff; border: 1px solid var(--el-border-color); border-radius: 8px; padding: 14px; transition: all 0.2s; }
.card-item:hover { border-color: var(--el-color-primary-light-5); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.card-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.card-item-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; flex-shrink: 0; }
.card-item-icon.devtools { background: linear-gradient(135deg, #667eea, #764ba2); }
.card-item-icon.skills { background: linear-gradient(135deg, #f093fb, #f5576c); }
.card-item-info { flex: 1; min-width: 0; }
.card-item-name { font-size: 14px; font-weight: 600; }
.card-item-sub { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-item-tags { padding: 8px 0; border-top: 1px solid var(--el-border-color-lighter); border-bottom: 1px solid var(--el-border-color-lighter); margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 2px; }
.card-item-footer { display: flex; gap: 8px; justify-content: flex-end; }
.client-tags { display: flex; flex-wrap: wrap; gap: 2px; }
.name-cell { display: flex; flex-direction: column; gap: 2px; }
.name-title { font-size: 14px; font-weight: 500; }
.name-sub { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
.editor-info { margin-bottom: 8px; font-size: 12px; color: var(--el-text-color-secondary); }
.editor-path { font-family: monospace; }
</style>
