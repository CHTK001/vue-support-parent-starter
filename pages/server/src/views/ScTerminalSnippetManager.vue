<template>
  <div class="snippet-manager fade-in sc-page">
    <div class="toolbar">
      <ReButton layout="square" icon="Plus" type="primary" @click="editRow()">新增片段</ReButton>
      <ReButton layout="square" icon="Delete" type="danger" :disabled="!selectedRow" @click="handleDelete">删除</ReButton>
      <ReInput v-model="filterName" placeholder="搜索片段名" prefix-icon="Search" style="width: 200px" clearable />
    </div>

    <ReTable :data="snippets" size="small" border :pagination="false" :toolbar="false">
      <ReTableColumn prop="id" label="编号" width="60" />
      <ReTableColumn prop="msTerminalSnippetName" label="片段名称" min-width="150" />
      <ReTableColumn prop="msTerminalSnippetRemark" label="备注" min-width="200" />
      <ReTableColumn label="操作" width="140">
        <template #default="{ row }">
          <ReButton link size="small" @click="editRow(row)">编辑</ReButton>
          <ReButton link size="small" type="danger" @click="deleteRow(row)">删除</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="dialogVisible" :title="editing ? '编辑片段' : '新增片段'" width="520" :height="380" confirm-text="保存" cancel-text="取消" @confirm="save" @cancel="dialogVisible = false">
      <ReForm :model="formData" label-width="100px" label-position="right">
        <ReFormItem label="片段名称" required>
          <ReInput v-model="formData.name" />
        </ReFormItem>
        <ReFormItem label="片段内容">
          <ReInput v-model="formData.content" type="textarea" :rows="4" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="formData.remark" />
        </ReFormItem>
      </ReForm>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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
const allSnippets = ref<any[]>([])

// 搜索过滤（不丢失全量数据）
watch(filterName, () => {
  const kw = filterName.value.trim().toLowerCase()
  snippets.value = kw
    ? allSnippets.value.filter(s => (s.msTerminalSnippetName || '').toLowerCase().includes(kw))
    : allSnippets.value
})

// 加载片段列表
async function loadSnippets(): Promise<void> {
  try {
    const data = await getSnippets()
    allSnippets.value = data ?? []
    const kw = filterName.value.trim().toLowerCase()
    snippets.value = kw
      ? allSnippets.value.filter(s => (s.msTerminalSnippetName || '').toLowerCase().includes(kw))
      : allSnippets.value
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

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

onMounted(loadSnippets)
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
</style>