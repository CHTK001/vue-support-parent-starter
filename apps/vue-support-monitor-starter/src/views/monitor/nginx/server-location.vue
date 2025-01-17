<template>
  <div>
    <el-drawer v-model="visible" direction="ltr" :append-to-body="true" draggable :title="env.title" :close-on-click-modal="false" size="70%" @close="handleClose">
      <div>
        <ServerSaveItem ref="serverSaveRef" v-model="form" />
      </div>
      <div class="flex !justify-end">
        <el-button :icon="useRenderIcon('ri:save-3-line')" type="primary" @click="handleSaveOrUpdate">保存</el-button>
      </div>
      <el-divider>
        <template #default>Server配置</template>
      </el-divider>
      <el-row class="flex justify-end pb-3">
        <el-form :inline="true">
          <el-form-item label="名称">
            <el-input v-model="env.params.monitorNginxHttpServerLocationName" placeholder="输入搜索关键字" />
          </el-form-item>
        </el-form>
        <el-button type="primary" :icon="useRenderIcon('ep:search')" class="btn-text" @click="handleSearch" />
        <el-button :icon="useRenderIcon('ep:plus')" class="btn-text" @click="handleNewLocationSave" />
      </el-row>
      <ScTable ref="tableRef" border :url="fetchPageNginxHttpServerLocationConfig" :params="env.params" :columns="env.httpColumns" :search="false">
        <template #opt="{ row }">
          <el-button :icon="useRenderIcon('ep:edit')" class="btn-text" @click="handleNewLocationSave(row)" />
        </template>
      </ScTable>
    </el-drawer>

    <ServerSaveLocation ref="serverSaveLocationRef" />
  </div>
</template>

<script setup>
import { fetchPageNginxHttpServerLocationConfig } from "@/api/monitor/nginx-http-server-location";
import { fetchSaveOrUpdateNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, defineEmits, defineExpose, reactive, ref } from "vue";
import { message } from "@repo/utils";
const ServerSaveItem = defineAsyncComponent(() => import("./save/server-save-item.vue"));
const ServerSaveLocation = defineAsyncComponent(() => import("./save/server-save-location.vue"));
const emit = defineEmits(["update:modelValue"]);

const tableRef = ref();
const serverSaveLocationRef = ref();
const serverSaveRef = ref();
const form = reactive({});
const data = reactive({
  nginxHttpData: {}
});
const visible = ref(false);
const env = reactive({
  params: {
    monitorNginxHttpServerLocationName: null
  },
  httpColumns: [
    {
      label: "路径",
      prop: "monitorNginxHttpServerLocationName",
      align: "left"
    },
    {
      label: "代理",
      prop: "monitorNginxHttpServerLocationAlias",
      align: "left",
      formatter: row => {
        return row.monitorNginxHttpServerLocationAlias || row.monitorNginxHttpServerLocationProxyPass || "-";
      }
    },
    {
      label: "操作",
      prop: "opt",
      width: 100,
      fixed: "right"
    }
  ]
});
const handleSaveOrUpdate = async () => {
  fetchSaveOrUpdateNginxHttpServerConfig(serverSaveRef.value.getValue()).then(res => {
    if (res.code === "00000") {
      message("更新成功", { type: "success" });
      emit("success");

      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleNginxConfigHttpServerLocation = async () => {
  setTimeout(async () => {
    const res = await fetchPageNginxHttpServerLocationConfig({ monitorNginxHttpServerId: form.monitorNginxHttpServerId });
    env.params = { monitorNginxHttpServerId: form.monitorNginxHttpServerId };
    tableRef.value.reload(env.params);
  }, 100);
};

const handleNewLocationSave = async row => {
  serverSaveLocationRef.value.handleOpen(row);
};
const handleSearch = async () => {
  tableRef.value.reload(env.params);
};
const handleClose = async () => {
  visible.value = false;
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  env.title = data.monitorNginxHttpServerName;
  Object.assign(form, data);
  serverSaveRef.value.reload(form);
  await handleNginxConfigHttpServerLocation();
};

defineExpose({
  handleOpen
});
</script>
