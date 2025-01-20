<template>
  <div>
    <el-dialog v-model="visible" title="导入列表v1.10.0" draggable size="30%">
      <ScTableSelect
        ref="scTableSelectRef"
        :key="form"
        class="w-full"
        remoteParameterName="monitorNginxHttpServerLocationName"
        :keywords="keywords"
        :multiple="true"
        :url="fetchPageImportNginxHttpServerLocationConfig"
        :columns="env.columns"
        @selectionChange="handleSelectionChange"
      >
        <template #toolbar>
          <el-form :inline="true">
            <el-form-item label="路径名称">
              <el-input v-model="condition.monitorNginxHttpServerLocationName" placeholder="请输入路径名称" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="handleSearchSelect(condition)" />
              <el-button type="primary" :icon="useRenderIcon('bi:database-add')" @click="handleSearchSelected" />
            </el-form-item>
          </el-form>
        </template>
      </ScTableSelect>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchPageImportNginxHttpServerLocationConfig } from "@/api/monitor/nginx-http-server-location";
import { ref, defineAsyncComponent, onMounted, defineEmits, reactive } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const ScTableSelect = defineAsyncComponent(() => import("@repo/components/ScTableSelect/index.vue"));

const scTableSelectRef = ref(false);
const visible = ref(false);
const form = reactive({});
const condition = reactive({});
const emit = defineEmits(["selectionChange"]);
const keywords = reactive({
  label: "monitorNginxHttpServerLocationName",
  value: "monitorNginxHttpServerLocationId"
});
const env = reactive({
  columns: [
    {
      prop: "monitorNginxHttpServerLocationName",
      label: "路径"
    },
    {
      prop: "monitorNginxHttpServerLocationAlias",
      label: "别名"
    },
    {
      prop: "monitorNginxHttpServerLocationProxyPass",
      label: "代理"
    }
  ]
});

const handleSearchSelect = async () => {
  scTableSelectRef.value.reload(condition);
};

const selected = ref([]);
const selectedIds = ref([]);

const handleSearchSelected = async (rows, ids) => {
  emit("selectionSelected", selected.value, selectedIds.value);
};
const handleSelectionChange = async (rows, ids) => {
  selected.value = rows;
  selectedIds.value = ids;
  emit("selectionChange", rows, ids);
};
const handleClose = async () => {
  visible.value = false;
  scTableSelectRef.value.handleClose();
};

const handleOpen = async data => {
  visible.value = true;
  Object.assign(form, data);
};

defineExpose({
  handleOpen,
  handleClose
});
</script>
