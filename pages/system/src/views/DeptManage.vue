<script setup lang="ts">
/**
 * 机构管理 - 左右分栏布局
 * 左侧：机构树，支持搜索、节点拖拽调整层级/排序
 * 右侧：选中机构详情 + 操作按钮
 */
import { computed, onMounted, ref, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  OfficeBuilding,
  Plus,
  Edit,
  Delete,
  User,
  Search,
  RefreshLeft,
  ArrowRight,
  ArrowDown,
} from "@element-plus/icons-vue";
import ReTab from "@repo/ui/re-tab";
import { listDept, saveDept, updateDept, deleteDept, pageForUser } from "../api/systemApi";
import type { SysDept, SysUser } from "../api/types";

const deptStatusOptions = [
  { label: "启用", value: 0 },
  { label: "禁用", value: 1 },
] as const;

const list = ref<SysDept[]>([]);
const loading = ref(false);
const deleteLoading = ref<number>(0);
const dialogVisible = ref(false);
const saving = ref(false);
const form = ref<SysDept>({});
const isEdit = ref(false);
const filterText = ref("");
const currentDept = ref<SysDept | null>(null);
const treeRef = ref();

/** 树节点过滤 */
function filterNode(value: string, data: SysDept) {
  if (!value) return true;
  return data.sysDeptName?.includes(value) ?? false;
}
import { watch } from "vue";
watch(filterText, (val) => {
  treeRef.value?.filter(val);
});

function handleResetFilter() {
  filterText.value = "";
  treeRef.value?.filter("");
}

async function loadList() {
  loading.value = true;
  try {
    const res = await listDept();
    list.value = (res?.data ?? []) as SysDept[];
    // 卡片布局：默认展开顶级节点
    const expanded = new Set(cardExpanded.value);
    list.value.forEach((d) => d.sysDeptId != null && expanded.add(d.sysDeptId));
    cardExpanded.value = expanded;
    // 默认选中第一个顶级节点
    if (list.value.length && !currentDept.value) {
      currentDept.value = list.value[0];
      loadDeptUsers(currentDept.value.sysDeptId!);
    }
    await nextTick();
    if (filterText.value) treeRef.value?.filter(filterText.value);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "机构列表加载失败");
  } finally {
    loading.value = false;
  }
}

const deptUsers = ref<SysUser[]>([]);
const deptUsersLoading = ref(false);
async function loadDeptUsers(deptId: number) {
  deptUsersLoading.value = true;
  try {
    const res = await pageForUser({ page: 1, pageSize: 200, sysDeptId: deptId });
    deptUsers.value = (res?.data?.data ?? []) as SysUser[];
  } catch {
    deptUsers.value = [];
  } finally {
    deptUsersLoading.value = false;
  }
}
function handleNodeClick(data: SysDept) {
  currentDept.value = data;
  loadDeptUsers(data.sysDeptId!);
}

/* ================== 布局切换：树形（默认）/ 卡片式 ================== */
const layoutMode = ref("tree");
const layoutTabs = [
  { name: "tree", label: "树形", icon: "List" },
  { name: "card", label: "卡片", icon: "Grid" },
];

/** 卡片布局：展开的节点 id */
const cardExpanded = ref<Set<number>>(new Set());

interface DeptCardRow {
  node: SysDept;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  isLast: boolean;
}

/** 卡片布局：按展开状态把机构树拍平成带层级的行（搜索时自动全展开） */
const deptCardRows = computed<DeptCardRow[]>(() => {
  const rows: DeptCardRow[] = [];
  const keyword = filterText.value.trim();
  const subtreeMatch = (node: SysDept): boolean => {
    if (!keyword) return true;
    if ((node.sysDeptName ?? "").includes(keyword)) return true;
    return ((node.children ?? []) as SysDept[]).some((child) => subtreeMatch(child));
  };
  const walk = (nodes: SysDept[], depth: number) => {
    nodes.forEach((node, index) => {
      if (keyword && !subtreeMatch(node)) return;
      const children = (node.children ?? []) as SysDept[];
      const expanded = keyword ? true : cardExpanded.value.has(node.sysDeptId!);
      rows.push({
        node,
        depth,
        hasChildren: children.length > 0,
        expanded,
        isLast: index === nodes.length - 1,
      });
      if (children.length && expanded) walk(children, depth + 1);
    });
  };
  walk(list.value, 0);
  return rows;
});

/** 卡片布局：展开 / 收起某节点 */
function toggleCardNode(node: SysDept) {
  const id = node.sysDeptId;
  if (!id) return;
  const next = new Set(cardExpanded.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  cardExpanded.value = next;
}

function handleAdd(parent?: SysDept) {
  isEdit.value = false;
  form.value = {
    sysDeptPid: parent?.sysDeptId ?? currentDept.value?.sysDeptId ?? 0,
    sysDeptStatus: 0,
    sysDeptSort: 0,
    sysDeptDataPermission: 1,
    sysDeptIcon: "OfficeBuilding",
  };
  dialogVisible.value = true;
}

function handleEdit() {
  if (!currentDept.value) return;
  isEdit.value = true;
  form.value = { ...currentDept.value };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysDeptName) {
    ElMessage.warning("请输入机构名称");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateDept(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveDept(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    await loadList();
    if(currentDept.value) loadDeptUsers(currentDept.value.sysDeptId!);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

/** 树拖拽完成：更新父级与排序 */
async function allowDrop() { return true; }
async function handleDrop(draggingNode: any, dropNode: any, dropType: string) {
  try {
    const dragData = draggingNode.data as SysDept;
    let newPid = 0;
    let sort = 0;
    if (dropType === "inner") {
      newPid = dropNode.data.sysDeptId;
      sort = (dropNode.data.children?.length ?? 0) + 1;
    } else {
      newPid = dropNode.data.sysDeptPid ?? 0;
      sort = dropNode.data.sysDeptSort ?? 0;
      if (dropType === "after") sort += 1;
    }
    dragData.sysDeptPid = newPid;
    dragData.sysDeptSort = sort;
    await updateDept(dragData);
    ElMessage.success("机构层级已更新");
    await loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "拖拽调整失败");
    await loadList();
  }
}

async function handleDelete() {
  const dept = currentDept.value;
  if (!dept) return;
  if (dept.children?.length) {
    ElMessage.warning("存在子机构，请先删除子机构");
    return;
  }
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除机构「${dept.sysDeptName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  deleteLoading.value = dept.sysDeptId!;
  try {
    await deleteDept(dept.sysDeptId!);
    ElMessage.success("删除成功");
    currentDept.value = null;
    deptUsers.value = [];
    await loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

/* ================== 负责人选择 ================== */
const principalOptions = ref<{ label: string; value: string }[]>([]);
const principalLoading = ref(false);
async function searchPrincipal(queryStr: string) {
  if (!queryStr) {
    principalOptions.value = [];
    return;
  }
  principalLoading.value = true;
  try {
    const res = await pageForUser({ page: 1, pageSize: 20, sysUserName: queryStr });
    const rows = (res?.data?.data ?? []) as SysUser[];
    principalOptions.value = rows.map((u) => ({
      label: `${u.sysUserNickname ?? u.sysUserUsername}（${u.sysUserUsername}）`,
      value: u.sysUserUsername ?? "",
    }));
  } catch {
    principalOptions.value = [];
  } finally {
    principalLoading.value = false;
  }
}



onMounted(loadList);
</script>

<template>
  <div class="dept-page">
    <!-- 左侧：机构树卡片 -->
    <div class="dept-tree-card">
      <div class="dept-tree-header">
        <div class="dept-tree-title">
          <ElIcon color="var(--el-color-primary)"><OfficeBuilding /></ElIcon>
          <span>组织机构</span>
        </div>
        <div class="dept-tree-header-actions">
          <ReTab
            v-model="layoutMode"
            :tabs="layoutTabs"
            variant="capsule"
            nav-only
            class="dept-layout-switch"
          />
          <ReButton
            layout="square"
            icon="Plus"
            type="primary"
            title="新增顶级机构"
            v-admin
            @click="handleAdd()"
          />
        </div>
      </div>
      <div class="dept-tree-search">
        <ElInput
          v-model="filterText"
          placeholder="输入机构名称过滤"
          clearable
          :prefix-icon="Search"
        >
          <template #append v-if="filterText">
            <ElButton :icon="RefreshLeft" @click="handleResetFilter" />
          </template>
        </ElInput>
      </div>
      <div v-loading="loading" class="dept-tree-body">
        <!-- 卡片式：节点为卡片，虚线层级连线，可展开/收起 -->
        <div v-if="layoutMode === 'card'" class="dept-cards">
          <div
            v-for="row in deptCardRows"
            :key="row.node.sysDeptId"
            class="dept-card-row"
            :style="{ paddingLeft: row.depth * 22 + 'px' }"
          >
            <span
              v-if="row.depth > 0"
              class="dept-card-row__line"
              :class="{ 'dept-card-row__line--last': row.isLast }"
              :style="{ left: (row.depth - 1) * 22 + 11 + 'px' }"
            />
            <span
              v-if="row.depth > 0"
              class="dept-card-row__stub"
              :style="{ left: (row.depth - 1) * 22 + 11 + 'px' }"
            />
            <div
              class="dept-card"
              :class="{ 'is-active': currentDept?.sysDeptId === row.node.sysDeptId }"
              @click="handleNodeClick(row.node)"
            >
              <ReIcon
                :name="row.node.sysDeptIcon || 'OfficeBuilding'"
                size="15"
                class="dept-card__icon"
              />
              <span class="dept-card__name">{{ row.node.sysDeptName }}</span>
              <ReTag
                size="small"
                effect="light"
                round
                :type="row.node.sysDeptStatus === 0 ? 'success' : 'danger'"
              >
                {{ row.node.sysDeptStatus === 0 ? "启用" : "禁用" }}
              </ReTag>
              <button
                v-if="row.hasChildren"
                type="button"
                class="dept-card__toggle"
                :title="row.expanded ? '收起' : '展开'"
                @click.stop="toggleCardNode(row.node)"
              >
                <el-icon><ArrowDown v-if="row.expanded" /><ArrowRight v-else /></el-icon>
              </button>
            </div>
          </div>
          <ElEmpty v-if="!deptCardRows.length" description="暂无机构" :image-size="48" />
        </div>

        <ElTree
          v-else
          ref="treeRef"
          :data="list"
          node-key="sysDeptId"
          :props="{ label: 'sysDeptName', children: 'children' }"
          :expand-on-click-node="false"
          :default-expanded-keys="currentDept ? [currentDept.sysDeptId] : []"
          highlight-current
          draggable
          :allow-drop="allowDrop"
          @node-click="handleNodeClick"
          @node-drop="handleDrop"
        >
          <template #default="{ data }">
            <div class="dept-tree-node" :class="{active: currentDept?.sysDeptId === data.sysDeptId}">
              <ReIcon :name="data.sysDeptIcon || 'OfficeBuilding'" size="14" color="var(--el-color-primary)" />
              <span class="node-label">{{ data.sysDeptName }}</span>
              <ReTag
                size="small"
                :type="data.sysDeptStatus === 0 ? 'success' : 'danger'"
                effect="plain"
              >
                {{ data.sysDeptStatus === 0 ? "启用" : "禁用" }}
              </ReTag>
            </div>
          </template>
        </ElTree>
      </div>
    </div>

    <!-- 右侧：详情卡片 -->
    <div class="dept-detail-card">
      <template v-if="currentDept">
        <div class="dept-detail-header">
          <div class="dept-detail-title">
            <ReIcon :name="currentDept.sysDeptIcon || 'OfficeBuilding'" size="20" color="var(--el-color-primary)" />
            <div>
              <h3>{{ currentDept.sysDeptName }}</h3>
              <p>机构编码：{{ currentDept.sysDeptCode || '-' }}</p>
            </div>
          </div>
          <div class="dept-detail-actions">
            <ReButton layout="square" icon="Plus" type="primary" title="新增下级" v-admin @click="handleAdd(currentDept)" />
            <ReButton layout="square" icon="Edit" type="primary" title="编辑" v-admin @click="handleEdit" />
            <ReButton
              layout="square"
              icon="Delete"
              type="danger"
              title="删除"
              v-admin
              :loading="deleteLoading === currentDept.sysDeptId"
              @click="handleDelete"
            />
          </div>
        </div>
        <div class="dept-detail-top">
        <ElDescriptions :column="2" border class="dept-desc" size="default">
          <ElDescriptionsItem label="机构名称">{{ currentDept.sysDeptName || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="自定义图标">
            <ReIcon :name="currentDept.sysDeptIcon || 'OfficeBuilding'" size="16" />
            <span class="ml-2 text-xs">{{ currentDept.sysDeptIcon || 'OfficeBuilding' }}</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="负责人">{{ currentDept.sysDeptPrincipal || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="联系方式">{{ currentDept.sysDeptContact || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="排序">{{ currentDept.sysDeptSort ?? 0 }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ReTag :type="currentDept.sysDeptStatus === 0 ? 'success' : 'danger'" size="small">
              {{ currentDept.sysDeptStatus === 0 ? "启用" : "禁用" }}
            </ReTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="数据权限" :span="2">
            {{ ['', '本部门', '本部门及下级', '全部', '自定义', '仅本人'][currentDept.sysDeptDataPermission ?? 1] }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="备注" :span="2">{{ currentDept.sysDeptRemark || '-' }}</ElDescriptionsItem>
        </ElDescriptions>
        </div>
        <div class="dept-users-section">
          <div class="dept-users-title">
            <ElIcon><User /></ElIcon>
            <span>机构用户（{{ deptUsers.length }}）</span>
          </div>
          <el-table v-loading="deptUsersLoading" :data="deptUsers" stripe size="small" style="width: 100%" height="260">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="sysUserUsername" label="账号" min-width="120" show-overflow-tooltip />
            <el-table-column prop="sysUserNickname" label="昵称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="sysUserPhone" label="手机号" min-width="120" />
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.sysUserStatus === 1 ? 'success' : 'danger'" size="small" effect="plain">
                  {{ row.sysUserStatus === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
      <ElEmpty v-else description="请选择左侧机构查看详情" class="dept-empty" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑机构' : '新增机构'"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="上级机构">
          <el-tree-select
            v-model="form.sysDeptPid"
            :data="list"
            :props="{ value: 'sysDeptId', label: 'sysDeptName', children: 'children' }"
            check-strictly
            clearable
            placeholder="不选则为顶级"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="机构名称" required>
          <ReInput layout="modern" v-model="form.sysDeptName" placeholder="请输入机构名称" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="自定义图标">
          <ReIconSelect v-model="form.sysDeptIcon" placeholder="选择机构图标" class="w-full" />
        </el-form-item>
        <el-form-item label="机构编码">
          <ReInput layout="modern" v-model="form.sysDeptCode" placeholder="请输入机构编码" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select
            v-model="form.sysDeptPrincipal"
            filterable
            remote
            clearable
            reserve-keyword
            placeholder="输入账号/昵称搜索用户"
            :remote-method="searchPrincipal"
            :loading="principalLoading"
            class="w-full"
          >
            <el-option v-for="opt in principalOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系方式">
          <ReInput layout="modern" v-model="form.sysDeptContact" placeholder="请输入联系方式" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysDeptSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="form.sysDeptStatus" :options="deptStatusOptions" />
        </el-form-item>
        <el-form-item label="数据权限">
          <ReSelect
            v-model="form.sysDeptDataPermission"
            placeholder="数据权限类型"
            class="w-full"
            :data="[
              { label: '本部门', value: 1 },
              { label: '本部门及下级', value: 2 },
              { label: '全部', value: 3 },
              { label: '自定义', value: 4 },
              { label: '仅本人', value: 5 },
            ]"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysDeptRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>


  </div>
</template>

<style scoped lang="scss">
.dept-page {
  display: flex;
  gap: 8px;
  padding: 0;
  height: calc(100vh - 100px);
  box-sizing: border-box;
}
.dept-tree-card {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dept-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dept-tree-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 15px;
}
.dept-tree-search {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dept-tree-body {
  flex: 1;
  overflow: auto;
  padding: 8px;
}
.dept-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  flex: 1;
  .node-label {
    flex: 1;
    font-size: 14px;
  }
}
.dept-detail-card {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: auto;
}
.dept-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dept-detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
  h3 { margin:0; font-size: 18px; }
  p { margin:2px 0 0; font-size: 13px; color: var(--el-text-color-secondary); }
}
.dept-detail-actions {
  display: flex;
  gap: 4px;
}
.dept-desc {
  padding: 16px;
}
.dept-empty {
  padding-top: 100px;
}
:deep(.el-tree-node__content) {
  height: 32px;
}

/* 统一弹窗内所有表单组件边框，深浅完全一致 */
:deep(.el-dialog .el-select .el-input__wrapper),
:deep(.el-dialog .el-tree-select .el-input__wrapper),
:deep(.el-dialog .el-input .el-input__wrapper),
:deep(.el-dialog .el-textarea__inner) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
  background-color: var(--el-fill-color-blank);
  border-radius: 4px;
}
:deep(.el-dialog .el-select .el-input__wrapper:hover),
:deep(.el-dialog .el-tree-select .el-input__wrapper:hover),
:deep(.el-dialog .el-input .el-input__wrapper:hover),
:deep(.el-dialog .el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-hover) inset !important;
}
:deep(.el-dialog .el-select .el-input.is-focus .el-input__wrapper),
:deep(.el-dialog .el-tree-select .el-input.is-focus .el-input__wrapper),
:deep(.el-dialog .el-input .el-input.is-focus .el-input__wrapper),
:deep(.el-dialog .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}
/* 右侧上下结构布局 */
.dept-detail-top {
  padding: 0 16px;
}
.dept-users-section {
  margin: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}
.dept-users-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

/* ==================== 布局切换 + 卡片式机构树 ==================== */
.dept-tree-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dept-layout-switch {
  width: 150px;
}

.dept-cards {
  display: flex;
  flex-direction: column;
  padding: 4px 2px 12px;
}

.dept-card-row {
  position: relative;
  padding-top: 3px;
  padding-bottom: 3px;
}

/* 层级虚线：竖干线 + 横向支线 */
.dept-card-row__line {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px dashed var(--el-border-color);
}
.dept-card-row__line--last {
  bottom: 50%;
}
.dept-card-row__stub {
  position: absolute;
  top: 50%;
  width: 11px;
  border-top: 1px dashed var(--el-border-color);
}

/* 机构卡片 */
.dept-card {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
  cursor: pointer;
  transition:
    border-color var(--el-transition-duration, 0.2s) ease,
    background-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease;
}
.dept-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}
.dept-card.is-active {
  border-color: transparent;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-primary-light-3)
  );
  box-shadow: 0 6px 14px color-mix(in srgb, var(--el-color-primary) 26%, transparent);
}

.dept-card__icon {
  flex: none;
  color: var(--el-color-primary);
}
.dept-card.is-active .dept-card__icon {
  color: var(--el-color-white);
}

.dept-card__name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dept-card.is-active .dept-card__name {
  color: var(--el-color-white);
}

.dept-card.is-active :deep(.el-tag) {
  border-color: transparent;
  background: color-mix(in srgb, var(--el-color-white) 24%, transparent);
  color: var(--el-color-white);
}

.dept-card__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color var(--el-transition-duration, 0.2s) ease;
}
.dept-card__toggle:hover {
  color: var(--el-color-primary);
}
.dept-card.is-active .dept-card__toggle {
  background: color-mix(in srgb, var(--el-color-white) 24%, transparent);
  color: var(--el-color-white);
}
</style>
