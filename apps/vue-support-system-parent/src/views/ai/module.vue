<template>
  <div>
    <el-drawer size="70%" v-model="env.visible" width="70%" :title="env.title" draggable :close-on-click-modal="false" @close="handleClose">
      <ScTable ref="tableRef" :url="fetchPageProjectForAiModule" :params="env.params" class="overflow-auto">
        <el-table-column prop="sysAiModuleName" label="模型名称" width="240px" fixed></el-table-column>
        <el-table-column prop="sysAiModuleRoleSetting" label="是否存在角色设置" width="180px">
          <template #default="scope">
            <el-segmented
              v-model="scope.row.sysAiModuleRoleSetting"
              :options="[
                { label: '启用', value: 0 },
                { label: '禁用', value: 1 },
              ]"
              @click="handleUpdate(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sysAiVincentSupportAsync" label="支持异步" width="160px">
          <template #default="scope">
            <el-segmented
              v-model="scope.row.sysAiVincentSupportAsync"
              :options="[
                { label: '启用', value: 0 },
                { label: '禁用', value: 1 },
              ]"
              @click="handleUpdate(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sysAiModuleStatus" label="是否启用" width="160px">
          <template #default="scope">
            <el-segmented
              v-model="scope.row.sysAiModuleStatus"
              :options="[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]"
              @click="handleUpdate(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sysAiModuleCode" label="模型编码" width="240px"></el-table-column>
        <el-table-column prop="sysAiModuleSort" label="排序"></el-table-column>
        <el-table-column prop="sysAiModuleVersion" label="版本"></el-table-column>
        <el-table-column prop="sysApiModuleManufacturersLabel" label="厂家代码" width="200px"></el-table-column>
        <el-table-column prop="sysAiModuleType" label="模型类型" width="120px"></el-table-column>
        <el-table-column prop="sysAiModuleRemark" label="说明" show-overflow-tooltip></el-table-column>

        <el-table-column label="操作" width="180px" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.sysAiModuleType === 'VINCENT'" @click="handleOpenSettingDialog(scope.row, 'edit')" :icon="useRenderIcon('ri:settings-2-fill')" class="btn-text"></el-button>
            <el-button @click="handleOpenEditDialog(scope.row, 'edit')" :icon="useRenderIcon('ep:edit')" class="btn-text"></el-button>
            <el-button @click="handleDelete(scope.row)" type="danger" :icon="useRenderIcon('ep:delete')" class="btn-text"></el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-drawer>
    <ModuleUpdateDialog ref="moduleUpdateDialogRef" @success="handleRefreshEnvironment" />
    <ModuleSettingUpdateDialog ref="moduleSettingUpdateDialogRef" />
  </div>
</template>
<script setup>
import { fetchDeleteProjectForAiModule, fetchPageProjectForAiModule, fetchUpdateProjectForAiModule } from "@/api/manage/project-ai-module";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineAsyncComponent, defineEmits, defineExpose, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
const ModuleUpdateDialog = defineAsyncComponent(() => import("./module-update.vue"));
const ModuleSettingUpdateDialog = defineAsyncComponent(() => import("./setting.vue"));
const tableRef = shallowRef();
const moduleUpdateDialogRef = shallowRef();
const moduleSettingUpdateDialogRef = shallowRef();
const { t } = useI18n();
const emit = defineEmits();
const env = reactive({
  visible: false,
  mode: "edit",
  title: "模块更新",
});

const handleDelete = async (item) => {
  fetchDeleteProjectForAiModule(item).then((res) => {
    message(t("message.deleteSuccess"), { type: "success" });
    tableRef.value.reload(env.params);
  });
};
const handleOpenEditDialog = async (item) => {
  moduleUpdateDialogRef.value.handleOpen(item, "edit");
};

const handleOpenSettingDialog = async (item) => {
  moduleSettingUpdateDialogRef.value.handleOpen(item, "edit");
};
const handleRefreshEnvironment = async () => {
  tableRef.value.reload(env.params);
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
  env.title = "模块管理 " + (item.sysProjectName ? " - " + item.sysProjectName : "");
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
