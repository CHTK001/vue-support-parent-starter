<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getGroupTree, getGroups, saveGroup, delGroup } from '../api';

interface GroupNode {
  id: number;
  name: string;
  parentId: number;
  sort: number;
  remark?: string;
  children?: GroupNode[];
}

const loading = ref(false);
const treeData = ref<GroupNode[]>([]);
const flatGroups = ref<any[]>([]);

const formVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref({ msServerGroupName: '', msServerGroupParentId: 0, msServerGroupSort: 0, msServerGroupRemark: '' });

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
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

function openCreate(parentId = 0) {
  editingId.value = null;
  form.value = { msServerGroupName: '', msServerGroupParentId: parentId, msServerGroupSort: 0, msServerGroupRemark: '' };
  formVisible.value = true;
}

function openEdit(node: GroupNode) {
  editingId.value = node.id;
  form.value = {
    msServerGroupName: node.name,
    msServerGroupParentId: node.parentId,
    msServerGroupSort: node.sort,
    msServerGroupRemark: node.remark || '',
  };
  formVisible.value = true;
}

async function submitForm() {
  if (!form.value.msServerGroupName.trim()) {
    ElMessage.warning('分组名称不能为空');
    return;
  }
  await saveGroup(editingId.value, { ...form.value });
  ElMessage.success('已保存');
  formVisible.value = false;
  refresh();
}

async function removeGroup(node: GroupNode) {
  await ElMessageBox.confirm(`确认删除分组 ${node.name}? 若存在子分组或主机将拒绝删除`, '删除', { type: 'warning' });
  await delGroup(node.id);
  ElMessage.success('已删除');
  refresh();
}

function renderNode(node: GroupNode): string {
  return `${node.name}${node.children?.length ? ` (${node.children.length})` : ''}`;
}
</script>

<template>
  <div class="group-tree sc-page">
    <div class="toolbar">
      <el-button type="primary" @click="openCreate()">新建根分组</el-button>
      <el-button @click="refresh">刷新</el-button>
    </div>

    <el-card class="tree-card" v-loading="loading">
      <el-tree
        :data="treeData"
        node-key="id"
        :props="{ children: 'children', label: 'name' }"
        :render-content="(h, { node, data }: any) => {
          return h('div', { class: 'tree-node' }, [
            h('span', { class: 'tree-label' }, node.label),
            h('span', { class: 'tree-actions' }, [
              h('el-button', { size: 'small', link: true, onClick: () => openCreate(data.id) }, '添加子'),
              h('el-button', { size: 'small', link: true, onClick: () => openEdit(data) }, '编辑'),
              h('el-button', { size: 'small', link: true, type: 'danger', onClick: () => removeGroup(data) }, '删除'),
            ]),
          ]);
        }"
        default-expand-all
        highlight-current
      />
    </el-card>

    <ReDialog v-model="formVisible" :title="editingId ? '编辑分组' : '新建分组'" width="480" :height="380" confirm-text="保存" cancel-text="取消" @confirm="submitForm" @cancel="formVisible = false">
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.msServerGroupName" placeholder="分组名称" />
        </el-form-item>
        <el-form-item label="父分组">
          <el-tree-select
            v-model="form.msServerGroupParentId"
            :data="treeData"
            :props="{ children: 'children', label: 'name', value: 'id' }"
            placeholder="根分组"
            clearable
            filterable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.msServerGroupSort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.msServerGroupRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.group-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.tree-card {
  padding: 8px;
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
}
.tree-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.tree-node:hover .tree-actions {
  opacity: 1;
}
</style>