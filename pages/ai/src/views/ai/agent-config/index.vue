<template>
  <section class="agent-config-page system-container modern-bg">
    <div class="chat-like-header">
      <ScButton circle type="default" class="chat-like-header__back" @click="handleBackPage">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">Agent 配置管理</span>
        <span class="chat-like-header__subtitle">管理 Agent 编排、子 Agent 与 Skills</span>
      </div>
      <div class="chat-like-header__actions">
        <el-button type="primary" size="small" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" />
          新建 Agent
        </el-button>
      </div>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading">
      <el-table-column prop="sysAiAgentConfigName" label="名称" min-width="140" />
      <el-table-column prop="sysAiAgentConfigCode" label="编码" min-width="120" />
      <el-table-column prop="sysAiAgentConfigType" label="模式" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.sysAiAgentConfigType)" size="small">
            {{ typeLabel(row.sysAiAgentConfigType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.sysAiAgentConfigStatus === 1 ? 'success' : 'danger'" size="small">
            {{ row.sysAiAgentConfigStatus === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sysAiAgentConfigSkillIds" label="关联 Skills" min-width="120">
        <template #default="{ row }">
          <span class="skill-tags">
            {{ row.sysAiAgentConfigSkillIds || '—' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="MCP" width="70" align="center">
        <template #default="{ row }">
          <el-tag type="info" size="small">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sysAiAgentConfigSort" label="排序" width="60" align="center" />
      <el-table-column prop="sysAiAgentConfigRemark" label="备注" min-width="120" show-overflow-tooltip />
      <el-table-column label="模型" width="90" align="center">
        <template #default="{ row }">
          <el-tag
            v-if="isAgentModel(row)"
            type="warning"
            size="small"
            effect="dark"
          >已注册</el-tag>
          <span v-else style="color: var(--el-text-color-placeholder); font-size: 12px;">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="290" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="success" @click="goOrchestration(row)">编排</el-button>
          <el-button
            v-if="isAgentModel(row)"
            size="small"
            type="warning"
            @click="handleUnregisterModel(row)"
          >取消模型</el-button>
          <el-button
            v-else
            size="small"
            type="primary"
            @click="handleRegisterModel(row)"
          >设为模型</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑 Agent' : '新建 Agent'" width="700px" destroy-on-close>
      <el-form :model="form" label-width="120px" v-loading="saving">
        <el-form-item label="名称" required>
          <el-input v-model="form.sysAiAgentConfigName" placeholder="Agent 名称" />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="form.sysAiAgentConfigCode" placeholder="唯一编码，如 default" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="编排模式">
          <el-select v-model="form._leaderMode" style="width: 100%">
            <el-option label="AI 模式" value="SINGLE" />
            <el-option label="编排" value="ORCHESTRATION" />
          </el-select>
        </el-form-item>

        <el-form-item label="System Prompt">
          <el-input v-model="form.sysAiAgentConfigLeaderPrompt" type="textarea" :rows="4"
            placeholder="系统提示词，定义 Agent 的行为与角色" />
        </el-form-item>

        <!-- 编排模式：展开子 Agent / Skills / 编排策略 -->
        <template v-if="isOrchestration">
          <div class="orchestration-section">
            <div class="orchestration-section__head">
              <strong>编排配置</strong>
            </div>

            <el-form-item label="编排策略">
              <el-select v-model="form._orchestrationStrategy" style="width: 100%">
                <el-option label="PIPELINE - 流水线" value="PIPELINE" />
                <el-option label="FAN_OUT - 扇出" value="FAN_OUT" />
                <el-option label="ROUTER - 路由" value="ROUTER" />
                <el-option label="PLAN_AND_EXECUTE - 规划执行" value="PLAN_AND_EXECUTE" />
                <el-option label="AUTO - 自动" value="AUTO" />
              </el-select>
            </el-form-item>

            <el-form-item label="子 Agent">
              <div class="sub-agent-editor">
                <el-table :data="subAgentList" size="small" style="width: 100%" max-height="200">
                  <el-table-column prop="agentId" label="ID" width="100" />
                  <el-table-column prop="agentCode" label="编码" width="120" />
                  <el-table-column prop="description" label="描述" show-overflow-tooltip />
                  <el-table-column label="操作" width="80" fixed="right">
                    <template #default="{ $index }">
                      <el-button size="small" type="danger" link @click="removeSubAgent($index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-button size="small" type="primary" class="sub-agent-editor__add" @click="showSubAgentDialog = true">
                  <IconifyIconOnline icon="ri:add-line" />
                  添加子 Agent
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="关联 Skills">
              <el-select v-model="selectedSkillIds" multiple filterable placeholder="选择技能" style="width: 100%">
                <el-option v-for="s in skillOptions" :key="s.sysAiSkillId" :label="s.sysAiSkillName" :value="s.sysAiSkillId" />
              </el-select>
            </el-form-item>

            <el-form-item label="最大重试">
              <el-input-number v-model="form.sysAiAgentConfigMaxRework" :min="1" :max="10" />
            </el-form-item>
          </div>
        </template>

        <el-form-item label="排序">
          <el-input-number v-model="form.sysAiAgentConfigSort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form._status" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.sysAiAgentConfigRemark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加子 Agent 对话框 -->
    <el-dialog v-model="showSubAgentDialog" title="添加子 Agent" width="450px" destroy-on-close append-to-body>
      <el-form :model="subAgentForm" label-width="80px">
        <el-form-item label="ID" required>
          <el-input v-model="subAgentForm.agentId" placeholder="子 Agent 标识，如 sub1" />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="subAgentForm.agentCode" placeholder="对应 Agent 配置编码" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="subAgentForm.description" placeholder="子 Agent 职责描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubAgentDialog = false">取消</el-button>
        <el-button type="primary" @click="addSubAgent">确定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  listAiAgentConfigs,
  saveAiAgentConfig,
  updateAiAgentConfig,
  deleteAiAgentConfig,
  registerAgentAsModel,
  unregisterAgentModel,
  listAgentModels,
  type AiAgentConfig,
} from "@/api/ai/agent-config";
import { listAiSkills, type AiSkill } from "@/api/ai/skill";

const router = useRouter();
const list = ref<AiAgentConfig[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);

// 子 Agent 列表（从 form.sysAiAgentConfigSubAgents JSON 解析得到的 UI 列表）
const subAgentList = ref<{ agentId: string; agentCode: string; description: string }[]>([]);
const showSubAgentDialog = ref(false);
const subAgentForm = ref({ agentId: "", agentCode: "", description: "" });

// Skills
const skillOptions = ref<AiSkill[]>([]);
const selectedSkillIds = ref<number[]>([]);

// 编排模式：_leaderMode = SINGLE → System 默认，ORCHESTRATION → 编排
const isOrchestration = computed(() => form.value._leaderMode === "ORCHESTRATION");

const defaultForm = () => ({
  sysAiAgentConfigName: "",
  sysAiAgentConfigCode: "",
  sysAiAgentConfigType: "SINGLE",
  sysAiAgentConfigLeaderPrompt: "",
  sysAiAgentConfigSubAgents: "",
  sysAiAgentConfigSkillIds: "",
  sysAiAgentConfigMcpDisabled: 1,
  sysAiAgentConfigLocalCmdDisabled: 1,
  sysAiAgentConfigMaxRework: 3,
  sysAiAgentConfigStatus: 1 as const,
  sysAiAgentConfigSort: 0,
  sysAiAgentConfigRemark: "",
  _status: "1",
  _leaderMode: "SINGLE",
  _orchestrationStrategy: "PIPELINE",
});

const form = ref<any>(defaultForm());

function typeTag(type?: string) {
  if (!type || type === "SINGLE") return "primary";
  return "success";
}

function typeLabel(type?: string) {
  if (!type || type === "SINGLE") return "AI 模式";
  return "编排";
}

// 解析/序列化子 Agent
function parseSubAgentList(json?: string) {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
function syncSubAgentJson() {
  form.value.sysAiAgentConfigSubAgents = subAgentList.value.length
    ? JSON.stringify(subAgentList.value)
    : "";
}

function addSubAgent() {
  if (!subAgentForm.value.agentId || !subAgentForm.value.agentCode) return;
  subAgentList.value.push({ ...subAgentForm.value });
  subAgentForm.value = { agentId: "", agentCode: "", description: "" };
  showSubAgentDialog.value = false;
  syncSubAgentJson();
}
function removeSubAgent(index: number) {
  subAgentList.value.splice(index, 1);
  syncSubAgentJson();
}

// Skill IDs 同步
function syncSkillIds() {
  form.value.sysAiAgentConfigSkillIds = selectedSkillIds.value.length
    ? selectedSkillIds.value.join(",")
    : "";
}

async function fetchSkills() {
  try {
    const res = await listAiSkills();
    skillOptions.value = (res.result || []).filter(s => s.sysAiSkillStatus === 1);
  } catch { /* ignore */ }
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await listAiAgentConfigs();
    list.value = res.result || [];
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  isEdit.value = false;
  form.value = defaultForm();
  subAgentList.value = [];
  selectedSkillIds.value = [];
  dialogVisible.value = true;
}

function openEditDialog(row: AiAgentConfig) {
  isEdit.value = true;
  const storedType = row.sysAiAgentConfigType || "SINGLE";
  const isOrch = storedType !== "SINGLE";
  form.value = {
    ...row,
    _status: String(row.sysAiAgentConfigStatus ?? 1),
    _leaderMode: isOrch ? "ORCHESTRATION" : "SINGLE",
    _orchestrationStrategy: isOrch ? storedType : "PIPELINE",
  };
  subAgentList.value = parseSubAgentList(row.sysAiAgentConfigSubAgents);
  selectedSkillIds.value = row.sysAiAgentConfigSkillIds
    ? row.sysAiAgentConfigSkillIds.split(",").map(Number).filter(Boolean)
    : [];
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    // 映射 _leaderMode + _orchestrationStrategy → sysAiAgentConfigType
    if (form.value._leaderMode === "ORCHESTRATION") {
      form.value.sysAiAgentConfigType = form.value._orchestrationStrategy || "PIPELINE";
      syncSubAgentJson();
      syncSkillIds();
    } else {
      form.value.sysAiAgentConfigType = "SINGLE";
      form.value.sysAiAgentConfigSubAgents = "";
      form.value.sysAiAgentConfigSkillIds = "";
    }
    const data = {
      ...form.value,
      sysAiAgentConfigStatus: Number(form.value._status),
    };
    delete data._status;
    delete data._leaderMode;
    delete data._orchestrationStrategy;
    if (isEdit.value) {
      await updateAiAgentConfig(data);
    } else {
      await saveAiAgentConfig(data);
    }
    dialogVisible.value = false;
    await fetchList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: AiAgentConfig) {
  if (row.sysAiAgentConfigId) {
    await deleteAiAgentConfig(row.sysAiAgentConfigId);
    await fetchList();
  }
}

function handleBackPage() {
  router.back();
}

// ========== Agent 模型关联 ==========

/** 已注册为模型的 Agent 名称集合 */
const agentModelNames = ref<Set<string>>(new Set());

/** 判断某个 Agent 是否已注册为模型 */
function isAgentModel(row: AiAgentConfig) {
  const code = row.sysAiAgentConfigCode || row.sysAiAgentConfigName;
  return agentModelNames.value.has(code);
}

/** 加载已注册的 Agent 模型列表 */
async function fetchAgentModels() {
  try {
    const res = await listAgentModels();
    const names = new Set<string>();
    (res.result || []).forEach((item) => {
      if (item.agentName) names.add(item.agentName);
    });
    agentModelNames.value = names;
  } catch { /* ignore */ }
}

/** 将 Agent 注册为模型 */
async function handleRegisterModel(row: AiAgentConfig) {
  const agentName = row.sysAiAgentConfigCode || row.sysAiAgentConfigName;
  if (!agentName) return;
  try {
    const res = await registerAgentAsModel({ agentName });
    if (res.code === 200) {
      agentModelNames.value.add(agentName);
      ElMessage.success(`Agent "${agentName}" 已注册为模型`);
    } else {
      ElMessage.error(res.msg || "注册失败");
    }
  } catch {
    ElMessage.error("注册失败，请检查后端服务");
  }
}

/** 取消 Agent 模型注册 */
async function handleUnregisterModel(row: AiAgentConfig) {
  const agentName = row.sysAiAgentConfigCode || row.sysAiAgentConfigName;
  if (!agentName) return;
  const modelName = "agent-" + agentName;
  try {
    const res = await unregisterAgentModel(modelName);
    if (res.code === 200) {
      agentModelNames.value.delete(agentName);
      ElMessage.success(`Agent "${agentName}" 已取消模型注册`);
    } else {
      ElMessage.error(res.msg || "取消失败");
    }
  } catch {
    ElMessage.error("取消失败，请检查后端服务");
  }
}

function goOrchestration(row: AiAgentConfig) {
  const code = row.sysAiAgentConfigCode || row.sysAiAgentConfigName;
  router.push({ name: "AiAgentOrchestration", query: { agentName: code } });
}

onMounted(() => {
  fetchList();
  fetchSkills();
  fetchAgentModels();
});
</script>

<style scoped lang="scss">
.agent-config-page {
  padding: 20px;
}
.skill-tags {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.orchestration-section {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    strong {
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    small {
      font-size: 12px;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }
}

.sub-agent-editor {
  width: 100%;

  &__add {
    margin-top: 8px;
  }
}
</style>