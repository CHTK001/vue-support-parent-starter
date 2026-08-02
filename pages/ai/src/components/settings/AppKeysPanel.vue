<template>
  <div class="panel-container">
    <div class="panel-header">
      <div>
        <span class="panel-title">AppKey 总览</span>
        <span class="panel-subtitle">所有 AppKey 汇总视图，状态一览</span>
      </div>
      <el-button type="primary" size="small" plain @click="refresh">刷新</el-button>
    </div>
    <div v-loading="loading" class="panel-body">
      <el-table :data="allKeys" stripe class="key-table">
        <el-table-column prop="provider" label="提供商" min-width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.provider }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="120">
          <template #default="{ row }">
            <span class="key-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="AppKey" min-width="160">
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
            <el-switch v-role="'admin'" v-model="row.enabled" size="small" @change="toggle(row)" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AppKey 总览面板
 * 调用 /v2/ai/app-keys 接口列出所有 AppKey。
 * 启用/停用操作需要 admin 角色。
 */
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { appKeysApi, type AppKey } from '../../api';

defineProps<{ id?: string }>();

const loading = ref(false);
const allKeys = ref<AppKey[]>([]);

const maskKey = (key: string) => {
  if (!key) return '';
  if (key.length <= 12) return '••••••••••••';
  return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
};

const refresh = async () => {
  loading.value = true;
  try {
    allKeys.value = await appKeysApi.list();
  } catch (e: any) {
    ElMessage.error('加载失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
};

const toggle = async (row: AppKey) => {
  try {
    await appKeysApi.toggle(row.id, row.enabled);
    ElMessage.success(`${row.name} 已${row.enabled ? '启用' : '停用'}`);
  } catch (e) {
    row.enabled = !row.enabled;
    ElMessage.error('操作失败');
  }
};

onMounted(refresh);
</script>

<style scoped>
.panel-container { padding: 4px 0; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.panel-title { display: block; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: 0.2px; }
.panel-subtitle { display: block; font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.panel-body { min-height: 200px; }
.key-table { width: 100%; border-radius: 8px; overflow: hidden; }
.key-name { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
.key-mask { font-family: monospace; font-size: 12px; color: var(--el-text-color-secondary); }
</style>