<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { message } from '@repo/core';
import { getGroupTree, getGroups, saveGroup, delGroup } from '../api';

interface GroupNode {
  id: number;
  name: string;
  parentId: number;
  sort: number;
  remark?: string;
  color?: string;
  children?: GroupNode[];
}

const loading = ref(false);
const treeData = ref<GroupNode[]>([]);
const flatGroups = ref<any[]>([]);

const formVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref({ msServerGroupName: '', msServerGroupParentId: 0, msServerGroupSort: 0, msServerGroupRemark: '', msServerGroupColor: '' });

/** 预设分组色板，便于快速选取常用颜色 */
const colorPresets = ['#6d5dfc', '#4f8ff7', '#22b895', '#f7b500', '#fb6f5b', '#f74f87', '#8a6de6', '#2f3c4f', '#0ea5e9'];

onMounted(refresh);

async function refresh() {
  loading.value = true;
  try {
    const [tree, flat] = await Promise.all([
      getGroupTree().catch(() => []),
      getGroups().catch(() => []),
    ]);
    treeData.value = tree ?? [];
    flatGroups.value = flat ?? [];
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function openCreate(parentId = 0) {
  editingId.value = null;
  form.value = { msServerGroupName: '', msServerGroupParentId: parentId, msServerGroupSort: 0, msServerGroupRemark: '', msServerGroupColor: '' };
  formVisible.value = true;
}

function openEdit(node: GroupNode) {
  editingId.value = node.id;
  const anyNode = node as unknown as Record<string, unknown>;
  form.value = {
    msServerGroupName: node.name,
    msServerGroupParentId: node.parentId,
    msServerGroupSort: node.sort,
    msServerGroupRemark: node.remark || '',
    msServerGroupColor: String(anyNode.msServerGroupColor ?? anyNode.color ?? ''),
  };
  formVisible.value = true;
}

async function submitForm() {
  if (!form.value.msServerGroupName.trim()) {
    message.warning('分组名称不能为空');
    return;
  }
  await saveGroup(editingId.value, { ...form.value });
  message.success('已保存');
  formVisible.value = false;
  refresh();
}

async function removeGroup(node: GroupNode) {
  await message.confirm(`确认删除分组 ${node.name}? 若存在子分组或主机将拒绝删除`, '删除');
  await delGroup(node.id);
  message.success('已删除');
  refresh();
}

function renderNode(node: GroupNode): string {
  return `${node.name}${node.children?.length ? ` (${node.children.length})` : ''}`;
}
</script>

<template>
  <div class="group-tree sc-page">
    <ReSectionHead class="page-head" title="分组管理" description="维护主机分组的层级结构">
      <template #actions>
        <ReButton show-text icon="Plus" type="primary" @click="openCreate()">新建根分组</ReButton>
        <ReButton show-text icon="Refresh" @click="refresh">刷新</ReButton>
      </template>
    </ReSectionHead>

    <ReCard class="tree-card" v-loading="loading">
      <ReEmptyState
        v-if="!loading && treeData.length === 0"
        title="暂无分组"
        description="点击右上角「新建根分组」创建第一个分组"
        size="compact"
      >
        <template #icon><FolderOpened /></template>
      </ReEmptyState>
      <ReTree
        v-else
        :data="treeData"
        node-key="id"
        :props="{ children: 'children', label: 'name' }"
        default-expand-all
        highlight-current
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="tree-label">
              <span
                v-if="data?.msServerGroupColor"
                class="color-dot"
                :style="{ background: data.msServerGroupColor }"
              ></span>
              {{ node.label }}
            </span>
            <span class="tree-actions">
              <ReButton link size="small" @click="openCreate(data.id)">添加子</ReButton>
              <ReButton link size="small" @click="openEdit(data)">编辑</ReButton>
              <ReButton link size="small" type="danger" @click="removeGroup(data)">删除</ReButton>
            </span>
          </div>
        </template>
      </ReTree>
    </ReCard>

    <ReDialog v-model="formVisible" :title="editingId ? '编辑分组' : '新建分组'" width="480" :height="380" confirm-text="保存" cancel-text="取消" @confirm="submitForm" @cancel="formVisible = false">
      <ReForm label-width="80px" label-position="right">
        <ReFormItem label="名称" required>
          <ReInput v-model="form.msServerGroupName" placeholder="分组名称" />
        </ReFormItem>
        <ReFormItem label="父分组">
          <ReTreeSelect
            v-model="form.msServerGroupParentId"
            :data="treeData"
            :props="{ children: 'children', label: 'name', value: 'id' }"
            placeholder="根分组"
            clearable
            filterable
            style="width: 100%"
          />
        </ReFormItem>
        <ReFormItem label="排序">
          <ReInputNumber v-model="form.msServerGroupSort" :min="0" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="颜色">
          <div class="color-field">
            <el-color-picker v-model="form.msServerGroupColor" :predefine="colorPresets" />
            <ReInput v-model="form.msServerGroupColor" placeholder="可选，如 #6d5dfc" clearable style="flex:1" />
          </div>
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.msServerGroupRemark" type="textarea" :rows="2" />
        </ReFormItem>
      </ReForm>
    </ReDialog>
  </div>
</template>

 <style scoped lang="scss">
.group-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tree-card {
  padding: 8px;
  background: var(--bg-container-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}
.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}
.tree-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06);
}
.color-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.tree-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s var(--ease-out);
}
.tree-node:hover .tree-actions,
.tree-node:focus-within .tree-actions {
  opacity: 1;
}
</style>