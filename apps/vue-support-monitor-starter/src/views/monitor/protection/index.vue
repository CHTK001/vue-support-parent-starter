<script setup>
import { fetchProtectionDelete, fetchProtectionPageList } from "@/api/monitor/protection";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, shallowRef, reactive } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const form = reactive({});
const handleEdit = async (row, mode) => {
  saveDialogRef.value.handleOpen(row, mode);
};

const handleDelete = async (row) => {
  fetchProtectionDelete(row).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
    loadData();
  });
};
const loadData = () => {
  tableRef.value.reload(form);
};
</script>
<template>
  <div>
    <SaveDialog ref="saveDialogRef" @success="loadData" />

    <el-header>
      <div class="left-panel">
        <el-form :model="form">
          <el-form-item label="状态">
            <el-select v-model="form.monitorProtectionStatus" clearable clear-icon class="!w-[150px]">
              <el-option label="全部" value=""></el-option>
              <el-option label="启用" :value="0"></el-option>
              <el-option label="禁用" :value="1"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <div class="right-panel">
        <el-button :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
        <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="loadData" />
      </div>
    </el-header>
    <ScTable :url="fetchProtectionPageList" :params="form" ref="tableRef">
      <el-table-column label="名称" prop="monitorProtectionName" />
      <el-table-column label="状态" prop="monitorProtectionStatus">
        <template #default="{ row }">
          <el-tag :type="row.monitorProtectionStatus === 0 ? 'success' : 'danger'">{{ row.monitorProtectionStatus === 0 ? "启用" : "禁用" }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="监听端口" prop="monitorProtectionPid" />
      <el-table-column label="启动脚本" prop="monitorProtectionShell" />
      <el-table-column label="备注" prop="monitorProtectionRemark" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button :icon="useRenderIcon('ep:edit-pen')" class="btn-text" @click="handleEdit(row, 'edit')"></el-button>
          <el-button :icon="useRenderIcon('ep:delete')" type="danger" class="btn-text" @click="handleDelete(row)"></el-button>
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
