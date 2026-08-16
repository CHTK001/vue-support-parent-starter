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
          <div class="provider-select-row">
            <ReSelect v-model="form.providerId" placeholder="选择供应商" filterable>
              <el-option v-for="opt in providerOptions" :key="opt.value" :label="opt.label" :value="opt.value">
                <span>{{ opt.label }}</span>
                <span class="option-sub">{{ opt.type === 'manufacturer' ? '厂商' : '供应商' }}</span>
              </el-option>
            </ReSelect>
            <ReButton layout="square" type="primary" size="small" plain icon="Plus" @click="openCreateProvider">
              新增供应商
            </ReButton>
          </div>
        </el-form-item>
        <el-form-item label="能力标签">
          <div class="cap-switches">
            <div v-for="cap in capabilityOptions" :key="cap.value" class="cap-switch-row">
              <ReSwitch
                layout="card"
                :model-value="form.capabilities.includes(cap.value)"
                @update:model-value="(val: boolean | string | number) => toggleCap(cap.value, Boolean(val))"
              >
                <span class="cap-switch-icon">{{ cap.icon }}</span>
              </ReSwitch>
              <span class="cap-switch-label">{{ cap.label }}</span>
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

    <!-- 新增供应商弹窗 -->
    <el-dialog v-model="providerDialogVisible" title="新增供应商" width="520px" :close-on-click-modal="false">
      <el-form ref="providerFormRef" :model="providerForm" :rules="providerRules" label-width="90px">
        <el-form-item label="供应商名称" prop="name" required>
          <ReInput v-model="providerForm.name" placeholder="如 OpenAI / 智谱 / DeepSeek" />
        </el-form-item>
        <el-form-item label="类型" prop="type" required>
          <ReSelect v-model="providerForm.type" placeholder="选择类型">
            <el-option v-for="t in providerTypes" :key="t.value" :label="t.label" :value="t.value" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="Base URL">
          <ReInput v-model="providerForm.baseUrl" placeholder="如 https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item label="API Key">
          <ReInput v-model="providerForm.apiKey" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="可用模型">
          <ReInput v-model="providerModelsText" type="textarea" :rows="2" placeholder="逗号分隔，如 gpt-4o, gpt-4o-mini" />
        </el-form-item>
        <el-form-item label="启用">
          <ReSwitch layout="card" v-model="providerForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="providerDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="savingProvider" @click="handleCreateProvider">保存</ReButton>
      </template>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { modelsApi, providersApi, modelCatalogApi, manufacturersApi } from '../../api';
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
  const getRoles = (): string[] => {
    const win = window as unknown as { __userRoles?: string[] };
    if (typeof window !== 'undefined' && win.__userRoles?.length) return win.__userRoles;
    try {
      const raw = localStorage.getItem('user-roles');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* 忽略 */ }
    return [];
  };
  const roles = getRoles();
  return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')
    || roles.includes('superadmin') || roles.includes('admin');
});

const loading = ref(false);
const saving = ref(false);
const models = ref<AiModel[]>([]);
const providers = ref<Provider[]>([]);
const manufacturers = ref<any[]>([]);
const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref(0);

/** 关联供应商下拉选项：模型供应商 + 厂商（厂商值用 m 前缀，避免与供应商 id 冲突） */
const providerOptions = computed(() => {
  const opts: Array<{ value: string; label: string; type: string }> = [];
  for (const p of providers.value || []) {
    opts.push({ value: String(p.id), label: p.name, type: p.type || 'provider' });
  }
  for (const m of manufacturers.value || []) {
    opts.push({
      value: 'm:' + m.sysAiManufacturerId,
      label: m.sysAiManufacturerName || m.sysAiManufacturerCode,
      type: 'manufacturer',
    });
  }
  return opts;
});

const form = ref<{
  name: string;
  code: string;
  providerId: string | null;
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
  const found = capabilityOptions.value.find((c) => c.value === cap);
  return found ? found.label : cap;
};

/** 能力标签选项（后端能力清单动态拉取 + 固定云端能力兜底） */
const CAP_ICON_MAP: Record<string, string> = {
  chat: '💬', vision: '👁', think: '🧠', search: '🔍',
  classify: '🏷', 'image-detect': '🎯', ocr: '📝', feature: '🧬',
  embedding: '🧲', layout: '📐', pose: '🕴', enhance: '✨',
  segment: '✂', 'text-to-image': '🖼', 'text-to-video': '🎬',
};
const CAP_LABEL_MAP: Record<string, string> = {
  chat: '对话', vision: '视觉', think: '深度思考', search: '智能搜索',
  classify: '分类', 'image-detect': '目标检测', ocr: 'OCR 识别', feature: '特征提取',
  embedding: '向量嵌入', layout: '版面分析', pose: '姿态估计', enhance: '图像增强',
  segment: '图像分割', 'text-to-image': '文生图', 'text-to-video': '文生视频',
};

const capabilityOptions = ref<{ value: string; label: string; icon: string }[]>([]);

/** 加载能力选项：优先后端能力清单，失败时回退固定云端能力 */
async function loadCapabilities() {
  try {
    const names = await modelCatalogApi.capabilityNames();
    if (Array.isArray(names) && names.length) {
      capabilityOptions.value = names.map((name) => ({
        value: name,
        label: CAP_LABEL_MAP[name] || name,
        icon: CAP_ICON_MAP[name] || '◈',
      }));
      return;
    }
  } catch { /* 回退固定列表 */ }
  capabilityOptions.value = Object.keys(CAP_LABEL_MAP).map((value) => ({
    value,
    label: CAP_LABEL_MAP[value],
    icon: CAP_ICON_MAP[value] || '◈',
  }));
}

function toggleCap(cap: string, enabled: boolean) {
  if (enabled && !form.value.capabilities.includes(cap)) {
    form.value.capabilities.push(cap);
  } else if (!enabled) {
    form.value.capabilities = form.value.capabilities.filter((c) => c !== cap);
  }
}

/* ===== 新增供应商 ===== */
const providerDialogVisible = ref(false);
const savingProvider = ref(false);
const providerModelsText = ref('');

const providerTypes = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Gemini', value: 'gemini' },
  { label: '通义千问 Qwen', value: 'qwen' },
  { label: '智谱 Zhipu', value: 'zhipu' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '自定义', value: 'custom' },
];

const providerForm = ref({
  name: '',
  type: 'openai',
  baseUrl: '',
  apiKey: '',
  enabled: true,
});

const providerRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
};

function openCreateProvider() {
  providerForm.value = { name: '', type: 'openai', baseUrl: '', apiKey: '', enabled: true };
  providerModelsText.value = '';
  providerDialogVisible.value = true;
}

async function handleCreateProvider() {
  if (!providerForm.value.name.trim()) {
    ElMessage.warning('请输入供应商名称');
    return;
  }
  savingProvider.value = true;
  try {
    const models = providerModelsText.value
      .split(/[,，]/)
      .map((m) => m.trim())
      .filter(Boolean);
    const created = await providersApi.create({
      name: providerForm.value.name.trim(),
      type: providerForm.value.type,
      baseUrl: providerForm.value.baseUrl.trim() || undefined,
      apiKey: providerForm.value.apiKey.trim() || undefined,
      models,
      enabled: providerForm.value.enabled,
    } as any);
    ElMessage.success('供应商已创建');
    providerDialogVisible.value = false;
    await loadProviders();
    // 自动选中新供应商
    const id = (created as any)?.id ?? (created as any)?.providerId;
    if (id != null) form.value.providerId = String(id);
  } catch (e: any) {
    ElMessage.error('创建失败: ' + (e.message || ''));
  } finally {
    savingProvider.value = false;
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
    const [p, m] = await Promise.all([
      providersApi.list(),
      manufacturersApi.list(),
    ]);
    providers.value = Array.isArray(p) ? p : [];
    manufacturers.value = Array.isArray(m) ? m : [];
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
  // 回填时按选项 value 格式归一化（厂商 id 用 m: 前缀；供应商直接数字）
  const providerIdValue = row.providerId != null
    ? (manufacturers.value.some((m) => Number(m.sysAiManufacturerId) === Number(row.providerId))
      ? 'm:' + row.providerId
      : String(row.providerId))
    : null;
  form.value = {
    name: row.name,
    code: row.code,
    providerId: providerIdValue,
    capabilities: [...row.capabilities],
    description: row.description || '',
    enabled: row.enabled,
  };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const payload: Record<string, unknown> = { ...form.value };
    // providerId 选项值 → 后端数字 ID：m:1 → 1（厂商 id，后端兼容查厂商表）；1 → 1（供应商 id）
    const pid = String(form.value.providerId ?? '');
    payload.providerId = pid.startsWith('m:') ? Number(pid.slice(2)) : Number(pid);
    if (editing.value) {
      await modelsApi.update(editingId.value, payload as Partial<AiModel>);
      ElMessage.success('更新成功');
    } else {
      await modelsApi.create(payload as any);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await loadModels();
  } catch (e: any) {
    ElMessage.error('操作失败: ' + (e.message || ''));
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
  loadCapabilities();
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
.provider-select-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.provider-select-row .re-select {
  flex: 1;
  min-width: 0;
}
.cap-switch-icon {
  font-size: 14px;
  line-height: 1;
}
</style>