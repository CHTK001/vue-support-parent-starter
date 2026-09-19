<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { message } from '@repo/core';
import { ChatLineRound } from '@element-plus/icons-vue';
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
const currentNode = ref<GroupNode | null>(null);
const editingId = ref<number | null>(null);
const form = ref({ msServerGroupName: '', msServerGroupParentId: 0, msServerGroupSort: 0, msServerGroupRemark: '', msServerGroupColor: '' });

/** 预设分组色板 */
const colorPresets = ['#6d5dfc', '#4f8ff7', '#22b895', '#f7b500', '#fb6f5b', '#f74f87', '#8a6de6', '#0ea5e9'];

// ---- 统计 ----
const totalGroups = computed(() => flatGroups.value.length);
const rootGroups = computed(() => treeData.value.length);
const subGroups = computed(() => totalGroups.value - rootGroups.value);

function countDescendants(node: GroupNode): number {
  if (!node.children?.length) return 0;
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

/** 判断节点是否为根分组 */
function isRoot(node: GroupNode): boolean {
  return node.parentId === 0 || node.parentId === null;
}

/** 统计分组下的主机数（从 flatGroups 或 hosts 推导） */
function hostCount(node: GroupNode): number {
  // 从 flatGroups 里查 msServerHostCount 字段
  const g = flatGroups.value.find((x: any) => x.id === node.id);
  return g?.msServerHostCount ?? 0;
}

onMounted(refresh);

async function refresh() {
  loading.value = true;
  try {
    const [tree, flat] = await Promise.all([
      getGroupTree().catch(() => []),
      getGroups().catch(() => []),
    ]);
    treeData.value = Array.isArray(tree) ? tree : [];
    flatGroups.value = Array.isArray(flat) ? flat : [];
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function onNodeClick(node: GroupNode) {
  currentNode.value = node;
}

function openCreate(parentId = 0) {
  editingId.value = null;
  form.value = { msServerGroupName: '', msServerGroupParentId: parentId || null, msServerGroupSort: 0, msServerGroupRemark: '', msServerGroupColor: '' };
  formVisible.value = true;
}

function openEdit(node: GroupNode) {
  editingId.value = node.id;
  const anyNode = node as unknown as Record<string, unknown>;
  form.value = {
    msServerGroupName: node.name,
    msServerGroupParentId: node.parentId || null,
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
  const payload = { ...form.value, msServerGroupParentId: form.value.msServerGroupParentId ?? 0 };
  await saveGroup(editingId.value, payload);
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
</script>

<template>
  <div class="group-tree sc-page">
    <ReSectionHead class="page-head" title="分组管理" description="维护主机分组的层级结构">
      <template #actions>
        <ReButton show-text icon="Plus" type="primary" @click="openCreate()">新建根分组</ReButton>
        <ReButton show-text icon="Refresh" @click="refresh">刷新</ReButton>
      </template>
    </ReSectionHead>

    <div class="group-layout">
      <!-- 左侧树 -->
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
          @node-click="onNodeClick"
        >
          <template #label="{ node }">
            <span class="tree-label">
              <span
                v-if="node?.color"
                class="color-dot"
                :style="{ background: node.color }"
              ></span>
              <span v-else class="color-dot color-dot--default"></span>
              <span class="node-name">{{ node?.name }}</span>
              <span v-if="node?.children?.length" class="node-badge">{{ node.children.length }}</span>
            </span>
          </template>
        </ReTree>
      </ReCard>

      <!-- 右侧详情 -->
      <ReCard class="detail-card">
        <div v-if="currentNode" class="detail-content">
          <div class="detail-header">
            <div class="detail-title">{{ currentNode.name }}</div>
            <div class="detail-actions">
              <ReButton show-text icon="Plus" size="small" @click="openCreate(currentNode.id)">添加子分组</ReButton>
              <ReButton show-text icon="EditPen" size="small" @click="openEdit(currentNode)">编辑</ReButton>
              <ReButton show-text icon="Delete" size="small" type="danger" @click="removeGroup(currentNode)">删除</ReButton>
            </div>
          </div>
          <div class="detail-body">
            <div class="detail-item">
              <div class="detail-label">分组 ID</div>
              <div class="detail-value">{{ currentNode.id }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">分组名称</div>
              <div class="detail-value">{{ currentNode.name }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">子分组数</div>
              <div class="detail-value">{{ currentNode.children?.length || 0 }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">排序</div>
              <div class="detail-value">{{ currentNode.sort || 0 }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">颜色</div>
              <div class="detail-value">
                <span v-if="currentNode.color" class="color-dot" :style="{ background: currentNode.color }"></span>
                <span v-else>默认</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">备注</div>
              <div class="detail-value">{{ currentNode.remark || '无' }}</div>
            </div>
          </div>
        </div>
        <ReEmptyState
          v-else
          title="选择分组查看详情"
          description="点击左侧分组查看详细信息"
          size="compact"
        >
          <template #icon><FolderOpened /></template>
        </ReEmptyState>
      </ReCard>
    </div>

    <ReDialog v-model="formVisible" :title="editingId ? '编辑分组' : '新建分组'" width="480" :height="380" :close-on-click-modal="false">
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
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" icon="Check" :show-text="true" @click="submitForm">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.group-tree {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 统计卡片 ---- */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #e8e8ef);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: var(--border-default, #d0d0d8);
}
.stat-body {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary, #1a1a2e);
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary, #8a8a9e);
  margin-top: 2px;
}

/* ---- 树卡片 ---- */
.tree-card {
  padding: 12px 8px;
  background: var(--bg-container-card, #fff);
  border-radius: var(--border-radius, 12px);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06));
}

/* ---- 树节点 ---- */
.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.tree-node:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.tree-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.node-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #1a1a2e);
}
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.06);
}
.color-dot--default {
  background: #c0c4cc;
}
.node-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--el-color-primary-light-9, #e8e7ff);
  color: var(--el-color-primary, #6d5dfc);
  font-size: 11px;
  font-weight: 600;
}
.node-remark {
  font-size: 12px;
  opacity: 0.5;
  cursor: help;
}
.tree-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.tree-node:hover .tree-actions,
.tree-node:focus-within .tree-actions {
  opacity: 1;
}

.group-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 220px);
}

.tree-card {
  width: 320px;
  flex-shrink: 0;
}

.detail-card {
  flex: 1;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

.color-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
</style>
