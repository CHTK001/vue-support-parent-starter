<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
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
/** 保存分组中：提交按钮 loading，防重复提交 */
const saving = ref(false);
const treeData = ref<GroupNode[]>([]);
const flatGroups = ref<any[]>([]);
const searchKeyword = ref('');

const formVisible = ref(false);
const currentNode = ref<GroupNode | null>(null);
const editingId = ref<number | null>(null);
const form = ref({ msServerGroupName: '', msServerGroupParentId: null as number | null, msServerGroupSort: 0, msServerGroupRemark: '', msServerGroupColor: '' });

/** 预设分组色板 */
const colorPresets = ['#6d5dfc', '#4f8ff7', '#22b895', '#f7b500', '#fb6f5b', '#f74f87', '#8a6de6', '#0ea5e9'];

// ---- 统计 ----
const totalGroups = computed(() => flatGroups.value.length);
const rootGroups = computed(() => treeData.value.length);
const subGroups = computed(() => totalGroups.value - rootGroups.value);

/** 过滤后的树数据 */
const filteredTreeData = computed(() => {
  if (!searchKeyword.value) return treeData.value;
  
  function filterNodes(nodes: GroupNode[]): GroupNode[] {
    return nodes
      .map(node => {
        const children = node.children ? filterNodes(node.children) : [];
        const match = node.name.includes(searchKeyword.value);
        if (match || children.length) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean) as GroupNode[];
  }
  
  return filterNodes(treeData.value);
});

function countDescendants(node: GroupNode): number {
  if (!node.children?.length) return 0;
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

/** 判断节点是否为根分组 */
function isRoot(node: GroupNode): boolean {
  return node.parentId === 0 || node.parentId === null;
}

/** 统计分组下的主机数 */
function hostCount(node: GroupNode): number {
  const g = flatGroups.value.find((x: any) => x.id === node.id);
  return g?.msServerHostCount ?? 0;
}

/** 统计在线主机数 */
function onlineHostCount(node: GroupNode): number {
  const g = flatGroups.value.find((x: any) => x.id === node.id);
  return g?.msServerHostOnlineCount ?? 0;
}

/** 获取子分组数 */
function subGroupCount(node: GroupNode): number {
  return node.children?.length || 0;
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
    if (saving.value) {
      return;
    }
    const payload = { ...form.value, msServerGroupParentId: form.value.msServerGroupParentId ?? 0 };
    saving.value = true;
    try {
      await saveGroup(editingId.value, payload);
      message.success('已保存');
      formVisible.value = false;
      refresh();
    } finally {
      // 失败时由调用方处理提示，这里只负责解除按钮 loading
      saving.value = false;
    }
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

    <div class="group-layout">
      <!-- 左侧树 -->
      <ReCard class="tree-card" v-loading="loading">
        <div class="tree-header">
          <span class="tree-title">分组列表</span>
          <ReButton icon="Plus" layout="square"  tip="新建分组" @click="openCreate()" />
        </div>
        
        <div class="tree-search">
          <ReInput v-model="searchKeyword" placeholder="搜索分组..." clearable >
            <template #prefix><ReIcon icon="Search" /></template>
          </ReInput>
        </div>

        <ReEmptyState
          v-if="!loading && filteredTreeData.length === 0"
          title="暂无分组"
          description="点击右上角「新建根分组」创建第一个分组"
          size="compact"
        >
          <template #icon><FolderOpened /></template>
        </ReEmptyState>
        <ReTree
          v-else
          :data="filteredTreeData"
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
              <span v-if="hostCount(node) > 0" class="node-badge">{{ hostCount(node) }}</span>
            </span>
          </template>
        </ReTree>
      </ReCard>

      <!-- 右侧详情 -->
      <ReCard class="detail-card">
        <div v-if="currentNode" class="detail-content">
          <!-- 详情头部 -->
          <div class="detail-header">
            <div class="detail-title-area">
              <h2 class="detail-title">{{ currentNode.name }}</h2>
              <p class="detail-desc">{{ currentNode.remark || '暂无描述' }}</p>
            </div>
            <div class="detail-actions">
              <ReButton show-text icon="Plus" @click="openCreate(currentNode.id)">添加子分组</ReButton>
              <ReButton show-text icon="EditPen" @click="openEdit(currentNode)">编辑</ReButton>
              <ReButton show-text icon="Delete" type="danger" @click="removeGroup(currentNode)">删除</ReButton>
            </div>
          </div>

          <!-- 统计卡片 -->
          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">主机总数</div>
              <div class="info-value">{{ hostCount(currentNode) }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">在线主机</div>
              <div class="info-value info-value--success">{{ onlineHostCount(currentNode) }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">子分组</div>
              <div class="info-value">{{ subGroupCount(currentNode) }}</div>
            </div>
          </div>

          <!-- 分组信息 -->
          <div class="detail-section">
            <h3 class="section-title">分组信息</h3>
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
              <div class="detail-item detail-item--full">
                <div class="detail-label">备注</div>
                <div class="detail-value">{{ currentNode.remark || '无' }}</div>
              </div>
            </div>
          </div>

          <!-- 关联主机列表 -->
          <div class="detail-section">
            <h3 class="section-title">关联主机</h3>
            <ReEmptyState
              v-if="hostCount(currentNode) === 0"
              title="暂无关联主机"
              description="该分组下暂无主机"
              size="compact"
            />
            <div v-else class="host-list">
              <div class="host-item" v-for="i in hostCount(currentNode)" :key="i">
                <div class="host-status host-status--online"></div>
                <span class="host-name">主机 {{ i }}</span>
                <span class="host-ip">192.168.1.{{ i }}</span>
                <span class="host-os">Linux</span>
              </div>
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
/* 本文件原先整套用 pages/server/src/styles/tokens.css 的私有令牌
   （--border-subtle / --text-primary / --text-secondary / --text-tertiary / --bg-fill /
   --bg-elevated，兜底还带 hex），而那份 tokens.css 只有 :root、没有暗色变体，
   暗色模式下这些值全部停留在亮色。统一改走 EP 语义令牌。 */
.group-tree {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  height: calc(100vh - 115px);
}

/* ReCard（koi 主题）自带 margin: 5px 6px，那是给「页面里散放卡片」留的呼吸位。
   这两张卡是 grid 紧邻排布的，间距已由 gap 负责，再叠一层 margin 会把卡片之间
   的实际间隔撑到 16 + 6 + 6 = 28px —— 比页面自身节奏（.sc-page 的 gap: 12px）
   宽出一倍多，看上去就像左右被推开。所以 margin 归零，间距只听 gap 的。 */
.tree-card,
.detail-card {
  margin: 0;
}

/* ---- 左侧树 ---- */
.tree-card {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.tree-title {
  font-size: 14px;
  font-weight: 600;
}

.tree-search {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
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
  color: var(--text-primary);
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--el-radius-full, 9999px);
  flex-shrink: 0;
  /* 圆点本体的颜色由模板 :style 动态传入（分组自定义色），没法用 color-mix 跟随，
     所以外圈光晕改用主题边框色令牌，亮暗色下都能保持一圈淡描边 */
  box-shadow: 0 0 0 2px var(--border-default);
}

.color-dot--default {
  /* 「未设置颜色」的中性灰占位 */
  background: var(--text-tertiary);
}

.node-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  /* 18px 高的徽标：9px 已是胶囊圆角，统一到 full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--brand-500) 10%, transparent);
  color: var(--brand-500);
  font-size: 11px;
  font-weight: 600;
}

/* ---- 右侧详情 ---- */
.detail-card {
  padding: 0;
  overflow: hidden;
  overflow-y: auto;
}

.detail-content {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.detail-title-area {
  flex: 1;
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.detail-desc {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

/* 统计卡片 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
  background: var(--bg-fill);
  /* 原为 10px，10px 距 8(md)/12(lg) 等距，取 12px(lg) */
  border-radius: var(--el-radius-lg, 12px);
  padding: 16px;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.info-value {
  font-size: 24px;
  font-weight: 600;
}

.info-value--success {
  color: var(--el-color-success);
}

/* 详情区块 */
.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
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

.detail-item--full {
  grid-column: span 2;
}

.detail-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

/* 主机列表 */
.host-list {
  border: 1px solid var(--border-subtle);
  /* 原为 10px，10px 距 8(md)/12(lg) 等距，取 12px(lg) */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}

.host-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.2s;
}

.host-item:last-child {
  border-bottom: none;
}

.host-item:hover {
  background: var(--bg-fill);
}

.host-status {
  width: 8px;
  height: 8px;
  border-radius: var(--el-radius-full, 9999px);
  margin-right: 12px;
}

.host-status--online {
  background: var(--el-color-success);
}

.host-name {
  flex: 1;
  font-size: 14px;
}

.host-ip {
  color: var(--text-secondary);
  font-size: 13px;
  margin-right: 16px;
}

.host-os {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.color-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .host-item {
    transition: none;
  }
}
</style>
