<script setup>
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components";
import { message } from "@repo/utils";
import { defineAsyncComponent, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const form = reactive({});

const loadData = () => {
  tableRef.value.reload(form);
};

const handleEdit = async (row, mode) => {
  saveDialogRef.value.handleOpen(row, mode);
};
const handleUpdate = async (row) => {
  fetchUpdateServiceModule(row).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
  });
};
const handleDelete = async (row) => {
  fetchUpdateServiceModule(row).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
    loadData();
  });
};
</script>
<template>
  <div class="fullscreen p-2">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <ScHeader>
      <div class="left-panel">
        <ScForm :inline="true">
          <ScFormItem label="模块名称">
            <ScInput clearable v-model="env.params.sysServiceModuleName" placeholder="请输入模块名称"></ScInput>
          </ScFormItem>
        </ScForm>
      </div>
      <div class="right-panel">
        <ScButton :icon="useRenderIcon('ep:search')" @click="debounce(loadData(), 0, 1000)" type="primary" />
        <ScButton :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
      </div>
    </ScHeader>
    <ScTable ref="tableRef" :url="fetchPageServiceModule" :params="env.params">
      <ScTableColumn type="index" label="序号" width="120px" />
      <ScTableColumn label="操作">
        <template #default="{ row }">
          <ScButton :icon="useRenderIcon('ep:edit-pen')" class="btn-text" @click="handleEdit(row, 'edit')"></ScButton>
          <ScButton :icon="useRenderIcon('ep:delete')" type="danger" class="btn-text" @click="handleDelete(row)"></ScButton>
        </template>
      </ScTableColumn>
    </ScTable>
  </div>
</template>
