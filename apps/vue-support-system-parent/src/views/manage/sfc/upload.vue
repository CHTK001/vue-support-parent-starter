<template>
  <div>
    <el-dialog v-model="visible" :title="title" draggable @close="onClose">
      <el-upload class="upload-demo" drag action="#" accept=".vue" :auto-upload="false" @change="handleChange">
        <el-icon class="el-icon--upload">
          <component :is="useRenderIcon('ep:upload')" />
        </el-icon>
        <div class="el-upload__text">
          将文件拖到此处或
          <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">大小不超过 500KB 的 .vue 文件</div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchUploadSfc } from "@/api/manage/sfc";
import { ref, defineEmits, defineExpose, reactive } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks.ts";
import { message } from "@repo/utils";
const emit = defineEmits(["close"]);
const title = ref("");
const uploadRef = ref();
const visible = ref(false);
const dataReact = reactive({
  data: {}
});
const remote = ref();

const handleChange = async raw => {
  fetchUploadSfc(raw.raw, dataReact.data).then(res => {
    message(res?.code === "00000" ? "上传成功" : res?.message, { type: res?.code === "00000" ? "success" : "error" });
    if (res?.code === "00000") {
      onClose();
    }
  });
};
/**
 * 关闭弹窗
 */
const onClose = async () => {
  emit("close");
  visible.value = false;
};
const setData = async data => {
  Object.assign(dataReact.data, data);
  title.value = dataReact.data.sysSfcChineseName + "[上传组件]";
};

const open = async () => {
  visible.value = true;
};

defineExpose({
  setData,
  open
});
</script>
