<script setup lang="ts">
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScSearch from "@repo/components/ScSearch/index.vue";
import { fetchDeleteDictItem, fetchPageDictItem, fetchUpdateDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import DictLayout from "./layout.vue";
const SettingDialog = defineAsyncComponent(() => import("./itemProperty.vue"));
const SaveDialog = defineAsyncComponent(() => import("./saveItem.vue"));
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
  <div class="h-full">
    <SaveDialog ref="saveDialog" :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />
    <SettingDialog ref="settingDialogRef" :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />
    <el-container>
      <el-aside width="300px">
        <DictLayout :nodeClick="onClick" />
      </el-aside>
      <el-main class="nopadding">
        <el-container>
          <el-header class="h-[70px]">
            <scSearch :columns="columns" :onSearch="onSearch" :show-number="4" :onEdit="dialogOpen" />
          </el-header>
          <el-main>
            <scTable v-if="params.sysDictId" ref="tableRef" border :url="fetchPageDictItem" :params="params"
              :row-key="'sysDictItemId'">
              <el-table-column label="序号" type="index" align="center" fixed width="60px" />
              <el-table-column prop="sysDictItemName" label="字典项名称" align="center" fixed min-width="100px">
                <template #default="{ row }">
                  <div class="flex flex-1 justify-between">
                    <el-tag class="flex-col" :type="row.sysDictItemType" effect="dark" style="margin-right: 5px">
                      {{ row.sysDictItemName }}
                    </el-tag>
                    <span class="flex-col justify-start"
                      style="float: right; color: var(--el-text-color-secondary); font-size: 11px">
                      <span>{{ row.sysDictItemCode }}</span>
                      <el-divider v-if="row.sysDictItemIcon" direction="vertical" />
                      <el-icon v-if="row.sysDictItemIcon" class="top-[1px]">
                        <component :is="useRenderIcon(row.sysDictItemIcon)" />
                      </el-icon>
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="sysDictItemI18n" label="字典项i18n" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.sysDictItemI18n" :type="row.sysDictItemType" effect="dark" size="small"
                    style="margin-right: 5px">
                    {{ row.sysDictItemI18n }}
                  </el-tag>
                  <span v-else>/</span>
                </template>
              </el-table-column>
              <el-table-column prop="sysDictItemStatus" label="状态" align="center">
                <template #default="{ row }">
                  <el-switch v-model="row.sysDictItemStatus" :active-value="1" :inactive-value="0"
                    @click="doUpdate(row)" />
                  <!-- <el-tag :type="!row.sysDictItemStatus || row.sysDictItemStatus == 1 ? 'success' : 'danger'" effect="dark" size="small">
                  {{ !row.sysDictItemStatus || row.sysDictItemStatus == 1 ? "启用" : "禁用" }}
                </el-tag> -->
                </template>
              </el-table-column>
              <el-table-column prop="sysDictItemSort" label="排序" align="center" width="60px" />
              <el-table-column prop="sysDictItemRemark" label="字典项备注" align="center">
                <template #default="{ row }">
                  {{ row.sysDictItemRemark || "/" }}
                </template>
              </el-table-column>
              <el-table-column label="操作" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button class="btn-text" :icon="useRenderIcon('ep:setting')"
                    @click="handleSetting(row)"></el-button>
                  <el-button class="btn-text" :icon="useRenderIcon(EditPen)"
                    @click="dialogOpen(row, 'edit')"></el-button>
                  <el-popconfirm v-if="row.sysSettingInSystem != 1" :title="$t('message.confimDelete')"
                    @confirm="onDelete(row)">
                    <template #reference>
                      <el-button type="danger" class="btn-text" :icon="useRenderIcon(Delete)"></el-button>
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
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
