<template>
  <div class="snippet-manager fade-in sc-page">
    <div class="toolbar">
      <el-button type="primary" @click="dialogVisible = true">
        <i class="el-icon-plus"></i> 新增片段
      </el-button>
      <el-button @click="handleDelete" type="danger" :disabled="!selectedRow">
        <i class="el-icon-delete"></i> 删除
      </el-button>
      <el-select v-model="filterName" placeholder="搜索片段名" style="margin-left: 16px; width: 200px" />
    </div>

    <el-table :data="snippets" size="small" border style="margin-top: 16px">
      <el-table-column prop="id" label="编号" width="60" />
      <el-table-column prop="msTerminalSnippetName" label="片段名称" min-width="150" />
      <el-table-column prop="msTerminalSnippetRemark" label="备注" min-width="200" />
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button size="small" @click="editRow(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteRow(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="dialogVisible" :title="editing ? '编辑片段' : '新增片段'" width="520" :height="380" confirm-text="保存" cancel-text="取消" @confirm="save" @cancel="dialogVisible = false">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="片段名称" required>
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="片段内容">
          <el-input v-model="formData.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSnippets, saveSnippet as apiSaveSnippet, delSnippet as apiDelSnippet } from '../api'

const snippets = ref<any[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const formData = ref({
  name: '',
  content: '',
  remark: ''
})
const selectedRow = ref<any>(null)
const filterName = ref('')

// 加载片段列表
async function loadSnippets(): Promise<void> {
  try {
    const data = await apiGetSnippets()
    snippets.value = data ?? []
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// 从 API 导入的函数重命名
const apiGetSnippets = () => import('../api').then(m => m.getSnippets)

// 本地函数：打开弹窗
function editRow(row?: any): void {
  editing.value = !!row
  if (row) {
    formData.value = {
      name: row.msTerminalSnippetName ?? '',
      content: row.msTerminalSnippetContent ?? '',
      remark: row.msTerminalSnippetRemark ?? ''
    }
    selectedRow.value = row
  } else {
    formData.value = {
      name: '',
      content: '',
      remark: ''
    }
    selectedRow.value = null
  }
  dialogVisible.value = true
}

// 本地函数：保存片段
async function save(): Promise<void> {
  if (!formData.value.name.trim()) {
    ElMessage.warning('片段名称不能为空');
    return;
  }
  try {
    await apiSaveSnippet({ ...formData.value });
    ElMessage.success('已保存');
    dialogVisible.value = false;
    loadSnippets();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

// 本地函数：删除片段
async function deleteRow(row: any): Promise<void> {
  try {
    const result = await ElMessageBox.confirm(`确认删除片段 "${row.msTerminalSnippetName}"?`, '删除', { type: 'warning' });
    if (result) {
      await apiDelSnippet(row.id);
      ElMessage.success('已删除');
      loadSnippets();
    }
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

// 本地函数：批量删除
function handleDelete(): void {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一行');
    return;
  }
  deleteRow(selectedRow.value);
}

// 监听搜索变化
watch(filterName, (val) => {
  // 这里可以添加客户端过滤逻辑
})
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.el-select {
  margin-left: 0 !important;
  width: 200px !important;
}
</style>
