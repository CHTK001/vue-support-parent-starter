<template>
  <div>
    <el-dialog v-model="visible" draggable :title="props.title" :close-on-click-modal="false" @close="handleClose">
      <el-progress :percentage="percentage" :format="format" :indeterminate="true" :stroke-width="15" striped striped-flow />
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, defineOptions, defineEmits } from "vue";
import { useConfigStore } from "@repo/core";
import { message } from "@repo/utils";
const emit = defineEmits(["event"]);
const socket = ref();
const visible = ref();
const percentage = ref(0);
const msg = ref("");
const props = defineProps({
  eventName: {
    type: String,
    default: ""
  },
  title: {
    type: String,
    default: "处理进度"
  },
  finishClose: {
    type: Boolean,
    default: true
  }
});
const format = percentage => `${msg.value} ${percentage}%`;

const handleEvent = async data => {
  try {
    const item = JSON.parse(data?.data);
    msg.value = item.msg;
    percentage.value = parseFloat((item.step / item.total) * 100).toFixed(2);
    if (item.step === item.total) {
      emit("finish");
      if (finishClose.value) {
        handleClose();
      } else {
        msg.value = "处理完成";
      }
    }
  } catch (error) {}
};

const handleClose = async => {
  socket.value?.off(props.eventName);
  visible.value = false;
  percentage.value = 0;
};
const handleOpen = async => {
  visible.value = true;
  socket.value?.off(props.eventName);
  socket.value = useConfigStore()?.socket;
  if (null == socket.value) {
    message("未开启socket", { type: "error" });
  }
  socket.value?.on(props.eventName, handleEvent);
  percentage.value = 0;
};

defineExpose({
  handleOpen,
  handleClose
});
</script>
