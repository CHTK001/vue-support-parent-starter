<script setup lang="ts">
import { reactive, ref, nextTick, computed, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Menu from "@iconify-icons/ep/menu";
import Refresh from "@iconify-icons/line-md/backup-restore";
import { transformI18n } from "@/plugins/i18n";
import Edit from "@iconify-icons/line-md/plus";
import Close from "@iconify-icons/ep/close";
import Check from "@iconify-icons/ep/check";
import {
  fetchPageRole,
  fetchUpdateRole,
  fetchDeleteRole,
  fetchUpdateRoleMenu,
  fetchGetRoleMenu
} from "@/api/role";
import { fetchListMenu } from "@/api/menu";
import { message } from "@/utils/message";
import { useI18n } from "vue-i18n";
import { delay, subBefore, useResizeObserver } from "@pureadmin/utils";
const { t } = useI18n();
const form = reactive({
  sysRoleName: "",
  SysRoleCode: ""
});

const iconClass = computed(() => {
  return [
    "w-[22px]",
    "h-[22px]",
    "flex",
    "justify-center",
    "items-center",
    "outline-none",
    "rounded-[4px]",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]"
  ];
});
const treeProps = {
  value: "sysMenuId",
  label: "sysMenuTitle",
  children: "children"
};
const visible = reactive({
  save: false,
  role: false
});

const loading = reactive({
  query: false,
  menu: false
});
const formRef = ref();
const table = ref(null);
const saveDialog = ref(null);
const resetForm = async formRef => {
  formRef.resetFields();
  onSearch();
};
const onSearch = async () => {
  table.value.reload(form);
};

const saveDialogParams = reactive({
  mode: "save"
});

const onDelete = async (row, index) => {
  try {
    const { code } = await fetchDeleteRole(row.sysRoleId);
    if (code == "00000") {
      table.value.reload();
      message(t("message.deleteSuccess"), { type: "success" });
      return;
    }
  } catch (error) {}
};

const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setData(item).open(mode);
};

const dialogClose = async () => {
  visible.save = false;
};

const curRow = ref(null);
const treeData = reactive([]);
const treeHeight = ref();
const contentRef = ref();
const treeRef = ref();

const currentRoleMenuIds = reactive([]);
const refreshMenu = async () => {
  loading.menu = true;
  treeData.length = 0;
  currentRoleMenuIds.length = 0;
  const { data } = await fetchGetRoleMenu({ roleId: curRow.value.sysRoleId });
  currentRoleMenuIds.push(...data);
  fetchListMenu({})
    .then(res => {
      const { data, code } = res;
      treeData.push(...data);
      return;
    })
    .catch(error => {
      message(t("message.queryFailed"), { type: "error" });
    })
    .finally(() => {
      loading.menu = false;
    });
};
const drawOpen = async row => {
  visible.role = true;
  curRow.value = row;
  await nextTick();
  refreshMenu();
};

const drawClose = async () => {
  visible.role = false;
  curRow.value = null;
  treeData.length = 0;
  await nextTick();
};

const filterMethod = (query: string, node) => {
  return transformI18n(node.title)!.includes(query);
};

const handleSave = async () => {
  let checkedNodes = treeRef.value.getCheckedNodes();
  console.log(checkedNodes);
  const { data, code } = await fetchUpdateRoleMenu({
    roleId: curRow.value.sysRoleId,
    menuId: checkedNodes.map(item => item.sysMenuId)
  });
  if (code == "00000") {
    message(t("message.updateSuccess"), { type: "success" });
    return;
  }
};

const isLinkage = ref(false);
</script>

<template>
  <div>
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />
    <div class="main">
      <el-container>
        <el-header>
          <div class="left-panel">
            <el-form
              ref="formRef"
              :inline="true"
              :model="form"
              class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto"
            >
              <el-form-item label="角色名称" prop="sysRoleName">
                <el-input
                  v-model="form.sysRoleName"
                  placeholder="请输入角色名称"
                  clearable
                  class="!w-[180px]"
                />
              </el-form-item>
              <el-form-item label="角色编码" prop="SysRoleCode">
                <el-input
                  v-model="form.SysRoleCode"
                  placeholder="请输入角色编码"
                  clearable
                  class="!w-[180px]"
                />
              </el-form-item>
            </el-form>
          </div>
          <div class="right-panel">
            <div class="right-panel-search">
              <el-button
                type="primary"
                :icon="useRenderIcon('ri:search-line')"
                :loading="loading.query"
                @click="onSearch"
              />
              <el-button
                :icon="useRenderIcon(Refresh)"
                @click="resetForm(formRef)"
              />
              <el-button
                :icon="useRenderIcon(Edit)"
                @click="dialogOpen({}, 'save')"
              />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div
              :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'"
              style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <ScTable ref="table" :url="fetchPageRole" border size="small">
                <el-table-column label="角色名称" prop="sysRoleName" />
                <el-table-column label="角色编码" prop="sysRoleCode" />
                <el-table-column label="系统角色" prop="sysRoleInSystem">
                  <template #default="{ row }">
                    <el-tag>{{
                      row.sysRoleInSystem == 1 ? "是" : "否"
                    }}</el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="备注" prop="sysRoleRemark" />
                <el-table-column label="操作" fixed="right">
                  <template #default="{ row, $index }">
                    <el-button
                      size="small"
                      plain
                      link
                      type="primary"
                      :icon="useRenderIcon(EditPen)"
                      @click="dialogOpen(row, 'edit')"
                      >编辑</el-button
                    >
                    <el-popconfirm
                      title="确定删除吗？"
                      @confirm="onDelete(row, $index)"
                    >
                      <template #reference>
                        <el-button
                          v-if="!row.sysRoleInSystem"
                          size="small"
                          type="danger"
                          plain
                          link
                          :icon="useRenderIcon(Delete)"
                          >删除</el-button
                        >
                      </template>
                    </el-popconfirm>
                    <el-button
                      size="small"
                      plain
                      link
                      type="primary"
                      :icon="useRenderIcon(Menu)"
                      @click="drawOpen(row)"
                      >权限</el-button
                    >
                  </template>
                </el-table-column>
              </ScTable>
            </div>
            <div
              v-if="visible.role"
              class="h-full !min-w-[calc(100vw-60vw-368px)] w-full mt-2 px-2 pb-2 bg-bg_color ml-2 overflow-auto"
              style="border: 1px solid #eee; margin: 0; margin-left: 10px"
            >
              <div class="flex justify-between w-full px-3 pt-5 pb-4">
                <div class="flex">
                  <span :class="iconClass">
                    <IconifyIconOffline
                      v-tippy="{
                        content: '关闭'
                      }"
                      class="dark:text-white"
                      width="18px"
                      height="18px"
                      :icon="Close"
                      @click="drawClose"
                    />
                  </span>
                  <span :class="[iconClass, 'ml-2']">
                    <IconifyIconOffline
                      v-tippy="{
                        content: '保存菜单权限'
                      }"
                      class="dark:text-white"
                      width="18px"
                      height="18px"
                      :icon="Check"
                      @click="handleSave"
                    />
                  </span>
                  <span :class="[iconClass, 'ml-2']">
                    <IconifyIconOffline
                      v-tippy="{
                        content: '刷新菜单权限'
                      }"
                      class="dark:text-white"
                      width="18px"
                      height="18px"
                      :icon="Refresh"
                      @click="refreshMenu"
                    />
                  </span>
                </div>
                <p class="font-bold truncate">
                  菜单权限
                  {{ `${curRow?.name ? `（${curRow.name}）` : ""}` }}
                </p>
              </div>

              <el-skeleton v-if="loading.menu" animated />
              <el-tree-v2
                v-else
                ref="treeRef"
                :default-checked-keys="currentRoleMenuIds"
                show-checkbox
                :data="treeData"
                :props="treeProps"
                :height="treeHeight"
                :check-strictly="isLinkage"
                :filter-method="filterMethod"
              >
                <template #default="{ node }">
                  <span>{{ transformI18n(node.label) }}</span>
                </template>
              </el-tree-v2>
            </div>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
