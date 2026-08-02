<template>
  <div class="panel-container">
    <div class="panel-header">
      <div>
        <span class="panel-title">提供商管理</span>
        <span class="panel-subtitle">管理 AI 提供商、协议接入、模型与 AppKey</span>
      </div>
      <el-button type="primary" size="small" plain @click="loadProviders">
        <el-icon><Refresh /></el-icon>
        <span style="margin-left: 4px">刷新</span>
      </el-button>
    </div>
    <div v-loading="loading" class="panel-body">
      <el-empty v-if="!loading && providers.length === 0" description="暂无提供商数据" />
      <el-collapse v-else v-model="expandedProviders" class="provider-collapse">
        <el-collapse-item
          v-for="item in providers"
          :key="item.id"
          :name="item.id"
          class="provider-collapse-item"
        >
          <template #title>
            <div class="provider-card__head">
              <div class="provider-logo">
                <img v-if="item.logo" :src="item.logo" :alt="item.name" />
                <span v-else>{{ item.name?.charAt(0) }}</span>
              </div>
              <div class="provider-info">
                <div class="provider-name">
                  {{ item.name }}
                  <el-tag size="small" effect="plain" class="protocol-tag">{{ item.type }}</el-tag>
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
                <span class="detail-value mono">{{ item.baseUrl }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">类型</span>
                <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
              </div>
            </div>
          </div>

          <!-- 模型列表 -->
          <div class="model-list">
            <div class="model-list__head">
              <span class="model-list__title">模型列表</span>
              <div class="model-list__actions">
                <el-button v-role="'admin'" type="primary" size="small" text @click="syncModels(item)">在线拉取</el-button>
              </div>
            </div>
            <el-table :data="item.models || []" size="small" class="model-table" :empty-text="'暂无模型'">
              <el-table-column prop="name" label="模型名称" min-width="180">
                <template #default="{ row }">
                  <span class="model-name">{{ row }}</span>
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
          <div class="applist">
            <div class="applist__head">
              <span class="applist__title">AppKey 列表</span>
              <el-button
                v-role="'admin'"
                type="primary"
                size="small"
                text
                :icon="Plus"
                @click="openCreateKey(item)"
              >
                新增 AppKey
              </el-button>
            </div>
            <el-table :data="relatedKeys(item.id)" size="small" class="app-table" :empty-text="'暂无 AppKey'">
              <el-table-column prop="name" label="名称" min-width="120" />
              <el-table-column label="AppKey" min-width="180">
                <template #default="{ row }">
                  <span class="key-mask">{{ maskKey(row.key) }}</span>
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
    </div>

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
    <el-dialog
      v-model="keyDialogVisible"
      :title="editingKey ? '编辑 AppKey' : '新增 AppKey'"
      width="500px"
    >
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
  </div>
</template>

<script setup lang="ts">
/**
 * 提供商管理面板
 * 调用 /v2/ai/providers 与 /v2/ai/app-keys 接口。
 * 管理类操作（新增/编辑/删除/启停）需要 admin 角色。
 */
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { providersApi, appKeysApi, type Provider, type AppKey } from '../../api';

defineProps<{ id?: string }>();

const loading = ref(false);
const expandedProviders = ref<string[]>([]);
const providers = ref<Provider[]>([]);
const appKeys = ref<AppKey[]>([]);

/** 根据 providerId 过滤 AppKey */
const relatedKeys = (providerId: string) =>
  appKeys.value.filter(k => k.provider === providerId);

const providerDialogVisible = ref(false);
const editingProvider = ref(false);
const editingProviderId = ref('');
const providerForm = reactive({
  name: '',
  type: 'openai' as Provider['type'],
  logo: '',
  baseUrl: '',
  apiKey: '',
  enabled: true,
});

const keyDialogVisible = ref(false);
const editingKey = ref(false);
const editingKeyId = ref('');
const keyForm = reactive({
  provider: '' as string,
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
  } catch (e: any) {
    ElMessage.error('操作失败');
    item.enabled = !item.enabled;
  }
};

const syncModels = async (item: Provider) => {
  ElMessage.info(`已请求同步 ${item.name} 模型列表`);
  // 实际场景下可调用后端 /v2/ai/providers/{id}/sync-models
};

const editProvider = (item: Provider) => {
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
  } catch (e: any) {
    ElMessage.error('保存失败');
  }
};

const openCreateKey = (item: Provider) => {
  editingKey.value = false;
  editingKeyId.value = '';
  Object.assign(keyForm, {
    provider: item.id,
    name: '',
    key: '',
    enabled: true,
  });
  keyDialogVisible.value = true;
};

const editKey = (row: AppKey) => {
  editingKey.value = true;
  editingKeyId.value = row.id;
  Object.assign(keyForm, {
    provider: row.provider,
    name: row.name,
    key: row.key,
    enabled: row.enabled,
  });
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
  } catch (e: any) {
    ElMessage.error('保存失败');
  }
};

const deleteKey = async (row: AppKey) => {
  try {
    await ElMessageBox.confirm(`确定删除 AppKey “${row.name}” 吗？`, '提示', {
      type: 'warning',
    });
    await appKeysApi.delete(row.id);
    ElMessage.success('已删除');
    await loadProviders();
  } catch (e) {
    // 取消或失败
  }
};

onMounted(loadProviders);
</script>

<style scoped>
.panel-container { padding: 4px 0; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.panel-title { display: block; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: 0.2px; }
.panel-subtitle { display: block; font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.panel-body { min-height: 200px; }
.provider-collapse { border: none; }
.provider-collapse :deep(.el-collapse-item) {
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}
.provider-collapse :deep(.el-collapse-item__header) {
  border-bottom: none;
  padding: 14px 16px;
  background: var(--el-bg-color);
}
.provider-collapse :deep(.el-collapse-item__content) {
  padding: 0 16px 16px;
  background: var(--el-bg-color-page);
}
.provider-card__head { display: flex; align-items: center; gap: 12px; width: 100%; padding-right: 30px; }
.provider-logo {
  width: 36px; height: 36px; border-radius: 8px;
  background: var(--el-fill-color-light);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 14px; color: var(--el-text-color-primary);
  flex-shrink: 0; overflow: hidden;
}
.provider-logo img { width: 100%; height: 100%; object-fit: contain; }
.provider-info { flex: 1; min-width: 0; }
.provider-name {
  font-size: 14px; font-weight: 600; color: var(--el-text-color-primary);
  line-height: 1.3; display: flex; align-items: center; gap: 6px;
}
.protocol-tag { font-family: monospace; }
.provider-meta { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.provider-actions { display: flex; align-items: center; gap: 8px; }
.provider-detail {
  margin-top: 12px; padding: 12px 14px;
  background: var(--el-bg-color); border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
.detail-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.detail-label { color: var(--el-text-color-secondary); min-width: 60px; }
.detail-value { color: var(--el-text-color-primary); }
.detail-value.mono { font-family: monospace; }
.model-list, .applist { margin-top: 14px; }
.model-list__head, .applist__head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
.model-list__title, .applist__title {
  font-size: 13px; font-weight: 500; color: var(--el-text-color-regular);
}
.model-list__actions { display: flex; gap: 4px; }
.model-table, .app-table { width: 100%; border-radius: 6px; overflow: hidden; }
.model-name { font-size: 13px; font-family: monospace; color: var(--el-text-color-primary); }
.key-mask { font-family: monospace; font-size: 12px; color: var(--el-text-color-secondary); }
</style>