<script setup lang="ts">
/**
 * 分组管理页
 *
 * 分组树展示 + 新增/编辑/删除 + 初始化默认分组
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Edit, FolderOpened, Plus, Refresh, Setting } from "@element-plus/icons-vue";
import {
  deleteGroup,
  initDefaultGroups,
  listGroupTree,
  saveGroup,
  updateGroup,
} from "../api/filesystemApi";
import type { SysFileSystemGroup } from "../api/types";

const treeRef = ref();
const treeData = ref<SysFileSystemGroup[]>([]);
const loading = ref(false);
const selectedId = ref<number | undefined>(undefined);

async function loadTree() {
  loading.value = true;
  try {
    const res = await listGroupTree();
    treeData.value = (res?.data ?? []) as SysFileSystemGroup[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载分组失败");
  } finally {
    loading.value = false;
  }
}

function handleSelect(node: { sysFileSystemGroupId?: number } | null) {
  selectedId.value = node?.sysFileSystemGroupId;
}

function handleNodeClick(node: unknown) {
  handleSelect((node as { sysFileSystemGroupId?: number } | null) ?? null);
}

/* ================== 新增 / 编辑 ================== */

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysFileSystemGroup>({
  sysFileSystemGroupParentId: 0,
  sysFileSystemGroupSort: 0,
  sysFileSystemGroupStatus: 1,
});

function openAdd(parentId?: number) {
  isEdit.value = false;
  form.value = {
    sysFileSystemGroupParentId: parentId ?? 0,
    sysFileSystemGroupSort: 0,
    sysFileSystemGroupStatus: 1,
  };
  dialogVisible.value = true;
}

function openEdit(node: SysFileSystemGroup) {
  isEdit.value = true;
  form.value = { ...node };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysFileSystemGroupName) {
    ElMessage.warning("请填写分组名称");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateGroup(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveGroup(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    await loadTree();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

/* ================== 删除 ================== */

const deleting = ref(false);

async function handleDelete(node: SysFileSystemGroup) {
  if (deleting.value) return;
  try {
    await ElMessageBox.confirm(`确认删除分组「${node.sysFileSystemGroupName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确认删除",
    });
  } catch {
    return;
  }
  deleting.value = true;
  try {
    await deleteGroup(node.sysFileSystemGroupId!);
    ElMessage.success("删除成功");
    await loadTree();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleting.value = false;
  }
}

/* ================== 初始化默认分组 ================== */

const initLoading = ref(false);

async function handleInit() {
  try {
    await ElMessageBox.confirm("将重建默认分组（图片/视频/文档/音频/默认），确认继续？", "初始化默认分组", {
      type: "warning",
      confirmButtonText: "确认初始化",
    });
  } catch {
    return;
  }
  initLoading.value = true;
  try {
    const res = await initDefaultGroups();
    ElMessage.success(res?.data ? "初始化成功" : "初始化完成（分组已存在）");
    await loadTree();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "初始化失败");
  } finally {
    initLoading.value = false;
  }
}

onMounted(loadTree);
</script>

<template>
  <div class="filesystem-page">
    <div class="filesystem-page__header">
      <div>
        <h2 class="filesystem-page__title">分组管理</h2>
        <p class="filesystem-page__subtitle">维护文件存储分组与分类</p>
      </div>
      <div class="fs-group-actions">
        <ReButton layout="modern" icon="Refresh" @click="loadTree">刷新</ReButton>
        <ReButton layout="modern" :icon="Setting" :loading="initLoading" @click="handleInit">初始化默认分组</ReButton>
        <ReButton layout="modern" type="primary" icon="Plus" @click="openAdd(0)">新增分组</ReButton>
      </div>
    </div>

    <el-card shadow="never" class="filesystem-page__card">
      <div v-loading="loading" class="fs-tree-wrap">
        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="sysFileSystemGroupId"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          :props="{ label: 'sysFileSystemGroupName', children: 'children' }"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="fs-tree-node" :class="{ 'is-selected': selectedId === data.sysFileSystemGroupId }">
              <el-icon class="fs-tree-icon">
                <FolderOpened />
              </el-icon>
              <span class="fs-tree-label">{{ node.label }}</span>
              <span v-if="data.fileCount" class="fs-tree-count">{{ data.fileCount }}</span>
              <span class="fs-tree-ops">
                <el-icon v-if="data.sysFileSystemGroupIsDefault !== true" title="新增子分组" @click.stop="openAdd(data.sysFileSystemGroupId)"><Plus /></el-icon>
                <el-icon title="编辑" @click.stop="openEdit(data)"><Edit /></el-icon>
                <el-icon v-if="data.sysFileSystemGroupIsDefault !== true" title="删除" @click.stop="handleDelete(data)"><Delete /></el-icon>
              </span>
            </div>
          </template>
        </el-tree>
      </div>
    </el-card>

    <!-- 分组编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分组' : '新增分组'"
      width="480"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="90px" :model="form">
        <el-form-item label="上级分组">
          <el-tree-select
            v-model="form.sysFileSystemGroupParentId"
            :data="treeData"
            :props="{ value: 'sysFileSystemGroupId', label: 'sysFileSystemGroupName', children: 'children' }"
            check-strictly
            clearable
            placeholder="顶级分组"
            style="width: 100%"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="分组名称" required>
          <ReInput layout="modern" v-model="form.sysFileSystemGroupName" placeholder="例如：合同文件" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysFileSystemGroupSort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="图标">
          <ReInput layout="modern" v-model="form.sysFileSystemGroupIcon" placeholder="Element Plus 图标名，如 Folder" />
        </el-form-item>
        <el-form-item label="颜色">
          <ReInput layout="modern" v-model="form.sysFileSystemGroupColor" placeholder="十六进制，如 #409EFF" />
        </el-form-item>
        <el-form-item label="描述">
          <ReInput layout="modern" v-model="form.sysFileSystemGroupDescription" type="textarea" placeholder="分组用途说明" />
        </el-form-item>
        <el-form-item label="启用状态">
          <ReSwitch
            layout="modern"
            :model-value="form.sysFileSystemGroupStatus === 1"
            @update:model-value="(v: string | number | boolean) => (form.sysFileSystemGroupStatus = v ? 1 : 0)"
          />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped>
.fs-group-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.fs-tree-wrap {
  padding: 8px;
  max-height: calc(100vh - 220px);
  overflow: auto;
}

.fs-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 2px 4px;
  border-radius: 6px;
}

.fs-tree-node.is-selected {
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.fs-tree-icon {
  color: var(--el-color-primary);
  font-size: 15px;
}

.fs-tree-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.fs-tree-count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 0 6px;
  border-radius: 8px;
}

.fs-tree-ops {
  display: none;
  align-items: center;
  gap: 4px;
}

.fs-tree-node:hover .fs-tree-ops,
.fs-tree-node.is-selected .fs-tree-ops {
  display: inline-flex;
}

.fs-tree-ops .el-icon {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.fs-tree-ops .el-icon:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
</style>