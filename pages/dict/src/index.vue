<script setup lang="ts">
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import { defineAsyncComponent, reactive, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScDivider from "@repo/components/ScDivider/index";
import {
  fetchDeleteDictItem,
  fetchPageDictItem,
  fetchUpdateDictItem,
} from "@repo/core";
import { message } from "@repo/utils";
import DictLayout from "./components/layout.vue";

const SettingDialog = defineAsyncComponent(
  () => import("./components/ItemProperty.vue"),
);
const SaveDialog = defineAsyncComponent(
  () => import("./components/SaveItem.vue"),
);

const tableRef = ref(null);
const settingDialogRef = ref(null);

const params = reactive({
  sysDictId: null as number | null,
});

const itemDialog = reactive({
  visible: false,
  mode: "save" as "save" | "edit",
  data: {} as Record<string, any>,
});

const reloadTable = (query: Record<string, any> = {}) => {
  if (!params.sysDictId) {
    return;
  }
  tableRef.value?.reload({
    ...params,
    ...query,
  });
};

const onClick = (data?: Record<string, any>) => {
  params.sysDictId = data?.sysDictId ?? null;
  reloadTable();
};

const doUpdate = async (row: Record<string, any>) => {
  try {
    const res = await fetchUpdateDictItem(row);
    if (
      !(res && typeof res === "object" && "code" in res && res.code === "00000")
    ) {
      message.error(
        res && typeof res === "object" && "msg" in res
          ? (res.msg as string) || "状态更新失败"
          : "状态更新失败",
      );
      reloadTable();
    }
  } catch {
    message.error("状态更新失败");
    reloadTable();
  }
};

const onDelete = async (row: Record<string, any>) => {
  try {
    const res = await fetchDeleteDictItem(row.sysDictItemId);
    if (res?.code === "00000") {
      reloadTable();
      message.success("删除成功");
      return;
    }
    message.error(res?.msg || "删除失败");
  } catch {
    message.error("删除失败");
  }
};

const handleSetting = (item: Record<string, any>) => {
  settingDialogRef.value?.handleOpen(item, "edit");
};

const dialogOpen = (item: Record<string, any> = {}, mode: "save" | "edit") => {
  if (!params.sysDictId) {
    message.warning("请先选择字典分类");
    return;
  }
  itemDialog.mode = mode;
  itemDialog.data = {
    ...item,
    sysDictId: item?.sysDictId ?? params.sysDictId,
  };
  itemDialog.visible = true;
};

const dialogClose = () => {
  itemDialog.visible = false;
  itemDialog.mode = "save";
  itemDialog.data = {};
};

const handleItemDialogSuccess = () => {
  dialogClose();
  reloadTable();
};

const handlePropertySuccess = () => {
  reloadTable();
};
</script>

<template>
  <div class="dict-page system-container modern-bg">
    <SaveDialog
      v-model:visible="itemDialog.visible"
      :mode="itemDialog.mode"
      :item-data="itemDialog.data"
      :sys-dict-id="params.sysDictId"
      @success="handleItemDialogSuccess"
    />
    <SettingDialog ref="settingDialogRef" @success="handlePropertySuccess" />
    <el-container class="dict-container">
      <el-aside width="320px" class="dict-aside">
        <div class="aside-header">
          <div class="aside-title">
            <ScIcon class="aside-icon">
              <component :is="useRenderIcon('ri:book-2-line')" />
            </ScIcon>
            <span>字典分类</span>
          </div>
        </div>
        <div class="aside-body">
          <DictLayout :nodeClick="onClick" />
        </div>
      </el-aside>
      <el-main class="dict-main">
        <el-container>
          <el-header v-if="params.sysDictId" class="dict-header">
            <div class="toolbar-left" />
            <div class="toolbar-right">
              <ScButton
                v-auth="'dict:list'"
                size="small"
                title="刷新字典项"
                aria-label="刷新字典项"
                @click="reloadTable"
              >
                <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                刷新
              </ScButton>
              <ScButton
                v-auth="'dict:add'"
                type="primary"
                size="small"
                title="新增字典项"
                aria-label="新增字典项"
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
                  <span v-if="row.sysDictItemRemark">
                    {{ row.sysDictItemRemark }}
                  </span>
                  <span v-else class="null-value">NULL</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="操作" fixed="right" align="center">
                <template #default="{ row }">
                  <ScButton
                    v-auth="'dict:setting'"
                    class="btn-text"
                    :icon="useRenderIcon('ep:setting')"
                    title="配置字典项"
                    aria-label="配置字典项"
                    @click="handleSetting(row)"
                  />
                  <ScButton
                    v-auth="'dict:edit'"
                    class="btn-text"
                    :icon="useRenderIcon(EditPen)"
                    title="编辑字典项"
                    aria-label="编辑字典项"
                    @click="dialogOpen(row, 'edit')"
                  />
                  <ScPopconfirm
                    v-if="row.sysDictItemInSystem != 1"
                    :title="$t('message.confimDelete')"
                    @confirm="onDelete(row)"
                  >
                    <template #reference>
                      <ScButton
                        v-auth="'dict:delete'"
                        type="danger"
                        class="btn-text"
                        :icon="useRenderIcon(Delete)"
                        title="删除字典项"
                        aria-label="删除字典项"
                      />
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
  min-height: 0;
  background-color: transparent;
  overflow: hidden;
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
  min-height: 0;
  overflow: hidden;
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

.aside-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
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
