<template>
  <div class="page-card">
    <div class="page-header">
      <h2>MCP / Skills 配置</h2>
      <div class="header-actions">
        <el-button size="small" type="primary" :loading="syncing" @click="syncAll">
          <el-icon><Refresh /></el-icon> 同步
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="MCP 服务" name="mcp">
        <div class="toolbar">
          <el-input v-model="mcpSearch" placeholder="搜索 MCP..." clearable prefix-icon="Search" style="width: 220px" />
          <div class="toolbar-right">
            <el-button type="primary" size="small" @click="openMcpDialog()">
              <el-icon><Plus /></el-icon> 添加
            </el-button>
          </div>
        </div>
        <el-table :data="filteredMcp" style="width: 100%" max-height="calc(100vh - 300px)">
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="command" label="命令" min-width="120" />
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column prop="clientId" label="客户端" width="120" />
          <el-table-column label="启用" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="openMcpDialog(row)">编辑</el-button>
              <el-button size="small" text type="danger" @click="deleteMcp(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Skills" name="skills">
        <div class="toolbar">
          <el-input v-model="skillSearch" placeholder="搜索 Skill..." clearable prefix-icon="Search" style="width: 220px" />
          <div class="toolbar-right">
            <el-button type="primary" size="small" @click="openSkillDialog()">
              <el-icon><Plus /></el-icon> 添加
            </el-button>
          </div>
        </div>
        <el-table :data="filteredSkills" style="width: 100%" max-height="calc(100vh - 300px)">
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column prop="clientId" label="客户端" width="120" />
          <el-table-column label="启用" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="openSkillDialog(row)">编辑</el-button>
              <el-button size="small" text type="danger" @click="deleteSkill(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="mcpDialogVisible" :title="editingMcp?.id ? '编辑 MCP 服务' : '添加 MCP 服务'" width="520px" destroy-on-close>
      <el-form :model="mcpForm" label-width="80px" size="small">
        <el-form-item label="名称"><el-input v-model="mcpForm.name" /></el-form-item>
        <el-form-item label="命令"><el-input v-model="mcpForm.command" placeholder="npx" /></el-form-item>
        <el-form-item label="参数"><el-input v-model="mcpForm.args" placeholder='["-y","pkg"]' /></el-form-item>
        <el-form-item label="描述"><el-input v-model="mcpForm.description" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="mcpForm.category" placeholder="devtools" /></el-form-item>
        <el-form-item label="客户端"><el-input v-model="mcpForm.clientId" placeholder="opencode" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="mcpForm.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="mcpDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveMcp" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="skillDialogVisible" :title="editingSkill?.id ? '编辑 Skill' : '添加 Skill'" width="520px" destroy-on-close>
      <el-form :model="skillForm" label-width="80px" size="small">
        <el-form-item label="名称"><el-input v-model="skillForm.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="skillForm.description" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="skillForm.category" placeholder="code" /></el-form-item>
        <el-form-item label="路径"><el-input v-model="skillForm.path" /></el-form-item>
        <el-form-item label="客户端"><el-input v-model="skillForm.clientId" placeholder="opencode" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="skillForm.enabled" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="skillDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveSkill" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import { listMcpServers, saveMcpServer, deleteMcpServer, listSkills, saveSkill, deleteSkill, scanAllClients, type McpServerEntry, type SkillEntry } from "@/services";

const activeTab = ref("mcp");
const saving = ref(false);
const syncing = ref(false);
const mcpSearch = ref("");
const skillSearch = ref("");

// MCP
const mcpServers = ref<McpServerEntry[]>([]);
const filteredMcp = computed(() => {
  if (!mcpSearch.value) return mcpServers.value;
  const q = mcpSearch.value.toLowerCase();
  return mcpServers.value.filter(s => s.name?.toLowerCase().includes(q) || s.command?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q));
});

const mcpDialogVisible = ref(false);
const editingMcp = ref<McpServerEntry | null>(null);
const mcpForm = reactive<McpServerEntry>({ name: "", command: "", args: "[]", description: "", category: "", clientId: "", enabled: true });

function openMcpDialog(row?: McpServerEntry) {
  editingMcp.value = row || null;
  if (row) Object.assign(mcpForm, row);
  else Object.assign(mcpForm, { name: "", command: "", args: "[]", description: "", category: "", clientId: "", enabled: true });
  mcpDialogVisible.value = true;
}

async function saveMcp() {
  saving.value = true;
  try { await saveMcpServer({ ...mcpForm, id: editingMcp.value?.id }); ElMessage.success("保存成功"); mcpDialogVisible.value = false; await loadMcpServers(); }
  catch { ElMessage.error("保存失败"); } finally { saving.value = false; }
}

async function deleteMcp(id: string) {
  try { await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" }); await deleteMcpServer(id); ElMessage.success("已删除"); await loadMcpServers(); } catch {}
}

async function loadMcpServers() { try { mcpServers.value = await listMcpServers(); } catch { mcpServers.value = []; } }

// Skills
const skills = ref<SkillEntry[]>([]);
const filteredSkills = computed(() => {
  if (!skillSearch.value) return skills.value;
  const q = skillSearch.value.toLowerCase();
  return skills.value.filter(s => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q));
});

const skillDialogVisible = ref(false);
const editingSkill = ref<SkillEntry | null>(null);
const skillForm = reactive<SkillEntry>({ name: "", description: "", category: "", path: "", clientId: "", enabled: true });

function openSkillDialog(row?: SkillEntry) {
  editingSkill.value = row || null;
  if (row) Object.assign(skillForm, row);
  else Object.assign(skillForm, { name: "", description: "", category: "", path: "", clientId: "", enabled: true });
  skillDialogVisible.value = true;
}

async function saveSkill() {
  saving.value = true;
  try { await saveSkill({ ...skillForm, id: editingSkill.value?.id }); ElMessage.success("保存成功"); skillDialogVisible.value = false; await loadSkills(); }
  catch { ElMessage.error("保存失败"); } finally { saving.value = false; }
}

async function deleteSkill(id: string) {
  try { await ElMessageBox.confirm("确认删除？", "提示", { type: "warning" }); await deleteSkill(id); ElMessage.success("已删除"); await loadSkills(); } catch {}
}

async function loadSkills() { try { skills.value = await listSkills(); } catch { skills.value = []; } }

async function syncAll() {
  syncing.value = true;
  try { await scanAllClients(); ElMessage.success("同步完成"); await Promise.all([loadMcpServers(), loadSkills()]); }
  catch { ElMessage.error("同步失败"); } finally { syncing.value = false; }
}

onMounted(() => { loadMcpServers(); loadSkills(); });
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.toolbar-right { display: flex; gap: 8px; }
</style>
