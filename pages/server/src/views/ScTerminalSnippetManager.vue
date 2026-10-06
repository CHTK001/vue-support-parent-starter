<template>
  <div class="snippet-manager fade-in sc-page">
    <ReSectionHead class="page-head" title="片段管理" description="常用终端命令片段，可在批量作业中快捷填充">
      <template #actions>
        <ReInput v-model="filterName" placeholder="搜索片段名" prefix-icon="Search" style="width: 200px" clearable />
        <ReButton show-text icon="Delete" type="danger" :disabled="!selectedRow" @click="handleDelete">删除</ReButton>
        <ReButton show-text icon="Plus" type="primary" @click="editRow()">新增片段</ReButton>
      </template>
    </ReSectionHead>

    <ReTable :data="snippets" border :pagination="false" :toolbar="false" highlight-current-row empty-text="暂无命令片段，点击右上角「新增片段」创建" @row-click="selectRow">
      <ReTableColumn prop="id" label="编号" width="60" />
      <ReTableColumn prop="msTerminalSnippetName" label="片段名称" min-width="150" />
      <ReTableColumn prop="msTerminalSnippetRemark" label="备注" min-width="200" />
      <ReTableColumn label="操作" width="140" align="right" fixed="right">
        <template #default="{ row }">
          <ReButton link @click="editRow(row)">编辑</ReButton>
          <ReButton link type="danger" @click="deleteRow(row)">删除</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="dialogVisible" :title="editing ? '编辑片段' : '新增片段'" width="520" :height="380" confirm-text="保存" cancel-text="取消" :footer-hidden="false" @confirm="save" @cancel="dialogVisible = false">
      <ReForm :model="formData" label-width="100px" label-position="right">
        <ReFormItem label="片段名称" required>
          <ReInput v-model="formData.msTerminalSnippetName" />
        </ReFormItem>
        <ReFormItem label="片段内容">
          <ReInput v-model="formData.msTerminalSnippetContent" type="textarea" :rows="4" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="formData.msTerminalSnippetRemark" />
        </ReFormItem>
      </ReForm>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { message } from '@repo/core'
import { getSnippets, saveSnippet as apiSaveSnippet, updateSnippet as apiUpdateSnippet, delSnippet as apiDelSnippet, type TerminalSnippetPayload } from '../api'
const snippets = ref<any[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)
const formData = ref<TerminalSnippetPayload>({
  msTerminalSnippetName: '',
  msTerminalSnippetContent: '',
  msTerminalSnippetRemark: ''
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
    message.error((e as Error).message)
  }
}

// 本地函数：打开弹窗
function editRow(row?: any): void {
  editing.value = !!row
  editingId.value = row?.id ?? null
  if (row) {
    formData.value = {
      msTerminalSnippetName: row.msTerminalSnippetName ?? '',
      msTerminalSnippetContent: row.msTerminalSnippetContent ?? '',
      msTerminalSnippetRemark: row.msTerminalSnippetRemark ?? ''
    }
    selectedRow.value = row
  } else {
    formData.value = {
      msTerminalSnippetName: '',
      msTerminalSnippetContent: '',
      msTerminalSnippetRemark: ''
    }
    selectedRow.value = null
  }
  dialogVisible.value = true
}

// 本地函数：保存片段
async function save(): Promise<void> {
  if (!formData.value.msTerminalSnippetName.trim()) {
    message.warning('片段名称不能为空');
    return;
  }
  try {
    const payload = {
      msTerminalSnippetName: formData.value.msTerminalSnippetName.trim(),
      msTerminalSnippetContent: formData.value.msTerminalSnippetContent ?? '',
      msTerminalSnippetRemark: formData.value.msTerminalSnippetRemark ?? ''
    };
    if (editingId.value) {
      await apiUpdateSnippet(editingId.value, payload);
    } else {
      await apiSaveSnippet(payload);
    }
    message.success('已保存');
    dialogVisible.value = false;
    loadSnippets();
  } catch (e) {
    message.error((e as Error).message);
  }
}

// 本地函数：点行选中（顶栏「删除」的目标行）
function selectRow(row: any): void {
  selectedRow.value = row;
}

// 本地函数：删除片段
async function deleteRow(row: any): Promise<void> {
  try {
    const result = await message.confirm(`确认删除片段 "${row.msTerminalSnippetName}"?`, '删除');
    if (result) {
      await apiDelSnippet(row.id);
      message.success('已删除');
      loadSnippets();
    }
  } catch (e) {
    message.error((e as Error).message);
  }
}

// 本地函数：批量删除
function handleDelete(): void {
  if (!selectedRow.value) {
    message.warning('请先选择一行');
    return;
  }
  deleteRow(selectedRow.value);
}

onMounted(loadSnippets)
</script>

<style scoped>
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }

@media (prefers-reduced-motion: reduce) {
  .fade-in { animation: none; }
}
</style>