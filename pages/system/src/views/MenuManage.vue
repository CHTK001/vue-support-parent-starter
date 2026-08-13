<script setup lang="ts">
/**
 * 菜单管理页面
 *
 * 树形展示系统菜单（按钮/菜单/外链/iframe 四种类型），支持新增、编辑、删除。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Menu as MenuIcon, Plus, Edit, Delete, Refresh, Rank, Setting } from "@element-plus/icons-vue";
import Sortable from "sortablejs";
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default()));
import { listMenuTree, saveMenu, updateMenu, deleteMenu } from "../api/systemApi";
import type { SysMenu, SysMenuSettingVO } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

const list = ref<SysMenuSettingVO[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const form = ref<SysMenu>({});
const isEdit = ref(false);
const tableRef = ref();
const sortableRef = ref<any>(null);

const typeMap: Record<number, { label: string; type: string }> = {
  0: { label: "菜单", type: "primary" },
  1: { label: "iframe", type: "warning" },
  2: { label: "外链", type: "info" },
  3: { label: "按钮", type: "success" },
};

const menuTypeOptions = [
  { label: "菜单", value: 0 },
  { label: "iframe", value: 1 },
  { label: "外链", value: 2 },
  { label: "按钮", value: 3 },
];

async function loadList() {
  loading.value = true;
  try {
    const res = await listMenuTree();
    list.value = (res?.data ?? []) as SysMenuSettingVO[];
    await nextTick();
    initSortable();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "菜单列表加载失败");
  } finally {
    loading.value = false;
  }
}

/** 在 el-table 的 tbody 上挂载 sortablejs，实现同级菜单拖拽排序 */
function initSortable() {
  destroySortable();
  if (!tableRef.value) return;
  const tbody = tableRef.value?.$el?.querySelector?.(".el-table__body-wrapper tbody");
  if (!tbody) return;
  sortableRef.value = Sortable.create(tbody, {
    handle: ".re-menu-drag-handle",
    animation: 150,
    filter: ".el-table__placeholder, .el-table__indent",
    onEnd: async () => {
      // 拖拽结束后，基于当前 DOM 平铺顺序重建同父级排序号并保存
      await persistDomOrder();
    },
  });
}

/** 按当前 DOM 平铺顺序，为每个父级下的兄弟节点重排 sysMenuSort 并保存 */
async function persistDomOrder() {
  const flat = flattenTree(list.value as SysMenu[]);
  const groups = new Map<number, SysMenu[]>();
  flat.forEach((n) => {
    const pid = n.sysMenuPid ?? 0;
    const arr = groups.get(pid) ?? [];
    arr.push(n);
    groups.set(pid, arr);
  });
  const updates: SysMenu[] = [];
  groups.forEach((sibs) => {
    sibs.forEach((m, idx) => {
      const newSort = idx + 1;
      if ((m.sysMenuSort ?? 0) !== newSort) updates.push({ ...m, sysMenuSort: newSort });
    });
  });
  if (!updates.length) return;
  try {
    await Promise.all(updates.map((m) => updateMenu(m)));
    ElMessage.success("排序已保存");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "排序保存失败");
  } finally {
    loadList();
  }
}

function destroySortable() {
  sortableRef.value?.destroy();
  sortableRef.value = null;
}

/** 将树形菜单展开为平铺列表（用于按 DOM 顺序还原拖拽结果） */
function flattenTree(tree: SysMenu[]): SysMenu[] {
  const result: SysMenu[] = [];
  const walk = (nodes: SysMenu[]) => {
    nodes.forEach((n) => {
      result.push(n);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(tree);
  return result;
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

/** 同级兄弟节点（含自身），用于上移/下移排序 */
function siblingsOf(menu: SysMenu): SysMenu[] {
  const pid = menu.sysMenuPid ?? 0;
  return flattenTree(list.value as SysMenu[]).filter((n) => (n.sysMenuPid ?? 0) === pid);
}

/** 根据拖拽/按钮排序结果，重排兄弟节点并批量保存 sysMenuSort */
async function persistSort(ordered: SysMenu[]) {
  const changed = ordered.some((m, idx) => (m.sysMenuSort ?? 0) !== idx + 1);
  if (!changed) return;
  try {
    await Promise.all(ordered.map((m, idx) => updateMenu({ ...m, sysMenuSort: idx + 1 })));
    ElMessage.success("排序已保存");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "排序保存失败");
  } finally {
    loadList();
  }
}

async function handleMoveUp(row: Record<string, unknown>) {
  const menu = row as unknown as SysMenu;
  const sibs = siblingsOf(menu);
  const idx = sibs.findIndex((s) => s.sysMenuId === menu.sysMenuId);
  if (idx <= 0) return;
  [sibs[idx - 1], sibs[idx]] = [sibs[idx], sibs[idx - 1]];
  await persistSort(sibs);
}

async function handleMoveDown(row: Record<string, unknown>) {
  const menu = row as unknown as SysMenu;
  const sibs = siblingsOf(menu);
  const idx = sibs.findIndex((s) => s.sysMenuId === menu.sysMenuId);
  if (idx === -1 || idx >= sibs.length - 1) return;
  [sibs[idx], sibs[idx + 1]] = [sibs[idx + 1], sibs[idx]];
  await persistSort(sibs);
}

const columns: ReTableColumn[] = [
  { prop: "sysMenuIcon", label: "图标", width: 80, slot: "icon", align: "center" },
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
onBeforeUnmount(destroySortable);
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" add-text="新增顶级菜单" @add="handleAdd()">
        <div class="system-page__search"></div>
        <template #footer>
          <ReButton layout="modern" icon="Refresh" @click="loadList">刷新</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        :data="list"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        row-key="sysMenuId"
        :tree-props="{ children: 'children' }"
        :default-expand-all="false"
      >
        <template #icon="{ row }">
          <ReIcon v-if="row.sysMenuIcon" :name="row.sysMenuIcon" :size="18" class="text-[--el-color-primary]" />
          <span v-else class="text-xs text-[--el-text-color-placeholder]">-</span>
        </template>
        <template #title="{ row }">
          <div class="flex items-center gap-2">
            <ReIcon v-if="row.sysMenuIcon" :name="row.sysMenuIcon" :size="16" class="text-[--el-color-primary]" />
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
          <div class="flex items-center gap-1">
            <span class="re-menu-drag-handle" title="拖拽排序">
              <el-icon :size="14" class="cursor-grab text-[--el-text-color-secondary]"><Rank /></el-icon>
            </span>
            <ReButton layout="modern" link type="primary" icon="Plus" v-admin @click="handleAdd(row)">新增下级</ReButton>
            <ReButton layout="modern" link type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
            <ReButton layout="modern" link type="danger" icon="Delete" v-admin @click="handleDelete(row)">删除</ReButton>
          </div>
        </template>
      </ReTable>
    </el-card>

    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑菜单' : '新增菜单'"
      width="860"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <div class="menu-dialog__body">
        <el-form label-width="92px" :model="form" label-position="right">
          <div class="menu-dialog__section">
            <div class="menu-dialog__section-title">
              <el-icon class="mr-1"><MenuIcon /></el-icon>
              基础信息
            </div>
            <div class="menu-dialog__grid">
              <el-form-item label="菜单类型" required class="menu-dialog__full">
                <el-segmented v-model="form.sysMenuType" :options="menuTypeOptions" class="w-full" />
              </el-form-item>
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
              <el-form-item label="排序">
                <ReInputNumber layout="modern" v-model="form.sysMenuSort" :min="0" class="!w-full" />
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
              <el-form-item label="图标">
                <ReIconSelect v-model="form.sysMenuIcon" placeholder="选择菜单图标" />
              </el-form-item>
              <el-form-item label="组件" v-if="form.sysMenuType === 0">
                <ReInput layout="modern" v-model="form.sysMenuComponent" placeholder="如：system/user/index" />
              </el-form-item>
              <el-form-item label="权限标识">
                <ReInput layout="modern" v-model="form.sysMenuPerm" placeholder="如 sys:user:save" />
              </el-form-item>
              <el-form-item label="iframe/外链" v-if="form.sysMenuType === 1 || form.sysMenuType === 2" class="menu-dialog__full">
                <ReInput layout="modern" v-model="form.sysMenuFrameSrc" placeholder="iframe/外链地址" />
              </el-form-item>
            </div>
          </div>

          <div class="menu-dialog__section">
            <div class="menu-dialog__section-title">
              <el-icon class="mr-1"><Setting /></el-icon>
              显示设置
            </div>
            <div class="menu-dialog__switches">
              <ReSwitch layout="modern" title="隐藏" :model-value="form.sysMenuHidden === 1" @update:model-value="(v: boolean) => (form.sysMenuHidden = v ? 1 : 0)" />
              <ReSwitch layout="modern" title="标签栏隐藏" :model-value="form.sysMenuHiddenTag === 1" @update:model-value="(v: boolean) => (form.sysMenuHiddenTag = v ? 1 : 0)" />
              <ReSwitch layout="modern" title="固定标签" :model-value="form.sysMenuFixedTag === 1" @update:model-value="(v: boolean) => (form.sysMenuFixedTag = v ? 1 : 0)" />
              <ReSwitch layout="modern" title="keep-alive" :model-value="form.sysMenuKeepAlive === 1" @update:model-value="(v: boolean) => (form.sysMenuKeepAlive = v ? 1 : 0)" />
            </div>
          </div>
        </el-form>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.menu-dialog__body {
  padding: 4px 8px 0;
}
.menu-dialog__section {
  margin-bottom: 18px;
}
.menu-dialog__section-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.menu-dialog__section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  margin-left: 10px;
  background: var(--el-border-color-extra-light);
}
.menu-dialog__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 18px;
}
.menu-dialog__full {
  grid-column: 1 / -1;
}
.menu-dialog__switches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 28px;
  padding: 4px 0 2px;
}
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
