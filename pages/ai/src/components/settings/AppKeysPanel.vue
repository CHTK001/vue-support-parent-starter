<template>
  <PanelPage title="AppKey 管理" subtitle="管理接入凭证：支持次数限制与过期时间两种形式，可绑定分组限定模型" :loading="loading">
    <template #actions>
      <el-button type="primary" size="small" @click="openCreate">
        <el-icon><Plus /></el-icon>
        <span class="btn-label">新增 AppKey</span>
      </el-button>
      <el-button size="small" plain @click="refresh">
        <el-icon><Refresh /></el-icon>
        <span class="btn-label">刷新</span>
      </el-button>
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
      <el-table-column label="操作" min-width="140" align="center">
        <template #default="{ row }">
          <el-button v-role="'admin'" type="primary" size="small" text @click="editKey(row)">编辑</el-button>
          <el-button v-role="'admin'" type="danger" size="small" text @click="removeKey(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑 AppKey' : '新增 AppKey'" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如 生产环境 OpenAI Key" />
        </el-form-item>
        <el-form-item label="密钥值" prop="key">
          <el-input v-model="form.key" :type="showKey ? 'text' : 'password'" placeholder="输入 API Key 值">
            <template #suffix>
              <el-icon style="cursor: pointer" @click="showKey = !showKey">
                <View v-if="showKey" /><Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="提供商">
          <el-select v-model="form.provider" placeholder="选择提供商" clearable filterable style="width: 100%">
            <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定分组">
          <el-select v-model="form.groupId" placeholder="不选则不限分组" clearable filterable style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
          <div class="hint">绑定分组后，该 Key 只能使用分组下的模型</div>
        </el-form-item>
        <el-form-item label="次数限制">
          <el-input-number v-model="form.maxUse" :min="1" :step="100" placeholder="不填表示不限次数" style="width: 200px" />
          <div class="hint">设置后该 Key 最多使用此次数，留空不限</div>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="form.expireTime"
            type="datetime"
            placeholder="不选表示永不过期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 220px"
          />
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
/**
 * AppKey 管理面板
 * 调用 /v2/ai/app-keys 接口，支持新增/编辑/删除，次数限制与过期时间两种形式，绑定分组。
 */
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { appKeysApi, providersApi, groupsApi, type AppKey, type Provider, type Group } from '../../api';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

const loading = ref(false);
const saving = ref(false);
const keys = ref<AppKey[]>([]);
const providers = ref<Provider[]>([]);
const groups = ref<Group[]>([]);
const dialogVisible = ref(false);
const editing = ref(false);
const editingId = ref(0);
const showKey = ref(false);

const form = ref<{
  name: string;
  key: string;
  provider: number | null;
  groupId: number | null;
  maxUse: number | null;
  expireTime: string | null;
  enabled: boolean;
}>({
  name: '',
  key: '',
  provider: null,
  groupId: null,
  maxUse: null,
  expireTime: null,
  enabled: true,
});

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  key: [{ required: true, message: '请输入密钥值', trigger: 'blur' }],
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
    providers.value = await providersApi.list();
  } catch { /* 忽略 */ }
  try {
    groups.value = await groupsApi.list();
  } catch { /* 忽略 */ }
};

const openCreate = () => {
  editing.value = false;
  editingId.value = 0;
  form.value = { name: '', key: '', provider: null, groupId: null, maxUse: null, expireTime: null, enabled: true };
  showKey.value = false;
  dialogVisible.value = true;
};

const editKey = (row: AppKey) => {
  editing.value = true;
  editingId.value = row.id;
  form.value = {
    name: row.name,
    key: row.key,
    provider: row.provider,
    groupId: row.groupId ?? null,
    maxUse: row.maxUse ?? null,
    expireTime: row.expireTime ?? null,
    enabled: row.enabled,
  };
  showKey.value = true;
  dialogVisible.value = true;
};

const handleSave = async () => {
  saving.value = true;
  try {
    if (editing.value) {
      await appKeysApi.update(editingId.value, form.value);
      ElMessage.success('更新成功');
    } else {
      await appKeysApi.create(form.value as any);
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
  } catch (e) { /* 取消 */ }
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
.hint { font-size: 12px; color: var(--ai-text-muted); margin-top: 4px; line-height: 1.4; }
.btn-label { margin-left: 4px; }
</style>