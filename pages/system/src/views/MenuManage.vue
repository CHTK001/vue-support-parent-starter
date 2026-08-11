<script setup lang="ts">
/**
 * 菜单管理页面
 *
 * 树形展示系统菜单（按钮/菜单/外链/iframe 四种类型），支持新增、编辑、删除。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Menu as MenuIcon, Plus, Edit, Delete, Refresh } from "@element-plus/icons-vue";
import { listMenuTree, saveMenu, updateMenu, deleteMenu } from "../api/systemApi";
import type { SysMenu, SysMenuSettingVO } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

const list = ref<SysMenuSettingVO[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const form = ref<SysMenu>({});
const isEdit = ref(false);

const typeMap: Record<number, { label: string; type: string }> = {
  0: { label: "菜单", type: "primary" },
  1: { label: "iframe", type: "warning" },
  2: { label: "外链", type: "info" },
  3: { label: "按钮", type: "success" },
};

async function loadList() {
  loading.value = true;
  try {
    const res = await listMenuTree();
    list.value = (res?.data ?? []) as SysMenuSettingVO[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "菜单列表加载失败");
  } finally {
    loading.value = false;
  }
}

function handleAdd(parent?: SysMenu) {
  isEdit.value = false;
  form.value = {
    sysMenuPid: parent?.sysMenuId ?? 0,
    sysMenuType: 0,
    sysMenuSort: 0,
    sysMenuHidden: 0,
    sysMenuHiddenTag: 0,
    sysMenuFixedTag: 0,
    sysMenuKeepAlive: 0,
    sysMenuShowParent: 0,
    sysMenuEngine: 0,
    sysMenuHome: 0,
  };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysMenu) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysMenuName || !form.value.sysMenuTitle) {
    ElMessage.warning("请输入菜单名称和标题");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateMenu(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveMenu(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const menu = row as unknown as SysMenu;
  if (menu.children?.length) {
    ElMessage.warning("存在子菜单，请先删除子菜单");
    return;
  }
  await ElMessageBox.confirm(`确认删除菜单「${menu.sysMenuTitle}」？`, "提示", { type: "warning" });
  await deleteMenu(menu.sysMenuId!);
  ElMessage.success("删除成功");
  loadList();
}

const columns: ReTableColumn[] = [
  { prop: "sysMenuTitle", label: "菜单标题", minWidth: 200, slot: "title" },
  { prop: "sysMenuName", label: "路由名", minWidth: 140 },
  { prop: "sysMenuPath", label: "路径", minWidth: 160, showOverflowTooltip: true },
  { prop: "sysMenuComponent", label: "组件", minWidth: 160, showOverflowTooltip: true },
  { prop: "sysMenuPerm", label: "权限标识", minWidth: 120 },
  { prop: "sysMenuType", label: "类型", width: 100, slot: "type", align: "center" },
  { prop: "sysMenuSort", label: "排序", width: 80, align: "center" },
  { prop: "sysMenuHidden", label: "可见", width: 90, slot: "visible", align: "center" },
  { prop: "action", label: "操作", width: 240, slot: "action", fixed: "right" },
];

onMounted(loadList);
</script>

<template>
  <div class="system-page">
    <div class="system-page__header">
      <div>
        <h2 class="system-page__title">菜单管理</h2>
        <p class="system-page__subtitle">维护系统菜单树，支持菜单 / iframe / 外链 / 按钮四种类型</p>
      </div>
      <ReButton layout="modern" type="primary" v-admin icon="Plus" @click="handleAdd()">新增顶级菜单</ReButton>
    </div>

    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true">
        <div class="system-page__search">
          <div class="flex-1" />
          <ReButton layout="modern" icon="Refresh" @click="loadList">刷新</ReButton>
        </div>
      </ReSearch>

      <ReTable
        :data="list"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        row-key="sysMenuId"
        :tree-props="{ children: 'children' }"
        :default-expand-all="false"
      >
        <template #title="{ row }">
          <div class="flex items-center gap-2">
            <el-icon v-if="row.sysMenuIcon" :size="16" color="var(--el-color-primary)"><MenuIcon /></el-icon>
            <span>{{ row.sysMenuTitle }}</span>
          </div>
        </template>
        <template #type="{ row }">
          <ReTag :type="(typeMap[row.sysMenuType ?? 0]?.type as never) ?? 'info'" effect="plain" size="small">
            {{ typeMap[row.sysMenuType ?? 0]?.label ?? "-" }}
          </ReTag>
        </template>
        <template #visible="{ row }">
          <ReTag :type="row.sysMenuHidden === 0 ? 'success' : 'info'" effect="plain" size="small">
            {{ row.sysMenuHidden === 0 ? "显示" : "隐藏" }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton layout="modern" link type="primary" icon="Plus" v-admin @click="handleAdd(row)">新增下级</ReButton>
          <ReButton layout="modern" link type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="modern" link type="danger" icon="Delete" v-admin @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.sysMenuPid"
            :data="list"
            :props="{ value: 'sysMenuId', label: 'sysMenuTitle', children: 'children' }"
            check-strictly
            clearable
            placeholder="不选则为顶级"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="菜单类型" required>
          <el-radio-group v-model="form.sysMenuType">
            <el-radio :value="0">菜单</el-radio>
            <el-radio :value="1">iframe</el-radio>
            <el-radio :value="2">外链</el-radio>
            <el-radio :value="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单标题" required>
          <ReInput layout="modern" v-model="form.sysMenuTitle" placeholder="如：用户管理" />
        </el-form-item>
        <el-form-item label="路由名" required>
          <ReInput layout="modern" v-model="form.sysMenuName" placeholder="路由 name（英文唯一）" />
        </el-form-item>
        <el-form-item label="路径">
          <ReInput layout="modern" v-model="form.sysMenuPath" placeholder="如：/system/user" />
        </el-form-item>
        <el-form-item label="组件" v-if="form.sysMenuType === 0">
          <ReInput layout="modern" v-model="form.sysMenuComponent" placeholder="如：system/user/index" />
        </el-form-item>
        <el-form-item label="图标">
          <ReInput layout="modern" v-model="form.sysMenuIcon" placeholder="Element Plus 图标名，如 User" />
        </el-form-item>
        <el-form-item label="权限标识">
          <ReInput layout="modern" v-model="form.sysMenuPerm" placeholder="按钮权限标识，如 sys:user:save" />
        </el-form-item>
        <el-form-item label="iframe/外链" v-if="form.sysMenuType === 1 || form.sysMenuType === 2">
          <ReInput layout="modern" v-model="form.sysMenuFrameSrc" placeholder="iframe/外链地址" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysMenuSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="显示设置">
          <div class="flex flex-wrap items-center gap-4">
            <ReSwitch layout="modern" title="隐藏" :model-value="form.sysMenuHidden === 1" @update:model-value="(v: boolean) => (form.sysMenuHidden = v ? 1 : 0)" />
            <ReSwitch layout="modern" title="标签栏隐藏" :model-value="form.sysMenuHiddenTag === 1" @update:model-value="(v: boolean) => (form.sysMenuHiddenTag = v ? 1 : 0)" />
            <ReSwitch layout="modern" title="固定标签" :model-value="form.sysMenuFixedTag === 1" @update:model-value="(v: boolean) => (form.sysMenuFixedTag = v ? 1 : 0)" />
            <ReSwitch layout="modern" title="keep-alive" :model-value="form.sysMenuKeepAlive === 1" @update:model-value="(v: boolean) => (form.sysMenuKeepAlive = v ? 1 : 0)" />
          </div>
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.system-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.system-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
</style>
