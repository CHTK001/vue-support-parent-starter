<script setup lang="ts">
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScSearch from "@repo/components/ScSearch/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import {
  fetchDeleteDictItem,
  fetchPageDictItem,
  fetchUpdateDictItem,
} from "@repo/core";
import { message } from "@repo/utils";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import DictLayout from "./components/layout.vue";
const SettingDialog = defineAsyncComponent(
  () => import("./components/itemProperty.vue")
);
const SaveDialog = defineAsyncComponent(
  () => import("./components/saveItem.vue")
);
const saveDialog = ref(null);
const tableRef = ref(null);
const settingDialogRef = ref(null);
const params = reactive({
  sysDictId: null,
});

const { t } = useI18n();
const onClick = (data) => {
  params.sysDictId = data.sysDictId;
  onSearch(params);
};

const columns = reactive([]);

const onSearch = (query) => {
  const newParams = {};
  Object.assign(newParams, params);
  Object.assign(newParams, query);
  tableRef.value?.reload(newParams);
};

const doUpdate = async (row) => {
  fetchUpdateDictItem(row);
};

const onDelete = async (row) => {
  await fetchDeleteDictItem(row.sysDictItemId).then((res) => {
    if (res.code == "00000") {
      tableRef.value.reload(params);
      message(t("message.deleteSuccess"), { type: "success" });
      return;
    }
  });
};

const visible = reactive({
  save: false,
});
const saveDialogParams = reactive({
  mode: "save",
});

const handleSetting = async (item) => {
  settingDialogRef.value.handleOpen(item, "edit");
};
const dialogOpen = async (item, mode) => {
  visible.save = true;
  item.sysDictId = params.sysDictId;
  await nextTick();
  saveDialog.value.setData(item).open(mode);
};

const dialogClose = () => {
  visible.save = false;
};
</script>
<template>
  <div class="dict-page h-full">
    <SaveDialog
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />
    <SettingDialog
      ref="settingDialogRef"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />
    <el-container class="dict-container">
      <el-aside width="320px" class="dict-aside">
        <div class="aside-header">
          <div class="aside-title">
            <el-icon class="aside-icon"
              ><component :is="useRenderIcon('ri:book-2-line')"
            /></el-icon>
            <span>字典分类</span>
          </div>
        </div>
        <DictLayout :nodeClick="onClick" />
      </el-aside>
      <el-main class="dict-main">
        <el-container>
          <el-header class="dict-header">
            <scSearch
              :columns="columns"
              :onSearch="onSearch"
              :show-number="4"
              :onEdit="dialogOpen"
            />
          </el-header>
          <el-main class="dict-content">
            <scTable
              v-if="params.sysDictId"
              ref="tableRef"
              border
              :url="fetchPageDictItem"
              :params="params"
              :row-key="'sysDictItemId'"
            >
              <el-table-column
                label="序号"
                type="index"
                align="center"
                fixed
                width="60px"
              />
              <el-table-column
                prop="sysDictItemName"
                label="字典项名称"
                align="center"
                fixed
                min-width="100px"
              >
                <template #default="{ row }">
                  <div class="flex flex-1 justify-between">
                    <el-tag
                      class="flex-col"
                      :type="row.sysDictItemType"
                      effect="dark"
                      style="margin-right: 5px"
                    >
                      {{ row.sysDictItemName }}
                    </el-tag>
                    <span
                      class="flex-col justify-start"
                      style="
                        float: right;
                        color: var(--app-text-secondary);
                        font-size: 11px;
                      "
                    >
                      <span>{{ row.sysDictItemCode }}</span>
                      <el-divider
                        v-if="row.sysDictItemIcon"
                        direction="vertical"
                      />
                      <el-icon v-if="row.sysDictItemIcon" class="top-[1px]">
                        <component :is="useRenderIcon(row.sysDictItemIcon)" />
                      </el-icon>
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="sysDictItemI18n"
                label="字典项i18n"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag
                    v-if="row.sysDictItemI18n"
                    :type="row.sysDictItemType"
                    effect="dark"
                    size="small"
                    style="margin-right: 5px"
                  >
                    {{ row.sysDictItemI18n }}
                  </el-tag>
                  <span v-else>/</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="sysDictItemStatus"
                label="状态"
                align="center"
              >
                <template #default="{ row }">
                  <ScSwitch
                    v-model="row.sysDictItemStatus"
                    :active-value="1"
                    :inactive-value="0"
                    layout="modern"
                    @click="doUpdate(row)"
                  />
                </template>
              </el-table-column>
              <el-table-column
                prop="sysDictItemSort"
                label="排序"
                align="center"
                width="60px"
              />
              <el-table-column
                prop="sysDictItemRemark"
                label="字典项备注"
                align="center"
              >
                <template #default="{ row }">
                  {{ row.sysDictItemRemark || "/" }}
                </template>
              </el-table-column>
              <el-table-column label="操作" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button
                    class="btn-text"
                    :icon="useRenderIcon('ep:setting')"
                    @click="handleSetting(row)"
                  ></el-button>
                  <el-button
                    class="btn-text"
                    :icon="useRenderIcon(EditPen)"
                    @click="dialogOpen(row, 'edit')"
                  ></el-button>
                  <el-popconfirm
                    v-if="row.sysSettingInSystem != 1"
                    :title="$t('message.confimDelete')"
                    @confirm="onDelete(row)"
                  >
                    <template #reference>
                      <el-button
                        type="danger"
                        class="btn-text"
                        :icon="useRenderIcon(Delete)"
                      ></el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </scTable>
            <el-empty v-else />
          </el-main>
        </el-container>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.dict-page {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
}

.dict-container {
  height: 100%;
  background-color: var(--el-bg-color);
}

.dict-aside {
  background-color: var(--el-bg-color-overlay);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
  }
}

.aside-header {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-overlay) 100%
  );
}

.aside-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.aside-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.dict-main {
  padding: 0;
  background-color: var(--el-bg-color);
}

.dict-header {
  height: auto !important;
  padding: 16px 20px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
}

.dict-content {
  padding: 20px;
  background-color: var(--el-bg-color);
}

:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: var(--el-fill-color-light) !important;
    font-weight: 600;
  }

  .el-table__row {
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.btn-text) {
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

:deep(.el-empty) {
  padding: 60px 0;

  .el-empty__description {
    color: var(--el-text-color-secondary);
  }
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
