<template>
  <div class="manufacturer-keys-page">
    <div class="page-header">
      <h2>厂商Key管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索厂商名称"
          clearable
          style="width: 240px; margin-right: 12px"
          @keyup.enter="loadData"
          @clear="loadData"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新增厂商Key
        </el-button>
        <el-button @click="loadData"><el-icon><Refresh /></el-icon> 刷新</el-button>
      </div>
    </div>

    <el-table :data="filteredData" v-loading="loading" border stripe style="width: 100%">
      <el-table-column prop="manufacturerName" label="厂商名称" min-width="150" />
      <el-table-column prop="apiKey" label="API Key" min-width="200">
        <template #default="{ row }">
          <span class="key-text">{{ row.apiKey }}</span>
          <el-button size="small" link type="primary" @click="copyKey(row.apiKey)">复制</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="baseUrl" label="Base URL" min-width="200" show-overflow-tooltip />
      <el-table-column prop="enabled" label="启用" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="160" />
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑厂商Key' : '新增厂商Key'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="厂商名称" prop="manufacturerName">
          <el-input v-model="form.manufacturerName" placeholder="请输入厂商名称" />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="form.apiKey" placeholder="请输入API Key" show-password />
        </el-form-item>
        <el-form-item label="Base URL" prop="baseUrl">
          <el-input v-model="form.baseUrl" placeholder="请输入Base URL，如 https://api.openai.com/v1" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
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
import { manufacturerKeyApi } from '@/services/javaApi';

const loading = ref(false);
const dataList = ref<any[]>([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref();

const defaultForm = () => ({ providerId: '', manufacturerName: '', apiKey: '', baseUrl: '', enabled: true, description: '' });
const form = ref(defaultForm());
const rules = {
  manufacturerName: [{ required: true, message: '请输入厂商名称', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }],
};

const filteredData = computed(() => {
  let result = dataList.value;
  if (searchKeyword.value) {
    result = result.filter((item) => item.manufacturerName?.includes(searchKeyword.value));
  }
  const start = (currentPage.value - 1) * pageSize.value;
  return result.slice(start, start + pageSize.value);
});

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await manufacturerKeyApi.list();
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
        await manufacturerKeyApi.update(form.value.providerId, form.value);
        ElMessage.success('更新成功');
      } else {
        await manufacturerKeyApi.create(form.value);
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
    await ElMessageBox.confirm(`确定删除「${row.manufacturerName}」吗？`, '删除确认', { type: 'warning' });
    await manufacturerKeyApi.delete(row.providerId);
    ElMessage.success('删除成功');
    loadData();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

onMounted(() => loadData());
</script>

<style scoped>
.manufacturer-keys-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
.header-actions { display: flex; align-items: center; }
.key-text { font-family: monospace; font-size: 13px; color: #606266; margin-right: 8px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
