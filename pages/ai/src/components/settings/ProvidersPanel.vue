<template>
  <PanelPage title="提供商管理" subtitle="管理 AI 提供商、协议接入、模型与 AppKey" :loading="loading">
    <template #actions>
      <el-button type="primary" size="small" plain @click="loadProviders">
        <el-icon><Refresh /></el-icon>
        <span class="btn-label">刷新</span>
      </el-button>
    </template>

    <el-empty v-if="!loading && providers.length === 0" description="暂无提供商数据" />

    <el-collapse v-else v-model="expandedProviders" class="provider-collapse">
      <el-collapse-item
        v-for="item in providers"
        :key="item.id"
        :name="item.id"
        class="provider-collapse-item"
      >
        <template #title>
          <div class="provider-head">
            <div class="provider-logo">
              <img v-if="item.logo" :src="item.logo" :alt="item.name" />
              <span v-else>{{ item.name?.charAt(0) }}</span>
            </div>
            <div class="provider-info">
              <div class="provider-name">
                {{ item.name }}
                <el-tag size="small" effect="plain" class="provider-type-tag">{{ item.type }}</el-tag>
                <el-tag :type="item.enabled ? 'success' : 'info'" size="small" effect="plain">
                  {{ item.enabled ? '已启用' : '已停用' }}
                </el-tag>
              </div>
              <div class="provider-meta">
                {{ (item.models || []).length }} 模型 · {{ relatedKeys(item.id).length }} AppKey · {{ item.baseUrl || '-' }}
              </div>
            </div>
            <div class="provider-actions" @click.stop>
              <el-button v-role="'admin'" type="primary" size="small" text @click="editProvider(item)">编辑</el-button>
              <el-switch
                v-role="'admin'"
                v-model="item.enabled"
                size="small"
                @change="toggleProvider(item)"
              />
            </div>
          </div>
        </template>

        <!-- 提供商详细配置 -->
        <div class="provider-detail">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">API 地址</span>
              <span class="detail-value">{{ (item as any).apiUrl || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Base URL</span>
              <span class="detail-value detail-value--mono">{{ item.baseUrl }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">类型</span>
              <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
            </div>
          </div>
        </div>

        <!-- 模型列表 -->
        <div class="sub-section">
          <div class="sub-section__head">
            <span class="sub-section__title">模型列表</span>
            <el-button v-role="'admin'" type="primary" size="small" text @click="syncModels(item)">在线拉取</el-button>
          </div>
          <el-table :data="item.models || []" size="small" :empty-text="'暂无模型'">
            <el-table-column prop="name" label="模型名称" min-width="180">
              <template #default="{ row }">
                <span class="mono-text">{{ row }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="80" align="center">
              <template #default>
                <el-tag size="small" effect="plain" type="success">可用</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- AppKey 列表 -->
        <div class="sub-section">
          <div class="sub-section__head">
            <span class="sub-section__title">AppKey 列表</span>
            <el-button v-role="'admin'" type="primary" size="small" text :icon="Plus" @click="openCreateKey(item)">
              新增 AppKey
            </el-button>
          </div>
          <el-table :data="relatedKeys(item.id)" size="small" :empty-text="'暂无 AppKey'">
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column label="AppKey" min-width="180">
              <template #default="{ row }">
                <span class="mono-text">{{ maskKey(row.key) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small" effect="plain">
                  {{ row.enabled ? '已启用' : '已停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="120" align="center">
              <template #default="{ row }">
                <el-button v-role="'admin'" type="primary" size="small" text @click="editKey(row)">编辑</el-button>
                <el-button v-role="'admin'" type="danger" size="small" text @click="deleteKey(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 提供商编辑弹窗 -->
    <el-dialog v-model="providerDialogVisible" :title="editingProvider ? '编辑提供商' : '新增提供商'" width="540px">
      <el-form :model="providerForm" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="providerForm.name" placeholder="OpenAI / Claude ..." />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="providerForm.type" style="width: 100%">
            <el-option label="OpenAI 兼容" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="Google Gemini" value="gemini" />
            <el-option label="通义千问" value="qwen" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="Logo URL">
          <el-input v-model="providerForm.logo" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="Base URL">
          <el-input v-model="providerForm.baseUrl" placeholder="/v1" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="providerForm.apiKey" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="providerForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="providerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProvider">确认</el-button>
      </template>
    </el-dialog>

    <!-- AppKey 编辑弹窗 -->
    <el-dialog v-model="keyDialogVisible" :title="editingKey ? '编辑 AppKey' : '新增 AppKey'" width="500px">
      <el-form :model="keyForm" label-width="90px">
        <el-form-item label="归属提供商">
          <el-select v-model="keyForm.provider" style="width: 100%">
            <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="keyForm.name" placeholder="主账号 / 测试..." />
        </el-form-item>
        <el-form-item label="AppKey">
          <el-input v-model="keyForm.key" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="keyForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="keyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitKey">确认</el-button>
      </template>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 提供商管理面板
 * 调用 /v2/ai/providers 与 /v2/ai/app-keys 接口。
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { providersApi, appKeysApi, type Provider, type AppKey } from '../../api';
import PanelPage from '../PanelPage.vue';

type ProviderVariant = Provider & { __vModel?: string[] };

defineProps<{ id?: string }>();

const loading = ref(false);
const expandedProviders = ref<string[]>([]);
const providers = ref<Provider[]>([]);
const appKeys = ref<AppKey[]>([]);

const relatedKeys = (providerId: number) =>
  appKeys.value.filter((k) => k.provider === providerId);

const providerDialogVisible = ref(false);
const editingProvider = ref(false);
const editingProviderId = ref(0);
const providerForm = reactive({
  name: '',
  type: 'openai' as string,
  logo: '',
  baseUrl: '',
  apiKey: '',
  enabled: true,
});

const keyDialogVisible = ref(false);
const editingKey = ref(false);
const editingKeyId = ref(0);
const keyForm = reactive({
  provider: 0 as number,
  name: '',
  key: '',
  enabled: true,
});

const maskKey = (key: string) => {
  if (!key) return '';
  if (key.length <= 12) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
};

const loadProviders = async () => {
  loading.value = true;
  try {
    const [p, k] = await Promise.all([providersApi.list(), appKeysApi.list()]);
    providers.value = p;
    appKeys.value = k;
  } catch (e: any) {
    ElMessage.error('加载提供商失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

const toggleProvider = async (item: Provider) => {
  try {
    await providersApi.toggle(item.id, item.enabled);
    ElMessage.success(`${item.name} 已${item.enabled ? '启用' : '停用'}`);
  } catch {
    ElMessage.error('操作失败');
    item.enabled = !item.enabled;
  }
};

const syncModels = async (item: Provider) => {
  ElMessage.info(`已请求同步 ${item.name} 模型列表`);
};

const editProvider = (item: ProviderVariant) => {
  editingProvider.value = true;
  editingProviderId.value = item.id;
  Object.assign(providerForm, {
    name: item.name,
    type: item.type,
    logo: item.logo || '',
    baseUrl: item.baseUrl || '',
    apiKey: item.apiKey || '',
    enabled: item.enabled,
  });
  providerDialogVisible.value = true;
};

const submitProvider = async () => {
  try {
    if (editingProvider.value) {
      await providersApi.update(editingProviderId.value, { ...providerForm });
    } else {
      await providersApi.create({ ...providerForm });
    }
    ElMessage.success(editingProvider.value ? '提供商已更新' : '提供商已创建');
    providerDialogVisible.value = false;
    await loadProviders();
  } catch {
    ElMessage.error('保存失败');
  }
};

const openCreateKey = (item: ProviderVariant) => {
  editingKey.value = false;
  editingKeyId.value = 0;
  Object.assign(keyForm, { provider: item.id, name: '', key: '', enabled: true });
  keyDialogVisible.value = true;
};

const editKey = (row: AppKey) => {
  editingKey.value = true;
  editingKeyId.value = row.id;
  Object.assign(keyForm, { provider: row.provider, name: row.name, key: row.key, enabled: row.enabled });
  keyDialogVisible.value = true;
};

const submitKey = async () => {
  if (!keyForm.name.trim() || !keyForm.key.trim()) {
    ElMessage.warning('请填写名称与 AppKey');
    return;
  }
  try {
    if (editingKey.value) {
      await appKeysApi.update(editingKeyId.value, { ...keyForm });
    } else {
      await appKeysApi.create({ ...keyForm });
    }
    ElMessage.success(editingKey.value ? '已更新' : '已创建');
    keyDialogVisible.value = false;
    await loadProviders();
  } catch {
    ElMessage.error('保存失败');
  }
};

const deleteKey = async (row: AppKey) => {
  try {
    await ElMessageBox.confirm(`确定删除 AppKey "${row.name}" 吗？`, '提示', { type: 'warning' });
    await appKeysApi.delete(row.id);
    ElMessage.success('已删除');
    await loadProviders();
  } catch {
    // cancelled
  }
};

onMounted(loadProviders);
</script>

<style scoped>
.btn-label { margin-left: 4px; }

.provider-collapse :deep(.el-collapse-item) {
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-radius-md);
  margin-bottom: 10px;
  overflow: hidden;
}
.provider-collapse :deep(.el-collapse-item__header) {
  padding: 14px 16px;
  background: #fafafa;
}
.provider-collapse :deep(.el-collapse-item__content) {
  padding: 0 16px 16px;
  background: #f7f8fa;
}

.provider-head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-right: 30px;
}
.provider-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--el-color-primary);
  flex-shrink: 0;
  overflow: hidden;
}
.provider-logo img { width: 100%; height: 100%; object-fit: contain; }
.provider-info { flex: 1; min-width: 0; }
.provider-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.provider-type-tag { font-family: monospace; }
.provider-meta { font-size: 12px; color: var(--ai-text-muted); margin-top: 4px; }
.provider-actions { display: flex; align-items: center; gap: 8px; }

.provider-detail {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--ai-card-bg);
  border-radius: var(--ai-radius-sm);
  border: 1px solid var(--ai-card-border);
}
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
.detail-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.detail-label { color: var(--ai-text-muted); min-width: 60px; }
.detail-value { color: var(--ai-text-primary); }
.detail-value--mono { font-family: monospace; }

.sub-section { margin-top: 14px; }
.sub-section__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.sub-section__title { font-size: 13px; font-weight: 500; color: var(--ai-text-secondary); }
.mono-text { font-family: monospace; font-size: 12px; color: var(--ai-text-primary); }
</style>
