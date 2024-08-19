<script setup lang="ts">
import { h, reactive, ref, nextTick, toRaw } from "vue";

import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";

import { fetchDeleteMenu, fetchListMenu, Menu } from "@/api/menu";
import { message } from "@/utils/message";
import { useI18n } from "vue-i18n";
import { transformI18n } from "@/plugins/i18n";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

const { t } = useI18n();
const form = reactive({});

const visible = reactive({
  save: false
});

const loading = reactive({
  query: false
});
const formRef = ref();
const table = ref(null);
const saveDialog = ref(null);
const resetForm = async formRef => {
  formRef.resetFields();
  onSearch();
};

const tableData = reactive([]);

const doChange = async (data, form) => {
  if (!data) {
    return;
  }
  const item = data.filter(item => item.sysMenuId === form.sysMenuId);
  if (null != item && item.length > 0) {
    Object.assign(item[0], form);
    return true;
  }
  for (var i = 0; i < data.length; i++) {
    if (doChange(data[i]?.children, form)) {
      break;
    }
  }
  return true;
};
const onSuccess = async (mode, form) => {
  if (mode == "edit") {
    const item = tableData.filter(item => item.sysMenuId === form.sysMenuId);
    if (null != item && item.length > 0) {
      Object.assign(item[0], form);
      return;
    }
    for (var i = 0; i < tableData.length; i++) {
      if (doChange(tableData[i]?.children, form)) {
        break;
      }
    }

    return;
  }
  onSearch();
};
const onSearch = async () => {
  loading.query = true;
  tableData.length = 0;
  fetchListMenu(form)
    .then(res => {
      const { data, code } = res;
      tableData.push(...data);
      return;
    })
    .catch(error => {
      message(t("message.queryFailed"), { type: "error" });
    })
    .finally(() => {
      loading.query = false;
    });
};

onSearch();

const getOpenDetail = async (row, column, event) => {
  if (row.children && column.label != "操作") {
    if (event.currentTarget.querySelector(".el-table__expand-icon")) {
      event.currentTarget.querySelector(".el-table__expand-icon").click();
    }
  }
};

const saveDialogParams = reactive({
  mode: "save"
});

const onDelete = async row => {
  try {
    const { code } = await fetchDeleteMenu(row.sysMenuId);
    onSearch();
    message(t("message.deleteSuccess"), { type: "success" });
    return;
  } catch (error) {}
};

const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setTableData(tableData).setData(item).open(mode);
};

const dialogClose = async () => {
  visible.save = false;
};
</script>

<template>
  <div>
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSuccess"
      @close="dialogClose"
    />
    <div class="main">
      <el-container>
        <el-header>
          <div class="left-panel" />
          <div class="right-panel">
            <div class="right-panel-search">
              <el-button
                type="primary"
                :icon="useRenderIcon('ri:search-line')"
                :loading="loading.query"
                @click="onSearch"
              />
              <el-button
                :icon="useRenderIcon(Edit)"
                @click="dialogOpen({}, 'save')"
              />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div class="h-full">
            <el-skeleton v-if="loading.query" animated :count="6" />
            <el-table
              v-else
              :data="tableData"
              style="width: 100%; margin-bottom: 20px"
              row-key="sysMenuId"
              border
              @row-click="getOpenDetail"
            >
              <el-table-column prop="sysMenuTitle" label="菜单名称">
                <template #default="{ row }">
                  <span class="inline-block mr-1">
                    <component
                      :is="useRenderIcon(toRaw(row.sysMenuIcon))"
                      style="padding-top: 1px"
                    />
                  </span>
                  <span>{{ transformI18n(row.sysMenuTitle) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="sysMenuType" label="菜单类型">
                <template #default="{ row }">
                  <el-tag
                    v-if="row.sysMenuType == 0"
                    size="small"
                    type="primary"
                    effect="plain"
                    class="inline-block mr-2 p-8"
                    >菜单</el-tag
                  >
                </template>
              </el-table-column>
              <el-table-column prop="sysMenuPath" label="路由路径" />
              <el-table-column prop="sysMenuComponent" label="组件路径" />
              <el-table-column prop="sysMenuSort" label="排序" />
              <el-table-column prop="sysMenuHidden" label="隐藏">
                <template #default="{ row }">
                  {{ row.sysMenuHidden ? "是" : "否" }}
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="{ row }">
                  <el-button
                    size="small"
                    plain
                    link
                    type="primary"
                    :icon="useRenderIcon(EditPen)"
                    @click="dialogOpen(row, 'edit')"
                    >编辑</el-button
                  >
                  <el-button
                    size="small"
                    plain
                    link
                    type="primary"
                    :icon="useRenderIcon(Edit)"
                    @click="
                      dialogOpen({ sysMenuPid: row.sysMenuId } as any, 'save')
                    "
                    >新增</el-button
                  >
                  <el-popconfirm title="确定删除吗？" @confirm="onDelete(row)">
                    <template #reference>
                      <el-button
                        size="small"
                        type="danger"
                        plain
                        link
                        :icon="useRenderIcon(Delete)"
                        >删除</el-button
                      >
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
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
