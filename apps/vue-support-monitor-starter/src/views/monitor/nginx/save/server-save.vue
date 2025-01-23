<template>
  <div>
    <el-dialog v-model="visible" width="80%" title="新增[server]" draggable :close-on-click-modal="false" :modal-append-to-body="false" @close="handleClose">
      <div class="!h-[500px] overflow-y-auto p-[20px]">
        <ServerSaveItem v-model="form" ref="serverSaveItemRef" />
      </div>
      <template v-if="env.mode === 'add'" #footer>
        <div>
          <el-button @click="handleClose">关闭</el-button>
          <el-button :icon="useRenderIcon('ri:save-3-line')" type="primary" @click="handleSaveOrUpdate">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchSaveOrUpdateNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineAsyncComponent, defineEmits, defineExpose, reactive, ref } from "vue";
const emit = defineEmits(["update:modelValue"]);

const ServerSaveItem = defineAsyncComponent(() => import("./server-save-item.vue"));

const serverSaveItemRef = ref();
const visible = ref(false);
const form = reactive({});
const env = reactive({
  mode: "add",
});
const handleSaveOrUpdate = async () => {
  fetchSaveOrUpdateNginxHttpServerConfig(serverSaveItemRef.value.getValue()).then((res) => {
    if (res.code === "00000") {
      message("更新成功", { type: "success" });
      emit("success");

      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleClose = async () => {
  visible.value = false;
};

const handleOpen = async (mode, form1, data) => {
  visible.value = true;
  env.mode = mode;
  Object.assign(form, form1);
  form.monitorNginxHttpId = data.monitorNginxHttpId;
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
