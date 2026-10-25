<template>
  <RePage data-page="agents" title="Agent管理" subtitle="智能体清单、工具绑定与系统提示词">
    <template #actions>
      <el-button @click="installDialogVisible = true">
        <el-icon><Download /></el-icon> 安装智能体
      </el-button>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增Agent
      </el-button>
    </template>

    <!-- Agent列表：裸 el-table → ReTable（默认引擎已是 vxe；原表带 border 走
         ReTable 默认省略；页面无分页 → :pagination="false"；toolbar 关闭；无 height → minHeight 抑制）。 -->
    <ReTable
      :data="agentList"
      :columns="agentColumns"
      :loading="loading"
      :layout-table="{ minHeight: 0 }"
      style="width: 100%"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
    >
      <template #col-type="{ row }">
        <el-tag :type="row.type === 'master' ? 'warning' : 'info'" >
          {{ row.type === 'master' ? '主Agent' : '子Agent' }}
        </el-tag>
      </template>
      <template #col-status="{ row }">
        <el-tag :type="row.enabled ? 'success' : 'danger'" >
          {{ row.enabled ? '启用' : '禁用' }}
        </el-tag>
      </template>
      <!-- 操作列统一 ReButton square（纯图标 + tooltip） -->
      <template #col-actions="{ row }">
        <div class="row-actions">
          <ReButton layout="square" type="primary" :icon="Share" tip="工作流配置" @click="handleConfig(row)" />
          <ReButton layout="square" type="success" :icon="Promotion" tip="注册为模型" @click="handleRegister(row)" />
          <ReButton layout="square" type="warning" :icon="Edit" tip="编辑" @click="handleEdit(row)" />
          <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="handleDelete(row)" />
        </div>
      </template>
    </ReTable>

    <!-- 已安装的智能体包（磁盘 + 落库状态） -->
    <div class="section-header">
      <h3>已安装的智能体包</h3>
      <el-button @click="loadPackages" :loading="loadingPackages">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </div>
    <!-- 已安装的智能体包：裸 el-table → ReTable（border 走默认省略；分页/工具栏关闭） -->
    <ReTable
      :data="packageList"
      :columns="packageColumns"
      :loading="loadingPackages"
      :layout-table="{ minHeight: 0 }"
      style="width: 100%"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
    >
      <template #col-source="{ row }">
        <el-tag :type="row.source === 'builtin' ? 'info' : 'success'">{{ row.source }}</el-tag>
      </template>
      <template #col-installed="{ row }">
        <el-tag :type="row.installed ? 'success' : 'warning'">{{ row.installed ? '是' : '否' }}</el-tag>
      </template>
      <template #col-enabled="{ row }">
        <!--
          内置（builtin）智能体包不可停用：后端 toggle 只认用户安装包，
          对 build/coordinator/plan 恒回 404「智能体不存在」（2026-10-07 逐按钮
          sweep 实测：3 个内置包开关全 404 + 报错 toast）。给一个点了必失败的
          开关不如直接禁用并说明原因；用户包（source=user）保持原行为。
        -->
        <el-switch
          :model-value="row.enabled"
          :disabled="row.source === 'builtin'"
          :title="row.source === 'builtin' ? '内置智能体不支持启停' : ''"
          @change="(v: any) => handleTogglePackage(row, v)"
        />
      </template>
      <template #col-actions="{ row }">
        <div class="row-actions">
          <ReButton layout="square" type="danger" :icon="Delete" tip="卸载" @click="handleUninstallPackage(row)" />
        </div>
      </template>
    </ReTable>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="editDialogVisible" :title="editingId ? '编辑Agent' : '新增Agent'" width="600px">
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
    </ReDialog>

    <!-- 工作流配置弹窗 -->
    <ReDialog v-model="configDialogVisible" :title="`工作流配置 - ${currentAgent?.name || ''}`" width="900px" top="5vh">
      <el-tabs v-model="configTab" type="border-card">
        <!-- 子Agent管理 -->
        <el-tab-pane label="子Agent管理" name="sub-agents">
          <div class="sub-agents-toolbar">
            <el-button type="primary" @click="handleAddSubAgent">
              <el-icon><Plus /></el-icon> 添加子Agent
            </el-button>
            <el-button @click="loadSubAgents" :loading="loadingSubAgents">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
          <!-- 子Agent表：裸 el-table → ReTable（border 走默认；对话框内无分页） -->
          <ReTable
            :data="subAgentList"
            :columns="subAgentColumns"
            :loading="loadingSubAgents"
            :layout-table="{ minHeight: 0 }"
            style="width: 100%; margin-top: 10px"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <template #col-actions="{ row }">
              <div class="row-actions">
                <ReButton layout="square" type="warning" :icon="Edit" tip="编辑" @click="handleEditSubAgent(row)" />
                <ReButton layout="square" type="danger" :icon="Delete" tip="删除" @click="handleDeleteSubAgent(row)" />
              </div>
            </template>
          </ReTable>
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
            <el-button type="primary" @click="saveOrchestration" :loading="savingOrchestration">保存编排</el-button>
            <el-button type="success" @click="runOrchestration" :loading="runningOrchestration">运行测试</el-button>
            <el-button @click="loadOrchestration" :loading="loadingOrchestration">重新加载</el-button>
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
              <el-tag type="success" >已注册</el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="尚未注册为模型" />
          <div style="margin-top: 20px">
            <el-button v-if="!registeredModel" type="primary" @click="registerAsModel" :loading="registering">注册为模型</el-button>
            <el-button v-else type="danger" @click="unregisterModel" :loading="unregistering">取消注册</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </ReDialog>

    <!-- 子Agent编辑弹窗 -->
    <ReDialog v-model="subAgentDialogVisible" :title="editingSubId ? '编辑子Agent' : '添加子Agent'" width="500px">
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
          <ReNumberInput v-model="subAgentForm.order" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input v-model="subAgentForm.systemPrompt" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subAgentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSubAgent" :loading="savingSubAgent">保存</el-button>
      </template>
    </ReDialog>

    <!-- 安装智能体 -->
    <ReDialog v-model="installDialogVisible" title="安装智能体" width="720px" top="6vh">
      <el-tabs v-model="installTab">
        <!-- 市场 -->
        <el-tab-pane label="市场" name="market">
          <div class="install-toolbar">
            <el-select v-model="marketSource" placeholder="来源" style="width: 160px" clearable>
              <el-option v-for="s in marketSourceList" :key="s.source" :label="s.display_name || s.source" :value="s.source" />
            </el-select>
            <el-input v-model="marketKeyword" placeholder="关键词，可空" style="width: 220px" clearable @keyup.enter="handleMarketSearch" />
            <el-button type="primary" @click="handleMarketSearch" :loading="searchingMarket">搜索</el-button>
          </div>
          <!-- 市场表：裸 el-table → ReTable（border 走默认；对话框内无分页） -->
          <ReTable
            :data="marketItems"
            :columns="marketColumns"
            :loading="searchingMarket"
            :layout-table="{ minHeight: 0 }"
            style="width: 100%; margin-top: 10px"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <template #col-actions="{ row }">
              <div class="row-actions">
                <ReButton layout="square" type="primary" :icon="Download" tip="安装"
                  @click="handleInstallFromMarket(row)" />
              </div>
            </template>
          </ReTable>
        </el-tab-pane>

        <!-- 本地导入 -->
        <el-tab-pane label="本地导入" name="local">
          <el-alert
            title="智能体包为目录 + AGENT.md（YAML frontmatter + 正文），子智能体放 agents/<name>/AGENT.md"
            type="info"
            :closable="false"
            style="margin-bottom: 12px"
          />
          <el-form label-width="90px">
            <el-form-item label="目录路径">
              <el-input v-model="importPath" placeholder="如 G:\\work\\agents\\builtin\\coordinator" />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="handleImportPath" :loading="importing">导入目录</el-button>
          <el-divider>或</el-divider>
          <el-upload :auto-upload="false" :show-file-list="false" accept=".zip" :on-change="handleZipSelected">
            <el-button :loading="importing">选择 zip 上传</el-button>
          </el-upload>
          <div class="install-hint" v-if="installHint">{{ installHint }}</div>
        </el-tab-pane>
      </el-tabs>
    </ReDialog>
  </RePage>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Plus, Refresh, Download, Edit, Delete, Share, Promotion } from '@element-plus/icons-vue';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { agentApi } from '@/services/javaApi';
import ReDialog from '@repo/ui/re-dialog';
import ReNumberInput from '@/components/re/ReNumberInput.vue';
import RePage from '@/components/re/RePage.vue';
import ReButton from '@repo/ui/re-button';

// ==================== 四张表的列配置（原模板里的 el-table-column 收敛为数组） ====================
/** Agent 列表：类型 / 状态 / 操作原本无 prop 或带默认插槽 → slot。 */
const agentColumns: ReTableColumn[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: 'Agent名称', minWidth: 150 },
  { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'model', label: '绑定模型', minWidth: 120 },
  { prop: 'type', label: '类型', width: 100, slot: 'type' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'actions', label: '操作', width: 280, fixed: 'right', slot: 'actions' },
];

/** 智能体包列表：来源 / 已落库 / 启用 / 操作 → slot（后三列原为无 prop 的模板列）。 */
const packageColumns: ReTableColumn[] = [
  { prop: 'name', label: '包名', minWidth: 140 },
  { prop: 'description', label: '描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'model', label: '绑定模型', minWidth: 120 },
  { prop: 'source', label: '来源', width: 90, slot: 'source' },
  { prop: 'sub_agents', label: '子智能体', width: 90, align: 'center' },
  { prop: 'installed', label: '已落库', width: 80, align: 'center', slot: 'installed' },
  { prop: 'enabled', label: '启用', width: 80, align: 'center', slot: 'enabled' },
  { prop: 'actions', label: '操作', width: 100, fixed: 'right', slot: 'actions' },
];

/** 子 Agent 表（工作流配置弹窗）。 */
const subAgentColumns: ReTableColumn[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '子Agent名称', minWidth: 150 },
  { prop: 'model', label: '绑定模型', minWidth: 120 },
  { prop: 'role', label: '角色', width: 120 },
  { prop: 'order', label: '执行顺序', width: 100, align: 'center' },
  { prop: 'systemPrompt', label: '系统提示词', minWidth: 180, showOverflowTooltip: true },
  { prop: 'actions', label: '操作', width: 150, fixed: 'right', slot: 'actions' },
];

/** 安装市场表（安装智能体弹窗）。 */
const marketColumns: ReTableColumn[] = [
  { prop: 'name', label: '名称', minWidth: 140 },
  { prop: 'description', label: '描述', minWidth: 180, showOverflowTooltip: true },
  { prop: 'model', label: '模型', width: 120 },
  { prop: 'display_source', label: '来源', width: 110 },
  { prop: 'actions', label: '操作', width: 90, fixed: 'right', slot: 'actions' },
];

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

// ==================== 智能体安装包 ====================
const packageList = ref<any[]>([]);
const loadingPackages = ref(false);

const loadPackages = async () => {
  loadingPackages.value = true;
  try {
    const res = await agentApi.packages();
    const raw = res?.data || res || [];
    packageList.value = Array.isArray(raw) ? raw : [];
  } catch (e) {
    packageList.value = [];
  } finally {
    loadingPackages.value = false;
  }
};

const handleTogglePackage = async (row: any, enabled: boolean) => {
  try {
    await agentApi.togglePackage(row.name, enabled);
    message.success(enabled ? '已启用' : '已禁用');
    await Promise.all([loadPackages(), loadAgents()]);
  } catch (e: any) {
    message.error('切换失败: ' + (e?.message || ''));
  }
};

const handleUninstallPackage = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定卸载智能体包 "${row.name}" 吗？将同时删除库中记录。`, '确认卸载', { type: 'warning' });
    await agentApi.uninstallPackage(row.name);
    message.success('已卸载');
    await Promise.all([loadPackages(), loadAgents()]);
  } catch (e) {
    if (e !== 'cancel') message.error('卸载失败');
  }
};

// ==================== 安装弹窗 ====================
const installDialogVisible = ref(false);
const installTab = ref('market');
const installHint = ref('');

// 市场
const marketSource = ref<string | undefined>(undefined);
const marketSourceList = ref<any[]>([]);
const marketKeyword = ref('');
const marketItems = ref<any[]>([]);
const searchingMarket = ref(false);

const loadMarketSources = async () => {
  try {
    const res = await agentApi.marketSources();
    const raw = res?.data || res || [];
    marketSourceList.value = Array.isArray(raw) ? raw : [];
  } catch (e) {
    marketSourceList.value = [];
  }
};

const handleMarketSearch = async () => {
  searchingMarket.value = true;
  try {
    const res = await agentApi.marketSearch({ keyword: marketKeyword.value || undefined });
    const data = res?.data || res || {};
    let items = Array.isArray(data.items) ? data.items : [];
    if (marketSource.value) {
      items = items.filter((i: any) => i.source === marketSource.value);
    }
    marketItems.value = items;
  } catch (e: any) {
    marketItems.value = [];
    message.error('检索失败: ' + (e?.message || ''));
  } finally {
    searchingMarket.value = false;
  }
};

const handleInstallFromMarket = async (row: any) => {
  installing.value = true;
  try {
    await agentApi.installPackage({ source: row.source, path: row.path, url: row.url });
    message.success(`已安装 ${row.name}`);
    installHint.value = `已安装：${row.name}`;
    await Promise.all([loadPackages(), loadAgents(), handleMarketSearch()]);
  } catch (e: any) {
    message.error('安装失败: ' + (e?.message || ''));
  } finally {
    installing.value = false;
  }
};

// 本地导入
const importPath = ref('');
const importing = ref(false);
const installing = ref(false);

const handleImportPath = async () => {
  if (!importPath.value) {
    message.warning('请输入目录路径');
    return;
  }
  importing.value = true;
  try {
    const res = await agentApi.importPackage({ path: importPath.value });
    const data = res?.data || res || {};
    installHint.value = `已安装：${data.name}（子智能体 ${(data.sub_agents || []).length} 个）`;
    message.success('导入成功');
    await Promise.all([loadPackages(), loadAgents()]);
  } catch (e: any) {
    message.error('导入失败: ' + (e?.message || ''));
  } finally {
    importing.value = false;
  }
};

const handleZipSelected = async (uploadFile: any) => {
  const file = uploadFile?.raw;
  if (!file) return;
  importing.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await agentApi.importPackage(fd);
    const data = res?.data || res || {};
    installHint.value = `已安装：${data.name}（子智能体 ${(data.sub_agents || []).length} 个）`;
    message.success('上传安装成功');
    await Promise.all([loadPackages(), loadAgents()]);
  } catch (e: any) {
    message.error('上传安装失败: ' + (e?.message || ''));
  } finally {
    importing.value = false;
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
    message.warning('请输入Agent名称');
    return;
  }
  saving.value = true;
  try {
    const payload = toAgentPayload(editForm.value);
    if (editingId.value) {
      await agentApi.update(editingId.value, payload);
      message.success('更新成功');
    } else {
      await agentApi.create(payload);
      message.success('创建成功');
    }
    editDialogVisible.value = false;
    await loadAgents();
  } catch (e: any) {
    message.error('保存失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除Agent "${row.name}" 吗？`, '确认删除', { type: 'warning' });
    await agentApi.delete(row.id);
    message.success('删除成功');
    await loadAgents();
  } catch (e) {
    if (e !== 'cancel') message.error('删除失败');
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
  systemPrompt: '',
});

/** 后端 Agent 响应使用 snake_case；表格与表单使用稳定的 camelCase 视图模型。 */
const normalizeSubAgent = (agent: any) => ({
  ...agent,
  id: agent.agent_id ?? agent.id,
  order: agent.sort_order ?? agent.order ?? 0,
  systemPrompt: agent.system_prompt ?? agent.systemPrompt ?? agent.instruction ?? '',
});

/**
 * GET /{agentId}/sub-agents 在当前后端不存在（返回 405）。
 * 已有 GET /{agentId} 明确通过 toResponse(..., true) 带完整 sub_agents，
 * 刷新和首次加载统一使用已存在的详情契约，避免依赖不存在的路由。
 */
const loadSubAgents = async () => {
  if (!currentAgent.value?.id) return;
  loadingSubAgents.value = true;
  try {
    const res = await agentApi.get(currentAgent.value.id);
    const data = res?.data || res || {};
    const subAgents = Array.isArray(data.sub_agents) ? data.sub_agents : [];
    subAgentList.value = subAgents.map(normalizeSubAgent);
    currentAgent.value = { ...currentAgent.value, subAgents: subAgentList.value };
  } catch (e: any) {
    subAgentList.value = [];
    message.error('加载子Agent失败: ' + (e?.message || ''));
  } finally {
    loadingSubAgents.value = false;
  }
};

const handleAddSubAgent = () => {
  editingSubId.value = null;
  subAgentForm.value = {
    name: '',
    model: '',
    role: '',
    order: subAgentList.value.length + 1,
    systemPrompt: '',
  };
  subAgentDialogVisible.value = true;
};

const handleEditSubAgent = (row: any) => {
  editingSubId.value = row.id;
  subAgentForm.value = {
    name: row.name || '',
    model: row.model || '',
    role: row.role || '',
    order: row.order ?? 0,
    systemPrompt: row.systemPrompt || '',
  };
  subAgentDialogVisible.value = true;
};

const toSubAgentPayload = () => ({
  name: subAgentForm.value.name,
  model: subAgentForm.value.model,
  role: subAgentForm.value.role,
  sort_order: Number(subAgentForm.value.order),
  system_prompt: subAgentForm.value.systemPrompt,
});

const saveSubAgent = async () => {
  if (!currentAgent.value?.id || !subAgentForm.value.name) {
    message.warning('请输入子Agent名称');
    return;
  }
  savingSubAgent.value = true;
  try {
    const payload = toSubAgentPayload();
    if (editingSubId.value) {
      await agentApi.updateSubAgent(currentAgent.value.id, editingSubId.value, payload);
      message.success('子Agent更新成功');
    } else {
      await agentApi.addSubAgent(currentAgent.value.id, payload);
      message.success('子Agent添加成功');
    }
    subAgentDialogVisible.value = false;
    await loadSubAgents();
  } catch (e: any) {
    message.error('保存失败: ' + (e.message || ''));
  } finally {
    savingSubAgent.value = false;
  }
};

const handleDeleteSubAgent = async (row: any) => {
  if (!currentAgent.value?.id) return;
  try {
    await ElMessageBox.confirm(`确定删除子Agent "${row.name}" 吗？`, '确认删除', { type: 'warning' });
    await agentApi.deleteSubAgent(currentAgent.value.id, row.id);
    message.success('删除成功');
    await loadSubAgents();
  } catch (e) {
    if (e !== 'cancel') message.error('删除失败');
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
    message.success('编排配置保存成功');
  } catch (e: any) {
    message.error('保存失败: ' + (e.message || ''));
  } finally {
    savingOrchestration.value = false;
  }
};

const runOrchestration = async () => {
  if (!currentAgent.value?.id) return;
  runningOrchestration.value = true;
  try {
    await agentApi.runOrchestration(currentAgent.value.id, { test: true });
    message.success('编排运行测试已触发');
  } catch (e: any) {
    message.error('运行失败: ' + (e.message || ''));
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
    message.success('Agent已注册为模型');
    await loadRegisteredModel();
  } catch (e: any) {
    message.error('注册失败: ' + (e.message || ''));
  }
};

const registerAsModel = async () => {
  if (!currentAgent.value?.id) return;
  registering.value = true;
  try {
    await agentApi.registerAsModel(currentAgent.value.id);
    message.success('注册成功');
    await loadRegisteredModel();
  } catch (e: any) {
    message.error('注册失败: ' + (e.message || ''));
  } finally {
    registering.value = false;
  }
};

const unregisterModel = async () => {
  if (!currentAgent.value?.id) return;
  unregistering.value = true;
  try {
    await agentApi.unregisterModel(currentAgent.value.id);
    message.success('已取消注册');
    registeredModel.value = null;
  } catch (e: any) {
    message.error('取消失败: ' + (e.message || ''));
  } finally {
    unregistering.value = false;
  }
};

onMounted(() => {
  loadAgents();
  loadPackages();
  loadMarketSources();
});
</script>

<style scoped>
/* 页面外壳（留白 / 标题 / 操作区）已收口到 RePage，原来的 .agents-page /
   .page-header / .page-header-actions 一并删除（留着会与 RePage 的留白叠加）。 */

.sub-agents-toolbar {
  display: flex;
  gap: 10px;
}

.orchestration-toolbar {
  display: flex;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24px 0 10px;
}

.section-header h3 {
  margin: 0;
  font-size: 15px;
}

.install-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.install-hint {
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-color-success);
}
</style>
