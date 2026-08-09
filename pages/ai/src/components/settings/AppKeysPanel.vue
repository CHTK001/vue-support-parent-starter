<template>
  <PanelPage title="AppKey 管理" subtitle="管理接入凭证：支持次数限制与过期时间两种形式，可绑定分组限定模型" :loading="loading">
    <template #actions>
      <ReButton v-if="isAdmin" layout="square" type="primary" size="small" plain icon="Refresh" @click="refresh">刷新</ReButton>
      <ReButton layout="square" type="primary" size="small" plain icon="Plus" @click="openCreate">新增 AppKey</ReButton>
    </template>

    <el-empty v-if="!loading && keys.length === 0" description="暂无 AppKey，点击右上角新增" />

    <el-table v-else :data="keys" stripe>
      <el-table-column prop="name" label="名称" min-width="120">
        <template #default="{ row }">
          <span class="key-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="providerName" label="提供商" min-width="110">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.providerName || '未关联' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="AppKey" min-width="160">
        <template #default="{ row }">
          <span class="mono-text">{{ maskKey(row.key) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分组" min-width="100">
        <template #default="{ row }">
          <el-tag v-if="row.groupName" size="small" type="warning" effect="plain">{{ row.groupName }}</el-tag>
          <span v-else class="muted-text">不限</span>
        </template>
      </el-table-column>
      <el-table-column label="次数限制" min-width="120" align="center">
        <template #default="{ row }">
          <span v-if="row.maxUse != null">{{ row.useCount ?? 0 }} / {{ row.maxUse }}</span>
          <span v-else class="muted-text">不限</span>
        </template>
      </el-table-column>
      <el-table-column label="过期时间" min-width="130" align="center">
        <template #default="{ row }">
          <span v-if="row.expireTime">{{ row.expireTime }}</span>
          <span v-else class="muted-text">不限</span>
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
          <ReButton v-if="isAdmin" layout="square" type="primary" size="small" icon="Edit" @click="editKey(row)">编辑</ReButton>
          <ReButton v-if="isAdmin" layout="square" type="danger" size="small" icon="Delete" @click="removeKey(row)">删除</ReButton>
          <ReSwitch v-if="isAdmin" layout="square" size="small"
            :model-value="row.enabled"
            @update:model-value="(val: boolean | string | number) => toggleEnabled(row, Boolean(val))"
          />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑 AppKey' : '新增 AppKey'" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <ReInput v-model="form.name" placeholder="如 生产环境 OpenAI Key" />
        </el-form-item>
        <el-form-item label="密钥值" prop="key">
          <ReInput v-model="form.key" type="password" show-password placeholder="输入 API Key 值" />
        </el-form-item>
        <el-form-item label="绑定" prop="groupId" required>
          <ReSelect v-model="form.groupId" placeholder="选择绑定分组" filterable>
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </ReSelect>
          <div class="hint">绑定分组后，该 Key 只能使用分组下的模型</div>
        </el-form-item>
        <el-form-item label="限制方式">
          <el-radio-group v-model="limitMode" class="limit-mode re-form-radio-group">
            <el-radio-button value="maxUse">次数限制</el-radio-button>
            <el-radio-button value="expireTime">过期时间</el-radio-button>
            <el-radio-button value="">不限</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="limitMode === 'maxUse'" label="次数限制">
          <ReInputNumber
            layout="card"
            v-model="form.maxUse"
            :min="1"
            :step="100"
            placeholder="不填表示不限次数"
          />
          <div class="hint">设置后该 Key 最多使用此次数，留空不限</div>
        </el-form-item>
        <el-form-item v-if="limitMode === 'expireTime'" label="过期时间">
          <el-date-picker
            v-model="form.expireTime"
            type="datetime"
            placeholder="不选表示永不过期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 220px"
          />
          <div class="hint">设置后该 Key 到期自动失效，留空不限</div>
        </el-form-item>
        <el-form-item label="启用">
          <ReSwitch layout="square" v-model="form.enabled" />
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
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { appKeysApi, providersApi, groupsApi, type AppKey, type Provider, type Group } from '../../api';
import PanelPage from '../PanelPage.vue';
import ReSelect from '@repo/ui/re-select';
import ReInputNumber from '@repo/ui/re-input-number';
import ReInput from '@repo/ui/re-input';
import ReButton from '@repo/ui/re-button';
import ReSwitch from '@repo/ui/re-switch';

defineProps<{ id?: string }>();

const isAdmin = computed(() => {
  if (import.meta.env.DEV) return true;
  const getRoles = () => {
    const win = window as unknown as { __userRoles?: string[] };
    if (typeof window !== 'undefined' && win.__userRoles?.length) return win.__userRoles;
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
const keys = ref<AppKey[]>([]);
const providers = ref<Provider[]>([]);
const groups = ref<Group[]>([]);
const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref(0);

const form = ref<{
  name: string;
  key: string;
  provider: number | null;
  groupId: number | null;
  maxUse: number | undefined;
  expireTime: string | null;
  enabled: boolean;
}>({
  name: '',
  key: '',
  provider: null,
  groupId: null,
  maxUse: undefined,
  expireTime: null,
  enabled: true,
});

const limitMode = ref<'maxUse' | 'expireTime' | ''>('');
watch(limitMode, (val) => {
  if (val === 'maxUse') form.value.expireTime = null;
  if (val === 'expireTime') form.value.maxUse = undefined;
});

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  key: [{ required: true, message: '请输入密钥值', trigger: 'blur' }],
  groupId: [{ required: true, message: '请选择绑定分组', trigger: 'change' }],
};

const maskKey = (key: string) => {
  if (!key) return '';
  if (key.length <= 12) return '••••••••••••';
  return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
};

const refresh = async () => {
  loading.value = true;
  try {
    keys.value = await appKeysApi.list();
  } catch (e: any) {
    ElMessage.error('加载失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

const loadOptions = async () => {
  try {
    groups.value = await groupsApi.list();
  } catch { /* 忽略 */ }
};

const openCreate = () => {
  editing.value = false;
  editingId.value = 0;
  limitMode.value = '';
  form.value = { name: '', key: '', provider: null, groupId: null, maxUse: undefined, expireTime: null, enabled: true };
  dialogVisible.value = true;
};

const editKey = (row: AppKey) => {
  editing.value = true;
  editingId.value = row.id;
  limitMode.value = row.maxUse != null ? 'maxUse' : (row.expireTime ? 'expireTime' : '');
  form.value = {
    name: row.name,
    key: row.key,
    provider: row.provider,
    groupId: row.groupId ?? null,
    maxUse: row.maxUse ?? undefined,
    expireTime: row.expireTime ?? null,
    enabled: row.enabled,
  };
  dialogVisible.value = true;
};

const handleSave = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (limitMode.value === 'maxUse') payload.expireTime = null;
    if (limitMode.value === 'expireTime') payload.maxUse = undefined;
    if (limitMode.value === '') { payload.maxUse = undefined; payload.expireTime = null; }
    if (editing.value) {
      await appKeysApi.update(editingId.value, payload as Partial<AppKey>);
      ElMessage.success('更新成功');
    } else {
      await appKeysApi.create(payload as any);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    await refresh();
  } catch (e: any) {
    ElMessage.error('操作失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
};

const removeKey = async (row: AppKey) => {
  try {
    await ElMessageBox.confirm(`确定删除 AppKey「${row.name}」？`, '确认删除', { type: 'warning' });
    await appKeysApi.delete(row.id);
    ElMessage.success('删除成功');
    await refresh();
  } catch { /* 取消 */ }
};

const toggleEnabled = async (row: AppKey, enabled: boolean) => {
  try {
    await appKeysApi.update(row.id, { ...row, enabled });
    ElMessage.success(enabled ? '已启用' : '已停用');
    await refresh();
  } catch (e: any) {
    ElMessage.error('操作失败: ' + (e.message || ''));
  }
};

onMounted(() => {
  refresh();
  loadOptions();
});
</script>

<style scoped>
.key-name { font-size: 13px; font-weight: 500; color: var(--ai-text-primary); }
.mono-text { font-family: monospace; font-size: 12px; color: var(--ai-text-muted); }
.muted-text { color: var(--ai-text-muted); font-size: 12px; }
.limit-mode { width: 100%; }
.hint { font-size: 12px; color: var(--ai-text-muted); margin-top: 4px; line-height: 1.4; }
:deep(.el-table .el-table__body-cell:last-child .cell) { display: flex; justify-content: center; gap: 10px; align-items: center; }
:deep(.el-table .el-table__header-cell:last-child .cell) { justify-content: center; }
</style>