<template>
  <PanelPage title="厂商管理" subtitle="管理 AI 厂商、厂商 API Key 与模型同步" :loading="loading">
    <template #actions>
      <el-button type="primary" size="small" plain @click="loadData">
        <el-icon><Refresh /></el-icon>
        <span class="btn-label">刷新</span>
      </el-button>
      <el-button v-role="'admin'" type="primary" size="small" :icon="Plus" @click="openCreateManufacturer">
        新增厂商
      </el-button>
    </template>

    <el-empty v-if="!loading && manufacturers.length === 0" description="暂无厂商数据" />

    <el-collapse v-else v-model="expandedManufacturers" class="manufacturer-collapse">
      <el-collapse-item
        v-for="item in manufacturers"
        :key="item.sysAiManufacturerId"
        :name="item.sysAiManufacturerId"
        class="manufacturer-collapse-item"
      >
        <template #title>
          <div class="manufacturer-head">
            <div class="manufacturer-logo">
              <img v-if="item.sysAiManufacturerLogoUrl" :src="item.sysAiManufacturerLogoUrl" :alt="item.sysAiManufacturerName" />
              <span v-else>{{ item.sysAiManufacturerName?.charAt(0) }}</span>
            </div>
            <div class="manufacturer-info">
              <div class="manufacturer-name">
                {{ item.sysAiManufacturerName }}
                <el-tag size="small" effect="plain" class="manufacturer-code-tag">{{ item.sysAiManufacturerCode }}</el-tag>
                <el-tag v-if="item.sysAiManufacturerFactory" size="small" effect="plain" class="manufacturer-factory-tag">
                  {{ item.sysAiManufacturerFactory }}
                </el-tag>
                <el-tag :type="isEnabled(item) ? 'success' : 'info'" size="small" effect="plain">
                  {{ isEnabled(item) ? '已启用' : '已停用' }}
                </el-tag>
              </div>
              <div class="manufacturer-meta">
                {{ relatedKeys(item).length }} API Key · {{ item.sysAiManufacturerBaseUrl || '-' }}
              </div>
            </div>
            <div class="manufacturer-actions" @click.stop>
              <el-button v-role="'admin'" type="primary" size="small" text @click="editManufacturer(item)">编辑</el-button>
              <el-button v-role="'admin'" type="danger" size="small" text @click="deleteManufacturer(item)">删除</el-button>
              <el-switch
                v-role="'admin'"
                :model-value="isEnabled(item)"
                size="small"
                @change="(val: string | number | boolean) => toggleManufacturer(item, Boolean(val))"
              />
            </div>
          </div>
        </template>

        <!-- 厂商连接配置 -->
        <div class="manufacturer-detail">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Base URL</span>
              <span class="detail-value detail-value--mono">{{ item.sysAiManufacturerBaseUrl || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">App Key</span>
              <span class="detail-value detail-value--mono">{{ maskKey(item.sysAiManufacturerAppKey) || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">API Secret</span>
              <span class="detail-value detail-value--mono">{{ maskKey(item.sysAiManufacturerApiSecret) || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">OpenAI 兼容</span>
              <el-tag size="small" effect="plain" :type="item.sysAiManufacturerOpenaiCompatible === 1 ? 'success' : 'info'">
                {{ item.sysAiManufacturerOpenaiCompatible === 1 ? '是' : '否' }}
              </el-tag>
            </div>
            <div v-if="item.sysAiManufacturerDescription" class="detail-item detail-item--full">
              <span class="detail-label">备注</span>
              <span class="detail-value">{{ item.sysAiManufacturerDescription }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <el-button v-role="'admin'" type="primary" size="small" :loading="syncingCode === item.sysAiManufacturerCode" @click="syncModels(item)">
              <el-icon class="mr-4"><Refresh /></el-icon>
              同步模型
            </el-button>
          </div>
        </div>

        <!-- 厂商 API Key 列表 -->
        <div class="sub-section">
          <div class="sub-section__head">
            <span class="sub-section__title">API Key 列表</span>
            <el-button v-role="'admin'" type="primary" size="small" text :icon="Plus" @click="openCreateKey(item)">
              新增 API Key
            </el-button>
          </div>
          <el-table :data="relatedKeys(item)" size="small" :empty-text="'暂无 API Key'">
            <el-table-column label="API Key" min-width="180">
              <template #default="{ row }">
                <span class="mono-text">{{ maskKey(row.sysAiManufacturerKeyValue) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="sysAiManufacturerKeyWeight" label="权重" min-width="80" align="center" />
            <el-table-column label="状态" min-width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="isKeyEnabled(row) ? 'success' : 'info'" size="small" effect="plain">
                  {{ isKeyEnabled(row) ? '已启用' : '已停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="180" align="center">
              <template #default="{ row }">
                <el-button v-role="'admin'" type="primary" size="small" text @click="editKey(row)">编辑</el-button>
                <el-button v-role="'admin'" type="danger" size="small" text @click="deleteKey(row)">删除</el-button>
                <el-switch
                  v-role="'admin'"
                  :model-value="isKeyEnabled(row)"
                  size="small"
                  @change="(val: string | number | boolean) => toggleKey(row, Boolean(val))"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 厂商编辑弹窗 -->
    <el-dialog v-model="manufacturerDialogVisible" :title="editingManufacturer ? '编辑厂商' : '新增厂商'" width="560px" :close-on-click-modal="false">
      <el-form :model="manufacturerForm" label-width="100px">
        <el-form-item label="厂商名称" required>
          <el-input v-model="manufacturerForm.sysAiManufacturerName" placeholder="如 智谱 / OpenAI" />
        </el-form-item>
        <el-form-item label="厂商编码" required>
          <el-input v-model="manufacturerForm.sysAiManufacturerCode" placeholder="如 zhipu / openai" :disabled="editingManufacturer" />
        </el-form-item>
        <el-form-item label="工厂类型">
          <el-select v-model="manufacturerForm.sysAiManufacturerFactory" filterable allow-create clearable style="width: 100%">
            <el-option v-for="f in factories" :key="f" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="Base URL">
          <el-input v-model="manufacturerForm.sysAiManufacturerBaseUrl" placeholder="如 https://open.bigmodel.cn/api/paas/v4" />
        </el-form-item>
        <el-form-item label="App Key">
          <el-input v-model="manufacturerForm.sysAiManufacturerAppKey" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="API Secret">
          <el-input v-model="manufacturerForm.sysAiManufacturerApiSecret" type="password" show-password placeholder="可留空" />
        </el-form-item>
        <el-form-item label="OpenAI 兼容">
          <el-switch v-model="manufacturerForm.sysAiManufacturerOpenaiCompatible" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="Logo 地址">
          <div class="logo-upload-row">
            <el-input v-model="manufacturerForm.sysAiManufacturerLogoUrl" placeholder="https://... 或本地上传" />
            <el-upload
              :show-file-list="false"
              :http-request="handleLogoUpload"
              accept=".jpg,.jpeg,.png,.gif,.webp"
            >
              <el-button size="small">上传</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="manufacturerForm.sysAiManufacturerDescription" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="manufacturerForm.sysAiManufacturerSort" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="manufacturerForm.sysAiManufacturerStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manufacturerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingManufacturer" @click="submitManufacturer">确认</el-button>
      </template>
    </el-dialog>

    <!-- 厂商 API Key 编辑弹窗 -->
    <el-dialog v-model="keyDialogVisible" :title="editingKey ? '编辑 API Key' : '新增 API Key'" width="500px" :close-on-click-modal="false">
      <el-form :model="keyForm" label-width="100px">
        <el-form-item label="厂商名称">
          <el-input :model-value="keyManufacturer?.sysAiManufacturerName || keyForm.sysAiManufacturerName" disabled />
        </el-form-item>
        <el-form-item label="厂商编码">
          <el-input :model-value="keyForm.sysAiManufacturerCode" disabled />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="keyForm.sysAiManufacturerKeyValue" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="API Secret">
          <el-input v-model="keyForm.sysAiManufacturerKeySecret" type="password" show-password placeholder="可留空" />
        </el-form-item>
        <el-form-item label="权重">
          <el-input-number v-model="keyForm.sysAiManufacturerKeyWeight" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="keyForm.sysAiManufacturerKeyRemark" placeholder="可选" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="keyForm.sysAiManufacturerKeyStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="keyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingKey" @click="submitKey">确认</el-button>
      </template>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 厂商管理面板
 * 调用 /v2/ai/manufacturer 与 /v2/ai/manufacturer-key 接口。
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { manufacturersApi, manufacturerKeysApi, type Manufacturer, type ManufacturerKey } from '../../api';
import { maskKey } from '../../utils/mask';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

const loading = ref(false);
const expandedManufacturers = ref<number[]>([]);
const manufacturers = ref<Manufacturer[]>([]);
const keys = ref<ManufacturerKey[]>([]);
const factories = ref<string[]>([]);
const syncingCode = ref('');
const savingManufacturer = ref(false);
const savingKey = ref(false);

/** 厂商是否启用（status 为 1） */
const isEnabled = (item: Manufacturer) => item.sysAiManufacturerStatus === 1;

/** API Key 是否启用（status 为 1） */
const isKeyEnabled = (row: ManufacturerKey) => row.sysAiManufacturerKeyStatus === 1;

/** 按厂商编码过滤关联 Key */
const relatedKeys = (item: Manufacturer) =>
  keys.value.filter((k) => k.sysAiManufacturerCode === item.sysAiManufacturerCode);

const loadData = async () => {
  loading.value = true;
  try {
    const [m, k] = await Promise.all([manufacturersApi.list(), manufacturerKeysApi.list()]);
    manufacturers.value = m;
    keys.value = k;
  } catch (e: any) {
    ElMessage.error('加载厂商失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

const loadFactories = async () => {
  try {
    factories.value = await manufacturersApi.factories();
  } catch {
    factories.value = [];
  }
};

const toggleManufacturer = async (item: Manufacturer, enabled: boolean) => {
  item.sysAiManufacturerStatus = enabled ? 1 : 0;
  try {
    await manufacturersApi.update({ ...item });
    ElMessage.success(`${item.sysAiManufacturerName} 已${enabled ? '启用' : '停用'}`);
  } catch {
    item.sysAiManufacturerStatus = enabled ? 0 : 1;
    ElMessage.error('操作失败');
  }
};

const syncModels = async (item: Manufacturer) => {
  if (!item.sysAiManufacturerCode) {
    ElMessage.warning('厂商编码为空，无法同步');
    return;
  }
  syncingCode.value = item.sysAiManufacturerCode!;
  try {
    const count = await manufacturersApi.syncModels(item.sysAiManufacturerCode!);
    ElMessage.success(`模型同步完成，共 ${count} 个`);
  } catch (e: any) {
    ElMessage.error('模型同步失败: ' + (e.message || ''));
  } finally {
    syncingCode.value = '';
  }
};

const manufacturerDialogVisible = ref(false);
const editingManufacturer = ref(false);
const manufacturerForm = reactive({
  sysAiManufacturerId: undefined as number | undefined,
  sysAiManufacturerCode: '',
  sysAiManufacturerName: '',
  sysAiManufacturerFactory: '',
  sysAiManufacturerBaseUrl: '',
  sysAiManufacturerAppKey: '',
  sysAiManufacturerApiSecret: '',
  sysAiManufacturerOpenaiCompatible: 0 as number,
  sysAiManufacturerLogoUrl: '',
  sysAiManufacturerDescription: '',
  sysAiManufacturerSort: 0,
  sysAiManufacturerStatus: 1,
});

const resetManufacturerForm = () => {
  Object.assign(manufacturerForm, {
    sysAiManufacturerId: undefined,
    sysAiManufacturerCode: '',
    sysAiManufacturerName: '',
    sysAiManufacturerFactory: '',
    sysAiManufacturerBaseUrl: '',
    sysAiManufacturerAppKey: '',
    sysAiManufacturerApiSecret: '',
    sysAiManufacturerOpenaiCompatible: 0,
    sysAiManufacturerLogoUrl: '',
    sysAiManufacturerDescription: '',
    sysAiManufacturerSort: 0,
    sysAiManufacturerStatus: 1,
  });
};

const openCreateManufacturer = () => {
  editingManufacturer.value = false;
  resetManufacturerForm();
  manufacturerDialogVisible.value = true;
};

const editManufacturer = (item: Manufacturer) => {
  editingManufacturer.value = true;
  Object.assign(manufacturerForm, {
    sysAiManufacturerId: item.sysAiManufacturerId,
    sysAiManufacturerCode: item.sysAiManufacturerCode,
    sysAiManufacturerName: item.sysAiManufacturerName,
    sysAiManufacturerFactory: item.sysAiManufacturerFactory || '',
    sysAiManufacturerBaseUrl: item.sysAiManufacturerBaseUrl || '',
    sysAiManufacturerAppKey: item.sysAiManufacturerAppKey || '',
    sysAiManufacturerApiSecret: item.sysAiManufacturerApiSecret || '',
    sysAiManufacturerOpenaiCompatible: item.sysAiManufacturerOpenaiCompatible ?? 0,
    sysAiManufacturerLogoUrl: item.sysAiManufacturerLogoUrl || '',
    sysAiManufacturerDescription: item.sysAiManufacturerDescription || '',
    sysAiManufacturerSort: item.sysAiManufacturerSort ?? 0,
    sysAiManufacturerStatus: item.sysAiManufacturerStatus ?? 1,
  });
  manufacturerDialogVisible.value = true;
};

const submitManufacturer = async () => {
  if (!manufacturerForm.sysAiManufacturerName.trim() || !manufacturerForm.sysAiManufacturerCode.trim()) {
    ElMessage.warning('请填写厂商名称与编码');
    return;
  }
  savingManufacturer.value = true;
  try {
    if (editingManufacturer.value) {
      await manufacturersApi.update({ ...manufacturerForm });
    } else {
      await manufacturersApi.save({ ...manufacturerForm });
    }
    ElMessage.success(editingManufacturer.value ? '厂商已更新' : '厂商已创建');
    manufacturerDialogVisible.value = false;
    await loadData();
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingManufacturer.value = false;
  }
};

const deleteManufacturer = async (item: Manufacturer) => {
  try {
    await ElMessageBox.confirm(`确定删除厂商 "${item.sysAiManufacturerName}" 吗？相关 API Key 将一并清理。`, '提示', { type: 'warning' });
    if (item.sysAiManufacturerId == null) {
      return;
    }
    await manufacturersApi.delete(item.sysAiManufacturerId);
    ElMessage.success('已删除');
    await loadData();
  } catch {
    // cancelled
  }
};

const handleLogoUpload = async (options: any) => {
  try {
    const url = await manufacturersApi.uploadLogo(options.file);
    manufacturerForm.sysAiManufacturerLogoUrl = url;
    ElMessage.success('Logo 上传成功');
  } catch (e: any) {
    ElMessage.error('上传失败: ' + (e.message || ''));
  }
};

const keyDialogVisible = ref(false);
const editingKey = ref(false);
const keyManufacturer = ref<Manufacturer | null>(null);
const keyForm = reactive({
  sysAiManufacturerKeyId: undefined as number | undefined,
  sysAiManufacturerCode: '',
  sysAiManufacturerName: '',
  sysAiManufacturerKeyValue: '',
  sysAiManufacturerKeySecret: '',
  sysAiManufacturerKeyWeight: 1,
  sysAiManufacturerKeyRemark: '',
  sysAiManufacturerKeyStatus: 1,
});

const resetKeyForm = () => {
  Object.assign(keyForm, {
    sysAiManufacturerKeyId: undefined,
    sysAiManufacturerCode: '',
    sysAiManufacturerName: '',
    sysAiManufacturerKeyValue: '',
    sysAiManufacturerKeySecret: '',
    sysAiManufacturerKeyWeight: 1,
    sysAiManufacturerKeyRemark: '',
    sysAiManufacturerKeyStatus: 1,
  });
};

const openCreateKey = (item: Manufacturer) => {
  editingKey.value = false;
  resetKeyForm();
  keyManufacturer.value = item;
  keyForm.sysAiManufacturerCode = item.sysAiManufacturerCode;
  keyForm.sysAiManufacturerName = item.sysAiManufacturerName;
  keyDialogVisible.value = true;
};

const editKey = (row: ManufacturerKey) => {
  editingKey.value = true;
  keyManufacturer.value =
    manufacturers.value.find((m) => m.sysAiManufacturerCode === row.sysAiManufacturerCode) || null;
  Object.assign(keyForm, {
    sysAiManufacturerKeyId: row.sysAiManufacturerKeyId,
    sysAiManufacturerCode: row.sysAiManufacturerCode,
    sysAiManufacturerName: row.sysAiManufacturerName || '',
    sysAiManufacturerKeyValue: row.sysAiManufacturerKeyValue || '',
    sysAiManufacturerKeySecret: row.sysAiManufacturerKeySecret || '',
    sysAiManufacturerKeyWeight: row.sysAiManufacturerKeyWeight ?? 1,
    sysAiManufacturerKeyRemark: row.sysAiManufacturerKeyRemark || '',
    sysAiManufacturerKeyStatus: row.sysAiManufacturerKeyStatus ?? 1,
  });
  keyDialogVisible.value = true;
};

const submitKey = async () => {
  if (!keyForm.sysAiManufacturerKeyValue.trim()) {
    ElMessage.warning('请填写 API Key');
    return;
  }
  savingKey.value = true;
  try {
    if (editingKey.value) {
      await manufacturerKeysApi.update({ ...keyForm });
    } else {
      await manufacturerKeysApi.save({ ...keyForm });
    }
    ElMessage.success(editingKey.value ? '已更新' : '已创建');
    keyDialogVisible.value = false;
    await loadData();
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingKey.value = false;
  }
};

const toggleKey = async (row: ManufacturerKey, enabled: boolean) => {
  row.sysAiManufacturerKeyStatus = enabled ? 1 : 0;
  try {
    if (row.sysAiManufacturerKeyId == null) {
      return;
    }
    await manufacturerKeysApi.toggle(row.sysAiManufacturerKeyId, enabled);
    ElMessage.success(enabled ? '已启用' : '已停用');
  } catch {
    row.sysAiManufacturerKeyStatus = enabled ? 0 : 1;
    ElMessage.error('操作失败');
  }
};

const deleteKey = async (row: ManufacturerKey) => {
  try {
    await ElMessageBox.confirm('确定删除该 API Key 吗？', '提示', { type: 'warning' });
    if (row.sysAiManufacturerKeyId == null) {
      return;
    }
    await manufacturerKeysApi.delete(row.sysAiManufacturerKeyId);
    ElMessage.success('已删除');
    await loadData();
  } catch {
    // cancelled
  }
};

onMounted(() => {
  loadData();
  loadFactories();
});
</script>

<style scoped>
.btn-label { margin-left: 4px; }
.mr-4 { margin-right: 4px; }

.manufacturer-collapse :deep(.el-collapse-item) {
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-radius-md);
  margin-bottom: 10px;
  overflow: hidden;
}
.manufacturer-collapse :deep(.el-collapse-item__header) {
  padding: 14px 16px;
  background: #fafafa;
}
.manufacturer-collapse :deep(.el-collapse-item__content) {
  padding: 0 16px 16px;
  background: #f7f8fa;
}

.manufacturer-head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding-right: 30px;
}
.manufacturer-logo {
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
.manufacturer-logo img { width: 100%; height: 100%; object-fit: contain; }
.manufacturer-info { flex: 1; min-width: 0; }
.manufacturer-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.manufacturer-code-tag,
.manufacturer-factory-tag { font-family: monospace; }
.manufacturer-meta { font-size: 12px; color: var(--ai-text-muted); margin-top: 4px; }
.manufacturer-actions { display: flex; align-items: center; gap: 8px; }

.manufacturer-detail {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--ai-card-bg);
  border-radius: var(--ai-radius-sm);
  border: 1px solid var(--ai-card-border);
}
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
.detail-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.detail-item--full { grid-column: 1 / -1; }
.detail-label { color: var(--ai-text-muted); min-width: 72px; flex-shrink: 0; }
.detail-value { color: var(--ai-text-primary); }
.detail-value--mono { font-family: monospace; }
.detail-actions { margin-top: 12px; display: flex; justify-content: flex-end; }

.sub-section { margin-top: 14px; }
.sub-section__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.sub-section__title { font-size: 13px; font-weight: 500; color: var(--ai-text-secondary); }
.mono-text { font-family: monospace; font-size: 12px; color: var(--ai-text-primary); }

.logo-upload-row { display: flex; gap: 8px; width: 100%; }
.logo-upload-row .el-input { flex: 1; }
</style>
