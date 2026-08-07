<template>
  <PanelPage title="模型管理" subtitle="管理 AI 模型，关联供应商并设置能力标签" :loading="loading">
    <template #actions>
      <ReButton v-if="isAdmin" layout="square" type="primary" size="small" plain icon="Refresh" @click="loadModels">刷新</ReButton>
      <ReButton v-if="isAdmin" layout="square" type="primary" size="small" plain icon="Plus" @click="openCreate">添加模型</ReButton>
    </template>

    <el-empty v-if="!loading && models.length === 0" description="暂无模型数据，请先添加供应商与模型" />

    <el-table v-else :data="models" stripe @row-click="editModel">
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="code" label="标识" min-width="140">
        <template #default="{ row }">
          <span class="mono-text">{{ row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="providerName" label="供应商" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.providerName" size="small" effect="plain">{{ row.providerName }}</el-tag>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="能力" min-width="220">
        <template #default="{ row }">
          <el-tag v-for="cap in row.capabilities" :key="cap" size="small" effect="plain" class="cap-tag">
            {{ capLabel(cap) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small" effect="plain">
            {{ row.enabled ? '已启用' : '已停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" align="center">
        <template #default="{ row }">
          <ReButton v-if="isAdmin" layout="square" type="primary" size="small" icon="Edit" @click.stop="editModel(row)">编辑</ReButton>
          <ReButton v-if="isAdmin" layout="square" type="danger" size="small" icon="Delete" @click.stop="handleDelete(row)">删除</ReButton>
          <ReSwitch v-if="isAdmin" layout="square" size="small"
            :model-value="row.enabled"
            @update:model-value="(val: boolean | string | number) => toggleEnabled(row, Boolean(val))"
          />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑模型' : '添加模型'" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <ReInput v-model="form.name" placeholder="如 GPT-4o" />
        </el-form-item>
        <el-form-item label="模型标识" prop="code">
          <ReInput v-model="form.code" placeholder="如 gpt-4o" />
        </el-form-item>
        <el-form-item label="关联供应商" prop="providerId" required>
          <ReSelect v-model="form.providerId" placeholder="选择供应商" filterable>
            <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id">
              <span>{{ p.name }}</span>
              <span class="option-sub">{{ p.type }}</span>
            </el-option>
          </ReSelect>
        </el-form-item>
        <el-form-item label="能力标签">
          <div class="cap-switches">
            <div class="cap-switch-row">
              <ReSwitch
                layout="card"
                :model-value="form.capabilities.includes('chat')"
                @update:model-value="(val: boolean | string | number) => toggleCap('chat', Boolean(val))"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a8 8 0 1 1-6.5-7.9V3h-2v1.1A6 6 0 0 0 6 12h6v2H4v-2H3a8 8 0 0 0 18 0z"/>
                </svg>
              </ReSwitch>
              <span class="cap-switch-label">对话</span>
            </div>
            <div class="cap-switch-row">
              <ReSwitch
                layout="card"
                :model-value="form.capabilities.includes('vision')"
                @update:model-value="(val: boolean | string | number) => toggleCap('vision', Boolean(val))"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </ReSwitch>
              <span class="cap-switch-label">视觉</span>
            </div>
            <div class="cap-switch-row">
              <ReSwitch
                layout="card"
                :model-value="form.capabilities.includes('think')"
                @update:model-value="(val: boolean | string | number) => toggleCap('think', Boolean(val))"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18h6"/>
                  <path d="M10 21h4"/>
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4 2.5 5.5L9 15h6l1.5-2.5C18.5 11 20 9.5 20 7a7 7 0 0 0-7-7z"/>
                  <path d="M10 8h4"/>
                </svg>
              </ReSwitch>
              <span class="cap-switch-label">深度思考</span>
            </div>
            <div class="cap-switch-row">
              <ReSwitch
                layout="card"
                :model-value="form.capabilities.includes('search')"
                @update:model-value="(val: boolean | string | number) => toggleCap('search', Boolean(val))"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="7"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </ReSwitch>
              <span class="cap-switch-label">智能搜索</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <ReInput v-model="form.description" type="textarea" :rows="2" placeholder="模型描述（可选）" />
        </el-form-item>
        <el-form-item label="启用">
          <ReSwitch layout="card" v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="handleSave">保存</ReButton>
      </template>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { modelsApi, providersApi } from '../../api';
import { AiModel, Provider } from '../../api/types';
import { ElMessage, ElMessageBox } from 'element-plus';
import PanelPage from '../PanelPage.vue';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
import ReButton from '@repo/ui/re-button';
import ReSwitch from '@repo/ui/re-switch';

defineProps<{ id?: string }>();

const isAdmin = computed(() => {
  if (import.meta.env.DEV) return true;
  const getRoles = () => {
    if (typeof window !== 'undefined' && window.__userRoles?.length) return window.__userRoles;
    try {
      const raw = localStorage.getItem('user-roles');
      if (raw) return JSON.parse(raw);
    } catch { /* 忽略 */ }
    return [];
  };
  const roles = getRoles() as string[];
  return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
});

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
  providerId: [{ required: true, message: '请选择关联供应商', trigger: 'change' }],
};

const capLabel = (cap: string) => {
  const map: Record<string, string> = {
    chat: '对话', vision: '视觉', think: '深度思考', search: '智能搜索',
  };
  return map[cap] || cap;
};

function toggleCap(cap: string, enabled: boolean) {
  if (enabled && !form.value.capabilities.includes(cap)) {
    form.value.capabilities.push(cap);
  } else if (!enabled) {
    form.value.capabilities = form.value.capabilities.filter((c) => c !== cap);
  }
}

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
  } catch { /* 忽略 */ }
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

async function toggleEnabled(row: AiModel, enabled: boolean) {
  try {
    await modelsApi.update(row.id, { ...row, enabled });
    ElMessage.success(enabled ? '已启用' : '已停用');
    await loadModels();
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleDelete(row: AiModel) {
  try {
    await ElMessageBox.confirm(`确定删除模型「${row.name}」？`, '确认删除', { type: 'warning' });
    await modelsApi.delete(row.id);
    ElMessage.success('删除成功');
    await loadModels();
  } catch { /* 取消 */ }
}

onMounted(() => {
  loadModels();
  loadProviders();
});
</script>

<style scoped>
.mono-text { font-family: monospace; font-size: 12px; color: var(--ai-text-primary); }
.text-muted { color: var(--ai-text-muted); font-size: 12px; }
.cap-tag { margin-right: 4px; }
.option-sub { float: right; font-size: 12px; color: var(--ai-text-muted); }
.cap-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 4px 0;
}
.cap-switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cap-switch-label {
  font-size: 13px;
  color: var(--ai-text-primary);
  font-weight: 500;
  user-select: none;
}
:deep(.el-table .el-table__body-cell:last-child .cell) { display: flex; justify-content: center; gap: 10px; align-items: center; }
:deep(.el-table .el-table__header-cell:last-child .cell) { justify-content: center; }
</style>