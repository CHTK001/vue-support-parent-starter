<template>
  <div class="agents-page">
    <div class="page-header">
      <h2>Agent管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增Agent
      </el-button>
    </div>

    <!-- Agent列表 -->
    <el-table :data="agentList" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="Agent名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="model" label="绑定模型" min-width="120" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'master' ? 'warning' : 'info'" size="small">
            {{ row.type === 'master' ? '主Agent' : '子Agent' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'danger'" size="small">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleConfig(row)">工作流配置</el-button>
          <el-button type="success" link @click="handleRegister(row)">注册为模型</el-button>
          <el-button type="warning" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" :title="editingId ? '编辑Agent' : '新增Agent'" width="600px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="Agent名称">
          <el-input v-model="editForm.name" placeholder="请输入Agent名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="绑定模型">
          <el-input v-model="editForm.model" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="Agent类型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option label="主Agent" value="master" />
            <el-option label="子Agent" value="sub" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input v-model="editForm.systemPrompt" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAgent" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 工作流配置弹窗 -->
    <el-dialog v-model="configDialogVisible" :title="`工作流配置 - ${currentAgent?.name || ''}`" width="900px" top="5vh">
      <el-tabs v-model="configTab" type="border-card">
        <!-- 子Agent管理 -->
        <el-tab-pane label="子Agent管理" name="sub-agents">
          <div class="sub-agents-toolbar">
            <el-button type="primary" size="small" @click="handleAddSubAgent">
              <el-icon><Plus /></el-icon> 添加子Agent
            </el-button>
            <el-button size="small" @click="loadSubAgents" :loading="loadingSubAgents">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
          <el-table :data="subAgentList" v-loading="loadingSubAgents" border size="small" style="width: 100%; margin-top: 10px">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="子Agent名称" min-width="150" />
            <el-table-column prop="model" label="绑定模型" min-width="120" />
            <el-table-column prop="role" label="角色" width="120" />
            <el-table-column prop="order" label="执行顺序" width="100" align="center" />
            <el-table-column prop="condition" label="触发条件" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="warning" link size="small" @click="handleEditSubAgent(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteSubAgent(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 编排配置 -->
        <el-tab-pane label="编排配置" name="orchestration">
          <el-alert
            title="编排配置：定义主Agent与子Agent的工作流执行顺序、条件分支和数据流"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />
          <div class="orchestration-toolbar">
            <el-button type="primary" size="small" @click="saveOrchestration" :loading="savingOrchestration">保存编排</el-button>
            <el-button type="success" size="small" @click="runOrchestration" :loading="runningOrchestration">运行测试</el-button>
            <el-button size="small" @click="loadOrchestration" :loading="loadingOrchestration">重新加载</el-button>
          </div>
          <div style="margin-top: 10px">
            <el-input
              v-model="orchestrationConfig"
              type="textarea"
              :rows="18"
              placeholder='{"nodes":[{"id":"start","type":"start","label":"开始"},{"id":"sub_agent_1","type":"agent","label":"子Agent1","agentId":"..."},{"id":"end","type":"end","label":"结束"}],"edges":[{"source":"start","target":"sub_agent_1"},{"source":"sub_agent_1","target":"end"}]}'
              style="font-family: monospace; font-size: 12px"
            />
          </div>
        </el-tab-pane>

        <!-- 注册为模型 -->
        <el-tab-pane label="注册为模型" name="register">
          <el-alert
            title="将Agent注册为模型后，可在模型管理中选择该Agent作为模型提供服务"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />
          <el-descriptions :column="1" border v-if="registeredModel">
            <el-descriptions-item label="模型名称">{{ registeredModel.modelName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="模型编码">{{ registeredModel.modelCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="提供商">{{ registeredModel.provider || 'agent' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag type="success" size="small">已注册</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="尚未注册为模型" />
          <div style="margin-top: 20px">
            <el-button v-if="!registeredModel" type="primary" @click="registerAsModel" :loading="registering">注册为模型</el-button>
            <el-button v-else type="danger" @click="unregisterModel" :loading="unregistering">取消注册</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 子Agent编辑弹窗 -->
    <el-dialog v-model="subAgentDialogVisible" :title="editingSubId ? '编辑子Agent' : '添加子Agent'" width="500px">
      <el-form :model="subAgentForm" label-width="100px">
        <el-form-item label="子Agent名称">
          <el-input v-model="subAgentForm.name" placeholder="请输入子Agent名称" />
        </el-form-item>
        <el-form-item label="绑定模型">
          <el-input v-model="subAgentForm.model" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="subAgentForm.role" placeholder="如：分析、总结、翻译" />
        </el-form-item>
        <el-form-item label="执行顺序">
          <el-input-number v-model="subAgentForm.order" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="触发条件">
          <el-input v-model="subAgentForm.condition" type="textarea" :rows="2" placeholder="如：用户意图为分析时执行" />
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input v-model="subAgentForm.systemPrompt" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subAgentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSubAgent" :loading="savingSubAgent">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { agentApi } from '@/services/javaApi';

// ==================== Agent列表 ====================
const agentList = ref<any[]>([]);
const loading = ref(false);

/**
 * 后端 /api/agents/managed 出参是下划线蛇形（agent_id/parent_id/...），
 * 列表与表单用的是驼峰。这里统一归一化，避免字段名不一致导致「建了看不到」。
 */
const normalizeAgent = (a: any) => ({
  id: a.agent_id ?? a.id,
  agentId: a.agent_id ?? a.id,
  parentId: a.parent_id ?? null,
  name: a.name,
  description: a.description,
  model: a.model,
  providerId: a.provider_id,
  // 有 parent_id 即为子 Agent（后端以层级而非类型字段区分）
  type: a.parent_id ? 'sub' : 'master',
  role: a.role,
  instruction: a.instruction,
  systemPrompt: a.system_prompt || a.instruction || '',
  mcpIds: a.mcp_ids || [],
  skillIds: a.skill_ids || [],
  strategy: a.strategy || {},
  enabled: a.enabled !== false,
  sortOrder: a.sort_order,
  subAgents: a.sub_agents || [],
});

/** 表单 → 后端请求体（后端只认蛇形键） */
const toAgentPayload = (f: any) => ({
  name: f.name,
  description: f.description,
  model: f.model,
  provider_id: f.providerId,
  instruction: f.instruction,
  system_prompt: f.systemPrompt,
  mcp_ids: f.mcpIds,
  skill_ids: f.skillIds,
  strategy: f.strategy,
  enabled: f.enabled,
});

const loadAgents = async () => {
  loading.value = true;
  try {
    const res = await agentApi.list();
    const raw = res?.data || res || [];
    agentList.value = (Array.isArray(raw) ? raw : []).map(normalizeAgent);
  } catch (e) {
    agentList.value = [];
  } finally {
    loading.value = false;
  }
};

// ==================== 新增/编辑 ====================
const editDialogVisible = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const editForm = ref({
  name: '',
  description: '',
  model: '',
  type: 'master',
  systemPrompt: '',
  enabled: true,
});

const handleAdd = () => {
  editingId.value = null;
  editForm.value = { name: '', description: '', model: '', type: 'master', systemPrompt: '', enabled: true };
  editDialogVisible.value = true;
};

const handleEdit = (row: any) => {
  editingId.value = row.id;
  editForm.value = { ...row };
  editDialogVisible.value = true;
};

const saveAgent = async () => {
  if (!editForm.value.name) {
    ElMessage.warning('请输入Agent名称');
    return;
  }
  saving.value = true;
  try {
    const payload = toAgentPayload(editForm.value);
    if (editingId.value) {
      await agentApi.update(editingId.value, payload);
      ElMessage.success('更新成功');
    } else {
      await agentApi.create(payload);
      ElMessage.success('创建成功');
    }
    editDialogVisible.value = false;
    await loadAgents();
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除Agent "${row.name}" 吗？`, '确认删除', { type: 'warning' });
    await agentApi.delete(row.id);
    ElMessage.success('删除成功');
    await loadAgents();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

// ==================== 工作流配置 ====================
const configDialogVisible = ref(false);
const configTab = ref('sub-agents');
const currentAgent = ref<any>(null);

const handleConfig = (row: any) => {
  currentAgent.value = row;
  configTab.value = 'sub-agents';
  configDialogVisible.value = true;
  loadSubAgents();
  loadOrchestration();
  loadRegisteredModel();
};

// ==================== 子Agent管理 ====================
const subAgentList = ref<any[]>([]);
const loadingSubAgents = ref(false);
const subAgentDialogVisible = ref(false);
const editingSubId = ref<string | null>(null);
const savingSubAgent = ref(false);
const subAgentForm = ref({
  name: '',
  model: '',
  role: '',
  order: 1,
  condition: '',
  systemPrompt: '',
});

const loadSubAgents = async () => {
  if (!currentAgent.value?.id) return;
  loadingSubAgents.value = true;
  try {
    const res = await agentApi.listSubAgents(currentAgent.value.id);
    subAgentList.value = res?.data || res || [];
  } catch (e) {
    subAgentList.value = [];
  } finally {
    loadingSubAgents.value = false;
  }
};

const handleAddSubAgent = () => {
  editingSubId.value = null;
  subAgentForm.value = { name: '', model: '', role: '', order: subAgentList.value.length + 1, condition: '', systemPrompt: '' };
  subAgentDialogVisible.value = true;
};

const handleEditSubAgent = (row: any) => {
  editingSubId.value = row.id;
  subAgentForm.value = { ...row };
  subAgentDialogVisible.value = true;
};

const saveSubAgent = async () => {
  if (!currentAgent.value?.id || !subAgentForm.value.name) {
    ElMessage.warning('请输入子Agent名称');
    return;
  }
  savingSubAgent.value = true;
  try {
    if (editingSubId.value) {
      await agentApi.updateSubAgent(currentAgent.value.id, editingSubId.value, subAgentForm.value);
      ElMessage.success('子Agent更新成功');
    } else {
      await agentApi.addSubAgent(currentAgent.value.id, subAgentForm.value);
      ElMessage.success('子Agent添加成功');
    }
    subAgentDialogVisible.value = false;
    await loadSubAgents();
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingSubAgent.value = false;
  }
};

const handleDeleteSubAgent = async (row: any) => {
  if (!currentAgent.value?.id) return;
  try {
    await ElMessageBox.confirm(`确定删除子Agent "${row.name}" 吗？`, '确认删除', { type: 'warning' });
    await agentApi.deleteSubAgent(currentAgent.value.id, row.id);
    ElMessage.success('删除成功');
    await loadSubAgents();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

// ==================== 编排配置 ====================
const orchestrationConfig = ref('');
const savingOrchestration = ref(false);
const runningOrchestration = ref(false);
const loadingOrchestration = ref(false);

const loadOrchestration = async () => {
  if (!currentAgent.value?.id) return;
  loadingOrchestration.value = true;
  try {
    const res = await agentApi.getOrchestration(currentAgent.value.id);
    const data = res?.data || res;
    orchestrationConfig.value = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  } catch (e) {
    orchestrationConfig.value = '';
  } finally {
    loadingOrchestration.value = false;
  }
};

const saveOrchestration = async () => {
  if (!currentAgent.value?.id) return;
  savingOrchestration.value = true;
  try {
    let config: any;
    try {
      config = JSON.parse(orchestrationConfig.value);
    } catch {
      config = { raw: orchestrationConfig.value };
    }
    await agentApi.saveOrchestration(currentAgent.value.id, config);
    ElMessage.success('编排配置保存成功');
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingOrchestration.value = false;
  }
};

const runOrchestration = async () => {
  if (!currentAgent.value?.id) return;
  runningOrchestration.value = true;
  try {
    await agentApi.runOrchestration(currentAgent.value.id, { test: true });
    ElMessage.success('编排运行测试已触发');
  } catch (e: any) {
    ElMessage.error('运行失败: ' + (e.message || ''));
  } finally {
    runningOrchestration.value = false;
  }
};

// ==================== 注册为模型 ====================
const registeredModel = ref<any>(null);
const registering = ref(false);
const unregistering = ref(false);

const loadRegisteredModel = async () => {
  if (!currentAgent.value?.id) return;
  try {
    const res = await agentApi.getRegisteredModel(currentAgent.value.id);
    registeredModel.value = res?.data || res || null;
  } catch (e) {
    registeredModel.value = null;
  }
};

const handleRegister = async (row: any) => {
  currentAgent.value = row;
  try {
    await agentApi.registerAsModel(row.id);
    ElMessage.success('Agent已注册为模型');
    await loadRegisteredModel();
  } catch (e: any) {
    ElMessage.error('注册失败: ' + (e.message || ''));
  }
};

const registerAsModel = async () => {
  if (!currentAgent.value?.id) return;
  registering.value = true;
  try {
    await agentApi.registerAsModel(currentAgent.value.id);
    ElMessage.success('注册成功');
    await loadRegisteredModel();
  } catch (e: any) {
    ElMessage.error('注册失败: ' + (e.message || ''));
  } finally {
    registering.value = false;
  }
};

const unregisterModel = async () => {
  if (!currentAgent.value?.id) return;
  unregistering.value = true;
  try {
    await agentApi.unregisterModel(currentAgent.value.id);
    ElMessage.success('已取消注册');
    registeredModel.value = null;
  } catch (e: any) {
    ElMessage.error('取消失败: ' + (e.message || ''));
  } finally {
    unregistering.value = false;
  }
};

onMounted(() => {
  loadAgents();
});
</script>

<style scoped>
.agents-page {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sub-agents-toolbar {
  display: flex;
  gap: 10px;
}

.orchestration-toolbar {
  display: flex;
  gap: 10px;
}
</style>
