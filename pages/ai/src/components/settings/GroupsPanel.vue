<template>
  <PanelPage title="分组管理" subtitle="为不同业务/团队分配模型分组，并绑定可用 AppKey" :loading="loading">
    <template #actions>
      <ReButton v-if="isAdmin" layout="square" type="primary" size="small" plain icon="Refresh" @click="fetchData">刷新</ReButton>
      <ReButton v-if="isAdmin" layout="square" type="primary" size="small" plain icon="Plus" @click="openCreate">新建分组</ReButton>
    </template>

    <div class="group-grid">
      <div v-for="group in groups" :key="group.id" class="group-card">
        <div class="group-card__head">
          <div class="group-card__icon">{{ group.name.charAt(0) }}</div>
          <div class="group-card__info">
            <div class="group-card__name">{{ group.name }}</div>
            <div class="group-card__meta">
              {{ group.models.length }} 个模型 · {{ group.appKeyIds.length }} 个 AppKey
            </div>
          </div>
          <el-dropdown v-role="'admin'" trigger="click" @command="(c: string) => onCommand(c, group)">
            <el-button type="text" size="small" class="group-card__more">⋯</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="group-card__body">
          <div class="meta-row">
            <span class="meta-row__label">关联模型</span>
            <div class="meta-row__tags">
              <el-tag v-for="m in group.models" :key="m" size="small" effect="plain">{{ m }}</el-tag>
              <span v-if="group.models.length === 0" class="empty-text">未配置</span>
            </div>
          </div>
          <div class="meta-row">
            <span class="meta-row__label">绑定</span>
            <div class="meta-row__tags">
              <el-tag
                v-for="aid in group.appKeyIds"
                :key="aid"
                size="small"
                :type="getKeyTagType(aid)"
                effect="plain"
              >
                {{ getKeyName(aid) }}
              </el-tag>
              <span v-if="group.appKeyIds.length === 0" class="empty-text">未绑定</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!loading && groups.length === 0" class="empty-wrap">
        <el-empty description="暂无分组，点击右上角创建" />
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑分组' : '新建分组'" width="540px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="form.name" placeholder="如 客服组、研发组" />
        </el-form-item>
        <el-form-item label="关联模型" prop="models">
          <el-select v-model="form.models" multiple placeholder="选择关联的 AI 模型" style="width: 100%">
            <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定">
          <el-select v-model="form.appKeyIds" multiple placeholder="选择可使用的 AppKey" style="width: 100%">
            <el-option v-for="t in allKeys" :key="t.id" :label="`${t.name} (${t.provider})`" :value="t.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 分组管理面板
 * 调用 /v2/ai/groups 与 /v2/ai/app-keys。
 */
import { ref, reactive, computed, onMounted } from 'vue';
import type { FormInstance } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { groupsApi, appKeysApi, providersApi, type Group, type AppKey, type Provider } from '../../api';
import PanelPage from '../PanelPage.vue';
import ReButton from '../../../../../packages/ui/src/components/ReButton/ReButton.vue';

/** 当前用户是否管理员（基于 window.__userRoles / localStorage['user-roles']） */
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

defineProps<{ id?: string }>();

const loading = ref(false);
const groups = ref<Group[]>([]);
const allKeys = ref<AppKey[]>([]);
const availableModels = ref<string[]>([]);

const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref(0);
const form = reactive({
  name: '',
  models: [] as string[],
  appKeyIds: [] as number[],
});

const rules = {
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
  models: [{ required: true, message: '请至少选择一个关联模型', trigger: 'change' }],
};

const getKeyName = (id: number) => allKeys.value.find((t) => t.id === id)?.name || String(id);
const getKeyTagType = (id: number): 'primary' | 'success' | 'warning' | 'info' => {
  const t = allKeys.value.find((k) => k.id === id);
  if (!t) return 'info';
  const map: Record<string, any> = { OpenAI: 'primary', Claude: 'success', Gemini: 'warning' };
  return map[t.name] || 'info';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [g, k, p] = await Promise.all([groupsApi.list(), appKeysApi.list(), providersApi.list()]);
    groups.value = g;
    allKeys.value = k;
    availableModels.value = Array.from(new Set(p.flatMap((pv: Provider) => pv.models || [])));
  } catch (e: any) {
    ElMessage.error('加载分组失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = false;
  editingId.value = 0;
  form.name = '';
  form.models = [];
  form.appKeyIds = [];
  dialogVisible.value = true;
};

const submitForm = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return;
    try {
      if (editing.value) {
        await groupsApi.update(editingId.value, { ...form });
        ElMessage.success('分组已更新');
      } else {
        await groupsApi.create({ ...form });
        ElMessage.success('分组已创建');
      }
      dialogVisible.value = false;
      await fetchData();
    } catch {
      ElMessage.error('保存失败');
    }
  });
};

const onCommand = async (cmd: string, group: Group) => {
  if (cmd === 'edit') {
    editing.value = true;
    editingId.value = group.id;
    form.name = group.name;
    form.models = [...group.models];
    form.appKeyIds = [...group.appKeyIds];
    dialogVisible.value = true;
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm(`确定删除分组 "${group.name}" 吗？`, '提示', { type: 'warning' });
      await groupsApi.delete(group.id);
      ElMessage.success('分组已删除');
      await fetchData();
    } catch {
      // cancelled
    }
  }
};

onMounted(fetchData);
</script>

<style scoped>
.group-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }

.group-card {
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-radius-md);
  padding: 14px 16px;
  background: var(--ai-card-bg);
  transition: border-color var(--ai-transition-fast);
}
.group-card:hover { border-color: #d1d5db; }

.group-card__head { display: flex; align-items: center; gap: 12px; }
.group-card__icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: #eef2ff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 14px; color: var(--el-color-primary);
  flex-shrink: 0;
}
.group-card__info { flex: 1; min-width: 0; }
.group-card__name { font-size: 14px; font-weight: 600; color: var(--ai-text-primary); }
.group-card__meta { font-size: 12px; color: var(--ai-text-muted); margin-top: 3px; }
.group-card__more { font-size: 16px; color: var(--ai-text-muted); }

.group-card__body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ai-card-border);
}
.meta-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.meta-row__label { color: var(--ai-text-muted); flex-shrink: 0; min-width: 64px; }
.meta-row__tags { display: flex; flex-wrap: wrap; gap: 4px; }
.empty-text { font-size: 12px; color: var(--ai-text-muted); }
.empty-wrap { padding: 20px 0; }
</style>
