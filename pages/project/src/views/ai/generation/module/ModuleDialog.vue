<template>
  <sc-drawer
    size="70%"
    v-model="env.visible"
    width="70%"
    :title="env.title"
    draggable
    :close-on-click-modal="false"
    @close="handleClose"
    class="drawer-custom"
  >
    <el-header v-if="env.params.sysProjectId" class="drawer-header">
      <div class="panel-right">
        <ScButton 
          @click="handleOpenEditDialog({}, 'save')"
          title="新增"
          :icon="useRenderIcon('ep:plus')"
          class="btn-text btn-add"
        ></ScButton>
      </div>
    </el-header>
    <ScTable
      ref="tableRef"
      :url="fetchPageProjectForAiModule"
      :params="env.params"
      class="overflow-auto table-custom"
    >
      <!-- 表格列 -->
      <ScTableColumn 
        prop="sysAiModuleName"
        label="模型名称"
        width="300px"
        fixed
        align="center"
      >
        <template #default="{ row }">
          <div class="flex flex-col">
            <ScTag 
              type="primary"
              :class="{ 'tag-custom': true, 'font-bold': row.sysAiModuleName }"
              >{{ row.sysAiModuleName || "-" }}</el-tag
            >
          </div>
        </template>
      </ScTableColumn>
      <!-- 其他表格列 -->
      <ScTableColumn 
        prop="sysAiModuleCode"
        label="模型编码"
        width="240px"
        align="center"
      >
        <template #default="{ row }">
          <div>
            <p>
              <ScTooltip 
                :content="`编码:${row.sysAiModuleCode || '-'}`"
                placement="top"
              >
                <span
                  :class="{
                    'font-bold': row.sysAiModuleCode,
                    'max-w-[200px]': true,
                    'overflow-hidden': true,
                    'text-ellipsis': true,
                    'whitespace-nowrap': true,
                    'inline-block': true,
                  }"
                  >模型编码:{{ row.sysAiModuleCode || "-" }}
                </span>
              </ScTooltip>
            </p>
            <p v-if="row.sysAiModuleType == 'LLM'">
              <span>图片解析: </span>
              <ScTag :type="row.sysAiModuleVlm == 1 ? 'success' : 'warning'">
                {{
                  row.sysAiModuleVlm == 0 ? "不支持图片解析" : "支持图片解析"
                }}
              </ScTag>
            </p>
          </div>
        </template>
      </ScTableColumn>
      <ScTableColumn label="支持尺寸" width="220px" align="center">
        <template #default="{ row }">
          <div class="flex flex-wrap">
            <ScTag 
              type="success"
              v-for="item in row.vincentSetting?.sysAiVincentSupportedSize?.split(
                ','
              )"
              :key="item"
              style="margin: 2px"
              >{{ item }}</el-tag
            >
          </div>
        </template>
      </ScTableColumn>
      <ScTableColumn prop="sysAiModuleSort" label="排序" align="center">
        <template #default="{ row }">
          <ScTag size="small"> {{ row.sysAiModuleSort || 0 }}</ScTag>
        </template>
      </ScTableColumn>
      <ScTableColumn prop="sysAiModuleVersion" label="版本" align="center">
        <template #default="{ row }">
          <span
            :class="{
              'no-data': !row.sysAiModuleVersion,
              'font-bold': row.sysAiModuleVersion,
            }"
          >
            {{ row.sysAiModuleVersion || "暂无" }}</span
          >
        </template>
      </ScTableColumn>
      <ScTableColumn 
        prop="sysApiModuleManufacturersLabel"
        label="厂家代码"
        width="200px"
        align="center"
      >
        <template #default="{ row }">
          <span
            :class="{
              'no-data': !row.sysApiModuleManufacturersLabel,
              'font-bold': row.sysApiModuleManufacturersLabel,
            }"
          >
            {{ row.sysApiModuleManufacturersLabel || "暂无" }}</span
          >
        </template>
      </ScTableColumn>
      <ScTableColumn 
        prop="sysAiModuleType"
        label="模型类型"
        width="160px"
        align="center"
      >
        <template #default="{ row }">
          <span
            :class="{
              'no-data': !row.sysAiModuleType,
              'font-bold': row.sysAiModuleType,
            }"
          >
            {{ row.sysAiModuleType || "暂无" }}</span
          >
        </template>
      </ScTableColumn>
      <ScTableColumn 
        prop="sysAiModuleRemark"
        label="说明"
        show-overflow-tooltip
        align="center"
        width="220px"
      >
        <template #default="{ row }">
          <span
            :class="{
              'no-data': !row.sysAiModuleRemark,
              'font-bold': row.sysAiModuleRemark,
            }"
          >
            {{ row.sysAiModuleRemark || "暂无" }}</span
          >
        </template>
      </ScTableColumn>
      <ScTableColumn 
        prop="sysAiModuleRoleSetting"
        label="是否存在角色设置"
        width="180px"
        align="center"
      >
        <template #default="scope">
          <el-segmented
            v-model="scope.row.sysAiModuleRoleSetting"
            :options="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
            @click="handleUpdate(scope.row)"
            class="segmented-custom"
          />
        </template>
      </ScTableColumn>
      <ScTableColumn 
        prop="sysAiModuleStatus"
        label="是否启用"
        width="160px"
        align="center"
      >
        <template #default="scope">
          <el-segmented
            v-model="scope.row.sysAiModuleStatus"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
            @click="handleUpdate(scope.row)"
            class="segmented-custom"
          />
        </template>
      </ScTableColumn>
      <ScTableColumn label="操作" width="220px" fixed="right">
        <template #default="scope">
          <ScRow class="justify-end">
            <ScButton 
              v-if="scope.row.sysAiModuleType === 'VIDEO'"
              title="文生视频模型设置"
              @click="handleOpenVideoSettingDialog(scope.row, 'edit')"
              :icon="useRenderIcon('ri:settings-2-fill')"
              class="btn-text btn-operation"
            ></ScButton>
            <ScButton 
              v-if="scope.row.sysAiModuleType === 'VINCENT'"
              title="文生图模型设置"
              @click="handleOpenSettingDialog(scope.row, 'edit')"
              :icon="useRenderIcon('ri:settings-2-fill')"
              class="btn-text btn-operation"
            ></ScButton>
            <ScButton 
              v-if="scope.row.sysAiModuleType === 'RESOLUTION'"
              title="超分辨率模型设置"
              @click="handleOpenResolutionSettingDialog(scope.row, 'edit')"
              :icon="useRenderIcon('ri:settings-2-fill')"
              class="btn-text btn-operation"
            ></ScButton>
            <ScButton 
              v-if="scope.row.sysAiModuleType === 'VINCENT'"
              title="文生图模板设置"
              @click="handleOpenTemplateDialog(scope.row, 'edit')"
              :icon="useRenderIcon('ri:menu-add-line')"
              class="btn-text btn-operation"
            ></ScButton>
            <ScButton 
              v-if="scope.row.sysAiModuleType === 'VINCENT'"
              title="文生图样式设置"
              @click="handleEditStyle(scope.row, 'edit')"
              :icon="useRenderIcon('bi:border-style')"
              class="btn-text btn-operation"
            ></ScButton>
          </ScRow>
          <ScRow class="pt-1 justify-end">
            <ScButton 
              @click="handleOpenEditDialog(scope.row, 'edit')"
              title="编辑"
              :icon="useRenderIcon('ep:edit')"
              class="btn-text btn-operation"
            ></ScButton>
            <ScButton 
              @click="handleCopy(scope.row, 'add')"
              title="复制"
              :icon="useRenderIcon('ep:copy-document')"
              class="btn-text btn-operation"
            ></ScButton>
            <ScButton 
              @click="handleDelete(scope.row)"
              type="danger"
              title="删除"
              :icon="useRenderIcon('ep:delete')"
              class="btn-text btn-operation btn-delete"
            ></ScButton>
          </ScRow>
        </template>
      </ScTableColumn>
    </ScTable>
  </sc-drawer>
  <!-- 弹窗组件 -->
  <ModuleUpdateDialog
    ref="moduleUpdateDialogRef"
    @success="handleRefreshEnvironment"
  />
  <ModuleVideoSettingUpdateDialog ref="moduleVideoSettingUpdateDialogRef" />
  <ModuleResolutionSettingUpdateDialog
    ref="moduleResolutionSettingUpdateDialogRef"
  />
  <ModuleSettingUpdateDialog
    ref="moduleSettingUpdateDialogRef"
    @success="handleRefreshEnvironment"
  />
  <ModuleTemplateUpdateDialog
    ref="moduleTemplateUpdateDialogRef"
    @success="handleRefreshEnvironmentTemplate"
  />
  <StyleLayout ref="styleLayoutRef" @success="loadConfig" :data="env.item" />
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineAsyncComponent, defineExpose, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import {
  fetchDeleteProjectForAiModule,
  fetchPageProjectForAiModule,
  fetchUpdateProjectForAiModule,
} from "../../../../api/manage/project-ai-module";

const ModuleUpdateDialog = defineAsyncComponent(
  () => import("./ModuleUpdateDialog.vue")
);
const ModuleResolutionSettingUpdateDialog = defineAsyncComponent(
  () => import("../../resolution-setting.vue")
);
const ModuleVideoSettingUpdateDialog = defineAsyncComponent(
  () => import("../../vincent-video-setting.vue")
);
const ModuleSettingUpdateDialog = defineAsyncComponent(
  () => import("../../vincent-setting.vue")
);
const ModuleTemplateUpdateDialog = defineAsyncComponent(
  () => import("../../vincent-template.vue")
);
const StyleLayout = defineAsyncComponent(
  () => import("../../vincent-style.vue")
);

const styleLayoutRef = shallowRef();
const tableRef = shallowRef();
const moduleUpdateDialogRef = shallowRef();
const moduleVideoSettingUpdateDialogRef = shallowRef();
const moduleResolutionSettingUpdateDialogRef = shallowRef();
const moduleSettingUpdateDialogRef = shallowRef();
const moduleTemplateUpdateDialogRef = shallowRef();

const { t } = useI18n();
const emit = defineEmits();

const env = reactive({
  visible: false,
  mode: "edit",
  title: "模块更新",
});

const handleEditStyle = async (item) => {
  styleLayoutRef.value.handleOpen(item);
};

const handleDelete = async (item) => {
  fetchDeleteProjectForAiModule(item).then((res) => {
    message(t("message.deleteSuccess"), { type: "success" });
    tableRef.value.reload(env.params);
  });
};

const handleOpenEditDialog = async (item, mode) => {
  if (!item.sysProjectId) {
    item.sysProjectId = env.params.sysProjectId;
  }
  moduleUpdateDialogRef.value.handleOpen(item, mode);
};

const handleCopy = async (item) => {
  delete item.sysAiModuleId;
  moduleUpdateDialogRef.value.handleOpen(item, "add");
};

const handleOpenSettingDialog = async (item) => {
  moduleSettingUpdateDialogRef.value.handleOpen(item, "edit");
};

const handleOpenResolutionSettingDialog = async (item) => {
  moduleResolutionSettingUpdateDialogRef.value.handleOpen(item, "edit");
};

const handleOpenVideoSettingDialog = async (item) => {
  moduleVideoSettingUpdateDialogRef.value.handleOpen(item, "edit");
};

const handleOpenTemplateDialog = async (item) => {
  moduleTemplateUpdateDialogRef.value.handleOpen(item, "edit");
};

const handleRefreshEnvironment = async () => {
  tableRef.value.reload(env.params);
  emit("success");
};

const handleRefreshEnvironmentTemplate = async () => {
  emit("handleRefreshEnvironmentTemplate");
};

const handleUpdate = async (item) => {
  fetchUpdateProjectForAiModule(item).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
  });
};

const manufacturers = shallowRef([]);

const initialManufacturers = async () => {
  fetchListDictItem({
    sysDictId: 1,
  }).then((res) => {
    manufacturers.value = res?.data;
  });
};

const handleClose = () => {
  env.visible = false;
};

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.title =
    "模块管理 " + (item.sysProjectName ? " - " + item.sysProjectName : "");
  env.params = {
    sysProjectId: item.sysProjectId,
    sysAiModuleType: item.sysAiModuleType,
  };
  env.mode = mode;
  initialManufacturers();
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>

<style scoped lang="scss">
:deep(.el-drawer) {
  border-radius: 20px 0 0 20px;
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.15);

  .el-drawer__header {
    padding: 24px 28px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-drawer__title {
      font-size: 20px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .el-drawer__body {
    padding: 0;
    background: linear-gradient(
      180deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-lighter) 100%
    );
  }
}

.drawer-header {
  background: linear-gradient(
    135deg,
    var(--el-bg-color-overlay) 0%,
    var(--el-fill-color-lighter) 100%
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
}

.btn-add {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
  }
}

.table-custom {
  background-color: var(--el-bg-color);
  border-radius: 0;
  overflow: hidden;
}

:deep(.el-table) {
  th {
    background: linear-gradient(
      180deg,
      var(--el-fill-color-light) 0%,
      var(--el-fill-color-lighter) 100%
    ) !important;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .el-table__row {
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(
        90deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-bg-color) 100%
      ) !important;
    }
  }
}

.tag-custom {
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 500;
}

:deep(.el-segmented) {
  border-radius: 10px;

  .el-segmented__item {
    border-radius: 8px;
    transition: all 0.3s ease;
    font-weight: 500;

    &.is-selected {
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

.btn-operation {
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.btn-delete:hover {
  box-shadow: 0 4px 12px rgba(var(--el-color-danger-rgb), 0.3);
}

.no-data {
  color: var(--el-text-color-placeholder);
  font-size: 0.85em;
  font-style: italic;
}

:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 500;
}
</style>
