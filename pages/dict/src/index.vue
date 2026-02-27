<script setup lang="ts">
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
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
  <div class="dict-page system-container modern-bg">
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
            <ScIcon class="aside-icon"
              ><component :is="useRenderIcon('ri:book-2-line')"
            /></ScIcon>
            <span>字典分类</span>
          </div>
        </div>
        <DictLayout :nodeClick="onClick" />
      </el-aside>
      <el-main class="dict-main">
        <el-container>
          <el-header class="dict-header" v-if="params.sysDictId">
            <div class="toolbar-left">
              <!-- 过滤条件区域 -->
            </div>
            <div class="toolbar-right">
              <ScButton 
                v-auth="'dict:list'"
                size="small"
                @click="onSearch({})"
              >
                <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                刷新
              </ScButton>
              <ScButton 
                v-auth="'dict:add'"
                type="primary"
                size="small"
                @click="dialogOpen({}, 'save')"
              >
                <IconifyIconOnline icon="ri:add-line" class="mr-1" />
                新增
              </ScButton>
            </div>
          </el-header>
          <el-main class="dict-content thin-scroller">
            <scTable
              v-if="params.sysDictId"
              ref="tableRef"
              border
              :url="fetchPageDictItem"
              :params="params"
              :row-key="'sysDictItemId'"
            >
              <ScTableColumn 
                label="序号"
                type="index"
                align="center"
                fixed
                width="60px"
              />
              <ScTableColumn 
                prop="sysDictItemName"
                label="字典项名称"
                align="center"
                fixed
                min-width="100px"
              >
                <template #default="{ row }">
                  <div class="flex flex-1 justify-between">
                    <ScTag 
                      class="flex-col"
                      :type="row.sysDictItemType"
                      effect="dark"
                      style="margin-right: 5px"
                    >
                      {{ row.sysDictItemName }}
                    </ScTag>
                    <span
                      class="flex-col justify-start"
                      style="
                        float: right;
                        color: var(--app-text-secondary);
                        font-size: 11px;
                      "
                    >
                      <span>{{ row.sysDictItemCode }}</span>
                      <ScDivider 
                        v-if="row.sysDictItemIcon"
                        direction="vertical"
                      />
                      <ScIcon v-if="row.sysDictItemIcon" class="top-[1px]">
                        <component :is="useRenderIcon(row.sysDictItemIcon)" />
                      </ScIcon>
                    </span>
                  </div>
                </template>
              </ScTableColumn>
              <ScTableColumn 
                prop="sysDictItemI18n"
                label="字典项i18n"
                align="center"
              >
                <template #default="{ row }">
                  <ScTag 
                    v-if="row.sysDictItemI18n"
                    :type="row.sysDictItemType"
                    effect="dark"
                    size="small"
                    style="margin-right: 5px"
                  >
                    {{ row.sysDictItemI18n }}
                  </ScTag>
                  <span v-else class="null-value">NULL</span>
                </template>
              </ScTableColumn>
              <ScTableColumn 
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
              </ScTableColumn>
              <ScTableColumn 
                prop="sysDictItemSort"
                label="排序"
                align="center"
                width="60px"
              />
              <ScTableColumn 
                prop="sysDictItemRemark"
                label="字典项备注"
                align="center"
              >
                <template #default="{ row }">
                  <span v-if="row.sysDictItemRemark">{{
                    row.sysDictItemRemark
                  }}</span>
                  <span v-else class="null-value">NULL</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="操作" fixed="right" align="center">
                <template #default="{ row }">
                  <ScButton 
                    v-auth="'dict:setting'"
                    class="btn-text"
                    :icon="useRenderIcon('ep:setting')"
                    @click="handleSetting(row)"
                  ></ScButton>
                  <ScButton 
                    v-auth="'dict:edit'"
                    class="btn-text"
                    :icon="useRenderIcon(EditPen)"
                    @click="dialogOpen(row, 'edit')"
                  ></ScButton>
                  <ScPopconfirm 
                    v-if="row.sysSettingInSystem != 1"
                    :title="$t('message.confimDelete')"
                    @confirm="onDelete(row)"
                  >
                    <template #reference>
                      <ScButton 
                        v-auth="'dict:delete'"
                        type="danger"
                        class="btn-text"
                        :icon="useRenderIcon(Delete)"
                      ></ScButton>
                    </template>
                  </ScPopconfirm>
                </template>
              </ScTableColumn>
            </scTable>
            <ScEmpty v-else />
          </el-main>
        </el-container>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.dict-page {
  display: flex;
  flex-direction: column;
  min-height: 640px;
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  color: var(--app-text-primary);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.dict-container {
  height: 100%;
  background-color: transparent;
}

.dict-aside {
  background: linear-gradient(
    180deg,
    var(--el-bg-color-overlay) 0%,
    var(--el-bg-color) 100%
  );
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(var(--el-color-primary-rgb), 0.1),
      transparent
    );
  }

  &:hover {
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.06);
  }
}

.aside-header {
  padding: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-overlay) 100%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      circle,
      rgba(var(--el-color-primary-rgb), 0.08) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
}

.aside-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  position: relative;
  z-index: 1;
}

.aside-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--el-color-primary);
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-8) 0%,
    var(--el-color-primary-light-9) 100%
  );
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}

.dict-main {
  padding: 0;
  background-color: transparent;
}

.dict-header {
  height: 48px !important;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .toolbar-left {
    display: flex;
    gap: 8px;
  }

  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.dict-content {
  padding: 16px;
  background-color: var(--el-bg-color);
}

:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--el-border-color-lighter);

  th {
    background: linear-gradient(
      180deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color-lighter) 100%
    ) !important;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 2px solid var(--el-border-color-lighter) !important;
  }

  .el-table__row {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: linear-gradient(
        90deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-bg-color) 100%
      ) !important;

      td {
        border-color: var(--el-color-primary-light-8) !important;
      }
    }
  }
}

:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 500;
  padding: 4px 12px;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* 空值样式 */
.null-value {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  font-style: italic;
  opacity: 0.7;
}

:deep(.btn-text) {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: scale(1.1) translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

:deep(.el-empty) {
  padding: 80px 0;

  .el-empty__image {
    opacity: 0.6;
  }

  .el-empty__description {
    color: var(--el-text-color-secondary);
    font-size: 15px;
  }
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
