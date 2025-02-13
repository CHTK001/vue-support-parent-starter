<script setup lang="ts">
import { nextTick, reactive, ref, toRaw } from "vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Edit from "@iconify-icons/line-md/plus";
import SaveDialog from "./save.vue";

import { fetchDeleteMenu, fetchListMenu } from "@/api/manage/menu";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const form = reactive({});

const visible = reactive({
  save: false,
});

const loading = reactive({
  query: false,
});
const formRef = ref();
const table = ref(null);
const saveDialog = ref(null);
const resetForm = async (formRef) => {
  formRef.resetFields();
  onSearch();
};

const tableData = ref([]);

const doChange = async (data, form) => {
  if (!data) {
    return;
  }
  const item = data.filter((item) => item.sysMenuId === form.sysMenuId);
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
    const item = tableData.value.filter((item) => item.sysMenuId === form.sysMenuId);
    if (null != item && item.length > 0) {
      Object.assign(item[0], form);
      return;
    }
    for (var i = 0; i < tableData.value.length; i++) {
      if (doChange(tableData[i]?.children, form)) {
        break;
      }
    }

    return;
  }
  onSearch();
};
const onSearch = debounce(
  async () => {
    loading.query = true;
    fetchListMenu(form)
      .then((res) => {
        const { data, code } = res;
        tableData.value = data;
        return;
      })
      .catch((error) => {
        message(t("message.queryFailed"), { type: "error" });
      })
      .finally(() => {
        loading.query = false;
      });
  },
  1000,
  true
);

onSearch();

const getOpenDetail = async (row, column, event) => {
  if (row.children && column.label != "操作") {
    if (event.currentTarget.querySelector(".el-table__expand-icon")) {
      event.currentTarget.querySelector(".el-table__expand-icon").click();
    }
  }
};

const saveDialogParams = reactive({
  mode: "save",
});

const onDelete = async (row) => {
  try {
    const { code } = await fetchDeleteMenu(row.sysMenuId);
    onSearch();
    message(t("message.deleteSuccess"), { type: "success" });
    return;
  } catch (error) { }
};

const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setTableData(tableData.value).setData(item).open(mode);
};

const dialogClose = async () => {
  visible.save = false;
};
</script>

<template>
  <div>
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSuccess"
      @close="dialogClose" />
    <div class="main">
      <el-container>
        <el-header>
          <div class="left-panel" />
          <div class="right-panel">
            <div class="right-panel-search">
              <el-button type="primary" :icon="useRenderIcon('ri:refresh-line')" :loading="loading.query"
                @click="onSearch" />
              <el-button :icon="useRenderIcon('ep:plus')" @click="
                dialogOpen(
                  {
                    sysMenuType: 0,
                  },
                  'save'
                )
                " />
            </div>
          </div>
        </el-header>
        <el-main class="overflow-hidden nopadding">
          <div class="h-full overflow-hidden">
            <el-skeleton v-if="loading.query" animated :count="6" />
            <el-table v-else :data="tableData" style="width: 100%; margin-bottom: 20px" row-key="sysMenuId" border
              @row-click="getOpenDetail">
              <el-table-column prop="sysMenuTitle" label="菜单名称" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="inline-block mr-1">
                    <component :is="useRenderIcon(toRaw(row.sysMenuIcon))" style="padding-top: 1px" />
                  </span>
                  <span v-if="row.sysMenuType !== 3">
                    {{ transformI18n(row.sysMenuI18n || row.sysMenuTitle) }}
                  </span>
                  <span v-else>
                    {{ transformI18n(row.sysMenuI18n || row.sysMenuTitle) }}
                    <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                      {{ row.sysMenuPerm }}
                    </span>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="sysMenuType" label="菜单类型" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag v-if="row.sysMenuType == 0" size="small" type="primary" effect="plain"
                    class="inline-block mr-2 p-8">菜单</el-tag>
                  <el-tag v-else-if="row.sysMenuType == 1" size="small" type="warning" effect="plain"
                    class="inline-block mr-2 p-8">iframe</el-tag>
                  <el-tag v-else-if="row.sysMenuType == 2" size="small" type="danger" effect="plain"
                    class="inline-block mr-2 p-8">外链</el-tag>
                  <el-tag v-else-if="row.sysMenuType == 3" size="small" type="info" effect="plain"
                    class="inline-block mr-2 p-8">按钮</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sysMenuPath" label="路由名称" show-overflow-tooltip>
                <template #default="{ row }">
                  <span>
                    {{ row.sysMenuName || "-" }}
                    <el-icon v-if="row.sysMenuName" size="10px" color="blue" class="cursor-pointer">
                      <component v-copy:click="row.sysMenuName" :is="useRenderIcon('ep:copy-document')" />
                    </el-icon>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="sysMenuPath" label="路由路径" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.sysMenuPath || "-" }}
                </template>
              </el-table-column>
              <el-table-column prop="sysMenuComponent" label="组件路径" show-overflow-tooltip min-width="100px">
                <template #default="{ row }">
                  {{ row.sysMenuComponent || "-" }}
                </template>
              </el-table-column>
              <el-table-column prop="sysMenuSort" label="排序" width="100px" />
              <el-table-column prop="sysMenuHidden" label="隐藏" width="100px">
                <template #default="{ row }">
                  <el-tag type="danger" v-if="row.sysMenuHidden">
                    是
                  </el-tag>
                  <el-tag type="primary" v-else>
                    否
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160px">
                <template #default="{ row }">
                  <el-button class="btn-text" :icon="useRenderIcon(EditPen)"
                    @click="dialogOpen(row, 'edit')"></el-button>
                  <el-button class="btn-text" :icon="useRenderIcon(Edit)" @click="
                    dialogOpen(
                      {
                        sysMenuPid: row.sysMenuId,
                        sysMenuType: 0,
                      },
                      'save'
                    )
                    ">
                  </el-button>
                  <el-popconfirm :title="$t('message.confimDelete')" @confirm="onDelete(row)">
                    <template #reference>
                      <el-button class="btn-text" type="danger" :icon="useRenderIcon(Delete)"></el-button>
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
