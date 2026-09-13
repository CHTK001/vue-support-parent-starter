<template>
  <div class="h-full overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a]">
    <!-- 页面头部 -->
    <div class="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#2f2f2f]">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">服务管理</h1>
          <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">管理聚合ChatClient服务，支持端口配置、启动停止、usage开关</p>
        </div>
        <div class="flex items-center gap-2">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增服务
          </el-button>
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 overflow-auto p-6">
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="服务名称" min-width="150" />
        <el-table-column prop="port" label="端口" width="100" />
        <el-table-column prop="protocol" label="协议" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.ccEnabled" type="success" size="small">CC</el-tag>
            <el-tag v-if="row.codexEnabled" type="warning" size="small" class="ml-1">Codex</el-tag>
            <el-tag v-if="row.geminiEnabled" type="info" size="small" class="ml-1">Gemini</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usageEnabled" label="Usage记录" width="120">
          <template #default="{ row }">
            <el-tag :type="row.usageEnabled ? 'success' : 'info'" size="small">
              {{ row.usageEnabled ? '开启' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="运行状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'running' ? 'success' : 'danger'" size="small">
              {{ row.status === 'running' ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'running'" type="success" link @click="handleStart(row)">启动</el-button>
            <el-button v-else type="warning" link @click="handleStop(row)">停止</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="服务名称">
          <el-input v-model="formData.name" placeholder="请输入服务名称" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="formData.port" :min="1024" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Usage记录">
          <el-switch v-model="formData.usageEnabled" />
        </el-form-item>
        <el-form-item label="CC协议">
          <el-switch v-model="formData.ccEnabled" />
        </el-form-item>
        <el-form-item label="Codex协议">
          <el-switch v-model="formData.codexEnabled" />
        </el-form-item>
        <el-form-item label="Gemini协议">
          <el-switch v-model="formData.geminiEnabled" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { serviceApi } from '@/services/javaApi';

const loading = ref(false);
const saving = ref(false);
const tableData = ref<any[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formData = reactive({
  id: '',
  name: '',
  port: 8080,
  usageEnabled: false,
  ccEnabled: false,
  codexEnabled: false,
  geminiEnabled: false,
  description: '',
  status: 'stopped',
});

const dialogTitle = computed(() => isEdit.value ? '编辑服务' : '新增服务');

async function loadData() {
  loading.value = true;
  try {
    const res: any = await serviceApi.list();
    tableData.value = res?.data || res?.records || res || [];
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

function handleCreate() {
  isEdit.value = false;
  Object.assign(formData, {
    id: '',
    name: '',
    port: 8080,
    usageEnabled: false,
    ccEnabled: false,
    codexEnabled: false,
    geminiEnabled: false,
    description: '',
    status: 'stopped',
  });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  isEdit.value = true;
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function handleStart(row: any) {
  try {
    await serviceApi.start(row.id);
    ElMessage.success('服务启动成功');
    loadData();
  } catch (e: any) {
    ElMessage.error(`启动失败: ${e.message}`);
  }
}

async function handleStop(row: any) {
  try {
    await serviceApi.stop(row.id);
    ElMessage.success('服务停止成功');
    loadData();
  } catch (e: any) {
    ElMessage.error(`停止失败: ${e.message}`);
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除服务「${row.name}」吗？`, '删除确认', { type: 'warning' });
    await serviceApi.delete(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(`删除失败: ${e.message}`);
  }
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await serviceApi.update(formData.id, formData);
      ElMessage.success('更新成功');
    } else {
      await serviceApi.create(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (e: any) {
    ElMessage.error(`保存失败: ${e.message}`);
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>
