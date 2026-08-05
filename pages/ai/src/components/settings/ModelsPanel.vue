<template>
  <PanelPage title="模型管理" subtitle="管理 AI 模型，关联供应商并设置能力标签" :loading="loading">
    <template #actions>
      <el-button v-role="'admin'" type="primary" size="small" @click="openCreate">
        <el-icon><Plus /></el-icon>
        <span class="btn-label">添加模型</span>
      </el-button>
    </template>

    <el-empty v-if="!loading && models.length === 0" description="暂无模型数据，请先添加供应商与模型" />

    <el-table v-else :data="models" style="width: 100%" stripe @row-click="editModel">
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="code" label="标识" min-width="140">
        <template #default="{ row }">
          <span class="mono-text">{{ row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="providerName" label="供应商" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.providerName" size="small">{{ row.providerName }}</el-tag>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="能力" min-width="200">
        <template #default="{ row }">
          <el-tag v-for="cap in row.capabilities" :key="cap" size="small" class="cap-tag">
            {{ cap === 'think' ? '深度思考' : cap === 'search' ? '智能搜索' : cap === 'vision' ? '视觉' : cap }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
            {{ row.enabled ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button v-role="'admin'" type="primary" size="small" text @click.stop="editModel(row)">编辑</el-button>
          <el-button v-role="'admin'" type="danger" size="small" text @click.stop="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑模型' : '添加模型'" width="520px" :close-on-click-modal="false">
      <el-form :model="form" :rules="rules" label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="form.name" placeholder="如 GPT-4o" />
        </el-form-item>
        <el-form-item label="模型标识" prop="code">
          <el-input v-model="form.code" placeholder="如 gpt-4o" />
        </el-form-item>
        <el-form-item label="关联供应商" prop="providerId">
          <el-select v-model="form.providerId" placeholder="选择供应商" clearable filterable style="width: 100%">
            <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id">
              <span>{{ p.name }}</span>
              <span class="option-sub">{{ p.type }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="能力标签">
          <el-checkbox-group v-model="form.capabilities">
            <el-checkbox value="chat" label="对话" />
            <el-checkbox value="vision" label="视觉" />
            <el-checkbox value="think" label="深度思考" />
            <el-checkbox value="search" label="智能搜索" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="模型描述（可选）" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { modelsApi, providersApi } from '../../api';
import { AiModel, Provider } from '../../api/types';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import PanelPage from '../PanelPage.vue';

const loading = ref(false);
const saving = ref(false);
const models = ref<AiModel[]>([]);
const providers = ref<Provider[]>([]);
const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref(0);

const form = ref<{
  name: string;
  code: string;
  providerId: number | null;
  capabilities: string[];
  description: string;
  enabled: boolean;
}>({
  name: '',
  code: '',
  providerId: null,
  capabilities: ['chat'],
  description: '',
  enabled: true,
});

const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入模型标识', trigger: 'blur' }],
};

async function loadModels() {
  loading.value = true;
  try {
    models.value = await modelsApi.list();
  } catch {
    ElMessage.error('加载模型列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadProviders() {
  try {
    providers.value = await providersApi.list();
  } catch {
    // ignore
  }
}

function openCreate() {
  editing.value = false;
  editingId.value = 0;
  form.value = { name: '', code: '', providerId: null, capabilities: ['chat'], description: '', enabled: true };
  dialogVisible.value = true;
}

function editModel(row: AiModel) {
  editing.value = true;
  editingId.value = row.id;
  form.value = {
    name: row.name,
    code: row.code,
    providerId: row.providerId,
    capabilities: [...row.capabilities],
    description: row.description || '',
    enabled: row.enabled,
  };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editing.value) {
      await modelsApi.update(editingId.value, form.value);
      ElMessage.success('更新成功');
    } else {
      await modelsApi.create(form.value as any);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await loadModels();
  } catch {
    ElMessage.error('操作失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: AiModel) {
  try {
    await ElMessageBox.confirm(`确定删除模型「${row.name}」？`, '确认删除', { type: 'warning' });
    await modelsApi.delete(row.id);
    ElMessage.success('删除成功');
    await loadModels();
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadModels();
  loadProviders();
});
</script>

<style scoped>
.btn-label { margin-left: 4px; }
.mono-text { font-family: monospace; font-size: 12px; color: var(--ai-text-primary); }
.text-muted { color: var(--ai-text-muted); font-size: 12px; }
.cap-tag { margin-right: 4px; }
.option-sub { float: right; font-size: 12px; color: var(--ai-text-muted); }
</style>
