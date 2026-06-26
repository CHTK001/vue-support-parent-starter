<template>
  <section class="mcp-server-page system-container modern-bg">
    <div class="chat-like-header">
      <ScButton circle type="default" class="chat-like-header__back" @click="handleBackPage">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">MCP Server 管理</span>
        <span class="chat-like-header__subtitle">管理 MCP 工具服务器（当前 Agent 中已禁用 MCP）</span>
      </div>
      <div class="chat-like-header__actions">
        <el-button type="primary" size="small" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" />
          新建 Server
        </el-button>
      </div>
    </div>

    <el-alert title="Agent 中已禁用 MCP 支持，MCP Server 仅用于 ChatClient 等非 Agent 场景。" type="info" show-icon :closable="false" style="margin-bottom: 16px" />

    <el-table :data="list" style="width: 100%" v-loading="loading">
      <el-table-column prop="sysAiMcpServerName" label="名称" min-width="140" />
      <el-table-column prop="sysAiMcpServerCode" label="编码" min-width="120" />
      <el-table-column prop="sysAiMcpServerUrl" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.sysAiMcpServerStatus === 1 ? 'success' : 'danger'" size="small">
            {{ row.sysAiMcpServerStatus === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sysAiMcpServerTimeout" label="超时(ms)" width="100" align="center" />
      <el-table-column prop="sysAiMcpServerSort" label="排序" width="60" align="center" />
      <el-table-column prop="sysAiMcpServerRemark" label="备注" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" @click="openApiKeyDialog(row)">API Key</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑 MCP Server' : '新建 MCP Server'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="100px" v-loading="saving">
        <el-form-item label="名称" required>
          <el-input v-model="form.sysAiMcpServerName" placeholder="Server 名称" />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="form.sysAiMcpServerCode" placeholder="唯一编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.sysAiMcpServerUrl" placeholder="如 http://localhost:8080" />
        </el-form-item>
        <el-form-item label="超时(ms)">
          <el-input-number v-model="form.sysAiMcpServerTimeout" :min="1000" :step="1000" :max="300000" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sysAiMcpServerSort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form._status" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.sysAiMcpServerRemark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="apiKeyDialogVisible" title="更新 API Key" width="450px" destroy-on-close>
      <el-form :model="apiKeyForm" label-width="100px">
        <el-form-item label="Server ID">
          <el-input :model-value="apiKeyForm.sysAiMcpServerId" disabled />
        </el-form-item>
        <el-form-item label="API Key" required>
          <el-input v-model="apiKeyForm.sysAiMcpServerApiKey" type="password" show-password
            placeholder="输入新的 API Key" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="apiKeyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingApiKey" @click="handleUpdateApiKey">更新</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  listAiMcpServers,
  saveAiMcpServer,
  updateAiMcpServer,
  deleteAiMcpServer,
  updateAiMcpServerApiKey,
  type AiMcpServer,
} from "@/api/ai/mcp-server";

const router = useRouter();
const list = ref<AiMcpServer[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const apiKeyDialogVisible = ref(false);
const savingApiKey = ref(false);

const apiKeyForm = ref<any>({ sysAiMcpServerId: null, sysAiMcpServerApiKey: "" });

const defaultForm = () => ({
  sysAiMcpServerName: "",
  sysAiMcpServerCode: "",
  sysAiMcpServerUrl: "",
  sysAiMcpServerTimeout: 30000,
  sysAiMcpServerStatus: 1 as const,
  sysAiMcpServerSort: 0,
  sysAiMcpServerRemark: "",
  _status: "1",
});

const form = ref<any>(defaultForm());

async function fetchList() {
  loading.value = true;
  try {
    const res = await listAiMcpServers();
    list.value = res.result || [];
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEditDialog(row: AiMcpServer) {
  isEdit.value = true;
  form.value = {
    ...row,
    _status: String(row.sysAiMcpServerStatus ?? 1),
  };
  dialogVisible.value = true;
}

function openApiKeyDialog(row: AiMcpServer) {
  apiKeyForm.value = {
    sysAiMcpServerId: row.sysAiMcpServerId,
    sysAiMcpServerApiKey: "",
  };
  apiKeyDialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const data = {
      ...form.value,
      sysAiMcpServerStatus: Number(form.value._status),
    };
    delete data._status;
    if (isEdit.value) {
      await updateAiMcpServer(data);
    } else {
      await saveAiMcpServer(data);
    }
    dialogVisible.value = false;
    await fetchList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: AiMcpServer) {
  if (row.sysAiMcpServerId) {
    await deleteAiMcpServer(row.sysAiMcpServerId);
    await fetchList();
  }
}

async function handleUpdateApiKey() {
  savingApiKey.value = true;
  try {
    await updateAiMcpServerApiKey(
      apiKeyForm.value.sysAiMcpServerId,
      apiKeyForm.value.sysAiMcpServerApiKey,
    );
    apiKeyDialogVisible.value = false;
  } finally {
    savingApiKey.value = false;
  }
}

function handleBackPage() {
  router.back();
}

onMounted(fetchList);
</script>

<style scoped lang="scss">
.mcp-server-page {
  padding: 20px;
}
</style>