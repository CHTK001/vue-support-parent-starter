<script setup>
import { fetchPageServiceModule, fetchUpdateServiceModule } from "@/api/service/module";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineAsyncComponent, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const env = reactive({
  params: {},
});

const loadData = () => {
  tableRef.value.reload(env.params);
};

const handleEdit = async (row, mode) => {
  saveDialogRef.value.handleOpen(row, mode);
};
const handleUpdate = async (row) => {
  fetchUpdateServiceModule(row).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
  });
};
</script>
<template>
  <div class="fullscreen p-2">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <el-header>
      <div class="left-panel">
        <el-form :inline="true">
          <el-form-item label="模块名称">
            <el-input clearable v-model="env.params.sysServiceModuleName" placeholder="请输入模块名称"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="right-panel">
        <el-button :icon="useRenderIcon('ep:search')" @click="debounce(loadData(), 0, 1000)" type="primary" />
        <el-button :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
      </div>
    </el-header>
    <ScTable ref="tableRef" :url="fetchPageServiceModule" :params="env.params">
      <el-table-column type="index" label="序号" width="120px" />
      <el-table-column label="模块名称" prop="sysServiceModuleName">
        <template #default="{ row }">
          <div class="flex justify-between gap-1">
            <span
              >{{ row.sysServiceModuleName }}
              <span>{{ row.sysServiceModuleVersion }}</span>
            </span>
            <span class="el-form-item-msg">{{ row.sysServiceModuleCode }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="是否启用">
        <template #default="{ row }">
          <el-segmented
            v-model="row.sysServiceModuleStatus"
            :options="[
              {
                label: '启用',
                value: 0,
              },
              {
                label: '禁用',
                value: 1,
              },
            ]"
            @change="handleUpdate(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="类型">
        <template #default="{ row }">
          <el-tag type="primary" v-if="row.sysServiceModuleType === 'API'">接口</el-tag>
          <el-tag type="warning" v-else>服务</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button :icon="useRenderIcon('ep:edit-pen')" @click="handleEdit(row, 'edit')"></el-button>
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
