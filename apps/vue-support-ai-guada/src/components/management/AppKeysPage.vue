<template>
  <div class="app-keys-page">
    <div class="page-header">
      <h2>AppKey管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索AppKey名称"
          clearable
          style="width: 240px; margin-right: 12px"
          @keyup.enter="loadData"
          @clear="loadData"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新增AppKey
        </el-button>
        <el-button @click="loadData"><el-icon><Refresh /></el-icon> 刷新</el-button>
      </div>
    </div>

    <div class="panel-card">
    <el-table :data="filteredData" v-loading="loading" stripe class="flat-table" style="width: 100%">
      <el-table-column prop="appName" label="应用名称" min-width="150" />
      <el-table-column prop="appKey" label="AppKey" min-width="200">
        <template #default="{ row }">
          <span class="key-text">{{ row.appKey }}</span>
          <el-button size="small" link type="primary" @click="copyKey(row.appKey)">复制</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="provider" label="提供商" min-width="120" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="160" />
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="deleteItem(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="dataList.length"
        layout="total, sizes, prev, pager, next"
      />
    </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑AppKey' : '新增AppKey'" width="500px" append-to-body>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="AppKey" prop="appKey">
          <el-input v-model="form.appKey" placeholder="请输入AppKey" show-password />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-select v-model="form.provider" placeholder="请选择提供商" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="DeepSeek" value="deepseek" />
            <el-option label="Qwen" value="qwen" />
            <el-option label="Ollama" value="ollama" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh } from '@element-plus/icons-vue';
import { appKeyApi } from '@/services/javaApi';

const loading = ref(false);
const dataList = ref<any[]>([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();

const defaultForm = () => ({ id: '', appName: '', appKey: '', provider: '', status: 1, remark: '' });
const form = ref(defaultForm());
const rules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  appKey: [{ required: true, message: '请输入AppKey', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择提供商', trigger: 'change' }],
};

const filteredData = computed(() => {
  let result = dataList.value;
  if (searchKeyword.value) {
    result = result.filter((item) => item.appName?.includes(searchKeyword.value));
  }
  const start = (currentPage.value - 1) * pageSize.value;
  return result.slice(start, start + pageSize.value);
});

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await appKeyApi.list();
    dataList.value = res?.data || res?.records || res || [];
  } catch (e: any) {
    ElMessage.error('加载失败: ' + (e.message || ''));
    dataList.value = [];
  } finally {
    loading.value = false;
  }
};

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key);
  ElMessage.success('已复制到剪贴板');
};

const openCreateDialog = () => {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
};

const openEditDialog = (row: any) => {
  isEdit.value = true;
  form.value = { ...defaultForm(), ...row };
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (isEdit.value) {
        await appKeyApi.update(form.value.id, form.value);
        ElMessage.success('更新成功');
      } else {
        await appKeyApi.create(form.value);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      loadData();
    } catch (e: any) {
      ElMessage.error('保存失败: ' + (e.message || ''));
    } finally {
      submitting.value = false;
    }
  });
};

const deleteItem = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.appName}」吗？`, '删除确认', { type: 'warning' });
    await appKeyApi.delete(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

onMounted(() => loadData());
</script>

<style scoped>
.app-keys-page { padding: 22px 24px; height: 100%; overflow: auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
.page-header h2 {
  position: relative; margin: 0; font-size: 21px; font-weight: 700;
  color: var(--el-text-color-primary); padding-left: 12px;
}
.page-header h2::before {
  content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 4px; height: 19px; border-radius: 4px;
  background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
}
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.panel-card {
  background: var(--color-surface, var(--el-bg-color));
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
  border-radius: 18px;
  padding: 16px 18px 14px;
  box-shadow: 0 10px 30px -18px rgba(16, 24, 40, 0.22);
}
.flat-table { --el-table-border-color: var(--el-border-color-lighter); }
.flat-table :deep(th.el-table__cell) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-weight: 600;
}
.key-text { font-family: ui-monospace, monospace; font-size: 13px; color: var(--el-text-color-secondary); margin-right: 8px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
