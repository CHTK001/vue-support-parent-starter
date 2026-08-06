<script setup lang="ts">
/**
 * 菜单管理页面
 *
 * 树形展示系统菜单（按钮/菜单/外链/iframe 四种类型），
 * 支持新增、编辑、删除。
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Menu as MenuIcon, Plus, Edit, Delete, Refresh } from "@element-plus/icons-vue";
import { listMenuTree, saveMenu, updateMenu, deleteMenu } from "../api/systemApi";
import type { SysMenu, SysMenuSettingVO } from "../api/types";

const list = ref<SysMenuSettingVO[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<SysMenu>({});
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
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, {
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
  });
  dialogVisible.value = true;
}

function handleEdit(row: SysMenu) {
  isEdit.value = true;
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.sysMenuName || !form.sysMenuTitle) {
    ElMessage.warning("请输入菜单名称和标题");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateMenu(form);
      ElMessage.success("修改成功");
    } else {
      await saveMenu(form);
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

async function handleDelete(row: SysMenu) {
  if (row.children?.length) {
    ElMessage.warning("存在子菜单，请先删除子菜单");
    return;
  }
  await ElMessageBox.confirm(`确认删除菜单「${row.sysMenuTitle}」？`, "提示", { type: "warning" });
  await deleteMenu(row.sysMenuId!);
  ElMessage.success("删除成功");
  loadList();
}

onMounted(loadList);
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
          菜单管理
        </h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">
          维护系统菜单树，支持菜单 / iframe / 外链 / 按钮四种类型
        </p>
      </div>
      <el-button type="primary" v-admin :icon="Plus" @click="handleAdd()">新增顶级菜单</el-button>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex items-center gap-3">
        <div class="flex-1" />
        <el-button :icon="Refresh" @click="loadList">刷新</el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="list"
        row-key="sysMenuId"
        :tree-props="{ children: 'children' }"
        stripe
        class="w-full"
      >
        <el-table-column prop="sysMenuTitle" label="菜单标题" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-icon v-if="row.sysMenuIcon" :size="16" color="var(--el-color-primary)"><MenuIcon /></el-icon>
              <span>{{ row.sysMenuTitle }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sysMenuName" label="路由名" min-width="140" />
        <el-table-column prop="sysMenuPath" label="路径" min-width="160" show-overflow-tooltip />
        <el-table-column prop="sysMenuComponent" label="组件" min-width="160" show-overflow-tooltip />
        <el-table-column prop="sysMenuPerm" label="权限标识" min-width="120" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="(typeMap[row.sysMenuType ?? 0]?.type as never) ?? 'info'"
              size="small"
              effect="plain"
            >
              {{ typeMap[row.sysMenuType ?? 0]?.label ?? "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sysMenuSort" label="排序" width="70" />
        <el-table-column label="可见" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.sysMenuHidden === 0 ? 'success' : 'info'"
              size="small"
              effect="plain"
            >
              {{ row.sysMenuHidden === 0 ? "显示" : "隐藏" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-admin link type="primary" :icon="Plus" @click="handleAdd(row)">新增下级</el-button>
            <el-button v-admin link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button v-admin link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="640"
      :close-on-click-modal="false"
      destroy-on-close
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
          <el-input v-model="form.sysMenuTitle" placeholder="如：用户管理" />
        </el-form-item>
        <el-form-item label="路由名" required>
          <el-input v-model="form.sysMenuName" placeholder="路由 name（英文唯一）" />
        </el-form-item>
        <el-form-item label="路径">
          <el-input v-model="form.sysMenuPath" placeholder="如：/system/user" />
        </el-form-item>
        <el-form-item label="组件" v-if="form.sysMenuType === 0">
          <el-input v-model="form.sysMenuComponent" placeholder="如：system/user/index" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.sysMenuIcon" placeholder="Element Plus 图标名，如 User" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.sysMenuPerm" placeholder="按钮权限标识，如 sys:user:save" />
        </el-form-item>
        <el-form-item label="iframe/外链" v-if="form.sysMenuType === 1 || form.sysMenuType === 2">
          <el-input v-model="form.sysMenuFrameSrc" placeholder="iframe/外链地址" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sysMenuSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="显示设置">
          <el-checkbox v-model="form.sysMenuHidden" :true-value="1" :false-value="0">隐藏</el-checkbox>
          <el-checkbox v-model="form.sysMenuHiddenTag" :true-value="1" :false-value="0">标签栏隐藏</el-checkbox>
          <el-checkbox v-model="form.sysMenuFixedTag" :true-value="1" :false-value="0">固定标签</el-checkbox>
          <el-checkbox v-model="form.sysMenuKeepAlive" :true-value="1" :false-value="0">keep-alive</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
